import { connectToMongoDB, disconnectFromMongoDB } from "../../artifacts/api-server/src/mongodb/connection";
import { TahsiliQuestion, TahsiliQuestionDraft } from "../../artifacts/api-server/src/mongodb/models";

const SOURCE_ID = "nasser-abdulkarim-main";
const SOURCE_ORDINAL = 1;
const SOURCE_BOOK = "كتاب ناصر عبدالكريم للتحصيلي";
const REVIEWER = "source-verified-content-audit";
const reviews = [
  { id: "6ad00e6163cd9c24f9f4091a", page: 8, number: 1, topic: "المنطق الرياضي - المثال المضاد", text: "العبارة: «إذا كانت ∠A زاوية حادة فإن قياسها 37°». أي قياس مما يأتي يمثل مثالًا مضادًا؟", options: ["73°", "90°", "103°", "180°"], answer: 0, explanation: "المثال المضاد يحقق الفرض ويفشل النتيجة: 73° زاوية حادة، لكنها لا تساوي 37°." },
  { id: "6ad00e6163cd9c24f9f4091b", page: 9, number: 9, topic: "المنطق الرياضي - العبارات المركبة", text: "إذا كانت العبارتان p وq خاطئتين، فأي عبارة منطقية مما يأتي صائبة؟", options: ["p ∧ q", "p ∨ q", "¬p → q", "¬q → ¬p"], answer: 3, explanation: "بما أن p وq خاطئتان، فإن ¬q و¬p صائبتان؛ لذلك تكون العبارة ¬q → ¬p من صورة صائبة تؤدي إلى صائبة، فتكون صائبة." },
  { id: "6ad00e6163cd9c24f9f4091c", page: 9, number: 10, topic: "المنطق الرياضي - العبارات الشرطية", text: "ما عكس العبارة الشرطية p → q؟", options: ["¬p → ¬q", "q → p", "¬p → q", "¬q → ¬p"], answer: 0, explanation: "عكس العبارة الشرطية ينتج بنفي الفرض ونفي النتيجة مع الحفاظ على ترتيبهما: p → q تصبح ¬p → ¬q." },
  { id: "6ad00e6163cd9c24f9f4091d", page: 9, number: 11, topic: "المنطق الرياضي - العبارات الشرطية", text: "ما عكس العبارة: «إذا كان مجموع قياسي زاويتين 90° فإنهما متتامتان»؟", options: ["إذا كانت الزاويتان متتامتين فإن مجموع قياسيهما 90°", "إذا لم يكن مجموع قياسي الزاويتين 90° فإنهما غير متتامتين", "إذا لم يكن مجموع قياسيهما 90° فإنهما متتامتان", "إذا لم تكن الزاويتان متتامتين فإن مجموع قياسيهما 90°"], answer: 1, explanation: "عكس p → q هو ¬p → ¬q؛ أي إذا لم يكن مجموع الزاويتين 90°، فليستا متتامتين." },
  { id: "6ad00e6163cd9c24f9f4091e", page: 9, number: 12, topic: "المنطق الرياضي - العبارات الشرطية", text: "ما المعاكس الإيجابي للعبارة: «إذا كان x = 2 فإن x² = 4»؟", options: ["إذا كان x ≠ 2 فإن x² ≠ 4", "إذا كان x² ≠ 4 فإن x ≠ 2", "إذا كان x = 2 فإن x² ≠ 4", "إذا كان x² = 4 فإن x = 2"], answer: 1, explanation: "المعاكس الإيجابي للعبارة p → q هو ¬q → ¬p؛ لذا تصبح: إذا كان x² لا يساوي 4 فإن x لا يساوي 2." },
  { id: "6ad00e6163cd9c24f9f4091f", page: 10, number: 14, topic: "الهندسة - النقاط والمستقيمات", text: "أي عبارة هندسية صحيحة؟", options: ["يمر مستقيم واحد فقط بنقطتين مختلفتين", "يمر مستقيمان مختلفان بنقطتين مختلفتين دائمًا", "يمر مستقيم واحد فقط بثلاث نقاط غير واقعة على استقامة واحدة", "يحدد مستقيمان مختلفان مستوى واحدًا دائمًا حتى إن كانا متوازيين"], answer: 0, explanation: "من مسلمات الهندسة الإقليدية يمر مستقيم واحد فقط بأي نقطتين مختلفتين." },
] as const;

async function main() {
  const apply = process.argv.includes("--apply");
  if (!await connectToMongoDB()) throw new Error("MongoDB connection unavailable.");
  if (TahsiliQuestionDraft.db.name !== "test") throw new Error("Refusing any database except Replit preview database test.");
  const drafts = await TahsiliQuestionDraft.find({ _id: { $in: reviews.map((item) => item.id) }, sourceId: SOURCE_ID })
    .select("_id questionId sourceKey sourceId sourceOrdinal sourcePage sourceQuestionNumber sourceBlockIndex sourceBook difficulty status subject")
    .lean() as any[];
  const byId = new Map(drafts.map((draft) => [String(draft._id), draft]));
  const failures: string[] = [];
  if (drafts.length !== reviews.length) failures.push(`expected ${reviews.length} source rows, found ${drafts.length}`);
  for (const item of reviews) {
    const draft = byId.get(item.id);
    if (!draft || draft.sourcePage !== item.page || draft.sourceId !== SOURCE_ID || draft.status !== "pending_review" || !draft.sourceKey?.startsWith(`${SOURCE_ID}:`)) failures.push(`q${item.number} p${item.page}: source/page/status mismatch`);
    if (item.options.length !== 4 || new Set(item.options).size !== 4 || item.answer < 0 || item.answer > 3) failures.push(`q${item.number} p${item.page}: invalid cleaned options/key`);
    if (draft?.sourceOrdinal && draft.sourceOrdinal !== SOURCE_ORDINAL) failures.push(`q${item.number} p${item.page}: unexpected source ordinal`);
    if (draft?.sourceKey && await TahsiliQuestion.exists({ sourceKey: draft.sourceKey })) failures.push(`q${item.number} p${item.page}: published record already exists`);
    const sourceQuestionNumber = SOURCE_ORDINAL * 100_000 + item.page * 100 + item.number;
    if (await TahsiliQuestion.exists({ subject: "رياضيات", sourcePage: item.page, sourceQuestionNumber, sourceKey: { $ne: draft?.sourceKey } })) failures.push(`q${item.number} p${item.page}: source question-number collision`);
  }
  if (failures.length) throw new Error(JSON.stringify({ mode: apply ? "apply" : "dry-run", failures }));
  const summary = { mode: apply ? "apply" : "dry-run", database: TahsiliQuestionDraft.db.name, sourceId: SOURCE_ID, reviewed: drafts.length, approved: reviews.length, rejected: 0, changed: false };
  if (!apply) { console.log(JSON.stringify(summary, null, 2)); return; }
  const reviewedAt = new Date();
  for (const item of reviews) {
    const draft = byId.get(item.id)!;
    const sourceQuestionNumber = SOURCE_ORDINAL * 100_000 + item.page * 100 + item.number;
    await TahsiliQuestion.findOneAndUpdate({ sourceKey: draft.sourceKey }, { $set: {
      questionId: draft.questionId, sourceId: SOURCE_ID, sourceKey: draft.sourceKey, sourceOrdinal: SOURCE_ORDINAL,
      subject: "رياضيات", subcategory: item.topic, text: item.text, options: [...item.options], correctOptionIndex: item.answer,
      difficulty: draft.difficulty || "intermediate", topic: item.topic, explanation: item.explanation,
      sourcePage: draft.sourcePage, sourceQuestionNumber, printedQuestionNumber: item.number,
      ...(draft.sourceBlockIndex != null ? { sourceBlockIndex: draft.sourceBlockIndex } : {}),
      ...(draft.sourceImageObjectKey ? { sourceImageObjectKey: draft.sourceImageObjectKey } : {}),
      sourceBook: SOURCE_BOOK, answerConfidence: "verified", reviewedBy: REVIEWER, reviewedAt, updatedAt: reviewedAt,
    }, $setOnInsert: { createdAt: reviewedAt } }, { upsert: true, returnDocument: "after", runValidators: true });
    await TahsiliQuestionDraft.updateOne({ _id: draft._id, sourceId: SOURCE_ID, status: "pending_review" }, { $set: {
      sourceOrdinal: SOURCE_ORDINAL, status: "approved", subject: "رياضيات", subcategory: item.topic,
      text: item.text, options: [...item.options], explanation: item.explanation, sourceQuestionNumber,
      printedQuestionNumber: item.number, sourceBook: SOURCE_BOOK,
      reviewedBy: REVIEWER, reviewedAt, reviewerNotes: "تم التحقق من صياغة السؤال ومفتاحه من صفحة المصدر ومراجعة الحل الرياضي/المنطقي يدويًا.", updatedAt: reviewedAt,
    } });
  }
  summary.changed = true; console.log(JSON.stringify(summary, null, 2));
}
main().catch((error) => { console.error(error instanceof Error ? error.message : "Review batch failed."); process.exitCode = 1; })
  .finally(async () => { await disconnectFromMongoDB(); });
