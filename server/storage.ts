import {
  users,
  questions,
  userTestResults,
  type User,
  type InsertUser,
  type Question,
  type InsertQuestion,
  type UserTestResult,
  type InsertUserTestResult,
} from "@shared/schema";
import { TestType, TestDifficulty } from "@shared/types";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Question operations
  getAllQuestions(): Promise<Question[]>;
  getQuestionsByCategory(category: string): Promise<Question[]>;
  getQuestionsByCategoryAndDifficulty(
    category: string,
    difficulty: string
  ): Promise<Question[]>;
  getQuestionsById(id: number): Promise<Question | undefined>;
  createQuestion(question: InsertQuestion): Promise<Question>;
  searchQuestions(query: string): Promise<Question[]>;

  // Test results operations
  createTestResult(result: InsertUserTestResult): Promise<UserTestResult>;
  getTestResultsByUser(userId: number): Promise<UserTestResult[]>;
  getTestResultsByUserAndType(
    userId: number,
    testType: string
  ): Promise<UserTestResult[]>;
}

// Memory storage implementation
export class MemStorage implements IStorage {
  private usersMap: Map<number, User>;
  private questionsMap: Map<number, Question>;
  private userTestResultsMap: Map<number, UserTestResult>;
  private currentUserId: number;
  private currentQuestionId: number;
  private currentTestResultId: number;

  constructor() {
    this.usersMap = new Map();
    this.questionsMap = new Map();
    this.userTestResultsMap = new Map();
    this.currentUserId = 1;
    this.currentQuestionId = 1;
    this.currentTestResultId = 1;

    // Initialize with questions from the provided JSON
    this.initializeWithDefaultQuestions();
  }

  private async initializeWithDefaultQuestions() {
    try {
      const response = await fetch("/api/seed-questions");
      if (response.ok) {
        console.log("Questions seeded successfully");
      }
    } catch (error) {
      console.error("Error seeding questions:", error);
    }
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.usersMap.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.usersMap.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.usersMap.set(id, user);
    return user;
  }

  // Question operations
  async getAllQuestions(): Promise<Question[]> {
    return Array.from(this.questionsMap.values());
  }

  async getQuestionsByCategory(category: string): Promise<Question[]> {
    return Array.from(this.questionsMap.values()).filter(
      (question) => question.category === category
    );
  }

  async getQuestionsByCategoryAndDifficulty(
    category: string,
    difficulty: string
  ): Promise<Question[]> {
    return Array.from(this.questionsMap.values()).filter(
      (question) =>
        question.category === category && question.difficulty === difficulty
    );
  }

  async getQuestionsById(id: number): Promise<Question | undefined> {
    return this.questionsMap.get(id);
  }

  async createQuestion(question: InsertQuestion): Promise<Question> {
    const id = this.currentQuestionId++;
    const newQuestion: Question = { ...question, id };
    this.questionsMap.set(id, newQuestion);
    return newQuestion;
  }

  async searchQuestions(query: string): Promise<Question[]> {
    if (!query) return [];
    
    // Simple search in memory
    return Array.from(this.questionsMap.values()).filter(
      (question) => 
        question.text.includes(query) || 
        question.options.some(option => 
          typeof option === 'string' && option.includes(query)
        )
    );
  }

  // Test results operations
  async createTestResult(result: InsertUserTestResult): Promise<UserTestResult> {
    const id = this.currentTestResultId++;
    const testResult: UserTestResult = { ...result, id };
    this.userTestResultsMap.set(id, testResult);
    return testResult;
  }

  async getTestResultsByUser(userId: number): Promise<UserTestResult[]> {
    return Array.from(this.userTestResultsMap.values()).filter(
      (result) => result.userId === userId
    );
  }

  async getTestResultsByUserAndType(
    userId: number,
    testType: string
  ): Promise<UserTestResult[]> {
    return Array.from(this.userTestResultsMap.values()).filter(
      (result) => result.userId === userId && result.testType === testType
    );
  }
}

// Export storage instance
export const storage = new MemStorage();
