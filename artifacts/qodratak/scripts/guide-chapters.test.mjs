import test from "node:test"; import assert from "node:assert/strict";
import { readFileSync } from "node:fs"; import ts from "typescript";
const src = readFileSync(new URL("../src/lib/guideChapters.ts", import.meta.url), "utf8");
const js = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 } }).outputText;
const m = await import("data:text/javascript;base64," + Buffer.from(js).toString("base64"));
test("route -> chapter", () => {
  const cases = { "/": null, "/preparation-course": "course", "/preparation-course/practice/12": "today", "/learning/today": "today",
    "/foundation": "foundation", "/foundation?subject=verbal": "foundation", "/student-program/qudrat": "foundation",
    "/student/foundation-book/quantitative": "book", "/student/foundation-book/quantitative/7": "book", "/foundation/content/5": "book",
    "/foundation/coverage-test": "instructions", "/foundation/computer-bank-test/3": "instructions", "/computerized": "computerized",
    "/question-bank": "computerized", "/question-bank/verbal/4": "runner", "/verbal-lesson-quiz/a/1": "passage", "/mock-exams": "mock", "/qiyas": "mock",
    "/book-exam": "instructions", "/custom-exam": "custom", "/records": "results", "/exam-review": "results", "/account": "account",
    "/subscription": "account", "/support": "support", "/faq": "support" };
  for (const [p, c] of Object.entries(cases)) assert.equal(m.chapterForPath(p), c, p);
});
test("hidden preference scoped and safe", () => {
  const map = new Map(); const s = { getItem: (k) => map.get(k) ?? null, setItem: (k, v) => map.set(k, v), removeItem: (k) => map.delete(k) };
  m.writePageGuideHidden(s, "1", "course", true);
  assert.equal(m.readPageGuideHidden(s, "1", "course"), true);
  assert.equal(m.readPageGuideHidden(s, "2", "course"), false);
  assert.equal(m.readPageGuideHidden(s, "1", "today"), false);
  assert.equal(m.readPageGuideHidden(s, null, "course"), false);
  const bad = { getItem() { throw new Error(); }, setItem() { throw new Error(); }, removeItem() { throw new Error(); } };
  assert.equal(m.readPageGuideHidden(bad, "1", "course"), false); m.writePageGuideHidden(bad, "1", "course", true);
});
test("page-specific supplemental chapters", () => {
  const cases = { "/flashcards": "flashcards", "/performance-report": "analysis", "/error-analysis": "analysis", "/analytics": "analysis",
    "/skill-progress": "analysis", "/mistake-challenge": "mistakes", "/enhanced-mistake-challenge": "mistakes", "/security-settings": "security",
    "/pre-exam-day": "preexam", "/time-management": "preexam", "/ai-tutor": "tutor", "/ai-hub": "tutor", "/ai-hub/daily-plan": "tutor",
    "/study-rooms": "rooms", "/study-rooms/AB12": "rooms", "/notifications": "notifications", "/notification-settings": "notifications",
    "/exam-review": "results", "/records": "results", "/test-results": "results", "/scheduled-exam/9": "instructions", "/adaptive-test": "runner" };
  for (const [p, c] of Object.entries(cases)) assert.equal(m.chapterForPath(p), c, p);
  for (const c of Object.values(cases)) assert.ok(m.GUIDE_CHAPTER_LABELS[c], c);
});
test("caller rule: students only, never during exams, dashboard handled by its own widget", () => {
  assert.equal(m.shouldShowPageGuide({ chapter: "support", role: "student", studentId: 4 }), true);
  assert.equal(m.shouldShowPageGuide({ chapter: "support", role: null, studentId: null }), false);
  assert.equal(m.shouldShowPageGuide({ chapter: "results", role: "teacher", studentId: 2 }), false);
  assert.equal(m.shouldShowPageGuide({ chapter: "instructions", role: "student", studentId: 4, examActive: true }), false);
  assert.equal(m.shouldShowPageGuide({ chapter: m.chapterForPath("/"), role: "student", studentId: 4 }), false);
});
