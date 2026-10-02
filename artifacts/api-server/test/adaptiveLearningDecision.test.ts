import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildAdaptiveLearningDecision,
  canonicalSubjectToTahsiliLabel,
  type AdaptiveAttemptRecord,
  type AdaptiveErrorRecord,
  type AdaptiveMasteryRecord,
  type AdaptiveReviewRecord,
} from '../src/services/adaptiveLearningDecisionService.ts';
import type { StudentDiagnosticDecision } from '../src/services/studentDiagnosticService.ts';

const NOW = new Date('2026-09-18T12:00:00.000Z');
const PROGRAM = 'program.qudrat';
const VERBAL = 'subject.qudrat.verbal';
const QUANTITATIVE = 'subject.qudrat.quantitative';

test('maps canonical Tahsili subject IDs to stored Arabic labels', () => {
  assert.equal(canonicalSubjectToTahsiliLabel('subject.tahsili.math'), 'رياضيات');
  assert.equal(canonicalSubjectToTahsiliLabel('subject.tahsili.physics'), 'فيزياء');
  assert.equal(canonicalSubjectToTahsiliLabel('subject.tahsili.chemistry'), 'كيمياء');
  assert.equal(canonicalSubjectToTahsiliLabel('subject.tahsili.biology'), 'أحياء');
  assert.equal(canonicalSubjectToTahsiliLabel('subject.tahsili.environment'), 'علم البيئة');
});

test('does not map non-canonical or unknown subject IDs', () => {
  assert.equal(canonicalSubjectToTahsiliLabel('math'), undefined);
  assert.equal(canonicalSubjectToTahsiliLabel('subject.tahsili.unknown'), undefined);
  assert.equal(canonicalSubjectToTahsiliLabel(undefined), undefined);
});

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

function diagnostic(
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
  overrides: Partial<AdaptiveAttemptRecord> = {},
): AdaptiveAttemptRecord[] {
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

function errors(
  subjectId: string,
  errorType: AdaptiveErrorRecord['errorType'],
  count: number,
  confidence: AdaptiveErrorRecord['confidence'] = 'HIGH',
): AdaptiveErrorRecord[] {
  return Array.from({ length: count }, (_, index) => ({
    attemptId: `${subjectId}-${index}`,
    programId: PROGRAM,
    subjectId,
    errorType,
    confidence,
    detectedAt: NOW,
  }));
}

function mastery(
  subjectId: string,
  overrides: Partial<AdaptiveMasteryRecord> = {},
): AdaptiveMasteryRecord {
  return {
    taxonomyNodeId: subjectId,
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

function review(
  subjectId: string,
  overrides: Partial<AdaptiveReviewRecord> = {},
): AdaptiveReviewRecord {
  return {
    programId: PROGRAM,
    subjectId,
    due: true,
    overdue: false,
    priority: 80,
    retentionConfidence: 'LOW',
    reasonCodes: ['REVIEW_DUE'],
    ...overrides,
  };
}

function availability(
  subjectId: string,
  foundationContentAvailable = true,
  questionAvailable = true,
) {
  return [{
    programId: PROGRAM,
    subjectId,
    foundationContentAvailable,
    questionAvailable,
  }];
}

function decide(input: {
  diagnostic?: StudentDiagnosticDecision;
  attempts?: AdaptiveAttemptRecord[];
  errorEvidence?: AdaptiveErrorRecord[];
  mastery?: AdaptiveMasteryRecord[];
  reviewItems?: AdaptiveReviewRecord[];
  availability?: ReturnType<typeof availability>;
  requestedSubjectId?: string;
}) {
  return buildAdaptiveLearningDecision('student-a', {
    diagnostic: input.diagnostic || activeDiagnostic(),
    attempts: input.attempts || attempts(VERBAL, 6),
    errorEvidence: input.errorEvidence,
    mastery: input.mastery,
    reviewItems: input.reviewItems,
    availability: input.availability || availability(VERBAL),
    requestedProgramId: PROGRAM,
    requestedSubjectId: input.requestedSubjectId,
    now: NOW,
  });
}

test('NEW students receive DIAGNOSTIC without selecting a question', () => {
  const result = decide({ diagnostic: diagnostic('NEW') });
  assert.equal(result.decision, 'DIAGNOSTIC');
  assert.equal(result.reasonCode, 'NEW_STUDENT');
  assert.equal(result.nextAction.recommendationType, 'DIAGNOSTIC');
  assert.equal(result.nextAction.questionActivity, 'DIAGNOSTIC');
});

test('insufficient evidence receives DIAGNOSTIC instead of assumed learning', () => {
  const result = decide({ diagnostic: diagnostic('INSUFFICIENT_DATA', VERBAL) });
  assert.equal(result.decision, 'DIAGNOSTIC');
  assert.equal(result.reasonCode, 'INSUFFICIENT_DATA');
  assert.equal(result.confidence, 'MEDIUM');
});

test('returning students receive RECOVERY unless stronger evidence exists', () => {
  const result = decide({ diagnostic: diagnostic('RETURNING', VERBAL) });
  assert.equal(result.decision, 'RECOVERY');
  assert.equal(result.reasonCode, 'RETURNING_AFTER_GAP');
  assert.equal(result.nextAction.recommendationType, 'RECOVERY_CHECK');
});

test('repeated concept errors choose LEARN when foundation content exists', () => {
  const result = decide({
    errorEvidence: errors(VERBAL, 'CONCEPT_GAP', 2),
    mastery: [mastery(VERBAL, {
      masteryScore: 35,
      masteryLevel: 'EMERGING',
      confidence: 'MEDIUM',
    })],
  });
  assert.equal(result.decision, 'LEARN');
  assert.equal(result.reasonCode, 'REPEATED_CONCEPT_ERROR');
  assert.equal(result.nextAction.questionActivity, 'PRACTICE');
});

test('repeated concept errors fall back to PRACTICE without foundation content', () => {
  const result = decide({
    errorEvidence: errors(VERBAL, 'MISUNDERSTANDING', 2),
    availability: availability(VERBAL, false, true),
  });
  assert.equal(result.decision, 'PRACTICE');
  assert.equal(result.reasonCode, 'CONTENT_UNAVAILABLE');
});

test('repeated concept errors become explicit no-action when no fallback exists', () => {
  const result = decide({
    errorEvidence: errors(VERBAL, 'MEMORY_GAP', 2),
    availability: availability(VERBAL, false, false),
  });
  assert.equal(result.decision, 'NO_ACTIONABLE_CONTENT');
  assert.equal(result.reasonCode, 'CONTENT_UNAVAILABLE');
});

test('one procedural error chooses PRACTICE and does not become LEARN', () => {
  const result = decide({
    errorEvidence: errors(QUANTITATIVE, 'CALCULATION_ERROR', 1),
    mastery: [mastery(QUANTITATIVE, {
      masteryScore: 72,
      masteryLevel: 'PROFICIENT',
      confidence: 'MEDIUM',
    })],
    availability: availability(QUANTITATIVE),
    requestedSubjectId: QUANTITATIVE,
  });
  assert.equal(result.decision, 'PRACTICE');
  assert.equal(result.reasonCode, 'PRACTICE_AVAILABLE');
});

test('a single recent failure chooses PRACTICE without escalating to LEARN', () => {
  const result = decide({
    attempts: attempts(VERBAL, 5, { isCorrect: true }).concat(
      attempts(VERBAL, 1, { isCorrect: false }),
    ),
    availability: availability(VERBAL),
  });
  assert.equal(result.decision, 'PRACTICE');
  assert.equal(result.reasonCode, 'RECENT_FAILURE');
});

test('overdue review is selected deterministically for a stable subject', () => {
  const result = decide({
    reviewItems: [review(VERBAL, {
      overdue: true,
      reasonCodes: ['OVERDUE', 'LOW_RETENTION_CONFIDENCE'],
      priority: 90,
    })],
    mastery: [mastery(VERBAL, { masteryLevel: 'PROFICIENT' })],
  });
  assert.equal(result.decision, 'REVIEW');
  assert.equal(result.reasonCode, 'OVERDUE_REVIEW');
  assert.equal(result.nextAction.questionActivity, 'REVIEW');
});

test('low mastery chooses LEARN when content is available', () => {
  const result = decide({
    mastery: [mastery(VERBAL, {
      masteryScore: 42,
      masteryLevel: 'DEVELOPING',
    })],
  });
  assert.equal(result.decision, 'LEARN');
  assert.equal(result.reasonCode, 'LOW_MASTERY');
});

test('near mastery chooses MASTERY_CHECK with enough questions', () => {
  const result = decide({
    mastery: [mastery(VERBAL, {
      masteryScore: 74,
      masteryLevel: 'PROFICIENT',
      confidence: 'MEDIUM',
    })],
  });
  assert.equal(result.decision, 'MASTERY_CHECK');
  assert.equal(result.reasonCode, 'MASTERY_CHECK_READY');
});

test('mastered stable subjects can ADVANCE without rewriting mastery', () => {
  const result = decide({
    mastery: [mastery(VERBAL, {
      masteryScore: 92,
      masteryLevel: 'MASTERED',
      confidence: 'HIGH',
    })],
  });
  assert.equal(result.decision, 'ADVANCE');
  assert.equal(result.reasonCode, 'MASTERED_STABLE');
  assert.equal(result.confidence, 'HIGH');
});

test('mastered subjects without recent success receive a mastery check', () => {
  const old = new Date('2026-07-01T12:00:00.000Z');
  const result = decide({
    attempts: attempts(VERBAL, 4, { createdAt: old }),
    mastery: [mastery(VERBAL, {
      masteryScore: 92,
      masteryLevel: 'MASTERED',
      confidence: 'HIGH',
      lastAttemptAt: old,
      lastEvidenceAt: old,
    })],
  });
  assert.equal(result.decision, 'MASTERY_CHECK');
  assert.equal(result.reasonCode, 'MASTERY_CHECK_READY');
});

test('due review takes precedence over returning recovery for the same scope', () => {
  const result = decide({
    diagnostic: diagnostic('RETURNING', VERBAL),
    reviewItems: [review(VERBAL)],
  });
  assert.equal(result.decision, 'REVIEW');
  assert.equal(result.reasonCode, 'DUE_REVIEW');
});

test('same state, evidence, availability, and timestamp produce the same decision', () => {
  const input = {
    errorEvidence: errors(VERBAL, 'CONCEPT_GAP', 2),
    mastery: [mastery(VERBAL, { masteryScore: 35, masteryLevel: 'EMERGING' })],
  };
  assert.deepEqual(decide(input), decide(input));
});

test('deep taxonomy is not accepted as a client-selected scope', () => {
  assert.throws(
    () => buildAdaptiveLearningDecision('student-a', {
      diagnostic: activeDiagnostic(),
      attempts: [],
      availability: [],
      requestedProgramId: PROGRAM,
      requestedSubjectId: 'concept.qudrat.verbal.unknown',
      now: NOW,
    }),
    { code: 'INVALID_SUBJECT' },
  );
});

test('student and program are required server-side inputs', () => {
  assert.throws(
    () => buildAdaptiveLearningDecision('', {
      diagnostic: activeDiagnostic(),
      attempts: [],
      availability: [],
    }),
    { code: 'INVALID_STUDENT' },
  );
  assert.throws(
    () => buildAdaptiveLearningDecision('student-a', {
      diagnostic: activeDiagnostic(),
      attempts: [],
      availability: [],
      requestedProgramId: 'program.invalid',
    }),
    { code: 'INVALID_PROGRAM' },
  );
});