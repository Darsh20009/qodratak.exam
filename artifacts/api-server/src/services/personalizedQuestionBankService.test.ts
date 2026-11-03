import test from "node:test";
import assert from "node:assert/strict";
import {
  isExamEligibleBankQuestion,
  pickQuestionBatch,
  type BankQuestion,
  type QuestionHistorySnapshot,
} from "./personalizedQuestionBankService";

function question(id: number, difficulty: BankQuestion["difficulty"] = "beginner"): BankQuestion {
  return {
    _id: id.toString(16).padStart(24, "0"),
    questionId: id,
    category: "verbal",
    text: `question ${id}`,
    options: ["a", "b", "c", "d"],
    correctOptionIndex: 0,
    difficulty,
    answerStatus: "approved",
  };
}

test("exam question eligibility matches the client validator", () => {
  const valid = question(1);
  assert.equal(isExamEligibleBankQuestion(valid), true);
  assert.equal(isExamEligibleBankQuestion({ ...valid, options: ["a", "b", "c"] }), false);
  assert.equal(isExamEligibleBankQuestion({ ...valid, options: ["a", "b", "c", " "] }), false);
  assert.equal(isExamEligibleBankQuestion({ ...valid, options: ["a", "b", "c", "c"] }), false);
  assert.equal(isExamEligibleBankQuestion({ ...valid, correctOptionIndex: 4 }), false);
  assert.equal(isExamEligibleBankQuestion({ ...valid, questionId: 0 }), false);
});

test("personalized selection excludes mastered questions and chooses new questions first", () => {
  const bank = [question(1), question(2), question(3), question(4)];
  const history: QuestionHistorySnapshot = {
    seenQuestionIds: [String(bank[0]._id), String(bank[1]._id)],
    correctQuestionIds: [String(bank[0]._id)],
    incorrectQuestionIds: [String(bank[1]._id)],
  };
  const selected = pickQuestionBatch(bank, history, "verbal", 2, new Set());
  assert.deepEqual(new Set(selected.map((item) => item.questionId)), new Set([3, 4]));
  assert.ok(selected.every((item) => item.questionId !== 1));
});

test("personalized selection retries wrong questions only after the unseen pool is used", () => {
  const bank = [question(1), question(2), question(3)];
  const history: QuestionHistorySnapshot = {
    seenQuestionIds: [String(bank[0]._id), String(bank[1]._id)],
    correctQuestionIds: [String(bank[0]._id)],
    incorrectQuestionIds: [String(bank[1]._id)],
  };
  const selected = pickQuestionBatch(bank, history, "verbal", 3, new Set());
  assert.equal(selected.length, 2);
  assert.deepEqual(new Set(selected.map((item) => item.questionId)), new Set([2, 3]));
  assert.ok(selected.every((item) => item.questionId !== 1));
});

test("simulated exams reuse mastered questions only after new and incorrect questions run out", () => {
  const bank = [question(1), question(2), question(3)];
  const history: QuestionHistorySnapshot = {
    seenQuestionIds: bank.slice(0, 2).map((item) => String(item._id)),
    correctQuestionIds: [String(bank[0]._id)],
    incorrectQuestionIds: [String(bank[1]._id)],
  };
  const selected = pickQuestionBatch(bank, history, "verbal", 3, new Set(), true);
  assert.equal(selected.length, 3);
  assert.deepEqual(selected.map((item) => item.questionId), [3, 2, 1]);
});

test("difficulty ordering targets the student's observed weak difficulty", () => {
  const bank = [
    question(1, "beginner"),
    question(2, "advanced"),
    question(3, "intermediate"),
    question(4, "advanced"),
  ];
  const history: QuestionHistorySnapshot = {
    seenQuestionIds: [String(bank[1]._id)],
    incorrectQuestionIds: [String(bank[1]._id)],
  };
  const selected = pickQuestionBatch(bank, history, "verbal", 1, new Set());
  assert.equal(selected[0].difficulty, "advanced");
});
