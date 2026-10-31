import assert from "node:assert/strict";
import test from "node:test";
import { createPaperModelPrintHtml, getPaperModelPrintPageCount } from "../src/pages/paper-model-print.ts";

function sampleQuestions(count: number) {
  return Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    category: "verbal",
    text: `سؤال تجريبي ${index + 1}`,
    options: ["أ", "ب", "ج", "د"],
    correctOptionIndex: index % 4,
  }));
}

test("120-question paper model follows the reference page structure", () => {
  const html = createPaperModelPrintHtml(sampleQuestions(120), "نموذج 1");

  assert.match(html, /اختبار القدرات العامة/);
  assert.equal((html.match(/class="bubble-row"/g) ?? []).length, 120);
  assert.equal((html.match(/class="bubble-column"/g) ?? []).length, 5);
  assert.equal((html.match(/class="sheet sections-summary-page"/g) ?? []).length, 1);
  assert.equal((html.match(/class="sheet question-page"/g) ?? []).length, 10);
  assert.equal((html.match(/class="question-card/g) ?? []).length, 120);
  assert.equal((html.match(/class="sheet /g) ?? []).length, 13);
  assert.match(html, /grid-template-rows:repeat\(6,minmax\(0,1fr\)\)/);
  assert.match(html, /إقرار وتعهد/);
  assert.match(html, /أتعهد بالإجابة بنفسي/);
});

test("complex questions do not add extra sheets to a 13-page model", () => {
  const questions = sampleQuestions(120).map((question, index) => index < 4
    ? { ...question, text: "سؤال طويل ".repeat(80), imageUrls: ["https://example.com/a.png", "https://example.com/b.png"] }
    : question);
  const html = createPaperModelPrintHtml(questions, "نموذج ١");

  assert.equal((html.match(/class="sheet /g) ?? []).length, 13);
  assert.equal((html.match(/class="sheet question-page"/g) ?? []).length, 10);
  assert.equal((html.match(/class="question-card/g) ?? []).length, 120);
});

test("115-question models also fit into 13 sheets", () => {
  const html = createPaperModelPrintHtml(sampleQuestions(115), "نموذج 84");

  assert.equal((html.match(/class="sheet /g) ?? []).length, 13);
  assert.equal((html.match(/class="sheet question-page"/g) ?? []).length, 10);
});

test("partial models are not padded with blank sheets", () => {
  assert.equal(getPaperModelPrintPageCount(120), 13);
  assert.equal(getPaperModelPrintPageCount(115), 13);
  assert.notEqual(getPaperModelPrintPageCount(11), 13);
});

test("solved bubble sheet fills only the server-confirmed answer choice", () => {
  const html = createPaperModelPrintHtml(sampleQuestions(120), "نموذج 1", "solved-answers");

  assert.equal((html.match(/class="bubble filled"/g) ?? []).length, 120);
  assert.equal((html.match(/class="sheet section-page"/g) ?? []).length, 0);
  assert.equal((html.match(/class="sheet answer-sheet"/g) ?? []).length, 1);
});
