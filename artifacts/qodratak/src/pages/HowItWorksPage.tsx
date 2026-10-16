import { Link } from "wouter";
import {
  ArrowLeft,
  BookMarked,
  BookOpen,
  Sparkles,
  CalendarCheck,
  ClipboardList,
  GraduationCap,
  HelpCircle,
  Home,
  Laptop,
  Layers3,
  Library,
  Star,
  UserRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { BrandMark } from "@/components/BrandMark";
import { ThemeToggle } from "@/components/ThemeToggle";
import { GuideFilm } from "@/components/GuideFilm";
import { SEO } from "@/components/SEO";
import { useUser } from "@/hooks/use-user";

type Stop = {
  n: string;
  href: string;
  icon: LucideIcon;
  title: string;
  where: string;
  inside: string[];
  soon?: boolean;
};

const STOPS: Stop[] = [
  { n: "٠١", href: "/", icon: Home, title: "الرئيسية", where: "لوحة الطالب",
    inside: ["مهمتك اليوم وزر واحد للخطوة التالية", "تقدم القدرات والتحصيلي بعد بدء كل مسار", "موعد اختبارك وحجز محاكاة", "الاختبارات الأخيرة ونتائج تدريبك المفصلة", "بطاقة تقييم المنصة متاحة مباشرة"] },
  { n: "٠٢", href: "/foundation?program=qudrat&view=plan", icon: CalendarCheck, title: "خطة الاستعداد", where: "داخل التأسيس",
    inside: ["اختر: حجزت اختباري أو أبدأ دون حجز", "تقييم نقطة البداية قبل بناء الخطة", "جدول أيام بمهام: درس، تدريب، مراجعة، محاكاة", "الخطة لا تضمن تغطية كل أسئلة البنك"] },
  { n: "٠٣", href: "/learning/today", icon: Sparkles, title: "جلسة التعلم اليوم", where: "جلسة واحدة",
    inside: ["تُفتح عندما تكون هناك خطة جاهزة لقسمك", "إن لم تتوفر جلسة، يوجّهك إلى مواد التأسيس المنشورة"] },
  { n: "٠٤", href: "/student-program/qudrat?section=foundation", icon: BookOpen, title: "التأسيس", where: "داخل مسار القدرات",
    inside: ["الدروس المنشورة مرتبة حسب القسم", "قراءة الوحدة ثم اختبار قصير", "تأكيد القراءة لا يعني الإتقان"] },
  { n: "٠٥", href: "/student/foundation-book/quantitative", icon: BookMarked, title: "كتاب الكمي", where: "التأسيس · كمي",
    inside: ["فهرس دروس كتاب الكمي", "افتح الدرس واقرأه داخل المنصة"] },
  { n: "٠٦", href: "/computerized", icon: Laptop, title: "التدريب المحوسب", where: "الكمي · اللفظي · الاختبارات · البحث",
    inside: ["بنوك الكمي المنشورة بفيديو وملف واختبار إن وُجد", "دروس اللفظي مع اختبار من ١٠ أسئلة بعد كل درس", "تقدم المشاهدة يُحفظ ويُستأنف", "تبويب «الاختبارات» يجمع كل أنواع اختبارات القدرات"] },
  { n: "٠٧", href: "/question-bank", icon: Library, title: "بنك الأسئلة", where: "تدريب حر",
    inside: ["أسئلة حسب القسم والمستوى والمصدر", "ابحث عن سؤال بعينه وراجعه"] },
  { n: "٠٨", href: "/records", icon: ClipboardList, title: "نتائجي", where: "التقارير",
    inside: ["محاولاتك محفوظة بتاريخها ونسبتها", "مراجعة الأسئلة الخاطئة والبطيئة", "هذه نتائج تدريب، وليست درجة قياس الرسمية"] },
  { n: "٠٩", href: "/account", icon: UserRound, title: "حسابي", where: "الاشتراك والبيانات",
    inside: ["بياناتك وحالة اشتراكك", "إضافة رقم جوال ولي الأمر ضمن بيانات التواصل"] },
  { n: "١٠", href: "/support", icon: HelpCircle, title: "الدعم والمساعدة", where: "تذاكر وأسئلة",
    inside: ["الأسئلة الشائعة", "فتح تذكرة دعم ومتابعتها", "التواصل عبر واتساب"] },
  { n: "١١", href: "/student-program/tahsili", icon: GraduationCap, title: "التحصيلي", where: "المواد والدراسة والاختبارات",
    inside: ["التأسيس حسب المادة", "دروس ومواد التحصيلي المنشورة", "اختبارات حسب المادة واختبارات شاملة ومخصصة"] },
];

const EXAMS: { href: string; title: string; text: string }[] = [
  { href: "/qiyas", title: "اختبار المحاكاة", text: "محاكاة القدرات بأقسام ووقت لكل قسم." },
  { href: "/standard-test", title: "المحاكاة القياسي", text: "اختبار مقسّم إلى أقسام بتوقيت." },
  { href: "/mock-exams", title: "الاختبارات التجريبية", text: "نماذج تجريبية كاملة." },
  { href: "/custom-exam", title: "اختبار مخصص", text: "حدد توزيع الكمي واللفظي وعدد الأسئلة." },
  { href: "/adaptive-test", title: "الاختبار التكيفي", text: "أسئلة تتكيف مع أدائك." },
  { href: "/paper-models", title: "النماذج الورقية", text: "نماذج للطباعة والتصحيح." },
  { href: "/book-exam", title: "حجز اختبار مجدول", text: "احجز موعدًا لاختبار محدد الوقت." },
  { href: "/quantitative-tests", title: "اختبارات الكمي", text: "اختبارات أقسام الكمي." },
  { href: "/verbal-tests", title: "اختبارات اللفظي", text: "اختبارات أقسام اللفظي." },
];

const EXAM_STEPS = [
  ["ادخل", "من المحوسب ← الاختبارات، أو من رابط المهمة في خطتك."],
  ["حل", "مؤقت ظاهر أعلى الشاشة، اختر إجابتك، وتنقل بين الأسئلة بالتالي والسابق أو من شبكة الأسئلة."],
  ["ميّز وراجع", "علّم أي سؤال «للمراجعة» لترجع له قبل التسليم، وسننبهك إن بقيت أسئلة بلا إجابة."],
  ["سلّم وراجع", "تُحفظ المحاولة في نتائجي. مهمة التدريب في خطتك تُسجَّل فقط عند تسليم الاختبار المرتبط بها."],
];

const TOOLS = [
  "ملء الشاشة: زر في شريط الاختبار، وبعض الاختبارات تطلبه.",
  "دفتر الملاحظات: على الشاشات بعرض ٧٦٨ بكسل فأكثر.",
  "الآلة الحاسبة: تظهر في أسئلة الكمي فقط، حين تكون الأدوات مفعّلة للاختبار.",
];

export default function HowItWorksPage() {
  const { user } = useUser();
  const isStudent = user?.role === "student";

  return (
    <main dir="rtl" className="min-h-[100dvh] bg-[#F7F4EE] text-[#171723] dark:bg-[#0B1220] dark:text-slate-100">
      <SEO title="كيف تعمل قدراتك | دليل صفحات الطالب" description="جولة في صفحات منصة قدراتك: التأسيس، التدريب المحوسب، الاختبارات، النتائج، والحساب." url="/how-it-works" />
      <header className="border-b border-[#24202D]/[.09] dark:border-white/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <Link href="/" className="qodratak-focus-ring rounded-lg" data-testid="link-home-logo"><BrandMark /></Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href={isStudent ? "/" : "/signup"} data-testid="link-how-cta-top" className="qodratak-focus-ring rounded-lg bg-[#FF8A70] px-3.5 py-2 text-xs font-black text-[#171723]">
              {isStudent ? "لوحتي" : "ابدأ مجانًا"}
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl gap-10 px-5 py-12 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center lg:py-16">
        <div>
          <p className="text-xs font-black tracking-wide text-[#398B79]">دليل الطالب</p>
          <h1 className="mt-3 text-4xl font-black leading-[1.15] sm:text-5xl">
            كل صفحة،<br /><span className="text-[#FF8A70]">وماذا تجد داخلها.</span>
          </h1>
          <p className="mt-5 max-w-md text-sm leading-7 text-[#6B625B] dark:text-slate-300">
            شاهد الفيلم، ثم امشِ مع الخريطة: من خطتك اليومية إلى التأسيس والاختبار ومراجعة نتيجتك في مساري القدرات والتحصيلي.
          </p>
        </div>
        <GuideFilm />
      </section>

      <section className="border-y border-[#24202D]/[.09] bg-[#FFFCF7] dark:border-white/10 dark:bg-[#0D1726]" aria-labelledby="map-title">
        <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
          <h2 id="map-title" className="text-2xl font-black sm:text-3xl">خريطة الصفحات</h2>
          <p className="mt-2 text-sm text-[#6B625B] dark:text-slate-400">الروابط تفتح الصفحة الحقيقية. الصفحات المحمية تطلب تسجيل الدخول، وبعض الدروس والاختبارات تحتاج اشتراكًا أو تجربة فعّالة.</p>
          <ol className="mt-8 grid gap-px overflow-hidden rounded-2xl border border-[#24202D]/10 bg-[#24202D]/10 dark:border-white/10 dark:bg-white/10 md:grid-cols-2 lg:grid-cols-3">
            {STOPS.map(({ n, href, icon: Icon, title, where, inside, soon }) => (
              <li key={href} className="flex flex-col bg-[#FFFCF7] p-5 dark:bg-[#0F1A2B]" data-testid={`card-page-${href.replace(/\//g, "-").slice(1) || "home"}`}>
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-[11px] font-bold text-[#6B625B] dark:text-slate-500">{n}</span>
                  <span className={`grid h-7 w-7 place-items-center rounded-lg ${soon ? "bg-[#FF8A70]/15 text-[#B65D36]" : "bg-[#0D1B2A] text-[#91D7C5] dark:bg-white/10"}`}>
                    <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                  <h3 className="font-black">{title}</h3>
                  <span className="mr-auto text-[11px] font-bold text-[#398B79]">{where}</span>
                </div>
                <ul className="mt-4 flex-1 space-y-1.5 text-sm leading-6 text-[#5D5550] dark:text-slate-300">
                  {inside.map((t) => <li key={t} className="flex gap-2"><span className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-[#FF8A70]" />{t}</li>)}
                </ul>
                {soon ? (
                  <span className="mt-4 text-xs font-black text-[#B65D36]">قريبًا</span>
                ) : (
                  <Link href={href} data-testid={`link-page-${href.replace(/\//g, "-").slice(1) || "home"}`} className="qodratak-focus-ring mt-4 inline-flex items-center gap-1 self-start rounded text-xs font-black text-[#287966] hover:underline dark:text-[#91D7C5]">
                    افتح الصفحة <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                )}
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-14 sm:px-8" aria-labelledby="exam-title">
        <div className="flex items-center gap-2">
          <Layers3 className="h-4 w-4 text-[#FF8A70]" aria-hidden="true" />
          <h2 id="exam-title" className="text-2xl font-black sm:text-3xl">الاختبار من الداخل</h2>
        </div>
        <ol className="mt-8 grid gap-6 md:grid-cols-4">
          {EXAM_STEPS.map(([t, d], i) => (
            <li key={t} className="border-t-2 border-[#91D7C5] pt-4">
              <span className="font-mono text-xs font-bold text-[#398B79]">{i + 1}</span>
              <h3 className="mt-2 text-lg font-black">{t}</h3>
              <p className="mt-1 text-sm leading-7 text-[#6B625B] dark:text-slate-300">{d}</p>
            </li>
          ))}
        </ol>
        <div className="mt-10 rounded-2xl border border-[#24202D]/10 p-5 dark:border-white/10">
          <h3 className="font-black">أدوات داخل الاختبار</h3>
          <ul className="mt-3 space-y-1.5 text-sm leading-6 text-[#5D5550] dark:text-slate-300">
            {TOOLS.map((t) => <li key={t} className="flex gap-2"><span className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-[#FF8A70]" />{t}</li>)}
          </ul>
        </div>
        <h3 className="mt-10 font-black">أنواع الاختبارات المتاحة من المحوسب</h3>
        <p className="mt-1 text-xs text-[#6B625B] dark:text-slate-400">بعضها يحتاج اشتراكًا فعّالًا، وتوفر الأسئلة يعتمد على المحتوى المنشور.</p>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {EXAMS.map((e) => (
            <li key={e.href}>
              <Link href={e.href} data-testid={`link-exam-${e.href.slice(1)}`} className="qodratak-focus-ring group flex items-center gap-3 rounded-xl border border-[#24202D]/10 bg-white/60 p-3 hover:border-[#FF8A70]/60 dark:border-white/10 dark:bg-white/5">
                <span className="min-w-0 flex-1"><span className="block text-sm font-black">{e.title}</span><span className="block text-xs text-[#6B625B] dark:text-slate-400">{e.text}</span></span>
                <ArrowLeft className="h-3.5 w-3.5 shrink-0 text-[#6B625B] transition group-hover:-translate-x-1" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-16 sm:px-8">
        <div className="flex flex-col items-start justify-between gap-4 rounded-2xl bg-[#0D1B2A] p-6 text-white sm:flex-row sm:items-center">
          <div className="flex items-start gap-3">
            <Star className="mt-1 h-4 w-4 shrink-0 text-[#FF8A70]" aria-hidden="true" />
            <p className="text-sm leading-7 text-slate-300">بطاقة تقييم المنصة موجودة في الرئيسية من أول يوم. ترى حالة تقييمك (بانتظار المراجعة، معتمد، أو لم يُعتمد)، ولا يُنشر في الصفحة الرئيسية إلا بموافقتك وبعد اعتماد الإدارة، دون جوالك أو بريدك.</p>
          </div>
          <Link href={isStudent ? "/" : "/signup"} data-testid="link-how-cta-bottom" className="qodratak-focus-ring inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-[#FF8A70] px-5 py-3 text-sm font-black text-[#171723]">
            {isStudent ? "ارجع إلى لوحتي" : "ابدأ تجربتك المجانية"} <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </main>
  );
}
