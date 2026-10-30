import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import mongoose from "mongoose";

const legacyPath = new URL("../src/data/paper-models.json", import.meta.url);
const assignmentsPath = new URL("../src/data/paper-model-assignments.json", import.meta.url);
const arabicDigits = (value) => String(value).replace(/\d/g, (digit) => "٠١٢٣٤٥٦٧٨٩"[Number(digit)]);
const normalize = (value) => String(value ?? "").normalize("NFKC").replace(/\s+/g, " ").trim();
const contentKey = (question) => createHash("sha256")
  .update([
    question.questionType || question.category || "",
    normalize(question.text),
    (Array.isArray(question.options) ? question.options : []).map(normalize).join("\u001f"),
  ].join("\u001e"))
  .digest("hex");

function validQuestion(question) {
  return (
    (question.category === "verbal" || question.category === "quantitative") &&
    typeof question.text === "string" &&
    question.text.trim().length > 0 &&
    Array.isArray(question.options) &&
    question.options.length >= 2 &&
    Number.isSafeInteger(question.correctOptionIndex) &&
    question.correctOptionIndex >= 0 &&
    question.correctOptionIndex < question.options.length
  );
}

function splitCount(total, sectionIndex) {
  return Math.floor(total / 5) + (sectionIndex < total % 5 ? 1 : 0);
}

function takeInSectionOrder(verbal, quantitative, verbalCount, quantitativeCount) {
  const ordered = [];
  let verbalIndex = 0;
  let quantitativeIndex = 0;

  for (let sectionIndex = 0; sectionIndex < 5; sectionIndex++) {
    const sectionVerbalCount = splitCount(verbalCount, sectionIndex);
    const sectionQuantitativeCount = splitCount(quantitativeCount, sectionIndex);
    const sectionItems = [];
    for (let index = 0; index < sectionVerbalCount; index++) {
      sectionItems.push(verbal[verbalIndex++]);
    }
    for (let index = 0; index < sectionQuantitativeCount; index++) {
      sectionItems.push(quantitative[quantitativeIndex++]);
    }

    const verbalItems = sectionItems.filter((question) => question.category === "verbal");
    const quantitativeItems = sectionItems.filter((question) => question.category === "quantitative");
    const sectionOrder = [];
    for (let index = 0; index < Math.max(verbalItems.length, quantitativeItems.length); index++) {
      if (verbalItems[index]) sectionOrder.push(verbalItems[index]);
      if (quantitativeItems[index]) sectionOrder.push(quantitativeItems[index]);
    }
    ordered.push(...sectionOrder);
  }

  return ordered;
}

const questionSchema = new mongoose.Schema({
  category: String,
  text: String,
  options: [String],
  correctOptionIndex: Number,
  answerStatus: String,
}, { strict: false, autoIndex: false, collection: "questions" });
const Question = mongoose.models.PaperModelAssignmentSource
  || mongoose.model("PaperModelAssignmentSource", questionSchema, "questions");

async function main() {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is required; no assignment file was written");
  }

  const legacyData = JSON.parse(readFileSync(legacyPath, "utf8"));
  if (!Array.isArray(legacyData.models) || legacyData.models.length !== 30) {
    throw new Error("Expected exactly 30 legacy paper models; refusing to generate assignments");
  }

  const manifest = existsSync(assignmentsPath)
    ? JSON.parse(readFileSync(assignmentsPath, "utf8"))
    : { version: 1, models: [] };
  if (manifest.version !== 1 || !Array.isArray(manifest.models)) {
    throw new Error("Paper model assignment manifest has an unsupported format");
  }
  for (const model of manifest.models) {
    const name = String(model.name || "");
    const isPartial = Number(model.totalQuestions) < 120;
    model.isPartial = isPartial;
    if (isPartial && !name.includes("مجموعة جزئية")) {
      model.name = `${name} — مجموعة جزئية`;
    }
  }

  const legacyContentKeys = new Set();
  for (const model of legacyData.models) {
    for (const question of model.allQuestions || []) {
      legacyContentKeys.add(contentKey(question));
    }
  }

  const existingQuestionIds = new Set(
    manifest.models.flatMap((model) => Array.isArray(model.questionIds) ? model.questionIds.map(String) : []),
  );
  const existingModelNumbers = new Set(manifest.models.map((model) => Number(model.modelNumber)));
  const allModels = [...legacyData.models, ...manifest.models];
  let nextModelNumber = Math.max(30, ...allModels.map((model) => Number(model.modelNumber) || 0)) + 1;

  await mongoose.connect(process.env.MONGODB_URI, {
    autoIndex: false,
    serverSelectionTimeoutMS: 15000,
  });

  const sourceQuestions = await Question.find({
    answerStatus: "approved",
    category: { $in: ["verbal", "quantitative"] },
  }).select({
    _id: 1,
    category: 1,
    text: 1,
    options: 1,
    correctOptionIndex: 1,
    answerStatus: 1,
  }).sort({ _id: 1 }).lean();

  const candidates = { verbal: [], quantitative: [] };
  const seenContentKeys = new Set();
  let invalidCount = 0;
  let legacyDuplicateCount = 0;
  let existingAssignmentCount = 0;
  let sourceDuplicateCount = 0;

  for (const question of sourceQuestions) {
    const id = String(question._id);
    if (existingQuestionIds.has(id)) {
      existingAssignmentCount++;
      continue;
    }
    if (!validQuestion(question)) {
      invalidCount++;
      continue;
    }
    const key = contentKey(question);
    if (legacyContentKeys.has(key)) {
      legacyDuplicateCount++;
      continue;
    }
    if (seenContentKeys.has(key)) {
      sourceDuplicateCount++;
      continue;
    }
    seenContentKeys.add(key);
    candidates[question.category].push(question);
  }

  const addModel = (verbalCount, quantitativeCount, typeName) => {
    const verbal = candidates.verbal.splice(0, verbalCount);
    const quantitative = candidates.quantitative.splice(0, quantitativeCount);
    const ordered = takeInSectionOrder(verbal, quantitative, verbal.length, quantitative.length);
    if (!ordered.length) return;

    while (existingModelNumbers.has(nextModelNumber)) nextModelNumber++;
    const totalQuestions = ordered.length;
    manifest.models.push({
      modelNumber: nextModelNumber,
      name: `النموذج الورقي ${arabicDigits(nextModelNumber)}${totalQuestions < 120 ? " — مجموعة جزئية" : ""} — ${typeName}`,
      totalQuestions,
      isPartial: totalQuestions < 120,
      verbalCount: verbal.length,
      quantitativeCount: quantitative.length,
      trialVerbalCount: 0,
      trialQuantCount: 0,
      timeLimitMinutes: Math.min(120, Math.max(30, totalQuestions)),
      questionIds: ordered.map((question) => String(question._id)),
    });
    existingModelNumbers.add(nextModelNumber);
    nextModelNumber++;
  };

  while (candidates.verbal.length >= 65 && candidates.quantitative.length >= 55) {
    addModel(65, 55, "كمي ولفظي");
  }
  while (candidates.verbal.length > 0 && candidates.quantitative.length > 0) {
    addModel(
      Math.min(65, candidates.verbal.length),
      Math.min(55, candidates.quantitative.length),
      "كمي ولفظي",
    );
  }
  while (candidates.verbal.length > 0) {
    addModel(Math.min(120, candidates.verbal.length), 0, "لفظي");
  }
  while (candidates.quantitative.length > 0) {
    addModel(0, Math.min(120, candidates.quantitative.length), "كمي");
  }

  writeFileSync(assignmentsPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  const addedModels = manifest.models.length - allModels.filter((model) => Number(model.modelNumber) > 30).length;
  const addedQuestions = manifest.models.reduce((sum, model) => sum + model.questionIds.length, 0);
  console.log(JSON.stringify({
    legacyModelsPreserved: legacyData.models.length,
    newModelsAppended: addedModels,
    assignedApprovedQuestions: addedQuestions,
    remainingVerbal: candidates.verbal.length,
    remainingQuantitative: candidates.quantitative.length,
    excludedLegacyDuplicates: legacyDuplicateCount,
    excludedSourceDuplicates: sourceDuplicateCount,
    excludedInvalidQuestions: invalidCount,
    alreadyAssigned: existingAssignmentCount,
    manifestBytes: Buffer.byteLength(readFileSync(assignmentsPath)),
  }, null, 2));
}

main()
  .catch((error) => {
    console.error("Paper model assignment generation failed:", error?.name || "Error", error?.code || "no-code");
    process.exitCode = 1;
  })
  .finally(async () => {
    if (mongoose.connection.readyState) {
      await mongoose.disconnect().catch(() => undefined);
    }
  });
