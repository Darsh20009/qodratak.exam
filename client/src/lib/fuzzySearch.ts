import { QuestionItem } from "@shared/types";

// Simple implementation of a Levenshtein distance function
function levenshteinDistance(a: string, b: string): number {
  const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));

  for (let i = 0; i <= a.length; i++) {
    matrix[0][i] = i;
  }

  for (let j = 0; j <= b.length; j++) {
    matrix[j][0] = j;
  }

  for (let j = 1; j <= b.length; j++) {
    for (let i = 1; i <= a.length; i++) {
      const substitutionCost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j - 1][i] + 1, // deletion
        matrix[j][i - 1] + 1, // insertion
        matrix[j - 1][i - 1] + substitutionCost // substitution
      );
    }
  }

  return matrix[b.length][a.length];
}

// Normalize Arabic text by removing diacritics and normalizing characters
function normalizeArabicText(text: string): string {
  // Remove Arabic diacritics (tashkeel)
  text = text.replace(/[\u064B-\u065F\u0670]/g, '');
  
  // Normalize alif variations to plain alif
  text = text.replace(/[\u0622\u0623\u0625]/g, 'ا');
  
  // Normalize ya and alif maqsura
  text = text.replace(/[\u0649]/g, 'ي');
  
  // Remove tatweel (kashida)
  text = text.replace(/\u0640/g, '');
  
  return text.trim().toLowerCase();
}

// Calculate similarity score between two strings (0-1)
export function stringSimilarity(a: string, b: string): number {
  const normalizedA = normalizeArabicText(a);
  const normalizedB = normalizeArabicText(b);
  
  if (normalizedA.length === 0 && normalizedB.length === 0) return 1;
  if (normalizedA.length === 0 || normalizedB.length === 0) return 0;
  
  const distance = levenshteinDistance(normalizedA, normalizedB);
  const maxLength = Math.max(normalizedA.length, normalizedB.length);
  
  return 1 - distance / maxLength;
}

// Find similar questions based on query
export function findSimilarQuestions(
  query: string,
  questions: QuestionItem[],
  threshold: number = 0.4,
  limit: number = 3
): { text: string; similarity: number }[] {
  if (!query || query.trim() === '') return [];
  
  const results = questions.map(question => ({
    text: question.text,
    similarity: stringSimilarity(query, question.text)
  }))
  .filter(result => result.similarity >= threshold)
  .sort((a, b) => b.similarity - a.similarity)
  .slice(0, limit);
  
  return results;
}

// Extract keywords from text to help with matching
export function extractKeywords(text: string): string[] {
  const normalized = normalizeArabicText(text);
  
  // Remove common Arabic stop words
  const stopWords = ['في', 'من', 'على', 'عن', 'إلى', 'هو', 'هي', 'هم', 'هن', 'أنا', 'نحن', 'أنت', 'أنتم', 'هل', 'لا', 'ما', 'كيف', 'متى', 'أين', 'لماذا'];
  
  // Split by spaces and other separators
  const words = normalized.split(/[\s,.!?;:()[\]{}'"]+/);
  
  // Filter out stop words and short words
  return words
    .filter(word => word.length > 2)
    .filter(word => !stopWords.includes(word));
}
