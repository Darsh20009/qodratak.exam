export function shouldHideImageBackedQuantitativeQuestionText(
  question: unknown,
  quantitativeFallback = false,
): boolean {
  if (!question || typeof question !== "object") return false;
  const record = question as Record<string, unknown>;
  const categoryText = [
    record.category,
    record.testCategory,
    record.testType,
    record.type,
    record.subject,
  ].filter((value): value is string => typeof value === "string").join(" ");
  const quantitative = quantitativeFallback || /quantitative|كمي|رياضيات|math/i.test(categoryText);
  if (!quantitative) return false;

  const directImages = [
    record.imageUrl,
    record.image_url,
    record.questionImageUrl,
    record.question_image_url,
  ];
  if (directImages.some((image) => typeof image === "string" && image.trim())) return true;
  return ["imageUrls", "image_urls", "questionImageUrls", "question_image_urls", "images"].some((key) => {
    const images = record[key];
    return Array.isArray(images) && images.some((image) =>
      typeof image === "string" ? Boolean(image.trim()) :
        typeof image === "object" && image !== null && Object.values(image).some((part) => typeof part === "string" && part.trim()),
    );
  });
}
