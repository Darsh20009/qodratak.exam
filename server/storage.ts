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

// Time Management Interfaces
export interface Task {
  id: number;
  userId: number;
  title: string;
  description?: string;
  priority: string; // "high", "medium", "low"
  status: string; // "pending", "in_progress", "completed", "cancelled"
  category: string; // "work", "personal", "study", "fitness"
  dueDate?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  estimatedTime?: number; // in minutes
  actualTime?: number; // in minutes
  projectId?: number;
}

export interface Subtask {
  id: number;
  taskId: number;
  title: string;
  completed: boolean;
  createdAt: Date;
  order: number;
}

export interface Habit {
  id: number;
  userId: number;
  name: string;
  description?: string;
  frequency: string; // "daily", "weekly", "monthly"
  targetCount: number;
  category: string; // "health", "learning", "productivity", "social"
  icon: string;
  color: string;
  isActive: boolean;
  createdAt: Date;
}

export interface HabitLog {
  id: number;
  habitId: number;
  userId: number;
  date: Date;
  count: number;
  notes?: string;
  createdAt: Date;
}

export interface Project {
  id: number;
  userId: number;
  name: string;
  description?: string;
  status: string; // "active", "completed", "on_hold", "cancelled"
  startDate?: Date;
  endDate?: Date;
  color: string;
  createdAt: Date;
}

export interface PomodoroSession {
  id: number;
  userId: number;
  taskId?: number;
  duration: number; // in minutes
  type: string; // "work", "short_break", "long_break"
  startedAt: Date;
  completedAt?: Date;
  wasCompleted: boolean;
  notes?: string;
}

export interface TimeBlock {
  id: number;
  userId: number;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  taskId?: number;
  category: string;
  color: string;
  createdAt: Date;
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

// Time Management Insert Types
export type InsertTask = Omit<Task, "id" | "createdAt" | "updatedAt">;
export type InsertSubtask = Omit<Subtask, "id" | "createdAt">;
export type InsertHabit = Omit<Habit, "id" | "createdAt">;
export type InsertHabitLog = Omit<HabitLog, "id" | "createdAt">;
export type InsertProject = Omit<Project, "id" | "createdAt">;
export type InsertPomodoroSession = Omit<PomodoroSession, "id">;
export type InsertTimeBlock = Omit<TimeBlock, "id" | "createdAt">;

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
  
  // Time Management operations
  // Task operations
  createTask(task: InsertTask): Promise<Task>;
  getTasks(userId: number): Promise<Task[]>;
  getTaskById(id: number): Promise<Task | undefined>;
  updateTask(id: number, updates: Partial<InsertTask>): Promise<Task>;
  deleteTask(id: number): Promise<boolean>;
  getTasksByStatus(userId: number, status: string): Promise<Task[]>;
  getTasksByCategory(userId: number, category: string): Promise<Task[]>;
  
  // Subtask operations
  createSubtask(subtask: InsertSubtask): Promise<Subtask>;
  getSubtasksByTask(taskId: number): Promise<Subtask[]>;
  updateSubtask(id: number, updates: Partial<InsertSubtask>): Promise<Subtask>;
  deleteSubtask(id: number): Promise<boolean>;
  
  // Habit operations
  createHabit(habit: InsertHabit): Promise<Habit>;
  getHabits(userId: number): Promise<Habit[]>;
  getHabitById(id: number): Promise<Habit | undefined>;
  updateHabit(id: number, updates: Partial<InsertHabit>): Promise<Habit>;
  deleteHabit(id: number): Promise<boolean>;
  
  // Habit log operations
  createHabitLog(habitLog: InsertHabitLog): Promise<HabitLog>;
  getHabitLogs(habitId: number, startDate?: Date, endDate?: Date): Promise<HabitLog[]>;
  getHabitLogsByUser(userId: number, date?: Date): Promise<HabitLog[]>;
  
  // Project operations
  createProject(project: InsertProject): Promise<Project>;
  getProjects(userId: number): Promise<Project[]>;
  getProjectById(id: number): Promise<Project | undefined>;
  updateProject(id: number, updates: Partial<InsertProject>): Promise<Project>;
  deleteProject(id: number): Promise<boolean>;
  
  // Pomodoro session operations
  createPomodoroSession(session: InsertPomodoroSession): Promise<PomodoroSession>;
  getPomodoroSessions(userId: number, date?: Date): Promise<PomodoroSession[]>;
  updatePomodoroSession(id: number, updates: Partial<InsertPomodoroSession>): Promise<PomodoroSession>;
  
  // Time block operations
  createTimeBlock(timeBlock: InsertTimeBlock): Promise<TimeBlock>;
  getTimeBlocks(userId: number, startDate?: Date, endDate?: Date): Promise<TimeBlock[]>;
  updateTimeBlock(id: number, updates: Partial<InsertTimeBlock>): Promise<TimeBlock>;
  deleteTimeBlock(id: number): Promise<boolean>;
  
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
  
  // Time Management Storage
  private tasks: Task[] = [];
  private subtasks: Subtask[] = [];
  private habits: Habit[] = [];
  private habitLogs: HabitLog[] = [];
  private projects: Project[] = [];
  private pomodoroSessions: PomodoroSession[] = [];
  private timeBlocks: TimeBlock[] = [];
  
  private nextTaskId = 1;
  private nextSubtaskId = 1;
  private nextHabitId = 1;
  private nextHabitLogId = 1;
  private nextProjectId = 1;
  private nextPomodoroId = 1;
  private nextTimeBlockId = 1;

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

      // Add qualification exam template
      const qualificationTemplate = await this.createExamTemplate({
        name: "الاختبار التأهيلي الشامل",
        description: "اختبار تأهيلي شامل يتكون من سبعة أقسام للمشتركين فقط",
        totalSections: 7,
        totalQuestions: 120,
        totalTime: 120,
        isQiyas: true,
        requiresSubscription: true
      });

      // Add the 7 sections
      await this.createExamSection({
        examId: qualificationTemplate.id,
        name: "القسم الأول",
        sectionNumber: 1,
        category: "mixed",
        questionCount: 24,
        timeLimit: 24,
        verbalCount: 13,
        quantitativeCount: 11
      });

      await this.createExamSection({
        examId: qualificationTemplate.id,
        name: "القسم الثاني",
        sectionNumber: 2,
        category: "mixed",
        questionCount: 24,
        timeLimit: 24,
        verbalCount: 13,
        quantitativeCount: 11
      });

      await this.createExamSection({
        examId: qualificationTemplate.id,
        name: "القسم الثالث",
        sectionNumber: 3,
        category: "mixed",
        questionCount: 24,
        timeLimit: 24,
        verbalCount: 13,
        quantitativeCount: 11
      });

      await this.createExamSection({
        examId: qualificationTemplate.id,
        name: "القسم الرابع",
        sectionNumber: 4,
        category: "quantitative",
        questionCount: 11,
        timeLimit: 11
      });

      await this.createExamSection({
        examId: qualificationTemplate.id,
        name: "القسم الخامس",
        sectionNumber: 5,
        category: "verbal",
        questionCount: 13,
        timeLimit: 13
      });

      await this.createExamSection({
        examId: qualificationTemplate.id,
        name: "القسم السادس",
        sectionNumber: 6,
        category: "quantitative",
        questionCount: 11,
        timeLimit: 11
      });

      await this.createExamSection({
        examId: qualificationTemplate.id,
        name: "القسم السابع",
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
  
  // Folder operations
  async createFolder(folder: InsertFolder): Promise<Folder> {
    const id = this.folders.length > 0 ? Math.max(...this.folders.map(f => f.id)) + 1 : 1;
    const newFolder: Folder = {
      id,
      ...folder,
      createdAt: new Date(),
      isDefault: folder.isDefault || false
    };
    this.folders.push(newFolder);
    return newFolder;
  }

  async getFoldersByUser(userId: number): Promise<Folder[]> {
    return this.folders.filter(f => f.userId === userId);
  }

  async getFolderById(id: number): Promise<Folder | undefined> {
    return this.folders.find(f => f.id === id);
  }

  async deleteFolder(id: number): Promise<boolean> {
    const initialLength = this.folders.length;
    this.folders = this.folders.filter(f => f.id !== id);
    
    // Also delete any questions in this folder
    this.folderQuestions = this.folderQuestions.filter(fq => fq.folderId !== id);
    
    return initialLength > this.folders.length;
  }

  // Folder questions operations
  async addQuestionToFolder(folderQuestion: InsertFolderQuestion): Promise<FolderQuestion> {
    const id = this.folderQuestions.length > 0 ? 
      Math.max(...this.folderQuestions.map(fq => fq.id)) + 1 : 1;
    
    const newFolderQuestion: FolderQuestion = {
      id,
      ...folderQuestion,
      addedAt: new Date()
    };
    
    this.folderQuestions.push(newFolderQuestion);
    return newFolderQuestion;
  }

  async getQuestionsInFolder(folderId: number): Promise<Question[]> {
    const questionIds = this.folderQuestions
      .filter(fq => fq.folderId === folderId)
      .map(fq => fq.questionId);
    
    return this.questions.filter(q => questionIds.includes(q.id));
  }

  async removeQuestionFromFolder(folderId: number, questionId: number): Promise<boolean> {
    const initialLength = this.folderQuestions.length;
    this.folderQuestions = this.folderQuestions.filter(
      fq => !(fq.folderId === folderId && fq.questionId === questionId)
    );
    return initialLength > this.folderQuestions.length;
  }

  // Time Management Methods
  // Task operations
  async createTask(task: InsertTask): Promise<Task> {
    const newTask: Task = {
      id: this.nextTaskId++,
      ...task,
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: task.tags || []
    };
    this.tasks.push(newTask);
    return newTask;
  }

  async getTasks(userId: number): Promise<Task[]> {
    return this.tasks.filter(t => t.userId === userId);
  }

  async getTaskById(id: number): Promise<Task | undefined> {
    return this.tasks.find(t => t.id === id);
  }

  async updateTask(id: number, updates: Partial<InsertTask>): Promise<Task> {
    const taskIndex = this.tasks.findIndex(t => t.id === id);
    if (taskIndex === -1) throw new Error('Task not found');
    
    this.tasks[taskIndex] = { 
      ...this.tasks[taskIndex], 
      ...updates, 
      updatedAt: new Date() 
    };
    return this.tasks[taskIndex];
  }

  async deleteTask(id: number): Promise<boolean> {
    const initialLength = this.tasks.length;
    this.tasks = this.tasks.filter(t => t.id !== id);
    this.subtasks = this.subtasks.filter(st => st.taskId !== id);
    return initialLength > this.tasks.length;
  }

  async getTasksByStatus(userId: number, status: string): Promise<Task[]> {
    return this.tasks.filter(t => t.userId === userId && t.status === status);
  }

  async getTasksByCategory(userId: number, category: string): Promise<Task[]> {
    return this.tasks.filter(t => t.userId === userId && t.category === category);
  }

  // Subtask operations
  async createSubtask(subtask: InsertSubtask): Promise<Subtask> {
    const newSubtask: Subtask = {
      id: this.nextSubtaskId++,
      ...subtask,
      createdAt: new Date()
    };
    this.subtasks.push(newSubtask);
    return newSubtask;
  }

  async getSubtasksByTask(taskId: number): Promise<Subtask[]> {
    return this.subtasks.filter(st => st.taskId === taskId).sort((a, b) => a.order - b.order);
  }

  async updateSubtask(id: number, updates: Partial<InsertSubtask>): Promise<Subtask> {
    const subtaskIndex = this.subtasks.findIndex(st => st.id === id);
    if (subtaskIndex === -1) throw new Error('Subtask not found');
    
    this.subtasks[subtaskIndex] = { ...this.subtasks[subtaskIndex], ...updates };
    return this.subtasks[subtaskIndex];
  }

  async deleteSubtask(id: number): Promise<boolean> {
    const initialLength = this.subtasks.length;
    this.subtasks = this.subtasks.filter(st => st.id !== id);
    return initialLength > this.subtasks.length;
  }

  // Habit operations
  async createHabit(habit: InsertHabit): Promise<Habit> {
    const newHabit: Habit = {
      id: this.nextHabitId++,
      ...habit,
      createdAt: new Date()
    };
    this.habits.push(newHabit);
    return newHabit;
  }

  async getHabits(userId: number): Promise<Habit[]> {
    return this.habits.filter(h => h.userId === userId && h.isActive);
  }

  async getHabitById(id: number): Promise<Habit | undefined> {
    return this.habits.find(h => h.id === id);
  }

  async updateHabit(id: number, updates: Partial<InsertHabit>): Promise<Habit> {
    const habitIndex = this.habits.findIndex(h => h.id === id);
    if (habitIndex === -1) throw new Error('Habit not found');
    
    this.habits[habitIndex] = { ...this.habits[habitIndex], ...updates };
    return this.habits[habitIndex];
  }

  async deleteHabit(id: number): Promise<boolean> {
    const initialLength = this.habits.length;
    this.habits = this.habits.filter(h => h.id !== id);
    this.habitLogs = this.habitLogs.filter(hl => hl.habitId !== id);
    return initialLength > this.habits.length;
  }

  // Habit log operations
  async createHabitLog(habitLog: InsertHabitLog): Promise<HabitLog> {
    const newHabitLog: HabitLog = {
      id: this.nextHabitLogId++,
      ...habitLog,
      createdAt: new Date()
    };
    this.habitLogs.push(newHabitLog);
    return newHabitLog;
  }

  async getHabitLogs(habitId: number, startDate?: Date, endDate?: Date): Promise<HabitLog[]> {
    let logs = this.habitLogs.filter(hl => hl.habitId === habitId);
    
    if (startDate) {
      logs = logs.filter(hl => hl.date >= startDate);
    }
    if (endDate) {
      logs = logs.filter(hl => hl.date <= endDate);
    }
    
    return logs.sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  async getHabitLogsByUser(userId: number, date?: Date): Promise<HabitLog[]> {
    let logs = this.habitLogs.filter(hl => hl.userId === userId);
    
    if (date) {
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);
      
      logs = logs.filter(hl => hl.date >= dayStart && hl.date <= dayEnd);
    }
    
    return logs;
  }

  // Project operations
  async createProject(project: InsertProject): Promise<Project> {
    const newProject: Project = {
      id: this.nextProjectId++,
      ...project,
      createdAt: new Date()
    };
    this.projects.push(newProject);
    return newProject;
  }

  async getProjects(userId: number): Promise<Project[]> {
    return this.projects.filter(p => p.userId === userId);
  }

  async getProjectById(id: number): Promise<Project | undefined> {
    return this.projects.find(p => p.id === id);
  }

  async updateProject(id: number, updates: Partial<InsertProject>): Promise<Project> {
    const projectIndex = this.projects.findIndex(p => p.id === id);
    if (projectIndex === -1) throw new Error('Project not found');
    
    this.projects[projectIndex] = { ...this.projects[projectIndex], ...updates };
    return this.projects[projectIndex];
  }

  async deleteProject(id: number): Promise<boolean> {
    const initialLength = this.projects.length;
    this.projects = this.projects.filter(p => p.id !== id);
    this.tasks = this.tasks.filter(t => t.projectId !== id);
    return initialLength > this.projects.length;
  }

  // Pomodoro session operations
  async createPomodoroSession(session: InsertPomodoroSession): Promise<PomodoroSession> {
    const newSession: PomodoroSession = {
      id: this.nextPomodoroId++,
      ...session
    };
    this.pomodoroSessions.push(newSession);
    return newSession;
  }

  async getPomodoroSessions(userId: number, date?: Date): Promise<PomodoroSession[]> {
    let sessions = this.pomodoroSessions.filter(ps => ps.userId === userId);
    
    if (date) {
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);
      
      sessions = sessions.filter(ps => ps.startedAt >= dayStart && ps.startedAt <= dayEnd);
    }
    
    return sessions.sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
  }

  async updatePomodoroSession(id: number, updates: Partial<InsertPomodoroSession>): Promise<PomodoroSession> {
    const sessionIndex = this.pomodoroSessions.findIndex(ps => ps.id === id);
    if (sessionIndex === -1) throw new Error('Pomodoro session not found');
    
    this.pomodoroSessions[sessionIndex] = { ...this.pomodoroSessions[sessionIndex], ...updates };
    return this.pomodoroSessions[sessionIndex];
  }

  // Time block operations
  async createTimeBlock(timeBlock: InsertTimeBlock): Promise<TimeBlock> {
    const newTimeBlock: TimeBlock = {
      id: this.nextTimeBlockId++,
      ...timeBlock,
      createdAt: new Date()
    };
    this.timeBlocks.push(newTimeBlock);
    return newTimeBlock;
  }

  async getTimeBlocks(userId: number, startDate?: Date, endDate?: Date): Promise<TimeBlock[]> {
    let blocks = this.timeBlocks.filter(tb => tb.userId === userId);
    
    if (startDate) {
      blocks = blocks.filter(tb => tb.startTime >= startDate);
    }
    if (endDate) {
      blocks = blocks.filter(tb => tb.endTime <= endDate);
    }
    
    return blocks.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  }

  async updateTimeBlock(id: number, updates: Partial<InsertTimeBlock>): Promise<TimeBlock> {
    const blockIndex = this.timeBlocks.findIndex(tb => tb.id === id);
    if (blockIndex === -1) throw new Error('Time block not found');
    
    this.timeBlocks[blockIndex] = { ...this.timeBlocks[blockIndex], ...updates };
    return this.timeBlocks[blockIndex];
  }

  async deleteTimeBlock(id: number): Promise<boolean> {
    const initialLength = this.timeBlocks.length;
    this.timeBlocks = this.timeBlocks.filter(tb => tb.id !== id);
    return initialLength > this.timeBlocks.length;
  }
}

// Export storage instance
export const storage = new MemStorage();