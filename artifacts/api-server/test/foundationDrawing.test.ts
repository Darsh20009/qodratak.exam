import assert from "node:assert/strict";
import test from "node:test";
import { appendFoundationPoint, canStartFoundationStroke, foundationStrokePayload, type FoundationPoint } from "../../qodratak/src/lib/foundationDrawing";

test("book pen accepts primary mouse, touch and stylus, but not menus, reading or a second finger", () => {
  for (const pointerType of ["mouse", "touch", "pen"]) {
    assert.equal(canStartFoundationStroke("PEN", { pointerType, button: 0, isPrimary: true }), true);
    assert.equal(canStartFoundationStroke("READ", { pointerType, button: 0, isPrimary: true }), false);
    assert.equal(canStartFoundationStroke("PEN", { pointerType, button: 0, isPrimary: false }), false);
    assert.equal(canStartFoundationStroke("PEN", { pointerType, button: 2, isPrimary: true }), false);
  }
});

test("tap creates a saveable dot and serialization does not mutate the live stroke", () => {
  const original = [{ x: 1 / 3, y: 0.5, pressure: 0.555555 }];
  assert.deepEqual(foundationStrokePayload(original), [
    { x: 0.33333, y: 0.5, pressure: 0.55556 },
    { x: 0.33333, y: 0.5, pressure: 0.55556 },
  ]);
  assert.equal(original[0].x, 1 / 3);
  assert.deepEqual(foundationStrokePayload([]), []);
});

test("long strokes retain first and last points within annotation API limits", () => {
  const points: FoundationPoint[] = [];
  for (let i = 0; i < 10_000; i++) appendFoundationPoint(points, { x: i / 10_000, y: 0.25, pressure: 0.5 });
  assert.equal(points[0].x, 0);
  assert.equal(points.at(-1)!.x, 0.9999);
  assert.ok(points.length <= 1100);
  const payload = foundationStrokePayload(points);
  assert.ok(Buffer.byteLength(JSON.stringify({ points: payload, color: "#e07a5f", lineWidth: 3 })) < 80_000);
  appendFoundationPoint(points, { ...points.at(-1)! });
  assert.equal(points.at(-1)!.x, 0.9999);
});
