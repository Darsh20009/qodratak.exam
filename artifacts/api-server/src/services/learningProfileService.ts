import mongoose from 'mongoose';
import { ActivityLog, StudentLearningProfile, TahsiliQuestion, Question } from '../mongodb/models';
import {
  LearningAttempt,
  LearningAttemptSequence,
  LearningSession,
  type LearningAttemptSourceType,
} from '../mongodb/learningProfileModels';
import {
  CONTROLLED_TAXONOMY_NODES,
  type MappingConfidence,
} from '../learning/taxonomyRegistry';
import { recordAutomaticLearningErrorEvidence } from './learningErrorService';
import { recalculateMasteryForAttempt } from './masteryService';

const approvedPrograms = new Set(
  CONTROLLED_TAXONOMY_NODES
    .filter((node) => node.type === 'PROGRAM' && node.status === 'APPROVED')
    .map((node) => node.code),
);
const approvedSubjects = new Map(
  CONTROLLED_TAXONOMY_NODES
    .filter((node) => node.type === 'SUBJECT' && node.status === 'APPROVED')
    .map((node) => [node.code, node.parentId]),
);

export interface LearningAttemptInput {
  questionId: string;
  sourceType?: LearningAttemptSourceType;
  sourceKey?: string;
  programId: string;
  subjectId?: string;
  selectedAnswer?: string | number | null;
  correctAnswer?: string | number | null;
  isAnswered?: boolean;
  isCorrect: boolean;
  responseTime?: number;
  sessionId?: string;
  idempotencyKey?: string;
  metadata?: Record<string, unknown>;
}

export interface NormalizedLearningAttemptInput {
  questionId: string;
  sourceType: LearningAttemptSourceType;
  sourceKey?: string;
  programId: string;
  subjectId?: string;
  selectedAnswer?: string | number | null;
  correctAnswer?: string | number | null;
  isAnswered: boolean;
  isCorrect: boolean;
  responseTime: number;
  sessionId?: mongoose.Types.ObjectId;
  idempotencyKey?: string;
  metadata?: Record<string, unknown>;
}

export interface VerifiedLearningAttemptInput extends Omit<LearningAttemptInput, 'correctAnswer' | 'isCorrect'> {
  sourceType?: LearningAttemptSourceType;
}

export interface ServerQuestionAnswerKey {
  correctOptionIndex: number;
  optionsCount: number;
}

export class LearningAttemptError extends Error {
  constructor(
    message: string,
    public readonly code:
      | 'INVALID_INPUT'
      | 'UNKNOWN_QUESTION'
      | 'INVALID_ANSWER'
      | 'INVALID_SESSION'
      | 'IDEMPOTENCY_CONFLICT',
  ) {
    super(message);
    this.name = 'LearningAttemptError';
  }
}

export function learningAttemptSourceIdentity(
  sourceType: LearningAttemptSourceType,
  sourceKey: string | undefined,
  questionId: string,
): string {
  return JSON.stringify([sourceType, sourceKey?.trim() || '', questionId]);
}

export function isSameIdempotentAttempt(
  existing: { sourceIdentity?: string; selectedAnswer?: unknown; sessionId?: unknown },
  sourceIdentity: string,
  selectedAnswer: unknown,
  sessionId?: unknown,
): boolean {
  return existing.sourceIdentity === sourceIdentity &&
    String(existing.selectedAnswer ?? '') === String(selectedAnswer ?? '') &&
    String(existing.sessionId ?? '') === String(sessionId ?? '');
}

function normalizeSelectedAnswer(value: unknown): number | null | 'invalid' {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value === 'boolean' || (typeof value !== 'number' && typeof value !== 'string')) {
    return 'invalid';
  }
  const normalized = Number(value);
  return Number.isInteger(normalized) ? normalized : 'invalid';
}

export function normalizeLearningAttemptInput(input: LearningAttemptInput):
  | { ok: true; value: NormalizedLearningAttemptInput }
  | { ok: false; error: string } {
  const questionId = String(input.questionId ?? '').trim();
  const programId = String(input.programId ?? '').trim();
  const subjectId = input.subjectId ? String(input.subjectId).trim() : undefined;
  const responseTime = Number(input.responseTime ?? 0);
  const isAnswered = input.isAnswered ?? (
    input.selectedAnswer !== null && input.selectedAnswer !== undefined
  );

  if (!questionId || questionId.length > 200) return { ok: false, error: 'questionId مطلوب' };
  if (!approvedPrograms.has(programId)) return { ok: false, error: 'programId ليس برنامجًا معتمدًا' };
  if (!['mongo_question', 'mongo_tahsili_question', 'postgres_question', 'legacy_json', 'unknown'].includes(input.sourceType ?? 'unknown')) {
    return { ok: false, error: 'sourceType غير صالح' };
  }
  if (subjectId && (!approvedSubjects.has(subjectId) || approvedSubjects.get(subjectId) !== programId)) {
    return { ok: false, error: 'subjectId ليس مادة معتمدة لهذا البرنامج' };
  }
  if (typeof input.isCorrect !== 'boolean') return { ok: false, error: 'isCorrect مطلوب' };
  if (!Number.isFinite(responseTime) || responseTime < 0 || responseTime > 86400) {
    return { ok: false, error: 'responseTime غير صالح' };
  }
  if (input.sessionId && !mongoose.Types.ObjectId.isValid(input.sessionId)) {
    return { ok: false, error: 'sessionId غير صالح' };
  }
  if (input.idempotencyKey && String(input.idempotencyKey).trim().length > 160) {
    return { ok: false, error: 'idempotencyKey طويل جدًا' };
  }

  return {
    ok: true,
    value: {
      questionId,
      sourceType: input.sourceType ?? 'unknown',
      sourceKey: input.sourceKey?.trim() || undefined,
      programId,
      subjectId,
      selectedAnswer: input.selectedAnswer ?? null,
      correctAnswer: input.correctAnswer ?? null,
      isAnswered: Boolean(isAnswered),
      isCorrect: Boolean(input.isCorrect) && Boolean(isAnswered),
      responseTime,
      sessionId: input.sessionId ? new mongoose.Types.ObjectId(input.sessionId) : undefined,
      idempotencyKey: input.idempotencyKey?.trim() || undefined,
      metadata: input.metadata,
    },
  };
}

export function observedAccuracy(correctAttempts: number, wrongAttempts: number): number {
  const answered = correctAttempts + wrongAttempts;
  return answered > 0 ? Math.round((correctAttempts / answered) * 10000) / 100 : 0;
}

export function confidenceForAttemptCount(attempts: number): MappingConfidence {
  if (attempts >= 20) return 'HIGH';
  if (attempts >= 5) return 'MEDIUM';
  return 'LOW';
}

function performanceExpression(path: string, isAnswered: boolean, isCorrect: boolean, responseTime: number, now: Date) {
  const attempts = `\$${path}.attempts`;
  const correct = `\$${path}.correctAttempts`;
  const wrong = `\$${path}.wrongAttempts`;
  const totalResponse = `\$${path}.responseTimeTotalSeconds`;
  const attemptsIncrement = 1;
  const correctIncrement = isCorrect ? 1 : 0;
  const wrongIncrement = isAnswered && !isCorrect ? 1 : 0;
  const totalAnswered = {
    $add: [
      { $ifNull: [correct, 0] },
      { $ifNull: [wrong, 0] },
      correctIncrement,
      wrongIncrement,
    ],
  };
  const nextCorrect = { $add: [{ $ifNull: [correct, 0] }, correctIncrement] };
  const nextResponseTotal = { $add: [{ $ifNull: [totalResponse, 0] }, responseTime] };

  return {
    attempts: { $add: [{ $ifNull: [attempts, 0] }, attemptsIncrement] },
    correctAttempts: nextCorrect,
    wrongAttempts: { $add: [{ $ifNull: [wrong, 0] }, wrongIncrement] },
    accuracy: {
      $cond: [
        { $gt: [totalAnswered, 0] },
        { $multiply: [{ $divide: [nextCorrect, totalAnswered] }, 100] },
        0,
      ],
    },
    averageResponseTime: {
      $cond: [
        { $gt: [{ $add: [{ $ifNull: [attempts, 0] }, attemptsIncrement] }, 0] },
        { $divide: [nextResponseTotal, { $add: [{ $ifNull: [attempts, 0] }, attemptsIncrement] }] },
        0,
      ],
    },
    responseTimeTotalSeconds: nextResponseTotal,
    lastAttemptAt: now,
    ...(isCorrect ? { lastCorrectAt: now } : {}),
    ...(isAnswered && !isCorrect ? { lastWrongAt: now } : {}),
  };
}

async function ensureProfile(studentId: string, programId: string): Promise<void> {
  const program = programId.replace(/^program\./, '') as 'qudrat' | 'tahsili';
  try {
    await StudentLearningProfile.updateOne(
      { userId: studentId, program },
      {
        $setOnInsert: {
          userId: studentId,
          studentId,
          profileVersion: 'phase-04-v1',
          program,
          status: 'needs_diagnostic',
        },
      },
      { upsert: true },
    );
  } catch (error: any) {
    if (error?.code !== 11000) throw error;
  }
}

export async function recordLearningAttempt(studentId: string, input: LearningAttemptInput) {
  const normalized = normalizeLearningAttemptInput(input);
  if (!normalized.ok) throw new Error(normalized.error);
  await ensureProfile(studentId, normalized.value.programId);

  const sourceIdentity = learningAttemptSourceIdentity(
    normalized.value.sourceType,
    normalized.value.sourceKey,
    normalized.value.questionId,
  );

  if (normalized.value.idempotencyKey) {
    const duplicate = await LearningAttempt.findOne({
      studentId,
      idempotencyKey: normalized.value.idempotencyKey,
    }).lean();
    if (duplicate) {
      if (!isSameIdempotentAttempt(
        duplicate,
        sourceIdentity,
        normalized.value.selectedAnswer,
        normalized.value.sessionId,
      )) {
        throw new LearningAttemptError('idempotencyKey مستخدم لمحاولة مختلفة', 'IDEMPOTENCY_CONFLICT');
      }
      return { attempt: duplicate, duplicate: true };
    }
  }

  if (normalized.value.sessionId) {
    const session = await LearningSession.findOne({
      _id: normalized.value.sessionId,
      studentId,
      status: 'active',
    }).lean();
    if (!session) {
      throw new LearningAttemptError('جلسة التعلم غير موجودة أو غير نشطة', 'INVALID_SESSION');
    }
  }

  const sequence = await LearningAttemptSequence.findOneAndUpdate(
    { studentId, sourceIdentity },
    { $inc: { nextAttemptNumber: 1 } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  const attemptNumber = sequence.nextAttemptNumber;
  let attempt;
  try {
    attempt = await LearningAttempt.create({
      studentId,
      ...normalized.value,
      sourceIdentity,
      attemptNumber,
    });
  } catch (error: any) {
    if (error?.code === 11000 && normalized.value.idempotencyKey) {
      const duplicate = await LearningAttempt.findOne({
        studentId,
        idempotencyKey: normalized.value.idempotencyKey,
      }).lean();
      if (duplicate) return { attempt: duplicate, duplicate: true };
    }
    throw error;
  }

  const now = new Date();
  const programKey = normalized.value.programId.replace(/^program\./, '').replace(/[^a-zA-Z0-9_-]/g, '_');
  const updates: Record<string, unknown> = {
    profileVersion: 'phase-04-v1',
    studentId,
    lastActivityAt: now,
    overall: performanceExpression('overall', normalized.value.isAnswered, normalized.value.isCorrect, normalized.value.responseTime, now),
  };
  updates[`programs.${programKey}`] = performanceExpression(`programs.${programKey}`, normalized.value.isAnswered, normalized.value.isCorrect, normalized.value.responseTime, now);
  if (normalized.value.subjectId) {
    const subjectKey = normalized.value.subjectId
      .replace(/^subject\./, '')
      .replace(/[^a-zA-Z0-9_-]/g, '_');
    updates[`subjects.${subjectKey}`] = performanceExpression(`subjects.${subjectKey}`, normalized.value.isAnswered, normalized.value.isCorrect, normalized.value.responseTime, now);
  }

  const profile = await StudentLearningProfile.findOneAndUpdate(
    { userId: studentId, program: programKey as 'qudrat' | 'tahsili' },
    [
      {
        $set: {
          ...updates,
          dataConfidence: {
            $cond: [
              { $gte: [{ $add: [{ $ifNull: ['$overall.attempts', 0] }, 1] }, 20] },
              'HIGH',
              {
                $cond: [
                  { $gte: [{ $add: [{ $ifNull: ['$overall.attempts', 0] }, 1] }, 5] },
                  'MEDIUM',
                  'LOW',
                ],
              },
            ],
          },
        },
      },
    ],
    { new: true },
  ).lean();

  if (normalized.value.sessionId) {
    await LearningSession.updateOne(
      { _id: normalized.value.sessionId, studentId },
      {
        $inc: {
          questionsAttempted: normalized.value.isAnswered ? 1 : 0,
          questionsCorrect: normalized.value.isCorrect ? 1 : 0,
          questionsWrong: normalized.value.isAnswered && !normalized.value.isCorrect ? 1 : 0,
        },
      },
    );
  }

  if (mongoose.Types.ObjectId.isValid(studentId)) {
    await ActivityLog.create({
      userId: new mongoose.Types.ObjectId(studentId),
      action: !normalized.value.isAnswered
        ? 'learning.question_unanswered'
        : normalized.value.isCorrect
          ? 'learning.question_correct'
          : 'learning.question_wrong',
      details: {
        questionId: normalized.value.questionId,
        programId: normalized.value.programId,
        subjectId: normalized.value.subjectId,
        sessionId: normalized.value.sessionId,
      },
    });
  }

  return { attempt: await LearningAttempt.findById(attempt._id).lean(), profile, duplicate: false };
}

export async function recordVerifiedLearningAttempt(
  studentId: string,
  input: VerifiedLearningAttemptInput,
  serverQuestion?: ServerQuestionAnswerKey,
) {
  const sourceType = input.sourceType ?? 'unknown';
  const questionId = String(input.questionId ?? '').trim();
  const sourceKey = input.sourceKey?.trim() || undefined;
  const selectedAnswer = normalizeSelectedAnswer(input.selectedAnswer);
  if (selectedAnswer === 'invalid') {
    throw new LearningAttemptError('الإجابة المحددة غير صالحة', 'INVALID_ANSWER');
  }

  const question = serverQuestion || await findQuestionForLearningAttempt(questionId, sourceType);
  if (!question) {
    throw new LearningAttemptError('السؤال غير موجود', 'UNKNOWN_QUESTION');
  }

  const optionsCount = serverQuestion
    ? serverQuestion.optionsCount
    : Array.isArray((question as any).options) ? (question as any).options.length : 0;
  const verified = verifyServerAnswer(selectedAnswer, Number(question.correctOptionIndex), optionsCount);
  if (!verified.ok) {
    throw new LearningAttemptError('الإجابة المحددة خارج خيارات السؤال', 'INVALID_ANSWER');
  }

  const { isAnswered, isCorrect } = verified;
  const result = await recordLearningAttempt(studentId, {
    questionId,
    sourceType,
    sourceKey,
    programId: input.programId,
    subjectId: input.subjectId,
    selectedAnswer,
    correctAnswer: Number(question.correctOptionIndex),
    isAnswered,
    isCorrect,
    responseTime: input.responseTime,
    sessionId: input.sessionId,
    idempotencyKey: input.idempotencyKey,
    metadata: input.metadata,
  });

  if (!result.duplicate && result.attempt) {
    const questionMetadata = serverQuestion ? undefined : {
      category: typeof (question as any).category === 'string' ? (question as any).category : undefined,
      subcategory: typeof (question as any).subcategory === 'string' ? (question as any).subcategory : undefined,
      difficulty: typeof (question as any).difficulty === 'string' ? (question as any).difficulty : undefined,
      topic: typeof (question as any).topic === 'string' ? (question as any).topic : undefined,
      hasExplanation: typeof (question as any).explanation === 'string' &&
        (question as any).explanation.trim().length > 0,
    };
    await recordAutomaticLearningErrorEvidence(
      studentId,
      result.attempt as any,
      questionMetadata,
    );
    await recalculateMasteryForAttempt(studentId, String((result.attempt as any)._id));
  }

  return result;
}

export function verifyServerAnswer(
  selectedAnswer: number | null,
  correctOptionIndex: number,
  optionsCount: number,
): { ok: true; isAnswered: boolean; isCorrect: boolean } | { ok: false } {
  if (!Number.isInteger(optionsCount) || optionsCount < 1 ||
      !Number.isInteger(correctOptionIndex) ||
      correctOptionIndex < 0 || correctOptionIndex >= optionsCount) {
    return { ok: false };
  }
  if (selectedAnswer === null) return { ok: true, isAnswered: false, isCorrect: false };
  if (selectedAnswer < 0 || selectedAnswer >= optionsCount) return { ok: false };
  return { ok: true, isAnswered: true, isCorrect: selectedAnswer === correctOptionIndex };
}

export async function createLearningSession(studentId: string, input: { programId: string; subjectId?: string; idempotencyKey?: string }) {
  const normalized = normalizeLearningAttemptInput({
    questionId: 'session-validation',
    programId: input.programId,
    subjectId: input.subjectId,
    isCorrect: false,
  });
  if (!normalized.ok) throw new Error(normalized.error);

  if (input.idempotencyKey) {
    const existing = await LearningSession.findOne({ studentId, idempotencyKey: input.idempotencyKey }).lean();
    if (existing) return { session: existing, duplicate: true };
  }
  const session = await LearningSession.create({
    studentId,
    programId: input.programId,
    subjectId: input.subjectId,
    idempotencyKey: input.idempotencyKey?.trim() || undefined,
  });
  await ensureProfile(studentId, input.programId);
  if (mongoose.Types.ObjectId.isValid(studentId)) {
    await ActivityLog.create({
      userId: new mongoose.Types.ObjectId(studentId),
      action: 'learning.session_started',
      details: { sessionId: session._id, programId: input.programId, subjectId: input.subjectId },
    });
  }
  return { session: session.toObject(), duplicate: false };
}

export async function completeLearningSession(studentId: string, sessionId: string, status: 'completed' | 'abandoned' = 'completed') {
  if (!mongoose.Types.ObjectId.isValid(sessionId)) throw new Error('sessionId غير صالح');
  const session = await LearningSession.findOne({ _id: sessionId, studentId, status: 'active' });
  if (!session) return null;
  const endedAt = new Date();
  session.status = status;
  session.endedAt = endedAt;
  session.duration = Math.max(0, Math.round((endedAt.getTime() - session.startedAt.getTime()) / 1000));
  await session.save();
  if (mongoose.Types.ObjectId.isValid(studentId)) {
    await ActivityLog.create({
      userId: new mongoose.Types.ObjectId(studentId),
      action: status === 'completed' ? 'learning.session_completed' : 'learning.session_abandoned',
      details: { sessionId: session._id, duration: session.duration },
    });
  }
  return session.toObject();
}

export async function findQuestionForLearningAttempt(questionId: string, sourceType: LearningAttemptSourceType) {
  if (sourceType === 'mongo_tahsili_question') {
    const numericId = Number(questionId);
    if (!Number.isInteger(numericId)) return null;
    return TahsiliQuestion.findOne({ questionId: numericId })
      .select('questionId correctOptionIndex subject options')
      .lean();
  }
  if (mongoose.Types.ObjectId.isValid(questionId)) {
    const question = await Question.findById(questionId)
      .select('questionId correctOptionIndex category options')
      .lean();
    if (question) return question;
  }
  const numericId = Number(questionId);
  if (!Number.isInteger(numericId)) return null;
  return Question.findOne({ questionId: numericId })
    .select('questionId correctOptionIndex category options')
    .lean();
}