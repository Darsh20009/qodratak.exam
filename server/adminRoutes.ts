import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { mongoStorage } from './mongodb/mongoStorage';
import { Question, ChatMessage, Admin } from './mongodb/models';
import { sendSubscriptionApprovalEmail } from './services/emailService';

const router = Router();

const uploadDir = 'uploads/receipts';
const questionImagesDir = 'uploads/question-images';
[uploadDir, questionImagesDir].forEach(d => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

function getDevelopmentDemoAdmin(username: string) {
  if (process.env.NODE_ENV === 'production') return null;

  try {
    const users = JSON.parse(fs.readFileSync('attached_assets/user.json', 'utf-8'));
    const normalizedUsername = username.trim().toLowerCase();
    const user = users.find((candidate: any) =>
      candidate?.isDemo &&
      candidate?.role === 'admin' &&
      candidate?.username?.trim().toLowerCase() === normalizedUsername
    );

    return user || null;
  } catch {
    return null;
  }
}

const receiptStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'receipt-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const questionImageStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, questionImagesDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'q-img-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const uploadReceipt = multer({
  storage: receiptStorage,
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

const uploadQuestionImage = multer({
  storage: questionImageStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    if (allowed.test(path.extname(file.originalname).toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error('فقط ملفات الصور مسموح بها'));
    }
  }
});

const requireAdminAuth = async (req: Request, res: Response, next: NextFunction) => {
  const adminSession = (req.session as any)?.admin;
  const isAdminByFlag = (req.session as any)?.isAdmin && (req.session as any)?.adminId;
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
          permissions: (admin as any).permissions || ['all'],
        };
      } else {
        return res.status(401).json({ error: 'يجب تسجيل الدخول كمدير' });
      }
    } catch {
      return res.status(401).json({ error: 'يجب تسجيل الدخول كمدير' });
    }
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
      (req.session as any).admin = {
        adminId: String(demoAdmin.id),
        username: demoAdmin.username,
        fullName: demoAdmin.fullName || demoAdmin.name,
        role: 'system_admin',
        permissions: ['all'],
        isDemo: true,
      };
      (req.session as any).isAdmin = true;
      (req.session as any).adminId = String(demoAdmin.id);

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
        });
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

    (req.session as any).admin = {
      adminId: String(admin._id),
      username: admin.username,
      fullName: admin.fullName,
      role: admin.role,
      permissions: admin.permissions || ['all'],
    };
    (req.session as any).isAdmin = true;
    (req.session as any).adminId = String(admin._id);

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
        }
      });
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'حدث خطأ في تسجيل الدخول' });
  }
});

router.post('/logout', (req: Request, res: Response) => {
  (req.session as any).admin = null;
  res.json({ success: true });
});

router.get('/session', requireAdminAuth, (req: Request, res: Response) => {
  res.json({
    authenticated: true,
    admin: (req.session as any).admin,
  });
});

// ── DASHBOARD ────────────────────────────────────────────────

router.get('/dashboard/stats', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const stats = await mongoStorage.getDashboardStats();
    const questionCount = await mongoStorage.getQuestionCount();

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

router.get('/users', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string;

    const result = await mongoStorage.getAllUsers(page, limit, search);

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
    const user = await mongoStorage.getUserById(req.params.id);
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
    const updated = await mongoStorage.updateUser(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }
    res.json({ success: true, user: updated });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'فشل في تحديث المستخدم' });
  }
});

router.delete('/users/:id', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const { User } = await import('./mongodb/models');
    const result = await User.findByIdAndDelete(req.params.id);
    if (!result) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }
    res.json({ success: true });
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
    const receiptUrl = `/uploads/receipts/${req.file.filename}`;
    res.json({ success: true, receiptUrl });
  } catch (error) {
    res.status(500).json({ error: 'فشل في رفع الملف' });
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
    const { text, category, subcategory, options, correctOptionIndex, difficulty, explanation, imageUrl } = req.body;

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
    const { text, category, subcategory, options, correctOptionIndex, difficulty, explanation, imageUrl } = req.body;

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

    const imageUrl = `/uploads/question-images/${req.file.filename}`;

    const updated = await Question.findByIdAndUpdate(
      req.params.id,
      { imageUrl, updatedAt: new Date() },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ error: 'السؤال غير موجود' });
    }

    res.json({ success: true, imageUrl, question: updated });
  } catch (error) {
    console.error('Upload question image error:', error);
    res.status(500).json({ error: 'فشل في رفع الصورة' });
  }
});

router.post('/questions/upload-image-standalone', requireAdminAuth, uploadQuestionImage.single('image'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'لم يتم رفع أي صورة' });
    }
    const imageUrl = `/uploads/question-images/${req.file.filename}`;
    res.json({ success: true, imageUrl });
  } catch (error) {
    res.status(500).json({ error: 'فشل في رفع الصورة' });
  }
});

router.post('/questions/seed-from-json', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const questionsPath = path.resolve(process.cwd(), 'server/questions.json');
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
    if (!userId || !type || !durationDays) {
      return res.status(400).json({ error: 'userId ونوع الاشتراك والمدة مطلوبة' });
    }
    const { User, Subscription } = await import('./mongodb/models');
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'المستخدم غير موجود' });

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + parseInt(durationDays));

    const adminSession = (req.session as any).admin;
    const sub = await Subscription.create({
      userId,
      type,
      status: 'active',
      startDate,
      endDate,
      price: price || 0,
      paymentMethod: 'admin_manual',
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
    const result = await Question.deleteMany({ category });
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
  { key: 'support_email', label: 'بريد الدعم الفني', value: 'support@qodratak.com', type: 'text', category: 'contact', description: 'البريد الإلكتروني للدعم الفني' },
  { key: 'support_whatsapp', label: 'واتساب الدعم', value: '+966500000000', type: 'text', category: 'contact', description: 'رقم واتساب للدعم' },
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
