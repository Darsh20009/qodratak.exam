type QuestionScore = { category?: string; selectedOptionIndex: number | null; isCorrect: boolean | null };

export function summarizeReportScores(questions: readonly QuestionScore[]) {
  const summarize = (items: readonly QuestionScore[]) => {
    const correct = items.filter((q) => q.selectedOptionIndex !== null && q.isCorrect === true).length;
    const wrong = items.filter((q) => q.selectedOptionIndex !== null && q.isCorrect === false).length;
    const skipped = items.filter((q) => q.selectedOptionIndex === null).length;
    const pending = items.length - correct - wrong - skipped;
    return {
      total: items.length, correct, wrong, skipped, pending,
      percentage: items.length && !pending ? Math.round(correct / items.length * 1000) / 10 : null,
    };
  };
  return {
    overall: summarize(questions),
    quantitative: summarize(questions.filter((q) => ['quantitative', 'الكمي', 'كمي'].includes(q.category || ''))),
    verbal: summarize(questions.filter((q) => ['verbal', 'اللفظي', 'لفظي'].includes(q.category || ''))),
  };
}
