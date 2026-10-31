export interface PaperModelQuestionTotals {
  id: number;
  modelNumber: number;
  totalQuestions: number;
  verbalCount: number;
  quantitativeCount: number;
  trialVerbalCount?: number;
  trialQuantCount?: number;
}

export class PaperModelScoreError extends Error {
  constructor(
    message: string,
    readonly statusCode: 400 | 422,
  ) {
    super(message);
    this.name = "PaperModelScoreError";
  }
}

export function calculatePaperModelScore(
  model: PaperModelQuestionTotals,
  verbalCorrect: number,
  quantitativeCorrect: number,
) {
  const verbalTotal = Number(model.verbalCount);
  const quantitativeTotal = Number(model.quantitativeCount);
  const totalQuestions = Number(model.totalQuestions);

  if (
    !Number.isSafeInteger(verbalTotal) || verbalTotal < 0 ||
    !Number.isSafeInteger(quantitativeTotal) || quantitativeTotal < 0 ||
    !Number.isSafeInteger(totalQuestions) || totalQuestions < 1 ||
    verbalTotal + quantitativeTotal !== totalQuestions
  ) {
    throw new PaperModelScoreError("توزيع أسئلة النموذج غير مكتمل", 422);
  }

  if (
    !Number.isSafeInteger(verbalCorrect) || verbalCorrect < 0 || verbalCorrect > verbalTotal ||
    !Number.isSafeInteger(quantitativeCorrect) || quantitativeCorrect < 0 || quantitativeCorrect > quantitativeTotal
  ) {
    throw new PaperModelScoreError(
      `عدد الإجابات الصحيحة يتجاوز إجمالي أسئلة النموذج (${verbalTotal} لفظي و${quantitativeTotal} كمي)`,
      400,
    );
  }

  const totalCorrect = verbalCorrect + quantitativeCorrect;
  return {
    verbalCorrect,
    verbalTotal,
    verbalPercentage: verbalTotal ? Math.round((verbalCorrect / verbalTotal) * 100) : 0,
    quantitativeCorrect,
    quantitativeTotal,
    quantitativePercentage: quantitativeTotal ? Math.round((quantitativeCorrect / quantitativeTotal) * 100) : 0,
    totalQuestions,
    totalCorrect,
    totalPercentage: Math.round((totalCorrect / totalQuestions) * 100),
  };
}
