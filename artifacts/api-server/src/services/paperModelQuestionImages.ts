type PaperModelQuestion = {
  id: string | number;
  category?: string;
  questionType?: string;
  text?: string;
  imageUrl?: string;
  imageUrls?: string[];
};

type SourceQuestion = {
  questionId?: string | number;
  category?: string;
  text?: string;
  imageUrl?: string;
  imageUrls?: string[];
};

function normalizeCategory(value: unknown): string {
  const category = String(value ?? "").normalize("NFKC").trim();
  if (/quantitative|كمي|رياضيات|math/i.test(category)) return "quantitative";
  if (/verbal|لفظي/i.test(category)) return "verbal";
  return category.toLocaleLowerCase();
}

function normalizeText(value: unknown): string {
  return String(value ?? "").normalize("NFKC").replace(/\s+/g, " ").trim();
}

function sourceImageUrls(question: SourceQuestion): string[] {
  const urls = [
    ...(Array.isArray(question.imageUrls) ? question.imageUrls : []),
    ...(question.imageUrl ? [question.imageUrl] : []),
  ];
  return [...new Set(urls.filter((url) => typeof url === "string" && url.trim()).map((url) => url.trim()))];
}

function matchKey(id: unknown, category: unknown, text: unknown): string {
  return `${String(id ?? "").trim()}|${normalizeCategory(category)}|${normalizeText(text)}`;
}

/**
 * Adds source image links only for a unique, exact legacy-ID/category/text match.
 * Ambiguous or mismatched questions stay unchanged rather than receiving a
 * possibly unrelated image.
 */
export function attachPaperModelSourceImages<T extends PaperModelQuestion>(
  modelQuestions: T[],
  sourceQuestions: SourceQuestion[],
): T[] {
  const sourcesByKey = new Map<string, SourceQuestion[]>();

  for (const source of sourceQuestions) {
    const key = matchKey(source.questionId, source.category, source.text);
    if (!key.startsWith("|") && sourceImageUrls(source).length > 0) {
      sourcesByKey.set(key, [...(sourcesByKey.get(key) ?? []), source]);
    }
  }

  return modelQuestions.map((question) => {
    const hasImages = Boolean(question.imageUrl?.trim()) ||
      Boolean(question.imageUrls?.some((url) => url.trim()));
    if (hasImages) return question;

    const category = question.questionType || question.category;
    const matches = sourcesByKey.get(matchKey(question.id, category, question.text)) ?? [];
    if (matches.length !== 1) return question;

    const imageUrls = sourceImageUrls(matches[0]);
    return imageUrls.length > 0
      ? { ...question, imageUrl: imageUrls[0], imageUrls }
      : question;
  });
}
