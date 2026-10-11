import assert from 'node:assert/strict';
import test from 'node:test';
import { completeExamTiming, orderedTimedQuestions, resetExamTiming } from '../../qodratak/src/lib/examTiming.ts';

test('full roster includes all skips in exam order without inventing timing for unseen questions', () => {
  const values = new Map<string, string>();
  (globalThis as any).sessionStorage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  };
  resetExamTiming();
  const row = (id: string, selected: number | null) => ({
    id, text: `Question ${id}`, options: ['أ', 'ب', 'ج', 'د'], selectedOptionIndex: selected,
  });
  values.set('qodratak:active-exam-timing', JSON.stringify({
    runId: 'roster-test', title: 'verbal', finished: false,
    questions: { q1: { ...row('q1', 0), seconds: 20 }, q2: { ...row('q2', 1), seconds: 30 },
      q13: { ...row('q13', null), seconds: 4 } },
  }));
  try {
    const roster = Array.from({ length: 13 }, (_, i) => row(`q${i + 1}`, i < 2 ? i : null));
    const snapshot = completeExamTiming(roster)!;
    const questions = orderedTimedQuestions(snapshot);
    assert.equal(questions.length, 13);
    assert.deepEqual(questions.map((q) => q.id), roster.map((q) => q.id));
    assert.equal(questions.filter((q) => q.selectedOptionIndex === null).length, 11);
    assert.equal(questions.filter((q) => q.seconds > 0).length, 3);
    assert.equal(questions[2].seconds, 0);
    assert.equal(questions[12].seconds, 4);
    assert.equal(completeExamTiming()!.questions.q1.seconds, 20);
  } finally {
    resetExamTiming();
    delete (globalThis as any).sessionStorage;
  }
});
