import assert from "node:assert/strict";
import test from "node:test";
import { matchesVerbalQuestionSection } from "../src/lib/verbalSectionMatching.ts";

test("matches Arabic and English computerized verbal section labels", () => {
  assert.equal(matchesVerbalQuestionSection({ category: "verbal", subcategory: "التناظر اللفظي" }, "analogy"), true);
  assert.equal(matchesVerbalQuestionSection({ category: "verbal", source: { section: "Verbal Analogy" } }, "analogy"), true);
  assert.equal(matchesVerbalQuestionSection({ category: "verbal", subcategory: "إكمال الجمل" }, "sentence-completion"), true);
  assert.equal(matchesVerbalQuestionSection({ category: "verbal", source: { section: "Reading Comprehension" } }, "reading-comprehension"), true);
  assert.equal(matchesVerbalQuestionSection({ category: "verbal", subcategory: "الخطأ السياقي" }, "contextual-error"), true);
});

test("does not place questions from another verbal section into a lesson quiz", () => {
  assert.equal(matchesVerbalQuestionSection({ category: "verbal", subcategory: "استيعاب المقروء" }, "analogy"), false);
  assert.equal(matchesVerbalQuestionSection({ category: "verbal", subcategory: "التناظر اللفظي" }, "sentence-completion"), false);
  assert.equal(matchesVerbalQuestionSection({ category: "verbal", subcategory: "التناظر اللفظي" }, "unknown"), false);
});
