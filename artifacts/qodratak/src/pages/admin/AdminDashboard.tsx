import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import QuestionsManagementPage from './QuestionsManagementPage';
import AdminWalletsTab from './AdminWalletsTab';
import AdminSeasonalExamsTab from './AdminSeasonalExamsTab';
import WhatsAppAdminTab from './WhatsAppAdminTab';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { apiRequest } from '@/lib/queryClient';
import { clearAdminAccessToken } from '@/lib/adminSession';
import {
  Users, CreditCard, FileText, Activity, TrendingUp,
  Clock, CheckCircle, XCircle, Search, LogOut, Download,
  Calendar, DollarSign, BarChart3, AlertCircle, Building2, Mail,
  BookOpen, LayoutDashboard, Send, CalendarCheck, Eye,
  ChevronRight, Bell, Settings, Shield, Zap, Star, Trophy,
  UserCheck, UserX, RefreshCw, Filter, Phone, MessageSquare,
  Menu, X, Briefcase, PiggyBank, Plus, Trash2, Edit, ArrowUpCircle, ArrowDownCircle,
  Megaphone, Sliders, FlaskConical, ToggleLeft, ToggleRight,
  Globe, HeadphonesIcon, UserCog, KeyRound, Save,
  BellRing, Users2, CheckCheck, Clock3,
  AlertTriangle, Flag, BarChart2, MessageCircle,
  Wallet, ArrowDownLeft, ArrowUpRight, ArrowLeftRight, Gift, Sparkles
} from 'lucide-react';

interface DashboardStats {
  users: { totalUsers: number; activeToday: number; activeThisWeek: number; newUsersToday: number; newUsersThisWeek: number };
  subscriptions: { totalSubscriptions: number; activeSubscriptions: number; pendingSubscriptions: number; expiredSubscriptions: number; cancelledSubscriptions: number; newSubscriptionsToday: number; newSubscriptionsThisWeek: number; revenueThisMonth: number };
  tests: { totalTests: number; testsToday: number; testsThisWeek: number; averageScore: number; testsByType: Record<string, number> };
}

interface User { _id: string; username: string; fullName?: string; email?: string; phone?: string; points: number; level: number; lastVisit: string; totalVisits: number; totalTestsTaken: number; createdAt: string; isActive: boolean }
interface Subscription { _id: string; userId: { _id: string; username: string; fullName?: string; email?: string; phone?: string }; type: string; status: string; startDate: string; endDate: string; price: number; paymentMethod?: string; transferReceiptUrl?: string; transferReceiptFilename?: string; createdAt: string; approvedBy?: { fullName: string }; approvedAt?: string; rejectionReason?: string }
interface InstitutionRequest { _id: string; institutionName: string; responsibleName: string; phone: string; email: string; whatsapp: string; city: string; institutionType: string; studentsCount?: number; notes?: string; status: 'pending' | 'approved' | 'rejected'; createdAt: string }

const NAV_ITEMS = [
  { key: 'overview', icon: LayoutDashboard, label: 'نظرة عامة', color: 'text-[#625D69]' },
  { key: 'users', icon: Users, label: 'الطلاب', color: 'text-[#B65D36]' },
  { key: 'subscriptions', icon: CreditCard, label: 'الاشتراكات', color: 'text-[#7964C1]' },
  { key: 'tests', icon: FileText, label: 'الاختبارات', color: 'text-[#B65D36]' },
  { key: 'questions', icon: BookOpen, label: 'بنك الأسئلة', color: 'text-[#7964C1]' },
  { key: 'test-builder', icon: FlaskConical, label: 'إنشاء الاختبارات', color: 'text-[#7964C1]' },
  { key: 'announcements', icon: Megaphone, label: 'الإعلانات', color: 'text-[#B65D36]' },
  { key: 'support', icon: HeadphonesIcon, label: 'الدعم الفني', color: 'text-[#625D69]' },
  { key: 'roles', icon: UserCog, label: 'الأدوار والصلاحيات', color: 'text-[#7964C1]' },
  { key: 'settings', icon: Sliders, label: 'إعدادات المنصة', color: 'text-[#B65D36]' },
  { key: 'employees', icon: Briefcase, label: 'الموظفون', color: 'text-[#625D69]' },
  { key: 'accounting', icon: PiggyBank, label: 'المحاسبة', color: 'text-[#7964C1]' },
  { key: 'email', icon: Mail, label: 'البريد الإلكتروني', color: 'text-[#B65D36]' },
  { key: 'exams', icon: CalendarCheck, label: 'الاختبارات المجدولة', color: 'text-[#625D69]' },
  { key: 'institutions', icon: Building2, label: 'طلبات المؤسسات', color: 'text-[#B65D36]' },
  { key: 'notifications', icon: BellRing, label: 'مركز الإشعارات', color: 'text-[#7964C1]' },
  { key: 'whatsapp', icon: MessageCircle, label: 'واتساب CRM', color: 'text-[#2E8B70]' },
  { key: 'question-reports', icon: AlertTriangle, label: 'بلاغات الأسئلة', color: 'text-[#B65D36]' },
  { key: 'wallets', icon: Wallet, label: 'المحافظ والمكافآت', color: 'text-[#7964C1]' },
  { key: 'seasonal-exams', icon: Sparkles, label: 'الاختبارات الموسمية', color: 'text-[#B65D36]' },
];

function formatDate(d: string | null | undefined) {
  if (!d) return '-';
  const date = new Date(d);
  if (isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' });
}
function formatDateTime(d: string | null | undefined) {
  if (!d) return '-';
  const date = new Date(d);
  if (isNaN(date.getTime())) return '-';
  return date.toLocaleString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function StatCard({ icon: Icon, label, value, sub, color, bg }: any) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#24202D]/10 bg-[#FFFCF7] p-5 shadow-[0_6px_20px_rgba(36,32,45,0.04)]">
      <div className="absolute top-0 left-0 h-1 w-full bg-[#F4AA85]/50" />
      <div className="flex items-start justify-between">
        <div>
          <p className="mb-1 text-sm text-[#625D69]">{label}</p>
          <p className="text-3xl font-bold text-[#24202D]">{typeof value === 'number' ? value.toLocaleString('ar') : value}</p>
          {sub && <p className="mt-1 text-xs text-[#8E8993]">{sub}</p>}
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${color}`}>
          <Icon className="h-6 w-6 text-[#24202D]" />
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    active: { label: 'نشط', cls: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
    pending: { label: 'قيد المراجعة', cls: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
    expired: { label: 'منتهي', cls: 'bg-red-500/20 text-red-400 border-red-500/30' },
    cancelled: { label: 'ملغي', cls: 'bg-slate-500/20 text-slate-400 border-slate-500/30' },
    completed: { label: 'مكتمل', cls: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  };
  const s = map[status] || { label: status, cls: 'bg-slate-500/20 text-slate-400' };
  return <span className={`text-xs px-2 py-0.5 rounded-full border ${s.cls}`}>{s.label}</span>;
}

export default function AdminDashboard({ initialTab = 'overview' }: { initialTab?: string }) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [selectedInstitution, setSelectedInstitution] = useState<InstitutionRequest | null>(null);
  const [usersPage, setUsersPage] = useState(1);
  const [subscriptionsPage, setSubscriptionsPage] = useState(1);
  const [subFilter, setSubFilter] = useState('all');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showReceiptFull, setShowReceiptFull] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [emailTarget, setEmailTarget] = useState('all');
  const [examFilter, setExamFilter] = useState('all');
  const [examsPage, setExamsPage] = useState(1);
  const [showManualSubDialog, setShowManualSubDialog] = useState(false);
  const [manualSubForm, setManualSubForm] = useState({ userId: '', type: 'Pro', durationDays: '90', price: '39', notes: '' });
  const [manualSubSearch, setManualSubSearch] = useState('');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<any | null>(null);
  const [employeeForm, setEmployeeForm] = useState({ fullName: '', email: '', phone: '', role: 'موظف', department: 'خدمة العملاء', salary: '', notes: '' });
  const [expenseForm, setExpenseForm] = useState({ title: '', amount: '', category: 'عام', description: '' });

  // Question Reports state
  const [reportFilter, setReportFilter] = useState('all');
  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [reportAdminNote, setReportAdminNote] = useState('');
  const [reportFixedText, setReportFixedText] = useState('');

  // User analytics/message state
  const [selectedUserForMsg, setSelectedUserForMsg] = useState<User | null>(null);
  const [msgTitle, setMsgTitle] = useState('');
  const [msgBody, setMsgBody] = useState('');

  // Test Builder state
  const [showAddTemplate, setShowAddTemplate] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any | null>(null);
  const [templateForm, setTemplateForm] = useState({ name: '', type: 'quantitative', difficulty: 'mixed', questionCount: '20', timeLimit: '30', subcategories: '', isActive: true, isPro: false, description: '', instructions: '', order: '0' });

  // Announcements state
  const [showAddAnnouncement, setShowAddAnnouncement] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<any | null>(null);
  const [announcementForm, setAnnouncementForm] = useState({ title: '', message: '', type: 'info', target: 'all', isActive: true, expiresAt: '', link: '', linkText: '' });

  // Settings state
  const [settingsEdits, setSettingsEdits] = useState<Record<string, any>>({});
  const [savingSettings, setSavingSettings] = useState<Record<string, boolean>>({});
  const [subscriptionPlanForm, setSubscriptionPlanForm] = useState({
    name: 'خطة قدراتك',
    durationDays: '90',
    priceSar: '39',
    description: 'اشتراك كامل لمدة 3 أشهر يشمل مسارات قدراتك التعليمية.',
    features: 'وصول كامل للمحتوى والاختبارات\nحفظ التقدم والإحصائيات\nخطة يومية ومتابعة مستمرة\nدعم فني عبر واتساب',
  });

  // Support tickets state
  const [ticketFilter, setTicketFilter] = useState('all');
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [ticketNotes, setTicketNotes] = useState('');

  // Notifications state
  const [notifForm, setNotifForm] = useState({ title: '', body: '', target: 'global', targetUserId: '', type: 'info', link: '', sendWhatsApp: true });
  const [sendingNotif, setSendingNotif] = useState(false);

  // Roles/Admins state
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<any | null>(null);
  const [adminForm, setAdminForm] = useState({ username: '', password: '', fullName: '', email: '', role: 'admin', permissions: [] as string[] });

  const { data: session, isLoading: sessionLoading } = useQuery({ queryKey: ['/api/admin/session'], retry: false });
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({ queryKey: ['/api/admin/dashboard/stats'], enabled: !!(session as any)?.authenticated });
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['/api/admin/users', usersPage, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(usersPage), limit: '20', ...(searchQuery && { search: searchQuery }) });
      const res = await fetch(`/api/admin/users?${params}`, { credentials: 'include' });
      return res.json();
    },
    enabled: !!(session as any)?.authenticated && (activeTab === 'users' || showManualSubDialog),
  });
  const { data: subsData, isLoading: subsLoading } = useQuery({
    queryKey: ['/api/admin/subscriptions', subscriptionsPage, subFilter],
    queryFn: async () => {
      const effectiveFilter = subFilter === 'all' ? '' : subFilter;
      const params = new URLSearchParams({ page: String(subscriptionsPage), limit: '20', ...(effectiveFilter && { status: effectiveFilter }) });
      const res = await fetch(`/api/admin/subscriptions?${params}`, { credentials: 'include' });
      return res.json();
    },
    enabled: !!(session as any)?.authenticated && activeTab === 'subscriptions',
  });
  const { data: pendingSubs } = useQuery({ queryKey: ['/api/admin/subscriptions/pending'], enabled: !!(session as any)?.authenticated });
  const { data: institutionsData, isLoading: institutionsLoading } = useQuery({ queryKey: ['/api/admin/institution-requests'], enabled: !!(session as any)?.authenticated && activeTab === 'institutions' });
  const { data: pendingInstitutions } = useQuery({ queryKey: ['/api/admin/institution-requests?status=pending&limit=100'], enabled: !!(session as any)?.authenticated });
  const { data: examsData, isLoading: examsLoading } = useQuery({ queryKey: ['/api/admin/scheduled-exams', examFilter, examsPage], queryFn: () => fetch(`/api/admin/scheduled-exams?status=${examFilter}&page=${examsPage}&limit=20`, { credentials: 'include' }).then(r => r.json()), enabled: !!(session as any)?.authenticated && activeTab === 'exams' });
  const { data: employeesData, isLoading: employeesLoading } = useQuery({ queryKey: ['/api/admin/employees'], queryFn: () => fetch('/api/admin/employees', { credentials: 'include' }).then(r => r.json()), enabled: !!(session as any)?.authenticated && activeTab === 'employees' });
  const { data: accountingData, isLoading: accountingLoading } = useQuery({ queryKey: ['/api/admin/accounting/summary'], queryFn: () => fetch('/api/admin/accounting/summary', { credentials: 'include' }).then(r => r.json()), enabled: !!(session as any)?.authenticated && activeTab === 'accounting' });
  const { data: testTemplatesData, isLoading: templatesLoading } = useQuery({ queryKey: ['/api/admin/test-templates'], queryFn: () => fetch('/api/admin/test-templates', { credentials: 'include' }).then(r => r.json()), enabled: !!(session as any)?.authenticated && activeTab === 'test-builder' });
  const { data: announcementsData, isLoading: announcementsLoading } = useQuery({ queryKey: ['/api/admin/announcements'], queryFn: () => fetch('/api/admin/announcements', { credentials: 'include' }).then(r => r.json()), enabled: !!(session as any)?.authenticated && activeTab === 'announcements' });
  const { data: settingsData, isLoading: settingsLoading } = useQuery({ queryKey: ['/api/admin/settings'], queryFn: () => fetch('/api/admin/settings', { credentials: 'include' }).then(r => r.json()), enabled: !!(session as any)?.authenticated && activeTab === 'settings' });
  const { data: subscriptionPlanData } = useQuery({
    queryKey: ['/api/admin/subscription-plan'],
    queryFn: () => fetch('/api/admin/subscription-plan', { credentials: 'include' }).then(r => r.json()),
    enabled: !!(session as any)?.authenticated && activeTab === 'subscriptions',
  });
  const { data: ticketsData, isLoading: ticketsLoading } = useQuery({ queryKey: ['/api/admin/support-tickets', ticketFilter], queryFn: () => fetch(`/api/admin/support-tickets?status=${ticketFilter}`, { credentials: 'include' }).then(r => r.json()), enabled: !!(session as any)?.authenticated && activeTab === 'support' });
  const { data: adminsData, isLoading: adminsLoading } = useQuery({ queryKey: ['/api/admin/admins'], queryFn: () => fetch('/api/admin/admins', { credentials: 'include' }).then(r => r.json()), enabled: !!(session as any)?.authenticated && activeTab === 'roles' });
  const { data: notificationsData, isLoading: notificationsLoading, refetch: refetchNotifications } = useQuery({ queryKey: ['/api/notifications/in-app/global'], queryFn: () => fetch('/api/notifications/in-app/global?limit=50', { credentials: 'include' }).then(r => r.json()), enabled: !!(session as any)?.authenticated && activeTab === 'notifications' });
  const { data: pushStatsData } = useQuery({ queryKey: ['/api/notifications/push/stats'], queryFn: () => fetch('/api/notifications/push/stats', { credentials: 'include' }).then(r => r.json()), enabled: !!(session as any)?.authenticated && activeTab === 'notifications' });
  const { data: questionReportsData, isLoading: reportsLoading, refetch: refetchReports } = useQuery({ queryKey: ['/api/admin/question-reports', reportFilter], queryFn: () => fetch(`/api/admin/question-reports?status=${reportFilter}`, { credentials: 'include' }).then(r => r.json()), enabled: !!(session as any)?.authenticated && activeTab === 'question-reports' });
  const { data: selectedUserStats } = useQuery({ queryKey: ['/api/admin/users', selectedUser?._id, 'stats'], queryFn: () => fetch(`/api/admin/users/${selectedUser?._id}/stats`, { credentials: 'include' }).then(r => r.json()), enabled: !!(session as any)?.authenticated && !!selectedUser?._id });
  const { data: walletsData, isLoading: walletsLoading, refetch: refetchWallets } = useQuery({ queryKey: ['/api/admin/wallets'], queryFn: () => fetch('/api/admin/wallets', { credentials: 'include' }).then(r => r.json()), enabled: !!(session as any)?.authenticated && activeTab === 'wallets' });
  const { data: monthlyTop3Data, isLoading: top3Loading, refetch: refetchTop3 } = useQuery({ queryKey: ['/api/admin/leaderboard/monthly-top3'], queryFn: () => fetch('/api/admin/leaderboard/monthly-top3', { credentials: 'include' }).then(r => r.json()), enabled: !!(session as any)?.authenticated && activeTab === 'wallets' });
  const { data: seasonalExamsData, isLoading: seasonalLoading, refetch: refetchSeasonal } = useQuery({ queryKey: ['/api/admin/seasonal-exams'], queryFn: () => fetch('/api/admin/seasonal-exams', { credentials: 'include' }).then(r => r.json()), enabled: !!(session as any)?.authenticated && activeTab === 'seasonal-exams' });

  // Test template mutations
  const addTemplate = useMutation({
    mutationFn: (data: any) => fetch('/api/admin/test-templates', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data), credentials: 'include' }).then(r => r.json()),
    onSuccess: (d) => { if (d.success) { toast({ title: '✅ تم إنشاء قالب الاختبار' }); queryClient.invalidateQueries({ queryKey: ['/api/admin/test-templates'] }); setShowAddTemplate(false); setTemplateForm({ name: '', type: 'quantitative', difficulty: 'mixed', questionCount: '20', timeLimit: '30', subcategories: '', isActive: true, isPro: false, description: '', instructions: '', order: '0' }); } else toast({ title: d.error || 'خطأ', variant: 'destructive' }); },
    onError: () => toast({ title: 'فشل في إنشاء القالب', variant: 'destructive' }),
  });
  const updateTemplate = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => fetch(`/api/admin/test-templates/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data), credentials: 'include' }).then(r => r.json()),
    onSuccess: (d) => { if (d.success) { toast({ title: '✅ تم تحديث القالب' }); queryClient.invalidateQueries({ queryKey: ['/api/admin/test-templates'] }); setEditingTemplate(null); } else toast({ title: d.error || 'خطأ', variant: 'destructive' }); },
    onError: () => toast({ title: 'فشل في تحديث القالب', variant: 'destructive' }),
  });
  const deleteTemplate = useMutation({
    mutationFn: (id: string) => fetch(`/api/admin/test-templates/${id}`, { method: 'DELETE', credentials: 'include' }).then(r => r.json()),
    onSuccess: () => { toast({ title: '✅ تم حذف القالب' }); queryClient.invalidateQueries({ queryKey: ['/api/admin/test-templates'] }); },
    onError: () => toast({ title: 'فشل في حذف القالب', variant: 'destructive' }),
  });

  // Announcement mutations
  const addAnnouncement = useMutation({
    mutationFn: (data: any) => fetch('/api/admin/announcements', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data), credentials: 'include' }).then(r => r.json()),
    onSuccess: (d) => { if (d.success) { toast({ title: '✅ تم نشر الإعلان' }); queryClient.invalidateQueries({ queryKey: ['/api/admin/announcements'] }); setShowAddAnnouncement(false); setAnnouncementForm({ title: '', message: '', type: 'info', target: 'all', isActive: true, expiresAt: '', link: '', linkText: '' }); } else toast({ title: d.error || 'خطأ', variant: 'destructive' }); },
    onError: () => toast({ title: 'فشل في نشر الإعلان', variant: 'destructive' }),
  });
  const updateAnnouncement = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => fetch(`/api/admin/announcements/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data), credentials: 'include' }).then(r => r.json()),
    onSuccess: (d) => { if (d.success) { toast({ title: '✅ تم تحديث الإعلان' }); queryClient.invalidateQueries({ queryKey: ['/api/admin/announcements'] }); setEditingAnnouncement(null); } else toast({ title: d.error || 'خطأ', variant: 'destructive' }); },
    onError: () => toast({ title: 'فشل في تحديث الإعلان', variant: 'destructive' }),
  });
  const deleteAnnouncement = useMutation({
    mutationFn: (id: string) => fetch(`/api/admin/announcements/${id}`, { method: 'DELETE', credentials: 'include' }).then(r => r.json()),
    onSuccess: () => { toast({ title: '✅ تم حذف الإعلان' }); queryClient.invalidateQueries({ queryKey: ['/api/admin/announcements'] }); },
    onError: () => toast({ title: 'فشل في حذف الإعلان', variant: 'destructive' }),
  });

  // Setting mutation
  const saveSetting = async (key: string, value: any) => {
    setSavingSettings(s => ({ ...s, [key]: true }));
    try {
      const r = await fetch(`/api/admin/settings/${key}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ value }), credentials: 'include' });
      const d = await r.json();
      if (d.success) { toast({ title: '✅ تم حفظ الإعداد' }); queryClient.invalidateQueries({ queryKey: ['/api/admin/settings'] }); setSettingsEdits(e => { const n = { ...e }; delete n[key]; return n; }); }
      else toast({ title: d.error || 'خطأ', variant: 'destructive' });
    } catch { toast({ title: 'فشل في حفظ الإعداد', variant: 'destructive' }); }
    setSavingSettings(s => ({ ...s, [key]: false }));
  };

  useEffect(() => {
    const plan = (subscriptionPlanData as any)?.plan;
    if (!plan) return;
    setSubscriptionPlanForm({
      name: plan.name || 'خطة قدراتك',
      durationDays: String(plan.durationDays || 90),
      priceSar: String(plan.priceSar ?? 39),
      description: plan.description || '',
      features: Array.isArray(plan.features) ? plan.features.join('\n') : '',
    });
    setManualSubForm(current => current.type === 'Pro'
      ? { ...current, durationDays: String(plan.durationDays || 90), price: String(plan.priceSar ?? 39) }
      : current);
  }, [subscriptionPlanData]);

  const saveSubscriptionPlan = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/admin/subscription-plan', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: subscriptionPlanForm.name,
          durationDays: Number(subscriptionPlanForm.durationDays),
          priceSar: Number(subscriptionPlanForm.priceSar),
          description: subscriptionPlanForm.description,
          features: subscriptionPlanForm.features.split('\n').map(item => item.trim()).filter(Boolean),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'فشل في حفظ الخطة');
      return data;
    },
    onSuccess: () => {
      toast({ title: '✅ تم تحديث خطة الاشتراك', description: 'سيظهر السعر والمدة الجديدان في صفحة الاشتراك ومسارات الدفع.' });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/subscription-plan'] });
      queryClient.invalidateQueries({ queryKey: ['/api/subscription/plan'] });
    },
    onError: (error: Error) => toast({ title: 'تعذر تحديث خطة الاشتراك', description: error.message, variant: 'destructive' }),
  });

  // Support ticket mutation
  const updateTicket = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => fetch(`/api/admin/support-tickets/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data), credentials: 'include' }).then(r => r.json()),
    onSuccess: (d) => { if (d.success) { toast({ title: '✅ تم تحديث التذكرة' }); queryClient.invalidateQueries({ queryKey: ['/api/admin/support-tickets'] }); setSelectedTicket(null); } else toast({ title: d.error || 'خطأ', variant: 'destructive' }); },
    onError: () => toast({ title: 'فشل في تحديث التذكرة', variant: 'destructive' }),
  });
  const deleteTicket = useMutation({
    mutationFn: (id: string) => fetch(`/api/admin/support-tickets/${id}`, { method: 'DELETE', credentials: 'include' }).then(r => r.json()),
    onSuccess: () => { toast({ title: '✅ تم حذف التذكرة' }); queryClient.invalidateQueries({ queryKey: ['/api/admin/support-tickets'] }); },
    onError: () => toast({ title: 'فشل في حذف التذكرة', variant: 'destructive' }),
  });

  // Question report mutation
  const resolveReport = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => fetch(`/api/admin/question-reports/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data), credentials: 'include' }).then(r => r.json()),
    onSuccess: () => { toast({ title: '✅ تم تحديث البلاغ' }); queryClient.invalidateQueries({ queryKey: ['/api/admin/question-reports'] }); setSelectedReport(null); },
    onError: () => toast({ title: 'فشل في تحديث البلاغ', variant: 'destructive' }),
  });

  // Send user notification mutation
  const sendUserNotification = useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: any }) => fetch(`/api/admin/users/${userId}/notify`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data), credentials: 'include' }).then(r => r.json()),
    onSuccess: () => { toast({ title: '✅ تم إرسال الإشعار للطالب' }); setSelectedUserForMsg(null); setMsgTitle(''); setMsgBody(''); },
    onError: () => toast({ title: 'فشل في إرسال الإشعار', variant: 'destructive' }),
  });

  // Admin role mutations
  const addAdmin = useMutation({
    mutationFn: (data: any) => fetch('/api/admin/admins', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data), credentials: 'include' }).then(r => r.json()),
    onSuccess: (d) => { if (d.success) { toast({ title: '✅ تم إنشاء المدير' }); queryClient.invalidateQueries({ queryKey: ['/api/admin/admins'] }); setShowAddAdmin(false); setAdminForm({ username: '', password: '', fullName: '', email: '', role: 'admin', permissions: [] }); } else toast({ title: d.error || 'خطأ', variant: 'destructive' }); },
    onError: () => toast({ title: 'فشل في إنشاء المدير', variant: 'destructive' }),
  });
  const updateAdmin = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => fetch(`/api/admin/admins/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data), credentials: 'include' }).then(r => r.json()),
    onSuccess: (d) => { if (d.success) { toast({ title: '✅ تم تحديث المدير' }); queryClient.invalidateQueries({ queryKey: ['/api/admin/admins'] }); setEditingAdmin(null); } else toast({ title: d.error || 'خطأ', variant: 'destructive' }); },
    onError: () => toast({ title: 'فشل في تحديث المدير', variant: 'destructive' }),
  });
  const deleteAdmin = useMutation({
    mutationFn: (id: string) => fetch(`/api/admin/admins/${id}`, { method: 'DELETE', credentials: 'include' }).then(r => r.json()),
    onSuccess: (d) => { if (d.success) { toast({ title: '✅ تم حذف المدير' }); queryClient.invalidateQueries({ queryKey: ['/api/admin/admins'] }); } else toast({ title: d.error || 'خطأ', variant: 'destructive' }); },
    onError: () => toast({ title: 'فشل في حذف المدير', variant: 'destructive' }),
  });

  const addEmployee = useMutation({
    mutationFn: (data: any) => fetch('/api/admin/employees', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data), credentials: 'include' }).then(r => r.json()),
    onSuccess: (d) => { if (d.success) { toast({ title: '✅ تم إضافة الموظف' }); queryClient.invalidateQueries({ queryKey: ['/api/admin/employees'] }); setShowAddEmployee(false); setEmployeeForm({ fullName: '', email: '', phone: '', role: 'موظف', department: 'خدمة العملاء', salary: '', notes: '' }); } else toast({ title: d.error || 'خطأ', variant: 'destructive' }); },
    onError: () => toast({ title: 'فشل في إضافة الموظف', variant: 'destructive' }),
  });
  const updateEmployee = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => fetch(`/api/admin/employees/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data), credentials: 'include' }).then(r => r.json()),
    onSuccess: (d) => { if (d.success) { toast({ title: '✅ تم تحديث بيانات الموظف' }); queryClient.invalidateQueries({ queryKey: ['/api/admin/employees'] }); setEditingEmployee(null); } else toast({ title: d.error || 'خطأ', variant: 'destructive' }); },
    onError: () => toast({ title: 'فشل في تحديث الموظف', variant: 'destructive' }),
  });
  const deleteEmployee = useMutation({
    mutationFn: (id: string) => fetch(`/api/admin/employees/${id}`, { method: 'DELETE', credentials: 'include' }).then(r => r.json()),
    onSuccess: () => { toast({ title: '✅ تم حذف الموظف' }); queryClient.invalidateQueries({ queryKey: ['/api/admin/employees'] }); },
    onError: () => toast({ title: 'فشل في حذف الموظف', variant: 'destructive' }),
  });
  const addExpense = useMutation({
    mutationFn: (data: any) => fetch('/api/admin/accounting/expenses', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data), credentials: 'include' }).then(r => r.json()),
    onSuccess: (d) => { if (d.success) { toast({ title: '✅ تم إضافة المصروف' }); queryClient.invalidateQueries({ queryKey: ['/api/admin/accounting/summary'] }); setShowAddExpense(false); setExpenseForm({ title: '', amount: '', category: 'عام', description: '' }); } else toast({ title: d.error || 'خطأ', variant: 'destructive' }); },
    onError: () => toast({ title: 'فشل في إضافة المصروف', variant: 'destructive' }),
  });
  const deleteExpense = useMutation({
    mutationFn: (id: string) => fetch(`/api/admin/accounting/expenses/${id}`, { method: 'DELETE', credentials: 'include' }).then(r => r.json()),
    onSuccess: () => { toast({ title: '✅ تم حذف المصروف' }); queryClient.invalidateQueries({ queryKey: ['/api/admin/accounting/summary'] }); },
    onError: () => toast({ title: 'فشل في حذف المصروف', variant: 'destructive' }),
  });

  const approveSub = useMutation({
    mutationFn: async (id: string) => { const r = await fetch(`/api/admin/subscriptions/${id}/approve`, { method: 'POST', credentials: 'include' }); if (!r.ok) throw new Error(); return r.json(); },
    onSuccess: () => { toast({ title: '✅ تم قبول الاشتراك' }); queryClient.invalidateQueries({ queryKey: ['/api/admin/subscriptions'] }); queryClient.invalidateQueries({ queryKey: ['/api/admin/subscriptions/pending'] }); },
    onError: () => toast({ title: 'خطأ', variant: 'destructive' }),
  });

  const rejectSub = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => { const r = await fetch(`/api/admin/subscriptions/${id}/reject`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reason }), credentials: 'include' }); if (!r.ok) throw new Error(); return r.json(); },
    onSuccess: () => { toast({ title: '✅ تم رفض الاشتراك' }); queryClient.invalidateQueries({ queryKey: ['/api/admin/subscriptions'] }); queryClient.invalidateQueries({ queryKey: ['/api/admin/subscriptions/pending'] }); },
    onError: () => toast({ title: 'خطأ', variant: 'destructive' }),
  });

  const approveInstitution = useMutation({
    mutationFn: async (id: string) => { const r = await fetch(`/api/admin/institution-requests/${id}/approve`, { method: 'POST', credentials: 'include' }); if (!r.ok) throw new Error(); return r.json(); },
    onSuccess: () => { toast({ title: '✅ تم قبول طلب المؤسسة' }); queryClient.invalidateQueries({ queryKey: ['/api/admin/institution-requests'] }); },
    onError: () => toast({ title: 'خطأ', variant: 'destructive' }),
  });

  const rejectInstitution = useMutation({
    mutationFn: async (id: string) => { const r = await fetch(`/api/admin/institution-requests/${id}/reject`, { method: 'POST', credentials: 'include' }); if (!r.ok) throw new Error(); return r.json(); },
    onSuccess: () => { toast({ title: '✅ تم رفض طلب المؤسسة' }); queryClient.invalidateQueries({ queryKey: ['/api/admin/institution-requests'] }); },
    onError: () => toast({ title: 'خطأ', variant: 'destructive' }),
  });

  const createManualSub = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/admin/subscriptions/create-manual', data),
    onSuccess: async (res: any) => {
      const d = await res.json();
      if (d.success) {
        toast({ title: '✅ تم إنشاء الاشتراك بنجاح' });
        queryClient.invalidateQueries({ queryKey: ['/api/admin/subscriptions'] });
        setShowManualSubDialog(false);
        setManualSubForm({ userId: '', type: 'Pro', durationDays: '90', price: '39', notes: '' });
        setManualSubSearch('');
      } else {
        toast({ title: d.error || 'خطأ', variant: 'destructive' });
      }
    },
    onError: () => toast({ title: 'فشل في إنشاء الاشتراك', variant: 'destructive' }),
  });

  const broadcastEmail = useMutation({
    mutationFn: () => apiRequest('POST', '/api/admin/broadcast-email', { subject: emailSubject, body: emailBody, targetGroup: emailTarget }),
    onSuccess: async (res: any) => {
      const data = await res.json();
      toast({ title: `✅ تم الإرسال: ${data.sent} بريد بنجاح، ${data.failed} فشل` });
      setEmailSubject(''); setEmailBody('');
    },
    onError: () => toast({ title: 'فشل الإرسال', variant: 'destructive' }),
  });

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST', credentials: 'include' });
    clearAdminAccessToken();
    setLocation('/admin');
  };

  useEffect(() => {
    if (!sessionLoading && !(session as any)?.authenticated) {
      setLocation('/admin');
    }
  }, [sessionLoading, session, setLocation]);

  if (sessionLoading || !(session as any)?.authenticated) {
    return <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#F7F4EE]"><div className="h-10 w-10 animate-spin rounded-full border-4 border-[#B65D36] border-t-transparent" /><p className="text-sm text-[#625D69]">جارٍ التحقق...</p></div>;
  }

  const admin = (session as any)?.admin;
  const pendingSubCount = Array.isArray(pendingSubs) ? pendingSubs.length : (((pendingSubs as any)?.subscriptions)?.length || 0);
  const pendingInstCount = ((pendingInstitutions as any)?.requests || []).length;

  const users: User[] = (usersData as any)?.users || [];
  const subs: Subscription[] = (subsData as any)?.subscriptions || [];
  const institutions: InstitutionRequest[] = (institutionsData as any)?.requests || [];
  const exams: any[] = (examsData as any)?.exams || [];

  const handleTabChange = (key: string) => { setActiveTab(key); setIsMobileSidebarOpen(false); };

  return (
    <div className="min-h-screen bg-[#F7F4EE] text-[#24202D] flex" dir="rtl">
      {/* Mobile Overlay */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-30 lg:hidden" onClick={() => setIsMobileSidebarOpen(false)} />
      )}

      {/* ═══ SIDEBAR ═══ */}
      <aside className={`fixed lg:static inset-y-0 right-0 z-40 flex h-screen w-64 flex-shrink-0 flex-col overflow-y-auto border-l border-[#24202D]/10 bg-[#FFFCF7] transition-transform duration-300 ${isMobileSidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}`}>
        {/* Logo */}
        <div className="border-b border-[#24202D]/10 p-5">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 overflow-hidden rounded-2xl border border-[#24202D]/10 bg-[#F7F4EE] p-1">
              <img src="/qodratak-logo-transparent.png" alt="قدراتك" className="w-full h-full object-contain" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#24202D]">لوحة التحكم</p>
              <p className="flex items-center gap-1 text-xs text-[#625D69]">
                <Shield className="w-3 h-3" />
                قدراتك — المدير
              </p>
            </div>
          </div>
        </div>

        {/* Admin info */}
        <div className="border-b border-[#24202D]/10 p-4">
          <div className="flex items-center gap-3 rounded-xl border border-[#24202D]/10 bg-[#F7F4EE] p-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#24202D] text-sm font-bold text-[#FFFCF7]">
              {admin?.fullName?.[0] || admin?.username?.[0] || 'A'}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-[#24202D]">{admin?.fullName || admin?.username}</p>
              <p className="text-xs text-[#625D69]">{admin?.role === 'super_admin' ? 'مدير عام' : 'مدير'}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-0.5">
          {NAV_ITEMS.map(item => {
            const isActive = activeTab === item.key;
            const hasBadge = (item.key === 'subscriptions' && pendingSubCount > 0) || (item.key === 'institutions' && pendingInstCount > 0);
            return (
              <button
                key={item.key}
                onClick={() => handleTabChange(item.key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'border border-[#F4AA85]/40 bg-[#F4AA85]/20 text-[#24202D]'
                    : 'text-[#625D69] hover:bg-[#F7F4EE] hover:text-[#24202D]'
                }`}
              >
                <item.icon className={`h-4 w-4 ${isActive ? 'text-[#B65D36]' : item.color}`} />
                <span className="flex-1 text-right">{item.label}</span>
                {hasBadge && (
                  <span className="w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold shadow-md">
                    {item.key === 'subscriptions' ? pendingSubCount : pendingInstCount}
                  </span>
                )}
                {isActive && <ChevronRight className="h-3 w-3 text-[#B65D36]" />}
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="border-t border-[#24202D]/10 p-3">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      {/* ═══ MAIN CONTENT ═══ */}
      <main className="flex-1 overflow-y-auto min-w-0">
        {/* Top bar */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#24202D]/10 bg-[#FFFCF7]/95 px-4 py-4 backdrop-blur md:px-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsMobileSidebarOpen(true)} className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F7F4EE] text-[#625D69] transition-colors hover:text-[#24202D] lg:hidden">
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="flex items-center gap-2 text-base font-bold text-[#24202D] md:text-lg">
                {(() => { const item = NAV_ITEMS.find(n => n.key === activeTab); return item ? <item.icon className={`w-5 h-5 ${item.color}`} /> : null; })()}
                {NAV_ITEMS.find(n => n.key === activeTab)?.label}
              </h1>
              <p className="hidden text-xs text-[#625D69] md:block">{new Date().toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-[#24202D]/10 bg-[#F7F4EE] text-[#625D69] transition-colors hover:text-[#24202D]">
              <Bell className="w-4 h-4" />
              {(pendingSubCount + pendingInstCount) > 0 && (
                <span className="absolute left-1 top-1 h-2.5 w-2.5 rounded-full border border-[#FFFCF7] bg-red-500" />
              )}
            </button>
            <button onClick={() => queryClient.invalidateQueries()} className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#24202D]/10 bg-[#F7F4EE] text-[#625D69] transition-colors hover:text-[#24202D]">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-4 md:p-6">

          {/* ─── OVERVIEW ─── */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {statsLoading ? (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[...Array(8)].map((_, i) => <div key={i} className="h-28 animate-pulse rounded-2xl border border-[#24202D]/10 bg-[#FFFCF7]" />)}
                </div>
              ) : stats ? (
                <>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard icon={Users} label="إجمالي الطلاب" value={stats.users.totalUsers} sub={`+${stats.users.newUsersToday} اليوم`} color="bg-[#DDE7F7]" bg="" />
                    <StatCard icon={Activity} label="نشطون اليوم" value={stats.users.activeToday} sub={`${stats.users.activeThisWeek} هذا الأسبوع`} color="bg-[#F4AA85]/20" bg="" />
                    <StatCard icon={CreditCard} label="اشتراكات نشطة" value={stats.subscriptions.activeSubscriptions} sub={pendingSubCount > 0 ? `${pendingSubCount} بانتظار المراجعة` : undefined} color="bg-[#EAE4F7]" bg="" />
                    <StatCard icon={DollarSign} label="إيرادات الشهر" value={`${stats.subscriptions.revenueThisMonth.toLocaleString()} ر.س`} sub={`+${stats.subscriptions.newSubscriptionsThisWeek} اشتراك هذا الأسبوع`} color="bg-[#F7E8C7]" bg="" />
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard icon={FileText} label="إجمالي الاختبارات" value={stats.tests.totalTests} sub={`${stats.tests.testsToday} اليوم`} color="bg-[#FBE7D9]" bg="" />
                    <StatCard icon={Star} label="متوسط الدرجات" value={`${stats.tests.averageScore.toFixed(1)}%`} sub="عبر جميع الاختبارات" color="bg-[#F7E8C7]" bg="" />
                    <StatCard icon={TrendingUp} label="اشتراكات جديدة" value={stats.subscriptions.newSubscriptionsToday} sub="اليوم" color="bg-[#DDE7F7]" bg="" />
                    <StatCard icon={Trophy} label="متوقفون" value={stats.subscriptions.expiredSubscriptions} sub="اشتراك منتهي" color="bg-[#EAE4F7]" bg="" />
                  </div>

                  {/* Quick actions */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="rounded-2xl border border-[#24202D]/10 bg-[#FFFCF7] p-5 shadow-[0_6px_20px_rgba(36,32,45,0.04)]">
                      <h3 className="mb-4 flex items-center gap-2 font-semibold text-[#24202D]"><Zap className="h-4 w-4 text-[#B65D36]" /> إجراءات سريعة</h3>
                      <div className="space-y-2">
                        <button onClick={() => setActiveTab('subscriptions')} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-right text-sm text-[#625D69] transition-colors hover:bg-[#F7F4EE] hover:text-[#24202D]">
                          <CreditCard className="h-4 w-4 text-[#7964C1]" />
                          مراجعة الاشتراكات المعلقة
                          {pendingSubCount > 0 && <Badge className="mr-auto bg-red-500 text-white border-0 text-xs">{pendingSubCount}</Badge>}
                        </button>
                        <button onClick={() => setActiveTab('email')} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-right text-sm text-[#625D69] transition-colors hover:bg-[#F7F4EE] hover:text-[#24202D]">
                          <Mail className="h-4 w-4 text-[#B65D36]" />
                          إرسال بريد جماعي
                        </button>
                        <button onClick={() => setActiveTab('questions')} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-right text-sm text-[#625D69] transition-colors hover:bg-[#F7F4EE] hover:text-[#24202D]">
                          <BookOpen className="h-4 w-4 text-[#7964C1]" />
                          إدارة بنك الأسئلة
                        </button>
                        <button onClick={() => setActiveTab('exams')} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-right text-sm text-[#625D69] transition-colors hover:bg-[#F7F4EE] hover:text-[#24202D]">
                          <CalendarCheck className="h-4 w-4 text-[#B65D36]" />
                          عرض الاختبارات المجدولة
                        </button>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-[#24202D]/10 bg-[#FFFCF7] p-5 shadow-[0_6px_20px_rgba(36,32,45,0.04)]">
                      <h3 className="mb-4 flex items-center gap-2 font-semibold text-[#24202D]"><BarChart3 className="h-4 w-4 text-[#7964C1]" /> حالة النظام</h3>
                      <div className="space-y-3">
                        {[
                          { label: 'قاعدة البيانات', status: 'متصلة', ok: true },
                          { label: 'خدمة البريد', status: 'جاهزة', ok: true },
                          { label: 'الخادم', status: 'يعمل', ok: true },
                          { label: 'WebSocket', status: 'نشط', ok: true },
                        ].map(s => (
                          <div key={s.label} className="flex items-center justify-between">
                            <span className="text-sm text-[#625D69]">{s.label}</span>
                            <span className={`rounded-full px-2 py-0.5 text-xs ${s.ok ? 'bg-[#F4AA85]/20 text-[#8D482C]' : 'bg-red-500/10 text-red-600'}`}>{s.status}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-[#24202D]/10 bg-[#FFFCF7] p-5 shadow-[0_6px_20px_rgba(36,32,45,0.04)]">
                      <h3 className="mb-4 flex items-center gap-2 font-semibold text-[#24202D]"><Bell className="h-4 w-4 text-[#B65D36]" /> تنبيهات</h3>
                      <div className="space-y-2">
                        {pendingSubCount > 0 && (
                          <div className="flex items-center gap-2 rounded-lg bg-[#F7E8C7]/60 p-2 text-sm text-[#7D5A18]">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            {pendingSubCount} اشتراك بانتظار المراجعة
                          </div>
                        )}
                        {pendingInstCount > 0 && (
                          <div className="flex items-center gap-2 rounded-lg bg-[#FBE7D9] p-2 text-sm text-[#8D482C]">
                            <Building2 className="w-4 h-4 flex-shrink-0" />
                            {pendingInstCount} طلب مؤسسة جديد
                          </div>
                        )}
                        {pendingSubCount === 0 && pendingInstCount === 0 && (
                          <div className="flex items-center gap-2 rounded-lg bg-[#F7F4EE] p-2 text-sm text-[#625D69]">
                            <CheckCircle className="w-4 h-4 flex-shrink-0" />
                            لا توجد تنبيهات معلقة
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          )}

          {/* ─── USERS ─── */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setUsersPage(1); }} placeholder="بحث بالاسم أو البريد..." className="pr-9 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500" />
                </div>
              </div>

              <div className="bg-emerald-900/20 rounded-2xl border border-emerald-900/40 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-emerald-800/30">
                      <tr>
                        {['الطالب', 'البريد الإلكتروني', 'النقاط', 'المستوى', 'الاختبارات', 'آخر زيارة', 'إجراءات'].map(h => (
                          <th key={h} className="text-right text-slate-400 text-xs font-semibold px-4 py-3">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {usersLoading ? (
                        [...Array(8)].map((_, i) => (
                          <tr key={i}><td colSpan={7} className="px-4 py-3"><div className="h-4 bg-slate-800 rounded animate-pulse" /></td></tr>
                        ))
                      ) : users.map(u => (
                        <tr key={u._id} className="hover:bg-emerald-900/20 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xs font-bold">
                                {(u.fullName || u.username)?.[0]?.toUpperCase()}
                              </div>
                              <div>
                                <p className="text-white text-sm font-medium">{u.fullName || u.username}</p>
                                <p className="text-slate-400 text-xs">@{u.username}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-slate-300 text-sm">{u.email || '-'}</td>
                          <td className="px-4 py-3 text-yellow-400 text-sm font-medium">{u.points.toLocaleString()}</td>
                          <td className="px-4 py-3"><span className="bg-emerald-500/20 text-emerald-300 text-xs px-2 py-0.5 rounded-full">مستوى {u.level}</span></td>
                          <td className="px-4 py-3 text-slate-300 text-sm">{u.totalTestsTaken}</td>
                          <td className="px-4 py-3 text-slate-400 text-xs">{u.lastVisit ? formatDate(u.lastVisit) : '-'}</td>
                          <td className="px-4 py-3">
                            <button onClick={() => setSelectedUser(u)} className="text-blue-400 hover:text-blue-300 text-xs flex items-center gap-1 transition-colors">
                              <Eye className="w-3.5 h-3.5" /> تفاصيل
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800">
                  <span className="text-slate-400 text-sm">{(usersData as any)?.total || 0} طالب</span>
                  <div className="flex gap-2">
                    <button onClick={() => setUsersPage(p => Math.max(1, p - 1))} disabled={usersPage === 1} className="px-3 py-1 text-xs rounded-lg bg-slate-800 text-slate-300 disabled:opacity-40 hover:bg-slate-700 transition-colors">السابق</button>
                    <span className="px-3 py-1 text-xs text-slate-400">صفحة {usersPage}</span>
                    <button onClick={() => setUsersPage(p => p + 1)} disabled={users.length < 20} className="px-3 py-1 text-xs rounded-lg bg-slate-800 text-slate-300 disabled:opacity-40 hover:bg-slate-700 transition-colors">التالي</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── SUBSCRIPTIONS ─── */}
          {activeTab === 'subscriptions' && (
            <div className="space-y-4">
              {pendingSubCount > 0 && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-4 flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                  <p className="text-yellow-300 text-sm font-medium">{pendingSubCount} اشتراك بانتظار المراجعة والموافقة</p>
                </div>
              )}
              <div className="rounded-2xl border border-orange-500/20 bg-orange-500/5 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="flex items-center gap-2 text-white font-bold">
                      <CreditCard className="w-5 h-5 text-orange-300" />
                      الخطة التي يراها الطالب
                    </h3>
                    <p className="mt-1 text-xs leading-5 text-slate-400">
                      عدّل السعر والمدة من هنا. صفحة الاشتراك وطلبات الدفع تستخدمان نفس القيم تلقائيًا، والاشتراكات القديمة لا تتغير.
                    </p>
                  </div>
                  <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-300">خطة واحدة — 3 أشهر</span>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <label className="text-xs font-bold text-slate-300">
                    اسم الخطة
                    <Input value={subscriptionPlanForm.name} onChange={e => setSubscriptionPlanForm(f => ({ ...f, name: e.target.value }))} className="mt-1 h-10 border-slate-700 bg-slate-800 text-white" />
                  </label>
                  <label className="text-xs font-bold text-slate-300">
                    المدة بالأيام
                    <Input type="number" min="1" value={subscriptionPlanForm.durationDays} onChange={e => setSubscriptionPlanForm(f => ({ ...f, durationDays: e.target.value }))} className="mt-1 h-10 border-slate-700 bg-slate-800 text-white" />
                  </label>
                  <label className="text-xs font-bold text-slate-300">
                    السعر بالريال
                    <Input type="number" min="0" step="0.01" value={subscriptionPlanForm.priceSar} onChange={e => setSubscriptionPlanForm(f => ({ ...f, priceSar: e.target.value }))} className="mt-1 h-10 border-slate-700 bg-slate-800 text-white" />
                  </label>
                  <label className="text-xs font-bold text-slate-300 md:col-span-3">
                    وصف الخطة
                    <Input value={subscriptionPlanForm.description} onChange={e => setSubscriptionPlanForm(f => ({ ...f, description: e.target.value }))} className="mt-1 h-10 border-slate-700 bg-slate-800 text-white" />
                  </label>
                  <label className="text-xs font-bold text-slate-300 md:col-span-3">
                    المميزات — ميزة في كل سطر
                    <Textarea value={subscriptionPlanForm.features} onChange={e => setSubscriptionPlanForm(f => ({ ...f, features: e.target.value }))} className="mt-1 min-h-24 border-slate-700 bg-slate-800 text-white" />
                  </label>
                </div>
                <Button
                  onClick={() => saveSubscriptionPlan.mutate()}
                  disabled={saveSubscriptionPlan.isPending || !subscriptionPlanForm.name.trim() || !subscriptionPlanForm.durationDays || !subscriptionPlanForm.priceSar}
                  className="mt-4 gap-2 bg-orange-600 text-white hover:bg-orange-700"
                >
                  <Save className="w-4 h-4" />
                  {saveSubscriptionPlan.isPending ? 'جارٍ الحفظ...' : 'حفظ الخطة والسعر'}
                </Button>
              </div>
              <div className="flex gap-3 flex-wrap items-center">
                <Button
                  onClick={() => setShowManualSubDialog(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 text-sm"
                  data-testid="button-add-manual-sub"
                >
                  <CheckCircle className="w-4 h-4" />
                  إضافة اشتراك يدوي
                </Button>
                <Select value={subFilter} onValueChange={v => { setSubFilter(v); setSubscriptionsPage(1); }}>
                  <SelectTrigger className="w-40 bg-slate-800 border-slate-700 text-white">
                    <Filter className="w-4 h-4 ml-1 text-slate-400" />
                    <SelectValue placeholder="كل الحالات" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="all">كل الحالات</SelectItem>
                    <SelectItem value="pending">معلق</SelectItem>
                    <SelectItem value="active">نشط</SelectItem>
                    <SelectItem value="expired">منتهي</SelectItem>
                    <SelectItem value="cancelled">ملغي</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="bg-emerald-900/20 rounded-2xl border border-emerald-900/40 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-emerald-800/30">
                      <tr>
                        {['الطالب', 'النوع', 'السعر', 'الحالة', 'تاريخ البدء', 'تاريخ الانتهاء', 'إجراءات'].map(h => (
                          <th key={h} className="text-right text-slate-400 text-xs font-semibold px-4 py-3">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {subsLoading ? (
                        [...Array(6)].map((_, i) => <tr key={i}><td colSpan={7} className="px-4 py-3"><div className="h-4 bg-slate-800 rounded animate-pulse" /></td></tr>)
                      ) : subs.length === 0 ? (
                        <tr><td colSpan={7} className="text-center py-12 text-slate-500">
                          <CreditCard className="w-10 h-10 mx-auto mb-2 opacity-30" />
                          <p>لا توجد اشتراكات</p>
                        </td></tr>
                      ) : subs.map(s => (
                        <tr key={s._id} className={`hover:bg-emerald-900/20 transition-colors ${s.status === 'pending' ? 'border-r-2 border-amber-500' : ''}`}>
                          <td className="px-4 py-3">
                            <div className="text-white text-sm font-medium">{(s.userId as any)?.username || (s.userId as any)?.fullName || '-'}</div>
                            <div className="text-slate-500 text-xs">{(s.userId as any)?.email || ''}</div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                              s.type === 'Pro Life Plus' ? 'bg-green-900/50 text-green-300' :
                              s.type === 'Pro Life' ? 'bg-blue-900/50 text-blue-300' :
                              'bg-slate-700 text-slate-300'
                            }`}>{s.type}</span>
                          </td>
                          <td className="px-4 py-3 text-yellow-400 text-sm font-bold">{s.price} ر.س</td>
                          <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                          <td className="px-4 py-3 text-slate-400 text-xs">{formatDate(s.startDate)}</td>
                          <td className="px-4 py-3 text-slate-400 text-xs">{formatDate(s.endDate)}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2 flex-wrap">
                              {/* Receipt indicator */}
                              {(s as any).transferReceiptUrl ? (
                                <span className="text-xs bg-emerald-900/50 text-emerald-300 px-1.5 py-0.5 rounded flex items-center gap-1">
                                  <Download className="w-3 h-3" /> سند
                                </span>
                              ) : (
                                <span className="text-xs bg-red-900/30 text-red-400 px-1.5 py-0.5 rounded">بلا سند</span>
                              )}
                              <button onClick={() => setSelectedSubscription(s)} className="text-blue-400 hover:text-blue-300 transition-colors">
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              {s.status === 'pending' && (
                                <>
                                  <button onClick={() => approveSub.mutate(s._id)} disabled={approveSub.isPending} className="text-emerald-400 hover:text-emerald-300 text-xs flex items-center gap-1 transition-colors">
                                    <UserCheck className="w-3.5 h-3.5" /> قبول
                                  </button>
                                  <button onClick={() => rejectSub.mutate({ id: s._id, reason: 'رفض من الإدارة' })} disabled={rejectSub.isPending} className="text-red-400 hover:text-red-300 text-xs flex items-center gap-1 transition-colors">
                                    <UserX className="w-3.5 h-3.5" /> رفض
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800">
                  <span className="text-slate-400 text-sm">{(subsData as any)?.total || 0} اشتراك</span>
                  <div className="flex gap-2">
                    <button onClick={() => setSubscriptionsPage(p => Math.max(1, p - 1))} disabled={subscriptionsPage === 1} className="px-3 py-1 text-xs rounded-lg bg-slate-800 text-slate-300 disabled:opacity-40 hover:bg-slate-700 transition-colors">السابق</button>
                    <span className="px-3 py-1 text-xs text-slate-400">صفحة {subscriptionsPage}</span>
                    <button onClick={() => setSubscriptionsPage(p => p + 1)} disabled={subs.length < 20} className="px-3 py-1 text-xs rounded-lg bg-slate-800 text-slate-300 disabled:opacity-40 hover:bg-slate-700 transition-colors">التالي</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── TESTS ─── */}
          {activeTab === 'tests' && stats && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={FileText} label="إجمالي الاختبارات" value={stats.tests.totalTests} sub="" color="bg-orange-500/20" bg="bg-gradient-to-br from-orange-600/20 to-orange-800/20" />
                <StatCard icon={Clock} label="اختبارات اليوم" value={stats.tests.testsToday} sub="" color="bg-blue-500/20" bg="bg-gradient-to-br from-blue-600/20 to-blue-800/20" />
                <StatCard icon={Activity} label="هذا الأسبوع" value={stats.tests.testsThisWeek} sub="" color="bg-emerald-500/20" bg="bg-gradient-to-br from-emerald-600/20 to-emerald-800/20" />
                <StatCard icon={Star} label="متوسط الدرجات" value={`${stats.tests.averageScore.toFixed(1)}%`} sub="" color="bg-yellow-500/20" bg="bg-gradient-to-br from-yellow-600/20 to-yellow-800/20" />
              </div>
              <div className="bg-emerald-900/20 rounded-2xl p-5 border border-emerald-900/40">
                <h3 className="text-white font-semibold mb-4">توزيع أنواع الاختبارات</h3>
                <div className="space-y-3">
                  {Object.entries(stats.tests.testsByType || {}).map(([type, count]) => (
                    <div key={type} className="flex items-center gap-3">
                      <span className="text-slate-400 text-sm w-32 shrink-0">{type}</span>
                      <div className="flex-1 bg-slate-800 rounded-full h-2">
                        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2 rounded-full" style={{ width: `${Math.min(100, (count as number / stats.tests.totalTests) * 100)}%` }} />
                      </div>
                      <span className="text-white text-sm font-medium w-12 text-left">{(count as number).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ─── QUESTIONS ─── */}
          {activeTab === 'questions' && (
            <div className="bg-white rounded-2xl overflow-hidden">
              <QuestionsManagementPage />
            </div>
          )}

          {/* ─── EMAIL BROADCAST ─── */}
          {activeTab === 'email' && (
            <div className="max-w-2xl space-y-5">
              <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                    <Send className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div>
                    <h2 className="text-white font-bold">إرسال بريد جماعي</h2>
                    <p className="text-slate-400 text-sm">أرسل رسالة بريدية لمجموعة من الطلاب</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-slate-300 text-sm font-medium block mb-2">الفئة المستهدفة</label>
                    <Select value={emailTarget} onValueChange={setEmailTarget}>
                      <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="all">جميع الطلاب</SelectItem>
                        <SelectItem value="subscribed">المشتركون فقط</SelectItem>
                        <SelectItem value="free">المجانيون فقط</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-slate-300 text-sm font-medium block mb-2">موضوع الرسالة</label>
                    <Input
                      value={emailSubject}
                      onChange={e => setEmailSubject(e.target.value)}
                      placeholder="أدخل موضوع الرسالة..."
                      className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                      data-testid="input-email-subject"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 text-sm font-medium block mb-2">محتوى الرسالة</label>
                    <Textarea
                      value={emailBody}
                      onChange={e => setEmailBody(e.target.value)}
                      placeholder="اكتب محتوى الرسالة هنا..."
                      rows={8}
                      className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 resize-none"
                      data-testid="textarea-email-body"
                    />
                  </div>

                  <Button
                    onClick={() => broadcastEmail.mutate()}
                    disabled={!emailSubject.trim() || !emailBody.trim() || broadcastEmail.isPending}
                    className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white border-0 font-semibold"
                    data-testid="button-send-broadcast"
                  >
                    {broadcastEmail.isPending ? (
                      <><RefreshCw className="w-4 h-4 ml-2 animate-spin" />جارٍ الإرسال...</>
                    ) : (
                      <><Send className="w-4 h-4 ml-2" />إرسال البريد الجماعي</>
                    )}
                  </Button>
                </div>
              </div>

              <div className="bg-emerald-900/20 rounded-2xl p-5 border border-emerald-900/40">
                <h3 className="text-white font-semibold mb-3 flex items-center gap-2"><MessageSquare className="w-4 h-4 text-cyan-400" />تلميحات</h3>
                <ul className="space-y-2 text-slate-400 text-sm">
                  <li>• الرسائل ترسل من noreply@qodratak.sa</li>
                  <li>• اختر الفئة المستهدفة بعناية قبل الإرسال</li>
                  <li>• يمكنك استخدام سطر جديد لتنسيق النص</li>
                  <li>• الرسائل ترسل بتصميم احترافي تلقائياً</li>
                </ul>
              </div>
            </div>
          )}

          {/* ─── SCHEDULED EXAMS ─── */}
          {activeTab === 'exams' && (
            <div className="space-y-4">
              <div className="flex gap-3">
                <Select value={examFilter} onValueChange={v => { setExamFilter(v); setExamsPage(1); }}>
                  <SelectTrigger className="w-40 bg-slate-800 border-slate-700 text-white">
                    <Filter className="w-4 h-4 ml-1 text-slate-400" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="all">كل الحالات</SelectItem>
                    <SelectItem value="pending">محجوز</SelectItem>
                    <SelectItem value="active">جارٍ</SelectItem>
                    <SelectItem value="completed">مكتمل</SelectItem>
                    <SelectItem value="cancelled">ملغي</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="bg-emerald-900/20 rounded-2xl border border-emerald-900/40 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-emerald-800/30">
                      <tr>
                        {['الطالب', 'موعد الاختبار', 'الحالة', 'الدرجة', 'لفظي', 'كمي', 'غش'].map(h => (
                          <th key={h} className="text-right text-slate-400 text-xs font-semibold px-4 py-3">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {examsLoading ? (
                        [...Array(6)].map((_, i) => <tr key={i}><td colSpan={7} className="px-4 py-3"><div className="h-4 bg-slate-800 rounded animate-pulse" /></td></tr>)
                      ) : exams.map(e => (
                        <tr key={e._id} className="hover:bg-emerald-900/20 transition-colors">
                          <td className="px-4 py-3 text-white text-sm">{(e.userId as any)?.username || '-'}</td>
                          <td className="px-4 py-3 text-slate-300 text-xs">{formatDateTime(e.scheduledAt)}</td>
                          <td className="px-4 py-3"><StatusBadge status={e.status} /></td>
                          <td className="px-4 py-3 text-yellow-400 font-medium text-sm">{e.totalScoreOutOf100 != null ? `${e.totalScoreOutOf100}/100` : '-'}</td>
                          <td className="px-4 py-3 text-blue-400 text-sm">{e.verbalPercent != null ? `${e.verbalPercent}%` : '-'}</td>
                          <td className="px-4 py-3 text-emerald-400 text-sm">{e.quantPercent != null ? `${e.quantPercent}%` : '-'}</td>
                          <td className="px-4 py-3">{e.cheatingFlag ? <span className="text-red-400 text-xs">⚠ يوجد</span> : <span className="text-slate-500 text-xs">لا</span>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800">
                  <span className="text-slate-400 text-sm">{(examsData as any)?.total || 0} اختبار</span>
                  <div className="flex gap-2">
                    <button onClick={() => setExamsPage(p => Math.max(1, p - 1))} disabled={examsPage === 1} className="px-3 py-1 text-xs rounded-lg bg-slate-800 text-slate-300 disabled:opacity-40 hover:bg-slate-700 transition-colors">السابق</button>
                    <span className="px-3 py-1 text-xs text-slate-400">صفحة {examsPage}</span>
                    <button onClick={() => setExamsPage(p => p + 1)} disabled={exams.length < 20} className="px-3 py-1 text-xs rounded-lg bg-slate-800 text-slate-300 disabled:opacity-40 hover:bg-slate-700 transition-colors">التالي</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── INSTITUTIONS ─── */}
          {activeTab === 'institutions' && (
            <div className="space-y-4">
              {pendingInstCount > 0 && (
                <div className="bg-orange-500/10 border border-orange-500/30 rounded-2xl p-4 flex items-center gap-3">
                  <Building2 className="w-5 h-5 text-orange-400 flex-shrink-0" />
                  <p className="text-orange-300 text-sm font-medium">{pendingInstCount} طلب مؤسسة بانتظار المراجعة</p>
                </div>
              )}
              <div className="bg-emerald-900/20 rounded-2xl border border-emerald-900/40 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-emerald-800/30">
                      <tr>
                        {['المؤسسة', 'المسؤول', 'المدينة', 'البريد', 'الحالة', 'التاريخ', 'إجراءات'].map(h => (
                          <th key={h} className="text-right text-slate-400 text-xs font-semibold px-4 py-3">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {institutionsLoading ? (
                        [...Array(5)].map((_, i) => <tr key={i}><td colSpan={7} className="px-4 py-3"><div className="h-4 bg-slate-800 rounded animate-pulse" /></td></tr>)
                      ) : institutions.map(inst => (
                        <tr key={inst._id} className="hover:bg-emerald-900/20 transition-colors">
                          <td className="px-4 py-3 text-white text-sm font-medium">{inst.institutionName}</td>
                          <td className="px-4 py-3 text-slate-300 text-sm">{inst.responsibleName}</td>
                          <td className="px-4 py-3 text-slate-400 text-sm">{inst.city}</td>
                          <td className="px-4 py-3 text-slate-400 text-xs">{inst.email}</td>
                          <td className="px-4 py-3"><StatusBadge status={inst.status} /></td>
                          <td className="px-4 py-3 text-slate-400 text-xs">{formatDate(inst.createdAt)}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <button onClick={() => setSelectedInstitution(inst)} className="text-blue-400 hover:text-blue-300 text-xs flex items-center gap-1 transition-colors">
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              {inst.status === 'pending' && (
                                <>
                                  <button onClick={() => approveInstitution.mutate(inst._id)} disabled={approveInstitution.isPending} className="text-emerald-400 hover:text-emerald-300 text-xs transition-colors">قبول</button>
                                  <button onClick={() => rejectInstitution.mutate(inst._id)} disabled={rejectInstitution.isPending} className="text-red-400 hover:text-red-300 text-xs transition-colors">رفض</button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ─── EMPLOYEES ─── */}
          {activeTab === 'employees' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-white font-bold text-xl">إدارة الموظفين</h2>
                <Button onClick={() => { setShowAddEmployee(true); setEditingEmployee(null); setEmployeeForm({ fullName: '', email: '', phone: '', role: 'موظف', department: 'خدمة العملاء', salary: '', notes: '' }); }} className="bg-teal-600 hover:bg-teal-700 gap-2">
                  <Plus className="w-4 h-4" /> إضافة موظف
                </Button>
              </div>
              {employeesLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...Array(6)].map((_, i) => <div key={i} className="h-40 bg-slate-800 rounded-2xl animate-pulse" />)}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {((employeesData as any)?.employees || []).length === 0 ? (
                    <div className="col-span-3 text-center py-16 text-slate-400">
                      <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>لا يوجد موظفون. ابدأ بإضافة موظف جديد.</p>
                    </div>
                  ) : ((employeesData as any)?.employees || []).map((emp: any) => (
                    <div key={emp._id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-teal-500/30 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white font-bold text-lg">
                            {emp.fullName?.[0]?.toUpperCase()}
                          </div>
                          <div>
                            <p className="text-white font-semibold">{emp.fullName}</p>
                            <p className="text-slate-400 text-xs">{emp.role}</p>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => { setEditingEmployee(emp); setEmployeeForm({ fullName: emp.fullName, email: emp.email || '', phone: emp.phone || '', role: emp.role, department: emp.department, salary: String(emp.salary || ''), notes: emp.notes || '' }); setShowAddEmployee(true); }} className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-blue-600/20 flex items-center justify-center text-slate-400 hover:text-blue-400 transition-colors">
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => { if (confirm('هل أنت متأكد من حذف هذا الموظف؟')) deleteEmployee.mutate(emp._id); }} className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-red-600/20 flex items-center justify-center text-slate-400 hover:text-red-400 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="space-y-1.5 text-sm">
                        {emp.email && <p className="text-slate-400 flex items-center gap-2"><Mail className="w-3.5 h-3.5" />{emp.email}</p>}
                        {emp.phone && <p className="text-slate-400 flex items-center gap-2"><Phone className="w-3.5 h-3.5" />{emp.phone}</p>}
                        <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-800">
                          <span className="text-xs text-slate-500">{emp.department}</span>
                          {emp.salary ? <span className="text-emerald-400 font-semibold">{Number(emp.salary).toLocaleString()} ر.س</span> : null}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ─── ACCOUNTING ─── */}
          {activeTab === 'accounting' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-white font-bold text-xl">المحاسبة والتقارير المالية</h2>
                <Button onClick={() => setShowAddExpense(true)} className="bg-green-600 hover:bg-green-700 gap-2">
                  <Plus className="w-4 h-4" /> إضافة مصروف
                </Button>
              </div>
              {accountingLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[...Array(3)].map((_, i) => <div key={i} className="h-28 bg-slate-800 rounded-2xl animate-pulse" />)}
                </div>
              ) : (() => {
                const acc = accountingData as any;
                const totalRevenue = acc?.revenue?.total || 0;
                const totalExpenses = acc?.expenses?.thisYear || 0;
                const netProfit = acc?.profit?.thisYear || 0;
                const expensesList: any[] = acc?.expenses?.list || [];
                return (
                <>
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { label: 'إجمالي الإيرادات', value: totalRevenue, sub: `هذا الشهر: ${(acc?.revenue?.thisMonth || 0).toLocaleString()}`, icon: ArrowUpCircle, color: 'from-emerald-500 to-green-600', textColor: 'text-emerald-400' },
                      { label: 'إجمالي المصروفات', value: totalExpenses, sub: `هذا الشهر: ${(acc?.expenses?.thisMonth || 0).toLocaleString()}`, icon: ArrowDownCircle, color: 'from-red-500 to-rose-600', textColor: 'text-red-400' },
                      { label: 'صافي الربح (هذا العام)', value: netProfit, sub: `هذا الشهر: ${(acc?.profit?.thisMonth || 0).toLocaleString()}`, icon: TrendingUp, color: 'from-blue-500 to-emerald-600', textColor: 'text-blue-400' },
                      { label: 'رواتب الموظفين/شهر', value: acc?.employees?.monthlySalaries || 0, sub: `${acc?.employees?.count || 0} موظف نشط`, icon: Briefcase, color: 'from-teal-500 to-green-600', textColor: 'text-teal-400' },
                    ].map(card => (
                      <div key={card.label} className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center`}>
                            <card.icon className="w-5 h-5 text-white" />
                          </div>
                          <p className="text-slate-400 text-sm">{card.label}</p>
                        </div>
                        <p className={`text-2xl font-bold ${card.textColor}`}>{Number(card.value).toLocaleString()} <span className="text-sm font-normal text-slate-500">ر.س</span></p>
                        <p className="text-slate-500 text-xs mt-1">{card.sub} ر.س</p>
                      </div>
                    ))}
                  </div>

                  {/* Revenue by subscription type */}
                  {acc?.revenue?.byType?.length > 0 && (
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                      <h3 className="text-white font-semibold mb-4">إيرادات هذا الشهر حسب نوع الاشتراك</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {acc.revenue.byType.map((t: any) => (
                          <div key={t._id} className="bg-slate-800 rounded-xl p-3 text-center">
                            <p className="text-slate-400 text-xs mb-1">{t._id === 'pro' ? 'برو' : t._id === 'vip' ? 'VIP' : t._id}</p>
                            <p className="text-white font-bold">{Number(t.total).toLocaleString()} <span className="text-xs text-slate-400">ر.س</span></p>
                            <p className="text-slate-500 text-xs">{t.count} اشتراك</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Expenses List */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
                      <h3 className="text-white font-semibold">سجل المصروفات</h3>
                      <span className="text-slate-400 text-sm">{expensesList.length} مصروف</span>
                    </div>
                    {expensesList.length === 0 ? (
                      <div className="text-center py-12 text-slate-400">
                        <PiggyBank className="w-10 h-10 mx-auto mb-3 opacity-30" />
                        <p>لا توجد مصروفات مسجلة</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-emerald-800/30">
                            <tr>
                              {['العنوان', 'الفئة', 'المبلغ', 'التاريخ', 'إجراءات'].map(h => (
                                <th key={h} className="text-right text-slate-400 text-xs font-semibold px-4 py-3">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800">
                            {expensesList.map((exp: any) => (
                              <tr key={exp._id} className="hover:bg-emerald-900/20 transition-colors">
                                <td className="px-4 py-3 text-white text-sm font-medium">{exp.title}</td>
                                <td className="px-4 py-3"><span className="text-xs px-2 py-1 rounded-full bg-slate-700 text-slate-300">{exp.category}</span></td>
                                <td className="px-4 py-3 text-red-400 font-semibold">{Number(exp.amount).toLocaleString()} ر.س</td>
                                <td className="px-4 py-3 text-slate-400 text-sm">{formatDate(exp.date)}</td>
                                <td className="px-4 py-3">
                                  <button onClick={() => { if (confirm('حذف هذا المصروف؟')) deleteExpense.mutate(exp._id); }} className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-red-600/20 flex items-center justify-center text-slate-400 hover:text-red-400 transition-colors">
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </>
              );})()}
            </div>
          )}

          {/* ─── TEST BUILDER TAB ─── */}
          {activeTab === 'test-builder' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-white text-xl font-bold flex items-center gap-2"><FlaskConical className="w-5 h-5 text-amber-400" /> إنشاء الاختبارات</h2>
                  <p className="text-slate-400 text-sm mt-1">أنشئ وأدر قوالب الاختبارات الكمية واللفظية</p>
                </div>
                <Button className="bg-amber-600 hover:bg-amber-700 gap-2" onClick={() => { setEditingTemplate(null); setTemplateForm({ name: '', type: 'quantitative', difficulty: 'mixed', questionCount: '20', timeLimit: '30', subcategories: '', isActive: true, isPro: false, description: '', instructions: '', order: '0' }); setShowAddTemplate(true); }}>
                  <Plus className="w-4 h-4" /> إنشاء اختبار جديد
                </Button>
              </div>

              {templatesLoading ? (
                <div className="text-center py-16 text-slate-400">جارٍ التحميل...</div>
              ) : !testTemplatesData?.templates?.length ? (
                <div className="bg-emerald-900/20 rounded-2xl border border-emerald-900/40 py-16 text-center text-slate-400">
                  <FlaskConical className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">لا توجد قوالب اختبارات بعد</p>
                  <p className="text-sm mt-1">أنشئ أول قالب اختبار الآن</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {testTemplatesData.templates.map((t: any) => (
                    <div key={t._id} className={`bg-slate-900 rounded-2xl border p-5 space-y-3 relative ${t.isActive ? 'border-slate-700' : 'border-slate-800 opacity-60'}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="text-white font-bold text-sm">{t.name}</h3>
                          <p className="text-slate-400 text-xs mt-0.5">{t.description || 'بدون وصف'}</p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button onClick={() => { setEditingTemplate(t); setTemplateForm({ name: t.name, type: t.type, difficulty: t.difficulty, questionCount: String(t.questionCount), timeLimit: String(t.timeLimit), subcategories: (t.subcategories || []).join(', '), isActive: t.isActive, isPro: t.isPro, description: t.description || '', instructions: t.instructions || '', order: String(t.order) }); setShowAddTemplate(true); }} className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-blue-600/20 flex items-center justify-center text-slate-400 hover:text-blue-400 transition-colors"><Edit className="w-3 h-3" /></button>
                          <button onClick={() => { if (confirm('حذف هذا القالب؟')) deleteTemplate.mutate(t._id); }} className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-red-600/20 flex items-center justify-center text-slate-400 hover:text-red-400 transition-colors"><Trash2 className="w-3 h-3" /></button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${t.type === 'quantitative' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : t.type === 'verbal' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-amber-500/20 text-amber-400 border-amber-500/30'}`}>{t.type === 'quantitative' ? 'كمي' : t.type === 'verbal' ? 'لفظي' : 'مختلط'}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full border bg-slate-700/50 text-slate-300 border-slate-600">{t.questionCount} سؤال</span>
                        <span className="text-xs px-2 py-0.5 rounded-full border bg-slate-700/50 text-slate-300 border-slate-600">{t.timeLimit} دقيقة</span>
                        {t.isPro && <span className="text-xs px-2 py-0.5 rounded-full border bg-amber-500/20 text-amber-400 border-amber-500/30">Pro</span>}
                        {!t.isActive && <span className="text-xs px-2 py-0.5 rounded-full border bg-slate-600/30 text-slate-500 border-slate-600">مخفي</span>}
                      </div>
                      {t.subcategories?.length > 0 && <p className="text-slate-500 text-xs">الأقسام: {t.subcategories.join('، ')}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ─── ANNOUNCEMENTS TAB ─── */}
          {activeTab === 'announcements' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-white text-xl font-bold flex items-center gap-2"><Megaphone className="w-5 h-5 text-sky-400" /> الإعلانات والتنبيهات</h2>
                  <p className="text-slate-400 text-sm mt-1">أرسل إعلانات وتنبيهات للطلاب داخل المنصة</p>
                </div>
                <Button className="bg-sky-600 hover:bg-sky-700 gap-2" onClick={() => { setEditingAnnouncement(null); setAnnouncementForm({ title: '', message: '', type: 'info', target: 'all', isActive: true, expiresAt: '', link: '', linkText: '' }); setShowAddAnnouncement(true); }}>
                  <Plus className="w-4 h-4" /> إعلان جديد
                </Button>
              </div>

              {announcementsLoading ? (
                <div className="text-center py-16 text-slate-400">جارٍ التحميل...</div>
              ) : !announcementsData?.announcements?.length ? (
                <div className="bg-emerald-900/20 rounded-2xl border border-emerald-900/40 py-16 text-center text-slate-400">
                  <Megaphone className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">لا توجد إعلانات</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {announcementsData.announcements.map((a: any) => {
                    const typeColors: Record<string, string> = { info: 'border-sky-500/40 bg-sky-500/5', warning: 'border-yellow-500/40 bg-yellow-500/5', success: 'border-emerald-500/40 bg-emerald-500/5', error: 'border-red-500/40 bg-red-500/5', promo: 'border-green-500/40 bg-green-500/5' };
                    const typeLabels: Record<string, string> = { info: 'معلومة', warning: 'تحذير', success: 'نجاح', error: 'تنبيه', promo: 'عرض' };
                    return (
                      <div key={a._id} className={`rounded-2xl border p-5 ${typeColors[a.type] || 'border-slate-700 bg-slate-900'} ${!a.isActive ? 'opacity-50' : ''}`}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className="text-white font-semibold text-sm">{a.title}</span>
                              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">{typeLabels[a.type] || a.type}</span>
                              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">{a.target === 'all' ? 'للجميع' : a.target === 'pro' ? 'للمشتركين' : 'المجانيين'}</span>
                              {!a.isActive && <span className="text-xs px-2 py-0.5 rounded-full bg-slate-600 text-slate-400">مخفي</span>}
                            </div>
                            <p className="text-slate-300 text-sm">{a.message}</p>
                            {a.link && <a href={a.link} className="text-sky-400 text-xs mt-1 block">{a.linkText || a.link}</a>}
                            <p className="text-slate-500 text-xs mt-2">{formatDateTime(a.createdAt)}</p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button onClick={() => { setEditingAnnouncement(a); setAnnouncementForm({ title: a.title, message: a.message, type: a.type, target: a.target, isActive: a.isActive, expiresAt: a.expiresAt ? new Date(a.expiresAt).toISOString().slice(0,10) : '', link: a.link || '', linkText: a.linkText || '' }); setShowAddAnnouncement(true); }} className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-blue-600/20 flex items-center justify-center text-slate-400 hover:text-blue-400 transition-colors"><Edit className="w-3 h-3" /></button>
                            <button onClick={() => updateAnnouncement.mutate({ id: a._id, data: { isActive: !a.isActive } })} className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-emerald-600/20 flex items-center justify-center text-slate-400 hover:text-emerald-400 transition-colors">{a.isActive ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}</button>
                            <button onClick={() => { if (confirm('حذف هذا الإعلان؟')) deleteAnnouncement.mutate(a._id); }} className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-red-600/20 flex items-center justify-center text-slate-400 hover:text-red-400 transition-colors"><Trash2 className="w-3 h-3" /></button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ─── SUPPORT TICKETS TAB ─── */}
          {activeTab === 'support' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h2 className="text-white text-xl font-bold flex items-center gap-2"><HeadphonesIcon className="w-5 h-5 text-teal-400" /> الدعم الفني</h2>
                  <p className="text-slate-400 text-sm mt-1">إدارة تذاكر الدعم الفني والشكاوى</p>
                </div>
                <div className="flex gap-2">
                  {(['all', 'open', 'in_progress', 'resolved'] as const).map(f => (
                    <button key={f} onClick={() => setTicketFilter(f)} className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${ticketFilter === f ? 'bg-teal-600 border-teal-500 text-white' : 'border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800'}`}>
                      {f === 'all' ? 'الكل' : f === 'open' ? 'مفتوحة' : f === 'in_progress' ? 'قيد المعالجة' : 'محلولة'}
                      {f !== 'all' && ticketsData?.counts?.[f] > 0 && <span className="mr-1.5 bg-white/20 px-1.5 rounded-full">{ticketsData.counts[f]}</span>}
                    </button>
                  ))}
                </div>
              </div>

              {ticketsLoading ? (
                <div className="text-center py-16 text-slate-400">جارٍ التحميل...</div>
              ) : !ticketsData?.tickets?.length ? (
                <div className="bg-emerald-900/20 rounded-2xl border border-emerald-900/40 py-16 text-center text-slate-400">
                  <HeadphonesIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">لا توجد تذاكر دعم فني</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {ticketsData.tickets.map((ticket: any) => {
                    const priorityColors: Record<string, string> = { low: 'text-slate-400', medium: 'text-yellow-400', high: 'text-orange-400', urgent: 'text-red-400' };
                    const statusColors: Record<string, string> = { open: 'bg-red-500/20 text-red-400 border-red-500/30', in_progress: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', resolved: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', closed: 'bg-slate-500/20 text-slate-400 border-slate-500/30' };
                    const statusLabels: Record<string, string> = { open: 'مفتوحة', in_progress: 'قيد المعالجة', resolved: 'محلولة', closed: 'مغلقة' };
                    return (
                      <div key={ticket._id} className="bg-emerald-900/20 rounded-2xl border border-emerald-900/40 p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className="text-white font-semibold text-sm">{ticket.subject}</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full border ${statusColors[ticket.status] || ''}`}>{statusLabels[ticket.status] || ticket.status}</span>
                              <span className={`text-xs font-medium ${priorityColors[ticket.priority] || ''}`}>{ticket.priority === 'urgent' ? '🔴 عاجل' : ticket.priority === 'high' ? '🟠 عالي' : ticket.priority === 'medium' ? '🟡 متوسط' : '⚪ منخفض'}</span>
                            </div>
                            <p className="text-slate-400 text-xs mb-1">{ticket.userName} • {ticket.userEmail}</p>
                            <p className="text-slate-300 text-sm line-clamp-2">{ticket.message}</p>
                            {ticket.adminNotes && <p className="text-teal-400 text-xs mt-1 bg-teal-500/10 px-2 py-1 rounded">ملاحظة الأدمن: {ticket.adminNotes}</p>}
                            <p className="text-slate-500 text-xs mt-2">{formatDateTime(ticket.createdAt)}</p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button onClick={() => { setSelectedTicket(ticket); setTicketNotes(ticket.adminNotes || ''); }} className="text-xs px-3 py-1.5 rounded-lg bg-teal-600/20 text-teal-400 hover:bg-teal-600/30 transition-colors">معالجة</button>
                            <button onClick={() => { if (confirm('حذف هذه التذكرة؟')) deleteTicket.mutate(ticket._id); }} className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-red-600/20 flex items-center justify-center text-slate-400 hover:text-red-400 transition-colors"><Trash2 className="w-3 h-3" /></button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ─── ROLES & PERMISSIONS TAB ─── */}
          {activeTab === 'roles' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-white text-xl font-bold flex items-center gap-2"><UserCog className="w-5 h-5 text-emerald-400" /> الأدوار والصلاحيات</h2>
                  <p className="text-slate-400 text-sm mt-1">إدارة حسابات المديرين وصلاحياتهم</p>
                </div>
                <Button className="bg-emerald-600 hover:bg-emerald-700 gap-2" onClick={() => { setEditingAdmin(null); setAdminForm({ username: '', password: '', fullName: '', email: '', role: 'admin', permissions: [] }); setShowAddAdmin(true); }}>
                  <Plus className="w-4 h-4" /> إضافة مدير
                </Button>
              </div>

              <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/50">
                <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2"><KeyRound className="w-4 h-4 text-emerald-400" /> الأدوار المتاحة</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    { role: 'super_admin', label: 'مدير عام', desc: 'صلاحيات كاملة على جميع الأقسام', color: 'border-emerald-500/40 bg-emerald-500/10' },
                    { role: 'admin', label: 'مدير', desc: 'صلاحيات الإدارة بدون حذف البيانات', color: 'border-blue-500/40 bg-blue-500/10' },
                    { role: 'support', label: 'دعم فني', desc: 'يمكنه عرض المستخدمين وإدارة الدعم', color: 'border-teal-500/40 bg-teal-500/10' },
                  ].map(r => (
                    <div key={r.role} className={`rounded-xl border p-3 ${r.color}`}>
                      <p className="text-white font-semibold text-sm">{r.label}</p>
                      <p className="text-slate-400 text-xs mt-0.5">{r.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {adminsLoading ? (
                <div className="text-center py-16 text-slate-400">جارٍ التحميل...</div>
              ) : (
                <div className="bg-emerald-900/20 rounded-2xl border border-emerald-900/40 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-emerald-800/30">
                        <tr>
                          {['المدير', 'البريد', 'الدور', 'الحالة', 'إجراءات'].map(h => (
                            <th key={h} className="text-right text-slate-400 text-xs font-semibold px-4 py-3">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {adminsData?.admins?.length === 0 ? (
                          <tr><td colSpan={5} className="text-center py-8 text-slate-500">لا يوجد مديرون</td></tr>
                        ) : adminsData?.admins?.map((adm: any) => (
                          <tr key={adm._id} className="hover:bg-emerald-900/20 transition-colors">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xs font-bold">{adm.fullName?.[0] || adm.username?.[0]}</div>
                                <div>
                                  <p className="text-white text-sm font-medium">{adm.fullName || adm.username}</p>
                                  <p className="text-slate-400 text-xs">@{adm.username}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-slate-300 text-sm">{adm.email || '-'}</td>
                            <td className="px-4 py-3">
                              <span className={`text-xs px-2 py-0.5 rounded-full border ${adm.role === 'super_admin' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : adm.role === 'support' ? 'bg-teal-500/20 text-teal-400 border-teal-500/30' : 'bg-blue-500/20 text-blue-400 border-blue-500/30'}`}>
                                {adm.role === 'super_admin' ? 'مدير عام' : adm.role === 'support' ? 'دعم فني' : 'مدير'}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`text-xs px-2 py-0.5 rounded-full border ${adm.isActive !== false ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-slate-500/20 text-slate-400 border-slate-500/30'}`}>
                                {adm.isActive !== false ? 'نشط' : 'موقوف'}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1.5">
                                <button onClick={() => { setEditingAdmin(adm); setAdminForm({ username: adm.username, password: '', fullName: adm.fullName || '', email: adm.email || '', role: adm.role || 'admin', permissions: adm.permissions || [] }); setShowAddAdmin(true); }} className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-blue-600/20 flex items-center justify-center text-slate-400 hover:text-blue-400 transition-colors"><Edit className="w-3 h-3" /></button>
                                <button onClick={() => { if (confirm(`حذف المدير ${adm.username}؟`)) deleteAdmin.mutate(adm._id); }} className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-red-600/20 flex items-center justify-center text-slate-400 hover:text-red-400 transition-colors"><Trash2 className="w-3 h-3" /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ─── PLATFORM SETTINGS TAB ─── */}
          {activeTab === 'settings' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-white text-xl font-bold flex items-center gap-2"><Sliders className="w-5 h-5 text-orange-300" /> إعدادات المنصة</h2>
                <p className="text-slate-400 text-sm mt-1">تحكم في إعدادات المنصة والأسعار والخيارات العامة</p>
              </div>

              {settingsLoading ? (
                <div className="text-center py-16 text-slate-400">جارٍ التحميل...</div>
              ) : (() => {
                const settings: any[] = settingsData?.settings || [];
                const categories = Array.from(new Set(settings.map((s: any) => s.category)));
                const catLabels: Record<string, string> = { general: 'عام', pricing: 'الأسعار', limits: 'الحدود', access: 'الوصول', payment: 'الدفع', contact: 'التواصل' };
                return (
                  <div className="space-y-5">
                    {categories.map(cat => (
                      <div key={cat} className="bg-emerald-900/20 rounded-2xl border border-emerald-900/40 overflow-hidden">
                        <div className="px-5 py-3 border-b border-slate-800 bg-slate-800/40 flex items-center gap-2">
                          <Globe className="w-4 h-4 text-orange-300" />
                          <h3 className="text-white font-semibold text-sm">{catLabels[cat] || cat}</h3>
                        </div>
                        <div className="divide-y divide-slate-800">
                          {settings.filter((s: any) => s.category === cat).map((setting: any) => {
                            const currentVal = settingsEdits[setting.key] !== undefined ? settingsEdits[setting.key] : setting.value;
                            return (
                              <div key={setting.key} className="px-5 py-4 flex items-center gap-4">
                                <div className="flex-1 min-w-0">
                                  <p className="text-white text-sm font-medium">{setting.label}</p>
                                  {setting.description && <p className="text-slate-500 text-xs mt-0.5">{setting.description}</p>}
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  {setting.type === 'boolean' ? (
                                    <button
                                      onClick={() => { const newVal = !currentVal; setSettingsEdits(e => ({ ...e, [setting.key]: newVal })); saveSetting(setting.key, newVal); }}
                                      className={`relative w-12 h-6 rounded-full transition-colors ${currentVal ? 'bg-emerald-500' : 'bg-slate-600'}`}
                                    >
                                      <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${currentVal ? 'right-1' : 'left-1'}`} />
                                    </button>
                                  ) : setting.type === 'number' ? (
                                    <>
                                      <Input type="number" value={currentVal} onChange={e => setSettingsEdits(ed => ({ ...ed, [setting.key]: Number(e.target.value) }))} className="bg-slate-800 border-slate-700 text-white w-28 text-sm h-8" />
                                      {settingsEdits[setting.key] !== undefined && (
                                        <button onClick={() => saveSetting(setting.key, settingsEdits[setting.key])} disabled={savingSettings[setting.key]} className="w-7 h-7 rounded-lg bg-orange-600/20 hover:bg-orange-600/40 text-orange-400 flex items-center justify-center transition-colors shrink-0">
                                          <Save className="w-3 h-3" />
                                        </button>
                                      )}
                                    </>
                                  ) : (
                                    <>
                                      <Input value={currentVal} onChange={e => setSettingsEdits(ed => ({ ...ed, [setting.key]: e.target.value }))} className="bg-slate-800 border-slate-700 text-white w-48 text-sm h-8" />
                                      {settingsEdits[setting.key] !== undefined && (
                                        <button onClick={() => saveSetting(setting.key, settingsEdits[setting.key])} disabled={savingSettings[setting.key]} className="w-7 h-7 rounded-lg bg-orange-600/20 hover:bg-orange-600/40 text-orange-400 flex items-center justify-center transition-colors shrink-0">
                                          <Save className="w-3 h-3" />
                                        </button>
                                      )}
                                    </>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}

          {activeTab === 'whatsapp' && <WhatsAppAdminTab />}

          {/* ─── NOTIFICATIONS TAB ─── */}
          {activeTab === 'notifications' && (
            <div className="space-y-6" dir="rtl">
              <div>
                <h2 className="text-white text-xl font-bold flex items-center gap-2">
                  <BellRing className="w-5 h-5 text-emerald-400" /> مركز الإشعارات
                </h2>
                <p className="text-slate-400 text-sm mt-1">إرسال إشعارات للطلاب داخل التطبيق وعبر الإشعارات الفورية</p>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-emerald-900/20 rounded-2xl border border-emerald-900/40 p-4 flex flex-col gap-1">
                  <p className="text-slate-400 text-xs">مشتركو الإشعارات الفورية</p>
                  <p className="text-white text-2xl font-bold">{pushStatsData?.totalSubscriptions ?? '—'}</p>
                </div>
                <div className="bg-emerald-900/20 rounded-2xl border border-emerald-900/40 p-4 flex flex-col gap-1">
                  <p className="text-slate-400 text-xs">إجمالي الإشعارات المرسلة</p>
                  <p className="text-white text-2xl font-bold">{Array.isArray(notificationsData) ? notificationsData.length : '—'}</p>
                </div>
                <div className="bg-emerald-900/20 rounded-2xl border border-emerald-900/40 p-4 flex flex-col gap-1">
                  <p className="text-slate-400 text-xs">نوع الإرسال</p>
                  <p className="text-emerald-400 text-lg font-bold">عالمي + شخصي</p>
                </div>
                <div className="bg-emerald-900/20 rounded-2xl border border-emerald-900/40 p-4 flex flex-col gap-1">
                  <p className="text-slate-400 text-xs">القنوات المتاحة</p>
                  <p className="text-emerald-400 text-lg font-bold">داخلي + Push</p>
                </div>
              </div>

              {/* Send notification form */}
              <div className="bg-slate-900 rounded-2xl border border-emerald-500/20 overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-800 bg-emerald-500/5 flex items-center gap-2">
                  <Send className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-white font-semibold">إرسال إشعار جديد</h3>
                </div>
                <div className="p-5 space-y-4">
                  {/* Target */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-slate-400 text-xs mb-1">الجمهور المستهدف</p>
                      <select
                        value={notifForm.target}
                        onChange={e => setNotifForm(f => ({ ...f, target: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm"
                      >
                        <option value="global">جميع الطلاب 🌍</option>
                        <option value="premium">المشتركون فقط 👑</option>
                        <option value="user">طالب محدد 🎯</option>
                      </select>
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs mb-1">نوع الإشعار</p>
                      <select
                        value={notifForm.type}
                        onChange={e => setNotifForm(f => ({ ...f, type: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm"
                      >
                        <option value="info">معلومة 💡</option>
                        <option value="success">نجاح ✅</option>
                        <option value="warning">تحذير ⚠️</option>
                        <option value="achievement">إنجاز 🏆</option>
                        <option value="exam">اختبار 📝</option>
                        <option value="promo">عرض 🎁</option>
                      </select>
                    </div>
                  </div>

                  {/* User ID if targeted */}
                  {notifForm.target === 'user' && (
                    <div>
                      <p className="text-slate-400 text-xs mb-1">رقم معرف الطالب (userId)</p>
                      <Input
                        value={notifForm.targetUserId}
                        onChange={e => setNotifForm(f => ({ ...f, targetUserId: e.target.value }))}
                        className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                        placeholder="مثال: 74"
                      />
                    </div>
                  )}

                  {/* Title */}
                  <div>
                    <p className="text-slate-400 text-xs mb-1">عنوان الإشعار *</p>
                    <Input
                      value={notifForm.title}
                      onChange={e => setNotifForm(f => ({ ...f, title: e.target.value }))}
                      className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                      placeholder="مثال: عرض خاص ينتهي قريباً!"
                    />
                  </div>

                  {/* Body */}
                  <div>
                    <p className="text-slate-400 text-xs mb-1">نص الإشعار *</p>
                    <Textarea
                      value={notifForm.body}
                      onChange={e => setNotifForm(f => ({ ...f, body: e.target.value }))}
                      className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 resize-none"
                      placeholder="اكتب نص الإشعار هنا..."
                      rows={3}
                    />
                  </div>

                  {/* Link */}
                  <div>
                    <p className="text-slate-400 text-xs mb-1">رابط (اختياري)</p>
                    <Input
                      value={notifForm.link}
                      onChange={e => setNotifForm(f => ({ ...f, link: e.target.value }))}
                      className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                      placeholder="مثال: /subscription"
                    />
                  </div>

                  <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-300">
                    <input
                      type="checkbox"
                      checked={notifForm.sendWhatsApp}
                      onChange={e => setNotifForm(f => ({ ...f, sendWhatsApp: e.target.checked }))}
                      className="h-4 w-4 accent-emerald-500"
                    />
                    إرسال نفس الإشعار عبر واتساب للمستخدمين الذين فعّلوا التنبيهات
                  </label>

                  {/* Send buttons */}
                  <div className="flex gap-3 pt-1">
                    <Button
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 gap-2"
                      disabled={sendingNotif || !notifForm.title || !notifForm.body}
                      onClick={async () => {
                        setSendingNotif(true);
                        try {
                          const endpoint = notifForm.target === 'user'
                            ? `/api/notifications/in-app/${notifForm.targetUserId}`
                            : '/api/notifications/in-app/broadcast';
                          const res = await fetch(endpoint, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            credentials: 'include',
                            body: JSON.stringify({
                              title: notifForm.title,
                              body: notifForm.body,
                              type: notifForm.type,
                              target: notifForm.target,
                              link: notifForm.link || undefined,
                              sendWhatsApp: notifForm.sendWhatsApp,
                            }),
                          });
                          if (res.ok) {
                            toast({ title: '✅ تم إرسال الإشعار الداخلي بنجاح' });
                            setNotifForm(f => ({ ...f, title: '', body: '', link: '' }));
                            refetchNotifications();
                          } else {
                            const err = await res.json().catch(() => ({}));
                            toast({ title: 'خطأ', description: err.error || 'فشل الإرسال', variant: 'destructive' });
                          }
                        } catch {
                          toast({ title: 'خطأ في الاتصال', variant: 'destructive' });
                        } finally {
                          setSendingNotif(false);
                        }
                      }}
                    >
                      <Bell className="w-4 h-4" />
                      {sendingNotif ? 'جارٍ الإرسال...' : 'إرسال داخل التطبيق'}
                    </Button>
                    <Button
                      className="flex-1 bg-emerald-700 hover:bg-emerald-600 gap-2"
                      disabled={sendingNotif || !notifForm.title || !notifForm.body}
                      onClick={async () => {
                        setSendingNotif(true);
                        try {
                          const res = await fetch('/api/notifications/push/broadcast', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            credentials: 'include',
                            body: JSON.stringify({
                              title: notifForm.title,
                              body: notifForm.body,
                              target: notifForm.target === 'user' ? 'all' : notifForm.target,
                              link: notifForm.link || '/',
                            }),
                          });
                          if (res.ok) {
                            const result = await res.json();
                            toast({ title: `📲 تم إرسال الإشعار الفوري لـ ${result.sent ?? 0} مستخدم` });
                          } else {
                            const err = await res.json().catch(() => ({}));
                            toast({ title: 'خطأ', description: err.error || 'فشل الإرسال الفوري', variant: 'destructive' });
                          }
                        } catch {
                          toast({ title: 'خطأ في الاتصال', variant: 'destructive' });
                        } finally {
                          setSendingNotif(false);
                        }
                      }}
                    >
                      <Send className="w-4 h-4" />
                      {sendingNotif ? 'جارٍ الإرسال...' : 'Push للمشتركين'}
                    </Button>
                  </div>

                  {/* Quick templates */}
                  <div>
                    <p className="text-slate-500 text-xs mb-2">قوالب سريعة:</p>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { label: '🎁 عرض خاص', title: 'عرض حصري لك!', body: 'استفد من خصم 50% على الاشتراك المميز اليوم فقط. لا تفوّت الفرصة!' },
                        { label: '📝 تذكير اختبار', title: 'لا تنس اختبارك اليومي', body: 'حافظ على تقدمك! أكمل اختبارك اليومي وحقق نقاطاً جديدة.' },
                        { label: '🏆 تحدي جديد', title: 'تحدٍّ جديد بانتظارك!', body: 'اختبر قدراتك مع التحدي الجديد وتنافس مع الآلاف من الطلاب.' },
                        { label: '🔔 تحديث', title: 'تحديث جديد للمنصة', body: 'أضفنا ميزات جديدة رائعة! استكشف ما هو جديد في منصة قدراتك.' },
                      ].map(tpl => (
                        <button
                          key={tpl.label}
                          onClick={() => setNotifForm(f => ({ ...f, title: tpl.title, body: tpl.body }))}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700 transition-colors"
                        >
                          {tpl.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent notifications list */}
              <div className="bg-emerald-900/20 rounded-2xl border border-emerald-900/40 overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-800 bg-slate-800/40 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock3 className="w-4 h-4 text-slate-400" />
                    <h3 className="text-white font-semibold text-sm">الإشعارات المرسلة مؤخراً</h3>
                  </div>
                  <button onClick={() => refetchNotifications()} className="text-slate-500 hover:text-white transition-colors">
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
                {notificationsLoading ? (
                  <div className="text-center py-12 text-slate-400 text-sm">جارٍ التحميل...</div>
                ) : !Array.isArray(notificationsData) || notificationsData.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 text-sm">
                    <BellRing className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p>لا توجد إشعارات مرسلة بعد</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-800 max-h-80 overflow-y-auto">
                    {notificationsData.slice(0, 30).map((n: any) => (
                      <div key={n._id} className="px-5 py-3 flex items-start gap-3">
                        <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 ${
                          n.type === 'success' ? 'bg-emerald-500/20 text-emerald-400' :
                          n.type === 'warning' ? 'bg-amber-500/20 text-amber-400' :
                          n.type === 'achievement' ? 'bg-yellow-500/20 text-yellow-400' :
                          n.type === 'exam' ? 'bg-blue-500/20 text-blue-400' :
                          n.type === 'promo' ? 'bg-amber-500/20 text-amber-400' :
                          'bg-emerald-500/20 text-emerald-400'
                        }`}>
                          {n.type === 'success' ? '✅' : n.type === 'warning' ? '⚠️' : n.type === 'achievement' ? '🏆' : n.type === 'exam' ? '📝' : n.type === 'promo' ? '🎁' : '💡'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-medium truncate">{n.title}</p>
                          <p className="text-slate-400 text-xs truncate">{n.body}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-slate-600 text-xs">{new Date(n.createdAt).toLocaleString('ar-SA', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                            <span className={`text-xs px-1.5 py-0.5 rounded ${n.target === 'global' ? 'bg-emerald-500/20 text-emerald-400' : n.target === 'premium' ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'}`}>
                              {n.target === 'global' ? '🌍 الكل' : n.target === 'premium' ? '👑 مميز' : '🎯 شخصي'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {n.readBy && n.readBy.length > 0 && (
                            <span className="text-xs text-slate-500 flex items-center gap-0.5">
                              <CheckCheck className="w-3 h-3" /> {n.readBy.length}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ─── QUESTION REPORTS TAB ─── */}
          {activeTab === 'question-reports' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h2 className="text-white text-xl font-bold flex items-center gap-2">
                    <Flag className="w-5 h-5 text-rose-400" /> بلاغات الأسئلة
                  </h2>
                  <p className="text-slate-400 text-sm mt-1">بلاغات الطلاب عن أخطاء في الأسئلة — راجعها وصحّحها مباشرة</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {([
                    { val: 'all', label: 'الكل' },
                    { val: 'pending', label: '⏳ قيد المراجعة' },
                    { val: 'reviewed', label: '👁 تمت المراجعة' },
                    { val: 'fixed', label: '✅ تم التصحيح' },
                    { val: 'dismissed', label: '🚫 مرفوض' },
                  ] as const).map(f => (
                    <button key={f.val} onClick={() => setReportFilter(f.val)} className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${reportFilter === f.val ? 'bg-rose-600 border-rose-500 text-white' : 'border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800'}`}>
                      {f.label}
                      {f.val === 'pending' && (questionReportsData?.pending || 0) > 0 && <span className="mr-1.5 bg-white/20 px-1.5 rounded-full">{questionReportsData.pending}</span>}
                    </button>
                  ))}
                  <button onClick={() => refetchReports()} className="text-slate-500 hover:text-white transition-colors px-2">
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {reportsLoading ? (
                <div className="text-center py-16 text-slate-400">جارٍ التحميل...</div>
              ) : !questionReportsData?.reports?.length ? (
                <div className="bg-emerald-900/20 rounded-2xl border border-emerald-900/40 py-16 text-center text-slate-400">
                  <Flag className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">لا توجد بلاغات</p>
                  <p className="text-sm mt-1 text-slate-500">ستظهر هنا بلاغات الطلاب عن أخطاء في الأسئلة</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {questionReportsData.reports.map((r: any) => {
                    const typeMap: Record<string, string> = { wrong_answer: 'إجابة خاطئة', typo: 'خطأ إملائي', unclear: 'سؤال غير واضح', missing_image: 'صورة مفقودة', other: 'أخرى' };
                    const statusColors: Record<string, string> = { pending: 'bg-amber-500/20 text-amber-400 border-amber-500/30', reviewed: 'bg-blue-500/20 text-blue-400 border-blue-500/30', fixed: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', dismissed: 'bg-slate-500/20 text-slate-400 border-slate-500/30' };
                    const statusLabels: Record<string, string> = { pending: 'قيد المراجعة', reviewed: 'تمت المراجعة', fixed: 'تم التصحيح', dismissed: 'مرفوض' };
                    return (
                      <div key={r._id} className="bg-emerald-900/20 rounded-2xl border border-emerald-900/40 p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-2">
                              <span className="text-white font-semibold text-sm">سؤال #{r.questionId}</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full border ${statusColors[r.status] || ''}`}>{statusLabels[r.status] || r.status}</span>
                              <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">{typeMap[r.reportType] || r.reportType}</span>
                              {r.reportedByUsername && <span className="text-slate-400 text-xs">بقلم: {r.reportedByUsername}</span>}
                            </div>
                            <p className="text-slate-300 text-sm mb-2 bg-slate-800 rounded-lg px-3 py-2 line-clamp-3">{r.questionText}</p>
                            {r.description && <p className="text-slate-400 text-xs italic">ملاحظة المستخدم: {r.description}</p>}
                            {r.adminNote && <p className="text-teal-400 text-xs mt-1 bg-teal-500/10 px-2 py-1 rounded">ملاحظة الأدمن: {r.adminNote}</p>}
                            <p className="text-slate-500 text-xs mt-2">{formatDateTime(r.createdAt)}</p>
                          </div>
                          <button
                            onClick={() => { setSelectedReport(r); setReportAdminNote(r.adminNote || ''); setReportFixedText(r.fixedQuestion || r.questionText); }}
                            className="shrink-0 text-xs px-3 py-1.5 rounded-lg bg-rose-600/20 text-rose-400 hover:bg-rose-600/30 border border-rose-500/30 transition-colors"
                          >
                            مراجعة
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ═══════════════ WALLETS & REWARDS ═══════════════ */}
          {activeTab === 'wallets' && (
            <AdminWalletsTab
              walletsData={walletsData}
              walletsLoading={walletsLoading}
              monthlyTop3Data={monthlyTop3Data}
              top3Loading={top3Loading}
              refetchWallets={refetchWallets}
              refetchTop3={refetchTop3}
              toast={toast}
              queryClient={queryClient}
            />
          )}

          {/* ═══════════════ SEASONAL EXAMS ═══════════════ */}
          {activeTab === 'seasonal-exams' && (
            <AdminSeasonalExamsTab
              examsData={seasonalExamsData}
              loading={seasonalLoading}
              refetch={refetchSeasonal}
              toast={toast}
              queryClient={queryClient}
            />
          )}

        </div>
      </main>

      {/* ─── Test Template Dialog ─── */}
      <Dialog open={showAddTemplate} onOpenChange={(o) => { setShowAddTemplate(o); if (!o) setEditingTemplate(null); }}>
        <DialogContent className="max-w-lg bg-slate-900 border-slate-700 text-white" dir="rtl">
          <DialogHeader><DialogTitle className="text-white">{editingTemplate ? 'تعديل قالب الاختبار' : 'إنشاء قالب اختبار جديد'}</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2 max-h-[70vh] overflow-y-auto">
            <div><p className="text-slate-400 text-xs mb-1">اسم الاختبار *</p><Input value={templateForm.name} onChange={e => setTemplateForm(f => ({ ...f, name: e.target.value }))} className="bg-slate-800 border-slate-700 text-white" placeholder="مثال: اختبار تجريبي كمي" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><p className="text-slate-400 text-xs mb-1">نوع الاختبار *</p>
                <select value={templateForm.type} onChange={e => setTemplateForm(f => ({ ...f, type: e.target.value }))} className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm">
                  <option value="quantitative">كمي</option>
                  <option value="verbal">لفظي</option>
                  <option value="mixed">مختلط</option>
                </select>
              </div>
              <div><p className="text-slate-400 text-xs mb-1">مستوى الصعوبة</p>
                <select value={templateForm.difficulty} onChange={e => setTemplateForm(f => ({ ...f, difficulty: e.target.value }))} className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm">
                  <option value="easy">سهل</option>
                  <option value="medium">متوسط</option>
                  <option value="hard">صعب</option>
                  <option value="mixed">مختلط</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><p className="text-slate-400 text-xs mb-1">عدد الأسئلة *</p><Input type="number" value={templateForm.questionCount} onChange={e => setTemplateForm(f => ({ ...f, questionCount: e.target.value }))} className="bg-slate-800 border-slate-700 text-white" /></div>
              <div><p className="text-slate-400 text-xs mb-1">وقت الاختبار (دقيقة) *</p><Input type="number" value={templateForm.timeLimit} onChange={e => setTemplateForm(f => ({ ...f, timeLimit: e.target.value }))} className="bg-slate-800 border-slate-700 text-white" /></div>
            </div>
            <div><p className="text-slate-400 text-xs mb-1">الأقسام (مفصولة بفاصلة)</p><Input value={templateForm.subcategories} onChange={e => setTemplateForm(f => ({ ...f, subcategories: e.target.value }))} className="bg-slate-800 border-slate-700 text-white" placeholder="مثال: جبر, هندسة, تناسب" /></div>
            <div><p className="text-slate-400 text-xs mb-1">وصف الاختبار</p><Textarea value={templateForm.description} onChange={e => setTemplateForm(f => ({ ...f, description: e.target.value }))} className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 resize-none" rows={2} /></div>
            <div><p className="text-slate-400 text-xs mb-1">تعليمات الاختبار</p><Textarea value={templateForm.instructions} onChange={e => setTemplateForm(f => ({ ...f, instructions: e.target.value }))} className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 resize-none" rows={2} /></div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={templateForm.isActive} onChange={e => setTemplateForm(f => ({ ...f, isActive: e.target.checked }))} className="w-4 h-4 rounded" />
                <span className="text-slate-300 text-sm">مفعّل (ظاهر للطلاب)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={templateForm.isPro} onChange={e => setTemplateForm(f => ({ ...f, isPro: e.target.checked }))} className="w-4 h-4 rounded" />
                <span className="text-slate-300 text-sm">يتطلب اشتراك Pro</span>
              </label>
            </div>
            <div className="flex gap-2 pt-1">
              <Button className="flex-1 bg-amber-600 hover:bg-amber-700" disabled={addTemplate.isPending || updateTemplate.isPending} onClick={() => {
                if (!templateForm.name.trim()) return toast({ title: 'اسم الاختبار مطلوب', variant: 'destructive' });
                const payload = { ...templateForm, questionCount: Number(templateForm.questionCount), timeLimit: Number(templateForm.timeLimit), order: Number(templateForm.order), subcategories: templateForm.subcategories.split(',').map(s => s.trim()).filter(Boolean) };
                if (editingTemplate) updateTemplate.mutate({ id: editingTemplate._id, data: payload });
                else addTemplate.mutate(payload);
              }}>
                {(addTemplate.isPending || updateTemplate.isPending) ? 'جارٍ الحفظ...' : editingTemplate ? 'حفظ التعديلات' : 'إنشاء القالب'}
              </Button>
              <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800" onClick={() => { setShowAddTemplate(false); setEditingTemplate(null); }}>إلغاء</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Announcement Dialog ─── */}
      <Dialog open={showAddAnnouncement} onOpenChange={(o) => { setShowAddAnnouncement(o); if (!o) setEditingAnnouncement(null); }}>
        <DialogContent className="max-w-lg bg-slate-900 border-slate-700 text-white" dir="rtl">
          <DialogHeader><DialogTitle className="text-white">{editingAnnouncement ? 'تعديل الإعلان' : 'إنشاء إعلان جديد'}</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2 max-h-[70vh] overflow-y-auto">
            <div><p className="text-slate-400 text-xs mb-1">عنوان الإعلان *</p><Input value={announcementForm.title} onChange={e => setAnnouncementForm(f => ({ ...f, title: e.target.value }))} className="bg-slate-800 border-slate-700 text-white" placeholder="مثال: ميزة جديدة متاحة الآن!" /></div>
            <div><p className="text-slate-400 text-xs mb-1">نص الإعلان *</p><Textarea value={announcementForm.message} onChange={e => setAnnouncementForm(f => ({ ...f, message: e.target.value }))} className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 resize-none" rows={3} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><p className="text-slate-400 text-xs mb-1">نوع الإعلان</p>
                <select value={announcementForm.type} onChange={e => setAnnouncementForm(f => ({ ...f, type: e.target.value }))} className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm">
                  <option value="info">معلومة</option>
                  <option value="warning">تحذير</option>
                  <option value="success">نجاح/تهنئة</option>
                  <option value="error">تنبيه</option>
                  <option value="promo">عرض خاص</option>
                </select>
              </div>
              <div><p className="text-slate-400 text-xs mb-1">الفئة المستهدفة</p>
                <select value={announcementForm.target} onChange={e => setAnnouncementForm(f => ({ ...f, target: e.target.value }))} className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm">
                  <option value="all">جميع المستخدمين</option>
                  <option value="pro">المشتركون فقط</option>
                  <option value="free">المجانيون فقط</option>
                </select>
              </div>
            </div>
            <div><p className="text-slate-400 text-xs mb-1">تاريخ الانتهاء (اختياري)</p><Input type="date" value={announcementForm.expiresAt} onChange={e => setAnnouncementForm(f => ({ ...f, expiresAt: e.target.value }))} className="bg-slate-800 border-slate-700 text-white" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><p className="text-slate-400 text-xs mb-1">رابط (اختياري)</p><Input value={announcementForm.link} onChange={e => setAnnouncementForm(f => ({ ...f, link: e.target.value }))} className="bg-slate-800 border-slate-700 text-white" placeholder="https://..." /></div>
              <div><p className="text-slate-400 text-xs mb-1">نص الرابط</p><Input value={announcementForm.linkText} onChange={e => setAnnouncementForm(f => ({ ...f, linkText: e.target.value }))} className="bg-slate-800 border-slate-700 text-white" placeholder="اضغط هنا" /></div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={announcementForm.isActive} onChange={e => setAnnouncementForm(f => ({ ...f, isActive: e.target.checked }))} className="w-4 h-4 rounded" />
              <span className="text-slate-300 text-sm">نشر الإعلان فوراً</span>
            </label>
            <div className="flex gap-2 pt-1">
              <Button className="flex-1 bg-sky-600 hover:bg-sky-700" disabled={addAnnouncement.isPending || updateAnnouncement.isPending} onClick={() => {
                if (!announcementForm.title.trim() || !announcementForm.message.trim()) return toast({ title: 'العنوان والرسالة مطلوبان', variant: 'destructive' });
                if (editingAnnouncement) updateAnnouncement.mutate({ id: editingAnnouncement._id, data: announcementForm });
                else addAnnouncement.mutate(announcementForm);
              }}>
                {(addAnnouncement.isPending || updateAnnouncement.isPending) ? 'جارٍ الحفظ...' : editingAnnouncement ? 'حفظ التعديلات' : 'نشر الإعلان'}
              </Button>
              <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800" onClick={() => { setShowAddAnnouncement(false); setEditingAnnouncement(null); }}>إلغاء</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Support Ticket Dialog ─── */}
      <Dialog open={!!selectedTicket} onOpenChange={(o) => { if (!o) setSelectedTicket(null); }}>
        <DialogContent className="max-w-lg bg-slate-900 border-slate-700 text-white" dir="rtl">
          <DialogHeader><DialogTitle className="text-white">معالجة تذكرة الدعم</DialogTitle></DialogHeader>
          {selectedTicket && (
            <div className="space-y-4 pt-2">
              <div className="bg-slate-800 rounded-xl p-4 space-y-2">
                <p className="text-white font-semibold">{selectedTicket.subject}</p>
                <p className="text-slate-400 text-sm">{selectedTicket.userName} • {selectedTicket.userEmail}</p>
                <p className="text-slate-300 text-sm">{selectedTicket.message}</p>
              </div>
              <div><p className="text-slate-400 text-xs mb-1">ملاحظات الأدمن</p><Textarea value={ticketNotes} onChange={e => setTicketNotes(e.target.value)} className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 resize-none" rows={3} placeholder="اكتب ملاحظاتك هنا..." /></div>
              <div><p className="text-slate-400 text-xs mb-1">تغيير الحالة</p>
                <div className="flex gap-2 flex-wrap">
                  {[{ val: 'open', label: 'مفتوحة', cls: 'bg-red-600 hover:bg-red-700' }, { val: 'in_progress', label: 'قيد المعالجة', cls: 'bg-yellow-600 hover:bg-yellow-700' }, { val: 'resolved', label: 'محلولة', cls: 'bg-emerald-600 hover:bg-emerald-700' }, { val: 'closed', label: 'مغلقة', cls: 'bg-slate-600 hover:bg-slate-700' }].map(s => (
                    <Button key={s.val} size="sm" className={s.cls} disabled={updateTicket.isPending} onClick={() => updateTicket.mutate({ id: selectedTicket._id, data: { status: s.val, adminNotes: ticketNotes } })}>
                      {s.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── Add Admin Dialog ─── */}
      <Dialog open={showAddAdmin} onOpenChange={(o) => { setShowAddAdmin(o); if (!o) setEditingAdmin(null); }}>
        <DialogContent className="max-w-md bg-slate-900 border-slate-700 text-white" dir="rtl">
          <DialogHeader><DialogTitle className="text-white">{editingAdmin ? 'تعديل بيانات المدير' : 'إضافة مدير جديد'}</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div><p className="text-slate-400 text-xs mb-1">اسم المستخدم *</p><Input value={adminForm.username} onChange={e => setAdminForm(f => ({ ...f, username: e.target.value }))} className="bg-slate-800 border-slate-700 text-white" placeholder="admin2" disabled={!!editingAdmin} /></div>
              <div><p className="text-slate-400 text-xs mb-1">{editingAdmin ? 'كلمة مرور جديدة' : 'كلمة المرور *'}</p><Input type="password" value={adminForm.password} onChange={e => setAdminForm(f => ({ ...f, password: e.target.value }))} className="bg-slate-800 border-slate-700 text-white" placeholder="••••••••" /></div>
            </div>
            <div><p className="text-slate-400 text-xs mb-1">الاسم الكامل</p><Input value={adminForm.fullName} onChange={e => setAdminForm(f => ({ ...f, fullName: e.target.value }))} className="bg-slate-800 border-slate-700 text-white" placeholder="اسم المدير" /></div>
            <div><p className="text-slate-400 text-xs mb-1">البريد الإلكتروني</p><Input value={adminForm.email} onChange={e => setAdminForm(f => ({ ...f, email: e.target.value }))} className="bg-slate-800 border-slate-700 text-white" placeholder="admin@qodratak.com" /></div>
            <div><p className="text-slate-400 text-xs mb-1">الدور</p>
              <select value={adminForm.role} onChange={e => setAdminForm(f => ({ ...f, role: e.target.value }))} className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm">
                <option value="super_admin">مدير عام</option>
                <option value="admin">مدير</option>
                <option value="support">دعم فني</option>
              </select>
            </div>
            <div className="flex gap-2 pt-1">
              <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700" disabled={addAdmin.isPending || updateAdmin.isPending} onClick={() => {
                if (!editingAdmin && !adminForm.username.trim()) return toast({ title: 'اسم المستخدم مطلوب', variant: 'destructive' });
                if (!editingAdmin && !adminForm.password.trim()) return toast({ title: 'كلمة المرور مطلوبة', variant: 'destructive' });
                const payload = { ...adminForm };
                if (!payload.password) delete (payload as any).password;
                if (editingAdmin) updateAdmin.mutate({ id: editingAdmin._id, data: payload });
                else addAdmin.mutate(payload);
              }}>
                {(addAdmin.isPending || updateAdmin.isPending) ? 'جارٍ الحفظ...' : editingAdmin ? 'حفظ التعديلات' : 'إضافة المدير'}
              </Button>
              <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800" onClick={() => { setShowAddAdmin(false); setEditingAdmin(null); }}>إلغاء</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Employee Add/Edit Dialog ─── */}
      <Dialog open={showAddEmployee} onOpenChange={(o) => { setShowAddEmployee(o); if (!o) setEditingEmployee(null); }}>
        <DialogContent className="max-w-md bg-slate-900 border-slate-700 text-white" dir="rtl">
          <DialogHeader><DialogTitle className="text-white">{editingEmployee ? 'تعديل بيانات الموظف' : 'إضافة موظف جديد'}</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div><p className="text-slate-400 text-xs mb-1">الاسم الكامل *</p><Input value={employeeForm.fullName} onChange={e => setEmployeeForm(f => ({ ...f, fullName: e.target.value }))} className="bg-slate-800 border-slate-700 text-white" placeholder="اسم الموظف" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><p className="text-slate-400 text-xs mb-1">البريد الإلكتروني</p><Input value={employeeForm.email} onChange={e => setEmployeeForm(f => ({ ...f, email: e.target.value }))} className="bg-slate-800 border-slate-700 text-white" placeholder="email@..." /></div>
              <div><p className="text-slate-400 text-xs mb-1">رقم الجوال</p><Input value={employeeForm.phone} onChange={e => setEmployeeForm(f => ({ ...f, phone: e.target.value }))} className="bg-slate-800 border-slate-700 text-white" placeholder="05xxxxxxxx" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><p className="text-slate-400 text-xs mb-1">المسمى الوظيفي</p>
                <select value={employeeForm.role} onChange={e => setEmployeeForm(f => ({ ...f, role: e.target.value }))} className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm">
                  {['مدير', 'مشرف', 'موظف', 'مطور', 'مصمم', 'محاسب', 'متدرب'].map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div><p className="text-slate-400 text-xs mb-1">القسم</p>
                <select value={employeeForm.department} onChange={e => setEmployeeForm(f => ({ ...f, department: e.target.value }))} className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm">
                  {['خدمة العملاء', 'التقنية', 'التسويق', 'المالية', 'الإدارة', 'المحتوى'].map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>
            <div><p className="text-slate-400 text-xs mb-1">الراتب (ر.س)</p><Input type="number" value={employeeForm.salary} onChange={e => setEmployeeForm(f => ({ ...f, salary: e.target.value }))} className="bg-slate-800 border-slate-700 text-white" placeholder="0" /></div>
            <div><p className="text-slate-400 text-xs mb-1">ملاحظات</p><Textarea value={employeeForm.notes} onChange={e => setEmployeeForm(f => ({ ...f, notes: e.target.value }))} className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 resize-none" rows={2} placeholder="أي معلومات إضافية..." /></div>
            <div className="flex gap-2 pt-1">
              <Button className="flex-1 bg-teal-600 hover:bg-teal-700" disabled={addEmployee.isPending || updateEmployee.isPending} onClick={() => {
                if (!employeeForm.fullName.trim()) return toast({ title: 'الاسم مطلوب', variant: 'destructive' });
                if (editingEmployee) updateEmployee.mutate({ id: editingEmployee._id, data: employeeForm });
                else addEmployee.mutate(employeeForm);
              }}>
                {(addEmployee.isPending || updateEmployee.isPending) ? 'جارٍ الحفظ...' : editingEmployee ? 'حفظ التعديلات' : 'إضافة الموظف'}
              </Button>
              <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800" onClick={() => { setShowAddEmployee(false); setEditingEmployee(null); }}>إلغاء</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Add Expense Dialog ─── */}
      <Dialog open={showAddExpense} onOpenChange={setShowAddExpense}>
        <DialogContent className="max-w-md bg-slate-900 border-slate-700 text-white" dir="rtl">
          <DialogHeader><DialogTitle className="text-white">إضافة مصروف جديد</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div><p className="text-slate-400 text-xs mb-1">عنوان المصروف *</p><Input value={expenseForm.title} onChange={e => setExpenseForm(f => ({ ...f, title: e.target.value }))} className="bg-slate-800 border-slate-700 text-white" placeholder="مثال: رواتب شهر مارس" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><p className="text-slate-400 text-xs mb-1">المبلغ (ر.س) *</p><Input type="number" value={expenseForm.amount} onChange={e => setExpenseForm(f => ({ ...f, amount: e.target.value }))} className="bg-slate-800 border-slate-700 text-white" placeholder="0" /></div>
              <div><p className="text-slate-400 text-xs mb-1">الفئة</p>
                <select value={expenseForm.category} onChange={e => setExpenseForm(f => ({ ...f, category: e.target.value }))} className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm">
                  {['رواتب', 'تقنية', 'تسويق', 'إيجار', 'مستلزمات', 'عام'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div><p className="text-slate-400 text-xs mb-1">وصف (اختياري)</p><Textarea value={expenseForm.description} onChange={e => setExpenseForm(f => ({ ...f, description: e.target.value }))} className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 resize-none" rows={2} placeholder="تفاصيل إضافية..." /></div>
            <div className="flex gap-2 pt-1">
              <Button className="flex-1 bg-green-600 hover:bg-green-700" disabled={addExpense.isPending} onClick={() => {
                if (!expenseForm.title.trim()) return toast({ title: 'عنوان المصروف مطلوب', variant: 'destructive' });
                if (!expenseForm.amount || Number(expenseForm.amount) <= 0) return toast({ title: 'المبلغ مطلوب', variant: 'destructive' });
                addExpense.mutate(expenseForm);
              }}>
                {addExpense.isPending ? 'جارٍ الحفظ...' : 'إضافة المصروف'}
              </Button>
              <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800" onClick={() => setShowAddExpense(false)}>إلغاء</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Enhanced User Detail Dialog ─── */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="max-w-2xl bg-slate-900 border-slate-700 text-white max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader><DialogTitle className="text-white flex items-center gap-2"><BarChart2 className="w-5 h-5 text-emerald-400" /> ملف الطالب التحليلي</DialogTitle></DialogHeader>
          {selectedUser && (
            <div className="space-y-5">
              {/* Profile header */}
              <div className="flex items-center gap-4 p-4 bg-gradient-to-br from-emerald-900/40 to-teal-900/40 rounded-2xl border border-emerald-500/20">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-2xl font-black shadow-lg">
                  {(selectedUser.fullName || selectedUser.username)?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="text-white font-bold text-xl">{selectedUser.fullName || selectedUser.username}</p>
                  <p className="text-slate-400 text-sm">@{selectedUser.username} • {selectedUser.email || 'بلا بريد'}</p>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    <span className="bg-emerald-500/20 text-emerald-300 text-xs px-2 py-0.5 rounded-full border border-emerald-500/30">مستوى {selectedUser.level}</span>
                    <span className="bg-amber-500/20 text-amber-300 text-xs px-2 py-0.5 rounded-full border border-amber-500/30">⭐ {selectedUser.points.toLocaleString()} نقطة</span>
                    <span className="bg-slate-700 text-slate-300 text-xs px-2 py-0.5 rounded-full">انضم {formatDate(selectedUser.createdAt)}</span>
                  </div>
                </div>
                <button
                  onClick={() => { setSelectedUserForMsg(selectedUser); }}
                  className="shrink-0 flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-medium transition-colors"
                >
                  <MessageCircle className="w-4 h-4" /> رسالة
                </button>
              </div>

              {/* Performance Stats */}
              {selectedUserStats ? (
                <>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'متوسط الدرجة', value: `${selectedUserStats.avgScore}%`, color: 'text-yellow-400', bg: 'bg-yellow-500/10', icon: '🎯' },
                      { label: 'لفظي', value: `${selectedUserStats.avgVerbal}%`, color: 'text-green-400', bg: 'bg-green-500/10', icon: '📖' },
                      { label: 'كمي', value: `${selectedUserStats.avgQuant}%`, color: 'text-blue-400', bg: 'bg-blue-500/10', icon: '🔢' },
                    ].map(s => (
                      <div key={s.label} className={`${s.bg} rounded-xl p-4 text-center border border-white/10`}>
                        <div className="text-2xl mb-1">{s.icon}</div>
                        <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
                        <div className="text-slate-400 text-xs">{s.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Recent tests */}
                  {selectedUserStats.recentTests?.length > 0 && (
                    <div className="bg-slate-800/50 rounded-xl overflow-hidden">
                      <div className="px-4 py-3 border-b border-slate-700 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-slate-400" />
                        <span className="text-sm font-semibold text-slate-300">آخر الاختبارات ({selectedUserStats.totalTests} إجمالاً)</span>
                      </div>
                      <div className="divide-y divide-slate-700 max-h-52 overflow-y-auto">
                        {selectedUserStats.recentTests.map((t: any, i: number) => (
                          <div key={i} className="px-4 py-2.5 flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <span className="text-slate-400 text-xs w-24 truncate">{t.examType === 'verbal' ? '📖 لفظي' : t.examType === 'quantitative' ? '🔢 كمي' : '📝 مختلط'}</span>
                              <span className="text-slate-500 text-xs">{formatDate(t.createdAt)}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              {t.totalScoreOutOf100 != null && (
                                <span className={`font-bold ${t.totalScoreOutOf100 >= 70 ? 'text-emerald-400' : t.totalScoreOutOf100 >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                                  {t.totalScoreOutOf100}/100
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {[
                    { label: 'البريد الإلكتروني', value: selectedUser.email || '-', icon: Mail },
                    { label: 'الهاتف', value: selectedUser.phone || '-', icon: Phone },
                    { label: 'النقاط', value: selectedUser.points.toLocaleString(), icon: Star },
                    { label: 'المستوى', value: `${selectedUser.level}`, icon: Trophy },
                    { label: 'إجمالي الاختبارات', value: `${selectedUser.totalTestsTaken}`, icon: FileText },
                    { label: 'عدد الزيارات', value: `${selectedUser.totalVisits}`, icon: Activity },
                    { label: 'آخر زيارة', value: selectedUser.lastVisit ? formatDateTime(selectedUser.lastVisit) : '-', icon: Clock },
                    { label: 'تاريخ التسجيل', value: formatDate(selectedUser.createdAt), icon: Calendar },
                  ].map(item => (
                    <div key={item.label} className="bg-slate-800 rounded-lg p-3">
                      <p className="text-slate-400 text-xs mb-1 flex items-center gap-1"><item.icon className="w-3 h-3" />{item.label}</p>
                      <p className="text-white font-medium">{item.value}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── Send Message to User Dialog ─── */}
      <Dialog open={!!selectedUserForMsg} onOpenChange={() => { setSelectedUserForMsg(null); setMsgTitle(''); setMsgBody(''); }}>
        <DialogContent className="max-w-md bg-slate-900 border-slate-700 text-white" dir="rtl">
          <DialogHeader><DialogTitle className="text-white flex items-center gap-2"><MessageCircle className="w-5 h-5 text-teal-400" /> إرسال رسالة للطالب</DialogTitle></DialogHeader>
          {selectedUserForMsg && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-3 bg-slate-800 rounded-xl p-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold">
                  {(selectedUserForMsg.fullName || selectedUserForMsg.username)?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{selectedUserForMsg.fullName || selectedUserForMsg.username}</p>
                  <p className="text-slate-400 text-xs">@{selectedUserForMsg.username}</p>
                </div>
              </div>
              <div>
                <p className="text-slate-400 text-xs mb-1">عنوان الرسالة *</p>
                <Input value={msgTitle} onChange={e => setMsgTitle(e.target.value)} className="bg-slate-800 border-slate-700 text-white" placeholder="مثال: مبروك إنجازك!" />
              </div>
              <div>
                <p className="text-slate-400 text-xs mb-1">نص الرسالة *</p>
                <Textarea value={msgBody} onChange={e => setMsgBody(e.target.value)} className="bg-slate-800 border-slate-700 text-white resize-none" rows={4} placeholder="اكتب رسالتك هنا..." />
              </div>
              <div className="flex gap-2 pt-1">
                <Button
                  className="flex-1 bg-teal-600 hover:bg-teal-700"
                  disabled={!msgTitle.trim() || !msgBody.trim() || sendUserNotification.isPending}
                  onClick={() => sendUserNotification.mutate({ userId: selectedUserForMsg._id, data: { title: msgTitle, message: msgBody, type: 'info' } })}
                >
                  {sendUserNotification.isPending ? 'جارٍ الإرسال...' : <><Send className="w-4 h-4 ml-2" /> إرسال الإشعار</>}
                </Button>
                <Button variant="outline" className="border-slate-700 text-slate-300" onClick={() => { setSelectedUserForMsg(null); setMsgTitle(''); setMsgBody(''); }}>إلغاء</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── Question Report Review Dialog ─── */}
      <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
        <DialogContent className="max-w-xl bg-slate-900 border-slate-700 text-white max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader><DialogTitle className="text-white flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-rose-400" /> مراجعة البلاغ</DialogTitle></DialogHeader>
          {selectedReport && (
            <div className="space-y-4 pt-2">
              <div className="bg-slate-800 rounded-xl p-4">
                <p className="text-slate-400 text-xs mb-1">نص السؤال المُبلَّغ عنه (سؤال #{selectedReport.questionId})</p>
                <p className="text-white text-sm">{selectedReport.questionText}</p>
                {selectedReport.description && (
                  <p className="text-amber-300 text-xs mt-2 bg-amber-500/10 rounded px-2 py-1">ملاحظة الطالب: {selectedReport.description}</p>
                )}
              </div>
              <div>
                <p className="text-slate-400 text-xs mb-1">نص السؤال المصحَّح (للمراجعة الداخلية)</p>
                <Textarea
                  value={reportFixedText}
                  onChange={e => setReportFixedText(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white resize-none text-sm"
                  rows={4}
                  placeholder="اكتب النص المصحَّح هنا..."
                />
              </div>
              <div>
                <p className="text-slate-400 text-xs mb-1">ملاحظة الأدمن (اختياري)</p>
                <Input value={reportAdminNote} onChange={e => setReportAdminNote(e.target.value)} className="bg-slate-800 border-slate-700 text-white text-sm" placeholder="ملاحظة داخلية..." />
              </div>
              <div className="flex gap-2 flex-wrap pt-1">
                {([
                  { val: 'reviewed', label: '👁 تمت المراجعة', cls: 'bg-blue-600 hover:bg-blue-700' },
                  { val: 'fixed', label: '✅ تم التصحيح', cls: 'bg-emerald-600 hover:bg-emerald-700' },
                  { val: 'dismissed', label: '🚫 رفض البلاغ', cls: 'bg-slate-600 hover:bg-slate-700' },
                ] as const).map(s => (
                  <Button key={s.val} className={`flex-1 ${s.cls} text-white text-sm`} disabled={resolveReport.isPending} onClick={() => resolveReport.mutate({ id: selectedReport._id, data: { status: s.val, adminNote: reportAdminNote, fixedQuestion: reportFixedText } })}>
                    {s.label}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── Subscription Details Modal ─── */}
      <Dialog open={!!selectedSubscription} onOpenChange={() => { setSelectedSubscription(null); setRejectionReason(''); setShowReceiptFull(false); }}>
        <DialogContent className="max-w-lg bg-slate-900 border-slate-700 text-white max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader><DialogTitle className="text-white text-base">تفاصيل الاشتراك</DialogTitle></DialogHeader>
          {selectedSubscription && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'الطالب', value: selectedSubscription.userId?.username || '-' },
                  { label: 'البريد', value: selectedSubscription.userId?.email || '-' },
                  { label: 'نوع الاشتراك', value: selectedSubscription.type },
                  { label: 'السعر', value: `${selectedSubscription.price} ر.س` },
                  { label: 'الحالة', value: selectedSubscription.status },
                  { label: 'طريقة الدفع', value: selectedSubscription.paymentMethod || '-' },
                  { label: 'تاريخ البدء', value: formatDate(selectedSubscription.startDate) },
                  { label: 'تاريخ الانتهاء', value: formatDate(selectedSubscription.endDate) },
                  { label: 'وافق عليه', value: selectedSubscription.approvedBy?.fullName || '-' },
                ].map(i => (
                  <div key={i.label} className="bg-slate-800 rounded-lg p-2.5">
                    <p className="text-slate-400 text-xs mb-1">{i.label}</p>
                    <p className="text-white font-medium text-xs break-all">{i.value}</p>
                  </div>
                ))}
              </div>

              {/* ─── Receipt Image ─── */}
              {selectedSubscription.transferReceiptUrl ? (
                <div className="border border-slate-700 rounded-xl overflow-hidden">
                  <div className="bg-slate-800 px-3 py-2 flex items-center justify-between">
                    <p className="text-slate-300 text-xs font-semibold flex items-center gap-1.5">
                      <Download className="w-3.5 h-3.5" /> سند التحويل
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowReceiptFull(v => !v)}
                        className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        {showReceiptFull ? 'تصغير' : 'عرض كامل'}
                      </button>
                      <a
                        href={selectedSubscription.transferReceiptUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                      >
                        فتح في نافذة جديدة
                      </a>
                    </div>
                  </div>
                  {selectedSubscription.transferReceiptUrl.match(/\.(jpg|jpeg|png|gif|webp)(\?|$)/i) ||
                   selectedSubscription.transferReceiptUrl.includes('cloudinary') ||
                   selectedSubscription.transferReceiptUrl.includes('upload') ? (
                    <div className={`bg-slate-950 flex items-center justify-center ${showReceiptFull ? 'p-2' : 'p-2 max-h-48'} overflow-hidden cursor-pointer`}
                         onClick={() => setShowReceiptFull(v => !v)}>
                      <img
                        src={selectedSubscription.transferReceiptUrl}
                        alt="سند التحويل"
                        className={`rounded ${showReceiptFull ? 'max-w-full' : 'max-h-44 object-contain'} mx-auto`}
                      />
                    </div>
                  ) : (
                    <div className="bg-slate-950 p-4 flex items-center justify-center gap-3">
                      <Download className="w-6 h-6 text-slate-400" />
                      <a
                        href={selectedSubscription.transferReceiptUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
                      >
                        تحميل سند التحويل
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-red-950/30 border border-red-800/40 rounded-xl p-3 text-center">
                  <p className="text-red-400 text-xs">لم يرفق الطالب سند التحويل</p>
                </div>
              )}

              {/* ─── Reject reason ─── */}
              {selectedSubscription.status === 'pending' && (
                <div className="space-y-3 pt-1 border-t border-slate-700">
                  <div>
                    <label className="text-slate-300 text-xs font-semibold mb-1.5 block">سبب الرفض (اختياري)</label>
                    <textarea
                      value={rejectionReason}
                      onChange={e => setRejectionReason(e.target.value)}
                      rows={2}
                      placeholder="أدخل سبب الرفض ليصل للطالب عبر البريد..."
                      className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-lg p-2.5 resize-none placeholder:text-slate-500 focus:outline-none focus:border-slate-500"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        approveSub.mutate(selectedSubscription._id);
                        setSelectedSubscription(null);
                        setRejectionReason('');
                      }}
                      disabled={approveSub.isPending}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-sm"
                    >
                      <CheckCircle className="w-4 h-4 ml-1" /> موافقة على الاشتراك
                    </Button>
                    <Button
                      onClick={() => {
                        rejectSub.mutate({ id: selectedSubscription._id, reason: rejectionReason || 'رفض من الإدارة' });
                        setSelectedSubscription(null);
                        setRejectionReason('');
                      }}
                      disabled={rejectSub.isPending}
                      variant="destructive"
                      className="flex-1 text-sm"
                    >
                      <XCircle className="w-4 h-4 ml-1" /> رفض
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── Institution Details Modal ─── */}
      <Dialog open={!!selectedInstitution} onOpenChange={() => setSelectedInstitution(null)}>
        <DialogContent className="max-w-lg bg-slate-900 border-slate-700 text-white" dir="rtl">
          <DialogHeader><DialogTitle className="text-white">تفاصيل طلب المؤسسة</DialogTitle></DialogHeader>
          {selectedInstitution && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'اسم المؤسسة', value: selectedInstitution.institutionName },
                  { label: 'المسؤول', value: selectedInstitution.responsibleName },
                  { label: 'الهاتف', value: selectedInstitution.phone },
                  { label: 'واتساب', value: selectedInstitution.whatsapp },
                  { label: 'البريد', value: selectedInstitution.email },
                  { label: 'المدينة', value: selectedInstitution.city },
                  { label: 'نوع المؤسسة', value: selectedInstitution.institutionType },
                  { label: 'عدد الطلاب', value: selectedInstitution.studentsCount?.toString() || '-' },
                ].map(i => (
                  <div key={i.label} className="bg-slate-800 rounded-lg p-3">
                    <p className="text-slate-400 text-xs mb-1">{i.label}</p>
                    <p className="text-white font-medium">{i.value}</p>
                  </div>
                ))}
              </div>
              {selectedInstitution.notes && (
                <div className="bg-slate-800 rounded-lg p-3">
                  <p className="text-slate-400 text-xs mb-1">ملاحظات</p>
                  <p className="text-white">{selectedInstitution.notes}</p>
                </div>
              )}
              {selectedInstitution.status === 'pending' && (
                <div className="flex gap-2 pt-2 border-t border-slate-700">
                  <Button onClick={() => { approveInstitution.mutate(selectedInstitution._id); setSelectedInstitution(null); }} disabled={approveInstitution.isPending} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                    <CheckCircle className="w-4 h-4 ml-1" /> موافقة
                  </Button>
                  <Button onClick={() => { rejectInstitution.mutate(selectedInstitution._id); setSelectedInstitution(null); }} disabled={rejectInstitution.isPending} variant="destructive" className="flex-1">
                    <XCircle className="w-4 h-4 ml-1" /> رفض
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── Manual Subscription Dialog ─── */}
      <Dialog open={showManualSubDialog} onOpenChange={setShowManualSubDialog}>
        <DialogContent className="max-w-md bg-slate-900 border-slate-700 text-white" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
              إضافة اشتراك يدوي
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <p className="text-slate-400 text-xs mb-1">ابحث عن الطالب بالاسم أو البريد</p>
              <div className="flex gap-2">
                <Input
                  value={manualSubSearch}
                  onChange={e => setManualSubSearch(e.target.value)}
                  placeholder="اسم المستخدم أو البريد..."
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                />
              </div>
              {manualSubSearch.length > 1 && (
                <div className="mt-1 bg-slate-800 rounded-xl border border-slate-700 max-h-36 overflow-y-auto">
                  {(usersData as any)?.users?.filter((u: User) =>
                    (u.username?.toLowerCase().includes(manualSubSearch.toLowerCase()) ||
                     u.email?.toLowerCase().includes(manualSubSearch.toLowerCase()) ||
                     u.fullName?.toLowerCase().includes(manualSubSearch.toLowerCase()))
                  ).slice(0, 8).map((u: User) => (
                    <button
                      key={u._id}
                      className={`w-full text-right px-3 py-2 hover:bg-slate-700 text-sm transition-colors ${manualSubForm.userId === u._id ? 'bg-emerald-700/30 text-emerald-300' : 'text-white'}`}
                      onClick={() => { setManualSubForm(f => ({ ...f, userId: u._id })); setManualSubSearch(u.fullName || u.username); }}
                    >
                      <span className="font-medium">{u.fullName || u.username}</span>
                      <span className="text-slate-400 mr-2 text-xs">{u.email}</span>
                    </button>
                  ))}
                </div>
              )}
              {manualSubForm.userId && (
                <p className="text-emerald-400 text-xs mt-1">✅ تم تحديد الطالب</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-slate-400 text-xs mb-1">نوع الاشتراك</p>
                <Select value={manualSubForm.type} onValueChange={v => setManualSubForm(f => ({ ...f, type: v }))}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="Pro">خطة قدراتك الأساسية</SelectItem>
                    <SelectItem value="free">منح مجاني</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <p className="text-slate-400 text-xs mb-1">المدة (أيام)</p>
                <Input
                  type="number"
                  value={manualSubForm.durationDays}
                  onChange={e => setManualSubForm(f => ({ ...f, durationDays: e.target.value }))}
                  className="bg-slate-800 border-slate-700 text-white"
                  placeholder="30"
                />
              </div>
            </div>
            <div>
              <p className="text-slate-400 text-xs mb-1">السعر (اختياري)</p>
              <Input
                value={manualSubForm.price}
                onChange={e => setManualSubForm(f => ({ ...f, price: e.target.value }))}
                className="bg-slate-800 border-slate-700 text-white"
                placeholder="0 ر.س"
              />
            </div>
            <div>
              <p className="text-slate-400 text-xs mb-1">ملاحظات (اختياري)</p>
              <Textarea
                value={manualSubForm.notes}
                onChange={e => setManualSubForm(f => ({ ...f, notes: e.target.value }))}
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 resize-none"
                placeholder="سبب إضافة الاشتراك..."
                rows={2}
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                onClick={() => {
                  if (!manualSubForm.userId) return toast({ title: 'الرجاء تحديد طالب', variant: 'destructive' });
                  if (!manualSubForm.durationDays || parseInt(manualSubForm.durationDays) <= 0) return toast({ title: 'الرجاء إدخال مدة صحيحة', variant: 'destructive' });
                  createManualSub.mutate(manualSubForm);
                }}
                disabled={createManualSub.isPending}
              >
                {createManualSub.isPending ? 'جارٍ الإنشاء...' : 'إنشاء الاشتراك'}
              </Button>
              <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800" onClick={() => setShowManualSubDialog(false)}>
                إلغاء
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
