import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { SEO } from "@/components/SEO";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Users, BookOpen, Plus, MoreVertical, Trash, Edit,
  LayoutDashboard, AlertCircle, LogOut, ArrowRight, BarChart3, Download, TrendingUp, Target
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

// ─── Types ───────────────────────────────────────────────────────────

export interface TeacherDashboard {
  teacher: { id: string; name: string; email: string };
  stats: { classes: number; students: number; activeStudents: number; needsAttention: number };
  classes: TeacherClass[];
}

export interface TeacherClass {
  id: string;
  name: string;
  subject: string;
  program: 'qudrat' | 'tahsili' | 'general';
  gradeLevel?: string;
  description?: string;
  studentCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface TeacherStudent {
  id: string;
  fullName: string;
  username: string;
  email?: string;
  phone?: string;
  level: number;
  totalTestsTaken: number;
  lastVisit?: string;
  joinedAt: string;
}

interface TeacherReport {
  class: TeacherClass;
  filters: { period: string; program: string; exam: string; availableExams: { value: string; name: string }[] };
  summary: {
    studentCount: number; studentsWithActivity: number; completedTests: number;
    averageScore: number; completionRate: number;
    trend: { date: string; averageScore: number; tests: number }[];
  };
  students: {
    id: string; fullName: string; username: string; level: number; averageScore: number;
    completedTests: number; completionRate: number; lastActivity?: string;
    strengths: { name: string; count: number }[]; weaknesses: { name: string; count: number }[];
    tests: { id: string; name: string; type: string; score: number; correctAnswers: number; totalQuestions: number; completedAt: string }[];
  }[];
  generatedAt: string;
}

// ─── API Client ──────────────────────────────────────────────────────

async function fetcher(url: string, options?: RequestInit) {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    credentials: 'include',
  });
  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      throw new Error('UNAUTHORIZED');
    }
    let msg = 'حدث خطأ في النظام';
    try {
      const data = await res.json();
      if (data.error || data.message) msg = data.error || data.message;
    } catch (e) {}
    throw new Error(msg);
  }
  if (res.status === 204) return null;
  return res.json();
}

// ─── Hooks ───────────────────────────────────────────────────────────

function useTeacherDashboard() {
  return useQuery<TeacherDashboard, Error>({
    queryKey: ['teacher', 'dashboard'],
    queryFn: () => fetcher('/api/teacher/dashboard'),
    retry: (failureCount, error) => error.message !== 'UNAUTHORIZED' && failureCount < 2,
  });
}

function useClassStudents(classId: string) {
  return useQuery<{ class: TeacherClass, students: TeacherStudent[] }, Error>({
    queryKey: ['teacher', 'classes', classId, 'students'],
    queryFn: () => fetcher(`/api/teacher/classes/${classId}/students`),
    enabled: !!classId,
  });
}

function useClassReport(classId: string, period: string, program: string, exam: string) {
  const query = new URLSearchParams({ period, program, exam });
  return useQuery<TeacherReport, Error>({
    queryKey: ['teacher', 'classes', classId, 'report', period, program, exam],
    queryFn: () => fetcher(`/api/teacher/classes/${classId}/report?${query}`),
    enabled: !!classId,
  });
}

function useCreateClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<TeacherClass>) => fetcher('/api/teacher/classes', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher', 'dashboard'] });
    }
  });
}

function useUpdateClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string, data: Partial<TeacherClass> }) => fetcher(`/api/teacher/classes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['teacher', 'dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['teacher', 'classes', variables.id, 'students'] });
    }
  });
}

function useDeleteClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fetcher(`/api/teacher/classes/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher', 'dashboard'] });
    }
  });
}

function useAddStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ classId, identifier }: { classId: string, identifier: string }) =>
      fetcher(`/api/teacher/classes/${classId}/students`, {
        method: 'POST',
        body: JSON.stringify({ identifier })
      }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['teacher', 'classes', variables.classId, 'students'] });
      queryClient.invalidateQueries({ queryKey: ['teacher', 'dashboard'] });
    }
  });
}

function useRemoveStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ classId, studentId }: { classId: string, studentId: string }) =>
      fetcher(`/api/teacher/classes/${classId}/students/${studentId}`, { method: 'DELETE' }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['teacher', 'classes', variables.classId, 'students'] });
      queryClient.invalidateQueries({ queryKey: ['teacher', 'dashboard'] });
    }
  });
}

// ─── Components ──────────────────────────────────────────────────────

function ProgramBadge({ program }: { program: string }) {
  if (program === 'qudrat') return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 border-none">قدرات</Badge>;
  if (program === 'tahsili') return <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-none">تحصيلي</Badge>;
  return <Badge className="bg-slate-100 text-slate-800 hover:bg-slate-200 border-none">عام</Badge>;
}

// ─── ClassModal (Create / Edit) ──────────────────────────────────────

function ClassModal({
  isOpen,
  onClose,
  initialData
}: {
  isOpen: boolean;
  onClose: () => void;
  initialData?: TeacherClass | null
}) {
  const { toast } = useToast();
  const createClass = useCreateClass();
  const updateClass = useUpdateClass();

  const [formData, setFormData] = useState<{
    name: string;
    subject: string;
    program: 'qudrat' | 'tahsili' | 'general';
    gradeLevel: string;
    description: string;
  }>({
    name: '',
    subject: '',
    program: 'qudrat',
    gradeLevel: '',
    description: ''
  });

  useEffect(() => {
    if (initialData && isOpen) {
      setFormData({
        name: initialData.name || '',
        subject: initialData.subject || '',
        program: initialData.program || 'qudrat',
        gradeLevel: initialData.gradeLevel || '',
        description: initialData.description || ''
      });
    } else if (isOpen) {
      setFormData({ name: '', subject: '', program: 'qudrat', gradeLevel: '', description: '' });
    }
  }, [initialData, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.subject) {
      toast({ title: 'معلومات ناقصة', description: 'يرجى إدخال اسم الفصل والمادة', variant: 'destructive' });
      return;
    }

    const mutation = initialData
      ? updateClass.mutateAsync({ id: initialData.id, data: formData })
      : createClass.mutateAsync(formData);

    mutation
      .then(() => {
        toast({ title: 'نجاح', description: initialData ? 'تم تحديث الفصل بنجاح' : 'تم إنشاء الفصل بنجاح' });
        onClose();
      })
      .catch((err) => {
        toast({ title: 'خطأ', description: err.message, variant: 'destructive' });
      });
  };

  const isPending = createClass.isPending || updateClass.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]" dir="rtl">
        <DialogHeader>
          <DialogTitle>{initialData ? 'تعديل الفصل' : 'إنشاء فصل جديد'}</DialogTitle>
          <DialogDescription>
            {initialData ? 'قم بتحديث بيانات الفصل أدناه.' : 'أدخل بيانات الفصل الجديد لإضافته لمساحتك.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">اسم الفصل *</label>
            <Input
              placeholder="مثال: مجموعة أ - قدرات كمي"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              disabled={isPending}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">المادة *</label>
              <Input
                placeholder="كمي، لفظي، فيزياء..."
                value={formData.subject}
                onChange={e => setFormData({ ...formData, subject: e.target.value })}
                disabled={isPending}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">البرنامج</label>
              <Select
                value={formData.program}
                onValueChange={(v: 'qudrat' | 'tahsili' | 'general') => setFormData({ ...formData, program: v })}
                disabled={isPending}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر البرنامج" />
                </SelectTrigger>
                <SelectContent dir="rtl">
                  <SelectItem value="qudrat">قدرات</SelectItem>
                  <SelectItem value="tahsili">تحصيلي</SelectItem>
                  <SelectItem value="general">عام</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">المرحلة الدراسية</label>
            <Input
              placeholder="ثالث ثانوي"
              value={formData.gradeLevel}
              onChange={e => setFormData({ ...formData, gradeLevel: e.target.value })}
              disabled={isPending}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">وصف إضافي</label>
            <Input
              placeholder="معلومات إضافية عن المجموعة..."
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              disabled={isPending}
            />
          </div>
          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>إلغاء</Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'جاري الحفظ...' : 'حفظ البيانات'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── DashboardOverview ───────────────────────────────────────────────

function DashboardOverview({ data, onSelectClass, onEditClass }: {
  data: TeacherDashboard;
  onSelectClass: (id: string) => void;
  onEditClass: (c: TeacherClass) => void;
}) {
  const { toast } = useToast();
  const deleteClass = useDeleteClass();

  const handleDelete = (id: string, count: number) => {
    if (count > 0) {
      toast({ title: 'لا يمكن حذف الفصل', description: 'قم بإزالة جميع الطلاب أولاً', variant: 'destructive' });
      return;
    }
    if (confirm('هل أنت متأكد من حذف هذا الفصل؟')) {
      deleteClass.mutate(id, {
        onSuccess: () => toast({ title: 'تم الحذف', description: 'تم حذف الفصل بنجاح' }),
        onError: (err) => toast({ title: 'خطأ', description: err.message, variant: 'destructive' })
      });
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-8 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-1">مرحباً أ. {data.teacher.name.split(' ')[0]} 👋</h2>
        <p className="text-slate-500">إليك نظرة عامة على فصولك وطلابك اليوم.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200/60 shadow-sm bg-white/50 backdrop-blur-sm">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">الفصول الدراسية</p>
              <h3 className="text-2xl font-black text-slate-900">{data.stats.classes}</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200/60 shadow-sm bg-white/50 backdrop-blur-sm">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">إجمالي الطلاب</p>
              <h3 className="text-2xl font-black text-slate-900">{data.stats.students}</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200/60 shadow-sm bg-white/50 backdrop-blur-sm">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-purple-600">
              <LayoutDashboard className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">الطلاب النشطين</p>
              <h3 className="text-2xl font-black text-slate-900">{data.stats.activeStudents}</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200/60 shadow-sm bg-white/50 backdrop-blur-sm">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center text-amber-600">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">يحتاجون متابعة</p>
              <h3 className="text-2xl font-black text-slate-900">{data.stats.needsAttention}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-slate-900">فصولي</h3>
        </div>

        {data.classes.length === 0 ? (
          <div className="text-center py-16 px-4 bg-white border border-slate-200 rounded-2xl border-dashed">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-slate-400" />
            </div>
            <h4 className="text-lg font-bold text-slate-900 mb-2">لا توجد فصول دراسية</h4>
            <p className="text-slate-500 mb-6 max-w-md mx-auto">قم بإنشاء فصلك الأول للبدء في إضافة الطلاب ومتابعة تقدمهم.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {data.classes.map(c => (
              <Card key={c.id} className="group hover:border-blue-200 hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden flex flex-col" onClick={() => onSelectClass(c.id)}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <CardTitle className="text-lg font-bold group-hover:text-blue-700 transition-colors">{c.name}</CardTitle>
                      <CardDescription className="flex items-center gap-2 text-xs">
                        <span className="font-medium text-slate-600">{c.subject}</span>
                        {c.gradeLevel && <span>• {c.gradeLevel}</span>}
                      </CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 -mt-2 -me-2" onClick={e => e.stopPropagation()}>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEditClass(c); }}>
                          <Edit className="h-4 w-4 ml-2" /> تعديل الفصل
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600" onClick={(e) => { e.stopPropagation(); handleDelete(c.id, c.studentCount); }}>
                          <Trash className="h-4 w-4 ml-2" /> حذف الفصل
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="flex-1">
                  <p className="text-sm text-slate-500 line-clamp-2">{c.description || 'لا يوجد وصف'}</p>
                </CardContent>
                <CardFooter className="pt-0 border-t border-slate-100 bg-slate-50/50 mt-4 px-6 py-3 flex items-center justify-between">
                  <ProgramBadge program={c.program} />
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                    <Users className="w-4 h-4" />
                    {c.studentCount} طالب
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── ClassRoster ─────────────────────────────────────────────────────

function ClassRoster({ classId, onBack }: { classId: string, onBack: () => void }) {
  const { toast } = useToast();
  const { data, isLoading, error } = useClassStudents(classId);
  const [studentId, setStudentId] = useState('');
  const addStudent = useAddStudent();
  const removeStudent = useRemoveStudent();
  const [showReport, setShowReport] = useState(false);

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <div className="flex items-center gap-4 mb-8">
          <Skeleton className="w-10 h-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        <Skeleton className="h-[400px] w-full rounded-xl" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-lg font-bold">عذراً، لم نتمكن من تحميل الفصل</h2>
        <Button variant="outline" className="mt-4" onClick={onBack}>العودة للوحة القيادة</Button>
      </div>
    );
  }

  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId.trim()) return;

    addStudent.mutate({ classId, identifier: studentId.trim() }, {
      onSuccess: () => {
        toast({ title: 'نجاح', description: 'تم إضافة الطالب بنجاح' });
        setStudentId('');
      },
      onError: (err) => {
        toast({ title: 'خطأ', description: err.message, variant: 'destructive' });
      }
    });
  };

  const handleRemove = (studentId: string, name: string) => {
    if (confirm(`هل أنت متأكد من إزالة الطالب ${name} من هذا الفصل؟`)) {
      removeStudent.mutate({ classId, studentId }, {
        onSuccess: () => toast({ title: 'نجاح', description: 'تمت إزالة الطالب' }),
        onError: (err) => toast({ title: 'خطأ', description: err.message, variant: 'destructive' })
      });
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={onBack} className="rounded-full bg-white">
            <ArrowRight className="w-4 h-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              {data.class.name}
              <ProgramBadge program={data.class.program} />
            </h2>
            <p className="text-slate-500">{data.class.subject} {data.class.gradeLevel ? `• ${data.class.gradeLevel}` : ''}</p>
          </div>
        </div>

        <form onSubmit={handleAddStudent} className="flex w-full flex-wrap gap-2 md:w-auto">
          <Button type="button" variant={showReport ? "default" : "outline"} onClick={() => setShowReport((value) => !value)} className="gap-2">
            <BarChart3 className="w-4 h-4" /> {showReport ? 'قائمة الطلاب' : 'تقرير التقدم'}
          </Button>
          <Input
            placeholder="يوزر، بريد، أو جوال الطالب..."
            value={studentId}
            onChange={e => setStudentId(e.target.value)}
            className="min-w-0 flex-1 bg-white md:w-64 md:flex-none"
            disabled={addStudent.isPending}
          />
          <Button type="submit" disabled={addStudent.isPending || !studentId.trim()}>
            {addStudent.isPending ? 'جاري الإضافة...' : 'إضافة طالب'}
          </Button>
        </form>
      </div>

      {showReport && <ClassProgressReport classId={classId} />}

      {!showReport && (
      <Card className="shadow-sm border-slate-200">
        <div className="overflow-x-auto">
          <Table dir="rtl">
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="w-[300px]">الطالب</TableHead>
                <TableHead>المستوى</TableHead>
                <TableHead>الاختبارات</TableHead>
                <TableHead>تاريخ الانضمام</TableHead>
                <TableHead>آخر زيارة</TableHead>
                <TableHead className="text-left">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.students.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-48 text-center text-slate-500">
                    لا يوجد طلاب في هذا الفصل بعد. قم بإضافة طالب باستخدام حقل الإضافة أعلاه.
                  </TableCell>
                </TableRow>
              ) : (
                data.students.map(s => (
                  <TableRow key={s.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 border">
                          <AvatarFallback className="bg-blue-50 text-blue-700 font-bold">
                            {s.fullName.substring(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-semibold text-slate-900">{s.fullName}</div>
                          <div className="text-xs text-slate-500 dir-ltr text-right">{s.username}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-normal border-slate-300 text-slate-700">
                        {s.level}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{s.totalTestsTaken}</TableCell>
                    <TableCell className="text-slate-500 text-sm">
                      {new Date(s.joinedAt).toLocaleDateString('ar-SA')}
                    </TableCell>
                    <TableCell className="text-slate-500 text-sm">
                      {s.lastVisit ? new Date(s.lastVisit).toLocaleDateString('ar-SA') : 'لم يدخل بعد'}
                    </TableCell>
                    <TableCell className="text-left">
                      <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleRemove(s.id, s.fullName)} disabled={removeStudent.isPending}>
                        <Trash className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
      )}
    </div>
  );
}

function ClassProgressReport({ classId }: { classId: string }) {
  const [period, setPeriod] = useState('30');
  const [program, setProgram] = useState('all');
  const [exam, setExam] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const { data, isLoading, error } = useClassReport(classId, period, program, exam);

  const exportCsv = () => {
    if (!data) return;
    const safeCell = (value: unknown) => {
      const text = String(value ?? '');
      const neutralized = /^[\s]*[=+\-@\t\r]/.test(text) ? `'${text}` : text;
      return `"${neutralized.replace(/"/g, '""')}"`;
    };
    const rows = [
      ['الطالب', 'اسم المستخدم', 'متوسط الدرجة', 'نسبة الإكمال', 'الاختبارات المكتملة', 'آخر نشاط', 'نقاط القوة', 'نقاط الضعف'],
      ...data.students.map((student) => [
        student.fullName, student.username, `${student.averageScore}%`, `${student.completionRate}%`, String(student.completedTests),
        student.lastActivity ? new Date(student.lastActivity).toLocaleDateString('ar-SA') : 'لا يوجد',
        student.strengths.map((item) => item.name).join('، '), student.weaknesses.map((item) => item.name).join('، '),
      ]),
    ];
    const csv = '\ufeff' + rows.map((row) => row.map(safeCell).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `تقرير_${data.class.name}_${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) return <Skeleton className="h-80 w-full rounded-xl" />;
  if (error || !data) return <Card className="p-8 text-center text-red-600">تعذر تحميل بيانات التقرير الفعلية.</Card>;
  const profile = data.students.find((student) => student.id === selectedStudent);
  const maxTrend = Math.max(100, ...data.summary.trend.map((point) => point.averageScore));

  return (
    <div className="space-y-5">
      <Card>
        <CardContent className="p-4 flex flex-wrap gap-3 items-center">
          <Select value={period} onValueChange={setPeriod}><SelectTrigger className="w-40"><SelectValue /></SelectTrigger><SelectContent>
            <SelectItem value="7">آخر 7 أيام</SelectItem><SelectItem value="30">آخر 30 يومًا</SelectItem>
            <SelectItem value="90">آخر 90 يومًا</SelectItem><SelectItem value="365">آخر سنة</SelectItem><SelectItem value="all">كل الفترات</SelectItem>
          </SelectContent></Select>
          <Select value={program} onValueChange={setProgram}><SelectTrigger className="w-40"><SelectValue placeholder="البرنامج" /></SelectTrigger><SelectContent>
            <SelectItem value="all">كل البرامج</SelectItem><SelectItem value="qudrat">قدرات</SelectItem>
            <SelectItem value="tahsili">تحصيلي</SelectItem><SelectItem value="general">عام</SelectItem>
          </SelectContent></Select>
          <Select value={exam} onValueChange={setExam}><SelectTrigger className="w-52"><SelectValue placeholder="الاختبار" /></SelectTrigger><SelectContent>
            <SelectItem value="all">كل الاختبارات</SelectItem>
            {data.filters.availableExams.map((item) => <SelectItem key={item.value} value={item.value}>{item.name}</SelectItem>)}
          </SelectContent></Select>
          <Button variant="outline" className="gap-2 me-auto" onClick={exportCsv}><Download className="w-4 h-4" /> تصدير CSV</Button>
        </CardContent>
      </Card>
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: 'متوسط الفصل', value: `${data.summary.averageScore}%`, icon: TrendingUp },
          { label: 'نسبة الإكمال', value: `${data.summary.completionRate}%`, icon: Target },
          { label: 'اختبارات مكتملة', value: data.summary.completedTests, icon: BookOpen },
          { label: 'طلاب نشطون', value: `${data.summary.studentsWithActivity}/${data.summary.studentCount}`, icon: Users },
        ].map((item) => <Card key={item.label}><CardContent className="p-5 flex items-center gap-3"><item.icon className="w-5 h-5 text-blue-600" /><div><p className="text-xs text-slate-500">{item.label}</p><p className="text-2xl font-black">{item.value}</p></div></CardContent></Card>)}
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">اتجاه الدرجات</CardTitle></CardHeader>
        <CardContent>
          {data.summary.trend.length ? <div className="h-36 flex items-end gap-2">
            {data.summary.trend.slice(-20).map((point) => <div key={point.date} className="flex-1 min-w-2 group" title={`${point.date}: ${point.averageScore}%`}>
              <div className="bg-blue-500 rounded-t hover:bg-blue-600" style={{ height: `${Math.max(5, (point.averageScore / maxTrend) * 120)}px` }} />
            </div>)}
          </div> : <p className="text-center text-slate-500 py-8">لا توجد نتائج ضمن الفلاتر المحددة.</p>}
        </CardContent>
      </Card>
      <Card>
        <Table><TableHeader><TableRow><TableHead>الطالب</TableHead><TableHead>المتوسط</TableHead><TableHead>الإكمال</TableHead><TableHead>آخر نشاط</TableHead><TableHead>التفاصيل</TableHead></TableRow></TableHeader>
          <TableBody>{data.students.map((student) => <TableRow key={student.id}>
            <TableCell><div className="font-bold">{student.fullName}</div><div className="text-xs text-slate-500">{student.username}</div></TableCell>
            <TableCell>{student.averageScore}%</TableCell><TableCell><div>{student.completionRate}%</div><div className="text-xs text-slate-500">{student.completedTests} اختبار</div></TableCell>
            <TableCell>{student.lastActivity ? new Date(student.lastActivity).toLocaleDateString('ar-SA') : 'لا يوجد'}</TableCell>
            <TableCell><Button size="sm" variant="outline" onClick={() => setSelectedStudent(student.id)}>فتح الملف</Button></TableCell>
          </TableRow>)}</TableBody>
        </Table>
      </Card>
      <Dialog open={!!profile} onOpenChange={(open) => !open && setSelectedStudent(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto" dir="rtl">
          {profile && <><DialogHeader><DialogTitle>ملف الطالب: {profile.fullName}</DialogTitle><DialogDescription>نتائج فعلية ضمن الفترة والفلاتر المحددة</DialogDescription></DialogHeader>
            <div className="grid grid-cols-3 gap-3"><Card className="p-3 text-center"><b>{profile.averageScore}%</b><p className="text-xs text-slate-500">المتوسط</p></Card><Card className="p-3 text-center"><b>{profile.completedTests}</b><p className="text-xs text-slate-500">اختبارات</p></Card><Card className="p-3 text-center"><b>{profile.level}</b><p className="text-xs text-slate-500">المستوى</p></Card></div>
            <div className="grid md:grid-cols-2 gap-4"><div><h4 className="font-bold text-green-700 mb-2">نقاط القوة</h4><p className="text-sm">{profile.strengths.map((item) => item.name).join('، ') || 'لا توجد بيانات كافية'}</p></div><div><h4 className="font-bold text-amber-700 mb-2">نقاط الضعف</h4><p className="text-sm">{profile.weaknesses.map((item) => item.name).join('، ') || 'لا توجد بيانات كافية'}</p></div></div>
            <Table><TableHeader><TableRow><TableHead>الاختبار</TableHead><TableHead>الدرجة</TableHead><TableHead>الإجابات</TableHead><TableHead>التاريخ</TableHead></TableRow></TableHeader><TableBody>
              {profile.tests.map((test) => <TableRow key={test.id}><TableCell>{test.name}</TableCell><TableCell>{test.score}%</TableCell><TableCell>{test.correctAnswers}/{test.totalQuestions}</TableCell><TableCell>{new Date(test.completedAt).toLocaleDateString('ar-SA')}</TableCell></TableRow>)}
            </TableBody></Table>
          </>}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────

export default function TeacherSystemPage() {
  const { data, isLoading, error } = useTeacherDashboard();
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<TeacherClass | null>(null);

  const openCreateModal = () => {
    setEditingClass(null);
    setModalOpen(true);
  };

  const openEditModal = (c: TeacherClass) => {
    setEditingClass(c);
    setModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center dir-rtl">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium">جاري تحميل مساحة المعلم...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    if (error?.message === 'UNAUTHORIZED') {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center dir-rtl p-4">
          <Card className="max-w-md w-full text-center p-8">
            <LogOut className="w-16 h-16 text-slate-300 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">غير مصرح لك بالدخول</h2>
            <p className="text-slate-500 mb-6">هذه المساحة مخصصة للمعلمين فقط. يرجى تسجيل الدخول بحساب معلم للوصول.</p>
            <Link href="/">
              <Button className="w-full">العودة للرئيسية</Button>
            </Link>
          </Card>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center dir-rtl p-4">
        <Card className="max-w-md w-full text-center p-8">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">حدث خطأ</h2>
          <p className="text-slate-500 mb-6">{error?.message || 'تعذر الاتصال بالخادم.'}</p>
          <Button onClick={() => window.location.reload()} className="w-full">إعادة المحاولة</Button>
        </Card>
      </div>
    );
  }

  return (
    <>
      <SEO title="مساحة المعلم | قدراتك" description="لوحة تحكم المعلم لإدارة الفصول والطلاب" url="/teacher" />
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans" dir="rtl">

        {/* Header */}
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <Link href="/">
              <div className="w-9 h-9 bg-slate-900 rounded-lg flex items-center justify-center text-white font-black cursor-pointer hover:bg-slate-800 transition">
                ق
              </div>
            </Link>
            <div className="h-6 w-px bg-slate-200"></div>
            <h1 className="text-lg font-bold text-slate-800 tracking-tight">مساحة المعلم</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:block text-sm font-medium text-slate-700 text-left dir-ltr">
              {data.teacher.name}
              <div className="text-xs text-slate-400 font-normal">{data.teacher.email}</div>
            </div>
            <Avatar className="border-2 border-white shadow-sm">
              <AvatarFallback className="bg-blue-100 text-blue-700 font-bold">
                {data.teacher.name.substring(0, 2)}
              </AvatarFallback>
            </Avatar>
          </div>
        </header>

        {/* Layout */}
        <div className="flex flex-1 overflow-hidden">

          {/* Sidebar */}
          <aside className="hidden md:flex w-64 border-l border-slate-200 bg-white flex-col z-10 shrink-0">
            <div className="p-4 border-b border-slate-100">
              <Button
                className={cn("w-full justify-start gap-3 rounded-xl", !selectedClassId ? "bg-slate-100 text-slate-900 font-bold" : "text-slate-600 font-medium hover:bg-slate-50")}
                variant="ghost"
                onClick={() => setSelectedClassId(null)}
              >
                <LayoutDashboard className="w-4 h-4" /> نظرة عامة
              </Button>
            </div>
            <div className="p-4 flex-1 overflow-y-auto">
              <div className="flex items-center justify-between mb-4 px-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">الفصول الدراسية</span>
                <Badge variant="secondary" className="bg-slate-100 font-medium">{data.classes.length}</Badge>
              </div>
              <div className="space-y-1">
                {data.classes.map(c => (
                  <Button
                    key={c.id}
                    variant="ghost"
                    className={cn("w-full justify-start gap-3 rounded-xl transition-all", selectedClassId === c.id ? "bg-blue-50 text-blue-700 font-bold" : "text-slate-600 font-medium hover:bg-slate-50")}
                    onClick={() => setSelectedClassId(c.id)}
                  >
                    <BookOpen className="w-4 h-4 shrink-0" />
                    <span className="truncate">{c.name}</span>
                  </Button>
                ))}
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50/50">
              <Button className="w-full gap-2 font-bold shadow-sm" onClick={openCreateModal}>
                <Plus className="w-4 h-4" /> فصل جديد
              </Button>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto relative">
            {/* Mobile Nav toggle simulation / breadcrumb space */}
            <div className="md:hidden bg-white border-b border-slate-200 p-3 flex gap-2 overflow-x-auto no-scrollbar">
               <Button
                size="sm"
                variant={!selectedClassId ? "default" : "outline"}
                onClick={() => setSelectedClassId(null)}
                className="shrink-0"
              >
                نظرة عامة
              </Button>
              {data.classes.map(c => (
                 <Button
                 key={c.id}
                 size="sm"
                 variant={selectedClassId === c.id ? "default" : "outline"}
                 onClick={() => setSelectedClassId(c.id)}
                 className="shrink-0"
               >
                 {c.name}
               </Button>
              ))}
              <Button size="sm" variant="outline" className="shrink-0" onClick={openCreateModal}>
                <Plus className="w-4 h-4 mr-1" /> جديد
              </Button>
            </div>

            {selectedClassId ? (
              <ClassRoster classId={selectedClassId} onBack={() => setSelectedClassId(null)} />
            ) : (
              <DashboardOverview
                data={data}
                onSelectClass={setSelectedClassId}
                onEditClass={openEditModal}
              />
            )}
          </main>
        </div>
      </div>

      <ClassModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        initialData={editingClass}
      />
    </>
  );
}
