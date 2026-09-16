import mongoose from 'mongoose';
import { Question, TahsiliQuestion } from '../mongodb/models';
import {
  LearningAttempt,
  LearningErrorEvidence,
  type ILearningAttempt,
  type ILearningErrorEvidence,
  type LearningAttemptSourceType,
  type LearningErrorConfidence,
  type LearningErrorEvidenceSignal,
  type LearningErrorType,
  LEARNING_ERROR_TYPES,
} from '../mongodb/learningProfileModels';

export const LEARNING_ERROR_SELF_REPORTS = [
  'did_not_understand_concept',
  'calculation_mistake',
  'did_not_understand_question',
  'rushed',
  'did_not_know_where_to_start',
  'guessing',
  'confused_options',
  'not_sure',
] as const;

export type LearningErrorSelfReport = typeof LEARNING_ERROR_SELF_REPORTS[number];

const selfReportToErrorType: Record<LearningErrorSelfReport, LearningErrorType> = {
  did_not_understand_concept: 'CONCEPT_GAP',
  calculation_mistake: 'CALCULATION_ERROR',
  did_not_understand_question: 'READING_ERROR',
  rushed: 'RUSHED',
  did_not_know_where_to_start: 'WRONG_STRATEGY',
  guessing: 'GUESS',
  confused_options: 'CONFUSED_OPTIONS',
  not_sure: 'UNKNOWN',
};

export interface LearningQuestionMetadata {
  category?: string;
  subcategory?: string;
  difficulty?: string;
  topic?: string;
  hasExplanation?: boolean;
}

export interface LearningErrorDetectionContext {
  isAnswered: boolean;
  isCorrect: boolean;
  responseTime: number;
  selectedAnswer?: string | number | null;
  questionMetadata?: LearningQuestionMetadata;
}

export interface LearningErrorDetectionResult {
  errorType: LearningErrorType;
  confidence: LearningErrorConfidence;
  evidence: Array<{
    type: LearningErrorEvidenceSignal;
    value?: string | number | boolean | null;
    detail?: string;
  }>;
  inferenceRule: string;
}

export class LearningErrorEvidenceError extends Error {
  constructor(
    message: string,
    public readonly code: 'INVALID_ATTEMPT' | 'INVALID_SELF_REPORT' | 'IDEMPOTENCY_CONFLICT',
  ) {
    super(message);
    this.name = 'LearningErrorEvidenceError';
  }
}

export function normalizeLearningErrorSelfReport(value: unknown): LearningErrorSelfReport | null {
  const normalized = String(value ?? '').trim();
  return (LEARNING_ERROR_SELF_REPORTS as readonly string[]).includes(normalized)
    ? normalized as LearningErrorSelfReport
    : null;
}

function questionMetadataSignal(
  metadata: LearningQuestionMetadata | undefined,
): LearningErrorDetectionResult['evidence'][number] | null {
  const label = metadata?.subcategory || metadata?.category || metadata?.topic;
  if (!label) return null;
  return {
    type: 'question_metadata',
    value: label,
    detail: 'metadata موثوقة من سجل السؤال، وليست تصنيفًا لسبب الخطأ',
  };
}

/**
 * Detection is deliberately conservative. An incorrect answer alone is
 * evidence that an error happened, not evidence of a particular cause.
 */
export function inferLearningError(
  context: LearningErrorDetectionContext,
  selfReport?: LearningErrorSelfReport,
): LearningErrorDetectionResult {
  const evidence: LearningErrorDetectionResult['evidence'] = [];
  const metadataEvidence = questionMetadataSignal(context.questionMetadata);
  if (metadataEvidence) evidence.push(metadataEvidence);

  evidence.push({
    type: 'attempt_outcome',
    value: context.isCorrect,
    detail: context.isAnswered
      ? context.isCorrect ? 'الإجابة صحيحة' : 'الإجابة خاطئة'
      : 'السؤال غير مجاب',
  });

  if (selfReport) {
    evidence.push({
      type: 'self_report',
      value: selfReport,
      detail: 'اختيار صريح من الطالب بعد المحاولة',
    });
    return {
      errorType: selfReportToErrorType[selfReport],
      confidence: 'HIGH',
      evidence,
      inferenceRule: 'explicit-self-report',
    };
  }

  if (!context.isAnswered || context.isCorrect) {
    return {
      errorType: 'UNKNOWN',
      confidence: 'LOW',
      evidence,
      inferenceRule: 'no-error-cause-inferred',
    };
  }

  evidence.unshift({
    type: 'wrong_answer',
    value: true,
    detail: 'إجابة خاطئة؛ لا تكفي وحدها لإثبات فجوة مفاهيمية',
  });

  if (context.responseTime > 0 && context.responseTime <= 3) {
    evidence.push({
      type: 'response_time',
      value: context.responseTime,
      detail: 'زمن إجابة منخفض جدًا؛ إشارة محتملة للاستعجال وليست حكمًا نهائيًا',
    });
    return {
      errorType: 'RUSHED',
      confidence: 'LOW',
      evidence,
      inferenceRule: 'low-response-time',
    };
  }

  return {
    errorType: 'UNKNOWN',
    confidence: 'LOW',
    evidence,
    inferenceRule: 'wrong-answer-only',
  };
}

function metadataFromQuestion(question: any): LearningQuestionMetadata | undefined {
  if (!question) return undefined;
  const metadata: LearningQuestionMetadata = {
    category: typeof question.category === 'string' ? question.category : undefined,
    subcategory: typeof question.subcategory === 'string' ? question.subcategory : undefined,
    difficulty: typeof question.difficulty === 'string' ? question.difficulty : undefined,
    topic: typeof question.topic === 'string' ? question.topic : undefined,
    hasExplanation: typeof question.explanation === 'string' && question.explanation.trim().length > 0,
  };
  return Object.values(metadata).some((value) => value !== undefined) ? metadata : undefined;
}

export async function findQuestionMetadataForLearningError(
  questionId: string,
  sourceType: LearningAttemptSourceType,
): Promise<LearningQuestionMetadata | undefined> {
  let question: any = null;

  if (sourceType === 'mongo_tahsili_question') {
    const numericId = Number(questionId);
    if (!Number.isInteger(numericId)) return undefined;
    question = await TahsiliQuestion.findOne({ questionId: numericId })
      .select('category subcategory difficulty topic explanation')
      .lean();
  } else if (sourceType === 'mongo_question' || sourceType === 'unknown') {
    if (mongoose.Types.ObjectId.isValid(questionId)) {
      question = await Question.findById(questionId)
        .select('category subcategory difficulty topic explanation')
        .lean();
    }
    if (!question) {
      const numericId = Number(questionId);
      if (Number.isInteger(numericId)) {
        question = await Question.findOne({ questionId: numericId })
          .select('category subcategory difficulty topic explanation')
          .lean();
      }
    }
  }

  return metadataFromQuestion(question);
}

function attemptContext(
  attempt: Partial<ILearningAttempt> & { _id?: unknown },
  questionMetadata?: LearningQuestionMetadata,
): LearningErrorDetectionContext {
  return {
    isAnswered: Boolean(attempt.isAnswered),
    isCorrect: Boolean(attempt.isCorrect),
    responseTime: Number(attempt.responseTime || 0),
    selectedAnswer: attempt.selectedAnswer,
    questionMetadata,
  };
}

function evidenceKey(
  attemptId: string,
  selfReport?: LearningErrorSelfReport,
): string {
  return selfReport ? `self-report:${attemptId}:${selfReport}` : `auto:${attemptId}`;
}

function sameEvidence(
  existing: any,
  attemptId: string,
  detection: LearningErrorDetectionResult,
  selfReport?: LearningErrorSelfReport,
): boolean {
  return String(existing.attemptId) === attemptId &&
    existing.errorType === detection.errorType &&
    existing.inferenceRule === detection.inferenceRule &&
    String(existing.selfReport || '') === String(selfReport || '');
}

async function createEvidenceForAttempt(
  studentId: string,
  attempt: Partial<ILearningAttempt> & { _id?: unknown },
  detection: LearningErrorDetectionResult,
  selfReport?: LearningErrorSelfReport,
  requestedIdempotencyKey?: string,
) {
  const attemptId = String(attempt._id || '');
  const idempotencyKey = String(requestedIdempotencyKey || evidenceKey(attemptId, selfReport)).trim();
  const existing = await LearningErrorEvidence.findOne({ studentId, idempotencyKey }).lean();
  if (existing) {
    if (!sameEvidence(existing, attemptId, detection, selfReport)) {
      throw new LearningErrorEvidenceError(
        'مفتاح تكرار evidence مستخدم لدليل مختلف',
        'IDEMPOTENCY_CONFLICT',
      );
    }
    return { evidence: existing, duplicate: true };
  }

  try {
    const evidence = await LearningErrorEvidence.create({
      studentId,
      attemptId: attempt._id,
      questionId: String(attempt.questionId),
      sourceType: attempt.sourceType || 'unknown',
      sourceKey: attempt.sourceKey,
      sourceIdentity: attempt.sourceIdentity,
      programId: attempt.programId,
      subjectId: attempt.subjectId,
      errorType: detection.errorType,
      confidence: detection.confidence,
      evidence: detection.evidence,
      inferenceRule: detection.inferenceRule,
      selfReport,
      observed: {
        isAnswered: Boolean(attempt.isAnswered),
        isCorrect: Boolean(attempt.isCorrect),
        responseTime: Number(attempt.responseTime || 0),
        selectedAnswer: attempt.selectedAnswer,
        questionMetadata: (detection.evidence.find((item) => item.type === 'question_metadata')
          ? (attempt as any).questionMetadata
          : undefined),
      },
      idempotencyKey,
    });
    return { evidence: evidence.toObject(), duplicate: false };
  } catch (error: any) {
    if (error?.code === 11000) {
      const duplicate = await LearningErrorEvidence.findOne({ studentId, idempotencyKey }).lean();
      if (duplicate) {
        if (!sameEvidence(duplicate, attemptId, detection, selfReport)) {
          throw new LearningErrorEvidenceError(
            'مفتاح تكرار evidence مستخدم لدليل مختلف',
            'IDEMPOTENCY_CONFLICT',
          );
        }
        return { evidence: duplicate, duplicate: true };
      }
    }
    throw error;
  }
}

export async function recordAutomaticLearningErrorEvidence(
  studentId: string,
  attempt: Partial<ILearningAttempt> & { _id?: unknown },
  questionMetadata?: LearningQuestionMetadata,
) {
  if (!attempt._id || !attempt.isAnswered || attempt.isCorrect) return null;
  const context = attemptContext(attempt, questionMetadata);
  const detection = inferLearningError(context);
  return createEvidenceForAttempt(studentId, {
    ...attempt,
    questionMetadata,
  } as any, detection);
}

export async function recordSelfReportedLearningErrorEvidence(
  studentId: string,
  input: { attemptId: string; selfReport: unknown; idempotencyKey?: string },
) {
  if (!mongoose.Types.ObjectId.isValid(input.attemptId)) {
    throw new LearningErrorEvidenceError('attemptId غير صالح', 'INVALID_ATTEMPT');
  }
  const selfReport = normalizeLearningErrorSelfReport(input.selfReport);
  if (!selfReport) {
    throw new LearningErrorEvidenceError('سبب الخطأ غير صالح', 'INVALID_SELF_REPORT');
  }

  const attempt = await LearningAttempt.findOne({
    _id: input.attemptId,
    studentId,
  }).lean();
  if (!attempt) {
    throw new LearningErrorEvidenceError('المحاولة غير موجودة أو لا تخص الطالب', 'INVALID_ATTEMPT');
  }

  const questionMetadata = await findQuestionMetadataForLearningError(
    attempt.questionId,
    attempt.sourceType,
  );
  const context = attemptContext(attempt, questionMetadata);
  const detection = inferLearningError(context, selfReport);
  return createEvidenceForAttempt(
    studentId,
    { ...attempt, questionMetadata } as any,
    detection,
    selfReport,
    input.idempotencyKey,
  );
}

export function publicLearningErrorEvidence(evidence: any) {
  return {
    id: String(evidence?._id),
    studentId: evidence?.studentId,
    attemptId: evidence?.attemptId ? String(evidence.attemptId) : undefined,
    questionId: evidence?.questionId,
    sourceType: evidence?.sourceType,
    sourceKey: evidence?.sourceKey,
    sourceIdentity: evidence?.sourceIdentity,
    programId: evidence?.programId,
    subjectId: evidence?.subjectId,
    errorType: evidence?.errorType,
    confidence: evidence?.confidence,
    evidence: evidence?.evidence || [],
    inferenceRule: evidence?.inferenceRule,
    selfReport: evidence?.selfReport,
    observed: evidence?.observed,
    detectedAt: evidence?.detectedAt,
  };
}

export function allowedLearningErrorTypes(): readonly LearningErrorType[] {
  return LEARNING_ERROR_TYPES;
}