import { test } from 'node:test';
import assert from 'node:assert/strict';
import { summarizeReportScores } from '../../qodratak/src/lib/reportScores';

const question = (category: string, isCorrect: boolean | null, selectedOptionIndex: number | null = 0) =>
  ({ category, isCorrect, selectedOptionIndex });

test('overall percentage uses all questions rather than averaging section percentages', () => {
  const score = summarizeReportScores([
    question('verbal', true),
    question('quantitative', true),
    ...Array.from({ length: 8 }, () => question('quantitative', false)),
  ]);
  assert.equal(score.overall.percentage, 20);
  assert.equal(score.verbal.percentage, 100);
  assert.equal(score.quantitative.percentage, 11.1);
});

test('skipped questions reduce the score without being counted as answered mistakes', () => {
  const score = summarizeReportScores([question('verbal', true), question('verbal', null, null)]);
  assert.equal(score.overall.percentage, 50);
  assert.equal(score.overall.skipped, 1);
  assert.equal(score.overall.wrong, 0);
  assert.equal(score.quantitative.percentage, null);
  assert.equal(score.quantitative.total, 0);
});

test('an incomplete correction is not displayed as an invented zero or final percentage', () => {
  const score = summarizeReportScores([question('verbal', true), question('quantitative', null)]);
  assert.equal(score.overall.percentage, null);
  assert.equal(score.overall.pending, 1);
  assert.equal(score.verbal.percentage, 100);
  assert.equal(score.quantitative.percentage, null);
  assert.equal(summarizeReportScores([]).overall.percentage, null);
});
