import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const app = await readFile(new URL("../src/App.tsx", import.meta.url), "utf8");
const landing = await readFile(new URL("../src/pages/LandingPage.tsx", import.meta.url), "utf8");
const html = await readFile(new URL("../index.html", import.meta.url), "utf8");

const rootStart = app.indexOf('<Route path="/">');
const rootEnd = app.indexOf("</Route>", rootStart);
assert.notEqual(rootStart, -1, "the root route should exist");
const rootRoute = app.slice(rootStart, rootEnd);

test("the verification badge is enabled only after the root route confirms a public visitor", () => {
  assert.match(rootRoute, /if \(isUserLoading\) return <LandingPage \/>;/);
  assert.match(rootRoute, /: <LandingPage enableStoreBadge \/>/);
  assert.doesNotMatch(rootRoute, /isUserLoading\) return <LandingPage enableStoreBadge/);
  assert.match(app, /<LandingPage initialModal="signup" \/>/);
  assert.match(app, /<LandingPage initialModal="login" \/>/);
});

test("opening authentication or leaving the public landing removes the injected badge", () => {
  assert.match(landing, /enableStoreBadge = false/);
  assert.match(landing, /enableStoreBadge && location === "\/" && !initialModal && authMode === null/);
  assert.match(landing, /querySelectorAll\("\.sbc-badge-trigger, \.sbc-certificate-backdrop"\)/);
  assert.match(landing, /root\.classList\.remove\("qodratak-landing-page"\)/);
  assert.match(html, /html:not\(\.qodratak-landing-page\).*\.sbc-badge-trigger/);
});
