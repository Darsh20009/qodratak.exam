import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useExamQuestionTiming, examQuestionSeconds } from '@/lib/examTiming';
import { Button } from '@/components/ui/button';
import type { RemedialPracticeStart, RemedialPracticeResult } from '@workspace/api-client-react';
import ExamLearningReport from './ExamLearningReport';

export default function RemedialPractice({ runId, onClose }: { runId: string; onClose: () => void }) {
  const [test, setTest] = useState<RemedialPracticeStart | null>(null);
  const [result, setResult] = useState<RemedialPracticeResult | null>(null);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const current = test?.questions[index];
  useExamQuestionTiming(current, current ? answers[current.id] ?? null : null, Boolean(current && !result), 'تدريب علاجي من أخطائي');
  const start = useMutation({
    mutationFn: async () => (await apiRequest('POST', '/api/student/exam-reports/practice', { runId })).json() as Promise<RemedialPracticeStart>,
    onSuccess: setTest,
  });
  const submit = useMutation({
    mutationFn: async () => (await apiRequest('POST', '/api/student/exam-reports/practice/submit', {
      attemptId: test!.attemptId,
      answers: test!.questions.map((q) => ({ questionId: q.id, selectedOptionIndex: answers[q.id] ?? null, responseTime: examQuestionSeconds(q.id) })),
    })).json() as Promise<RemedialPracticeResult>,
    onSuccess: setResult,
  });
  const error = start.error || submit.error;
  return <section className="rounded-xl border border-primary/30 p-4 space-y-4">
    <h3 className="font-bold">تدريب إضافي معتمد من مجالات أخطائك</h3>
    {!test && <Button disabled={start.isPending} onClick={() => start.mutate()}>{start.isPending ? 'جارٍ اختيار الأسئلة…' : 'اختيار الأسئلة وبدء التدريب'}</Button>}
    {current && !result && <>
      <p>السؤال {index + 1} من {test!.questions.length} — {current.subcategory}</p>
      <p className="whitespace-pre-wrap">{current.text}</p>
      {current.passageText && <div className="rounded-lg bg-muted p-4 whitespace-pre-wrap leading-7">{current.passageText}</div>}
      {[...new Set([current.imageUrl, ...(current.imageUrls || [])].filter(Boolean))].map((url) => <img key={url} src={url} alt="صورة السؤال" className="max-h-72 max-w-full bg-white object-contain" />)}
      {current.options.map((option, i) => <Button key={i} className="w-full justify-start whitespace-normal h-auto" variant={answers[current.id] === i ? 'default' : 'outline'} onClick={() => setAnswers((old) => ({ ...old, [current.id]: i }))}>{option}</Button>)}
      <div className="flex gap-2">
        <Button variant="outline" disabled={!index || submit.isPending} onClick={() => setIndex(index - 1)}>السابق</Button>
        {index < test!.questions.length - 1 ? <Button onClick={() => setIndex(index + 1)}>التالي</Button> : <Button disabled={submit.isPending} onClick={() => submit.mutate()}>تصحيح وحفظ التدريب</Button>}
      </div>
    </>}
    {result && <><p className="font-bold">{result.correctAnswers} إجابة صحيحة من {result.totalQuestions}</p><ExamLearningReport /></>}
    {error && <p role="alert" className="text-destructive text-sm">{error.message.replace(/^\d+: /, '')}</p>}
    <Button variant="ghost" onClick={onClose}>إغلاق التدريب</Button>
  </section>;
}
