import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import {
  Shield, Smartphone, Mail, KeyRound, Fingerprint, Hash,
  CheckCircle2, XCircle, ChevronRight, ArrowRight, Eye, EyeOff,
  RefreshCw, Trash2, Plus, Lock, AlertTriangle, Info
} from "lucide-react";

interface SecurityStatus {
  twoFactorEnabled: boolean;
  twoFactorMethods: string[];
  hasTOTP: boolean;
  hasPIN: boolean;
  hasPasskey: boolean;
  hasRecovery: boolean;
}

// ─── TOTP Setup ───
function TOTPSetup({ onDone }: { onDone: () => void }) {
  const { toast } = useToast();
  const [step, setStep] = useState<'idle' | 'qr' | 'verify'>('idle');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const startSetup = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/2fa/setup-totp', { method: 'POST', credentials: 'include' });
      const data = await res.json();
      if (res.ok) {
        setQrDataUrl(data.qrDataUrl);
        setSecret(data.secret);
        setStep('qr');
      } else {
        toast({ title: 'خطأ', description: data.error, variant: 'destructive' });
      }
    } finally { setLoading(false); }
  };

  const verifyCode = async () => {
    if (code.length !== 6) return;
    setLoading(true);
    try {
      const res = await fetch('/api/auth/2fa/verify-totp-setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok) {
        toast({ title: '✅ تم تفعيل TOTP بنجاح!' });
        onDone();
      } else {
        toast({ title: 'رمز غير صحيح', description: data.error, variant: 'destructive' });
        setCode('');
      }
    } finally { setLoading(false); }
  };

  if (step === 'idle') {
    return (
      <button
        onClick={startSetup}
        disabled={loading}
        data-testid="button-setup-totp"
        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Smartphone className="w-4 h-4" />}
        إعداد تطبيق المصادقة
      </button>
    );
  }

  if (step === 'qr') {
    return (
      <div className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          امسح رمز QR التالي بتطبيق مصادقة (Google Authenticator، Authy، أو أي تطبيق TOTP):
        </p>
        <div className="flex justify-center">
          <img src={qrDataUrl} alt="QR Code" className="w-48 h-48 rounded-xl border border-gray-200 dark:border-gray-700 bg-white p-2" data-testid="img-totp-qr" />
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">أو أدخل المفتاح يدوياً:</p>
          <code className="text-sm font-mono text-gray-800 dark:text-gray-200 select-all break-all" data-testid="text-totp-secret">{secret}</code>
        </div>
        <button
          onClick={() => setStep('verify')}
          data-testid="button-totp-next"
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
        >
          التالي — أدخل رمز التحقق <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
        افتح التطبيق وأدخل الرمز المكوّن من 6 أرقام:
      </p>
      <input
        type="text"
        inputMode="numeric"
        maxLength={6}
        placeholder="000000"
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
        data-testid="input-totp-verify"
        className="w-full text-center text-2xl font-mono tracking-[0.5em] py-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
      />
      <button
        onClick={verifyCode}
        disabled={loading || code.length !== 6}
        data-testid="button-totp-verify"
        className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
        تفعيل
      </button>
      <button onClick={() => setStep('qr')} className="w-full text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
        ← الرجوع لرمز QR
      </button>
    </div>
  );
}

// ─── Recovery Passphrase Setup ───
function RecoverySetup({ onDone }: { onDone: () => void }) {
  const { toast } = useToast();
  const [passphrase, setPassphrase] = useState('');
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);

  const save = async () => {
    if (passphrase.trim().length < 8) {
      toast({ title: 'قصيرة جداً', description: 'يجب أن تكون 8 أحرف على الأقل', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/2fa/set-recovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passphrase }),
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok) { toast({ title: '✅ تم حفظ عبارة الاسترداد' }); onDone(); }
      else toast({ title: 'خطأ', description: data.error, variant: 'destructive' });
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-3">
      <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3 flex gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-700 dark:text-amber-400">
          احفظ هذه العبارة في مكان آمن. ستحتاجها إذا فقدت الوصول لجميع طرق التحقق الأخرى.
        </p>
      </div>
      <div className="relative">
        <KeyRound className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type={show ? 'text' : 'password'}
          placeholder="عبارة سرية طويلة يسهل تذكرها..."
          value={passphrase}
          onChange={(e) => setPassphrase(e.target.value)}
          data-testid="input-recovery-passphrase"
          className="w-full pr-10 pl-10 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40 text-sm"
        />
        <button type="button" onClick={() => setShow(!show)} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      <button
        onClick={save}
        disabled={loading || passphrase.trim().length < 8}
        data-testid="button-save-recovery"
        className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Lock className="w-4 h-4" />}
        حفظ عبارة الاسترداد
      </button>
    </div>
  );
}

// ─── Section Card ───
function SectionCard({ title, icon, badge, badgeColor, children, defaultOpen = false }: {
  title: string; icon: any; badge?: string; badgeColor?: string; children: any; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
        data-testid={`section-${title}`}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            {icon}
          </div>
          <span className="font-semibold text-gray-900 dark:text-white text-sm">{title}</span>
          {badge && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badgeColor || 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'}`}>
              {badge}
            </span>
          )}
        </div>
        <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-90' : ''}`} />
      </button>
      {open && <div className="p-4 pt-0 border-t border-gray-100 dark:border-gray-800">{children}</div>}
    </div>
  );
}

// ─── Main Page ───
export default function SecuritySettingsPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<SecurityStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);

  // PIN state
  const [pinValue, setPinValue] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [pinLoading, setPinLoading] = useState(false);
  const [showPin, setShowPin] = useState(false);

  const fetchStatus = async () => {
    setLoadingStatus(true);
    try {
      const res = await fetch('/api/auth/2fa/status', { credentials: 'include' });
      if (res.ok) setStatus(await res.json());
      else if (res.status === 401) setLocation('/login');
    } finally { setLoadingStatus(false); }
  };

  useEffect(() => { fetchStatus(); }, []);

  const handleSetPin = async () => {
    if (!/^\d{4,8}$/.test(pinValue)) {
      toast({ title: 'غير صحيح', description: 'الرمز يجب أن يكون 4-8 أرقام', variant: 'destructive' });
      return;
    }
    if (pinValue !== pinConfirm) {
      toast({ title: 'غير متطابق', description: 'الرمزان غير متطابقان', variant: 'destructive' });
      return;
    }
    setPinLoading(true);
    try {
      const res = await fetch('/api/auth/set-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pinValue }),
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok) {
        toast({ title: '✅ تم تعيين الرمز السري' });
        setPinValue(''); setPinConfirm('');
        fetchStatus();
      } else {
        toast({ title: 'خطأ', description: data.error, variant: 'destructive' });
      }
    } finally { setPinLoading(false); }
  };

  const disableTOTP = async () => {
    if (!confirm('هل أنت متأكد من إلغاء تفعيل TOTP؟')) return;
    const res = await fetch('/api/auth/2fa/disable-totp', { method: 'POST', credentials: 'include' });
    if (res.ok) { toast({ title: 'تم إلغاء TOTP' }); fetchStatus(); }
  };

  if (loadingStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir="rtl">
        <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-24" dir="rtl">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => setLocation(-1 as any)}
            data-testid="button-back"
            className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">الأمان والخصوصية</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">إدارة طرق تسجيل الدخول والتحقق الثنائي</p>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-4">

        {/* Status Summary */}
        <div className={`rounded-2xl p-4 border flex items-start gap-3 ${
          status?.twoFactorEnabled
            ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
            : 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800'
        }`} data-testid="section-security-status">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
            status?.twoFactorEnabled ? 'bg-green-100 dark:bg-green-900/30' : 'bg-amber-100 dark:bg-amber-900/30'
          }`}>
            {status?.twoFactorEnabled
              ? <Shield className="w-5 h-5 text-green-600 dark:text-green-400" />
              : <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />}
          </div>
          <div>
            <p className={`font-semibold text-sm ${status?.twoFactorEnabled ? 'text-green-800 dark:text-green-300' : 'text-amber-800 dark:text-amber-300'}`}>
              {status?.twoFactorEnabled ? 'حسابك محمي بالتحقق الثنائي' : 'التحقق الثنائي غير مفعّل'}
            </p>
            <p className={`text-xs mt-0.5 ${status?.twoFactorEnabled ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}>
              {status?.twoFactorEnabled
                ? `الطرق المفعّلة: ${(status.twoFactorMethods || []).join(' • ')}`
                : 'فعّل أياً من الطرق أدناه لزيادة أمان حسابك'}
            </p>
          </div>
        </div>

        {/* TOTP Section */}
        <SectionCard
          title="تطبيق المصادقة (TOTP)"
          icon={<Smartphone className="w-4 h-4 text-blue-500" />}
          badge={status?.hasTOTP ? 'مفعّل' : undefined}
          badgeColor={status?.hasTOTP ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : undefined}
        >
          <div className="pt-3 space-y-3">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              استخدم Google Authenticator أو Authy أو أي تطبيق TOTP لتوليد رمز جديد كل 30 ثانية.
            </p>
            {status?.hasTOTP ? (
              <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/20 rounded-xl border border-green-200 dark:border-green-800">
                <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                <span className="text-sm text-green-700 dark:text-green-400 flex-1">تطبيق المصادقة مُفعَّل</span>
                <button
                  onClick={disableTOTP}
                  data-testid="button-disable-totp"
                  className="text-xs text-red-500 hover:text-red-700 hover:underline transition-colors"
                >
                  إلغاء
                </button>
              </div>
            ) : (
              <TOTPSetup onDone={fetchStatus} />
            )}
          </div>
        </SectionCard>

        {/* Quick PIN Section */}
        <SectionCard
          title="رمز PIN السريع"
          icon={<Hash className="w-4 h-4 text-green-500" />}
          badge={status?.hasPIN ? 'مضبوط' : undefined}
          badgeColor="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
        >
          <div className="pt-3 space-y-3">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              رمز من 4-8 أرقام للدخول السريع بدلاً من كلمة المرور.
            </p>
            {status?.hasPIN && (
              <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/20 rounded-xl border border-green-200 dark:border-green-800">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-700 dark:text-green-400">رمز PIN مضبوط — يمكنك تغييره أدناه</span>
              </div>
            )}
            <div className="space-y-2">
              <div className="relative">
                <Hash className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showPin ? 'text' : 'password'}
                  inputMode="numeric"
                  maxLength={8}
                  placeholder="رمز PIN (4-8 أرقام)"
                  value={pinValue}
                  onChange={(e) => setPinValue(e.target.value.replace(/\D/g, ''))}
                  data-testid="input-new-pin"
                  className="w-full pr-10 pl-10 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500/40"
                />
                <button type="button" onClick={() => setShowPin(!showPin)} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <input
                type={showPin ? 'text' : 'password'}
                inputMode="numeric"
                maxLength={8}
                placeholder="تأكيد الرمز"
                value={pinConfirm}
                onChange={(e) => setPinConfirm(e.target.value.replace(/\D/g, ''))}
                data-testid="input-confirm-pin"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500/40"
              />
              <button
                onClick={handleSetPin}
                disabled={pinLoading || !pinValue || !pinConfirm}
                data-testid="button-set-pin"
                className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {pinLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Lock className="w-4 h-4" />}
                {status?.hasPIN ? 'تغيير الرمز' : 'تعيين الرمز'}
              </button>
            </div>
          </div>
        </SectionCard>

        {/* Passkey / Biometric */}
        <SectionCard
          title="بصمة الإصبع أو الوجه (Passkey)"
          icon={<Fingerprint className="w-4 h-4 text-green-700" />}
          badge={status?.hasPasskey ? 'مفعّل' : undefined}
          badgeColor="bg-green-100 dark:bg-green-100/30 text-green-700 dark:text-green-700"
        >
          <div className="pt-3 space-y-3">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              استخدم مستشعر البصمة أو التعرف على الوجه في جهازك لتسجيل الدخول بأمان تام.
            </p>
            {status?.hasPasskey ? (
              <div className="flex items-center gap-2 p-3 bg-green-100 dark:bg-green-100/20 rounded-xl border border-green-400 dark:border-green-400">
                <CheckCircle2 className="w-4 h-4 text-green-700" />
                <span className="text-sm text-green-700 dark:text-green-700">بصمة مسجّلة على هذا الجهاز</span>
              </div>
            ) : (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                  <Info className="w-4 h-4 flex-shrink-0" />
                  <p className="text-xs">اذهب إلى صفحة الملف الشخصي لإضافة البصمة من جهازك</p>
                </div>
              </div>
            )}
          </div>
        </SectionCard>

        {/* Email OTP */}
        <SectionCard
          title="رمز عبر البريد الإلكتروني"
          icon={<Mail className="w-4 h-4 text-cyan-500" />}
          badge="متاح دائماً"
          badgeColor="bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400"
        >
          <div className="pt-3">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              عند تسجيل الدخول، يمكنك طلب رمز مؤقت يُرسل إلى بريدك الإلكتروني المسجّل. الرمز صالح لمدة 10 دقائق.
            </p>
          </div>
        </SectionCard>

        {/* Push Approval */}
        <SectionCard
          title="موافقة فورية (Push)"
          icon={<CheckCircle2 className="w-4 h-4 text-teal-700" />}
          badge="متاح دائماً"
          badgeColor="bg-teal-100 dark:bg-teal-100/30 text-teal-700 dark:text-teal-700"
        >
          <div className="pt-3">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              عند تسجيل الدخول، سيُعرض عليك 3 أرقام عشوائية وتختار الرقم الصحيح لتأكيد هويتك. يصعب تخمينه.
            </p>
          </div>
        </SectionCard>

        {/* Recovery Passphrase */}
        <SectionCard
          title="عبارة الاسترداد الاحتياطية"
          icon={<KeyRound className="w-4 h-4 text-amber-500" />}
          badge={status?.hasRecovery ? 'مضبوطة' : undefined}
          badgeColor="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
        >
          <div className="pt-3 space-y-3">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              عبارة سرية احتياطية تُستخدم إذا فقدت الوصول لجميع طرق التحقق الأخرى.
            </p>
            {status?.hasRecovery ? (
              <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-800">
                <CheckCircle2 className="w-4 h-4 text-amber-500" />
                <span className="text-sm text-amber-700 dark:text-amber-400 flex-1">عبارة الاسترداد مضبوطة</span>
                <button
                  onClick={() => fetchStatus()}
                  data-testid="button-change-recovery"
                  className="text-xs text-amber-600 hover:text-amber-800 hover:underline"
                >
                  تغيير
                </button>
              </div>
            ) : (
              <RecoverySetup onDone={fetchStatus} />
            )}
          </div>
        </SectionCard>

      </div>
    </div>
  );
}
