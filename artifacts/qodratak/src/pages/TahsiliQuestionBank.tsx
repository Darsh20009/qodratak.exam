import React, { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  BookOpen,
  Calculator,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FlaskConical,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDebounce } from "@/hooks/use-debounce";

type Subject = "رياضيات" | "فيزياء" | "كيمياء" | "أحياء" | "علم الأرض";

interface TahsiliQuestion {
  _id: string;
  questionId: number;
  subject: Subject;
  subcategory: string;
  text: string;
  options: string[];
  correctOptionIndex: number;
  difficulty: "beginner" | "intermediate" | "advanced";
  topic?: string;
  explanation?: string;
  sourcePage: number;
  sourceQuestionNumber?: number;
  answerConfidence: "verified" | "review";
}

interface BankResponse {
  questions: TahsiliQuestion[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  subjectCounts: Partial<Record<Subject, number>>;
  subcategories: string[];
}

const SUBJECTS: Array<{ value: "الكل" | Subject; label: string; icon: typeof Calculator; tone: string }> = [
  { value: "الكل", label: "كل المواد", icon: BookOpen, tone: "bg-primary/10 text-primary" },
  { value: "رياضيات", label: "الرياضيات", icon: Calculator, tone: "bg-blue-500/10 text-blue-600 dark:text-blue-300" },
  { value: "فيزياء", label: "الفيزياء", icon: Sparkles, tone: "bg-amber-500/10 text-amber-600 dark:text-amber-300" },
  { value: "كيمياء", label: "الكيمياء", icon: FlaskConical, tone: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300" },
  { value: "أحياء", label: "الأحياء", icon: BookOpen, tone: "bg-green-500/10 text-green-600 dark:text-green-300" },
  { value: "علم الأرض", label: "علم الأرض", icon: Sparkles, tone: "bg-orange-500/10 text-orange-600 dark:text-orange-300" },
];

const DIFFICULTY_LABEL: Record<TahsiliQuestion["difficulty"], string> = {
  beginner: "مبتدئ",
  intermediate: "متوسط",
  advanced: "متقدم",
};

const SUBJECT_LABEL: Record<Subject, string> = {
  رياضيات: "الرياضيات",
  فيزياء: "الفيزياء",
  كيمياء: "الكيمياء",
  أحياء: "الأحياء",
  "علم الأرض": "علم الأرض",
};

function subjectStyle(subject: Subject) {
  return SUBJECTS.find((item) => item.value === subject) || SUBJECTS[0];
}

export default function TahsiliQuestionBank() {
  const [subject, setSubject] = useState<"الكل" | Subject>("الكل");
  const [subcategory, setSubcategory] = useState("الكل");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showAnswers, setShowAnswers] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<TahsiliQuestion | null>(null);
  const [data, setData] = useState<BankResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    setPage(1);
  }, [subject, subcategory, debouncedSearch]);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({
      page: String(page),
      limit: "12",
      subject,
    });
    if (subcategory !== "الكل") params.set("subcategory", subcategory);
    if (debouncedSearch.trim()) params.set("search", debouncedSearch.trim());

    setIsLoading(true);
    setError(null);
    fetch(`/api/tahsili/question-bank?${params.toString()}`, {
      credentials: "include",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("تعذر تحميل بنك الأسئلة");
        return response.json() as Promise<BankResponse>;
      })
      .then(setData)
      .catch((requestError: Error) => {
        if (requestError.name !== "AbortError") setError(requestError.message);
      })
      .finally(() => setIsLoading(false));

    return () => controller.abort();
  }, [page, subject, subcategory, debouncedSearch]);

  const selectedSubject = useMemo(() => subjectStyle(subject === "الكل" ? "رياضيات" : subject), [subject]);
  const questions = data?.questions || [];

  return (
    <main className="min-h-screen bg-background pb-24 text-foreground" dir="rtl">
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 md:px-6 md:py-10">
        <section className="rounded-3xl border border-border bg-card p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <Badge variant="secondary" className="mb-3 gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                بنك التحصيلي
              </Badge>
              <h1 className="text-3xl font-black tracking-tight md:text-4xl">أسئلة التحصيلي حسب المادة</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                أسئلة الكتاب مرتبة في خمسة أقسام: الرياضيات، الفيزياء، الكيمياء، الأحياء، وعلم الأرض.
              </p>
            </div>
            <div className="rounded-2xl bg-muted/50 px-5 py-4 text-center">
              <div className="text-2xl font-black">{data?.total ?? "—"}</div>
              <div className="text-xs text-muted-foreground">سؤال في الفلتر الحالي</div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {SUBJECTS.slice(1).map((item) => {
            const Icon = item.icon;
            const count = data?.subjectCounts?.[item.value as Subject] ?? 0;
            const active = subject === item.value;
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => setSubject(item.value as Subject)}
                className={`rounded-2xl border p-4 text-right transition hover:-translate-y-0.5 hover:shadow-md ${
                  active ? "border-primary bg-primary/5 shadow-sm" : "border-border bg-card"
                }`}
                data-testid={`subject-filter-${item.value}`}
              >
                <span className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${item.tone}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <span className="block text-sm font-bold">{item.label}</span>
                <span className="mt-1 block text-xs text-muted-foreground">{count} سؤال</span>
              </button>
            );
          })}
        </section>

        <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="grid gap-3 md:grid-cols-[1fr_220px_160px]">
            <div className="relative">
              <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="ابحث في السؤال أو الموضوع..."
                className="pr-9"
                data-testid="input-tahsili-search"
              />
            </div>
            <Select value={subject} onValueChange={(value) => setSubject(value as "الكل" | Subject)}>
              <SelectTrigger data-testid="select-tahsili-subject">
                <SelectValue placeholder="المادة" />
              </SelectTrigger>
              <SelectContent>
                {SUBJECTS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={subcategory} onValueChange={setSubcategory}>
              <SelectTrigger data-testid="select-tahsili-subcategory">
                <SelectValue placeholder="التصنيف" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="الكل">كل التصنيفات</SelectItem>
                {(data?.subcategories || []).map((item) => (
                  <SelectItem key={item} value={item}>{item}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </section>

        {error ? (
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="flex items-center gap-3 p-6 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </CardContent>
          </Card>
        ) : isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-52 animate-pulse rounded-2xl border border-border bg-muted/40" />
            ))}
          </div>
        ) : questions.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center gap-3 p-12 text-center">
              <BookOpen className="h-10 w-10 text-muted-foreground" />
              <h2 className="text-lg font-bold">لا توجد أسئلة بهذا الفلتر</h2>
              <p className="text-sm text-muted-foreground">جرّب اختيار مادة أخرى أو حذف البحث.</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {questions.map((question) => {
                const style = subjectStyle(question.subject);
                const Icon = style.icon;
                return (
                  <Card
                    key={question._id || question.questionId}
                    className="cursor-pointer border-border bg-card transition hover:-translate-y-0.5 hover:shadow-lg"
                    onClick={() => setSelectedQuestion(question)}
                    data-testid={`tahsili-question-${question.questionId}`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${style.tone}`}>
                            <Icon className="h-4 w-4" />
                          </span>
                          <div>
                            <CardTitle className="text-sm">{SUBJECT_LABEL[question.subject]}</CardTitle>
                            <p className="mt-0.5 text-xs text-muted-foreground">{question.subcategory}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="shrink-0 text-[10px]">
                          {question.answerConfidence === "verified" ? "إجابة موثقة" : "تحتاج مراجعة"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="line-clamp-4 min-h-24 text-sm leading-7">{question.text}</p>
                      <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
                        <span>{question.options.length} خيارات</span>
                        <span>صفحة {question.sourcePage}</span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="flex items-center justify-center gap-3">
              <Button
                variant="outline"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page <= 1}
                className="gap-2"
              >
                <ChevronRight className="h-4 w-4" />
                السابق
              </Button>
              <span className="min-w-28 text-center text-sm text-muted-foreground">
                صفحة {page} من {data?.totalPages || 1}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage((current) => Math.min(data?.totalPages || current, current + 1))}
                disabled={page >= (data?.totalPages || 1)}
                className="gap-2"
              >
                التالي
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>
          </>
        )}
      </div>

      {selectedQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setSelectedQuestion(null)}>
          <Card className="max-h-[90vh] w-full max-w-2xl overflow-y-auto" onClick={(event) => event.stopPropagation()}>
            <CardHeader className="flex-row items-start justify-between gap-4">
              <div>
                <Badge variant="secondary">{SUBJECT_LABEL[selectedQuestion.subject]}</Badge>
                <CardTitle className="mt-3 text-xl leading-8">{selectedQuestion.subcategory}</CardTitle>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSelectedQuestion(null)} aria-label="إغلاق">
                <X className="h-5 w-5" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-5">
              <p className="text-base leading-8">{selectedQuestion.text}</p>
              <div className="space-y-2">
                {selectedQuestion.options.map((option, index) => {
                  const isVerified = selectedQuestion.answerConfidence === "verified";
                  const isCorrect = isVerified && index === selectedQuestion.correctOptionIndex;
                  return (
                    <div
                      key={`${selectedQuestion.questionId}-${index}`}
                      className={`rounded-xl border p-3 text-sm leading-6 ${
                        showAnswers && isCorrect ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "border-border bg-muted/30"
                      }`}
                    >
                      <span className="ml-2 font-bold">{String.fromCharCode(65 + index)}.</span>
                      {option}
                      {showAnswers && isCorrect && <CheckCircle2 className="mr-2 inline h-4 w-4" />}
                    </div>
                  );
                })}
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="outline">{DIFFICULTY_LABEL[selectedQuestion.difficulty]}</Badge>
                <span>صفحة المصدر: {selectedQuestion.sourcePage}</span>
                {selectedQuestion.topic && <span>• {selectedQuestion.topic}</span>}
              </div>
              <Button variant={showAnswers ? "secondary" : "default"} onClick={() => setShowAnswers((value) => !value)} className="w-full">
                {selectedQuestion.answerConfidence === "verified"
                  ? (showAnswers ? "إخفاء الإجابة" : "عرض الإجابة")
                  : "الإجابة قيد المراجعة"}
              </Button>
              {selectedQuestion.answerConfidence !== "verified" && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm leading-7 text-amber-800 dark:text-amber-200">
                  لم تُعتمد الإجابة الصحيحة لهذه المسألة بعد، لذلك لن نعرض اختيارًا على أنه صحيح.
                </div>
              )}
              {showAnswers && selectedQuestion.answerConfidence === "verified" && selectedQuestion.explanation && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm leading-7">
                  <strong className="ml-2">الشرح:</strong>
                  {selectedQuestion.explanation}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </main>
  );
}