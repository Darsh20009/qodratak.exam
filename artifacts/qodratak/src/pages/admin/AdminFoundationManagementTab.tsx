import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BookOpen, CheckCircle, Edit, Loader2, MessageSquare, Plus, Star, Trash2, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

type Program = 'qudrat' | 'tahsili';
interface FoundationContent {
  _id?: string;
  id?: string;
  program: Program;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl?: string;
  order: number;
  published: boolean;
  linkedQuizRoute?: string;
  durationMinutes?: number;
}
interface PlatformReview {
  _id?: string;
  id?: string;
  studentName?: string;
  userId?: string | { _id?: string; fullName?: string; username?: string; email?: string };
  rating: number;
  text: string;
  status: 'pending' | 'approved' | 'rejected';
  featured: boolean;
  adminReply?: string;
  createdAt?: string;
}

const emptyLesson: FoundationContent = { program: 'qudrat', title: '', description: '', videoUrl: '', thumbnailUrl: '', order: 0, published: false, linkedQuizRoute: '', durationMinutes: undefined };
const recordId = (record: { _id?: string; id?: string }) => record._id || record.id || '';
const listFrom = <T,>(data: unknown, keys: string[]): T[] => {
  if (Array.isArray(data)) return data as T[];
  if (!data || typeof data !== 'object') return [];
  const source = data as Record<string, unknown>;
  for (const key of keys) if (Array.isArray(source[key])) return source[key] as T[];
  return [];
};

async function getJson(url: string) {
  const response = await fetch(url, { credentials: 'include' });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error((data as { error?: string }).error || 'تعذر تحميل البيانات');
  return data;
}

export default function AdminFoundationManagementTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [section, setSection] = useState<'lessons' | 'reviews'>('lessons');
  const [lessonDialogOpen, setLessonDialogOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<FoundationContent | null>(null);
  const [lessonForm, setLessonForm] = useState<FoundationContent>(emptyLesson);
  const [reviewDialog, setReviewDialog] = useState<PlatformReview | null>(null);
  const [reply, setReply] = useState('');

  const lessonsQuery = useQuery({
    queryKey: ['/api/admin/foundation-content'],
    queryFn: () => getJson('/api/admin/foundation-content'),
    enabled: section === 'lessons',
  });
  const reviewsQuery = useQuery({
    queryKey: ['/api/admin/platform-reviews'],
    queryFn: () => getJson('/api/admin/platform-reviews'),
    enabled: section === 'reviews',
  });
  const lessons = useMemo(() => listFrom<FoundationContent>(lessonsQuery.data, ['content', 'foundationContent', 'items', 'data']), [lessonsQuery.data]);
  const reviews = useMemo(() => listFrom<PlatformReview>(reviewsQuery.data, ['reviews', 'platformReviews', 'items', 'data']), [reviewsQuery.data]);

  const saveLesson = useMutation({
    mutationFn: async () => {
      const body = {
        ...lessonForm,
        thumbnailUrl: lessonForm.thumbnailUrl || undefined,
        linkedQuizRoute: lessonForm.linkedQuizRoute || undefined,
        durationMinutes: lessonForm.durationMinutes || undefined,
      };
      const response = editingLesson
        ? await apiRequest('PUT', `/api/admin/foundation-content/${recordId(editingLesson)}`, body)
        : await apiRequest('POST', '/api/admin/foundation-content', body);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: editingLesson ? 'تم تحديث الدرس' : 'تم إنشاء الدرس' });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/foundation-content'] });
      setLessonDialogOpen(false);
      setEditingLesson(null);
      setLessonForm(emptyLesson);
    },
    onError: (error: Error) => toast({ title: 'تعذر حفظ الدرس', description: error.message, variant: 'destructive' }),
  });
  const deleteLesson = useMutation({
    mutationFn: (lesson: FoundationContent) => apiRequest('DELETE', `/api/admin/foundation-content/${recordId(lesson)}`),
    onSuccess: () => {
      toast({ title: 'تم حذف الدرس' });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/foundation-content'] });
    },
    onError: (error: Error) => toast({ title: 'تعذر حذف الدرس', description: error.message, variant: 'destructive' }),
  });
  const updateReview = useMutation({
    mutationFn: async ({ review, data }: { review: PlatformReview; data: Partial<PlatformReview> }) => {
      const response = await apiRequest('PATCH', `/api/admin/platform-reviews/${recordId(review)}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'تم تحديث المراجعة' });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/platform-reviews'] });
      setReviewDialog(null);
    },
    onError: (error: Error) => toast({ title: 'تعذر تحديث المراجعة', description: error.message, variant: 'destructive' }),
  });
  const deleteReview = useMutation({
    mutationFn: (review: PlatformReview) => apiRequest('DELETE', `/api/admin/platform-reviews/${recordId(review)}`),
    onSuccess: () => {
      toast({ title: 'تم حذف المراجعة' });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/platform-reviews'] });
    },
    onError: (error: Error) => toast({ title: 'تعذر حذف المراجعة', description: error.message, variant: 'destructive' }),
  });

  useEffect(() => setReply(reviewDialog?.adminReply || ''), [reviewDialog]);
  const openCreate = () => { setEditingLesson(null); setLessonForm(emptyLesson); setLessonDialogOpen(true); };
  const openEdit = (lesson: FoundationContent) => { setEditingLesson(lesson); setLessonForm({ ...emptyLesson, ...lesson }); setLessonDialogOpen(true); };
  const studentLabel = (review: PlatformReview) => {
    if (review.studentName) return review.studentName;
    if (typeof review.userId === 'object') return review.userId.fullName || review.userId.username || review.userId.email || review.userId._id || 'طالب غير معروف';
    return review.userId || 'طالب غير معروف';
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="text-xl font-bold text-white">محتوى المنتج والمراجعات</h2><p className="mt-1 text-sm text-slate-400">إدارة دروس التأسيس ومراجعات الطلاب المنشورة.</p></div>
        {section === 'lessons' && <Button onClick={openCreate} className="bg-emerald-600 hover:bg-emerald-500"><Plus className="ml-2 h-4 w-4" />إضافة درس</Button>}
      </div>
      <div className="flex gap-2 border-b border-slate-800">
        <button onClick={() => setSection('lessons')} className={`px-4 py-3 text-sm font-medium ${section === 'lessons' ? 'border-b-2 border-emerald-400 text-emerald-300' : 'text-slate-400'}`}><BookOpen className="ml-2 inline h-4 w-4" />دروس التأسيس</button>
        <button onClick={() => setSection('reviews')} className={`px-4 py-3 text-sm font-medium ${section === 'reviews' ? 'border-b-2 border-emerald-400 text-emerald-300' : 'text-slate-400'}`}><MessageSquare className="ml-2 inline h-4 w-4" />مراجعات المنصة</button>
      </div>
      {section === 'lessons' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60">
          {lessonsQuery.isLoading ? <Loading /> : lessonsQuery.isError ? <ErrorState message={(lessonsQuery.error as Error).message} retry={() => lessonsQuery.refetch()} /> : lessons.length === 0 ? <EmptyState label="لا توجد دروس تأسيسية بعد." /> :
            <div className="divide-y divide-slate-800">{[...lessons].sort((a, b) => a.order - b.order).map(lesson => <div key={recordId(lesson)} className="flex flex-wrap items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-300"><Video className="h-5 w-5" /></div>
              <div className="min-w-[180px] flex-1"><p className="font-medium text-white">{lesson.title}</p><p className="mt-1 text-xs text-slate-400">{lesson.program === 'qudrat' ? 'قدرات' : 'تحصيلي'} · الترتيب {lesson.order}{lesson.durationMinutes ? ` · ${lesson.durationMinutes} دقيقة` : ''}{lesson.linkedQuizRoute ? ' · اختبار مرتبط' : ''}</p></div>
              <span className={`rounded-full px-2 py-1 text-xs ${lesson.published ? 'bg-emerald-500/15 text-emerald-300' : 'bg-slate-700 text-slate-300'}`}>{lesson.published ? 'منشور' : 'مسودة'}</span>
              <Button variant="ghost" size="sm" onClick={() => openEdit(lesson)} className="text-slate-300"><Edit className="ml-1 h-4 w-4" />تعديل</Button>
              <Button variant="ghost" size="sm" onClick={() => { if (window.confirm('هل تريد حذف هذا الدرس؟')) deleteLesson.mutate(lesson); }} disabled={deleteLesson.isPending} className="text-red-300 hover:text-red-200"><Trash2 className="h-4 w-4" /></Button>
            </div>)}</div>}
        </div>
      )}
      {section === 'reviews' && (
        <div className="space-y-3">
          {reviewsQuery.isLoading ? <Loading /> : reviewsQuery.isError ? <ErrorState message={(reviewsQuery.error as Error).message} retry={() => reviewsQuery.refetch()} /> : reviews.length === 0 ? <EmptyState label="لا توجد مراجعات من الطلاب حالياً." /> :
            reviews.map(review => <div key={recordId(review)} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5"><div className="flex flex-wrap justify-between gap-3"><div><p className="font-medium text-white">{studentLabel(review)}</p><p className="mt-1 text-xs text-slate-400">{typeof review.userId === 'string' ? review.userId : review.userId?._id || ''} {review.createdAt ? `· ${new Date(review.createdAt).toLocaleDateString('ar-SA')}` : ''}</p></div><div className="flex items-center gap-2"><span className="text-amber-300">{review.rating} / 5</span><span className={`rounded-full px-2 py-1 text-xs ${review.status === 'approved' ? 'bg-emerald-500/15 text-emerald-300' : review.status === 'rejected' ? 'bg-red-500/15 text-red-300' : 'bg-amber-500/15 text-amber-300'}`}>{review.status === 'approved' ? 'معتمدة' : review.status === 'rejected' ? 'مرفوضة' : 'بانتظار المراجعة'}</span></div></div><p className="mt-4 text-sm leading-7 text-slate-300">{review.text}</p>{review.adminReply && <p className="mt-3 border-r-2 border-emerald-400 pr-3 text-sm text-emerald-100">رد الإدارة: {review.adminReply}</p>}<div className="mt-4 flex flex-wrap gap-2"><Button size="sm" onClick={() => updateReview.mutate({ review, data: { status: 'approved' } })} disabled={updateReview.isPending} className="bg-emerald-700 hover:bg-emerald-600"><CheckCircle className="ml-1 h-4 w-4" />اعتماد</Button><Button size="sm" variant="outline" onClick={() => updateReview.mutate({ review, data: { status: 'rejected' } })} disabled={updateReview.isPending} className="border-red-900 text-red-300">رفض</Button><Button size="sm" variant="outline" onClick={() => updateReview.mutate({ review, data: { featured: !review.featured } })} disabled={updateReview.isPending} className="border-slate-700 text-slate-200"><Star className={`ml-1 h-4 w-4 ${review.featured ? 'fill-amber-300 text-amber-300' : ''}`} />{review.featured ? 'مميزة' : 'تمييز'}</Button><Button size="sm" variant="outline" onClick={() => setReviewDialog(review)} className="border-slate-700 text-slate-200">رد</Button><Button size="sm" variant="ghost" onClick={() => { if (window.confirm('هل تريد حذف هذه المراجعة؟')) deleteReview.mutate(review); }} className="text-red-300"><Trash2 className="h-4 w-4" /></Button></div></div>)}
        </div>
      )}
      <Dialog open={lessonDialogOpen} onOpenChange={setLessonDialogOpen}><DialogContent className="max-h-[90vh] overflow-y-auto bg-slate-950 text-white sm:max-w-2xl"><DialogHeader><DialogTitle>{editingLesson ? 'تعديل درس تأسيسي' : 'إضافة درس تأسيسي'}</DialogTitle></DialogHeader><form className="grid gap-4" onSubmit={event => { event.preventDefault(); saveLesson.mutate(); }}><div className="grid gap-4 sm:grid-cols-2"><Field label="المسار"><select required value={lessonForm.program} onChange={e => setLessonForm(f => ({ ...f, program: e.target.value as Program }))} className="h-10 w-full rounded-md border border-slate-700 bg-slate-900 px-3 text-sm"><option value="qudrat">قدرات</option><option value="tahsili">تحصيلي</option></select></Field><Field label="ترتيب الدرس"><Input required min="0" type="number" value={lessonForm.order} onChange={e => setLessonForm(f => ({ ...f, order: Number(e.target.value) }))} className="border-slate-700 bg-slate-900" /></Field></div><Field label="عنوان الدرس"><Input required value={lessonForm.title} onChange={e => setLessonForm(f => ({ ...f, title: e.target.value }))} className="border-slate-700 bg-slate-900" /></Field><Field label="وصف الدرس"><Textarea required value={lessonForm.description} onChange={e => setLessonForm(f => ({ ...f, description: e.target.value }))} className="border-slate-700 bg-slate-900" /></Field><Field label="رابط الفيديو"><Input required type="url" dir="ltr" value={lessonForm.videoUrl} onChange={e => setLessonForm(f => ({ ...f, videoUrl: e.target.value }))} className="border-slate-700 bg-slate-900" /></Field><div className="grid gap-4 sm:grid-cols-2"><Field label="رابط الصورة المصغرة (اختياري)"><Input type="url" dir="ltr" value={lessonForm.thumbnailUrl} onChange={e => setLessonForm(f => ({ ...f, thumbnailUrl: e.target.value }))} className="border-slate-700 bg-slate-900" /></Field><Field label="مسار الاختبار المرتبط (اختياري)"><Input dir="ltr" placeholder="/quiz/..." value={lessonForm.linkedQuizRoute} onChange={e => setLessonForm(f => ({ ...f, linkedQuizRoute: e.target.value }))} className="border-slate-700 bg-slate-900" /></Field></div><div className="flex items-center justify-between"><Field label="المدة بالدقائق (اختياري)"><Input min="1" type="number" value={lessonForm.durationMinutes ?? ''} onChange={e => setLessonForm(f => ({ ...f, durationMinutes: e.target.value ? Number(e.target.value) : undefined }))} className="w-44 border-slate-700 bg-slate-900" /></Field><label className="mt-6 flex cursor-pointer items-center gap-2 text-sm text-slate-200"><input type="checkbox" checked={lessonForm.published} onChange={e => setLessonForm(f => ({ ...f, published: e.target.checked }))} />نشر الدرس</label></div><div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={() => setLessonDialogOpen(false)}>إلغاء</Button><Button type="submit" disabled={saveLesson.isPending} className="bg-emerald-600 hover:bg-emerald-500">{saveLesson.isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}حفظ الدرس</Button></div></form></DialogContent></Dialog>
      <Dialog open={!!reviewDialog} onOpenChange={open => !open && setReviewDialog(null)}><DialogContent className="bg-slate-950 text-white"><DialogHeader><DialogTitle>الرد على مراجعة الطالب</DialogTitle></DialogHeader><Textarea value={reply} onChange={e => setReply(e.target.value)} placeholder="اكتب رد الإدارة..." className="min-h-28 border-slate-700 bg-slate-900" /><div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setReviewDialog(null)}>إلغاء</Button><Button disabled={!reviewDialog || updateReview.isPending} onClick={() => reviewDialog && updateReview.mutate({ review: reviewDialog, data: { adminReply: reply } })} className="bg-emerald-600 hover:bg-emerald-500">حفظ الرد</Button></div></DialogContent></Dialog>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="grid gap-2 text-sm text-slate-300"><span>{label}</span>{children}</label>; }
function Loading() { return <div className="flex items-center justify-center gap-2 p-10 text-sm text-slate-400"><Loader2 className="h-5 w-5 animate-spin" />جارٍ التحميل...</div>; }
function EmptyState({ label }: { label: string }) { return <div className="p-10 text-center text-sm text-slate-400">{label}</div>; }
function ErrorState({ message, retry }: { message: string; retry: () => void }) { return <div className="p-8 text-center"><p className="text-sm text-red-300">{message}</p><Button variant="outline" size="sm" onClick={retry} className="mt-3 border-slate-700 text-slate-200">إعادة المحاولة</Button></div>; }