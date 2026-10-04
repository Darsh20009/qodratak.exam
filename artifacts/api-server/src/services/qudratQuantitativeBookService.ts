import crypto from "crypto";
import {
  GetQudratQuantitativeBookLessonResponse,
  GetQudratQuantitativeBookResponse,
  SubmitQudratQuantitativeBookLessonResponse,
} from "@workspace/api-zod";
import { TestResult } from "../mongodb/models";
import { recordVerifiedLearningAttempt } from "./learningProfileService";
import {
  QUANTITATIVE_BOOK_ID,
  QUANTITATIVE_BOOK_PASSING_SCORE,
  QUANTITATIVE_BOOK_SOURCE_KEY,
  QUANTITATIVE_BOOK_SOURCES,
  QUANTITATIVE_CHAPTERS,
  QUANTITATIVE_LESSONS,
  QUANTITATIVE_LESSON_BY_ID,
  QUANTITATIVE_TOPICS,
  getQuestionSet,
  gradeQuantitativeQuiz,
  publicQuestion,
} from "../learning/qudratQuantitativeBook";
import type { QuantitativeLesson, QuantitativeQuestion } from "../learning/qudratQuantitativeBook";

const testIdPrefix = `${QUANTITATIVE_BOOK_ID}:`;
const skillTitles: Record<string, string> = {
  "multiple-vs-factor": "التمييز بين المضاعف والعامل",
  "identify-factor": "التحقق من العامل بالقسمة",
  "divisibility-by-three": "قاعدة القسمة على 3",
  "divisibility-by-five": "قاعدة القسمة على 5",
  "factor-pairs": "استخدام أزواج العوامل",
  "prime-factorization": "التحليل إلى عوامل أولية",
  "prime-definition": "تمييز العدد الأولي",
  "exponent-as-repeated-factor": "فهم الأس بوصفه تكرارًا",
  "verify-factorization": "التحقق من التحليل الأولي",
  "greatest-common-factor": "القاسم المشترك الأكبر",
  "least-common-multiple": "المضاعف المشترك الأصغر",
  "select-gcd-or-lcm": "اختيار القاسم أو المضاعف من السياق",
  "prime-power-exponents": "اختيار أسس العوامل الأولية",
  "add-opposite-signs": "جمع الأعداد مختلفة الإشارة",
  "subtract-negative": "طرح عدد سالب",
  "multiply-signs": "إشارات الضرب",
  "divide-signs": "إشارات القسمة",
  "multiplication-before-addition": "أولوية الضرب على الجمع",
  "parentheses-first": "البدء بما داخل الأقواس",
  "exponents-before-multiplication": "أولوية الأسس",
  "left-to-right": "تنفيذ العمليات المتساوية الأولوية من اليسار",
  "add-fractions-unlike-denominators": "جمع الكسور مختلفة المقامات",
  "multiply-fractions": "ضرب الكسور واختصار الناتج",
  "compare-fractions": "مقارنة الكسور",
  "divide-fractions": "قسمة الكسور",
};

export class QuantitativeBookServiceError extends Error {
  constructor(
    message: string,
    public readonly statusCode: 400 | 403 | 404 | 409 | 503,
  ) {
    super(message);
    this.name = "QuantitativeBookServiceError";
  }
}

type BookQuizInput = {
  answers: Array<{ questionId: string; selectedOptionIndex: number }>;
  timeTakenSeconds: number;
  idempotencyKey: string;
};

type StoredAttempt = {
  testId?: string;
  percentage: number;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  questionDetails?: Array<Record<string, unknown>>;
  completedAt: Date;
};

type StudentProgress = {
  attempts: StoredAttempt[];
  attemptsByLesson: Map<string, StoredAttempt[]>;
  passedLessonIds: Set<string>;
  latestAttemptByLesson: Map<string, StoredAttempt>;
  publishedLessons: QuantitativeLesson[];
};

function topicOrderById() {
  return new Map<string, number>(
    QUANTITATIVE_TOPICS.map((topic, index): [string, number] => [topic.id, index]),
  );
}

function publishedLessonsInOrder() {
  const order = topicOrderById();
  return [...QUANTITATIVE_LESSONS].sort(
    (a, b) => (order.get(a.id) ?? Number.MAX_SAFE_INTEGER) - (order.get(b.id) ?? Number.MAX_SAFE_INTEGER),
  );
}

function lessonIdFromTestId(testId: unknown): string | null {
  if (typeof testId !== "string" || !testId.startsWith(testIdPrefix)) return null;
  const lessonId = testId.slice(testIdPrefix.length).split(":")[0];
  return lessonId || null;
}

async function loadStudentProgress(userId: string): Promise<StudentProgress> {
  const rawAttempts = await TestResult.find({
    userId,
    program: "qudrat",
    testId: { $regex: `^${testIdPrefix}` },
  })
    .select("testId percentage score correctAnswers totalQuestions questionDetails completedAt")
    .sort({ completedAt: 1, _id: 1 })
    .lean();

  const attempts = rawAttempts as unknown as StoredAttempt[];
  const attemptsByLesson = new Map<string, StoredAttempt[]>();
  for (const attempt of attempts) {
    const lessonId = lessonIdFromTestId(attempt.testId);
    if (!lessonId || !QUANTITATIVE_LESSON_BY_ID.has(lessonId)) continue;
    const lessonAttempts = attemptsByLesson.get(lessonId) ?? [];
    lessonAttempts.push(attempt);
    attemptsByLesson.set(lessonId, lessonAttempts);
  }

  const passedLessonIds = new Set<string>();
  const latestAttemptByLesson = new Map<string, StoredAttempt>();
  for (const [lessonId, lessonAttempts] of attemptsByLesson) {
    if (lessonAttempts.some((attempt) => attempt.percentage >= QUANTITATIVE_BOOK_PASSING_SCORE)) {
      passedLessonIds.add(lessonId);
    }
    latestAttemptByLesson.set(lessonId, lessonAttempts[lessonAttempts.length - 1]);
  }

  return {
    attempts,
    attemptsByLesson,
    passedLessonIds,
    latestAttemptByLesson,
    publishedLessons: publishedLessonsInOrder(),
  };
}

function chapterInfoForTopic(topicId: string) {
  let order = 0;
  for (const chapter of QUANTITATIVE_CHAPTERS) {
    for (const [id] of chapter.topics) {
      order += 1;
      if (id === topicId) {
        return { chapterId: chapter.id, chapterTitle: chapter.title, order };
      }
    }
  }
  return null;
}

function getObservedFocus(attempts: StoredAttempt[]) {
  const counts = new Map<string, number>();
  const recent = attempts.slice(-12).reverse();
  for (const attempt of recent) {
    for (const detail of attempt.questionDetails ?? []) {
      if (detail.isCorrect === true || typeof detail.skillCode !== "string") continue;
      counts.set(detail.skillCode, (counts.get(detail.skillCode) ?? 0) + 1);
    }
  }
  const [skillCode, observations] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0] ?? [];
  if (!skillCode || !observations || observations < 2) return null;
  return {
    skillCode,
    title: skillTitles[skillCode] ?? "مهارة حسابية",
    message: `تكررت إجابات غير صحيحة مرتبطة بـ«${skillTitles[skillCode] ?? "هذه المهارة"}» في محاولاتك الأخيرة. هذه ملاحظة من سجل الإجابات وليست تشخيصًا؛ راجع الشرح والأمثلة المرتبطة بها.`,
    observations,
  };
}

function firstUnpassedPublishedLesson(progress: StudentProgress, passed = progress.passedLessonIds) {
  return progress.publishedLessons.find((lesson) => !passed.has(lesson.id)) ?? null;
}

function assertLessonUnlocked(lesson: QuantitativeLesson, progress: StudentProgress) {
  if (progress.passedLessonIds.has(lesson.id)) return;
  const targetOrder = topicOrderById().get(lesson.id) ?? Number.MAX_SAFE_INTEGER;
  const earlierIncomplete = progress.publishedLessons.find((publishedLesson) => {
    const lessonOrder = topicOrderById().get(publishedLesson.id) ?? Number.MAX_SAFE_INTEGER;
    return lessonOrder < targetOrder && !progress.passedLessonIds.has(publishedLesson.id);
  });
  if (earlierIncomplete) {
    throw new QuantitativeBookServiceError(
      "أكمل الاختبار بإتقان في الوحدة السابقة قبل فتح هذه الوحدة.",
      403,
    );
  }
}

function chooseQuizMode(lesson: QuantitativeLesson, progress: StudentProgress) {
  const latestAttempt = progress.latestAttemptByLesson.get(lesson.id);
  return latestAttempt &&
    latestAttempt.percentage < QUANTITATIVE_BOOK_PASSING_SCORE &&
    !progress.passedLessonIds.has(lesson.id)
    ? "remediation"
    : "assessment";
}

function publicFocusSkills(questions: QuantitativeQuestion[], latestAttempt?: StoredAttempt) {
  if (!latestAttempt) return [];
  const wrongSkills = new Set(
    (latestAttempt.questionDetails ?? [])
      .filter((detail) => detail.isCorrect === false && typeof detail.skillCode === "string")
      .map((detail) => detail.skillCode as string),
  );
  return questions
    .filter((question) => wrongSkills.has(question.skillCode))
    .map((question) => ({
      skillCode: question.skillCode,
      title: skillTitles[question.skillCode] ?? "مهارة حسابية",
    }))
    .filter((focus, index, all) => all.findIndex((item) => item.skillCode === focus.skillCode) === index);
}

function sourceEntries(ids: string[]) {
  return ids.map((id) => {
    const source = QUANTITATIVE_BOOK_SOURCES[id];
    if (!source) {
      throw new Error(`Missing source registry entry for ${id}`);
    }
    return source;
  });
}

export async function getQudratQuantitativeBook(userId: string) {
  const progress = await loadStudentProgress(userId);
  const firstUnpassed = firstUnpassedPublishedLesson(progress);
  const completedLessonCount = progress.passedLessonIds.size;
  const orderById = topicOrderById();

  const chapters = QUANTITATIVE_CHAPTERS.map((chapter, chapterIndex) => ({
    id: chapter.id,
    title: chapter.title,
    order: chapterIndex + 1,
    topics: chapter.topics.map(([topicId, title], topicIndex) => {
      const lesson = QUANTITATIVE_LESSON_BY_ID.get(topicId);
      const lessonAttempts = progress.attemptsByLesson.get(topicId) ?? [];
      const hasPassed = progress.passedLessonIds.has(topicId);
      const status = !lesson
        ? "coming_soon"
        : hasPassed
          ? "completed"
          : firstUnpassed?.id === topicId
            ? "available"
            : "locked";
      return {
        id: topicId,
        title,
        order: orderById.get(topicId) ?? chapterIndex * 10 + topicIndex + 1,
        summary: lesson?.summary ?? "هذه الوحدة ضمن خريطة الكتاب، ولم يُنشر شرحها واختبارها بعد.",
        status,
        attemptCount: lessonAttempts.length,
        lastScore: lessonAttempts.length
          ? lessonAttempts[lessonAttempts.length - 1].percentage
          : null,
      };
    }),
  }));

  return GetQudratQuantitativeBookResponse.parse({
    id: QUANTITATIVE_BOOK_ID,
    title: "الكتاب التأسيسي للقدرات الكمي",
    description:
      "مسار تأسيسي تجريبي من 50 موضوعًا. الوحدات المنشورة مكتملة الشرح والأمثلة والاختبار؛ بقية الخريطة موسومة «قريبًا». يتغير ترتيب الوحدة التالية وفق الإتقان، وتُقترح المراجعة من محاولاتك المسجلة دون ادعاء تشخيص أو تعلّم آلي مدرّب.",
    passingScore: QUANTITATIVE_BOOK_PASSING_SCORE,
    totalTopicCount: QUANTITATIVE_TOPICS.length,
    publishedLessonCount: QUANTITATIVE_LESSONS.length,
    completedLessonCount,
    chapters,
    focus: getObservedFocus(progress.attempts),
  });
}

export async function getQudratQuantitativeBookLesson(userId: string, lessonId: string) {
  const lesson = QUANTITATIVE_LESSON_BY_ID.get(lessonId);
  if (!lesson) {
    throw new QuantitativeBookServiceError("هذه الوحدة غير منشورة بعد.", 404);
  }
  const progress = await loadStudentProgress(userId);
  assertLessonUnlocked(lesson, progress);

  const mode = chooseQuizMode(lesson, progress);
  const questions = getQuestionSet(lesson, mode);
  const chapterInfo = chapterInfoForTopic(lesson.id);
  const latestAttempt = progress.latestAttemptByLesson.get(lesson.id);

  return GetQudratQuantitativeBookLessonResponse.parse({
    id: lesson.id,
    title: lesson.title,
    chapterTitle: chapterInfo?.chapterTitle ?? "الكتاب التأسيسي",
    summary: lesson.summary,
    estimatedMinutes: lesson.estimatedMinutes,
    passingScore: QUANTITATIVE_BOOK_PASSING_SCORE,
    sections: lesson.sections,
    sources: sourceEntries(lesson.sources),
    mode,
    questions: questions.map(publicQuestion),
    focusSkills: publicFocusSkills(questions, latestAttempt),
  });
}

function unlockAfterSubmission(
  lesson: QuantitativeLesson,
  passed: boolean,
  progress: StudentProgress,
) {
  if (!passed) return null;
  const passedAfterSubmission = new Set(progress.passedLessonIds);
  passedAfterSubmission.add(lesson.id);
  const currentOrder = topicOrderById().get(lesson.id) ?? Number.MAX_SAFE_INTEGER;
  return (
    progress.publishedLessons.find((candidate) => {
      const candidateOrder = topicOrderById().get(candidate.id) ?? Number.MAX_SAFE_INTEGER;
      return candidateOrder > currentOrder && !passedAfterSubmission.has(candidate.id);
    })?.id ?? null
  );
}

function attemptNumberFor(progress: StudentProgress, lessonId: string, testId?: string) {
  const attempts = progress.attemptsByLesson.get(lessonId) ?? [];
  if (!testId) return attempts.length + 1;
  const index = attempts.findIndex((attempt) => attempt.testId === testId);
  return index < 0 ? attempts.length : index + 1;
}

function publicQuizResult(
  lesson: QuantitativeLesson,
  attempt: StoredAttempt,
  progress: StudentProgress,
  testId?: string,
) {
  const passed = attempt.percentage >= QUANTITATIVE_BOOK_PASSING_SCORE;
  return SubmitQudratQuantitativeBookLessonResponse.parse({
    lessonId: lesson.id,
    score: attempt.percentage,
    correctAnswers: attempt.correctAnswers,
    totalQuestions: attempt.totalQuestions,
    passed,
    passingScore: QUANTITATIVE_BOOK_PASSING_SCORE,
    attemptNumber: attemptNumberFor(progress, lesson.id, testId),
    questionDetails: attempt.questionDetails ?? [],
    unlockedNextLessonId: unlockAfterSubmission(lesson, passed, progress),
  });
}

export async function submitQudratQuantitativeBookLesson(
  userId: string,
  lessonId: string,
  input: BookQuizInput,
) {
  const lesson = QUANTITATIVE_LESSON_BY_ID.get(lessonId);
  if (!lesson) {
    throw new QuantitativeBookServiceError("هذه الوحدة غير منشورة بعد.", 404);
  }

  if (
    !Number.isInteger(input.timeTakenSeconds) ||
    input.timeTakenSeconds < 0 ||
    input.timeTakenSeconds > 7200
  ) {
    throw new QuantitativeBookServiceError("مدة الاختبار غير صالحة.", 400);
  }
  const idempotencyKey = input.idempotencyKey.trim();
  if (!idempotencyKey || idempotencyKey.length > 200) {
    throw new QuantitativeBookServiceError("معرّف المحاولة غير صالح.", 400);
  }
  const digest = crypto
    .createHash("sha256")
    .update(`${userId}|${lessonId}|${idempotencyKey}`)
    .digest("hex");
  const testId = `${testIdPrefix}${lessonId}:${digest}`;
  const existingAttempt = await TestResult.findOne({ userId, testId })
    .select("testId percentage score correctAnswers totalQuestions questionDetails completedAt")
    .lean();
  if (existingAttempt) {
    const progress = await loadStudentProgress(userId);
    return publicQuizResult(
      lesson,
      existingAttempt as unknown as StoredAttempt,
      progress,
      testId,
    );
  }

  const progress = await loadStudentProgress(userId);
  assertLessonUnlocked(lesson, progress);
  const mode = chooseQuizMode(lesson, progress);
  const questions = getQuestionSet(lesson, mode);
  const answerMap = new Map<string, number>();

  if (input.answers.length !== questions.length) {
    throw new QuantitativeBookServiceError("أجب عن جميع أسئلة الاختبار قبل الإرسال.", 400);
  }
  for (const answer of input.answers) {
    if (!Number.isInteger(answer.selectedOptionIndex) || answer.selectedOptionIndex < 0) {
      throw new QuantitativeBookServiceError("إحدى الإجابات المحددة غير صالحة.", 400);
    }
    if (answerMap.has(answer.questionId)) {
      throw new QuantitativeBookServiceError("تم إرسال السؤال أكثر من مرة.", 409);
    }
    answerMap.set(answer.questionId, answer.selectedOptionIndex);
  }

  const expectedQuestionIds = new Set(questions.map((question) => question.id));
  if (
    answerMap.size !== expectedQuestionIds.size ||
    [...answerMap.keys()].some((questionId) => !expectedQuestionIds.has(questionId))
  ) {
    throw new QuantitativeBookServiceError(
      "مجموعة الأسئلة لم تعد حديثة؛ أعد فتح الوحدة وحاول مرة أخرى.",
      409,
    );
  }
  for (const question of questions) {
    const selectedOptionIndex = answerMap.get(question.id);
    if (
      selectedOptionIndex === undefined ||
      selectedOptionIndex >= question.options.length
    ) {
      throw new QuantitativeBookServiceError("إحدى الإجابات خارج خيارات السؤال.", 400);
    }
  }

  const graded = gradeQuantitativeQuiz(questions, answerMap);
  const attemptNumber = (progress.attemptsByLesson.get(lesson.id)?.length ?? 0) + 1;
  const responseTime = questions.length
    ? Math.max(0, input.timeTakenSeconds / questions.length)
    : 0;

  await Promise.all(
    questions.map((question) =>
      recordVerifiedLearningAttempt(
        userId,
        {
          questionId: question.id,
          sourceType: "legacy_json",
          sourceKey: QUANTITATIVE_BOOK_SOURCE_KEY,
          programId: "program.qudrat",
          selectedAnswer: answerMap.get(question.id),
          responseTime,
          idempotencyKey: `${idempotencyKey}:${question.id}`,
          metadata: {
            flow: "qudrat-quantitative-book",
            bookId: QUANTITATIVE_BOOK_ID,
            lessonId: lesson.id,
            skillCode: question.skillCode,
            attemptNumber,
          },
        },
        {
          correctOptionIndex: question.correctOptionIndex,
          optionsCount: question.options.length,
        },
      ),
    ),
  );

  const passed = graded.score >= QUANTITATIVE_BOOK_PASSING_SCORE;
  const created = await TestResult.create({
    userId,
    program: "qudrat",
    testType: "custom",
    testId,
    testName: lesson.title,
    difficulty: "mixed",
    subcategory: QUANTITATIVE_BOOK_ID,
    score: graded.score,
    totalQuestions: graded.totalQuestions,
    correctAnswers: graded.correctAnswers,
    wrongAnswers: graded.totalQuestions - graded.correctAnswers,
    skippedQuestions: 0,
    percentage: graded.score,
    timeTaken: input.timeTakenSeconds,
    pointsEarned: graded.correctAnswers,
    isOfficial: false,
    questionDetails: graded.questionDetails,
    completedAt: new Date(),
  });

  const attempt: StoredAttempt = {
    testId,
    percentage: created.percentage,
    score: created.score,
    correctAnswers: created.correctAnswers,
    totalQuestions: created.totalQuestions,
    questionDetails: created.questionDetails as Array<Record<string, unknown>>,
    completedAt: created.completedAt,
  };
  const attemptsByLesson = new Map(progress.attemptsByLesson);
  attemptsByLesson.set(lesson.id, [...(attemptsByLesson.get(lesson.id) ?? []), attempt]);
  const latestAttemptByLesson = new Map(progress.latestAttemptByLesson);
  latestAttemptByLesson.set(lesson.id, attempt);
  const passedLessonIds = new Set(progress.passedLessonIds);
  if (passed) passedLessonIds.add(lesson.id);
  const nextProgress: StudentProgress = {
    ...progress,
    attempts: [...progress.attempts, attempt],
    attemptsByLesson,
    latestAttemptByLesson,
    passedLessonIds,
  };

  return publicQuizResult(lesson, attempt, nextProgress, testId);
}