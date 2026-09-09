import './_group.css';

import { useState } from 'react';
import {
  Activity,
  ArrowUpLeft,
  Bell,
  BookOpen,
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  ChevronLeft,
  CircleAlert,
  Clock3,
  CreditCard,
  Database,
  FileQuestion,
  FileText,
  Gauge,
  Inbox,
  LayoutGrid,
  Mail,
  MoreHorizontal,
  RefreshCw,
  Server,
  Settings2,
  ShieldCheck,
  TrendingUp,
  Users,
  Wifi,
  Zap,
} from 'lucide-react';

interface MetricCardProps {
  eyebrow: string;
  value: string;
  note: string;
  icon: typeof Users;
  tone: 'teal' | 'gold' | 'coral' | 'ink';
  trend?: string;
}

const stats = {
  students: {
    total: 12840,
    activeToday: 4862,
    activeWeek: 9180,
    newToday: 184,
  },
  subscriptions: {
    active: 7340,
    revenue: 186450,
    newToday: 96,
    newWeek: 612,
    expired: 428,
  },
  exams: {
    total: 68720,
    today: 1296,
    average: 78.4,
  },
};

const examTypes = [
  { label: 'القدرات الكمية', value: 28400, share: 41.3, tone: 'bg-[#237f79]' },
  { label: 'القدرات اللفظية', value: 22100, share: 32.2, tone: 'bg-[#c99d4d]' },
  { label: 'التحصيلي', value: 12800, share: 18.6, tone: 'bg-[#dd7868]' },
  { label: 'اختبارات محاكية', value: 5420, share: 7.9, tone: 'bg-[#7c7698]' },
];

const number = (value: number) => new Intl.NumberFormat('ar-SA').format(value);
const money = (value: number) => `${number(value)} ر.س`;

function TinyTrend({ points, tone }: { points: number[]; tone: string }) {
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min || 1;
  const coords = points
    .map((point, index) => {
      const x = (index / (points.length - 1)) * 100;
      const y = 31 - ((point - min) / range) * 23;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg viewBox="0 0 100 36" className="h-10 w-24 overflow-visible" aria-hidden="true">
      <polyline points={coords} fill="none" stroke={tone} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="100" cy={coords.split(' ').at(-1)?.split(',')[1]} r="2.2" fill={tone} />
    </svg>
  );
}

function MetricCard({ eyebrow, value, note, icon: Icon, tone, trend }: MetricCardProps) {
  const styles = {
    teal: { icon: 'bg-[#e0f1ec] text-[#237f79]', line: '#237f79' },
    gold: { icon: 'bg-[#f7edd8] text-[#9a722b]', line: '#c99d4d' },
    coral: { icon: 'bg-[#fae4df] text-[#bd6558]', line: '#dd7868' },
    ink: { icon: 'bg-[#e6e6ef] text-[#5e5a82]', line: '#7c7698' },
  }[tone];

  return (
    <article className="group rounded-[1.35rem] border border-[#dfe4df] bg-[#fbfcf8] p-5 shadow-[0_10px_30px_rgba(31,50,47,0.05)] transition duration-300 hover:-translate-y-0.5 hover:border-[#b9d6cc] hover:shadow-[0_16px_38px_rgba(31,50,47,0.1)]">
      <div className="flex items-start justify-between gap-3">
        <span className={`flex h-10 w-10 items-center justify-center rounded-[0.85rem] ${styles.icon}`}>
          <Icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
        </span>
        <TinyTrend points={trend === 'revenue' ? [7, 9, 8, 11, 10, 14, 16] : trend === 'activity' ? [12, 13, 11, 18, 16, 20, 23] : [9, 11, 10, 12, 14, 15, 17]} tone={styles.line} />
      </div>
      <p className="mt-5 text-[12px] font-semibold tracking-[0.02em] text-[#75807a]">{eyebrow}</p>
      <p className="mt-1 text-[1.65rem] font-extrabold tracking-[-0.04em] text-[#173834]">{value}</p>
      <div className="mt-2 flex items-center gap-1.5 text-[11px] text-[#718078]">
        <TrendingUp className="h-3.5 w-3.5 text-[#237f79]" />
        <span>{note}</span>
      </div>
    </article>
  );
}

function SectionHeading({
  icon: Icon,
  title,
  detail,
  action,
}: {
  icon: typeof Activity;
  title: string;
  detail: string;
  action?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#e8f2ed] text-[#237f79]">
          <Icon className="h-4 w-4" strokeWidth={1.8} />
        </span>
        <div>
          <h2 className="text-[15px] font-extrabold text-[#173834]">{title}</h2>
          <p className="mt-1 text-[11px] leading-5 text-[#86918a]">{detail}</p>
        </div>
      </div>
      {action ? <button type="button" onClick={() => undefined} className="hidden items-center gap-1 text-[11px] font-bold text-[#237f79] transition hover:text-[#175c58] sm:flex">{action}<ChevronLeft className="h-3.5 w-3.5" /></button> : null}
    </div>
  );
}

function StatusItem({ icon: Icon, label, detail, warning = false }: { icon: typeof Database; label: string; detail: string; warning?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-[#e3e8e2] bg-[#f7faf6] px-3.5 py-3">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${warning ? 'bg-[#fff1d9] text-[#b27c2d]' : 'bg-[#e2f1eb] text-[#237f79]'}`}>
          <Icon className="h-3.5 w-3.5" strokeWidth={1.8} />
        </span>
        <span className="truncate text-[12px] font-semibold text-[#53645d]">{label}</span>
      </div>
      <span className={`shrink-0 text-[11px] font-bold ${warning ? 'text-[#b27c2d]' : 'text-[#237f79]'}`}>{detail}</span>
    </div>
  );
}

export function Premium() {
  const [range, setRange] = useState('هذا الأسبوع');
  const [notice, setNotice] = useState('');

  const handleAction = (label: string) => {
    setNotice(`تم اختيار «${label}» — ستظهر التفاصيل في مساحة العمل الخاصة بها.`);
    window.setTimeout(() => setNotice(''), 2800);
  };

  const activeRatio = Math.round((stats.students.activeToday / stats.students.total) * 100);
  const subscriptionRatio = Math.min(100, Math.round((stats.subscriptions.active / stats.students.total) * 100));

  return (
    <main dir="rtl" className="min-h-screen bg-[#f2f5f0] px-3 py-4 text-right text-[#173834] sm:px-5 lg:px-8 lg:py-7">
      <div className="mx-auto max-w-[1480px]">
        <header className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-[1rem] bg-[#173834] text-[#e9d7a8] shadow-[0_8px_20px_rgba(23,56,52,0.16)]">
              <span className="text-lg font-black tracking-[-0.12em]">قـ</span>
            </div>
            <div>
              <p className="text-[11px] font-bold tracking-[0.08em] text-[#7f8c84]">قدرَاتك <span className="mx-1 text-[#c99d4d]">/</span> مساحة العمل</p>
              <h1 className="mt-0.5 text-lg font-extrabold text-[#173834]">نظرة عامة</h1>
            </div>
          </div>
          <div className="flex items-center justify-between gap-3 sm:justify-end">
            <div className="hidden items-center gap-2 rounded-full border border-[#dce4dc] bg-[#f9fbf7] px-3 py-2 text-[11px] font-semibold text-[#6d7b73] sm:flex">
              <span className="h-2 w-2 rounded-full bg-[#4caa78]" />
              آخر تحديث قبل 4 دقائق
            </div>
            <button type="button" aria-label="التنبيهات" onClick={() => handleAction('التنبيهات')} className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-[#dce4dc] bg-[#f9fbf7] text-[#65736d] transition hover:border-[#aacdc0] hover:text-[#237f79] focus:outline-none focus:ring-2 focus:ring-[#c99d4d]/60">
              <Bell className="h-4 w-4" strokeWidth={1.8} />
              <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[#dd7868]" />
            </button>
            <button type="button" onClick={() => handleAction('الحساب')} className="flex items-center gap-2 rounded-xl border border-[#dce4dc] bg-[#f9fbf7] py-1.5 pl-3 pr-1.5 transition hover:border-[#aacdc0] focus:outline-none focus:ring-2 focus:ring-[#c99d4d]/60">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#eadfbf] text-[11px] font-extrabold text-[#735c2a]">م</span>
              <span className="hidden text-[11px] font-bold text-[#53645d] sm:block">مدير المنصة</span>
              <ChevronLeft className="h-3.5 w-3.5 text-[#9ba49e]" />
            </button>
          </div>
        </header>

        <section className="relative overflow-hidden rounded-[1.75rem] bg-[#173834] px-5 py-6 shadow-[0_18px_45px_rgba(23,56,52,0.16)] sm:px-7 sm:py-7 lg:px-10 lg:py-8">
          <div className="pointer-events-none absolute -left-20 -top-28 h-64 w-64 rounded-full border-[26px] border-[#c99d4d]/10" />
          <div className="pointer-events-none absolute bottom-[-110px] right-[28%] h-64 w-64 rounded-full bg-[#237f79]/35 blur-3xl" />
          <div className="relative flex flex-col justify-between gap-7 lg:flex-row lg:items-end">
            <div className="max-w-[620px]">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#c6a561]/35 bg-[#c99d4d]/12 px-3 py-1.5 text-[10px] font-extrabold text-[#ead7a7]">
                <ShieldCheck className="h-3.5 w-3.5" />
                غرفة العمليات · الأحد ١٩ مايو ٢٠٢٤
              </div>
              <h2 className="text-[1.7rem] font-extrabold leading-[1.25] tracking-[-0.04em] text-[#f3f4ec] sm:text-[2.15rem]">المنصة تمضي بهدوء.<br /><span className="text-[#d7ba78]">وهذه هي الصورة التي تهم.</span></h2>
              <p className="mt-4 max-w-[560px] text-[12px] leading-7 text-[#b7c9c0] sm:text-[13px]">مؤشرات الطلاب والاشتراكات والاختبارات مجمّعة في مكان واحد، لتعرف ما يحتاج انتباهك قبل أن يبدأ يوم المراجعة.</p>
            </div>
            <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.07] px-3 py-3.5 backdrop-blur">
                <p className="text-[10px] font-semibold text-[#9eb5aa]">نشاط اليوم</p>
                <p className="mt-1 text-xl font-extrabold text-[#dcecae]">{activeRatio}%</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.07] px-3 py-3.5 backdrop-blur">
                <p className="text-[10px] font-semibold text-[#9eb5aa]">متوسط الأداء</p>
                <p className="mt-1 text-xl font-extrabold text-[#f0d696]">{stats.exams.average}%</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.07] px-3 py-3.5 backdrop-blur">
                <p className="text-[10px] font-semibold text-[#9eb5aa]">محاولات اليوم</p>
                <p className="mt-1 text-xl font-extrabold text-[#b7e0d2]">{number(stats.exams.today)}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-5 grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard eyebrow="إجمالي الطلاب" value={number(stats.students.total)} note={`+${number(stats.students.newToday)} طالب جديد اليوم`} icon={Users} tone="teal" />
          <MetricCard eyebrow="نشاط الطلاب اليوم" value={number(stats.students.activeToday)} note={`${number(stats.students.activeWeek)} طالب خلال الأسبوع`} icon={Activity} tone="gold" trend="activity" />
          <MetricCard eyebrow="اشتراكات نشطة" value={number(stats.subscriptions.active)} note={`+${number(stats.subscriptions.newWeek)} هذا الأسبوع`} icon={CreditCard} tone="ink" />
          <MetricCard eyebrow="إيرادات هذا الشهر" value={money(stats.subscriptions.revenue)} note={`${number(stats.subscriptions.newToday)} اشتراكاً جديداً اليوم`} icon={TrendingUp} tone="coral" trend="revenue" />
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-[1.45fr_0.85fr]">
          <article className="rounded-[1.45rem] border border-[#dfe4df] bg-[#fbfcf8] p-5 shadow-[0_10px_30px_rgba(31,50,47,0.04)] sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <SectionHeading icon={Gauge} title="إيقاع التعلّم" detail="حجم المحاولات وتوزيعها على مسارات الاختبار" action="عرض التقارير" />
              <div className="flex rounded-xl border border-[#e1e7e1] bg-[#f3f6f2] p-1">
                {['اليوم', 'هذا الأسبوع', 'هذا الشهر'].map((item) => (
                  <button key={item} type="button" onClick={() => setRange(item)} aria-pressed={range === item} className={`rounded-lg px-2.5 py-1.5 text-[10px] font-bold transition ${range === item ? 'bg-[#173834] text-[#f4f4eb] shadow-sm' : 'text-[#7c8880] hover:text-[#237f79]'}`}>{item}</button>
                ))}
              </div>
            </div>
            <div className="mt-7 grid gap-7 lg:grid-cols-[0.8fr_1.2fr]">
              <div className="flex items-center gap-5 rounded-2xl bg-[#f5f8f4] p-4">
                <div className="relative h-[116px] w-[116px] shrink-0 rounded-full" style={{ background: `conic-gradient(#237f79 0 41.3%, #c99d4d 41.3% 73.5%, #dd7868 73.5% 92.1%, #7c7698 92.1% 100%)` }}>
                  <div className="absolute inset-[11px] flex flex-col items-center justify-center rounded-full bg-[#f5f8f4]">
                    <span className="text-lg font-extrabold tracking-[-0.05em] text-[#173834]">{number(stats.exams.total)}</span>
                    <span className="mt-0.5 text-[10px] font-semibold text-[#89948d]">محاولة</span>
                  </div>
                </div>
                <div className="min-w-0 space-y-2.5">
                  {examTypes.map((type) => (
                    <div key={type.label} className="flex items-center gap-2 text-[10px] font-semibold text-[#697871]">
                      <span className={`h-2 w-2 shrink-0 rounded-full ${type.tone}`} />
                      <span className="truncate">{type.label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                {examTypes.map((type) => (
                  <div key={type.label}>
                    <div className="mb-1.5 flex items-center justify-between gap-3 text-[11px]">
                      <span className="font-semibold text-[#617069]">{type.label}</span>
                      <span className="font-extrabold text-[#304942]">{number(type.value)} <span className="mr-1 text-[10px] font-medium text-[#99a39e]">{type.share}%</span></span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-[#edf1ec]">
                      <div className={`h-full rounded-full ${type.tone} transition-[width] duration-500`} style={{ width: `${type.share * 2.15}%` }} />
                    </div>
                  </div>
                ))}
                <div className="grid grid-cols-2 gap-2.5 border-t border-[#e8ece7] pt-4">
                  <div><p className="text-[10px] font-semibold text-[#89948d]">اختبارات اليوم</p><p className="mt-1 text-base font-extrabold text-[#173834]">{number(stats.exams.today)}</p></div>
                  <div><p className="text-[10px] font-semibold text-[#89948d]">متوسط الدرجات</p><p className="mt-1 text-base font-extrabold text-[#237f79]">{stats.exams.average}%</p></div>
                </div>
              </div>
            </div>
          </article>

          <article className="rounded-[1.45rem] border border-[#dfe4df] bg-[#fbfcf8] p-5 shadow-[0_10px_30px_rgba(31,50,47,0.04)] sm:p-6">
            <SectionHeading icon={CreditCard} title="نبض الاشتراكات" detail="صورة سريعة عن قاعدة المشتركين" />
            <div className="mt-6 flex items-center gap-5">
              <div className="relative h-[94px] w-[94px] shrink-0 rounded-full" style={{ background: `conic-gradient(#c99d4d ${subscriptionRatio}%, #edf0eb 0)` }}>
                <div className="absolute inset-[9px] flex flex-col items-center justify-center rounded-full bg-[#fbfcf8]">
                  <span className="text-xl font-extrabold text-[#173834]">{subscriptionRatio}%</span>
                  <span className="text-[9px] font-semibold text-[#89948d]">من الطلاب</span>
                </div>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-[#7b8981]">قيمة الاشتراكات النشطة</p>
                <p className="mt-1 text-xl font-extrabold tracking-[-0.04em] text-[#173834]">{money(stats.subscriptions.revenue)}</p>
                <p className="mt-1 text-[10px] font-semibold text-[#237f79]">+12.8% مقارنة بالشهر الماضي</p>
              </div>
            </div>
            <div className="mt-6 space-y-2.5">
              <StatusItem icon={CheckCircle2} label="اشتراكات نشطة" detail={number(stats.subscriptions.active)} />
              <StatusItem icon={Clock3} label="بانتظار المراجعة" detail="٢٣ طلباً" warning />
              <StatusItem icon={RefreshCw} label="تنتهي خلال ٧ أيام" detail="١٤٨ اشتراكاً" />
            </div>
            <button type="button" onClick={() => handleAction('إدارة الاشتراكات')} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-[#c9ddd4] bg-[#edf6f1] py-3 text-[11px] font-extrabold text-[#237f79] transition hover:border-[#8dbeb0] hover:bg-[#e1f0e9] focus:outline-none focus:ring-2 focus:ring-[#c99d4d]/50">فتح إدارة الاشتراكات <ArrowUpLeft className="h-3.5 w-3.5" /></button>
          </article>
        </section>

        <section className="mt-5 grid gap-5 lg:grid-cols-[0.82fr_1.18fr]">
          <article className="rounded-[1.45rem] border border-[#dfe4df] bg-[#fbfcf8] p-5 shadow-[0_10px_30px_rgba(31,50,47,0.04)] sm:p-6">
            <SectionHeading icon={Inbox} title="ما يحتاج انتباهك" detail="ثلاث نقاط صغيرة قبل أن تبدأ جولتك" />
            <div className="mt-5 space-y-2.5">
              <button type="button" onClick={() => handleAction('طلبات الاشتراك')} className="group flex w-full items-center gap-3 rounded-xl border border-[#eadfca] bg-[#fffaf0] p-3 text-right transition hover:-translate-x-0.5 hover:border-[#d9bd83] focus:outline-none focus:ring-2 focus:ring-[#c99d4d]/50">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#f6e7c7] text-[#aa7c2c]"><CreditCard className="h-4 w-4" /></span>
                <span className="min-w-0 flex-1"><span className="block text-[11px] font-extrabold text-[#62502d]">طلبات اشتراك جديدة</span><span className="mt-0.5 block text-[10px] text-[#9b875e]">تحتاج إلى مراجعة يدوية</span></span>
                <span className="rounded-full bg-[#f1dcae] px-2 py-1 text-[10px] font-extrabold text-[#866323]">٢٣</span>
                <ChevronLeft className="h-3.5 w-3.5 text-[#b9a277] transition group-hover:-translate-x-0.5" />
              </button>
              <button type="button" onClick={() => handleAction('طلبات المؤسسات')} className="group flex w-full items-center gap-3 rounded-xl border border-[#f0dcd8] bg-[#fff8f6] p-3 text-right transition hover:-translate-x-0.5 hover:border-[#dfaaa0] focus:outline-none focus:ring-2 focus:ring-[#dd7868]/40">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#f8e2dd] text-[#bd6558]"><BriefcaseBusiness className="h-4 w-4" /></span>
                <span className="min-w-0 flex-1"><span className="block text-[11px] font-extrabold text-[#674641]">طلبات المؤسسات</span><span className="mt-0.5 block text-[10px] text-[#a1847f]">طلبات انضمام جديدة هذا الأسبوع</span></span>
                <span className="rounded-full bg-[#f3d0c9] px-2 py-1 text-[10px] font-extrabold text-[#a35449]">٧</span>
                <ChevronLeft className="h-3.5 w-3.5 text-[#c8978e] transition group-hover:-translate-x-0.5" />
              </button>
              <div className="flex items-center gap-3 rounded-xl border border-[#dbe9e1] bg-[#f3faf6] p-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#dcefe5] text-[#237f79]"><Check className="h-4 w-4" /></span>
                <span className="min-w-0 flex-1"><span className="block text-[11px] font-extrabold text-[#42645a]">لا توجد أعطال معلنة</span><span className="mt-0.5 block text-[10px] text-[#789289]">جميع الخدمات الأساسية تعمل</span></span>
                <span className="text-[10px] font-bold text-[#4caa78]">مطمئن</span>
              </div>
            </div>
          </article>

          <article className="rounded-[1.45rem] border border-[#dfe4df] bg-[#fbfcf8] p-5 shadow-[0_10px_30px_rgba(31,50,47,0.04)] sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <SectionHeading icon={Zap} title="الوصول السريع" detail="الأماكن التي تعود إليها يومياً" />
              <button type="button" aria-label="المزيد من الخيارات" onClick={() => handleAction('المزيد')} className="flex h-8 w-8 items-center justify-center rounded-lg text-[#9aa59e] transition hover:bg-[#eef3ee] hover:text-[#237f79]"><MoreHorizontal className="h-4 w-4" /></button>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {[
                { label: 'الاشتراكات', sub: '٢٣ تحتاج مراجعة', icon: CreditCard, tone: 'text-[#237f79] bg-[#e5f2ed]' },
                { label: 'بنك الأسئلة', sub: 'إدارة المحتوى', icon: BookOpen, tone: 'text-[#9a722b] bg-[#f8edd8]' },
                { label: 'الاختبارات', sub: '١٢ مجدولاً اليوم', icon: FileText, tone: 'text-[#bd6558] bg-[#fae5df]' },
                { label: 'إرسال بريد', sub: 'التواصل مع الطلاب', icon: Mail, tone: 'text-[#5e5a82] bg-[#ebeaf3]' },
              ].map((item) => (
                <button key={item.label} type="button" onClick={() => handleAction(item.label)} className="group rounded-xl border border-[#e3e8e2] bg-[#f8faf7] p-3 text-right transition hover:-translate-y-0.5 hover:border-[#b6d2c8] hover:bg-[#f2f8f3] focus:outline-none focus:ring-2 focus:ring-[#c99d4d]/50">
                  <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${item.tone}`}><item.icon className="h-4 w-4" strokeWidth={1.8} /></span>
                  <span className="mt-3 block text-[11px] font-extrabold text-[#3d554d]">{item.label}</span>
                  <span className="mt-1 block truncate text-[9px] font-semibold text-[#8c9991]">{item.sub}</span>
                  <ArrowUpLeft className="mt-3 h-3.5 w-3.5 text-[#b8c1bb] transition group-hover:-translate-x-0.5 group-hover:text-[#237f79]" />
                </button>
              ))}
            </div>
          </article>
        </section>

        <section className="mt-5 rounded-[1.45rem] border border-[#dfe4df] bg-[#fbfcf8] p-5 shadow-[0_10px_30px_rgba(31,50,47,0.04)] sm:p-6">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <SectionHeading icon={Server} title="صحة المنصة" detail="الخدمات الأساسية تراقب نفسها باستمرار" />
            <div className="flex items-center gap-2 rounded-full bg-[#e7f4eb] px-3 py-1.5 text-[10px] font-extrabold text-[#39805e]"><span className="h-1.5 w-1.5 rounded-full bg-[#4caa78]" /> كل شيء يعمل</div>
          </div>
          <div className="mt-5 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
            <StatusItem icon={Database} label="قاعدة البيانات" detail="متصلة" />
            <StatusItem icon={Mail} label="خدمة البريد" detail="جاهزة" />
            <StatusItem icon={Wifi} label="بوابة الاختبارات" detail="مستقرة" />
            <StatusItem icon={Bell} label="التنبيهات" detail="٧ معلقة" warning />
          </div>
          <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-[#eadfca] bg-[#fffaf0] p-3 text-[10px] leading-6 text-[#8b7040]">
            <CircleAlert className="mt-1 h-3.5 w-3.5 shrink-0 text-[#bd8a38]" />
            هناك ٢٣ اشتراكاً و٧ طلبات مؤسسات في قائمة المراجعة. لا يوجد تأثير على تجربة الطلاب حالياً.
          </div>
        </section>

        <footer className="flex flex-col gap-3 px-1 pb-2 pt-5 text-[10px] font-semibold text-[#95a098] sm:flex-row sm:items-center sm:justify-between">
          <span>آخر مزامنة للبيانات: اليوم، ١١:٤٢ ص</span>
          <button type="button" onClick={() => handleAction('إعدادات مساحة العمل')} className="flex items-center gap-1.5 self-start transition hover:text-[#237f79] sm:self-auto"><Settings2 className="h-3.5 w-3.5" /> إعدادات مساحة العمل</button>
        </footer>
        {notice ? <div role="status" className="fixed bottom-4 left-1/2 z-20 -translate-x-1/2 rounded-full border border-[#c8ded3] bg-[#173834] px-4 py-2.5 text-[11px] font-bold text-[#eaf3e8] shadow-[0_12px_28px_rgba(23,56,52,0.2)]">{notice}</div> : null}
      </div>
    </main>
  );
}