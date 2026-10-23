import { useEffect, useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  Brain,
  Calendar,
  ChevronDown,
  ClipboardCheck,
  FileText,
  RefreshCw,
  Route,
  Target,
} from "lucide-react";
import {
  useStudentDashboard,
  useStudentLearningRecommendations,
  useTodayLearningSession,
  useLearningContentProgressSummary,
  useUpdateExamDate,
} from "@/hooks/use-student";
import OfficialScoreCard from "@/components/student/OfficialScoreCard";
import StudentDashboardProgressOverview from "@/components/student/StudentDashboardProgressOverview";
import { useUser } from "@/hooks/use-user";
import InstitutionMembershipCard from "@/components/institution/InstitutionMembershipCard";
import InstitutionAssignmentsCard from "@/components/institution/InstitutionAssignmentsCard";
import { DashboardGuideFilm } from "@/components/student/DashboardGuideFilm";
import { StudentQuestionContributionButton } from "@/components/student/StudentQuestionContributionButton";
import { NewStudentWelcome } from "@/components/student/NewStudentWelcome";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AdaptiveLearningCoach from "@/components/student/AdaptiveLearningCoach";
import useSubscription from "@/hooks/useSubscription";
import { getGetStudentCourseQueryKey, useGetStudentCourse } from "@workspace/api-client-react";
import { foundationHrefForScope, todayLearningHref } from "@/lib/foundationRoutes.mjs";
import {
  buildStudentDashboardJourney,
  buildStudentDashboardTasks,
  buildStudentDashboardTrend,
  type StudentDashboardProgram,
} from "@/lib/studentDashboardProgress";

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
      </div>
      <div className="h-56 animate-pulse rounded-3xl bg-muted" />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="h-48 animate-pulse rounded-3xl bg-muted" />
        <div className="h-48 animate-pulse rounded-3xl bg-muted" />
      </div>
    </div>
  );
}

function QuestionProgressLibraryCard() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["student-question-progress"],
    queryFn: async () => {
      const response = await fetch("/api/student/question-progress", { credentials: "include" });
      if (!response.ok) throw new Error("تعذر تحميل تقدم الأسئلة");
      return response.json() as Promise<{ total: number; mastered: number; review: number; unseen: number }>;
    },
    staleTime: 60_000,
  });

  return (
    <section className="rounded-2xl border border-border bg-card p-4" dir="rtl" aria-label="مكتبة الأسئلة الشخصية">
      <h3 className="font-black text-foreground">مكتبة أسئلتك</h3>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">تُحفظ الإجابات وتعود الأسئلة التي تحتاج مراجعة.</p>
      {isError ? (
        <p className="mt-3 text-sm text-muted-foreground">تعذر تحميل الأرقام الآن؛ مكتبة الأسئلة متاحة دونها.</p>
      ) : (
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          {[
            ["إجابة صحيحة", data?.mastered],
            ["تحتاج مراجعة", data?.review],
            ["أسئلة جديدة", data?.unseen],
          ].map(([label, value]) => (
            <div key={String(label)} className="rounded-xl bg-muted/60 p-3">
              <strong className="block text-lg font-black text-foreground">{isLoading ? "—" : value ?? 0}</strong>
              <span className="text-xs font-bold text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
      )}
      <Link href="/records" data-testid="link-question-library-records" className="mt-4 inline-flex items-center gap-2 text-sm font-black text-primary hover:underline">
        تقاريرك وتفاصيل الإجابات <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      </Link>
    </section>
  );
}

export default function DashboardPage() {
  const { user, isLoading: isUserLoading } = useUser();
  const { subscription, isLoading: isSubscriptionLoading } = useSubscription();
  const isStudent = user?.role === "student";
  const dashboardQuery = useStudentDashboard(isStudent);
  const { data: dashboard, isLoading, isError, error, refetch: refetchDashboard } = dashboardQuery;
  const dailyGoalQuery = useQuery<{ verifiedStudyDays?: number; streak?: { current?: number } }>({
    queryKey: ["/api/daily-goal"],
    queryFn: async () => {
      const response = await fetch("/api/daily-goal", { credentials: "include" });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.error || "تعذر تحميل أيام التدريب");
      return body as { verifiedStudyDays?: number; streak?: { current?: number } };
    },
    enabled: isStudent && !isUserLoading && !isSubscriptionLoading && !subscription?.isExpired,
    staleTime: 60_000,
  });
  const [activeProgram, setActiveProgram] = useState<StudentDashboardProgram>("qudrat");
  useEffect(() => {
    const suggestedProgram = dashboard?.recommendedPlan?.program;
    if (suggestedProgram === "qudrat" || suggestedProgram === "tahsili") {
      setActiveProgram(suggestedProgram);
    }
  }, [dashboard?.recommendedPlan?.program]);
  const journeyProgram = activeProgram;
  const journeySubjectId = dashboard?.recommendedPlan?.program === activeProgram
    ? dashboard.recommendedPlan.subjectId
    : undefined;
  const hasJourneyScope = isStudent && Boolean(dashboard) && !subscription?.isExpired;
  const foundationProgress = useLearningContentProgressSummary(journeyProgram, journeySubjectId, hasJourneyScope);
  const todayLearning = useTodayLearningSession(hasJourneyScope, journeyProgram, journeySubjectId);
  const recommendations = useStudentLearningRecommendations(hasJourneyScope, journeyProgram);
  const courseQuery = useGetStudentCourse({
    query: { queryKey: getGetStudentCourseQueryKey(), staleTime: 30000, enabled: hasJourneyScope },
  });
  const updateExamDate = useUpdateExamDate();
  const [examDateStr, setExamDateStr] = useState("");
  const [isExamDialogOpen, setIsExamDialogOpen] = useState(false);

  if (isUserLoading || (isStudent && (isLoading || isSubscriptionLoading))) return <DashboardSkeleton />;

  if (!user) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center p-6 text-center" dir="rtl">
        <AlertTriangle className="mb-4 h-12 w-12 text-amber-600" aria-hidden="true" />
        <h2 className="text-xl font-black text-foreground">انتهت جلسة تسجيل الدخول</h2>
        <p className="mt-2 text-muted-foreground">سجّل الدخول من جديد للوصول إلى لوحة التحكم.</p>
        <Link href="/login" data-testid="link-login" className="mt-5 rounded-xl px-4 py-2 font-black text-primary hover:bg-primary/10">تسجيل الدخول</Link>
      </div>
    );
  }

  if (!isStudent) {
    const accountHref = user.role === "parent" ? "/parent-dashboard" : user.role === "institution_admin" ? "/institution" : user.role === "teacher" ? "/teacher" : "/";
    return (
      <div className="flex min-h-full flex-col items-center justify-center p-6 text-center" dir="rtl">
        <AlertTriangle className="mb-4 h-12 w-12 text-amber-600" aria-hidden="true" />
        <h2 className="text-xl font-black text-foreground">هذه ليست لوحة حسابك</h2>
        <p className="mt-2 text-muted-foreground">افتح المساحة المناسبة لنوع حسابك.</p>
        <Link href={accountHref} data-testid="link-account-space" className="mt-5 rounded-xl px-4 py-2 font-black text-primary hover:bg-primary/10">فتح لوحة حسابي</Link>
      </div>
    );
  }

  if (isError || !dashboard) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center p-6 text-center" dir="rtl">
        <AlertTriangle className="mb-4 h-12 w-12 text-rose-600" aria-hidden="true" />
        <h2 className="text-xl font-black text-foreground">تعذر تحميل لوحتك</h2>
        <p className="mt-2 max-w-md text-sm leading-7 text-muted-foreground">{error instanceof Error ? error.message : "حدث خطأ مؤقت. حاول تحميل البيانات من جديد."}</p>
        <Button type="button" data-testid="button-retry-dashboard" onClick={() => refetchDashboard()} className="mt-5 rounded-xl font-black">
          <RefreshCw className="ml-2 h-4 w-4" aria-hidden="true" /> إعادة المحاولة
        </Button>
      </div>
    );
  }

  const userName = user.fullName || user.name || user.username || "طالب";
  const recentTests = dashboard.recentTests ?? [];
  const course = courseQuery.data?.course ?? null;
  const isNewStudent = !courseQuery.isLoading && !courseQuery.isError &&
    recentTests.length === 0 && (dashboard.stats.totalTests ?? 0) === 0 && (!course || course.level === "unassessed");
  const todayPlan = todayLearning.data?.plan;
  const matchingRecommendation = recommendations.data?.recommendations?.find((item) =>
    !journeySubjectId || item.subjectId === journeySubjectId
  );
  const planProgram: StudentDashboardProgram = String(todayPlan?.programId || "")
    .toLowerCase()
    .split(/[.:]/)
    .includes("tahsili")
    ? "tahsili"
    : journeyProgram;
  const planSubjectId = todayPlan?.subjectId || (planProgram === "tahsili" ? undefined : journeySubjectId);
  const foundationHref = foundationHrefForScope(planProgram, planSubjectId);
  const diagnosticHref = planProgram === "tahsili"
    ? "/foundation?program=tahsili"
    : "/foundation?program=qudrat&reassess=1&returnTo=preparation";
  const sessionHref = todayLearningHref(planProgram, planSubjectId);
  const planStatus = todayPlan?.planStatus;
  const diagnosticRequired = planStatus === "DIAGNOSTIC_REQUIRED"
    || (!todayPlan && planProgram === "qudrat" && course?.level === "unassessed");
  const sessionAvailable = planStatus === "READY";
  const saudiToday = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Riyadh" }).format(new Date());
  const dueTask = planProgram === "qudrat" && course && course.level !== "unassessed"
    ? course.days.filter((day) => day.date.slice(0, 10) <= saudiToday)
      .flatMap((day) => day.tasks.map((task) => ({ task, day: day.day })))
      .find(({ task }) => task.status === "pending")
    : undefined;
  const programTests = recentTests.filter((test) => test.program === activeProgram);
  const reviewResult = programTests.find((test) => test.weakAreas.length > 0);
  const reviewTopics = [...new Set((reviewResult?.weakAreas || []).map((topic) => topic.trim()).filter(Boolean))];
  const taskLoading = todayLearning.isLoading
    || recommendations.isLoading
    || (planProgram === "qudrat" && courseQuery.isLoading);
  const taskSourcesUnavailable = todayLearning.isError
    && recommendations.isError
    && (planProgram !== "qudrat" || courseQuery.isError)
    && !reviewResult;
  const tasks = buildStudentDashboardTasks({
    diagnosticRequired,
    diagnosticTitle: planProgram === "tahsili" ? "ابدأ تقييم التحصيلي" : "ابدأ تقييم القدرات",
    diagnosticHref,
    session: sessionAvailable && todayPlan
      ? {
          title: todayPlan.title,
          programId: todayPlan.programId,
          sessionReason: todayPlan.sessionReason,
          state: todayPlan.state,
          started: Boolean(todayLearning.data?.started),
          estimatedMinutes: todayPlan.estimatedMinutes,
          steps: todayPlan.steps.map((step) => ({ stepType: step.stepType, status: step.status })),
        }
      : null,
    sessionHref,
    recommendation: matchingRecommendation?.title
      ? {
          title: matchingRecommendation.title,
          reason: matchingRecommendation.reason,
          href: foundationHref,
          estimatedMinutes: matchingRecommendation.estimatedMinutes,
        }
      : null,
    scheduledTask: planProgram === "qudrat" && dueTask
      ? {
          title: dueTask.task.title,
          reason: dueTask.task.reason || `مهمة اليوم ${dueTask.day} وفق خطة الدراسة المحفوظة.`,
          href: "/foundation?program=qudrat&view=plan",
          estimatedMinutes: dueTask.task.minutes,
          status: dueTask.task.status,
        }
      : null,
    review: reviewResult
      ? { topics: reviewTopics, testTitle: reviewResult.title, href: "/records" }
      : null,
  });
  const tasksState = taskLoading
    ? "loading" as const
    : taskSourcesUnavailable
      ? "unavailable" as const
      : "ready" as const;
  const foundationTotal = typeof foundationProgress.data?.total === "number"
    ? foundationProgress.data.total
    : null;
  const foundationCompleted = typeof foundationProgress.data?.completed === "number"
    ? foundationProgress.data.completed
    : null;
  const stages = buildStudentDashboardJourney({
    program: activeProgram,
    foundation: {
      loaded: dashboard.metricsAvailable !== false && !foundationProgress.isLoading && !foundationProgress.isError,
      total: foundationTotal,
      completed: foundationCompleted,
    },
    testEvidence: dashboard.testTypeEvidence ?? [],
    reviewTopics,
    session: sessionAvailable && todayPlan
      ? {
          title: todayPlan.title,
          programId: todayPlan.programId,
          started: Boolean(todayLearning.data?.started),
          state: todayPlan.state,
          steps: todayPlan.steps.map((step) => ({ stepType: step.stepType, status: step.status })),
        }
      : null,
    links: {
      foundation: foundationHrefForScope(activeProgram, journeySubjectId),
      training: "/training",
      simulation: activeProgram === "tahsili" ? "/tahsilik/tests" : "/qiyas",
      analysis: "/records",
      remediation: todayLearningHref(activeProgram, journeySubjectId),
    },
  });
  const trendPoints = buildStudentDashboardTrend(recentTests, activeProgram);
  const trendState = dashboardQuery.isError || dashboard.metricsAvailable === false
    ? "error" as const
    : dashboardQuery.isLoading || dashboardQuery.isFetching
      ? "loading" as const
      : trendPoints.length >= 2
        ? "ready" as const
        : trendPoints.length === 1
          ? "insufficient" as const
          : "empty" as const;
  const metricsState = dashboardQuery.isLoading || dashboardQuery.isFetching
    || dailyGoalQuery.isLoading || dailyGoalQuery.isFetching
    ? "loading" as const
    : dashboard.metricsAvailable === false
      ? "unavailable" as const
      : "ready" as const;
  const verifiedStudyDays = dailyGoalQuery.isError
    || !Number.isFinite(Number(dailyGoalQuery.data?.verifiedStudyDays))
    ? null
    : Math.max(0, Number(dailyGoalQuery.data?.verifiedStudyDays));
  const currentGoalStreak = dailyGoalQuery.isError
    || !Number.isFinite(Number(dailyGoalQuery.data?.streak?.current))
    ? null
    : Math.max(0, Number(dailyGoalQuery.data?.streak?.current));
  const daysToExam = dashboard.upcomingExam.date
    ? Math.max(0, Math.ceil((new Date(dashboard.upcomingExam.date).getTime() - Date.now()) / 86400000))
    : null;

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

  if (subscription?.isExpired) {
    return (
      <main className="mx-auto w-full max-w-5xl space-y-5 p-5 md:p-8" dir="rtl">
        <header><p className="text-sm font-bold text-muted-foreground">مرحبًا،</p><h1 data-testid="text-student-name" className="text-3xl font-black text-foreground">{userName}</h1></header>
        <section className="rounded-3xl border border-border bg-card p-6">
          <h2 className="text-xl font-black">تابع رحلتك</h2>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">يمكنك متابعة نتائجك ومراجعة المكتبة، أو معرفة خيارات الاشتراك.</p>
          <Link href="/subscription" data-testid="link-expired-subscription" className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-primary px-5 font-black text-primary-foreground">خيارات الاشتراك</Link>
        </section>
        <QuestionProgressLibraryCard />
        <InstitutionMembershipCard />
        <Link href="/records" data-testid="link-my-results" className="block rounded-2xl border border-border bg-card p-5 font-black text-foreground">نتائجي المحفوظة</Link>
        <details className="group rounded-2xl border border-border bg-card p-4">
          <summary data-testid="summary-expired-tools" className="cursor-pointer list-none font-black">مساعدة وأدوات إضافية <ChevronDown className="inline h-4 w-4" /></summary>
          <div className="mt-4 space-y-4">
            <DashboardGuideFilm studentId={user.id ?? user._id} displayName={userName} />
            <InstitutionAssignmentsCard />
            <StudentQuestionContributionButton />
            <AdaptiveLearningCoach trialExpired />
            <Link href="/account" data-testid="link-expired-account" className="block rounded-xl border border-border p-3 text-sm font-black">حسابي وإعداداته</Link>
          </div>
        </details>
      </main>
    );
  }

  if (isNewStudent) {
    return (
      <main className="mx-auto w-full max-w-5xl space-y-5 p-5 pb-10 md:p-8" dir="rtl">
        <NewStudentWelcome studentName={userName} program={activeProgram} />
        <StudentDashboardProgressOverview
          metricsState={metricsState}
          metrics={{
            studySeconds: dashboard.stats.studySeconds,
            completedTests: dashboard.stats.totalTests,
            verifiedStudyDays,
            currentGoalStreak,
          }}
          program={activeProgram}
          onProgramChange={setActiveProgram}
          stages={stages}
          tasks={tasks}
          tasksState={tasksState}
          trendState={trendState}
          trendPoints={trendPoints}
        />
        <details data-testid="details-new-student-support" className="group rounded-2xl border border-border bg-card">
          <summary className="flex cursor-pointer list-none items-center gap-3 p-4 font-black text-foreground">
            <span className="flex-1">أدوات ومعلومات إضافية</span><ChevronDown className="h-4 w-4 text-muted-foreground group-open:rotate-180" />
          </summary>
          <div className="space-y-4 border-t border-border p-4">
            <DashboardGuideFilm studentId={user.id ?? user._id} displayName={userName} />
            <QuestionProgressLibraryCard />
            <InstitutionMembershipCard />
            <InstitutionAssignmentsCard />
            <StudentQuestionContributionButton />
            <Link href="/account" data-testid="link-new-student-account" className="block rounded-xl border border-border p-3 text-sm font-black">حسابي</Link>
          </div>
        </details>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 p-5 pb-10 md:p-8" dir="rtl">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-muted-foreground">{new Date().getHours() < 17 ? "مرحبًا" : "مساء الخير"}،</p>
          <h1 data-testid="text-student-name" className="mt-1 text-3xl font-black tracking-tight text-foreground md:text-4xl">{userName}</h1>
          <p className="mt-2 text-sm text-muted-foreground">استعدادك يبدأ من الخطوة المناسبة الآن.</p>
        </div>
        <Link href="/records" data-testid="link-dashboard-records" className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-border bg-card px-3 text-sm font-bold text-foreground hover:bg-muted">
          <FileText className="h-4 w-4" aria-hidden="true" /> نتائجي
        </Link>
      </header>

      <StudentDashboardProgressOverview
        metricsState={metricsState}
        metrics={{
          studySeconds: dashboard.stats.studySeconds,
          completedTests: dashboard.stats.totalTests,
          verifiedStudyDays,
          currentGoalStreak,
        }}
        program={activeProgram}
        onProgramChange={setActiveProgram}
        stages={stages}
        tasks={tasks}
        tasksState={tasksState}
        trendState={trendState}
        trendPoints={trendPoints}
      />

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-2"><Calendar className="h-5 w-5 text-primary" /><h2 className="font-black text-foreground">موعد الاختبار</h2></div>
          {dashboard.upcomingExam.date ? (
            <div className="mt-4"><p data-testid="text-exam-date" className="text-2xl font-black text-foreground">{new Date(dashboard.upcomingExam.date).toLocaleDateString("ar-SA", { day: "numeric", month: "long" })}</p><p className="mt-1 text-sm text-muted-foreground">{daysToExam} يومًا متبقيًا</p></div>
          ) : <p data-testid="status-no-exam-date" className="mt-3 text-sm text-muted-foreground">لم تحدد موعدًا بعد.</p>}
          <Dialog open={isExamDialogOpen} onOpenChange={setIsExamDialogOpen}>
            <div className="mt-4 flex flex-wrap gap-2">
              <DialogTrigger asChild><Button type="button" data-testid="button-edit-exam-date" onClick={handleOpenExamDialog} variant="outline" className="rounded-xl">{dashboard.upcomingExam.date ? "تعديل الموعد" : "تحديد موعد"}</Button></DialogTrigger>
              <Link href="/book-exam" data-testid="link-book-simulation" className="inline-flex min-h-10 items-center rounded-xl px-3 text-sm font-bold text-primary hover:bg-primary/5">حجز محاكاة</Link>
            </div>
            <DialogContent className="rounded-2xl sm:max-w-md" dir="rtl">
              <DialogHeader><DialogTitle className="text-xl font-black">موعد الاختبار</DialogTitle></DialogHeader>
              <div className="space-y-4 py-4">
                <label className="block space-y-2"><span className="text-sm font-bold text-foreground">تاريخ الاختبار</span><Input data-testid="input-exam-date" type="date" value={examDateStr} onChange={(event) => setExamDateStr(event.target.value)} className="rounded-xl" /></label>
                <Button type="button" data-testid="button-save-exam-date" onClick={handleSaveExamDate} disabled={!examDateStr || updateExamDate.isPending} className="w-full rounded-xl font-black">{updateExamDate.isPending ? "جارٍ الحفظ..." : "حفظ الموعد"}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-2"><Brain className="h-5 w-5 text-primary" /><h2 className="font-black text-foreground">مجالات للمراجعة في {activeProgram === "tahsili" ? "التحصيلي" : "القدرات"}</h2></div>
          {reviewTopics.length ? (
            <ul className="mt-4 space-y-2">
              {reviewTopics.slice(0, 3).map((topic, index) => <li key={`${topic}-${index}`} data-testid={`weakness-${index}`} className="flex items-center gap-3 rounded-xl bg-muted/50 p-3 text-sm font-bold text-foreground"><span className="h-2 w-2 shrink-0 rounded-full bg-primary" />{topic}</li>)}
            </ul>
          ) : <p data-testid="empty-weaknesses" className="mt-3 text-sm leading-6 text-muted-foreground">ستظهر هنا الموضوعات التي تحتاج مراجعة عندما تتوفر بياناتها.</p>}
          <Link href="/records" data-testid="link-review-training" className="mt-4 inline-flex items-center gap-2 text-sm font-black text-primary">راجع النتائج المحفوظة <ArrowLeft className="h-4 w-4" /></Link>
        </div>
      </section>

      <section data-testid="section-recent-tests" className="rounded-2xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center justify-between"><div><p className="text-xs font-black text-primary">سجل التدريب</p><h2 className="mt-1 text-lg font-black text-foreground">آخر الاختبارات</h2></div><Link href="/records" data-testid="link-all-tests" className="text-sm font-black text-primary">كل النتائج</Link></div>
        {programTests.length ? (
          <div className="space-y-2">{programTests.slice(0, 3).map((test) => (
            <div key={test.id} data-testid={`row-recent-test-${test.id}`} className="flex items-center justify-between gap-4 rounded-xl border border-border/70 p-3">
              <div className="flex min-w-0 items-center gap-3"><FileText className="h-4 w-4 shrink-0 text-muted-foreground" /><div className="min-w-0"><p className="truncate text-sm font-bold text-foreground">{test.title}</p><p className="mt-1 text-xs text-muted-foreground">{test.date ? new Date(test.date).toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric" }) : "التاريخ غير متاح"}</p></div></div>
              <span className="shrink-0 rounded-lg bg-primary/10 px-3 py-1 text-sm font-black text-primary">{test.score === null ? "غير متاح" : `${test.score}%`}</span>
            </div>
          ))}</div>
        ) : <p data-testid="empty-recent-tests" className="rounded-xl border border-dashed border-border p-5 text-center text-sm text-muted-foreground">لا توجد نتائج محفوظة في هذا المسار بعد.</p>}
      </section>

      <details data-testid="details-additional-tools" className="group rounded-2xl border border-border bg-card">
          <summary data-testid="summary-additional-tools" className="flex cursor-pointer list-none items-center gap-3 p-4 font-black text-foreground [&::-webkit-details-marker]:hidden">
          <Route className="h-5 w-5 text-primary" aria-hidden="true" /><span className="flex-1">أدواتك ومعلوماتك الأخرى</span><ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden="true" />
        </summary>
        <div className="space-y-4 border-t border-border p-4">
          <div className="grid gap-2 sm:grid-cols-2">
            <Link href="/foundation" data-testid="link-extra-foundation" className="flex items-center gap-2 rounded-xl border border-border p-3 text-sm font-bold"><BookOpen className="h-4 w-4 text-primary" />التأسيس وخطة الاستعداد</Link>
            <Link href="/training" data-testid="link-extra-training" className="flex items-center gap-2 rounded-xl border border-border p-3 text-sm font-bold"><ClipboardCheck className="h-4 w-4 text-primary" />مركز التدريب</Link>
            <Link href="/account" data-testid="link-extra-account" className="flex items-center gap-2 rounded-xl border border-border p-3 text-sm font-bold"><Target className="h-4 w-4 text-primary" />حسابي وإعداداته</Link>
            <Link href="/records" data-testid="link-extra-records" className="flex items-center gap-2 rounded-xl border border-border p-3 text-sm font-bold"><FileText className="h-4 w-4 text-primary" />النتائج المحفوظة</Link>
          </div>
          <details className="group rounded-xl border border-border">
            <summary data-testid="summary-support-tools" className="flex cursor-pointer list-none items-center gap-3 p-3 text-sm font-bold"><span className="flex-1">معلومات ومساندة</span><ChevronDown className="h-4 w-4 group-open:rotate-180" /></summary>
            <div className="space-y-4 border-t border-border p-3">
              <DashboardGuideFilm studentId={user.id ?? user._id} displayName={userName} />
              <QuestionProgressLibraryCard />
              <InstitutionMembershipCard />
              <InstitutionAssignmentsCard />
              <StudentQuestionContributionButton />
              <AdaptiveLearningCoach />
              <div className="grid gap-2 sm:grid-cols-2">
                {[
                  { href: "/books", label: "كتبي" },
                  { href: "/folders", label: "مجلداتي" },
                  { href: "/support", label: "الدعم والمساعدة" },
                  { href: "/notifications", label: "التحديثات" },
                ].map((item) => <Link key={item.href} href={item.href} data-testid={`link-extra-${item.href.slice(1)}`} className="rounded-xl px-3 py-2 text-sm font-bold hover:bg-muted">{item.label}</Link>)}
              </div>
              <button type="button" data-testid="button-open-all-student-pages" onClick={() => window.dispatchEvent(new Event("qodratak:open-student-pages"))} className="flex min-h-11 w-full items-center justify-between rounded-xl border border-primary/20 bg-primary/5 px-3 text-right text-sm font-black text-primary hover:bg-primary/10">
                عرض كل صفحات المنصة <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </details>
        </div>
      </details>

      <details data-testid="details-official-scores" className="group rounded-2xl border border-border bg-card">
        <summary data-testid="summary-official-score" className="flex cursor-pointer list-none items-center gap-3 p-4 font-black text-foreground [&::-webkit-details-marker]:hidden"><Target className="h-5 w-5 text-primary" /><span className="flex-1">النتيجة الرسمية</span><ChevronDown className="h-4 w-4 text-muted-foreground group-open:rotate-180" /></summary>
        <div className="border-t border-border p-4"><OfficialScoreCard scores={dashboard.officialScores} /></div>
      </details>
    </main>
  );
}
