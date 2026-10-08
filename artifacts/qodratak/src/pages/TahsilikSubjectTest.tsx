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
  ChevronLeft,
  Dna,
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
} as const;

type SubjectKey = keyof typeof subjectPresentation;
interface SubjectOverview {
  subject: SubjectKey;
  label: string;
  verifiedQuestionCount: number;
  attempts: number;
  correctAttempts: number;
  accuracy: number | null;
  focusAreas: Array<{ subcategory: string; attempts: number; accuracy: number }>;
}
interface OverviewResponse {
  subjects: SubjectOverview[];
}
interface SubjectTestStartResponse {
  attemptId: string;
  subject: SubjectKey;
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

export default function TahsilikSubjectTest() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedSubject, setSelectedSubject] = useState<SubjectKey | null>(null);

  const overviewQuery = useQuery<OverviewResponse>({
    queryKey: ["/api/tahsili/subject-tests/overview"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/tahsili/subject-tests/overview");
      return response.json();
    },
  });

  const startMutation = useMutation({
    mutationFn: async (subject: SubjectKey) => {
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
          <h1 className="text-3xl font-black text-foreground">اختبار تحصيلي شخصي لكل مادة</h1>
          <p className="mx-auto mt-2 max-w-2xl text-muted-foreground">
            الأسئلة تأتي من البنك المعتمد. ومع كل اختبار محفوظ، يتجه التدريب تدريجيًا إلى المجالات التي تحتاج مراجعة.
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
                      {subject.attempts > 0 ? (
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
