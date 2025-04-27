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
import fs from "fs";
import path from "path";

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
      // Load questions directly from the file instead of making a fetch request
      const questionsPath = path.resolve(
        process.cwd(),
        "attached_assets/questions_all.json"
      );
      
      if (fs.existsSync(questionsPath)) {
        const fileContent = fs.readFileSync(questionsPath, "utf-8");
        const questionsData = JSON.parse(fileContent);
        
        // Process verbal questions
        let count = 0;
        if (questionsData.verbal && Array.isArray(questionsData.verbal)) {
          for (const question of questionsData.verbal) {
            try {
              // Distribute difficulty levels
              let difficulty: TestDifficulty = "beginner";
              if (count % 3 === 1) difficulty = "intermediate";
              if (count % 3 === 2) difficulty = "advanced";
              
              // Add the question
              await this.createQuestion({
                category: "verbal",
                text: question.text,
                options: question.options,
                correctOptionIndex: question.correctOptionIndex,
                difficulty: difficulty
              });
              count++;
            } catch (error) {
              console.error("Error adding verbal question:", error);
            }
          }
        }
        
        // Process quantitative questions
        count = 0;
        if (questionsData.quantitative && Array.isArray(questionsData.quantitative)) {
          for (const question of questionsData.quantitative) {
            try {
              // Distribute difficulty levels
              let difficulty: TestDifficulty = "beginner";
              if (count % 3 === 1) difficulty = "intermediate";
              if (count % 3 === 2) difficulty = "advanced";
              
              // Add the question
              await this.createQuestion({
                category: "quantitative",
                text: question.text,
                options: question.options,
                correctOptionIndex: question.correctOptionIndex,
                difficulty: difficulty
              });
              count++;
            } catch (error) {
              console.error("Error adding quantitative question:", error);
            }
          }
        }
        console.log("Questions loaded successfully");
      } else {
        console.error("Questions file not found at:", questionsPath);
      }
    } catch (error) {
      console.error("Error loading questions:", error);
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
