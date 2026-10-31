import { createHash } from "node:crypto";
import mongoose from "mongoose";
import { TestResult, User } from "../mongodb/models";
import type {
  PaperExamProgram,
  PaperExamResult,
} from "./paperExamService";

export interface PaperExamHistoryInput {
  attemptId: string;
  ownerUserId: string;
  title: string;
  program: PaperExamProgram;
  subjectId?: string;
  timeLimitMinutes: number;
  submittedAt: Date;
  result: PaperExamResult;
}

export interface PaperExamHistoryRecord {
  _id: string;
  userId: string;
  program: PaperExamProgram;
  subjectId?: string;
  testType: "paper_model";
  testId: string;
  resultNotificationKey: string;
  testName: string;
  difficulty: "mixed";
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  skippedQuestions: number;
  percentage: number;
  timeTaken: number;
  timeLimit: number;
  pointsEarned: number;
  isOfficial: false;
  questionDetails: PaperExamResult["questionDetails"];
  completedAt: Date;
}

export interface PaperExamHistoryRepository {
  create(record: PaperExamHistoryRecord): Promise<void>;
  findById(id: string): Promise<Pick<PaperExamHistoryRecord, "userId" | "testId" | "testType"> | null>;
  incrementUserTestCount(userId: string): Promise<void>;
}

export function stablePaperExamResultId(attemptId: string): string {
  return createHash("sha256")
    .update(`qodratak-paper-exam-result:${attemptId}`)
    .digest("hex")
    .slice(0, 24);
}

export function buildPaperExamHistoryRecord(input: PaperExamHistoryInput): PaperExamHistoryRecord {
  const testId = `paper-exam:${input.attemptId}`;
  return {
    _id: stablePaperExamResultId(input.attemptId),
    userId: input.ownerUserId,
    program: input.program,
    subjectId: input.subjectId,
    testType: "paper_model",
    testId,
    resultNotificationKey: `paper-exam:${input.attemptId}`,
    testName: input.title,
    difficulty: "mixed",
    score: input.result.correctAnswers,
    totalQuestions: input.result.scoredQuestions,
    correctAnswers: input.result.correctAnswers,
    wrongAnswers: input.result.wrongAnswers,
    skippedQuestions: input.result.skippedQuestions,
    percentage: input.result.totalPercentage,
    timeTaken: input.result.timeTaken,
    timeLimit: input.timeLimitMinutes * 60,
    pointsEarned: 0,
    isOfficial: false,
    questionDetails: input.result.questionDetails,
    completedAt: input.submittedAt,
  };
}

const mongoPaperExamHistoryRepository: PaperExamHistoryRepository = {
  async create(record) {
    await TestResult.create(record as any);
  },

  async findById(id) {
    return await TestResult.findById(id)
      .select("userId testId testType")
      .lean()
      .exec() as Pick<PaperExamHistoryRecord, "userId" | "testId" | "testType"> | null;
  },

  async incrementUserTestCount(userId) {
    await User.findByIdAndUpdate(userId, { $inc: { totalTestsTaken: 1 } }).exec();
  },
};

function isDuplicateKeyError(error: unknown): boolean {
  return Boolean(
    error &&
    typeof error === "object" &&
    "code" in error &&
    (error as { code?: unknown }).code === 11000,
  );
}

export async function savePaperExamResultToHistory(
  input: PaperExamHistoryInput,
  repository: PaperExamHistoryRepository = mongoPaperExamHistoryRepository,
): Promise<{ resultId: string; created: boolean }> {
  if (!mongoose.Types.ObjectId.isValid(input.ownerUserId)) {
    throw new Error("لا يمكن ربط نتيجة المحاولة بسجل النتائج لهذا الحساب");
  }

  const record = buildPaperExamHistoryRecord(input);
  try {
    await repository.create(record);
  } catch (error) {
    if (!isDuplicateKeyError(error)) throw error;
    const existing = await repository.findById(record._id);
    if (
      existing?.userId === record.userId &&
      existing.testId === record.testId &&
      existing.testType === record.testType
    ) {
      return { resultId: record._id, created: false };
    }
    throw new Error("تعارض معرّف نتيجة الاختبار الورقي مع سجل آخر");
  }

  await repository.incrementUserTestCount(input.ownerUserId);
  return { resultId: record._id, created: true };
}
