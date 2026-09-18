import mongoose from 'mongoose';
import { FoundationContent, Question, TahsiliQuestion } from '../mongodb/models';
import {
  LearningAttempt,
  LearningErrorEvidence,
  StudentMastery,
  type LearningAttemptSourceType,
  type LearningErrorConfidence,
  type LearningErrorType,
  type MasteryLevel,
} from '../mongodb/learningProfileModels';
import {
  QuestionLearningMap,
  type IQuestionLearningMap,
} from '../mongodb/learningContentModels';
import {
  type LearningProgram,
  type LearningSubject,
} from '../learning/contentMap';
import {
  type LearningSessionPlan,
  type LearningSessionStep,
  type TodayLearningSessionView,
} from './dailyLearningSessionService';

export type QuestionSelectionActivity =
  | 'LEARN'
  | 'PRACTICE'
  | 'REVIEW'
  | 'RECOVERY_CHECK'
  | 'MASTERY_CHECK'
  | 'DIAGNOSTIC'
  | 'RETRY';
export type QuestionDifficulty = 'beginner' | 'intermediate' | 'advanced';
export type QuestionSelectionStatus =
  | 'SELECTED'
  | 'NO_SUITABLE_CONTENT'
  | 'SELECTION_PENDING';

export interface QuestionSelectionAttempt {
  id?: string;
  questionId: string;
  sourceType: LearningAttemptSourceType;
  sourceKey?: string;
  programId: string;
  subjectId?: string;
  isAnswered: boolean;
  isCorrect: boolean;
  createdAt: Date | string;
  topic?: string;
  subcategory?: string;
  category?: string;
}

export interface QuestionSelectionErrorEvidence {
  questionId?: string;
  sourceType?: LearningAttemptSourceType;
  sourceKey?: string;
  programId: string;
  subjectId?: string;
  errorType: LearningErrorType;
  confidence: LearningErrorConfidence;
  detectedAt: Date | string;
  topic?: string;
  subcategory?: string;
  category?: string;
  taxonomyNodeId?: string;
}

export interface QuestionSelectionMastery {
  taxonomyNodeId: string;
  taxonomyNodeType?: string;
  programId: string;
  subjectId?: string;
  masteryScore?: number;
  masteryLevel: MasteryLevel;
  evidenceCount?: number;
  confidence?: LearningErrorConfidence;
}

export interface QuestionSelectionContext {
  studentId: string;
  programId: string;
  subjectId?: string;
  taxonomyNodeId?: string;
  activityType: QuestionSelectionActivity;
  sessionId?: string;
  attemptHistory?: QuestionSelectionAttempt[];
  mastery?: QuestionSelectionMastery[];
  errorEvidence?: QuestionSelectionErrorEvidence[];
  difficultyTarget?: QuestionDifficulty;
  retryQuestionId?: string;
  now?: Date;
}

export interface QuestionCandidate {
  questionId: string;
  sourceType: LearningAttemptSourceType;
  sourceKey: string;
  programId: string;
  subjectId?: string;
  taxonomyNodeIds?: string[];
  taxonomyApproved?: boolean;
  category?: string;
  subcategory?: string;
  topic?: string;
  difficulty?: QuestionDifficulty;
  answerConfidence?: 'verified' | 'review';
  text: string;
  options: string[];
  correctOptionIndex: number;
  explanation?: string;
  imageUrl?: string;
  imageUrls?: string[];
  sourceLabel?: string;
}

export interface PublicSelectedQuestion {
  questionId: string;
  sourceType: LearningAttemptSourceType;
  sourceKey: string;
  programId: string;
  subjectId?: string;
  category?: string;
  subcategory?: string;
  topic?: string;
  difficulty?: QuestionDifficulty;
  text: string;
  options: string[];
  explanation?: string;
  imageUrl?: string;
  imageUrls?: string[];
  sourceLabel?: string;
}

export interface FoundationContentSelection {
  contentId: string;
  programId: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl?: string;
  durationMinutes?: number;
  linkedQuizRoute?: string;
  hasQuiz: boolean;
}

export interface QuestionSelectionResult {
  selectionStatus: QuestionSelectionStatus;
  activityType: QuestionSelectionActivity;
  sessionId?: string;
  stepId?: string;
  contentReference?: {
    kind: 'foundation_content' | 'question' | 'question_selection_pending';
    id: string;
    programId: string;
    subjectId?: string;
    availability: 'available' | 'deferred' | 'required' | 'unavailable';
    sourceType?: LearningAttemptSourceType;
    sourceKey?: string;
    questionId?: string;
  };
  question?: PublicSelectedQuestion;
  foundationContent?: FoundationContentSelection;
}

export interface QuestionCandidateFilteringResult {
  eligible: QuestionCandidate[];
  excluded: Array<{ questionId: string; reason: string }>;
}

export class QuestionSelectionError extends Error {
  constructor(
    message: string,
    public readonly code:
      | 'INVALID_STUDENT'
      | 'INVALID_PROGRAM'
      | 'INVALID_SESSION'
      | 'INVALID_STEP'
      | 'SELECTION_PENDING'
      | 'NO_SUITABLE_CONTENT',
  ) {
    super(message);
    this.name = 'QuestionSelectionError';
  }
}

const TRUSTED_SOURCES = new Set<LearningAttemptSourceType>([
  'mongo_question',
  'mongo_tahsili_question',
]);
const RECENT_EXCLUSION_MS = 24 * 60 * 60 * 1000;
const MAX_CANDIDATES = 500;
const DEEP_TAXONOMY_PREFIXES = new Set(['topic.', 'skill.', 'subskill.', 'concept.']);
const CONCEPT_ERROR_TYPES = new Set<LearningErrorType>([
  'CONCEPT_GAP',
  'MISUNDERSTANDING',
  'MEMORY_GAP',
  'PARTIAL_UNDERSTANDING',
]);

export function validateQuestionSelectionContext(context: QuestionSelectionContext): void {
  if (!context.studentId.trim()) {
    throw new QuestionSelectionError('studentId غير صالح', 'INVALID_STUDENT');
  }
  if (!['program.qudrat', 'program.tahsili'].includes(context.programId)) {
    throw new QuestionSelectionError('البرنامج غير صالح', 'INVALID_PROGRAM');
  }
}

export function sessionBelongsToStudent(session: { studentId?: unknown } | null | undefined, studentId: string): boolean {
  return Boolean(session && studentId.trim() && String(session.studentId) === studentId);
}

function asDate(value: Date | string | undefined): Date | undefined {
  if (!value) return undefined;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isFinite(date.getTime()) ? date : undefined;
}

function normalizedProgram(value: string): string {
  return String(value || '').replace(/^program\./, '').trim();
}

function subjectFromId(subjectId: string | undefined): string | undefined {
  if (!subjectId) return undefined;
  const parts = subjectId.split('.');
  return parts.length >= 3 ? parts.slice(2).join('.') : subjectId;
}

function isDeepTaxonomyNode(nodeId: string | undefined): boolean {
  return Boolean(nodeId && [...DEEP_TAXONOMY_PREFIXES].some((prefix) => nodeId.startsWith(prefix)));
}

function questionKey(question: {
  sourceType: LearningAttemptSourceType;
  sourceKey?: string;
  questionId: string;
}): string {
  return JSON.stringify([question.sourceType, question.sourceKey, question.questionId]);
}

function hasValidQuestion(candidate: QuestionCandidate): boolean {
  return TRUSTED_SOURCES.has(candidate.sourceType) &&
    Boolean(candidate.questionId.trim()) &&
    Boolean(candidate.text.trim()) &&
    Array.isArray(candidate.options) &&
    candidate.options.length >= 2 &&
    Number.isInteger(candidate.correctOptionIndex) &&
    candidate.correctOptionIndex >= 0 &&
    candidate.correctOptionIndex < candidate.options.length &&
    (candidate.sourceType !== 'mongo_tahsili_question' || candidate.answerConfidence === 'verified');
}

function sameScope(
  candidate: QuestionCandidate,
  context: QuestionSelectionContext,
): boolean {
  if (normalizedProgram(candidate.programId) !== normalizedProgram(context.programId)) return false;
  if (context.subjectId && candidate.subjectId !== context.subjectId) return false;
  return true;
}

function approvedTaxonomyMatch(
  candidate: QuestionCandidate,
  taxonomyNodeId: string | undefined,
): boolean {
  return Boolean(
    taxonomyNodeId &&
    candidate.taxonomyApproved &&
    candidate.taxonomyNodeIds?.includes(taxonomyNodeId),
  );
}

function recentAttempt(
  candidate: QuestionCandidate,
  attempts: QuestionSelectionAttempt[],
  now: Date,
): boolean {
  return attempts.some((attempt) => {
    const createdAt = asDate(attempt.createdAt);
    return createdAt &&
      now.getTime() - createdAt.getTime() >= 0 &&
      now.getTime() - createdAt.getTime() <= RECENT_EXCLUSION_MS &&
      questionKey(attempt) === questionKey(candidate);
  });
}

function attemptedBefore(
  candidate: QuestionCandidate,
  attempts: QuestionSelectionAttempt[],
): boolean {
  return attempts.some((attempt) => questionKey(attempt) === questionKey(candidate));
}

function retryAllowed(candidate: QuestionCandidate, context: QuestionSelectionContext): boolean {
  return context.activityType === 'RETRY' &&
    Boolean(context.retryQuestionId) &&
    candidate.questionId === context.retryQuestionId;
}

function taxonomyCandidatesExist(
  candidates: QuestionCandidate[],
  context: QuestionSelectionContext,
): boolean {
  if (!isDeepTaxonomyNode(context.taxonomyNodeId)) return false;
  return candidates.some((candidate) => approvedTaxonomyMatch(candidate, context.taxonomyNodeId));
}

/**
 * Filters a caller-provided pool using only verifiable scope and answer-key
 * rules. It deliberately falls back to program/subject when deep taxonomy is
 * not approved or unavailable.
 */
export function filterQuestionCandidates(
  candidates: QuestionCandidate[],
  context: QuestionSelectionContext,
): QuestionCandidateFilteringResult {
  const now = context.now || new Date();
  const excluded: Array<{ questionId: string; reason: string }> = [];
  const scoped = candidates.filter((candidate) => {
    if (!hasValidQuestion(candidate)) {
      excluded.push({ questionId: candidate.questionId || 'unknown', reason: 'invalid_question' });
      return false;
    }
    if (!sameScope(candidate, context)) {
      excluded.push({ questionId: candidate.questionId, reason: 'wrong_program_or_subject' });
      return false;
    }
    if (
      context.activityType !== 'RETRY' &&
      recentAttempt(candidate, context.attemptHistory || [], now)
    ) {
      excluded.push({ questionId: candidate.questionId, reason: 'recently_answered' });
      return false;
    }
    if (
      context.activityType !== 'RETRY' &&
      attemptedBefore(candidate, context.attemptHistory || [])
    ) {
      excluded.push({ questionId: candidate.questionId, reason: 'repeated_exact_question' });
      return false;
    }
    if (
      context.activityType === 'RETRY' &&
      !retryAllowed(candidate, context)
    ) {
      excluded.push({ questionId: candidate.questionId, reason: 'retry_target_mismatch' });
      return false;
    }
    return true;
  });

  if (taxonomyCandidatesExist(scoped, context)) {
    return {
      eligible: scoped.filter((candidate) => approvedTaxonomyMatch(candidate, context.taxonomyNodeId)),
      excluded: [
        ...excluded,
        ...scoped
          .filter((candidate) => !approvedTaxonomyMatch(candidate, context.taxonomyNodeId))
          .map((candidate) => ({ questionId: candidate.questionId, reason: 'outside_approved_taxonomy' })),
      ],
    };
  }
  return { eligible: scoped, excluded };
}

function difficultyDistance(
  candidate: QuestionDifficulty | undefined,
  target: QuestionDifficulty | undefined,
): number {
  if (!candidate || !target) return 0;
  const rank: Record<QuestionDifficulty, number> = {
    beginner: 1,
    intermediate: 2,
    advanced: 3,
  };
  return Math.abs(rank[candidate] - rank[target]);
}

function errorAlignments(
  candidate: QuestionCandidate,
  context: QuestionSelectionContext,
): number {
  return (context.errorEvidence || []).reduce((score, error) => {
    if (error.programId !== context.programId || (context.subjectId && error.subjectId !== context.subjectId)) {
      return score;
    }
    const metadataMatch = Boolean(
      (error.topic && candidate.topic && error.topic === candidate.topic) ||
      (error.subcategory && candidate.subcategory && error.subcategory === candidate.subcategory) ||
      (error.category && candidate.category && error.category === candidate.category),
    );
    const taxonomyMatch = Boolean(
      error.taxonomyNodeId &&
      approvedTaxonomyMatch(candidate, error.taxonomyNodeId),
    );
    if (!metadataMatch && !taxonomyMatch) return score;
    const confidence = error.confidence === 'HIGH' ? 2 : error.confidence === 'MEDIUM' ? 1 : 0;
    return score + (CONCEPT_ERROR_TYPES.has(error.errorType) ? 22 : 16) + confidence * 3;
  }, 0);
}

function masteryForCandidate(
  candidate: QuestionCandidate,
  context: QuestionSelectionContext,
): QuestionSelectionMastery | undefined {
  return (context.mastery || []).find((mastery) => {
    if (mastery.programId !== context.programId) return false;
    if (context.subjectId && mastery.subjectId !== context.subjectId) return false;
    return mastery.taxonomyNodeId === context.taxonomyNodeId ||
      candidate.taxonomyNodeIds?.includes(mastery.taxonomyNodeId);
  });
}

function reviewAlignment(
  candidate: QuestionCandidate,
  context: QuestionSelectionContext,
): number {
  if (context.activityType !== 'REVIEW') return 0;
  return (context.attemptHistory || []).some((attempt) =>
    (candidate.topic && attempt.topic === candidate.topic) ||
    (candidate.subcategory && attempt.subcategory === candidate.subcategory) ||
    (candidate.category && attempt.category === candidate.category)
  ) ? 18 : 0;
}

function diversityPenalty(
  candidate: QuestionCandidate,
  context: QuestionSelectionContext,
): number {
  const attempts = (context.attemptHistory || []).slice(0, 20);
  const sameSource = attempts.filter((attempt) => attempt.sourceType === candidate.sourceType).length;
  const sameCategory = attempts.filter((attempt) => candidate.category && attempt.category === candidate.category).length;
  return Math.min(20, sameSource * 2 + sameCategory);
}

function candidateScore(
  candidate: QuestionCandidate,
  context: QuestionSelectionContext,
): number {
  let score = 100;
  if (approvedTaxonomyMatch(candidate, context.taxonomyNodeId)) score += 40;
  score += errorAlignments(candidate, context);
  score += reviewAlignment(candidate, context);
  if (context.difficultyTarget) {
    const distance = difficultyDistance(candidate.difficulty, context.difficultyTarget);
    score += distance === 0 ? 14 : distance === 1 ? 5 : -8;
  }
  const mastery = masteryForCandidate(candidate, context);
  if (mastery?.masteryLevel === 'MASTERED' && !['REVIEW', 'MASTERY_CHECK'].includes(context.activityType)) {
    score -= 45;
  }
  if (mastery?.masteryLevel === 'EMERGING' || mastery?.masteryLevel === 'DEVELOPING') score += 8;
  score -= diversityPenalty(candidate, context);
  return score;
}

function stableCompare(a: QuestionCandidate, b: QuestionCandidate, context: QuestionSelectionContext): number {
  const scoreDifference = candidateScore(b, context) - candidateScore(a, context);
  if (scoreDifference !== 0) return scoreDifference;
  return [a.sourceType, a.sourceKey, a.questionId].join('|')
    .localeCompare([b.sourceType, b.sourceKey, b.questionId].join('|'));
}

export function selectQuestionFromCandidates(
  candidates: QuestionCandidate[],
  context: QuestionSelectionContext,
): { candidate: QuestionCandidate | null; filtering: QuestionCandidateFilteringResult } {
  validateQuestionSelectionContext(context);
  if (context.activityType === 'DIAGNOSTIC') {
    return {
      candidate: null,
      filtering: { eligible: [], excluded: candidates.map((candidate) => ({ questionId: candidate.questionId, reason: 'diagnostic_selection_pending' })) },
    };
  }
  const filtering = filterQuestionCandidates(candidates, context);
  const sorted = [...filtering.eligible].sort((a, b) => stableCompare(a, b, context));
  return { candidate: sorted[0] || null, filtering };
}

export function applySelectedContentReference(
  plan: LearningSessionPlan,
  stepId: string,
  contentReference: NonNullable<QuestionSelectionResult['contentReference']>,
): LearningSessionPlan {
  return {
    ...plan,
    steps: plan.steps.map((step) =>
      step.stepId === stepId
        ? { ...step, contentReference }
        : step
    ),
  };
}

function publicQuestion(candidate: QuestionCandidate): PublicSelectedQuestion {
  return {
    questionId: candidate.questionId,
    sourceType: candidate.sourceType,
    sourceKey: candidate.sourceKey,
    programId: candidate.programId,
    subjectId: candidate.subjectId,
    category: candidate.category,
    subcategory: candidate.subcategory,
    topic: candidate.topic,
    difficulty: candidate.difficulty,
    text: candidate.text,
    options: candidate.options,
    explanation: candidate.explanation,
    imageUrl: candidate.imageUrl,
    imageUrls: candidate.imageUrls,
    sourceLabel: candidate.sourceLabel,
  };
}

function questionReference(candidate: QuestionCandidate): QuestionSelectionResult['contentReference'] {
  return {
    kind: 'question',
    id: candidate.questionId,
    questionId: candidate.questionId,
    programId: candidate.programId,
    subjectId: candidate.subjectId,
    availability: 'available',
    sourceType: candidate.sourceType,
    sourceKey: candidate.sourceKey,
  };
}

function candidateFromQuestion(question: any, subjectId?: string, sourceKey = 'question-bank'): QuestionCandidate {
  return {
    questionId: String(question.questionId ?? question._id),
    sourceType: 'mongo_question',
    sourceKey,
    programId: 'program.qudrat',
    subjectId,
    category: question.category,
    subcategory: question.subcategory,
    topic: question.topic,
    difficulty: question.difficulty,
    text: question.text,
    options: Array.isArray(question.options) ? question.options : [],
    correctOptionIndex: question.correctOptionIndex,
    explanation: question.explanation,
    imageUrl: question.imageUrl,
    imageUrls: question.imageUrls,
    sourceLabel: 'Qudrat question bank',
  };
}

function candidateFromTahsiliQuestion(question: any): QuestionCandidate {
  const questionId = String(question.questionId);
  return {
    questionId,
    sourceType: 'mongo_tahsili_question',
    sourceKey: `tahsili:${question.sourceBook}:${question.sourcePage}:${question.sourceQuestionNumber ?? questionId}`,
    programId: 'program.tahsili',
    subjectId: `subject.tahsili.${question.subject === 'رياضيات' ? 'math' :
      question.subject === 'فيزياء' ? 'physics' :
        question.subject === 'كيمياء' ? 'chemistry' :
          question.subject === 'أحياء' ? 'biology' : 'environment'}`,
    category: question.subject,
    subcategory: question.subcategory,
    topic: question.topic,
    difficulty: question.difficulty,
    answerConfidence: question.answerConfidence,
    text: question.text,
    options: Array.isArray(question.options) ? question.options : [],
    correctOptionIndex: question.correctOptionIndex,
    explanation: question.explanation,
    sourceLabel: question.sourceBook,
  };
}

function mapForQuestion(
  maps: IQuestionLearningMap[],
  sourceType: LearningAttemptSourceType,
  question: any,
): IQuestionLearningMap | undefined {
  return maps.find((map) =>
    map.sourceType === sourceType &&
    (
      (map.questionObjectId && String(map.questionObjectId) === String(question._id)) ||
      (map.questionId !== undefined && String(map.questionId) === String(question.questionId))
    )
  );
}

function applyApprovedMap(
  candidate: QuestionCandidate,
  map: IQuestionLearningMap | undefined,
): QuestionCandidate {
  if (!map || map.status !== 'mapped' || map.reviewStatus !== 'APPROVED') return candidate;
  const nodeIds = Object.values(map.taxonomy || {}).filter((value): value is string => typeof value === 'string' && value.trim().length > 0);
  return {
    ...candidate,
    taxonomyNodeIds: nodeIds,
    taxonomyApproved: true,
    difficulty: map.difficulty || candidate.difficulty,
  };
}

async function loadQuestionCandidates(context: QuestionSelectionContext): Promise<QuestionCandidate[]> {
  const program = normalizedProgram(context.programId);
  const subject = subjectFromId(context.subjectId);
  if (program === 'qudrat') {
    const category = subject === 'verbal' || subject === 'quantitative' ? subject : undefined;
    const query: Record<string, unknown> = category
      ? { category }
      : { category: { $in: ['verbal', 'quantitative'] } };
    const questions = await Question.find(query)
      .select('_id category subcategory topic difficulty text options correctOptionIndex explanation imageUrl imageUrls questionId')
      .sort({ questionId: 1, _id: 1 })
      .limit(MAX_CANDIDATES)
      .lean();
    const maps = await QuestionLearningMap.find({
      sourceType: 'mongo_question',
      'taxonomy.program': 'qudrat',
      ...(subject ? { 'taxonomy.subject': subject } : {}),
      status: 'mapped',
      reviewStatus: 'APPROVED',
    }).select('sourceType questionObjectId questionId taxonomy difficulty status reviewStatus').lean();
    return questions.map((question: any) =>
      applyApprovedMap(candidateFromQuestion(question, context.subjectId), mapForQuestion(maps, 'mongo_question', question)));
  }
  if (program === 'tahsili') {
    const query: Record<string, unknown> = {
      answerConfidence: 'verified',
      ...(subject ? { subject } : {}),
    };
    const questions = await TahsiliQuestion.find(query)
      .select('questionId subject subcategory topic difficulty text options correctOptionIndex explanation sourcePage sourceQuestionNumber sourceBook answerConfidence')
      .sort({ questionId: 1, sourcePage: 1, sourceQuestionNumber: 1 })
      .limit(MAX_CANDIDATES)
      .lean();
    const maps = await QuestionLearningMap.find({
      sourceType: 'mongo_tahsili_question',
      'taxonomy.program': 'tahsili',
      ...(subject ? { 'taxonomy.subject': subject } : {}),
      status: 'mapped',
      reviewStatus: 'APPROVED',
    }).select('sourceType questionObjectId questionId taxonomy difficulty status reviewStatus').lean();
    return questions.map((question: any) =>
      applyApprovedMap(candidateFromTahsiliQuestion(question), mapForQuestion(maps, 'mongo_tahsili_question', question)));
  }
  return [];
}

async function loadSelectionContext(
  context: QuestionSelectionContext,
): Promise<QuestionSelectionContext> {
  const [attempts, errors, mastery] = await Promise.all([
    context.attemptHistory
      ? Promise.resolve(context.attemptHistory)
      : LearningAttempt.find({
        studentId: context.studentId,
        programId: context.programId,
        ...(context.subjectId ? { subjectId: context.subjectId } : {}),
      }).sort({ createdAt: -1 }).limit(250).lean(),
    context.errorEvidence
      ? Promise.resolve(context.errorEvidence)
      : LearningErrorEvidence.find({
        studentId: context.studentId,
        programId: context.programId,
        ...(context.subjectId ? { subjectId: context.subjectId } : {}),
      }).sort({ detectedAt: -1 }).limit(250).lean(),
    context.mastery
      ? Promise.resolve(context.mastery)
      : StudentMastery.find({
        studentId: context.studentId,
        programId: context.programId,
        ...(context.subjectId ? { subjectId: context.subjectId } : {}),
      }).sort({ updatedAt: -1 }).limit(50).lean(),
  ]);
  return {
    ...context,
    attemptHistory: (attempts as any[]).map((attempt) => ({
      id: attempt._id ? String(attempt._id) : undefined,
      questionId: String(attempt.questionId),
      sourceType: attempt.sourceType,
      sourceKey: attempt.sourceKey,
      programId: attempt.programId,
      subjectId: attempt.subjectId,
      isAnswered: Boolean(attempt.isAnswered),
      isCorrect: Boolean(attempt.isCorrect),
      createdAt: attempt.createdAt,
      topic: attempt.metadata?.topic,
      subcategory: attempt.metadata?.subcategory,
      category: attempt.metadata?.category,
    })),
    errorEvidence: (errors as any[]).map((error) => ({
      questionId: error.questionId ? String(error.questionId) : undefined,
      sourceType: error.sourceType,
      sourceKey: error.sourceKey,
      programId: error.programId,
      subjectId: error.subjectId,
      errorType: error.errorType,
      confidence: error.confidence,
      detectedAt: error.detectedAt,
      topic: error.observed?.questionMetadata?.topic,
      subcategory: error.observed?.questionMetadata?.subcategory,
      category: error.observed?.questionMetadata?.category,
    })),
    mastery: (mastery as any[]).map((record) => ({
      taxonomyNodeId: record.taxonomyNodeId,
      taxonomyNodeType: record.taxonomyNodeType,
      programId: record.programId,
      subjectId: record.subjectId,
      masteryScore: record.masteryScore,
      masteryLevel: record.masteryLevel,
      evidenceCount: record.evidenceCount,
      confidence: record.confidence,
    })),
  };
}

async function selectFoundationContent(
  context: QuestionSelectionContext,
  step: LearningSessionStep,
): Promise<QuestionSelectionResult> {
  if (!mongoose.Types.ObjectId.isValid(step.contentReference.id)) {
    return {
      selectionStatus: 'NO_SUITABLE_CONTENT',
      activityType: context.activityType,
      sessionId: context.sessionId,
      stepId: step.stepId,
    };
  }
  const content = await FoundationContent.findOne({
    _id: step.contentReference.id,
    program: normalizedProgram(context.programId),
    published: true,
  } as any).select('_id program title description videoUrl thumbnailUrl durationMinutes linkedQuizRoute quiz').lean() as any;
  if (!content) {
    return {
      selectionStatus: 'NO_SUITABLE_CONTENT',
      activityType: context.activityType,
      sessionId: context.sessionId,
      stepId: step.stepId,
    };
  }
  const foundationContent: FoundationContentSelection = {
    contentId: String(content._id),
    programId: `program.${content.program}`,
    title: content.title,
    description: content.description,
    videoUrl: content.videoUrl,
    thumbnailUrl: content.thumbnailUrl,
    durationMinutes: content.durationMinutes,
    linkedQuizRoute: content.linkedQuizRoute,
    hasQuiz: Array.isArray(content.quiz?.questionIds) && content.quiz.questionIds.length > 0,
  };
  return {
    selectionStatus: 'SELECTED',
    activityType: context.activityType,
    sessionId: context.sessionId,
    stepId: step.stepId,
    contentReference: {
      kind: 'foundation_content',
      id: foundationContent.contentId,
      programId: foundationContent.programId,
      subjectId: context.subjectId,
      availability: 'available',
    },
    foundationContent,
  };
}

export async function selectContentForSessionStep(
  studentId: string,
  session: any,
  stepId: string,
  retry = false,
): Promise<QuestionSelectionResult> {
  if (!studentId.trim()) throw new QuestionSelectionError('studentId غير صالح', 'INVALID_STUDENT');
  if (!sessionBelongsToStudent(session, studentId)) {
    throw new QuestionSelectionError('جلسة التعلم غير موجودة', 'INVALID_SESSION');
  }
  const snapshot = session?.planSnapshot as LearningSessionPlan | undefined;
  if (!snapshot) throw new QuestionSelectionError('خطة الجلسة غير موجودة', 'INVALID_SESSION');
  const step = Array.isArray(snapshot.steps)
    ? snapshot.steps.find((candidate) => candidate.stepId === stepId)
    : undefined;
  if (!step) throw new QuestionSelectionError('خطوة الجلسة غير موجودة', 'INVALID_STEP');
  const activityType = step.stepType === 'MASTERY_CHECK'
    ? 'MASTERY_CHECK'
    : step.stepType === 'READ' || step.stepType === 'EXAMPLE'
      ? 'LEARN'
      : retry ? 'RETRY' : snapshot.recommendationType === 'REVIEW'
        ? 'REVIEW'
        : snapshot.recommendationType === 'RECOVERY_CHECK'
          ? 'RECOVERY_CHECK'
          : 'PRACTICE';
  if (activityType === 'LEARN' && step.contentReference.kind === 'foundation_content') {
    validateQuestionSelectionContext({
      studentId,
      programId: snapshot.programId,
      subjectId: snapshot.subjectId,
      activityType,
      sessionId: String(session._id),
    });
    return selectFoundationContent(
      { studentId, programId: snapshot.programId, subjectId: snapshot.subjectId, activityType, sessionId: String(session._id) },
      step,
    );
  }
  if (snapshot.planStatus === 'DIAGNOSTIC_REQUIRED') {
    return {
      selectionStatus: 'SELECTION_PENDING',
      activityType: 'DIAGNOSTIC',
      sessionId: String(session._id),
      stepId,
      contentReference: {
        kind: 'question_selection_pending',
        id: step.contentReference.id,
        programId: snapshot.programId,
        subjectId: snapshot.subjectId,
        availability: 'required',
      },
    };
  }

  if (step.contentReference.kind === 'question' && step.contentReference.questionId && !retry) {
    const candidate: QuestionCandidate = {
      questionId: step.contentReference.questionId,
      sourceType: step.contentReference.sourceType as LearningAttemptSourceType,
      sourceKey: step.contentReference.sourceKey || '',
      programId: snapshot.programId,
      subjectId: snapshot.subjectId,
      text: '',
      options: [],
      correctOptionIndex: -1,
    };
    const context = await loadSelectionContext({
      studentId,
      programId: snapshot.programId,
      subjectId: snapshot.subjectId,
      taxonomyNodeId: snapshot.taxonomyNodeId || snapshot.subjectId,
      activityType,
      sessionId: String(session._id),
    });
    const candidates = await loadQuestionCandidates(context);
    const selected = candidates.find((item) => questionKey(item) === questionKey(candidate));
    if (selected) {
      return {
        selectionStatus: 'SELECTED',
        activityType,
        sessionId: String(session._id),
        stepId,
        contentReference: questionReference(selected),
        question: publicQuestion(selected),
      };
    }
  }

  const context = await loadSelectionContext({
    studentId,
    programId: snapshot.programId,
    subjectId: snapshot.subjectId,
    taxonomyNodeId: snapshot.taxonomyNodeId || snapshot.subjectId,
    activityType,
    sessionId: String(session._id),
    retryQuestionId: retry ? step.contentReference.questionId : undefined,
  });
  if (retry && !context.retryQuestionId) {
    throw new QuestionSelectionError('لا يوجد سؤال محدد لإعادة المحاولة', 'NO_SUITABLE_CONTENT');
  }
  const candidates = await loadQuestionCandidates(context);
  const selected = selectQuestionFromCandidates(candidates, context).candidate;
  if (!selected) {
    return {
      selectionStatus: 'NO_SUITABLE_CONTENT',
      activityType,
      sessionId: String(session._id),
      stepId,
      contentReference: {
        kind: 'question_selection_pending',
        id: step.contentReference.id,
        programId: snapshot.programId,
        subjectId: snapshot.subjectId,
        availability: 'unavailable',
      },
    };
  }
  return {
    selectionStatus: 'SELECTED',
    activityType,
    sessionId: String(session._id),
    stepId,
    contentReference: questionReference(selected),
    question: publicQuestion(selected),
  };
}

export async function selectAndPersistContentForSessionStep(
  studentId: string,
  session: any,
  stepId: string,
  retry = false,
): Promise<QuestionSelectionResult> {
  const result = await selectContentForSessionStep(studentId, session, stepId, retry);
  if (result.selectionStatus !== 'SELECTED' || !result.contentReference) return result;
  const snapshot = session.planSnapshot as LearningSessionPlan;
  session.planSnapshot = applySelectedContentReference(
    snapshot,
    stepId,
    result.contentReference,
  ) as unknown as Record<string, unknown>;
  await session.save();
  return result;
}

export function publicQuestionSelection(result: QuestionSelectionResult) {
  return {
    selectionStatus: result.selectionStatus,
    activityType: result.activityType,
    sessionId: result.sessionId,
    stepId: result.stepId,
    contentReference: result.contentReference,
    question: result.question,
    foundationContent: result.foundationContent,
  };
}

export function publicQuestionSelectionFromTodayView(
  view: TodayLearningSessionView,
): Pick<QuestionSelectionResult, 'sessionId' | 'stepId'> {
  return {
    sessionId: view.sessionId,
    stepId: view.plan?.nextStep?.stepId,
  };
}