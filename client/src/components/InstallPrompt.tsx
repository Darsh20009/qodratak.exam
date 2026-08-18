import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  X, 
  Download, 
  Share, 
  Plus, 
  MoreVertical,
  Smartphone,
  Monitor,
  Chrome,
  Apple
} from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

type BrowserType = 'chrome' | 'safari' | 'firefox' | 'edge' | 'samsung' | 'other';
type DeviceType = 'ios' | 'android' | 'desktop';

const InstallPrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [browserType, setBrowserType] = useState<BrowserType>('other');
  const [deviceType, setDeviceType] = useState<DeviceType>('desktop');
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const detectBrowserAndDevice = () => {
      const ua = navigator.userAgent.toLowerCase();
      
      const standalone = window.matchMedia('(display-mode: standalone)').matches ||
                        (navigator as any).standalone ||
                        document.referrer.includes('android-app://');
      setIsStandalone(standalone);

      let device: DeviceType = 'desktop';
      if (/iphone|ipad|ipod/.test(ua)) {
        device = 'ios';
      } else if (/android/.test(ua)) {
        device = 'android';
      }
      setDeviceType(device);

      let browser: BrowserType = 'other';
      if (/edg/.test(ua)) {
        browser = 'edge';
      } else if (/chrome/.test(ua) && !/edg/.test(ua)) {
        browser = 'chrome';
      } else if (/safari/.test(ua) && !/chrome/.test(ua)) {
        browser = 'safari';
      } else if (/firefox/.test(ua)) {
        browser = 'firefox';
      } else if (/samsungbrowser/.test(ua)) {
        browser = 'samsung';
      }
      setBrowserType(browser);

      return { standalone, device, browser };
    };

    const { standalone } = detectBrowserAndDevice();

    if (standalone) {
      return;
    }

    const dismissed = localStorage.getItem('pwa-install-dismissed');
    const dismissedTime = dismissed ? parseInt(dismissed) : 0;
    const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);
    
    if (daysSinceDismissed > 7) {
      setTimeout(() => setShowPrompt(true), 3000);
    }

    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setTimeout(() => setShowPrompt(true), 2000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(console.error);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowPrompt(false);
        localStorage.setItem('pwa-installed', 'true');
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  if (isStandalone || !showPrompt) {
    return null;
  }

  const renderIOSInstructions = () => (
    <div className="space-y-3" dir="rtl">
      <div className="flex items-center gap-3 text-right">
        <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
          <Share className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        </div>
        <p className="text-sm text-gray-700 dark:text-gray-300">
          اضغط على <span className="font-bold text-blue-600">مشاركة</span> في أسفل الشاشة
        </p>
      </div>
      <div className="flex items-center gap-3 text-right">
        <div className="flex-shrink-0 w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
          <Plus className="w-4 h-4 text-green-600 dark:text-green-400" />
        </div>
        <p className="text-sm text-gray-700 dark:text-gray-300">
          اختر <span className="font-bold text-green-600">إضافة إلى الشاشة الرئيسية</span>
        </p>
      </div>
    </div>
  );

  const renderAndroidChromeInstructions = () => (
    <div className="space-y-3" dir="rtl">
      {deferredPrompt ? (
        <Button 
          onClick={handleInstall}
          className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
          data-testid="button-install-pwa"
        >
          <Download className="w-5 h-5 ml-2" />
          تثبيت التطبيق الآن
        </Button>
      ) : (
        <>
          <div className="flex items-center gap-3 text-right">
            <div className="flex-shrink-0 w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
              <MoreVertical className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              اضغط على <span className="font-bold">القائمة</span> (⋮) في أعلى الشاشة
            </p>
          </div>
          <div className="flex items-center gap-3 text-right">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <Download className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              اختر <span className="font-bold text-blue-600">تثبيت التطبيق</span> أو <span className="font-bold text-blue-600">إضافة للشاشة الرئيسية</span>
            </p>
          </div>
        </>
      )}
    </div>
  );

  const renderDesktopInstructions = () => (
    <div className="space-y-3" dir="rtl">
      {deferredPrompt ? (
        <Button 
          onClick={handleInstall}
          className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-600 hover:to-emerald-600"
          data-testid="button-install-pwa-desktop"
        >
          <Download className="w-5 h-5 ml-2" />
          تثبيت التطبيق
        </Button>
      ) : (
        <>
          <div className="flex items-center gap-3 text-right">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <Download className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              ابحث عن أيقونة <span className="font-bold text-blue-600">التثبيت</span> في شريط العنوان
            </p>
          </div>
          <div className="flex items-center gap-3 text-right">
            <div className="flex-shrink-0 w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
              <Plus className="w-4 h-4 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              أو من القائمة: <span className="font-bold">تثبيت منصة قدراتك</span>
            </p>
          </div>
        </>
      )}
    </div>
  );

  const renderFirefoxInstructions = () => (
    <div className="space-y-3" dir="rtl">
      <div className="flex items-center gap-3 text-right">
        <div className="flex-shrink-0 w-8 h-8 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center">
          <MoreVertical className="w-4 h-4 text-orange-600 dark:text-orange-400" />
        </div>
        <p className="text-sm text-gray-700 dark:text-gray-300">
          اضغط على <span className="font-bold">القائمة</span> ثم <span className="font-bold text-orange-600">تثبيت</span>
        </p>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
        أو استخدم Chrome للحصول على أفضل تجربة
      </p>
    </div>
  );

  const getIcon = () => {
    if (deviceType === 'ios') return <Apple className="w-6 h-6 text-gray-800 dark:text-gray-200" />;
    if (deviceType === 'android') return <Smartphone className="w-6 h-6 text-green-600" />;
    return <Monitor className="w-6 h-6 text-green-700" />;
  };

  const getTitle = () => {
    if (deviceType === 'ios') return 'أضف قدراتك للشاشة الرئيسية';
    if (deviceType === 'android') return 'ثبّت تطبيق قدراتك';
    return 'ثبّت تطبيق قدراتك';
  };

  const renderInstructions = () => {
    if (deviceType === 'ios') {
      return renderIOSInstructions();
    }
    if (deviceType === 'android') {
      return renderAndroidChromeInstructions();
    }
    if (browserType === 'firefox') {
      return renderFirefoxInstructions();
    }
    return renderDesktopInstructions();
  };

  return (
    <div className="fixed bottom-20 left-4 right-4 md:bottom-4 z-50 md:left-auto md:right-4 md:w-96" dir="rtl">
      <Card className="border-2 border-green-400 dark:border-green-400 shadow-2xl bg-white dark:bg-gray-900">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-600 to-blue-600 flex items-center justify-center shadow-lg">
                <img 
                  src="/icon-192x192.png" 
                  alt="قدراتك" 
                  className="w-8 h-8 rounded-lg"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                  {getTitle()}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  للوصول السريع والعمل بدون إنترنت
                </p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handleDismiss}
              className="flex-shrink-0"
              data-testid="button-dismiss-install-prompt"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {renderInstructions()}

          <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-center gap-4 text-xs text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1">
                {getIcon()}
                <span>
                  {browserType === 'chrome' && 'Chrome'}
                  {browserType === 'safari' && 'Safari'}
                  {browserType === 'firefox' && 'Firefox'}
                  {browserType === 'edge' && 'Edge'}
                  {browserType === 'samsung' && 'Samsung'}
                  {browserType === 'other' && 'المتصفح'}
                </span>
              </span>
              <span className="text-gray-300 dark:text-gray-600">|</span>
              <span>
                {deviceType === 'ios' && 'iOS'}
                {deviceType === 'android' && 'Android'}
                {deviceType === 'desktop' && 'سطح المكتب'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InstallPrompt;
