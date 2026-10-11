import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { quantitativeVideoQuestion } from '../src/lib/questionVideoIdentity';

test('mixed exams select only quantitative questions, including Arabic category labels', () => {
  assert.equal(quantitativeVideoQuestion({ id: 500101, category: 'verbal' }), null);
  assert.equal(quantitativeVideoQuestion({ id: 500101, category: 'لفظي' }, true), null);
  assert.equal(quantitativeVideoQuestion({ id: 500634, category: 'كمي' })?.id, '500634');
  assert.equal(quantitativeVideoQuestion({ questionId: 500634, category: ' Quantitative ' })?.id, '500634');
});

test('source IDs survive shuffled display positions and wrapper records', () => {
  const original = '69406df1bd446b34edf4f940';
  assert.equal(quantitativeVideoQuestion({
    id: '3:8', sourceQuestionId: original, category: 'quantitative',
  })?.id, original);
  assert.equal(quantitativeVideoQuestion({
    questionNumber: 2, question: { _id: original, id: 8, category: 'quantitative' },
  })?.id, original);
  assert.equal(quantitativeVideoQuestion({
    _id: original, questionId: 500634, category: 'quantitative',
  })?.id, original);
});

test('missing identities never fall back to question position, text, or bank number', () => {
  assert.equal(quantitativeVideoQuestion({
    id: 'section:34', questionNumber: 34, bankNumber: 6, category: 'quantitative',
  })?.id, null);
  assert.equal(quantitativeVideoQuestion({
    text: 'سؤال', category: 'quantitative',
  })?.id, null);
  assert.equal(quantitativeVideoQuestion(null), null);
  assert.equal(quantitativeVideoQuestion({ id: -1 }, true)?.id, null);
  assert.equal(quantitativeVideoQuestion({ id: Number.POSITIVE_INFINITY }, true)?.id, null);
});

test('known quantitative-only tests support legacy subject labels and source taxonomy', () => {
  assert.equal(quantitativeVideoQuestion({ id: 500634, category: 'الهندسة' }, true)?.id, '500634');
  assert.equal(quantitativeVideoQuestion({
    id: 500634, source: { questionId: 'quantitative-computer-bank-6-34' },
  })?.id, '500634');
  assert.equal(quantitativeVideoQuestion({ id: 500634, category: 'الهندسة' }), null);
});
