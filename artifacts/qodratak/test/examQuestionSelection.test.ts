import { test } from "node:test";
import assert from "node:assert/strict";
import { selectExamSection, validExamPool } from "../src/lib/examQuestionSelection";

test("the exam roster excludes unapproved, blank and duplicated choices before starting", () => {
  const q = { id: 1, category: "quantitative", options: ["أ", "ب", "ج", "د"], correctOptionIndex: 0, answerStatus: "approved" };
  assert.deepEqual(validExamPool([
    q, { ...q, id: 2, answerStatus: undefined }, { ...q, id: 3, options: ["أ", "أ", "ج", "د"] },
    { ...q, id: 4, options: ["أ", "  ", "ج", "د"] },
  ]).map(row => row.id), [1]);
});

function question(id: number, category = "verbal", answerStatus = "approved") {
  return { id, text: `Question ${id}`, category, options: ["A", "B", "C", "D"], correctOptionIndex: 0, answerStatus };
}

test("section selection preserves unique canonical identities and exact category counts", () => {
  const pool = [...Array.from({ length: 70 }, (_, i) => question(i + 1)),
    ...Array.from({ length: 60 }, (_, i) => question(i + 101, "quantitative"))];
  const used = new Set<number>();
  const sections = Array.from({ length: 3 }, () => ({ name: "مختلط", category: "mixed" as const, questionCount: 24, verbalCount: 13, quantitativeCount: 11 }));
  const selected = sections.flatMap(section => {
    const rows = selectExamSection(pool, section, used);
    assert.equal(rows.filter(q => q.category === "verbal").length, 13);
    assert.equal(rows.filter(q => q.category === "quantitative").length, 11);
    return rows;
  });
  assert.equal(new Set(selected.map(q => q.id)).size, 72);
  assert.ok(selected.every(q => pool.includes(q)));
});

test("insufficient or unreviewed questions never cause looping, fabricated IDs or category padding", () => {
  const pool = [question(1), question(2), question(3, "verbal", "review"),
    question(1), question(4, "tahsili"), { ...question(5), correctOptionIndex: -1 },
    { ...question(6), id: 6.5 }];
  assert.deepEqual(validExamPool(pool).map(q => q.id), [1, 2]);
  assert.throws(() => selectExamSection(pool, { name: "كمي", category: "quantitative", questionCount: 5 }, new Set()));
  assert.throws(() => selectExamSection(pool, { name: "لفظي", category: "verbal", questionCount: 2 }, new Set([1])));
  const rows = selectExamSection(pool, { name: "لفظي", category: "verbal", questionCount: 2 }, new Set());
  assert.deepEqual(new Set(rows.map(q => q.id)), new Set([1, 2]));
});

test("rare-subcategory balancing cannot duplicate padding questions", () => {
  const pool = Array.from({ length: 50 }, (_, i) => ({
    ...question(i + 1), subcategory: i < 2 ? "التناظر اللفظي" : "استيعاب المقروء",
  }));
  for (let run = 0; run < 30; run++) {
    const rows = selectExamSection(pool, { name: "لفظي", category: "verbal", questionCount: 30 }, new Set());
    assert.equal(rows.length, 30);
    assert.equal(new Set(rows.map(q => q.id)).size, 30);
  }
});
