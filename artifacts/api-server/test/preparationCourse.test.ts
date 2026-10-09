import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPreparationCourse, publicCourse, riyadhDay, validateCourseInput } from '../src/services/preparationCourseService';
import { isReadingQuestion, observedIdeas, questionIdea } from '../src/services/questionIdeas';
import { requestsTahsili, sanitizeStudentPassages } from '../src/middleware/studentContentAvailability';
import { CreateStudentCourseBody } from '@workspace/api-zod';

const now = new Date('2026-10-10T05:00:00Z');
const profile = { status: 'diagnostic_completed', baseline: { overall: 40 }, focus: { category: 'quantitative' } };
const bank = Array.from({ length: 120 }, (_, i) => ({
  _id: String(i), category: i % 2 ? 'verbal' : 'quantitative', text: `سؤال ${i}`,
  subcategory: i % 2 ? 'إكمال الجمل' : 'النسبة', difficulty: 'beginner', answerStatus: 'approved',
  options: ['أ', 'ب'], correctOptionIndex: 0,
}));
test('Saudi calendar and strict date/duration/minute validation', () => {
  const input = { examDate: '2026-10-19', durationDays: 10, dailyMinutes: 30 };
  const parsed = CreateStudentCourseBody.parse(input);
  assert.equal(typeof parsed.examDate, 'string', 'API schema must preserve calendar dates as strings');
  assert.equal(validateCourseInput(parsed, now), null);
  assert.equal(riyadhDay(new Date('2026-10-09T22:00:00Z')), '2026-10-10');
  for (const examDate of ['2026-10-09', '2026-02-30', 'wrong']) assert.ok(validateCourseInput({ examDate, durationDays: 5, dailyMinutes: 60 }, now));
  assert.ok(validateCourseInput({ examDate: '2026-10-15', durationDays: 6, dailyMinutes: 60 }, now));
  assert.ok(validateCourseInput({ examDate: '2026-10-15', durationDays: 5, dailyMinutes: 30.5 }, now));
});
test('unassessed learners start with diagnosis; no guessed advanced status', () => {
  const course = buildPreparationCourse({ examDate: '2026-10-20', durationDays: 10, dailyMinutes: 60 }, null, [], bank, [], now);
  assert.equal(course.level, 'unassessed');
  assert.equal(course.days[0].tasks[0].kind, 'diagnostic');
});
test('5/10/15/30 schedules, close deadlines and daily workloads', () => {
  for (const durationDays of [5, 10, 15, 30]) {
    const course = buildPreparationCourse({ examDate: '2026-11-20', durationDays, dailyMinutes: 60 }, profile, [], bank, [], now);
    assert.equal(course.days.length, durationDays);
    assert.equal(course.level, 'foundation');
    for (const day of course.days) assert.ok(day.tasks.reduce((sum: number, t: any) => sum + t.minutes, 0) <= 60);
    const ids = course.days.flatMap((d) => d.tasks.flatMap((t: any) => t.questionIds || []));
    assert.equal(new Set(ids).size, ids.length);
    assert.equal(course.plannedQuestions, ids.length);
    assert.ok(course.plannedQuestions <= bank.length);
    assert.ok(!JSON.stringify(publicCourse(course)).includes('questionIds'));
  }
  const short = buildPreparationCourse({ examDate: '2026-10-12', durationDays: 30, dailyMinutes: 30 }, profile, [], bank, [], now);
  assert.equal(short.durationDays, 2);
  assert.equal(short.days.at(-1)!.date, '2026-10-11');
});
test('only approved questions with valid keys enter practice', () => {
  const invalid = [...bank, { ...bank[0], _id: 'bad', correctOptionIndex: 99 }, { ...bank[0], _id: 'review', answerStatus: 'review' }];
  const course = buildPreparationCourse({ examDate: '2026-10-15', durationDays: 5, dailyMinutes: 60 }, profile, [], invalid, [], now);
  assert.equal(course.availableQuestions, bank.length);
});
test('passages only in reading; nonreading question stem retained without leaked source prefix', () => {
  for (const subcategory of ['التناظر اللفظي', 'إكمال الجمل', 'الخطأ السياقي', 'المفردة الشاذة']) {
    const q = { category: 'verbal', subcategory, text: 'النص المرتبط بالسؤال: القطعة\nالسؤال: السؤال الصحيح', options: ['أ', 'ب'], source: { passageText: 'القطعة', section: 'استيعاب المقروء' } };
    assert.equal(isReadingQuestion(q), false);
    const clean = sanitizeStudentPassages({ questions: [q] }).questions[0];
    assert.equal(clean.source.passageText, undefined);
    assert.equal(clean.text, 'السؤال الصحيح');
  }
  const q = { category: 'verbal', subcategory: 'استيعاب المقروء', text: 'أنسب عنوان للنص؟', options: ['أ', 'ب'], source: { passageText: 'القطعة' } };
  assert.equal(sanitizeStudentPassages(q).source.passageText, 'القطعة');
  assert.equal(questionIdea(q).key, 'reading-title');
});
test('ideas ignore unverified answers and confidence considers distinct questions', () => {
  const q = { id: '1', category: 'verbal', subcategory: 'استيعاب المقروء', text: 'أنسب عنوان للنص؟', isCorrect: false, isSlow: true };
  const ideas = observedIdeas([{ questions: [q, q, { ...q, isCorrect: null }] }]);
  assert.equal(ideas[0].attempts, 2);
  assert.equal(ideas[0].confidence, 'limited');
});
test('Tahsili endpoints and scoped practice lock but historic records/admin stay intact', () => {
  assert.equal(requestsTahsili('/api/tahsili/questions'), true);
  assert.equal(requestsTahsili('/api/foundation/content', { program: 'tahsili' }), true);
  assert.equal(requestsTahsili('/api/student/learning/today', {}, { programId: 'program.tahsili' }), true);
  assert.equal(requestsTahsili('/api/student/exam-reports', { program: 'tahsili' }), false);
  assert.equal(requestsTahsili('/api/admin/foundation', {}, { program: 'tahsili' }), false);
  assert.equal(requestsTahsili('/api/questions', { program: 'qudrat' }), false);
});
