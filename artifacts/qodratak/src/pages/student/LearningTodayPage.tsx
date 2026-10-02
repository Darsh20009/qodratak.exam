import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useSearch } from "wouter";
import {
  ArrowLeft,
  BookOpen,
  Check,
  CheckCircle2,
  CircleAlert,
  Clock3,
  Loader2,
  Pause,
  Play,
  RotateCcw,
  Send,
} from "lucide-react";
import {
  StudentApiError,
  useCompleteTodayLearningSession,
  useSelectTodayLearningContent,
  useStartTodayLearningSession,
  useSubmitTodayLearningAnswer,
  useTodayLearningSession,
  useUpdateTodayLearningStep,
  type TodayContentSelection,
  type TodayLearningPlan,
  type TodayLearningStep,
  type TodayQuestion,
} from "@/hooks/use-student";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { foundationHrefForScope } from "@/lib/foundationRoutes.mjs";

function isUnauthorized(error: unknown) {
  return error instanceof StudentApiError && error.status === 401;
}

function userFacingError(error: unknown, fallback: string) {
  if (error instanceof StudentApiError) {
    if (error.code === "CONTENT_UNAVAILABLE" || error.code === "NO_SUITABLE_CONTENT" || error.code === "PRACTICE_UNAVAILABLE") {
      return "لا يوجد محتوى مناسب لهذه الخطوة حاليًا. سنترك القرار للنظام بدلًا من نقلك إلى نشاط غير مرتبط.";
    }
    return error.status === 401 ? "انتهت جلسة تسجيل الدخول." : error.message || fallback;
  }
  return error instanceof Error ? error.message : fallback;
}

function stepLabel(stepType: TodayLearningStep["stepType"]) {
  switch (stepType) {
    case "READ":
      return "اقرأ الفكرة";
    case "EXAMPLE":
      return "شاهد المثال";
    case "PRACTICE":
      return "تدرّب";
    case "CORRECT":
      return "صحّح طريقة الحل";
    case "SIMILAR":
      return "جرّب سؤالًا مشابهًا";
    case "MASTERY_CHECK":
      return "تحقق من فهمك";
    case "REFLECT":
      return "راجع ما تعلمته";
    default:
      return "أكمل الخطوة";
  }
}

function decisionLabel(decision?: string) {
  switch (decision) {
    case "REVIEW":
      return "مراجعة سريعة";
    case "RECOVERY":
      return "نكمل من حيث توقفت";
    case "ADVANCE":
      return "خطوتك التعليمية التالية";
    case "MASTERY_CHECK":
      return "تحقق من ثبات فهمك";
    case "PRACTICE":
      return "تدرّب على ما يحتاج دعمًا";
    case "CORRECT":
      return "افهم الخطأ وصححه";
    default:
      return "خطوتك التالية";
  }
}

function LoadingState({ label = "نجهز مهمتك..." }: { label?: string }) {
  return (
    <div className="flex min-h-[55vh] items-center justify-center p-6" dir="rtl">
      <div className="flex items-center gap-3 text-sm font-bold text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin text-primary" aria-hidden="true" />
        {label}
      </div>
    </div>
  );
}

function AuthState() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center" dir="rtl">
      <CircleAlert className="h-10 w-10 text-amber-600" aria-hidden="true" />
      <h1 className="mt-4 text-xl font-black text-foreground">انتهت جلسة تسجيل الدخول</h1>
      <p className="mt-2 max-w-sm text-sm leading-7 text-muted-foreground">سجّل الدخول من جديد للوصول إلى مهمة اليوم.</p>
      <Button asChild className="mt-5 rounded-xl">
        <Link href="/login">الانتقال إلى تسجيل الدخول</Link>
      </Button>
    </div>
  );
}

function UnavailableState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <section className="rounded-3xl border border-dashed border-border bg-card p-7 text-center" dir="rtl">
      <CircleAlert className="mx-auto h-9 w-9 text-amber-600" aria-hidden="true" />
      <h2 className="mt-4 text-lg font-black text-foreground">لا نستطيع إكمال هذه الخطوة الآن</h2>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-7 text-muted-foreground">{message}</p>
      {onRetry ? (
        <Button type="button" variant="outline" onClick={onRetry} className="mt-5 rounded-xl">
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          المحاولة مرة أخرى
        </Button>
      ) : null}
    </section>
  );
}

function SessionHeader({ plan, stepIndex }: { plan: TodayLearningPlan; stepIndex: number }) {
  return (
    <header className="rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-7" dir="rtl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black tracking-wide text-primary">تعلم اليوم</p>
          <h1 className="mt-2 text-2xl font-black text-foreground sm:text-3xl">{plan.title}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">{plan.sessionReason || "جلسة قصيرة بخطوات واضحة."}</p>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-muted px-3 py-2 text-xs font-black text-muted-foreground">
          <Clock3 className="h-4 w-4" aria-hidden="true" />
          {plan.estimatedMinutes} دقيقة تقريبًا
        </div>
      </div>
      <div className="mt-6">
        <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
          <span>الخطوة {Math.min(stepIndex + 1, plan.steps.length)} من {plan.steps.length}</span>
          <span>{Math.round(plan.progress || 0)}٪</span>
        </div>
        <Progress value={plan.progress || 0} className="mt-2 h-2 bg-muted [&>div]:bg-primary" />
      </div>
    </header>
  );
}

function QuestionActivity({
  question,
  result,
  selectedOption,
  submitting,
  onSelect,
  onSubmit,
  onNext,
}: {
  question: TodayQuestion;
  result: TodayContentSelection["question"] extends never ? never : { isCorrect: boolean; explanation?: string; correction?: string; nextStep?: string } | null;
  selectedOption: number | null;
  submitting: boolean;
  onSelect: (index: number) => void;
  onSubmit: () => void;
  onNext: () => void;
}) {
  return (
    <section className="rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-8" dir="rtl">
      <p className="text-xs font-black text-primary">تطبيق قصير</p>
      <h2 className="mt-2 text-xl font-black text-foreground">أجب ثم نراجع النتيجة معًا</h2>
      <p className="mt-5 text-base font-bold leading-8 text-foreground">{question.text}</p>
      {question.imageUrl ? <img src={question.imageUrl} alt="" className="mt-5 max-h-72 w-full rounded-2xl object-contain" /> : null}
      {question.imageUrls?.length ? (
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {question.imageUrls.map((imageUrl) => <img key={imageUrl} src={imageUrl} alt="" className="max-h-64 w-full rounded-2xl object-contain" />)}
        </div>
      ) : null}
      {result ? (
        <div className={cn("mt-6 rounded-2xl border p-5", result.isCorrect ? "border-emerald-200 bg-emerald-50/70" : "border-amber-200 bg-amber-50/70")}>
          <div className="flex items-start gap-3">
            <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", result.isCorrect ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-800")}>
              {result.isCorrect ? <Check className="h-5 w-5" aria-hidden="true" /> : <CircleAlert className="h-5 w-5" aria-hidden="true" />}
            </span>
            <div>
              <h3 className="font-black text-foreground">{result.isCorrect ? "إجابتك صحيحة" : "راجع طريقة التفكير"}</h3>
              <p className="mt-1 text-sm leading-7 text-muted-foreground">{result.explanation || result.correction || result.nextStep || "أكمل إلى الخطوة التالية."}</p>
            </div>
          </div>
          <Button type="button" onClick={onNext} className="mt-5 min-h-11 rounded-xl bg-[#0D1B2A] px-5 text-white hover:bg-[#0D1B2A]/90">
            التالي
            <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      ) : (
        <>
          <fieldset className="mt-6 grid gap-3">
            <legend className="sr-only">خيارات الإجابة</legend>
            {question.options.map((option, index) => (
              <button
                key={`${question.questionId}-${index}`}
                type="button"
                aria-pressed={selectedOption === index}
                onClick={() => onSelect(index)}
                className={cn(
                  "flex min-h-12 items-center gap-3 rounded-xl border px-4 py-3 text-right text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                  selectedOption === index ? "border-primary bg-primary/10 text-foreground" : "border-border bg-background text-foreground hover:border-primary/50",
                )}
              >
                <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs", selectedOption === index ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>{index + 1}</span>
                <span>{option}</span>
              </button>
            ))}
          </fieldset>
          <Button type="button" onClick={onSubmit} disabled={selectedOption === null || submitting} className="mt-5 min-h-11 rounded-xl font-black">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Send className="h-4 w-4" aria-hidden="true" />}
            إرسال الإجابة
          </Button>
        </>
      )}
    </section>
  );
}

export default function LearningTodayPage() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const searchParams = useMemo(() => new URLSearchParams(search), [search]);
  const requestedProgram = searchParams.get("programId") || searchParams.get("program");
  const programId = requestedProgram === "qudrat" || requestedProgram === "tahsili"
    ? requestedProgram
    : undefined;
  const requestedSubject = searchParams.get("subjectId") || searchParams.get("subject");
  const subjectId = requestedSubject
    ? requestedSubject.startsWith("subject.")
      ? requestedSubject
      : programId
        ? `subject.${programId}.${requestedSubject}`
        : undefined
    : undefined;
  const todayQuery = useTodayLearningSession(true, programId, subjectId);
  const startSession = useStartTodayLearningSession();
  const updateStep = useUpdateTodayLearningStep();
  const completeSession = useCompleteTodayLearningSession();
  const selectContent = useSelectTodayLearningContent();
  const submitAnswer = useSubmitTodayLearningAnswer();
  const [selectionState, setSelectionState] = useState<{ key: string; data: TodayContentSelection } | null>(null);
  const [selectionAttemptedKey, setSelectionAttemptedKey] = useState<string | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answerResult, setAnswerResult] = useState<{ isCorrect: boolean; explanation?: string; correction?: string; nextStep?: string } | null>(null);
  const [answerAttemptId, setAnswerAttemptId] = useState<string | undefined>();

  const session = todayQuery.data;
  const plan = session?.plan || null;
  const sessionId = session?.sessionId || plan?.sessionId || "";
  const currentStep = plan?.nextStep;
  const currentStepIndex = currentStep ? Math.max(0, plan?.steps.findIndex((step) => step.stepId === currentStep.stepId) ?? 0) : 0;
  const selectionKey = sessionId && currentStep ? `${sessionId}:${currentStep.stepId}` : "";
  const selection = selectionState?.key === selectionKey ? selectionState.data : null;
  const needsSelection = Boolean(currentStep && ["READ", "EXAMPLE", "PRACTICE", "CORRECT", "SIMILAR", "MASTERY_CHECK"].includes(currentStep.stepType));
  const allStepsDone = Boolean(plan && plan.steps.length > 0 && plan.steps.every((step) => ["COMPLETED", "SKIPPED"].includes(step.status)));

  useEffect(() => {
    setSelectedOption(null);
    setAnswerResult(null);
    setAnswerAttemptId(undefined);
  }, [selectionKey]);

  useEffect(() => {
    if (!session?.started || !sessionId || !currentStep || !needsSelection || !selectionKey || selection || selectionAttemptedKey === selectionKey || selectContent.isPending) return;
    setSelectionAttemptedKey(selectionKey);
    selectContent.mutate({ sessionId, stepId: currentStep.stepId }, {
      onSuccess: (data) => setSelectionState({ key: selectionKey, data }),
    });
  }, [currentStep, needsSelection, selectContent, selection, selectionAttemptedKey, selectionKey, session?.started, sessionId]);

  useEffect(() => {
    if (!session?.started || !sessionId || !allStepsDone || completeSession.isPending || completeSession.isSuccess) return;
    completeSession.mutate({ sessionId });
  }, [allStepsDone, completeSession, session?.started, sessionId]);

  const retrySelection = () => {
    if (!sessionId || !currentStep || selectContent.isPending) return;
    setSelectionAttemptedKey(selectionKey);
    selectContent.mutate({ sessionId, stepId: currentStep.stepId, retry: true }, {
      onSuccess: (data) => setSelectionState({ key: selectionKey, data }),
    });
  };

  const completeCurrentStep = (attemptIds?: string[]) => {
    if (!sessionId || !currentStep || updateStep.isPending) return;
    updateStep.mutate({
      sessionId,
      stepId: currentStep.stepId,
      action: "complete",
      attemptIds,
    }, {
      onSuccess: () => {
        setSelectionState(null);
        setSelectionAttemptedKey(null);
      },
    });
  };

  const handleStart = () => {
    startSession.mutate({ programId, subjectId });
  };

  const handleSubmitAnswer = () => {
    if (!sessionId || !currentStep || !selection?.question || selectedOption === null || submitAnswer.isPending) return;
    submitAnswer.mutate({
      sessionId,
      stepId: currentStep.stepId,
      selectedOptionIndex: selectedOption,
    }, {
      onSuccess: (data) => {
        setAnswerResult(data.result || null);
        setAnswerAttemptId(data.attemptId || data.attempt?.id);
      },
    });
  };

  const pageError = todayQuery.error || startSession.error || completeSession.error;
  const planStatusMessage = useMemo(() => {
    if (!plan) return null;
    if (plan.planStatus === "DIAGNOSTIC_REQUIRED") {
      const tahsiliPlan = programId === "tahsili" || plan.programId === "program.tahsili";
      return tahsiliPlan
        ? "اختر مادة التحصيلي من مساحة التأسيس لعرض الدروس والتدريب المناسبين."
        : "أكمل التقييم القصير في مساحة التأسيس أولًا، ثم سنبني لك مهمة مناسبة.";
    }
    if (plan.planStatus === "CONTENT_UNAVAILABLE" || plan.planStatus === "NO_RECOMMENDATION") return "لا توجد خطوة تعليمية مناسبة الآن. جرّب العودة لاحقًا بعد توفر محتوى جديد.";
    return null;
  }, [plan, programId]);

  const planProgram = plan?.programId === "program.tahsili"
    ? "tahsili"
    : plan?.programId === "program.qudrat"
      ? "qudrat"
      : programId;
  const planSubjectId = subjectId || plan?.subjectId;
  const foundationHref = foundationHrefForScope(planProgram, planSubjectId);

  if (todayQuery.isLoading) return <LoadingState />;
  if (isUnauthorized(todayQuery.error) || isUnauthorized(startSession.error)) return <AuthState />;
  if (todayQuery.isError && !session) {
    return (
      <div className="mx-auto max-w-2xl p-5 md:p-8" dir="rtl">
        <UnavailableState message={userFacingError(todayQuery.error, "تعذر تحميل مهمة اليوم.")} onRetry={() => void todayQuery.refetch()} />
      </div>
    );
  }

  if (!session || !plan) {
    return (
      <div className="mx-auto max-w-2xl p-5 md:p-8" dir="rtl">
        <UnavailableState message="لا توجد مهمة جاهزة الآن. سنعرض لك مهمة عندما يحدد النظام خطوة مناسبة." />
      </div>
    );
  }

  const isCompleted = plan.state === "COMPLETED" || completeSession.data?.plan?.state === "COMPLETED";
  const canStart = !session.started && plan.planStatus === "READY";
  const selectionError = selectContent.error || submitAnswer.error;
  const isQuestionStep = Boolean(selection?.question && currentStep && ["PRACTICE", "CORRECT", "SIMILAR", "MASTERY_CHECK"].includes(currentStep.stepType));
  const selectedFoundation = selection?.foundationContent;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-5 p-5 pb-10 md:p-8" dir="rtl">
      <div className="flex items-center justify-between gap-3">
        <Link href="/" className="inline-flex min-h-11 items-center gap-2 rounded-xl px-2 text-sm font-bold text-muted-foreground hover:bg-muted hover:text-foreground">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          لوحة الطالب
        </Link>
        {session.started && !isCompleted ? (
          <button
            type="button"
            onClick={() => sessionId && updateStep.mutate({ sessionId, action: "pause" })}
            disabled={updateStep.isPending}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-bold text-muted-foreground hover:bg-muted"
          >
            <Pause className="h-4 w-4" aria-hidden="true" />
            حفظ التقدم
          </button>
        ) : null}
      </div>

      {isCompleted ? (
        <section className="rounded-3xl border border-emerald-200 bg-emerald-50/70 p-8 text-center sm:p-12">
          <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-700" aria-hidden="true" />
          <h1 className="mt-5 text-2xl font-black text-foreground">اكتمل درس اليوم</h1>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">أنجزت الخطوات الأساسية لهذه الجلسة. يمكنك العودة غدًا بخطوة جديدة.</p>
          <div className="mx-auto mt-6 max-w-sm">
            <div className="flex items-center justify-between text-xs font-bold text-muted-foreground"><span>تقدم اليوم</span><span>{Math.round(plan.progress || 100)}٪</span></div>
            <Progress value={plan.progress || 100} className="mt-2 h-2 [&>div]:bg-emerald-600" />
          </div>
          <Button asChild className="mt-7 rounded-xl">
            <Link href="/">العودة إلى لوحتي</Link>
          </Button>
        </section>
      ) : canStart ? (
        <section className="rounded-3xl border border-primary/20 bg-primary/5 p-6 sm:p-9">
          <p className="text-xs font-black text-primary">خطوتك التالية</p>
          <h1 className="mt-3 text-2xl font-black text-foreground sm:text-3xl">{plan.title}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-8 text-muted-foreground">{plan.sessionReason || "جلسة قصيرة تساعدك على التقدم خطوة واحدة واضحة."}</p>
          <div className="mt-6 flex flex-wrap items-center gap-3 text-sm font-bold text-muted-foreground">
            <span className="inline-flex items-center gap-2 rounded-full bg-card px-3 py-2"><Clock3 className="h-4 w-4" />{plan.estimatedMinutes} دقيقة تقريبًا</span>
            <span>{plan.steps.length} خطوات</span>
          </div>
          <Button type="button" onClick={handleStart} disabled={startSession.isPending} className="mt-7 min-h-12 rounded-xl px-6 font-black">
            {startSession.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            ابدأ الآن
          </Button>
          {startSession.isError ? <p className="mt-3 text-sm font-bold text-destructive">{userFacingError(startSession.error, "تعذر بدء الجلسة.")}</p> : null}
        </section>
      ) : planStatusMessage ? (
        <section className="rounded-3xl border border-border bg-card p-7 text-center">
          <BookOpen className="mx-auto h-10 w-10 text-primary" aria-hidden="true" />
          <h1 className="mt-4 text-xl font-black text-foreground">{decisionLabel(plan.planStatus)}</h1>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-7 text-muted-foreground">{planStatusMessage}</p>
          <Button asChild className="mt-5 rounded-xl"><Link href={foundationHref}>فتح التأسيس</Link></Button>
        </section>
      ) : (
        <>
          <SessionHeader plan={plan} stepIndex={currentStepIndex} />
          <section className="rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm font-bold text-primary" aria-live="polite">
            {stepLabel(currentStep?.stepType || "REFLECT")}
          </section>
          {selectionError ? (
            <UnavailableState message={userFacingError(selectionError, "تعذر تجهيز النشاط.")} onRetry={retrySelection} />
          ) : selectContent.isPending ? (
            <LoadingState label="نجهز هذه الخطوة..." />
          ) : isQuestionStep && selection?.question ? (
            <QuestionActivity
              question={selection.question}
              result={answerResult}
              selectedOption={selectedOption}
              submitting={submitAnswer.isPending}
              onSelect={setSelectedOption}
              onSubmit={handleSubmitAnswer}
              onNext={() => completeCurrentStep(answerAttemptId ? [answerAttemptId] : undefined)}
            />
          ) : selectedFoundation ? (
            <section className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary"><BookOpen className="h-5 w-5" /></span>
                <div>
                  <h2 className="text-xl font-black text-foreground">{selectedFoundation.title}</h2>
                  <p className="mt-2 text-sm leading-7 text-muted-foreground">{selectedFoundation.description || "محتوى قراءة قصير ضمن مهمة اليوم."}</p>
                </div>
              </div>
              <Button asChild className="mt-6 min-h-11 rounded-xl font-black">
                <Link href={`/foundation/content/${encodeURIComponent(selectedFoundation.contentId)}?${(() => {
                  const params = new URLSearchParams({
                    from: "today",
                    sessionId,
                    stepId: currentStep?.stepId || "",
                  });
                  if (programId) params.set("program", programId);
                  if (subjectId) {
                    params.set("subjectId", subjectId);
                    params.set("subject", subjectId.replace(/^subject\.[^.]+\./, ""));
                  }
                  return params.toString();
                })()}`}>
                  <BookOpen className="h-4 w-4" />
                  {currentStep?.stepType === "EXAMPLE" ? "عرض المثال" : "أكمل القراءة"}
                  <ArrowLeft className="mr-1 h-4 w-4" />
                </Link>
              </Button>
            </section>
          ) : currentStep ? (
            <section className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
              <h2 className="text-xl font-black text-foreground">{stepLabel(currentStep.stepType)}</h2>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">أنجز هذه الخطوة ثم تابع إلى النشاط التالي.</p>
              <Button type="button" onClick={() => completeCurrentStep()} disabled={updateStep.isPending} className="mt-6 min-h-11 rounded-xl font-black">
                {updateStep.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                التالي
                <ArrowLeft className="mr-1 h-4 w-4" />
              </Button>
            </section>
          ) : null}
          {updateStep.isError ? <p className="text-sm font-bold text-destructive">{userFacingError(updateStep.error, "تعذر حفظ تقدم الخطوة.")}</p> : null}
        </>
      )}
    </div>
  );
}