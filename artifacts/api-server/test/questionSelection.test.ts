import assert from 'node:assert/strict';
import test from 'node:test';
import {
  applySelectedContentReference,
  filterQuestionCandidates,
  publicQuestionSelection,
  selectQuestionFromCandidates,
  sessionBelongsToStudent,
  validateQuestionSelectionContext,
  type QuestionCandidate,
  type QuestionSelectionContext,
} from '../src/services/questionSelectionService.ts';

const NOW = new Date('2026-09-18T12:00:00.000Z');
const PROGRAM = 'program.qudrat';
const VERBAL = 'subject.qudrat.verbal';
const QUANTITATIVE = 'subject.qudrat.quantitative';

function candidate(
  questionId: string,
  overrides: Partial<QuestionCandidate> = {},
): QuestionCandidate {
  return {
    questionId,
    sourceType: 'mongo_question',
    sourceKey: 'question-bank',
    programId: PROGRAM,
    subjectId: VERBAL,
    category: 'استيعاب المقروء',
    subcategory: 'استيعاب المقروء',
    topic: 'استيعاب المقروء',
    difficulty: 'intermediate',
    text: `سؤال ${questionId}`,
    options: ['أ', 'ب', 'ج', 'د'],
    correctOptionIndex: 1,
    ...overrides,
  };
}

function context(overrides: Partial<QuestionSelectionContext> = {}): QuestionSelectionContext {
  return {
    studentId: 'student-a',
    programId: PROGRAM,
    subjectId: VERBAL,
    taxonomyNodeId: VERBAL,
    activityType: 'PRACTICE',
    now: NOW,
    ...overrides,
  };
}

test('candidate pool is filtered by program', () => {
  const result = filterQuestionCandidates([
    candidate('q-qudrat'),
    candidate('q-tahsili', { programId: 'program.tahsili', subjectId: 'subject.tahsili.math' }),
  ], context());
  assert.deepEqual(result.eligible.map((item) => item.questionId), ['q-qudrat']);
  assert.equal(result.excluded[0].reason, 'wrong_program_or_subject');
});

test('candidate pool is filtered by subject', () => {
  const result = filterQuestionCandidates([
    candidate('q-verbal'),
    candidate('q-quantitative', {
      subjectId: QUANTITATIVE,
      category: 'الهندسة',
      subcategory: 'الهندسة',
      topic: 'الهندسة',
    }),
  ], context());
  assert.deepEqual(result.eligible.map((item) => item.questionId), ['q-verbal']);
});

test('approved deep taxonomy narrows the pool when it exists', () => {
  const result = filterQuestionCandidates([
    candidate('q-topic-a', { taxonomyNodeIds: ['topic.qudrat.verbal.reading'], taxonomyApproved: true }),
    candidate('q-topic-b', { taxonomyNodeIds: ['topic.qudrat.verbal.analogy'], taxonomyApproved: true }),
  ], context({ taxonomyNodeId: 'topic.qudrat.verbal.reading' }));
  assert.deepEqual(result.eligible.map((item) => item.questionId), ['q-topic-a']);
  assert.equal(result.excluded[0].reason, 'outside_approved_taxonomy');
});

test('unapproved taxonomy is ignored and falls back to subject scope', () => {
  const result = filterQuestionCandidates([
    candidate('q-unapproved', {
      taxonomyNodeIds: ['topic.qudrat.verbal.reading'],
      taxonomyApproved: false,
    }),
    candidate('q-subject'),
  ], context({ taxonomyNodeId: 'topic.qudrat.verbal.reading' }));
  assert.deepEqual(result.eligible.map((item) => item.questionId), ['q-unapproved', 'q-subject']);
});

test('invalid questions and missing answer keys are excluded', () => {
  const result = filterQuestionCandidates([
    candidate('q-valid'),
    candidate('q-missing-key', { correctOptionIndex: -1 }),
    candidate('q-empty-options', { options: [] }),
    candidate('q-empty-text', { text: '' }),
  ], context());
  assert.deepEqual(result.eligible.map((item) => item.questionId), ['q-valid']);
  assert.equal(result.excluded.filter((item) => item.reason === 'invalid_question').length, 3);
});

test('review-only Tahsili answers are not trusted', () => {
  const result = filterQuestionCandidates([
    candidate('q-review', {
      sourceType: 'mongo_tahsili_question',
      sourceKey: 'tahsili:book:1:1',
      programId: 'program.tahsili',
      subjectId: 'subject.tahsili.math',
      answerConfidence: 'review',
    }),
    candidate('q-verified', {
      sourceType: 'mongo_tahsili_question',
      sourceKey: 'tahsili:book:1:2',
      programId: 'program.tahsili',
      subjectId: 'subject.tahsili.math',
      answerConfidence: 'verified',
    }),
  ], context({ programId: 'program.tahsili', subjectId: 'subject.tahsili.math' }));
  assert.deepEqual(result.eligible.map((item) => item.questionId), ['q-verified']);
});

test('recently answered questions are excluded', () => {
  const result = filterQuestionCandidates([
    candidate('q-recent'),
    candidate('q-old'),
  ], context({
    attemptHistory: [{
      questionId: 'q-recent',
      sourceType: 'mongo_question',
      sourceKey: 'question-bank',
      programId: PROGRAM,
      subjectId: VERBAL,
      isAnswered: true,
      isCorrect: false,
      createdAt: new Date('2026-09-18T08:00:00.000Z'),
    }],
  }));
  assert.deepEqual(result.eligible.map((item) => item.questionId), ['q-old']);
});

test('repeated exact questions are excluded without an explicit retry', () => {
  const result = filterQuestionCandidates([candidate('q-repeat')], context({
    attemptHistory: [{
      questionId: 'q-repeat',
      sourceType: 'mongo_question',
      sourceKey: 'question-bank',
      programId: PROGRAM,
      subjectId: VERBAL,
      isAnswered: true,
      isCorrect: false,
      createdAt: new Date('2026-09-01T08:00:00.000Z'),
    }],
  }));
  assert.equal(result.eligible.length, 0);
  assert.equal(result.excluded[0].reason, 'repeated_exact_question');
});

test('error evidence aligns selection with the same source category', () => {
  const selected = selectQuestionFromCandidates([
    candidate('q-reading', { topic: 'استيعاب المقروء' }),
    candidate('q-analogy', { topic: 'التناظر اللفظي', category: 'التناظر اللفظي' }),
  ], context({
    errorEvidence: [{
      programId: PROGRAM,
      subjectId: VERBAL,
      errorType: 'READING_ERROR',
      confidence: 'HIGH',
      detectedAt: NOW,
      topic: 'استيعاب المقروء',
    }],
  })).candidate;
  assert.equal(selected?.questionId, 'q-reading');
});

test('mastery-aware selection avoids an already mastered mapped node', () => {
  const selected = selectQuestionFromCandidates([
    candidate('q-mastered', { taxonomyNodeIds: ['topic.qudrat.verbal.reading'], taxonomyApproved: true }),
    candidate('q-open', { taxonomyNodeIds: ['topic.qudrat.verbal.analogy'], taxonomyApproved: true }),
  ], context({
    mastery: [{
      taxonomyNodeId: 'topic.qudrat.verbal.reading',
      programId: PROGRAM,
      subjectId: VERBAL,
      masteryLevel: 'MASTERED',
    }],
  })).candidate;
  assert.equal(selected?.questionId, 'q-open');
});

test('difficulty target is used only when supplied as trusted context', () => {
  const selected = selectQuestionFromCandidates([
    candidate('q-easy', { difficulty: 'beginner' }),
    candidate('q-hard', { difficulty: 'advanced' }),
  ], context({ difficultyTarget: 'advanced' })).candidate;
  assert.equal(selected?.questionId, 'q-hard');
});

test('difficulty is not guessed when metadata is absent', () => {
  const selected = selectQuestionFromCandidates([
    candidate('q-1', { difficulty: undefined, sourceKey: 'a' }),
    candidate('q-2', { difficulty: undefined, sourceKey: 'b' }),
  ], context()).candidate;
  assert.equal(selected?.questionId, 'q-1');
});

test('selection is deterministic and has no random tie breaking', () => {
  const pool = [
    candidate('q-2', { sourceKey: 'b' }),
    candidate('q-1', { sourceKey: 'a' }),
  ];
  const first = selectQuestionFromCandidates(pool, context()).candidate;
  const second = selectQuestionFromCandidates(pool, context()).candidate;
  assert.equal(first?.questionId, 'q-1');
  assert.deepEqual(first, second);
});

test('no suitable content is represented by an empty candidate result', () => {
  const result = selectQuestionFromCandidates([
    candidate('q-used'),
  ], context({
    attemptHistory: [{
      questionId: 'q-used',
      sourceType: 'mongo_question',
      sourceKey: 'question-bank',
      programId: PROGRAM,
      subjectId: VERBAL,
      isAnswered: true,
      isCorrect: true,
      createdAt: new Date('2026-09-01T08:00:00.000Z'),
    }],
  }));
  assert.equal(result.candidate, null);
  assert.equal(result.filtering.excluded[0].reason, 'repeated_exact_question');
});

test('selection context requires an authenticated student and approved program', () => {
  assert.throws(
    () => validateQuestionSelectionContext(context({ studentId: '' })),
    /studentId غير صالح/,
  );
  assert.throws(
    () => validateQuestionSelectionContext(context({ programId: 'program.other' })),
    /البرنامج غير صالح/,
  );
});

test('session selection ownership is checked against the authenticated student', () => {
  assert.equal(sessionBelongsToStudent({ studentId: 'student-a' }, 'student-a'), true);
  assert.equal(sessionBelongsToStudent({ studentId: 'student-b' }, 'student-a'), false);
  assert.equal(sessionBelongsToStudent(null, 'student-a'), false);
});

test('public question selection never exposes the answer key or internal score', () => {
  const output = publicQuestionSelection({
    selectionStatus: 'SELECTED',
    activityType: 'PRACTICE',
    question: {
      questionId: 'q-1',
      sourceType: 'mongo_question',
      sourceKey: 'question-bank',
      programId: PROGRAM,
      subjectId: VERBAL,
      text: 'سؤال',
      options: ['أ', 'ب'],
    },
  }) as any;
  assert.equal(output.question.correctAnswer, undefined);
  assert.equal(output.question.correctOptionIndex, undefined);
  assert.equal(output.selectionScore, undefined);
  assert.equal(output.question.text, 'سؤال');
});

test('session integration replaces only the requested pending step reference', () => {
  const plan = {
    planId: 'plan-1',
    studentId: 'student-a',
    programId: PROGRAM,
    subjectId: VERBAL,
    recommendationType: 'PRACTICE',
    title: 'practice',
    estimatedMinutes: 10,
    steps: [
      {
        stepId: 'step-1',
        stepType: 'PRACTICE',
        estimatedMinutes: 5,
        status: 'NOT_STARTED',
        contentReference: {
          kind: 'question_selection_pending' as const,
          id: VERBAL,
          programId: PROGRAM,
          subjectId: VERBAL,
          availability: 'deferred' as const,
        },
      },
      {
        stepId: 'step-2',
        stepType: 'MASTERY_CHECK',
        estimatedMinutes: 5,
        status: 'NOT_STARTED',
        contentReference: {
          kind: 'question_selection_pending' as const,
          id: VERBAL,
          programId: PROGRAM,
          subjectId: VERBAL,
          availability: 'deferred' as const,
        },
      },
    ],
    sessionReason: 'practice',
    confidence: 'MEDIUM',
    generatedAt: NOW,
    planStatus: 'READY',
    state: 'IN_PROGRESS',
    progress: 0,
  } as any;
  const updated = applySelectedContentReference(plan, 'step-1', {
    kind: 'question',
    id: 'q-1',
    questionId: 'q-1',
    programId: PROGRAM,
    subjectId: VERBAL,
    availability: 'available',
    sourceType: 'mongo_question',
    sourceKey: 'question-bank',
  });
  assert.equal(updated.steps[0].contentReference.kind, 'question');
  assert.equal(updated.steps[0].contentReference.questionId, 'q-1');
  assert.equal(updated.steps[1].contentReference.kind, 'question_selection_pending');
});

test('diagnostic selection remains pending', () => {
  const result = selectQuestionFromCandidates([candidate('q-1')], context({ activityType: 'DIAGNOSTIC' }));
  assert.equal(result.candidate, null);
  assert.equal(result.filtering.excluded[0].reason, 'diagnostic_selection_pending');
});

test('intentional retry is distinct from accidental duplicate selection', () => {
  const retry = selectQuestionFromCandidates([candidate('q-1')], context({
    activityType: 'RETRY',
    retryQuestionId: 'q-1',
    attemptHistory: [{
      questionId: 'q-1',
      sourceType: 'mongo_question',
      sourceKey: 'question-bank',
      programId: PROGRAM,
      subjectId: VERBAL,
      isAnswered: true,
      isCorrect: false,
      createdAt: new Date('2026-09-01T08:00:00.000Z'),
    }],
  }));
  const duplicate = selectQuestionFromCandidates([candidate('q-1')], context({
    attemptHistory: [{
      questionId: 'q-1',
      sourceType: 'mongo_question',
      sourceKey: 'question-bank',
      programId: PROGRAM,
      subjectId: VERBAL,
      isAnswered: true,
      isCorrect: false,
      createdAt: new Date('2026-09-01T08:00:00.000Z'),
    }],
  }));
  assert.equal(retry.candidate?.questionId, 'q-1');
  assert.equal(duplicate.candidate, null);
});
