import { ArrowLeft, BookOpen, Brain, ChevronDown, ClipboardList, Clock3, Printer } from "lucide-react";
import { Link } from "wouter";

const primaryTraining = [
  {
    id: "computerized",
    title: "التدريب المحوسب",
    description: "تدرّب على بنوك الأسئلة المتاحة لك.",
    label: "افتح البنوك المحوسبة",
    href: "/computerized",
    icon: Brain,
  },
  {
    id: "qiyas",
    title: "محاكاة قياس",
    description: "تدرّب ضمن تجربة أقرب للاختبار.",
    label: "استعرض المحاكاة",
    href: "/qiyas-hub",
    icon: ClipboardList,
  },
  {
    id: "paper",
    title: "النماذج الورقية",
    description: "اختر نموذجًا ورقيًا وراجع نتيجتك بعد التصحيح.",
    label: "استعرض النماذج",
    href: "/paper-models",
    icon: Printer,
  },
];

const shortTraining = [
  { label: "اختبار كمي قصير", href: "/free-quantitative-test" },
  { label: "اختبار لفظي قصير", href: "/free-verbal-test" },
  { label: "إنشاء اختبار مخصص", href: "/custom-exam" },
];

export default function TrainingHubPage() {
  return (
    <main className="mx-auto min-h-full w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8" dir="rtl">
      <header className="mb-7 max-w-2xl">
        <p className="text-sm font-bold text-primary">التدريب</p>
        <h1 data-testid="text-training-title" className="mt-1 text-3xl font-black tracking-tight text-foreground sm:text-4xl">
          اختر تدريبك
        </h1>
        <p className="mt-2 text-sm leading-7 text-muted-foreground">
          بنوك محوسبة ومحاكاة ونماذج ورقية. ابدأ بالطريقة التي تناسب جلستك.
        </p>
      </header>

      <section aria-label="طرق التدريب" className="divide-y divide-border overflow-hidden rounded-3xl border border-border bg-card">
        {primaryTraining.map(({ id, title, description, label, href, icon: Icon }, index) => (
          <article key={id} data-testid={`training-option-${id}`} className="grid gap-4 p-5 sm:grid-cols-[auto_1fr_auto] sm:items-center sm:gap-5 sm:p-6">
            <span className={`grid h-12 w-12 place-items-center rounded-2xl ${index === 0 ? "bg-primary text-primary-foreground" : "bg-muted text-primary"}`}>
              <Icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-lg font-black text-foreground">{title}</h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
            </div>
            <Link
              href={href}
              data-testid={`link-training-${id}`}
              className="inline-flex min-h-11 items-center justify-center gap-3 rounded-xl border border-border px-4 text-sm font-black text-foreground transition hover:border-primary/40 hover:bg-primary/5 sm:min-w-48"
            >
              {label}<ArrowLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
            </Link>
          </article>
        ))}
      </section>

      <details data-testid="details-short-training" className="group mt-4 rounded-2xl border border-border bg-card">
        <summary data-testid="summary-short-training" className="flex min-h-14 cursor-pointer list-none items-center gap-3 px-5 font-black text-foreground [&::-webkit-details-marker]:hidden">
          <Clock3 className="h-5 w-5 text-primary" aria-hidden="true" />
          <span className="flex-1">اختبارات قصيرة أو مخصصة</span>
          <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden="true" />
        </summary>
        <div className="grid gap-2 border-t border-border p-4 sm:grid-cols-3">
          {shortTraining.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              data-testid={`link-training-${item.href.replaceAll("/", "-").replace(/^-/, "")}`}
              className="flex min-h-11 items-center justify-between gap-3 rounded-xl border border-border px-4 text-sm font-bold text-foreground transition hover:border-primary/40 hover:bg-primary/5"
            >
              <span className="flex items-center gap-2"><BookOpen className="h-4 w-4 text-primary" aria-hidden="true" />{item.label}</span>
              <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
            </Link>
          ))}
        </div>
      </details>
    </main>
  );
}
