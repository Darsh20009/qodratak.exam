import { ArrowLeft, BookOpen, Check, CircleDashed, Clock3, FileCheck2, Flame, Flag, Sparkles, Target } from "lucide-react";
import { Link } from "wouter";
import StudentProgressPathChart from "@/components/student/StudentProgressPathChart";
import type {
  StudentDashboardEvidenceStatus,
  StudentDashboardProgressOverviewProps,
  StudentDashboardTaskStatus,
} from "@/lib/studentDashboardProgress";

const stageStatus: Record<StudentDashboardEvidenceStatus, { label: string; tone: string }> = {
  NOT_ASSESSED: { label: "بانتظار بيانات", tone: "border-border bg-muted/50 text-muted-foreground" },
  NOT_STARTED: { label: "لم يبدأ", tone: "border-border bg-muted/50 text-muted-foreground" },
  IN_PROGRESS: { label: "قيد التقدم", tone: "border-primary/25 bg-primary/10 text-primary" },
  COMPLETED: { label: "مكتمل", tone: "border-emerald-600/20 bg-emerald-600/10 text-emerald-700 dark:text-emerald-300" },
  NEEDS_REVIEW: { label: "يحتاج مراجعة", tone: "border-amber-600/20 bg-amber-600/10 text-amber-800 dark:text-amber-300" },
};

const taskStatus: Record<StudentDashboardTaskStatus, { label: string; tone: string }> = {
  PENDING: { label: "بانتظار البدء", tone: "bg-muted text-muted-foreground" },
  IN_PROGRESS: { label: "قيد التنفيذ", tone: "bg-primary/10 text-primary" },
  COMPLETED: { label: "مكتملة", tone: "bg-emerald-600/10 text-emerald-700 dark:text-emerald-300" },
  NEEDS_REVIEW: { label: "تحتاج مراجعة", tone: "bg-amber-600/10 text-amber-800 dark:text-amber-300" },
};

function formatStudyTime(seconds: number | null) {
  if (seconds === null || !Number.isFinite(seconds)) return "غير متاح";
  const hours = seconds / 3600;
  return `${hours.toLocaleString("ar-SA", { maximumFractionDigits: 1 })} ساعة`;
}

function MetricValue({ value, state }: { value: string | number | null; state: StudentDashboardProgressOverviewProps["metricsState"] }) {
  if (state === "loading") return <span className="inline-block h-7 w-24 animate-pulse rounded-md bg-muted align-middle" aria-label="جارٍ التحميل" />;
  if (state === "unavailable" || value === null) return <span className="text-muted-foreground">غير متاح</span>;
  return <>{value}</>;
}

function StageIcon({ status }: { status: StudentDashboardEvidenceStatus }) {
  if (status === "COMPLETED") return <Check className="h-4 w-4" aria-hidden="true" />;
  if (status === "NEEDS_REVIEW") return <Target className="h-4 w-4" aria-hidden="true" />;
  if (status === "IN_PROGRESS") return <Sparkles className="h-4 w-4" aria-hidden="true" />;
  return <CircleDashed className="h-4 w-4" aria-hidden="true" />;
}

export default function StudentDashboardProgressOverview(props: StudentDashboardProgressOverviewProps) {
  const {
    metrics,
    metricsState,
    stages,
    tasks,
    tasksState,
    program,
    onProgramChange,
    subjectId,
    subjectOptions,
    onSubjectChange,
    subjectState,
    subjectEmptyMessage,
    subjectFallbackHref,
    trendState,
    trendPoints,
  } = props;
  const metricsItems = [
    {
      label: "وقت التعلّم المسجّل",
      value: formatStudyTime(metrics.studySeconds),
      note: "وقت صفحات التعلّم الظاهرة في حسابك",
      icon: Clock3,
      accent: "text-primary bg-primary/10",
      testId: "metric-study-time",
    },
    {
      label: "اختبارات مكتملة",
      value: metrics.completedTests,
      note: "نتائج محفوظة",
      icon: FileCheck2,
      accent: "text-emerald-700 bg-emerald-600/10 dark:text-emerald-300",
      testId: "metric-completed-tests",
    },
    {
      label: "أيام نشاط موثّق",
      value: metrics.verifiedStudyDays,
      note: "إجابات موثّقة في الحساب كله — ليست سلسلة",
      icon: BookOpen,
      accent: "text-amber-800 bg-amber-600/10 dark:text-amber-300",
      testId: "metric-verified-days",
    },
  ];

  return (
    <section dir="rtl" data-testid="student-progress-overview" aria-labelledby="student-progress-overview-title" className="mx-auto w-full max-w-5xl space-y-5">
      <header className="relative isolate overflow-hidden rounded-[1.75rem] border border-primary/15 bg-card px-5 py-6 sm:px-7 sm:py-7">
        <div aria-hidden="true" className="absolute -left-10 -top-14 -z-10 h-48 w-48 rounded-full border-[28px] border-primary/[0.06]" />
        <div className="flex items-start gap-4">
          <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground sm:flex">
            <Flag className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-black tracking-wide text-primary">ملخص رحلتك</p>
            <h2 id="student-progress-overview-title" className="mt-1 text-2xl font-black tracking-tight text-foreground sm:text-3xl">تقدّمك، كما تثبته بياناتك</h2>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">
              نعرض ما تم حفظه فقط؛ كل مرحلة تحتفظ بحالتها المسجلة، دون استنتاج إنجاز من نتيجة اختبار أو خطوة لاحقة.
            </p>
          </div>
        </div>
      </header>

      <dl aria-label="مؤشرات التعلّم" className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {metricsItems.map(({ label, value, note, icon: Icon, accent, testId }) => (
          <div key={label} data-testid={testId} className="rounded-2xl border border-border bg-card p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <dt className="text-xs font-bold text-muted-foreground">{label}</dt>
                <dd className="mt-2 min-h-8 text-xl font-black tabular-nums text-foreground">
                  <MetricValue value={value} state={metricsState} />
                </dd>
              </div>
              <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${accent}`}>
                <Icon className="h-4 w-4" aria-hidden="true" />
              </span>
            </div>
            <p className="mt-2 text-[11px] leading-5 text-muted-foreground">{note}</p>
          </div>
        ))}
      </dl>

      {metrics.currentGoalStreak !== null && metricsState === "ready" && (
        <p data-testid="metric-goal-streak" className="flex items-center gap-2 rounded-xl border border-border/70 bg-muted/30 px-4 py-3 text-xs leading-5 text-muted-foreground">
          <Flame className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
          <span><strong className="text-foreground">{metrics.currentGoalStreak.toLocaleString("ar-SA")} أيام</strong> سلسلة تحقيق الهدف اليومي المتتالية — منفصلة عن أيام النشاط الموثّق.</span>
        </p>
      )}

      <section aria-labelledby="student-subject-scope-title" className="rounded-2xl border border-border bg-card px-4 py-4 sm:px-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black text-primary">مواد التأسيس والجلسة اليومية</p>
            <h3 id="student-subject-scope-title" className="mt-1 text-sm font-black text-foreground">
              {program === "tahsili" ? "اختر مادة التحصيلي" : "اختر القسم"}
            </h3>
          </div>
          {subjectState === "loading" ? (
            <span role="status" className="text-xs text-muted-foreground">جارٍ تحميل المواد المنشورة…</span>
          ) : subjectOptions.length > 0 ? (
            <div role="group" aria-labelledby="student-subject-scope-title" className="flex flex-wrap gap-2">
              {subjectOptions.map((subject) => (
                <button
                  key={subject.id}
                  type="button"
                  aria-pressed={subject.id === subjectId}
                  onClick={() => onSubjectChange(subject.id)}
                  className={`min-h-10 rounded-xl border px-4 text-sm font-bold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${
                    subject.id === subjectId
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-foreground hover:border-primary/40 hover:bg-primary/5"
                  }`}
                >
                  {subject.label}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-3">
              <p role={subjectState === "unavailable" ? "alert" : "status"} className="text-xs leading-5 text-muted-foreground">
                {subjectState === "unavailable"
                  ? "تعذر تحميل المواد المنشورة؛ لم نفترض توفرها."
                  : subjectEmptyMessage || "لا توجد مواد تأسيس منشورة لهذا المسار حاليًا."}
              </p>
              {subjectFallbackHref && (
                <Link href={subjectFallbackHref} className="inline-flex min-h-9 items-center rounded-lg border border-border px-3 text-xs font-black text-primary hover:bg-primary/5">
                  استعرض الاختبارات المتاحة
                </Link>
              )}
            </div>
          )}
        </div>
        <p className="mt-3 text-xs leading-5 text-muted-foreground">
          تقدم الدروس والجلسة يتبعان المادة المختارة؛ منحنى الاختبارات يعرض نتائج البرنامج كاملًا.
        </p>
      </section>

      <section aria-labelledby="student-stages-title" className="rounded-3xl border border-border bg-card p-5 sm:p-6">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-xs font-black text-primary">مراحل الاستعداد</p>
            <h3 id="student-stages-title" className="mt-1 text-xl font-black text-foreground">كل مرحلة بحالتها المحفوظة</h3>
          </div>
          <span className="text-xs text-muted-foreground">{stages.length} مراحل</span>
        </div>
        {stages.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-5 text-center text-sm leading-6 text-muted-foreground">لا توجد بيانات مراحل متاحة الآن.</div>
        ) : (
          <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {stages.map((stage, index) => {
              const state = stageStatus[stage.status];
              return (
                <li
                  key={stage.id}
                  data-testid={`progress-stage-${stage.id}`}
                  data-current={stage.isCurrent ? "true" : "false"}
                  className={`relative min-w-0 rounded-2xl border p-4 ${
                    stage.isCurrent
                      ? "border-primary/50 bg-primary/[0.045] shadow-sm"
                      : "border-border/80 bg-background/60"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${state.tone}`} aria-hidden="true">
                      <StageIcon status={stage.status} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h4 className="font-black text-foreground">{stage.title}</h4>
                        <div className="flex items-center gap-1.5">
                          {stage.isCurrent && <span className="rounded-full bg-primary px-2 py-1 text-[10px] font-black text-primary-foreground">أنت هنا</span>}
                          <span className={`rounded-full border px-2 py-1 text-[10px] font-black ${state.tone}`}>{state.label}</span>
                        </div>
                      </div>
                      <p className="mt-2 text-xs leading-6 text-muted-foreground">{stage.detail}</p>
                      {typeof stage.completedCount === "number" && typeof stage.totalCount === "number" && stage.totalCount > 0 && (
                        <div className="mt-3" aria-label={`${stage.completedCount} من ${stage.totalCount}`}>
                          <div className="mb-1 flex justify-between text-[10px] font-bold text-muted-foreground">
                            <span>الدروس المكتملة</span><span dir="ltr">{stage.completedCount}/{stage.totalCount}</span>
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                            <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, (stage.completedCount / stage.totalCount) * 100)}%` }} />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <Link href={stage.href} data-testid={`link-stage-${stage.id}`} aria-label={`افتح مرحلة ${stage.title}`} className="mt-4 inline-flex min-h-9 items-center gap-2 rounded-lg px-2 text-xs font-black text-primary transition-colors hover:bg-primary/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
                    تفاصيل المرحلة <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                  <span className="absolute bottom-4 left-4 text-[10px] font-bold tabular-nums text-muted-foreground/60" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      <StudentProgressPathChart
        program={program}
        onProgramChange={onProgramChange}
        trendState={trendState}
        trendPoints={trendPoints}
      />

      <section aria-labelledby="student-tasks-title" className="rounded-3xl border border-border bg-card p-5 sm:p-6">
        <div className="mb-5 flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-black text-primary">خطوات مقترحة</p>
            <h3 id="student-tasks-title" className="mt-1 text-xl font-black text-foreground">ما يمكنك العمل عليه الآن</h3>
          </div>
          <span className="rounded-full bg-muted px-3 py-1.5 text-xs font-bold text-muted-foreground">{tasks.length} {tasks.length === 1 ? "مهمة" : "مهام"}</span>
        </div>
        {tasksState === "loading" ? (
          <div data-testid="progress-tasks-loading" role="status" aria-label="تحميل المهام" className="space-y-3">
            {[0, 1].map((item) => <div key={item} className="h-16 animate-pulse rounded-xl bg-muted/60" />)}
          </div>
        ) : tasksState === "unavailable" ? (
          <div data-testid="progress-tasks-unavailable" className="rounded-2xl border border-dashed border-border bg-muted/20 px-5 py-8 text-center">
            <p className="font-black text-foreground">تعذر تحميل المهام الآن</p>
            <p className="mt-1 text-sm text-muted-foreground">لا نعرض مهام بديلة غير محفوظة.</p>
          </div>
        ) : tasksState === "content-unavailable" ? (
          <div data-testid="progress-tasks-content-unavailable" className="rounded-2xl border border-dashed border-border bg-muted/20 px-5 py-8 text-center">
            <p className="font-black text-foreground">لا توجد خطوة تعلم منشورة لهذا النطاق الآن</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">لم نُنشئ مهمة بديلة أو نخلط مواد المسارات. يمكنك اختيار مادة أخرى أو فتح الاختبارات المتاحة.</p>
            {subjectFallbackHref && (
              <Link href={subjectFallbackHref} className="mt-4 inline-flex min-h-10 items-center rounded-xl border border-border px-4 text-sm font-black text-primary hover:bg-primary/5">
                استعرض الاختبارات المتاحة
              </Link>
            )}
          </div>
        ) : tasks.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-5 py-8 text-center">
            <div className="mx-auto grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary"><Sparkles className="h-5 w-5" aria-hidden="true" /></div>
            <p className="mt-3 font-black text-foreground">لا توجد خطوات مقترحة الآن</p>
            <p className="mt-1 text-sm text-muted-foreground">ستظهر هنا المهام التي تم تحديدها لك من بياناتك المحفوظة.</p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {tasks.slice(0, 3).map((task) => {
              const state = taskStatus[task.status];
              return (
                <li key={task.id} data-testid={`progress-task-${task.id}`} className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-black text-foreground">{task.title}</h4>
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${state.tone}`}>{state.label}</span>
                    </div>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{task.reason}</p>
                    {task.followUp && (
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">
                        <span className="font-black text-foreground">بعدها: </span>{task.followUp}
                      </p>
                    )}
                    {typeof task.estimatedMinutes === "number" && task.estimatedMinutes > 0 && (
                      <p className="mt-1 text-xs font-bold text-muted-foreground">الوقت التقديري: {task.estimatedMinutes.toLocaleString("ar-SA")} دقيقة</p>
                    )}
                  </div>
                  <Link href={task.href} data-testid={`link-task-${task.id}`} className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-border px-4 text-sm font-black text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
                    {task.status === "COMPLETED" ? "عرض المهمة" : task.status === "NEEDS_REVIEW" ? "افتح للمراجعة" : "افتح المهمة"}
                    <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </section>
  );
}
