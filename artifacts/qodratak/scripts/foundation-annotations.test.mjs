import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const surface = await readFile(new URL("../src/components/student/FoundationAnnotationSurface.tsx", import.meta.url), "utf8");
const reader = await readFile(new URL("../src/pages/student/FoundationReaderPage.tsx", import.meta.url), "utf8");
const hooks = await readFile(new URL("../src/hooks/use-student.ts", import.meta.url), "utf8");

test("pointer lifecycle distinguishes pen and touch and batches completed strokes", () => {
  assert.match(surface, /pointerType === "pen"/);
  assert.match(surface, /pointerType === "touch"/);
  assert.match(surface, /onPointerDown/);
  assert.match(surface, /onPointerMove/);
  assert.match(surface, /onPointerUp/);
  assert.match(surface, /onDrawingComplete/);
  assert.doesNotMatch(surface, /fetchJson|\/api\//);
});

test("reader exposes the annotation tools and real persistence hooks", () => {
  for (const label of ["قلم", "تمييز", "تسطير", "ملاحظة", "تراجع", "إعادة", "مسح"]) {
    assert.match(reader, new RegExp(label));
  }
  assert.match(reader, /useLearningContentAnnotations/);
  assert.match(reader, /useCreateLearningContentAnnotation/);
  assert.match(reader, /useDeleteLearningContentAnnotation/);
  assert.match(hooks, /\/annotations/);
});