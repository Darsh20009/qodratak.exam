import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const app = readFileSync(new URL("../src/App.tsx", import.meta.url), "utf8");
const layout = readFileSync(new URL("../src/components/layouts/RoleBasedLayout.tsx", import.meta.url), "utf8");
const portal = readFileSync(new URL("../src/pages/InstitutionPortalPage.tsx", import.meta.url), "utf8");

test("institution administrators use an institution-specific shell, not the student shell", () => {
  assert.match(app, /<Route path="\/institution">[\s\S]{0,80}<InstitutionPortalPage \/>/);
  assert.doesNotMatch(app, /<Route path="\/institution">[\s\S]{0,100}<StudentShell>/);
  assert.match(portal, /<RoleBasedLayout role="institution_admin"/);
});

test("institution navigation links to the real overview, roster, and invite pages", () => {
  const start = layout.indexOf("const institutionAdminNavItems");
  const end = layout.indexOf("const systemAdminNavItems", start);
  const nav = layout.slice(start, end);
  for (const item of [
    "{ title: 'نظرة عامة', url: '/institution',",
    "{ title: 'الطلاب', url: '/institution?tab=students',",
    "{ title: 'المعلمون', url: '/institution?tab=teachers',",
    "{ title: 'أكواد الانضمام', url: '/institution?tab=invites',",
  ]) assert.ok(nav.includes(item), `Missing institution navigation item: ${item}`);
  assert.doesNotMatch(nav, /url: '\/admin\//);
});

test("the overview exposes real counts and entry points for institution operations", () => {
  assert.match(portal, /الطلاب النشطون/);
  assert.match(portal, /المعلمون النشطون/);
  assert.match(portal, /إدارة الطلاب/);
  assert.match(portal, /إدارة المعلمين/);
  assert.match(portal, /أصدر كودًا متعدد الاستخدام للطلاب/);
  assert.match(portal, /teacherIds\.includes\(m\.userId\)/);
});
