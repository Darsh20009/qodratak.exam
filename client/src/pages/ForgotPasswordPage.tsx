import { useState } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Mail, CheckCircle, Loader2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setSent(true);
      } else {
        toast({ title: "خطأ", description: data.error || "حدث خطأ", variant: "destructive" });
      }
    } catch {
      toast({ title: "خطأ في الاتصال", description: "تعذر الاتصال بالخادم", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center px-4" dir="rtl">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden">

          {/* Header */}
          <div className="px-8 py-8 text-center" style={{ background: '#1a7c3e' }}>
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Mail className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-black text-white">نسيت كلمة المرور؟</h1>
            <p className="text-white/80 text-sm mt-1">أدخل بريدك وسنرسل لك رابط الاستعادة</p>
          </div>

          <div className="px-8 py-8">
            {sent ? (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">تم إرسال الرابط!</h2>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    إذا كان البريد <strong style={{ color: '#1a7c3e' }}>{email}</strong> مسجلاً لدينا، ستجد رابط إعادة التعيين في صندوق الوارد خلال دقيقة.
                  </p>
                  <p className="text-gray-400 text-xs mt-2">تحقق من مجلد البريد غير المرغوب إذا لم يصلك</p>
                </div>
                <Button
                  onClick={() => setLocation("/login")}
                  className="w-full text-white rounded-xl"
                  style={{ background: '#1a7c3e' }}
                  data-testid="btn-back-to-login"
                >
                  العودة لتسجيل الدخول
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    البريد الإلكتروني
                  </label>
                  <Input
                    type="email"
                    placeholder="example@email.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    className="w-full rounded-xl text-left"
                    dir="ltr"
                    data-testid="input-email"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isLoading || !email.trim()}
                  className="w-full text-white rounded-xl py-3 font-bold"
                  style={{ background: '#1a7c3e' }}
                  data-testid="btn-send-reset"
                >
                  {isLoading ? (
                    <><Loader2 className="w-4 h-4 animate-spin ml-2" />جارٍ الإرسال...</>
                  ) : (
                    <><Mail className="w-4 h-4 ml-2" />إرسال رابط الاستعادة</>
                  )}
                </Button>

                <button
                  type="button"
                  onClick={() => setLocation("/login")}
                  className="w-full flex items-center justify-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  data-testid="btn-back-to-login"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  العودة لتسجيل الدخول
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
