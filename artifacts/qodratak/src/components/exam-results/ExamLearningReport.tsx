import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import type { ExamReportRecord, ExamReportSaveOutput, ExamReportCollection } from '@workspace/api-client-react';
import { apiRequest } from '@/lib/queryClient';
import { completeExamTiming } from '@/lib/examTiming';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import RemedialPractice from './RemedialPractice';
import { Link } from 'wouter';

const minutes = (seconds: number) => `${(seconds / 60).toFixed(2)} دقيقة (${Math.round(seconds)} ثانية)`;

export function ReportDetails({ report }: { report: ExamReportRecord }) {
  const cache = useQueryClient();
  const [filter, setFilter] = useState<'all' | 'wrong' | 'slow'>('all');
  const [practice, setPractice] = useState(false);
  const [explanationNotice, setExplanationNotice] = useState('');
  const explanation = useMutation({
    mutationFn: async (questionId: string) => {
      const res = await apiRequest('POST', '/api/student/exam-explanation', { questionId });
      return res.json();
    },
    onSuccess: (result) => {
      setExplanationNotice(result.explanation ? '' : 'تعذر تجهيز شرح موثوق أو قراءة الصورة بوضوح. لم نحفظ تخمينًا؛ يمكنك متابعة التقرير والتدريب.');
      void cache.invalidateQueries({ queryKey: ['/api/student/exam-reports'] });
    },
  });
  const wrong = report.questions.filter((q) => q.isCorrect === false);
  const slow = report.questions.filter((q) => q.isSlow);
  const measured = report.timing.measuredQuestions;
  const known = report.questions.filter((q) => q.isCorrect !== null);
  const visible = report.questions.filter((q) => filter === 'all' || (filter === 'wrong' ? q.isCorrect === false : q.isSlow));
  const weaknesses = [...new Set([...wrong, ...slow].map((q) => q.subcategory || q.category || 'عام'))];
  return <Card dir="rtl" className="my-5 text-right">
    <CardHeader><CardTitle>تقرير التعلم والوقت — {report.title}</CardTitle></CardHeader>
    <CardContent className="space-y-5">
      <Link href="/records" className="inline-block text-sm font-bold text-primary underline underline-offset-4">عرض تقاريري المحفوظة في حسابي</Link>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 text-sm">
        <div>الوقت النشط: <strong>{minutes(report.timing.totalSeconds)}</strong></div>
        <div>تم قياس <strong>{measured}</strong> سؤالًا</div>
        <div>أخطاء موثقة: <strong>{wrong.length}</strong> من {known.length} إجابة موثقة</div>
        <div>أسئلة أبطأ من المعتاد: <strong>{slow.length}</strong></div>
      </div>
      <p className="text-xs text-muted-foreground">الوقت مقاس في المتصفح أثناء ظهور السؤال؛ لا يشمل إخفاء الصفحة. المقارنة مع وسيط وقتك لنوع السؤال، لا مع سرعة جميع الطلاب. عند نقص العينات لا نصنف السؤال بطيئًا.</p>
      {known.length < report.questions.filter((q) => q.selectedOptionIndex !== null).length &&
        <p role="status" className="text-sm text-amber-700 dark:text-amber-300">بعض الإجابات لم تتوفر لها محاولة مصححة موثوقة على الخادم؛ وقتها ظاهر دون اختلاق صحة الإجابة.</p>}
      {weaknesses.length > 0 && <div className="rounded-xl bg-muted p-4 text-sm space-y-2">
        <h3 className="font-bold">خطة المراجعة من أخطائك</h3>
        {weaknesses.map((area) => <p key={area}>راجع {area}، ثم حل تدريبًا من المجال نفسه وأعد قياس وقتك. الخطأ هنا ملاحظة أداء وليس حكمًا نهائيًا على مستواك.</p>)}
        <Button onClick={() => setPractice(true)}>ابدأ تدريبًا إضافيًا من مجالات أخطائي</Button>
      </div>}
      {practice && <RemedialPractice runId={report.runId} onClose={() => setPractice(false)} />}
      <div className="flex gap-2 flex-wrap">
        {([['all', 'كل الأسئلة'], ['wrong', 'الأخطاء'], ['slow', 'الأسئلة البطيئة']] as const).map(([key, title]) =>
          <Button key={key} size="sm" variant={filter === key ? 'default' : 'outline'} onClick={() => setFilter(key)}>{title}</Button>)}
      </div>
      {visible.length === 0 && <p className="text-muted-foreground">لا توجد أسئلة في هذا التصنيف.</p>}
      {visible.map((q, index) => <article key={q.id} className="rounded-xl border border-border p-4 space-y-3">
        <div className="flex flex-wrap gap-3 text-sm font-bold">
          <span>السؤال {report.questions.indexOf(q) + 1}</span>
          <span>{minutes(q.seconds)}</span>
          <span>{q.selectedOptionIndex === null ? 'متروك' : q.isCorrect === null ? 'التصحيح غير موثق' : q.isCorrect ? 'صحيح' : 'خطأ'}</span>
          {q.isSlow && <span className="text-amber-700 dark:text-amber-300">أطول من المعتاد</span>}
        </div>
        <p className="whitespace-pre-wrap">{q.text}</p>
        {q.passageText && <div className="rounded-lg bg-muted p-4 whitespace-pre-wrap text-sm leading-7">{q.passageText}</div>}
        {[...new Set([q.imageUrl, ...(q.imageUrls || [])].filter(Boolean))].map((url) =>
          <img key={url} src={url} alt="صورة السؤال" className="max-h-80 max-w-full object-contain bg-white rounded-lg" />)}
        <p className="text-sm text-muted-foreground">{q.subcategory || q.category}</p>
        {q.baselineSeconds !== null && <p className="text-xs text-muted-foreground">وسيط الوقت المرجعي: {minutes(q.baselineSeconds)} — {q.baselineSource === 'student_history' ? 'من اختباراتك السابقة' : 'من هذا الاختبار'}</p>}
        {q.correctOptionIndex !== null && <p className="text-sm">إجابتك: {q.selectedOptionIndex === null ? 'لم تجب' : q.options[q.selectedOptionIndex]} — الإجابة الصحيحة: {q.options[q.correctOptionIndex]}</p>}
        {q.explanation ? <section className="rounded-lg bg-muted p-3">
          <h4 className="font-bold text-sm">{q.explanationStatus === 'generated' ? 'شرح آلي محفوظ — يحتاج مراجعة علمية' : 'شرح السؤال'}</h4>
          <p className="whitespace-pre-wrap text-sm leading-7 mt-2">{q.explanation}</p>
        </section> : q.isCorrect !== null ? <div className="text-sm space-y-2">
          <p className="text-muted-foreground">لم يتوفر شرح محفوظ بعد. تظل المراجعة والتدريب متاحين.</p>
          <Button size="sm" variant="outline" disabled={explanation.isPending} onClick={() => explanation.mutate(q.sourceQuestionId || q.id)}>تجهيز شرح واحد وحفظه</Button>
        </div> : null}
        {(q.isSlow || q.isCorrect === false) && <div className="text-sm rounded-lg border border-primary/20 p-3">
          <strong>إرشاد لتقليل الوقت: </strong>{q.speedTip}
          <p className="mt-2">افهم الحل أولًا، ثم أعد السؤال دون النظر إلى الشرح. تحسين السرعة لا يعني التخمين.</p>
        </div>}
      </article>)}
      {explanation.isError && <p role="alert" className="text-destructive text-sm">تعذر تجهيز الشرح. قد يكون حد التوليد أو المصدر غير متاح؛ التقرير لا يتوقف.</p>}
      {explanationNotice && <p role="status" className="text-sm text-amber-700 dark:text-amber-300">{explanationNotice}</p>}
    </CardContent>
  </Card>;
}

export default function ExamLearningReport() {
  const [snapshot] = useState(() => completeExamTiming());
  const cache = useQueryClient();
  const saved = useQuery({
    queryKey: ['/api/student/exam-reports', 'save', snapshot?.runId],
    enabled: Boolean(snapshot && Object.keys(snapshot.questions).length),
    queryFn: async () => {
      const response = await apiRequest('POST', '/api/student/exam-reports', {
        runId: snapshot!.runId, title: snapshot!.title,
        questions: Object.values(snapshot!.questions).map((q) => ({ ...q, seconds: Math.min(7200, q.seconds) })),
      });
      return response.json() as Promise<ExamReportSaveOutput>;
    },
    retry: 1, staleTime: Infinity,
    refetchInterval: (query) => query.state.dataUpdateCount < 4 &&
      query.state.data?.report.questions.some((q) => q.selectedOptionIndex !== null && q.isCorrect === null) ? 2500 : false,
  });
  useEffect(() => {
    if (saved.data) void cache.invalidateQueries({ queryKey: ['/api/student/exam-reports'] });
  }, [saved.data, cache]);
  const refreshed = useQuery<ExamReportCollection>({
    queryKey: ['/api/student/exam-reports', 'history'],
    queryFn: async () => (await apiRequest('GET', '/api/student/exam-reports')).json(),
    enabled: Boolean(saved.data),
    staleTime: 0,
    refetchInterval: (query) => query.state.dataUpdateCount < 10 ? 5000 : false,
  });
  if (!snapshot || !Object.keys(snapshot.questions).length) return null;
  if (saved.isPending) return <p role="status" className="my-4">جارٍ حفظ تقرير الوقت والتعلم دون استدعاء ذكاء اصطناعي للتحليل…</p>;
  if (saved.isError) return <div role="alert" className="my-4 text-destructive">تعذر حفظ التقرير. <Button variant="outline" onClick={() => saved.refetch()}>إعادة المحاولة</Button></div>;
  const report = refreshed.data?.reports.find((r) => r.runId === snapshot.runId) || saved.data?.report;
  return report ? <ReportDetails report={report} /> : null;
}

export function ExamReportHistory() {
  const [openedReports, setOpenedReports] = useState<Record<string, boolean>>({});
  const history = useInfiniteQuery({
    queryKey: ['/api/student/exam-reports', 'all-history'],
    initialPageParam: '',
    queryFn: async ({ pageParam }): Promise<ExamReportCollection> =>
      (await apiRequest('GET', `/api/student/exam-reports${pageParam ? `?before=${encodeURIComponent(pageParam)}` : ''}`)).json(),
    getNextPageParam: (lastPage) => lastPage.nextCursor || undefined,
    staleTime: 10000,
  });
  const reports = history.data?.pages.flatMap((page) => page.reports) || [];
  return <section dir="rtl" className="my-6 space-y-4" data-testid="my-results-history">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h2 className="text-xl font-bold">نتائج الاختبارات والتقارير التفصيلية</h2>
      {history.data && <span className="text-sm text-muted-foreground">{history.data.pages[0].totalCount ?? reports.length} تقرير محفوظ</span>}
    </div>
    {history.isPending ? <p>جارٍ تحميل التقارير…</p> : history.isError && !reports.length ? <p role="alert">تعذر تحميل التقارير. <Button onClick={() => history.refetch()}>إعادة المحاولة</Button></p> : reports.length ? reports.map((report) => {
      const answered = report.questions.filter((q) => q.isCorrect !== null);
      const correct = answered.filter((q) => q.isCorrect).length;
      return <details key={report.runId} className="overflow-hidden rounded-xl border border-border bg-card" data-testid="saved-result-card" onToggle={(event) => {
        if (event.currentTarget.open) setOpenedReports((opened) => opened[report.runId] ? opened : { ...opened, [report.runId]: true });
      }}>
        <summary className="cursor-pointer list-none space-y-4 p-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div><h3 className="font-bold text-foreground">{report.title}</h3><p className="mt-1 text-xs text-muted-foreground">{report.createdAt ? new Date(report.createdAt).toLocaleString('ar-SA') : 'التاريخ غير متوفر'}</p></div>
            <span className="rounded-lg bg-primary/10 px-3 py-2 text-xs font-bold text-primary">عرض التقرير التفصيلي</span>
          </div>
          <dl className="grid grid-cols-2 gap-3 border-t border-border pt-4 sm:grid-cols-4 text-sm">
            <div><dt className="text-muted-foreground">الإجابات الصحيحة الموثقة</dt><dd className="mt-1 font-bold">{correct} من {answered.length}</dd></div>
            <div><dt className="text-muted-foreground">دقة الإجابات الموثقة</dt><dd className="mt-1 font-bold">{answered.length ? `${Math.round(correct / answered.length * 100)}%` : 'غير متوفرة'}</dd></div>
            <div><dt className="text-muted-foreground">الأخطاء الموثقة</dt><dd className="mt-1 font-bold">{answered.length - correct}</dd></div>
            <div><dt className="text-muted-foreground">الوقت النشط المسجل</dt><dd className="mt-1 font-bold">{minutes(report.timing.totalSeconds)}</dd></div>
          </dl>
        </summary>
        {openedReports[report.runId] && <div className="border-t border-border px-2 sm:px-4"><ReportDetails report={report} /></div>}
      </details>;
    }) : <div className="rounded-xl border border-dashed border-border bg-card p-7 text-center"><p className="font-bold">لا توجد تقارير محفوظة بعد</p><p className="mt-2 text-sm text-muted-foreground">ستظهر نتائج اختباراتك وتقاريرها هنا بعد إكمالها. لا نفترض زمنًا للأسئلة القديمة.</p></div>}
    {history.isFetchNextPageError && <p role="alert" className="text-sm text-destructive">تعذر تحميل النتائج الأقدم. النتائج المعروضة محفوظة، ويمكنك إعادة المحاولة.</p>}
    {history.hasNextPage && <Button variant="outline" disabled={history.isFetchingNextPage} onClick={() => history.fetchNextPage()} data-testid="button-older-results">{history.isFetchingNextPage ? 'جارٍ تحميل النتائج…' : history.isFetchNextPageError ? 'إعادة تحميل النتائج الأقدم' : 'عرض النتائج الأقدم'}</Button>}
  </section>;
}
