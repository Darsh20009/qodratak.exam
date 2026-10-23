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
  DailyProgress,
  FoundationContent,
  TahsiliQuestion,
  TestResult,
  User,
} from '../src/mongodb/models.ts';
import { LearningContentProgress } from '../src/mongodb/learningContentModels.ts';

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
  assert.ok(setCookie, 'real login should establish a session cookie');
  return setCookie.split(';', 1)[0];
}

async function jsonRequest(http: HttpClient, path: string): Promise<{ response: Response; body: any }> {
  const response = await http.request(path);
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

function ksaDate(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Riyadh' }).format(date);
}

test(
  'authenticated student dashboard scenarios A–F use saved, student-scoped evidence',
  { skip: !process.env.MONGODB_URI || !process.env.SESSION_SECRET, timeout: 120_000 },
  async () => {
    const marker = `dashboard-phase031-${crypto.randomUUID()}`;
    const password = 'Dashboard_Phase031_Test!2026';
    const keys = ['A', 'B', 'C', 'D', 'E', 'F', 'teacher'] as const;
    const emailByKey = new Map(keys.map((key) => [key, `${marker}-${key.toLowerCase()}@example.test`]));
    const studentIds: string[] = [];
    const contentIds: string[] = [];
    const tahsiliQuestionIds: number[] = [];
    let server: import('node:http').Server | undefined;
    let application: any;
    let connectedByTest = false;

    try {
      connectedByTest = !getConnectionStatus();
      await connectToMongoDB();
      assert.equal(getConnectionStatus(), true, 'dashboard integration requires the configured test database');

      const passwordHash = await bcrypt.hash(password, 10);
      const users = await User.create(keys.map((key) => ({
        username: `${marker}-${key.toLowerCase()}`,
        email: emailByKey.get(key),
        password: passwordHash,
        fullName: `طالب اصطناعي ${key}`,
        role: key === 'teacher' ? 'teacher' : 'student',
        isActive: true,
        activeStudySeconds: key === 'E' ? 5_400 : 0,
        academicTrack: key === 'E' ? 'tahsili' : 'qudrat',
        trialUsed: true,
        trialStartDate: new Date(Date.now() - 86_400_000),
        trialEndDate: new Date(Date.now() + 86_400_000),
        subscription: {
          type: 'pro',
          status: 'active',
          startDate: new Date(Date.now() - 86_400_000),
          endDate: new Date(Date.now() + 86_400_000),
        },
      })));
      const userByKey = new Map(keys.map((key, index) => [key, users[index]]));
      studentIds.push(...users.map((user) => String(user._id)));

      const makeSavedResult = (
        key: typeof keys[number],
        program: 'qudrat' | 'tahsili',
        testType: 'verbal' | 'quantitative' | 'standard',
        title: string,
        percentage: number,
        completedAt: Date,
        weakAreas: string[] = [],
        subjectId?: string,
      ) => ({
        userId: String(userByKey.get(key)!._id),
        program,
        ...(subjectId ? { subjectId } : {}),
        testType,
        testName: title,
        difficulty: 'intermediate' as const,
        score: percentage,
        totalQuestions: 10,
        correctAnswers: percentage / 10,
        wrongAnswers: 10 - percentage / 10,
        skippedQuestions: 0,
        percentage,
        timeTaken: 600,
        pointsEarned: 0,
        isOfficial: false,
        weakAreas,
        completedAt,
      });

      const now = new Date();
      const old = new Date(now.getTime() - 35 * 86_400_000);
      const older = new Date(now.getTime() - 3 * 86_400_000);
      const recent = new Date(now.getTime() - 86_400_000);
      await TestResult.create([
        makeSavedResult('D', 'qudrat', 'quantitative', `${marker}-D-old`, 60, older),
        makeSavedResult('D', 'qudrat', 'verbal', `${marker}-D-new`, 80, recent, ['فهم المقروء']),
        makeSavedResult('E', 'qudrat', 'quantitative', `${marker}-E-Q-old`, 70, older),
        makeSavedResult('E', 'qudrat', 'verbal', `${marker}-E-Q-new`, 80, recent, ['النسب']),
        makeSavedResult('E', 'tahsili', 'standard', `${marker}-E-T-old`, 50, older),
        makeSavedResult('E', 'tahsili', 'standard', `${marker}-E-T-new`, 60, now, ['الفيزياء'], 'subject.tahsili.physics'),
        makeSavedResult('F', 'qudrat', 'quantitative', `${marker}-F-returning`, 65, old),
      ]);
      const syntheticQuestionId = 2_000_000_000 + Math.floor(Math.random() * 100_000_000);
      tahsiliQuestionIds.push(syntheticQuestionId);
      await TahsiliQuestion.create({
        questionId: syntheticQuestionId,
        sourceKey: `${marker}-verified-physics-question`,
        subject: 'فيزياء',
        subcategory: 'حركة',
        text: 'إذا تحرك جسم بسرعة ثابتة، فماذا يصف ذلك؟',
        options: ['تسارع صفري', 'تسارع متزايد', 'سرعة متزايدة', 'توقف الجسم'],
        correctOptionIndex: 0,
        difficulty: 'beginner',
        topic: 'الحركة',
        explanation: 'السرعة الثابتة تعني أن التسارع يساوي صفرًا.',
        sourcePage: 1,
        sourceBook: 'بيانات اختبار اصطناعية',
        answerConfidence: 'verified',
      });

      const foundationLessons = await FoundationContent.create([
        {
          program: 'qudrat',
          subjectId: 'subject.qudrat.quantitative',
          title: `${marker}-B-started`,
          description: 'Synthetic Phase 03.1 progress fixture.',
          order: 999_990,
          published: true,
        },
        {
          program: 'qudrat',
          subjectId: 'subject.qudrat.quantitative',
          title: `${marker}-C-completed`,
          description: 'Synthetic Phase 03.1 progress fixture.',
          order: 999_991,
          published: true,
        },
      ]);
      contentIds.push(...foundationLessons.map((lesson) => String(lesson._id)));
      await LearningContentProgress.create([
        {
          studentId: String(userByKey.get('B')!._id),
          contentId: foundationLessons[0]._id,
          contentVersion: 1,
          progress: 45,
          state: 'READING',
          startedAt: now,
        },
        {
          studentId: String(userByKey.get('C')!._id),
          contentId: foundationLessons[1]._id,
          contentVersion: 1,
          progress: 100,
          state: 'COMPLETED',
          startedAt: now,
          completedAt: now,
        },
      ]);

      const today = ksaDate(now);
      const yesterdayDate = new Date(`${today}T12:00:00+03:00`);
      yesterdayDate.setDate(yesterdayDate.getDate() - 1);
      const yesterday = ksaDate(yesterdayDate);
      const studentEId = String(userByKey.get('E')!._id);
      await DailyProgress.create([
        {
          userId: studentEId,
          date: today,
          questionsAnswered: 25,
          goalTarget: 20,
          completedGoal: true,
          verifiedQuestionsAnswered: 5,
          verifiedQuestionIds: [`${marker}-q1`, `${marker}-q2`],
          verifiedGoalTarget: 5,
          verifiedGoalCompleted: true,
        },
        {
          userId: studentEId,
          date: yesterday,
          questionsAnswered: 20,
          goalTarget: 20,
          completedGoal: true,
          verifiedQuestionsAnswered: 5,
          verifiedQuestionIds: [`${marker}-q3`, `${marker}-q4`],
          verifiedGoalTarget: 5,
          verifiedGoalCompleted: true,
        },
        {
          userId: studentEId,
          date: ksaDate(new Date(now.getTime() - 10 * 86_400_000)),
          questionsAnswered: 20,
          goalTarget: 20,
          completedGoal: true,
          verifiedQuestionsAnswered: 0,
          verifiedQuestionIds: [],
          verifiedGoalTarget: 5,
          verifiedGoalCompleted: false,
        },
      ]);

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
      assert.equal((await anonymous.request('/api/student/dashboard')).status, 401);

      const login = async (key: typeof keys[number]): Promise<HttpClient> => {
        const response = await anonymous.request('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ identifier: emailByKey.get(key), password }),
        });
        assert.equal(response.status, 200, `synthetic ${key} login should succeed: ${await response.text()}`);
        return client(baseUrl, cookieFrom(response));
      };

      const studentA = await login('A');
      const studentB = await login('B');
      const studentC = await login('C');
      const studentD = await login('D');
      const studentE = await login('E');
      const studentF = await login('F');
      const teacher = await login('teacher');

      const [dashboardA, dailyA] = await Promise.all([
        jsonRequest(studentA, '/api/student/dashboard'),
        jsonRequest(studentA, '/api/daily-goal'),
      ]);
      assert.equal(dashboardA.response.status, 200);
      assert.equal(dashboardA.body.metricsAvailable, true);
      assert.equal(dashboardA.body.totals.tests, 0, 'A: new student has no saved test results');
      assert.deepEqual(dashboardA.body.recentTests, []);
      assert.equal(dailyA.response.status, 200);
      assert.equal(dailyA.body.verifiedStudyDays, 0);

      for (const [key, http, expectedState] of [
        ['B', studentB, 'READING'],
        ['C', studentC, 'COMPLETED'],
      ] as const) {
        const summary = await jsonRequest(
          http,
          '/api/learning/content-progress-summary?program=qudrat&subjectId=subject.qudrat.quantitative',
        );
        assert.equal(summary.response.status, 200, `${key}: authenticated foundation progress is available`);
        const fixtureId = contentIds[key === 'B' ? 0 : 1];
        const item = summary.body.items.find((candidate: any) => candidate.contentId === fixtureId);
        assert.ok(item, `${key}: the published fixture lesson appears in its student's summary`);
        assert.equal(item.state, expectedState);
        if (key === 'B') assert.ok(item.progress < 100, 'B: started foundation is not shown complete');
        else assert.equal(item.progress, 100, 'C: explicitly completed lesson retains its saved completion');
      }

      const subjectCatalog = await jsonRequest(
        studentB,
        '/api/foundation-content/subjects?program=qudrat',
      );
      assert.equal(subjectCatalog.response.status, 200, 'student can read the lightweight published-subject catalog');
      assert.deepEqual(Object.keys(subjectCatalog.body).sort(), ['program', 'subjectIds']);
      assert.ok(
        subjectCatalog.body.subjectIds.includes('subject.qudrat.quantitative'),
        'published lesson subjects are available without loading lesson or question documents',
      );

      const dashboardD = await jsonRequest(studentD, '/api/student/dashboard');
      assert.equal(dashboardD.response.status, 200);
      assert.equal(dashboardD.body.totals.tests, 2, 'D: count saved results, not visits');
      assert.deepEqual(
        dashboardD.body.recentTests.map((item: any) => item.testName),
        [`${marker}-D-new`, `${marker}-D-old`],
        'D: history is ordered by saved completion timestamp',
      );

      const dashboardE = await jsonRequest(studentE, '/api/student/dashboard');
      const dailyE = await jsonRequest(studentE, '/api/daily-goal');
      assert.equal(dashboardE.response.status, 200);
      assert.equal(dashboardE.body.studySeconds, 5_400, 'E: tracked visible learning time comes from the saved user counter');
      assert.equal(dashboardE.body.totals.tests, 4, 'E: completed tests are the saved results across both programs');
      assert.equal(dashboardE.body.progress.qudrat.tests, 2);
      assert.equal(dashboardE.body.progress.tahsili.tests, 2);
      assert.equal(dashboardE.body.progress.qudrat.percentage, 75);
      assert.equal(dashboardE.body.progress.tahsili.percentage, 55);
      assert.deepEqual(
        new Set(dashboardE.body.recentTests.map((item: any) => item.program)),
        new Set(['qudrat', 'tahsili']),
      );
      const tahsiliPhysicsResults = await jsonRequest(
        studentE,
        '/api/student/tahsili/results?subjectId=subject.tahsili.physics',
      );
      assert.equal(tahsiliPhysicsResults.response.status, 200);
      assert.equal(tahsiliPhysicsResults.body.subjectResultCount, 1);
      assert.equal(tahsiliPhysicsResults.body.generalResultCount, 1);
      assert.deepEqual(
        tahsiliPhysicsResults.body.subjectResults.map((item: any) => item.title),
        [`${marker}-E-T-new`],
        'only saved results with the exact trusted subject ID appear in the subject list',
      );
      assert.equal(tahsiliPhysicsResults.body.subjectResults[0].subjectId, 'subject.tahsili.physics');
      assert.deepEqual(
        tahsiliPhysicsResults.body.generalResults.map((item: any) => item.title),
        [`${marker}-E-T-old`],
        'legacy Tahsili results without a source-backed subject stay explicitly unclassified',
      );
      const tahsiliMathResults = await jsonRequest(
        studentE,
        '/api/student/tahsili/results?subjectId=subject.tahsili.math',
      );
      assert.equal(tahsiliMathResults.response.status, 200);
      assert.deepEqual(tahsiliMathResults.body.subjectResults, [], 'results are not inferred into a different subject');
      const otherStudentTahsiliResults = await jsonRequest(
        studentD,
        '/api/student/tahsili/results?subjectId=subject.tahsili.physics',
      );
      assert.equal(otherStudentTahsiliResults.response.status, 200);
      assert.deepEqual(otherStudentTahsiliResults.body.subjectResults, [], 'subject results remain session-owner scoped');

      const startedTahsiliTest = await studentE.request('/api/tahsili/subject-tests/start', {
        method: 'POST',
        body: JSON.stringify({ subject: 'physics', questionCount: 5 }),
      });
      const startedText = await startedTahsiliTest.text();
      assert.equal(startedTahsiliTest.status, 200, `synthetic Tahsili subject assessment starts: ${startedText}`);
      const startedBody = JSON.parse(startedText) as any;
      assert.equal(startedBody.subject, 'physics');
      assert.equal(startedBody.questions.length, 5);
      const startedQuestionIds = startedBody.questions.map((question: any) => Number(question.id));
      const trustedQuestionRows = await TahsiliQuestion.find({
        questionId: { $in: startedQuestionIds },
        subject: 'فيزياء',
        answerConfidence: 'verified',
      }).select('questionId correctOptionIndex').lean();
      const correctIndexById = new Map(trustedQuestionRows.map((question: any) => [
        String(question.questionId),
        Number(question.correctOptionIndex),
      ]));
      const submittedAnswers = startedBody.questions.map((question: any) => ({
        questionId: String(question.id),
        selectedOptionIndex: correctIndexById.get(String(question.id)),
        responseTime: 12,
      }));
      assert.ok(submittedAnswers.every((answer: any) => Number.isInteger(answer.selectedOptionIndex)));
      const submitBody = {
        attemptId: startedBody.attemptId,
        timeTakenSeconds: 12,
        subjectId: 'subject.tahsili.chemistry',
        subject: 'chemistry',
        answers: submittedAnswers,
      };
      const submittedTahsiliTest = await studentE.request('/api/tahsili/subject-tests/submit', {
        method: 'POST',
        body: JSON.stringify(submitBody),
      });
      const submittedText = await submittedTahsiliTest.text();
      assert.equal(submittedTahsiliTest.status, 200, `synthetic Tahsili result saves: ${submittedText}`);
      const savedTahsiliTest = JSON.parse(submittedText) as any;
      assert.equal(savedTahsiliTest.subjectId, 'subject.tahsili.physics', 'subject attribution comes from the server attempt');
      assert.ok(savedTahsiliTest.testResultId, 'the completed assessment has a persistent result record');
      const repeatedSubmit = await studentE.request('/api/tahsili/subject-tests/submit', {
        method: 'POST',
        body: JSON.stringify(submitBody),
      });
      assert.equal(repeatedSubmit.status, 200);
      assert.equal((await repeatedSubmit.json() as any).testResultId, savedTahsiliTest.testResultId);
      assert.equal(
        await TestResult.countDocuments({
          userId: studentEId,
          program: 'tahsili',
          testId: startedBody.attemptId,
        }),
        1,
        'a repeated submit does not duplicate the persisted subject result',
      );
      const persistedSubjectResults = await jsonRequest(
        studentE,
        '/api/student/tahsili/results?subjectId=subject.tahsili.physics',
      );
      assert.ok(
        persistedSubjectResults.body.subjectResults.some((item: any) => item.id === savedTahsiliTest.testResultId),
        'the saved result is readable from the same student-owned subject history',
      );
      const dashboardEAfterSubjectTest = await jsonRequest(studentE, '/api/student/dashboard');
      assert.ok(
        dashboardEAfterSubjectTest.body.recentTests.some((item: any) => item.subjectId === 'subject.tahsili.physics'),
        'dashboard evidence exposes the saved, trusted subject ID',
      );
      assert.equal(dailyE.body.verifiedStudyDays, 2, 'E: only dates with verified answers count, not legacy-only activity');

      const dashboardF = await jsonRequest(studentF, '/api/student/dashboard');
      assert.equal(dashboardF.response.status, 200);
      assert.equal(dashboardF.body.totals.tests, 1, 'F: historical saved progress remains available after return');
      assert.equal(dashboardF.body.recentTests[0].testName, `${marker}-F-returning`);

      const teacherDashboard = await jsonRequest(teacher, '/api/student/dashboard');
      assert.equal(teacherDashboard.response.status, 403, 'non-students cannot read the student dashboard');
      assert.equal(
        (await jsonRequest(studentB, '/api/student/dashboard')).body.totals.tests,
        0,
        'B cannot see E or D results through the session-scoped dashboard',
      );
      const studentBSharedContent = await jsonRequest(
        studentB,
        '/api/learning/content-progress-summary?program=qudrat&subjectId=subject.qudrat.quantitative',
      );
      const cLessonForB = studentBSharedContent.body.items.find(
        (item: any) => item.contentId === contentIds[1],
      );
      assert.equal(cLessonForB?.state, 'NOT_STARTED', 'B sees shared lesson content but not C private progress');
      assert.equal(cLessonForB?.progress, 0);
      assert.equal((await studentA.request('/api/auth/logout', { method: 'POST' })).status, 200);
      assert.equal((await studentA.request('/api/user')).status, 401, "logout ends the synthetic student's session");
    } finally {
      if (server) await close(server);
      if (application) await closeSessionStore(application);
      if (studentIds.length) {
        await Promise.all([
          User.deleteMany({ _id: { $in: studentIds } }),
          TestResult.deleteMany({ userId: { $in: studentIds } }),
          DailyProgress.deleteMany({ userId: { $in: studentIds } }),
          LearningContentProgress.deleteMany({ studentId: { $in: studentIds } }),
        ]);
      }
      if (contentIds.length) await FoundationContent.deleteMany({ _id: { $in: contentIds } });
      if (tahsiliQuestionIds.length) await TahsiliQuestion.deleteMany({ questionId: { $in: tahsiliQuestionIds } });
      if (connectedByTest && getConnectionStatus()) await disconnectFromMongoDB();
    }
  },
);
