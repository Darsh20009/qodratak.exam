import { useState, useEffect, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Wallet, Trophy, Gift, RefreshCw, Plus, Search, Star, UserCheck, X, Minus } from 'lucide-react';

function formatDate(d: string | Date) {
  return new Date(d).toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' });
}

interface Props {
  walletsData: any[];
  walletsLoading: boolean;
  monthlyTop3Data: any[];
  top3Loading: boolean;
  refetchWallets: () => void;
  refetchTop3: () => void;
  toast: (opts: any) => void;
  queryClient: any;
}

export default function AdminWalletsTab({ walletsData = [], walletsLoading, monthlyTop3Data = [], top3Loading, refetchWallets, refetchTop3, toast, queryClient }: Props) {
  const [search, setSearch] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showRewardDialog, setShowRewardDialog] = useState(false);
  const [addForm, setAddForm] = useState({ userId: '', username: '', amount: '', description: '' });
  const [rewards, setRewards] = useState<Record<string, string>>({});

  const [studentSearch, setStudentSearch] = useState('');
  const [studentResults, setStudentResults] = useState<any[]>([]);
  const [studentLoading, setStudentLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [showDeductDialog, setShowDeductDialog] = useState(false);
  const [deductForm, setDeductForm] = useState({ userId: '', username: '', amount: '', description: '' });

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchStudents = (q: string) => {
    setStudentSearch(q);
    if (!q.trim()) { setStudentResults([]); setShowDropdown(false); return; }
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(async () => {
      setStudentLoading(true);
      try {
        const res = await fetch(`/api/admin/users?search=${encodeURIComponent(q)}&limit=10`, { credentials: 'include' });
        const data = await res.json();
        const users = Array.isArray(data) ? data : (data.users || []);
        setStudentResults(users);
        setShowDropdown(true);
      } catch {
        setStudentResults([]);
      } finally {
        setStudentLoading(false);
      }
    }, 300);
  };

  const selectStudent = (student: any) => {
    setSelectedStudent(student);
    setAddForm(f => ({ ...f, userId: String(student.id || student._id || ''), username: student.name || student.username || '' }));
    setStudentSearch(student.name || student.username || '');
    setShowDropdown(false);
  };

  const clearStudent = () => {
    setSelectedStudent(null);
    setStudentSearch('');
    setAddForm(f => ({ ...f, userId: '', username: '' }));
  };

  const openAddDialog = (prefill?: { userId: string; username: string }) => {
    if (prefill) {
      setAddForm(f => ({ ...f, userId: prefill.userId, username: prefill.username }));
      setStudentSearch(prefill.username);
      setSelectedStudent({ id: prefill.userId, name: prefill.username });
    } else {
      setAddForm({ userId: '', username: '', amount: '', description: '' });
      setStudentSearch('');
      setSelectedStudent(null);
    }
    setShowAddDialog(true);
  };

  const addMoneyMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/admin/wallet/add', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data), credentials: 'include' });
      return res.json();
    },
    onSuccess: (d) => {
      if (d.success) {
        toast({ title: '✅ تم إضافة الرصيد', description: `تمت إضافة ${addForm.amount} ر.س بنجاح` });
        refetchWallets();
        setShowAddDialog(false);
        setAddForm({ userId: '', username: '', amount: '', description: '' });
        setStudentSearch('');
        setSelectedStudent(null);
      } else {
        toast({ title: 'خطأ', description: d.error, variant: 'destructive' });
      }
    },
    onError: () => toast({ title: 'فشل', variant: 'destructive' }),
  });

  const rewardTop3Mutation = useMutation({
    mutationFn: async (rewardsArr: any[]) => {
      const res = await fetch('/api/admin/wallet/reward-top3', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rewards: rewardsArr }), credentials: 'include' });
      return res.json();
    },
    onSuccess: (d) => {
      if (d.success) {
        toast({ title: '🏆 تم توزيع المكافآت', description: `تم تكريم ${d.results?.length} طالب` });
        refetchWallets();
        refetchTop3();
        setShowRewardDialog(false);
      } else {
        toast({ title: 'خطأ', description: d.error, variant: 'destructive' });
      }
    },
    onError: () => toast({ title: 'فشل في التوزيع', variant: 'destructive' }),
  });

  const deductMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/admin/wallet/deduct', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data), credentials: 'include' });
      return res.json();
    },
    onSuccess: (d) => {
      if (d.success) {
        toast({ title: '✅ تم الخصم', description: `تم خصم ${deductForm.amount} ر.س بنجاح` });
        refetchWallets();
        setShowDeductDialog(false);
        setDeductForm({ userId: '', username: '', amount: '', description: '' });
      } else {
        toast({ title: 'خطأ', description: d.error, variant: 'destructive' });
      }
    },
    onError: () => toast({ title: 'فشل', variant: 'destructive' }),
  });

  const filtered = (walletsData || []).filter((w: any) =>
    !search || w.username?.includes(search) || w.userId?.includes(search)
  );

  const rankMedal = (i: number) => ['🥇', '🥈', '🥉'][i] ?? `${i + 1}`;

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-white text-xl font-bold flex items-center gap-2">
            <Wallet className="w-5 h-5 text-yellow-400" /> المحافظ والمكافآت
          </h2>
          <p className="text-slate-400 text-sm mt-1">إدارة محافظ الطلاب وتوزيع المكافآت الشهرية</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800 gap-1" onClick={() => { refetchWallets(); refetchTop3(); }}>
            <RefreshCw className="w-3.5 h-3.5" /> تحديث
          </Button>
          <Button size="sm" className="bg-yellow-600 hover:bg-yellow-700 gap-1" onClick={() => openAddDialog()}>
            <Plus className="w-3.5 h-3.5" /> إضافة رصيد
          </Button>
          <Button size="sm" className="bg-red-700 hover:bg-red-800 gap-1" onClick={() => { setDeductForm({ userId: '', username: '', amount: '', description: '' }); setShowDeductDialog(true); }}>
            <Minus className="w-3.5 h-3.5" /> خصم رصيد
          </Button>
          <Button size="sm" className="bg-amber-600 hover:bg-amber-700 gap-1" onClick={() => setShowRewardDialog(true)}>
            <Trophy className="w-3.5 h-3.5" /> مكافأة المتصدرين
          </Button>
        </div>
      </div>

      {/* Monthly Top 3 */}
      <Card className="bg-gradient-to-br from-amber-900/30 to-yellow-900/20 border-amber-500/20 rounded-2xl p-5">
        <h3 className="text-amber-300 font-bold mb-4 flex items-center gap-2">
          <Star className="w-4 h-4" /> المتصدرون الحقيقيون (هذا الشهر)
        </h3>
        {top3Loading ? (
          <div className="text-slate-400 text-sm">جاري التحميل...</div>
        ) : (monthlyTop3Data || []).length === 0 ? (
          <div className="text-slate-400 text-sm">لا يوجد طلاب في المتصدرين</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(monthlyTop3Data || []).slice(0, 3).map((entry: any, i: number) => (
              <div key={entry.userId || i} className="bg-white/5 rounded-xl p-3 text-center border border-white/10">
                <div className="text-3xl mb-1">{rankMedal(i)}</div>
                <p className="text-white font-bold text-sm">{entry.username}</p>
                <p className="text-amber-400 text-xs mt-1">{entry.totalPoints?.toLocaleString()} نقطة</p>
                <p className="text-emerald-400 text-xs mt-0.5">رصيد: {(entry.walletBalance || 0).toFixed(2)} ر.س</p>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <Input
          placeholder="بحث بالاسم أو المعرف..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 pr-9"
        />
      </div>

      {/* Wallets list */}
      {walletsLoading ? (
        <div className="text-center py-16 text-slate-400">جارٍ التحميل...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <Wallet className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>لا توجد محافظ</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((w: any, idx: number) => (
            <Card key={w._id || idx} className="bg-slate-800/50 border-slate-700 rounded-xl px-4 py-3 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center text-yellow-400 font-bold">
                {w.username?.[0]?.toUpperCase() || '؟'}
              </div>
              <div className="flex-1">
                <p className="text-white font-medium">{w.username || 'مستخدم'}</p>
                <p className="text-slate-500 text-xs">ID: {w.userId}</p>
              </div>
              <div className="text-left">
                <p className="text-emerald-400 font-bold">{(w.balance || 0).toFixed(2)} ر.س</p>
                <p className="text-slate-500 text-xs">الكل: {(w.totalEarned || 0).toFixed(2)} ر.س</p>
              </div>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-yellow-600/40 text-yellow-400 hover:bg-yellow-600/10 gap-1"
                  onClick={() => openAddDialog({ userId: w.userId, username: w.username || '' })}
                >
                  <Plus className="w-3 h-3" /> إضافة
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-red-700/40 text-red-400 hover:bg-red-700/10 gap-1"
                  onClick={() => { setDeductForm({ userId: w.userId, username: w.username || '', amount: '', description: '' }); setShowDeductDialog(true); }}
                >
                  <Minus className="w-3 h-3" /> خصم
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add Money Dialog */}
      <Dialog open={showAddDialog} onOpenChange={(open) => { setShowAddDialog(open); if (!open) { clearStudent(); setAddForm({ userId: '', username: '', amount: '', description: '' }); } }}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-sm" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Gift className="w-5 h-5 text-yellow-400" /> إضافة رصيد للمحفظة
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">

            {/* Student selector */}
            <div>
              <p className="text-slate-400 text-xs mb-1">اختر الطالب *</p>
              {selectedStudent ? (
                <div className="flex items-center gap-2 bg-slate-800 border border-yellow-600/40 rounded-md px-3 py-2">
                  <UserCheck className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{selectedStudent.name || selectedStudent.username}</p>
                    <p className="text-slate-500 text-xs">ID: {selectedStudent.id || selectedStudent._id}</p>
                  </div>
                  <button onClick={clearStudent} className="text-slate-500 hover:text-red-400 flex-shrink-0">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="relative" ref={dropdownRef}>
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                  <Input
                    value={studentSearch}
                    onChange={e => searchStudents(e.target.value)}
                    onFocus={() => { if (studentResults.length > 0) setShowDropdown(true); }}
                    className="bg-slate-800 border-slate-700 text-white pr-9"
                    placeholder="ابحث بالاسم أو البريد..."
                  />
                  {showDropdown && (
                    <div className="absolute z-50 top-full right-0 left-0 mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden max-h-48 overflow-y-auto">
                      {studentLoading ? (
                        <div className="text-slate-400 text-sm text-center py-3">جارٍ البحث...</div>
                      ) : studentResults.length === 0 ? (
                        <div className="text-slate-400 text-sm text-center py-3">لا توجد نتائج</div>
                      ) : studentResults.map((s: any) => (
                        <button
                          key={s.id || s._id}
                          className="w-full text-right px-3 py-2.5 hover:bg-slate-700 flex items-center gap-2 transition-colors"
                          onClick={() => selectStudent(s)}
                        >
                          <div className="w-7 h-7 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-400 text-xs font-bold flex-shrink-0">
                            {(s.name || s.username || '؟')[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm truncate">{s.name || s.username}</p>
                            <p className="text-slate-500 text-xs truncate">{s.email} · ID: {s.id}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              <p className="text-slate-400 text-xs mb-1">المبلغ (ر.س) *</p>
              <Input type="number" value={addForm.amount} onChange={e => setAddForm(f => ({ ...f, amount: e.target.value }))} className="bg-slate-800 border-slate-700 text-white" placeholder="0.00" min="0.01" step="0.01" />
            </div>
            <div>
              <p className="text-slate-400 text-xs mb-1">سبب الإضافة</p>
              <Input value={addForm.description} onChange={e => setAddForm(f => ({ ...f, description: e.target.value }))} className="bg-slate-800 border-slate-700 text-white" placeholder="مثال: مكافأة المركز الأول" />
            </div>
            <div className="flex gap-2 pt-1">
              <Button
                className="flex-1 bg-yellow-600 hover:bg-yellow-700"
                disabled={addMoneyMutation.isPending || !addForm.userId || !addForm.amount}
                onClick={() => addMoneyMutation.mutate({ userId: addForm.userId, username: addForm.username, amount: parseFloat(addForm.amount), description: addForm.description || 'إضافة رصيد من الإدارة' })}
              >
                {addMoneyMutation.isPending ? 'جارٍ الإضافة...' : 'إضافة الرصيد'}
              </Button>
              <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800" onClick={() => setShowAddDialog(false)}>إلغاء</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Deduct Money Dialog */}
      <Dialog open={showDeductDialog} onOpenChange={(open) => { setShowDeductDialog(open); if (!open) setDeductForm({ userId: '', username: '', amount: '', description: '' }); }}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-sm" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Minus className="w-5 h-5 text-red-400" /> خصم رصيد من المحفظة
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <p className="text-slate-400 text-xs mb-1">معرف الطالب *</p>
              <Input value={deductForm.userId} onChange={e => setDeductForm(f => ({ ...f, userId: e.target.value }))} className="bg-slate-800 border-slate-700 text-white font-mono text-sm" placeholder="userId" dir="ltr" />
            </div>
            {deductForm.username && (
              <div className="bg-slate-800 border border-red-600/30 rounded-lg px-3 py-2 text-sm text-white">
                الطالب: <span className="font-bold text-red-300">{deductForm.username}</span>
              </div>
            )}
            <div>
              <p className="text-slate-400 text-xs mb-1">المبلغ (ر.س) *</p>
              <Input type="number" value={deductForm.amount} onChange={e => setDeductForm(f => ({ ...f, amount: e.target.value }))} className="bg-slate-800 border-slate-700 text-white" placeholder="0.00" min="0.01" step="0.01" />
            </div>
            <div>
              <p className="text-slate-400 text-xs mb-1">سبب الخصم</p>
              <Input value={deductForm.description} onChange={e => setDeductForm(f => ({ ...f, description: e.target.value }))} className="bg-slate-800 border-slate-700 text-white" placeholder="مثال: استرداد رسوم" />
            </div>
            <div className="flex gap-2 pt-1">
              <Button
                className="flex-1 bg-red-700 hover:bg-red-800"
                disabled={deductMutation.isPending || !deductForm.userId || !deductForm.amount}
                onClick={() => deductMutation.mutate({ userId: deductForm.userId, amount: parseFloat(deductForm.amount), description: deductForm.description || 'خصم من الإدارة' })}
              >
                {deductMutation.isPending ? 'جارٍ الخصم...' : 'تأكيد الخصم'}
              </Button>
              <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800" onClick={() => setShowDeductDialog(false)}>إلغاء</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reward Top 3 Dialog */}
      <Dialog open={showRewardDialog} onOpenChange={setShowRewardDialog}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" /> توزيع مكافآت المتصدرين الشهريين
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-slate-400 text-sm">حدد المبلغ لكل مركز من أفضل 3 متصدرين حقيقيين:</p>
            {(monthlyTop3Data || []).slice(0, 3).map((entry: any, i: number) => (
              <div key={entry.userId || i} className="flex items-center gap-3 bg-slate-800 rounded-xl p-3">
                <span className="text-2xl">{rankMedal(i)}</span>
                <div className="flex-1">
                  <p className="text-white font-medium text-sm">{entry.username}</p>
                  <p className="text-slate-400 text-xs">{entry.totalPoints?.toLocaleString()} نقطة</p>
                </div>
                <div className="w-28">
                  <Input
                    type="number"
                    placeholder="0 ر.س"
                    value={rewards[entry.userId] || ''}
                    onChange={e => setRewards(r => ({ ...r, [entry.userId]: e.target.value }))}
                    className="bg-slate-700 border-slate-600 text-white text-sm"
                    min="0"
                  />
                </div>
              </div>
            ))}
            <div className="flex gap-2 pt-2">
              <Button
                className="flex-1 bg-amber-600 hover:bg-amber-700"
                disabled={rewardTop3Mutation.isPending}
                onClick={() => {
                  const rewardsArr = (monthlyTop3Data || []).slice(0, 3).map((e: any, i: number) => ({
                    userId: e.userId,
                    username: e.username,
                    amount: parseFloat(rewards[e.userId] || '0'),
                    rank: i + 1,
                  })).filter((r: any) => r.amount > 0);
                  if (rewardsArr.length === 0) return;
                  rewardTop3Mutation.mutate(rewardsArr);
                }}
              >
                {rewardTop3Mutation.isPending ? 'جارٍ التوزيع...' : 'توزيع المكافآت'}
              </Button>
              <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800" onClick={() => setShowRewardDialog(false)}>إلغاء</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
