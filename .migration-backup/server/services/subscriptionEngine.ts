// محرك الاشتراكات - Subscription Engine
// Sprint 0 - Foundation

import { UserRole } from '../../shared/permissions';
import { auditLog, AuditAction } from './auditLog';

// أنواع الاشتراكات
export type SubscriptionType = 'Pro' | 'Pro Life' | 'Pro Life Plus' | 'Pro Quarterly';
export type SubscriptionStatus = 'active' | 'expired' | 'cancelled' | 'pending' | 'trial';
export type PaymentMethod = 'bank' | 'stc' | 'manual' | 'free';

// إعدادات الفترة التجريبية
export const TRIAL_CONFIG = {
  TRIAL_DURATION_DAYS: 7,
  MAX_TRIALS_PER_DEVICE: 1,
  TRIAL_COOLDOWN_DAYS: 365,
  GRACE_PERIOD_DAYS: 3,
};

// أسعار الاشتراكات
export const SUBSCRIPTION_PRICES: Record<SubscriptionType, { price: number; durationDays: number; originalPrice: number }> = {
  'Pro': { price: 29, durationDays: 30, originalPrice: 49 },
  'Pro Life': { price: 74, durationDays: 90, originalPrice: 149 },
  'Pro Life Plus': { price: 134, durationDays: 180, originalPrice: 297 },
  'Pro Quarterly': { price: 74, durationDays: 90, originalPrice: 149 },
};

// واجهة بيانات الاشتراك
export interface SubscriptionData {
  id?: number;
  userId: number;
  type: SubscriptionType;
  status: SubscriptionStatus;
  startDate: Date;
  endDate: Date;
  autoRenew?: boolean;
  paymentMethod?: PaymentMethod;
  transactionId?: string;
  price?: number;
}

// واجهة بيانات الفترة التجريبية
export interface TrialData {
  userId: number;
  deviceId: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
}

// واجهة حالة الاشتراك الكاملة
export interface SubscriptionState {
  hasActiveSubscription: boolean;
  hasActiveTrial: boolean;
  subscriptionType?: SubscriptionType;
  subscriptionStatus?: SubscriptionStatus;
  expiresAt?: Date;
  daysRemaining?: number;
  canStartTrial: boolean;
  trialExpiresAt?: Date;
  trialDaysRemaining?: number;
  accessLevel: 'free' | 'trial' | 'premium';
  features: string[];
}

// نتيجة العملية
export interface OperationResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

// ================================================
// دوال الفترة التجريبية
// ================================================

/**
 * التحقق من إمكانية بدء فترة تجريبية
 */
export function canStartTrial(
  trialUsed: boolean,
  lastTrialReset?: Date | null,
  existingDeviceTrial?: { isActive: boolean; trialEndDate: Date } | null
): boolean {
  // إذا كان هناك تجربة نشطة على الجهاز
  if (existingDeviceTrial?.isActive) {
    const now = new Date();
    if (new Date(existingDeviceTrial.trialEndDate) > now) {
      return false;
    }
  }
  
  // إذا لم يتم استخدام التجربة من قبل
  if (!trialUsed) {
    return true;
  }
  
  // إذا تم استخدام التجربة، نتحقق من انتهاء فترة الانتظار
  if (lastTrialReset) {
    const cooldownEnd = new Date(lastTrialReset);
    cooldownEnd.setDate(cooldownEnd.getDate() + TRIAL_CONFIG.TRIAL_COOLDOWN_DAYS);
    // إذا مرت فترة الانتظار، يمكن بدء تجربة جديدة
    if (new Date() >= cooldownEnd) {
      return true;
    }
  }
  
  // التجربة مستخدمة وفترة الانتظار لم تنته بعد (أو لا يوجد تاريخ إعادة تعيين)
  return false;
}

/**
 * حساب تاريخ انتهاء الفترة التجريبية
 */
export function calculateTrialEndDate(startDate: Date = new Date()): Date {
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + TRIAL_CONFIG.TRIAL_DURATION_DAYS);
  return endDate;
}

/**
 * التحقق من صلاحية الفترة التجريبية
 */
export function isTrialActive(trialEndDate?: Date | null): boolean {
  if (!trialEndDate) return false;
  return new Date(trialEndDate) > new Date();
}

/**
 * حساب الأيام المتبقية في الفترة التجريبية
 */
export function getTrialDaysRemaining(trialEndDate?: Date | null): number {
  if (!trialEndDate) return 0;
  const now = new Date();
  const end = new Date(trialEndDate);
  const diff = end.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

// ================================================
// دوال الاشتراكات
// ================================================

/**
 * حساب تاريخ انتهاء الاشتراك
 */
export function calculateSubscriptionEndDate(type: SubscriptionType, startDate: Date = new Date()): Date {
  const config = SUBSCRIPTION_PRICES[type];
  if (!config) {
    throw new Error(`نوع اشتراك غير صالح: ${type}`);
  }
  
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + config.durationDays);
  return endDate;
}

/**
 * التحقق من صلاحية الاشتراك
 */
export function isSubscriptionActive(subscription?: { status: string; endDate: Date } | null): boolean {
  if (!subscription) return false;
  if (subscription.status !== 'active') return false;
  return new Date(subscription.endDate) > new Date();
}

/**
 * حساب الأيام المتبقية في الاشتراك
 */
export function getSubscriptionDaysRemaining(endDate?: Date | null): number {
  if (!endDate) return 0;
  const now = new Date();
  const end = new Date(endDate);
  const diff = end.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

/**
 * التحقق من وجود فترة سماح
 */
export function isInGracePeriod(endDate?: Date | null): boolean {
  if (!endDate) return false;
  const now = new Date();
  const end = new Date(endDate);
  const graceEnd = new Date(end);
  graceEnd.setDate(graceEnd.getDate() + TRIAL_CONFIG.GRACE_PERIOD_DAYS);
  
  return now > end && now < graceEnd;
}

/**
 * الحصول على سعر الاشتراك
 */
export function getSubscriptionPrice(type: SubscriptionType): number {
  return SUBSCRIPTION_PRICES[type]?.price || 0;
}

/**
 * الحصول على مدة الاشتراك بالأيام
 */
export function getSubscriptionDuration(type: SubscriptionType): number {
  return SUBSCRIPTION_PRICES[type]?.durationDays || 30;
}

// ================================================
// دوال الحالة الكاملة
// ================================================

/**
 * الحصول على حالة الاشتراك الكاملة للمستخدم
 */
export function getSubscriptionState(
  subscription?: { type: string; status: string; endDate: Date } | null,
  trialEndDate?: Date | null,
  trialUsed?: boolean,
  deviceTrialActive?: boolean,
  lastTrialReset?: Date | null
): SubscriptionState {
  // التحقق من الاشتراك النشط
  const hasActiveSubscription = isSubscriptionActive(subscription);
  
  // التحقق من الفترة التجريبية النشطة
  const hasActiveTrial = isTrialActive(trialEndDate);
  
  // تحديد مستوى الوصول
  let accessLevel: 'free' | 'trial' | 'premium' = 'free';
  let features: string[] = ['عرض الأسئلة المجانية', 'اختبارات محدودة'];
  
  if (hasActiveSubscription) {
    accessLevel = 'premium';
    features = [
      'وصول كامل لجميع الأسئلة',
      'اختبارات غير محدودة',
      'تحليل الأداء المتقدم',
      'حفظ التقدم',
      'النماذج الورقية',
      'دعم فني',
    ];
  } else if (hasActiveTrial) {
    accessLevel = 'trial';
    features = [
      'وصول كامل لجميع الأسئلة (مؤقت)',
      'اختبارات غير محدودة',
      'تحليل الأداء',
    ];
  }
  
  // بناء معلومات التجربة للجهاز
  const deviceTrialInfo = deviceTrialActive && trialEndDate 
    ? { isActive: true, trialEndDate: trialEndDate } 
    : null;
  
  return {
    hasActiveSubscription,
    hasActiveTrial,
    subscriptionType: hasActiveSubscription ? subscription?.type as SubscriptionType : undefined,
    subscriptionStatus: subscription?.status as SubscriptionStatus,
    expiresAt: hasActiveSubscription ? subscription?.endDate : undefined,
    daysRemaining: hasActiveSubscription ? getSubscriptionDaysRemaining(subscription?.endDate) : undefined,
    canStartTrial: canStartTrial(!!trialUsed, lastTrialReset, deviceTrialInfo),
    trialExpiresAt: hasActiveTrial ? trialEndDate! : undefined,
    trialDaysRemaining: hasActiveTrial ? getTrialDaysRemaining(trialEndDate) : undefined,
    accessLevel,
    features,
  };
}

/**
 * التحقق من صلاحية الوصول للمحتوى المميز
 */
export function hasPremiumAccess(state: SubscriptionState): boolean {
  return state.accessLevel === 'premium' || state.accessLevel === 'trial';
}

/**
 * التحقق من صلاحية الوصول للميزة
 */
export function canAccessFeature(
  state: SubscriptionState,
  feature: 'tests' | 'questions' | 'analytics' | 'papers' | 'export' | 'support'
): boolean {
  // الميزات المتاحة للجميع
  const freeFeatures: string[] = ['tests', 'questions'];
  
  // الميزات المتاحة للتجربة والمشتركين
  const trialFeatures: string[] = ['tests', 'questions', 'analytics'];
  
  // الميزات المتاحة للمشتركين فقط
  const premiumFeatures: string[] = ['tests', 'questions', 'analytics', 'papers', 'export', 'support'];
  
  switch (state.accessLevel) {
    case 'premium':
      return premiumFeatures.includes(feature);
    case 'trial':
      return trialFeatures.includes(feature);
    default:
      return freeFeatures.includes(feature);
  }
}

// ================================================
// دوال التحقق من الصلاحيات
// ================================================

/**
 * التحقق من أن المستخدم يمكنه عرض الاشتراكات
 */
export function canViewSubscriptions(role: UserRole): boolean {
  return ['system_admin', 'support_admin', 'institution_admin'].includes(role);
}

/**
 * التحقق من أن المستخدم يمكنه إدارة الاشتراكات
 */
export function canManageSubscriptions(role: UserRole): boolean {
  return ['system_admin', 'support_admin'].includes(role);
}

/**
 * التحقق من أن المستخدم يمكنه الموافقة/رفض الاشتراكات
 */
export function canApproveSubscriptions(role: UserRole): boolean {
  return ['system_admin', 'support_admin'].includes(role);
}

// ================================================
// دوال الإجراءات (للاستخدام مع Storage)
// ================================================

/**
 * إنشاء بيانات اشتراك جديد
 */
export function createSubscriptionData(
  userId: number,
  type: SubscriptionType,
  paymentMethod: PaymentMethod = 'manual',
  transactionId?: string
): Omit<SubscriptionData, 'id'> {
  const now = new Date();
  const endDate = calculateSubscriptionEndDate(type, now);
  
  return {
    userId,
    type,
    status: 'pending',
    startDate: now,
    endDate,
    autoRenew: false,
    paymentMethod,
    transactionId,
    price: getSubscriptionPrice(type),
  };
}

/**
 * إنشاء بيانات تجديد الاشتراك
 */
export function createRenewalData(
  currentEndDate: Date,
  type: SubscriptionType
): { startDate: Date; endDate: Date } {
  const startDate = new Date(currentEndDate) > new Date() ? new Date(currentEndDate) : new Date();
  const endDate = calculateSubscriptionEndDate(type, startDate);
  
  return { startDate, endDate };
}

/**
 * إنشاء بيانات فترة تجريبية
 */
export function createTrialData(
  userId: number,
  deviceId: string
): TrialData {
  const now = new Date();
  const endDate = calculateTrialEndDate(now);
  
  return {
    userId,
    deviceId,
    startDate: now,
    endDate,
    isActive: true,
  };
}

// ================================================
// دوال التسجيل (Audit Logging)
// ================================================

/**
 * تسجيل إنشاء اشتراك
 */
export async function logSubscriptionCreate(
  adminId: string,
  adminUsername: string,
  subscriptionId: string,
  userId: string,
  type: SubscriptionType,
  ip?: string
): Promise<void> {
  await auditLog({
    action: AuditAction.SUBSCRIPTION_CREATE,
    userId: adminId,
    username: adminUsername,
    targetId: subscriptionId,
    targetType: 'subscription',
    ip,
    details: { targetUserId: userId, subscriptionType: type },
  });
}

/**
 * تسجيل الموافقة على اشتراك
 */
export async function logSubscriptionApprove(
  adminId: string,
  adminUsername: string,
  subscriptionId: string,
  userId: string,
  ip?: string
): Promise<void> {
  await auditLog({
    action: AuditAction.SUBSCRIPTION_APPROVE,
    userId: adminId,
    username: adminUsername,
    targetId: subscriptionId,
    targetType: 'subscription',
    ip,
    details: { targetUserId: userId, action: 'approve' },
  });
}

/**
 * تسجيل رفض اشتراك
 */
export async function logSubscriptionReject(
  adminId: string,
  adminUsername: string,
  subscriptionId: string,
  userId: string,
  reason?: string,
  ip?: string
): Promise<void> {
  await auditLog({
    action: AuditAction.SUBSCRIPTION_REJECT,
    userId: adminId,
    username: adminUsername,
    targetId: subscriptionId,
    targetType: 'subscription',
    ip,
    success: false,
    details: { targetUserId: userId, action: 'reject', reason },
  });
}

/**
 * تسجيل إلغاء اشتراك
 */
export async function logSubscriptionCancel(
  adminId: string,
  adminUsername: string,
  subscriptionId: string,
  userId: string,
  reason?: string,
  ip?: string
): Promise<void> {
  await auditLog({
    action: AuditAction.SUBSCRIPTION_CANCEL,
    userId: adminId,
    username: adminUsername,
    targetId: subscriptionId,
    targetType: 'subscription',
    ip,
    details: { targetUserId: userId, action: 'cancel', reason },
  });
}

/**
 * تسجيل انتهاء اشتراك تلقائياً
 */
export async function logSubscriptionExpire(
  subscriptionId: string,
  userId: string
): Promise<void> {
  await auditLog({
    action: AuditAction.SUBSCRIPTION_EXPIRE,
    targetId: subscriptionId,
    targetType: 'subscription',
    details: { targetUserId: userId, action: 'auto_expire' },
  });
}

// ================================================
// دوال التحقق من الصلاحيات للمحتوى
// ================================================

/**
 * الحصول على قائمة الميزات حسب نوع الاشتراك
 */
export function getFeaturesBySubscriptionType(type?: SubscriptionType | null): string[] {
  if (!type) {
    return ['عرض محدود للأسئلة', 'اختبارات مجانية محدودة'];
  }
  
  const baseFeatures = [
    'وصول كامل لجميع الأسئلة',
    'اختبارات غير محدودة',
    'حفظ التقدم والإحصائيات',
  ];
  
  switch (type) {
    case 'Pro':
      return [...baseFeatures, 'تحليل الأداء', 'دعم فني محدود'];
    case 'Pro Life':
    case 'Pro Quarterly':
      return [...baseFeatures, 'تحليل الأداء المتقدم', 'جلسات مباشرة', 'دعم فني أولوية'];
    case 'Pro Life Plus':
      return [...baseFeatures, 'تحليل الأداء المتقدم', 'جلسات مباشرة', 'شهادات معتمدة', 'استشارات شخصية', 'دعم فني VIP'];
    default:
      return baseFeatures;
  }
}

/**
 * حساب نسبة الخصم
 */
export function getDiscountPercentage(type: SubscriptionType): number {
  const config = SUBSCRIPTION_PRICES[type];
  if (!config || !config.originalPrice) return 0;
  
  return Math.round(((config.originalPrice - config.price) / config.originalPrice) * 100);
}

/**
 * التحقق من أن الاشتراك يحتاج للتجديد قريباً
 */
export function needsRenewalSoon(endDate?: Date | null, daysThreshold: number = 7): boolean {
  if (!endDate) return false;
  const daysRemaining = getSubscriptionDaysRemaining(endDate);
  return daysRemaining > 0 && daysRemaining <= daysThreshold;
}

/**
 * الحصول على رسالة حالة الاشتراك
 */
export function getSubscriptionStatusMessage(state: SubscriptionState): string {
  if (state.hasActiveSubscription) {
    if (state.daysRemaining && state.daysRemaining <= 7) {
      return `اشتراكك ينتهي خلال ${state.daysRemaining} ${state.daysRemaining === 1 ? 'يوم' : 'أيام'}`;
    }
    return 'اشتراكك نشط';
  }
  
  if (state.hasActiveTrial) {
    return `الفترة التجريبية تنتهي خلال ${state.trialDaysRemaining} ${state.trialDaysRemaining === 1 ? 'يوم' : 'أيام'}`;
  }
  
  if (state.canStartTrial) {
    return 'يمكنك بدء فترة تجريبية مجانية';
  }
  
  return 'ليس لديك اشتراك نشط';
}
