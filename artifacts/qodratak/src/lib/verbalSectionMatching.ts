export type VerbalQuestionSectionSource = {
  category?: unknown;
  subcategory?: unknown;
  source?: {
    section?: unknown;
  } | null;
};

const VERBAL_SECTION_ALIASES: Record<string, string[]> = {
  "sentence-completion": ["إكمال الجمل", "اكمال الجمل", "sentence completion", "complete sentence"],
  "reading-comprehension": ["استيعاب المقروء", "الفهم القرائي", "reading comprehension", "reading passage"],
  "contextual-error": ["الخطأ السياقي", "السياق اللغوي", "contextual error"],
  analogy: ["التناظر اللفظي", "التناظر", "verbal analogy", "analogy", "analogies"],
};

export function normalizeVerbalSection(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .replace(/ـ/g, "")
    .replace(/[إأآٱ]/g, "ا")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .toLowerCase()
    .trim();
}

export function matchesVerbalQuestionSection(
  question: VerbalQuestionSectionSource,
  sectionSlug: string,
): boolean {
  const aliases = VERBAL_SECTION_ALIASES[sectionSlug];
  if (!aliases) return false;

  const candidate = normalizeVerbalSection(
    [question.subcategory, question.source?.section, question.category]
      .filter((value): value is string => typeof value === "string")
      .join(" "),
  );

  return aliases.some((alias) => candidate.includes(normalizeVerbalSection(alias)));
}
