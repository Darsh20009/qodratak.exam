import assert from 'node:assert/strict';
import { once } from 'node:events';
import test from 'node:test';
import express from 'express';
import { createPushSubscriptionRouter } from '../src/pushSubscriptionRoutes.ts';

const USER_ID = '507f1f77bcf86cd799439011';

function createFakeModel() {
  const calls: Array<{ method: string; args: unknown[] }> = [];
  return {
    calls,
    model: {
      async findOneAndUpdate(...args: unknown[]) {
        calls.push({ method: 'findOneAndUpdate', args });
      },
      async deleteOne(...args: unknown[]) {
        calls.push({ method: 'deleteOne', args });
      },
      async deleteMany(...args: unknown[]) {
        calls.push({ method: 'deleteMany', args });
      },
    },
  };
}

async function withServer(
  authenticated: boolean,
  run: (baseUrl: string, calls: Array<{ method: string; args: unknown[] }>) => Promise<void>,
) {
  const app = express();
  app.use(express.json());
  if (authenticated) {
    app.use((req, _res, next) => {
      (req as any).session = {
        userId: USER_ID,
        userRole: 'student',
        userEmail: 'student@example.test',
      };
      next();
    });
  }
  const fake = createFakeModel();
  app.use('/api/push', createPushSubscriptionRouter(fake.model as any));
  const server = app.listen(0);
  await once(server, 'listening');
  const address = server.address();
  assert(address && typeof address === 'object');
  try {
    await run(`http://127.0.0.1:${address.port}`, fake.calls);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
  }
}

test('requires authentication for active push subscription writes', async () => {
  await withServer(false, async (baseUrl, calls) => {
    const response = await fetch(`${baseUrl}/api/push/subscribe`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        endpoint: 'https://push.example/subscription',
        keys: { p256dh: 'public-key', auth: 'auth-key' },
      }),
    });
    assert.equal(response.status, 401);
    assert.equal(calls.length, 0);
  });
});

test('rejects MongoDB operators before active push route model calls', async () => {
  await withServer(true, async (baseUrl, calls) => {
    for (const body of [
      { endpoint: { $ne: null }, keys: { p256dh: 'key', auth: 'auth' } },
      { endpoint: 'https://push.example/subscription', keys: { p256dh: { $gt: '' }, auth: 'auth' } },
      { endpoint: { nested: { $ne: null } } },
    ]) {
      const subscribe = await fetch(`${baseUrl}/api/push/subscribe`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      assert.equal(subscribe.status, 400);
    }
    for (const endpoint of [
      { $ne: null },
      { $gt: '' },
      { nested: { $ne: null } },
    ]) {
      const unsubscribe = await fetch(`${baseUrl}/api/push/unsubscribe`, {
        method: 'DELETE',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ endpoint }),
      });
      assert.equal(unsubscribe.status, 400);
    }
    assert.equal(calls.length, 0);
  });
});

test('scopes valid subscribe and unsubscribe filters to the session user', async () => {
  await withServer(true, async (baseUrl, calls) => {
    const body = {
      endpoint: 'https://push.example/subscription',
      keys: { p256dh: 'public-key', auth: 'auth-key' },
    };
    const subscribe = await fetch(`${baseUrl}/api/push/subscribe`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    assert.equal(subscribe.status, 200);

    const unsubscribe = await fetch(`${baseUrl}/api/push/unsubscribe`, {
      method: 'DELETE',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ endpoint: body.endpoint }),
    });
    assert.equal(unsubscribe.status, 200);
    assert.deepEqual(calls[0], {
      method: 'findOneAndUpdate',
      args: [
        { endpoint: body.endpoint, userId: USER_ID },
        { userId: USER_ID, endpoint: body.endpoint, keys: body.keys },
        { upsert: true, new: true },
      ],
    });
    assert.deepEqual(calls[1], {
      method: 'deleteOne',
      args: [{ endpoint: body.endpoint, userId: USER_ID }],
    });
  });
});