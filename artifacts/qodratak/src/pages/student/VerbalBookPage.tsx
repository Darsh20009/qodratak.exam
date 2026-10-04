import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight, BookOpen, Check, CheckCircle2, ChevronLeft, Clock3,
  ExternalLink, LockKeyhole, RefreshCw, Search, ShieldCheck, Sparkles, XCircle,
} from "lucide-react";
import {
  getGetQudratVerbalBookQueryKey,
  getGetQudratVerbalBookLessonQueryKey,
  useGetQudratVerbalBook,
  useGetQudratVerbalBookLesson,
  useSubmitQudratVerbalBookLesson,
} from "@workspace/api-client-react";

const basePath = "/student/foundation-book/verbal";
const answerLetters = ["أ", "ب", "ج", "د"];

function Skeleton() {
  return <div className="mx-auto max-w-6xl space-y-5 p-5 md:p-9" dir="rtl">
    <div className="h-48 animate-pulse rounded-[2rem] bg-[#e7e9df]" />
    <div className="grid gap-4 md:grid-cols-2">{[1, 2, 3, 4].map((n) => <div key={n} className="h-32 rounded-2xl bg-[#e7e9df]" />)}</div>
  </div>;
}

function ErrorPanel({ retry, message }: { retry: () => void; message?: string }) {
  return <div className="mx-auto my-16 max-w-lg rounded-3xl border border-[#e9c9bd] bg-[#fff8f3] p-8 text-center" dir="rtl">
    <p className="text-lg font-black text-[#273a35]">لم نتمكن من تحميل الكتاب اللفظي</p>
    <p className="mt-2 text-sm leading-7 text-[#68736c]">{message || "تحقق من اتصالك ثم أعد المحاولة. تقدمك محفوظ."}</p>
    <button data-testid="button-retry-verbal-book" onClick={() => void retry()} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#203f38] px-5 py-3 font-bold text-white"><RefreshCw size={16} /> إعادة المحاولة</button>
  </div>;
}

function getPassageLeadIds(questions: Array<{ id?: string; questionId?: string; passageLabel?: string; passageText?: string }>) {
  const seen = new Set<string>();
  const leadIds = new Set<string>();
  for (const question of questions) {
    const id = question.id ?? question.questionId;
    if (!question.passageText || !id) continue;
    const key = `${question.passageLabel ?? ""}\u0000${question.passageText}`;
    if (seen.has(key)) continue;
    seen.add(key);
    leadIds.add(id);
  }
  return leadIds;
}

export function VerbalBookOverviewPage() {
  const [, setLocation] = useLocation();
  const bookQuery = useGetQudratVerbalBook();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "available" | "completed">("all");
  const book = bookQuery.data;
  if (bookQuery.isLoading) return <Skeleton />;
  if (bookQuery.isError || !book) return <ErrorPanel retry={() => bookQuery.refetch()} message={bookQuery.error?.message} />;
  const progress = book.totalTopicCount ? Math.round(book.completedLessonCount / book.totalTopicCount * 100) : 0;
  const normalizedSearch = search.trim().toLocaleLowerCase("ar");
  const visibleChapters = book.chapters.map((chapter) => ({
    ...chapter,
    topics: chapter.topics.filter((topic) => {
      const matchesSearch = !normalizedSearch
        || topic.title.toLocaleLowerCase("ar").includes(normalizedSearch)
        || topic.summary.toLocaleLowerCase("ar").includes(normalizedSearch);
      const matchesFilter = filter === "all"
        || (filter === "available" && (topic.status === "available" || topic.status === "completed"))
        || (filter === "completed" && topic.status === "completed");
      return matchesSearch && matchesFilter;
    }),
  })).filter((chapter) => chapter.topics.length > 0);
  const visibleTopicCount = visibleChapters.reduce((count, chapter) => count + chapter.topics.length, 0);

  return <main className="min-h-[100dvh] bg-[#f4f2e9] px-4 py-6 text-[#20352f] sm:px-7 md:py-10" dir="rtl">
    <div className="mx-auto max-w-6xl">
      <Link href="/foundation?program=qudrat&subject=verbal" className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-[#68756e] transition hover:text-[#203f38]"><ArrowRight size={16} /> مسار التأسيس اللفظي</Link>
      <section className="relative isolate overflow-hidden rounded-[2rem] bg-[#173d36] px-6 py-8 text-[#f6f3e9] shadow-[0_24px_70px_-40px_rgba(23,61,54,.75)] sm:px-10 sm:py-11">
        <div aria-hidden="true" className="pointer-events-none absolute -left-12 -top-16 h-64 w-64 rounded-full border border-[#d9dfb0]/20" />
        <div aria-hidden="true" className="pointer-events-none absolute -left-2 -top-8 h-48 w-48 rounded-full border border-[#d9dfb0]/20" />
        <div aria-hidden="true" className="pointer-events-none absolute bottom-0 left-[18%] top-0 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent" />
        <div className="relative grid gap-8 md:grid-cols-[1fr_250px] md:items-end">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-[#dbe3b4]/15 px-3 py-1.5 text-xs font-bold text-[#dce5b5]"><BookOpen size={14} /> تأسيس القدرات اللفظي</span>
            <h1 data-testid="text-verbal-book-title" className="mt-5 max-w-3xl text-3xl font-black leading-tight sm:text-5xl">{book.title}</h1>
            <p className="mt-4 max-w-2xl text-sm leading-8 text-[#d4dfd2] sm:text-base">{book.description}</p>
            <div className="mt-6 flex flex-wrap gap-3 text-xs font-bold">
              <span className="rounded-full border border-white/15 px-3 py-2">{book.totalTopicCount} موضوعًا في الخريطة</span>
              <span className="rounded-full border border-white/15 px-3 py-2">{book.publishedLessonCount} دروس منشورة الآن</span>
              <span className="rounded-full border border-white/15 px-3 py-2">اجتياز من {book.passingScore}%</span>
            </div>
            <a href="#verbal-map" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[#dce5b5] px-4 py-3 text-sm font-black text-[#183c34] transition hover:bg-[#e7edcc]">
              ابدأ من الخارطة <ChevronLeft size={16} />
            </a>
          </div>
          <div className="rounded-2xl border border-white/15 bg-[#0e302b]/50 p-5">
            <div className="flex items-end justify-between gap-2"><span className="text-sm font-bold text-[#d4dfd2]">إنجازك في الكتاب</span><span className="text-2xl font-black tabular-nums">{progress}<span className="mr-1 text-sm">٪</span></span></div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/15"><div className="h-full rounded-full bg-[#d9e5ae] transition-all duration-500" style={{ width: `${progress}%` }} /></div>
            <div className="mt-3 flex items-center justify-between text-xs text-[#bfd0c5]"><span>دروس مكتملة</span><span className="font-bold">{book.completedLessonCount} من {book.totalTopicCount}</span></div>
            <p className="mt-4 border-t border-white/10 pt-3 text-xs leading-6 text-[#bfd0c5]">تُفتح الدروس المنشورة بالتتابع بعد تحقيق درجة الاجتياز.</p>
          </div>
        </div>
      </section>
      <div id="verbal-map" className="mb-4 mt-9 flex flex-wrap items-end justify-between gap-4 scroll-mt-6">
        <div><p className="text-xs font-black uppercase tracking-[.18em] text-[#818b79]">خارطة الطريق</p><h2 className="mt-1 text-2xl font-black">من فهم الكلمة إلى قراءة النص</h2><p className="mt-2 text-sm text-[#778077]">تقدّم خطوة بخطوة؛ كل درس يضيف مهارة واضحة إلى رصيدك.</p></div>
        <span className="rounded-full bg-white px-3 py-2 text-xs font-bold text-[#68756e]">{book.totalTopicCount} موضوعًا</span>
      </div>
      <section className="mb-5 rounded-2xl border border-[#e3e2d8] bg-[#fbfaf5] p-3 sm:flex sm:items-center sm:gap-3 sm:p-4" aria-label="البحث والتصفية في مواضيع الكتاب">
        <label className="relative block min-w-0 flex-1">
          <Search size={17} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#879184]" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} type="search" placeholder="ابحث عن موضوع أو مهارة..." className="h-11 w-full rounded-xl border border-[#e5e5da] bg-white pr-10 pl-3 text-sm outline-none transition placeholder:text-[#9ca399] focus:border-[#7c9a7e] focus:ring-2 focus:ring-[#dce7d5]" />
        </label>
        <div className="mt-3 flex flex-wrap gap-2 sm:mt-0" role="group" aria-label="تصفية المواضيع">
          {([
            ["all", "كل المواضيع"],
            ["available", "المتاح"],
            ["completed", "المكتمل"],
          ] as const).map(([value, label]) => <button key={value} type="button" aria-pressed={filter === value} onClick={() => setFilter(value)} className={`rounded-xl px-3 py-2.5 text-xs font-black transition ${filter === value ? "bg-[#203f38] text-white" : "bg-[#eff0e8] text-[#667367] hover:bg-[#e5e9dc]"}`}>{label}</button>)}
          <span className="mr-auto self-center px-1 text-xs font-bold text-[#879184]">{visibleTopicCount} موضوع</span>
        </div>
      </section>
      <div className="space-y-5">
        {visibleChapters.length === 0 && <div className="rounded-2xl border border-dashed border-[#d9ddd0] bg-[#fbfaf5] px-5 py-12 text-center">
          <Search className="mx-auto text-[#8d9a88]" size={24} />
          <p className="mt-3 font-black">لا توجد مواضيع مطابقة</p>
          <p className="mt-1 text-sm text-[#778077]">جرّب عبارة بحث أخرى أو اعرض كل المواضيع.</p>
          <button type="button" onClick={() => { setSearch(""); setFilter("all"); }} className="mt-4 rounded-xl bg-[#203f38] px-4 py-2.5 text-sm font-bold text-white">عرض الخارطة كاملة</button>
        </div>}
        {visibleChapters.map((chapter) => <section key={chapter.id} className="rounded-[1.65rem] border border-[#e3e2d8] bg-[#fbfaf5] p-4 sm:p-6">
          <div className="mb-4 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e9edda] text-sm font-black text-[#426452]">{String(chapter.order).padStart(2, "0")}</span>
            <div className="min-w-0 flex-1"><p className="text-[10px] font-black tracking-widest text-[#859080]">الفصل {chapter.order}</p><h3 className="text-lg font-black">{chapter.title}</h3></div>
            <span className="rounded-full bg-[#eff0e8] px-2.5 py-1.5 text-[10px] font-bold text-[#728071]">{chapter.topics.length} موضوع</span>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {chapter.topics.map((topic) => {
              const available = topic.status === "available" || topic.status === "completed";
              const coming = topic.status === "coming_soon";
              return <button
                key={topic.id}
                data-testid={`verbal-topic-${topic.id}`}
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

export function VerbalBookLessonPage({ lessonId }: { lessonId: string }) {
  const [, setLocation] = useLocation();
  const client = useQueryClient();
  const lessonQuery = useGetQudratVerbalBookLesson(lessonId, {
    query: { enabled: Boolean(lessonId), queryKey: getGetQudratVerbalBookLessonQueryKey(lessonId) },
  });
  const submit = useSubmitQudratVerbalBookLesson();
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
  if (lessonQuery.isError || !lesson) return <ErrorPanel retry={() => lessonQuery.refetch()} message={lessonQuery.error?.message} />;
  const passageLeadIds = getPassageLeadIds(lesson.questions);
  const resultPassageLeadIds = result ? getPassageLeadIds(result.questionDetails) : new Set<string>();

  const send = () => {
    if (answered !== lesson.questions.length || submit.isPending) return;
    submit.mutate({ lessonId, data: {
      answers: lesson.questions.map((question) => ({ questionId: question.id, selectedOptionIndex: answers[question.id] })),
      timeTakenSeconds: Math.min(7200, Math.max(0, Math.floor((Date.now() - startedAtRef.current) / 1000))),
      idempotencyKey: `${lessonId}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    } }, { onSuccess: async (data) => {
      setResult(data);
      await Promise.all([
        client.invalidateQueries({ queryKey: getGetQudratVerbalBookQueryKey() }),
        client.invalidateQueries({ queryKey: getGetQudratVerbalBookLessonQueryKey(lessonId) }),
      ]);
    } });
  };

  return <main className="min-h-[100dvh] bg-[#f4f2e9] px-4 py-6 text-[#20352f] sm:px-7 md:py-10" dir="rtl">
    <article className="mx-auto max-w-4xl">
      <Link href={basePath} className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-[#68756e] hover:text-[#203f38]"><ArrowRight size={16} /> خارطة الكتاب اللفظي</Link>
      <header className="rounded-[2rem] bg-[#173d36] p-6 text-[#f6f3e9] sm:p-9">
        <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-[#c9d5c8]"><span>{lesson.chapterTitle}</span><span>·</span><span className="inline-flex items-center gap-1"><Clock3 size={13} /> {lesson.estimatedMinutes} دقائق</span></div>
        <h1 data-testid="text-verbal-lesson-title" className="mt-4 text-3xl font-black leading-tight sm:text-4xl">{lesson.title}</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-[#d4dfd2]">{lesson.summary}</p>
        <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-xs font-bold text-[#e0e8d0]"><ShieldCheck size={15} /> {lesson.mode === "remediation" ? "مجموعة مراجعة مركزة" : "درس واختبار إتقان"} · الاجتياز {lesson.passingScore}%</div>
      </header>
      <div className="mt-5 space-y-4">
        {lesson.sections.map((section, index) => <section key={section.id} className="rounded-2xl border border-[#e3e2d8] bg-[#fbfaf5] p-5 sm:p-7">
          <div className="mb-4 flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#e9edda] text-xs font-black text-[#55705a]">{String(index + 1).padStart(2, "0")}</span>
            <div className="min-w-0 flex-1"><p className="text-[10px] font-black text-[#859080]">{section.kind === "concept" ? "مفهوم" : section.kind === "rule" ? "قاعدة" : section.kind === "example" ? "تطبيق" : "تنبيه"}</p><h2 className="text-lg font-black">{section.title}</h2></div>
            <span className="hidden h-px w-12 bg-[#dce2d1] sm:block" />
          </div>
          <div className="space-y-3 text-sm leading-8 text-[#56665d]">{section.paragraphs.map((paragraph, paragraphIndex) => <p key={`${section.id}-${paragraphIndex}`}>{paragraph}</p>)}</div>
          {section.workedExample && <div className="mt-5 rounded-xl border-r-4 border-[#96a56e] bg-[#eff1e5] p-4">
            <p className="font-black text-[#344d40]">مثال محلول</p><p className="mt-2 font-bold">{section.workedExample.question}</p>
            <ol className="mt-2 list-inside list-decimal space-y-1 text-sm leading-7 text-[#56665d]">{section.workedExample.steps.map((step, stepIndex) => <li key={stepIndex}>{step}</li>)}</ol>
            <p className="mt-2 text-sm font-black text-[#3c684d]">الإجابة: {section.workedExample.answer}</p>
          </div>}
        </section>)}
      </div>
      {lesson.sources.length > 0 && <section className="mt-5 rounded-2xl border border-[#e3e2d8] bg-[#fbfaf5] p-5">
        <h2 className="font-black">مصادر هذا الدرس</h2><div className="mt-3 flex flex-wrap gap-2">{lesson.sources.map((source) => <a key={source.id} href={source.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg bg-[#eff1e8] px-3 py-2 text-xs font-bold text-[#426452] hover:bg-[#e5ead9]">{source.title} · {source.organization}<ExternalLink size={13} /></a>)}</div>
      </section>}
      <section className="mt-6 rounded-[1.7rem] border border-[#dfe2d4] bg-[#fbfaf5] p-5 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><p className="text-xs font-black tracking-widest text-[#75836f]">إثبات الفهم</p><h2 className="mt-1 text-2xl font-black">اختبر إتقانك</h2><p className="mt-2 text-sm text-[#6c786f]">اختر إجابة لكل سؤال. التصحيح والشرح يظهران بعد الإرسال من الخادم.</p></div>
          <div className="min-w-32 rounded-xl bg-[#edf0e2] px-3 py-2">
            <div className="flex items-center justify-between gap-3 text-xs font-black text-[#50694f]"><span>التقدم</span><span>{answered} / {lesson.questions.length}</span></div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#d9decb]"><div className="h-full rounded-full bg-[#6b8c68] transition-all duration-300" style={{ width: `${lesson.questions.length ? answered / lesson.questions.length * 100 : 0}%` }} /></div>
          </div>
        </div>
        {lesson.focusSkills.length > 0 && <p className="mt-4 flex items-start gap-2 rounded-xl bg-[#eff1e8] p-3 text-xs leading-6 text-[#667368]"><Sparkles size={15} className="mt-1 shrink-0 text-[#71845c]" />يركّز هذا الاختبار على: {lesson.focusSkills.map((skill) => skill.title).join("، ")}</p>}
        <div className="mt-5 space-y-4">
          {lesson.questions.map((question, questionIndex) => <fieldset key={question.id} className="rounded-xl border border-[#e5e5db] bg-white p-4 sm:p-5">
            <legend className="px-1 text-xs font-black text-[#71806f]">السؤال {questionIndex + 1}</legend>
            {question.passageText && passageLeadIds.has(question.id) && <aside className="mb-4 rounded-xl border border-[#e3e8d7] bg-[#f5f6ef] p-4">
              {question.passageLabel && <h3 className="mb-2 text-sm font-black text-[#455c4a]">{question.passageLabel}</h3>}
              <p className="whitespace-pre-line text-sm leading-8 text-[#56665d]">{question.passageText}</p>
            </aside>}
            <p className="text-sm font-bold leading-7">{question.prompt}</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">{question.options.map((option, optionIndex) => {
              const selected = answers[question.id] === optionIndex;
              return <button type="button" key={optionIndex} aria-pressed={selected} data-testid={`verbal-answer-${question.id}-${optionIndex}`} onClick={() => !result && setAnswers((old) => ({ ...old, [question.id]: optionIndex }))} disabled={Boolean(result)}
                className={`flex min-h-12 items-center gap-3 rounded-xl border px-3 py-3 text-right text-sm transition ${selected ? "border-[#66866b] bg-[#eef3e8] font-black text-[#345941]" : "border-[#e7e8df] bg-[#fcfcf8] hover:border-[#aab89c]"} disabled:cursor-default`}>
                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-black ${selected ? "bg-[#52735b] text-white" : "bg-[#eeefe8] text-[#778177]"}`}>{answerLetters[optionIndex] ?? String(optionIndex + 1)}</span>{option}
              </button>;
            })}</div>
          </fieldset>)}
        </div>
        {submit.isError && <p role="alert" className="mt-4 rounded-xl bg-[#fff0ea] p-3 text-sm font-bold text-[#9b4937]">{submit.error.message || "تعذر تسليم الإجابات. يمكنك المحاولة مجددًا."}</p>}
        {!result && <button data-testid="button-submit-verbal-quiz" type="button" disabled={answered !== lesson.questions.length || submit.isPending} onClick={send} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#203f38] px-5 py-3.5 text-sm font-black text-white transition hover:bg-[#2b5147] disabled:cursor-not-allowed disabled:bg-[#aab2a7]">
          {submit.isPending ? "جارٍ التصحيح..." : answered !== lesson.questions.length ? `أجب عن ${lesson.questions.length - answered} سؤال${lesson.questions.length - answered === 1 ? "" : "ات"} لإكمال التسليم` : "إرسال الإجابات للتصحيح"}
        </button>}
        {result && <div className={`mt-6 rounded-2xl border p-5 ${result.passed ? "border-[#c8ddc8] bg-[#eef5ec]" : "border-[#ead6ba] bg-[#fbf2e6]"}`}>
          <div className="flex items-center gap-3">
            {result.passed ? <CheckCircle2 className="text-[#4f7b58]" size={25} /> : <XCircle className="text-[#a46c3f]" size={25} />}
            <div><h3 className="text-lg font-black">{result.passed ? "اجتزت الدرس" : "لم تصل إلى حد الاجتياز بعد"}</h3><p className="text-sm text-[#68766a]">نتيجتك {result.score}% · {result.correctAnswers} من {result.totalQuestions} · المحاولة {result.attemptNumber} · المطلوب {result.passingScore}%</p></div>
          </div>
          <p className="mt-3 text-sm leading-7 text-[#59695e]">{result.passed ? "أحسنت. تم تسجيل إتقانك وفتح الدرس المنشور التالي." : "راجع الشرح ثم جرّب مرة أخرى. ينتظرك اختبار مراجعة مختلف."}</p>
          <div className="mt-4 space-y-3">{result.questionDetails.map((detail, index) => <div key={detail.questionId} className="rounded-xl border border-black/5 bg-white/70 p-4">
            {detail.passageText && resultPassageLeadIds.has(detail.questionId) && <aside className="mb-3 rounded-xl bg-[#f5f6ef] p-3">
              {detail.passageLabel && <p className="mb-1 text-xs font-black text-[#455c4a]">{detail.passageLabel}</p>}
              <p className="text-xs leading-7 text-[#56665d]">{detail.passageText}</p>
            </aside>}
            <div className="flex items-start gap-2"><span className={`mt-1 ${detail.isCorrect ? "text-[#4f7b58]" : "text-[#a45d42]"}`}>{detail.isCorrect ? <CheckCircle2 size={17} /> : <XCircle size={17} />}</span><div className="min-w-0 flex-1"><p className="text-sm font-black">السؤال {index + 1}: {detail.prompt}</p>
              <p className="mt-2 text-xs leading-6 text-[#68766b]">إجابتك: {detail.selectedOptionText ?? "—"} {detail.isCorrect ? "— صحيحة" : "— غير صحيحة"}{!detail.isCorrect && <span> · الإجابة الصحيحة: {detail.correctAnswer}</span>}</p>
              {detail.selectedOptionFeedback && <p className="mt-2 rounded-lg bg-[#f3f0e8] p-3 text-xs leading-6 text-[#77664f]">{detail.selectedOptionFeedback}</p>}
              <p className="mt-2 text-sm leading-7 text-[#53665a]">{detail.explanation}</p>
            </div></div>
          </div>)}</div>
          <button type="button" data-testid="button-back-verbal-book-map" onClick={() => setLocation(basePath)} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#203f38] px-4 py-3 text-sm font-bold text-white"><ArrowRight size={15} /> العودة إلى خارطة الكتاب</button>
        </div>}
      </section>
    </article>
  </main>;
}