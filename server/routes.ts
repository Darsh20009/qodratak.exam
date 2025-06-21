import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { storage } from "./storage";
import path from "path";
import fs from "fs";
import { insertQuestionSchema } from "@shared/schema";
import { TestType, TestDifficulty } from "@shared/types";

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize passport
  app.use(passport.initialize());
  app.use(passport.session());
  
  passport.serializeUser((user: any, done) => {
    done(null, user);
  });
  
  passport.deserializeUser((user: any, done) => {
    done(null, user);
  });

  // Load questions from JSON file

  // Google OAuth configuration (only if credentials are provided)
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "https://" + process.env.REPL_SLUG + "." + process.env.REPL_OWNER + ".repl.co/api/auth/google/callback"
    }, async (accessToken, refreshToken, profile, done) => {
    try {
      // Create or update user
      const email = profile.emails?.[0]?.value;
      const name = profile.displayName;
      
      if (!email) {
        return done(new Error('No email found'));
      }

      const users = JSON.parse(fs.readFileSync("attached_assets/user.json", "utf-8"));
      let user = users.find((u: any) => u.email === email);

      if (!user) {
        // Create new user
        user = {
          name,
          email,
          subscription: {
            type: "free",
            startDate: new Date().toISOString().split('T')[0],
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          }
        };
        users.push(user);
        fs.writeFileSync("attached_assets/user.json", JSON.stringify(users, null, 2));
      }

      return done(null, user);
    } catch (error) {
      return done(error);
    }
  }));
  }

  // Auth routes will be added here

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

  // Search questions by text with advanced options
  app.get("/api/questions/search", async (req: Request, res: Response) => {
    try {
      const { query, category, difficulty, dialect, limit } = req.query;

      if (!query || typeof query !== 'string') {
        return res.status(400).json({ message: "Query parameter is required" });
      }

      // Use advanced search if any filter is specified
      if (category || difficulty || dialect || limit) {
        const options = {
          category: typeof category === 'string' ? category : undefined,
          difficulty: typeof difficulty === 'string' ? difficulty : undefined,
          dialect: typeof dialect === 'string' ? dialect : undefined,
          limit: typeof limit === 'string' ? parseInt(limit) : undefined
        };

        const results = await storage.searchQuestionsAdvanced(query, options);
        return res.json(results);
      } else {
        // Fallback to simple search
        const questions = await storage.searchQuestions(query);
        return res.json(questions.map(q => ({
          question: q,
          matchType: 'exact'
        })));
      }
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

  // Custom exam creation removed

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
        pointsEarned: Math.round(score * 10)
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
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      const users = JSON.parse(fs.readFileSync("attached_assets/user.json", "utf-8"));
      const user = users.find((u: any) => u.email === email && u.password === password);

      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Check subscription status
      if (user.subscription.type !== 'Pro Live') {
        const endDate = new Date(user.subscription.endDate);
        const today = new Date();

        // Handle different subscription types
        if (user.subscription.type === 'Pro Live') {
          // Pro Live users don't need expiry check
          user.subscription.competitionEndDate = new Date(today.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        } else if (endDate < today) {
          // Convert expired subscription to free
          user.subscription.type = "free";
          user.subscription.startDate = today.toISOString().split('T')[0];
          user.subscription.endDate = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

          // Update user in JSON file
          const updatedUsers = users.map((u: any) => 
            u.email === email ? user : u
          );

          fs.writeFileSync("attached_assets/user.json", JSON.stringify(updatedUsers, null, 2));
        }
      }

      return res.json(user);
    } catch (error) {
      console.error("Error during login:", error);
      return res.status(500).json({ message: "Error during login" });
    }
});

// Account recovery endpoint
app.post("/api/recover-account", async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    // Find user with this email
    const users = JSON.parse(fs.readFileSync("attached_assets/user.json", "utf-8"));
    const user = users.find((u: any) => u.email === email);

    // Send to Telegram regardless if user exists or not
    const message = encodeURIComponent(
      `طلب استرداد حساب\nالبريد الإلكتروني: ${email}`
    );

    // Log the request
    console.log(`Account info request for email: ${email}`);

    res.status(200).json({ 
      message: "تم إرسال بيانات الحساب إلى @qodratak2030",
      telegramUrl: `https://t.me/qodratak2030?text=${message}`
    });
  } catch (error) {
    console.error("Error in account recovery:", error);
    res.status(500).json({ message: "حدث خطأ في عملية الاسترداد" });
  }
});

app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const { name, email, password } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({ message: "يرجى إدخال جميع البيانات المطلوبة" });
      }

      // قراءة ملف المستخدمين
      let users = [];
      try {
        const data = fs.readFileSync("attached_assets/user.json", "utf-8");
        users = JSON.parse(data);
      } catch (error) {
        // إنشاء ملف جديد إذا لم يكن موجوداً
        fs.writeFileSync("attached_assets/user.json", "[]");
      }

      if (users.some((u: any) => u.email === email)) {
        return res.status(400).json({ message: "البريد الإلكتروني مستخدم من قبل" });
      }

      const today = new Date();

      const newUser = {
        id: users.length + 1,
        name,
        email,
        password,
        subscription: {
          type: "free",
          startDate: today.toISOString().split('T')[0],
          endDate: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        },
        points: 100, // نقاط ترحيبية
        level: 1,
        testsTaken: 0,
        averageScore: 0,
        folders: [],
        achievements: [],
        pointsHistory: [{
          points: 100,
          reason: "مكافأة الترحيب",
          date: today.toISOString()
        }],
        testHistory: [],
        savedQuestions: []
      };

      users.push(newUser);
      fs.writeFileSync("attached_assets/user.json", JSON.stringify(users, null, 2));

      return res.status(201).json(newUser);
    } catch (error) {
      console.error("Error creating user:", error);
      return res.status(500).json({ message: "Error creating user" });
    }
  });

  // Get user by ID
  app.get("/api/users/:id", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);

      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      return res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      return res.status(500).json({ message: "Error fetching user" });
    }
  });

  // Update user points
  app.patch("/api/users/:id/points", async (req: Request, res: Response) => {
    try {
      const { points, reason } = req.body;
      const email = req.params.id;

      const users = JSON.parse(fs.readFileSync("attached_assets/user.json", "utf-8"));
      const userIndex = users.findIndex((u: any) => u.email === email);

      if (userIndex === -1) {
        return res.status(404).json({ message: "User not found" });
      }

      const user = users[userIndex];
      user.points = (user.points || 0) + points;
      
      // Update level based on points
      if (user.points >= 10000) user.level = 5;
      else if (user.points >= 6000) user.level = 4;
      else if (user.points >= 3000) user.level = 3;
      else if (user.points >= 1000) user.level = 2;
      else user.level = 1;

      // Add to points history
      if (!user.pointsHistory) user.pointsHistory = [];
      user.pointsHistory.push({
        points,
        reason,
        date: new Date().toISOString()
      });

      users[userIndex] = user;
      fs.writeFileSync("attached_assets/user.json", JSON.stringify(users, null, 2));

      res.status(200).json(user);
    } catch (error) {
      console.error("Error updating user points:", error);
      return res.status(500).json({ message: "Error updating user points" });
    }
  });

  // Folder routes
  app.get("/api/folders/user/:userId", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      const folders = await storage.getFoldersByUser(userId);
      res.json(folders);
    } catch (error) {
      console.error("Error getting user folders:", error);
      res.status(500).json({ message: "Error getting user folders" });
    }
  });

  app.post("/api/folders", async (req: Request, res: Response) => {
    try {
      const folder = req.body;

      if (!folder.userId || !folder.name) {
        return res.status(400).json({ message: "User ID and folder name are required" });
      }

      const newFolder = await storage.createFolder({
        userId: folder.userId,
        name: folder.name,
        description: folder.description,
        color: folder.color || "#4f46e5",
        icon: folder.icon || "folder",
        isDefault: folder.isDefault || false
      });

      res.status(201).json(newFolder);
    } catch (error) {
      console.error("Error creating folder:", error);
      res.status(500).json({ message: "Error creating folder" });
    }
  });

  app.delete("/api/folders/:id", async (req: Request, res: Response) => {
    try {
      const folderId = parseInt(req.params.id);
      if (isNaN(folderId)) {
        return res.status(400).json({ message: "Invalid folder ID" });
      }

      const deleted = await storage.deleteFolder(folderId);
      if (deleted) {
        res.status(204).send();
      } else {
        res.status(404).json({ message: "Folder not found" });
      }
    } catch (error) {
      console.error("Error deleting folder:", error);
      res.status(500).json({ message: "Error deleting folder" });
    }
  });

  // Folder questions routes
  app.get("/api/folders/:folderId/questions", async (req: Request, res: Response) => {
    try {
      const folderId = parseInt(req.params.folderId);
      if (isNaN(folderId)) {
        return res.status(400).json({ message: "Invalid folder ID" });
      }

      const questions = await storage.getQuestionsInFolder(folderId);
      res.json(questions);
    } catch (error) {
      console.error("Error getting folder questions:", error);
      res.status(500).json({ message: "Error getting folder questions" });
    }
  });

  app.post("/api/folders/:folderId/questions", async (req: Request, res: Response) => {
    try {
      const folderId = parseInt(req.params.folderId);
      if (isNaN(folderId)) {
        return res.status(400).json({ message: "Invalid folder ID" });
      }

      const { questionId } = req.body;
      if (!questionId) {
        return res.status(400).json({ message: "Question ID is required" });
      }

      const folderQuestion = {
        folderId,
        questionId,
        notes: req.body.notes
      };

      const newFolderQuestion = await storage.addQuestionToFolder(folderQuestion);
      res.status(201).json(newFolderQuestion);
    } catch (error) {
      console.error("Error adding question to folder:", error);
      res.status(500).json({ message: "Error adding question to folder" });
    }
  });

  app.delete("/api/folders/:folderId/questions/:questionId", async (req: Request, res: Response) => {
    try {
      const folderId = parseInt(req.params.folderId);
      const questionId = parseInt(req.params.questionId);

      if (isNaN(folderId) || isNaN(questionId)) {
        return res.status(400).json({ message: "Invalid folder or question ID" });
      }

      const deleted = await storage.removeQuestionFromFolder(folderId, questionId);
      if (deleted) {
        res.status(204).send();
      } else {
        res.status(404).json({ message: "Question not found in folder" });
      }
    } catch (error) {
      console.error("Error removing question from folder:", error);
      res.status(500).json({ message: "Error removing question from folder" });
    }
  });

  // Download APK file
  app.get("/app/qudratak-app.apk", async (req: Request, res: Response) => {
    try {
      const apkPath = path.resolve(process.cwd(), "public/app/qudratak-app.apk");
      
      if (!fs.existsSync(apkPath)) {
        // إنشاء ملف APK إذا لم يكن موجوداً
        const { exec } = require('child_process');
        exec('node server/create-real-apk.js', (error: any) => {
          if (error) {
            console.error('Error creating APK:', error);
          }
        });
        
        return res.status(404).json({ message: "APK file not found. Please try again in a moment." });
      }

      // إعداد headers للتحميل
      res.setHeader('Content-Type', 'application/vnd.android.package-archive');
      res.setHeader('Content-Disposition', 'attachment; filename="منصة-قدراتك-v2.1.0.apk"');
      res.setHeader('Cache-Control', 'no-cache');
      
      // إرسال الملف
      const fileStream = fs.createReadStream(apkPath);
      fileStream.pipe(res);
      
    } catch (error) {
      console.error("Error serving APK file:", error);
      res.status(500).json({ message: "Error downloading APK file" });
    }
  });

  // Get current user (for auth purposes)
  app.get("/api/user", async (req: Request, res: Response) => {
    try {
      // For demo purposes, we'll use a default user
      const defaultUser = {
        id: 1,
        username: "مستخدم",
        points: 50,
        level: 1
      };

      res.json(defaultUser);
    } catch (error) {
      console.error("Error fetching current user:", error);
      res.status(500).json({ message: "Error fetching current user" });
    }
  });

  // Time Management API Routes

  // Task routes
  app.get("/api/tasks/:userId", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const tasks = await storage.getTasks(userId);
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      res.status(500).json({ message: "Error fetching tasks" });
    }
  });

  app.post("/api/tasks", async (req: Request, res: Response) => {
    try {
      const task = await storage.createTask(req.body);
      res.status(201).json(task);
    } catch (error) {
      console.error("Error creating task:", error);
      res.status(500).json({ message: "Error creating task" });
    }
  });

  app.patch("/api/tasks/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const task = await storage.updateTask(id, req.body);
      res.json(task);
    } catch (error) {
      console.error("Error updating task:", error);
      res.status(500).json({ message: "Error updating task" });
    }
  });

  app.delete("/api/tasks/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteTask(id);
      res.json({ success: deleted });
    } catch (error) {
      console.error("Error deleting task:", error);
      res.status(500).json({ message: "Error deleting task" });
    }
  });

  // Habit routes
  app.get("/api/habits/:userId", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const habits = await storage.getHabits(userId);
      res.json(habits);
    } catch (error) {
      console.error("Error fetching habits:", error);
      res.status(500).json({ message: "Error fetching habits" });
    }
  });

  app.post("/api/habits", async (req: Request, res: Response) => {
    try {
      const habit = await storage.createHabit(req.body);
      res.status(201).json(habit);
    } catch (error) {
      console.error("Error creating habit:", error);
      res.status(500).json({ message: "Error creating habit" });
    }
  });

  app.post("/api/habit-logs", async (req: Request, res: Response) => {
    try {
      const habitLog = await storage.createHabitLog(req.body);
      res.status(201).json(habitLog);
    } catch (error) {
      console.error("Error creating habit log:", error);
      res.status(500).json({ message: "Error creating habit log" });
    }
  });

  // Project routes
  app.get("/api/projects/:userId", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const projects = await storage.getProjects(userId);
      res.json(projects);
    } catch (error) {
      console.error("Error fetching projects:", error);
      res.status(500).json({ message: "Error fetching projects" });
    }
  });

  app.post("/api/projects", async (req: Request, res: Response) => {
    try {
      const project = await storage.createProject(req.body);
      res.status(201).json(project);
    } catch (error) {
      console.error("Error creating project:", error);
      res.status(500).json({ message: "Error creating project" });
    }
  });

  // Pomodoro session routes
  app.post("/api/pomodoro-sessions", async (req: Request, res: Response) => {
    try {
      const session = await storage.createPomodoroSession(req.body);
      res.status(201).json(session);
    } catch (error) {
      console.error("Error creating pomodoro session:", error);
      res.status(500).json({ message: "Error creating pomodoro session" });
    }
  });

  app.get("/api/pomodoro-sessions/:userId", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const date = req.query.date ? new Date(req.query.date as string) : undefined;
      const sessions = await storage.getPomodoroSessions(userId, date);
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching pomodoro sessions:", error);
      res.status(500).json({ message: "Error fetching pomodoro sessions" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}