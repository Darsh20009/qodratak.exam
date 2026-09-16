import assert from 'node:assert/strict';
import test from 'node:test';
import {
  classifyQuestion,
  summarizeMappings,
} from '../src/learning/contentMap.ts';

test('maps an existing verbal category without inventing deep skills', () => {
  const mapping = classifyQuestion(
    { id: 1, category: 'التناظر اللفظي' },
    'legacy_json',
  );

  assert.equal(mapping.status, 'needs_review');
  assert.equal(mapping.taxonomy.program, 'qudrat');
  assert.equal(mapping.taxonomy.subject, 'verbal');
  assert.equal(mapping.taxonomy.topic, 'التناظر اللفظي');
  assert.equal(mapping.taxonomy.skill, undefined);
  assert.ok(mapping.reviewReasons.includes('concept_not_present_in_source'));
});

test('maps an existing quantitative category at the safe evidence level', () => {
  const mapping = classifyQuestion(
    { id: 2, category: 'النسبة المئوية', difficulty: 'intermediate' },
    'legacy_json',
  );

  assert.equal(mapping.status, 'needs_review');
  assert.equal(mapping.taxonomy.program, 'qudrat');
  assert.equal(mapping.taxonomy.subject, 'quantitative');
  assert.equal(mapping.difficulty, 'intermediate');
});

test('keeps ambiguous source categories unmapped', () => {
  const mapping = classifyQuestion(
    { id: 3, category: 'أفكار متنوعة' },
    'legacy_json',
  );

  assert.equal(mapping.status, 'unmapped');
  assert.equal(mapping.taxonomy.program, undefined);
  assert.ok(mapping.reviewReasons.includes('unrecognized_qudrat_category'));
});

test('preserves existing Tahsili subjects without creating unsupported topics', () => {
  const mapping = classifyQuestion(
    {
      id: 4,
      category: 'الفيزياء',
      systemCategory: 'tahsili',
      difficulty: 'beginner',
    },
    'legacy_json',
  );

  assert.equal(mapping.status, 'needs_review');
  assert.equal(mapping.taxonomy.program, 'tahsili');
  assert.equal(mapping.taxonomy.subject, 'فيزياء');
  assert.equal(mapping.taxonomy.topic, undefined);
  assert.equal(mapping.difficulty, 'beginner');
});

test('summarizes mapped, review, and unmapped records', () => {
  const summary = summarizeMappings([
    classifyQuestion({ id: 1, category: 'التناظر اللفظي' }, 'legacy_json'),
    classifyQuestion({ id: 2, category: 'أفكار متنوعة' }, 'legacy_json'),
  ]);

  assert.equal(summary.total, 2);
  assert.equal(summary.byStatus.needs_review, 1);
  assert.equal(summary.byStatus.unmapped, 1);
  assert.equal(summary.byProgram.qudrat, 1);
});
