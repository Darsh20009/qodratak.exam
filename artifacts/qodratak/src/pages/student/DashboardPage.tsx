import { useState } from "react";
import { Link } from "wouter";
import {
  AlertTriangle,
  Award,
  BookOpen,
  Brain,
  Calendar,
  ChevronLeft,
  ChevronDown,
  ClipboardCheck,
  FileText,
  Laptop,
  ListChecks,
  PlayCircle,
  RefreshCw,
  Route,
  Target,
} from "lucide-react";
import {
  useAdaptiveLearningDecision,
  useStudentDashboard,
  useStudentLearningRecommendations,
  useTodayLearningSession,
  useUpdateExamDate,
} from "@/hooks/use-student";
import OfficialScoreCard from "@/components/student/OfficialScoreCard";
import { useUser } from "@/hooks/use-user";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SubscriptionRenewalDialog from "@/components/SubscriptionRenewalDialog";

const SUPPORTED_DASHBOARD_PATHS = new Set([
  "/",
  "/foundation",
  "/student-program/qudrat",
  "/student-program/tahsili",
  "/learning/today",
  "/tahsilik/tests",
  "/computerized",
  "/question-bank",
  "/qiyas",
  "/book-exam",
  "/account",
]);

function getSafeInternalHref(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return "/foundation";

  try {
    const url = new URL(value.trim(), "https://qodratak.internal");
    if (url.origin !== "https://qodratak.internal" || !SUPPORTED_DASHBOARD_PATHS.has(url.pathname)) {
      return "/foundation";
    }
    return `${url.pathname}${url.search}`;
  } catch {
    return "/foundation";
  }
}

function clampPercentage(value: number | undefined) {
  return Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
}

function formatDateInput(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function DashboardSkeleton() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-5 md:p-8" dir="rtl" aria-label="جاري تحميل لوحة الطالب">
      <div className="space-y-3">
        <div className="h-4 w-28 animate-pulse rounded bg-muted" />
        <div className="h-10 w-48 animate-pulse rounded bg-muted" />
        <div className="h-4 w-72 max-w-full animate-pulse rounded bg-muted" />
      </div>
      <div className="h-44 animate-pulse rounded-3xl bg-muted" />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="h-52 animate-pulse rounded-3xl bg-muted" />
        <div className="h-52 animate-pulse rounded-3xl bg-muted" />
      </div>
    </div>
  );
}

const paths = [
  { href: "/foundation", label: "التأسيس والتقييم", detail: "ابنِ أساسك", icon: BookOpen },
  { href: "/computerized", label: "التدريب المحوسب", detail: "تدرّب بتركيز", icon: Laptop },
  { href: "/question-bank", label: "بنك الأسئلة", detail: "راجع ما تحتاجه", icon: ListChecks },
  { href: "/qiyas", label: "المحاكاة", detail: "اختبر جاهزيتك", icon: ClipboardCheck },
];

export default function DashboardPage() {
  const { user, isLoading: isUserLoading } = useUser();
  const isStudent = user?.role === "student";
  const {
    data: dashboard,
    isLoading,
    isError,
    error,
    refetch: refetchDashboard,
  } = useStudentDashboard(isStudent);
  const journeyProgram = dashboard?.recommendedPlan?.program
    ?? dashboard?.officialScores?.program
    ?? "qudrat";
  const journeySubjectId = dashboard?.recommendedPlan?.subjectId;
  const hasJourneyScope = isStudent && Boolean(dashboard);
  const todayLearning = useTodayLearningSession(hasJourneyScope, journeyProgram, journeySubjectId);
  const adaptiveDecision = useAdaptiveLearningDecision(hasJourneyScope, journeyProgram, journeySubjectId);
  const recommendations = useStudentLearningRecommendations(hasJourneyScope, journeyProgram);
  const updateExamDate = useUpdateExamDate();
  const [examDateStr, setExamDateStr] = useState("");
  const [isExamDialogOpen, setIsExamDialogOpen] = useState(false);
  const [subscriptionDialogOpen, setSubscriptionDialogOpen] = useState(false);

  if (isUserLoading || (isStudent && isLoading)) return <DashboardSkeleton />;

  if (!user) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center p-6 text-center" dir="rtl">
        <AlertTriangle className="mb-4 h-12 w-12 text-amber-600" aria-hidden="true" />
        <h2 className="text-xl font-black text-foreground">انتهت جلسة تسجيل الدخول</h2>
        <p className="mt-2 text-muted-foreground">سجّل الدخول من جديد للوصول إلى لوحة التحكم.</p>
        <Link href="/login" data-testid="link-login" className="mt-5 rounded-xl px-4 py-2 font-black text-primary hover:bg-primary/10">
          الانتقال إلى تسجيل الدخول
        </Link>
      </div>
    );
  }

  if (!isStudent) {
    const accountHref =
      user.role === "parent"
        ? "/parent-dashboard"
        : user.role === "institution_admin"
          ? "/institution"
          : user.role === "teacher"
            ? "/teacher"
            : "/";
    return (
      <div className="flex min-h-full flex-col items-center justify-center p-6 text-center" dir="rtl">
        <AlertTriangle className="mb-4 h-12 w-12 text-amber-600" aria-hidden="true" />
        <h2 className="text-xl font-black text-foreground">هذه ليست لوحة حسابك</h2>
        <p className="mt-2 text-muted-foreground">افتح المساحة المناسبة لنوع حسابك.</p>
        <Link href={accountHref} data-testid="link-account-space" className="mt-5 rounded-xl px-4 py-2 font-black text-primary hover:bg-primary/10">
          فتح لوحة حسابي
        </Link>
      </div>
    );
  }

  if (isError || !dashboard) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center p-6 text-center" dir="rtl">
        <AlertTriangle className="mb-4 h-12 w-12 text-rose-600" aria-hidden="true" />
        <h2 className="text-xl font-black text-foreground">تعذر تحميل لوحتك</h2>
        <p className="mt-2 max-w-md text-sm leading-7 text-muted-foreground">
          {error instanceof Error ? error.message : "حدث خطأ مؤقت. حاول تحميل البيانات من جديد."}
        </p>
        <Button
          type="button"
          data-testid="button-retry-dashboard"
          onClick={() => refetchDashboard()}
          className="mt-5 rounded-xl font-black"
        >
          <RefreshCw className="ml-2 h-4 w-4" aria-hidden="true" />
          إعادة المحاولة
        </Button>
      </div>
    );
  }

  const userName = user.name || user.username || "طالب";
  const firstName = userName.split(" ")[0];
  const todayPlan = todayLearning.data?.plan;
  const planProgram = todayPlan?.programId === "program.tahsili"
    ? "tahsili"
    : todayPlan?.programId === "program.qudrat"
      ? "qudrat"
      : journeyProgram;
  const planSubjectId = todayPlan?.subjectId || journeySubjectId;
  const foundationHref = planProgram === "tahsili"
    ? planSubjectId
      ? `/foundation?program=tahsili&subject=${encodeURIComponent(planSubjectId.replace(/^subject\.tahsili\./, ""))}`
      : "/foundation?program=tahsili"
    : "/foundation";
  const todaySessionHref = (() => {
    const params = new URLSearchParams({ programId: planProgram });
    if (planSubjectId) params.set("subjectId", planSubjectId);
    return `/learning/today?${params.toString()}`;
  })();
  const adaptiveLabel =
    adaptiveDecision.data?.decision === "REVIEW"
      ? "مراجعة سريعة"
      : adaptiveDecision.data?.decision === "RECOVERY"
        ? "نكمل من حيث توقفت"
        : adaptiveDecision.data?.decision === "ADVANCE"
          ? "خطوتك التعليمية التالية"
          : adaptiveDecision.data?.decision === "PRACTICE"
            ? "تدرّب على ما يحتاج دعمًا"
            : "خطوتك التالية";
  const recommendation = recommendations.data?.recommendations?.find((item) =>
    !journeySubjectId || item.subjectId === journeySubjectId
  );
  const todayTitle = todayPlan?.title || recommendation?.title || adaptiveLabel;
  const todayReason =
    todayPlan?.sessionReason ||
    adaptiveDecision.data?.reason ||
    recommendation?.reason ||
    "جلسة قصيرة بخطوات واضحة تساعدك على التقدم.";
  const todayIsComplete = todayPlan?.state === "COMPLETED";
  const todayHref = todayPlan?.planStatus === "DIAGNOSTIC_REQUIRED" ? foundationHref : todaySessionHref;
  const recommendedHref = getSafeInternalHref(dashboard.recommendedPlan?.nextAction?.href);
  const daysToExam = dashboard.upcomingExam.date
    ? Math.max(0, Math.ceil((new Date(dashboard.upcomingExam.date).getTime() - Date.now()) / 86400000))
    : null;
  const recentTests = dashboard.recentTests ?? [];
  const weaknesses = dashboard.weaknesses ?? [];
  const progressItems = [
    { key: "overall", label: "الإجمالي", value: dashboard.progress.overall.percentage },
    { key: "verbal", label: "اللفظي", value: dashboard.progress.verbal.percentage },
    { key: "quantitative", label: "الكمي", value: dashboard.progress.quantitative.percentage },
    { key: "tahsili", label: "التحصيلي", value: dashboard.progress.tahsili.percentage },
  ];

  const handleOpenExamDialog = () => {
    setExamDateStr(formatDateInput(dashboard.upcomingExam.date));
    setIsExamDialogOpen(true);
  };

  const handleSaveExamDate = () => {
    if (!examDateStr) return;
    updateExamDate.mutate(new Date(`${examDateStr}T12:00:00`).toISOString(), {
      onSuccess: () => setIsExamDialogOpen(false),
    });
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-7 p-5 md:p-8" dir="rtl">
      <header className="space-y-2">
        <p className="text-sm font-bold text-muted-foreground">{new Date().getHours() < 17 ? "مرحبًا" : "مساء الخير"}،</p>
        <h1 data-testid="text-student-name" className="text-3xl font-black tracking-tight text-foreground md:text-4xl">
          {firstName}
        </h1>
        <p className="text-sm leading-7 text-muted-foreground">خطوة واحدة الآن تكفي لتعرف ما التالي في استعدادك.</p>
      </header>

      <section data-testid="student-next-step" className="overflow-hidden rounded-3xl border border-primary/20 bg-primary/5 shadow-sm">
        <div className="flex flex-col gap-5 p-5 sm:p-7 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <PlayCircle className="h-6 w-6" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-black tracking-wide text-primary">مهمتك التالية</p>
              {todayLearning.isLoading ? (
                <div className="mt-3 space-y-2" data-testid="status-today-loading">
                  <div className="h-6 w-56 animate-pulse rounded bg-muted" />
                  <div className="h-4 w-80 max-w-full animate-pulse rounded bg-muted" />
                </div>
              ) : todayLearning.isError ? (
                <div data-testid="status-today-error">
                  <h2 className="mt-1 text-xl font-black text-foreground">لم نتمكن من تجهيز مهمة اليوم</h2>
                  <p className="mt-1 text-sm leading-7 text-muted-foreground">تحقق من الاتصال وحاول تحميل المهمة مرة أخرى.</p>
                </div>
              ) : !todayPlan ? (
                <div data-testid="status-today-empty">
                  <h2 className="mt-1 text-xl font-black text-foreground">ابدأ بتحديد مسارك</h2>
                  <p className="mt-1 text-sm leading-7 text-muted-foreground">لا توجد مهمة جاهزة بعد. ابدأ بالتقييم لنقترح لك الخطوة المناسبة.</p>
                </div>
              ) : (
                <div data-testid="status-today-ready">
                  <h2 className="mt-1 text-xl font-black text-foreground">{todayIsComplete ? "أكملت مهمة اليوم" : todayTitle}</h2>
                  <p className="mt-1 max-w-2xl text-sm leading-7 text-muted-foreground">{todayReason}</p>
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs font-bold text-muted-foreground">
                    <span>{todayPlan.estimatedMinutes} دقيقة تقريبًا</span>
                    <span>{clampPercentage(todayPlan.progress)}٪ من المهمة</span>
                  </div>
                </div>
              )}
            </div>
          </div>
          {todayLearning.isError ? (
            <Button
              type="button"
              data-testid="button-retry-today-learning"
              onClick={() => todayLearning.refetch()}
              className="min-h-11 shrink-0 rounded-xl bg-foreground px-5 font-black text-background hover:bg-foreground/90"
            >
              <RefreshCw className="ml-2 h-4 w-4" aria-hidden="true" />
              إعادة المحاولة
            </Button>
          ) : (
            <Link
              href={todayPlan ? todayHref : foundationHref}
              data-testid="link-start-next-step"
              className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-foreground px-5 text-sm font-black text-background transition-opacity hover:opacity-90"
            >
              {todayPlan?.planStatus === "DIAGNOSTIC_REQUIRED" || !todayPlan
                ? planProgram === "tahsili" ? "اختر مادتك" : "ابدأ التقييم"
                : todayIsComplete ? "عرض مهمة اليوم" : todayLearning.data?.started ? "نكمل؟" : "ابدأ المهمة"}
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </Link>
          )}
        </div>
      </section>

      <section data-testid="student-progress-summary" className="rounded-3xl border border-border bg-card p-5 shadow-sm md:p-6">
        <div className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black text-primary">ملخص التقدم</p>
            <h2 className="mt-1 text-xl font-black text-foreground">أين وصلت حتى الآن؟</h2>
          </div>
          <div className="flex gap-5 text-sm">
            <div data-testid="stat-average-score">
              <p className="text-2xl font-black text-foreground">{dashboard.stats.averageScore}%</p>
              <p className="text-xs font-bold text-muted-foreground">متوسط الأداء</p>
            </div>
            <div data-testid="stat-total-tests">
              <p className="text-2xl font-black text-foreground">{dashboard.stats.totalTests}</p>
              <p className="text-xs font-bold text-muted-foreground">اختبارات منجزة</p>
            </div>
            <div data-testid="stat-points">
              <p className="text-2xl font-black text-foreground">{dashboard.stats.points}</p>
              <p className="text-xs font-bold text-muted-foreground">إجابة صحيحة</p>
            </div>
          </div>
        </div>
        <div className="mt-5 grid gap-x-6 gap-y-4 sm:grid-cols-2">
          {progressItems.map((item) => {
            const percentage = clampPercentage(item.value);
            return (
              <div key={item.key} data-testid={`progress-${item.key}`}>
                <div className="mb-2 flex items-center justify-between text-sm font-bold">
                  <span className="text-foreground">{item.label}</span>
                  <span className="text-muted-foreground">{percentage}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${percentage}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section data-testid="student-paths" className="space-y-3">
        <div>
          <div>
            <p className="text-xs font-black text-primary">مساراتك</p>
            <h2 className="mt-1 text-xl font-black text-foreground">اختر ما تريد إنجازه</h2>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {paths.map((path) => {
            const Icon = path.icon;
            return (
              <Link
                key={path.href}
                href={path.href}
                data-testid={`link-path-${path.href.slice(1).replace("/", "-") || "home"}`}
                className="group flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm transition-colors hover:border-primary/40 hover:bg-primary/5"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-black text-foreground">{path.label}</span>
                  <span className="mt-1 block text-xs text-muted-foreground">{path.detail}</span>
                </span>
                <ChevronLeft className="mr-auto h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              </Link>
            );
          })}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
        <div className="space-y-6">
          <section data-testid="section-recent-tests" className="rounded-3xl border border-border bg-card p-5 shadow-sm md:p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-black text-primary">سجل التدريب</p>
                <h2 className="mt-1 text-lg font-black text-foreground">الاختبارات الأخيرة</h2>
              </div>
              <Link href="/computerized" data-testid="link-all-tests" className="text-xs font-black text-muted-foreground hover:text-foreground">
                عرض الكل
              </Link>
            </div>
            {recentTests.length > 0 ? (
              <div className="space-y-2">
                {recentTests.slice(0, 4).map((test) => (
                  <div key={test.id} data-testid={`row-recent-test-${test.id}`} className="flex items-center justify-between gap-4 rounded-2xl border border-border/70 p-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                        <FileText className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-foreground">{test.title}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {new Date(test.date).toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric" })}
                        </p>
                      </div>
                    </div>
                    <span className="shrink-0 rounded-lg bg-primary/10 px-3 py-1 text-sm font-black text-primary">{test.score}%</span>
                  </div>
                ))}
              </div>
            ) : (
              <div data-testid="empty-recent-tests" className="rounded-2xl border border-dashed border-border p-7 text-center">
                <FileText className="mx-auto h-8 w-8 text-muted-foreground" aria-hidden="true" />
                <p className="mt-3 font-black text-foreground">لا توجد اختبارات مكتملة بعد</p>
                <p className="mt-1 text-sm text-muted-foreground">ابدأ من مهمة اليوم وسنحفظ نتائجك هنا.</p>
              </div>
            )}
          </section>

          <details data-testid="details-official-scores" className="group rounded-3xl border border-border bg-card shadow-sm">
            <summary className="flex cursor-pointer list-none items-center gap-3 p-5 font-black text-foreground [&::-webkit-details-marker]:hidden">
              <Target className="h-5 w-5 text-primary" aria-hidden="true" />
              <span className="flex-1">نتيجتي الرسمية</span>
              <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden="true" />
            </summary>
            <div className="border-t border-border p-4 sm:p-5">
              <OfficialScoreCard scores={dashboard.officialScores} />
            </div>
          </details>
        </div>

        <aside className="space-y-6">
          <section data-testid="section-exam-date" className="rounded-3xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" aria-hidden="true" />
              <h2 className="font-black text-foreground">موعد الاختبار</h2>
            </div>
            {dashboard.upcomingExam.date ? (
              <div className="mt-5">
                <p data-testid="text-exam-date" className="text-2xl font-black text-foreground">
                  {new Date(dashboard.upcomingExam.date).toLocaleDateString("ar-SA", { day: "numeric", month: "long" })}
                </p>
                <p className="mt-1 text-sm font-bold text-muted-foreground">{daysToExam} يومًا متبقيًا</p>
              </div>
            ) : (
              <p data-testid="status-no-exam-date" className="mt-4 text-sm leading-7 text-muted-foreground">لم تحدد موعد اختبارك بعد.</p>
            )}
            <Dialog open={isExamDialogOpen} onOpenChange={setIsExamDialogOpen}>
              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                <DialogTrigger asChild>
                  <Button type="button" data-testid="button-edit-exam-date" onClick={handleOpenExamDialog} variant="outline" className="w-full rounded-xl font-black">
                    {dashboard.upcomingExam.date ? "تعديل الموعد" : "حدد الموعد"}
                  </Button>
                </DialogTrigger>
                <Link
                  href="/book-exam"
                  data-testid="link-book-simulation"
                  className="inline-flex min-h-10 items-center justify-center rounded-xl bg-primary px-3 text-sm font-black text-primary-foreground hover:bg-primary/90"
                >
                  حجز محاكاة
                </Link>
              </div>
              <DialogContent className="rounded-2xl sm:max-w-md" dir="rtl">
                <DialogHeader>
                  <DialogTitle className="text-xl font-black">تعديل موعد الاختبار</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <label className="block space-y-2">
                    <span className="text-sm font-bold text-foreground">تاريخ الاختبار</span>
                    <Input data-testid="input-exam-date" type="date" value={examDateStr} onChange={(event) => setExamDateStr(event.target.value)} className="rounded-xl" />
                  </label>
                  <Button
                    type="button"
                    data-testid="button-save-exam-date"
                    onClick={handleSaveExamDate}
                    disabled={!examDateStr || updateExamDate.isPending}
                    className="w-full rounded-xl font-black"
                  >
                    {updateExamDate.isPending ? "جارٍ الحفظ..." : "حفظ الموعد"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </section>

          {weaknesses.length > 0 && (
            <section data-testid="section-weaknesses" className="rounded-3xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" aria-hidden="true" />
                <h2 className="font-black text-foreground">نقاط تحتاج مراجعة</h2>
              </div>
              <div className="mt-5 space-y-4">
                {weaknesses.slice(0, 3).map((weakness, index) => (
                  <div key={`${weakness.topic}-${index}`} data-testid={`weakness-${index}`}>
                    <div className="mb-1 flex justify-between gap-3 text-sm font-bold">
                      <span className="truncate text-foreground">{weakness.topic}</span>
                      <span className="shrink-0 text-muted-foreground">{weakness.errorRate}% خطأ</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-amber-500" style={{ width: `${clampPercentage(weakness.errorRate)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <details data-testid="details-account-information" className="group rounded-3xl border border-border bg-card shadow-sm">
            <summary className="flex cursor-pointer list-none items-center gap-3 p-5 font-black text-foreground [&::-webkit-details-marker]:hidden">
              <Award className="h-5 w-5 text-primary" aria-hidden="true" />
              <span className="flex-1">معلومات الحساب</span>
              <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden="true" />
            </summary>
            <div className="space-y-4 border-t border-border px-5 pb-5 pt-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">حالة الاشتراك</span>
                <span data-testid="status-subscription" className="font-black text-foreground">
                  {dashboard.subscription.status === "active"
                    ? `نشط — ${dashboard.subscription.daysLeft} يوم`
                    : dashboard.subscription.status === "trial"
                      ? `تجربة — ${dashboard.trial?.daysLeft || 0} يوم`
                      : "حساب مجاني"}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">المكتبة</span>
                <span data-testid="text-library-counts" className="font-black text-foreground">{dashboard.booksCount} كتب، {dashboard.foldersCount} مجلدات</span>
              </div>
              <Button
                type="button"
                data-testid="button-view-subscription"
                variant="outline"
                onClick={() => setSubscriptionDialogOpen(true)}
                className="w-full rounded-xl font-black"
              >
                عرض تفاصيل الاشتراك
              </Button>
              <Link href={recommendedHref} data-testid="link-recommended-plan" className="flex items-center justify-between rounded-xl bg-muted px-3 py-3 text-sm font-bold text-foreground hover:bg-primary/10">
                <span>
                  <span className="block text-xs text-muted-foreground">الخطة المقترحة</span>
                  <span className="mt-1 block">{dashboard.recommendedPlan.title}</span>
                </span>
                <ChevronLeft className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              </Link>
            </div>
          </details>

          <details data-testid="details-more-links" className="group rounded-3xl border border-border bg-card shadow-sm">
            <summary className="flex cursor-pointer list-none items-center gap-3 p-5 font-black text-foreground [&::-webkit-details-marker]:hidden">
              <Route className="h-5 w-5 text-primary" aria-hidden="true" />
              <span className="flex-1">روابط إضافية</span>
              <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden="true" />
            </summary>
            <div className="grid gap-2 border-t border-border p-4">
              {[
                { href: "/books", label: "كتبي" },
                { href: "/folders", label: "مجلداتي" },
                { href: "/support", label: "الدعم والمساعدة" },
                { href: "/notifications", label: "التحديثات" },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  data-testid={`link-extra-${item.href.slice(1)}`}
                  className="rounded-xl px-3 py-2 text-sm font-bold text-foreground hover:bg-muted"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </details>
        </aside>
      </div>

      <SubscriptionRenewalDialog open={subscriptionDialogOpen} onOpenChange={setSubscriptionDialogOpen} user={user} />
    </div>
  );
}