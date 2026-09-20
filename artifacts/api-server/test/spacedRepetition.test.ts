import assert from 'node:assert/strict';
import test from 'node:test';
import { LearningReviewItem } from '../src/mongodb/learningReviewModels.ts';
import {
  annotateLearningReviewItemFromErrorEvidence,
  calculateRetentionConfidence,
  calculateReviewIntervalDays,
  isReviewDue,
  publicLearningReviewItem,
  upsertLearningReviewItem,
} from '../src/services/spacedRepetitionService.ts';

const NOW = new Date('2026-09-20T12:00:00.000Z');
const PROGRAM = 'program.qudrat';
const SUBJECT = 'subject.qudrat.verbal';

function questionContext(outcome: 'QUESTION_SUCCESS' | 'QUESTION_FAILURE', sourceIdentity = 'mongo_question:q-1') {
  return {
    programId: PROGRAM,
    subjectId: SUBJECT,
    sourceType: 'QUESTION' as const,
    sourceId: 'q-1',
    sourceIdentity: `question:${sourceIdentity}`,
    outcome,
    now: NOW,
  };
}

function installReviewStore() {
  const store = new Map<string, any>();
  const model = LearningReviewItem as any;
  const originalFindOne = model.findOne;
  const originalCreate = model.create;
  let nextId = 1;
  model.findOne = async (query: { studentId: string; sourceIdentity: string }) =>
    store.get(`${query.studentId}|${query.sourceIdentity}`) || null;
  model.create = async (data: any) => {
    const key = `${data.studentId}|${data.sourceIdentity}`;
    const document = {
      ...data,
      _id: `review-${nextId++}`,
      save: async function save() {
        store.set(key, this);
        return this;
      },
    };
    store.set(key, document);
    return document;
  };
  return {
    store,
    restore() {
      model.findOne = originalFindOne;
      model.create = originalCreate;
    },
  };
}

test('Phase 14 keeps interval and retention calculations deterministic', () => {
  assert.equal(calculateReviewIntervalDays(0), 1);
  assert.equal(calculateReviewIntervalDays(2), 7);
  assert.equal(calculateReviewIntervalDays(2, 'MASTERED'), 9);
  assert.equal(calculateReviewIntervalDays(5, 'PROFICIENT', 'CONCEPT'), 3);
  assert.equal(calculateRetentionConfidence(0, 0, 1), 'LOW');
  assert.equal(calculateRetentionConfidence(2, 2, 0), 'MEDIUM');
  assert.equal(calculateRetentionConfidence(4, 4, 0), 'HIGH');
});

test('a wrong answer creates a due review item and repeated success stabilizes it', async () => {
  const fake = installReviewStore();
  try {
    const created = await upsertLearningReviewItem('student-a', {
      ...questionContext('QUESTION_FAILURE'),
      errorType: 'CONCEPT_GAP',
    });
    assert.ok(created);
    assert.equal(created.state, 'REVIEW_DUE');
    assert.equal(created.intervalDays, 1);
    assert.equal(created.retentionConfidence, 'LOW');
    assert.equal(publicLearningReviewItem(created, NOW).due, true);

    let item = created;
    for (let index = 0; index < 4; index += 1) {
      item = (await upsertLearningReviewItem('student-a', {
        ...questionContext('QUESTION_SUCCESS'),
        now: new Date(NOW.getTime() + (index + 1) * 86400000),
      }))!;
    }
    assert.equal(item.reviewCount, 4);
    assert.equal(item.successfulReviewCount, 4);
    assert.equal(item.retentionConfidence, 'HIGH');
    assert.equal(item.state, 'STABLE');
    assert.equal(item.intervalDays, 14);
    assert.equal(isReviewDue(item, new Date(NOW.getTime() + 2 * 86400000)), false);
  } finally {
    fake.restore();
  }
});

test('review identity includes source identity and does not create a candidate for an isolated correct answer', async () => {
  const fake = installReviewStore();
  try {
    assert.equal(await upsertLearningReviewItem('student-a', questionContext('QUESTION_SUCCESS')), null);
    await upsertLearningReviewItem('student-a', {
      ...questionContext('QUESTION_FAILURE', 'mongo_question:q-1'),
      errorType: 'UNKNOWN',
    });
    await upsertLearningReviewItem('student-a', {
      ...questionContext('QUESTION_FAILURE', 'mongo_tahsili_question:q-1'),
      errorType: 'UNKNOWN',
    });
    assert.equal(fake.store.size, 2);
  } finally {
    fake.restore();
  }
});

test('content completion starts a candidate before counting a later retention success', async () => {
  const fake = installReviewStore();
  try {
    const context = {
      programId: PROGRAM,
      subjectId: SUBJECT,
      sourceType: 'CONTENT' as const,
      sourceId: 'content-1',
      sourceIdentity: 'content:content-1',
      outcome: 'CONTENT_COMPLETION' as const,
      now: NOW,
    };
    const first = await upsertLearningReviewItem('student-a', context);
    assert.equal(first?.state, 'NEW');
    assert.equal(first?.successfulReviewCount, 0);
    const second = await upsertLearningReviewItem('student-a', {
      ...context,
      now: new Date(NOW.getTime() + 86400000),
    });
    assert.equal(second?.successfulReviewCount, 1);
    assert.equal(second?.lastSuccessfulReviewAt?.toISOString(), '2026-09-21T12:00:00.000Z');
  } finally {
    fake.restore();
  }
});

test('self-reported error annotates the existing failure without double-counting it', async () => {
  const fake = installReviewStore();
  try {
    const attempt = {
      questionId: 'q-1',
      sourceIdentity: 'mongo_question:q-1',
      programId: PROGRAM,
      subjectId: SUBJECT,
    };
    await upsertLearningReviewItem('student-a', {
      ...questionContext('QUESTION_FAILURE'),
      errorType: 'UNKNOWN',
    });
    const annotated = await annotateLearningReviewItemFromErrorEvidence(
      'student-a',
      attempt,
      'CONCEPT_GAP',
      undefined,
      new Date(NOW.getTime() + 3600000),
    );
    assert.equal(annotated?.reviewCount, 0);
    assert.equal(annotated?.lastFailureKind, 'CONCEPT');
    assert.equal(annotated?.state, 'REVIEW_DUE');
  } finally {
    fake.restore();
  }
});