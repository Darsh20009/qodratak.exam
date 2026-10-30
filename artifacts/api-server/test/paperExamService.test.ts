import assert from "node:assert/strict";
import test from "node:test";
import { registerPaperExamRoutes } from "../src/routes/paperExamRoutes.ts";
import {
  PaperExamService,
  PaperExamServiceError,
  preparePaperExamQuestions,
  publicPaperExamQuestions,
  validatePaperExamConfig,
  type PaperExamAttemptInsert,
  type PaperExamAttemptRecord,
  type PaperExamAttemptRepository,
  type PaperExamQuestionCandidate,
  type PaperExamResult,
  type PaperExamSavedState,
} from "../src/services/paperExamService.ts";

const baseInput = {
  title: "محاكاة قدرات",
  program: "qudrat",
  distribution: "mixed",
  totalQuestions: 10,
  trialQuestions: 2,
  timeLimitMinutes: 30,
};

const questionCandidate = (
  sourceQuestionId: string,
  category: "verbal" | "quantitative" = "verbal",
  correctOptionIndex = 1,
): PaperExamQuestionCandidate => ({
  sourceQuestionId,
  sourceQuestionNumber: Number(sourceQuestionId.replace(/\D/g, "")) || 1,
  category,
  text: `نص ${sourceQuestionId}`,
  options: ["أ", "ب", "ج", "د"],
  correctOptionIndex,
  quality: "approved",
  explanation: "شرح داخلي",
});

class FakePaperExamRepository implements PaperExamAttemptRepository {
  readonly attempts = new Map<string, PaperExamAttemptRecord>();
  private nextId = 0;

  async create(attempt: PaperExamAttemptInsert) {
    const id = `attempt-${++this.nextId}`;
    const record = { ...attempt, id } as PaperExamAttemptRecord;
    this.attempts.set(id, record);
    return record;
  }

  async findOwned(id: string, ownerUserId: string) {
    const attempt = this.attempts.get(id);
    return attempt?.ownerUserId === ownerUserId ? attempt : null;
  }

  async saveAnswers(id: string, ownerUserId: string, saved: PaperExamSavedState, now: Date) {
    const attempt = await this.findOwned(id, ownerUserId);
    if (!attempt || attempt.status !== "in_progress" || now >= attempt.expiresAt) return null;
    const updated = { ...attempt, ...saved };
    this.attempts.set(id, updated);
    return updated;
  }

  async complete(id: string, ownerUserId: string, result: PaperExamResult, submittedAt: Date) {
    const attempt = await this.findOwned(id, ownerUserId);
    if (!attempt || attempt.status !== "in_progress") return null;
    const updated = { ...attempt, status: "submitted" as const, result, submittedAt };
    this.attempts.set(id, updated);
    return updated;
  }
}

function candidatesForMixedConfig() {
  return [
    Array.from({ length: 5 }, (_, index) => questionCandidate(`v${index + 1}`, "verbal")),
    Array.from({ length: 5 }, (_, index) => questionCandidate(`q${index + 1}`, "quantitative", 2)),
  ];
}

test("config validation derives exact Qudrat distributions and rejects inconsistent custom counts", () => {
  const mixed = validatePaperExamConfig(baseInput);
  assert.equal(mixed.verbalCount, 5);
  assert.equal(mixed.quantitativeCount, 5);
  assert.throws(
    () => validatePaperExamConfig({ ...baseInput, distribution: "custom", verbalCount: 4, quantitativeCount: 4 }),
    (error: unknown) => error instanceof PaperExamServiceError && error.code === "INVALID",
  );
  const custom = validatePaperExamConfig({ ...baseInput, distribution: "custom", verbalCount: 3, quantitativeCount: 7 });
  assert.deepEqual([custom.verbalCount, custom.quantitativeCount], [3, 7]);
});

test("Tahsili selection requires a supported subject and plans every question in that subject", () => {
  const config = validatePaperExamConfig({ ...baseInput, program: "tahsili", subjectId: "فيزياء" });
  assert.equal(config.distribution, "subject");
  assert.deepEqual(preparePaperExamQuestions(
    config,
    [Array.from({ length: 10 }, (_, index) => ({
      ...questionCandidate(`t${index}`, "quantitative"),
      category: "فيزياء",
      quality: "verified" as const,
    }))],
    () => 0,
  ).map((question) => question.category), Array(10).fill("فيزياء"));
  assert.throws(() => validatePaperExamConfig({ ...baseInput, program: "tahsili", subjectId: "غير موجود" }));
});

test("selection rejects insufficient, wrong-category, unapproved and invalid-answer-key question sets", () => {
  const config = validatePaperExamConfig(baseInput);
  assert.throws(() => preparePaperExamQuestions(config, [[questionCandidate("v1")], candidatesForMixedConfig()[1]]));
  const candidates = candidatesForMixedConfig();
  candidates[0][0] = { ...candidates[0][0], quality: "verified" };
  assert.throws(() => preparePaperExamQuestions(config, candidates));
  const malformed = candidatesForMixedConfig();
  malformed[1][0] = { ...malformed[1][0], correctOptionIndex: 5 };
  assert.throws(() => preparePaperExamQuestions(config, malformed));
});

test("public question payload never contains bank IDs, answer keys, explanations or source metadata", () => {
  const config = validatePaperExamConfig(baseInput);
  const questions = preparePaperExamQuestions(config, candidatesForMixedConfig(), () => 0);
  const publicQuestions = publicPaperExamQuestions(questions);
  assert.equal(publicQuestions.length, 10);
  for (const question of publicQuestions) {
    assert.ok(!("correctOptionIndex" in question));
    assert.ok(!("explanation" in question));
    assert.ok(!("sourceQuestionId" in question));
    assert.ok(!("sourceQuestionNumber" in question));
  }
});

test("creation and restore state expose neither trusted answer keys nor hidden explanations", async () => {
  const service = new PaperExamService(new FakePaperExamRepository());
  const state = await service.create({
    ownerUserId: "student-a",
    config: validatePaperExamConfig(baseInput),
    candidatesByBucket: candidatesForMixedConfig(),
    now: new Date("2026-10-26T10:00:00.000Z"),
    random: () => 0,
  });
  const serialized = JSON.stringify(state);
  assert.ok(!serialized.includes("correctOptionIndex"));
  assert.ok(!serialized.includes("answerKey"));
  assert.ok(!serialized.includes("شرح داخلي"));
});

test("fixed paper models preserve question order and reveal their answer key only after submission", async () => {
  const repository = new FakePaperExamRepository();
  const service = new PaperExamService(repository);
  const now = new Date("2026-10-26T10:00:00.000Z");
  const model = {
    modelNumber: 31,
    title: "النموذج الورقي ٣١",
    timeLimitMinutes: 30,
    questions: [
      { ...questionCandidate("fixed-v1", "verbal", 0), text: "الأول" },
      { ...questionCandidate("fixed-q1", "quantitative", 2), text: "الثاني", isTrial: true },
      { ...questionCandidate("fixed-v2", "verbal", 3), text: "الثالث" },
      { ...questionCandidate("fixed-q2", "quantitative", 1), text: "الرابع" },
      { ...questionCandidate("fixed-v3", "verbal", 2), text: "الخامس" },
    ],
  };

  const state = await service.createFixedModel({ ownerUserId: "student-a", model, now });
  assert.deepEqual(state.questions.map((question) => question.text), ["الأول", "الثاني", "الثالث", "الرابع", "الخامس"]);
  assert.equal(state.exam.totalQuestions, 5);
  assert.equal(state.exam.trialQuestions, 1);
  assert.ok(!JSON.stringify(state).includes("correctOptionIndex"));
  assert.ok(!JSON.stringify(state).includes("شرح داخلي"));

  const submitted = await service.submit(state.exam.id, "student-a", new Date(now.getTime() + 60_000));
  assert.equal(submitted.result.questionDetails[0].correctAnswer, 0);
  assert.equal(submitted.result.questionDetails[1].correctAnswer, 2);
  assert.equal(submitted.result.questionDetails[1].status, "trial");
});

test("saved answers and review marks restore; malformed, unknown, and out-of-range answers are rejected", async () => {
  const repository = new FakePaperExamRepository();
  const service = new PaperExamService(repository);
  const now = new Date("2026-10-26T10:00:00.000Z");
  const state = await service.create({
    ownerUserId: "student-a",
    config: validatePaperExamConfig(baseInput),
    candidatesByBucket: candidatesForMixedConfig(),
    now,
    random: () => 0,
  });
  const saved = await service.saveAnswers({
    id: state.exam.id,
    ownerUserId: "student-a",
    answers: { "1": 1, "2": 2 },
    reviewQuestionNumbers: [2, 8],
    now: new Date(now.getTime() + 1000),
  });
  assert.deepEqual(saved.answers, { "1": 1, "2": 2 });
  assert.deepEqual(saved.reviewQuestionNumbers, [2, 8]);
  assert.deepEqual((await service.get(state.exam.id, "student-a")).answers, { "1": 1, "2": 2 });
  for (const answers of [{ "0": 1 }, { "11": 0 }, { "1": 4 }, { "1": "1" }, { "1": 1, "1x": 2 }]) {
    await assert.rejects(() => service.saveAnswers({
      id: state.exam.id,
      ownerUserId: "student-a",
      answers,
      reviewQuestionNumbers: [],
      now: new Date(now.getTime() + 2000),
    }));
  }
});

test("attempt ownership is enforced and answer saves are refused after server expiry", async () => {
  const repository = new FakePaperExamRepository();
  const service = new PaperExamService(repository);
  const now = new Date("2026-10-26T10:00:00.000Z");
  const state = await service.create({
    ownerUserId: "student-a",
    config: validatePaperExamConfig(baseInput),
    candidatesByBucket: candidatesForMixedConfig(),
    now,
    random: () => 0,
  });
  await assert.rejects(() => service.get(state.exam.id, "student-b"), (error: unknown) =>
    error instanceof PaperExamServiceError && error.code === "NOT_FOUND");
  await assert.rejects(() => service.saveAnswers({
    id: state.exam.id,
    ownerUserId: "student-a",
    answers: { "1": 1 },
    reviewQuestionNumbers: [],
    now: new Date(now.getTime() + 31 * 60_000),
  }), (error: unknown) => error instanceof PaperExamServiceError && error.code === "EXPIRED");
});

test("server grading ignores client grade fields, excludes trial items, uses server time and submits once", async () => {
  const repository = new FakePaperExamRepository();
  const service = new PaperExamService(repository);
  const startedAt = new Date("2026-10-26T10:00:00.000Z");
  const state = await service.create({
    ownerUserId: "student-a",
    config: validatePaperExamConfig(baseInput),
    candidatesByBucket: candidatesForMixedConfig(),
    now: startedAt,
    random: () => 0,
  });
  const savedAnswers: Record<string, number> = {};
  const persistedAttempt = repository.attempts.get(state.exam.id)!;
  for (const question of persistedAttempt.questions.filter((item) => !item.isTrial)) {
    savedAnswers[String(question.questionNumber)] = question.correctOptionIndex;
  }
  await service.saveAnswers({
    id: state.exam.id,
    ownerUserId: "student-a",
    answers: savedAnswers,
    reviewQuestionNumbers: [],
    now: new Date(startedAt.getTime() + 60_000),
  });
  const first = await service.submit(state.exam.id, "student-a", new Date(startedAt.getTime() + 90_000));
  assert.equal(first.result.scoredQuestions, 8);
  assert.equal(first.result.correctAnswers, 8);
  assert.equal(first.result.totalPercentage, 100);
  assert.equal(first.result.timeTaken, 90);
  assert.equal(first.result.timedOut, false);
  const duplicate = await service.submit(state.exam.id, "student-a", new Date(startedAt.getTime() + 120_000));
  assert.equal(duplicate.duplicate, true);
  assert.equal(duplicate.result.timeTaken, 90);
  assert.equal(repository.attempts.get(state.exam.id)?.status, "submitted");
});

test("all simulator endpoints register behind both authentication and student-role middleware", async () => {
  const repository = new FakePaperExamRepository();
  const service = new PaperExamService(repository);
  const registrations: Array<{ method: string; path: string; handlers: Function[] }> = [];
  const app = {
    get: (path: string, ...handlers: Function[]) => registrations.push({ method: "GET", path, handlers }),
    post: (path: string, ...handlers: Function[]) => registrations.push({ method: "POST", path, handlers }),
    put: (path: string, ...handlers: Function[]) => registrations.push({ method: "PUT", path, handlers }),
  };
  const auth = () => undefined;
  const studentRole = () => undefined;
  const savedHistoryResults: Array<Record<string, unknown>> = [];
  registerPaperExamRoutes(app as any, {
    requireAuth: auth as any,
    requireStudent: studentRole as any,
    service,
    loadCandidates: async () => candidatesForMixedConfig(),
    loadFixedModel: async (modelNumber) => modelNumber === 31 ? {
      modelNumber: 31,
      title: "النموذج الورقي ٣١",
      timeLimitMinutes: 30,
      questions: Array.from({ length: 5 }, (_, index) => questionCandidate(`fixed-${index + 1}`)),
    } : null,
    saveResultToHistory: async (input) => { savedHistoryResults.push(input as unknown as Record<string, unknown>); },
  });
  assert.equal(registrations.length, 6);
  for (const route of registrations) {
    assert.equal(route.handlers[0], auth);
    assert.equal(route.handlers[1], studentRole);
  }

  const fixedCreate = registrations.find((route) => route.method === "POST" && route.path === "/api/paper-exams/fixed-models/:modelNumber")!;
  const fixedResponse = { statusCode: 200, body: undefined as any, status(code: number) { this.statusCode = code; return this; }, json(body: any) { this.body = body; return this; } };
  await fixedCreate.handlers[2]({ params: { modelNumber: "31" }, body: {}, session: { userId: "student-a" } }, fixedResponse as any);
  assert.equal(fixedResponse.statusCode, 201);
  assert.ok(!JSON.stringify(fixedResponse.body).includes("correctOptionIndex"));
  const fixedBodyRejected = { statusCode: 200, body: undefined as any, status(code: number) { this.statusCode = code; return this; }, json(body: any) { this.body = body; return this; } };
  await fixedCreate.handlers[2]({ params: { modelNumber: "31" }, body: { questions: [] }, session: { userId: "student-a" } }, fixedBodyRejected as any);
  assert.equal(fixedBodyRejected.statusCode, 400);

  const create = registrations.find((route) => route.method === "POST" && route.path === "/api/paper-exams")!;
  const response = { statusCode: 200, body: undefined as any, status(code: number) { this.statusCode = code; return this; }, json(body: any) { this.body = body; return this; } };
  await create.handlers[2]({ body: { ...baseInput, answerKey: [0] }, session: { userId: "student-a" } }, response as any);
  assert.equal(response.statusCode, 400);
  assert.match(response.body.error, /مفتاح الإجابة/);

  const created = { statusCode: 200, body: undefined as any, status(code: number) { this.statusCode = code; return this; }, json(body: any) { this.body = body; return this; } };
  await create.handlers[2]({ body: baseInput, session: { userId: "student-a" } }, created as any);
  assert.equal(created.statusCode, 201);
  assert.ok(!JSON.stringify(created.body).includes("correctOptionIndex"));
  const attemptId = created.body.exam.id;
  const submit = registrations.find((route) => route.method === "POST" && route.path === "/api/paper-exams/:id/submit")!;
  const rejectedScore = { statusCode: 200, body: undefined as any, status(code: number) { this.statusCode = code; return this; }, json(body: any) { this.body = body; return this; } };
  await submit.handlers[2]({
    params: { id: attemptId },
    session: { userId: "student-a" },
    body: { totalScore: 100, totalPercentage: 100, answers: { "1": 1 } },
  }, rejectedScore as any);
  assert.equal(rejectedScore.statusCode, 400);

  const questionsResponse = { statusCode: 200, body: undefined as any, status(code: number) { this.statusCode = code; return this; }, json(body: any) { this.body = body; return this; } };
  const getQuestions = registrations.find((route) => route.method === "GET" && route.path === "/api/paper-exams/:id/questions")!;
  await getQuestions.handlers[2]({ params: { id: attemptId }, session: { userId: "student-a" } }, questionsResponse as any);
  assert.equal(questionsResponse.statusCode, 200);
  assert.ok(!JSON.stringify(questionsResponse.body).includes("correctOptionIndex"));

  const unauthorized = { statusCode: 200, body: undefined as any, status(code: number) { this.statusCode = code; return this; }, json(body: any) { this.body = body; return this; } };
  const getAttempt = registrations.find((route) => route.method === "GET" && route.path === "/api/paper-exams/:id")!;
  await getAttempt.handlers[2]({ params: { id: "missing" }, session: {} }, unauthorized as any);
  assert.equal(unauthorized.statusCode, 401);

  const secondCreated = { statusCode: 200, body: undefined as any, status(code: number) { this.statusCode = code; return this; }, json(body: any) { this.body = body; return this; } };
  await create.handlers[2]({ body: baseInput, session: { userId: "student-a" } }, secondCreated as any);
  const secondId = secondCreated.body.exam.id;
  const secondAttempt = repository.attempts.get(secondId)!;
  const answerHandler = registrations.find((route) => route.method === "PUT" && route.path === "/api/paper-exams/:id/answers")!;
  const answers = Object.fromEntries(secondAttempt.questions.filter((question) => !question.isTrial)
    .map((question) => [String(question.questionNumber), question.correctOptionIndex]));
  const saveResponse = { statusCode: 200, body: undefined as any, status(code: number) { this.statusCode = code; return this; }, json(body: any) { this.body = body; return this; } };
  await answerHandler.handlers[2]({ params: { id: secondId }, session: { userId: "student-a" }, body: { answers, reviewQuestionNumbers: [] } }, saveResponse as any);
  const submitResponse = { statusCode: 200, body: undefined as any, status(code: number) { this.statusCode = code; return this; }, json(body: any) { this.body = body; return this; } };
  await submit.handlers[2]({ params: { id: secondId }, session: { userId: "student-a" }, body: {} }, submitResponse as any);
  assert.equal(submitResponse.statusCode, 200);
  assert.equal(savedHistoryResults.length, 1);
  assert.equal(savedHistoryResults[0].ownerUserId, "student-a");
  assert.equal((savedHistoryResults[0].result as PaperExamResult).correctAnswers, 8);
  assert.equal((submitResponse.body as any).duplicate, false);
  const repeatedSubmitResponse = { statusCode: 200, body: undefined as any, status(code: number) { this.statusCode = code; return this; }, json(body: any) { this.body = body; return this; } };
  await submit.handlers[2]({ params: { id: secondId }, session: { userId: "student-a" }, body: {} }, repeatedSubmitResponse as any);
  assert.equal(repeatedSubmitResponse.statusCode, 200);
  assert.equal(savedHistoryResults.length, 2);
  assert.equal(savedHistoryResults[1].ownerUserId, "student-a");
  assert.equal((repeatedSubmitResponse.body as any).duplicate, true);
});
