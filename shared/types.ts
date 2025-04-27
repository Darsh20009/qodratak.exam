export type QuestionOption = string;

export interface QuestionItem {
  id: number;
  text: string;
  options: QuestionOption[];
  correctOptionIndex: number;
}

export type TestDifficulty = 'beginner' | 'intermediate' | 'advanced';
export type TestType = 'verbal' | 'quantitative';

export interface TestQuestion extends QuestionItem {
  category: TestType;
  difficulty: TestDifficulty;
}

export interface TestResult {
  testType: TestType;
  difficulty: TestDifficulty;
  score: number;
  totalQuestions: number;
  completedAt: string;
}

export interface UserTestSummary {
  userId: number;
  testType: TestType;
  difficulty: TestDifficulty;
  score: number;
  totalQuestions: number;
  completedAt: string;
}

export interface SuggestedQuestion {
  text: string;
  similarity: number;
}

export interface ChatMessage {
  text: string;
  sender: 'user' | 'assistant';
}
