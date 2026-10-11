import assert from 'node:assert/strict';
import test from 'node:test';
import { reviewExamBooking } from '../src/services/aiExamReview.ts';

const row = (id: string, selected: string | null, key = '0', category = 'verbal') => ({
  questionId: id, studentAnswer: selected, correctAnswer: key,
  isCorrect: true, isExperimental: true, isBookmarked: false, category,
});
test('scheduled verbal-only review is deterministic, gives no fake experimental credits and scores out of 100', async () => {
  const result = await reviewExamBooking({ sectionResults: [{
    sectionIndex: 0, questions: [row('1', '0'), row('2', '1'), row('3', null)],
  }] } as any);
  assert.equal(result.correctedCorrectAnswers, 1);
  assert.equal(result.correctedWrongAnswers, 1);
  assert.equal(result.correctedSkippedAnswers, 1);
  assert.equal(result.correctedTotalScoreOutOf100, 33);
  assert.ok(result.correctedSectionResults[0].questions.every((q) => !q.isExperimental));
  const allCorrect = await reviewExamBooking({ sectionResults: [{
    sectionIndex: 0, questions: [row('1', '0')],
  }] } as any);
  assert.equal(allCorrect.correctedTotalScoreOutOf100, 100);
});
test('mixed subjects retain equal subject weighting and bad keys require review', async () => {
  const result = await reviewExamBooking({ sectionResults: [{
    sectionIndex: 0, questions: [row('1', '0'), row('2', '1', '0', 'quantitative')],
  }] } as any);
  assert.equal(result.correctedTotalScoreOutOf100, 50);
  await assert.rejects(reviewExamBooking({ sectionResults: [{
    sectionIndex: 0, questions: [row('1', '0', 'bad')],
  }] } as any));
});
