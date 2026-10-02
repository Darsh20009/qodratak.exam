import { useRef, useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Clock3, Loader2, PlayCircle, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QiyasExamLayout } from "@/components/QiyasExamLayout";
import { useFoundationContent } from "@/hooks/use-student";
import {
  foundationVideoUrlAt,
  isDirectFoundationVideo,
  resolveFoundationVideoUrl,
} from "@/lib/foundationVideoUrl";
import { getQuestionImageUrls } from "@/lib/questionImages";

type QuizResult = {
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  skippedQuestions: number;
  passed: boolean;
  passingScore: number;
  questionDetails?: Array<{
    questionId: string;
    selectedOptionIndex: number | null;
    isCorrect: boolean;
    correctOptionIndex: number | null;
    videoTimestampSeconds?: number | null;
  }>;
};

function formatVideoTime(seconds: number) {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

export default function FoundationBankTestPage({ contentId }: { contentId: string }) {
  const [, setLocation] = useLocation();
  const contentQuery = useFoundationContent(
    "qudrat",
    true,
    "subject.qudrat.quantitative",
  );
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [activeVideoQuestionId, setActiveVideoQuestionId] = useState<string | null>(null);
  const [videoPlaybackError, setVideoPlaybackError] = useState(false);
  const startedAt = useRef(Date.now());
  const submissionId = useRef(crypto.randomUUID());

  const lesson = contentQuery.data?.find((item) => item._id === contentId);
  const quiz = lesson?.quiz;
  const questions = quiz?.questionIds ?? [];
  const currentQuestion = questions[currentQuestionIndex];

  const submit = async () => {
    if (!lesson || !quiz || isSubmitting) return;
    setIsSubmitting(true);
    setError("");
    try {
      const response = await fetch(`/api/foundation-content/${lesson._id}/quiz/submit`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: Object.entries(answers).map(
            ([questionId, selectedOptionIndex]) => ({
              questionId,
              selectedOptionIndex,
            }),
          ),
          timeTakenSeconds: Math.max(
            0,
            Math.floor((Date.now() - startedAt.current) / 1000),
          ),
          idempotencyKey: submissionId.current,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "تعذر تصحيح الاختبار");
      setResult(payload as QuizResult);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "تعذر تصحيح الاختبار",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const retry = () => {
    setAnswers({});
    setCurrentQuestionIndex(0);
    setResult(null);
    setError("");
    startedAt.current = Date.now();
    submissionId.current = crypto.randomUUID();
  };

  if (contentQuery.isLoading) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-5xl items-center justify-center px-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-label="جارٍ تحميل الاختبار" />
      </main>
    );
  }

  if (contentQuery.isError) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10" dir="rtl">
        <section className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-center">
          <p className="font-bold text-foreground">تعذر تحميل الاختبار.</p>
          <Button type="button" className="mt-4 rounded-xl" onClick={() => contentQuery.refetch()}>
            حاول مرة أخرى
          </Button>
        </section>
      </main>
    );
  }

  if (!lesson || !quiz || questions.length === 0) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10" dir="rtl">
        <section className="rounded-2xl border border-border bg-card p-6 text-center">
          <p className="font-bold text-foreground">هذا الدرس لا يحتوي اختبارًا.</p>
          <Button type="button" variant="outline" className="mt-4 rounded-xl" onClick={() => setLocation("/foundation")}>
            العودة إلى التأسيس
          </Button>
        </section>
      </main>
    );
  }

  if (result) {
    const detailsByQuestionId = new Map(
      (result.questionDetails || []).map((detail) => [detail.questionId, detail]),
    );

    return (
      <main className="mx-auto max-w-5xl space-y-5 px-4 py-6 sm:py-10" dir="rtl">
        <section className="rounded-3xl border border-primary/20 bg-card p-5 shadow-sm sm:p-7">
          <div className="text-center">
            <Trophy className="mx-auto h-10 w-10 text-primary" />
            <p className="mt-3 text-sm font-bold text-muted-foreground">{lesson.title}</p>
            <p className="mt-2 text-4xl font-black text-foreground">{result.score}%</p>
            <p className="mt-2 text-sm text-muted-foreground">
              أجبت عن {result.correctAnswers} من {result.totalQuestions} بشكل صحيح
              {result.skippedQuestions
                ? `، وتركت ${result.skippedQuestions} دون إجابة.`
                : "."}
            </p>
            <p className={`mt-2 text-sm font-black ${result.passed ? "text-emerald-600" : "text-amber-600"}`}>
              {result.passed
                ? "أحسنت، اجتزت الاختبار."
                : `تحتاج إلى ${result.passingScore}% للنجاح.`}
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <Button type="button" variant="outline" className="rounded-xl" onClick={retry}>
                إعادة الاختبار
              </Button>
              <Button type="button" className="rounded-xl" onClick={() => setLocation("/foundation")}>
                العودة إلى الدروس
              </Button>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <div>
            <h2 className="text-xl font-black text-foreground">مراجعة الأسئلة وشرح الفيديو</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              افتح رابط الشرح للانتقال إلى موضع السؤال في الفيديو.
            </p>
          </div>
          {questions.map((question, index) => {
            const detail = detailsByQuestionId.get(question._id);
            const correctIndex = detail?.correctOptionIndex;
            const selectedIndex = detail?.selectedOptionIndex;
            const timestamp = question.source?.videoTimestampSeconds
              ?? detail?.videoTimestampSeconds
              ?? null;
            const videoUrl = timestamp !== null && lesson.videoUrl
              ? foundationVideoUrlAt(lesson.videoUrl, timestamp)
              : null;

            return (
              <article key={question._id} className="rounded-2xl border border-border bg-card p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h3 className="font-black text-foreground">السؤال {index + 1}</h3>
                  <span className={`text-xs font-bold ${
                    detail?.isCorrect
                      ? "text-emerald-600"
                      : selectedIndex === null || selectedIndex === undefined
                        ? "text-amber-600"
                        : "text-destructive"
                  }`}>
                    {detail?.isCorrect
                      ? "إجابة صحيحة"
                      : selectedIndex === null || selectedIndex === undefined
                        ? "دون إجابة"
                        : "إجابة غير صحيحة"}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  <span>
                    إجابتك: {selectedIndex === null || selectedIndex === undefined
                      ? "—"
                      : question.options[selectedIndex] ?? "—"}
                  </span>
                  <span>
                    الصحيحة: {correctIndex === null || correctIndex === undefined
                      ? "غير متاحة"
                      : question.options[correctIndex] ?? "—"}
                  </span>
                </div>
                {videoUrl && timestamp !== null && (
                  <div className="mt-3 space-y-3">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-lg border-primary/20 text-primary"
                        onClick={() => {
                          setVideoPlaybackError(false);
                          setActiveVideoQuestionId((activeId) =>
                            activeId === question._id ? null : question._id,
                          );
                        }}
                      >
                        <PlayCircle className="ml-2 h-4 w-4" />
                        {activeVideoQuestionId === question._id
                          ? "إخفاء مقطع الشرح"
                          : `شاهد الشرح عند ${formatVideoTime(timestamp)}`}
                        {question.source?.videoTimestampInferred ? " · وقت تقريبي" : ""}
                      </Button>
                      <a
                        href={videoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2 text-sm font-black text-primary transition hover:bg-primary/15"
                      >
                        <Clock3 className="h-4 w-4" />
                        فتح عند {formatVideoTime(timestamp)}
                      </a>
                    </div>
                    {activeVideoQuestionId === question._id && (
                      <div className="overflow-hidden rounded-xl border border-border bg-black">
                        {isDirectFoundationVideo(lesson.videoUrl) ? (
                          <video
                            key={`${question._id}-${timestamp}`}
                            src={resolveFoundationVideoUrl(lesson.videoUrl)}
                            title={`شرح السؤال ${index + 1}`}
                            className="aspect-video w-full bg-black"
                            controls
                            playsInline
                            preload="metadata"
                            controlsList="nodownload"
                            onLoadedMetadata={(event) => {
                              const player = event.currentTarget;
                              if (!Number.isFinite(player.duration) || player.duration <= 0) return;
                              player.currentTime = Math.min(
                                timestamp,
                                Math.max(0, player.duration - 0.25),
                              );
                            }}
                            onError={() => setVideoPlaybackError(true)}
                          />
                        ) : (
                          <p className="p-4 text-sm font-bold text-amber-200">
                            افتح رابط الشرح في تبويب جديد لمشاهدة هذا الفيديو.
                          </p>
                        )}
                        {videoPlaybackError && (
                          <p className="p-3 text-sm font-bold text-destructive-foreground">
                            تعذر تحميل الفيديو. تحقق من اتصالك ثم أعد فتح المقطع.
                          </p>
                        )}
                        <p className="px-3 py-2 text-xs font-bold text-white/70">
                          يبدأ المقطع عند {formatVideoTime(timestamp)}
                          {question.source?.videoTimestampInferred ? " · التوقيت تقريبي" : ""}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </section>
      </main>
    );
  }

  if (!currentQuestion) return null;

  const questionStatuses = questions.map((question) => ({
    answered: answers[question._id] !== undefined,
    bookmarked: false,
  }));

  return (
    <main className="mx-auto max-w-6xl space-y-4 px-3 py-4 sm:px-5 sm:py-8" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black text-primary">اختبار مستقل · {lesson.title}</p>
          <h1 className="mt-1 text-xl font-black text-foreground sm:text-2xl">{quiz.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {quiz.instructions || "أجب عن الأسئلة ثم راجع روابط الشرح المؤقتة بعد التسليم."}
          </p>
        </div>
        <Button type="button" variant="outline" className="rounded-xl" onClick={() => setLocation("/foundation")}>
          <ArrowLeft className="ml-2 h-4 w-4" />
          العودة إلى الدروس
        </Button>
      </div>

      {error && (
        <p className="rounded-xl bg-destructive/10 px-4 py-3 text-sm font-bold text-destructive">
          {error}
        </p>
      )}
      {isSubmitting && (
        <div className="flex items-center justify-center gap-2 text-sm font-bold text-primary" role="status">
          <Loader2 className="h-4 w-4 animate-spin" />
          جارٍ تصحيح الاختبار
        </div>
      )}

      <QiyasExamLayout
        examTitle={quiz.title}
        questionNumber={currentQuestionIndex + 1}
        totalQuestions={questions.length}
        sectionLabel="اختبار البنك"
        timeLeft={(quiz.timeLimitMinutes || 45) * 60}
        questionText={currentQuestion.text}
        questionImageUrl={currentQuestion.imageUrl}
        questionImageUrls={currentQuestion.imageUrls}
        hideQuestionTextWhenImageBacked={getQuestionImageUrls(currentQuestion).length > 0}
        options={currentQuestion.options}
        selectedAnswer={answers[currentQuestion._id] ?? null}
        onSelectAnswer={(optionIndex) => {
          setAnswers((current) => ({ ...current, [currentQuestion._id]: optionIndex }));
        }}
        questionsStatus={questionStatuses}
        currentQuestionIndex={currentQuestionIndex}
        onJumpToQuestion={setCurrentQuestionIndex}
        onPrev={() => setCurrentQuestionIndex((index) => Math.max(0, index - 1))}
        onNext={() => setCurrentQuestionIndex((index) => Math.min(questions.length - 1, index + 1))}
        onFinish={submit}
        isFinishing={isSubmitting}
        canGoPrev={currentQuestionIndex > 0}
        canGoNext={currentQuestionIndex < questions.length - 1}
        isLastQuestion={currentQuestionIndex === questions.length - 1}
        answeredCount={Object.keys(answers).length}
        sectionQuestionsCount={questions.length}
        questionId={currentQuestion._id}
      />
    </main>
  );
}