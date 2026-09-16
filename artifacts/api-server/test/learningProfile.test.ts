import assert from 'node:assert/strict';
import test from 'node:test';
import {
  confidenceForAttemptCount,
  normalizeLearningAttemptInput,
  observedAccuracy,
} from '../src/services/learningProfileService.ts';

test('normalizes a valid observed attempt without inventing deep taxonomy', () => {
  const result = normalizeLearningAttemptInput({
    questionId: 'question-1',
    sourceType: 'mongo_question',
    programId: 'program.qudrat',
    subjectId: 'subject.qudrat.verbal',
    selectedAnswer: 2,
    isAnswered: true,
    isCorrect: false,
    responseTime: 18,
  });

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.value.programId, 'program.qudrat');
    assert.equal(result.value.subjectId, 'subject.qudrat.verbal');
    assert.equal(result.value.isCorrect, false);
    assert.equal(result.value.responseTime, 18);
  }
});

test('keeps missing subject as an observed unclassified attempt', () => {
  const result = normalizeLearningAttemptInput({
    questionId: 'question-without-subject',
    programId: 'program.qudrat',
    selectedAnswer: null,
    isAnswered: false,
    isCorrect: false,
  });

  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.value.subjectId, undefined);
});

test('rejects unapproved subject and invalid question metadata', () => {
  const result = normalizeLearningAttemptInput({
    questionId: 'question-1',
    programId: 'program.qudrat',
    subjectId: 'topic.qudrat.quantitative.geometry',
    isCorrect: false,
  });

  assert.equal(result.ok, false);
});

test('calculates observed accuracy only from answered attempts', () => {
  assert.equal(observedAccuracy(3, 1), 75);
  assert.equal(observedAccuracy(0, 0), 0);
});

test('confidence measures data volume, not student ability', () => {
  assert.equal(confidenceForAttemptCount(1), 'LOW');
  assert.equal(confidenceForAttemptCount(5), 'MEDIUM');
  assert.equal(confidenceForAttemptCount(20), 'HIGH');
});