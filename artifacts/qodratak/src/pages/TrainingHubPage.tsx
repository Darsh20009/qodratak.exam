import { ArrowLeft, BookOpen, Brain, ClipboardList, Clock3, Printer } from "lucide-react";
import { Link } from "wouter";

const trainingSections = [
  {
    title: "اختبار قياس الورقي",
    description: "اختر نموذجًا ورقيًا، ثم راجع نتيجتك بعد التصحيح.",
    icon: Printer,
    links: [{ label: "نماذج الاختبار الورقي", href: "/paper-models" }],
  },
  {
    title: "اختبار قياس المحوسب",
    description: "تدرّب على البنوك المحوسبة أو ابدأ محاكاة الاختبار.",
    icon: Brain,
    links: [
      { label: "التدريب على البنوك", href: "/computerized" },
      { label: "اختبارات قياس المحاكية", href: "/qiyas-hub" },
    ],
  },
  {
    title: "اختبارات قصيرة",
    description: "اختبارات سريعة للكمي واللفظي لتثبيت التدريب.",
    icon: Clock3,
    links: [
      { label: "اختبار كمي قصير", href: "/free-quantitative-test" },
      { label: "اختبار لفظي قصير", href: "/free-verbal-test" },
      { label: "إنشاء اختبار مخصص", href: "/custom-exam" },
    ],
  },
];

export default function TrainingHubPage() {
  return (
    <main className="mx-auto min-h-full w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8" dir="rtl">
      <header className="mb-6">
        <p className="text-sm font-bold text-primary">التدريب</p>
        <h1 className="mt-1 text-2xl font-black text-foreground sm:text-3xl">اختر طريقة التدريب</h1>
      </header>

      <div className="grid gap-4 lg:grid-cols-3">
        {trainingSections.map(({ title, description, icon: Icon, links }) => (
          <section
            key={title}
            className="flex min-h-64 flex-col rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-6"
          >
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <h2 className="text-lg font-black text-foreground">{title}</h2>
            </div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{description}</p>
            <div className="mt-auto space-y-2 pt-5">
              {links.map((link, index) => (
                <Link
                  key={link.href}
                  href={link.href}
                  data-testid={`link-training-${link.href.replaceAll("/", "-").replace(/^-/, "")}`}
                  className={
                    index === 0
                      ? "flex min-h-11 items-center justify-between gap-3 rounded-xl bg-primary px-4 py-2.5 text-sm font-black text-primary-foreground transition hover:opacity-90"
                      : "flex min-h-11 items-center justify-between gap-3 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-bold text-foreground transition hover:border-primary/40 hover:bg-primary/5"
                  }
                >
                  <span className="flex items-center gap-2">
                    {title === "اختبارات قصيرة" ? <ClipboardList className="h-4 w-4" /> : <BookOpen className="h-4 w-4" />}
                    {link.label}
                  </span>
                  <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
