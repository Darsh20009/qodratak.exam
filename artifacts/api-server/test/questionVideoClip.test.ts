import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildQuestionVideoClip,
  computerBankQuestionIdentity,
  COMPUTER_BANK_VIDEO_LIBRARY_REFERENCES,
  equalPartitionClipBounds,
} from '../src/services/questionVideoClip.ts';

test('source identity binds question 34 to bank 6, never to displayed shuffled position', () => {
  assert.deepEqual(computerBankQuestionIdentity('quantitative-computer-bank-6-34'), { bankNumber: 6, questionNumber: 34 });
  assert.deepEqual(computerBankQuestionIdentity('quantitative-computer-bank-51-34'), { bankNumber: 51, questionNumber: 34 });
  assert.deepEqual(computerBankQuestionIdentity('quantitative-computer-bank-70-48'), { bankNumber: 70, questionNumber: 48 });
  assert.deepEqual(computerBankQuestionIdentity('quantitative-computer-bank-71-34'), { bankNumber: 71, questionNumber: 34 });
  assert.deepEqual(computerBankQuestionIdentity('quantitative-computer-bank-90-48'), { bankNumber: 90, questionNumber: 48 });
  assert.deepEqual(computerBankQuestionIdentity('quantitative-computer-bank-91-34'), { bankNumber: 91, questionNumber: 34 });
  assert.deepEqual(computerBankQuestionIdentity('quantitative-computer-bank-110-48'), { bankNumber: 110, questionNumber: 48 });
  assert.equal(computerBankQuestionIdentity('quantitative-computer-bank-111-34'), null);
  assert.equal(computerBankQuestionIdentity('quantitative-computer-bank-6-49'), null);
  assert.equal(computerBankQuestionIdentity('verbal-6-34'), null);
});
test('clips use stored bounds and retain timing uncertainty', () => {
  const source = { questionId: 'quantitative-computer-bank-6-34', videoTimestampSeconds: 1980,
    videoEndTimestampSeconds: 2100, videoTimingVerified: true };
  const url = '/foundation/quantitative/computer-banks/computer-bank-06.mp4';
  assert.deepEqual(buildQuestionVideoClip(source, url), {
    available: true, videoUrl: url, startSeconds: 1980, endSeconds: 2100,
    approximate: false, verified: true, bankNumber: 6, questionNumber: 34,
  });
  assert.equal(buildQuestionVideoClip({ questionId: source.questionId }, url).available, false);
  assert.deepEqual(
    buildQuestionVideoClip({ questionId: source.questionId }, url),
    {
      available: false,
      reason: 'timing_unavailable',
      videoUrl: url,
      bankNumber: 6,
      questionNumber: 34,
    },
  );
  assert.equal(buildQuestionVideoClip({ ...source, videoEndTimestampSeconds: 1900 }, url).available, false);
  assert.equal(buildQuestionVideoClip(source, '').available, false);
  assert.equal(buildQuestionVideoClip(source, url.replace('06.mp4', '07.mp4')).available, false);
  assert.equal(buildQuestionVideoClip(source, 'javascript:alert(1)').available, false);
  const inferred = buildQuestionVideoClip({ ...source, videoEndTimestampInferred: true }, url);
  assert.equal(inferred.approximate, true);
  assert.equal(inferred.verified, false);
});

test('new bank videos use stored question clips and leave unindexed banks as full-video fallbacks', () => {
  const bank91Url = '/foundation/quantitative/computer-banks/computer-bank-91.mp4';
  assert.deepEqual(buildQuestionVideoClip({
    questionId: 'quantitative-computer-bank-91-1',
    videoTimestampSeconds: 0,
    videoEndTimestampSeconds: 70,
    videoTimingMethod: 'visual_badge_detection_5s_samples',
  }, bank91Url), {
    available: true,
    videoUrl: bank91Url,
    startSeconds: 0,
    endSeconds: 70,
    approximate: false,
    verified: false,
    bankNumber: 91,
    questionNumber: 1,
  });

  const bank97Url = '/foundation/quantitative/computer-banks/computer-bank-97.mp4';
  assert.deepEqual(buildQuestionVideoClip({
    questionId: 'quantitative-computer-bank-97-1',
  }, bank97Url), {
    available: false,
    reason: 'video_unavailable',
    videoUrl: bank97Url,
    bankNumber: 97,
    questionNumber: 1,
  });
});

test('equal-duration timing creates a two-minute window around each of 48 question positions', () => {
  assert.deepEqual(equalPartitionClipBounds(48 * 60, 1), {
    startSeconds: 0,
    endSeconds: 90,
  });
  assert.deepEqual(equalPartitionClipBounds(48 * 60, 24), {
    startSeconds: 22.5 * 60,
    endSeconds: 24.5 * 60,
  });
  assert.deepEqual(equalPartitionClipBounds(48 * 60, 48), {
    startSeconds: 46.5 * 60,
    endSeconds: 48 * 60,
  });
  for (let questionNumber = 1; questionNumber <= 48; questionNumber += 1) {
    const bounds = equalPartitionClipBounds(1590.167, questionNumber);
    assert.ok(bounds.startSeconds >= 0);
    assert.ok(bounds.endSeconds <= 1590.167);
    assert.ok(bounds.endSeconds > bounds.startSeconds);
    assert.ok(Math.round((bounds.endSeconds - bounds.startSeconds) * 1000) <= 120_000);
  }
  assert.throws(() => equalPartitionClipBounds(100, 0), RangeError);
  assert.throws(() => equalPartitionClipBounds(Number.NaN, 1), RangeError);
});

test('new computerized banks resolve only to their matching streamed video', () => {
  const source = {
    questionId: 'quantitative-computer-bank-51-34',
    videoTimestampSeconds: 1980,
    videoEndTimestampSeconds: 2100,
    videoEndTimestampInferred: true,
  };
  const url = '/api/learning/computerized/quantitative/computer-bank-51.mp4';
  assert.deepEqual(buildQuestionVideoClip(source, url), {
    available: true,
    videoUrl: url,
    startSeconds: 1980,
    endSeconds: 2100,
    approximate: true,
    verified: false,
    bankNumber: 51,
    questionNumber: 34,
  });
  assert.equal(
    buildQuestionVideoClip(
      { ...source, questionId: 'quantitative-computer-bank-70-1' },
      '/api/learning/computerized/quantitative/computer-bank-69.mp4',
    ).reason,
    'video_unavailable',
  );
});

test('available new computerized bank videos use their own duration and 48-part two-minute approximation', () => {
  const durations: Record<number, number> = {
    71: 3686.92,
    79: 2053.855011,
    80: 2199.607007,
    81: 2169.513991,
    82: 1948.645011,
    83: 2697.885215,
    84: 2167.447211,
  };
  for (const [bankText, duration] of Object.entries(durations)) {
    const bankNumber = Number(bankText);
    const questionNumber = 34;
    const url = `/api/learning/computerized/quantitative/computer-bank-${bankNumber}.mp4`;
    const actual = buildQuestionVideoClip({
      questionId: `quantitative-computer-bank-${bankNumber}-${questionNumber}`,
    }, url);
    const bounds = equalPartitionClipBounds(duration, questionNumber);
    assert.deepEqual(actual, {
      available: true,
      videoUrl: url,
      ...bounds,
      approximate: true,
      verified: false,
      bankNumber,
      questionNumber,
    });
  }
  assert.deepEqual(COMPUTER_BANK_VIDEO_LIBRARY_REFERENCES, { 72: 2, 78: 8, 85: 17, 90: 22 });
  for (const [bankNumber, videoNumber] of Object.entries(COMPUTER_BANK_VIDEO_LIBRARY_REFERENCES)) {
    const numericBank = Number(bankNumber);
    const url = `/api/learning/computerized/quantitative/computer-bank-${numericBank}.mp4`;
    assert.deepEqual(buildQuestionVideoClip({
      questionId: `quantitative-computer-bank-${numericBank}-34`,
    }, url), {
      available: false,
      reason: 'timing_unavailable',
      videoUrl: url,
      timingMode: 'equal_partition_48',
      questionCount: 48,
      clipWindowSeconds: 120,
      approximate: true,
      verified: false,
      bankNumber: numericBank,
      questionNumber: 34,
    });
    assert.ok(videoNumber > 0);
  }
  assert.deepEqual(buildQuestionVideoClip({
    questionId: 'quantitative-computer-bank-72-34',
    videoTimestampSeconds: 100,
    videoEndTimestampSeconds: 220,
  }, '/api/learning/computerized/quantitative/computer-bank-72.mp4'), {
    available: true,
    videoUrl: '/api/learning/computerized/quantitative/computer-bank-72.mp4',
    startSeconds: 100,
    endSeconds: 220,
    approximate: false,
    verified: false,
    bankNumber: 72,
    questionNumber: 34,
  });
});
