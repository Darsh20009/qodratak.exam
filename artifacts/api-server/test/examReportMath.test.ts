import assert from 'node:assert/strict';
import test from 'node:test';
import { timingAnalysis, speedAdvice } from '../src/services/examReportMath.ts';

test('report timing does not invent zero or missing measurements', () => {
  const result = timingAnalysis([0, 0, 20]);
  assert.equal(result.measuredQuestions, 1);
  assert.equal(result.totalSeconds, 20);
  assert.equal(result.slowThresholdSeconds, null);
});
test('report timing uses median and requires five observations for slow classification', () => {
  assert.equal(timingAnalysis([20, 20, 21, 23]).slowThresholdSeconds, null);
  const result = timingAnalysis([20, 20, 21, 23, 150]);
  assert.equal(result.medianSeconds, 21);
  assert.equal(result.slowThresholdSeconds, 37.800000000000004);
});
test('speed advice is specific to quantitative and verbal question families', () => {
  assert.notEqual(speedAdvice('quantitative', 'نسب'), speedAdvice('verbal', 'استيعاب المقروء'));
});
