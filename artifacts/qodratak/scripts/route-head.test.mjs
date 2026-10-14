import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

const source = readFileSync(new URL("../src/lib/routeHead.ts", import.meta.url), "utf8");
const js = ts.transpileModule(source, { compilerOptions: {
  module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022,
} }).outputText;
const { updateRouteHead } = await import(`data:text/javascript;base64,${Buffer.from(js).toString("base64")}`);

function fixture(nodes = []) {
  return {
    nodes,
    querySelector(selector) { return this.nodes.find(node => `#${node.id}` === selector) || null; },
    ownerDocument: { createElement(tag) { return { tag }; } },
    appendChild(node) { this.nodes.push(node); },
    removeChild() { throw new Error("Never delete a React-owned metadata node"); },
  };
}

test("navigation updates only the dedicated static route nodes", () => {
  const canonical = { id: "qodratak-route-canonical", href: "https://qodratak.sa/" };
  const robots = { id: "qodratak-route-robots", content: "index, follow" };
  const reactMeta = { id: "react-owned", name: "robots", content: "leave unchanged" };
  const head = fixture([canonical, robots, reactMeta]);
  updateRouteHead(head, { canonical: "https://qodratak.sa/admin/dashboard", robots: "noindex, nofollow" });
  assert.equal(canonical.href, "https://qodratak.sa/admin/dashboard");
  assert.equal(robots.content, "noindex, nofollow");
  assert.equal(reactMeta.content, "leave unchanged");
  assert.equal(head.nodes.length, 3);
});

test("missing nodes are created once and partial updates preserve the other directive", () => {
  const head = fixture();
  updateRouteHead(head, { canonical: "https://qodratak.sa/", robots: "index, follow" });
  updateRouteHead(head, { robots: "noindex, nofollow" });
  updateRouteHead(head, {});
  assert.equal(head.nodes.length, 2);
  assert.equal(head.nodes[0].href, "https://qodratak.sa/");
  assert.equal(head.nodes[1].content, "noindex, nofollow");
});

test("route metadata has a single owner, outside React hoisting", () => {
  const seo = readFileSync(new URL("../src/components/SEO.tsx", import.meta.url), "utf8");
  const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  assert.doesNotMatch(seo, /<meta name="robots"|<link rel="canonical"|\.remove\(/);
  assert.match(html, /<meta id="qodratak-route-robots" name="robots"/);
  assert.match(html, /<link id="qodratak-route-canonical" rel="canonical"/);
});
