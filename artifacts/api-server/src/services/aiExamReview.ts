import type { IExamBooking, ISectionResult } from '../mongodb/models';
import { ExamGradingError, optionIndex } from './trustedExamGrade';

/** Legacy export name retained for callers. Grading never calls AI or invents
 * experimental credits: the server-stored booking answer snapshot is authority. */
export async function reviewExamBooking(booking: IExamBooking) {
  if (!Array.isArray(booking.sectionResults) || !booking.sectionResults.length) {
    throw new ExamGradingError('لا توجد أقسام محفوظة لإعادة التصحيح');
  }
  const correctedSectionResults: ISectionResult[] = booking.sectionResults.map((section) => {
    const seen = new Set<string>();
    const questions = section.questions.map((q) => {
      if (seen.has(q.questionId)) throw new ExamGradingError('سؤال مكرر في القسم المحفوظ');
      seen.add(q.questionId);
      const key = optionIndex(q.correctAnswer);
      const selected = optionIndex(q.studentAnswer);
      if (key === null || key > 3 || (selected !== null && selected > 3)) {
        throw new ExamGradingError('مفتاح الإجابة المحفوظ غير صالح؛ يحتاج مراجعة بشرية');
      }
      return { ...q, isExperimental: false, isCorrect: selected !== null && selected === key,
        studentAnswer: selected === null ? null : String(selected) };
    });
    return {
      ...section, questions,
      correctCount: questions.filter((q) => q.isCorrect).length,
      wrongCount: questions.filter((q) => q.studentAnswer !== null && !q.isCorrect).length,
      skippedCount: questions.filter((q) => q.studentAnswer === null).length,
    };
  });
  let verbalCorrect = 0, verbalTotal = 0, quantCorrect = 0, quantTotal = 0;
  for (const section of correctedSectionResults) {
    for (const q of section.questions) {
      const cat = (q.category || '').toLowerCase();
      const verbal = /verbal|لفظ/.test(cat) || (!/quant|كم/.test(cat) && section.sectionIndex % 2 === 0);
      if (verbal) { verbalTotal++; if (q.isCorrect) verbalCorrect++; }
      else { quantTotal++; if (q.isCorrect) quantCorrect++; }
    }
  }
  const totalCorrect = correctedSectionResults.reduce((sum, s) => sum + s.correctCount, 0);
  const verbalPercent = verbalTotal ? Math.round(verbalCorrect / verbalTotal * 100) : 0;
  const quantPercent = quantTotal ? Math.round(quantCorrect / quantTotal * 100) : 0;
  const presentSubjects = Number(verbalTotal > 0) + Number(quantTotal > 0);
  const overall = presentSubjects ? Math.round((verbalPercent + quantPercent) / presentSubjects) : 0;
  return {
    correctedSectionResults,
    correctedTotalScore: totalCorrect,
    correctedVerbalScore: verbalPercent,
    correctedQuantScore: quantPercent,
    correctedTotalScoreOutOf100: overall,
    correctedVerbalPercent: verbalPercent,
    correctedQuantPercent: quantPercent,
    correctedCorrectAnswers: totalCorrect,
    correctedWrongAnswers: correctedSectionResults.reduce((sum, s) => sum + s.wrongCount, 0),
    correctedSkippedAnswers: correctedSectionResults.reduce((sum, s) => sum + s.skippedCount, 0),
  };
}
