import { useState } from "react";
import { useLocation } from "wouter";
import {
  Award,
  BookMarked,
  BookOpen,
  Brain,
  CheckCircle2,
  ChevronLeft,
  Clock3,
  Download,
  ExternalLink,
  FileText,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const newLogoPath = "/qodratak-icon.png";

const featuredBook = {
  title: "كتاب تأسيس التحصيلي",
  subtitle: "الدليل الشامل للتحضير",
  description: "كتاب متكامل يغطي مواد التحصيلي مع أمثلة وتمارين للمراجعة.",
  pages: 520,
  downloadUrl: "https://drive.google.com/uc?export=download&id=1FX5M1vnUJU-5n3MWgt6m6A8VMkAnBwLL",
  viewerUrl: "https://online.pubhtml5.com/lhlxd/ecbp/",
};

const availableTests = [
  {
    id: "exam-10",
    title: "اختبار تمهيدي سريع",
    description: "بداية قصيرة للتعرف على مستوى الاستعداد.",
    difficulty: "مبتدئ",
    questions: 10,
    time: "15 دقيقة",
  },
  {
    id: "exam-50",
    title: "اختبار التقييم المتوسط",
    description: "تقييم أوسع لمراجعة نقاط القوة والاحتياج.",
    difficulty: "متوسط",
    questions: 50,
    time: "60 دقيقة",
  },
  {
    id: "exam-100",
    title: "اختبار المحاكاة الشامل",
    description: "محاكاة أطول لتجربة الاختبار بتركيز.",
    difficulty: "متقدم",
    questions: 100,
    time: "120 دقيقة",
  },
  {
    id: "exam-110",
    title: "تحدي الخبراء الأقصى",
    description: "تحدٍ متقدم لمن يريد اختبار جاهزيته.",
    difficulty: "خبير",
    questions: 110,
    time: "150 دقيقة",
  },
];

const difficultyClassName: Record<string, string> = {
  مبتدئ: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-200",
  متوسط:
    "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-200",
  متقدم:
    "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900 dark:bg-violet-950/40 dark:text-violet-200",
  خبير:
    "border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200",
};

export default function TahsiliPage() {
  const [showBook, setShowBook] = useState(false);
  const [, setLocation] = useLocation();

  const handleDownload = () => {
    window.open(featuredBook.downloadUrl, "_blank", "noopener,noreferrer");
  };

  const handleStartTest = (examId: string) => {
    setLocation(`/tahsili/exams?exam=${examId}`);
  };

  return (
    <main className="qodratak-tahsili-surface min-h-[100dvh] overflow-x-hidden" dir="rtl">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        <header className="mb-8 flex flex-col gap-5 rounded-3xl border border-border/70 bg-card p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-7">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 p-2 sm:size-16">
              <img src={newLogoPath} alt="شعار قدراتك" className="size-full object-contain" />
            </div>
            <div className="min-w-0">
              <p className="mb-1 text-sm font-bold text-primary">مسار التحصيلي</p>
              <h1 data-testid="text-title" className="break-words text-2xl font-black tracking-tight text-foreground sm:text-4xl">
                التحصيلي المتكامل
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
                ادرس بخطوات واضحة، ثم اختبر استعدادك من المكان نفسه.
              </p>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2 text-xs text-muted-foreground">
            <span className="rounded-full bg-muted px-3 py-2">دراسة</span>
            <span className="rounded-full bg-muted px-3 py-2">تطبيق</span>
            <span className="rounded-full bg-muted px-3 py-2">اختبار</span>
          </div>
        </header>

        <section className="mb-8 grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
          <Card className="min-w-0 overflow-hidden border-border/70 bg-card shadow-sm">
            <CardHeader className="border-b border-border/60 p-5 sm:p-7">
              <div className="flex min-w-0 items-start gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <BookMarked className="size-6" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <p className="mb-1 text-sm font-bold text-primary">مصدر الدراسة</p>
                  <CardTitle className="break-words text-xl text-foreground sm:text-2xl">
                    {featuredBook.title}
                  </CardTitle>
                  <p className="mt-2 text-sm leading-7 text-muted-foreground">
                    {featuredBook.subtitle} — {featuredBook.description}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5 p-5 sm:p-7">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-border/70 bg-muted/40 p-4">
                  <FileText className="mb-3 size-5 text-primary" aria-hidden="true" />
                  <p className="text-xs text-muted-foreground">حجم المصدر</p>
                  <p className="mt-1 font-bold text-foreground">{featuredBook.pages} صفحة</p>
                </div>
                <div className="rounded-2xl border border-border/70 bg-muted/40 p-4">
                  <Brain className="mb-3 size-5 text-primary" aria-hidden="true" />
                  <p className="text-xs text-muted-foreground">النطاق</p>
                  <p className="mt-1 font-bold text-foreground">جميع المواد</p>
                </div>
                <div className="rounded-2xl border border-border/70 bg-muted/40 p-4">
                  <CheckCircle2 className="mb-3 size-5 text-primary" aria-hidden="true" />
                  <p className="text-xs text-muted-foreground">طريقة الاستخدام</p>
                  <p className="mt-1 font-bold text-foreground">قراءة وتطبيق</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Button
                  data-testid="button-toggle-book"
                  onClick={() => setShowBook((visible) => !visible)}
                  className="h-12 w-full"
                >
                  <BookOpen className="ms-2 size-5" aria-hidden="true" />
                  {showBook ? "إخفاء المعاينة" : "معاينة الكتاب"}
                </Button>
                <Button
                  data-testid="button-download-book"
                  onClick={handleDownload}
                  variant="outline"
                  className="h-12 w-full"
                >
                  <Download className="ms-2 size-5" aria-hidden="true" />
                  تحميل الكتاب
                  <ExternalLink className="me-2 size-4" aria-hidden="true" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="min-w-0 border-border/70 bg-card shadow-sm">
            <CardHeader className="border-b border-border/60 p-5 sm:p-7">
              <div className="flex items-start gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Award className="size-6" aria-hidden="true" />
                </div>
                <div>
                  <p className="mb-1 text-sm font-bold text-primary">التطبيق</p>
                  <CardTitle className="text-xl text-foreground sm:text-2xl">الاختبارات التفاعلية</CardTitle>
                  <p className="mt-2 text-sm leading-7 text-muted-foreground">
                    اختر المستوى المناسب وابدأ مباشرة دون خطوات إضافية.
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 p-5 sm:p-7">
              {availableTests.map((test) => (
                <button
                  key={test.id}
                  type="button"
                  data-testid={`card-test-${test.id}`}
                  onClick={() => handleStartTest(test.id)}
                  className="group flex w-full min-w-0 items-start gap-3 rounded-2xl border border-border/70 bg-background p-4 text-right transition-colors hover:border-primary/50 hover:bg-primary/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <BookOpen className="size-5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="break-words font-bold text-foreground">{test.title}</span>
                      <Badge variant="outline" className={difficultyClassName[test.difficulty]}>
                        {test.difficulty}
                      </Badge>
                    </span>
                    <span className="mt-1 block break-words text-sm leading-6 text-muted-foreground">
                      {test.description}
                    </span>
                    <span className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1">
                        <Clock3 className="size-3.5" aria-hidden="true" />
                        {test.time}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1">
                        <FileText className="size-3.5" aria-hidden="true" />
                        {test.questions} سؤال
                      </span>
                    </span>
                  </span>
                  <ChevronLeft className="mt-1 size-5 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" aria-hidden="true" />
                </button>
              ))}
              <Button
                variant="secondary"
                className="mt-2 h-11 w-full"
                onClick={() => setLocation("/tahsilik/tests")}
                data-testid="button-start-tahsili-tests"
              >
                الذهاب إلى مركز الاختبارات
                <ChevronLeft className="me-2 size-4" aria-hidden="true" />
              </Button>
            </CardContent>
          </Card>
        </section>

        {showBook && (
          <section className="mb-8 min-w-0">
            <Card className="overflow-hidden border-border/70 bg-card shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between gap-4 border-b border-border/60 p-5 sm:p-6">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <BookOpen className="size-5" aria-hidden="true" />
                  </div>
                  <CardTitle className="truncate text-lg text-foreground">معاينة الكتاب</CardTitle>
                </div>
                <Button
                  data-testid="button-close-book"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowBook(false)}
                  aria-label="إغلاق معاينة الكتاب"
                >
                  <X className="ms-2 size-4" aria-hidden="true" />
                  إغلاق
                </Button>
              </CardHeader>
              <CardContent className="p-3 sm:p-5">
                <iframe
                  data-testid="iframe-book-viewer"
                  title="معاينة كتاب تأسيس التحصيلي"
                  src={featuredBook.viewerUrl}
                  className="h-[min(68vh,680px)] min-h-[360px] w-full rounded-2xl border border-border bg-muted sm:min-h-[480px]"
                  loading="lazy"
                  allowFullScreen
                />
              </CardContent>
            </Card>
          </section>
        )}

        <section className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2">
          <Card className="border-border/70 bg-card shadow-sm">
            <CardContent className="flex items-center gap-4 p-5 sm:p-6">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <BookOpen className="size-5" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="font-bold text-foreground">مركز الدراسة</h2>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">تابع المادة والشروحات من مساحة الدراسة.</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setLocation("/tahsilik/study")}>
                فتح
              </Button>
            </CardContent>
          </Card>
          <Card className="border-border/70 bg-card shadow-sm">
            <CardContent className="flex items-center gap-4 p-5 sm:p-6">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Brain className="size-5" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="font-bold text-foreground">بنك أسئلة التحصيلي</h2>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">تدرّب حسب المادة من البنك المتاح حاليًا.</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setLocation("/tahsilik/question-bank")}>
                فتح
              </Button>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}