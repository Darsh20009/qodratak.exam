import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, BookOpen, CheckCircle2, CircleAlert, Clock3, Loader2, RotateCcw, Target, Trophy } from "lucide-react";
import { QiyasExamLayout } from "@/components/QiyasExamLayout";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  useFoundationLearningPath,
  type FoundationCoverageTest,
  type FoundationCoverageTestResult,
} from "@/hooks/use-student";

type Difficulty = "mixed" | "beginner" | "intermediate" | "advanced";

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
}

async function readError(response: Response) {
  try {
    const body = await response.json();
    return body?.message || body?.error || "تعذر إكمال الطلب.";
  } catch {
    return "تعذر إكمال الطلب.";
  }
}

export default function FoundationCoverageTestPage() {
  const [, setLocation] = useLocation();
  const queryString = useSearch();
  const params = new URLSearchParams(queryString);
  const requestedSubjectId = params.get("subjectId");
  const subjectId = requestedSubjectId === "subject.qudrat.verbal" || requestedSubjectId === "subject.qudrat.quantitative"
    ? requestedSubjectId
    : undefined;
  const category = subjectId === "subject.qudrat.verbal"
    ? "verbal"
    : subjectId === "subject.qudrat.quantitative"
      ? "quantitative"
      : undefined;
  const bookTitle = category === "verbal"
    ? "التأسيس اللفظي"
    : category === "quantitative"
      ? "التأسيس الكمي"
      : "التأسيس";
  const foundationHref = category
    ? `/foundation?program=qudrat&subject=${category}`
    : "/foundation?program=qudrat";
  const queryClient = useQueryClient();
  const { data: learningPath, refetch: refetchLearningPath } = useFoundationLearningPath(subjectId);

  const [questionCount, setQuestionCount] = useState(20);
  const [difficulty, setDifficulty] = useState<Difficulty>("mixed");
  const [test, setTest] = useState<FoundationCoverageTest | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [result, setResult] = useState<FoundationCoverageTestResult | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const startedAtRef = useRef(0);
  const questionStartedAtRef = useRef(0);
  const questionTimesRef = useRef<Record<string, number>>({});
  const submittedRef = useRef(false);

  const commitCurrentQuestionTime = useCallback(() => {
    const question = test?.questions[currentIndex];
    if (!question || !questionStartedAtRef.current) return;
    const elapsed = Math.max(0, Math.round((Date.now() - questionStartedAtRef.current) / 1000));
    questionTimesRef.current[question.id] = (questionTimesRef.current[question.id] || 0) + elapsed;
    questionStartedAtRef.current = Date.now();
  }, [currentIndex, test]);

  const startTest = async () => {
    if (!subjectId || !category) {
      setError("اختر قسمًا صالحًا قبل بدء الاختبار.");
      return;
    }
    setIsStarting(true);
    setError("");
    try {
      const response = await fetch("/api/learning/foundation-test", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, count: questionCount, difficulty }),
      });
      if (!response.ok) throw new Error(await readError(response));
      const created = await response.json() as FoundationCoverageTest;
      if (!created.questions.length) throw new Error("لا توجد أسئلة متاحة بهذا الاختيار.");
      setTest(created);
      setAnswers({});
      setCurrentIndex(0);
      setResult(null);
      setTimeLeft(created.total * 60);
      startedAtRef.current = Date.now();
      questionStartedAtRef.current = Date.now();
      questionTimesRef.current = {};
      submittedRef.current = false;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "تعذر إنشاء الاختبار.");
    } finally {
      setIsStarting(false);
    }
  };

  const submitTest = useCallback(async () => {
    if (!test || result || submittedRef.current || isSubmitting) return;
    submittedRef.current = true;
    commitCurrentQuestionTime();
    setIsSubmitting(true);
    setError("");
    const elapsedTestSeconds = Math.max(0, Math.round((Date.now() - startedAtRef.current) / 1000));
    const payload = test.questions.flatMap((question) => {
      const selectedIndex = answers[question.id];
      if (selectedIndex === undefined) return [];
      return [{
        questionId: question.id,
        selectedIndex,
        responseTime: questionTimesRef.current[question.id] || 0,
      }];
    });
    try {
      const response = await fetch("/api/mobile/test-results", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attemptId: test.attemptId, answers: payload, timeTaken: elapsedTestSeconds }),
      });
      if (!response.ok) throw new Error(await readError(response));
      const saved = await response.json() as FoundationCoverageTestResult;
      setResult(saved);
      await queryClient.invalidateQueries({ queryKey: ["/api/learning/foundation-path", subjectId] });
      await refetchLearningPath();
    } catch (caught) {
      submittedRef.current = false;
      setError(caught instanceof Error ? caught.message : "تعذر حفظ نتيجة الاختبار.");
    } finally {
      setIsSubmitting(false);
    }
  }, [answers, commitCurrentQuestionTime, isSubmitting, queryClient, refetchLearningPath, result, subjectId, test]);

  useEffect(() => {
    if (!test || result || isSubmitting) return;
    const timer = window.setInterval(() => {
      setTimeLeft((remaining) => Math.max(0, remaining - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [isSubmitting, result, test]);

  useEffect(() => {
    if (test && !result && timeLeft === 0 && !isSubmitting && !error) {
      void submitTest();
    }
  }, [error, isSubmitting, result, submitTest, test, timeLeft]);

  if (!subjectId || !category) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center gap-4 p-6 text-center" dir="rtl">
        <CircleAlert className="h-10 w-10 text-amber-600" aria-hidden="true" />
        <h1 className="text-xl font-black text-foreground">لم يتم تحديد قسم صالح للاختبار</h1>
        <p className="text-sm leading-6 text-muted-foreground">ارجع إلى التأسيس واختر القسم اللفظي أو الكمي أولًا.</p>
        <Button type="button" onClick={() => setLocation("/foundation?program=qudrat")} className="rounded-xl">
          العودة إلى أقسام التأسيس
        </Button>
      </div>
    );
  }

  const moveToQuestion = (nextIndex: number) => {
    if (!test || nextIndex < 0 || nextIndex >= test.questions.length || nextIndex === currentIndex) return;
    commitCurrentQuestionTime();
    setCurrentIndex(nextIndex);
  };

  const resetTest = () => {
    setTest(null);
    setAnswers({});
    setResult(null);
    setCurrentIndex(0);
    setTimeLeft(0);
    setError("");
    submittedRef.current = false;
  };

  if (test && !result) {
    const question = test.questions[currentIndex];
    const answeredCount = Object.keys(answers).length;
    const questionsStatus = test.questions.map((item) => ({
      answered: answers[item.id] !== undefined,
      bookmarked: false,
    }));
    return (
      <QiyasExamLayout
        examTitle={`اختبار تغطية البنك · ${bookTitle}`}
        questionNumber={currentIndex + 1}
        totalQuestions={test.total}
        sectionLabel="تدريب على أسئلة لم تُحل من قبل"
        timeLeft={timeLeft}
        isTimeUrgent={timeLeft <= 60}
        questionText={question.text}
        questionTypeLabel={question.difficulty}
        questionImageUrl={question.imageUrl || undefined}
        questionImageUrls={question.imageUrls}
        options={question.options}
        selectedAnswer={answers[question.id] ?? null}
        onSelectAnswer={(selectedIndex) => {
          setAnswers((current) => ({ ...current, [question.id]: selectedIndex }));
        }}
        questionsStatus={questionsStatus}
        currentQuestionIndex={currentIndex}
        onJumpToQuestion={moveToQuestion}
        questionId={question.id}
        onPrev={() => moveToQuestion(currentIndex - 1)}
        onNext={() => moveToQuestion(currentIndex + 1)}
        canGoPrev={currentIndex > 0}
        canGoNext={currentIndex < test.total - 1}
        isLastQuestion={currentIndex === test.total - 1}
        onFinish={() => void submitTest()}
        isFinishing={isSubmitting}
        answeredCount={answeredCount}
        topRightSlot={
          <div className="flex flex-col items-end gap-1">
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white">
              تمت الإجابة عن {answeredCount} من {test.total}
            </span>
            {error ? <span role="alert" className="max-w-56 text-right text-xs font-bold text-red-200">{error}</span> : null}
          </div>
        }
      />
    );
  }

  if (result) {
    return (
      <main className="mx-auto max-w-3xl p-5 md:p-8" dir="rtl">
        <section className="rounded-3xl border border-border bg-card p-6 text-center shadow-sm sm:p-9">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Trophy className="h-8 w-8" />
          </span>
          <p className="mt-5 text-sm font-bold text-muted-foreground">نتيجة اختبار تغطية البنك</p>
          <h1 className="mt-2 text-3xl font-black text-foreground">{result.percentage}٪</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            أجبت إجابة صحيحة عن {result.correctAnswers} من {result.totalQuestions} سؤالًا.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              ["إجابات صحيحة", result.correctAnswers],
              ["إجابات خاطئة", result.wrongAnswers],
              ["أسئلة متروكة", result.skippedQuestions],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-border bg-background p-4">
                <p className="text-xs font-bold text-muted-foreground">{label}</p>
                <p className="mt-1 text-2xl font-black text-foreground">{value}</p>
              </div>
            ))}
          </div>
          {learningPath ? (
            <div className="mt-6 rounded-2xl bg-primary/5 p-4 text-right">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="font-black text-foreground">تغطية بنك الأسئلة</span>
                <span className="font-black text-primary">{learningPath.coverage.covered.toLocaleString("ar")} من {learningPath.coverage.total.toLocaleString("ar")}</span>
              </div>
              <Progress value={learningPath.coverage.percent} className="mt-3 h-2.5" />
              <p className="mt-2 text-xs text-muted-foreground">
                الأسئلة التي أُجبت عنها تُحتسب ضمن التغطية، وتُضاف أخطاؤك إلى المراجعة المجدولة.
              </p>
            </div>
          ) : null}
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Button type="button" onClick={resetTest} className="rounded-xl font-black">
              <RotateCcw className="ml-2 h-4 w-4" /> اختبار جديد
            </Button>
            <Button type="button" variant="outline" onClick={() => setLocation(foundationHref)} className="rounded-xl font-black">
              <BookOpen className="ml-2 h-4 w-4" /> العودة إلى التأسيس
            </Button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl p-5 md:p-8" dir="rtl">
      <Button type="button" variant="ghost" onClick={() => setLocation(foundationHref)} className="mb-5 rounded-xl font-bold">
        <ArrowLeft className="ml-2 h-4 w-4" /> العودة إلى كتاب قدراتك
      </Button>
      <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
        <div className="border-b border-border bg-gradient-to-l from-primary/10 to-transparent p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Target className="h-6 w-6" />
            </span>
            <div>
              <p className="text-xs font-black text-primary">التأسيس · {bookTitle}</p>
              <h1 className="mt-1 text-2xl font-black text-foreground">اختبار تغطية بنك الأسئلة</h1>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">
                يبدأ الاختبار بأسئلة لم تجب عنها من قبل. إجاباتك الصحيحة والخاطئة تُحفظ في سجل تعلمك، وتنتقل الأخطاء إلى المراجعة المجدولة.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="space-y-5">
            <div>
              <label htmlFor="coverage-count" className="mb-2 block text-sm font-black text-foreground">عدد الأسئلة</label>
              <select
                id="coverage-count"
                value={questionCount}
                onChange={(event) => setQuestionCount(Number(event.target.value))}
                className="h-12 w-full rounded-xl border border-input bg-background px-3 text-sm font-bold text-foreground"
              >
                {[10, 20, 40, 60].map((count) => <option key={count} value={count}>{count} سؤالًا</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="coverage-difficulty" className="mb-2 block text-sm font-black text-foreground">مستوى الأسئلة</label>
              <select
                id="coverage-difficulty"
                value={difficulty}
                onChange={(event) => setDifficulty(event.target.value as Difficulty)}
                className="h-12 w-full rounded-xl border border-input bg-background px-3 text-sm font-bold text-foreground"
              >
                <option value="mixed">متنوع</option>
                <option value="beginner">تأسيسي</option>
                <option value="intermediate">متوسط</option>
                <option value="advanced">متقدم</option>
              </select>
            </div>
            {error ? <p role="alert" className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-sm font-bold text-destructive">{error}</p> : null}
            <Button type="button" onClick={() => void startTest()} disabled={isStarting} className="h-12 w-full rounded-xl font-black">
              {isStarting ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="ml-2 h-4 w-4" />}
              ابدأ الاختبار
            </Button>
          </div>

          <aside className="rounded-2xl border border-border bg-background p-4">
            <div className="flex items-center gap-2">
              <Clock3 className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-black text-foreground">تغطية البنك</h2>
            </div>
            {learningPath ? (
              <>
                <p className="mt-3 text-2xl font-black text-foreground">{learningPath.coverage.percent}٪</p>
                <Progress value={learningPath.coverage.percent} className="mt-2 h-2.5" />
                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                  أجبت عن {learningPath.coverage.covered.toLocaleString("ar")} من {learningPath.coverage.total.toLocaleString("ar")} سؤالًا متاحًا.
                  {learningPath.coverage.remaining > 0 ? ` بقي ${learningPath.coverage.remaining.toLocaleString("ar")} سؤالًا لم تغطّه بعد.` : " غطيت جميع الأسئلة المتاحة مرة واحدة."}
                </p>
              </>
            ) : (
              <p className="mt-3 text-xs leading-5 text-muted-foreground">تظهر نسبة التغطية بعد تحميل بيانات المسار.</p>
            )}
            <p className="mt-4 border-t border-border pt-3 text-xs leading-5 text-muted-foreground">
              لكل سؤال دقيقة تقريبًا. عند انتهاء الوقت تُحفظ إجاباتك الحالية وتُحسب الأسئلة الأخرى متروكة.
            </p>
          </aside>
        </div>
      </section>
    </main>
  );
}