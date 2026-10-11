import assert from 'node:assert/strict';
import test from 'node:test';
import { buildQuestionVideoClip, computerBankQuestionIdentity } from '../src/services/questionVideoClip.ts';

test('source identity binds question 34 to bank 6, never to displayed shuffled position', () => {
  assert.deepEqual(computerBankQuestionIdentity('quantitative-computer-bank-6-34'), { bankNumber: 6, questionNumber: 34 });
  assert.equal(computerBankQuestionIdentity('quantitative-computer-bank-51-34'), null);
  assert.equal(computerBankQuestionIdentity('quantitative-computer-bank-6-49'), null);
  assert.equal(computerBankQuestionIdentity('verbal-6-34'), null);
});
test('clips use explicit bounds, retain uncertainty and never split duration equally', () => {
  const source = { questionId: 'quantitative-computer-bank-6-34', videoTimestampSeconds: 1980,
    videoEndTimestampSeconds: 2100, videoTimingVerified: true };
  const url = '/foundation/quantitative/computer-banks/computer-bank-06.mp4';
  assert.deepEqual(buildQuestionVideoClip(source, url), {
    available: true, videoUrl: url, startSeconds: 1980, endSeconds: 2100,
    approximate: false, verified: true, bankNumber: 6, questionNumber: 34,
  });
  assert.equal(buildQuestionVideoClip({ questionId: source.questionId }, url).available, false);
  assert.equal(buildQuestionVideoClip({ ...source, videoEndTimestampSeconds: 1900 }, url).available, false);
  assert.equal(buildQuestionVideoClip(source, '').available, false);
  assert.equal(buildQuestionVideoClip(source, url.replace('06.mp4', '07.mp4')).available, false);
  assert.equal(buildQuestionVideoClip(source, 'javascript:alert(1)').available, false);
  const inferred = buildQuestionVideoClip({ ...source, videoEndTimestampInferred: true }, url);
  assert.equal(inferred.approximate, true);
  assert.equal(inferred.verified, false);
});
