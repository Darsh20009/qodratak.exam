import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight, BookOpen, Check, CheckCircle2, ChevronLeft, Clock3,
  ExternalLink, LockKeyhole, RefreshCw, ShieldCheck, Sparkles, Target, XCircle,
} from "lucide-react";
import {
  getGetQudratQuantitativeBookQueryKey,
  getGetQudratQuantitativeBookLessonQueryKey,
  useGetQudratQuantitativeBook,
  useGetQudratQuantitativeBookLesson,
  useSubmitQudratQuantitativeBookLesson,
} from "@workspace/api-client-react";

const basePath = "/student/foundation-book/quantitative";
const answerLetters = ["أ", "ب", "ج", "د"];

function Skeleton() {
  return <div className="mx-auto max-w-6xl space-y-5 p-5 md:p-9" dir="rtl">
    <div className="h-48 animate-pulse rounded-[2rem] bg-[#e7e9df]" />
    <div className="grid gap-4 md:grid-cols-2">{[1, 2, 3, 4].map((n) => <div key={n} className="h-32 animate-pulse rounded-2xl bg-[#e7e9df]" />)}</div>
  </div>;
}

function ErrorPanel({ retry, message }: { retry: () => void; message?: string }) {
  return <div className="mx-auto my-16 max-w-lg rounded-3xl border border-[#e9c9bd] bg-[#fff8f3] p-8 text-center" dir="rtl">
    <p className="text-lg font-black text-[#273a35]">لم نتمكن من تحميل محتوى الكتاب</p>
    <p className="mt-2 text-sm leading-7 text-[#68736c]">{message || "تحقق من اتصالك ثم أعد المحاولة. تقدمك محفوظ."}</p>
    <button data-testid="button-retry-book" onClick={retry} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#203f38] px-5 py-3 font-bold text-white"><RefreshCw size={16} /> إعادة المحاولة</button>
  </div>;
}

export function QuantitativeBookOverviewPage() {
  const [, setLocation] = useLocation();
  const bookQuery = useGetQudratQuantitativeBook();
  const book = bookQuery.data;
  if (bookQuery.isLoading) return <Skeleton />;
  if (bookQuery.isError || !book) return <ErrorPanel retry={() => void bookQuery.refetch()} message={bookQuery.error?.message} />;
  const progress = book.totalTopicCount ? Math.round(book.completedLessonCount / book.totalTopicCount * 100) : 0;
  return <main className="min-h-[100dvh] bg-[#f4f2e9] px-4 py-6 text-[#20352f] sm:px-7 md:py-10" dir="rtl">
    <div className="mx-auto max-w-6xl">
      <Link href="/student-program/qudrat?section=foundation" className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-[#68756e] hover:text-[#203f38]"><ArrowRight size={16} /> مسار التأسيس</Link>
      <section className="relative overflow-hidden rounded-[2rem] bg-[#173d36] px-6 py-8 text-[#f6f3e9] sm:px-10 sm:py-11">
        <div className="absolute -left-10 -top-16 h-64 w-64 rounded-full border border-[#d9dfb0]/20" />
        <div className="absolute -left-2 -top-8 h-48 w-48 rounded-full border border-[#d9dfb0]/20" />
        <div className="relative grid gap-8 md:grid-cols-[1fr_250px] md:items-end">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-[#dbe3b4]/15 px-3 py-1.5 text-xs font-bold text-[#dce5b5]"><BookOpen size={14} /> كتاب التأسيس الكمي</span>
            <h1 data-testid="text-book-title" className="mt-5 max-w-3xl text-3xl font-black leading-tight sm:text-5xl">{book.title}</h1>
            <p className="mt-4 max-w-2xl text-sm leading-8 text-[#d4dfd2] sm:text-base">{book.description}</p>
            <div className="mt-6 flex flex-wrap gap-3 text-xs font-bold">
              <span className="rounded-full border border-white/15 px-3 py-2">٥٠ موضوعًا في الخريطة</span>
              <span className="rounded-full border border-white/15 px-3 py-2">{book.publishedLessonCount} دروس منشورة الآن</span>
              <span className="rounded-full border border-white/15 px-3 py-2">اجتياز من {book.passingScore}%</span>
            </div>
          </div>
          <div className="rounded-2xl border border-white/15 bg-[#0e302b]/50 p-5">
            <div className="flex items-center justify-between text-sm"><span className="font-bold text-[#d4dfd2]">إنجازك</span><span className="font-black">{book.completedLessonCount} / {book.totalTopicCount}</span></div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/15"><div className="h-full rounded-full bg-[#d9e5ae] transition-all" style={{ width: `${progress}%` }} /></div>
            <p className="mt-3 text-xs leading-6 text-[#bfd0c5]">تُفتح الدروس بالتتابع بعد تحقيق درجة الاجتياز.</p>
          </div>
        </div>
      </section>
      {book.focus && <aside className="mt-5 flex gap-3 rounded-2xl border border-[#d5daba] bg-[#edf0df] p-4">
        <Target className="mt-1 shrink-0 text-[#58745f]" size={19} />
        <div><p className="font-black">{book.focus.title}</p><p className="mt-1 text-sm leading-6 text-[#65736a]">{book.focus.message}</p>
          <p className="mt-2 text-xs text-[#7d877d]">ملاحظة من محاولاتك ({book.focus.observations} رصدًا) — مؤشر للمراجعة وليس تشخيصًا.</p>
        </div>
      </aside>}
      <div className="mb-4 mt-9 flex items-end justify-between gap-4">
        <div><p className="text-xs font-black uppercase tracking-[.18em] text-[#818b79]">خارطة الطريق</p><h2 className="mt-1 text-2xl font-black">من الأساس إلى الإتقان</h2></div>
        <span className="hidden rounded-full bg-white px-3 py-2 text-xs font-bold text-[#68756e] sm:inline-flex">{book.totalTopicCount} موضوعًا</span>
      </div>
      <div className="space-y-5">
        {book.chapters.map((chapter) => <section key={chapter.id} className="rounded-[1.65rem] border border-[#e3e2d8] bg-[#fbfaf5] p-4 sm:p-6">
          <div className="mb-4 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e9edda] text-sm font-black text-[#426452]">{String(chapter.order).padStart(2, "0")}</span>
            <div><p className="text-[10px] font-black tracking-widest text-[#859080]">الفصل {chapter.order}</p><h3 className="text-lg font-black">{chapter.title}</h3></div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {chapter.topics.map((topic) => {
              const available = topic.status === "available" || topic.status === "completed";
              const coming = topic.status === "coming_soon";
              return <button
                key={topic.id}
                data-testid={`topic-${topic.id}`}
                disabled={!available}
                onClick={() => available && setLocation(`${basePath}/${encodeURIComponent(topic.id)}`)}
                className={`group flex min-h-[82px] items-start gap-3 rounded-xl border p-3 text-right transition ${available ? "border-[#e4e5da] bg-white hover:border-[#86a18a] hover:bg-[#f5f7ef]" : "border-transparent bg-[#f1f0e9] opacity-75"}`}
              >
                <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-black ${topic.status === "completed" ? "bg-[#dcebdc] text-[#3f7655]" : available ? "bg-[#e9edda] text-[#47644e]" : "bg-[#e8e7df] text-[#92958b]"}`}>
                  {topic.status === "completed" ? <Check size={15} /> : coming ? <Clock3 size={14} /> : topic.status === "locked" ? <LockKeyhole size={14} /> : String(topic.order).padStart(2, "0")}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center justify-between gap-1">
                    <span className="text-sm font-black">{topic.title}</span>
                    {topic.lastScore !== null && topic.lastScore !== undefined && <span className="text-[10px] font-bold text-[#788477]">آخر نتيجة {topic.lastScore}%</span>}
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-[#778077]">{coming ? "سيُنشر هذا الموضوع لاحقًا" : topic.summary}</span>
                </span>
                {available && <ChevronLeft size={16} className="mt-1 shrink-0 text-[#9aa295] group-hover:text-[#426452]" />}
              </button>;
            })}
          </div>
        </section>)}
      </div>
    </div>
  </main>;
}

export function QuantitativeBookLessonPage({ lessonId }: { lessonId: string }) {
  const [, setLocation] = useLocation();
  const client = useQueryClient();
  const lessonQuery = useGetQudratQuantitativeBookLesson(lessonId, { query: { enabled: Boolean(lessonId), queryKey: getGetQudratQuantitativeBookLessonQueryKey(lessonId) } });
  const submit = useSubmitQudratQuantitativeBookLesson();
  const lesson = lessonQuery.data;
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const startedAtRef = useRef(Date.now());
  const [result, setResult] = useState<NonNullable<typeof submit.data> | null>(null);
  const answered = useMemo(() => Object.keys(answers).length, [answers]);
  useEffect(() => {
    setAnswers({});
    setResult(null);
    startedAtRef.current = Date.now();
  }, [lessonId]);
  if (lessonQuery.isLoading) return <Skeleton />;
  if (lessonQuery.isError || !lesson) return <ErrorPanel retry={() => void lessonQuery.refetch()} message={lessonQuery.error?.message} />;

  const send = () => {
    if (answered !== lesson.questions.length || submit.isPending) return;
    submit.mutate({ lessonId, data: {
      answers: lesson.questions.map((q) => ({ questionId: q.id, selectedOptionIndex: answers[q.id] })),
       timeTakenSeconds: Math.min(7200, Math.max(0, Math.floor((Date.now() - startedAtRef.current) / 1000))),
      idempotencyKey: `${lessonId}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    } }, { onSuccess: async (data) => {
      setResult(data);
      await Promise.all([
        client.invalidateQueries({ queryKey: getGetQudratQuantitativeBookQueryKey() }),
        client.invalidateQueries({ queryKey: getGetQudratQuantitativeBookLessonQueryKey(lessonId) }),
      ]);
    } });
  };
  return <main className="min-h-[100dvh] bg-[#f4f2e9] px-4 py-6 text-[#20352f] sm:px-7 md:py-10" dir="rtl">
    <article className="mx-auto max-w-4xl">
      <Link href={basePath} className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-[#68756e] hover:text-[#203f38]"><ArrowRight size={16} /> خارطة الكتاب</Link>
      <header className="rounded-[2rem] bg-[#173d36] p-6 text-[#f6f3e9] sm:p-9">
        <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-[#c9d5c8]"><span>{lesson.chapterTitle}</span><span>·</span><span className="inline-flex items-center gap-1"><Clock3 size={13} /> {lesson.estimatedMinutes} دقائق</span></div>
        <h1 data-testid="text-lesson-title" className="mt-4 text-3xl font-black leading-tight sm:text-4xl">{lesson.title}</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-[#d4dfd2]">{lesson.summary}</p>
        <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-xs font-bold text-[#e0e8d0]"><ShieldCheck size={15} /> {lesson.mode === "remediation" ? "مجموعة مراجعة مركزة" : "درس واختبار إتقان"} · الاجتياز {lesson.passingScore}%</div>
      </header>
      <div className="mt-5 space-y-4">
        {lesson.sections.map((section, i) => <section key={section.id} className="rounded-2xl border border-[#e3e2d8] bg-[#fbfaf5] p-5 sm:p-7">
          <div className="mb-3 flex items-center gap-3"><span className="text-xs font-black text-[#728574]">٠{i + 1}</span><h2 className="text-lg font-black">{section.title}</h2></div>
          <div className="space-y-3 text-sm leading-8 text-[#56665d]">{section.paragraphs.map((p, pi) => <p key={`${section.id}-${pi}`}>{p}</p>)}</div>
          {section.workedExample && <div className="mt-5 rounded-xl border-r-4 border-[#96a56e] bg-[#eff1e5] p-4">
            <p className="font-black text-[#344d40]">مثال محلول</p><p className="mt-2 font-bold">{section.workedExample.question}</p>
            <ol className="mt-2 list-inside list-decimal space-y-1 text-sm leading-7 text-[#56665d]">{section.workedExample.steps.map((step, si) => <li key={si}>{step}</li>)}</ol>
            <p className="mt-2 text-sm font-black text-[#3c684d]">الإجابة: {section.workedExample.answer}</p>
          </div>}
        </section>)}
      </div>
      {lesson.sources.length > 0 && <section className="mt-5 rounded-2xl border border-[#e3e2d8] bg-[#fbfaf5] p-5">
        <h2 className="font-black">مصادر هذا الدرس</h2><div className="mt-3 flex flex-wrap gap-2">{lesson.sources.map((source) => <a key={source.id} data-testid={`link-source-${source.id}`} href={source.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg bg-[#eff1e8] px-3 py-2 text-xs font-bold text-[#426452] hover:bg-[#e5ead9]">{source.title} · {source.organization}<ExternalLink size={13} /></a>)}</div>
      </section>}
      <section className="mt-6 rounded-[1.7rem] border border-[#dfe2d4] bg-[#fbfaf5] p-5 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><p className="text-xs font-black tracking-widest text-[#75836f]">إثبات الفهم</p><h2 className="mt-1 text-2xl font-black">اختبر إتقانك</h2><p className="mt-2 text-sm text-[#6c786f]">اختر إجابة لكل سؤال. التصحيح والشرح يظهران بعد الإرسال من الخادم.</p></div>
          <span className="rounded-full bg-[#edf0e2] px-3 py-2 text-xs font-black text-[#50694f]">{answered} / {lesson.questions.length} مجاب</span>
        </div>
        {lesson.focusSkills.length > 0 && <p className="mt-4 flex items-start gap-2 rounded-xl bg-[#f0f1e8] p-3 text-xs leading-6 text-[#69766a]"><Sparkles size={15} className="mt-1 shrink-0 text-[#71845c]" /> مهارات المجموعة: {lesson.focusSkills.map((skill) => skill.title).join("، ")}</p>}
        <div className="mt-5 space-y-4">
          {lesson.questions.map((question, qi) => <fieldset key={question.id} className="rounded-xl border border-[#e5e5db] bg-white p-4 sm:p-5">
            <legend className="px-1 text-xs font-black text-[#71806f]">السؤال {qi + 1}</legend>
            <p className="text-sm font-bold leading-7">{question.prompt}</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">{question.options.map((option, oi) => {
              const selected = answers[question.id] === oi;
              return <button type="button" data-testid={`answer-${question.id}-${oi}`} key={oi} onClick={() => !result && setAnswers((old) => ({ ...old, [question.id]: oi }))} disabled={Boolean(result)}
                className={`flex items-center gap-3 rounded-xl border px-3 py-3 text-right text-sm transition ${selected ? "border-[#66866b] bg-[#eef3e8] font-black text-[#345941]" : "border-[#e7e8df] bg-[#fcfcf8] hover:border-[#aab89c]"} ${result && selected ? "cursor-default" : ""}`}>
                 <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-black ${selected ? "bg-[#52735b] text-white" : "bg-[#eeefe8] text-[#778177]"}`}>{answerLetters[oi] ?? String(oi + 1)}</span>{option}
              </button>;
            })}</div>
          </fieldset>)}
        </div>
        {submit.isError && <p role="alert" className="mt-4 rounded-xl bg-[#fff0ea] p-3 text-sm font-bold text-[#9b4937]">{submit.error.message || "تعذر تسليم الإجابات. يمكنك المحاولة مجددًا."}</p>}
        {!result && <button data-testid="button-submit-quiz" type="button" disabled={answered !== lesson.questions.length || submit.isPending} onClick={send} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#203f38] px-5 py-3.5 text-sm font-black text-white transition hover:bg-[#2b5147] disabled:cursor-not-allowed disabled:bg-[#aab2a7]">
          {submit.isPending ? "جارٍ التصحيح..." : answered !== lesson.questions.length ? `أجب عن ${lesson.questions.length - answered} سؤال${lesson.questions.length - answered === 1 ? "" : "ات"} لإكمال التسليم` : "إرسال الإجابات للتصحيح"}
        </button>}
        {result && <div className={`mt-6 rounded-2xl border p-5 ${result.passed ? "border-[#c8ddc8] bg-[#eef5ec]" : "border-[#ead6ba] bg-[#fbf2e6]"}`}>
          <div className="flex items-center gap-3">
            {result.passed ? <CheckCircle2 className="text-[#4f7b58]" size={25} /> : <XCircle className="text-[#a46c3f]" size={25} />}
            <div><h3 className="text-lg font-black">{result.passed ? "اجتزت الدرس" : "لم تصل إلى حد الاجتياز بعد"}</h3><p className="text-sm text-[#68766a]">نتيجتك {result.score}% · {result.correctAnswers} من {result.totalQuestions} · المحاولة {result.attemptNumber} · المطلوب {result.passingScore}%</p></div>
          </div>
          <p className="mt-3 text-sm leading-7 text-[#59695e]">{result.passed ? "أحسنت. تم تسجيل إتقانك وفتح الخطوة التالية عند توفرها." : "راجع الشروحات أدناه ثم جرّب مرة أخرى. الدرس التالي يبقى مقفلًا حتى تحقق حد الاجتياز."}</p>
          <div className="mt-4 space-y-3">{result.questionDetails.map((detail, idx) => <div key={detail.questionId} className="rounded-xl border border-black/5 bg-white/70 p-4">
            <div className="flex items-start gap-2"><span className={`mt-1 ${detail.isCorrect ? "text-[#4f7b58]" : "text-[#a45d42]"}`}>{detail.isCorrect ? <CheckCircle2 size={17} /> : <XCircle size={17} />}</span><div className="min-w-0 flex-1"><p className="text-sm font-black">السؤال {idx + 1}: {detail.prompt}</p>
              <p className="mt-2 text-xs leading-6 text-[#68766b]">إجابتك: {detail.selectedOptionText ?? "—"} {detail.isCorrect ? "— صحيحة" : "— غير صحيحة"}{!detail.isCorrect && <span> · الإجابة الصحيحة: {detail.correctAnswer}</span>}</p>
              {detail.selectedOptionFeedback && <p className="mt-2 rounded-lg bg-[#f3f0e8] p-3 text-xs leading-6 text-[#77664f]">{detail.selectedOptionFeedback}</p>}
              <p className="mt-2 text-sm leading-7 text-[#53665a]">{detail.explanation}</p>
            </div></div>
          </div>)}</div>
          <button type="button" data-testid="button-back-book-map" onClick={() => setLocation(basePath)} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#203f38] px-4 py-3 text-sm font-bold text-white"><ArrowRight size={15} /> العودة إلى خارطة الكتاب</button>
        </div>}
      </section>
    </article>
  </main>;
}