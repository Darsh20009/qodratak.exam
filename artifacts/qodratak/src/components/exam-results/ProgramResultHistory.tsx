import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, CheckCircle2, Clock3, FileText, XCircle } from "lucide-react";

type Program = "qudrat" | "tahsili";

interface SavedTestResult {
  _id?: string;
  id?: string;
  program?: string;
  testName?: string;
  testType?: string;
  subject?: string;
  score?: number;
  totalQuestions?: number;
  correctAnswers?: number;
  wrongAnswers?: number;
  skippedQuestions?: number;
  percentage?: number;
  timeTaken?: number;
  completedAt?: string;
  createdAt?: string;
}

function programFor(result: SavedTestResult): Program {
  if (result.program === "tahsili") return "tahsili";
  if (result.program === "qudrat") return "qudrat";
  const label = `${result.testName ?? ""} ${result.testType ?? ""} ${result.subject ?? ""}`;
  return /تحصيلي|tahsili|فيزياء|كيمياء|أحياء|احياء|علم البيئة/i.test(label) ? "tahsili" : "qudrat";
}

function percentageFor(result: SavedTestResult): number | null {
  if (Number.isFinite(result.percentage)) return Math.max(0, Math.min(100, Number(result.percentage)));
  const total = Number(result.totalQuestions) || 0;
  if (total <= 0) return null;
  return Math.max(0, Math.min(100, ((Number(result.correctAnswers ?? result.score) || 0) / total) * 100));
}

function resultDate(result: SavedTestResult): string {
  const value = result.completedAt ?? result.createdAt;
  if (!value) return "التاريخ غير متوفر";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "التاريخ غير متوفر"
    : date.toLocaleString("ar-SA", { dateStyle: "medium", timeStyle: "short" });
}

function durationLabel(seconds: number | undefined): string | null {
  const totalSeconds = Math.max(0, Number(seconds) || 0);
  if (!totalSeconds) return null;
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = Math.round(totalSeconds % 60);
  return minutes > 0 ? `${minutes} دقيقة${remainingSeconds ? ` و${remainingSeconds} ثانية` : ""}` : `${remainingSeconds} ثانية`;
}

const sections: Array<{ program: Program; title: string; description: string }> = [
  { program: "qudrat", title: "تقارير القدرات", description: "نتائج اختبارات القدرات المسجلة في حسابك." },
  { program: "tahsili", title: "تقارير التحصيلي", description: "نتائج اختبارات التحصيلي المسجلة في حسابك." },
];

export default function ProgramResultHistory() {
  const resultsQuery = useQuery<SavedTestResult[]>({
    queryKey: ["/api/test-results/user"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/test-results/user");
      const data = await response.json();
      if (!Array.isArray(data)) throw new Error("تعذر قراءة سجل الاختبارات.");
      return data;
    },
    staleTime: 15_000,
  });

  const allResults = resultsQuery.data ?? [];
  return (
    <div className="my-6 space-y-6" dir="rtl" data-testid="program-result-history">
      {sections.map((section) => {
        const results = allResults
          .filter((result) => programFor(result) === section.program)
          .sort((a, b) => new Date(b.completedAt ?? b.createdAt ?? 0).getTime() - new Date(a.completedAt ?? a.createdAt ?? 0).getTime());
        return (
          <section
            key={section.program}
            aria-labelledby={`results-${section.program}-heading`}
            data-testid={`results-section-${section.program}`}
            className="space-y-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 id={`results-${section.program}-heading`} className="text-xl font-black text-foreground">{section.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{section.description}</p>
              </div>
              <Badge variant="secondary">{resultsQuery.isSuccess ? results.length : "—"} اختبار</Badge>
            </div>

            {resultsQuery.isPending ? (
              <div className="rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground" role="status">جارٍ تحميل النتائج المحفوظة…</div>
            ) : resultsQuery.isError ? (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-destructive/30 bg-card p-5">
                <p className="text-sm text-destructive">تعذر تحميل هذا السجل من حسابك.</p>
                <Button size="sm" variant="outline" onClick={() => void resultsQuery.refetch()}>إعادة المحاولة</Button>
              </div>
            ) : results.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-card p-5 text-sm text-muted-foreground">
                لا توجد اختبارات مكتملة في هذا المسار بعد. ستظهر النتائج هنا تلقائيًا بعد إكمال الاختبار.
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {results.map((result, index) => {
                  const percent = percentageFor(result);
                  const correct = Number(result.correctAnswers ?? result.score) || 0;
                  const total = Number(result.totalQuestions) || 0;
                  const wrong = Number(result.wrongAnswers) || 0;
                  const skipped = Number(result.skippedQuestions) || 0;
                  const title = result.testName || result.testType || "اختبار";
                  const duration = durationLabel(result.timeTaken);
                  return (
                    <Card key={result._id ?? result.id ?? `${section.program}-${result.completedAt}-${title}-${index}`} className="border-border bg-card">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-3">
                          <CardTitle className="flex min-w-0 items-start gap-2 text-base leading-6">
                            <FileText className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                            <span className="line-clamp-2">{title}</span>
                          </CardTitle>
                          {percent !== null && <Badge className="shrink-0">{percent.toFixed(1)}%</Badge>}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3 text-sm">
                        <p className="flex items-center gap-2 text-muted-foreground">
                          <CalendarDays className="h-4 w-4" aria-hidden="true" />{resultDate(result)}
                        </p>
                        <div className="flex flex-wrap gap-x-4 gap-y-2 text-muted-foreground">
                          <span className="inline-flex items-center gap-1"><CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden="true" />{correct} صحيحة</span>
                          {total > 0 && <span>{total} سؤالًا</span>}
                          {wrong > 0 && <span className="inline-flex items-center gap-1"><XCircle className="h-4 w-4 text-destructive" aria-hidden="true" />{wrong} خاطئة</span>}
                          {skipped > 0 && <span>{skipped} متروكة</span>}
                          {duration && <span className="inline-flex items-center gap-1"><Clock3 className="h-4 w-4" aria-hidden="true" />{duration}</span>}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
