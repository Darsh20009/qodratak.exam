import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, BookOpen, CheckCircle2, ClipboardCheck, FileQuestion, GraduationCap, Loader2, Target } from "lucide-react";
import TahsiliStudyUnits from "@/pages/TahsiliStudyUnits";

interface TahsiliSourceResponse {
  totalSources: number;
  sources: Array<{
    id: string;
    primary: boolean;
    pages: number;
    subject: string;
    kind: string;
    title: string;
    fileUrl: string;
  }>;
  playlists?: Array<{ subject: string; url: string }>;
}

interface SubjectOverviewResponse {
  subjects: Array<{
    subject: string;
    label: string;
    verifiedQuestionCount: number;
    attempts: number;
    accuracy: number | null;
  }>;
}

async function getJson<T>(path: string): Promise<T> {
  const response = await apiRequest("GET", path);
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || "تعذر تحميل البيانات.");
  return body as T;
}

export default function TahsiliOverviewPage() {
  const [, setLocation] = useLocation();
  const sourcesQuery = useQuery({
    queryKey: ["/api/tahsili/sources"],
    queryFn: () => getJson<TahsiliSourceResponse>("/api/tahsili/sources"),
  });
  const testsQuery = useQuery({
    queryKey: ["/api/tahsili/subject-tests/overview"],
    queryFn: () => getJson<SubjectOverviewResponse>("/api/tahsili/subject-tests/overview"),
  });
  const verifiedCount = testsQuery.data?.subjects.reduce((total, subject) => total + subject.verifiedQuestionCount, 0);
  const studySubjects = [
    { key: "رياضيات", title: "الرياضيات", query: "math", testKey: "math" },
    { key: "فيزياء", title: "الفيزياء", query: "physics", testKey: "physics" },
    { key: "كيمياء", title: "الكيمياء", query: "chemistry", testKey: "chemistry" },
    { key: "أحياء", title: "الأحياء", query: "biology", testKey: "biology" },
    { key: "علم الأرض", title: "علم الأرض", query: "environment", testKey: "environment" },
  ];

  return (
    <main className="qodratak-tahsili-surface min-h-[100dvh] px-4 py-6 pb-24 sm:px-6 sm:py-8" dir="rtl">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-bold text-primary">مسار التحصيلي · التأسيس والمحوسب</p>
              <h1 className="mt-2 text-3xl font-black text-foreground">خطوتك التالية واضحة</h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">
                ابدأ بمصدر منشور لمادتك، ثم انتقل إلى اختبار من الأسئلة ذات الإجابات الموثوقة. نتيجتك الموثقة تساعد على توجيه تدريبك التالي.
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <Button onClick={() => document.getElementById("tahsili-subjects")?.scrollIntoView({ behavior: "smooth", block: "start" })}>
                اختر مادة <ArrowLeft className="mr-2 h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={() => setLocation("/tahsilik/tests")}>
                مركز الاختبارات <ClipboardCheck className="mr-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>

        <section className="grid gap-3 md:grid-cols-3" aria-label="خطوات الدراسة">
          {[
            { number: "١", title: "أسّس للمادة", description: "افتح كتاب التأسيس أو ملف المادة المنشور.", icon: BookOpen },
            { number: "٢", title: "اختبر فهمك", description: "حل اختبارًا من الأسئلة التي تمت مراجعة إجاباتها.", icon: Target },
            { number: "٣", title: "راجع نتيجتك", description: "شاهد درجتك والمهارات التي تحتاج تدريبًا إضافيًا.", icon: CheckCircle2 },
          ].map(({ number, title, description, icon: Icon }) => (
            <Card key={title}>
              <CardContent className="flex h-full items-start gap-3 p-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-black text-foreground"><span className="ml-2 text-primary">{number}</span>{title}</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="grid gap-4 md:grid-cols-2" aria-label="ملخص المحتوى">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <BookOpen className="h-5 w-5" />
                </span>
                <div>
                  <CardTitle>مصادر الدراسة</CardTitle>
                  <CardDescription className="mt-1">الكتب وملفات التأسيس والتدريب المنشورة لكل مادة.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                {sourcesQuery.isLoading
                  ? <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> جارٍ تحميل المصادر</span>
                  : sourcesQuery.isError
                    ? "تعذر التحقق من المصادر الآن."
                    : `${sourcesQuery.data?.totalSources ?? 0} ملفًا متاحًا للقراءة`}
              </p>
              <Button onClick={() => setLocation("/tahsili/sources")} data-testid="button-open-tahsili-sources">
                افتح المكتبة <ArrowLeft className="mr-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <GraduationCap className="h-5 w-5" />
                </span>
                <div>
                  <CardTitle>الاختبارات</CardTitle>
                  <CardDescription className="mt-1">اختبارات حسب المادة من الأسئلة ذات مفاتيح الإجابة الموثوقة.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                {testsQuery.isLoading
                  ? <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> جارٍ التحقق</span>
                  : testsQuery.isError
                    ? "تعذر التحقق من الاختبارات الآن."
                    : verifiedCount === 0
                      ? "لا توجد أسئلة معتمدة للاختبار حتى الآن."
                      : `${verifiedCount} سؤالًا معتمدًا`}
              </p>
              <Button variant="outline" onClick={() => setLocation("/tahsilik/tests")} data-testid="button-open-tahsili-tests">
                مركز الاختبارات <ArrowLeft className="mr-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </section>

        <section id="tahsili-subjects" className="scroll-mt-6" aria-labelledby="tahsili-subjects-heading">
          <div className="mb-3">
            <h2 id="tahsili-subjects-heading" className="text-xl font-black text-foreground">مواد الدراسة</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              اختَر مادة لتظهر لك مصادرها المتاحة وعدد أسئلتها الموثوقة، ثم ابدأ من المصدر أو الاختبار مباشرة.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {studySubjects.map((subject) => {
              const subjectSources = sourcesQuery.data?.sources.filter((source) => source.subject === subject.key) ?? [];
              const foundationCount = subjectSources.filter((source) => source.kind === "foundation_book").length;
              const practiceCount = subjectSources.filter((source) => source.kind === "practice" || source.kind === "question_collection").length;
              const verifiedQuestionCount = testsQuery.data?.subjects.find((item) => item.subject === subject.testKey)?.verifiedQuestionCount ?? 0;
              const sourceState = sourcesQuery.isLoading
                ? "loading"
                : sourcesQuery.isError
                  ? "error"
                  : "ready";
              return (
                <Card key={subject.key} className="border-border bg-card">
                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <BookOpen className="h-5 w-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-base">{subject.title}</CardTitle>
                        <CardDescription className="mt-1">
                          {sourceState === "loading"
                            ? "جارٍ التحقق من المصادر"
                            : sourceState === "error"
                              ? "تعذر التحقق من المصادر"
                              : subjectSources.length
                                ? `${subjectSources.length} مصدرًا منشورًا`
                                : "لا توجد مصادر منشورة حاليًا"}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {foundationCount > 0 && <Badge variant="secondary">{foundationCount} كتاب تأسيس</Badge>}
                      {practiceCount > 0 && <Badge variant="secondary">{practiceCount} تدريب أو تجميع</Badge>}
                      {testsQuery.isLoading ? (
                        <Badge variant="outline">جارٍ التحقق من بنك الأسئلة</Badge>
                      ) : testsQuery.isError ? (
                        <Badge variant="outline">تعذر التحقق من بنك الأسئلة</Badge>
                      ) : (
                        <Badge variant="outline">{verifiedQuestionCount.toLocaleString("ar-SA")} سؤال موثوق</Badge>
                      )}
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={() => setLocation(`/tahsili/sources?subject=${subject.query}`)}
                        disabled={sourceState !== "ready" || subjectSources.length === 0}
                        data-testid={`button-tahsili-subject-${subject.query}`}
                      >
                        المصادر <BookOpen className="mr-2 h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        className="w-full"
                        onClick={() => setLocation(`/tahsilik/tests?subject=${subject.testKey}`)}
                        disabled={testsQuery.isLoading || testsQuery.isError || verifiedQuestionCount === 0}
                        data-testid={`button-tahsili-test-${subject.testKey}`}
                      >
                        {verifiedQuestionCount > 0 ? "ابدأ اختبار المادة" : "اختبار غير متاح"}
                        <ArrowLeft className="mr-2 h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {sourcesQuery.data && (
          <TahsiliStudyUnits sources={sourcesQuery.data.sources} />
        )}

        <Card className="border-primary/20 bg-primary/[0.03]">
          <CardContent className="flex items-start gap-3 p-5">
            <FileQuestion className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div>
              <p className="font-bold text-foreground">الموثوقية قبل الدرجة</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                تُحتسب الدرجات من الأسئلة ذات الإجابات الموثوقة فقط. أي سؤال لم تكتمل مراجعته لا يدخل في التصحيح أو تحليل مستواك.
              </p>
            </div>
            <Target className="mr-auto hidden h-5 w-5 shrink-0 text-primary sm:block" />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
