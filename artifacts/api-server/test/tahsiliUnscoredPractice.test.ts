import assert from "node:assert/strict";
import test from "node:test";
import {
  StartTahsiliUnscoredPracticeBody,
  SubmitTahsiliUnscoredPracticeResponse,
} from "@workspace/api-zod";

test("unscored Tahsili practice accepts a report containing answers and timing only", () => {
  const result = SubmitTahsiliUnscoredPracticeResponse.parse({
    attemptId: "attempt-1",
    subject: "biology",
    label: "الأحياء",
    totalQuestions: 1,
    answeredQuestions: 1,
    skippedQuestions: 0,
    durationSeconds: 42,
    completedAt: "2026-10-16T12:00:00.000Z",
    unscored: true,
    questions: [{
      id: "draft-1",
      text: "نص السؤال",
      options: ["أ", "ب", "ج", "د"],
      subcategory: "عام",
      topic: "عام",
      difficulty: "intermediate",
      selectedOptionIndex: 2,
      responseTimeSeconds: 42,
      sourceBook: "مصدر",
      sourcePage: 3,
      imageUrl: null,
    }],
  });

  assert.equal(result.answeredQuestions, 1);
  assert.equal(result.questions[0].selectedOptionIndex, 2);
  assert.equal("percentage" in result, false);
  assert.equal("correctOptionIndex" in result.questions[0], false);
  assert.equal("isCorrect" in result.questions[0], false);
});

test("unscored Tahsili practice response strips score and correctness fields", () => {
  const report = {
    attemptId: "attempt-1",
    subject: "biology",
    label: "الأحياء",
    totalQuestions: 1,
    answeredQuestions: 1,
    skippedQuestions: 0,
    durationSeconds: 42,
    completedAt: "2026-10-16T12:00:00.000Z",
    unscored: true,
    percentage: 100,
    questions: [{
      id: "draft-1",
      text: "نص السؤال",
      options: ["أ", "ب", "ج", "د"],
      subcategory: "عام",
      topic: "عام",
      difficulty: "intermediate",
      selectedOptionIndex: 2,
      correctOptionIndex: 2,
      isCorrect: true,
      responseTimeSeconds: 42,
      sourceBook: "مصدر",
      sourcePage: 3,
      imageUrl: null,
    }],
  };

  const parsed = SubmitTahsiliUnscoredPracticeResponse.parse(report);
  assert.equal("percentage" in parsed, false);
  assert.equal("correctOptionIndex" in parsed.questions[0], false);
  assert.equal("isCorrect" in parsed.questions[0], false);
});

test("unscored Tahsili practice validates subject and question count", () => {
  assert.equal(StartTahsiliUnscoredPracticeBody.safeParse({ subject: "mixed" }).success, true);
  assert.equal(StartTahsiliUnscoredPracticeBody.safeParse({ subject: "unknown" }).success, false);
  assert.equal(StartTahsiliUnscoredPracticeBody.safeParse({ subject: "biology", questionCount: 4 }).success, false);
  assert.equal(StartTahsiliUnscoredPracticeBody.safeParse({ subject: "mixed", questionCount: 110 }).success, true);
  assert.equal(StartTahsiliUnscoredPracticeBody.safeParse({ subject: "mixed", questionCount: 111 }).success, false);
});
