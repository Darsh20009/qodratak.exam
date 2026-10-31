import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

const source = readFileSync(new URL("../src/lib/guideViewer.ts", import.meta.url), "utf8");
const js = ts.transpileModule(source, { compilerOptions: {
  module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022,
} }).outputText;
const m = await import(`data:text/javascript;base64,${Buffer.from(js).toString("base64")}`);

test("full student guide and each role have distinct film URLs", () => {
  assert.equal(m.guideFilmSrc(), "/qodratak-guide/");
  assert.equal(m.guideFilmSrc({ film: "guide", muted: true }), "/qodratak-guide/?muted=1");
  for (const role of ["admin", "institution", "teacher", "marketing"]) {
    const url = new URL(m.guideFilmSrc({ film: role, chapter: "dashboard", muted: true }), "https://qodratak.sa");
    assert.equal(url.searchParams.get("film"), role);
    assert.equal(url.searchParams.get("chapter"), null);
    assert.equal(url.searchParams.get("muted"), "1");
  }
  assert.equal(m.guideFilmSrc({ chapter: "results" }), "/qodratak-guide/?chapter=results");
});

test("display names are bounded plain strings and never placed in iframe URLs", () => {
  assert.equal(m.normalizeGuideDisplayName("  أحمد\n  محمد\u202e "), "أحمد محمد");
  assert.equal(m.normalizeGuideDisplayName(null), "");
  assert.equal(m.normalizeGuideDisplayName({ name: "طالب" }), "");
  assert.equal(Array.from(m.normalizeGuideDisplayName("🙂".repeat(100))).length, 64);
  assert.equal(m.guideFilmSrc({ displayName: "اسم الطالب" }).includes("اسم"), false);
  // Plain text remains plain text; rendering must not use dangerouslySetInnerHTML.
  assert.equal(m.normalizeGuideDisplayName("<script>name</script>"), "<script>name</script>");
  const component = readFileSync(new URL("../src/components/GuideFilm.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(component, /dangerouslySetInnerHTML/);
  assert.match(component, /window\.location\.origin/);
});

test("ready messages only come from the current frame on the same origin", () => {
  const frame = {}, other = {}, origin = "https://qodratak.sa", ready = { type: "qodratak.guide.ready" };
  assert.equal(m.isGuideReadyMessage(origin, origin, frame, frame, ready), true);
  assert.equal(m.isGuideReadyMessage("https://other.invalid", origin, frame, frame, ready), false);
  assert.equal(m.isGuideReadyMessage(origin, origin, other, frame, ready), false);
  assert.equal(m.isGuideReadyMessage(origin, origin, null, null, ready), false);
  assert.equal(m.isGuideReadyMessage(origin, origin, frame, frame, null), false);
  assert.equal(m.isGuideReadyMessage(origin, origin, frame, frame, { type: "unknown" }), false);
});

test("hide preferences are account- and role-scoped with existing student compatibility", () => {
  assert.equal(m.roleGuideHiddenKey("student", "one"), "qodratak.dashboard.guideFilm.hidden.v1.one");
  const keys = ["student", "admin", "institution", "teacher"].flatMap(role =>
    ["one", "two"].map(uid => m.roleGuideHiddenKey(role, uid)));
  assert.equal(new Set(keys).size, 8);
});

test("all dashboard branches wire the full guide and authenticated identity", () => {
  const student = readFileSync(new URL("../src/components/student/DashboardGuideFilm.tsx", import.meta.url), "utf8");
  assert.match(student, /audience="student"/);
  assert.doesNotMatch(student, /chapter="dashboard"/);
  for (const [file, audience] of [
    ["admin/AdminDashboard", "admin"], ["InstitutionPortalPage", "institution"],
    ["TeacherHomePage", "teacher"],
  ]) {
    const page = readFileSync(new URL(`../src/pages/${file}.tsx`, import.meta.url), "utf8");
    assert.match(page, new RegExp(`RoleGuideFilm audience="${audience}" viewerId=`));
    assert.match(page, /displayName=/);
  }

  const studentDashboard = readFileSync(new URL("../src/pages/student/DashboardPage.tsx", import.meta.url), "utf8");
  assert.equal((studentDashboard.match(/<DashboardGuideFilm /g) ?? []).length, 3);
  const studentShell = readFileSync(new URL("../src/components/student/StudentShell.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(studentShell, /PageGuideFilm/);
  const app = readFileSync(new URL("../src/App.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(app, /StudentPageGuide/);
  const teacherSystem = readFileSync(new URL("../src/pages/TeacherSystemPage.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(teacherSystem, /RoleGuideFilm/);
});
