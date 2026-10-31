import assert from "node:assert/strict";
import test from "node:test";
import { calculatePaperModelScore, PaperModelScoreError } from "../src/services/paperModelScoring.ts";

test("paper model scoring includes every question, including legacy trial-marked items", () => {
  const score = calculatePaperModelScore({
    id: 1,
    modelNumber: 1,
    totalQuestions: 120,
    verbalCount: 65,
    quantitativeCount: 55,
    trialVerbalCount: 12,
    trialQuantCount: 8,
  }, 65, 55);

  assert.equal(score.totalQuestions, 120);
  assert.equal(score.verbalTotal, 65);
  assert.equal(score.quantitativeTotal, 55);
  assert.equal(score.totalCorrect, 120);
  assert.equal(score.totalPercentage, 100);
});

test("paper model scoring rejects answers outside the full model limits", () => {
  assert.throws(
    () => calculatePaperModelScore({
      id: 1,
      modelNumber: 1,
      totalQuestions: 120,
      verbalCount: 65,
      quantitativeCount: 55,
    }, 66, 0),
    (error: unknown) => error instanceof PaperModelScoreError && error.statusCode === 400,
  );
});
