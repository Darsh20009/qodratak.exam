import {
  LearningReviewItem,
  type ILearningReviewItem,
  type LearningRetentionConfidence,
  type LearningReviewFailureKind,
  type LearningReviewReasonCode,
  type LearningReviewSourceType,
  type LearningReviewState,
} from '../mongodb/learningReviewModels';
import type {
  ILearningAttempt,
  ILearningErrorEvidence,
  MasteryLevel,
} from '../mongodb/learningProfileModels';
import { approvedMasteryNode } from './masteryService';

export const SPACED_REPETITION_CALCULATION_VERSION = 'phase-14-v1';
export const REVIEW_INTERVAL_DAYS = [1, 3, 7, 14, 30, 60] as const;
export const MAX_REVIEW_ITEMS = 50;

export type ReviewOutcome = 'CONTENT_COMPLETION' | 'QUESTION_SUCCESS' | 'QUESTION_FAILURE';

export interface ReviewContext {
  programId: string;
  subjectId?: string;
  taxonomyNodeId?: string;
  taxonomyNodeType?: 'PROGRAM' | 'SUBJECT' | 'TOPIC' | 'SKILL' | 'SUBSKILL' | 'CONCEPT';
  sourceType: LearningReviewSourceType;
  sourceId: string;
  sourceIdentity: string;
  outcome?: ReviewOutcome;
  errorType?: string;
  masteryLevel?: MasteryLevel;
  now?: Date;
}

export interface PublicLearningReviewItem {
  id: string;
  sourceType: LearningReviewSourceType;
  sourceId: string;
  programId: string;
  subjectId?: string;
  taxonomyNodeId?: string;
  due: boolean;
  state: LearningReviewState;
  nextReviewAt: Date;
  intervalDays: number;
  retentionConfidence: LearningRetentionConfidence;
  priority: number;
  reasonCodes: LearningReviewReasonCode[];
  suggestedReviewType: 'CONTENT' | 'QUESTION' | 'MASTERY_CHECK';
}

export class SpacedRepetitionError extends Error {
  constructor(
    message: string,
    public readonly code: 'INVALID_STUDENT' | 'INVALID_LIMIT' | 'INVALID_PROGRAM' | 'INVALID_SUBJECT',
  ) {
    super(message);
    this.name = 'SpacedRepetitionError';
  }
}

const CONCEPT_ERROR_TYPES = new Set([
  'CONCEPT_GAP',
  'MISUNDERSTANDING',
  'MEMORY_GAP',
  'PARTIAL_UNDERSTANDING',
]);

function validDate(value: Date | undefined): Date {
  if (value && Number.isFinite(value.getTime())) return value;
  return new Date();
}

function addDays(now: Date, days: number): Date {
  return new Date(now.getTime() + days * 86400000);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function failureKind(errorType?: string): LearningReviewFailureKind | undefined {
  if (!errorType) return undefined;
  if (CONCEPT_ERROR_TYPES.has(errorType)) return 'CONCEPT';
  if (errorType === 'UNKNOWN') return 'UNKNOWN';
  return 'PROCEDURAL';
}

function retentionConfidence(
  successfulReviewCount: number,
  consecutiveSuccesses: number,
  consecutiveFailures: number,
): LearningRetentionConfidence {
  if (successfulReviewCount >= 4 && consecutiveSuccesses >= 3 && consecutiveFailures === 0) return 'HIGH';
  if (successfulReviewCount >= 2 && consecutiveSuccesses >= 2 && consecutiveFailures <= 1) return 'MEDIUM';
  return 'LOW';
}

function intervalAfterSuccess(
  consecutiveSuccesses: number,
  masteryLevel?: MasteryLevel,
  failure: LearningReviewFailureKind | undefined = undefined,
): number {
  const base = REVIEW_INTERVAL_DAYS[Math.min(consecutiveSuccesses, REVIEW_INTERVAL_DAYS.length - 1)];
  const masteryMultiplier = masteryLevel === 'MASTERED' ? 1.25 : masteryLevel === 'PROFICIENT' ? 1.1 : 1;
  const adjusted = Math.round(base * masteryMultiplier);
  if (failure === 'CONCEPT') return Math.min(3, Math.max(1, adjusted));
  if (failure) return Math.min(7, Math.max(1, adjusted));
  return clamp(adjusted, 1, 60);
}

function priorityFor(
  item: Pick<ILearningReviewItem, 'nextReviewAt' | 'consecutiveFailures' | 'lastFailureKind' | 'retentionConfidence' | 'masteryLevel'>,
  now: Date,
  outcome?: ReviewOutcome,
): number {
  const overdueDays = Math.max(0, Math.floor((now.getTime() - item.nextReviewAt.getTime()) / 86400000));
  let priority = outcome === 'QUESTION_FAILURE' ? 62 : 30;
  priority += overdueDays > 0 ? Math.min(25, 10 + overdueDays * 2) : 0;
  priority += Math.min(18, item.consecutiveFailures * 6);
  if (item.lastFailureKind === 'CONCEPT') priority += 15;
  if (item.retentionConfidence === 'LOW') priority += 10;
  if (item.masteryLevel === 'EMERGING') priority += 8;
  if (item.masteryLevel === 'MASTERED') priority -= 5;
  return clamp(Math.round(priority), 0, 100);
}

function reasonCodesFor(
  item: Pick<ILearningReviewItem, 'nextReviewAt' | 'lastFailureKind' | 'retentionConfidence' | 'lastReviewedAt'>,
  now: Date,
  outcome?: ReviewOutcome,
): LearningReviewReasonCode[] {
  const reasons: LearningReviewReasonCode[] = [];
  if (!item.lastReviewedAt) reasons.push('FIRST_REVIEW');
  const overdue = now.getTime() >= item.nextReviewAt.getTime();
  if (overdue) reasons.push(item.lastReviewedAt ? 'OVERDUE' : 'REVIEW_DUE');
  if (outcome === 'QUESTION_FAILURE') reasons.push('RECENT_FAILURE');
  if (item.lastFailureKind === 'CONCEPT') reasons.push('CONCEPT_ERROR');
  if (item.retentionConfidence === 'LOW') reasons.push('LOW_RETENTION_CONFIDENCE');
  if (item.masteryLevel === 'MASTERED' && overdue) reasons.push('POST_MASTERY_CHECK');
  return [...new Set(reasons)];
}

function normalizeContext(studentId: string, context: ReviewContext): ReviewContext {
  if (!String(studentId || '').trim()) throw new SpacedRepetitionError('الطالب غير صالح', 'INVALID_STUDENT');
  if (!context.programId?.trim()) throw new SpacedRepetitionError('البرنامج غير صالح', 'INVALID_PROGRAM');
  if (!context.sourceId?.trim() || !context.sourceIdentity?.trim()) {
    throw new SpacedRepetitionError('هوية المراجعة غير صالحة', 'INVALID_SUBJECT');
  }
  const taxonomy = context.taxonomyNodeId ? approvedMasteryNode(context.taxonomyNodeId) : undefined;
  const programNode = approvedMasteryNode(context.programId);
  const subjectNode = context.subjectId ? approvedMasteryNode(context.subjectId) : undefined;
  const approvedScope = taxonomy || subjectNode || programNode;
  return {
    ...context,
    taxonomyNodeId: approvedScope?.code,
    taxonomyNodeType: approvedScope?.type,
    now: validDate(context.now),
  };
}

export function calculateReviewIntervalDays(
  consecutiveSuccesses: number,
  masteryLevel?: MasteryLevel,
  lastFailureKind?: LearningReviewFailureKind,
): number {
  return intervalAfterSuccess(consecutiveSuccesses, masteryLevel, lastFailureKind);
}

export function calculateRetentionConfidence(
  successfulReviewCount: number,
  consecutiveSuccesses: number,
  consecutiveFailures: number,
): LearningRetentionConfidence {
  return retentionConfidence(successfulReviewCount, consecutiveSuccesses, consecutiveFailures);
}

export function isReviewDue(item: Pick<ILearningReviewItem, 'nextReviewAt' | 'state'>, now = new Date()): boolean {
  return item.state !== 'SUSPENDED' && now.getTime() >= item.nextReviewAt.getTime();
}

export function publicLearningReviewItem(
  item: ILearningReviewItem | Record<string, any>,
  now = new Date(),
): PublicLearningReviewItem {
  const due = isReviewDue(item as any, now);
  return {
    id: String(item._id || item.id),
    sourceType: item.sourceType,
    sourceId: item.sourceId,
    programId: item.programId,
    subjectId: item.subjectId,
    taxonomyNodeId: item.taxonomyNodeId,
    due,
    state: due && item.state !== 'SUSPENDED' ? 'REVIEW_DUE' : item.state,
    nextReviewAt: item.nextReviewAt,
    intervalDays: item.intervalDays,
    retentionConfidence: item.retentionConfidence,
    priority: item.priority,
    reasonCodes: item.reasonCodes || [],
    suggestedReviewType: item.sourceType === 'CONTENT'
      ? 'CONTENT'
      : item.masteryLevel === 'MASTERED'
        ? 'MASTERY_CHECK'
        : 'QUESTION',
  };
}

export async function upsertLearningReviewItem(
  studentId: string,
  rawContext: ReviewContext,
): Promise<ILearningReviewItem | null> {
  const context = normalizeContext(studentId, rawContext);
  const now = context.now!;
  let item = await LearningReviewItem.findOne({
    studentId,
    sourceIdentity: context.sourceIdentity,
  });

  if (!item && (context.outcome === 'QUESTION_SUCCESS' || !context.outcome)) {
    return null;
  }

  if (!item) {
    const initialFailure = context.outcome === 'QUESTION_FAILURE';
    const initialState: LearningReviewState = initialFailure ? 'REVIEW_DUE' : 'NEW';
    const initialRetention = 'LOW';
    const initialNextReviewAt = initialFailure ? now : addDays(now, 1);
    const initialFailureKind = failureKind(context.errorType);
    item = await LearningReviewItem.create({
      studentId,
      programId: context.programId,
      subjectId: context.subjectId,
      taxonomyNodeId: context.taxonomyNodeId,
      taxonomyNodeType: context.taxonomyNodeType,
      sourceType: context.sourceType,
      sourceId: context.sourceId,
      sourceIdentity: context.sourceIdentity,
      reviewCount: 0,
      successfulReviewCount: 0,
      consecutiveSuccesses: 0,
      consecutiveFailures: initialFailure ? 1 : 0,
      nextReviewAt: initialNextReviewAt,
      intervalDays: 1,
      retentionConfidence: initialRetention,
      priority: initialFailure ? 70 : 20,
      state: initialState,
      reasonCodes: initialFailure
        ? reasonCodesFor({
          nextReviewAt: initialNextReviewAt,
          lastFailureKind: initialFailureKind,
          retentionConfidence: initialRetention,
          lastReviewedAt: undefined,
        }, now, context.outcome)
        : ['FIRST_REVIEW'],
      lastFailedAt: initialFailure ? now : undefined,
      lastFailureKind: initialFailureKind,
      masteryLevel: context.masteryLevel,
    });
    return item;
  }

  item.programId = context.programId;
  item.subjectId = context.subjectId;
  item.taxonomyNodeId = context.taxonomyNodeId;
  item.taxonomyNodeType = context.taxonomyNodeType;
  item.masteryLevel = context.masteryLevel || item.masteryLevel;

  if (context.outcome === 'QUESTION_FAILURE') {
    const kind = failureKind(context.errorType);
    item.reviewCount += 1;
    item.lastFailedAt = now;
    item.lastFailureKind = kind;
    item.consecutiveFailures += 1;
    item.consecutiveSuccesses = 0;
    item.intervalDays = kind === 'CONCEPT' ? 1 : Math.max(1, Math.floor(item.intervalDays / 2));
    item.nextReviewAt = now;
    item.state = 'REVIEW_DUE';
    item.retentionConfidence = retentionConfidence(
      item.successfulReviewCount,
      item.consecutiveSuccesses,
      item.consecutiveFailures,
    );
  } else if (context.outcome === 'CONTENT_COMPLETION' || context.outcome === 'QUESTION_SUCCESS') {
    item.reviewCount += 1;
    item.successfulReviewCount += 1;
    item.consecutiveSuccesses += 1;
    item.consecutiveFailures = 0;
    item.lastReviewedAt = now;
    item.lastSuccessfulReviewAt = now;
    item.intervalDays = intervalAfterSuccess(
      item.consecutiveSuccesses - 1,
      item.masteryLevel,
      item.lastFailureKind,
    );
    item.nextReviewAt = addDays(now, item.intervalDays);
    item.retentionConfidence = retentionConfidence(
      item.successfulReviewCount,
      item.consecutiveSuccesses,
      item.consecutiveFailures,
    );
    item.state = item.retentionConfidence === 'HIGH' ? 'STABLE' : 'LEARNING';
    item.lastFailureKind = undefined;
  }

  item.priority = priorityFor(item, now, context.outcome);
  item.reasonCodes = reasonCodesFor(item, now, context.outcome);
  await item.save();
  return item;
}

export async function syncLearningReviewItemFromAttempt(
  studentId: string,
  attempt: Pick<ILearningAttempt, '_id' | 'questionId' | 'sourceType' | 'sourceKey' | 'sourceIdentity' | 'programId' | 'subjectId' | 'isAnswered' | 'isCorrect'>,
  errorEvidence?: Pick<ILearningErrorEvidence, 'errorType'> | null,
  masteryLevel?: MasteryLevel,
  now = new Date(),
): Promise<ILearningReviewItem | null> {
  if (!attempt.isAnswered) return null;
  return upsertLearningReviewItem(studentId, {
    programId: attempt.programId,
    subjectId: attempt.subjectId,
    sourceType: 'QUESTION',
    sourceId: String(attempt.questionId),
    sourceIdentity: `question:${attempt.sourceIdentity}`,
    outcome: attempt.isCorrect ? 'QUESTION_SUCCESS' : 'QUESTION_FAILURE',
    errorType: errorEvidence?.errorType,
    masteryLevel,
    now,
  });
}

export async function annotateLearningReviewItemFromErrorEvidence(
  studentId: string,
  attempt: Pick<ILearningAttempt, 'questionId' | 'sourceIdentity' | 'programId' | 'subjectId'>,
  errorType: string,
  masteryLevel?: MasteryLevel,
  now = new Date(),
): Promise<ILearningReviewItem | null> {
  const context = normalizeContext(studentId, {
    programId: attempt.programId,
    subjectId: attempt.subjectId,
    sourceType: 'QUESTION',
    sourceId: String(attempt.questionId),
    sourceIdentity: `question:${attempt.sourceIdentity}`,
    now,
  });
  const item = await LearningReviewItem.findOne({
    studentId,
    sourceIdentity: context.sourceIdentity,
  });
  if (!item) {
    return upsertLearningReviewItem(studentId, {
      ...context,
      outcome: 'QUESTION_FAILURE',
      errorType,
      masteryLevel,
      now,
    });
  }
  item.masteryLevel = masteryLevel || item.masteryLevel;
  item.lastFailureKind = failureKind(errorType);
  item.consecutiveSuccesses = 0;
  item.retentionConfidence = retentionConfidence(
    item.successfulReviewCount,
    item.consecutiveSuccesses,
    item.consecutiveFailures,
  );
  item.nextReviewAt = now;
  item.state = 'REVIEW_DUE';
  item.priority = priorityFor(item, now, 'QUESTION_FAILURE');
  item.reasonCodes = reasonCodesFor(item, now, 'QUESTION_FAILURE');
  await item.save();
  return item;
}

export async function syncLearningReviewItemFromContent(
  studentId: string,
  content: {
    id: string;
    programId: string;
    subjectId?: string;
    taxonomyNodeId?: string;
  },
  now = new Date(),
): Promise<ILearningReviewItem | null> {
  return upsertLearningReviewItem(studentId, {
    programId: content.programId,
    subjectId: content.subjectId,
    taxonomyNodeId: content.taxonomyNodeId,
    sourceType: 'CONTENT',
    sourceId: content.id,
    sourceIdentity: `content:${content.id}`,
    outcome: 'CONTENT_COMPLETION',
    now,
  });
}

export async function listDueLearningReviewItems(
  studentId: string,
  options: { programId?: string; subjectId?: string; limit?: number; now?: Date } = {},
): Promise<PublicLearningReviewItem[]> {
  if (!String(studentId || '').trim()) throw new SpacedRepetitionError('الطالب غير صالح', 'INVALID_STUDENT');
  const limit = options.limit === undefined ? 20 : Number(options.limit);
  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_REVIEW_ITEMS) {
    throw new SpacedRepetitionError('حد المراجعات غير صالح', 'INVALID_LIMIT');
  }
  const query: Record<string, unknown> = {
    studentId,
    state: { $ne: 'SUSPENDED' },
    nextReviewAt: { $lte: validDate(options.now) },
  };
  if (options.programId) query.programId = options.programId;
  if (options.subjectId) query.subjectId = options.subjectId;
  const items = await LearningReviewItem.find(query)
    .sort({ priority: -1, nextReviewAt: 1, sourceIdentity: 1 })
    .limit(limit)
    .lean();
  return items.map((item) => publicLearningReviewItem(item as any, validDate(options.now)));
}

export async function listLearningReviewItemsForRecommendation(
  studentId: string,
  options: { programId?: string; now?: Date } = {},
): Promise<Array<{
  programId: string;
  subjectId?: string;
  taxonomyNodeId?: string;
  due: boolean;
  priority: number;
  retentionConfidence: LearningRetentionConfidence;
  reasonCodes: LearningReviewReasonCode[];
  masteryLevel?: MasteryLevel;
}>> {
  if (!String(studentId || '').trim()) throw new SpacedRepetitionError('الطالب غير صالح', 'INVALID_STUDENT');
  const now = validDate(options.now);
  const query: Record<string, unknown> = {
    studentId,
    state: { $ne: 'SUSPENDED' },
    nextReviewAt: { $lte: now },
  };
  if (options.programId) query.programId = options.programId;
  return (await LearningReviewItem.find(query)
    .select('programId subjectId taxonomyNodeId priority retentionConfidence reasonCodes masteryLevel nextReviewAt state')
    .sort({ priority: -1, nextReviewAt: 1, sourceIdentity: 1 })
    .limit(MAX_REVIEW_ITEMS)
    .lean()).map((item: any) => ({
      programId: item.programId,
      subjectId: item.subjectId,
      taxonomyNodeId: item.taxonomyNodeId,
      due: true,
      priority: item.priority,
      retentionConfidence: item.retentionConfidence,
      reasonCodes: item.reasonCodes || [],
      masteryLevel: item.masteryLevel,
    }));
}