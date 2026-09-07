export interface QuestionImageSource {
  imageUrl?: string | null;
  imageUrls?: Array<string | null | undefined> | null;
}

/**
 * Returns question images in their stored order while supporting legacy
 * questions that only have the singular imageUrl field.
 */
export function getQuestionImageUrls(question?: QuestionImageSource | null): string[] {
  if (!question) return [];

  const urls = [
    ...(Array.isArray(question.imageUrls) ? question.imageUrls : []),
    question.imageUrl,
  ].filter((url): url is string => typeof url === 'string' && url.trim().length > 0);

  return Array.from(new Set(urls));
}