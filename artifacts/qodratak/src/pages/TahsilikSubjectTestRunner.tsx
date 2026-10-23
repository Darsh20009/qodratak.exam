import { useEffect, useRef, useState } from "react";
import ExamLearningReport from '@/components/exam-results/ExamLearningReport';
import { useExamQuestionTiming, examQuestionSeconds } from '@/lib/examTiming';
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, CheckCircle2, Clock3, FileText, Loader2, Trophy } from "lucide-react";

interface SubjectTestStart {
  attemptId: string;
  mode?: "unscored";
  subject: string;
  label: string;
  questionCount: number;
  timeLimitMinutes: number;
  personalizationMode?: "diagnostic" | "weakness_focus";
  rationale: string;
  focusSubcategories?: string[];
  questions: Array<{
    id: string;
    text: string;
    options: string[];
    subcategory: string;
    topic: string;
    difficulty: string;
    imageUrl?: string | null;
  }>;
}
interface SubjectTestResult {
  attemptId: string;
  subject: string;
  subjectId: string;
  testResultId?: string;
  label: string;
  totalQuestions: number;
  answeredQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  skippedQuestions: number;
  percentage: number;
  grade: string;
  personalizationMode: "diagnostic" | "weakness_focus";
  focusSubcategories: string[];
  questions: Array<{
    id: string;
    text: string;
    options: string[];
    subcategory: string;
    topic: string;
    difficulty: string;
    imageUrl?: string | null;
    selectedOptionIndex: number | null;
    correctOptionIndex: number;
    isCorrect: boolean | null;
    explanation: string;
  }>;
}
interface UnscoredPracticeResult {
  attemptId: string;
  subject: string;
  label: string;
  totalQuestions: number;
  answeredQuestions: number;
  skippedQuestions: number;
  durationSeconds: number;
  completedAt: string;
  unscored: true;
  questions: Array<{
    id: string;
    text: string;
    options: string[];
    subcategory: string;
    topic: string;
    difficulty: string;
    selectedOptionIndex: number | null;
    responseTimeSeconds: number;
    sourceBook: string;
    sourcePage: number;
    imageUrl?: string | null;
  }>;
}

function errorMessage(error: unknown): string {
  if (!(error instanceof Error)) return "تعذر إرسال الاختبار.";
  try {
    const payload = JSON.parse(error.message.slice(error.message.indexOf(":") + 1).trim());
    return payload.error || error.message;
  } catch {
    return error.message;
  }
}

function formatTime(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

function formatDuration(seconds: number) {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  return `${Math.floor(safeSeconds / 60)} دقيقة و${safeSeconds % 60} ثانية`;
}

export default function TahsilikSubjectTestRunner() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [test, setTest] = useState<SubjectTestStart | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [started, setStarted] = useState(false);
  const [result, setResult] = useState<SubjectTestResult | null>(null);
  const [unscoredResult, setUnscoredResult] = useState<UnscoredPracticeResult | null>(null);
  const [unscoredQuestionTimes, setUnscoredQuestionTimes] = useState<Record<string, number>>({});
  const submitLock = useRef(false);
  const timeoutHandled = useRef(false);
  const activeUnscoredTimer = useRef<{ questionId: string; startedAt: number } | null>(null);
  const timedQuestion = test?.questions[currentIndex];
  const isUnscoredPractice = test?.mode === "unscored";
  useExamQuestionTiming(
    timedQuestion,
    timedQuestion ? answers[timedQuestion.id] ?? null : null,
    started && !result && !unscoredResult && !isUnscoredPractice,
    test?.label || 'اختبار مادة',
  );
  useEffect(() => {
    if (!started || !isUnscoredPractice || !timedQuestion) {
      activeUnscoredTimer.current = null;
      return;
    }
    const questionId = timedQuestion.id;
    activeUnscoredTimer.current = { questionId, startedAt: performance.now() };
    return () => {
      const active = activeUnscoredTimer.current;
      if (active?.questionId !== questionId) return;
      const elapsed = Math.max(0, (performance.now() - active.startedAt) / 1000);
      activeUnscoredTimer.current = null;
      setUnscoredQuestionTimes((previous) => ({
        ...previous,
        [questionId]: (previous[questionId] || 0) + elapsed,
      }));
    };
  }, [started, isUnscoredPractice, timedQuestion?.id]);
  const unscoredQuestionSeconds = (questionId: string) => {
    const accumulated = unscoredQuestionTimes[questionId] || 0;
    const active = activeUnscoredTimer.current;
    if (!active || active.questionId !== questionId) return Math.round(accumulated);
    return Math.round(accumulated + Math.max(0, (performance.now() - active.startedAt) / 1000));
  };

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!test) throw new Error("جلسة الاختبار غير موجودة.");
      if (test.mode === "unscored") {
        const response = await apiRequest("POST", "/api/tahsili/unscored-practice/submit", {
          attemptId: test.attemptId,
          timeTakenSeconds: Math.max(0, test.timeLimitMinutes * 60 - timeLeft),
          answers: test.questions.map((question) => ({
            questionId: question.id,
            selectedOptionIndex: answers[question.id] ?? null,
            responseTime: unscoredQuestionSeconds(question.id),
          })),
        });
        return { kind: "unscored" as const, value: await response.json() as UnscoredPracticeResult };
      }
      const response = await apiRequest("POST", "/api/tahsili/subject-tests/submit", {
        attemptId: test.attemptId,
        timeTakenSeconds: Math.max(0, test.timeLimitMinutes * 60 - timeLeft),
        answers: test.questions.map((question) => ({
          questionId: question.id,
          selectedOptionIndex: answers[question.id] ?? null,
          responseTime: examQuestionSeconds(question.id),
        })),
      });
      return { kind: "scored" as const, value: await response.json() as SubjectTestResult };
    },
    onSuccess: (saved) => {
      setStarted(false);
      sessionStorage.removeItem("tahsiliSubjectTestStart");
      if (saved.kind === "unscored") {
        setUnscoredResult(saved.value);
        void queryClient.invalidateQueries({ queryKey: ["/api/tahsili/unscored-practice/history"] });
        toast({
          title: "تم حفظ سجل التدريب",
          description: "حُفظت إجاباتك وأوقاتها فقط، دون تصحيح أو درجة.",
        });
      } else {
        setResult(saved.value);
        void queryClient.invalidateQueries({ queryKey: ["/api/student/learning-coach"] });
        void queryClient.invalidateQueries({ queryKey: ["/api/tahsili/subject-tests/overview"] });
        void queryClient.invalidateQueries({ queryKey: ["/api/student/dashboard"] });
        void queryClient.invalidateQueries({ queryKey: ["/api/student/tahsili/results"] });
        toast({
          title: "تم حفظ الاختبار",
          description: `نتيجتك ${saved.value.percentage}%، وأضيفت الإجابات إلى سجل تعلمك.`,
        });
      }
    },
    onError: (error) => {
      submitLock.current = false;
      toast({ title: "تعذر حفظ الاختبار", description: errorMessage(error), variant: "destructive" });
    },
  });

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("tahsiliSubjectTestStart");
      if (!raw) return;
      const saved = JSON.parse(raw) as SubjectTestStart;
      if (!saved.attemptId || !Array.isArray(saved.questions) || saved.questions.length === 0) {
        throw new Error("Invalid test.");
      }
      setTest(saved);
      setTimeLeft(saved.timeLimitMinutes * 60);
    } catch {
      sessionStorage.removeItem("tahsiliSubjectTestStart");
    }
  }, []);

  const submitTest = () => {
    if (!test || submitLock.current || result || unscoredResult) return;
    submitLock.current = true;
    submitMutation.mutate();
  };

  useEffect(() => {
    if (!started || result || unscoredResult || submitMutation.isPending || timeLeft <= 0) return;
    const timer = window.setInterval(() => setTimeLeft((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [started, result, submitMutation.isPending, timeLeft]);

  useEffect(() => {
    if (started && timeLeft === 0 && !timeoutHandled.current && !result && !unscoredResult && !submitMutation.isPending) {
      timeoutHandled.current = true;
      submitTest();
    }
  }, [started, timeLeft, result, submitMutation.isPending]);

  if (!test) {
    return (
      <main className="qodratak-tahsili-surface flex min-h-[70vh] items-center justify-center px-4" dir="rtl">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>لا توجد جلسة اختبار مفتوحة</CardTitle>
            <CardDescription>
              ارجع لاختيار المادة وابدأ اختبارًا جديدًا. لا تُحفظ مفاتيح الإجابة في المتصفح.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setLocation("/tahsilik/tests/subject")}>
              <ArrowRight className="ml-2 h-4 w-4" /> اختيار المادة
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (unscoredResult) {
    return (
      <main className="qodratak-tahsili-surface min-h-[100dvh] px-4 py-8" dir="rtl">
        <div className="mx-auto max-w-4xl space-y-6">
          <Card className="border-amber-500/30 bg-amber-500/[0.04]">
            <CardContent className="py-8 text-center">
              <FileText className="mx-auto mb-3 h-11 w-11 text-amber-600" />
              <h1 className="text-2xl font-black">ملخص تدريب {unscoredResult.label}</h1>
              <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                هذا التدريب غير مصحح لأن مفاتيح إجاباته لم تراجع بعد. لا توجد درجة أو نسبة أو تحديد للصحيح والخطأ.
              </p>
              <div className="mx-auto mt-5 grid max-w-2xl gap-3 sm:grid-cols-3">
                <div className="rounded-xl bg-background/70 p-4">
                  <p className="text-2xl font-black">{unscoredResult.answeredQuestions}</p>
                  <p className="text-sm text-muted-foreground">إجابات مسجلة</p>
                </div>
                <div className="rounded-xl bg-background/70 p-4">
                  <p className="text-2xl font-black">{unscoredResult.skippedQuestions}</p>
                  <p className="text-sm text-muted-foreground">أسئلة دون إجابة</p>
                </div>
                <div className="rounded-xl bg-background/70 p-4">
                  <p className="flex items-center justify-center gap-2 text-lg font-black">
                    <Clock3 className="h-5 w-5" /> {formatDuration(unscoredResult.durationSeconds)}
                  </p>
                  <p className="text-sm text-muted-foreground">الوقت الكلي</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <section className="space-y-3" aria-label="سجل اختيارات التدريب">
            <h2 className="text-xl font-bold">اختياراتك ووقتك لكل سؤال</h2>
            {unscoredResult.questions.map((question, index) => (
              <Card key={question.id}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base leading-7">
                    {index + 1}. {question.text}
                  </CardTitle>
                  <CardDescription>{question.subcategory} · {question.sourceBook} · صفحة {question.sourcePage}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {question.imageUrl && (
                    <div className="mb-3 flex items-center justify-center overflow-hidden rounded-xl bg-white p-3">
                      <img src={question.imageUrl} alt={`صورة السؤال ${index + 1}`} className="max-h-[45vh] max-w-full object-contain" loading="lazy" />
                    </div>
                  )}
                  {question.options.map((option, optionIndex) => (
                    <div
                      key={`${question.id}-${optionIndex}`}
                      className={`rounded-lg border px-3 py-2 text-sm ${
                        optionIndex === question.selectedOptionIndex ? "border-primary bg-primary/5 font-semibold" : "border-border"
                      }`}
                    >
                      {option}
                      {optionIndex === question.selectedOptionIndex && " — اختيارك"}
                    </div>
                  ))}
                  <p className="flex items-center gap-2 pt-1 text-sm text-muted-foreground">
                    <Clock3 className="h-4 w-4" />
                    {question.selectedOptionIndex === null
                      ? `لم تتم الإجابة · الوقت: ${formatDuration(question.responseTimeSeconds)}`
                      : `وقت السؤال: ${formatDuration(question.responseTimeSeconds)}`}
                  </p>
                </CardContent>
              </Card>
            ))}
          </section>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => setLocation("/tahsilik/tests/subject")}>تدريب آخر</Button>
            <Button variant="outline" onClick={() => setLocation("/tahsilik")}>العودة للتحصيلي</Button>
          </div>
        </div>
      </main>
    );
  }

  if (result) {
    return (
      <main className="qodratak-tahsili-surface min-h-[100dvh] px-4 py-8" dir="rtl">
        <div className="mx-auto max-w-4xl space-y-6">
          <ExamLearningReport />
          <Card>
            <CardContent className="py-8 text-center">
              <Trophy className="mx-auto mb-3 h-12 w-12 text-amber-500" />
              <h1 className="text-2xl font-black">نتيجة اختبار {result.label}</h1>
              <div className="mx-auto my-5 flex h-28 w-28 items-center justify-center rounded-full border-8 border-primary/20 text-3xl font-black text-primary">
                {Math.round(result.percentage)}%
              </div>
              <p className="text-xl font-bold">{result.grade}</p>
              <p className="mt-2 text-muted-foreground">
                {result.correctAnswers} صحيحة، {result.wrongAnswers} خاطئة، {result.skippedQuestions} دون إجابة من أصل {result.totalQuestions}
              </p>
              {result.focusSubcategories.length > 0 && (
                <p className="mx-auto mt-4 max-w-2xl text-sm text-muted-foreground">
                  ركّز الاختبار على المجالات التي ظهرت فيها أخطاء متكررة: {result.focusSubcategories.join("، ")}.
                </p>
              )}
            </CardContent>
          </Card>
          <section className="space-y-3" aria-label="مراجعة الإجابات">
            <h2 className="text-xl font-bold">مراجعة الإجابات</h2>
            {result.questions.map((question, index) => (
              <Card key={question.id}>
                <CardHeader className="pb-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                  <CardTitle className="text-base leading-7">
                    {index + 1}. {question.imageUrl ? <span className="sr-only">{question.text}</span> : question.text}
                  </CardTitle>
                    <Badge variant={question.isCorrect ? "default" : question.isCorrect === false ? "destructive" : "secondary"}>
                      {question.isCorrect ? "صحيحة" : question.isCorrect === false ? "تحتاج مراجعة" : "لم تتم الإجابة"}
                    </Badge>
                  </div>
                  <CardDescription>{question.subcategory} · {question.topic}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {question.imageUrl && (
                    <div className="mb-4 flex items-center justify-center overflow-hidden rounded-xl bg-white p-3">
                      <img src={question.imageUrl} alt={`صورة السؤال ${index + 1}`} className="max-h-[55vh] max-w-full object-contain" loading="lazy" />
                    </div>
                  )}
                  {question.options.map((option, optionIndex) => (
                    <div
                      key={`${question.id}-${optionIndex}`}
                      className={`rounded-lg border px-3 py-2 text-sm ${
                        optionIndex === question.correctOptionIndex
                          ? "border-emerald-500 bg-emerald-500/10 font-semibold"
                          : optionIndex === question.selectedOptionIndex
                            ? "border-destructive bg-destructive/5"
                            : "border-border"
                      }`}
                    >
                      {option}
                      {optionIndex === question.correctOptionIndex && " — الإجابة الصحيحة"}
                      {optionIndex === question.selectedOptionIndex && optionIndex !== question.correctOptionIndex && " — إجابتك"}
                    </div>
                  ))}
                  {question.explanation && <p className="rounded-lg bg-muted p-3 text-sm leading-6">{question.explanation}</p>}
                </CardContent>
              </Card>
            ))}
          </section>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => setLocation("/tahsilik/tests/subject")}>اختبار مادة أخرى</Button>
            <Button variant="outline" onClick={() => setLocation("/tahsilik")}>العودة للتحصيلي</Button>
          </div>
        </div>
      </main>
    );
  }

  if (!started) {
    return (
      <main className="qodratak-tahsili-surface flex min-h-[70vh] items-center justify-center px-4 py-8" dir="rtl">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="text-2xl">{test.label}</CardTitle>
            <CardDescription>{test.rationale}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">
                {test.questionCount} سؤالًا {test.mode === "unscored" ? "قيد المراجعة" : "معتمدًا"}
              </Badge>
              <Badge variant="secondary">{test.timeLimitMinutes} دقيقة</Badge>
              {(test.focusSubcategories || []).map((area) => <Badge key={area} variant="outline">{area}</Badge>)}
            </div>
            <p className="text-sm text-muted-foreground">
              {test.mode === "unscored"
                ? "هذا تدريب بلا تصحيح أو درجة. سيُحفظ اختيارك والوقت لكل سؤال فقط، ويمكنك تخطي أي سؤال."
                : "لن تظهر الإجابات الصحيحة إلا بعد إرسال الاختبار. يمكنك تخطي أي سؤال وسيُحتسب ضمن الأسئلة غير المجابة."}
            </p>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" onClick={() => setStarted(true)}>
                <ArrowRight className="ml-2 h-4 w-4" /> ابدأ الاختبار
              </Button>
              <Button variant="outline" onClick={() => setLocation("/tahsilik/tests/subject")}>العودة للمواد</Button>
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  const question = test.questions[currentIndex];
  return (
    <main className="qodratak-tahsili-surface min-h-[100dvh] px-4 py-8" dir="rtl">
      <div className="mx-auto max-w-3xl space-y-5">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black">{test.label}</h1>
            <p className="text-sm text-muted-foreground">
              {test.mode === "unscored" && <span className="ml-2 rounded-full bg-amber-500/10 px-2 py-1 text-amber-700">تدريب غير مصحح</span>}
              السؤال {currentIndex + 1} من {test.questions.length} · تمت الإجابة عن {Object.keys(answers).length}
            </p>
          </div>
          <Badge variant={timeLeft < 120 ? "destructive" : "secondary"} className="px-3 py-2 text-base">
            <Clock3 className="ml-2 h-4 w-4" /> {formatTime(timeLeft)}
          </Badge>
        </header>
        <Progress value={((currentIndex + 1) / test.questions.length) * 100} />
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <CardTitle className="text-xl leading-8">
                {question.imageUrl ? <span className="sr-only">{question.text}</span> : question.text}
              </CardTitle>
              <Badge variant="outline">{question.subcategory}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {question.imageUrl && (
              <div className="flex items-center justify-center overflow-hidden rounded-xl bg-white p-3">
                <img src={question.imageUrl} alt={`صورة السؤال ${currentIndex + 1}`} className="max-h-[55vh] max-w-full object-contain" />
              </div>
            )}
            {question.options.map((option, optionIndex) => {
              const selected = answers[question.id] === optionIndex;
              return (
                <button
                  key={`${question.id}-${optionIndex}`}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setAnswers((previous) => ({ ...previous, [question.id]: optionIndex }))}
                  className={`w-full rounded-xl border p-4 text-right transition ${
                    selected ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:border-primary/50 hover:bg-muted/50"
                  }`}
                >
                  <span className="ml-3 inline-flex h-7 w-7 items-center justify-center rounded-full bg-muted text-sm font-bold">
                    {String.fromCharCode(65 + optionIndex)}
                  </span>
                  {option}
                </button>
              );
            })}
          </CardContent>
        </Card>
        <div className="flex flex-wrap justify-between gap-3">
          <Button variant="outline" disabled={currentIndex === 0 || submitMutation.isPending} onClick={() => setCurrentIndex((index) => Math.max(0, index - 1))}>
            السابق
          </Button>
          {currentIndex < test.questions.length - 1 ? (
            <Button disabled={submitMutation.isPending} onClick={() => setCurrentIndex((index) => index + 1)}>
              التالي <ArrowLeft className="mr-2 h-4 w-4" />
            </Button>
          ) : (
            <Button disabled={submitMutation.isPending} onClick={submitTest}>
              {submitMutation.isPending ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="ml-2 h-4 w-4" />}
              إنهاء الاختبار
            </Button>
          )}
        </div>
        {timeLeft === 0 && submitMutation.isError && (
          <Button className="w-full" onClick={submitTest} disabled={submitMutation.isPending}>إعادة محاولة حفظ النتيجة</Button>
        )}
        {submitMutation.isError && <p role="alert" className="text-sm text-destructive">{errorMessage(submitMutation.error)}</p>}
      </div>
    </main>
  );
}
