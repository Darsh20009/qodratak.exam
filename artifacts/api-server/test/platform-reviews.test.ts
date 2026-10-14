import test from "node:test";
import assert from "node:assert/strict";
import { platformReviewInput, publicPlatformReview } from "../src/services/platformReviewService";
import { isAllowedAfterTrial } from "../src/middleware/studentTrialAccess";

test("students cannot self-approve, feature, or impersonate a review", () => {
  const result = platformReviewInput({ rating: 4, text: "  تجربة مفيدة  ", publishConsent: true,
    status: "approved", featured: true, userId: "someone-else", adminReply: "fake" });
  assert.deepEqual(result, { rating: 4, text: "تجربة مفيدة", publishConsent: true, status: "pending", featured: false });
});
test("review validates rating, text bounds and explicit publication consent", () => {
  for (const rating of [0, 6, 3.5, "NaN"]) assert.throws(() => platformReviewInput({ rating, text: "رأي", publishConsent: true }));
  for (const text of [" ", "a".repeat(2001)]) assert.throws(() => platformReviewInput({ rating: 5, text, publishConsent: true }));
  for (const publishConsent of [false, "true", undefined]) assert.throws(() => platformReviewInput({ rating: 5, text: "رأي", publishConsent }));
});
test("public review does not expose user identity ids, contacts or moderation replies", () => {
  assert.deepEqual(publicPlatformReview({ _id: "review-id", userId: { _id: "private-id", fullName: "طالب تجريبي",
    email: "private@example.invalid", phone: "private" }, rating: 5, text: "رأي تجريبي", status: "approved",
    adminReply: "private moderation reply", createdAt: "date" }),
    { _id: "review-id", authorName: "طالب تجريبي", rating: 5, text: "رأي تجريبي", featured: false, createdAt: "date" });
});
test("expired trial keeps rating available without allowing moderation routes", () => {
  assert.equal(isAllowedAfterTrial("/api/platform-reviews", "POST"), true);
  assert.equal(isAllowedAfterTrial("/api/platform-reviews/mine", "GET"), true);
  assert.equal(isAllowedAfterTrial("/api/admin/platform-reviews", "PATCH"), false);
});
