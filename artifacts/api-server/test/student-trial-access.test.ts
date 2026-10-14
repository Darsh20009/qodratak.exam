import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import express from "express";
import mongoose from "mongoose";
import { User } from "../src/mongodb/models";
import { StudentDailyAdaptiveTest } from "../src/mongodb/learningCoachModels";
import { ensureStudentAccountTrial, enforceStudentTrialAccess, isAllowedAfterTrial } from "../src/middleware/studentTrialAccess";

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

test("feedback and secured contract return remain available after trial, not learning", () => {
  for (const path of ["/api/student/question-contributions", "/api/questions/report",
    "/api/institutions/contract-portal", "/api/institutions/contract-portal/upload"]) {
    assert.equal(isAllowedAfterTrial(path, "POST"), true);
    assert.equal(isAllowedAfterTrial(path, "DELETE"), false);
  }
  assert.equal(isAllowedAfterTrial("/api/institutions/contract-portal/pdf", "GET"), true);
  assert.equal(isAllowedAfterTrial("/api/institutions/contract-portal/pdf", "POST"), false);
  assert.equal(isAllowedAfterTrial("/api/student/foundation", "GET"), false);
});

test("trial lasts exactly 72 hours, never restarts, and expired accounts have one daily slot",
  { skip: !process.env.MONGODB_URI, timeout: 45000 }, async () => {
    const marker = `trial-check-${randomUUID()}`;
    let user: any;
    let server: ReturnType<express.Express["listen"]> | undefined;
    await mongoose.connect(process.env.MONGODB_URI!);
    try {
      user = await User.create({
        username: marker, email: `${marker}@example.invalid`,
        fullName: "فحص حدود التجربة", role: "student", password: "external-auth",
        trialUsed: false,
      });
      const start = new Date(Date.now() - 72 * 3600000 - 60000);
      const deadline = new Date(start.getTime() + 72 * 3600000);
      const first = await ensureStudentAccountTrial(user._id, user.email, start);
      assert.equal(new Date(first!.endDate!).getTime(), deadline.getTime());
      assert.equal((await ensureStudentAccountTrial(user._id, user.email,
        new Date(deadline.getTime() - 1)))!.active, true);
      assert.equal((await ensureStudentAccountTrial(user._id, user.email, deadline))!.active, false);
      const later = await ensureStudentAccountTrial(user._id, user.email,
        new Date(deadline.getTime() + 7 * 86400000));
      assert.equal(later!.active, false);
      assert.equal(new Date(later!.endDate!).getTime(), deadline.getTime());

      const app = express();
      app.use(express.json());
      app.use((req, _res, next) => {
        // Server-owned authenticated identity; request bodies cannot alter it.
        (req as any).session = { userId: String(user._id), userEmail: user.email, userRole: "student" };
        (req as any).log = { error() {} };
        next();
      });
      app.use("/api", enforceStudentTrialAccess);
      app.use((_req, res) => res.json({ reachedProtectedHandler: true }));
      server = app.listen(0, "127.0.0.1");
      await new Promise<void>((resolve) => server!.once("listening", resolve));
      const port = (server.address() as any).port;
      for (const [method, path] of [
        ["GET", "/api/student/foundation"],
        ["GET", "/api/questions?category=quantitative"],
        ["GET", "/api/verbal-banks"],
        ["POST", "/api/student/learning-session"],
        ["POST", "/api/student/teacher-chat"],
      ]) {
        const response = await fetch(`http://127.0.0.1:${port}${path}`, {
          method, headers: { "Content-Type": "application/json" },
          ...(method === "POST" ? { body: JSON.stringify({
            deviceId: randomUUID(), trialUsed: false,
            trialEndDate: new Date(Date.now() + 30 * 86400000),
          }) } : {}),
        });
        assert.equal(response.status, 402, path);
        const body = await response.json();
        assert.equal(body.code, "TRIAL_EXPIRED");
        assert.equal(body.reachedProtectedHandler, undefined);
      }
      for (const path of [
        "/api/student/dashboard", "/api/student/daily-adaptive-test",
        "/api/student/exam-reports", "/api/subscription/plan",
      ]) assert.equal((await fetch(`http://127.0.0.1:${port}${path}`)).status, 200, path);
      assert.equal(new Date((await User.findById(user._id))!.trialEndDate!).getTime(), deadline.getTime());

      await StudentDailyAdaptiveTest.init();
      const slot = { studentId: String(user._id), dayKey: "2026-10-01", category: "mixed", questionIds: [] };
      await StudentDailyAdaptiveTest.create(slot);
      // Changing category cannot obtain a second exam on the same day.
      await assert.rejects(StudentDailyAdaptiveTest.create({ ...slot, category: "quantitative" }),
        (error: any) => error.code === 11000);
      await StudentDailyAdaptiveTest.create({ ...slot, dayKey: "2026-10-02" });
      assert.equal(await StudentDailyAdaptiveTest.countDocuments({ studentId: String(user._id) }), 2);
    } finally {
      if (server) await new Promise<void>((resolve, reject) =>
        server!.close(error => error ? reject(error) : resolve()));
      if (user) {
        await StudentDailyAdaptiveTest.deleteMany({ studentId: String(user._id) });
        await User.deleteOne({ _id: user._id, username: marker });
      }
      await mongoose.disconnect();
    }
  });
