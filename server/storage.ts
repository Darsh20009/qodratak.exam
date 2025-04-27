import fs from "fs";
import path from "path";
import {
  TestType,
  TestDifficulty,
  DialectType,
  TestQuestion,
  SearchResult,
} from "@shared/types";
import { stringSimilarity, findSimilarQuestions } from "../client/src/lib/fuzzySearch";

// Type definitions 
export interface User {
  id: number;
  username: string;
  password: string;
  points: number;
  level: number;
  createdAt: Date;
  lastLogin: Date;
}

export interface Question {
  id: number;
  category: string;
  text: string;
  options: string[];
  correctOptionIndex: number;
  difficulty: string;
  topic?: string;
  dialect?: string;
  keywords?: string[];
  section?: number;
  explanation?: string;
}

export interface UserTestResult {
  id: number;
  userId: number;
  testType: string;
  difficulty: string;
  score: number;
  totalQuestions: number;
  completedAt: Date;
  pointsEarned: number;
  timeTaken?: number;
  isOfficial?: boolean;
}

export interface ExamTemplate {
  id: number;
  name: string;
  description?: string;
  totalSections: number;
  totalQuestions: number;
  totalTime: number;
  isQiyas: boolean;
  createdAt: Date;
}

export interface ExamSection {
  id: number;
  examId: number;
  name: string;
  sectionNumber: number;
  category: string;
  questionCount: number;
  timeLimit: number;
}

export interface UserCustomExam {
  id: number;
  userId: number;
  name: string;
  description?: string;
  questionCount: number;
  timeLimit: number;
  categories: string[];
  difficulty: string;
  createdAt: Date;
}

export interface Dialect {
  id: number;
  name: string;
  description?: string;
  examples: string[];
}

export interface Synonym {
  id: number;
  word: string;
  synonyms: string[];
  dialect: string;
}

export interface Folder {
  id: number;
  userId: number;
  name: string;
  description?: string;
  color: string;
  icon: string;
  createdAt: Date;
  isDefault: boolean;
}

export interface FolderQuestion {
  id: number;
  folderId: number;
  questionId: number;
  addedAt: Date;
  notes?: string;
}

// Insert types (simplified for in-memory usage)
export type InsertUser = Omit<User, "id" | "createdAt" | "lastLogin">;
export type InsertQuestion = Omit<Question, "id">;
export type InsertUserTestResult = Omit<UserTestResult, "id" | "completedAt">;
export type InsertExamTemplate = Omit<ExamTemplate, "id" | "createdAt">;
export type InsertExamSection = Omit<ExamSection, "id">;
export type InsertUserCustomExam = Omit<UserCustomExam, "id" | "createdAt">;
export type InsertDialect = Omit<Dialect, "id">;
export type InsertSynonym = Omit<Synonym, "id">;
export type InsertFolder = Omit<Folder, "id" | "createdAt">;
export type InsertFolderQuestion = Omit<FolderQuestion, "id" | "addedAt">;

// Storage interface definition
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserPoints(userId: number, points: number): Promise<User>;

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
  searchQuestionsAdvanced(query: string, options?: {
    category?: string;
    difficulty?: string;
    dialect?: string;
    limit?: number;
  }): Promise<SearchResult[]>;
  
  // Test results operations
  createTestResult(result: InsertUserTestResult): Promise<UserTestResult>;
  getTestResultsByUser(userId: number): Promise<UserTestResult[]>;
  getTestResultsByUserAndType(
    userId: number,
    testType: string
  ): Promise<UserTestResult[]>;
  
  // Exam template operations
  createExamTemplate(template: InsertExamTemplate): Promise<ExamTemplate>;
  getExamTemplates(): Promise<ExamTemplate[]>;
  getExamTemplateById(id: number): Promise<ExamTemplate | undefined>;
  getQiyasExamTemplates(): Promise<ExamTemplate[]>;
  
  // Exam section operations
  createExamSection(section: InsertExamSection): Promise<ExamSection>;
  getExamSectionsByExamId(examId: number): Promise<ExamSection[]>;
  
  // User custom exam operations
  createUserCustomExam(exam: InsertUserCustomExam): Promise<UserCustomExam>;
  getUserCustomExams(userId: number): Promise<UserCustomExam[]>;
  
  // Dialect operations
  createDialect(dialect: InsertDialect): Promise<Dialect>;
  getDialects(): Promise<Dialect[]>;
  getDialectByName(name: string): Promise<Dialect | undefined>;
  
  // Synonym operations
  createSynonym(synonym: InsertSynonym): Promise<Synonym>;
  getSynonymsByWord(word: string, dialect?: string): Promise<Synonym[]>;
  
  // Folder operations
  createFolder(folder: InsertFolder): Promise<Folder>;
  getFoldersByUser(userId: number): Promise<Folder[]>;
  getFolderById(id: number): Promise<Folder | undefined>;
  deleteFolder(id: number): Promise<boolean>;
  
  // Folder questions operations
  addQuestionToFolder(folderQuestion: InsertFolderQuestion): Promise<FolderQuestion>;
  getQuestionsInFolder(folderId: number): Promise<Question[]>;
  removeQuestionFromFolder(folderId: number, questionId: number): Promise<boolean>;
  
  // Initialize with seed data
  seedData(): Promise<void>;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private users: User[] = [];
  private questions: Question[] = [];
  private userTestResults: UserTestResult[] = [];
  private examTemplates: ExamTemplate[] = [];
  private examSections: ExamSection[] = [];
  private userCustomExams: UserCustomExam[] = [];
  private dialects: Dialect[] = [];
  private synonyms: Synonym[] = [];
  private folders: Folder[] = [];
  private folderQuestions: FolderQuestion[] = [];

  constructor() {
    // Initialize with default data
    this.seedData();
  }

  async seedData(): Promise<void> {
    try {
      console.log("Seeding initial data...");
      await this.seedQiyasExamTemplates();
      await this.seedDialects();
      await this.seedQuestionsFromFile();
    } catch (error) {
      console.error("Error seeding data:", error);
    }
  }

  private async seedQiyasExamTemplates(): Promise<void> {
    try {
      // Create the official Qiyas exam template
      const qiyasTemplate = await this.createExamTemplate({
        name: "اختبار قياس الرسمي",
        description: "محاكاة كاملة لاختبار هيئة تقويم التعليم والتدريب",
        totalSections: 7,
        totalQuestions: 120,
        totalTime: 120,
        isQiyas: true
      });

      // Create sections
      for (let i = 1; i <= 3; i++) {
        await this.createExamSection({
          examId: qiyasTemplate.id,
          name: `القسم ${i}`,
          sectionNumber: i,
          category: "mixed",
          questionCount: 24,
          timeLimit: 24
        });
      }

      // Section 4: Quantitative
      await this.createExamSection({
        examId: qiyasTemplate.id,
        name: "القسم 4",
        sectionNumber: 4,
        category: "quantitative",
        questionCount: 11,
        timeLimit: 11
      });

      // Section 5: Verbal
      await this.createExamSection({
        examId: qiyasTemplate.id,
        name: "القسم 5",
        sectionNumber: 5,
        category: "verbal",
        questionCount: 13,
        timeLimit: 13
      });

      // Section 6: Quantitative
      await this.createExamSection({
        examId: qiyasTemplate.id,
        name: "القسم 6",
        sectionNumber: 6,
        category: "quantitative",
        questionCount: 11,
        timeLimit: 11
      });

      // Section 7: Verbal
      await this.createExamSection({
        examId: qiyasTemplate.id,
        name: "القسم 7",
        sectionNumber: 7,
        category: "verbal",
        questionCount: 13,
        timeLimit: 13
      });

      console.log("Qiyas exam templates seeded successfully");
    } catch (error) {
      console.error("Error seeding Qiyas exam templates:", error);
    }
  }

  private async seedDialects(): Promise<void> {
    try {
      await this.createDialect({
        name: "standard",
        description: "اللغة العربية الفصحى",
        examples: ["مرحباً", "كيف حالك؟", "شكراً جزيلاً"]
      });

      await this.createDialect({
        name: "saudi",
        description: "اللهجة السعودية",
        examples: ["وش لونك؟", "يعطيك العافية", "فمان الله"]
      });

      await this.createDialect({
        name: "egyptian",
        description: "اللهجة المصرية",
        examples: ["إزيك", "عامل إيه؟", "مبروك عليك"]
      });

      await this.createDialect({
        name: "gulf",
        description: "اللهجة الخليجية",
        examples: ["شخبارك", "شلونك", "مشكور"]
      });

      console.log("Dialects seeded successfully");
    } catch (error) {
      console.error("Error seeding dialects:", error);
    }
  }

  private async seedQuestionsFromFile(): Promise<void> {
    try {
      // Load questions from JSON file
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
              
              // Generate keywords from question text
              const keywords = this.extractKeywords(question.text);
              
              // Add the question
              await this.createQuestion({
                category: "verbal",
                text: question.text,
                options: question.options,
                correctOptionIndex: question.correctOptionIndex,
                difficulty: difficulty,
                topic: "general",
                dialect: "standard",
                keywords: keywords,
                section: Math.floor(count / 20) + 1
              });
              count++;
              
              if (count % 100 === 0) {
                console.log(`Processed ${count} verbal questions`);
              }
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
              
              // Generate keywords from question text
              const keywords = this.extractKeywords(question.text);
              
              // Add the question
              await this.createQuestion({
                category: "quantitative",
                text: question.text,
                options: question.options,
                correctOptionIndex: question.correctOptionIndex,
                difficulty: difficulty,
                topic: "general",
                dialect: "standard",
                keywords: keywords,
                section: Math.floor(count / 20) + 1
              });
              count++;
              
              if (count % 100 === 0) {
                console.log(`Processed ${count} quantitative questions`);
              }
            } catch (error) {
              console.error("Error adding quantitative question:", error);
            }
          }
        }
        console.log("Questions loaded successfully from file");
      } else {
        console.error("Questions file not found at:", questionsPath);
      }
    } catch (error) {
      console.error("Error loading questions from file:", error);
    }
  }

  // Helper function to extract keywords from text
  private extractKeywords(text: string): string[] {
    // Check if text is defined and is a string
    if (!text || typeof text !== 'string') {
      return []; // Return empty array if text is undefined or not a string
    }
    
    // Basic keyword extraction - remove common words and keep meaningful ones
    const stopWords = ["من", "إلى", "على", "في", "هو", "هي", "هم", "أن", "لا", "ما", "مع", "عن", "لم"];
    // Use a more flexible regex that handles both Arabic and English text
    const words = text.replace(/[^\u0600-\u06FF\w\s]/g, '').split(/\s+/);
    const keywords = words
      .filter(word => word.length > 2 && !stopWords.includes(word))
      .map(word => word.trim());
    
    return [...new Set(keywords)]; // Remove duplicates
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.find(user => user.id === id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return this.users.find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.users.length > 0 ? Math.max(...this.users.map(u => u.id)) + 1 : 1;
    const now = new Date();
    const user: User = {
      id,
      ...insertUser,
      createdAt: now,
      lastLogin: now
    };
    this.users.push(user);
    return user;
  }

  async updateUserPoints(userId: number, points: number): Promise<User> {
    const userIndex = this.users.findIndex(user => user.id === userId);
    if (userIndex === -1) {
      throw new Error(`User with ID ${userId} not found`);
    }
    
    const user = this.users[userIndex];
    const updatedPoints = user.points + points;
    
    // Calculate new level based on points
    let newLevel = user.level;
    if (updatedPoints >= 10000) newLevel = 5;
    else if (updatedPoints >= 6000) newLevel = 4;
    else if (updatedPoints >= 3000) newLevel = 3;
    else if (updatedPoints >= 1000) newLevel = 2;
    
    const updatedUser: User = {
      ...user,
      points: updatedPoints,
      level: newLevel
    };
    
    this.users[userIndex] = updatedUser;
    return updatedUser;
  }

  // Question operations
  async getAllQuestions(): Promise<Question[]> {
    return this.questions;
  }

  async getQuestionsByCategory(category: string): Promise<Question[]> {
    return this.questions.filter(q => q.category === category);
  }

  async getQuestionsByCategoryAndDifficulty(
    category: string,
    difficulty: string
  ): Promise<Question[]> {
    return this.questions.filter(
      q => q.category === category && q.difficulty === difficulty
    );
  }

  async getQuestionsById(id: number): Promise<Question | undefined> {
    return this.questions.find(q => q.id === id);
  }

  async createQuestion(question: InsertQuestion): Promise<Question> {
    const id = this.questions.length > 0 ? Math.max(...this.questions.map(q => q.id)) + 1 : 1;
    const newQuestion: Question = { id, ...question };
    this.questions.push(newQuestion);
    return newQuestion;
  }

  async searchQuestions(query: string): Promise<Question[]> {
    if (!query) return [];
    
    const exactMatches = this.questions.filter(q => 
      q.text.includes(query) || 
      (q.keywords && q.keywords.some(kw => kw.includes(query)))
    );
    
    return exactMatches.slice(0, 20);
  }

  async searchQuestionsAdvanced(query: string, options?: {
    category?: string;
    difficulty?: string;
    dialect?: string;
    limit?: number;
  }): Promise<SearchResult[]> {
    if (!query) return [];
    
    const limit = options?.limit || 10;
    let filteredQuestions = [...this.questions];
    
    // Apply filters
    if (options?.category) {
      filteredQuestions = filteredQuestions.filter(q => q.category === options.category);
    }
    if (options?.difficulty) {
      filteredQuestions = filteredQuestions.filter(q => q.difficulty === options.difficulty);
    }
    if (options?.dialect) {
      filteredQuestions = filteredQuestions.filter(q => q.dialect === options.dialect);
    }
    
    // First, get exact text matches
    const exactMatches = filteredQuestions.filter(q => q.text.includes(query));
    const exactResults: SearchResult[] = exactMatches.map(q => ({
      question: q,
      matchType: 'exact'
    }));
    
    // If we have enough exact matches, just return them
    if (exactResults.length >= limit) {
      return exactResults.slice(0, limit);
    }
    
    // Second, get keyword matches
    const keywordMatches = filteredQuestions.filter(q => 
      !q.text.includes(query) && // Exclude exact matches
      q.keywords && 
      q.keywords.some(kw => kw.includes(query) || query.includes(kw))
    );
    
    const keywordResults: SearchResult[] = keywordMatches.map(q => ({
      question: q,
      matchType: 'keyword',
      matchedKeywords: q.keywords?.filter(k => 
        k.includes(query) || query.includes(k)
      )
    }));
    
    // Combine results
    let results = [...exactResults, ...keywordResults];
    
    // If we still need more, do fuzzy matching
    if (results.length < limit) {
      // Get remaining questions for fuzzy matching (that weren't already matched)
      const remainingQuestions = filteredQuestions.filter(q => 
        !q.text.includes(query) && 
        !(q.keywords && q.keywords.some(kw => kw.includes(query) || query.includes(kw)))
      );
      
      // Calculate similarity
      const fuzzyMatches = remainingQuestions.map(q => ({
        question: q,
        similarity: stringSimilarity(query, q.text)
      }))
      .filter(m => m.similarity > 0.4) // Threshold for similarity
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit - results.length);
      
      const fuzzyResults: SearchResult[] = fuzzyMatches.map(m => ({
        question: m.question,
        matchType: 'similar',
        similarity: m.similarity
      }));
      
      results = [...results, ...fuzzyResults];
    }
    
    return results.slice(0, limit);
  }

  // Test results operations
  async createTestResult(result: InsertUserTestResult): Promise<UserTestResult> {
    const id = this.userTestResults.length > 0 
      ? Math.max(...this.userTestResults.map(r => r.id)) + 1
      : 1;
    
    const testResult: UserTestResult = {
      id,
      ...result,
      completedAt: new Date()
    };
    
    this.userTestResults.push(testResult);
    return testResult;
  }

  async getTestResultsByUser(userId: number): Promise<UserTestResult[]> {
    return this.userTestResults
      .filter(r => r.userId === userId)
      .sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime());
  }

  async getTestResultsByUserAndType(
    userId: number,
    testType: string
  ): Promise<UserTestResult[]> {
    return this.userTestResults
      .filter(r => r.userId === userId && r.testType === testType)
      .sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime());
  }

  // Exam template operations
  async createExamTemplate(template: InsertExamTemplate): Promise<ExamTemplate> {
    const id = this.examTemplates.length > 0 
      ? Math.max(...this.examTemplates.map(t => t.id)) + 1
      : 1;
    
    const examTemplate: ExamTemplate = {
      id,
      ...template,
      createdAt: new Date()
    };
    
    this.examTemplates.push(examTemplate);
    return examTemplate;
  }

  async getExamTemplates(): Promise<ExamTemplate[]> {
    return this.examTemplates;
  }

  async getExamTemplateById(id: number): Promise<ExamTemplate | undefined> {
    return this.examTemplates.find(t => t.id === id);
  }

  async getQiyasExamTemplates(): Promise<ExamTemplate[]> {
    return this.examTemplates.filter(t => t.isQiyas);
  }

  // Exam section operations
  async createExamSection(section: InsertExamSection): Promise<ExamSection> {
    const id = this.examSections.length > 0 
      ? Math.max(...this.examSections.map(s => s.id)) + 1
      : 1;
    
    const examSection: ExamSection = {
      id,
      ...section
    };
    
    this.examSections.push(examSection);
    return examSection;
  }

  async getExamSectionsByExamId(examId: number): Promise<ExamSection[]> {
    return this.examSections
      .filter(s => s.examId === examId)
      .sort((a, b) => a.sectionNumber - b.sectionNumber);
  }

  // User custom exam operations
  async createUserCustomExam(exam: InsertUserCustomExam): Promise<UserCustomExam> {
    const id = this.userCustomExams.length > 0 
      ? Math.max(...this.userCustomExams.map(e => e.id)) + 1
      : 1;
    
    const userCustomExam: UserCustomExam = {
      id,
      ...exam,
      createdAt: new Date()
    };
    
    this.userCustomExams.push(userCustomExam);
    return userCustomExam;
  }

  async getUserCustomExams(userId: number): Promise<UserCustomExam[]> {
    return this.userCustomExams
      .filter(e => e.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // Dialect operations
  async createDialect(dialect: InsertDialect): Promise<Dialect> {
    const id = this.dialects.length > 0 
      ? Math.max(...this.dialects.map(d => d.id)) + 1
      : 1;
    
    const newDialect: Dialect = {
      id,
      ...dialect
    };
    
    this.dialects.push(newDialect);
    return newDialect;
  }

  async getDialects(): Promise<Dialect[]> {
    return this.dialects;
  }

  async getDialectByName(name: string): Promise<Dialect | undefined> {
    return this.dialects.find(d => d.name === name);
  }

  // Synonym operations
  async createSynonym(synonym: InsertSynonym): Promise<Synonym> {
    const id = this.synonyms.length > 0 
      ? Math.max(...this.synonyms.map(s => s.id)) + 1
      : 1;
    
    const newSynonym: Synonym = {
      id,
      ...synonym
    };
    
    this.synonyms.push(newSynonym);
    return newSynonym;
  }

  async getSynonymsByWord(word: string, dialect?: string): Promise<Synonym[]> {
    if (dialect) {
      return this.synonyms.filter(s => s.word === word && s.dialect === dialect);
    } else {
      return this.synonyms.filter(s => s.word === word);
    }
  }
}

// Export storage instance
export const storage = new MemStorage();