import { TestQuestion, SearchResult } from "@shared/types";

/**
 * Improved Arabic Text Processing
 * - Handles different forms of Arabic characters
 * - Removes diacritics
 * - Normalizes Arabic text for better matching
 */

// Normalize Arabic text by removing diacritics and normalizing characters
export function normalizeArabicText(text: string): string {
  if (!text) return '';
  
  // Remove Arabic diacritics (tashkeel)
  const textWithoutDiacritics = text.replace(/[\u064B-\u065F\u0670]/g, '');
  
  // Normalize Alef forms
  const normalizedAlef = textWithoutDiacritics
    .replace(/[أإآا]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه');
  
  return normalizedAlef.trim();
}

// Calculate string similarity using Levenshtein distance
export function calculateSimilarity(str1: string, str2: string): number {
  // Normalize both strings
  const s1 = normalizeArabicText(str1.toLowerCase());
  const s2 = normalizeArabicText(str2.toLowerCase());
  
  // If either string is empty, return 0
  if (s1.length === 0 || s2.length === 0) return 0;
  
  // If strings are equal, return 1
  if (s1 === s2) return 1;
  
  // Calculate Levenshtein distance
  const len1 = s1.length;
  const len2 = s2.length;
  
  // Create distance matrix
  const matrix = Array(len1 + 1).fill(null).map(() => Array(len2 + 1).fill(null));
  
  // Initialize first row and column
  for (let i = 0; i <= len1; i++) matrix[i][0] = i;
  for (let j = 0; j <= len2; j++) matrix[0][j] = j;
  
  // Fill the matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }
  
  // Calculate similarity score (0 to 1)
  const maxLen = Math.max(len1, len2);
  const distance = matrix[len1][len2];
  
  return 1 - distance / maxLen;
}

// Extract keywords from text
export function extractKeywords(text: string): string[] {
  if (!text) return [];
  
  // Basic Arabic stopwords
  const stopWords = [
    "من", "إلى", "عن", "على", "في", "مع", "هذا", "هذه", "تلك", "ذلك",
    "الذي", "التي", "هو", "هي", "أنا", "نحن", "أنت", "أنتم", "هم", "هن",
    "كان", "كانت", "يكون", "أن", "إن", "لم", "لا", "ما", "وقد", "قد"
  ];
  
  // Normalize text
  const normalizedText = normalizeArabicText(text);
  
  // Split into words, filter stopwords and short words
  const words = normalizedText
    .replace(/[^\u0600-\u06FF\s]/g, ' ') // Keep only Arabic characters
    .split(/\s+/)
    .filter(word => 
      word.length > 2 && !stopWords.includes(word)
    );
  
  // Return unique keywords
  return Array.from(new Set(words));
}

// Smart search function that combines exact matching, keyword matching and fuzzy matching
export function smartSearch(
  query: string,
  questions: TestQuestion[],
  options?: {
    category?: string;
    difficulty?: string;
    threshold?: number;
    maxResults?: number;
  }
): SearchResult[] {
  // Default options
  const threshold = options?.threshold || 0.4;
  const maxResults = options?.maxResults || 20;
  
  // If query is empty, return empty results
  if (!query || query.trim() === '') return [];
  
  // Normalize query
  const normalizedQuery = normalizeArabicText(query);
  // Extract keywords from query
  const queryKeywords = extractKeywords(query);
  
  // Filter questions by category and difficulty if provided
  let filteredQuestions = [...questions];
  
  if (options?.category) {
    filteredQuestions = filteredQuestions.filter(q => q.category === options.category);
  }
  
  if (options?.difficulty) {
    filteredQuestions = filteredQuestions.filter(q => q.difficulty === options.difficulty);
  }
  
  // Store matches with their score
  const matches: {
    question: TestQuestion;
    score: number;
    matchType: 'exact' | 'similar' | 'keyword';
    matchedKeywords?: string[];
  }[] = [];
  
  // Process each question
  filteredQuestions.forEach(question => {
    // Exact match in text
    if (normalizeArabicText(question.text).includes(normalizedQuery)) {
      matches.push({
        question,
        score: 1,
        matchType: 'exact'
      });
      return; // Skip further processing for this question
    }
    
    // Check for keyword matches
    if (question.keywords && queryKeywords.length > 0) {
      const matchedKeywords = question.keywords.filter(kw => 
        queryKeywords.some(qk => 
          normalizeArabicText(kw).includes(normalizeArabicText(qk)) ||
          normalizeArabicText(qk).includes(normalizeArabicText(kw))
        )
      );
      
      if (matchedKeywords.length > 0) {
        const keywordMatchScore = matchedKeywords.length / Math.max(queryKeywords.length, question.keywords.length);
        
        matches.push({
          question,
          score: 0.7 + (0.3 * keywordMatchScore), // Score between 0.7 and 1.0
          matchType: 'keyword',
          matchedKeywords
        });
        return; // Skip further processing for this question
      }
    }
    
    // Fuzzy matching
    const similarity = calculateSimilarity(query, question.text);
    
    if (similarity >= threshold) {
      matches.push({
        question,
        score: similarity,
        matchType: 'similar'
      });
    }
  });
  
  // Sort by score (highest first)
  const sortedMatches = matches.sort((a, b) => b.score - a.score);
  
  // Convert to SearchResult format
  return sortedMatches.slice(0, maxResults).map(match => ({
    question: match.question,
    matchType: match.matchType,
    similarity: match.score,
    matchedKeywords: match.matchedKeywords
  }));
}

// Find related questions based on a given question
export function findRelatedQuestions(
  question: TestQuestion,
  allQuestions: TestQuestion[],
  options?: {
    maxResults?: number;
    sameCategoryOnly?: boolean;
    sameDifficultyOnly?: boolean;
  }
): TestQuestion[] {
  const maxResults = options?.maxResults || 5;
  const sameCategoryOnly = options?.sameCategoryOnly || false;
  const sameDifficultyOnly = options?.sameDifficultyOnly || false;
  
  // Filter out the original question
  let filteredQuestions = allQuestions.filter(q => q.id !== question.id);
  
  // Filter by category if required
  if (sameCategoryOnly) {
    filteredQuestions = filteredQuestions.filter(q => q.category === question.category);
  }
  
  // Filter by difficulty if required
  if (sameDifficultyOnly) {
    filteredQuestions = filteredQuestions.filter(q => q.difficulty === question.difficulty);
  }
  
  // If we have topic, prioritize questions with the same topic
  if (question.topic) {
    // Get questions with the same topic
    const sameTopicQuestions = filteredQuestions.filter(q => q.topic === question.topic);
    
    // If we have enough same-topic questions, return them
    if (sameTopicQuestions.length >= maxResults) {
      return sameTopicQuestions.slice(0, maxResults);
    }
    
    // Otherwise, combine with other related questions
    const otherQuestions = filteredQuestions
      .filter(q => q.topic !== question.topic)
      .map(q => ({
        question: q,
        score: calculateSimilarity(question.text, q.text)
      }))
      .sort((a, b) => b.score - a.score)
      .map(item => item.question)
      .slice(0, maxResults - sameTopicQuestions.length);
    
    return [...sameTopicQuestions, ...otherQuestions];
  }
  
  // If we don't have a topic, use text similarity
  return filteredQuestions
    .map(q => ({
      question: q,
      score: calculateSimilarity(question.text, q.text)
    }))
    .sort((a, b) => b.score - a.score)
    .map(item => item.question)
    .slice(0, maxResults);
}

// Question recommendation engine based on past performance
export function recommendQuestions(
  userAnsweredQuestions: { questionId: number; correct: boolean }[],
  allQuestions: TestQuestion[],
  options?: {
    maxEasy?: number;
    maxHard?: number;
    categoryFocus?: string;
  }
): { easyQuestions: TestQuestion[]; hardQuestions: TestQuestion[] } {
  const maxEasy = options?.maxEasy || 3;
  const maxHard = options?.maxHard || 5;
  
  // First, identify questions the user has answered
  const answeredIds = new Set(userAnsweredQuestions.map(q => q.questionId));
  
  // Find unanswered questions
  const unansweredQuestions = allQuestions.filter(q => !answeredIds.has(q.id));
  
  // If focusing on a specific category, filter questions
  let filteredQuestions = unansweredQuestions;
  if (options?.categoryFocus) {
    filteredQuestions = unansweredQuestions.filter(q => q.category === options.categoryFocus);
  }
  
  // Identify weak areas based on incorrect answers
  const incorrectAnswers = userAnsweredQuestions.filter(q => !q.correct);
  const incorrectIds = new Set(incorrectAnswers.map(q => q.questionId));
  
  // Get topics of incorrect questions
  const weakTopics = new Set<string>();
  const weakCategories = new Set<string>();
  
  allQuestions
    .filter(q => incorrectIds.has(q.id) && q.topic)
    .forEach(q => {
      if (q.topic) weakTopics.add(q.topic);
      weakCategories.add(q.category);
    });
  
  // Find questions in weak topics but not too difficult (for easy recommendations)
  const easyRecommendations = filteredQuestions
    .filter(q => 
      q.topic && weakTopics.has(q.topic) && 
      (q.difficulty === 'beginner' || q.difficulty === 'intermediate')
    )
    .slice(0, maxEasy);
  
  // Find challenging questions in weak topics
  const hardRecommendations = filteredQuestions
    .filter(q => 
      ((q.topic && weakTopics.has(q.topic)) || weakCategories.has(q.category)) && 
      (q.difficulty === 'intermediate' || q.difficulty === 'advanced')
    )
    .slice(0, maxHard);
  
  return {
    easyQuestions: easyRecommendations,
    hardQuestions: hardRecommendations
  };
}

// Personalized learning path generator
export function generateLearningPath(
  userAnsweredQuestions: { questionId: number; correct: boolean }[],
  allQuestions: TestQuestion[],
  userLevel: number = 1
): {
  currentLevel: string;
  nextMilestone: string;
  dailyGoal: number;
  recommendedAreas: string[];
  learningPath: { topic: string; questions: TestQuestion[] }[];
} {
  // Calculate success rate by topic
  const topicPerformance: Record<string, { total: number; correct: number }> = {};
  
  // Process user answered questions
  userAnsweredQuestions.forEach(answered => {
    const question = allQuestions.find(q => q.id === answered.questionId);
    if (!question || !question.topic) return;
    
    if (!topicPerformance[question.topic]) {
      topicPerformance[question.topic] = { total: 0, correct: 0 };
    }
    
    topicPerformance[question.topic].total++;
    if (answered.correct) {
      topicPerformance[question.topic].correct++;
    }
  });
  
  // Identify weak areas (topics with < 60% success rate)
  const weakAreas = Object.entries(topicPerformance)
    .filter(([_, data]) => (data.correct / data.total) < 0.6)
    .map(([topic]) => topic);
  
  // Identify topics not yet started
  const knownTopics = new Set(Object.keys(topicPerformance));
  const allTopics = new Set<string>();
  allQuestions.forEach(q => {
    if (q.topic) allTopics.add(q.topic);
  });
  
  const newTopics = Array.from(allTopics).filter(topic => !knownTopics.has(topic));
  
  // Generate learning path
  const learningPath: { topic: string; questions: TestQuestion[] }[] = [];
  
  // First, add weak areas
  weakAreas.forEach(topic => {
    const topicQuestions = allQuestions
      .filter(q => q.topic === topic && !userAnsweredQuestions.some(a => a.questionId === q.id))
      .slice(0, 5);
    
    if (topicQuestions.length > 0) {
      learningPath.push({
        topic,
        questions: topicQuestions
      });
    }
  });
  
  // Then, add new topics appropriate for user level
  const appropriateDifficulty = userLevel <= 1 ? 'beginner' : 
                               userLevel <= 3 ? 'intermediate' : 'advanced';
  
  newTopics.forEach(topic => {
    const topicQuestions = allQuestions
      .filter(q => q.topic === topic && q.difficulty === appropriateDifficulty)
      .slice(0, 3);
    
    if (topicQuestions.length > 0) {
      learningPath.push({
        topic,
        questions: topicQuestions
      });
    }
  });
  
  // Determine current level description and next milestone
  let currentLevel = "مبتدئ";
  let nextMilestone = "إكمال 10 اختبارات";
  
  if (userLevel >= 5) {
    currentLevel = "خبير";
    nextMilestone = "مساعدة الآخرين";
  } else if (userLevel >= 3) {
    currentLevel = "متقدم";
    nextMilestone = "إتقان المستوى المتقدم";
  } else if (userLevel >= 2) {
    currentLevel = "متوسط";
    nextMilestone = "الوصول للمستوى المتقدم";
  }
  
  // Calculate daily goal based on user level and activity
  const totalAnswered = userAnsweredQuestions.length;
  const dailyGoal = Math.min(Math.max(5, Math.floor(totalAnswered / 10) + 3), 15);
  
  return {
    currentLevel,
    nextMilestone,
    dailyGoal,
    recommendedAreas: weakAreas.concat(newTopics.slice(0, 3)),
    learningPath
  };
}