import { useState, useEffect, useRef, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLocation, useSearch } from "wouter";
import { Eye, EyeOff, LogIn, Fingerprint, UserPlus, Shield, KeyRound, HelpCircle, Trophy, Zap, Mail, Phone, User, ExternalLink, Lock, Hash, RefreshCw, CheckCircle2, Smartphone, Building2, GraduationCap } from "lucide-react";
import { startAuthentication } from '@simplewebauthn/browser';
import { SiTelegram } from "react-icons/si";
import { setAdminAccessToken } from "@/lib/adminSession";

const developmentAccounts = [
  { label: "الأدمن التجريبي", identifier: "admin-demo", password: "AdminDemo@2026", Icon: Shield },
  { label: "الطالب التجريبي", identifier: "student-demo", password: "StudentDemo@2026", Icon: GraduationCap },
  { label: "المؤسسة التجريبية", identifier: "institution-demo", password: "InstitutionDemo@2026", Icon: Building2 },
];

// ──────────────────────────────────────────
// 2FA Verification Screen
// ──────────────────────────────────────────
function TwoFactorScreen({ methods, onSuccess }: { methods: string[]; onSuccess: (user: any) => void }) {
  const { toast } = useToast();
  const [activeMethod, setActiveMethod] = useState<string>(methods[0] || 'totp');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [pushChoices, setPushChoices] = useState<number[]>([]);
  const [emailSent, setEmailSent] = useState(false);

  const methodLabels: Record<string, string> = {
    totp: 'تطبيق المصادقة',
    email: 'بريد إلكتروني',
    push: 'موافقة فورية',
    recovery: 'عبارة الاسترداد',
  };
  const methodIcons: Record<string, any> = {
    totp: <Smartphone className="w-4 h-4" />,
    email: <Mail className="w-4 h-4" />,
    push: <CheckCircle2 className="w-4 h-4" />,
    recovery: <KeyRound className="w-4 h-4" />,
  };

  const sendEmailOTP = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/2fa/send-email-otp', { method: 'POST', credentials: 'include' });
      const data = await res.json();
      if (res.ok) { setEmailSent(true); toast({ title: '✅ تم الإرسال', description: data.message }); }
      else toast({ title: 'خطأ', description: data.error, variant: 'destructive' });
    } finally { setLoading(false); }
  };

  const loadPushChallenge = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/2fa/push-challenge', { method: 'POST', credentials: 'include' });
      const data = await res.json();
      if (res.ok) setPushChoices(data.choices);
      else toast({ title: 'خطأ', description: data.error, variant: 'destructive' });
    } finally { setLoading(false); }
  };

  useEffect(() => {
    setCode('');
    setPushChoices([]);
    setEmailSent(false);
    if (activeMethod === 'push') loadPushChallenge();
    if (activeMethod === 'email') sendEmailOTP();
  }, [activeMethod]);

  const verify = async (overrideCode?: string | number) => {
    const finalCode = overrideCode ?? code;
    if (!finalCode && activeMethod !== 'push') return;
    setLoading(true);
    try {
      const res = await fetch('/api/auth/verify-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method: activeMethod, code: finalCode }),
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast({ title: '✅ تم التحقق بنجاح!' });
        onSuccess(data.user);
      } else {
        toast({ title: 'رمز غير صحيح', description: data.error, variant: 'destructive' });
      }
    } finally { setLoading(false); }
  };

  return (
    <div className="px-8 pb-6 pt-2 space-y-4">
      <div className="text-center space-y-1">
        <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center mx-auto">
          <Shield className="w-6 h-6 text-blue-500" />
        </div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">التحقق الثنائي</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">اختر طريقة التحقق لإتمام تسجيل الدخول</p>
      </div>

      {/* Method tabs */}
      {methods.length > 1 && (
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl overflow-x-auto">
          {methods.map((m) => (
            <button
              key={m}
              onClick={() => setActiveMethod(m)}
              data-testid={`button-2fa-method-${m}`}
              className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                activeMethod === m
                  ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {methodIcons[m]}
              {methodLabels[m]}
            </button>
          ))}
        </div>
      )}

      {/* TOTP */}
      {activeMethod === 'totp' && (
        <div className="space-y-3">
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
            افتح تطبيق المصادقة (مثل Google Authenticator) وأدخل الرمز المكوّن من 6 أرقام
          </p>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="000000"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            data-testid="input-2fa-totp"
            className="w-full text-center text-2xl font-mono tracking-[0.5em] py-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
          />
          <button
            onClick={() => verify()}
            disabled={loading || code.length !== 6}
            data-testid="button-2fa-verify-totp"
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            تحقق
          </button>
        </div>
      )}

      {/* Email OTP */}
      {activeMethod === 'email' && (
        <div className="space-y-3">
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
            {emailSent ? 'تم إرسال رمز التحقق إلى بريدك الإلكتروني' : 'جاري إرسال الرمز...'}
          </p>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="000000"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            data-testid="input-2fa-email"
            className="w-full text-center text-2xl font-mono tracking-[0.5em] py-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
          />
          <div className="flex gap-2">
            <button
              onClick={() => verify()}
              disabled={loading || code.length !== 6}
              data-testid="button-2fa-verify-email"
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              تحقق
            </button>
            <button
              onClick={sendEmailOTP}
              disabled={loading}
              data-testid="button-2fa-resend-email"
              className="px-4 py-3 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all flex items-center gap-1.5 text-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" /> إعادة إرسال
            </button>
          </div>
        </div>
      )}

      {/* Push Approval */}
      {activeMethod === 'push' && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center font-medium">
            اختر الرقم الصحيح لتأكيد هويتك
          </p>
          {loading && pushChoices.length === 0 ? (
            <div className="flex justify-center py-4">
              <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {pushChoices.map((n) => (
                <button
                  key={n}
                  onClick={() => verify(n)}
                  disabled={loading}
                  data-testid={`button-2fa-push-${n}`}
                  className="py-6 text-3xl font-bold rounded-2xl border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:text-blue-600 dark:hover:text-blue-400 transition-all text-gray-800 dark:text-gray-200"
                >
                  {n}
                </button>
              ))}
            </div>
          )}
          <button
            onClick={loadPushChallenge}
            disabled={loading}
            data-testid="button-2fa-push-refresh"
            className="w-full py-2.5 text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 flex items-center justify-center gap-1.5 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> أرقام جديدة
          </button>
        </div>
      )}

      {/* Recovery */}
      {activeMethod === 'recovery' && (
        <div className="space-y-3">
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
            أدخل عبارة الاسترداد السرية التي ضبطتها عند تفعيل التحقق الثنائي
          </p>
          <div className="relative">
            <KeyRound className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="عبارة الاسترداد..."
              value={code}
              onChange={(e) => setCode(e.target.value)}
              data-testid="input-2fa-recovery"
              className="w-full pr-10 pl-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 text-sm"
            />
          </div>
          <button
            onClick={() => verify()}
            disabled={loading || !code.trim()}
            data-testid="button-2fa-verify-recovery"
            className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            استرداد الحساب
          </button>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────
// Quick PIN Login Screen
// ──────────────────────────────────────────
function PinLoginScreen({ email, onSuccess, onBack }: { email: string; onSuccess: (user: any) => void; onBack: () => void }) {
  const { toast } = useToast();
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePinLogin = async () => {
    if (pin.length < 4) return;
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, pin }),
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast({ title: '✅ تم تسجيل الدخول بالرمز السري' });
        onSuccess(data.user);
      } else {
        toast({ title: 'رمز غير صحيح', description: data.error, variant: 'destructive' });
        setPin('');
      }
    } finally { setLoading(false); }
  };

  const handleDigit = (d: string) => {
    if (pin.length < 8) setPin(p => p + d);
  };
  const handleDelete = () => setPin(p => p.slice(0, -1));

  useEffect(() => {
    if (pin.length >= 4) {
      const t = setTimeout(handlePinLogin, 300);
      return () => clearTimeout(t);
    }
  }, [pin]);

  return (
    <div className="px-8 pb-6 pt-2 space-y-5">
      <div className="text-center space-y-1">
        <div className="w-12 h-12 rounded-2xl bg-green-50 dark:bg-green-950/30 flex items-center justify-center mx-auto">
          <Hash className="w-6 h-6 text-green-500" />
        </div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">رمز PIN السري</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">{email}</p>
      </div>

      {/* PIN dots */}
      <div className="flex justify-center gap-4 py-2">
        {Array.from({ length: Math.max(6, pin.length + 1) }, (_, i) => (
          <div
            key={i}
            className={`w-4 h-4 rounded-full border-2 transition-all ${
              i < pin.length
                ? 'bg-green-500 border-green-500 scale-110'
                : 'bg-transparent border-gray-300 dark:border-gray-600'
            }`}
          />
        )).slice(0, Math.min(8, Math.max(6, pin.length + 1)))}
      </div>

      {/* Numpad */}
      <div className="grid grid-cols-3 gap-2">
        {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((d, i) => (
          <button
            key={i}
            onClick={() => d === '⌫' ? handleDelete() : d ? handleDigit(d) : undefined}
            disabled={loading || (!d && d !== '0')}
            data-testid={`button-pin-${d || 'empty'}`}
            className={`h-14 rounded-2xl text-xl font-semibold transition-all active:scale-95 ${
              d === '⌫'
                ? 'text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20'
                : d
                  ? 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 shadow-sm border border-gray-100 dark:border-gray-700'
                  : 'opacity-0 pointer-events-none'
            }`}
          >
            {loading && d === '0' ? <div className="w-5 h-5 border-2 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto" /> : d}
          </button>
        ))}
      </div>

      <button
        onClick={onBack}
        data-testid="button-pin-back"
        className="w-full py-2.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
      >
        ← الرجوع لتسجيل الدخول
      </button>
    </div>
  );
}

// ──────────────────────────────────────────
// Main Login Page
// ──────────────────────────────────────────
export default function LoginPage() {
  const [, setLocation] = useLocation();
  const searchStr = useSearch();
  const returnPath = (() => {
    try {
      const p = new URLSearchParams(searchStr).get('return');
      return p ? decodeURIComponent(p) : '/';
    } catch { return '/'; }
  })();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isBiometricLoading, setIsBiometricLoading] = useState(false);
  const [isTelegramLoading, setIsTelegramLoading] = useState(false);
  const [telegramStep, setTelegramStep] = useState<'idle' | 'waiting'>('idle');
  const [telegramDeepLink, setTelegramDeepLink] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ identifier: '', password: '' });
  const telegramPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Screen state
  const [screen, setScreen] = useState<'login' | '2fa' | 'pin'>('login');
  const [twoFactorMethods, setTwoFactorMethods] = useState<string[]>([]);

  const isInIframe = typeof window !== 'undefined' && window.top !== window.self;

  const handleSuccessfulLogin = useCallback((result: any) => {
    localStorage.setItem('user', JSON.stringify(result));
    window.dispatchEvent(new CustomEvent('userLoggedIn', { detail: result }));
    toast({ title: 'مرحباً بعودتك!', description: `أهلاً ${result.fullName || result.name || result.username}` });
    setLocation(result.role === 'institution_admin' ? '/institution' : returnPath);
  }, [setLocation, returnPath, toast]);

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
      sessionStorage.setItem('tgLoginSessionId', sessionId);
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
          toast({ title: 'انتهت المهلة', description: 'لم يتم اكتشاف تسجيل الدخول. حاول مجدداً.', variant: 'destructive' });
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
            handleSuccessfulLogin(data.user);
          } else if (data.status === 'needs_profile') {
            clearInterval(telegramPollRef.current!);
            setIsTelegramLoading(false);
            setTelegramStep('idle');
            setTelegramDeepLink(null);
            sessionStorage.setItem('pendingTelegramProfile', JSON.stringify(data.telegramData));
            toast({ title: 'أنت مستخدم جديد', description: 'سيتم تحويلك لإكمال التسجيل...' });
            setTimeout(() => setLocation('/signup?type=student'), 1000);
          }
        } catch {}
      }, 2000);
    } catch {
      setIsTelegramLoading(false);
      toast({ title: 'خطأ في الاتصال', description: 'تعذر فتح رابط تيليجرام', variant: 'destructive' });
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: formData.identifier, password: formData.password }),
        credentials: 'include',
      });
      const result = await response.json();
      if (response.ok) {
        if (result.isAdmin) {
          setAdminAccessToken(result.adminAccessToken);
          const sessionResponse = await fetch('/api/admin/session', {
            credentials: 'include',
            cache: 'no-store',
          });
          const session = await sessionResponse.json().catch(() => null);

          if (!sessionResponse.ok || !session?.authenticated) {
            throw new Error('تعذر حفظ جلسة الإدارة. حدّث المعاينة ثم أعد المحاولة.');
          }

          window.location.replace('/admin/dashboard');
          return;
        }
        if (result.require2FA) {
          setTwoFactorMethods(result.methods || ['totp']);
          setScreen('2fa');
          return;
        }
        handleSuccessfulLogin(result);
      } else {
        toast({ title: 'خطأ في تسجيل الدخول', description: result.message || 'بيانات تسجيل الدخول غير صحيحة', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'خطأ في الاتصال', description: 'تعذر الاتصال بالخادم', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    if (!formData.identifier) {
      toast({ title: 'مطلوب', description: 'أدخل بريدك الإلكتروني أولاً', variant: 'destructive' });
      return;
    }
    if (isInIframe) {
      window.open(window.location.href, '_blank');
      return;
    }
    setIsBiometricLoading(true);
    try {
      const optionsRes = await fetch('/api/auth/webauthn/login-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.identifier }),
        credentials: 'include',
      });
      if (!optionsRes.ok) throw new Error('لا يوجد بصمة مسجلة');
      const options = await optionsRes.json();
      if (!options.allowCredentials?.length) {
        toast({ title: 'لا توجد بصمة مسجلة', description: 'سجّل دخولك بكلمة المرور، ثم فعّل البصمة من الإعدادات', variant: 'destructive' });
        return;
      }
      const authResponse = await startAuthentication({ optionsJSON: options });
      const verifyRes = await fetch('/api/auth/webauthn/login-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.identifier, response: authResponse }),
        credentials: 'include',
      });
      const result = await verifyRes.json();
      if (result.success) {
        localStorage.setItem('user', JSON.stringify(result.user));
        window.dispatchEvent(new CustomEvent('userLoggedIn', { detail: result.user }));
        toast({ title: '✅ تم تسجيل الدخول بالبصمة' });
        setLocation(returnPath);
      } else {
        throw new Error(result.message || 'فشل التحقق');
      }
    } catch (error: any) {
      toast({ title: 'فشل تسجيل الدخول بالبصمة', description: error.message || 'حدث خطأ', variant: 'destructive' });
    } finally {
      setIsBiometricLoading(false);
    }
  };

  const getIdentifierIcon = () => {
    const id = formData.identifier;
    if (id.includes('@')) return <Mail className="w-4 h-4" />;
    if (/^[0-9+\s]+$/.test(id) && id.length > 0) return <Phone className="w-4 h-4" />;
    return <User className="w-4 h-4" />;
  };

  return (
    <div className="min-h-screen bg-[#EDF1F4] px-4 py-5 sm:px-8 sm:py-8" dir="rtl">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_25px_80px_rgba(13,27,42,.12)] lg:grid-cols-[.95fr_1.05fr]">
        <aside className="relative hidden overflow-hidden bg-[#0D1B2A] p-10 lg:flex lg:flex-col">
          <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "linear-gradient(rgba(247,247,117,.09) 1px, transparent 1px), linear-gradient(90deg, rgba(247,247,117,.09) 1px, transparent 1px)", backgroundSize: "40px 40px", maskImage: "linear-gradient(to bottom, black, transparent)" }} />
          <div className="relative flex items-center gap-2.5">
            <img src="/qodratak-logo-transparent.png" alt="قدراتك" className="h-10 w-10 object-contain" />
            <div><p className="font-black text-white">قدراتك</p><p className="mt-0.5 text-[9px] font-bold tracking-[.16em] text-white/50">QIROX STUDIO</p></div>
          </div>
          <div className="relative mt-16 max-w-sm">
            <p className="text-sm font-bold text-[#F7F775]">عودة إلى خطتك</p>
            <h1 className="mt-3 text-4xl font-black leading-tight text-white">كل محاولة تقول لك ماذا تفعل بعدها.</h1>
            <p className="mt-4 text-sm leading-7 text-slate-300">سجّل دخولك لتكمل التدريب، تراجع آخر نتيجة، وتعرف الخطوة التالية في مسارك.</p>
          </div>
          <div className="relative mt-auto rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div><p className="text-[10px] font-bold text-white/45">ملخص آخر محاولة</p><p className="mt-0.5 text-sm font-black text-white">اختبار محاكي</p></div>
              <div className="flex h-11 w-11 items-center justify-center rounded-full border-4 border-[#F7F775] text-sm font-black text-white">76</div>
            </div>
            <div className="mt-4 space-y-3">
              {[["الكمي", "72%"], ["اللفظي", "81%"], ["إدارة الوقت", "68%"]].map(([label, value], index) => (
                <div key={label}>
                  <div className="mb-1 flex justify-between text-[10px] font-bold text-white/55"><span>{label}</span><span>{value}</span></div>
                  <div className="h-1.5 rounded-full bg-white/10"><div className="h-full rounded-full bg-[#F7F775]" style={{ width: index === 0 ? "72%" : index === 1 ? "81%" : "68%" }} /></div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs font-bold text-white/75"><Trophy className="h-4 w-4 text-[#F7F775]" /> أكمل من حيث توقفت</div>
          </div>
        </aside>

        <main className="flex min-h-full flex-col">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5 sm:px-9">
            <button onClick={() => setLocation('/')} className="qodratak-focus-ring text-sm font-bold text-slate-500 transition hover:text-[#0D1B2A]">الرئيسية</button>
            <div className="flex items-center gap-2 lg:hidden"><img src="/qodratak-logo-transparent.png" alt="" className="h-8 w-8 object-contain" /><span className="text-sm font-black text-[#0D1B2A]">قدراتك</span></div>
            <button onClick={() => setLocation('/signup?type=student')} className="qodratak-focus-ring text-sm font-black text-[#0D1B2A]">إنشاء حساب</button>
          </div>

          <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-10 sm:px-9">
            <div className="mb-8">
              <p className="text-xs font-black tracking-[.14em] text-slate-400">تسجيل الدخول</p>
              <h2 className="mt-2 text-3xl font-black text-[#0D1B2A]">أهلًا بعودتك.</h2>
               <p className="mt-2 text-sm leading-6 text-slate-500">استخدم بيانات حسابك وسنوجّهك تلقائيًا إلى المساحة المناسبة.</p>
            </div>

            {screen === '2fa' && (
              <>
                <TwoFactorScreen methods={twoFactorMethods} onSuccess={handleSuccessfulLogin} />
                <button onClick={() => setScreen('login')} data-testid="button-2fa-back" className="mt-4 w-full py-2.5 text-sm font-bold text-slate-500 transition hover:text-[#0D1B2A]">العودة لتسجيل الدخول</button>
              </>
            )}

            {screen === 'pin' && <PinLoginScreen email={formData.identifier} onSuccess={handleSuccessfulLogin} onBack={() => setScreen('login')} />}

            {screen === 'login' && (
              <>
                <form onSubmit={handleLogin} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-sm font-black text-slate-700">البريد الإلكتروني أو رقم الجوال</label>
                    <div className="group relative">
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition group-focus-within:text-[#0D1B2A]">{getIdentifierIcon()}</span>
                      <input type="text" placeholder="example@email.com أو 05xxxxxxxx" value={formData.identifier} onChange={(e) => setFormData({ ...formData, identifier: e.target.value })} required autoComplete="username" data-testid="input-identifier" className="w-full rounded-xl border border-slate-200 bg-[#F8FAFB] py-3.5 pr-11 pl-4 text-sm text-[#0D1B2A] outline-none transition placeholder:text-slate-400 focus:border-[#0D1B2A] focus:bg-white focus:ring-4 focus:ring-[#0D1B2A]/10" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between"><label className="text-sm font-black text-slate-700">كلمة المرور</label><button type="button" onClick={() => setLocation('/forgot-password')} className="text-xs font-bold text-slate-500 hover:text-[#0D1B2A]" data-testid="link-forgot-password">نسيت كلمة المرور؟</button></div>
                    <div className="group relative">
                      <KeyRound className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition group-focus-within:text-[#0D1B2A]" />
                      <input type={showPassword ? 'text' : 'password'} placeholder="أدخل كلمة المرور" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required autoComplete="current-password" data-testid="input-password" className="w-full rounded-xl border border-slate-200 bg-[#F8FAFB] py-3.5 pr-11 pl-11 text-sm text-[#0D1B2A] outline-none transition placeholder:text-slate-400 focus:border-[#0D1B2A] focus:bg-white focus:ring-4 focus:ring-[#0D1B2A]/10" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-[#0D1B2A]" data-testid="button-toggle-password">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                    </div>
                  </div>
                  <button type="submit" disabled={isLoading} data-testid="button-login" className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0D1B2A] px-4 py-3.5 text-sm font-black text-white transition hover:bg-[#1E2938] disabled:cursor-not-allowed disabled:opacity-70">
                    {isLoading ? <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> جارٍ تسجيل الدخول</> : <><LogIn className="h-4 w-4" /> تسجيل الدخول</>}
                  </button>
                </form>
                <div className="mt-5 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-xs leading-5 text-slate-500"><Shield className="h-4 w-4 shrink-0 text-[#0D1B2A]" /> جلساتك وبيانات الدخول محمية، ويمكنك إدارة أجهزتك من حسابك.</div>
                 <div className="mt-4 rounded-xl border border-[#0D1B2A]/10 bg-[#F8FAFB] p-4">
                   <div className="flex items-center gap-2">
                     <Shield className="h-4 w-4 text-[#0D1B2A]" />
                     <p className="text-xs font-black text-[#0D1B2A]">دخول واحد لكل الحسابات</p>
                   </div>
                   <p className="mt-1 text-[11px] leading-5 text-slate-500">الطالب يتجه إلى لوحة تقدمه، المؤسسة إلى بوابتها، والأدمن إلى لوحة الإدارة.</p>
                   {import.meta.env.DEV && (
                     <div className="mt-3 grid gap-2 sm:grid-cols-3">
                        {developmentAccounts.map(({ label, identifier, password, Icon }) => (
                          <div key={label} className="border border-slate-200 bg-white p-2.5">
                           <div className="flex items-center gap-1.5 text-[10px] font-black text-[#0D1B2A]"><Icon className="h-3.5 w-3.5" />{label}</div>
                           <p className="mt-1 font-mono text-[10px] text-slate-600">{identifier}</p>
                           <p className="font-mono text-[10px] text-slate-600">{password}</p>
                         </div>
                       ))}
                     </div>
                   )}
                 </div>
                <div className="mt-7 border-t border-slate-100 pt-6 text-center">
                  <p className="text-sm text-slate-500">ليس لديك حساب؟ <button onClick={() => setLocation('/signup?type=student')} className="font-black text-[#0D1B2A]" data-testid="link-signup">ابدأ كطالب</button></p>
                   <p className="mt-3 text-xs text-slate-400">طلبات المؤسسات الفعلية تُراجع من الإدارة قبل التفعيل.</p>
                </div>
              </>
            )}
          </div>
          <div className="border-t border-slate-100 px-6 py-4 text-center text-[10px] font-bold tracking-[.18em] text-slate-400">QIROX STUDIO</div>
        </main>
      </div>
    </div>
  );
}
