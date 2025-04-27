import {
  users,
  questions,
  userTestResults,
  examTemplates,
  examSections,
  userCustomExams,
  dialects,
  synonyms,
  type User,
  type InsertUser,
  type Question,
  type InsertQuestion,
  type UserTestResult,
  type InsertUserTestResult,
  type ExamTemplate,
  type InsertExamTemplate,
  type ExamSection,
  type InsertExamSection,
  type UserCustomExam,
  type InsertUserCustomExam,
  type Dialect,
  type InsertDialect,
  type Synonym,
  type InsertSynonym,
} from "@shared/schema";
import { eq, and, like, sql, desc, asc, not, or } from 'drizzle-orm';
import { db } from './db';
import { TestType, TestDifficulty, DialectType, SearchResult } from "@shared/types";
import fs from "fs";
import path from "path";
import { stringSimilarity, findSimilarQuestions } from "../client/src/lib/fuzzySearch";

// Interface for storage operations
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
  
  // Initialize with seed data
  seedData(): Promise<void>;
}

// Database storage implementation
export class DatabaseStorage implements IStorage {
  constructor() {
    // Initialize with default data
    this.seedData();
  }

  async seedData(): Promise<void> {
    try {
      // Check if we already have questions in the database
      const questionCount = await db.select({ count: sql<number>`count(*)` }).from(questions);
      
      if (questionCount[0].count === 0) {
        console.log("Seeding initial data...");
        await this.seedQiyasExamTemplates();
        await this.seedDialects();
        await this.seedQuestionsFromFile();
      } else {
        console.log(`Database already contains ${questionCount[0].count} questions. Skipping seed.`);
      }
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
        console.log("Questions loaded successfully");
      } else {
        console.error("Questions file not found at:", questionsPath);
      }
    } catch (error) {
      console.error("Error loading questions:", error);
    }
  }

  // Helper function to extract keywords from text
  private extractKeywords(text: string): string[] {
    // Basic keyword extraction - remove common words and keep meaningful ones
    const stopWords = ["من", "إلى", "على", "في", "هو", "هي", "هم", "أن", "لا", "ما", "مع", "عن", "لم"];
    const words = text.replace(/[^\u0600-\u06FF\s]/g, '').split(/\s+/);
    const keywords = words
      .filter(word => word.length > 2 && !stopWords.includes(word))
      .map(word => word.trim());
    
    return [...new Set(keywords)]; // Remove duplicates
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUserPoints(userId: number, points: number): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ 
        points: sql`${users.points} + ${points}`,
        level: sql`CASE WHEN ${users.points} + ${points} >= 1000 THEN 2
                      WHEN ${users.points} + ${points} >= 3000 THEN 3
                      WHEN ${users.points} + ${points} >= 6000 THEN 4
                      WHEN ${users.points} + ${points} >= 10000 THEN 5
                      ELSE ${users.level} END`
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  // Question operations
  async getAllQuestions(): Promise<Question[]> {
    return db.select().from(questions);
  }

  async getQuestionsByCategory(category: string): Promise<Question[]> {
    return db.select().from(questions).where(eq(questions.category, category));
  }

  async getQuestionsByCategoryAndDifficulty(
    category: string,
    difficulty: string
  ): Promise<Question[]> {
    return db
      .select()
      .from(questions)
      .where(
        and(
          eq(questions.category, category),
          eq(questions.difficulty, difficulty)
        )
      );
  }

  async getQuestionsById(id: number): Promise<Question | undefined> {
    const [question] = await db.select().from(questions).where(eq(questions.id, id));
    return question;
  }

  async createQuestion(question: InsertQuestion): Promise<Question> {
    const [newQuestion] = await db.insert(questions).values(question).returning();
    return newQuestion;
  }

  async searchQuestions(query: string): Promise<Question[]> {
    if (!query) return [];
    
    return db
      .select()
      .from(questions)
      .where(
        or(
          like(questions.text, `%${query}%`),
          sql`${questions.keywords} ? ${query}`
        )
      )
      .limit(20);
  }

  async searchQuestionsAdvanced(query: string, options?: {
    category?: string;
    difficulty?: string;
    dialect?: string;
    limit?: number;
  }): Promise<SearchResult[]> {
    if (!query) return [];
    
    const limit = options?.limit || 10;
    
    // First, try exact match
    const exactConditions = [];
    if (options?.category) {
      exactConditions.push(eq(questions.category, options.category));
    }
    if (options?.difficulty) {
      exactConditions.push(eq(questions.difficulty, options.difficulty));
    }
    if (options?.dialect) {
      exactConditions.push(eq(questions.dialect, options.dialect));
    }
    
    // Base WHERE condition with the exact text match
    const baseCondition = like(questions.text, `%${query}%`);
    
    // Combine conditions
    const whereCondition = exactConditions.length > 0
      ? and(baseCondition, ...exactConditions)
      : baseCondition;
    
    // First query: exact matches
    const exactMatches = await db
      .select()
      .from(questions)
      .where(whereCondition)
      .limit(limit);
    
    const exactResults: SearchResult[] = exactMatches.map(q => ({
      question: q,
      matchType: 'exact'
    }));
    
    // If we have enough exact matches, just return them
    if (exactResults.length >= limit) {
      return exactResults;
    }
    
    // Second query: keyword matches
    const remainingLimit = limit - exactResults.length;
    const keywordMatches = await db
      .select()
      .from(questions)
      .where(
        and(
          not(like(questions.text, `%${query}%`)), // Exclude exact matches
          sql`${questions.keywords} ? ${query}`,
          ...exactConditions
        )
      )
      .limit(remainingLimit);
    
    const keywordResults: SearchResult[] = keywordMatches.map(q => ({
      question: q,
      matchType: 'keyword',
      matchedKeywords: (q.keywords as string[]).filter(k => 
        k.includes(query) || query.includes(k)
      )
    }));
    
    // Combine results
    let results = [...exactResults, ...keywordResults];
    
    // If we still need more, do fuzzy matching
    if (results.length < limit) {
      // Get more questions for fuzzy matching
      const potentialMatches = await db
        .select()
        .from(questions)
        .where(
          and(
            not(like(questions.text, `%${query}%`)), // Exclude exact matches
            not(sql`${questions.keywords} ? ${query}`), // Exclude keyword matches
            ...exactConditions
          )
        )
        .limit(100); // Get a larger set to find fuzzy matches
      
      // Calculate similarity
      const fuzzyMatches = potentialMatches.map(q => ({
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
    
    return results;
  }

  // Test results operations
  async createTestResult(result: InsertUserTestResult): Promise<UserTestResult> {
    const [testResult] = await db.insert(userTestResults).values(result).returning();
    return testResult;
  }

  async getTestResultsByUser(userId: number): Promise<UserTestResult[]> {
    return db
      .select()
      .from(userTestResults)
      .where(eq(userTestResults.userId, userId))
      .orderBy(desc(userTestResults.completedAt));
  }

  async getTestResultsByUserAndType(
    userId: number,
    testType: string
  ): Promise<UserTestResult[]> {
    return db
      .select()
      .from(userTestResults)
      .where(
        and(
          eq(userTestResults.userId, userId),
          eq(userTestResults.testType, testType)
        )
      )
      .orderBy(desc(userTestResults.completedAt));
  }

  // Exam template operations
  async createExamTemplate(template: InsertExamTemplate): Promise<ExamTemplate> {
    const [newTemplate] = await db.insert(examTemplates).values(template).returning();
    return newTemplate;
  }

  async getExamTemplates(): Promise<ExamTemplate[]> {
    return db.select().from(examTemplates);
  }

  async getExamTemplateById(id: number): Promise<ExamTemplate | undefined> {
    const [template] = await db.select().from(examTemplates).where(eq(examTemplates.id, id));
    return template;
  }

  async getQiyasExamTemplates(): Promise<ExamTemplate[]> {
    return db.select().from(examTemplates).where(eq(examTemplates.isQiyas, true));
  }

  // Exam section operations
  async createExamSection(section: InsertExamSection): Promise<ExamSection> {
    const [newSection] = await db.insert(examSections).values(section).returning();
    return newSection;
  }

  async getExamSectionsByExamId(examId: number): Promise<ExamSection[]> {
    return db
      .select()
      .from(examSections)
      .where(eq(examSections.examId, examId))
      .orderBy(asc(examSections.sectionNumber));
  }

  // User custom exam operations
  async createUserCustomExam(exam: InsertUserCustomExam): Promise<UserCustomExam> {
    const [newExam] = await db.insert(userCustomExams).values(exam).returning();
    return newExam;
  }

  async getUserCustomExams(userId: number): Promise<UserCustomExam[]> {
    return db
      .select()
      .from(userCustomExams)
      .where(eq(userCustomExams.userId, userId))
      .orderBy(desc(userCustomExams.createdAt));
  }

  // Dialect operations
  async createDialect(dialect: InsertDialect): Promise<Dialect> {
    const [newDialect] = await db.insert(dialects).values(dialect).returning();
    return newDialect;
  }

  async getDialects(): Promise<Dialect[]> {
    return db.select().from(dialects);
  }

  async getDialectByName(name: string): Promise<Dialect | undefined> {
    const [dialect] = await db.select().from(dialects).where(eq(dialects.name, name));
    return dialect;
  }

  // Synonym operations
  async createSynonym(synonym: InsertSynonym): Promise<Synonym> {
    const [newSynonym] = await db.insert(synonyms).values(synonym).returning();
    return newSynonym;
  }

  async getSynonymsByWord(word: string, dialect?: string): Promise<Synonym[]> {
    if (dialect) {
      return db
        .select()
        .from(synonyms)
        .where(
          and(
            eq(synonyms.word, word),
            eq(synonyms.dialect, dialect)
          )
        );
    } else {
      return db
        .select()
        .from(synonyms)
        .where(eq(synonyms.word, word));
    }
  }
}

// Export storage instance
export const storage = new DatabaseStorage();