import { useState } from "react";
import { useLocation } from "wouter";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Eye, EyeOff, KeyRound, LogIn, MessageCircle, Shield, User, X, Building2, GraduationCap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { setAdminAccessToken } from "@/lib/adminSession";
import { getDeviceId } from "@/lib/device";

const NAVY = "#171723";
const SIGNAL = "#FF8A70";
const demoAccounts = [
  { label: "أدمن", identifier: "admin-demo", password: "AdminDemo@2026", icon: Shield },
  { label: "طالب", identifier: "student-demo", password: "StudentDemo@2026", icon: GraduationCap },
  { label: "مؤسسة", identifier: "institution-demo", password: "InstitutionDemo@2026", icon: Building2 },
] as const;

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
  onSwitchToSignup: () => void;
}

export function LoginModal({ open, onClose, onSwitchToSignup }: LoginModalProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginMode, setLoginMode] = useState<"password" | "whatsapp">("password");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  function reset() {
    setIdentifier("");
    setPassword("");
    setShowPassword(false);
    setIsLoading(false);
    setLoginMode("password");
    setOtp("");
    setOtpSent(false);
  }

  function close() {
    reset();
    onClose();
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsLoading(true);

    try {
      if (loginMode === "whatsapp") {
        const response = await fetch(otpSent ? "/api/auth/phone-otp/verify" : "/api/auth/phone-otp/request", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ phone: identifier.trim(), otp: otp.trim(), purpose: "login", deviceId: getDeviceId() }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "تعذر التحقق من رقم الجوال");
        if (!otpSent) {
          setOtpSent(true);
          toast({ title: "تم إرسال الرمز", description: "أدخل الرمز الذي وصلك عبر واتساب." });
          return;
        }

        localStorage.setItem("user", JSON.stringify(result));
        window.dispatchEvent(new CustomEvent("userLoggedIn", { detail: result }));
        toast({ title: "أهلًا بعودتك", description: "تم تسجيل الدخول برقم واتساب." });
        close();
        setLocation(result.role === "institution_admin" ? "/institution" : "/");
        return;
      }

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ identifier: identifier.trim(), password, deviceId: getDeviceId() }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "بيانات الدخول غير صحيحة");
      }

      if (result.require2FA) {
        close();
        toast({ title: "يتطلب تحققًا إضافيًا", description: "سنفتح لك صفحة التحقق لإكمال الدخول." });
        setLocation("/login");
        return;
      }

      if (result.isAdmin) {
        setAdminAccessToken(result.adminAccessToken);
        const sessionResponse = await fetch('/api/admin/session', {
          credentials: 'include',
          cache: 'no-store',
        });
        const session = await sessionResponse.json().catch(() => null);

        if (!sessionResponse.ok || !session?.authenticated) {
          throw new Error("تعذر حفظ جلسة الإدارة. حدّث المعاينة ثم أعد المحاولة.");
        }

        close();
        window.location.replace("/admin/dashboard");
        return;
      }

      localStorage.setItem("user", JSON.stringify(result));
      window.dispatchEvent(new CustomEvent("userLoggedIn", { detail: result }));
      toast({
        title: "أهلًا بعودتك",
        description: result.role === "institution_admin" ? "سيتم فتح بوابة المؤسسة." : "سيتم فتح لوحة تقدمك.",
      });
      close();
      setLocation(result.role === "institution_admin" ? "/institution" : "/");
    } catch (error: any) {
      toast({
        title: "تعذر تسجيل الدخول",
        description: error.message || "تحقق من البيانات وحاول مرة أخرى.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(value) => { if (!value) close(); }}>
      <DialogContent
        className="overflow-hidden border-0 bg-[#FFFCF7] p-0 shadow-[0_25px_90px_rgba(23,23,35,.22)]"
        style={{ maxWidth: 470, borderRadius: 24, direction: "rtl" }}
      >
        <div className="border-b border-[#24202D]/10 px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/qodratak-logo-transparent.png" alt="قدراتك" className="h-11 w-11 object-contain" />
              <div>
                <p className="text-sm font-black" style={{ color: NAVY }}>قدراتك</p>
              </div>
            </div>
            <button type="button" onClick={close} aria-label="إغلاق" className="rounded-lg p-2 text-[#8B8278] transition hover:bg-[#24202D]/5 hover:text-[#171723]">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="px-6 py-7 sm:px-8">
          <p className="text-xs font-black tracking-[.14em] text-[#8B8278]">دخول سريع</p>
          <h2 className="mt-2 text-2xl font-black" style={{ color: NAVY }}>أهلًا بعودتك.</h2>
          <p className="mt-2 text-sm leading-6 text-[#6B625B]">أدخل بياناتك وسنوجّهك تلقائيًا للمساحة المناسبة لحسابك.</p>

          <div className="mt-5 grid grid-cols-2 gap-2 rounded-xl bg-[#F1EEE8] p-1">
            <button
              type="button"
              onClick={() => { setLoginMode("password"); setOtpSent(false); setOtp(""); }}
              className={`rounded-lg px-3 py-2.5 text-xs font-black transition ${loginMode === "password" ? "bg-white text-[#171723] shadow-sm" : "text-[#7D756D]"}`}
            >
              البريد أو كلمة المرور
            </button>
            <button
              type="button"
              onClick={() => { setLoginMode("whatsapp"); setOtpSent(false); setOtp(""); }}
              className={`flex items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-xs font-black transition ${loginMode === "whatsapp" ? "bg-white text-[#171723] shadow-sm" : "text-[#7D756D]"}`}
            >
              <MessageCircle className="h-3.5 w-3.5" /> رمز واتساب
            </button>
          </div>

          {import.meta.env.DEV && (
            <div className="mt-4 rounded-xl border border-[#24202D]/10 bg-[#F8F6F1] p-3">
              <p className="text-[11px] font-black text-[#6B625B]">حسابات التجربة</p>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {demoAccounts.map((account) => {
                  const Icon = account.icon;
                  return (
                    <button
                      key={account.identifier}
                      type="button"
                      onClick={() => { setIdentifier(account.identifier); setPassword(account.password); }}
                      className="flex items-center justify-center gap-1.5 rounded-lg border border-[#24202D]/12 bg-white px-2 py-2 text-[11px] font-black text-[#171723] transition hover:border-[#FF8A70] hover:bg-[#FFF5F1]"
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {account.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <label className="block space-y-2">
              <span className="text-sm font-black text-[#4F4A58]">{loginMode === "whatsapp" ? "رقم الجوال" : "البريد الإلكتروني أو اسم المستخدم"}</span>
              <div className="relative">
                <User className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8B8278]" />
                <input
                  type="text"
                  required
                  autoComplete={loginMode === "whatsapp" ? "tel" : "username"}
                  value={identifier}
                  onChange={(event) => setIdentifier(event.target.value)}
                  placeholder={loginMode === "whatsapp" ? "05XXXXXXXX" : "example@email.com أو اسم المستخدم"}
                  dir={loginMode === "whatsapp" ? "ltr" : "rtl"}
                  className="w-full rounded-xl border border-[#24202D]/15 bg-[#F8F6F1] py-3.5 pl-4 pr-11 text-sm text-[#171723] outline-none transition placeholder:text-[#A49B91] focus:border-[#171723] focus:bg-white focus:ring-4 focus:ring-[#171723]/10"
                />
              </div>
            </label>

            {loginMode === "password" ? <label className="block space-y-2">
              <span className="text-sm font-black text-[#4F4A58]">كلمة المرور</span>
              <div className="relative">
                <KeyRound className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8B8278]" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="أدخل كلمة المرور"
                  className="w-full rounded-xl border border-[#24202D]/15 bg-[#F8F6F1] py-3.5 pl-11 pr-11 text-sm text-[#171723] outline-none transition placeholder:text-[#A49B91] focus:border-[#171723] focus:bg-white focus:ring-4 focus:ring-[#171723]/10"
                />
                <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8B8278] hover:text-[#171723]">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </label> : otpSent ? (
              <label className="block space-y-2">
                <span className="text-sm font-black text-[#4F4A58]">رمز التحقق</span>
                <div className="relative">
                  <KeyRound className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8B8278]" />
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    autoComplete="one-time-code"
                    value={otp}
                    onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="000000"
                    dir="ltr"
                    className="w-full rounded-xl border border-[#24202D]/15 bg-[#F8F6F1] py-3.5 pl-4 pr-11 text-center text-sm tracking-[.35em] text-[#171723] outline-none transition focus:border-[#171723] focus:bg-white focus:ring-4 focus:ring-[#171723]/10"
                  />
                </div>
                <button type="button" onClick={() => { setOtpSent(false); setOtp(""); }} className="text-xs font-bold text-[#6B625B] hover:text-[#171723]">تغيير الرقم أو إعادة الإرسال</button>
              </label>
            ) : null}

            <button type="submit" disabled={isLoading} className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-black text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60" style={{ background: NAVY }}>
              {isLoading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <LogIn className="h-4 w-4" />}
              {isLoading ? "جارٍ التنفيذ..." : loginMode === "whatsapp" ? (otpSent ? "تأكيد وتسجيل الدخول" : "إرسال رمز واتساب") : "تسجيل الدخول"}
            </button>
          </form>

          <div className="mt-5 flex items-start gap-2 rounded-xl border border-[#91D7C5]/50 bg-[#EFF8F4] px-3.5 py-3 text-xs leading-5 text-[#4F665E]">
            <Shield className="mt-0.5 h-4 w-4 shrink-0 text-[#398B79]" />
            <span>الدخول من هنا يوجّه كل حساب تلقائيًا إلى مساحته المناسبة.</span>
          </div>

          <div className="mt-6 border-t border-[#24202D]/10 pt-5 text-center">
            <p className="text-sm text-[#6B625B]">ليس لديك حساب؟{" "}
              <button type="button" onClick={() => { close(); onSwitchToSignup(); }} className="font-black" style={{ color: NAVY }}>أنشئ حسابك من هنا</button>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}