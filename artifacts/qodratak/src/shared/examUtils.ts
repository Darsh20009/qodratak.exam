import type { TestType } from "./types";

export interface SubcategoryDistribution {
  subcategory: string;
  questionsPerSubcategory: number;
  totalQuestions: number;
}

export interface SubcategoryResult {
  subcategory: string;
  correct: number;
  total: number;
  percentage: number;
  level: "ممتاز" | "جيد جداً" | "جيد" | "يحتاج تحسين";
  color: string;
}

export interface DetailedExamResult {
  totalScore: number;
  totalQuestions: number;
  overallPercentage: number;
  verbalResults: SubcategoryResult[];
  quantitativeResults: SubcategoryResult[];
  timeTaken: number;
  level: string;
  achievements: string[];
}

export const VERBAL_SUBCATEGORIES = [
  "التناظر اللفظي",
  "إكمال الجمل",
  "استيعاب المقروء",
  "الخطأ السياقي",
  "المفردة الشاذة",
];

export const QUANTITATIVE_SUBCATEGORIES = [
  "الهندسة",
  "عمليات حسابية",
  "المقارنات",
  "النسبة المئوية",
  "النسبة والتناسب",
  "المعادلات",
  "الإحصاء",
  "الحركة والأنماط",
];

export function calculateBalancedDistribution(
  totalQuestions: number,
  category: TestType,
): SubcategoryDistribution[] {
  const subcategories =
    category === "verbal"
      ? VERBAL_SUBCATEGORIES
      : category === "quantitative"
        ? QUANTITATIVE_SUBCATEGORIES
        : [...VERBAL_SUBCATEGORIES, ...QUANTITATIVE_SUBCATEGORIES];
  const questionsPerSubcategory = Math.floor(
    totalQuestions / subcategories.length,
  );
  const remainder = totalQuestions % subcategories.length;

  return subcategories.map((subcategory, index) => ({
    subcategory,
    questionsPerSubcategory:
      questionsPerSubcategory + (index < remainder ? 1 : 0),
    totalQuestions,
  }));
}

export function getBalancedQuestions(
  allQuestions: any[],
  distribution: SubcategoryDistribution[],
): any[] {
  const selected: any[] = [];

  distribution.forEach(({ subcategory, questionsPerSubcategory }) => {
    const matching = allQuestions.filter(
      (question) => question.subcategory === subcategory,
    );
    if (matching.length >= questionsPerSubcategory) {
      selected.push(
        ...[...matching]
          .sort(() => Math.random() - 0.5)
          .slice(0, questionsPerSubcategory),
      );
      return;
    }

    selected.push(...matching);
    const padding = allQuestions
      .filter(
        (question) =>
          question.category === matching[0]?.category &&
          question.subcategory !== subcategory,
      )
      .sort(() => Math.random() - 0.5)
      .slice(0, questionsPerSubcategory - matching.length);
    selected.push(...padding);
  });

  return selected.sort(() => Math.random() - 0.5);
}

function buildSubcategoryResults(
  questions: any[],
  answers: Record<number, number>,
  subcategories: string[],
): SubcategoryResult[] {
  return subcategories
    .map((subcategory) => {
      const matching = questions.filter(
        (question) => question.subcategory === subcategory,
      );
      const correct = matching.filter(
        (question) => answers[question.id] === question.correctOptionIndex,
      ).length;
      const total = matching.length;
      const percentage = total > 0 ? (correct / total) * 100 : 0;
      const level =
        percentage >= 85
          ? "ممتاز"
          : percentage >= 70
            ? "جيد جداً"
            : percentage >= 50
              ? "جيد"
              : "يحتاج تحسين";
      const color =
        percentage >= 85
          ? "text-green-600"
          : percentage >= 70
            ? "text-blue-600"
            : percentage >= 50
              ? "text-yellow-600"
              : "text-red-600";
      return { subcategory, correct, total, percentage, level, color };
    })
    .filter((result) => result.total > 0);
}

export function calculateDetailedResults(
  questions: any[],
  answers: Record<number, number>,
  timeTaken = 0,
): DetailedExamResult {
  const verbalResults = buildSubcategoryResults(
    questions.filter((question) => question.category === "verbal"),
    answers,
    VERBAL_SUBCATEGORIES,
  );
  const quantitativeResults = buildSubcategoryResults(
    questions.filter((question) => question.category === "quantitative"),
    answers,
    QUANTITATIVE_SUBCATEGORIES,
  );
  const totalScore = questions.filter(
    (question) => answers[question.id] === question.correctOptionIndex,
  ).length;
  const totalQuestions = questions.length;
  const overallPercentage =
    totalQuestions > 0 ? (totalScore / totalQuestions) * 100 : 0;
  const level =
    overallPercentage >= 85
      ? "ممتاز"
      : overallPercentage >= 70
        ? "جيد جداً"
        : overallPercentage >= 50
          ? "جيد"
          : "يحتاج تحسين";
  const achievements: string[] = [];
  if (overallPercentage >= 90) achievements.push("🏆 أداء متفوق");
  if (overallPercentage >= 80) achievements.push("🌟 أداء ممتاز");
  if (verbalResults.some((result) => result.percentage >= 90)) {
    achievements.push("📚 متميز في القدرات اللفظية");
  }
  if (quantitativeResults.some((result) => result.percentage >= 90)) {
    achievements.push("🔢 متميز في القدرات الكمية");
  }
  if (verbalResults.every((result) => result.percentage >= 70)) {
    achievements.push("✍️ ثبات في الأداء اللفظي");
  }
  if (quantitativeResults.every((result) => result.percentage >= 70)) {
    achievements.push("📊 ثبات في الأداء الكمي");
  }

  return {
    totalScore,
    totalQuestions,
    overallPercentage,
    verbalResults,
    quantitativeResults,
    timeTaken,
    level,
    achievements,
  };
}

export function generateBalancedQuestionSet(
  allQuestions: any[],
  category: TestType,
  requestedCount: number,
  usedQuestionIds: Set<number> = new Set(),
): any[] {
  const matchesCategory = (question: any) => {
    if (!question.options || question.options.length < 4) return false;
    if (category === "mixed") return true;
    const categoryName = question.category?.toLowerCase();
    const subcategoryName = question.subcategory?.toLowerCase();
    const options =
      category === "verbal"
        ? VERBAL_SUBCATEGORIES
        : QUANTITATIVE_SUBCATEGORIES;
    return (
      categoryName === category ||
      options.some(
        (subcategory) =>
          categoryName === subcategory.toLowerCase() ||
          subcategoryName === subcategory.toLowerCase() ||
          question.category === subcategory ||
          question.subcategory === subcategory,
      )
    );
  };

  let available = allQuestions.filter(
    (question) => !usedQuestionIds.has(question.id) && matchesCategory(question),
  );
  if (available.length === 0) {
    available = allQuestions.filter(matchesCategory);
  }
  if (available.length === 0) return [];

  if (available.length <= requestedCount) {
    const result = [...available].sort(() => 0.5 - Math.random());
    result.forEach((question) => usedQuestionIds.add(question.id));
    return result;
  }

  const selected = getBalancedQuestions(
    available,
    calculateBalancedDistribution(requestedCount, category),
  );
  while (selected.length < requestedCount) {
    const remaining = available.filter(
      (question) =>
        !selected.some((selectedQuestion) => selectedQuestion.id === question.id),
    );
    if (remaining.length === 0) break;
    selected.push(remaining[Math.floor(Math.random() * remaining.length)]);
  }
  const result = selected.slice(0, requestedCount);
  result.forEach((question) => usedQuestionIds.add(question.id));
  return result;
}

export function generatePerformanceInsights(
  results: DetailedExamResult,
): string[] {
  const insights: string[] = [];
  if (results.overallPercentage >= 85) {
    insights.push("🌟 أداؤك ممتاز! أنت مستعد تماماً لاختبار قياس");
  } else if (results.overallPercentage >= 70) {
    insights.push("👍 أداء جيد جداً، مع المزيد من التدريب ستصل للتميز");
  } else if (results.overallPercentage >= 50) {
    insights.push("📈 أداء جيد، ركز على نقاط الضعف لتحسين النتيجة");
  } else {
    insights.push("💪 تحتاج للمزيد من التدريب، لا تستسلم!");
  }

  const average = (values: SubcategoryResult[]) =>
    values.reduce((sum, result) => sum + result.percentage, 0) / values.length;
  const verbalAverage = average(results.verbalResults);
  const quantitativeAverage = average(results.quantitativeResults);
  if (verbalAverage > quantitativeAverage + 15) {
    insights.push("📚 نقطة قوتك في القدرات اللفظية، ركز أكثر على الكمي");
  } else if (quantitativeAverage > verbalAverage + 15) {
    insights.push("🔢 نقطة قوتك في القدرات الكمية، اهتم أكثر باللفظي");
  } else {
    insights.push("⚖️ أداء متوازن بين القدرات اللفظية والكمية");
  }

  const allResults = [
    ...results.verbalResults,
    ...results.quantitativeResults,
  ];
  if (allResults.length > 0) {
    const strongest = allResults.reduce((best, current) =>
      current.percentage > best.percentage ? current : best,
    );
    const weakest = allResults.reduce((worst, current) =>
      current.percentage < worst.percentage ? current : worst,
    );
    if (strongest.percentage >= 80) {
      insights.push(
        `🏆 أقوى أداء في: ${strongest.subcategory} (${strongest.correct}/${strongest.total})`,
      );
    }
    if (weakest.percentage <= 60) {
      insights.push(
        `🎯 يحتاج تحسين: ${weakest.subcategory} (${weakest.correct}/${weakest.total})`,
      );
    }
  }
  return insights;
}