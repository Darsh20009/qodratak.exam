import assert from 'node:assert/strict';
import test from 'node:test';
import {
  approvedMasteryNode,
  calculateMasterySnapshot,
  listApprovedMasteryNodes,
  recencyWeight,
  resolveMasteryNodeForAttempt,
  type MasteryAttemptInput,
} from '../src/services/masteryService.ts';

const NOW = new Date('2026-09-18T12:00:00.000Z');
const verbalNode = approvedMasteryNode('subject.qudrat.verbal')!;

function attempt(overrides: Partial<MasteryAttemptInput> = {}): MasteryAttemptInput {
  return {
    id: 'attempt-1',
    questionId: 'question-1',
    sourceIdentity: 'mongo_question:bank-a:question-1',
    programId: 'program.qudrat',
    subjectId: 'subject.qudrat.verbal',
    isAnswered: true,
    isCorrect: true,
    responseTime: 20,
    createdAt: NOW,
    ...overrides,
  };
}

test('only approved program and subject nodes can receive mastery', () => {
  const nodes = listApprovedMasteryNodes();
  assert.equal(nodes.some((node) => node.type === 'SKILL' || node.type === 'CONCEPT'), false);
  assert.equal(approvedMasteryNode('topic.qudrat.quantitative.geometry'), null);
  assert.equal(
    calculateMasterySnapshot(
      {
        code: 'topic.qudrat.quantitative.geometry',
        type: 'TOPIC',
        programId: 'program.qudrat',
        subjectId: 'subject.qudrat.quantitative',
        status: 'APPROVED',
      },
      [],
      [],
      NOW,
    ),
    null,
  );
});

test('one correct answer is evidence of progress, not MASTERED', () => {
  const result = calculateMasterySnapshot(verbalNode!, [attempt()], [], NOW)!;
  assert.equal(result.evidenceCount, 1);
  assert.equal(result.correctCount, 1);
  assert.equal(result.wrongCount, 0);
  assert.equal(result.masteryLevel, 'EMERGING');
  assert.ok(result.masteryScore > 50);
  assert.notEqual(result.masteryLevel, 'MASTERED');
});

test('repeated correct evidence increases the score gradually', () => {
  const one = calculateMasterySnapshot(verbalNode!, [attempt()], [], NOW)!;
  const three = calculateMasterySnapshot(
    verbalNode!,
    [0, 1, 2].map((index) => attempt({
      id: `correct-${index}`,
      questionId: `question-${index}`,
      sourceIdentity: `mongo_question:bank-${index}:question-${index}`,
    })),
    [],
    NOW,
  )!;
  assert.ok(three.masteryScore > one.masteryScore);
  assert.equal(three.masteryLevel, 'DEVELOPING');
});

test('one wrong answer does not make mastery zero and unanswered is excluded', () => {
  const result = calculateMasterySnapshot(
    verbalNode!,
    [
      attempt({ id: 'unanswered', isAnswered: false, isCorrect: false, selectedAnswer: null }),
      attempt({ id: 'wrong', isCorrect: false }),
    ],
    [{ attemptId: 'wrong', errorType: 'UNKNOWN', detectedAt: NOW }],
    NOW,
  )!;
  assert.equal(result.evidenceCount, 1);
  assert.equal(result.correctCount, 0);
  assert.equal(result.wrongCount, 1);
  assert.ok(result.masteryScore > 0);
  assert.equal(result.calculation.unknownErrorCount, 1);
});

test('repeated conceptual errors reduce mastery more than the same number of clean successes', () => {
  const errors = calculateMasterySnapshot(
    verbalNode!,
    [0, 1, 2].map((index) => attempt({
      id: `wrong-${index}`,
      questionId: `question-${index}`,
      sourceIdentity: `mongo_question:bank-${index}:question-${index}`,
      isCorrect: false,
    })),
    [0, 1, 2].map((index) => ({
      attemptId: `wrong-${index}`,
      errorType: 'CONCEPT_GAP' as const,
      detectedAt: NOW,
    })),
    NOW,
  )!;
  const successes = calculateMasterySnapshot(
    verbalNode!,
    [0, 1, 2].map((index) => attempt({
      id: `success-${index}`,
      questionId: `success-question-${index}`,
      sourceIdentity: `mongo_question:success-bank-${index}:question-${index}`,
    })),
    [],
    NOW,
  )!;
  assert.ok(errors.masteryScore < successes.masteryScore);
  assert.equal(errors.calculation.conceptErrorCount, 3);
});

test('concept evidence is more negative than a calculation error without equating them', () => {
  const concept = calculateMasterySnapshot(
    verbalNode!,
    [attempt({ id: 'concept-wrong', isCorrect: false })],
    [{ attemptId: 'concept-wrong', errorType: 'CONCEPT_GAP', confidence: 'HIGH', detectedAt: NOW }],
    NOW,
  )!;
  const calculation = calculateMasterySnapshot(
    verbalNode!,
    [attempt({ id: 'calculation-wrong', isCorrect: false })],
    [{ attemptId: 'calculation-wrong', errorType: 'CALCULATION_ERROR', confidence: 'HIGH', detectedAt: NOW }],
    NOW,
  )!;
  assert.ok(concept.masteryScore < calculation.masteryScore);
  assert.equal(concept.calculation.conceptErrorCount, 1);
  assert.equal(calculation.calculation.proceduralErrorCount, 1);
});

test('repeated, diverse recent evidence can reach MASTERED conservatively', () => {
  const attempts = Array.from({ length: 8 }, (_, index) => attempt({
    id: `correct-${index}`,
    questionId: `question-${index}`,
    sourceIdentity: `mongo_question:bank-${index}:question-${index}`,
  }));
  const result = calculateMasterySnapshot(verbalNode!, attempts, [], NOW)!;
  assert.equal(result.masteryLevel, 'MASTERED');
  assert.equal(result.confidence, 'HIGH');
  assert.equal(result.calculation.recentCorrectStreak, 8);
});

test('duplicate input records do not inflate evidence', () => {
  const duplicate = attempt();
  const result = calculateMasterySnapshot(verbalNode!, [duplicate, duplicate], [], NOW)!;
  assert.equal(result.evidenceCount, 1);
  assert.equal(result.correctCount, 1);
});

test('the same question can be repeated as separate attempts without collapsing valid evidence', () => {
  const result = calculateMasterySnapshot(
    verbalNode!,
    [
      attempt({ id: 'first', createdAt: new Date('2026-09-17T12:00:00.000Z') }),
      attempt({ id: 'second', createdAt: NOW }),
    ],
    [],
    NOW,
  )!;
  assert.equal(result.evidenceCount, 2);
  assert.equal(result.correctCount, 2);
});

test('approved taxonomy nodes remain separate', () => {
  const quantitativeNode = approvedMasteryNode('subject.qudrat.quantitative')!;
  const attempts = [
    attempt({ id: 'verbal', subjectId: 'subject.qudrat.verbal' }),
    attempt({
      id: 'quantitative',
      subjectId: 'subject.qudrat.quantitative',
      sourceIdentity: 'mongo_question:quantitative:question-1',
    }),
  ];
  assert.equal(calculateMasterySnapshot(verbalNode!, attempts, [], NOW)!.evidenceCount, 1);
  assert.equal(calculateMasterySnapshot(quantitativeNode!, attempts, [], NOW)!.evidenceCount, 1);
});

test('a mismatched subject is not silently reassigned to its program', () => {
  assert.equal(resolveMasteryNodeForAttempt({
    programId: 'program.qudrat',
    subjectId: 'subject.tahsili.math',
  }), null);
  assert.equal(resolveMasteryNodeForAttempt({
    programId: 'program.qudrat',
  })?.code, 'program.qudrat');
});

test('response time is not treated as a standalone mastery judgment', () => {
  const fast = calculateMasterySnapshot(verbalNode!, [attempt({ responseTime: 1 })], [], NOW)!;
  const slow = calculateMasterySnapshot(verbalNode!, [attempt({ responseTime: 300 })], [], NOW)!;
  assert.equal(fast.masteryScore, slow.masteryScore);
  assert.equal(fast.masteryLevel, slow.masteryLevel);
});

test('old evidence is discounted but does not disappear', () => {
  const old = calculateMasterySnapshot(
    verbalNode!,
    [attempt({ createdAt: new Date('2020-01-01T00:00:00.000Z') })],
    [],
    NOW,
  )!;
  assert.ok(old.calculation.correctWeight > 0);
  assert.ok(old.calculation.recencyFactor >= 0.25);
});

test('confidence rises only after enough evidence, with diversity required for HIGH', () => {
  const low = calculateMasterySnapshot(verbalNode!, [attempt()], [], NOW)!;
  const medium = calculateMasterySnapshot(
    verbalNode!,
    [0, 1, 2].map((index) => attempt({ id: `same-source-${index}` })),
    [],
    NOW,
  )!;
  const high = calculateMasterySnapshot(
    verbalNode!,
    [0, 1, 2, 3, 4, 5, 6, 7].map((index) => attempt({
      id: `diverse-${index}`,
      sourceIdentity: `source-${index}`,
    })),
    [],
    NOW,
  )!;
  assert.equal(low.confidence, 'LOW');
  assert.equal(medium.confidence, 'MEDIUM');
  assert.equal(high.confidence, 'HIGH');
});

test('recalculating the same evidence is deterministic', () => {
  const attempts = [
    attempt({ id: 'new-correct', createdAt: NOW }),
    attempt({
      id: 'old-wrong',
      isCorrect: false,
      createdAt: new Date('2026-08-19T12:00:00.000Z'),
    }),
  ];
  const evidence = [{
    attemptId: 'old-wrong',
    errorType: 'CALCULATION_ERROR' as const,
    detectedAt: NOW,
  }];
  const first = calculateMasterySnapshot(verbalNode!, attempts, evidence, NOW);
  const second = calculateMasterySnapshot(verbalNode!, attempts, evidence, NOW);
  assert.deepEqual(first, second);
});

test('recency is bounded and deterministic', () => {
  assert.equal(recencyWeight(NOW, NOW), 1);
  assert.equal(recencyWeight(new Date('2026-08-19T12:00:00.000Z'), NOW), 0.5);
  assert.equal(recencyWeight(new Date('2020-01-01T00:00:00.000Z'), NOW), 0.25);
});