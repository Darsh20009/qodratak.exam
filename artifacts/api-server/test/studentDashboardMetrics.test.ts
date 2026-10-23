import assert from "node:assert/strict";
import { test } from "node:test";
import { classifySavedTestProgram } from "../src/services/studentDashboardMetrics";

test("saved Qudrat and Tahsili program values remain explicit", () => {
  assert.equal(classifySavedTestProgram("qudrat", "verbal"), "qudrat");
  assert.equal(classifySavedTestProgram("tahsili", "biology"), "tahsili");
});

test("known Qudrat test types can scope legacy general results", () => {
  for (const testType of ["verbal", "quantitative", "free-verbal", "free-quantitative", "qiyas"]) {
    assert.equal(classifySavedTestProgram("general", testType), "qudrat");
  }
});

test("unknown general and non-general test types never become Qudrat by guess", () => {
  assert.equal(classifySavedTestProgram("general", "custom"), "general");
  assert.equal(classifySavedTestProgram("unknown", "qiyas"), "general");
  assert.equal(classifySavedTestProgram(undefined, "verbal"), "qudrat");
  assert.equal(classifySavedTestProgram(undefined, "custom"), "general");
});
