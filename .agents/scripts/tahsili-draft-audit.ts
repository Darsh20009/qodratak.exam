import { disconnectFromMongoDB, connectToMongoDB } from "../../artifacts/api-server/src/mongodb/connection";
import { TahsiliQuestion, TahsiliQuestionDraft } from "../../artifacts/api-server/src/mongodb/models";

type Draft = {
  _id: unknown;
  sourceKey?: string;
  sourceId?: string;
  sourceOrdinal?: number;
  questionId?: number;
  sourceQuestionNumber?: number;
  subject?: string;
  text?: string;
  options?: unknown[];
  explanation?: string;
  sourcePage?: number;
  sourceBlockIndex?: number;
  sourceImageObjectKey?: string;
  requiresImage?: boolean;
  sourceBook?: string;
  status?: string;
};

function flagsFor(draft: Draft): string[] {
  const flags: string[] = [];
  const text = typeof draft.text === "string" ? draft.text.trim() : "";
  const options = Array.isArray(draft.options) ? draft.options : [];
  const searchable = `${text} ${options.filter((option) => typeof option === "string").join(" ")}`;
  if (!text) flags.push("missing_text");
  else if (text.length < 8) flags.push("very_short_text");
  if (options.length !== 4) flags.push("option_count_not_four");
  if (options.some((option) => typeof option !== "string" || !option.trim())) flags.push("empty_or_nontext_option");
  if (options.some((option) => typeof option === "string" && option.length > 1000)) flags.push("oversized_option");
  const normalizedOptions = options.map((option) =>
    typeof option === "string" ? option.normalize("NFKC").replace(/\s+/g, "").trim() : "",
  );
  if (new Set(normalizedOptions.filter(Boolean)).size < normalizedOptions.filter(Boolean).length) {
    flags.push("duplicate_options");
  }
  if (/(?:الشكل|الرسم|المخطط|الجدول).{0,24}(?:المجاور|المقابل|الآتي|التالي)|(?:من|في)\s+(?:الشكل|الرسم)\s+(?:المجاور|المقابل)/u.test(text) &&
    !draft.sourceImageObjectKey) {
    flags.push("possible_missing_figure");
  }
  if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFD]/u.test(searchable)) {
    flags.push("control_or_replacement_characters");
  }
  const suspiciousCharacters = (searchable.match(/[�¤§¨¬¯±ÿþ�Þ×÷≮≯͡\uFFFD]/gu) || []).length;
  if (suspiciousCharacters >= 3) flags.push("possible_ocr_corruption");
  if (!Number.isInteger(draft.sourcePage) || Number(draft.sourcePage) < 1) flags.push("invalid_source_page");
  if (!draft.sourceKey || !draft.sourceId) flags.push("missing_source_identity");
  if (draft.requiresImage && !draft.sourceImageObjectKey) flags.push("required_image_missing");
  if (!draft.explanation?.trim()) flags.push("missing_explanation");
  return flags;
}

async function main() {
  const connected = await connectToMongoDB();
  if (!connected) throw new Error("MongoDB connection unavailable; no draft data was read.");
  const dbName = TahsiliQuestionDraft.db.name;
  if (dbName !== "test") {
    throw new Error(`Refusing to inspect database "${dbName}"; expected Replit preview database "test".`);
  }

  const sourceFilters = (process.env.TAHSILI_SOURCE_FILTER || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const sourceFilter = sourceFilters.length ? sourceFilters.join(",") : null;
  const includeRows = process.env.TAHSILI_INCLUDE_ROWS === "1";
  const drafts = await TahsiliQuestionDraft.find({
    status: "pending_review",
    ...(sourceFilters.length ? { sourceId: { $in: sourceFilters } } : {}),
  })
    .select("_id sourceKey sourceId sourceOrdinal questionId sourceQuestionNumber subject text options explanation sourcePage sourceBlockIndex sourceImageObjectKey requiresImage sourceBook status")
    .lean() as unknown as Draft[];
  const stateFilter = sourceFilters.length ? { sourceId: { $in: sourceFilters } } : {};
  const reviewStates = await TahsiliQuestionDraft.find(stateFilter).select("status subject sourceId").lean() as Array<{
    status?: string;
    subject?: string;
    sourceId?: string;
  }>;
  const statusCounts: Record<string, number> = {};
  const statusBySource: Record<string, Record<string, number>> = {};
  for (const row of reviewStates) {
    const status = row.status || "unknown";
    const sourceId = row.sourceId || "(missing)";
    statusCounts[status] = (statusCounts[status] || 0) + 1;
    statusBySource[sourceId] ||= {};
    statusBySource[sourceId][status] = (statusBySource[sourceId][status] || 0) + 1;
  }
  const publishedQuestions = await TahsiliQuestion.find(stateFilter)
    .select("sourceId correctOptionIndex options explanation")
    .lean() as Array<{
    sourceId?: string;
    correctOptionIndex?: number;
    options?: unknown[];
    explanation?: string;
  }>;
  const publishedBySource: Record<string, { count: number; missingExplanation: number; invalidKeys: number }> = {};
  for (const question of publishedQuestions) {
    const sourceId = question.sourceId || "(missing)";
    publishedBySource[sourceId] ||= { count: 0, missingExplanation: 0, invalidKeys: 0 };
    const summary = publishedBySource[sourceId];
    summary.count += 1;
    if (!question.explanation?.trim()) summary.missingExplanation += 1;
    if (!Array.isArray(question.options) || question.options.length !== 4 ||
      !Number.isInteger(question.correctOptionIndex) ||
      Number(question.correctOptionIndex) < 0 || Number(question.correctOptionIndex) > 3) {
      summary.invalidKeys += 1;
    }
  }

  const bySubject = new Map<string, number>();
  const bySource = new Map<string, number>();
  const sourceDetails = new Map<string, {
    sourceBook: string;
    sourceOrdinal: number | null;
    count: number;
    firstPage: number | null;
    lastPage: number | null;
  }>();
  const sourceSamples = new Map<string, Array<Record<string, unknown>>>();
  const flagCounts = new Map<string, number>();
  const examples = new Map<string, Array<Record<string, unknown>>>();
  const normalizedTextGroups = new Map<string, Draft[]>();

  for (const draft of drafts) {
    bySubject.set(draft.subject || "(missing)", (bySubject.get(draft.subject || "(missing)") || 0) + 1);
    const sourceName = draft.sourceBook || draft.sourceId || "(missing)";
    bySource.set(sourceName, (bySource.get(sourceName) || 0) + 1);
    const source = sourceDetails.get(draft.sourceId || "(missing)") || {
      sourceBook: sourceName,
      sourceOrdinal: Number.isInteger(draft.sourceOrdinal) ? Number(draft.sourceOrdinal) : null,
      count: 0,
      firstPage: null,
      lastPage: null,
    };
    source.count += 1;
    if (Number.isInteger(draft.sourcePage)) {
      source.firstPage = source.firstPage === null ? Number(draft.sourcePage) : Math.min(source.firstPage, Number(draft.sourcePage));
      source.lastPage = source.lastPage === null ? Number(draft.sourcePage) : Math.max(source.lastPage, Number(draft.sourcePage));
    }
    sourceDetails.set(draft.sourceId || "(missing)", source);
    const sampleList = sourceSamples.get(draft.sourceId || "(missing)") || [];
    if (sampleList.length < 2) {
      sampleList.push({
        id: String(draft._id),
        page: draft.sourcePage,
        block: draft.sourceBlockIndex,
        questionNumber: draft.sourceQuestionNumber,
        text: (draft.text || "").slice(0, 180),
        options: (Array.isArray(draft.options) ? draft.options : []).map((option) =>
          typeof option === "string" ? option.slice(0, 80) : String(option),
        ),
        hasExplanation: Boolean(draft.explanation?.trim()),
        requiresImage: Boolean(draft.requiresImage),
        hasImage: Boolean(draft.sourceImageObjectKey),
      });
      sourceSamples.set(draft.sourceId || "(missing)", sampleList);
    }
    const normalized = (draft.text || "").toLocaleLowerCase().replace(/\s+/g, " ").trim();
    if (normalized) normalizedTextGroups.set(normalized, [...(normalizedTextGroups.get(normalized) || []), draft]);
    const flags = flagsFor(draft);
    for (const flag of flags) {
      flagCounts.set(flag, (flagCounts.get(flag) || 0) + 1);
      const list = examples.get(flag) || [];
      if (list.length < 5) {
        list.push({
          id: String(draft._id),
          source: sourceName,
          page: draft.sourcePage,
          questionNumber: draft.sourceQuestionNumber,
          text: (draft.text || "").slice(0, 160),
          optionLengths: (Array.isArray(draft.options) ? draft.options : []).map((option) =>
            typeof option === "string" ? option.trim().length : null,
          ),
          requiresImage: Boolean(draft.requiresImage),
          hasImage: Boolean(draft.sourceImageObjectKey),
        });
        examples.set(flag, list);
      }
    }
  }

  const duplicateGroups = [...normalizedTextGroups.entries()]
    .filter(([, group]) => group.length > 1)
    .slice(0, 10)
    .map(([text, group]) => ({
      text: text.slice(0, 160),
      occurrences: group.map((draft) => ({
        id: String(draft._id),
        sourceId: draft.sourceId,
        sourceBook: draft.sourceBook,
        page: draft.sourcePage,
        block: draft.sourceBlockIndex,
      })),
    }));
  console.log(JSON.stringify({
    database: dbName,
    status: "pending_review",
    sourceFilter: sourceFilter || null,
    total: drafts.length,
    reviewStateCount: reviewStates.length,
    statusCounts,
    statusBySource,
    publishedBySource,
    bySubject: Object.fromEntries(bySubject),
    bySource: Object.fromEntries(bySource),
    sourceDetails: Object.fromEntries(sourceDetails),
    sourceSamples: Object.fromEntries(sourceSamples),
    flagCounts: Object.fromEntries(flagCounts),
    duplicateTextGroupCount: [...normalizedTextGroups.values()].filter((group) => group.length > 1).length,
    duplicateSamples: duplicateGroups,
    examples: Object.fromEntries(examples),
    ...(includeRows ? {
      rows: drafts.map((draft) => ({
        id: String(draft._id),
        sourceId: draft.sourceId,
        sourceBook: draft.sourceBook,
        page: draft.sourcePage,
        block: draft.sourceBlockIndex,
        questionNumber: draft.sourceQuestionNumber,
        text: draft.text,
        options: draft.options,
        hasExplanation: Boolean(draft.explanation?.trim()),
        explanation: draft.explanation || null,
        hasImage: Boolean(draft.sourceImageObjectKey),
        requiresImage: Boolean(draft.requiresImage),
      })),
    } : {}),
    note: "Read-only audit. No questions, answers, explanations, or statuses were changed.",
  }, null, 2));
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : "Audit failed.");
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectFromMongoDB();
  });
