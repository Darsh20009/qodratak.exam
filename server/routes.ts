import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { storage } from "./storage";
import path from "path";
import fs from "fs";
import { insertQuestionSchema } from "@shared/schema";
import { TestType, TestDifficulty } from "@shared/types";
import Mailjet from 'node-mailjet';

// Initialize Mailjet
const mailjet = new Mailjet({
  apiKey: '8d789743a1c5b0154b54e45357a32783',
  apiSecret: '0cd53ff446d8445646e6ca8eee716b04'
});

// Test Mailjet connection
async function testMailjetConnection() {
  try {
    const result = await mailjet.get('sender').request();
    console.log('Mailjet connection successful. Available senders:', result.body);
    return true;
  } catch (error) {
    console.error('Mailjet connection failed:', error);
    return false;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Test Mailjet connection on startup
  await testMailjetConnection();
  
  // Add CORS headers for API routes first
  app.use('/api', (req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
    } else {
      next();
    }
  });

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
      // Clear existing questions first
      await storage.clearAllQuestions();
      console.log("Cleared existing questions");
      
      const questionsPath = path.resolve(
        process.cwd(),
        "server/data/questions_new.json"
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
            // Validate question format with the new comprehensive structure
            const questionData = {
              category: "verbal",
              subcategory: question.category || "التناظر اللفظي", // Use the specific Arabic category
              text: question.text,
              options: question.options,
              correctOptionIndex: question.correctOptionIndex,
              explanation: question.explanation || "", // Include explanation
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
              subcategory: question.category || "عمليات حسابية", // Use the specific Arabic category
              text: question.text,
              options: question.options,
              correctOptionIndex: question.correctOptionIndex,
              explanation: question.explanation || "", // Include explanation
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

  // Advanced Test Results API for specialized tests
  app.post("/api/test-results/advanced", async (req: Request, res: Response) => {
    try {
      const {
        userId,
        testId,
        testName,
        testCategory,
        subcategory,
        totalQuestions,
        correctAnswers,
        wrongAnswers,
        skippedQuestions,
        percentage,
        timeTaken,
        timeLimit,
        difficulty,
        pointsEarned,
        streakBonus,
        performanceLevel,
        weakAreas,
        strongAreas,
        questionDetails,
        improvements,
        sessionId
      } = req.body;

      if (!userId || !testId || !testName || !testCategory || !subcategory) {
        return res.status(400).json({ 
          message: "Missing required fields for advanced test result" 
        });
      }

      const advancedResult = {
        userId,
        testId,
        testName,
        testCategory,
        subcategory,
        totalQuestions: totalQuestions || 0,
        correctAnswers: correctAnswers || 0,
        wrongAnswers: wrongAnswers || 0,
        skippedQuestions: skippedQuestions || 0,
        percentage: percentage || 0,
        timeTaken: timeTaken || 0,
        timeLimit: timeLimit || 0,
        difficulty: difficulty || 'متوسط',
        pointsEarned: pointsEarned || 0,
        streakBonus: streakBonus || 0,
        performanceLevel: performanceLevel || 'مقبول',
        weakAreas: weakAreas || [],
        strongAreas: strongAreas || [],
        questionDetails: questionDetails || [],
        improvements: improvements || [],
        sessionId: sessionId || null,
        completedAt: new Date().toISOString()
      };

      // Save to file-based storage
      try {
        const filePath = path.join(process.cwd(), 'server/data/advanced_results.json');
        let existingResults = [];
        
        try {
          const data = fs.readFileSync(filePath, 'utf8');
          existingResults = JSON.parse(data);
        } catch (error) {
          // File doesn't exist, create empty array
          existingResults = [];
        }
        
        existingResults.push({
          id: Date.now(),
          ...advancedResult
        });

        // Ensure directory exists
        const dirPath = path.dirname(filePath);
        if (!fs.existsSync(dirPath)) {
          fs.mkdirSync(dirPath, { recursive: true });
        }

        fs.writeFileSync(filePath, JSON.stringify(existingResults, null, 2));

        // Update user achievements and stats
        await updateUserAchievements(userId, advancedResult);
        await updatePerformanceAnalytics(userId, advancedResult);

        res.status(201).json({ 
          success: true, 
          message: "Advanced test result saved successfully",
          result: advancedResult 
        });
        
      } catch (fileError) {
        console.error("Error saving to file:", fileError);
        res.status(500).json({ message: "Error saving advanced test result" });
      }
      
    } catch (error) {
      console.error("Error saving advanced test result:", error);
      res.status(500).json({ message: "Error saving advanced test result" });
    }
  });

  // Get advanced test results for a user
  app.get("/api/test-results/advanced/:userId", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      
      const filePath = path.join(process.cwd(), 'server/data/advanced_results.json');
      let existingResults = [];
      
      try {
        const data = fs.readFileSync(filePath, 'utf8');
        existingResults = JSON.parse(data);
      } catch (error) {
        existingResults = [];
      }
      
      const userResults = existingResults.filter((result: any) => result.userId === userId);
      
      res.json(userResults);
    } catch (error) {
      console.error("Error fetching advanced test results:", error);
      res.status(500).json({ message: "Error fetching advanced test results" });
    }
  });

  // Get user achievements
  app.get("/api/achievements/:userId", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      
      const filePath = path.join(process.cwd(), 'server/data/achievements.json');
      let achievements = [];
      
      try {
        const data = fs.readFileSync(filePath, 'utf8');
        achievements = JSON.parse(data);
      } catch (error) {
        achievements = [];
      }
      
      const userAchievements = achievements.filter((achievement: any) => achievement.userId === userId);
      
      res.json(userAchievements);
    } catch (error) {
      console.error("Error fetching user achievements:", error);
      res.status(500).json({ message: "Error fetching user achievements" });
    }
  });

  // Get performance analytics
  app.get("/api/analytics/:userId", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const { category, days } = req.query;
      
      const filePath = path.join(process.cwd(), 'server/data/analytics.json');
      let analytics = [];
      
      try {
        const data = fs.readFileSync(filePath, 'utf8');
        analytics = JSON.parse(data);
      } catch (error) {
        analytics = [];
      }
      
      let userAnalytics = analytics.filter((item: any) => item.userId === userId);
      
      if (category) {
        userAnalytics = userAnalytics.filter((item: any) => item.category === category);
      }
      
      if (days) {
        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - parseInt(days as string));
        userAnalytics = userAnalytics.filter((item: any) => 
          new Date(item.date) >= daysAgo
        );
      }
      
      res.json(userAnalytics);
    } catch (error) {
      console.error("Error fetching performance analytics:", error);
      res.status(500).json({ message: "Error fetching performance analytics" });
    }
  });

  // Helper function to update user achievements
  async function updateUserAchievements(userId: number, testResult: any) {
    try {
      const filePath = path.join(process.cwd(), 'server/data/achievements.json');
      let achievements = [];
      
      try {
        const data = fs.readFileSync(filePath, 'utf8');
        achievements = JSON.parse(data);
      } catch (error) {
        achievements = [];
      }

      const newAchievements = [];

      // Perfect score achievement
      if (testResult.percentage === 100) {
        newAchievements.push({
          id: Date.now(),
          userId,
          achievementType: 'perfect_score',
          achievementName: 'الكمالي',
          description: 'حصل على 100% في اختبار متقدم',
          iconName: 'Star',
          color: '#4f46e5',
          pointsAwarded: 50,
          earnedAt: new Date().toISOString(),
          category: testResult.testCategory,
          level: 1
        });
      }

      // Speed achievement
      if (testResult.timeTaken < (testResult.timeLimit * 0.7)) {
        newAchievements.push({
          id: Date.now() + 1,
          userId,
          achievementType: 'speed',
          achievementName: 'سرعة البرق',
          description: 'أكمل الاختبار في وقت قياسي',
          iconName: 'Zap',
          color: '#f59e0b',
          pointsAwarded: 30,
          earnedAt: new Date().toISOString(),
          category: testResult.testCategory,
          level: 1
        });
      }

      if (newAchievements.length > 0) {
        achievements.push(...newAchievements);
        
        // Ensure directory exists
        const dirPath = path.dirname(filePath);
        if (!fs.existsSync(dirPath)) {
          fs.mkdirSync(dirPath, { recursive: true });
        }
        
        fs.writeFileSync(filePath, JSON.stringify(achievements, null, 2));
      }
    } catch (error) {
      console.error("Error updating achievements:", error);
    }
  }

  // Helper function to update performance analytics
  async function updatePerformanceAnalytics(userId: number, testResult: any) {
    try {
      const filePath = path.join(process.cwd(), 'server/data/analytics.json');
      let analytics = [];
      
      try {
        const data = fs.readFileSync(filePath, 'utf8');
        analytics = JSON.parse(data);
      } catch (error) {
        analytics = [];
      }

      const today = new Date().toISOString().split('T')[0];
      
      // Find or create today's analytics entry
      let todayAnalytics = analytics.find((item: any) => 
        item.userId === userId && 
        item.date.startsWith(today) && 
        item.category === testResult.testCategory
      );

      if (!todayAnalytics) {
        todayAnalytics = {
          id: Date.now(),
          userId,
          date: new Date().toISOString(),
          category: testResult.testCategory,
          subcategory: testResult.subcategory,
          averageScore: testResult.percentage,
          testsCompleted: 1,
          timeSpent: Math.round(testResult.timeTaken / 60), // convert to minutes
          improvementRate: 0,
          consistencyScore: 100,
          challengesCompleted: 1,
          streakCount: 1,
          weeklyGoalProgress: 1
        };
        analytics.push(todayAnalytics);
      } else {
        // Update existing analytics
        const newAverage = Math.round(
          (todayAnalytics.averageScore * todayAnalytics.testsCompleted + testResult.percentage) / 
          (todayAnalytics.testsCompleted + 1)
        );
        
        todayAnalytics.averageScore = newAverage;
        todayAnalytics.testsCompleted += 1;
        todayAnalytics.timeSpent += Math.round(testResult.timeTaken / 60);
        todayAnalytics.challengesCompleted += 1;
        todayAnalytics.weeklyGoalProgress += 1;
      }

      // Ensure directory exists
      const dirPath = path.dirname(filePath);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }

      fs.writeFileSync(filePath, JSON.stringify(analytics, null, 2));
    } catch (error) {
      console.error("Error updating analytics:", error);
    }
  }

  // تسجيل الدخول للمستخدمين
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "البريد الإلكتروني وكلمة المرور مطلوبان" });
      }

      // قراءة ملف المستخدمين
      let users = [];
      try {
        const usersData = fs.readFileSync("attached_assets/user.json", "utf-8");
        users = JSON.parse(usersData);
      } catch (error) {
        console.error("Error reading users file:", error);
        return res.status(500).json({ message: "خطأ في قراءة ملف المستخدمين" });
      }

      // البحث عن المستخدم
      const user = users.find((u: any) => u.email === email && u.password === password);

      if (!user) {
        return res.status(401).json({ message: "البريد الإلكتروني أو كلمة المرور غير صحيحة" });
      }

      // التحقق من حالة الاشتراك
      const today = new Date();
      let shouldUpdateUser = false;

      if (user.subscription) {
        // التحقق من انتهاء الاشتراك للباقات العادية
        if (user.subscription.type !== 'Pro Life' && user.subscription.type !== 'Pro Live' && user.subscription.endDate) {
          const endDate = new Date(user.subscription.endDate);
          
          if (endDate < today) {
            // تحويل الاشتراك المنتهي إلى مجاني
            user.subscription.type = "free";
            user.subscription.startDate = today.toISOString().split('T')[0];
            user.subscription.endDate = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            shouldUpdateUser = true;
          }
        }
      } else {
        // إضافة اشتراك مجاني إذا لم يكن موجوداً
        user.subscription = {
          type: "free",
          startDate: today.toISOString().split('T')[0],
          endDate: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        };
        shouldUpdateUser = true;
      }

      // تحديث ملف المستخدمين إذا لزم الأمر
      if (shouldUpdateUser) {
        const updatedUsers = users.map((u: any) => 
          u.email === email ? user : u
        );

        try {
          fs.writeFileSync("attached_assets/user.json", JSON.stringify(updatedUsers, null, 2));
        } catch (error) {
          console.error("Error updating users file:", error);
        }
      }

      // إرجاع بيانات المستخدم
      return res.json(user);
    } catch (error) {
      console.error("Error during login:", error);
      return res.status(500).json({ message: "خطأ أثناء تسجيل الدخول" });
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
      res.setHeader('Content-Disposition', 'attachment; filename="qudratak-app-v2.1.0.apk"');
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
      // Read from session or use authenticated user (defaulting to user ID 1 for demo)
      const userId = (req.session as any)?.userId || 1;
      
      // Read users from JSON file
      const users = JSON.parse(fs.readFileSync("attached_assets/user.json", "utf8"));
      const user = users.find((u: any) => u.id === userId);
      
      if (user) {
        // Return user with subscription info
        const userData = {
          id: user.id,
          username: user.name,
          name: user.name,
          email: user.email,
          points: user.points || 50,
          level: user.level || 1,
          subscription: user.subscription
        };
        return res.json(userData);
      }

      // Fallback default user if not found
      const defaultUser = {
        id: 1,
        username: "مستخدم",
        points: 50,
        level: 1,
        subscription: null
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

  // API endpoint for sending email OTP
  app.post("/api/send-email-otp", async (req: Request, res: Response) => {
    try {
      const { email, otp } = req.body;

      if (!email || !otp) {
        return res.status(400).json({ error: "Email and OTP are required" });
      }

      const htmlContent = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>رمز التحقق - قدراتك</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700&display=swap');
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Cairo', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 20px 60px rgba(0,0,0,0.1);
            position: relative;
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
            position: relative;
            overflow: hidden;
        }
        
        .logo {
            font-size: 2.5em;
            font-weight: 700;
            margin-bottom: 10px;
            position: relative;
            z-index: 2;
        }
        
        .header-subtitle {
            font-size: 1.1em;
            opacity: 0.9;
            position: relative;
            z-index: 2;
        }
        
        .content {
            padding: 40px 30px;
            text-align: center;
        }
        
        .welcome-text {
            font-size: 1.3em;
            color: #333;
            margin-bottom: 20px;
            font-weight: 600;
        }
        
        .description {
            color: #666;
            margin-bottom: 30px;
            font-size: 1.1em;
            line-height: 1.8;
        }
        
        .otp-container {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            border-radius: 15px;
            padding: 30px;
            margin: 30px 0;
            position: relative;
            overflow: hidden;
        }
        
        .otp-label {
            color: white;
            font-size: 1.2em;
            margin-bottom: 15px;
            font-weight: 600;
            position: relative;
            z-index: 2;
        }
        
        .otp-code {
            background: white;
            color: #333;
            font-size: 3em;
            font-weight: 700;
            padding: 20px 30px;
            border-radius: 10px;
            letter-spacing: 8px;
            margin: 0 auto;
            display: inline-block;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            position: relative;
            z-index: 2;
            border: 3px solid #f093fb;
        }
        
        .timer-info {
            background: #fff3cd;
            border: 2px solid #ffeaa7;
            border-radius: 10px;
            padding: 20px;
            margin: 20px 0;
            color: #856404;
        }
        
        .security-note {
            background: #d1ecf1;
            border: 2px solid #bee5eb;
            border-radius: 10px;
            padding: 20px;
            margin: 20px 0;
            color: #0c5460;
        }
        
        .footer {
            background: #f8f9fa;
            padding: 30px;
            text-align: center;
            border-top: 3px solid #e9ecef;
        }
        
        .footer-logo {
            font-size: 1.5em;
            font-weight: 600;
            color: #667eea;
            margin-bottom: 10px;
        }
        
        .footer-text {
            color: #6c757d;
            font-size: 0.9em;
        }
        
        @media (max-width: 600px) {
            .email-container {
                margin: 10px;
                border-radius: 15px;
            }
            
            .header {
                padding: 30px 20px;
            }
            
            .content {
                padding: 30px 20px;
            }
            
            .otp-code {
                font-size: 2.5em;
                letter-spacing: 4px;
                padding: 15px 20px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <div class="logo">قـدراتـك</div>
            <div class="header-subtitle">منصة التدريب على اختبار القياس</div>
        </div>
        
        <div class="content">
            <div class="welcome-text">مرحباً بك! 👋</div>
            
            <div class="description">
                لإكمال عملية التحقق من حسابك، يرجى استخدام الرمز التالي:
            </div>
            
            <div class="otp-container">
                <div class="otp-label">رمز التحقق الخاص بك</div>
                <div class="otp-code">${otp}</div>
            </div>
            
            <div class="timer-info">
                <strong>مهم:</strong> هذا الرمز صالح لمدة 3 دقائق فقط
            </div>
            
            <div class="security-note">
                <strong>ملاحظة أمنية:</strong><br>
                لا تشارك هذا الرمز مع أي شخص آخر لحماية حسابك
            </div>
        </div>
        
        <div class="footer">
            <div class="footer-logo">قدراتك</div>
            <div class="footer-text">
                منصة شاملة للتدريب على اختبارات القياس<br>
                نساعدك على تحقيق أحلامك الأكاديمية
            </div>
        </div>
    </div>
</body>
</html>`;

      const request = mailjet
        .post('send', { version: 'v3.1' })
        .request({
          Messages: [
            {
              From: {
                Email: "noreply@sandbox.mailjet.com",
                Name: "منصة قدراتك"
              },
              To: [
                {
                  Email: email,
                  Name: "مستخدم منصة قدراتك"
                }
              ],
              Subject: "🔐 رمز التحقق من منصة قدراتك",
              TextPart: `رمز التحقق الخاص بك هو: ${otp}\n\nهذا الرمز صالح لمدة 3 دقائق فقط.\nيرجى عدم مشاركة هذا الرمز مع أي شخص آخر.\n\nمع تحيات فريق قدراتك`,
              HTMLPart: htmlContent
            }
          ]
        });

      const result = await request;
      console.log('Full Mailjet response:', JSON.stringify(result.body, null, 2));

      // Check if email was actually sent successfully
      const message = result.body.Messages[0];
      const recipientInfo = message.To[0];
      
      console.log('Email Status:', message.Status);
      console.log('Recipient Status:', recipientInfo.MessageUUID, recipientInfo.MessageID);
      
      if (message.Status === 'success') {
        res.json({ 
          success: true, 
          message: "تم إرسال رمز التحقق إلى بريدك الإلكتروني بنجاح",
          messageId: recipientInfo.MessageID,
          messageUUID: recipientInfo.MessageUUID
        });
      } else {
        throw new Error(`Mailjet returned status: ${message.Status}`);
      }

    } catch (error: any) {
      console.error('Mailjet error:', error);
      res.status(500).json({ 
        error: "فشل في إرسال البريد الإلكتروني", 
        details: error.message || error.ErrorMessage || "خطأ غير معروف"
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}