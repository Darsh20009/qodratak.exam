import assert from 'node:assert/strict';
import test from 'node:test';
import {
  adaptLearningSessionPlan,
  buildLearningSessionPlan,
  publicTodayLearningSession,
  sessionScopeQuery,
  type LearningSessionPlan,
} from '../src/services/dailyLearningSessionService.ts';
import type { LearningRecommendation } from '../src/services/studentRecommendationService.ts';

const NOW = new Date('2026-09-18T12:00:00.000Z');
const PROGRAM = 'program.qudrat';
const SUBJECT = 'subject.qudrat.verbal';

function recommendation(
  type: LearningRecommendation['recommendationType'],
  overrides: Partial<LearningRecommendation> = {},
): LearningRecommendation {
  return {
    recommendationId: `learning-rec-${type.toLowerCase()}`,
    studentId: 'student-a',
    programId: PROGRAM,
    subjectId: SUBJECT,
    taxonomyNodeId: SUBJECT,
    recommendationType: type,
    priority: 80,
    priorityFactors: {
      base: 60,
      masteryWeakness: 5,
      repeatedError: 5,
      recency: 10,
      uncertainty: 0,
    },
    reasonCodes: ['RECENT_EVIDENCE'],
    evidence: {
      answeredEvidenceCount: 8,
      recentAnsweredEvidenceCount: 4,
      errorEvidenceCount: 2,
      recentErrorEvidenceCount: 2,
      trustworthyErrorCount: 2,
      errorTypes: ['CALCULATION_ERROR'],
      diagnosticState: 'ACTIVE',
      dataConfidence: 'HIGH',
    },
    confidence: 'MEDIUM',
    status: 'active',
    generatedAt: NOW,
    expiresAt: new Date('2026-09-25T12:00:00.000Z'),
    calculationVersion: 'phase-09-v1',
    ...overrides,
  };
}

function build(
  type: LearningRecommendation['recommendationType'],
  options: Parameters<typeof buildLearningSessionPlan>[2] = {},
) {
  return buildLearningSessionPlan(
    'student-a',
    recommendation(type),
    {
      now: NOW,
      dailyKey: '2026-09-18',
      foundationContentId: 'foundation-content-1',
      recentSessionCount: 1,
      ...options,
    },
  ) as LearningSessionPlan;
}

test('recommendation becomes a distinct session plan', () => {
  const plan = build('LEARN');
  assert.equal(plan.studentId, 'student-a');
  assert.equal(plan.recommendationType, 'LEARN');
  assert.match(plan.planId, /^learning-plan-/);
  assert.equal(plan.state, 'NOT_STARTED');
});

test('LEARN uses a short understand-to-check sequence', () => {
  const plan = build('LEARN');
  assert.deepEqual(
    plan.steps.map((step) => step.stepType),
    ['READ', 'EXAMPLE', 'PRACTICE', 'MASTERY_CHECK'],
  );
  assert.ok(plan.steps.every((step) => step.contentReference));
});

test('PRACTICE focuses on solving, correction, similarity, and checking', () => {
  const plan = build('PRACTICE');
  assert.deepEqual(
    plan.steps.map((step) => step.stepType),
    ['PRACTICE', 'CORRECT', 'SIMILAR', 'MASTERY_CHECK'],
  );
  assert.equal(plan.steps[0].contentReference.kind, 'question_selection_pending');
});

test('REVIEW does not reuse the LEARN plan blindly', () => {
  const plan = build('REVIEW');
  assert.deepEqual(plan.steps.map((step) => step.stepType), ['READ', 'PRACTICE', 'MASTERY_CHECK']);
});

test('RECOVERY_CHECK is recovery-oriented and avoids curriculum reset', () => {
  const plan = build('RECOVERY_CHECK');
  assert.deepEqual(plan.steps.map((step) => step.stepType), ['PRACTICE', 'PRACTICE', 'MASTERY_CHECK']);
  assert.match(plan.sessionReason, /عودة/);
});

test('DIAGNOSTIC never invents a question or lesson', () => {
  const plan = build('DIAGNOSTIC');
  assert.equal(plan.planStatus, 'DIAGNOSTIC_REQUIRED');
  assert.equal(plan.steps.length, 0);
  assert.equal(plan.nextStep, undefined);
});

test('LEARN reports CONTENT_UNAVAILABLE without pointing to fake content', () => {
  const plan = build('LEARN', { foundationContentId: undefined });
  assert.equal(plan.planStatus, 'CONTENT_UNAVAILABLE');
  assert.equal(plan.steps.length, 0);
  assert.equal(plan.estimatedMinutes, 0);
});

test('ready sessions remain within the 10–25 minute target and are not constant', () => {
  const short = build('RECOVERY_CHECK', { recentSessionCount: 3 });
  const longer = build('LEARN', { recentSessionCount: 0 });
  assert.ok(short.estimatedMinutes >= 10 && short.estimatedMinutes <= 25);
  assert.ok(longer.estimatedMinutes >= 10 && longer.estimatedMinutes <= 25);
  assert.notEqual(short.estimatedMinutes, longer.estimatedMinutes);
});

test('nextStep exposes only the first actionable step', () => {
  const plan = build('LEARN');
  assert.equal(plan.nextStep?.stepId, plan.steps[0].stepId);
  assert.equal(plan.nextStep?.stepType, 'READ');
});

test('resume keeps completed progress and advances nextStep', () => {
  const initial = build('LEARN');
  const resumed = build('LEARN', {
    existingState: 'IN_PROGRESS',
    progress: 25,
    stepProgress: [{
      stepId: initial.steps[0].stepId,
      status: 'COMPLETED',
    }],
  });
  assert.equal(resumed.state, 'IN_PROGRESS');
  assert.equal(resumed.progress, 25);
  assert.equal(resumed.steps[0].status, 'COMPLETED');
  assert.equal(resumed.nextStep?.stepType, 'EXAMPLE');
});

test('PAUSED state is preserved instead of restarting the plan', () => {
  const plan = build('PRACTICE', { existingState: 'PAUSED', progress: 25 });
  assert.equal(plan.state, 'PAUSED');
  assert.equal(plan.nextStep?.stepType, 'PRACTICE');
});

test('COMPLETED and ABANDONED states are explicit', () => {
  assert.equal(build('REVIEW', { existingState: 'COMPLETED', progress: 100 }).state, 'COMPLETED');
  assert.equal(build('REVIEW', { existingState: 'ABANDONED', progress: 30 }).state, 'ABANDONED');
});

test('one new error does not adapt the session', () => {
  const plan = build('PRACTICE');
  const adapted = adaptLearningSessionPlan(plan, { conceptErrorCount: 1 });
  assert.deepEqual(adapted, plan);
});

test('repeated concept evidence inserts one READ step before the next action', () => {
  const plan = build('PRACTICE');
  const adapted = adaptLearningSessionPlan(plan, { conceptErrorCount: 2 });
  assert.equal(adapted.steps.length, plan.steps.length + 1);
  assert.equal(adapted.steps[0].stepType, 'READ');
  assert.equal(adapted.steps[0].stepId, `${plan.planId}:adaptive-read`);
  assert.equal(adapted.steps[0].contentReference.availability, 'deferred');
});

test('adaptation is stable and does not insert a second READ step', () => {
  const plan = build('PRACTICE');
  const once = adaptLearningSessionPlan(plan, { conceptErrorCount: 2 });
  const twice = adaptLearningSessionPlan(once, { conceptErrorCount: 4 });
  assert.deepEqual(twice, once);
});

test('same recommendation, day, and evidence generate the same plan identity', () => {
  const first = build('LEARN');
  const second = build('LEARN');
  assert.equal(first.planId, second.planId);
  assert.deepEqual(first.steps, second.steps);
});

test('different recommendations do not share a plan identity', () => {
  assert.notEqual(build('LEARN').planId, build('PRACTICE').planId);
});

test('student ownership is embedded in the generated plan', () => {
  const plan = build('LEARN');
  assert.equal(plan.studentId, 'student-a');
  assert.notEqual(plan.studentId, 'student-b');
});

test('public output exposes next action and progress without recommendation internals', () => {
  const view = publicTodayLearningSession({
    sessionId: 'session-1',
    plan: build('LEARN'),
    started: true,
    duplicate: false,
  });
  const output = view as any;
  assert.equal(output.plan.nextStep.stepType, 'READ');
  assert.equal(output.plan.priority, undefined);
  assert.equal(output.plan.reasonCodes, undefined);
  assert.equal(output.plan.evidence, undefined);
});

test('no recommendation produces no executable plan', () => {
  const result = buildLearningSessionPlan('student-a', undefined, { now: NOW });
  assert.equal(result, null);
});

test('session steps use approved scopes or explicit deferred references, never random questions', () => {
  const plan = build('PRACTICE');
  assert.equal(
    plan.steps.some((step) => step.contentReference.kind === 'question_selection_pending'),
    true,
  );
  assert.equal(plan.steps.some((step) => step.contentReference.id === 'random'), false);
});

test('session plan does not contain mastery mutation fields', () => {
  const plan = build('MASTERY_CHECK');
  assert.equal((plan as any).masteryScore, undefined);
  assert.equal((plan as any).masteryUpdate, undefined);
});

test('all generated actionable steps start in a known state', () => {
  for (const type of ['LEARN', 'PRACTICE', 'REVIEW', 'RECOVERY_CHECK', 'MASTERY_CHECK'] as const) {
    const plan = build(type);
    assert.ok(plan.steps.every((step) => step.status === 'NOT_STARTED'));
  }
});

test('plan status remains explicit when a diagnostic recommendation is returned', () => {
  const plan = build('DIAGNOSTIC');
  assert.equal(plan.planStatus, 'DIAGNOSTIC_REQUIRED');
  assert.equal(plan.sessionReason, 'المحتوى التشخيصي مطلوب قبل اختيار نشاط محدد.');
});

test('session reuse scope includes the requested program and subject', () => {
  assert.deepEqual(sessionScopeQuery('student-a', '2026-09-18', PROGRAM, SUBJECT), {
    studentId: 'student-a',
    dailyKey: { $regex: '^today:2026-09-18:' },
    programId: PROGRAM,
    subjectId: SUBJECT,
  });
});