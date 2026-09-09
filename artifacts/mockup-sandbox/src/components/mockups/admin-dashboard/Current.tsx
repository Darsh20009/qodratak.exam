import './_group.css';

import {
  Activity,
  AlertCircle,
  ArrowUpLeft,
  BarChart3,
  Bell,
  BookOpen,
  CheckCircle2,
  CreditCard,
  Database,
  FileText,
  Mail,
  Server,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';

interface DashboardStats {
  users: {
    totalUsers: number;
    activeToday: number;
    activeThisWeek: number;
    newUsersToday: number;
  };
  subscriptions: {
    activeSubscriptions: number;
    revenueThisMonth: number;
    newSubscriptionsToday: number;
    newSubscriptionsThisWeek: number;
    expiredSubscriptions: number;
  };
  tests: {
    totalTests: number;
    testsToday: number;
    averageScore: number;
    testsByType?: Record<string, number>;
  };
}

const mockStats: DashboardStats = {
  users: { totalUsers: 12840, activeToday: 4862, activeThisWeek: 9180, newUsersToday: 184 },
  subscriptions: {
    activeSubscriptions: 7340,
    revenueThisMonth: 186450,
    newSubscriptionsToday: 96,
    newSubscriptionsThisWeek: 612,
    expiredSubscriptions: 428,
  },
  tests: {
    totalTests: 68720,
    testsToday: 1296,
    averageScore: 78.4,
    testsByType: { 'القدرات الكمية': 28400, 'القدرات اللفظية': 22100, 'التحصيلي': 12800, 'اختبارات محاكية': 5420 },
  },
};

const number = (value: number) => new Intl.NumberFormat('ar-SA').format(value || 0);
const money = (value: number) => `${number(value)} ر.س`;

function Sparkline({ values, color }: { values: number[]; color: string }) {
  const max = Math.max(...values, 1);
  const points = values.map((value, index) => {
    const x = (index / Math.max(values.length - 1, 1)) * 100;
    const y = 34 - (value / max) * 27;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="h-12 w-28 overflow-visible" aria-hidden="true">
      <path d={`M ${points} L 100 40 L 0 40 Z`} fill={color} opacity="0.12" />
      <polyline points={points} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={100} cy={Number(points.split(' ').at(-1)?.split(',')[1] || 34)} r="2.5" fill={color} />
    </svg>
  );
}

function MetricCard({
  label, value, helper, icon: Icon, accent, values,
}: {
  label: string; value: string; helper: string; icon: typeof Users; accent: string; values: number[];
}) {
  return (
    <article className="group relative overflow-hidden rounded-[1.35rem] border border-white/[0.08] bg-[#0d1c2c] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.18)] transition-transform duration-300 hover:-translate-y-1">
      <div className="absolute -left-8 -top-10 h-28 w-28 rounded-full opacity-20 blur-2xl" style={{ backgroundColor: accent }} />
      <div className="relative flex items-start justify-between gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06]" style={{ color: accent }}><Icon className="h-5 w-5" /></span>
        <Sparkline values={values} color={accent} />
      </div>
      <p className="relative mt-5 text-xs font-medium text-slate-400">{label}</p>
      <p className="relative mt-1 text-2xl font-black tracking-tight text-white">{value}</p>
      <p className="relative mt-2 flex items-center gap-1 text-xs text-slate-500"><ArrowUpLeft className="h-3.5 w-3.5 text-[#b8f36b]" />{helper}</p>
    </article>
  );
}

function StatusRow({ icon: Icon, label, detail, tone = 'ok' }: { icon: typeof Database; label: string; detail: string; tone?: 'ok' | 'warn' }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.025] px-3 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${tone === 'ok' ? 'bg-[#b8f36b]/10 text-[#b8f36b]' : 'bg-amber-300/10 text-amber-300'}`}><Icon className="h-4 w-4" /></span>
        <span className="truncate text-sm text-slate-300">{label}</span>
      </div>
      <span className={`shrink-0 text-xs font-semibold ${tone === 'ok' ? 'text-[#b8f36b]' : 'text-amber-300'}`}>{detail}</span>
    </div>
  );
}

export function Current() {
  const stats = mockStats;
  const pendingSubCount = 23;
  const pendingInstCount = 7;
  const onNavigate = (_tab: string) => {};
  const testTypes = Object.entries(stats.tests.testsByType || {}).sort(([, a], [, b]) => b - a).slice(0, 5);
  const maxTestCount = Math.max(...testTypes.map(([, value]) => value), 1);
  const activeRatio = Math.round((stats.users.activeToday / stats.users.totalUsers) * 100);
  const subscriptionRatio = Math.min(100, Math.round((stats.subscriptions.activeSubscriptions / stats.users.totalUsers) * 100));

  return (
    <div dir="rtl" className="min-h-screen space-y-6 bg-[#081522] p-4 text-right md:p-8">
      <section className="relative isolate overflow-hidden rounded-[1.75rem] border border-[#b8f36b]/20 bg-[linear-gradient(135deg,#12283a_0%,#0b1827_55%,#101d2d_100%)] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.25)] md:p-8">
        <div className="pointer-events-none absolute -left-24 -top-32 h-80 w-80 rounded-full bg-[#b8f36b]/10 blur-3xl" /><div className="pointer-events-none absolute -bottom-28 right-20 h-64 w-64 rounded-full bg-cyan-300/10 blur-3xl" /><div className="pointer-events-none absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.08)_1px,transparent_1px)] [background-size:32px_32px]" />
        <div className="relative flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
          <div className="max-w-2xl"><div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#b8f36b]/20 bg-[#b8f36b]/10 px-3 py-1.5 text-xs font-bold text-[#d7ffa1]"><Sparkles className="h-3.5 w-3.5" />مركز قيادة قدراتك</div><h2 className="text-3xl font-black tracking-tight text-white md:text-4xl">صورة واضحة لاتجاه المنصة</h2><p className="mt-3 max-w-xl text-sm leading-7 text-slate-300 md:text-base">راقب نشاط الطلاب، صحة الاشتراكات وأداء الاختبارات من مساحة واحدة، واتخذ الإجراء المناسب قبل أن تتحول الإشارة إلى مشكلة.</p></div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3"><div className="rounded-2xl border border-white/10 bg-black/10 px-4 py-3 backdrop-blur"><p className="text-[10px] font-bold text-slate-500">نشاط اليوم</p><p className="mt-1 text-xl font-black text-[#b8f36b]">{activeRatio}%</p></div><div className="rounded-2xl border border-white/10 bg-black/10 px-4 py-3 backdrop-blur"><p className="text-[10px] font-bold text-slate-500">متوسط الدرجات</p><p className="mt-1 text-xl font-black text-white">{stats.tests.averageScore.toFixed(1)}%</p></div><div className="col-span-2 rounded-2xl border border-white/10 bg-black/10 px-4 py-3 backdrop-blur sm:col-span-1"><p className="text-[10px] font-bold text-slate-500">تدفق اليوم</p><p className="mt-1 text-xl font-black text-cyan-200">{number(stats.tests.testsToday)} اختبار</p></div></div>
        </div>
      </section>
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="إجمالي الطلاب" value={number(stats.users.totalUsers)} helper={`+${number(stats.users.newUsersToday)} طالب اليوم`} icon={Users} accent="#7dd3fc" values={[12, 18, 15, 24, 22, stats.users.totalUsers]} />
        <MetricCard label="نشاط الطلاب اليوم" value={number(stats.users.activeToday)} helper={`${number(stats.users.activeThisWeek)} خلال الأسبوع`} icon={Activity} accent="#b8f36b" values={[8, 12, 10, 17, 21, stats.users.activeToday]} />
        <MetricCard label="اشتراكات نشطة" value={number(stats.subscriptions.activeSubscriptions)} helper={`+${number(stats.subscriptions.newSubscriptionsThisWeek)} هذا الأسبوع`} icon={CreditCard} accent="#c4b5fd" values={[9, 14, 13, 19, 24, stats.subscriptions.activeSubscriptions]} />
        <MetricCard label="إيرادات الشهر" value={money(stats.subscriptions.revenueThisMonth)} helper={`${number(stats.subscriptions.newSubscriptionsToday)} اشتراك جديد اليوم`} icon={TrendingUp} accent="#fbbf24" values={[5, 10, 8, 16, 14, stats.subscriptions.revenueThisMonth]} />
      </section>
      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.85fr]">
        <article className="rounded-[1.5rem] border border-white/[0.08] bg-[#0d1c2c] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.16)] md:p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="flex items-center gap-2 text-sm font-bold text-white"><BarChart3 className="h-4 w-4 text-[#b8f36b]" />خريطة الاختبارات</p><p className="mt-1 text-xs text-slate-500">توزيع المحاولات حسب نوع الاختبار</p></div><span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-400">{number(stats.tests.totalTests)} إجمالي</span></div><div className="mt-7 space-y-4">{testTypes.map(([label, value], index) => <div key={label}><div className="mb-2 flex items-center justify-between gap-3 text-xs"><span className="text-slate-300">{label}</span><span className="font-bold text-white">{number(value)}</span></div><div className="h-2 overflow-hidden rounded-full bg-white/[0.06]"><div className={`h-full rounded-full ${index % 3 === 0 ? 'bg-[#b8f36b]' : index % 3 === 1 ? 'bg-cyan-300' : 'bg-violet-300'}`} style={{ width: `${Math.max(5, (value / maxTestCount) * 100)}%` }} /></div></div>)}</div><div className="mt-7 grid grid-cols-2 gap-3 border-t border-white/[0.07] pt-5"><div className="rounded-2xl bg-white/[0.035] p-3"><p className="text-[11px] text-slate-500">اختبارات اليوم</p><p className="mt-1 text-xl font-black text-white">{number(stats.tests.testsToday)}</p></div><div className="rounded-2xl bg-white/[0.035] p-3"><p className="text-[11px] text-slate-500">اختبارات منتهية</p><p className="mt-1 text-xl font-black text-white">{number(stats.subscriptions.expiredSubscriptions)}</p></div></div></article>
        <article className="rounded-[1.5rem] border border-white/[0.08] bg-[#0d1c2c] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.16)] md:p-6"><div className="flex items-start justify-between"><div><p className="flex items-center gap-2 text-sm font-bold text-white"><Activity className="h-4 w-4 text-cyan-300" />نبض الاشتراكات</p><p className="mt-1 text-xs text-slate-500">نسبة الاشتراكات النشطة من قاعدة الطلاب</p></div><div className="relative h-20 w-20 rounded-full" style={{ background: `conic-gradient(#b8f36b ${subscriptionRatio}%, rgba(255,255,255,.07) 0)` }}><div className="absolute inset-2 flex flex-col items-center justify-center rounded-full bg-[#0d1c2c]"><span className="text-lg font-black text-white">{subscriptionRatio}%</span><span className="text-[9px] text-slate-500">نشط</span></div></div></div><div className="mt-7 space-y-3"><StatusRow icon={CheckCircle2} label="اشتراكات نشطة" detail={number(stats.subscriptions.activeSubscriptions)} /><StatusRow icon={AlertCircle} label="بانتظار المراجعة" detail={number(pendingSubCount)} tone="warn" /><StatusRow icon={TrendingUp} label="إيرادات هذا الشهر" detail={money(stats.subscriptions.revenueThisMonth)} /></div><button onClick={() => onNavigate('subscriptions')} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] py-3 text-xs font-bold text-slate-300 transition-colors hover:border-[#b8f36b]/40 hover:text-[#d7ffa1]">فتح إدارة الاشتراكات <ArrowUpLeft className="h-4 w-4" /></button></article>
      </section>
      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <article className="rounded-[1.5rem] border border-white/[0.08] bg-[#0d1c2c] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.16)] md:p-6"><p className="flex items-center gap-2 text-sm font-bold text-white"><Zap className="h-4 w-4 text-amber-300" />إجراءات سريعة</p><p className="mt-1 text-xs text-slate-500">اختصارات العمل الأكثر استخدامًا</p><div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-1">{[{ tab: 'subscriptions', label: 'مراجعة الاشتراكات', icon: CreditCard, badge: pendingSubCount }, { tab: 'email', label: 'إرسال بريد جماعي', icon: Mail }, { tab: 'questions', label: 'إدارة بنك الأسئلة', icon: BookOpen }, { tab: 'exams', label: 'عرض الاختبارات المجدولة', icon: FileText }].map(({ tab, label, icon: Icon, badge }) => <button key={tab} onClick={() => onNavigate(tab)} className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.025] px-3 py-3 text-right text-sm text-slate-300 transition-colors hover:border-white/15 hover:bg-white/[0.06] hover:text-white"><Icon className="h-4 w-4 text-cyan-300" /><span className="flex-1">{label}</span>{!!badge && <span className="rounded-full bg-amber-300/15 px-2 py-0.5 text-[10px] font-bold text-amber-200">{badge}</span>}<ArrowUpLeft className="h-3.5 w-3.5 text-slate-600" /></button>)}</div></article>
        <article className="rounded-[1.5rem] border border-white/[0.08] bg-[#0d1c2c] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.16)] md:p-6"><div className="flex items-center justify-between"><div><p className="flex items-center gap-2 text-sm font-bold text-white"><Server className="h-4 w-4 text-[#b8f36b]" />صحة المنصة</p><p className="mt-1 text-xs text-slate-500">المكونات الأساسية تعمل بصورة طبيعية</p></div><span className="flex items-center gap-1.5 rounded-full bg-[#b8f36b]/10 px-3 py-1 text-[10px] font-bold text-[#b8f36b]"><span className="h-1.5 w-1.5 rounded-full bg-[#b8f36b]" />مباشر</span></div><div className="mt-5 grid gap-2 sm:grid-cols-2"><StatusRow icon={Database} label="قاعدة البيانات" detail="متصلة" /><StatusRow icon={Mail} label="خدمة البريد" detail="جاهزة" /><StatusRow icon={Server} label="الخادم" detail="يعمل" /><StatusRow icon={Bell} label="التنبيهات" detail={`${pendingInstCount} معلقة`} tone="warn" /></div><div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-300/20 bg-amber-300/10 p-3 text-xs leading-6 text-amber-100"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />توجد عناصر تحتاج مراجعة: {pendingSubCount} اشتراك و{pendingInstCount} طلب مؤسسة.</div></article>
      </section>
    </div>
  );
}