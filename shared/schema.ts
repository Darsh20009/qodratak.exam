import { pgTable, text, serial, integer, boolean, jsonb, timestamp, varchar } from "drizzle-orm/pg-core";
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
