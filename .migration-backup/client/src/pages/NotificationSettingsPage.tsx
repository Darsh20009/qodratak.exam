import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Bell, MessageCircle, Phone, CheckCircle2, XCircle,
  ExternalLink, Send, ChevronLeft, Clock, BarChart3,
  Info, Smartphone, Link, Unlink, Monitor, Zap, Apple
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { usePushNotifications } from "@/hooks/usePushNotifications";

function getUser() {
  try { return JSON.parse(localStorage.getItem("user") || "{}"); } catch { return {}; }
}

interface Prefs {
  telegramLinked: boolean;
  telegramId: string | null;
  whatsappPhone: string | null;
  notifExamReminder: boolean;
  notifWeeklyReport: boolean;
}

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none",
        checked ? "bg-green-500" : "bg-gray-200",
        disabled && "opacity-40 cursor-not-allowed"
      )}
      data-testid="toggle-switch"
    >
      <span className={cn(
        "absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200",
        checked ? "translate-x-6 right-auto left-0.5 rtl:right-0.5 rtl:left-auto rtl:translate-x-0" : "left-0.5 rtl:right-0.5",
      )} />
    </button>
  );
}

export default function NotificationSettingsPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const user = getUser();
  const userId = user?.id || user?._id || "";
  const botUsername = "qodrataksite_bot";

  const [waPhone, setWaPhone] = useState("");
  const [sendingTest, setSendingTest] = useState(false);
  const [sendingPushTest, setSendingPushTest] = useState<string | null>(null);

  const { isSupported: pushSupported, permission: pushPermission, isSubscribed, isLoading: pushLoading, subscribe, unsubscribe, sendTest } = usePushNotifications();

  const { data: prefs, isLoading } = useQuery<Prefs>({
    queryKey: ["/api/notifications/preferences"],
    queryFn: async () => {
      const res = await fetch("/api/notifications/preferences");
      if (!res.ok) throw new Error("فشل جلب الإعدادات");
      const data = await res.json();
      if (data.whatsappPhone) setWaPhone(data.whatsappPhone);
      return data;
    },
    retry: false,
  });

  const updateMutation = useMutation({
    mutationFn: async (body: Partial<Prefs> & { whatsappPhone?: string }) => {
      const res = await fetch("/api/notifications/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("فشل التحديث");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/preferences"] });
    },
    onError: () => toast({ description: "فشل تحديث الإعداد", variant: "destructive" }),
  });

  const handleToggle = (key: "notifExamReminder" | "notifWeeklyReport", value: boolean) => {
    updateMutation.mutate({ [key]: value });
  };

  const handleSaveWa = () => {
    updateMutation.mutate({ whatsappPhone: waPhone });
    toast({ description: "✅ تم حفظ رقم الواتساب" });
  };

  const handleTestTelegram = async () => {
    setSendingTest(true);
    try {
      const res = await fetch("/api/notifications/test", { method: "POST" });
      const data = await res.json();
      if (res.ok) toast({ description: "✅ تم إرسال رسالة تجريبية عبر تيليجرام!" });
      else toast({ description: data.error || "فشل الإرسال", variant: "destructive" });
    } catch {
      toast({ description: "تعذر الاتصال بالخادم", variant: "destructive" });
    } finally {
      setSendingTest(false);
    }
  };

  const telegramLinkUrl = `https://t.me/${botUsername}?start=notify_${userId}`;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20" dir="rtl">
      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate(-1 as any)}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            data-testid="btn-back"
          >
            <ChevronLeft className="w-5 h-5 text-gray-500 rotate-180" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Bell className="w-5 h-5 text-green-600" />
              إعدادات الإشعارات
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">تذكيرات الاختبار والتقارير الأسبوعية</p>
          </div>
        </div>

        {/* Telegram section */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-4">
          <div className="h-1.5 bg-gradient-to-l from-blue-500 to-sky-400" />
          <div className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-blue-500" />
              </div>
              <div className="flex-1">
                <h2 className="font-bold text-gray-900">تيليجرام</h2>
                <p className="text-xs text-gray-500">إشعارات تلقائية مجانية عبر البوت</p>
              </div>
              {prefs?.telegramLinked ? (
                <span className="flex items-center gap-1.5 text-xs font-semibold text-green-700 bg-green-50 px-3 py-1 rounded-full border border-green-200" data-testid="status-telegram-linked">
                  <CheckCircle2 className="w-3.5 h-3.5" /> مرتبط
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 bg-gray-50 px-3 py-1 rounded-full border border-gray-200" data-testid="status-telegram-unlinked">
                  <XCircle className="w-3.5 h-3.5" /> غير مرتبط
                </span>
              )}
            </div>

            {!prefs?.telegramLinked ? (
              <div className="bg-blue-50 rounded-xl p-4 mb-4">
                <p className="text-sm text-blue-800 font-medium mb-3">كيف تربط حسابك بتيليجرام؟</p>
                <ol className="text-sm text-blue-700 space-y-1.5 mb-4 list-decimal list-inside">
                  <li>اضغط "ربط تيليجرام" أدناه</li>
                  <li>سيفتح بوت قدراتك في تيليجرام</li>
                  <li>اضغط "Start" في تيليجرام</li>
                  <li>ارجع هنا وستجد حسابك مرتبطاً ✅</li>
                </ol>
                <a
                  href={telegramLinkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2.5 bg-blue-500 text-white rounded-xl font-semibold text-sm hover:bg-blue-600 transition-colors"
                  data-testid="btn-link-telegram"
                >
                  <Link className="w-4 h-4" />
                  ربط تيليجرام
                  <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                </a>
              </div>
            ) : (
              <div className="flex gap-2 mb-4">
                <button
                  onClick={handleTestTelegram}
                  disabled={sendingTest}
                  className="flex-1 flex items-center justify-center gap-2 py-2 border border-blue-200 text-blue-600 rounded-xl text-sm font-medium hover:bg-blue-50 transition-colors disabled:opacity-60"
                  data-testid="btn-test-telegram"
                >
                  <Send className="w-3.5 h-3.5" />
                  {sendingTest ? "جاري الإرسال..." : "إرسال رسالة تجريبية"}
                </button>
                <a
                  href={telegramLinkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 border border-gray-200 text-gray-500 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-1.5"
                  data-testid="btn-relink-telegram"
                >
                  <Unlink className="w-3.5 h-3.5" /> إعادة ربط
                </a>
              </div>
            )}

            {/* Notification Toggles */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between py-3 border-t border-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
                    <Clock className="w-4 h-4 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">تذكير قبل الاختبار</p>
                    <p className="text-xs text-gray-400">رسالة قبل ساعة من الاختبار المحجوز</p>
                  </div>
                </div>
                <Toggle
                  checked={prefs?.notifExamReminder ?? true}
                  onChange={v => handleToggle("notifExamReminder", v)}
                  disabled={!prefs?.telegramLinked}
                />
              </div>

              <div className="flex items-center justify-between py-3 border-t border-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-4 h-4 text-green-700" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">تقرير أسبوعي</p>
                    <p className="text-xs text-gray-400">ملخص أدائك كل أحد الساعة 8 مساءً</p>
                  </div>
                </div>
                <Toggle
                  checked={prefs?.notifWeeklyReport ?? true}
                  onChange={v => handleToggle("notifWeeklyReport", v)}
                  disabled={!prefs?.telegramLinked}
                />
              </div>
            </div>

            {!prefs?.telegramLinked && (
              <div className="flex items-start gap-2 mt-3 bg-gray-50 rounded-xl p-3">
                <Info className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                <p className="text-xs text-gray-500">يجب ربط تيليجرام أولاً لتفعيل الإشعارات</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Push Notifications section ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-4">
          <div className="h-1.5 bg-gradient-to-l from-green-600 to-emerald-400" />
          <div className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1">
                <h2 className="font-bold text-gray-900 flex items-center gap-2">
                  إشعارات الجهاز (Push)
                  <span className="text-[10px] font-semibold bg-green-100 text-green-700 px-2 py-0.5 rounded-full border border-green-200">جديد 🔥</span>
                </h2>
                <p className="text-xs text-gray-500">تظهر على شاشة القفل — iPhone / Android / Windows</p>
              </div>
              {isSubscribed && (
                <span className="flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 px-2 py-1 rounded-full border border-green-200">
                  <CheckCircle2 className="w-3 h-3" /> مفعّل
                </span>
              )}
            </div>

            {!pushSupported ? (
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-800">
                ⚠️ متصفحك لا يدعم إشعارات Push. استخدم Chrome أو Safari (iOS 16.4+)
              </div>
            ) : pushPermission === "denied" ? (
              <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-xs text-red-800">
                🔕 تم رفض الإشعارات. لإعادة التفعيل: إعدادات الجهاز ← الإشعارات ← قدراتك ← سماح
              </div>
            ) : !isSubscribed ? (
              <div>
                {/* What you get */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {[
                    { icon: "⏰", label: "قبل الاختبار بـ 24h و 1h" },
                    { icon: "☀️", label: "تذكير يومي 7 صباحاً" },
                    { icon: "📊", label: "تقرير أسبوعي الأحد" },
                    { icon: "🔥", label: "تنبيه عند انقطاع السلسلة" },
                    { icon: "🏆", label: "إشعار الإنجازات" },
                    { icon: "⏰", label: "هدفك اليومي لم يكتمل" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-xs text-gray-600">
                      <span>{item.icon}</span><span>{item.label}</span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={subscribe}
                  disabled={pushLoading}
                  className={cn(
                    "w-full py-3 rounded-xl font-bold text-sm transition-all",
                    pushLoading ? "bg-gray-100 text-gray-400" : "bg-green-600 text-white hover:bg-green-700 shadow-sm"
                  )}
                  data-testid="btn-push-subscribe"
                >
                  {pushLoading ? "جارٍ التفعيل..." : "🔔 فعّل إشعارات الجهاز"}
                </button>
                <p className="text-[10px] text-gray-400 text-center mt-2">تظهر على شاشة القفل حتى بدون فتح الموقع</p>
              </div>
            ) : (
              <div>
                <div className="bg-green-50 border border-green-100 rounded-xl p-3 mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                  <p className="text-xs text-green-800 font-medium">الإشعارات مفعّلة على هذا الجهاز ✅</p>
                </div>

                {/* Test different notification types */}
                <p className="text-xs font-semibold text-gray-700 mb-2">اختبر أنواع الإشعارات:</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {[
                    { type: "exam",        label: "⏰ اختبار",      color: "border-amber-200 text-amber-700 hover:bg-amber-50" },
                    { type: "study",       label: "☀️ دراسة",       color: "border-blue-200 text-blue-700 hover:bg-blue-50" },
                    { type: "goal",        label: "🎯 هدف",          color: "border-green-400 text-green-700 hover:bg-green-100" },
                    { type: "achievement", label: "🏆 إنجاز",        color: "border-green-200 text-green-700 hover:bg-green-50" },
                  ].map(({ type, label, color }) => (
                    <button
                      key={type}
                      onClick={async () => {
                        setSendingPushTest(type);
                        const ok = await sendTest(type);
                        setSendingPushTest(null);
                        if (ok) toast({ description: `✅ تم إرسال إشعار "${label}" — تحقق من شاشة قفلك` });
                        else toast({ description: "تعذر إرسال الإشعار", variant: "destructive" });
                      }}
                      disabled={sendingPushTest === type}
                      className={cn("px-3 py-1.5 border rounded-xl text-xs font-medium transition-colors", color, sendingPushTest === type && "opacity-50")}
                      data-testid={`btn-push-test-${type}`}
                    >
                      {sendingPushTest === type ? "جارٍ..." : label}
                    </button>
                  ))}
                </div>

                <button
                  onClick={unsubscribe}
                  disabled={pushLoading}
                  className="w-full py-2 border border-red-200 text-red-500 rounded-xl text-xs font-medium hover:bg-red-50 transition-colors disabled:opacity-50"
                  data-testid="btn-push-unsubscribe"
                >
                  {pushLoading ? "جارٍ..." : "🔕 إيقاف إشعارات هذا الجهاز"}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* WhatsApp section */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-4">
          <div className="h-1.5 bg-gradient-to-l from-green-500 to-emerald-400" />
          <div className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                <Phone className="w-5 h-5 text-green-500" />
              </div>
              <div className="flex-1">
                <h2 className="font-bold text-gray-900">واتساب</h2>
                <p className="text-xs text-gray-500">احفظ رقمك لاستخدامه مستقبلاً</p>
              </div>
              <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-1 rounded-full font-medium border border-amber-200">قريباً</span>
            </div>

            <div className="flex gap-2">
              <input
                type="tel"
                value={waPhone}
                onChange={e => setWaPhone(e.target.value)}
                placeholder="05xxxxxxxx"
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-400 bg-gray-50"
                dir="ltr"
                data-testid="input-whatsapp-phone"
              />
              <button
                onClick={handleSaveWa}
                className="px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors"
                data-testid="btn-save-whatsapp"
              >
                حفظ
              </button>
            </div>

            {prefs?.whatsappPhone && (
              <div className="mt-3">
                <a
                  href={`https://wa.me/966${prefs.whatsappPhone.replace(/^0/, "")}?text=${encodeURIComponent("مرحباً! هذا اختبار من منصة قدراتك 🎓")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-green-600 hover:underline"
                  data-testid="btn-test-whatsapp"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  اختبر الرقم عبر واتساب
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Info card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-semibold text-gray-800 text-sm mb-3 flex items-center gap-2">
            <Info className="w-4 h-4 text-green-600" />
            ماذا ستستلم؟
          </h3>
          <div className="flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 bg-amber-50 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">تذكير الاختبار</p>
                <p className="text-xs text-gray-500 mt-0.5">رسالة تيليجرام قبل ساعة من كل اختبار محجوز تذكّرك بالاستعداد وتوضح الوقت المحدد</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 bg-green-100 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                <BarChart3 className="w-3.5 h-3.5 text-green-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">التقرير الأسبوعي</p>
                <p className="text-xs text-gray-500 mt-0.5">كل أحد الساعة 8 مساءً: عدد الاختبارات، متوسط الدرجات، أفضل نتيجة، ونصيحة للتحسين</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
