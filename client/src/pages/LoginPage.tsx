import { useState, useEffect, useRef, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLocation, useSearch } from "wouter";
import { Eye, EyeOff, LogIn, Fingerprint, UserPlus, Shield, KeyRound, HelpCircle, Trophy, Zap, Mail, Phone, User, ExternalLink, Lock, Hash, RefreshCw, CheckCircle2, Smartphone } from "lucide-react";
import { startAuthentication } from '@simplewebauthn/browser';
import { SiTelegram } from "react-icons/si";

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
    setLocation(returnPath);
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
          toast({ title: 'مرحباً أيها المدير!', description: `أهلاً ${result.admin?.fullName || 'مدير النظام'}` });
          setLocation('/admin/dashboard');
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
    <div className="min-h-screen flex items-center justify-center bg-[#F7F8FA] p-4" dir="rtl">
      <div className="w-full max-w-md">
        <div className="overflow-hidden rounded-xl border border-[#E5E7EB] bg-white">
          <div className="h-1" style={{ background: "#0D1B2A" }} />

          {/* Header (always shown) */}
          <div className="pt-8 pb-4 px-8 text-center">
            <div className="w-14 h-14 rounded-lg overflow-hidden mx-auto mb-4">
              <img src="/qodratak-logo.png" alt="قدراتك" className="w-full h-full object-cover object-top" />
            </div>
            <h1 className="text-2xl font-bold text-[#0D1B2A]">أهلاً بك في قدراتك</h1>
            <p className="text-sm text-[#94A3B8] mt-1">مساحتك الهادئة للاستعداد والتقدم</p>
          </div>

          {/* 2FA Screen */}
          {screen === '2fa' && (
            <>
              <TwoFactorScreen
                methods={twoFactorMethods}
                onSuccess={handleSuccessfulLogin}
              />
              <div className="px-8 pb-6">
                <button
                  onClick={() => setScreen('login')}
                  data-testid="button-2fa-back"
                  className="w-full py-2.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                >
                  ← الرجوع لتسجيل الدخول
                </button>
              </div>
            </>
          )}

          {/* PIN Screen */}
          {screen === 'pin' && (
            <PinLoginScreen
              email={formData.identifier}
              onSuccess={handleSuccessfulLogin}
              onBack={() => setScreen('login')}
            />
          )}

          {/* Main Login Form */}
          {screen === 'login' && (
            <>
              <div className="px-8 pb-4 pt-2">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      البريد أو اسم المستخدم أو الجوال
                    </label>
                    <div className="relative group">
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#0D1B2A] transition-colors">
                        {getIdentifierIcon()}
                      </span>
                      <input
                        type="text"
                        placeholder="email@example.com / username / 05xxxxxxxx"
                        value={formData.identifier}
                        onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
                        required
                        autoComplete="username"
                        data-testid="input-identifier"
                        className="w-full pr-10 pl-4 py-3 rounded-xl border border-[#E5E7EB] bg-[#E5E7EB]/40 text-[#0D1B2A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#0D1B2A]/20 focus:border-[#0D1B2A] transition-all text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">كلمة المرور</label>
                    <div className="relative group">
                      <KeyRound className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#0D1B2A] transition-colors" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="أدخل كلمة المرور"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                        autoComplete="current-password"
                        data-testid="input-password"
                        className="w-full pr-10 pl-10 py-3 rounded-xl border border-[#E5E7EB] bg-[#E5E7EB]/40 text-[#0D1B2A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#0D1B2A]/20 focus:border-[#0D1B2A] transition-all text-sm"
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors" data-testid="button-toggle-password">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    data-testid="button-login"
                    className="w-full py-3 px-4 bg-[#0D1B2A] hover:bg-[#1E2938] text-white font-semibold rounded-xl transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> جاري تسجيل الدخول...</>
                    ) : (
                      <><LogIn className="w-4 h-4" /> تسجيل الدخول</>
                    )}
                  </button>

                </form>

                <div className="mt-5 flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700">
                  <Shield className="w-3.5 h-3.5 flex-shrink-0 text-[#0D1B2A]" />
                  <span>بيانات تسجيل دخولك مشفرة ومحمية بالكامل</span>
                </div>
              </div>

              {/* Footer */}
              <div className="px-8 pb-6 border-t border-gray-100 dark:border-gray-800 pt-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <button onClick={() => setLocation('/account-type')} className="flex items-center gap-1.5 text-[#0D1B2A] hover:underline font-medium" data-testid="link-signup">
                    <UserPlus className="w-3.5 h-3.5" /> حساب جديد؟ سجّل الآن
                  </button>
                  <button onClick={() => setLocation('/guest-signup')} className="flex items-center gap-1.5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors" data-testid="link-guest">
                    <Zap className="w-3.5 h-3.5" /> تجربة مجانية
                  </button>
                </div>
                <div className="text-center">
                  <button onClick={() => setLocation('/forgot-password')} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-[#0D1B2A] transition-colors mx-auto" data-testid="link-forgot-password">
                    <HelpCircle className="w-3.5 h-3.5" /> نسيت كلمة المرور؟
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        <p className="text-center mt-6 text-xs tracking-[0.18em] text-[#94A3B8]">QIROX STUDIO</p>
      </div>
    </div>
  );
}
