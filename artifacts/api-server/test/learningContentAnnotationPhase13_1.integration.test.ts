import assert from 'node:assert/strict';
import { once } from 'node:events';
import crypto from 'node:crypto';
import test from 'node:test';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

import {
  connectToMongoDB,
  disconnectFromMongoDB,
  getConnectionStatus,
} from '../src/mongodb/connection.ts';
import { LearningContentAnnotation } from '../src/mongodb/learningContentModels.ts';
import { FoundationContent, User } from '../src/mongodb/models.ts';

const CONTENT_VERSION = 7;
const NEXT_CONTENT_VERSION = 8;
const SECTION_ID = 'phase-13-1-section';

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

function annotationData(type: string, suffix: string): Record<string, unknown> {
  switch (type) {
    case 'HIGHLIGHT':
    case 'UNDERLINE':
      return {
        selectedText: `${type} ${suffix}`,
        anchor: { start: 2, end: 10 },
      };
    case 'DRAWING':
      return {
        points: [
          { x: 0.1, y: 0.2, pressure: 0.4 },
          { x: 0.8, y: 0.7, pressure: 0.9 },
        ],
        color: '#e07a5f',
        lineWidth: 3,
      };
    case 'NOTE':
      return {
        text: `ملاحظة ${suffix}`,
        selectedText: 'عنوان',
        anchor: { start: 0, end: 5 },
      };
    default:
      throw new Error(`unsupported test annotation type: ${type}`);
  }
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
    if (store && typeof store.close === 'function') {
      await store.close();
    }
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
  'authenticated students can CRUD every annotation type without crossing ownership or content versions',
  { skip: !process.env.MONGODB_URI || !process.env.SESSION_SECRET },
  async () => {
    const marker = `phase13-1-${crypto.randomUUID()}`;
    const password = 'Phase13_1_Test_Password!2026';
    const emailA = `${marker}-a@example.test`;
    const emailB = `${marker}-b@example.test`;
    const usernameA = `${marker}-a`;
    const usernameB = `${marker}-b`;

    let server: import('node:http').Server | undefined;
    let application: any;
    let connectedByTest = false;
    let contentId = '';
    const studentIds: string[] = [];

    try {
      connectedByTest = !getConnectionStatus();
      await connectToMongoDB();
      assert.equal(getConnectionStatus(), true, 'integration test requires a live MongoDB connection');

      const passwordHash = await bcrypt.hash(password, 10);
      const [studentA, studentB, content] = await Promise.all([
        User.create({
          username: usernameA,
          email: emailA,
          password: passwordHash,
          fullName: 'Phase 13.1 Student A',
          role: 'student',
          isActive: true,
        }),
        User.create({
          username: usernameB,
          email: emailB,
          password: passwordHash,
          fullName: 'Phase 13.1 Student B',
          role: 'student',
          isActive: true,
        }),
        FoundationContent.create({
          program: 'qudrat',
          title: `Phase 13.1 annotation fixture ${marker}`,
          description: 'محتوى مؤقت لاختبار عزل annotations والجلسات.',
          videoUrl: 'https://example.test/phase-13-1',
          order: 0,
          published: true,
          publishedAt: new Date(),
          version: CONTENT_VERSION,
          sections: [
            {
              id: SECTION_ID,
              type: 'CONCEPT',
              title: 'قسم الاختبار',
              body: 'نص القسم المستخدم في اختبار annotation.',
            },
          ],
        }),
      ]);

      studentIds.push(String(studentA._id), String(studentB._id));
      contentId = String(content._id);

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

      const unauthorized = await unauthenticated.request(
        `/api/learning/content/${contentId}/annotations`,
      );
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
      const annotationPath = `/api/learning/content/${contentId}/annotations`;

      const createdIds: string[] = [];
      for (const type of ['HIGHLIGHT', 'UNDERLINE', 'DRAWING', 'NOTE']) {
        const { response, body } = await jsonRequest(studentAHttp, annotationPath, {
          method: 'POST',
          body: JSON.stringify({
            contentVersion: CONTENT_VERSION,
            sectionId: SECTION_ID,
            type,
            data: annotationData(type, marker),
          }),
        });
        assert.equal(response.status, 201);
        assert.equal(body.contentId, contentId);
        assert.equal(body.contentVersion, CONTENT_VERSION);
        assert.equal(body.sectionId, SECTION_ID);
        assert.equal(body.type, type);
        createdIds.push(body.id);
      }

      const firstRead = await jsonRequest(studentAHttp, annotationPath);
      assert.equal(firstRead.response.status, 200);
      assert.equal(firstRead.body.contentVersion, CONTENT_VERSION);
      assert.equal(firstRead.body.legacyCount, 0);
      assert.deepEqual(
        firstRead.body.annotations.map((annotation: { id: string }) => annotation.id),
        createdIds,
      );

      const otherStudentRead = await jsonRequest(studentBHttp, annotationPath);
      assert.equal(otherStudentRead.response.status, 200);
      assert.equal(otherStudentRead.body.annotations.length, 0);
      assert.equal(otherStudentRead.body.legacyCount, 0);

      const update = await jsonRequest(studentAHttp, `${annotationPath}/${createdIds[0]}`, {
        method: 'PATCH',
        body: JSON.stringify({
          contentVersion: CONTENT_VERSION,
          sectionId: SECTION_ID,
          data: annotationData('HIGHLIGHT', 'updated'),
        }),
      });
      assert.equal(update.response.status, 200);
      assert.equal(update.body.data.selectedText, 'HIGHLIGHT updated');

      const crossStudentUpdate = await jsonRequest(
        studentBHttp,
        `${annotationPath}/${createdIds[0]}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            contentVersion: CONTENT_VERSION,
            data: annotationData('HIGHLIGHT', 'student-b'),
          }),
        },
      );
      assert.equal(crossStudentUpdate.response.status, 404);
      assert.equal(crossStudentUpdate.body.code, 'ANNOTATION_NOT_FOUND');

      const crossStudentDelete = await studentBHttp.request(
        `${annotationPath}/${createdIds[0]}`,
        { method: 'DELETE' },
      );
      assert.equal(crossStudentDelete.status, 404);

      const invalidType = await jsonRequest(studentAHttp, annotationPath, {
        method: 'POST',
        body: JSON.stringify({
          contentVersion: CONTENT_VERSION,
          sectionId: SECTION_ID,
          type: 'COMMENT',
          data: { text: 'should fail' },
        }),
      });
      assert.equal(invalidType.response.status, 400);
      assert.equal(invalidType.body.code, 'INVALID_ANNOTATION_TYPE');

      const invalidDrawing = await jsonRequest(studentAHttp, annotationPath, {
        method: 'POST',
        body: JSON.stringify({
          contentVersion: CONTENT_VERSION,
          sectionId: SECTION_ID,
          type: 'DRAWING',
          data: { points: [{ x: 2, y: 0.2 }, { x: 0.8, y: 0.7 }] },
        }),
      });
      assert.equal(invalidDrawing.response.status, 400);
      assert.equal(invalidDrawing.body.code, 'INVALID_ANNOTATION_DATA');

      const staleCreate = await jsonRequest(studentAHttp, annotationPath, {
        method: 'POST',
        body: JSON.stringify({
          contentVersion: CONTENT_VERSION - 1,
          sectionId: SECTION_ID,
          type: 'NOTE',
          data: annotationData('NOTE', 'stale'),
        }),
      });
      assert.equal(staleCreate.response.status, 409);
      assert.equal(staleCreate.body.code, 'VERSION_MISMATCH');

      await FoundationContent.updateOne(
        { _id: contentId },
        { $set: { version: NEXT_CONTENT_VERSION } },
      );

      const nextVersionRead = await jsonRequest(studentAHttp, annotationPath);
      assert.equal(nextVersionRead.response.status, 200);
      assert.equal(nextVersionRead.body.contentVersion, NEXT_CONTENT_VERSION);
      assert.equal(nextVersionRead.body.annotations.length, 0);
      assert.equal(nextVersionRead.body.legacyCount, createdIds.length);

      const staleUpdate = await jsonRequest(
        studentAHttp,
        `${annotationPath}/${createdIds[0]}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            contentVersion: NEXT_CONTENT_VERSION,
            data: annotationData('HIGHLIGHT', 'stale-update'),
          }),
        },
      );
      assert.equal(staleUpdate.response.status, 409);
      assert.equal(staleUpdate.body.code, 'VERSION_MISMATCH');

      const staleDelete = await studentAHttp.request(
        `${annotationPath}/${createdIds[0]}`,
        { method: 'DELETE' },
      );
      assert.equal(staleDelete.status, 409);

      await FoundationContent.updateOne(
        { _id: contentId },
        { $set: { version: CONTENT_VERSION } },
      );

      for (const id of createdIds) {
        const deleted = await studentAHttp.request(`${annotationPath}/${id}`, {
          method: 'DELETE',
        });
        assert.equal(deleted.status, 204);
      }

      const finalRead = await jsonRequest(studentAHttp, annotationPath);
      assert.equal(finalRead.response.status, 200);
      assert.equal(finalRead.body.annotations.length, 0);
      assert.equal(finalRead.body.legacyCount, 0);
    } finally {
      if (server) await close(server);
      if (application) await closeSessionStore(application);
      if (contentId) {
        await LearningContentAnnotation.deleteMany({
          contentId: new mongoose.Types.ObjectId(contentId),
        });
        await FoundationContent.deleteOne({ _id: contentId });
      }
      if (studentIds.length) {
        await User.deleteMany({ _id: { $in: studentIds } });
      }
      if (connectedByTest && getConnectionStatus()) {
        await disconnectFromMongoDB();
      }
    }
  },
);