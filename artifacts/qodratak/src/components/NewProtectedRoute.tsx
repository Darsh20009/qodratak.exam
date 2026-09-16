import { useEffect } from "react";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import useSubscription from "@/hooks/useSubscription";
import { useUser } from "@/hooks/use-user";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiresPremium?: boolean;
  showUpgrade?: boolean;
}

export default function NewProtectedRoute({
  children,
  requiresPremium = false,
}: ProtectedRouteProps) {
  const [location, navigate] = useLocation();

  const { user: serverUser, isLoading, error: userError, refetch: refetchUser } = useUser();
  const { subscription, isLoading: subscriptionLoading } = useSubscription();

  useEffect(() => {
    if (!isLoading && !userError && !serverUser) {
      const returnPath = encodeURIComponent(location);
      navigate(`/login?return=${returnPath}`);
    }
  }, [isLoading, userError, serverUser, location, navigate]);

  if (isLoading || subscriptionLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4" dir="rtl">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-600 to-emerald-600 flex items-center justify-center shadow-xl">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
        </div>
        <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">جاري التحقق من بياناتك...</p>
      </div>
    );
  }

  if (userError) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 p-6 text-center" dir="rtl">
        <p className="text-gray-600 dark:text-gray-300 text-sm font-medium">
          تعذر التحقق من الجلسة بسبب اتصال مؤقت.
        </p>
        <button
          type="button"
          onClick={() => refetchUser()}
          className="rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-teal-800"
        >
          إعادة المحاولة
        </button>
      </div>
    );
  }

  if (!serverUser) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4" dir="rtl">
        <Loader2 className="w-8 h-8 text-teal-700 animate-spin" />
        <p className="text-gray-400 text-sm">جاري التحويل لصفحة الدخول...</p>
      </div>
    );
  }

  const subscriptionType = (serverUser as any)?.subscription?.type || 'free';
  const isPremium = Boolean(
    subscription?.hasActiveSubscription &&
    subscription?.canAccessPremiumFeatures &&
    !subscription?.isExpired,
  );

  if (requiresPremium && !isPremium) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6" dir="rtl">
        <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-xl">
          <div className="bg-gradient-to-l from-amber-500 to-orange-600 px-6 py-8 text-center">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <span className="text-3xl">👑</span>
            </div>
            <h2 className="text-white font-black text-xl">محتوى مميز</h2>
            <p className="text-white/80 text-sm mt-1">هذا المحتوى حصري للمشتركين</p>
          </div>
          <div className="p-6 space-y-4">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4 text-center">
              <p className="text-gray-500 dark:text-gray-400 text-sm">اشتراكك الحالي</p>
              <p className="text-gray-900 dark:text-white font-bold text-base mt-0.5">{subscriptionType}</p>
            </div>
            <a
              href="/subscription"
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-gradient-to-l from-amber-500 to-orange-600 text-white font-bold text-sm hover:opacity-90 transition-opacity"
            >
              ترقية الحساب الآن →
            </a>
            <a
              href="/"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-medium text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              العودة للرئيسية
            </a>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
