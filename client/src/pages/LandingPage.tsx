import { Link } from "wouter";
import { useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  BrainCircuit,
  Building2,
  CheckCircle2,
  ChevronLeft,
  Globe2,
  GraduationCap,
  Headphones,
  Languages,
  Menu,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Target,
  X,
} from "lucide-react";

const NAVY = "#0D1B2A";
const SLATE = "#1E2938";
const MIST = "#94A3B8";
const SIGNAL = "#F7F775";
const CANVAS = "#E5E7EB";

const pathways = [
  {
    icon: BrainCircuit,
    eyebrow: "قدرات",
    title: "تدريب يقرأ مستواك",
    description: "اختبارات منظمة، شروحات واضحة، وخطة تتقدم معك خطوة بخطوة.",
  },
  {
    icon: GraduationCap,
    eyebrow: "تحصيلي",
    title: "تحضير منضبط للمواد",
    description: "مسارات تعلّم قابلة للتخصيص حسب المادة والوقت المتاح لك.",
  },
  {
    icon: Globe2,
    eyebrow: "IELTS",
    title: "توسّع جاهز للمستقبل",
    description: "بنية تعليمية واحدة تُضيف الاختبارات الجديدة من دون تعقيد.",
  },
];

const principles = [
  "تجربة اختبار مركّزة بلا تشتيت",
  "نتائج مفهومة وخطة قابلة للتنفيذ",
  "دعم عربي وإنجليزي لجميع المستخدمين",
  "منصة متصلة للطالب والمدرس والمدرسة",
];

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const links = [
    { label: "المنصة", href: "#platform" },
    { label: "للمدارس", href: "#institutions" },
    { label: "عن قدراتك", href: "#about" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 lg:px-8">
        <Link href="/" className="qodratak-focus-ring flex items-center gap-3 rounded-lg">
          <img
            src="/qodratak-logo.png"
            alt="قدراتك"
            className="h-11 w-11 rounded-xl object-cover object-top shadow-sm"
          />
          <div className="leading-tight">
            <span className="block text-lg font-black tracking-tight" style={{ color: NAVY }}>قدراتك</span>
            <span className="block text-[10px] font-bold tracking-[0.18em]" style={{ color: MIST }}>QODRATAK</span>
          </div>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {links.map((link) => (
            <a key={link.href} href={link.href} className="qodratak-focus-ring rounded-md text-sm font-bold text-slate-600 transition-colors hover:text-slate-950">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link href="/login" className="qodratak-focus-ring rounded-xl px-4 py-2 text-sm font-black text-slate-700 transition hover:bg-slate-100">
            تسجيل الدخول
          </Link>
          <Link
            href="/signup"
            className="qodratak-focus-ring inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-black transition hover:-translate-y-0.5"
            style={{ background: NAVY, color: "white", boxShadow: "0 8px 22px rgba(13, 27, 42, 0.18)" }}
          >
            ابدأ رحلتك <ArrowLeft size={16} />
          </Link>
        </div>

        <button
          type="button"
          aria-label={menuOpen ? "إغلاق القائمة" : "فتح القائمة"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((value) => !value)}
          className="qodratak-focus-ring rounded-lg p-2 text-slate-700 md:hidden"
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {menuOpen && (
        <div className="border-t border-slate-200 bg-white px-5 py-4 md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-1">
            {links.map((link) => (
              <a key={link.href} href={link.href} onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-3 text-sm font-bold text-slate-700 hover:bg-slate-100">
                {link.label}
              </a>
            ))}
            <div className="mt-2 grid grid-cols-2 gap-3">
              <Link href="/login" className="rounded-xl border border-slate-200 px-3 py-3 text-center text-sm font-black text-slate-700">
                دخول
              </Link>
              <Link href="/signup" className="rounded-xl px-3 py-3 text-center text-sm font-black text-white" style={{ background: NAVY }}>
                إنشاء حساب
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export default function LandingPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#F7F8FA] text-slate-900" dir="rtl">
      <Header />

      <section className="relative isolate overflow-hidden px-5 pb-16 pt-14 sm:pb-24 sm:pt-20 lg:px-8">
        <div className="absolute inset-x-0 top-0 -z-10 h-[82%] qodratak-brand-gradient" />
        <div className="absolute -left-24 top-20 -z-10 h-72 w-72 rounded-full bg-[#F7F775]/20 blur-3xl" />
        <div className="absolute right-1/4 top-0 -z-10 h-80 w-80 rounded-full bg-slate-400/20 blur-3xl" />

        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
          <div className="pt-4 text-center lg:text-right">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-bold text-white/90 backdrop-blur">
              <Sparkles size={15} style={{ color: SIGNAL }} />
              منصة تعليمية تُبنى حول تقدّمك الحقيقي
            </div>
            <h1 className="max-w-3xl text-4xl font-black leading-[1.17] tracking-tight text-white sm:text-5xl lg:text-6xl">
              قياس واضح لقدراتك.
              <span className="mt-2 block" style={{ color: SIGNAL }}>وتدريب يصنع الفرق.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-slate-200 sm:text-lg lg:mx-0">
              قدراتك هي المساحة الهادئة التي تجمع الاختبار، التعلّم، والمتابعة في رحلة واحدة مصممة للطالب السعودي.
            </p>
            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
              <Link
                href="/signup"
                className="qodratak-focus-ring inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-4 text-sm font-black text-slate-950 transition hover:-translate-y-0.5"
                style={{ background: SIGNAL, boxShadow: "0 12px 32px rgba(0, 0, 0, 0.22)" }}
              >
                أنشئ حسابك الآن <ArrowLeft size={17} />
              </Link>
              <a
                href="#platform"
                className="qodratak-focus-ring inline-flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/5 px-6 py-4 text-sm font-black text-white transition hover:bg-white/10"
              >
                اكتشف المنصة <ChevronLeft size={17} />
              </a>
            </div>
            <div className="mt-8 flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs font-bold text-slate-300 lg:justify-start">
              <span className="inline-flex items-center gap-1.5"><ShieldCheck size={15} style={{ color: SIGNAL }} />خصوصية وأمان</span>
              <span className="inline-flex items-center gap-1.5"><Languages size={15} style={{ color: SIGNAL }} />عربي وإنجليزي</span>
              <span className="inline-flex items-center gap-1.5"><MessageCircle size={15} style={{ color: SIGNAL }} />متابعة قريبة منك</span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-md lg:max-w-none">
            <div className="absolute -inset-4 rounded-[2rem] bg-[#F7F775]/15 blur-2xl" />
            <div className="relative overflow-hidden rounded-[1.75rem] border border-white/35 bg-white p-3 shadow-2xl">
              <div className="overflow-hidden rounded-[1.25rem] bg-[#E5E7EB] p-5 sm:p-6">
                <div className="mb-7 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white shadow-sm">
                      <Target size={22} style={{ color: NAVY }} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-500">لوحة التقدّم</p>
                      <p className="text-sm font-black" style={{ color: NAVY }}>رحلتك اليوم</p>
                    </div>
                  </div>
                  <span className="rounded-lg bg-white px-3 py-1.5 text-xs font-black text-slate-600">الطالب</span>
                </div>
                <div className="rounded-2xl p-5 text-white" style={{ background: NAVY }}>
                  <p className="text-xs font-bold text-slate-300">خطة اليوم</p>
                  <div className="mt-4 flex items-end justify-between">
                    <div>
                      <p className="text-3xl font-black">01</p>
                      <p className="mt-1 text-xs font-bold text-slate-300">جلسة مركزة</p>
                    </div>
                    <BrainCircuit size={34} style={{ color: SIGNAL }} />
                  </div>
                  <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/15">
                    <div className="h-full w-[44%] rounded-full" style={{ background: SIGNAL }} />
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-white p-4">
                    <p className="text-xs font-bold text-slate-500">خطوة تالية</p>
                    <p className="mt-2 text-sm font-black" style={{ color: NAVY }}>اختبار تدريبي</p>
                  </div>
                  <div className="rounded-2xl bg-white p-4">
                    <p className="text-xs font-bold text-slate-500">التعلّم</p>
                    <p className="mt-2 text-sm font-black" style={{ color: NAVY }}>مسار شخصي</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-5 -right-5 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-xl">
              <p className="text-[10px] font-bold text-slate-400">بدعم</p>
              <p className="text-xs font-black" style={{ color: NAVY }}>Qirox Studio</p>
            </div>
          </div>
        </div>
      </section>

      <section id="platform" className="px-5 py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="text-sm font-black" style={{ color: SLATE }}>منصة واحدة. مسارات كثيرة.</p>
            <h2 className="mt-3 text-3xl font-black leading-tight sm:text-4xl" style={{ color: NAVY }}>
              كل أداة تحتاجها لتتقدّم بثقة.
            </h2>
            <p className="mt-4 leading-7 text-slate-500">
              من أول اختبار تشخيصي إلى آخر مراجعة، تبقى تجربتك منظمة وسهلة الفهم.
            </p>
          </div>

          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {pathways.map((pathway) => (
              <article key={pathway.eyebrow} className="group rounded-3xl border border-slate-200 bg-white p-7 shadow-[0_10px_30px_rgba(13,27,42,0.04)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_45px_rgba(13,27,42,0.10)]">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: CANVAS, color: NAVY }}>
                  <pathway.icon size={25} />
                </div>
                <p className="mt-7 text-xs font-black tracking-[0.16em]" style={{ color: MIST }}>{pathway.eyebrow}</p>
                <h3 className="mt-2 text-xl font-black" style={{ color: NAVY }}>{pathway.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-500">{pathway.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="institutions" className="px-5 py-10 lg:px-8">
        <div className="mx-auto grid max-w-7xl overflow-hidden rounded-[2rem] lg:grid-cols-[0.9fr_1.1fr]" style={{ background: SLATE }}>
          <div className="p-8 sm:p-12">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10" style={{ color: SIGNAL }}>
              <Building2 size={26} />
            </div>
            <p className="mt-8 text-sm font-black" style={{ color: SIGNAL }}>للمدارس والمعلّمين</p>
            <h2 className="mt-3 text-3xl font-black leading-tight text-white">متابعة حقيقية، من غير تعقيد.</h2>
            <p className="mt-5 max-w-xl text-sm leading-7 text-slate-300">
              لوحات منفصلة للمدرس والمدرسة تساعدهم على متابعة المجموعات، الخطط، والتقدّم في مكان واحد.
            </p>
            <Link href="/signup" className="qodratak-focus-ring mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-black transition hover:bg-slate-100" style={{ color: NAVY }}>
              ابدأ كمؤسسة <ArrowLeft size={16} />
            </Link>
          </div>
          <div className="relative min-h-[280px] p-8 sm:p-12">
            <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "radial-gradient(#F7F775 1px, transparent 1px)", backgroundSize: "22px 22px" }} />
            <div className="relative mt-3 rounded-3xl bg-white p-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-100 pb-5">
                <div>
                  <p className="text-xs font-bold text-slate-500">نظرة عامة للمؤسسة</p>
                  <p className="mt-1 text-lg font-black" style={{ color: NAVY }}>متابعة منظمة</p>
                </div>
                <div className="h-9 w-9 rounded-xl" style={{ background: SIGNAL }} />
              </div>
              <div className="mt-6 space-y-3">
                {["خطط الدراسة", "تقارير الأداء", "الاختبارات المجدولة"].map((item, index) => (
                  <div key={item} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                    <span className="text-sm font-bold text-slate-700">{item}</span>
                    <span className="text-xs font-black" style={{ color: NAVY }}>0{index + 1}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="about" className="px-5 py-20 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-sm font-black" style={{ color: SLATE }}>كيف نفكر في التعلّم</p>
            <h2 className="mt-3 text-3xl font-black leading-tight sm:text-4xl" style={{ color: NAVY }}>
              تركيز أكثر. ضجيج أقل. تقدّم يمكن قياسه.
            </h2>
            <p className="mt-5 max-w-xl leading-8 text-slate-500">
              نعيد بناء قدراتك على أساس واحد: أن يفهم الطالب أين هو، وما هي خطوته التالية، وكيف يصل إليها بثقة.
            </p>
          </div>
          <ul className="grid gap-3">
            {principles.map((principle) => (
              <li key={principle} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-bold text-slate-700">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full" style={{ background: SIGNAL, color: NAVY }}>
                  <CheckCircle2 size={15} />
                </span>
                {principle}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="px-5 pb-20 lg:px-8">
        <div className="mx-auto max-w-7xl rounded-[2rem] px-7 py-12 text-center sm:px-12" style={{ background: CANVAS }}>
          <Headphones className="mx-auto" size={29} style={{ color: NAVY }} />
          <h2 className="mt-5 text-3xl font-black" style={{ color: NAVY }}>ابدأ بخطوتك التالية.</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-500">
            أنشئ حسابك وابدأ رحلتك التعليمية مع قدراتك.
          </p>
          <Link href="/signup" className="qodratak-focus-ring mt-7 inline-flex items-center gap-2 rounded-xl px-6 py-3.5 text-sm font-black text-white transition hover:-translate-y-0.5" style={{ background: NAVY }}>
            ابدأ الآن <ArrowLeft size={16} />
          </Link>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white px-5 py-8 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-right">
          <div className="flex items-center gap-2">
            <img src="/qodratak-logo.png" alt="" className="h-8 w-8 rounded-lg object-cover object-top" />
            <span className="text-sm font-black" style={{ color: NAVY }}>قدراتك</span>
          </div>
          <p className="text-xs font-bold text-slate-400">تصميم وتطوير Qirox Studio</p>
        </div>
      </footer>
    </main>
  );
}