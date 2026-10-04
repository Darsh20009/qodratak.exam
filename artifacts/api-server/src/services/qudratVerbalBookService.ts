import crypto from "crypto";
import {
  GetQudratVerbalBookLessonResponse,
  GetQudratVerbalBookResponse,
  SubmitQudratVerbalBookLessonResponse,
} from "@workspace/api-zod";
import { TestResult } from "../mongodb/models";
import { recordVerifiedLearningAttempt } from "./learningProfileService";
import {
  VERBAL_BOOK_ID,
  VERBAL_BOOK_PASSING_SCORE,
  VERBAL_BOOK_SOURCE_KEY,
  VERBAL_CHAPTERS,
  VERBAL_LESSONS,
  VERBAL_LESSON_BY_ID,
  VERBAL_TOPICS,
  getVerbalQuestionSet,
  gradeVerbalQuiz,
  publicVerbalQuestion,
} from "../learning/qudratVerbalBook";
import type { VerbalLesson, VerbalQuestion } from "../learning/qudratVerbalBook";

const testIdPrefix = `${VERBAL_BOOK_ID}:`;

export class VerbalBookServiceError extends Error {
  constructor(
    message: string,
    public readonly statusCode: 400 | 403 | 404 | 409 | 503,
  ) {
    super(message);
    this.name = "VerbalBookServiceError";
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
  publishedLessons: VerbalLesson[];
};

function topicOrderById() {
  return new Map<string, number>(
    VERBAL_TOPICS.map((topic, index): [string, number] => [topic.id, index]),
  );
}

function publishedLessonsInOrder() {
  const order = topicOrderById();
  return [...VERBAL_LESSONS].sort(
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
    if (!lessonId || !VERBAL_LESSON_BY_ID.has(lessonId)) continue;
    const lessonAttempts = attemptsByLesson.get(lessonId) ?? [];
    lessonAttempts.push(attempt);
    attemptsByLesson.set(lessonId, lessonAttempts);
  }

  const passedLessonIds = new Set<string>();
  const latestAttemptByLesson = new Map<string, StoredAttempt>();
  for (const [lessonId, lessonAttempts] of attemptsByLesson) {
    if (lessonAttempts.some((attempt) => attempt.percentage >= VERBAL_BOOK_PASSING_SCORE)) {
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
  for (const chapter of VERBAL_CHAPTERS) {
    for (const [id] of chapter.topics) {
      order += 1;
      if (id === topicId) {
        return { chapterId: chapter.id, chapterTitle: chapter.title, order };
      }
    }
  }
  return null;
}

function firstUnpassedPublishedLesson(progress: StudentProgress) {
  return progress.publishedLessons.find((lesson) => !progress.passedLessonIds.has(lesson.id)) ?? null;
}

function assertLessonUnlocked(lesson: VerbalLesson, progress: StudentProgress) {
  if (progress.passedLessonIds.has(lesson.id)) return;
  const targetOrder = topicOrderById().get(lesson.id) ?? Number.MAX_SAFE_INTEGER;
  const earlierIncomplete = progress.publishedLessons.find((publishedLesson) => {
    const lessonOrder = topicOrderById().get(publishedLesson.id) ?? Number.MAX_SAFE_INTEGER;
    return lessonOrder < targetOrder && !progress.passedLessonIds.has(publishedLesson.id);
  });
  if (earlierIncomplete) {
    throw new VerbalBookServiceError(
      "أكمل الاختبار بإتقان في الدرس المنشور السابق قبل فتح هذا الدرس.",
      403,
    );
  }
}

function chooseQuizMode(lesson: VerbalLesson, progress: StudentProgress) {
  const latestAttempt = progress.latestAttemptByLesson.get(lesson.id);
  return latestAttempt &&
    latestAttempt.percentage < VERBAL_BOOK_PASSING_SCORE &&
    !progress.passedLessonIds.has(lesson.id)
    ? "remediation"
    : "assessment";
}

function publicQuizResult(
  lesson: VerbalLesson,
  attempt: StoredAttempt,
  progress: StudentProgress,
  testId?: string,
) {
  const passed = attempt.percentage >= VERBAL_BOOK_PASSING_SCORE;
  const passedAfterSubmission = new Set(progress.passedLessonIds);
  if (passed) passedAfterSubmission.add(lesson.id);
  const currentOrder = topicOrderById().get(lesson.id) ?? Number.MAX_SAFE_INTEGER;
  const unlockedNextLessonId =
    passed
      ? progress.publishedLessons.find((candidate) => {
          const candidateOrder = topicOrderById().get(candidate.id) ?? Number.MAX_SAFE_INTEGER;
          return candidateOrder > currentOrder && !passedAfterSubmission.has(candidate.id);
        })?.id ?? null
      : null;
  const attempts = progress.attemptsByLesson.get(lesson.id) ?? [];
  const previousIndex = testId
    ? attempts.findIndex((candidate) => candidate.testId === testId)
    : -1;

  return SubmitQudratVerbalBookLessonResponse.parse({
    lessonId: lesson.id,
    score: attempt.percentage,
    correctAnswers: attempt.correctAnswers,
    totalQuestions: attempt.totalQuestions,
    passed,
    passingScore: VERBAL_BOOK_PASSING_SCORE,
    attemptNumber: previousIndex >= 0 ? previousIndex + 1 : attempts.length + 1,
    questionDetails: attempt.questionDetails ?? [],
    unlockedNextLessonId,
  });
}

function topicMap(progress: StudentProgress) {
  const firstUnpassed = firstUnpassedPublishedLesson(progress);
  const orderById = topicOrderById();
  return VERBAL_CHAPTERS.map((chapter, chapterIndex) => ({
    id: chapter.id,
    title: chapter.title,
    order: chapterIndex + 1,
    topics: chapter.topics.map(([topicId, title], topicIndex) => {
      const lesson = VERBAL_LESSON_BY_ID.get(topicId);
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
        summary: lesson?.summary ?? "هذا الموضوع ضمن خريطة الكتاب، ولم يُنشر شرحه واختباره بعد.",
        status,
        attemptCount: lessonAttempts.length,
        lastScore: lessonAttempts.length
          ? lessonAttempts[lessonAttempts.length - 1].percentage
          : null,
      };
    }),
  }));
}

export async function getQudratVerbalBook(userId: string) {
  const progress = await loadStudentProgress(userId);
  return GetQudratVerbalBookResponse.parse({
    id: VERBAL_BOOK_ID,
    title: "الكتاب التأسيسي للقدرات اللفظي",
    description:
      "مسار تأسيسي تجريبي من 50 موضوعًا يغطي المفردات والتناظر اللفظي وإكمال الجمل والخطأ السياقي واستيعاب المقروء. الدروس المتاحة منشورة بشرح واختبار، وتظهر الموضوعات الأخرى بوضوح على أنها قادمة.",
    passingScore: VERBAL_BOOK_PASSING_SCORE,
    totalTopicCount: VERBAL_TOPICS.length,
    publishedLessonCount: VERBAL_LESSONS.length,
    completedLessonCount: progress.passedLessonIds.size,
    chapters: topicMap(progress),
    focus: null,
  });
}

export async function getQudratVerbalBookLesson(userId: string, lessonId: string) {
  const lesson = VERBAL_LESSON_BY_ID.get(lessonId);
  if (!lesson) {
    throw new VerbalBookServiceError("هذا الدرس غير منشور بعد.", 404);
  }
  const progress = await loadStudentProgress(userId);
  assertLessonUnlocked(lesson, progress);
  const mode = chooseQuizMode(lesson, progress);
  const questions = getVerbalQuestionSet(lesson, mode);
  const chapterInfo = chapterInfoForTopic(lesson.id);

  return GetQudratVerbalBookLessonResponse.parse({
    id: lesson.id,
    title: lesson.title,
    chapterTitle: chapterInfo?.chapterTitle ?? "الكتاب التأسيسي اللفظي",
    summary: lesson.summary,
    estimatedMinutes: lesson.estimatedMinutes,
    passingScore: VERBAL_BOOK_PASSING_SCORE,
    sections: lesson.sections,
    sources: [],
    mode,
    questions: questions.map(publicVerbalQuestion),
    focusSkills: [],
  });
}

function unlockAfterSubmission(
  lesson: VerbalLesson,
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

export async function submitQudratVerbalBookLesson(
  userId: string,
  lessonId: string,
  input: BookQuizInput,
) {
  const lesson = VERBAL_LESSON_BY_ID.get(lessonId);
  if (!lesson) {
    throw new VerbalBookServiceError("هذا الدرس غير منشور بعد.", 404);
  }
  if (
    !Number.isInteger(input.timeTakenSeconds) ||
    input.timeTakenSeconds < 0 ||
    input.timeTakenSeconds > 7200
  ) {
    throw new VerbalBookServiceError("مدة الاختبار غير صالحة.", 400);
  }
  const idempotencyKey = input.idempotencyKey.trim();
  if (!idempotencyKey || idempotencyKey.length > 200) {
    throw new VerbalBookServiceError("معرّف المحاولة غير صالح.", 400);
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
  const questions = getVerbalQuestionSet(lesson, chooseQuizMode(lesson, progress));
  const answerMap = new Map<string, number>();
  if (input.answers.length !== questions.length) {
    throw new VerbalBookServiceError("أجب عن جميع أسئلة الاختبار قبل الإرسال.", 400);
  }
  for (const answer of input.answers) {
    if (!Number.isInteger(answer.selectedOptionIndex) || answer.selectedOptionIndex < 0) {
      throw new VerbalBookServiceError("إحدى الإجابات المحددة غير صالحة.", 400);
    }
    if (answerMap.has(answer.questionId)) {
      throw new VerbalBookServiceError("تم إرسال السؤال أكثر من مرة.", 409);
    }
    answerMap.set(answer.questionId, answer.selectedOptionIndex);
  }
  const expectedQuestionIds = new Set(questions.map((question) => question.id));
  if (
    answerMap.size !== expectedQuestionIds.size ||
    [...answerMap.keys()].some((questionId) => !expectedQuestionIds.has(questionId))
  ) {
    throw new VerbalBookServiceError(
      "مجموعة الأسئلة لم تعد حديثة؛ أعد فتح الدرس وحاول مرة أخرى.",
      409,
    );
  }
  for (const question of questions) {
    const selectedOptionIndex = answerMap.get(question.id);
    if (
      selectedOptionIndex === undefined ||
      selectedOptionIndex >= question.options.length
    ) {
      throw new VerbalBookServiceError("إحدى الإجابات خارج خيارات السؤال.", 400);
    }
  }

  const graded = gradeVerbalQuiz(questions, answerMap);
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
          sourceKey: VERBAL_BOOK_SOURCE_KEY,
          programId: "program.qudrat",
          selectedAnswer: answerMap.get(question.id),
          responseTime,
          idempotencyKey: `${idempotencyKey}:${question.id}`,
          metadata: {
            flow: "qudrat-verbal-book",
            bookId: VERBAL_BOOK_ID,
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

  const created = await TestResult.create({
    userId,
    program: "qudrat",
    testType: "custom",
    testId,
    testName: lesson.title,
    difficulty: "mixed",
    subcategory: VERBAL_BOOK_ID,
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
  const passedLessonIds = new Set(progress.passedLessonIds);
  if (created.percentage >= VERBAL_BOOK_PASSING_SCORE) {
    passedLessonIds.add(lesson.id);
  }
  const nextProgress: StudentProgress = {
    ...progress,
    attempts: [...progress.attempts, attempt],
    attemptsByLesson,
    passedLessonIds,
  };
  return publicQuizResult(lesson, attempt, nextProgress, testId);
}