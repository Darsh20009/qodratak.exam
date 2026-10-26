import assert from "node:assert/strict";
import test from "node:test";
import {
  buildPaperExamHistoryRecord,
  savePaperExamResultToHistory,
  stablePaperExamResultId,
  type PaperExamHistoryInput,
  type PaperExamHistoryRecord,
  type PaperExamHistoryRepository,
} from "../src/services/paperExamResultHistory.ts";
import type { PaperExamResult } from "../src/services/paperExamService.ts";

const result: PaperExamResult = {
  totalQuestions: 12,
  scoredQuestions: 10,
  totalScore: 7,
  totalPercentage: 70,
  correctAnswers: 7,
  wrongAnswers: 2,
  skippedQuestions: 1,
  timeTaken: 900,
  timedOut: false,
  questionDetails: [],
  incorrectQuestions: [],
};

const input: PaperExamHistoryInput = {
  attemptId: "64a100000000000000000001",
  ownerUserId: "64a200000000000000000002",
  title: "محاكاة تحصيلي",
  program: "tahsili",
  subjectId: "فيزياء",
  timeLimitMinutes: 60,
  submittedAt: new Date("2026-10-26T12:00:00.000Z"),
  result,
};

class FakeHistoryRepository implements PaperExamHistoryRepository {
  readonly records = new Map<string, PaperExamHistoryRecord>();
  incrementedUserIds: string[] = [];

  async create(record: PaperExamHistoryRecord) {
    if (this.records.has(record._id)) {
      throw Object.assign(new Error("duplicate key"), { code: 11000 });
    }
    this.records.set(record._id, record);
  }

  async findById(id: string) {
    const record = this.records.get(id);
    return record
      ? { userId: record.userId, testId: record.testId, testType: record.testType }
      : null;
  }

  async incrementUserTestCount(userId: string) {
    this.incrementedUserIds.push(userId);
  }
}

test("paper exam history maps only server result data into the established result fields", () => {
  const record = buildPaperExamHistoryRecord(input);
  assert.equal(record.userId, input.ownerUserId);
  assert.equal(record.program, "tahsili");
  assert.equal(record.subjectId, "فيزياء");
  assert.equal(record.testType, "paper_model");
  assert.equal(record.testName, input.title);
  assert.equal(record.score, 7);
  assert.equal(record.totalQuestions, 10);
  assert.equal(record.percentage, 70);
  assert.equal(record.timeTaken, 900);
  assert.equal(record.timeLimit, 3600);
  assert.equal(record.pointsEarned, 0);
  assert.equal(record.isOfficial, false);
  assert.equal(record.completedAt, input.submittedAt);
  assert.equal(record.testId, `paper-exam:${input.attemptId}`);
});

test("stable result IDs make retry submissions idempotent and increment totals only once", async () => {
  const repository = new FakeHistoryRepository();
  const first = await savePaperExamResultToHistory(input, repository);
  const retry = await savePaperExamResultToHistory(input, repository);

  assert.equal(first.created, true);
  assert.equal(retry.created, false);
  assert.equal(first.resultId, retry.resultId);
  assert.equal(repository.records.size, 1);
  assert.deepEqual(repository.incrementedUserIds, [input.ownerUserId]);
  assert.equal(stablePaperExamResultId(input.attemptId), first.resultId);
  assert.notEqual(stablePaperExamResultId(input.attemptId), stablePaperExamResultId("64a100000000000000000009"));
});

test("history persistence rejects non-Mongo session IDs instead of writing an unreachable history item", async () => {
  const repository = new FakeHistoryRepository();
  await assert.rejects(
    () => savePaperExamResultToHistory({ ...input, ownerUserId: "legacy-user-id" }, repository),
    /لا يمكن ربط نتيجة المحاولة/,
  );
  assert.equal(repository.records.size, 0);
});

test("a duplicate result ID owned by another record is treated as a conflict", async () => {
  const repository = new FakeHistoryRepository();
  const record = buildPaperExamHistoryRecord(input);
  repository.records.set(record._id, { ...record, userId: "64a300000000000000000003" });
  await assert.rejects(
    () => savePaperExamResultToHistory(input, repository),
    /تعارض معرّف نتيجة الاختبار الورقي/,
  );
  assert.deepEqual(repository.incrementedUserIds, []);
});
