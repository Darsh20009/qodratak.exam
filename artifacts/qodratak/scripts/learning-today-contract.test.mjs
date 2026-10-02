import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const hooks = await readFile(new URL("../src/hooks/use-student.ts", import.meta.url), "utf8");
const home = await readFile(new URL("../src/pages/student/DashboardPage.tsx", import.meta.url), "utf8");
const session = await readFile(new URL("../src/pages/student/LearningTodayPage.tsx", import.meta.url), "utf8");
const reader = await readFile(new URL("../src/pages/student/FoundationReaderPage.tsx", import.meta.url), "utf8");

function block(source, start, end) {
  const startIndex = source.indexOf(start);
  assert.notEqual(startIndex, -1, `missing ${start}`);
  const endIndex = source.indexOf(end, startIndex + start.length);
  return source.slice(startIndex, endIndex === -1 ? source.length : endIndex);
}

test("learning hooks expose the server-owned session lifecycle", () => {
  assert.match(hooks, /"\/api\/learning\/today"/);
  assert.match(hooks, /"\/api\/learning\/today\/start"/);
  assert.match(hooks, /"\/api\/learning\/today\/select"/);
  assert.match(hooks, /"\/api\/learning\/today\/answer"/);
  assert.match(hooks, /"\/api\/learning\/today\/step"/);
  assert.match(hooks, /"\/api\/learning\/today\/complete"/);
  assert.match(hooks, /"\/api\/learning\/adaptive\/decision"/);
  assert.match(hooks, /"\/api\/learning\/recommendations"/);
});

test("session start sends no client decision data", () => {
  const start = block(hooks, "export function useStartTodayLearningSession", "export function useUpdateTodayLearningStep");
  assert.match(start, /method: "POST"/);
  assert.match(start, /body: JSON\.stringify\(scope\)/);
  for (const forbidden of ["studentId", "mastery", "recommendationType", "priority", "confidence", "correctness"]) {
    assert.doesNotMatch(start, new RegExp(`\\b${forbidden}\\b`));
  }
});

test("content selection and answer submission use only owned session fields", () => {
  const selection = block(hooks, "export function useSelectTodayLearningContent", "export function useSubmitTodayLearningAnswer");
  const answer = block(hooks, "export function useSubmitTodayLearningAnswer", "export function useUpdateOfficialScores");
  for (const payload of [selection, answer]) {
    assert.match(payload, /sessionId/);
    assert.match(payload, /stepId/);
    assert.doesNotMatch(payload, /\b(studentId|mastery|recommendationType|priority|confidence|correctness)\b/);
  }
});

test("student home and session UI provide the core Phase 16 states", () => {
  assert.match(home, /data-testid="student-next-step"/);
  assert.match(home, /\/learning\/today/);
  assert.match(home, /useTodayLearningSession\(hasJourneyScope, journeyProgram, journeySubjectId\)/);
  assert.match(session, /useTodayLearningSession\(true, programId, subjectId\)/);
  for (const label of ["خطوتك التالية", "نكمل؟", "ابدأ"]) assert.match(home, new RegExp(label));
  for (const label of ["ابدأ الآن", "أكمل القراءة", "إرسال الإجابة", "التالي", "اكتمل درس اليوم"]) {
    assert.match(session, new RegExp(label));
  }
  for (const code of ["CONTENT_UNAVAILABLE", "NO_SUITABLE_CONTENT", "PRACTICE_UNAVAILABLE"]) {
    assert.match(session, new RegExp(code));
  }
});

test("reader returns to the current session after completing a today step", () => {
  assert.match(reader, /fromToday/);
  assert.match(reader, /todaySessionId/);
  assert.match(reader, /updateTodayStep\.mutate/);
  assert.match(reader, /todayReturnHref/);
  assert.match(reader, /setLocation\(todayReturnHref\)/);
  assert.match(reader, /programId/);
  assert.match(reader, /subjectId/);
});