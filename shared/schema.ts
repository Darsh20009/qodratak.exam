import { pgTable, text, serial, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  category: text("category").notNull(), // "verbal" or "quantitative"
  text: text("text").notNull(),
  options: jsonb("options").notNull(), // Array of strings
  correctOptionIndex: integer("correct_option_index").notNull(),
  difficulty: text("difficulty").notNull(), // "beginner", "intermediate", "advanced"
});

export const userTestResults = pgTable("user_test_results", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  testType: text("test_type").notNull(), // "verbal" or "quantitative"
  difficulty: text("difficulty").notNull(), // "beginner", "intermediate", "advanced"
  score: integer("score").notNull(),
  totalQuestions: integer("total_questions").notNull(),
  completedAt: text("completed_at").notNull(), // Timestamp as string
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertQuestionSchema = createInsertSchema(questions);

export const insertUserTestResultSchema = createInsertSchema(userTestResults).omit({
  id: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type Question = typeof questions.$inferSelect;
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;

export type UserTestResult = typeof userTestResults.$inferSelect;
export type InsertUserTestResult = z.infer<typeof insertUserTestResultSchema>;
