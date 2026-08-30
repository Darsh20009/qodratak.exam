// Subscription System Types
export interface SubscriptionPlan {
  id: string;
  name: string;
  duration: string;
  price: string;
  originalPrice?: string;
  discount?: string;
  description: string;
  durationDays: number;
  features: string[];
  icon: string;
  badge?: string;
  badgeColor?: string;
  color: string;
  textColor: string;
}

export interface DeviceTrial {
  id: number;
  deviceId: string;
  trialStartDate: Date;
  trialEndDate: Date;
  userId?: number;
  isActive: boolean;
  createdAt: Date;
}

export interface UserSubscription {
  id: number;
  userId: number;
  type: 'Pro' | 'Pro Life' | 'Pro Life Plus';
  status: 'active' | 'expired' | 'cancelled' | 'pending';
  startDate: Date;
  endDate: Date;
  autoRenew: boolean;
  paymentMethod?: 'bank' | 'stc' | 'manual';
  transactionId?: string;
  price?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CountdownTimer {
  id: number;
  userId: number;
  subscriptionId?: number;
  endDate: Date;
  isActive: boolean;
  notificationSent: boolean;
  daysRemaining?: number;
  hoursRemaining?: number;
  minutesRemaining?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SubscriptionHistory {
  id: number;
  userId: number;
  subscriptionId: number;
  action: 'created' | 'renewed' | 'expired' | 'cancelled';
  previousStatus?: string;
  newStatus?: string;
  notes?: string;
  createdAt: Date;
}

// Device fingerprinting for trial tracking
export const generateDeviceFingerprint = (): string => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('Device fingerprint', 2, 2);
  }
  
  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset(),
    !!window.localStorage,
    !!window.sessionStorage,
    canvas.toDataURL()
  ].join('|');
  
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return Math.abs(hash).toString(36);
};

// Check if device has used trial
export const checkDeviceTrialStatus = async (deviceId: string): Promise<{
  hasUsedTrial: boolean;
  trialEndDate?: Date;
  daysRemaining?: number;
}> => {
  try {
    const response = await fetch('/api/device-trial/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceId })
    });
    
    if (!response.ok) {
      throw new Error('Failed to check device trial status');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error checking device trial:', error);
    return { hasUsedTrial: false };
  }
};

// Start trial for device
export const startDeviceTrial = async (deviceId: string, userId?: number): Promise<{
  success: boolean;
  trialEndDate?: Date;
  message?: string;
}> => {
  try {
    const response = await fetch('/api/device-trial/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceId, userId })
    });
    
    if (!response.ok) {
      throw new Error('Failed to start device trial');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error starting device trial:', error);
    return { success: false, message: 'خطأ في بدء الفترة التجريبية' };
  }
};

// Calculate countdown for subscription/trial
export const calculateCountdown = (endDate: Date) => {
  const now = new Date();
  const difference = endDate.getTime() - now.getTime();
  
  if (difference <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      expired: true
    };
  }
  
  const days = Math.floor(difference / (1000 * 60 * 60 * 24));
  const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((difference % (1000 * 60)) / 1000);
  
  return {
    days,
    hours,
    minutes,
    seconds,
    expired: false
  };
};

// Subscription plans configuration
export const SUBSCRIPTION_PLANS: Record<string, SubscriptionPlan> = {
  pro: {
    id: 'pro',
    name: 'Pro',
    duration: 'شهر واحد',
    price: '29 ريال',
    originalPrice: '49 ريال',
    discount: '41%',
    description: 'الاشتراك الشهري الاحترافي',
    durationDays: 30,
    features: [
      '🎯 وصول كامل لجميع الأسئلة',
      '📊 حفظ التقدم والإحصائيات',
      '🎨 اختبارات مخصصة',
      '📈 تحليل الأداء المتقدم',
      '💬 دعم فني محدود',
      '📱 تطبيق الهاتف المحمول',
      '🔥 خصم 41% على السعر الأصلي'
    ],
    icon: 'target',
    badge: 'الأكثر شعبية',
    badgeColor: 'bg-gradient-to-r from-amber-400 to-orange-500',
    color: 'bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20',
    textColor: 'text-blue-900 dark:text-blue-100'
  },
  proLife: {
    id: 'proLife',
    name: 'Pro Life',
    duration: '3 أشهر',
    price: '74 ريال',
    originalPrice: '149 ريال',
    discount: '50%',
    description: 'الاشتراك الثلاثي المتوسط',
    durationDays: 90,
    features: [
      '✨ جميع مميزات Pro',
      '🔥 جلسات مباشرة مع الخبراء',
      '📊 تقارير مفصلة ومتقدمة',
      '🏆 أولوية في الدعم الفني',
      '🎁 محتوى حصري ومتقدم',
      '🔥 خصم 50% على السعر الأصلي'
    ],
    icon: 'crown',
    badge: 'توفير 50%',
    badgeColor: 'bg-gradient-to-r from-green-400 to-emerald-500',
    color: 'bg-gradient-to-br from-purple-50 via-indigo-50 to-pink-50 dark:from-purple-900/20 dark:via-indigo-900/20 dark:to-pink-900/20',
    textColor: 'text-purple-900 dark:text-purple-100'
  },
  proQuarterly: {
    id: 'proQuarterly',
    name: 'Pro ربعي',
    duration: '3 أشهر',
    price: '74 ريال',
    originalPrice: '149 ريال',
    discount: '50%',
    description: 'الاشتراك الثلاثي المتوسط',
    durationDays: 90,
    features: [
      '✨ جميع مميزات Pro',
      '🔥 جلسات مباشرة مع الخبراء',
      '📊 تقارير مفصلة ومتقدمة',
      '🏆 أولوية في الدعم الفني',
      '🎁 محتوى حصري ومتقدم',
      '🔥 خصم 50% على السعر الأصلي'
    ],
    icon: 'trophy',
    badge: 'توفير 50%',
    badgeColor: 'bg-gradient-to-r from-blue-400 to-cyan-500',
    color: 'bg-gradient-to-br from-blue-50 via-sky-50 to-cyan-50 dark:from-blue-900/20 dark:via-sky-900/20 dark:to-cyan-900/20',
    textColor: 'text-blue-900 dark:text-blue-100'
  },
  proLifePlus: {
    id: 'proLifePlus',
    name: 'Pro Life Plus',
    duration: '6 أشهر',
    price: '134 ريال',
    originalPrice: '297 ريال',
    discount: '55%',
    description: 'الاشتراك السداسي المميز',
    durationDays: 180,
    features: [
      '💎 جميع مميزات Pro Life',
      '🚀 وصول مبكر للمميزات الجديدة',
      '🏅 شهادات إنجاز معتمدة',
      '🎓 دورات تدريبية حصرية',
      '💼 استشارات أكاديمية شخصية',
      '🔥 خصم 55% - أفضل قيمة مقابل المال'
    ],
    icon: 'diamond',
    badge: 'الأفضل قيمة',
    badgeColor: 'bg-gradient-to-r from-violet-500 to-purple-600',
    color: 'bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-900/20 dark:via-teal-900/20 dark:to-cyan-900/20',
    textColor: 'text-emerald-900 dark:text-emerald-100'
  }
};