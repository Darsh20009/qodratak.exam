import { useState } from "react";
import { Link } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  BrainCircuit,
  CheckCircle2,
  Circle,
  Download,
  LoaderCircle,
  LockKeyhole,
  Sparkles,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type AreaStat = {
  category: "verbal" | "quantitative";
  subcategory: string;
  totalAttempts: number;
  correctAttempts: number;
  accuracy: number;
  repeatedWrongQuestions: number;
};

type CoachReport = {
  generatedAt: string;
  evidence: {
    trustedAttempts: number;
    repeatedWrongAnswers: number;
    confidence: "low" | "medium" | "high";
  };
  strengths: AreaStat[];
  focusAreas: AreaStat[];
  guide: {
    title: string;
    summary: string;
    steps: string[];
    markdown: string;
  };
  aiAvailable: boolean;
  note: string;
};

type TestQuestion = {
  id: string;
  category: "verbal" | "quantitative" | "general";
  subcategory: string;
  text: string;
  options: string[];
  difficulty?: string;
  imageUrl?: string;
  imageUrls?: string[];
  passageText?: string;
  selectedIndex?: number;
  correctIndex?: number;
  isCorrect?: boolean;
  explanation?: string;
  tailoredFeedback?: string;
};

type DailyTest = {
  id: string;
  category: "verbal" | "quantitative" | "mixed";
  focusSubcategory: string | null;
  status: "ready" | "completed";
  score: number | null;
  totalQuestions: number;
  questions: TestQuestion[];
};

async function getJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.error || body.message || "تعذر الاتصال بالخادم.");
  }
  return body as T;
}

function categoryName(category: string) {
  if (category === "verbal") return "اللفظي";
  if (category === "quantitative") return "الكمي";
  return "الكمي واللفظي";
}

function confidenceName(confidence: CoachReport["evidence"]["confidence"]) {
  if (confidence === "high") return "بيانات كافية";
  if (confidence === "medium") return "بيانات أولية";
  return "بيانات قليلة";
}

function downloadGuide(report: CoachReport) {
  const file = new Blob([report.guide.markdown], {
    type: "text/markdown;charset=utf-8",
  });
  const href = URL.createObjectURL(file);
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.download = "خطة-مراجعتي-الشخصية.md";
  anchor.click();
  URL.revokeObjectURL(href);
}

export default function AdaptiveLearningCoach({
  trialExpired = false,
}: {
  trialExpired?: boolean;
}) {
  const queryClient = useQueryClient();
  const [isTestOpen, setIsTestOpen] = useState(false);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const report = useQuery<CoachReport>({
    queryKey: ["/api/student/learning-coach"],
    queryFn: () => getJson("/api/student/learning-coach"),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
  const dailyTest = useQuery<DailyTest>({
    queryKey: ["/api/student/daily-adaptive-test"],
    queryFn: () => getJson("/api/student/daily-adaptive-test"),
    staleTime: 60 * 1000,
    retry: 1,
    enabled: isTestOpen,
  });
  const submitTest = useMutation({
    mutationFn: () =>
      getJson<DailyTest>("/api/student/daily-adaptive-test", {
        method: "POST",
        body: JSON.stringify({
          answers: Object.entries(answers).map(([questionId, selectedIndex]) => ({
            questionId,
            selectedIndex,
          })),
        }),
      }),
    onSuccess: (result) => {
      queryClient.setQueryData(["/api/student/daily-adaptive-test"], result);
      queryClient.invalidateQueries({ queryKey: ["/api/student/learning-coach"] });
    },
  });

  const currentTest = submitTest.data || dailyTest.data;
  const isCompleted = currentTest?.status === "completed";
  const canSubmit =
    currentTest?.questions.length &&
    currentTest.questions.every((question) => Number.isInteger(answers[question.id]));

  return (
    <section
      className="overflow-hidden rounded-3xl border border-primary/15 bg-card shadow-sm"
      dir="rtl"
      data-testid="adaptive-learning-coach"
    >
      <div className="bg-gradient-to-l from-primary/10 via-primary/5 to-transparent p-5 sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <BrainCircuit className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-black text-primary">مدربك الشخصي</p>
              <h2 className="mt-1 text-xl font-black text-foreground">
                نتعلم من إجاباتك، لا من التخمين
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">
                نستخدم إجاباتك المحفوظة لتحديد المجالات التي تحتاج مراجعة، ثم نختار أسئلة قدرات من بنك المنصة.
              </p>
            </div>
          </div>
          <Button
            type="button"
            onClick={() => setIsTestOpen((open) => !open)}
            className="min-h-11 shrink-0 rounded-xl font-black"
            data-testid="button-open-daily-adaptive-test"
          >
            <Target className="ml-2 h-4 w-4" aria-hidden="true" />
            {isTestOpen ? "إخفاء اختبار اليوم" : "اختبار نقاط ضعفي اليوم"}
          </Button>
        </div>

        {trialExpired && (
          <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-amber-300/50 bg-amber-50 p-4 text-amber-950 dark:bg-amber-950/30 dark:text-amber-100 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <LockKeyhole className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
              <div>
                <p className="font-black">انتهت التجربة المجانية</p>
                <p className="mt-1 text-sm leading-6">
                  ما زالت لوحة التحكم واختبار تكيفي واحد يوميًا متاحين. اشترك لفتح بقية الصفحات.
                </p>
              </div>
            </div>
            <Link
              href="/subscription"
              className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-xl bg-amber-950 px-4 text-sm font-black text-white hover:opacity-90 dark:bg-amber-100 dark:text-amber-950"
            >
              عرض الاشتراكات
            </Link>
          </div>
        )}
      </div>

      <div className="grid gap-5 p-5 sm:p-7 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-black text-foreground">ما الذي يظهر في إجاباتك؟</h3>
            {report.data && (
              <span className="rounded-full bg-muted px-3 py-1 text-xs font-bold text-muted-foreground">
                {confidenceName(report.data.evidence.confidence)}
              </span>
            )}
          </div>
          {report.isLoading ? (
            <div className="flex min-h-24 items-center gap-3 rounded-2xl bg-muted/50 p-4 text-sm text-muted-foreground">
              <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
              نحلل الإجابات المحفوظة...
            </div>
          ) : report.isError ? (
            <div className="rounded-2xl border border-amber-300/50 bg-amber-50 p-4 text-sm leading-6 text-amber-950 dark:bg-amber-950/30 dark:text-amber-100">
              <AlertCircle className="mb-2 h-4 w-4" aria-hidden="true" />
              تعذر تحميل التحليل الآن. يظل الاختبار اليومي متاحًا، ويمكنك إعادة تحميل التحليل لاحقًا.
            </div>
          ) : report.data ? (
            <>
              <p className="text-sm leading-7 text-muted-foreground">
                {report.data.guide.summary}
              </p>
              <div className="flex flex-wrap gap-2 text-xs font-bold text-muted-foreground">
                <span className="rounded-full bg-muted px-3 py-1.5">
                  {report.data.evidence.trustedAttempts} إجابة موثقة
                </span>
                <span className="rounded-full bg-muted px-3 py-1.5">
                  {report.data.evidence.repeatedWrongAnswers} أسئلة تكرر الخطأ فيها
                </span>
                <span className="rounded-full bg-muted px-3 py-1.5">
                  {report.data.aiAvailable ? "شرح ذكي" : "شرح احتياطي من سجل المنصة"}
                </span>
              </div>
              {report.data.focusAreas.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs font-black text-muted-foreground">مجالات المراجعة</p>
                  {report.data.focusAreas.map((area) => (
                    <div
                      key={`${area.category}-${area.subcategory}`}
                      className="flex items-center justify-between gap-3 rounded-xl border border-border p-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-foreground">
                          {area.subcategory} · {categoryName(area.category)}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {area.totalAttempts} إجابات، ودقة {area.accuracy}٪
                        </p>
                      </div>
                      <span className="shrink-0 rounded-lg bg-rose-500/10 px-2.5 py-1.5 text-xs font-black text-rose-700 dark:text-rose-300">
                        {area.accuracy}٪
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl bg-muted/50 p-3 text-sm leading-6 text-muted-foreground">
                  لم تتكرر أخطاء كافية بعد لتحديد نقطة ضعف بثقة. ابدأ باختبار اليوم لبناء خط أساس.
                </div>
              )}
              {report.data.strengths.length > 0 && (
                <p className="text-sm leading-6 text-emerald-700 dark:text-emerald-300">
                  نقاط قوة ظاهرة: {report.data.strengths.map((area) => area.subcategory).join("، ")}.
                </p>
              )}
              <p className="text-xs leading-5 text-muted-foreground">{report.data.note}</p>
            </>
          ) : null}
        </div>

        <aside className="rounded-2xl border border-border bg-background p-4 sm:p-5">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
            <h3 className="font-black text-foreground">ورقة المراجعة</h3>
          </div>
          {report.data ? (
            <>
              <p className="mt-3 font-bold text-foreground">{report.data.guide.title}</p>
              <ul className="mt-3 space-y-2">
                {report.data.guide.steps.map((step, index) => (
                  <li key={`${index}-${step}`} className="flex items-start gap-2 text-sm leading-6 text-muted-foreground">
                    <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
              <Button
                type="button"
                variant="outline"
                onClick={() => downloadGuide(report.data!)}
                className="mt-4 w-full rounded-xl font-bold"
                data-testid="button-download-learning-guide"
              >
                <Download className="ml-2 h-4 w-4" aria-hidden="true" />
                تنزيل ورقة المراجعة
              </Button>
            </>
          ) : (
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              تظهر هنا خطوات مراجعة مبنية على إجاباتك. إذا تعذر الذكاء الاصطناعي، نعرض ملخصًا احتياطيًا من نتائجك.
            </p>
          )}
        </aside>
      </div>

      {isTestOpen && (
        <div className="border-t border-border p-5 sm:p-7">
          {dailyTest.isLoading ? (
            <div className="flex items-center gap-3 py-6 text-sm text-muted-foreground">
              <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
              نجهز أسئلة اليوم من بنك المنصة...
            </div>
          ) : dailyTest.isError ? (
            <div className="rounded-2xl border border-rose-300/50 bg-rose-50 p-4 text-sm leading-6 text-rose-900 dark:bg-rose-950/30 dark:text-rose-200">
              <p>{dailyTest.error instanceof Error ? dailyTest.error.message : "تعذر تجهيز الاختبار."}</p>
              <Button
                type="button"
                variant="outline"
                onClick={() => dailyTest.refetch()}
                className="mt-3 rounded-xl"
              >
                إعادة المحاولة
              </Button>
            </div>
          ) : currentTest ? (
            <div className="space-y-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-black text-primary">اختبار واحد اليوم</p>
                  <h3 className="mt-1 text-lg font-black text-foreground">
                    {currentTest.focusSubcategory
                      ? `مراجعة ${currentTest.focusSubcategory}`
                      : `قياس مبدئي في ${categoryName(currentTest.category)}`}
                  </h3>
                </div>
                <span className="text-sm font-bold text-muted-foreground">
                  {currentTest.totalQuestions} أسئلة · {categoryName(currentTest.category)}
                </span>
              </div>

              {isCompleted && (
                <div className="rounded-2xl bg-primary/5 p-4 text-center">
                  <p className="text-2xl font-black text-primary">
                    {currentTest.score} / {currentTest.totalQuestions}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">انتهى اختبار اليوم. راجع شرح كل إجابة بالأسفل.</p>
                </div>
              )}

              <div className="space-y-4">
                {currentTest.questions.map((question, questionIndex) => (
                  <article
                    key={question.id}
                    className="rounded-2xl border border-border bg-background p-4 sm:p-5"
                    data-testid={`adaptive-question-${questionIndex + 1}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-xs font-black text-primary">
                        {questionIndex + 1}. {question.subcategory} · {categoryName(question.category)}
                      </p>
                      {isCompleted && (
                        question.isCorrect
                          ? <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" aria-label="إجابة صحيحة" />
                          : <AlertCircle className="h-5 w-5 shrink-0 text-rose-600" aria-label="إجابة غير صحيحة" />
                      )}
                    </div>
                    {question.passageText && (
                      <p className="mt-3 whitespace-pre-wrap rounded-xl bg-muted/50 p-3 text-sm leading-7 text-muted-foreground">
                        {question.passageText}
                      </p>
                    )}
                    <p className="mt-3 whitespace-pre-wrap text-sm font-bold leading-7 text-foreground">
                      {question.text}
                    </p>
                    {question.imageUrl && (
                      <img
                        src={question.imageUrl}
                        alt="صورة السؤال"
                        loading="lazy"
                        className="mt-3 max-h-72 rounded-xl object-contain"
                      />
                    )}
                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                      {question.options.map((option, optionIndex) => {
                        const selected = isCompleted
                          ? question.selectedIndex === optionIndex
                          : answers[question.id] === optionIndex;
                        const correct = isCompleted && question.correctIndex === optionIndex;
                        return (
                          <button
                            key={`${question.id}-${optionIndex}`}
                            type="button"
                            disabled={isCompleted || submitTest.isPending}
                            onClick={() =>
                              setAnswers((current) => ({ ...current, [question.id]: optionIndex }))
                            }
                            className={[
                              "flex min-h-11 items-start gap-2 rounded-xl border p-3 text-right text-sm leading-6 transition-colors",
                              correct
                                ? "border-emerald-500 bg-emerald-500/10 text-foreground"
                                : selected
                                  ? "border-primary bg-primary/5 text-foreground"
                                  : "border-border hover:bg-muted/60",
                            ].join(" ")}
                            aria-pressed={selected}
                          >
                            {selected
                              ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                              : <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />}
                            <span>{option}</span>
                          </button>
                        );
                      })}
                    </div>
                    {isCompleted && (question.explanation || question.tailoredFeedback) && (
                      <div className="mt-4 space-y-2 rounded-xl bg-muted/50 p-3 text-sm leading-7">
                        {question.explanation && <p><strong>الشرح:</strong> {question.explanation}</p>}
                        {!question.isCorrect && question.tailoredFeedback && (
                          <p><strong>مراجعة مخصصة:</strong> {question.tailoredFeedback}</p>
                        )}
                      </div>
                    )}
                  </article>
                ))}
              </div>

              {!isCompleted && (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs leading-5 text-muted-foreground">
                    تُصحح الإجابات على الخادم، ويُحفظ اختبار واحد لهذا الحساب في تاريخ اليوم بتوقيت الرياض.
                  </p>
                  <Button
                    type="button"
                    onClick={() => submitTest.mutate()}
                    disabled={!canSubmit || submitTest.isPending}
                    className="min-h-11 shrink-0 rounded-xl px-5 font-black"
                    data-testid="button-submit-adaptive-test"
                  >
                    {submitTest.isPending && <LoaderCircle className="ml-2 h-4 w-4 animate-spin" aria-hidden="true" />}
                    {submitTest.isPending ? "جارٍ التصحيح..." : "إنهاء الاختبار"}
                  </Button>
                </div>
              )}
              {submitTest.isError && (
                <p role="alert" className="text-sm font-bold text-destructive">
                  {submitTest.error instanceof Error ? submitTest.error.message : "تعذر حفظ الاختبار."}
                </p>
              )}
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}
