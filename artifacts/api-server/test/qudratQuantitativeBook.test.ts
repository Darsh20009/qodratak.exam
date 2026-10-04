import assert from "node:assert/strict";
import test from "node:test";
import {
  QUANTITATIVE_BOOK_PASSING_SCORE,
  QUANTITATIVE_BOOK_SOURCES,
  QUANTITATIVE_CHAPTERS,
  QUANTITATIVE_LESSONS,
  QUANTITATIVE_TOPICS,
  getQuestionSet,
  gradeQuantitativeQuiz,
  publicQuestion,
} from "../src/learning/qudratQuantitativeBook.ts";

test("maps fifty topics across five chapters and marks only authored lessons as published", () => {
  assert.equal(QUANTITATIVE_CHAPTERS.length, 5);
  assert.deepEqual(QUANTITATIVE_CHAPTERS.map((chapter) => chapter.topics.length), [10, 10, 10, 10, 10]);
  assert.equal(QUANTITATIVE_TOPICS.length, 50);
  assert.equal(new Set(QUANTITATIVE_TOPICS.map((topic) => topic.id)).size, 50);
  assert.equal(QUANTITATIVE_LESSONS.length, 6);
  assert.ok(QUANTITATIVE_LESSONS.every((lesson) => QUANTITATIVE_TOPICS.some((topic) => topic.id === lesson.id)));
});

test("published lesson source references resolve to the maintained source registry", () => {
  for (const lesson of QUANTITATIVE_LESSONS) {
    assert.ok(lesson.sources.length > 0, `${lesson.id} needs at least one source`);
    for (const sourceId of lesson.sources) {
      assert.ok(QUANTITATIVE_BOOK_SOURCES[sourceId], `${lesson.id} references missing source ${sourceId}`);
    }
  }
});

test("each assessment and remediation question has a server-owned answer key and complete feedback", () => {
  for (const lesson of QUANTITATIVE_LESSONS) {
    for (const mode of ["assessment", "remediation"] as const) {
      const questions = getQuestionSet(lesson, mode);
      assert.equal(questions.length, 4, `${lesson.id} ${mode} question count`);
      assert.equal(new Set(questions.map((question) => question.id)).size, questions.length);
      for (const question of questions) {
        assert.ok(question.correctOptionIndex >= 0 && question.correctOptionIndex < question.options.length);
        assert.equal(question.optionFeedback.length, question.options.length);
        assert.equal(question.optionFeedback[question.correctOptionIndex], null);
        assert.equal(publicQuestion(question).id, question.id);
        assert.equal("correctOptionIndex" in publicQuestion(question), false);
        assert.equal("explanation" in publicQuestion(question), false);
        assert.equal("optionFeedback" in publicQuestion(question), false);
      }
    }
  }
});

test("grading returns a 75 percent mastery threshold and feedback for the selected distractor", () => {
  const lesson = QUANTITATIVE_LESSONS[0];
  const questions = getQuestionSet(lesson, "assessment");
  const answers = new Map(
    questions.map((question, index) => [
      question.id,
      index === questions.length - 1
        ? (question.correctOptionIndex + 1) % question.options.length
        : question.correctOptionIndex,
    ]),
  );

  const result = gradeQuantitativeQuiz(questions, answers);
  assert.equal(QUANTITATIVE_BOOK_PASSING_SCORE, 75);
  assert.equal(result.score, 75);
  assert.equal(result.correctAnswers, 3);
  assert.equal(result.totalQuestions, 4);
  assert.equal(result.questionDetails[3].isCorrect, false);
  assert.ok(result.questionDetails[3].selectedOptionFeedback);
  assert.equal(result.questionDetails[0].selectedOptionFeedback, null);
});