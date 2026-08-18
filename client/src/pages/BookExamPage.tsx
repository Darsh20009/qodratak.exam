import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Calendar, Clock, ChevronRight, ChevronLeft,
  CheckCircle2, AlertCircle, BookOpen,
  XCircle, Loader2, CalendarCheck, ArrowRight,
  Sun, Sunset, Moon, Star, Brain, Zap,
  GraduationCap, BookMarked, Trophy, MessageSquare, Send
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

type ExamTypeKey = 'qudrat_scientific' | 'qudrat_literary' | 'tahsili';

const EXAM_TYPES: Record<ExamTypeKey, {
  label: string; subtitle: string; icon: any;
  color: string; bg: string; border: string;
  questions: number; duration: string; description: string;
  sections: string;
}> = {
  qudrat_scientific: {
    label: 'قدراتك — تخصص علمي',
    subtitle: 'القدرات العامة (علمي)',
    icon: Brain,
    color: 'text-teal-700 dark:text-teal-700',
    bg: 'bg-teal-100 dark:bg-teal-100/20',
    border: 'border-teal-400 dark:border-teal-400',
    questions: 120, duration: '130 دقيقة',
    description: '50% لفظي + 50% كمي — 5 أقسام مختلطة',
    sections: '5 أقسام: 3 مختلطة + لفظي + كمي',
  },
  qudrat_literary: {
    label: 'قدراتك — تخصص أدبي',
    subtitle: 'القدرات العامة (أدبي)',
    icon: BookMarked,
    color: 'text-teal-700 dark:text-teal-700',
    bg: 'bg-teal-100 dark:bg-teal-100/20',
    border: 'border-teal-400 dark:border-teal-400',
    questions: 120, duration: '130 دقيقة',
    description: '70% لفظي + 30% كمي — مناسب للتخصصات الأدبية',
    sections: '5 أقسام: تركيز أعلى على اللفظي',
  },
  tahsili: {
    label: 'اختبار تحصيلي',
    subtitle: 'الاختبار التحصيلي الشامل',
    icon: GraduationCap,
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    border: 'border-emerald-200 dark:border-emerald-700',
    questions: 100, duration: '120 دقيقة',
    description: 'عربي + رياضيات + علوم + أحياء + كيمياء + فيزياء',
    sections: '6 مواد: شامل للثانوية العامة',
  },
};

interface Booking {
  _id: string;
  scheduledAt: string;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  examType?: ExamTypeKey;
  totalScoreOutOf100?: number;
  verbalPercent?: number;
  quantPercent?: number;
  correctAnswers?: number;
  wrongAnswers?: number;
  completedAt?: string;
  resultVisibleAt?: string;
}

const MINUTES = [0, 30];
const HOURS_NIGHT = [0, 1, 2, 3, 4, 5];
const HOURS_MORNING = [6, 7, 8, 9, 10, 11];
const HOURS_AFTERNOON = [12, 13, 14, 15, 16, 17];
const HOURS_EVENING = [18, 19, 20, 21, 22, 23];

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function toLocalDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatArabicDate(date: Date): string {
  return date.toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

function formatArabicDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ar-SA', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

const WEEKDAYS_AR = ['أحد', 'اثن', 'ثلاث', 'أرب', 'خمس', 'جمع', 'سبت'];

export default function BookExamPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [selectedTime, setSelectedTime] = useState<{ h: number; m: number } | null>(null);
  const [weekOffset, setWeekOffset] = useState(0);
  const [view, setView] = useState<'book' | 'history'>('book');
  const [, setTick] = useState(0);
  const [confirmStep, setConfirmStep] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [examType, setExamType] = useState<ExamTypeKey | null>(null);
  const [isObjectionOpen, setIsObjectionOpen] = useState(false);
  const [objectionBooking, setObjectionBooking] = useState<Booking | null>(null);
  const [objectionReason, setObjectionReason] = useState('');

  const { data: user } = useQuery<any>({ queryKey: ['/api/user'] });

  const { data: activeData, isLoading: loadingActive } = useQuery<{ booking: Booking | null }>({
    queryKey: ['/api/exam-bookings/active'],
  });

  const { data: historyData, isLoading: loadingHistory } = useQuery<{ bookings: Booking[] }>({
    queryKey: ['/api/exam-bookings/history'],
    enabled: view === 'history',
  });

  const { data: slotsData, isLoading: loadingSlots } = useQuery<{ bookedSlots: string[] }>({
    queryKey: ['/api/exam-bookings/slots', toLocalDateStr(selectedDate)],
    queryFn: () => fetch(`/api/exam-bookings/slots?date=${toLocalDateStr(selectedDate)}`).then(r => r.json()),
  });

  const createBooking = useMutation({
    mutationFn: ({ scheduledAt, examType }: { scheduledAt: string; examType: string }) =>
      apiRequest('POST', '/api/exam-bookings', { scheduledAt, examType }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/exam-bookings/active'] });
      queryClient.invalidateQueries({ queryKey: ['/api/exam-bookings/history'] });
      toast({ title: '✅ تم الحجز بنجاح!', description: 'موعد اختبارك محجوز. ستتلقى نتائجك على بريدك بعد ساعة من إنهاء الاختبار.' });
      setSelectedTime(null);
      setConfirmStep(false);
    },
    onError: (e: any) => {
      toast({ title: 'فشل الحجز', description: e.message || 'حدث خطأ', variant: 'destructive' });
    },
  });

  const cancelBooking = useMutation({
    mutationFn: (id: string) => apiRequest('DELETE', `/api/exam-bookings/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/exam-bookings/active'] });
      toast({ title: 'تم إلغاء الحجز', description: 'يمكنك حجز موعد جديد.' });
    },
  });

  const submitObjection = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      apiRequest('POST', `/api/exam-bookings/${id}/object`, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/exam-bookings/history'] });
      setIsObjectionOpen(false);
      setObjectionReason('');
      toast({ title: '✅ تم تقديم الاعتراض', description: 'سيتم مراجعة نتيجتك بالذكاء الاصطناعي وإعادة إرسالها.' });
    },
    onError: (e: any) => {
      toast({ title: 'فشل تقديم الاعتراض', description: e.message || 'حدث خطأ', variant: 'destructive' });
    },
  });

  const activeBooking = activeData?.booking;

  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!activeData?.booking) return;
    const booking = activeData.booking;
    const expiresAt = new Date(booking.scheduledAt).getTime() + 60 * 60 * 1000;
    const msUntilExpiry = expiresAt - Date.now();
    if (msUntilExpiry <= 0) {
      queryClient.invalidateQueries({ queryKey: ['/api/exam-bookings/active'] });
      return;
    }
    const timeout = setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: ['/api/exam-bookings/active'] });
      queryClient.invalidateQueries({ queryKey: ['/api/exam-bookings/history'] });
    }, msUntilExpiry + 1000);
    return () => clearTimeout(timeout);
  }, [activeData?.booking]);

  const bookedSlots = new Set<string>(
    (slotsData?.bookedSlots || []).map((s: string) => {
      const d = new Date(s);
      return `${d.getHours()}:${d.getMinutes()}`;
    })
  );

  const isSlotAvailable = (h: number, m: number): boolean => {
    const slotDate = new Date(selectedDate);
    slotDate.setHours(h, m, 0, 0);
    const minTime = new Date(Date.now() + 10 * 60 * 1000);
    if (slotDate < minTime) return false;
    return !bookedSlots.has(`${h}:${m}`);
  };

  const calendarDays: Date[] = [];
  for (let i = 0; i < 14; i++) {
    calendarDays.push(addDays(today, i + weekOffset * 7));
  }

  const handleConfirmBooking = () => {
    if (!selectedTime || !examType) return;
    const dt = new Date(selectedDate);
    dt.setHours(selectedTime.h, selectedTime.m, 0, 0);
    createBooking.mutate({ scheduledAt: dt.toISOString(), examType });
  };

  function canStartExam(booking: Booking): boolean {
    const diff = new Date(booking.scheduledAt).getTime() - Date.now();
    return diff <= 10 * 60 * 1000 && diff > -60 * 60 * 1000;
  }

  function isExpired(booking: Booking): boolean {
    return Date.now() - new Date(booking.scheduledAt).getTime() > 60 * 60 * 1000;
  }

  function getCountdown(scheduledAt: string): string {
    const diffMs = new Date(scheduledAt).getTime() - Date.now();
    if (diffMs <= 0) {
      const passed = Math.abs(diffMs);
      const rem = 60 - Math.floor(passed / 60000);
      const remS = 60 - Math.floor((passed % 60000) / 1000);
      if (rem <= 0) return 'انتهت نافذة الاختبار';
      return `متبقي ${rem} دقيقة ${remS} ثانية للدخول`;
    }
    const h = Math.floor(diffMs / 3600000);
    const m = Math.floor((diffMs % 3600000) / 60000);
    const s = Math.floor((diffMs % 60000) / 1000);
    if (h > 0) return `يبدأ بعد ${h}س ${m}د`;
    if (m > 0) return `يبدأ بعد ${m}د ${s}ث`;
    return `يبدأ بعد ${s} ثانية`;
  }

  function generateBookingRefNum(id: string, date: string): string {
    const str = id + date;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = Math.imul(31, hash) + str.charCodeAt(i) | 0;
    }
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    const year = new Date(date).getFullYear().toString().slice(2);
    let result = year;
    let num = Math.abs(hash);
    while (result.length < 14) {
      result += chars[num % 62];
      num = Math.floor(num / 62);
      if (num === 0) { num = Math.abs(hash) + result.length * 7; }
    }
    return result;
  }

  function formatBilingualDate(dateStr: string): string {
    const date = new Date(dateStr);
    const gregorian = date.toLocaleDateString('ar-SA', { year: 'numeric', month: '2-digit', day: '2-digit' });
    try {
      const hijri = new Intl.DateTimeFormat('ar-SA-u-ca-islamic', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
      return `${gregorian} - هـ ${hijri}`;
    } catch {
      return gregorian;
    }
  }

  function getBookingExamName(dateStr: string): string {
    const d = new Date(dateStr);
    const monthName = d.toLocaleDateString('ar-SA', { month: 'long' });
    const year = d.getFullYear();
    return `اختبار القدرات العامة - ${monthName} ${year}م`;
  }

  function renderTimeGroup(label: string, Icon: any, hours: number[], color: string) {
    const slots = hours.flatMap(h => MINUTES.map(m => ({ h, m })));
    const anyAvailable = slots.some(s => isSlotAvailable(s.h, s.m));
    return (
      <div>
        <div className={`flex items-center gap-2 mb-3`}>
          <div className={`w-7 h-7 rounded-lg ${color} flex items-center justify-center`}>
            <Icon className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{label}</span>
          {!anyAvailable && <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">غير متاح</span>}
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
          {slots.map(({ h, m }) => {
            const available = isSlotAvailable(h, m);
            const isSelected = selectedTime?.h === h && selectedTime?.m === m;
            const timeStr = `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}`;
            return (
              <button
                key={timeStr}
                disabled={!available}
                onClick={() => { setSelectedTime({ h, m }); setConfirmStep(true); }}
                data-testid={`btn-slot-${timeStr}`}
                className={`rounded-xl py-2.5 text-sm font-bold transition-all duration-200 ${
                  !available
                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-300 dark:text-gray-600 cursor-not-allowed'
                    : isSelected
                    ? 'bg-teal-100 text-white shadow-lg shadow-green-200 dark:shadow-green-900 scale-105'
                    : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-teal-400 hover:text-teal-700 hover:shadow-sm'
                }`}
              >
                {timeStr}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  function getScoreColor(score: number) {
    return score >= 70 ? 'text-emerald-600' : score >= 50 ? 'text-amber-600' : 'text-red-600';
  }
  function getScoreBg(score: number) {
    return score >= 70 ? 'bg-emerald-50 dark:bg-emerald-900/20' : score >= 50 ? 'bg-amber-50 dark:bg-amber-900/20' : 'bg-red-50 dark:bg-red-900/20';
  }
  function isResultVisible(b: Booking): boolean {
    if (b.status !== 'completed') return false;
    if (!b.resultVisibleAt) return true;
    return new Date(b.resultVisibleAt).getTime() <= Date.now();
  }
  function getResultCountdown(b: Booking): string {
    if (!b.resultVisibleAt) return '';
    const ms = new Date(b.resultVisibleAt).getTime() - Date.now();
    if (ms <= 0) return '';
    const totalSecs = Math.ceil(ms / 1000);
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    return m > 0 ? `${m}:${String(s).padStart(2, '0')}` : `${s}ث`;
  }

  return (
    <>
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-600/20 to-emerald-600/20 dark:from-gray-950 dark:via-teal-600/10 dark:to-gray-950 pb-24" dir="rtl">
      {/* ── Hero Header ── */}
      <div className="relative overflow-hidden bg-gradient-to-l from-teal-600 via-green-600 to-emerald-500 dark:from-teal-600 dark:via-green-600 dark:to-emerald-500">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 right-8 w-40 h-40 rounded-full bg-white/30 blur-3xl" />
          <div className="absolute bottom-0 left-16 w-56 h-56 rounded-full bg-white/20 blur-3xl" />
        </div>
        <div className="relative max-w-3xl mx-auto px-5 py-8">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-white/70 hover:text-white mb-5 text-sm transition-colors group"
          >
            <ArrowRight className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            العودة للرئيسية
          </button>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center shadow-xl">
              <CalendarCheck className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white">احجز اختبارك</h1>
              <p className="text-white/75 text-sm mt-1">اختبار القدرات الرسمي — 120 سؤال، 5 أقسام، نتائجك عبر البريد بعد ساعة</p>
            </div>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-3 mt-6">
            {[
              { label: 'عدد الأسئلة', value: '120', sub: 'سؤال (100 محسوب)', icon: Brain },
              { label: 'مدة كل قسم', value: '26', sub: 'دقيقة', icon: Clock },
              { label: 'الأسئلة التجريبية', value: '20', sub: 'غير محسوبة', icon: Zap },
            ].map(item => (
              <div key={item.label} className="bg-white/10 backdrop-blur rounded-2xl p-3 text-center">
                <item.icon className="w-4 h-4 text-white/60 mx-auto mb-1" />
                <p className="text-xl font-black text-white">{item.value}</p>
                <p className="text-white/60 text-xs">{item.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">

        {/* ── Active Booking Card ── */}
        {loadingActive ? (
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 flex items-center gap-3 shadow-sm">
            <Loader2 className="h-5 w-5 animate-spin text-teal-700" />
            <span className="text-gray-400 text-sm">جاري التحقق من حجوزاتك...</span>
          </div>
        ) : activeBooking ? (
          <div className={`rounded-3xl overflow-hidden shadow-lg ${
            canStartExam(activeBooking)
              ? 'bg-gradient-to-l from-emerald-500 to-teal-600'
              : isExpired(activeBooking)
              ? 'bg-gradient-to-l from-gray-500 to-gray-600'
              : 'bg-gradient-to-l from-teal-600 to-emerald-500'
          }`}>
            <div className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-3 h-3 rounded-full ${canStartExam(activeBooking) ? 'bg-white animate-pulse' : isExpired(activeBooking) ? 'bg-gray-300' : 'bg-white/60'}`} />
                <span className="text-white font-bold text-sm">
                  {canStartExam(activeBooking) ? '🟢 حان موعد اختبارك!' : isExpired(activeBooking) ? 'انتهت نافذة الاختبار' : '📅 لديك حجز نشط'}
                </span>
              </div>
              {activeBooking.examType && EXAM_TYPES[activeBooking.examType] && (
                <div className="bg-white/15 rounded-xl px-3 py-1.5 mb-2 flex items-center gap-2 w-fit">
                  <GraduationCap className="w-3.5 h-3.5 text-white/80" />
                  <span className="text-white/90 text-xs font-bold">{EXAM_TYPES[activeBooking.examType].label}</span>
                  <span className="text-white/60 text-[10px]">· {EXAM_TYPES[activeBooking.examType].questions} سؤال</span>
                </div>
              )}
              <p className="text-white/85 text-sm mb-1">{formatArabicDateTime(activeBooking.scheduledAt)}</p>
              <p className="text-white font-black text-lg">{getCountdown(activeBooking.scheduledAt)}</p>
            </div>
            <div className="bg-black/10 px-5 py-3 flex gap-3">
              {canStartExam(activeBooking) && (
                <button
                  onClick={() => navigate(`/scheduled-exam/${activeBooking._id}`)}
                  className="flex-1 py-2.5 rounded-xl bg-white text-emerald-700 font-black text-sm hover:bg-emerald-50 transition-colors shadow"
                  data-testid="btn-start-exam"
                >
                  🚀 ابدأ الاختبار الآن
                </button>
              )}
              {!isExpired(activeBooking) && (
                <button
                  onClick={() => cancelBooking.mutate(activeBooking._id)}
                  disabled={cancelBooking.isPending}
                  className="py-2.5 px-4 rounded-xl bg-white/10 text-white/80 font-semibold text-sm hover:bg-white/20 transition-colors border border-white/20"
                  data-testid="btn-cancel-booking"
                >
                  {cancelBooking.isPending ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : 'إلغاء'}
                </button>
              )}
            </div>
          </div>
        ) : null}

        {/* ── Warning about no active booking when trying to start ── */}
        {!activeBooking && !loadingActive && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 rounded-2xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-amber-800 dark:text-amber-300 font-semibold text-sm">خلال الاختبار</p>
              <p className="text-amber-700 dark:text-amber-400 text-xs mt-0.5 leading-relaxed">
                لا يمكن مغادرة الصفحة أو فتح نوافذ أخرى. عند مغادرة الصفحة 3 مرات سيتم تسليم الاختبار تلقائياً. ستصلك نتائجك على بريدك بعد ساعة من إنهاء الاختبار.
              </p>
            </div>
          </div>
        )}

        {/* ── Tabs ── */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-1.5 shadow-sm border border-gray-100 dark:border-gray-800 flex gap-1">
          {[
            { id: 'book', label: 'احجز موعداً جديداً', icon: Calendar },
            { id: 'history', label: 'سجل اختباراتي', icon: Trophy },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setView(tab.id as 'book' | 'history')}
              data-testid={`tab-${tab.id}`}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                view === tab.id
                  ? 'bg-teal-100 text-white shadow-md'
                  : 'text-gray-500 dark:text-gray-400 hover:text-teal-700 dark:hover:text-teal-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Booking View ── */}
        {view === 'book' && !activeBooking && (
          <div className="space-y-5">

            {/* Step 0: Exam Type Selection */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
              <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                <GraduationCap className="h-4 w-4 text-teal-700" />
                اختر نوع الاختبار
              </h3>
              <div className="grid gap-3">
                {(Object.entries(EXAM_TYPES) as [ExamTypeKey, typeof EXAM_TYPES[ExamTypeKey]][]).map(([key, info]) => {
                  const Icon = info.icon;
                  const isSelected = examType === key;
                  return (
                    <button
                      key={key}
                      data-testid={`exam-type-${key}`}
                      onClick={() => { setExamType(key); setSelectedTime(null); setConfirmStep(false); }}
                      className={`w-full flex items-start gap-4 p-4 rounded-2xl border-2 transition-all duration-200 text-right ${
                        isSelected
                          ? `${info.bg} ${info.border} shadow-md`
                          : 'border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isSelected ? info.bg : 'bg-gray-100 dark:bg-gray-800'}`}>
                        <Icon className={`w-5 h-5 ${isSelected ? info.color : 'text-gray-400'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className={`font-bold text-sm ${isSelected ? info.color : 'text-gray-800 dark:text-gray-200'}`}>{info.label}</p>
                          {isSelected && <CheckCircle2 className={`w-4 h-4 flex-shrink-0 ${info.color}`} />}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{info.description}</p>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-[10px] text-gray-400 flex items-center gap-1"><Brain className="w-3 h-3" />{info.questions} سؤال</span>
                          <span className="text-[10px] text-gray-400 flex items-center gap-1"><Clock className="w-3 h-3" />{info.duration}</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Calendar — shown only after exam type is selected */}
            {examType && <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-teal-700" />
                  اختر التاريخ
                </h3>
                <div className="flex gap-1">
                  <button
                    onClick={() => setWeekOffset(w => Math.max(0, w - 1))}
                    className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-teal-100 hover:text-teal-700 transition-colors"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setWeekOffset(w => Math.min(3, w + 1))}
                    className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-teal-100 hover:text-teal-700 transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, i) => {
                  const isPast = day < today;
                  const isSelected = isSameDay(day, selectedDate);
                  const isToday = isSameDay(day, today);
                  return (
                    <button
                      key={i}
                      disabled={isPast}
                      onClick={() => { setSelectedDate(day); setSelectedTime(null); setConfirmStep(false); }}
                      data-testid={`btn-day-${i}`}
                      className={`rounded-2xl py-2.5 flex flex-col items-center transition-all duration-200 ${
                        isPast ? 'opacity-25 cursor-not-allowed' :
                        isSelected ? 'bg-teal-100 text-white shadow-lg shadow-green-200 dark:shadow-green-900 scale-105' :
                        isToday ? 'border-2 border-teal-400 text-teal-700 dark:text-teal-700' :
                        'hover:bg-teal-100 dark:hover:bg-teal-100/20 text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      <span className="text-xs">{WEEKDAYS_AR[day.getDay()]}</span>
                      <span className="font-black text-base mt-0.5">{day.getDate()}</span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 bg-teal-100 dark:bg-teal-100/20 rounded-2xl px-4 py-2.5 text-center">
                <p className="text-teal-700 dark:text-teal-700 font-bold text-sm">{formatArabicDate(selectedDate)}</p>
              </div>
            </div>}

            {/* Time slots — shown after exam type is selected */}
            {examType && <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Clock className="h-4 w-4 text-teal-700" />
                  اختر الوقت
                </h3>
                {loadingSlots && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
              </div>
              <div className="space-y-6">
                {renderTimeGroup('الصباح (6 — 11)', Sun, HOURS_MORNING, 'bg-amber-400')}
                {renderTimeGroup('بعد الظهر (12 — 17)', Sunset, HOURS_AFTERNOON, 'bg-orange-500')}
                {renderTimeGroup('المساء (18 — 23)', Moon, HOURS_EVENING, 'bg-teal-100')}
                {renderTimeGroup('الليل (12 ص — 5 ص)', Star, HOURS_NIGHT, 'bg-teal-100')}
              </div>
              <div className="flex gap-5 mt-5 pt-4 border-t border-gray-100 dark:border-gray-800 text-xs">
                <div className="flex items-center gap-1.5 text-gray-500"><div className="w-3 h-3 rounded bg-white border border-gray-200 dark:bg-gray-800 dark:border-gray-700" /><span>متاح</span></div>
                <div className="flex items-center gap-1.5 text-gray-500"><div className="w-3 h-3 rounded bg-gray-100 dark:bg-gray-700" /><span>غير متاح</span></div>
                <div className="flex items-center gap-1.5 text-gray-500"><div className="w-3 h-3 rounded bg-teal-100" /><span>محدد</span></div>
              </div>
            </div>}

            {/* Confirm step */}
            {confirmStep && selectedTime && (
              <div className="bg-gradient-to-l from-teal-600 to-emerald-500 rounded-3xl p-5 shadow-xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-white/75 text-xs">الموعد الذي اخترته</p>
                    <p className="text-white font-black text-lg leading-tight">
                      {selectedTime.h.toString().padStart(2,'0')}:{selectedTime.m.toString().padStart(2,'0')}
                    </p>
                    <p className="text-white/80 text-xs">{formatArabicDate(selectedDate)}</p>
                  </div>
                </div>
                {examType && (
                  <div className="bg-white/15 rounded-2xl px-3 py-2 mb-3 flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-white/80 flex-shrink-0" />
                    <div>
                      <p className="text-white font-bold text-xs">{EXAM_TYPES[examType].label}</p>
                      <p className="text-white/65 text-[10px]">{EXAM_TYPES[examType].questions} سؤال · {EXAM_TYPES[examType].duration}</p>
                    </div>
                  </div>
                )}
                <div className="bg-white/10 rounded-2xl p-3 mb-4 text-xs text-white/75 space-y-1">
                  <p>• يمكنك الدخول للاختبار قبل 10 دقائق من الموعد</p>
                  <p>• تبقى نافذة الاختبار مفتوحة 60 دقيقة بعد الموعد</p>
                  <p>• ستصلك نتائجك على بريدك بعد ساعة من إنهاء الاختبار</p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleConfirmBooking}
                    disabled={createBooking.isPending}
                    className="flex-1 py-3 rounded-2xl bg-white text-teal-700 font-black text-sm hover:bg-teal-100 transition-colors shadow"
                    data-testid="btn-confirm-booking"
                  >
                    {createBooking.isPending ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : '✅ تأكيد الحجز'}
                  </button>
                  <button
                    onClick={() => { setSelectedTime(null); setConfirmStep(false); }}
                    className="py-3 px-4 rounded-2xl bg-white/10 text-white/80 font-semibold text-sm hover:bg-white/20 transition-colors border border-white/20"
                  >
                    تغيير
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Blocked when active booking ── */}
        {view === 'book' && activeBooking && !isExpired(activeBooking) && (
          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-8 text-center shadow-sm">
            <div className="w-16 h-16 rounded-full bg-teal-100 dark:bg-teal-100/30 flex items-center justify-center mx-auto mb-4">
              <CalendarCheck className="w-8 h-8 text-teal-700" />
            </div>
            <p className="text-gray-700 dark:text-gray-300 font-bold text-base mb-2">لديك حجز نشط بالفعل</p>
            <p className="text-gray-500 dark:text-gray-400 text-sm">يجب إلغاء حجزك الحالي أو إكمال الاختبار أولاً</p>
          </div>
        )}

        {/* ── History View – نمط قياس الرسمي ── */}
        {view === 'history' && (
          <div className="space-y-4">
            {loadingHistory ? (
              <div className="text-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-3" />
                <p className="text-gray-400 text-sm">جاري تحميل السجل...</p>
              </div>
            ) : !historyData?.bookings?.length ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm">
                <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="h-10 w-10 text-gray-300" />
                </div>
                <p className="text-gray-600 font-bold mb-1">لا يوجد سجل اختبارات بعد</p>
                <p className="text-gray-400 text-sm">احجز موعدك الأول وابدأ رحلتك!</p>
              </div>
            ) : (
              historyData.bookings.map((b) => {
                const completed = b.status === 'completed';
                const resultVisible = isResultVisible(b);
                const countdown = completed && !resultVisible ? getResultCountdown(b) : '';
                const score = b.totalScoreOutOf100 ?? 0;
                const examName = getBookingExamName(b.scheduledAt);
                const refNum = generateBookingRefNum(b._id, b.scheduledAt);
                return (
                  <div
                    key={b._id}
                    className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                    data-testid={`booking-history-${b._id}`}
                  >
                    {/* شريط علوي ملوّن */}
                    <div className={`h-1 w-full ${completed && !resultVisible ? 'bg-teal-100' : completed ? 'bg-primary' : b.status === 'cancelled' ? 'bg-red-400' : 'bg-amber-400'}`}></div>

                    {/* اسم الاختبار */}
                    <div className="px-4 pt-4 pb-3 border-b border-gray-100">
                      {b.examType && EXAM_TYPES[b.examType] && (
                        <div className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full mb-2 ${EXAM_TYPES[b.examType].bg} ${EXAM_TYPES[b.examType].color}`}>
                          <GraduationCap className="w-3 h-3" />
                          {EXAM_TYPES[b.examType].label}
                        </div>
                      )}
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-bold text-gray-900 text-base leading-snug">{examName}</h3>
                        {completed && !resultVisible ? (
                          <span className="text-xs font-bold px-2 py-1 rounded-full flex-shrink-0 bg-teal-100 text-teal-700 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            قيد المعالجة
                          </span>
                        ) : !completed && (
                          <span className={`text-xs font-bold px-2 py-1 rounded-full flex-shrink-0 ${
                            b.status === 'cancelled' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {b.status === 'cancelled' ? 'ملغى' : 'في الانتظار'}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* بيانات الاختبار */}
                    <div className="px-4 py-3 space-y-2.5">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-600">تاريخ الاختبار :</span>
                        <span className="text-sm text-gray-700">{formatBilingualDate(b.scheduledAt)}</span>
                      </div>
                      {completed && !resultVisible ? (
                        <div className="bg-teal-100 border border-teal-400 rounded-lg px-3 py-2.5 text-center">
                          <p className="text-teal-700 text-xs font-bold mb-0.5">🤖 جارٍ مراجعة الإجابات بالذكاء الاصطناعي</p>
                          <p className="text-teal-700 text-xs">
                            {countdown
                              ? `ستظهر النتيجة المراجَعة خلال ${countdown}`
                              : 'ستظهر النتيجة المراجَعة خلال 10-15 دقيقة'}
                          </p>
                          <p className="text-teal-700 text-[10px] mt-1">📧 ستصلك النتيجة على بريدك بعد اكتمال المراجعة</p>
                        </div>
                      ) : completed && resultVisible && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-600">الدرجة الكلية :</span>
                          <span className={`text-sm font-bold ${getScoreColor(score)}`}>{score}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-600">الرقم المرجعي :</span>
                        <span className="text-xs font-mono text-gray-500">{refNum}</span>
                      </div>
                    </div>

                    {/* أزرار العمل */}
                    <div className="px-4 pb-4 flex gap-2 flex-wrap">
                      {completed && resultVisible && (
                        <button
                          onClick={() => { setSelectedBooking(b); setIsDetailsOpen(true); }}
                          className="flex-1 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white text-sm font-medium transition-colors"
                          data-testid={`btn-booking-details-${b._id}`}
                        >
                          التفاصيل
                        </button>
                      )}
                      {completed && resultVisible && !(b as any).hasObjection && (
                        <button
                          onClick={() => { setObjectionBooking(b); setObjectionReason(''); setIsObjectionOpen(true); }}
                          className="py-2 px-3 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 text-xs font-medium transition-colors flex items-center gap-1"
                          data-testid={`btn-object-${b._id}`}
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          اعتراض على النتيجة
                        </button>
                      )}
                      {completed && resultVisible && (b as any).hasObjection && (
                        <span className="py-2 px-3 rounded-lg bg-blue-50 text-blue-600 text-xs font-medium flex items-center gap-1 border border-blue-100">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          تم تقديم الاعتراض
                        </span>
                      )}
                      {b.status === 'pending' && canStartExam(b) && (
                        <button
                          onClick={() => navigate(`/scheduled-exam/${b._id}`)}
                          className="flex-1 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white font-bold text-sm transition-colors"
                          data-testid={`btn-start-exam-${b._id}`}
                        >
                          🚀 ابدأ الاختبار الآن
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ── نافذة التفاصيل بالنمط الرسمي لقياس ── */}
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="max-w-2xl p-0 overflow-hidden" dir="rtl">
            {selectedBooking && (
              <div className="bg-white">
                {/* بطاقة التفاصيل */}
                <div className="m-4 border border-gray-200 rounded overflow-hidden">
                  <div className="bg-gray-100 border-b border-gray-200 px-4 py-3 text-center">
                    <h3 className="font-bold text-gray-800 text-base">{getBookingExamName(selectedBooking.scheduledAt)}</h3>
                  </div>
                  <div className="divide-y divide-gray-100">
                    <div className="flex justify-between px-4 py-2.5">
                      <span className="font-semibold text-gray-700 text-sm">اسم المختبر :</span>
                      <span className="text-gray-700 text-sm">{user?.name || user?.username || 'الطالب'}</span>
                    </div>
                    <div className="flex justify-between px-4 py-2.5">
                      <span className="font-semibold text-gray-700 text-sm">تاريخ الاختبار :</span>
                      <span className="text-gray-700 text-sm">{formatBilingualDate(selectedBooking.scheduledAt)}</span>
                    </div>
                    <div className="flex justify-between px-4 py-2.5">
                      <span className="font-semibold text-gray-700 text-sm">نوع الاختبار :</span>
                      <span className="text-gray-700 text-sm">محاكاة رسمية</span>
                    </div>
                    {selectedBooking.verbalPercent !== undefined && (
                      <div className="flex justify-between px-4 py-2.5">
                        <span className="font-semibold text-gray-700 text-sm">درجة اللفظي :</span>
                        <span className="text-gray-700 text-sm">{selectedBooking.verbalPercent?.toFixed(1)}</span>
                      </div>
                    )}
                    {selectedBooking.quantPercent !== undefined && (
                      <div className="flex justify-between px-4 py-2.5">
                        <span className="font-semibold text-gray-700 text-sm">درجة الكمي :</span>
                        <span className="text-gray-700 text-sm">{selectedBooking.quantPercent?.toFixed(1)}</span>
                      </div>
                    )}
                    <div className="flex justify-between px-4 py-2.5">
                      <span className="font-semibold text-gray-700 text-sm">الدرجة الكلية :</span>
                      <span className="font-bold text-gray-900 text-sm">{selectedBooking.totalScoreOutOf100 ?? 0}</span>
                    </div>
                    <div className="flex justify-between px-4 py-2.5">
                      <span className="font-semibold text-gray-700 text-sm">الرقم المرجعي :</span>
                      <span className="text-gray-600 text-xs font-mono">{generateBookingRefNum(selectedBooking._id, selectedBooking.scheduledAt)}</span>
                    </div>
                  </div>
                </div>

                {/* قسم الحساب والتنبيهات */}
                <div className="mx-4 mb-4 text-sm text-gray-700 space-y-3">
                  <div>
                    <p className="font-semibold mb-1">يتم حساب الدرجة الكلية كالتالي :</p>
                    <ul className="list-disc list-inside space-y-1 text-gray-600">
                      <li>التخصصات العلمية : 0.5 × درجة الجزء اللفظي + 0.5 × درجة الجزء الكمي</li>
                      <li>التخصصات النظرية : 0.7 × درجة الجزء اللفظي + 0.3 × درجة الجزء الكمي</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold mb-1">يجدر التنبيه إلى مايلي :</p>
                    <ul className="list-disc list-inside space-y-1 text-gray-600">
                      <li>ليس هناك نجاح أو رسوب في الاختبار.</li>
                      <li>الوزن الذي يعطى لاختبار القدرات للجامعات يرجع لتقديره للجامعات، لكنه يتراوح غالباً بين 30% و 50%.</li>
                      <li>ينبغي على الطالب مراعاة شروط القبول بالجامعات والكليات وكذلك مواعيد التقديم.</li>
                    </ul>
                  </div>
                  <p className="text-xs text-gray-400 border-t border-gray-100 pt-2">
                    هذه نتيجة تدريبية من منصة قدراتك وليست نتيجة رسمية من هيئة تقويم التعليم والتدريب
                  </p>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* ── Bottom tip ── */}
        <div className="bg-gradient-to-l from-green-500 to-teal-500 dark:from-green-500/10 dark:to-teal-500/10 border border-teal-400 dark:border-teal-400/30 rounded-2xl p-4 flex items-start gap-3">
          <Star className="w-4 h-4 text-teal-700 flex-shrink-0 mt-0.5" />
          <p className="text-teal-700 dark:text-teal-700 text-xs leading-relaxed">
            <strong>تذكّر:</strong> الاختبار يحاكي اختبار قياس الرسمي تماماً. 120 سؤال موزعة على 5 أقسام (20 سؤالاً تجريبياً لا تحتسب في درجتك). ستصلك نتيجتك الكاملة على بريدك الإلكتروني بعد ساعة من انتهاء الاختبار.
          </p>
        </div>
      </div>
    </div>

    {/* ── مودال الاعتراض على النتيجة ── */}
    <Dialog open={isObjectionOpen} onOpenChange={(v) => { setIsObjectionOpen(v); if (!v) setObjectionReason(''); }}>
      <DialogContent className="max-w-md" dir="rtl">
        <div className="p-2">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-base">الاعتراض على النتيجة</h3>
              <p className="text-gray-500 text-xs mt-0.5">سيتم مراجعة إجاباتك بالذكاء الاصطناعي</p>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 mb-4 text-xs text-amber-800 space-y-1">
            <p className="font-semibold">معلومات مهمة قبل الاعتراض:</p>
            <p>• سيتم إعادة مراجعة إجاباتك بالذكاء الاصطناعي</p>
            <p>• النتيجة المعدّلة ستُرسل إلى بريدك الإلكتروني</p>
            <p>• يمكن الاعتراض مرة واحدة فقط لكل اختبار</p>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">سبب الاعتراض</label>
            <textarea
              value={objectionReason}
              onChange={(e) => setObjectionReason(e.target.value)}
              placeholder="اشرح سبب اعتراضك على النتيجة (مثال: أعتقد أن إجاباتي صحيحة في السؤال...)"
              className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none h-28 focus:outline-none focus:ring-2 focus:ring-amber-400 text-right"
              data-testid="textarea-objection-reason"
              dir="rtl"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                if (!objectionReason.trim()) {
                  toast({ title: 'مطلوب', description: 'يرجى كتابة سبب الاعتراض', variant: 'destructive' });
                  return;
                }
                if (objectionBooking) {
                  submitObjection.mutate({ id: objectionBooking._id, reason: objectionReason });
                }
              }}
              disabled={submitObjection.isPending}
              className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              data-testid="btn-submit-objection"
            >
              {submitObjection.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {submitObjection.isPending ? 'جارٍ الإرسال...' : 'تقديم الاعتراض'}
            </button>
            <button
              onClick={() => { setIsObjectionOpen(false); setObjectionReason(''); }}
              className="py-3 px-4 rounded-xl bg-gray-100 text-gray-600 font-medium text-sm hover:bg-gray-200 transition-colors"
            >
              إلغاء
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
