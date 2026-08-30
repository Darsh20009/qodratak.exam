import { useState } from "react";
import {
  ArrowLeft,
  Bell,
  BookOpen,
  CalendarDays,
  ChevronDown,
  Clock3,
  Flame,
  GraduationCap,
  LayoutDashboard,
  LineChart,
  Play,
  Search,
  Sparkles,
  Target,
  Trophy,
  UserRound,
} from "lucide-react";

const nav = [
  { label: "الرئيسية", icon: LayoutDashboard },
  { label: "مساري الدراسي", icon: Target },
  { label: "بنك الأسئلة", icon: BookOpen },
  { label: "الاختبارات", icon: GraduationCap },
  { label: "التحليلات", icon: LineChart },
];

const stats = [
  { icon: Target, label: "إتمام الخطة", value: "76%", meta: "+8% هذا الأسبوع", accent: "#f7f775" },
  { icon: Clock3, label: "وقت المذاكرة", value: "6.8 س", meta: "من أصل 8 ساعات", accent: "#76b8eb" },
  { icon: Flame, label: "سلسلة الإنجاز", value: "12 يومًا", meta: "أفضل سلسلة لك", accent: "#f69a65" },
  { icon: Trophy, label: "متوسطك الحالي", value: "74", meta: "+6 نقاط", accent: "#67d5a7" },
];

const progress = [
  { label: "س", height: 47 },
  { label: "ح", height: 63 },
  { label: "ن", height: 36 },
  { label: "ث", height: 78 },
  { label: "ر", height: 55 },
  { label: "خ", height: 91 },
  { label: "ج", height: 68, today: true },
];

const chartPoints = "0,194 78,160 155,176 232,126 310,145 387,88 465,102 542,60 620,74";

export default function App() {
  const [active, setActive] = useState("الرئيسية");
  const [started, setStarted] = useState(false);
  const [range, setRange] = useState("7 أيام");

  return (
    <div dir="rtl" className="min-h-screen overflow-hidden bg-[#0d1b2a] text-[#e5e7eb]">
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <style dangerouslySetInnerHTML={{ __html: `
        :root { color-scheme: dark; } body { margin: 0; background: #0d1b2a; }
        * { box-sizing: border-box; } ::selection { background: #f7f775; color: #0d1b2a; }
        .arabic { font-family: 'IBM Plex Sans Arabic', sans-serif; }
      `}} />

      <div className="flex min-h-screen font-['DM_Sans']">
        <aside className="hidden w-[248px] shrink-0 flex-col border-l border-white/[.07] bg-[#101f31] px-5 py-6 lg:flex">
          <div className="flex items-center gap-3 px-2">
            <div className="relative grid h-10 w-10 place-items-center bg-[#f7f775] text-lg font-black text-[#0d1b2a] shadow-[0_0_32px_rgba(247,247,117,.12)]">ق<span className="absolute -bottom-1 -left-1 h-2.5 w-2.5 border-2 border-[#101f31] bg-[#67d5a7]" /></div>
            <div>
              <p className="arabic text-[17px] font-bold text-white">قدراتك</p>
              <p className="mt-0.5 text-[9px] font-semibold tracking-[.17em] text-[#94a3b8]">STUDY INTELLIGENCE</p>
            </div>
          </div>

          <p className="mt-12 px-3 text-[10px] font-semibold tracking-[.18em] text-[#64748b]">التعلّم</p>
          <nav className="mt-3 space-y-1">
            {nav.map(({ label, icon: Icon }) => (
              <button key={label} onClick={() => setActive(label)} className={`flex w-full items-center gap-3 border-r-2 px-3 py-3 text-right transition-all ${active === label ? "border-[#f7f775] bg-[#1a3048] text-white" : "border-transparent text-[#94a3b8] hover:bg-white/[.035] hover:text-white"}`}>
                <Icon size={17} strokeWidth={active === label ? 2 : 1.65} className={active === label ? "text-[#f7f775]" : ""} />
                <span className="arabic text-[13px] font-medium">{label}</span>
              </button>
            ))}
          </nav>

          <div className="mt-9">
            <p className="px-3 text-[10px] font-semibold tracking-[.18em] text-[#64748b]">الحساب</p>
            <button className="mt-3 flex w-full items-center gap-3 border-r-2 border-transparent px-3 py-3 text-right text-[#94a3b8] hover:bg-white/[.035] hover:text-white">
              <UserRound size={17} strokeWidth={1.65} /><span className="arabic text-[13px] font-medium">الملف الشخصي</span>
            </button>
          </div>

          <div className="mt-auto">
            <div className="relative overflow-hidden bg-[#182d45] p-4">
              <div className="absolute -left-6 -top-6 h-20 w-20 rounded-full bg-[#f7f775]/10 blur-2xl" />
              <div className="relative flex items-center gap-2 text-[#f7f775]"><Sparkles size={15} /><span className="arabic text-[12px] font-semibold">مساعدك الدراسي</span></div>
              <p className="relative mt-2 arabic text-[11px] leading-6 text-[#cbd5e1]">لديك 14 سؤالًا مقترحًا لمراجعة نقاط الضعف.</p>
              <button className="relative mt-3 flex items-center gap-1.5 arabic text-[11px] font-semibold text-white hover:text-[#f7f775]">اعرض الاقتراحات <ArrowLeft size={13} /></button>
            </div>
            <div className="mt-5 flex items-center gap-3 border-t border-white/[.07] px-2 pt-5">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-[#38556f] text-[12px] font-bold text-white">ع</div>
              <div className="min-w-0"><p className="arabic truncate text-[12px] font-medium text-white">عبدالله الحربي</p><p className="mt-0.5 text-[10px] text-[#64748b]">طالب · باقة المتقدم</p></div>
              <ChevronDown size={14} className="mr-auto text-[#64748b]" />
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1 bg-[radial-gradient(ellipse_80%_55%_at_72%_-12%,rgba(41,76,113,.4),transparent_66%)]">
          <header className="sticky top-0 z-20 border-b border-white/[.07] bg-[#0d1b2a]/85 px-5 py-4 backdrop-blur-xl md:px-8 lg:px-10">
            <div className="flex items-center gap-3">
              <div className="hidden items-center gap-2 border border-white/[.08] bg-white/[.03] px-3 py-2 sm:flex"><Search size={15} className="text-[#94a3b8]" /><input className="w-44 bg-transparent text-[12px] outline-none placeholder:text-[#64748b] lg:w-60" placeholder="ابحث في المنصة..." /><kbd className="border border-white/[.08] px-1.5 py-0.5 text-[9px] text-[#64748b]">⌘ K</kbd></div>
              <button className="relative grid h-9 w-9 place-items-center border border-white/[.08] text-[#cbd5e1] hover:border-[#f7f775]/50 hover:text-[#f7f775]"><Bell size={16} /><span className="absolute right-2 top-2 h-1.5 w-1.5 bg-[#f7f775] ring-2 ring-[#0d1b2a]" /></button>
              <div className="mr-auto flex items-center gap-3 text-left"><div><p className="text-[10px] tracking-[.12em] text-[#64748b]">الجمعة، 21 أغسطس</p><p className="arabic mt-0.5 text-[15px] font-semibold text-white">صباح الخير، عبدالله</p></div><div className="grid h-9 w-9 place-items-center bg-[#f7f775] text-[12px] font-bold text-[#0d1b2a]">ع</div></div>
            </div>
          </header>

          <div className="mx-auto max-w-[1380px] px-5 py-7 md:px-8 lg:px-10 lg:py-9">
            <section className="relative overflow-hidden border border-[#f7f775]/20 bg-[#142941] p-6 md:p-7">
              <div className="absolute -left-12 -top-12 h-44 w-44 rounded-full bg-[#f7f775]/[.06] blur-3xl" /><div className="absolute bottom-0 left-0 h-px w-1/2 bg-gradient-to-l from-transparent via-[#f7f775]/60 to-transparent" />
              <div className="relative grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
                <div><div className="flex items-center gap-2 text-[#f7f775]"><span className="h-1.5 w-1.5 bg-[#f7f775]" /><span className="arabic text-[11px] font-semibold tracking-[.12em]">خُطتك لليوم</span></div><h1 className="arabic mt-4 max-w-2xl text-[27px] font-semibold leading-[1.45] text-white md:text-[32px]">باقي خطوة واحدة على إكمال هدفك اليومي.</h1><p className="arabic mt-2 max-w-xl text-[13px] leading-7 text-[#aebed0]">جلسة مركّزة مدتها 25 دقيقة ستنهي مراجعة الاستنتاج اللفظي وتقرّبك من هدف الأسبوع.</p></div>
                <div className="flex flex-wrap items-center gap-3"><div className="flex items-center gap-2 border border-white/[.1] bg-[#0d1b2a]/35 px-3 py-2.5 text-[12px] text-[#cbd5e1]"><Clock3 size={15} className="text-[#94a3b8]" /><span className="arabic">25 دقيقة</span></div><button onClick={() => setStarted(!started)} className="flex items-center gap-2 bg-[#f7f775] px-5 py-3 arabic text-[13px] font-bold text-[#0d1b2a] transition-all hover:bg-[#ffff9b] hover:shadow-[0_0_28px_rgba(247,247,117,.22)]"><Play size={15} fill="currentColor" />{started ? "الجلسة بدأت" : "ابدأ الجلسة"}</button></div>
              </div>
            </section>

            <section className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
              {stats.map(({ icon: Icon, label, value, meta, accent }) => <article key={label} className="group relative overflow-hidden border border-white/[.075] bg-[#13253a] p-5 transition-all hover:-translate-y-0.5 hover:border-white/[.14] hover:bg-[#172c43]}"><div className="absolute inset-x-0 top-0 h-px" style={{ background: accent }} /><div className="flex items-start justify-between"><div className="grid h-9 w-9 place-items-center" style={{ background: `${accent}1f`, color: accent }}><Icon size={18} strokeWidth={1.75} /></div><span className="text-[11px] text-[#94a3b8]">{meta}</span></div><p className="arabic mt-7 text-[11px] font-semibold tracking-[.14em] text-[#94a3b8]">{label}</p><p className="arabic mt-1 text-[27px] font-semibold leading-none text-[#f8fafc]">{value}</p></article>)}
            </section>

            <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(290px,.85fr)]">
              <article className="border border-white/[.075] bg-[#13253a] p-5 md:p-6">
                <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="arabic text-[16px] font-semibold text-white">تقدّمك في الاستعداد</p><p className="arabic mt-1 text-[12px] text-[#94a3b8]">تطور درجتك ووقت المذاكرة في الفترة الأخيرة</p></div><div className="flex border border-white/[.08] bg-[#0d1b2a] p-1">{["7 أيام", "30 يوم"].map((item) => <button key={item} onClick={() => setRange(item)} className={`arabic px-3 py-1.5 text-[11px] transition-all ${range === item ? "bg-[#f7f775] font-semibold text-[#0d1b2a]" : "text-[#94a3b8] hover:text-white"}`}>{item}</button>)}</div></div>
                <div className="mt-6 overflow-hidden">
                  <svg viewBox="0 0 620 230" className="h-[230px] w-full" role="img" aria-label="مخطط تطور الأداء">
                    <defs><linearGradient id="progressFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#f7f775" stopOpacity=".32" /><stop offset="100%" stopColor="#f7f775" stopOpacity="0" /></linearGradient></defs>
                    {[50, 100, 150, 200].map((y) => <line key={y} x1="0" x2="620" y1={y} y2={y} stroke="#385069" strokeDasharray="3 7" />)}
                    <path d={`M0,194 L${chartPoints} L620,230 L0,230 Z`} fill="url(#progressFill)" />
                    <polyline points={chartPoints} fill="none" stroke="#f7f775" strokeWidth="2.5" />
                    {chartPoints.split(" ").map((point, i) => { const [cx, cy] = point.split(","); return <circle key={i} cx={cx} cy={cy} r={i === 7 ? "5" : "3"} fill="#0d1b2a" stroke="#f7f775" strokeWidth="2" />; })}
                    <text x="0" y="225" fill="#7f93a9" fontSize="10">السبت</text><text x="210" y="225" fill="#7f93a9" fontSize="10">الثلاثاء</text><text x="418" y="225" fill="#7f93a9" fontSize="10">الخميس</text><text x="584" y="225" fill="#f7f775" fontSize="10">اليوم</text>
                  </svg>
                </div>
                <div className="arabic mt-3 flex items-center gap-2 border-t border-white/[.07] pt-4 text-[12px] text-[#aebed0]"><span className="h-2 w-2 bg-[#f7f775]" />أداؤك يتحسن بثبات — أعلى من الأسبوع الماضي بـ 6 نقاط.</div>
              </article>

              <article className="relative overflow-hidden bg-[#213a57] p-6"><div className="absolute -left-14 -top-14 h-44 w-44 rounded-full bg-[#76b8eb]/15 blur-3xl" /><div className="relative flex items-start justify-between"><div><p className="arabic text-[16px] font-semibold text-white">الاختبار القادم</p><p className="arabic mt-1 text-[12px] text-[#b8c9d9]">اختبار محاكي شامل</p></div><CalendarDays size={22} className="text-[#f7f775]" /></div><div className="relative mt-7 border-y border-white/[.12] py-5"><div className="flex items-end justify-between"><div><p className="arabic text-[29px] font-semibold leading-none text-white">01</p><p className="mt-1 text-[11px] tracking-[.14em] text-[#b8c9d9]">سبتمبر 2026</p></div><span className="arabic text-[11px] text-[#b8c9d9]">70 سؤالًا</span></div><p className="arabic mt-4 text-[12px] leading-6 text-[#dbe7f2]">خصّصنا لك اختبارًا بناءً على تقدمك الأخير.</p></div><button className="relative mt-5 flex w-full items-center justify-center gap-2 border border-[#f7f775]/60 py-3 arabic text-[12px] font-semibold text-[#f7f775] transition-all hover:bg-[#f7f775] hover:text-[#0d1b2a]">استعرض التفاصيل <ArrowLeft size={15} /></button></article>
            </section>

            <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(290px,.85fr)]">
              <article className="border border-white/[.075] bg-[#13253a] p-5 md:p-6"><div className="flex items-center justify-between"><div><p className="arabic text-[16px] font-semibold text-white">مسارك هذا الأسبوع</p><p className="arabic mt-1 text-[12px] text-[#94a3b8]">356 من 480 دقيقة مستهدفة</p></div><span className="arabic border border-[#67d5a7]/30 bg-[#67d5a7]/10 px-2.5 py-1 text-[11px] font-semibold text-[#67d5a7]">ممتاز</span></div><div className="mt-7 grid grid-cols-7 gap-2.5 sm:gap-4">{progress.map((day) => <div className="flex flex-col items-center gap-2" key={day.label}><div className="flex h-[108px] w-full max-w-[38px] items-end bg-[#0d1b2a] p-1"><div className={`w-full ${day.today ? "bg-[#f7f775]" : "bg-[#67d5a7]"}`} style={{ height: `${day.height}%` }} /></div><span className={`arabic text-[11px] ${day.today ? "font-bold text-[#f7f775]" : "text-[#94a3b8]"}`}>{day.label}</span></div>)}</div><div className="arabic mt-6 flex items-center justify-between border-t border-white/[.07] pt-4 text-[11px]"><span className="text-[#94a3b8]">هدف اليوم: 60 دقيقة</span><span className="font-semibold text-white">تبقى 8 دقائق</span></div></article>
              <article className="border border-white/[.075] bg-[#13253a] p-6"><div className="flex items-center justify-between"><div><p className="arabic text-[16px] font-semibold text-white">مراجعة ذكية</p><p className="arabic mt-1 text-[12px] text-[#94a3b8]">ركّز عليها في جلستك التالية</p></div><Sparkles size={17} className="text-[#f7f775]" /></div><div className="mt-5 space-y-4">{[{ name: "إكمال الجمل", score: 58, color: "#f69a65" }, { name: "الاستنتاج اللفظي", score: 64, color: "#f7f775" }, { name: "المسائل النسبية", score: 71, color: "#76b8eb" }].map((skill) => <div key={skill.name}><div className="arabic flex justify-between text-[12px]"><span className="text-[#dbe7f2]">{skill.name}</span><span style={{ color: skill.color }}>{skill.score}%</span></div><div className="mt-2 h-1 bg-[#0d1b2a]"><div className="h-full" style={{ width: `${skill.score}%`, background: skill.color }} /></div></div>)}</div><button className="arabic mt-6 flex items-center gap-2 text-[12px] font-semibold text-[#f7f775] hover:text-white">حل الأسئلة المقترحة <ArrowLeft size={14} /></button></article>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}