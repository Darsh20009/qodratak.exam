import { connectToMongoDB, getConnectionStatus } from './connection';
import {
  User, Admin, Subscription, TestResult, Question,
  ActivityLog, LeaderboardEntry, PaperModelResult, Badge, UserBadge,
  Folder, FolderQuestion, InstitutionRequest, ExamBooking, QuestionHistory,
  Wallet, WalletTransaction, SeasonalExam, SeasonalExamBooking,
  IUser, IAdmin, ISubscription, ITestResult, IQuestion, IActivityLog, IFolder, IFolderQuestion, IInstitutionRequest, IExamBooking
} from './models';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

export class MongoStorage {
  private isInitialized = false;

  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;

    const connected = await connectToMongoDB();
    if (connected) {
      this.isInitialized = true;
      await this.seedDefaultAdmin();
      await this.repairQuestionIds();
      console.log('✅ MongoDB Storage initialized');
    }
    return connected;
  }

  private async seedDefaultAdmin() {
    const existingAdmin = await Admin.findOne({ username: 'admin' });
    const adminEmail = process.env.ADMIN_EMAIL || 'qoudratak@gmail.com';
    const initialAdminPassword = process.env.ADMIN_INITIAL_PASSWORD || 'admin123';
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash(initialAdminPassword, 10);
      await Admin.create({
        username: 'admin',
        password: hashedPassword,
        email: adminEmail,
        fullName: 'مدير النظام',
        role: 'super_admin',
        permissions: ['all'],
      });
      console.log('✅ Default admin created (username: admin; configure ADMIN_INITIAL_PASSWORD for the initial password)');
    } else if (existingAdmin.email === 'admin@qudratuk.com' || existingAdmin.email === 'admin@qodratak.site') {
      await Admin.updateOne({ username: 'admin' }, { $set: { email: adminEmail } });
      console.log(`✅ Updated admin email to ${adminEmail}`);
    }
  }

  private async repairQuestionIds() {
    try {
      const questionsWithoutId = await Question.find({ questionId: { $exists: false } });
      if (questionsWithoutId.length > 0) {
        console.log(`🔧 Found ${questionsWithoutId.length} questions without questionId - repairing...`);
        
        for (let i = 0; i < questionsWithoutId.length; i++) {
          const question = questionsWithoutId[i];
          await Question.findByIdAndUpdate(question._id, {
            questionId: i + 1
          });
        }
        
        console.log(`✅ Repaired ${questionsWithoutId.length} questions with questionId`);
      }
    } catch (error) {
      console.error('Error repairing question IDs:', error);
    }
  }

  isConnected(): boolean {
    return getConnectionStatus();
  }

  // User Operations
  async createUser(userData: Partial<IUser>): Promise<IUser> {
    const hashedPassword = await bcrypt.hash(userData.password!, 10);
    const user = await User.create({
      ...userData,
      password: hashedPassword,
    });
    return user;
  }

  async getUserById(id: string): Promise<IUser | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return User.findById(id);
  }

  async getUserByUsername(username: string): Promise<IUser | null> {
    return User.findOne({ username });
  }

  async updateUser(id: string, updates: Partial<IUser>): Promise<IUser | null> {
    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 10);
    }
    return User.findByIdAndUpdate(id, updates, { new: true });
  }

  async updateUserVisit(id: string): Promise<IUser | null> {
    return User.findByIdAndUpdate(id, {
      lastVisit: new Date(),
      $inc: { totalVisits: 1 }
    }, { new: true });
  }

  async getAllUsers(page = 1, limit = 20, search?: string): Promise<{ users: IUser[], total: number }> {
    const query: any = {};
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }
    
    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
    
    return { users, total };
  }

  async getUserStats(): Promise<any> {
    const totalUsers = await User.countDocuments();
    const activeToday = await User.countDocuments({
      lastVisit: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });
    const activeThisWeek = await User.countDocuments({
      lastVisit: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });
    const newUsersToday = await User.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });
    const newUsersThisWeek = await User.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });

    return {
      totalUsers,
      activeToday,
      activeThisWeek,
      newUsersToday,
      newUsersThisWeek,
    };
  }

  // Admin Operations
  async getAdminByUsername(username: string): Promise<IAdmin | null> {
    return Admin.findOne({ username });
  }

  async getAdminById(id: string): Promise<IAdmin | null> {
    try {
      return Admin.findById(id);
    } catch (error) {
      console.error('Error getting admin by ID:', error);
      return null;
    }
  }

  async bulkCreateUsers(usersData: any[]): Promise<{ created: number; failed: number; errors: any[] }> {
    let created = 0;
    let failed = 0;
    const errors: any[] = [];

    for (const userData of usersData) {
      try {
        const hashedPassword = await bcrypt.hash(userData.password || 'password123', 10);
        
        const userToCreate: any = {
          username: userData.email || userData.name,
          email: userData.email,
          fullName: userData.name,
          password: hashedPassword,
          points: userData.points || 0,
          level: userData.level || 1,
          totalTestsTaken: userData.testsTaken || 0,
          isActive: true,
          createdAt: new Date(),
        };

        const user = await User.create(userToCreate) as any;

        if (userData.subscription && userData.subscription.type) {
          const startDate = new Date(userData.subscription.startDate || new Date());
          const endDate = new Date(userData.subscription.endDate || new Date());

          await Subscription.create({
            userId: user._id,
            type: userData.subscription.type,
            status: endDate > new Date() ? 'active' : 'expired',
            startDate,
            endDate,
            price: 99,
            paymentMethod: 'manual',
            approvedBy: new mongoose.Types.ObjectId(),
            approvedAt: new Date(),
            createdAt: new Date(),
          });
        }

        created++;
      } catch (error) {
        failed++;
        errors.push({
          email: userData.email,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        console.error(`Error creating user ${userData.email}:`, error);
      }
    }

    return { created, failed, errors };
  }

  async validateAdminPassword(admin: IAdmin, password: string): Promise<boolean> {
    return bcrypt.compare(password, admin.password);
  }

  async updateAdminLogin(id: string): Promise<void> {
    await Admin.findByIdAndUpdate(id, { lastLogin: new Date() });
  }

  // Subscription Operations
  async createSubscription(data: Partial<ISubscription>): Promise<ISubscription> {
    return Subscription.create(data);
  }

  async getSubscriptionById(id: string): Promise<ISubscription | null> {
    return Subscription.findById(id).populate('userId', 'username fullName email phone');
  }

  async getUserSubscriptions(userId: string): Promise<ISubscription[]> {
    return Subscription.find({ userId }).sort({ createdAt: -1 });
  }

  async getActiveSubscription(userId: string): Promise<ISubscription | null> {
    return Subscription.findOne({
      userId,
      status: 'active',
      endDate: { $gte: new Date() }
    });
  }

  async getAllSubscriptions(page = 1, limit = 20, status?: string): Promise<{ subscriptions: ISubscription[], total: number }> {
    const query: any = {};
    if (status) {
      query.status = status;
    }
    
    const total = await Subscription.countDocuments(query);
    const subscriptions = await Subscription.find(query)
      .populate('userId', 'username fullName email phone')
      .populate('approvedBy', 'fullName')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
    
    return { subscriptions, total };
  }

  async getPendingSubscriptions(): Promise<ISubscription[]> {
    return Subscription.find({ status: 'pending' })
      .populate('userId', 'username fullName email phone')
      .sort({ createdAt: -1 });
  }

  async updateSubscription(id: string, updates: Partial<ISubscription>): Promise<ISubscription | null> {
    updates.updatedAt = new Date();
    return Subscription.findByIdAndUpdate(id, updates, { new: true });
  }

  async approveSubscription(id: string, adminId: string): Promise<ISubscription | null> {
    // Find the subscription being approved
    const sub = await Subscription.findById(id);
    if (!sub) return null;

    // Calculate duration in ms from the originally requested sub
    const requestedDurationMs = sub.endDate.getTime() - sub.startDate.getTime();

    // Check if the user has an existing active subscription with remaining days
    const existingActive = await Subscription.findOne({
      userId: sub.userId,
      status: 'active',
      endDate: { $gte: new Date() },
      _id: { $ne: sub._id },
    }).sort({ endDate: -1 });

    // Stack: start from existing sub's end date (if any remaining days), else from now
    const newStartDate = (existingActive && existingActive.endDate > new Date())
      ? existingActive.endDate
      : new Date();

    const newEndDate = new Date(newStartDate.getTime() + requestedDurationMs);

    return Subscription.findByIdAndUpdate(id, {
      status: 'active',
      startDate: newStartDate,
      endDate: newEndDate,
      approvedBy: new mongoose.Types.ObjectId(adminId),
      approvedAt: new Date(),
      updatedAt: new Date(),
    }, { new: true });
  }

  async rejectSubscription(id: string, reason: string): Promise<ISubscription | null> {
    return Subscription.findByIdAndUpdate(id, {
      status: 'cancelled',
      rejectionReason: reason,
      updatedAt: new Date(),
    }, { new: true });
  }

  async getSubscriptionStats(): Promise<any> {
    const totalSubscriptions = await Subscription.countDocuments();
    const activeSubscriptions = await Subscription.countDocuments({ status: 'active' });
    const pendingSubscriptions = await Subscription.countDocuments({ status: 'pending' });
    const expiredSubscriptions = await Subscription.countDocuments({ status: 'expired' });
    const cancelledSubscriptions = await Subscription.countDocuments({ status: 'cancelled' });
    
    const newSubscriptionsToday = await Subscription.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });
    const newSubscriptionsThisWeek = await Subscription.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });

    const revenueThisMonth = await Subscription.aggregate([
      {
        $match: {
          status: 'active',
          createdAt: { $gte: new Date(new Date().setDate(1)) }
        }
      },
      { $group: { _id: null, total: { $sum: '$price' } } }
    ]);

    return {
      totalSubscriptions,
      activeSubscriptions,
      pendingSubscriptions,
      expiredSubscriptions,
      cancelledSubscriptions,
      newSubscriptionsToday,
      newSubscriptionsThisWeek,
      revenueThisMonth: revenueThisMonth[0]?.total || 0,
    };
  }

  // Test Result Operations
  async createTestResult(data: Partial<ITestResult>): Promise<ITestResult> {
    const result = await TestResult.create(data);
    
    await User.findByIdAndUpdate(data.userId, {
      $inc: {
        totalTestsTaken: 1,
        points: data.pointsEarned || 0
      }
    });
    
    return result;
  }

  async getUserTestResults(userId: string, page = 1, limit = 20): Promise<{ results: ITestResult[], total: number }> {
    const total = await TestResult.countDocuments({ userId });
    const results = await TestResult.find({ userId })
      .sort({ completedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
    
    return { results, total };
  }

  async getAllTestResults(page = 1, limit = 20): Promise<{ results: ITestResult[], total: number }> {
    const total = await TestResult.countDocuments();
    const results = await TestResult.find()
      .populate('userId', 'username fullName')
      .sort({ completedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
    
    return { results, total };
  }

  async getTestStats(): Promise<any> {
    const totalTests = await TestResult.countDocuments();
    const testsToday = await TestResult.countDocuments({
      completedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });
    const testsThisWeek = await TestResult.countDocuments({
      completedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });

    const avgScore = await TestResult.aggregate([
      { $group: { _id: null, avg: { $avg: '$percentage' } } }
    ]);

    const testsByType = await TestResult.aggregate([
      { $group: { _id: '$testType', count: { $sum: 1 } } }
    ]);

    return {
      totalTests,
      testsToday,
      testsThisWeek,
      averageScore: Math.round(avgScore[0]?.avg || 0),
      testsByType: testsByType.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {}),
    };
  }

  // Activity Log Operations
  async logActivity(userId: string, action: string, details?: any, ipAddress?: string, userAgent?: string): Promise<void> {
    await ActivityLog.create({
      userId: new mongoose.Types.ObjectId(userId),
      action,
      details,
      ipAddress,
      userAgent,
    });
  }

  async getUserActivities(userId: string, limit = 50): Promise<IActivityLog[]> {
    return ActivityLog.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit);
  }

  async getRecentActivities(limit = 100): Promise<IActivityLog[]> {
    return ActivityLog.find()
      .populate('userId', 'username fullName')
      .sort({ createdAt: -1 })
      .limit(limit);
  }

  // Question Operations
  async createQuestion(data: Partial<IQuestion>): Promise<IQuestion> {
    return Question.create(data);
  }

  async bulkCreateQuestions(questions: Partial<IQuestion>[]): Promise<number> {
    const result = await Question.insertMany(questions, { ordered: false });
    return result.length;
  }

  async getQuestions(category?: string, subcategory?: string, difficulty?: string, limit = 50): Promise<IQuestion[]> {
    const query: any = {};
    if (category) query.category = category;
    if (subcategory) query.subcategory = subcategory;
    if (difficulty) query.difficulty = difficulty;
    
    return Question.find(query).limit(limit);
  }

  async getQuestionCount(): Promise<{ verbal: number, quantitative: number, total: number }> {
    const verbal = await Question.countDocuments({ category: 'verbal' });
    const quantitative = await Question.countDocuments({ category: 'quantitative' });
    return { verbal, quantitative, total: verbal + quantitative };
  }

  async getPaginatedQuestions(opts: {
    page?: number; limit?: number; search?: string;
    category?: string; difficulty?: string;
  }): Promise<{ questions: IQuestion[]; total: number; totalPages: number }> {
    const { page = 1, limit = 50, search, category, difficulty } = opts;
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
    return { questions, total, totalPages: Math.ceil(total / limit) };
  }

  async getQuestionById(id: string): Promise<IQuestion | null> {
    return Question.findById(id);
  }

  async updateQuestion(id: string, data: Partial<IQuestion>): Promise<IQuestion | null> {
    return Question.findByIdAndUpdate(id, data, { new: true });
  }

  async deleteQuestion(id: string): Promise<boolean> {
    const result = await Question.findByIdAndDelete(id);
    return !!result;
  }

  async getUserEmails(targetGroup: string): Promise<string[]> {
    const query: any = {};
    if (targetGroup === 'subscribed') {
      query.subscriptionType = { $in: ['Pro', 'Pro Life', 'Pro Life Plus', 'Pro Live', 'pro', 'pro_life', 'pro_life_plus'] };
    }
    const users = await User.find(query).select('email');
    return users.map((u: any) => u.email).filter(Boolean);
  }

  // Leaderboard Operations
  async updateLeaderboard(userId: string, points: number): Promise<void> {
    const existing = await LeaderboardEntry.findOne({ userId });
    
    if (existing) {
      await LeaderboardEntry.findOneAndUpdate(
        { userId },
        {
          $inc: { totalPoints: points, weeklyPoints: points, monthlyPoints: points, totalTests: 1 },
          lastUpdated: new Date(),
        }
      );
    } else {
      await LeaderboardEntry.create({
        userId: new mongoose.Types.ObjectId(userId),
        totalPoints: points,
        weeklyPoints: points,
        monthlyPoints: points,
        totalTests: 1,
        currentRank: 0,
      });
    }

    await this.recalculateRanks();
  }

  private async recalculateRanks(): Promise<void> {
    const entries = await LeaderboardEntry.find().sort({ totalPoints: -1 });
    
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const newRank = i + 1;
      let rankChange: 'up' | 'down' | 'stable' = 'stable';
      
      if (entry.previousRank) {
        if (newRank < entry.previousRank) rankChange = 'up';
        else if (newRank > entry.previousRank) rankChange = 'down';
      }
      
      await LeaderboardEntry.findByIdAndUpdate(entry._id, {
        previousRank: entry.currentRank,
        currentRank: newRank,
        rankChange,
      });
    }
  }

  async getLeaderboard(limit = 100): Promise<IUser[]> {
    const entries = await LeaderboardEntry.find()
      .populate('userId')
      .sort({ totalPoints: -1 })
      .limit(limit);
    
    return entries.map(e => e.userId as any).filter(Boolean);
  }

  // Dashboard Stats
  async getDashboardStats(): Promise<any> {
    const [userStats, subscriptionStats, testStats] = await Promise.all([
      this.getUserStats(),
      this.getSubscriptionStats(),
      this.getTestStats(),
    ]);

    return {
      users: userStats,
      subscriptions: subscriptionStats,
      tests: testStats,
    };
  }

  // Folder Operations
  async createFolder(data: { userId: string | number; name: string; description?: string; color?: string; icon?: string; isDefault?: boolean }): Promise<IFolder> {
    try {
      const userId = String(data.userId);
      const folder = await Folder.create({
        userId,
        name: data.name,
        description: data.description,
        color: data.color || '#4f46e5',
        icon: data.icon || 'folder',
        isDefault: data.isDefault || false,
      });
      return folder;
    } catch (error) {
      console.error('Error creating folder:', error);
      throw error;
    }
  }

  async getFoldersByUser(userId: string | number): Promise<IFolder[]> {
    const id = String(userId);
    return Folder.find({ userId: id }).sort({ createdAt: -1 });
  }

  async getFolderById(id: string | number): Promise<IFolder | null> {
    const folderId = String(id);
    // Query by _id directly if it's a valid ObjectId, otherwise query by id field
    try {
      return Folder.findById(folderId);
    } catch (error) {
      // Fallback: query by custom id field if MongoDB ObjectId conversion fails
      return Folder.findOne({ id: folderId });
    }
  }

  async deleteFolder(id: string | number): Promise<boolean> {
    const folderId = String(id);
    let result;
    try {
      result = await Folder.findByIdAndDelete(folderId);
    } catch (error) {
      // Fallback: delete by custom id field
      result = await Folder.findOneAndDelete({ id: folderId });
    }
    if (result) {
      await FolderQuestion.deleteMany({ folderId });
      return true;
    }
    return false;
  }

  async addQuestionToFolder(data: { folderId: string | number; questionId: number; notes?: string }): Promise<IFolderQuestion> {
    const folderId = String(data.folderId);
    const existing = await FolderQuestion.findOne({
      folderId,
      questionId: data.questionId
    });
    
    if (existing) return existing;

    const folderQuestion = await FolderQuestion.create({
      folderId,
      questionId: data.questionId,
      notes: data.notes,
    });
    return folderQuestion;
  }

  async addQuestionsToFolderBulk(folderId: string | number, questionIds: number[]): Promise<{ added: number; skipped: number; total: number }> {
    const id = String(folderId);
    let added = 0;
    let skipped = 0;

    for (const questionId of questionIds) {
      const exists = await FolderQuestion.findOne({
        folderId: id,
        questionId
      });

      if (exists) {
        skipped++;
        continue;
      }

      await FolderQuestion.create({
        folderId: id,
        questionId,
      });
      added++;
    }

    return { added, skipped, total: questionIds.length };
  }

  async getQuestionsInFolder(folderId: string | number): Promise<any[]> {
    const id = String(folderId);
    const folderQuestions = await FolderQuestion.find({
      folderId: id
    });
    const questionIds = folderQuestions.map(fq => fq.questionId);
    
    if (questionIds.length === 0) return [];
    
    // Question IDs are numbers, not ObjectIds - search by questionId field
    return await Question.find({ questionId: { $in: questionIds } });
  }

  async getQuestionIdsInFolder(folderId: string | number): Promise<number[]> {
    const id = String(folderId);
    const folderQuestions = await FolderQuestion.find({
      folderId: id
    });
    return folderQuestions.map(fq => fq.questionId);
  }

  async removeQuestionFromFolder(folderId: string | number, questionId: number): Promise<boolean> {
    const id = String(folderId);
    const result = await FolderQuestion.findOneAndDelete({
      folderId: id,
      questionId
    });
    return !!result;
  }

  // Institution Request Operations
  async createInstitutionRequest(data: Partial<IInstitutionRequest>): Promise<IInstitutionRequest> {
    return await InstitutionRequest.create(data);
  }

  async getInstitutionRequests(status?: string): Promise<IInstitutionRequest[]> {
    const query = status ? { status } : {};
    return await InstitutionRequest.find(query).sort({ createdAt: -1 });
  }

  async getInstitutionRequestById(id: string): Promise<IInstitutionRequest | null> {
    return await InstitutionRequest.findById(id);
  }

  async updateInstitutionRequest(id: string, updates: Partial<IInstitutionRequest>): Promise<IInstitutionRequest | null> {
    return await InstitutionRequest.findByIdAndUpdate(id, updates, { new: true });
  }

  async approveInstitutionRequest(requestId: string, adminId: string): Promise<IInstitutionRequest | null> {
    return await InstitutionRequest.findByIdAndUpdate(requestId, {
      status: 'approved',
      reviewedBy: adminId,
      reviewedAt: new Date()
    }, { new: true });
  }

  async rejectInstitutionRequest(requestId: string, adminId: string, reason: string): Promise<IInstitutionRequest | null> {
    return await InstitutionRequest.findByIdAndUpdate(requestId, {
      status: 'rejected',
      reviewedBy: adminId,
      reviewedAt: new Date(),
      rejectionReason: reason
    }, { new: true });
  }

  async validateUserPassword(user: IUser, password: string): Promise<boolean> {
    return await bcrypt.compare(password, user.password);
  }

  async getUserByEmail(email: string): Promise<IUser | null> {
    const normalized = email.trim().toLowerCase();
    return User.findOne({ email: { $regex: new RegExp(`^${normalized}$`, 'i') } });
  }

  async setUserOTP(email: string, otp: string, expiry: Date): Promise<void> {
    await User.findOneAndUpdate(
      { email },
      { otpCode: otp, otpExpiry: expiry },
      { upsert: false }
    );
  }

  async verifyUserOTP(email: string, otp: string): Promise<{ success: boolean; error?: string }> {
    const user = await User.findOne({ email });
    if (!user) {
      return { success: false, error: 'البريد الإلكتروني غير موجود' };
    }
    if (!user.otpCode || !user.otpExpiry) {
      return { success: false, error: 'لم يتم طلب رمز تحقق لهذا البريد' };
    }
    if (new Date() > user.otpExpiry) {
      return { success: false, error: 'انتهت صلاحية رمز التحقق. يرجى طلب رمز جديد' };
    }
    if (user.otpCode !== otp) {
      return { success: false, error: 'رمز التحقق غير صحيح' };
    }

    await User.findByIdAndUpdate(user._id, {
      emailVerified: true,
      isVerified: true,
      otpCode: undefined,
      otpExpiry: undefined,
    });

    return { success: true };
  }

  async checkFreeTrialUsed(email: string): Promise<boolean> {
    const user = await User.findOne({ freeTrialEmail: email, freeTrialActivated: true });
    return !!user;
  }

  async activateFreeTrial(userId: string, email: string, endDate: Date): Promise<void> {
    await User.findByIdAndUpdate(userId, {
      freeTrialActivated: true,
      freeTrialEmail: email,
      trialUsed: true,
      trialStartDate: new Date(),
      trialEndDate: endDate,
    });
  }

  // ========== Exam Booking Methods ==========

  // Auto-cancel bookings whose 60-minute window has expired
  private async cancelExpiredBookings(userId: string): Promise<void> {
    const expiredCutoff = new Date(Date.now() - 60 * 60 * 1000); // 60 minutes ago
    await ExamBooking.updateMany(
      { userId, status: { $in: ['pending', 'active'] }, scheduledAt: { $lt: expiredCutoff } },
      { status: 'cancelled' }
    );
  }

  async createExamBooking(userId: string, scheduledAt: Date, examType?: string): Promise<IExamBooking> {
    // First cancel any expired bookings so they don't block new ones
    await this.cancelExpiredBookings(userId);
    const activeBooking = await ExamBooking.findOne({ userId, status: { $in: ['pending', 'active'] } });
    if (activeBooking) {
      throw new Error('لديك حجز نشط بالفعل. يجب إكماله أو إلغاؤه قبل حجز اختبار جديد');
    }
    const validTypes = ['qudrat_scientific', 'qudrat_literary', 'tahsili'];
    const resolvedType = examType && validTypes.includes(examType) ? examType : 'qudrat_scientific';
    const booking = new ExamBooking({ userId, scheduledAt, status: 'pending', examType: resolvedType });
    return booking.save();
  }

  async getUserActiveBooking(userId: string): Promise<IExamBooking | null> {
    // Auto-cancel expired bookings before returning the active one
    await this.cancelExpiredBookings(userId);
    return ExamBooking.findOne({ userId, status: { $in: ['pending', 'active'] } }).sort({ scheduledAt: 1 });
  }

  async getUserExamHistory(userId: string): Promise<IExamBooking[]> {
    return ExamBooking.find({ userId }).sort({ createdAt: -1 }).limit(20);
  }

  async getExamBookingById(bookingId: string): Promise<IExamBooking | null> {
    return ExamBooking.findById(bookingId);
  }

  async activateExamBooking(bookingId: string): Promise<void> {
    await ExamBooking.findByIdAndUpdate(bookingId, { status: 'active' });
  }

  async cancelExamBooking(bookingId: string, userId: string): Promise<boolean> {
    const result = await ExamBooking.findOneAndUpdate(
      { _id: bookingId, userId, status: { $in: ['pending'] } },
      { status: 'cancelled' }
    );
    return !!result;
  }

  async submitExamBooking(bookingId: string, userId: string, data: {
    sectionResults: any[];
    totalScore: number;
    verbalScore: number;
    quantScore: number;
    totalScoreOutOf100: number;
    verbalPercent: number;
    quantPercent: number;
    correctAnswers: number;
    wrongAnswers: number;
    skippedAnswers: number;
    cheatingFlag: boolean;
    cheatingViolations: number;
    questionIds: string[];
  }): Promise<IExamBooking | null> {
    const now = new Date();
    const delayMs = (10 + Math.floor(Math.random() * 6)) * 60 * 1000;
    return ExamBooking.findOneAndUpdate(
      { _id: bookingId, userId },
      {
        ...data,
        status: 'completed',
        completedAt: now,
        resultVisibleAt: new Date(now.getTime() + delayMs),
        aiReviewDone: false,
        totalQuestions: 100,
      },
      { new: true }
    );
  }

  async updateExamBookingAfterAiReview(bookingId: string, corrected: {
    sectionResults: any[];
    totalScore: number;
    verbalScore: number;
    quantScore: number;
    totalScoreOutOf100: number;
    verbalPercent: number;
    quantPercent: number;
    correctAnswers: number;
    wrongAnswers: number;
    skippedAnswers: number;
  }): Promise<void> {
    await ExamBooking.findByIdAndUpdate(bookingId, {
      ...corrected,
      aiReviewDone: true,
      resultVisibleAt: new Date(),
    });
  }

  async markExamResultEmailSent(bookingId: string): Promise<void> {
    await ExamBooking.findByIdAndUpdate(bookingId, { resultSentByEmail: true });
  }

  async getPendingAiReviews(): Promise<IExamBooking[]> {
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    return ExamBooking.find({
      status: 'completed',
      aiReviewDone: false,
      completedAt: { $lte: fifteenMinutesAgo },
    }).lean() as any;
  }

  async getAllExamBookingsForSlots(from: Date, to: Date): Promise<{ scheduledAt: Date }[]> {
    return ExamBooking.find(
      { scheduledAt: { $gte: from, $lte: to }, status: { $in: ['pending', 'active'] } },
      { scheduledAt: 1 }
    );
  }

  // ========== Question History Methods ==========

  async markQuestionsAsSeen(userId: string, questionIds: string[]): Promise<void> {
    await QuestionHistory.findOneAndUpdate(
      { userId },
      { $addToSet: { seenQuestionIds: { $each: questionIds } }, updatedAt: new Date() },
      { upsert: true }
    );
  }

  async getSeenQuestionIds(userId: string): Promise<string[]> {
    const history = await QuestionHistory.findOne({ userId });
    return history?.seenQuestionIds || [];
  }

  async getUnseenQuestions(userId: string, count: number, filters: { category?: string; subcategory?: string } = {}): Promise<IQuestion[]> {
    const seenIds = await this.getSeenQuestionIds(userId);
    const query: any = {};
    if (filters.category) query.category = filters.category;
    if (filters.subcategory) query.subcategory = filters.subcategory;
    if (seenIds.length > 0) {
      query.questionId = { $nin: seenIds.map(id => parseInt(id)).filter(n => !isNaN(n)) };
    }
    const questions = await Question.aggregate([
      { $match: query },
      { $sample: { size: count * 3 } },
      { $limit: count },
    ]);
    if (questions.length < count) {
      const extra = await Question.aggregate([
        { $match: filters.category ? { category: filters.category } : {} },
        { $sample: { size: count - questions.length } },
      ]);
      const existingIds = new Set(questions.map((q: any) => q._id.toString()));
      for (const q of extra) {
        if (!existingIds.has(q._id.toString())) {
          questions.push(q);
          if (questions.length >= count) break;
        }
      }
    }
    return questions;
  }

  async clearQuestionHistory(userId: string): Promise<void> {
    await QuestionHistory.deleteOne({ userId });
  }

  // ========== WebAuthn Credentials ==========

  async getUserWebAuthnCredentials(userId: string): Promise<any[]> {
    const user = await User.findById(userId);
    return user?.webauthnCredentials || [];
  }

  async removeWebAuthnCredential(userId: string, credentialID: string): Promise<void> {
    await User.findByIdAndUpdate(userId, {
      $pull: { webauthnCredentials: { credentialID } }
    });
  }

  // ========== PIN Methods ==========

  async setUserPin(userId: string, pinHash: string): Promise<void> {
    await User.findByIdAndUpdate(userId, { pinHash });
  }

  async getUserPinHash(userId: string): Promise<string | null> {
    const user = await User.findById(userId, { pinHash: 1 });
    return user?.pinHash || null;
  }

  // Migrate data from MemStorage to MongoDB
  async migrateFromMemStorage(memStorage: any): Promise<void> {
    try {
      // Migrate questions
      const allQuestions = memStorage?.questions || [];
      if (allQuestions.length > 0) {
        const existingQuestions = await Question.countDocuments();
        if (existingQuestions === 0) {
          await Question.insertMany(allQuestions.map((q: any) => ({
            questionId: q.id,
            category: q.category,
            text: q.text,
            options: q.options,
            correctOptionIndex: q.correctOptionIndex,
            difficulty: q.difficulty,
            explanation: q.explanation,
          })));
          console.log(`✅ Migrated ${allQuestions.length} questions to MongoDB`);
        }
      }

      // Migrate leaderboard entries
      const leaderboardEntries = memStorage?.leaderboardEntries || [];
      if (leaderboardEntries.length > 0) {
        const existingEntries = await LeaderboardEntry.countDocuments();
        if (existingEntries === 0) {
          await LeaderboardEntry.insertMany(leaderboardEntries);
          console.log(`✅ Migrated ${leaderboardEntries.length} leaderboard entries to MongoDB`);
        }
      }
    } catch (error) {
      console.error('Error migrating data from MemStorage:', error);
    }
  }

  // ─────────────────────────── WALLET ───────────────────────────

  async getWallet(userId: string): Promise<any | null> {
    return Wallet.findOne({ userId }).lean();
  }

  async ensureWallet(userId: string, username: string = ''): Promise<any> {
    let wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      wallet = await Wallet.create({ userId, username, balance: 0, totalEarned: 0 });
    }
    return wallet;
  }

  async addToWallet(userId: string, username: string, amount: number, description: string, adminId?: string): Promise<any> {
    await this.ensureWallet(userId, username);
    const wallet = await Wallet.findOneAndUpdate(
      { userId },
      { $inc: { balance: amount, totalEarned: amount }, updatedAt: new Date() },
      { new: true }
    );
    await WalletTransaction.create({ userId, type: 'credit', amount, description, adminId });
    return wallet;
  }

  async deductFromWallet(userId: string, amount: number, description: string): Promise<any> {
    const wallet = await Wallet.findOne({ userId });
    if (!wallet || wallet.balance < amount) throw new Error('رصيد غير كافٍ في المحفظة');
    const updated = await Wallet.findOneAndUpdate(
      { userId },
      { $inc: { balance: -amount }, updatedAt: new Date() },
      { new: true }
    );
    await WalletTransaction.create({ userId, type: 'debit', amount, description });
    return updated;
  }

  async transferWallet(fromUserId: string, toUserId: string, toUsername: string, amount: number, note?: string): Promise<void> {
    const fromWallet = await Wallet.findOne({ userId: fromUserId });
    if (!fromWallet || fromWallet.balance < amount) throw new Error('رصيد غير كافٍ للتحويل');
    await Wallet.findOneAndUpdate({ userId: fromUserId }, { $inc: { balance: -amount }, updatedAt: new Date() });
    await this.ensureWallet(toUserId, toUsername);
    await Wallet.findOneAndUpdate({ userId: toUserId }, { $inc: { balance: amount }, updatedAt: new Date() });
    const desc = note || `تحويل لـ ${toUsername}`;
    await WalletTransaction.create({ userId: fromUserId, type: 'transfer_out', amount, description: desc, toUserId });
    await WalletTransaction.create({ userId: toUserId, type: 'transfer_in', amount, description: `تحويل من مستخدم`, fromUserId });
  }

  async getWalletTransactions(userId: string, limit: number = 50): Promise<any[]> {
    return WalletTransaction.find({ userId }).sort({ createdAt: -1 }).limit(limit).lean();
  }

  async getAllWallets(limit: number = 100): Promise<any[]> {
    return Wallet.find().sort({ balance: -1 }).limit(limit).lean();
  }

  // ─────────────────────────── SEASONAL EXAMS ───────────────────────────

  async createSeasonalExam(data: any): Promise<any> {
    const exam = await SeasonalExam.create({ ...data, questionCount: data.questions?.length || 0 });
    return (exam as any).toObject();
  }

  async getSeasonalExams(activeOnly: boolean = false): Promise<any[]> {
    const filter = activeOnly ? { isActive: true } : {};
    return SeasonalExam.find(filter).sort({ startDate: -1 }).lean();
  }

  async getSeasonalExam(id: string): Promise<any | null> {
    return SeasonalExam.findById(id).lean();
  }

  async updateSeasonalExam(id: string, data: any): Promise<any | null> {
    if (data.questions) data.questionCount = data.questions.length;
    return SeasonalExam.findByIdAndUpdate(id, data, { new: true }).lean();
  }

  async deleteSeasonalExam(id: string): Promise<void> {
    await SeasonalExam.findByIdAndDelete(id);
    await SeasonalExamBooking.deleteMany({ examId: id });
  }

  async bookSeasonalExam(examId: string, userId: string, username: string): Promise<any> {
    const exam = await SeasonalExam.findById(examId);
    if (!exam) throw new Error('الاختبار غير موجود');
    if (!exam.isActive) throw new Error('هذا الاختبار غير متاح');
    if (exam.bookingDeadline && new Date() > exam.bookingDeadline) throw new Error('انتهت مهلة الحجز');
    if (exam.maxParticipants) {
      const count = await SeasonalExamBooking.countDocuments({ examId });
      if (count >= exam.maxParticipants) throw new Error('اكتمل عدد المقاعد');
    }
    const existing = await SeasonalExamBooking.findOne({ examId, userId });
    if (existing) throw new Error('لقد قمت بحجز هذا الاختبار مسبقاً');
    const booking = await SeasonalExamBooking.create({ examId, userId, username });
    return booking.toObject();
  }

  async getSeasonalExamBookings(examId: string): Promise<any[]> {
    return SeasonalExamBooking.find({ examId }).sort({ bookedAt: 1 }).lean();
  }

  async getUserSeasonalBookings(userId: string): Promise<any[]> {
    const bookings = await SeasonalExamBooking.find({ userId }).lean();
    const result = [];
    for (const b of bookings) {
      const exam = await SeasonalExam.findById(b.examId).lean();
      result.push({ ...b, exam });
    }
    return result;
  }

  async cancelSeasonalBooking(examId: string, userId: string): Promise<void> {
    await SeasonalExamBooking.findOneAndDelete({ examId, userId });
  }
}

export const mongoStorage = new MongoStorage();
