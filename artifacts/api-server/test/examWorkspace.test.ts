import assert from "node:assert/strict";
import test from "node:test";
import { clearSketch, commitStroke, emptySketch, normalizePoint, redoSketch, strokeWidth, undoSketch, drawStroke, type NotebookStroke } from "../../qodratak/src/lib/examNotebook";
import { enterExamFocus, exitExamFocus, isExamFocusMode } from "../../qodratak/src/lib/examDisplayMode";

const pen: NotebookStroke = { color: "#14213d", size: 4, erase: false, points: [{ x: 0.1, y: 0.2 }, { x: 0.4, y: 0.6 }] };
const eraser: NotebookStroke = { ...pen, erase: true };

test("notebook coordinates are normalized, clamped and safe for an unmeasured canvas", () => {
  assert.deepEqual(normalizePoint(150, 120, { left: 100, top: 100, width: 200, height: 40 }), { x: 0.25, y: 0.5 });
  assert.deepEqual(normalizePoint(-10, 500, { left: 0, top: 0, width: 100, height: 100 }), { x: 0, y: 1 });
  assert.deepEqual(normalizePoint(10, 10, { left: 0, top: 0, width: 0, height: 0 }), { x: 0, y: 0 });
});

test("eraser undo/redo restores the original ordered drawing without mutating snapshots", () => {
  const initial = emptySketch();
  const drawn = commitStroke(initial, pen);
  const erased = commitStroke(drawn, eraser);
  assert.deepEqual(undoSketch(erased).strokes, [pen]);
  assert.deepEqual(redoSketch(undoSketch(erased)).strokes, [pen, eraser]);
  assert.deepEqual(drawn.strokes, [pen]);
  assert.deepEqual(initial.strokes, []);
  const replacement = commitStroke(undoSketch(erased), { ...pen, color: "#be123c" });
  assert.equal(replacement.redo.length, 0);
});

test("empty operations are no-ops and clearing drawing is undoable", () => {
  const blank = emptySketch();
  assert.equal(undoSketch(blank), blank);
  assert.equal(redoSketch(blank), blank);
  assert.equal(clearSketch(blank), blank);
  assert.equal(commitStroke(blank, { ...pen, points: [] }), blank);
  const drawn = commitStroke(blank, pen);
  assert.deepEqual(undoSketch(clearSketch(drawn)).strokes, [pen]);
});

test("width scales proportionally and erasing never paints a white line over the grid", () => {
  assert.equal(strokeWidth(4, 320, false), 4);
  assert.equal(strokeWidth(4, 640, false), 8);
  assert.equal(strokeWidth(4, 320, true), 16);
  const paths: number[][] = [];
  const ctx = {
    save() {}, restore() {}, beginPath() {}, stroke() {}, fill() {}, arc() {},
    moveTo(x: number, y: number) { paths.push([x, y]); },
    lineTo(x: number, y: number) { paths.push([x, y]); },
    globalCompositeOperation: "",
  };
  drawStroke(ctx as unknown as CanvasRenderingContext2D, eraser, 320, 200);
  assert.equal(ctx.globalCompositeOperation, "destination-out");
  assert.deepEqual(paths, [[32, 40], [128, 120]]);
});

test("long writing sessions keep every stroke with bounded undo history", () => {
  let sketch = emptySketch();
  for (let i = 0; i < 200; i++) sketch = commitStroke(sketch, pen);
  assert.equal(sketch.strokes.length, 200);
  assert.equal(sketch.undo.length, 64);
  for (let i = 0; i < 64; i++) sketch = undoSketch(sketch);
  assert.equal(sketch.strokes.length, 136);
  for (let i = 0; i < 64; i++) sketch = redoSketch(sketch);
  assert.equal(sketch.strokes.length, 200);
  assert.equal(sketch.undo.length, 64);
});

test("fullscreen denial/unsupported browsers explicitly use page focus, native exit restores normal display", async () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, "document");
  const doc = {
    fullscreenElement: null as object | null,
    documentElement: { dataset: {} as Record<string, string>, requestFullscreen: undefined as (() => Promise<void>) | undefined },
    dispatchEvent() { return true; },
    async exitFullscreen() { doc.fullscreenElement = null; },
  };
  Object.defineProperty(globalThis, "document", { configurable: true, value: doc });
  try {
    assert.equal(await enterExamFocus(), "page");
    assert.equal(isExamFocusMode(), true);
    await exitExamFocus();
    assert.equal(isExamFocusMode(), false);
    doc.documentElement.requestFullscreen = async () => { throw new Error("Permission denied"); };
    assert.equal(await enterExamFocus(), "page");
    assert.equal(isExamFocusMode(), true);
    await exitExamFocus();
    doc.documentElement.requestFullscreen = async () => { doc.fullscreenElement = doc.documentElement; };
    assert.equal(await enterExamFocus(), "native");
    assert.equal(doc.documentElement.dataset.examFocusMode, undefined);
    assert.equal(isExamFocusMode(), true);
    await exitExamFocus();
    assert.equal(isExamFocusMode(), false);
  } finally {
    if (original) Object.defineProperty(globalThis, "document", original);
    else Reflect.deleteProperty(globalThis, "document");
  }
});
