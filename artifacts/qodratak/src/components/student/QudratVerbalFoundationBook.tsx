import { useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  getGetQudratVerbalBookLessonQueryKey,
  getGetQudratVerbalBookQueryKey,
  useGetQudratVerbalBook,
  useGetQudratVerbalBookLesson,
  useSubmitQudratVerbalBookLesson,
  type SubmitQudratVerbalBookLessonMutationResult,
} from "@workspace/api-client-react";
import {
  BookOpen,
  CheckCircle2,
  CircleHelp,
  Clock3,
  FileCheck2,
  LoaderCircle,
  LockKeyhole,
  RotateCcw,
  Sparkles,
  Target,
  Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

function topicStatusLabel(status: string) {
  if (status === "completed") return "مكتمل";
  if (status === "available") return "متاح الآن";
  if (status === "locked") return "أكمل السابق";
  return "قريبًا";
}

function createIdempotencyKey() {
  const uuid = globalThis.crypto?.randomUUID?.();
  return `verbal-book-${uuid || `${Date.now()}-${Math.random().toString(36).slice(2)}`}`;
}

export default function QudratVerbalFoundationBook() {
  const queryClient = useQueryClient();
  const bookQuery = useGetQudratVerbalBook({
    query: {
      queryKey: getGetQudratVerbalBookQueryKey(),
      staleTime: 30_000,
    },
  });
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [quizOpen, setQuizOpen] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [quizResult, setQuizResult] = useState<SubmitQudratVerbalBookLessonMutationResult | null>(null);
  const attemptStartedAt = useRef(Date.now());

  const lessonQuery = useGetQudratVerbalBookLesson(selectedLessonId || "", {
    query: {
      enabled: Boolean(selectedLessonId),
      queryKey: getGetQudratVerbalBookLessonQueryKey(selectedLessonId || ""),
    },
  });
  const submitQuiz = useSubmitQudratVerbalBookLesson({
    mutation: {
      onSuccess: (result) => {
        setQuizResult(result);
        void queryClient.invalidateQueries({
          queryKey: getGetQudratVerbalBookQueryKey(),
        });
      },
    },
  });

  const publishedTopics = useMemo(
    () => bookQuery.data?.chapters.flatMap((chapter) => chapter.topics)
      .filter((topic) => topic.status !== "coming_soon") ?? [],
    [bookQuery.data],
  );
  const selectedTopic = publishedTopics.find((topic) => topic.id === selectedLessonId);
  const lesson = lessonQuery.data;
  const answerCount = Object.keys(selectedAnswers).length;
  const allAnswered = Boolean(lesson?.questions.length) && answerCount === lesson?.questions.length;
  const completedPercent = bookQuery.data?.publishedLessonCount
    ? Math.round((bookQuery.data.completedLessonCount / bookQuery.data.publishedLessonCount) * 100)
    : 0;

  useEffect(() => {
    if (selectedLessonId || !bookQuery.data) return;
    const nextTopic = publishedTopics.find((topic) => topic.status === "available")
      || publishedTopics.find((topic) => topic.status === "completed");
    if (nextTopic) setSelectedLessonId(nextTopic.id);
  }, [bookQuery.data, publishedTopics, selectedLessonId]);

  const selectLesson = (lessonId: string) => {
    setSelectedLessonId(lessonId);
    setQuizOpen(false);
    setSelectedAnswers({});
    setQuizResult(null);
  };

  const startQuiz = () => {
    setSelectedAnswers({});
    setQuizResult(null);
    attemptStartedAt.current = Date.now();
    setQuizOpen(true);
  };

  const submitAnswers = () => {
    if (!lesson || !selectedLessonId || !allAnswered || submitQuiz.isPending) return;
    submitQuiz.mutate({
      lessonId: selectedLessonId,
      data: {
        answers: lesson.questions.map((question) => ({
          questionId: question.id,
          selectedOptionIndex: selectedAnswers[question.id],
        })),
        timeTakenSeconds: Math.min(7200, Math.max(0, Math.floor((Date.now() - attemptStartedAt.current) / 1000))),
        idempotencyKey: createIdempotencyKey(),
      },
    });
  };

  const retryQuiz = async () => {
    setQuizResult(null);
    setSelectedAnswers({});
    attemptStartedAt.current = Date.now();
    await lessonQuery.refetch();
    setQuizOpen(true);
  };

  const openNextAvailableLesson = async () => {
    const refreshed = await bookQuery.refetch();
    const nextTopic = refreshed.data?.chapters
      .flatMap((chapter) => chapter.topics)
      .find((topic) => topic.status === "available");
    if (nextTopic) {
      selectLesson(nextTopic.id);
    } else {
      setQuizOpen(false);
    }
  };

  if (bookQuery.isLoading) {
    return (
      <div className="flex min-h-48 items-center justify-center gap-3 rounded-3xl border border-border bg-card p-6 text-sm font-bold text-muted-foreground" role="status">
        <LoaderCircle className="h-5 w-5 animate-spin" />
        جارٍ تحميل كتاب التأسيس اللفظي…
      </div>
    );
  }

  if (bookQuery.isError || !bookQuery.data) {
    return (
      <div className="rounded-3xl border border-destructive/30 bg-destructive/5 p-5" role="alert">
        <p className="font-black text-foreground">تعذر تحميل كتاب التأسيس اللفظي.</p>
        <p className="mt-1 text-sm text-muted-foreground">
          تحقق من الاتصال ثم أعد المحاولة. لا تعتمد هذه الصفحة على بنوك الدروس المنفصلة.
        </p>
        <Button type="button" variant="outline" className="mt-4 rounded-xl" onClick={() => void bookQuery.refetch()} data-testid="button-retry-verbal-book">
          إعادة المحاولة
        </Button>
      </div>
    );
  }

  return (
    <section className="space-y-5" aria-labelledby="qudrat-verbal-book-title" data-testid="section-qudrat-verbal-foundation-book">
      <header className="rounded-3xl border border-border bg-card p-5 shadow-sm md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 text-xs font-black text-primary">
              <BookOpen className="h-4 w-4" />
              مسار تأسيس منشور واختباراته محفوظة
            </div>
            <h2 id="qudrat-verbal-book-title" className="mt-2 text-2xl font-black text-foreground">
              {bookQuery.data.title}
            </h2>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">{bookQuery.data.description}</p>
            <p className="mt-3 rounded-2xl border border-amber-500/25 bg-amber-500/5 px-4 py-3 text-xs leading-6 text-foreground">
              نُشر {bookQuery.data.publishedLessonCount.toLocaleString("ar")} درسًا من أصل {bookQuery.data.totalTopicCount.toLocaleString("ar")} موضوعًا، ولكل درس شرح واختبار ومراجعة.
            </p>
          </div>
          <div className="min-w-44 rounded-2xl border border-border bg-muted/40 p-4">
            <div className="flex items-center gap-2 text-sm font-black text-foreground">
              <Trophy className="h-4 w-4 text-amber-500" />
              إنجاز الدروس المنشورة
            </div>
            <p className="mt-2 text-xs font-bold text-muted-foreground">
              {bookQuery.data.completedLessonCount.toLocaleString("ar")} من {bookQuery.data.publishedLessonCount.toLocaleString("ar")} درس
            </p>
            <Progress value={completedPercent} className="mt-3 h-2" aria-label="تقدم التأسيس اللفظي" />
          </div>
        </div>
      </header>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <main className="min-w-0 space-y-5">
          {!selectedLessonId ? (
            <div className="rounded-3xl border border-dashed border-border bg-card p-8 text-center">
              <BookOpen className="mx-auto h-10 w-10 text-muted-foreground" />
              <p className="mt-3 font-black text-foreground">لا توجد دروس متاحة حاليًا</p>
            </div>
          ) : lessonQuery.isLoading ? (
            <div className="flex min-h-48 items-center justify-center gap-3 rounded-3xl border border-border bg-card p-6 text-sm font-bold text-muted-foreground" role="status">
              <LoaderCircle className="h-5 w-5 animate-spin" />
              جارٍ تحميل الدرس…
            </div>
          ) : lessonQuery.isError || !lesson ? (
            <div className="rounded-3xl border border-destructive/30 bg-destructive/5 p-5" role="alert">
              <p className="font-black text-foreground">تعذر تحميل هذا الدرس.</p>
              <Button type="button" variant="outline" className="mt-3 rounded-xl" onClick={() => void lessonQuery.refetch()} data-testid="button-retry-verbal-lesson">
                إعادة تحميل الدرس
              </Button>
            </div>
          ) : (
            <>
              <article className="rounded-3xl border border-border bg-card p-5 shadow-sm md:p-6" data-testid={`card-verbal-book-lesson-${lesson.id}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-black text-primary">{lesson.chapterTitle} · درس تأسيسي</p>
                    <h3 className="mt-2 text-xl font-black text-foreground">{lesson.title}</h3>
                    <p className="mt-2 text-sm leading-7 text-muted-foreground">{lesson.summary}</p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs font-bold text-muted-foreground">
                    <Clock3 className="h-3.5 w-3.5" />
                    {lesson.estimatedMinutes.toLocaleString("ar")} دقائق
                  </span>
                </div>
                <div className="mt-5 space-y-3">
                  {lesson.sections.map((section) => (
                    <section key={section.id} className="rounded-2xl border border-border bg-background p-4" data-testid={`section-verbal-lesson-${section.id}`}>
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-primary" />
                        <h4 className="font-black text-foreground">{section.title}</h4>
                      </div>
                      {section.paragraphs.map((paragraph, index) => (
                        <p key={`${section.id}-${index}`} className="mt-2 text-sm leading-7 text-muted-foreground">{paragraph}</p>
                      ))}
                      {section.workedExample ? (
                        <div className="mt-3 rounded-xl border border-primary/20 bg-primary/5 p-3">
                          <p className="text-sm font-black text-foreground">{section.workedExample.question}</p>
                          <ol className="mt-2 list-decimal space-y-1 pr-5 text-sm leading-6 text-muted-foreground">
                            {section.workedExample.steps.map((step, index) => <li key={`${section.id}-step-${index}`}>{step}</li>)}
                          </ol>
                          <p className="mt-2 text-sm font-black text-primary">الإجابة: {section.workedExample.answer}</p>
                        </div>
                      ) : null}
                    </section>
                  ))}
                </div>
                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-muted/50 p-4">
                  <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                    <Target className="h-4 w-4 text-primary" />
                    اجتز الاختبار بدرجة {lesson.passingScore.toLocaleString("ar")}٪ لفتح الدرس المنشور التالي
                  </div>
                  <Button type="button" onClick={startQuiz} className="rounded-xl font-black" data-testid="button-start-verbal-book-quiz">
                    ابدأ اختبار الدرس
                  </Button>
                </div>
              </article>

              {quizOpen ? (
                <section className="rounded-3xl border border-primary/20 bg-card p-5 shadow-sm md:p-6" aria-label="اختبار التأسيس اللفظي" data-testid="section-verbal-book-quiz">
                  <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
                    <div>
                      <p className="text-xs font-black text-primary">
                        {lesson.mode === "remediation" ? "مراجعة بعد المحاولة السابقة" : "اختبار الدرس"}
                      </p>
                      <h4 className="mt-1 text-lg font-black text-foreground">{lesson.title}</h4>
                    </div>
                    <span className="rounded-full bg-muted px-3 py-1.5 text-xs font-bold text-muted-foreground">
                      {answerCount.toLocaleString("ar")} من {lesson.questions.length.toLocaleString("ar")} إجابات
                    </span>
                  </div>

                  {lesson.questions.map((question, questionIndex) => (
                    <fieldset key={question.id} className="mt-4 rounded-2xl border border-border bg-background p-4" data-testid={`question-verbal-book-${question.id}`}>
                      <legend className="px-1 text-sm font-black text-foreground">
                        السؤال { (questionIndex + 1).toLocaleString("ar") }
                      </legend>
                      {question.passageText ? (
                        <div className="mb-3 rounded-xl border border-primary/15 bg-primary/5 p-3">
                          {question.passageLabel ? <p className="mb-1 text-xs font-black text-primary">{question.passageLabel}</p> : null}
                          <p className="whitespace-pre-line text-sm leading-7 text-foreground">{question.passageText}</p>
                        </div>
                      ) : null}
                      <p className="text-sm leading-7 text-foreground">{question.prompt}</p>
                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        {question.options.map((option, optionIndex) => {
                          const isSelected = selectedAnswers[question.id] === optionIndex;
                          return (
                            <button
                              key={`${question.id}-${optionIndex}`}
                              type="button"
                              aria-pressed={isSelected}
                              onClick={() => setSelectedAnswers((current) => ({ ...current, [question.id]: optionIndex }))}
                              className={`rounded-xl border px-3 py-3 text-right text-sm leading-6 transition ${
                                isSelected
                                  ? "border-primary bg-primary/10 font-black text-foreground"
                                  : "border-border bg-card text-foreground hover:border-primary/40"
                              }`}
                              data-testid={`button-verbal-book-answer-${question.id}-${optionIndex}`}
                            >
                              <span className="ml-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-black">
                                {"أبجد"[optionIndex] || optionIndex + 1}
                              </span>
                              {option}
                            </button>
                          );
                        })}
                      </div>
                    </fieldset>
                  ))}

                  {quizResult ? (
                    <div className={`mt-5 rounded-2xl border p-4 ${quizResult.passed ? "border-emerald-500/25 bg-emerald-500/5" : "border-amber-500/25 bg-amber-500/5"}`} role="status" data-testid="status-verbal-book-quiz-result">
                      <div className="flex items-center gap-2">
                        {quizResult.passed ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <CircleHelp className="h-5 w-5 text-amber-600" />}
                        <p className="font-black text-foreground">
                          {quizResult.passed ? "اجتزت الاختبار" : "تحتاج إلى مراجعة إضافية"}
                        </p>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        نتيجتك {quizResult.score.toLocaleString("ar")}٪ · {quizResult.correctAnswers.toLocaleString("ar")} من {quizResult.totalQuestions.toLocaleString("ar")} إجابات صحيحة · درجة الاجتياز {quizResult.passingScore.toLocaleString("ar")}٪.
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {quizResult.passed ? (
                          <Button type="button" onClick={() => void openNextAvailableLesson()} className="rounded-xl font-black" data-testid="button-next-verbal-book-lesson">
                            {quizResult.unlockedNextLessonId ? "افتح الدرس التالي" : "تحديث خارطة الدروس"}
                          </Button>
                        ) : (
                          <Button type="button" variant="outline" onClick={() => void retryQuiz()} className="rounded-xl font-black" data-testid="button-retry-verbal-book-quiz">
                            <RotateCcw className="ml-2 h-4 w-4" />
                            ابدأ مراجعة وأسئلة جديدة
                          </Button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <>
                      {submitQuiz.isError ? (
                        <p className="mt-4 rounded-xl border border-destructive/25 bg-destructive/5 p-3 text-sm text-destructive" role="alert">
                          تعذر حفظ نتيجة الاختبار. {submitQuiz.error instanceof Error ? submitQuiz.error.message : "أعد المحاولة."}
                        </p>
                      ) : null}
                      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                        <p className="text-xs text-muted-foreground">أجب عن جميع الأسئلة قبل إرسال الاختبار.</p>
                        <Button type="button" onClick={submitAnswers} disabled={!allAnswered || submitQuiz.isPending} className="rounded-xl font-black" data-testid="button-submit-verbal-book-quiz">
                          {submitQuiz.isPending ? <LoaderCircle className="ml-2 h-4 w-4 animate-spin" /> : <FileCheck2 className="ml-2 h-4 w-4" />}
                          {submitQuiz.isPending ? "جارٍ حفظ النتيجة…" : "إرسال الإجابات"}
                        </Button>
                      </div>
                    </>
                  )}
                </section>
              ) : null}
            </>
          )}
        </main>

        <aside className="rounded-3xl border border-border bg-card p-4 shadow-sm">
          <div className="mb-3 flex items-start justify-between gap-3 border-b border-border pb-4">
            <div>
              <h3 className="font-black text-foreground">خريطة الكتاب</h3>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                {bookQuery.data.totalTopicCount.toLocaleString("ar")} موضوعًا في خمسة أبواب
              </p>
            </div>
            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-black text-primary">
              {bookQuery.data.publishedLessonCount.toLocaleString("ar")} منشورة
            </span>
          </div>
          <div className="max-h-[680px] space-y-3 overflow-y-auto pl-1">
            {bookQuery.data.chapters.map((chapter) => (
              <details key={chapter.id} open={chapter.topics.some((topic) => topic.id === selectedLessonId)} className="rounded-2xl border border-border bg-background">
                <summary className="cursor-pointer list-none px-3 py-3 text-sm font-black text-foreground" data-testid={`chapter-verbal-book-${chapter.id}`}>
                  <span className="flex items-center justify-between gap-2">
                    {chapter.title}
                    <span className="text-[11px] font-bold text-muted-foreground">{chapter.topics.length.toLocaleString("ar")} موضوعات</span>
                  </span>
                </summary>
                <div className="space-y-1 px-2 pb-2">
                  {chapter.topics.map((topic) => {
                    const isOpenable = topic.status === "available" || topic.status === "completed";
                    const isSelected = selectedLessonId === topic.id;
                    return (
                      <button
                        key={topic.id}
                        type="button"
                        disabled={!isOpenable}
                        onClick={() => selectLesson(topic.id)}
                        className={`flex w-full items-start gap-2 rounded-xl px-2.5 py-2 text-right transition ${
                          isSelected ? "bg-primary/10 text-foreground" : isOpenable ? "text-foreground hover:bg-muted" : "text-muted-foreground"
                        } disabled:cursor-not-allowed`}
                        data-testid={`button-verbal-book-topic-${topic.id}`}
                      >
                        <span className="mt-0.5 shrink-0">
                          {topic.status === "completed" ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> :
                            topic.status === "locked" ? <LockKeyhole className="h-4 w-4" /> :
                              topic.status === "coming_soon" ? <Clock3 className="h-4 w-4" /> :
                                <BookOpen className="h-4 w-4 text-primary" />}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-xs font-black leading-5">{topic.title}</span>
                          <span className="mt-0.5 block text-[10px] font-bold opacity-75">{topicStatusLabel(topic.status)}</span>
                        </span>
                        {topic.lastScore !== null ? (
                          <span className="shrink-0 text-[10px] font-black text-muted-foreground">{topic.lastScore.toLocaleString("ar")}٪</span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </details>
            ))}
          </div>
          {selectedTopic?.status === "locked" ? (
            <p className="mt-3 rounded-xl bg-muted p-3 text-xs leading-5 text-muted-foreground">
              اجتز الدرس المنشور السابق لفتح هذا الدرس.
            </p>
          ) : null}
        </aside>
      </div>
    </section>
  );
}
