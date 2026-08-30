import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, Lock, CheckCircle, Loader2, AlertCircle } from "lucide-react";

export default function ResetPasswordPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("token");
    if (t) setToken(t);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast({ title: "خطأ", description: "كلمتا المرور غير متطابقتين", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "خطأ", description: "كلمة المرور يجب أن تكون 6 أحرف على الأقل", variant: "destructive" });
      return;
    }
    if (!token) {
      toast({ title: "خطأ", description: "الرابط غير صالح", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (res.ok) {
        setDone(true);
      } else {
        toast({ title: "خطأ", description: data.error || "حدث خطأ", variant: "destructive" });
      }
    } catch {
      toast({ title: "خطأ في الاتصال", description: "تعذر الاتصال بالخادم", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" dir="rtl">
        <div className="text-center space-y-4">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">رابط غير صالح</h2>
          <p className="text-gray-500">هذا الرابط غير صالح أو منتهي الصلاحية.</p>
          <Button onClick={() => setLocation("/forgot-password")} className="text-white rounded-xl" style={{ background: '#1a7c3e' }}>
            طلب رابط جديد
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center px-4" dir="rtl">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden">

          {/* Header */}
          <div className="px-8 py-8 text-center" style={{ background: '#1a7c3e' }}>
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-black text-white">إنشاء كلمة مرور جديدة</h1>
            <p className="text-white/80 text-sm mt-1">اختر كلمة مرور قوية لحسابك</p>
          </div>

          <div className="px-8 py-8">
            {done ? (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">تم تغيير كلمة المرور!</h2>
                  <p className="text-gray-500 text-sm">يمكنك الآن تسجيل الدخول بكلمة مرورك الجديدة.</p>
                </div>
                <Button
                  onClick={() => setLocation("/login")}
                  className="w-full text-white rounded-xl"
                  style={{ background: '#1a7c3e' }}
                  data-testid="btn-go-login"
                >
                  تسجيل الدخول
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    كلمة المرور الجديدة
                  </label>
                  <div className="relative">
                    <Input
                      type={showPass ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      minLength={6}
                      className="w-full rounded-xl pl-10"
                      data-testid="input-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(v => !v)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">6 أحرف على الأقل</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    تأكيد كلمة المرور
                  </label>
                  <Input
                    type={showPass ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    required
                    className={`w-full rounded-xl ${confirm && confirm !== password ? 'border-red-400' : ''}`}
                    data-testid="input-confirm-password"
                  />
                  {confirm && confirm !== password && (
                    <p className="text-xs text-red-500 mt-1">كلمتا المرور غير متطابقتين</p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={isLoading || !password || !confirm || password !== confirm}
                  className="w-full text-white rounded-xl py-3 font-bold"
                  style={{ background: '#1a7c3e' }}
                  data-testid="btn-reset-password"
                >
                  {isLoading ? (
                    <><Loader2 className="w-4 h-4 animate-spin ml-2" />جارٍ التغيير...</>
                  ) : (
                    <><Lock className="w-4 h-4 ml-2" />تعيين كلمة المرور</>
                  )}
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
