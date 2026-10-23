import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import {
  calculateVerifiedStudyDayStreak,
  creditedStudySeconds,
  normalizeDailyGoalTarget,
} from "../../api-server/src/services/studentProgressPolicy";
import {
  currentWorkflowStage,
  resolveStudentWorkflowStatuses,
} from "../src/lib/studentWorkflowProgress";
import { isTrackableStudyPath } from "../src/lib/studentStudyTimePolicy";

const appSource = readFileSync(new URL("../src/App.tsx", import.meta.url), "utf8");
const routesSource = readFileSync(new URL("../../api-server/src/routes/routes.ts", import.meta.url), "utf8");
const learningProfileSource = readFileSync(new URL("../../api-server/src/services/learningProfileService.ts", import.meta.url), "utf8");
const modelsSource = readFileSync(new URL("../../api-server/src/mongodb/models.ts", import.meta.url), "utf8");

function qodratEvidence(overrides: Partial<Parameters<typeof resolveStudentWorkflowStatuses>[0]> = {}) {
  return {
    foundationAvailableCount: 4,
    foundationCompletedCount: 0,
    foundationEvidenceLoaded: true,
    diagnosticComplete: false,
    testTypeEvidence: [],
    ...overrides,
  };
}

test("active router mounts the student tracker exactly once", () => {
  assert.equal((appSource.match(/<StudentStudyTimeTracker\b/g) || []).length, 1);
  assert.match(appSource, /<StudentStudyTimeTracker active=\{serverUser\?\.role === "student"\} \/>/);
});

test("study lessons are eligible, including query-string routes", () => {
  assert.equal(isTrackableStudyPath("/foundation?program=qudrat"), true);
  assert.equal(isTrackableStudyPath("/learning/today"), true);
  assert.equal(isTrackableStudyPath("/training"), true);
  assert.equal(isTrackableStudyPath("/tahsilik/question-bank"), true);
});

test("administrative and unrelated pages never accrue study time", () => {
  assert.equal(isTrackableStudyPath("/admin/students"), false);
  assert.equal(isTrackableStudyPath("/account"), false);
});

test("exam routes and question-runner routes are excluded", () => {
  for (const route of [
    "/qiyas",
    "/paper-exam/1",
    "/tahsili/exams",
    "/tahsilik/tests",
    "/abilities",
    "/question-bank/12/3",
    "/verbal-lesson-quiz/analogy/1",
  ]) {
    assert.equal(isTrackableStudyPath(route), false, route);
  }
});

test("a first heartbeat establishes a baseline without awarding time", () => {
  assert.equal(creditedStudySeconds(null, new Date("2026-10-23T12:00:00Z")), 0);
});

test("only heartbeat intervals within the existing 15–90 second policy are credited", () => {
  const now = new Date("2026-10-23T12:01:00Z");
  assert.equal(creditedStudySeconds(new Date(now.getTime() - 15_000), now), 15);
  assert.equal(creditedStudySeconds(new Date(now.getTime() - 90_000), now), 90);
  assert.equal(creditedStudySeconds(new Date(now.getTime() - 14_000), now), 0);
  assert.equal(creditedStudySeconds(new Date(now.getTime() - 91_000), now), 0);
});

test("heartbeat requests use the server compare-and-set timestamp before adding seconds", () => {
  const start = routesSource.indexOf("app.post('/api/student/study-time/heartbeat'");
  const route = routesSource.slice(start, start + 2600);
  assert.match(route, /studyTimeHeartbeatAt:\s*previousAt/);
  assert.match(route, /\$inc:\s*\{\s*activeStudySeconds:\s*addedSeconds/);
});

test("hidden-tab or route cleanup can reset the server heartbeat baseline", () => {
  assert.match(appSource, /JSON\.stringify\(\{ active: isActive \}\)/);
  const start = routesSource.indexOf("app.post('/api/student/study-time/heartbeat'");
  const route = routesSource.slice(start, start + 2600);
  assert.match(route, /req\.body\?\.active === false/);
  assert.match(route, /studyTimeHeartbeatAt:\s*null/);
});

test("tracker retries on its bounded interval after a request failure", () => {
  assert.match(appSource, /setInterval\(\(\) => \{[\s\S]{0,180}30_000\)/);
  assert.match(appSource, /catch \{[\s\S]{0,40}ready = false/);
});

test("only a saved, server-verified answer updates the daily study record", () => {
  assert.match(learningProfileSource, /result\.attempt && Boolean\(\(result\.attempt as any\)\.isAnswered\)/);
  assert.match(learningProfileSource, /recordVerifiedDailyStudyQuestion\([\s\S]{0,180}questionId/);
  const start = learningProfileSource.indexOf("export async function recordVerifiedDailyStudyQuestion");
  const end = learningProfileSource.indexOf("export function learningAttemptSourceIdentity", start);
  const recorder = learningProfileSource.slice(start, end);
  assert.match(recorder, /verifiedQuestionIds:\s*\{\s*\$ne:\s*normalizedQuestionId/);
  assert.match(recorder, /\$addToSet:\s*\{\s*verifiedQuestionIds:\s*normalizedQuestionId/);
});

test("daily study questions are unique per question and use Saudi Arabia's date", () => {
  assert.match(learningProfileSource, /const DAILY_STUDY_TIME_ZONE = 'Asia\/Riyadh'/);
  assert.match(learningProfileSource, /verifiedQuestionIds:\s*\{\s*\$ne:\s*normalizedQuestionId/);
  assert.match(learningProfileSource, /\$addToSet:\s*\{\s*verifiedQuestionIds:\s*normalizedQuestionId/);
});

test("repeated activity stays one study day and calculates a consistent streak", () => {
  const streak = calculateVerifiedStudyDayStreak([
    { date: "2026-10-21", questionsAnswered: 5 },
    { date: "2026-10-22", questionsAnswered: 10 },
    { date: "2026-10-23", questionsAnswered: 7 },
  ], "2026-10-23", new Map(), 5);
  assert.equal(streak.current, 3);
  assert.equal(streak.longest, 3);
  assert.deepEqual(streak.weekDays.slice(-3), [true, true, true]);
});

test("fewer than the configured daily target does not complete a study day", () => {
  const streak = calculateVerifiedStudyDayStreak([
    { date: "2026-10-23", questionsAnswered: 4 },
  ], "2026-10-23", new Map(), 5);
  assert.equal(streak.current, 0);
  assert.equal(streak.weekDays[6], false);
});

test("daily-goal values use only supported targets", () => {
  assert.equal(normalizeDailyGoalTarget(10), 10);
  assert.equal(normalizeDailyGoalTarget(100), 20);
  assert.equal(normalizeDailyGoalTarget(undefined, 30), 30);
});

test("streaks only use days the server already marked complete from verified answers", () => {
  const start = routesSource.indexOf("async function calcStreak(userId");
  const end = routesSource.indexOf("\n  app.get('/api/daily-goal'", start);
  const streakRoute = routesSource.slice(start, end);
  assert.match(streakRoute, /verifiedGoalCompleted:\s*true/);
  assert.match(streakRoute, /calculateVerifiedStudyDayStreak/);
});

test("existing daily progress fields remain stored separately from verified activity", () => {
  assert.match(modelsSource, /questionsAnswered:\s*\{\s*type:\s*Number,\s*default:\s*0\s*\}/);
  assert.match(modelsSource, /verifiedQuestionsAnswered:\s*\{\s*type:\s*Number,\s*default:\s*0/);
  assert.match(routesSource, /legacyQuestionsAnswered:\s*Number\(record\.questionsAnswered\s*\|\|\s*0\)/);
});

test("a question view alone does not update daily progress", () => {
  const start = routesSource.indexOf('app.post("/api/questions/mark-seen"');
  const end = routesSource.indexOf("\n  });", start);
  const route = routesSource.slice(start, end);
  assert.doesNotMatch(route, /DailyProgress\.(?:create|findOneAndUpdate|updateOne)/);
});

test("a new student has no falsely completed learning stages", () => {
  const statuses = resolveStudentWorkflowStatuses(qodratEvidence({
    foundationAvailableCount: 0,
    foundationEvidenceLoaded: false,
  }));
  assert.deepEqual(statuses, {
    foundation: "NOT_ASSESSED",
    skills: "NOT_ASSESSED",
    banks: "NOT_ASSESSED",
    simulation: "NOT_ASSESSED",
  });
});

test("a high-level recommendation cannot complete stages without evidence", () => {
  const statuses = resolveStudentWorkflowStatuses(qodratEvidence());
  assert.equal(Object.values(statuses).includes("COMPLETED"), false);
});

test("foundation is complete only when all available published lessons have saved completion", () => {
  const incomplete = resolveStudentWorkflowStatuses(qodratEvidence({
    foundationCompletedCount: 3,
  }));
  const complete = resolveStudentWorkflowStatuses(qodratEvidence({
    foundationCompletedCount: 4,
  }));
  assert.equal(incomplete.foundation, "IN_PROGRESS");
  assert.equal(complete.foundation, "COMPLETED");
});

test("a returning student retains the same completed state from saved evidence", () => {
  const evidence = qodratEvidence({ foundationCompletedCount: 4 });
  assert.equal(resolveStudentWorkflowStatuses(evidence).foundation, "COMPLETED");
  assert.equal(resolveStudentWorkflowStatuses(evidence).foundation, "COMPLETED");
});

test("Tahsili results do not alter Qudrat stage status", () => {
  const statuses = resolveStudentWorkflowStatuses(qodratEvidence({
    testTypeEvidence: [{ program: "tahsili", testType: "qiyas", tests: 9 }],
  }));
  assert.equal(statuses.skills, "NOT_ASSESSED");
  assert.equal(statuses.simulation, "NOT_ASSESSED");
});

test("only a saved Qiyas result completes the simulation stage", () => {
  const before = resolveStudentWorkflowStatuses(qodratEvidence({
    diagnosticComplete: true,
    testTypeEvidence: [{ program: "qudrat", testType: "verbal", tests: 3 }],
  }));
  const after = resolveStudentWorkflowStatuses(qodratEvidence({
    diagnosticComplete: true,
    testTypeEvidence: [
      { program: "qudrat", testType: "verbal", tests: 3 },
      { program: "qudrat", testType: "qiyas", tests: 1 },
    ],
  }));
  assert.equal(before.simulation, "NOT_STARTED");
  assert.equal(after.simulation, "COMPLETED");
});

test("current stage follows evidence, not the numeric position of a later stage", () => {
  const statuses = resolveStudentWorkflowStatuses(qodratEvidence({
    foundationCompletedCount: 4,
    diagnosticComplete: true,
  }));
  assert.equal(currentWorkflowStage(statuses), "skills");
  assert.equal(statuses.banks, "NOT_STARTED");
});
