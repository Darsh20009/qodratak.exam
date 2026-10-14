import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const portal = source("../src/pages/InstitutionPortalPage.tsx");
const studentCard = source("../src/components/institution/InstitutionAssignmentsCard.tsx");
const studentDashboard = source("../src/pages/student/DashboardPage.tsx");
const examPage = source("../src/pages/QiyasExamPage.tsx");
const api = source("../../api-server/src/routes/institutions.ts");
const resultRoute = source("../../api-server/src/routes/routes.ts");

test("institution managers can publish, inspect, and close organization-scoped exams", () => {
  assert.match(portal, /tab: "assignments" as const/);
  assert.match(portal, /useCreateInstitutionAssignment/);
  assert.match(portal, /useInstitutionAssignmentResults/);
  assert.match(portal, /useCloseInstitutionAssignment/);
});

test("institution students see the branded assignment card in both dashboard states", () => {
  assert.equal(studentDashboard.split("<InstitutionAssignmentsCard />").length - 1, 2);
  assert.match(studentCard, /اختبارات خاصة بمؤسسة/);
  assert.match(studentCard, /institutionTestId: test\.id/);
});

test("assigned exam results are tied to the assignment and validated server-side", () => {
  assert.match(examPage, /institutionTestAssignmentId/);
  assert.match(resultRoute, /canStudentSubmitInstitutionTest/);
  assert.match(resultRoute, /institutionTestAssignmentId: institutionalAssignment \? String\(institutionalAssignment\._id\)/);
  assert.match(api, /\/api\/institution\/student\/assignments/);
});

test("institution rankings use observed results and link to each student's report", () => {
  assert.match(portal, /confidence === "observed"/);
  assert.match(portal, /onClick=\{\(\) => setViewing\(student\)\}/);
});
