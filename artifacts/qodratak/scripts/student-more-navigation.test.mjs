import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const appSource = await readFile(new URL("../src/App.tsx", import.meta.url), "utf8");
const menuStart = appSource.indexOf("const moreNavItems = [");
const menuEnd = appSource.indexOf("\n  ];", menuStart);
assert.notEqual(menuStart, -1, "student More menu registry should exist");
assert.notEqual(menuEnd, -1, "student More menu registry should be closed");

const menuSource = appSource.slice(menuStart, menuEnd);
const menuItems = [...menuSource.matchAll(/\{ group: "([^"]+)", name: "([^"]+)", href: "([^"]+)"/g)]
  .map(([, group, name, href]) => ({ group, name, href }));
const routePaths = [...appSource.matchAll(/<Route path="([^"]+)"/g)].map(([, path]) => path);

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function routeMatches(href, routePath) {
  const target = href.split("?")[0];
  const expression = routePath
    .split("/")
    .map((part) => (part.startsWith(":") ? "[^/]+" : escapeRegex(part)))
    .join("/");
  return new RegExp(`^${expression}$`).test(target);
}

test("the More directory covers the active learning pages without duplicate or broken routes", () => {
  assert.ok(menuItems.length >= 50, `expected a complete student directory, found ${menuItems.length} links`);

  const hrefs = menuItems.map((item) => item.href);
  assert.equal(new Set(hrefs).size, hrefs.length, "the directory should not repeat a destination");

  for (const item of menuItems) {
    assert.ok(routePaths.some((routePath) => routeMatches(item.href, routePath)), `${item.name} has no matching route: ${item.href}`);
    assert.ok(!item.href.startsWith("/admin"), "admin pages must not appear in the student directory");
    assert.ok(!item.href.startsWith("/login"), "authentication pages must not appear in the student directory");
  }

  const tahsiliEntry = menuItems.find((item) => item.href === "/tahsili");
  assert.match(tahsiliEntry?.name ?? "", /التحصيلي/, "the Tahsili program should be discoverable as an active student destination");
  assert.ok(menuItems.some((item) => item.href === "/tahsilik/tests"), "the active Tahsili subject-test center should be discoverable");
  assert.ok(menuItems.some((item) => item.href === "/tahsilik/question-bank"), "the Tahsili question bank should be discoverable");
  assert.ok(!menuItems.some((item) => /قريبًا/.test(item.name)), "active learning programs must not be presented as coming soon");
  assert.match(appSource, /<Route path="\/tahsili">[\s\S]*?<TahsiliOverviewPage \/>/, "the Tahsili overview route should show its live study and test links");
  for (const href of ["/foundation/coverage-test", "/bubble-sheet-scan", "/student/foundation-book/quantitative", "/ai-hub/pattern-analysis", "/subscription", "/install"]) {
    assert.ok(menuItems.some((item) => item.href === href), `student-ready destination should be discoverable: ${href}`);
  }
});

test("the desktop and mobile More menus share search, learning goals, and grouped destinations", () => {
  for (const group of ["اختبارات وتدريب", "مراجعة وتقدم", "خطة واستعداد", "مصادر ومساعدة"]) {
    assert.ok(menuItems.some((item) => item.group === group), `missing student navigation group: ${group}`);
  }

  assert.match(appSource, /const learnerGoalActions = \[/);
  assert.match(appSource, /اختر ما تحتاجه الآن/);
  assert.match(appSource, /sidebarMoreGroups\.map/);
  assert.match(appSource, /moreNavGroups\.map/);
  assert.match(appSource, /data-testid="input-student-more-search"/);
  assert.match(appSource, /data-testid="input-mobile-student-more-search"/);
});

test("students can open More from the mobile bottom navigation and keep the desktop list expanded across pages", () => {
  assert.match(appSource, /data-testid="button-open-student-more"/);
  assert.match(appSource, /aria-controls="student-more-drawer"/);
  assert.match(appSource, /data-testid="button-toggle-student-more"/);
  assert.match(appSource, /data-testid="button-close-student-more"/);
  assert.match(appSource, /setShowMoreMenu\(\(open\) => !open\)/);
  assert.doesNotMatch(appSource, /setSidebarMoreOpen\(false\)/, "route changes should not hide the expanded desktop directory");
});
