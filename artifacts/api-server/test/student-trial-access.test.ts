import assert from "node:assert/strict";
import test from "node:test";
import { isAllowedAfterTrial } from "../src/middleware/studentTrialAccess";

test("expired students retain their dashboard, coach, and one-test API", () => {
  assert.equal(isAllowedAfterTrial("/api/student/dashboard", "GET"), true);
  assert.equal(isAllowedAfterTrial("/api/student/learning-coach", "GET"), true);
  assert.equal(isAllowedAfterTrial("/api/student/daily-adaptive-test", "GET"), true);
  assert.equal(isAllowedAfterTrial("/api/student/daily-adaptive-test", "POST"), true);
});

test("expired students retain subscription and payment access", () => {
  assert.equal(isAllowedAfterTrial("/api/subscription/plan", "GET"), true);
  assert.equal(isAllowedAfterTrial("/api/subscription/status", "POST"), true);
  assert.equal(isAllowedAfterTrial("/api/subscription/subscribe-request", "POST"), true);
  assert.equal(isAllowedAfterTrial("/api/subscription/geidea/sessions", "POST"), true);
});

test("expired students cannot use other student learning APIs", () => {
  assert.equal(isAllowedAfterTrial("/api/student/foundation", "GET"), false);
  assert.equal(isAllowedAfterTrial("/api/student/learning-session", "POST"), false);
  assert.equal(isAllowedAfterTrial("/api/student/teacher-chat", "POST"), false);
  assert.equal(isAllowedAfterTrial("/api/subscription/plan", "POST"), false);
});
