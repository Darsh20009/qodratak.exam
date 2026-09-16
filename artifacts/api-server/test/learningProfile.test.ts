import assert from 'node:assert/strict';
import test from 'node:test';
import {
  confidenceForAttemptCount,
  isSameIdempotentAttempt,
  learningAttemptSourceIdentity,
  normalizeLearningAttemptInput,
  observedAccuracy,
  verifyServerAnswer,
} from '../src/services/learningProfileService.ts';
import { ErrorLog } from '../src/mongodb/models.ts';
import {
  LEARNING_ERROR_TYPES,
  LearningErrorEvidence,
} from '../src/mongodb/learningProfileModels.ts';
import {
  inferLearningError,
  normalizeLearningErrorSelfReport,
} from '../src/services/learningErrorService.ts';

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

test('server answer verification calculates correctness from the answer key', () => {
  assert.deepEqual(verifyServerAnswer(2, 2, 4), {
    ok: true,
    isAnswered: true,
    isCorrect: true,
  });
  assert.deepEqual(verifyServerAnswer(1, 2, 4), {
    ok: true,
    isAnswered: true,
    isCorrect: false,
  });
});

test('unanswered questions are observations, not wrong answers', () => {
  assert.deepEqual(verifyServerAnswer(null, 2, 4), {
    ok: true,
    isAnswered: false,
    isCorrect: false,
  });
});

test('invalid answer indexes and malformed answer keys are rejected', () => {
  assert.deepEqual(verifyServerAnswer(4, 2, 4), { ok: false });
  assert.deepEqual(verifyServerAnswer(1, 4, 4), { ok: false });
  assert.deepEqual(verifyServerAnswer(1, 2, 0), { ok: false });
});

test('source identity keeps the same question distinct across sources', () => {
  const first = learningAttemptSourceIdentity('mongo_question', 'test-a', '42');
  const second = learningAttemptSourceIdentity('mongo_question', 'test-b', '42');
  const retry = learningAttemptSourceIdentity('mongo_question', 'test-a', '42');
  assert.notEqual(first, second);
  assert.equal(first, retry);
});

test('idempotency accepts the same payload and detects a source collision', () => {
  const sourceIdentity = learningAttemptSourceIdentity('mongo_question', 'test-a', '42');
  const existing = {
    sourceIdentity,
    selectedAnswer: 2,
    sessionId: 'session-a',
  };
  assert.equal(isSameIdempotentAttempt(existing, sourceIdentity, 2, 'session-a'), true);
  assert.equal(isSameIdempotentAttempt(existing, sourceIdentity, 1, 'session-a'), false);
  assert.equal(isSameIdempotentAttempt(existing, learningAttemptSourceIdentity('mongo_question', 'test-b', '42'), 2, 'session-a'), false);
});

test('retry identity is stable while a new attempt can be numbered separately', () => {
  const sourceIdentity = learningAttemptSourceIdentity('legacy_json', 'tahsili:exam-10:run-1', '7');
  const retryIdentity = learningAttemptSourceIdentity('legacy_json', 'tahsili:exam-10:run-1', '7');
  const secondRunIdentity = learningAttemptSourceIdentity('legacy_json', 'tahsili:exam-10:run-2', '7');
  assert.equal(sourceIdentity, retryIdentity);
  assert.notEqual(sourceIdentity, secondRunIdentity);
});

test('response time and learning-session linkage are validated at the boundary', () => {
  const invalidTime = normalizeLearningAttemptInput({
    questionId: 'question-1',
    programId: 'program.qudrat',
    isCorrect: false,
    responseTime: -1,
  });
  const invalidSession = normalizeLearningAttemptInput({
    questionId: 'question-1',
    programId: 'program.qudrat',
    isCorrect: false,
    sessionId: 'not-an-object-id',
  });
  assert.equal(invalidTime.ok, false);
  assert.equal(invalidSession.ok, false);
});

test('observed profile counters exclude unanswered questions from wrong counts', () => {
  assert.equal(observedAccuracy(1, 1), 50);
  assert.equal(observedAccuracy(1, 0), 100);
  assert.equal(observedAccuracy(0, 0), 0);
});

test('wrong answer without cause evidence stays UNKNOWN with low confidence', () => {
  const result = inferLearningError({
    isAnswered: true,
    isCorrect: false,
    responseTime: 20,
  });

  assert.equal(result.errorType, 'UNKNOWN');
  assert.equal(result.confidence, 'LOW');
  assert.equal(result.inferenceRule, 'wrong-answer-only');
  assert.equal(result.evidence.some((item) => item.type === 'wrong_answer'), true);
});

test('very low response time is only a low-confidence rushed signal', () => {
  const result = inferLearningError({
    isAnswered: true,
    isCorrect: false,
    responseTime: 2,
  });

  assert.equal(result.errorType, 'RUSHED');
  assert.equal(result.confidence, 'LOW');
  assert.equal(result.inferenceRule, 'low-response-time');
  assert.equal(result.evidence.some((item) => item.type === 'response_time'), true);
});

test('explicit guessing self-report maps to GUESS with traceable evidence', () => {
  const result = inferLearningError({
    isAnswered: true,
    isCorrect: false,
    responseTime: 18,
  }, 'guessing');

  assert.equal(result.errorType, 'GUESS');
  assert.equal(result.confidence, 'HIGH');
  assert.equal(result.inferenceRule, 'explicit-self-report');
  assert.equal(result.evidence.some((item) => item.type === 'self_report' && item.value === 'guessing'), true);
});

test('explicit calculation and concept reports map to their controlled categories', () => {
  const context = { isAnswered: true, isCorrect: false, responseTime: 18 };
  assert.equal(inferLearningError(context, 'calculation_mistake').errorType, 'CALCULATION_ERROR');
  assert.equal(inferLearningError(context, 'did_not_understand_concept').errorType, 'CONCEPT_GAP');
});

test('insufficient evidence and correct attempts do not become error judgments', () => {
  const unanswered = inferLearningError({
    isAnswered: false,
    isCorrect: false,
    responseTime: 0,
  });
  const correct = inferLearningError({
    isAnswered: true,
    isCorrect: true,
    responseTime: 18,
  });

  assert.deepEqual(
    { errorType: unanswered.errorType, confidence: unanswered.confidence },
    { errorType: 'UNKNOWN', confidence: 'LOW' },
  );
  assert.equal(correct.errorType, 'UNKNOWN');
  assert.equal(correct.evidence.some((item) => item.type === 'wrong_answer'), false);
  assert.equal(correct.evidence.some((item) => item.type === 'attempt_outcome' && item.value === true), true);
});

test('question metadata is evidence only and never invents a skill or concept', () => {
  const result = inferLearningError({
    isAnswered: true,
    isCorrect: false,
    responseTime: 18,
    questionMetadata: {
      category: 'quantitative',
      subcategory: 'الهندسة',
      topic: 'المثلثات',
      difficulty: 'intermediate',
      hasExplanation: true,
    },
  });

  assert.equal(result.errorType, 'UNKNOWN');
  assert.equal(result.evidence.some((item) => item.type === 'question_metadata' && item.value === 'الهندسة'), true);
  assert.equal(result.evidence.some((item) => String(item.value).includes('skill')), false);
});

test('self-report input is allowlisted and final confidence is server-derived', () => {
  assert.equal(normalizeLearningErrorSelfReport('guessing'), 'guessing');
  assert.equal(normalizeLearningErrorSelfReport('CONCEPT_GAP'), null);
  assert.equal(inferLearningError({
    isAnswered: true,
    isCorrect: false,
    responseTime: 20,
  }, 'not_sure').confidence, 'HIGH');
});

test('error taxonomy is finite and includes UNKNOWN', () => {
  assert.deepEqual(LEARNING_ERROR_TYPES, [
    'CONCEPT_GAP',
    'CALCULATION_ERROR',
    'READING_ERROR',
    'MISUNDERSTANDING',
    'WRONG_STRATEGY',
    'RUSHED',
    'GUESS',
    'CONFUSED_OPTIONS',
    'FAILED_TO_IDENTIFY_RELATION',
    'MEMORY_GAP',
    'PARTIAL_UNDERSTANDING',
    'TIME_PRESSURE',
    'UNKNOWN',
  ]);
  assert.deepEqual(LearningErrorEvidence.schema.path('attemptId')?.options.ref, 'LearningAttempt');
});

test('legacy ErrorLog remains a separate compatibility model', () => {
  assert.equal(ErrorLog.modelName, 'ErrorLog');
  assert.equal(ErrorLog.schema.path('questionId')?.options.required, true);
  assert.equal(ErrorLog.schema.path('subcategory')?.options.required, true);
  assert.equal(ErrorLog.schema.path('timestamp')?.options.index, true);
});