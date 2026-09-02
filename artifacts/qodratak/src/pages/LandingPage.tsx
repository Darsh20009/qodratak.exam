import { useState } from "react";
import { Link } from "wouter";
import {
  ArrowLeft,
  BarChart3,
  BookOpenCheck,
  Calculator,
  Check,
  GraduationCap,
  Languages,
  Menu,
  MessageCircle,
  Target,
  UsersRound,
  X,
} from "lucide-react";
import { AuthModal } from "@/components/AuthModal";
import { Footer } from "@/components/Footer";
import { ThemeToggle } from "@/components/ThemeToggle";

const NAVY = "#171723";
const SIGNAL = "#FF8A70";
const MINT = "#91D7C5";

function Header({ onSignup, onLogin }: { onSignup: () => void; onLogin: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="relative z-30 border-b border-[#24202D]/[.09] bg-[#F7F4EE] dark:border-white/10 dark:bg-[#0B1220]">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
        <Link href="/" className="qodratak-focus-ring flex items-center gap-2.5 rounded-lg">
          <img
            src="/qodratak-logo-transparent.png"
            alt="شعار منصة قدراتك"
            width="40"
            height="40"
            className="h-10 w-10 object-contain"
          />
          <span className="text-base font-black text-[#171723] dark:text-white">قدراتك</span>
        </Link>

        <nav className="hidden items-center gap-6 sm:flex">
          <a href="#tracks" className="qodratak-focus-ring text-sm font-bold text-[#6B625B] transition hover:text-[#24202D] dark:text-slate-300 dark:hover:text-white">
            المسارات
          </a>
          <a href="#benefits" className="qodratak-focus-ring text-sm font-bold text-[#6B625B] transition hover:text-[#24202D] dark:text-slate-300 dark:hover:text-white">
            المزايا
          </a>
          <a href="#plans" className="qodratak-focus-ring text-sm font-bold text-[#6B625B] transition hover:text-[#24202D] dark:text-slate-300 dark:hover:text-white">
            الباقات
          </a>
          <button type="button" onClick={onLogin} className="qodratak-focus-ring text-sm font-bold text-[#24202D] dark:text-white">
            تسجيل الدخول
          </button>
          <div className="flex items-center gap-1 rounded-xl border border-[#24202D]/10 bg-white/60 px-1 dark:border-white/10 dark:bg-white/5">
            <ThemeToggle />
            <span className="hidden pr-1 text-xs font-bold text-[#6B625B] lg:inline dark:text-slate-300">المظهر</span>
          </div>
          <button
            type="button"
            onClick={onSignup}
            className="qodratak-focus-ring rounded-lg px-4 py-2.5 text-sm font-black transition hover:-translate-y-0.5"
            style={{ background: SIGNAL, color: NAVY }}
          >
            ابدأ مجانًا
          </button>
        </nav>

        <button
          type="button"
          aria-label={menuOpen ? "إغلاق القائمة" : "فتح القائمة"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
          className="qodratak-focus-ring rounded-lg p-2 text-[#24202D] dark:text-white sm:hidden"
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {menuOpen && (
        <div className="border-t border-[#24202D]/[.09] bg-[#F7F4EE] px-5 py-3 dark:border-white/10 dark:bg-[#0B1220] sm:hidden">
          <nav className="mx-auto flex max-w-6xl flex-col gap-1">
            <a href="#tracks" onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-bold text-[#6B625B] dark:text-slate-300">
              المسارات
            </a>
            <a href="#benefits" onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-bold text-[#6B625B] dark:text-slate-300">
              المزايا
            </a>
            <a href="#plans" onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-bold text-[#6B625B] dark:text-slate-300">
              الباقات
            </a>
            <button
              type="button"
              onClick={() => { setMenuOpen(false); onLogin(); }}
              className="rounded-lg px-3 py-2.5 text-right text-sm font-bold text-[#6B625B] dark:text-slate-300"
            >
              تسجيل الدخول
            </button>
            <button
              type="button"
              onClick={() => { setMenuOpen(false); onSignup(); }}
              className="mt-1 rounded-lg px-3 py-2.5 text-right text-sm font-black"
              style={{ background: SIGNAL, color: NAVY }}
            >
              ابدأ مجانًا
            </button>
            <div className="mt-2 flex items-center justify-between rounded-lg border border-[#24202D]/10 px-3 py-2 dark:border-white/10">
              <span className="text-sm font-bold text-[#6B625B] dark:text-slate-300">الوضع الليلي / النهاري</span>
              <ThemeToggle />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

function OfferPreview({ onSignup }: { onSignup: () => void }) {
  return (
    <div className="relative mx-auto w-full max-w-[430px] overflow-hidden rounded-[28px] bg-[#0D1B2A] p-6 text-white shadow-[0_24px_70px_rgba(13,27,42,.2)] sm:p-8">
      <div className="pointer-events-none absolute -left-16 -top-16 h-48 w-48 rounded-full bg-[#91D7C5]/20 blur-3xl" />
      <div className="relative">
        <div className="flex items-center justify-between">
          <span className="rounded-full bg-[#91D7C5]/15 px-3 py-1.5 text-xs font-black text-[#91D7C5]">
            عرض الطالب الجديد
          </span>
          <Target className="h-5 w-5 text-[#FF8A70]" />
        </div>
        <h2 className="mt-8 text-2xl font-black leading-tight sm:text-3xl">
          ابدأ مجانًا
          <br />
          <span className="text-[#FF8A70]">لمدة ٣ أيام</span>
        </h2>
        <p className="mt-3 text-sm leading-7 text-slate-300">
          جرّب كل الصلاحيات، واكتشف الطريقة الأسهل للاستعداد للقدرات والتحصيلي وIELTS وGAT.
        </p>
        <div className="mt-7 space-y-3 border-y border-white/10 py-5">
          {["كل الصلاحيات مفتوحة", "اختبار يومي طوال السنة", "تحليل واضح بعد كل محاولة"].map((item) => (
            <div key={item} className="flex items-center gap-2.5 text-sm font-bold text-slate-100">
              <Check className="h-4 w-4 shrink-0 text-[#91D7C5]" />
              <span>{item}</span>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={onSignup}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-black transition hover:-translate-y-0.5"
          style={{ background: SIGNAL, color: NAVY }}
        >
          ابدأ تجربتك الآن <ArrowLeft size={17} />
        </button>
      </div>
    </div>
  );
}

const benefits = [
  {
    icon: Target,
    title: "اختبار يومي",
    text: "تدرّب كل يوم على أسئلة القدرات والتحصيلي بدون ما تحتار من أين تبدأ.",
  },
  {
    icon: BookOpenCheck,
    title: "تدريب مرتب",
    text: "أسئلة وتدريبات واضحة تناسب مستواك وتساعدك تتقدم خطوة بخطوة.",
  },
  {
    icon: BarChart3,
    title: "اعرف مستواك",
    text: "بعد كل محاولة تعرف نقاط قوتك وما تحتاج تراجعه بوضوح.",
  },
  {
    icon: UsersRound,
    title: "متابعة ولي الأمر",
    text: "إمكانية ربط رقم ولي الأمر عبر الواتساب لمشاركة ملخص مستوى الطالب وتقدمه.",
  },
];

const studyTracks = [
  {
    icon: Target,
    label: "القدرات",
    title: "اختبار القدرات العامة",
    text: "تأسيس لفظي وكمي، تدريب متدرج، ومحاكاة للمحوسب تساعدك تعرف خطوتك التالية.",
    accent: "bg-[#E8F7F2] text-[#287966]",
  },
  {
    icon: GraduationCap,
    label: "التحصيلي",
    title: "تدريب التحصيلي",
    text: "مراجعة مرتبة واختبارات تدريبية تساعدك تستعد للمواد وتتابع تقدمك بثقة.",
    accent: "bg-[#FFF0E9] text-[#B65D36]",
  },
  {
    icon: Languages,
    label: "IELTS",
    title: "الاستعداد للـ IELTS",
    text: "مسار واضح لتطوير مهارات اللغة الإنجليزية والتدرب على نمط الاختبار.",
    accent: "bg-[#EEF0FF] text-[#5C61A9]",
  },
  {
    icon: Calculator,
    label: "GAT",
    title: "التدريب على GAT",
    text: "تدريب مركّز على المهارات الأساسية مع طريقة سهلة لمراجعة نقاط القوة والاحتياج.",
    accent: "bg-[#FFF7D9] text-[#8A6A15]",
  },
];

const steps = [
  ["١", "سجّل مجانًا", "أنشئ حسابك خلال دقائق وابدأ تجربتك المجانية."],
  ["٢", "حل اختبارك اليومي", "تدرّب على القدرات أو التحصيلي بالطريقة التي تناسبك."],
  ["٣", "راجع نتيجتك", "شاهد تقدمك واعرف الخطوة التالية بسهولة."],
];

function StudyTracks({ onSignup }: { onSignup: () => void }) {
  return (
    <section id="tracks" className="border-y border-slate-200 bg-[#FFFCF7] dark:border-slate-800 dark:bg-[#0D1726]">
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 lg:py-20">
        <div className="max-w-2xl">
          <p className="text-sm font-black text-[#398B79]">أين تريد أن تصل؟</p>
          <h2 className="mt-3 text-3xl font-black leading-tight text-[#171723] dark:text-white sm:text-4xl">
            مساراتك كلها في مكان واحد.
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-500 dark:text-slate-300">
            اختر المجال الذي تستعد له، وابدأ من التأسيس أو انتقل مباشرة إلى التدريب والمحاكاة.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {studyTracks.map(({ icon: Icon, label, title, text, accent }) => (
            <article key={label} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_24px_rgba(23,35,55,.04)] dark:border-slate-700 dark:bg-[#162235]">
              <div className={`grid h-11 w-11 place-items-center rounded-xl ${accent}`}>
                <Icon className="h-5 w-5" />
              </div>
              <p className="mt-5 text-xs font-black text-[#398B79]">{label}</p>
              <h3 className="mt-2 text-lg font-black text-[#171723] dark:text-white">{title}</h3>
              <p className="mt-2 flex-1 text-sm leading-7 text-slate-500 dark:text-slate-300">{text}</p>
              <button type="button" onClick={onSignup} className="mt-5 text-right text-xs font-black text-[#398B79] hover:text-[#24202D]">
                ابدأ تجربتك المجانية ←
              </button>
            </article>
          ))}
        </div>

        <div className="mt-6 flex flex-col items-start justify-between gap-5 rounded-2xl bg-[#0D1B2A] px-6 py-5 text-white sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-black text-[#91D7C5]">مسار القدرات</p>
            <p className="mt-1 text-sm leading-6 text-slate-300">ابدأ من التأسيس، أو انتقل إلى المحوسب عندما تكون جاهزًا.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/learn" className="rounded-lg bg-[#91D7C5] px-4 py-2.5 text-xs font-black text-[#0D1B2A]">
              ابدأ التأسيس
            </Link>
            <Link href="/qiyas-hub" className="rounded-lg border border-white/20 px-4 py-2.5 text-xs font-black text-white hover:bg-white/10">
              تدرب على المحوسب
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function ParentFollowUp({ onSignup }: { onSignup: () => void }) {
  return (
    <section id="parent-follow-up" className="mx-auto max-w-6xl px-5 py-16 sm:px-8 lg:py-20">
      <div className="relative overflow-hidden rounded-[28px] border border-[#B9E2D6] bg-[#EAF8F3] p-6 dark:border-[#398B79]/60 dark:bg-[#112B31] sm:p-10">
        <div className="pointer-events-none absolute -left-16 -top-20 h-52 w-52 rounded-full bg-[#91D7C5]/30 blur-3xl" />
        <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="flex items-start gap-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#0D1B2A] text-[#91D7C5]">
              <MessageCircle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-black text-[#287966]">ميزة تهم الطالب والأسرة</p>
              <h2 className="mt-2 text-2xl font-black leading-tight text-[#171723] dark:text-white sm:text-3xl">
                ولي أمرك يعرف تقدمك، وأنت تركز على هدفك.
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-[#5E7180] dark:text-slate-300">
                أضف رقم ولي الأمر عبر الواتساب لطلب مشاركة ملخص المستوى والتقدم، والتنبيه عند الحاجة إلى مراجعة المسار.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 lg:justify-end">
            <button type="button" onClick={onSignup} className="rounded-xl bg-[#FF8A70] px-5 py-3 text-sm font-black text-[#171723]">
              ابدأ كطالب
            </button>
            <a href="https://wa.me/966510510140?text=%D9%85%D8%B1%D8%AD%D8%A8%D8%A7%D8%8C%20%D8%A3%D8%B1%D9%8A%D8%AF%20%D8%A7%D9%84%D9%85%D8%B3%D8%A7%D8%B9%D8%AF%D8%A9%20%D9%81%D9%8A%20%D8%B1%D8%A8%D8%B7%20%D9%88%D9%84%D9%8A%20%D8%A7%D9%84%D8%A3%D9%85%D8%B1" target="_blank" rel="noopener noreferrer" className="rounded-xl border border-[#17354A]/20 bg-white/60 px-5 py-3 text-sm font-black text-[#17354A] dark:border-white/15 dark:bg-white/10 dark:text-white">
              تواصل مع المنصة: 0510510140
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function PlanCard({
  title,
  price,
  description,
  items,
  featured,
  onSignup,
}: {
  title: string;
  price: string;
  description: string;
  items: string[];
  featured?: boolean;
  onSignup: () => void;
}) {
  return (
    <article className={`relative rounded-2xl border p-6 ${featured ? "border-[#FF8A70] bg-[#FFF8F2] shadow-[0_14px_40px_rgba(255,138,112,.14)] dark:bg-[#241E28]" : "border-slate-200 bg-white dark:border-slate-700 dark:bg-[#111B2B]"}`}>
      {featured && (
        <span className="absolute -top-3 right-5 rounded-full bg-[#FF8A70] px-3 py-1 text-[11px] font-black text-[#171723]">
          الأفضل للطالب
        </span>
      )}
      <p className="text-sm font-black text-slate-500">{title}</p>
      <div className="mt-4 flex items-end gap-2">
        <span className="text-4xl font-black text-[#171723] dark:text-white">{price}</span>
        {price === "٣٩" && <span className="pb-1 text-sm font-bold text-slate-500">ريال / ٣ أشهر</span>}
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-500">{description}</p>
      <div className="mt-6 space-y-3 border-t border-slate-200 pt-5 dark:border-slate-700">
        {items.map((item) => (
          <div key={item} className="flex items-center gap-2.5 text-sm font-bold text-slate-700 dark:text-slate-200">
            <Check className="h-4 w-4 shrink-0 text-[#398B79]" />
            <span>{item}</span>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={onSignup}
        className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-black transition hover:-translate-y-0.5"
        style={featured ? { background: SIGNAL, color: NAVY } : { background: NAVY, color: "white" }}
      >
        {featured ? "اشترك الآن" : "ابدأ مجانًا"} <ArrowLeft size={16} />
      </button>
    </article>
  );
}

export default function LandingPage({ initialModal }: { initialModal?: "signup" | "login" } = {}) {
  const [authMode, setAuthMode] = useState<"signup" | "login" | null>(initialModal || null);
  const openSignup = () => setAuthMode("signup");

  return (
    <main className="min-h-screen overflow-hidden bg-[#F7F4EE] text-slate-900 dark:bg-[#0B1220] dark:text-slate-100" dir="rtl">
      <AuthModal
        open={authMode !== null}
        mode={authMode || "login"}
        onClose={() => setAuthMode(null)}
        onModeChange={setAuthMode}
      />

      <section className="relative isolate overflow-hidden bg-[#F7F4EE] dark:bg-[#0B1220]">
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: `radial-gradient(circle at 9% 18%, ${MINT}20, transparent 24%), radial-gradient(circle at 78% 105%, ${SIGNAL}18, transparent 38%)` }}
        />
        <Header onSignup={openSignup} onLogin={() => setAuthMode("login")} />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 pb-20 pt-14 sm:px-8 lg:grid-cols-2 lg:pb-24 lg:pt-20">
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-2 text-sm font-black text-[#398B79]">
              <span className="h-2 w-2 rounded-full bg-[#398B79]" />
              منصة التدريب الأولى في المملكة
            </p>
            <h1 className="mt-6 text-[2.7rem] font-black leading-[1.12] tracking-tight text-[#171723] dark:text-white sm:text-6xl">
              خطتك أوضح لـ
              <br />
              <span style={{ color: SIGNAL }}>القدرات والتحصيلي وIELTS وGAT.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-8 text-[#6B625B] dark:text-slate-300 sm:text-lg">
              تأسيس ومحوسب، تدريب يومي، ونتيجة تعرفك خطوتك التالية في كل مسار تحتاجه.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={openSignup}
                className="qodratak-focus-ring inline-flex items-center gap-2 rounded-xl px-5 py-3.5 text-sm font-black transition hover:-translate-y-0.5"
                style={{ background: SIGNAL, color: NAVY }}
              >
                ابدأ مجانًا ٣ أيام <ArrowLeft size={17} />
              </button>
              <a
                href="#plans"
                className="qodratak-focus-ring inline-flex items-center gap-2 rounded-xl border border-[#24202D]/[.18] px-5 py-3.5 text-sm font-bold text-[#171723] transition hover:border-[#24202D]/40 hover:bg-[#24202D]/[.05] dark:border-white/20 dark:text-white dark:hover:border-white/40 dark:hover:bg-white/10"
              >
                شاهد الباقات <ArrowLeft size={17} />
              </a>
            </div>
            <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 border-t border-[#24202D]/[.1] pt-5 text-xs font-bold text-[#6B625B] dark:border-white/10 dark:text-slate-300">
              {["قدرات وتحصيلي", "IELTS وGAT", "تأسيس ومحوسب", "رحلة سهلة"].map((item) => (
                <span key={item} className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-[#398B79]" />
                  {item}
                </span>
              ))}
            </div>
          </div>
          <OfferPreview onSignup={openSignup} />
        </div>
      </section>

      <section id="benefits" className="border-y border-slate-200 bg-white dark:border-slate-800 dark:bg-[#0F1928]">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 lg:py-20">
          <div className="max-w-2xl">
            <p className="text-sm font-black text-[#398B79]">كل شيء واضح</p>
            <h2 className="mt-3 text-3xl font-black leading-tight text-[#171723] dark:text-white sm:text-4xl">
              تدرّب أكثر، وتشتّت أقل.
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-500 dark:text-slate-300">
              قدراتك تختصر لك الطريق من أول سؤال إلى نتيجة تفهمها.
            </p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {benefits.map(({ icon: Icon, title, text }) => (
              <article key={title} className="rounded-2xl border border-slate-200 bg-[#F7F4EE] p-6 dark:border-slate-700 dark:bg-[#162235]">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#0D1B2A] text-[#91D7C5]">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-lg font-black text-[#171723] dark:text-white">{title}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-500 dark:text-slate-300">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <StudyTracks onSignup={openSignup} />

        <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8 lg:py-20 dark:text-slate-100">
        <div className="max-w-2xl">
          <p className="text-sm font-black text-[#398B79]">رحلتك أسهل مما تتوقع</p>
          <h2 className="mt-3 text-3xl font-black leading-tight text-[#171723] dark:text-white sm:text-4xl">
            ثلاث خطوات وتبدأ.
          </h2>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {steps.map(([number, title, text]) => (
            <article key={number} className="border-t-2 border-[#91D7C5] pt-5">
              <span className="text-sm font-black text-[#398B79]">{number}</span>
              <h3 className="mt-5 text-xl font-black text-[#171723] dark:text-white">{title}</h3>
              <p className="mt-2 text-sm leading-7 text-slate-500 dark:text-slate-300">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="plans" className="border-y border-slate-200 bg-[#F0F3F5] dark:border-slate-800 dark:bg-[#101A2A]">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 lg:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-black text-[#398B79]">ابدأ بالطريقة التي تناسبك</p>
            <h2 className="mt-3 text-3xl font-black leading-tight text-[#171723] dark:text-white sm:text-4xl">
              خيارات بسيطة، وبدون التزام طويل.
            </h2>
          </div>
          <div className="mx-auto mt-10 grid max-w-3xl gap-4 md:grid-cols-2">
            <PlanCard
              title="تجربة مجانية"
              price="٣ أيام"
              description="جرّب قدراتك بكل الصلاحيات قبل الاشتراك."
              items={["كل الصلاحيات مفتوحة", "اختبار يومي طوال السنة", "قدرات وتحصيلي"]}
              onSignup={openSignup}
            />
            <PlanCard
              title="الاشتراك الربع سنوي"
              price="٣٩"
              description="ثلاثة أشهر من التدريب المنظم بسعر بسيط."
              items={["تدريب يومي مستمر", "اختبارات ومحاكاة", "تحليل ومتابعة التقدم"]}
              featured
              onSignup={openSignup}
            />
          </div>
        </div>
      </section>

      <ParentFollowUp onSignup={openSignup} />

      <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8 lg:py-20">
        <div className="relative overflow-hidden rounded-[28px] bg-[#0D1B2A] px-6 py-12 text-center sm:px-12">
          <div className="pointer-events-none absolute -left-20 -top-24 h-64 w-64 rounded-full bg-[#91D7C5]/10 blur-3xl" />
          <div className="relative mx-auto max-w-2xl">
            <p className="text-sm font-black text-[#91D7C5]">مستعد تبدأ؟</p>
            <h2 className="mt-3 text-3xl font-black leading-tight text-white sm:text-4xl">
              خلّ استعدادك أسهل مع قدراتك.
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-300">
              ابدأ مجانًا ٣ أيام، وخذ أول خطوة نحو درجتك الأفضل.
            </p>
            <button
              type="button"
              onClick={openSignup}
              className="mt-7 inline-flex items-center gap-2 rounded-xl px-6 py-3.5 text-sm font-black transition hover:-translate-y-0.5"
              style={{ background: SIGNAL, color: NAVY }}
            >
              ابدأ الآن مجانًا <ArrowLeft size={17} />
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}