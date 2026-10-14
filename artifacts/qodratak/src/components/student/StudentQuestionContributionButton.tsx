import { useState } from 'react';
import { HandHeart, Plus, Trash2, Loader2, CheckCircle2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { submitQuestionContribution, OPTION_LETTERS, type ContributionCategory } from '@/lib/questionContributions';

const emptyForm = () => ({
  questionText: '', category: '' as ContributionCategory | '', subcategory: '',
  options: ['', '', '', ''], selected: -1, notes: '',
});

export function StudentQuestionContributionButton({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<null | 'sent' | 'failed' | 'queued'>(null);

  const setOption = (i: number, v: string) => setForm((f) => ({ ...f, options: f.options.map((o, j) => (j === i ? v : o)) }));
  const removeOption = (i: number) => setForm((f) => ({
    ...f, options: f.options.filter((_, j) => j !== i),
    selected: f.selected === i ? -1 : f.selected > i ? f.selected - 1 : f.selected,
  }));

  const submit = async () => {
    setError('');
    const options = form.options.map((o) => o.trim());
    if (form.questionText.trim().length < 5) return setError('اكتب نص السؤال كما تتذكره.');
    if (!form.category) return setError('اختر نوع السؤال: كمي أو لفظي.');
    if (options.filter(Boolean).length < 2 || options.some((o) => !o)) return setError('اكتب خيارين على الأقل، واحذف الخيارات الفارغة.');
    if (form.selected < 0) return setError('حدد الخيار الذي اخترته أنت في الاختبار.');
    setBusy(true);
    try {
      const res = await submitQuestionContribution({
        questionText: form.questionText.trim(), category: form.category,
        subcategory: form.subcategory.trim() || undefined, options,
        selectedOptionIndex: form.selected, notes: form.notes.trim() || undefined,
      });
      setDone(res.notificationStatus);
      setForm(emptyForm());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'تعذر إرسال السؤال.');
    } finally { setBusy(false); }
  };

  return <>
    <button type="button" onClick={() => { setOpen(true); setDone(null); setError(''); }}
      className={cn('inline-flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-3 py-2 text-xs font-bold text-primary transition-colors hover:bg-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary', className)}
      title="دخلت اختبارًا؟ شارك سؤالًا" data-testid="button-share-question">
      <HandHeart className="h-4 w-4" aria-hidden />
      <span>ساعد زملاءك</span>
    </button>
    <Dialog open={open} onOpenChange={(v) => { if (!busy) setOpen(v); }}>
      <DialogContent dir="rtl" className="max-h-[92dvh] overflow-y-auto text-right sm:max-w-lg">
        <DialogHeader className="text-right sm:text-right">
          <DialogTitle>دخلت اختبارًا؟ شارك سؤالًا</DialogTitle>
          <DialogDescription>اكتب السؤال كما تتذكره. يراجعه فريق المحتوى يدويًا ويحدد الإجابة الصحيحة والشرح قبل إضافته لبنك الأسئلة.</DialogDescription>
        </DialogHeader>
        {done ? <div className="space-y-3 py-6 text-center" role="status" data-testid="status-contribution-sent">
          <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600 dark:text-emerald-400" aria-hidden />
          <p className="font-bold">وصل سؤالك، شكرًا لمساعدتك زملاءك.</p>
          <p className="text-sm text-muted-foreground">السؤال الآن بانتظار المراجعة، ولن يظهر للطلاب قبل اعتماده.{done === 'failed' ? ' السؤال محفوظ، لكن إرسال تنبيه الإدارة فشل؛ سيظهر لهم في قائمة المراجعة.' : done === 'queued' ? ' السؤال محفوظ، وتنبيه الإدارة في قائمة الإرسال ولم يتأكد وصوله بعد.' : ' السؤال محفوظ وأُرسل تنبيه للإدارة.'}</p>
          <div className="flex justify-center gap-2"><Button variant="outline" onClick={() => setDone(null)}>مشاركة سؤال آخر</Button><Button onClick={() => setOpen(false)}>إغلاق</Button></div>
        </div> : <div className="space-y-4">
          <div className="space-y-1.5"><Label htmlFor="contrib-text">نص السؤال</Label>
            <Textarea id="contrib-text" rows={4} value={form.questionText} onChange={(e) => setForm({ ...form, questionText: e.target.value })} data-testid="input-contribution-text" /></div>
          <fieldset className="space-y-1.5"><legend className="text-sm font-medium">النوع</legend>
            <div className="grid grid-cols-2 gap-2">
              {([['quantitative', 'كمي'], ['verbal', 'لفظي']] as const).map(([v, l]) =>
                <button key={v} type="button" aria-pressed={form.category === v} onClick={() => setForm({ ...form, category: v })}
                  className={cn('rounded-xl border px-3 py-2 text-sm font-bold transition-colors', form.category === v ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:bg-muted')}
                  data-testid={`button-category-${v}`}>{l}</button>)}
            </div></fieldset>
          <div className="space-y-1.5"><Label htmlFor="contrib-sub">التصنيف الفرعي (اختياري)</Label>
            <Input id="contrib-sub" placeholder="مثل: تناظر لفظي، هندسة" value={form.subcategory} onChange={(e) => setForm({ ...form, subcategory: e.target.value })} data-testid="input-contribution-subcategory" /></div>
          <fieldset className="space-y-2"><legend className="text-sm font-medium">الخيارات — وحدد الخيار الذي اخترته أنت</legend>
            <p className="text-xs text-amber-700 dark:text-amber-300">اختيارك ليس بالضرورة الإجابة الصحيحة؛ نسجله كما هو، وتحدد الإدارة الإجابة المعتمدة.</p>
            {form.options.map((o, i) => <div key={i} className="flex items-center gap-2">
              <button type="button" aria-label={`اخترت الخيار ${OPTION_LETTERS[i]}`} aria-pressed={form.selected === i} onClick={() => setForm({ ...form, selected: i })}
                className={cn('h-9 w-9 shrink-0 rounded-full border text-sm font-bold', form.selected === i ? 'border-primary bg-primary text-primary-foreground' : 'border-border')}
                data-testid={`button-select-option-${i}`}>{OPTION_LETTERS[i]}</button>
              <Input value={o} onChange={(e) => setOption(i, e.target.value)} aria-label={`الخيار ${OPTION_LETTERS[i]}`} data-testid={`input-option-${i}`} />
              {form.options.length > 2 && <Button type="button" size="icon" variant="ghost" aria-label="حذف الخيار" onClick={() => removeOption(i)}><Trash2 className="h-4 w-4" /></Button>}
            </div>)}
            {form.options.length < 6 && <Button type="button" size="sm" variant="outline" onClick={() => setForm({ ...form, options: [...form.options, ''] })}><Plus className="ml-1 h-4 w-4" />إضافة خيار</Button>}
          </fieldset>
          <div className="space-y-1.5"><Label htmlFor="contrib-notes">ملاحظات (اختياري)</Label>
            <Textarea id="contrib-notes" rows={2} placeholder="مثل: كان مع السؤال شكل أو جدول" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} data-testid="input-contribution-notes" /></div>
          {error && <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 p-2 text-sm text-destructive" data-testid="text-contribution-error">{error}</p>}
          <Button className="w-full" disabled={busy} onClick={submit} data-testid="button-submit-contribution">
            {busy && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}{busy ? 'جارٍ الإرسال…' : 'إرسال للمراجعة'}</Button>
        </div>}
      </DialogContent>
    </Dialog>
  </>;
}

export default StudentQuestionContributionButton;
