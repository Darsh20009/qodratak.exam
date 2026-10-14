export class ReviewInputError extends Error {}
export function platformReviewInput(body: any) {
  const rating = Number(body?.rating);
  const text = typeof body?.text === "string" ? body.text.trim() : "";
  if (!Number.isInteger(rating) || rating < 1 || rating > 5 || !text || text.length > 2000)
    throw new ReviewInputError("اختر تقييمًا من ١ إلى ٥ واكتب رأيك (حتى ٢٠٠٠ حرف).");
  if (body?.publishConsent !== true)
    throw new ReviewInputError("يجب الموافقة على نشر اسمك وتقييمك بعد اعتماد الإدارة.");
  return { rating, text, publishConsent: true, status: "pending" as const, featured: false };
}
export function publicPlatformReview(review: any) {
  return {
    _id: String(review._id), rating: review.rating, text: review.text,
    featured: Boolean(review.featured), createdAt: review.createdAt,
    authorName: review.userId?.fullName || review.userId?.username || "طالب قدراتك",
  };
}
