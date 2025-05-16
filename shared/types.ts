export type QuestionOption = string;

export interface QuestionItem {
  id: number;
  text: string;
  options: QuestionOption[];
  correctOptionIndex: number;
}

export type TestDifficulty = 'beginner' | 'intermediate' | 'advanced' | 'expert';
export type TestType = 'verbal' | 'quantitative' | 'qiyas' | 'custom' | 'mixed';
export type DialectType = 'standard' | 'saudi' | 'egyptian' | 'gulf' | 'levantine' | 'maghrebi';

export interface TestQuestion extends QuestionItem {
  category: TestType;
  difficulty: TestDifficulty;
  topic?: string;
  dialect?: DialectType;
  keywords?: string[];
  section?: number;
  explanation?: string;
}

export interface TestResult {
  testType: TestType;
  difficulty: TestDifficulty;
  score: number;
  totalQuestions: number;
  completedAt: string;
  pointsEarned?: number;
  timeTaken?: number;
  isOfficial?: boolean;
}

export interface UserTestSummary {
  userId: number;
  testType: TestType;
  difficulty: TestDifficulty;
  score: number;
  totalQuestions: number;
  completedAt: string;
  pointsEarned?: number;
}

export interface SuggestedQuestion {
  text: string;
  similarity: number;
  keywords?: string[];
}

export interface ChatMessage {
  text: string;
  sender: 'user' | 'assistant';
  timestamp?: string;
  suggestedActions?: string[];
}

export interface ExamSectionConfig {
  sectionNumber: number;
  name: string;
  category: TestType;
  questionCount: number;
  timeLimit: number; // in minutes
}

export interface ExamConfig {
  id?: number;
  name: string;
  description?: string;
  totalSections: number;
  totalQuestions: number;
  totalTime: number; // in minutes
  isQiyas: boolean;
  isMockExam?: boolean;
  requiresSubscription?: boolean;
  sections: ExamSectionConfig[];
}

export interface MockExamConfig extends ExamConfig {
  isMockExam: true;
  requiresSubscription: true;
  type: 'verbal' | 'quantitative' | 'comprehensive';
}

export interface QiyasExamConfig extends ExamConfig {
  isOfficial: true;
}

export interface UserCustomExamConfig {
  id?: number;
  userId: number;
  name: string;
  description?: string;
  questionCount: number;
  timeLimit: number; // in minutes
  categories: TestType[];
  difficulty: TestDifficulty;
}

export interface UserProfile {
  id: number;
  username: string;
  points: number;
  level: number;
  testsTaken: number;
  averageScore: number;
  achievements: Achievement[];
}

export interface Achievement {
  id: number;
  name: string;
  description: string;
  icon: string;
  earnedAt?: string;
}

export interface PointsTransaction {
  id: number;
  userId: number;
  amount: number;
  reason: string;
  timestamp: string;
}

export interface Dialect {
  id: number;
  name: DialectType;
  description?: string;
  examples: string[];
}

export interface Synonym {
  id: number;
  word: string;
  synonyms: string[];
  dialect: DialectType;
}

export interface ExamSession {
  examId: number;
  currentSection: number;
  currentQuestion: number;
  timeLeft: number; // in seconds
  answers: {[questionId: number]: number};
  startTime: string;
  paused: boolean;
}

export interface LeaderboardEntry {
  userId: number;
  username: string;
  points: number;
  level: number;
  rank: number;
}

export interface SearchResult {
  question: TestQuestion;
  matchType: 'exact' | 'similar' | 'keyword';
  similarity?: number;
  matchedKeywords?: string[];
}
