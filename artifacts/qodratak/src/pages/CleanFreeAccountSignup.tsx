import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import {
  Mail, Lock, User, CheckCircle, Loader2, Eye, EyeOff,
  Phone, ArrowRight, BookOpen, BarChart2, Award, Zap,
  Shield, ShieldCheck, RefreshCw, ChevronLeft
} from "lucide-react";

const FEATURES = [
  { icon: BookOpen, label: "4,500+ سؤال متنوع", sub: "شامل القدرات والتحصيلي" },
  { icon: BarChart2, label: "تحليلات أداء ذكية", sub: "تتبع تقدمك لحظة بلحظة" },
  { icon: Zap, label: "نتائج فورية", sub: "تغذية راجعة لكل إجابة" },
  { icon: Award, label: "شهادات وبادجات", sub: "إنجازات تحفيزية" },
];

const STATS = [
  { value: "+50K", label: "طالب مسجل" },
  { value: "4.9", label: "تقييم المنصة" },
  { value: "95%", label: "نسبة الرضا" },
  { value: "7", label: "أيام مجاناً" },
];

type Step = "form" | "verify" | "success";

export default function CleanFreeAccountSignup() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [step, setStep] = useState<Step>("form");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [resendTimer, setResendTimer] = useState(0);

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
  });

  const updateField = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }));

  const validateForm = () => {
    if (!form.fullName.trim() || form.fullName.length < 3) {
      toast({ title: "الاسم الكامل مطلوب", description: "يجب أن يكون 3 أحرف على الأقل", variant: "destructive" });
      return false;
    }
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      toast({ title: "بريد إلكتروني غير صحيح", variant: "destructive" });
      return false;
    }
    if (form.phone && !/^05\d{8}$/.test(form.phone.trim())) {
      toast({ title: "رقم الجوال غير صحيح", description: "يجب أن يبدأ بـ 05 ويتكون من 10 أرقام", variant: "destructive" });
      return false;
    }
    if (!form.password.trim() || form.password.length < 6) {
      toast({ title: "كلمة المرور قصيرة", description: "يجب أن تكون 6 أحرف على الأقل", variant: "destructive" });
      return false;
    }
    return true;
  };

  const startResendTimer = () => {
    setResendTimer(60);
    const interval = setInterval(() => {
      setResendTimer(t => { if (t <= 1) { clearInterval(interval); return 0; } return t - 1; });
    }, 1000);
  };

  const handleSendOTP = async () => {
    if (!validateForm()) return;
    setIsLoading(true);
    try {
      const r = await fetch('/api/auth/signup/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, fullName: form.fullName, phone: form.phone }),
      });
      const d = await r.json();
      if (!r.ok) { toast({ title: d.error || "فشل إرسال الرمز", variant: "destructive" }); return; }
      toast({ title: "✅ تم إرسال رمز التحقق", description: `تحقق من بريدك: ${form.email}` });
      setStep("verify");
      setOtpDigits(["", "", "", "", "", ""]);
      startResendTimer();
    } catch {
      toast({ title: "خطأ في الاتصال", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    const otp = otpDigits.join("");
    if (otp.length < 6) { toast({ title: "أدخل الرمز كاملاً (6 أرقام)", variant: "destructive" }); return; }
    setIsLoading(true);
    try {
      const verifyRes = await fetch('/api/auth/signup/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, otp }),
      });
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) { toast({ title: verifyData.error || "رمز خاطئ", variant: "destructive" }); setIsLoading(false); return; }

      const regRes = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName: form.fullName, name: form.fullName, email: form.email, password: form.password, phone: form.phone }),
        credentials: 'include',
      });
      const regData = await regRes.json();
      if (!regRes.ok) { toast({ title: regData.message || "فشل إنشاء الحساب", variant: "destructive" }); setIsLoading(false); return; }

      setStep("success");
      toast({ title: "🎉 مرحباً بك في قدراتك!" });
    } catch {
      toast({ title: "خطأ في الاتصال", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPInput = (i: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const digits = [...otpDigits];
    digits[i] = val.slice(-1);
    setOtpDigits(digits);
    if (val && i < 5) otpRefs.current[i + 1]?.focus();
  };

  const handleOTPKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpDigits[i] && i > 0) otpRefs.current[i - 1]?.focus();
  };

  const handleOTPPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const digits = [...otpDigits];
    text.split('').forEach((c, i) => { digits[i] = c; });
    setOtpDigits(digits);
    otpRefs.current[Math.min(text.length, 5)]?.focus();
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    setIsLoading(true);
    try {
      const r = await fetch('/api/auth/signup/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, fullName: form.fullName, phone: form.phone }),
      });
      const d = await r.json();
      if (r.ok) { toast({ title: "✅ تم إعادة إرسال الرمز" }); startResendTimer(); setOtpDigits(["", "", "", "", "", ""]); }
      else toast({ title: d.error || "فشل الإرسال", variant: "destructive" });
    } catch {
      toast({ title: "خطأ في الاتصال", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-teal-500 flex" dir="rtl">

      {/* Left panel - decorative */}
      <div className="hidden lg:flex flex-col w-[480px] flex-shrink-0 relative overflow-hidden bg-gradient-to-b from-teal-600/40 to-emerald-500/20 border-l border-white/5 p-10">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 30% 20%, #6366f1 0%, transparent 60%), radial-gradient(circle at 80% 80%, #8b5cf6 0%, transparent 50%)' }} />
        <div className="relative z-10 flex flex-col h-full">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center shadow-lg">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-bold text-xl">قدراتك</span>
          </div>

          <div className="mb-10">
            <h2 className="text-3xl font-bold text-white mb-3">ابدأ رحلتك<br />نحو القبول الجامعي</h2>
            <p className="text-slate-300 leading-relaxed">الأداة الأذكى لإعداد اختبار القدرات والتحصيلي في السعودية</p>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-10">
            {STATS.map(s => (
              <div key={s.label} className="bg-white/5 rounded-2xl p-4 border border-white/10">
                <p className="text-2xl font-bold text-white">{s.value}</p>
                <p className="text-slate-400 text-xs mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="space-y-4 flex-1">
            {FEATURES.map(f => (
              <div key={f.label} className="flex items-center gap-4 p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="w-9 h-9 rounded-lg bg-teal-100/30 flex items-center justify-center flex-shrink-0">
                  <f.icon className="w-4 h-4 text-teal-700" />
                </div>
                <div>
                  <p className="text-white text-sm font-medium">{f.label}</p>
                  <p className="text-slate-400 text-xs">{f.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-10">

        {/* Steps indicator */}
        <div className="flex items-center gap-2 mb-8">
          {["بياناتك", "تحقق البريد", "تم"].map((label, i) => {
            const stepIndex = step === 'form' ? 0 : step === 'verify' ? 1 : 2;
            const done = i < stepIndex;
            const active = i === stepIndex;
            return (
              <div key={label} className="flex items-center gap-2">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${active ? 'bg-teal-100 text-white' : done ? 'bg-emerald-600/20 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                  {done ? <CheckCircle className="w-3.5 h-3.5" /> : <span className="w-4 h-4 rounded-full border border-current flex items-center justify-center text-xs">{i + 1}</span>}
                  {label}
                </div>
                {i < 2 && <ChevronLeft className="w-3 h-3 text-slate-600" />}
              </div>
            );
          })}
        </div>

        <div className="w-full max-w-md">

          {/* ── STEP 1: Form ── */}
          {step === "form" && (
            <div className="space-y-5">
              <div>
                <h1 className="text-white font-bold text-2xl md:text-3xl mb-1">أنشئ حسابك مجاناً</h1>
                <p className="text-slate-400 text-sm">7 أيام تجريبية كاملة بدون أي رسوم</p>
              </div>

              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-slate-300 text-sm font-medium">الاسم الكامل</label>
                <div className="relative">
                  <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    data-testid="input-fullname"
                    value={form.fullName}
                    onChange={updateField("fullName")}
                    placeholder="أدخل اسمك الكامل"
                    className="bg-slate-800/60 border-slate-700 text-white placeholder:text-slate-500 pr-10 h-12 focus:border-teal-400 focus:ring-1 focus:ring-teal-500"
                    dir="rtl"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-slate-300 text-sm font-medium">البريد الإلكتروني</label>
                <div className="relative">
                  <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    data-testid="input-email"
                    type="email"
                    value={form.email}
                    onChange={updateField("email")}
                    placeholder="example@email.com"
                    className="bg-slate-800/60 border-slate-700 text-white placeholder:text-slate-500 pr-10 h-12 focus:border-teal-400 focus:ring-1 focus:ring-teal-500"
                    dir="ltr"
                  />
                </div>
              </div>

              {/* Phone (optional) */}
              <div className="space-y-1.5">
                <label className="text-slate-300 text-sm font-medium flex items-center gap-2">
                  رقم الجوال <span className="text-slate-500 text-xs">(اختياري)</span>
                </label>
                <div className="relative">
                  <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    data-testid="input-phone"
                    type="tel"
                    value={form.phone}
                    onChange={updateField("phone")}
                    placeholder="05xxxxxxxx"
                    className="bg-slate-800/60 border-slate-700 text-white placeholder:text-slate-500 pr-10 h-12 focus:border-teal-400 focus:ring-1 focus:ring-teal-500"
                    dir="ltr"
                    maxLength={10}
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-slate-300 text-sm font-medium">كلمة المرور</label>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    data-testid="input-password"
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={updateField("password")}
                    placeholder="6 أحرف على الأقل"
                    className="bg-slate-800/60 border-slate-700 text-white placeholder:text-slate-500 pr-10 h-12 focus:border-teal-400 focus:ring-1 focus:ring-teal-500"
                    dir="ltr"
                  />
                  <button type="button" onClick={() => setShowPassword(p => !p)} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-slate-500 text-xs flex items-center gap-1.5"><Shield className="w-3 h-3" />ستتحقق من بريدك بعد ذلك</p>
              </div>

              <Button
                data-testid="button-send-otp"
                onClick={handleSendOTP}
                disabled={isLoading}
                className="w-full h-12 bg-gradient-to-l from-teal-600 to-emerald-500 hover:from-teal-600 hover:to-emerald-500 text-white font-semibold rounded-xl gap-2 text-base"
              >
                {isLoading ? <><Loader2 className="w-5 h-5 animate-spin" />جارٍ الإرسال...</> : <><ArrowRight className="w-5 h-5" />التالي - تحقق من البريد</>}
              </Button>

              <p className="text-center text-slate-400 text-sm">
                لديك حساب؟{" "}
                <button onClick={() => setLocation("/login")} className="text-teal-700 hover:text-teal-700 font-medium underline">
                  تسجيل الدخول
                </button>
              </p>
            </div>
          )}

          {/* ── STEP 2: Verify OTP ── */}
          {step === "verify" && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-teal-100/20 border border-teal-400/30 flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck className="w-8 h-8 text-teal-700" />
                </div>
                <h2 className="text-white font-bold text-2xl mb-2">تحقق من بريدك</h2>
                <p className="text-slate-400 text-sm">أرسلنا رمز تحقق مكون من 6 أرقام إلى</p>
                <p className="text-teal-700 font-medium mt-1" dir="ltr">{form.email}</p>
              </div>

              {/* OTP Input boxes */}
              <div className="flex gap-2 justify-center" dir="ltr">
                {otpDigits.map((digit, i) => (
                  <input
                    key={i}
                    ref={el => { otpRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleOTPInput(i, e.target.value)}
                    onKeyDown={e => handleOTPKeyDown(i, e)}
                    onPaste={i === 0 ? handleOTPPaste : undefined}
                    data-testid={`input-otp-${i}`}
                    className={`w-12 h-14 text-center text-xl font-bold rounded-xl border-2 bg-slate-800 text-white transition-all outline-none ${digit ? 'border-teal-400 bg-teal-100/20' : 'border-slate-700'} focus:border-teal-400 focus:bg-teal-100/20`}
                  />
                ))}
              </div>

              <Button
                data-testid="button-verify-otp"
                onClick={handleVerifyOTP}
                disabled={isLoading || otpDigits.join("").length < 6}
                className="w-full h-12 bg-gradient-to-l from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-semibold rounded-xl gap-2"
              >
                {isLoading ? <><Loader2 className="w-5 h-5 animate-spin" />جارٍ التحقق...</> : <><CheckCircle className="w-5 h-5" />تأكيد وإنشاء الحساب</>}
              </Button>

              <div className="text-center space-y-2">
                <p className="text-slate-400 text-sm">لم تستلم الرمز؟</p>
                <button
                  onClick={handleResend}
                  disabled={resendTimer > 0 || isLoading}
                  className="text-sm flex items-center gap-1.5 mx-auto text-teal-700 hover:text-teal-700 disabled:text-slate-600 disabled:cursor-not-allowed transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  {resendTimer > 0 ? `إعادة الإرسال بعد ${resendTimer}ث` : 'إعادة إرسال الرمز'}
                </button>
              </div>

              <button onClick={() => setStep("form")} className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 text-sm mx-auto transition-colors">
                <ArrowRight className="w-4 h-4" />
                تعديل البيانات
              </button>
            </div>
          )}

          {/* ── STEP 3: Success ── */}
          {step === "success" && (
            <div className="text-center space-y-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/30">
                  <CheckCircle className="w-12 h-12 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-xl bg-yellow-400 flex items-center justify-center text-lg animate-bounce">🎉</div>
              </div>

              <div>
                <h2 className="text-white font-bold text-3xl mb-2">تم إنشاء حسابك!</h2>
                <p className="text-slate-300">مرحباً {form.fullName.split(' ')[0]}! حسابك جاهز الآن.</p>
                <p className="text-slate-400 text-sm mt-2">لديك 7 أيام تجريبية كاملة للاستمتاع بجميع المميزات</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {FEATURES.map(f => (
                  <div key={f.label} className="bg-slate-800/50 rounded-xl p-3 text-right border border-slate-700/50">
                    <f.icon className="w-5 h-5 text-teal-700 mb-1.5" />
                    <p className="text-white text-xs font-medium">{f.label}</p>
                  </div>
                ))}
              </div>

              <Button
                data-testid="button-go-home"
                onClick={() => setLocation("/")}
                className="w-full h-12 bg-gradient-to-l from-teal-600 to-emerald-500 hover:from-teal-600 hover:to-emerald-500 text-white font-semibold rounded-xl text-base"
              >
                ابدأ الآن 🚀
              </Button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
