// نظام إدارة التجربة المجانية المحدودة
export class FreeTrialManager {
  private static readonly TRIAL_DURATION_DAYS = 7;
  private static readonly STORAGE_KEY = 'ft_data';
  private static readonly BACKUP_KEY = 'ft_backup';
  private static readonly SESSION_KEY = 'ft_session';

  // إنشاء بصمة فريدة للجهاز
  private static generateDeviceFingerprint(): string {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      let canvasFingerprint = '';
      
      if (ctx) {
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillText('Device fingerprint test', 2, 2);
        canvasFingerprint = canvas.toDataURL();
      }
      
      const fingerprint = [
        navigator.userAgent || 'unknown',
        navigator.language || 'unknown',
        `${screen.width}x${screen.height}`,
        screen.colorDepth.toString(),
        new Date().getTimezoneOffset().toString(),
        canvasFingerprint,
        (navigator.hardwareConcurrency || 4).toString(),
        (navigator.maxTouchPoints || 0).toString(),
        navigator.platform || 'unknown',
        (window.devicePixelRatio || 1).toString()
      ].join('|');
      
      // تحويل إلى hash قوي
      let hash = 0;
      for (let i = 0; i < fingerprint.length; i++) {
        const char = fingerprint.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // تحويل إلى 32bit integer
      }
      
      return Math.abs(hash).toString(36);
    } catch (error) {
      console.error('Error generating device fingerprint:', error);
      return 'fallback_' + Date.now().toString(36);
    }
  }

  // الحصول على IP من خدمة خارجية (تقريبي)
  private static async getApproximateIP(): Promise<string> {
    try {
      // استخدام خدمة مجانية للحصول على IP تقريبي
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip || 'unknown';
    } catch {
      return 'unknown';
    }
  }

  // إنشاء معرف فريد للمستخدم
  private static async createUniqueId(): Promise<string> {
    const deviceFingerprint = this.generateDeviceFingerprint();
    const ip = await this.getApproximateIP();
    return `${deviceFingerprint}_${ip}`;
  }

  // حفظ بيانات التجربة المجانية
  private static saveTrialData(data: any): void {
    const dataString = JSON.stringify(data);
    
    // حفظ في عدة أماكن للحماية من التلاعب
    localStorage.setItem(this.STORAGE_KEY, dataString);
    localStorage.setItem(this.BACKUP_KEY, dataString);
    sessionStorage.setItem(this.SESSION_KEY, dataString);
    
    // حفظ في cookies أيضاً
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + this.TRIAL_DURATION_DAYS + 1);
    document.cookie = `${this.STORAGE_KEY}=${dataString}; expires=${expiryDate.toUTCString()}; path=/`;
  }

  // قراءة بيانات التجربة المجانية
  private static getTrialData(): any | null {
    try {
      // محاولة قراءة من مصادر متعددة
      const sources = [
        localStorage.getItem(this.STORAGE_KEY),
        localStorage.getItem(this.BACKUP_KEY),
        sessionStorage.getItem(this.SESSION_KEY),
        document.cookie.split(';').find(row => row.trim().startsWith(`${this.STORAGE_KEY}=`))?.split('=')[1]
      ];

      for (const source of sources) {
        if (source) {
          const data = JSON.parse(source);
          if (data && data.userId && data.startDate) {
            return data;
          }
        }
      }
    } catch (error) {
      console.error('Error reading trial data:', error);
    }
    
    return null;
  }

  // بدء التجربة المجانية
  public static async startFreeTrial(): Promise<boolean> {
    try {
      // فحص إذا كانت التجربة موجودة مسبقاً
      const existingData = this.getTrialData();
      if (existingData) {
        console.log('Trial already exists for this device');
        return false;
      }

      const userId = await this.createUniqueId();
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + this.TRIAL_DURATION_DAYS);

      const trialData = {
        userId,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        createdAt: Date.now(),
        visits: 1,
        fingerprint: this.generateDeviceFingerprint()
      };

      this.saveTrialData(trialData);
      
      // تفعيل التجربة في الجلسة الحالية
      sessionStorage.setItem('freeTrialActive', 'true');
      sessionStorage.setItem('trialStartTime', Date.now().toString());
      
      // إرسال إشعار التفعيل
      window.dispatchEvent(new CustomEvent('freeTrialActivated', { detail: trialData }));
      
      console.log('Free trial started successfully', trialData);
      return true;
    } catch (error) {
      console.error('Error starting free trial:', error);
      return false;
    }
  }

  // فحص حالة التجربة المجانية
  public static async checkTrialStatus(): Promise<{
    isValid: boolean;
    daysRemaining: number;
    hoursRemaining: number;
    isNewUser: boolean;
    message: string;
  }> {
    try {
      console.log('Checking trial status...');
      const existingData = this.getTrialData();
      const currentUserId = await this.createUniqueId();
      const currentFingerprint = this.generateDeviceFingerprint();

      if (!existingData) {
        console.log('No existing trial data found - new user');
        return {
          isValid: false,
          daysRemaining: this.TRIAL_DURATION_DAYS,
          hoursRemaining: this.TRIAL_DURATION_DAYS * 24,
          isNewUser: true,
          message: 'يمكنك بدء تجربتك المجانية الآن'
        };
      }

      console.log('Existing trial data found:', { 
        savedUserId: existingData.userId, 
        currentUserId,
        savedFingerprint: existingData.fingerprint,
        currentFingerprint
      });

      // فحص متعدد المستويات للتأكد من نفس الجهاز/المستخدم
      const isSameDevice = existingData.userId === currentUserId || 
                          existingData.fingerprint === currentFingerprint;

      if (!isSameDevice) {
        console.log('Different device detected');
        return {
          isValid: false,
          daysRemaining: 0,
          hoursRemaining: 0,
          isNewUser: false,
          message: 'تم استخدام التجربة المجانية من هذا الجهاز مسبقاً'
        };
      }

      const endDate = new Date(existingData.endDate);
      const now = new Date();
      const timeRemaining = endDate.getTime() - now.getTime();
      const daysRemaining = Math.ceil(timeRemaining / (1000 * 60 * 60 * 24));
      const hoursRemaining = Math.ceil(timeRemaining / (1000 * 60 * 60));


      if (timeRemaining > 0) {
        // تحديث عدد الزيارات
        existingData.visits = (existingData.visits || 0) + 1;
        existingData.lastVisit = now.toISOString();
        this.saveTrialData(existingData);
        
        // تفعيل التجربة في الجلسة الحالية
        sessionStorage.setItem('freeTrialActive', 'true');
        sessionStorage.setItem('trialEndTime', existingData.endDate);
        
        const timeMessage = daysRemaining > 0 
          ? `متبقي ${daysRemaining} أيام من تجربتك المجانية`
          : `متبقي ${hoursRemaining} ساعات من تجربتك المجانية`;
        
        return {
          isValid: true,
          daysRemaining: Math.max(0, daysRemaining),
          hoursRemaining: Math.max(0, hoursRemaining),
          isNewUser: false,
          message: timeMessage
        };
      } else {
        console.log('Trial expired');
        sessionStorage.removeItem('freeTrialActive');
        return {
          isValid: false,
          daysRemaining: 0,
          hoursRemaining: 0,
          isNewUser: false,
          message: 'انتهت فترة التجربة المجانية. يرجى الاشتراك للمتابعة'
        };
      }
    } catch (error) {
      console.error('Error checking trial status:', error);
      return {
        isValid: false,
        daysRemaining: 0,
        hoursRemaining: 0,
        isNewUser: false,
        message: 'حدث خطأ في فحص حالة التجربة المجانية'
      };
    }
  }

  // إنهاء التجربة المجانية (للاختبار)
  public static endTrial(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.BACKUP_KEY);
    sessionStorage.removeItem(this.SESSION_KEY);
    sessionStorage.removeItem('freeTrialActive');
    document.cookie = `${this.STORAGE_KEY}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  }

  // مسح جميع البيانات (للطوارئ فقط)
  public static clearAllData(): void {
    this.endTrial();
    localStorage.clear();
    sessionStorage.clear();
  }
}