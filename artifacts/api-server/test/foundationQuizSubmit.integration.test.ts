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
  FoundationContent,
  Question,
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
  'authenticated 48-question foundation quiz completes and returns timed review after submission',
  { skip: !process.env.MONGODB_URI || !process.env.SESSION_SECRET },
  async () => {
    const marker = `foundation-quiz-${crypto.randomUUID()}`;
    const email = `${marker}@example.test`;
    const password = 'FoundationQuiz_Test_Password!2026';
    const studentIds: string[] = [];
    const questionIds: unknown[] = [];
    let lessonId: string | undefined;
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
        fullName: 'Foundation Quiz Integration Student',
        role: 'student',
        isActive: true,
      });
      const studentId = String(student._id);
      studentIds.push(studentId);

      const questionIdBase = 900_000_000 + Math.floor(Math.random() * 90_000_000);
      const questionCount = 48;
      const questions = await Question.create(
        Array.from({ length: questionCount }, (_, index) => ({
          questionId: questionIdBase + index,
          category: 'quantitative',
          text: `Integration test question ${index + 1}`,
          options: ['A', 'B', 'C', 'D'],
          correctOptionIndex: (index + 1) % 4,
          difficulty: 'beginner',
          answerStatus: 'approved',
          source: {
            type: 'generated',
            questionId: `${marker}-${index + 1}`,
            videoTimestampSeconds: 123 + index * 30,
            videoTimestampInferred: index % 2 === 1,
          },
        })),
      );
      questionIds.push(...questions.map((question) => question._id));

      const lesson = await FoundationContent.create({
        program: 'qudrat',
        subjectId: 'subject.qudrat.quantitative',
        title: `${marker} lesson`,
        description: 'Foundation quiz result integration fixture.',
        videoUrl: '/foundation/quantitative/computer-banks/test-video.mp4',
        order: 999_999,
        published: true,
        quiz: {
          title: `${marker} quiz`,
          instructions: 'Integration fixture.',
          questionIds: questions.map((question) => question._id),
          passingScore: 50,
          timeLimitMinutes: 5,
        },
      });
      lessonId = String(lesson._id);

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
      const unauthenticated = client(baseUrl);
      const login = await unauthenticated.request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ identifier: email, password }),
      });
      assert.equal(login.status, 200, await login.text());
      const studentHttp = client(baseUrl, cookieFrom(login));

      const beforeSubmission = await jsonRequest(
        studentHttp,
        '/api/foundation-content?program=qudrat&subjectId=subject.qudrat.quantitative',
      );
      assert.equal(beforeSubmission.response.status, 200);
      const visibleLesson = beforeSubmission.body.content.find(
        (item: any) => item._id === lessonId,
      );
      assert.ok(visibleLesson);
      assert.equal(visibleLesson.quiz.questionIds.length, questionCount);
      assert.deepEqual(
        visibleLesson.quiz.questionIds.slice(0, 2).map((question: any) => ({
          timestamp: question.source.videoTimestampSeconds,
          inferred: question.source.videoTimestampInferred,
          exposesAnswer: 'correctOptionIndex' in question,
        })),
        [
          { timestamp: 123, inferred: false, exposesAnswer: false },
          { timestamp: 153, inferred: true, exposesAnswer: false },
        ],
      );

      const submissionStartedAt = Date.now();
      const submitted = await jsonRequest(
        studentHttp,
        `/api/foundation-content/${lessonId}/quiz/submit`,
        {
          method: 'POST',
          body: JSON.stringify({
            answers: questions.map((question, index) => ({
              questionId: String(question._id),
              selectedOptionIndex: index % 2 === 0
                ? (index + 1) % 4
                : ((index + 1) % 4 + 1) % 4,
            })),
            timeTakenSeconds: 42,
            idempotencyKey: `${marker}-submission`,
          }),
        },
      );
      const submissionDurationMs = Date.now() - submissionStartedAt;
      assert.equal(submitted.response.status, 200);
      assert.ok(
        submissionDurationMs < 90_000,
        `48-question submission took ${submissionDurationMs}ms`,
      );
      assert.equal(submitted.body.correctAnswers, 24);
      assert.equal(submitted.body.totalQuestions, questionCount);
      assert.equal(submitted.body.questionDetails.length, questionCount);
      assert.equal(submitted.body.score, 50);
      assert.equal(submitted.body.passed, true);
      assert.deepEqual(
        submitted.body.questionDetails.slice(0, 2).map((detail: any) => ({
          questionId: detail.questionId,
          selectedOptionIndex: detail.selectedOptionIndex,
          correctOptionIndex: detail.correctOptionIndex,
          timestamp: detail.videoTimestampSeconds,
        })),
        [
          {
            questionId: String(questions[0]._id),
            selectedOptionIndex: 1,
            correctOptionIndex: 1,
            timestamp: 123,
          },
          {
            questionId: String(questions[1]._id),
          selectedOptionIndex: 3,
            correctOptionIndex: 2,
          timestamp: 153,
          },
        ],
      );
    } finally {
      if (server) await close(server);
      if (application) await closeSessionStore(application);
      if (studentIds.length) {
        const studentId = studentIds[0];
        await Promise.all([
          TestResult.deleteMany({ userId: studentId }),
          LearningAttempt.deleteMany({ studentId }),
          LearningAttemptSequence.deleteMany({ studentId }),
          LearningErrorEvidence.deleteMany({ studentId }),
          StudentMastery.deleteMany({ studentId }),
          LearningReviewItem.deleteMany({ studentId }),
          StudentLearningProfile.deleteMany({ userId: studentId }),
        ]);
        await User.deleteMany({ _id: { $in: studentIds } });
      }
      if (lessonId) await FoundationContent.deleteMany({ _id: lessonId });
      if (questionIds.length) await Question.deleteMany({ _id: { $in: questionIds } });
      if (connectedByTest && getConnectionStatus()) await disconnectFromMongoDB();
    }
  },
);