import { useState, useEffect } from "react";
import { Bell, Smartphone, Monitor, Apple } from "lucide-react";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { cn } from "@/lib/utils";

function getPlatform(): "ios" | "android" | "windows" | "other" {
  const ua = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return "ios";
  if (/android/.test(ua)) return "android";
  if (/windows/.test(ua)) return "windows";
  return "other";
}

function isInStandaloneMode(): boolean {
  return (window.navigator as any).standalone === true ||
    window.matchMedia("(display-mode: standalone)").matches;
}

export function PushNotificationBanner() {
  const [visible, setVisible] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [justGranted, setJustGranted] = useState(false);
  const { permission, isSubscribed, isSupported, subscribe } = usePushNotifications();
  const platform = getPlatform();

  useEffect(() => {
    if (!isSupported) return;
    if (isSubscribed || permission === "granted") return;
    if (permission === "denied") return;

    const t = setTimeout(() => setVisible(true), 1500);
    return () => clearTimeout(t);
  }, [isSupported, permission, isSubscribed]);

  if (!visible || !isSupported || isSubscribed) return null;

  const handleSubscribe = async () => {
    setSubscribing(true);
    const ok = await subscribe();
    setSubscribing(false);
    if (ok) {
      setJustGranted(true);
      setTimeout(() => setVisible(false), 2500);
    }
  };

  const isIOS = platform === "ios";
  const notPWA = isIOS && !isInStandaloneMode();

  if (justGranted) {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm" dir="rtl">
        <div className="bg-white rounded-3xl p-8 mx-4 max-w-sm w-full text-center shadow-2xl">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Bell className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-black text-gray-900 mb-2">تم تفعيل الإشعارات ✅</h2>
          <p className="text-sm text-gray-500">ستصلك تذكيرات الاختبار والدراسة اليومية حتى وإن كان التطبيق مغلقاً</p>
        </div>
      </div>
    );
  }

  if (permission === "denied") {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm" dir="rtl">
        <div className="bg-white rounded-3xl p-6 mx-4 max-w-sm w-full shadow-2xl">
          <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Bell className="w-7 h-7 text-red-500" />
          </div>
          <h2 className="text-lg font-black text-gray-900 mb-2 text-center">الإشعارات محجوبة</h2>
          <p className="text-sm text-gray-500 text-center mb-4 leading-relaxed">
            لتفعيل الإشعارات، افتح إعدادات المتصفح → الإشعارات → اسمح لهذا الموقع
          </p>
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 mb-4 text-center">
            <p className="text-xs text-amber-700 font-medium">الإشعارات ضرورية لتذكيرات الاختبارات والأهداف اليومية</p>
          </div>
          <button
            onClick={() => setVisible(false)}
            className="w-full py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50"
          >
            حسناً، فهمت
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm" dir="rtl">
      <div className="bg-white rounded-3xl mx-4 max-w-sm w-full shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="p-6 pb-4 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: "#e8f5ee" }}>
            <Bell className="w-8 h-8" style={{ color: "#1a7c3e" }} />
          </div>
          <h2 className="text-xl font-black text-gray-900 mb-1">فعّل إشعارات قدراتك</h2>
          <p className="text-sm text-gray-500">لا تفوّت أي موعد أو هدف دراسي</p>
        </div>

        {/* Benefits */}
        {!notPWA ? (
          <div className="px-6 pb-4">
            <div className="bg-gray-50 rounded-2xl p-4 space-y-2.5">
              {[
                { icon: "⏰", text: "تذكير قبل اختبارك بساعة" },
                { icon: "☀️", text: "تذكير الدراسة الصباحي اليومي" },
                { icon: "📊", text: "تقريرك الأسبوعي عن أدائك" },
                { icon: "🔥", text: "تنبيه عند انقطاع سلسلة دراستك" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-base">{item.icon}</span>
                  <span className="text-sm text-gray-700">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="px-6 pb-4">
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
              <p className="text-sm text-blue-800 leading-relaxed">
                <span className="font-bold">📱 iPhone:</span> افتح Safari ← اضغط زر المشاركة ← «Add to Home Screen» ثم افتح التطبيق من شاشتك الرئيسية لتفعيل الإشعارات
              </p>
            </div>
          </div>
        )}

        {/* Platform */}
        <div className="px-6 pb-4 flex items-center justify-center gap-1.5">
          {platform === "ios" && <Apple className="w-3 h-3 text-gray-400" />}
          {platform === "android" && <Smartphone className="w-3 h-3 text-gray-400" />}
          {(platform === "windows" || platform === "other") && <Monitor className="w-3 h-3 text-gray-400" />}
          <span className="text-[11px] text-gray-400">
            {platform === "ios" ? "iOS" : platform === "android" ? "Android" : "الحاسوب"} · إشعارات في شاشة القفل
          </span>
        </div>

        {/* Action buttons */}
        <div className="px-6 pb-6 space-y-2.5">
          {!notPWA && (
            <button
              onClick={handleSubscribe}
              disabled={subscribing}
              className={cn(
                "w-full py-3.5 rounded-2xl text-sm font-black transition-all shadow-md",
                subscribing
                  ? "bg-gray-100 text-gray-400"
                  : "text-white hover:opacity-90 active:scale-[0.98]"
              )}
              style={!subscribing ? { background: "#1a7c3e" } : undefined}
            >
              {subscribing ? "جارٍ التفعيل..." : "🔔 فعّل الإشعارات الآن"}
            </button>
          )}
          <button
            onClick={() => setVisible(false)}
            className="w-full py-2.5 rounded-xl text-xs font-medium text-gray-400 hover:text-gray-600 transition-colors"
          >
            تذكيرني لاحقاً
          </button>
        </div>

      </div>
    </div>
  );
}
