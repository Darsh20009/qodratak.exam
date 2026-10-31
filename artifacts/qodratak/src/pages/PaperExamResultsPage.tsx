import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { AlertCircle, ArrowRight, CheckCircle2, Clock3, FileText, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type PaperExamResult = {
  _id: string;
  testType?: string;
  testName?: string;
  program?: string;
  subjectId?: string;
  totalQuestions?: number;
  correctAnswers?: number;
  wrongAnswers?: number;
  skippedQuestions?: number;
  percentage?: number;
  score?: number;
  timeTaken?: number;
  completedAt?: string;
  questionDetails?: Array<{
    questionNumber?: number;
    category?: string;
    status?: "correct" | "wrong" | "skipped" | "trial";
    userAnswer?: number | null;
    correctAnswer?: number;
  }>;
};

const answerLetters = ["أ", "ب", "ج", "د", "هـ"];
const statusText: Record<string, string> = {
  correct: "صحيح",
  wrong: "خطأ",
  skipped: "بدون إجابة",
  trial: "تجريبي",
};

function formatDate(value?: string) {
  if (!value) return "التاريخ غير متاح";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "التاريخ غير متاح"
    : date.toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric" });
}

function formatDuration(seconds?: number) {
  if (!Number.isFinite(seconds) || !seconds || seconds < 0) return "غير متاح";
  const minutes = Math.round(seconds / 60);
  return `${minutes} دقيقة`;
}

export default function PaperExamResultsPage() {
  const {
    data,
    isPending,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery<PaperExamResult[]>({ queryKey: ["/api/test-results/user"] });

  const results = Array.isArray(data) ? data.filter((item) => item.testType === "paper_model") : [];

  return (
    <main className="qodratak-page-surface mx-auto w-full max-w-5xl space-y-6 p-5 pb-12 md:p-8" dir="rtl">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-muted-foreground">نتائجي</p>
          <h1 className="mt-1 text-2xl font-black text-foreground sm:text-3xl">نتائج الاختبارات الورقية</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            نتائج المحاكاة الورقية المحفوظة في حسابك، مع عدد الإجابات والوقت والتفاصيل.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={() => void refetch()} disabled={isFetching} data-testid="button-refresh-paper-results">
            <RotateCw className={`ml-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            تحديث النتائج
          </Button>
          <Button asChild data-testid="button-start-paper-exam">
            <Link href="/paper-exam"><FileText className="ml-2 h-4 w-4" />اختبار ورقي جديد</Link>
          </Button>
        </div>
      </header>

      {isPending ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">جارٍ تحميل نتائجك...</CardContent></Card>
      ) : isError ? (
        <Card className="border-destructive/30">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <AlertCircle className="h-8 w-8 text-destructive" aria-hidden="true" />
            <p className="font-bold text-foreground">تعذر تحميل نتائج الاختبارات الورقية.</p>
            <p className="text-sm text-muted-foreground">{error instanceof Error ? error.message : "تحقق من الاتصال ثم حاول مرة أخرى."}</p>
            <Button type="button" variant="outline" onClick={() => void refetch()}>إعادة المحاولة</Button>
          </CardContent>
        </Card>
      ) : results.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <FileText className="h-9 w-9 text-muted-foreground" aria-hidden="true" />
            <h2 className="font-black text-foreground">لا توجد نتائج ورقية محفوظة حتى الآن</h2>
            <p className="max-w-lg text-sm leading-6 text-muted-foreground">
              بعد تسليم اختبار ورقي، ستظهر نتيجته هنا تلقائيًا.
            </p>
            <Button asChild><Link href="/paper-exam">ابدأ اختبارًا ورقيًا</Link></Button>
          </CardContent>
        </Card>
      ) : (
        <section className="space-y-4" aria-label="قائمة نتائج الاختبارات الورقية">
          {results.map((result) => {
            const total = Math.max(0, Number(result.totalQuestions) || 0);
            const correct = Math.max(0, Number(result.correctAnswers ?? result.score) || 0);
            const percentage = Number.isFinite(result.percentage)
              ? Number(result.percentage)
              : total ? Math.round(correct / total * 100) : 0;
            const details = Array.isArray(result.questionDetails) ? result.questionDetails : [];

            return (
              <Card key={result._id} data-testid={`paper-exam-result-${result._id}`}>
                <CardHeader className="pb-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <span className="mt-1 rounded-xl bg-primary/10 p-2 text-primary"><FileText className="h-5 w-5" /></span>
                      <div>
                        <CardTitle className="text-lg">{result.testName || "اختبار ورقي"}</CardTitle>
                        <p className="mt-1 text-sm text-muted-foreground">{formatDate(result.completedAt)}</p>
                      </div>
                    </div>
                    <span className="rounded-xl bg-primary/10 px-3 py-2 text-lg font-black text-primary">{percentage}%</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="rounded-xl border border-border p-3">
                      <p className="text-xs text-muted-foreground">الصحيحة</p>
                      <p className="mt-1 flex items-center gap-1.5 font-black text-foreground"><CheckCircle2 className="h-4 w-4 text-emerald-600" />{correct} من {total}</p>
                    </div>
                    <div className="rounded-xl border border-border p-3">
                      <p className="text-xs text-muted-foreground">الخاطئة</p>
                      <p className="mt-1 font-black text-foreground">{Math.max(0, Number(result.wrongAnswers) || 0)}</p>
                    </div>
                    <div className="rounded-xl border border-border p-3">
                      <p className="text-xs text-muted-foreground">المتروكة</p>
                      <p className="mt-1 font-black text-foreground">{Math.max(0, Number(result.skippedQuestions) || 0)}</p>
                    </div>
                    <div className="rounded-xl border border-border p-3">
                      <p className="text-xs text-muted-foreground">الوقت</p>
                      <p className="mt-1 flex items-center gap-1.5 font-black text-foreground"><Clock3 className="h-4 w-4 text-muted-foreground" />{formatDuration(result.timeTaken)}</p>
                    </div>
                  </div>

                  {details.length > 0 && (
                    <details className="rounded-xl border border-border">
                      <summary className="cursor-pointer px-4 py-3 text-sm font-bold text-foreground">
                        عرض تصحيح الأسئلة ({details.length})
                      </summary>
                      <div className="grid gap-2 border-t border-border p-3 sm:grid-cols-2">
                        {details.map((question, index) => {
                          const status = question.status || "skipped";
                          return (
                            <div key={`${question.questionNumber ?? index}-${index}`} className="flex items-center justify-between gap-3 rounded-lg bg-muted/40 px-3 py-2 text-sm">
                              <span className="font-bold text-foreground">
                                السؤال {question.questionNumber ?? index + 1}
                                {question.category ? ` · ${question.category}` : ""}
                              </span>
                              <span className={status === "correct" ? "text-emerald-700 dark:text-emerald-300" : status === "trial" ? "text-muted-foreground" : "text-destructive"}>
                                {statusText[status] || "غير محدد"}
                                {question.userAnswer !== null && question.userAnswer !== undefined
                                  ? ` · إجابتك ${answerLetters[question.userAnswer] ?? question.userAnswer + 1}`
                                  : ""}
                                {question.status !== "correct" && question.status !== "trial" && Number.isInteger(question.correctAnswer)
                                  ? ` · الصحيحة ${answerLetters[question.correctAnswer!] ?? question.correctAnswer! + 1}`
                                  : ""}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </details>
                  )}

                  <Button asChild variant="ghost" size="sm" className="px-0 text-primary">
                    <Link href="/records"><ArrowRight className="ml-2 h-4 w-4" />سجل النتائج الكامل</Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </section>
      )}
    </main>
  );
}
