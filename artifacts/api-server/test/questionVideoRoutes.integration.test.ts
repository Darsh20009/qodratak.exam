import assert from 'node:assert/strict';
import test from 'node:test';
import express from 'express';
import mongoose from 'mongoose';
import { Question } from '../src/mongodb/models';
import { registerQuestionVideoRoutes } from '../src/routes/questionVideoRoutes';

test('read-only video route resolves both stored and legacy IDs to the verified bank 6 question 34 clip',
  { skip: !process.env.MONGODB_URI }, async () => {
    await mongoose.connect(process.env.MONGODB_URI!);
    const app = express();
    // Isolated route-contract test. The running app's authentication is checked
    // separately (anonymous requests return 401); no users or sessions are created.
    registerQuestionVideoRoutes(app, []);
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
      assert.equal((await fetch(`${base}/not-an-id`)).status, 400);
    } finally {
      server.closeAllConnections();
      await new Promise<void>((resolve) => server.close(() => resolve()));
      await mongoose.disconnect();
    }
  });
