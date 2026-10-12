import { test } from "node:test";
import assert from "node:assert/strict";
import { isExamSubmission, isExamRosterComplete } from "../src/lib/examSubmission";

test("adaptive answer feedback does not finalize the exam timing or archive one-question reports", () => {
  assert.equal(isExamSubmission("POST", "/api/adaptive/submit"), false);
  assert.equal(isExamSubmission("POST", "/api/adaptive/submit?retry=1"), false);
  assert.equal(isExamSubmission("POST", "/api/student/exam-reports"), false);
  assert.equal(isExamSubmission("POST", "/api/test-results"), true);
  assert.equal(isExamSubmission("POST", "/api/exam-bookings/fixture/submit"), true);
  assert.equal(isExamSubmission("GET", "/api/test-results"), false);
});

test("the twentieth adaptive question is reached before a session is complete", () => {
  for (let answered = 0; answered < 20; answered++) {
    assert.equal(isExamRosterComplete(answered, 20), false);
  }
  assert.equal(isExamRosterComplete(19, 20), false, "Next after Q19 must still fetch Q20");
  assert.equal(isExamRosterComplete(19 + 1, 20), true, "Recording Q20 saves the session");
  assert.equal(isExamRosterComplete(20, 20), true);
  assert.equal(isExamRosterComplete(0, 0), false);
});
