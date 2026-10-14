type QuestionTextPrivacyContext = {
  quantitative: boolean;
  imageBacked: boolean;
};

const questionTextKeys = new Set(["text", "question", "questionText", "ocrText", "extractedText"]);

function isQuestionCategory(value: unknown) {
  if (typeof value !== "string") return false;
  return /quantitative|كمي|رياضيات|math/i.test(value);
}

function hasQuestionImage(value: Record<string, unknown>) {
  const imageFields = [
    value.imageUrl,
    value.image_url,
    value.questionImageUrl,
    value.question_image_url,
  ];
  if (imageFields.some((image) => typeof image === "string" && image.trim())) return true;
  return ["imageUrls", "image_urls", "questionImageUrls", "question_image_urls", "images"].some((key) => {
    const images = value[key];
    return Array.isArray(images) && images.some((image) =>
      typeof image === "string" ? Boolean(image.trim()) :
        typeof image === "object" && image !== null && Object.values(image).some((part) => typeof part === "string" && part.trim()),
    );
  });
}

function isQuestionRecord(value: Record<string, unknown>) {
  const hasText = [...questionTextKeys].some((key) => typeof value[key] === "string" && Boolean((value[key] as string).trim()));
  const hasIdentity = ["questionId", "sourceQuestionId", "id", "_id"].some((key) => value[key] !== undefined);
  const hasAnswerShape = Array.isArray(value.options) || Array.isArray(value.choices) ||
    Array.isArray(value.answerOptions) || value.correctOptionIndex !== undefined;
  return hasText && (hasAnswerShape || hasIdentity);
}

function asPlainObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || value instanceof Date || Buffer.isBuffer(value)) return null;
  const converted = typeof (value as any).toJSON === "function" ? (value as any).toJSON() : value;
  if (!converted || typeof converted !== "object" || Array.isArray(converted) || converted instanceof Date) return null;
  return converted as Record<string, unknown>;
}

function redact(value: unknown, context: QuestionTextPrivacyContext): unknown {
  if (Array.isArray(value)) return value.map((item) => redact(item, context));
  const record = asPlainObject(value);
  if (!record) return value;

  const categoryValues = [
    record.category, record.testCategory, record.testType, record.sectionCategory, record.subject, record.type,
  ];
  const nextContext = {
    quantitative: context.quantitative || categoryValues.some(isQuestionCategory),
    imageBacked: context.imageBacked || hasQuestionImage(record),
  };
  const hideText = nextContext.quantitative && nextContext.imageBacked && isQuestionRecord(record);
  const output: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(record)) {
    output[key] = hideText && questionTextKeys.has(key) && typeof child === "string"
      ? ""
      : redact(child, nextContext);
  }
  return output;
}

/**
 * Keeps canonical question text on the server for trusted explanation services,
 * but removes image-backed quantitative OCR/stem text from student API responses.
 */
export function redactImageBackedQuantitativeQuestionText<T>(payload: T): T {
  return redact(payload, { quantitative: false, imageBacked: false }) as T;
}
