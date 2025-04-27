import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import path from "path";
import fs from "fs";
import { insertQuestionSchema } from "@shared/schema";
import { TestType, TestDifficulty } from "@shared/types";

export async function registerRoutes(app: Express): Promise<Server> {
  // Load questions from JSON file
  app.get("/api/seed-questions", async (req: Request, res: Response) => {
    try {
      const questionsPath = path.resolve(
        process.cwd(),
        "attached_assets/questions_all.json"
      );
      
      if (!fs.existsSync(questionsPath)) {
        return res.status(404).json({ message: "Questions file not found" });
      }
      
      const fileContent = fs.readFileSync(questionsPath, "utf-8");
      const questionsData = JSON.parse(fileContent);
      
      // Process verbal questions
      if (questionsData.verbal && Array.isArray(questionsData.verbal)) {
        for (const question of questionsData.verbal) {
          try {
            // Validate question format
            const questionData = {
              category: "verbal",
              text: question.text,
              options: question.options,
              correctOptionIndex: question.correctOptionIndex,
              difficulty: "beginner" // Default to beginner, can be adjusted later
            };
            
            await storage.createQuestion(questionData);
          } catch (error) {
            console.error("Error seeding question:", error);
          }
        }
      }
      
      // Process quantitative questions if they exist
      if (questionsData.quantitative && Array.isArray(questionsData.quantitative)) {
        for (const question of questionsData.quantitative) {
          try {
            const questionData = {
              category: "quantitative",
              text: question.text,
              options: question.options,
              correctOptionIndex: question.correctOptionIndex,
              difficulty: "beginner" // Default to beginner
            };
            
            await storage.createQuestion(questionData);
          } catch (error) {
            console.error("Error seeding question:", error);
          }
        }
      }
      
      return res.status(200).json({ message: "Questions seeded successfully" });
    } catch (error) {
      console.error("Error reading questions file:", error);
      return res.status(500).json({ message: "Error seeding questions" });
    }
  });

  // Get questions by category and difficulty
  app.get("/api/questions", async (req: Request, res: Response) => {
    try {
      const { category, difficulty } = req.query;
      
      if (category && difficulty) {
        const questions = await storage.getQuestionsByCategoryAndDifficulty(
          category as string,
          difficulty as string
        );
        return res.json(questions);
      } else if (category) {
        const questions = await storage.getQuestionsByCategory(category as string);
        return res.json(questions);
      } else {
        const questions = await storage.getAllQuestions();
        return res.json(questions);
      }
    } catch (error) {
      console.error("Error fetching questions:", error);
      return res.status(500).json({ message: "Error fetching questions" });
    }
  });

  // Search questions by text
  app.get("/api/questions/search", async (req: Request, res: Response) => {
    try {
      const { query } = req.query;
      
      if (!query || typeof query !== 'string') {
        return res.status(400).json({ message: "Query parameter is required" });
      }
      
      const questions = await storage.searchQuestions(query);
      return res.json(questions);
    } catch (error) {
      console.error("Error searching questions:", error);
      return res.status(500).json({ message: "Error searching questions" });
    }
  });

  // Get a specific question by ID
  app.get("/api/questions/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const question = await storage.getQuestionsById(parseInt(id));
      
      if (!question) {
        return res.status(404).json({ message: "Question not found" });
      }
      
      return res.json(question);
    } catch (error) {
      console.error("Error fetching question:", error);
      return res.status(500).json({ message: "Error fetching question" });
    }
  });

  // Save test result
  app.post("/api/test-results", async (req: Request, res: Response) => {
    try {
      const { userId, testType, difficulty, score, totalQuestions } = req.body;
      
      if (!userId || !testType || !difficulty || score === undefined || !totalQuestions) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      const result = await storage.createTestResult({
        userId,
        testType,
        difficulty,
        score,
        totalQuestions,
        completedAt: new Date().toISOString()
      });
      
      return res.status(201).json(result);
    } catch (error) {
      console.error("Error saving test result:", error);
      return res.status(500).json({ message: "Error saving test result" });
    }
  });

  // Get test results for a user
  app.get("/api/test-results/user/:userId", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { testType } = req.query;
      
      if (testType) {
        const results = await storage.getTestResultsByUserAndType(
          parseInt(userId),
          testType as string
        );
        return res.json(results);
      } else {
        const results = await storage.getTestResultsByUser(parseInt(userId));
        return res.json(results);
      }
    } catch (error) {
      console.error("Error fetching test results:", error);
      return res.status(500).json({ message: "Error fetching test results" });
    }
  });

  // Create a new user (simple for demo purposes)
  app.post("/api/users", async (req: Request, res: Response) => {
    try {
      const { username } = req.body;
      
      if (!username) {
        return res.status(400).json({ message: "Username is required" });
      }
      
      const existingUser = await storage.getUserByUsername(username);
      
      if (existingUser) {
        return res.json(existingUser);
      }
      
      // Create a simple user with username as password (for demo)
      const user = await storage.createUser({
        username,
        password: username
      });
      
      return res.status(201).json(user);
    } catch (error) {
      console.error("Error creating user:", error);
      return res.status(500).json({ message: "Error creating user" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
