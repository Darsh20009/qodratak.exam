import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation, useSearch } from "wouter";
import { SEO } from "@/components/SEO";
import {
  User, GraduationCap, Building2, ArrowRight, Eye, EyeOff,
  CheckCircle2, Mail, Phone, Lock, MapPin, MessageCircle,
  Users, FileText, Loader2, ChevronLeft, Star, BookOpen,
  Award, TrendingUp, Shield, Clock, Sparkles, Crown
} from "lucide-react";
import { cn } from "@/lib/utils";

type AccountType = "student" | "teacher" | "institution";

const accountTypeConfigs = {
  student: {
    id: "student" as AccountType,
    title: "حساب طالب",
    description: "للطلاب المستعدين لاختبار القدرات والتحصيلي",
    icon: User,
    accent: "from-[#0D1B2A] to-[#1E2938]",
    ring: "ring-[#0D1B2A]",
    badge: "bg-[#E5E7EB] text-[#0D1B2A]"
  },
  teacher: {
    id: "teacher" as AccountType,
    title: "حساب مدرس",
    description: "للمعلمين ومدربي القدرات والتحصيلي",
    icon: GraduationCap,
    accent: "from-[#1E2938] to-[#0D1B2A]",
    ring: "ring-[#1E2938]",
    badge: "bg-[#E5E7EB] text-[#0D1B2A]"
  },
  institution: {
    id: "institution" as AccountType,
    title: "حساب مؤسسة",
    description: "للمدارس والمعاهد التعليمية",
    icon: Building2,
    accent: "from-[#0D1B2A] to-[#1E2938]",
    ring: "ring-[#0D1B2A]",
    badge: "bg-[#E5E7EB] text-[#0D1B2A]"
  }
};

const institutionTypes = [
  { value: "school", label: "مدرسة" },
  { value: "institute", label: "معهد تدريبي" },
  { value: "university", label: "جامعة" },
  { value: "training_center", label: "مركز تدريب" }
];

const cities = [
  "الرياض", "جدة", "مكة المكرمة", "المدينة المنورة", "الدمام",
  "الخبر", "الطائف", "تبوك", "بريدة", "القصيم", "أبها",
  "خميس مشيط", "حائل", "جازان", "نجران", "الباحة", "الجوف"
];

const features = [
  "مسار واضح للاستعداد والتقدم",
  "تدريب منظم مع تغذية راجعة",
  "لوحة متابعة شخصية للطالب",
  "مساحة مخصصة للمدارس والمدرسين",
  "بنك أسئلة يُبنى وفق معايير جودة",
  "دعم متاح عند الحاجة",
];

export default function SignupPage() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [isTelegramLoading, setIsTelegramLoading] = useState(false);
  const [telegramStep, setTelegramStep] = useState<'idle' | 'waiting'>('idle');
  const [telegramDeepLink, setTelegramDeepLink] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [requestSubmitted, setRequestSubmitted] = useState(false);
  const [activeType, setActiveType] = useState<AccountType>("student");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [institutionName, setInstitutionName] = useState("");
  const [institutionType, setInstitutionType] = useState("");
  const [city, setCity] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [telegramUsername, setTelegramUsername] = useState("");
  const [studentsCount, setStudentsCount] = useState("");
  const [notes, setNotes] = useState("");

  // Student academic profile
  const [academicTrack, setAcademicTrack] = useState<"" | "علمي" | "أدبي">("");
  const [gradeLevel, setGradeLevel] = useState<"" | "الثاني_ثانوي" | "الثالث_ثانوي" | "بعد_الثانوية">("");
  const [studyGoal, setStudyGoal] = useState<"" | "qudrat" | "tahsili" | "both">("");
  const [targetScore, setTargetScore] = useState<number | "">("");

  // OTP verification step
  const [step, setStep] = useState<1 | 2>(1);
  const [emailOtp, setEmailOtp] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [isSendingEmailOtp, setIsSendingEmailOtp] = useState(false);
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [phoneOtp, setPhoneOtp] = useState("");
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [isSendingPhoneOtp, setIsSendingPhoneOtp] = useState(false);
  const [isVerifyingPhone, setIsVerifyingPhone] = useState(false);
  const [phoneOtpDeepLink, setPhoneOtpDeepLink] = useState("");

  // Telegram new-user profile completion
  const [telegramProfileData, setTelegramProfileData] = useState<null | {
    telegramId: string; telegramUsername: string; fullName: string; photoUrl: string;
  }>(null);
  const [tgEmail, setTgEmail] = useState("");
  const [tgOtp, setTgOtp] = useState("");
  const [tgPassword, setTgPassword] = useState("");
  const [tgShowPassword, setTgShowPassword] = useState(false);
  const [tgOtpSent, setTgOtpSent] = useState(false);
  const [tgOtpVerified, setTgOtpVerified] = useState(false);
  const [isSendingTgOtp, setIsSendingTgOtp] = useState(false);
  const [isVerifyingTgOtp, setIsVerifyingTgOtp] = useState(false);
  const [isCompletingTg, setIsCompletingTg] = useState(false);

  const params = new URLSearchParams(search);
  const typeParam = params.get("type") as AccountType | null;

  useEffect(() => {
    if (typeParam && accountTypeConfigs[typeParam]) {
      setActiveType(typeParam);
    } else {
      setLocation("/signup?type=student");
    }
  }, [typeParam]);

  // Check if redirected from LoginPage with pending Telegram profile
  useEffect(() => {
    const pending = sessionStorage.getItem('pendingTelegramProfile');
    if (pending) {
      try {
        sessionStorage.removeItem('pendingTelegramProfile');
        setTelegramProfileData(JSON.parse(pending));
      } catch {}
    }
  }, []);


  // Telegram profile completion handlers
  const handleSendTgOtp = async () => {
    if (!tgEmail.trim() || !tgEmail.includes('@')) {
      toast({ title: "خطأ", description: "أدخل بريداً إلكترونياً صالحاً", variant: "destructive" });
      return;
    }
    setIsSendingTgOtp(true);
    try {
      const res = await fetch('/api/auth/signup/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: tgEmail.trim().toLowerCase(), fullName: telegramProfileData?.fullName || 'مستخدم' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل إرسال الرمز');
      setTgOtpSent(true);
      toast({ title: "تم الإرسال ✅", description: "تحقق من بريدك الإلكتروني" });
    } catch (err: any) {
      toast({ title: "خطأ", description: err.message, variant: "destructive" });
    } finally {
      setIsSendingTgOtp(false);
    }
  };

  const handleVerifyTgOtp = async () => {
    if (!tgOtp.trim()) {
      toast({ title: "خطأ", description: "أدخل رمز التحقق", variant: "destructive" });
      return;
    }
    setIsVerifyingTgOtp(true);
    try {
      // Use check-otp (validates WITHOUT deleting) so the OTP remains available
      // for the final telegram-complete call which does the actual deletion
      const res = await fetch('/api/auth/signup/check-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: tgEmail.trim().toLowerCase(), otp: tgOtp.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'رمز التحقق خاطئ');
      setTgOtpVerified(true);
      toast({ title: "✅ تم التحقق", description: "تم التحقق من البريد الإلكتروني" });
    } catch (err: any) {
      toast({ title: "خطأ", description: err.message, variant: "destructive" });
    } finally {
      setIsVerifyingTgOtp(false);
    }
  };

  const handleCompleteTelegramProfile = async () => {
    if (!tgOtpVerified) {
      toast({ title: "مطلوب", description: "تحقق من بريدك الإلكتروني أولاً", variant: "destructive" });
      return;
    }
    if (!tgPassword || tgPassword.length < 6) {
      toast({ title: "خطأ", description: "كلمة المرور يجب أن تكون 6 أحرف على الأقل", variant: "destructive" });
      return;
    }
    setIsCompletingTg(true);
    try {
      const res = await fetch('/api/auth/telegram-complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegramId: telegramProfileData?.telegramId,
          telegramUsername: telegramProfileData?.telegramUsername,
          fullName: telegramProfileData?.fullName,
          photoUrl: telegramProfileData?.photoUrl,
          email: tgEmail.trim().toLowerCase(),
          otp: tgOtp.trim(),
          password: tgPassword
        }),
        credentials: 'include'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل إكمال التسجيل');
      localStorage.setItem('user', JSON.stringify(data));
      window.dispatchEvent(new CustomEvent('userLoggedIn', { detail: data }));
      toast({ title: "🎉 تم إنشاء الحساب!", description: `أهلاً ${data.fullName || data.name}` });
      setLocation('/');
    } catch (err: any) {
      toast({ title: "خطأ", description: err.message, variant: "destructive" });
    } finally {
      setIsCompletingTg(false);
    }
  };

  const telegramPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    return () => { if (telegramPollRef.current) clearInterval(telegramPollRef.current); };
  }, []);

  const openTelegramLogin = async () => {
    setIsTelegramLoading(true);
    try {
      const res = await fetch('/api/auth/telegram-start-login', { method: 'POST', credentials: 'include' });
      const { sessionId, deepLink } = await res.json();
      setTelegramDeepLink(deepLink);
      // Save sessionId to sessionStorage so it survives any accidental navigation
      sessionStorage.setItem('tgSignupSessionId', sessionId);
      // Always open in new tab/window to preserve the polling state on this page
      const opened = window.open(deepLink, '_blank');
      // If popup was blocked, open inline as last resort
      if (!opened) window.location.href = deepLink;
      setTelegramStep('waiting');
      toast({ title: '📱 افتح تيليجرام', description: 'اضغط Start في البوت ثم عُد للموقع' });
      let attempts = 0;
      telegramPollRef.current = setInterval(async () => {
        attempts++;
        if (attempts > 90) {
          clearInterval(telegramPollRef.current!);
          setIsTelegramLoading(false);
          setTelegramStep('idle');
          setTelegramDeepLink(null);
          toast({ title: 'انتهت المهلة', description: 'حاول مجدداً', variant: 'destructive' });
          return;
        }
        try {
          const pollRes = await fetch(`/api/auth/telegram-poll/${sessionId}`, { credentials: 'include' });
          const data = await pollRes.json();
          if (data.status === 'success') {
            clearInterval(telegramPollRef.current!);
            setIsTelegramLoading(false);
            setTelegramStep('idle');
            setTelegramDeepLink(null);
            localStorage.setItem('user', JSON.stringify(data.user));
            window.dispatchEvent(new CustomEvent('userLoggedIn', { detail: data.user }));
            toast({ title: 'تم تسجيل الدخول بنجاح!', description: `أهلاً ${data.user?.name || data.user?.fullName}` });
            setLocation('/');
          } else if (data.status === 'needs_profile') {
            clearInterval(telegramPollRef.current!);
            setIsTelegramLoading(false);
            setTelegramStep('idle');
            setTelegramDeepLink(null);
            setTelegramProfileData(data.telegramData);
          }
        } catch {}
      }, 2000);
    } catch {
      setIsTelegramLoading(false);
      setTelegramStep('idle');
      setTelegramDeepLink(null);
      toast({ title: 'خطأ في الاتصال', description: 'تعذر فتح رابط تيليجرام', variant: 'destructive' });
    }
  };

  if (!typeParam || !accountTypeConfigs[typeParam]) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const config = accountTypeConfigs[activeType];
  const IconComponent = config.icon;

  const handleTypeChange = (type: AccountType) => {
    setActiveType(type);
    setLocation(`/signup?type=${type}`);
  };

  const validateForm = () => {
    if (!fullName.trim()) { toast({ title: "خطأ", description: "يرجى إدخال الاسم الكامل", variant: "destructive" }); return false; }
    if (!email.trim() || !email.includes("@")) { toast({ title: "خطأ", description: "يرجى إدخال بريد إلكتروني صالح", variant: "destructive" }); return false; }
    if (phone.trim() && phone.length < 9) { toast({ title: "خطأ", description: "رقم الجوال يجب أن يكون 9 أرقام على الأقل", variant: "destructive" }); return false; }
    if (activeType === "institution") {
      if (!whatsapp.trim() || whatsapp.length < 9) { toast({ title: "خطأ", description: "يرجى إدخال رقم واتساب صالح", variant: "destructive" }); return false; }
      if (!institutionName.trim()) { toast({ title: "خطأ", description: "يرجى إدخال اسم المؤسسة", variant: "destructive" }); return false; }
      if (!institutionType) { toast({ title: "خطأ", description: "يرجى اختيار نوع المؤسسة", variant: "destructive" }); return false; }
      if (!city) { toast({ title: "خطأ", description: "يرجى اختيار المدينة", variant: "destructive" }); return false; }
    } else {
      if (!password || password.length < 6) { toast({ title: "خطأ", description: "كلمة المرور يجب أن تكون 6 أحرف على الأقل", variant: "destructive" }); return false; }
      if (password !== confirmPassword) { toast({ title: "خطأ", description: "كلمتا المرور غير متطابقتين", variant: "destructive" }); return false; }
    }
    return true;
  };

  // ── OTP Handlers ────────────────────────────────────────────────────────
  const handleSendEmailOtp = async () => {
    if (!email.trim() || !email.includes('@')) {
      toast({ title: "خطأ", description: "أدخل بريداً إلكترونياً صالحاً أولاً", variant: "destructive" });
      return;
    }
    setIsSendingEmailOtp(true);
    try {
      const res = await fetch('/api/auth/signup/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), fullName: fullName.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل إرسال الرمز');
      setEmailOtpSent(true);
      toast({ title: "تم الإرسال", description: "تحقق من بريدك الإلكتروني" });
    } catch (err: any) {
      toast({ title: "خطأ", description: err.message, variant: "destructive" });
    } finally {
      setIsSendingEmailOtp(false);
    }
  };

  const handleVerifyEmailOtp = async () => {
    if (!emailOtp.trim()) {
      toast({ title: "خطأ", description: "أدخل رمز التحقق", variant: "destructive" });
      return;
    }
    setIsVerifyingEmail(true);
    try {
      const res = await fetch('/api/auth/signup/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), otp: emailOtp.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'رمز التحقق خاطئ');
      setEmailVerified(true);
      toast({ title: "✅ تم التحقق", description: "تم التحقق من البريد الإلكتروني" });
    } catch (err: any) {
      toast({ title: "خطأ", description: err.message, variant: "destructive" });
    } finally {
      setIsVerifyingEmail(false);
    }
  };

  const handleRequestPhoneOtp = async () => {
    if (!phone.trim() || phone.length < 9) {
      toast({ title: "خطأ", description: "أدخل رقم جوال صالحاً أولاً", variant: "destructive" });
      return;
    }
    setIsSendingPhoneOtp(true);
    try {
      const cleanPhone = `966${phone.trim().replace(/^0/, '')}`;
      const res = await fetch('/api/auth/signup/request-phone-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'حدث خطأ');
      setPhoneOtpDeepLink(data.deepLink);
      const isMobileOtp = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      if (isMobileOtp) {
        window.location.href = data.deepLink;
      } else {
        const opened = window.open(data.deepLink, '_blank');
        if (!opened) window.location.href = data.deepLink;
      }
      toast({ title: "افتح تيليجرام", description: "سيصلك رمز التحقق في البوت" });
    } catch (err: any) {
      toast({ title: "خطأ", description: err.message, variant: "destructive" });
    } finally {
      setIsSendingPhoneOtp(false);
    }
  };

  const handleVerifyPhoneOtp = async () => {
    if (!phoneOtp.trim()) {
      toast({ title: "خطأ", description: "أدخل رمز التحقق", variant: "destructive" });
      return;
    }
    setIsVerifyingPhone(true);
    try {
      const cleanPhone = `966${phone.trim().replace(/^0/, '')}`;
      const res = await fetch('/api/auth/signup/verify-phone-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone, otp: phoneOtp.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'رمز التحقق خاطئ');
      setPhoneVerified(true);
      toast({ title: "✅ تم التحقق", description: "تم التحقق من رقم الجوال" });
    } catch (err: any) {
      toast({ title: "خطأ", description: err.message, variant: "destructive" });
    } finally {
      setIsVerifyingPhone(false);
    }
  };
  // ── End OTP Handlers ─────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // For institutions: submit request directly
    if (activeType === "institution") {
      if (!validateForm()) return;
      setIsLoading(true);
      try {
        const response = await fetch("/api/auth/institution-request", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            institutionName: institutionName.trim(),
            responsibleName: fullName.trim(),
            phone: phone.trim(),
            email: email.trim().toLowerCase(),
            whatsapp: whatsapp.trim(),
            city,
            institutionType,
            studentsCount: studentsCount ? parseInt(studentsCount) : undefined,
            notes: notes.trim() || undefined
          })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "حدث خطأ في إرسال الطلب");
        setRequestSubmitted(true);
      } catch (error: any) {
        toast({ title: "خطأ", description: error.message || "حدث خطأ غير متوقع", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Step 1: validate form → advance to OTP step
    if (step === 1) {
      if (!validateForm()) return;
      setStep(2);
      return;
    }

    // Step 2: email OTP must be verified before registering
    if (!emailVerified) {
      toast({ title: "مطلوب", description: "تحقق من بريدك الإلكتروني أولاً", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/register-multi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim() ? `+966${phone.trim().replace(/^0/, '')}` : undefined,
          whatsapp: whatsapp.trim() ? `+966${whatsapp.trim().replace(/^0/, '')}` : undefined,
          telegramUsername: telegramUsername.trim() || undefined,
          password,
          role: activeType,
          ...(activeType === 'student' && {
            academicTrack: academicTrack || undefined,
            gradeLevel: gradeLevel || undefined,
            studyGoal: studyGoal || undefined,
            targetScore: targetScore !== "" ? Number(targetScore) : undefined,
          }),
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "حدث خطأ في التسجيل");
      localStorage.setItem("user", JSON.stringify(data));
      window.dispatchEvent(new CustomEvent('userLoggedIn', { detail: data }));
      toast({ title: "🎉 مرحباً بك في قدراتك!", description: "تم إنشاء حسابك بنجاح" });
      setLocation("/");
    } catch (error: any) {
      toast({ title: "خطأ", description: error.message || "حدث خطأ غير متوقع", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  // Institution request success screen
  if (requestSubmitted && activeType === "institution") {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-gray-950 flex items-center justify-center p-4" dir="rtl">
        <SEO title="تم إرسال الطلب - منصة قدراتك" description="تم إرسال طلب تسجيل المؤسسة بنجاح" />
        <div className="max-w-lg w-full bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800">
          <div className="h-2 bg-gradient-to-r from-emerald-500 to-teal-600" />
          <div className="p-10 text-center">
            <div className="w-24 h-24 bg-emerald-50 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-emerald-100 dark:border-emerald-800">
              <CheckCircle2 className="w-12 h-12 text-emerald-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">تم استلام طلبك بنجاح</h1>
            <p className="text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
              سيتواصل معك فريق قدراتك خلال 24-48 ساعة عبر الواتساب أو البريد الإلكتروني لإتمام عملية التسجيل.
            </p>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-5 space-y-3 text-right mb-8">
              <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/40 rounded-lg flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4 text-emerald-600" />
                </div>
                <span>وقت المراجعة المتوقع: <strong>24-48 ساعة</strong></span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/40 rounded-lg flex items-center justify-center shrink-0">
                  <MessageCircle className="w-4 h-4 text-blue-600" />
                </div>
                <span>التواصل عبر: <strong className="dir-ltr" dir="ltr">{whatsapp}</strong></span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900/40 rounded-lg flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4 text-green-700" />
                </div>
                <span>أو البريد: <strong dir="ltr">{email}</strong></span>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/" className="flex-1">
                <Button className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-xl h-11" data-testid="button-go-home">
                  العودة للرئيسية
                </Button>
              </Link>
              <Link href="/login" className="flex-1">
                <Button variant="outline" className="w-full rounded-xl h-11" data-testid="button-go-login">
                  تسجيل الدخول
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Telegram profile completion screen
  if (telegramProfileData) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4" dir="rtl">
        <SEO title="إكمال التسجيل - منصة قدراتك" description="أكمل ملفك الشخصي للتسجيل عبر تيليجرام" />
        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
          <div className="h-1.5 bg-gradient-to-l from-emerald-500 to-teal-600" />
          <div className="p-8">
            {/* Header */}
            <div className="text-center mb-6">
              {telegramProfileData.photoUrl ? (
                <img src={telegramProfileData.photoUrl} alt="صورة تيليجرام" className="w-16 h-16 rounded-full mx-auto mb-3 border-4 border-emerald-100" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
                  <User className="w-8 h-8 text-emerald-600" />
                </div>
              )}
              <h2 className="text-xl font-bold text-gray-900">أهلاً {telegramProfileData.fullName || "بك"}!</h2>
              <p className="text-sm text-gray-500 mt-1">أكمل تسجيلك بإضافة بريدك الإلكتروني وكلمة مرور</p>
            </div>

            {/* Email */}
            <div className="space-y-1.5 mb-4">
              <Label className="text-sm font-semibold text-gray-700">البريد الإلكتروني</Label>
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="example@email.com"
                  value={tgEmail}
                  onChange={e => setTgEmail(e.target.value)}
                  disabled={tgOtpVerified}
                  data-testid="input-tg-email"
                  className="flex-1 h-11 rounded-xl border-gray-200 bg-white text-gray-900 focus:ring-2 focus:ring-emerald-500/20"
                  dir="ltr"
                />
                <Button
                  onClick={handleSendTgOtp}
                  disabled={isSendingTgOtp || tgOtpVerified}
                  type="button"
                  variant="outline"
                  className="h-11 px-3 rounded-xl border-emerald-200 text-emerald-700 text-xs whitespace-nowrap"
                  data-testid="button-send-tg-otp"
                >
                  {isSendingTgOtp ? <Loader2 className="w-4 h-4 animate-spin" /> : tgOtpSent ? "إعادة إرسال" : "إرسال رمز"}
                </Button>
              </div>
            </div>

            {/* OTP Input */}
            {tgOtpSent && !tgOtpVerified && (
              <div className="space-y-1.5 mb-4">
                <Label className="text-sm font-semibold text-gray-700">رمز التحقق</Label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="أدخل الرمز المرسل"
                    value={tgOtp}
                    onChange={e => setTgOtp(e.target.value)}
                    data-testid="input-tg-otp"
                    className="flex-1 h-11 rounded-xl border-gray-200 bg-white text-gray-900 focus:ring-2 focus:ring-emerald-500/20 text-center tracking-widest"
                    dir="ltr"
                    maxLength={6}
                  />
                  <Button
                    onClick={handleVerifyTgOtp}
                    disabled={isVerifyingTgOtp}
                    type="button"
                    className="h-11 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                    data-testid="button-verify-tg-otp"
                  >
                    {isVerifyingTgOtp ? <Loader2 className="w-4 h-4 animate-spin" /> : "تحقق"}
                  </Button>
                </div>
              </div>
            )}

            {tgOtpVerified && (
              <div className="flex items-center gap-2 text-emerald-700 text-sm mb-4 bg-emerald-50 rounded-xl px-3 py-2">
                <CheckCircle2 className="w-4 h-4" /> تم التحقق من البريد الإلكتروني
              </div>
            )}

            {/* Password */}
            <div className="space-y-1.5 mb-6">
              <Label className="text-sm font-semibold text-gray-700">كلمة المرور</Label>
              <div className="relative">
                <Input
                  type={tgShowPassword ? "text" : "password"}
                  placeholder="أدخل كلمة مرور (6 أحرف على الأقل)"
                  value={tgPassword}
                  onChange={e => setTgPassword(e.target.value)}
                  data-testid="input-tg-password"
                  className="h-11 rounded-xl border-gray-200 bg-white text-gray-900 pr-10 focus:ring-2 focus:ring-emerald-500/20"
                />
                <button
                  type="button"
                  onClick={() => setTgShowPassword(!tgShowPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {tgShowPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              onClick={handleCompleteTelegramProfile}
              disabled={isCompletingTg || !tgOtpVerified || !tgPassword}
              className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base"
              data-testid="button-complete-tg-profile"
            >
              {isCompletingTg ? <><Loader2 className="w-5 h-5 animate-spin ml-2" />جارٍ إنشاء الحساب...</> : "إكمال التسجيل"}
            </Button>

            <button
              type="button"
              onClick={() => setTelegramProfileData(null)}
              className="w-full text-center text-sm text-gray-400 hover:text-gray-600 mt-3"
            >
              العودة
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#E5E7EB]/50" dir="rtl">
      <SEO title="إنشاء حساب - قدراتك" description="أنشئ حسابك في منصة قدراتك لبدء رحلة تعلم منظمة." />

      <div className="flex min-h-screen">
        {/* ─── Right panel: Branding ─── */}
        <div className="hidden lg:flex lg:w-[46%] bg-gradient-to-br from-[#0D1B2A] via-[#1E2938] to-[#0D1B2A] flex-col justify-between p-10 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 right-10 w-64 h-64 rounded-full bg-white/20 blur-3xl" />
            <div className="absolute bottom-20 left-0 w-80 h-80 rounded-full bg-black/20 blur-3xl" />
          </div>

          <div className="relative z-10">
            {/* Logo */}
            <div className="flex items-center gap-3 mb-14">
              <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center overflow-hidden shadow-lg">
                <img src="/qodratak-logo.png" alt="قدراتك" className="w-full h-full object-cover object-top" />
              </div>
              <div>
                <div className="text-white font-black text-xl tracking-tight">قدراتك</div>
                <div className="text-white/70 text-xs tracking-[0.14em]">QIROX STUDIO</div>
              </div>
            </div>

            {/* Hero text */}
            <div className="mb-10">
              <div className="inline-flex items-center gap-2 bg-white/15 border border-white/25 rounded-full px-4 py-1.5 mb-5">
                <Sparkles className="w-3.5 h-3.5 text-white" />
                <span className="text-white text-xs font-semibold">بداية جديدة بخطوات أوضح</span>
              </div>
              <h1 className="text-4xl font-black text-white leading-tight mb-4">
                ابدأ رحلتك<br />بقياس واضح<br />
                <span className="text-[#F7F775]">وتدريب يصنع الفرق</span>
              </h1>
              <p className="text-white/75 text-base leading-relaxed max-w-sm">
                قدراتك مساحة تعليمية هادئة تجمع التدريب والمتابعة في رحلة واحدة مصممة للطالب السعودي.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 mb-10">
              {["قدرات", "تحصيلي", "IELTS"].map((path) => (
                <span key={path} className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white/90">
                  {path}
                </span>
              ))}
            </div>

            {/* Feature list */}
            <div className="space-y-2.5">
              {features.map((f) => (
                <div key={f} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-white/80 text-sm">{f}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom trust badge */}
          <div className="relative z-10 flex items-center gap-3 bg-white/10 border border-white/20 rounded-2xl p-4 mt-8">
            <Shield className="w-6 h-6 text-white/80 shrink-0" />
            <div>
              <div className="text-white text-sm font-semibold">منصة آمنة وموثوقة</div>
              <div className="text-white/60 text-xs">بيانات مشفرة وخصوصية تامة</div>
            </div>
          </div>
        </div>

        {/* ─── Left panel: Form ─── */}
        <div className="flex-1 flex flex-col">
          {/* Top bar */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
            <Link href="/login">
              <button className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors" data-testid="button-back">
                <ArrowRight className="w-4 h-4" />
                تسجيل الدخول
              </button>
            </Link>
            <div className="flex items-center gap-2 lg:hidden">
              <Award className="w-5 h-5 text-blue-600" />
              <span className="font-bold text-gray-900 dark:text-white text-sm">منصة قدراتك</span>
            </div>
            <div className="text-sm text-gray-400 hidden sm:block">
              لديك حساب؟ <Link href="/login" className="text-blue-600 hover:underline font-medium">ادخل الآن</Link>
            </div>
          </div>

          {/* Form area */}
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-xl mx-auto px-6 py-8">
              {/* Page header */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {activeType === "institution" ? "طلب تسجيل مؤسسة" : "إنشاء حساب جديد"}
                </h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  {activeType === "institution"
                    ? "أرسل طلبك وسيتواصل معك الفريق لإتمام التسجيل"
                    : "أنشئ حسابك الآن واستمتع بـ 7 أيام تجريبية مجانية"}
                </p>
              </div>

              {/* Account type tabs */}
              <div className="flex gap-2 p-1.5 bg-gray-100 dark:bg-gray-800 rounded-2xl mb-7">
                {(Object.values(accountTypeConfigs)).map((cfg) => {
                  const Ic = cfg.icon;
                  const isActive = activeType === cfg.id;
                  return (
                    <button
                      key={cfg.id}
                      onClick={() => handleTypeChange(cfg.id)}
                      data-testid={`tab-${cfg.id}`}
                      className={cn(
                        "flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200",
                        isActive
                          ? "bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white"
                          : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                      )}
                    >
                      <Ic className={cn("w-4 h-4", isActive ? "text-blue-600" : "")} />
                      {cfg.title.replace("حساب ", "")}
                    </button>
                  );
                })}
              </div>

              {/* Free trial badge (student/teacher only) */}
              {activeType !== "institution" && (
                <div className="flex items-center gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl px-4 py-3 mb-7">
                  <div className="w-9 h-9 bg-amber-100 dark:bg-amber-900/40 rounded-xl flex items-center justify-center shrink-0">
                    <Crown className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-amber-800 dark:text-amber-300">7 أيام تجريبية مجاناً</div>
                    <div className="text-xs text-amber-700/70 dark:text-amber-400/70">وصول كامل لجميع المميزات — لا بيانات بنك مطلوبة</div>
                  </div>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Full Name */}
                <div className="space-y-1.5">
                  <Label htmlFor="fullName" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {activeType === "institution" ? "اسم المسؤول" : "الاسم الكامل"}
                  </Label>
                  <div className="relative">
                    <Input
                      id="fullName"
                      type="text"
                      placeholder={activeType === "institution" ? "اسم المسؤول عن المؤسسة" : "أدخل اسمك الكامل"}
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      data-testid="input-fullName"
                      className="h-11 rounded-xl border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white pr-10 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                    <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    البريد الإلكتروني
                  </Label>
                  <div className="relative">
                    <Input
                      id="email"
                      type="email"
                      placeholder="example@email.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      data-testid="input-email"
                      dir="ltr"
                      className="h-11 rounded-xl border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-left pl-10 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    رقم الجوال {activeType === "institution" ? <span className="text-red-500">*</span> : <span className="text-gray-400 font-normal text-xs">(اختياري)</span>}
                  </Label>
                  <div className="flex h-11 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500" dir="ltr">
                    <div className="flex items-center gap-1.5 px-3 bg-gray-50 dark:bg-gray-700 border-r border-gray-200 dark:border-gray-600 text-sm font-semibold text-gray-600 dark:text-gray-300 shrink-0">
                      <span>🇸🇦</span>
                      <span>+966</span>
                    </div>
                    <input
                      id="phone"
                      type="tel"
                      placeholder="5XXXXXXXX"
                      value={phone}
                      onChange={e => setPhone(e.target.value.replace(/^0/, ''))}
                      data-testid="input-phone"
                      dir="ltr"
                      className="flex-1 px-3 text-sm text-gray-900 dark:text-white bg-transparent outline-none"
                    />
                  </div>
                </div>

                {/* WhatsApp - for students/teachers */}
                {activeType !== "institution" && (
                  <div className="space-y-1.5">
                    <Label htmlFor="whatsapp-student" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      رقم الواتساب <span className="text-gray-400 text-xs font-normal">(اختياري)</span>
                    </Label>
                    <div className="flex h-11 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden focus-within:ring-2 focus-within:ring-green-500/20 focus-within:border-green-500" dir="ltr">
                      <div className="flex items-center gap-1.5 px-3 bg-gray-50 dark:bg-gray-700 border-r border-gray-200 dark:border-gray-600 text-sm font-semibold text-gray-600 dark:text-gray-300 shrink-0">
                        <span>🇸🇦</span>
                        <span>+966</span>
                      </div>
                      <input
                        id="whatsapp-student"
                        type="tel"
                        placeholder="5XXXXXXXX"
                        value={whatsapp}
                        onChange={e => setWhatsapp(e.target.value.replace(/^0/, ''))}
                        data-testid="input-whatsapp-student"
                        dir="ltr"
                        className="flex-1 px-3 text-sm text-gray-900 dark:text-white bg-transparent outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* Academic profile — for students only */}
                {activeType === "student" && (
                  <div className="rounded-2xl border border-blue-100 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-950/20 p-4 space-y-4">
                    <p className="text-xs font-bold text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5" />
                      ملفك الأكاديمي <span className="font-normal text-blue-400">(اختياري — يساعدنا على تخصيص تجربتك)</span>
                    </p>

                    {/* التخصص */}
                    <div className="space-y-1.5">
                      <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">التخصص الدراسي</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {([["علمي", "🔬 علمي"], ["أدبي", "📖 أدبي"]] as [string, string][]).map(([val, lbl]) => (
                          <button
                            key={val}
                            type="button"
                            data-testid={`btn-track-${val}`}
                            onClick={() => setAcademicTrack(academicTrack === val as any ? "" : val as any)}
                            className={`py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${
                              academicTrack === val
                                ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-blue-300'
                            }`}
                          >{lbl}</button>
                        ))}
                      </div>
                    </div>

                    {/* الصف الدراسي */}
                    <div className="space-y-1.5">
                      <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">الصف الدراسي</Label>
                      <div className="grid grid-cols-3 gap-2">
                        {([
                          ["الثاني_ثانوي", "الثاني ثانوي"],
                          ["الثالث_ثانوي", "الثالث ثانوي"],
                          ["بعد_الثانوية", "بعد الثانوية"],
                        ] as [string, string][]).map(([val, lbl]) => (
                          <button
                            key={val}
                            type="button"
                            data-testid={`btn-grade-${val}`}
                            onClick={() => setGradeLevel(gradeLevel === val as any ? "" : val as any)}
                            className={`py-2.5 rounded-xl text-xs font-bold border-2 transition-all ${
                              gradeLevel === val
                                ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-blue-300'
                            }`}
                          >{lbl}</button>
                        ))}
                      </div>
                    </div>

                    {/* هدف الدراسة */}
                    <div className="space-y-1.5">
                      <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">هدفك من التدريب</Label>
                      <div className="space-y-2">
                        {([
                          ["qudrat", "🧠 تحسين درجة القدرات"],
                          ["tahsili", "📚 التحضير للتحصيلي"],
                          ["both", "⭐ القدرات والتحصيلي معاً"],
                        ] as [string, string][]).map(([val, lbl]) => (
                          <button
                            key={val}
                            type="button"
                            data-testid={`btn-goal-${val}`}
                            onClick={() => setStudyGoal(studyGoal === val as any ? "" : val as any)}
                            className={`w-full py-2.5 px-4 rounded-xl text-sm font-bold border-2 transition-all text-right ${
                              studyGoal === val
                                ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-blue-300'
                            }`}
                          >{lbl}</button>
                        ))}
                      </div>
                    </div>

                    {/* Target score field */}
                    <div className="space-y-1.5">
                      <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">الدرجة المستهدفة في الاختبار</Label>
                      <div className="relative">
                        <input
                          type="number"
                          min="50"
                          max="100"
                          step="1"
                          placeholder="مثال: 85"
                          value={targetScore}
                          onChange={e => setTargetScore(e.target.value === "" ? "" : Number(e.target.value))}
                          data-testid="input-target-score"
                          className="w-full h-11 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-4 text-center text-lg font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                        />
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">/ 100</span>
                      </div>
                      <p className="text-xs text-gray-400">اختياري — سنساعدك على الوصول لها</p>
                    </div>
                  </div>
                )}

                {/* Password fields (student/teacher only) */}
                {activeType !== "institution" && (
                  <>
                    <div className="space-y-1.5">
                      <Label htmlFor="password" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        كلمة المرور
                      </Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="6 أحرف على الأقل"
                          value={password}
                          onChange={e => setPassword(e.target.value)}
                          autoComplete="new-password"
                          data-testid="input-password"
                          className="h-11 rounded-xl border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white pr-10 pl-10 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                        <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                          data-testid="button-toggle-password"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {password.length > 0 && (
                        <div className="flex gap-1 mt-1">
                          {[1,2,3,4].map(i => (
                            <div key={i} className={cn(
                              "h-1 flex-1 rounded-full transition-colors",
                              password.length >= i * 2
                                ? password.length < 6 ? "bg-red-400" : password.length < 8 ? "bg-amber-400" : "bg-emerald-500"
                                : "bg-gray-200 dark:bg-gray-700"
                            )} />
                          ))}
                          <span className="text-xs text-gray-400 mr-1">
                            {password.length < 6 ? "ضعيفة" : password.length < 8 ? "متوسطة" : "قوية"}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="confirmPassword" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        تأكيد كلمة المرور
                      </Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="أعد إدخال كلمة المرور"
                          value={confirmPassword}
                          onChange={e => setConfirmPassword(e.target.value)}
                          autoComplete="new-password"
                          data-testid="input-confirmPassword"
                          className={cn(
                            "h-11 rounded-xl border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white pr-10 pl-10 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500",
                            confirmPassword && confirmPassword !== password ? "border-red-400 focus:border-red-400" : "",
                            confirmPassword && confirmPassword === password ? "border-emerald-400 focus:border-emerald-400" : ""
                          )}
                        />
                        <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                          data-testid="button-toggle-confirmPassword"
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {confirmPassword && confirmPassword !== password && (
                        <p className="text-xs text-red-500 flex items-center gap-1 mt-0.5">
                          <span>كلمتا المرور غير متطابقتين</span>
                        </p>
                      )}
                      {confirmPassword && confirmPassword === password && (
                        <p className="text-xs text-emerald-600 flex items-center gap-1 mt-0.5">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>كلمتا المرور متطابقتان</span>
                        </p>
                      )}
                    </div>
                  </>
                )}

                {/* Institution extra fields */}
                {activeType === "institution" && (
                  <div className="space-y-5 pt-2">
                    <div className="flex items-center gap-2 text-sm font-bold text-gray-800 dark:text-gray-200 border-b border-gray-100 dark:border-gray-800 pb-3">
                      <Building2 className="w-4 h-4 text-emerald-600" />
                      بيانات المؤسسة
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="whatsapp" className="text-sm font-semibold text-gray-700 dark:text-gray-300">رقم الواتساب</Label>
                      <div className="flex h-11 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500" dir="ltr">
                        <div className="flex items-center gap-1.5 px-3 bg-gray-50 dark:bg-gray-700 border-r border-gray-200 dark:border-gray-600 text-sm font-semibold text-gray-600 dark:text-gray-300 shrink-0">
                          <span>🇸🇦</span>
                          <span>+966</span>
                        </div>
                        <input id="whatsapp" type="tel" placeholder="5XXXXXXXX" value={whatsapp} onChange={e => setWhatsapp(e.target.value.replace(/^0/, ''))} data-testid="input-whatsapp" dir="ltr" className="flex-1 px-3 text-sm text-gray-900 dark:text-white bg-transparent outline-none" />
                      </div>
                      <p className="text-xs text-gray-400">سنتواصل معك عبر الواتساب لإتمام التسجيل</p>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="institutionName" className="text-sm font-semibold text-gray-700 dark:text-gray-300">اسم المؤسسة</Label>
                      <Input id="institutionName" type="text" placeholder="أدخل اسم المؤسسة" value={institutionName} onChange={e => setInstitutionName(e.target.value)} data-testid="input-institutionName" className="h-11 rounded-xl border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">نوع المؤسسة</Label>
                        <Select value={institutionType} onValueChange={setInstitutionType}>
                          <SelectTrigger className="h-11 rounded-xl border-gray-200 dark:border-gray-700" data-testid="select-institutionType">
                            <SelectValue placeholder="اختر النوع" />
                          </SelectTrigger>
                          <SelectContent>
                            {institutionTypes.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                          <MapPin className="w-3.5 h-3.5 inline ml-1" />
                          المدينة
                        </Label>
                        <Select value={city} onValueChange={setCity}>
                          <SelectTrigger className="h-11 rounded-xl border-gray-200 dark:border-gray-700" data-testid="select-city">
                            <SelectValue placeholder="اختر المدينة" />
                          </SelectTrigger>
                          <SelectContent>
                            {cities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="studentsCount" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        <Users className="w-3.5 h-3.5 inline ml-1" />
                        العدد المتوقع للطلاب
                        <span className="text-gray-400 font-normal mr-1">(اختياري)</span>
                      </Label>
                      <Input id="studentsCount" type="number" placeholder="مثال: 100" value={studentsCount} onChange={e => setStudentsCount(e.target.value)} data-testid="input-studentsCount" dir="ltr" className="h-11 rounded-xl border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-left focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="notes" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        <FileText className="w-3.5 h-3.5 inline ml-1" />
                        ملاحظات
                        <span className="text-gray-400 font-normal mr-1">(اختياري)</span>
                      </Label>
                      <Textarea id="notes" placeholder="أي معلومات إضافية..." value={notes} onChange={e => setNotes(e.target.value)} data-testid="input-notes" className="rounded-xl border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 min-h-[80px] resize-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" />
                    </div>
                  </div>
                )}

                {/* ─── Step 2: Email OTP Verification ─── */}
                {step === 2 && activeType !== "institution" && (
                  <div className="bg-emerald-50 rounded-2xl p-5 space-y-4 border border-emerald-100">
                    <div className="flex items-center gap-2 text-emerald-700 font-semibold text-sm">
                      <Mail className="w-4 h-4" />
                      تحقق من بريدك الإلكتروني
                    </div>
                    <p className="text-xs text-gray-500">
                      سنرسل رمز تحقق مكون من 6 أرقام إلى: <span className="font-bold text-gray-700" dir="ltr">{email}</span>
                    </p>
                    {emailVerified ? (
                      <div className="flex items-center gap-2 text-emerald-700 text-sm bg-emerald-100 rounded-xl px-3 py-2">
                        <CheckCircle2 className="w-4 h-4" /> تم التحقق من البريد الإلكتروني ✅
                      </div>
                    ) : (
                      <>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            onClick={handleSendEmailOtp}
                            disabled={isSendingEmailOtp}
                            variant="outline"
                            size="sm"
                            className="border-emerald-300 text-emerald-700 hover:bg-emerald-100 text-xs h-9"
                            data-testid="button-send-email-otp"
                          >
                            {isSendingEmailOtp ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : emailOtpSent ? "إعادة الإرسال" : "إرسال رمز التحقق"}
                          </Button>
                        </div>
                        {emailOtpSent && (
                          <div className="flex gap-2">
                            <Input
                              type="text"
                              placeholder="أدخل الرمز (6 أرقام)"
                              value={emailOtp}
                              onChange={e => setEmailOtp(e.target.value)}
                              maxLength={6}
                              data-testid="input-email-otp"
                              className="flex-1 h-10 rounded-xl border-emerald-200 bg-white text-gray-900 text-center tracking-widest focus:ring-2 focus:ring-emerald-500/20"
                              dir="ltr"
                            />
                            <Button
                              type="button"
                              onClick={handleVerifyEmailOtp}
                              disabled={isVerifyingEmail}
                              size="sm"
                              className="h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                              data-testid="button-verify-email-otp"
                            >
                              {isVerifyingEmail ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "تحقق"}
                            </Button>
                          </div>
                        )}
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => { setStep(1); setEmailOtp(""); setEmailOtpSent(false); setEmailVerified(false); }}
                      className="text-xs text-gray-400 hover:text-gray-600 underline"
                    >
                      ← العودة لتعديل البيانات
                    </button>
                  </div>
                )}

                {/* Submit */}
                <div className="pt-2">
                  <Button
                    type="submit"
                    size="lg"
                    className={cn("w-full h-12 rounded-xl font-bold text-white shadow-lg shadow-blue-500/20 bg-gradient-to-r", config.accent)}
                    disabled={isLoading}
                    data-testid="button-submit"
                  >
                    {isLoading ? (
                      <><Loader2 className="w-5 h-5 animate-spin ml-2" />جارٍ المعالجة...</>
                    ) : (
                      <>
                        {activeType === "institution" ? "إرسال الطلب" : step === 1 ? "المتابعة للتحقق" : "إنشاء الحساب مجاناً"}
                        <ChevronLeft className="w-5 h-5 mr-2" />
                      </>
                    )}
                  </Button>

                  {activeType !== "institution" && (
                    <p className="text-center text-xs text-gray-400 mt-3">
                      بإنشاء حساب فأنت توافق على{" "}
                      <span className="text-blue-600 cursor-pointer hover:underline">شروط الاستخدام</span>
                      {" "}و{" "}
                      <span className="text-blue-600 cursor-pointer hover:underline">سياسة الخصوصية</span>
                    </p>
                  )}
                </div>
              </form>

              {/* Divider + login link */}
              <div className="relative my-7">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200 dark:border-gray-800" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-slate-50 dark:bg-gray-950 px-4 text-xs text-gray-400">لديك حساب بالفعل؟</span>
                </div>
              </div>
              <Link href="/login">
                <Button variant="outline" className="w-full h-11 rounded-xl border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-semibold" data-testid="link-login">
                  تسجيل الدخول
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
