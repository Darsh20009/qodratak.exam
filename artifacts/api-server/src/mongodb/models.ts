import mongoose, { Schema, Document } from 'mongoose';

export type UserRole = 'student' | 'parent' | 'teacher' | 'institution_admin' | 'system_admin' | 'support_admin';

export interface IUser extends Document {
  username: string;
  password: string;
  email?: string;
  phone?: string;
  fullName?: string;
  role: UserRole;
  institutionId?: mongoose.Types.ObjectId;
  points: number;
  level: number;
  deviceId?: string;
  trialUsed: boolean;
  trialStartDate?: Date;
  trialEndDate?: Date;
  lastTrialReset?: Date;
  lastVisit: Date;
  totalVisits: number;
  totalTestsTaken: number;
  totalStudyTime: number;
  createdAt: Date;
  lastLogin: Date;
  isActive: boolean;
  isVerified: boolean;
  emailVerified: boolean;
  otpCode?: string;
  otpExpiry?: Date;
  freeTrialActivated: boolean;
  freeTrialEmail?: string;
  webauthnCredentials?: IWebAuthnCredential[];
  devices?: IRegisteredDevice[];
  avatar?: string;
  bio?: string;
  pinHash?: string;
  totpSecret?: string;
  twoFactorEnabled?: boolean;
  twoFactorMethods?: string[];
  recoveryPassphrase?: string;
  pushChallenge?: { code: number; expiresAt: Date };
  pending2FAUserId?: string;
  resetPasswordToken?: string;
  resetPasswordTokenExpiry?: Date | string;
  telegramId?: string;
  telegramChatId?: number;
  whatsappPhone?: string;
  childIds?: string[];
  notifExamReminder?: boolean;
  notifWeeklyReport?: boolean;
  weeklyReportLastSent?: Date;
  subscription?: {
    type: string;
    status: string;
    startDate?: string;
    endDate?: string;
    trialDays?: number;
    isPermanent?: boolean;
  };
  city?: string;
  academicTrack?: string;
  gradeLevel?: string;
  studyGoal?: string;
  targetScore?: number;
  securitySetupDone?: boolean;
  guestInvite?: {
    email: string;
    token: string;
    status: 'pending' | 'accepted';
    sentAt: Date;
    invitedUserId?: string;
  };
}

export interface IWebAuthnCredential {
  credentialID: string;
  credentialPublicKey: string;
  counter: number;
  deviceName?: string;
  createdAt: Date;
}

export interface IRegisteredDevice {
  deviceKey: string;
  label: string;
  ipHash: string;
  userAgent: string;
  firstSeenAt: Date;
  lastSeenAt: Date;
}

export interface IWhatsAppMessage extends Document {
  messageId: string;
  phone: string;
  senderName: string;
  content: string;
  direction: 'inbound' | 'outbound';
  createdAt: Date;
}

const webAuthnCredentialSchema = new Schema<IWebAuthnCredential>({
  credentialID: { type: String, required: true },
  credentialPublicKey: { type: String, required: true },
  counter: { type: Number, default: 0 },
  deviceName: { type: String },
  createdAt: { type: Date, default: Date.now },
});

const registeredDeviceSchema = new Schema<IRegisteredDevice>({
  deviceKey: { type: String, required: true },
  label: { type: String, required: true },
  ipHash: { type: String, required: true },
  userAgent: { type: String, required: true },
  firstSeenAt: { type: Date, default: Date.now },
  lastSeenAt: { type: Date, default: Date.now },
}, { _id: false });

const whatsAppMessageSchema = new Schema<IWhatsAppMessage>({
  messageId: { type: String, required: true, unique: true },
  phone: { type: String, required: true, index: true },
  senderName: { type: String, required: true },
  content: { type: String, required: true },
  direction: { type: String, enum: ['inbound', 'outbound'], required: true },
  createdAt: { type: Date, default: Date.now, index: true },
});

const userSchema = new Schema<IUser>({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, sparse: true, index: true },
  phone: { type: String, sparse: true },
  fullName: { type: String },
  role: { type: String, enum: ['student', 'parent', 'teacher', 'institution_admin', 'system_admin', 'support_admin'], default: 'student' },
  institutionId: { type: Schema.Types.ObjectId, ref: 'Institution' },
  points: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  deviceId: { type: String },
  trialUsed: { type: Boolean, default: false },
  trialStartDate: { type: Date },
  trialEndDate: { type: Date },
  lastTrialReset: { type: Date },
  lastVisit: { type: Date, default: Date.now },
  totalVisits: { type: Number, default: 0 },
  totalTestsTaken: { type: Number, default: 0 },
  totalStudyTime: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  lastLogin: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
  isVerified: { type: Boolean, default: false },
  emailVerified: { type: Boolean, default: false },
  otpCode: { type: String },
  otpExpiry: { type: Date },
  freeTrialActivated: { type: Boolean, default: false },
  freeTrialEmail: { type: String },
  webauthnCredentials: { type: [webAuthnCredentialSchema], default: [] },
  devices: { type: [registeredDeviceSchema], default: [] },
  avatar: { type: String },
  bio: { type: String },
  pinHash: { type: String },
  totpSecret: { type: String },
  twoFactorEnabled: { type: Boolean, default: false },
  twoFactorMethods: { type: [String], default: [] },
  recoveryPassphrase: { type: String },
  pushChallenge: { type: Schema.Types.Mixed },
  resetPasswordToken: { type: String },
  resetPasswordTokenExpiry: { type: Date },
  telegramId: { type: String, sparse: true },
  telegramChatId: { type: Number },
  whatsappPhone: { type: String },
  childIds: { type: [String], default: [] },
  notifExamReminder: { type: Boolean, default: true },
  notifWeeklyReport: { type: Boolean, default: true },
  weeklyReportLastSent: { type: Date },
  subscription: { type: Schema.Types.Mixed },
  city: { type: String },
  academicTrack: { type: String },
  gradeLevel: { type: String },
  studyGoal: { type: String },
  targetScore: { type: Number },
  securitySetupDone: { type: Boolean, default: false },
  guestInvite: {
    type: {
      email: { type: String },
      token: { type: String },
      status: { type: String, enum: ['pending', 'accepted'], default: 'pending' },
      sentAt: { type: Date, default: Date.now },
      invitedUserId: { type: String },
    },
    default: undefined,
  },
});

export interface IInstitution extends Document {
  name: string;
  nameEn?: string;
  type: 'school' | 'institute' | 'university';
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  adminUserId?: mongoose.Types.ObjectId;
  maxStudents: number;
  maxTeachers: number;
  isActive: boolean;
  subscriptionType: 'basic' | 'premium' | 'enterprise';
  subscriptionEndDate?: Date;
  logo?: string;
  createdAt: Date;
  updatedAt: Date;
}

const institutionSchema = new Schema<IInstitution>({
  name: { type: String, required: true },
  nameEn: { type: String },
  type: { type: String, enum: ['school', 'institute', 'university'], required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  address: { type: String },
  city: { type: String },
  adminUserId: { type: Schema.Types.ObjectId, ref: 'User' },
  maxStudents: { type: Number, default: 100 },
  maxTeachers: { type: Number, default: 10 },
  isActive: { type: Boolean, default: true },
  subscriptionType: { type: String, enum: ['basic', 'premium', 'enterprise'], default: 'basic' },
  subscriptionEndDate: { type: Date },
  logo: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export interface IAdmin extends Document {
  username: string;
  password: string;
  email: string;
  phone?: string;
  fullName: string;
  role: 'super_admin' | 'admin' | 'moderator';
  permissions: string[];
  createdAt: Date;
  lastLogin: Date;
  isActive: boolean;
}

const adminSchema = new Schema<IAdmin>({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, sparse: true, unique: true },
  fullName: { type: String, required: true },
  role: { type: String, enum: ['super_admin', 'admin', 'moderator'], default: 'admin' },
  permissions: { type: [String], default: ['view_students', 'view_subscriptions'] },
  createdAt: { type: Date, default: Date.now },
  lastLogin: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
});

export interface ISubscription extends Document {
  userId: mongoose.Types.ObjectId | string | number;
  type: 'free' | 'Pro' | 'Pro Life' | 'Pro Life Plus';
  status: 'pending' | 'active' | 'expired' | 'cancelled';
  startDate: Date;
  endDate: Date;
  autoRenew: boolean;
  paymentMethod?: 'bank' | 'stc' | 'manual' | 'paypal' | 'card' | 'wallet';
  transactionId?: string;
  transferReceiptUrl?: string;
  transferReceiptFilename?: string;
  price: number;
  notes?: string;
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const subscriptionSchema = new Schema<ISubscription>({
  userId: { type: Schema.Types.Mixed, required: true, index: true },
  type: { type: String, enum: ['free', 'Pro', 'Pro Life', 'Pro Life Plus'], required: true },
  status: { type: String, enum: ['pending', 'active', 'expired', 'cancelled'], default: 'pending' },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  autoRenew: { type: Boolean, default: false },
  paymentMethod: { type: String, enum: ['bank', 'stc', 'manual', 'paypal', 'card', 'wallet'] },
  transactionId: { type: String },
  transferReceiptUrl: { type: String },
  transferReceiptFilename: { type: String },
  price: { type: Number, required: true },
  notes: { type: String },
  approvedBy: { type: Schema.Types.ObjectId, ref: 'Admin' },
  approvedAt: { type: Date },
  rejectionReason: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export interface ITestResult extends Document {
  userId: string;
  testType: 'verbal' | 'quantitative' | 'qiyas' | 'custom' | 'paper_model' | 'standard';
  testId?: string;
  testName?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'mixed';
  subcategory?: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  skippedQuestions: number;
  percentage: number;
  timeTaken: number;
  timeLimit?: number;
  pointsEarned: number;
  isOfficial: boolean;
  questionDetails?: any[];
  weakAreas?: string[];
  strongAreas?: string[];
  completedAt: Date;
}

const testResultSchema = new Schema<ITestResult>({
  userId: { type: String, required: true, index: true },
  testType: { type: String, enum: ['verbal', 'quantitative', 'qiyas', 'custom', 'paper_model', 'standard'], required: true },
  testId: { type: String },
  testName: { type: String },
  difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced', 'mixed'], required: true },
  subcategory: { type: String },
  score: { type: Number, required: true },
  totalQuestions: { type: Number, required: true },
  correctAnswers: { type: Number, required: true },
  wrongAnswers: { type: Number, required: true },
  skippedQuestions: { type: Number, default: 0 },
  percentage: { type: Number, required: true },
  timeTaken: { type: Number, required: true },
  timeLimit: { type: Number },
  pointsEarned: { type: Number, default: 0 },
  isOfficial: { type: Boolean, default: false },
  questionDetails: { type: [Schema.Types.Mixed], default: [] },
  weakAreas: { type: [String], default: [] },
  strongAreas: { type: [String], default: [] },
  completedAt: { type: Date, default: Date.now },
});

export interface IQuestion extends Document {
  questionId: number;
  category: 'verbal' | 'quantitative' | 'general';
  subcategory: string;
  text: string;
  options: string[];
  correctOptionIndex: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  topic?: string;
  dialect?: string;
  keywords?: string[];
  section?: number;
  explanation?: string;
  imageUrl?: string;
  imageOriginalUrl?: string;
  imageProcessing?: {
    status: 'processed' | 'original_only';
    backgroundRemoved: boolean;
    watermarkCleanupApplied: boolean;
    note?: string;
  };
  createdAt: Date;
  updatedAt?: Date;
  createdBy?: string;
}

const questionSchema = new Schema<IQuestion>({
  questionId: { type: Number, required: true, index: true },
  category: { type: String, enum: ['verbal', 'quantitative', 'general'], required: true },
  subcategory: { type: String, default: 'عام' },
  text: { type: String, required: true },
  options: { type: [String], required: true },
  correctOptionIndex: { type: Number, required: true },
  difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'], required: true },
  topic: { type: String, default: 'general' },
  dialect: { type: String, default: 'standard' },
  keywords: { type: [String], default: ['general'] },
  section: { type: Number, default: 1 },
  explanation: { type: String },
  imageUrl: { type: String },
  imageOriginalUrl: { type: String },
  imageProcessing: {
    status: { type: String, enum: ['processed', 'original_only'] },
    backgroundRemoved: { type: Boolean },
    watermarkCleanupApplied: { type: Boolean },
    note: { type: String },
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date },
  createdBy: { type: String },
});

export interface IChatMessage extends Document {
  fromUserId: string;
  fromUserName: string;
  fromUserRole: 'student' | 'admin';
  toUserId: string;
  content: string;
  isRead: boolean;
  createdAt: Date;
  attachmentUrl?: string;
}

const chatMessageSchema = new Schema<IChatMessage>({
  fromUserId: { type: String, required: true, index: true },
  fromUserName: { type: String, required: true },
  fromUserRole: { type: String, enum: ['student', 'admin'], required: true },
  toUserId: { type: String, required: true, index: true },
  content: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  attachmentUrl: { type: String },
});

export interface IActivityLog extends Document {
  userId: mongoose.Types.ObjectId;
  action: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

const activityLogSchema = new Schema<IActivityLog>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true },
  details: { type: Schema.Types.Mixed },
  ipAddress: { type: String },
  userAgent: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export interface ILeaderboardEntry extends Document {
  userId: mongoose.Types.ObjectId;
  totalPoints: number;
  currentRank: number;
  previousRank?: number;
  rankChange: 'up' | 'down' | 'stable';
  weeklyPoints: number;
  monthlyPoints: number;
  totalTests: number;
  averageScore: number;
  lastUpdated: Date;
}

const leaderboardEntrySchema = new Schema<ILeaderboardEntry>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  totalPoints: { type: Number, default: 0 },
  currentRank: { type: Number, required: true },
  previousRank: { type: Number },
  rankChange: { type: String, enum: ['up', 'down', 'stable'], default: 'stable' },
  weeklyPoints: { type: Number, default: 0 },
  monthlyPoints: { type: Number, default: 0 },
  totalTests: { type: Number, default: 0 },
  averageScore: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now },
});

export interface IPaperModelResult extends Document {
  userId: mongoose.Types.ObjectId;
  modelId: number;
  modelNumber: number;
  verbalCorrect: number;
  verbalTotal: number;
  quantitativeCorrect: number;
  quantitativeTotal: number;
  verbalPercentage: number;
  quantitativePercentage: number;
  totalPercentage: number;
  completedAt: Date;
}

const paperModelResultSchema = new Schema<IPaperModelResult>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  modelId: { type: Number, required: true },
  modelNumber: { type: Number, required: true },
  verbalCorrect: { type: Number, required: true },
  verbalTotal: { type: Number, default: 53 },
  quantitativeCorrect: { type: Number, required: true },
  quantitativeTotal: { type: Number, default: 47 },
  verbalPercentage: { type: Number, required: true },
  quantitativePercentage: { type: Number, required: true },
  totalPercentage: { type: Number, required: true },
  completedAt: { type: Date, default: Date.now },
});

export interface IBadge extends Document {
  name: string;
  nameAr: string;
  description: string;
  icon: string;
  type: string;
  criteria: any;
  color: string;
  pointsBonus: number;
}

const badgeSchema = new Schema<IBadge>({
  name: { type: String, required: true, unique: true },
  nameAr: { type: String, required: true },
  description: { type: String, required: true },
  icon: { type: String, required: true },
  type: { type: String, required: true },
  criteria: { type: Schema.Types.Mixed, required: true },
  color: { type: String, default: '#FFD700' },
  pointsBonus: { type: Number, default: 0 },
});

export interface IUserBadge extends Document {
  userId: mongoose.Types.ObjectId;
  badgeId: mongoose.Types.ObjectId;
  earnedAt: Date;
  reason?: string;
}

const userBadgeSchema = new Schema<IUserBadge>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  badgeId: { type: Schema.Types.ObjectId, ref: 'Badge', required: true },
  earnedAt: { type: Date, default: Date.now },
  reason: { type: String },
});

export interface IFolder extends Document {
  userId: string;
  name: string;
  description?: string;
  color: string;
  icon: string;
  isDefault: boolean;
  createdAt: Date;
}

const folderSchema = new Schema<IFolder>({
  userId: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: String },
  color: { type: String, default: '#4f46e5' },
  icon: { type: String, default: 'folder' },
  isDefault: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

export interface IFolderQuestion extends Document {
  folderId: string;
  questionId: number;
  notes?: string;
  addedAt: Date;
}

const folderQuestionSchema = new Schema<IFolderQuestion>({
  folderId: { type: String, required: true },
  questionId: { type: Number, required: true },
  notes: { type: String },
  addedAt: { type: Date, default: Date.now },
});

export interface IInstitutionRequest extends Document {
  institutionName: string;
  responsibleName: string;
  phone: string;
  email: string;
  whatsapp: string;
  city: string;
  country: string;
  institutionType: 'school' | 'institute' | 'university' | 'training_center';
  studentsCount?: string;
  notes?: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  rejectionReason?: string;
  createdAt: Date;
}

const institutionRequestSchema = new Schema<IInstitutionRequest>({
  institutionName: { type: String, required: true },
  responsibleName: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  whatsapp: { type: String, required: true },
  city: { type: String, required: true },
  country: { type: String, default: 'المملكة العربية السعودية' },
  institutionType: { type: String, enum: ['school', 'institute', 'university', 'training_center'], required: true },
  studentsCount: { type: String },
  notes: { type: String },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  reviewedBy: { type: Schema.Types.ObjectId, ref: 'Admin' },
  reviewedAt: { type: Date },
  rejectionReason: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export interface ISectionResult {
  sectionIndex: number;
  questions: {
    questionId: string;
    studentAnswer: string | null;
    correctAnswer: string;
    isCorrect: boolean;
    isExperimental: boolean;
    isBookmarked: boolean;
    category: string;
  }[];
  correctCount: number;
  wrongCount: number;
  skippedCount: number;
  timeTakenSeconds: number;
}

export interface IExamBooking extends Document {
  userId: string;
  scheduledAt: Date;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  examType: 'qudrat_scientific' | 'qudrat_literary' | 'tahsili';
  sectionResults: ISectionResult[];
  totalScore: number;
  verbalScore: number;
  quantScore: number;
  totalScoreOutOf100: number;
  verbalPercent: number;
  quantPercent: number;
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  skippedAnswers: number;
  completedAt?: Date;
  resultVisibleAt?: Date;
  resultSentByEmail: boolean;
  confirmationEmailSent: boolean;
  reminderEmailSent: boolean;
  telegramReminderSent: boolean;
  pushReminder1hSent?: boolean;
  pushReminder24hSent?: boolean;
  startEmailSent: boolean;
  cheatingFlag: boolean;
  cheatingViolations: number;
  questionIds: string[];
  aiReviewDone: boolean;
  hasObjection?: boolean;
  objectionReason?: string;
  objectionAt?: Date;
  createdAt: Date;
}

const sectionResultSchema = new Schema<ISectionResult>({
  sectionIndex: { type: Number, required: true },
  questions: [{
    questionId: { type: String },
    studentAnswer: { type: String, default: null },
    correctAnswer: { type: String },
    isCorrect: { type: Boolean, default: false },
    isExperimental: { type: Boolean, default: false },
    isBookmarked: { type: Boolean, default: false },
    category: { type: String },
  }],
  correctCount: { type: Number, default: 0 },
  wrongCount: { type: Number, default: 0 },
  skippedCount: { type: Number, default: 0 },
  timeTakenSeconds: { type: Number, default: 0 },
}, { _id: false });

const examBookingSchema = new Schema<IExamBooking>({
  userId: { type: String, required: true, index: true },
  scheduledAt: { type: Date, required: true },
  status: { type: String, enum: ['pending', 'active', 'completed', 'cancelled'], default: 'pending' },
  examType: { type: String, enum: ['qudrat_scientific', 'qudrat_literary', 'tahsili'], default: 'qudrat_scientific' },
  sectionResults: { type: [sectionResultSchema], default: [] },
  totalScore: { type: Number, default: 0 },
  verbalScore: { type: Number, default: 0 },
  quantScore: { type: Number, default: 0 },
  totalScoreOutOf100: { type: Number, default: 0 },
  verbalPercent: { type: Number, default: 0 },
  quantPercent: { type: Number, default: 0 },
  totalQuestions: { type: Number, default: 100 },
  correctAnswers: { type: Number, default: 0 },
  wrongAnswers: { type: Number, default: 0 },
  skippedAnswers: { type: Number, default: 0 },
  completedAt: { type: Date },
  resultVisibleAt: { type: Date },
  resultSentByEmail: { type: Boolean, default: false },
  confirmationEmailSent: { type: Boolean, default: false },
  reminderEmailSent: { type: Boolean, default: false },
  telegramReminderSent: { type: Boolean, default: false },
  pushReminder1hSent: { type: Boolean, default: false },
  pushReminder24hSent: { type: Boolean, default: false },
  startEmailSent: { type: Boolean, default: false },
  cheatingFlag: { type: Boolean, default: false },
  cheatingViolations: { type: Number, default: 0 },
  questionIds: { type: [String], default: [] },
  aiReviewDone: { type: Boolean, default: false },
  hasObjection: { type: Boolean, default: false },
  objectionReason: { type: String, default: '' },
  objectionAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

export interface IQuestionHistory extends Document {
  userId: string;
  seenQuestionIds: string[];
  updatedAt: Date;
}

const questionHistorySchema = new Schema<IQuestionHistory>({
  userId: { type: String, required: true, unique: true, index: true },
  seenQuestionIds: { type: [String], default: [] },
  updatedAt: { type: Date, default: Date.now },
});

// ── EMPLOYEE MODEL ──────────────────────────────────────────────────────────
export interface IEmployee extends Document {
  fullName: string;
  email: string;
  phone?: string;
  role: string;
  department: string;
  salary: number;
  joinDate: Date;
  status: 'active' | 'inactive';
  permissions: string[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
const employeeSchema = new Schema<IEmployee>({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  role: { type: String, required: true, default: 'موظف' },
  department: { type: String, required: true, default: 'عام' },
  salary: { type: Number, default: 0 },
  joinDate: { type: Date, default: Date.now },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  permissions: { type: [String], default: [] },
  notes: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// ── EXPENSE MODEL ────────────────────────────────────────────────────────────
export interface IExpense extends Document {
  title: string;
  amount: number;
  category: string;
  date: Date;
  description?: string;
  createdBy: string;
  createdAt: Date;
}
const expenseSchema = new Schema<IExpense>({
  title: { type: String, required: true },
  amount: { type: Number, required: true },
  category: { type: String, required: true, default: 'عام' },
  date: { type: Date, default: Date.now },
  description: { type: String },
  createdBy: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

// ── TEST TEMPLATE MODEL ──────────────────────────────────────────────────────
export interface ITestTemplate extends Document {
  name: string;
  type: 'verbal' | 'quantitative' | 'mixed';
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed';
  questionCount: number;
  timeLimit: number;
  subcategories: string[];
  isActive: boolean;
  isPro: boolean;
  description?: string;
  instructions?: string;
  order: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}
const testTemplateSchema = new Schema<ITestTemplate>({
  name: { type: String, required: true },
  type: { type: String, enum: ['verbal', 'quantitative', 'mixed'], required: true },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard', 'mixed'], default: 'mixed' },
  questionCount: { type: Number, required: true, default: 20 },
  timeLimit: { type: Number, required: true, default: 30 },
  subcategories: { type: [String], default: [] },
  isActive: { type: Boolean, default: true },
  isPro: { type: Boolean, default: false },
  description: { type: String },
  instructions: { type: String },
  order: { type: Number, default: 0 },
  createdBy: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// ── ANNOUNCEMENT MODEL ────────────────────────────────────────────────────────
export interface IAnnouncement extends Document {
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error' | 'promo';
  target: 'all' | 'pro' | 'free';
  isActive: boolean;
  expiresAt?: Date;
  link?: string;
  linkText?: string;
  createdBy: string;
  createdAt: Date;
}
const announcementSchema = new Schema<IAnnouncement>({
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['info', 'warning', 'success', 'error', 'promo'], default: 'info' },
  target: { type: String, enum: ['all', 'pro', 'free'], default: 'all' },
  isActive: { type: Boolean, default: true },
  expiresAt: { type: Date },
  link: { type: String },
  linkText: { type: String },
  createdBy: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

// ── PLATFORM SETTING MODEL ────────────────────────────────────────────────────
export interface IPlatformSetting extends Document {
  key: string;
  value: any;
  label: string;
  type: 'text' | 'number' | 'boolean' | 'json' | 'color';
  category: string;
  description?: string;
  updatedBy: string;
  updatedAt: Date;
}
const platformSettingSchema = new Schema<IPlatformSetting>({
  key: { type: String, required: true, unique: true },
  value: { type: Schema.Types.Mixed },
  label: { type: String, required: true },
  type: { type: String, enum: ['text', 'number', 'boolean', 'json', 'color'], default: 'text' },
  category: { type: String, default: 'general' },
  description: { type: String },
  updatedBy: { type: String, default: 'admin' },
  updatedAt: { type: Date, default: Date.now },
});

// ── SUPPORT TICKET MODEL ──────────────────────────────────────────────────────
export interface ISupportTicket extends Document {
  userId?: any;
  userName: string;
  userEmail: string;
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  adminNotes?: string;
  resolvedBy?: string;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
const supportTicketSchema = new Schema<ISupportTicket>({
  userId: { type: Schema.Types.Mixed },
  userName: { type: String, required: true },
  userEmail: { type: String, required: true },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  status: { type: String, enum: ['open', 'in_progress', 'resolved', 'closed'], default: 'open' },
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
  adminNotes: { type: String },
  resolvedBy: { type: String },
  resolvedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// ── IN-APP NOTIFICATION MODEL ─────────────────────────────────────────────────
export interface IInAppNotification extends Document {
  userId?: string;
  title: string;
  body: string;
  type: 'info' | 'success' | 'warning' | 'exam' | 'achievement' | 'event' | 'promo';
  icon?: string;
  link?: string;
  isRead: boolean;
  isGlobal: boolean;
  target: string;
  sentBy: string;
  readBy?: string[];
  createdAt: Date;
}
const inAppNotificationSchema = new Schema<IInAppNotification>({
  userId: { type: String },
  title: { type: String, required: true },
  body: { type: String, required: true },
  type: { type: String, enum: ['info','success','warning','exam','achievement','event','promo'], default: 'info' },
  icon: { type: String },
  link: { type: String },
  isRead: { type: Boolean, default: false },
  isGlobal: { type: Boolean, default: false },
  target: { type: String, default: 'global' },
  sentBy: { type: String, default: 'admin' },
  readBy: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
});

// ── PUSH SUBSCRIPTION MODEL ───────────────────────────────────────────────────
export interface IPushSubscription extends Document {
  userId: string;
  endpoint: string;
  keys: { p256dh: string; auth: string };
  createdAt: Date;
}
const pushSubscriptionSchema = new Schema<IPushSubscription>({
  userId: { type: String, required: true },
  endpoint: { type: String, required: true, unique: true },
  keys: {
    p256dh: { type: String, required: true },
    auth: { type: String, required: true },
  },
  createdAt: { type: Date, default: Date.now },
});

// ── GAME ROOM MODEL (Multiplayer Quizizz-style) ───────────────────────────────
export interface IGameParticipant {
  userId: string;
  username: string;
  avatar?: string;
  score: number;
  answers: Array<{ questionIndex: number; selectedAnswer: number; isCorrect: boolean; timeMs: number }>;
  joinedAt: Date;
  isReady: boolean;
  isOnline: boolean;
}

export interface IGameRoom extends Document {
  code: string;           // 6-char join code
  hostUserId: string;
  hostUsername: string;
  title: string;
  questions: Array<{ id: string; text: string; options: string[]; correctAnswer: number; type: string }>;
  questionCount: number;
  timePerQuestion: number; // seconds per question
  status: 'waiting' | 'starting' | 'playing' | 'finished';
  currentQuestion: number;
  participants: IGameParticipant[];
  isPublicEvent: boolean;  // platform-wide event created by admin
  maxParticipants: number;
  startedAt?: Date;
  endedAt?: Date;
  createdAt: Date;
  isScheduled: boolean;    // true = scheduled study room
  scheduledAt?: Date;      // when the session starts
  category?: string;       // question category (mixed/verbal/quantitative)
}
const gameRoomSchema = new Schema<IGameRoom>({
  code: { type: String, required: true, unique: true },
  hostUserId: { type: String, required: true },
  hostUsername: { type: String, required: true },
  title: { type: String, required: true },
  questions: [{
    id: String,
    text: String,
    options: [String],
    correctAnswer: Number,
    type: { type: String, default: 'multiple_choice' }
  }],
  questionCount: { type: Number, default: 10 },
  timePerQuestion: { type: Number, default: 30 },
  status: { type: String, enum: ['waiting','starting','playing','finished'], default: 'waiting' },
  currentQuestion: { type: Number, default: -1 },
  participants: [{
    userId: String,
    username: String,
    avatar: String,
    score: { type: Number, default: 0 },
    answers: [{ questionIndex: Number, selectedAnswer: Number, isCorrect: Boolean, timeMs: Number }],
    joinedAt: { type: Date, default: Date.now },
    isReady: { type: Boolean, default: false },
    isOnline: { type: Boolean, default: true },
  }],
  isPublicEvent: { type: Boolean, default: false },
  maxParticipants: { type: Number, default: 50 },
  startedAt: Date,
  endedAt: Date,
  createdAt: { type: Date, default: Date.now },
  isScheduled: { type: Boolean, default: false },
  scheduledAt: Date,
  category: { type: String, default: 'mixed' },
});

export const User = mongoose.model<IUser>('User', userSchema);
export const Institution = mongoose.model<IInstitution>('Institution', institutionSchema);
export const InstitutionRequest = mongoose.model<IInstitutionRequest>('InstitutionRequest', institutionRequestSchema);
export const Admin = mongoose.model<IAdmin>('Admin', adminSchema);
export const Subscription = mongoose.model<ISubscription>('Subscription', subscriptionSchema);
export const TestResult = mongoose.model<ITestResult>('TestResult', testResultSchema);
export const Question = mongoose.model<IQuestion>('Question', questionSchema);
export const ChatMessage = mongoose.model<IChatMessage>('ChatMessage', chatMessageSchema);
export const ActivityLog = mongoose.model<IActivityLog>('ActivityLog', activityLogSchema);
export const LeaderboardEntry = mongoose.model<ILeaderboardEntry>('LeaderboardEntry', leaderboardEntrySchema);
export const PaperModelResult = mongoose.model<IPaperModelResult>('PaperModelResult', paperModelResultSchema);
export const Badge = mongoose.model<IBadge>('Badge', badgeSchema);
export const UserBadge = mongoose.model<IUserBadge>('UserBadge', userBadgeSchema);
export const Folder = mongoose.model<IFolder>('Folder', folderSchema);
export const FolderQuestion = mongoose.model<IFolderQuestion>('FolderQuestion', folderQuestionSchema);
export const ExamBooking = mongoose.model<IExamBooking>('ExamBooking', examBookingSchema);
export const QuestionHistory = mongoose.model<IQuestionHistory>('QuestionHistory', questionHistorySchema);
export const Employee = mongoose.model<IEmployee>('Employee', employeeSchema);
export const Expense = mongoose.model<IExpense>('Expense', expenseSchema);
export const TestTemplate = mongoose.model<ITestTemplate>('TestTemplate', testTemplateSchema);
export const Announcement = mongoose.model<IAnnouncement>('Announcement', announcementSchema);
export const PlatformSetting = mongoose.model<IPlatformSetting>('PlatformSetting', platformSettingSchema);
export const SupportTicket = mongoose.model<ISupportTicket>('SupportTicket', supportTicketSchema);
export const InAppNotification = mongoose.model<IInAppNotification>('InAppNotification', inAppNotificationSchema);
export const PushSubscription = mongoose.model<IPushSubscription>('PushSubscription', pushSubscriptionSchema);
export const GameRoom = mongoose.model<IGameRoom>('GameRoom', gameRoomSchema);

// ─── QUESTION REPORT ───
export interface IQuestionReport extends Document {
  questionId: number;
  questionText: string;
  reportType: 'wrong_answer' | 'typo' | 'unclear' | 'missing_image' | 'other';
  description?: string;
  reportedBy?: string;
  reportedByUsername?: string;
  status: 'pending' | 'reviewed' | 'fixed' | 'dismissed';
  adminNote?: string;
  fixedQuestion?: string;
  createdAt: Date;
  reviewedAt?: Date;
}

const questionReportSchema = new Schema<IQuestionReport>({
  questionId: { type: Number, required: true, index: true },
  questionText: { type: String, required: true },
  reportType: { type: String, enum: ['wrong_answer', 'typo', 'unclear', 'missing_image', 'other'], required: true },
  description: { type: String },
  reportedBy: { type: String },
  reportedByUsername: { type: String },
  status: { type: String, enum: ['pending', 'reviewed', 'fixed', 'dismissed'], default: 'pending' },
  adminNote: { type: String },
  fixedQuestion: { type: String },
  createdAt: { type: Date, default: Date.now },
  reviewedAt: { type: Date },
});

export const QuestionReport = mongoose.model<IQuestionReport>('QuestionReport', questionReportSchema);

// ─── WALLET ───
export interface IWalletTransaction extends Document {
  userId: string;
  type: 'credit' | 'debit' | 'transfer_in' | 'transfer_out';
  amount: number;
  description: string;
  balanceAfter?: number;
  ref?: string;
  fromUserId?: string;
  toUserId?: string;
  adminId?: string;
  createdAt: Date;
}

const walletTransactionSchema = new Schema<IWalletTransaction>({
  userId: { type: String, required: true, index: true },
  type: { type: String, enum: ['credit', 'debit', 'transfer_in', 'transfer_out'], required: true },
  amount: { type: Number, required: true },
  description: { type: String, required: true },
  balanceAfter: { type: Number },
  ref: { type: String },
  fromUserId: { type: String },
  toUserId: { type: String },
  adminId: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export const WalletTransaction = mongoose.model<IWalletTransaction>('WalletTransaction', walletTransactionSchema);

export interface IWallet extends Document {
  userId: string;
  username: string;
  balance: number;
  totalEarned: number;
  updatedAt: Date;
}

const walletSchema = new Schema<IWallet>({
  userId: { type: String, required: true, unique: true, index: true },
  username: { type: String, default: '' },
  balance: { type: Number, default: 0 },
  totalEarned: { type: Number, default: 0 },
  updatedAt: { type: Date, default: Date.now },
});

export const Wallet = mongoose.model<IWallet>('Wallet', walletSchema);

// ─── SEASONAL EXAM ───
export interface ISeasonalExam extends Document {
  title: string;
  description?: string;
  occasion: string;
  examType: 'verbal' | 'quantitative' | 'mixed';
  questions: { text: string; options: string[]; correctAnswer: number; explanation?: string }[];
  questionCount: number;
  timeLimit: number;
  startDate: Date;
  endDate: Date;
  allowBooking: boolean;
  bookingDeadline?: Date;
  maxParticipants?: number;
  isActive: boolean;
  prize?: string;
  prizeAmount?: number;
  createdBy?: string;
  createdAt: Date;
}

const seasonalExamSchema = new Schema<ISeasonalExam>({
  title: { type: String, required: true },
  description: { type: String },
  occasion: { type: String, required: true },
  examType: { type: String, enum: ['verbal', 'quantitative', 'mixed'], default: 'mixed' },
  questions: [{
    text: { type: String, required: true },
    options: [{ type: String }],
    correctAnswer: { type: Number, required: true },
    explanation: { type: String },
  }],
  questionCount: { type: Number, default: 0 },
  timeLimit: { type: Number, default: 30 },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  allowBooking: { type: Boolean, default: true },
  bookingDeadline: { type: Date },
  maxParticipants: { type: Number },
  isActive: { type: Boolean, default: true },
  prize: { type: String },
  prizeAmount: { type: Number },
  createdBy: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export const SeasonalExam = mongoose.model<ISeasonalExam>('SeasonalExam', seasonalExamSchema);

export interface ISeasonalExamBooking extends Document {
  examId: mongoose.Types.ObjectId | string;
  userId: string;
  username: string;
  bookedAt: Date;
  attended: boolean;
  score?: number;
}

const seasonalExamBookingSchema = new Schema<ISeasonalExamBooking>({
  examId: { type: Schema.Types.ObjectId, ref: 'SeasonalExam', required: true, index: true },
  userId: { type: String, required: true },
  username: { type: String, default: '' },
  bookedAt: { type: Date, default: Date.now },
  attended: { type: Boolean, default: false },
  score: { type: Number },
});

seasonalExamBookingSchema.index({ examId: 1, userId: 1 }, { unique: true });
export const SeasonalExamBooking = mongoose.model<ISeasonalExamBooking>('SeasonalExamBooking', seasonalExamBookingSchema);

// ===== Daily Study Goal =====
export interface IDailyGoal extends Document {
  userId: string;
  targetQuestions: number;
  updatedAt: Date;
}
const dailyGoalSchema = new Schema<IDailyGoal>({
  userId: { type: String, required: true, unique: true, index: true },
  targetQuestions: { type: Number, default: 20, enum: [5, 10, 20, 30, 50] },
  updatedAt: { type: Date, default: Date.now },
});
export const DailyGoal = mongoose.model<IDailyGoal>('DailyGoal', dailyGoalSchema);

// ===== Daily Progress (one doc per user per day) =====
export interface IDailyProgress extends Document {
  userId: string;
  date: string;
  questionsAnswered: number;
  goalTarget: number;
  completedGoal: boolean;
  updatedAt: Date;
}
const dailyProgressSchema = new Schema<IDailyProgress>({
  userId: { type: String, required: true, index: true },
  date: { type: String, required: true },
  questionsAnswered: { type: Number, default: 0 },
  goalTarget: { type: Number, default: 20 },
  completedGoal: { type: Boolean, default: false },
  updatedAt: { type: Date, default: Date.now },
});
dailyProgressSchema.index({ userId: 1, date: 1 }, { unique: true });
export const DailyProgress = mongoose.model<IDailyProgress>('DailyProgress', dailyProgressSchema);

// ===== Adaptive Testing Profile =====
export interface ISubcategoryAbility {
  subcategory: string;
  category: string;
  ability: number;
  totalSeen: number;
  correct: number;
}

export interface IAdaptiveProfile extends Document {
  userId: string;
  abilities: ISubcategoryAbility[];
  updatedAt: Date;
}

const adaptiveProfileSchema = new Schema<IAdaptiveProfile>({
  userId: { type: String, required: true, unique: true, index: true },
  abilities: [{
    subcategory: { type: String, required: true },
    category: { type: String, required: true },
    ability: { type: Number, default: 0 },
    totalSeen: { type: Number, default: 0 },
    correct: { type: Number, default: 0 },
  }],
  updatedAt: { type: Date, default: Date.now },
});

export const AdaptiveProfile = mongoose.model<IAdaptiveProfile>('AdaptiveProfile', adaptiveProfileSchema);

// ===== Error Log (per-question wrong answer tracking) =====
export interface IErrorLog extends Document {
  userId: string;
  questionId: number;
  questionText: string;
  subcategory: string;
  category: string;
  difficulty: string;
  selectedOptionIndex: number;
  selectedOptionText: string;
  correctOptionIndex: number;
  correctOptionText: string;
  source: string;
  timestamp: Date;
}

const errorLogSchema = new Schema<IErrorLog>({
  userId: { type: String, required: true, index: true },
  questionId: { type: Number, required: true },
  questionText: { type: String, default: '' },
  subcategory: { type: String, required: true },
  category: { type: String, required: true },
  difficulty: { type: String, default: 'intermediate' },
  selectedOptionIndex: { type: Number, required: true },
  selectedOptionText: { type: String, default: '' },
  correctOptionIndex: { type: Number, required: true },
  correctOptionText: { type: String, default: '' },
  source: { type: String, default: 'adaptive' },
  timestamp: { type: Date, default: Date.now, index: true },
});

errorLogSchema.index({ userId: 1, timestamp: -1 });
errorLogSchema.index({ userId: 1, subcategory: 1 });

export const ErrorLog = mongoose.model<IErrorLog>('ErrorLog', errorLogSchema);

// ── Pending OTP Store (replaces in-memory Map) ───────────────────────────────
export interface IPendingOTP extends Document {
  email: string;
  otp: string;
  fullName: string;
  phone?: string;
  expiry: Date;
  createdAt: Date;
}

const pendingOTPSchema = new Schema<IPendingOTP>({
  email: { type: String, required: true, index: true },
  otp: { type: String, required: true },
  fullName: { type: String, required: true },
  phone: { type: String },
  expiry: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
});

pendingOTPSchema.index({ expiry: 1 }, { expireAfterSeconds: 0 });

export const PendingOTP = mongoose.models['PendingOTP']
  ? mongoose.model<IPendingOTP>('PendingOTP')
  : mongoose.model<IPendingOTP>('PendingOTP', pendingOTPSchema);

// ─── QODRATAK CARD (قدراتك باي) ───
export interface IQodratakCard extends Document {
  userId: string;
  cardholderName: string;
  cardNumber: string;
  isActivated: boolean;
  pin?: string;
  createdAt: Date;
  activatedAt?: Date;
}

const qodratakCardSchema = new Schema<IQodratakCard>({
  userId: { type: String, required: true, unique: true, index: true },
  cardholderName: { type: String, required: true },
  cardNumber: { type: String, required: true, unique: true, index: true },
  isActivated: { type: Boolean, default: false },
  pin: { type: String },
  createdAt: { type: Date, default: Date.now },
  activatedAt: { type: Date },
});

export const QodratakCard = mongoose.models['QodratakCard']
  ? mongoose.model<IQodratakCard>('QodratakCard')
  : mongoose.model<IQodratakCard>('QodratakCard', qodratakCardSchema);

// ─── CARD PAYMENT PENDING ───
export interface ICardPayment extends Document {
  payerUserId: string;
  cardNumber: string;
  cardOwnerUserId: string;
  cardOwnerEmail: string;
  amount: number;
  description: string;
  otp: string;
  expiry: Date;
  createdAt: Date;
}

const cardPaymentSchema = new Schema<ICardPayment>({
  payerUserId: { type: String, required: true },
  cardNumber: { type: String, required: true },
  cardOwnerUserId: { type: String, required: true },
  cardOwnerEmail: { type: String, required: true },
  amount: { type: Number, required: true },
  description: { type: String, default: 'دفع عبر قدراتك باي' },
  otp: { type: String, required: true },
  expiry: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
});

cardPaymentSchema.index({ expiry: 1 }, { expireAfterSeconds: 0 });

export const CardPayment = mongoose.models['CardPayment']
  ? mongoose.model<ICardPayment>('CardPayment')
  : mongoose.model<ICardPayment>('CardPayment', cardPaymentSchema);

export const WhatsAppMessage = mongoose.models['WhatsAppMessage']
  ? mongoose.model<IWhatsAppMessage>('WhatsAppMessage')
  : mongoose.model<IWhatsAppMessage>('WhatsAppMessage', whatsAppMessageSchema);
