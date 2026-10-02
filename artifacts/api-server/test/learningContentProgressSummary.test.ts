import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import test from 'node:test';
import { buildLearningContentProgressSummary } from '../src/services/learningContentService.ts';

test('learning content summary counts completed and practice-completed lessons', () => {
  const firstId = new mongoose.Types.ObjectId();
  const secondId = new mongoose.Types.ObjectId();
  const thirdId = new mongoose.Types.ObjectId();
  const unrelatedId = new mongoose.Types.ObjectId();

  const summary = buildLearningContentProgressSummary(
    [
      { _id: firstId, order: 1 },
      { _id: secondId, order: 2 },
      { _id: thirdId, order: 3 },
    ],
    [
      { contentId: firstId, progress: 100, state: 'COMPLETED', completedAt: new Date('2026-09-28T10:00:00Z') },
      { contentId: secondId, progress: 100, state: 'PRACTICE_COMPLETED', completedAt: new Date('2026-09-28T10:05:00Z') },
      { contentId: unrelatedId, progress: 100, state: 'COMPLETED', completedAt: new Date('2026-09-28T10:10:00Z') },
    ],
  );

  assert.equal(summary.total, 3);
  assert.equal(summary.completed, 2);
  assert.equal(summary.completionPercent, 67);
  assert.deepEqual(summary.completedContentIds, [String(firstId), String(secondId)]);
  assert.deepEqual(summary.items.map((item) => item.progress), [100, 100, 0]);
  assert.equal(summary.items[2].state, 'NOT_STARTED');
});

test('empty lesson sets report zero completion without treating empty as complete', () => {
  const summary = buildLearningContentProgressSummary([], []);

  assert.equal(summary.total, 0);
  assert.equal(summary.completed, 0);
  assert.equal(summary.completionPercent, 0);
  assert.deepEqual(summary.completedContentIds, []);
  assert.deepEqual(summary.items, []);
});