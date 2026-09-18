import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildLearningRecommendations,
  type RecommendationAttemptRecord,
  type RecommendationErrorRecord,
  type RecommendationMasteryRecord,
} from '../src/services/studentRecommendationService.ts';
import type { StudentDiagnosticDecision } from '../src/services/studentDiagnosticService.ts';

const NOW = new Date('2026-09-18T12:00:00.000Z');
const PROGRAM = 'program.qudrat';
const VERBAL = 'subject.qudrat.verbal';
const QUANTITATIVE = 'subject.qudrat.quantitative';

function activeDiagnostic(): StudentDiagnosticDecision {
  return {
    studentId: 'student-a',
    diagnosticState: 'ACTIVE',
    dataConfidence: 'HIGH',
    diagnosticRequired: false,
    diagnosticMode: 'NONE',
    scopes: [],
    reasonCodes: ['SUFFICIENT_RECENT_DATA'],
    signals: {
      answeredEvidenceCount: 12,
      recentAnsweredEvidenceCount: 6,
      errorEvidenceCount: 2,
      recentErrorEvidenceCount: 2,
      subjectsCovered: 2,
      approvedTaxonomyCoverage: 2,
      eligibleSubjectCount: 2,
      masteryConfidence: 'HIGH',
      masteryRecordsCount: 2,
      lastActivityAt: NOW,
      lastEvidenceAt: NOW,
      inactivityDays: 0,
      legacyDiagnosticPresent: false,
      lastProgramId: PROGRAM,
      lastSubjectId: VERBAL,
    },
    generatedAt: NOW,
    calculationVersion: 'phase-08-v1',
  };
}

function diagnosticRequired(
  state: 'NEW' | 'INSUFFICIENT_DATA' | 'RETURNING',
  scopeId = PROGRAM,
): StudentDiagnosticDecision {
  return {
    ...activeDiagnostic(),
    diagnosticState: state,
    dataConfidence: state === 'NEW' ? 'LOW' : 'MEDIUM',
    diagnosticRequired: true,
    diagnosticMode: state === 'RETURNING' ? 'RECOVERY' : state === 'NEW' ? 'FULL' : 'TARGETED',
    scopes: [{
      type: scopeId === PROGRAM ? 'PROGRAM' : 'SUBJECT',
      taxonomyNodeId: scopeId,
      programId: PROGRAM,
      subjectId: scopeId === PROGRAM ? undefined : scopeId,
      reasonCodes: state === 'RETURNING'
        ? ['RETURNED_AFTER_GAP', 'STALE_EVIDENCE']
        : ['INSUFFICIENT_EVIDENCE'],
    }],
    reasonCodes: state === 'RETURNING'
      ? ['RETURNED_AFTER_GAP', 'STALE_EVIDENCE']
      : ['INSUFFICIENT_EVIDENCE'],
  };
}

function attempts(
  subjectId: string,
  count: number,
  overrides: Partial<RecommendationAttemptRecord> = {},
): RecommendationAttemptRecord[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `${subjectId}-${index}`,
    programId: PROGRAM,
    subjectId,
    isAnswered: true,
    isCorrect: true,
    createdAt: NOW,
    ...overrides,
  }));
}

function mastery(
  subjectId: string,
  overrides: Partial<RecommendationMasteryRecord> = {},
): RecommendationMasteryRecord {
  return {
    taxonomyNodeId: subjectId,
    taxonomyNodeType: 'SUBJECT',
    programId: PROGRAM,
    subjectId,
    masteryScore: 75,
    masteryLevel: 'PROFICIENT',
    evidenceCount: 8,
    confidence: 'HIGH',
    lastAttemptAt: NOW,
    lastEvidenceAt: NOW,
    ...overrides,
  };
}

function errors(
  subjectId: string,
  errorType: RecommendationErrorRecord['errorType'],
  count: number,
  confidence: RecommendationErrorRecord['confidence'] = 'HIGH',
): RecommendationErrorRecord[] {
  return Array.from({ length: count }, (_, index) => ({
    attemptId: `${subjectId}-${index}`,
    programId: PROGRAM,
    subjectId,
    errorType,
    confidence,
    detectedAt: NOW,
  }));
}

function recommend(
  input: {
    attempts?: RecommendationAttemptRecord[];
    errorEvidence?: RecommendationErrorRecord[];
    mastery?: RecommendationMasteryRecord[];
    diagnostic?: StudentDiagnosticDecision;
  },
) {
  return buildLearningRecommendations('student-a', {
    diagnostic: input.diagnostic || activeDiagnostic(),
    attempts: input.attempts || [],
    errorEvidence: input.errorEvidence || [],
    mastery: input.mastery || [],
    requestedProgramId: PROGRAM,
    now: NOW,
  });
}

test('no reliable data produces DIAGNOSTIC, not an arbitrary learning action', () => {
  const result = recommend({
    diagnostic: diagnosticRequired('NEW'),
  });
  assert.equal(result.recommendations.length, 1);
  assert.equal(result.recommendations[0].recommendationType, 'DIAGNOSTIC');
  assert.equal(result.recommendations[0].priority, 96);
  assert.ok(result.recommendations[0].reasonCodes.includes('DIAGNOSTIC_REQUIRED'));
});

test('repeated conceptual evidence produces LEARN', () => {
  const result = recommend({
    attempts: attempts(VERBAL, 4, { isCorrect: false }),
    errorEvidence: errors(VERBAL, 'CONCEPT_GAP', 2),
    mastery: [mastery(VERBAL, {
      masteryScore: 35,
      masteryLevel: 'EMERGING',
      evidenceCount: 4,
      confidence: 'MEDIUM',
    })],
  });
  assert.equal(result.recommendations[0].recommendationType, 'LEARN');
  assert.ok(result.recommendations[0].reasonCodes.includes('REPEATED_CONCEPT_ERRORS'));
  assert.ok(result.recommendations[0].reasonCodes.includes('LOW_MASTERY'));
});

test('repeated procedural errors with existing understanding produce PRACTICE', () => {
  const result = recommend({
    attempts: attempts(QUANTITATIVE, 6),
    errorEvidence: errors(QUANTITATIVE, 'CALCULATION_ERROR', 2),
    mastery: [mastery(QUANTITATIVE, {
      masteryScore: 72,
      masteryLevel: 'PROFICIENT',
      evidenceCount: 6,
      confidence: 'MEDIUM',
    })],
  });
  assert.equal(result.recommendations[0].recommendationType, 'PRACTICE');
  assert.ok(result.recommendations[0].reasonCodes.includes('PROCEDURAL_ERROR_PATTERN'));
});

test('stale evidence produces REVIEW, while returning diagnostic produces RECOVERY_CHECK', () => {
  const old = new Date('2026-07-01T12:00:00.000Z');
  const review = recommend({
    attempts: attempts(VERBAL, 6, { createdAt: old }),
    mastery: [mastery(VERBAL, {
      lastAttemptAt: old,
      lastEvidenceAt: old,
      masteryScore: 78,
      masteryLevel: 'PROFICIENT',
      confidence: 'HIGH',
    })],
  });
  assert.equal(review.recommendations[0].recommendationType, 'REVIEW');
  assert.ok(review.recommendations[0].reasonCodes.includes('STALE_EVIDENCE'));

  const recovery = recommend({
    diagnostic: diagnosticRequired('RETURNING', VERBAL),
  });
  assert.equal(recovery.recommendations[0].recommendationType, 'RECOVERY_CHECK');
  assert.ok(recovery.recommendations[0].reasonCodes.includes('RETURNED_AFTER_GAP'));
});

test('near mastery with insufficient confidence produces MASTERY_CHECK', () => {
  const result = recommend({
    attempts: attempts(VERBAL, 5),
    mastery: [mastery(VERBAL, {
      masteryScore: 74,
      masteryLevel: 'PROFICIENT',
      evidenceCount: 5,
      confidence: 'MEDIUM',
    })],
  });
  assert.equal(result.recommendations[0].recommendationType, 'MASTERY_CHECK');
  assert.ok(result.recommendations[0].reasonCodes.includes('NEAR_MASTERY_LOW_CONFIDENCE'));
});

test('one isolated calculation error does not turn a strong subject into LEARN', () => {
  const result = recommend({
    attempts: attempts(VERBAL, 8),
    errorEvidence: errors(VERBAL, 'CALCULATION_ERROR', 1),
    mastery: [mastery(VERBAL, {
      masteryScore: 88,
      masteryLevel: 'MASTERED',
      evidenceCount: 8,
      confidence: 'HIGH',
    })],
  });
  assert.equal(result.recommendations.some((item) => item.recommendationType === 'LEARN'), false);
});

test('unknown-only evidence does not create an aggressive recommendation', () => {
  const result = recommend({
    attempts: attempts(VERBAL, 4, { isCorrect: false }),
    errorEvidence: errors(VERBAL, 'UNKNOWN', 3, 'LOW'),
    mastery: [mastery(VERBAL, {
      masteryScore: 40,
      masteryLevel: 'EMERGING',
      evidenceCount: 4,
      confidence: 'LOW',
    })],
  });
  assert.equal(result.recommendations.length, 0);
});

test('recommendation confidence stays separate from priority', () => {
  const result = recommend({
    attempts: attempts(VERBAL, 4, { isCorrect: false }),
    errorEvidence: errors(VERBAL, 'MISUNDERSTANDING', 2, 'HIGH'),
    mastery: [mastery(VERBAL, {
      masteryScore: 30,
      masteryLevel: 'EMERGING',
      evidenceCount: 4,
      confidence: 'MEDIUM',
    })],
  });
  const item = result.recommendations[0];
  assert.equal(item.confidence, 'MEDIUM');
  assert.equal(typeof item.priority, 'number');
  assert.notEqual(item.priority, confidenceRankForTest(item.confidence));
});

function confidenceRankForTest(confidence: 'LOW' | 'MEDIUM' | 'HIGH') {
  return confidence === 'HIGH' ? 3 : confidence === 'MEDIUM' ? 2 : 1;
}

test('priority is explainable through its factors and reason codes', () => {
  const result = recommend({
    attempts: attempts(VERBAL, 4, { isCorrect: false }),
    errorEvidence: errors(VERBAL, 'CONCEPT_GAP', 3),
    mastery: [mastery(VERBAL, {
      masteryScore: 30,
      masteryLevel: 'EMERGING',
      evidenceCount: 4,
      confidence: 'MEDIUM',
    })],
  });
  const item = result.recommendations[0];
  const factors = item.priorityFactors;
  assert.equal(
    item.priority,
    Math.min(100, factors.base +
      factors.masteryWeakness +
      factors.repeatedError +
      factors.recency +
      factors.uncertainty),
  );
  assert.ok(item.reasonCodes.includes('REPEATED_CONCEPT_ERRORS'));
  assert.ok(item.reasonCodes.includes('RECENT_EVIDENCE'));
});

test('same scope does not emit duplicate recommendations', () => {
  const result = recommend({
    attempts: [
      ...attempts(VERBAL, 4, { isCorrect: false }),
      ...attempts(VERBAL, 4, { isCorrect: false }),
    ],
    errorEvidence: [
      ...errors(VERBAL, 'CONCEPT_GAP', 2),
      ...errors(VERBAL, 'MISUNDERSTANDING', 2),
    ],
    mastery: [mastery(VERBAL, {
      masteryScore: 35,
      masteryLevel: 'EMERGING',
      evidenceCount: 8,
      confidence: 'MEDIUM',
    })],
  });
  assert.equal(result.recommendations.filter((item) => item.subjectId === VERBAL).length, 1);
});

test('changed evidence creates a new deterministic recommendation identity', () => {
  const base = recommend({
    attempts: attempts(VERBAL, 4, { isCorrect: false }),
    errorEvidence: errors(VERBAL, 'CONCEPT_GAP', 2),
    mastery: [mastery(VERBAL, {
      masteryScore: 35,
      masteryLevel: 'EMERGING',
      evidenceCount: 4,
      confidence: 'MEDIUM',
    })],
  });
  const changed = recommend({
    attempts: attempts(VERBAL, 5, { isCorrect: false }),
    errorEvidence: errors(VERBAL, 'CONCEPT_GAP', 3),
    mastery: [mastery(VERBAL, {
      masteryScore: 30,
      masteryLevel: 'EMERGING',
      evidenceCount: 5,
      confidence: 'MEDIUM',
    })],
  });
  assert.notEqual(
    base.recommendations[0].recommendationId,
    changed.recommendations[0].recommendationId,
  );
});

test('unapproved taxonomy cannot produce a deep recommendation', () => {
  const result = recommend({
    attempts: [{
      id: 'deep-1',
      programId: PROGRAM,
      subjectId: 'concept.qudrat.verbal.unknown',
      isAnswered: false,
      isCorrect: false,
      createdAt: NOW,
    }],
    mastery: [{
      ...mastery(VERBAL),
      taxonomyNodeId: 'concept.qudrat.verbal.unknown',
    }],
  });
  assert.equal(result.recommendations.some((item) => item.taxonomyNodeId?.startsWith('concept.')), false);
});

test('recommendations are scoped to the authenticated student identity', () => {
  const result = buildLearningRecommendations('student-a', {
    diagnostic: activeDiagnostic(),
    attempts: [],
    now: NOW,
  });
  assert.equal(result.studentId, 'student-a');
  assert.equal(result.recommendations.every((item) => item.studentId === 'student-a'), true);
});

test('same evidence and reference time produce the same recommendation', () => {
  const input = {
    attempts: attempts(VERBAL, 4, { isCorrect: false }),
    errorEvidence: errors(VERBAL, 'CONCEPT_GAP', 2),
    mastery: [mastery(VERBAL, {
      masteryScore: 35,
      masteryLevel: 'EMERGING',
      evidenceCount: 4,
      confidence: 'MEDIUM',
    })],
  };
  const first = recommend(input);
  const second = recommend(input);
  assert.deepEqual(first, second);
});

test('legacy recommendation fields are not rewritten by the new engine', () => {
  const result = recommend({
    diagnostic: diagnosticRequired('INSUFFICIENT_DATA', VERBAL),
  });
  assert.equal(result.recommendations[0].recommendationType, 'DIAGNOSTIC');
  assert.equal(result.diagnostic.calculationVersion, 'phase-08-v1');
});