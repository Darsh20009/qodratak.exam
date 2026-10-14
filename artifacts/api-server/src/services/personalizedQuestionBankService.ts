import { Question, QuestionHistory } from "../mongodb/models";
import { LearningAttempt } from "../mongodb/learningProfileModels";

const QUESTION_BANK_CACHE_TTL_MS = 60_000;
const HISTORY_VERSION = 1;
const DIFFICULTIES = ["beginner", "intermediate", "advanced"] as const;

export type BankQuestion = {
  _id: unknown;
  questionId: number;
  category: "verbal" | "quantitative";
  subcategory?: string;
  text: string;
  options: string[];
  correctOptionIndex: number;
  difficulty: "beginner" | "intermediate" | "advanced";
  explanation?: string;
  studentTip?: string;
  answerStatus: string;
  source?: unknown;
  imageUrl?: string;
  imageUrls?: string[];
};

export type QuestionHistorySnapshot = {
  seenQuestionIds?: string[];
  correctQuestionIds?: string[];
  incorrectQuestionIds?: string[];
  progressVersion?: number;
};

export type PersonalizedSectionRequest = {
  name?: string;
  sectionNumber?: number;
  category: "verbal" | "quantitative" | "mixed";
  questionCount: number;
  verbalCount?: number;
  quantitativeCount?: number;
  timeLimit?: number;
};

export class PersonalizedQuestionPoolError extends Error {
  status = 409;
  constructor(message: string) {
    super(message);
    this.name = "PersonalizedQuestionPoolError";
  }
}

let bankCache: { expiresAt: number; questions: BankQuestion[] } | null = null;
const historyInitializations = new Map<string, Promise<void>>();

async function getApprovedQuestionBank(): Promise<BankQuestion[]> {
  if (bankCache && bankCache.expiresAt > Date.now()) return bankCache.questions;
  const rows = await Question.find({
    category: { $in: ["verbal", "quantitative"] },
    answerStatus: "approved",
  })
    .select("_id questionId category subcategory text options correctOptionIndex difficulty explanation studentTip answerStatus source imageUrl imageUrls")
    .sort({ category: 1, questionId: 1 })
    .lean() as unknown as BankQuestion[];
  const validQuestions: BankQuestion[] = [];
  for (const question of rows) {
    if (!Number.isSafeInteger(question.questionId) || question.questionId < 0 ||
        !Array.isArray(question.options) || question.options.length < 2 ||
        !Number.isInteger(question.correctOptionIndex) ||
        question.correctOptionIndex < 0 || question.correctOptionIndex >= question.options.length ||
        !DIFFICULTIES.includes(question.difficulty) ||
        (question.category !== "verbal" && question.category !== "quantitative")) continue;
    validQuestions.push(question);
  }
  bankCache = { questions: validQuestions, expiresAt: Date.now() + QUESTION_BANK_CACHE_TTL_MS };
  return bankCache.questions;
}

function historyUpdatePipeline(userId: string, seenIds: string[], correctIds: string[], incorrectIds: string[]) {
  const now = new Date();
  return [
    { $set: {
      userId: { $literal: userId },
      seenQuestionIds: { $setUnion: [{ $ifNull: ["$seenQuestionIds", []] }, { $literal: seenIds }] },
      correctQuestionIds: { $setUnion: [{ $ifNull: ["$correctQuestionIds", []] }, { $literal: correctIds }] },
      incorrectQuestionIds: { $setUnion: [{ $ifNull: ["$incorrectQuestionIds", []] }, { $literal: incorrectIds }] },
      progressVersion: { $literal: HISTORY_VERSION },
      updatedAt: { $literal: now },
    } },
    { $set: {
      seenQuestionIds: { $setDifference: ["$seenQuestionIds", "$correctQuestionIds"] },
      incorrectQuestionIds: { $setDifference: ["$incorrectQuestionIds", "$correctQuestionIds"] },
    } },
  ];
}

async function backfillQuestionHistory(userId: string): Promise<void> {
  const history = await QuestionHistory.findOne({ userId })
    .select("progressVersion seenQuestionIds")
    .lean() as QuestionHistorySnapshot | null;
  if (history?.progressVersion === HISTORY_VERSION) return;

  const outcomes = await LearningAttempt.aggregate([
    { $match: {
      studentId: userId,
      sourceType: "mongo_question",
      programId: "program.qudrat",
      isAnswered: true,
    } },
    { $group: {
      _id: "$questionId",
      isCorrect: { $max: { $cond: ["$isCorrect", 1, 0] } },
    } },
    { $project: {
      questionObjectId: { $convert: { input: "$_id", to: "objectId", onError: null, onNull: null } },
      isCorrect: 1,
    } },
    { $match: { questionObjectId: { $ne: null } } },
    { $lookup: {
      from: Question.collection.name,
      localField: "questionObjectId",
      foreignField: "_id",
      as: "question",
    } },
    { $unwind: "$question" },
    { $group: {
      _id: null,
      correctIds: { $addToSet: { $cond: [
        { $eq: ["$isCorrect", 1] }, { $toString: "$questionObjectId" }, null,
      ] } },
      incorrectIds: { $addToSet: { $cond: [
        { $eq: ["$isCorrect", 0] }, { $toString: "$questionObjectId" }, null,
      ] } },
    } },
    { $project: {
      correctIds: { $filter: { input: "$correctIds", as: "id", cond: { $ne: ["$$id", null] } } },
      incorrectIds: { $filter: { input: "$incorrectIds", as: "id", cond: { $ne: ["$$id", null] } } },
    } },
  ]);
  const correctIds = (outcomes[0]?.correctIds || []).map(String);
  const incorrectIds = (outcomes[0]?.incorrectIds || []).map(String);
  const legacyNumericIds = (history?.seenQuestionIds || [])
    .map(String).filter((id) => /^\d+$/.test(id)).map(Number);
  const legacySeen = legacyNumericIds.length
    ? await Question.find({ questionId: { $in: legacyNumericIds } }).select("_id").lean()
    : [];
  const seenIds = [...new Set([
    ...(history?.seenQuestionIds || []).map(String).filter((id) => /^[a-f0-9]{24}$/i.test(id)),
    ...legacySeen.map((row: any) => String(row._id)),
    ...incorrectIds,
  ])];
  await QuestionHistory.collection.updateOne(
    { userId },
    historyUpdatePipeline(userId, seenIds, correctIds, incorrectIds) as any,
    { upsert: true },
  );
}

async function getQuestionHistory(userId: string): Promise<QuestionHistorySnapshot> {
  if (!userId) throw new Error("معرّف الطالب غير صالح.");
  const current = await QuestionHistory.findOne({ userId })
    .select("seenQuestionIds correctQuestionIds incorrectQuestionIds progressVersion")
    .lean() as QuestionHistorySnapshot | null;
  if (current?.progressVersion === HISTORY_VERSION) return current;

  let pending = historyInitializations.get(userId);
  if (!pending) {
    pending = backfillQuestionHistory(userId).finally(() => historyInitializations.delete(userId));
    historyInitializations.set(userId, pending);
  }
  await pending;
  return await QuestionHistory.findOne({ userId })
    .select("seenQuestionIds correctQuestionIds incorrectQuestionIds progressVersion")
    .lean() as QuestionHistorySnapshot || {};
}

export async function recordQuestionPracticeOutcomes(
  userId: string,
  outcomes: Array<{ questionId: string; isCorrect: boolean }>,
): Promise<void> {
  const validOutcomes = outcomes.flatMap((outcome) => {
    const questionId = String(outcome.questionId);
    return /^[a-f0-9]{24}$/i.test(questionId)
      ? [{ questionId, isCorrect: Boolean(outcome.isCorrect) }]
      : [];
  });
  if (!userId || !validOutcomes.length) return;
  await getQuestionHistory(userId);
  const correctIds = [...new Set(validOutcomes.filter((outcome) => outcome.isCorrect).map((outcome) => outcome.questionId))];
  const incorrectIds = [...new Set(validOutcomes.filter((outcome) => !outcome.isCorrect).map((outcome) => outcome.questionId))];
  await QuestionHistory.collection.updateOne(
    { userId },
    historyUpdatePipeline(userId, incorrectIds, correctIds, incorrectIds) as any,
    { upsert: true },
  );
}

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [result[index], result[swap]] = [result[swap], result[index]];
  }
  return result;
}

function questionDifficultyOrder(
  bank: BankQuestion[],
  history: QuestionHistorySnapshot,
  category: "verbal" | "quantitative",
): typeof DIFFICULTIES[number][] {
  const correct = new Set((history.correctQuestionIds || []).map(String));
  const incorrect = new Set((history.incorrectQuestionIds || []).map(String));
  const rates = new Map<typeof DIFFICULTIES[number], { right: number; wrong: number }>(
    DIFFICULTIES.map((difficulty) => [difficulty, { right: 0, wrong: 0 }]),
  );
  for (const question of bank) {
    if (question.category !== category) continue;
    const row = rates.get(question.difficulty) || rates.get("beginner")!;
    const id = String(question._id);
    if (correct.has(id)) row.right += 1;
    else if (incorrect.has(id)) row.wrong += 1;
  }
  return [...DIFFICULTIES].sort((left, right) => {
    const a = rates.get(left)!;
    const b = rates.get(right)!;
    const aTotal = a.right + a.wrong;
    const bTotal = b.right + b.wrong;
    const aErrorRate = aTotal ? a.wrong / aTotal : -1;
    const bErrorRate = bTotal ? b.wrong / bTotal : -1;
    if (aErrorRate !== bErrorRate) return bErrorRate - aErrorRate;
    return DIFFICULTIES.indexOf(left) - DIFFICULTIES.indexOf(right);
  });
}

export function pickQuestionBatch(
  bank: BankQuestion[],
  history: QuestionHistorySnapshot,
  category: "verbal" | "quantitative",
  count: number,
  usedIds: Set<string>,
): BankQuestion[] {
  if (count <= 0) return [];
  const seen = new Set((history.seenQuestionIds || []).map(String));
  const correct = new Set((history.correctQuestionIds || []).map(String));
  const incorrect = new Set((history.incorrectQuestionIds || []).map(String));
  const candidates = bank.filter((question) =>
    question.category === category && !usedIds.has(String(question._id)) && !correct.has(String(question._id)),
  );
  const orderByWeakness = (items: BankQuestion[]) => {
    const byDifficulty = questionDifficultyOrder(bank, history, category);
    return byDifficulty.flatMap((difficulty) =>
      shuffle(items.filter((question) => question.difficulty === difficulty)),
    );
  };
  const newQuestions = orderByWeakness(candidates.filter((question) => !seen.has(String(question._id))));
  const reviewQuestions = orderByWeakness(candidates.filter((question) =>
    incorrect.has(String(question._id)) && seen.has(String(question._id)),
  ));
  const selected = [...newQuestions.slice(0, count)];
  if (selected.length < count) {
    const selectedIds = new Set(selected.map((question) => String(question._id)));
    selected.push(...reviewQuestions.filter((question) => !selectedIds.has(String(question._id))).slice(0, count - selected.length));
  }
  selected.forEach((question) => usedIds.add(String(question._id)));
  return selected;
}

export async function selectPersonalizedQuestions(
  userId: string,
  count: number,
  filters: { category?: string; subcategory?: string; excludeQuestionIds?: string[] } = {},
): Promise<BankQuestion[]> {
  if (!Number.isSafeInteger(count) || count < 1 || count > 2_000) return [];
  const [bank, history] = await Promise.all([getApprovedQuestionBank(), getQuestionHistory(userId)]);
  const excluded = new Set((filters.excludeQuestionIds || []).map(String));
  const filtered = filters.category
    ? bank.filter((question) => question.category === filters.category)
    : bank;
  const scoped = filters.subcategory
    ? filtered.filter((question) => question.subcategory === filters.subcategory && !excluded.has(String(question._id)))
    : filtered.filter((question) => !excluded.has(String(question._id)));
  const usedIds = new Set<string>();
  if (filters.category === "verbal" || filters.category === "quantitative") {
    return pickQuestionBatch(scoped, history, filters.category, count, usedIds);
  }
  const verbalCount = Math.ceil(count / 2);
  const quantitativeCount = count - verbalCount;
  const selected = [
    ...pickQuestionBatch(scoped, history, "verbal", verbalCount, usedIds),
    ...pickQuestionBatch(scoped, history, "quantitative", quantitativeCount, usedIds),
  ];
  if (selected.length < count) {
    for (const category of ["verbal", "quantitative"] as const) {
      if (selected.length >= count) break;
      selected.push(...pickQuestionBatch(scoped, history, category, count - selected.length, usedIds));
    }
  }
  return selected;
}

export async function selectPersonalizedExamSections(
  userId: string,
  sections: PersonalizedSectionRequest[],
): Promise<Array<{ sectionNumber: number; questions: BankQuestion[] }>> {
  if (!Array.isArray(sections) || sections.length < 1 || sections.length > 12) {
    throw new PersonalizedQuestionPoolError("تعذر تحديد أقسام الاختبار.");
  }
  const bank = await getApprovedQuestionBank();
  const history = await getQuestionHistory(userId);
  const usedIds = new Set<string>();
  const selectedSections: Array<{ sectionNumber: number; questions: BankQuestion[] }> = [];
  let total = 0;

  for (const [index, section] of sections.entries()) {
    const count = Number(section.questionCount);
    if (!Number.isSafeInteger(count) || count < 1 || count > 200 ||
        !["verbal", "quantitative", "mixed"].includes(section.category)) {
      throw new PersonalizedQuestionPoolError("عدد الأسئلة أو نوع القسم غير صالح.");
    }
    total += count;
    if (total > 200) throw new PersonalizedQuestionPoolError("الاختبار يتجاوز الحد المسموح وهو ٢٠٠ سؤال.");

    let verbalCount = section.category === "verbal" ? count : 0;
    let quantitativeCount = section.category === "quantitative" ? count : 0;
    if (section.category === "mixed") {
      verbalCount = section.verbalCount === undefined ? Math.ceil(count / 2) : Number(section.verbalCount);
      quantitativeCount = section.quantitativeCount === undefined ? count - verbalCount : Number(section.quantitativeCount);
      if (!Number.isSafeInteger(verbalCount) || !Number.isSafeInteger(quantitativeCount) ||
          verbalCount < 0 || quantitativeCount < 0 || verbalCount + quantitativeCount !== count) {
        throw new PersonalizedQuestionPoolError("توزيع أسئلة اللفظي والكمي غير صالح.");
      }
    }

    const verbal = pickQuestionBatch(bank, history, "verbal", verbalCount, usedIds);
    const quantitative = pickQuestionBatch(bank, history, "quantitative", quantitativeCount, usedIds);
    if (verbal.length !== verbalCount || quantitative.length !== quantitativeCount) {
      throw new PersonalizedQuestionPoolError(
        "لا توجد أسئلة جديدة أو أخطاء سابقة كافية لهذا الاختبار. أكمل المتاح أو اختر اختبارًا أقصر.",
      );
    }
    const questions = section.category === "mixed"
      ? [...quantitative, ...verbal]
      : section.category === "verbal" ? verbal : quantitative;
    selectedSections.push({
      sectionNumber: Number(section.sectionNumber) || index + 1,
      questions,
    });
  }
  return selectedSections;
}

export async function getStudentQuestionProgress(userId: string) {
  const [bank, history] = await Promise.all([getApprovedQuestionBank(), getQuestionHistory(userId)]);
  const seen = new Set((history.seenQuestionIds || []).map(String));
  const correct = new Set((history.correctQuestionIds || []).map(String));
  const incorrect = new Set((history.incorrectQuestionIds || []).map(String));
  const categories = ["verbal", "quantitative"] as const;
  const summary = categories.map((category) => {
    const questions = bank.filter((question) => question.category === category);
    const mastered = questions.filter((question) => correct.has(String(question._id))).length;
    const review = questions.filter((question) =>
      incorrect.has(String(question._id)) && !correct.has(String(question._id)),
    ).length;
    const unseen = questions.filter((question) =>
      !seen.has(String(question._id)) && !correct.has(String(question._id)),
    ).length;
    return { category, total: questions.length, mastered, review, unseen };
  });
  return {
    total: summary.reduce((total, row) => total + row.total, 0),
    mastered: summary.reduce((total, row) => total + row.mastered, 0),
    review: summary.reduce((total, row) => total + row.review, 0),
    unseen: summary.reduce((total, row) => total + row.unseen, 0),
    categories: summary,
  };
}
