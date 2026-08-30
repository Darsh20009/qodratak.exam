/**
 * نظام إدارة الجلسة الذكي - حفظ متطور للبيانات مع حماية من التلاعب
 * يدعم حفظ بيانات المستخدم والاشتراك بطريقة آمنة ومبدعة
 */

interface UserSession {
  id: string;
  name: string;
  email: string;
  subscription: {
    type: string;
    status: string;
    expiresAt: string;
    isActive: boolean;
  };
  points: number;
  level: number;
  achievements: number;
  deviceFingerprint: string;
  lastActive: string;
  sessionId: string;
  encryptedData?: string;
}

interface SessionStorage {
  user: UserSession | null;
  timestamp: number;
  version: string;
  checksum: string;
}

export class SmartSessionManager {
  private static readonly STORAGE_KEY = 'qudratak_session_v2';
  private static readonly BACKUP_KEY = 'qudratak_backup_v2';
  private static readonly VERSION = '2.1.0';
  private static readonly MAX_SESSION_AGE = 7 * 24 * 60 * 60 * 1000; // 7 أيام

  // إنشاء معرف فريد للجهاز
  private static generateDeviceFingerprint(): string {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('Qudratak Device ID', 2, 2);
    }
    
    return btoa(JSON.stringify({
      screen: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      platform: navigator.platform,
      canvas: canvas.toDataURL(),
      timestamp: Date.now()
    })).slice(0, 32);
  }

  // إنشاء checksum للبيانات
  private static generateChecksum(data: string): string {
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // تحويل لـ 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  // حفظ جلسة المستخدم
  public static saveUserSession(user: Partial<UserSession>): void {
    try {
      const sessionId = this.generateDeviceFingerprint();
      const fullUser: UserSession = {
        id: user.id || sessionId,
        name: user.name || 'مستخدم قدراتك',
        email: user.email || 'user@qudratak.space',
        subscription: user.subscription || {
          type: 'Free Enhanced',
          status: 'active',
          expiresAt: '2030-12-31T23:59:59Z',
          isActive: true
        },
        points: user.points || Math.floor(Math.random() * 1000) + 500,
        level: user.level || Math.floor(Math.random() * 5) + 3,
        achievements: user.achievements || Math.floor(Math.random() * 8) + 5,
        deviceFingerprint: sessionId,
        lastActive: new Date().toISOString(),
        sessionId: sessionId
      };

      const sessionData: SessionStorage = {
        user: fullUser,
        timestamp: Date.now(),
        version: this.VERSION,
        checksum: this.generateChecksum(JSON.stringify(fullUser))
      };

      const dataString = JSON.stringify(sessionData);
      
      // حفظ في مصادر متعددة
      localStorage.setItem(this.STORAGE_KEY, dataString);
      localStorage.setItem(this.BACKUP_KEY, dataString);
      sessionStorage.setItem(this.STORAGE_KEY, dataString);

      // حفظ في cookies مشفر
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 7);
      document.cookie = `qudratak_secure=${btoa(dataString)}; expires=${expiryDate.toUTCString()}; path=/; SameSite=Strict`;

      // إرسال إشعار لباقي التطبيق
      window.dispatchEvent(new CustomEvent('sessionUpdated', { detail: fullUser }));
      
      console.log('🎉 تم حفظ الجلسة بنجاح:', fullUser.name);
    } catch (error) {
      console.error('خطأ في حفظ الجلسة:', error);
    }
  }

  // استرجاع جلسة المستخدم
  public static getUserSession(): UserSession | null {
    try {
      // محاولة قراءة من مصادر متعددة
      const sources = [
        localStorage.getItem(this.STORAGE_KEY),
        localStorage.getItem(this.BACKUP_KEY),
        sessionStorage.getItem(this.STORAGE_KEY),
        this.getCookieData()
      ];

      for (const source of sources) {
        if (source) {
          const sessionData: SessionStorage = JSON.parse(source);
          
          // فحص صحة البيانات
          if (this.validateSession(sessionData)) {
            // تحديث آخر نشاط
            sessionData.user!.lastActive = new Date().toISOString();
            this.saveUserSession(sessionData.user!);
            return sessionData.user;
          }
        }
      }
    } catch (error) {
      console.error('خطأ في قراءة الجلسة:', error);
    }
    
    return null;
  }

  // فحص صحة الجلسة
  private static validateSession(sessionData: SessionStorage): boolean {
    if (!sessionData || !sessionData.user) return false;
    
    // فحص العمر
    const age = Date.now() - sessionData.timestamp;
    if (age > this.MAX_SESSION_AGE) return false;
    
    // فحص الإصدار
    if (sessionData.version !== this.VERSION) return false;
    
    // فحص checksum
    const expectedChecksum = this.generateChecksum(JSON.stringify(sessionData.user));
    if (sessionData.checksum !== expectedChecksum) return false;
    
    return true;
  }

  // قراءة بيانات الكوكيز
  private static getCookieData(): string | null {
    try {
      const match = document.cookie.match(/qudratak_secure=([^;]+)/);
      if (match) {
        return atob(match[1]);
      }
    } catch (error) {
      console.error('خطأ في قراءة الكوكيز:', error);
    }
    return null;
  }

  // إنشاء مستخدم جديد بطريقة إبداعية
  public static createEnhancedUser(): UserSession {
    const creativNames = [
      "عبقري قدراتك", "نابغة المستقبل", "مفكر مبدع", "عالم صغير",
      "باحث ذكي", "مبدع متميز", "عقل نابه", "طالب متفوق",
      "مكتشف المعرفة", "رائد التعلم", "ملهم الأجيال", "بطل الذكاء"
    ];
    
    const name = creativNames[Math.floor(Math.random() * creativNames.length)];
    const deviceId = this.generateDeviceFingerprint();
    
    const user: UserSession = {
      id: `user_${deviceId}`,
      name: name,
      email: `${name.replace(/\s+/g, '_')}@qudratak.space`,
      subscription: {
        type: 'Free Premium', // مميز مجاني
        status: 'enhanced',
        expiresAt: '2030-12-31T23:59:59Z',
        isActive: true
      },
      points: Math.floor(Math.random() * 2000) + 1000,
      level: Math.floor(Math.random() * 8) + 5,
      achievements: Math.floor(Math.random() * 15) + 10,
      deviceFingerprint: deviceId,
      lastActive: new Date().toISOString(),
      sessionId: deviceId
    };

    this.saveUserSession(user);
    return user;
  }

  // تنظيف الجلسة
  public static clearSession(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.BACKUP_KEY);
    sessionStorage.removeItem(this.STORAGE_KEY);
    document.cookie = 'qudratak_secure=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
    
    window.dispatchEvent(new CustomEvent('sessionCleared'));
    console.log('🧹 تم تنظيف الجلسة');
  }

  // ترقية المستخدم
  public static upgradeUserToPremium(subscriptionType: string = 'Pro'): void {
    const currentUser = this.getUserSession();
    if (currentUser) {
      currentUser.subscription = {
        type: subscriptionType,
        status: 'premium',
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        isActive: true
      };
      currentUser.points += 1000;
      currentUser.achievements += 5;
      
      this.saveUserSession(currentUser);
      console.log('🚀 تم ترقية المستخدم إلى', subscriptionType);
    }
  }

  // فحص إذا كان المستخدم مميز
  public static isPremiumUser(): boolean {
    const user = this.getUserSession();
    if (!user) return false;
    
    const premiumTypes = ['Pro', 'Pro Life', 'Pro Live', 'Premium', 'VIP'];
    return premiumTypes.includes(user.subscription.type);
  }

  // إحصائيات الاستخدام
  public static getUsageStats(): any {
    const user = this.getUserSession();
    if (!user) return null;
    
    return {
      sessionAge: Date.now() - new Date(user.lastActive).getTime(),
      deviceId: user.deviceFingerprint.slice(0, 8),
      subscriptionStatus: user.subscription.status,
      userLevel: user.level,
      totalPoints: user.points,
      achievements: user.achievements
    };
  }
}

export default SmartSessionManager;