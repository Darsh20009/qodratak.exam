import React, { useEffect, useMemo, useState } from "react";
import {
  FoundationContent,
  FoundationDiagnostic,
  FoundationDiagnosticQuestion,
  FoundationLearningState,
  StudentDashboard,
  useFoundationContent,
  useFoundationLearningState,
  useStartFoundationDiagnostic,
  useStudentDashboard,
  useSubmitFoundationDiagnostic,
} from "@/hooks/use-student";
import { verbalBankVideos } from "@/data/verbalBankVideos";
import { foundationSections, getFoundationSection, type FoundationProgram, type FoundationSection } from "@/data/foundationSections";
import { foundationCurriculum } from "@/data/foundationCurriculum";
import { Link, useLocation } from "wouter";
import { ArrowLeft, BarChart3, BookOpen, Clock, GraduationCap, ListChecks, Loader2, PlayCircle, Route, ShieldCheck, Sparkles, Target, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";

type QuizQuestion = {
  _id?: string;
  id?: string | number;
  questionId?: number;
  text: string;
  options: string[];
  correctOptionIndex: number;
  explanation?: string;
  imageUrl?: string;
  imageUrls?: string[];
};

type QuizResult = {
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  skippedQuestions: number;
  passed: boolean;
  passingScore: number;
};

function getEmbedUrl(value: string) {
  try {
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol)) return null;

    if (url.hostname === "youtu.be") {
      const id = url.pathname.slice(1).split("/")[0];
      return id ? `https://www.youtube-nocookie.com/embed/${id}?controls=0&disablekb=1&fs=0&modestbranding=1&playsinline=1&rel=0` : null;
    }

    if (url.hostname.endsWith("youtube.com")) {
      if (url.pathname.startsWith("/embed/")) {
        const id = url.pathname.split("/").filter(Boolean)[1];
        return id ? `https://www.youtube-nocookie.com/embed/${id}?controls=0&disablekb=1&fs=0&modestbranding=1&playsinline=1&rel=0` : null;
      }
      const id = url.searchParams.get("v");
      return id ? `https://www.youtube-nocookie.com/embed/${id}?controls=0&disablekb=1&fs=0&modestbranding=1&playsinline=1&rel=0` : null;
    }

    if (url.hostname === "vimeo.com") {
      const id = url.pathname.split("/").filter(Boolean)[0];
      return id && /^\d+$/.test(id) ? `https://player.vimeo.com/video/${id}` : null;
    }

    if (url.hostname === "player.vimeo.com" && url.pathname.startsWith("/video/")) {
      return url.toString();
    }

    return url.toString();
  } catch {
    return null;
  }
}

function ProgressBar({ value, className = "" }: { value: number; className?: string }) {
  return <Progress value={Math.max(0, Math.min(100, value))} className={`h-2.5 ${className}`} />;
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
  return (
    <fieldset className="rounded-2xl border border-border bg-card p-4">
      <legend className="px-1 text-sm font-black text-foreground">السؤال {index + 1} · {question.category === "verbal" ? "لفظي" : "كمي"}</legend>
      <p className="mt-2 text-sm font-bold leading-7 text-foreground">{question.text}</p>
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
              <Sparkles className="h-3.5 w-3.5" />
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
            <p className="mt-1 text-3xl font-black">{isLoading ? "—" : `${progress?.overall.percentage || 0}%`}</p>
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
                href={plan?.nextAction.href || "/foundation?program=qudrat"}
                onClick={(event) => {
                  event.preventDefault();
                  setLocation(plan?.nextAction.href || "/foundation?program=qudrat");
                }}
                className="mt-4 inline-flex items-center gap-2 text-sm font-black text-primary hover:underline"
              >
                {plan?.nextAction.label || "ابدأ الآن"} <ArrowLeft className="h-4 w-4" />
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
              <div className="flex-1"><ProgressBar value={progress?.qudrat.percentage || 0} /></div>
              <span className="text-sm font-black text-primary">{progress?.qudrat.percentage || 0}%</span>
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
              <div className="flex-1"><ProgressBar value={progress?.tahsili.percentage || 0} /></div>
              <span className="text-sm font-black text-primary">{progress?.tahsili.percentage || 0}%</span>
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
  const progress = program === "qudrat" ? dashboard?.progress.qudrat : dashboard?.progress.tahsili;
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

export default function FoundationPage() {
  const [location, setLocation] = useLocation();
  const queryString = typeof window !== "undefined" && window.location.search
    ? window.location.search
    : location.includes("?")
      ? `?${location.split("?")[1]}`
      : "";
  const params = new URLSearchParams(queryString);
  const hasProgram = params.get("program") === "qudrat" || params.get("program") === "tahsili";
  const hasSubject = Boolean(params.get("subject"));
  const program: FoundationProgram = params.get("program") === "tahsili" ? "tahsili" : "qudrat";
  const requestedSection = getFoundationSection(program, params.get("subject"));
  const [selectedLesson, setSelectedLesson] = useState<FoundationContent | null>(null);
  const [visibleLessonCount, setVisibleLessonCount] = useState(40);
  const [quizBankCache, setQuizBankCache] = useState<Record<string, QuizQuestion[]>>({});
  const [quizLesson, setQuizLesson] = useState<FoundationContent | null>(null);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizSubmitting, setQuizSubmitting] = useState(false);
  const [quizError, setQuizError] = useState('');
  const activeSection = requestedSection;
  const curriculum = foundationCurriculum[activeSection.key];
  const shouldLoadFoundationContent = hasSubject && !(program === "qudrat" && activeSection.key === "verbal");
  const {
    data: foundationContent,
    isLoading,
    isError: isContentError,
    error: contentError,
    refetch: refetchContent,
  } = useFoundationContent(program, shouldLoadFoundationContent);
  const {
    data: dashboard,
    isLoading: isDashboardLoading,
    isError: isDashboardError,
    error: dashboardError,
    refetch: refetchDashboard,
  } = useStudentDashboard(!hasSubject);
  const content = program === "qudrat" && activeSection.key === "verbal" ? verbalBankVideos : foundationContent || [];
  const selectedLessonIndex = selectedLesson ? content.findIndex((item) => item._id === selectedLesson._id) : -1;
  const currentGuide = curriculum.lessons[Math.max(0, selectedLessonIndex) % curriculum.lessons.length];

  const selectedEmbedUrl = useMemo(
    () => (selectedLesson ? getEmbedUrl(selectedLesson.videoUrl) : null),
    [selectedLesson],
  );

  if (!hasProgram) {
    return (
      <FoundationHome
        dashboard={dashboard}
        isLoading={isDashboardLoading}
        isError={isDashboardError}
        error={dashboardError}
        onRetry={() => void refetchDashboard()}
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

  const startSectionQuiz = () => {
    void openQuiz({
      _id: `section-quiz-${program}-${activeSection.key}`,
      program,
      title: `اختبار ${activeSection.title}`,
      description: `اختبار قصير من 10 أسئلة في ${activeSection.shortTitle}.`,
      videoUrl: "",
      order: 1,
    });
  };

  const startCurriculumQuiz = (title: string, order: number) => {
    void openQuiz({
      _id: `curriculum-quiz-${program}-${activeSection.key}-${order}`,
      program,
      title: `اختبار تأسيس ${title}`,
      description: `اختبار تدريبي من بنك ${activeSection.shortTitle} بعد شرح ${title}.`,
      videoUrl: "",
      order,
    });
  };

  const openQuiz = async (lesson: FoundationContent) => {
    setQuizLesson(lesson);
    setQuizAnswers({});
    setQuizResult(null);
    setQuizError('');
    setQuizQuestions([]);
    setQuizLoading(true);
    try {
      const cacheKey = `${program}:${activeSection.key}`;
      let questions: QuizQuestion[] = [];
      if (quizBankCache[cacheKey]) {
        questions = quizBankCache[cacheKey];
      } else {
        if (activeSection.tahsiliSubject) {
          const response = await fetch(`/api/tahsili/question-bank?subject=${encodeURIComponent(activeSection.tahsiliSubject)}&page=1&limit=50`, {
            credentials: "include",
          });
          const data = await response.json();
          questions = Array.isArray(data.questions) ? data.questions : [];
        } else if (activeSection.questionCategory) {
          const response = await fetch(`/api/questions?category=${activeSection.questionCategory}`, { credentials: "include" });
          const data = await response.json();
          const source = Array.isArray(data) ? data : [];
          const allowed = new Set(activeSection.questionSubcategories || []);
          questions = source.filter((question: QuizQuestion & { subcategory?: string }) => allowed.has(String(question.subcategory)));
          if (questions.length < 10) questions = source;
        }
        setQuizBankCache((current) => ({ ...current, [cacheKey]: questions }));
      }

      if (questions.length < 10) {
        throw new Error("لا توجد عشرة أسئلة معتمدة كافية لهذا القسم حاليًا.");
      }

      const start = ((Math.max(1, Number(lesson.order) || 1) - 1) * 10) % questions.length;
      const rotated = [...questions.slice(start), ...questions.slice(0, start)];
      setQuizQuestions(rotated.slice(0, 10));
    } catch (error) {
      setQuizError(error instanceof Error ? error.message : "تعذر تجهيز اختبار الدرس");
    } finally {
      setQuizLoading(false);
    }
  };
  const closeQuiz = () => {
    setQuizLesson(null);
    setQuizQuestions([]);
    setQuizAnswers({});
    setQuizResult(null);
    setQuizError('');
  };
  const submitQuiz = async () => {
    if (!quizLesson || quizQuestions.length === 0) return;
    setQuizSubmitting(true);
    setQuizError('');
    try {
      const answered = quizQuestions.filter((question) => {
        const key = String(question._id || question.id || question.questionId);
        return Number.isInteger(quizAnswers[key]);
      });
      const correctAnswers = answered.filter((question) => {
        const key = String(question._id || question.id || question.questionId);
        return quizAnswers[key] === question.correctOptionIndex;
      }).length;
      const score = Math.round((correctAnswers / quizQuestions.length) * 100);
      setQuizResult({
        score,
        correctAnswers,
        totalQuestions: quizQuestions.length,
        skippedQuestions: quizQuestions.length - answered.length,
        passed: score >= 60,
        passingScore: 60,
      });
    } catch (error) {
      setQuizError(error instanceof Error ? error.message : 'تعذر تصحيح الاختبار');
    } finally {
      setQuizSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl p-5 md:p-8 animate-fade-in">
      {/* Header */}
      <header className="mb-8">
        <div className="mb-2 flex flex-wrap items-center gap-2 text-xs font-bold text-muted-foreground">
          <span className="rounded-full bg-primary/10 px-3 py-1 text-primary">{program === "qudrat" ? "القدرات" : "التحصيلي"}</span>
          <span>التأسيس</span>
        </div>
        <h1 className="text-3xl font-black text-[#0D1B2A] dark:text-white mb-2">{activeSection.title}</h1>
        <p className="text-sm text-muted-foreground">{activeSection.description}</p>
      </header>

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
          <h2 className="text-xl font-black text-foreground">فيديوهات واختبارات التأسيس</h2>
          <p className="mt-1 text-sm text-muted-foreground">شاهد الدرس، ثم اختبر فهمك من بنك {activeSection.shortTitle}.</p>
        </div>
        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-black text-primary">من الصفر إلى الاحتراف</span>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center rounded-2xl border border-border bg-card py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : isContentError ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-destructive/40 bg-destructive/5 px-5 py-16 text-center">
          <p className="text-sm font-bold text-destructive">
            {contentError?.message || "تعذر تحميل محتوى هذا القسم حاليًا."}
          </p>
          <Button type="button" variant="outline" className="rounded-xl" onClick={() => void refetchContent()}>
            إعادة المحاولة
          </Button>
        </div>
      ) : content && content.length > 0 ? (
        <section className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-4 lg:sticky lg:top-5">
            <div className="overflow-hidden rounded-3xl border border-slate-800 bg-[#07111f] text-white shadow-xl">
              {selectedLesson && selectedEmbedUrl ? (
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
                  {selectedLesson && (
                    <Button type="button" onClick={() => openQuiz(selectedLesson)} className="rounded-xl bg-[#F7F775] font-black text-[#0D1B2A] hover:bg-[#F7F775]/90">
                      <ListChecks className="ml-2 h-4 w-4" /> اختبار الدرس — 10 أسئلة
                    </Button>
                  )}
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <ShieldCheck className="h-4 w-4 text-emerald-400" />
                    الفيديو والاختبار داخل الصفحة
                  </div>
                </div>
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
                <h2 className="text-lg font-black text-foreground">فيديوهات الدروس</h2>
                <p className="mt-1 text-xs text-muted-foreground">{content.length} درسًا مرتبة من البداية إلى الاحتراف</p>
              </div>
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-black text-primary">{activeSection.shortTitle}</span>
            </div>
            <div className="max-h-[680px] space-y-2 overflow-y-auto pl-1">
              {content.slice(0, visibleLessonCount).map((item, idx) => {
                const active = selectedLesson?._id === item._id;
                return (
                  <button
                    key={item._id}
                    type="button"
                    onClick={() => setSelectedLesson(item)}
                    className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-right transition ${active ? "border-primary bg-primary/10" : "border-border bg-background hover:border-primary/40 hover:bg-primary/5"}`}
                  >
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-black ${active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{idx + 1}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-black text-foreground">{item.title}</span>
                      <span className="mt-1 block truncate text-xs text-muted-foreground">{item.description}</span>
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
              <div className="space-y-2">
                {curriculum.lessons.map((lesson, index) => (
                  <button
                    key={lesson.title}
                    type="button"
                    onClick={() => startCurriculumQuiz(lesson.title, index + 1)}
                    className="flex w-full items-center gap-3 rounded-2xl border border-border bg-background p-3 text-right transition-colors hover:border-primary/40 hover:bg-primary/5"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-xs font-black text-emerald-700 dark:text-emerald-300">{index + 1}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold text-foreground">{lesson.title}</span>
                      <span className="mt-1 block truncate text-xs text-muted-foreground">اختبار من بنك {activeSection.shortTitle}</span>
                    </span>
                    <ArrowLeft className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </button>
                ))}
              </div>
            </div>
          </aside>
        </section>
      ) : (
        <div className="rounded-2xl border border-dashed border-border bg-card px-5 py-16 text-center">
          <BookOpen className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
          <h3 className="text-lg font-black text-foreground">المحتوى المرئي قيد التجهيز</h3>
          <p className="mt-1 text-sm text-muted-foreground">الشرح والاختبار جاهزان، وسيظهر الفيديو هنا عند نشره.</p>
          <Button type="button" onClick={startSectionQuiz} className="mt-5 rounded-xl">ابدأ اختبار القسم</Button>
        </div>
      )}

      <section className="mt-6 rounded-3xl border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-4">
          <div>
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-black text-foreground">كتاب تأسيس {activeSection.shortTitle}</h2>
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

      <Dialog open={!!quizLesson} onOpenChange={open => !open && closeQuiz()}>
        <DialogContent className="max-h-[94vh] w-[calc(100%-1rem)] max-w-3xl overflow-y-auto bg-background p-4 sm:p-6">
          <DialogHeader className="text-right">
            <DialogTitle className="text-2xl font-black">{quizLesson?.quiz?.title || 'اختبار الدرس'}</DialogTitle>
            {quizLesson?.quiz?.instructions && <p className="text-sm leading-6 text-muted-foreground">{quizLesson.quiz.instructions}</p>}
          </DialogHeader>
          {quizLoading ? (
            <div className="flex items-center justify-center gap-3 py-12 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" /> جارٍ تجهيز 10 أسئلة مناسبة للقسم...
            </div>
          ) : !quizResult ? (
            <div className="space-y-5">
              {quizQuestions.map((question, index) => (
                <div key={String(question._id || question.id || question.questionId)} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                  <div className="mb-3 flex items-start gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-black text-primary">{index + 1}</span>
                    <p className="whitespace-pre-wrap text-sm font-bold leading-7 text-foreground">{question.text}</p>
                  </div>
                  {(question.imageUrl || question.imageUrls?.[0]) && <img src={question.imageUrl || question.imageUrls?.[0]} alt="" className="mb-4 max-h-56 w-full rounded-xl object-contain" />}
                  <div className="grid gap-2 sm:grid-cols-2">
                    {question.options.map((option, optionIndex) => {
                      const questionKey = String(question._id || question.id || question.questionId);
                      const selected = quizAnswers[questionKey] === optionIndex;
                      return <button type="button" key={`${questionKey}-${optionIndex}`} onClick={() => setQuizAnswers(current => ({ ...current, [questionKey]: optionIndex }))} className={`rounded-xl border p-3 text-right text-sm transition-colors ${selected ? 'border-primary bg-primary/10 font-bold text-primary' : 'border-border bg-background hover:bg-muted'}`}><span className="ml-2 font-black">{String.fromCharCode(1575 + optionIndex)}.</span>{option}</button>;
                    })}
                  </div>
                </div>
              ))}
              {quizError && <p className="rounded-xl bg-red-500/10 p-3 text-sm text-red-600">{quizError}</p>}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-sm text-muted-foreground">{Object.keys(quizAnswers).length} من {quizQuestions.length} تمت الإجابة عنها</span>
                <Button type="button" onClick={submitQuiz} disabled={quizSubmitting || quizQuestions.length === 0} className="rounded-xl bg-primary px-6 font-bold">{quizSubmitting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}تصحيح الاختبار</Button>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center">
              <div className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full text-2xl font-black ${quizResult.passed ? 'bg-emerald-500/15 text-emerald-600' : 'bg-amber-500/15 text-amber-600'}`}>{quizResult.score}%</div>
              <h3 className="mt-5 text-2xl font-black text-foreground">{quizResult.passed ? 'أحسنت! اجتزت الاختبار' : 'بداية جيدة، راجع الشرح وحاول مرة أخرى'}</h3>
              <p className="mt-2 text-sm text-muted-foreground">أجبت بشكل صحيح عن {quizResult.correctAnswers} من {quizResult.totalQuestions} أسئلة · درجة النجاح {quizResult.passingScore}%</p>
              <Button type="button" onClick={closeQuiz} className="mt-6 rounded-xl">إغلاق</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
