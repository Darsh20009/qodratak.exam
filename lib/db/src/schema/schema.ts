
import { pgTable, text, serial, integer, boolean, jsonb, timestamp, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// أنواع الحسابات (Roles)
export const userRoles = ["student", "teacher", "institution_admin", "system_admin", "support_admin"] as const;
export type UserRole = typeof userRoles[number];

// ترجمة الأدوار للعربية
export const roleLabels: Record<UserRole, string> = {
  student: "طالب",
  teacher: "مدرس",
  institution_admin: "مدير مؤسسة",
  system_admin: "أدمن المنصة",
  support_admin: "الدعم الفني"
};

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"),
  fullName: text("full_name"),
  phone: text("phone"),
  role: text("role").default("student").notNull(), // student, teacher, institution_admin, system_admin, support_admin
  institutionId: integer("institution_id"), // للمدرسين والطلاب المنتمين لمؤسسة
  points: integer("points").default(0).notNull(),
  level: integer("level").default(1).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  isVerified: boolean("is_verified").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastLogin: timestamp("last_login").defaultNow().notNull(),
  deviceId: text("device_id"),
  trialUsed: boolean("trial_used").default(false),
  trialStartDate: timestamp("trial_start_date"),
  trialEndDate: timestamp("trial_end_date"),
  lastTrialReset: timestamp("last_trial_reset"),
});

// جدول المؤسسات/المدارس
export const institutions = pgTable("institutions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  nameEn: text("name_en"),
  type: text("type").notNull(), // school, institute, university
  email: text("email").notNull().unique(),
  phone: text("phone"),
  address: text("address"),
  city: text("city"),
  adminUserId: integer("admin_user_id"), // مدير المؤسسة
  maxStudents: integer("max_students").default(100),
  maxTeachers: integer("max_teachers").default(10),
  isActive: boolean("is_active").default(true).notNull(),
  subscriptionType: text("subscription_type").default("basic"), // basic, premium, enterprise
  subscriptionEndDate: timestamp("subscription_end_date"),
  logo: text("logo"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const deviceTrials = pgTable("device_trials", {
  id: serial("id").primaryKey(),
  deviceId: text("device_id").notNull().unique(),
  trialStartDate: timestamp("trial_start_date").notNull(),
  trialEndDate: timestamp("trial_end_date").notNull(),
  userId: integer("user_id"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: text("type").notNull(), // "Pro", "Pro Life", "Pro Life Plus"
  status: text("status").notNull().default("active"), // "active", "expired", "cancelled"
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  autoRenew: boolean("auto_renew").default(false),
  paymentMethod: text("payment_method"), // "bank", "stc", "manual"
  transactionId: text("transaction_id"),
  price: integer("price"), // Price in SAR
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const countdownTimers = pgTable("countdown_timers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  subscriptionId: integer("subscription_id"),
  endDate: timestamp("end_date").notNull(),
  isActive: boolean("is_active").default(true),
  notificationSent: boolean("notification_sent").default(false),
  daysRemaining: integer("days_remaining"),
  hoursRemaining: integer("hours_remaining"),
  minutesRemaining: integer("minutes_remaining"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const subscriptionHistory = pgTable("subscription_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  subscriptionId: integer("subscription_id").notNull(),
  action: text("action").notNull(), // "created", "renewed", "expired", "cancelled"
  previousStatus: text("previous_status"),
  newStatus: text("new_status"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  category: text("category").notNull(), // "verbal", "quantitative", "general", etc.
  subcategory: text("subcategory").default("عام"), // Specific Arabic subcategory like "التناظر اللفظي", "الهندسة", etc.
  text: text("text").notNull(),
  options: jsonb("options").notNull(), // Array of strings
  correctOptionIndex: integer("correct_option_index").notNull(),
  difficulty: text("difficulty").notNull(), // "beginner", "intermediate", "advanced", etc.
  topic: text("topic").default("general"), // Topic/subject of the question
  dialect: text("dialect").default("standard"), // "standard", "saudi", "egyptian", etc.
  keywords: jsonb("keywords").default(['general']), // Keywords for better search
  section: integer("section").default(1), // For Qiyas exam sections
  explanation: text("explanation"), // Explanation for the answer
});

export const userTestResults = pgTable("user_test_results", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  testType: text("test_type").notNull(), // "verbal", "quantitative", "qiyas", "custom"
  difficulty: text("difficulty").notNull(), // "beginner", "intermediate", "advanced"
  score: integer("score").notNull(),
  totalQuestions: integer("total_questions").notNull(),
  completedAt: timestamp("completed_at").defaultNow().notNull(),
  pointsEarned: integer("points_earned").default(0).notNull(),
  timeTaken: integer("time_taken").default(0), // Time taken in seconds
  isOfficial: boolean("is_official").default(false), // Whether this was an official test
});

// Advanced Test Results Table for specialized tests
export const advancedTestResults = pgTable("advanced_test_results", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  testId: text("test_id").notNull(), // Unique identifier for specific test
  testName: text("test_name").notNull(),
  testCategory: text("test_category").notNull(), // "verbal_specialized", "quantitative_specialized"
  subcategory: text("subcategory").notNull(), // "التناظر اللفظي", "الهندسة", etc.
  totalQuestions: integer("total_questions").notNull(),
  correctAnswers: integer("correct_answers").notNull(),
  wrongAnswers: integer("wrong_answers").notNull(),
  skippedQuestions: integer("skipped_questions").default(0),
  percentage: integer("percentage").notNull(),
  timeTaken: integer("time_taken").notNull(), // in seconds
  timeLimit: integer("time_limit").notNull(), // in seconds
  difficulty: text("difficulty").notNull(),
  pointsEarned: integer("points_earned").default(0),
  streakBonus: integer("streak_bonus").default(0),
  performanceLevel: text("performance_level").notNull(), // "ممتاز", "جيد", etc.
  weakAreas: jsonb("weak_areas").default([]), // Areas needing improvement
  strongAreas: jsonb("strong_areas").default([]), // Areas of strength
  questionDetails: jsonb("question_details").default([]), // Detailed answer analysis
  improvements: jsonb("improvements").default([]), // Suggested improvements
  completedAt: timestamp("completed_at").defaultNow().notNull(),
  sessionId: text("session_id"), // For tracking test sessions
});

// Test Sessions for comprehensive tracking
export const testSessions = pgTable("test_sessions", {
  id: text("id").primaryKey(), // UUID
  userId: integer("user_id").notNull(),
  sessionType: text("session_type").notNull(), // "practice", "timed", "challenge"
  startedAt: timestamp("started_at").defaultNow().notNull(),
  endedAt: timestamp("ended_at"),
  totalTests: integer("total_tests").default(0),
  totalCorrect: integer("total_correct").default(0),
  totalTime: integer("total_time").default(0), // in seconds
  overallPerformance: text("overall_performance"), // "ممتاز", "جيد", etc.
  notes: text("notes"), // User or system notes
  isActive: boolean("is_active").default(true),
});

// Achievement System for gamification
export const userAchievements = pgTable("user_achievements", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  achievementType: text("achievement_type").notNull(), // "streak", "perfect_score", "improvement"
  achievementName: text("achievement_name").notNull(),
  description: text("description").notNull(),
  iconName: text("icon_name").notNull(),
  color: text("color").default("#4f46e5"),
  pointsAwarded: integer("points_awarded").default(0),
  earnedAt: timestamp("earned_at").defaultNow().notNull(),
  category: text("category").notNull(), // "verbal", "quantitative", "general"
  level: integer("level").default(1), // Achievement level (1-5)
});

// Performance Analytics
export const performanceAnalytics = pgTable("performance_analytics", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  date: timestamp("date").defaultNow().notNull(),
  category: text("category").notNull(), // "verbal", "quantitative", "overall"
  subcategory: text("subcategory"), // Specific area
  averageScore: integer("average_score").notNull(),
  testsCompleted: integer("tests_completed").notNull(),
  timeSpent: integer("time_spent").notNull(), // in minutes
  improvementRate: integer("improvement_rate").default(0), // percentage
  consistencyScore: integer("consistency_score").default(0), // 0-100
  challengesCompleted: integer("challenges_completed").default(0),
  streakCount: integer("streak_count").default(0),
  weeklyGoalProgress: integer("weekly_goal_progress").default(0),
});

export const examTemplates = pgTable("exam_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  totalSections: integer("total_sections").default(1).notNull(),
  totalQuestions: integer("total_questions").notNull(),
  totalTime: integer("total_time").notNull(), // Time in minutes
  isQiyas: boolean("is_qiyas").default(false),
  requiresSubscription: boolean("requires_subscription").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const examSections = pgTable("exam_sections", {
  id: serial("id").primaryKey(),
  examId: integer("exam_id").notNull(),
  name: text("name").notNull(),
  sectionNumber: integer("section_number").notNull(),
  category: text("category").notNull(), // "verbal" or "quantitative"
  questionCount: integer("question_count").notNull(),
  timeLimit: integer("time_limit").notNull(), // Time in minutes
  verbalCount: integer("verbal_count"),
  quantitativeCount: integer("quantitative_count"),
});

export const userCustomExams = pgTable("user_custom_exams", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  questionCount: integer("question_count").notNull(),
  timeLimit: integer("time_limit").notNull(), // Time in minutes
  categories: jsonb("categories").notNull(), // Array of categories
  difficulty: text("difficulty").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const dialects = pgTable("dialects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(), // "saudi", "egyptian", etc.
  description: text("description"),
  examples: jsonb("examples").default([]), // Common phrases in this dialect
});

export const synonyms = pgTable("synonyms", {
  id: serial("id").primaryKey(),
  word: text("word").notNull(),
  synonyms: jsonb("synonyms").notNull(), // Array of synonyms
  dialect: text("dialect").default("standard"),
});

export const folders = pgTable("folders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  color: text("color").default("#4f46e5"), // Folder color for UI
  icon: text("icon").default("folder"), // Icon name
  createdAt: timestamp("created_at").defaultNow().notNull(),
  isDefault: boolean("is_default").default(false), // Whether this is a default folder
});

export const folderQuestions = pgTable("folder_questions", {
  id: serial("id").primaryKey(),
  folderId: integer("folder_id").notNull(),
  questionId: integer("question_id").notNull(),
  addedAt: timestamp("added_at").defaultNow().notNull(),
  notes: text("notes"), // User notes about this question
});

// Time Management Tables
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  priority: text("priority").notNull().default("medium"), // "high", "medium", "low"
  status: text("status").notNull().default("pending"), // "pending", "in_progress", "completed", "cancelled"
  category: text("category").default("personal"), // "work", "personal", "study", "fitness"
  dueDate: timestamp("due_date"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  tags: jsonb("tags").default([]),
  estimatedTime: integer("estimated_time"), // in minutes
  actualTime: integer("actual_time"), // in minutes
  projectId: integer("project_id"),
});

export const subtasks = pgTable("subtasks", {
  id: serial("id").primaryKey(),
  taskId: integer("task_id").notNull(),
  title: text("title").notNull(),
  completed: boolean("completed").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  order: integer("order").default(0),
});

export const habits = pgTable("habits", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  frequency: text("frequency").notNull(), // "daily", "weekly", "monthly"
  targetCount: integer("target_count").default(1),
  category: text("category").default("health"), // "health", "learning", "productivity", "social"
  icon: text("icon").default("target"),
  color: text("color").default("blue"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const habitLogs = pgTable("habit_logs", {
  id: serial("id").primaryKey(),
  habitId: integer("habit_id").notNull(),
  userId: integer("user_id").notNull(),
  date: timestamp("date").notNull(),
  count: integer("count").default(1),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status").default("active"), // "active", "completed", "on_hold", "cancelled"
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  color: text("color").default("blue"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const pomodoroSessions = pgTable("pomodoro_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  taskId: integer("task_id"),
  duration: integer("duration").notNull(), // in minutes
  type: text("type").notNull(), // "work", "short_break", "long_break"
  startedAt: timestamp("started_at").notNull(),
  completedAt: timestamp("completed_at"),
  wasCompleted: boolean("was_completed").default(false),
  notes: text("notes"),
});

export const timeBlocks = pgTable("time_blocks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  taskId: integer("task_id"),
  category: text("category").default("work"),
  color: text("color").default("blue"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Leaderboard and Badges System
export const badges = pgTable("badges", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  nameAr: text("name_ar").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(),
  type: text("type").notNull(), // "first_test", "weekly_top", "monthly_top", "golden_mind", "speed_challenge"
  criteria: jsonb("criteria").notNull(), // JSON with requirements
  color: text("color").default("#FFD700"),
  pointsBonus: integer("points_bonus").default(0),
});

export const userBadges = pgTable("user_badges", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  badgeId: integer("badge_id").notNull(),
  earnedAt: timestamp("earned_at").defaultNow().notNull(),
  reason: text("reason"),
});

export const leaderboardEntries = pgTable("leaderboard_entries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(),
  totalPoints: integer("total_points").default(0).notNull(),
  currentRank: integer("current_rank").notNull(),
  previousRank: integer("previous_rank"),
  rankChange: text("rank_change").default("stable"), // "up", "down", "stable"
  weeklyPoints: integer("weekly_points").default(0),
  monthlyPoints: integer("monthly_points").default(0),
  totalTests: integer("total_tests").default(0),
  averageScore: integer("average_score").default(0),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
});

export const weeklyProgress = pgTable("weekly_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  weekStart: timestamp("week_start").notNull(),
  weekEnd: timestamp("week_end").notNull(),
  pointsEarned: integer("points_earned").default(0),
  testsCompleted: integer("tests_completed").default(0),
  rankChange: integer("rank_change").default(0),
  isTopPerformer: boolean("is_top_performer").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const monthlyWinners = pgTable("monthly_winners", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  rank: integer("rank").notNull(), // 1, 2, or 3
  month: integer("month").notNull(),
  year: integer("year").notNull(),
  prize: integer("prize").notNull(), // Prize amount in SAR
  isPlaceholder: boolean("is_placeholder").default(false), // For fake top 3
  displayName: text("display_name"),
  displayImage: text("display_image"),
  totalPoints: integer("total_points").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const paperModels = pgTable("paper_models", {
  id: serial("id").primaryKey(),
  modelNumber: integer("model_number").notNull().unique(), // 1-30 (global models)
  name: text("name").notNull(),
  allQuestions: jsonb("all_questions").notNull(), // Mixed array of all 120 questions in order
  totalQuestions: integer("total_questions").default(120).notNull(),
  verbalCount: integer("verbal_count").default(65).notNull(),
  quantitativeCount: integer("quantitative_count").default(55).notNull(),
  trialVerbalCount: integer("trial_verbal_count").default(12).notNull(),
  trialQuantCount: integer("trial_quant_count").default(8).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const paperModelResults = pgTable("paper_model_results", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  modelId: integer("model_id").notNull(),
  modelNumber: integer("model_number").notNull(),
  verbalCorrect: integer("verbal_correct").notNull(),
  verbalTotal: integer("verbal_total").default(53).notNull(), // Excluding trial
  quantitativeCorrect: integer("quantitative_correct").notNull(),
  quantitativeTotal: integer("quantitative_total").default(47).notNull(), // Excluding trial
  verbalPercentage: integer("verbal_percentage").notNull(),
  quantitativePercentage: integer("quantitative_percentage").notNull(),
  totalPercentage: integer("total_percentage").notNull(),
  completedAt: timestamp("completed_at").defaultNow().notNull(),
});

// جدول الأدمن
export const admins = pgTable("admins", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"),
  fullName: text("full_name"),
  role: text("role").default("admin").notNull(), // admin, super_admin
  permissions: jsonb("permissions").default(["all"]),
  isActive: boolean("is_active").default(true).notNull(),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAdminSchema = createInsertSchema(admins).omit({
  id: true,
  createdAt: true,
  lastLogin: true,
});

export type InsertAdmin = z.infer<typeof insertAdminSchema>;
export type Admin = typeof admins.$inferSelect;

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  lastLogin: true,
  points: true,
  level: true,
});

export const insertDeviceTrialSchema = createInsertSchema(deviceTrials).omit({
  id: true,
  createdAt: true,
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCountdownTimerSchema = createInsertSchema(countdownTimers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSubscriptionHistorySchema = createInsertSchema(subscriptionHistory).omit({
  id: true,
  createdAt: true,
});

export const insertQuestionSchema = createInsertSchema(questions).omit({
  id: true,
});

export const insertUserTestResultSchema = createInsertSchema(userTestResults).omit({
  id: true,
  completedAt: true,
});

export const insertExamTemplateSchema = createInsertSchema(examTemplates).omit({
  id: true,
  createdAt: true,
});

export const insertExamSectionSchema = createInsertSchema(examSections).omit({
  id: true,
});

export const insertUserCustomExamSchema = createInsertSchema(userCustomExams).omit({
  id: true,
  createdAt: true,
});

export const insertDialectSchema = createInsertSchema(dialects).omit({
  id: true,
});

export const insertSynonymSchema = createInsertSchema(synonyms).omit({
  id: true,
});

export const insertFolderSchema = createInsertSchema(folders).omit({
  id: true,
  createdAt: true,
});

export const insertFolderQuestionSchema = createInsertSchema(folderQuestions).omit({
  id: true,
  addedAt: true,
});

// Time Management Insert Schemas
export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSubtaskSchema = createInsertSchema(subtasks).omit({
  id: true,
  createdAt: true,
});

export const insertHabitSchema = createInsertSchema(habits).omit({
  id: true,
  createdAt: true,
});

export const insertHabitLogSchema = createInsertSchema(habitLogs).omit({
  id: true,
  createdAt: true,
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
});

export const insertPomodoroSessionSchema = createInsertSchema(pomodoroSessions).omit({
  id: true,
});

export const insertTimeBlockSchema = createInsertSchema(timeBlocks).omit({
  id: true,
  createdAt: true,
});

// Leaderboard and Badges Insert Schemas
export const insertBadgeSchema = createInsertSchema(badges).omit({
  id: true,
});

export const insertUserBadgeSchema = createInsertSchema(userBadges).omit({
  id: true,
  earnedAt: true,
});

export const insertLeaderboardEntrySchema = createInsertSchema(leaderboardEntries).omit({
  id: true,
  lastUpdated: true,
});

export const insertWeeklyProgressSchema = createInsertSchema(weeklyProgress).omit({
  id: true,
  createdAt: true,
});

export const insertMonthlyWinnerSchema = createInsertSchema(monthlyWinners).omit({
  id: true,
  createdAt: true,
});

export const insertPaperModelSchema = createInsertSchema(paperModels).omit({
  id: true,
  createdAt: true,
});

export const insertPaperModelResultSchema = createInsertSchema(paperModelResults).omit({
  id: true,
  completedAt: true,
});

// Type definitions
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type DeviceTrial = typeof deviceTrials.$inferSelect;
export type InsertDeviceTrial = z.infer<typeof insertDeviceTrialSchema>;

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;

export type CountdownTimer = typeof countdownTimers.$inferSelect;
export type InsertCountdownTimer = z.infer<typeof insertCountdownTimerSchema>;

export type SubscriptionHistory = typeof subscriptionHistory.$inferSelect;
export type InsertSubscriptionHistory = z.infer<typeof insertSubscriptionHistorySchema>;

export type Question = typeof questions.$inferSelect;
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;

export type UserTestResult = typeof userTestResults.$inferSelect;
export type InsertUserTestResult = z.infer<typeof insertUserTestResultSchema>;

export type ExamTemplate = typeof examTemplates.$inferSelect;
export type InsertExamTemplate = z.infer<typeof insertExamTemplateSchema>;

export type ExamSection = typeof examSections.$inferSelect;
export type InsertExamSection = z.infer<typeof insertExamSectionSchema>;

export type UserCustomExam = typeof userCustomExams.$inferSelect;
export type InsertUserCustomExam = z.infer<typeof insertUserCustomExamSchema>;

export type Dialect = typeof dialects.$inferSelect;
export type InsertDialect = z.infer<typeof insertDialectSchema>;

export type Synonym = typeof synonyms.$inferSelect;
export type InsertSynonym = z.infer<typeof insertSynonymSchema>;

export type Folder = typeof folders.$inferSelect;
export type InsertFolder = z.infer<typeof insertFolderSchema>;

export type FolderQuestion = typeof folderQuestions.$inferSelect;
export type InsertFolderQuestion = z.infer<typeof insertFolderQuestionSchema>;

// Time Management Types
export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;

export type Subtask = typeof subtasks.$inferSelect;
export type InsertSubtask = z.infer<typeof insertSubtaskSchema>;

export type Habit = typeof habits.$inferSelect;
export type InsertHabit = z.infer<typeof insertHabitSchema>;

export type HabitLog = typeof habitLogs.$inferSelect;
export type InsertHabitLog = z.infer<typeof insertHabitLogSchema>;

export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;

export type PomodoroSession = typeof pomodoroSessions.$inferSelect;
export type InsertPomodoroSession = z.infer<typeof insertPomodoroSessionSchema>;

export type TimeBlock = typeof timeBlocks.$inferSelect;
export type InsertTimeBlock = z.infer<typeof insertTimeBlockSchema>;

// Leaderboard and Badges Types
export type Badge = typeof badges.$inferSelect;
export type InsertBadge = z.infer<typeof insertBadgeSchema>;

export type UserBadge = typeof userBadges.$inferSelect;
export type InsertUserBadge = z.infer<typeof insertUserBadgeSchema>;

export type LeaderboardEntry = typeof leaderboardEntries.$inferSelect;
export type InsertLeaderboardEntry = z.infer<typeof insertLeaderboardEntrySchema>;

export type WeeklyProgress = typeof weeklyProgress.$inferSelect;
export type InsertWeeklyProgress = z.infer<typeof insertWeeklyProgressSchema>;

export type MonthlyWinner = typeof monthlyWinners.$inferSelect;
export type InsertMonthlyWinner = z.infer<typeof insertMonthlyWinnerSchema>;

export type PaperModel = typeof paperModels.$inferSelect;
export type InsertPaperModel = z.infer<typeof insertPaperModelSchema>;

export type PaperModelResult = typeof paperModelResults.$inferSelect;
export type InsertPaperModelResult = z.infer<typeof insertPaperModelResultSchema>;

// Define relations
export const usersRelations = relations(users, ({ many }) => ({
  folders: many(folders),
  testResults: many(userTestResults),
  customExams: many(userCustomExams),
  subscriptions: many(subscriptions),
  countdownTimers: many(countdownTimers),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one, many }) => ({
  user: one(users, {
    fields: [subscriptions.userId],
    references: [users.id],
  }),
  countdownTimers: many(countdownTimers),
  history: many(subscriptionHistory),
}));

export const deviceTrialsRelations = relations(deviceTrials, ({ one }) => ({
  user: one(users, {
    fields: [deviceTrials.userId],
    references: [users.id],
  }),
}));

export const countdownTimersRelations = relations(countdownTimers, ({ one }) => ({
  user: one(users, {
    fields: [countdownTimers.userId],
    references: [users.id],
  }),
  subscription: one(subscriptions, {
    fields: [countdownTimers.subscriptionId],
    references: [subscriptions.id],
  }),
}));

export const subscriptionHistoryRelations = relations(subscriptionHistory, ({ one }) => ({
  user: one(users, {
    fields: [subscriptionHistory.userId],
    references: [users.id],
  }),
  subscription: one(subscriptions, {
    fields: [subscriptionHistory.subscriptionId],
    references: [subscriptions.id],
  }),
}));

export const foldersRelations = relations(folders, ({ one, many }) => ({
  user: one(users, {
    fields: [folders.userId],
    references: [users.id],
  }),
  questions: many(folderQuestions),
}));

export const folderQuestionsRelations = relations(folderQuestions, ({ one }) => ({
  folder: one(folders, {
    fields: [folderQuestions.folderId],
    references: [folders.id],
  }),
  question: one(questions, {
    fields: [folderQuestions.questionId],
    references: [questions.id],
  }),
}));

// Book Versions Table - محوسبات قدراتك
export const bookVersions = pgTable("book_versions", {
  id: serial("id").primaryKey(),
  version: integer("version").notNull(), // 1, 2, 3, etc.
  title: text("title").notNull(), // "محوسبات قدراتك الطريق 100% - الإصدار 1"
  totalQuestions: integer("total_questions").notNull(), // Total questions included
  verbalQuestions: integer("verbal_questions").notNull(),
  quantitativeQuestions: integer("quantitative_questions").notNull(),
  verbalCategories: jsonb("verbal_categories").default([]), // ["التناظر اللفظي", "الخطأ السياقي", ...]
  quantitativeCategories: jsonb("quantitative_categories").default([]), // ["الهندسة", "الجبر", ...]
  generatedAt: timestamp("generated_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  isLatest: boolean("is_latest").default(true),
  downloadCount: integer("download_count").default(0),
});

export type BookVersion = typeof bookVersions.$inferSelect;
export const insertBookVersionSchema = createInsertSchema(bookVersions).omit({ id: true, generatedAt: true, updatedAt: true });
export type InsertBookVersion = z.infer<typeof insertBookVersionSchema>;

// ========== Sprint 0 Tables ==========

// جدول سجل التدقيق (Audit Log)
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"), // المستخدم الذي تم تنفيذ العملية عليه
  adminId: integer("admin_id"), // المدير الذي قام بالعملية
  action: text("action").notNull(), // login, logout, create_test, delete_test, change_role, etc.
  entityType: text("entity_type"), // user, test, subscription, institution
  entityId: text("entity_id"),
  details: jsonb("details"), // تفاصيل إضافية للعملية
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  createdAt: true,
});
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;

// جدول طلبات المؤسسات
export const institutionRequests = pgTable("institution_requests", {
  id: serial("id").primaryKey(),
  institutionName: text("institution_name").notNull(),
  type: text("type").notNull(), // school, institute, university
  contactName: text("contact_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  city: text("city"),
  studentsCount: integer("students_count"),
  message: text("message"),
  status: text("status").default("pending").notNull(), // pending, approved, rejected
  reviewedBy: integer("reviewed_by"), // الأدمن الذي راجع الطلب
  reviewedAt: timestamp("reviewed_at"),
  notes: text("notes"), // ملاحظات الأدمن
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertInstitutionRequestSchema = createInsertSchema(institutionRequests).omit({
  id: true,
  createdAt: true,
  reviewedBy: true,
  reviewedAt: true,
});
export type InsertInstitutionRequest = z.infer<typeof insertInstitutionRequestSchema>;
export type InstitutionRequest = typeof institutionRequests.$inferSelect;

// Relations for Audit Logs
export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
  admin: one(admins, {
    fields: [auditLogs.adminId],
    references: [admins.id],
  }),
}));

// Relations for Institution Requests
export const institutionRequestsRelations = relations(institutionRequests, ({ one }) => ({
  reviewer: one(admins, {
    fields: [institutionRequests.reviewedBy],
    references: [admins.id],
  }),
}));
