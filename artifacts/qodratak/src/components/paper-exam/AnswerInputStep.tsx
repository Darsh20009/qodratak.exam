import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { AlertCircle, CheckCircle2, ChevronLeft, ChevronRight, Flag, LoaderCircle, ListChecks, Save, Timer } from 'lucide-react';

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

export default function AnswerInputStep({
  exam,
  questions,
  initialAnswers,
  initialReviewQuestionNumbers,
  onSubmit,
}: AnswerInputStepProps) {
  const { toast } = useToast();
  const [answers, setAnswers] = useState<Record<number, number>>(initialAnswers);
  const [reviewQuestionNumbers, setReviewQuestionNumbers] = useState<number[]>(initialReviewQuestionNumbers);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showReview, setShowReview] = useState(false);
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
  const currentQuestion = questions[currentIndex];
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
    if (answeredCount < questions.length) {
      const unanswered = questions.length - answeredCount;
      if (!window.confirm(`تبقى ${unanswered} أسئلة بلا إجابة. هل تريد تسليم الاختبار؟`)) return;
    }
    void submitAttempt(timeRemaining <= 0);
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!questions.length) {
    return <Card><CardContent className="py-12 text-center text-muted-foreground">لا توجد أسئلة في هذه المحاولة.</CardContent></Card>;
  }

  const progress = (answeredCount / questions.length) * 100;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-4" dir="rtl">
      <Card className="sticky top-2 z-20 border-primary/20 shadow-sm">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div>
            <p className="font-bold">{exam.title}</p>
            <p className="text-sm text-muted-foreground">السؤال {currentIndex + 1} من {questions.length}</p>
          </div>
          <div className={`flex items-center gap-2 rounded-xl px-4 py-2 font-mono text-lg font-bold ${timeRemaining <= 300 ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300' : 'bg-muted'}`}>
            <Timer className="h-5 w-5" aria-hidden="true" />
            <span aria-live="polite">{formatTime(timeRemaining)}</span>
          </div>
          <div className="min-w-36 flex-1 sm:max-w-56">
            <div className="mb-1 flex justify-between text-xs text-muted-foreground">
              <span>الإجابات</span><span>{answeredCount}/{questions.length}</span>
            </div>
            <Progress value={progress} />
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground" aria-live="polite">
            {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? 'جارٍ الحفظ' : 'محفوظة تلقائيًا'}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_17rem]">
        <Card className="min-h-[25rem]">
          <CardHeader>
            <CardDescription className="flex items-center justify-between gap-2">
              <span>{exam.program === 'tahsili' ? currentQuestion?.category : currentQuestion?.category === 'verbal' ? 'القسم اللفظي' : 'القسم الكمي'}</span>
              {currentQuestion?.isTrial && <span className="rounded-full bg-blue-100 px-3 py-1 text-blue-800 dark:bg-blue-950 dark:text-blue-200">سؤال تجريبي</span>}
            </CardDescription>
            <CardTitle className="text-lg leading-8 sm:text-xl">السؤال {currentIndex + 1}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="whitespace-pre-wrap text-base leading-8">{currentQuestion?.text}</p>
            {(currentQuestion?.imageUrls?.length ? currentQuestion.imageUrls : currentQuestion?.imageUrl ? [currentQuestion.imageUrl] : []).map((imageUrl, imageIndex) => (
              <img key={`${imageUrl}-${imageIndex}`} src={imageUrl} alt={`شكل توضيحي للسؤال ${currentIndex + 1}`} className="mx-auto max-h-80 max-w-full rounded-xl border object-contain" loading="lazy" />
            ))}
            <RadioGroup
              value={answers[currentIndex + 1] === undefined ? undefined : String(answers[currentIndex + 1])}
              onValueChange={(value) => changeAnswer(currentIndex + 1, value)}
              disabled={timeRemaining <= 0 || submitting}
              className="grid gap-3 sm:grid-cols-2"
            >
              {currentQuestion?.options.map((option, optionIndex) => (
                <Label
                  key={optionIndex}
                  htmlFor={`paper-q${currentIndex + 1}-o${optionIndex}`}
                  className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors ${answers[currentIndex + 1] === optionIndex ? 'border-primary bg-primary/5' : 'hover:bg-muted/60'}`}
                >
                  <RadioGroupItem id={`paper-q${currentIndex + 1}-o${optionIndex}`} value={String(optionIndex)} />
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-sm font-bold">{['أ', 'ب', 'ج', 'د'][optionIndex] ?? optionIndex + 1}</span>
                  <span className="leading-7">{option}</span>
                </Label>
              ))}
            </RadioGroup>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-4">
              <Button variant="outline" disabled={currentIndex === 0} onClick={() => setCurrentIndex((index) => Math.max(0, index - 1))}>
                <ChevronRight className="ml-2 h-4 w-4" /> السابق
              </Button>
              <Button
                type="button"
                variant={reviewQuestionNumbers.includes(currentIndex + 1) ? 'default' : 'outline'}
                onClick={() => toggleReview(currentIndex + 1)}
                aria-pressed={reviewQuestionNumbers.includes(currentIndex + 1)}
              >
                <Flag className="ml-2 h-4 w-4" />
                {reviewQuestionNumbers.includes(currentIndex + 1) ? 'إزالة علامة المراجعة' : 'علّم للمراجعة'}
              </Button>
              <Button variant="outline" disabled={currentIndex === questions.length - 1} onClick={() => setCurrentIndex((index) => Math.min(questions.length - 1, index + 1))}>
                التالي <ChevronLeft className="mr-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base"><ListChecks className="h-5 w-5" />ورقة التظليل</CardTitle>
            <CardDescription>اختر رقمًا للانتقال للسؤال. المعلّم للمراجعة يظهر باللون البرتقالي.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-5 gap-2 sm:grid-cols-8 lg:grid-cols-5">
              {questions.map((question, index) => {
                const number = index + 1;
                const marked = reviewQuestionNumbers.includes(number);
                const answered = answers[number] !== undefined;
                return (
                  <button
                    key={question.id}
                    type="button"
                    onClick={() => { setCurrentIndex(index); setShowReview(false); }}
                    aria-label={`السؤال ${number}${answered ? ' تمت الإجابة' : ' بلا إجابة'}${marked ? ' للمراجعة' : ''}`}
                    aria-current={index === currentIndex ? 'step' : undefined}
                    className={`min-h-10 rounded-lg border text-sm font-semibold transition-colors ${index === currentIndex ? 'ring-2 ring-primary ring-offset-2' : ''} ${marked ? 'border-amber-500 bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200' : answered ? 'border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200' : 'bg-background hover:bg-muted'}`}
                  >
                    {number}
                  </button>
                );
              })}
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><span className="h-3 w-3 rounded border border-emerald-500 bg-emerald-100" /> مجاب</span>
              <span className="flex items-center gap-1"><span className="h-3 w-3 rounded border border-amber-500 bg-amber-100" /> للمراجعة</span>
              <span className="flex items-center gap-1"><span className="h-3 w-3 rounded border" /> بلا إجابة</span>
            </div>
            <Button type="button" variant="outline" className="w-full" onClick={() => setShowReview((visible) => !visible)}>
              {showReview ? 'إخفاء المراجعة النهائية' : 'مراجعة نهائية قبل التسليم'}
            </Button>
            {showReview && (
              <div className="space-y-2 rounded-xl border p-3" aria-live="polite">
                <p className="font-semibold">ملخص قبل التسليم</p>
                <p className="text-sm text-muted-foreground">أجبت عن {answeredCount}، والمتبقي {questions.length - answeredCount}، وعلامات المراجعة {flaggedCount}.</p>
                <div className="max-h-40 space-y-1 overflow-y-auto">
                  {questions.map((question, index) => (
                    <button key={question.id} type="button" className="flex w-full items-center justify-between rounded-md px-2 py-1 text-sm hover:bg-muted" onClick={() => setCurrentIndex(index)}>
                      <span>السؤال {index + 1}</span>
                      <span>{reviewQuestionNumbers.includes(index + 1) ? 'للمراجعة' : answers[index + 1] === undefined ? 'بلا إجابة' : 'تمت الإجابة'}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {timeRemaining <= 0 && <p className="flex items-start gap-2 text-sm text-destructive"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> انتهى الوقت؛ تم إيقاف تغيير الإجابات.</p>}
            <Button className="w-full" disabled={submitting || saving} onClick={handleManualSubmit} data-testid="button-submit-answers">
              {submitting ? <><LoaderCircle className="ml-2 h-4 w-4 animate-spin" />جاري التسليم والتصحيح...</> : <><CheckCircle2 className="ml-2 h-4 w-4" />تسليم الاختبار</>}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
