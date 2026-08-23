import { FormEvent, useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowRight, KeyRound, Loader2, LockKeyhole, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    let isMounted = true;

    fetch('/api/admin/session', { credentials: 'include' })
      .then(async response => ({ ok: response.ok, body: await response.json().catch(() => null) }))
      .then(({ ok, body }) => {
        if (isMounted && ok && body?.authenticated) {
          setLocation('/admin/dashboard');
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (isMounted) setCheckingSession(false);
      });

    return () => {
      isMounted = false;
    };
  }, [setLocation]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!username.trim() || !password) {
      toast({
        title: 'أكمل بيانات الدخول',
        description: 'أدخل اسم المستخدم وكلمة المرور.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'تعذر تسجيل الدخول');
      }

      queryClient.removeQueries({ queryKey: ['/api/admin/session'] });
      queryClient.removeQueries({ queryKey: ['/api/admin/dashboard/stats'] });
      toast({ title: 'مرحبًا بك في الإدارة', description: 'تم التحقق من جلستك بنجاح.' });
      setLocation('/admin/dashboard');
    } catch (error: any) {
      toast({
        title: 'تعذر تسجيل الدخول',
        description: error.message || 'تحقق من البيانات وحاول مجددًا.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F7F4EE] px-4 py-8 text-[#24202D]" dir="rtl">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl items-center">
        <div className="grid w-full overflow-hidden rounded-3xl border border-[#24202D]/10 bg-[#FFFCF7] shadow-[0_18px_50px_rgba(36,32,45,0.08)] md:grid-cols-[0.92fr_1.08fr]">
          <section className="hidden bg-[#24202D] p-10 text-[#FFFCF7] md:flex md:flex-col md:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FFFCF7]">
                <img src="/qodratak-logo-transparent.png" alt="قدراتك" className="h-9 w-9 object-contain" />
              </div>
              <div>
                <p className="font-bold">قدراتك</p>
                <p className="mt-0.5 text-xs text-[#FFFCF7]/65">بوابة الإدارة</p>
              </div>
            </div>

            <div>
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FFFCF7]/10">
                <ShieldCheck className="h-6 w-6 text-[#F4AA85]" />
              </div>
              <h1 className="text-2xl font-bold leading-relaxed">إدارة واضحة، في مكان واحد.</h1>
              <p className="mt-3 max-w-sm text-sm leading-7 text-[#FFFCF7]/70">
                استخدم حساب الإدارة المصرح لك للوصول إلى الطلاب والمؤسسات والاشتراكات.
              </p>
            </div>

            <p className="text-xs text-[#FFFCF7]/45">وصول آمن ومخصص لفريق الإدارة.</p>
          </section>

          <section className="px-6 py-9 sm:px-10 md:py-12">
            <button
              type="button"
              onClick={() => setLocation('/')}
              className="mb-9 inline-flex items-center gap-2 text-sm text-[#625D69] transition-colors hover:text-[#24202D]"
            >
              <ArrowRight className="h-4 w-4" />
              العودة للرئيسية
            </button>

            <div className="mb-8">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F4AA85]/20 text-[#B65D36] md:hidden">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <p className="text-sm font-medium text-[#B65D36]">مساحة الإدارة</p>
              <h2 className="mt-2 text-2xl font-bold">تسجيل الدخول</h2>
              <p className="mt-2 text-sm leading-6 text-[#625D69]">أدخل بيانات حساب الإدارة للمتابعة.</p>
            </div>

            {checkingSession ? (
              <div className="flex items-center gap-3 rounded-2xl border border-[#24202D]/10 bg-[#F7F4EE] px-4 py-4 text-sm text-[#625D69]">
                <Loader2 className="h-4 w-4 animate-spin text-[#B65D36]" />
                جارٍ التحقق من الجلسة...
              </div>
            ) : (
              <>
                {import.meta.env.DEV && (
                  <button
                    type="button"
                    onClick={() => {
                      setUsername('admin-demo');
                      setPassword('AdminDemo@2026');
                    }}
                    className="mb-5 w-full rounded-xl border border-[#B65D36]/20 bg-[#F4AA85]/10 px-3 py-2.5 text-sm font-medium text-[#8D482C] transition-colors hover:bg-[#F4AA85]/20"
                  >
                    تعبئة حساب الإدارة التجريبي
                  </button>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium">اسم المستخدم أو البريد</span>
                    <div className="relative">
                      <KeyRound className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8E8993]" />
                      <input
                        type="text"
                        value={username}
                        onChange={event => setUsername(event.target.value)}
                        autoComplete="username"
                        placeholder="اسم المستخدم أو البريد"
                        className="h-12 w-full rounded-xl border border-[#24202D]/15 bg-[#FFFCF7] pr-10 pl-4 text-sm outline-none transition-colors placeholder:text-[#9E99A2] focus:border-[#B65D36] focus:ring-2 focus:ring-[#F4AA85]/30"
                      />
                    </div>
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-medium">كلمة المرور</span>
                    <div className="relative">
                      <LockKeyhole className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8E8993]" />
                      <input
                        type="password"
                        value={password}
                        onChange={event => setPassword(event.target.value)}
                        autoComplete="current-password"
                        placeholder="كلمة المرور"
                        className="h-12 w-full rounded-xl border border-[#24202D]/15 bg-[#FFFCF7] pr-10 pl-4 text-sm outline-none transition-colors placeholder:text-[#9E99A2] focus:border-[#B65D36] focus:ring-2 focus:ring-[#F4AA85]/30"
                      />
                    </div>
                  </label>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#24202D] text-sm font-bold text-[#FFFCF7] transition-colors hover:bg-[#393343] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                    {isLoading ? 'جارٍ تسجيل الدخول...' : 'الدخول إلى لوحة الإدارة'}
                  </button>
                </form>
              </>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}