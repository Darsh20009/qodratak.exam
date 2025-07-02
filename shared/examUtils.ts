// Enhanced exam utilities with 5-section division for all tests

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

export interface SectionResult {
  sectionNumber: number;
  sectionName: string;
  correct: number;
  total: number;
  percentage: number;
  level: 'ممتاز' | 'جيد جداً' | 'جيد' | 'يحتاج تحسين';
  color: string;
  subcategories: SubcategoryResult[];
}

export interface DetailedExamResult {
  totalScore: number;
  totalQuestions: number;
  overallPercentage: number;
  verbalResults: SubcategoryResult[];
  quantitativeResults: SubcategoryResult[];
  sectionResults: SectionResult[];
  timeTaken: number;
  level: string;
  achievements: string[];
}

// 5-Section configurations for all tests
export const VERBAL_SUBCATEGORIES_5_SECTIONS = [
  'التناظر اللفظي',
  'إكمال الجمل', 
  'استيعاب المقروء',
  'الخطأ السياقي',
  'المفردات والمعاني'
];

export const QUANTITATIVE_SUBCATEGORIES_5_SECTIONS = [
  'الهندسة',
  'عمليات حسابية',
  'المقارنات والتناسب',
  'الإحصاء والاحتمالات',
  'المعادلات والأنماط'
];

// Legacy subcategories for backward compatibility
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

// Calculate balanced distribution for exam (5-section system)
export function calculateBalancedDistribution(
  totalQuestions: number,
  category: 'verbal' | 'quantitative' | 'mixed',
  use5Sections: boolean = true
): SubcategoryDistribution[] {
  let subcategories: string[];
  
  if (use5Sections) {
    subcategories = category === 'verbal' ? VERBAL_SUBCATEGORIES_5_SECTIONS : 
                   category === 'quantitative' ? QUANTITATIVE_SUBCATEGORIES_5_SECTIONS :
                   [...VERBAL_SUBCATEGORIES_5_SECTIONS, ...QUANTITATIVE_SUBCATEGORIES_5_SECTIONS];
  } else {
    // Legacy system for backward compatibility
    subcategories = category === 'verbal' ? VERBAL_SUBCATEGORIES : 
                   category === 'quantitative' ? QUANTITATIVE_SUBCATEGORIES :
                   [...VERBAL_SUBCATEGORIES, ...QUANTITATIVE_SUBCATEGORIES];
  }
  
  const questionsPerSubcategory = Math.floor(totalQuestions / subcategories.length);
  const remainingQuestions = totalQuestions % subcategories.length;
  
  return subcategories.map((subcategory, index) => ({
    subcategory,
    questionsPerSubcategory: questionsPerSubcategory + (index < remainingQuestions ? 1 : 0),
    totalQuestions
  }));
}

// Create 5 sections for any test
export function create5SectionTest(
  totalQuestions: number,
  category: 'verbal' | 'quantitative',
  timePerSection: number = 13
) {
  const questionsPerSection = Math.floor(totalQuestions / 5);
  const remainingQuestions = totalQuestions % 5;
  
  const subcategories = category === 'verbal' ? VERBAL_SUBCATEGORIES_5_SECTIONS : QUANTITATIVE_SUBCATEGORIES_5_SECTIONS;
  
  return Array.from({ length: 5 }, (_, index) => ({
    sectionNumber: index + 1,
    sectionName: `القسم ${index + 1}: ${subcategories[index]}`,
    category: category,
    subcategory: subcategories[index],
    questionCount: questionsPerSection + (index < remainingQuestions ? 1 : 0),
    timeLimit: timePerSection,
    completed: false,
    timeSpent: 0,
    questions: []
  }));
}

// Get questions with balanced distribution
export function getBalancedQuestions(
  allQuestions: any[],
  distribution: SubcategoryDistribution[]
): any[] {
  const balancedQuestions: any[] = [];
  
  distribution.forEach(({ subcategory, questionsPerSubcategory }) => {
    const subcategoryQuestions = allQuestions.filter(q => q.subcategory === subcategory);
    
    if (subcategoryQuestions.length >= questionsPerSubcategory) {
      // Randomly select required number of questions
      const shuffled = [...subcategoryQuestions].sort(() => Math.random() - 0.5);
      balancedQuestions.push(...shuffled.slice(0, questionsPerSubcategory));
    } else {
      // Add all available questions and pad with similar questions
      balancedQuestions.push(...subcategoryQuestions);
      const needed = questionsPerSubcategory - subcategoryQuestions.length;
      
      // Pad with random questions from same category
      const categoryQuestions = allQuestions.filter(q => 
        q.category === subcategoryQuestions[0]?.category && 
        q.subcategory !== subcategory
      );
      const padding = categoryQuestions.sort(() => Math.random() - 0.5).slice(0, needed);
      balancedQuestions.push(...padding);
    }
  });
  
  return balancedQuestions.sort(() => Math.random() - 0.5);
}

// Calculate detailed results with 5-section support
export function calculateDetailedResults(
  questions: any[],
  answers: Record<number, number>,
  timeTaken: number = 0,
  use5Sections: boolean = true
): DetailedExamResult {
  const verbalQuestions = questions.filter(q => q.category === 'verbal');
  const quantitativeQuestions = questions.filter(q => q.category === 'quantitative');
  
  // Choose subcategories based on system
  const verbalSubcategories = use5Sections ? VERBAL_SUBCATEGORIES_5_SECTIONS : VERBAL_SUBCATEGORIES;
  const quantitativeSubcategories = use5Sections ? QUANTITATIVE_SUBCATEGORIES_5_SECTIONS : QUANTITATIVE_SUBCATEGORIES;
  
  // Calculate results for verbal subcategories
  const verbalResults: SubcategoryResult[] = verbalSubcategories.map(subcategory => {
    const subcategoryQuestions = verbalQuestions.filter(q => 
      q.subcategory === subcategory || 
      (subcategory === 'المفردات والمعاني' && q.subcategory === 'المترادفات والأضداد')
    );
    const correct = subcategoryQuestions.filter(q => answers[q.id] === q.correctOptionIndex).length;
    const total = subcategoryQuestions.length;
    const percentage = total > 0 ? (correct / total) * 100 : 0;
    
    const level: 'ممتاز' | 'جيد جداً' | 'جيد' | 'يحتاج تحسين' = 
      percentage >= 85 ? 'ممتاز' :
      percentage >= 70 ? 'جيد جداً' :
      percentage >= 50 ? 'جيد' : 'يحتاج تحسين';
    
    const color = percentage >= 85 ? 'text-green-600' :
                 percentage >= 70 ? 'text-blue-600' :
                 percentage >= 50 ? 'text-yellow-600' : 'text-red-600';
    
    return { subcategory, correct, total, percentage, level, color };
  }).filter(result => result.total > 0);
  
  // Calculate results for quantitative subcategories  
  const quantitativeResults: SubcategoryResult[] = quantitativeSubcategories.map(subcategory => {
    let subcategoryQuestions: any[] = [];
    
    if (use5Sections) {
      switch (subcategory) {
        case 'المقارنات والتناسب':
          subcategoryQuestions = quantitativeQuestions.filter(q => 
            q.subcategory === 'المقارنات' || q.subcategory === 'النسبة والتناسب' || q.subcategory === 'النسبة المئوية'
          );
          break;
        case 'الإحصاء والاحتمالات':
          subcategoryQuestions = quantitativeQuestions.filter(q => 
            q.subcategory === 'الإحصاء' || q.subcategory === 'الاحتمالات'
          );
          break;
        case 'المعادلات والأنماط':
          subcategoryQuestions = quantitativeQuestions.filter(q => 
            q.subcategory === 'المعادلات' || q.subcategory === 'الحركة والأنماط' || q.subcategory === 'أفكار متنوعة'
          );
          break;
        default:
          subcategoryQuestions = quantitativeQuestions.filter(q => q.subcategory === subcategory);
      }
    } else {
      subcategoryQuestions = quantitativeQuestions.filter(q => q.subcategory === subcategory);
    }
    
    const correct = subcategoryQuestions.filter(q => answers[q.id] === q.correctOptionIndex).length;
    const total = subcategoryQuestions.length;
    const percentage = total > 0 ? (correct / total) * 100 : 0;
    
    const level: 'ممتاز' | 'جيد جداً' | 'جيد' | 'يحتاج تحسين' = 
      percentage >= 85 ? 'ممتاز' :
      percentage >= 70 ? 'جيد جداً' :
      percentage >= 50 ? 'جيد' : 'يحتاج تحسين';
    
    const color = percentage >= 85 ? 'text-green-600' :
                 percentage >= 70 ? 'text-blue-600' :
                 percentage >= 50 ? 'text-yellow-600' : 'text-red-600';
    
    return { subcategory, correct, total, percentage, level, color };
  }).filter(result => result.total > 0);

  // Calculate section results (for 5-section tests)
  const sectionResults: SectionResult[] = [];
  if (use5Sections) {
    for (let i = 0; i < 5; i++) {
      const isVerbal = verbalQuestions.length > quantitativeQuestions.length;
      const sectionSubcategory = isVerbal ? verbalSubcategories[i] : quantitativeSubcategories[i];
      const sectionQuestions = questions.filter(q => 
        (isVerbal && q.category === 'verbal') || (!isVerbal && q.category === 'quantitative')
      );
      
      const sectionStart = Math.floor(i * sectionQuestions.length / 5);
      const sectionEnd = Math.floor((i + 1) * sectionQuestions.length / 5);
      const thisSectionQuestions = sectionQuestions.slice(sectionStart, sectionEnd);
      
      const correct = thisSectionQuestions.filter(q => answers[q.id] === q.correctOptionIndex).length;
      const total = thisSectionQuestions.length;
      const percentage = total > 0 ? (correct / total) * 100 : 0;
      
      const level: 'ممتاز' | 'جيد جداً' | 'جيد' | 'يحتاج تحسين' = 
        percentage >= 85 ? 'ممتاز' :
        percentage >= 70 ? 'جيد جداً' :
        percentage >= 50 ? 'جيد' : 'يحتاج تحسين';
      
      const color = percentage >= 85 ? 'text-green-600' :
                   percentage >= 70 ? 'text-blue-600' :
                   percentage >= 50 ? 'text-yellow-600' : 'text-red-600';
      
      sectionResults.push({
        sectionNumber: i + 1,
        sectionName: `القسم ${i + 1}: ${sectionSubcategory}`,
        correct,
        total,
        percentage,
        level,
        color,
        subcategories: []
      });
    }
  }
  
  // Calculate overall results
  const totalCorrect = questions.filter(q => answers[q.id] === q.correctOptionIndex).length;
  const totalQuestions = questions.length;
  const overallPercentage = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;
  
  const overallLevel = overallPercentage >= 85 ? 'ممتاز' :
                      overallPercentage >= 70 ? 'جيد جداً' :
                      overallPercentage >= 50 ? 'جيد' : 'يحتاج تحسين';
  
  // Generate achievements based on performance
  const achievements: string[] = [];
  if (overallPercentage >= 90) achievements.push('🏆 أداء متفوق في النظام الخماسي');
  if (overallPercentage >= 80) achievements.push('🌟 أداء ممتاز عبر الأقسام الخمسة');
  if (verbalResults.some(r => r.percentage >= 90)) achievements.push('📚 متميز في القدرات اللفظية');
  if (quantitativeResults.some(r => r.percentage >= 90)) achievements.push('🔢 متميز في القدرات الكمية');
  if (sectionResults.every(r => r.percentage >= 70)) achievements.push('⭐ ثبات ممتاز عبر جميع الأقسام');
  if (sectionResults.filter(r => r.percentage >= 85).length >= 3) achievements.push('🎯 تفوق في معظم الأقسام');
  
  return {
    totalScore: totalCorrect,
    totalQuestions,
    overallPercentage,
    verbalResults,
    quantitativeResults,
    sectionResults,
    timeTaken,
    level: overallLevel,
    achievements
  };
}

// Generate balanced question set for exam sections
export function generateBalancedQuestionSet(
  allQuestions: any[],
  sectionConfig: any,
  requestedCount: number
): any[] {
  const sectionQuestions = allQuestions.filter(q => q.category === sectionConfig.category);
  
  if (sectionQuestions.length === 0) {
    console.warn(`Warning: No questions found for category ${sectionConfig.category}`);
    return [];
  }
  
  // Calculate balanced distribution for this section
  const distribution = calculateBalancedDistribution(requestedCount, sectionConfig.category);
  
  // Get balanced questions
  const balancedQuestions = getBalancedQuestions(sectionQuestions, distribution);
  
  // If we still don't have enough, pad with random questions from the same category
  while (balancedQuestions.length < requestedCount && sectionQuestions.length > 0) {
    const remainingQuestions = sectionQuestions.filter(q => 
      !balancedQuestions.some(bq => bq.id === q.id)
    );
    
    if (remainingQuestions.length === 0) break;
    
    const randomQuestion = remainingQuestions[Math.floor(Math.random() * remainingQuestions.length)];
    balancedQuestions.push(randomQuestion);
  }
  
  return balancedQuestions.slice(0, requestedCount);
}

// Enhanced result analysis with creative insights
export function generatePerformanceInsights(results: DetailedExamResult): string[] {
  const insights: string[] = [];
  
  if (results.overallPercentage >= 85) {
    insights.push('🌟 أداؤك ممتاز! أنت مستعد تماماً لاختبار قياس');
  } else if (results.overallPercentage >= 70) {
    insights.push('👍 أداء جيد جداً، مع المزيد من التدريب ستصل للتميز');
  } else if (results.overallPercentage >= 50) {
    insights.push('📈 أداء جيد، ركز على نقاط الضعف لتحسين النتيجة');
  } else {
    insights.push('💪 تحتاج للمزيد من التدريب، لا تستسلم!');
  }
  
  // Analyze verbal performance
  const verbalAvg = results.verbalResults.reduce((sum, r) => sum + r.percentage, 0) / results.verbalResults.length;
  const quantAvg = results.quantitativeResults.reduce((sum, r) => sum + r.percentage, 0) / results.quantitativeResults.length;
  
  if (verbalAvg > quantAvg + 15) {
    insights.push('📚 نقطة قوتك في القدرات اللفظية، ركز أكثر على الكمي');
  } else if (quantAvg > verbalAvg + 15) {
    insights.push('🔢 نقطة قوتك في القدرات الكمية، اهتم أكثر باللفظي');
  } else {
    insights.push('⚖️ أداء متوازن بين القدرات اللفظية والكمية');
  }
  
  // Find strongest and weakest subcategories
  const allResults = [...results.verbalResults, ...results.quantitativeResults];
  const strongest = allResults.reduce((max, current) => 
    current.percentage > max.percentage ? current : max
  );
  const weakest = allResults.reduce((min, current) => 
    current.percentage < min.percentage ? current : min
  );
  
  if (strongest.percentage >= 80) {
    insights.push(`🏆 أقوى أداء في: ${strongest.subcategory} (${strongest.correct}/${strongest.total})`);
  }
  
  if (weakest.percentage <= 60) {
    insights.push(`🎯 يحتاج تحسين: ${weakest.subcategory} (${weakest.correct}/${weakest.total})`);
  }
  
  return insights;
}