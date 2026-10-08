import assert from 'node:assert/strict';
import test from 'node:test';
import {
  FOUNDATION_PLACEMENT_QUESTIONS,
  getFoundationPlacementQuestions,
  scoreFoundationPlacementAssessment,
  toPublicFoundationPlacementQuestion,
} from '../src/services/foundationPlacementAssessment.ts';

function correctAnswers(program: 'qudrat' | 'tahsili') {
  return new Map(
    getFoundationPlacementQuestions(program).map((item) => [item.id, item.correctOptionIndex]),
  );
}

test('placement banks cover each supported area with validated answer indexes and difficulty levels', () => {
  for (const [program, expectedCount, expectedAreas] of [
    ['qudrat', 18, ['verbal', 'quantitative']],
    ['tahsili', 32, ['math', 'physics', 'chemistry', 'biology']],
  ] as const) {
    const items = getFoundationPlacementQuestions(program);
    assert.equal(items.length, expectedCount);
    assert.deepEqual([...new Set(items.map((item) => item.areaKey))].sort(), [...expectedAreas].sort());

    for (const areaKey of expectedAreas) {
      const areaItems = items.filter((item) => item.areaKey === areaKey);
      assert.ok(areaItems.length >= 8);
      assert.deepEqual(
        [...new Set(areaItems.map((item) => item.difficulty))].sort(),
        ['advanced', 'beginner', 'intermediate'],
      );
    }
  }

  assert.equal(new Set(FOUNDATION_PLACEMENT_QUESTIONS.map((item) => item.id)).size, FOUNDATION_PLACEMENT_QUESTIONS.length);
  for (const item of FOUNDATION_PLACEMENT_QUESTIONS) {
    assert.ok(item.options.length >= 2);
    assert.ok(item.correctOptionIndex >= 0 && item.correctOptionIndex < item.options.length);
    assert.ok(!('correctOptionIndex' in toPublicFoundationPlacementQuestion(item)));
  }
});

test('a single wrong response cannot label a Qudrat area as the student’s focus', () => {
  const items = getFoundationPlacementQuestions('qudrat');
  const answers = correctAnswers('qudrat');
  const oneQuestion = items.find((item) => item.areaKey === 'verbal')!;
  answers.set(oneQuestion.id, (oneQuestion.correctOptionIndex + 1) % oneQuestion.options.length);

  const result = scoreFoundationPlacementAssessment('qudrat', items, answers);

  assert.equal(result.confidence.level, 'MEDIUM');
  assert.equal(result.focusArea, null);
  assert.equal(result.recommendation.startingLevel, 'program_overview');
});

test('a repeated pattern across several Qudrat questions can guide a foundation start', () => {
  const items = getFoundationPlacementQuestions('qudrat');
  const answers = correctAnswers('qudrat');
  const verbalItems = items.filter((item) => item.areaKey === 'verbal');
  for (const item of verbalItems.slice(0, 5)) {
    answers.set(item.id, (item.correctOptionIndex + 1) % item.options.length);
  }

  const result = scoreFoundationPlacementAssessment('qudrat', items, answers);

  assert.equal(result.focusArea?.key, 'verbal');
  assert.equal(result.recommendation.startingLevel, 'foundation');
  assert.equal(result.recommendation.href, '/foundation?program=qudrat&subject=verbal');
});

test('Tahsili is scored separately by subject and does not create a subject focus from one miss', () => {
  const items = getFoundationPlacementQuestions('tahsili');
  const answers = correctAnswers('tahsili');
  const onePhysicsQuestion = items.find((item) => item.areaKey === 'physics')!;
  answers.set(onePhysicsQuestion.id, (onePhysicsQuestion.correctOptionIndex + 1) % onePhysicsQuestion.options.length);

  const result = scoreFoundationPlacementAssessment('tahsili', items, answers);

  assert.equal(result.totalQuestions, 32);
  assert.equal(result.areas.length, 4);
  assert.equal(result.confidence.level, 'MEDIUM');
  assert.equal(result.focusArea, null);
  assert.equal(result.recommendation.href, '/foundation?program=tahsili');
});

test('incomplete answers lower confidence; multiple Tahsili errors produce a subject-level path', () => {
  const items = getFoundationPlacementQuestions('tahsili');
  const answers = correctAnswers('tahsili');
  const physicsItems = items.filter((item) => item.areaKey === 'physics');
  for (const item of physicsItems.slice(0, 3)) {
    answers.set(item.id, (item.correctOptionIndex + 1) % item.options.length);
  }
  answers.delete(items[0].id);

  const incomplete = scoreFoundationPlacementAssessment('tahsili', items, answers);
  assert.equal(incomplete.confidence.level, 'LOW');

  answers.set(items[0].id, items[0].correctOptionIndex);
  const complete = scoreFoundationPlacementAssessment('tahsili', items, answers);
  assert.equal(complete.confidence.level, 'MEDIUM');
  assert.equal(complete.focusArea?.key, 'physics');
  assert.equal(complete.recommendation.startingLevel, 'practice');
  assert.match(complete.recommendation.href, /^\/tahsilik\/tests\/subject\?subject=/);
});
