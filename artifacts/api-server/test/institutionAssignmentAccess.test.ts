import assert from "node:assert/strict";
import test from "node:test";
import { canStudentSubmitInstitutionTest } from "../src/services/institutionService";

const activeAssignment = {
  userRole: "student",
  memberRole: "student",
  memberStatus: "active",
  memberInstitutionId: "institution-a",
  institutionId: "institution-a",
  institutionIsActive: true,
  assignmentStatus: "active",
  dueAt: "2027-01-01T00:00:00.000Z",
  assignedExamId: 2,
  submittedExamId: 2,
  alreadyCompleted: false,
  now: new Date("2026-10-14T00:00:00.000Z"),
};

test("active institution student can submit the assigned exam once", () => {
  assert.deepEqual(canStudentSubmitInstitutionTest(activeAssignment), { allowed: true });
});

test("an assignment cannot be submitted by a student from another institution", () => {
  const result = canStudentSubmitInstitutionTest({
    ...activeAssignment,
    memberInstitutionId: "institution-b",
  });
  assert.equal(result.allowed, false);
  if (!result.allowed) assert.equal(result.status, 403);
});

test("only an active student membership can submit an institutional test", () => {
  const result = canStudentSubmitInstitutionTest({ ...activeAssignment, memberStatus: "revoked" });
  assert.equal(result.allowed, false);
  if (!result.allowed) assert.equal(result.status, 403);
});

test("a student cannot substitute a different exam or resubmit a completed assignment", () => {
  const wrongExam = canStudentSubmitInstitutionTest({ ...activeAssignment, submittedExamId: 3 });
  assert.equal(wrongExam.allowed, false);
  if (!wrongExam.allowed) assert.equal(wrongExam.status, 403);

  const completed = canStudentSubmitInstitutionTest({ ...activeAssignment, alreadyCompleted: true });
  assert.equal(completed.allowed, false);
  if (!completed.allowed) assert.equal(completed.status, 409);
});

test("closed institutional tests reject submissions after their deadline", () => {
  const expired = canStudentSubmitInstitutionTest({
    ...activeAssignment,
    dueAt: "2026-10-13T23:59:00.000Z",
  });
  assert.equal(expired.allowed, false);
  if (!expired.allowed) assert.equal(expired.status, 410);
});
