import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Edit, Plus, RefreshCw, Search, ShieldCheck, Trash2, UserCog, UserX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

type AccountRole = 'student' | 'parent' | 'teacher' | 'institution_admin';

interface ManagedAccount {
  _id: string;
  username: string;
  fullName?: string;
  email?: string;
  phone?: string;
  role?: AccountRole;
  institutionId?: string;
  isActive?: boolean;
  isVerified?: boolean;
  emailVerified?: boolean;
  points?: number;
  level?: number;
  academicTrack?: string;
  gradeLevel?: string;
  studyGoal?: string;
  targetScore?: number;
  guardianPhone?: string;
  targetExamDate?: string;
  city?: string;
  bio?: string;
  createdAt?: string;
  lastVisit?: string;
}

const roleLabels: Record<string, string> = {
  student: 'طالب',
  parent: 'ولي أمر',
  teacher: 'معلم',
  institution_admin: 'مسؤول مؤسسة',
};

const emptyForm = {
  username: '',
  fullName: '',
  email: '',
  phone: '',
  password: '',
  role: 'student' as AccountRole,
  institutionId: '',
  isActive: true,
  isVerified: false,
  emailVerified: false,
  points: '0',
  level: '1',
  academicTrack: '',
  gradeLevel: '',
  studyGoal: '',
  targetScore: '',
  guardianPhone: '',
  targetExamDate: '',
  city: '',
  bio: '',
};

function formatDate(value?: string) {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString('ar-SA');
}

export default function AdminAccountManagementTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState('all');
  const [editingAccount, setEditingAccount] = useState<ManagedAccount | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [accountToDelete, setAccountToDelete] = useState<ManagedAccount | null>(null);

  const accountsQuery = useQuery({
    queryKey: ['/api/admin/users', 'accounts', page, search, roleFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: '20',
        role: roleFilter,
        ...(search.trim() ? { search: search.trim() } : {}),
      });
      const response = await fetch(`/api/admin/users?${params}`, { credentials: 'include' });
      if (!response.ok) throw new Error('تعذر تحميل الحسابات');
      return response.json();
    },
  });

  const saveAccount = useMutation({
    mutationFn: async () => {
      const payload: Record<string, unknown> = {
        ...form,
        points: Number(form.points) || 0,
        level: Number(form.level) || 1,
        targetScore: form.targetScore ? Number(form.targetScore) : undefined,
        targetExamDate: form.targetExamDate || undefined,
        institutionId: form.institutionId || undefined,
      };
      if (!form.password.trim()) delete payload.password;
      const response = await fetch(isCreating ? '/api/admin/users' : `/api/admin/users/${editingAccount?._id}`, {
        method: isCreating ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'تعذر حفظ الحساب');
      return data;
    },
    onSuccess: () => {
      toast({ title: 'تم تحديث بيانات الحساب' });
      setEditingAccount(null);
      setIsCreating(false);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
    },
    onError: (error: Error) => toast({ title: error.message, variant: 'destructive' }),
  });

  const deleteAccount = useMutation({
    mutationFn: async (account: ManagedAccount) => {
      const response = await fetch(`/api/admin/users/${account._id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'تعذر حذف الحساب');
      return data;
    },
    onSuccess: () => {
      toast({ title: 'تم حذف الحساب', description: 'تم الاحتفاظ بالسجلات التاريخية المرتبطة به.' });
      setAccountToDelete(null);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
    },
    onError: (error: Error) => toast({ title: error.message, variant: 'destructive' }),
  });

  const openEditor = (account: ManagedAccount) => {
    setIsCreating(false);
    setEditingAccount(account);
    setForm({
      ...emptyForm,
      username: account.username || '',
      fullName: account.fullName || '',
      email: account.email || '',
      phone: account.phone || '',
      role: account.role || 'student',
      institutionId: account.institutionId || '',
      isActive: account.isActive !== false,
      isVerified: Boolean(account.isVerified),
      emailVerified: Boolean(account.emailVerified),
      points: String(account.points ?? 0),
      level: String(account.level ?? 1),
      academicTrack: account.academicTrack || '',
      gradeLevel: account.gradeLevel || '',
      studyGoal: account.studyGoal || '',
      targetScore: account.targetScore == null ? '' : String(account.targetScore),
      guardianPhone: account.guardianPhone || '',
      targetExamDate: account.targetExamDate ? account.targetExamDate.slice(0, 10) : '',
      city: account.city || '',
      bio: account.bio || '',
    });
  };

  const openCreator = () => {
    setEditingAccount(null);
    setForm(emptyForm);
    setIsCreating(true);
  };

  const accounts: ManagedAccount[] = accountsQuery.data?.users || [];
  const totalPages = accountsQuery.data?.totalPages || 1;

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold text-white">
              <UserCog className="h-5 w-5 text-cyan-300" />
              إدارة حسابات المستخدمين والمدرسين
            </h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-400">
              عدّل البيانات الأساسية، غيّر الدور أو كلمة المرور، فعّل الحساب أو عطّله، واحذف الحساب عند الحاجة.
              لا تُعرض كلمات المرور ومفاتيح الأمان في هذه الصفحة.
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={openCreator} className="bg-cyan-600 text-white hover:bg-cyan-500">
              <Plus className="ml-2 h-4 w-4" /> إضافة حساب
            </Button>
            <Button variant="outline" className="border-slate-700 text-slate-300" onClick={() => accountsQuery.refetch()}>
              <RefreshCw className="ml-2 h-4 w-4" /> تحديث
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
        <div className="relative min-w-[240px] flex-1">
          <Search className="pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-slate-500" />
          <Input
            value={search}
            onChange={(event) => { setSearch(event.target.value); setPage(1); }}
            placeholder="ابحث بالاسم أو اسم المستخدم أو البريد أو الجوال"
            className="border-slate-700 bg-slate-800 pr-9 text-white placeholder:text-slate-500"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(event) => { setRoleFilter(event.target.value); setPage(1); }}
          className="rounded-md border border-slate-700 bg-slate-800 px-3 text-sm text-white"
        >
          <option value="all">كل الحسابات</option>
          <option value="teacher">المدرسون</option>
          <option value="student">الطلاب</option>
          <option value="parent">أولياء الأمور</option>
          <option value="institution_admin">مسؤولو المؤسسات</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-right">
            <thead className="border-b border-slate-800 bg-slate-950/60 text-xs text-slate-400">
              <tr>
                <th className="px-4 py-3">الحساب</th>
                <th className="px-4 py-3">الدور</th>
                <th className="px-4 py-3">البريد والجوال</th>
                <th className="px-4 py-3">الحالة</th>
                <th className="px-4 py-3">التسجيل</th>
                <th className="px-4 py-3">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {accountsQuery.isLoading ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-slate-500">جارٍ تحميل الحسابات...</td></tr>
              ) : accounts.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-slate-500">لا توجد حسابات مطابقة.</td></tr>
              ) : accounts.map((account) => (
                <tr key={account._id} className="hover:bg-slate-800/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/15 text-sm font-bold text-cyan-300">
                        {(account.fullName || account.username || '?').slice(0, 1).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{account.fullName || 'بدون اسم'}</p>
                        <p className="text-xs text-slate-500">@{account.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-300">{roleLabels[account.role || ''] || account.role || '-'}</td>
                  <td className="px-4 py-3 text-xs leading-6 text-slate-400">
                    <div>{account.email || 'بلا بريد'}</div>
                    <div>{account.phone || 'بلا جوال'}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-1 text-xs ${account.isActive === false ? 'bg-red-500/15 text-red-300' : 'bg-emerald-500/15 text-emerald-300'}`}>
                      {account.isActive === false ? 'معطل' : 'نشط'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">{formatDate(account.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEditor(account)} className="rounded-lg p-2 text-cyan-300 hover:bg-cyan-500/10" title="تعديل">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button onClick={() => setAccountToDelete(account)} className="rounded-lg p-2 text-red-300 hover:bg-red-500/10" title="حذف">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-slate-800 px-4 py-3 text-xs text-slate-500">
          <span>{accountsQuery.data?.total || 0} حساب</span>
          <div className="flex items-center gap-2">
            <button className="rounded-lg bg-slate-800 px-3 py-1.5 disabled:opacity-40" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>السابق</button>
            <span>صفحة {page} من {totalPages}</span>
            <button className="rounded-lg bg-slate-800 px-3 py-1.5 disabled:opacity-40" disabled={page >= totalPages} onClick={() => setPage((value) => value + 1)}>التالي</button>
          </div>
        </div>
      </div>

      <Dialog open={!!editingAccount || isCreating} onOpenChange={(open) => { if (!open) { setEditingAccount(null); setIsCreating(false); } }}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto border-slate-700 bg-slate-900 text-white" dir="rtl">
          <DialogHeader><DialogTitle>{isCreating ? 'إضافة حساب جديد' : 'تعديل بيانات الحساب'}</DialogTitle></DialogHeader>
          <div className="grid gap-4 pt-2 md:grid-cols-2">
            {[
              ['username', 'اسم المستخدم'],
              ['fullName', 'الاسم الكامل'],
              ['email', 'البريد الإلكتروني'],
              ['phone', 'رقم الجوال'],
              ['city', 'المدينة'],
              ['institutionId', 'معرف المؤسسة (اختياري)'],
              ['academicTrack', 'المسار الدراسي'],
              ['gradeLevel', 'الصف الدراسي'],
              ['studyGoal', 'الهدف الدراسي'],
              ['targetScore', 'الدرجة المستهدفة'],
              ['guardianPhone', 'جوال ولي الأمر'],
              ['targetExamDate', 'تاريخ الاختبار المستهدف'],
              ['points', 'النقاط'],
              ['level', 'المستوى'],
            ].map(([key, label]) => (
              <label key={key} className="text-xs text-slate-300">
                {label}
                <Input
                  type={key === 'targetExamDate' ? 'date' : 'text'}
                  value={String(form[key as keyof typeof form] ?? '')}
                  onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))}
                  className="mt-1 border-slate-700 bg-slate-800 text-white"
                />
              </label>
            ))}
            <label className="text-xs text-slate-300">
              الدور
              <select value={form.role} onChange={(event) => setForm((current) => ({ ...current, role: event.target.value as AccountRole }))} className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white">
                {Object.entries(roleLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            <label className="text-xs text-slate-300">
              {isCreating ? 'كلمة المرور' : 'كلمة مرور جديدة'}
              <Input type="password" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} placeholder={isCreating ? '6 أحرف على الأقل' : 'اتركها فارغة دون تغيير'} className="mt-1 border-slate-700 bg-slate-800 text-white" />
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input type="checkbox" checked={form.isActive} onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))} />
              الحساب نشط ويمكنه تسجيل الدخول
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input type="checkbox" checked={form.isVerified} onChange={(event) => setForm((current) => ({ ...current, isVerified: event.target.checked }))} />
              الحساب موثق
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input type="checkbox" checked={form.emailVerified} onChange={(event) => setForm((current) => ({ ...current, emailVerified: event.target.checked }))} />
              البريد موثق
            </label>
            <label className="text-xs text-slate-300 md:col-span-2">
              نبذة
              <textarea value={form.bio} onChange={(event) => setForm((current) => ({ ...current, bio: event.target.value }))} className="mt-1 min-h-20 w-full rounded-md border border-slate-700 bg-slate-800 p-3 text-sm text-white outline-none" />
            </label>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" className="border-slate-700 text-slate-300" onClick={() => setEditingAccount(null)}>إلغاء</Button>
            <Button onClick={() => saveAccount.mutate()} disabled={saveAccount.isPending || !form.username.trim() || (isCreating && form.password.length < 6)} className="bg-cyan-600 text-white hover:bg-cyan-500">
              <ShieldCheck className="ml-2 h-4 w-4" /> {saveAccount.isPending ? 'جارٍ الحفظ...' : isCreating ? 'إنشاء الحساب' : 'حفظ التعديلات'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!accountToDelete} onOpenChange={(open) => { if (!open) setAccountToDelete(null); }}>
        <DialogContent className="max-w-md border-red-500/30 bg-slate-900 text-white" dir="rtl">
          <DialogHeader><DialogTitle className="flex items-center gap-2 text-red-300"><UserX className="h-5 w-5" /> تأكيد حذف الحساب</DialogTitle></DialogHeader>
          <p className="text-sm leading-7 text-slate-300">
            سيتم حذف حساب <strong className="text-white">{accountToDelete?.fullName || accountToDelete?.username}</strong> نهائيًا من قائمة المستخدمين.
            ستبقى سجلات الاختبارات والاشتراكات التاريخية محفوظة، ولا يمكن التراجع عن حذف الحساب.
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" className="border-slate-700 text-slate-300" onClick={() => setAccountToDelete(null)}>إلغاء</Button>
            <Button variant="destructive" onClick={() => accountToDelete && deleteAccount.mutate(accountToDelete)} disabled={deleteAccount.isPending}>
              <Trash2 className="ml-2 h-4 w-4" /> {deleteAccount.isPending ? 'جارٍ الحذف...' : 'حذف نهائي'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}