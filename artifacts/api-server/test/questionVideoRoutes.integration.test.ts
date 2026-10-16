import assert from 'node:assert/strict';
import test from 'node:test';
import express from 'express';
import mongoose from 'mongoose';
import { Question } from '../src/mongodb/models';
import { isR2Configured } from '../src/services/qudratVerbalBookFilesService';
import { registerQuestionVideoRoutes } from '../src/routes/questionVideoRoutes';

test('read-only video route resolves both stored and legacy IDs to the verified bank 6 question 34 clip',
  { skip: !process.env.MONGODB_URI }, async () => {
    await mongoose.connect(process.env.MONGODB_URI!);
    const app = express();
    // Isolated route-contract test. The running app's authentication is checked
    // separately (anonymous requests return 401); no users or sessions are created.
    registerQuestionVideoRoutes(app, [], async () => true);
    const server = app.listen(0);
    try {
      const address = server.address();
      assert.ok(address && typeof address !== 'string');
      const base = `http://127.0.0.1:${address.port}/api/student/question-video`;
      const question = await Question.findOne({ 'source.questionId': 'quantitative-computer-bank-6-34' })
        .select('_id questionId').lean();
      assert.ok(question);
      for (const id of [String(question._id), String(question.questionId)]) {
        const response = await fetch(`${base}/${id}`);
        assert.equal(response.status, 200);
        const clip = await response.json();
        assert.equal(clip.available, true);
        assert.equal(clip.bankNumber, 6);
        assert.equal(clip.questionNumber, 34);
        assert.equal(clip.startSeconds, 1935);
        assert.equal(clip.endSeconds, 2010);
        assert.equal(clip.verified, true);
        assert.equal(clip.approximate, false);
        assert.ok(clip.videoUrl.endsWith('/computer-bank-06.mp4'));
      }
      const bank83Question = await Question.findOne({
        'source.questionId': 'quantitative-computer-bank-83-34',
      }).select('_id questionId').lean();
      assert.ok(bank83Question);
      const bank83Response = await fetch(`${base}/${String(bank83Question._id)}`);
      assert.equal(bank83Response.status, 200);
      const bank83Clip = await bank83Response.json();
      assert.equal(bank83Clip.available, true, JSON.stringify(bank83Clip));
      assert.equal(bank83Clip.bankNumber, 83);
      assert.equal(bank83Clip.questionNumber, 34);
      assert.equal(bank83Clip.approximate, true);
      assert.equal(bank83Clip.verified, false);
      assert.ok(bank83Clip.videoUrl.endsWith('/computer-bank-83.mp4'));
      assert.equal((await fetch(`${base}/not-an-id`)).status, 400);
    } finally {
      server.closeAllConnections();
      await new Promise<void>((resolve) => server.close(() => resolve()));
      await mongoose.disconnect();
    }
  });

test('computer-bank 83 and 84 streams honor byte ranges from persistent storage', {
  skip: !isR2Configured(),
}, async () => {
  const app = express();
  registerQuestionVideoRoutes(app, [], async () => true);
  const server = app.listen(0);
  try {
    const address = server.address();
    assert.ok(address && typeof address !== 'string');
    for (const [bank, size] of [[83, 197642780], [84, 163060190]] as const) {
      const response = await fetch(
        `http://127.0.0.1:${address.port}/api/learning/computerized/quantitative/computer-bank-${bank}.mp4`,
        { headers: { Range: 'bytes=0-1023' } },
      );
      assert.equal(response.status, 206);
      assert.equal(response.headers.get('content-type'), 'video/mp4');
      assert.equal(response.headers.get('content-range'), `bytes 0-1023/${size}`);
      assert.equal((await response.arrayBuffer()).byteLength, 1024);
    }
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});
