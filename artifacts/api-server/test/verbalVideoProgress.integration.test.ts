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
import { VerbalVideoProgressModel } from '../src/mongodb/verbalVideoProgressModel.ts';
import { QUDRAT_VERBAL_COMPUTERIZED_VIDEOS } from '../src/services/qudratVerbalBookFilesService.ts';

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
  'authenticated students save their own verbal video progress and cannot read another student record',
  { skip: !process.env.MONGODB_URI || !process.env.SESSION_SECRET },
  async () => {
    const marker = `verbal-video-progress-${crypto.randomUUID()}`;
    const password = 'VerbalVideo_Progress_Test!2026';
    const emailA = `${marker}-a@example.test`;
    const emailB = `${marker}-b@example.test`;
    const usernameA = `${marker}-a`;
    const usernameB = `${marker}-b`;
    const videoId = QUDRAT_VERBAL_COMPUTERIZED_VIDEOS[0].id;

    let server: import('node:http').Server | undefined;
    let application: any;
    let connectedByTest = false;
    const studentIds: string[] = [];

    try {
      connectedByTest = !getConnectionStatus();
      await connectToMongoDB();
      assert.equal(getConnectionStatus(), true, 'integration test requires a live MongoDB connection');

      const passwordHash = await bcrypt.hash(password, 10);
      const students = await User.create([
        {
          username: usernameA,
          email: emailA,
          password: passwordHash,
          fullName: 'Verbal Progress Student A',
          role: 'student',
          isActive: true,
        },
        {
          username: usernameB,
          email: emailB,
          password: passwordHash,
          fullName: 'Verbal Progress Student B',
          role: 'student',
          isActive: true,
        },
      ]);
      studentIds.push(...students.map((student) => String(student._id)));

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
      const videoProgressPath = '/api/learning/computerized/verbal/video-progress';
      assert.equal((await anonymous.request(videoProgressPath)).status, 401);

      const login = async (email: string): Promise<HttpClient> => {
        const response = await anonymous.request('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ identifier: email, password }),
        });
        assert.equal(response.status, 200, await response.text());
        return client(baseUrl, cookieFrom(response));
      };

      const studentA = await login(emailA);
      const studentB = await login(emailB);
      const initial = await jsonRequest(studentA, videoProgressPath);
      assert.equal(initial.response.status, 200);
      assert.equal(initial.body.items.length, 23);
      assert.equal(
        initial.body.items.find((item: { videoId: string }) => item.videoId === videoId).state,
        'NOT_STARTED',
      );

      const recordPath = `/api/learning/computerized/verbal/videos/${videoId}/progress`;
      const play = await jsonRequest(studentA, recordPath, {
        method: 'POST',
        body: JSON.stringify({ event: 'play', positionSeconds: 0 }),
      });
      assert.equal(play.response.status, 200);

      const tick = await jsonRequest(studentA, recordPath, {
        method: 'POST',
        body: JSON.stringify({ event: 'tick', positionSeconds: 1 }),
      });
      assert.equal(tick.response.status, 200);
      assert.equal(tick.body.videoId, videoId);
      assert.ok(tick.body.watchedSeconds > 0);
      assert.equal(tick.body.state, 'IN_PROGRESS');

      const studentAProgress = await jsonRequest(studentA, videoProgressPath);
      const saved = studentAProgress.body.items.find(
        (item: { videoId: string }) => item.videoId === videoId,
      );
      assert.ok(saved.watchedSeconds > 0);

      const studentBProgress = await jsonRequest(studentB, videoProgressPath);
      const isolated = studentBProgress.body.items.find(
        (item: { videoId: string }) => item.videoId === videoId,
      );
      assert.equal(isolated.watchedSeconds, 0);
      assert.equal(isolated.state, 'NOT_STARTED');
    } finally {
      if (server) await close(server);
      if (application) await closeSessionStore(application);
      if (studentIds.length) {
        await VerbalVideoProgressModel.deleteMany({ studentId: { $in: studentIds } });
        await User.deleteMany({ _id: { $in: studentIds } });
      }
      if (connectedByTest && getConnectionStatus()) await disconnectFromMongoDB();
    }
  },
);
