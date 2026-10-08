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
import { ArrowLeft, ArrowRight, CheckCircle2, Clock3, Loader2, Trophy } from "lucide-react";

interface SubjectTestStart {
  attemptId: string;
  subject: string;
  label: string;
  questionCount: number;
  timeLimitMinutes: number;
  personalizationMode: "diagnostic" | "weakness_focus";
  rationale: string;
  focusSubcategories: string[];
  questions: Array<{
    id: string;
    text: string;
    options: string[];
    subcategory: string;
    topic: string;
    difficulty: string;
  }>;
}
interface SubjectTestResult {
  attemptId: string;
  subject: string;
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
    selectedOptionIndex: number | null;
    correctOptionIndex: number;
    isCorrect: boolean | null;
    explanation: string;
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
  const submitLock = useRef(false);
  const timeoutHandled = useRef(false);
  const timedQuestion = test?.questions[currentIndex];
  useExamQuestionTiming(timedQuestion, timedQuestion ? answers[timedQuestion.id] ?? null : null, started && !result, test?.label || 'اختبار مادة');

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!test) throw new Error("جلسة الاختبار غير موجودة.");
      const response = await apiRequest("POST", "/api/tahsili/subject-tests/submit", {
        attemptId: test.attemptId,
        timeTakenSeconds: Math.max(0, test.timeLimitMinutes * 60 - timeLeft),
        answers: test.questions.map((question) => ({
          questionId: question.id,
          selectedOptionIndex: answers[question.id] ?? null,
          responseTime: examQuestionSeconds(question.id),
        })),
      });
      return response.json() as Promise<SubjectTestResult>;
    },
    onSuccess: (saved) => {
      setResult(saved);
      setStarted(false);
      sessionStorage.removeItem("tahsiliSubjectTestStart");
      void queryClient.invalidateQueries({ queryKey: ["/api/student/learning-coach"] });
      void queryClient.invalidateQueries({ queryKey: ["/api/tahsili/subject-tests/overview"] });
      toast({
        title: "تم حفظ الاختبار",
        description: `نتيجتك ${saved.percentage}%، وأضيفت الإجابات إلى سجل تعلمك.`,
      });
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
    if (!test || submitLock.current || result) return;
    submitLock.current = true;
    submitMutation.mutate();
  };

  useEffect(() => {
    if (!started || result || submitMutation.isPending || timeLeft <= 0) return;
    const timer = window.setInterval(() => setTimeLeft((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [started, result, submitMutation.isPending, timeLeft]);

  useEffect(() => {
    if (started && timeLeft === 0 && !timeoutHandled.current && !result && !submitMutation.isPending) {
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
                    <CardTitle className="text-base leading-7">{index + 1}. {question.text}</CardTitle>
                    <Badge variant={question.isCorrect ? "default" : question.isCorrect === false ? "destructive" : "secondary"}>
                      {question.isCorrect ? "صحيحة" : question.isCorrect === false ? "تحتاج مراجعة" : "لم تتم الإجابة"}
                    </Badge>
                  </div>
                  <CardDescription>{question.subcategory} · {question.topic}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
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
              <Badge variant="secondary">{test.questionCount} سؤالًا معتمدًا</Badge>
              <Badge variant="secondary">{test.timeLimitMinutes} دقيقة</Badge>
              {test.focusSubcategories.map((area) => <Badge key={area} variant="outline">{area}</Badge>)}
            </div>
            <p className="text-sm text-muted-foreground">
              لن تظهر الإجابات الصحيحة إلا بعد إرسال الاختبار. يمكنك تخطي أي سؤال وسيُحتسب ضمن الأسئلة غير المجابة.
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
              <CardTitle className="text-xl leading-8">{question.text}</CardTitle>
              <Badge variant="outline">{question.subcategory}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
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
