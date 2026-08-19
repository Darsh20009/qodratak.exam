import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { 
  Download, 
  Share,
  Smartphone,
  Monitor,
  X
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

type DeviceType = 'ios' | 'android' | 'desktop';

export const PermanentInstallButton = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [deviceType, setDeviceType] = useState<DeviceType>('desktop');
  const [isStandalone, setIsStandalone] = useState(false);
  const [showIOSDialog, setShowIOSDialog] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    
    const standalone = window.matchMedia('(display-mode: standalone)').matches ||
                      (navigator as any).standalone ||
                      document.referrer.includes('android-app://');
    setIsStandalone(standalone);

    if (standalone) {
      setIsInstalled(true);
      return;
    }

    let device: DeviceType = 'desktop';
    if (/iphone|ipad|ipod/.test(ua)) {
      device = 'ios';
    } else if (/android/.test(ua)) {
      device = 'android';
    }
    setDeviceType(device);

    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (deviceType === 'ios') {
      setShowIOSDialog(true);
      return;
    }

    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        localStorage.setItem('pwa-installed', 'true');
      }
      setDeferredPrompt(null);
    }
  };

  if (isStandalone || isInstalled) {
    return null;
  }

  const getButtonContent = () => {
    if (deviceType === 'ios') {
      return (
        <>
          <Share className="w-4 h-4 ml-2" />
          <span>إضافة للشاشة الرئيسية</span>
        </>
      );
    }
    if (deviceType === 'android' && deferredPrompt) {
      return (
        <>
          <Download className="w-4 h-4 ml-2" />
          <span>تثبيت التطبيق</span>
        </>
      );
    }
    if (deviceType === 'desktop' && deferredPrompt) {
      return (
        <>
          <Monitor className="w-4 h-4 ml-2" />
          <span>تثبيت على الكمبيوتر</span>
        </>
      );
    }
    return (
      <>
        <Smartphone className="w-4 h-4 ml-2" />
        <span>تثبيت التطبيق</span>
      </>
    );
  };

  return (
    <>
      <Button 
        onClick={handleInstall}
        variant="default"
        className="w-full bg-[#0D1B2A] hover:bg-[#1E2938] text-white shadow-lg"
        data-testid="button-permanent-install"
      >
        {getButtonContent()}
      </Button>

      <Dialog open={showIOSDialog} onOpenChange={setShowIOSDialog}>
        <DialogContent className="max-w-sm" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right flex items-center gap-2">
              <div className="w-10 h-10 bg-[#0D1B2A] rounded-xl flex items-center justify-center">
                <img 
                  src="/qodratak-logo.png"
                  alt="قدراتك" 
                  className="w-8 h-8 rounded-lg object-cover object-top"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
              <span>إضافة قدراتك للشاشة الرئيسية</span>
            </DialogTitle>
            <DialogDescription className="text-right">
              اتبع الخطوات التالية لإضافة التطبيق
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold">
                1
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900 dark:text-white">اضغط على زر المشاركة</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  الأيقونة <Share className="inline w-4 h-4 mx-1" /> في أسفل الشاشة
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center text-green-600 dark:text-green-400 font-bold">
                2
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900 dark:text-white">اختر "إضافة إلى الشاشة الرئيسية"</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  قد تحتاج للتمرير لأسفل للعثور على الخيار
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-green-100 dark:bg-green-100 rounded-full flex items-center justify-center text-green-700 dark:text-green-700 font-bold">
                3
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900 dark:text-white">اضغط "إضافة"</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  سيظهر التطبيق على شاشتك الرئيسية
                </p>
              </div>
            </div>
          </div>
          
          <Button 
            onClick={() => setShowIOSDialog(false)} 
            variant="outline"
            className="w-full"
          >
            فهمت
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
};

export const FloatingInstallButton = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [deviceType, setDeviceType] = useState<DeviceType>('desktop');
  const [isStandalone, setIsStandalone] = useState(false);
  const [showButton, setShowButton] = useState(true);
  const [showIOSDialog, setShowIOSDialog] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    
    const standalone = window.matchMedia('(display-mode: standalone)').matches ||
                      (navigator as any).standalone ||
                      document.referrer.includes('android-app://');
    setIsStandalone(standalone);

    if (standalone) return;

    let device: DeviceType = 'desktop';
    if (/iphone|ipad|ipod/.test(ua)) {
      device = 'ios';
    } else if (/android/.test(ua)) {
      device = 'android';
    }
    setDeviceType(device);

    const dismissed = localStorage.getItem('floating-install-dismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed);
      const hoursSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60);
      if (hoursSinceDismissed < 24) {
        setShowButton(false);
      }
    }

    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (deviceType === 'ios') {
      setShowIOSDialog(true);
      return;
    }

    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowButton(false);
        localStorage.setItem('pwa-installed', 'true');
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowButton(false);
    localStorage.setItem('floating-install-dismissed', Date.now().toString());
  };

  if (isStandalone || !showButton) {
    return null;
  }

  if (deviceType === 'desktop' && !deferredPrompt) {
    return null;
  }

  return (
    <>
      <div className="fixed bottom-20 left-4 right-4 z-40 md:left-auto md:right-4 md:w-80" dir="rtl">
        <div className="bg-[#0D1B2A] rounded-xl shadow-2xl p-4 relative">
          <button 
            onClick={handleDismiss}
            className="absolute top-2 left-2 text-white/70 hover:text-white transition-colors"
            data-testid="button-dismiss-floating-install"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <img 
                src="/qodratak-logo.png"
                alt="قدراتك" 
                className="w-9 h-9 rounded-lg object-cover object-top"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
            <div className="text-white">
              <h3 className="font-bold text-lg">ثبّت تطبيق قدراتك</h3>
              <p className="text-sm text-white/80">للوصول السريع بدون متصفح</p>
            </div>
          </div>
          
          <Button 
            onClick={handleInstall}
            variant="secondary"
            className="w-full bg-[#F7F775] text-[#0D1B2A] hover:bg-[#ffff9b] font-bold"
            data-testid="button-floating-install"
          >
            <Download className="w-5 h-5 ml-2" />
            {deviceType === 'ios' ? 'إضافة للشاشة الرئيسية' : 'تثبيت الآن'}
          </Button>
        </div>
      </div>

      <Dialog open={showIOSDialog} onOpenChange={setShowIOSDialog}>
        <DialogContent className="max-w-sm" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right flex items-center gap-2">
              <div className="w-10 h-10 bg-[#0D1B2A] rounded-xl flex items-center justify-center">
                <img 
                  src="/qodratak-logo.png"
                  alt="قدراتك" 
                  className="w-8 h-8 rounded-lg object-cover object-top"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
              <span>إضافة قدراتك للشاشة الرئيسية</span>
            </DialogTitle>
            <DialogDescription className="text-right">
              اتبع الخطوات التالية لإضافة التطبيق
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold">
                1
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900 dark:text-white">اضغط على زر المشاركة</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  الأيقونة <Share className="inline w-4 h-4 mx-1" /> في أسفل الشاشة
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center text-green-600 dark:text-green-400 font-bold">
                2
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900 dark:text-white">اختر "إضافة إلى الشاشة الرئيسية"</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  قد تحتاج للتمرير لأسفل للعثور على الخيار
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-green-100 dark:bg-green-100 rounded-full flex items-center justify-center text-green-700 dark:text-green-700 font-bold">
                3
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900 dark:text-white">اضغط "إضافة"</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  سيظهر التطبيق على شاشتك الرئيسية
                </p>
              </div>
            </div>
          </div>
          
          <Button 
            onClick={() => setShowIOSDialog(false)} 
            variant="outline"
            className="w-full"
          >
            فهمت
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PermanentInstallButton;
