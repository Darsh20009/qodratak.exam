import mongoose from "mongoose";
import { PaperExamAttempt } from "../mongodb/models";
import type {
  PaperExamAttemptInsert,
  PaperExamAttemptRecord,
  PaperExamAttemptRepository,
  PaperExamResult,
  PaperExamSavedState,
} from "./paperExamService";

function toRecord(value: any): PaperExamAttemptRecord | null {
  if (!value) return null;
  const row = typeof value.toObject === "function" ? value.toObject() : value;
  return {
    ...row,
    id: String(row._id ?? row.id),
    startedAt: new Date(row.startedAt),
    expiresAt: new Date(row.expiresAt),
    submittedAt: row.submittedAt ? new Date(row.submittedAt) : undefined,
    answers: row.answers && typeof row.answers === "object" ? row.answers : {},
    reviewQuestionNumbers: Array.isArray(row.reviewQuestionNumbers) ? row.reviewQuestionNumbers : [],
  } as PaperExamAttemptRecord;
}

function validId(id: string): boolean {
  return mongoose.Types.ObjectId.isValid(id);
}

export const paperExamMongoRepository: PaperExamAttemptRepository = {
  async create(attempt: PaperExamAttemptInsert) {
    const created = await PaperExamAttempt.create(attempt as any);
    return toRecord(created)!;
  },

  async findOwned(id, ownerUserId) {
    if (!validId(id)) return null;
    return toRecord(await PaperExamAttempt.findOne({ _id: id, ownerUserId }).lean().exec());
  },

  async saveAnswers(id, ownerUserId, saved: PaperExamSavedState, now) {
    if (!validId(id)) return null;
    const updated = await PaperExamAttempt.findOneAndUpdate(
      { _id: id, ownerUserId, status: "in_progress", expiresAt: { $gt: now } },
      {
        $set: {
          answers: saved.answers,
          reviewQuestionNumbers: saved.reviewQuestionNumbers,
          updatedAt: now,
        },
      },
      { returnDocument: "after", runValidators: true },
    ).lean().exec();
    return toRecord(updated);
  },

  async complete(id, ownerUserId, result: PaperExamResult, submittedAt) {
    if (!validId(id)) return null;
    const updated = await PaperExamAttempt.findOneAndUpdate(
      { _id: id, ownerUserId, status: "in_progress" },
      { $set: { status: "submitted", result, submittedAt, updatedAt: submittedAt } },
      { returnDocument: "after", runValidators: true },
    ).lean().exec();
    return toRecord(updated);
  },
};
