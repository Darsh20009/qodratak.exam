import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

const source = await readFile(new URL("../src/pages/admin/WhatsAppAdminTab.tsx", import.meta.url), "utf8");
const ast = ts.createSourceFile("WhatsAppAdminTab.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const fields = [];
const buttons = [];
function visit(node) {
  if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
    const name = node.tagName.getText(ast);
    const attrs = Object.fromEntries(node.attributes.properties
      .filter(ts.isJsxAttribute).map(attr => [attr.name.getText(ast), attr.initializer?.getText(ast)]));
    if (["Input", "Textarea", "select"].includes(name)) fields.push(attrs);
    if (name === "button") buttons.push(attrs);
  }
  ts.forEachChild(node, visit);
}
visit(ast);

test("all campaign fields use theme-aware backgrounds and readable text", () => {
  assert.equal(fields.length, 5);
  for (const field of fields) {
    assert.match(field.className, /text-foreground/);
    assert.doesNotMatch(field.className, /bg-white/);
  }
  assert.match(source, /dark:bg-emerald-950\/20/);
  assert.doesNotMatch(source, /bg-\[#F2FBF7\]|text-\[#24202D\]|text-\[#625D69\]/);
});

test("disabled actions remain visibly labelled, with keyboard focus styling", () => {
  assert.equal(buttons.length, 6);
  for (const button of buttons) {
    assert.ok(button.disabled, "existing disabled guard must remain");
    assert.match(button.className, /disabled:text-muted-foreground/);
    assert.match(button.className, /focus-visible:ring-2/);
    assert.doesNotMatch(button.className, /disabled:opacity/);
    // The admin light-theme bridge recolors literal text-white; avoid it.
    assert.doesNotMatch(button.className, /(?:\s|")text-white(?:\s|")/);
  }
});

function luminance(hex) {
  return hex.match(/\w\w/g).map(value => parseInt(value, 16) / 255)
    .map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4)
    .reduce((sum, value, index) => sum + value * [.2126, .7152, .0722][index], 0);
}
test("WhatsApp action and status colors meet normal-text contrast in both themes", () => {
  for (const [ink, paper] of [
    ["ecfdf5", "047857"], // send button
    ["065f46", "ecfdf5"], // light financial report
    ["a7f3d0", "022c22"], // dark financial report
    ["b91c1c", "ffffff"], // light disconnect
    ["fca5a5", "0f1c24"], // dark disconnect
  ]) {
    const a = luminance(ink), b = luminance(paper);
    assert.ok((Math.max(a, b) + .05) / (Math.min(a, b) + .05) >= 4.5, `${ink} on ${paper}`);
  }
});
