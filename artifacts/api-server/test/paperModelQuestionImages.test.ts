import assert from "node:assert/strict";
import test from "node:test";
import { attachPaperModelSourceImages } from "../src/services/paperModelQuestionImages.ts";

test("paper models receive images only from one exact approved source match", () => {
  const modelQuestions = [
    { id: 105, category: "quantitative", text: "  ما قيمة س؟\n", options: ["١", "٢"] },
    { id: 106, category: "quantitative", text: "سؤال آخر", options: ["أ", "ب"] },
    { id: 107, category: "verbal", text: "سؤال لفظي", options: ["أ", "ب"] },
  ];
  const sourceQuestions = [
    {
      questionId: "105",
      category: "كمي",
      text: "ما قيمة س؟",
      imageUrl: "foundation/quantitative/computer-banks/exam-51/question-001.jpeg",
    },
    {
      questionId: "106",
      category: "quantitative",
      text: "نص مختلف",
      imageUrl: "foundation/quantitative/computer-banks/exam-51/question-002.jpeg",
    },
    {
      questionId: "107",
      category: "verbal",
      text: "سؤال لفظي",
      imageUrl: "foundation/quantitative/computer-banks/exam-51/question-003.jpeg",
    },
  ];

  const enriched = attachPaperModelSourceImages(modelQuestions, sourceQuestions);
  assert.equal(enriched[0].imageUrl, sourceQuestions[0].imageUrl);
  assert.deepEqual(enriched[0].imageUrls, [sourceQuestions[0].imageUrl]);
  assert.equal(enriched[1].imageUrl, undefined);
  assert.equal(enriched[2].imageUrl, sourceQuestions[2].imageUrl);
});

test("ambiguous source matches do not attach an image", () => {
  const question = { id: 105, category: "quantitative", text: "ما قيمة س؟" };
  const image = "foundation/quantitative/computer-banks/exam-51/question-001.jpeg";
  const enriched = attachPaperModelSourceImages([question], [
    { questionId: "105", category: "quantitative", text: "ما قيمة س؟", imageUrl: image },
    { questionId: "105", category: "كمي", text: "ما قيمة س؟", imageUrl: image },
  ]);

  assert.equal(enriched[0].imageUrl, undefined);
});
