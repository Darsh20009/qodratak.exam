import { test } from "node:test";
import assert from "node:assert/strict";
import { TestResult } from "../src/mongodb/models";

test("daily and adaptive result types validate without replacing legacy result types", async () => {
  for (const testType of ["free-verbal", "free-quantitative", "adaptive", "qiyas", "custom", "paper_model", "standard", "verbal", "quantitative"]) {
    const document = new TestResult({
      userId: "fixture-only", program: "qudrat", testType, difficulty: "intermediate",
      score: 1, totalQuestions: 1, correctAnswers: 1, wrongAnswers: 0,
      skippedQuestions: 0, percentage: 100, timeTaken: 10, pointsEarned: 10,
    });
    await assert.doesNotReject(() => document.validate(), testType);
  }
});
