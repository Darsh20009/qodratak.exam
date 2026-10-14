import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

const source = await readFile(new URL("../src/lib/questionContributions.ts", import.meta.url), "utf8");
const code = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const { jsonRequest, uploadContributionImage } = await import(
  `data:text/javascript;base64,${Buffer.from(code).toString("base64")}`
);
const html = '<!DOCTYPE html><html><body><pre>Cannot GET /api/admin/question-contributions</pre></body></html>';
const originalFetch = globalThis.fetch;
test.after(() => { globalThis.fetch = originalFetch; });

test("missing deployed route gives an actionable message, never HTML", async () => {
  globalThis.fetch = async () => new Response(html, { status: 404 });
  await assert.rejects(jsonRequest("GET", "/api/admin/question-contributions"), error => {
    assert.match(error.message, /نسخة الخادم/);
    assert.doesNotMatch(error.message, /<!DOCTYPE|<html|Cannot GET/);
    return true;
  });
});

test("structured authorization and missing-record messages stay intact", async () => {
  for (const [status, message] of [[401, "سجل الدخول كمدير"], [404, "المساهمة غير موجودة"]]) {
    globalThis.fetch = async () => Response.json({ message }, { status });
    await assert.rejects(jsonRequest("GET", "/api/admin/question-contributions"), { message });
  }
});

test("HTML success and server errors fail explicitly without exposing markup", async () => {
  for (const status of [200, 503]) {
    globalThis.fetch = async () => new Response(html, { status });
    await assert.rejects(jsonRequest("GET", "/api/admin/question-contributions"), error => {
      assert.doesNotMatch(error.message, /<html|Cannot GET/);
      return true;
    });
  }
});

test("valid list and approval JSON are returned unchanged", async () => {
  for (const payload of [{ contributions: [] }, { success: true, questionId: "fixture" }]) {
    globalThis.fetch = async () => Response.json(payload);
    assert.deepEqual(await jsonRequest("GET", "/api/admin/question-contributions"), payload);
  }
});

test("image upload uses the same safe response handling", async () => {
  const file = new File([new Uint8Array([1, 2, 3])], "fixture.png", { type: "image/png" });
  globalThis.fetch = async () => new Response(html, { status: 404 });
  await assert.rejects(uploadContributionImage(file), /نسخة الخادم/);
  globalThis.fetch = async () => Response.json({});
  await assert.rejects(uploadContributionImage(file), /رابط الصورة/);
  globalThis.fetch = async () => Response.json({ imageUrl: "/api/question-contribution-images/fixture.png" });
  assert.equal(await uploadContributionImage(file), "/api/question-contribution-images/fixture.png");
});
