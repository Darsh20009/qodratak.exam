// Enhanced exam utilities with balanced question distribution and detailed analytics

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
  level: 'ممتاز' | 'جيد جداً' | 'جيد' | 'يحتاج تحسين';
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

// Subcategory configurations for balanced distribution
export const VERBAL_SUBCATEGORIES = [
  'التناظر اللفظي',
  'إكمال الجمل', 
  'استيعاب المقروء',
  'الخطأ السياقي'
];

export const QUANTITATIVE_SUBCATEGORIES = [
  'الهندسة',
  'عمليات حسابية',
  'المقارنات',
  'النسبة المئوية',
  'النسبة والتناسب',
  'المعادلات',
  'الإحصاء',
  'الحركة والأنماط'
];

// Calculate balanced distribution for exam
export function calculateBalancedDistribution(
  totalQuestions: number,
  subcategories: string[]
): SubcategoryDistribution[] {
  const questionsPerSubcategory = Math.floor(totalQuestions / subcategories.length);
  const remainder = totalQuestions % subcategories.length;
  
  return subcategories.map((subcategory, index) => ({
    subcategory,
    questionsPerSubcategory: questionsPerSubcategory + (index < remainder ? 1 : 0),
    totalQuestions
  }));
}

// Get performance level based on percentage
export function getPerformanceLevel(percentage: number): {
  level: 'ممتاز' | 'جيد جداً' | 'جيد' | 'يحتاج تحسين';
  color: string;
} {
  if (percentage >= 90) return { level: 'ممتاز', color: 'text-emerald-600 dark:text-emerald-400' };
  if (percentage >= 80) return { level: 'جيد جداً', color: 'text-blue-600 dark:text-blue-400' };
  if (percentage >= 70) return { level: 'جيد', color: 'text-yellow-600 dark:text-yellow-400' };
  return { level: 'يحتاج تحسين', color: 'text-red-600 dark:text-red-400' };
}

// Calculate detailed exam results with subcategory breakdown
export function calculateDetailedResults(
  userAnswers: Record<number, number>,
  questions: any[],
  timeTaken: number
): DetailedExamResult {
  let totalCorrect = 0;
  const subcategoryStats: Record<string, { correct: number; total: number }> = {};
  
  // Initialize subcategory stats
  [...VERBAL_SUBCATEGORIES, ...QUANTITATIVE_SUBCATEGORIES].forEach(sub => {
    subcategoryStats[sub] = { correct: 0, total: 0 };
  });
  
  // Calculate results for each question
  questions.forEach((question, index) => {
    const userAnswer = userAnswers[index];
    const isCorrect = userAnswer === question.correctOptionIndex;
    const subcategory = question.subcategory || question.category;
    
    if (isCorrect) {
      totalCorrect++;
      subcategoryStats[subcategory].correct++;
    }
    subcategoryStats[subcategory].total++;
  });
  
  // Convert to detailed results
  const verbalResults: SubcategoryResult[] = VERBAL_SUBCATEGORIES
    .filter(sub => subcategoryStats[sub].total > 0)
    .map(subcategory => {
      const stats = subcategoryStats[subcategory];
      const percentage = stats.total > 0 ? (stats.correct / stats.total) * 100 : 0;
      const performance = getPerformanceLevel(percentage);
      
      return {
        subcategory,
        correct: stats.correct,
        total: stats.total,
        percentage: Math.round(percentage),
        level: performance.level,
        color: performance.color
      };
    });
  
  const quantitativeResults: SubcategoryResult[] = QUANTITATIVE_SUBCATEGORIES
    .filter(sub => subcategoryStats[sub].total > 0)
    .map(subcategory => {
      const stats = subcategoryStats[subcategory];
      const percentage = stats.total > 0 ? (stats.correct / stats.total) * 100 : 0;
      const performance = getPerformanceLevel(percentage);
      
      return {
        subcategory,
        correct: stats.correct,
        total: stats.total,
        percentage: Math.round(percentage),
        level: performance.level,
        color: performance.color
      };
    });
  
  const overallPercentage = Math.round((totalCorrect / questions.length) * 100);
  const overallLevel = getPerformanceLevel(overallPercentage);
  
  // Generate achievements based on performance
  const achievements: string[] = [];
  if (overallPercentage >= 90) achievements.push('🏆 إنجاز ممتاز');
  if (overallPercentage >= 80) achievements.push('⭐ أداء متميز');
  if (verbalResults.some(r => r.percentage >= 95)) achievements.push('📚 خبير لفظي');
  if (quantitativeResults.some(r => r.percentage >= 95)) achievements.push('🔢 عبقري رياضي');
  if (timeTaken < questions.length * 30) achievements.push('⚡ سرعة فائقة');
  
  return {
    totalScore: totalCorrect,
    totalQuestions: questions.length,
    overallPercentage,
    verbalResults,
    quantitativeResults,
    timeTaken,
    level: overallLevel.level,
    achievements
  };
}

// Generate balanced question set for exam
export function generateBalancedQuestionSet(
  allQuestions: any[],
  totalQuestions: number,
  examType: 'qiyas' | 'qualification' | 'mixed'
): any[] {
  const selectedQuestions: any[] = [];
  
  if (examType === 'qiyas' || examType === 'mixed') {
    // For Qiyas exams, split equally between verbal and quantitative
    const verbalCount = Math.floor(totalQuestions * 0.5);
    const quantitativeCount = totalQuestions - verbalCount;
    
    // Get balanced verbal questions
    const verbalQuestions = allQuestions.filter(q => 
      VERBAL_SUBCATEGORIES.includes(q.subcategory || q.category)
    );
    const verbalDistribution = calculateBalancedDistribution(verbalCount, VERBAL_SUBCATEGORIES);
    
    verbalDistribution.forEach(dist => {
      const subcategoryQuestions = verbalQuestions
        .filter(q => (q.subcategory || q.category) === dist.subcategory)
        .sort(() => Math.random() - 0.5)
        .slice(0, dist.questionsPerSubcategory);
      
      selectedQuestions.push(...subcategoryQuestions);
    });
    
    // Get balanced quantitative questions
    const quantitativeQuestions = allQuestions.filter(q => 
      QUANTITATIVE_SUBCATEGORIES.includes(q.subcategory || q.category)
    );
    const quantitativeDistribution = calculateBalancedDistribution(
      quantitativeCount, 
      QUANTITATIVE_SUBCATEGORIES
    );
    
    quantitativeDistribution.forEach(dist => {
      const subcategoryQuestions = quantitativeQuestions
        .filter(q => (q.subcategory || q.category) === dist.subcategory)
        .sort(() => Math.random() - 0.5)
        .slice(0, dist.questionsPerSubcategory);
      
      selectedQuestions.push(...subcategoryQuestions);
    });
  }
  
  // Shuffle final question set
  return selectedQuestions.sort(() => Math.random() - 0.5).slice(0, totalQuestions);
}