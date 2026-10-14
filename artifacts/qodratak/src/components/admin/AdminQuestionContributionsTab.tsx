import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, RefreshCw, Inbox, Check, X, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  listQuestionContributions, approveQuestionContribution, rejectQuestionContribution, uploadContributionImage, isPersistentImageUrl,
  OPTION_LETTERS, type QuestionContribution, type ContributionStatus, type ContributionCategory, type Difficulty,
} from '@/lib/questionContributions';

const STATUS: [ContributionStatus, string][] = [['pending', 'بانتظار المراجعة'], ['approved', 'معتمدة'], ['rejected', 'مرفوضة']];

function Reviewer({ c, onDone }: { c: QuestionContribution; onDone: () => void }) {
  const [text, setText] = useState(c.questionText);
  const [category, setCategory] = useState<ContributionCategory>(c.category);
  const [subcategory, setSubcategory] = useState(c.subcategory || '');
  const [options, setOptions] = useState(c.options);
  const [correct, setCorrect] = useState(-1);
  const [difficulty, setDifficulty] = useState<Difficulty>('intermediate');
  const [section, setSection] = useState('');
  const [explanation, setExplanation] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [busy, setBusy] = useState<'' | 'approve' | 'reject'>('');
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const upload = async (file: File | undefined) => {
    if (!file) return;
    setUploadError(''); setUploading(true);
    try { setImageUrl(await uploadContributionImage(file)); }
    catch (e) { setUploadError(e instanceof Error ? e.message : 'تعذر رفع الصورة.'); }
    finally { setUploading(false); }
  };

  const approve = async () => {
    setError('');
    const opts = options.map((o) => o.trim());
    const sec = Number(section);
    if (!text.trim()) return setError('نص السؤال مطلوب.');
    if (opts.length < 2 || opts.some((o) => !o)) return setError('كل الخيارات يجب أن تكون مكتوبة.');
    if (correct < 0) return setError('حدد الإجابة الصحيحة المعتمدة بعد التحقق اليدوي.');
    if (!Number.isInteger(sec) || sec < 1) return setError('رقم قسم البنك يجب أن يكون عددًا صحيحًا موجبًا.');
    if (explanation.trim().length < 10) return setError('الشرح المعتمد مطلوب.');
    if (!isPersistentImageUrl(imageUrl.trim())) return setError('رابط الصورة يجب أن يكون رابطًا دائمًا (https أو مسار يبدأ بـ /)، لا رابط blob أو data.');
    setBusy('approve');
    try {
      const r = await approveQuestionContribution(c.id, {
        questionText: text.trim(), category, subcategory: subcategory.trim(), options: opts, correctOptionIndex: correct,
        difficulty, section: sec, explanation: explanation.trim(), imageUrl: imageUrl.trim() || undefined, adminNote: adminNote.trim() || undefined,
      });
      setOk(`أُضيف إلى بنك الأسئلة برقم ${r.questionId}.`);
      onDone();
    } catch (e) { setError(e instanceof Error ? e.message : 'تعذر الاعتماد.'); } finally { setBusy(''); }
  };
  const reject = async () => {
    setError('');
    if (!adminNote.trim()) return setError('اكتب سبب الرفض في ملاحظة الإدارة.');
    setBusy('reject');
    try { await rejectQuestionContribution(c.id, adminNote.trim()); setOk('تم رفض المساهمة.'); onDone(); }
    catch (e) { setError(e instanceof Error ? e.message : 'تعذر الرفض.'); } finally { setBusy(''); }
  };

  return <div className="space-y-4 border-t border-border p-4">
    <div className="space-y-1.5"><Label>نص السؤال</Label><Textarea rows={4} value={text} onChange={(e) => setText(e.target.value)} data-testid={`input-admin-text-${c.id}`} /></div>
    <div className="grid gap-3 sm:grid-cols-3">
      <div className="space-y-1.5"><Label>النوع</Label>
        <select className="h-10 w-full rounded-md border border-input bg-background px-2 text-sm" value={category} onChange={(e) => setCategory(e.target.value as ContributionCategory)}>
          <option value="quantitative">كمي</option><option value="verbal">لفظي</option></select></div>
      <div className="space-y-1.5"><Label>التصنيف الفرعي</Label><Input value={subcategory} onChange={(e) => setSubcategory(e.target.value)} /></div>
      <div className="space-y-1.5"><Label>الصعوبة</Label>
        <select className="h-10 w-full rounded-md border border-input bg-background px-2 text-sm" value={difficulty} onChange={(e) => setDifficulty(e.target.value as Difficulty)}>
          <option value="beginner">مبتدئ</option><option value="intermediate">متوسط</option><option value="advanced">متقدم</option></select></div>
    </div>
    <fieldset className="space-y-2"><legend className="text-sm font-medium">الخيارات — حدد الإجابة الصحيحة المعتمدة</legend>
      <p className="text-xs text-muted-foreground">اختيار الطالب ({OPTION_LETTERS[c.selectedOptionIndex] ?? '-'}) معروض للمرجعية فقط وليس إجابة معتمدة.</p>
      {options.map((o, i) => <div key={i} className="flex items-center gap-2">
        <button type="button" aria-pressed={correct === i} aria-label={`اعتماد الخيار ${OPTION_LETTERS[i]} صحيحًا`} onClick={() => setCorrect(i)}
          className={cn('h-9 w-9 shrink-0 rounded-full border text-sm font-bold', correct === i ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-border')}>{OPTION_LETTERS[i]}</button>
        <Input value={o} onChange={(e) => setOptions(options.map((x, j) => (j === i ? e.target.value : x)))} />
        {i === c.selectedOptionIndex && <span className="shrink-0 rounded bg-muted px-2 py-1 text-[10px] text-muted-foreground">اختيار الطالب</span>}
      </div>)}
    </fieldset>
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="space-y-1.5"><Label>رقم قسم البنك</Label><Input inputMode="numeric" value={section} onChange={(e) => setSection(e.target.value)} data-testid={`input-admin-section-${c.id}`} /></div>
      <div className="space-y-1.5"><Label>رابط الصورة (اختياري، رابط دائم)</Label><Input dir="ltr" placeholder="https://… أو /uploads/…" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
        <label className={cn('mt-2 inline-flex cursor-pointer items-center gap-1 rounded-md border border-input px-3 py-1.5 text-xs font-bold hover:bg-muted focus-within:ring-2 focus-within:ring-primary', uploading && 'pointer-events-none opacity-60')}>
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}{uploading ? 'جارٍ الرفع…' : 'رفع صورة (PNG/JPEG/WebP حتى 5MB)'}
          <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" disabled={uploading} onChange={(e) => { void upload(e.target.files?.[0]); e.target.value = ''; }} data-testid={`input-admin-image-file-${c.id}`} />
        </label>
        {uploadError && <p role="alert" className="mt-1 text-xs text-destructive">{uploadError}</p>}
        {imageUrl && isPersistentImageUrl(imageUrl.trim()) && <img src={imageUrl} alt="معاينة الصورة" className="mt-2 max-h-40 rounded border bg-white object-contain" />}</div>
    </div>
    <div className="space-y-1.5"><Label>الشرح المعتمد</Label><Textarea rows={4} value={explanation} onChange={(e) => setExplanation(e.target.value)} data-testid={`input-admin-explanation-${c.id}`} /></div>
    <div className="space-y-1.5"><Label>ملاحظة الإدارة (مطلوبة عند الرفض)</Label><Textarea rows={2} value={adminNote} onChange={(e) => setAdminNote(e.target.value)} /></div>
    {error && <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 p-2 text-sm text-destructive">{error}</p>}
    {ok && <p role="status" className="text-sm text-emerald-700 dark:text-emerald-400">{ok}</p>}
    <div className="flex flex-wrap gap-2">
      <Button disabled={!!busy || uploading} onClick={approve} data-testid={`button-approve-${c.id}`}>{busy === 'approve' ? <Loader2 className="ml-1 h-4 w-4 animate-spin" /> : <Check className="ml-1 h-4 w-4" />}اعتماد وإضافة للبنك</Button>
      <Button variant="outline" disabled={!!busy} onClick={reject} data-testid={`button-reject-${c.id}`}>{busy === 'reject' ? <Loader2 className="ml-1 h-4 w-4 animate-spin" /> : <X className="ml-1 h-4 w-4" />}رفض</Button>
    </div>
  </div>;
}

export function AdminQuestionContributionsTab() {
  const [status, setStatus] = useState<ContributionStatus>('pending');
  const [openId, setOpenId] = useState<string | number | null>(null);
  const cache = useQueryClient();
  const q = useQuery({ queryKey: ['/api/admin/question-contributions', status], queryFn: () => listQuestionContributions(status) });
  useEffect(() => setOpenId(null), [status]);
  const list = q.data?.contributions || [];
  return <section dir="rtl" className="space-y-4 text-right" data-testid="admin-question-contributions">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div><h2 className="text-lg font-bold">أسئلة شاركها الطلاب</h2><p className="text-sm text-muted-foreground">مراجعة يدوية كاملة: الإجابة الصحيحة والشرح يحددهما المراجع، ولا يُستخدم أي توليد آلي.</p></div>
      <Button variant="outline" size="sm" onClick={() => q.refetch()} disabled={q.isFetching}><RefreshCw className={cn('ml-1 h-4 w-4', q.isFetching && 'animate-spin')} />تحديث</Button>
    </div>
    <div className="flex flex-wrap gap-2">{STATUS.map(([v, l]) => <Button key={v} size="sm" variant={status === v ? 'default' : 'outline'} onClick={() => setStatus(v)}>{l}</Button>)}</div>
    {q.isPending ? <div className="space-y-2">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
      : q.isError ? <div role="alert" className="rounded-xl border border-destructive/40 p-4 text-sm text-destructive">{(q.error as Error).message} <Button size="sm" variant="outline" onClick={() => q.refetch()}>إعادة المحاولة</Button></div>
      : !list.length ? <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground"><Inbox className="mx-auto mb-2 h-8 w-8" aria-hidden />لا توجد مساهمات في هذا التصنيف.</div>
      : list.map((c) => <article key={c.id} className="overflow-hidden rounded-xl border border-border bg-card" data-testid={`card-contribution-${c.id}`}>
        <div className="space-y-2 p-4">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="rounded bg-primary/10 px-2 py-0.5 font-bold text-primary">{c.category === 'quantitative' ? 'كمي' : 'لفظي'}</span>
            {c.subcategory && <span>{c.subcategory}</span>}
            <span>{c.studentName || 'طالب'}</span>
            <span>{new Date(c.submittedAt).toLocaleString('ar-SA')}</span>
            {c.publishedQuestionId != null && <span>رقم السؤال المنشور: {c.publishedQuestionId}</span>}
          </div>
          <p className="whitespace-pre-wrap text-sm font-medium">{c.questionText}</p>
          <ol className="space-y-1 text-sm">{c.options.map((o, i) => <li key={i}>{OPTION_LETTERS[i]}) {o}{i === c.selectedOptionIndex && <span className="mr-2 text-xs text-muted-foreground">(اختيار الطالب، غير معتمد)</span>}</li>)}</ol>
          {c.notes && <p className="text-xs text-muted-foreground">ملاحظات الطالب: {c.notes}</p>}
          {c.adminNote && <p className="text-xs">ملاحظة الإدارة: {c.adminNote}</p>}
          {c.status === 'pending' && <Button size="sm" variant="outline" onClick={() => setOpenId(openId === c.id ? null : c.id)} aria-expanded={openId === c.id}>{openId === c.id ? 'إخفاء المراجعة' : 'مراجعة واعتماد'}</Button>}
        </div>
        {c.status === 'pending' && openId === c.id && <Reviewer c={c} onDone={() => void cache.invalidateQueries({ queryKey: ['/api/admin/question-contributions'] })} />}
      </article>)}
  </section>;
}

export default AdminQuestionContributionsTab;
