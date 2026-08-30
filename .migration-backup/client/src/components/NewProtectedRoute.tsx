import { useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";

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

  const { data: serverUser, isLoading } = useQuery({
    queryKey: ['/api/user'],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
    staleTime: 0,
  });

  useEffect(() => {
    if (!isLoading && !serverUser) {
      const returnPath = encodeURIComponent(location);
      navigate(`/login?return=${returnPath}`);
    }
  }, [isLoading, serverUser, location, navigate]);

  if (isLoading) {
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

  if (!serverUser) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4" dir="rtl">
        <Loader2 className="w-8 h-8 text-teal-700 animate-spin" />
        <p className="text-gray-400 text-sm">جاري التحويل لصفحة الدخول...</p>
      </div>
    );
  }

  const subscriptionType = (serverUser as any)?.subscription?.type || 'free';
  const isPremium = ['Pro', 'Pro Life', 'Pro Life Plus', 'Pro Live', 'free_trial'].includes(subscriptionType);

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
