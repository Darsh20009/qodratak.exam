import { useState } from "react";
import { Link } from "wouter";
import {
  ArrowLeft,
  BarChart3,
  BookOpenCheck,
  Check,
  ChevronLeft,
  Clock3,
  Layers3,
  Menu,
  Target,
  X,
} from "lucide-react";
import { SignupModal } from "@/components/SignupModal";
import { TestimonialsSection } from "@/components/TestimonialsSection";

const NAVY = "#171723";
const INK = "#2A2636";
const SIGNAL = "#FF8A70";
const MINT = "#91D7C5";

const journey = [
  {
    number: "01",
    title: "اكتشف نقطة البداية",
    text: "اختبار تشخيصي مختصر يوضح جوانب القوة وما يحتاج تدريبًا.",
    icon: Target,
  },
  {
    number: "02",
    title: "تدرّب على المسار",
    text: "تأسيس، بنوك أسئلة ومحاكاة مرتبة حسب هدفك واشتراكك.",
    icon: BookOpenCheck,
  },
  {
    number: "03",
    title: "راجع تقدّمك",
    text: "نتيجة واضحة بعد كل محاولة وخطة أبسط لما ستفعله بعدها.",
    icon: BarChart3,
  },
];

const platformSections = [
  ["الاختبارات المحاكية", "جرّب بيئة اختبار مرتبة مع وقت وأقسام ونتيجة مفهومة."],
  ["التأسيس الكمي واللفظي", "ابدأ من المفهوم ثم انتقل إلى التدريب الذي يناسب مستواك."],
  ["بنك الأسئلة", "راجع الأسئلة بحسب القسم والمهارة وما تحتاج تحسينه."],
  ["التحصيلي وIELTS", "مساحات مستقلة تظهر لك عندما تكون مشمولة في اشتراكك."],
  ["لوحة التقدم", "ملخص واحد لمحاولاتك، خطتك، ومدة اشتراكك."],
];

const differences = [
  ["تدريب له سبب", "كل جلسة تربطك بهدف محدد بدل أن تتنقل بين أسئلة غير مترابطة."],
  ["نتيجة قابلة للفهم", "ترى أين تحسنت وما الذي تحتاج أن تراجعه بعد الاختبار."],
  ["مسار لا يشتتك", "لا تظهر لك إلا المساحات المتاحة لخطتك واشتراكك."],
];

function Header({ onSignup }: { onSignup: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="relative z-30 border-b border-[#24202D]/[.09] bg-[#F7F4EE]">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
        <Link href="/" className="qodratak-focus-ring flex items-center gap-2.5 rounded-lg">
          <img src="/qodratak-logo.png" alt="قدراتك" className="h-10 w-10 rounded-lg object-cover object-top" />
          <div className="leading-tight">
            <span className="block text-base font-black" style={{ color: NAVY }}>قدراتك</span>
            <span className="block text-[9px] font-bold tracking-[0.17em] text-[#8B8278]">STUDY SYSTEMS</span>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 sm:flex">
          <a href="#journey" className="qodratak-focus-ring text-sm font-bold text-[#6B625B] transition hover:text-[#24202D]">كيف تعمل المنصة</a>
          <a href="#inside" className="qodratak-focus-ring text-sm font-bold text-[#6B625B] transition hover:text-[#24202D]">ماذا ستجد</a>
          <Link href="/login" className="qodratak-focus-ring text-sm font-bold text-[#24202D]">تسجيل الدخول</Link>
          <button
            onClick={onSignup}
            className="qodratak-focus-ring rounded-md px-4 py-2.5 text-sm font-black transition hover:-translate-y-0.5"
            style={{ background: SIGNAL, color: NAVY }}
          >
            أنشئ حسابك
          </button>
        </nav>

        <button
          type="button"
          aria-label={menuOpen ? "إغلاق القائمة" : "فتح القائمة"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
          className="qodratak-focus-ring rounded-lg p-2 text-[#24202D] sm:hidden"
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {menuOpen && (
        <div className="border-t border-[#24202D]/[.09] px-5 py-3 sm:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col gap-1">
            <a href="#journey" onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-bold text-[#6B625B]">كيف تعمل المنصة</a>
            <a href="#inside" onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-bold text-[#6B625B]">ماذا ستجد</a>
            <Link href="/login" onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-bold text-[#6B625B]">تسجيل الدخول</Link>
            <button
              onClick={() => { setMenuOpen(false); onSignup(); }}
              className="mt-1 rounded-lg px-3 py-2.5 text-right text-sm font-black"
              style={{ background: SIGNAL, color: NAVY }}
            >أنشئ حسابك</button>
          </nav>
        </div>
      )}
    </header>
  );
}

function ScorePreview() {
  return (
    <div className="relative mx-auto w-full max-w-[440px] overflow-hidden rounded-[18px] border border-[#24202D]/[.11] bg-[#FFFCF7] p-5 shadow-[0_26px_70px_rgba(42,38,54,.12)]">
      <div className="pointer-events-none absolute -left-16 -top-16 h-40 w-40 rounded-full blur-3xl" style={{ background: `${MINT}30` }} />
      <div className="relative flex items-center justify-between border-b border-[#24202D]/[.1] pb-4">
        <div>
          <p className="text-[10px] font-black tracking-[0.16em] text-[#8B8278]">خريطة الاستعداد</p>
          <p className="mt-1 text-sm font-black" style={{ color: NAVY }}>أين تقف قبل الاختبار؟</p>
        </div>
        <div className="border border-[#72BFAF]/35 bg-[#E7F2ED] px-2.5 py-1 text-[10px] font-bold" style={{ color: "#398B79" }}>تحديث اليوم</div>
      </div>

      <div className="relative grid grid-cols-[1fr_1.05fr] items-center gap-4 py-6">
        <div className="relative mx-auto flex h-32 w-32 items-center justify-center rounded-full" style={{ background: `conic-gradient(${SIGNAL} 0deg 222deg, ${MINT} 222deg 274deg, rgba(42,38,54,.12) 274deg 360deg)` }}>
          <div className="flex h-[104px] w-[104px] flex-col items-center justify-center rounded-full bg-[#FFFCF7]">
            <span className="text-3xl font-black" style={{ color: NAVY }}>76</span>
            <span className="mt-0.5 text-[10px] font-bold text-[#8B8278]">جاهزية</span>
          </div>
        </div>
        <div className="space-y-3">
          {[
            ["الكمي", "72%", "72%", SIGNAL],
            ["اللفظي", "81%", "81%", MINT],
            ["إدارة الوقت", "68%", "68%", "#B8A4FF"],
          ].map(([label, value, width, color]) => (
            <div key={label}>
              <div className="mb-1 flex justify-between text-[10px] font-bold text-[#6B625B]"><span>{label}</span><span>{value}</span></div>
              <div className="h-1.5 overflow-hidden bg-[#E9E5DE]"><span className="block h-full" style={{ width, background: color }} /></div>
            </div>
          ))}
        </div>
      </div>

      <div className="relative flex items-center gap-2 border border-[#24202D]/[.1] bg-[#F3EEE7] px-3 py-3">
        <Target className="h-4 w-4 shrink-0" style={{ color: SIGNAL }} />
        <p className="text-xs font-bold leading-5" style={{ color: NAVY }}>الخطوة الأوضح الآن: 14 سؤالًا في استراتيجيات الكمي.</p>
      </div>
    </div>
  );
}

function ExamPreview() {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_24px_80px_rgba(13,27,42,0.1)]">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0D1B2A] text-[10px] font-black text-[#F7F775]">ق</div>
          <div>
            <p className="text-[11px] font-black text-[#0D1B2A]">اختبار محاكي</p>
            <p className="text-[9px] font-bold text-slate-400">القسم 02 من 05</p>
          </div>
        </div>
        <div className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-black text-slate-600"><Clock3 className="h-3 w-3" /> 18:32</div>
      </div>
      <div className="pt-4">
        <div className="h-2 w-16 rounded-full bg-[#F7F775]" />
        <p className="mt-3 text-sm font-black leading-6 text-[#0D1B2A]">إذا كان مجموع عددين يساوي 24، فما قيمة العدد الأكبر؟</p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {["8", "12", "16", "18"].map((choice, index) => (
            <div key={choice} className={`rounded-xl border px-3 py-2.5 text-center text-xs font-black ${index === 2 ? "border-[#0D1B2A] bg-[#0D1B2A] text-white" : "border-slate-200 text-slate-500"}`}>{choice}</div>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-1.5">
          {[...Array(8)].map((_, index) => <span key={index} className={`h-1.5 flex-1 rounded-full ${index < 5 ? "bg-[#0D1B2A]" : "bg-slate-100"}`} />)}
        </div>
      </div>
    </div>
  );
}

/* ── Student avatars strip ── */
function StudentStrip({ onSignup }: { onSignup: () => void }) {
  const students = [
    { src: "/students/student-f1.png", name: "ريم" },
    { src: "/students/student-m1.jpg", name: "فهد" },
    { src: "/students/student-f2.jpg", name: "نورة" },
    { src: "/students/student-m2.jpg", name: "عبدالله" },
    { src: "/students/student-f3.jpg", name: "سارة" },
  ];
  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="flex -space-x-2.5 space-x-reverse">
        {students.map((s, i) => (
          <div
            key={i}
            className="h-11 w-11 overflow-hidden rounded-full border-2 bg-slate-300 shadow"
            style={{ borderColor: NAVY, zIndex: students.length - i }}
          >
            <img src={s.src} alt={s.name} className="h-full w-full object-cover object-top" />
          </div>
        ))}
      </div>
      <div>
        <p className="text-sm font-black text-white">+٢١٠٠ طالب يستعدون الآن</p>
        <button onClick={onSignup} className="mt-0.5 text-xs font-bold underline" style={{ color: SIGNAL }}>
          انضم إليهم مجاناً →
        </button>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const [signupOpen, setSignupOpen] = useState(false);

  return (
    <main className="min-h-screen overflow-hidden bg-[#F7F4EE] text-slate-900" dir="rtl">
      <SignupModal open={signupOpen} onClose={() => setSignupOpen(false)} />

      {/* ── Hero ── */}
      <section className="relative isolate overflow-hidden bg-[#F7F4EE]">
        <div className="pointer-events-none absolute inset-0" style={{ background: `radial-gradient(circle at 9% 18%, ${MINT}20, transparent 24%), radial-gradient(circle at 78% 105%, ${SIGNAL}18, transparent 38%)` }} />
        <div className="pointer-events-none absolute left-[-12rem] top-28 h-[28rem] w-[28rem] rounded-full border border-[#24202D]/[.055]" />
        <div className="pointer-events-none absolute -bottom-32 right-[38%] h-72 w-72 rounded-full border border-[#24202D]/[.055]" />
        <Header onSignup={() => setSignupOpen(true)} />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 pb-20 pt-14 sm:px-8 lg:grid-cols-[1.08fr_.92fr] lg:pb-28 lg:pt-20">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 border-b border-[#24202D]/[.16] pb-2 text-xs font-bold text-[#6B625B]">
              <span className="h-2 w-2 rounded-full" style={{ background: MINT }} />
              منصة استعداد مصممة للطالب السعودي
            </div>
            <h1 className="mt-7 text-[2.65rem] font-black leading-[1.1] tracking-tight sm:text-6xl" style={{ color: NAVY }}>
              لا تذاكر أكثر.
              <br />
              <span style={{ color: SIGNAL }}>ذاكر باتجاه.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-8 text-[#6B625B] sm:text-lg">
              حوّل الاستعداد للاختبار من أسئلة مبعثرة إلى خطة تعرف فيها مستواك، تدريبك القادم، وسبب كل خطوة.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button
                onClick={() => setSignupOpen(true)}
                className="qodratak-focus-ring inline-flex items-center gap-2 rounded-md px-5 py-3.5 text-sm font-black transition hover:-translate-y-0.5"
                style={{ background: SIGNAL, color: NAVY }}
              >
                ابدأ حسابك <ArrowLeft size={17} />
              </button>
              <a href="#journey" className="qodratak-focus-ring inline-flex items-center gap-2 border border-[#24202D]/[.18] px-5 py-3.5 text-sm font-bold transition hover:border-[#24202D]/40 hover:bg-[#24202D]/[.05]" style={{ color: NAVY }}>
                شاهد كيف تبدأ <ChevronLeft size={17} />
              </a>
            </div>
            <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 border-t border-[#24202D]/[.1] pt-5 text-xs font-bold text-[#6B625B]">
              {["تشخيص قبل التدريب", "محاكاة بوقت حقيقي", "تحليل واضح بعد كل محاولة"].map((item) => <span key={item} className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5" style={{ color: MINT }} />{item}</span>)}
            </div>
            <div className="mt-8 flex items-center gap-3">
              <span className="text-3xl font-black" style={{ color: NAVY }}>+٢١٠٠</span>
              <span className="max-w-[9rem] text-xs font-bold leading-5 text-[#8B8278]">طالب يبنون خطة استعدادهم الآن</span>
              <span className="h-8 w-px bg-[#24202D]/15" />
              <button onClick={() => setSignupOpen(true)} className="text-xs font-bold underline underline-offset-4 transition hover:text-[#24202D]" style={{ color: "#398B79" }}>انضم إليهم مجانًا</button>
            </div>
          </div>
          <ScorePreview />
        </div>
      </section>

      {/* ── Stats bar ── */}
      <section className="relative z-10 mx-auto -mt-7 max-w-7xl px-5 sm:px-8">
        <div className="grid overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_50px_rgba(13,27,42,.08)] sm:grid-cols-3">
          {[
            ["5", "مساحات تعلّم", "قدرات، تحصيلي، IELTS وتدريب مخصص."],
            ["2", "جهازان نشطان", "تحكم أوضح في أمان حسابك."],
            ["1", "لوحة تقدم", "تعرف منها خطوتك التالية دائمًا."],
          ].map(([number, title, text], index) => (
            <div key={title} className={`px-5 py-5 sm:px-7 ${index ? "border-t border-slate-100 sm:border-r sm:border-t-0" : ""}`}>
              <span className="text-3xl font-black" style={{ color: NAVY }}>{number}</span>
              <p className="mt-1 text-sm font-black text-slate-800">{title}</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── What you get — with student photo ── */}
      <section className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-24 sm:px-8 lg:grid-cols-[1.02fr_.98fr]">
        <div className="relative overflow-hidden rounded-[28px] bg-[#DCE4E8]">
          <img
            src="/attached_assets/generated_images/qodratak-students-study.jpg"
            alt="طلاب يراجعون دراستهم معًا"
            className="aspect-[4/3] h-full w-full object-cover"
          />
          <div className="absolute inset-x-4 bottom-4 rounded-2xl border border-white/40 bg-white/90 p-4 backdrop-blur-sm">
            <p className="text-xs font-black text-[#0D1B2A]">ليست مجرد أسئلة أكثر.</p>
            <p className="mt-1 text-xs leading-5 text-slate-600">هي طريقة أوضح لتعرف لماذا تتدرّب على هذا السؤال الآن.</p>
          </div>
        </div>
        <div>
          <p className="text-sm font-black text-slate-400">ماذا ستحصل عليه؟</p>
          <h2 className="mt-3 text-3xl font-black leading-tight sm:text-4xl" style={{ color: NAVY }}>كل ما تحتاجه للاستعداد، في رحلة واحدة مفهومة.</h2>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {[
              ["تدريب منظم", "تتدرج من التأسيس إلى المحاكاة."],
              ["نتائج مباشرة", "تعرف ما تحتاج إليه بعد كل محاولة."],
              ["خطة شخصية", "تظهر لك الخطوة التالية بوضوح."],
              ["تجربة آمنة", "تحكم أكبر في حسابك وأجهزتك."],
            ].map(([title, text]) => (
              <div key={title} className="border-t border-slate-200 pt-3">
                <h3 className="text-sm font-black text-[#0D1B2A]">{title}</h3>
                <p className="mt-1 text-xs leading-5 text-slate-500">{text}</p>
              </div>
            ))}
          </div>
          <button
            onClick={() => setSignupOpen(true)}
            className="qodratak-focus-ring mt-7 inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-black transition hover:-translate-y-0.5"
            style={{ background: NAVY, color: SIGNAL }}
          >
            ابدأ حسابك مجاناً <ArrowLeft size={16} />
          </button>
        </div>
      </section>

      {/* ── Journey ── */}
      <section id="journey" className="mx-auto max-w-7xl px-5 py-24 sm:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-black text-slate-400">رحلة الطالب داخل قدراتك</p>
          <h2 className="mt-3 text-3xl font-black leading-tight sm:text-4xl" style={{ color: NAVY }}>من أول محاولة إلى خطة تعرف سبب كل خطوة فيها.</h2>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {journey.map(({ number, title, text, icon: Icon }) => (
            <article key={title} className="group relative border-t-2 border-slate-200 pt-5 transition hover:border-[#0D1B2A]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black tracking-[.16em] text-slate-400">{number}</span>
                <Icon className="h-5 w-5 text-slate-400 transition group-hover:text-[#0D1B2A]" />
              </div>
              <h3 className="mt-7 text-xl font-black" style={{ color: NAVY }}>{title}</h3>
              <p className="mt-3 max-w-xs text-sm leading-7 text-slate-500">{text}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ── How to start ── */}
      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8">
          <div className="flex max-w-2xl flex-col gap-3">
            <p className="text-sm font-black text-slate-400">كيف تبدأ؟</p>
            <h2 className="text-3xl font-black leading-tight sm:text-4xl" style={{ color: NAVY }}>أربع محطات، وكل محطة تعرفك بما بعدها.</h2>
          </div>
          <div className="mt-12 grid gap-0 border-t border-slate-200 md:grid-cols-4">
            {[
              ["01", "أنشئ حسابك", "اسمك، بريدك، ورقم واتساب واحد للتأكيد."],
              ["02", "اختر نقطة البداية", "عرّف خطتك أو ابدأ بتدريب يوضح مستواك."],
              ["03", "أكمل المحاولات", "تدرب في المسارات المتاحة لك بهدوء وتركيز."],
              ["04", "استخدم النتيجة", "راجع أخطاءك وحدد ما ستتدرب عليه بعد ذلك."],
            ].map(([number, title, text], index) => (
              <article key={title} className={`min-h-48 border-b border-slate-200 px-0 py-6 md:border-b-0 md:px-5 ${index ? "md:border-r" : "md:pr-0"}`}>
                <span className="text-xs font-black tracking-[.16em] text-[#0D1B2A]">{number}</span>
                <h3 className="mt-8 text-lg font-black text-[#0D1B2A]">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-500">{text}</p>
              </article>
            ))}
          </div>
          <div className="mt-10 flex justify-center">
            <button
              onClick={() => setSignupOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl px-6 py-3.5 text-sm font-black transition hover:-translate-y-0.5"
              style={{ background: SIGNAL, color: NAVY }}
            >
              ابدأ الآن — مجاناً <ArrowLeft size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* ── Inside (what you find) ── */}
      <section id="inside" className="border-y border-slate-200 bg-[#F0F3F5]">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-20 sm:px-8 lg:grid-cols-[.9fr_1.1fr]">
          <div className="order-2 lg:order-1"><ExamPreview /></div>
          <div className="order-1 lg:order-2">
            <p className="text-sm font-black text-slate-400">ماذا ستجد بعد إنشاء الحساب؟</p>
            <h2 className="mt-3 text-3xl font-black leading-tight sm:text-4xl" style={{ color: NAVY }}>مساحة واحدة للاستعداد، وليست صفحة أسئلة فقط.</h2>
            <div className="mt-8 space-y-0 border-y border-slate-300">
              {[
                ["الاختبارات المحاكية", "اختبر نفسك في بيئة منظمة وافهم النتيجة."],
                ["التأسيس وبنك الأسئلة", "تدرّب على الكمي واللفظي بطريقة تناسب مرحلتك."],
                ["المتابعة والاشتراك", "شاهد ما هو متاح لك وكم بقي من باقتك."],
              ].map(([title, text]) => (
                <div key={title} className="flex gap-4 border-b border-slate-300 py-4 last:border-b-0">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#0D1B2A]" />
                  <div><h3 className="text-sm font-black text-[#0D1B2A]">{title}</h3><p className="mt-1 text-sm leading-6 text-slate-500">{text}</p></div>
                </div>
              ))}
            </div>
            <button
              onClick={() => setSignupOpen(true)}
              className="qodratak-focus-ring mt-8 inline-flex items-center gap-2 text-sm font-black text-[#0D1B2A]"
            >
              أنشئ حسابك وابدأ <ArrowLeft size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* ── Platform sections ── */}
      <section className="mx-auto max-w-7xl px-5 py-24 sm:px-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div className="max-w-2xl">
            <p className="text-sm font-black text-slate-400">أقسام المنصة</p>
            <h2 className="mt-3 text-3xl font-black leading-tight sm:text-4xl" style={{ color: NAVY }}>لكل جزء من استعدادك مكان واضح.</h2>
          </div>
          <button
            onClick={() => setSignupOpen(true)}
            className="qodratak-focus-ring inline-flex items-center gap-2 text-sm font-black text-[#0D1B2A]"
          >استكشفها من حسابك <ArrowLeft size={16} /></button>
        </div>
        <div className="mt-10 grid border-y border-slate-200 md:grid-cols-5">
          {platformSections.map(([title, text], index) => (
            <article key={title} className={`px-0 py-6 md:px-5 ${index ? "border-t border-slate-200 md:border-r md:border-t-0" : "md:pr-0"}`}>
              <span className="text-xs font-black text-slate-400">0{index + 1}</span>
              <h3 className="mt-5 text-base font-black text-[#0D1B2A]">{title}</h3>
              <p className="mt-2 text-xs leading-6 text-slate-500">{text}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ── Testimonials ── */}
      <TestimonialsSection onSignup={() => setSignupOpen(true)} />

      {/* ── Difference + big student photo ── */}
      <section className="border-y border-slate-200 bg-[#0D1B2A]">
        <div className="mx-auto grid max-w-7xl items-stretch gap-0 px-5 py-0 sm:px-8 lg:grid-cols-[.94fr_1.06fr]">
          <div className="py-16 lg:pl-16 lg:py-24">
            <p className="text-sm font-black text-[#F7F775]">ما المختلف في قدراتك؟</p>
            <h2 className="mt-3 text-3xl font-black leading-tight text-white sm:text-4xl">نحوّل النتيجة إلى قرار، لا إلى رقم ينتهي عنده التدريب.</h2>
            <div className="mt-9 divide-y divide-white/10 border-y border-white/10">
              {differences.map(([title, text]) => (
                <div key={title} className="py-4">
                  <h3 className="text-sm font-black text-white">{title}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-300">{text}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="relative min-h-80 overflow-hidden lg:min-h-full">
            <img src="/attached_assets/generated_images/qodratak-student-focus.jpg" alt="طالب يستعد للاختبار" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-l from-transparent to-[#0D1B2A]/45" />
            <div className="absolute bottom-5 right-5 rounded-xl border border-white/15 bg-[#0D1B2A]/85 px-4 py-3 text-xs font-bold leading-5 text-white backdrop-blur-sm">استعداد هادئ، وقرار واضح بعد كل محاولة.</div>
          </div>
        </div>
      </section>

      {/* ── Students group photo ── */}
      <section className="relative overflow-hidden bg-[#F0F3F5] py-0">
        <div className="mx-auto grid max-w-7xl items-center gap-0 px-0 lg:grid-cols-[1fr_1fr]">
          <div className="relative min-h-72 overflow-hidden lg:min-h-[420px]">
            <img
              src="/students/students-group.png"
              alt="مجموعة طلاب سعوديين"
              className="h-full w-full object-cover"
              style={{ objectPosition: "center 20%" }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#F0F3F5]/80" />
          </div>
          <div className="px-8 py-14 lg:px-14">
            <p className="text-sm font-black text-slate-400">لكل طالب هدف مختلف</p>
            <h2 className="mt-3 text-3xl font-black leading-tight sm:text-4xl" style={{ color: NAVY }}>
              سواء كنت تستعد للقدرات، التحصيلي، أو IELTS — فيه مسار لك هنا.
            </h2>
            <p className="mt-5 text-sm leading-7 text-slate-500">
              قدراتك ليست منصة أسئلة فقط. هي مساحة تتعلم فيها بطريقة مرتبة تناسب مستواك واشتراكك وهدفك.
            </p>
            <button
              onClick={() => setSignupOpen(true)}
              className="mt-8 inline-flex items-center gap-2 rounded-xl px-5 py-3.5 text-sm font-black transition hover:-translate-y-0.5"
              style={{ background: NAVY, color: SIGNAL }}
            >
              ابدأ رحلتك الآن <ArrowLeft size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="mx-auto max-w-7xl px-5 py-24 sm:px-8">
        <div className="relative overflow-hidden rounded-[28px] bg-[#0D1B2A] px-6 py-12 sm:px-12">
          <Layers3 className="absolute -left-5 -top-6 h-36 w-36 text-white/5" />
          {/* student avatars inside CTA */}
          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-bold text-[#F7F775]">قدراتك من Qirox Studio</p>
              <h2 className="mt-3 text-3xl font-black leading-tight text-white sm:text-4xl">ابدأ بخطوة صغيرة، واترك لنا ترتيب الباقي.</h2>
              <p className="mt-4 text-sm leading-7 text-slate-300">حسابك يفتح لك مساحة منظمة لتتعلم، تختبر، وتتابع تقدمك بوضوح.</p>
            </div>
            <div className="flex flex-col items-start gap-4 sm:items-end">
              <div className="flex -space-x-2.5 space-x-reverse">
                {[
                  "/students/student-f1.png",
                  "/students/student-m1.jpg",
                  "/students/student-f2.jpg",
                  "/students/student-m2.jpg",
                ].map((src, i) => (
                  <div key={i} className="h-10 w-10 overflow-hidden rounded-full border-2 border-[#0D1B2A] bg-slate-600" style={{ zIndex: 4 - i }}>
                    <img src={src} alt="" className="h-full w-full object-cover object-top" />
                  </div>
                ))}
              </div>
              <button
                onClick={() => setSignupOpen(true)}
                className="qodratak-focus-ring inline-flex items-center gap-2 rounded-xl px-5 py-3.5 text-sm font-black transition hover:-translate-y-0.5"
                style={{ background: SIGNAL, color: NAVY }}
              >إنشاء حساب طالب <ArrowLeft size={17} /></button>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 px-5 py-7 sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 text-xs font-bold text-slate-400">
          <span>قدراتك · qodratak.sa</span><span>QIROX STUDIO</span>
        </div>
      </footer>
    </main>
  );
}
