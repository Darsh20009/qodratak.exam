import { useState } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import {
  X, User, Mail, Lock, Eye, EyeOff, ArrowLeft,
  CheckCircle2, GraduationCap, ChevronLeft, Loader2,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const NAVY = "#171723";
const SIGNAL = "#FF8A70";

interface SignupModalProps {
  open: boolean;
  onClose: () => void;
  onSwitchToLogin?: () => void;
}

export function SignupModal({ open, onClose, onSwitchToLogin }: SignupModalProps) {
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
  const [phoneVerificationToken, setPhoneVerificationToken] = useState("");

  // Academic (optional)
  const [academicTrack, setAcademicTrack] = useState<"" | "علمي" | "أدبي">("");
  const [studyGoal, setStudyGoal] = useState<"" | "qudrat" | "tahsili" | "both">("");

  function resetModal() {
    setStep(1); setFullName(""); setEmail(""); setWhatsapp("");
    setPassword(""); setConfirmPassword(""); setEmailOtp("");
    setEmailVerified(false); setEmailOtpSent(false);
    setPhoneVerificationToken("");
    setAcademicTrack(""); setStudyGoal("");
  }

  function handleClose() { resetModal(); onClose(); }

  function validate() {
    if (fullName.trim().split(/\s+/).length < 2) { toast({ title: "مطلوب", description: "أدخل الاسم الثنائي على الأقل", variant: "destructive" }); return false; }
    if (!email.trim() || !email.includes("@")) { toast({ title: "خطأ", description: "أدخل بريداً إلكترونياً صالحاً", variant: "destructive" }); return false; }
    if (!whatsapp.trim() || whatsapp.length < 9) { toast({ title: "مطلوب", description: "أدخل رقم واتساب صالحاً", variant: "destructive" }); return false; }
    if (!password || password.length < 6) { toast({ title: "خطأ", description: "كلمة المرور 6 أحرف على الأقل", variant: "destructive" }); return false; }
    if (password !== confirmPassword) { toast({ title: "خطأ", description: "كلمتا المرور غير متطابقتين", variant: "destructive" }); return false; }
    return true;
  }

  async function sendOtp() {
    if (!whatsapp.trim() || whatsapp.length < 9) {
      toast({ title: "خطأ", description: "أدخل رقم واتساب صالحاً أولاً", variant: "destructive" }); return;
    }
    setIsSendingOtp(true);
    try {
      const res = await fetch("/api/auth/phone-otp/request", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: `+966${whatsapp.trim().replace(/^0/, "")}`, purpose: "signup" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل إرسال الرمز");
      setEmailOtpSent(true);
      toast({ title: "تم الإرسال", description: "تحقق من رسائل واتساب" });
    } catch (err: any) {
      toast({ title: "خطأ", description: err.message, variant: "destructive" });
    } finally { setIsSendingOtp(false); }
  }

  async function verifyOtp() {
    if (!emailOtp.trim()) { toast({ title: "خطأ", description: "أدخل رمز التحقق", variant: "destructive" }); return; }
    setIsVerifyingOtp(true);
    try {
      const res = await fetch("/api/auth/phone-otp/verify", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: `+966${whatsapp.trim().replace(/^0/, "")}`, otp: emailOtp.trim(), purpose: "signup" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "رمز خاطئ");
      setEmailVerified(true);
      setPhoneVerificationToken(data.verificationToken);
      toast({ title: "تم التحقق", description: "رقم واتساب مؤكد" });
    } catch (err: any) {
      toast({ title: "خطأ", description: err.message, variant: "destructive" });
    } finally { setIsVerifyingOtp(false); }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (step === 1) { if (!validate()) return; setStep(2); return; }
    if (!emailVerified || !phoneVerificationToken) { toast({ title: "مطلوب", description: "تحقق من رقم واتساب أولاً", variant: "destructive" }); return; }
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
          phoneVerificationToken,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "حدث خطأ في التسجيل");
      localStorage.setItem("user", JSON.stringify(data));
      window.dispatchEvent(new CustomEvent("userLoggedIn", { detail: data }));
      toast({ title: "مرحبًا بك في قدراتك", description: "تم إنشاء حسابك بنجاح" });
      handleClose();
      setLocation("/");
    } catch (err: any) {
      toast({ title: "خطأ", description: err.message, variant: "destructive" });
    } finally { setIsLoading(false); }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent
        className="max-h-[calc(100vh-24px)] overflow-hidden border-0 bg-[#FFFCF7] p-0 shadow-[0_25px_90px_rgba(23,23,35,.22)]"
        style={{ maxWidth: 470, borderRadius: 24, direction: "rtl" }}
      >
        <div className="flex max-h-[calc(100vh-24px)] flex-col">
          <div className="border-b border-[#24202D]/10 px-6 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src="/qodratak-logo-transparent.png" alt="قدراتك" className="h-11 w-11 object-contain" />
                <div>
                  <p className="text-sm font-black text-[#171723]">قدراتك</p>
                  <p className="mt-0.5 text-xs font-bold text-[#8B8278]">إنشاء حساب جديد</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {step === 2 && (
                  <button type="button" onClick={() => setStep(1)} className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-bold text-[#8B8278] transition hover:bg-[#24202D]/5 hover:text-[#171723]">
                    <ArrowLeft className="h-3.5 w-3.5" /> رجوع
                  </button>
                )}
                <button type="button" onClick={handleClose} className="rounded-lg p-2 text-[#8B8278] transition hover:bg-[#24202D]/5 hover:text-[#171723]" aria-label="إغلاق">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="border-b border-[#24202D]/10 px-6 py-3">
            <div className="flex gap-2">
              {["بياناتك", "تأكيد واتساب"].map((label, i) => (
                <div key={label} className={`flex-1 rounded-lg py-2 text-center text-[11px] font-black ${
                  i === step - 1 ? "bg-[#171723] text-white" : i < step - 1 ? "bg-[#91D7C5]/35 text-[#171723]" : "border border-[#24202D]/12 text-[#8B8278]"
                }`}>
                  <span className="ml-1 opacity-60">0{i + 1}</span>{label}
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="min-h-0 overflow-y-auto px-6 py-6 sm:px-8">
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-black text-[#8B8278]">حساب طالب</p>
                  <h3 className="mt-1 text-2xl font-black text-[#171723]">خطتك تبدأ من هنا.</h3>
                  <p className="mt-2 text-sm leading-6 text-[#6B625B]">أدخل بياناتك لنرتب لك بداية أوضح.</p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm font-black text-[#4F4A58]">الاسم الكامل</Label>
                  <div className="relative">
                    <Input type="text" placeholder="أدخل اسمك الكامل" value={fullName} onChange={e => setFullName(e.target.value)} autoComplete="name" className="h-11 rounded-xl border-[#24202D]/15 bg-[#F8F6F1] pr-10 focus:border-[#171723] focus:ring-[#171723]/10" />
                    <User className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8B8278]" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm font-black text-[#4F4A58]">البريد الإلكتروني</Label>
                  <div className="relative">
                    <Input type="email" placeholder="example@email.com" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" dir="ltr" className="h-11 rounded-xl border-[#24202D]/15 bg-[#F8F6F1] pl-10 text-left focus:border-[#171723] focus:ring-[#171723]/10" />
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8B8278]" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm font-black text-[#4F4A58]">رقم الواتساب <span className="text-[#D35C4A]">*</span></Label>
                  <div className="flex h-11 overflow-hidden rounded-xl border border-[#24202D]/15 bg-[#F8F6F1] focus-within:border-[#171723] focus-within:ring-4 focus-within:ring-[#171723]/10" dir="ltr">
                    <div className="flex shrink-0 items-center border-r border-[#24202D]/10 bg-[#EEEAE2] px-3 text-sm font-bold text-[#6B625B]">+966</div>
                    <input type="tel" placeholder="5XXXXXXXX" required value={whatsapp} onChange={e => setWhatsapp(e.target.value.replace(/^0/, ""))} autoComplete="tel" dir="ltr" className="min-w-0 flex-1 bg-transparent px-3 text-sm text-[#171723] outline-none" />
                  </div>
                  <p className="text-[11px] text-[#8B8278]">للتأكيد والتنبيهات المهمة فقط.</p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    ["كلمة المرور", password, setPassword, showPassword, setShowPassword, "6 أحرف على الأقل"],
                    ["تأكيد كلمة المرور", confirmPassword, setConfirmPassword, showConfirm, setShowConfirm, "أعد إدخال كلمة المرور"],
                  ].map(([label, value, setter, visible, setVisible, placeholder]) => (
                    <div key={label as string} className="space-y-1.5">
                      <Label className="text-sm font-black text-[#4F4A58]">{label as string}</Label>
                      <div className="relative">
                        <Input type={visible ? "text" : "password"} placeholder={placeholder as string} value={value as string} onChange={e => (setter as (value: string) => void)(e.target.value)} autoComplete="new-password" className="h-11 rounded-xl border-[#24202D]/15 bg-[#F8F6F1] px-9 text-sm focus:border-[#171723] focus:ring-[#171723]/10" />
                        <Lock className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8B8278]" />
                        <button type="button" onClick={() => (setVisible as (value: boolean) => void)(!(visible as boolean))} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8B8278]">
                          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <details className="group rounded-xl border border-[#24202D]/12 bg-[#F8F6F1]">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-black text-[#171723]">
                    <span className="flex items-center gap-2"><GraduationCap className="h-4 w-4" /> خصص خطتك <span className="font-normal text-[#8B8278]">(اختياري)</span></span>
                    <ChevronLeft className="h-4 w-4 text-[#8B8278] transition group-open:-rotate-90" />
                  </summary>
                  <div className="space-y-3 border-t border-[#24202D]/10 p-4">
                    <div>
                      <p className="mb-2 text-xs font-black text-[#6B625B]">التخصص</p>
                      <div className="grid grid-cols-2 gap-2">
                        {(["علمي", "أدبي"] as const).map(v => <button key={v} type="button" onClick={() => setAcademicTrack(academicTrack === v ? "" : v)} className={`rounded-xl border py-2.5 text-sm font-bold ${academicTrack === v ? "border-[#171723] bg-[#171723] text-white" : "border-[#24202D]/12 text-[#6B625B]"}`}>{v}</button>)}
                      </div>
                    </div>
                    <div>
                      <p className="mb-2 text-xs font-black text-[#6B625B]">هدفك</p>
                      <div className="space-y-2">
                        {([["qudrat", "القدرات"], ["tahsili", "التحصيلي"], ["both", "القدرات والتحصيلي معًا"]] as [typeof studyGoal, string][]).map(([v, lbl]) => <button key={v as string} type="button" onClick={() => setStudyGoal(studyGoal === v ? "" : v)} className={`w-full rounded-xl border px-3 py-2.5 text-right text-sm font-bold ${studyGoal === v ? "border-[#171723] bg-[#171723] text-white" : "border-[#24202D]/12 text-[#6B625B]"}`}>{lbl}</button>)}
                      </div>
                    </div>
                  </div>
                </details>

                <button type="submit" className="w-full rounded-xl py-3.5 text-sm font-black transition hover:-translate-y-0.5" style={{ background: SIGNAL, color: NAVY }}>التالي: تأكيد واتساب</button>
                <p className="text-center text-xs text-[#8B8278]">لديك حساب؟{" "}
                  <button type="button" onClick={() => { handleClose(); onSwitchToLogin?.(); }} className="font-black text-[#171723] hover:underline">سجّل الدخول</button>
                </p>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5">
                <div>
                  <p className="text-xs font-black text-[#8B8278]">الخطوة الأخيرة</p>
                  <h3 className="mt-1 text-2xl font-black text-[#171723]">أكّد رقم واتساب.</h3>
                  <p className="mt-2 text-sm leading-6 text-[#6B625B]">سنرسل رمزًا مؤقتًا إلى <span className="font-bold text-[#171723]" dir="ltr">+966{whatsapp.replace(/^0/, "")}</span></p>
                </div>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input type="text" placeholder="أدخل رمز التحقق" value={emailOtp} onChange={e => setEmailOtp(e.target.value)} maxLength={6} dir="ltr" disabled={emailVerified} className="h-11 min-w-0 flex-1 rounded-xl border-[#24202D]/15 bg-[#F8F6F1] text-center tracking-widest" />
                    <button type="button" onClick={sendOtp} disabled={isSendingOtp || emailVerified} className={`h-11 shrink-0 rounded-xl px-4 text-xs font-black ${emailVerified ? "bg-[#91D7C5]/30 text-[#398B79]" : "border border-[#24202D]/15 text-[#6B625B]"}`}>
                      {isSendingOtp ? <Loader2 className="h-4 w-4 animate-spin" /> : emailVerified ? "مؤكد" : emailOtpSent ? "إعادة" : "إرسال رمز"}
                    </button>
                  </div>
                  {emailOtpSent && !emailVerified && <button type="button" onClick={verifyOtp} disabled={isVerifyingOtp || !emailOtp.trim()} className="w-full rounded-xl border border-[#171723] py-2.5 text-sm font-black text-[#171723] transition hover:bg-[#171723] hover:text-white">{isVerifyingOtp ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : "تحقق من الرمز"}</button>}
                  {emailVerified && <div className="flex items-center gap-2 rounded-xl bg-[#EFF8F4] px-4 py-2.5 text-sm font-bold text-[#398B79]"><CheckCircle2 className="h-4 w-4" /> تم التحقق من رقم واتساب</div>}
                </div>
                <button type="submit" disabled={isLoading || !emailVerified} className="w-full rounded-xl py-3.5 text-sm font-black disabled:cursor-not-allowed disabled:opacity-50" style={{ background: emailVerified ? SIGNAL : "#E5E7EB", color: emailVerified ? NAVY : "#94A3B8" }}>{isLoading ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : "إنشاء الحساب"}</button>
              </div>
            )}
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
