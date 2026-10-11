import { test } from "node:test";
import assert from "node:assert/strict";
import { examQuestionPayload, dailyExamQuestions } from "../src/services/examQuestionPayload";

test("lean and Mongoose exam questions share the same public identity and content contract", () => {
  const row = {
    questionId: 34, _id: "fixture-question", category: "quantitative",
    text: "سؤال", options: ["أ", "ب", "ج", "د"], correctOptionIndex: 2,
    imageUrl: "/question.png", imageUrls: ["/question.png", "/detail.png"],
    source: { bankNumber: 6 }, createdBy: "not-public",
  };
  const document = { $isNew: false, _doc: row, toObject: () => row };
  const expected = examQuestionPayload(row);
  assert.deepEqual(examQuestionPayload(document), expected);
  assert.equal(expected.id, 34);
  assert.equal(expected.questionId, 34);
  assert.deepEqual(expected.options, row.options);
  assert.equal(expected.correctOptionIndex, 2);
  assert.deepEqual(expected.imageUrls, ["/question.png", "/detail.png"]);
  assert.ok(!("_doc" in expected));
  assert.ok(!("createdBy" in expected));
  assert.equal(examQuestionPayload({ ...row, questionId: undefined, id: 9 }).id, 9);
});

test("daily tests omit two-choice, invalid-key and review-only items and preserve distinct IDs", () => {
  const row = { id: 1, options: ["أ", "ب", "ج", "د"], correctOptionIndex: 0 };
  const questions = dailyExamQuestions([
    row, row, { ...row, id: 2, options: ["أ", "ب"] },
    { ...row, id: 3, correctOptionIndex: 4 },
    { ...row, id: 4, answerStatus: "review" }, { ...row, id: 5 },
  ]);
  assert.deepEqual(questions.map(q => q.id), [1, 5]);
});
