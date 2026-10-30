export const TAHSILI_PAPER_SUBJECTS = ["رياضيات", "فيزياء", "كيمياء", "أحياء", "علم الأرض"] as const;

export type PaperExamProgram = "qudrat" | "tahsili";
export type PaperExamDistribution = "mixed" | "verbal" | "quantitative" | "custom" | "subject";

export interface PaperExamConfig {
  title: string;
  program: PaperExamProgram;
  subjectId?: string;
  distribution: PaperExamDistribution;
  totalQuestions: number;
  trialQuestions: number;
  timeLimitMinutes: number;
  verbalCount: number;
  quantitativeCount: number;
}

export interface PaperExamQuestionCandidate {
  sourceQuestionId: string;
  sourceQuestionNumber: number;
  category: string;
  text: string;
  options: string[];
  correctOptionIndex: number;
  quality: "approved" | "verified";
  isTrial?: boolean;
  explanation?: string;
  imageUrl?: string;
  imageUrls?: string[];
}

export interface FixedPaperExamModel {
  modelNumber: number;
  title: string;
  timeLimitMinutes: number;
  questions: PaperExamQuestionCandidate[];
}

export interface PaperExamQuestionSnapshot extends PaperExamQuestionCandidate {
  questionNumber: number;
  isTrial: boolean;
}

export interface PaperExamSavedState {
  answers: Record<string, number>;
  reviewQuestionNumbers: number[];
}

export interface PaperExamResult {
  totalQuestions: number;
  scoredQuestions: number;
  totalScore: number;
  totalPercentage: number;
  correctAnswers: number;
  wrongAnswers: number;
  skippedQuestions: number;
  verbalScore?: number;
  verbalTotal?: number;
  verbalPercentage?: number;
  quantitativeScore?: number;
  quantitativeTotal?: number;
  quantitativePercentage?: number;
  timeTaken: number;
  timedOut: boolean;
  questionDetails: Array<{
    questionNumber: number;
    category: string;
    status: "correct" | "wrong" | "skipped" | "trial";
    userAnswer: number | null;
    correctAnswer: number;
    isTrial: boolean;
  }>;
  incorrectQuestions: Array<{
    questionIndex: number;
    userAnswer: number | null;
    correctAnswer: number;
    question: {
      id: number;
      category: string;
      text: string;
      options: string[];
      correctOptionIndex: number;
      explanation?: string;
      imageUrl?: string;
      imageUrls?: string[];
    };
  }>;
}

export interface PaperExamAttemptRecord {
  id: string;
  ownerUserId: string;
  title: string;
  program: PaperExamProgram;
  subjectId?: string;
  distribution: PaperExamDistribution;
  totalQuestions: number;
  trialQuestions: number;
  timeLimitMinutes: number;
  startedAt: Date;
  expiresAt: Date;
  status: "in_progress" | "submitted";
  questions: PaperExamQuestionSnapshot[];
  answers: Record<string, number>;
  reviewQuestionNumbers: number[];
  result?: PaperExamResult;
  submittedAt?: Date;
}

export interface PaperExamAttemptInsert extends Omit<PaperExamAttemptRecord, "id"> {}

export interface PaperExamAttemptRepository {
  create(attempt: PaperExamAttemptInsert): Promise<PaperExamAttemptRecord>;
  findOwned(id: string, ownerUserId: string): Promise<PaperExamAttemptRecord | null>;
  saveAnswers(
    id: string,
    ownerUserId: string,
    saved: PaperExamSavedState,
    now: Date,
  ): Promise<PaperExamAttemptRecord | null>;
  complete(
    id: string,
    ownerUserId: string,
    result: PaperExamResult,
    submittedAt: Date,
  ): Promise<PaperExamAttemptRecord | null>;
}

export class PaperExamServiceError extends Error {
  constructor(
    public readonly code: "INVALID" | "NOT_FOUND" | "FORBIDDEN" | "EXPIRED" | "CLOSED" | "INSUFFICIENT_QUESTIONS",
    message: string,
  ) {
    super(message);
    this.name = "PaperExamServiceError";
  }
}

const MIN_QUESTIONS = 10;
const MAX_QUESTIONS = 200;
const MIN_TIME_MINUTES = 30;
const MAX_TIME_MINUTES = 300;

function integerInRange(value: unknown, min: number, max: number): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= min && value <= max;
}

export function validatePaperExamConfig(input: unknown): PaperExamConfig {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new PaperExamServiceError("INVALID", "إعدادات الاختبار غير صالحة");
  }
  const body = input as Record<string, unknown>;
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const program = body.program;
  const totalQuestions = body.totalQuestions;
  const trialQuestions = body.trialQuestions ?? 0;
  const timeLimitMinutes = body.timeLimitMinutes;

  if (!title || title.length > 120) {
    throw new PaperExamServiceError("INVALID", "عنوان الاختبار مطلوب وبحد أقصى 120 حرفًا");
  }
  if (program !== "qudrat" && program !== "tahsili") {
    throw new PaperExamServiceError("INVALID", "نوع البرنامج غير صالح");
  }
  if (!integerInRange(totalQuestions, MIN_QUESTIONS, MAX_QUESTIONS)) {
    throw new PaperExamServiceError("INVALID", `عدد الأسئلة يجب أن يكون بين ${MIN_QUESTIONS} و${MAX_QUESTIONS}`);
  }
  if (!integerInRange(trialQuestions, 0, Number(totalQuestions))) {
    throw new PaperExamServiceError("INVALID", "عدد الأسئلة التجريبية غير صالح");
  }
  if (!integerInRange(timeLimitMinutes, MIN_TIME_MINUTES, MAX_TIME_MINUTES)) {
    throw new PaperExamServiceError("INVALID", `المدة يجب أن تكون بين ${MIN_TIME_MINUTES} و${MAX_TIME_MINUTES} دقيقة`);
  }

  if (program === "tahsili") {
    const subjectId = typeof body.subjectId === "string" ? body.subjectId.trim() : "";
    if (!(TAHSILI_PAPER_SUBJECTS as readonly string[]).includes(subjectId)) {
      throw new PaperExamServiceError("INVALID", "اختر مادة تحصيلية صالحة");
    }
    return {
      title,
      program,
      subjectId,
      distribution: "subject",
      totalQuestions,
      trialQuestions,
      timeLimitMinutes,
      verbalCount: 0,
      quantitativeCount: 0,
    };
  }

  const rawDistribution = body.distribution;
  if (!["mixed", "verbal", "quantitative", "custom"].includes(String(rawDistribution))) {
    throw new PaperExamServiceError("INVALID", "توزيع أسئلة القدرات غير صالح");
  }
  const distribution = rawDistribution as Exclude<PaperExamDistribution, "subject">;

  let verbalCount = 0;
  let quantitativeCount = 0;
  if (distribution === "mixed") {
    verbalCount = Math.floor(totalQuestions / 2);
    quantitativeCount = totalQuestions - verbalCount;
  } else if (distribution === "verbal") {
    verbalCount = totalQuestions;
  } else if (distribution === "quantitative") {
    quantitativeCount = totalQuestions;
  } else {
    if (
      !integerInRange(body.verbalCount, 0, Number(totalQuestions)) ||
      !integerInRange(body.quantitativeCount, 0, Number(totalQuestions)) ||
      Number(body.verbalCount) + Number(body.quantitativeCount) !== totalQuestions
    ) {
      throw new PaperExamServiceError("INVALID", "يجب أن يساوي مجموع اللفظي والكمي عدد الأسئلة");
    }
    verbalCount = Number(body.verbalCount);
    quantitativeCount = Number(body.quantitativeCount);
  }

  return {
    title,
    program,
    distribution,
    totalQuestions,
    trialQuestions,
    timeLimitMinutes,
    verbalCount,
    quantitativeCount,
  };
}

export interface PaperExamQuestionBucket {
  category: "verbal" | "quantitative" | "subject";
  subjectId?: string;
  count: number;
}

export function paperExamQuestionPlan(config: PaperExamConfig): PaperExamQuestionBucket[] {
  if (config.program === "tahsili") {
    return [{ category: "subject", subjectId: config.subjectId, count: config.totalQuestions }];
  }
  return [
    ...(config.verbalCount ? [{ category: "verbal" as const, count: config.verbalCount }] : []),
    ...(config.quantitativeCount ? [{ category: "quantitative" as const, count: config.quantitativeCount }] : []),
  ];
}

function shuffle<T>(items: T[], random: () => number): T[] {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index--) {
    const target = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[target]] = [shuffled[target], shuffled[index]];
  }
  return shuffled;
}

export function preparePaperExamQuestions(
  config: PaperExamConfig,
  candidatesByBucket: PaperExamQuestionCandidate[][],
  random: () => number = Math.random,
): PaperExamQuestionSnapshot[] {
  const plan = paperExamQuestionPlan(config);
  if (candidatesByBucket.length !== plan.length) {
    throw new PaperExamServiceError("INSUFFICIENT_QUESTIONS", "تعذر تجهيز توزيع الأسئلة المطلوب");
  }

  const selected: PaperExamQuestionCandidate[] = [];
  for (let bucketIndex = 0; bucketIndex < plan.length; bucketIndex++) {
    const bucket = plan[bucketIndex];
    const candidates = candidatesByBucket[bucketIndex];
    if (!Array.isArray(candidates) || candidates.length < bucket.count) {
      throw new PaperExamServiceError("INSUFFICIENT_QUESTIONS", "لا يوجد عدد كافٍ من الأسئلة المعتمدة لهذا التوزيع");
    }

    for (const candidate of candidates) {
      const isTrusted = config.program === "qudrat"
        ? candidate.quality === "approved" && candidate.category === bucket.category
        : candidate.quality === "verified" && candidate.category === bucket.subjectId;
      if (
        !isTrusted ||
        !candidate.sourceQuestionId ||
        !Array.isArray(candidate.options) ||
        candidate.options.length < 2 ||
        !Number.isSafeInteger(candidate.correctOptionIndex) ||
        candidate.correctOptionIndex < 0 ||
        candidate.correctOptionIndex >= candidate.options.length
      ) {
        throw new PaperExamServiceError("INVALID", "تحتوي مجموعة الأسئلة على سؤال غير صالح أو غير موثوق");
      }
    }
    selected.push(...shuffle(candidates, random).slice(0, bucket.count));
  }

  return shuffle(selected, random).map((question, index) => ({
    ...question,
    questionNumber: index + 1,
    isTrial: index >= config.totalQuestions - config.trialQuestions,
  }));
}

export function publicPaperExamQuestions(questions: PaperExamQuestionSnapshot[]) {
  return questions.map((question) => ({
    id: question.questionNumber,
    category: question.category,
    text: question.text,
    options: question.options,
    imageUrl: question.imageUrl,
    imageUrls: question.imageUrls,
    isTrial: question.isTrial,
  }));
}

function normalizeSavedState(
  rawAnswers: unknown,
  rawReviewQuestionNumbers: unknown,
  attempt: PaperExamAttemptRecord,
): PaperExamSavedState {
  if (!rawAnswers || typeof rawAnswers !== "object" || Array.isArray(rawAnswers)) {
    throw new PaperExamServiceError("INVALID", "صيغة الإجابات غير صالحة");
  }
  const answers: Record<string, number> = {};
  for (const [rawQuestionNumber, rawOption] of Object.entries(rawAnswers as Record<string, unknown>)) {
    if (!/^[1-9]\d*$/.test(rawQuestionNumber)) {
      throw new PaperExamServiceError("INVALID", "رقم السؤال غير صالح");
    }
    const questionNumber = Number(rawQuestionNumber);
    const question = attempt.questions[questionNumber - 1];
    if (!question || question.questionNumber !== questionNumber) {
      throw new PaperExamServiceError("INVALID", "الإجابة تشير إلى سؤال غير موجود");
    }
    if (!Number.isSafeInteger(rawOption) || Number(rawOption) < 0 || Number(rawOption) >= question.options.length) {
      throw new PaperExamServiceError("INVALID", "اختيار الإجابة غير صالح");
    }
    answers[rawQuestionNumber] = Number(rawOption);
  }

  if (!Array.isArray(rawReviewQuestionNumbers)) {
    throw new PaperExamServiceError("INVALID", "قائمة المراجعة غير صالحة");
  }
  const reviewQuestionNumbers = [...new Set(rawReviewQuestionNumbers.map((value) => {
    if (!integerInRange(value, 1, attempt.questions.length)) {
      throw new PaperExamServiceError("INVALID", "رقم سؤال المراجعة غير صالح");
    }
    return Number(value);
  }))].sort((a, b) => a - b);

  return { answers, reviewQuestionNumbers };
}

function roundPercentage(score: number, total: number): number {
  return total > 0 ? Math.round((score / total) * 10000) / 100 : 0;
}

export function gradePaperExamAttempt(attempt: PaperExamAttemptRecord, now: Date): PaperExamResult {
  const scoredQuestions = attempt.questions.filter((question) => !question.isTrial);
  const questionDetails: PaperExamResult["questionDetails"] = [];
  const incorrectQuestions: PaperExamResult["incorrectQuestions"] = [];
  let correctAnswers = 0;
  let wrongAnswers = 0;
  let skippedQuestions = 0;
  let verbalScore = 0;
  let verbalTotal = 0;
  let quantitativeScore = 0;
  let quantitativeTotal = 0;

  for (const question of attempt.questions) {
    const answer = attempt.answers[String(question.questionNumber)];
    const userAnswer = Number.isSafeInteger(answer) ? answer : null;
    const status = question.isTrial
      ? "trial"
      : userAnswer === null
        ? "skipped"
        : userAnswer === question.correctOptionIndex
          ? "correct"
          : "wrong";

    if (!question.isTrial) {
      if (status === "correct") correctAnswers++;
      else if (status === "wrong") wrongAnswers++;
      else skippedQuestions++;

      if (question.category === "verbal") {
        verbalTotal++;
        if (status === "correct") verbalScore++;
      } else if (question.category === "quantitative") {
        quantitativeTotal++;
        if (status === "correct") quantitativeScore++;
      }
    }

    questionDetails.push({
      questionNumber: question.questionNumber,
      category: question.category,
      status,
      userAnswer,
      correctAnswer: question.correctOptionIndex,
      isTrial: question.isTrial,
    });

    if (!question.isTrial && status !== "correct") {
      incorrectQuestions.push({
        questionIndex: question.questionNumber - 1,
        userAnswer,
        correctAnswer: question.correctOptionIndex,
        question: {
          id: question.questionNumber,
          category: question.category,
          text: question.text,
          options: question.options,
          correctOptionIndex: question.correctOptionIndex,
          explanation: question.explanation,
          imageUrl: question.imageUrl,
          imageUrls: question.imageUrls,
        },
      });
    }
  }

  const elapsedSeconds = Math.max(0, Math.floor((now.getTime() - attempt.startedAt.getTime()) / 1000));
  const timeTaken = Math.min(attempt.timeLimitMinutes * 60, elapsedSeconds);
  const result: PaperExamResult = {
    totalQuestions: attempt.questions.length,
    scoredQuestions: scoredQuestions.length,
    totalScore: correctAnswers,
    totalPercentage: roundPercentage(correctAnswers, scoredQuestions.length),
    correctAnswers,
    wrongAnswers,
    skippedQuestions,
    timeTaken,
    timedOut: now.getTime() >= attempt.expiresAt.getTime(),
    questionDetails,
    incorrectQuestions,
  };

  if (attempt.program === "qudrat") {
    result.verbalScore = verbalScore;
    result.verbalTotal = verbalTotal;
    result.verbalPercentage = roundPercentage(verbalScore, verbalTotal);
    result.quantitativeScore = quantitativeScore;
    result.quantitativeTotal = quantitativeTotal;
    result.quantitativePercentage = roundPercentage(quantitativeScore, quantitativeTotal);
  }
  return result;
}

export class PaperExamService {
  constructor(private readonly repository: PaperExamAttemptRepository) {}

  async createFixedModel(input: {
    ownerUserId: string;
    model: FixedPaperExamModel;
    now?: Date;
  }) {
    const { model } = input;
    if (
      !Number.isSafeInteger(model.modelNumber) ||
      model.modelNumber < 1 ||
      !model.title.trim() ||
      model.title.length > 120 ||
      !integerInRange(model.timeLimitMinutes, MIN_TIME_MINUTES, MAX_TIME_MINUTES) ||
      !Array.isArray(model.questions) ||
      model.questions.length < 5 ||
      model.questions.length > MAX_QUESTIONS
    ) {
      throw new PaperExamServiceError("INVALID", "النموذج الورقي غير صالح");
    }

    const sourceIds = new Set<string>();
    for (const question of model.questions) {
      if (
        !question.sourceQuestionId ||
        sourceIds.has(question.sourceQuestionId) ||
        !["verbal", "quantitative"].includes(question.category) ||
        question.quality !== "approved" ||
        !Array.isArray(question.options) ||
        question.options.length < 2 ||
        !Number.isSafeInteger(question.correctOptionIndex) ||
        question.correctOptionIndex < 0 ||
        question.correctOptionIndex >= question.options.length
      ) {
        throw new PaperExamServiceError("INVALID", "يحتوي النموذج على سؤال غير صالح أو غير معتمد");
      }
      sourceIds.add(question.sourceQuestionId);
    }

    const now = input.now ?? new Date();
    const questions: PaperExamQuestionSnapshot[] = model.questions.map((question, index) => ({
      ...question,
      questionNumber: index + 1,
      isTrial: question.isTrial === true,
    }));
    const attempt = await this.repository.create({
      ownerUserId: input.ownerUserId,
      title: model.title,
      program: "qudrat",
      distribution: "custom",
      totalQuestions: questions.length,
      trialQuestions: questions.filter(question => question.isTrial).length,
      timeLimitMinutes: model.timeLimitMinutes,
      startedAt: now,
      expiresAt: new Date(now.getTime() + model.timeLimitMinutes * 60_000),
      status: "in_progress",
      questions,
      answers: {},
      reviewQuestionNumbers: [],
    });
    return this.toPublicState(attempt);
  }

  async create(input: {
    ownerUserId: string;
    config: PaperExamConfig;
    candidatesByBucket: PaperExamQuestionCandidate[][];
    now?: Date;
    random?: () => number;
  }) {
    const now = input.now ?? new Date();
    const questions = preparePaperExamQuestions(input.config, input.candidatesByBucket, input.random);
    const attempt = await this.repository.create({
      ownerUserId: input.ownerUserId,
      title: input.config.title,
      program: input.config.program,
      subjectId: input.config.subjectId,
      distribution: input.config.distribution,
      totalQuestions: input.config.totalQuestions,
      trialQuestions: input.config.trialQuestions,
      timeLimitMinutes: input.config.timeLimitMinutes,
      startedAt: now,
      expiresAt: new Date(now.getTime() + input.config.timeLimitMinutes * 60_000),
      status: "in_progress",
      questions,
      answers: {},
      reviewQuestionNumbers: [],
    });
    return this.toPublicState(attempt);
  }

  async get(id: string, ownerUserId: string) {
    const attempt = await this.repository.findOwned(id, ownerUserId);
    if (!attempt) throw new PaperExamServiceError("NOT_FOUND", "المحاولة غير موجودة");
    return this.toPublicState(attempt);
  }

  async saveAnswers(input: {
    id: string;
    ownerUserId: string;
    answers: unknown;
    reviewQuestionNumbers: unknown;
    now?: Date;
  }) {
    const now = input.now ?? new Date();
    const attempt = await this.repository.findOwned(input.id, input.ownerUserId);
    if (!attempt) throw new PaperExamServiceError("NOT_FOUND", "المحاولة غير موجودة");
    if (attempt.status !== "in_progress") throw new PaperExamServiceError("CLOSED", "تم تسليم هذا الاختبار مسبقًا");
    if (now.getTime() >= attempt.expiresAt.getTime()) throw new PaperExamServiceError("EXPIRED", "انتهى وقت الاختبار ولا يمكن تغيير الإجابات");

    const saved = normalizeSavedState(input.answers, input.reviewQuestionNumbers, attempt);
    const updated = await this.repository.saveAnswers(input.id, input.ownerUserId, saved, now);
    if (updated) return this.toPublicState(updated);
    const latest = await this.repository.findOwned(input.id, input.ownerUserId);
    if (!latest) throw new PaperExamServiceError("NOT_FOUND", "المحاولة غير موجودة");
    if (latest.status !== "in_progress") throw new PaperExamServiceError("CLOSED", "تم تسليم هذا الاختبار مسبقًا");
    throw new PaperExamServiceError("EXPIRED", "انتهى وقت الاختبار ولا يمكن تغيير الإجابات");
  }

  async submit(id: string, ownerUserId: string, now = new Date()) {
    const attempt = await this.repository.findOwned(id, ownerUserId);
    if (!attempt) throw new PaperExamServiceError("NOT_FOUND", "المحاولة غير موجودة");
    if (attempt.status === "submitted" && attempt.result) {
      return { result: attempt.result, duplicate: true };
    }

    const result = gradePaperExamAttempt(attempt, now);
    const completed = await this.repository.complete(id, ownerUserId, result, now);
    if (completed?.result) return { result: completed.result, duplicate: false };

    const latest = await this.repository.findOwned(id, ownerUserId);
    if (latest?.status === "submitted" && latest.result) {
      return { result: latest.result, duplicate: true };
    }
    throw new PaperExamServiceError("CLOSED", "تعذر تسليم الاختبار. حدّث الصفحة وحاول مرة أخرى");
  }

  private toPublicState(attempt: PaperExamAttemptRecord) {
    return {
      exam: {
        id: attempt.id,
        title: attempt.title,
        program: attempt.program,
        subjectId: attempt.subjectId,
        distribution: attempt.distribution,
        totalQuestions: attempt.totalQuestions,
        trialQuestions: attempt.trialQuestions,
        timeLimit: attempt.timeLimitMinutes,
        status: attempt.status,
        startedAt: attempt.startedAt,
        expiresAt: attempt.expiresAt,
      },
      questions: publicPaperExamQuestions(attempt.questions),
      answers: attempt.answers,
      reviewQuestionNumbers: attempt.reviewQuestionNumbers,
      result: attempt.status === "submitted" ? attempt.result : undefined,
    };
  }
}
