import assert from 'node:assert/strict';
import { once } from 'node:events';
import crypto from 'node:crypto';
import test from 'node:test';
import bcrypt from 'bcryptjs';

import {
  connectToMongoDB,
  disconnectFromMongoDB,
  getConnectionStatus,
} from '../src/mongodb/connection.ts';
import {
  DiagnosticAttempt,
  Question,
  TahsiliQuestion,
  StudentLearningProfile,
  TestResult,
  User,
} from '../src/mongodb/models.ts';
import {
  LearningAttempt,
  LearningAttemptSequence,
  LearningErrorEvidence,
  StudentMastery,
} from '../src/mongodb/learningProfileModels.ts';
import { StudentLearningCoachCache } from '../src/mongodb/learningCoachModels.ts';
import { LearningReviewItem } from '../src/mongodb/learningReviewModels.ts';

type HttpClient = {
  request(path: string, init?: RequestInit): Promise<Response>;
};

function client(baseUrl: string, cookie?: string): HttpClient {
  return {
    request(path, init = {}) {
      const headers = new Headers(init.headers);
      headers.set('content-type', 'application/json');
      if (cookie) headers.set('cookie', cookie);
      return fetch(`${baseUrl}${path}`, { ...init, headers });
    },
  };
}

function cookieFrom(response: Response): string {
  const setCookie = response.headers.get('set-cookie');
  assert.ok(setCookie, 'login should establish an authenticated session cookie');
  return setCookie.split(';', 1)[0];
}

async function jsonRequest(
  http: HttpClient,
  path: string,
  init?: RequestInit,
): Promise<{ response: Response; body: any }> {
  const response = await http.request(path, init);
  return { response, body: await response.json() };
}

async function listen(server: import('node:http').Server): Promise<string> {
  server.listen(0);
  await once(server, 'listening');
  const address = server.address();
  assert(address && typeof address === 'object');
  return `http://127.0.0.1:${address.port}`;
}

async function close(server: import('node:http').Server): Promise<void> {
  if (!server.listening) return;
  await new Promise<void>((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  });
}

async function closeSessionStore(app: any): Promise<void> {
  const stack = app?.router?.stack || app?._router?.stack || [];
  for (const layer of stack) {
    const store = layer?.handle?.store;
    if (store && typeof store.close === 'function') await store.close();
  }
}

function makeRegisteredTimersUnref(): () => void {
  const originalSetInterval = globalThis.setInterval;
  globalThis.setInterval = ((handler: TimerHandler, timeout?: number, ...args: any[]) => {
    const timer = originalSetInterval(handler, timeout, ...args);
    timer.unref();
    return timer;
  }) as typeof globalThis.setInterval;
  return () => {
    globalThis.setInterval = originalSetInterval;
  };
}

test(
  'authenticated Qudrat and Tahsili placement assessments save private, separate results',
  { skip: !process.env.MONGODB_URI || !process.env.SESSION_SECRET },
  async () => {
    const marker = `placement-${crypto.randomUUID()}`;
    const email = `${marker}@example.test`;
    const password = 'FoundationPlacement_Test_Password!2026';
    const studentIds: string[] = [];
    const tahsiliQuestionIds: number[] = [];
    let questionDocumentId: string | undefined;
    let server: import('node:http').Server | undefined;
    let application: any;
    let connectedByTest = false;

    try {
      connectedByTest = !getConnectionStatus();
      await connectToMongoDB();
      assert.equal(getConnectionStatus(), true);

      const passwordHash = await bcrypt.hash(password, 10);
      const student = await User.create({
        username: marker,
        email,
        password: passwordHash,
        fullName: 'Foundation Placement Integration Student',
        role: 'student',
        isActive: true,
      });
      const studentId = String(student._id);
      studentIds.push(studentId);

      const restoreTimerBehavior = makeRegisteredTimersUnref();
      const originalNodeEnv = process.env.NODE_ENV;
      const originalMongoUri = process.env.MONGODB_URI;
      process.env.NODE_ENV = 'test';
      delete process.env.MONGODB_URI;
      try {
        const { default: app } = await import('../src/app.ts');
        application = app;
        const { registerRoutes } = await import('../src/routes/routes.ts');
        server = await registerRoutes(app);
      } finally {
        process.env.MONGODB_URI = originalMongoUri;
        if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
        else process.env.NODE_ENV = originalNodeEnv;
        restoreTimerBehavior();
      }

      const baseUrl = await listen(server);
      const anonymous = client(baseUrl);
      assert.equal(
        (await anonymous.request('/api/foundation/diagnostic?program=qudrat')).status,
        401,
      );
      const login = await anonymous.request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ identifier: email, password }),
      });
      assert.equal(login.status, 200, await login.text());
      const studentHttp = client(baseUrl, cookieFrom(login));

      const qudratStart = await jsonRequest(
        studentHttp,
        '/api/foundation/diagnostic?program=qudrat',
      );
      assert.equal(qudratStart.response.status, 200);
      assert.equal(qudratStart.body.questions.length, 18);
      assert.ok(
        qudratStart.body.questions.every(
          (question: any) => !('correctOptionIndex' in question),
        ),
      );

      const incomplete = await jsonRequest(
        studentHttp,
        '/api/foundation/diagnostic/submit',
        {
          method: 'POST',
          body: JSON.stringify({ attemptId: qudratStart.body.attemptId, answers: [] }),
        },
      );
      assert.equal(incomplete.response.status, 422);

      const qudratSubmit = await jsonRequest(
        studentHttp,
        '/api/foundation/diagnostic/submit',
        {
          method: 'POST',
          body: JSON.stringify({
            attemptId: qudratStart.body.attemptId,
            answers: qudratStart.body.questions.map((question: any) => ({
              questionId: question.id,
              selectedOptionIndex: 0,
            })),
          }),
        },
      );
      assert.equal(qudratSubmit.response.status, 201);
      assert.equal(qudratSubmit.body.result.totalQuestions, 18);
      assert.equal(qudratSubmit.body.result.answeredQuestions, 18);
      assert.equal(qudratSubmit.body.result.confidence.level, 'MEDIUM');
      assert.equal(qudratSubmit.body.result.areas.length, 2);
      assert.ok(qudratSubmit.body.profile.baseline);

      const tahsiliStart = await jsonRequest(
        studentHttp,
        '/api/foundation/diagnostic?program=tahsili',
      );
      assert.equal(tahsiliStart.response.status, 200);
      assert.equal(tahsiliStart.body.questions.length, 32);
      assert.ok(
        tahsiliStart.body.questions.every(
          (question: any) => !('correctOptionIndex' in question),
        ),
      );

      const tahsiliSubmit = await jsonRequest(
        studentHttp,
        '/api/foundation/diagnostic/submit',
        {
          method: 'POST',
          body: JSON.stringify({
            attemptId: tahsiliStart.body.attemptId,
            answers: tahsiliStart.body.questions.map((question: any) => ({
              questionId: question.id,
              selectedOptionIndex: 0,
            })),
          }),
        },
      );
      assert.equal(tahsiliSubmit.response.status, 201);
      assert.equal(tahsiliSubmit.body.result.totalQuestions, 32);
      assert.equal(tahsiliSubmit.body.result.areas.length, 4);
      assert.equal(tahsiliSubmit.body.profile.baseline, null);

      const tahsiliState = await jsonRequest(
        studentHttp,
        '/api/foundation/learning-state?program=tahsili',
      );
      assert.equal(tahsiliState.response.status, 200);
      assert.equal(tahsiliState.body.baseline, null);
      assert.equal(tahsiliState.body.placementAssessment.totalQuestions, 32);

      assert.equal(await TestResult.countDocuments({ userId: studentId }), 2);
      const savedLearningAttempts = await LearningAttempt.find({ studentId })
        .select('programId subjectId sourceType sourceKey metadata')
        .lean();
      assert.equal(savedLearningAttempts.length, 50);
      const savedQudratAttempts = savedLearningAttempts.filter(
        (attempt) => attempt.programId === 'program.qudrat',
      );
      const savedTahsiliAttempts = savedLearningAttempts.filter(
        (attempt) => attempt.programId === 'program.tahsili',
      );
      assert.equal(savedQudratAttempts.length, 18);
      assert.equal(savedTahsiliAttempts.length, 32);
      assert.ok(
        savedTahsiliAttempts.every(
          (attempt) =>
            attempt.sourceType === 'legacy_json' &&
            attempt.metadata?.flow === 'foundation-placement' &&
            /^subject\.tahsili\.(math|physics|chemistry|biology|environment)$/.test(
              String(attempt.subjectId),
            ),
        ),
      );

      const questionIdBase = Math.floor(1_100_000_000 + Math.random() * 700_000_000);
      const tahsiliFixtures = Array.from({ length: 8 }, (_, index) => ({
        questionId: questionIdBase + index,
        subject: 'رياضيات' as const,
        subcategory: index < 5 ? 'جبر' : 'هندسة',
        text: `سؤال تحصيلي تكاملي ${index + 1}`,
        options: ['الخيار أ', 'الخيار ب', 'الخيار ج', 'الخيار د'],
        correctOptionIndex: index % 4,
        difficulty: 'intermediate' as const,
        topic: index < 5 ? 'المعادلات' : 'الأشكال',
        explanation: 'شرح محفوظ على الخادم.',
        sourcePage: 20 + index,
        sourceQuestionNumber: index + 1,
        sourceBook: `${marker}-integration-test`,
        answerConfidence: 'verified' as const,
      }));
      const reviewOnlyFixture = {
        ...tahsiliFixtures[0],
        questionId: questionIdBase + 8,
        sourcePage: 28,
        sourceQuestionNumber: 9,
        answerConfidence: 'review' as const,
      };
      await TahsiliQuestion.deleteMany({
        sourceBook: 'integration-test',
        text: /^سؤال تحصيلي تكاملي /,
      });
      tahsiliQuestionIds.push(...tahsiliFixtures.map((question) => question.questionId), reviewOnlyFixture.questionId);
      await TahsiliQuestion.insertMany([...tahsiliFixtures, reviewOnlyFixture]);

      const tahsiliOverview = await jsonRequest(
        studentHttp,
        '/api/tahsili/subject-tests/overview',
      );
      assert.equal(tahsiliOverview.response.status, 200);
      const mathOverview = tahsiliOverview.body.subjects.find((item: any) => item.subject === 'math');
      assert.equal(mathOverview.verifiedQuestionCount, 8);
      assert.equal(mathOverview.attempts, 0);

      const subjectTestStart = await jsonRequest(
        studentHttp,
        '/api/tahsili/subject-tests/start',
        {
          method: 'POST',
          body: JSON.stringify({ subject: 'math', questionCount: 5 }),
        },
      );
      assert.equal(subjectTestStart.response.status, 200);
      assert.equal(subjectTestStart.body.questions.length, 5);
      assert.ok(
        subjectTestStart.body.questions.every(
          (question: any) =>
            !('correctOptionIndex' in question) &&
            !('explanation' in question),
        ),
      );
      assert.equal(
        new Set(subjectTestStart.body.questions.map((question: any) => question.id)).size,
        5,
      );

      const fixtureById = new Map(
        tahsiliFixtures.map((question) => [String(question.questionId), question]),
      );
      const algebraIds = subjectTestStart.body.questions
        .filter((question: any) => question.subcategory === 'جبر')
        .slice(0, 2)
        .map((question: any) => question.id);
      assert.equal(algebraIds.length, 2);
      const algebraWrongIds = new Set(algebraIds);
      const subjectTestAnswers = subjectTestStart.body.questions.map((question: any) => {
        const answerKey = fixtureById.get(question.id)!.correctOptionIndex;
        return {
          questionId: question.id,
          selectedOptionIndex: algebraWrongIds.has(question.id) ? (answerKey + 1) % 4 : answerKey,
        };
      });
      const subjectTestSubmit = await jsonRequest(
        studentHttp,
        '/api/tahsili/subject-tests/submit',
        {
          method: 'POST',
          body: JSON.stringify({
            attemptId: subjectTestStart.body.attemptId,
            answers: subjectTestAnswers,
          }),
        },
      );
      assert.equal(subjectTestSubmit.response.status, 200);
      assert.equal(subjectTestSubmit.body.totalQuestions, 5);
      assert.equal(subjectTestSubmit.body.answeredQuestions, 5);
      assert.equal(subjectTestSubmit.body.correctAnswers, 3);
      assert.equal(subjectTestSubmit.body.wrongAnswers, 2);
      assert.equal(subjectTestSubmit.body.percentage, 60);
      assert.ok(subjectTestSubmit.body.questions.every((question: any) => 'correctOptionIndex' in question));

      const subjectTestAttempts = await LearningAttempt.find({
        studentId,
        sourceType: 'mongo_tahsili_question',
        programId: 'program.tahsili',
        subjectId: 'subject.tahsili.math',
      }).lean();
      assert.equal(subjectTestAttempts.length, 5);
      assert.ok(
        subjectTestAttempts.every(
          (attempt) => attempt.metadata?.flow === 'tahsili-subject-adaptive-test',
        ),
      );

      const updatedOverview = await jsonRequest(
        studentHttp,
        '/api/tahsili/subject-tests/overview',
      );
      const updatedMathOverview = updatedOverview.body.subjects.find((item: any) => item.subject === 'math');
      assert.equal(updatedMathOverview.attempts, 5);
      assert.equal(updatedMathOverview.accuracy, 60);
      assert.ok(updatedMathOverview.focusAreas.some((area: any) => area.subcategory === 'جبر'));

      const personalizedStart = await jsonRequest(
        studentHttp,
        '/api/tahsili/subject-tests/start',
        {
          method: 'POST',
          body: JSON.stringify({ subject: 'math', questionCount: 5 }),
        },
      );
      assert.equal(personalizedStart.response.status, 200);
      assert.equal(personalizedStart.body.personalizationMode, 'weakness_focus');
      assert.ok(personalizedStart.body.focusSubcategories.includes('جبر'));
      const duplicateAnswer = await jsonRequest(
        studentHttp,
        '/api/tahsili/subject-tests/submit',
        {
          method: 'POST',
          body: JSON.stringify({
            attemptId: personalizedStart.body.attemptId,
            answers: [
              { questionId: personalizedStart.body.questions[0].id, selectedOptionIndex: 0 },
              { questionId: personalizedStart.body.questions[0].id, selectedOptionIndex: 1 },
            ],
          }),
        },
      );
      assert.equal(duplicateAnswer.response.status, 400);

      const examQuestion = await Question.create({
        questionId: Math.floor(1_000_000_000 + Math.random() * 1_000_000_000),
        category: 'verbal',
        subcategory: 'integration-test',
        text: 'سؤال تجريبي لاختبار حفظ دليل القدرات',
        options: ['خيار أ', 'خيار ب', 'خيار ج', 'خيار د'],
        correctOptionIndex: 2,
        difficulty: 'intermediate',
        answerStatus: 'approved',
      });
      questionDocumentId = String(examQuestion._id);

      const qiyasSubmission = await jsonRequest(
        studentHttp,
        '/api/test-results',
        {
          method: 'POST',
          body: JSON.stringify({
            testType: 'qiyas',
            difficulty: 'advanced',
            score: 1,
            totalQuestions: 1,
            timeTaken: 90,
            skippedQuestions: 0,
            sourceKey: `qiyas-exam:integration:${studentId}`,
            idempotencyKey: `qiyas-exam-integration:${studentId}`,
            questionIds: [examQuestion.questionId],
            learningAnswers: [{
              questionId: questionDocumentId,
              selectedOptionIndex: 2,
              metadata: { examId: 1 },
            }],
          }),
        },
      );
      assert.equal(qiyasSubmission.response.status, 201);
      assert.equal(qiyasSubmission.body.learningAttemptsRecorded, 1);
      assert.equal(await TestResult.countDocuments({ userId: studentId }), 3);
      const savedExamAttempt = await LearningAttempt.findOne({
        studentId,
        questionId: questionDocumentId,
        sourceType: 'mongo_question',
        programId: 'program.qudrat',
        subjectId: 'subject.qudrat.verbal',
      }).lean();
      assert.equal(savedExamAttempt?.isCorrect, true);

      const originalOpenAiKey = process.env.OPENAI_API_KEY;
      delete process.env.OPENAI_API_KEY;
      try {
        const coachReport = await jsonRequest(
          studentHttp,
          '/api/student/learning-coach',
        );
        assert.equal(coachReport.response.status, 200);
        assert.equal(coachReport.body.evidence.trustedAttempts, 56);
        assert.deepEqual(
          coachReport.body.studyPlans.map((plan: any) => plan.program).sort(),
          ['qudrat', 'tahsili'],
        );
        assert.ok(
          coachReport.body.performanceTrend.some(
            (trend: any) => trend.program === 'tahsili',
          ),
        );
        assert.ok(
          coachReport.body.assessmentHistory.some(
            (item: any) => item.program === 'tahsili',
          ),
        );

        const chatFallback = await jsonRequest(
          studentHttp,
          '/api/student/learning-coach/chat',
          {
            method: 'POST',
            body: JSON.stringify({
              message: 'اشرح لي كيف أراجع هذا المجال.',
              history: [],
            }),
          },
        );
        assert.equal(chatFallback.response.status, 200);
        assert.equal(chatFallback.body.aiAvailable, false);
        assert.equal(chatFallback.body.fallback, true);
        assert.match(chatFallback.body.reply, /الدرس والاختبار/);
      } finally {
        if (originalOpenAiKey === undefined) delete process.env.OPENAI_API_KEY;
        else process.env.OPENAI_API_KEY = originalOpenAiKey;
      }
      assert.equal(
        await DiagnosticAttempt.countDocuments({ userId: studentId, status: 'completed' }),
        2,
      );
    } finally {
      if (server) await close(server);
      if (application) await closeSessionStore(application);
      if (studentIds.length) {
        const studentId = studentIds[0];
        await Promise.all([
          ...(questionDocumentId ? [Question.deleteOne({ _id: questionDocumentId })] : []),
          ...(tahsiliQuestionIds.length
            ? [TahsiliQuestion.deleteMany({ questionId: { $in: tahsiliQuestionIds } })]
            : []),
          TahsiliQuestion.deleteMany({
            sourceBook: 'integration-test',
            text: /^سؤال تحصيلي تكاملي /,
          }),
          DiagnosticAttempt.deleteMany({ userId: studentId }),
          TestResult.deleteMany({ userId: studentId }),
          LearningAttempt.deleteMany({ studentId }),
          LearningAttemptSequence.deleteMany({ studentId }),
          LearningErrorEvidence.deleteMany({ studentId }),
          StudentMastery.deleteMany({ studentId }),
          LearningReviewItem.deleteMany({ studentId }),
          StudentLearningCoachCache.deleteMany({ studentId }),
          StudentLearningProfile.deleteMany({ userId: studentId }),
        ]);
        await User.deleteMany({ _id: { $in: studentIds } });
      }
      if (connectedByTest && getConnectionStatus()) await disconnectFromMongoDB();
    }
  },
);
