import { pgTable, text, serial, integer, boolean, jsonb, timestamp, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  points: integer("points").default(0).notNull(),
  level: integer("level").default(1).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastLogin: timestamp("last_login").defaultNow().notNull(),
});

export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  category: text("category").notNull(), // "verbal", "quantitative", "general", etc.
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

export const examTemplates = pgTable("exam_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  totalSections: integer("total_sections").default(1).notNull(),
  totalQuestions: integer("total_questions").notNull(),
  totalTime: integer("total_time").notNull(), // Time in minutes
  isQiyas: boolean("is_qiyas").default(false),
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

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  lastLogin: true,
  points: true,
  level: true,
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

// Type definitions
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

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

// Define relations
export const usersRelations = relations(users, ({ many }) => ({
  folders: many(folders),
  testResults: many(userTestResults),
  customExams: many(userCustomExams),
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
