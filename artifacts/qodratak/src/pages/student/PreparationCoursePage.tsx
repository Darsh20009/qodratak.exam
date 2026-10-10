import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CalendarDays, Check, ChevronLeft, RefreshCw } from "lucide-react";
import {
  getGetFoundationLearningStateQueryKey,
  getGetStudentCourseQueryKey,
  useCompleteStudentCourseTask,
  useCreateStudentCourse,
  useGetFoundationLearningState,
  useGetStudentCourse,
  type StudentCourseState,
  type StudentCourseTask,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUser } from "@/hooks/use-user";
import useSubscription from "@/hooks/useSubscription";

const DURATIONS = [5, 10, 15, 30] as const;
type Duration = (typeof DURATIONS)[number];
const pendingKeyFor = (uid: unknown) => `qodratak.course.pendingInputs.${String(uid)}`;

const KIND_LABEL: Record<string, string> = {
  diagnostic: "تقييم",
  lesson: "درس",
  practice: "تدريب",
  review: "مراجعة",
  simulation: "محاكاة",
};
const CONF_LABEL: Record<string, string> = { limited: "أدلة محدودة", developing: "أدلة تتكوّن", repeated: "تكرر أكثر من مرة" };

function errMessage(e: unknown, fallback: string) {
  const status = (e as { status?: number } | null)?.status;
  if (status === 409) return "لم يُسجَّل بعد اختبار مطابق لهذه المهمة بعد تاريخ اليوم. أنجز المهمة أولًا ثم عد.";
  if (e instanceof Error && e.message) return e.message;
  return fallback;
}

function fmtDate(d: string) {
  const dt = new Date(d);
  return Number.isNaN(dt.getTime()) ? d : dt.toLocaleDateString("ar-SA", { weekday: "long", day: "numeric", month: "long" });
}

export default function PreparationCoursePage() {
  const { user, isLoading: userLoading } = useUser();
  const { subscription, isLoading: subLoading } = useSubscription();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const isStudent = user?.role === "student";
  const expired = Boolean(subscription?.isExpired);
  const userId = user?.id ?? user?._id;
  const pendingKey = pendingKeyFor(userId);
  const courseQuery = useGetStudentCourse({ query: { queryKey: getGetStudentCourseQueryKey(), staleTime: 30000, enabled: isStudent && !expired, refetchOnWindowFocus: true } });
  const isUnassessed = courseQuery.data?.course?.level === "unassessed";
  const foundation = useGetFoundationLearningState({ program: "qudrat" }, { query: { queryKey: getGetFoundationLearningStateQueryKey({ program: "qudrat" }), enabled: isStudent && !expired && (isUnassessed || Boolean(sessionStorage.getItem(pendingKey))), refetchOnWindowFocus: true, staleTime: 0 } });
  const [examDate, setExamDate] = useState("");
  const [duration, setDuration] = useState<Duration>(10);
  const [minutes, setMinutes] = useState(60);
  const [actionError, setActionError] = useState("");
  const [busyTask, setBusyTask] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const onState = (data: StudentCourseState) => {
    queryClient.setQueryData(getGetStudentCourseQueryKey(), data);
    void queryClient.invalidateQueries({ queryKey: ["/api/student/dashboard"] });
  };
  const [regenFailed, setRegenFailed] = useState(false);
  const create = useCreateStudentCourse({ mutation: { onSuccess: (d) => { onState(d); setShowForm(false); setActionError(""); if (d.course && d.course.level !== "unassessed") sessionStorage.removeItem(pendingKey); } } });
  const complete = useCompleteStudentCourseTask({ mutation: { onSuccess: (d) => { onState(d); setActionError(""); } } });

  // Refresh once on mount: tests taken elsewhere may have completed tasks.
  const refreshed = useRef(false);
  useEffect(() => {
    if (refreshed.current || !isStudent || expired) return;
    refreshed.current = true;
    void queryClient.invalidateQueries({ queryKey: getGetStudentCourseQueryKey() });
  }, [isStudent, expired, queryClient]);

  const state = courseQuery.data;
  const course = state?.course ?? null;

  // Regenerate only when: the course is still unassessed, the real placement profile says the
  // diagnostic is completed, and this user explicitly left pending inputs before the diagnostic.
  const regenAttempted = useRef(false);
  const createMutate = useRef(create.mutate);
  createMutate.current = create.mutate;
  const diagnosticDone = foundation.data?.status === "diagnostic_completed" &&
    (!course?.assessmentRequiredAfter ||
      new Date(foundation.data.lastDiagnosticAt || '').getTime() > new Date(course.assessmentRequiredAfter).getTime());
  useEffect(() => {
    if (regenAttempted.current || !diagnosticDone || !userId) return;
    const raw = sessionStorage.getItem(pendingKey);
    if (!raw) return;
    let input;
    try { input = JSON.parse(raw); } catch { sessionStorage.removeItem(pendingKey); return; }
    const requiredAfter = input.assessmentAfter || course?.assessmentRequiredAfter;
    if (requiredAfter && new Date(foundation.data?.lastDiagnosticAt || '').getTime() <= new Date(requiredAfter).getTime()) return;
    if (requiredAfter && !Number.isFinite(new Date(foundation.data?.lastDiagnosticAt || '').getTime())) return;
    if (!isUnassessed && !input.assessmentAfter) return;
    regenAttempted.current = true;
    createMutate.current({ data: input }, {
      onError: (e) => { setRegenFailed(true); setActionError(errMessage(e, "تعذر تحديث الخطة بعد التقييم.")); },
    });
  }, [isUnassessed, diagnosticDone, userId, pendingKey, course?.assessmentRequiredAfter, foundation.data?.lastDiagnosticAt]);

  const retryRegen = () => { regenAttempted.current = false; setRegenFailed(false); setActionError(""); void foundation.refetch(); };

  const today = new Date(Date.now() + 3 * 3600000).toISOString().slice(0, 10);
  const currentDay = useMemo(() => {
    if (!course) return null;
    return course.days.find((d) => d.tasks.some((t) => t.status === "pending")) ?? null;
  }, [course]);
  const nextTask: StudentCourseTask | null = currentDay?.tasks.find((t) => t.status === "pending") ?? null;
  const total = course?.days.reduce((n, d) => n + d.tasks.length, 0) ?? 0;
  const done = course?.days.reduce((n, d) => n + d.tasks.filter((t) => t.status === "completed").length, 0) ?? 0;

  const submit = () => {
    setActionError("");
    if (!examDate) return setActionError("اختر تاريخ اختبارك أولًا.");
    if (minutes < 30 || minutes > 240) return setActionError("الوقت اليومي بين 30 و240 دقيقة.");
    const input = { examDate, durationDays: duration, dailyMinutes: Math.round(minutes) };
    create.mutate({ data: input }, {
      onSuccess: (d) => {
        if (d.course?.level === "unassessed") {
          sessionStorage.setItem(pendingKey, JSON.stringify(input));
        }
      },
      onError: (e) => setActionError(errMessage(e, "تعذر إنشاء الخطة. حاول مرة أخرى.")),
    });
  };

  const goDiagnostic = () => {
    if (course) sessionStorage.setItem(pendingKey, JSON.stringify({ examDate: course.examDate.slice(0, 10), durationDays: [5, 10, 15, 30].includes(course.durationDays) ? course.durationDays : 5, dailyMinutes: course.dailyMinutes, assessmentAfter: course.assessmentRequiredAfter }));
    navigate("/foundation?program=qudrat&reassess=1");
  };

  const markDone = (task: StudentCourseTask) => {
    setActionError("");
    setBusyTask(task.id);
    complete.mutate({ taskId: task.id }, {
      onError: (e) => setActionError(errMessage(e, "تعذر تسجيل الإنجاز.")),
      onSettled: () => setBusyTask(null),
    });
  };

  if (userLoading || subLoading || (isStudent && !expired && courseQuery.isLoading)) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 p-5" dir="rtl" aria-label="جاري التحميل">
        <div className="h-10 w-64 animate-pulse rounded bg-muted" />
        <div className="h-48 animate-pulse rounded-3xl bg-muted" />
        <div className="h-32 animate-pulse rounded-3xl bg-muted" />
      </div>
    );
  }
  if (!user || !isStudent) {
    return <div className="p-8 text-center text-muted-foreground" dir="rtl">هذه الصفحة مخصصة لحسابات الطلاب.</div>;
  }
  if (expired) {
    return (
      <div className="mx-auto max-w-xl p-8 text-center" dir="rtl" data-testid="status-course-expired">
        <h1 className="text-2xl font-black text-foreground">انتهت تجربتك المجانية</h1>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">خطة التحضير تحتاج اشتراكًا نشطًا. ما زال اختبارك التكيفي اليومي متاحًا من الرئيسية.</p>
        <div className="mt-5 flex justify-center gap-3">
          <Link href="/subscription" data-testid="link-renew" className="rounded-xl bg-primary px-5 py-3 text-sm font-black text-primary-foreground">جدّد الاشتراك</Link>
          <Link href="/" className="rounded-xl border border-border px-5 py-3 text-sm font-black">الرئيسية</Link>
        </div>
      </div>
    );
  }
  if (courseQuery.isError) {
    return (
      <div className="flex flex-col items-center p-10 text-center" dir="rtl" role="alert">
        <AlertTriangle className="mb-3 h-10 w-10 text-rose-600" aria-hidden="true" />
        <p className="font-black">تعذر تحميل خطتك</p>
        <p className="mt-1 text-sm text-muted-foreground">{errMessage(courseQuery.error, "حدث خطأ مؤقت.")}</p>
        <Button className="mt-4" data-testid="button-retry-course" onClick={() => courseQuery.refetch()}><RefreshCw className="ml-2 h-4 w-4" />إعادة المحاولة</Button>
      </div>
    );
  }

  const form = (
    <section className="rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-7" data-testid="form-course">
      <h2 className="text-2xl font-black text-foreground">حجزت اختبارك؟</h2>
      <p className="mt-2 text-sm leading-7 text-muted-foreground">أخبرنا بموعدك ووقتك اليومي، وسنبني جدولًا يوميًا بمهام محددة. كلما اقترب الاختبار صار الجدول أقصر وأكثف.</p>
      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <label className="block space-y-2">
          <span className="text-sm font-bold">تاريخ الاختبار</span>
          <Input type="date" min={today} value={examDate} onChange={(e) => setExamDate(e.target.value)} data-testid="input-course-date" />
        </label>
        <label className="block space-y-2">
          <span className="text-sm font-bold">الوقت المتاح يوميًا (دقيقة)</span>
          <Input type="number" min={30} max={240} step={5} value={minutes} onChange={(e) => setMinutes(Number(e.target.value))} data-testid="input-course-minutes" />
        </label>
      </div>
      <fieldset className="mt-5">
        <legend className="text-sm font-bold">مدة الخطة</legend>
        <div className="mt-2 grid grid-cols-4 gap-2">
          {DURATIONS.map((d) => (
            <button key={d} type="button" aria-pressed={duration === d} onClick={() => setDuration(d)} data-testid={`button-duration-${d}`}
              className={`min-h-12 rounded-xl border text-sm font-black transition-colors ${duration === d ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:border-primary/40"}`}>
              {d} يومًا
            </button>
          ))}
        </div>
      </fieldset>
      {actionError && <p role="alert" className="mt-4 text-sm font-bold text-destructive" data-testid="text-course-error">{actionError}</p>}
      <Button type="button" onClick={submit} disabled={create.isPending} className="mt-6 min-h-12 w-full rounded-xl font-black sm:w-auto sm:px-8" data-testid="button-create-course">
        {create.isPending ? "جارٍ بناء الخطة..." : course ? "أعد بناء الخطة" : "ابنِ خطتي"}
      </Button>
      {course && <p className="mt-3 text-xs text-muted-foreground">إعادة البناء تستبدل الخطة الحالية. لن يحدث ذلك إلا بضغطك.</p>}
    </section>
  );

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-5 md:p-8" dir="rtl">
      <header>
        <p className="text-xs font-black text-primary">خطة التحضير</p>
        <h1 className="mt-1 text-3xl font-black text-foreground" data-testid="text-course-title">{course ? "خطتك حتى الاختبار" : "حجزت اختبارك؟"}</h1>
      </header>

      {!course || showForm ? form : (
        <>
          <section className="rounded-3xl border border-primary/20 bg-primary/5 p-5 sm:p-7" data-testid="section-course-next">
            <p className="text-xs font-black text-primary">المهمة التالية</p>
            {course.level === "unassessed" ? (
              <>
                <h2 className="mt-1 text-xl font-black">ابدأ بالتقييم التأسيسي</h2>
                <p className="mt-1 text-sm leading-7 text-muted-foreground">{course.levelReason} بعد التقييم نعيد بناء الخطة بنفس موعدك ووقتك.</p>
                {diagnosticDone && regenFailed ? (
                  <Button onClick={retryRegen} className="mt-4 min-h-11 rounded-xl font-black" data-testid="button-retry-regenerate">أعد المحاولة</Button>
                ) : diagnosticDone ? (
                  <p className="mt-3 text-sm font-bold" data-testid="status-regenerating">اكتمل التقييم، جارٍ تحديث خطتك...</p>
                ) : (
                  <Button onClick={goDiagnostic} className="mt-4 min-h-11 rounded-xl font-black" data-testid="button-start-diagnostic">ابدأ التقييم<ChevronLeft className="mr-2 h-4 w-4" /></Button>
                )}
              </>
            ) : nextTask ? (
              <>
                <h2 className="mt-1 text-xl font-black">{nextTask.title}</h2>
                <p className="mt-1 text-sm leading-7 text-muted-foreground">{nextTask.reason}</p>
                <p className="mt-2 text-xs font-bold text-muted-foreground">اليوم {currentDay?.day} · {nextTask.minutes} دقيقة{nextTask.questionCount ? ` · ${nextTask.questionCount} سؤالًا` : ""}</p>
                {currentDay && currentDay.date <= today
                  ? <Link href={nextTask.href} data-testid="link-next-task" className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-foreground px-5 text-sm font-black text-background">ابدأ<ChevronLeft className="h-4 w-4" /></Link>
                  : <p className="mt-4 text-sm font-bold text-muted-foreground">أنهيت مهامك المستحقة. هذه الخطوة مجدولة لليوم التالي.</p>}
              </>
            ) : (
              <h2 className="mt-1 text-xl font-black">أنجزت كل مهام الخطة</h2>
            )}
          </section>

          <section className="rounded-3xl border border-border bg-card p-5 text-sm leading-7" data-testid="section-course-summary">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-black">المستوى: {{ unassessed: "لم يُقيَّم", foundation: "تأسيس", practice: "تدريب", advanced: "متقدم" }[course.level]}</span>
              <span className="text-xs font-bold text-muted-foreground">{done} من {total} مهمة</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done}>
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${total ? Math.round((done / total) * 100) : 0}%` }} />
            </div>
            <p className="mt-3 text-muted-foreground">{course.levelReason}</p>
            <p className="text-muted-foreground">التركيز: {course.focus}</p>
            <p className="mt-1 text-xs text-muted-foreground" data-testid="text-coverage-note">{course.coverageNote}</p>
            <p className="text-xs text-muted-foreground">{course.plannedQuestions} سؤالًا مخططًا من {course.availableQuestions} متاحًا. الخطة لا تضمن تغطية كل الأسئلة.</p>
            <Button variant="outline" size="sm" className="mt-3 rounded-lg" onClick={() => setShowForm(true)} data-testid="button-edit-course">تعديل الموعد أو المدة</Button>
          </section>

          {actionError && <p role="alert" className="text-sm font-bold text-destructive" data-testid="text-course-error">{actionError}</p>}

          <section aria-label="الجدول اليومي" className="space-y-4">
            {course.days.map((day) => (
              <article key={day.day} className="rounded-3xl border border-border bg-card p-5" data-testid={`card-course-day-${day.day}`}>
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-primary" aria-hidden="true" />
                  <h3 className="font-black">اليوم {day.day} · {day.title}</h3>
                  <span className="mr-auto text-xs text-muted-foreground">{fmtDate(day.date)}</span>
                </div>
                <ul className="mt-3 space-y-2">
                  {day.tasks.map((t) => (
                    <li key={t.id} className="rounded-2xl border border-border/70 p-3" data-testid={`row-course-task-${t.id}`}>
                      <div className="flex items-start gap-3">
                        <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${t.status === "completed" ? "bg-emerald-600 text-white" : "border border-border"}`}>
                          {t.status === "completed" && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-black">{t.title} <span className="mr-1 rounded bg-muted px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground">{KIND_LABEL[t.kind] ?? t.kind}</span></p>
                          <p className="mt-1 text-xs leading-6 text-muted-foreground">{t.reason}</p>
                          <p className="mt-1 text-[11px] font-bold text-muted-foreground">
                            {t.minutes} دقيقة{t.questionCount ? ` · ${t.questionCount} سؤالًا` : ""}
                            {t.status === "completed" && ` · ${t.completionSource === "self_reported" ? "أكدتَ إنجازه بنفسك (لا يعني إتقانًا)" : "تحقق من اختبار فعلي"}`}
                          </p>
                          {t.status === "pending" && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {day.date <= today
                                ? <Link href={t.href} data-testid={`link-task-${t.id}`} className="inline-flex min-h-9 items-center rounded-lg bg-primary px-3 text-xs font-black text-primary-foreground">افتح</Link>
                                : <span className="inline-flex min-h-9 items-center rounded-lg bg-muted px-3 text-xs font-bold text-muted-foreground">موعدها لاحقًا</span>}
                              {t.kind === "lesson" || t.kind === "review" ? (
                                <Button size="sm" variant="outline" className="min-h-9 rounded-lg text-xs font-black" disabled={busyTask === t.id || day.date > today} onClick={() => markDone(t)} data-testid={`button-complete-${t.id}`}>
                                  {busyTask === t.id ? "جارٍ الحفظ..." : t.kind === "lesson" ? "أنهيت الدرس" : "أنهيت المراجعة"}
                                </Button>
                              ) : t.kind === "practice" || t.kind === "simulation" ? (
                                <span className="self-center text-[11px] text-muted-foreground">تُسجَّل تلقائيًا بعد تسليم إجاباتك في اختبار فعلي.</span>
                              ) : null}
                            </div>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </section>
        </>
      )}

      {state && state.ideas.length > 0 && (
        <section className="rounded-3xl border border-border bg-card p-5" data-testid="section-question-ideas">
          <h2 className="font-black">أفكار تحتاج انتباهك</h2>
          <p className="mt-1 text-xs leading-6 text-muted-foreground">تجميع آلي بسيط لما لاحظناه في محاولاتك. هذه ليست درجة إتقان معتمدة، والأدلة هنا قليلة وقد تتغير.</p>
          <ul className="mt-3 space-y-2">
            {state.ideas.map((i) => (
              <li key={i.key} className="rounded-xl bg-muted/60 p-3 text-sm">
                <p className="font-black">{i.label}</p>
                <p className="text-xs text-muted-foreground">{i.attempts} محاولة · {i.wrong} خطأ · {i.slow} بطيء · {CONF_LABEL[i.confidence] ?? i.confidence}</p>
                <p className="mt-1 text-xs text-muted-foreground">{i.reason}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
