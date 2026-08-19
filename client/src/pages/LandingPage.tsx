import { Link } from "wouter";
import { useState } from "react";
import {
  ArrowLeft,
  ArrowUpLeft,
  BookOpen,
  Check,
  GraduationCap,
  Landmark,
  Menu,
  Sparkles,
  Target,
  X,
} from "lucide-react";

const NAVY = "#0D1B2A";
const SLATE = "#1E2938";
const MIST = "#94A3B8";
const SIGNAL = "#F7F775";

const pathways = [
  {
    icon: Target,
    title: "قدرات",
    description: "اعرف مستواك، وحدد ما تحتاجه، وابدأ بترتيب واضح.",
  },
  {
    icon: GraduationCap,
    title: "تحصيلي",
    description: "رتّب المواد والخطة القادمة في مكان واحد مفهوم.",
  },
  {
    icon: BookOpen,
    title: "IELTS",
    description: "مسار جاهز للتوسع عندما تكون مستعداً لخطوتك التالية.",
  },
];

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="absolute inset-x-0 top-0 z-30 px-5 pt-5 sm:px-8 sm:pt-7">
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <Link href="/" className="qodratak-focus-ring flex items-center gap-2.5 rounded-xl">
          <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-white/95 shadow-lg shadow-black/10">
            <img src="/qodratak-logo.png" alt="قدراتك" className="h-full w-full object-cover object-top" />
          </div>
          <div className="leading-tight text-right">
            <span className="block text-lg font-black text-white">قدراتك</span>
            <span className="block text-[9px] font-bold tracking-[0.2em] text-white/55">QIROX STUDIO</span>
          </div>
        </Link>

        <div className="hidden items-center gap-2 sm:flex">
          <Link href="/login" className="qodratak-focus-ring rounded-full px-4 py-2 text-sm font-bold text-white/85 transition hover:bg-white/10 hover:text-white">
            تسجيل الدخول
          </Link>
          <Link
            href="/signup"
            className="qodratak-focus-ring inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-black transition hover:-translate-y-0.5"
            style={{ background: SIGNAL, color: NAVY }}
          >
            ابدأ الآن <ArrowLeft size={15} />
          </Link>
        </div>

        <button
          type="button"
          aria-label={menuOpen ? "إغلاق القائمة" : "فتح القائمة"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
          className="qodratak-focus-ring rounded-xl p-2 text-white sm:hidden"
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {menuOpen && (
        <div className="mx-auto mt-3 max-w-6xl rounded-2xl border border-white/15 bg-[#0D1B2A]/95 p-3 shadow-2xl backdrop-blur sm:hidden">
          <Link href="/login" onClick={() => setMenuOpen(false)} className="block rounded-xl px-4 py-3 text-sm font-bold text-white/85 hover:bg-white/10">
            تسجيل الدخول
          </Link>
          <Link href="/signup" onClick={() => setMenuOpen(false)} className="mt-1 block rounded-xl px-4 py-3 text-sm font-black" style={{ background: SIGNAL, color: NAVY }}>
            إنشاء حساب
          </Link>
        </div>
      )}
    </header>
  );
}

export default function LandingPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-white text-slate-900" dir="rtl">
      <section
        className="relative min-h-[670px] overflow-hidden px-5 pt-28 sm:min-h-[740px] sm:px-8 sm:pt-32"
        style={{
          background:
            "radial-gradient(circle at 50% -20%, rgba(247,247,117,0.20), transparent 28%), radial-gradient(circle at 12% 34%, rgba(148,163,184,0.34), transparent 32%), linear-gradient(120deg, #0D1B2A 0%, #1E2938 51%, #244C70 100%)",
        }}
      >
        <div className="absolute left-[8%] top-[26%] -z-10 h-72 w-72 rounded-full bg-[#F7F775]/10 blur-3xl" />
        <div className="absolute right-[8%] top-[16%] -z-10 h-80 w-80 rounded-full bg-sky-300/10 blur-3xl" />
        <Header />

        <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center text-center">
          <div className="landing-enter flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-bold text-white/85 backdrop-blur">
            <Sparkles size={15} style={{ color: SIGNAL }} />
            رحلة تعليمية أوضح، من أول قياس
          </div>
          <h1 className="landing-enter-delay mt-5 text-4xl font-black leading-[1.18] text-white sm:text-5xl">
            حلم أكبر.
            <br />
            <span style={{ color: SIGNAL }}>واستعداد أذكى.</span>
          </h1>
          <p className="landing-enter-delay-2 mt-4 max-w-xl text-base leading-8 text-slate-200 sm:text-lg">
            قدراتك تعطيك نقطة بداية مفهومة، وخطوة تالية واضحة، ومساحة تركّز فيها على ما يهمك.
          </p>

          <div className="landing-enter-delay-2 mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/signup"
              className="qodratak-focus-ring inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-sm font-black shadow-xl transition hover:-translate-y-0.5"
              style={{ background: SIGNAL, color: NAVY, boxShadow: "0 18px 36px rgba(0, 0, 0, 0.22)" }}
            >
              أنشئ حسابك <ArrowLeft size={16} />
            </Link>
            <a href="#journey" className="qodratak-focus-ring inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-6 py-3.5 text-sm font-black text-white transition hover:bg-white/10">
              اكتشف الرحلة <ArrowUpLeft size={16} />
            </a>
          </div>

          <div className="landing-float relative z-10 mt-8 flex h-52 w-52 items-center justify-center rounded-full border-[10px] border-white/20 bg-[#E5E7EB]/15 p-3 shadow-2xl shadow-black/25 backdrop-blur-sm sm:mt-10 sm:h-60 sm:w-60">
            <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-white p-5 shadow-inner">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: NAVY }}>
                <Target size={25} style={{ color: SIGNAL }} />
              </div>
              <p className="mt-3 text-[11px] font-bold text-slate-400">خطوتك الأولى</p>
              <p className="mt-1 text-xl font-black" style={{ color: NAVY }}>قياس المستوى</p>
              <div className="mt-4 h-2 w-28 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full w-[56%] rounded-full" style={{ background: SIGNAL }} />
              </div>
            </div>
          </div>
        </div>

        <div className="absolute inset-x-[-8%] -bottom-28 z-0 h-52 rounded-[50%_50%_0_0/100%_100%_0_0] bg-white" />
      </section>

      <section id="journey" className="relative z-10 mx-auto max-w-5xl px-5 pb-20 pt-4 sm:px-8 sm:pt-10">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-black tracking-[0.18em]" style={{ color: MIST }}>قدراتك، كما يجب أن تكون</p>
          <h2 className="mt-3 text-3xl font-black leading-tight sm:text-4xl" style={{ color: NAVY }}>
            بداية بسيطة. طريق مرتب. نتائج تفهمها.
          </h2>
          <p className="mt-5 text-base leading-8 text-slate-500">
            لا نطلب منك أن تعرف كل شيء من البداية؛ فقط ابدأ من مكانك، ودع المنصة تنظّم خطوتك التالية.
          </p>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {pathways.map((pathway, index) => (
            <article key={pathway.title} className="group rounded-[1.8rem] border border-slate-200 bg-white p-6 shadow-[0_16px_40px_rgba(13,27,42,0.06)] transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_22px_50px_rgba(13,27,42,0.12)]">
              <div className="flex items-center justify-between">
                <span className="text-sm font-black text-slate-300">0{index + 1}</span>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: index === 1 ? SIGNAL : "#E5E7EB", color: NAVY }}>
                  <pathway.icon size={24} />
                </div>
              </div>
              <h3 className="mt-9 text-2xl font-black" style={{ color: NAVY }}>{pathway.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-500">{pathway.description}</p>
              <Link href="/signup" className="qodratak-focus-ring mt-6 inline-flex items-center gap-1.5 text-sm font-black transition group-hover:gap-2.5" style={{ color: NAVY }}>
                ابدأ المسار <ArrowLeft size={15} />
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-[#E5E7EB]/60 px-5 py-20 sm:px-8">
        <div className="mx-auto grid max-w-5xl items-center gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="relative mx-auto grid h-64 w-64 place-items-center rounded-full border-[18px] border-white bg-[#0D1B2A] shadow-2xl shadow-[#0D1B2A]/20 sm:h-72 sm:w-72">
            <div className="absolute -left-4 top-12 rounded-2xl bg-white px-4 py-3 shadow-xl">
              <p className="text-[10px] font-bold text-slate-400">اليوم</p>
              <p className="mt-1 text-sm font-black" style={{ color: NAVY }}>جلسة مركزة</p>
            </div>
            <div className="absolute -right-4 bottom-12 rounded-2xl px-4 py-3 shadow-xl" style={{ background: SIGNAL, color: NAVY }}>
              <p className="text-[10px] font-bold">الخطوة التالية</p>
              <p className="mt-1 text-sm font-black">اختبار تدريبي</p>
            </div>
            <div className="text-center text-white">
              <p className="text-xs font-bold text-slate-300">رحلتك من هنا</p>
              <p className="mt-2 text-3xl font-black">واضحة</p>
              <div className="mx-auto mt-4 h-1.5 w-20 rounded-full bg-white/20">
                <div className="h-full w-3/5 rounded-full" style={{ background: SIGNAL }} />
              </div>
            </div>
          </div>

          <div className="text-center lg:text-right">
            <p className="text-sm font-black" style={{ color: SLATE }}>مساحة واحدة، بدون تشتيت</p>
            <h2 className="mt-3 text-3xl font-black leading-tight sm:text-4xl" style={{ color: NAVY }}>
              كل ما تحتاجه لتعرف أين أنت، وماذا بعد.
            </h2>
            <ul className="mt-7 space-y-3 text-right">
              {[
                "اختبارات تساعدك على تحديد البداية.",
                "تدريب منظم يحافظ على تركيزك.",
                "متابعة واضحة لما أنجزته وما بقي.",
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3.5 text-sm font-bold text-slate-600 shadow-sm">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full" style={{ background: SIGNAL, color: NAVY }}>
                    <Check size={14} strokeWidth={3} />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-4xl overflow-hidden rounded-[2.25rem] p-8 text-center sm:p-14" style={{ background: NAVY }}>
          <Landmark className="mx-auto" size={30} style={{ color: SIGNAL }} />
          <p className="mt-5 text-sm font-black" style={{ color: SIGNAL }}>للطلاب والمدرسين والمدارس</p>
          <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">رحلة تعليمية تبدأ الآن.</h2>
          <p className="mx-auto mt-4 max-w-xl leading-8 text-slate-300">
            اختر حسابك، أكمل بياناتك، وابدأ تجربتك مع قدراتك بهوية Qirox Studio.
          </p>
          <Link href="/signup" className="qodratak-focus-ring mt-8 inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-black transition hover:-translate-y-0.5" style={{ background: SIGNAL, color: NAVY }}>
            ابدأ رحلتك الآن <ArrowLeft size={16} />
          </Link>
        </div>
      </section>

      <footer className="border-t border-slate-100 px-5 py-8 sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 text-center sm:flex-row sm:text-right">
          <div className="flex items-center gap-2">
            <img src="/qodratak-logo.png" alt="" className="h-8 w-8 rounded-lg object-cover object-top" />
            <span className="text-sm font-black" style={{ color: NAVY }}>قدراتك</span>
          </div>
          <p className="text-xs font-bold text-slate-400">تصميم وتطوير Qirox Studio</p>
        </div>
      </footer>

      <style>{`
        @keyframes landing-enter {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes landing-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .landing-enter { animation: landing-enter .7s ease both; }
        .landing-enter-delay { animation: landing-enter .7s .12s ease both; }
        .landing-enter-delay-2 { animation: landing-enter .7s .22s ease both; }
        .landing-float { animation: landing-float 4s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .landing-enter, .landing-enter-delay, .landing-enter-delay-2, .landing-float { animation: none; }
        }
      `}</style>
    </main>
  );
}