import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import fs from "fs";
import path from "path";
import MongoStore from "connect-mongo";
import { connectToMongoDB } from "./mongodb/connection";
import { mongoStorage } from "./mongodb/mongoStorage";
import adminRoutes from "./adminRoutes";
import notificationRoutes from "./notificationRoutes";
import multiplayerRoutes, { gameWebSocketServer } from "./multiplayerRoutes";
import { Question } from "./mongodb/models";

const app = express();
app.set('trust proxy', 1); // Trust the first reverse proxy for secure cookies

// Enforce SESSION_SECRET in production
if (process.env.NODE_ENV === 'production' && !process.env.SESSION_SECRET) {
  throw new Error('SESSION_SECRET environment variable must be set in production');
}

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Service Worker route - must be served before static middleware (no caching)
app.get("/sw.js", (req: Request, res: Response) => {
  const swPath = path.resolve(process.cwd(), "public/sw.js");
  
  if (!fs.existsSync(swPath)) {
    return res.status(404).send("Service worker not found");
  }
  
  res.setHeader('Content-Type', 'application/javascript');
  res.setHeader('Cache-Control', 'no-cache');
  res.sendFile(swPath);
});

// Serve static files from public folder (icons, manifest, etc.) BEFORE Vite
// This ensures PWA icons and manifest are properly served
const publicPath = path.resolve(process.cwd(), "public");
app.use(express.static(publicPath, {
  setHeaders: (res, filePath) => {
    // Set proper content types for icons
    if (filePath.endsWith('.png')) {
      res.setHeader('Content-Type', 'image/png');
    } else if (filePath.endsWith('.svg')) {
      res.setHeader('Content-Type', 'image/svg+xml');
    } else if (filePath.endsWith('.ico')) {
      res.setHeader('Content-Type', 'image/x-icon');
    } else if (filePath.endsWith('.json')) {
      res.setHeader('Content-Type', 'application/json');
    }
    // Allow caching for static assets (except service worker which is handled above)
    res.setHeader('Cache-Control', 'public, max-age=86400');
  }
}));

// APK download route (before auth middleware)
app.get("/app/qudratak-app.apk", (req: Request, res: Response) => {
  try {
    const apkPath = path.resolve(process.cwd(), "public/app/qudratak-app.apk");
    
    if (!fs.existsSync(apkPath)) {
      return res.status(404).json({ message: "APK file not found" });
    }

    // Set headers for download
    res.setHeader('Content-Type', 'application/vnd.android.package-archive');
    res.setHeader('Content-Disposition', 'attachment; filename="qudratak-app-v2.1.0.apk"');
    res.setHeader('Cache-Control', 'no-cache');
    
    // Send file
    const fileStream = fs.createReadStream(apkPath);
    fileStream.pipe(res);
    
  } catch (error) {
    console.error("Error serving APK file:", error);
    res.status(500).json({ message: "Error downloading APK file" });
  }
});

const mongoUrl = process.env.MONGODB_URI;
const sessionStore = mongoUrl
  ? MongoStore.create({
      mongoUrl,
      collectionName: 'sessions',
      ttl: 30 * 24 * 60 * 60,
      autoRemove: 'native',
    })
  : undefined;

if (!sessionStore) {
  console.warn("MONGODB_URI is not set; using in-memory sessions for local development only.");
}

// Replit's preview is served over HTTPS inside an embedded frame. The session
// cookie must be explicitly allowed in that context or the browser drops it
// after a successful login request.
const isEmbeddedReplitPreview = Boolean(process.env.REPLIT_DEV_DOMAIN || process.env.REPLIT_DOMAINS);
const requiresCrossSiteCookie = process.env.NODE_ENV === 'production' || isEmbeddedReplitPreview;

app.use(session({
  ...(sessionStore ? { store: sessionStore } : {}),
  name: requiresCrossSiteCookie ? '__Host-qodratak.sid' : 'qodratak.sid',
  secret: process.env.SESSION_SECRET || 'qudratak-session-secret-2030',
  resave: false,
  saveUninitialized: false,
  proxy: true,
  cookie: { 
    secure: requiresCrossSiteCookie,
    maxAge: 30 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: requiresCrossSiteCookie ? 'none' : 'lax',
    partitioned: isEmbeddedReplitPreview,
  }
}));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

async function seedQuestionsIfEmpty() {
  const existingCount = await Question.countDocuments();
  if (existingCount > 0) {
    log(`✅ Questions already in MongoDB: ${existingCount}`);
    return;
  }
  const questionsPath = path.resolve(process.cwd(), 'server/questions.json');
  if (!fs.existsSync(questionsPath)) {
    log('⚠️ server/questions.json not found, skipping seed');
    return;
  }
  log('📚 Seeding questions from questions.json...');
  const raw = JSON.parse(fs.readFileSync(questionsPath, 'utf-8'));
  const diffMap: Record<string, string> = {
    'التناظر اللفظي': 'beginner', 'الخطأ الشائع': 'intermediate',
    'المقروء': 'advanced', 'إكمال الجملة': 'intermediate',
    'المتضادات': 'beginner', 'الاستنتاج': 'advanced',
  };
  let counter = 1;
  const batch: any[] = [];
  for (const q of (raw.verbal || [])) {
    batch.push({
      questionId: counter++, category: 'verbal',
      subcategory: q.category || 'التناظر اللفظي', text: q.text,
      options: q.options, correctOptionIndex: q.correctOptionIndex,
      difficulty: diffMap[q.category] || 'intermediate',
      explanation: q.explanation || '',
      topic: q.category || 'verbal', keywords: [q.category || 'verbal'],
      section: 1, dialect: 'standard',
    });
  }
  for (const q of (raw.quantitative || [])) {
    batch.push({
      questionId: counter++, category: 'quantitative',
      subcategory: q.category || 'عمليات حسابية', text: q.text,
      options: q.options, correctOptionIndex: q.correctOptionIndex,
      difficulty: 'intermediate', explanation: q.explanation || '',
      topic: q.category || 'quantitative', keywords: [q.category || 'quantitative'],
      section: 2, dialect: 'standard',
    });
  }
  const CHUNK = 500;
  let inserted = 0;
  for (let i = 0; i < batch.length; i += CHUNK) {
    await Question.insertMany(batch.slice(i, i + CHUNK), { ordered: false });
    inserted += batch.slice(i, i + CHUNK).length;
  }
  log(`✅ Seeded ${inserted} questions into MongoDB`);
}

(async () => {
  // Initialize MongoDB connection
  try {
    const mongoConnected = await connectToMongoDB();
    if (mongoConnected) {
      log('✅ MongoDB connected successfully');
      await mongoStorage.initialize();
      log('✅ MongoDB storage initialized with default admin');
      // Auto-seed questions from JSON if MongoDB is empty (non-blocking)
      seedQuestionsIfEmpty().catch(e => log('⚠️ Question seed error: ' + e.message));
    } else {
      log('⚠️ MongoDB not connected - using fallback storage');
    }
  } catch (error) {
    log('⚠️ MongoDB connection failed - using fallback storage');
  }

  // Serve uploaded files
  app.use('/uploads', express.static('uploads'));

  // Admin API routes
  app.use('/api/admin', adminRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/multiplayer', multiplayerRoutes);

  const server = await registerRoutes(app);

  // Serve question images
  app.use('/uploads/question-images', express.static('uploads/question-images'));

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = Number(process.env.PORT) || 5000;
  const serverInstance = app.listen(port, '0.0.0.0', () => {
    log(`serving on port ${port}`);
  });

  // Initialize WebSocket servers in noServer mode
  const { wss } = await import('./websocket');
  wss.initialize(serverInstance as any);
  gameWebSocketServer.initialize(serverInstance as any);

  // Start notification scheduler (Telegram exam reminders + weekly reports)
  const { startNotificationScheduler } = await import('./services/notificationService');
  startNotificationScheduler();
  const { startPushScheduler } = await import('./services/pushService');
  startPushScheduler();

  // Manual WebSocket routing so both /ws/chat and /ws/game work on the same server
  (serverInstance as any).on('upgrade', (req: any, socket: any, head: any) => {
    const pathname = req.url?.split('?')[0];
    if (pathname === '/ws/chat' && wss.wss) {
      wss.wss.handleUpgrade(req, socket, head, (ws) => {
        wss.wss!.emit('connection', ws, req);
      });
    } else if (pathname === '/ws/game' && gameWebSocketServer.wss) {
      gameWebSocketServer.wss.handleUpgrade(req, socket, head, (ws) => {
        gameWebSocketServer.wss!.emit('connection', ws, req);
      });
    } else {
      socket.destroy();
    }
  });

  // Handle server errors
  serverInstance.on('error', (error: Error) => {
    console.error('Server error:', error);
  });

  // نظام التحديث الديناميكي للتصنيف - تحديث نقاط البوتات كل دقيقة
  const { storage } = await import('./storage');
  setInterval(() => {
    storage.updateBotStudentsPoints();
  }, 5 * 60 * 1000); // كل 5 دقائق (تخفيف الحمل على الخادم)

  // إلغاء حجوزات الاختبار المنتهية تلقائياً كل 5 دقائق
  setInterval(async () => {
    try {
      const { ExamBooking } = await import('./mongodb/models');
      const expiredCutoff = new Date(Date.now() - 60 * 60 * 1000); // أكثر من ساعة
      const result = await ExamBooking.updateMany(
        { status: { $in: ['pending', 'active'] }, scheduledAt: { $lt: expiredCutoff } },
        { status: 'cancelled' }
      );
      if (result.modifiedCount > 0) {
        log(`🗑️ تم إلغاء ${result.modifiedCount} حجز منتهي الصلاحية تلقائياً`);
      }
    } catch (e) {
      // silent — non-critical job
    }
  }, 5 * 60 * 1000); // كل 5 دقائق

  log(`✨ نظام التصنيف الديناميكي نشط - تحديث كل دقيقة`);

  return serverInstance;
})();