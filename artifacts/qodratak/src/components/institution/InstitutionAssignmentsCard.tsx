import { ClipboardCheck, Clock3, GraduationCap } from "lucide-react";
import { Link } from "wouter";
import { useMembership, useStudentInstitutionAssignments } from "@/lib/institutionApi";

const examLabels: Record<number, string> = {
  1: "اختبار قدراتك التأهيلي",
  2: "اختبار لفظي شامل — ٦٥ سؤالًا",
  3: "اختبار كمي شامل — ٥٥ سؤالًا",
  4: "اختبار قياس عام 2025",
};

function dateLabel(value: string | null) {
  if (!value) return "بلا موعد إغلاق";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "موعد الإغلاق غير متاح" :
    `آخر موعد ${new Intl.DateTimeFormat("ar-SA", { dateStyle: "medium" }).format(date)}`;
}

export default function InstitutionAssignmentsCard() {
  const membership = useMembership();
  const isInstitutionStudent =
    membership.data?.membership?.role === "student" &&
    membership.data.membership.status === "active" &&
    membership.data.membership.institutionActive;
  const assignments = useStudentInstitutionAssignments(Boolean(isInstitutionStudent));

  if (!isInstitutionStudent) return null;
  if (assignments.isLoading) return null;
  if (assignments.error) {
    return (
      <section role="alert" className="rounded-2xl border border-red-500/25 bg-red-500/5 p-4 text-sm text-red-700 dark:text-red-300">
        تعذر تحميل اختبارات مؤسستك. أعد تحميل الصفحة أو تواصل مع مدير المؤسسة.
      </section>
    );
  }
  const tests = assignments.data?.assignments ?? [];
  if (!tests.length) return null;
  const institutionName = assignments.data?.institutionName || "مؤسستك";

  return (
    <section data-testid="student-institution-assignments" dir="rtl" className="rounded-3xl border border-[#C4553F]/20 bg-card p-5 shadow-sm sm:p-6">
      <div className="mb-4 flex items-start gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#C4553F]/10 text-[#C4553F]">
          <GraduationCap className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-black text-[#C4553F]">اختبارات خاصة بمؤسسة {institutionName}</p>
          <h2 className="mt-1 text-lg font-black text-foreground">اختبارات مؤسستك</h2>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">تظهر هذه الاختبارات لطلاب مؤسستك فقط، وتُحفظ نتيجتك ضمن تقاريرك التفصيلية.</p>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {tests.map((test) => {
          const params = new URLSearchParams({
            examId: String(test.examId),
            institutionTestId: test.id,
            institutionTestTitle: test.title,
            institutionName,
          });
          return (
            <article key={test.id} className="rounded-2xl border border-border bg-background p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-black text-foreground">{test.title}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{examLabels[test.examId] || "اختبار قدراتك"}</p>
                </div>
                <ClipboardCheck className="h-5 w-5 shrink-0 text-[#C4553F]" />
              </div>
              <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Clock3 className="h-3.5 w-3.5" /> {dateLabel(test.dueAt)}
              </p>
              <div className="mt-4">
                {test.completed ? (
                  <div className="rounded-xl bg-emerald-500/10 px-3 py-2 text-sm font-black text-emerald-800 dark:text-emerald-300">
                    أُنجز الاختبار · النتيجة {test.percentage ?? "—"}%
                  </div>
                ) : test.expired ? (
                  <div className="rounded-xl bg-muted px-3 py-2 text-xs font-bold text-muted-foreground">انتهى موعد هذا الاختبار</div>
                ) : (
                  <Link href={`/qiyas-exam?${params.toString()}`} className="inline-flex min-h-10 w-full items-center justify-center rounded-xl bg-[#C4553F] px-4 text-sm font-black text-white transition hover:bg-[#a94332]">
                    ابدأ اختبار المؤسسة
                  </Link>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
