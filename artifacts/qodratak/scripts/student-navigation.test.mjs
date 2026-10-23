import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { isStudentPrimaryActive, isStudentPathActive } from "../src/components/student/studentNavigationRoutes.mjs";

const navigation = readFileSync(new URL("../src/components/student/StudentNavigation.tsx", import.meta.url), "utf8");
const shell = readFileSync(new URL("../src/components/student/StudentShell.tsx", import.meta.url), "utf8");
const app = readFileSync(new URL("../src/App.tsx", import.meta.url), "utf8");

test("the five agreed student destinations are present once as primary links", () => {
  for (const [label, href] of [
    ["لوحة التحكم", "/"], ["التأسيس", "/foundation"], ["التدريب", "/training"],
    ["نتائجي", "/records"], ["حسابي", "/account"],
  ]) {
    assert.match(navigation, new RegExp(`label: "${label}", href: "${href.replaceAll("/", "\\/")}"`));
  }
  const directoryHrefs = [...navigation.matchAll(/group: "[^"]+", label: "[^"]+", href: "([^"]+)"/g)].map((match) => match[1]);
  for (const href of ["/", "/foundation", "/training", "/records", "/account"]) {
    assert.ok(!directoryHrefs.includes(href), `${href} should not be repeated in More`);
  }
  assert.equal(new Set(directoryHrefs).size, directoryHrefs.length, "the More directory must not repeat a page");
  assert.ok(directoryHrefs.includes("/qiyas"));
  assert.ok(directoryHrefs.includes("/foundation/coverage-test"));
  assert.ok(directoryHrefs.includes("/platform-guide"));
});

test("desktop navigation is persistent and mobile drawer offers open, select and close behavior", () => {
  assert.match(navigation, /data-testid="student-desktop-navigation"/);
  assert.match(navigation, /data-testid="button-open-student-drawer"/);
  assert.match(navigation, /data-testid="student-mobile-drawer"/);
  assert.match(navigation, /onClick=\{onNavigate\}/);
  assert.match(navigation, /setDrawerOpen\(false\)/);
  assert.match(navigation, /addEventListener\("qodratak:open-student-pages"/);
  assert.match(navigation, /matchMedia\("\(max-width: 767px\)"\)\.matches\) setDrawerOpen\(true\)/);
  assert.match(navigation, /student-page-directory-\$\{instance\}/);
});

test("active matching includes nested routes and exam mode hides the shared navigation", () => {
  assert.equal(isStudentPrimaryActive("/tahsili/sources", "foundation"), true);
  assert.equal(isStudentPrimaryActive("/tahsilik/tests/biology", "training"), true);
  assert.equal(isStudentPrimaryActive("/paper-exam-results", "results"), true);
  assert.equal(isStudentPrimaryActive("/subscription", "account"), true);
  assert.equal(isStudentPrimaryActive("/foundation/coverage-test", "foundation"), false);
  assert.equal(isStudentPrimaryActive("/foundation/coverage-test", "training"), true);
  assert.equal(isStudentPrimaryActive("/test-results", "dashboard"), false);
  assert.equal(isStudentPathActive("/test-results/attempt/2", "/test-results"), true);
  assert.match(shell, /<StudentNavigation hidden=\{isExamLayoutActive \|\| user\?\.role !== "student"\} \/>/);
});

test("every More directory destination has a student route", () => {
  const routePaths = new Set([...app.matchAll(/<Route\s+path="([^"]+)"/g)].map((match) => match[1]));
  const directoryHrefs = [...navigation.matchAll(/group: "[^"]+", label: "[^"]+", href: "([^"]+)"/g)].map((match) => match[1]);
  const matchesRoute = (href, pattern) => {
    const hrefSegments = href.split("/").filter(Boolean);
    const patternSegments = pattern.split("/").filter(Boolean);
    return hrefSegments.length === patternSegments.length
      && patternSegments.every((segment, index) => segment.startsWith(":") || segment === hrefSegments[index]);
  };
  for (const href of directoryHrefs) {
    assert.ok([...routePaths].some((pattern) => matchesRoute(href, pattern)), `missing route for ${href}`);
  }
});
