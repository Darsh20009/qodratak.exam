import test from "node:test";
import assert from "node:assert/strict";
import { redactImageBackedQuantitativeQuestionText } from "../src/services/studentQuestionTextPrivacy";

test("redacts only image-backed quantitative question text from student payloads", () => {
  const source = {
    testType: "qiyas",
    questions: [
      {
        questionId: "quant-image",
        category: "quantitative",
        text: "نص OCR غير ظاهر للطالب",
        imageUrl: "/question.png",
        options: ["أ", "ب"],
      },
      {
        questionId: "verbal-image",
        category: "verbal",
        text: "نص لفظي يبقى ظاهرًا",
        imageUrl: "/passage.png",
        options: ["أ", "ب"],
      },
      {
        questionId: "quant-text",
        category: "quantitative",
        text: "سؤال كمي نصي",
        options: ["أ", "ب"],
      },
    ],
  };

  const result = redactImageBackedQuantitativeQuestionText(source);
  assert.equal((result as typeof source).questions[0].text, "");
  assert.equal((result as typeof source).questions[1].text, "نص لفظي يبقى ظاهرًا");
  assert.equal((result as typeof source).questions[2].text, "سؤال كمي نصي");
  assert.equal(source.questions[0].text, "نص OCR غير ظاهر للطالب", "canonical source data is not mutated");
});

test("redacts question text when quantitative context and image are inherited from a wrapper", () => {
  const result = redactImageBackedQuantitativeQuestionText({
    category: "quantitative",
    imageUrl: "/question.png",
    question: { id: "q-1", text: "نص مصور", options: [] },
  }) as any;
  assert.equal(result.question.text, "");
});
