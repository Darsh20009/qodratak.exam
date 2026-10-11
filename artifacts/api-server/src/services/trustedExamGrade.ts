export class ExamGradingError extends Error {}

export function optionIndex(value: unknown): number | null {
  if (value === null || value === undefined || value === '' || value === -1 || value === '-1') return null;
  if (typeof value !== 'number' && typeof value !== 'string') throw new ExamGradingError('الإجابة ليست رقم خيار صالحًا');
  if (typeof value === 'string' && !/^\d+$/.test(value.trim())) throw new ExamGradingError('الإجابة ليست رقم خيار صالحًا');
  const index = typeof value === 'number' ? value : Number(value);
  if (!Number.isInteger(index) || index < 0) throw new ExamGradingError('الإجابة ليست رقم خيار صالحًا');
  return index;
}

export interface GradingQuestion {
  _id: unknown;
  options: string[];
  correctOptionIndex: number;
  answerStatus?: string;
}

/** Grade the complete scored roster, including unanswered questions, never client totals. */
export function gradeTrustedExam(
  questions: GradingQuestion[],
  answers: Array<{ questionId?: unknown; id?: unknown; selectedAnswer?: unknown; selectedOptionIndex?: unknown }>,
) {
  if (!questions.length) throw new ExamGradingError('لا توجد أسئلة معتمدة قابلة للتصحيح');
  const roster = new Map<string, GradingQuestion>();
  for (const question of questions) {
    const id = String(question._id);
    if (roster.has(id) || question.answerStatus !== 'approved' ||
      !Array.isArray(question.options) || question.options.length < 2 ||
      question.options.some((o) => typeof o !== 'string' || !o.trim()) ||
      new Set(question.options.map((o) => o.trim())).size !== question.options.length ||
      !Number.isInteger(question.correctOptionIndex) || question.correctOptionIndex < 0 ||
      question.correctOptionIndex >= question.options.length) {
      throw new ExamGradingError('أحد الأسئلة غير معتمد أو يحتوي على مفتاح أو خيارات غير صالحة');
    }
    roster.set(id, question);
  }
  let correct = 0;
  let answered = 0;
  const seen = new Set<string>();
  for (const answer of answers) {
    const id = String(answer.questionId ?? answer.id ?? '');
    const question = roster.get(id);
    if (!question || seen.has(id)) throw new ExamGradingError('قائمة الإجابات تحتوي على سؤال مجهول أو مكرر');
    seen.add(id);
    const selected = optionIndex(answer.selectedAnswer ?? answer.selectedOptionIndex);
    if (selected === null) continue;
    if (selected >= question.options.length) throw new ExamGradingError('الإجابة خارج خيارات السؤال');
    answered++;
    if (selected === question.correctOptionIndex) correct++;
  }
  return {
    score: correct,
    totalQuestions: questions.length,
    wrongAnswers: answered - correct,
    skippedQuestions: questions.length - answered,
    percentage: Math.round(correct / questions.length * 10000) / 100,
  };
}
