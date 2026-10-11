export type ExamResultSummary = {
  title: string; totalQuestions: number; correctAnswers: number;
  percentage: number; timeTaken?: number; booked?: boolean;
};

export function examResultSummary(result: any, booked = false): ExamResultSummary | null {
  const total = Number(result.totalQuestions);
  const correct = Number(result.correctAnswers ?? result.score);
  if (!Number.isSafeInteger(total) || total <= 0 || !Number.isSafeInteger(correct) || correct < 0 || correct > total) return null;
  const percentage = booked ? Number(result.totalScoreOutOf100) : correct / total * 100;
  if (!Number.isFinite(percentage) || percentage < 0 || percentage > 100) return null;
  const names: Record<string, string> = {
    verbal: 'اختبار اللفظي', quantitative: 'اختبار الكمي', qiyas: 'اختبار المحاكاة',
    custom: 'اختبار مخصص', paper_model: 'نموذج ورقي', standard: 'اختبار قياسي',
    qudrat_scientific: 'محاكاة قدرات علمي', qudrat_literary: 'محاكاة قدرات أدبي',
  };
  return {
    title: String(result.testName || result.title || names[result.testType || result.examType] || 'اختبار القدرات').slice(0, 150),
    totalQuestions: total, correctAnswers: correct, percentage, booked,
    timeTaken: Number.isFinite(result.timeTaken) && result.timeTaken > 0 ? result.timeTaken : undefined,
  };
}

export function normalizeResultPhone(value: unknown) {
  let digits = String(value || '').replace(/\D/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (/^05\d{8}$/.test(digits)) digits = `966${digits.slice(1)}`;
  else if (/^5\d{8}$/.test(digits)) digits = `966${digits}`;
  return /^\d{8,15}$/.test(digits) ? digits : '';
}

export function examResultMessage(summary: ExamResultSummary) {
  return [
    'نتيجة اختبارك في منصة قدراتك',
    `الاختبار: ${summary.title}`,
    summary.booked ? `الدرجة: ${Math.round(summary.percentage)}/100`
      : `النتيجة: ${summary.correctAnswers} من ${summary.totalQuestions} (${Math.round(summary.percentage)}%)`,
    `الإجابات الصحيحة: ${summary.correctAnswers}`,
    `الأسئلة غير الصحيحة أو المتروكة: ${summary.totalQuestions - summary.correctAnswers}`,
    ...(summary.timeTaken ? [`الوقت: ${(summary.timeTaken / 60).toFixed(1)} دقيقة`] : []),
    'للتصحيح وشرح الأسئلة والتقرير المفصل، افتح «نتائجي» في حسابك.',
    'هذه نتيجة تدريب داخل المنصة، وليست درجة اختبار قياس الرسمي.',
  ].join('\n');
}
