import assert from 'node:assert/strict';
import test from 'node:test';
import {
  isApprovedLearningContentScope,
  learningContentSections,
  publicLearningContentDocument,
  type LearningContentDocument,
} from '../src/services/learningContentService.ts';

function content(overrides: Record<string, unknown> = {}) {
  return {
    _id: '507f1f77bcf86cd799439011',
    program: 'qudrat' as const,
    title: 'درس تجريبي',
    description: 'وصف الدرس الحالي فقط.',
    videoUrl: '',
    order: 1,
    published: true,
    version: 2,
    createdAt: new Date('2026-09-18T10:00:00.000Z'),
    updatedAt: new Date('2026-09-18T10:00:00.000Z'),
    ...overrides,
  } as any;
}

test('legacy content gets one transparent INTRO section without invented teaching detail', () => {
  assert.deepEqual(learningContentSections(content()), [{
    id: 'overview',
    type: 'INTRO',
    title: 'نظرة عامة',
    body: 'وصف الدرس الحالي فقط.',
  }]);
});

test('existing sections remain independently addressable', () => {
  const sections = [{
    id: 'rule-1',
    type: 'RULE',
    title: 'قاعدة',
    body: 'المحتوى الموجود',
  }];
  assert.deepEqual(learningContentSections(content({ sections })), sections);
});

test('approved program scope is available without forcing an unprovided taxonomy mapping', () => {
  assert.equal(isApprovedLearningContentScope(content()), true);
  assert.equal(isApprovedLearningContentScope(content({
    subjectId: 'subject.qudrat.verbal',
  })), true);
});

test('unapproved taxonomy makes the content unavailable instead of falling back', () => {
  assert.equal(isApprovedLearningContentScope(content({
    subjectId: 'subject.qudrat.verbal',
    taxonomyNodeId: 'topic.qudrat.verbal.unreviewed',
  })), false);
  assert.equal(isApprovedLearningContentScope(content({
    subjectId: 'subject.tahsili.math',
  })), false);
});

test('public content contract contains no answer key, mastery, or error internals', () => {
  const document = publicLearningContentDocument(content({
    quiz: {
      questionIds: ['507f1f77bcf86cd799439012'],
      passingScore: 60,
    },
    sections: [{
      id: 'example-1',
      type: 'EXAMPLE',
      title: 'مثال',
      problem: 'مسألة',
      thinking: 'تفكير',
      solution: 'حل',
      why: 'السبب',
    }],
  })) as LearningContentDocument & Record<string, unknown>;
  assert.equal(document.id, '507f1f77bcf86cd799439011');
  assert.equal(document.version, 2);
  assert.equal((document as any).correctOptionIndex, undefined);
  assert.equal((document as any).mastery, undefined);
  assert.equal((document as any).errorEvidence, undefined);
  assert.equal((document as any).quiz, undefined);
});

test('public content exposes only published status and an additive version', () => {
  const document = publicLearningContentDocument(content({
    publishedAt: new Date('2026-09-19T10:00:00.000Z'),
  }));
  assert.equal(document.status, 'published');
  assert.equal(document.version, 2);
  assert.equal(document.publishedAt?.toISOString(), '2026-09-19T10:00:00.000Z');
});

test('content contract distinguishes reading content from practice availability', () => {
  const document = publicLearningContentDocument(content());
  assert.equal(typeof document.hasPractice, 'boolean');
  assert.equal(document.sections[0].type, 'INTRO');
  assert.equal(document.sections[0].id, 'overview');
});