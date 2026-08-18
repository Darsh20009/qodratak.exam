import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sparkles, Calendar, Clock, Users, Plus, Edit, Trash2, RefreshCw, Star, Trophy, BookOpen } from 'lucide-react';

function formatDate(d: string | Date) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

interface Props {
  examsData: any[];
  loading: boolean;
  refetch: () => void;
  toast: (opts: any) => void;
  queryClient: any;
}

const EMPTY_FORM = {
  title: '',
  description: '',
  occasion: '',
  examType: 'mixed' as 'verbal' | 'quantitative' | 'mixed',
  timeLimit: 30,
  startDate: '',
  endDate: '',
  bookingDeadline: '',
  allowBooking: true,
  maxParticipants: '',
  prize: '',
  prizeAmount: '',
  isActive: true,
  questions: [] as { text: string; options: string[]; correctAnswer: number; explanation: string }[],
};

const EMPTY_Q = { text: '', options: ['', '', '', ''], correctAnswer: 0, explanation: '' };

export default function AdminSeasonalExamsTab({ examsData = [], loading, refetch, toast, queryClient }: Props) {
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [newQ, setNewQ] = useState({ ...EMPTY_Q });
  const [importText, setImportText] = useState('');

  const openCreate = () => { setEditing(null); setForm({ ...EMPTY_FORM }); setNewQ({ ...EMPTY_Q }); setShowDialog(true); };
  const openEdit = (exam: any) => {
    setEditing(exam);
    setForm({
      title: exam.title || '',
      description: exam.description || '',
      occasion: exam.occasion || '',
      examType: exam.examType || 'mixed',
      timeLimit: exam.timeLimit || 30,
      startDate: exam.startDate ? new Date(exam.startDate).toISOString().slice(0, 16) : '',
      endDate: exam.endDate ? new Date(exam.endDate).toISOString().slice(0, 16) : '',
      bookingDeadline: exam.bookingDeadline ? new Date(exam.bookingDeadline).toISOString().slice(0, 16) : '',
      allowBooking: exam.allowBooking !== false,
      maxParticipants: exam.maxParticipants || '',
      prize: exam.prize || '',
      prizeAmount: exam.prizeAmount || '',
      isActive: exam.isActive !== false,
      questions: exam.questions || [],
    });
    setShowDialog(true);
  };

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/admin/seasonal-exams', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data), credentials: 'include' });
      return res.json();
    },
    onSuccess: (d) => {
      if (d.success) { toast({ title: '✅ تم إنشاء الاختبار الموسمي' }); refetch(); setShowDialog(false); }
      else toast({ title: 'خطأ', description: d.error, variant: 'destructive' });
    },
    onError: () => toast({ title: 'فشل في الإنشاء', variant: 'destructive' }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await fetch(`/api/admin/seasonal-exams/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data), credentials: 'include' });
      return res.json();
    },
    onSuccess: (d) => {
      if (d.success) { toast({ title: '✅ تم تحديث الاختبار' }); refetch(); setShowDialog(false); }
      else toast({ title: 'خطأ', description: d.error, variant: 'destructive' });
    },
    onError: () => toast({ title: 'فشل في التحديث', variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/seasonal-exams/${id}`, { method: 'DELETE', credentials: 'include' });
      return res.json();
    },
    onSuccess: () => { toast({ title: '✅ تم حذف الاختبار' }); refetch(); },
    onError: () => toast({ title: 'فشل الحذف', variant: 'destructive' }),
  });

  const addQuestion = () => {
    if (!newQ.text.trim()) return;
    setForm(f => ({ ...f, questions: [...f.questions, { ...newQ }] }));
    setNewQ({ ...EMPTY_Q });
  };

  const removeQuestion = (idx: number) => {
    setForm(f => ({ ...f, questions: f.questions.filter((_: any, i: number) => i !== idx) }));
  };

  const handleImport = () => {
    try {
      // Try JSON format: [{ text, options: [], correctAnswer, explanation }]
      const parsed = JSON.parse(importText);
      if (Array.isArray(parsed)) {
        const qs = parsed.map((q: any) => ({
          text: q.text || q.question || '',
          options: Array.isArray(q.options) ? q.options : ['', '', '', ''],
          correctAnswer: typeof q.correctAnswer === 'number' ? q.correctAnswer : 0,
          explanation: q.explanation || '',
        })).filter((q: any) => q.text);
        setForm(f => ({ ...f, questions: [...f.questions, ...qs] }));
        toast({ title: `✅ تم استيراد ${qs.length} سؤال` });
        setImportText('');
      }
    } catch {
      toast({ title: 'خطأ في الاستيراد', description: 'يجب أن يكون الملف بصيغة JSON صحيحة', variant: 'destructive' });
    }
  };

  const handleSave = () => {
    if (!form.title || !form.occasion || !form.startDate || !form.endDate) {
      toast({ title: 'يجب ملء الحقول المطلوبة', variant: 'destructive' });
      return;
    }
    const data = {
      ...form,
      timeLimit: Number(form.timeLimit),
      maxParticipants: form.maxParticipants ? Number(form.maxParticipants) : undefined,
      prizeAmount: form.prizeAmount ? Number(form.prizeAmount) : undefined,
    };
    if (editing) updateMutation.mutate({ id: editing._id, data });
    else createMutation.mutate(data);
  };

  const statusBadge = (exam: any) => {
    const now = new Date();
    if (!exam.isActive) return <Badge className="bg-gray-500/20 text-gray-400 border-0">موقوف</Badge>;
    if (new Date(exam.endDate) < now) return <Badge className="bg-red-500/20 text-red-400 border-0">انتهى</Badge>;
    if (new Date(exam.startDate) <= now) return <Badge className="bg-emerald-500/20 text-emerald-400 border-0">جارٍ</Badge>;
    return <Badge className="bg-blue-500/20 text-blue-400 border-0">قادم</Badge>;
  };

  return (
    <div className="space-y-5" dir="rtl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-white text-xl font-bold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" /> الاختبارات الموسمية
          </h2>
          <p className="text-slate-400 text-sm mt-1">اختبارات خاصة بمناسبات وأحداث محددة مع نظام حجز مسبق</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800 gap-1" onClick={refetch}>
            <RefreshCw className="w-3.5 h-3.5" /> تحديث
          </Button>
          <Button size="sm" className="bg-amber-600 hover:bg-amber-700 gap-1" onClick={openCreate}>
            <Plus className="w-3.5 h-3.5" /> اختبار موسمي جديد
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-400">جارٍ التحميل...</div>
      ) : (examsData || []).length === 0 ? (
        <div className="text-center py-16">
          <Sparkles className="w-12 h-12 mx-auto mb-3 text-slate-600" />
          <p className="text-slate-400">لا توجد اختبارات موسمية</p>
          <Button className="mt-4 bg-amber-600 hover:bg-amber-700 gap-1" onClick={openCreate}>
            <Plus className="w-4 h-4" /> أضف أول اختبار موسمي
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {(examsData || []).map((exam: any) => (
            <Card key={exam._id} className="bg-slate-800/50 border-slate-700 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400 text-xl">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-white font-bold">{exam.title}</p>
                    {statusBadge(exam)}
                    <Badge className="bg-green-500/20 text-green-300 border-0 text-xs">{exam.occasion}</Badge>
                  </div>
                  <div className="flex gap-4 mt-2 flex-wrap">
                    <span className="text-slate-400 text-xs flex items-center gap-1"><Calendar className="w-3 h-3" /> {formatDate(exam.startDate)}</span>
                    <span className="text-slate-400 text-xs flex items-center gap-1"><Clock className="w-3 h-3" /> {exam.timeLimit} دقيقة</span>
                    <span className="text-slate-400 text-xs flex items-center gap-1"><BookOpen className="w-3 h-3" /> {exam.questionCount} سؤال</span>
                    <span className="text-slate-400 text-xs flex items-center gap-1"><Users className="w-3 h-3" /> {exam.bookingCount || 0} محجوز</span>
                    {exam.prizeAmount && <span className="text-amber-400 text-xs flex items-center gap-1"><Trophy className="w-3 h-3" /> {exam.prizeAmount} ر.س</span>}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700" onClick={() => openEdit(exam)}>
                    <Edit className="w-3.5 h-3.5" />
                  </Button>
                  <Button size="sm" variant="outline" className="border-red-800/50 text-red-400 hover:bg-red-900/20" onClick={() => { if (confirm('هل أنت متأكد من الحذف؟')) deleteMutation.mutate(exam._id); }}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              {editing ? 'تعديل اختبار موسمي' : 'اختبار موسمي جديد'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">

            {/* Basic info */}
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <p className="text-slate-400 text-xs mb-1">عنوان الاختبار *</p>
                <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="bg-slate-800 border-slate-700 text-white" placeholder="مثال: اختبار اليوم الوطني" />
              </div>
              <div className="col-span-2">
                <p className="text-slate-400 text-xs mb-1">المناسبة *</p>
                <Input value={form.occasion} onChange={e => setForm(f => ({ ...f, occasion: e.target.value }))} className="bg-slate-800 border-slate-700 text-white" placeholder="مثال: اليوم الوطني السعودي" />
              </div>
              <div className="col-span-2">
                <p className="text-slate-400 text-xs mb-1">الوصف</p>
                <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="bg-slate-800 border-slate-700 text-white resize-none" rows={2} placeholder="وصف مختصر..." />
              </div>
              <div>
                <p className="text-slate-400 text-xs mb-1">نوع الاختبار</p>
                <select value={form.examType} onChange={e => setForm(f => ({ ...f, examType: e.target.value as any }))} className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm">
                  <option value="mixed">مختلط</option>
                  <option value="verbal">لفظي</option>
                  <option value="quantitative">كمي</option>
                </select>
              </div>
              <div>
                <p className="text-slate-400 text-xs mb-1">مدة الاختبار (دقيقة)</p>
                <Input type="number" value={form.timeLimit} onChange={e => setForm(f => ({ ...f, timeLimit: Number(e.target.value) }))} className="bg-slate-800 border-slate-700 text-white" min="5" />
              </div>
              <div>
                <p className="text-slate-400 text-xs mb-1">تاريخ البدء *</p>
                <Input type="datetime-local" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} className="bg-slate-800 border-slate-700 text-white" />
              </div>
              <div>
                <p className="text-slate-400 text-xs mb-1">تاريخ الانتهاء *</p>
                <Input type="datetime-local" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} className="bg-slate-800 border-slate-700 text-white" />
              </div>
              <div>
                <p className="text-slate-400 text-xs mb-1">آخر موعد للحجز</p>
                <Input type="datetime-local" value={form.bookingDeadline} onChange={e => setForm(f => ({ ...f, bookingDeadline: e.target.value }))} className="bg-slate-800 border-slate-700 text-white" />
              </div>
              <div>
                <p className="text-slate-400 text-xs mb-1">الحد الأقصى للمشاركين</p>
                <Input type="number" value={form.maxParticipants} onChange={e => setForm(f => ({ ...f, maxParticipants: e.target.value }))} className="bg-slate-800 border-slate-700 text-white" placeholder="بلا حد" />
              </div>
              <div>
                <p className="text-slate-400 text-xs mb-1">الجائزة (وصف)</p>
                <Input value={form.prize} onChange={e => setForm(f => ({ ...f, prize: e.target.value }))} className="bg-slate-800 border-slate-700 text-white" placeholder="مثال: شهادة تميز" />
              </div>
              <div>
                <p className="text-slate-400 text-xs mb-1">قيمة الجائزة (ر.س)</p>
                <Input type="number" value={form.prizeAmount} onChange={e => setForm(f => ({ ...f, prizeAmount: e.target.value }))} className="bg-slate-800 border-slate-700 text-white" placeholder="0" />
              </div>
            </div>

            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.allowBooking} onChange={e => setForm(f => ({ ...f, allowBooking: e.target.checked }))} className="w-4 h-4 rounded" />
                <span className="text-slate-300 text-sm">السماح بالحجز المسبق</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} className="w-4 h-4 rounded" />
                <span className="text-slate-300 text-sm">نشط وظاهر للطلاب</span>
              </label>
            </div>

            {/* Questions section */}
            <div className="border-t border-slate-700 pt-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-white font-bold text-sm">الأسئلة ({form.questions.length})</p>
              </div>

              {/* Import */}
              <div className="bg-slate-800 rounded-xl p-3 mb-3">
                <p className="text-slate-400 text-xs mb-2">استيراد أسئلة من JSON:</p>
                <Textarea
                  value={importText}
                  onChange={e => setImportText(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white resize-none text-xs"
                  rows={3}
                  placeholder='[{"text":"السؤال","options":["أ","ب","ج","د"],"correctAnswer":0,"explanation":"..."}]'
                />
                <Button size="sm" className="mt-2 bg-blue-700 hover:bg-blue-800" onClick={handleImport} disabled={!importText.trim()}>
                  استيراد
                </Button>
              </div>

              {/* Add question */}
              <div className="bg-slate-800 rounded-xl p-3 space-y-2 mb-3">
                <p className="text-slate-400 text-xs font-medium">إضافة سؤال يدويًا:</p>
                <Textarea value={newQ.text} onChange={e => setNewQ(q => ({ ...q, text: e.target.value }))} className="bg-slate-700 border-slate-600 text-white resize-none text-sm" rows={2} placeholder="نص السؤال..." />
                <div className="grid grid-cols-2 gap-2">
                  {newQ.options.map((opt, i) => (
                    <Input key={i} value={opt} onChange={e => setNewQ(q => { const opts = [...q.options]; opts[i] = e.target.value; return { ...q, options: opts }; })} className="bg-slate-700 border-slate-600 text-white text-sm" placeholder={`الخيار ${String.fromCharCode(0x0623 + i)}`} />
                  ))}
                </div>
                <div className="flex gap-2 items-center">
                  <p className="text-slate-400 text-xs">الإجابة الصحيحة:</p>
                  <select value={newQ.correctAnswer} onChange={e => setNewQ(q => ({ ...q, correctAnswer: Number(e.target.value) }))} className="px-2 py-1 rounded bg-slate-700 border border-slate-600 text-white text-xs">
                    {newQ.options.map((_, i) => <option key={i} value={i}>{i + 1}</option>)}
                  </select>
                </div>
                <Input value={newQ.explanation} onChange={e => setNewQ(q => ({ ...q, explanation: e.target.value }))} className="bg-slate-700 border-slate-600 text-white text-sm" placeholder="شرح الإجابة (اختياري)" />
                <Button size="sm" className="bg-emerald-700 hover:bg-emerald-800 gap-1 w-full" onClick={addQuestion} disabled={!newQ.text.trim()}>
                  <Plus className="w-3.5 h-3.5" /> إضافة السؤال
                </Button>
              </div>

              {/* Question list */}
              {form.questions.length > 0 && (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {form.questions.map((q: any, i: number) => (
                    <div key={i} className="bg-slate-800 rounded-lg px-3 py-2 flex items-center gap-2">
                      <span className="text-slate-500 text-xs font-mono w-5">{i + 1}</span>
                      <p className="text-white text-sm flex-1 line-clamp-1">{q.text}</p>
                      <Button size="sm" variant="ghost" className="text-red-400 hover:bg-red-900/20 h-6 w-6 p-0" onClick={() => removeQuestion(i)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-1 sticky bottom-0 bg-slate-900 pb-1">
              <Button
                className="flex-1 bg-amber-600 hover:bg-amber-700"
                disabled={createMutation.isPending || updateMutation.isPending}
                onClick={handleSave}
              >
                {(createMutation.isPending || updateMutation.isPending) ? 'جارٍ الحفظ...' : editing ? 'حفظ التعديلات' : 'إنشاء الاختبار'}
              </Button>
              <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800" onClick={() => setShowDialog(false)}>إلغاء</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
