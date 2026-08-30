import { apiRequest } from "./queryClient";

/**
 * حساب وإرسال نتائج الاختبار مع النقاط المكتسبة
 */
export async function saveTestResultsWithPoints(params: {
  userId: number;
  testType: string;
  difficulty: string;
  correctAnswers: number;
  totalQuestions: number;
  skippedQuestions: number;
  timeTaken?: number;
}): Promise<{pointsEarned?: number; badges?: any[]}> {
  try {
    const response = await apiRequest('POST', '/api/test-results', {
      userId: params.userId,
      testType: params.testType,
      difficulty: params.difficulty,
      score: params.correctAnswers,
      totalQuestions: params.totalQuestions,
      skippedQuestions: params.skippedQuestions,
      timeTaken: params.timeTaken
    }) as any;

    // حفظ النقاط المكتسبة في localStorage للعرض
    if (response?.pointsEarned !== undefined) {
      localStorage.setItem('lastExamPointsEarned', response.pointsEarned.toString());
    }

    // إطلاق حدث تحديث النقاط
    window.dispatchEvent(new Event('pointsUpdated'));

    return {
      pointsEarned: response?.pointsEarned,
      badges: response?.badges
    };
  } catch (error) {
    console.error('Failed to save test results:', error);
    return {};
  }
}

/**
 * استرجاع النقاط المكتسبة من آخر اختبار
 */
export function getLastExamPoints(): number {
  const points = localStorage.getItem('lastExamPointsEarned');
  return points ? parseFloat(points) : 0;
}

/**
 * مسح النقاط المحفوظة
 */
export function clearLastExamPoints(): void {
  localStorage.removeItem('lastExamPointsEarned');
}
