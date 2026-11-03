import assert from "node:assert/strict";
import test from "node:test";
import { getFoundationQuestionThumbnailUrl } from "../src/lib/foundationVideoUrl";

test("maps quantitative source scans to a separate WebP preview path", () => {
  assert.equal(
    getFoundationQuestionThumbnailUrl("foundation/quantitative/computer-banks/exam-51/question-001.jpeg"),
    "foundation/quantitative/computer-banks/exam-51/optimized/question-001.webp",
  );
  assert.equal(
    getFoundationQuestionThumbnailUrl("/api/foundation/quantitative/computer-banks/exam-110/background-removed/question-048.png"),
    "/api/foundation/quantitative/computer-banks/exam-110/background-removed/optimized/question-048.webp",
  );
});

test("preserves an external asset host and declines unrelated image paths", () => {
  assert.equal(
    getFoundationQuestionThumbnailUrl("https://cdn.example.test/foundation/quantitative/computer-banks/exam-51/question-001.jpeg"),
    "https://cdn.example.test/foundation/quantitative/computer-banks/exam-51/optimized/question-001.webp",
  );
  assert.equal(getFoundationQuestionThumbnailUrl("uploads/question.png"), undefined);
  assert.equal(
    getFoundationQuestionThumbnailUrl("foundation/quantitative/computer-banks/exam-51/answer-key.pdf"),
    undefined,
  );
});
