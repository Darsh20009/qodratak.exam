import { useState } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import {
  X, User, Mail, Lock, Eye, EyeOff, ArrowLeft,
  CheckCircle2, GraduationCap, ChevronLeft, Loader2, Shield,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const NAVY = "#0D1B2A";
const SIGNAL = "#F7F775";

interface SignupModalProps {
  open: boolean;
  onClose: () => void;
}

export function SignupModal({ open, onClose }: SignupModalProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [step, setStep] = useState<1 | 2>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // OTP
  const [emailOtp, setEmailOtp] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  // Academic (optional)
  const [academicTrack, setAcademicTrack] = useState<"" | "علمي" | "أدبي">("");
  const [studyGoal, setStudyGoal] = useState<"" | "qudrat" | "tahsili" | "both">("");

  function resetModal() {
    setStep(1); setFullName(""); setEmail(""); setWhatsapp("");
    setPassword(""); setConfirmPassword(""); setEmailOtp("");
    setEmailVerified(false); setEmailOtpSent(false);
    setAcademicTrack(""); setStudyGoal("");
  }

  function handleClose() { resetModal(); onClose(); }

  function validate() {
    if (!fullName.trim()) { toast({ title: "مطلوب", description: "أدخل اسمك الكامل", variant: "destructive" }); return false; }
    if (!email.trim() || !email.includes("@")) { toast({ title: "خطأ", description: "أدخل بريداً إلكترونياً صالحاً", variant: "destructive" }); return false; }
    if (!whatsapp.trim() || whatsapp.length < 9) { toast({ title: "مطلوب", description: "أدخل رقم واتساب صالحاً", variant: "destructive" }); return false; }
    if (!password || password.length < 6) { toast({ title: "خطأ", description: "كلمة المرور 6 أحرف على الأقل", variant: "destructive" }); return false; }
    if (password !== confirmPassword) { toast({ title: "خطأ", description: "كلمتا المرور غير متطابقتين", variant: "destructive" }); return false; }
    return true;
  }

  async function sendOtp() {
    if (!email.trim() || !email.includes("@")) {
      toast({ title: "خطأ", description: "أدخل بريداً صالحاً أولاً", variant: "destructive" }); return;
    }
    setIsSendingOtp(true);
    try {
      const res = await fetch("/api/auth/signup/send-otp", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), fullName: fullName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل إرسال الرمز");
      setEmailOtpSent(true);
      toast({ title: "تم الإرسال ✅", description: "تحقق من بريدك الإلكتروني" });
    } catch (err: any) {
      toast({ title: "خطأ", description: err.message, variant: "destructive" });
    } finally { setIsSendingOtp(false); }
  }

  async function verifyOtp() {
    if (!emailOtp.trim()) { toast({ title: "خطأ", description: "أدخل رمز التحقق", variant: "destructive" }); return; }
    setIsVerifyingOtp(true);
    try {
      const res = await fetch("/api/auth/signup/verify-otp", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), otp: emailOtp.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "رمز خاطئ");
      setEmailVerified(true);
      toast({ title: "✅ تم التحقق", description: "البريد مؤكد" });
    } catch (err: any) {
      toast({ title: "خطأ", description: err.message, variant: "destructive" });
    } finally { setIsVerifyingOtp(false); }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (step === 1) { if (!validate()) return; setStep(2); return; }
    if (!emailVerified) { toast({ title: "مطلوب", description: "تحقق من بريدك أولاً", variant: "destructive" }); return; }
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/register-multi", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim().toLowerCase(),
          phone: `+966${whatsapp.trim().replace(/^0/, "")}`,
          whatsapp: `+966${whatsapp.trim().replace(/^0/, "")}`,
          password,
          role: "student",
          academicTrack: academicTrack || undefined,
          studyGoal: studyGoal || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "حدث خطأ في التسجيل");
      localStorage.setItem("user", JSON.stringify(data));
      window.dispatchEvent(new CustomEvent("userLoggedIn", { detail: data }));
      toast({ title: "🎉 مرحباً بك في قدراتك!", description: "تم إنشاء حسابك بنجاح" });
      handleClose();
      setLocation("/");
    } catch (err: any) {
      toast({ title: "خطأ", description: err.message, variant: "destructive" });
    } finally { setIsLoading(false); }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent
        className="overflow-hidden border-0 p-0 shadow-2xl"
        style={{ maxWidth: 860, borderRadius: 24, direction: "rtl" }}
      >
        <div className="flex min-h-[580px]">
          {/* ── Left: dark branding panel ── */}
          <div
            className="hidden w-[42%] flex-col justify-between overflow-hidden p-9 lg:flex"
            style={{ background: NAVY, position: "relative" }}
          >
            {/* grid overlay */}
            <div
              className="pointer-events-none absolute inset-0 opacity-25"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(247,247,117,.1) 1px,transparent 1px),linear-gradient(90deg,rgba(247,247,117,.1) 1px,transparent 1px)",
                backgroundSize: "38px 38px",
                maskImage: "linear-gradient(to bottom,black,transparent)",
              }}
            />

            {/* Student avatars stacked */}
            <div className="relative z-10">
              <div className="mb-8 flex items-center gap-2.5">
                <div className="h-9 w-9 overflow-hidden rounded-xl bg-white">
                  <img src="/qodratak-logo.png" alt="" className="h-full w-full object-cover object-top" />
                </div>
                <div>
                  <div className="text-sm font-black text-white">قدراتك</div>
                  <div className="text-[9px] font-bold tracking-[0.18em] text-white/45">QIROX STUDIO</div>
                </div>
              </div>

              <h2 className="text-3xl font-black leading-tight text-white">
                ابدأ رحلتك.<br />
                <span style={{ color: SIGNAL }}>الطريق أوضح مما تتوقع.</span>
              </h2>
              <p className="mt-4 text-sm leading-7 text-white/60">
                أنشئ حسابك مرة واحدة وستجد كل شيء مرتبًا في مكانه.
              </p>

              {/* stacked student faces */}
              <div className="mt-8 flex items-center gap-3">
                <div className="flex -space-x-2 space-x-reverse rtl:space-x-reverse">
                  {[
                    "/students/student-f1.png",
                    "/students/student-m1.jpg",
                    "/students/student-f2.jpg",
                    "/students/student-m2.jpg",
                  ].map((src, i) => (
                    <div
                      key={i}
                      className="h-8 w-8 overflow-hidden rounded-full border-2 border-[#0D1B2A] bg-slate-700"
                    >
                      <img src={src} alt="" className="h-full w-full object-cover object-top" />
                    </div>
                  ))}
                </div>
                <p className="text-xs font-bold text-white/55">+٢١٠٠ طالب يستعدون الآن</p>
              </div>
            </div>

            {/* bottom privacy note */}
            <div className="relative z-10 flex items-center gap-3 rounded-2xl border border-white/12 bg-white/5 p-4">
              <Shield className="h-5 w-5 shrink-0 text-[#F7F775]" />
              <div>
                <div className="text-xs font-black text-white">خصوصيتك محمية</div>
                <div className="text-[11px] text-white/50">نستخدم واتساب للتأكيد فقط، لا للإعلانات.</div>
              </div>
            </div>
          </div>

          {/* ── Right: form panel ── */}
          <div className="flex flex-1 flex-col">
            {/* top bar */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                {step === 2 && (
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-slate-700"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" /> رجوع
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                aria-label="إغلاق"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* step indicator */}
            <div className="border-b border-slate-100 px-6 py-3">
              <div className="flex gap-2">
                {["بياناتك", "تأكيد البريد"].map((label, i) => (
                  <div
                    key={label}
                    className={`flex-1 rounded-lg py-2 text-center text-[11px] font-black transition-all ${
                      i === step - 1
                        ? "bg-[#0D1B2A] text-white"
                        : i < step - 1
                        ? "bg-[#F7F775]/30 text-[#0D1B2A]"
                        : "border border-slate-200 text-slate-400"
                    }`}
                  >
                    <span className="ml-1 opacity-60">0{i + 1}</span>{label}
                  </div>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-6">
              {step === 1 && (
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-black tracking-[.13em] text-slate-400">إنشاء حساب طالب</p>
                    <h3 className="mt-1 text-xl font-black text-[#0D1B2A]">خطتك تبدأ من هنا.</h3>
                  </div>

                  {/* Full name */}
                  <div className="space-y-1.5">
                    <Label className="text-sm font-semibold text-slate-700">الاسم الكامل</Label>
                    <div className="relative">
                      <Input
                        type="text" placeholder="أدخل اسمك الكامل"
                        value={fullName} onChange={e => setFullName(e.target.value)}
                        className="h-11 rounded-xl border-slate-200 pr-10"
                      />
                      <User className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5">
                    <Label className="text-sm font-semibold text-slate-700">البريد الإلكتروني</Label>
                    <div className="relative">
                      <Input
                        type="email" placeholder="example@email.com"
                        value={email} onChange={e => setEmail(e.target.value)}
                        dir="ltr" className="h-11 rounded-xl border-slate-200 pl-10 text-left"
                      />
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* WhatsApp */}
                  <div className="space-y-1.5">
                    <Label className="text-sm font-semibold text-slate-700">
                      رقم الواتساب <span className="text-red-500">*</span>
                    </Label>
                    <div
                      className="flex h-11 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 focus-within:border-[#0D1B2A] focus-within:ring-4 focus-within:ring-[#0D1B2A]/8"
                      dir="ltr"
                    >
                      <div className="flex shrink-0 items-center border-r border-slate-200 bg-slate-100 px-3 text-sm font-semibold text-slate-600">
                        +966
                      </div>
                      <input
                        type="tel" placeholder="5XXXXXXXX" required
                        value={whatsapp}
                        onChange={e => setWhatsapp(e.target.value.replace(/^0/, ""))}
                        dir="ltr"
                        className="flex-1 bg-transparent px-3 text-sm text-[#0D1B2A] outline-none"
                      />
                    </div>
                    <p className="text-[11px] text-slate-400">للتأكيد والتنبيهات المهمة فقط.</p>
                  </div>

                  {/* Password */}
                  <div className="space-y-1.5">
                    <Label className="text-sm font-semibold text-slate-700">كلمة المرور</Label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"} placeholder="6 أحرف على الأقل"
                        value={password} onChange={e => setPassword(e.target.value)}
                        autoComplete="new-password"
                        className="h-11 rounded-xl border-slate-200 pr-10 pl-10"
                      />
                      <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                      <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm password */}
                  <div className="space-y-1.5">
                    <Label className="text-sm font-semibold text-slate-700">تأكيد كلمة المرور</Label>
                    <div className="relative">
                      <Input
                        type={showConfirm ? "text" : "password"} placeholder="أعد إدخال كلمة المرور"
                        value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                        autoComplete="new-password"
                        className="h-11 rounded-xl border-slate-200 pr-10 pl-10"
                      />
                      <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                      <button type="button" onClick={() => setShowConfirm(v => !v)} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                        {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Academic optional */}
                  <details className="group rounded-xl border border-slate-200 bg-slate-50">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-black text-[#0D1B2A]">
                      <span className="flex items-center gap-2">
                        <GraduationCap className="h-4 w-4" /> خصص خطتك
                        <span className="font-normal text-slate-400">(اختياري)</span>
                      </span>
                      <ChevronLeft className="h-4 w-4 text-slate-400 transition group-open:-rotate-90" />
                    </summary>
                    <div className="border-t border-slate-200 p-4 space-y-3">
                      <div>
                        <p className="mb-2 text-xs font-black text-slate-500">التخصص</p>
                        <div className="grid grid-cols-2 gap-2">
                          {(["علمي", "أدبي"] as const).map(v => (
                            <button key={v} type="button"
                              onClick={() => setAcademicTrack(academicTrack === v ? "" : v)}
                              className={`rounded-xl border py-2.5 text-sm font-bold transition ${
                                academicTrack === v
                                  ? "border-[#0D1B2A] bg-[#0D1B2A] text-white"
                                  : "border-slate-200 text-slate-600 hover:border-[#0D1B2A]/40"
                              }`}
                            >{v}</button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="mb-2 text-xs font-black text-slate-500">هدفك</p>
                        <div className="space-y-2">
                          {([
                            ["qudrat", "القدرات"],
                            ["tahsili", "التحصيلي"],
                            ["both", "القدرات والتحصيلي معاً"],
                          ] as [typeof studyGoal, string][]).map(([v, lbl]) => (
                            <button key={v as string} type="button"
                              onClick={() => setStudyGoal(studyGoal === v ? "" : v)}
                              className={`w-full rounded-xl border py-2.5 text-right px-3 text-sm font-bold transition ${
                                studyGoal === v
                                  ? "border-[#0D1B2A] bg-[#0D1B2A] text-white"
                                  : "border-slate-200 text-slate-600 hover:border-[#0D1B2A]/40"
                              }`}
                            >{lbl}</button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </details>

                  <button
                    type="submit"
                    className="w-full rounded-xl py-3.5 text-sm font-black transition hover:-translate-y-0.5"
                    style={{ background: SIGNAL, color: NAVY }}
                  >
                    التالي — تأكيد البريد
                  </button>

                  <p className="text-center text-xs text-slate-400">
                    لديك حساب؟{" "}
                    <a href="/login" className="font-black text-[#0D1B2A] hover:underline" onClick={handleClose}>
                      سجّل الدخول
                    </a>
                  </p>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-5">
                  <div>
                    <p className="text-xs font-black tracking-[.13em] text-slate-400">الخطوة الأخيرة</p>
                    <h3 className="mt-1 text-xl font-black text-[#0D1B2A]">أكّد بريدك الإلكتروني.</h3>
                    <p className="mt-1.5 text-sm text-slate-500">
                      سنرسل رمز مؤقتاً إلى <span className="font-bold text-[#0D1B2A]">{email}</span>
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        type="text" placeholder="أدخل رمز التحقق"
                        value={emailOtp} onChange={e => setEmailOtp(e.target.value)}
                        maxLength={6} dir="ltr"
                        disabled={emailVerified}
                        className="h-11 flex-1 rounded-xl border-slate-200 text-center tracking-widest"
                      />
                      <button
                        type="button"
                        onClick={emailVerified ? undefined : emailOtpSent ? sendOtp : sendOtp}
                        disabled={isSendingOtp || emailVerified}
                        className={`h-11 shrink-0 rounded-xl px-4 text-xs font-black transition ${
                          emailVerified
                            ? "bg-emerald-100 text-emerald-600"
                            : "border border-slate-200 text-slate-600 hover:border-[#0D1B2A] hover:text-[#0D1B2A]"
                        }`}
                      >
                        {isSendingOtp ? <Loader2 className="h-4 w-4 animate-spin" /> : emailVerified ? "✓ مؤكد" : emailOtpSent ? "إعادة" : "إرسال رمز"}
                      </button>
                    </div>

                    {emailOtpSent && !emailVerified && (
                      <button
                        type="button" onClick={verifyOtp}
                        disabled={isVerifyingOtp || !emailOtp.trim()}
                        className="w-full rounded-xl border border-[#0D1B2A] py-2.5 text-sm font-black text-[#0D1B2A] hover:bg-[#0D1B2A] hover:text-white transition"
                      >
                        {isVerifyingOtp ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : "تحقق من الرمز"}
                      </button>
                    )}

                    {emailVerified && (
                      <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2.5 text-sm font-bold text-emerald-700">
                        <CheckCircle2 className="h-4 w-4" /> تم التحقق من البريد الإلكتروني
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || !emailVerified}
                    className="w-full rounded-xl py-3.5 text-sm font-black transition hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ background: emailVerified ? SIGNAL : "#E5E7EB", color: emailVerified ? NAVY : "#94A3B8" }}
                  >
                    {isLoading ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : "إنشاء الحساب ✨"}
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
