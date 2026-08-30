import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Bell,
  BookOpen,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  Clock3,
  Flame,
  GraduationCap,
  LayoutDashboard,
  LineChart,
  LockKeyhole,
  MoreHorizontal,
  Play,
  Search,
  Sparkles,
  Target,
  Trophy,
  UserRound,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const studyData = {
  "7 أيام": [
    { day: "السبت", score: 54, minutes: 48 },
    { day: "الأحد", score: 62, minutes: 64 },
    { day: "الإثنين", score: 57, minutes: 37 },
    { day: "الثلاثاء", score: 70, minutes: 78 },
    { day: "الأربعاء", score: 66, minutes: 55 },
    { day: "الخميس", score: 78, minutes: 91 },
    { day: "اليوم", score: 74, minutes: 68 },
  ],
  "30 يوم": [
    { day: "الأسبوع 1", score: 52, minutes: 210 },
    { day: "الأسبوع 2", score: 61, minutes: 275 },
    { day: "الأسبوع 3", score: 68, minutes: 310 },
    { day: "هذا الأسبوع", score: 74, minutes: 356 },
  ],
};

const week = [
  { label: "س", minutes: 48, done: true },
  { label: "ح", minutes: 64, done: true },
  { label: "ن", minutes: 37, done: true },
  { label: "ث", minutes: 78, done: true },
  { label: "ر", minutes: 55, done: true },
  { label: "خ", minutes: 91, done: true },
  { label: "ج", minutes: 68, done: false, today: true },
];

const navItems = [
  { label: "الرئيسية", icon: LayoutDashboard },
  { label: "مساري الدراسي", icon: Target },
  { label: "بنك الأسئلة", icon: BookOpen },
  { label: "الاختبارات", icon: GraduationCap },
  { label: "التحليلات", icon: LineChart },
];

function Stat({
  icon: Icon,
  label,
  value,
  hint,
  accent,
  delay,
}: {
  icon: typeof Target;
  label: string;
  value: string;
  hint: string;
  accent: string;
  delay: number;
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: "easeOut" }}
      className="group relative overflow-hidden border border-white/[0.075] bg-[#13253a] p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-white/[0.14] hover:bg-[#172c43]"
    >
      <div
        className="absolute inset-x-0 top-0 h-px opacity-80"
        style={{ background: accent }}
      />
      <div className="flex items-start justify-between">
        <div
          className="flex h-9 w-9 items-center justify-center"
          style={{ background: `${accent}1f`, color: accent }}
        >
          <Icon size={18} strokeWidth={1.75} />
        </div>
        <span className="text-[11px] text-[#94a3b8]">{hint}</span>
      </div>
      <p className="mt-7 text-[11px] font-semibold tracking-[0.14em] text-[#94a3b8]">
        {label}
      </p>
      <p className="mt-1 font-['IBM_Plex_Sans_Arabic'] text-[27px] font-semibold leading-none tracking-tight text-[#f8fafc]">
        {value}
      </p>
    </motion.article>
  );
}

function Sidebar() {
  const [active, setActive] = useState("الرئيسية");

  return (
    <aside className="hidden min-h-screen w-[252px] shrink-0 flex-col border-l border-white/[0.07] bg-[#101f31] px-5 py-6 lg:flex">
      <div className="flex items-center gap-3 px-2" dir="rtl">
        <div className="relative grid h-10 w-10 place-items-center bg-[#f7f775] text-[#0d1b2a] shadow-[0_0_30px_rgba(247,247,117,0.13)]">
          <span className="font-['DM_Sans'] text-lg font-black">ق</span>
          <span className="absolute -bottom-1 -left-1 h-2.5 w-2.5 border-2 border-[#101f31] bg-[#65d6a6]" />
        </div>
        <div>
          <p className="font-['IBM_Plex_Sans_Arabic'] text-[17px] font-bold tracking-tight text-white">
            قدراتك
          </p>
          <p className="mt-0.5 text-[9px] font-semibold tracking-[0.17em] text-[#94a3b8]">
            STUDY INTELLIGENCE
          </p>
        </div>
      </div>

      <div className="mt-12">
        <p className="px-3 text-[10px] font-semibold tracking-[0.18em] text-[#64748b]">
          التعلّم
        </p>
        <nav className="mt-3 space-y-1">
          {navItems.map(({ icon: Icon, label }) => {
            const isActive = label === active;
            return (
              <button
                className={`group flex w-full items-center gap-3 border-r-2 px-3 py-3 text-right text-[13px] transition-all ${
                  isActive
                    ? "border-[#f7f775] bg-[#1a3048] text-white"
                    : "border-transparent text-[#94a3b8] hover:bg-white/[0.035] hover:text-white"
                }`}
                key={label}
                onClick={() => setActive(label)}
              >
                <Icon
                  size={17}
                  strokeWidth={isActive ? 2 : 1.65}
                  className={isActive ? "text-[#f7f775]" : "group-hover:text-[#dbeafe]"}
                />
                <span className="font-['IBM_Plex_Sans_Arabic'] font-medium">{label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="mt-9">
        <p className="px-3 text-[10px] font-semibold tracking-[0.18em] text-[#64748b]">
          الحساب
        </p>
        <button className="mt-3 flex w-full items-center gap-3 border-r-2 border-transparent px-3 py-3 text-right text-[13px] text-[#94a3b8] transition-colors hover:bg-white/[0.035] hover:text-white">
          <UserRound size={17} strokeWidth={1.65} />
          <span className="font-['IBM_Plex_Sans_Arabic'] font-medium">الملف الشخصي</span>
        </button>
      </div>

      <div className="mt-auto border-t border-white/[0.07] pt-5">
        <div className="relative overflow-hidden bg-[#182d45] p-4">
          <div className="absolute -left-5 -top-5 h-16 w-16 rounded-full bg-[#f7f775]/10 blur-xl" />
          <div className="relative flex items-center gap-2 text-[#f7f775]">
            <Sparkles size={15} />
            <span className="font-['IBM_Plex_Sans_Arabic'] text-[12px] font-semibold">مساعدك الدراسي</span>
          </div>
          <p className="relative mt-2 font-['IBM_Plex_Sans_Arabic'] text-[11px] leading-6 text-[#cbd5e1]">
            لديك 14 سؤالًا ذكيًا مقترحًا لمراجعة نقاط الضعف.
          </p>
          <button className="relative mt-3 flex items-center gap-1.5 font-['IBM_Plex_Sans_Arabic'] text-[11px] font-semibold text-white transition-colors hover:text-[#f7f775]">
            اعرض الاقتراحات <ArrowLeft size={13} />
          </button>
        </div>
        <div className="mt-5 flex items-center gap-3 px-2">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-[#38556f] text-[12px] font-bold text-white">
            ع
          </div>
          <div className="min-w-0">
            <p className="truncate font-['IBM_Plex_Sans_Arabic'] text-[12px] font-medium text-white">عبدالله الحربي</p>
            <p className="mt-0.5 text-[10px] text-[#64748b]">طالب · باقة المتقدم</p>
          </div>
          <ChevronDown size={14} className="mr-auto text-[#64748b]" />
        </div>
      </div>
    </aside>
  );
}

export default function App() {
  const [range, setRange] = useState<"7 أيام" | "30 يوم">("7 أيام");
  const [played, setPlayed] = useState(false);
  const data = useMemo(() => studyData[range], [range]);

  return (
    <div
      className="min-h-screen bg-[#0d1b2a] text-right text-[#e5e7eb]"
      dir="rtl"
    >
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />
      <style
        dangerouslySetInnerHTML={{
          __html: `
            :root { color-scheme: dark; }
            body { margin: 0; background: #0d1b2a; }
            * { box-sizing: border-box; }
            ::selection { background: #f7f775; color: #0d1b2a; }
            ::-webkit-scrollbar { width: 8px; }
            ::-webkit-scrollbar-track { background: #0d1b2a; }
            ::-webkit-scrollbar-thumb { background: #334b65; }
            .recharts-tooltip-cursor { fill: rgba(247,247,117,.045); }
          `,
        }}
      />

      <div className="flex min-h-screen font-['DM_Sans']">
        <Sidebar />

        <main className="min-w-0 flex-1 bg-[radial-gradient(ellipse_85%_55%_at_75%_-10%,rgba(42,75,111,.34),transparent_65%)]">
          <header className="sticky top-0 z-20 border-b border-white/[0.07] bg-[#0d1b2a]/85 px-5 py-4 backdrop-blur-xl md:px-8 lg:px-10">
            <div className="flex items-center gap-3">
              <div className="hidden items-center gap-2 border border-white/[0.08] bg-white/[0.03] px-3 py-2 sm:flex">
                <Search size={15} className="text-[#94a3b8]" />
                <input
                  className="w-40 bg-transparent text-[12px] text-white outline-none placeholder:text-[#64748b] lg:w-60"
                  placeholder="ابحث في المنصة..."
                />
                <kbd className="border border-white/[0.08] px-1.5 py-0.5 text-[9px] text-[#64748b]">⌘ K</kbd>
              </div>
              <button className="relative grid h-9 w-9 place-items-center border border-white/[0.08] text-[#cbd5e1] transition-colors hover:border-[#f7f775]/50 hover:text-[#f7f775]">
                <Bell size={16} strokeWidth={1.7} />
                <span className="absolute right-2 top-2 h-1.5 w-1.5 bg-[#f7f775] ring-2 ring-[#0d1b2a]" />
              </button>
              <div className="mr-auto flex items-center gap-3">
                <div className="text-left">
                  <p className="text-[10px] tracking-[0.12em] text-[#64748b]">الجمعة، 21 أغسطس</p>
                  <p className="mt-0.5 font-['IBM_Plex_Sans_Arabic'] text-[15px] font-semibold text-white">
                    صباح الخير، عبدالله
                  </p>
                </div>
                <div className="grid h-9 w-9 place-items-center bg-[#f7f775] text-[12px] font-bold text-[#0d1b2a]">ع</div>
              </div>
            </div>
          </header>

          <div className="mx-auto max-w-[1380px] px-5 py-7 md:px-8 lg:px-10 lg:py-9">
            <section className="relative overflow-hidden border border-[#f7f775]/20 bg-[#142941] p-6 md:p-7">
              <div className="absolute -left-12 -top-12 h-44 w-44 rounded-full bg-[#f7f775]/[0.06] blur-3xl" />
              <div className="absolute bottom-0 left-0 h-px w-1/2 bg-gradient-to-l from-transparent via-[#f7f775]/50 to-transparent" />
              <div className="relative grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
                <div>
                  <div className="flex items-center gap-2 text-[#f7f775]">
                    <span className="h-1.5 w-1.5 bg-[#f7f775]" />
                    <span className="font-['IBM_Plex_Sans_Arabic'] text-[11px] font-semibold tracking-[0.12em]">خُطتك لليوم</span>
                  </div>
                  <h1 className="mt-4 max-w-2xl font-['IBM_Plex_Sans_Arabic'] text-[27px] font-semibold leading-[1.45] text-white md:text-[32px]">
                    باقي خطوة واحدة على إكمال هدفك اليومي.
                  </h1>
                  <p className="mt-2 max-w-xl font-['IBM_Plex_Sans_Arabic'] text-[13px] leading-7 text-[#aebed0]">
                    جلسة مركّزة مدتها 25 دقيقة ستنهي مراجعة الاستنتاج اللفظي وتقرّبك من هدف الأسبوع.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2 border border-white/[0.1] bg-[#0d1b2a]/35 px-3 py-2.5 text-[12px] text-[#cbd5e1]">
                    <Clock3 size={15} className="text-[#94a3b8]" />
                    <span className="font-['IBM_Plex_Sans_Arabic']">25 دقيقة</span>
                  </div>
                  <button
                    onClick={() => setPlayed(!played)}
                    className="flex items-center gap-2 bg-[#f7f775] px-5 py-3 font-['IBM_Plex_Sans_Arabic'] text-[13px] font-bold text-[#0d1b2a] transition-all hover:bg-[#ffff9b] hover:shadow-[0_0_28px_rgba(247,247,117,0.22)]"
                  >
                    <Play size={15} fill="currentColor" />
                    {played ? "الجلسة بدأت" : "ابدأ الجلسة"}
                  </button>
                </div>
              </div>
            </section>

            <section className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
              <Stat icon={Target} label="إتمام الخطة" value="76%" hint="+8% هذا الأسبوع" accent="#f7f775" delay={0.05} />
              <Stat icon={Clock3} label="وقت المذاكرة" value="6.8 س" hint="من أصل 8 ساعات" accent="#77b8ed" delay={0.11} />
              <Stat icon={Flame} label="سلسلة الإنجاز" value="12 يومًا" hint="أفضل سلسلة لك" accent="#f29666" delay={0.17} />
              <Stat icon={Trophy} label="متوسطك الحالي" value="74" hint="+6 نقاط" accent="#65d6a6" delay={0.23} />
            </section>

            <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(290px,.85fr)]">
              <motion.article
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.45 }}
                className="border border-white/[0.075] bg-[#13253a] p-5 md:p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="font-['IBM_Plex_Sans_Arabic'] text-[16px] font-semibold text-white">تقدّمك في الاستعداد</p>
                    <p className="mt-1 font-['IBM_Plex_Sans_Arabic'] text-[12px] text-[#94a3b8]">تطور درجتك ووقت المذاكرة في الفترة الأخيرة</p>
                  </div>
                  <div className="flex border border-white/[0.08] bg-[#0d1b2a] p-1">
                    {(Object.keys(studyData) as Array<keyof typeof studyData>).map((item) => (
                      <button
                        key={item}
                        onClick={() => setRange(item)}
                        className={`px-3 py-1.5 font-['IBM_Plex_Sans_Arabic'] text-[11px] transition-all ${
                          range === item ? "bg-[#f7f775] font-semibold text-[#0d1b2a]" : "text-[#94a3b8] hover:text-white"
                        }`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mt-6 h-[255px]" dir="ltr">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 6, right: 5, bottom: 0, left: -18 }}>
                      <defs>
                        <linearGradient id="progressFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#f7f775" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="#f7f775" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="#385069" strokeDasharray="3 7" vertical={false} />
                      <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "#7f93a9", fontSize: 10 }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} domain={[35, 90]} tick={{ fill: "#7f93a9", fontSize: 10 }} width={28} />
                      <Tooltip
                        cursor={{ stroke: "#f7f775", strokeDasharray: "3 4", strokeWidth: 1 }}
                        contentStyle={{ background: "#0d1b2a", border: "1px solid #36506a", borderRadius: 0, padding: "10px 12px" }}
                        labelStyle={{ color: "#94a3b8", fontSize: 11, marginBottom: 4 }}
                        itemStyle={{ color: "#f7f775", fontSize: 12, fontWeight: 700 }}
                        formatter={(value) => [`${value} نقطة`, "المتوسط"]}
                      />
                      <Area type="monotone" dataKey="score" stroke="#f7f775" strokeWidth={2.5} fill="url(#progressFill)" dot={{ r: 2.7, fill: "#0d1b2a", stroke: "#f7f775", strokeWidth: 2 }} activeDot={{ r: 4.5, fill: "#f7f775", stroke: "#0d1b2a", strokeWidth: 2 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-3 flex items-center gap-2 border-t border-white/[0.07] pt-4 font-['IBM_Plex_Sans_Arabic'] text-[12px] text-[#aebed0]">
                  <span className="h-2 w-2 bg-[#f7f775]" />
                  أداؤك يتحسن بثبات — أعلى من الأسبوع الماضي بـ 6 نقاط.
                </div>
              </motion.article>

              <motion.article
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.38, duration: 0.45 }}
                className="relative overflow-hidden bg-[#213a57] p-6"
              >
                <div className="absolute -left-14 -top-14 h-44 w-44 rounded-full bg-[#77b8ed]/15 blur-3xl" />
                <div className="relative flex items-start justify-between">
                  <div>
                    <p className="font-['IBM_Plex_Sans_Arabic'] text-[16px] font-semibold text-white">الاختبار القادم</p>
                    <p className="mt-1 font-['IBM_Plex_Sans_Arabic'] text-[12px] text-[#b8c9d9]">اختبار محاكي شامل</p>
                  </div>
                  <button className="text-[#b8c9d9] transition-colors hover:text-white" aria-label="خيارات الاختبار">
                    <MoreHorizontal size={19} />
                  </button>
                </div>
                <div className="relative mt-7 border-y border-white/[0.12] py-5">
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="font-['IBM_Plex_Sans_Arabic'] text-[29px] font-semibold leading-none text-white">01</p>
                      <p className="mt-1 text-[11px] tracking-[0.14em] text-[#b8c9d9]">سبتمبر 2026</p>
                    </div>
                    <CalendarDays size={23} className="mb-1 text-[#f7f775]" />
                  </div>
                  <p className="mt-4 font-['IBM_Plex_Sans_Arabic'] text-[12px] leading-6 text-[#dbe7f2]">
                    خصّصنا لك اختبارًا من 70 سؤالًا بناءً على تقدمك الأخير.
                  </p>
                </div>
                <button className="relative mt-5 flex w-full items-center justify-center gap-2 border border-[#f7f775]/60 py-3 font-['IBM_Plex_Sans_Arabic'] text-[12px] font-semibold text-[#f7f775] transition-all hover:bg-[#f7f775] hover:text-[#0d1b2a]">
                  استعرض التفاصيل <ChevronLeft size={15} />
                </button>
              </motion.article>
            </section>

            <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(290px,.85fr)]">
              <motion.article
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.46, duration: 0.45 }}
                className="border border-white/[0.075] bg-[#13253a] p-5 md:p-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-['IBM_Plex_Sans_Arabic'] text-[16px] font-semibold text-white">مسارك هذا الأسبوع</p>
                    <p className="mt-1 font-['IBM_Plex_Sans_Arabic'] text-[12px] text-[#94a3b8]">356 من 480 دقيقة مستهدفة</p>
                  </div>
                  <span className="border border-[#65d6a6]/30 bg-[#65d6a6]/10 px-2.5 py-1 font-['IBM_Plex_Sans_Arabic'] text-[11px] font-semibold text-[#65d6a6]">ممتاز</span>
                </div>
                <div className="mt-7 grid grid-cols-7 gap-2.5 sm:gap-4" dir="rtl">
                  {week.map((day) => {
                    const height = Math.max(19, Math.round((day.minutes / 100) * 100));
                    return (
                      <div className="flex flex-col items-center gap-2" key={day.label}>
                        <div className="flex h-[108px] w-full max-w-[38px] items-end bg-[#0d1b2a] p-1">
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: `${height}%` }}
                            transition={{ duration: 0.65, delay: 0.55 }}
                            className={`w-full ${day.today ? "bg-[#f7f775]" : day.done ? "bg-[#65d6a6]" : "bg-[#344b63]"}`}
                          />
                        </div>
                        <span className={`font-['IBM_Plex_Sans_Arabic'] text-[11px] ${day.today ? "font-bold text-[#f7f775]" : "text-[#94a3b8]"}`}>{day.label}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-6 flex items-center justify-between border-t border-white/[0.07] pt-4">
                  <span className="font-['IBM_Plex_Sans_Arabic'] text-[11px] text-[#94a3b8]">هدف اليوم: 60 دقيقة</span>
                  <span className="font-['IBM_Plex_Sans_Arabic'] text-[11px] font-semibold text-white">تبقى 8 دقائق</span>
                </div>
              </motion.article>

              <motion.article
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.54, duration: 0.45 }}
                className="border border-white/[0.075] bg-[#13253a] p-6"
              >
                <div className="flex items-center justify-between">
                  <p className="font-['IBM_Plex_Sans_Arabic'] text-[16px] font-semibold text-white">مراجعة ذكية</p>
                  <LockKeyhole size={16} className="text-[#64748b]" />
                </div>
                <p className="mt-1 font-['IBM_Plex_Sans_Arabic'] text-[12px] text-[#94a3b8]">ركّز عليها في جلستك التالية</p>
                <div className="mt-5 space-y-4">
                  {[
                    { name: "إكمال الجمل", score: 58, color: "#f29666" },
                    { name: "الاستنتاج اللفظي", score: 64, color: "#f7f775" },
                    { name: "المسائل النسبية", score: 71, color: "#77b8ed" },
                  ].map((skill) => (
                    <div key={skill.name}>
                      <div className="flex justify-between font-['IBM_Plex_Sans_Arabic'] text-[12px]">
                        <span className="text-[#dbe7f2]">{skill.name}</span>
                        <span style={{ color: skill.color }}>{skill.score}%</span>
                      </div>
                      <div className="mt-2 h-1 bg-[#0d1b2a]">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${skill.score}%` }}
                          transition={{ duration: 0.75, delay: 0.65 }}
                          className="h-full"
                          style={{ backgroundColor: skill.color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <button className="mt-6 flex items-center gap-2 font-['IBM_Plex_Sans_Arabic'] text-[12px] font-semibold text-[#f7f775] transition-colors hover:text-white">
                  حل الأسئلة المقترحة <ArrowLeft size={14} />
                </button>
              </motion.article>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}