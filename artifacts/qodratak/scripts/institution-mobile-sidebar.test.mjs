import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const layout = await readFile(new URL("../src/components/layouts/RoleBasedLayout.tsx", import.meta.url), "utf8");
const sidebar = await readFile(new URL("../src/components/ui/sidebar.tsx", import.meta.url), "utf8");
const styles = await readFile(new URL("../src/index.css", import.meta.url), "utf8");

test("institution management sidebar opens from the right and uses RTL direction", () => {
  assert.match(layout, /side=\{isInstitutionAdmin \? 'right' : 'left'\}/);
  assert.match(layout, /dir=\{isInstitutionAdmin \? 'rtl' : undefined\}/);
  assert.match(layout, /<div className="flex h-screen w-full" dir=\{isInstitutionAdmin \? 'rtl' : undefined\}>/);
});

test("the institution sidebar panel keeps its custom background in both mobile and desktop layouts", () => {
  assert.match(layout, /contentClassName=\{isInstitutionAdmin \? 'qodratak-institution-sidebar-panel' : undefined\}/);
  assert.match(sidebar, /className=\{cn\([\s\S]*?contentClassName[\s\S]*?\)\}\s+dir=\{dir\}[\s\S]*?side=\{side\}/);
  assert.match(sidebar, /data-sidebar="sidebar"[\s\S]*?className=\{cn\([\s\S]*?contentClassName/);
  assert.match(styles, /\.qodratak-institution-sidebar-panel\s*\{[\s\S]*?background-color:\s*#0A1726\s*!important/);
});
