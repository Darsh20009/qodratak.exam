import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import mongoose from 'mongoose';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { storage } from "./storage";
import { mongoStorage } from "./mongodb/mongoStorage";
import path from "path";
import fs from "fs";
import { fileURLToPath } from 'url';
import multer from 'multer';

import { insertQuestionSchema } from "@shared/schema";
import { TestType, TestDifficulty } from "@shared/types";
import bcrypt from 'bcryptjs';
import { exec } from 'child_process';
import { sendTestEmail, sendOTPEmail, sendWelcomeEmail, sendSubscriptionApprovalEmail, sendExamResults, sendPasswordResetEmail, notifyAdminNewSubscription, notifyAdminReceiptUploaded, notifyAdminInstitutionRequest, sendInvitationEmail } from './services/emailService';
import crypto from 'crypto';

// RBAC System - Sprint 0
import { 
  requireAuth, 
  requirePermission, 
  requireAnyPermission, 
  requireRole, 
  requireAdmin as rbacRequireAdmin,
  requireInstitutionAccess,
  requireOwnership,
  permissions 
} from './middleware/rbac';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function scheduleAiReviewAndEmail(bookingId: string, userId: string): Promise<void> {
  const { ExamBooking, User } = await import('./mongodb/models');
  const booking = await ExamBooking.findById(bookingId).lean() as any;
  if (!booking) return;

  const resultVisibleAt = booking.resultVisibleAt ? new Date(booking.resultVisibleAt).getTime() : Date.now() + 12 * 60 * 1000;
  const delayMs = Math.max(resultVisibleAt - Date.now(), 0);

  await new Promise(resolve => setTimeout(resolve, delayMs));

  try {
    const fresh = await ExamBooking.findById(bookingId).lean() as any;
    if (!fresh || fresh.aiReviewDone) {
      console.log(`[AI Review] Booking ${bookingId} already reviewed — skipping`);
      return;
    }

    console.log(`[AI Review] Starting AI review for booking ${bookingId}...`);
    const { reviewExamBooking } = await import('./services/aiExamReview');
    const result = await reviewExamBooking(fresh as any);

    await mongoStorage.updateExamBookingAfterAiReview(bookingId, {
      sectionResults: result.correctedSectionResults,
      totalScore: result.correctedTotalScore,
      verbalScore: result.correctedVerbalScore,
      quantScore: result.correctedQuantScore,
      totalScoreOutOf100: result.correctedTotalScoreOutOf100,
      verbalPercent: result.correctedVerbalPercent,
      quantPercent: result.correctedQuantPercent,
      correctAnswers: result.correctedCorrectAnswers,
      wrongAnswers: result.correctedWrongAnswers,
      skippedAnswers: result.correctedSkippedAnswers,
    });

    const dbUser = await User.findOne({ _id: userId }).lean() as any;
    const userEmail = dbUser?.email;
    const userFullName = dbUser?.name || dbUser?.username || 'الطالب';

    if (userEmail) {
      const scheduledAtStr = new Date(fresh.scheduledAt).toLocaleDateString('ar-SA', {
        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
      });
      try {
        const sent = await sendExamResults(userEmail, userFullName, {
          bookingId,
          scheduledAt: scheduledAtStr,
          totalScoreOutOf100: result.correctedTotalScoreOutOf100,
          verbalPercent: result.correctedVerbalPercent,
          quantPercent: result.correctedQuantPercent,
          correctAnswers: result.correctedCorrectAnswers,
          wrongAnswers: result.correctedWrongAnswers,
          skippedAnswers: result.correctedSkippedAnswers,
          totalQuestions: 100,
          cheatingFlag: false,
        });
        if (sent) {
          await mongoStorage.markExamResultEmailSent(bookingId);
          console.log(`📧 [AI Review] نتيجة الاختبار المراجَعة أُرسلت إلى ${userEmail}`);
        }
      } catch (emailErr) {
        console.error('[AI Review] Error sending result email:', emailErr);
      }
    }
  } catch (err) {
    console.error(`[AI Review] Error reviewing booking ${bookingId}:`, err);
    await ExamBooking.findByIdAndUpdate(bookingId, {
      aiReviewDone: true,
      resultVisibleAt: new Date(),
    });
  }
}

async function recoverPendingAiReviews(): Promise<void> {
  try {
    const pending = await mongoStorage.getPendingAiReviews();
    if (pending.length === 0) return;
    console.log(`[AI Review Recovery] Found ${pending.length} bookings pending AI review`);
    for (const b of pending) {
      scheduleAiReviewAndEmail(String(b._id), b.userId).catch(e =>
        console.error('[AI Review Recovery] error:', e)
      );
    }
  } catch (err) {
    console.error('[AI Review Recovery] startup check failed:', err);
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  console.log('✅ SMTP2Go email service ready - noreply@qodratak.sa');

  // Admin middleware - Revalidates admin on each request
  const requireAdmin = async (req: Request, res: Response, next: Function) => {
    try {
      if ((req.session as any).isAdmin && (req.session as any).adminId) {
        const admin = await mongoStorage.getAdminById((req.session as any).adminId);
        if (admin && admin.isActive !== false) {
          (req as any).admin = admin;
          next();
        } else {
          (req.session as any).isAdmin = false;
          (req.session as any).adminId = null;
          res.status(401).json({ error: 'تم إلغاء صلاحيات المدير' });
        }
      } else {
        res.status(401).json({ error: 'غير مصرح - يجب تسجيل الدخول كمدير' });
      }
    } catch (error) {
      console.error('Admin middleware error:', error);
      res.status(500).json({ error: 'خطأ في التحقق من الصلاحيات' });
    }
  };

  // Add CORS headers for API routes (strict same origin only)
  app.use('/api', (req, res, next) => {
    const origin = req.headers.origin;
    const host = req.headers.host;

    // Strict same origin check - exact match only
    const allowedOrigins = [
      `https://${host}`,
      `http://${host}`,
      `http://localhost:5000`,
      `https://localhost:5000`
    ];

    if (origin && allowedOrigins.includes(origin)) {
      res.header('Access-Control-Allow-Origin', origin);
      res.header('Access-Control-Allow-Credentials', 'true');
    } else if (!origin) {
      // No origin header means same-origin request (direct server call)
      res.header('Access-Control-Allow-Origin', `https://${host}`);
      res.header('Access-Control-Allow-Credentials', 'true');
    }

    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Vary', 'Origin');

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

  // Serve PDF files from attached_assets
  app.get('/api/download/book/:filename', (req: Request, res: Response) => {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, '..', 'attached_assets', filename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Set headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);

    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  });

  // Load questions from JSON file

  // Tahsili exam endpoints (protected) - using device-based approach like subscription/status
  app.get('/api/tahsili/exams/:examId', async (req: Request, res: Response) => {
    try {
      // Get deviceId and userId from query parameters (like subscription/status endpoint)
      const { deviceId, userId } = req.query;

      if (!deviceId) {
        return res.status(400).json({ error: 'Device ID is required' });
      }

      let hasActiveSubscription = false;

      // Check user subscription first (if userId is provided) - same logic as subscription/status
      if (userId) {
        try {
          const users = JSON.parse(fs.readFileSync("attached_assets/user.json", "utf-8"));
          const user = users.find((u: any) => u.id === parseInt(userId as string));

          if (user && user.subscription) {
            const now = new Date();
            // تأكد من تحويل التاريخ بشكل صحيح
            const endDateStr = user.subscription.endDate;
            const endDate = new Date(endDateStr + 'T23:59:59Z'); // إضافة الوقت لنهاية اليوم

            console.log('📅 Subscription check:', {
              userId,
              subscriptionType: user.subscription.type,
              endDateStr,
              endDate: endDate.toISOString(),
              now: now.toISOString(),
              isActive: now < endDate
            });

            // Check if subscription is active and not expired
            if (now < endDate) {
              // Define all valid premium subscription types
              const validPremiumTypes = ['Pro', 'Pro Life', 'Pro Life Plus', 'Pro Live'];

              if (validPremiumTypes.includes(user.subscription.type)) {
                hasActiveSubscription = true;
              }
            }
          }
        } catch (error) {
          console.error("Error reading user data:", error);
        }
      }

      // If no active user subscription, check device trials (same as subscription/status)
      if (!hasActiveSubscription) {
        try {
          let deviceTrials = [];
          try {
            const trialsData = fs.readFileSync("attached_assets/device_trials.json", "utf-8");
            deviceTrials = JSON.parse(trialsData);
          } catch (error) {
            deviceTrials = [];
          }

          const deviceTrial = deviceTrials.find((trial: any) => trial.deviceId === deviceId);
          const now = new Date();

          if (deviceTrial) {
            const trialEnd = new Date(deviceTrial.trialEndDate);
            if (now < trialEnd) {
              hasActiveSubscription = true; // Trial is active
            }
          }
        } catch (error) {
          console.error("Error checking device trials:", error);
        }
      }

      if (!hasActiveSubscription) {
        return res.status(403).json({ error: 'Premium subscription required' });
      }

      const { examId } = req.params;

      // Map exam IDs to file names
      const examFiles: { [key: string]: string } = {
        'exam-50': 'exam-50.json',
        'exam-10': 'exam-10.json',
        'exam-100': 'exam-100.json',
        'exam-110': 'exam-110.json'
      };

      const fileName = examFiles[examId];
      if (!fileName) {
        return res.status(404).json({ error: 'Exam not found' });
      }

      // Use process.cwd() to ensure correct path in both dev and production
      const filePath = path.join(process.cwd(), 'server', 'data', fileName);

      // Check if file exists
      if (!fs.existsSync(filePath)) {
        console.error(`Exam file not found at: ${filePath}`);
        return res.status(404).json({ error: `لم يتم العثور على أسئلة الاختبار المحدد: ${examId}` });
      }

      // Read and parse the exam file
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const examData = JSON.parse(fileContent);

      res.json(examData);
    } catch (error) {
      console.error('Error loading Tahsili exam:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Google OAuth configuration (only if credentials are provided)
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    const appUrl = (process.env.APP_URL || 'http://localhost:5000').replace(/\/$/, '');
    passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${appUrl}/api/auth/google/callback`
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
        "server/questions.json"
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
            const questionData: any = {
              category: "verbal",
              subcategory: question.category || "التناظر اللفظي",
              text: question.text,
              options: question.options,
              correctOptionIndex: question.correctOptionIndex,
              explanation: question.explanation || "",
              difficulty: "beginner"
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
            const questionData: any = {
              category: "quantitative",
              subcategory: question.category || "عمليات حسابية",
              text: question.text,
              options: question.options,
              correctOptionIndex: question.correctOptionIndex,
              explanation: question.explanation || "",
              difficulty: "beginner"
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
      const { category, difficulty, excludeSeen } = req.query;
      const sessionUserId = (req as any).session?.userId;

      // If excludeSeen=true and user is logged in, return only unseen questions
      if (excludeSeen === 'true' && sessionUserId) {
        try {
          const unseenQuestions = await mongoStorage.getUnseenQuestions(
            String(sessionUserId),
            2000,
            { category: category as string | undefined }
          );
          return res.json(unseenQuestions.map((q: any) => ({
            id: q.questionId,
            questionId: q.questionId,
            _id: q._id,
            text: q.text,
            options: q.options,
            correctOptionIndex: q.correctOptionIndex,
            category: q.category,
            subcategory: q.subcategory,
            difficulty: q.difficulty,
            explanation: q.explanation,
            imageUrl: q.imageUrl,
          })));
        } catch {}
      }

      const pgQuestions = category && difficulty
        ? await storage.getQuestionsByCategoryAndDifficulty(category as string, difficulty as string)
        : category
          ? await storage.getQuestionsByCategory(category as string)
          : await storage.getAllQuestions();

      try {
        const mongoQuestions = await mongoStorage.getQuestions(
          category as string | undefined,
          undefined,
          difficulty as string | undefined,
          10000
        );
        if (mongoQuestions && mongoQuestions.length > 0) {
          const mongoIds = new Set(mongoQuestions.map((q: any) => q.questionId));
          const pgOnly = pgQuestions.filter((q: any) => !mongoIds.has(q.id ?? q.questionId));
          const merged = [
            ...mongoQuestions.map((q: any) => ({
              id: q.questionId,
              questionId: q.questionId,
              _id: q._id,
              text: q.text,
              options: q.options,
              correctOptionIndex: q.correctOptionIndex,
              category: q.category,
              subcategory: q.subcategory,
              difficulty: q.difficulty,
              explanation: q.explanation,
              imageUrl: q.imageUrl,
            })),
            ...pgOnly,
          ];
          return res.json(merged);
        }
      } catch {}

      return res.json(pgQuestions);
    } catch (error) {
      console.error("Error fetching questions:", error);
      return res.status(500).json({ message: "Error fetching questions" });
    }
  });

  // Get questions statistics
  app.get("/api/questions/stats", async (req: Request, res: Response) => {
    try {
      const questionsPath = path.resolve(
        process.cwd(),
        "server/questions.json"
      );

      if (!fs.existsSync(questionsPath)) {
        return res.status(404).json({ message: "Questions file not found" });
      }

      const fileContent = fs.readFileSync(questionsPath, "utf-8");
      const questionsData = JSON.parse(fileContent);

      const verbalCount = questionsData.verbal?.length || 0;
      const quantitativeCount = questionsData.quantitative?.length || 0;
      const totalCount = verbalCount + quantitativeCount;

      const roundedToHundred = Math.floor(totalCount / 100) * 100;

      return res.json({
        verbal: verbalCount,
        quantitative: quantitativeCount,
        total: totalCount,
        roundedTotal: roundedToHundred
      });
    } catch (error) {
      console.error("Error fetching questions stats:", error);
      return res.status(500).json({ message: "Error fetching questions stats" });
    }
  });

  // Get all questions from JSON file (for book generation)
  app.get("/api/questions/all", async (req: Request, res: Response) => {
    try {
      const questionsPath = path.resolve(
        process.cwd(),
        "server/questions.json"
      );

      if (!fs.existsSync(questionsPath)) {
        return res.status(404).json({ message: "Questions file not found" });
      }

      const fileContent = fs.readFileSync(questionsPath, "utf-8");
      const questionsData = JSON.parse(fileContent);

      // Return the data in the format: { verbal: [...], quantitative: [...] }
      return res.json(questionsData);
    } catch (error) {
      console.error("Error fetching all questions:", error);
      return res.status(500).json({ message: "Error fetching all questions" });
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

  // Get random questions for multiplayer / custom use
  app.get("/api/questions/random", async (req: Request, res: Response) => {
    try {
      const count = Math.min(parseInt(String(req.query.count || '10')), 100);
      const type = String(req.query.type || 'mixed');
      let category: string | undefined;
      if (type === 'verbal') category = 'verbal';
      else if (type === 'quantitative') category = 'quantitative';

      const all = await mongoStorage.getQuestions(category, undefined, undefined, 3000);
      if (!all || all.length === 0) {
        return res.json({ questions: [] });
      }
      const shuffled = [...all].sort(() => Math.random() - 0.5).slice(0, count);
      const questions = shuffled.map((q: any) => ({
        _id: q._id,
        id: q.questionId || q._id,
        text: q.text,
        question: q.text,
        options: q.options,
        choices: q.options,
        correctOptionIndex: q.correctOptionIndex ?? 0,
        correctAnswer: q.correctOptionIndex ?? 0,
        type: q.category || 'verbal',
        category: q.category,
        difficulty: q.difficulty,
        explanation: q.explanation,
      }));
      return res.json({ questions, total: questions.length });
    } catch (error) {
      console.error("Error fetching random questions:", error);
      return res.status(500).json({ message: "Error fetching random questions" });
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

  // Get questions for free tests (20 mixed questions)
  app.get("/api/questions/free-test/:category", async (req: Request, res: Response) => {
    try {
      const { category } = req.params;
      const sessionUserId = (req as any).session?.userId;

      if (category !== 'verbal' && category !== 'quantitative') {
        return res.status(400).json({ message: "Category must be 'verbal' or 'quantitative'" });
      }

      // For logged-in users, return unseen questions
      if (sessionUserId) {
        try {
          const unseenQuestions = await mongoStorage.getUnseenQuestions(
            String(sessionUserId),
            20,
            { category }
          );
          if (unseenQuestions.length > 0) return res.json(unseenQuestions);
        } catch {}
      }

      const allQuestions = await storage.getQuestionsByCategory(category);
      const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);
      const selectedQuestions = shuffled.slice(0, 20);

      return res.json(selectedQuestions);
    } catch (error) {
      console.error("Error fetching free test questions:", error);
      return res.status(500).json({ message: "Error fetching free test questions" });
    }
  });

  // Bulk insert questions endpoint (for admins) - Protected by RBAC
  app.post("/api/questions/bulk", requireAuth, requirePermission(permissions.QUESTIONS_CREATE), async (req: Request, res: Response) => {
    try {
      const { questions: questionsData } = req.body;

      if (!Array.isArray(questionsData) || questionsData.length === 0) {
        return res.status(400).json({ message: "Questions array is required" });
      }

      // Convert questions from the uploaded format to our schema format
      const convertedQuestions: any[] = questionsData.map((q: any) => ({
        category: "quantitative",
        subcategory: q.category || "عام",
        text: q.text,
        options: q.options,
        correctOptionIndex: q.correctOptionIndex,
        difficulty: "intermediate",
        explanation: q.explanation || "",
        topic: q.category || "general",
        dialect: "standard",
        keywords: [q.category || "general"],
        section: 1
      }));

      // Insert questions using storage
      const insertedQuestions = [];
      for (const question of convertedQuestions) {
        const inserted = await storage.createQuestion(question);
        insertedQuestions.push(inserted);
      }

      return res.json({
        success: true,
        count: insertedQuestions.length,
        questions: insertedQuestions
      });
    } catch (error) {
      console.error("Error bulk inserting questions:", error);
      return res.status(500).json({ message: "Error inserting questions", error: String(error) });
    }
  });

  // Custom exam creation removed

  // Save test result - نظام النقاط الموحد: +10 صح، -1 خطأ، -0.5 متروك - Protected by RBAC
  app.post("/api/test-results", requireAuth, async (req: Request, res: Response) => {
    try {
      const { userId, testType, difficulty, score, totalQuestions, timeTaken, skippedQuestions, questionIds } = req.body;
      const sessionUserId = (req as any).session?.userId;

      if (!userId || !testType || !difficulty || score === undefined || !totalQuestions) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // نظام النقاط الموحد: +10 صح، -1 خطأ، -0.5 متروك (يمكن أن تكون سالبة)
      const correctAnswers = score;
      const skipped = skippedQuestions || 0;
      const wrongAnswers = totalQuestions - score - skipped;

      const correctPoints = correctAnswers * 10;
      const wrongPenalty = wrongAnswers * 1;
      const skippedPenalty = skipped * 0.5;

      // إزالة Math.max للسماح بالنقاط السالبة
      const totalPoints = correctPoints - wrongPenalty - skippedPenalty;

      const percentage = (score / totalQuestions) * 100;

      const result = await storage.createTestResult({
        userId,
        testType,
        difficulty,
        score,
        totalQuestions,
        pointsEarned: totalPoints
      });

      // تسجيل الأسئلة المشاهدة لمنع التكرار في الاختبارات القادمة
      if (questionIds?.length && sessionUserId) {
        try {
          await mongoStorage.markQuestionsAsSeen(String(sessionUserId), questionIds.map(String));
        } catch {}
      }

      // تحديث نقاط المستخدم
      try {
        const users = JSON.parse(fs.readFileSync("attached_assets/user.json", "utf-8"));
        const userIndex = users.findIndex((u: any) => u.id === userId);

        if (userIndex !== -1) {
          users[userIndex].points = (users[userIndex].points || 0) + totalPoints;

          // تحديث المستوى بناءً على النقاط
          const points = users[userIndex].points;
          if (points >= 10000) users[userIndex].level = 5;
          else if (points >= 6000) users[userIndex].level = 4;
          else if (points >= 3000) users[userIndex].level = 3;
          else if (points >= 1000) users[userIndex].level = 2;
          else users[userIndex].level = 1;

          fs.writeFileSync("attached_assets/user.json", JSON.stringify(users, null, 2));
        }
      } catch (error) {
        console.error("Error updating user points:", error);
      }

      // تحديث لوحة المتصدرين
      try {
        await storage.updateLeaderboardEntry(userId, totalPoints);
      } catch (error) {
        console.error("Error updating leaderboard:", error);
      }

      // التحقق من الشارات
      try {
        const badges = await storage.checkAndAwardBadges(userId, {
          percentage,
          score,
          totalQuestions,
          testType,
          difficulty,
          timeTaken
        } as any);

        return res.status(201).json({
          ...result,
          pointsEarned: totalPoints,
          badges
        });
      } catch (error) {
        console.error("Error checking badges:", error);
        return res.status(201).json({
          ...result,
          pointsEarned: totalPoints
        });
      }
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

  // Get detailed points history for a user
  app.get("/api/points-history/:userId", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const results = await storage.getTestResultsByUser(parseInt(userId));

      // حساب الإحصائيات
      const totalTests = results.length;
      const totalPoints = results.reduce((sum, r) => sum + r.pointsEarned, 0);
      const averagePoints = totalTests > 0 ? totalPoints / totalTests : 0;
      const highestPoints = Math.max(...results.map(r => r.pointsEarned), 0);
      const lowestPoints = Math.min(...results.map(r => r.pointsEarned), 0);

      // تجميع النقاط حسب نوع الاختبار
      const pointsByType: { [key: string]: { total: number; count: number; tests: any[] } } = {};
      results.forEach(result => {
        if (!pointsByType[result.testType]) {
          pointsByType[result.testType] = { total: 0, count: 0, tests: [] };
        }
        pointsByType[result.testType].total += result.pointsEarned;
        pointsByType[result.testType].count += 1;
        pointsByType[result.testType].tests.push({
          id: result.id,
          points: result.pointsEarned,
          score: result.score,
          totalQuestions: result.totalQuestions,
          percentage: (result.score / result.totalQuestions) * 100,
          completedAt: result.completedAt,
          difficulty: result.difficulty
        });
      });

      // ترتيب الاختبارات حسب التاريخ (الأحدث أولاً)
      Object.keys(pointsByType).forEach(type => {
        pointsByType[type].tests.sort((a, b) =>
          new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
        );
      });

      // الاختبارات الأخيرة (آخر 10)
      const recentTests = results
        .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
        .slice(0, 10)
        .map(r => ({
          id: r.id,
          testType: r.testType,
          difficulty: r.difficulty,
          points: r.pointsEarned,
          score: r.score,
          totalQuestions: r.totalQuestions,
          percentage: (r.score / r.totalQuestions) * 100,
          completedAt: r.completedAt
        }));

      // اختبارات بنقاط موجبة فقط
      const positivePointsTests = results
        .filter(r => r.pointsEarned > 0)
        .sort((a, b) => b.pointsEarned - a.pointsEarned);

      return res.json({
        statistics: {
          totalTests,
          totalPoints,
          averagePoints: Math.round(averagePoints * 10) / 10,
          highestPoints,
          lowestPoints,
          positiveTestsCount: positivePointsTests.length,
          negativeTestsCount: results.filter(r => r.pointsEarned < 0).length,
          zeroPointsTestsCount: results.filter(r => r.pointsEarned === 0).length
        },
        pointsByType,
        recentTests,
        topPerformances: positivePointsTests.slice(0, 5).map(r => ({
          id: r.id,
          testType: r.testType,
          difficulty: r.difficulty,
          points: r.pointsEarned,
          score: r.score,
          totalQuestions: r.totalQuestions,
          percentage: (r.score / r.totalQuestions) * 100,
          completedAt: r.completedAt
        }))
      });
    } catch (error) {
      console.error("Error fetching points history:", error);
      return res.status(500).json({ message: "Error fetching points history" });
    }
  });

  // Mark questions as seen (called from free tests / any test without full submission)
  app.post("/api/test-results/mark-seen", requireAuth, async (req: Request, res: Response) => {
    try {
      const sessionUserId = (req as any).session?.userId;
      const { questionIds } = req.body;
      if (questionIds?.length && sessionUserId) {
        await mongoStorage.markQuestionsAsSeen(String(sessionUserId), questionIds.map(String));
      }
      res.json({ success: true });
    } catch (err: any) {
      res.json({ success: false });
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

      // نظام النقاط الموحد: +10 صح، -1 خطأ، -0.5 متروك
      const correctPoints = (correctAnswers || 0) * 10;
      const wrongPenalty = (wrongAnswers || 0) * 1;
      const skippedPenalty = (skippedQuestions || 0) * 0.5;
      const calculatedPoints = Math.max(0, correctPoints - wrongPenalty - skippedPenalty);

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
        pointsEarned: calculatedPoints, // استخدام النظام الموحد
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

        // تحديث نقاط المستخدم والتصنيف
        try {
          const users = JSON.parse(fs.readFileSync("attached_assets/user.json", "utf-8"));
          const userIndex = users.findIndex((u: any) => u.id === userId);

          if (userIndex !== -1) {
            users[userIndex].points = (users[userIndex].points || 0) + calculatedPoints;
            fs.writeFileSync("attached_assets/user.json", JSON.stringify(users, null, 2));
          }
        } catch (error) {
          console.error("Error updating user points:", error);
        }

        // تحديث لوحة المتصدرين
        try {
          await storage.updateLeaderboardEntry(userId, calculatedPoints);
        } catch (error) {
          console.error("Error updating leaderboard:", error);
        }

        res.status(201).json({
          success: true,
          message: "Advanced test result saved successfully",
          result: advancedResult,
          pointsEarned: calculatedPoints
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
      const { email, identifier, password } = req.body;
      const loginId = (identifier || email || '').trim();

      if (!loginId || !password) {
        return res.status(400).json({ message: "يرجى إدخال بيانات تسجيل الدخول وكلمة المرور" });
      }

      const normalizedId = loginId.toLowerCase();

      // أولاً: تحقق من الأدمن (بالبريد أو اسم المستخدم)
      try {
        const { Admin } = await import('./mongodb/models');
        const adminDoc = await Admin.findOne({
          $or: [
            { email: normalizedId },
            { username: normalizedId },
            { username: loginId }
          ]
        });
        if (adminDoc) {
          const adminPasswordValid = await bcrypt.compare(password, adminDoc.password);
          if (!adminPasswordValid) {
            return res.status(401).json({ message: "بيانات تسجيل الدخول غير صحيحة" });
          }
          if (!adminDoc.isActive) {
            return res.status(403).json({ message: "هذا الحساب معطل" });
          }
          (req.session as any).isAdmin = true;
          (req.session as any).adminId = String(adminDoc._id);
          (req.session as any).admin = {
            adminId: String(adminDoc._id),
            username: adminDoc.username,
            fullName: adminDoc.fullName,
            role: adminDoc.role,
            permissions: adminDoc.permissions || ['all'],
          };
          return new Promise<void>((resolve) => {
            req.session.save((err) => {
              if (err) {
                res.status(500).json({ message: 'خطأ في حفظ الجلسة' });
              } else {
                res.json({ isAdmin: true, admin: { username: adminDoc.username, fullName: adminDoc.fullName, role: adminDoc.role } });
              }
              resolve();
            });
          });
        }
      } catch (_) {}

      // قراءة ملف المستخدمين
      let users = [];
      try {
        const usersData = fs.readFileSync("attached_assets/user.json", "utf-8");
        users = JSON.parse(usersData);
      } catch (error) {
        console.error("Error reading users file:", error);
        return res.status(500).json({ message: "خطأ في قراءة ملف المستخدمين" });
      }

      // البحث عن المستخدم بالبريد أو اسم المستخدم أو رقم الجوال
      const user = users.find((u: any) => {
        if (!u) return false;
        const emailMatch = u.email && u.email.trim().toLowerCase() === normalizedId;
        const usernameMatch = u.username && u.username.trim().toLowerCase() === normalizedId;
        const nameMatch = u.name && u.name.trim().toLowerCase() === normalizedId;
        const phoneMatch = u.phone && (u.phone.replace(/\s/g, '') === loginId.replace(/\s/g, '') || u.phone.replace(/\s/g, '') === loginId.replace(/\s/g, '').replace(/^05/, '9665').replace(/^5/, '9665'));
        return emailMatch || usernameMatch || nameMatch || phoneMatch;
      });

      if (!user) {
        // Fallback: check MongoDB for users registered via Telegram or other paths
        try {
          const { User: MongoUser } = await import('./mongodb/models');
          const mongoUser = await MongoUser.findOne({
            $or: [
              { email: normalizedId },
              { username: normalizedId },
              { username: loginId },
              { phone: loginId },
              { phone: `966${loginId.replace(/^0/, '')}` },
            ]
          });
          if (mongoUser) {
            const isValid = mongoUser.password && mongoUser.password.startsWith('$2')
              ? await bcrypt.compare(password, mongoUser.password)
              : mongoUser.password === password;

            if (!isValid) {
              return res.status(401).json({ message: "البريد الإلكتروني أو كلمة المرور غير صحيحة" });
            }

            const mongoNormalized = {
              id: String(mongoUser._id),
              name: mongoUser.fullName || mongoUser.username,
              fullName: mongoUser.fullName || mongoUser.username,
              username: mongoUser.username,
              email: mongoUser.email || normalizedId,
              phone: mongoUser.phone,
              role: mongoUser.role || 'student',
              points: mongoUser.points || 0,
              level: mongoUser.level || 1,
              subscription: mongoUser.subscription || { type: 'free', status: 'active' },
              avatar: mongoUser.avatar,
              city: mongoUser.city,
            };

            // ── 2FA check ──
            if (mongoUser.twoFactorEnabled && (mongoUser.twoFactorMethods || []).length > 0) {
              (req.session as any).pending2FA = { userId: String(mongoUser._id) };
              return new Promise<void>((resolve) => {
                req.session.save((err) => {
                  if (err) { res.status(500).json({ message: "خطأ في حفظ الجلسة" }); }
                  else { res.json({ require2FA: true, methods: mongoUser.twoFactorMethods }); }
                  resolve();
                });
              });
            }

            (req.session as any).userId = mongoNormalized.id;
            (req.session as any).userEmail = mongoNormalized.email;
            (req.session as any).userRole = mongoNormalized.role;

            return new Promise<void>((resolve) => {
              req.session.save((err) => {
                if (err) {
                  res.status(500).json({ message: "خطأ في حفظ الجلسة" });
                } else {
                  res.json(mongoNormalized);
                }
                resolve();
              });
            });
          }
        } catch (mongoFallbackErr) {
          console.error('MongoDB login fallback error:', mongoFallbackErr);
        }
        return res.status(401).json({ message: "بيانات تسجيل الدخول غير صحيحة. تحقق من البريد أو اسم المستخدم أو رقم الجوال" });
      }

      // التحقق من كلمة المرور (دعم bcrypt للمستخدمين الجدد والنص العادي للقدامى)
      let isPasswordValid = false;

      // التحقق مما إذا كانت كلمة المرور مشفرة (bcrypt hashes تبدأ بـ $2)
      if (user.password && user.password.startsWith('$2')) {
        // كلمة مرور مشفرة - استخدام bcrypt للمقارنة
        isPasswordValid = await bcrypt.compare(password, user.password);
      } else {
        // كلمة مرور نص عادي (للمستخدمين القدامى)
        isPasswordValid = user.password === password;
      }

      if (!isPasswordValid) {
        return res.status(401).json({ message: "البريد الإلكتروني أو كلمة المرور غير صحيحة" });
      }

      // التحقق من حالة الاشتراك
      const today = new Date();
      let shouldUpdateUser = false;

      if (user.subscription) {
        // التحقق من انتهاء الاشتراك لجميع الباقات المدفوعة
        if (user.subscription.type !== 'free' && user.subscription.endDate) {
          const endDate = new Date(user.subscription.endDate);

          if (endDate < today) {
            // تحويل الاشتراك المنتهي إلى مجاني مع الاحتفاظ بمعلومات الاشتراك السابق
            user.previousSubscription = { ...user.subscription };
            user.subscription.type = "free";
            user.subscription.status = "expired";
            user.subscription.startDate = today.toISOString().split('T')[0];
            user.subscription.endDate = new Date(today.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // Free for 1 year
            shouldUpdateUser = true;
          }
        }
      } else {
        // إضافة اشتراك مجاني إذا لم يكن موجوداً
        user.subscription = {
          type: "free",
          status: "active",
          startDate: today.toISOString().split('T')[0],
          endDate: new Date(today.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
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

      // إضافة المستخدم للتصنيف إذا لم يكن موجوداً (للمستخدمين القدامى)
      try {
        const userRank = await storage.getUserRank(user.id);
        if (!userRank) {
          // استخدام نقاط المستخدم الحقيقية من user.points بدلاً من 0
          const userPoints = user.points ?? 0;
          await storage.updateLeaderboardEntry(user.id, userPoints, user.name || user.username);
          console.log(`تمت إضافة المستخدم ${user.name || user.username} للتصنيف بـ ${userPoints} نقطة`);
        }
      } catch (error) {
        console.error("Error adding user to leaderboard on login:", error);
      }

      // Set user session with role information
      (req.session as any).userId = user.id;
      (req.session as any).userEmail = user.email;
      (req.session as any).userRole = user.role || 'student'; // الافتراضي للمستخدمين القدامى

      // Save session and wait for it to complete
      req.session.save((err) => {
        if (err) {
          console.error('Session save error:', err);
          return res.status(500).json({ message: "خطأ في حفظ الجلسة" });
        }

        console.log('User session saved:', user.id, user.email, user.role || 'student');

        // إرجاع بيانات المستخدم مع الدور (الافتراضي طالب للقدامى)
        const responseUser = {
          ...user,
          role: user.role || 'student'
        };
        // إزالة كلمة المرور من الاستجابة
        delete responseUser.password;
        return res.json(responseUser);
      });
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

    // Log the request
    console.log(`Account info request for email: ${email}`);

    res.status(200).json({
      message: "إذا كان هذا البريد الإلكتروني مسجلاً، يرجى التواصل مع فريق الدعم لاسترداد حسابك"
    });
  } catch (error) {
    console.error("Error in account recovery:", error);
    res.status(500).json({ message: "حدث خطأ في عملية الاسترداد" });
  }
});

// MongoDB-backed OTP store helpers (replaces in-memory Map)
async function saveSignupOTP(email: string, otp: string, fullName: string, phone?: string) {
  const { PendingOTP } = await import('./mongodb/models');
  await PendingOTP.findOneAndUpdate(
    { email: email.trim().toLowerCase() },
    { email: email.trim().toLowerCase(), otp, fullName, phone, expiry: new Date(Date.now() + 10 * 60 * 1000) },
    { upsert: true, new: true }
  );
}
async function getSignupOTP(email: string) {
  const { PendingOTP } = await import('./mongodb/models');
  return PendingOTP.findOne({ email: email.trim().toLowerCase() }).lean();
}
async function deleteSignupOTP(email: string) {
  const { PendingOTP } = await import('./mongodb/models');
  await PendingOTP.deleteOne({ email: email.trim().toLowerCase() });
}
const telegramLoginSessions = new Map<string, { telegramId: string; telegramUsername: string; firstName: string; lastName: string; fullName: string; chatId: number; createdAt: Date }>();

// In-memory store for phone OTPs (sent via Telegram bot)
const phoneOtpStore = new Map<string, { otp: string; expiry: Date; chatId?: number }>();

app.post('/api/auth/signup/send-otp', async (req: Request, res: Response) => {
  try {
    const { email, fullName, phone } = req.body;
    if (!email || !fullName) return res.status(400).json({ error: 'البريد الإلكتروني والاسم مطلوبان' });

    // Check email not already registered
    let users: any[] = [];
    try { users = JSON.parse(fs.readFileSync('attached_assets/user.json', 'utf-8')); } catch {}
    if (users.some((u: any) => u.email && u.email.trim().toLowerCase() === email.trim().toLowerCase())) {
      return res.status(400).json({ error: 'البريد الإلكتروني مستخدم مسبقاً' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await saveSignupOTP(email, otp, fullName, phone);

    const { sendOTPEmail } = await import('./services/emailService');
    const sent = await sendOTPEmail(email, fullName, otp);
    if (!sent) return res.status(500).json({ error: 'فشل في إرسال رمز التحقق. تأكد من صحة البريد الإلكتروني.' });

    res.json({ success: true, message: 'تم إرسال رمز التحقق إلى بريدك الإلكتروني' });
  } catch (error) {
    console.error('Signup OTP error:', error);
    res.status(500).json({ error: 'حدث خطأ. حاول مرة أخرى.' });
  }
});

app.post('/api/auth/signup/verify-otp', async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ error: 'البريد ورمز التحقق مطلوبان' });

    const record = await getSignupOTP(email);
    if (!record) return res.status(400).json({ error: 'لم يتم طلب رمز تحقق لهذا البريد. أرسل الرمز مجدداً.' });
    if (new Date() > new Date(record.expiry)) {
      await deleteSignupOTP(email);
      return res.status(400).json({ error: 'انتهت صلاحية الرمز. أعد الإرسال.' });
    }
    if (record.otp !== otp.toString().trim()) return res.status(400).json({ error: 'رمز التحقق غير صحيح' });

    await deleteSignupOTP(email);
    res.json({ success: true, message: 'تم التحقق من البريد الإلكتروني بنجاح' });
  } catch (error) {
    res.status(500).json({ error: 'حدث خطأ في التحقق' });
  }
});

// Check OTP validity WITHOUT deleting it — used by Telegram flow pre-verify step
// The actual deletion happens later in /api/auth/telegram-complete
app.post('/api/auth/signup/check-otp', async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ error: 'البريد ورمز التحقق مطلوبان' });

    const record = await getSignupOTP(email);
    if (!record) return res.status(400).json({ error: 'لم يتم طلب رمز تحقق لهذا البريد. أرسل الرمز مجدداً.' });
    if (new Date() > new Date(record.expiry)) {
      await deleteSignupOTP(email);
      return res.status(400).json({ error: 'انتهت صلاحية الرمز. أعد الإرسال.' });
    }
    if (record.otp !== otp.toString().trim()) return res.status(400).json({ error: 'رمز التحقق غير صحيح' });

    // Do NOT delete — just confirm validity
    res.json({ success: true, message: 'رمز التحقق صحيح' });
  } catch (error) {
    res.status(500).json({ error: 'حدث خطأ في التحقق' });
  }
});

// ── Phone OTP via Telegram bot ──────────────────────────────────────────────
// Request phone OTP: stores OTP keyed by phone, returns a bot deep link
app.post('/api/auth/signup/request-phone-otp', async (req: Request, res: Response) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: 'رقم الجوال مطلوب' });

    const cleanPhone = phone.toString().replace(/\D/g, '');
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 10 * 60 * 1000);
    phoneOtpStore.set(cleanPhone, { otp, expiry });

    const botUsername = process.env.TELEGRAM_BOT_USERNAME || 'qodrataksite_bot';
    const deepLink = `https://t.me/${botUsername}?start=otp_${cleanPhone}`;

    res.json({ success: true, deepLink, message: 'افتح الرابط وستصلك رسالة في تيليجرام تحتوي على رمز التحقق' });
  } catch (error) {
    console.error('request-phone-otp error:', error);
    res.status(500).json({ error: 'حدث خطأ' });
  }
});

// Telegram bot webhook — receives messages and sends phone OTP
app.post('/api/telegram/webhook', async (req: Request, res: Response) => {
  res.sendStatus(200);
  try {
    const update = req.body;
    if (!update?.message) return;
    const chatId: number = update.message.chat.id;
    const text: string = update.message.text || '';
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) return;

    const sendMsg = async (msg: string) => {
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: msg, parse_mode: 'HTML' })
      });
    };

    if (text.startsWith('/start otp_')) {
      const phone = text.replace('/start otp_', '').trim();
      const record = phoneOtpStore.get(phone);
      if (!record) {
        await sendMsg('⚠️ لا يوجد طلب تحقق لهذا الرقم أو انتهت صلاحيته. أعد المحاولة من الموقع.');
        return;
      }
      if (new Date() > record.expiry) {
        phoneOtpStore.delete(phone);
        await sendMsg('⏰ انتهت صلاحية رمز التحقق. أعد المحاولة من الموقع.');
        return;
      }
      phoneOtpStore.set(phone, { ...record, chatId });
      await sendMsg(`🔐 <b>رمز التحقق من منصة قدراتك:</b>\n\n<code>${record.otp}</code>\n\nأدخل هذا الرمز في الموقع. صالح 10 دقائق فقط.\n\n— منصة قدراتك`);
    } else if (text.startsWith('/start login_')) {
      // Telegram Bot-based login flow (no domain whitelisting needed)
      const sessionId = text.replace('/start login_', '').trim();
      if (!sessionId) return;
      const from = update.message.from;
      const telegramId = String(from.id);
      const telegramUsername = from.username || '';
      const firstName = from.first_name || '';
      const lastName = from.last_name || '';
      const fullName = [firstName, lastName].filter(Boolean).join(' ');
      // Store auth data for polling
      telegramLoginSessions.set(sessionId, {
        telegramId,
        telegramUsername,
        firstName,
        lastName,
        fullName,
        chatId,
        createdAt: new Date()
      });
      // Clean old sessions > 5 min
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
      telegramLoginSessions.forEach((v, k) => { if (v.createdAt < fiveMinAgo) telegramLoginSessions.delete(k); });
      await sendMsg(`✅ <b>تم التحقق من هويتك!</b>\n\nمرحباً ${firstName}، يمكنك العودة للموقع الآن لإتمام تسجيل الدخول.\n\n— منصة قدراتك 🎓`);
    } else if (text.startsWith('/start notify_')) {
      // Link Telegram for notifications
      const userId = text.replace('/start notify_', '').trim();
      if (!userId) { await sendMsg('❌ رابط غير صالح.'); return; }
      try {
        const { User } = await import('./mongodb/models');
        const telegramId = String(update.message.from?.id || chatId);
        const result = await User.findOneAndUpdate(
          { _id: userId },
          { telegramId, telegramChatId: chatId },
          { new: true }
        );
        if (result) {
          const name = result.fullName || result.username || 'الطالب';
          await sendMsg(`✅ <b>تم ربط حسابك بنجاح!</b>\n\nمرحباً ${name} 👋\n\nستصلك الآن إشعارات تيليجرام:\n📅 تذكير قبل ساعة من اختبارك\n📊 تقرير أسبوعي كل أحد\n\nيمكنك إدارة الإشعارات من إعدادات الإشعارات في قدراتك.\n\n— منصة قدراتك 🎓`);
        } else {
          await sendMsg('❌ لم يتم العثور على الحساب. تأكد من تسجيل الدخول في قدراتك أولاً.');
        }
      } catch (e) {
        await sendMsg('❌ حدث خطأ. حاول مرة أخرى.');
      }
    } else if (text === '/start') {
      await sendMsg('👋 أهلاً بك في بوت منصة قدراتك!\n\nللتحقق من رقم جوالك أو تسجيل الدخول، اضغط على الرابط من الموقع مباشرةً.');
    }
  } catch (err) {
    console.error('Telegram webhook error:', err);
  }
});

// ── NOTIFICATION PREFERENCES API ─────────────────────────────────────────────
app.get('/api/notifications/preferences', requireAuth, async (req: Request, res: Response) => {
  try {
    const { User } = await import('./mongodb/models');
    const mongoose = await import('mongoose');
    const sessionUserId = String((req as any).session?.userId || '');
    const sessionEmail = (req as any).session?.email || '';
    let user;
    if (mongoose.Types.ObjectId.isValid(sessionUserId) && sessionUserId.length === 24) {
      user = await User.findOne({ _id: sessionUserId });
    } else {
      user = await User.findOne({ $or: [{ email: sessionEmail }, { pgId: Number(sessionUserId) || 0 }] });
    }
    if (!user) return res.json({ telegramLinked: false, notifExamReminder: true, notifWeeklyReport: true });
    res.json({
      telegramLinked: !!(user.telegramChatId || user.telegramId),
      telegramId: user.telegramId || null,
      whatsappPhone: user.whatsappPhone || null,
      notifExamReminder: user.notifExamReminder !== false,
      notifWeeklyReport: user.notifWeeklyReport !== false,
    });
  } catch (err) {
    res.status(500).json({ error: 'فشل جلب الإعدادات' });
  }
});

app.patch('/api/notifications/preferences', requireAuth, async (req: Request, res: Response) => {
  try {
    const { User } = await import('./mongodb/models');
    const mongoose = await import('mongoose');
    const sessionUserId = String((req as any).session?.userId || '');
    const sessionEmail = (req as any).session?.email || '';
    const { notifExamReminder, notifWeeklyReport, whatsappPhone } = req.body;
    const update: any = {};
    if (typeof notifExamReminder === 'boolean') update.notifExamReminder = notifExamReminder;
    if (typeof notifWeeklyReport === 'boolean') update.notifWeeklyReport = notifWeeklyReport;
    if (typeof whatsappPhone === 'string') update.whatsappPhone = whatsappPhone;
    if (mongoose.Types.ObjectId.isValid(sessionUserId) && sessionUserId.length === 24) {
      await User.updateOne({ _id: sessionUserId }, update);
    } else {
      await User.updateOne({ $or: [{ email: sessionEmail }, { pgId: Number(sessionUserId) || 0 }] }, update);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'فشل تحديث الإعدادات' });
  }
});

app.post('/api/notifications/test', requireAuth, async (req: Request, res: Response) => {
  try {
    const { User } = await import('./mongodb/models');
    const user = await User.findOne({ _id: (req as any).session?.userId });
    if (!user) return res.status(404).json({ error: 'المستخدم غير موجود' });
    const chatId = user.telegramChatId || (user.telegramId ? Number(user.telegramId) : null);
    if (!chatId) return res.status(400).json({ error: 'لم يتم ربط تيليجرام بعد' });
    const { sendTelegramMessage } = await import('./services/notificationService');
    const msg = `🔔 <b>اختبار الإشعارات</b>\n\nمرحباً ${user.fullName || user.username}!\n\nالإشعارات تعمل بشكل صحيح ✅\n\nستصلك:\n📅 تذكير قبل ساعة من اختباراتك\n📊 تقرير أسبوعي كل أحد\n\n— منصة قدراتك 🎓`;
    const sent = await sendTelegramMessage(chatId, msg);
    if (sent) res.json({ success: true });
    else res.status(500).json({ error: 'فشل إرسال الرسالة' });
  } catch (err) {
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// ── Web Push Notification Routes ─────────────────────────────────────────────

// Return the VAPID public key (needed by the client to subscribe)
app.get('/api/push/vapid-key', (_req: Request, res: Response) => {
  const key = process.env.VAPID_PUBLIC_KEY || '';
  if (!key) return res.status(503).json({ error: 'Push not configured' });
  res.json({ publicKey: key });
});

// Save a push subscription for the logged-in user
app.post('/api/push/subscribe', async (req: Request, res: Response) => {
  try {
    const { PushSubscription } = await import('./mongodb/models');
    const userId = String((req as any).session?.userId || 'anonymous');
    const { endpoint, keys } = req.body;
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return res.status(400).json({ error: 'بيانات الاشتراك غير مكتملة' });
    }
    await PushSubscription.findOneAndUpdate(
      { endpoint },
      { userId, endpoint, keys },
      { upsert: true, new: true }
    );
    res.json({ success: true });
  } catch (err) {
    console.error('push subscribe error:', err);
    res.status(500).json({ error: 'فشل حفظ الاشتراك' });
  }
});

// Remove a push subscription (user unsubscribed)
app.delete('/api/push/unsubscribe', async (req: Request, res: Response) => {
  try {
    const { PushSubscription } = await import('./mongodb/models');
    const userId = String((req as any).session?.userId || '');
    const { endpoint } = req.body;
    if (endpoint) {
      await PushSubscription.deleteOne({ endpoint });
    } else if (userId) {
      await PushSubscription.deleteMany({ userId });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'فشل إلغاء الاشتراك' });
  }
});

// Send a test push notification
app.post('/api/push/test', async (req: Request, res: Response) => {
  try {
    const sessionUserId = (req as any).session?.userId;
    if (!sessionUserId) return res.status(401).json({ error: 'يجب تسجيل الدخول' });
    const userId = String(sessionUserId);
    const { sendPushToUser } = await import('./services/pushService');
    const { type = 'general' } = req.body;

    const payloads: Record<string, any> = {
      general: {
        title: '🔔 اختبار الإشعارات',
        body: 'الإشعارات تعمل بشكل صحيح على جهازك! ✅',
        url: '/',
        tag: 'test',
      },
      exam: {
        title: '⏰ اختبارك بعد ساعة!',
        body: 'هذا مثال على تذكير الاختبار — سيصلك تلقائياً قبل موعدك',
        url: '/book-exam',
        tag: 'test-exam',
      },
      study: {
        title: '☀️ صباح الخير!',
        body: 'ابدأ يومك بـ 10 أسئلة من بنك الأسئلة 💪',
        url: '/question-bank',
        tag: 'test-study',
      },
      goal: {
        title: '⏰ هدفك اليومي لم يكتمل!',
        body: 'تبقى لك بعض الأسئلة لإكمال هدفك اليومي',
        url: '/question-bank',
        tag: 'test-goal',
      },
      achievement: {
        title: '🏆 إنجاز جديد!',
        body: 'حصلت على إنجاز: محلل الأخطاء 🎉',
        url: '/profile',
        tag: 'test-achievement',
      },
    };

    const payload = payloads[type] || payloads.general;
    const sent = await sendPushToUser(userId, payload);
    if (sent > 0) {
      res.json({ success: true, sent });
    } else {
      res.status(400).json({ error: 'لا توجد اشتراكات نشطة لهذا الجهاز' });
    }
  } catch (err) {
    console.error('push test error:', err);
    res.status(500).json({ error: 'خطأ في إرسال الإشعار' });
  }
});

// Verify phone OTP
app.post('/api/auth/signup/verify-phone-otp', async (req: Request, res: Response) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) return res.status(400).json({ error: 'رقم الجوال والرمز مطلوبان' });

    const cleanPhone = phone.toString().replace(/\D/g, '');
    const record = phoneOtpStore.get(cleanPhone);
    if (!record) return res.status(400).json({ error: 'لم يتم طلب رمز لهذا الرقم أو انتهت صلاحيته' });
    if (new Date() > record.expiry) { phoneOtpStore.delete(cleanPhone); return res.status(400).json({ error: 'انتهت صلاحية الرمز. أعد المحاولة.' }); }
    if (record.otp !== otp.toString().trim()) return res.status(400).json({ error: 'رمز التحقق غير صحيح' });

    phoneOtpStore.delete(cleanPhone);
    res.json({ success: true, message: 'تم التحقق من رقم الجوال بنجاح' });
  } catch (error) {
    res.status(500).json({ error: 'حدث خطأ في التحقق' });
  }
});

app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const { name, fullName, email, password, phone } = req.body;
      const displayName = fullName || name;

      if (!displayName || !email || !password) {
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

      const normalizedRegEmail = email.trim().toLowerCase();

      if (users.some((u: any) => u.email && u.email.trim().toLowerCase() === normalizedRegEmail)) {
        return res.status(400).json({ message: "البريد الإلكتروني مستخدم من قبل" });
      }

      const today = new Date();

      const newUser = {
        id: users.length + 1,
        name: displayName,
        email: normalizedRegEmail,
        phone: phone || '',
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

      // إضافة المستخدم تلقائياً للتصنيف مع 0 نقطة
      try {
        await storage.updateLeaderboardEntry(newUser.id, 0, newUser.name);
        console.log(`تمت إضافة المستخدم ${newUser.name} للتصنيف`);
      } catch (error) {
        console.error("Error adding user to leaderboard:", error);
      }

      // Set user session for the new user
      (req.session as any).userId = newUser.id;
      (req.session as any).userEmail = newUser.email;

      // Save session and wait for it to complete
      req.session.save((err) => {
        if (err) {
          console.error('Session save error:', err);
          return res.status(500).json({ message: "خطأ في حفظ الجلسة" });
        }

        console.log('New user session saved:', newUser.id, newUser.email);

        // Return user after session is saved
        return res.status(201).json(newUser);
      });
    } catch (error) {
      console.error("Error creating user:", error);
      return res.status(500).json({ message: "Error creating user" });
    }
  });

  // Multi-role registration endpoint (Students: 7-day trial, Teachers: free forever)
  // NOTE: Institutions must use /api/auth/institution-request instead
  app.post("/api/auth/register-multi", async (req: Request, res: Response) => {
    try {
      const { fullName, email, phone, password, role, whatsapp, telegramUsername, academicTrack, gradeLevel, studyGoal, targetScore } = req.body;

      // Validate required fields
      if (!fullName || !email || !password || !role) {
        return res.status(400).json({ message: "يرجى إدخال جميع البيانات المطلوبة" });
      }

      // Validate password length
      if (password.length < 6) {
        return res.status(400).json({ message: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" });
      }

      // Only allow student and teacher registration directly
      // Institutions must submit a request through /api/auth/institution-request
      if (role === 'institution_admin') {
        return res.status(400).json({ 
          message: "لا يمكن التسجيل كمؤسسة مباشرة. يرجى إرسال طلب تسجيل مؤسسة",
          redirectTo: "/signup?type=institution"
        });
      }

      const validRoles = ['student', 'teacher'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ message: "نوع الحساب غير صالح" });
      }

      // Read existing users
      let users = [];
      try {
        const data = fs.readFileSync("attached_assets/user.json", "utf-8");
        users = JSON.parse(data);
      } catch (error) {
        fs.writeFileSync("attached_assets/user.json", "[]");
      }

      // Check if email already exists
      if (users.some((u: any) => u.email === email)) {
        return res.status(400).json({ message: "البريد الإلكتروني مستخدم من قبل" });
      }

      // Hash password for security
      const hashedPassword = await bcrypt.hash(password, 10);

      const today = new Date();
      const newUserId = users.length + 1;

      // Set subscription based on role
      let subscription;
      if (role === 'student') {
        // Students: 7-day free trial as advertised
        const trialEnd = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
        subscription = {
          type: "free_trial",
          status: "active",
          startDate: today.toISOString().split('T')[0],
          endDate: trialEnd.toISOString().split('T')[0],
          trialDays: 7,
        };
      } else if (role === 'teacher') {
        // Teachers: free forever
        const farFuture = new Date(today.getTime() + 100 * 365 * 24 * 60 * 60 * 1000); // 100 years
        subscription = {
          type: "teacher_free",
          status: "active",
          startDate: today.toISOString().split('T')[0],
          endDate: farFuture.toISOString().split('T')[0],
          isPermanent: true
        };
      }

      // Create user object based on role
      const newUser: any = {
        id: newUserId,
        name: fullName,
        fullName,
        email,
        phone: phone || undefined,
        whatsapp: whatsapp || undefined,
        telegramUsername: telegramUsername || undefined,
        password: hashedPassword,
        role,
        subscription,
        ...(role === 'student' && {
          academicTrack: academicTrack || undefined,
          gradeLevel: gradeLevel || undefined,
          studyGoal: studyGoal || undefined,
          targetScore: targetScore ? Number(targetScore) : undefined,
        }),
        points: 100,
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
        savedQuestions: [],
        createdAt: today.toISOString()
      };

      users.push(newUser);
      fs.writeFileSync("attached_assets/user.json", JSON.stringify(users, null, 2));

      console.log(`New ${role} account created: ${fullName} (${email}) - ${role === 'student' ? '7-day trial' : 'free forever'}`);

      // Sync to MongoDB so WebAuthn and Telegram flows can find the user
      try {
        const { User: MongoUser } = await import('./mongodb/models');
        const exists = await MongoUser.findOne({ email });
        if (!exists) {
          await MongoUser.create({
            username: email,
            password: hashedPassword,
            email,
            phone: phone || undefined,
            fullName,
            role,
            points: 100,
            level: 1,
            subscription,
          });
        }
      } catch (mongoSyncErr) {
        console.error('MongoDB sync on register error (non-fatal):', mongoSyncErr);
      }

      // Add to leaderboard
      try {
        await storage.updateLeaderboardEntry(newUser.id, 0, newUser.name);
      } catch (error) {
        console.error("Error adding user to leaderboard:", error);
      }

      // Set user session
      (req.session as any).userId = newUser.id;
      (req.session as any).userEmail = newUser.email;
      (req.session as any).userRole = newUser.role;

      req.session.save((err) => {
        if (err) {
          console.error('Session save error:', err);
          return res.status(500).json({ message: "خطأ في حفظ الجلسة" });
        }

        // Return user without password
        const { password: _, ...userWithoutPassword } = newUser;
        return res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      console.error("Error in multi-role registration:", error);
      return res.status(500).json({ message: "حدث خطأ في التسجيل" });
    }
  });

  // Institution Request endpoint - Submit a request for admin approval
  app.post("/api/auth/institution-request", async (req: Request, res: Response) => {
    try {
      const { 
        institutionName, responsibleName, phone, email, whatsapp, 
        city, country, institutionType, studentsCount, notes 
      } = req.body;

      // Validate required fields
      if (!institutionName || !responsibleName || !phone || !email || !whatsapp || !city || !institutionType) {
        return res.status(400).json({ message: "يرجى إدخال جميع البيانات المطلوبة" });
      }

      // Check if email already has a pending request
      const existingRequests = await mongoStorage.getInstitutionRequests();
      const pendingRequest = existingRequests.find(
        (r: any) => r.email === email && r.status === 'pending'
      );

      if (pendingRequest) {
        return res.status(400).json({ 
          message: "يوجد طلب معلق بالفعل لهذا البريد الإلكتروني. سيتم التواصل معكم قريباً" 
        });
      }

      // Create institution request in MongoDB
      const institutionRequest = await mongoStorage.createInstitutionRequest({
        institutionName,
        responsibleName,
        phone,
        email,
        whatsapp,
        city,
        country: country || 'المملكة العربية السعودية',
        institutionType,
        studentsCount,
        notes,
        status: 'pending'
      });

      console.log(`New institution request submitted: ${institutionName} by ${responsibleName} (${email})`);

      // إرسال إشعار للأدمن
      notifyAdminInstitutionRequest(institutionName, responsibleName, email, phone).catch(() => {});

      return res.status(201).json({
        success: true,
        message: "تم إرسال طلبكم بنجاح. سيتم مراجعته والتواصل معكم خلال 24-48 ساعة",
        requestId: institutionRequest._id
      });
    } catch (error) {
      console.error("Error submitting institution request:", error);
      return res.status(500).json({ message: "حدث خطأ في إرسال الطلب" });
    }
  });

  // Get institution requests (Admin only)
  app.get("/api/admin/institution-requests", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { status } = req.query;
      const requests = await mongoStorage.getInstitutionRequests(status as string);
      return res.json(requests);
    } catch (error) {
      console.error("Error fetching institution requests:", error);
      return res.status(500).json({ message: "خطأ في جلب الطلبات" });
    }
  });

  // Approve institution request (Admin only)
  app.post("/api/admin/institution-requests/:id/approve", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { password } = req.body; // Admin can set initial password
      const adminId = (req as any).admin._id.toString();

      const request = await mongoStorage.getInstitutionRequestById(id);
      if (!request) {
        return res.status(404).json({ message: "الطلب غير موجود" });
      }

      if (request.status !== 'pending') {
        return res.status(400).json({ message: "هذا الطلب تمت معالجته مسبقاً" });
      }

      // Create institution admin user
      const hashedPassword = await bcrypt.hash(password || 'Institution123', 10);
      const today = new Date();

      let users = [];
      try {
        const data = fs.readFileSync("attached_assets/user.json", "utf-8");
        users = JSON.parse(data);
      } catch (error) {
        users = [];
      }

      const newUser = {
        id: users.length + 1,
        name: request.responsibleName,
        fullName: request.responsibleName,
        email: request.email,
        phone: request.phone,
        password: hashedPassword,
        role: 'institution_admin',
        institution: {
          id: Date.now(),
          name: request.institutionName,
          type: request.institutionType,
          city: request.city,
          country: request.country,
          createdAt: today.toISOString()
        },
        subscription: {
          type: "institution",
          status: "active",
          startDate: today.toISOString().split('T')[0],
          endDate: new Date(today.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        },
        points: 0,
        level: 1,
        createdAt: today.toISOString()
      };

      users.push(newUser);
      fs.writeFileSync("attached_assets/user.json", JSON.stringify(users, null, 2));

      // Update request status
      await mongoStorage.approveInstitutionRequest(id, adminId);

      console.log(`Institution request approved: ${request.institutionName} - User created: ${request.email}`);

      return res.json({
        success: true,
        message: "تمت الموافقة على الطلب وإنشاء حساب المؤسسة",
        user: { email: request.email, name: request.responsibleName }
      });
    } catch (error) {
      console.error("Error approving institution request:", error);
      return res.status(500).json({ message: "خطأ في الموافقة على الطلب" });
    }
  });

  // Reject institution request (Admin only)
  app.post("/api/admin/institution-requests/:id/reject", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const adminId = (req as any).admin._id.toString();

      const request = await mongoStorage.getInstitutionRequestById(id);
      if (!request) {
        return res.status(404).json({ message: "الطلب غير موجود" });
      }

      if (request.status !== 'pending') {
        return res.status(400).json({ message: "هذا الطلب تمت معالجته مسبقاً" });
      }

      await mongoStorage.rejectInstitutionRequest(id, adminId, reason || 'لم يتم تحديد السبب');

      console.log(`Institution request rejected: ${request.institutionName}`);

      return res.json({
        success: true,
        message: "تم رفض الطلب"
      });
    } catch (error) {
      console.error("Error rejecting institution request:", error);
      return res.status(500).json({ message: "خطأ في رفض الطلب" });
    }
  });

  // Free account signup with Telegram verification
  app.post("/api/auth/signup-free", async (req: Request, res: Response) => {
    try {
      const { username, email, password } = req.body;

      if (!username || !email || !password) {
        return res.status(400).json({ message: "يرجى إدخال جميع البيانات المطلوبة" });
      }

      // Validate password (6+ digits only)
      if (password.length < 6 || !/^\d+$/.test(password)) {
        return res.status(400).json({ message: "كلمة المرور يجب أن تحتوي على 6 أرقام على الأقل" });
      }

      // Read existing users and pending registrations
      let users = [];
      let pendingUsers = [];

      try {
        const userData = fs.readFileSync("attached_assets/user.json", "utf-8");
        users = JSON.parse(userData);
      } catch (error) {
        users = [];
      }

      try {
        const pendingData = fs.readFileSync("attached_assets/pending_users.json", "utf-8");
        pendingUsers = JSON.parse(pendingData);
      } catch (error) {
        pendingUsers = [];
      }

      // Check if email already exists
      if (users.some((u: any) => u.email === email) || pendingUsers.some((u: any) => u.email === email)) {
        return res.status(400).json({ message: "البريد الإلكتروني مستخدم من قبل" });
      }

      const today = new Date();
      const trialEndDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days trial

      // Create pending user record
      const pendingUser = {
        id: Date.now(),
        username,
        email,
        password,
        status: "pending_verification",
        requestedAt: today.toISOString(),
        expiresAt: new Date(today.getTime() + 48 * 60 * 60 * 1000).toISOString(), // 48h to confirm
        trialDuration: 7,
        trialEndDate: trialEndDate.toISOString(),
        subscription: {
          type: "free_trial",
          startDate: today.toISOString().split('T')[0],
          endDate: trialEndDate.toISOString().split('T')[0],
          verified: false
        }
      };

      // Add to pending users
      pendingUsers.push(pendingUser);

      // Ensure directory exists
      const filePath = "attached_assets/pending_users.json";
      fs.writeFileSync(filePath, JSON.stringify(pendingUsers, null, 2));

      // Log the registration request
      console.log(`New free account signup request: ${username} (${email})`);

      res.status(200).json({
        success: true,
        message: "تم إرسال طلبك للمراجعة. سيتم التواصل معك عبر البريد الإلكتروني خلال 24 ساعة",
        pendingId: pendingUser.id
      });

    } catch (error) {
      console.error("Error in free signup:", error);
      res.status(500).json({ message: "حدث خطأ أثناء إرسال الطلب" });
    }
  });

  // Approve/Reject pending account
  app.post("/api/auth/approve-account", async (req: Request, res: Response) => {
    try {
      const { pendingId, action, adminKey } = req.body; // adminKey for security

      if (!pendingId || !action) {
        return res.status(400).json({ message: "بيانات غير مكتملة" });
      }

      // Read pending users
      let pendingUsers = [];
      try {
        const pendingData = fs.readFileSync("attached_assets/pending_users.json", "utf-8");
        pendingUsers = JSON.parse(pendingData);
      } catch (error) {
        return res.status(404).json({ message: "لا توجد طلبات معلقة" });
      }

      const pendingUserIndex = pendingUsers.findIndex((u: any) => u.id.toString() === pendingId.toString());

      if (pendingUserIndex === -1) {
        return res.status(404).json({ message: "الطلب غير موجود" });
      }

      const pendingUser = pendingUsers[pendingUserIndex];

      if (action === "APPROVE") {
        // Create the user account
        let users = [];
        try {
          const userData = fs.readFileSync("attached_assets/user.json", "utf-8");
          users = JSON.parse(userData);
        } catch (error) {
          users = [];
        }

        const now = new Date();
        const trialEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        const newUser = {
          id: users.length + 1,
          name: pendingUser.username,
          username: pendingUser.username,
          email: pendingUser.email,
          password: pendingUser.password,
          subscription: {
            type: "free_trial",
            startDate: now.toISOString().split('T')[0],
            endDate: trialEnd.toISOString().split('T')[0],
            verified: true,
            createdViaRequest: true
          },
          points: 150, // إضافية للحساب المطلوب
          level: 1,
          testsTaken: 0,
          averageScore: 0,
          folders: [],
          achievements: [],
          pointsHistory: [{
            points: 150,
            reason: "مكافأة الحساب المجاني المطلوب",
            date: now.toISOString()
          }],
          testHistory: [],
          savedQuestions: [],
          freeTrialData: {
            startDate: now.toISOString(),
            endDate: trialEnd.toISOString(),
            daysRemaining: 7,
            isActive: true,
            requestApprovedAt: now.toISOString()
          }
        };

        users.push(newUser);
        fs.writeFileSync("attached_assets/user.json", JSON.stringify(users, null, 2));

        // Remove from pending
        pendingUsers.splice(pendingUserIndex, 1);
        fs.writeFileSync("attached_assets/pending_users.json", JSON.stringify(pendingUsers, null, 2));

        res.json({
          success: true,
          message: "تم تأكيد الحساب بنجاح",
          user: newUser
        });

      } else if (action === "REJECT") {
        // Remove from pending
        pendingUsers.splice(pendingUserIndex, 1);
        fs.writeFileSync("attached_assets/pending_users.json", JSON.stringify(pendingUsers, null, 2));

        res.json({
          success: true,
          message: "تم رفض الطلب"
        });
      } else {
        res.status(400).json({ message: "إجراء غير صحيح" });
      }

    } catch (error) {
      console.error("Error in account approval:", error);
      res.status(500).json({ message: "خطأ في معالجة الطلب" });
    }
  });

  // Check account status
  app.get("/api/auth/check-account/:email", async (req: Request, res: Response) => {
    try {
      const { email } = req.params;

      // Check in active users
      let users = [];
      try {
        const userData = fs.readFileSync("attached_assets/user.json", "utf-8");
        users = JSON.parse(userData);
      } catch (error) {
        users = [];
      }

      const activeUser = users.find((u: any) => u.email === email);
      if (activeUser) {
        return res.json({
          status: "active",
          accountType: activeUser.subscription?.type || "free",
          user: activeUser
        });
      }

      // Check in pending users
      let pendingUsers = [];
      try {
        const pendingData = fs.readFileSync("attached_assets/pending_users.json", "utf-8");
        pendingUsers = JSON.parse(pendingData);
      } catch (error) {
        pendingUsers = [];
      }

      const pendingUser = pendingUsers.find((u: any) => u.email === email);
      if (pendingUser) {
        return res.json({
          status: "pending_verification",
          requestedAt: pendingUser.requestedAt,
          expiresAt: pendingUser.expiresAt
        });
      }

      res.json({
        status: "not_found",
        message: "الحساب غير موجود"
      });

    } catch (error) {
      console.error("Error checking account status:", error);
      res.status(500).json({ message: "خطأ في فحص حالة الحساب" });
    }
  });

  // Logout route
  app.post("/api/auth/logout", async (req: Request, res: Response) => {
    try {
      req.session.destroy((err) => {
        if (err) {
          console.error("Error destroying session:", err);
          return res.status(500).json({ message: "Failed to logout" });
        }
        res.clearCookie('connect.sid');
        res.json({ message: "تم تسجيل الخروج بنجاح" });
      });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({ message: "فشل في تسجيل الخروج" });
    }
  });

  // Restore session from localStorage data (for server restarts)
  app.post("/api/auth/restore-session", async (req: Request, res: Response) => {
    try {
      const { userId, email } = req.body;
      if (!userId || !email) {
        return res.status(400).json({ error: 'userId و email مطلوبان' });
      }

      // Check if session already valid
      if ((req.session as any)?.userId) {
        return res.json({ restored: true });
      }

      let foundUser: any = null;
      const emailLower = String(email).toLowerCase();

      // Check user.json
      try {
        const users = JSON.parse(fs.readFileSync("attached_assets/user.json", "utf8"));
        foundUser = users.find((u: any) =>
          (String(u.id) === String(userId) || u.id === userId) &&
          u.email?.toLowerCase() === emailLower
        );
      } catch {}

      // Check MongoDB
      if (!foundUser) {
        try {
          const { User } = await import('./mongodb/models');
          const mongoUser = await User.findOne({ email: emailLower });
          if (mongoUser && (String(mongoUser._id) === String(userId) || (mongoUser as any).id === userId)) {
            foundUser = { id: mongoUser._id.toString(), email: mongoUser.email, role: (mongoUser as any).role || 'student' };
          }
        } catch {}
      }

      if (!foundUser) {
        return res.status(401).json({ error: 'لم يتم التحقق من المستخدم' });
      }

      (req.session as any).userId = foundUser.id;
      (req.session as any).userEmail = foundUser.email;
      (req.session as any).userRole = foundUser.role || 'student';

      req.session.save((err) => {
        if (err) return res.status(500).json({ error: 'خطأ في حفظ الجلسة' });
        res.json({ restored: true });
      });
    } catch (error) {
      console.error('restore-session error:', error);
      res.status(500).json({ error: 'خطأ في استعادة الجلسة' });
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

  // Update user points - Protected by RBAC
  app.patch("/api/users/:id/points", requireAuth, requirePermission(permissions.USERS_EDIT), async (req: Request, res: Response) => {
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

  // Folder routes - Using MongoDB storage - Protected by RBAC with ownership check
  app.get("/api/folders/user/:userId", requireAuth, requireOwnership('userId'), async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      const folders = await mongoStorage.getFoldersByUser(userId);
      res.json(folders);
    } catch (error) {
      console.error("Error getting user folders:", error);
      res.status(500).json({ message: "Error getting user folders" });
    }
  });

  // Add endpoint for generic folder route (fallback) - Protected by RBAC
  app.get("/api/folders/user", requireAuth, async (req: Request, res: Response) => {
    try {
      const sessionUserId = (req.session as any)?.userId;

      if (!sessionUserId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const folders = await mongoStorage.getFoldersByUser(sessionUserId);
      res.json(folders);
    } catch (error) {
      console.error("Error getting user folders:", error);
      res.status(500).json({ message: "Error getting user folders" });
    }
  });

  // Auto-create mistakes folder after any test — creates folder + adds wrong question IDs in one call
  app.post("/api/folders/auto-mistakes", requireAuth, async (req: Request, res: Response) => {
    try {
      const sessionUserId = (req.session as any)?.userId;
      if (!sessionUserId) return res.status(401).json({ message: "يجب تسجيل الدخول أولاً" });

      const { testName, testType, wrongQuestionIds } = req.body;
      if (!Array.isArray(wrongQuestionIds) || wrongQuestionIds.length === 0) {
        return res.json({ success: false, message: "لا توجد أخطاء لحفظها" });
      }

      const uniqueIds: number[] = Array.from(new Set(wrongQuestionIds.map(Number).filter(n => !isNaN(n))));
      if (uniqueIds.length === 0) return res.json({ success: false, message: "معرّفات الأسئلة غير صالحة" });

      const examDate = new Date().toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' });
      const folderName = testName
        ? `أخطاء ${testName} - ${examDate}`
        : `أخطاء ${testType || 'اختبار'} - ${examDate}`;

      const folder = await mongoStorage.createFolder({
        userId: String(sessionUserId),
        name: folderName,
        description: `أسئلة أخطأت فيها — ${examDate}`,
        color: '#ef4444',
        icon: '📝',
      });

      const result = await mongoStorage.addQuestionsToFolderBulk(String((folder as any)._id), uniqueIds);
      console.log(`📁 مجلد أخطاء أُنشئ تلقائياً: "${folderName}" — ${result.added} سؤال للمستخدم ${sessionUserId}`);
      res.json({ success: true, folder, added: result.added });
    } catch (error) {
      console.error("Error auto-creating mistakes folder:", error);
      res.status(500).json({ message: "خطأ في إنشاء مجلد الأخطاء" });
    }
  });

  // Create folder - Protected by RBAC
  app.post("/api/folders", requireAuth, requirePermission(permissions.FOLDERS_CREATE), async (req: Request, res: Response) => {
    try {
      const sessionUserId = (req.session as any)?.userId;
      const folder = req.body;

      if (!sessionUserId || !folder.name) {
        return res.status(400).json({ message: "User ID and folder name are required" });
      }

      const newFolder = await mongoStorage.createFolder({
        userId: sessionUserId,
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

  // Get specific folder
  app.get("/api/folders/:id", async (req: Request, res: Response) => {
    try {
      const folderId = req.params.id;

      console.log(`📁 Fetching folder with ID: ${folderId}`);
      const folder = await mongoStorage.getFolderById(folderId);

      if (!folder) {
        console.error(`❌ Folder not found: ${folderId}`);
        return res.status(404).json({ message: "Folder not found" });
      }

      console.log(`✅ Folder found:`, folder);
      res.json(folder);
    } catch (error) {
      console.error("Error getting folder:", error);
      res.status(500).json({ message: "Error getting folder" });
    }
  });

  // Get folder questions
  app.get("/api/folders/:id/questions", async (req: Request, res: Response) => {
    try {
      const folderId = req.params.id;
      console.log(`📂 Fetching questions for folder: ${folderId}`);

      // Get question IDs from MongoDB
      const folderQuestionIds = await mongoStorage.getQuestionIdsInFolder(folderId);
      console.log(`📂 Found ${folderQuestionIds.length} question IDs in folder:`, folderQuestionIds);

      if (folderQuestionIds.length === 0) {
        return res.json([]);
      }

      // Get actual questions from in-memory storage
      const allQuestions = await storage.getAllQuestions();
      console.log(`📂 Total questions in storage: ${allQuestions.length}`);

      // Match by converting both to numbers for comparison
      const questions = allQuestions.filter(q => {
        const matches = folderQuestionIds.some(fqId => Number(fqId) === Number(q.id));
        return matches;
      });

      console.log(`📂 Matched ${questions.length} questions`);
      res.json(questions);
    } catch (error) {
      console.error("Error getting folder questions:", error);
      res.status(500).json({ message: "Error getting folder questions" });
    }
  });

  // Add question to folder - Protected by RBAC
  app.post("/api/folders/:id/questions", requireAuth, requirePermission(permissions.FOLDERS_EDIT), async (req: Request, res: Response) => {
    try {
      const folderId = req.params.id;
      const { questionId } = req.body;

      if (!questionId) {
        return res.status(400).json({ message: "Question ID is required" });
      }

      await mongoStorage.addQuestionToFolder({ folderId, questionId });
      res.json({ success: true, message: "Question added to folder successfully" });
    } catch (error) {
      console.error("Error adding question to folder:", error);
      res.status(500).json({ message: "Error adding question to folder" });
    }
  });

  app.delete("/api/folders/:id", requireAuth, requirePermission(permissions.FOLDERS_DELETE), async (req: Request, res: Response) => {
    try {
      const folderId = req.params.id;

      const deleted = await mongoStorage.deleteFolder(folderId);
      if (deleted) {
        res.status(200).json({ success: true, message: "Folder deleted successfully" });
      } else {
        res.status(404).json({ message: "Folder not found" });
      }
    } catch (error) {
      console.error("Error deleting folder:", error);
      res.status(500).json({ message: "Error deleting folder" });
    }
  });

  // Folder questions routes (alternative route pattern)
  app.get("/api/folders/:folderId/questions", async (req: Request, res: Response) => {
    try {
      const folderId = req.params.folderId;

      // Get question IDs from MongoDB
      const folderQuestionIds = await mongoStorage.getQuestionIdsInFolder(folderId);

      if (folderQuestionIds.length === 0) {
        return res.json([]);
      }

      // Get actual questions from in-memory storage
      const allQuestions = await storage.getAllQuestions();
      const questions = allQuestions.filter(q => folderQuestionIds.includes(q.id));

      res.json(questions);
    } catch (error) {
      console.error("Error getting folder questions:", error);
      res.status(500).json({ message: "Error getting folder questions" });
    }
  });

  app.post("/api/folders/:folderId/questions", requireAuth, requirePermission(permissions.FOLDERS_EDIT), async (req: Request, res: Response) => {
    try {
      const folderId = req.params.folderId;

      const { questionId } = req.body;
      if (!questionId) {
        return res.status(400).json({ message: "Question ID is required" });
      }

      const folderQuestion = {
        folderId,
        questionId,
        notes: req.body.notes
      };

      const newFolderQuestion = await mongoStorage.addQuestionToFolder(folderQuestion);
      res.status(201).json(newFolderQuestion);
    } catch (error) {
      console.error("Error adding question to folder:", error);
      res.status(500).json({ message: "Error adding question to folder" });
    }
  });

  app.delete("/api/folders/:folderId/questions/:questionId", requireAuth, requirePermission(permissions.FOLDERS_EDIT), async (req: Request, res: Response) => {
    try {
      const folderId = req.params.folderId;
      const questionId = parseInt(req.params.questionId);

      if (!folderId || isNaN(questionId)) {
        return res.status(400).json({ message: "Invalid folder or question ID" });
      }

      const deleted = await mongoStorage.removeQuestionFromFolder(folderId, questionId);
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

  app.post("/api/folders/:folderId/questions/bulk", requireAuth, requirePermission(permissions.FOLDERS_EDIT), async (req: Request, res: Response) => {
    try {
      const folderId = req.params.folderId;
      if (!folderId) {
        return res.status(400).json({ message: "Invalid folder ID" });
      }

      const { questionIds } = req.body;

      if (!Array.isArray(questionIds)) {
        return res.status(400).json({ message: "Question IDs must be an array" });
      }

      if (questionIds.length === 0) {
        return res.status(400).json({ message: "Question IDs array cannot be empty" });
      }

      if (questionIds.length > 1000) {
        return res.status(400).json({ message: "Cannot add more than 1000 questions at once" });
      }

      if (!questionIds.every(id => typeof id === 'number' && Number.isInteger(id) && id > 0)) {
        return res.status(400).json({ message: "All question IDs must be positive integers" });
      }

      const uniqueQuestionIds = Array.from(new Set(questionIds));

      const result = await mongoStorage.addQuestionsToFolderBulk(folderId, uniqueQuestionIds);

      res.status(201).json({
        success: true,
        added: result.added,
        skipped: result.skipped,
        total: result.total,
        message: result.added > 0
          ? `تم إضافة ${result.added} سؤال إلى المجلد${result.skipped > 0 ? ` (تم تجاوز ${result.skipped} سؤال موجود مسبقاً)` : ''}`
          : `جميع الأسئلة موجودة مسبقاً في المجلد`
      });
    } catch (error) {
      console.error("Error adding questions to folder (bulk):", error);
      res.status(500).json({ message: "Error adding questions to folder" });
    }
  });

  // Download APK file
  app.get("/app/qudratak-app.apk", async (req: Request, res: Response) => {
    try {
      const apkPath = path.resolve(process.cwd(), "public/app/qudratak-app.apk");

      if (!fs.existsSync(apkPath)) {
        // إنشاء ملف APK إذا لم يكن موجوداً
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

  // Device trial management endpoints
  app.post("/api/device-trial/start", async (req: Request, res: Response) => {
    try {
      const { deviceId, userId } = req.body;

      if (!deviceId) {
        return res.status(400).json({ message: "Device ID is required" });
      }

      // Check if device already used trial
      const filePath = path.join(process.cwd(), 'server/data/device_trials.json');
      let deviceTrials = [];

      try {
        const data = fs.readFileSync(filePath, 'utf8');
        deviceTrials = JSON.parse(data);
      } catch (error) {
        deviceTrials = [];
      }

      const existingTrial = deviceTrials.find((trial: any) => trial.deviceId === deviceId);

      if (existingTrial) {
        return res.status(400).json({
          message: "This device has already used its 7-day trial",
          trialUsed: true,
          trialEndDate: existingTrial.trialEndDate
        });
      }

      // Create new trial
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + 7); // 7 days trial

      const newTrial = {
        id: Date.now(),
        deviceId,
        userId: userId || null,
        trialStartDate: startDate.toISOString(),
        trialEndDate: endDate.toISOString(),
        isActive: true,
        createdAt: new Date().toISOString()
      };

      deviceTrials.push(newTrial);

      // Ensure directory exists
      const dirPath = path.dirname(filePath);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }

      fs.writeFileSync(filePath, JSON.stringify(deviceTrials, null, 2));

      res.json({
        success: true,
        trial: newTrial,
        message: "7-day trial started successfully"
      });

    } catch (error) {
      console.error("Error starting device trial:", error);
      res.status(500).json({ message: "Error starting device trial" });
    }
  });

  app.get("/api/device-trial/status/:deviceId", async (req: Request, res: Response) => {
    try {
      const { deviceId } = req.params;

      const filePath = path.join(process.cwd(), 'server/data/device_trials.json');
      let deviceTrials = [];

      try {
        const data = fs.readFileSync(filePath, 'utf8');
        deviceTrials = JSON.parse(data);
      } catch (error) {
        deviceTrials = [];
      }

      const trial = deviceTrials.find((trial: any) => trial.deviceId === deviceId);

      if (!trial) {
        return res.json({
          trialAvailable: true,
          trialUsed: false,
          message: "7-day trial available for this device"
        });
      }

      const now = new Date();
      const endDate = new Date(trial.trialEndDate);
      const isExpired = now > endDate;

      res.json({
        trialAvailable: false,
        trialUsed: true,
        trialExpired: isExpired,
        trialStartDate: trial.trialStartDate,
        trialEndDate: trial.trialEndDate,
        daysRemaining: isExpired ? 0 : Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      });

    } catch (error) {
      console.error("Error checking device trial status:", error);
      res.status(500).json({ message: "Error checking device trial status" });
    }
  });

  // Subscription management endpoints
  app.post("/api/subscription/create", async (req: Request, res: Response) => {
    try {
      const { userId, type, duration, paymentMethod, transactionId, price } = req.body;

      const startDate = new Date();
      const endDate = new Date();

      // Set end date based on subscription type
      switch (type) {
        case 'Pro':
          endDate.setDate(startDate.getDate() + 30); // 1 month
          break;
        case 'Pro Life':
          endDate.setDate(startDate.getDate() + 90); // 3 months
          break;
        case 'Pro Life Plus':
          endDate.setDate(startDate.getDate() + 180); // 6 months
          break;
        default:
          endDate.setDate(startDate.getDate() + 30);
      }

      const subscription = {
        id: Date.now(),
        userId,
        type,
        status: 'active',
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        autoRenew: false,
        paymentMethod,
        transactionId,
        price,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Save subscription
      const filePath = path.join(process.cwd(), 'server/data/subscriptions.json');
      let subscriptions = [];

      try {
        const data = fs.readFileSync(filePath, 'utf8');
        subscriptions = JSON.parse(data);
      } catch (error) {
        subscriptions = [];
      }

      subscriptions.push(subscription);

      // Ensure directory exists
      const dirPath = path.dirname(filePath);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }

      fs.writeFileSync(filePath, JSON.stringify(subscriptions, null, 2));

      // Create countdown timer
      const timer = {
        id: Date.now() + 1,
        userId,
        subscriptionId: subscription.id,
        endDate: endDate.toISOString(),
        isActive: true,
        notificationSent: false,
        daysRemaining: Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Save timer
      const timerPath = path.join(process.cwd(), 'server/data/countdown_timers.json');
      let timers = [];

      try {
        const timerData = fs.readFileSync(timerPath, 'utf8');
        timers = JSON.parse(timerData);
      } catch (error) {
        timers = [];
      }

      timers.push(timer);
      fs.writeFileSync(timerPath, JSON.stringify(timers, null, 2));

      res.json({
        success: true,
        subscription,
        timer,
        message: "Subscription created successfully"
      });

    } catch (error) {
      console.error("Error creating subscription:", error);
      res.status(500).json({ message: "Error creating subscription" });
    }
  });

  app.get("/api/subscription/user/:userId", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);

      const filePath = path.join(process.cwd(), 'server/data/subscriptions.json');
      let subscriptions = [];

      try {
        const data = fs.readFileSync(filePath, 'utf8');
        subscriptions = JSON.parse(data);
      } catch (error) {
        subscriptions = [];
      }

      const userSubscriptions = subscriptions
        .filter((sub: any) => sub.userId === userId)
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      res.json(userSubscriptions);

    } catch (error) {
      console.error("Error fetching user subscriptions:", error);
      res.status(500).json({ message: "Error fetching user subscriptions" });
    }
  });

  // Submit question error report
  app.post("/api/questions/report", async (req: Request, res: Response) => {
    try {
      const { QuestionReport } = await import('./mongodb/models');
      const { questionId, questionText, reportType, description } = req.body;
      if (!questionId || !reportType) return res.status(400).json({ error: 'بيانات ناقصة' });
      const userId = (req.session as any)?.userId;
      let username = '';
      if (userId) {
        try {
          const users: any[] = JSON.parse(fs.readFileSync('attached_assets/user.json', 'utf8'));
          const u = users.find((u: any) => String(u.id) === String(userId));
          username = u?.username || '';
        } catch (_) {}
      }
      const report = await QuestionReport.create({
        questionId: Number(questionId),
        questionText: questionText || '',
        reportType,
        description: description || '',
        reportedBy: userId ? String(userId) : undefined,
        reportedByUsername: username,
        status: 'pending',
      });
      res.json({ success: true });

      // Async: call AI for suggested correction
      try {
        const { aiChat } = await import('./services/aiService');
        const opts: string[] = req.body.options || [];
        const correctIdx: number = req.body.correctOptionIndex ?? -1;
        const prompt = `أنت خبير في اختبار القدرات العامة قياس. مراجع أبلغ عن خطأ في سؤال.

السؤال: ${questionText}
الخيارات: ${opts.map((o: string, i: number) => `${i + 1}. ${o}`).join(' | ')}
الإجابة المحددة حالياً: ${correctIdx >= 0 ? opts[correctIdx] : 'غير محدد'}
نوع البلاغ: ${reportType}
وصف المشكلة: ${description || 'لا يوجد'}

قيّم هذا البلاغ وأجب بـ JSON فقط:
{
  "isValidReport": true/false,
  "aiSuggestedCorrectIndex": <رقم الخيار الصحيح 0-3 أو null>,
  "aiExplanation": "شرح سبب رأيك",
  "aiNote": "ملاحظة للمشرف"
}`;
        const aiReply = await aiChat([{ role: 'user', content: prompt }]);
        const match = aiReply.match(/\{[\s\S]*\}/);
        if (match) {
          const aiData = JSON.parse(match[0]);
          await QuestionReport.findByIdAndUpdate(report._id, {
            adminNote: `اقتراح المعلم: ${aiData.aiExplanation || ''}\n${aiData.aiNote || ''}`,
            fixedQuestion: aiData.aiSuggestedCorrectIndex !== null ? `الإجابة المقترحة: ${opts[aiData.aiSuggestedCorrectIndex] || ''}` : undefined,
          });
        }
      } catch (aiErr) {
        console.warn('AI report analysis failed:', aiErr);
      }
    } catch (e) {
      console.error('question report error:', e);
      res.status(500).json({ error: 'فشل في إرسال البلاغ' });
    }
  });

  // Admin: Get question reports
  app.get('/api/admin/question-reports', requireAdmin, async (req: Request, res: Response) => {
    try {
      const { QuestionReport } = await import('./mongodb/models');
      const status = req.query.status as string | undefined;
      const filter: any = {};
      if (status && status !== 'all') filter.status = status;
      const reports = await QuestionReport.find(filter).sort({ createdAt: -1 }).limit(100);
      res.json(reports);
    } catch (e) {
      res.status(500).json({ error: 'فشل في جلب البلاغات' });
    }
  });

  // Admin: Update question report (approve/dismiss/fix)
  app.patch('/api/admin/question-reports/:id', requireAdmin, async (req: Request, res: Response) => {
    try {
      const { QuestionReport } = await import('./mongodb/models');
      const { status, adminNote, fixedQuestion, correctOptionIndex, applyFix } = req.body;
      const update: any = { reviewedAt: new Date() };
      if (status) update.status = status;
      if (adminNote !== undefined) update.adminNote = adminNote;
      if (fixedQuestion !== undefined) update.fixedQuestion = fixedQuestion;

      const report = await QuestionReport.findByIdAndUpdate(req.params.id, update, { new: true });

      // If applyFix: update the actual question in MongoDB
      if (applyFix && correctOptionIndex !== undefined && report) {
        try {
          const { Question } = await import('./mongodb/models');
          await Question.findOneAndUpdate({ id: report.questionId }, { correctOptionIndex: Number(correctOptionIndex) });
        } catch (fixErr) {
          console.warn('Failed to apply question fix:', fixErr);
        }
      }

      res.json(report);
    } catch (e) {
      res.status(500).json({ error: 'فشل في تحديث البلاغ' });
    }
  });

  // Get logged-in user's subscription history from MongoDB
  app.get("/api/user/my-subscriptions", async (req: Request, res: Response) => {
    try {
      const userId = (req.session as any)?.userId;
      if (!userId) return res.status(401).json([]);
      const { Subscription } = await import('./mongodb/models');
      const subs = await Subscription.find({ userId: String(userId) })
        .sort({ createdAt: -1 })
        .limit(20);
      res.json(subs);
    } catch (e) {
      console.error('my-subscriptions error:', e);
      res.status(500).json([]);
    }
  });

  // Get current user (for auth purposes)
  app.get("/api/user", async (req: Request, res: Response) => {
    try {
      // Check if user has active session
      const sessionUserId = (req.session as any)?.userId;
      const sessionEmail = (req.session as any)?.userEmail;

      if (!sessionUserId) {
        return res.status(401).json(null);
      }

      const userId = sessionUserId;

      // Read users from JSON file
      const users = JSON.parse(fs.readFileSync("attached_assets/user.json", "utf8"));
      let user = users.find((u: any) => u.id === userId || String(u.id) === String(userId));

      // If not in user.json, check MongoDB (for Telegram/MongoDB-registered users)
      if (!user && sessionEmail) {
        try {
          const { User } = await import('./mongodb/models');
          const mongoUser = await User.findOne({ email: sessionEmail });
          if (mongoUser) {
            user = {
              id: mongoUser._id.toString(),
              name: mongoUser.fullName || mongoUser.username,
              fullName: mongoUser.fullName || mongoUser.username,
              email: mongoUser.email,
              role: mongoUser.role || 'student',
              subscription: (mongoUser as any).subscription || { type: 'trial', status: 'active' },
              points: (mongoUser as any).points || 0,
              level: (mongoUser as any).level || 1,
            };
          }
        } catch {}
      }

      if (!user) {
        // Session exists but user not found - clear session
        req.session.destroy((err) => {
          if (err) console.error('Session destroy error:', err);
        });
        return res.status(401).json(null);
      }

      // Get user's real points from leaderboard (totalPoints reflects actual accumulated points)
      let realPoints = user.points || 50;
      let testsCount = 0;
      let averageScore = 0;

      try {
        const leaderboardEntry = await storage.getUserRank(userId);
        if (leaderboardEntry && leaderboardEntry.totalPoints !== undefined) {
          realPoints = leaderboardEntry.totalPoints;
          testsCount = leaderboardEntry.totalTests || 0;
          averageScore = leaderboardEntry.averageScore || 0;
        }
      } catch (error) {
        console.log('Could not fetch leaderboard points, using user.points as fallback');
      }

      // Return user with subscription info - preserve original subscription type
      const userData = {
        id: user.id,
        username: user.name,
        name: user.name,
        email: user.email,
        points: realPoints,
        level: user.level || 1,
        testsTaken: testsCount,
        averageScore: averageScore,
        bio: user.bio || '',
        avatarUrl: user.avatarUrl || null,
        academicTrack: user.academicTrack || null,
        gradeLevel: user.gradeLevel || null,
        studyGoal: user.studyGoal || null,
        subscription: {
          ...user.subscription,
          // Ensure the subscription type is preserved exactly as stored
          type: user.subscription.type
        }
      };

      return res.json(userData);
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

  // API endpoint for sending email OTP (SMTP2Go)
  app.post("/api/send-email-otp", async (req: Request, res: Response) => {
    try {
      const { email, otp } = req.body;
      if (!email || !otp) return res.status(400).json({ error: "Email and OTP are required" });
      const sent = await sendOTPEmail(email, '', otp);
      if (sent) {
        res.json({ success: true, message: "تم إرسال رمز التحقق بنجاح" });
      } else {
        res.status(500).json({ error: "فشل في إرسال البريد الإلكتروني" });
      }
    } catch (error: any) {
      console.error('Send email OTP error:', error);
      res.status(500).json({ error: "فشل في إرسال البريد الإلكتروني", details: error.message });
    }
  });

  // Admin: send test email
  app.post("/api/admin/send-test-email", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { to } = req.body;
      if (!to) return res.status(400).json({ error: "يرجى تحديد البريد المستهدف" });
      const sent = await sendTestEmail(to);
      if (sent) {
        res.json({ success: true, message: `تم إرسال البريد التجريبي إلى ${to}` });
      } else {
        res.status(500).json({ error: "فشل في إرسال البريد التجريبي" });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Subscription and device trial routes
  app.post("/api/subscription/status", async (req: Request, res: Response) => {
    try {
      const { deviceId, userId } = req.body;

      if (!deviceId) {
        return res.status(400).json({ message: "Device ID is required" });
      }

      let hasActiveSubscription = false;
      let subscriptionType = 'Free';
      let subscriptionEndDate = null;
      let isUserSubscribed = false;

      // Check user subscription first (if userId is provided)
      if (userId) {
        try {
          const users = JSON.parse(fs.readFileSync("attached_assets/user.json", "utf-8"));
          const user = users.find((u: any) => u.id === userId);

          if (user && user.subscription) {
            const now = new Date();
            const endDate = new Date(user.subscription.endDate);

            // Check if subscription is active and not expired
            if (now < endDate) {
              // Define all valid premium subscription types
              const validPremiumTypes = ['Pro', 'Pro Life', 'Pro Life Plus', 'Pro Live'];

              if (validPremiumTypes.includes(user.subscription.type)) {
                hasActiveSubscription = true;
                subscriptionType = user.subscription.type;
                subscriptionEndDate = endDate;
                isUserSubscribed = true;
              }
            }
          }
        } catch (error) {
          console.error("Error reading user data:", error);
        }
      }

      // If no active user subscription, automatically start or check device trials
      let isTrialActive = false;
      let trialEndDate = null;
      let hasUsedTrial = false;
      let daysRemaining = 0;

      if (!isUserSubscribed) {
        try {
          let deviceTrials = [];
          try {
            const trialsData = fs.readFileSync("attached_assets/device_trials.json", "utf-8");
            deviceTrials = JSON.parse(trialsData);
          } catch (error) {
            // Device trials file doesn't exist, create it
            deviceTrials = [];
          }

          let deviceTrial = deviceTrials.find((trial: any) => trial.deviceId === deviceId);
          const now = new Date();

          if (!deviceTrial) {
            // Auto-start trial for new devices
            const trialEndDate = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000)); // 7 days
            deviceTrial = {
              deviceId,
              trialStartDate: now.toISOString(),
              trialEndDate: trialEndDate.toISOString(),
              isActive: true,
              createdAt: now.toISOString()
            };
            deviceTrials.push(deviceTrial);
            fs.writeFileSync("attached_assets/device_trials.json", JSON.stringify(deviceTrials, null, 2));
          }

          if (deviceTrial) {
            hasUsedTrial = true;
            const endDate = new Date(deviceTrial.trialEndDate);

            if (now < endDate && deviceTrial.isActive) {
              isTrialActive = true;
              trialEndDate = endDate;
              subscriptionType = 'Pro';
              daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            }
          }
        } catch (error) {
          console.error("Error handling device trials:", error);
          // Create empty device trials file
          fs.writeFileSync("attached_assets/device_trials.json", JSON.stringify([], null, 2));
        }
      }

      // Calculate time remaining for active subscriptions or trials
      const activeEndDate = subscriptionEndDate || trialEndDate;
      const now = new Date();

      if (activeEndDate && (hasActiveSubscription || isTrialActive)) {
        const timeRemaining = new Date(activeEndDate).getTime() - now.getTime();
        daysRemaining = Math.ceil(timeRemaining / (1000 * 60 * 60 * 24));
      }

      const subscriptionStatus = {
        hasActiveSubscription: hasActiveSubscription || isTrialActive,
        subscriptionType,
        subscriptionEndDate: activeEndDate,
        isTrialActive: isTrialActive && !hasActiveSubscription,
        trialEndDate,
        daysRemaining: Math.max(0, daysRemaining),
        hoursRemaining: activeEndDate ? Math.max(0, Math.floor(((new Date(activeEndDate).getTime() - now.getTime()) % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))) : 0,
        minutesRemaining: activeEndDate ? Math.max(0, Math.floor(((new Date(activeEndDate).getTime() - now.getTime()) % (1000 * 60 * 60)) / (1000 * 60))) : 0,
        isExpired: hasUsedTrial && !isTrialActive && !hasActiveSubscription,
        deviceId,
        canAccessPremiumFeatures: hasActiveSubscription || isTrialActive,
        userId: userId || null
      };

      res.json(subscriptionStatus);
    } catch (error) {
      console.error("Error checking subscription status:", error);
      res.status(500).json({ message: "Error checking subscription status" });
    }
  });

  app.post("/api/subscription/start-trial", async (req: Request, res: Response) => {
    try {
      const { deviceId, userId } = req.body;

      if (!deviceId) {
        return res.status(400).json({ message: "Device ID is required" });
      }

      // Load device trials
      let deviceTrials = [];
      try {
        const trialsData = fs.readFileSync("attached_assets/device_trials.json", "utf-8");
        deviceTrials = JSON.parse(trialsData);
      } catch (error) {
        // File doesn't exist, create it
        deviceTrials = [];
      }

      // Check if device already used trial
      const existingTrial = deviceTrials.find((trial: any) => trial.deviceId === deviceId);

      if (existingTrial) {
        return res.status(400).json({
          success: false,
          message: "هذا الجهاز استخدم الفترة التجريبية من قبل"
        });
      }

      // Create new trial
      const now = new Date();
      const trialEndDate = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000)); // 7 days

      const newTrial = {
        id: deviceTrials.length + 1,
        deviceId,
        trialStartDate: now.toISOString(),
        trialEndDate: trialEndDate.toISOString(),
        userId: userId || null,
        isActive: true,
        createdAt: now.toISOString()
      };

      deviceTrials.push(newTrial);
      fs.writeFileSync("attached_assets/device_trials.json", JSON.stringify(deviceTrials, null, 2));

      res.json({
        success: true,
        trialEndDate: trialEndDate.toISOString(),
        message: "تم بدء الفترة التجريبية بنجاح"
      });
    } catch (error) {
      console.error("Error starting trial:", error);
      res.status(500).json({
        success: false,
        message: "خطأ في بدء الفترة التجريبية"
      });
    }
  });

  app.post("/api/subscription/create", async (req: Request, res: Response) => {
    try {
      const { userId, planType, paymentMethod, transactionId } = req.body;

      if (!userId || !planType) {
        return res.status(400).json({ message: "User ID and plan type are required" });
      }

      // Load subscriptions
      let subscriptions = [];
      try {
        const subsData = fs.readFileSync("attached_assets/subscriptions.json", "utf-8");
        subscriptions = JSON.parse(subsData);
      } catch (error) {
        subscriptions = [];
      }

      const now = new Date();
      let endDate = new Date();
      let price = 0;

      // Set duration and price based on plan
      switch (planType) {
        case 'pro':
          endDate = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 days
          price = 29;
          break;
        case 'proLife':
          endDate = new Date(now.getTime() + (90 * 24 * 60 * 60 * 1000)); // 90 days
          price = 74;
          break;
        case 'proLifePlus':
          endDate = new Date(now.getTime() + (180 * 24 * 60 * 60 * 1000)); // 180 days
          price = 134;
          break;
        default:
          return res.status(400).json({ message: "Invalid plan type" });
      }

      const newSubscription = {
        id: subscriptions.length + 1,
        userId,
        type: planType === 'pro' ? 'Pro' : planType === 'proLife' ? 'Pro Life' : 'Pro Life Plus',
        status: 'pending',
        startDate: now.toISOString(),
        endDate: endDate.toISOString(),
        autoRenew: false,
        paymentMethod: paymentMethod || 'manual',
        transactionId: transactionId || null,
        price,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString()
      };

      subscriptions.push(newSubscription);
      fs.writeFileSync("attached_assets/subscriptions.json", JSON.stringify(subscriptions, null, 2));

      res.status(201).json(newSubscription);
    } catch (error) {
      console.error("Error creating subscription:", error);
      res.status(500).json({ message: "Error creating subscription" });
    }
  });

  // Paper Exam Routes
  let paperExams: any[] = [];

  app.post("/api/paper-exams", async (req: Request, res: Response) => {
    try {
      const { title, totalQuestions, trialQuestions, examType, timeLimit } = req.body;

      if (!title || !totalQuestions || !timeLimit) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const newExam = {
        id: paperExams.length + 1,
        title,
        totalQuestions,
        trialQuestions: trialQuestions || 0,
        examType: examType || 'قدرات',
        timeLimit,
        status: 'created',
        questions: [],
        answerKey: [],
        createdAt: new Date().toISOString(),
      };

      paperExams.push(newExam);

      res.status(201).json(newExam);
    } catch (error) {
      console.error("Error creating paper exam:", error);
      res.status(500).json({ error: "Error creating paper exam" });
    }
  });

  // Get questions for paper exam
  app.get('/api/paper-exams/:id/questions', async (req, res) => {
    try {
      const examId = parseInt(req.params.id);
      const count = parseInt(req.query.count as string) || 120;

      let exam = paperExams.find((e) => e.id === examId);
      if (!exam) {
        return res.status(404).json({ message: 'الاختبار غير موجود' });
      }

      console.log(`[Paper Exam] جاري تحميل ${count} سؤال للاختبار رقم ${examId} من نوع ${exam.examType}`);

      // Get all questions from storage
      const allQuestions = await storage.getAllQuestions();

      // Filter by exam type
      let filteredQuestions = allQuestions;
      if (exam.examType === 'لفظي') {
        filteredQuestions = allQuestions.filter(q =>
          q.category === 'verbal'
        );
        console.log(`[Paper Exam] تمت تصفية ${filteredQuestions.length} سؤال لفظي من أصل ${allQuestions.length}`);
      } else if (exam.examType === 'كمي') {
        filteredQuestions = allQuestions.filter(q =>
          q.category === 'quantitative'
        );
        console.log(`[Paper Exam] تمت تصفية ${filteredQuestions.length} سؤال كمي من أصل ${allQuestions.length}`);
      }

      if (filteredQuestions.length === 0) {
        console.warn(`[Paper Exam] لا توجد أسئلة ${exam.examType} في قاعدة البيانات`);
        return res.status(404).json({
          message: `لا توجد أسئلة ${exam.examType} متاحة حالياً`,
          questions: []
        });
      }

      // Shuffle and select requested number of questions
      const shuffled = [...filteredQuestions].sort(() => Math.random() - 0.5);
      const selectedQuestions = shuffled.slice(0, count);

      console.log(`[Paper Exam] تم تحميل ${selectedQuestions.length} سؤال ${exam.examType} من أصل ${filteredQuestions.length} سؤال متاح`);

      // Store the questions and answer key in the exam
      exam = paperExams.find((e) => e.id === examId); // Re-find exam to update it
      if (exam) {
        exam.questions = selectedQuestions;
        exam.answerKey = selectedQuestions.map(q => ({
          id: q.id,
          correctOptionIndex: q.correctOptionIndex
        }));
      }

      res.json(selectedQuestions);
    } catch (error) {
      console.error('[Paper Exam] خطأ في جلب الأسئلة:', error);
      res.status(500).json({ message: 'فشل في جلب الأسئلة' });
    }
  });

  // Submit paper model result
  app.post("/api/paper-model-result", async (req: Request, res: Response) => {
    try {
      console.log('📝 Paper model result submission received');

      const { modelId, modelNumber, verbalCorrect, quantCorrect } = req.body;

      const userId = (req.session as any).userId;

      if (!userId) {
        return res.status(401).json({ message: "يجب تسجيل الدخول أولاً" });
      }

      if (!modelId || !modelNumber || verbalCorrect === undefined || quantCorrect === undefined) {
        return res.status(400).json({ message: "بيانات غير مكتملة" });
      }

      try {
        console.log(`📝 Attempting to save result: userId=${userId}, modelId=${modelId}`);

        // Check if result already exists
        const existingResult = await storage.getPaperModelResultsByModel(userId, modelId);

        if (existingResult) {
          console.log(`⚠️ Result already exists for user ${userId}, model ${modelId}`);
          return res.status(400).json({
            message: "تم تسجيل نتيجة لهذا النموذج من قبل",
            existing: true
          });
        }

        // Calculate totals and percentages
        const verbalTotal = 53;
        const quantitativeTotal = 47;
        const totalQuestions = 100;

        const verbalPercentage = Math.round((verbalCorrect / verbalTotal) * 100);
        const quantitativePercentage = Math.round((quantCorrect / quantitativeTotal) * 100);
        const totalCorrect = verbalCorrect + quantCorrect;
        const totalPercentage = Math.round((totalCorrect / totalQuestions) * 100);

        // Create new result with all required fields
        const resultData = {
          userId: userId,
          modelId: modelId,
          modelNumber: modelNumber,
          verbalCorrect: verbalCorrect,
          verbalTotal: verbalTotal,
          quantitativeCorrect: quantCorrect,
          quantitativeTotal: quantitativeTotal,
          verbalPercentage: verbalPercentage,
          quantitativePercentage: quantitativePercentage,
          totalPercentage: totalPercentage
        };

        console.log(`📊 Result data to save:`, resultData);

        const newResult = await storage.createPaperModelResult(resultData);

        console.log(`✅ Successfully saved result for user ${userId}, model ${modelNumber}`);

        return res.status(201).json({
          message: "تم حفظ النتيجة بنجاح",
          result: newResult
        });
      } catch (storageError) {
        console.error('❌ Error saving paper model result:', storageError);
        console.error('Stack trace:', storageError instanceof Error ? storageError.stack : 'No stack trace');
        return res.status(500).json({
          message: "خطأ في حفظ النتيجة",
          error: storageError instanceof Error ? storageError.message : "Unknown error"
        });
      }
    } catch (error) {
      console.error('❌ Error in paper model result endpoint:', error);
      return res.status(500).json({ message: "خطأ في معالجة النتيجة" });
    }
  });

  // Get paper model results
  app.get("/api/paper-model-results", async (req: Request, res: Response) => {
    try {
      if (!(req.session as any).userId) {
        return res.status(401).json({ message: "غير مصرح" });
      }

      const userId = (req.session as any).userId;
      const results = await storage.getPaperModelResults(userId);
      const averages = await storage.getPaperModelAverages(userId);

      res.json({ results, averages });
    } catch (error) {
      console.error("Error fetching paper model results:", error);
      res.status(500).json({ error: "Failed to fetch results" });
    }
  });

  // Leaderboard and Badges Routes

  // Get all badges
  app.get("/api/badges", async (req: Request, res: Response) => {
    try {
      const badges = await storage.getAllBadges();
      res.json(badges);
    } catch (error) {
      console.error("Error getting badges:", error);
      res.status(500).json({ error: "Failed to get badges" });
    }
  });

  // Get user badges
  app.get("/api/users/:userId/badges", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const badges = await storage.getUserBadges(userId);
      res.json(badges);
    } catch (error) {
      console.error("Error getting user badges:", error);
      res.status(500).json({ error: "Failed to get user badges" });
    }
  });

  // دالة helper لتوليد منافسين وهميين ذكيين
  const generateSmartCompetitors = (userPoints: number, userRank: number): any[] => {
    const arabicNames = [
      'محمد العتيبي', 'عبدالله القحطاني', 'أحمد الغامدي', 'خالد الشمري', 'فهد الدوسري',
      'سارة المطيري', 'نورة الحربي', 'فاطمة السهلي', 'مريم الزهراني', 'عائشة العنزي',
      'علي الشهري', 'عمر الثبيتي', 'يوسف البقمي', 'إبراهيم المالكي', 'سعد الأحمدي',
      'ريم الجهني', 'دانة السبيعي', 'لينا القرني', 'هند العمري', 'منى الحكمي',
      'عبدالرحمن الفهد', 'سلطان العصيمي', 'ناصر الشريف', 'طلال البيشي', 'ماجد الرشيدي',
      'جواهر الخالدي', 'شهد الناصر', 'غادة المنيف', 'أمل الفوزان', 'بشرى السديري'
    ];

    const competitors: any[] = [];
    let competitorId = 10000; // معرفات وهمية عالية لتجنب التضارب

    // الثلاثة الأوائل - دائماً أفضل من المستخدم (إلا إذا كان المستخدم ممتازاً جداً)
    const topThreeBasePoints = userPoints >= 5000 ? userPoints - 200 : Math.max(userPoints + 300, 3000);

    for (let i = 1; i <= 3; i++) {
      const points = topThreeBasePoints + (4 - i) * 150 + Math.floor(Math.random() * 100);
      competitors.push({
        id: competitorId++,
        userId: competitorId,
        username: arabicNames[i - 1],
        name: arabicNames[i - 1],
        totalPoints: points,
        currentRank: i,
        previousRank: i <= 2 ? i + 1 : i,
        rankChange: i === 1 ? 'up' : (i === 3 ? 'down' : 'stable'),
        totalTests: Math.floor(points / 50) + Math.floor(Math.random() * 20),
        lastUpdated: new Date(),
        isBot: true
      });
    }

    // توليد منافسين حول المستخدم
    const targetRank = userPoints === 0 ? 1000 :
                       userPoints < 500 ? 800 :
                       userPoints < 1000 ? 600 :
                       userPoints < 2000 ? 400 :
                       userPoints < 3000 ? 200 :
                       userPoints < 5000 ? 100 : 50;

    // منافسون فوق المستخدم
    const aboveCount = Math.min(targetRank - 3, 50);
    for (let i = 0; i < aboveCount; i++) {
      const rank = 4 + i;
      const pointsRange = topThreeBasePoints - (i * 30) - Math.floor(Math.random() * 50);
      const points = Math.max(pointsRange, userPoints + 10);

      competitors.push({
        id: competitorId++,
        userId: competitorId,
        username: arabicNames[Math.floor(Math.random() * arabicNames.length)],
        name: arabicNames[Math.floor(Math.random() * arabicNames.length)],
        totalPoints: points,
        currentRank: rank,
        previousRank: rank + (Math.random() > 0.5 ? 1 : -1),
        rankChange: Math.random() > 0.5 ? 'up' : 'down',
        totalTests: Math.floor(points / 50) + Math.floor(Math.random() * 15),
        lastUpdated: new Date(),
        isBot: true
      });
    }

    // منافسون تحت المستخدم
    const belowCount = 50;
    for (let i = 0; i < belowCount; i++) {
      const rank = targetRank + i + 1;
      const points = Math.max(userPoints - (i * 20) - Math.floor(Math.random() *30), 50);

      competitors.push({
        id: competitorId++,
        userId: competitorId,
        username: arabicNames[Math.floor(Math.random() * arabicNames.length)],
        name: arabicNames[Math.floor(Math.random() * arabicNames.length)],
        totalPoints: points,
        currentRank: rank,
        previousRank: rank + (Math.random() > 0.3 ? 1 : -1),
        rankChange: Math.random() > 0.6 ? 'up' : (Math.random() > 0.5 ? 'down' : 'stable'),
        totalTests: Math.floor(points / 50) + Math.floor(Math.random() * 10),
        lastUpdated: new Date(),
        isBot: true
      });
    }

    return competitors;
  };

  // Get leaderboard (NEW: returns top 10 + user context)
  app.get("/api/leaderboard", async (req: Request, res: Response) => {
    try {
      const userId = (req as any).session?.userId;
      const leaderboard = await storage.getLeaderboard(10000);

      // Only real users — filter out all bots (userId >= 10000)
      const realEntries = leaderboard.filter((e: any) => !e.isBot && (typeof e.userId === 'string' || e.userId < 10000));

      // Get user details for each entry
      const leaderboardWithUsers = await Promise.all(
        realEntries.map(async (entry: any) => {
          const user = await storage.getUser(entry.userId);
          return {
            ...entry,
            username: user?.username || entry.username || 'مستخدم',
            name: user?.username || entry.username || 'مستخدم',
            isBot: false
          };
        })
      );

      // Sort by points
      leaderboardWithUsers.sort((a, b) => b.totalPoints - a.totalPoints);

      // إذا كان عدد الطلاب الحقيقيين أقل من 10، نُكمل بأسماء عربية مولّدة
      const fillNames = [
        'أحمد السالم','نورة العمري','خالد الزهراني','سارة الحربي',
        'عمر المطيري','ريم القحطاني','فهد الشمري','لطيفة البدر',
        'سلطان الغامدي','هيفاء المالكي','بندر العنزي','منى الدوسري'
      ];
      const lastRealPoints = leaderboardWithUsers.length > 0
        ? leaderboardWithUsers[leaderboardWithUsers.length - 1].totalPoints
        : 80;
      let fillIndex = 0;
      while (leaderboardWithUsers.length < 10) {
        const pts = Math.max(5, lastRealPoints - (fillIndex + 1) * 8);
        leaderboardWithUsers.push({
          userId: `gen_lb_${fillIndex}`,
          username: fillNames[fillIndex % fillNames.length],
          name: fillNames[fillIndex % fillNames.length],
          totalPoints: pts,
          totalTests: Math.floor(Math.random() * 15) + 2,
          averageScore: Math.floor(Math.random() * 30) + 50,
          rankChange: 'stable',
          isBot: false,
          isGenerated: true,
        } as any);
        fillIndex++;
      }

      // Update ranks
      leaderboardWithUsers.forEach((entry, index) => {
        entry.currentRank = index + 1;
      });

      // Get top 100
      const top10 = leaderboardWithUsers.slice(0, 100);

      // Get user context (user + 2 above + 2 below)
      let userContext: any[] = [];
      if (userId) {
        const userIndex = leaderboardWithUsers.findIndex(e => String(e.userId) === String(userId));
        if (userIndex !== -1) {
          const contextStart = Math.max(0, userIndex - 2);
          const contextEnd = Math.min(leaderboardWithUsers.length, userIndex + 3);
          userContext = leaderboardWithUsers.slice(contextStart, contextEnd);
        }
      }

      res.json({
        top10,
        userContext,
        totalRealUsers: realEntries.length,
        userRank: userId ? leaderboardWithUsers.find(e => String(e.userId) === String(userId)) : null
      });
    } catch (error) {
      console.error("Error getting leaderboard:", error);
      res.status(500).json({ error: "Failed to get leaderboard" });
    }
  });

  // ── Monthly top 3 (for admin rewards) ──
  app.get("/api/admin/leaderboard/monthly-top3", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { month, year } = req.query;
      const leaderboard = await storage.getLeaderboard(10000);
      const realEntries = leaderboard.filter((e: any) => !e.isBot && (typeof e.userId === 'string' || e.userId < 10000));
      const leaderboardWithUsers = await Promise.all(
        realEntries.map(async (entry: any) => {
          const user = await storage.getUser(entry.userId);
          const wallet = await mongoStorage.getWallet(String(entry.userId));
          return {
            ...entry,
            username: user?.username || entry.username || 'مستخدم',
            isBot: false,
            walletBalance: wallet?.balance ?? 0,
          };
        })
      );
      leaderboardWithUsers.sort((a, b) => b.totalPoints - a.totalPoints);
      leaderboardWithUsers.forEach((e, i) => { e.currentRank = i + 1; });
      res.json(leaderboardWithUsers.slice(0, 3));
    } catch (error) {
      console.error("Error getting monthly top3:", error);
      res.status(500).json({ error: "Failed" });
    }
  });

  // ADMIN: Bulk import users (for testing/setup only)
  app.post("/api/admin/import-users", requireAdmin, async (req: Request, res: Response) => {
    try {
      const result = await mongoStorage.bulkCreateUsers(req.body);
      res.json({
        success: true,
        message: `تم إنشاء ${result.created} مستخدم، فشل ${result.failed}`,
        ...result
      });
    } catch (error) {
      console.error('Error importing users:', error);
      res.status(500).json({ error: 'فشل في استيراد المستخدمين' });
    }
  });

  // Get user rank
  app.get("/api/users/:userId/rank", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const rank = await storage.getUserRank(userId);

      if (!rank) {
        return res.json({
          userId,
          currentRank: 0,
          totalPoints: 0,
          rankChange: 'stable'
        });
      }

      res.json(rank);
    } catch (error) {
      console.error("Error getting user rank:", error);
      res.status(500).json({ error: "Failed to get user rank" });
    }
  });

  // Get monthly winners - أخذ أفضل 3 من التصنيف الحقيقي
  app.get("/api/monthly-winners", async (req: Request, res: Response) => {
    try {
      const leaderboard = await storage.getLeaderboard(10000);

      // فقط الطلاب الحقيقيون (userId < 10000 وليسوا bots)
      const realEntries = leaderboard.filter((e: any) => !e.isBot && (typeof e.userId === 'string' || e.userId < 10000));

      const leaderboardWithUsers = await Promise.all(
        realEntries.map(async (entry: any) => {
          const user = await storage.getUser(entry.userId);
          return {
            ...entry,
            username: user?.username || entry.username || 'مستخدم',
          };
        })
      );

      leaderboardWithUsers.sort((a, b) => b.totalPoints - a.totalPoints);

      // توليد طلاب مؤقتين لملء المراكز إذا كان العدد أقل من 3
      const arabicNames = ['أحمد السالم','نورة العمري','خالد الزهراني','سارة الحربي','عمر المطيري','ريم القحطاني','فهد الشمري','لطيفة البدر','سلطان الغامدي','هيفاء المالكي'];
      const lowestPoints = leaderboardWithUsers.length > 0 ? leaderboardWithUsers[leaderboardWithUsers.length - 1].totalPoints : 50;
      while (leaderboardWithUsers.length < 3) {
        const idx = leaderboardWithUsers.length;
        leaderboardWithUsers.push({
          userId: `gen_${idx}`,
          username: arabicNames[idx % arabicNames.length],
          totalPoints: Math.max(10, lowestPoints - (idx + 1) * 5),
          totalTests: Math.floor(Math.random() * 10) + 1,
          isBot: false,
        } as any);
      }

      const prizes = [999, 599, 399];
      const today = new Date();

      const winners = leaderboardWithUsers.slice(0, 3).map((entry, index) => ({
        id: index + 1,
        rank: index + 1,
        displayName: entry.username,
        prize: prizes[index],
        totalPoints: entry.totalPoints,
        month: today.getMonth() + 1,
        year: today.getFullYear()
      }));

      res.json(winners);
    } catch (error) {
      console.error("Error getting monthly winners:", error);
      res.status(500).json({ error: "Failed to get monthly winners" });
    }
  });

  // Update leaderboard entry (called after completing a test) - PROTECTED
  app.post("/api/leaderboard/update", async (req: Request, res: Response) => {
    try {
      // Get userId from session (authenticated user)
      const sessionUserId = (req as any).session?.userId;

      if (!sessionUserId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { testResult } = req.body;

      // نظام النقاط الموحد: حساب النقاط من testResult
      let calculatedPoints = 0;
      if (testResult?.correctAnswers !== undefined && testResult?.totalQuestions !== undefined) {
        const correctAnswers = testResult.correctAnswers;
        const skipped = testResult.skippedQuestions || 0;
        const wrongAnswers = testResult.totalQuestions - correctAnswers - skipped;
        const correctPoints = correctAnswers * 10;
        const wrongPenalty = wrongAnswers * 1;
        const skippedPenalty = skipped * 0.5;
        calculatedPoints = Math.max(0, correctPoints - wrongPenalty - skippedPenalty);
      } else if (testResult?.score !== undefined && testResult?.totalQuestions !== undefined) {
        // Fallback for legacy format
        const correctAnswers = testResult.score;
        const skipped = testResult.skippedQuestions || 0;
        const wrongAnswers = testResult.totalQuestions - correctAnswers - skipped;
        const correctPoints = correctAnswers * 10;
        const wrongPenalty = wrongAnswers * 1;
        const skippedPenalty = skipped * 0.5;
        calculatedPoints = Math.max(0, correctPoints - wrongPenalty - skippedPenalty);
      } else {
        return res.status(400).json({ error: "testResult with correctAnswers/score and totalQuestions is required" });
      }

      // Use the authenticated userId, not from request body
      const entry = await storage.updateLeaderboardEntry(sessionUserId, calculatedPoints);

      // Check and award badges if testResult is provided
      let awardedBadges: any[] = [];
      if (testResult) {
        awardedBadges = await storage.checkAndAwardBadges(sessionUserId, testResult);
      }

      res.json({ entry, awardedBadges });
    } catch (error) {
      console.error("Error updating leaderboard:", error);
      res.status(500).json({ error: "Failed to update leaderboard" });
    }
  });

  // Get detailed points history for the authenticated user - NEW
  app.get("/api/points-history/:userId", async (req: Request, res: Response) => {
    try {
      // Get userId from session (authenticated user) - ignore path parameter
      const sessionUserId = (req as any).session?.userId;

      if (!sessionUserId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      // SECURITY: Always use session userId, never trust path parameter
      const userId = sessionUserId;

      // Get all test results for this user
      const allResults = await (storage as any).getAllTestResults();
      const userResults = allResults.filter((result: any) => result.userId.toString() === userId.toString());

      if (userResults.length === 0) {
        return res.json({
          statistics: {
            totalTests: 0,
            averagePoints: 0,
            highestPoints: 0,
            positiveTestsCount: 0
          },
          topPerformances: [],
          pointsByType: {},
          recentTests: []
        });
      }

      // Calculate points for each test using the unified points system
      const testsWithPoints = userResults.map((result: any) => {
        const correctAnswers = result.correctAnswers || result.score || 0;
        const skipped = result.skippedQuestions || 0;
        const wrongAnswers = result.totalQuestions - correctAnswers - skipped;
        const correctPoints = correctAnswers * 10;
        const wrongPenalty = wrongAnswers * 1;
        const skippedPenalty = skipped * 0.5;
        const points = correctPoints - wrongPenalty - skippedPenalty;

        return {
          id: result.id,
          testType: result.testType || 'mixed',
          difficulty: result.difficulty || 'intermediate',
          score: correctAnswers,
          totalQuestions: result.totalQuestions,
          percentage: (correctAnswers / result.totalQuestions) * 100,
          points: points,
          completedAt: result.completedAt || new Date()
        };
      });

      // Statistics
      const totalTests = testsWithPoints.length;
      const totalPoints = testsWithPoints.reduce((sum: number, test: any) => sum + test.points, 0);
      const averagePoints = Math.round(totalPoints / totalTests);
      const highestPoints = Math.max(...testsWithPoints.map((test: any) => test.points));
      const positiveTestsCount = testsWithPoints.filter((test: any) => test.points > 0).length;

      // Top 5 performances
      const topPerformances = [...testsWithPoints]
        .sort((a: any, b: any) => b.points - a.points)
        .slice(0, 5);

      // Points by test type
      const pointsByType: any = {};
      testsWithPoints.forEach((test: any) => {
        if (!pointsByType[test.testType]) {
          pointsByType[test.testType] = { total: 0, count: 0 };
        }
        pointsByType[test.testType].total += test.points;
        pointsByType[test.testType].count += 1;
      });

      // Recent tests (last 10)
      const recentTests = [...testsWithPoints]
        .sort((a: any, b: any) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
        .slice(0, 10);

      res.json({
        statistics: {
          totalTests,
          averagePoints,
          highestPoints,
          positiveTestsCount
        },
        topPerformances,
        pointsByType,
        recentTests
      });
    } catch (error) {
      console.error("Error getting points history:", error);
      res.status(500).json({ error: "Failed to get points history" });
    }
  });

  // Get all global paper models (same for everyone)
  app.get("/api/paper-models", async (req: Request, res: Response) => {
    try {
      console.log('📝 Paper models request received');

      if (!(req.session as any).userId) {
        console.log('❌ Unauthorized - No userId in session');
        return res.status(401).json({
          message: "يجب تسجيل الدخول للوصول إلى النماذج الورقية",
          error: "UNAUTHORIZED"
        });
      }

      console.log(`📝 Fetching global paper models`);

      // Fetch all global models
      const models = await storage.getAllPaperModels();

      if (models.length === 0) {
        console.log('⚠️ No paper models found, seeding now...');
        await storage.seedPaperModels();
        const newModels = await storage.getAllPaperModels();

        return res.json({
          exams: newModels.map(m => ({
            id: m.id,
            name: m.name,
            modelNumber: m.modelNumber,
            allQuestions: m.allQuestions,
            totalQuestions: m.totalQuestions,
            verbalCount: m.verbalCount,
            quantitativeCount: m.quantitativeCount,
            trialVerbalCount: m.trialVerbalCount,
            trialQuantCount: m.trialQuantCount,
          }))
        });
      }

      console.log(`✅ Found ${models.length} global paper models`);
      res.json({
        exams: models.map(m => ({
          id: m.id,
          name: m.name,
          modelNumber: m.modelNumber,
          allQuestions: m.allQuestions,
          totalQuestions: m.totalQuestions,
          verbalCount: m.verbalCount,
          quantitativeCount: m.quantitativeCount,
          trialVerbalCount: m.trialVerbalCount,
          trialQuantCount: m.trialQuantCount,
        }))
      });
    } catch (error) {
      console.error("❌ Error fetching paper models:", error);
      res.status(500).json({
        error: "Failed to fetch paper models",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // ============================================
  // Admin Routes using MongoDB
  // ============================================

  // Configure multer for file uploads
  const uploadsDir = path.join(process.cwd(), 'uploads', 'receipts');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const receiptStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      cb(null, 'receipt-' + uniqueSuffix + ext);
    }
  });

  const uploadReceipt = multer({
    storage: receiptStorage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('نوع الملف غير مدعوم. يرجى رفع صورة أو ملف PDF'));
      }
    }
  });

  // Serve uploaded files
  const express = await import('express');
  app.use('/uploads', (req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    next();
  }, express.default.static(path.join(process.cwd(), 'uploads')));

  // ── Avatar Upload ──
  const avatarsDir = path.join(process.cwd(), 'uploads', 'avatars');
  if (!fs.existsSync(avatarsDir)) fs.mkdirSync(avatarsDir, { recursive: true });

  const avatarStorage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, avatarsDir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
      cb(null, `avatar-${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`);
    }
  });
  const uploadAvatar = multer({
    storage: avatarStorage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      if (file.mimetype.startsWith('image/')) cb(null, true);
      else cb(new Error('يُسمح فقط برفع الصور'));
    }
  });

  app.post('/api/user/upload-avatar', uploadAvatar.single('avatar'), async (req: Request, res: Response) => {
    try {
      const sessionUserId = (req.session as any)?.userId;
      if (!sessionUserId) return res.status(401).json({ error: 'يجب تسجيل الدخول أولاً' });
      if (!req.file) return res.status(400).json({ error: 'لم يتم رفع أي صورة' });

      const avatarUrl = `/uploads/avatars/${req.file.filename}`;

      // Update user.json
      try {
        const users = JSON.parse(fs.readFileSync('attached_assets/user.json', 'utf-8'));
        const idx = users.findIndex((u: any) => String(u.id) === String(sessionUserId));
        if (idx !== -1) {
          users[idx].avatarUrl = avatarUrl;
          fs.writeFileSync('attached_assets/user.json', JSON.stringify(users, null, 2));
        }
      } catch {}

      // Update MongoDB
      try {
        const { User: MongoUser } = await import('./mongodb/models');
        const mongoId = mongoose.Types.ObjectId.isValid(String(sessionUserId))
          ? String(sessionUserId)
          : null;
        if (mongoId) {
          await MongoUser.updateOne({ _id: mongoId }, { $set: { avatarUrl } });
        } else {
          await MongoUser.updateOne({ pgUserId: Number(sessionUserId) }, { $set: { avatarUrl } });
        }
      } catch {}

      res.json({ success: true, avatarUrl });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'فشل رفع الصورة' });
    }
  });

  // ── Update Profile Bio ──
  app.patch('/api/user/profile', async (req: Request, res: Response) => {
    try {
      const sessionUserId = (req.session as any)?.userId;
      if (!sessionUserId) return res.status(401).json({ error: 'يجب تسجيل الدخول أولاً' });

      const { bio, displayName, academicTrack, gradeLevel, studyGoal } = req.body;
      const allowedFields: Record<string, any> = {};
      if (bio !== undefined) allowedFields.bio = String(bio).slice(0, 300);
      if (displayName !== undefined && String(displayName).trim()) allowedFields.displayName = String(displayName).trim().slice(0, 60);
      if (academicTrack !== undefined) allowedFields.academicTrack = academicTrack;
      if (gradeLevel !== undefined) allowedFields.gradeLevel = gradeLevel;
      if (studyGoal !== undefined) allowedFields.studyGoal = studyGoal;

      if (Object.keys(allowedFields).length === 0) return res.status(400).json({ error: 'لا توجد بيانات للتحديث' });

      try {
        const users = JSON.parse(fs.readFileSync('attached_assets/user.json', 'utf-8'));
        const idx = users.findIndex((u: any) => String(u.id) === String(sessionUserId));
        if (idx !== -1) {
          Object.assign(users[idx], allowedFields);
          fs.writeFileSync('attached_assets/user.json', JSON.stringify(users, null, 2));
        }
      } catch {}

      res.json({ success: true, updated: allowedFields });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'فشل تحديث الملف الشخصي' });
    }
  });

  // Admin Login
  app.post("/api/admin/login", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ error: 'اسم المستخدم وكلمة المرور مطلوبان' });
      }

      const admin = await mongoStorage.getAdminByUsername(username);
      if (!admin) {
        return res.status(401).json({ error: 'بيانات الدخول غير صحيحة' });
      }

      const isValid = await mongoStorage.validateAdminPassword(admin, password);
      if (!isValid) {
        return res.status(401).json({ error: 'بيانات الدخول غير صحيحة' });
      }

      await mongoStorage.updateAdminLogin(admin._id.toString());

      (req.session as any).adminId = admin._id.toString();
      (req.session as any).isAdmin = true;
      (req.session as any).admin = {
        adminId: admin._id.toString(),
        username: admin.username,
        fullName: admin.fullName,
        role: admin.role,
        permissions: admin.permissions || ['all'],
      };

      res.json({
        success: true,
        admin: {
          id: admin._id,
          username: admin.username,
          fullName: admin.fullName,
          role: admin.role,
        }
      });
    } catch (error) {
      console.error('Admin login error:', error);
      res.status(500).json({ error: 'خطأ في تسجيل الدخول' });
    }
  });

  // Admin Logout
  app.post("/api/admin/logout", (req: Request, res: Response) => {
    (req.session as any).adminId = null;
    (req.session as any).isAdmin = false;
    (req.session as any).admin = null;
    res.json({ success: true });
  });

  // Admin Session Check - Validates admin exists in database
  app.get("/api/admin/session", async (req: Request, res: Response) => {
    try {
      if ((req.session as any).isAdmin && (req.session as any).adminId) {
        const admin = await mongoStorage.getAdminById((req.session as any).adminId);
        if (admin && admin.isActive !== false) {
          res.json({
            authenticated: true,
            admin: {
              id: admin._id,
              username: admin.username,
              fullName: admin.fullName,
              role: admin.role
            }
          });
        } else {
          (req.session as any).isAdmin = false;
          (req.session as any).adminId = null;
          res.json({ authenticated: false });
        }
      } else {
        res.json({ authenticated: false });
      }
    } catch (error) {
      console.error('Session check error:', error);
      res.json({ authenticated: false });
    }
  });

  // Dashboard Stats
  app.get("/api/admin/dashboard/stats", requireAdmin, async (req: Request, res: Response) => {
    try {
      const stats = await mongoStorage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      res.status(500).json({ error: 'فشل في جلب الإحصائيات' });
    }
  });

  // Get All Users with Pagination
  app.get("/api/admin/users", requireAdmin, async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const search = (req.query.search as string || '').trim().toLowerCase();

      // Load file-based users from user.json
      let fileUsers: any[] = [];
      try {
        fileUsers = JSON.parse(fs.readFileSync("attached_assets/user.json", "utf-8"));
      } catch {}

      // Filter file users by search term
      const filteredFileUsers = search
        ? fileUsers.filter((u: any) =>
            u.name?.toLowerCase().includes(search) ||
            u.email?.toLowerCase().includes(search) ||
            u.username?.toLowerCase().includes(search) ||
            String(u.id).includes(search)
          )
        : fileUsers;

      // Normalize file users to match admin display shape
      const normalizedFileUsers = filteredFileUsers.map((u: any) => ({
        _id: String(u.id),
        id: u.id,
        username: u.username || u.name || u.email,
        fullName: u.name || u.email,
        email: u.email,
        phone: u.phone || '',
        subscriptionType: u.subscription?.type || u.subscriptionType || 'free',
        subscriptionExpiry: u.subscription?.endDate || u.subscriptionExpiry || null,
        createdAt: u.createdAt || null,
        role: u.role || 'student',
        _source: 'file',
      }));

      // Also get MongoDB users (they may overlap — deduplicate by email)
      const { users: mongoUsers } = await mongoStorage.getAllUsers(1, 1000, search || undefined);
      const fileEmails = new Set(normalizedFileUsers.map((u: any) => u.email?.toLowerCase()));
      const uniqueMongoUsers = mongoUsers.filter((u: any) => !fileEmails.has(u.email?.toLowerCase()));

      // Merge: file users first, then unique Mongo users
      const allUsers = [...normalizedFileUsers, ...uniqueMongoUsers];
      const total = allUsers.length;
      const paginated = allUsers.slice((page - 1) * limit, page * limit);

      res.json({
        users: paginated,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      });
    } catch (error) {
      console.error('Error getting users:', error);
      res.status(500).json({ error: 'فشل في جلب الطلاب' });
    }
  });

  // Get User Details
  app.get("/api/admin/users/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const user = await mongoStorage.getUserById(req.params.id);
      if (!user) {
        return res.status(404).json({ error: 'المستخدم غير موجود' });
      }
      res.json(user);
    } catch (error) {
      console.error('Error getting user:', error);
      res.status(500).json({ error: 'فشل في جلب بيانات المستخدم' });
    }
  });

  // Update User
  app.put("/api/admin/users/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const updates = req.body;
      const user = await mongoStorage.updateUser(req.params.id, updates);
      if (!user) {
        return res.status(404).json({ error: 'المستخدم غير موجود' });
      }
      res.json(user);
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({ error: 'فشل في تحديث بيانات المستخدم' });
    }
  });

  // Get User Test Results
  app.get("/api/admin/users/:id/tests", requireAdmin, async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const { results, total } = await mongoStorage.getUserTestResults(req.params.id, page, limit);

      res.json({
        results,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      });
    } catch (error) {
      console.error('Error getting user tests:', error);
      res.status(500).json({ error: 'فشل في جلب نتائج الاختبارات' });
    }
  });

  // Get User Activities
  app.get("/api/admin/users/:id/activities", requireAdmin, async (req: Request, res: Response) => {
    try {
      const activities = await mongoStorage.getUserActivities(req.params.id, 50);
      res.json(activities);
    } catch (error) {
      console.error('Error getting user activities:', error);
      res.status(500).json({ error: 'فشل في جلب سجل النشاط' });
    }
  });

  // Get All Subscriptions with Pagination
  app.get("/api/admin/subscriptions", requireAdmin, async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const status = req.query.status as string;

      const { subscriptions, total } = await mongoStorage.getAllSubscriptions(page, limit, status);

      res.json({
        subscriptions,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      });
    } catch (error) {
      console.error('Error getting subscriptions:', error);
      res.status(500).json({ error: 'فشل في جلب الاشتراكات' });
    }
  });

  // Get Pending Subscriptions
  app.get("/api/admin/subscriptions/pending", requireAdmin, async (req: Request, res: Response) => {
    try {
      const subscriptions = await mongoStorage.getPendingSubscriptions();
      res.json(subscriptions);
    } catch (error) {
      console.error('Error getting pending subscriptions:', error);
      res.status(500).json({ error: 'فشل في جلب الاشتراكات المعلقة' });
    }
  });

  // Approve Subscription
  app.post("/api/admin/subscriptions/:id/approve", requireAdmin, async (req: Request, res: Response) => {
    try {
      const adminId = (req.session as any).adminId;
      const subscription = await mongoStorage.approveSubscription(req.params.id, adminId);

      if (!subscription) {
        return res.status(404).json({ error: 'الاشتراك غير موجود' });
      }

      // Email notification to student on approval is disabled per user preference
      // Admin still gets notified via the admin dashboard

      res.json({ success: true, subscription });
    } catch (error) {
      console.error('Error approving subscription:', error);
      res.status(500).json({ error: 'فشل في الموافقة على الاشتراك' });
    }
  });

  // Reject Subscription
  app.post("/api/admin/subscriptions/:id/reject", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { reason } = req.body;
      const subscription = await mongoStorage.rejectSubscription(req.params.id, reason || 'رفض من المدير');

      if (!subscription) {
        return res.status(404).json({ error: 'الاشتراك غير موجود' });
      }

      res.json({ success: true, subscription });
    } catch (error) {
      console.error('Error rejecting subscription:', error);
      res.status(500).json({ error: 'فشل في رفض الاشتراك' });
    }
  });

  // Get All Test Results
  app.get("/api/admin/tests", requireAdmin, async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const { results, total } = await mongoStorage.getAllTestResults(page, limit);

      res.json({
        results,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      });
    } catch (error) {
      console.error('Error getting test results:', error);
      res.status(500).json({ error: 'فشل في جلب نتائج الاختبارات' });
    }
  });

  // Get Recent Activities
  app.get("/api/admin/activities", requireAdmin, async (req: Request, res: Response) => {
    try {
      const activities = await mongoStorage.getRecentActivities(100);
      res.json(activities);
    } catch (error) {
      console.error('Error getting activities:', error);
      res.status(500).json({ error: 'فشل في جلب سجل النشاط' });
    }
  });

  // ============================================
  // Admin Questions Management Routes
  // ============================================

  const questionImagesDir = path.join(process.cwd(), 'uploads', 'question-images');
  if (!fs.existsSync(questionImagesDir)) fs.mkdirSync(questionImagesDir, { recursive: true });

  const questionImageStorage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, questionImagesDir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `q-img-${Date.now()}-${Math.floor(Math.random() * 1e9)}${ext}`);
    },
  });
  const uploadQuestionImage = multer({
    storage: questionImageStorage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      if (file.mimetype.startsWith('image/')) cb(null, true);
      else cb(new Error('يجب أن يكون الملف صورة'));
    },
  });

  app.use('/uploads/question-images', express.default.static(questionImagesDir));

  app.get("/api/admin/questions", requireAdmin, async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const search = req.query.search as string;
      const category = req.query.category as string;
      const difficulty = req.query.difficulty as string;

      const result = await mongoStorage.getPaginatedQuestions({ page, limit, search, category, difficulty });
      res.json(result);
    } catch (error) {
      console.error('Error getting admin questions:', error);
      res.status(500).json({ error: 'فشل في جلب الأسئلة' });
    }
  });

  app.post("/api/admin/questions/seed-from-json", requireAdmin, async (req: Request, res: Response) => {
    try {
      const questionsPath = path.resolve(process.cwd(), 'server/questions.json');
      if (!fs.existsSync(questionsPath)) {
        return res.status(404).json({ error: 'ملف الأسئلة غير موجود' });
      }
      const data = JSON.parse(fs.readFileSync(questionsPath, 'utf-8'));
      const verbalRaw: any[] = data.verbal || [];
      const quantRaw: any[] = data.quantitative || [];

      const existing = await mongoStorage.getQuestionCount();
      if (existing.total > 0) {
        return res.json({ message: `الأسئلة موجودة بالفعل (${existing.total} سؤال)`, added: 0 });
      }

      const toInsert = [
        ...verbalRaw.map((q: any, i: number) => ({ ...q, category: 'verbal', questionId: i + 1 })),
        ...quantRaw.map((q: any, i: number) => ({ ...q, category: 'quantitative', questionId: verbalRaw.length + i + 1 })),
      ];
      const added = await mongoStorage.bulkCreateQuestions(toInsert);
      res.json({ message: `تم إضافة ${added} سؤال بنجاح`, added });
    } catch (error) {
      console.error('Error seeding questions:', error);
      res.status(500).json({ error: 'فشل في استيراد الأسئلة' });
    }
  });

  app.post("/api/admin/questions", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { text, category, subcategory, options, correctOptionIndex, difficulty, explanation, imageUrl } = req.body;
      if (!text || !category || !options || options.length < 2) {
        return res.status(400).json({ error: 'بيانات ناقصة' });
      }
      const count = await mongoStorage.getQuestionCount();
      const question = await mongoStorage.createQuestion({
        text, category, subcategory: subcategory || 'عام',
        options, correctOptionIndex: correctOptionIndex ?? 0,
        difficulty: difficulty || 'intermediate',
        explanation, imageUrl,
        questionId: count.total + 1,
      });
      res.json(question);
    } catch (error) {
      console.error('Error creating question:', error);
      res.status(500).json({ error: 'فشل في إنشاء السؤال' });
    }
  });

  app.put("/api/admin/questions/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { text, category, subcategory, options, correctOptionIndex, difficulty, explanation, imageUrl } = req.body;
      const updated = await mongoStorage.updateQuestion(req.params.id, {
        text, category, subcategory, options, correctOptionIndex, difficulty, explanation, imageUrl,
      });
      if (!updated) return res.status(404).json({ error: 'السؤال غير موجود' });
      res.json(updated);
    } catch (error) {
      console.error('Error updating question:', error);
      res.status(500).json({ error: 'فشل في تحديث السؤال' });
    }
  });

  app.delete("/api/admin/questions/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const deleted = await mongoStorage.deleteQuestion(req.params.id);
      if (!deleted) return res.status(404).json({ error: 'السؤال غير موجود' });
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting question:', error);
      res.status(500).json({ error: 'فشل في حذف السؤال' });
    }
  });

  app.post("/api/admin/questions/:id/image", requireAdmin, uploadQuestionImage.single('image'), async (req: Request, res: Response) => {
    try {
      if (!req.file) return res.status(400).json({ error: 'لم يتم رفع أي صورة' });
      const imageUrl = `/uploads/question-images/${req.file.filename}`;
      const updated = await mongoStorage.updateQuestion(req.params.id, { imageUrl } as any);
      if (!updated) return res.status(404).json({ error: 'السؤال غير موجود' });
      res.json({ imageUrl });
    } catch (error) {
      console.error('Error uploading question image:', error);
      res.status(500).json({ error: 'فشل في رفع الصورة' });
    }
  });

  app.post("/api/admin/questions/upload-image-standalone", requireAdmin, uploadQuestionImage.single('image'), async (req: Request, res: Response) => {
    try {
      if (!req.file) return res.status(400).json({ error: 'لم يتم رفع أي صورة' });
      const imageUrl = `/uploads/question-images/${req.file.filename}`;
      res.json({ imageUrl });
    } catch (error) {
      console.error('Error uploading standalone image:', error);
      res.status(500).json({ error: 'فشل في رفع الصورة' });
    }
  });

  // ============================================
  // Admin Scheduled Exams Route
  // ============================================

  app.get("/api/admin/scheduled-exams", requireAdmin, async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const status = req.query.status as string;

      const { ExamBooking } = await import('./mongodb/models');
      const query: any = {};
      if (status && status !== 'all') query.status = status;

      const total = await ExamBooking.countDocuments(query);
      const exams = await ExamBooking.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

      res.json({ exams, total, page, limit, totalPages: Math.ceil(total / limit) });
    } catch (error) {
      console.error('Error getting scheduled exams:', error);
      res.status(500).json({ error: 'فشل في جلب الاختبارات' });
    }
  });

  // ============================================
  // Admin Broadcast Email Route
  // ============================================

  app.post("/api/admin/broadcast-email", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { subject, body, targetGroup = 'all' } = req.body;
      if (!subject || !body) {
        return res.status(400).json({ error: 'الموضوع والمحتوى مطلوبان' });
      }

      const mongoEmails = await mongoStorage.getUserEmails(targetGroup);

      let fileEmails: string[] = [];
      const userFilePath = path.resolve(process.cwd(), 'server/user.json');
      if (fs.existsSync(userFilePath)) {
        const fileUsers: any[] = JSON.parse(fs.readFileSync(userFilePath, 'utf-8'));
        fileEmails = fileUsers
          .filter((u: any) => u.email && (targetGroup === 'all' || (targetGroup === 'subscribed' && ['Pro', 'Pro Life', 'Pro Life Plus', 'Pro Live', 'pro', 'pro_life', 'pro_life_plus'].includes(u.subscriptionType || ''))))
          .map((u: any) => u.email);
      }

      const allEmails = Array.from(new Set([...mongoEmails, ...fileEmails])).filter(Boolean);

      if (allEmails.length === 0) {
        return res.json({ sent: 0, failed: 0, message: 'لا يوجد مستخدمون لديهم بريد إلكتروني' });
      }

      const SMTP2GO_API_KEY = process.env.SMTP2GO_API_KEY;
      const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@qodratak.sa';
      if (!SMTP2GO_API_KEY) {
        return res.status(503).json({ error: 'خدمة البريد غير مهيأة' });
      }
      const htmlBody = `
        <div dir="rtl" style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
          <div style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:24px;border-radius:12px 12px 0 0;text-align:center;">
            <h1 style="color:#fff;margin:0;font-size:22px;">منصة قدراتك</h1>
          </div>
          <div style="background:#fff;padding:24px;border:1px solid #e5e7eb;border-radius:0 0 12px 12px;">
            <h2 style="color:#1f2937;margin:0 0 16px;">${subject}</h2>
            <div style="color:#374151;line-height:1.7;white-space:pre-wrap;">${body}</div>
            <div style="margin-top:24px;padding-top:16px;border-top:1px solid #f3f4f6;text-align:center;">
              <p style="color:#9ca3af;font-size:12px;">qodratak.sa</p>
            </div>
          </div>
        </div>`;

      let sent = 0, failed = 0;
      const batchSize = 50;
      for (let i = 0; i < allEmails.length; i += batchSize) {
        const batch = allEmails.slice(i, i + batchSize);
        try {
          const r = await fetch('https://api.smtp2go.com/v3/email/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              api_key: SMTP2GO_API_KEY,
              sender: `منصة قدراتك <${FROM_EMAIL}>`,
              to: batch,
              subject,
              html_body: htmlBody,
              text_body: body,
            }),
          });
          const data: any = await r.json();
          if (data.data?.succeeded) sent += data.data.succeeded;
          else failed += batch.length;
        } catch {
          failed += batch.length;
        }
      }

      res.json({ sent, failed, total: allEmails.length });
    } catch (error) {
      console.error('Error broadcasting email:', error);
      res.status(500).json({ error: 'فشل في إرسال البريد الجماعي' });
    }
  });

  // ============================================
  // User Subscription Routes (with file upload)
  // ============================================

  // Public subscription request - creates user account + pending subscription
  app.post("/api/subscription/subscribe-request", uploadReceipt.single('receipt'), async (req: Request, res: Response) => {
    try {
      const { name, email, password, phone, planKey, paymentMethod } = req.body;
      const sessionUserId = (req.session as any).userId;

      if (!planKey) {
        return res.status(400).json({ message: "نوع الخطة مطلوب" });
      }

      // Logged-in user: no need for password
      if (sessionUserId && !email && !name) {
        return res.status(400).json({ message: "بيانات غير مكتملة" });
      }

      if (!sessionUserId && (!name || !email || !password)) {
        return res.status(400).json({ message: "يرجى إدخال جميع البيانات المطلوبة" });
      }

      const planTypes: Record<string, string> = {
        'pro': 'Pro',
        'proLife': 'Pro Life',
        'proLifePlus': 'Pro Life Plus',
        
      };
      const planType = planTypes[planKey] || 'Pro';

      const prices: Record<string, number> = { 'Pro': 29, 'Pro Life': 74, 'Pro Life Plus': 134 };
      const durations: Record<string, number> = { 'Pro': 30, 'Pro Life': 90, 'Pro Life Plus': 180 };

      // Create or find user
      let users: any[] = [];
      try {
        const data = fs.readFileSync("attached_assets/user.json", "utf-8");
        users = JSON.parse(data);
      } catch {
        fs.writeFileSync("attached_assets/user.json", "[]");
      }

      let user: any = null;

      // If logged in, find user by session ID first (avoids duplicates)
      if (sessionUserId) {
        user = users.find((u: any) => String(u.id) === String(sessionUserId));
      }

      // Fallback to email lookup for guest users
      if (!user && email) {
        const normalizedEmail = email.trim().toLowerCase();
        user = users.find((u: any) => u.email && u.email.trim().toLowerCase() === normalizedEmail);
      }

      if (!user) {
        // Only create new account for guest users (not logged-in users)
        if (sessionUserId) {
          return res.status(400).json({ message: "لم يتم العثور على حساب المستخدم. حاول تسجيل الدخول مجدداً" });
        }
        if (!name || !email || !password || password === '__session__') {
          return res.status(400).json({ message: "يرجى إدخال جميع البيانات المطلوبة" });
        }
        const normalizedEmail = email.trim().toLowerCase();
        const today = new Date();
        user = {
          id: users.length > 0 ? Math.max(...users.map((u: any) => u.id || 0)) + 1 : 1,
          name,
          email: normalizedEmail,
          password,
          phone: phone || '',
          subscription: {
            type: "free",
            startDate: today.toISOString().split('T')[0],
            endDate: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          },
          points: 100,
          level: 1,
          testsTaken: 0,
          averageScore: 0,
          folders: [],
          achievements: [],
          pointsHistory: [{ points: 100, reason: "مكافأة الترحيب", date: today.toISOString() }],
          testHistory: [],
          savedQuestions: []
        };
        users.push(user);
        fs.writeFileSync("attached_assets/user.json", JSON.stringify(users, null, 2));
        try { await storage.updateLeaderboardEntry(user.id, 0, user.name); } catch {}
      }

      // Create pending subscription in MongoDB
      const now = new Date();
      const endDate = new Date(now);
      endDate.setDate(endDate.getDate() + (durations[planType] || 30));

      let receiptUrl = null;
      let receiptFilename = null;
      if (req.file) {
        receiptFilename = req.file.filename;
        receiptUrl = `/uploads/receipts/${req.file.filename}`;
      }

      const subscription = await mongoStorage.createSubscription({
        userId: user.id,
        type: planType as 'free' | 'Pro' | 'Pro Life' | 'Pro Life Plus',
        status: 'pending',
        startDate: now,
        endDate: endDate,
        autoRenew: false,
        paymentMethod: paymentMethod || 'bank',
        transferReceiptUrl: receiptUrl || undefined,
        transferReceiptFilename: receiptFilename || undefined,
        price: prices[planType] || 29,
      });

      try {
        notifyAdminNewSubscription(name, (email || '').trim().toLowerCase(), planType, paymentMethod || 'bank', !!receiptUrl).catch(() => {});
      } catch {}

      res.json({
        success: true,
        subscription,
        user: { id: user.id, name: user.name, email: user.email },
        message: "تم تسجيل طلب الاشتراك بنجاح"
      });
    } catch (error) {
      console.error("Error in subscribe-request:", error);
      return res.status(500).json({ message: "خطأ في تسجيل طلب الاشتراك" });
    }
  });

  // Pay for subscription using wallet balance
  app.post("/api/subscription/pay-with-wallet", requireAuth, async (req: Request, res: Response) => {
    try {
      const sessionUserId = (req.session as any).userId;
      if (!sessionUserId) {
        return res.status(401).json({ message: "يجب تسجيل الدخول أولاً" });
      }

      const { planKey } = req.body;
      if (!planKey) {
        return res.status(400).json({ message: "نوع الخطة مطلوب" });
      }

      const planTypes: Record<string, string> = {
        'pro': 'Pro',
        'proLife': 'Pro Life',
        'proLifePlus': 'Pro Life Plus',
        
      };
      const planType = planTypes[planKey];
      if (!planType) {
        return res.status(400).json({ message: "نوع خطة غير صالح" });
      }

      const prices: Record<string, number> = { 'Pro': 29, 'Pro Life': 74, 'Pro Life Plus': 134 };
      const durations: Record<string, number> = { 'Pro': 30, 'Pro Life': 90, 'Pro Life Plus': 180 };
      const price = prices[planType];

      // Get wallet balance
      const wallet = await mongoStorage.getWallet(String(sessionUserId));
      const balance = wallet?.balance ?? 0;

      if (balance < price) {
        return res.status(400).json({
          message: `رصيد المحفظة غير كافٍ. الرصيد الحالي: ${balance} ريال، مطلوب: ${price} ريال`,
          balance,
          required: price
        });
      }

      // Deduct from wallet
      await mongoStorage.deductFromWallet(
        String(sessionUserId),
        price,
        `اشتراك ${planType} عبر المحفظة`
      );

      // Create active subscription immediately (no admin approval needed)
      const now = new Date();
      const endDate = new Date(now);
      endDate.setDate(endDate.getDate() + (durations[planType] || 30));

      const subscription = await mongoStorage.createSubscription({
        userId: sessionUserId,
        type: planType as 'free' | 'Pro' | 'Pro Life' | 'Pro Life Plus',
        status: 'active',
        startDate: now,
        endDate: endDate,
        autoRenew: false,
        paymentMethod: 'wallet',
        price,
      });

      // Also update the user's subscription in file-based storage
      try {
        const users = JSON.parse(fs.readFileSync("attached_assets/user.json", "utf-8"));
        const userIndex = users.findIndex((u: any) => String(u.id) === String(sessionUserId));
        if (userIndex !== -1) {
          users[userIndex].subscription = {
            type: planType,
            startDate: now.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0]
          };
          fs.writeFileSync("attached_assets/user.json", JSON.stringify(users, null, 2));
        }
      } catch {}

      res.json({
        success: true,
        subscription,
        message: `تم تفعيل اشتراك ${planType} بنجاح عبر المحفظة`
      });
    } catch (error) {
      console.error("Error in pay-with-wallet:", error);
      return res.status(500).json({ message: "خطأ في عملية الدفع بالمحفظة" });
    }
  });

  // Create subscription with receipt upload - Protected by RBAC
  app.post("/api/subscriptions/create", requireAuth, uploadReceipt.single('receipt'), async (req: Request, res: Response) => {
    try {
      const { userId, planType, paymentMethod, transactionId } = req.body;

      if (!userId || !planType) {
        return res.status(400).json({ error: 'بيانات غير مكتملة' });
      }

      const prices: Record<string, number> = {
        'Pro': 99,
        'Pro Life': 299,
        'Pro Life Plus': 499
      };

      const durations: Record<string, number> = {
        'Pro': 30,
        'Pro Life': 365,
        'Pro Life Plus': 999
      };

      const now = new Date();
      const endDate = new Date(now);
      endDate.setDate(endDate.getDate() + (durations[planType] || 30));

      let receiptUrl = null;
      let receiptFilename = null;

      if (req.file) {
        receiptFilename = req.file.filename;
        receiptUrl = `/uploads/receipts/${req.file.filename}`;
      }

      const subscription = await mongoStorage.createSubscription({
        userId,
        type: planType,
        status: 'pending',
        startDate: now,
        endDate: endDate,
        autoRenew: false,
        paymentMethod: paymentMethod || 'manual',
        transactionId: transactionId || undefined,
        transferReceiptUrl: receiptUrl || undefined,
        transferReceiptFilename: receiptFilename || undefined,
        price: prices[planType] || 99,
      });

      // إرسال إشعار للأدمن
      try {
        const sessionEmail = (req.session as any)?.userEmail || '';
        let studentName = sessionEmail;
        try {
          const allUsers = JSON.parse(fs.readFileSync("attached_assets/user.json", "utf-8"));
          const u = allUsers.find((x: any) => String(x.id) === String(userId) || x.email === sessionEmail);
          if (u) studentName = u.fullName || u.name || u.username || sessionEmail;
        } catch {}
        notifyAdminNewSubscription(studentName, sessionEmail, planType, paymentMethod || 'manual', !!receiptUrl).catch(() => {});
      } catch {}

      res.json({ success: true, subscription });
    } catch (error) {
      console.error('Error creating subscription:', error);
      res.status(500).json({ error: 'فشل في إنشاء الاشتراك' });
    }
  });

  // Upload receipt for existing subscription - Protected by RBAC
  app.post("/api/subscriptions/:id/upload-receipt", requireAuth, uploadReceipt.single('receipt'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'لم يتم رفع أي ملف' });
      }

      const receiptUrl = `/uploads/receipts/${req.file.filename}`;
      const receiptFilename = req.file.filename;

      const subscription = await mongoStorage.updateSubscription(req.params.id, {
        transferReceiptUrl: receiptUrl,
        transferReceiptFilename: receiptFilename,
      });

      if (!subscription) {
        return res.status(404).json({ error: 'الاشتراك غير موجود' });
      }

      // إرسال إشعار للأدمن عند رفع سند جديد
      try {
        const sessionEmail = (req.session as any)?.userEmail || '';
        let studentName = sessionEmail;
        let planName = (subscription as any)?.type || 'غير محدد';
        try {
          const allUsers = JSON.parse(fs.readFileSync("attached_assets/user.json", "utf-8"));
          const u = allUsers.find((x: any) => x.email === sessionEmail);
          if (u) studentName = u.fullName || u.name || u.username || sessionEmail;
        } catch {}
        notifyAdminReceiptUploaded(studentName, sessionEmail, planName).catch(() => {});
      } catch {}

      res.json({ success: true, subscription });
    } catch (error) {
      console.error('Error uploading receipt:', error);
      res.status(500).json({ error: 'فشل في رفع سند التحويل' });
    }
  });

  // Get user's subscriptions
  app.get("/api/subscriptions/user/:userId", async (req: Request, res: Response) => {
    try {
      const subscriptions = await mongoStorage.getUserSubscriptions(req.params.userId);
      res.json(subscriptions);
    } catch (error) {
      console.error('Error getting user subscriptions:', error);
      res.status(500).json({ error: 'فشل في جلب الاشتراكات' });
    }
  });

  // Check active subscription
  app.get("/api/subscriptions/active/:userId", async (req: Request, res: Response) => {
    try {
      const subscription = await mongoStorage.getActiveSubscription(req.params.userId);
      res.json({ hasActiveSubscription: !!subscription, subscription });
    } catch (error) {
      console.error('Error checking subscription:', error);
      res.status(500).json({ error: 'فشل في التحقق من الاشتراك' });
    }
  });

  // ── OTP & EMAIL VERIFICATION ──────────────────────────────────

  app.post('/api/auth/send-otp', async (req: Request, res: Response) => {
    try {
      const { email, fullName } = req.body;
      if (!email) {
        return res.status(400).json({ error: 'البريد الإلكتروني مطلوب' });
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

      await mongoStorage.setUserOTP(email, otp, otpExpiry);

      const { sendOTPEmail } = await import('./services/emailService');
      const sent = await sendOTPEmail(email, fullName || '', otp);

      if (!sent) {
        return res.status(500).json({ error: 'فشل في إرسال البريد الإلكتروني. تحقق من صحة البريد.' });
      }

      res.json({ success: true, message: 'تم إرسال رمز التحقق إلى بريدك الإلكتروني' });
    } catch (error) {
      console.error('Send OTP error:', error);
      res.status(500).json({ error: 'حدث خطأ أثناء إرسال رمز التحقق' });
    }
  });

  app.post('/api/auth/verify-otp', async (req: Request, res: Response) => {
    try {
      const { email, otp } = req.body;
      if (!email || !otp) {
        return res.status(400).json({ error: 'البريد الإلكتروني ورمز التحقق مطلوبان' });
      }

      const result = await mongoStorage.verifyUserOTP(email, otp);
      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      const { sendWelcomeEmail } = await import('./services/emailService');
      try {
        const user = await mongoStorage.getUserByEmail(email);
        if (user) {
          await sendWelcomeEmail(email, user.fullName || user.username);
        }
      } catch (e) {}

      res.json({ success: true, message: 'تم التحقق من بريدك الإلكتروني بنجاح' });
    } catch (error) {
      console.error('Verify OTP error:', error);
      res.status(500).json({ error: 'حدث خطأ أثناء التحقق من الرمز' });
    }
  });

  app.post('/api/auth/activate-free-trial', async (req: Request, res: Response) => {
    try {
      const { userId, email } = req.body;
      if (!userId || !email) {
        return res.status(400).json({ error: 'معرف المستخدم والبريد مطلوبان' });
      }

      const alreadyUsed = await mongoStorage.checkFreeTrialUsed(email);
      if (alreadyUsed) {
        return res.status(400).json({ error: 'تم استخدام التجربة المجانية لهذا البريد الإلكتروني من قبل' });
      }

      const trialEndDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

      await mongoStorage.activateFreeTrial(userId, email, trialEndDate);

      await mongoStorage.createSubscription({
        userId: userId,
        type: 'Pro',
        status: 'active',
        startDate: new Date(),
        endDate: trialEndDate,
        autoRenew: false,
        paymentMethod: 'manual',
        price: 0,
        notes: 'تجربة مجانية - مرتبطة ببريد: ' + email,
      });

      res.json({
        success: true,
        message: 'تم تفعيل التجربة المجانية لمدة 3 أيام',
        trialEndDate,
      });
    } catch (error) {
      console.error('Activate free trial error:', error);
      res.status(500).json({ error: 'فشل في تفعيل التجربة المجانية' });
    }
  });

  // ── STUDENT CHAT ──────────────────────────────────────────────

  app.get('/api/chat/messages', async (req: Request, res: Response) => {
    try {
      const { userId } = req.query;
      if (!userId) return res.status(400).json({ error: 'userId مطلوب' });

      const { getConnectionStatus } = await import('./mongodb/connection');
      if (!getConnectionStatus()) return res.json({ messages: [] });

      const { ChatMessage } = await import('./mongodb/models');
      const messages = await ChatMessage.find({
        $or: [
          { fromUserId: String(userId) },
          { toUserId: String(userId) }
        ]
      }).sort({ createdAt: 1 }).limit(100);

      await ChatMessage.updateMany(
        { toUserId: String(userId), isRead: false },
        { isRead: true }
      );

      res.json({ messages });
    } catch (error) {
      res.status(500).json({ error: 'فشل في جلب الرسائل' });
    }
  });

  app.post('/api/chat/send', async (req: Request, res: Response) => {
    try {
      const { fromUserId, fromUserName, content } = req.body;
      if (!fromUserId || !content?.trim()) {
        return res.status(400).json({ error: 'البيانات مطلوبة' });
      }

      const { getConnectionStatus } = await import('./mongodb/connection');
      if (!getConnectionStatus()) {
        return res.status(503).json({ error: 'خدمة الشات غير متاحة حالياً' });
      }

      const { ChatMessage } = await import('./mongodb/models');
      const message = await ChatMessage.create({
        fromUserId,
        fromUserName: fromUserName || 'طالب',
        fromUserRole: 'student',
        toUserId: 'admin',
        content: content.trim(),
        isRead: false,
      });

      const { wss } = await import('./websocket');
      wss.broadcastToAdmins({ type: 'new_message', message });

      res.status(201).json({ success: true, message });
    } catch (error) {
      res.status(500).json({ error: 'فشل في إرسال الرسالة' });
    }
  });

  app.get('/api/chat/unread-count', async (req: Request, res: Response) => {
    try {
      const { userId } = req.query;
      if (!userId) return res.status(400).json({ error: 'userId مطلوب' });

      const { getConnectionStatus } = await import('./mongodb/connection');
      if (!getConnectionStatus()) {
        return res.json({ count: 0 });
      }

      const { ChatMessage } = await import('./mongodb/models');
      const count = await ChatMessage.countDocuments({
        toUserId: String(userId),
        isRead: false,
      });

      res.json({ count });
    } catch (error) {
      res.json({ count: 0 });
    }
  });

  // ── WEBAUTHN ──────────────────────────────────────────────────

  app.post('/api/auth/webauthn/register-options', async (req: Request, res: Response) => {
    try {
      const { userId, username } = req.body;
      if (!userId || !username) {
        return res.status(400).json({ error: 'userId و username مطلوبان' });
      }

      const sessionEmail = (req.session as any)?.userEmail;
      let existingIds: string[] = [];
      if (sessionEmail) {
        const mongoUser = await mongoStorage.getUserByEmail(sessionEmail);
        existingIds = (mongoUser as any)?.webauthnCredentials?.map((c: any) => c.credentialID) || [];
      }

      const { getRegistrationOptions } = await import('./services/webauthnService');
      const requestOrigin = req.headers.origin || req.headers.referer?.replace(/\/$/, '').split('/').slice(0,3).join('/');
      const options = await getRegistrationOptions(String(userId), username, existingIds, requestOrigin);

      res.json(options);
    } catch (error: any) {
      console.error('WebAuthn register-options error:', error);
      res.status(500).json({ error: 'فشل في إنشاء خيارات التسجيل' });
    }
  });

  app.post('/api/auth/webauthn/register-verify', async (req: Request, res: Response) => {
    try {
      const { userId, response, deviceName } = req.body;
      if (!userId || !response) {
        return res.status(400).json({ error: 'البيانات مطلوبة' });
      }

      const { verifyRegistration } = await import('./services/webauthnService');
      const requestOrigin = req.headers.origin || req.headers.referer?.replace(/\/$/, '').split('/').slice(0,3).join('/');
      const result = await verifyRegistration(String(userId), response, requestOrigin);

      if (!result.verified) {
        return res.status(400).json({ error: 'فشل التحقق من البصمة' });
      }

      const { User } = await import('./mongodb/models');
      const sessionEmail = (req.session as any)?.userEmail;
      const bodyUserId = req.body.userId;

      if (!sessionEmail && !bodyUserId) {
        return res.status(401).json({ error: 'يجب تسجيل الدخول أولاً' });
      }

      const userQuery = sessionEmail
        ? { email: sessionEmail }
        : { $or: [{ _id: bodyUserId }, { id: bodyUserId }] };

      await User.findOneAndUpdate(
        userQuery,
        {
          $push: {
            webauthnCredentials: {
              credentialID: result.credentialID,
              credentialPublicKey: result.credentialPublicKey,
              counter: result.counter,
              deviceName: deviceName || 'جهازي',
              createdAt: new Date(),
            }
          },
          $setOnInsert: { username: sessionEmail, password: 'external-auth', email: sessionEmail, role: 'student' }
        },
        { upsert: true, new: true }
      );

      res.json({ success: true, message: 'تم تسجيل البصمة بنجاح' });
    } catch (error: any) {
      console.error('WebAuthn register-verify error:', error);
      res.status(500).json({ error: error.message || 'فشل التحقق من البصمة' });
    }
  });

  app.post('/api/auth/webauthn/login-options', async (req: Request, res: Response) => {
    try {
      const { email } = req.body;

      let credentialIds: string[] = [];
      if (email) {
        const { User } = await import('./mongodb/models');
        const user = await User.findOne({ email });
        credentialIds = user?.webauthnCredentials?.map((c: any) => c.credentialID) || [];
      }

      const { getAuthenticationOptions } = await import('./services/webauthnService');
      const requestOrigin = req.headers.origin || req.headers.referer?.replace(/\/$/, '').split('/').slice(0,3).join('/');
      const options = await getAuthenticationOptions(credentialIds, requestOrigin);

      res.json(options);
    } catch (error: any) {
      console.error('WebAuthn login-options error:', error);
      res.status(500).json({ error: 'فشل في إنشاء خيارات تسجيل الدخول' });
    }
  });

  app.post('/api/auth/webauthn/login-verify', async (req: Request, res: Response) => {
    try {
      const { email, response } = req.body;
      if (!email || !response) {
        return res.status(400).json({ error: 'البيانات مطلوبة' });
      }

      const { User } = await import('./mongodb/models');
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ error: 'البريد الإلكتروني غير موجود' });
      }

      const credentialID = response.id;
      const credential = user.webauthnCredentials?.find((c: any) => c.credentialID === credentialID);

      if (!credential) {
        return res.status(400).json({ error: 'البصمة غير مسجلة لهذا الحساب' });
      }

      const { verifyAuthentication } = await import('./services/webauthnService');
      const requestOrigin = req.headers.origin || req.headers.referer?.replace(/\/$/, '').split('/').slice(0,3).join('/');
      const result = await verifyAuthentication(response, {
        credentialID: credential.credentialID,
        credentialPublicKey: credential.credentialPublicKey,
        counter: credential.counter,
      }, requestOrigin);

      if (!result.verified) {
        return res.status(400).json({ error: 'فشل التحقق من البصمة' });
      }

      await User.findByIdAndUpdate(user._id, {
        'webauthnCredentials.$[elem].counter': result.newCounter,
        lastLogin: new Date(),
      }, {
        arrayFilters: [{ 'elem.credentialID': credentialID }]
      });

      // Look up the PostgreSQL user ID by email (for session compatibility)
      let pgUserId: number | string = user._id.toString();
      try {
        const pgUsers: any[] = JSON.parse(fs.readFileSync('attached_assets/user.json', 'utf8'));
        const pgUser = pgUsers.find((u: any) => u.email === user.email);
        if (pgUser) pgUserId = pgUser.id;
      } catch (_) {}

      const userData = {
        id: pgUserId,
        username: user.username || user.email,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        points: user.points,
        level: user.level,
      };

      (req.session as any).userId = pgUserId;
      (req.session as any).userEmail = user.email;
      (req.session as any).userRole = user.role;

      res.json({ success: true, user: userData });
    } catch (error: any) {
      console.error('WebAuthn login-verify error:', error);
      res.status(500).json({ error: error.message || 'فشل تسجيل الدخول بالبصمة' });
    }
  });

  app.get('/api/auth/webauthn/credentials', async (req: Request, res: Response) => {
    try {
      const sessionEmail = (req.session as any)?.userEmail;
      if (!sessionEmail) return res.status(401).json({ error: 'يجب تسجيل الدخول أولاً' });

      const { User } = await import('./mongodb/models');
      const user = await User.findOne({ email: sessionEmail });
      if (!user) return res.json({ credentials: [], hasCredentials: false });

      const credentials = (user.webauthnCredentials || []).map((c: any) => ({
        credentialID: c.credentialID,
        deviceName: c.deviceName || 'جهاز',
        createdAt: c.createdAt,
      }));

      res.json({ credentials, hasCredentials: credentials.length > 0 });
    } catch (error) {
      res.status(500).json({ error: 'فشل في جلب بيانات البصمة' });
    }
  });

  app.delete('/api/auth/webauthn/credentials/:credentialId', async (req: Request, res: Response) => {
    try {
      const sessionEmail = (req.session as any)?.userEmail;
      const { credentialId } = req.params;

      if (!sessionEmail) return res.status(401).json({ error: 'يجب تسجيل الدخول أولاً' });

      const { User } = await import('./mongodb/models');
      await User.findOneAndUpdate({ email: sessionEmail }, {
        $pull: { webauthnCredentials: { credentialID: credentialId } }
      });

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'فشل في حذف البصمة' });
    }
  });

  // ========== PIN Endpoints ==========
  app.post('/api/auth/set-pin', async (req: Request, res: Response) => {
    try {
      const sessionEmail = (req.session as any)?.userEmail;
      if (!sessionEmail) return res.status(401).json({ error: 'يجب تسجيل الدخول أولاً' });
      const { pin } = req.body;
      if (!pin || !/^\d{6}$/.test(pin)) return res.status(400).json({ error: 'الرمز يجب أن يكون 6 أرقام' });
      const bcrypt = await import('bcryptjs');
      const pinHash = await bcrypt.default.hash(pin, 10);
      const { User } = await import('./mongodb/models');
      await User.findOneAndUpdate(
        { email: sessionEmail },
        { $set: { pinHash }, $setOnInsert: { username: sessionEmail, password: 'external-auth', email: sessionEmail, role: 'student' } },
        { upsert: true, new: true }
      );
      res.json({ success: true, message: 'تم تعيين الرمز السري بنجاح' });
    } catch (error) {
      console.error('set-pin error:', error);
      res.status(500).json({ error: 'فشل في تعيين الرمز السري' });
    }
  });

  app.post('/api/auth/verify-pin', async (req: Request, res: Response) => {
    try {
      const { pin } = req.body;
      if (!pin) return res.status(400).json({ error: 'بيانات ناقصة' });
      const sessionEmail = (req.session as any)?.userEmail;
      if (!sessionEmail) return res.status(401).json({ error: 'يجب تسجيل الدخول أولاً' });
      const { User } = await import('./mongodb/models');
      const user = await User.findOne({ email: sessionEmail }, { pinHash: 1 });
      if (!user?.pinHash) return res.status(404).json({ error: 'لم يتم تعيين رمز سري لهذا الحساب' });
      const bcrypt = await import('bcryptjs');
      const valid = await bcrypt.default.compare(pin, user.pinHash);
      if (!valid) return res.status(401).json({ error: 'رمز سري غير صحيح' });
      res.json({ success: true });
    } catch (error) {
      console.error('verify-pin error:', error);
      res.status(500).json({ error: 'فشل في التحقق من الرمز السري' });
    }
  });

  app.post('/api/auth/login-pin', async (req: Request, res: Response) => {
    try {
      const { email, pin } = req.body;
      if (!email || !pin) return res.status(400).json({ error: 'البريد والرمز مطلوبان' });
      if (!/^\d{6}$/.test(pin)) return res.status(400).json({ error: 'الرمز يجب أن يكون 6 أرقام' });
      const { User } = await import('./mongodb/models');
      const user = await User.findOne({ email: email.trim().toLowerCase() });
      if (!user) return res.status(404).json({ error: 'لا يوجد حساب بهذا البريد' });
      if (!user.pinHash) return res.status(404).json({ error: 'لم يتم تعيين رمز سري لهذا الحساب' });
      const bcrypt = await import('bcryptjs');
      const valid = await bcrypt.default.compare(pin, user.pinHash);
      if (!valid) return res.status(401).json({ error: 'رمز سري غير صحيح' });
      (req.session as any).userEmail = user.email;
      (req.session as any).userRole = user.role || 'student';
      const { password: _p, pinHash: _ph, ...safeUser } = user.toObject() as any;
      res.json({ success: true, user: safeUser });
    } catch (error) {
      console.error('login-pin error:', error);
      res.status(500).json({ error: 'فشل في تسجيل الدخول بالرمز السري' });
    }
  });

  // ========== 2FA Routes (TOTP / Email OTP / Push / Recovery) ==========

  // GET /api/auth/2fa/status  — current 2FA config for the logged-in user
  app.get('/api/auth/2fa/status', async (req: Request, res: Response) => {
    try {
      const sessionEmail = (req.session as any)?.userEmail;
      if (!sessionEmail) return res.status(401).json({ error: 'غير مصرح' });
      const { User } = await import('./mongodb/models');
      const user = await User.findOne({ email: sessionEmail }, {
        twoFactorEnabled: 1, twoFactorMethods: 1, totpSecret: 1, pinHash: 1,
        webauthnCredentials: 1, recoveryPassphrase: 1
      });
      if (!user) return res.status(404).json({ error: 'المستخدم غير موجود' });
      res.json({
        twoFactorEnabled: user.twoFactorEnabled || false,
        twoFactorMethods: user.twoFactorMethods || [],
        hasTOTP: !!user.totpSecret,
        hasPIN: !!user.pinHash,
        hasPasskey: (user.webauthnCredentials || []).length > 0,
        hasRecovery: !!user.recoveryPassphrase,
      });
    } catch (e) {
      console.error('2fa-status error:', e);
      res.status(500).json({ error: 'خطأ في السيرفر' });
    }
  });

  // GET /api/auth/security-status — check if user has any security method set up
  app.get('/api/auth/security-status', async (req: Request, res: Response) => {
    try {
      const sessionUserId = (req.session as any)?.userId;
      const sessionEmail = (req.session as any)?.userEmail;
      if (!sessionUserId && !sessionEmail) return res.status(401).json({ error: 'غير مصرح' });
      const { User } = await import('./mongodb/models');
      const isMongoId = sessionUserId && mongoose.Types.ObjectId.isValid(String(sessionUserId)) && String(sessionUserId).length === 24;
      const query = isMongoId ? { _id: sessionUserId } : { email: sessionEmail };
      const user = await User.findOne(query, { pinHash: 1, webauthnCredentials: 1, securitySetupDone: 1 });
      if (!user) return res.json({ hasPIN: false, hasBiometric: false, securitySetupDone: true, needsSetup: false });
      const hasPIN = !!user.pinHash;
      const hasBiometric = (user.webauthnCredentials || []).length > 0;
      res.json({
        hasPIN,
        hasBiometric,
        securitySetupDone: user.securitySetupDone || hasPIN || hasBiometric,
        needsSetup: !hasPIN && !hasBiometric && !user.securitySetupDone,
      });
    } catch (e) {
      console.error('security-status error:', e);
      res.status(500).json({ error: 'خطأ في السيرفر' });
    }
  });

  // POST /api/auth/security-setup/set-pin — set a PIN for security gate
  app.post('/api/auth/security-setup/set-pin', async (req: Request, res: Response) => {
    try {
      const sessionUserId = (req.session as any)?.userId;
      const sessionEmail = (req.session as any)?.userEmail;
      if (!sessionUserId && !sessionEmail) return res.status(401).json({ error: 'غير مصرح' });
      const { pin } = req.body;
      if (!pin || pin.length < 4) return res.status(400).json({ error: 'الرمز يجب أن يكون 4 أرقام على الأقل' });
      const bcrypt = await import('bcryptjs');
      const pinHash = await bcrypt.hash(pin, 10);
      const { User } = await import('./mongodb/models');
      const isMongoId2 = sessionUserId && mongoose.Types.ObjectId.isValid(String(sessionUserId)) && String(sessionUserId).length === 24;
      const query = isMongoId2 ? { _id: sessionUserId } : { email: sessionEmail };
      if (query.email || isMongoId2) await User.findOneAndUpdate(query, { pinHash, securitySetupDone: true });
      res.json({ success: true });
    } catch (e) {
      console.error('set-pin error:', e);
      res.status(500).json({ error: 'خطأ في السيرفر' });
    }
  });

  // POST /api/auth/security-setup/skip — user chooses to skip for now
  app.post('/api/auth/security-setup/skip', async (req: Request, res: Response) => {
    try {
      const sessionUserId = (req.session as any)?.userId;
      const sessionEmail = (req.session as any)?.userEmail;
      if (!sessionUserId && !sessionEmail) return res.status(401).json({ error: 'غير مصرح' });
      const { User } = await import('./mongodb/models');
      const isMongoId3 = sessionUserId && mongoose.Types.ObjectId.isValid(String(sessionUserId)) && String(sessionUserId).length === 24;
      const query = isMongoId3 ? { _id: sessionUserId } : { email: sessionEmail };
      if (query.email || isMongoId3) await User.findOneAndUpdate(query, { securitySetupDone: true });
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: 'خطأ في السيرفر' });
    }
  });

  // POST /api/auth/2fa/setup-totp  — generate secret + QR URI
  app.post('/api/auth/2fa/setup-totp', async (req: Request, res: Response) => {
    try {
      const sessionEmail = (req.session as any)?.userEmail;
      if (!sessionEmail) return res.status(401).json({ error: 'غير مصرح' });
      const otplib = await import('otplib/functional') as any;
      const secret: string = otplib.generateSecret({});
      const appName = 'قدراتك';
      const otpAuthUrl: string = otplib.generateURI({ label: sessionEmail, issuer: appName, secret });
      const QRCode = await import('qrcode');
      const qrDataUrl = await QRCode.default.toDataURL(otpAuthUrl);
      (req.session as any).pendingTotpSecret = secret;
      await new Promise<void>((resolve, reject) =>
        req.session.save((err) => err ? reject(err) : resolve())
      );
      res.json({ secret, qrDataUrl, otpAuthUrl });
    } catch (e) {
      console.error('setup-totp error:', e);
      res.status(500).json({ error: 'فشل إنشاء رمز TOTP' });
    }
  });

  // POST /api/auth/2fa/verify-totp-setup  — confirm first TOTP code
  app.post('/api/auth/2fa/verify-totp-setup', async (req: Request, res: Response) => {
    try {
      const sessionEmail = (req.session as any)?.userEmail;
      const pendingSecret = (req.session as any)?.pendingTotpSecret;
      if (!sessionEmail || !pendingSecret) return res.status(401).json({ error: 'جلسة منتهية' });
      const { code } = req.body;
      if (!code) return res.status(400).json({ error: 'الرمز مطلوب' });
      const otplib = await import('otplib/functional') as any;
      const result = otplib.verifySync({ token: String(code), secret: pendingSecret, epochTolerance: 90 });
      if (!result?.valid) return res.status(400).json({ error: 'رمز غير صحيح، تأكد من الوقت وأعد المحاولة' });
      const { User } = await import('./mongodb/models');
      await User.findOneAndUpdate(
        { email: sessionEmail },
        { $addToSet: { twoFactorMethods: 'totp' }, $set: { totpSecret: pendingSecret, twoFactorEnabled: true } }
      );
      delete (req.session as any).pendingTotpSecret;
      req.session.save(() => {});
      res.json({ success: true, message: 'تم تفعيل التحقق الثنائي بنجاح!' });
    } catch (e) {
      console.error('verify-totp-setup error:', e);
      res.status(500).json({ error: 'فشل تفعيل TOTP' });
    }
  });

  // POST /api/auth/2fa/disable-totp
  app.post('/api/auth/2fa/disable-totp', async (req: Request, res: Response) => {
    try {
      const sessionEmail = (req.session as any)?.userEmail;
      if (!sessionEmail) return res.status(401).json({ error: 'غير مصرح' });
      const { User } = await import('./mongodb/models');
      await User.findOneAndUpdate(
        { email: sessionEmail },
        { $unset: { totpSecret: '' }, $pull: { twoFactorMethods: 'totp' as any } }
      );
      const user = await User.findOne({ email: sessionEmail }, { twoFactorMethods: 1 });
      const methods = user?.twoFactorMethods || [];
      if (methods.length === 0) {
        await User.findOneAndUpdate({ email: sessionEmail }, { $set: { twoFactorEnabled: false } });
      }
      res.json({ success: true });
    } catch (e) {
      console.error('disable-totp error:', e);
      res.status(500).json({ error: 'فشل تعطيل TOTP' });
    }
  });

  // POST /api/auth/2fa/set-recovery  — set recovery passphrase
  app.post('/api/auth/2fa/set-recovery', async (req: Request, res: Response) => {
    try {
      const sessionEmail = (req.session as any)?.userEmail;
      if (!sessionEmail) return res.status(401).json({ error: 'غير مصرح' });
      const { passphrase } = req.body;
      if (!passphrase || passphrase.trim().length < 8) return res.status(400).json({ error: 'العبارة يجب أن تكون 8 أحرف على الأقل' });
      const bcrypt = await import('bcryptjs');
      const hash = await bcrypt.default.hash(passphrase.trim(), 10);
      const { User } = await import('./mongodb/models');
      await User.findOneAndUpdate({ email: sessionEmail }, {
        $set: { recoveryPassphrase: hash },
        $addToSet: { twoFactorMethods: 'recovery' }
      });
      res.json({ success: true, message: 'تم حفظ عبارة الاسترداد' });
    } catch (e) {
      console.error('set-recovery error:', e);
      res.status(500).json({ error: 'فشل حفظ عبارة الاسترداد' });
    }
  });

  // POST /api/auth/2fa/send-email-otp  — send Email OTP for 2FA login
  app.post('/api/auth/2fa/send-email-otp', async (req: Request, res: Response) => {
    try {
      const pending = (req.session as any)?.pending2FA;
      if (!pending?.userId) return res.status(401).json({ error: 'لا توجد جلسة تحقق نشطة' });
      const { User } = await import('./mongodb/models');
      const user = await User.findById(pending.userId);
      if (!user?.email) return res.status(404).json({ error: 'لا يوجد بريد إلكتروني مسجل' });
      const code = String(Math.floor(100000 + Math.random() * 900000));
      const expiry = new Date(Date.now() + 10 * 60 * 1000);
      await User.findByIdAndUpdate(pending.userId, { $set: { otpCode: code, otpExpiry: expiry } });
      // Send email using SMTP2GO if configured
      try {
        const nodemailer = await import('nodemailer');
        const transporter = nodemailer.default.createTransport({
          host: process.env.SMTP_HOST || 'mail.smtp2go.com',
          port: Number(process.env.SMTP_PORT || 587),
          auth: { user: process.env.SMTP_USER || '', pass: process.env.SMTP_PASS || '' },
        });
        await transporter.sendMail({
          from: `"قدراتك" <${process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@qodratak.sa'}>`,
          to: user.email,
          subject: 'رمز التحقق الثنائي - قدراتك',
          html: `<div dir="rtl" style="font-family:Arial;max-width:400px;margin:auto;padding:20px;border:1px solid #eee;border-radius:8px">
            <h2 style="color:#2563eb">رمز التحقق الثنائي</h2>
            <p>رمزك الخاص لمدة 10 دقائق:</p>
            <div style="font-size:32px;font-weight:bold;color:#1d4ed8;letter-spacing:8px;text-align:center;padding:20px;background:#eff6ff;border-radius:8px">${code}</div>
            <p style="color:#666;font-size:12px;margin-top:16px">إذا لم تطلب هذا الرمز، تجاهل هذه الرسالة.</p>
          </div>`
        });
      } catch (mailErr) {
        console.warn('Email OTP send failed (SMTP not configured?):', mailErr);
      }
      res.json({ success: true, message: `تم إرسال الرمز إلى ${user.email.replace(/(.{2}).+(@.+)/, '$1***$2')}` });
    } catch (e) {
      console.error('send-email-otp error:', e);
      res.status(500).json({ error: 'فشل إرسال الرمز' });
    }
  });

  // POST /api/auth/2fa/push-challenge  — generate push challenge (3 choices)
  app.post('/api/auth/2fa/push-challenge', async (req: Request, res: Response) => {
    try {
      const pending = (req.session as any)?.pending2FA;
      if (!pending?.userId) return res.status(401).json({ error: 'لا توجد جلسة تحقق نشطة' });
      const correctCode = Math.floor(10 + Math.random() * 90);
      const decoys = new Set<number>([correctCode]);
      while (decoys.size < 3) decoys.add(Math.floor(10 + Math.random() * 90));
      const choices = Array.from(decoys).sort(() => Math.random() - 0.5);
      const { User } = await import('./mongodb/models');
      await User.findByIdAndUpdate(pending.userId, {
        $set: { pushChallenge: { code: correctCode, expiresAt: new Date(Date.now() + 5 * 60 * 1000) } }
      });
      (req.session as any).pending2FA = { ...pending, pushCode: correctCode };
      req.session.save(() => {});
      res.json({ choices });
    } catch (e) {
      console.error('push-challenge error:', e);
      res.status(500).json({ error: 'فشل إنشاء تحدي الموافقة' });
    }
  });

  // POST /api/auth/verify-2fa  — verify any 2FA method and complete login
  app.post('/api/auth/verify-2fa', async (req: Request, res: Response) => {
    try {
      const pending = (req.session as any)?.pending2FA;
      if (!pending?.userId) return res.status(401).json({ error: 'لا توجد جلسة تحقق نشطة' });
      const { method, code } = req.body;
      if (!method) return res.status(400).json({ error: 'طريقة التحقق مطلوبة' });
      const { User } = await import('./mongodb/models');
      const user = await User.findById(pending.userId);
      if (!user) return res.status(404).json({ error: 'المستخدم غير موجود' });
      let verified = false;

      if (method === 'totp') {
        if (!user.totpSecret) return res.status(400).json({ error: 'TOTP غير مفعّل' });
        const otplib = await import('otplib/functional') as any;
        const result = otplib.verifySync({ token: String(code), secret: user.totpSecret, epochTolerance: 90 });
        verified = result?.valid === true;
      } else if (method === 'email') {
        if (!user.otpCode || !user.otpExpiry) return res.status(400).json({ error: 'لم يتم إرسال رمز بعد' });
        if (new Date() > new Date(user.otpExpiry)) return res.status(400).json({ error: 'انتهت صلاحية الرمز' });
        verified = String(code) === String(user.otpCode);
        if (verified) await User.findByIdAndUpdate(user._id, { $unset: { otpCode: '', otpExpiry: '' } });
      } else if (method === 'push') {
        const pushCode = pending.pushCode ?? user.pushChallenge?.code;
        if (!pushCode) return res.status(400).json({ error: 'لا يوجد تحدي نشط' });
        if (user.pushChallenge?.expiresAt && new Date() > new Date(user.pushChallenge.expiresAt)) {
          return res.status(400).json({ error: 'انتهت صلاحية التحدي' });
        }
        verified = Number(code) === Number(pushCode);
        if (verified) await User.findByIdAndUpdate(user._id, { $unset: { pushChallenge: '' } });
      } else if (method === 'recovery') {
        if (!user.recoveryPassphrase) return res.status(400).json({ error: 'عبارة الاسترداد غير مضبوطة' });
        const bcrypt = await import('bcryptjs');
        verified = await bcrypt.default.compare(String(code), user.recoveryPassphrase);
      } else {
        return res.status(400).json({ error: 'طريقة تحقق غير معروفة' });
      }

      if (!verified) return res.status(401).json({ error: 'الرمز غير صحيح، حاول مجدداً' });

      // 2FA passed — complete login
      delete (req.session as any).pending2FA;
      (req.session as any).userId = String(user._id);
      (req.session as any).userEmail = user.email;
      (req.session as any).userRole = user.role || 'student';
      await new Promise<void>((resolve, reject) =>
        req.session.save((err) => err ? reject(err) : resolve())
      );
      const { password: _p, pinHash: _ph, totpSecret: _ts, recoveryPassphrase: _rp, otpCode: _oc, ...safeUser } = user.toObject() as any;
      res.json({ success: true, user: { ...safeUser, id: String(user._id) } });
    } catch (e) {
      console.error('verify-2fa error:', e);
      res.status(500).json({ error: 'فشل التحقق' });
    }
  });

  // ========== Password Reset ==========
  app.post('/api/auth/forgot-password', async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ error: 'البريد الإلكتروني مطلوب' });
      const emailLower = email.trim().toLowerCase();

      const token = crypto.randomBytes(32).toString('hex');
      const expiry = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      const appUrl = (process.env.APP_URL || 'http://localhost:5000').replace(/\/$/, '');
      const resetUrl = `${appUrl}/reset-password?token=${token}`;

      // Check user.json first
      let users: any[] = [];
      try { users = JSON.parse(fs.readFileSync("attached_assets/user.json", "utf-8")); } catch {}
      const userIdx = users.findIndex((u: any) => u.email?.toLowerCase() === emailLower);

      if (userIdx !== -1) {
        users[userIdx].resetPasswordToken = token;
        users[userIdx].resetPasswordTokenExpiry = expiry;
        fs.writeFileSync("attached_assets/user.json", JSON.stringify(users, null, 2));
        const fullName = users[userIdx].name || users[userIdx].fullName || 'الطالب';
        await sendPasswordResetEmail(emailLower, fullName, resetUrl);
        return res.json({ success: true, message: 'إذا كان البريد مسجلاً سيصلك رابط إعادة التعيين' });
      }

      // Check MongoDB
      try {
        const { User } = await import('./mongodb/models');
        const mongoUser = await User.findOne({ email: emailLower });
        if (mongoUser) {
          await User.findOneAndUpdate({ email: emailLower }, {
            resetPasswordToken: token,
            resetPasswordTokenExpiry: expiry
          });
          const fullName = mongoUser.fullName || mongoUser.username || 'الطالب';
          await sendPasswordResetEmail(emailLower, fullName, resetUrl);
          return res.json({ success: true, message: 'إذا كان البريد مسجلاً سيصلك رابط إعادة التعيين' });
        }
      } catch (mongoErr) {
        console.error('MongoDB forgot-password error:', mongoErr);
      }

      // Not found in either - still return success (security best practice)
      res.json({ success: true, message: 'إذا كان البريد مسجلاً سيصلك رابط إعادة التعيين' });
    } catch (error) {
      console.error('forgot-password error:', error);
      res.status(500).json({ error: 'حدث خطأ، حاول مرة أخرى' });
    }
  });

  app.post('/api/auth/reset-password', async (req: Request, res: Response) => {
    try {
      const { token, password } = req.body;
      if (!token || !password) return res.status(400).json({ error: 'البيانات ناقصة' });
      if (password.length < 6) return res.status(400).json({ error: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' });

      // Check user.json first
      try {
        const users = JSON.parse(fs.readFileSync("attached_assets/user.json", "utf-8"));
        const userIdx = users.findIndex((u: any) => u.resetPasswordToken === token);
        if (userIdx !== -1) {
          const expiry = users[userIdx].resetPasswordTokenExpiry;
          if (!expiry || new Date(expiry) < new Date()) {
            return res.status(400).json({ error: 'انتهت صلاحية الرابط، اطلب رابطاً جديداً' });
          }
          users[userIdx].password = password;
          delete users[userIdx].resetPasswordToken;
          delete users[userIdx].resetPasswordTokenExpiry;
          fs.writeFileSync("attached_assets/user.json", JSON.stringify(users, null, 2));
          return res.json({ success: true, message: 'تم تغيير كلمة المرور بنجاح' });
        }
      } catch {}

      // Check MongoDB
      try {
        const { User } = await import('./mongodb/models');
        const mongoUser = await User.findOne({ resetPasswordToken: token });
        if (!mongoUser) return res.status(400).json({ error: 'رابط غير صالح أو منتهي الصلاحية' });
        if (!mongoUser.resetPasswordTokenExpiry || new Date(mongoUser.resetPasswordTokenExpiry) < new Date()) {
          return res.status(400).json({ error: 'انتهت صلاحية الرابط، اطلب رابطاً جديداً' });
        }
        await User.findOneAndUpdate({ resetPasswordToken: token }, {
          password,
          $unset: { resetPasswordToken: 1, resetPasswordTokenExpiry: 1 }
        });
        return res.json({ success: true, message: 'تم تغيير كلمة المرور بنجاح' });
      } catch (mongoErr) {
        console.error('MongoDB reset-password error:', mongoErr);
      }

      return res.status(400).json({ error: 'رابط غير صالح أو منتهي الصلاحية' });
    } catch (error) {
      console.error('reset-password error:', error);
      res.status(500).json({ error: 'حدث خطأ، حاول مرة أخرى' });
    }
  });

  // ========== Daily Study Goal ==========
  function getKsaDateStr(): string {
    return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Riyadh' });
  }

  async function calcStreak(userId: string): Promise<{ current: number; longest: number; weekDays: boolean[] }> {
    const { DailyProgress } = await import('./mongodb/models');
    const docs = await DailyProgress.find({ userId, completedGoal: true }).sort({ date: -1 }).lean();
    const completedSet = new Set(docs.map((d: any) => d.date));

    let current = 0;
    const today = getKsaDateStr();
    const todayTs = new Date(today).getTime();

    for (let i = 0; i <= 365; i++) {
      const d = new Date(todayTs - i * 86400000).toISOString().split('T')[0];
      if (completedSet.has(d)) { current++; } else { if (i > 0) break; }
    }

    let longest = 0, run = 0;
    const sortedDates = Array.from(completedSet).sort();
    for (let i = 0; i < sortedDates.length; i++) {
      if (i === 0) { run = 1; }
      else {
        const prev = new Date(sortedDates[i - 1]).getTime();
        const cur = new Date(sortedDates[i]).getTime();
        run = (cur - prev === 86400000) ? run + 1 : 1;
      }
      if (run > longest) longest = run;
    }

    const weekDays: boolean[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(todayTs - i * 86400000).toISOString().split('T')[0];
      weekDays.push(completedSet.has(d));
    }
    return { current, longest, weekDays };
  }

  app.get('/api/daily-goal', async (req: Request, res: Response) => {
    try {
      const sessionUserId = (req.session as any)?.userId;
      if (!sessionUserId) return res.status(401).json({ error: 'يجب تسجيل الدخول' });
      const userId = String(sessionUserId);
      const { DailyGoal, DailyProgress } = await import('./mongodb/models');
      const [goalDoc, todayDoc] = await Promise.all([
        DailyGoal.findOne({ userId }).lean(),
        DailyProgress.findOne({ userId, date: getKsaDateStr() }).lean(),
      ]);
      const target = (goalDoc as any)?.targetQuestions ?? 20;
      const answered = (todayDoc as any)?.questionsAnswered ?? 0;
      const streak = await calcStreak(userId);
      res.json({ target, answered, date: getKsaDateStr(), streak });
    } catch (err) {
      res.status(500).json({ error: 'خطأ في جلب الهدف اليومي' });
    }
  });

  app.post('/api/daily-goal/set', async (req: Request, res: Response) => {
    try {
      const sessionUserId = (req.session as any)?.userId;
      if (!sessionUserId) return res.status(401).json({ error: 'يجب تسجيل الدخول' });
      const { target } = req.body;
      if (![5, 10, 20, 30, 50].includes(Number(target))) return res.status(400).json({ error: 'هدف غير صحيح' });
      const { DailyGoal } = await import('./mongodb/models');
      await DailyGoal.findOneAndUpdate(
        { userId: String(sessionUserId) },
        { targetQuestions: Number(target), updatedAt: new Date() },
        { upsert: true, new: true }
      );
      res.json({ success: true, target: Number(target) });
    } catch (err) {
      res.status(500).json({ error: 'فشل في حفظ الهدف' });
    }
  });

  app.post('/api/daily-goal/record', async (req: Request, res: Response) => {
    try {
      const sessionUserId = (req.session as any)?.userId;
      if (!sessionUserId) return res.status(401).json({ error: 'يجب تسجيل الدخول' });
      const userId = String(sessionUserId);
      const count = Math.max(1, parseInt(req.body.count ?? '1'));
      const { DailyGoal, DailyProgress } = await import('./mongodb/models');
      const goalDoc = await DailyGoal.findOne({ userId }).lean();
      const target = (goalDoc as any)?.targetQuestions ?? 20;
      const date = getKsaDateStr();
      const updated = await DailyProgress.findOneAndUpdate(
        { userId, date },
        {
          $inc: { questionsAnswered: count },
          $set: { goalTarget: target, updatedAt: new Date() },
        },
        { upsert: true, new: true }
      );
      if (!updated.completedGoal && updated.questionsAnswered >= target) {
        await DailyProgress.findOneAndUpdate({ userId, date }, { $set: { completedGoal: true } });
      }
      res.json({ success: true, answered: updated.questionsAnswered, target, completed: updated.questionsAnswered >= target });
    } catch (err) {
      res.status(500).json({ error: 'فشل في تسجيل التقدم' });
    }
  });

  app.get('/api/daily-goal/history', async (req: Request, res: Response) => {
    try {
      const sessionUserId = (req.session as any)?.userId;
      if (!sessionUserId) return res.status(401).json({ error: 'يجب تسجيل الدخول' });
      const days = Math.min(400, Math.max(7, parseInt(String(req.query.days || '30'))));
      const { DailyProgress } = await import('./mongodb/models');
      const history = await DailyProgress.find({ userId: String(sessionUserId) })
        .sort({ date: -1 }).limit(days).lean();
      res.json({ history });
    } catch (err) {
      res.status(500).json({ error: 'خطأ' });
    }
  });

  // ========== Telegram Login ==========
  // Start Telegram Bot-based login (generates deep link, no domain whitelisting needed)
  app.post('/api/auth/telegram-start-login', async (req: Request, res: Response) => {
    try {
      const { randomBytes } = await import('crypto');
      const sessionId = randomBytes(16).toString('hex');
      const botUsername = process.env.TELEGRAM_BOT_USERNAME || 'qodrataksite_bot';
      const deepLink = `https://t.me/${botUsername}?start=login_${sessionId}`;
      res.json({ sessionId, deepLink });
    } catch (error) {
      res.status(500).json({ error: 'فشل في إنشاء رابط تسجيل الدخول' });
    }
  });

  // Poll for Telegram login completion
  app.get('/api/auth/telegram-poll/:sessionId', async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params;
      const session = telegramLoginSessions.get(sessionId);
      if (!session) {
        return res.json({ status: 'pending' });
      }
      // Session found — proceed with login
      telegramLoginSessions.delete(sessionId);
      const { telegramId, telegramUsername, fullName } = session;

      // Check existing users
      let users: any[] = [];
      try { users = JSON.parse(fs.readFileSync("attached_assets/user.json", "utf-8")); } catch {}
      let fileUser = users.find((u: any) =>
        u.telegramId === telegramId ||
        (telegramUsername && u.telegramUsername && u.telegramUsername.toLowerCase() === telegramUsername.toLowerCase())
      );
      let mongoUser: any = null;
      try {
        const { User } = await import('./mongodb/models');
        mongoUser = await User.findOne({ $or: [
          { telegramId },
          ...(telegramUsername ? [{ telegramUsername: telegramUsername.toLowerCase() }] : [])
        ]});
      } catch {}

      let loginUser: any = null;
      if (fileUser) {
        if (!fileUser.telegramId) { fileUser.telegramId = telegramId; fs.writeFileSync("attached_assets/user.json", JSON.stringify(users, null, 2)); }
        loginUser = fileUser;
      } else if (mongoUser) {
        loginUser = { id: mongoUser._id.toString(), name: mongoUser.fullName || mongoUser.username, email: mongoUser.email, role: mongoUser.role, subscription: (mongoUser as any).subscription };
      } else {
        return res.json({
          status: 'needs_profile',
          telegramData: { telegramId, telegramUsername: telegramUsername || '', firstName: session.firstName, lastName: session.lastName, fullName: fullName || '', photoUrl: '' }
        });
      }

      (req.session as any).userId = loginUser.id;
      (req.session as any).userEmail = loginUser.email;
      (req.session as any).userRole = loginUser.role || 'student';

      await new Promise<void>((resolve, reject) => {
        req.session.save((err) => { if (err) reject(err); else resolve(); });
      });

      const { password: _p, ...safe } = loginUser;
      return res.json({ status: 'success', user: safe });
    } catch (error) {
      console.error('telegram-poll error:', error);
      res.status(500).json({ error: 'خطأ في فحص حالة تسجيل الدخول' });
    }
  });

  app.post('/api/auth/telegram-login', async (req: Request, res: Response) => {
    try {
      const data = req.body;
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      if (!botToken) return res.status(500).json({ error: 'Telegram غير مهيأ' });

      // Verify hash
      const { hash, ...authData } = data;
      const checkString = Object.keys(authData)
        .sort()
        .map(k => `${k}=${authData[k]}`)
        .join('\n');
      const secretKey = crypto.createHash('sha256').update(botToken).digest();
      const computedHash = crypto.createHmac('sha256', secretKey).update(checkString).digest('hex');
      if (computedHash !== hash) {
        return res.status(401).json({ error: 'بيانات تيليجرام غير صالحة' });
      }

      // Check auth_date not older than 1 day
      const authDate = parseInt(authData.auth_date, 10);
      if (Date.now() / 1000 - authDate > 86400) {
        return res.status(401).json({ error: 'انتهت صلاحية جلسة تيليجرام' });
      }

      const telegramId = String(authData.id);
      const telegramUsername = authData.username || '';
      const fullName = [authData.first_name, authData.last_name].filter(Boolean).join(' ');

      // 1) Check file users by telegramId or telegramUsername
      let users: any[] = [];
      try { users = JSON.parse(fs.readFileSync("attached_assets/user.json", "utf-8")); } catch {}
      let fileUser = users.find((u: any) =>
        u.telegramId === telegramId ||
        (telegramUsername && u.telegramUsername && u.telegramUsername.toLowerCase() === telegramUsername.toLowerCase())
      );

      // 2) Check MongoDB
      let mongoUser: any = null;
      try {
        const { User } = await import('./mongodb/models');
        mongoUser = await User.findOne({ $or: [
          { telegramId },
          ...(telegramUsername ? [{ telegramUsername: telegramUsername.toLowerCase() }] : [])
        ]});
      } catch {}

      let loginUser: any = null;

      if (fileUser) {
        // Update telegramId if not set
        if (!fileUser.telegramId) {
          fileUser.telegramId = telegramId;
          fs.writeFileSync("attached_assets/user.json", JSON.stringify(users, null, 2));
        }
        loginUser = fileUser;
      } else if (mongoUser) {
        loginUser = { id: mongoUser._id.toString(), name: mongoUser.fullName || mongoUser.username, email: mongoUser.email, role: mongoUser.role, subscription: mongoUser.subscription };
      } else {
        // New user — require profile completion (email + OTP + password)
        return res.status(202).json({
          needsProfile: true,
          telegramData: {
            telegramId,
            telegramUsername: telegramUsername || '',
            firstName: authData.first_name || '',
            lastName: authData.last_name || '',
            fullName: fullName || '',
            photoUrl: authData.photo_url || ''
          }
        });
      }

      // Set session
      (req.session as any).userId = loginUser.id;
      (req.session as any).userEmail = loginUser.email;
      (req.session as any).userRole = loginUser.role || 'student';

      req.session.save((err) => {
        if (err) return res.status(500).json({ error: 'خطأ في حفظ الجلسة' });
        const { password: _p, ...safe } = loginUser;
        res.json(safe);
      });
    } catch (error) {
      console.error('telegram-login error:', error);
      res.status(500).json({ error: 'حدث خطأ في تسجيل الدخول عبر تيليجرام' });
    }
  });

  // ========== Telegram Complete Registration ==========
  app.post('/api/auth/telegram-complete', async (req: Request, res: Response) => {
    try {
      const { telegramId, telegramUsername, fullName, photoUrl, email, otp, password } = req.body;
      if (!telegramId || !email || !otp || !password) {
        return res.status(400).json({ error: 'جميع الحقول مطلوبة' });
      }
      if (password.length < 6) {
        return res.status(400).json({ error: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' });
      }
      const emailLower = email.trim().toLowerCase();

      // Verify OTP (using MongoDB-backed store)
      const record = await getSignupOTP(emailLower);
      if (!record) {
        return res.status(400).json({ error: 'لم يتم طلب رمز تحقق لهذا البريد. أرسل الرمز مجدداً.' });
      }
      if (new Date() > new Date(record.expiry)) {
        await deleteSignupOTP(emailLower);
        return res.status(400).json({ error: 'انتهت صلاحية الرمز. أعد الإرسال.' });
      }
      if (record.otp !== otp.trim()) {
        return res.status(400).json({ error: 'رمز التحقق غير صحيح' });
      }

      // Check email not already used
      let users: any[] = [];
      try { users = JSON.parse(fs.readFileSync("attached_assets/user.json", "utf-8")); } catch {}
      if (users.some((u: any) => u.email?.toLowerCase() === emailLower)) {
        return res.status(400).json({ error: 'البريد الإلكتروني مستخدم بالفعل' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const today = new Date();
      const trialEndDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      const newUserId = users.length + 1;

      const newUser: any = {
        id: newUserId,
        name: fullName || `مستخدم تيليجرام ${telegramId}`,
        fullName: fullName || `مستخدم تيليجرام ${telegramId}`,
        email: emailLower,
        telegramId: String(telegramId),
        telegramUsername: telegramUsername || undefined,
        telegramPhoto: photoUrl || undefined,
        role: 'student',
        password: hashedPassword,
        subscription: {
          type: 'trial',
          status: 'active',
          startDate: today.toISOString().split('T')[0],
          endDate: trialEndDate.toISOString().split('T')[0],
          trialDays: 7
        },
        points: 100,
        level: 1,
        testsTaken: 0,
        averageScore: 0,
        folders: [],
        achievements: [],
        pointsHistory: [{ points: 100, reason: 'مكافأة الترحيب', date: today.toISOString() }],
        testHistory: [],
        savedQuestions: [],
        createdAt: today.toISOString()
      };
      users.push(newUser);
      fs.writeFileSync("attached_assets/user.json", JSON.stringify(users, null, 2));
      try { await storage.updateLeaderboardEntry(newUser.id, 0, newUser.name); } catch {}

      // Clear OTP
      await deleteSignupOTP(emailLower);

      (req.session as any).userId = newUser.id;
      (req.session as any).userEmail = newUser.email;
      (req.session as any).userRole = 'student';

      req.session.save((err) => {
        if (err) return res.status(500).json({ error: 'خطأ في حفظ الجلسة' });
        const { password: _p, ...safe } = newUser;
        res.status(201).json(safe);
      });
    } catch (error) {
      console.error('telegram-complete error:', error);
      res.status(500).json({ error: 'حدث خطأ في إكمال التسجيل' });
    }
  });

  // ========== Helper: Get user email by userId ==========
  async function getUserEmailById(userId: string, req: Request): Promise<{ userEmail: string | null; userFullName: string }> {
    const sessionEmail = (req.session as any)?.userEmail;
    try {
      // Try MongoDB first
      const { User } = await import('./mongodb/models');
      const isValidMongoId = mongoose.Types.ObjectId.isValid(String(userId)) && String(userId).length === 24;
      const mongoQuery = isValidMongoId
        ? { $or: [{ _id: userId }, ...(sessionEmail ? [{ email: sessionEmail }] : [])] }
        : (sessionEmail ? { email: sessionEmail } : null);
      const mongoUser = mongoQuery ? await User.findOne(mongoQuery) : null;
      if (mongoUser?.email) {
        return { userEmail: mongoUser.email, userFullName: mongoUser.fullName || mongoUser.username || 'الطالب' };
      }
    } catch {}
    // Fallback: user.json
    try {
      const usersData = JSON.parse(fs.readFileSync('attached_assets/user.json', 'utf8'));
      const fileUser = usersData.find((u: any) => String(u.id) === String(userId) || (sessionEmail && u.email === sessionEmail));
      if (fileUser?.email) {
        return { userEmail: fileUser.email, userFullName: fileUser.name || fileUser.username || 'الطالب' };
      }
    } catch {}
    return { userEmail: sessionEmail || null, userFullName: 'الطالب' };
  }

  // ========== Exam Booking Endpoints ==========
  app.post('/api/exam-bookings', async (req: Request, res: Response) => {
    try {
      const sessionUserId = (req.session as any)?.userId;
      if (!sessionUserId) return res.status(401).json({ error: 'يجب تسجيل الدخول أولاً' });
      const { scheduledAt, examType } = req.body;
      if (!scheduledAt) return res.status(400).json({ error: 'يرجى تحديد موعد الاختبار' });
      const date = new Date(scheduledAt);
      const now = new Date();
      const minBookingTime = new Date(now.getTime() + 10 * 60 * 1000);
      if (date < minBookingTime) {
        return res.status(400).json({ error: 'يجب الحجز قبل الاختبار بـ 10 دقائق على الأقل' });
      }
      const booking = await mongoStorage.createExamBooking(String(sessionUserId), date, examType);

      // Send booking confirmation email
      try {
        const { userEmail, userFullName } = await getUserEmailById(String(sessionUserId), req);
        if (userEmail) {
          const { sendExamBookingConfirmation } = await import('./services/emailService');
          const sent = await sendExamBookingConfirmation(userEmail, userFullName, date, String((booking as any)._id));
          if (sent) {
            await (booking as any).updateOne({ confirmationEmailSent: true });
            console.log(`📧 تأكيد الحجز أُرسل إلى ${userEmail}`);
          }
        }
      } catch (emailErr) {
        console.error('خطأ في إرسال بريد تأكيد الحجز:', emailErr);
      }

      res.json({ success: true, booking });
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'فشل في إنشاء الحجز' });
    }
  });

  app.get('/api/exam-bookings/active', async (req: Request, res: Response) => {
    try {
      const sessionUserId = (req.session as any)?.userId;
      if (!sessionUserId) return res.status(401).json({ error: 'يجب تسجيل الدخول أولاً' });
      const booking = await mongoStorage.getUserActiveBooking(String(sessionUserId));
      res.json({ booking });
    } catch (error) {
      res.status(500).json({ error: 'فشل في جلب الحجز' });
    }
  });

  app.get('/api/exam-bookings/history', async (req: Request, res: Response) => {
    try {
      const sessionUserId = (req.session as any)?.userId;
      if (!sessionUserId) return res.status(401).json({ error: 'يجب تسجيل الدخول أولاً' });
      const bookings = await mongoStorage.getUserExamHistory(String(sessionUserId));
      res.json({ bookings });
    } catch (error) {
      res.status(500).json({ error: 'فشل في جلب السجل' });
    }
  });

  app.get('/api/exam-bookings/slots', async (req: Request, res: Response) => {
    try {
      const { date } = req.query;
      if (!date) return res.status(400).json({ error: 'يرجى تحديد التاريخ' });
      const from = new Date(`${date}T00:00:00+03:00`);
      const to = new Date(`${date}T23:59:59.999+03:00`);
      const booked = await mongoStorage.getAllExamBookingsForSlots(from, to);
      const bookedTimes = booked.map((b: any) => new Date(b.scheduledAt).toISOString());
      res.json({ bookedSlots: bookedTimes });
    } catch (error) {
      res.status(500).json({ error: 'فشل في جلب المواعيد' });
    }
  });

  app.get('/api/exam-bookings/:id', async (req: Request, res: Response) => {
    try {
      const sessionUserId = (req.session as any)?.userId;
      if (!sessionUserId) return res.status(401).json({ error: 'يجب تسجيل الدخول أولاً' });
      const booking = await mongoStorage.getExamBookingById(req.params.id);
      if (!booking) return res.status(404).json({ error: 'الحجز غير موجود' });
      if (String(booking.userId) !== String(sessionUserId)) return res.status(403).json({ error: 'غير مصرح' });
      res.json({ booking });
    } catch (error) {
      res.status(500).json({ error: 'فشل في جلب الحجز' });
    }
  });

  app.delete('/api/exam-bookings/:id', async (req: Request, res: Response) => {
    try {
      const sessionUserId = (req.session as any)?.userId;
      if (!sessionUserId) return res.status(401).json({ error: 'يجب تسجيل الدخول أولاً' });
      const cancelled = await mongoStorage.cancelExamBooking(req.params.id, String(sessionUserId));
      if (!cancelled) return res.status(400).json({ error: 'لا يمكن إلغاء هذا الحجز' });
      res.json({ success: true, message: 'تم إلغاء الحجز بنجاح' });
    } catch (error) {
      res.status(500).json({ error: 'فشل في إلغاء الحجز' });
    }
  });

  app.post('/api/exam-bookings/:id/object', async (req: Request, res: Response) => {
    try {
      const sessionUserId = (req.session as any)?.userId;
      if (!sessionUserId) return res.status(401).json({ error: 'يجب تسجيل الدخول أولاً' });
      const { reason } = req.body;
      if (!reason?.trim()) return res.status(400).json({ error: 'يرجى تقديم سبب الاعتراض' });
      const { ExamBooking } = await import('./mongodb/models');
      const booking = await ExamBooking.findById(req.params.id);
      if (!booking || String(booking.userId) !== String(sessionUserId)) {
        return res.status(403).json({ error: 'غير مصرح بتقديم اعتراض على هذا الحجز' });
      }
      if (booking.status !== 'completed') {
        return res.status(400).json({ error: 'يمكن الاعتراض فقط على الاختبارات المكتملة' });
      }
      if ((booking as any).hasObjection) {
        return res.status(400).json({ error: 'تم تقديم اعتراض مسبقاً على هذا الاختبار' });
      }
      await ExamBooking.findByIdAndUpdate(req.params.id, {
        $set: {
          hasObjection: true,
          objectionReason: reason.trim(),
          objectionAt: new Date(),
          aiReviewDone: false,
          resultVisibleAt: new Date(Date.now() + 15 * 60 * 1000),
        }
      });
      // Trigger AI re-review in background
      setTimeout(async () => {
        try {
          const { reviewExamBooking } = await import('./services/aiExamReview');
          const fresh = await ExamBooking.findById(req.params.id).lean() as any;
          if (fresh) {
            const result = await reviewExamBooking(fresh);
            await mongoStorage.updateExamBookingAfterAiReview(req.params.id, {
              sectionResults: result.correctedSectionResults,
              totalScore: result.correctedTotalScore,
              verbalScore: result.correctedVerbalScore,
              quantScore: result.correctedQuantScore,
              totalScoreOutOf100: result.correctedTotalScoreOutOf100,
              verbalPercent: result.correctedVerbalPercent,
              quantPercent: result.correctedQuantPercent,
              correctAnswers: result.correctedCorrectAnswers,
              wrongAnswers: result.correctedWrongAnswers,
              skippedAnswers: result.correctedSkippedAnswers,
            });
            await ExamBooking.findByIdAndUpdate(req.params.id, {
              $set: { aiReviewDone: true, resultVisibleAt: new Date() }
            });
            console.log(`✅ [Objection] Re-review completed for booking ${req.params.id}`);
          }
        } catch (err) {
          console.error('[Objection] Re-review error:', err);
        }
      }, 1000);
      res.json({ success: true, message: 'تم تقديم الاعتراض. سيتم إعادة مراجعة إجاباتك وإرسال النتيجة المعدلة.' });
    } catch (error) {
      console.error('objection error:', error);
      res.status(500).json({ error: 'فشل في تقديم الاعتراض' });
    }
  });

  app.post('/api/exam-bookings/:id/activate', async (req: Request, res: Response) => {
    try {
      const sessionUserId = (req.session as any)?.userId;
      if (!sessionUserId) return res.status(401).json({ error: 'يجب تسجيل الدخول أولاً' });
      const booking = await mongoStorage.getExamBookingById(req.params.id);
      if (!booking || String(booking.userId) !== String(sessionUserId)) return res.status(403).json({ error: 'غير مصرح' });
      const now = new Date();
      const scheduledAt = new Date(booking.scheduledAt);
      const diffMs = scheduledAt.getTime() - now.getTime();
      if (diffMs > 5 * 60 * 1000) {
        return res.status(400).json({ error: 'لم يحن موعد الاختبار بعد' });
      }
      await mongoStorage.activateExamBooking(req.params.id);

      // Send exam start email
      try {
        const { userEmail, userFullName } = await getUserEmailById(String(sessionUserId), req);
        if (userEmail) {
          const { sendExamStartEmail } = await import('./services/emailService');
          const sent = await sendExamStartEmail(userEmail, userFullName, new Date(booking.scheduledAt));
          if (sent) {
            await (booking as any).updateOne({ startEmailSent: true });
            console.log(`📧 بريد بدء الاختبار أُرسل إلى ${userEmail}`);
          }
        }
      } catch (emailErr) {
        console.error('خطأ في إرسال بريد بدء الاختبار:', emailErr);
      }

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'فشل في تفعيل الحجز' });
    }
  });

  app.post('/api/exam-bookings/:id/submit', async (req: Request, res: Response) => {
    try {
      const sessionUserId = (req.session as any)?.userId;
      if (!sessionUserId) return res.status(401).json({ error: 'يجب تسجيل الدخول أولاً' });
      const {
        sectionResults, totalScore, verbalScore, quantScore,
        totalScoreOutOf100, verbalPercent, quantPercent,
        correctAnswers, wrongAnswers, skippedAnswers,
        cheatingFlag, cheatingViolations, questionIds
      } = req.body;

      const booking = await mongoStorage.submitExamBooking(req.params.id, String(sessionUserId), {
        sectionResults, totalScore, verbalScore, quantScore,
        totalScoreOutOf100, verbalPercent, quantPercent,
        correctAnswers, wrongAnswers, skippedAnswers,
        cheatingFlag: !!cheatingFlag, cheatingViolations: cheatingViolations || 0,
        questionIds: questionIds || [],
      });

      if (!booking) return res.status(404).json({ error: 'الحجز غير موجود' });

      if (questionIds?.length) {
        await mongoStorage.markQuestionsAsSeen(sessionUserId, questionIds);
      }

      const sessionEmail = (req.session as any)?.userEmail;
      const { User } = await import('./mongodb/models');

      if (sessionEmail) {
        await User.findOneAndUpdate(
          { email: sessionEmail },
          { $inc: { totalTestsTaken: 1, points: Math.max(0, (correctAnswers || 0) * 10 - (wrongAnswers || 0)) } }
        );
      }

      // Auto-save wrong questions to a folder
      try {
        const wrongQIds: number[] = [];
        if (sectionResults?.length) {
          sectionResults.forEach((sec: any) => {
            const questionsList = sec.questions || sec.questionDetails || [];
            if (questionsList.length) {
              questionsList.forEach((q: any) => {
                if (!q.isCorrect && q.questionId) wrongQIds.push(Number(q.questionId));
              });
            }
          });
        }
        if (wrongQIds.length > 0) {
          const examDate = new Date(booking.scheduledAt).toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' });
          const examNumber = (booking as any).bookingNumber || req.params.id.slice(-6).toUpperCase();
          const folderName = `أخطاء اختبار ${examNumber} - ${examDate}`;
          const folder = await mongoStorage.createFolder({
            userId: String(sessionUserId),
            name: folderName,
            description: `أسئلة أخطأت فيها في الاختبار المجدول بتاريخ ${examDate}`,
            color: '#ef4444',
            icon: '📝',
          });
          await mongoStorage.addQuestionsToFolderBulk(String(folder._id), wrongQIds);
        }
      } catch (folderErr) {
        console.error('Auto-save mistakes folder error:', folderErr);
      }

      // جدولة مراجعة الذكاء الاصطناعي وإرسال البريد بعد 10-15 دقيقة
      if (!cheatingFlag) {
        const bookingId = req.params.id;
        const delayMs = (booking.resultVisibleAt
          ? new Date(booking.resultVisibleAt).getTime() - Date.now()
          : 12 * 60 * 1000);
        const safeDelay = Math.max(delayMs, 0);
        const userIdStr = String(sessionUserId);
        scheduleAiReviewAndEmail(bookingId, userIdStr).catch(e =>
          console.error('[AI Review Schedule] error:', e)
        );
        console.log(`🤖 مراجعة الذكاء الاصطناعي مجدولة بعد ${Math.round(safeDelay / 60000)} دقيقة للحجز ${bookingId}`);
      }

      res.json({ success: true, booking, emailSent: false });
    } catch (error) {
      console.error('Submit exam error:', error);
      res.status(500).json({ error: 'فشل في تسليم الاختبار' });
    }
  });

  // ========== AI Service Endpoints ==========

  app.post('/api/ai/chat', async (req: Request, res: Response) => {
    try {
      const sessionUserId = (req.session as any)?.userId;
      const { messages, systemContext } = req.body;
      if (!Array.isArray(messages)) return res.status(400).json({ error: 'messages required' });
      const { aiChat } = await import('./services/aiService');
      let context = systemContext || '';
      if (sessionUserId) {
        try {
          const { User } = await import('./mongodb/models');
          const sessionEmail = (req.session as any)?.userEmail;
          const isValidMongoId = mongoose.Types.ObjectId.isValid(String(sessionUserId)) && String(sessionUserId).length === 24;
          const chatUserQuery = isValidMongoId ? { _id: sessionUserId } : (sessionEmail ? { email: sessionEmail } : null);
          const user = chatUserQuery ? await User.findOne(chatUserQuery).lean() as any : null;
          if (user) {
            context += `\nالطالب: ${user.name || user.username}, المستوى: ${user.subscriptionType || 'مجاني'}, النقاط: ${user.points || 0}`;
          }
        } catch {}
      }
      const reply = await aiChat(messages, context || undefined);
      res.json({ reply });
    } catch (err) {
      console.error('/api/ai/chat error:', err);
      res.status(500).json({ error: 'فشل في الاتصال بالذكاء الاصطناعي' });
    }
  });

  app.post('/api/ai/explain-question', async (req: Request, res: Response) => {
    try {
      const { questionText, options, correctOptionIndex, studentOptionIndex, category, explanation, imageUrl } = req.body;
      if (!questionText || !Array.isArray(options)) return res.status(400).json({ error: 'بيانات السؤال مطلوبة' });
      const { explainQuestion } = await import('./services/aiService');
      const reply = await explainQuestion({ questionText, options, correctOptionIndex, studentOptionIndex, category, explanation, imageUrl });
      res.json({ reply });
    } catch (err) {
      console.error('/api/ai/explain-question error:', err);
      res.status(500).json({ error: 'فشل في شرح السؤال' });
    }
  });

  app.post('/api/ai/analyze-performance', async (req: Request, res: Response) => {
    try {
      const { analyzePerformance } = await import('./services/aiService');
      const reply = await analyzePerformance(req.body);
      res.json({ reply });
    } catch (err) {
      console.error('/api/ai/analyze-performance error:', err);
      res.status(500).json({ error: 'فشل في تحليل الأداء' });
    }
  });

  app.post('/api/ai/study-plan', async (req: Request, res: Response) => {
    try {
      const { generateStudyPlan } = await import('./services/aiService');
      const reply = await generateStudyPlan(req.body);
      res.json({ reply });
    } catch (err) {
      console.error('/api/ai/study-plan error:', err);
      res.status(500).json({ error: 'فشل في إنشاء الخطة الدراسية' });
    }
  });

  app.post('/api/ai/send-results-email', async (req: Request, res: Response) => {
    try {
      const { userId, testType, score, totalQuestions, wrongQuestions } = req.body;
      if (!userId) return res.status(400).json({ error: 'userId required' });

      const user = await mongoStorage.getUserById(userId);
      if (!user?.email) return res.status(404).json({ error: 'User or email not found' });

      const pct = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
      const wrongCount = Array.isArray(wrongQuestions) ? wrongQuestions.length : 0;

      // Build explanations for email
      let explanationHtml = '';
      if (wrongCount > 0) {
        const { explainMistakes } = await import('./services/aiService');
        const explanations = await explainMistakes({ wrongQuestions, totalQuestions, score });
        if (explanations.length > 0) {
          explanationHtml = `<h2 style="color:#6d28d9;margin-top:24px">🤖 شروحات الذكاء الاصطناعي لأخطائك</h2>`;
          explanations.forEach((exp: any, i: number) => {
            const wq = wrongQuestions[exp.questionIndex];
            if (!wq) return;
            explanationHtml += `
              <div style="border:1px solid #e9d5ff;border-radius:12px;padding:16px;margin-bottom:12px;background:#faf5ff;">
                <p style="font-weight:bold;color:#374151;margin:0 0 8px">${i + 1}. ${wq.questionText}</p>
                <p style="color:#dc2626;font-size:14px;margin:4px 0">✗ إجابتك: ${wq.studentAnswerIndex !== null ? (wq.options?.[wq.studentAnswerIndex] ?? 'لم تُجب') : 'لم تُجب'}</p>
                <p style="color:#16a34a;font-size:14px;margin:4px 0">✓ الصحيح: ${wq.options?.[wq.correctAnswerIndex] ?? ''}</p>
                ${exp.conceptError ? `<p style="color:#d97706;font-size:13px;margin:4px 0">📌 ${exp.conceptError}</p>` : ''}
                <div style="background:#ede9fe;border-radius:8px;padding:12px;margin-top:8px;">
                  <p style="color:#5b21b6;font-size:14px;margin:0">${exp.explanation}</p>
                  ${exp.tip ? `<p style="color:#4338ca;font-size:13px;margin:8px 0 0;font-weight:bold">💡 ${exp.tip}</p>` : ''}
                </div>
              </div>`;
          });
        }
      }

      const htmlBody = `
        <div dir="rtl" style="font-family:Tajawal,Arial,sans-serif;max-width:600px;margin:auto;padding:24px;">
          <div style="background:linear-gradient(135deg,#7c3aed,#4f46e5);border-radius:16px;padding:24px;text-align:center;margin-bottom:24px;">
            <h1 style="color:white;margin:0;font-size:24px">🤖 نتائج اختبارك مع مراجعة الذكاء الاصطناعي</h1>
            <p style="color:#e0d7ff;margin:8px 0 0">${testType}</p>
          </div>
          <div style="background:#f9fafb;border-radius:12px;padding:20px;text-align:center;margin-bottom:20px;">
            <div style="font-size:48px;font-weight:900;color:${pct >= 70 ? '#16a34a' : pct >= 50 ? '#d97706' : '#dc2626'}">${pct}%</div>
            <p style="color:#6b7280;margin:4px 0">${score} إجابة صحيحة من ${totalQuestions}</p>
            ${wrongCount > 0 ? `<p style="color:#dc2626;margin:4px 0">${wrongCount} سؤال خاطئ</p>` : '<p style="color:#16a34a">أحسنت! لا أخطاء</p>'}
          </div>
          ${explanationHtml}
          <p style="text-align:center;color:#9ca3af;font-size:12px;margin-top:24px">منصة قدراتك — qodratak.sa</p>
        </div>`;

      const { sendCustomEmail } = await import('./services/emailService');
      await sendCustomEmail(user.email, `نتائج ${testType} مع مراجعة الذكاء الاصطناعي`, htmlBody, `نتائجك: ${pct}%`);

      res.json({ success: true });
    } catch (err) {
      console.error('/api/ai/send-results-email error:', err);
      res.status(500).json({ error: 'فشل في إرسال البريد' });
    }
  });

  app.post('/api/ai/explain-mistakes', async (req: Request, res: Response) => {
    try {
      const { wrongQuestions, totalQuestions, score } = req.body;
      if (!Array.isArray(wrongQuestions)) return res.status(400).json({ error: 'wrongQuestions required' });
      const { explainMistakes } = await import('./services/aiService');
      const explanations = await explainMistakes({ wrongQuestions, totalQuestions: totalQuestions || 0, score: score || 0 });
      res.json({ explanations });
    } catch (err) {
      console.error('/api/ai/explain-mistakes error:', err);
      res.status(500).json({ error: 'فشل في شرح الأخطاء', explanations: [] });
    }
  });

  // ========== AI Score Prediction ==========
  app.get('/api/ai/score-prediction', async (req: Request, res: Response) => {
    try {
      const userId = (req.session as any)?.userId;
      if (!userId) return res.status(401).json({ error: 'يجب تسجيل الدخول' });

      const allResults = await storage.getTestResultsByUser(Number(userId));
      if (allResults.length === 0) return res.status(200).json(null);

      const sorted = [...allResults]
        .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
        .map(r => ({ ...r, percentage: r.totalQuestions > 0 ? (r.score / r.totalQuestions) * 100 : 0 }));
      const recent10 = sorted.slice(0, 10);

      const avgScore = recent10.reduce((s, r) => s + r.percentage, 0) / recent10.length;

      // Trend: compare last 3 vs previous 3
      const last3Avg = sorted.slice(0, 3).reduce((s, r) => s + r.percentage, 0) / 3;
      const prev3Avg = sorted.slice(3, 6).length >= 3
        ? sorted.slice(3, 6).reduce((s, r) => s + r.percentage, 0) / 3
        : last3Avg;
      const trendDiff = last3Avg - prev3Avg;
      const recentTrend = trendDiff > 3 ? 'improving' : trendDiff < -3 ? 'declining' : 'stable';

      // Category analysis
      const catScores: Record<string, { total: number; count: number }> = {};
      for (const r of recent10) {
        const k = r.testType || 'عام';
        if (!catScores[k]) catScores[k] = { total: 0, count: 0 };
        catScores[k].total += r.percentage;
        catScores[k].count++;
      }
      const catAvgs = Object.entries(catScores).map(([k, v]) => ({ name: k, avg: v.total / v.count }));
      const strengths = catAvgs.filter(c => c.avg >= 70).map(c => c.name).slice(0, 3);
      const weaknesses = catAvgs.filter(c => c.avg < 55).map(c => c.name).slice(0, 3);

      const predicted = Math.round(Math.min(95, Math.max(20, avgScore)));
      const confidence: [number, number] = [Math.max(0, predicted - 8), Math.min(100, predicted + 8)];
      const targetScore = 75;
      const requiredImprovement = Math.max(0, targetScore - predicted);
      const estimatedDaysToTarget = recentTrend === 'improving'
        ? Math.ceil(requiredImprovement / 0.5)
        : Math.ceil(requiredImprovement / 0.3);

      return res.json({
        predictedScore: predicted,
        confidenceRange: confidence,
        targetScore,
        strengths,
        weaknesses,
        requiredImprovement,
        estimatedDaysToTarget: Math.min(estimatedDaysToTarget, 180),
        totalTests: allResults.length,
        averageScore: avgScore,
        recentTrend,
      });
    } catch (err) {
      console.error('/api/ai/score-prediction error:', err);
      res.status(500).json(null);
    }
  });

  // ========== AI Daily Plan ==========
  app.get('/api/ai/daily-plan', async (req: Request, res: Response) => {
    try {
      const userId = (req.session as any)?.userId;
      if (!userId) return res.status(401).json({ error: 'يجب تسجيل الدخول' });

      const allResults = await storage.getTestResultsByUser(Number(userId));
      const today = new Date().toISOString().split('T')[0];

      // For new users with no results, generate a default starter plan
      if (allResults.length === 0) {
        const starterTasks = [
          { id: 'task-1', title: 'أول اختبار لك — قدرات عامة', description: 'أجرِ أول اختبار قياس لقياس مستواك الأساسي', type: 'test' as const, durationMinutes: 20, href: '/qiyas', priority: 'high' as const },
          { id: 'task-2', title: 'تصفح بنك الأسئلة', description: 'شاهد ما يتضمنه البنك من أسئلة لفظية وكمية', type: 'study' as const, durationMinutes: 15, href: '/question-bank', priority: 'high' as const },
          { id: 'task-3', title: 'جرّب الاختبار اللفظي', description: 'ابدأ بالقسم اللفظي واكتشف مستواك فيه', type: 'test' as const, durationMinutes: 15, href: '/verbal-tests', priority: 'medium' as const },
          { id: 'task-4', title: 'اكتشف بطاقات المراجعة', description: 'أداة ممتازة لحفظ المفاهيم الأساسية بسرعة', type: 'study' as const, durationMinutes: 10, href: '/flashcards', priority: 'low' as const },
        ];
        return res.json({ date: today, totalMinutes: 60, tasks: starterTasks, motivation: 'مرحباً! ابدأ رحلتك اليوم — الخطوة الأولى هي الأهم', isNewUser: true });
      }

      const sorted = [...allResults]
        .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
        .map(r => ({ ...r, percentage: r.totalQuestions > 0 ? (r.score / r.totalQuestions) * 100 : 0 }));
      const recent5 = sorted.slice(0, 5);
      const avgScore = recent5.reduce((s, r) => s + r.percentage, 0) / recent5.length;

      // Find weakest area from recent tests
      const catScores: Record<string, { total: number; count: number }> = {};
      for (const r of recent5) {
        const k = r.testType || 'verbal';
        if (!catScores[k]) catScores[k] = { total: 0, count: 0 };
        catScores[k].total += r.percentage;
        catScores[k].count++;
      }
      const catAvgs = Object.entries(catScores).map(([k, v]) => ({ name: k, avg: v.total / v.count }));
      catAvgs.sort((a, b) => a.avg - b.avg);
      const weakestArea = catAvgs[0]?.name || 'verbal';

      const isWeakVerbal = weakestArea.toLowerCase().includes('verbal') || weakestArea.includes('لفظي');
      const isWeakQuant = weakestArea.toLowerCase().includes('quant') || weakestArea.includes('كمي');

      const motivation = avgScore >= 70
        ? 'أداؤك ممتاز! واصل الزخم واستمر في التحدي'
        : avgScore >= 50
        ? 'أنت في المسار الصحيح — اليوم ركّز على نقاط الضعف'
        : 'كل خطوة تقربك من هدفك — ابدأ بخطوة واحدة الآن';

      const tasks = [
        {
          id: 'task-1',
          title: isWeakVerbal ? 'اختبار لفظي قصير' : isWeakQuant ? 'اختبار كمي قصير' : 'اختبار قياس مصغّر',
          description: 'جلسة تدريبية 15 دقيقة تركّز على نقطة ضعفك الحالية',
          type: 'test' as const,
          durationMinutes: 15,
          href: isWeakVerbal ? '/verbal-tests' : isWeakQuant ? '/quantitative-tests' : '/qiyas',
          priority: 'high' as const,
        },
        {
          id: 'task-2',
          title: 'مراجعة أخطاء الأمس',
          description: 'راجع الأسئلة التي أخطأت فيها آخر اختبار وافهم سببها',
          type: 'review' as const,
          durationMinutes: 10,
          href: '/mistake-challenge',
          priority: 'high' as const,
        },
        {
          id: 'task-3',
          title: 'بنك الأسئلة — جولة سريعة',
          description: '10 أسئلة متنوعة من بنك الأسئلة لتنشيط الذاكرة',
          type: 'study' as const,
          durationMinutes: 12,
          href: '/question-bank',
          priority: 'medium' as const,
        },
        {
          id: 'task-4',
          title: 'تحدي الإنجاز اليومي',
          description: 'اختبر مستواك في مسابقة سريعة مع الطلاب الآخرين',
          type: 'challenge' as const,
          durationMinutes: 8,
          href: '/multiplayer',
          priority: 'low' as const,
        },
      ];

      return res.json({
        date: today,
        totalMinutes: tasks.reduce((s, t) => s + t.durationMinutes, 0),
        tasks,
        motivation,
        daysToExam: undefined,
      });
    } catch (err) {
      console.error('/api/ai/daily-plan error:', err);
      res.status(500).json(null);
    }
  });

  // ========== Question History / Anti-Repeat ==========
  // Fast bulk questions fetch for scheduled exam — single DB round-trip
  app.get('/api/exam-bookings/:id/questions', async (req: Request, res: Response) => {
    try {
      const sessionUserId = (req.session as any)?.userId;
      if (!sessionUserId) return res.status(401).json({ error: 'يجب تسجيل الدخول أولاً' });

      const booking = await mongoStorage.getExamBookingById(req.params.id);
      if (!booking) return res.status(404).json({ error: 'الحجز غير موجود' });
      if (String(booking.userId) !== String(sessionUserId)) return res.status(403).json({ error: 'غير مصرح' });

      const SECTIONS = 5;
      const VERBAL_PER_SECTION = 13;
      const QUANT_PER_SECTION  = 12;
      const EXTRA_PER_SECTION  = 2;  // experimental buffer

      const totalVerbal = SECTIONS * (VERBAL_PER_SECTION + EXTRA_PER_SECTION);
      const totalQuant  = SECTIONS * (QUANT_PER_SECTION  + EXTRA_PER_SECTION);

      // Fetch all needed questions in 2 parallel calls instead of 10 sequential ones
      const [verbalAll, quantAll] = await Promise.all([
        mongoStorage.getUnseenQuestions(sessionUserId, totalVerbal, { category: 'verbal' }),
        mongoStorage.getUnseenQuestions(sessionUserId, totalQuant,  { category: 'quantitative' }),
      ]);

      // Distribute into sections (no duplicates across sections)
      const sections: any[][] = [];
      for (let s = 0; s < SECTIONS; s++) {
        const vStart = s * (VERBAL_PER_SECTION + EXTRA_PER_SECTION);
        const qStart = s * (QUANT_PER_SECTION  + EXTRA_PER_SECTION);
        const verbalSlice = verbalAll.slice(vStart, vStart + VERBAL_PER_SECTION);
        const quantSlice  = quantAll.slice(qStart,  qStart  + QUANT_PER_SECTION);
        sections.push([...verbalSlice, ...quantSlice]);
      }

      res.json({ sections });
    } catch (error: any) {
      console.error('Exam questions bulk fetch error:', error);
      res.status(500).json({ error: 'فشل في جلب أسئلة الاختبار' });
    }
  });

  // ── PRE-EXAM DAY SESSION — 100 curated questions weighted by Qiyas distribution ──
  app.get('/api/pre-exam-session', async (req: Request, res: Response) => {
    try {
      // Weighted subcategory targets based on known Qiyas exam structure
      const VERBAL_TARGETS: Record<string, number> = {
        'التناظر اللفظي': 15,
        'إكمال الجمل': 15,
        'الاستيعاب والفهم': 10,
        'القراءة والفهم': 10,
      };
      const QUANT_TARGETS: Record<string, number> = {
        'الأعداد والعمليات': 10,
        'عمليات حسابية': 8,
        'الجبر والمعادلات': 8,
        'النسبة والتناسب': 7,
        'الهندسة': 10,
        'الإحصاء والبيانات': 7,
        'الاحتمالات': 5,
        'المنطق والاستدلال': 5,
      };

      const pickWeighted = (pool: any[], count: number): any[] => {
        const shuffled = [...pool].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, count);
      };

      // Fetch all verbal and quantitative questions
      const [allVerbal, allQuant] = await Promise.all([
        mongoStorage.getQuestions('verbal', undefined, undefined, 2000),
        mongoStorage.getQuestions('quantitative', undefined, undefined, 2000),
      ]);

      const mapById = (arr: any[]) => {
        const bySubcat: Record<string, any[]> = {};
        arr.forEach((q: any) => {
          const sub = q.subcategory || 'عام';
          if (!bySubcat[sub]) bySubcat[sub] = [];
          bySubcat[sub].push(q);
        });
        return bySubcat;
      };

      const verbalBySubcat = mapById(allVerbal);
      const quantBySubcat = mapById(allQuant);

      const selected: any[] = [];

      // Helper: pick from target subcategories first, fallback to whole category pool
      const pickFromTargets = (
        bySubcat: Record<string, any[]>,
        targets: Record<string, number>,
        fallbackPool: any[],
        totalTarget: number
      ) => {
        const result: any[] = [];
        const usedIds = new Set<string>();

        for (const [subcat, count] of Object.entries(targets)) {
          const pool = bySubcat[subcat] || [];
          const picks = pickWeighted(pool, count).filter((q: any) => !usedIds.has(String(q._id)));
          picks.forEach((q: any) => usedIds.add(String(q._id)));
          result.push(...picks);
        }

        // Supplement with random from fallback if short
        if (result.length < totalTarget) {
          const remaining = fallbackPool
            .filter((q: any) => !usedIds.has(String(q._id)))
            .sort(() => Math.random() - 0.5);
          const need = totalTarget - result.length;
          result.push(...remaining.slice(0, need));
        }

        return result.slice(0, totalTarget);
      };

      const verbalSelected = pickFromTargets(verbalBySubcat, VERBAL_TARGETS, allVerbal, 50);
      const quantSelected = pickFromTargets(quantBySubcat, QUANT_TARGETS, allQuant, 50);

      const allSelected = [...verbalSelected, ...quantSelected];
      // Interleave (3 verbal, 2 quant pattern) for better exam flow
      const interleaved: any[] = [];
      let vi = 0, qi = 0;
      while (vi < verbalSelected.length || qi < quantSelected.length) {
        for (let i = 0; i < 3 && vi < verbalSelected.length; i++) interleaved.push(verbalSelected[vi++]);
        for (let i = 0; i < 2 && qi < quantSelected.length; i++) interleaved.push(quantSelected[qi++]);
      }

      const formatQ = (q: any) => ({
        _id: q._id,
        id: q.questionId || q._id,
        text: q.text,
        options: q.options,
        correctOptionIndex: q.correctOptionIndex ?? q.correctAnswer ?? 0,
        category: q.category,
        subcategory: q.subcategory || 'عام',
        difficulty: q.difficulty || 'intermediate',
        imageUrl: q.imageUrl || null,
      });

      const questions = interleaved.slice(0, 100).map(formatQ);

      const meta = {
        total: questions.length,
        verbal: questions.filter((q: any) => q.category === 'verbal').length,
        quantitative: questions.filter((q: any) => q.category === 'quantitative').length,
        timeLimitSeconds: 120 * 60, // 2 hours
        subcategoryDistribution: questions.reduce((acc: any, q: any) => {
          acc[q.subcategory] = (acc[q.subcategory] || 0) + 1;
          return acc;
        }, {}),
      };

      res.json({ questions, meta });
    } catch (error) {
      console.error('Pre-exam session error:', error);
      res.status(500).json({ error: 'فشل تحميل جلسة ما قبل الاختبار' });
    }
  });

  app.get('/api/questions/unseen', async (req: Request, res: Response) => {
    try {
      const sessionUserId = (req.session as any)?.userId;
      if (!sessionUserId) return res.status(401).json({ error: 'يجب تسجيل الدخول أولاً' });
      const count = parseInt(req.query.count as string) || 25;
      const category = req.query.category as string | undefined;
      const questions = await mongoStorage.getUnseenQuestions(sessionUserId, count, { category });
      res.json({ questions });
    } catch (error) {
      res.status(500).json({ error: 'فشل في جلب الأسئلة' });
    }
  });

  app.post('/api/questions/mark-seen', async (req: Request, res: Response) => {
    try {
      const sessionUserId = (req.session as any)?.userId;
      if (!sessionUserId) return res.status(401).json({ error: 'يجب تسجيل الدخول أولاً' });
      const { questionIds } = req.body;
      if (!Array.isArray(questionIds)) return res.status(400).json({ error: 'بيانات غير صحيحة' });
      await mongoStorage.markQuestionsAsSeen(sessionUserId, questionIds);
      // Track daily goal progress (fire and forget)
      const count = questionIds.length;
      if (count > 0) {
        (async () => {
          try {
            const { DailyGoal, DailyProgress } = await import('./mongodb/models');
            const userId = String(sessionUserId);
            const goalDoc = await DailyGoal.findOne({ userId }).lean();
            const target = (goalDoc as any)?.targetQuestions ?? 20;
            const date = getKsaDateStr();
            const updated = await DailyProgress.findOneAndUpdate(
              { userId, date },
              { $inc: { questionsAnswered: count }, $set: { goalTarget: target, updatedAt: new Date() } },
              { upsert: true, new: true }
            );
            if (!updated.completedGoal && updated.questionsAnswered >= target) {
              await DailyProgress.findOneAndUpdate({ userId, date }, { $set: { completedGoal: true } });
            }
          } catch {}
        })();
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'فشل في حفظ سجل الأسئلة' });
    }
  });

  // ========== Detailed Student Analytics ==========
  app.get('/api/stats/detailed', async (req: Request, res: Response) => {
    try {
      const sessionUserId = (req.session as any)?.userId;
      if (!sessionUserId) return res.status(401).json({ error: 'يجب تسجيل الدخول أولاً' });

      const { TestResult, ExamBooking } = await import('./mongodb/models');
      const [testResults, examBookings, seenIds] = await Promise.all([
        TestResult.find({ userId: sessionUserId }).sort({ completedAt: -1 }).limit(30),
        ExamBooking.find({ userId: String(sessionUserId), status: 'completed' }).sort({ completedAt: -1 }).limit(20),
        mongoStorage.getSeenQuestionIds(sessionUserId),
      ]);

      const byCategory: Record<string, { correct: number; total: number }> = {};
      for (const r of testResults) {
        const cat = r.subcategory || r.testType;
        if (!byCategory[cat]) byCategory[cat] = { correct: 0, total: 0 };
        byCategory[cat].correct += r.correctAnswers;
        byCategory[cat].total += r.totalQuestions;
      }

      const recentScores = testResults.slice(0, 10).map(r => ({
        date: r.completedAt,
        score: r.percentage,
        type: r.testType,
        name: r.testName || r.testType,
      }));

      const weakAreas = Object.entries(byCategory)
        .map(([name, data]) => ({ name, percent: data.total > 0 ? (data.correct / data.total) * 100 : 0 }))
        .filter(a => a.percent < 60)
        .sort((a, b) => a.percent - b.percent)
        .slice(0, 5);

      res.json({
        testResults: testResults.slice(0, 20),
        examBookings,
        byCategory,
        recentScores,
        weakAreas,
        totalSeenQuestions: seenIds.length,
        totalTests: testResults.length,
        averageScore: testResults.length > 0
          ? testResults.reduce((s, r) => s + r.percentage, 0) / testResults.length
          : 0,
      });
    } catch (error) {
      res.status(500).json({ error: 'فشل في جلب الإحصائيات' });
    }
  });

  // ========== Error Analysis API ==========

  // POST /api/questions/log-error — record a wrong answer with full detail
  app.post('/api/questions/log-error', async (req: Request, res: Response) => {
    try {
      const userId = (req.session as any)?.userId;
      if (!userId) return res.status(401).json({ error: 'غير مصرح' });
      const { questionId, questionText, subcategory, category, difficulty,
              selectedOptionIndex, selectedOptionText, correctOptionIndex,
              correctOptionText, source = 'adaptive' } = req.body;
      if (selectedOptionIndex === correctOptionIndex) return res.json({ skipped: true });
      const { ErrorLog } = await import('./mongodb/models');
      await ErrorLog.create({
        userId: String(userId), questionId, questionText: (questionText || '').slice(0, 150),
        subcategory, category, difficulty, selectedOptionIndex, selectedOptionText,
        correctOptionIndex, correctOptionText, source,
      });
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: 'فشل في تسجيل الخطأ' });
    }
  });

  // GET /api/error-analysis — return analyzed error patterns per subcategory
  app.get('/api/error-analysis', async (req: Request, res: Response) => {
    try {
      const userId = (req.session as any)?.userId;
      if (!userId) return res.status(401).json({ error: 'يجب تسجيل الدخول' });
      const { ErrorLog } = await import('./mongodb/models');
      const limit = Math.min(500, parseInt(String(req.query.limit || '500')));
      const errors = await ErrorLog.find({ userId: String(userId) })
        .sort({ timestamp: -1 }).limit(limit).lean();

      if (errors.length === 0) return res.json({ patterns: [], total: 0 });

      // Group by subcategory
      const bySubcat: Record<string, typeof errors> = {};
      for (const e of errors) {
        const k = e.subcategory || 'عام';
        if (!bySubcat[k]) bySubcat[k] = [];
        bySubcat[k].push(e);
      }

      // Subcategory-specific error insight templates
      const SUBCAT_TIPS: Record<string, string[]> = {
        'التناظر اللفظي':  ['لا تُركز على شكل الكلمة بل على العلاقة المنطقية بين الكلمتين', 'تحقق من اتجاه العلاقة (أ→ب أو ب→أ)'],
        'إكمال الجمل':     ['اقرأ الجملة كاملة قبل الاختيار', 'السياق العام هو مفتاح الاختيار الصحيح'],
        'استيعاب المقروء': ['ارجع للنص قبل الإجابة', 'الإجابات مباشرة من الفقرة وليس من تفسيرك'],
        'الخطأ السياقي':   ['ابحث عن الكلمة التي لا تنسجم مع باقي الجملة', 'المعنى العام هو المحكّم'],
        'المفردة الشاذة':  ['ابحث عن القاسم المشترك بين الخيارات الأخرى'],
        'المعادلات':       ['تحقق دائماً بتعويض إجابتك في المعادلة الأصلية', 'لا تقفز لحلول جاهزة'],
        'المقارنات':       ['لا تتسرع — قارن العمودين بدقة قبل الحكم'],
        'النسبة والتناسب': ['تذكر أن النسبة علاقة ضربية وليست جمعية'],
        'الهندسة':         ['ارسم الشكل إن استطعت، يساعدك على التخيل'],
        'الإحصاء':        ['الوسط الحسابي حساسٌ للقيم الشاذة، الوسيط أكثر استقراراً'],
        'النسبة المئوية':  ['حوّل النسبة لكسر أولاً ثم احسب'],
        'عمليات حسابية':  ['تحقق من الترتيب الصحيح للعمليات (ضرب قبل جمع)'],
        'العمليات الحسابية': ['تحقق من الترتيب الصحيح للعمليات'],
        'أفكار متنوعة':   ['افهم ما يطلبه السؤال تماماً قبل الحل'],
        'الحركة والأنماط': ['ابحث عن النمط قبل تطبيق أي قاعدة'],
      };

      const patterns = Object.entries(bySubcat).map(([subcategory, errs]) => {
        const total = errs.length;
        const category = errs[0]?.category || 'unknown';

        // Count how many times each wrong option was chosen
        const wrongOptionFreq: Record<string, number> = {};
        let beforeCorrect = 0, afterCorrect = 0;
        for (const e of errs) {
          const k = e.selectedOptionText?.slice(0, 30) || `خيار ${e.selectedOptionIndex + 1}`;
          wrongOptionFreq[k] = (wrongOptionFreq[k] || 0) + 1;
          if (e.selectedOptionIndex < e.correctOptionIndex) beforeCorrect++;
          else afterCorrect++;
        }

        // Most common wrong option
        const topWrong = Object.entries(wrongOptionFreq).sort((a, b) => b[1] - a[1])[0];
        const topWrongPct = topWrong ? Math.round((topWrong[1] / total) * 100) : 0;

        // Determine position pattern
        let positionPattern = '';
        if (total >= 3) {
          if (beforeCorrect >= total * 0.7) positionPattern = 'تميل لاختيار خيار أصغر/أسبق من الإجابة الصحيحة';
          else if (afterCorrect >= total * 0.7) positionPattern = 'تميل لاختيار خيار أكبر/لاحق للإجابة الصحيحة';
        }

        // Build insight sentence
        let insight = '';
        if (topWrongPct >= 50 && topWrong) {
          insight = `أخطأت ${total} ${total === 1 ? 'مرة' : 'مرات'} في "${subcategory}"`;
          if (topWrongPct >= 60) {
            insight += ` — في ${topWrongPct}% من الأحيان اخترت "${topWrong[0].slice(0, 25)}${topWrong[0].length > 25 ? '...' : ''}"`;
          }
        } else if (positionPattern) {
          insight = `أخطأت ${total} ${total === 1 ? 'مرة' : 'مرات'} في "${subcategory}" — ${positionPattern}`;
        } else {
          insight = `أخطأت ${total} ${total === 1 ? 'مرة' : 'مرات'} في "${subcategory}"`;
        }

        // Difficulty breakdown
        const byDiff: Record<string, number> = {};
        for (const e of errs) byDiff[e.difficulty] = (byDiff[e.difficulty] || 0) + 1;

        // Recent errors (last 3)
        const recentErrors = errs.slice(0, 3).map(e => ({
          questionText: e.questionText,
          selectedOptionText: e.selectedOptionText,
          correctOptionText: e.correctOptionText,
          date: e.timestamp,
        }));

        const tip = (SUBCAT_TIPS[subcategory] || [])[Math.floor(Math.random() * (SUBCAT_TIPS[subcategory]?.length || 1))];

        return { subcategory, category, total, insight, positionPattern, topWrong: topWrong ? { text: topWrong[0], count: topWrong[1], pct: topWrongPct } : null, byDiff, recentErrors, tip };
      }).sort((a, b) => b.total - a.total);

      res.json({ patterns, total: errors.length });
    } catch (e) {
      console.error('Error analysis error:', e);
      res.status(500).json({ error: 'فشل في تحليل الأخطاء' });
    }
  });

  // ========== Adaptive Testing API ==========

  // GET /api/adaptive/profile - return user's adaptive profile
  app.get('/api/adaptive/profile', async (req: Request, res: Response) => {
    try {
      const userId = (req.session as any)?.userId;
      if (!userId) return res.status(401).json({ error: 'يجب تسجيل الدخول' });
      const { AdaptiveProfile } = await import('./mongodb/models');
      let profile = await AdaptiveProfile.findOne({ userId: String(userId) });
      if (!profile) {
        profile = new AdaptiveProfile({ userId: String(userId), abilities: [] });
        await profile.save();
      }
      res.json(profile);
    } catch (e) {
      res.status(500).json({ error: 'فشل في جلب الملف التكيفي' });
    }
  });

  // POST /api/adaptive/next - pick next best question
  app.post('/api/adaptive/next', async (req: Request, res: Response) => {
    try {
      const userId = (req.session as any)?.userId;
      if (!userId) return res.status(401).json({ error: 'يجب تسجيل الدخول' });

      const { category = 'all', seenIds = [] } = req.body as { category: string; seenIds: number[] };

      const { AdaptiveProfile } = await import('./mongodb/models');
      let profile = await AdaptiveProfile.findOne({ userId: String(userId) });
      if (!profile) {
        profile = new AdaptiveProfile({ userId: String(userId), abilities: [] });
      }

      // Fetch questions pool
      let pool: any[] = [];
      if (category === 'verbal' || category === 'all') {
        const vq = await mongoStorage.getQuestions('verbal', undefined, undefined, 5000);
        pool.push(...vq.map((q: any) => ({ ...q, id: q.questionId })));
      }
      if (category === 'quantitative' || category === 'all') {
        const qq = await mongoStorage.getQuestions('quantitative', undefined, undefined, 5000);
        pool.push(...qq.map((q: any) => ({ ...q, id: q.questionId })));
      }

      // Filter out already-seen-this-session
      const seenSet = new Set(seenIds.map(Number));
      pool = pool.filter((q: any) => !seenSet.has(Number(q.questionId || q.id)));

      if (pool.length === 0) return res.json(null);

      // Build ability map per subcategory
      const abilityMap: Record<string, number> = {};
      for (const ab of profile.abilities) {
        abilityMap[ab.subcategory] = ab.ability;
      }

      // Group pool by subcategory
      const bySub: Record<string, any[]> = {};
      for (const q of pool) {
        const sub = q.subcategory || 'عام';
        if (!bySub[sub]) bySub[sub] = [];
        bySub[sub].push(q);
      }
      const subcats = Object.keys(bySub);

      // Weight: lower ability → higher weight (focus on weaknesses)
      const weights = subcats.map(sub => {
        const ab = abilityMap[sub] ?? 0;
        // ability ranges -2 to +2; weight = 1 + (1 - ab/2) → 1..3
        return Math.max(0.2, 2 - ab);
      });
      const totalW = weights.reduce((a, b) => a + b, 0);
      const rand = Math.random() * totalW;
      let cumulative = 0;
      let chosenSub = subcats[0];
      for (let i = 0; i < subcats.length; i++) {
        cumulative += weights[i];
        if (rand <= cumulative) { chosenSub = subcats[i]; break; }
      }

      const currentAbility = abilityMap[chosenSub] ?? 0;
      // Pick target difficulty
      let targetDiff: string;
      if (currentAbility >= 0.8) targetDiff = 'advanced';
      else if (currentAbility <= -0.8) targetDiff = 'beginner';
      else targetDiff = 'intermediate';

      const subcatPool = bySub[chosenSub] || [];
      // Try matching difficulty, fall back to any
      let candidates = subcatPool.filter((q: any) => q.difficulty === targetDiff);
      if (candidates.length === 0) candidates = subcatPool;
      const picked = candidates[Math.floor(Math.random() * candidates.length)];

      res.json({
        question: picked,
        subcategory: chosenSub,
        currentAbility: Math.round((currentAbility + 2) * 25), // 0-100 for UI
        targetDifficulty: targetDiff,
      });
    } catch (e) {
      console.error('Adaptive next error:', e);
      res.status(500).json({ error: 'فشل في اختيار السؤال التكيفي' });
    }
  });

  // POST /api/adaptive/submit - record answer and update profile
  app.post('/api/adaptive/submit', async (req: Request, res: Response) => {
    try {
      const userId = (req.session as any)?.userId;
      if (!userId) return res.status(401).json({ error: 'يجب تسجيل الدخول' });

      const { subcategory, category, correct }: { subcategory: string; category: string; correct: boolean } = req.body;

      const { AdaptiveProfile } = await import('./mongodb/models');
      let profile = await AdaptiveProfile.findOne({ userId: String(userId) });
      if (!profile) {
        profile = new AdaptiveProfile({ userId: String(userId), abilities: [] });
      }

      const idx = profile.abilities.findIndex((a: any) => a.subcategory === subcategory);
      const STEP = 0.3;
      const delta = correct ? STEP : -STEP;

      if (idx >= 0) {
        const ab = profile.abilities[idx];
        ab.ability = Math.max(-2, Math.min(2, ab.ability + delta));
        ab.totalSeen = (ab.totalSeen || 0) + 1;
        ab.correct = (ab.correct || 0) + (correct ? 1 : 0);
        profile.abilities[idx] = ab;
      } else {
        profile.abilities.push({ subcategory, category, ability: Math.max(-2, Math.min(2, delta)), totalSeen: 1, correct: correct ? 1 : 0 });
      }

      profile.updatedAt = new Date();
      profile.markModified('abilities');
      await profile.save();

      const newAbility = profile.abilities.find((a: any) => a.subcategory === subcategory)?.ability ?? 0;
      let newDiff = 'intermediate';
      if (newAbility >= 0.8) newDiff = 'advanced';
      else if (newAbility <= -0.8) newDiff = 'beginner';

      res.json({ ability: newAbility, abilityPct: Math.round((newAbility + 2) * 25), difficulty: newDiff });
    } catch (e) {
      res.status(500).json({ error: 'فشل في تحديث الملف التكيفي' });
    }
  });

  // ========== Background Reminder Scheduler (every 60 seconds) ==========
  setInterval(async () => {
    try {
      const { ExamBooking } = await import('./mongodb/models');
      const now = new Date();
      // Find bookings scheduled between 4.5 and 5.5 minutes from now (pending only, reminder not sent)
      const windowStart = new Date(now.getTime() + 4.5 * 60 * 1000);
      const windowEnd = new Date(now.getTime() + 5.5 * 60 * 1000);
      const upcomingBookings = await ExamBooking.find({
        status: 'pending',
        reminderEmailSent: { $ne: true },
        scheduledAt: { $gte: windowStart, $lte: windowEnd },
      });

      if (upcomingBookings.length > 0) {
        const { sendExamReminderEmail } = await import('./services/emailService');
        for (const booking of upcomingBookings) {
          try {
            // Get user email via user.json lookup (no req available here)
            let email: string | null = null;
            let name = 'الطالب';
            try {
              const { User } = await import('./mongodb/models');
              const mongoUser = await User.findOne({ _id: booking.userId });
              if (mongoUser?.email) { email = mongoUser.email; name = mongoUser.fullName || mongoUser.username || 'الطالب'; }
            } catch {}
            if (!email) {
              try {
                const usersData = JSON.parse(fs.readFileSync('attached_assets/user.json', 'utf8'));
                const fileUser = usersData.find((u: any) => String(u.id) === String(booking.userId));
                if (fileUser?.email) { email = fileUser.email; name = fileUser.name || fileUser.username || 'الطالب'; }
              } catch {}
            }
            if (email) {
              const sent = await sendExamReminderEmail(email, name, new Date(booking.scheduledAt));
              if (sent) {
                await ExamBooking.updateOne({ _id: booking._id }, { reminderEmailSent: true });
                console.log(`📧 تذكير 5 دقائق أُرسل إلى ${email} للحجز ${booking._id}`);
              }
            }
          } catch (err) {
            console.error(`خطأ في إرسال تذكير للحجز ${booking._id}:`, err);
          }
        }
      }
    } catch (err) {
      console.error('خطأ في scheduler التذكيرات:', err);
    }
  }, 60 * 1000);

  // ═══════════════════════════════════════════════════
  //                  WALLET ROUTES
  // ═══════════════════════════════════════════════════

  // Get my wallet
  app.get("/api/wallet", async (req: Request, res: Response) => {
    const userId = (req as any).session?.userId;
    if (!userId) return res.status(401).json({ error: 'غير مصرح' });
    try {
      let wallet = await mongoStorage.getWallet(String(userId));
      if (!wallet) {
        const user = await storage.getUser(userId);
        wallet = await mongoStorage.ensureWallet(String(userId), user?.username || '');
      }
      const transactions = await mongoStorage.getWalletTransactions(String(userId), 30);
      res.json({ wallet, transactions });
    } catch (error) {
      console.error('Error getting wallet:', error);
      res.status(500).json({ error: 'فشل في جلب المحفظة' });
    }
  });

  // In-memory OTP store for wallet transfers: key = userId, value = { otp, expiry, toEmail, amount, note }
  const walletTransferOTPStore = new Map<string, { otp: string; expiry: Date; toEmail: string; amount: number; note?: string }>();

  // Helper: lookup a user from user.json by email or by id
  function findFileUser(options: { email?: string; id?: string }): any | null {
    try {
      const users: any[] = JSON.parse(fs.readFileSync("attached_assets/user.json", "utf-8"));
      if (options.email) {
        const normalized = options.email.trim().toLowerCase();
        return users.find((u: any) => u.email?.trim().toLowerCase() === normalized) || null;
      }
      if (options.id) {
        return users.find((u: any) => String(u.id) === String(options.id)) || null;
      }
    } catch {}
    return null;
  }

  // Step 1: Send OTP to sender before transfer
  app.post("/api/wallet/transfer/send-otp", async (req: Request, res: Response) => {
    const fromUserId = (req as any).session?.userId;
    if (!fromUserId) return res.status(401).json({ error: 'غير مصرح' });
    try {
      const { toEmail, amount, note } = req.body;
      if (!toEmail || !amount || amount <= 0) return res.status(400).json({ error: 'بيانات غير صحيحة' });
      if (amount < 1) return res.status(400).json({ error: 'الحد الأدنى للتحويل ريال واحد' });

      // Verify recipient exists (MongoDB first, then user.json fallback)
      let recipient: any = await mongoStorage.getUserByEmail(toEmail);
      if (!recipient) recipient = findFileUser({ email: toEmail });
      if (!recipient) return res.status(404).json({ error: 'لا يوجد مستخدم بهذا البريد الإلكتروني' });
      const recipientId = String(recipient.id || recipient._id);
      if (recipientId === String(fromUserId)) {
        return res.status(400).json({ error: 'لا يمكن التحويل لنفسك' });
      }

      // Get sender info (MongoDB first, then user.json fallback)
      let sender: any = await mongoStorage.getUserById(String(fromUserId));
      if (!sender) sender = findFileUser({ id: String(fromUserId) });
      if (!sender) return res.status(404).json({ error: 'المستخدم غير موجود' });
      if (!sender.email) return res.status(400).json({ error: 'لا يوجد بريد إلكتروني مرتبط بحسابك' });

      // Check wallet balance
      const senderWallet = await mongoStorage.getWallet(String(fromUserId));
      if (!senderWallet || (senderWallet as any).balance < amount) {
        return res.status(400).json({ error: 'رصيدك غير كافٍ لإتمام التحويل' });
      }

      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

      // Store OTP
      walletTransferOTPStore.set(String(fromUserId), { otp, expiry, toEmail, amount: Number(amount), note });

      // Send OTP email to sender
      await sendOTPEmail(sender.email, sender.name || sender.username || 'عزيزنا', otp);

      res.json({ success: true, maskedEmail: sender.email.replace(/(.{2})(.*)(@.*)/, '$1***$3') });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'فشل في إرسال رمز التحقق' });
    }
  });

  // Transfer to a friend (Step 2: validate OTP then execute)
  app.post("/api/wallet/transfer", async (req: Request, res: Response) => {
    const fromUserId = (req as any).session?.userId;
    if (!fromUserId) return res.status(401).json({ error: 'غير مصرح' });
    try {
      const { otp } = req.body;
      if (!otp) return res.status(400).json({ error: 'رمز التحقق مطلوب' });

      // Validate OTP
      const stored = walletTransferOTPStore.get(String(fromUserId));
      if (!stored) return res.status(400).json({ error: 'لم يتم إرسال رمز تحقق — ابدأ العملية من جديد' });
      if (new Date() > stored.expiry) {
        walletTransferOTPStore.delete(String(fromUserId));
        return res.status(400).json({ error: 'انتهت صلاحية رمز التحقق — أعد إرسال الرمز' });
      }
      if (stored.otp !== otp.trim()) {
        return res.status(400).json({ error: 'رمز التحقق غير صحيح' });
      }

      const { toEmail, amount, note } = stored;

      // Find recipient user by email (MongoDB first, then user.json fallback)
      let toUser: any = await mongoStorage.getUserByEmail(toEmail);
      if (!toUser) toUser = findFileUser({ email: toEmail });
      if (!toUser) return res.status(404).json({ error: 'لا يوجد مستخدم بهذا البريد الإلكتروني' });
      const toUserId = String(toUser.id || toUser._id);
      if (toUserId === String(fromUserId)) {
        return res.status(400).json({ error: 'لا يمكن التحويل لنفسك' });
      }
      const recipientName = toUser.name || toUser.username || toEmail;
      await mongoStorage.transferWallet(
        String(fromUserId),
        toUserId,
        recipientName,
        Number(amount),
        note
      );

      // Clear OTP after successful transfer
      walletTransferOTPStore.delete(String(fromUserId));

      res.json({ success: true, message: `تم تحويل ${amount} ريال لـ ${recipientName}` });
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'فشل في التحويل' });
    }
  });

  // ADMIN: Get all wallets
  app.get("/api/admin/wallets", requireAdmin, async (req: Request, res: Response) => {
    try {
      const wallets = await mongoStorage.getAllWallets(200);
      res.json(wallets);
    } catch (error) {
      res.status(500).json({ error: 'فشل في جلب المحافظ' });
    }
  });

  // ADMIN: Add money to user wallet
  app.post("/api/admin/wallet/add", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { userId, username, amount, description } = req.body;
      if (!userId || !amount || amount <= 0) return res.status(400).json({ error: 'بيانات غير صحيحة' });
      const adminId = (req as any).session?.adminId || 'admin';
      const wallet = await mongoStorage.addToWallet(String(userId), username || '', Number(amount), description || 'إضافة رصيد من الإدارة', adminId);
      res.json({ success: true, wallet });
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'فشل في إضافة الرصيد' });
    }
  });

  // ADMIN: Reward monthly top 3
  app.post("/api/admin/wallet/reward-top3", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { rewards } = req.body;
      // rewards = [{ userId, username, amount, rank }]
      if (!Array.isArray(rewards)) return res.status(400).json({ error: 'بيانات غير صحيحة' });
      const adminId = (req as any).session?.adminId || 'admin';
      const results = [];
      for (const r of rewards) {
        if (!r.userId || !r.amount || r.amount <= 0) continue;
        const wallet = await mongoStorage.addToWallet(
          String(r.userId),
          r.username || '',
          Number(r.amount),
          `مكافأة المركز ${r.rank} في المتصدرين الشهريين`,
          adminId
        );
        results.push({ userId: r.userId, username: r.username, amount: r.amount, balance: wallet?.balance });
      }
      res.json({ success: true, results });
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'فشل في توزيع المكافآت' });
    }
  });

  // ═══════════════════════════════════════════════════
  //         QODRATAK PAY CARD SYSTEM (قدراتك باي)
  // ═══════════════════════════════════════════════════

  function generateCardNumber(): string {
    const segments = Array.from({ length: 4 }, () =>
      Math.floor(1000 + Math.random() * 9000).toString()
    );
    return segments.join(' ');
  }

  async function getOrCreateCard(userId: string, cardholderName: string): Promise<any> {
    const { QodratakCard } = await import('./mongodb/models');
    let card = await QodratakCard.findOne({ userId: String(userId) });
    if (!card) {
      let cardNumber = generateCardNumber();
      let tries = 0;
      while (await QodratakCard.findOne({ cardNumber }) && tries < 5) {
        cardNumber = generateCardNumber();
        tries++;
      }
      card = await QodratakCard.create({ userId: String(userId), cardholderName, cardNumber, isActivated: false });
    }
    return card;
  }

  // GET my card info (auto-create if needed)
  app.get('/api/card/my-card', requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).session?.userId;
      const sessionEmail = (req as any).session?.userEmail;
      const { User } = await import('./mongodb/models');
      const isValidCardMongoId = mongoose.Types.ObjectId.isValid(String(userId)) && String(userId).length === 24;
      const cardUserQuery = isValidCardMongoId ? { _id: userId } : (sessionEmail ? { email: sessionEmail } : null);
      const user = cardUserQuery ? await User.findOne(cardUserQuery).lean() : null;
      if (!user) return res.status(404).json({ error: 'المستخدم غير موجود' });
      const name = (user as any).fullName || (user as any).username || 'طالب';
      const card = await getOrCreateCard(String(userId), name);
      res.json({
        cardNumber: card.cardNumber,
        cardholderName: card.cardholderName,
        isActivated: card.isActivated,
        createdAt: card.createdAt,
        activatedAt: card.activatedAt,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'خطأ في جلب بيانات البطاقة' });
    }
  });

  // POST activate card with 4-digit PIN
  app.post('/api/card/activate', requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).session?.userId;
      const { pin } = req.body;
      if (!pin || !/^\d{4}$/.test(String(pin))) {
        return res.status(400).json({ error: 'الرمز السري يجب أن يكون 4 أرقام بالضبط' });
      }
      const { User } = await import('./mongodb/models');
      const activateSessionEmail = (req as any).session?.userEmail;
      const isValidActivateMongoId = mongoose.Types.ObjectId.isValid(String(userId)) && String(userId).length === 24;
      const activateQuery = isValidActivateMongoId ? { _id: userId } : (activateSessionEmail ? { email: activateSessionEmail } : null);
      const user = activateQuery ? await User.findOne(activateQuery).lean() : null;
      const name = (user as any)?.fullName || (user as any)?.username || 'طالب';
      const card = await getOrCreateCard(String(userId), name);
      if (card.isActivated) return res.status(400).json({ error: 'البطاقة مفعّلة مسبقاً' });
      const hashed = await bcrypt.hash(String(pin), 10);
      card.pin = hashed;
      card.isActivated = true;
      card.activatedAt = new Date();
      await card.save();
      res.json({ success: true, message: 'تم تفعيل البطاقة بنجاح' });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'خطأ في تفعيل البطاقة' });
    }
  });

  // POST change PIN (card must be activated)
  app.post('/api/card/change-pin', requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).session?.userId;
      const { oldPin, newPin } = req.body;
      if (!oldPin || !newPin || !/^\d{4}$/.test(String(newPin))) {
        return res.status(400).json({ error: 'يجب تقديم الرمز القديم والرمز الجديد (4 أرقام)' });
      }
      const { QodratakCard } = await import('./mongodb/models');
      const card = await QodratakCard.findOne({ userId: String(userId) });
      if (!card || !card.isActivated) return res.status(400).json({ error: 'البطاقة غير مفعّلة' });
      const match = await bcrypt.compare(String(oldPin), card.pin!);
      if (!match) return res.status(401).json({ error: 'الرمز السري القديم غير صحيح' });
      card.pin = await bcrypt.hash(String(newPin), 10);
      await card.save();
      res.json({ success: true, message: 'تم تغيير الرمز السري بنجاح' });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'خطأ في تغيير الرمز السري' });
    }
  });

  // POST initiate card payment (payer enters card number + PIN + amount)
  app.post('/api/card/pay/initiate', requireAuth, async (req: Request, res: Response) => {
    try {
      const payerUserId = (req as any).session?.userId;
      const { cardNumber, pin, amount, description } = req.body;
      if (!cardNumber || !pin || !amount || Number(amount) <= 0) {
        return res.status(400).json({ error: 'يرجى تعبئة جميع البيانات المطلوبة' });
      }
      const normalizedCard = String(cardNumber).replace(/\s/g, ' ').trim();
      const { QodratakCard, CardPayment, Wallet, User } = await import('./mongodb/models');
      const card = await QodratakCard.findOne({ cardNumber: normalizedCard });
      if (!card) return res.status(404).json({ error: 'رقم البطاقة غير صحيح' });
      if (!card.isActivated) return res.status(400).json({ error: 'هذه البطاقة غير مفعّلة' });
      const match = await bcrypt.compare(String(pin), card.pin!);
      if (!match) return res.status(401).json({ error: 'الرمز السري غير صحيح' });
      const ownerWallet = await Wallet.findOne({ userId: String(card.userId) });
      if (!ownerWallet || ownerWallet.balance < Number(amount)) {
        return res.status(400).json({ error: 'رصيد المحفظة غير كافٍ' });
      }
      const owner = await User.findById(card.userId).lean();
      if (!owner || !(owner as any).email) {
        return res.status(400).json({ error: 'لا يمكن التحقق من بيانات صاحب البطاقة' });
      }
      const ownerEmail = (owner as any).email as string;
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiry = new Date(Date.now() + 10 * 60 * 1000);
      await CardPayment.deleteMany({ cardNumber: normalizedCard });
      await CardPayment.create({
        payerUserId: String(payerUserId),
        cardNumber: normalizedCard,
        cardOwnerUserId: String(card.userId),
        cardOwnerEmail: ownerEmail,
        amount: Number(amount),
        description: description || 'دفع عبر قدراتك باي',
        otp,
        expiry,
      });
      const maskedEmail = ownerEmail.replace(/(.{2}).+(@.+)/, '$1***$2');
      try {
        const { sendOTPEmail } = await import('./services/emailService');
        await sendOTPEmail(ownerEmail, otp, card.cardholderName || 'الطالب');
      } catch (emailErr) {
        console.error('Card pay OTP email error:', emailErr);
      }
      res.json({ success: true, maskedEmail, message: 'تم إرسال رمز التحقق إلى صاحب البطاقة' });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'خطأ في بدء عملية الدفع' });
    }
  });

  // POST confirm card payment with OTP
  app.post('/api/card/pay/confirm', requireAuth, async (req: Request, res: Response) => {
    try {
      const { cardNumber, otp } = req.body;
      if (!cardNumber || !otp) return res.status(400).json({ error: 'بيانات ناقصة' });
      const normalizedCard = String(cardNumber).replace(/\s/g, ' ').trim();
      const { CardPayment, Wallet, WalletTransaction } = await import('./mongodb/models');
      const pending = await CardPayment.findOne({ cardNumber: normalizedCard });
      if (!pending) return res.status(404).json({ error: 'لا توجد عملية دفع معلقة لهذه البطاقة' });
      if (new Date() > pending.expiry) {
        await CardPayment.deleteOne({ _id: pending._id });
        return res.status(400).json({ error: 'انتهت صلاحية رمز التحقق، يرجى إعادة المحاولة' });
      }
      if (pending.otp !== String(otp)) {
        return res.status(401).json({ error: 'رمز التحقق غير صحيح' });
      }
      const ownerWallet = await Wallet.findOne({ userId: String(pending.cardOwnerUserId) });
      if (!ownerWallet || ownerWallet.balance < pending.amount) {
        await CardPayment.deleteOne({ _id: pending._id });
        return res.status(400).json({ error: 'رصيد المحفظة غير كافٍ' });
      }
      ownerWallet.balance -= pending.amount;
      await ownerWallet.save();
      await WalletTransaction.create({
        userId: String(pending.cardOwnerUserId),
        type: 'debit',
        amount: pending.amount,
        balanceAfter: ownerWallet.balance,
        description: pending.description,
        ref: `card_pay_${Date.now()}`,
      });
      await CardPayment.deleteOne({ _id: pending._id });
      res.json({ success: true, message: 'تم الدفع بنجاح', amount: pending.amount });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'خطأ في تأكيد الدفع' });
    }
  });

  // ADMIN: Generate cards for all existing users who don't have one
  app.post('/api/admin/cards/generate-all', requireAdmin, async (req: Request, res: Response) => {
    try {
      const { User, QodratakCard } = await import('./mongodb/models');
      const users = await User.find({ role: 'student' }).lean();
      let created = 0;
      for (const user of users) {
        const uid = String((user as any)._id);
        const exists = await QodratakCard.findOne({ userId: uid });
        if (!exists) {
          let cardNumber = generateCardNumber();
          let tries = 0;
          while (await QodratakCard.findOne({ cardNumber }) && tries < 5) {
            cardNumber = generateCardNumber();
            tries++;
          }
          const name = (user as any).fullName || (user as any).username || 'طالب';
          await QodratakCard.create({ userId: uid, cardholderName: name, cardNumber, isActivated: false });
          created++;
        }
      }
      res.json({ success: true, created, message: `تم إنشاء ${created} بطاقة جديدة` });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'خطأ في توليد البطاقات' });
    }
  });

  // ADMIN: View all cards
  app.get('/api/admin/cards', requireAdmin, async (req: Request, res: Response) => {
    try {
      const { QodratakCard } = await import('./mongodb/models');
      const search = (req.query.search as string) || '';
      const query: any = {};
      if (search) {
        query.$or = [
          { cardholderName: { $regex: search, $options: 'i' } },
          { cardNumber: { $regex: search, $options: 'i' } },
        ];
      }
      const cards = await QodratakCard.find(query).sort({ createdAt: -1 }).limit(200).lean();
      res.json(cards);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'خطأ في جلب البطاقات' });
    }
  });

  // ADMIN: Deduct from user wallet
  app.post('/api/admin/wallet/deduct', requireAdmin, async (req: Request, res: Response) => {
    try {
      const { userId, amount, description } = req.body;
      if (!userId || !amount || Number(amount) <= 0) {
        return res.status(400).json({ error: 'بيانات غير صحيحة' });
      }
      const { Wallet, WalletTransaction } = await import('./mongodb/models');
      let wallet = await Wallet.findOne({ userId: String(userId) });
      if (!wallet) return res.status(404).json({ error: 'المحفظة غير موجودة' });
      if (wallet.balance < Number(amount)) {
        return res.status(400).json({ error: 'الرصيد غير كافٍ للخصم' });
      }
      wallet.balance -= Number(amount);
      await wallet.save();
      await WalletTransaction.create({
        userId: String(userId),
        type: 'debit',
        amount: Number(amount),
        balanceAfter: wallet.balance,
        description: description || 'خصم من الإدارة',
        ref: `admin_deduct_${Date.now()}`,
      });
      res.json({ success: true, balance: wallet.balance });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'فشل في خصم الرصيد' });
    }
  });

  // ═══════════════════════════════════════════════════
  //              SEASONAL EXAM ROUTES
  // ═══════════════════════════════════════════════════

  // Get all active seasonal exams (for students)
  app.get("/api/seasonal-exams", async (req: Request, res: Response) => {
    try {
      const userId = (req as any).session?.userId;
      const exams = await mongoStorage.getSeasonalExams(true);
      const now = new Date();
      const enriched = await Promise.all(exams.map(async (exam: any) => {
        const bookingCount = await (require('./mongodb/models').SeasonalExamBooking).countDocuments({ examId: exam._id });
        let userBooked = false;
        if (userId) {
          const booking = await (require('./mongodb/models').SeasonalExamBooking).findOne({ examId: exam._id, userId: String(userId) });
          userBooked = !!booking;
        }
        return {
          ...exam,
          questions: undefined, // Don't send questions to students until exam starts
          bookingCount,
          userBooked,
          canBook: exam.allowBooking && (!exam.bookingDeadline || now < new Date(exam.bookingDeadline)) && (!exam.maxParticipants || bookingCount < exam.maxParticipants),
          hasStarted: now >= new Date(exam.startDate),
          hasEnded: now > new Date(exam.endDate),
        };
      }));
      res.json(enriched);
    } catch (error) {
      console.error('Error getting seasonal exams:', error);
      res.status(500).json({ error: 'فشل في جلب الاختبارات الموسمية' });
    }
  });

  // Book a seasonal exam
  app.post("/api/seasonal-exams/:id/book", async (req: Request, res: Response) => {
    const userId = (req as any).session?.userId;
    if (!userId) return res.status(401).json({ error: 'يجب تسجيل الدخول' });
    try {
      const user = await storage.getUser(userId);
      const booking = await mongoStorage.bookSeasonalExam(req.params.id, String(userId), user?.username || '');
      res.json({ success: true, booking });
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'فشل في الحجز' });
    }
  });

  // Cancel booking
  app.delete("/api/seasonal-exams/:id/book", async (req: Request, res: Response) => {
    const userId = (req as any).session?.userId;
    if (!userId) return res.status(401).json({ error: 'يجب تسجيل الدخول' });
    try {
      await mongoStorage.cancelSeasonalBooking(req.params.id, String(userId));
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'فشل في إلغاء الحجز' });
    }
  });

  // Get user's bookings
  app.get("/api/seasonal-exams/my-bookings", async (req: Request, res: Response) => {
    const userId = (req as any).session?.userId;
    if (!userId) return res.status(401).json({ error: 'يجب تسجيل الدخول' });
    try {
      const bookings = await mongoStorage.getUserSeasonalBookings(String(userId));
      res.json(bookings);
    } catch (error) {
      res.status(500).json({ error: 'فشل في جلب الحجوزات' });
    }
  });

  // Get seasonal exam questions (only if booked + exam started)
  app.get("/api/seasonal-exams/:id/questions", async (req: Request, res: Response) => {
    const userId = (req as any).session?.userId;
    if (!userId) return res.status(401).json({ error: 'يجب تسجيل الدخول' });
    try {
      const exam = await mongoStorage.getSeasonalExam(req.params.id);
      if (!exam) return res.status(404).json({ error: 'الاختبار غير موجود' });
      const now = new Date();
      if (now < new Date(exam.startDate)) return res.status(400).json({ error: 'الاختبار لم يبدأ بعد' });
      if (now > new Date(exam.endDate)) return res.status(400).json({ error: 'انتهى وقت الاختبار' });
      // Check booking
      const { SeasonalExamBooking } = require('./mongodb/models');
      const booking = await SeasonalExamBooking.findOne({ examId: req.params.id, userId: String(userId) });
      if (!booking) return res.status(403).json({ error: 'يجب الحجز مسبقاً للوصول إلى الاختبار' });
      res.json({ questions: exam.questions, timeLimit: exam.timeLimit, title: exam.title });
    } catch (error) {
      res.status(500).json({ error: 'فشل في جلب الأسئلة' });
    }
  });

  // ADMIN: CRUD for seasonal exams
  app.get("/api/admin/seasonal-exams", requireAdmin, async (req: Request, res: Response) => {
    try {
      const exams = await mongoStorage.getSeasonalExams(false);
      const enriched = await Promise.all(exams.map(async (exam: any) => {
        const { SeasonalExamBooking } = require('./mongodb/models');
        const bookingCount = await SeasonalExamBooking.countDocuments({ examId: exam._id });
        return { ...exam, bookingCount };
      }));
      res.json(enriched);
    } catch (error) {
      res.status(500).json({ error: 'فشل في جلب الاختبارات' });
    }
  });

  app.post("/api/admin/seasonal-exams", requireAdmin, async (req: Request, res: Response) => {
    try {
      const adminId = (req as any).session?.adminId || 'admin';
      const exam = await mongoStorage.createSeasonalExam({ ...req.body, createdBy: adminId });
      res.json({ success: true, exam });
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'فشل في إنشاء الاختبار' });
    }
  });

  app.put("/api/admin/seasonal-exams/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const exam = await mongoStorage.updateSeasonalExam(req.params.id, req.body);
      res.json({ success: true, exam });
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'فشل في تحديث الاختبار' });
    }
  });

  app.delete("/api/admin/seasonal-exams/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      await mongoStorage.deleteSeasonalExam(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'فشل في حذف الاختبار' });
    }
  });

  app.get("/api/admin/seasonal-exams/:id/bookings", requireAdmin, async (req: Request, res: Response) => {
    try {
      const bookings = await mongoStorage.getSeasonalExamBookings(req.params.id);
      res.json(bookings);
    } catch (error) {
      res.status(500).json({ error: 'فشل في جلب الحجوزات' });
    }
  });

  // ═══════════════════════════════════════════════
  // GUEST INVITE SYSTEM — دعوة مشترك + طالب
  // ═══════════════════════════════════════════════

  // POST /api/invite/send — المشترك يرسل دعوة
  app.post('/api/invite/send', async (req: any, res: any) => {
    try {
      const userId = req.session?.userId;
      if (!userId) return res.status(401).json({ error: 'يجب تسجيل الدخول' });

      const { email } = req.body;
      if (!email || !email.includes('@')) return res.status(400).json({ error: 'البريد الإلكتروني غير صحيح' });

      const { User } = await import('./mongodb/models');
      const inviterEmail = req.session?.userEmail;
      const isValidInviterMongoId = mongoose.Types.ObjectId.isValid(String(userId)) && String(userId).length === 24;
      const inviterQuery = isValidInviterMongoId ? { _id: userId } : (inviterEmail ? { email: inviterEmail } : null);
      const inviter = inviterQuery ? await User.findOne(inviterQuery) : null;
      if (!inviter) return res.status(404).json({ error: 'المستخدم غير موجود' });

      // التحقق من أن المستخدم لديه اشتراك مدفوع
      const sub = inviter.subscription;
      const isPaid = sub && ['Pro', 'Pro Life', 'Pro Life Plus', 'Pro Live'].includes(sub.type) && sub.status === 'active';
      if (!isPaid) return res.status(403).json({ error: 'هذه الميزة متاحة فقط للمشتركين المدفوعين' });

      // التحقق من أن لم يرسل دعوة من قبل وتم قبولها
      if (inviter.guestInvite && inviter.guestInvite.status === 'accepted') {
        return res.status(400).json({ error: 'لقد سبق أن استُخدمت دعوتك من قِبل طالب آخر' });
      }

      // لا يمكن دعوة نفسك
      if (inviter.email?.toLowerCase() === email.toLowerCase()) {
        return res.status(400).json({ error: 'لا يمكنك دعوة بريدك الإلكتروني الخاص' });
      }

      // إنشاء رمز الدعوة
      const token = crypto.randomBytes(24).toString('hex');
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const inviterName = inviter.fullName || inviter.username;

      // حفظ الدعوة في حساب المشترك
      inviter.guestInvite = {
        email: email.toLowerCase(),
        token,
        status: 'pending',
        sentAt: new Date(),
      };
      await inviter.save();

      // إرسال البريد
      await sendInvitationEmail(email, inviterName, sub.type, token, baseUrl);

      res.json({ success: true, message: 'تم إرسال الدعوة بنجاح إلى ' + email });
    } catch (error) {
      console.error('Invite send error:', error);
      res.status(500).json({ error: 'حدث خطأ أثناء إرسال الدعوة' });
    }
  });

  // GET /api/invite/:token — معلومات الدعوة
  app.get('/api/invite/:token', async (req: any, res: any) => {
    try {
      const { token } = req.params;
      const { User } = await import('./mongodb/models');
      const inviter = await User.findOne({ 'guestInvite.token': token });

      if (!inviter || !inviter.guestInvite) {
        return res.status(404).json({ error: 'الدعوة غير صالحة أو منتهية الصلاحية' });
      }

      // التحقق من صلاحية الرمز (7 أيام)
      const daysSinceSent = (Date.now() - new Date(inviter.guestInvite.sentAt).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceSent > 7) {
        return res.status(410).json({ error: 'انتهت صلاحية الدعوة (7 أيام)' });
      }

      if (inviter.guestInvite.status === 'accepted') {
        return res.status(400).json({ error: 'هذه الدعوة سبق قبولها' });
      }

      const sub = inviter.subscription;
      res.json({
        valid: true,
        inviterName: inviter.fullName || inviter.username,
        email: inviter.guestInvite.email,
        subscriptionType: sub?.type || 'Pro',
        subscriptionEndDate: sub?.endDate,
        isPermanent: sub?.isPermanent,
      });
    } catch (error) {
      res.status(500).json({ error: 'حدث خطأ' });
    }
  });

  // POST /api/invite/accept — الطالب يقبل الدعوة وينشئ حساب
  app.post('/api/invite/accept', async (req: any, res: any) => {
    try {
      const { token, username, password, fullName } = req.body;
      if (!token || !username || !password) {
        return res.status(400).json({ error: 'البيانات غير مكتملة' });
      }
      if (password.length < 6) return res.status(400).json({ error: 'كلمة المرور قصيرة جداً (6 أحرف على الأقل)' });

      const { User } = await import('./mongodb/models');
      const inviter = await User.findOne({ 'guestInvite.token': token });

      if (!inviter || !inviter.guestInvite) {
        return res.status(404).json({ error: 'الدعوة غير صالحة' });
      }
      if (inviter.guestInvite.status === 'accepted') {
        return res.status(400).json({ error: 'هذه الدعوة سبق قبولها' });
      }

      const daysSinceSent = (Date.now() - new Date(inviter.guestInvite.sentAt).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceSent > 7) return res.status(410).json({ error: 'انتهت صلاحية الدعوة' });

      // التحقق من أن المستخدم غير موجود
      const existingUser = await User.findOne({ $or: [{ username: username.trim() }, { email: inviter.guestInvite.email }] });
      if (existingUser) return res.status(409).json({ error: 'اسم المستخدم أو البريد مستخدم مسبقاً' });

      // إنشاء اشتراك مماثل للمشترك الأصلي
      const inviterSub = inviter.subscription;
      const guestSubscription = {
        type: inviterSub?.type || 'Pro',
        status: 'active',
        startDate: new Date().toISOString(),
        endDate: inviterSub?.endDate,
        isPermanent: inviterSub?.isPermanent || false,
        isGuestOf: inviter._id.toString(),
      };

      // تشفير كلمة المرور
      const hashedPassword = await bcrypt.hash(password, 10);

      // إنشاء المستخدم الجديد
      const newUser = await User.create({
        username: username.trim(),
        password: hashedPassword,
        email: inviter.guestInvite.email,
        fullName: fullName?.trim() || username.trim(),
        role: 'student',
        isActive: true,
        isVerified: true,
        emailVerified: true,
        subscription: guestSubscription,
        freeTrialActivated: false,
        trialUsed: true,
      });

      // تحديث حالة الدعوة عند المشترك الأصلي
      inviter.guestInvite.status = 'accepted';
      inviter.guestInvite.invitedUserId = newUser._id.toString();
      await inviter.save();

      // إنشاء جلسة للمستخدم الجديد
      req.session.userId = newUser._id.toString();
      req.session.userRole = 'student';

      const userResponse = {
        id: newUser._id.toString(),
        username: newUser.username,
        email: newUser.email,
        fullName: newUser.fullName,
        subscription: guestSubscription,
        role: 'student',
      };

      res.json({ success: true, user: userResponse });
    } catch (error) {
      console.error('Invite accept error:', error);
      res.status(500).json({ error: 'حدث خطأ أثناء إنشاء الحساب' });
    }
  });

  // GET /api/invite/status/me — حالة دعوة المشترك الحالي
  app.get('/api/invite/status/me', async (req: any, res: any) => {
    try {
      const userId = req.session?.userId;
      if (!userId) return res.status(401).json({ error: 'غير مسجل' });

      const mongoose = await import('mongoose');
      const { User } = await import('./mongodb/models');

      // إذا كان userId رقمياً (PostgreSQL) وليس ObjectId صالحاً، نعيد استجابة افتراضية
      if (!mongoose.Types.ObjectId.isValid(String(userId))) {
        return res.json({ isPaid: false, guestInvite: null });
      }

      const user = await User.findById(userId).select('guestInvite subscription');
      if (!user) return res.json({ isPaid: false, guestInvite: null });

      const isPaid = user.subscription && ['Pro', 'Pro Life', 'Pro Life Plus', 'Pro Live'].includes(user.subscription.type) && user.subscription.status === 'active';

      res.json({
        isPaid,
        guestInvite: user.guestInvite || null,
      });
    } catch (error) {
      console.error('invite/status/me error:', error);
      res.status(500).json({ error: 'خطأ' });
    }
  });

  // ══════════════ نظام المعلم ══════════════
  app.post('/api/teacher/analyze', async (req: Request, res: Response) => {
    try {
      const { examType, answers, questions, timings } = req.body;
      if (!questions || !Array.isArray(questions)) return res.status(400).json({ error: 'بيانات غير صحيحة' });

      const { generateTeacherPlan } = await import('./services/aiService');

      const wrongQuestions: any[] = [];
      const slowQuestions: any[] = [];
      const catMap: Record<string, { correct: number; total: number }> = {};
      let correctCount = 0;

      questions.forEach((q: any, i: number) => {
        const userAns = answers?.[i] ?? null;
        const timeTaken = timings?.[i] ?? 60;
        const cat = q.category || q.subcategory || 'عام';
        if (!catMap[cat]) catMap[cat] = { correct: 0, total: 0 };
        catMap[cat].total++;
        if (userAns === q.correctOptionIndex) {
          correctCount++;
          catMap[cat].correct++;
        } else {
          wrongQuestions.push({ questionText: q.text, category: cat, subcategory: q.subcategory, timeTaken, options: q.options, correctOptionIndex: q.correctOptionIndex, studentOptionIndex: userAns });
        }
        const avgTime = questions.length > 0 ? (Object.values(timings || {}).reduce((a: any, b: any) => a + b, 0) as number) / questions.length : 60;
        if (timeTaken > avgTime * 1.8) {
          slowQuestions.push({ questionText: q.text, category: cat, subcategory: q.subcategory, timeTaken });
        }
      });

      const categoryBreakdown = Object.entries(catMap).map(([name, v]) => ({ name, ...v }));

      const plan = await generateTeacherPlan({
        examType: examType || 'qudrat',
        totalQuestions: questions.length,
        correctCount,
        wrongQuestions: wrongQuestions.slice(0, 8),
        slowQuestions: slowQuestions.slice(0, 5),
        categoryBreakdown,
      });

      res.json({ plan, correctCount, totalQuestions: questions.length });
    } catch (e: any) {
      console.error('[Teacher analyze] error:', e);
      res.status(500).json({ error: 'فشل في التحليل' });
    }
  });

  app.post('/api/teacher/chat', async (req: Request, res: Response) => {
    try {
      const { message, context, history } = req.body;
      if (!message) return res.status(400).json({ error: 'الرسالة مطلوبة' });

      const { aiChat } = await import('./services/aiService');

      const systemCtx = context
        ? `المعلم يتحدث مع طالب بعد اختبار تشخيصي. ملخص الأداء: ${context}. تحدث بلغة المعلم الحكيم، لا تذكر أنك ذكاء اصطناعي.`
        : 'أنت معلم خبير متخصص في اختبار القدرات والتحصيلي. تحدث بلغة المعلم الحكيم، لا تذكر أنك ذكاء اصطناعي.';

      const msgs = (history || []).slice(-6).map((m: any) => ({
        role: m.role === 'teacher' ? 'assistant' : 'user',
        content: m.content,
      }));
      msgs.push({ role: 'user', content: message });

      const reply = await aiChat(msgs, systemCtx);
      res.json({ reply });
    } catch (e) {
      res.status(500).json({ error: 'فشل في الرد' });
    }
  });

  const httpServer = createServer(app);

  // Register Telegram bot webhook for phone OTP
  (async () => {
    try {
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      const appUrl = process.env.APP_URL?.replace(/\/$/, '');
      if (botToken && appUrl) {
        const webhookUrl = `${appUrl}/api/telegram/webhook`;
        const resp = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: webhookUrl, allowed_updates: ['message'] })
        });
        const json = await resp.json() as { ok: boolean; description?: string };
        if (json.ok) console.log('✅ Telegram webhook registered:', webhookUrl);
        else console.warn('⚠️ Telegram webhook setup failed:', json.description);
      }
    } catch (e) {
      console.warn('Telegram webhook setup error:', e);
    }
  })();

  // استعادة مراجعات الذكاء الاصطناعي المعلقة عند إعادة التشغيل
  setTimeout(() => recoverPendingAiReviews(), 5000);

  return httpServer;
}