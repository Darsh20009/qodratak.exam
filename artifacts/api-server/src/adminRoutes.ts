import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import mongoose from 'mongoose';
import { mongoStorage } from './mongodb/mongoStorage';
import { storage } from './storage';
import { Question, ChatMessage, Admin, WhatsAppMessage, FoundationContent, PlatformReview, Institution, InstitutionRequest, User } from './mongodb/models';
import { sendMailboxEmail, sendSubscriptionApprovalEmail } from './services/emailService';
import {
  deleteInboxMessage,
  deleteMailboxMessage,
  getInboxMessage,
  getMailboxMessage,
  getMailboxConfig,
  listInboxMessages,
  listSentMessages,
  markMailboxMessage,
  markInboxMessage,
} from './services/emailInboxService';
import {
  notifyAdminNewStudent,
  notifyAdminSubscription,
  notifyStudentSubscriptionActivated,
  sendAdminFinancialReport,
  sendWhatsAppCampaign,
} from './services/adminWhatsAppNotifications';
import { createAdminAccessToken, verifyAdminAccessToken } from './adminSessionToken';
import {
  getPrivateQuestionImageOriginal,
  prepareQuestionImage,
  processQuestionImage,
} from './services/questionImageProcessor';
import {
  hasPersistentMediaStorage,
  PersistentMediaStorageUnavailableError,
  storeMediaBuffer,
} from './services/mediaStorage';
import { extractQuestionFromImages } from './services/aiService';
import {
  connectWhatsApp,
  disconnectWhatsApp,
  getRecentWhatsAppMessages,
  getWhatsAppStatus,
  sendWhatsAppText,
} from './services/whatsappService';

const router = Router();

const uploadDir = 'uploads/receipts';
const questionImagesDir = 'uploads/question-images';
[uploadDir, questionImagesDir].forEach(d => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

function getDevelopmentDemoAdmin(username: string) {
  if (process.env.NODE_ENV === 'production') return null;

  const normalizedUsername = username.trim().toLowerCase();
  // Keep the development login usable even when the legacy user export has
  // been removed from a fresh checkout. This branch is never enabled in
  // production and is intentionally limited to the existing demo identity.
  if (normalizedUsername === 'admin-demo') {
    return {
      id: 'demo-admin',
      username: 'admin-demo',
      fullName: 'مدير قدراتك التجريبي',
      role: 'admin',
      isDemo: true,
      password: '$2b$10$U1dAOrsiPUiCW8OvUSutx.Oe6vl4b9zRialmhy3wHfm.ktu9ChbUC',
    };
  }

  try {
    const users = JSON.parse(fs.readFileSync('attached_assets/user.json', 'utf-8'));
    const user = users.find((candidate: any) =>
      candidate?.isDemo &&
      candidate?.role === 'admin' &&
      (
        candidate?.username?.trim().toLowerCase() === normalizedUsername ||
        candidate?.email?.trim().toLowerCase() === normalizedUsername
      )
    );

    return user || null;
  } catch {
    return null;
  }
}

async function getLocalDashboardData() {
  let localUsers: any[] = [];

  try {
    localUsers = JSON.parse(fs.readFileSync('attached_assets/user.json', 'utf-8'));
  } catch {
    localUsers = [];
  }

  const learners = localUsers.filter(user => user?.role !== 'admin');
  const activeSubscriptions = learners.filter(user =>
    user?.subscription?.status === 'active' && user?.subscription?.type !== 'free'
  );
  const totalTests = learners.reduce((total, user) => total + Number(user?.testsTaken || 0), 0);
  const scoredUsers = learners.filter(user => Number.isFinite(Number(user?.averageScore)));
  const averageScore = scoredUsers.length
    ? scoredUsers.reduce((total, user) => total + Number(user.averageScore || 0), 0) / scoredUsers.length
    : 0;
  const questions = await storage.getAllQuestions();
  const verbalQuestions = questions.filter((question: any) =>
    String(question.category || question.type || '').toLowerCase().includes('verbal')
  );

  return {
    stats: {
      users: {
        totalUsers: learners.length,
        activeToday: 0,
        activeThisWeek: 0,
        newUsersToday: 0,
        newUsersThisWeek: 0,
      },
      subscriptions: {
        totalSubscriptions: learners.length,
        activeSubscriptions: activeSubscriptions.length,
        pendingSubscriptions: 0,
        expiredSubscriptions: 0,
        cancelledSubscriptions: 0,
        newSubscriptionsToday: 0,
        newSubscriptionsThisWeek: 0,
        revenueThisMonth: 0,
      },
      tests: {
        totalTests,
        testsToday: 0,
        testsThisWeek: 0,
        averageScore,
        testsByType: {},
      },
    },
    questionCount: {
      verbal: verbalQuestions.length,
      quantitative: Math.max(0, questions.length - verbalQuestions.length),
      total: questions.length,
    },
  };
}

const uploadReceipt = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|pdf/;
    if (allowed.test(path.extname(file.originalname).toLowerCase()) && allowed.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('فقط ملفات الصور أو PDF مسموح بها'));
    }
  }
});

async function storeQuestionImage(buffer: Buffer, originalName: string) {
  if (!hasPersistentMediaStorage()) {
    if (process.env.NODE_ENV === 'production') {
      throw new PersistentMediaStorageUnavailableError();
    }
    const local = await processQuestionImage(buffer);
    return {
      ...local,
      imageMetadata: { storage: 'local-development', bytes: buffer.byteLength, originalName },
      imageOriginalMetadata: { storage: 'local-development', bytes: buffer.byteLength, originalName },
    };
  }

  const prepared = await prepareQuestionImage(buffer);
  const [processedAsset, originalAsset] = await Promise.all([
    storeMediaBuffer(prepared.processedBuffer, {
      folder: 'qodratak/questions/processed',
      originalName: `question-${originalName || 'image'}.png`,
      contentType: 'image/png',
      legacyDirectory: 'uploads/question-images',
      legacyUrlPrefix: '/api/uploads/question-images',
    }),
    storeMediaBuffer(prepared.originalBuffer, {
      folder: 'qodratak/questions/originals',
      originalName: originalName || 'question-image',
      contentType: `image/${prepared.format === 'jpg' ? 'jpeg' : prepared.format}`,
      legacyDirectory: 'private_uploads/question-image-originals',
      legacyUrlPrefix: '/api/admin/question-images/original',
    }),
  ]);

  return {
    imageUrl: processedAsset.url,
    originalUrl: originalAsset.url,
    processing: prepared.processing,
    imageMetadata: processedAsset,
    imageOriginalMetadata: originalAsset,
  };
}

function mediaErrorStatus(error: unknown) {
  return error instanceof PersistentMediaStorageUnavailableError ? 503 : 500;
}

const uploadQuestionImage = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
    if (allowedMimeTypes.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('يُسمح بصور PNG وJPG وWebP فقط'));
    }
  }
});

const DEFAULT_ADMIN_PERMISSIONS = [
  'view_dashboard',
  'view_students',
  'manage_students',
  'view_subscriptions',
  'manage_subscriptions',
  'manage_questions',
  'manage_tests',
  'manage_announcements',
  'manage_support',
  'manage_settings',
  'manage_exams',
  'manage_institutions',
  'manage_notifications',
  'manage_content',
  'manage_wallets',
  'manage_employees',
  'manage_accounting',
  'manage_question_reports',
  'manage_email',
];
const DEFAULT_SUPPORT_PERMISSIONS = ['view_dashboard', 'view_students', 'manage_support', 'view_question_reports'];

function requiredAdminPermission(req: Request) {
  const pathName = req.path;
  const readOnly = req.method === 'GET';
  if (pathName === '/session' || pathName === '/logout') return null;
  if (pathName.startsWith('/dashboard')) return 'view_dashboard';
  if (pathName.startsWith('/users')) return readOnly ? 'view_students' : 'manage_students';
  if (pathName.startsWith('/subscriptions')) return readOnly ? 'view_subscriptions' : 'manage_subscriptions';
  if (pathName.startsWith('/questions')) return readOnly ? 'view_questions' : 'manage_questions';
  if (pathName.startsWith('/test-templates')) return 'manage_tests';
  if (pathName.startsWith('/announcements') || pathName === '/broadcast-email') return 'manage_announcements';
  if (pathName.startsWith('/support-tickets') || pathName.startsWith('/whatsapp')) return 'manage_support';
  if (pathName.startsWith('/settings') || pathName.startsWith('/subscription-plan')) return 'manage_settings';
  if (pathName.startsWith('/scheduled-exams')) return 'manage_exams';
  if (pathName.startsWith('/institutions')) return 'manage_institutions';
  if (pathName.startsWith('/institution-requests')) return 'manage_institutions';
  if (pathName.startsWith('/notifications')) return 'manage_notifications';
  if (pathName.startsWith('/seasonal-exams') || pathName.startsWith('/foundation-content') || pathName.startsWith('/platform-reviews')) return 'manage_content';
  if (pathName.startsWith('/wallets') || pathName.startsWith('/leaderboard')) return 'manage_wallets';
  if (pathName.startsWith('/employees')) return 'manage_employees';
  if (pathName.startsWith('/accounting')) return 'manage_accounting';
  if (pathName.startsWith('/question-reports')) return 'manage_question_reports';
  if (pathName.startsWith('/admins')) return 'manage_admins';
  if (pathName.startsWith('/email')) return 'manage_email';
  return null;
}

function adminCan(permission: string | null, admin: any) {
  if (!permission) return true;
  if (admin?.role === 'super_admin' || admin?.role === 'system_admin') return true;
  const permissions = Array.isArray(admin?.permissions) ? admin.permissions : [];
  if (permissions.includes('all') || permissions.includes(permission)) return true;
  // Older standard admins were seeded with only these two view permissions.
  // Treat that legacy shape as the standard admin role instead of breaking access.
  if (admin?.role === 'admin' && permissions.length === 2 && permissions.includes('view_students') && permissions.includes('view_subscriptions')) {
    return DEFAULT_ADMIN_PERMISSIONS.includes(permission);
  }
  return false;
}

function effectiveAdminPermissions(admin: any) {
  if (admin?.role === 'super_admin' || admin?.role === 'system_admin') return ['all'];
  if (Array.isArray(admin?.permissions) && admin.permissions.length > 0) return admin.permissions;
  return admin?.role === 'support' ? DEFAULT_SUPPORT_PERMISSIONS : DEFAULT_ADMIN_PERMISSIONS;
}

const requireAdminAuth = async (req: Request, res: Response, next: NextFunction) => {
  let adminSession = (req.session as any)?.admin;
  const isAdminByFlag = (req.session as any)?.isAdmin && (req.session as any)?.adminId;

  if (!adminSession && !isAdminByFlag) {
    const tokenAdmin = verifyAdminAccessToken(req);
    if (tokenAdmin?.isDemo) {
      (req.session as any).admin = tokenAdmin;
      adminSession = tokenAdmin;
    }

    if (!adminSession && tokenAdmin) {
      try {
        const admin = await mongoStorage.getAdminById(tokenAdmin.adminId);
        if (admin && admin.isActive !== false) {
          adminSession = {
            adminId: String(admin._id),
            username: admin.username,
            fullName: admin.fullName,
            role: admin.role,
            permissions: effectiveAdminPermissions(admin),
          };
          (req.session as any).admin = adminSession;
        }
      } catch {
        // The standard authorization response below is intentionally generic.
      }
    }
  }

  if (!adminSession && !isAdminByFlag) {
    return res.status(401).json({ error: 'يجب تسجيل الدخول كمدير' });
  }
  if (!adminSession && isAdminByFlag) {
    try {
      const admin = await mongoStorage.getAdminById((req.session as any).adminId);
      if (admin && admin.isActive !== false) {
        (req.session as any).admin = {
          adminId: admin._id.toString(),
          username: admin.username,
          fullName: admin.fullName,
          role: admin.role,
          permissions: effectiveAdminPermissions(admin),
        };
      } else {
        return res.status(401).json({ error: 'يجب تسجيل الدخول كمدير' });
      }
    } catch {
      return res.status(401).json({ error: 'يجب تسجيل الدخول كمدير' });
    }
  }
  const admin = (req.session as any).admin;
  const permission = requiredAdminPermission(req);
  if (!adminCan(permission, admin)) {
    return res.status(403).json({ error: 'ليس لديك صلاحية للوصول إلى هذا القسم' });
  }
  next();
};

// ── AUTH ───────────────────────────────────────────────────────

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'اسم المستخدم وكلمة المرور مطلوبان' });
    }

    const demoAdmin = getDevelopmentDemoAdmin(username);
    const demoPasswordValid = demoAdmin?.password
      ? await bcrypt.compare(password, demoAdmin.password)
      : false;

    if (demoAdmin && demoPasswordValid) {
      const adminIdentity = {
        adminId: String(demoAdmin.id),
        username: demoAdmin.username,
        fullName: demoAdmin.fullName || demoAdmin.name,
        role: 'system_admin',
        permissions: ['all'],
        isDemo: true,
      };
      (req.session as any).admin = adminIdentity;
      (req.session as any).isAdmin = true;
      (req.session as any).adminId = String(demoAdmin.id);
      (req.session as any).adminRole = adminIdentity.role;
      (req.session as any).adminUsername = adminIdentity.username;
      (req.session as any).adminPermissions = adminIdentity.permissions;

      return req.session.save((err) => {
        if (err) {
          console.error('Demo admin session save error:', err);
          return res.status(500).json({ error: 'خطأ في حفظ جلسة الإدارة' });
        }

        return res.json({
          success: true,
          admin: {
            id: String(demoAdmin.id),
            username: demoAdmin.username,
            fullName: demoAdmin.fullName || demoAdmin.name,
            role: 'system_admin',
            isDemo: true,
          },
          adminAccessToken: createAdminAccessToken(adminIdentity),
        });
      });
    }

    if (!process.env.MONGODB_URI) {
      return res.status(503).json({
        error: 'تسجيل الأدمن الحقيقي غير متاح حاليًا لأن قاعدة البيانات غير متصلة',
        code: 'ADMIN_DATABASE_NOT_CONFIGURED',
      });
    }

    const admin = await mongoStorage.getAdminByUsername(username);

    if (!admin) {
      return res.status(401).json({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
    }

    const isValid = await bcrypt.compare(password, admin.password);
    if (!isValid) {
      return res.status(401).json({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
    }

    if (!admin.isActive) {
      return res.status(403).json({ error: 'هذا الحساب معطل' });
    }

    await mongoStorage.updateAdminLogin(String(admin._id));

    const adminIdentity = {
      adminId: String(admin._id),
      username: admin.username,
      fullName: admin.fullName,
      role: admin.role,
      permissions: effectiveAdminPermissions(admin),
    };
    (req.session as any).admin = adminIdentity;
    (req.session as any).isAdmin = true;
    (req.session as any).adminId = String(admin._id);
    (req.session as any).adminRole = adminIdentity.role;
    (req.session as any).adminUsername = adminIdentity.username;
    (req.session as any).adminPermissions = adminIdentity.permissions;

    req.session.save((err) => {
      if (err) {
        console.error('Admin session save error:', err);
        return res.status(500).json({ error: 'خطأ في حفظ الجلسة' });
      }
      res.json({
        success: true,
        admin: {
          id: String(admin._id),
          username: admin.username,
          fullName: admin.fullName,
          role: admin.role,
        },
        adminAccessToken: createAdminAccessToken(adminIdentity),
      });
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'حدث خطأ في تسجيل الدخول' });
  }
});

router.post('/logout', (req: Request, res: Response) => {
  req.session.destroy((error) => {
    if (error) {
      console.error('[Admin] logout error:', error);
      return res.status(500).json({ error: 'تعذر تسجيل الخروج' });
    }

    res.clearCookie('__Host-qodratak.sid', { path: '/' });
    res.clearCookie('qodratak.sid', { path: '/' });
    return res.json({ success: true });
  });
});

router.get('/session', requireAdminAuth, (req: Request, res: Response) => {
  res.json({
    authenticated: true,
    admin: (req.session as any).admin,
  });
});

// ── STUDENT PRODUCT: FOUNDATION CONTENT & REVIEW MODERATION ───────────────
const studentPrograms = new Set(['qudrat', 'tahsili']);
const foundationFields = ['program', 'title', 'description', 'videoUrl', 'thumbnailUrl', 'order', 'published', 'linkedQuizRoute', 'durationMinutes', 'quiz'];

function contentPayload(body: Record<string, unknown>, creating = false) {
  const payload: Record<string, unknown> = {};
  for (const field of foundationFields) {
    if (body[field] !== undefined) payload[field] = body[field];
  }
  if (creating && (!payload.program || !payload.title || !payload.description || !payload.videoUrl || payload.order === undefined)) {
    return { error: 'البرنامج والعنوان والوصف ورابط الفيديو والترتيب مطلوبة' };
  }
  if (payload.program !== undefined && !studentPrograms.has(String(payload.program))) {
    return { error: 'البرنامج المدعوم هو qudrat أو tahsili فقط' };
  }
  if (payload.order !== undefined && (!Number.isInteger(Number(payload.order)) || Number(payload.order) < 0)) {
    return { error: 'الترتيب يجب أن يكون رقماً صحيحاً موجباً أو صفراً' };
  }
  if (payload.durationMinutes !== undefined && (!Number.isFinite(Number(payload.durationMinutes)) || Number(payload.durationMinutes) < 0)) {
    return { error: 'مدة المحتوى غير صالحة' };
  }
  if (payload.published !== undefined && typeof payload.published !== 'boolean') {
    return { error: 'حالة النشر غير صالحة' };
  }
  if (payload.quiz !== undefined && payload.quiz !== null) {
    const quiz = payload.quiz as Record<string, unknown>;
    const questionIds = Array.isArray(quiz.questionIds)
      ? Array.from(new Set(quiz.questionIds.map(String).map(id => id.trim()).filter(Boolean)))
      : [];
    const passingScore = Number(quiz.passingScore ?? 60);
    const timeLimitMinutes = quiz.timeLimitMinutes === undefined || quiz.timeLimitMinutes === null || quiz.timeLimitMinutes === ''
      ? undefined
      : Number(quiz.timeLimitMinutes);
    if (!String(quiz.title || '').trim() || questionIds.length === 0) {
      return { error: 'عنوان الاختبار وسؤال واحد على الأقل مطلوبان' };
    }
    if (questionIds.length > 50 || questionIds.some(id => !mongoose.Types.ObjectId.isValid(id))) {
      return { error: 'قائمة أسئلة الاختبار غير صالحة أو تتجاوز 50 سؤالاً' };
    }
    if (!Number.isFinite(passingScore) || passingScore < 0 || passingScore > 100) {
      return { error: 'درجة النجاح يجب أن تكون بين 0 و100' };
    }
    if (timeLimitMinutes !== undefined && (!Number.isInteger(timeLimitMinutes) || timeLimitMinutes < 1 || timeLimitMinutes > 180)) {
      return { error: 'مدة الاختبار يجب أن تكون بين دقيقة و180 دقيقة' };
    }
    payload.quiz = {
      title: String(quiz.title).trim(),
      instructions: String(quiz.instructions || '').trim() || undefined,
      questionIds,
      passingScore,
      timeLimitMinutes,
    };
  }
  return { payload };
}

async function validateFoundationQuiz(payload: Record<string, unknown>) {
  if (!payload.quiz || typeof payload.quiz !== 'object') return null;
  const questionIds = (payload.quiz as { questionIds?: unknown }).questionIds;
  if (!Array.isArray(questionIds) || questionIds.length === 0) return 'يجب اختيار أسئلة الاختبار';
  const count = await Question.countDocuments({ _id: { $in: questionIds } });
  return count === questionIds.length ? null : 'بعض الأسئلة المختارة لم تعد موجودة في بنك الأسئلة';
}

router.get('/foundation-content', requireAdminAuth, async (_req: Request, res: Response) => {
  try {
    res.json({ content: await FoundationContent.find().sort({ program: 1, order: 1, createdAt: 1 }).lean() });
  } catch (error) {
    console.error('Admin foundation content list error:', error);
    res.status(500).json({ error: 'فشل في جلب المحتوى التأسيسي' });
  }
});

router.get('/foundation-content/questions', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const search = String(req.query.search || '').trim();
    const category = String(req.query.category || '').trim();
    const difficulty = String(req.query.difficulty || '').trim();
    const subcategory = String(req.query.subcategory || '').trim();
    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || '50'), 10) || 50));
    const query: Record<string, unknown> = {};
    if (category && category !== 'all') query.category = category;
    if (difficulty && difficulty !== 'all') query.difficulty = difficulty;
    if (subcategory) query.subcategory = { $regex: subcategory, $options: 'i' };
    if (search) {
      query.$or = [
        { text: { $regex: search, $options: 'i' } },
        { subcategory: { $regex: search, $options: 'i' } },
        { topic: { $regex: search, $options: 'i' } },
      ];
    }
    const [total, questions] = await Promise.all([
      Question.countDocuments(query),
      Question.find(query)
      .sort({ questionId: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select('_id questionId text category subcategory difficulty options correctOptionIndex explanation imageUrl imageUrls')
      .lean(),
    ]);
    res.json({ questions, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error('Get foundation quiz questions error:', error);
    res.status(500).json({ error: 'فشل في جلب أسئلة الاختبار' });
  }
});

router.post('/foundation-content', requireAdminAuth, async (req: Request, res: Response) => {
  const result = contentPayload(req.body || {}, true);
  if ('error' in result) return res.status(400).json({ error: result.error });
  try {
    const quizError = await validateFoundationQuiz(result.payload);
    if (quizError) return res.status(400).json({ error: quizError });
    const content = await FoundationContent.create(result.payload);
    res.status(201).json({ content });
  } catch (error) {
    console.error('Admin foundation content create error:', error);
    res.status(500).json({ error: 'فشل في إنشاء المحتوى التأسيسي' });
  }
});

router.put('/foundation-content/:id', requireAdminAuth, async (req: Request, res: Response) => {
  const result = contentPayload(req.body || {});
  if ('error' in result) return res.status(400).json({ error: result.error });
  if (!Object.keys(result.payload).length) return res.status(400).json({ error: 'لا توجد بيانات للتحديث' });
  try {
    const quizError = await validateFoundationQuiz(result.payload);
    if (quizError) return res.status(400).json({ error: quizError });
    const content = await FoundationContent.findByIdAndUpdate(req.params.id, { $set: result.payload }, { new: true, runValidators: true });
    if (!content) return res.status(404).json({ error: 'المحتوى غير موجود' });
    res.json({ content });
  } catch (error) {
    res.status(400).json({ error: 'معرف المحتوى أو بياناته غير صالحة' });
  }
});

router.delete('/foundation-content/:id', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const content = await FoundationContent.findByIdAndDelete(req.params.id);
    if (!content) return res.status(404).json({ error: 'المحتوى غير موجود' });
    res.status(204).send();
  } catch {
    res.status(400).json({ error: 'معرف المحتوى غير صالح' });
  }
});

router.get('/platform-reviews', requireAdminAuth, async (_req: Request, res: Response) => {
  try {
    const reviews = await PlatformReview.find().populate('userId', 'fullName username').sort({ createdAt: -1 }).lean();
    res.json({ reviews });
  } catch (error) {
    console.error('Admin reviews list error:', error);
    res.status(500).json({ error: 'فشل في جلب التقييمات' });
  }
});

router.patch('/platform-reviews/:id', requireAdminAuth, async (req: Request, res: Response) => {
  const updates: Record<string, unknown> = {};
  if (req.body?.status !== undefined) {
    if (!['pending', 'approved', 'rejected'].includes(req.body.status)) return res.status(400).json({ error: 'حالة التقييم غير صالحة' });
    updates.status = req.body.status;
  }
  if (req.body?.featured !== undefined) {
    if (typeof req.body.featured !== 'boolean') return res.status(400).json({ error: 'قيمة featured غير صالحة' });
    updates.featured = req.body.featured;
  }
  if (req.body?.adminReply !== undefined) {
    if (typeof req.body.adminReply !== 'string' || req.body.adminReply.length > 2000) return res.status(400).json({ error: 'رد الإدارة غير صالح' });
    updates.adminReply = req.body.adminReply.trim();
  }
  if (!Object.keys(updates).length) return res.status(400).json({ error: 'لا توجد بيانات للتحديث' });
  try {
    const review = await PlatformReview.findByIdAndUpdate(req.params.id, { $set: updates }, { new: true, runValidators: true });
    if (!review) return res.status(404).json({ error: 'التقييم غير موجود' });
    res.json({ review });
  } catch {
    res.status(400).json({ error: 'معرف التقييم غير صالح' });
  }
});

router.delete('/platform-reviews/:id', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const review = await PlatformReview.findByIdAndDelete(req.params.id);
    if (!review) return res.status(404).json({ error: 'التقييم غير موجود' });
    res.status(204).send();
  } catch {
    res.status(400).json({ error: 'معرف التقييم غير صالح' });
  }
});

// ── DASHBOARD ────────────────────────────────────────────────

router.get('/dashboard/stats', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const { stats, questionCount } = process.env.MONGODB_URI
      ? {
          stats: await mongoStorage.getDashboardStats(),
          questionCount: await mongoStorage.getQuestionCount(),
        }
      : await getLocalDashboardData();

    res.json({
      totalUsers: stats.users.totalUsers,
      activeUsers: stats.users.activeToday,
      premiumUsers: stats.subscriptions.activeSubscriptions,
      newUsersToday: stats.users.newUsersToday,
      totalQuestions: questionCount.total,
      totalTests: stats.tests.totalTests,
      revenue: stats.subscriptions.revenueThisMonth,
      ...stats,
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'فشل في جلب الإحصائيات' });
  }
});

// ── USERS ────────────────────────────────────────────────────

router.post('/users', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const { User } = await import('./mongodb/models');
    const body = req.body || {};
    const username = String(body.username || '').trim();
    const password = String(body.password || '');
    if (!username || password.length < 6) {
      return res.status(400).json({ error: 'اسم المستخدم وكلمة المرور (6 أحرف على الأقل) مطلوبان' });
    }
    const allowedRoles = new Set(['student', 'parent', 'teacher', 'institution_admin']);
    const role = allowedRoles.has(String(body.role)) ? String(body.role) : 'student';
    const existing = await User.findOne({
      $or: [
        { username: username.toLowerCase() },
        ...(body.email ? [{ email: String(body.email).trim().toLowerCase() }] : []),
      ],
    }).select('_id');
    if (existing) {
      return res.status(409).json({ error: 'اسم المستخدم أو البريد الإلكتروني مستخدم بالفعل' });
    }

    const created = await mongoStorage.createUser({
      username,
      password,
      fullName: String(body.fullName || '').trim() || undefined,
      email: String(body.email || '').trim().toLowerCase() || undefined,
      phone: String(body.phone || '').trim() || undefined,
      role: role as any,
      institutionId: body.institutionId || undefined,
      isActive: body.isActive !== false,
      isVerified: Boolean(body.isVerified),
      emailVerified: Boolean(body.emailVerified),
      points: Number(body.points) || 0,
      level: Number(body.level) || 1,
    } as any);
    const safeUser = await User.findById(created._id)
      .select('-password -otpCode -otpExpiry -pinHash -totpSecret -recoveryPassphrase -resetPasswordToken -resetPasswordTokenExpiry -pushChallenge -pending2FAUserId -devices -webauthnCredentials')
      .lean();
    res.status(201).json({ success: true, user: safeUser });
  } catch (error) {
    console.error('Create user error:', error);
    if ((error as any)?.code === 11000) {
      return res.status(409).json({ error: 'اسم المستخدم أو البريد الإلكتروني مستخدم بالفعل' });
    }
    res.status(500).json({ error: 'فشل في إنشاء الحساب' });
  }
});

router.get('/users', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = String(req.query.search || '').trim();
    const requestedRole = String(req.query.role || 'all').trim();
    const allowedRoles = new Set(['all', 'student', 'parent', 'teacher', 'institution_admin']);
    const role = allowedRoles.has(requestedRole) ? requestedRole : 'all';

    const result = await mongoStorage.getAllUsers(page, limit, search || undefined, role);

    res.json({
      users: result.users,
      total: result.total,
      page,
      totalPages: Math.ceil(result.total / limit),
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'فشل في جلب المستخدمين' });
  }
});

router.get('/users/:id', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -otpCode -otpExpiry -pinHash -totpSecret -recoveryPassphrase -resetPasswordToken -resetPasswordTokenExpiry -pushChallenge -pending2FAUserId -devices -webauthnCredentials')
      .lean();
    if (!user) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }

    const subscriptions = await mongoStorage.getUserSubscriptions(req.params.id);
    const testResultsData = await mongoStorage.getUserTestResults(req.params.id, 1, 20);

    res.json({
      user,
      subscriptions,
      testResults: testResultsData.results,
      activities: [],
    });
  } catch (error) {
    console.error('Get user details error:', error);
    res.status(500).json({ error: 'فشل في جلب بيانات المستخدم' });
  }
});

router.put('/users/:id', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const { User } = await import('./mongodb/models');
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'معرف المستخدم غير صالح' });
    }
    const existing = await User.findById(req.params.id).select('_id role');
    if (!existing) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }

    const allowedRoles = new Set(['student', 'parent', 'teacher', 'institution_admin']);
    const allowedFields = [
      'username', 'fullName', 'email', 'phone', 'password', 'role', 'institutionId',
      'isActive', 'isVerified', 'emailVerified', 'points', 'level',
      'academicTrack', 'gradeLevel', 'studyGoal', 'targetScore',
      'guardianPhone', 'targetExamDate', 'bio', 'city', 'subscription',
    ];
    const updates: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(req.body || {}, field)) {
        updates[field] = req.body[field];
      }
    }
    if (updates.role && !allowedRoles.has(String(updates.role))) {
      return res.status(400).json({ error: 'دور الحساب غير مسموح' });
    }
    if (Object.prototype.hasOwnProperty.call(updates, 'institutionId')) {
      const institutionId = updates.institutionId;
      updates.institutionId = institutionId ? String(institutionId) : undefined;
    }
    if (Object.prototype.hasOwnProperty.call(updates, 'username') && !String(updates.username || '').trim()) {
      return res.status(400).json({ error: 'اسم المستخدم مطلوب' });
    }
    if (Object.prototype.hasOwnProperty.call(updates, 'email')) {
      updates.email = String(updates.email || '').trim().toLowerCase() || undefined;
    }
    if (Object.prototype.hasOwnProperty.call(updates, 'phone')) {
      updates.phone = String(updates.phone || '').trim() || undefined;
    }
    if (Object.prototype.hasOwnProperty.call(updates, 'password')) {
      const password = String(updates.password || '');
      if (!password) {
        delete updates.password;
      } else if (password.length < 6) {
        return res.status(400).json({ error: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' });
      }
    }

    const updated = await mongoStorage.updateUser(req.params.id, updates as any);
    if (!updated) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }
    const safeUser = await User.findById(updated._id)
      .select('-password -otpCode -otpExpiry -pinHash -totpSecret -recoveryPassphrase -resetPasswordToken -resetPasswordTokenExpiry -pushChallenge -pending2FAUserId -devices -webauthnCredentials')
      .lean();
    res.json({ success: true, user: safeUser });
  } catch (error) {
    console.error('Update user error:', error);
    if ((error as any)?.code === 11000) {
      return res.status(409).json({ error: 'اسم المستخدم أو البريد الإلكتروني مستخدم بالفعل' });
    }
    res.status(500).json({ error: 'فشل في تحديث المستخدم' });
  }
});

router.delete('/users/:id', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const { User } = await import('./mongodb/models');
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'معرف المستخدم غير صالح' });
    }
    const currentAdminId = String((req.session as any)?.admin?.adminId || (req.session as any)?.adminId || '');
    if (currentAdminId && currentAdminId === req.params.id) {
      return res.status(400).json({ error: 'لا يمكن حذف حساب المدير المستخدم حاليًا' });
    }
    const result = await User.findByIdAndDelete(req.params.id);
    if (!result) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }
    res.json({ success: true, message: 'تم حذف الحساب مع الاحتفاظ بالسجلات التاريخية المرتبطة به' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'فشل في حذف المستخدم' });
  }
});

// ── SUBSCRIPTIONS ─────────────────────────────────────────────

router.get('/subscriptions', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string;

    const result = await mongoStorage.getAllSubscriptions(page, limit, status);

    res.json({
      subscriptions: result.subscriptions,
      total: result.total,
      page,
      totalPages: Math.ceil(result.total / limit),
    });
  } catch (error) {
    console.error('Get subscriptions error:', error);
    res.status(500).json({ error: 'فشل في جلب الاشتراكات' });
  }
});

router.get('/subscriptions/pending', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const pending = await mongoStorage.getPendingSubscriptions();
    res.json({ subscriptions: pending, total: pending.length });
  } catch (error) {
    res.status(500).json({ error: 'فشل في جلب الاشتراكات المعلقة' });
  }
});

router.post('/subscriptions/:id/approve', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const adminSession = (req.session as any).admin;
    const sub = await mongoStorage.approveSubscription(req.params.id, adminSession.adminId);
    if (!sub) {
      return res.status(404).json({ error: 'الاشتراك غير موجود' });
    }

    // Update user.json to activate subscription for this user
    try {
      const userId = sub.userId;
      const usersPath = 'attached_assets/user.json';
      const users = JSON.parse(fs.readFileSync(usersPath, 'utf-8'));
      const userIndex = users.findIndex((u: any) => String(u.id) === String(userId) || u.email === String(userId));
      if (userIndex !== -1) {
        const endDate = sub.endDate ? new Date(sub.endDate) : new Date(Date.now() + 30 * 24 * 3600 * 1000);
        users[userIndex].subscription = {
          type: sub.type,
          startDate: sub.startDate ? new Date(sub.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0]
        };
        fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
      }
    } catch (updateErr) {
      console.error('Error updating user.json after subscription approval:', updateErr);
    }

    // Send approval email
    try {
      const usersPath = 'attached_assets/user.json';
      const users = JSON.parse(fs.readFileSync(usersPath, 'utf-8'));
      const localUser = users.find((u: any) => String(u.id) === String(sub.userId));
      const email = localUser?.email;
      const name = localUser?.name || localUser?.fullName || '';
      if (email) {
        const endDate = sub.endDate ? new Date(sub.endDate) : new Date(Date.now() + 30 * 24 * 3600 * 1000);
        await sendSubscriptionApprovalEmail(email, name, sub.type, endDate);
      }
    } catch (emailErr) {
      console.error('Error sending approval email:', emailErr);
    }
    void notifyAdminSubscription({
      studentName: String((sub.userId as any)?.fullName || (sub.userId as any)?.username || sub.userId),
      plan: sub.type,
      price: sub.price,
      paymentMethod: sub.paymentMethod,
      status: 'active',
    }).catch((error) =>
      console.error('Admin approved-subscription WhatsApp notification failed:', error),
    );
    void notifyStudentSubscriptionActivated({
      userId: String(sub.userId),
      plan: sub.type,
      price: sub.price,
      endDate: sub.endDate,
    }).catch((error) =>
      console.error('Student approved-subscription WhatsApp notification failed:', error),
    );

    res.json({ success: true, subscription: sub });
  } catch (error) {
    console.error('Approve subscription error:', error);
    res.status(500).json({ error: 'فشل في الموافقة على الاشتراك' });
  }
});

router.post('/subscriptions/:id/reject', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const { reason } = req.body;
    const sub = await mongoStorage.rejectSubscription(req.params.id, reason || 'تم الرفض');
    if (!sub) {
      return res.status(404).json({ error: 'الاشتراك غير موجود' });
    }
    res.json({ success: true, subscription: sub });
  } catch (error) {
    res.status(500).json({ error: 'فشل في رفض الاشتراك' });
  }
});

router.post('/subscriptions/upload-receipt', requireAdminAuth, uploadReceipt.single('receipt'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'لم يتم رفع أي ملف' });
    }
    const receipt = await storeMediaBuffer(req.file.buffer, {
      folder: 'qodratak/subscription-receipts',
      originalName: req.file.originalname,
      contentType: req.file.mimetype,
      legacyDirectory: uploadDir,
      legacyUrlPrefix: '/api/uploads/receipts',
    });
    res.json({ success: true, receiptUrl: receipt.url, receiptMetadata: receipt });
  } catch (error) {
    res.status(mediaErrorStatus(error)).json({
      error: error instanceof Error ? error.message : 'فشل في رفع الملف',
    });
  }
});

// ── QUESTIONS MANAGEMENT ──────────────────────────────────────

router.get('/questions', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 30;
    const category = req.query.category as string;
    const difficulty = req.query.difficulty as string;
    const search = req.query.search as string;

    const query: any = {};
    if (category && category !== 'all') query.category = category;
    if (difficulty && difficulty !== 'all') query.difficulty = difficulty;
    if (search) {
      query.$or = [
        { text: { $regex: search, $options: 'i' } },
        { subcategory: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await Question.countDocuments(query);
    const questions = await Question.find(query)
      .sort({ questionId: 1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      questions,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Get questions error:', error);
    res.status(500).json({ error: 'فشل في جلب الأسئلة' });
  }
});

router.get('/questions/:id', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ error: 'السؤال غير موجود' });
    }
    res.json(question);
  } catch (error) {
    res.status(500).json({ error: 'فشل في جلب السؤال' });
  }
});

router.post('/questions', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const adminSession = (req.session as any).admin;
    const { text, category, subcategory, options, correctOptionIndex, difficulty, explanation, imageUrl, imageUrls, imageOriginalUrl, imageOriginalUrls, imageProcessing, imageProcessings, imageMetadata, imageOriginalMetadata } = req.body;

    if (!text || !category || !options || correctOptionIndex === undefined) {
      return res.status(400).json({ error: 'البيانات الأساسية مطلوبة' });
    }

    const lastQuestion = await Question.findOne().sort({ questionId: -1 });
    const nextId = (lastQuestion?.questionId || 0) + 1;

    const question = await Question.create({
      questionId: nextId,
      text,
      category,
      subcategory: subcategory || 'عام',
      options,
      correctOptionIndex: parseInt(correctOptionIndex),
      difficulty: difficulty || 'intermediate',
      explanation: explanation || '',
      imageUrl: imageUrl || '',
      imageUrls: Array.isArray(imageUrls) ? imageUrls : imageUrl ? [imageUrl] : [],
      imageOriginalUrl: imageOriginalUrl || undefined,
      imageOriginalUrls: Array.isArray(imageOriginalUrls) ? imageOriginalUrls : imageOriginalUrl ? [imageOriginalUrl] : [],
      imageMetadata: imageMetadata || undefined,
      imageOriginalMetadata: imageOriginalMetadata || undefined,
      imageProcessing: imageProcessing || undefined,
      imageProcessings: Array.isArray(imageProcessings) ? imageProcessings : imageProcessing ? [imageProcessing] : [],
      createdBy: adminSession.username,
      createdAt: new Date(),
    });

    res.status(201).json({ success: true, question });
  } catch (error) {
    console.error('Create question error:', error);
    res.status(500).json({ error: 'فشل في إنشاء السؤال' });
  }
});

router.put('/questions/:id', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const { text, category, subcategory, options, correctOptionIndex, difficulty, explanation, imageUrl, imageUrls, imageOriginalUrl, imageOriginalUrls, imageProcessing, imageProcessings, imageMetadata, imageOriginalMetadata } = req.body;

    const updated = await Question.findByIdAndUpdate(
      req.params.id,
      {
        ...(text && { text }),
        ...(category && { category }),
        ...(subcategory && { subcategory }),
        ...(options && { options }),
        ...(correctOptionIndex !== undefined && { correctOptionIndex: parseInt(correctOptionIndex) }),
        ...(difficulty && { difficulty }),
        ...(explanation !== undefined && { explanation }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(imageUrls !== undefined && { imageUrls: Array.isArray(imageUrls) ? imageUrls : [] }),
        ...(imageOriginalUrl !== undefined && { imageOriginalUrl }),
        ...(imageOriginalUrls !== undefined && { imageOriginalUrls: Array.isArray(imageOriginalUrls) ? imageOriginalUrls : [] }),
        ...(imageMetadata !== undefined && { imageMetadata }),
        ...(imageOriginalMetadata !== undefined && { imageOriginalMetadata }),
        ...(imageProcessing !== undefined && { imageProcessing }),
        ...(imageProcessings !== undefined && { imageProcessings: Array.isArray(imageProcessings) ? imageProcessings : [] }),
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ error: 'السؤال غير موجود' });
    }

    res.json({ success: true, question: updated });
  } catch (error) {
    console.error('Update question error:', error);
    res.status(500).json({ error: 'فشل في تحديث السؤال' });
  }
});

router.delete('/questions/:id', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const result = await Question.findByIdAndDelete(req.params.id);
    if (!result) {
      return res.status(404).json({ error: 'السؤال غير موجود' });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'فشل في حذف السؤال' });
  }
});

router.post('/questions/:id/image', requireAdminAuth, uploadQuestionImage.single('image'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'لم يتم رفع أي صورة' });
    }

    const processed = await storeQuestionImage(req.file.buffer, req.file.originalname);

    const updated = await Question.findByIdAndUpdate(
      req.params.id,
      {
        imageUrl: processed.imageUrl,
        imageUrls: [processed.imageUrl],
        imageOriginalUrl: processed.originalUrl,
        imageOriginalUrls: [processed.originalUrl],
        imageProcessing: processed.processing,
        imageProcessings: [processed.processing],
        imageMetadata: processed.imageMetadata,
        imageOriginalMetadata: processed.imageOriginalMetadata,
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ error: 'السؤال غير موجود' });
    }

    res.json({ success: true, ...processed, question: updated });
    } catch (error) {
    console.error('Upload question image error:', error);
    res.status(mediaErrorStatus(error)).json({
      error: error instanceof Error ? error.message : 'فشل في رفع الصورة',
    });
  }
});

router.post('/questions/upload-image-standalone', requireAdminAuth, uploadQuestionImage.single('image'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'لم يتم رفع أي صورة' });
    }
    res.json({ success: true, ...(await storeQuestionImage(req.file.buffer, req.file.originalname)) });
  } catch (error) {
    res.status(mediaErrorStatus(error)).json({
      error: error instanceof Error ? error.message : 'فشل في رفع الصورة',
    });
  }
});

router.post('/questions/analyze-images', requireAdminAuth, uploadQuestionImage.array('images', 12), async (req: Request, res: Response) => {
  try {
    const files = (req.files as Express.Multer.File[] | undefined) || [];
    if (files.length === 0) {
      return res.status(400).json({ error: 'أرفق صورة واحدة على الأقل' });
    }

    const processedImages = await Promise.all(files.map(async file => ({
      ...(await storeQuestionImage(file.buffer, file.originalname)),
      filename: file.originalname,
    })));

    let extractionResult: Awaited<ReturnType<typeof extractQuestionFromImages>> = {
      extraction: null,
      status: 'unavailable',
      message: 'تعذر تشغيل تحليل الصور.',
    };
    try {
      extractionResult = await extractQuestionFromImages(files.map(file => file.buffer));
    } catch (error) {
      console.error('Question image extraction error:', error);
    }

    res.json({
      success: true,
      images: processedImages,
      extraction: extractionResult.extraction,
      extractionStatus: extractionResult.status,
      extractionError: extractionResult.message,
      extractionAvailable: extractionResult.status === 'ready' && Boolean(extractionResult.extraction),
    });
  } catch (error) {
    console.error('Analyze question images error:', error);
    res.status(mediaErrorStatus(error)).json({
      error: error instanceof Error ? error.message : 'تعذرت معالجة صور السؤال',
    });
  }
});

router.get('/question-images/original/:filename', requireAdminAuth, (req: Request, res: Response) => {
  const originalPath = getPrivateQuestionImageOriginal(req.params.filename);
  if (!originalPath || !fs.existsSync(originalPath)) {
    return res.status(404).json({ error: 'الصورة الأصلية غير موجودة' });
  }
  return res.sendFile(path.resolve(originalPath));
});

router.post('/questions/seed-from-json', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const questionsPath = path.resolve(process.cwd(), 'artifacts/api-server/server/questions.json');
    if (!fs.existsSync(questionsPath)) {
      return res.status(404).json({ error: 'ملف الأسئلة غير موجود' });
    }

    const existingCount = await Question.countDocuments();
    if (existingCount > 0) {
      return res.json({ success: true, message: `الأسئلة موجودة بالفعل (${existingCount} سؤال)`, count: existingCount });
    }

    const fileContent = fs.readFileSync(questionsPath, 'utf-8');
    const questionsData = JSON.parse(fileContent);

    let counter = 1;
    const batch: any[] = [];

    const difficultyMap: Record<string, string> = {
      'التناظر اللفظي': 'beginner',
      'الخطأ الشائع': 'intermediate',
      'المقروء': 'advanced',
      'إكمال الجملة': 'intermediate',
      'المتضادات': 'beginner',
      'الاستنتاج': 'advanced',
    };

    for (const q of (questionsData.verbal || [])) {
      batch.push({
        questionId: counter++,
        category: 'verbal',
        subcategory: q.category || 'التناظر اللفظي',
        text: q.text,
        options: q.options,
        correctOptionIndex: q.correctOptionIndex,
        difficulty: difficultyMap[q.category] || 'intermediate',
        explanation: q.explanation || '',
        topic: q.category || 'verbal',
        keywords: [q.category || 'verbal'],
        section: 1,
        dialect: 'standard',
      });
    }

    for (const q of (questionsData.quantitative || [])) {
      batch.push({
        questionId: counter++,
        category: 'quantitative',
        subcategory: q.category || 'عمليات حسابية',
        text: q.text,
        options: q.options,
        correctOptionIndex: q.correctOptionIndex,
        difficulty: 'intermediate',
        explanation: q.explanation || '',
        topic: q.category || 'quantitative',
        keywords: [q.category || 'quantitative'],
        section: 2,
        dialect: 'standard',
      });
    }

    const CHUNK = 500;
    let inserted = 0;
    for (let i = 0; i < batch.length; i += CHUNK) {
      const chunk = batch.slice(i, i + CHUNK);
      await Question.insertMany(chunk, { ordered: false });
      inserted += chunk.length;
      console.log(`📦 Inserted ${inserted}/${batch.length} questions to MongoDB`);
    }

    res.json({ success: true, count: inserted, message: `تم رفع ${inserted} سؤال إلى MongoDB بنجاح` });
  } catch (error) {
    console.error('Seed questions error:', error);
    res.status(500).json({ error: 'فشل في رفع الأسئلة' });
  }
});

// ── CHAT / SUPPORT ────────────────────────────────────────────

router.post('/chat/send', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const adminSession = (req.session as any).admin;
    const { toUserId, content } = req.body;

    if (!toUserId || !content?.trim()) {
      return res.status(400).json({ error: 'المستخدم والمحتوى مطلوبان' });
    }

    const message = await ChatMessage.create({
      fromUserId: adminSession.adminId,
      fromUserName: adminSession.fullName || 'الدعم الفني',
      fromUserRole: 'admin',
      toUserId,
      content: content.trim(),
      isRead: false,
    });

    const { wss } = await import('./websocket');
    wss.broadcastToUser(toUserId, { type: 'new_message', message });

    res.status(201).json({ success: true, message });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'فشل في إرسال الرسالة' });
  }
});

// ── ADMIN CHAT ────────────────────────────────────────────────

router.get('/chat/conversations', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const rawConversations = await ChatMessage.aggregate([
      { $match: { $or: [{ toUserId: 'admin' }, { fromUserId: 'admin' }] } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: {
            $cond: [{ $eq: ['$fromUserId', 'admin'] }, '$toUserId', '$fromUserId']
          },
          lastMessage: { $first: '$content' },
          lastTime: { $first: '$createdAt' },
          userName: { $first: '$fromUserName' },
          unreadCount: {
            $sum: { $cond: [{ $and: [{ $eq: ['$toUserId', 'admin'] }, { $eq: ['$isRead', false] }] }, 1, 0] }
          }
        }
      },
      { $sort: { lastTime: -1 } }
    ]);

    const conversations = rawConversations.map(c => ({
      userId: c._id,
      userName: c.userName || 'طالب',
      lastMessage: c.lastMessage,
      lastTime: new Date(c.lastTime).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
      unreadCount: c.unreadCount,
    }));

    res.json({ conversations });
  } catch (error) {
    console.error('Conversations error:', error);
    res.status(500).json({ error: 'فشل في جلب المحادثات' });
  }
});

router.get('/chat/messages/:userId', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const messages = await ChatMessage.find({
      $or: [
        { fromUserId: userId, toUserId: 'admin' },
        { fromUserId: 'admin', toUserId: userId },
      ]
    }).sort({ createdAt: 1 }).limit(200);

    await ChatMessage.updateMany(
      { fromUserId: userId, toUserId: 'admin', isRead: false },
      { isRead: true }
    );

    res.json({ messages });
  } catch (error) {
    res.status(500).json({ error: 'فشل في جلب الرسائل' });
  }
});

// ── INSTITUTION REQUESTS ──────────────────────────────────────

router.get('/institutions/active', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const [institutions, approvedRequests] = await Promise.all([
      Institution.find({ isActive: { $ne: false } }).sort({ name: 1 }).lean(),
      InstitutionRequest.find({ status: 'approved' }).sort({ institutionName: 1 }).lean(),
    ]);
    const institutionIds = institutions.map((institution: any) => institution._id);
    const members = institutionIds.length
      ? await User.find({
          institutionId: { $in: institutionIds },
          role: { $in: ['teacher', 'student'] },
          isActive: { $ne: false },
        })
          .select('_id institutionId role fullName username email phone isActive lastVisit createdAt')
          .sort({ role: 1, fullName: 1, username: 1 })
          .lean()
      : [];

    const membersByInstitution = new Map<string, { teachers: any[]; students: any[] }>();
    for (const member of members as any[]) {
      const key = String(member.institutionId);
      const group = membersByInstitution.get(key) || { teachers: [], students: [] };
      const safeMember = {
        id: String(member._id),
        fullName: member.fullName || member.username || 'بدون اسم',
        username: member.username || '',
        email: member.email || '',
        phone: member.phone || '',
        lastVisit: member.lastVisit || null,
        createdAt: member.createdAt || null,
      };
      if (member.role === 'teacher') group.teachers.push(safeMember);
      if (member.role === 'student') group.students.push(safeMember);
      membersByInstitution.set(key, group);
    }

    const result = institutions.map((institution: any) => {
      const group = membersByInstitution.get(String(institution._id)) || { teachers: [], students: [] };
      return {
        id: String(institution._id),
        name: institution.name,
        nameEn: institution.nameEn || '',
        type: institution.type,
        city: institution.city || '',
        email: institution.email || '',
        phone: institution.phone || '',
        subscriptionType: institution.subscriptionType || 'free',
        subscriptionEndDate: institution.subscriptionEndDate || null,
        maxTeachers: institution.maxTeachers || 0,
        maxStudents: institution.maxStudents || 0,
        teacherCount: group.teachers.length,
        studentCount: group.students.length,
        teachers: group.teachers,
        students: group.students,
      };
    });

    const canonicalEmails = new Set(
      result.map((institution) => String(institution.email || '').trim().toLowerCase()).filter(Boolean),
    );
    for (const request of approvedRequests as any[]) {
      const email = String(request.email || '').trim().toLowerCase();
      if (email && canonicalEmails.has(email)) continue;
      result.push({
        id: `request-${String(request._id)}`,
        name: request.institutionName,
        nameEn: '',
        type: request.institutionType === 'training_center' ? 'institute' : request.institutionType,
        city: request.city || '',
        email,
        phone: request.phone || request.whatsapp || '',
        subscriptionType: 'basic',
        subscriptionEndDate: null,
        maxTeachers: 10,
        maxStudents: Number(request.studentsCount) || 100,
        teacherCount: 0,
        studentCount: 0,
        teachers: [],
        students: [],
      });
    }

    res.json({
      institutions: result,
      totals: {
        institutions: result.length,
        teachers: result.reduce((sum, institution) => sum + institution.teacherCount, 0),
        students: result.reduce((sum, institution) => sum + institution.studentCount, 0),
      },
    });
  } catch (error) {
    req.log?.error({ error }, 'Failed to load active institutions');
    res.status(500).json({ error: 'فشل في جلب المؤسسات النشطة' });
  }
});

router.get('/institution-requests', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const status = req.query.status as string;
    const requests = await mongoStorage.getInstitutionRequests(status);
    res.json({ requests, total: requests.length });
  } catch (error) {
    res.status(500).json({ error: 'فشل في جلب طلبات المؤسسات' });
  }
});

router.post('/institution-requests/:id/approve', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const adminSession = (req.session as any).admin;
    const result = await mongoStorage.approveInstitutionRequest(req.params.id, adminSession.adminId);
    if (!result) return res.status(404).json({ error: 'الطلب غير موجود' });
    const request = result.toObject ? result.toObject() : result;
    const institutionType = request.institutionType === 'training_center'
      ? 'institute'
      : request.institutionType;
    await Institution.findOneAndUpdate(
      { email: String(request.email || '').trim().toLowerCase() },
      {
        $setOnInsert: {
          name: request.institutionName,
          type: institutionType,
          email: String(request.email || '').trim().toLowerCase(),
          phone: request.phone || request.whatsapp || '',
          city: request.city || '',
          maxStudents: Number(request.studentsCount) || 100,
          maxTeachers: 10,
          subscriptionType: 'basic',
          isActive: true,
        },
      },
      { upsert: true, returnDocument: 'after', runValidators: true },
    );
    res.json({ success: true, request: result });
  } catch (error) {
    res.status(500).json({ error: 'فشل في الموافقة على الطلب' });
  }
});

router.post('/institution-requests/:id/reject', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const adminSession = (req.session as any).admin;
    const { reason } = req.body;
    const result = await mongoStorage.rejectInstitutionRequest(req.params.id, adminSession.adminId, reason);
    if (!result) return res.status(404).json({ error: 'الطلب غير موجود' });
    res.json({ success: true, request: result });
  } catch (error) {
    res.status(500).json({ error: 'فشل في رفض الطلب' });
  }
});

// ── ADMINS MANAGEMENT ─────────────────────────────────────────

router.get('/admins', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const admins = await Admin.find().select('-password').sort({ createdAt: -1 });
    res.json({ admins });
  } catch (error) {
    res.status(500).json({ error: 'فشل في جلب المديرين' });
  }
});

router.post('/admins', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const { username, password, email, fullName, role } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const admin = await Admin.create({
      username, password: hashedPassword, email, fullName,
      role: role || 'admin',
      permissions: role === 'super_admin' ? ['all'] : ['view_students', 'view_subscriptions'],
    });
    const { password: _, ...adminData } = admin.toObject();
    res.status(201).json({ success: true, admin: adminData });
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'اسم المستخدم أو البريد مستخدم بالفعل' });
    }
    res.status(500).json({ error: 'فشل في إنشاء المدير' });
  }
});

// =========== Broadcast Email ============
router.get('/email/config', requireAdminAuth, (_req: Request, res: Response) => {
  res.json(getMailboxConfig());
});

router.get('/email/messages', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    res.json(req.query.folder === 'sent' ? await listSentMessages() : await listInboxMessages());
  } catch (error) {
    console.error('[Mailbox] list failed:', error);
    res.status(502).json({ error: 'تعذر الاتصال بصندوق البريد' });
  }
});

router.get('/email/messages/:uid', requireAdminAuth, async (req: Request, res: Response) => {
  const uid = Number(req.params.uid);
  if (!Number.isInteger(uid) || uid <= 0) return res.status(400).json({ error: 'معرّف الرسالة غير صحيح' });
  try {
    res.json(req.query.folder === 'sent' ? await getMailboxMessage(getMailboxConfig().sentFolder, uid) : await getInboxMessage(uid));
  } catch (error) {
    console.error('[Mailbox] message read failed:', error);
    res.status(404).json({ error: 'الرسالة غير موجودة أو تعذر قراءتها' });
  }
});

router.patch('/email/messages/:uid/read', requireAdminAuth, async (req: Request, res: Response) => {
  const uid = Number(req.params.uid);
  if (!Number.isInteger(uid) || uid <= 0) return res.status(400).json({ error: 'معرّف الرسالة غير صحيح' });
  try {
    const folder = req.query.folder === 'sent' ? getMailboxConfig().sentFolder : 'INBOX';
    res.json(await markMailboxMessage(folder, uid, Boolean(req.body?.seen)));
  } catch {
    res.status(404).json({ error: 'تعذر تحديث حالة الرسالة' });
  }
});

router.delete('/email/messages/:uid', requireAdminAuth, async (req: Request, res: Response) => {
  const uid = Number(req.params.uid);
  if (!Number.isInteger(uid) || uid <= 0) return res.status(400).json({ error: 'معرّف الرسالة غير صحيح' });
  try {
    const folder = req.query.folder === 'sent' ? getMailboxConfig().sentFolder : 'INBOX';
    res.json(await deleteMailboxMessage(folder, uid));
  } catch {
    res.status(404).json({ error: 'تعذر حذف الرسالة' });
  }
});

router.post('/email/messages', requireAdminAuth, async (req: Request, res: Response) => {
  const { to, subject, text, html, inReplyTo, references } = req.body || {};
  if (!to || !subject || !text) return res.status(400).json({ error: 'المستلم والعنوان والمحتوى مطلوبة' });
  try {
    const sent = await sendMailboxEmail(
      String(to).trim(),
      String(subject).trim(),
      String(text),
      html ? String(html) : undefined,
      { inReplyTo: inReplyTo ? String(inReplyTo) : undefined, references: references ? String(references) : undefined },
    );
    if (!sent) return res.status(502).json({ error: 'تعذر إرسال البريد' });
    res.json({ success: true });
  } catch (error) {
    console.error('[Mailbox] send failed:', error);
    res.status(502).json({ error: 'تعذر إرسال البريد' });
  }
});

router.post('/broadcast-email', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const { subject, body, targetGroup } = req.body;
    if (!subject || !body) return res.status(400).json({ error: 'الموضوع والمحتوى مطلوبان' });

    const { User } = await import('./mongodb/models');
    let query: any = {};
    if (targetGroup === 'subscribed') query.subscriptionStatus = 'active';
    else if (targetGroup === 'free') query = { $or: [{ subscriptionStatus: { $exists: false } }, { subscriptionStatus: 'free' }] };

    const users = await User.find(query, { email: 1, fullName: 1, username: 1 }).limit(5000);
    const emailsToSend = users.filter((u: any) => u.email);

    let sent = 0;
    let failed = 0;
    const { sendCustomEmail } = await import('./services/emailService');

    for (const user of emailsToSend) {
      try {
        const htmlBody = `
          <div style="font-family: Arial, sans-serif; direction: rtl; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px; margin-bottom: 20px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">منصة قدراتك</h1>
            </div>
            <div style="background: #f9f9f9; padding: 25px; border-radius: 12px; line-height: 1.8; color: #333;">
              <p>مرحباً ${(user as any).fullName || (user as any).username || 'الطالب'},</p>
              <div style="margin: 20px 0;">${body.replace(/\n/g, '<br/>')}</div>
              <p style="color: #888; font-size: 13px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 15px;">
                منصة قدراتك - رحلتك نحو التميز والإبداع
              </p>
            </div>
          </div>`;
        const success = await sendCustomEmail((user as any).email, subject, htmlBody, body);
        if (success) sent++; else failed++;
      } catch { failed++; }
    }

    res.json({ success: true, sent, failed, total: emailsToSend.length });
  } catch (error) {
    console.error('Broadcast email error:', error);
    res.status(500).json({ error: 'فشل في إرسال البريد' });
  }
});

// =========== Create Manual Subscription ============
router.post('/subscriptions/create-manual', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const { userId, type, durationDays, price, notes } = req.body;
    const subscriptionTypes = new Set(['free', 'Pro', 'Pro Life', 'Pro Life Plus']);
    const { User, Subscription, PlatformSetting } = await import('./mongodb/models');
    const planSetting = await PlatformSetting.findOne({ key: 'subscription_primary_plan' }).lean();
    const primaryPlan = (planSetting?.value || {}) as Record<string, unknown>;
    const parsedDurationDays = type === 'Pro'
      ? Number(primaryPlan.durationDays || 90)
      : Number(durationDays);
    const parsedPrice = type === 'Pro'
      ? Number(primaryPlan.priceSar ?? 39)
      : Number(price ?? 0);
    if (
      typeof userId !== 'string' ||
      typeof type !== 'string' ||
      !subscriptionTypes.has(type) ||
      !Number.isInteger(parsedDurationDays) ||
      parsedDurationDays < 1 ||
      parsedDurationDays > 3650 ||
      !Number.isFinite(parsedPrice) ||
      parsedPrice < 0
    ) {
      return res.status(400).json({ error: 'userId ونوع الاشتراك والمدة مطلوبة' });
    }
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'المستخدم غير موجود' });

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + parsedDurationDays);

    const adminSession = (req.session as any).admin;
    const sub = await Subscription.create({
      userId,
      type: type as 'free' | 'Pro' | 'Pro Life' | 'Pro Life Plus',
      status: 'active',
      startDate,
      endDate,
      price: parsedPrice,
      paymentMethod: 'manual',
      notes: notes || `أضيف يدوياً بواسطة ${adminSession?.username}`,
      approvedBy: adminSession?._id,
      approvedAt: new Date(),
    });

    await User.findByIdAndUpdate(userId, {
      subscriptionType: type,
      subscriptionStatus: 'active',
      subscriptionStartDate: startDate,
      subscriptionEndDate: endDate,
      isSubscribed: true,
    });
    void notifyAdminSubscription({
      studentName: user.fullName || user.username,
      plan: type,
      price: parsedPrice,
      paymentMethod: 'manual',
      status: 'active',
    }).catch((error) =>
      console.error('Admin manual-subscription WhatsApp notification failed:', error),
    );
    void notifyStudentSubscriptionActivated({
      userId: String(user._id),
      plan: type,
      price: parsedPrice,
      endDate,
    }).catch((error) =>
      console.error('Student manual-subscription WhatsApp notification failed:', error),
    );

    res.status(201).json({ success: true, subscription: sub });
  } catch (error) {
    console.error('Create manual subscription error:', error);
    res.status(500).json({ error: 'فشل في إنشاء الاشتراك' });
  }
});

// =========== EMPLOYEE MANAGEMENT ============
router.get('/employees', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const { Employee } = await import('./mongodb/models');
    const employees = await Employee.find().sort({ createdAt: -1 }).lean();
    res.json({ employees, total: employees.length });
  } catch (error) {
    res.status(500).json({ error: 'فشل في جلب الموظفين' });
  }
});

router.post('/employees', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const { Employee } = await import('./mongodb/models');
    const { fullName, email, phone, role, department, salary, joinDate, permissions, notes } = req.body;
    if (!fullName || !email) return res.status(400).json({ error: 'الاسم والبريد مطلوبان' });
    const employee = await Employee.create({ fullName, email, phone, role: role || 'موظف', department: department || 'عام', salary: salary || 0, joinDate: joinDate ? new Date(joinDate) : new Date(), permissions: permissions || [], notes, status: 'active' });
    res.status(201).json({ success: true, employee });
  } catch (error: any) {
    if (error.code === 11000) return res.status(400).json({ error: 'البريد الإلكتروني مستخدم بالفعل' });
    res.status(500).json({ error: 'فشل في إضافة الموظف' });
  }
});

router.put('/employees/:id', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const { Employee } = await import('./mongodb/models');
    const employee = await Employee.findByIdAndUpdate(req.params.id, { ...req.body, updatedAt: new Date() }, { new: true });
    if (!employee) return res.status(404).json({ error: 'الموظف غير موجود' });
    res.json({ success: true, employee });
  } catch (error) {
    res.status(500).json({ error: 'فشل في تحديث الموظف' });
  }
});

router.delete('/employees/:id', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const { Employee } = await import('./mongodb/models');
    await Employee.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'فشل في حذف الموظف' });
  }
});

// =========== ACCOUNTING / FINANCE ============
router.get('/accounting/summary', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const { Subscription, Expense, Employee } = await import('./mongodb/models');
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const [monthRevenue, yearRevenue, totalRevenue] = await Promise.all([
      Subscription.aggregate([{ $match: { status: 'active', createdAt: { $gte: startOfMonth } } }, { $group: { _id: null, total: { $sum: '$price' } } }]),
      Subscription.aggregate([{ $match: { status: { $in: ['active', 'expired'] }, createdAt: { $gte: startOfYear } } }, { $group: { _id: null, total: { $sum: '$price' } } }]),
      Subscription.aggregate([{ $match: { status: { $in: ['active', 'expired'] } } }, { $group: { _id: null, total: { $sum: '$price' } } }]),
    ]);

    const [monthExpenses, yearExpenses, expenses] = await Promise.all([
      Expense.aggregate([{ $match: { date: { $gte: startOfMonth } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Expense.aggregate([{ $match: { date: { $gte: startOfYear } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Expense.find().sort({ date: -1 }).limit(50).lean(),
    ]);

    const employees = await Employee.find({ status: 'active' }).lean();
    const monthlySalaries = employees.reduce((sum: number, e: any) => sum + (e.salary || 0), 0);

    const revenueByType = await Subscription.aggregate([
      { $match: { status: { $in: ['active', 'expired'] }, createdAt: { $gte: startOfMonth } } },
      { $group: { _id: '$type', total: { $sum: '$price' }, count: { $sum: 1 } } }
    ]);

    res.json({
      revenue: {
        thisMonth: monthRevenue[0]?.total || 0,
        thisYear: yearRevenue[0]?.total || 0,
        total: totalRevenue[0]?.total || 0,
        byType: revenueByType,
      },
      expenses: {
        thisMonth: (monthExpenses[0]?.total || 0) + monthlySalaries,
        thisYear: yearExpenses[0]?.total || 0,
        list: expenses,
        monthlySalaries,
      },
      profit: {
        thisMonth: (monthRevenue[0]?.total || 0) - (monthExpenses[0]?.total || 0) - monthlySalaries,
        thisYear: (yearRevenue[0]?.total || 0) - (yearExpenses[0]?.total || 0),
      },
      employees: { count: employees.length, monthlySalaries },
    });
  } catch (error) {
    console.error('Accounting error:', error);
    res.status(500).json({ error: 'فشل في جلب بيانات المحاسبة' });
  }
});

router.post('/accounting/expenses', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const { Expense } = await import('./mongodb/models');
    const { title, amount, category, date, description } = req.body;
    if (!title || !amount) return res.status(400).json({ error: 'العنوان والمبلغ مطلوبان' });
    const adminSession = (req.session as any).admin;
    const expense = await Expense.create({ title, amount, category: category || 'عام', date: date ? new Date(date) : new Date(), description, createdBy: adminSession?.username || 'admin' });
    res.status(201).json({ success: true, expense });
  } catch (error) {
    res.status(500).json({ error: 'فشل في إضافة المصروف' });
  }
});

router.delete('/accounting/expenses/:id', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const { Expense } = await import('./mongodb/models');
    await Expense.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'فشل في حذف المصروف' });
  }
});

// =========== Delete All Questions by Category ============
router.delete('/questions/category/:category/all', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const { category } = req.params;
    if (!['verbal', 'quantitative'].includes(category)) {
      return res.status(400).json({ error: 'الفئة غير صحيحة' });
    }
    const result = await Question.deleteMany({ category: category as 'verbal' | 'quantitative' });
    res.json({ success: true, deletedCount: result.deletedCount, message: `تم حذف ${result.deletedCount} سؤال من فئة ${category === 'quantitative' ? 'الكمي' : 'اللفظي'}` });
  } catch (error) {
    console.error('Delete questions by category error:', error);
    res.status(500).json({ error: 'فشل في حذف الأسئلة' });
  }
});

// =========== Scheduled Exams Admin ============
router.get('/scheduled-exams', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const { ExamBooking } = await import('./mongodb/models');
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string;

    const query: any = {};
    if (status && status !== 'all') query.status = status;

    const total = await ExamBooking.countDocuments(query);
    const exams = await ExamBooking.find(query)
      .populate('userId', 'username fullName email')
      .sort({ scheduledAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    res.json({ exams, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ error: 'فشل في جلب الاختبارات' });
  }
});

// =========== TEST TEMPLATES ============
router.get('/test-templates', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const { TestTemplate } = await import('./mongodb/models');
    const templates = await TestTemplate.find().sort({ order: 1, createdAt: -1 }).lean();
    res.json({ templates });
  } catch (error) {
    res.status(500).json({ error: 'فشل في جلب قوالب الاختبارات' });
  }
});

router.post('/test-templates', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const { TestTemplate } = await import('./mongodb/models');
    const adminSession = (req.session as any).admin;
    const { name, type, difficulty, questionCount, timeLimit, subcategories, isActive, isPro, description, instructions, order } = req.body;
    if (!name || !type) return res.status(400).json({ error: 'اسم الاختبار ونوعه مطلوبان' });
    const template = await TestTemplate.create({
      name, type, difficulty: difficulty || 'mixed',
      questionCount: questionCount || 20,
      timeLimit: timeLimit || 30,
      subcategories: subcategories || [],
      isActive: isActive !== false,
      isPro: isPro || false,
      description, instructions,
      order: order || 0,
      createdBy: adminSession?.username || 'admin',
    });
    res.status(201).json({ success: true, template });
  } catch (error) {
    res.status(500).json({ error: 'فشل في إنشاء قالب الاختبار' });
  }
});

router.put('/test-templates/:id', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const { TestTemplate } = await import('./mongodb/models');
    const update = { ...req.body, updatedAt: new Date() };
    const template = await TestTemplate.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!template) return res.status(404).json({ error: 'القالب غير موجود' });
    res.json({ success: true, template });
  } catch (error) {
    res.status(500).json({ error: 'فشل في تحديث القالب' });
  }
});

router.delete('/test-templates/:id', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const { TestTemplate } = await import('./mongodb/models');
    await TestTemplate.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'فشل في حذف القالب' });
  }
});

// =========== ANNOUNCEMENTS ============
router.get('/announcements', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const { Announcement } = await import('./mongodb/models');
    const announcements = await Announcement.find().sort({ createdAt: -1 }).lean();
    res.json({ announcements });
  } catch (error) {
    res.status(500).json({ error: 'فشل في جلب الإعلانات' });
  }
});

router.post('/announcements', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const { Announcement } = await import('./mongodb/models');
    const adminSession = (req.session as any).admin;
    const { title, message, type, target, isActive, expiresAt, link, linkText } = req.body;
    if (!title || !message) return res.status(400).json({ error: 'العنوان والرسالة مطلوبان' });
    const announcement = await Announcement.create({
      title, message, type: type || 'info', target: target || 'all',
      isActive: isActive !== false,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      link, linkText,
      createdBy: adminSession?.username || 'admin',
    });
    res.status(201).json({ success: true, announcement });
  } catch (error) {
    res.status(500).json({ error: 'فشل في إنشاء الإعلان' });
  }
});

router.put('/announcements/:id', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const { Announcement } = await import('./mongodb/models');
    const announcement = await Announcement.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!announcement) return res.status(404).json({ error: 'الإعلان غير موجود' });
    res.json({ success: true, announcement });
  } catch (error) {
    res.status(500).json({ error: 'فشل في تحديث الإعلان' });
  }
});

router.delete('/announcements/:id', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const { Announcement } = await import('./mongodb/models');
    await Announcement.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'فشل في حذف الإعلان' });
  }
});

// =========== PLATFORM SETTINGS ============
const DEFAULT_SETTINGS = [
  { key: 'platform_name', label: 'اسم المنصة', value: 'قدراتك', type: 'text', category: 'general', description: 'اسم المنصة الظاهر للمستخدمين' },
  { key: 'platform_tagline', label: 'شعار المنصة', value: 'استعد لقياس بشكل احترافي', type: 'text', category: 'general', description: 'الشعار الفرعي للمنصة' },
  { key: 'monthly_price', label: 'سعر الاشتراك الشهري (ر.س)', value: 49, type: 'number', category: 'pricing', description: 'سعر الاشتراك الشهري' },
  { key: 'quarterly_price', label: 'سعر الاشتراك الربع سنوي (ر.س)', value: 129, type: 'number', category: 'pricing', description: 'سعر الاشتراك كل 3 أشهر' },
  { key: 'semi_annual_price', label: 'سعر الاشتراك نصف سنوي (ر.س)', value: 199, type: 'number', category: 'pricing', description: 'سعر الاشتراك كل 6 أشهر' },
  { key: 'annual_price', label: 'سعر الاشتراك السنوي (ر.س)', value: 299, type: 'number', category: 'pricing', description: 'سعر الاشتراك السنوي' },
  { key: 'free_questions_limit', label: 'حد أسئلة المجانيين', value: 10, type: 'number', category: 'limits', description: 'عدد الأسئلة المسموح بها للمستخدم المجاني في الاختبار' },
  { key: 'allow_new_registrations', label: 'السماح بالتسجيل الجديد', value: true, type: 'boolean', category: 'access', description: 'هل يمكن للمستخدمين الجدد إنشاء حسابات' },
  { key: 'maintenance_mode', label: 'وضع الصيانة', value: false, type: 'boolean', category: 'access', description: 'تفعيل وضع الصيانة يمنع دخول الطلاب' },
  { key: 'bank_account_name', label: 'اسم صاحب الحساب البنكي', value: 'شركة قدراتك التعليمية', type: 'text', category: 'payment', description: 'اسم الحساب البنكي لتحويل الاشتراكات' },
  { key: 'bank_iban', label: 'رقم الآيبان', value: 'SA0000000000000000000000', type: 'text', category: 'payment', description: 'رقم الآيبان للتحويل البنكي' },
  { key: 'bank_name', label: 'اسم البنك', value: 'بنك الراجحي', type: 'text', category: 'payment', description: 'اسم البنك' },
  { key: 'support_email', label: 'بريد الدعم الفني', value: 'info@qodratak.sa', type: 'text', category: 'contact', description: 'البريد الإلكتروني للدعم الفني والنظام' },
  { key: 'support_whatsapp', label: 'واتساب الدعم', value: '+966510510140', type: 'text', category: 'contact', description: 'رقم واتساب للدعم' },
];

router.get('/settings', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const { PlatformSetting } = await import('./mongodb/models');
    let settings = await PlatformSetting.find().lean();
    if (settings.length === 0) {
      const adminSession = (req.session as any).admin;
      const docs = DEFAULT_SETTINGS.map(s => ({ ...s, updatedBy: adminSession?.username || 'admin' }));
      await PlatformSetting.insertMany(docs);
      settings = await PlatformSetting.find().lean();
    }
    const legacySupportEmail = settings.find(setting =>
      setting.key === 'support_email' &&
      ['support@qodratak.com', 'qoudratak@gmail.com', 'Qodratak.Platform@gmail.com'].includes(String(setting.value)),
    );
    if (legacySupportEmail) {
      await PlatformSetting.updateOne(
        { _id: legacySupportEmail._id },
        { $set: { value: 'info@qodratak.sa', updatedAt: new Date() } },
      );
      settings = settings.map(setting =>
        setting._id.equals(legacySupportEmail._id)
          ? { ...setting, value: 'info@qodratak.sa' }
          : setting,
      );
    }
    res.json({ settings });
  } catch (error) {
    res.status(500).json({ error: 'فشل في جلب الإعدادات' });
  }
});

router.put('/settings/:key', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const { PlatformSetting } = await import('./mongodb/models');
    const adminSession = (req.session as any).admin;
    const { value } = req.body;
    const setting = await PlatformSetting.findOneAndUpdate(
      { key: req.params.key },
      { value, updatedBy: adminSession?.username || 'admin', updatedAt: new Date() },
      { new: true, upsert: true }
    );
    res.json({ success: true, setting });
  } catch (error) {
    res.status(500).json({ error: 'فشل في تحديث الإعداد' });
  }
});

const DEFAULT_PRIMARY_SUBSCRIPTION_PLAN = {
  key: 'pro',
  type: 'Pro',
  name: 'خطة قدراتك',
  durationDays: 90,
  priceSar: 39,
  description: 'اشتراك كامل لمدة 3 أشهر يشمل مسارات قدراتك التعليمية.',
  features: [
    'وصول كامل للمحتوى والاختبارات',
    'حفظ التقدم والإحصائيات',
    'خطة يومية ومتابعة مستمرة',
    'دعم فني عبر واتساب',
  ],
};

router.get('/subscription-plan', requireAdminAuth, async (_req: Request, res: Response) => {
  try {
    const { PlatformSetting } = await import('./mongodb/models');
    const setting = await PlatformSetting.findOne({ key: 'subscription_primary_plan' }).lean();
    res.json({ plan: setting?.value || DEFAULT_PRIMARY_SUBSCRIPTION_PLAN });
  } catch (error) {
    console.error('Get subscription plan error:', error);
    res.status(500).json({ error: 'فشل في جلب خطة الاشتراك' });
  }
});

router.put('/subscription-plan', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const { PlatformSetting } = await import('./mongodb/models');
    const { name, durationDays, priceSar, description, features } = req.body || {};
    const parsedDuration = Number(durationDays);
    const parsedPrice = Number(priceSar);
    if (
      typeof name !== 'string' || name.trim().length < 2 || name.length > 120 ||
      !Number.isInteger(parsedDuration) || parsedDuration < 1 || parsedDuration > 3650 ||
      !Number.isFinite(parsedPrice) || parsedPrice < 0 || parsedPrice > 100000 ||
      (description !== undefined && (typeof description !== 'string' || description.length > 500)) ||
      (features !== undefined && (!Array.isArray(features) || features.some((item: unknown) => typeof item !== 'string' || item.length > 160)))
    ) {
      return res.status(400).json({ error: 'بيانات الخطة غير صالحة' });
    }

    const adminSession = (req.session as any).admin;
    const plan = {
      ...DEFAULT_PRIMARY_SUBSCRIPTION_PLAN,
      name: name.trim(),
      durationDays: parsedDuration,
      priceSar: parsedPrice,
      description: typeof description === 'string' ? description.trim() : DEFAULT_PRIMARY_SUBSCRIPTION_PLAN.description,
      features: Array.isArray(features) && features.length > 0 ? features.map((item: string) => item.trim()).filter(Boolean) : DEFAULT_PRIMARY_SUBSCRIPTION_PLAN.features,
      updatedAt: new Date().toISOString(),
    };
    const setting = await PlatformSetting.findOneAndUpdate(
      { key: 'subscription_primary_plan' },
      {
        value: plan,
        label: 'الخطة الأساسية للاشتراك',
        type: 'json',
        category: 'pricing',
        description: 'السعر والمدة المعروضان للطلاب ويستخدمهما الخادم في طلبات الاشتراك',
        updatedBy: adminSession?.username || 'admin',
        updatedAt: new Date(),
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
    res.json({ success: true, plan: setting.value });
  } catch (error) {
    console.error('Update subscription plan error:', error);
    res.status(500).json({ error: 'فشل في تحديث خطة الاشتراك' });
  }
});

// =========== WHATSAPP CONNECTION ============
router.get('/whatsapp/status', requireAdminAuth, (_req: Request, res: Response) => {
  res.json(getWhatsAppStatus());
});

router.post('/whatsapp/connect', requireAdminAuth, async (_req: Request, res: Response) => {
  try {
    await connectWhatsApp();
    res.json(getWhatsAppStatus());
  } catch (error) {
    console.error('[WhatsApp] connect error:', error);
    res.status(500).json({ error: 'تعذر بدء ربط واتساب' });
  }
});

router.post('/whatsapp/disconnect', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const clearSession = req.body?.clearSession === true;
    res.json(await disconnectWhatsApp(clearSession));
  } catch (error) {
    console.error('[WhatsApp] disconnect error:', error);
    res.status(500).json({ error: 'تعذر فصل واتساب' });
  }
});

router.post('/whatsapp/test-message', requireAdminAuth, async (req: Request, res: Response) => {
  void req;
  res.status(403).json({ error: 'رسائل الاختبار معطلة لحماية رقم واتساب' });
});

router.post('/whatsapp/financial-report', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const period = String(req.body?.period || '');
    if (period !== 'daily') {
      return res.status(400).json({ error: 'المتاح هو تقرير نهاية اليوم فقط' });
    }
    await sendAdminFinancialReport(period as 'daily' | 'weekly' | 'monthly');
    res.json({ success: true, message: 'تم إرسال التقرير المالي إلى رقم الإدارة' });
  } catch (error: any) {
    console.error('[WhatsApp] Financial report failed:', error?.message || error);
    const message =
      error?.message === 'WHATSAPP_NOT_CONNECTED'
        ? 'اربط واتساب أولاً'
        : 'تعذر إرسال التقرير المالي حاليًا';
    res.status(400).json({ error: message });
  }
});

router.post('/whatsapp/notification-test', requireAdminAuth, async (_req: Request, res: Response) => {
  res.status(403).json({ error: 'تنبيهات الاختبار معطلة لحماية رقم واتساب' });
});

router.post('/whatsapp/campaign', requireAdminAuth, async (req: Request, res: Response) => {
  void req;
  res.status(403).json({ error: 'حملات واتساب معطلة لحماية الرقم من الحظر' });
});

router.get('/whatsapp/conversations', requireAdminAuth, async (_req: Request, res: Response) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const rows = await WhatsAppMessage.aggregate([
        { $sort: { createdAt: -1 } },
        {
          $group: {
            _id: '$phone',
            senderName: { $first: '$senderName' },
            lastMessage: { $first: '$content' },
            lastTime: { $first: '$createdAt' },
            direction: { $first: '$direction' },
          },
        },
        { $sort: { lastTime: -1 } },
        { $limit: 200 },
      ]);
      return res.json({
        conversations: rows.map((row) => ({
          phone: row._id,
          senderName: row.senderName || row._id,
          lastMessage: row.lastMessage,
          lastTime: row.lastTime,
          direction: row.direction,
        })),
      });
    }

    const grouped = new Map<string, any>();
    for (const message of getRecentWhatsAppMessages().reverse()) {
      if (!grouped.has(message.phone)) grouped.set(message.phone, message);
    }
    return res.json({
      conversations: Array.from(grouped.values()).map((message) => ({
        phone: message.phone,
        senderName: message.senderName,
        lastMessage: message.content,
        lastTime: message.createdAt,
        direction: message.direction,
      })),
    });
  } catch (error) {
    console.error('[WhatsApp] conversations error:', error);
    return res.status(500).json({ error: 'تعذر تحميل محادثات واتساب' });
  }
});

router.get('/whatsapp/messages/:phone', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const phone = String(req.params.phone || '').replace(/\D/g, '');
    if (!phone) return res.status(400).json({ error: 'رقم المحادثة غير صالح' });
    if (mongoose.connection.readyState === 1) {
      const messages = await WhatsAppMessage.find({ phone }).sort({ createdAt: 1 }).limit(300).lean();
      return res.json({ messages });
    }
    return res.json({ messages: getRecentWhatsAppMessages(phone) });
  } catch (error) {
    console.error('[WhatsApp] messages error:', error);
    return res.status(500).json({ error: 'تعذر تحميل الرسائل' });
  }
});

router.post('/whatsapp/messages/:phone', requireAdminAuth, async (req: Request, res: Response) => {
  void req;
  return res.status(403).json({ error: 'الإرسال اليدوي معطل؛ واتساب مخصص للرموز والمعاملات فقط' });
});

// =========== SUPPORT TICKETS ============
router.get('/support-tickets', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const { SupportTicket } = await import('./mongodb/models');
    const status = req.query.status as string;
    const query: any = {};
    if (status && status !== 'all') query.status = status;
    const tickets = await SupportTicket.find(query).sort({ createdAt: -1 }).lean();
    const counts = {
      open: await SupportTicket.countDocuments({ status: 'open' }),
      in_progress: await SupportTicket.countDocuments({ status: 'in_progress' }),
      resolved: await SupportTicket.countDocuments({ status: 'resolved' }),
    };
    res.json({ tickets, counts });
  } catch (error) {
    res.status(500).json({ error: 'فشل في جلب التذاكر' });
  }
});

router.put('/support-tickets/:id', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const { SupportTicket } = await import('./mongodb/models');
    const adminSession = (req.session as any).admin;
    const updates: any = { ...req.body, updatedAt: new Date() };
    if (updates.status === 'resolved' && !updates.resolvedAt) {
      updates.resolvedAt = new Date();
      updates.resolvedBy = adminSession?.username || 'admin';
    }
    const ticket = await SupportTicket.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!ticket) return res.status(404).json({ error: 'التذكرة غير موجودة' });
    res.json({ success: true, ticket });
  } catch (error) {
    res.status(500).json({ error: 'فشل في تحديث التذكرة' });
  }
});

router.delete('/support-tickets/:id', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const { SupportTicket } = await import('./mongodb/models');
    await SupportTicket.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'فشل في حذف التذكرة' });
  }
});

// =========== ADMIN ROLES / PERMISSIONS ============
router.get('/admins', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const { Admin } = await import('./mongodb/models');
    const admins = await Admin.find().select('-password').sort({ createdAt: -1 }).lean();
    res.json({ admins });
  } catch (error) {
    res.status(500).json({ error: 'فشل في جلب المديرين' });
  }
});

router.post('/admins', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const { Admin } = await import('./mongodb/models');
    const bcrypt = await import('bcryptjs');
    const { username, password, fullName, email, role, permissions } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'اسم المستخدم وكلمة المرور مطلوبان' });
    const exists = await Admin.findOne({ username });
    if (exists) return res.status(400).json({ error: 'اسم المستخدم مستخدم بالفعل' });
    const hashed = await bcrypt.default.hash(password, 10);
    const admin = await Admin.create({
      username, password: hashed, fullName, email,
      role: role || 'admin', permissions: permissions || [],
      isActive: true,
    });
    const { password: _, ...adminData } = admin.toObject();
    res.status(201).json({ success: true, admin: adminData });
  } catch (error) {
    res.status(500).json({ error: 'فشل في إنشاء المدير' });
  }
});

router.put('/admins/:id', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const { Admin } = await import('./mongodb/models');
    const updates: any = { ...req.body };
    if (updates.password) {
      const bcrypt = await import('bcryptjs');
      updates.password = await bcrypt.default.hash(updates.password, 10);
    }
    delete updates._id;
    const admin = await Admin.findByIdAndUpdate(req.params.id, updates, { new: true }).select('-password');
    if (!admin) return res.status(404).json({ error: 'المدير غير موجود' });
    res.json({ success: true, admin });
  } catch (error) {
    res.status(500).json({ error: 'فشل في تحديث المدير' });
  }
});

router.delete('/admins/:id', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const { Admin } = await import('./mongodb/models');
    const adminSession = (req.session as any).admin;
    const target = await Admin.findById(req.params.id);
    if (!target) return res.status(404).json({ error: 'المدير غير موجود' });
    if (target.username === adminSession?.username) return res.status(400).json({ error: 'لا يمكنك حذف حسابك الحالي' });
    await Admin.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'فشل في حذف المدير' });
  }
});

// ─── QUESTION REPORTS ───
router.get('/question-reports', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const { QuestionReport } = await import('./mongodb/models');
    const status = req.query.status as string;
    const filter: any = {};
    if (status && status !== 'all') filter.status = status;
    const reports = await QuestionReport.find(filter).sort({ createdAt: -1 }).limit(200);
    const pending = await QuestionReport.countDocuments({ status: 'pending' });
    res.json({ reports, pending });
  } catch (e) {
    res.status(500).json({ error: 'فشل في جلب البلاغات' });
  }
});

router.patch('/question-reports/:id', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const { QuestionReport } = await import('./mongodb/models');
    const { status, adminNote, fixedQuestion } = req.body;
    const updated = await QuestionReport.findByIdAndUpdate(
      req.params.id,
      { status, adminNote, fixedQuestion, reviewedAt: new Date() },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: 'البلاغ غير موجود' });
    res.json({ success: true, report: updated });
  } catch (e) {
    res.status(500).json({ error: 'فشل في تحديث البلاغ' });
  }
});

// ─── USER STATS (for admin analytics panel) ───
router.get('/users/:userId/stats', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const fs = await import('fs');
    const users: any[] = JSON.parse(fs.default.readFileSync('attached_assets/user.json', 'utf8'));
    const user = users.find((u: any) => String(u.id) === req.params.userId);
    if (!user) return res.status(404).json({ error: 'المستخدم غير موجود' });
    const { TestResult } = await import('./mongodb/models');
    const results = await TestResult.find({ userId: req.params.userId }).sort({ createdAt: -1 }).limit(50);
    const scores = results.map((r: any) => r.totalScoreOutOf100 || 0).filter((s: number) => s > 0);
    const avg = scores.length ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length) : 0;
    const verbal = results.filter((r: any) => r.examType === 'verbal');
    const quant = results.filter((r: any) => r.examType === 'quantitative');
    const avgVerbal = verbal.length ? Math.round(verbal.reduce((a: number, r: any) => a + (r.verbalPercent || 0), 0) / verbal.length) : 0;
    const avgQuant = quant.length ? Math.round(quant.reduce((a: number, r: any) => a + (r.quantPercent || 0), 0) / quant.length) : 0;
    res.json({ user, recentTests: results.slice(0, 10), avgScore: avg, avgVerbal, avgQuant, totalTests: results.length });
  } catch (e) {
    res.status(500).json({ error: 'فشل في جلب إحصائيات المستخدم' });
  }
});

// ─── NOTIFY SPECIFIC USER ───
router.post('/users/:userId/notify', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const { InAppNotification } = await import('./mongodb/models');
    const { title, message, type = 'info' } = req.body;
    if (!title || !message) return res.status(400).json({ error: 'العنوان والرسالة مطلوبان' });
    await InAppNotification.create({
      userId: req.params.userId,
      title,
      body: message,
      type,
      target: 'individual',
      isRead: false,
      createdAt: new Date(),
    });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'فشل في إرسال الإشعار' });
  }
});

export default router;
