import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildControlledSampleMappings,
  CONTROLLED_SAMPLE_QUESTIONS,
  CONTROLLED_TAXONOMY_NODES,
} from '../src/learning/taxonomyRegistry.ts';
import { classifyQuestion } from '../src/learning/contentMap.ts';

test('defines one stable controlled registry slice without duplicate codes', () => {
  const codes = CONTROLLED_TAXONOMY_NODES.map((node) => node.code);

  assert.equal(new Set(codes).size, codes.length);
  assert.equal(CONTROLLED_TAXONOMY_NODES.length, 11);
  assert.equal(CONTROLLED_TAXONOMY_NODES.filter((node) => node.status === 'APPROVED').length, 9);
  assert.equal(CONTROLLED_TAXONOMY_NODES.filter((node) => node.status === 'REVIEW').length, 2);
  assert.ok(CONTROLLED_TAXONOMY_NODES.every((node) => node.code && node.name && node.nameAr && node.source));
});

test('samples all six required content paths and keeps every mapping in review', () => {
  const sample = buildControlledSampleMappings();
  const subjects = new Set(sample.map((mapping) => mapping.taxonomy.subject));

  assert.equal(CONTROLLED_SAMPLE_QUESTIONS.length, 6);
  assert.equal(sample.length, 6);
  assert.deepEqual(
    [...subjects].sort(),
    [
      'subject.qudrat.quantitative',
      'subject.qudrat.verbal',
      'subject.tahsili.biology',
      'subject.tahsili.chemistry',
      'subject.tahsili.math',
      'subject.tahsili.physics',
    ].sort(),
  );
  assert.ok(sample.every((mapping) => mapping.reviewStatus === 'REVIEW'));
  assert.ok(sample.every((mapping) => mapping.mappingStatus === 'needs_review'));
});

test('keeps source namespaces in question keys so duplicate source ids do not collide', () => {
  const verbal = classifyQuestion(
    { id: 1, sourceNamespace: 'qudrat-verbal', category: 'استيعاب المقروء' },
    'legacy_json',
  );
  const quantitative = classifyQuestion(
    { id: 1, sourceNamespace: 'qudrat-quantitative', category: 'الهندسة' },
    'legacy_json',
  );

  assert.notEqual(verbal.sourceKey, quantitative.sourceKey);
  assert.equal(verbal.sourceKey, 'legacy_json:qudrat-verbal:1');
  assert.equal(quantitative.sourceKey, 'legacy_json:qudrat-quantitative:1');
});

test('does not create deep taxonomy nodes from an explicit subject alone', () => {
  const mapping = buildControlledSampleMappings().find((item) => item.sampleId === 'tahsili-physics-1');

  assert.ok(mapping);
  assert.equal(mapping.taxonomy.skill, undefined);
  assert.equal(mapping.taxonomy.subSkill, undefined);
  assert.equal(mapping.taxonomy.concept, undefined);
  assert.ok(mapping.reviewReasons.includes('skill_not_present_in_source'));
  assert.ok(mapping.reviewReasons.includes('no_prerequisite_evidence'));
});