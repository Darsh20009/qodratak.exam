import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  Atom,
  BookOpenCheck,
  Calculator,
  CheckCircle2,
  Clock3,
  ChevronLeft,
  Dna,
  FileText,
  FlaskConical,
  Globe2,
  Loader2,
  Target,
} from "lucide-react";

const subjectPresentation = {
  math: { label: "الرياضيات", icon: Calculator, color: "text-emerald-600" },
  physics: { label: "الفيزياء", icon: Atom, color: "text-sky-600" },
  chemistry: { label: "الكيمياء", icon: FlaskConical, color: "text-violet-600" },
  biology: { label: "الأحياء", icon: Dna, color: "text-rose-600" },
  environment: { label: "علم الأرض", icon: Globe2, color: "text-teal-600" },
  mixed: { label: "مختلط", icon: Globe2, color: "text-amber-600" },
} as const;

type SubjectKey = keyof typeof subjectPresentation;
type VerifiedSubjectKey = Exclude<SubjectKey, "mixed">;
interface SubjectOverview {
  subject: VerifiedSubjectKey;
  label: string;
  verifiedQuestionCount: number;
  attempts: number;
  correctAttempts: number;
  accuracy: number | null;
  focusAreas: Array<{ subcategory: string; attempts: number; accuracy: number }>;
}
interface OverviewResponse {
  subjects: SubjectOverview[];
  unscoredSubjects: Array<{ subject: SubjectKey; label: string; questionCount: number }>;
}
interface UnscoredPracticeResult {
  attemptId: string;
  subject: SubjectKey;
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
interface UnscoredPracticeHistory {
  attempts: Array<Omit<UnscoredPracticeResult, "questions">>;
}
interface SubjectTestStartResponse {
  attemptId: string;
  mode?: "unscored";
  subject: SubjectKey;
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
    difficulty: "beginner" | "intermediate" | "advanced";
  }>;
}

function errorText(error: unknown): string {
  if (!(error instanceof Error)) return "تعذر تنفيذ الطلب. حاول مرة أخرى.";
  try {
    const body = JSON.parse(error.message.slice(error.message.indexOf(":") + 1).trim());
    return body.error || error.message;
  } catch {
    return error.message;
  }
}

function formatDuration(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  return `${Math.floor(seconds / 60)} د ${seconds % 60} ث`;
}

export default function TahsilikSubjectTest() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedSubject, setSelectedSubject] = useState<VerifiedSubjectKey | null>(null);
  const [historyResult, setHistoryResult] = useState<UnscoredPracticeResult | null>(null);
  const [practiceQuestionCount, setPracticeQuestionCount] = useState(20);

  const overviewQuery = useQuery<OverviewResponse>({
    queryKey: ["/api/tahsili/subject-tests/overview"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/tahsili/subject-tests/overview");
      return response.json();
    },
  });

  const startMutation = useMutation({
    mutationFn: async (subject: VerifiedSubjectKey) => {
      const response = await apiRequest("POST", "/api/tahsili/subject-tests/start", { subject });
      return response.json() as Promise<SubjectTestStartResponse>;
    },
    onSuccess: (test) => {
      sessionStorage.setItem("tahsiliSubjectTestStart", JSON.stringify(test));
      setLocation("/tahsilik/test-runner/subject");
    },
    onError: (error) => {
      toast({
        title: "تعذر بدء الاختبار",
        description: errorText(error),
        variant: "destructive",
      });
    },
  });

  const unscoredPracticeMutation = useMutation({
    mutationFn: async (subject: SubjectKey) => {
      const response = await apiRequest("POST", "/api/tahsili/unscored-practice/start", {
        subject,
        questionCount: practiceQuestionCount,
      });
      return response.json() as Promise<SubjectTestStartResponse & { mode: "unscored" }>;
    },
    onSuccess: (test) => {
      sessionStorage.setItem("tahsiliSubjectTestStart", JSON.stringify(test));
      setLocation("/tahsilik/test-runner/subject");
    },
    onError: (error) => {
      toast({
        title: "تعذر بدء التدريب",
        description: errorText(error),
        variant: "destructive",
      });
    },
  });

  const historyQuery = useQuery<UnscoredPracticeHistory>({
    queryKey: ["/api/tahsili/unscored-practice/history"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/tahsili/unscored-practice/history");
      return response.json();
    },
  });

  const historyDetailMutation = useMutation({
    mutationFn: async (attemptId: string) => {
      const response = await apiRequest(
        "GET",
        `/api/tahsili/unscored-practice/history/${encodeURIComponent(attemptId)}`,
      );
      return response.json() as Promise<UnscoredPracticeResult>;
    },
    onSuccess: setHistoryResult,
    onError: (error) => toast({
      title: "تعذر فتح نتيجة التدريب",
      description: errorText(error),
      variant: "destructive",
    }),
  });

  const selected = useMemo(
    () => overviewQuery.data?.subjects.find((item) => item.subject === selectedSubject),
    [overviewQuery.data, selectedSubject],
  );

  return (
    <main className="qodratak-tahsili-surface min-h-[100dvh] px-4 py-8" dir="rtl">
      <div className="mx-auto max-w-5xl space-y-7">
        <header className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Target className="h-7 w-7" />
          </div>
          <h1 className="text-3xl font-black text-foreground">اختبارات التحصيلي</h1>
          <p className="mx-auto mt-2 max-w-2xl text-muted-foreground">
            الاختبار المصحح متاح عند وجود أسئلة معتمدة. ويمكنك الآن بدء تدريب غير مصحح من الأسئلة المتاحة ومراجعة إجاباتك ووقتك بعد الانتهاء.
          </p>
        </header>

        {overviewQuery.isLoading && (
          <div className="flex items-center justify-center gap-3 py-16 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            جاري تحميل المواد والأسئلة المعتمدة…
          </div>
        )}

        {overviewQuery.isError && (
          <Card role="alert" className="border-destructive/40">
            <CardContent className="flex flex-col items-center gap-4 py-8 text-center">
              <p className="text-destructive">{errorText(overviewQuery.error)}</p>
              <Button variant="outline" onClick={() => void overviewQuery.refetch()}>إعادة المحاولة</Button>
            </CardContent>
          </Card>
        )}

        {overviewQuery.data && !selected && (
          <>
          {overviewQuery.data.subjects.every((subject) => subject.verifiedQuestionCount === 0) && (
            <Card className="border-amber-500/30 bg-amber-500/[0.04]" role="status">
              <CardContent className="flex flex-col items-start gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-black text-foreground">الاختبارات المصححة غير متاحة الآن</p>
                  <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
                    لا توجد أسئلة معتمدة لاحتساب الدرجات حاليًا. لكن يمكنك حل الأسئلة المتاحة كتدريب غير مصحح؛ تُحفظ اختياراتك ووقتك فقط.
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  {overviewQuery.data.unscoredSubjects.some((subject) => subject.questionCount > 0) && (
                    <Button
                      onClick={() => document.getElementById("unscored-practice")?.scrollIntoView({ behavior: "smooth", block: "start" })}
                    >
                      ابدأ تدريبًا متاحًا
                    </Button>
                  )}
                  <Button variant="outline" onClick={() => setLocation("/tahsili/sources")}>
                    مكتبة المصادر
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="مواد التحصيلي">
            {overviewQuery.data.subjects.map((subject) => {
              const display = subjectPresentation[subject.subject];
              const Icon = display.icon;
              return (
                <button
                  type="button"
                  key={subject.subject}
                  onClick={() => setSelectedSubject(subject.subject)}
                  disabled={subject.verifiedQuestionCount === 0}
                  className="text-right disabled:cursor-not-allowed disabled:opacity-60"
                  data-testid={`card-subject-${subject.subject}`}
                >
                  <Card className="h-full border-border transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        <span className={`flex h-12 w-12 items-center justify-center rounded-xl bg-muted ${display.color}`}>
                          <Icon className="h-6 w-6" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <CardTitle className="text-lg">{subject.label}</CardTitle>
                          <CardDescription>
                            {subject.verifiedQuestionCount > 0
                              ? `${subject.verifiedQuestionCount} سؤالًا معتمدًا متاحًا`
                              : "لا توجد أسئلة معتمدة متاحة حاليًا"}
                          </CardDescription>
                        </div>
                        <ChevronLeft className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      {subject.verifiedQuestionCount === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          لا يمكن بدء اختبار مصحح لهذه المادة قبل اعتماد أسئلتها.
                        </p>
                      ) : subject.attempts > 0 ? (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between rounded-lg bg-muted/60 px-3 py-2 text-sm">
                            <span className="text-muted-foreground">دقتك من إجاباتك المعتمدة</span>
                            <strong>{subject.accuracy ?? 0}%</strong>
                          </div>
                          {subject.focusAreas.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {subject.focusAreas.map((area) => (
                                <Badge key={area.subcategory} variant="secondary">
                                  مراجعة: {area.subcategory} ({area.accuracy}%)
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground">
                              لا تظهر فجوة متكررة في سجل الإجابات الحالي.
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-start gap-2 text-sm text-muted-foreground">
                          <BookOpenCheck className="mt-0.5 h-4 w-4 shrink-0" />
                          اختبار تشخيصي متوازن؛ يبدأ التخصيص بعد حفظ إجاباتك.
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </button>
              );
            })}
          </section>
          <section id="unscored-practice" className="scroll-mt-6 space-y-4" aria-labelledby="unscored-practice-heading">
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/[0.05] p-4 sm:p-5">
              <h2 id="unscored-practice-heading" className="flex items-center gap-2 text-lg font-black text-foreground">
                <FileText className="h-5 w-5 text-amber-600" />
                اختبارات التحصيلي — تدريب غير مصحح
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                هذه الأسئلة لا تملك مفاتيح إجابة مراجعة؛ لذلك لن نعرض صح أو خطأ أو نسبة أو درجة. ستحصل على سجل بإجاباتك والوقت لكل سؤال فقط، ولن يدخل هذا التدريب في تحليل مستواك.
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-2" aria-label="عدد أسئلة الاختبار">
                <span className="ml-1 text-sm font-bold text-foreground">عدد الأسئلة:</span>
                {[10, 20, 50, 100, 110].map((count) => (
                  <Button
                    key={count}
                    type="button"
                    size="sm"
                    variant={practiceQuestionCount === count ? "default" : "outline"}
                    aria-pressed={practiceQuestionCount === count}
                    onClick={() => setPracticeQuestionCount(count)}
                  >
                    {count}
                  </Button>
                ))}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                إذا كان عدد الأسئلة المتاحة أقل من اختيارك، يبدأ الاختبار بالعدد المتاح فقط.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {overviewQuery.data.unscoredSubjects.map((subject) => {
                const display = subjectPresentation[subject.subject];
                const Icon = display.icon;
                return (
                  <Card key={subject.subject} className="border-border">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        <span className={`flex h-11 w-11 items-center justify-center rounded-xl bg-muted ${display.color}`}>
                          <Icon className="h-5 w-5" />
                        </span>
                        <div>
                          <CardTitle className="text-base">{subject.label}</CardTitle>
                          <CardDescription>{subject.questionCount.toLocaleString("ar-SA")} سؤال متاح كتدريب غير مصحح</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Button
                        className="w-full"
                        variant="outline"
                        disabled={subject.questionCount === 0 || unscoredPracticeMutation.isPending}
                        onClick={() => unscoredPracticeMutation.mutate(subject.subject)}
                      >
                        {unscoredPracticeMutation.isPending
                          ? <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                          : <ArrowRight className="ml-2 h-4 w-4" />}
                        ابدأ اختبارًا غير مصحح · {practiceQuestionCount} سؤال
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>
          <section className="space-y-3" aria-labelledby="unscored-history-heading">
            <h2 id="unscored-history-heading" className="text-lg font-black text-foreground">سجل نتائج التدريب غير المصحح</h2>
            {historyQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">جارٍ تحميل سجل التدريب…</p>
            ) : historyQuery.data?.attempts.length ? (
              <div className="space-y-2">
                {historyQuery.data.attempts.map((attempt) => (
                  <Card key={attempt.attemptId}>
                    <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                      <div>
                        <p className="font-bold">{attempt.label} · تدريب غير مصحح</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          أجبت عن {attempt.answeredQuestions} من {attempt.totalQuestions} · دون إجابة {attempt.skippedQuestions} · الوقت {formatDuration(attempt.durationSeconds)}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {new Date(attempt.completedAt).toLocaleString("ar-SA")}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => historyDetailMutation.mutate(attempt.attemptId)}
                        disabled={historyDetailMutation.isPending}
                      >
                        عرض التفاصيل
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                ستظهر تقاريرك هنا بعد إكمال أول تدريب غير مصحح.
              </p>
            )}
            {historyResult && (
              <Card className="border-primary/30">
                <CardHeader>
                  <CardTitle>تفاصيل تدريب {historyResult.label}</CardTitle>
                  <CardDescription>سجل اختياراتك والوقت فقط — لا يوجد تصحيح أو درجة.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {historyResult.questions.map((question, index) => (
                    <div key={question.id} className="rounded-xl border border-border p-3">
                      <p className="font-semibold leading-7">{index + 1}. {question.text}</p>
                      {question.imageUrl && (
                        <img src={question.imageUrl} alt={`صورة السؤال ${index + 1}`} className="my-3 max-h-64 rounded-lg object-contain" loading="lazy" />
                      )}
                      <p className="mt-2 text-sm text-muted-foreground">
                        اختيارك: {question.selectedOptionIndex === null ? "لم تتم الإجابة" : question.options[question.selectedOptionIndex]}
                        {" · "}الوقت: {formatDuration(question.responseTimeSeconds)}
                        {" · "}{question.sourceBook}، صفحة {question.sourcePage}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </section>
          </>
        )}

        {selected && (
          <Card>
            <CardHeader>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-1 h-6 w-6 text-primary" />
                <div>
                  <CardTitle>اختبار {selected.label}</CardTitle>
                  <CardDescription className="mt-2">
                    يحتوي الاختبار على ما يصل إلى 20 سؤالًا حقيقيًا من الأسئلة التي تم اعتماد إجاباتها.
                    {selected.attempts > 0
                      ? " سنستخدم سجل إجاباتك السابقة لتوجيه جزء أكبر من الأسئلة نحو نقاط المراجعة."
                      : " هذا اختبار تشخيصي أولي متوازن."}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex flex-wrap gap-3 text-sm">
                <Badge variant="secondary">{selected.verifiedQuestionCount} سؤالًا معتمدًا</Badge>
                <Badge variant="secondary">حتى 20 سؤالًا في الاختبار</Badge>
                {selected.accuracy !== null && (
                  <Badge variant="outline">الدقة السابقة {selected.accuracy}%</Badge>
                )}
              </div>
              {selected.focusAreas.length > 0 && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
                  <p className="mb-2 font-semibold">مجالات ظهرت فيها أخطاء متكررة:</p>
                  <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                    {selected.focusAreas.map((area) => (
                      <li key={area.subcategory}>
                        {area.subcategory}: دقة {area.accuracy}% عبر {area.attempts} إجابات
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={() => startMutation.mutate(selected.subject)}
                  disabled={startMutation.isPending || selected.verifiedQuestionCount === 0}
                >
                  {startMutation.isPending ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <ArrowRight className="ml-2 h-4 w-4" />}
                  ابدأ الاختبار
                </Button>
                <Button variant="outline" onClick={() => setSelectedSubject(null)}>اختيار مادة أخرى</Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
