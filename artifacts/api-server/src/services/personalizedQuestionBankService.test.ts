import test from "node:test";
import assert from "node:assert/strict";
import {
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
