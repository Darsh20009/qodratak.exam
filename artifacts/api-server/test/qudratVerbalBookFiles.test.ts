import assert from "node:assert/strict";
import test from "node:test";
import {
  getQudratVerbalBookFile,
  QUDRAT_VERBAL_BOOK_FILES,
} from "../src/services/qudratVerbalBookFilesService.ts";

test("lists one PDF for each supplied computerized verbal section", () => {
  assert.deepEqual(
    QUDRAT_VERBAL_BOOK_FILES.map((file) => file.section),
    ["إكمال الجمل", "استيعاب المقروء", "الخطأ السياقي", "التناظر اللفظي"],
  );
  assert.equal(
    new Set(QUDRAT_VERBAL_BOOK_FILES.map((file) => file.objectKey)).size,
    4,
  );
  assert.ok(
    QUDRAT_VERBAL_BOOK_FILES.every((file) =>
      file.objectKey.startsWith("foundation/verbal/computerized-files/"),
    ),
  );
});

test("only returns configured verbal PDF ids", () => {
  assert.equal(
    getQudratVerbalBookFile("sentence-completion")?.section,
    "إكمال الجمل",
  );
  assert.equal(getQudratVerbalBookFile("../../secret"), undefined);
});