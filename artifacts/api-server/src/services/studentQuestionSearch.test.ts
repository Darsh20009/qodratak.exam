import assert from "node:assert/strict";
import test from "node:test";
import {
  buildStudentQuestionSearchFilter,
  escapeQuestionSearchRegex,
  normalizeStudentQuestionSearchQuery,
  rankStudentQuestionSearchResults,
  toStudentQuestionSearchResult,
} from "./studentQuestionSearch";

test("normalizes Arabic/Persian digits, diacritics, and whitespace", () => {
  assert.equal(normalizeStudentQuestionSearchQuery("  سُؤال   ١٢۳  "), "سؤال 123");
  assert.equal(normalizeStudentQuestionSearchQuery("   "), null);
  assert.equal(normalizeStudentQuestionSearchQuery("x".repeat(241)), null);
});

test("escapes regex syntax and only searches approved content", () => {
  const query = "سؤال (أ)";
  assert.equal(escapeQuestionSearchRegex(query), "سؤال \\(أ\\)");
  const filter = buildStudentQuestionSearchFilter(query, "verbal") as any;
  assert.equal(filter.answerStatus, "approved");
  assert.equal(filter.category, "verbal");
  assert.ok(filter.$or.some((condition: Record<string, unknown>) => "text" in condition));
  assert.ok(!JSON.stringify(filter).includes("correctOptionIndex"));
});

test("numeric search uses the actual question number", () => {
  const filter = buildStudentQuestionSearchFilter("١٢") as any;
  assert.deepEqual(filter.$or[0], { questionId: 12 });
});

test("ranks exact question ids and phrase matches ahead of partial matches", () => {
  const questions = [
    { questionId: 3, category: "verbal" as const, subcategory: "عام", text: "ما العلاقة بين الشمس والقمر؟", options: [], difficulty: "beginner" },
    { questionId: 2, category: "verbal" as const, subcategory: "عام", text: "اختر الإجابة الصحيحة", options: [], difficulty: "beginner" },
    { questionId: 12, category: "quantitative" as const, subcategory: "هندسة", text: "سؤال مختلف", options: [], difficulty: "intermediate" },
  ];

  assert.equal(rankStudentQuestionSearchResults(questions, "الشمس والقمر")[0]?.questionId, 3);
  assert.equal(rankStudentQuestionSearchResults(questions, "١٢")[0]?.questionId, 12);
});

test("student results never include answer keys or explanation fields", () => {
  const result = toStudentQuestionSearchResult({
    questionId: 1,
    category: "quantitative",
    subcategory: "هندسة",
    text: "السؤال",
    options: ["أ", "ب", "ج", "د"],
    difficulty: "beginner",
    imageUrl: "/question.png",
    correctOptionIndex: 2,
    explanation: "private answer explanation",
  } as any);

  assert.equal(result.imageUrl, "/question.png");
  assert.ok(!("correctOptionIndex" in result));
  assert.ok(!("explanation" in result));
});
