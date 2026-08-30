import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { apiRequest } from '@/lib/queryClient';
import {
  Search, Plus, Edit2, Trash2, Image, Upload, X, ChevronLeft, ChevronRight,
  BookOpen, Filter, RefreshCw, AlertCircle, CheckCircle
} from 'lucide-react';

interface Question {
  _id: string;
  questionId: number;
  text: string;
  category: 'verbal' | 'quantitative' | 'general';
  subcategory: string;
  options: string[];
  correctOptionIndex: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  explanation?: string;
  imageUrl?: string;
  imageOriginalUrl?: string;
  imageProcessing?: {
    status: 'processed' | 'original_only';
    backgroundRemoved: boolean;
    watermarkCleanupApplied: boolean;
    note?: string;
  };
}

const categoryLabels: Record<string, string> = {
  verbal: 'لفظي',
  quantitative: 'كمي',
  general: 'عام',
};

const difficultyLabels: Record<string, string> = {
  beginner: 'مبتدئ',
  intermediate: 'متوسط',
  advanced: 'متقدم',
};

const difficultyColors: Record<string, string> = {
  beginner: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  intermediate: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  advanced: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
};

const arabicLetters = ['أ', 'ب', 'ج', 'د'];

const emptyQuestion = {
  text: '',
  category: 'verbal' as string,
  subcategory: '',
  options: ['أ - ', 'ب - ', 'ج - ', 'د - '],
  correctOptionIndex: 0,
  difficulty: 'intermediate' as string,
  explanation: '',
  imageUrl: '',
  imageOriginalUrl: '',
  imageProcessing: undefined as Question['imageProcessing'],
};

export default function QuestionsManagementPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const standaloneImageRef = useRef<HTMLInputElement>(null);

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(50);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterDifficulty, setFilterDifficulty] = useState('all');
  const [showDialog, setShowDialog] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [form, setForm] = useState({ ...emptyQuestion });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleteCategoryConfirm, setDeleteCategoryConfirm] = useState<string | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['/api/admin/questions', page, perPage, search, filterCategory, filterDifficulty],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(perPage),
        ...(search && { search }),
        ...(filterCategory !== 'all' && { category: filterCategory }),
        ...(filterDifficulty !== 'all' && { difficulty: filterDifficulty }),
      });
      const res = await fetch(`/api/admin/questions?${params}`, { credentials: 'include' });
      return res.json();
    },
    refetchOnWindowFocus: false,
  });

  const seedMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/admin/questions/seed-from-json'),
    onSuccess: async (res: any) => {
      const data = await res.json();
      toast({ title: '✅ تم', description: data.message || 'تم رفع الأسئلة بنجاح' });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/questions'] });
    },
    onError: () => toast({ title: 'خطأ', description: 'فشل في رفع الأسئلة', variant: 'destructive' }),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/admin/questions', data),
    onSuccess: () => {
      toast({ title: '✅ تم إنشاء السؤال بنجاح' });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/questions'] });
      setShowDialog(false);
      setForm({ ...emptyQuestion });
    },
    onError: () => toast({ title: 'خطأ', description: 'فشل في إنشاء السؤال', variant: 'destructive' }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiRequest('PUT', `/api/admin/questions/${id}`, data),
    onSuccess: () => {
      toast({ title: '✅ تم تحديث السؤال' });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/questions'] });
      setShowDialog(false);
      setEditingQuestion(null);
    },
    onError: () => toast({ title: 'خطأ', description: 'فشل في تحديث السؤال', variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest('DELETE', `/api/admin/questions/${id}`),
    onSuccess: () => {
      toast({ title: '✅ تم حذف السؤال' });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/questions'] });
      setDeleteConfirm(null);
    },
    onError: () => toast({ title: 'خطأ', description: 'فشل في حذف السؤال', variant: 'destructive' }),
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (category: string) => apiRequest('DELETE', `/api/admin/questions/category/${category}/all`),
    onSuccess: async (res: any) => {
      const data = await res.json();
      toast({ title: '✅ ' + (data.message || 'تم الحذف بنجاح') });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/questions'] });
      setDeleteCategoryConfirm(null);
    },
    onError: () => toast({ title: 'خطأ', description: 'فشل في حذف الأسئلة', variant: 'destructive' }),
  });

  const handleOpenCreate = () => {
    setEditingQuestion(null);
    setForm({ ...emptyQuestion });
    setShowDialog(true);
  };

  const handleOpenEdit = (q: Question) => {
    setEditingQuestion(q);
    setForm({
      text: q.text,
      category: q.category,
      subcategory: q.subcategory,
      options: [...q.options],
      correctOptionIndex: q.correctOptionIndex,
      difficulty: q.difficulty,
      explanation: q.explanation || '',
      imageUrl: q.imageUrl || '',
      imageOriginalUrl: q.imageOriginalUrl || '',
      imageProcessing: q.imageProcessing,
    });
    setShowDialog(true);
  };

  const handleSubmit = () => {
    if (!form.text.trim()) return toast({ title: 'خطأ', description: 'نص السؤال مطلوب', variant: 'destructive' });
    if (form.options.some(o => !o.trim())) return toast({ title: 'خطأ', description: 'جميع الخيارات مطلوبة', variant: 'destructive' });

    const payload = {
      text: form.text,
      category: form.category,
      subcategory: form.subcategory || 'عام',
      options: form.options,
      correctOptionIndex: form.correctOptionIndex,
      difficulty: form.difficulty,
      explanation: form.explanation,
      imageUrl: form.imageUrl,
      imageOriginalUrl: form.imageOriginalUrl,
      imageProcessing: form.imageProcessing,
    };

    if (editingQuestion) {
      updateMutation.mutate({ id: editingQuestion._id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleImageUpload = async (file: File, questionId?: string) => {
    setUploadingImage(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const endpoint = questionId
        ? `/api/admin/questions/${questionId}/image`
        : '/api/admin/questions/upload-image-standalone';

      const res = await fetch(endpoint, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: 'خطأ', description: data.error || 'فشل في رفع الصورة', variant: 'destructive' });
        return;
      }
      if (data.imageUrl) {
        setForm(f => ({
          ...f,
          imageUrl: data.imageUrl,
          imageOriginalUrl: data.originalUrl || f.imageOriginalUrl,
          imageProcessing: data.processing,
        }));
        if (questionId) {
          queryClient.invalidateQueries({ queryKey: ['/api/admin/questions'] });
        }
        toast({
          title: 'تمت معالجة صورة السؤال',
          description: data.processing?.status === 'original_only'
            ? data.processing.note
            : 'حُفظ الأصل، وتم إعداد نسخة بخلفية شفافة وتنظيف العلامات الخفيفة.',
        });
      }
    } catch {
      toast({ title: 'خطأ', description: 'فشل في رفع الصورة', variant: 'destructive' });
    } finally {
      setUploadingImage(false);
    }
  };

  const questions: Question[] = data?.questions || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 1;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6" dir="rtl">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-teal-600 rounded-xl flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">إدارة الأسئلة</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {total > 0 ? (
                <>إجمالي: <span className="font-semibold text-teal-600 dark:text-teal-400">{total.toLocaleString('ar')}</span> سؤال في المكتبة</>
              ) : (
                'جارٍ تحميل الأسئلة...'
              )}
            </p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            onClick={() => seedMutation.mutate()}
            disabled={seedMutation.isPending}
            className="gap-2"
            data-testid="button-seed-questions"
          >
            <Upload className="w-4 h-4" />
            {seedMutation.isPending ? 'جارٍ الرفع...' : 'رفع الأسئلة من الملف'}
          </Button>
          <Button
            variant="outline"
            onClick={() => setDeleteCategoryConfirm('quantitative')}
            className="gap-2 border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
            data-testid="button-delete-quantitative"
          >
            <Trash2 className="w-4 h-4" />
            حذف كل أسئلة الكمي
          </Button>
          <Button
            variant="outline"
            onClick={() => setDeleteCategoryConfirm('verbal')}
            className="gap-2 border-orange-300 text-orange-600 hover:bg-orange-50 dark:border-orange-700 dark:text-orange-400 dark:hover:bg-orange-900/20"
            data-testid="button-delete-verbal"
          >
            <Trash2 className="w-4 h-4" />
            حذف كل أسئلة اللفظي
          </Button>
          <Button onClick={handleOpenCreate} className="gap-2 bg-teal-600 hover:bg-teal-700" data-testid="button-create-question">
            <Plus className="w-4 h-4" />
            سؤال جديد
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 mb-4 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="ابحث في الأسئلة..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="pr-9"
              data-testid="input-search-questions"
            />
          </div>
          <Select value={filterCategory} onValueChange={v => { setFilterCategory(v); setPage(1); }}>
            <SelectTrigger className="w-36" data-testid="select-filter-category">
              <SelectValue placeholder="التصنيف" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع التصنيفات</SelectItem>
              <SelectItem value="verbal">لفظي</SelectItem>
              <SelectItem value="quantitative">كمي</SelectItem>
              <SelectItem value="general">عام</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterDifficulty} onValueChange={v => { setFilterDifficulty(v); setPage(1); }}>
            <SelectTrigger className="w-36" data-testid="select-filter-difficulty">
              <SelectValue placeholder="المستوى" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع المستويات</SelectItem>
              <SelectItem value="beginner">مبتدئ</SelectItem>
              <SelectItem value="intermediate">متوسط</SelectItem>
              <SelectItem value="advanced">متقدم</SelectItem>
            </SelectContent>
          </Select>
          <Select value={String(perPage)} onValueChange={v => { setPerPage(Number(v)); setPage(1); }}>
            <SelectTrigger className="w-28" data-testid="select-per-page">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="25">25 سؤال</SelectItem>
              <SelectItem value="50">50 سؤال</SelectItem>
              <SelectItem value="100">100 سؤال</SelectItem>
              <SelectItem value="200">200 سؤال</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="ghost" size="icon" onClick={() => refetch()} data-testid="button-refresh">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Questions Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-500">جارٍ التحميل...</p>
          </div>
        ) : questions.length === 0 ? (
          <div className="p-12 text-center">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">{search || filterCategory !== 'all' || filterDifficulty !== 'all' ? 'لا توجد نتائج مطابقة لبحثك' : 'جارٍ تحميل الأسئلة...'}</p>
            <p className="text-sm text-gray-400 mt-1">
              {search || filterCategory !== 'all' || filterDifficulty !== 'all'
                ? 'جرّب تعديل معايير البحث أو التصفية'
                : 'يتم تحميل الأسئلة تلقائياً — حاول الضغط على زر التحديث'}
            </p>
            {!(search || filterCategory !== 'all' || filterDifficulty !== 'all') && (
              <Button variant="outline" className="mt-4 gap-2" onClick={() => refetch()}>
                <RefreshCw className="w-4 h-4" />
                تحديث
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
                  <th className="text-right p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">#</th>
                  <th className="text-right p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">السؤال</th>
                  <th className="text-right p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">التصنيف</th>
                  <th className="text-right p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">المستوى</th>
                  <th className="text-right p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">صورة</th>
                  <th className="text-right p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                {questions.map((q) => (
                  <tr key={q._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors" data-testid={`row-question-${q._id}`}>
                    <td className="p-4 text-sm text-gray-500 font-mono">{q.questionId}</td>
                    <td className="p-4 max-w-xs">
                      <p className="text-sm text-gray-900 dark:text-gray-100 line-clamp-2">{q.text}</p>
                      <p className="text-xs text-gray-400 mt-1">{q.subcategory}</p>
                    </td>
                    <td className="p-4">
                      <Badge variant="outline" className="text-xs">
                        {categoryLabels[q.category] || q.category}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${difficultyColors[q.difficulty]}`}>
                        {difficultyLabels[q.difficulty]}
                      </span>
                    </td>
                    <td className="p-4">
                      {q.imageUrl ? (
                        <img src={q.imageUrl} alt="سؤال" className="w-10 h-10 rounded-lg object-cover border" />
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEdit(q)}
                          className="h-8 w-8 hover:bg-teal-50 hover:text-teal-600"
                          data-testid={`button-edit-question-${q._id}`}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteConfirm(q._id)}
                          className="h-8 w-8 hover:bg-red-50 hover:text-red-600"
                          data-testid={`button-delete-question-${q._id}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {total > 0 && (
          <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between flex-wrap gap-3">
            <span className="text-sm text-gray-500">
              يُعرض {((page - 1) * perPage) + 1}–{Math.min(page * perPage, total)} من أصل {total.toLocaleString('ar')} سؤال · صفحة {page} من {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" onClick={() => setPage(1)} disabled={page === 1} data-testid="button-first-page" title="الصفحة الأولى">
                <ChevronRight className="w-4 h-4" /><ChevronRight className="w-4 h-4 -mr-2" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} data-testid="button-prev-page">
                <ChevronRight className="w-4 h-4" />
                السابق
              </Button>
              <span className="px-3 py-1 text-sm font-medium bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 rounded-md">
                {page}
              </span>
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} data-testid="button-next-page">
                التالي
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPage(totalPages)} disabled={page === totalPages} data-testid="button-last-page" title="الصفحة الأخيرة">
                <ChevronLeft className="w-4 h-4" /><ChevronLeft className="w-4 h-4 -ml-2" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editingQuestion ? 'تعديل السؤال' : 'إنشاء سؤال جديد'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Question Text */}
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5">نص السؤال *</label>
              <Textarea
                value={form.text}
                onChange={e => setForm(f => ({ ...f, text: e.target.value }))}
                placeholder="اكتب نص السؤال هنا..."
                rows={3}
                className="resize-none"
                data-testid="input-question-text"
              />
            </div>

            {/* Image Upload */}
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5">صورة للسؤال (اختياري)</label>
              {form.imageUrl ? (
                <div className="relative inline-block">
                  <img src={form.imageUrl} alt="صورة السؤال" className="w-full max-w-sm rounded-xl border object-contain max-h-40" />
                   {form.imageProcessing && (
                     <p className="mt-2 max-w-sm text-xs text-gray-500">
                       {form.imageProcessing.status === 'processed'
                         ? `تمت المعالجة: ${form.imageProcessing.backgroundRemoved ? 'أزيلت الخلفية' : 'لا توجد خلفية بسيطة للإزالة'}${form.imageProcessing.watermarkCleanupApplied ? '، ونُظّفت العلامات الفاتحة.' : '.'}`
                         : form.imageProcessing.note}
                     </p>
                   )}
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 left-2 h-7 w-7"
                    onClick={() => setForm(f => ({ ...f, imageUrl: '', imageOriginalUrl: '', imageProcessing: undefined }))}
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ) : (
                <div
                  className="border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-xl p-6 text-center cursor-pointer hover:border-teal-400 hover:bg-teal-50/50 dark:hover:bg-teal-900/20 transition-colors"
                  onClick={() => standaloneImageRef.current?.click()}
                >
                  <Image className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">{uploadingImage ? 'جارٍ الرفع...' : 'اضغط لرفع صورة'}</p>
                  <p className="text-xs text-gray-400">PNG, JPG, WebP حتى 5MB</p>
                </div>
              )}
              <input
                ref={standaloneImageRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0], editingQuestion?._id)}
              />
            </div>

            {/* Category & Difficulty */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5">التصنيف</label>
                <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v as any }))}>
                  <SelectTrigger data-testid="select-question-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="verbal">لفظي</SelectItem>
                    <SelectItem value="quantitative">كمي</SelectItem>
                    <SelectItem value="general">عام</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5">المستوى</label>
                <Select value={form.difficulty} onValueChange={v => setForm(f => ({ ...f, difficulty: v as any }))}>
                  <SelectTrigger data-testid="select-question-difficulty">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">مبتدئ</SelectItem>
                    <SelectItem value="intermediate">متوسط</SelectItem>
                    <SelectItem value="advanced">متقدم</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5">الفئة الفرعية</label>
                <Input
                  value={form.subcategory}
                  onChange={e => setForm(f => ({ ...f, subcategory: e.target.value }))}
                  placeholder="مثال: التناظر اللفظي"
                  data-testid="input-question-subcategory"
                />
              </div>
            </div>

            {/* Options */}
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">الخيارات * (اضغط على الدائرة لتحديد الإجابة الصحيحة)</label>
              <div className="space-y-2">
                {form.options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setForm(f => ({ ...f, correctOptionIndex: i }))}
                      className={`w-8 h-8 rounded-full border-2 flex-shrink-0 flex items-center justify-center text-sm font-bold transition-all ${
                        form.correctOptionIndex === i
                          ? 'bg-teal-600 border-teal-600 text-white'
                          : 'border-gray-300 text-gray-500 hover:border-teal-400'
                      }`}
                      data-testid={`button-correct-option-${i}`}
                    >
                      {form.correctOptionIndex === i ? '✓' : arabicLetters[i]}
                    </button>
                    <Input
                      value={opt}
                      onChange={e => {
                        const opts = [...form.options];
                        opts[i] = e.target.value;
                        setForm(f => ({ ...f, options: opts }));
                      }}
                      placeholder={`${arabicLetters[i]} - اكتب الخيار هنا`}
                      className={form.correctOptionIndex === i ? 'border-teal-400 bg-teal-50/50 dark:bg-teal-900/20' : ''}
                      data-testid={`input-option-${i}`}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Explanation */}
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5">الشرح (اختياري)</label>
              <Textarea
                value={form.explanation}
                onChange={e => setForm(f => ({ ...f, explanation: e.target.value }))}
                placeholder="اكتب شرحاً للإجابة الصحيحة..."
                rows={2}
                className="resize-none"
                data-testid="input-question-explanation"
              />
            </div>
          </div>

          <DialogFooter className="flex gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowDialog(false)} data-testid="button-cancel-question">
              إلغاء
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
              className="bg-teal-600 hover:bg-teal-700 min-w-[120px]"
              data-testid="button-save-question"
            >
              {createMutation.isPending || updateMutation.isPending ? 'جارٍ الحفظ...' : editingQuestion ? 'حفظ التعديلات' : 'إنشاء السؤال'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Single Question Confirm */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent dir="rtl" className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              تأكيد الحذف
            </DialogTitle>
          </DialogHeader>
          <p className="text-gray-600 dark:text-gray-300 text-sm">هل أنت متأكد من حذف هذا السؤال؟ لا يمكن التراجع عن هذه العملية.</p>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)} data-testid="button-cancel-delete">إلغاء</Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirm && deleteMutation.mutate(deleteConfirm)}
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? 'جارٍ الحذف...' : 'حذف'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete All Category Questions Confirm */}
      <Dialog open={!!deleteCategoryConfirm} onOpenChange={() => setDeleteCategoryConfirm(null)}>
        <DialogContent dir="rtl" className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              تحذير: حذف جميع أسئلة {deleteCategoryConfirm === 'quantitative' ? 'الكمي' : 'اللفظي'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
              <p className="text-red-700 dark:text-red-400 text-sm font-medium">
                ⚠️ ستُحذف جميع أسئلة {deleteCategoryConfirm === 'quantitative' ? 'الكمي' : 'اللفظي'} من قاعدة البيانات نهائياً
              </p>
              <p className="text-red-600 dark:text-red-500 text-xs mt-1">لا يمكن التراجع عن هذه العملية</p>
            </div>
            <p className="text-gray-600 dark:text-gray-300 text-sm">هل أنت متأكد تماماً؟ اكتب "تأكيد" للمتابعة:</p>
            <input
              id="delete-category-confirm-input"
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              placeholder="اكتب: تأكيد"
              data-testid="input-delete-category-confirm"
            />
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setDeleteCategoryConfirm(null)}>إلغاء</Button>
            <Button
              variant="destructive"
              onClick={() => {
                const input = (document.getElementById('delete-category-confirm-input') as HTMLInputElement)?.value;
                if (input !== 'تأكيد') {
                  toast({ title: 'الرجاء كتابة "تأكيد" للمتابعة', variant: 'destructive' });
                  return;
                }
                deleteCategoryConfirm && deleteCategoryMutation.mutate(deleteCategoryConfirm);
              }}
              disabled={deleteCategoryMutation.isPending}
              data-testid="button-confirm-delete-category"
            >
              {deleteCategoryMutation.isPending ? 'جارٍ الحذف...' : 'حذف الكل'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
