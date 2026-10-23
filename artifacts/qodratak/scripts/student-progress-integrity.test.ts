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
import {
  buildStudentDashboardJourney,
  buildStudentDashboardTasks,
  buildStudentDashboardTrend,
  listAvailableStudentDashboardSubjects,
} from "../src/lib/studentDashboardProgress";
import { isTrackableStudyPath } from "../src/lib/studentStudyTimePolicy";
import { foundationDiagnosticHref } from "../src/lib/foundationRoutes.mjs";

const appSource = readFileSync(new URL("../src/App.tsx", import.meta.url), "utf8");
const dashboardPageSource = readFileSync(new URL("../src/pages/student/DashboardPage.tsx", import.meta.url), "utf8");
const foundationPageSource = readFileSync(new URL("../src/pages/student/FoundationPage.tsx", import.meta.url), "utf8");
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

test("a saved Qiyas result marks simulation in progress but never completes it alone", () => {
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
  assert.equal(after.simulation, "IN_PROGRESS");
});

test("current stage follows evidence, not the numeric position of a later stage", () => {
  const statuses = resolveStudentWorkflowStatuses(qodratEvidence({
    foundationCompletedCount: 4,
    diagnosticComplete: true,
  }));
  assert.equal(currentWorkflowStage(statuses), "skills");
  assert.equal(statuses.banks, "NOT_STARTED");
});

test("student dashboard journey keeps Qudrat and Tahsili evidence separate", () => {
  const qudrat = buildStudentDashboardJourney({
    program: "qudrat",
    foundation: { loaded: true, total: 5, completed: 2 },
    testEvidence: [
      { program: "qudrat", testType: "qiyas", tests: 1 },
      { program: "tahsili", testType: "custom", tests: 8 },
      { program: "general", testType: "qiyas", tests: 3 },
    ],
    reviewTopics: [],
    links: {
      foundation: "/foundation?program=qudrat",
      training: "/training",
      simulation: "/qiyas",
      analysis: "/records",
      remediation: "/learning/today?programId=qudrat",
    },
  });
  const tahsili = buildStudentDashboardJourney({
    program: "tahsili",
    subjectId: "subject.tahsili.physics",
    foundation: { loaded: true, total: 5, completed: 0 },
    testEvidence: [
      { program: "qudrat", testType: "verbal", tests: 4 },
      { program: "tahsili", subjectId: "subject.tahsili.physics", testType: "custom", tests: 2 },
      { program: "tahsili", testType: "qiyas", tests: 5 },
    ],
    reviewTopics: [],
    links: {
      foundation: "/foundation?program=tahsili",
      training: "/training",
      simulation: "/tahsilik/tests",
      analysis: "/records",
      remediation: "/learning/today?programId=tahsili",
    },
  });
  const qudratStages = Object.fromEntries(qudrat.map((stage) => [stage.id, stage]));
  const tahsiliStages = Object.fromEntries(tahsili.map((stage) => [stage.id, stage]));
  assert.equal(qudratStages.foundation.status, "IN_PROGRESS");
  assert.equal(qudratStages.training.status, "NOT_STARTED");
  assert.equal(qudratStages.simulation.status, "IN_PROGRESS");
  assert.equal(tahsiliStages.foundation.status, "NOT_STARTED");
  assert.equal(tahsiliStages.training.status, "IN_PROGRESS");
  assert.equal(tahsiliStages.simulation.status, "NOT_STARTED");
});

test("dashboard foundation completion requires all published lessons to be saved complete", () => {
  const base = {
    program: "qudrat" as const,
    testEvidence: [],
    reviewTopics: [],
    links: {
      foundation: "/foundation",
      training: "/training",
      simulation: "/qiyas",
      analysis: "/records",
      remediation: "/learning/today",
    },
  };
  assert.equal(buildStudentDashboardJourney({
    ...base,
    foundation: { loaded: true, total: 3, completed: 2 },
  }).find((stage) => stage.id === "foundation")?.status, "IN_PROGRESS");
  assert.equal(buildStudentDashboardJourney({
    ...base,
    foundation: { loaded: true, total: 3, completed: 3 },
  }).find((stage) => stage.id === "foundation")?.status, "COMPLETED");
  assert.equal(buildStudentDashboardJourney({
    ...base,
    foundation: { loaded: true, total: 0, completed: 0 },
  }).find((stage) => stage.id === "foundation")?.status, "NOT_ASSESSED");
});

test("a finished corrective session does not complete the broader remediation stage", () => {
  const base = {
    program: "qudrat" as const,
    foundation: { loaded: true, total: 1, completed: 0 },
    testEvidence: [],
    reviewTopics: ["النسبة والتناسب"],
    links: {
      foundation: "/foundation",
      training: "/training",
      simulation: "/qiyas",
      analysis: "/records",
      remediation: "/learning/today",
    },
  };
  const incomplete = buildStudentDashboardJourney({
    ...base,
    session: {
      title: "جلسة اليوم",
      programId: "subject.qudrat.quantitative",
      started: true,
      steps: [{ stepType: "CORRECT", status: "IN_PROGRESS" }],
    },
  });
  const complete = buildStudentDashboardJourney({
    ...base,
    session: {
      title: "جلسة اليوم",
      programId: "program.qudrat",
      started: true,
      steps: [{ stepType: "CORRECT", status: "COMPLETED" }],
    },
  });
  const incompleteRemediation = incomplete.find((stage) => stage.id === "remediation");
  const completeRemediation = complete.find((stage) => stage.id === "remediation");
  assert.equal(incompleteRemediation?.status, "IN_PROGRESS");
  assert.equal(completeRemediation?.status, "IN_PROGRESS");
  assert.match(completeRemediation?.detail || "", /أنجزت 1 من 1 خطوة تصحيحية/);
});

test("the active stage follows the saved learning decision and diagnostic state", () => {
  const input = {
    program: "qudrat" as const,
    foundation: { loaded: true, total: 4, completed: 1 },
    testEvidence: [{ program: "qudrat" as const, testType: "practice", tests: 1 }],
    reviewTopics: [],
    diagnosticStatus: "COMPLETED" as const,
    planStatus: "READY",
    nextActionType: "PRACTICE",
    links: {
      diagnostic: "/foundation?program=qudrat&reassess=1",
      foundation: "/foundation",
      training: "/training",
      simulation: "/qiyas",
      analysis: "/records",
      remediation: "/learning/today",
    },
  };
  const stages = buildStudentDashboardJourney(input);
  assert.equal(stages.find((stage) => stage.isCurrent)?.id, "training");
  assert.equal(buildStudentDashboardJourney({ ...input, diagnosticStatus: "NOT_ASSESSED" })
    .find((stage) => stage.isCurrent)?.id, "diagnostic");
  assert.equal(buildStudentDashboardJourney({ ...input, planStatus: "CONTENT_UNAVAILABLE" })
    .some((stage) => stage.isCurrent), false);
});

test("placement results do not inflate the student's training count", () => {
  const stages = buildStudentDashboardJourney({
    program: "tahsili",
    subjectId: "subject.tahsili.physics",
    diagnosticStatus: "COMPLETED",
    foundation: { loaded: true, total: 0, completed: 0 },
    testEvidence: [
      { program: "tahsili", subjectId: "subject.tahsili.physics", testType: "placement-diagnostic", tests: 1 },
      { program: "tahsili", subjectId: "subject.tahsili.physics", testType: "custom", tests: 2 },
    ],
    reviewTopics: [],
    links: {
      diagnostic: "/foundation?program=tahsili&reassess=1",
      foundation: "/foundation?program=tahsili",
      training: "/training",
      simulation: "/tahsilik/tests",
      analysis: "/records",
      remediation: "/learning/today?programId=tahsili",
    },
  });
  assert.match(stages.find((stage) => stage.id === "training")?.detail || "", /^2 نتيجة تدريب/);
});

test("Tahsili dashboard results and diagnostic links stay subject-scoped", () => {
  assert.match(dashboardPageSource, /const diagnosticHref = foundationDiagnosticHref\(planProgram\)/);
  assert.match(dashboardPageSource, /buildStudentDashboardTrend\(tahsiliResults\.data\?\.subjectResults \?\? \[\], activeProgram, journeySubjectId\)/);
  assert.match(dashboardPageSource, /generalResults=\{tahsiliResults\.data\?\.generalResults\}/);
});

test("only subjects with published foundation content are selectable, with separate Tahsili scopes", () => {
  const content = [
    "subject.tahsili.math",
    "subject.tahsili.physics",
    "subject.qudrat.verbal",
    "subject.tahsili.unmapped",
  ];
  assert.deepEqual(
    listAvailableStudentDashboardSubjects("tahsili", content).map((item) => item.id),
    ["subject.tahsili.math", "subject.tahsili.physics"],
  );
  assert.deepEqual(
    listAvailableStudentDashboardSubjects("qudrat", content).map((item) => item.id),
    ["subject.qudrat.verbal"],
  );
});

test("both student diagnostic links launch the correct program in the existing assessment dialog", () => {
  assert.equal(foundationDiagnosticHref("qudrat"), "/foundation?program=qudrat&reassess=1&returnTo=preparation");
  assert.equal(foundationDiagnosticHref("tahsili"), "/foundation?program=tahsili&reassess=1");
  assert.match(foundationPageSource, /const program: FoundationProgram = params\.get\("program"\) === "tahsili" \? "tahsili" : "qudrat"/);
  assert.match(foundationPageSource, /<CourseDiagnosticLauncher \/>/);
});

test("dashboard tasks contain only sourced items and are capped at three", () => {
  const tasks = buildStudentDashboardTasks({
    diagnosticRequired: false,
    diagnosticHref: "/foundation",
    session: {
      title: "جلسة تعلم اليوم",
      programId: "program.qudrat",
      started: false,
      sessionReason: "خطة التعلم المحفوظة لهذا المسار.",
      state: "READY",
      estimatedMinutes: 20,
      steps: [],
    },
    sessionHref: "/learning/today?programId=qudrat",
    scheduledTask: {
      title: "أكمل درس النسب",
      reason: "موعده اليوم وفق خطتك المحفوظة.",
      href: "/foundation?program=qudrat&view=plan",
      status: "pending",
    },
    review: {
      topics: ["النسبة والتناسب"],
      testTitle: "اختبار كمي محفوظ",
      href: "/records",
    },
  });
  assert.equal(tasks.length, 3);
  assert.ok(tasks.every((task) => task.title && task.reason && task.href));

  const emptyTasks = buildStudentDashboardTasks({
    diagnosticRequired: false,
    diagnosticHref: "/foundation",
    sessionHref: "/learning/today",
  });
  assert.deepEqual(emptyTasks, []);
});

test("dashboard trend contains only dated saved results for the selected program", () => {
  const points = buildStudentDashboardTrend([
    { id: "later-q", title: "اختبار كمي", score: 72, date: "2026-10-22T12:00:00.000Z", program: "qudrat" },
    { id: "tahsili", title: "اختبار أحياء", score: 99, date: "2026-10-21T12:00:00.000Z", program: "tahsili" },
    { id: "earlier-q", title: "اختبار لفظي", score: 61, date: "2026-10-20T12:00:00.000Z", program: "qudrat" },
    { id: "undated", title: "نتيجة قديمة بلا تاريخ", score: 80, date: null, program: "qudrat" },
    { id: "invalid", title: "نسبة غير صالحة", score: null, date: "2026-10-23T12:00:00.000Z", program: "qudrat" },
  ], "qudrat");
  assert.deepEqual(points.map((point) => point.id), ["earlier-q", "later-q"]);
  assert.deepEqual(points.map((point) => point.percentage), [61, 72]);
  const physicsPoints = buildStudentDashboardTrend([
    { id: "physics", title: "اختبار فيزياء", score: 77, date: "2026-10-22T12:00:00.000Z", program: "tahsili", subjectId: "subject.tahsili.physics" },
    { id: "chemistry", title: "اختبار كيمياء", score: 88, date: "2026-10-21T12:00:00.000Z", program: "tahsili", subjectId: "subject.tahsili.chemistry" },
    { id: "general", title: "اختبار تحصيلي عام", score: 94, date: "2026-10-23T12:00:00.000Z", program: "tahsili" },
  ], "tahsili", "subject.tahsili.physics");
  assert.deepEqual(physicsPoints.map((point) => point.id), ["physics"], "Tahsili charts include only the selected subject, never old general results");
});

test("dashboard API returns only verified study days and a bounded saved-test history", () => {
  assert.match(routesSource, /DailyProgress\.countDocuments\(\{\s*userId,\s*verifiedQuestionsAnswered:\s*\{\s*\$gt:\s*0\s*\}\s*\}\)/);
  assert.match(routesSource, /TestResult\.find\(\{\s*userId\s*\}\)\.sort\(\{\s*completedAt:\s*-1\s*\}\)\.limit\(20\)/);
  assert.match(routesSource, /verifiedStudyDays,/);
  assert.match(routesSource, /metricsAvailable:\s*false/);
  assert.match(routesSource, /metricsAvailable:\s*true/);
  assert.match(routesSource, /program subjectId testName testType percentage score totalQuestions completedAt weakAreas/);
  assert.match(routesSource, /app\.get\('\/api\/student\/tahsili\/results'/);
});
