import React, { useMemo, useState } from "react";
import { FoundationContent, useFoundationContent } from "@/hooks/use-student";
import { verbalBankVideos } from "@/data/verbalBankVideos";
import { foundationSections, getFoundationSection, type FoundationProgram, type FoundationSection } from "@/data/foundationSections";
import { useLocation } from "wouter";
import { PlayCircle, Clock, CheckCircle2, Loader2, BookOpen, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type QuizQuestion = {
  _id?: string;
  id?: string | number;
  questionId?: number;
  text: string;
  options: string[];
  correctOptionIndex: number;
  explanation?: string;
  imageUrl?: string;
  imageUrls?: string[];
};

type QuizResult = {
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  skippedQuestions: number;
  passed: boolean;
  passingScore: number;
};

function getEmbedUrl(value: string) {
  try {
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol)) return null;

    if (url.hostname === "youtu.be") {
      const id = url.pathname.slice(1).split("/")[0];
      return id ? `https://www.youtube-nocookie.com/embed/${id}?controls=0&disablekb=1&fs=0&modestbranding=1&playsinline=1&rel=0` : null;
    }

    if (url.hostname.endsWith("youtube.com")) {
      if (url.pathname.startsWith("/embed/")) {
        const id = url.pathname.split("/").filter(Boolean)[1];
        return id ? `https://www.youtube-nocookie.com/embed/${id}?controls=0&disablekb=1&fs=0&modestbranding=1&playsinline=1&rel=0` : null;
      }
      const id = url.searchParams.get("v");
      return id ? `https://www.youtube-nocookie.com/embed/${id}?controls=0&disablekb=1&fs=0&modestbranding=1&playsinline=1&rel=0` : null;
    }

    if (url.hostname === "vimeo.com") {
      const id = url.pathname.split("/").filter(Boolean)[0];
      return id && /^\d+$/.test(id) ? `https://player.vimeo.com/video/${id}` : null;
    }

    if (url.hostname === "player.vimeo.com" && url.pathname.startsWith("/video/")) {
      return url.toString();
    }

    return url.toString();
  } catch {
    return null;
  }
}

export default function FoundationPage() {
  const [location, setLocation] = useLocation();
  const params = new URLSearchParams(location.split("?")[1] || "");
  const program: FoundationProgram = params.get("program") === "tahsili" ? "tahsili" : "qudrat";
  const requestedSection = getFoundationSection(program, params.get("subject"));
  const [activeSectionKey, setActiveSectionKey] = useState(requestedSection.key);
  const [selectedLesson, setSelectedLesson] = useState<FoundationContent | null>(null);
  const [quizLesson, setQuizLesson] = useState<FoundationContent | null>(null);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizSubmitting, setQuizSubmitting] = useState(false);
  const [quizError, setQuizError] = useState('');
  const activeSection = foundationSections[program].find((item) => item.key === activeSectionKey) || requestedSection;
  const { data: foundationContent, isLoading } = useFoundationContent(program);
  const content = program === "qudrat" && activeSection.key === "verbal" ? verbalBankVideos : foundationContent;
  const selectedEmbedUrl = useMemo(
    () => (selectedLesson ? getEmbedUrl(selectedLesson.videoUrl) : null),
    [selectedLesson],
  );

  const selectSection = (section: FoundationSection) => {
    setActiveSectionKey(section.key);
    setSelectedLesson(null);
    setLocation(`/foundation?program=${program}&subject=${section.key}`);
  };

  const startSectionQuiz = () => {
    void openQuiz({
      _id: `section-quiz-${program}-${activeSection.key}`,
      program,
      title: `اختبار ${activeSection.title}`,
      description: `اختبار قصير من 10 أسئلة في ${activeSection.shortTitle}.`,
      videoUrl: "",
      order: 1,
    });
  };

  const openQuiz = async (lesson: FoundationContent) => {
    setQuizLesson(lesson);
    setQuizAnswers({});
    setQuizResult(null);
    setQuizError('');
    setQuizQuestions([]);
    setQuizLoading(true);
    try {
      let questions: QuizQuestion[] = [];
      if (activeSection.tahsiliSubject) {
        const response = await fetch(`/api/tahsili/question-bank?subject=${encodeURIComponent(activeSection.tahsiliSubject)}&page=1&limit=50`, {
          credentials: "include",
        });
        const data = await response.json();
        questions = Array.isArray(data.questions) ? data.questions : [];
      } else if (activeSection.questionCategory) {
        const response = await fetch(`/api/questions?category=${activeSection.questionCategory}`, { credentials: "include" });
        const data = await response.json();
        const source = Array.isArray(data) ? data : [];
        const allowed = new Set(activeSection.questionSubcategories || []);
        questions = source.filter((question: QuizQuestion & { subcategory?: string }) => allowed.has(String(question.subcategory)));
        if (questions.length < 10) questions = source;
      }

      if (questions.length < 10) {
        throw new Error("لا توجد عشرة أسئلة معتمدة كافية لهذا القسم حاليًا.");
      }

      const start = ((Math.max(1, Number(lesson.order) || 1) - 1) * 10) % questions.length;
      const rotated = [...questions.slice(start), ...questions.slice(0, start)];
      setQuizQuestions(rotated.slice(0, 10));
    } catch (error) {
      setQuizError(error instanceof Error ? error.message : "تعذر تجهيز اختبار الدرس");
    } finally {
      setQuizLoading(false);
    }
  };
  const closeQuiz = () => {
    setQuizLesson(null);
    setQuizQuestions([]);
    setQuizAnswers({});
    setQuizResult(null);
    setQuizError('');
  };
  const submitQuiz = async () => {
    if (!quizLesson || quizQuestions.length === 0) return;
    setQuizSubmitting(true);
    setQuizError('');
    try {
      const answered = quizQuestions.filter((question) => {
        const key = String(question._id || question.id || question.questionId);
        return Number.isInteger(quizAnswers[key]);
      });
      const correctAnswers = answered.filter((question) => {
        const key = String(question._id || question.id || question.questionId);
        return quizAnswers[key] === question.correctOptionIndex;
      }).length;
      const score = Math.round((correctAnswers / quizQuestions.length) * 100);
      setQuizResult({
        score,
        correctAnswers,
        totalQuestions: quizQuestions.length,
        skippedQuestions: quizQuestions.length - answered.length,
        passed: score >= 60,
        passingScore: 60,
      });
    } catch (error) {
      setQuizError(error instanceof Error ? error.message : 'تعذر تصحيح الاختبار');
    } finally {
      setQuizSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl p-5 md:p-8 animate-fade-in">
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-3xl font-black text-[#0D1B2A] dark:text-white mb-2">{activeSection.title}</h1>
        <p className="text-sm text-muted-foreground">{activeSection.description}</p>
      </header>

      <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {foundationSections[program].map((section) => (
          <button
            key={section.key}
            type="button"
            onClick={() => selectSection(section)}
            className={`rounded-2xl border p-4 text-right transition hover:-translate-y-0.5 hover:shadow-md ${
              activeSection.key === section.key
                ? "border-primary bg-primary/10 shadow-sm"
                : "border-border bg-card"
            }`}
          >
            <span className="block text-sm font-black text-foreground">{section.shortTitle}</span>
            <span className="mt-1 block text-xs leading-5 text-muted-foreground">{section.description}</span>
          </button>
        ))}
      </div>

      <section className="mb-8 rounded-2xl border border-primary/20 bg-primary/5 p-5">
        <div className="flex items-start gap-3">
          <BookOpen className="mt-1 h-5 w-5 shrink-0 text-primary" />
          <div>
            <h2 className="text-lg font-black text-foreground">شرح القسم</h2>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">{activeSection.explanation}</p>
            <Button type="button" onClick={startSectionQuiz} className="mt-4 rounded-xl font-bold">
              <CheckCircle2 className="ml-2 h-4 w-4" />
              اختبار القسم — 10 أسئلة
            </Button>
          </div>
        </div>
      </section>

      {selectedLesson && (
        <section className="mb-8 rounded-2xl border border-slate-800 bg-[#07111f] p-3 text-white shadow-xl sm:p-5">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-black">{selectedLesson.title}</h2>
              <p className="mt-1 text-sm leading-6 text-slate-300">{selectedLesson.description}</p>
            </div>
            <Button type="button" variant="outline" onClick={() => setSelectedLesson(null)} className="border-white/20 text-white hover:bg-white/10">
              إغلاق الفيديو
            </Button>
          </div>
          <div className="overflow-hidden rounded-xl border border-slate-700 bg-black shadow-2xl">
            {selectedEmbedUrl ? (
              <div className="aspect-video w-full">
                <iframe
                  key={selectedEmbedUrl}
                  src={selectedEmbedUrl}
                  title={selectedLesson.title}
                  className="h-full w-full"
                  allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                  sandbox="allow-scripts allow-same-origin allow-presentation"
                  referrerPolicy="strict-origin-when-cross-origin"
                  onContextMenu={(event) => event.preventDefault()}
                />
              </div>
            ) : (
              <div className="flex aspect-video items-center justify-center p-8 text-center text-sm text-slate-300">
                تعذر تشغيل رابط الفيديو داخل المنصة.
              </div>
            )}
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            الفيديو داخل صفحة {activeSection.shortTitle}، ولا يفتح مسارًا عامًا خارج المنصة.
          </div>
        </section>
      )}

      {/* Content List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : content && content.length > 0 ? (
        <div className="grid md:grid-cols-2 gap-5">
          {content.map((item, idx) => (
            <div key={item._id} className="group rounded-2xl border border-border bg-white dark:bg-card overflow-hidden shadow-sm hover:shadow-md transition-all">
              {/* Thumbnail Area (Placeholder if none) */}
              <div className="h-40 bg-slate-100 dark:bg-slate-800 relative flex items-center justify-center">
                  {item.thumbnailUrl ? (
                  <img src={item.thumbnailUrl} alt={item.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center">
                    <PlayCircle className="h-12 w-12 text-white opacity-50" />
                  </div>
                )}
                <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur text-white px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {item.durationMinutes ? `${item.durationMinutes} دقيقة` : 'درس مرئي'}
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedLesson(item)}
                  className="absolute inset-0 flex items-center justify-center bg-slate-950/0 transition-colors hover:bg-slate-950/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
                  aria-label={`تشغيل ${item.title}`}
                >
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 text-[#0D1B2A] shadow-xl transition-transform group-hover:scale-105">
                    <PlayCircle className="h-8 w-8" />
                  </span>
                </button>
              </div>

              {/* Details */}
              <div className="p-5">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-black text-foreground">{item.title}</h3>
                   <span className="text-xs font-bold text-muted-foreground bg-muted px-2 py-1 rounded-md">
                     {program === "qudrat" && activeSection.key === "verbal" ? `الفيديو ${idx + 1}` : `الدرس ${idx + 1}`}
                   </span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-5 line-clamp-2">
                  {item.description}
                </p>
                
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    onClick={() => setSelectedLesson(item)}
                    className="flex-1 rounded-xl bg-[#0D1B2A] font-bold text-white hover:bg-[#0D1B2A]/90 dark:bg-primary dark:text-primary-foreground"
                  >
                    <PlayCircle className="ml-2 h-4 w-4" /> شاهد الدرس
                  </Button>
                   <Button type="button" variant="outline" onClick={() => openQuiz(item)} className="flex-1 rounded-xl border-emerald-500/40 font-bold text-foreground hover:bg-emerald-50 dark:hover:bg-emerald-950/30">
                     <CheckCircle2 className="ml-2 h-4 w-4 text-emerald-600" /> اختبار 10 أسئلة
                   </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white dark:bg-card border border-border rounded-2xl">
          <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <h3 className="text-lg font-black text-foreground">لا يوجد محتوى حالياً</h3>
          <p className="text-sm text-muted-foreground mt-1">سيتم إضافة محتوى التأسيس قريباً.</p>
        </div>
      )}

      <Dialog open={!!quizLesson} onOpenChange={open => !open && closeQuiz()}>
        <DialogContent className="max-h-[94vh] w-[calc(100%-1rem)] max-w-3xl overflow-y-auto bg-background p-4 sm:p-6">
          <DialogHeader className="text-right">
            <DialogTitle className="text-2xl font-black">{quizLesson?.quiz?.title || 'اختبار الدرس'}</DialogTitle>
            {quizLesson?.quiz?.instructions && <p className="text-sm leading-6 text-muted-foreground">{quizLesson.quiz.instructions}</p>}
          </DialogHeader>
          {quizLoading ? (
            <div className="flex items-center justify-center gap-3 py-12 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" /> جارٍ تجهيز 10 أسئلة مناسبة للقسم...
            </div>
          ) : !quizResult ? (
            <div className="space-y-5">
              {quizQuestions.map((question, index) => (
                <div key={String(question._id || question.id || question.questionId)} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                  <div className="mb-3 flex items-start gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-black text-primary">{index + 1}</span>
                    <p className="whitespace-pre-wrap text-sm font-bold leading-7 text-foreground">{question.text}</p>
                  </div>
                  {(question.imageUrl || question.imageUrls?.[0]) && <img src={question.imageUrl || question.imageUrls?.[0]} alt="" className="mb-4 max-h-56 w-full rounded-xl object-contain" />}
                  <div className="grid gap-2 sm:grid-cols-2">
                    {question.options.map((option, optionIndex) => {
                      const questionKey = String(question._id || question.id || question.questionId);
                      const selected = quizAnswers[questionKey] === optionIndex;
                      return <button type="button" key={`${questionKey}-${optionIndex}`} onClick={() => setQuizAnswers(current => ({ ...current, [questionKey]: optionIndex }))} className={`rounded-xl border p-3 text-right text-sm transition-colors ${selected ? 'border-primary bg-primary/10 font-bold text-primary' : 'border-border bg-background hover:bg-muted'}`}><span className="ml-2 font-black">{String.fromCharCode(1575 + optionIndex)}.</span>{option}</button>;
                    })}
                  </div>
                </div>
              ))}
              {quizError && <p className="rounded-xl bg-red-500/10 p-3 text-sm text-red-600">{quizError}</p>}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-sm text-muted-foreground">{Object.keys(quizAnswers).length} من {quizQuestions.length} تمت الإجابة عنها</span>
                <Button type="button" onClick={submitQuiz} disabled={quizSubmitting || quizQuestions.length === 0} className="rounded-xl bg-primary px-6 font-bold">{quizSubmitting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}تصحيح الاختبار</Button>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center">
              <div className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full text-2xl font-black ${quizResult.passed ? 'bg-emerald-500/15 text-emerald-600' : 'bg-amber-500/15 text-amber-600'}`}>{quizResult.score}%</div>
              <h3 className="mt-5 text-2xl font-black text-foreground">{quizResult.passed ? 'أحسنت! اجتزت الاختبار' : 'بداية جيدة، راجع الشرح وحاول مرة أخرى'}</h3>
              <p className="mt-2 text-sm text-muted-foreground">أجبت بشكل صحيح عن {quizResult.correctAnswers} من {quizResult.totalQuestions} أسئلة · درجة النجاح {quizResult.passingScore}%</p>
              <Button type="button" onClick={closeQuiz} className="mt-6 rounded-xl">إغلاق</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
