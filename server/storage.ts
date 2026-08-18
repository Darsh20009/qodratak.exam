import fs from "fs";
import path from "path";
import {
  TestType,
  TestDifficulty,
  DialectType,
  TestQuestion,
  SearchResult,
} from "@shared/types";
import { fuzzySearch } from "../client/src/lib/fuzzySearch";

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
  category: TestType;
  subcategory?: string; // Arabic subcategory like "التناظر اللفظي", "الهندسة"
  text: string;
  options: string[];
  correctOptionIndex: number;
  difficulty: TestDifficulty;
  topic?: string;
  dialect?: DialectType;
  keywords?: string[];
  section?: number;
  explanation?: string;
}

export interface UserTestResult {
  id: number;
  userId: number;
  testType: TestType;
  difficulty: TestDifficulty;
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
  requiresSubscription?: boolean;
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
  verbalCount?: number;
  quantitativeCount?: number;
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

// Simple similarity calculation function
function calculateSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0;
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();

  if (s1 === s2) return 1;

  // Simple character-based similarity
  let matches = 0;
  const maxLen = Math.max(s1.length, s2.length);
  const minLen = Math.min(s1.length, s2.length);

  for (let i = 0; i < minLen; i++) {
    if (s1[i] === s2[i]) matches++;
  }

  return matches / maxLen;
}

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
  clearAllQuestions(): Promise<void>;
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
  addQuestionsToFolderBulk(folderId: number, questionIds: number[]): Promise<{ added: number; skipped: number; total: number }>;
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

  // Leaderboard and Badges operations
  getAllBadges(): Promise<any[]>;
  getUserBadges(userId: number): Promise<any[]>;
  awardBadge(userId: number, badgeId: number, reason?: string): Promise<any>;
  checkAndAwardBadges(userId: number, testResult: UserTestResult): Promise<any[]>;
  awardBadgeToUser(userId: number, badgeId: number): Promise<any>; // Added helper function

  // Leaderboard operations
  getLeaderboard(limit?: number): Promise<any[]>;
  updateLeaderboardEntry(userId: number, pointsEarned: number): Promise<any>;
  getUserRank(userId: number): Promise<any | undefined>;
  getTopUsers(limit: number): Promise<any[]>;

  // Weekly progress operations
  createWeeklyProgress(progress: any): Promise<any>;
  getWeeklyProgress(userId: number): Promise<any[]>;
  getCurrentWeekProgress(userId: number): Promise<any | undefined>;

  // Monthly winners operations
  createMonthlyWinner(winner: any): Promise<any>;
  getMonthlyWinners(month: number, year: number): Promise<any[]>;
  getCurrentMonthWinners(): Promise<any[]>;

  // Analytics operations (for badge progress)
  getAnalytics(userId: number): Promise<any[]>; // Placeholder for analytics data

  // Paper Models operations (Global - same for all users)
  getAllPaperModels(): Promise<any[]>;
  getPaperModelByNumber(modelNumber: number): Promise<any | undefined>;
  createGlobalPaperModel(model: any): Promise<any>;
  seedPaperModels(): Promise<void>;

  // Paper Model Results operations (Per user)
  createPaperModelResult(result: any): Promise<any>;
  getPaperModelResults(userId: number): Promise<any[]>;
  getPaperModelResultsByModel(userId: number, modelNumber: number): Promise<any | undefined>;
  getPaperModelAverages(userId: number): Promise<any>;

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

  // Leaderboard and Badges Storage
  private badges: any[] = [];
  private userBadges: any[] = [];
  private leaderboardEntries: any[] = [];
  private weeklyProgress: any[] = [];
  private monthlyWinners: any[] = [];

  // Paper Models Storage
  private paperModels: any[] = [];
  private paperModelResults: any[] = [];

  // Daily points tracking for bot students (natural progression)
  private botDailyPoints: Map<number, {
    pointsToday: number,
    dailyLimit: number,
    lastResetDate: string
  }> = new Map();

  private nextTaskId = 1;
  private nextSubtaskId = 1;
  private nextHabitId = 1;
  private nextHabitLogId = 1;
  private nextProjectId = 1;
  private nextPomodoroId = 1;
  private nextTimeBlockId = 1;
  private nextBadgeId = 1;
  private nextUserBadgeId = 1;
  private nextLeaderboardId = 1;
  private nextWeeklyProgressId = 1;
  private nextMonthlyWinnerId = 1;
  private nextPaperModelId = 1;
  private nextPaperModelResultId = 1;

  private isInitialized = false;

  constructor() {
    // Initialize data asynchronously
    this.initializeData().catch(err => {
      console.error("Fatal error during initialization:", err);
    });
  }

  private async initializeData() {
    if (this.isInitialized) return;

    try {
      console.log("🚀 Initializing storage system...");
      // MongoDB-only mode: skip PostgreSQL, seed in-memory data from MongoDB/files
      await this.seedData();
      this.isInitialized = true;
      console.log("✅ Storage system initialized successfully");
    } catch (error) {
      console.error("❌ Error initializing data:", error);
      await this.seedData();
      this.isInitialized = true;
    }
  }

  // Ensure data is loaded before any operation
  private async ensureInitialized() {
    let attempts = 0;
    while (!this.isInitialized && attempts < 100) {
      await new Promise(resolve => setTimeout(resolve, 50));
      attempts++;
    }
  }

  private async loadFromDatabase(): Promise<boolean> {
    try {
      const { db } = await import('./db');

      if (!db) {
        console.log('No database configured - using seed data');
        return false;
      }

      console.log('📊 Loading data from PostgreSQL database...');

      // Load leaderboard entries from database
      const { leaderboardEntries } = await import('@shared/schema');
      const dbLeaderboard = await db.select().from(leaderboardEntries);

      if (dbLeaderboard && dbLeaderboard.length > 0) {
        console.log(`✅ Loaded ${dbLeaderboard.length} leaderboard entries from database`);

        // Convert database entries to memory format
        this.leaderboardEntries = dbLeaderboard.map(entry => ({
          id: entry.id,
          userId: entry.userId,
          username: `User ${entry.userId}`, // Will be updated when user logs in
          totalPoints: entry.totalPoints || 0,
          currentRank: entry.currentRank || 0,
          previousRank: entry.previousRank || 0,
          rankChange: entry.rankChange || 'stable',
          weeklyPoints: entry.weeklyPoints || 0,
          monthlyPoints: entry.monthlyPoints || 0,
          totalTests: entry.totalTests || 0,
          averageScore: entry.averageScore || 0,
          lastUpdated: entry.lastUpdated || new Date()
        }));

        // Update nextLeaderboardId
        if (this.leaderboardEntries.length > 0) {
          this.nextLeaderboardId = Math.max(...this.leaderboardEntries.map(e => e.id)) + 1;
        }

        // Still need to seed questions and templates
        await this.seedQiyasExamTemplates();
        await this.seedDialects();
        await this.seedQuestionsFromFile();
        await this.seedBadges();
        await this.seedMonthlyWinners();

        return true;
      } else {
        console.log('No leaderboard data in database - using seed data');
        return false;
      }
    } catch (error) {
      console.error('Error loading from database:', error);
      return false;
    }
  }

  async seedData(): Promise<void> {
    try {
      console.log("Seeding initial data...");
      await this.seedQiyasExamTemplates();
      await this.seedDialects();
      await this.seedQuestionsFromFile();
      await this.seedBadges();
      await this.seedMonthlyWinners();
      await this.loadOrSeedPaperModels();
    } catch (error) {
      console.error("Error seeding data:", error);
    }
  }

  private async seedBadges(): Promise<void> {
    const badgesList = [
      {
        id: this.nextBadgeId++,
        name: "First Test",
        nameAr: "🔰 مشارك جديد",
        description: "أكمل أول اختبار لك",
        icon: "shield",
        type: "first_test",
        criteria: { testsCompleted: 1 },
        color: "#60A5FA",
        pointsBonus: 10
      },
      {
        id: this.nextBadgeId++,
        name: "Golden Mind",
        nameAr: "🧠 عقل ذهبي",
        description: "حقق نسبة إجابة صحيحة تفوق 90%",
        icon: "brain",
        type: "golden_mind",
        criteria: { accuracyPercentage: 90 },
        color: "#FFD700",
        pointsBonus: 50
      },
      {
        id: this.nextBadgeId++,
        name: "Speed Challenge",
        nameAr: "🔥 تحدي السرعة",
        description: "أنهِ اختباراً في أقل من نصف الوقت المحدد",
        icon: "zap",
        type: "speed_challenge",
        criteria: { speedRatio: 0.5 },
        color: "#F97316",
        pointsBonus: 75
      },
      {
        id: this.nextBadgeId++,
        name: "Weekly Star",
        nameAr: "💡 نجم الأسبوع",
        description: "حقق أعلى تقدم أسبوعي بين المشتركين",
        icon: "star",
        type: "weekly_top",
        criteria: { weeklyRank: 1 },
        color: "#FBBF24",
        pointsBonus: 100
      },
      {
        id: this.nextBadgeId++,
        name: "Monthly Leader",
        nameAr: "🥇 قائد الشهر",
        description: "احتل أحد المراكز الثلاثة الأولى في نهاية الشهر",
        icon: "trophy",
        type: "monthly_top",
        criteria: { monthlyRank: 3 },
        color: "#A78BFA",
        pointsBonus: 200
      }
    ];

    this.badges = badgesList;
    console.log(`✅ تم تحميل ${badgesList.length} شارة`);
  }

  private async seed10KStudents(): Promise<void> {
    const arabicNames = [
      'محمد', 'أحمد', 'عمر', 'علي', 'خالد', 'سعد', 'فهد', 'عبدالله', 'إبراهيم', 'يوسف',
      'سارة', 'فاطمة', 'نورة', 'مريم', 'عائشة', 'خديجة', 'زينب', 'هدى', 'ليلى', 'رقية',
      'عبدالرحمن', 'عبدالعزيز', 'سلمان', 'طلال', 'بندر', 'تركي', 'ماجد', 'نايف', 'سلطان', 'فيصل',
      'منى', 'ريم', 'أمل', 'جواهر', 'لطيفة', 'هيفاء', 'شيخة', 'موضي', 'نوف', 'دانة'
    ];

    const lastNames = [
      'العتيبي', 'الغامدي', 'القحطاني', 'الشمري', 'الدوسري', 'المطيري', 'الحربي', 'السهلي',
      'الزهراني', 'العنزي', 'الشهري', 'الثبيتي', 'البقمي', 'المالكي', 'الأحمدي', 'الحسيني',
      'الخالدي', 'العمري', 'السالمي', 'الراشدي', 'الناصر', 'الفهدي', 'السعيد', 'الكريم',
      'البدر', 'الشرقي', 'الغربي', 'الشمالي', 'الجنوبي', 'الوسطاني'
    ];

    console.log('جاري إنشاء 10,000 طالب وهمي بنظام ديناميكي ذكي...');

    const top10Names = [
      'عبدالله الشمري',
      'محمد العتيبي', 
      'سارة الغامدي',
      'أحمد القحطاني',
      'نورة الدوسري',
      'خالد المطيري',
      'فاطمة الحربي',
      'علي السهلي',
      'مريم الزهراني',
      'عمر العنزي'
    ];

    // Top 10: 8000-9000 نقطة (المتصدرين الثابتين)
    for (let i = 0; i < 10; i++) {
      const basePoints = 8000 + (10 - i) * 50;
      const dynamicBonus = Math.floor(Math.random() * 100);
      const totalPoints = basePoints + dynamicBonus;
      const totalTests = 80 + Math.floor(Math.random() * 30);

      this.leaderboardEntries.push({
        id: this.nextLeaderboardId++,
        userId: 10000 + i,
        username: top10Names[i],
        totalPoints: totalPoints,
        currentRank: i + 1,
        previousRank: i + (Math.random() > 0.5 ? 0 : 1),
        rankChange: Math.random() > 0.6 ? 'up' : (Math.random() > 0.5 ? 'down' : 'stable'),
        weeklyPoints: Math.floor(totalPoints * 0.2),
        monthlyPoints: Math.floor(totalPoints * 0.5),
        totalTests: totalTests,
        averageScore: 85 + Math.floor(Math.random() * 15),
        lastUpdated: new Date(),
        isBot: true
      });
    }

    // المراتب 11-999: نقاط متدرجة من 7000 إلى 100 (الطلاب الذين فوق المرتبة 1000)
    // هؤلاء سيكونون فوق أي طالب مسجل بـ 0 نقطة
    for (let i = 10; i < 999; i++) {
      const firstName = arabicNames[Math.floor(Math.random() * arabicNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const username = `${firstName} ${lastName}`;

      // نقاط متناقصة من 7000 إلى 100
      const pointsRange = 7000 - 100;
      const position = i - 10; // 0 to 988
      const totalPositions = 989;
      const basePoints = 7000 - Math.floor((pointsRange * position) / totalPositions);
      const randomVariation = Math.floor(Math.random() * 20) - 10;
      const totalPoints = Math.max(100, basePoints + randomVariation);

      const totalTests = Math.floor(Math.random() * 60) + 20;

      this.leaderboardEntries.push({
        id: this.nextLeaderboardId++,
        userId: 10000 + i,
        username: username,
        totalPoints: totalPoints,
        currentRank: 0,
        previousRank: null,
        rankChange: ['up', 'down', 'stable'][Math.floor(Math.random() * 3)],
        weeklyPoints: Math.floor(totalPoints * 0.2),
        monthlyPoints: Math.floor(totalPoints * 0.5),
        totalTests: totalTests,
        averageScore: Math.floor(Math.random() * 40) + 60,
        lastUpdated: new Date(),
        isBot: true
      });
    }

    // المراتب 1000-10000: نقاط من 0 إلى 99 (الطلاب الذين تحت المرتبة 1000)
    // الطالب المسجل بـ 0 نقطة سيكون في المرتبة 1000 تقريباً
    for (let i = 999; i < 10000; i++) {
      const firstName = arabicNames[Math.floor(Math.random() * arabicNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const username = `${firstName} ${lastName}`;

      // نقاط من 0 إلى 99 (عشوائية)
      const totalPoints = Math.floor(Math.random() * 100);

      const totalTests = Math.floor(Math.random() * 30) + 1;

      this.leaderboardEntries.push({
        id: this.nextLeaderboardId++,
        userId: 10000 + i,
        username: username,
        totalPoints: totalPoints,
        currentRank: 0,
        previousRank: null,
        rankChange: ['up', 'down', 'stable'][Math.floor(Math.random() * 3)],
        weeklyPoints: Math.floor(totalPoints * 0.2),
        monthlyPoints: Math.floor(totalPoints * 0.5),
        totalTests: totalTests,
        averageScore: Math.floor(Math.random() * 40) + 30,
        lastUpdated: new Date(),
        isBot: true
      });
    }

    this.recalculateRanks();
    console.log('✅ تم إنشاء 10,000 طالب وهمي بنجاح! (نظام ديناميكي: الطالب بـ 0 نقطة = المرتبة ~1000)');
  }

  private recalculateRanks(): void {
    this.leaderboardEntries.sort((a, b) => b.totalPoints - a.totalPoints);
    this.leaderboardEntries.forEach((entry, index) => {
      entry.previousRank = entry.currentRank || index + 1;
      entry.currentRank = index + 1;
    });
  }

  private async seedMonthlyWinners(): Promise<void> {
    await this.seed10KStudents();

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const topThree = this.leaderboardEntries.slice(0, 3);

    const placeholderWinners = [
      {
        id: this.nextMonthlyWinnerId++,
        userId: topThree[0]?.userId || null,
        rank: 1,
        month: currentMonth,
        year: currentYear,
        prize: 999,
        isPlaceholder: true,
        displayName: topThree[0]?.username || "محمد العتيبي",
        displayImage: null,
        totalPoints: topThree[0]?.totalPoints || 5420,
        createdAt: new Date()
      },
      {
        id: this.nextMonthlyWinnerId++,
        userId: topThree[1]?.userId || null,
        rank: 2,
        month: currentMonth,
        year: currentYear,
        prize: 599,
        isPlaceholder: true,
        displayName: topThree[1]?.username || "سارة العتيبي",
        displayImage: null,
        totalPoints: topThree[1]?.totalPoints || 4850,
        createdAt: new Date()
      },
      {
        id: this.nextMonthlyWinnerId++,
        userId: topThree[2]?.userId || null,
        rank: 3,
        month: currentMonth,
        year: currentYear,
        prize: 399,
        isPlaceholder: true,
        displayName: topThree[2]?.username || "محمد القحطاني",
        displayImage: null,
        totalPoints: topThree[2]?.totalPoints || 4200,
        createdAt: new Date()
      }
    ];

    this.monthlyWinners = placeholderWinners;
    console.log(`✅ تم تحميل ${placeholderWinners.length} فائز من أفضل 10,000 طالب`);
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
      // ── MongoDB-first: load questions from MongoDB ──
      try {
        // Wait for MongoDB connection to be ready (up to 15s)
        const mongoose = await import('mongoose');
        let waited = 0;
        while (mongoose.default.connection.readyState !== 1 && waited < 15000) {
          await new Promise(r => setTimeout(r, 200));
          waited += 200;
        }
        const { Question: MongoQuestion } = await import('./mongodb/models');
        const mongoCount = await MongoQuestion.countDocuments();
        if (mongoCount > 0) {
          const mongoQuestions = await MongoQuestion.find({}, {
            questionId: 1, category: 1, subcategory: 1, text: 1,
            options: 1, correctOptionIndex: 1, difficulty: 1,
            topic: 1, dialect: 1, keywords: 1, section: 1, explanation: 1
          }).lean();

          for (const q of mongoQuestions) {
            const id = this.nextQuestionId++;
            this.questions.push({
              id,
              category: (q.category as any) || 'verbal',
              subcategory: q.subcategory || '',
              text: q.text,
              options: q.options,
              correctOptionIndex: q.correctOptionIndex,
              difficulty: (q.difficulty as any) || 'intermediate',
              topic: q.topic || 'general',
              dialect: (q.dialect as any) || 'standard',
              keywords: q.keywords || [],
              section: q.section || 1,
              explanation: q.explanation || ''
            });
          }
          console.log(`Questions loaded successfully from MongoDB (${mongoCount} questions)`);
          return;
        }
      } catch (mongoErr: any) {
        console.log('MongoDB question load unavailable, falling back to file... Error:', mongoErr?.message || mongoErr);
      }

      // ── Fallback: load from JSON file ──
      const questionsPath = path.resolve(process.cwd(), "server/questions.json");

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

              // Add the question with comprehensive structure
              await this.createQuestion({
                category: "verbal",
                subcategory: question.category || "التناظر اللفظي", // Use Arabic subcategory
                text: question.text,
                options: question.options,
                correctOptionIndex: question.correctOptionIndex,
                difficulty: difficulty,
                topic: "general",
                dialect: "standard",
                keywords: keywords,
                section: Math.floor(count / 20) + 1,
                explanation: question.explanation || "" // Include explanation
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

              // Add the question with comprehensive structure
              await this.createQuestion({
                category: "quantitative",
                subcategory: question.category || "عمليات حسابية", // Use Arabic subcategory
                text: question.text,
                options: question.options,
                correctOptionIndex: question.correctOptionIndex,
                difficulty: difficulty,
                topic: "general",
                dialect: "standard",
                keywords: keywords,
                section: Math.floor(count / 20) + 1,
                explanation: question.explanation || "" // Include explanation
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

    return Array.from(new Set(keywords)); // Remove duplicates
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
    try {
      const fs = await import('fs');
      const users = JSON.parse(fs.readFileSync("attached_assets/user.json", "utf-8"));
      const userIndex = users.findIndex((u: any) => u.id === userId);

      if (userIndex !== -1) {
        users[userIndex].points = (users[userIndex].points || 0) + points;

        const totalPoints = users[userIndex].points;
        if (totalPoints >= 10000) users[userIndex].level = 5;
        else if (totalPoints >= 6000) users[userIndex].level = 4;
        else if (totalPoints >= 3000) users[userIndex].level = 3;
        else if (totalPoints >= 1000) users[userIndex].level = 2;
        else users[userIndex].level = 1;

        fs.writeFileSync("attached_assets/user.json", JSON.stringify(users, null, 2));

        return users[userIndex];
      }
    } catch (error) {
      console.log("User file not found, checking MemStorage");
    }

    const userIndex = this.users.findIndex(user => user.id === userId);
    if (userIndex === -1) {
      throw new Error(`User with ID ${userId} not found in both file and MemStorage`);
    }

    const user = this.users[userIndex];
    const updatedPoints = user.points + points;

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

  async clearAllQuestions(): Promise<void> {
    this.questions = [];
    console.log("All questions cleared from memory storage");
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

      // Use fuzzy search for remaining questions
      const fuzzyMatches = remainingQuestions
        .filter(q => fuzzySearch(query, q.text))
        .slice(0, limit - results.length);

      const fuzzyResults: SearchResult[] = fuzzyMatches.map(q => ({
        question: q,
        matchType: 'similar'
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
    // Check if question already exists in folder
    const exists = this.folderQuestions.some(
      fq => fq.folderId === folderQuestion.folderId && fq.questionId === folderQuestion.questionId
    );

    if (exists) {
      // Return existing folder question instead of creating duplicate
      const existing = this.folderQuestions.find(
        fq => fq.folderId === folderQuestion.folderId && fq.questionId === folderQuestion.questionId
      );
      if (existing) return existing;
    }

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

  async addQuestionsToFolderBulk(folderId: number, questionIds: number[]): Promise<{ added: number; skipped: number; total: number }> {
    let added = 0;
    let skipped = 0;

    for (const questionId of questionIds) {
      // Check if question already exists in folder
      const exists = this.folderQuestions.some(
        fq => fq.folderId === folderId && fq.questionId === questionId
      );

      if (exists) {
        skipped++;
        continue;
      }

      const id = this.folderQuestions.length > 0 ? 
        Math.max(...this.folderQuestions.map(fq => fq.id)) + 1 : 1;

      const newFolderQuestion: FolderQuestion = {
        id,
        folderId,
        questionId,
        notes: undefined,
        addedAt: new Date()
      };

      this.folderQuestions.push(newFolderQuestion);
      added++;
    }

    return {
      added,
      skipped,
      total: questionIds.length
    };
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

  // Leaderboard and Badges operations
  async getAllBadges(): Promise<any[]> {
    return this.badges;
  }

  async getUserBadges(userId: number): Promise<any[]> {
    const userBadgeIds = this.userBadges
      .filter(ub => ub.userId === userId)
      .map(ub => ub.badgeId);

    return this.badges.filter(b => userBadgeIds.includes(b.id));
  }

  async awardBadge(userId: number, badgeId: number, reason?: string): Promise<any> {
    const existing = this.userBadges.find(
      ub => ub.userId === userId && ub.badgeId === badgeId
    );

    if (existing) {
      return existing;
    }

    const newUserBadge = {
      id: this.nextUserBadgeId++,
      userId,
      badgeId,
      earnedAt: new Date(),
      reason
    };

    this.userBadges.push(newUserBadge);
    return newUserBadge;
  }

  // Helper function to award a badge to a user
  async awardBadgeToUser(userId: number, badgeId: number): Promise<any> {
    const badge = this.badges.find(b => b.id === badgeId);
    if (!badge) {
      console.error(`Badge with ID ${badgeId} not found.`);
      return null;
    }

    // Check if user already has the badge
    const hasBadge = this.userBadges.some(ub => ub.userId === userId && ub.badgeId === badgeId);
    if (hasBadge) {
      return null; // User already has this badge
    }

    // Award the badge
    const newUserBadge = {
      id: this.nextUserBadgeId++,
      userId,
      badgeId,
      earnedAt: new Date(),
      reason: `Awarded for ${badge.name}`
    };
    this.userBadges.push(newUserBadge);

    // Add points bonus if applicable (with error handling)
    if (badge.pointsBonus) {
      try {
        await this.updateUserPoints(userId, badge.pointsBonus);
      } catch (error) {
        console.warn(`Could not update points for user ${userId} when awarding badge. User might not be in MemStorage.`);
      }
    }

    console.log(`User ${userId} awarded badge: ${badge.name}`);
    return newUserBadge;
  }

  async checkAndAwardBadges(userId: number, testResult: UserTestResult): Promise<any[]> {
    const awardedBadges: any[] = [];

    // Get all badges and user's current badges
    const allBadges = await this.getAllBadges();
    const userBadges = await this.getUserBadges(userId);
    const userBadgeIds = new Set(userBadges.map(b => b.badgeId));

    // Check each badge criteria
    for (const badge of allBadges) {
      // Skip if user already has this badge
      if (userBadgeIds.has(badge.id)) continue;

      let shouldAward = false;
      const percentage = testResult.score && testResult.totalQuestions 
        ? (testResult.score / testResult.totalQuestions) * 100 
        : 0;

      // Award logic based on badge type
      switch (badge.type) {
        case "first_test": // 🔰 مشارك جديد
          const userTestsCount = this.userTestResults.filter(r => r.userId === userId).length;
          if (userTestsCount === 1) {
            shouldAward = true;
          }
          break;

        case "golden_mind": // 🧠 عقل ذهبي - نسبة فوق 90%
          if (percentage >= 90) {
            shouldAward = true;
          }
          break;

        case "speed_challenge": // 🔥 تحدي السرعة - أقل من نصف الوقت
          // Check if test was completed in less than half the time
          // timeTaken is in seconds, need to compare with test duration
          if (testResult.timeTaken) {
            // Assume test duration based on difficulty if not provided
            const expectedDuration = testResult.difficulty === 'advanced' ? 180 : 
                                     testResult.difficulty === 'intermediate' ? 240 : 300;
            const speedRatio = testResult.timeTaken / expectedDuration;
            if (speedRatio < 0.5) {
              shouldAward = true;
            }
          }
          break;

        case "weekly_top": // 💡 نجم الأسبوع - أعلى تقدم أسبوعي
          // Check if user has highest weekly points
          const weeklyLeaderboard = this.leaderboardEntries
            .sort((a, b) => b.weeklyPoints - a.weeklyPoints);
          if (weeklyLeaderboard.length > 0 && weeklyLeaderboard[0].userId === userId && weeklyLeaderboard[0].weeklyPoints > 0) {
            shouldAward = true;
          }
          break;

        case "monthly_top": // 🥇 قائد الشهر - Top 3 rank
          const rank = await this.getUserRank(userId);
          if (rank && rank.currentRank <= 3) {
            shouldAward = true;
          }
          break;
      }

      if (shouldAward) {
        await this.awardBadgeToUser(userId, badge.id);
        awardedBadges.push(badge);
      }
    }

    return awardedBadges;
  }

  async getLeaderboard(limit: number = 100): Promise<any[]> {
    return this.leaderboardEntries
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .slice(0, limit);
  }

  async updateLeaderboardEntry(userId: number, pointsEarned: number, username?: string): Promise<any> {
    let entry = this.leaderboardEntries.find(e => e.userId === userId);

    if (!entry) {
      let finalUsername = username;
      let existingPoints = 0;
      try {
        const fsLib = await import('fs');
        const usersData = JSON.parse(fsLib.readFileSync('attached_assets/user.json', 'utf-8'));
        const foundUser = usersData.find((u: any) => String(u.id) === String(userId));
        if (foundUser) {
          if (!finalUsername) finalUsername = foundUser.name || foundUser.username || `مستخدم ${userId}`;
          existingPoints = foundUser.points || 0;
        }
      } catch {}
      if (!finalUsername) finalUsername = `مستخدم ${userId}`;

      entry = {
        id: this.nextLeaderboardId++,
        userId,
        username: finalUsername,
        totalPoints: Math.max(0, existingPoints + pointsEarned),
        currentRank: 0,
        previousRank: null,
        rankChange: "stable",
        weeklyPoints: Math.max(0, pointsEarned),
        monthlyPoints: Math.max(0, pointsEarned),
        totalTests: 1,
        averageScore: 0,
        lastUpdated: new Date()
      };
      this.leaderboardEntries.push(entry);
    } else {
      if (username && entry.username !== username) {
        entry.username = username;
      }
      entry.totalPoints = Math.max(0, entry.totalPoints + pointsEarned);
      entry.weeklyPoints = Math.max(0, entry.weeklyPoints + pointsEarned);
      entry.monthlyPoints = Math.max(0, entry.monthlyPoints + pointsEarned);
      entry.totalTests += 1;
      entry.lastUpdated = new Date();
    }

    // Update ranks
    const sorted = this.leaderboardEntries
      .sort((a, b) => b.totalPoints - a.totalPoints);

    sorted.forEach((e, index) => {
      e.previousRank = e.currentRank;
      e.currentRank = index + 1;

      if (e.previousRank === null) {
        e.rankChange = "stable";
      } else if (e.currentRank < e.previousRank) {
        e.rankChange = "up";
      } else if (e.currentRank > e.previousRank) {
        e.rankChange = "down";
      } else {
        e.rankChange = "stable";
      }
    });

    return entry;
  }

  async saveLeaderboardToDatabase() {
    // MongoDB-only mode: no-op
  }

  async getUserRank(userId: number): Promise<any | undefined> {
    return this.leaderboardEntries.find(e => e.userId === userId);
  }

  async getTopUsers(limit: number): Promise<any[]> {
    return this.getLeaderboard(limit);
  }

  async createWeeklyProgress(progress: any): Promise<any> {
    const newProgress = {
      id: this.nextWeeklyProgressId++,
      ...progress,
      createdAt: new Date()
    };
    this.weeklyProgress.push(newProgress);
    return newProgress;
  }

  async getWeeklyProgress(userId: number): Promise<any[]> {
    return this.weeklyProgress.filter(wp => wp.userId === userId);
  }

  async getCurrentWeekProgress(userId: number): Promise<any | undefined> {
    const now = new Date();
    return this.weeklyProgress.find(
      wp => wp.userId === userId && 
      wp.weekStart <= now && 
      wp.weekEnd >= now
    );
  }

  async createMonthlyWinner(winner: any): Promise<any> {
    const newWinner = {
      id: this.nextMonthlyWinnerId++,
      ...winner,
      createdAt: new Date()
    };
    this.monthlyWinners.push(newWinner);
    return newWinner;
  }

  async getMonthlyWinners(month: number, year: number): Promise<any[]>{
    return this.monthlyWinners.filter(
      w => w.month === month && w.year === year
    ).sort((a, b) => a.rank - b.rank);
  }

  async getCurrentMonthWinners(): Promise<any[]> {
    const now = new Date();
    return this.getMonthlyWinners(now.getMonth() + 1, now.getFullYear());
  }

  // Placeholder for analytics data to support Daily Streak badge
  async getAnalytics(userId: number): Promise<any[]> {
    // In a real application, this would fetch user activity data (e.g., test completions, logins)
    // For this in-memory example, we'll return a dummy array.
    // A more accurate simulation would involve checking test completion dates.
    const userTestResults = this.userTestResults.filter(r => r.userId === userId);
    // Sort by completion date to simulate recent activity
    userTestResults.sort((a, b) => a.completedAt.getTime() - b.completedAt.getTime());
    return userTestResults.map(r => ({ date: r.completedAt, type: 'test_completion' }));
  }

  // Paper Models operations (Global) - Enhanced with database persistence
  async getAllPaperModels(): Promise<any[]> {
    return this.paperModels;
  }

  async getPaperModelByNumber(modelNumber: number): Promise<any | undefined> {
    return this.paperModels.find(m => m.modelNumber === modelNumber);
  }

  async createGlobalPaperModel(model: any): Promise<any> {
    const newModel = {
      ...model,
      id: this.nextPaperModelId++,
      createdAt: new Date(),
    };
    this.paperModels.push(newModel);

    return newModel;
  }

  async loadOrSeedPaperModels(): Promise<void> {
    // MongoDB-only mode: load directly from JSON file (no PostgreSQL)
    await this.seedPaperModels();
  }

  async seedPaperModels(): Promise<void> {
    if (this.paperModels.length > 0) {
      console.log(`✅ Paper models already seeded (${this.paperModels.length} models)`);
      return;
    }

    console.log('📦 Loading STABLE paper models from permanent JSON file...');

    try {
      // Load stable models from JSON file (NEVER regenerated unless manually done)
      const fs = await import('fs');
      const path = await import('path');
      const modelsFile = path.join(process.cwd(), 'server', 'data', 'paper-models.json');
      
      if (!fs.existsSync(modelsFile)) {
        console.error('❌ CRITICAL: Paper models file not found at', modelsFile);
        console.error('❌ Run: npx tsx server/generate-stable-models.ts to create stable models');
        throw new Error('Paper models file not found');
      }

      const fileContent = fs.readFileSync(modelsFile, 'utf-8');
      const { models, version, generatedAt } = JSON.parse(fileContent);

      console.log(`📚 Found ${models.length} stable models (version ${version}, generated ${generatedAt})`);
      console.log(`🔒 These models are PERMANENT and will NEVER change`);

      // Create each model from the stable file
      for (const modelData of models) {
        await this.createGlobalPaperModel(modelData);
      }

      console.log(`✅ Loaded ${models.length} STABLE paper models successfully`);
      console.log('✅ All students can safely print and keep these models forever');
    } catch (error: any) {
      console.error('❌ Failed to load stable paper models:', error?.message || error);
      console.error('⚠️ CRITICAL: Paper models should NEVER be randomly generated in production');
      throw error;
    }
  }

  // NEW: Distribute trial questions evenly instead of grouping at start
  private distributeTrialQuestions(questions: any[], trialCount: number, type: string): any[] {
    const total = questions.length;
    const interval = Math.floor(total / trialCount);

    return questions.map((q, idx) => {
      // Spread trials evenly: every ~interval questions, mark one as trial
      const isTrial = idx % interval === 0 && Math.floor(idx / interval) < trialCount;

      return {
        ...q,
        questionType: type,
        isTrial
      };
    });
  }

  // IMPROVED: Better mixing algorithm for even distribution
  private mixQuestionsEvenly(verbal: any[], quant: any[]): any[] {
    const mixed: any[] = [];
    const totalVerbal = verbal.length;
    const totalQuant = quant.length;
    const totalQuestions = totalVerbal + totalQuant;

    let vIdx = 0;
    let qIdx = 0;

    // Target ratio: 65 verbal / 55 quant = roughly 54% verbal, 46% quant
    const verbalRatio = totalVerbal / totalQuestions;

    for (let i = 0; i < totalQuestions; i++) {
      // Calculate expected progress for each type
      const expectedVerbalIdx = Math.floor(i * verbalRatio);
      const expectedQuantIdx = Math.floor(i * (1 - verbalRatio));

      // Choose based on which type is lagging behind
      const verbalLagging = vIdx < expectedVerbalIdx;
      const quantLagging = qIdx < expectedQuantIdx;

      if (verbalLagging && vIdx < totalVerbal) {
        mixed.push({ ...verbal[vIdx], position: i + 1 });
        vIdx++;
      } else if (qIdx < totalQuant) {
        mixed.push({ ...quant[qIdx], position: i + 1 });
        qIdx++;
      } else if (vIdx < totalVerbal) {
        mixed.push({ ...verbal[vIdx], position: i + 1 });
        vIdx++;
      }
    }

    return mixed;
  }

  // Paper Model Results operations
  async createPaperModelResult(result: any): Promise<any> {
    console.log(`💾 Creating paper model result for user ${result.userId}, model ${result.modelId}`);

    const newResult = {
      id: this.nextPaperModelResultId++,
      userId: result.userId,
      modelId: result.modelId,
      modelNumber: result.modelNumber,
      verbalCorrect: result.verbalCorrect,
      verbalTotal: result.verbalTotal,
      quantitativeCorrect: result.quantitativeCorrect,
      quantitativeTotal: result.quantitativeTotal,
      verbalPercentage: result.verbalPercentage,
      quantitativePercentage: result.quantitativePercentage,
      totalPercentage: result.totalPercentage,
      completedAt: new Date(),
    };

    this.paperModelResults.push(newResult);
    console.log(`✅ Paper model result created with ID ${newResult.id}`);

    return newResult;
  }

  async getPaperModelResults(userId: number): Promise<any[]> {
    return this.paperModelResults.filter(r => r.userId === userId);
  }

  async getPaperModelResultsByModel(userId: number, modelNumber: number): Promise<any | undefined> {
    const result = this.paperModelResults.find(r => r.userId === userId && r.modelNumber === modelNumber);
    console.log(`🔍 Looking for result: userId=${userId}, modelNumber=${modelNumber}, found=${!!result}`);
    return result;
  }

  async getPaperModelAverages(userId: number): Promise<any> {
    const results = await this.getPaperModelResults(userId);

    if (results.length === 0) {
      return {
        totalExams: 0,
        verbalAverage: 0,
        quantitativeAverage: 0,
        totalAverage: 0,
      };
    }

    const totalVerbal = results.reduce((sum, r) => sum + r.verbalPercentage, 0);
    const totalQuantitative = results.reduce((sum, r) => sum + r.quantitativePercentage, 0);
    const totalOverall = results.reduce((sum, r) => sum + r.totalPercentage, 0);

    return {
      totalExams: results.length,
      verbalAverage: Math.round(totalVerbal / results.length),
      quantitativeAverage: Math.round(totalQuantitative / results.length),
      totalAverage: Math.round(totalOverall / results.length),
    };
  }

  // 🎯 النظام الطبيعي التدريجي: 100، 200، 300 نقطة كحد أقصى يومياً
  updateBotStudentsPoints(): void {
    // إعادة حساب التصنيف أولاً للحصول على الترتيب الحالي
    this.recalculateRanks();

    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    let updated = 0;
    let reachedLimit = 0;

    this.leaderboardEntries.forEach(entry => {
      // تحديث فقط الطلاب الوهميين (userId >= 10000)
      if (entry.isBot && entry.userId >= 10000) {
        // الحصول على أو إنشاء تتبع يومي لهذا الطالب
        let dailyTracker = this.botDailyPoints.get(entry.userId);

        // إعادة تعيين إذا كان يوم جديد أو أول مرة
        if (!dailyTracker || dailyTracker.lastResetDate !== today) {
          // تحديد حد يومي عشوائي: 100، 200، أو 300 نقطة
          const limits = [100, 200, 300];
          const dailyLimit = limits[Math.floor(Math.random() * limits.length)];

          dailyTracker = {
            pointsToday: 0,
            dailyLimit: dailyLimit,
            lastResetDate: today
          };
          this.botDailyPoints.set(entry.userId, dailyTracker);
        }

        // التحقق من عدم تجاوز الحد اليومي
        if (dailyTracker.pointsToday >= dailyTracker.dailyLimit) {
          reachedLimit++;
          return; // تجاوز هذا الطالب
        }

        // احتمالية كسب نقاط (40% كل دقيقة = ~576 فرصة يومياً)
        if (Math.random() < 0.40) {
          // كسب 1-3 نقاط في كل مرة (متوسط 2 نقطة)
          const pointsGain = Math.floor(Math.random() * 3) + 1;

          // التأكد من عدم تجاوز الحد اليومي
          const actualPoints = Math.min(
            pointsGain, 
            dailyTracker.dailyLimit - dailyTracker.pointsToday
          );

          if (actualPoints > 0) {
            entry.totalPoints += actualPoints;
            entry.weeklyPoints += actualPoints;
            entry.monthlyPoints += actualPoints;
            entry.totalTests += Math.random() < 0.3 ? 1 : 0; // فرصة 30% لزيادة عدد الاختبارات
            entry.lastUpdated = new Date();

            dailyTracker.pointsToday += actualPoints;
            updated++;
          }
        }
      }
    });

    // إعادة حساب التصنيف بعد التحديث
    this.recalculateRanks();

    console.log(`🎯 نظام طبيعي: ${updated} طالب حصلوا على نقاط، ${reachedLimit} وصلوا للحد اليومي`);
  }
}

// Export storage instance
export const storage = new MemStorage();