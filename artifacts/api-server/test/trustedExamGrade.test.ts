import assert from 'node:assert/strict';
import test from 'node:test';
import { gradeTrustedExam, optionIndex } from '../src/services/trustedExamGrade.ts';

const question = (id: string, key = 0) => ({
  _id: id, options: ['أ', 'ب', 'ج', 'د'], correctOptionIndex: key, answerStatus: 'approved',
});
test('first option zero is answered; unanswered questions remain in the denominator', () => {
  assert.deepEqual(gradeTrustedExam([question('a'), question('b', 2), question('c')],
    [{ questionId: 'a', selectedOptionIndex: 0 }, { questionId: 'b', selectedOptionIndex: '1' }]),
  { score: 1, totalQuestions: 3, wrongAnswers: 1, skippedQuestions: 1, percentage: 33.33 });
});
test('all correct, all wrong and all skipped produce consistent counts', () => {
  assert.equal(gradeTrustedExam([question('a')], [{ questionId: 'a', selectedOptionIndex: '0' }]).percentage, 100);
  assert.equal(gradeTrustedExam([question('a')], [{ questionId: 'a', selectedOptionIndex: 3 }]).wrongAnswers, 1);
  for (const selected of [undefined, null, '', -1, '-1']) {
    assert.equal(optionIndex(selected), null);
    assert.equal(gradeTrustedExam([question('a')], [{ questionId: 'a', selectedOptionIndex: selected }]).skippedQuestions, 1);
  }
});
test('unknown, duplicate, malformed and out-of-range answers never inflate a score', () => {
  for (const answers of [
    [{ questionId: 'other', selectedOptionIndex: 0 }],
    [{ questionId: 'a', selectedOptionIndex: 0 }, { questionId: 'a', selectedOptionIndex: 0 }],
    [{ questionId: 'a', selectedOptionIndex: '0abc' }],
    [{ questionId: 'a', selectedOptionIndex: 4 }],
    [{ questionId: 'a', selectedOptionIndex: true }],
  ]) assert.throws(() => gradeTrustedExam([question('a')], answers));
});
test('unreviewed, invalid and ambiguous keys cannot be used for scored results', () => {
  for (const q of [
    { ...question('a'), answerStatus: 'review' }, question('a', 4),
    { ...question('a'), correctOptionIndex: null as any },
    { ...question('a'), options: ['أ', 'أ'] },
    { ...question('a'), options: ['أ', ' '] },
  ]) assert.throws(() => gradeTrustedExam([q], []));
  assert.throws(() => gradeTrustedExam([], []));
});
