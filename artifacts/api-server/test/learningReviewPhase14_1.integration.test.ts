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
  LearningAttempt,
  StudentMastery,
} from '../src/mongodb/learningProfileModels.ts';
import { LearningReviewItem } from '../src/mongodb/learningReviewModels.ts';
import { User } from '../src/mongodb/models.ts';
import { isReviewDue } from '../src/services/spacedRepetitionService.ts';

const PROGRAM = 'program.qudrat';
const SUBJECT = 'subject.qudrat.verbal';
const QUANTITATIVE = 'subject.qudrat.quantitative';

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
  const body = response.status === 204 ? null : await response.json();
  return { response, body };
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

function reviewFixture(
  studentId: string,
  marker: string,
  input: {
    sourceId: string;
    programId: string;
    subjectId?: string;
    nextReviewAt: Date;
    priority: number;
    state?: 'NEW' | 'LEARNING' | 'REVIEW_DUE' | 'STABLE' | 'SUSPENDED';
  },
) {
  return {
    studentId,
    programId: input.programId,
    subjectId: input.subjectId,
    sourceType: 'QUESTION' as const,
    sourceId: input.sourceId,
    sourceIdentity: `question:phase14-1:${marker}:${input.sourceId}`,
    reviewCount: 0,
    successfulReviewCount: 0,
    consecutiveSuccesses: 0,
    consecutiveFailures: 1,
    nextReviewAt: input.nextReviewAt,
    intervalDays: 1,
    retentionConfidence: 'LOW' as const,
    priority: input.priority,
    state: input.state || 'REVIEW_DUE',
    reasonCodes: ['OVERDUE', 'LOW_RETENTION_CONFIDENCE'] as const,
    lastFailureKind: 'CONCEPT' as const,
  };
}

function masteryFixture(studentId: string, subjectId: string) {
  return {
    studentId,
    programId: PROGRAM,
    subjectId,
    taxonomyNodeId: subjectId,
    taxonomyNodeType: 'SUBJECT' as const,
    masteryScore: 78,
    masteryLevel: 'PROFICIENT' as const,
    evidenceCount: 3,
    correctCount: 3,
    wrongCount: 0,
    lastAttemptAt: new Date(),
    lastEvidenceAt: new Date(),
    confidence: 'HIGH' as const,
    calculation: {
      answeredEvidenceCount: 3,
      distinctSourceCount: 3,
      recentCorrectStreak: 3,
      correctWeight: 3,
      negativeWeight: 0,
      conceptErrorCount: 0,
      proceduralErrorCount: 0,
      unknownErrorCount: 0,
      recencyFactor: 1,
    },
    calculationVersion: 'phase-07-v1',
  };
}

test(
  'authenticated due reviews stay student-scoped and feed recommendations without exposing internals',
  { skip: !process.env.MONGODB_URI || !process.env.SESSION_SECRET },
  async () => {
    const marker = `phase14-1-${crypto.randomUUID()}`;
    const password = 'Phase14_1_Test_Password!2026';
    const emailA = `${marker}-a@example.test`;
    const emailB = `${marker}-b@example.test`;
    const now = new Date();
    const past = new Date(now.getTime() - 2 * 86400000);
    const future = new Date(now.getTime() + 2 * 86400000);

    let server: import('node:http').Server | undefined;
    let application: any;
    let connectedByTest = false;
    const studentIds: string[] = [];

    try {
      connectedByTest = !getConnectionStatus();
      await connectToMongoDB();
      assert.equal(getConnectionStatus(), true, 'integration test requires a live MongoDB connection');

      const passwordHash = await bcrypt.hash(password, 10);
      const [studentA, studentB] = await Promise.all([
        User.create({
          username: `${marker}-a`,
          email: emailA,
          password: passwordHash,
          fullName: 'Phase 14.1 Student A',
          role: 'student',
          isActive: true,
        }),
        User.create({
          username: `${marker}-b`,
          email: emailB,
          password: passwordHash,
          fullName: 'Phase 14.1 Student B',
          role: 'student',
          isActive: true,
        }),
      ]);
      const studentAId = String(studentA._id);
      const studentBId = String(studentB._id);
      studentIds.push(studentAId, studentBId);

      await Promise.all([
        LearningReviewItem.create(reviewFixture(studentAId, marker, {
          sourceId: 'due-verbal-high',
          programId: PROGRAM,
          subjectId: SUBJECT,
          nextReviewAt: past,
          priority: 95,
        })),
        LearningReviewItem.create(reviewFixture(studentAId, marker, {
          sourceId: 'due-verbal-low',
          programId: PROGRAM,
          subjectId: SUBJECT,
          nextReviewAt: past,
          priority: 80,
        })),
        LearningReviewItem.create(reviewFixture(studentAId, marker, {
          sourceId: 'not-due-quantitative',
          programId: PROGRAM,
          subjectId: QUANTITATIVE,
          nextReviewAt: future,
          priority: 70,
          state: 'LEARNING',
        })),
        LearningReviewItem.create(reviewFixture(studentAId, marker, {
          sourceId: 'due-tahsili',
          programId: 'program.tahsili',
          nextReviewAt: past,
          priority: 60,
        })),
        ...[SUBJECT, QUANTITATIVE].map((subjectId) =>
          StudentMastery.create(masteryFixture(studentAId, subjectId))),
        ...[SUBJECT, QUANTITATIVE].flatMap((subjectId) =>
          Array.from({ length: 3 }, (_, index) => LearningAttempt.create({
            studentId: studentAId,
            questionId: `${marker}-${subjectId}-${index}`,
            sourceType: 'mongo_question',
            sourceIdentity: `mongo_question:${marker}-${subjectId}-${index}`,
            programId: PROGRAM,
            subjectId,
            isAnswered: true,
            isCorrect: true,
            responseTime: 30,
            attemptNumber: 1,
            idempotencyKey: `phase14-1-attempt:${marker}:${subjectId}:${index}`,
            createdAt: new Date(now.getTime() - 3600000),
          }))),
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
      const unauthenticated = client(baseUrl);

      const unauthorizedDue = await unauthenticated.request('/api/learning/reviews/due');
      assert.equal(unauthorizedDue.status, 401);
      const unauthorizedRecommendations = await unauthenticated.request('/api/learning/recommendations');
      assert.equal(unauthorizedRecommendations.status, 401);

      const login = async (email: string): Promise<HttpClient> => {
        const response = await unauthenticated.request('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ identifier: email, password }),
        });
        assert.equal(response.status, 200, await response.text());
        return client(baseUrl, cookieFrom(response));
      };

      const studentAHttp = await login(emailA);
      const studentBHttp = await login(emailB);

      const allDue = await jsonRequest(
        studentAHttp,
        `/api/learning/reviews/due?studentId=${studentBId}`,
      );
      assert.equal(allDue.response.status, 200);
      assert.deepEqual(
        allDue.body.reviewItems.map((item: { sourceId: string }) => item.sourceId),
        ['due-verbal-high', 'due-verbal-low', 'due-tahsili'],
      );
      assert.equal(allDue.body.reviewItems.some((item: any) => item.sourceId === 'not-due-quantitative'), false);
      assert.equal('studentId' in allDue.body.reviewItems[0], false);
      assert.equal('intervalDays' in allDue.body.reviewItems[0], false);
      assert.equal('lastFailureKind' in allDue.body.reviewItems[0], false);

      const programDue = await jsonRequest(
        studentAHttp,
        '/api/learning/reviews/due?programId=qudrat',
      );
      assert.equal(programDue.response.status, 200);
      assert.equal(programDue.body.reviewItems.length, 2);
      assert.equal(programDue.body.reviewItems.every((item: any) => item.programId === PROGRAM), true);

      const subjectDue = await jsonRequest(
        studentAHttp,
        `/api/learning/reviews/due?subjectId=${SUBJECT}`,
      );
      assert.equal(subjectDue.response.status, 200);
      assert.equal(subjectDue.body.reviewItems.length, 2);
      assert.equal(subjectDue.body.reviewItems.every((item: any) => item.subjectId === SUBJECT), true);

      const limitedDue = await jsonRequest(
        studentAHttp,
        `/api/learning/reviews/due?programId=qudrat&subjectId=${SUBJECT}&limit=1`,
      );
      assert.equal(limitedDue.response.status, 200);
      assert.equal(limitedDue.body.reviewItems.length, 1);
      assert.equal(limitedDue.body.reviewItems[0].sourceId, 'due-verbal-high');

      const beforeCount = await LearningReviewItem.countDocuments({ studentId: studentAId });
      const beforeItem = await LearningReviewItem.findOne({
        studentId: studentAId,
        sourceId: 'due-verbal-high',
      }).lean();
      await jsonRequest(studentAHttp, '/api/learning/reviews/due');
      const afterCount = await LearningReviewItem.countDocuments({ studentId: studentAId });
      const afterItem = await LearningReviewItem.findOne({
        studentId: studentAId,
        sourceId: 'due-verbal-high',
      }).lean();
      assert.equal(afterCount, beforeCount);
      assert.equal(afterItem?.state, beforeItem?.state);
      assert.equal(afterItem?.nextReviewAt?.toISOString(), beforeItem?.nextReviewAt?.toISOString());

      assert.equal(isReviewDue({ state: 'LEARNING', nextReviewAt: past }, now), true);
      assert.equal(isReviewDue({ state: 'LEARNING', nextReviewAt: future }, now), false);
      assert.equal(isReviewDue({ state: 'LEARNING', nextReviewAt: now }, now), true);

      const studentBDue = await jsonRequest(studentBHttp, '/api/learning/reviews/due');
      assert.equal(studentBDue.response.status, 200);
      assert.deepEqual(studentBDue.body.reviewItems, []);

      const studentARecommendations = await jsonRequest(
        studentAHttp,
        '/api/learning/recommendations?programId=qudrat',
      );
      assert.equal(studentARecommendations.response.status, 200);
      const reviewRecommendation = studentARecommendations.body.recommendations.find(
        (recommendation: any) =>
          recommendation.recommendationType === 'REVIEW' ||
          recommendation.recommendationType === 'MASTERY_CHECK',
      );
      assert.ok(reviewRecommendation, 'due review evidence should reach Recommendation Engine');
      assert.equal(reviewRecommendation.subjectId, SUBJECT);
      assert.ok(Array.isArray(reviewRecommendation.evidence.reviewReasonCodes));
      assert.equal('sourceIdentity' in reviewRecommendation, false);
      assert.equal('rawErrorEvidence' in reviewRecommendation, false);
      assert.equal('reviewPriority' in reviewRecommendation, false);

      const studentBRecommendations = await jsonRequest(
        studentBHttp,
        '/api/learning/recommendations?programId=qudrat',
      );
      assert.equal(studentBRecommendations.response.status, 200);
      assert.equal(
        studentBRecommendations.body.recommendations.some(
          (recommendation: any) =>
            recommendation.recommendationType === 'REVIEW' ||
            recommendation.recommendationType === 'MASTERY_CHECK',
        ),
        false,
      );
      assert.equal(
        JSON.stringify(studentBRecommendations.body).includes('due-verbal-high'),
        false,
      );
    } finally {
      if (server) await close(server);
      if (application) await closeSessionStore(application);
      await LearningReviewItem.deleteMany({ studentId: { $in: studentIds } });
      await LearningAttempt.deleteMany({ studentId: { $in: studentIds } });
      await StudentMastery.deleteMany({ studentId: { $in: studentIds } });
      if (studentIds.length) await User.deleteMany({ _id: { $in: studentIds } });
      if (connectedByTest && getConnectionStatus()) await disconnectFromMongoDB();
    }
  },
);