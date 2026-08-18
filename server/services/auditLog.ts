// نظام سجل التدقيق - Audit Log System
// Sprint 0 - Foundation

import mongoose, { Schema, Document } from 'mongoose';
import { UserRole } from '../../shared/permissions';

// أنواع الإجراءات المسجلة
export enum AuditAction {
  // تسجيل الدخول والخروج
  LOGIN = 'login',
  LOGOUT = 'logout',
  LOGIN_FAILED = 'login_failed',
  
  // إدارة المستخدمين
  USER_CREATE = 'user_create',
  USER_UPDATE = 'user_update',
  USER_DELETE = 'user_delete',
  USER_SUSPEND = 'user_suspend',
  USER_ACTIVATE = 'user_activate',
  USER_ROLE_CHANGE = 'user_role_change',
  
  // إدارة الصلاحيات
  PERMISSION_GRANT = 'permission_grant',
  PERMISSION_REVOKE = 'permission_revoke',
  ROLE_CHANGE = 'role_change',
  
  // إدارة الاختبارات
  TEST_CREATE = 'test_create',
  TEST_UPDATE = 'test_update',
  TEST_DELETE = 'test_delete',
  TEST_SUBMIT = 'test_submit',
  
  // إدارة الأسئلة
  QUESTION_CREATE = 'question_create',
  QUESTION_UPDATE = 'question_update',
  QUESTION_DELETE = 'question_delete',
  QUESTION_IMPORT = 'question_import',
  
  // إدارة الاشتراكات
  SUBSCRIPTION_CREATE = 'subscription_create',
  SUBSCRIPTION_APPROVE = 'subscription_approve',
  SUBSCRIPTION_REJECT = 'subscription_reject',
  SUBSCRIPTION_CANCEL = 'subscription_cancel',
  SUBSCRIPTION_EXPIRE = 'subscription_expire',
  
  // إدارة المؤسسات
  INSTITUTION_CREATE = 'institution_create',
  INSTITUTION_UPDATE = 'institution_update',
  INSTITUTION_DELETE = 'institution_delete',
  
  // المجلدات
  FOLDER_CREATE = 'folder_create',
  FOLDER_UPDATE = 'folder_update',
  FOLDER_DELETE = 'folder_delete',
  
  // الوصول والأمان
  ACCESS_DENIED = 'access_denied',
  SECURITY_ALERT = 'security_alert',
  PASSWORD_CHANGE = 'password_change',
  PASSWORD_RESET = 'password_reset',
  
  // إعدادات النظام
  SETTINGS_UPDATE = 'settings_update',
  SYSTEM_CONFIG = 'system_config',
  
  // أخرى
  DATA_EXPORT = 'data_export',
  DATA_IMPORT = 'data_import',
  REPORT_GENERATE = 'report_generate',
}

// مستويات الخطورة
export enum AuditSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

// واجهة سجل التدقيق
export interface IAuditLog extends Document {
  action: AuditAction;
  severity: AuditSeverity;
  userId?: string;
  username?: string;
  role?: UserRole | string;
  targetId?: string;
  targetType?: string;
  details?: Record<string, any>;
  ip?: string;
  userAgent?: string;
  sessionId?: string;
  success: boolean;
  errorMessage?: string;
  createdAt: Date;
}

// مخطط سجل التدقيق
const auditLogSchema = new Schema<IAuditLog>({
  action: { type: String, required: true, enum: Object.values(AuditAction) },
  severity: { type: String, default: AuditSeverity.LOW, enum: Object.values(AuditSeverity) },
  userId: { type: String },
  username: { type: String },
  role: { type: String },
  targetId: { type: String },
  targetType: { type: String },
  details: { type: Schema.Types.Mixed },
  ip: { type: String },
  userAgent: { type: String },
  sessionId: { type: String },
  success: { type: Boolean, default: true },
  errorMessage: { type: String },
  createdAt: { type: Date, default: Date.now, index: true },
});

// إنشاء فهارس للبحث السريع
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ userId: 1 });
auditLogSchema.index({ severity: 1 });
auditLogSchema.index({ createdAt: -1 });

// تحديد مستوى الخطورة حسب نوع الإجراء
function getSeverity(action: AuditAction): AuditSeverity {
  const highSeverityActions = [
    AuditAction.USER_DELETE,
    AuditAction.USER_ROLE_CHANGE,
    AuditAction.PERMISSION_GRANT,
    AuditAction.PERMISSION_REVOKE,
    AuditAction.TEST_DELETE,
    AuditAction.QUESTION_DELETE,
    AuditAction.INSTITUTION_DELETE,
    AuditAction.SETTINGS_UPDATE,
    AuditAction.SYSTEM_CONFIG,
    AuditAction.DATA_EXPORT,
  ];
  
  const criticalSeverityActions = [
    AuditAction.ACCESS_DENIED,
    AuditAction.SECURITY_ALERT,
    AuditAction.LOGIN_FAILED,
  ];
  
  const mediumSeverityActions = [
    AuditAction.USER_CREATE,
    AuditAction.USER_UPDATE,
    AuditAction.USER_SUSPEND,
    AuditAction.SUBSCRIPTION_APPROVE,
    AuditAction.SUBSCRIPTION_REJECT,
    AuditAction.PASSWORD_CHANGE,
    AuditAction.PASSWORD_RESET,
  ];
  
  if (criticalSeverityActions.includes(action)) return AuditSeverity.CRITICAL;
  if (highSeverityActions.includes(action)) return AuditSeverity.HIGH;
  if (mediumSeverityActions.includes(action)) return AuditSeverity.MEDIUM;
  return AuditSeverity.LOW;
}

// نموذج سجل التدقيق
let AuditLogModel: mongoose.Model<IAuditLog>;

try {
  AuditLogModel = mongoose.model<IAuditLog>('AuditLog');
} catch {
  AuditLogModel = mongoose.model<IAuditLog>('AuditLog', auditLogSchema);
}

export { AuditLogModel };

// واجهة بيانات السجل
interface AuditLogData {
  action: AuditAction;
  userId?: string;
  username?: string;
  role?: UserRole | string;
  targetId?: string;
  targetType?: string;
  details?: Record<string, any>;
  ip?: string;
  userAgent?: string;
  sessionId?: string;
  success?: boolean;
  errorMessage?: string;
}

// واجهة السجل المخصب (مع severity و createdAt)
interface EnrichedAuditLog extends AuditLogData {
  severity: AuditSeverity;
  createdAt: Date;
}

// تخزين مؤقت للسجلات المخصبة (في حالة عدم اتصال MongoDB)
const auditLogBuffer: EnrichedAuditLog[] = [];
const MAX_BUFFER_SIZE = 1000;

// دالة تسجيل الأحداث
export async function auditLog(data: AuditLogData): Promise<void> {
  try {
    // إنشاء سجل مخصب مع severity و timestamp
    const logEntry: EnrichedAuditLog = {
      ...data,
      severity: getSeverity(data.action),
      success: data.success !== false,
      createdAt: new Date(),
    };
    
    // التحقق من اتصال MongoDB
    if (mongoose.connection.readyState === 1) {
      await AuditLogModel.create(logEntry);
      
      // تفريغ الـ buffer إذا كان هناك سجلات مخزنة (السجلات مخصبة بالفعل)
      if (auditLogBuffer.length > 0) {
        const bufferedLogs = auditLogBuffer.splice(0, auditLogBuffer.length);
        await AuditLogModel.insertMany(bufferedLogs);
      }
    } else {
      // تخزين مؤقت للسجلات المخصبة
      if (auditLogBuffer.length < MAX_BUFFER_SIZE) {
        auditLogBuffer.push(logEntry);
      }
      console.log('[Audit]', data.action, data.username || 'system', data.details);
    }
  } catch (error) {
    console.error('Audit log error:', error);
    // تخزين مؤقت مخصب في حالة الخطأ
    if (auditLogBuffer.length < MAX_BUFFER_SIZE) {
      const enrichedEntry: EnrichedAuditLog = {
        ...data,
        severity: getSeverity(data.action),
        success: data.success !== false,
        createdAt: new Date(),
      };
      auditLogBuffer.push(enrichedEntry);
    }
  }
}

// دالة للحصول على السجلات
export async function getAuditLogs(options: {
  page?: number;
  limit?: number;
  action?: AuditAction;
  userId?: string;
  severity?: AuditSeverity;
  startDate?: Date;
  endDate?: Date;
}): Promise<{ logs: IAuditLog[]; total: number }> {
  const { page = 1, limit = 50, action, userId, severity, startDate, endDate } = options;
  
  const query: Record<string, any> = {};
  
  if (action) query.action = action;
  if (userId) query.userId = userId;
  if (severity) query.severity = severity;
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = startDate;
    if (endDate) query.createdAt.$lte = endDate;
  }
  
  const total = await AuditLogModel.countDocuments(query);
  const logs = await AuditLogModel
    .find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);
  
  return { logs, total };
}

// دالة للحصول على إحصائيات السجلات
export async function getAuditStats(days: number = 7): Promise<{
  totalLogs: number;
  byAction: Record<string, number>;
  bySeverity: Record<string, number>;
  recentActivity: IAuditLog[];
}> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const [totalLogs, byAction, bySeverity, recentActivity] = await Promise.all([
    AuditLogModel.countDocuments({ createdAt: { $gte: startDate } }),
    AuditLogModel.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: '$action', count: { $sum: 1 } } },
    ]),
    AuditLogModel.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: '$severity', count: { $sum: 1 } } },
    ]),
    AuditLogModel.find({ createdAt: { $gte: startDate } })
      .sort({ createdAt: -1 })
      .limit(10),
  ]);
  
  return {
    totalLogs,
    byAction: byAction.reduce((acc, item) => ({ ...acc, [item._id]: item.count }), {}),
    bySeverity: bySeverity.reduce((acc, item) => ({ ...acc, [item._id]: item.count }), {}),
    recentActivity,
  };
}

// تسجيل دخول ناجح
export async function logLogin(userId: string, username: string, role: string, ip?: string, userAgent?: string): Promise<void> {
  await auditLog({
    action: AuditAction.LOGIN,
    userId,
    username,
    role,
    ip,
    userAgent,
    details: { timestamp: new Date().toISOString() },
  });
}

// تسجيل دخول فاشل
export async function logLoginFailed(username: string, ip?: string, userAgent?: string, reason?: string): Promise<void> {
  await auditLog({
    action: AuditAction.LOGIN_FAILED,
    username,
    ip,
    userAgent,
    success: false,
    errorMessage: reason,
    details: { attemptedUsername: username },
  });
}

// تسجيل تغيير الدور
export async function logRoleChange(
  adminId: string,
  adminUsername: string,
  targetUserId: string,
  targetUsername: string,
  oldRole: string,
  newRole: string,
  ip?: string
): Promise<void> {
  await auditLog({
    action: AuditAction.USER_ROLE_CHANGE,
    userId: adminId,
    username: adminUsername,
    targetId: targetUserId,
    targetType: 'user',
    ip,
    details: {
      targetUsername,
      oldRole,
      newRole,
      changedBy: adminUsername,
    },
  });
}

// تسجيل إنشاء/حذف اختبار
export async function logTestAction(
  action: 'create' | 'update' | 'delete',
  userId: string,
  username: string,
  testId: string,
  testName: string,
  ip?: string
): Promise<void> {
  const actionMap = {
    create: AuditAction.TEST_CREATE,
    update: AuditAction.TEST_UPDATE,
    delete: AuditAction.TEST_DELETE,
  };
  
  await auditLog({
    action: actionMap[action],
    userId,
    username,
    targetId: testId,
    targetType: 'test',
    ip,
    details: { testName },
  });
}

// تسجيل إجراء على الاشتراك
export async function logSubscriptionAction(
  action: 'create' | 'approve' | 'reject' | 'cancel',
  adminId: string,
  adminUsername: string,
  subscriptionId: string,
  userId: string,
  details?: Record<string, any>,
  ip?: string
): Promise<void> {
  const actionMap = {
    create: AuditAction.SUBSCRIPTION_CREATE,
    approve: AuditAction.SUBSCRIPTION_APPROVE,
    reject: AuditAction.SUBSCRIPTION_REJECT,
    cancel: AuditAction.SUBSCRIPTION_CANCEL,
  };
  
  await auditLog({
    action: actionMap[action],
    userId: adminId,
    username: adminUsername,
    targetId: subscriptionId,
    targetType: 'subscription',
    ip,
    details: { targetUserId: userId, ...details },
  });
}
