import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, BookOpen, FileQuestion, GraduationCap, Loader2, Target } from "lucide-react";

interface TahsiliSourceResponse {
  totalSources: number;
  sources: Array<{ id: string; primary: boolean; pages: number; subject: string; kind: string; title: string }>;
}

interface SubjectOverviewResponse {
  subjects: Array<{ verifiedQuestionCount: number }>;
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
    { key: "رياضيات", title: "الرياضيات", query: "math" },
    { key: "فيزياء", title: "الفيزياء", query: "physics" },
    { key: "كيمياء", title: "الكيمياء", query: "chemistry" },
    { key: "أحياء", title: "الأحياء", query: "biology" },
  ];

  return (
    <main className="qodratak-tahsili-surface min-h-[100dvh] px-4 py-6 pb-24 sm:px-6 sm:py-8" dir="rtl">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <p className="text-sm font-bold text-primary">مسار التحصيلي</p>
          <h1 className="mt-2 text-3xl font-black text-foreground">التحصيلي</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">
            ادرس من ملفات المصادر داخل المنصة، ثم تدرب على الأسئلة التي تمت مراجعة إجاباتها واعتمادها.
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-2" aria-label="خطوات التحصيلي">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <BookOpen className="h-5 w-5" />
                </span>
                <div>
                  <CardTitle>مصادر الدراسة</CardTitle>
                  <CardDescription className="mt-1">كتاب ناصر عبدالكريم وبقية ملفات التأسيس والتدريب.</CardDescription>
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
                  <CardDescription className="mt-1">اختبار حسب المادة، من بنك الأسئلة المعتمد فقط.</CardDescription>
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

        <section aria-labelledby="tahsili-subjects-heading">
          <div className="mb-3">
            <h2 id="tahsili-subjects-heading" className="text-xl font-black text-foreground">مواد الدراسة</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              اختر المادة لفتح كتب التأسيس والتدريبات المتاحة لها. الملفات المرفوعة للقراءة الآن؛ فيديوهات الدروس الأصلية تُضاف عند رفعها.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {studySubjects.map((subject) => {
              const available = sourcesQuery.data?.sources.filter((source) => source.subject === subject.key).length ?? 0;
              return (
                <Card key={subject.key} className="border-border bg-card">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <BookOpen className="h-5 w-5" />
                      </span>
                      <div>
                        <CardTitle className="text-base">{subject.title}</CardTitle>
                        <CardDescription>{sourcesQuery.isLoading ? "جارٍ التحقق" : `${available} ملفًا متاحًا`}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => setLocation(`/tahsili/sources?subject=${subject.query}`)}
                      disabled={available === 0}
                      data-testid={`button-tahsili-subject-${subject.query}`}
                    >
                      افتح موادها <ArrowLeft className="mr-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        <Card className="border-primary/20 bg-primary/[0.03]">
          <CardContent className="flex items-start gap-3 p-5">
            <FileQuestion className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div>
              <p className="font-bold text-foreground">التصحيح لا يعتمد على أسئلة غير مراجعة</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                لا نعرض عددًا تقديريًا أو اختبارًا قديمًا بمفتاح غير موثوق. ستظهر الاختبارات وتعمل تلقائيًا عندما تُعتمد أسئلة المادة ومفاتيحها.
              </p>
            </div>
            <Target className="mr-auto hidden h-5 w-5 shrink-0 text-primary sm:block" />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
