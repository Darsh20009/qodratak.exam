import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { LearningContentAnnotation } from '../src/mongodb/learningContentModels.ts';
import {
  LearningContentAnnotationError,
  learningContentAnnotationLimits,
  normalizeLearningContentAnnotationData,
  normalizeLearningContentAnnotationType,
} from '../src/services/learningContentAnnotationService.ts';

const drawing = {
  points: [{ x: 0.1, y: 0.2, pressure: 0.4 }, { x: 0.8, y: 0.7, pressure: 0.9 }],
  color: '#e07a5f',
  lineWidth: 3,
};

test('annotation model binds ownership, content version, type, and timestamps', async () => {
  const annotation = new LearningContentAnnotation({
    studentId: 'student-1',
    contentId: '507f1f77bcf86cd799439011',
    contentVersion: 2,
    sectionId: 'section-1',
    type: 'DRAWING',
    data: drawing,
  });
  await annotation.validate();
  assert.equal(annotation.studentId, 'student-1');
  assert.equal(annotation.contentVersion, 2);
  assert.deepEqual(annotation.schema.path('type')?.options.enum, ['HIGHLIGHT', 'UNDERLINE', 'DRAWING', 'NOTE']);
  assert.ok(annotation.schema.indexes().some(([fields]) => fields.studentId === 1 && fields.contentId === 1));
});

test('valid drawing points are normalized without storing pointer-event records', () => {
  assert.deepEqual(normalizeLearningContentAnnotationType('drawing'), 'DRAWING');
  assert.deepEqual(normalizeLearningContentAnnotationData('DRAWING', drawing), drawing);
});

test('highlight and underline require a bounded text anchor', () => {
  const data = {
    selectedText: 'النص المحدد',
    anchor: { start: 12, end: 24 },
  };
  assert.deepEqual(normalizeLearningContentAnnotationData('HIGHLIGHT', data), data);
  assert.deepEqual(normalizeLearningContentAnnotationData('UNDERLINE', data), data);
  assert.throws(
    () => normalizeLearningContentAnnotationData('HIGHLIGHT', { selectedText: 'نص بلا موضع' }),
    (error: unknown) => error instanceof LearningContentAnnotationError && error.code === 'INVALID_ANNOTATION_DATA',
  );
});

test('notes are private bounded text and do not accept arbitrary HTML payloads', () => {
  const data = normalizeLearningContentAnnotationData('NOTE', {
    text: '<b>ملاحظة الطالب</b>',
    selectedText: 'عنوان',
    anchor: { start: 0, end: 5 },
  });
  assert.equal(data.text, '<b>ملاحظة الطالب</b>');
  assert.equal((data as Record<string, unknown>).html, undefined);
  assert.throws(
    () => normalizeLearningContentAnnotationData('NOTE', { text: 'x'.repeat(learningContentAnnotationLimits.maxNoteLength + 1) }),
    (error: unknown) => error instanceof LearningContentAnnotationError && error.code === 'INVALID_ANNOTATION_DATA',
  );
});

test('drawing validation rejects invalid coordinates, excessive points, and oversized payloads', () => {
  assert.throws(
    () => normalizeLearningContentAnnotationData('DRAWING', {
      ...drawing,
      points: [{ x: 1.1, y: 0.2 }, { x: 0.8, y: 0.7 }],
    }),
    (error: unknown) => error instanceof LearningContentAnnotationError && error.code === 'INVALID_ANNOTATION_DATA',
  );
  assert.throws(
    () => normalizeLearningContentAnnotationData('DRAWING', {
      ...drawing,
      points: Array.from({ length: learningContentAnnotationLimits.maxPoints + 1 }, () => ({ x: 0.2, y: 0.3 })),
    }),
    (error: unknown) => error instanceof LearningContentAnnotationError && error.code === 'INVALID_ANNOTATION_DATA',
  );
});

test('unsupported types and invalid anchors fail closed', () => {
  assert.throws(
    () => normalizeLearningContentAnnotationType('COMMENT'),
    (error: unknown) => error instanceof LearningContentAnnotationError && error.code === 'INVALID_ANNOTATION_TYPE',
  );
  assert.throws(
    () => normalizeLearningContentAnnotationData('HIGHLIGHT', {
      selectedText: 'نص',
      anchor: { start: 8, end: 3 },
    }),
    (error: unknown) => error instanceof LearningContentAnnotationError && error.code === 'INVALID_ANNOTATION_DATA',
  );
});

test('annotation source scopes every mutation query to the authenticated student and content', async () => {
  const source = await readFile(
    new URL('../src/services/learningContentAnnotationService.ts', import.meta.url),
    'utf8',
  );
  assert.match(source, /findOne\(\{ _id: annotationId, studentId, contentId \}/);
  assert.match(source, /deleteOne\(\{ _id: annotationId, studentId, contentId \}/);
  assert.match(source, /getLearningContent\(studentId, contentId\)/);
});

test('annotation routes require authentication before deriving the student id', async () => {
  const source = await readFile(new URL('../src/routes/routes.ts', import.meta.url), 'utf8');
  for (const method of ['get', 'post', 'patch', 'delete']) {
    assert.match(source, new RegExp(`app\\.${method}\\(['"]\\/api\\/learning\\/content\\/:contentId\\/annotations`));
  }
  const routeBlock = source.slice(source.indexOf("app.get('/api/learning/content/:contentId/annotations'"));
  assert.match(routeBlock, /annotations', requireAuth/);
  assert.match(routeBlock, /annotations', requireAuth/);
  assert.match(routeBlock, /const studentId = studentOnly\(req, res\)/);
});