import { Link } from "wouter";
import { CalendarDays, ChevronDown, ChevronLeft, ClipboardCheck, ListChecks } from "lucide-react";

const DIAGNOSTIC_HREF = "/foundation?program=qudrat&reassess=1&returnTo=preparation";

const steps = [
  { icon: ClipboardCheck, title: "تقييم قصير", body: "يحدد نقطة بدايتك، وليس درجة رسمية." },
  { icon: CalendarDays, title: "خطة بموعدك", body: "بموعد محجوز أو دون موعد." },
  { icon: ListChecks, title: "مهام يومية", body: "درس، تدريب، ثم مراجعة أخطائك." },
];

export function NewStudentWelcome({ studentName }: { studentName: string }) {
  return (
    <section data-testid="section-new-student-welcome" aria-labelledby="welcome-title" className="overflow-hidden rounded-3xl border border-primary/20 bg-card shadow-sm">
      <div className="space-y-4 bg-primary/5 p-5 sm:p-7">
        <p className="text-sm font-bold text-muted-foreground">أهلًا،</p>
        <h1 id="welcome-title" data-testid="text-student-name" className="text-2xl font-black leading-snug text-foreground md:text-3xl">
          {studentName}
        </h1>
        <p className="max-w-xl text-sm leading-7 text-muted-foreground">
          ابدأ بتقييم قصير لنعرف مستواك ونرتب خطتك.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link href={DIAGNOSTIC_HREF} data-testid="link-start-diagnostic" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[hsl(var(--brand-signal-hsl))] px-6 text-base font-black text-[#0D1B2A] transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
            ابدأ التقييم التشخيصي
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </Link>
          <Link href="/foundation" data-testid="link-welcome-course" className="inline-flex min-h-11 items-center justify-center rounded-xl px-4 text-sm font-black text-foreground underline-offset-4 hover:underline">
            حدد موعد اختبارك
          </Link>
        </div>
      </div>
      <details data-testid="details-how-path-works" className="group border-t border-border">
        <summary className="flex min-h-12 cursor-pointer list-none items-center gap-3 px-5 py-3 text-sm font-black text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary [&::-webkit-details-marker]:hidden">
          <span className="flex-1">كيف يعمل المسار؟</span>
          <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden="true" />
        </summary>
        <ol className="grid gap-px bg-border sm:grid-cols-3" aria-label="كيف تعمل المنصة">
          {steps.map((s, i) => {
            const Icon = s.icon;
            return (
              <li key={s.title} data-testid={`step-welcome-${i + 1}`} className="flex gap-3 bg-card p-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-black text-foreground">{i + 1}. {s.title}</span>
                  <span className="mt-0.5 block text-xs leading-6 text-muted-foreground">{s.body}</span>
                </span>
              </li>
            );
          })}
        </ol>
        <p data-testid="status-analysis-pending" className="border-t border-border bg-card p-4 text-xs leading-6 text-muted-foreground">
          لا نعرض درجات أو نقاط ضعف قبل محاولتك الأولى.
        </p>
      </details>
    </section>
  );
}
