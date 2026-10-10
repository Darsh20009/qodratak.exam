import assert from "node:assert/strict";
import test from "node:test";
import { openPreparationTarget, preparationNeedsAssessment, preparationPreferenceKey, readPreparationPreferences } from "../../qodratak/src/lib/preparationStart";

const now = new Date("2026-10-10T10:00:00Z").getTime();
const fresh = { status: "diagnostic_completed", lastDiagnosticAt: new Date(now - 1000).toISOString() };
test("booking preferences are student-scoped and cannot assign a level or exam date", () => {
  const stored = new Map([[preparationPreferenceKey("a"), JSON.stringify({ bookingMode: "open", introSeen: true, level: "advanced", examDate: "2026-10-11" })]]);
  const storage = { getItem: (key: string) => stored.get(key) || null };
  assert.deepEqual(readPreparationPreferences(storage, "a"), { bookingMode: "open", introSeen: true });
  assert.deepEqual(readPreparationPreferences(storage, "b"), { bookingMode: "undecided", introSeen: false });
  assert.equal(preparationNeedsAssessment(null, null, false, now), true);
});
test("blocked/corrupt preference storage never blocks the current learning journey", () => {
  assert.equal(readPreparationPreferences({ getItem: () => { throw new Error("blocked"); } }, "a").bookingMode, "undecided");
  assert.equal(readPreparationPreferences({ getItem: () => "{" }, "a").introSeen, false);
  assert.equal(readPreparationPreferences({ getItem: () => '{"bookingMode":"fake","introSeen":"true"}' }, "a").bookingMode, "undecided");
});
test("new and returning learners cannot skip assessment by hiding the intro", () => {
  assert.equal(preparationNeedsAssessment({ status: "new" }, null, false, now), true);
  assert.equal(preparationNeedsAssessment({ ...fresh, lastDiagnosticAt: new Date(now - 90 * 86400000).toISOString() }, null, false, now), true);
  assert.equal(preparationNeedsAssessment({ status: "diagnostic_completed" }, null, false, now), true);
  assert.equal(preparationNeedsAssessment({ ...fresh, lastDiagnosticAt: new Date(now + 1000).toISOString() }, null, false, now), true);
  assert.equal(preparationNeedsAssessment(fresh, null, false, now), false);
});
test("server course assessment floor wins over historic completed status", () => {
  const course = { level: "unassessed", assessmentRequiredAfter: new Date(now).toISOString() };
  assert.equal(preparationNeedsAssessment(fresh, course, true, now), true);
  assert.equal(preparationNeedsAssessment({ ...fresh, lastDiagnosticAt: new Date(now + 1000).toISOString() }, course, false, now + 2000), false);
  assert.equal(preparationNeedsAssessment(null, { level: "advanced" }, false, now), false);
});
test("open preparation only opens a real ready session; otherwise it directs to published foundation", () => {
  assert.equal(openPreparationTarget("READY"), "session");
  for (const status of [undefined, "CONTENT_UNAVAILABLE", "NO_RECOMMENDATION", "DIAGNOSTIC_REQUIRED"]) {
    assert.equal(openPreparationTarget(status), "foundation");
  }
});
