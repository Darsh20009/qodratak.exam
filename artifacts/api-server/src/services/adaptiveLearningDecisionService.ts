import {
  FoundationContent,
  Question,
  TahsiliQuestion,
} from '../mongodb/models';
import {
  LearningAttempt,
  LearningErrorEvidence,
  StudentMastery,
  type LearningErrorConfidence,
  type LearningErrorType,
  type MasteryLevel,
} from '../mongodb/learningProfileModels';
import {
  LearningReviewItem,
  type LearningRetentionConfidence,
  type LearningReviewReasonCode,
} from '../mongodb/learningReviewModels';
import {
  type StudentDiagnosticDecision,
  getStudentDiagnosticDecision,
  normalizeDiagnosticProgram,
} from './studentDiagnosticService';
import { listApprovedMasteryNodes } from './masteryService';

export type AdaptiveDecisionType =
  | 'DIAGNOSTIC'
  | 'LEARN'
  | 'PRACTICE'
  | 'CORRECT'
  | 'SIMILAR'
  | 'REVIEW'
  | 'RECOVERY'
  | 'MASTERY_CHECK'
  | 'ADVANCE'
  | 'NO_ACTIONABLE_CONTENT';

export type AdaptiveDecisionConfidence = 'LOW' | 'MEDIUM' | 'HIGH';

export type AdaptiveReasonCode =
  | 'NEW_STUDENT'
  | 'INSUFFICIENT_DATA'
  | 'RETURNING_AFTER_GAP'
  | 'REPEATED_CONCEPT_ERROR'
  | 'RECENT_FAILURE'
  | 'LOW_MASTERY'
  | 'DUE_REVIEW'
  | 'OVERDUE_REVIEW'
  | 'NEAR_MASTERY'
  | 'MASTERED_STABLE'
  | 'ADVANCE_READY'
  | 'CONTENT_UNAVAILABLE'
  | 'PRACTICE_AVAILABLE'
  | 'PRACTICE_UNAVAILABLE'
  | 'MASTERY_CHECK_READY'
  | 'DIAGNOSTIC_REQUIRED';

export interface AdaptiveDecisionScope {
  type: 'PROGRAM' | 'SUBJECT';
  programId: string;
  subjectId?: string;
  taxonomyNodeId?: string;
}

export interface AdaptiveLearningDecision {
  studentId: string;
  decision: AdaptiveDecisionType;
  reasonCode: AdaptiveReasonCode;
  reason: string;
  confidence: AdaptiveDecisionConfidence;
  scope: AdaptiveDecisionScope;
  nextAction: {
    recommendationType:
      | 'DIAGNOSTIC'
      | 'LEARN'
      | 'PRACTICE'
      | 'REVIEW'
      | 'RECOVERY_CHECK'
      | 'MASTERY_CHECK'
      | undefined;
    questionActivity:
      | 'DIAGNOSTIC'
      | 'PRACTICE'
      | 'REVIEW'
      | 'RECOVERY_CHECK'
      | 'MASTERY_CHECK'
      | 'RETRY'
      | undefined;
  };
  diagnosticState: StudentDiagnosticDecision['diagnosticState'];
  generatedAt: Date;
  calculationVersion: string;
}

export interface AdaptiveAttemptRecord {
  id?: string;
  programId: string;
  subjectId?: string;
  isAnswered: boolean;
  isCorrect: boolean;
  createdAt: Date | string;
}

export interface AdaptiveErrorRecord {
  attemptId?: string;
  programId: string;
  subjectId?: string;
  errorType: LearningErrorType;
  confidence: LearningErrorConfidence;
  detectedAt: Date | string;
}

export interface AdaptiveMasteryRecord {
  taxonomyNodeId: string;
  programId: string;
  subjectId?: string;
  masteryScore: number;
  masteryLevel: MasteryLevel;
  evidenceCount: number;
  confidence: LearningErrorConfidence;
  lastAttemptAt?: Date | string;
  lastEvidenceAt?: Date | string;
}

export interface AdaptiveReviewRecord {
  programId: string;
  subjectId?: string;
  taxonomyNodeId?: string;
  due: boolean;
  overdue: boolean;
  priority: number;
  retentionConfidence: LearningRetentionConfidence;
  reasonCodes: LearningReviewReasonCode[];
  masteryLevel?: MasteryLevel;
}

export interface AdaptiveAvailability {
  programId: string;
  subjectId?: string;
  foundationContentAvailable: boolean;
  questionAvailable: boolean;
}

export interface BuildAdaptiveDecisionInput {
  diagnostic: StudentDiagnosticDecision;
  attempts: AdaptiveAttemptRecord[];
  errorEvidence?: AdaptiveErrorRecord[];
  mastery?: AdaptiveMasteryRecord[];
  reviewItems?: AdaptiveReviewRecord[];
  availability: AdaptiveAvailability[];
  requestedProgramId?: string;
  requestedSubjectId?: string;
  now?: Date;
}

export class AdaptiveLearningDecisionError extends Error {
  constructor(
    message: string,
    public readonly code: 'INVALID_STUDENT' | 'INVALID_PROGRAM' | 'INVALID_SUBJECT',
  ) {
    super(message);
    this.name = 'AdaptiveLearningDecisionError';
  }
}

export const ADAPTIVE_DECISION_CALCULATION_VERSION = 'phase-15-v1';
export const ADAPTIVE_RECENT_DAYS = 30;

const CONCEPT_ERROR_TYPES = new Set<LearningErrorType>([
  'CONCEPT_GAP',
  'MISUNDERSTANDING',
  'MEMORY_GAP',
  'PARTIAL_UNDERSTANDING',
]);

const PROCEDURAL_ERROR_TYPES = new Set<LearningErrorType>([
  'CALCULATION_ERROR',
  'READING_ERROR',
  'WRONG_STRATEGY',
  'RUSHED',
  'TIME_PRESSURE',
  'CONFUSED_OPTIONS',
  'FAILED_TO_IDENTIFY_RELATION',
]);

function asDate(value: Date | string | undefined): Date | undefined {
  if (!value) return undefined;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isFinite(date.getTime()) ? date : undefined;
}

function isRecent(value: Date | string | undefined, now: Date): boolean {
  const date = asDate(value);
  return Boolean(
    date &&
    date.getTime() <= now.getTime() &&
    now.getTime() - date.getTime() <= ADAPTIVE_RECENT_DAYS * 86400000,
  );
}

function normalizeSubjectId(value: unknown): string | undefined {
  const subject = String(value ?? '').trim();
  if (!subject) return undefined;
  return subject.startsWith('subject.') ? subject : undefined;
}

function scopeKey(scope: AdaptiveDecisionScope): string {
  return `${scope.programId}|${scope.subjectId || ''}`;
}

function scopesForInput(
  input: BuildAdaptiveDecisionInput,
): AdaptiveDecisionScope[] {
  const approved = listApprovedMasteryNodes()
    .filter((node) => node.type === 'PROGRAM' || node.type === 'SUBJECT')
    .filter((node) => !input.requestedProgramId || node.programId === input.requestedProgramId)
    .filter((node) => !input.requestedSubjectId || node.code === input.requestedSubjectId)
    .map((node) => ({
      type: node.type as 'PROGRAM' | 'SUBJECT',
      programId: node.programId,
      subjectId: node.subjectId,
      taxonomyNodeId: node.code,
    }));

  const scopes = new Map<string, AdaptiveDecisionScope>();
  for (const scope of approved) scopes.set(scopeKey(scope), scope);
  for (const scope of input.diagnostic.scopes) {
    if (input.requestedSubjectId && scope.subjectId !== input.requestedSubjectId) continue;
    if (input.requestedProgramId && scope.programId !== input.requestedProgramId) continue;
    const key = `${scope.programId}|${scope.subjectId || ''}`;
    scopes.set(key, {
      type: scope.type === 'SUBJECT' ? 'SUBJECT' : 'PROGRAM',
      programId: scope.programId,
      subjectId: scope.subjectId,
      taxonomyNodeId: scope.taxonomyNodeId,
    });
  }
  for (const value of [
    ...input.attempts.map((item) => ({ programId: item.programId, subjectId: item.subjectId })),
    ...(input.mastery || []).map((item) => ({ programId: item.programId, subjectId: item.subjectId })),
    ...(input.reviewItems || []).map((item) => ({ programId: item.programId, subjectId: item.subjectId })),
  ]) {
    if (input.requestedProgramId && value.programId !== input.requestedProgramId) continue;
    if (input.requestedSubjectId && value.subjectId !== input.requestedSubjectId) continue;
    const approvedNode = listApprovedMasteryNodes().find((node) =>
      node.type === 'SUBJECT' &&
      node.programId === value.programId &&
      node.subjectId === value.subjectId,
    );
    if (!approvedNode && value.subjectId) continue;
    const scope: AdaptiveDecisionScope = {
      type: value.subjectId ? 'SUBJECT' : 'PROGRAM',
      programId: value.programId,
      subjectId: value.subjectId,
      taxonomyNodeId: approvedNode?.code || value.programId,
    };
    scopes.set(scopeKey(scope), scope);
  }
  return [...scopes.values()].sort((a, b) =>
    a.programId.localeCompare(b.programId) ||
    (a.subjectId || '').localeCompare(b.subjectId || ''),
  );
}

function belongsToScope(
  record: { programId: string; subjectId?: string },
  scope: AdaptiveDecisionScope,
): boolean {
  return record.programId === scope.programId &&
    (scope.type === 'PROGRAM' || record.subjectId === scope.subjectId);
}

function availabilityFor(
  availability: AdaptiveAvailability[],
  scope: AdaptiveDecisionScope,
): AdaptiveAvailability {
  const exact = availability.find((item) =>
    item.programId === scope.programId && item.subjectId === scope.subjectId,
  );
  const program = availability.find((item) =>
    item.programId === scope.programId && !item.subjectId,
  );
  return exact || program || {
    programId: scope.programId,
    subjectId: scope.subjectId,
    foundationContentAvailable: false,
    questionAvailable: false,
  };
}

function confidenceFor(
  reasonCode: AdaptiveReasonCode,
  scope: {
    mastery?: AdaptiveMasteryRecord;
    conceptErrors: AdaptiveErrorRecord[];
    proceduralErrors: AdaptiveErrorRecord[];
    review?: AdaptiveReviewRecord;
    recentAttempts: AdaptiveAttemptRecord[];
  },
): AdaptiveDecisionConfidence {
  if (reasonCode === 'NEW_STUDENT') return 'LOW';
  if (reasonCode === 'INSUFFICIENT_DATA' || reasonCode === 'RETURNING_AFTER_GAP') return 'MEDIUM';
  if (reasonCode === 'REPEATED_CONCEPT_ERROR') {
    return scope.conceptErrors.length >= 3 ? 'HIGH' : 'MEDIUM';
  }
  if (reasonCode === 'OVERDUE_REVIEW' || reasonCode === 'DUE_REVIEW') {
    return scope.review?.retentionConfidence === 'HIGH' ? 'HIGH' : 'MEDIUM';
  }
  if (reasonCode === 'MASTERED_STABLE' || reasonCode === 'ADVANCE_READY') return 'HIGH';
  if (scope.mastery?.confidence === 'HIGH' && scope.recentAttempts.length >= 3) return 'HIGH';
  return 'MEDIUM';
}

function actionForDecision(decision: AdaptiveDecisionType): AdaptiveLearningDecision['nextAction'] {
  switch (decision) {
    case 'DIAGNOSTIC':
      return { recommendationType: 'DIAGNOSTIC', questionActivity: 'DIAGNOSTIC' };
    case 'LEARN':
      return { recommendationType: 'LEARN', questionActivity: 'PRACTICE' };
    case 'PRACTICE':
      return { recommendationType: 'PRACTICE', questionActivity: 'PRACTICE' };
    case 'CORRECT':
      return { recommendationType: 'LEARN', questionActivity: 'RETRY' };
    case 'SIMILAR':
      return { recommendationType: 'PRACTICE', questionActivity: 'PRACTICE' };
    case 'REVIEW':
      return { recommendationType: 'REVIEW', questionActivity: 'REVIEW' };
    case 'RECOVERY':
      return { recommendationType: 'RECOVERY_CHECK', questionActivity: 'RECOVERY_CHECK' };
    case 'MASTERY_CHECK':
      return { recommendationType: 'MASTERY_CHECK', questionActivity: 'MASTERY_CHECK' };
    default:
      return { recommendationType: undefined, questionActivity: undefined };
  }
}

function createDecision(
  studentId: string,
  decision: AdaptiveDecisionType,
  reasonCode: AdaptiveReasonCode,
  reason: string,
  scope: AdaptiveDecisionScope,
  diagnostic: StudentDiagnosticDecision,
  evidence: Parameters<typeof confidenceFor>[1],
  now: Date,
): AdaptiveLearningDecision {
  return {
    studentId,
    decision,
    reasonCode,
    reason,
    confidence: confidenceFor(reasonCode, evidence),
    scope: {
      type: scope.type,
      programId: scope.programId,
      subjectId: scope.subjectId,
      taxonomyNodeId: scope.taxonomyNodeId,
    },
    nextAction: actionForDecision(decision),
    diagnosticState: diagnostic.diagnosticState,
    generatedAt: now,
    calculationVersion: ADAPTIVE_DECISION_CALCULATION_VERSION,
  };
}

function decisionForScope(
  studentId: string,
  scope: AdaptiveDecisionScope,
  input: BuildAdaptiveDecisionInput,
  now: Date,
): { decision: AdaptiveLearningDecision; rank: number } {
  const attempts = input.attempts.filter((item) => belongsToScope(item, scope));
  const errors = (input.errorEvidence || []).filter((item) => belongsToScope(item, scope));
  const mastery = (input.mastery || []).find((item) =>
    item.taxonomyNodeId === scope.taxonomyNodeId ||
    (item.programId === scope.programId && item.subjectId === scope.subjectId),
  );
  const reviews = (input.reviewItems || [])
    .filter((item) => belongsToScope(item, scope) && item.due)
    .sort((a, b) => b.priority - a.priority);
  const review = reviews[0];
  const recentAttempts = attempts.filter((item) => isRecent(item.createdAt, now));
  const recentFailures = recentAttempts.filter((item) => !item.isCorrect);
  const recentSuccesses = recentAttempts.filter((item) => item.isCorrect);
  const trustworthyErrors = errors.filter((item) => item.confidence !== 'LOW');
  const conceptErrors = trustworthyErrors.filter((item) => CONCEPT_ERROR_TYPES.has(item.errorType));
  const proceduralErrors = trustworthyErrors.filter((item) => PROCEDURAL_ERROR_TYPES.has(item.errorType));
  const availability = availabilityFor(input.availability, scope);
  const evidence = {
    mastery,
    conceptErrors,
    proceduralErrors,
    review,
    recentAttempts,
    recentFailures,
    recentSuccesses,
  };

  if (input.diagnostic.diagnosticState === 'NEW') {
    return {
      decision: createDecision(
        studentId,
        'DIAGNOSTIC',
        'NEW_STUDENT',
        'لا توجد بيانات تعلم موثوقة كافية لبدء نشاط محدد.',
        scope,
        input.diagnostic,
        evidence,
        now,
      ),
      rank: 100,
    };
  }
  if (input.diagnostic.diagnosticState === 'INSUFFICIENT_DATA') {
    return {
      decision: createDecision(
        studentId,
        'DIAGNOSTIC',
        'INSUFFICIENT_DATA',
        'البيانات الحالية غير كافية لتحديد نشاط تعلم بثقة.',
        scope,
        input.diagnostic,
        evidence,
        now,
      ),
      rank: 95,
    };
  }
  if (review) {
    const overdue = review.overdue || review.reasonCodes.includes('OVERDUE');
    return {
      decision: createDecision(
        studentId,
        'REVIEW',
        overdue ? 'OVERDUE_REVIEW' : 'DUE_REVIEW',
        overdue
          ? 'يوجد دليل احتفاظ متأخر يحتاج إلى مراجعة.'
          : 'يوجد دليل احتفاظ مستحق يحتاج إلى مراجعة.',
        scope,
        input.diagnostic,
        evidence,
        now,
      ),
      rank: overdue ? 86 : 80,
    };
  }
  if (input.diagnostic.diagnosticState === 'RETURNING' && conceptErrors.length < 2) {
    return {
      decision: createDecision(
        studentId,
        'RECOVERY',
        'RETURNING_AFTER_GAP',
        'عاد الطالب بعد فجوة زمنية؛ نبدأ بفحص عودة تدريجي دون إعادة التعلم من الصفر.',
        scope,
        input.diagnostic,
        evidence,
        now,
      ),
      rank: 70,
    };
  }
  if (conceptErrors.length >= 2) {
    if (availability.foundationContentAvailable) {
      return {
        decision: createDecision(
          studentId,
          'LEARN',
          'REPEATED_CONCEPT_ERROR',
          'تكررت أخطاء مفاهيمية موثوقة؛ نحتاج إلى بناء الفهم قبل زيادة التدريب.',
          scope,
          input.diagnostic,
          evidence,
          now,
        ),
        rank: 76,
      };
    }
    if (availability.questionAvailable) {
      return {
        decision: createDecision(
          studentId,
          'PRACTICE',
          'CONTENT_UNAVAILABLE',
          'يوجد احتياج مفاهيمي متكرر لكن المحتوى التأسيسي غير متاح؛ نستخدم تدريبًا صالحًا كبديل.',
          scope,
          input.diagnostic,
          evidence,
          now,
        ),
        rank: 74,
      };
    }
    return {
      decision: createDecision(
        studentId,
        'NO_ACTIONABLE_CONTENT',
        'CONTENT_UNAVAILABLE',
        'يوجد احتياج مفاهيمي متكرر ولا يوجد محتوى تأسيسي أو سؤال صالح حاليًا.',
        scope,
        input.diagnostic,
        evidence,
        now,
      ),
      rank: 72,
    };
  }
  if (proceduralErrors.length >= 1) {
    return {
      decision: createDecision(
        studentId,
        availability.questionAvailable ? 'PRACTICE' : 'NO_ACTIONABLE_CONTENT',
        availability.questionAvailable ? 'PRACTICE_AVAILABLE' : 'PRACTICE_UNAVAILABLE',
        availability.questionAvailable
          ? 'يوجد نمط خطأ إجرائي؛ نحتاج إلى تدريب موجّه دون افتراض فجوة مفاهيمية.'
          : 'يوجد نمط خطأ إجرائي لكن لا يوجد سؤال صالح للتدريب حاليًا.',
        scope,
        input.diagnostic,
        evidence,
        now,
      ),
      rank: availability.questionAvailable ? 68 : 64,
    };
  }
  if (recentFailures.length >= 1) {
    return {
      decision: createDecision(
        studentId,
        availability.questionAvailable ? 'PRACTICE' : 'NO_ACTIONABLE_CONTENT',
        availability.questionAvailable ? 'RECENT_FAILURE' : 'PRACTICE_UNAVAILABLE',
        availability.questionAvailable
          ? 'حدث فشل حديث؛ نستخدم تدريبًا قصيرًا دون تصعيد الحكم إلى فجوة مفاهيمية.'
          : 'حدث فشل حديث لكن لا يوجد سؤال صالح للتدريب حاليًا.',
        scope,
        input.diagnostic,
        evidence,
        now,
      ),
      rank: availability.questionAvailable ? 66 : 62,
    };
  }
  if (
    mastery &&
    (mastery.masteryLevel === 'EMERGING' || mastery.masteryLevel === 'DEVELOPING' || mastery.masteryScore < 50)
  ) {
    const canLearn = availability.foundationContentAvailable;
    const canPractice = availability.questionAvailable;
    return {
      decision: createDecision(
        studentId,
        canLearn ? 'LEARN' : canPractice ? 'PRACTICE' : 'NO_ACTIONABLE_CONTENT',
        canLearn ? 'LOW_MASTERY' : 'CONTENT_UNAVAILABLE',
        canLearn
          ? 'مستوى الإتقان منخفض؛ نبدأ ببناء الفهم.'
          : canPractice
            ? 'مستوى الإتقان منخفض لكن المحتوى التأسيسي غير متاح؛ نستخدم تدريبًا صالحًا.'
            : 'مستوى الإتقان منخفض ولا يوجد نشاط صالح متاح حاليًا.',
        scope,
        input.diagnostic,
        evidence,
        now,
      ),
      rank: canLearn ? 62 : canPractice ? 60 : 58,
    };
  }
  if (
    mastery &&
    mastery.masteryLevel === 'PROFICIENT' &&
    mastery.masteryScore >= 70 &&
    mastery.confidence !== 'HIGH'
  ) {
    return {
      decision: createDecision(
        studentId,
        availability.questionAvailable ? 'MASTERY_CHECK' : 'NO_ACTIONABLE_CONTENT',
        availability.questionAvailable ? 'MASTERY_CHECK_READY' : 'PRACTICE_UNAVAILABLE',
        availability.questionAvailable
          ? 'الأداء قريب من الإتقان لكن الدليل غير كافٍ؛ نحتاج فحص إتقان قصير.'
          : 'الأداء قريب من الإتقان لكن لا يوجد سؤال صالح لفحصه حاليًا.',
        scope,
        input.diagnostic,
        evidence,
        now,
      ),
      rank: availability.questionAvailable ? 56 : 54,
    };
  }
  if (
    mastery &&
    mastery.masteryLevel === 'MASTERED' &&
    mastery.confidence === 'HIGH' &&
    recentSuccesses.length < 2 &&
    !review
  ) {
    return {
      decision: createDecision(
        studentId,
        availability.questionAvailable ? 'MASTERY_CHECK' : 'NO_ACTIONABLE_CONTENT',
        availability.questionAvailable ? 'MASTERY_CHECK_READY' : 'PRACTICE_UNAVAILABLE',
        availability.questionAvailable
          ? 'يوجد إتقان مسجل لكن لا توجد نجاحات حديثة كافية لتجاوز فحص الثبات.'
          : 'يوجد إتقان مسجل لكن لا يوجد سؤال صالح لفحص الثبات حاليًا.',
        scope,
        input.diagnostic,
        evidence,
        now,
      ),
      rank: availability.questionAvailable ? 52 : 48,
    };
  }
  if (
    mastery &&
    mastery.masteryLevel === 'MASTERED' &&
    mastery.confidence === 'HIGH' &&
    recentSuccesses.length >= 2 &&
    !review
  ) {
    return {
      decision: createDecision(
        studentId,
        'ADVANCE',
        'MASTERED_STABLE',
        'يوجد دليل إتقان ثابت ولا توجد مراجعة مستحقة؛ يمكن الانتقال إلى نطاق آخر.',
        scope,
        input.diagnostic,
        evidence,
        now,
      ),
      rank: 50,
    };
  }
  if (availability.questionAvailable) {
    return {
      decision: createDecision(
        studentId,
        'PRACTICE',
        'PRACTICE_AVAILABLE',
        'البيانات الحالية تسمح بتدريب صالح في هذا النطاق.',
        scope,
        input.diagnostic,
        evidence,
        now,
      ),
      rank: 40,
    };
  }
  return {
    decision: createDecision(
      studentId,
      'NO_ACTIONABLE_CONTENT',
      'PRACTICE_UNAVAILABLE',
      'لا يوجد محتوى أو سؤال صالح متاح لهذا النطاق حاليًا.',
      scope,
      input.diagnostic,
      evidence,
      now,
    ),
    rank: 20,
  };
}

export function buildAdaptiveLearningDecision(
  studentId: string,
  input: BuildAdaptiveDecisionInput,
): AdaptiveLearningDecision {
  if (!String(studentId || '').trim()) {
    throw new AdaptiveLearningDecisionError('studentId غير صالح', 'INVALID_STUDENT');
  }
  const requestedProgramId = input.requestedProgramId
    ? normalizeDiagnosticProgram(input.requestedProgramId)
    : undefined;
  if (input.requestedProgramId && !requestedProgramId) {
    throw new AdaptiveLearningDecisionError('البرنامج غير صالح', 'INVALID_PROGRAM');
  }
  const requestedSubjectId = input.requestedSubjectId
    ? normalizeSubjectId(input.requestedSubjectId)
    : undefined;
  if (input.requestedSubjectId && !requestedSubjectId) {
    throw new AdaptiveLearningDecisionError('المادة غير صالحة', 'INVALID_SUBJECT');
  }
  const now = input.now || new Date();
  const normalizedInput = {
    ...input,
    requestedProgramId,
    requestedSubjectId,
  };
  const scopes = scopesForInput(normalizedInput);
  if (scopes.length === 0) {
    const fallback: AdaptiveDecisionScope = {
      type: requestedSubjectId ? 'SUBJECT' : 'PROGRAM',
      programId: requestedProgramId || 'program.qudrat',
      subjectId: requestedSubjectId,
      taxonomyNodeId: requestedSubjectId || requestedProgramId || 'program.qudrat',
    };
    return decisionForScope(studentId, fallback, normalizedInput, now).decision;
  }
  const candidates = scopes.map((scope) =>
    decisionForScope(studentId, scope, normalizedInput, now),
  );
  return candidates.sort((a, b) =>
    b.rank - a.rank ||
    a.decision.scope.programId.localeCompare(b.decision.scope.programId) ||
    (a.decision.scope.subjectId || '').localeCompare(b.decision.scope.subjectId || ''),
  )[0].decision;
}

function attemptRecord(attempt: any): AdaptiveAttemptRecord {
  return {
    id: attempt?._id ? String(attempt._id) : undefined,
    programId: String(attempt?.programId || ''),
    subjectId: attempt?.subjectId ? String(attempt.subjectId) : undefined,
    isAnswered: Boolean(attempt?.isAnswered),
    isCorrect: Boolean(attempt?.isCorrect),
    createdAt: attempt?.createdAt,
  };
}

async function availabilityForScopes(
  scopes: AdaptiveDecisionScope[],
): Promise<AdaptiveAvailability[]> {
  const unique = new Map<string, AdaptiveAvailability>();
  await Promise.all(scopes.map(async (scope) => {
    const program = scope.programId.replace(/^program\./, '') as 'qudrat' | 'tahsili';
    const subject = scope.subjectId?.split('.').slice(2).join('.');
    const foundationQuery: Record<string, unknown> = { program, published: true };
    if (scope.subjectId) foundationQuery.$or = [
      { subjectId: scope.subjectId },
      { subjectId: subject },
      { taxonomyNodeId: scope.taxonomyNodeId },
    ];
    const [foundationContent, questionCount] = await Promise.all([
      FoundationContent.exists(foundationQuery),
      program === 'qudrat'
        ? Question.countDocuments(subject
          ? { category: subject }
          : { category: { $in: ['verbal', 'quantitative'] } })
        : TahsiliQuestion.countDocuments({
          answerConfidence: 'verified',
          ...(subject ? { subject } : {}),
        }),
    ]);
    unique.set(scopeKey(scope), {
      programId: scope.programId,
      subjectId: scope.subjectId,
      foundationContentAvailable: Boolean(foundationContent),
      questionAvailable: questionCount > 0,
    });
  }));
  return [...unique.values()];
}

export async function getAdaptiveLearningDecision(
  studentId: string,
  options: { programId?: string; subjectId?: string; now?: Date } = {},
): Promise<AdaptiveLearningDecision> {
  if (!String(studentId || '').trim()) {
    throw new AdaptiveLearningDecisionError('studentId غير صالح', 'INVALID_STUDENT');
  }
  const requestedProgramId = options.programId
    ? normalizeDiagnosticProgram(options.programId)
    : undefined;
  if (options.programId && !requestedProgramId) {
    throw new AdaptiveLearningDecisionError('البرنامج غير صالح', 'INVALID_PROGRAM');
  }
  const requestedSubjectId = options.subjectId
    ? normalizeSubjectId(options.subjectId)
    : undefined;
  if (options.subjectId && !requestedSubjectId) {
    throw new AdaptiveLearningDecisionError('المادة غير صالحة', 'INVALID_SUBJECT');
  }
  const now = options.now || new Date();
  const [diagnostic, attempts, errors, mastery, reviews] = await Promise.all([
    getStudentDiagnosticDecision(studentId, requestedProgramId),
    LearningAttempt.find({ studentId }).select('_id programId subjectId isAnswered isCorrect createdAt').lean(),
    LearningErrorEvidence.find({ studentId })
      .select('attemptId programId subjectId errorType confidence detectedAt')
      .lean(),
    StudentMastery.find({ studentId })
      .select('taxonomyNodeId programId subjectId masteryScore masteryLevel evidenceCount confidence lastAttemptAt lastEvidenceAt')
      .lean(),
    LearningReviewItem.find({
      studentId,
      state: { $ne: 'SUSPENDED' },
      nextReviewAt: { $lte: now },
      ...(requestedProgramId ? { programId: requestedProgramId } : {}),
      ...(requestedSubjectId ? { subjectId: requestedSubjectId } : {}),
    })
      .select('programId subjectId taxonomyNodeId nextReviewAt priority retentionConfidence reasonCodes masteryLevel')
      .lean(),
  ]);
  const diagnosticScopes = scopesForInput({
    diagnostic,
    attempts: [],
    mastery: [],
    reviewItems: [],
    availability: [],
    requestedProgramId,
    requestedSubjectId,
    now,
  });
  const availability = await availabilityForScopes(diagnosticScopes);
  return buildAdaptiveLearningDecision(studentId, {
    diagnostic,
    attempts: attempts.map(attemptRecord),
    errorEvidence: errors.map((item: any) => ({
      attemptId: item.attemptId ? String(item.attemptId) : undefined,
      programId: String(item.programId || ''),
      subjectId: item.subjectId ? String(item.subjectId) : undefined,
      errorType: item.errorType,
      confidence: item.confidence,
      detectedAt: item.detectedAt,
    })),
    mastery: mastery.map((item: any) => ({
      taxonomyNodeId: String(item.taxonomyNodeId),
      programId: String(item.programId || ''),
      subjectId: item.subjectId ? String(item.subjectId) : undefined,
      masteryScore: Number(item.masteryScore || 0),
      masteryLevel: item.masteryLevel,
      evidenceCount: Number(item.evidenceCount || 0),
      confidence: item.confidence,
      lastAttemptAt: item.lastAttemptAt,
      lastEvidenceAt: item.lastEvidenceAt,
    })),
    reviewItems: reviews.map((item: any) => ({
      programId: String(item.programId || ''),
      subjectId: item.subjectId ? String(item.subjectId) : undefined,
      taxonomyNodeId: item.taxonomyNodeId ? String(item.taxonomyNodeId) : undefined,
      due: true,
      overdue: new Date(item.nextReviewAt).getTime() < now.getTime(),
      priority: Number(item.priority || 0),
      retentionConfidence: item.retentionConfidence,
      reasonCodes: item.reasonCodes || [],
      masteryLevel: item.masteryLevel,
    })),
    availability,
    requestedProgramId,
    requestedSubjectId,
    now,
  });
}

export function publicAdaptiveLearningDecision(decision: AdaptiveLearningDecision) {
  return {
    studentId: decision.studentId,
    decision: decision.decision,
    reasonCode: decision.reasonCode,
    reason: decision.reason,
    confidence: decision.confidence,
    scope: decision.scope,
    nextAction: decision.nextAction,
    diagnosticState: decision.diagnosticState,
    generatedAt: decision.generatedAt,
    calculationVersion: decision.calculationVersion,
  };
}