import { createHash } from 'node:crypto';
import mongoose from 'mongoose';
import { FoundationContent } from '../mongodb/models';
import {
  LearningAttempt,
  LearningErrorEvidence,
  LearningSession,
} from '../mongodb/learningProfileModels';
import {
  getStudentRecommendations,
  type LearningRecommendation,
  type RecommendationConfidence,
} from './studentRecommendationService';
import {
  getAdaptiveLearningDecision,
  type AdaptiveLearningDecision,
} from './adaptiveLearningDecisionService';
import { normalizeDiagnosticProgram } from './studentDiagnosticService';

export type LearningSessionStepType =
  | 'READ'
  | 'EXAMPLE'
  | 'PRACTICE'
  | 'REFLECT'
  | 'CORRECT'
  | 'SIMILAR'
  | 'MASTERY_CHECK';
export type LearningSessionStepStatus =
  | 'NOT_STARTED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'SKIPPED'
  | 'UNAVAILABLE';
export type LearningSessionState =
  | 'NOT_STARTED'
  | 'IN_PROGRESS'
  | 'PAUSED'
  | 'COMPLETED'
  | 'ABANDONED';
export type LearningSessionPlanStatus =
  | 'READY'
  | 'CONTENT_UNAVAILABLE'
  | 'DIAGNOSTIC_REQUIRED'
  | 'NO_RECOMMENDATION';

export interface LearningContentReference {
  kind: 'foundation_content' | 'approved_scope' | 'diagnostic_scope' | 'question_selection_pending' | 'question';
  id: string;
  programId: string;
  subjectId?: string;
  availability: 'available' | 'deferred' | 'required' | 'unavailable';
  sourceType?: string;
  sourceKey?: string;
  questionId?: string;
}

export interface LearningSessionStep {
  stepId: string;
  stepType: LearningSessionStepType;
  estimatedMinutes: number;
  status: LearningSessionStepStatus;
  contentReference: LearningContentReference;
}

export interface LearningSessionPlan {
  sessionId?: string;
  planId: string;
  studentId: string;
  programId: string;
  subjectId?: string;
  taxonomyNodeId?: string;
  recommendationId?: string;
  recommendationType?: LearningRecommendation['recommendationType'];
  title: string;
  estimatedMinutes: number;
  steps: LearningSessionStep[];
  sessionReason: string;
  confidence: RecommendationConfidence;
  generatedAt: Date;
  planStatus: LearningSessionPlanStatus;
  state: LearningSessionState;
  progress: number;
  nextStep?: LearningSessionStep;
}

export interface LearningSessionStepProgress {
  stepId: string;
  status: LearningSessionStepStatus;
  completedAt?: Date;
  durationSeconds?: number;
  attemptIds?: string[];
}

export interface TodayLearningSessionView {
  sessionId?: string;
  plan: LearningSessionPlan | null;
  started: boolean;
  duplicate: boolean;
}

export interface BuildLearningSessionPlanOptions {
  now?: Date;
  dailyKey?: string;
  foundationContentId?: string;
  foundationContentTitle?: string;
  recentSessionCount?: number;
  existingState?: LearningSessionState;
  progress?: number;
  stepProgress?: LearningSessionStepProgress[];
}

export interface SessionEvidenceUpdate {
  conceptErrorCount: number;
  proceduralErrorCount?: number;
}

export class DailyLearningSessionError extends Error {
  constructor(
    message: string,
    public readonly code:
      | 'INVALID_STUDENT'
      | 'INVALID_PROGRAM'
      | 'INVALID_SESSION'
      | 'INVALID_STEP'
      | 'SESSION_NOT_ACTIVE'
      | 'CONTENT_UNAVAILABLE'
      | 'ACTIVE_SESSION_EXISTS',
  ) {
    super(message);
    this.name = 'DailyLearningSessionError';
  }
}

const SESSION_PLAN_VERSION = 'phase-10-v1';
const SESSION_TIME_ZONE = 'Asia/Riyadh';
const MIN_SESSION_MINUTES = 10;
const MAX_SESSION_MINUTES = 25;

const STEP_TEMPLATES: Record<
  NonNullable<LearningRecommendation['recommendationType']>,
  Array<{ type: LearningSessionStepType; minutes: number; reference: LearningContentReference['kind'] }>
> = {
  LEARN: [
    { type: 'READ', minutes: 5, reference: 'foundation_content' },
    { type: 'EXAMPLE', minutes: 4, reference: 'foundation_content' },
    { type: 'PRACTICE', minutes: 6, reference: 'question_selection_pending' },
    { type: 'MASTERY_CHECK', minutes: 3, reference: 'question_selection_pending' },
  ],
  PRACTICE: [
    { type: 'PRACTICE', minutes: 6, reference: 'question_selection_pending' },
    { type: 'CORRECT', minutes: 4, reference: 'approved_scope' },
    { type: 'SIMILAR', minutes: 5, reference: 'question_selection_pending' },
    { type: 'MASTERY_CHECK', minutes: 3, reference: 'question_selection_pending' },
  ],
  REVIEW: [
    { type: 'READ', minutes: 5, reference: 'foundation_content' },
    { type: 'PRACTICE', minutes: 6, reference: 'question_selection_pending' },
    { type: 'MASTERY_CHECK', minutes: 3, reference: 'question_selection_pending' },
  ],
  RECOVERY_CHECK: [
    { type: 'PRACTICE', minutes: 5, reference: 'question_selection_pending' },
    { type: 'PRACTICE', minutes: 5, reference: 'question_selection_pending' },
    { type: 'MASTERY_CHECK', minutes: 3, reference: 'question_selection_pending' },
  ],
  DIAGNOSTIC: [],
  MASTERY_CHECK: [
    { type: 'MASTERY_CHECK', minutes: 8, reference: 'question_selection_pending' },
  ],
};

const SESSION_TITLES: Record<LearningRecommendation['recommendationType'], string> = {
  LEARN: 'ابنِ فهمًا أقوى في هذا المجال',
  PRACTICE: 'تدرّب على نمط الأخطاء المتكرر',
  REVIEW: 'راجع ما تعلمته سابقًا',
  RECOVERY_CHECK: 'استعد تدريجيًا بعد فترة التوقف',
  DIAGNOSTIC: 'نحتاج تقييمًا تشخيصيًا أولًا',
  MASTERY_CHECK: 'تحقق من ثبات إتقانك',
};

const SESSION_REASONS: Record<LearningRecommendation['recommendationType'], string> = {
  LEARN: 'جلسة قصيرة لبناء الفهم ثم التحقق منه.',
  PRACTICE: 'جلسة مركزة لتحسين طريقة الحل وتصحيح الأخطاء.',
  REVIEW: 'جلسة مراجعة قصيرة لتحديث الدليل على المعرفة.',
  RECOVERY_CHECK: 'جلسة عودة تدريجية دون البدء من أول المنهج.',
  DIAGNOSTIC: 'المحتوى التشخيصي مطلوب قبل اختيار نشاط محدد.',
  MASTERY_CHECK: 'جلسة تحقق قصيرة قبل اعتبار الإتقان ثابتًا.',
};

function asDate(value: Date | string | undefined): Date | undefined {
  if (!value) return undefined;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isFinite(date.getTime()) ? date : undefined;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function planHash(input: string): string {
  return createHash('sha256').update(input).digest('hex').slice(0, 24);
}

function dayKey(now: Date): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: SESSION_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function dailyKeyFor(day: string, programId: string): string {
  return `today:${day}:${programId}`;
}

function normalizedProgram(value: string | undefined): string | undefined {
  return value ? normalizeDiagnosticProgram(value) : undefined;
}

function scopeReference(
  recommendation: LearningRecommendation,
  kind: LearningContentReference['kind'],
  foundationContentId?: string,
): LearningContentReference {
  const id = kind === 'foundation_content'
    ? foundationContentId
    : recommendation.taxonomyNodeId || recommendation.programId;
  return {
    kind,
    id: id || recommendation.programId,
    programId: recommendation.programId,
    subjectId: recommendation.subjectId,
    availability: kind === 'foundation_content'
      ? 'available'
      : kind === 'diagnostic_scope'
        ? 'required'
        : 'deferred',
  };
}

function sessionMinutes(
  recommendationType: LearningRecommendation['recommendationType'],
  confidence: RecommendationConfidence,
  recentSessionCount: number,
): number {
  const base = STEP_TEMPLATES[recommendationType]
    .reduce((total, step) => total + step.minutes, 0);
  const confidenceAdjustment = confidence === 'LOW' ? -1 : confidence === 'HIGH' ? 1 : 0;
  const historyAdjustment = recentSessionCount >= 3 ? -2 : recentSessionCount === 0 ? 1 : 0;
  return clamp(base + confidenceAdjustment + historyAdjustment, MIN_SESSION_MINUTES, MAX_SESSION_MINUTES);
}

function progressForSteps(steps: LearningSessionStep[]): number {
  if (steps.length === 0) return 0;
  const completed = steps.filter((step) => step.status === 'COMPLETED' || step.status === 'SKIPPED').length;
  return Math.round((completed / steps.length) * 100);
}

function nextStepFor(steps: LearningSessionStep[]): LearningSessionStep | undefined {
  return steps.find((step) => step.status === 'NOT_STARTED' || step.status === 'IN_PROGRESS');
}

function stateFromProgress(
  current: LearningSessionState | undefined,
  steps: LearningSessionStep[],
  progress: number,
): LearningSessionState {
  if (current === 'PAUSED' || current === 'ABANDONED' || current === 'COMPLETED') return current;
  if (steps.length > 0 && progress >= 100) return 'COMPLETED';
  return current || 'NOT_STARTED';
}

function createSteps(
  recommendation: LearningRecommendation,
  foundationContentId: string | undefined,
): LearningSessionStep[] {
  return STEP_TEMPLATES[recommendation.recommendationType].map((template, index) => ({
    stepId: `${recommendation.recommendationId || recommendation.programId}:step-${index + 1}`,
    stepType: template.type,
    estimatedMinutes: template.minutes,
    status: 'NOT_STARTED',
    contentReference: scopeReference(recommendation, template.reference, foundationContentId),
  }));
}

export function buildLearningSessionPlan(
  studentId: string,
  recommendation: LearningRecommendation | undefined,
  options: BuildLearningSessionPlanOptions = {},
): LearningSessionPlan | null {
  if (!String(studentId || '').trim()) {
    throw new DailyLearningSessionError('studentId غير صالح', 'INVALID_STUDENT');
  }
  if (!recommendation) return null;

  const now = options.now || new Date();
  const daily = options.dailyKey || dayKey(now);
  const planId = `learning-plan-${planHash([
    SESSION_PLAN_VERSION,
    studentId,
    daily,
    recommendation.recommendationId,
  ].join('|'))}`;
  const title = SESSION_TITLES[recommendation.recommendationType];
  const sessionReason = SESSION_REASONS[recommendation.recommendationType];
  let planStatus: LearningSessionPlanStatus = 'READY';
  let steps: LearningSessionStep[] = [];

  if (recommendation.recommendationType === 'DIAGNOSTIC') {
    planStatus = 'DIAGNOSTIC_REQUIRED';
  } else if (
    (recommendation.recommendationType === 'LEARN' || recommendation.recommendationType === 'REVIEW') &&
    !options.foundationContentId
  ) {
    planStatus = 'CONTENT_UNAVAILABLE';
  } else {
    steps = createSteps(recommendation, options.foundationContentId);
  }

  const stepProgress = options.stepProgress || [];
  const hydratedSteps = steps.map((step) => {
    const saved = stepProgress.find((progress) => progress.stepId === step.stepId);
    return saved ? { ...step, status: saved.status } : step;
  });
  const progress = options.progress ?? progressForSteps(hydratedSteps);
  const state = stateFromProgress(options.existingState, hydratedSteps, progress);
  const estimatedMinutes = planStatus === 'READY'
    ? sessionMinutes(recommendation.recommendationType, recommendation.confidence, options.recentSessionCount || 0)
    : 0;

  return {
    planId,
    studentId,
    programId: recommendation.programId,
    subjectId: recommendation.subjectId,
    taxonomyNodeId: recommendation.taxonomyNodeId,
    recommendationId: recommendation.recommendationId,
    recommendationType: recommendation.recommendationType,
    title,
    estimatedMinutes,
    steps: hydratedSteps,
    sessionReason,
    confidence: recommendation.confidence,
    generatedAt: now,
    planStatus,
    state,
    progress,
    nextStep: nextStepFor(hydratedSteps),
  };
}

export function adaptLearningSessionPlan(
  plan: LearningSessionPlan,
  evidence: SessionEvidenceUpdate,
): LearningSessionPlan {
  if (plan.planStatus !== 'READY' || evidence.conceptErrorCount < 2) return plan;
  if (
    plan.steps.some((step) =>
      step.stepId.endsWith(':adaptive-read') || step.stepType === 'READ' || step.stepType === 'EXAMPLE'
    )
  ) return plan;
  const insertionIndex = plan.steps.findIndex((step) =>
    step.status === 'NOT_STARTED' || step.status === 'IN_PROGRESS'
  );
  if (insertionIndex < 0) return plan;
  const adaptiveStep: LearningSessionStep = {
    stepId: `${plan.planId}:adaptive-read`,
    stepType: 'READ',
    estimatedMinutes: 4,
    status: 'NOT_STARTED',
    contentReference: {
      kind: 'approved_scope',
      id: plan.subjectId || plan.programId,
      programId: plan.programId,
      subjectId: plan.subjectId,
      availability: 'deferred',
    },
  };
  const steps = [...plan.steps];
  steps.splice(insertionIndex, 0, adaptiveStep);
  return {
    ...plan,
    steps,
    estimatedMinutes: clamp(plan.estimatedMinutes + 4, MIN_SESSION_MINUTES, MAX_SESSION_MINUTES),
    progress: progressForSteps(steps),
    nextStep: nextStepFor(steps),
  };
}

function planFromSession(session: any): LearningSessionPlan | null {
  if (!session.planSnapshot) return null;
  const snapshot = session.planSnapshot as LearningSessionPlan;
  const steps = Array.isArray(snapshot.steps) ? snapshot.steps.map((step) => ({ ...step })) : [];
  const stepProgress = Array.isArray(session.stepProgress) ? session.stepProgress : [];
  const hydratedSteps = steps.map((step) => {
    const saved = stepProgress.find((progress: LearningSessionStepProgress) => progress.stepId === step.stepId);
    return saved ? { ...step, status: saved.status } : step;
  });
  const progress = Number.isFinite(Number(session.progress))
    ? Number(session.progress)
    : progressForSteps(hydratedSteps);
  return {
    ...snapshot,
    sessionId: String(session._id),
    state: session.sessionState || (session.status === 'completed' ? 'COMPLETED' : session.status === 'abandoned' ? 'ABANDONED' : 'IN_PROGRESS'),
    progress,
    steps: hydratedSteps,
    nextStep: nextStepFor(hydratedSteps),
  };
}

async function foundationContent(programId: string) {
  const program = programId.replace(/^program\./, '') as 'qudrat' | 'tahsili';
  return FoundationContent.findOne({ program, published: true })
    .sort({ order: 1 })
    .select('_id title')
    .lean();
}

async function recentSessionCount(studentId: string, programId: string): Promise<number> {
  const cutoff = new Date(Date.now() - 7 * 86400000);
  return LearningSession.countDocuments({
    studentId,
    programId,
    startedAt: { $gte: cutoff },
  });
}

async function currentSession(studentId: string, day: string, programId?: string) {
  const query: Record<string, unknown> = {
    studentId,
    dailyKey: { $regex: `^today:${day}:` },
  };
  if (programId) query.programId = programId;
  return LearningSession.findOne(query).sort({ updatedAt: -1 }).lean();
}

async function activeSession(studentId: string, day: string) {
  return LearningSession.findOne({
    studentId,
    dailyKey: { $regex: `^today:${day}:` },
    status: 'active',
    sessionState: { $in: ['IN_PROGRESS', 'PAUSED'] },
  }).sort({ updatedAt: -1 });
}

async function buildPlanForStudent(
  studentId: string,
  recommendation: LearningRecommendation | undefined,
  now: Date,
  daily: string,
) {
  if (!recommendation) return null;
  const content = recommendation.recommendationType === 'LEARN' || recommendation.recommendationType === 'REVIEW'
    ? await foundationContent(recommendation.programId)
    : undefined;
  const count = await recentSessionCount(studentId, recommendation.programId);
  return buildLearningSessionPlan(studentId, recommendation, {
    now,
    dailyKey: daily,
    foundationContentId: content?._id ? String(content._id) : undefined,
    foundationContentTitle: content?.title,
    recentSessionCount: count,
  });
}

export async function getTodayLearningSession(
  studentId: string,
  requestedProgramId?: string,
): Promise<TodayLearningSessionView> {
  if (!String(studentId || '').trim()) {
    throw new DailyLearningSessionError('studentId غير صالح', 'INVALID_STUDENT');
  }
  const programId = normalizedProgram(requestedProgramId);
  if (requestedProgramId && !programId) {
    throw new DailyLearningSessionError('البرنامج غير صالح', 'INVALID_PROGRAM');
  }
  const now = new Date();
  const daily = dayKey(now);
  const active = await activeSession(studentId, daily);
  const existing = active || await currentSession(studentId, daily, programId);
  if (existing) {
    return {
      sessionId: String(existing._id),
      plan: planFromSession(existing),
      started: true,
      duplicate: true,
    };
  }
  const [adaptiveDecision, recommendationResult] = await Promise.all([
    getAdaptiveLearningDecision(studentId, { programId }),
    getStudentRecommendations(studentId, programId),
  ]);
  const requestedType = adaptiveDecision.nextAction.recommendationType;
  const recommendation = requestedType
    ? recommendationResult.recommendations.find((item) => item.recommendationType === requestedType) ||
      recommendationResult.recommendations[0]
    : recommendationResult.recommendations[0];
  return {
    plan: await buildPlanForStudent(studentId, recommendation, now, daily),
    started: false,
    duplicate: false,
  };
}

export async function startTodayLearningSession(
  studentId: string,
  requestedProgramId?: string,
): Promise<TodayLearningSessionView> {
  const initial = await getTodayLearningSession(studentId, requestedProgramId);
  if (initial.started && initial.sessionId) {
    const session = await LearningSession.findOne({ _id: initial.sessionId, studentId });
    if (session && session.status === 'active' && session.sessionState === 'PAUSED') {
      session.sessionState = 'IN_PROGRESS';
      await session.save();
      return {
        sessionId: String(session._id),
        plan: planFromSession(session),
        started: true,
        duplicate: true,
      };
    }
    return initial;
  }
  const plan = initial.plan;
  if (!plan || plan.planStatus !== 'READY') return initial;
  const now = new Date();
  const daily = dayKey(now);
  const existingActive = await activeSession(studentId, daily);
  if (existingActive) {
    return {
      sessionId: String(existingActive._id),
      plan: planFromSession(existingActive),
      started: true,
      duplicate: true,
    };
  }
  const dailyKey = dailyKeyFor(daily, plan.programId);
  const stepProgress = plan.steps.map((step) => ({
    stepId: step.stepId,
    status: step.status,
  }));
  try {
    const session = await LearningSession.create({
      studentId,
      programId: plan.programId,
      subjectId: plan.subjectId,
      status: 'active',
      sessionState: 'IN_PROGRESS',
      dailyKey,
      idempotencyKey: dailyKey,
      planId: plan.planId,
      recommendationId: plan.recommendationId,
      recommendationType: plan.recommendationType,
      title: plan.title,
      estimatedMinutes: plan.estimatedMinutes,
      sessionReason: plan.sessionReason,
      planConfidence: plan.confidence,
      planStatus: plan.planStatus,
      planSnapshot: plan as unknown as Record<string, unknown>,
      currentStepIndex: 0,
      progress: 0,
      stepProgress,
    });
    return {
      sessionId: String(session._id),
      plan: planFromSession(session),
      started: true,
      duplicate: false,
    };
  } catch (error: any) {
    if (error?.code === 11000) {
      const duplicate = await LearningSession.findOne({ studentId, dailyKey });
      if (duplicate) {
        return {
          sessionId: String(duplicate._id),
          plan: planFromSession(duplicate),
          started: true,
          duplicate: true,
        };
      }
    }
    throw error;
  }
}

export async function updateTodayLearningStep(
  studentId: string,
  input: {
    sessionId: string;
    stepId?: string;
    action: 'complete' | 'pause' | 'resume' | 'skip';
    durationSeconds?: number;
    attemptIds?: string[];
  },
): Promise<TodayLearningSessionView> {
  if (!mongoose.Types.ObjectId.isValid(input.sessionId)) {
    throw new DailyLearningSessionError('sessionId غير صالح', 'INVALID_SESSION');
  }
  const session = await LearningSession.findOne({ _id: input.sessionId, studentId });
  if (!session) throw new DailyLearningSessionError('جلسة التعلم غير موجودة', 'INVALID_SESSION');
  if (session.status !== 'active') {
    return {
      sessionId: String(session._id),
      plan: planFromSession(session),
      started: true,
      duplicate: true,
    };
  }
  if (input.action === 'pause' || input.action === 'resume') {
    session.sessionState = input.action === 'pause' ? 'PAUSED' : 'IN_PROGRESS';
    await session.save();
    return {
      sessionId: String(session._id),
      plan: planFromSession(session),
      started: true,
      duplicate: false,
    };
  }
  if (!input.stepId) {
    throw new DailyLearningSessionError('stepId مطلوب', 'INVALID_STEP');
  }
  const snapshot = planFromSession(session);
  if (!snapshot) throw new DailyLearningSessionError('خطة الجلسة غير موجودة', 'INVALID_SESSION');
  const stepIndex = snapshot.steps.findIndex((step) => step.stepId === input.stepId);
  if (stepIndex < 0) throw new DailyLearningSessionError('الخطوة غير موجودة', 'INVALID_STEP');
  const currentProgress = Array.isArray(session.stepProgress) ? session.stepProgress : [];
  const existingProgress = currentProgress.find((progress) => progress.stepId === input.stepId);
  if (existingProgress?.status === 'COMPLETED' || existingProgress?.status === 'SKIPPED') {
    return {
      sessionId: String(session._id),
      plan: snapshot,
      started: true,
      duplicate: true,
    };
  }
  const attemptIds = Array.from(new Set((input.attemptIds || []).map(String))).slice(0, 20);
  if (attemptIds.length > 0) {
    const ownedAttempts = await LearningAttempt.countDocuments({
      _id: { $in: attemptIds },
      studentId,
      sessionId: session._id,
    });
    if (ownedAttempts !== attemptIds.length) {
      throw new DailyLearningSessionError('المحاولات لا تنتمي إلى جلسة الطالب', 'INVALID_STEP');
    }
  }
  const status: LearningSessionStepStatus = input.action === 'skip' ? 'SKIPPED' : 'COMPLETED';
  const updatedProgress: LearningSessionStepProgress[] = currentProgress.map((progress) => ({ ...progress }));
  const progressIndex = updatedProgress.findIndex((progress) => progress.stepId === input.stepId);
  const nextProgress: LearningSessionStepProgress = {
    stepId: input.stepId,
    status,
    completedAt: new Date(),
    durationSeconds: Math.max(0, Number(input.durationSeconds || 0)),
    attemptIds,
  };
  if (progressIndex >= 0) updatedProgress[progressIndex] = nextProgress;
  else updatedProgress.push(nextProgress);
  const completedCount = updatedProgress.filter((progress) =>
    progress.status === 'COMPLETED' || progress.status === 'SKIPPED'
  ).length;
  const progressValue = snapshot.steps.length > 0
    ? Math.round((completedCount / snapshot.steps.length) * 100)
    : 0;
  const nextIndex = snapshot.steps.findIndex((step, index) =>
    index > stepIndex &&
    !['COMPLETED', 'SKIPPED'].includes(updatedProgress.find((progress) => progress.stepId === step.stepId)?.status || step.status)
  );
  session.stepProgress = updatedProgress as any;
  session.currentStepIndex = nextIndex >= 0 ? nextIndex : snapshot.steps.length;
  session.progress = progressValue;
  session.sessionState = 'IN_PROGRESS';
  const errorRecords = attemptIds.length > 0
    ? await LearningErrorEvidence.find({
      studentId,
      attemptId: { $in: attemptIds },
    }).select('errorType confidence').lean()
    : [];
  const conceptErrorCount = errorRecords.filter((error: any) =>
    ['CONCEPT_GAP', 'MISUNDERSTANDING', 'MEMORY_GAP', 'PARTIAL_UNDERSTANDING'].includes(error.errorType) &&
    error.confidence !== 'LOW'
  ).length;
  const adapted = adaptLearningSessionPlan(snapshot, { conceptErrorCount });
  session.planSnapshot = adapted as unknown as Record<string, unknown>;
  session.estimatedMinutes = adapted.estimatedMinutes;
  await session.save();
  return {
    sessionId: String(session._id),
    plan: planFromSession(session),
    started: true,
    duplicate: false,
  };
}

export async function completeTodayLearningSession(
  studentId: string,
  sessionId?: string,
  state: 'completed' | 'abandoned' = 'completed',
): Promise<TodayLearningSessionView | null> {
  let session;
  if (sessionId) {
    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      throw new DailyLearningSessionError('sessionId غير صالح', 'INVALID_SESSION');
    }
    session = await LearningSession.findOne({ _id: sessionId, studentId });
  } else {
    session = await activeSession(studentId, dayKey(new Date()));
  }
  if (!session) return null;
  if (session.status !== 'active') {
    return {
      sessionId: String(session._id),
      plan: planFromSession(session),
      started: true,
      duplicate: true,
    };
  }
  const endedAt = new Date();
  session.status = state === 'abandoned' ? 'abandoned' : 'completed';
  session.sessionState = state === 'abandoned' ? 'ABANDONED' : 'COMPLETED';
  session.endedAt = endedAt;
  session.duration = Math.max(0, Math.round((endedAt.getTime() - session.startedAt.getTime()) / 1000));
  await session.save();
  return {
    sessionId: String(session._id),
    plan: planFromSession(session),
    started: true,
    duplicate: false,
  };
}

export function publicTodayLearningSession(view: TodayLearningSessionView) {
  return {
    sessionId: view.sessionId,
    started: view.started,
    duplicate: view.duplicate,
    plan: view.plan
      ? {
        sessionId: view.plan.sessionId,
        planId: view.plan.planId,
        studentId: view.plan.studentId,
        programId: view.plan.programId,
        subjectId: view.plan.subjectId,
        recommendationType: view.plan.recommendationType,
        title: view.plan.title,
        estimatedMinutes: view.plan.estimatedMinutes,
        steps: view.plan.steps,
        sessionReason: view.plan.sessionReason,
        confidence: view.plan.confidence,
        generatedAt: view.plan.generatedAt,
        planStatus: view.plan.planStatus,
        state: view.plan.state,
        progress: view.plan.progress,
        nextStep: view.plan.nextStep,
      }
      : null,
  };
}