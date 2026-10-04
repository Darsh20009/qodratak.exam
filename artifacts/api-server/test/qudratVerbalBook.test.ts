import assert from "node:assert/strict";
import test from "node:test";
import {
  VERBAL_BOOK_PASSING_SCORE,
  VERBAL_CHAPTERS,
  VERBAL_LESSONS,
  VERBAL_TOPICS,
  getVerbalQuestionSet,
  gradeVerbalQuiz,
  publicVerbalQuestion,
} from "../src/learning/qudratVerbalBook.ts";

test("maps fifty verbal topics across five chapters and publishes the first six lessons", () => {
  assert.equal(VERBAL_CHAPTERS.length, 5);
  assert.deepEqual(VERBAL_CHAPTERS.map((chapter) => chapter.topics.length), [10, 10, 10, 10, 10]);
  assert.equal(VERBAL_TOPICS.length, 50);
  assert.equal(new Set(VERBAL_TOPICS.map((topic) => topic.id)).size, 50);
  assert.equal(VERBAL_LESSONS.length, 6);
  assert.ok(VERBAL_LESSONS.every((lesson) => VERBAL_TOPICS.some((topic) => topic.id === lesson.id)));
});

test("assessment and review questions have valid server-only answer keys and complete feedback", () => {
  for (const lesson of VERBAL_LESSONS) {
    for (const mode of ["assessment", "remediation"] as const) {
      const questions = getVerbalQuestionSet(lesson, mode);
      assert.equal(questions.length, 4, `${lesson.id} ${mode} question count`);
      assert.equal(new Set(questions.map((question) => question.id)).size, questions.length);
      for (const question of questions) {
        assert.ok(question.correctOptionIndex >= 0 && question.correctOptionIndex < question.options.length);
        assert.equal(question.optionFeedback.length, question.options.length);
        assert.equal(question.optionFeedback[question.correctOptionIndex], null);
        const publicPayload = publicVerbalQuestion(question);
        assert.equal("correctOptionIndex" in publicPayload, false);
        assert.equal("explanation" in publicPayload, false);
        assert.equal("optionFeedback" in publicPayload, false);
        if (question.passageText) {
          assert.equal(publicPayload.passageText, question.passageText);
          assert.ok(publicPayload.passageLabel);
        }
      }
    }
  }
});

test("server grading uses the mastery threshold and preserves passage evidence", () => {
  const lesson = VERBAL_LESSONS.find((item) => item.id === "verbal-reading-main-idea");
  assert.ok(lesson);
  const questions = getVerbalQuestionSet(lesson, "assessment");
  const answers = new Map(
    questions.map((question, index) => [
      question.id,
      index === questions.length - 1
        ? (question.correctOptionIndex + 1) % question.options.length
        : question.correctOptionIndex,
    ]),
  );
  const result = gradeVerbalQuiz(questions, answers);
  assert.equal(VERBAL_BOOK_PASSING_SCORE, 75);
  assert.equal(result.score, 75);
  assert.equal(result.correctAnswers, 3);
  assert.equal(result.totalQuestions, 4);
  assert.equal(result.questionDetails[3].isCorrect, false);
  assert.ok(result.questionDetails[3].selectedOptionFeedback);
  assert.equal(result.questionDetails[0].passageText, questions[0].passageText);
});