import assert from 'node:assert/strict';
import { once } from 'node:events';
import test from 'node:test';
import express from 'express';
import mongoose from 'mongoose';
import healthRouter from '../src/routes/health.ts';
import {
  connectToMongoDB,
  getConnectionStatus,
} from '../src/mongodb/connection.ts';

type ReadyStateConnection = {
  readyState: number;
};

async function registerConnectionListenersWithoutMongoDB(): Promise<void> {
  const originalMongoUri = process.env.MONGODB_URI;
  const originalNodeEnv = process.env.NODE_ENV;

  delete process.env.MONGODB_URI;
  process.env.NODE_ENV = 'test';
  try {
    assert.equal(await connectToMongoDB(), false);
  } finally {
    if (originalMongoUri === undefined) {
      delete process.env.MONGODB_URI;
    } else {
      process.env.MONGODB_URI = originalMongoUri;
    }

    if (originalNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = originalNodeEnv;
    }
  }
}

function setReadyState(readyState: number): void {
  (mongoose.connection as unknown as ReadyStateConnection).readyState = readyState;
}

async function withHealthServer(run: (baseUrl: string) => Promise<void>): Promise<void> {
  const app = express();
  app.use('/api', healthRouter);
  const server = app.listen(0);
  await once(server, 'listening');
  const address = server.address();
  assert(address && typeof address === 'object');

  try {
    await run(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
  }
}

test('reports healthy and unhealthy readiness responses with safe body fields', async () => {
  await registerConnectionListenersWithoutMongoDB();

  setReadyState(1);
  mongoose.connection.emit('connected');
  await withHealthServer(async (baseUrl) => {
    const healthyResponse = await fetch(`${baseUrl}/api/healthz`);
    assert.equal(healthyResponse.status, 200);
    assert.equal(healthyResponse.headers.get('cache-control'), 'no-store');
    assert.deepEqual(await healthyResponse.json(), {
      status: 'ok',
      mongodb: 'connected',
    });
  });

  setReadyState(0);
  mongoose.connection.emit('disconnected');
  await withHealthServer(async (baseUrl) => {
    const unhealthyResponse = await fetch(`${baseUrl}/api/healthz`);
    assert.equal(unhealthyResponse.status, 503);
    assert.equal(unhealthyResponse.headers.get('cache-control'), 'no-store');
    assert.deepEqual(await unhealthyResponse.json(), {
      status: 'unhealthy',
      mongodb: 'disconnected',
    });
  });
});

test('tracks connected, disconnected, and reconnected MongoDB transitions', async () => {
  await registerConnectionListenersWithoutMongoDB();

  await withHealthServer(async (baseUrl) => {
    setReadyState(1);
    mongoose.connection.emit('connected');
    assert.equal(getConnectionStatus(), true);
    assert.equal((await fetch(`${baseUrl}/api/healthz`)).status, 200);

    setReadyState(0);
    mongoose.connection.emit('disconnected');
    assert.equal(getConnectionStatus(), false);
    assert.equal((await fetch(`${baseUrl}/api/healthz`)).status, 503);

    setReadyState(1);
    mongoose.connection.emit('reconnected');
    assert.equal(getConnectionStatus(), true);
    assert.equal((await fetch(`${baseUrl}/api/healthz`)).status, 200);
  });
});