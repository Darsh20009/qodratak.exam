import { useEffect, useRef, useState } from 'react';
import { Link } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';
import { getGetStudentCourseQueryKey, type RemedialPracticeStart } from '@workspace/api-client-react';
import { useUser } from '@/hooks/use-user';
import { apiRequest } from '@/lib/queryClient';
import { examQuestionSeconds, resetExamTiming } from '@/lib/examTiming';
import { QiyasExamLayout } from '@/components/QiyasExamLayout';
import ExamLearningReport from '@/components/exam-results/ExamLearningReport';
import { Button } from '@/components/ui/button';

function errorMessage(error: unknown, fallback: string) {
  if (!(error instanceof Error)) return fallback;
  try { return JSON.parse(error.message.replace(/^\d+:\s*/, '')).error || fallback; }
  catch { return error.message; }
}
export default function CoursePracticePage({ taskId }: { taskId: string }) {
  const { user } = useUser();
  const cache = useQueryClient();
  const [test, setTest] = useState<RemedialPracticeStart | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [index, setIndex] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [result, setResult] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const submitting = useRef(false);
  const initialized = useRef<string | null>(null);
  const storageKey = test && user?.id ? `qodratak.course.answers:${user.id}:${test.attemptId}` : null;

  const start = async () => {
    setBusy(true); setError('');
    try {
      const response = await apiRequest('POST', '/api/student/course/practice', { taskId });
      const data: RemedialPracticeStart = await response.json();
      const key = `qodratak.course.answers:${user?.id}:${data.attemptId}`;
      const saved = sessionStorage.getItem(key);
      let initial: Record<string, number> = {};
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          initial = Object.fromEntries(Object.entries(parsed).filter(([id, value]) => data.questions.some((q) => q.id === id && Number.isInteger(value) && Number(value) >= 0 && Number(value) < q.options.length))) as Record<string, number>;
        } catch { /* Corrupt local answers do not change server questions or scoring. */ }
      }
      setAnswers(initial); setTest(data); setIndex(0);
      // Restore a fixed deadline on reload; the stopwatch never grants extra test time.
      const deadlineKey = `${key}:deadline`;
      const previous = Number(sessionStorage.getItem(deadlineKey));
      const deadline = previous > 0 ? previous : Date.now() + Math.max(5, data.questions.length * 2) * 60000;
      sessionStorage.setItem(deadlineKey, String(deadline));
      setRemaining(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)));
    } catch (e) { setError(errorMessage(e, 'تعذر تجهيز التدريب.')); }
    finally { setBusy(false); }
  };
  useEffect(() => {
    if (!user?.id || initialized.current === `${user.id}:${taskId}`) return;
    initialized.current = `${user.id}:${taskId}`;
    void start();
  }, [user?.id, taskId]);
  useEffect(() => {
    if (storageKey && !result) sessionStorage.setItem(storageKey, JSON.stringify(answers));
  }, [answers, storageKey, result]);
  useEffect(() => {
    if (!test || result || !storageKey) return;
    const timer = window.setInterval(() => {
      const deadline = Number(sessionStorage.getItem(`${storageKey}:deadline`));
      setRemaining(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [test, result, storageKey]);

  const submit = async () => {
    if (!test || submitting.current || result) return;
    submitting.current = true; setBusy(true); setError('');
    try {
      const response = await apiRequest('POST', '/api/student/exam-reports/practice/submit', {
        attemptId: test.attemptId,
        answers: test.questions.map((q) => ({ questionId: q.id, selectedOptionIndex: answers[q.id] ?? null, responseTime: examQuestionSeconds(q.id) })),
      });
      setResult(await response.json());
      await cache.invalidateQueries({ queryKey: getGetStudentCourseQueryKey() });
      await cache.invalidateQueries({ queryKey: ['/api/student/exam-reports'] });
      if (storageKey) { sessionStorage.removeItem(storageKey); sessionStorage.removeItem(`${storageKey}:deadline`); }
    } catch (e) { setError(errorMessage(e, 'تعذر التصحيح؛ إجاباتك محفوظة ويمكن إعادة الإرسال.')); }
    finally { submitting.current = false; setBusy(false); }
  };
  useEffect(() => {
    if (test && !result && remaining === 0 && !busy && !error) void submit();
  }, [remaining, test, result, busy, error]);

  if (result) return <div className="mx-auto max-w-4xl space-y-5 p-5" dir="rtl">
    <h1 className="text-2xl font-black">اكتمل تدريب اليوم</h1>
    <p className="text-lg">{result.correctAnswers} إجابة صحيحة من {result.totalQuestions} — التصحيح بمفتاح الحل المعتمد على الخادم.</p>
    <ExamLearningReport />
    <Link href="/preparation-course" className="inline-block rounded-xl bg-primary px-5 py-3 font-bold text-primary-foreground" onClick={() => resetExamTiming()}>الخطوة التالية في خطتي</Link>
  </div>;
  const current = test?.questions[index];
  if (!current) return <div className="mx-auto max-w-xl space-y-5 p-8 text-center" dir="rtl">
    <h1 className="text-2xl font-black">تدريب دورتك</h1>
    {busy ? <p>نجهز الأسئلة المعتمدة لهذه المهمة…</p> : <Button onClick={() => void start()}>إعادة المحاولة</Button>}
    {error && <p role="alert" className="text-destructive">{error}</p>}
    <Link href="/preparation-course" className="block text-primary">العودة لخطتي</Link>
  </div>;
  return <div dir="rtl">
    {error && <div role="alert" className="border-b bg-destructive/10 p-4 text-destructive">{error}<Button variant="outline" disabled={busy} onClick={() => void submit()}>إعادة إرسال الإجابات</Button></div>}
    <QiyasExamLayout examTitle={`تدريب مسار القدرات — اليوم ${taskId.split(':')[1] || 'الحالي'}`} questionNumber={index + 1} totalQuestions={test!.questions.length}
      questionId={current.id} questionText={current.text} questionData={current} questionTypeLabel={current.subcategory}
      hideQuestionTextWhenImageBacked={current.category === 'quantitative'}
      options={current.options} selectedAnswer={answers[current.id] ?? null} timeLeft={remaining}
      onSelectAnswer={(answer) => setAnswers((old) => ({ ...old, [current.id]: answer }))}
      currentQuestionIndex={index} onJumpToQuestion={setIndex} questionsStatus={test!.questions.map((q) => ({ answered: answers[q.id] !== undefined, bookmarked: false }))}
      onPrev={() => setIndex((i) => Math.max(0, i - 1))} onNext={() => setIndex((i) => Math.min(test!.questions.length - 1, i + 1))}
      canGoPrev={index > 0} canGoNext={index < test!.questions.length - 1} isLastQuestion={index === test!.questions.length - 1}
      onFinish={() => void submit()} isFinishing={busy} enableQuantitativeTools={current.category === 'quantitative'} userName={user?.name || user?.username} />
  </div>;
}
