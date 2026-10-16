import { FormEvent, useEffect, useState } from 'react';
import { ArrowRight, KeyRound, Loader2, LockKeyhole, Mail, ShieldCheck, UserRound } from 'lucide-react';
import { setAdminAccessToken } from '@/lib/adminSession';
import { ThemeToggle } from '@/components/ThemeToggle';

type BootstrapStatus = {
  available: boolean;
  recoveryAvailable: boolean;
  reason: 'available' | 'recovery_available' | 'already_configured' | 'already_recovered' | 'multiple_admins' | 'production_disabled' | 'preview_only' | 'database_unavailable' | 'bootstrap_secret_missing';
};

const reasonCopy: Record<BootstrapStatus['reason'], string> = {
  available: 'المعاينة جاهزة لإنشاء أول حساب إدارة.',
  recovery_available: 'يمكن استعادة بيانات الدخول لسجل الإدارة الوحيد في قاعدة بيانات المعاينة.',
  already_configured: 'تم إعداد حساب الإدارة بالفعل. استخدم صفحة تسجيل الدخول؛ لن يتيح هذا الإعداد تغيير بياناته مرة أخرى.',
  already_recovered: 'تمت استعادة حساب الإدارة مرة واحدة بالفعل. استخدم صفحة تسجيل الدخول بالبيانات الجديدة.',
  multiple_admins: 'توجد عدة سجلات إدارة. لم يتم تغيير أي حساب؛ يلزم تحديد الحساب المقصود أولًا.',
  production_disabled: 'إعداد الحساب الأول متاح في معاينة Replit فقط، وليس على الموقع المنشور.',
  preview_only: 'إعداد الحساب الأول يعمل في معاينة Replit فقط.',
  database_unavailable: 'قاعدة بيانات المعاينة غير متاحة الآن. أعد تشغيل خدمة API ثم حاول مرة أخرى.',
  bootstrap_secret_missing: 'أضف ADMIN_BOOTSTRAP_TOKEN إلى أسرار Replit بقيمة سرية لا تقل عن 32 حرفًا، ثم أعد تحميل الصفحة. أدخل القيمة نفسها في النموذج.',
};

const inputClassName = 'h-12 w-full rounded-xl border border-[#24202D]/15 bg-[#FFFCF7] px-4 text-sm text-[#24202D] outline-none transition-colors placeholder:text-[#9E99A2] focus:border-[#B65D36] focus:ring-2 focus:ring-[#F4AA85]/30';

export default function AdminSetupPage() {
  const [status, setStatus] = useState<BootstrapStatus | null>(null);
  const [statusError, setStatusError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [bootstrapToken, setBootstrapToken] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    let cancelled = false;
    fetch('/api/admin/bootstrap/status', { credentials: 'include', cache: 'no-store' })
      .then(async response => {
        const data = await response.json().catch(() => null);
        if (!response.ok) throw new Error(data?.error || 'تعذر التحقق من إعداد الإدارة.');
        return data as BootstrapStatus;
      })
      .then(data => {
        if (!cancelled) setStatus(data);
      })
      .catch((requestError: Error) => {
        if (!cancelled) setStatusError(requestError.message || 'تعذر الاتصال بخدمة الإدارة.');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('كلمتا المرور غير متطابقتين.');
      return;
    }
    if (password.length < 14) {
      setError('استخدم كلمة مرور لا تقل عن 14 حرفًا.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(recoveryAvailable ? '/api/admin/recovery' : '/api/admin/bootstrap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        cache: 'no-store',
        body: JSON.stringify({ bootstrapToken, username, fullName, email, password }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success) throw new Error(data.error || 'تعذر إنشاء حساب الإدارة.');

      setBootstrapToken('');
      setPassword('');
      setConfirmPassword('');
      setAdminAccessToken(data.adminAccessToken);
      const sessionResponse = await fetch('/api/admin/session', {
        credentials: 'include',
        cache: 'no-store',
      });
      const session = await sessionResponse.json().catch(() => null);
      if (!sessionResponse.ok || !session?.authenticated) {
        throw new Error('تم إنشاء الحساب. سجّل الدخول من صفحة الإدارة باستخدام البيانات التي اخترتها.');
      }
      window.location.replace('/admin/dashboard');
    } catch (requestError: any) {
      setError(requestError.message || 'تعذر إنشاء حساب الإدارة.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const available = status?.available === true;
  const recoveryAvailable = status?.recoveryAvailable === true;
  const formAvailable = available || recoveryAvailable;

  return (
    <main className="qodratak-admin-login-surface min-h-screen bg-[#F7F4EE] px-4 py-8 text-[#24202D]" dir="rtl">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-3xl items-center">
        <section className="relative w-full overflow-hidden rounded-3xl border border-[#24202D]/10 bg-[#FFFCF7] p-6 shadow-[0_18px_50px_rgba(36,32,45,0.08)] sm:p-10">
          <div className="absolute left-4 top-4"><ThemeToggle /></div>
          <a href="/admin/login" className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-[#625D69] hover:text-[#24202D]">
            <ArrowRight className="h-4 w-4" />
            العودة إلى دخول الإدارة
          </a>

          <div className="mb-7 flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F4AA85]/20 text-[#B65D36]">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-[#B65D36]">إعداد محمي لمعاينة Replit</p>
              <h1 className="mt-1 text-2xl font-bold">{recoveryAvailable ? 'استعادة الدخول إلى حساب الإدارة' : 'إنشاء أول حساب إدارة'}</h1>
              <p className="mt-2 text-sm leading-6 text-[#625D69]">
                {recoveryAvailable
                  ? 'تحديث بيانات السجل الإداري الموجود في المعاينة فقط؛ لن يؤثر على الموقع المنشور.'
                  : 'هذا الإعداد يعمل مرة واحدة فقط، ولا ينشئ حسابًا على الموقع المنشور.'}
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center gap-3 rounded-2xl border border-[#24202D]/10 bg-[#F7F4EE] px-4 py-4 text-sm text-[#625D69]">
              <Loader2 className="h-4 w-4 animate-spin text-[#B65D36]" />
              جارٍ التحقق من جاهزية الإعداد...
            </div>
          ) : statusError ? (
            <div role="alert" className="rounded-2xl border border-red-300 bg-red-50 p-4 text-sm leading-6 text-red-800">{statusError}</div>
          ) : !formAvailable && status ? (
            <div role="status" className="rounded-2xl border border-[#24202D]/10 bg-[#F7F4EE] p-4 text-sm leading-7 text-[#625D69]">
              {reasonCopy[status.reason]}
            </div>
          ) : (
            <>
              <p className="mb-5 rounded-2xl border border-[#F4AA85]/40 bg-[#F4AA85]/10 p-4 text-sm leading-6 text-[#5B3D31]">
                {recoveryAvailable
                  ? 'سيتم تحديث بيانات الدخول للسجل الوحيد، مع الحفاظ على دوره وصلاحياته، وإعادة تفعيله إذا كان موقوفًا. لن يتم اختيار حساب عشوائي.'
                  : 'أنشئ بياناتك بنفسك هنا. لن تظهر كلمة المرور أو رمز الإعداد في المحادثة أو في سجلات الخادم.'}
              </p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium">رمز الإعداد السري</span>
                  <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8E8993]" />
                    <input required type="password" minLength={32} maxLength={512} autoComplete="off" value={bootstrapToken} onChange={event => setBootstrapToken(event.target.value)} placeholder="القيمة التي أضفتها إلى Replit Secrets" className={`${inputClassName} pr-10`} />
                  </div>
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium">الاسم الكامل</span>
                    <div className="relative">
                      <UserRound className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8E8993]" />
                      <input required minLength={2} maxLength={100} autoComplete="name" value={fullName} onChange={event => setFullName(event.target.value)} placeholder="اسمك" className={`${inputClassName} pr-10`} />
                    </div>
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium">اسم المستخدم</span>
                    <div className="relative">
                      <KeyRound className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8E8993]" />
                      <input required minLength={3} maxLength={32} pattern="[A-Za-z0-9_.-]+" autoComplete="username" value={username} onChange={event => setUsername(event.target.value)} placeholder="حروف إنجليزية وأرقام و . _ -" className={`${inputClassName} pr-10`} />
                    </div>
                  </label>
                </div>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium">البريد الإلكتروني</span>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8E8993]" />
                    <input required type="email" maxLength={254} autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="name@example.com" className={`${inputClassName} pr-10`} />
                  </div>
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium">كلمة المرور (14 حرفًا على الأقل)</span>
                    <input required type="password" minLength={14} maxLength={128} autoComplete="new-password" value={password} onChange={event => setPassword(event.target.value)} className={inputClassName} />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium">تأكيد كلمة المرور</span>
                    <input required type="password" minLength={14} maxLength={128} autoComplete="new-password" value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} className={inputClassName} />
                  </label>
                </div>
                {error && <p role="alert" className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm leading-6 text-red-800">{error}</p>}
                <button type="submit" disabled={isSubmitting} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#24202D] text-sm font-bold text-[#FFFCF7] transition-colors hover:bg-[#393343] disabled:cursor-not-allowed disabled:opacity-60">
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                  {isSubmitting ? (recoveryAvailable ? 'جارٍ استعادة الدخول...' : 'جارٍ إنشاء الحساب...') : (recoveryAvailable ? 'حفظ بيانات الدخول والدخول' : 'إنشاء الحساب والدخول')}
                </button>
                <p className="text-xs leading-5 text-[#77717D]">
                  بعد {recoveryAvailable ? 'استعادة الدخول' : 'إنشاء الحساب'}، احذف ADMIN_BOOTSTRAP_TOKEN من أسرار Replit؛ ستبقى بياناتك صالحة ويُغلق هذا الإعداد تلقائيًا.
                </p>
              </form>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
