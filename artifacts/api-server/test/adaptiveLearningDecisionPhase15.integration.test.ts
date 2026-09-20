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
import { User } from '../src/mongodb/models.ts';

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
  'adaptive decision API requires authentication and derives state from the logged-in student',
  { skip: !process.env.MONGODB_URI || !process.env.SESSION_SECRET },
  async () => {
    const marker = `phase15-${crypto.randomUUID()}`;
    const password = 'Phase15_Test_Password!2026';
    const emailA = `${marker}-a@example.test`;
    const emailB = `${marker}-b@example.test`;
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
          fullName: 'Phase 15 Student A',
          role: 'student',
          isActive: true,
        }),
        User.create({
          username: `${marker}-b`,
          email: emailB,
          password: passwordHash,
          fullName: 'Phase 15 Student B',
          role: 'student',
          isActive: true,
        }),
      ]);
      studentIds.push(String(studentA._id), String(studentB._id));

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
      const unauthorized = await unauthenticated.request('/api/learning/adaptive/decision');
      assert.equal(unauthorized.status, 401);

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
      const studentADecision = await studentAHttp.request(
        `/api/learning/adaptive/decision?studentId=${studentIds[1]}`,
      );
      assert.equal(studentADecision.status, 200);
      const studentABody = await studentADecision.json();
      assert.equal(studentABody.studentId, studentIds[0]);
      assert.equal(studentABody.decision, 'DIAGNOSTIC');
      assert.equal(studentABody.reasonCode, 'NEW_STUDENT');
      assert.equal('mastery' in studentABody, false);
      assert.equal('errorEvidence' in studentABody, false);
      assert.equal('retention' in studentABody, false);

      const studentBDecision = await studentBHttp.request('/api/learning/adaptive/decision');
      assert.equal(studentBDecision.status, 200);
      const studentBBody = await studentBDecision.json();
      assert.equal(studentBBody.studentId, studentIds[1]);
      assert.equal(studentBBody.decision, 'DIAGNOSTIC');
      assert.equal(studentBBody.scope.programId, 'program.qudrat');
    } finally {
      if (server) await close(server);
      if (application) await closeSessionStore(application);
      if (studentIds.length) await User.deleteMany({ _id: { $in: studentIds } });
      if (connectedByTest && getConnectionStatus()) await disconnectFromMongoDB();
    }
  },
);