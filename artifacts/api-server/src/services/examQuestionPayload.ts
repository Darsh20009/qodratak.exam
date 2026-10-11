// Mongoose documents must be unwrapped before object spreading. Lean results
// and legacy storage rows also pass through the same browser-facing contract.
export function examQuestionPayload(question: any) {
  const row = typeof question?.toObject === "function" ? question.toObject() : question;
  const id = row?.questionId ?? row?.id;
  const imageUrls = [...new Set<string>([
    ...(Array.isArray(row?.imageUrls) ? row.imageUrls : []), row?.imageUrl,
  ].filter((url): url is string => typeof url === "string" && url.trim().length > 0))];
  return {
    id, questionId: id, _id: row?._id,
    text: row?.text, options: row?.options, correctOptionIndex: row?.correctOptionIndex,
    category: row?.category, subcategory: row?.subcategory, difficulty: row?.difficulty,
    explanation: row?.explanation, studentTip: row?.studentTip,
    answerStatus: row?.answerStatus, source: row?.source,
    imageUrl: imageUrls[0], imageUrls,
    passage: row?.passage,
  };
}

export function dailyExamQuestions(questions: any[], count = 20) {
  const valid = questions.map(examQuestionPayload).filter(question =>
    Number.isSafeInteger(question.id) && question.id > 0 &&
    question.answerStatus !== "review" && Array.isArray(question.options) && question.options.length >= 4 &&
    Number.isInteger(question.correctOptionIndex) && question.correctOptionIndex >= 0 &&
    question.correctOptionIndex < question.options.length);
  return [...new Map(valid.map(question => [question.id, question])).values()].slice(0, count);
}
