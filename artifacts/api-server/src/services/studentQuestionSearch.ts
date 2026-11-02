const SEARCHABLE_FIELDS = ["text", "subcategory", "topic", "keywords", "source.passageText", "source.passageLabel"] as const;
const MAX_SEARCH_TOKENS = 6;

export type StudentQuestionSearchCategory = "verbal" | "quantitative" | "general";

export type StudentQuestionSearchRecord = {
  questionId: number;
  category: StudentQuestionSearchCategory;
  subcategory: string;
  text: string;
  options: string[];
  difficulty: string;
  topic?: string;
  section?: number;
  imageUrl?: string;
  imageUrls?: string[];
};

const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";
const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

export function normalizeStudentQuestionSearchQuery(value: unknown): string | null {
  if (typeof value !== "string") return null;

  const normalized = value
    .normalize("NFKC")
    .replace(/[٠-٩]/g, (digit) => String(ARABIC_DIGITS.indexOf(digit)))
    .replace(/[۰-۹]/g, (digit) => String(PERSIAN_DIGITS.indexOf(digit)))
    .replace(/[\u064B-\u065F\u0670\u0640]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!normalized || normalized.length > 240) return null;
  return normalized;
}

export function escapeQuestionSearchRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function questionSearchTokens(query: string): string[] {
  return Array.from(new Set(
    query
      .split(/[\s،,؛;:()[\]{}"'«»!?؟]+/)
      .map((token) => token.trim())
      .filter((token) => token.length >= 2),
  ))
    .sort((left, right) => right.length - left.length)
    .slice(0, MAX_SEARCH_TOKENS);
}

export function buildStudentQuestionSearchFilter(
  query: string,
  category?: StudentQuestionSearchCategory,
) {
  const normalizedQuery = normalizeStudentQuestionSearchQuery(query) ?? query;
  const tokens = questionSearchTokens(normalizedQuery);
  const orConditions: Array<Record<string, unknown>> = [
    ...SEARCHABLE_FIELDS.map((field) => ({ [field]: new RegExp(escapeQuestionSearchRegex(normalizedQuery), "i") })),
    ...tokens.flatMap((token) => SEARCHABLE_FIELDS.map((field) => ({
      [field]: new RegExp(escapeQuestionSearchRegex(token), "i"),
    }))),
  ];

  if (/^\d+$/.test(normalizedQuery)) {
    const questionId = Number(normalizedQuery);
    if (Number.isSafeInteger(questionId)) {
      orConditions.unshift({ questionId });
    }
  }

  return {
    answerStatus: "approved" as const,
    ...(category ? { category } : {}),
    $or: orConditions,
  };
}

function normalizeForMatch(value: string): string {
  return value
    .normalize("NFKC")
    .replace(/[\u064B-\u065F\u0670\u0640]/g, "")
    .toLocaleLowerCase()
    .replace(/[٠-٩]/g, (digit) => String(ARABIC_DIGITS.indexOf(digit)))
    .replace(/[۰-۹]/g, (digit) => String(PERSIAN_DIGITS.indexOf(digit)));
}

export function rankStudentQuestionSearchResults<T extends StudentQuestionSearchRecord>(
  questions: T[],
  query: string,
): T[] {
  const normalizedQuery = normalizeForMatch(query);
  const tokens = questionSearchTokens(normalizedQuery);

  return questions
    .map((question, index) => {
      const searchableText = normalizeForMatch([
        question.text,
        question.subcategory,
        question.topic ?? "",
        ...(Array.isArray((question as T & { keywords?: string[] }).keywords)
          ? (question as T & { keywords: string[] }).keywords
          : []),
      ].join(" "));
      const matchedTokens = tokens.filter((token) => searchableText.includes(normalizeForMatch(token))).length;
      const exactIdMatch = /^\d+$/.test(normalizedQuery) && question.questionId === Number(normalizedQuery);
      const exactPhraseMatch = searchableText.includes(normalizedQuery);
      const score = (exactIdMatch ? 1000 : 0) + (exactPhraseMatch ? 100 : 0) + matchedTokens * 10;
      return { question, index, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score || left.index - right.index)
    .map((entry) => entry.question);
}

export function toStudentQuestionSearchResult(
  question: StudentQuestionSearchRecord,
): StudentQuestionSearchRecord {
  return {
    questionId: question.questionId,
    category: question.category,
    subcategory: question.subcategory,
    text: question.text,
    options: Array.isArray(question.options) ? question.options : [],
    difficulty: question.difficulty,
    ...(question.topic ? { topic: question.topic } : {}),
    ...(typeof question.section === "number" ? { section: question.section } : {}),
    ...(question.imageUrl ? { imageUrl: question.imageUrl } : {}),
    ...(Array.isArray(question.imageUrls) && question.imageUrls.length
      ? { imageUrls: question.imageUrls }
      : {}),
  };
}
