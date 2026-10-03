import React, { useEffect, useMemo, useState } from "react";
import {
  FoundationContent,
  FoundationDiagnostic,
  FoundationDiagnosticQuestion,
  FoundationLearningPath,
  FoundationLearningState,
  StudentDashboard,
  useFoundationContent,
  useFoundationLearningPath,
  useFoundationLearningState,
  useLearningContentProgressSummary,
  useStartFoundationDiagnostic,
  useStudentDashboard,
  useSubmitFoundationDiagnostic,
} from "@/hooks/use-student";
import { foundationSections, getFoundationSection, type FoundationProgram, type FoundationSection } from "@/data/foundationSections";
import { foundationCurriculum } from "@/data/foundationCurriculum";
import { Link, useLocation, useSearch } from "wouter";
import { ArrowLeft, BarChart3, BookOpen, CheckCircle2, Clock, FileText, GraduationCap, Info, ListChecks, Loader2, PlayCircle, Route, ShieldCheck, Target, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import OfficialScoreCard from "@/components/student/OfficialScoreCard";
import { getVideoEmbedUrl } from "@/lib/video";
import {
  isDirectFoundationVideo,
  resolveFoundationAssetUrl,
  resolveFoundationVideoUrl,
} from "@/lib/foundationVideoUrl";
import { getQuestionImageUrls } from "@/lib/questionImages";
import { StudentWorkflow, workflowStageForLevel, type WorkflowStage } from "@/components/student/StudentWorkflow";

function ProgressBar({ value, className = "" }: { value: number; className?: string }) {
  const safeValue = Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 0;
  return <Progress value={safeValue} className={`h-2.5 ${className}`} />;
}

function isFoundationLearningPath(value: unknown): value is FoundationLearningPath {
  if (!value || typeof value !== "object") return false;

  const path = value as Record<string, unknown>;
  const coverage = path.coverage;
  if (!Array.isArray(path.recommendations) || !coverage || typeof coverage !== "object") return false;

  const coverageRecord = coverage as Record<string, unknown>;
  const hasValidCoverage = ["covered", "total", "remaining", "percent"].every(
    (key) => typeof coverageRecord[key] === "number" && Number.isFinite(coverageRecord[key]),
  );
  const hasValidRecommendations = path.recommendations.every((entry) => {
    if (!entry || typeof entry !== "object") return false;
    const recommendation = entry as Record<string, unknown>;
    return typeof recommendation.skillKey === "string"
      && typeof recommendation.title === "string"
      && typeof recommendation.reason === "string"
      && typeof recommendation.confidence === "number"
      && Number.isFinite(recommendation.confidence)
      && typeof recommendation.predictedCorrectProbability === "number"
      && Number.isFinite(recommendation.predictedCorrectProbability);
  });

  return hasValidCoverage && hasValidRecommendations;
}

function FoundationPageErrorFallback() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center gap-4 p-6 text-center" dir="rtl">
      <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-6">
        <h1 className="text-xl font-black text-foreground">تعذر فتح صفحة التأسيس</h1>
        <p className="mt-2 text-sm leading-7 text-muted-foreground">
          لم تُحذف بياناتك. أعد تحميل الصفحة، أو ارجع إلى لوحة الطالب وحاول مرة أخرى.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <Button type="button" className="rounded-xl" onClick={() => window.location.reload()}>
            إعادة المحاولة
          </Button>
          <Button type="button" variant="outline" className="rounded-xl" onClick={() => window.location.assign(import.meta.env.BASE_URL)}>
            لوحة الطالب
          </Button>
        </div>
      </div>
    </div>
  );
}

function DashboardProgressCard({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string;
  value: number;
  detail: string;
  icon: typeof Target;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-black text-foreground">{value}%</p>
        </div>
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <ProgressBar value={value} className="mt-4" />
      <p className="mt-2 text-xs text-muted-foreground">{detail}</p>
    </div>
  );
}

function FoundationDiagnosticDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [diagnostic, setDiagnostic] = useState<FoundationDiagnostic | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<{ percentage: number; correctAnswers: number; totalQuestions: number; skippedQuestions: number } | null>(null);
  const startDiagnostic = useStartFoundationDiagnostic();
  const submitDiagnostic = useSubmitFoundationDiagnostic();

  useEffect(() => {
    if (open && !diagnostic && !startDiagnostic.isPending && !startDiagnostic.isSuccess && !startDiagnostic.isError) {
      startDiagnostic.mutate("qudrat", {
        onSuccess: (data) => setDiagnostic(data),
      });
    }
  }, [open, diagnostic, startDiagnostic.isPending, startDiagnostic.isSuccess, startDiagnostic.isError, startDiagnostic.mutate]);

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen) {
      setDiagnostic(null);
      setAnswers({});
      setResult(null);
      startDiagnostic.reset();
      submitDiagnostic.reset();
    }
  };

  const chooseAnswer = (questionId: string, optionIndex: number) => {
    setAnswers((current) => ({ ...current, [questionId]: optionIndex }));
  };

  const submit = () => {
    if (!diagnostic) return;
    submitDiagnostic.mutate({
      attemptId: diagnostic.attemptId,
      answers: Object.entries(answers).map(([questionId, selectedOptionIndex]) => ({ questionId, selectedOptionIndex })),
    }, {
      onSuccess: (data) => setResult(data.result),
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-xl font-black">تقييم البداية — ٨ أسئلة قصيرة</DialogTitle>
        </DialogHeader>
        {startDiagnostic.isPending ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : startDiagnostic.isError ? (
          <div className="rounded-2xl border border-dashed border-destructive/40 bg-destructive/5 p-6 text-center">
            <p className="font-bold text-foreground">{startDiagnostic.error.message}</p>
            <Button type="button" variant="outline" className="mt-4 rounded-xl" onClick={() => startDiagnostic.mutate("qudrat", { onSuccess: setDiagnostic })}>
              حاول مرة أخرى
            </Button>
          </div>
        ) : result ? (
          <div className="rounded-2xl bg-primary/5 p-6 text-center">
            <Trophy className="mx-auto h-10 w-10 text-primary" />
            <p className="mt-3 text-3xl font-black text-foreground">{result.percentage}%</p>
            <p className="mt-2 text-sm text-muted-foreground">
              أجبت عن {result.correctAnswers} من {result.totalQuestions} بشكل صحيح
              {result.skippedQuestions ? `، وتركت ${result.skippedQuestions} دون إجابة.` : "."}
            </p>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">تم بناء ملفك الأولي. ستجد مهمة اليوم وسبب التوصية في صفحة التأسيس.</p>
            <Button type="button" className="mt-5 rounded-xl" onClick={() => onOpenChange(false)}>عرض مهمتي اليوم</Button>
          </div>
        ) : diagnostic ? (
          <div className="space-y-4">
            <p className="rounded-xl bg-muted/60 px-4 py-3 text-sm leading-6 text-muted-foreground">
              لا نبحث عن درجة نهائية هنا. نستخدم إجاباتك لمعرفة المهارة التي تستحق أن تبدأ بها.
            </p>
            {diagnostic.questions.map((question, index) => (
              <DiagnosticQuestionCard
                key={question._id}
                question={question}
                index={index}
                selected={answers[question._id]}
                onSelect={chooseAnswer}
              />
            ))}
            <div className="sticky bottom-0 flex items-center justify-between gap-3 border-t border-border bg-background pt-4">
              <span className="text-xs text-muted-foreground">{Object.keys(answers).length} من {diagnostic.questions.length} مجاب</span>
              <Button type="button" className="rounded-xl font-black" disabled={submitDiagnostic.isPending} onClick={submit}>
                {submitDiagnostic.isPending ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : null}
                حفظ النتيجة وبناء المهمة
              </Button>
            </div>
            {submitDiagnostic.isError && <p className="text-sm font-bold text-destructive">{submitDiagnostic.error.message}</p>}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function DiagnosticQuestionCard({
  question,
  index,
  selected,
  onSelect,
}: {
  question: FoundationDiagnosticQuestion;
  index: number;
  selected?: number;
  onSelect: (questionId: string, optionIndex: number) => void;
}) {
  const questionImages = getQuestionImageUrls(question);
  return (
    <fieldset className="rounded-2xl border border-border bg-card p-4">
      <legend className="px-1 text-sm font-black text-foreground">السؤال {index + 1} · {question.category === "verbal" ? "لفظي" : "كمي"}</legend>
      {questionImages.length ? (
        <div className="mt-2 space-y-2">
          {questionImages.map((imageUrl) => (
            <img key={imageUrl} src={resolveFoundationAssetUrl(imageUrl)} alt={`صورة السؤال ${index + 1}`} className="mx-auto max-h-80 w-auto max-w-full rounded-xl border border-border object-contain" />
          ))}
        </div>
      ) : (
        <p className="mt-2 text-sm font-bold leading-7 text-foreground">{question.text}</p>
      )}
      <p className="mt-1 text-xs text-muted-foreground">{question.subcategory}</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {question.options.map((option, optionIndex) => (
          <button
            key={`${question._id}-${optionIndex}`}
            type="button"
            onClick={() => onSelect(question._id, optionIndex)}
            className={`rounded-xl border px-3 py-3 text-right text-sm transition ${
              selected === optionIndex
                ? "border-primary bg-primary/10 font-black text-primary"
                : "border-border bg-background text-foreground hover:border-primary/50"
            }`}
          >
            <span className="ml-2 inline-flex h-6 w-6 items-center justify-center rounded-lg bg-muted text-xs font-black">{optionIndex + 1}</span>
            {option}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function FoundationQuizCard({ lesson }: { lesson: FoundationContent }) {
  const quiz = lesson.quiz;
  const [, setLocation] = useLocation();

  if (!quiz?.questionIds?.length) return null;

  return (
    <section className="mt-5 rounded-2xl border border-primary/25 bg-primary/5 p-4" dir="rtl">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-primary">
            <ListChecks className="h-4 w-4" />
            <p className="text-xs font-black">اختبار في صفحة مستقلة</p>
          </div>
          <h3 className="mt-1 text-base font-black text-foreground">{quiz.title}</h3>
          <p className="mt-1 text-xs leading-6 text-muted-foreground">
            {quiz.instructions || "أجب عن أسئلة هذا البنك بعد مشاهدة الشرح."}
          </p>
        </div>
        <Button
          type="button"
          className="shrink-0 rounded-xl font-black"
          onClick={() => setLocation(`/foundation/computer-bank-test/${lesson._id}`)}
        >
          ابدأ الاختبار
        </Button>
      </div>
    </section>
  );
}

function JourneyVideo({ lesson }: { lesson: FoundationContent | null }) {
  const videoUrl = lesson?.videoUrl?.trim() || "";
  const isDirectVideo = isDirectFoundationVideo(videoUrl);
  const embedUrl = videoUrl && !isDirectVideo ? getVideoEmbedUrl(videoUrl) : null;

  return (
    <div className="overflow-hidden rounded-2xl bg-[#07111f]">
      {isDirectVideo ? (
        <video
          src={resolveFoundationVideoUrl(videoUrl)}
          title={lesson?.title || "فيديو الدرس"}
          className="aspect-video w-full bg-black object-contain"
          controls
          playsInline
          preload="metadata"
          controlsList="nodownload"
        />
      ) : embedUrl ? (
        <iframe
          src={embedUrl}
          title={lesson?.title || "فيديو الدرس"}
          className="aspect-video w-full"
          allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
          sandbox="allow-scripts allow-same-origin allow-presentation"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      ) : (
        <div className="flex aspect-video flex-col items-center justify-center px-6 text-center text-slate-300">
          <PlayCircle className="h-12 w-12 text-[#F7F775]" />
          <p className="mt-3 text-sm font-black">
            {lesson ? "الفيديو سيظهر هنا عند نشره" : "سيظهر فيديو مهمتك هنا"}
          </p>
          <p className="mt-1 text-xs leading-6 text-slate-400">
            لا تحتاج إلى البحث عنه داخل البنوك؛ سيبقى مرتبطًا بمهمتك الحالية.
          </p>
        </div>
      )}
    </div>
  );
}

function CurrentStageCard({
  stage,
  lesson,
  isLoading,
  title,
  description,
  action,
}: {
  stage: WorkflowStage;
  lesson: FoundationContent | null;
  isLoading: boolean;
  title?: string;
  description?: string;
  action?: { label: string; href: string };
}) {
  const stageCopy: Record<Exclude<WorkflowStage, "foundation">, {
    eyebrow: string;
    title: string;
    description: string;
    href: string;
    action: string;
  }> = {
    skills: {
      eyebrow: "المرحلة الحالية · التدريب المهاري",
      title: "ابدأ تدريبك المحوسب",
      description: "اختر الكمي أو اللفظي، ثم تدرب على المهارة التي حددتها لك الخطة. فيديوهات هذه المرحلة منفصلة عن فيديوهات التأسيس.",
      href: "/computerized",
      action: "فتح التدريب المحوسب",
    },
    banks: {
      eyebrow: "المرحلة الحالية · بنوك الأقسام",
      title: "وسّع تدريبك داخل البنك",
      description: "بعد تثبيت المهارة، انتقل إلى بنك القسم وحل مجموعة أكبر مع مراجعة الأخطاء.",
      href: "/question-bank",
      action: "فتح بنك الأسئلة",
    },
    simulation: {
      eyebrow: "المرحلة الحالية · المحاكاة والاحتراف",
      title: "اختبر مستواك في محاكاة كاملة",
      description: "أنت جاهز لاختبار كامل بوقت وتحليل نتيجة يحدد آخر نقاط التحسين.",
      href: "/qiyas",
      action: "فتح الاختبارات",
    },
  };

  if (stage !== "foundation") {
    const copy = stageCopy[stage];
    return (
      <div className="flex min-h-full flex-col justify-between rounded-3xl bg-[#0D1B2A] p-5 text-white shadow-sm sm:p-6">
        <div>
          <div className="inline-flex rounded-full bg-white/10 px-3 py-1 text-[11px] font-black text-[#F7F775]">
            {copy.eyebrow}
          </div>
          <h2 className="mt-5 text-2xl font-black">{title || copy.title}</h2>
          <p className="mt-3 text-sm leading-7 text-[#CBD5E1]">{description || copy.description}</p>
        </div>
        <Link data-testid="link-current-stage-action" href={action?.href || copy.href} className="mt-8 inline-flex items-center justify-center gap-2 rounded-xl bg-[#F7F775] px-4 py-3 text-sm font-black text-[#0D1B2A]">
          {action?.label || copy.action}
          <ArrowLeft className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-border bg-card p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black text-primary">المرحلة الحالية · فيديو التأسيس</p>
          <h2 className="mt-1 text-xl font-black text-foreground">
            {isLoading ? "نحضر الدرس..." : title || lesson?.title || "أول درس في رحلتك"}
          </h2>
        </div>
        <PlayCircle className="h-6 w-6 shrink-0 text-primary" />
      </div>
      <JourneyVideo lesson={lesson} />
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-6 text-muted-foreground">
          {description || lesson?.description || "بعد المشاهدة انتقل إلى التدريب ثم اختبار التثبيت من نفس الدرس."}
        </p>
        <Link data-testid="link-current-stage-action" href={action?.href || "/foundation?program=qudrat&subject=verbal"} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-black text-primary-foreground">
          {action?.label || "فتح درس التأسيس"}
          <ArrowLeft className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

function JourneyStep({
  number,
  title,
  description,
  href,
  state,
}: {
  number: number;
  title: string;
  description: string;
  href?: string;
  state: "current" | "open" | "locked";
}) {
  const content = (
    <div
      className={`relative rounded-2xl border p-4 transition ${
        state === "current"
          ? "border-primary bg-primary/5 shadow-sm"
          : state === "open"
            ? "border-border bg-card hover:border-primary/40 hover:shadow-sm"
            : "border-border/70 bg-muted/30 opacity-65"
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-black ${
            state === "current"
              ? "bg-primary text-primary-foreground"
              : state === "open"
                ? "bg-primary/10 text-primary"
                : "bg-muted text-muted-foreground"
          }`}
        >
          {number}
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-black text-foreground">{title}</h3>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
                state === "current"
                  ? "bg-primary/10 text-primary"
                  : state === "open"
                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {state === "current" ? "أنت هنا" : state === "open" ? "متاح" : "بعدها"}
            </span>
          </div>
          <p className="mt-1 text-xs leading-6 text-muted-foreground">{description}</p>
        </div>
      </div>
    </div>
  );

  return href && state !== "locked" ? (
    <Link href={href} className="block">
      {content}
    </Link>
  ) : (
    content
  );
}

function JourneyHome({
  dashboard,
  isLoading,
  isError,
  error,
  onRetry,
  learningContent,
  isLearningContentLoading,
  isLearningContentError,
  onRetryLearningContent,
}: {
  dashboard?: StudentDashboard;
  isLoading: boolean;
  isError: boolean;
  error?: Error | null;
  onRetry: () => void;
  learningContent: FoundationContent | null;
  isLearningContentLoading: boolean;
  isLearningContentError: boolean;
  onRetryLearningContent: () => void;
}) {
  const progress = dashboard?.progress;
  const {
    data: learningState,
    isLoading: isLearningStateLoading,
    isError: isLearningStateError,
    error: learningStateError,
    refetch: refetchLearningState,
  } = useFoundationLearningState("qudrat");
  const [diagnosticOpen, setDiagnosticOpen] = useState(false);
  const diagnosticComplete = learningState?.status === "diagnostic_completed";
  const qudratProgress = progress?.qudrat?.percentage || 0;
  const recommendation = learningState?.recommendation;
  const dashboardPlan = dashboard?.recommendedPlan;
  const workflowLevel = dashboardPlan?.level || "foundation";
  const workflowStage = diagnosticComplete ? workflowStageForLevel(workflowLevel) : "foundation";

  if (isError || isLearningStateError) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center gap-4 p-6 text-center" dir="rtl">
        <p className="text-sm font-bold text-destructive">
          {error?.message || learningStateError?.message || "تعذر تحميل رحلتك حاليًا."}
        </p>
        <Button
          type="button"
          variant="outline"
          className="rounded-xl"
          onClick={() => {
            onRetry();
            void refetchLearningState();
          }}
        >
          إعادة المحاولة
        </Button>
      </div>
    );
  }

  const nextActionHref = diagnosticComplete
    ? dashboardPlan?.nextAction?.href || recommendation?.href || "/foundation?program=qudrat&subject=verbal"
    : undefined;

  return (
    <>
      <div className="mx-auto max-w-5xl space-y-5 p-5 md:p-8" dir="rtl">
        <header>
          <p className="text-xs font-black text-primary">رحلتك في قدراتك</p>
          <h1 className="mt-1 text-2xl font-black text-foreground sm:text-3xl">خطوتك القادمة واضحة</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {diagnosticComplete
              ? `مرحلتك الحالية: ${workflowStage === "simulation" ? "المحاكاة" : workflowStage === "skills" ? "التدريب المهاري" : "التأسيس"}`
              : "ابدأ بتقييم قصير، ثم نحدد لك من أين تبدأ."}
          </p>
        </header>

        {isLearningContentError && diagnosticComplete && (
          <section role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4">
            <p className="text-sm leading-6 text-foreground">تعذر تحميل درس اليوم. يمكنك إعادة المحاولة أو متابعة بقية الرحلة.</p>
            <Button type="button" variant="outline" className="rounded-xl" onClick={onRetryLearningContent}>
              إعادة تحميل الدرس
            </Button>
          </section>
        )}

        {!diagnosticComplete && (
          <section data-testid="foundation-diagnostic-next-step" className="flex flex-col gap-4 rounded-3xl border border-primary/20 bg-primary/5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div>
              <p className="text-xs font-black text-primary">أول خطوة</p>
              <h2 className="mt-1 text-lg font-black text-foreground">
                {isLoading || isLearningStateLoading ? "نحدد نقطة البداية..." : "ابدأ تقييم البداية"}
              </h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                أجب عن أسئلة قصيرة لنقترح لك مستوى البداية المناسب.
              </p>
            </div>
            <Button
              type="button"
              data-testid="button-start-foundation-diagnostic"
              className="shrink-0 rounded-xl font-black"
              disabled={isLoading || isLearningStateLoading}
              onClick={() => setDiagnosticOpen(true)}
            >
              {isLoading || isLearningStateLoading ? "جارٍ التحميل" : "ابدأ التقييم"}
              <ListChecks className="mr-2 h-4 w-4" />
            </Button>
          </section>
        )}

        {diagnosticComplete && (
          <CurrentStageCard
            stage={workflowStage}
            lesson={learningContent}
            isLoading={isLearningContentLoading}
            title={workflowStage === "foundation" ? undefined : dashboardPlan?.title || recommendation?.title}
            description={workflowStage === "foundation" ? undefined : dashboardPlan?.description || recommendation?.reason}
            action={{
              label: dashboardPlan?.nextAction?.label || "ابدأ مهمتك",
              href: nextActionHref || "/foundation?program=qudrat&subject=verbal",
            }}
          />
        )}

        {!isLoading && !isLearningStateLoading && (
          <StudentWorkflow
            currentStage={workflowStage}
            level={workflowLevel}
            progress={qudratProgress}
            focusLabel={learningState?.focus?.label}
          />
        )}
      </div>
      <FoundationDiagnosticDialog open={diagnosticOpen} onOpenChange={setDiagnosticOpen} />
    </>
  );
}

function FoundationHome({
  dashboard,
  isLoading,
  isError,
  error,
  onRetry,
}: {
  dashboard?: StudentDashboard;
  isLoading: boolean;
  isError: boolean;
  error?: Error | null;
  onRetry: () => void;
}) {
  const [, setLocation] = useLocation();
  const progress = dashboard?.progress;
  const latestTests = dashboard?.recentTests?.slice(0, 3) || [];
  const plan = dashboard?.recommendedPlan;
  const {
    data: learningState,
    isLoading: isLearningStateLoading,
    isError: isLearningStateError,
    error: learningStateError,
    refetch: refetchLearningState,
  } = useFoundationLearningState("qudrat");
  const [diagnosticOpen, setDiagnosticOpen] = useState(false);
  const recommendation = learningState?.recommendation;

  if (isError || isLearningStateError) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center gap-4 p-6 text-center" dir="rtl">
        <p className="text-sm font-bold text-destructive">
          {error?.message || learningStateError?.message || "تعذر تحميل بيانات التأسيس حاليًا."}
        </p>
        <Button
          type="button"
          variant="outline"
          className="rounded-xl"
          onClick={() => {
            onRetry();
            void refetchLearningState();
          }}
        >
          إعادة المحاولة
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="mx-auto max-w-6xl space-y-6 p-5 md:p-8" dir="rtl">
        <header className="rounded-[28px] bg-[#0D1B2A] p-6 text-white shadow-sm sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-[#F7F775]">
              <Info className="h-3.5 w-3.5" />
              مساحة التأسيس
            </div>
            <h1 className="text-3xl font-black sm:text-4xl">ابدأ من المكان المناسب لك</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[#CBD5E1]">
              اختر دورتك، تابع آخر نتائجك، وخذ خطتك خطوة خطوة من الصفر حتى الاحتراف.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
            <Trophy className="mx-auto h-6 w-6 text-[#F7F775]" />
            <p className="mt-2 text-xs text-[#CBD5E1]">متوسط أدائك العام</p>
            <p className="mt-1 text-3xl font-black">{isLoading ? "—" : `${progress?.overall?.percentage || 0}%`}</p>
          </div>
        </div>
        </header>

        <section className="rounded-3xl border border-primary/20 bg-primary/5 p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Target className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs font-black text-primary">مسارك الشخصي</p>
                {isLearningStateLoading ? (
                  <p className="mt-2 text-sm text-muted-foreground">نجهز نقطة البداية...</p>
                ) : (
                  <>
                    <h2 className="mt-1 text-lg font-black text-foreground">{recommendation?.title || "حدد نقطة بدايتك"}</h2>
                    <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">{recommendation?.reason}</p>
                  </>
                )}
              </div>
            </div>
            {learningState?.status === "diagnostic_completed" ? (
              <Button type="button" className="shrink-0 rounded-xl font-black" onClick={() => setLocation(recommendation?.href || "/foundation?program=qudrat&subject=verbal")}>
                ابدأ مهمة اليوم
                <ArrowLeft className="mr-2 h-4 w-4" />
              </Button>
            ) : (
              <Button type="button" className="shrink-0 rounded-xl font-black" onClick={() => setDiagnosticOpen(true)}>
                ابدأ التقييم
                <ListChecks className="mr-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </section>

      <OfficialScoreCard scores={dashboard?.officialScores || null} />

      <section className="grid gap-4 lg:grid-cols-[1.15fr_1fr]">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-foreground">آخر نتائجك</h2>
              <p className="mt-1 text-xs text-muted-foreground">نتائجك الأخيرة في الاختبارات والتدريب.</p>
            </div>
            <BarChart3 className="h-5 w-5 text-primary" />
          </div>
          {latestTests.length ? (
            <div className="space-y-2">
              {latestTests.map((test) => (
                <div key={test.id} className="flex items-center justify-between gap-3 rounded-xl bg-muted/50 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-foreground">{test.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{test.type === "verbal" ? "لفظي" : test.type === "quantitative" ? "كمي" : "تدريب"}</p>
                  </div>
                  <span className="shrink-0 text-lg font-black text-primary">{test.score}%</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border p-5 text-center">
              <p className="text-sm font-bold text-foreground">لم تبدأ اختبارًا بعد</p>
              <p className="mt-1 text-xs text-muted-foreground">ابدأ إحدى الدورتين وسيظهر تقدمك هنا.</p>
            </div>
          )}
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <Route className="mt-0.5 h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-bold text-muted-foreground">خطتك المحددة لك</p>
              <h2 className="mt-1 text-xl font-black text-foreground">{plan?.title || "ابدأ بالتأسيس"}</h2>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">{plan?.description || "ابدأ بالشرح، ثم طبّق، ثم اختبر نفسك."}</p>
              <Link
                href={plan?.nextAction?.href || "/foundation?program=qudrat"}
                onClick={(event) => {
                  event.preventDefault();
                  setLocation(plan?.nextAction?.href || "/foundation?program=qudrat");
                }}
                className="mt-4 inline-flex items-center gap-2 text-sm font-black text-primary hover:underline"
              >
                {plan?.nextAction?.label || "ابدأ الآن"} <ArrowLeft className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-4">
          <h2 className="text-xl font-black text-foreground">دوراتك</h2>
          <p className="mt-1 text-sm text-muted-foreground">اختر المسار الذي تريد أن تبدأه اليوم.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
           <Link href="/foundation?program=qudrat" onClick={(event) => { event.preventDefault(); setLocation("/foundation?program=qudrat"); }} className="foundation-card group rounded-3xl border border-border bg-card p-5">
            <div className="flex items-start justify-between gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600"><Target className="h-6 w-6" /></span>
              <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-700 dark:text-emerald-300">ابدأ</span>
            </div>
            <h3 className="mt-5 text-2xl font-black text-foreground">دورة القدرات</h3>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">قسم لفظي وقسم كمي، شرح مرتب، فيديوهات، وتمارين واختبارات من بنك المنصة.</p>
            <div className="mt-5 flex items-center gap-3">
              <div className="flex-1"><ProgressBar value={progress?.qudrat?.percentage || 0} /></div>
              <span className="text-sm font-black text-primary">{progress?.qudrat?.percentage || 0}%</span>
            </div>
            <span className="mt-4 inline-flex items-center gap-2 text-sm font-black text-primary">دخول دورة القدرات <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" /></span>
          </Link>
           <Link href="/foundation?program=tahsili" onClick={(event) => { event.preventDefault(); setLocation("/foundation?program=tahsili"); }} className="foundation-card group rounded-3xl border border-border bg-card p-5">
            <div className="flex items-start justify-between gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600"><GraduationCap className="h-6 w-6" /></span>
              <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-700 dark:text-emerald-300">ابدأ</span>
            </div>
            <h3 className="mt-5 text-2xl font-black text-foreground">دورة التحصيلي</h3>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">أربعة مسارات: الرياضيات، الفيزياء، الكيمياء، والأحياء، وكل مسار له شرح وتدريب واختبار.</p>
            <div className="mt-5 flex items-center gap-3">
              <div className="flex-1"><ProgressBar value={progress?.tahsili?.percentage || 0} /></div>
              <span className="text-sm font-black text-primary">{progress?.tahsili?.percentage || 0}%</span>
            </div>
            <span className="mt-4 inline-flex items-center gap-2 text-sm font-black text-primary">دخول دورة التحصيلي <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" /></span>
          </Link>
        </div>
      </section>
      </div>
      <FoundationDiagnosticDialog open={diagnosticOpen} onOpenChange={setDiagnosticOpen} />
    </>
  );
}

function FoundationTrackOverview({
  program,
  dashboard,
}: {
  program: FoundationProgram;
  dashboard?: StudentDashboard;
}) {
  const [, setLocation] = useLocation();
  const progress = program === "qudrat" ? dashboard?.progress?.qudrat : dashboard?.progress?.tahsili;
  return (
    <div className="mx-auto max-w-6xl space-y-6 p-5 md:p-8" dir="rtl">
      <header className="rounded-[28px] bg-[#0D1B2A] p-6 text-white sm:p-8">
        <p className="text-sm font-bold text-[#F7F775]">دورة {program === "qudrat" ? "القدرات" : "التحصيلي"}</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black">اختر قسمك وابدأ</h1>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-[#CBD5E1]">كل قسم يأخذك من الفهم إلى التطبيق ثم اختبار قصير يقيس تقدمك.</p>
          </div>
          <div className="rounded-2xl bg-white/10 px-5 py-3 text-center"><span className="block text-3xl font-black">{progress?.percentage || 0}%</span><span className="text-xs text-[#CBD5E1]">تقدم المسار</span></div>
        </div>
      </header>
      <div className={`grid gap-4 ${program === "qudrat" ? "md:grid-cols-2" : "md:grid-cols-2 lg:grid-cols-4"}`}>
        {foundationSections[program].map((section) => (
           <Link
             key={section.key}
             href={`/foundation?program=${program}&subject=${section.key}`}
             onClick={(event) => {
               event.preventDefault();
               setLocation(`/foundation?program=${program}&subject=${section.key}`);
             }}
             className="foundation-card group rounded-3xl border border-border bg-card p-5"
           >
            <div className="flex items-start justify-between gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary"><BookOpen className="h-5 w-5" /></span>
              <ArrowLeft className="h-5 w-5 text-muted-foreground transition-transform group-hover:-translate-x-1" />
            </div>
            <h2 className="mt-5 text-xl font-black text-foreground">{section.title}</h2>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">{section.description}</p>
            <span className="mt-5 inline-flex rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-700 dark:text-emerald-300">ابدأ القسم</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

function FoundationPageContent() {
  const [, setLocation] = useLocation();
  const queryString = useSearch();
  const params = new URLSearchParams(queryString);
  const hasProgram = params.get("program") === "qudrat" || params.get("program") === "tahsili";
  const hasSubject = Boolean(params.get("subject"));
  const program: FoundationProgram = params.get("program") === "tahsili" ? "tahsili" : "qudrat";
  const requestedSection = getFoundationSection(program, params.get("subject"));
  const requestedLessonId = params.get("lesson");
  const [selectedLesson, setSelectedLesson] = useState<FoundationContent | null>(null);
  const [visibleLessonCount, setVisibleLessonCount] = useState(40);
  const activeSection = requestedSection;
  const curriculum = foundationCurriculum[activeSection.key];
  const shouldLoadFoundationContent = hasSubject;
  const contentSubjectId = `subject.${program}.${activeSection.key}`;
  const personalizationSubjectId = contentSubjectId === "subject.qudrat.verbal" || contentSubjectId === "subject.qudrat.quantitative"
    ? contentSubjectId
    : undefined;
  const {
    data: foundationPath,
    isLoading: isFoundationPathLoading,
    isError: isFoundationPathError,
    refetch: refetchFoundationPath,
  } = useFoundationLearningPath(program === "qudrat" ? personalizationSubjectId : undefined);
  const {
    data: homeVerbalContent = [],
    isLoading: isHomeVerbalContentLoading,
    isError: isHomeVerbalContentError,
    refetch: refetchHomeVerbalContent,
  } = useFoundationContent("qudrat", !hasProgram, "subject.qudrat.verbal");
  const {
    data: homeQuantitativeContent = [],
    isLoading: isHomeQuantitativeContentLoading,
    isError: isHomeQuantitativeContentError,
    refetch: refetchHomeQuantitativeContent,
  } = useFoundationContent("qudrat", !hasProgram, "subject.qudrat.quantitative");
  const {
    data: foundationContent,
    isLoading,
    isError: isContentError,
    error: contentError,
    refetch: refetchContent,
  } = useFoundationContent(program, shouldLoadFoundationContent, contentSubjectId);
  const {
    data: completionSummary,
    isError: isCompletionSummaryError,
    refetch: refetchCompletionSummary,
  } = useLearningContentProgressSummary(program, contentSubjectId, shouldLoadFoundationContent);
  const {
    data: dashboard,
    isLoading: isDashboardLoading,
    isError: isDashboardError,
    error: dashboardError,
    refetch: refetchDashboard,
  } = useStudentDashboard(!hasSubject);
  const content = useMemo(() => {
    return Array.isArray(foundationContent) ? foundationContent : [];
  }, [foundationContent]);
  const foundationBook = program === "qudrat"
    ? content.find((item) => item.title.startsWith("كتاب قدراتك · التأسيس"))
    : undefined;
  const completedContentIds = useMemo(
    () => new Set(completionSummary?.completedContentIds || []),
    [completionSummary?.completedContentIds],
  );
  const safeHomeVerbalContent = Array.isArray(homeVerbalContent) ? homeVerbalContent : [];
  const safeHomeQuantitativeContent = Array.isArray(homeQuantitativeContent) ? homeQuantitativeContent : [];
  const homeLearningContent = safeHomeVerbalContent[0] || safeHomeQuantitativeContent[0] || null;
  const isHomeContentLoading = isHomeVerbalContentLoading || isHomeQuantitativeContentLoading;
  const selectedLessonIndex = selectedLesson ? content.findIndex((item) => item._id === selectedLesson._id) : -1;
  const currentGuide = curriculum.lessons.length
    ? curriculum.lessons[Math.max(0, selectedLessonIndex) % curriculum.lessons.length]
    : { title: activeSection.title, summary: "", coaching: "" };

  useEffect(() => {
    if (content.length > 0) {
      const requestedLesson = requestedLessonId ? content.find((item) => item._id === requestedLessonId) : undefined;
      if (requestedLesson) {
        setSelectedLesson(requestedLesson);
      } else if (!selectedLesson || !content.some((item) => item._id === selectedLesson._id)) {
        setSelectedLesson(content[0]);
      }
    }
  }, [content, requestedLessonId, selectedLesson]);

  const selectedEmbedUrl = useMemo(
    () => {
      if (!selectedLesson || isDirectFoundationVideo(selectedLesson.videoUrl)) return null;
      return getVideoEmbedUrl(selectedLesson.videoUrl);
    },
    [selectedLesson],
  );
  const selectedDirectVideoUrl = selectedLesson && isDirectFoundationVideo(selectedLesson.videoUrl)
    ? resolveFoundationVideoUrl(selectedLesson.videoUrl)
    : null;

  if (!hasProgram) {
    return (
      <JourneyHome
        dashboard={dashboard}
        isLoading={isDashboardLoading}
        isError={isDashboardError}
        error={dashboardError}
        onRetry={() => void refetchDashboard()}
        learningContent={homeLearningContent}
        isLearningContentLoading={isHomeContentLoading}
        isLearningContentError={isHomeVerbalContentError || isHomeQuantitativeContentError}
        onRetryLearningContent={() => {
          void refetchHomeVerbalContent();
          void refetchHomeQuantitativeContent();
        }}
      />
    );
  }

  if (!hasSubject) {
    return <FoundationTrackOverview program={program} dashboard={dashboard} />;
  }

  const selectSection = (section: FoundationSection) => {
    setSelectedLesson(null);
    setVisibleLessonCount(40);
    setLocation(`/foundation?program=${program}&subject=${section.key}`);
  };
  const readerHref = (contentId: string) =>
    `/foundation/content/${encodeURIComponent(contentId)}?program=${program}&subject=${encodeURIComponent(activeSection.key)}`;
  const coverageTestHref = `/foundation/coverage-test?subjectId=${encodeURIComponent(contentSubjectId)}`;
  const foundationBookName = program === "tahsili" ? "كتاب التحصيلي" : "كتاب قدراتك";
  const subjectActionHref = program === "tahsili" && activeSection.tahsiliSubject
    ? `/tahsilik/tests/subject?subject=${encodeURIComponent(activeSection.tahsiliSubject)}`
    : `/learning/today?programId=${program}&subjectId=${encodeURIComponent(contentSubjectId)}`;

  return (
    <div className="mx-auto max-w-7xl p-5 md:p-8 animate-fade-in">
      {/* Header */}
      <header className="mb-8">
        <div className="mb-2 flex flex-wrap items-center gap-2 text-xs font-bold text-muted-foreground">
          <span className="rounded-full bg-primary/10 px-3 py-1 text-primary">{program === "qudrat" ? "القدرات" : "التحصيلي"}</span>
          <span>التأسيس</span>
        </div>
         <h1 className="text-3xl font-black text-[#0D1B2A] dark:text-white mb-2">{foundationBookName} · {activeSection.title}</h1>
         <p className="max-w-3xl text-sm leading-7 text-muted-foreground">
           هذا هو كتاب التأسيس الخاص بقسم {activeSection.shortTitle}: اقرأ الملزمة، شاهد الشرح، ثم صحّح اختبار كل درس من المكان نفسه.
         </p>
         <Button type="button" className="mt-4 rounded-xl font-black" onClick={() => setLocation(subjectActionHref)}>
           {program === "tahsili" ? "ابدأ اختبار هذه المادة" : "ابدأ مهمة اليوم"}
         </Button>
      </header>

        <section className="mb-8 rounded-3xl border border-primary/20 bg-primary/5 p-4 sm:p-5" aria-label={`طريقة استخدام ${foundationBookName}`}>
         <div className="flex items-center gap-2">
           <BookOpen className="h-5 w-5 text-primary" />
            <h2 className="text-base font-black text-foreground">كيف تستخدم {foundationBookName}؟</h2>
         </div>
         <div className="mt-4 grid gap-3 md:grid-cols-3">
           {[
             ["١", "اقرأ الباب", "افهم الفكرة، ثم تتبّع المثال المحلول وأعده بنفسك."],
             ["٢", "شاهد الشرح", "شاهد الفيديو المرتبط بالدرس لتثبيت طريقة الحل."],
             ["٣", "اختبر فهمك", "راجع أخطاءك، ثم استخدم اختبار تغطية البنك للتدرّب على أسئلة جديدة."],
           ].map(([number, title, description]) => (
             <div key={number} className="flex items-start gap-3 rounded-2xl border border-primary/10 bg-background/70 p-3">
               <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary text-sm font-black text-primary-foreground">{number}</span>
               <div>
                 <p className="text-sm font-black text-foreground">{title}</p>
                 <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p>
               </div>
             </div>
           ))}
         </div>
       </section>

      {program === "qudrat" ? (
        <section className="mb-8 grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]" aria-label="الكتاب والمسار المخصص">
          <div className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-black text-primary">كتاب تأسيسي مكتوب</span>
                <h2 className="mt-3 text-xl font-black text-foreground">
                  {foundationBook?.title || `كتاب التأسيس ${activeSection.shortTitle}`}
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">
                  شرح أصلي منظم من أساسيات الباب إلى استراتيجيات حل أسئلة القدرات، مع أمثلة محلولة وتنبيهات على الأخطاء الشائعة.
                </p>
              </div>
              <BookOpen className="h-7 w-7 text-primary" />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {foundationBook ? (
                <Button type="button" onClick={() => setLocation(readerHref(foundationBook._id))} className="rounded-xl font-black">
                  <BookOpen className="ml-2 h-4 w-4" /> افتح الكتاب
                </Button>
              ) : null}
              <Button type="button" variant="outline" onClick={() => setLocation(coverageTestHref)} className="rounded-xl font-black">
                <ListChecks className="ml-2 h-4 w-4" /> أنشئ اختبار تغطية
              </Button>
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Route className="h-5 w-5 text-primary" />
                  <h2 className="font-black text-foreground">مسارك حسب محاولاتك</h2>
                </div>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">نموذج تعلّم آلي يرتّب الأبواب بحسب إجاباتك السابقة؛ التوقع تدريبي وليس حكمًا نهائيًا على الإتقان.</p>
              </div>
              <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-bold text-muted-foreground">
                {foundationPath?.attemptsUsed ?? 0} محاولة
              </span>
            </div>

            {isFoundationPathLoading ? (
              <div className="mt-5 flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> نبني ترتيبك من محاولاتك السابقة...
              </div>
            ) : isFoundationPathError ? (
              <div className="mt-4 rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
                تعذر تحميل التخصيص الآن.
                <Button type="button" variant="link" onClick={() => void refetchFoundationPath()} className="mr-1 h-auto p-0 text-destructive">إعادة المحاولة</Button>
              </div>
            ) : isFoundationLearningPath(foundationPath) ? (
              <>
                <div className="mt-4 space-y-2">
                  {foundationPath.recommendations.slice(0, 3).map((recommendation, index) => (
                    <div key={recommendation.skillKey} className="flex items-start gap-3 rounded-xl border border-border bg-background p-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-black text-primary">{index + 1}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-black text-foreground">{recommendation.title}</p>
                        <p className="mt-1 text-xs leading-5 text-muted-foreground">{recommendation.reason}</p>
                      </div>
                      <span className="shrink-0 rounded-full bg-muted px-2 py-1 text-[10px] font-bold text-muted-foreground">
                        {recommendation.confidence < 0.3 ? "بيانات قليلة" : `توقع ${Math.round(recommendation.predictedCorrectProbability * 100)}٪`}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 rounded-xl bg-primary/5 p-3">
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <span className="font-bold text-foreground">تغطية بنك الأسئلة</span>
                    <span className="font-black text-primary">{foundationPath.coverage.covered.toLocaleString("ar")} من {foundationPath.coverage.total.toLocaleString("ar")} · {foundationPath.coverage.percent}٪</span>
                  </div>
                  <ProgressBar value={foundationPath.coverage.percent} className="mt-2" />
                </div>
              </>
            ) : foundationPath ? (
              <div role="alert" className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-sm text-foreground">
                <p>بيانات المسار غير مكتملة، لكن يمكنك متابعة الدروس واختبار التغطية.</p>
                <Button type="button" variant="link" onClick={() => void refetchFoundationPath()} className="mr-1 h-auto p-0">
                  إعادة تحميل المسار
                </Button>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      <div className={`mb-8 grid gap-3 ${program === "qudrat" ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-4"}`}>
        {foundationSections[program].map((section) => (
          <button
            key={section.key}
            type="button"
            onClick={() => selectSection(section)}
            className={`foundation-section-button rounded-2xl border p-4 text-right ${
              activeSection.key === section.key
                ? "border-primary bg-primary/10 shadow-sm"
                : "border-border bg-card"
            }`}
          >
            <span className="block text-sm font-black text-foreground">{section.shortTitle}</span>
            <span className="mt-1 block text-xs leading-5 text-muted-foreground">{section.description}</span>
          </button>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
           <h2 className="text-xl font-black text-foreground">دروس كتاب قدراتك</h2>
           <p className="mt-1 text-sm text-muted-foreground">كل درس يجمع الملزمة، الفيديو، واختبار القسم في مسار واحد.</p>
        </div>
        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-black text-primary">من الصفر إلى الاحتراف</span>
      </div>

      {completionSummary && completionSummary.total > 0 ? (
        <section className={`mb-5 rounded-2xl border p-4 ${completionSummary.completed === completionSummary.total ? "border-emerald-500/30 bg-emerald-500/10" : "border-primary/20 bg-primary/5"}`} aria-live="polite">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className={`h-5 w-5 ${completionSummary.completed === completionSummary.total ? "text-emerald-600" : "text-primary"}`} />
              <p className="font-black text-foreground">
                {completionSummary.completed === completionSummary.total
                  ? "أكملت جميع دروس هذا القسم"
                  : `أكملت ${completionSummary.completed} من ${completionSummary.total} درسًا`}
              </p>
            </div>
            <span className="rounded-full bg-background px-3 py-1 text-xs font-black text-foreground">
              {completionSummary.completionPercent}٪
            </span>
          </div>
          <ProgressBar value={completionSummary.completionPercent} className="mt-3" />
        </section>
      ) : null}

      {isCompletionSummaryError ? (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-foreground">
          <span>تعذر تحميل بيانات الإنجاز، لكن يمكنك متابعة الدروس المنشورة.</span>
          <Button type="button" variant="outline" className="rounded-xl" onClick={() => void refetchCompletionSummary()}>
            إعادة تحميل الإنجاز
          </Button>
        </div>
      ) : null}

      {isLoading ? (
        <div className="flex items-center justify-center rounded-2xl border border-border bg-card py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : isContentError ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-destructive/40 bg-destructive/5 px-5 py-16 text-center">
          <p className="text-sm font-bold text-destructive">{contentError?.message || "تعذر تحميل محتوى هذا القسم حاليًا."}</p>
          <Button
            type="button"
            variant="outline"
            className="rounded-xl"
            onClick={() => {
              void refetchContent();
            }}
          >
            إعادة المحاولة
          </Button>
        </div>
      ) : content.length > 0 ? (
        <section className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-4 lg:sticky lg:top-5">
            <div className="overflow-hidden rounded-3xl border border-slate-800 bg-[#07111f] text-white shadow-xl">
              {selectedLesson && selectedDirectVideoUrl ? (
                <div className="aspect-video w-full bg-black">
                  <video
                    key={selectedDirectVideoUrl}
                    src={selectedDirectVideoUrl}
                    title={selectedLesson.title}
                    className="h-full w-full"
                    controls
                    playsInline
                    preload="metadata"
                    controlsList="nodownload"
                    onContextMenu={(event) => event.preventDefault()}
                  />
                </div>
              ) : selectedLesson && selectedEmbedUrl ? (
                <div className="aspect-video w-full bg-black">
                  <iframe
                    key={selectedEmbedUrl}
                    src={selectedEmbedUrl}
                    title={selectedLesson.title}
                    className="h-full w-full"
                    allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                    sandbox="allow-scripts allow-same-origin allow-presentation"
                    referrerPolicy="strict-origin-when-cross-origin"
                    onContextMenu={(event) => event.preventDefault()}
                  />
                </div>
              ) : (
                <div className="flex aspect-video items-center justify-center bg-gradient-to-br from-[#0D1B2A] to-[#173B5C] p-8 text-center">
                  <div>
                    <PlayCircle className="mx-auto h-14 w-14 text-[#F7F775]" />
                    <p className="mt-4 text-sm font-bold text-slate-200">اختر درسًا من القائمة ليظهر الفيديو هنا</p>
                  </div>
                </div>
              )}
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-[#F7F775]">{activeSection.shortTitle} · درس تأسيسي</p>
                    <h2 className="mt-1 text-xl font-black">{selectedLesson?.title || "ابدأ أول درس"}</h2>
                  </div>
                  {selectedLesson && <Clock className="mt-1 h-5 w-5 text-slate-400" />}
                </div>
                <p className="mt-2 text-sm leading-7 text-slate-300">
                  {selectedLesson?.description || "بنمشي معك خطوة خطوة، وبعد الشرح تقدر تختبر فهمك من نفس المكان."}
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {selectedLesson && /^[a-f\d]{24}$/i.test(selectedLesson._id) && (
                    <Button type="button" onClick={() => setLocation(readerHref(selectedLesson._id))} className="rounded-xl bg-[#F7F775] font-black text-[#0D1B2A] hover:bg-[#F7F775]/90">
                       <BookOpen className="ml-2 h-4 w-4" /> فتح صفحة الدرس
                    </Button>
                  )}
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <ShieldCheck className="h-4 w-4 text-emerald-400" />
                    {selectedLesson?.quiz ? "الاختبار في صفحة مستقلة" : "فيديو شرح للدرس"}
                  </div>
                </div>
                 {selectedLesson?.attachments?.length ? (
                   <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-3">
                     <div className="mb-2 flex items-center gap-2 text-xs font-black text-[#F7F775]">
                       <FileText className="h-4 w-4" />
                        ملزمة كتاب قدراتك
                     </div>
                     <div className="grid gap-2 sm:grid-cols-2">
                       {selectedLesson.attachments.map((attachment) => (
                         <a
                           key={attachment.id}
                            href={resolveFoundationAssetUrl(attachment.url)}
                           target="_blank"
                           rel="noreferrer"
                           className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs font-bold text-slate-200 transition-colors hover:border-[#F7F775]/60 hover:text-[#F7F775]"
                         >
                           <FileText className="h-4 w-4 shrink-0 text-red-300" />
                            <span className="min-w-0 truncate">{attachment.title || "ملزمة الدرس بصيغة PDF"}</span>
                         </a>
                       ))}
                     </div>
                   </div>
                 ) : null}
                  {selectedLesson && <FoundationQuizCard key={selectedLesson._id} lesson={selectedLesson} />}
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-start gap-3">
                <BookOpen className="mt-1 h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs font-black text-primary">الشرح الكتابي للدرس</p>
                  <h2 className="mt-1 text-lg font-black text-foreground">{currentGuide.title}</h2>
                  <p className="mt-2 text-sm leading-7 text-muted-foreground">{currentGuide.summary} {activeSection.explanation}</p>
                  <div className="mt-4 rounded-2xl bg-primary/5 p-4">
                    <p className="text-sm font-black text-foreground">طريقة الحل</p>
                    <ol className="mt-2 list-decimal space-y-2 pr-5 text-sm leading-6 text-muted-foreground">
                      <li>اقرأ المطلوب وحدد الكلمات أو القيم المهمة في السؤال.</li>
                      <li>طبّق الفكرة على مثال بسيط، ثم انتقل لمسألة من بنك المنصة.</li>
                      <li>راجع سبب الإجابة، وليس الإجابة وحدها، قبل الانتقال للدرس التالي.</li>
                    </ol>
                  </div>
                  <p className="mt-3 text-xs leading-5 text-primary">نصيحة سعودية: {currentGuide.coaching}</p>
                </div>
              </div>
            </div>
          </div>

          <aside className="rounded-3xl border border-border bg-card p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-3 border-b border-border pb-4">
              <div>
                <h2 className="text-lg font-black text-foreground">قائمة الدروس</h2>
                <p className="mt-1 text-xs text-muted-foreground">{content.length} درسًا مرتبة من البداية إلى الاحتراف</p>
              </div>
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-black text-primary">{activeSection.shortTitle}</span>
            </div>
            <div className="max-h-[680px] space-y-2 overflow-y-auto pl-1">
              {content.slice(0, visibleLessonCount).map((item, idx) => {
                const active = selectedLesson?._id === item._id;
                const completed = completedContentIds.has(item._id);
                return (
                  <button
                    key={item._id}
                    type="button"
                    onClick={() => setLocation(readerHref(item._id))}
                    aria-label={`فتح درس ${item.title}`}
                    className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-right transition ${active ? "border-primary bg-primary/10" : "border-border bg-background hover:border-primary/40 hover:bg-primary/5"}`}
                  >
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-black ${completed ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" : active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                      {completed ? <CheckCircle2 className="h-4 w-4" /> : idx + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-black text-foreground">{item.title}</span>
                      <span className="mt-1 block truncate text-xs text-muted-foreground">{completed ? "مكتمل · افتح لمراجعة الدرس" : item.description}</span>
                    </span>
                    <span className={`shrink-0 text-xs font-black ${completed ? "text-emerald-700 dark:text-emerald-300" : "text-primary"}`}>
                      {completed ? "مكتمل" : "افتح الدرس"}
                    </span>
                    <PlayCircle className={`h-4 w-4 shrink-0 ${active ? "text-primary" : "text-muted-foreground"}`} />
                  </button>
                );
              })}
            </div>
            {content.length > visibleLessonCount && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setVisibleLessonCount((count) => Math.min(count + 40, content.length))}
                className="mt-3 w-full rounded-xl font-bold"
              >
                عرض المزيد من الدروس ({content.length - visibleLessonCount} متبقي)
              </Button>
            )}
            <div className="mt-5 border-t border-border pt-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-black text-foreground">اختبارات التأسيس</h3>
                    <p className="mt-1 text-xs text-muted-foreground">اختبر فهمك بعد كل موضوع.</p>
                </div>
                <ListChecks className="h-4 w-4 text-primary" />
              </div>
                <div className="rounded-2xl border border-dashed border-border bg-background p-4 text-sm leading-7 text-muted-foreground">
                   افتح صفحة الدرس من القائمة لمشاهدة الفيديو والملزمة والتنقل بين الدروس. يمكنك اختبار فهمك بعد ذلك.
                </div>
            </div>
          </aside>
        </section>
      ) : (
        <div className="rounded-2xl border border-dashed border-border bg-card px-5 py-16 text-center">
          <BookOpen className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
          <h3 className="text-lg font-black text-foreground">لا توجد دروس منشورة قابلة للفتح في هذا القسم</h3>
          <p className="mt-1 text-sm text-muted-foreground">ستظهر الدروس هنا بعد نشرها واعتمادها.</p>
        </div>
      )}

      <section className="mt-6 rounded-3xl border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-4">
          <div>
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
               <h2 className="text-xl font-black text-foreground">خريطة {foundationBookName} · {activeSection.shortTitle}</h2>
            </div>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-muted-foreground">{curriculum.intro}</p>
          </div>
          <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-700 dark:text-emerald-300">من الصفر إلى الاحتراف</span>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {curriculum.lessons.map((lesson, index) => (
            <div key={lesson.title} className="rounded-2xl border border-border bg-background p-4">
              <div className="flex items-start gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-black text-primary">{index + 1}</span>
                <div>
                  <h3 className="font-black text-foreground">{lesson.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{lesson.summary}</p>
                  <p className="mt-2 text-xs leading-5 text-primary">نصيحة: {lesson.coaching}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}

export default function FoundationPage() {
  return (
    <ErrorBoundary fallback={<FoundationPageErrorFallback />}>
      <FoundationPageContent />
    </ErrorBoundary>
  );
}
