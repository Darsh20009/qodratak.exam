import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { getQuestionImageUrls } from '@/lib/questionImages';
import { resolveFoundationAssetUrl } from '@/lib/foundationVideoUrl';
import { shouldHideImageBackedQuantitativeQuestionText } from '@/lib/questionTextVisibility';
import { AlertCircle, CheckCircle2, Clock3, Flag, LoaderCircle, Save, Send, ShieldCheck } from 'lucide-react';

interface Question {
  id: number;
  category: string;
  text: string;
  options: string[];
  imageUrl?: string;
  imageUrls?: string[];
  isTrial?: boolean;
}

interface PaperExam {
  id: string;
  title: string;
  program: 'qudrat' | 'tahsili';
  totalQuestions: number;
  timeLimit: number;
  expiresAt: string;
}

interface ExamResult {
  totalQuestions: number;
  scoredQuestions: number;
  totalScore: number;
  totalPercentage: number;
  correctAnswers: number;
  wrongAnswers: number;
  skippedQuestions: number;
  verbalScore?: number;
  verbalTotal?: number;
  verbalPercentage?: number;
  quantitativeScore?: number;
  quantitativeTotal?: number;
  quantitativePercentage?: number;
  timeTaken: number;
  timedOut: boolean;
  questionDetails: Array<{
    questionNumber: number;
    category: string;
    status: 'correct' | 'wrong' | 'skipped' | 'trial';
    userAnswer: number | null;
    correctAnswer: number;
    isTrial: boolean;
  }>;
  incorrectQuestions: Array<{
    questionIndex: number;
    userAnswer: number | null;
    correctAnswer: number;
    question: Question & { correctOptionIndex: number; explanation?: string };
  }>;
}

interface AnswerInputStepProps {
  exam: PaperExam;
  questions: Question[];
  initialAnswers: Record<number, number>;
  initialReviewQuestionNumbers: number[];
  onSubmit: (result: ExamResult) => void;
}

const toArabicDigits = (value: number | string) =>
  String(value).replace(/\d/g, (digit) => '٠١٢٣٤٥٦٧٨٩'[Number(digit)]);

export default function AnswerInputStep({
  exam,
  questions,
  initialAnswers,
  initialReviewQuestionNumbers,
  onSubmit,
}: AnswerInputStepProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [answers, setAnswers] = useState<Record<number, number>>(initialAnswers);
  const [reviewQuestionNumbers, setReviewQuestionNumbers] = useState<number[]>(initialReviewQuestionNumbers);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [supportedDevice, setSupportedDevice] = useState(() =>
    typeof window === 'undefined' || window.matchMedia('(min-width: 1024px) and (orientation: landscape)').matches,
  );
  const [timeRemaining, setTimeRemaining] = useState(() =>
    Math.max(0, Math.ceil((new Date(exam.expiresAt).getTime() - Date.now()) / 1000)),
  );
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const answerStateRef = useRef(answers);
  const reviewStateRef = useRef(reviewQuestionNumbers);
  const saveQueueRef = useRef<Promise<void>>(Promise.resolve());
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const submitStartedRef = useRef(false);
  const timeoutHandledRef = useRef(false);
  const answeredCount = Object.keys(answers).length;
  const flaggedCount = reviewQuestionNumbers.length;

  useEffect(() => {
    answerStateRef.current = answers;
    reviewStateRef.current = reviewQuestionNumbers;
  }, [answers, reviewQuestionNumbers]);

  const enqueueSave = (nextAnswers: Record<number, number>, nextReview: number[]) => {
    const save = async () => {
      const response = await apiRequest('PUT', `/api/paper-exams/${encodeURIComponent(exam.id)}/answers`, {
        answers: Object.fromEntries(Object.entries(nextAnswers).map(([number, answer]) => [number, answer])),
        reviewQuestionNumbers: nextReview,
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.error || 'تعذر حفظ الإجابات');
      }
    };
    const queued = saveQueueRef.current.catch(() => undefined).then(save);
    saveQueueRef.current = queued;
    return queued;
  };

  useEffect(() => {
    if (!questions.length || timeRemaining === 0 || submitting) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSaving(true);
      void enqueueSave(answerStateRef.current, reviewStateRef.current)
        .catch((error) => {
          toast({
            title: 'تعذر حفظ الإجابات',
            description: error instanceof Error ? error.message : 'تحقق من الاتصال ثم أعد المحاولة.',
            variant: 'destructive',
          });
        })
        .finally(() => setSaving(false));
    }, 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [answers, reviewQuestionNumbers, questions.length, timeRemaining, submitting, toast]);

  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((new Date(exam.expiresAt).getTime() - Date.now()) / 1000));
      setTimeRemaining(remaining);
    }, 1000);
    return () => clearInterval(timer);
  }, [exam.expiresAt]);

  const submitAttempt = async (timedOut: boolean) => {
    if (submitStartedRef.current) return;
    submitStartedRef.current = true;
    setSubmitting(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    try {
      if (!timedOut) {
        await enqueueSave(answerStateRef.current, reviewStateRef.current);
      } else {
        await saveQueueRef.current.catch(() => undefined);
      }
      const response = await apiRequest('POST', `/api/paper-exams/${encodeURIComponent(exam.id)}/submit`, {});
      const body = await response.json();
      if (!response.ok) throw new Error(body?.error || 'تعذر تسليم الاختبار');
      void queryClient.invalidateQueries({ queryKey: ['/api/test-results/user'] });
      onSubmit(body.result as ExamResult);
      toast({
        title: 'تم تصحيح الاختبار',
        description: `نتيجتك ${body.result?.totalPercentage ?? 0}%`,
      });
    } catch (error) {
      submitStartedRef.current = false;
      setSubmitting(false);
      toast({
        title: 'تعذر تسليم الاختبار',
        description: error instanceof Error ? error.message : 'حاول مرة أخرى.',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    if (timeRemaining !== 0 || timeoutHandledRef.current || !questions.length) return;
    timeoutHandledRef.current = true;
    toast({
      title: 'انتهى الوقت',
      description: 'سيتم تصحيح الإجابات المحفوظة على الخادم.',
      variant: 'destructive',
    });
    void submitAttempt(true);
  }, [timeRemaining, questions.length, toast]);

  const changeAnswer = (questionNumber: number, rawValue: string) => {
    if (timeRemaining <= 0 || submitting) return;
    setAnswers((current) => ({ ...current, [questionNumber]: Number(rawValue) }));
  };

  const toggleReview = (questionNumber: number) => {
    if (submitting) return;
    setReviewQuestionNumbers((current) => current.includes(questionNumber)
      ? current.filter((number) => number !== questionNumber)
      : [...current, questionNumber].sort((a, b) => a - b));
  };

  const handleManualSubmit = () => {
    if (!submitting) setShowSubmitConfirm(true);
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const media = window.matchMedia('(min-width: 1024px) and (orientation: landscape)');
    const updateSupport = () => setSupportedDevice(media.matches);
    updateSupport();
    media.addEventListener('change', updateSupport);
    return () => media.removeEventListener('change', updateSupport);
  }, []);

  if (!supportedDevice) {
    return (
      <div dir="rtl" className="fixed inset-0 z-[100] flex min-h-screen items-center justify-center bg-[#f4f1ea] px-6 text-center text-[#3f3832]">
        <div className="max-w-md rounded-3xl border border-[#eadfd4] bg-[#fffdf8] p-8 shadow-sm">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#fff0e8] text-[#dc7955]">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <p className="mb-2 text-xs font-bold tracking-wide text-[#c66f51]">محاكاة الاختبار الورقي</p>
          <h2 className="mb-3 text-2xl font-extrabold">هذه التجربة تحتاج شاشة أوسع</h2>
          <p className="text-sm leading-7 text-[#786d63]">استخدم حاسوبًا أو جهاز آيباد بالوضع الأفقي لعرض كتيّب الأسئلة وورقة التظليل معًا.</p>
        </div>
      </div>
    );
  }

  if (!questions.length) {
    return <div className="rounded-2xl border bg-background p-12 text-center text-muted-foreground">لا توجد أسئلة في هذه المحاولة.</div>;
  }

  const progress = (answeredCount / questions.length) * 100;
  const sections = Array.from({ length: 5 }, (_, sectionIndex) => {
    const startIndex = Math.floor(sectionIndex * questions.length / 5);
    const endIndex = Math.floor((sectionIndex + 1) * questions.length / 5);
    const sectionQuestions = questions.slice(startIndex, endIndex);
    return {
      index: sectionIndex,
      startNumber: startIndex + 1,
      endNumber: endIndex,
      questions: sectionQuestions,
      verbalCount: sectionQuestions.filter(question => question.category === 'verbal').length,
      quantitativeCount: sectionQuestions.filter(question => question.category === 'quantitative').length,
      answeredCount: sectionQuestions.filter((_, index) => answers[startIndex + index + 1] !== undefined).length,
    };
  });

  const navigateToQuestion = (questionNumber: number) => {
    setCurrentIndex(questionNumber - 1);
    document.getElementById(`paper-question-${questionNumber}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const chooseBubbleAnswer = (questionNumber: number, choiceIndex: number) => {
    changeAnswer(questionNumber, String(choiceIndex));
    setCurrentIndex(questionNumber - 1);
  };

  return (
    <div dir="rtl" className="fixed inset-0 z-[100] flex min-h-0 flex-col bg-[#f1eee8] text-[#39332e]">
      <header className="flex h-[72px] shrink-0 items-center justify-between gap-4 border-b border-[#e3dbd1] bg-[#fffdf8] px-5 shadow-sm sm:px-7">
        <div className="min-w-0">
          <p className="truncate text-sm font-extrabold">{exam.title}</p>
          <p className="mt-1 text-[11px] text-[#8d8176]">محاكاة ورقية · {toArabicDigits(questions.length)} سؤالًا · خمسة أقسام</p>
        </div>
        <div className="flex shrink-0 items-center gap-3 sm:gap-6">
          <div className="hidden items-center gap-1.5 text-xs text-[#7a7168] sm:flex" aria-live="polite">
            {saving ? <LoaderCircle className="h-4 w-4 animate-spin text-[#d98260]" /> : <Save className="h-4 w-4 text-[#789273]" />}
            {saving ? 'جارٍ الحفظ' : 'محفوظة تلقائيًا'}
          </div>
          <div className={`flex items-center gap-2 rounded-xl border px-3 py-2 ${timeRemaining <= 300 ? 'border-red-200 bg-red-50 text-red-800' : 'border-[#e8dfd4] bg-white text-[#4c453d]'}`}>
            <Clock3 className="h-4 w-4 text-[#dc7955]" />
            <span aria-live="polite" className="font-mono text-sm font-bold" dir="ltr">{formatTime(timeRemaining)}</span>
          </div>
          <button type="button" disabled={submitting || saving} onClick={handleManualSubmit} className="flex items-center gap-2 rounded-xl bg-[#e47a55] px-3.5 py-2.5 text-xs font-bold text-white transition hover:bg-[#d96947] disabled:opacity-60 sm:px-4" data-testid="button-submit-answers">
            <Send className="h-4 w-4" /> <span className="hidden sm:inline">تسليم الاختبار</span><span className="sm:hidden">تسليم</span>
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <main className="min-w-0 flex-1 overflow-y-auto px-4 py-5 sm:px-7 sm:py-7">
          <div className="mx-auto max-w-[920px]">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="mb-1 text-[11px] font-bold tracking-wide text-[#c66f51]">كتيّب الأسئلة</p>
                <h1 className="text-xl font-extrabold sm:text-2xl">اختبار القدرات العامة</h1>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-[#dfe7db] bg-[#f4f7f1] px-3 py-1.5 text-[11px] text-[#64765d]">
                <ShieldCheck className="h-4 w-4" /> إجاباتك محفوظة تلقائيًا
              </div>
            </div>

            <div className="mb-5 grid grid-cols-5 gap-2">
              {sections.map(section => (
                <button
                  key={section.index}
                  type="button"
                  onClick={() => section.questions.length && navigateToQuestion(section.startNumber)}
                  className="min-h-[66px] rounded-xl border border-[#e3dacf] bg-[#faf7f1] px-2 py-2 text-right transition hover:border-[#d99a7f] hover:bg-[#fff8f3]"
                >
                  <span className="block text-[10px] font-bold text-[#c16f51]">القسم {toArabicDigits(section.index + 1)}</span>
                  <span className="mt-1 block text-[10px] text-[#73695f]">أسئلة {toArabicDigits(section.startNumber)}–{toArabicDigits(section.endNumber)}</span>
                  <span className="mt-1 block text-[9px] text-[#94897d]">{toArabicDigits(section.answeredCount)} / {toArabicDigits(section.questions.length)} تمت الإجابة</span>
                </button>
              ))}
            </div>

            <div className="mb-5 rounded-xl border border-[#e6ddd1] bg-[#fffdf8] px-4 py-3">
              <div className="mb-2 flex items-center justify-between text-xs">
                <span className="font-bold">التقدم في الاختبار</span>
                <span className="text-[#8a7f73]">{toArabicDigits(answeredCount)} من {toArabicDigits(questions.length)}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[#eee7de]">
                <div className="h-full rounded-full bg-[#e47a55] transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>

            {sections.map(section => (
              <section key={section.index} id={`paper-section-${section.index}`} className="mb-7 scroll-mt-4">
                <div className="mb-3 flex items-center justify-between rounded-xl border border-[#e6ddd1] bg-[#f8f4ed] px-4 py-3">
                  <div>
                    <p className="text-xs font-extrabold">القسم {toArabicDigits(section.index + 1)}</p>
                    <p className="mt-1 text-[10px] text-[#897e73]">
                      {toArabicDigits(section.questions.length)} سؤال · {section.verbalCount ? `لفظي ${toArabicDigits(section.verbalCount)}` : ''}
                      {section.verbalCount && section.quantitativeCount ? ' · ' : ''}
                      {section.quantitativeCount ? `كمي ${toArabicDigits(section.quantitativeCount)}` : ''}
                    </p>
                  </div>
                  <span className="text-[10px] text-[#a09284]">{toArabicDigits(section.startNumber)}–{toArabicDigits(section.endNumber)}</span>
                </div>

                <div className="space-y-3">
                  {section.questions.map((question, localIndex) => {
                    const questionNumber = section.startNumber + localIndex;
                    const selectedAnswer = answers[questionNumber];
                    const markedForReview = reviewQuestionNumbers.includes(questionNumber);
                    const imageUrls = getQuestionImageUrls(question);
                    const hideQuestionText = shouldHideImageBackedQuantitativeQuestionText(question);
                    return (
                      <article
                        id={`paper-question-${questionNumber}`}
                        key={`${question.id}-${questionNumber}`}
                        className={`scroll-mt-5 rounded-xl border bg-[#fffdf9] p-4 shadow-[0_2px_8px_rgba(70,53,34,.025)] sm:p-5 ${currentIndex === questionNumber - 1 ? 'border-[#e2a087]' : 'border-[#e5ddd2]'}`}
                      >
                        <div className="mb-3 flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <span className={`flex h-8 min-w-8 items-center justify-center rounded-lg px-1 text-xs font-bold ${selectedAnswer !== undefined ? 'bg-[#eaf0e8] text-[#64805d]' : 'bg-[#f1ebe2] text-[#80766b]'}`}>{toArabicDigits(questionNumber)}</span>
                            <div>
                              <p className="mb-1 text-[10px] font-bold text-[#b3836e]">
                                {question.category === 'verbal' ? 'لفظي' : question.category === 'quantitative' ? 'كمي' : question.category}
                                {question.isTrial ? ' · تجريبي' : ''}
                              </p>
                              {!hideQuestionText && question.text?.trim() && (
                                <h2 className="whitespace-pre-wrap text-sm font-bold leading-7 text-[#453e37]">{question.text}</h2>
                              )}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => toggleReview(questionNumber)}
                            aria-label={markedForReview ? 'إزالة علامة المراجعة' : 'وضع علامة للمراجعة'}
                            aria-pressed={markedForReview}
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition ${markedForReview ? 'bg-[#fff0e7] text-[#d87550]' : 'text-[#b5aa9d] hover:bg-[#f7f1e8]'}`}
                          >
                            <Flag className="h-4 w-4" fill={markedForReview ? 'currentColor' : 'none'} />
                          </button>
                        </div>

                        {imageUrls.map((imageUrl, imageIndex) => (
                          <img
                            key={`${imageUrl}-${imageIndex}`}
                            src={resolveFoundationAssetUrl(imageUrl)}
                            alt={`شكل توضيحي للسؤال ${questionNumber}`}
                            className="mx-auto mb-4 max-h-80 max-w-full rounded-lg border border-[#e6ddd1] object-contain"
                            loading="lazy"
                          />
                        ))}

                        <div className="grid gap-2 sm:grid-cols-2">
                          {question.options.map((option, optionIndex) => (
                            <button
                              key={optionIndex}
                              type="button"
                              onClick={() => changeAnswer(questionNumber, String(optionIndex))}
                              aria-pressed={selectedAnswer === optionIndex}
                              disabled={timeRemaining <= 0 || submitting}
                              className={`flex min-h-12 items-center gap-3 rounded-lg border px-3 py-2 text-right text-sm transition touch-manipulation disabled:cursor-not-allowed disabled:opacity-60 ${selectedAnswer === optionIndex ? 'border-[#df8968] bg-[#fff5ef] text-[#754a39]' : 'border-[#eee8df] bg-[#fdfbf7] text-[#696158] hover:border-[#dbc7b5] hover:bg-[#fbf6ee]'}`}
                            >
                              <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${selectedAnswer === optionIndex ? 'border-[#dc805f] bg-[#e77b56] text-white' : 'border-[#d7cfc4] bg-white text-[#9a8f83]'}`}>{['أ', 'ب', 'ج', 'د', 'هـ'][optionIndex] ?? toArabicDigits(optionIndex + 1)}</span>
                              <span className="leading-6">{option}</span>
                            </button>
                          ))}
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </main>

        <aside className="flex w-[390px] shrink-0 flex-col border-r border-[#e2d9ce] bg-[#f8f5ef] px-4 py-5 xl:w-[420px] xl:px-5">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <p className="mb-1 text-[10px] font-bold tracking-wide text-[#c47a5c]">نموذج الإجابة</p>
              <h2 className="text-lg font-extrabold">ورقة التظليل</h2>
            </div>
            <span className="rounded-lg border border-[#e5dbce] bg-[#fffdf8] px-2.5 py-1 text-[10px] text-[#897e73]">١–{toArabicDigits(questions.length)}</span>
          </div>

          <div className="mb-3 rounded-xl border border-[#e5dacf] bg-[#fffdf8] p-3">
            <div className="mb-2 flex items-center justify-between text-[10px] text-[#8e8378]">
              <span>الإجابات المكتملة</span><span className="font-bold text-[#51483f]">{toArabicDigits(answeredCount)} من {toArabicDigits(questions.length)}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-[#eee8df]"><div className="h-full rounded-full bg-[#e78a67] transition-all" style={{ width: `${progress}%` }} /></div>
            <div className="mt-2 flex justify-between text-[9px] text-[#a0968a]"><span>للمراجعة: {toArabicDigits(flaggedCount)}</span><span>بلا إجابة: {toArabicDigits(questions.length - answeredCount)}</span></div>
          </div>

          <div className="mb-3 flex flex-wrap gap-x-3 gap-y-1 text-[9px] text-[#8d8378]">
            <span className="flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-full border border-[#d2c9be] bg-white" /> بلا إجابة</span>
            <span className="flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-full border border-[#7e9a78] bg-[#eaf0e8]" /> تمت الإجابة</span>
            <span className="flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-full border border-[#dc8965] bg-[#fff0e7]" /> للمراجعة</span>
          </div>

          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pl-1">
            {sections.map(section => (
              <section key={section.index} className="rounded-xl border border-[#e8e0d6] bg-[#f5f1ea] p-3">
                <button type="button" onClick={() => section.questions.length && navigateToQuestion(section.startNumber)} className="mb-2 flex w-full items-center justify-between text-right">
                  <span className="text-[10px] font-bold text-[#6c6258]">القسم {toArabicDigits(section.index + 1)}</span>
                  <span className="text-[9px] text-[#a0968a]">{toArabicDigits(section.startNumber)}–{toArabicDigits(section.endNumber)}</span>
                </button>
                <div className="space-y-1.5">
                  {section.questions.map((question, localIndex) => {
                    const questionNumber = section.startNumber + localIndex;
                    const selectedAnswer = answers[questionNumber];
                    const markedForReview = reviewQuestionNumbers.includes(questionNumber);
                    return (
                      <div key={`bubble-${question.id}-${questionNumber}`} className={`grid grid-cols-[32px_minmax(0,1fr)] items-center gap-2 rounded-lg px-1.5 py-1 ${currentIndex === questionNumber - 1 ? 'bg-[#fffaf5]' : ''}`}>
                        <button type="button" onClick={() => navigateToQuestion(questionNumber)} className="text-right text-[10px] font-bold text-[#80766b]" aria-label={`انتقل إلى السؤال ${toArabicDigits(questionNumber)}`}>
                          {toArabicDigits(questionNumber)}{markedForReview ? <span className="mr-1 text-[#d77d59]">•</span> : null}
                        </button>
                        <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${Math.max(question.options.length, 1)}, minmax(0, 1fr))` }}>
                          {question.options.map((_, choiceIndex) => (
                            <button
                              key={choiceIndex}
                              type="button"
                              onClick={() => chooseBubbleAnswer(questionNumber, choiceIndex)}
                              aria-label={`السؤال ${toArabicDigits(questionNumber)}، الإجابة ${['أ', 'ب', 'ج', 'د', 'هـ'][choiceIndex] ?? choiceIndex + 1}`}
                              aria-pressed={selectedAnswer === choiceIndex}
                              disabled={timeRemaining <= 0 || submitting}
                              className={`mx-auto flex h-7 w-7 items-center justify-center rounded-full border text-[9px] font-bold transition touch-manipulation disabled:opacity-50 ${selectedAnswer === choiceIndex ? 'border-[#dc805f] bg-[#e77b56] text-white' : 'border-[#d7cfc4] bg-white text-[#95897d] hover:border-[#df9a7e]'}`}
                            >
                              {['أ', 'ب', 'ج', 'د', 'هـ'][choiceIndex] ?? toArabicDigits(choiceIndex + 1)}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>

          <p className="mb-3 mt-3 rounded-xl border border-[#e5dacf] bg-[#f3eee6] px-3 py-2 text-[9px] leading-5 text-[#958a7d]">
            اختر الدائرة بالنقر أو بالقلم، أو اختر الإجابة من صفحة السؤال. الدوائر المحددة محفوظة تلقائيًا.
          </p>
          <button type="button" disabled={submitting || saving} onClick={handleManualSubmit} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#e47a55] py-3 text-xs font-bold text-white transition hover:bg-[#d96947] disabled:opacity-60">
            <CheckCircle2 className="h-4 w-4" /> مراجعة وتسليم الاختبار
          </button>
          {timeRemaining <= 0 && <p className="mt-2 flex items-start gap-2 text-xs text-red-700"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> انتهى الوقت؛ تم تسليم الإجابات المحفوظة.</p>}
        </aside>
      </div>

      {showSubmitConfirm && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[#352b24]/40 p-5 backdrop-blur-sm" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowSubmitConfirm(false); }}>
          <div dir="rtl" role="dialog" aria-modal="true" aria-labelledby="paper-submit-title" className="w-full max-w-[420px] rounded-2xl border border-[#e7ddd1] bg-[#fffdf8] p-6 shadow-xl">
            <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#fff1e8] text-[#d87753]"><Send className="h-5 w-5" /></span>
            <h2 id="paper-submit-title" className="mb-1 text-lg font-extrabold">هل تريد تسليم الاختبار؟</h2>
            <p className="mb-5 text-xs leading-6 text-[#877c70]">بعد التسليم لن تتمكن من تعديل الإجابات. سيظهر التصحيح ومفتاح الإجابة بعد تأكيد التسليم.</p>
            <div className="mb-5 grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-[#f6f1e9] p-3"><span className="block text-[10px] text-[#9b9083]">تمت الإجابة</span><strong className="mt-1 block text-lg">{toArabicDigits(answeredCount)}<small className="mr-1 text-[10px] font-normal text-[#a39789]">من {toArabicDigits(questions.length)}</small></strong></div>
              <div className="rounded-xl bg-[#f6f1e9] p-3"><span className="block text-[10px] text-[#9b9083]">بلا إجابة</span><strong className="mt-1 block text-lg">{toArabicDigits(questions.length - answeredCount)}<small className="mr-1 text-[10px] font-normal text-[#a39789]">سؤال</small></strong></div>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowSubmitConfirm(false)} className="rounded-xl border border-[#e4dbd0] px-4 py-2.5 text-xs font-bold text-[#72685e] hover:bg-[#f8f4ed]">متابعة الحل</button>
              <button type="button" disabled={submitting} onClick={() => { setShowSubmitConfirm(false); void submitAttempt(timeRemaining <= 0); }} className="rounded-xl bg-[#e47a55] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#d96947] disabled:opacity-60">
                {submitting ? <><LoaderCircle className="ml-2 inline h-4 w-4 animate-spin" /> جارٍ التسليم</> : 'تسليم الآن'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
