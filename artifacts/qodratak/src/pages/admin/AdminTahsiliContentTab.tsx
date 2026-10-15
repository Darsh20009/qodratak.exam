import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BookOpen, CheckCircle2, ChevronLeft, ChevronRight, ExternalLink, FileText, ImagePlus, Loader2, RefreshCw, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

type ReviewStatus = 'pending_review' | 'approved' | 'rejected' | 'all';
type Subject = 'رياضيات' | 'فيزياء' | 'كيمياء' | 'أحياء' | 'علم الأرض' | 'مختلط';

interface TahsiliSource {
  id: string;
  title: string;
  originalName: string;
  subject: Subject;
  kind: string;
  pages: number;
  bytes: number;
  primary: boolean;
  fileUrl: string;
  reviewDraftCount: number;
  pendingReviewCount: number;
}

interface TahsiliPlaylistReference {
  subject: string;
  url: string;
}

interface TahsiliDraft {
  _id: string;
  questionId: number;
  sourceId: string;
  sourceBook: string;
  sourcePage: number;
  sourceQuestionNumber?: number;
  sourceBlockIndex: number;
  subject: Subject;
  subcategory: string;
  topic?: string;
  text: string;
  options: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  explanation?: string;
  status: Exclude<ReviewStatus, 'all'>;
  reviewerNotes?: string;
  sourceImageUrl: string | null;
  sourcePdfUrl: string;
  requiresImage?: boolean;
}

interface DraftForm {
  subject: Subject;
  text: string;
  options: string[];
  correctOptionIndex: number | null;
  explanation: string;
  subcategory: string;
  topic: string;
  difficulty: TahsiliDraft['difficulty'];
  reviewerNotes: string;
  requiresImage: boolean;
}

interface DraftResponse {
  drafts: TahsiliDraft[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  counts: Record<string, number>;
}

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { credentials: 'include' });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error((data as { error?: string }).error || 'تعذر تحميل البيانات');
  return data as T;
}

const emptyForm: DraftForm = {
  subject: 'رياضيات',
  text: '',
  options: ['', '', '', ''],
  correctOptionIndex: null,
  explanation: '',
  subcategory: 'عام',
  topic: 'عام',
  difficulty: 'intermediate',
  reviewerNotes: '',
  requiresImage: false,
};

const statusLabels: Record<ReviewStatus, string> = {
  pending_review: 'بانتظار المراجعة',
  approved: 'معتمد',
  rejected: 'مرفوض',
  all: 'الكل',
};

const sourceKindLabels: Record<string, string> = {
  primary_book: 'المصدر الأساسي',
  foundation_book: 'تأسيس وتجميع',
  question_collection: 'تجميع أسئلة',
  practice: 'تدريبات',
  exam_collection: 'اختبارات مجمعة',
};

export default function AdminTahsiliContentTab() {
  const [section, setSection] = useState<'sources' | 'review'>('sources');
  const [status, setStatus] = useState<ReviewStatus>('pending_review');
  const [subject, setSubject] = useState('all');
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState<DraftForm>(emptyForm);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const sourcesQuery = useQuery({
    queryKey: ['/api/admin/tahsili/sources'],
    queryFn: () => getJson<{
      sources: TahsiliSource[];
      playlists: TahsiliPlaylistReference[];
      totalPages: number;
      totalBytes: number;
    }>('/api/admin/tahsili/sources'),
    enabled: section === 'sources',
  });

  const draftsQuery = useQuery({
    queryKey: ['/api/admin/tahsili/question-drafts', status, subject, page],
    queryFn: () => getJson<DraftResponse>(
      `/api/admin/tahsili/question-drafts?status=${status}&subject=${encodeURIComponent(subject)}&page=${page}&limit=20`,
    ),
    enabled: section === 'review',
  });

  const drafts = draftsQuery.data?.drafts ?? [];
  const selectedDraft = useMemo(
    () => drafts.find((draft) => draft._id === selectedId) ?? null,
    [drafts, selectedId],
  );

  useEffect(() => {
    if (drafts.length && !drafts.some((draft) => draft._id === selectedId)) {
      setSelectedId(drafts[0]._id);
    } else if (!drafts.length) {
      setSelectedId(null);
    }
  }, [drafts, selectedId]);

  useEffect(() => {
    if (!selectedDraft) {
      setForm(emptyForm);
      return;
    }
    setForm({
      subject: selectedDraft.subject,
      text: selectedDraft.text,
      options: [...selectedDraft.options],
      correctOptionIndex: null,
      explanation: selectedDraft.explanation || '',
      subcategory: selectedDraft.subcategory || 'عام',
      topic: selectedDraft.topic || selectedDraft.subcategory || 'عام',
      difficulty: selectedDraft.difficulty || 'intermediate',
      reviewerNotes: selectedDraft.reviewerNotes || '',
      requiresImage: selectedDraft.requiresImage || false,
    });
  }, [selectedDraft?._id]);

  const saveMutation = useMutation({
    mutationFn: async (nextStatus: Exclude<ReviewStatus, 'all'>) => {
      if (!selectedDraft) throw new Error('اختر سؤالًا للمراجعة أولًا');
      const response = await apiRequest('PATCH', `/api/admin/tahsili/question-drafts/${selectedDraft._id}/review`, {
        ...form,
        status: nextStatus,
      });
      return response.json();
    },
    onSuccess: (_, nextStatus) => {
      toast({
        title: nextStatus === 'approved' ? 'تم اعتماد السؤال ونشره في بنك التحصيلي' : nextStatus === 'rejected' ? 'تم رفض السؤال' : 'تم حفظ المراجعة',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/tahsili/question-drafts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tahsili/question-bank'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tahsili/subject-tests/overview'] });
    },
    onError: (error: Error) => toast({ title: 'تعذر حفظ المراجعة', description: error.message, variant: 'destructive' }),
  });

  const imageUploadMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!selectedDraft) throw new Error('اختر سؤالًا للمراجعة أولًا');
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch(`/api/admin/tahsili/question-drafts/${selectedDraft._id}/source-image`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error((data as { error?: string }).error || 'تعذر رفع الصورة');
      return data;
    },
    onSuccess: () => {
      setForm((current) => ({ ...current, requiresImage: true }));
      toast({ title: 'تم إرفاق صورة السؤال بالمصدر' });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/tahsili/question-drafts'] });
    },
    onError: (error: Error) => toast({ title: 'تعذر إرفاق صورة السؤال', description: error.message, variant: 'destructive' }),
  });

  const setOption = (index: number, value: string) => {
    setForm((current) => ({
      ...current,
      options: current.options.map((option, optionIndex) => optionIndex === index ? value : option),
    }));
  };

  const sources = sourcesQuery.data?.sources ?? [];
  const sourceBytes = sourcesQuery.data?.totalBytes ?? 0;
  const sourcePages = sourcesQuery.data?.totalPages ?? 0;
  const reviewDraftCount = sources.reduce((total, source) => total + source.reviewDraftCount, 0);

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">محتوى التحصيلي</h2>
          <p className="mt-1 text-sm text-slate-400">
            المصادر والأسئلة تبقى للمراجعة الإدارية؛ لا تظهر للطلاب قبل اعتمادها.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={section === 'sources' ? 'default' : 'outline'}
            onClick={() => setSection('sources')}
            className={section === 'sources' ? 'bg-[#2E8B70] hover:bg-[#26745e]' : 'border-slate-700 text-slate-200'}
          >
            <BookOpen className="ml-2 h-4 w-4" /> المصادر
          </Button>
          <Button
            variant={section === 'review' ? 'default' : 'outline'}
            onClick={() => setSection('review')}
            className={section === 'review' ? 'bg-[#2E8B70] hover:bg-[#26745e]' : 'border-slate-700 text-slate-200'}
          >
            مراجعة الأسئلة
          </Button>
        </div>
      </header>

      {section === 'sources' && (
        <section className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Metric label="ملفات المصدر" value={sources.length || '—'} />
            <Metric label="إجمالي الصفحات" value={sourcePages ? sourcePages.toLocaleString('ar-SA') : '—'} />
            <Metric label="حجم الملفات" value={sourceBytes ? `${(sourceBytes / (1024 * 1024)).toFixed(0)} MB` : '—'} />
            <Metric label="مسودات الأسئلة للمراجعة" value={sourcesQuery.data ? reviewDraftCount.toLocaleString('ar-SA') : '—'} />
          </div>
          {sourcesQuery.isLoading ? <Loading /> : sourcesQuery.isError ? (
            <ErrorState message={(sourcesQuery.error as Error).message} retry={() => void sourcesQuery.refetch()} />
          ) : (
            <>
              <section className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                <div>
                  <h3 className="font-bold text-white">قوائم الفيديو المرجعية</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-400">
                    هذه روابط القوائم فقط؛ لم يتم تنزيل فيديوهات YouTube. بعد رفع ملفات الفيديو الأصلية التي تملكها، يمكن تجهيز النسخ التعليمية بحذف أول 30 ثانية كما طلبت.
                  </p>
                </div>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  {(sourcesQuery.data?.playlists || []).map((playlist) => (
                    <a
                      key={playlist.subject}
                      href={playlist.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between gap-2 rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm font-semibold text-slate-200 hover:border-emerald-500/50"
                    >
                      تأسيس {playlist.subject}
                      <ExternalLink className="h-4 w-4 shrink-0 text-emerald-300" />
                    </a>
                  ))}
                </div>
              </section>
              <div className="grid gap-3 lg:grid-cols-2">
                {sources.map((source) => (
                  <article key={source.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-300">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-bold text-white">{source.title}</h3>
                          {source.primary && <Badge className="bg-amber-500/15 text-amber-200">المرجع الأساسي</Badge>}
                          {source.reviewDraftCount > 0 ? (
                            <Badge className="bg-sky-500/15 text-sky-200">
                              {source.pendingReviewCount.toLocaleString('ar-SA')} بانتظار المراجعة
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-slate-700 text-slate-400">
                              لم تُستخرج مسودات
                            </Badge>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-slate-400">
                          {source.subject} · {sourceKindLabels[source.kind] || source.kind} · {source.pages} صفحة · {(source.bytes / (1024 * 1024)).toFixed(1)} MB
                        </p>
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="mt-3 border-slate-700 text-slate-100 hover:bg-slate-800"
                        >
                          <a href={source.fileUrl} target="_blank" rel="noreferrer">
                            <ExternalLink className="ml-2 h-4 w-4" /> فتح ملف المصدر
                          </a>
                        </Button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
        </section>
      )}

      {section === 'review' && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
            <Select value={status} onValueChange={(value) => { setStatus(value as ReviewStatus); setPage(1); }}>
              <SelectTrigger className="w-48 border-slate-700 bg-slate-950 text-white"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(['pending_review', 'approved', 'rejected', 'all'] as ReviewStatus[]).map((value) => (
                  <SelectItem key={value} value={value}>{statusLabels[value]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={subject} onValueChange={(value) => { setSubject(value); setPage(1); }}>
              <SelectTrigger className="w-44 border-slate-700 bg-slate-950 text-white"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل المواد</SelectItem>
                <SelectItem value="رياضيات">الرياضيات</SelectItem>
                <SelectItem value="فيزياء">الفيزياء</SelectItem>
                <SelectItem value="كيمياء">الكيمياء</SelectItem>
                <SelectItem value="أحياء">الأحياء</SelectItem>
                <SelectItem value="علم الأرض">علم الأرض</SelectItem>
                <SelectItem value="مختلط">غير مصنف / مختلط</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="ghost" onClick={() => void draftsQuery.refetch()} className="text-slate-300">
              <RefreshCw className="ml-2 h-4 w-4" /> تحديث
            </Button>
            <span className="mr-auto text-sm text-slate-400">
              {draftsQuery.data?.total ?? '—'} سؤال في هذا الفلتر
            </span>
          </div>

          {draftsQuery.isLoading ? <Loading /> : draftsQuery.isError ? (
            <ErrorState message={(draftsQuery.error as Error).message} retry={() => void draftsQuery.refetch()} />
          ) : !selectedDraft ? (
            <div className="rounded-2xl border border-dashed border-slate-700 p-10 text-center text-slate-400">
              لا توجد أسئلة في هذه القائمة. لم تُنشر أي أسئلة غير مراجعة للطلاب.
            </div>
          ) : (
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(400px,1fr)]">
              <article className="min-w-0 space-y-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-bold text-white">{selectedDraft.subject} · صفحة {selectedDraft.sourcePage}</p>
                    <p className="mt-1 text-xs text-slate-400">{selectedDraft.sourceBook} · {selectedDraft.sourceId} · {selectedDraft._id}</p>
                  </div>
                  <Button asChild variant="outline" size="sm" className="border-slate-700 text-slate-100">
                    <a href={selectedDraft.sourcePdfUrl} target="_blank" rel="noreferrer">
                      <ExternalLink className="ml-2 h-4 w-4" /> صفحة الكتاب الأصلية
                    </a>
                  </Button>
                </div>
                <div className="flex min-h-[260px] items-center justify-center overflow-hidden rounded-xl border border-slate-800 bg-slate-950 p-2">
                  {selectedDraft.sourceImageUrl ? (
                    <img
                      src={selectedDraft.sourceImageUrl}
                      alt={`صورة السؤال من صفحة ${selectedDraft.sourcePage}`}
                      className="max-h-[70vh] max-w-full object-contain"
                    />
                  ) : (
                    <p className="max-w-md px-5 text-center text-sm leading-7 text-slate-400">
                      لا توجد صورة مقصوصة لهذا السؤال بعد. افتح صفحة المصدر لمراجعة الشكل أو الرسم، ثم أرفق قصاصة السؤال إن كان يعتمد على صورة.
                    </p>
                  )}
                </div>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800">
                  <ImagePlus className="h-4 w-4" />
                  {selectedDraft.sourceImageUrl ? 'استبدال صورة السؤال' : 'إرفاق صورة السؤال'}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="sr-only"
                    disabled={imageUploadMutation.isPending}
                    onChange={(event) => {
                      const file = event.currentTarget.files?.[0];
                      if (file) imageUploadMutation.mutate(file);
                      event.currentTarget.value = '';
                    }}
                  />
                </label>
                <label className="flex items-start gap-2 text-sm leading-6 text-slate-300">
                  <input
                    type="checkbox"
                    checked={form.requiresImage}
                    onChange={(event) => setForm((current) => ({ ...current, requiresImage: event.target.checked }))}
                    className="mt-1 accent-emerald-400"
                  />
                  يعتمد السؤال على صورة أو رسم؛ لا يمكن اعتماده قبل إرفاق صورة واضحة.
                </label>
                {imageUploadMutation.isPending && <p className="text-xs text-slate-400">جارٍ رفع صورة السؤال…</p>}
              </article>

              <div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                <label className="block text-sm font-bold text-slate-200">
                  نص السؤال المنقول (قارنه بصفحة المصدر وصحح أخطاء OCR)
                  <Textarea
                    value={form.text}
                    onChange={(event) => setForm((current) => ({ ...current, text: event.target.value }))}
                    className="mt-2 min-h-24 border-slate-700 bg-slate-950 text-white"
                    dir="rtl"
                  />
                </label>
                <div className="grid gap-2 sm:grid-cols-2">
                  {form.options.map((option, index) => (
                    <label key={index} className="flex items-start gap-2 rounded-xl border border-slate-800 p-3 text-sm text-slate-200">
                      <input
                        type="radio"
                        name={`correct-option-${selectedDraft._id}`}
                        checked={form.correctOptionIndex === index}
                        onChange={() => setForm((current) => ({ ...current, correctOptionIndex: index }))}
                        className="mt-1 accent-emerald-400"
                        aria-label={`اعتماد الخيار ${index + 1} إجابة صحيحة`}
                      />
                      <span className="w-5 shrink-0 font-bold">{String.fromCharCode(65 + index)}</span>
                      <Input
                        value={option}
                        onChange={(event) => setOption(index, event.target.value)}
                        className="border-slate-700 bg-slate-950 text-white"
                        dir="rtl"
                        aria-label={`نص الخيار ${index + 1}`}
                      />
                    </label>
                  ))}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Select value={form.subject} onValueChange={(value) => setForm((current) => ({ ...current, subject: value as Subject }))}>
                    <SelectTrigger className="border-slate-700 bg-slate-950 text-white"><SelectValue placeholder="المادة" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="رياضيات">الرياضيات</SelectItem>
                      <SelectItem value="فيزياء">الفيزياء</SelectItem>
                      <SelectItem value="كيمياء">الكيمياء</SelectItem>
                      <SelectItem value="أحياء">الأحياء</SelectItem>
                      <SelectItem value="علم الأرض">علم الأرض</SelectItem>
                      <SelectItem value="مختلط">غير مصنف / مختلط</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    value={form.subcategory}
                    onChange={(event) => setForm((current) => ({ ...current, subcategory: event.target.value }))}
                    placeholder="المهارة أو التصنيف"
                    className="border-slate-700 bg-slate-950 text-white"
                    dir="rtl"
                  />
                  <Select value={form.difficulty} onValueChange={(value) => setForm((current) => ({ ...current, difficulty: value as DraftForm['difficulty'] }))}>
                    <SelectTrigger className="border-slate-700 bg-slate-950 text-white"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">مبتدئ</SelectItem>
                      <SelectItem value="intermediate">متوسط</SelectItem>
                      <SelectItem value="advanced">متقدم</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Textarea
                  value={form.explanation}
                  onChange={(event) => setForm((current) => ({ ...current, explanation: event.target.value }))}
                  placeholder="اكتب شرح الحل بعد مطابقته مع المصدر. الاعتماد يتطلب شرحًا واضحًا."
                  className="min-h-28 border-slate-700 bg-slate-950 text-white"
                  dir="rtl"
                />
                <Textarea
                  value={form.reviewerNotes}
                  onChange={(event) => setForm((current) => ({ ...current, reviewerNotes: event.target.value }))}
                  placeholder="ملاحظة داخلية للمراجع (اختيارية)"
                  className="min-h-16 border-slate-700 bg-slate-950 text-white"
                  dir="rtl"
                />
                <div className="flex flex-wrap justify-between gap-2 border-t border-slate-800 pt-3">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      disabled={saveMutation.isPending || !draftsQuery.data || page <= 1}
                      onClick={() => setPage((current) => Math.max(1, current - 1))}
                      className="border-slate-700 text-slate-200"
                    >
                      <ChevronRight className="ml-1 h-4 w-4" /> السابق
                    </Button>
                    <Button
                      variant="outline"
                      disabled={saveMutation.isPending || page >= (draftsQuery.data?.totalPages ?? 1)}
                      onClick={() => setPage((current) => current + 1)}
                      className="border-slate-700 text-slate-200"
                    >
                      التالي <ChevronLeft className="mr-1 h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" disabled={saveMutation.isPending} onClick={() => saveMutation.mutate('pending_review')} className="border-slate-700 text-slate-200">
                      حفظ للمراجعة
                    </Button>
                    <Button variant="outline" disabled={saveMutation.isPending} onClick={() => saveMutation.mutate('rejected')} className="border-red-900 text-red-200 hover:bg-red-950/50">
                      <XCircle className="ml-2 h-4 w-4" /> رفض
                    </Button>
                    <Button
                      disabled={saveMutation.isPending || imageUploadMutation.isPending || (form.requiresImage && !selectedDraft.sourceImageUrl)}
                      onClick={() => saveMutation.mutate('approved')}
                      className="bg-emerald-600 text-white hover:bg-emerald-500"
                    >
                      {saveMutation.isPending ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="ml-2 h-4 w-4" />}
                      اعتماد ونشر
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-black text-white">{value}</p>
    </div>
  );
}

function Loading() {
  return (
    <div className="flex items-center justify-center gap-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-10 text-slate-300">
      <Loader2 className="h-5 w-5 animate-spin" /> جارٍ التحميل…
    </div>
  );
}

function ErrorState({ message, retry }: { message: string; retry: () => void }) {
  return (
    <div role="alert" className="rounded-2xl border border-red-900/70 bg-red-950/30 p-5 text-red-200">
      <p>{message}</p>
      <Button variant="outline" onClick={retry} className="mt-3 border-red-900 text-red-100">إعادة المحاولة</Button>
    </div>
  );
}
