import assert from 'node:assert/strict';
import test from 'node:test';
import {
  QUDRAT_VERBAL_COMPUTERIZED_VIDEOS,
} from '../src/services/qudratVerbalBookFilesService.ts';
import {
  calculateVerbalVideoWatchedSeconds,
  getCreditedVerbalWatchRange,
  mergeVerbalVideoWatchRange,
} from '../src/services/verbalVideoProgressService.ts';
import { VerbalVideoProgressModel } from '../src/mongodb/verbalVideoProgressModel.ts';

test('the verbal progress catalog covers all 23 videos with unique IDs and trusted durations', () => {
  const ids = QUDRAT_VERBAL_COMPUTERIZED_VIDEOS.map((video) => video.id);
  assert.equal(ids.length, 23);
  assert.equal(new Set(ids).size, 23);
  assert.ok(QUDRAT_VERBAL_COMPUTERIZED_VIDEOS.every(
    (video) => Number.isInteger(video.durationSeconds) && video.durationSeconds > 0,
  ));
});

test('watch ranges merge overlaps so replaying one section cannot inflate completion', () => {
  const ranges = mergeVerbalVideoWatchRange(
    [
      { startSeconds: 0, endSeconds: 12 },
      { startSeconds: 25, endSeconds: 35 },
    ],
    8,
    28,
  );

  assert.deepEqual(ranges, [
    { startSeconds: 0, endSeconds: 35 },
  ]);
  assert.equal(calculateVerbalVideoWatchedSeconds(ranges, 100), 35);
});

test('small playback gaps remain separate and are not counted as watched', () => {
  const ranges = mergeVerbalVideoWatchRange(
    [{ startSeconds: 0, endSeconds: 10 }],
    11,
    20,
  );

  assert.deepEqual(ranges, [
    { startSeconds: 0, endSeconds: 10 },
    { startSeconds: 11, endSeconds: 20 },
  ]);
  assert.equal(calculateVerbalVideoWatchedSeconds(ranges, 100), 19);
});

test('only plausible playback advances count; paused time and large seeks do not', () => {
  assert.deepEqual(
    getCreditedVerbalWatchRange(20, 40, 10_000, true),
    { startSeconds: 20, endSeconds: 40 },
  );
  assert.equal(getCreditedVerbalWatchRange(20, 40, 10_000, false), undefined);
  assert.equal(getCreditedVerbalWatchRange(20, 70, 10_000, true), undefined);
  assert.equal(getCreditedVerbalWatchRange(20, 20, 10_000, true), undefined);
});

test('video progress is uniquely scoped to a student and catalog video', () => {
  const uniqueIndex = VerbalVideoProgressModel.schema.indexes().find(
    ([keys, options]) =>
      (keys as Record<string, number>).studentId === 1 &&
      (keys as Record<string, number>).videoId === 1 &&
      Boolean((options as { unique?: boolean }).unique),
  );
  assert.ok(uniqueIndex);
});
