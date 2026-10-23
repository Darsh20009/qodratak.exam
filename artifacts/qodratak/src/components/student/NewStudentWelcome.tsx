import { Link } from "wouter";
import { ArrowLeft, ClipboardCheck } from "lucide-react";

export function NewStudentWelcome({
  studentName,
  program = "qudrat",
}: {
  studentName: string;
  program?: "qudrat" | "tahsili";
}) {
  const isTahsili = program === "tahsili";
  const startHref = isTahsili
    ? "/foundation?program=tahsili"
    : "/foundation?program=qudrat&reassess=1&returnTo=preparation";

  return (
    <section
      data-testid="section-new-student-welcome"
      aria-labelledby="welcome-title"
      className="relative isolate overflow-hidden rounded-3xl border border-primary/20 bg-card"
      dir="rtl"
    >
      <div className="absolute inset-y-0 right-0 w-1.5 bg-primary" aria-hidden="true" />
      <div className="grid gap-6 p-6 sm:p-8 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <p className="text-sm font-bold text-primary">{isTahsili ? "بداية التحصيلي" : "بداية واضحة"}</p>
          <h1 id="welcome-title" data-testid="text-student-name" className="mt-2 text-3xl font-black tracking-tight text-foreground md:text-4xl">
            أهلًا {studentName}
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-7 text-muted-foreground">
            {isTahsili
              ? "اختر مادة التحصيلي التي تريد أن تبدأ بها، ثم تابع دروسها وتدريبها."
              : "ابدأ بتقييم تأسيسي قصير. بعده نرتب لك الدروس والتدريب بحسب نقطة بدايتك."}
          </p>
        </div>
        <Link
          href={startHref}
          data-testid="link-start-diagnostic"
          className="inline-flex min-h-12 items-center justify-center gap-3 rounded-xl bg-primary px-5 text-sm font-black text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <ClipboardCheck className="h-5 w-5" aria-hidden="true" />
          {isTahsili ? "افتح تأسيس التحصيلي" : "ابدأ التقييم التشخيصي"}
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
      <p data-testid="status-analysis-pending" className="border-t border-border bg-muted/40 px-6 py-3 text-xs leading-6 text-muted-foreground sm:px-8">
        لا توجد نتائج سابقة بعد؛ لن نعرض مستوى أو نقاط مراجعة قبل محاولتك.
      </p>
    </section>
  );
}
