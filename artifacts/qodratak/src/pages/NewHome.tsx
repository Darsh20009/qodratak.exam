import { useState, useEffect, useRef, memo } from "react";
import { Link } from "wouter";
import { SEO } from "@/components/SEO";
import { useQuery } from "@tanstack/react-query";
import {
  BookOpenIcon, GraduationCapIcon, Sparkles, UserIcon, CrownIcon,
  Target, Trophy, ArrowRight, Brain, FileText, Zap, Star,
  CheckCircle2, BarChart2, Clock, Flame, Medal, TrendingUp,
  Layers, BookMarked, ChevronLeft, Rocket, Award, ChevronRight,
  MessageSquare, Search, CalendarDays,
  Timer, Dna, Users, BarChart3, BookOpen, Swords
} from "lucide-react";
import { DailyGoalWidget } from "@/components/DailyGoalWidget";
import SubscriptionRenewalDialog from "@/components/SubscriptionRenewalDialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Invoice } from "@/components/Invoice";
import useSubscription from "@/hooks/useSubscription";
import { useUser } from "@/hooks/use-user";

// ─── Landing page data ────────────────────────────────────────────────────────

const mainFeatures = [
  {
    title: "اختبارات قياس",
    description: "محاكاة دقيقة لاختبار قياس الرسمي — 7 أقسام متكاملة",
    icon: GraduationCapIcon,
    href: "/qiyas",
    gradient: "from-blue-500 to-teal-500",
    glow: "glow-blue",
    orb: "orb-blue",
    bg: "bg-blue-50 dark:bg-blue-950/30",
    iconBg: "bg-gradient-to-br from-blue-500 to-teal-500",
    badge: "الأكثر استخداماً",
    badgeColor: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
  },
  {
    title: "بنك الأسئلة",
    description: "أكثر من 4,500 سؤال مع شروحات تفصيلية لكل إجابة",
    icon: BookOpenIcon,
    href: "/question-bank",
    gradient: "from-emerald-500 to-teal-600",
    glow: "glow-green",
    orb: "orb-green",
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    iconBg: "bg-gradient-to-br from-emerald-500 to-teal-600",
    badge: "4,500+ سؤال",
    badgeColor: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
  },
  {
    title: "نماذج الورقي",
    description: "36 نموذجاً ورقياً قابلاً للطباعة مع تصحيح فوري",
    icon: FileText,
    href: "/paper-models",
    gradient: "from-green-500 to-emerald-600",
    glow: "glow-green",
    orb: "orb-green",
    bg: "bg-teal-100 dark:bg-teal-100/30",
    iconBg: "bg-gradient-to-br from-green-500 to-emerald-600",
    badge: "36 نموذج",
    badgeColor: "bg-teal-100 text-teal-700 dark:bg-teal-100/50 dark:text-teal-700",
  },
  {
    title: "ملفك الشخصي",
    description: "تتبع تقدمك وإنجازاتك مع تحليل ذكي لأدائك",
    icon: UserIcon,
    href: "/profile",
    gradient: "from-orange-500 to-amber-500",
    glow: "glow-amber",
    orb: "orb-amber",
    bg: "bg-orange-50 dark:bg-orange-950/30",
    iconBg: "bg-gradient-to-br from-orange-500 to-amber-500",
    badge: "تحليل ذكي",
    badgeColor: "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300",
  },
];

const quickLinks = [
  { title: "اختبارات اللفظي", href: "/verbal-tests", icon: BookOpenIcon, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-900/40" },
  { title: "اختبارات الكمي", href: "/quantitative-tests", icon: Brain, color: "text-green-700", bg: "bg-green-100 dark:bg-green-100/30 hover:bg-green-100 dark:hover:bg-green-100/40" },
  { title: "الدورات", href: "/courses", icon: GraduationCapIcon, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/40" },
  { title: "التحليل", href: "/profile", icon: BarChart2, color: "text-cyan-500", bg: "bg-cyan-50 dark:bg-cyan-950/30 hover:bg-cyan-100 dark:hover:bg-cyan-900/40" },
  { title: "الاختبار المجدول", href: "/book-exam", icon: Clock, color: "text-rose-500", bg: "bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/40" },
];

const smartTools = [
  {
    title: "بطاقات المراجعة",
    desc: "مراجعة سريعة قبل الاختبار",
    href: "/flashcards",
    icon: Layers,
    color: "from-green-500 to-emerald-600",
    badge: "جديد",
    badgeColor: "bg-teal-100 text-teal-700 dark:bg-teal-100/40 dark:text-teal-700",
  },
  {
    title: "اختبار تكيفي",
    desc: "الخوارزمية تتكيف مع مستواك",
    href: "/adaptive-test",
    icon: Brain,
    color: "from-blue-500 to-cyan-600",
    badge: "ذكي",
    badgeColor: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  },
  {
    title: "تحليل الأخطاء",
    desc: "اكتشف سبب أخطائك المتكررة",
    href: "/error-analysis",
    icon: TrendingUp,
    color: "from-red-500 to-rose-600",
    badge: "تحليل",
    badgeColor: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  },
  {
    title: "تقرير الأداء",
    desc: "شارك تقرير أدائك PDF",
    href: "/performance-report",
    icon: BarChart2,
    color: "from-emerald-500 to-teal-600",
    badge: "PDF",
    badgeColor: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  },
  {
    title: "غرف الدراسة",
    desc: "ادرس مع أصدقائك مجدولاً",
    href: "/study-rooms",
    icon: BookMarked,
    color: "from-orange-500 to-amber-600",
    badge: "جماعي",
    badgeColor: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  },
  {
    title: "جلسة قبل الاختبار",
    desc: "أهم 100 سؤال مرجح",
    href: "/pre-exam-day",
    icon: Flame,
    color: "from-amber-500 to-red-600",
    badge: "مهم",
    badgeColor: "bg-amber-100 text-amber-700 dark:bg-amber-100/40 dark:text-amber-700",
  },
  {
    title: "مكتبة الاستراتيجيات",
    desc: "شروح وأسرار حل الأسئلة",
    href: "/strategy-library",
    icon: Star,
    color: "from-yellow-500 to-orange-500",
    badge: "مميز",
    badgeColor: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
  },
];

const whyUs = [
  { icon: Star, title: "أسئلة عالية الجودة", desc: "مراجعة دقيقة من خبراء متخصصين في القدرات", color: "from-amber-400 to-yellow-500", bg: "bg-amber-50 dark:bg-amber-950/20" },
  { icon: Brain, title: "تحليل ذكي", desc: "رصد نقاط قوتك وضعفك تلقائياً بعد كل اختبار", color: "from-green-600 to-emerald-500", bg: "bg-green-100 dark:bg-green-100/20" },
  { icon: Target, title: "محاكاة حقيقية", desc: "تجربة مطابقة للاختبار الرسمي بالوقت والضغط", color: "from-blue-400 to-cyan-500", bg: "bg-blue-50 dark:bg-blue-950/20" },
  { icon: TrendingUp, title: "تحسّن مستمر", desc: "خوارزمية ذكية تكيّف الأسئلة مع مستواك", color: "from-emerald-400 to-teal-500", bg: "bg-emerald-50 dark:bg-emerald-950/20" },
  { icon: Medal, title: "شارات إنجاز", desc: "حوّل دراستك إلى تحدٍّ ممتع وتنافس مع الآخرين", color: "from-rose-400 to-amber-600", bg: "bg-rose-50 dark:bg-rose-950/20" },
  { icon: Zap, title: "تحديث فوري", desc: "أسئلة وشروحات جديدة تُضاف باستمرار 24/7", color: "from-orange-400 to-amber-500", bg: "bg-orange-50 dark:bg-orange-950/20" },
];

const AnimatedNumber = memo(({ target, suffix = "" }: { target: number; suffix?: string }) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const duration = 1500;
        const step = target / (duration / 16);
        let current = 0;
        const timer = setInterval(() => {
          current = Math.min(current + step, target);
          setCount(Math.floor(current));
          if (current >= target) clearInterval(timer);
        }, 16);
      }
    });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return <span ref={ref}>{count.toLocaleString('ar-SA')}{suffix}</span>;
});
AnimatedNumber.displayName = "AnimatedNumber";

// ─── AI feature list for dashboard ────────────────────────────────────────────

const AI_FEATURES_PREVIEW = [
  { id: "score-prediction", title: "توقع الدرجة", subtitle: "درجتك المتوقعة في قياس", icon: TrendingUp, href: "/ai-hub/score-prediction", status: "live" as const, accent: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
  { id: "pattern-analysis", title: "الأنماط الخفية", subtitle: "اكتشف أنماط أخطائك", icon: Search, href: "/ai-hub/pattern-analysis", status: "live" as const, accent: "text-teal-700", bg: "bg-teal-100/10 border-teal-400/20" },
  { id: "daily-plan", title: "خطة اليوم", subtitle: "جدول ذكي يومي متجدد", icon: CalendarDays, href: "/ai-hub/daily-plan", status: "live" as const, accent: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
  { id: "socratic-tutor", title: "المرشد السقراطي", subtitle: "تعلم بالتفكير لا الحفظ", icon: MessageSquare, href: "/ai-tutor", status: "live" as const, accent: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
  { id: "question-generator", title: "مولّد الأسئلة", subtitle: "أسئلة مخصصة لنقاط ضعفك", icon: Zap, href: "/ai-hub", status: "soon" as const, accent: "text-amber-700", bg: "bg-amber-100/10 border-pink-500/20" },
  { id: "pressure-simulator", title: "محاكي الضغط", subtitle: "تدريب إدارة الوقت", icon: Timer, href: "/ai-hub", status: "soon" as const, accent: "text-rose-400", bg: "bg-rose-500/10 border-rose-500/20" },
  { id: "question-dna", title: "نبرة السؤال", subtitle: "القراءة بين السطور", icon: Dna, href: "/ai-hub", status: "soon" as const, accent: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/20" },
  { id: "peer-comparison", title: "مقارنة الناجحين", subtitle: "تعلم من المتفوقين", icon: Users, href: "/ai-hub", status: "soon" as const, accent: "text-teal-700", bg: "bg-teal-100/10 border-teal-400/20" },
];

// ─── Primary actions for dashboard ────────────────────────────────────────────

const PRIMARY_ACTIONS = [
  { title: "اختبار قياس", desc: "7 أقسام — 120 دقيقة", href: "/qiyas", icon: GraduationCapIcon, color: "", green: true, textClass: "text-white" },
  { title: "بنك الأسئلة", desc: "4500+ سؤال", href: "/question-bank", icon: BookOpen, color: "bg-gray-900 hover:bg-gray-800 dark:bg-gray-700", green: false, textClass: "text-white" },
  { title: "تحدي الأخطاء", desc: "راجع نقاط ضعفك", href: "/mistake-challenge", icon: Swords, color: "bg-amber-500 hover:bg-amber-600", green: false, textClass: "text-white" },
  { title: "اختبار لفظي", desc: "تقدر تبدأ الآن", href: "/verbal-tests", icon: BookOpenIcon, color: "bg-white dark:bg-card hover:bg-gray-50 border border-gray-200 dark:border-border", green: false, textClass: "text-gray-900 dark:text-foreground" },
];

// ─── Secondary tools ───────────────────────────────────────────────────────────

const SECONDARY_TOOLS = [
  { title: "المكتبة المشتركة", href: "/library", icon: BookOpen, badge: "كل المواد" },
  { title: "مجلداتي", href: "/folders", icon: FileText, badge: "محفوظاتك" },
  { title: "سجل الاختبارات", href: "/records", icon: BarChart2, badge: "نتائجك" },
  { title: "احجز اختبارك", href: "/book-exam", icon: CalendarDays, badge: "مواعيد" },
];

const STUDENT_PROGRAMS = [
  { title: "القدرات", english: "Qudrat", description: "تأسيس ومحوسب ومسار واضح للتقدم.", href: "/student-program/qudrat", icon: Brain },
  { title: "التحصيلي", english: "Tahsili", description: "دراسة واختبارات حسب المواد.", href: "/student-program/tahsili", icon: GraduationCapIcon },
];

// ─── Logged-in student dashboard ──────────────────────────────────────────────

const GREEN = "#0D1B2A";
const GREEN_LIGHT = "#E5E7EB";

function LoggedInDashboard({ user }: { user: any }) {
  const [subscriptionDialogOpen, setSubscriptionDialogOpen] = useState(false);
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const name = user?.name || user?.username || "طالب";
  const firstName = name.split(" ")[0];
  const { subscription, countdown } = useSubscription();
  const isPremium = Boolean(
    subscription?.hasActiveSubscription &&
    subscription?.canAccessPremiumFeatures &&
    !subscription?.isExpired,
  );

  const { data: mySubscriptions } = useQuery<any[]>({
    queryKey: ['/api/user/my-subscriptions'],
    enabled: !!user,
  });
  const currentSubData = mySubscriptions?.find((s: any) => s.status === 'active') || mySubscriptions?.[0];

  const { data: rankData } = useQuery<{ currentRank: number; totalPoints: number }>({
    queryKey: [`/api/users/${user?.id || user?._id}/rank`],
    enabled: !!(user?.id || user?._id),
  });

  const { data: prediction } = useQuery<{
    predictedScore: number; recentTrend: string; totalTests: number; averageScore: number;
  } | null>({
    queryKey: ["/api/ai/score-prediction", user?.id || user?._id],
    enabled: !!(user?.id || user?._id),
    staleTime: 5 * 60 * 1000,
  });

  const { data: dailyGoal } = useQuery<{ target: number; completed: number }>({
    queryKey: ["/api/daily-goal"],
    staleTime: 60 * 1000,
  });

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "صباح الخير" : hour < 17 ? "مساء الخير" : "مساء النور";

  const dailyDone = dailyGoal?.completed ?? 0;
  const dailyTarget = dailyGoal?.target ?? 20;
  const dailyPct = Math.min(100, Math.round((dailyDone / dailyTarget) * 100));

  const scoreColor = prediction && prediction.predictedScore >= 70
    ? "text-emerald-600" : prediction && prediction.predictedScore >= 50
    ? "text-amber-600" : "text-red-500";

  return (
    <div className="min-h-full bg-background" dir="rtl">
      <div className="mx-auto max-w-6xl space-y-5 px-4 py-6 pb-24 lg:px-8">
        <header className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{greeting}،</p>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-foreground">{firstName}</h1>
            <p className="mt-1 text-sm text-muted-foreground">من هنا تبدأ خطوتك التالية في التدريب.</p>
          </div>
          <Link href="/account">
            <div
              className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-primary text-base font-black text-primary-foreground transition hover:bg-primary/90"
              data-testid="link-profile-avatar"
            >
              {firstName.charAt(0)}
            </div>
          </Link>
          <Button
            type="button"
            onClick={() => setSubscriptionDialogOpen(true)}
             className="hidden rounded-xl bg-[#F7F775] px-4 font-black hover:bg-[#F7F775]/85 dark:bg-primary dark:hover:bg-primary/90 sm:flex text-[color:var(--brand-navy)]"
          >
            <CrownIcon className="ml-2 h-4 w-4" />
            اشتراكي
          </Button>
        </header>

        <section>
          <div className="mb-3">
            <h2 className="text-xl font-black text-foreground">مساراتك التعليمية</h2>
            <p className="mt-1 text-sm text-muted-foreground">اختر القسم، ثم انتقل إلى التأسيس أو المحوسب.</p>
          </div>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {STUDENT_PROGRAMS.map((program) => (
              <Link key={program.href} href={program.href}>
                <div className="group h-full rounded-2xl border border-border bg-card p-4 transition hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-sm">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-foreground">
                      <program.icon className="h-5 w-5" />
                    </div>
                    <ChevronLeft className="h-4 w-4 text-muted-foreground transition group-hover:text-foreground" />
                  </div>
                  <p className="mt-4 text-base font-black text-foreground">{program.title}</p>
                  <p className="mt-0.5 text-xs font-bold text-muted-foreground">{program.english}</p>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">{program.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-muted-foreground">هدف اليوم</p>
              <p className="mt-2 text-3xl font-black text-foreground">
                {dailyDone} <span className="text-base font-bold text-muted-foreground">/ {dailyTarget} سؤال</span>
              </p>
            </div>
            <div className="rounded-xl bg-muted p-2.5 text-foreground">
              <Target className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-6 h-2 rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${dailyPct}%` }} />
          </div>
          <div className="mt-3 flex items-center justify-between gap-3 text-xs">
            <span className="font-bold text-muted-foreground">{dailyPct}% مكتمل</span>
            <span className="text-muted-foreground">{dailyPct >= 100 ? "اكتمل هدفك اليوم" : "واصل التدريب"}</span>
          </div>
          {prediction && (
            <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
              <span className="text-xs font-bold text-muted-foreground">متوسطك المتوقع</span>
              <span className={`text-lg font-black ${scoreColor}`}>{prediction.predictedScore}%</span>
            </div>
          )}
        </section>

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { label: "متوسط الأداء", value: prediction ? `${Math.round(prediction.averageScore)}%` : "—", icon: Target, href: "/ai-hub/score-prediction" },
            { label: "النقاط", value: rankData?.totalPoints ? `${Math.round(rankData.totalPoints / 1000)}k` : "—", icon: Zap, href: "/profile" },
            { label: "الاختبارات", value: prediction?.totalTests ?? "—", icon: BarChart2, href: "/profile" },
          ].map((stat, index) => (
            <Link key={stat.label} href={stat.href}>
              <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 transition hover:border-primary/30 hover:shadow-sm" data-testid={`stat-${index}`}>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground">
                  <stat.icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-lg font-black text-foreground">{stat.value}</p>
                  <p className="truncate text-[11px] font-bold text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </Link>
          ))}
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-black text-foreground">الوصول السريع</h2>
            <Link href="/question-bank" className="text-xs font-bold text-muted-foreground hover:text-foreground">عرض الكل</Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {SECONDARY_TOOLS.slice(0, 4).map((tool) => (
              <Link key={tool.href} href={tool.href}>
                <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-sm">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground">
                    <tool.icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-black text-foreground">{tool.title}</p>
                    <p className="mt-0.5 text-[11px] font-bold text-muted-foreground">{tool.badge}</p>
                  </div>
                  <ChevronLeft className="h-4 w-4 shrink-0 text-muted-foreground" />
                </div>
              </Link>
            ))}
          </div>
        </section>

        {isPremium ? (
          <section className="rounded-2xl border border-primary/25 bg-card p-5">
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                  <CrownIcon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="flex items-center gap-2 text-lg font-black text-foreground">
                    {subscription?.subscriptionType === 'Pro' ? 'خطة قدراتك' : subscription?.subscriptionType}
                    <Badge className="border-emerald-200 bg-emerald-50 py-0 text-xs font-bold text-emerald-700 hover:bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">نشط</Badge>
                  </h3>
                  <p className="mt-0.5 text-sm font-medium text-muted-foreground">
                    باقي {countdown.days} يوم {countdown.hours > 0 ? `و ${countdown.hours} ساعة` : ''} على الانتهاء
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                {currentSubData && !subscription?.isTrialActive && (
                  <Button
                    onClick={() => setInvoiceDialogOpen(true)}
                    variant="outline"
                    className="flex-1 border-border bg-background text-foreground sm:flex-none"
                  >
                    <FileText className="ml-2 h-4 w-4" />
                    عرض الفاتورة
                  </Button>
                )}
                <Button
                  onClick={() => setSubscriptionDialogOpen(true)}
                  className="flex-1 sm:flex-none"
                >
                  <CrownIcon className="ml-2 h-4 w-4" />
                  اشتراكي
                </Button>
              </div>
            </div>

            <div className="mt-5 border-t border-border pt-5">
              <p className="mb-3 text-xs font-bold text-muted-foreground">المزايا المفعلة حاليًا</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  { label: "وصول كامل للمحتوى", icon: BookOpenIcon },
                  { label: "اختبارات غير محدودة", icon: Target },
                  { label: "تحليلات متقدمة", icon: BarChart2 },
                  { label: "حفظ التقدم", icon: CheckCircle2 },
                  { label: "النماذج الورقية", icon: FileText },
                  { label: "الدعم الفني", icon: MessageSquare },
                ].map((feature, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    {feature.label}
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : currentSubData?.status === 'pending' ? (
          <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-900 dark:bg-amber-950/30">
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <Badge className="mb-2 border-amber-200 bg-amber-100 text-amber-800 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-900/50 dark:text-amber-200">
                  قيد المراجعة
                </Badge>
                <h3 className="text-lg font-black text-foreground">تم استلام طلب اشتراكك</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  سنفعّل المزايا بعد مراجعة وسيلة الدفع. يمكنك عرض مستند الطلب وسند التحويل الآن.
                </p>
              </div>
              <Button onClick={() => setInvoiceDialogOpen(true)} variant="outline">
                <FileText className="ml-2 h-4 w-4" />
                عرض مستند الطلب
              </Button>
            </div>
          </section>
        ) : (
          <button type="button" onClick={() => setSubscriptionDialogOpen(true)} className="w-full text-right">
            <div className="flex items-center justify-between gap-4 rounded-2xl border border-[#F7F775] bg-[#FFFFE4] p-4 transition hover:border-[#0D1B2A]/30 dark:border-primary/40 dark:bg-primary/10">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F7F775] text-[#0D1B2A] dark:bg-primary dark:text-primary-foreground">
                  <CrownIcon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-black text-foreground">اشترك في قدراتك</p>
                  <p className="mt-0.5 text-xs font-medium text-muted-foreground">39 ريال لمدة 3 أشهر</p>
                </div>
              </div>
              <ChevronLeft className="h-5 w-5 text-foreground" />
            </div>
          </button>
        )}
      </div>
      <SubscriptionRenewalDialog open={subscriptionDialogOpen} onOpenChange={setSubscriptionDialogOpen} user={user} />

      <Dialog open={invoiceDialogOpen} onOpenChange={setInvoiceDialogOpen}>
        <DialogContent className="max-w-3xl p-0 bg-transparent border-none shadow-none">
          <div className="bg-white rounded-xl overflow-hidden max-h-[90vh] overflow-y-auto">
            {currentSubData ? (
              <Invoice
                invoiceNumber={currentSubData.invoiceNumber}
                customerName={user?.name || user?.username || 'عميل قدراتك'}
                customerEmail={user?.email}
                customerPhone={user?.phone}
                planName={currentSubData.type === 'Pro' ? 'خطة قدراتك' : currentSubData.type}
                amount={currentSubData.price ?? 39}
                currency={currentSubData.currency || 'SAR'}
                paymentMethod={currentSubData.paymentMethod}
                receiptUrl={currentSubData.transferReceiptUrl}
                issueDate={currentSubData.createdAt}
                startDate={currentSubData.startDate}
                endDate={currentSubData.endDate}
                status={currentSubData.status}
                onClose={() => setInvoiceDialogOpen(false)}
              />
            ) : (
              <div className="p-12 text-center text-gray-500 font-medium">جاري تحميل الفاتورة...</div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function NewHome() {
  const { user } = useUser();

  const { data: questionsStats } = useQuery<{
    verbal: number; quantitative: number; total: number; roundedTotal: number;
  }>({ queryKey: ['/api/questions/stats'], staleTime: 60000, gcTime: 300000 });

  const totalQuestions = questionsStats?.roundedTotal || 4500;

  // ─── Logged-in: show premium dashboard ──────────────────
  if (user) {
    return (
      <>
        <SEO
          title="لوحة التحكم — منصة قدراتك"
          description="منصة قدراتك التعليمية — لوحة المستخدم الشخصية"
          url="/"
          noIndex
        />
        <LoggedInDashboard user={user} />
      </>
    );
  }

  // ─── Non-logged-in: marketing landing page ───────────────
  return (
    <>
      <SEO
        title="منصة قدراتك - رحلتك نحو التميز"
        description="منصة قدراتك التعليمية - اختبارات تفاعلية لتطوير مهاراتك في اختبارات القدرات والقياس"
        url="/"
      />

      <div className="min-h-screen bg-background overflow-hidden">

        {/* ═══════════════════════════════════════
            HERO SECTION — Full Visual Impact
        ═══════════════════════════════════════ */}
        <section className="relative overflow-hidden bg-mesh">
          <div className="absolute inset-0 bg-dots opacity-60" />

          <div className="relative container mx-auto px-4 py-16 md:py-24">
            <div className="text-center space-y-6 max-w-4xl mx-auto">

              <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full glass-card border border-primary/20 animate-fade-in-down">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping-slow" />
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-medium text-foreground">منصة قدراتك — المنصة الأولى للقدرات في السعودية</span>
              </div>

              <div className="animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
                <h1 className="text-5xl md:text-7xl font-black leading-tight tracking-tight">
                  <span className="text-foreground">رحلتك نحو </span>
                  <span className="gradient-text-ocean animate-gradient-shift" style={{ backgroundSize: "200%" }}>
                    التميز
                  </span>
                  <br />
                  <span className="text-foreground">تبدأ </span>
                  <span className="gradient-text-primary animate-gradient-shift" style={{ backgroundSize: "200%" }}>
                    هنا
                  </span>
                </h1>
              </div>

              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed animate-fade-in-up delay-200">
                منصة تعليمية متكاملة لاختبارات القدرات والقياس
                <br />
                <span className="font-semibold text-foreground">أكثر من 4,500 سؤال · شروحات تفصيلية · تحليل ذكي</span>
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4 animate-fade-in-up delay-300">
                <Link href="/qiyas">
                  <button
                    className="group relative inline-flex items-center gap-3 px-8 py-4 rounded-2xl text-base font-bold text-white overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl card-sparkle"
                    style={{ background: "linear-gradient(135deg, #3b82f6, #6366f1, #8b5cf6)", backgroundSize: "200%" }}
                    data-testid="button-start-qiyas"
                  >
                    <div className="absolute inset-0 bg-gradient-to-l from-blue-600 to-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <GraduationCapIcon className="relative w-5 h-5" />
                    <span className="relative">ابدأ اختبار قياس</span>
                    <Rocket className="relative w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    <div className="absolute inset-0 rounded-2xl glow-blue opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                </Link>

                <Link href="/question-bank">
                  <button
                    className="group inline-flex items-center gap-3 px-8 py-4 rounded-2xl text-base font-bold border-2 border-primary/30 hover:border-primary/60 bg-background/60 backdrop-blur-sm text-foreground hover:bg-primary/5 transition-all duration-300 hover:scale-105"
                    data-testid="button-question-bank"
                  >
                    <BookOpenIcon className="w-5 h-5 text-primary" />
                    <span>بنك الأسئلة</span>
                    <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                  </button>
                </Link>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-10 max-w-lg mx-auto animate-fade-in-up delay-500">
                {[
                  { value: totalQuestions, suffix: "+", label: "سؤال متاح", icon: Target, gradient: "from-blue-500 to-teal-500", glow: "glow-blue" },
                  { value: 95, suffix: "%", label: "نسبة النجاح", icon: Trophy, gradient: "from-amber-400 to-orange-500", glow: "glow-amber" },
                  { value: 36, suffix: "", label: "نموذج ورقي", icon: FileText, gradient: "from-green-500 to-emerald-600", glow: "glow-green" },
                ].map((stat, i) => (
                  <div
                    key={i}
                    className="relative group text-center p-4 rounded-2xl glass-card border border-white/40 dark:border-white/10 hover:scale-105 transition-all duration-300 overflow-hidden card-sparkle"
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-5 transition-opacity`} />
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center mx-auto mb-2 ${stat.glow} transition-all`}>
                      <stat.icon className="w-5 h-5 text-white" />
                    </div>
                    <p className="text-2xl font-black text-foreground">
                      <AnimatedNumber target={stat.value} suffix={stat.suffix} />
                    </p>
                    <p className="text-xs text-muted-foreground font-medium mt-0.5">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-16 bg-background" style={{ clipPath: "ellipse(60% 100% at 50% 100%)" }} />
        </section>

        {/* ═══════════════════════════════════════
            TEST TYPES — Qudrat vs Tahsili
        ═══════════════════════════════════════ */}
        <section className="relative container mx-auto px-4 py-16" dir="rtl">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-100 dark:bg-teal-100/30 border border-teal-400 dark:border-teal-400 mb-4">
              <GraduationCapIcon className="w-4 h-4 text-teal-700" />
              <span className="text-sm font-medium text-teal-700 dark:text-teal-700">أنواع الاختبارات</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-foreground mb-3">
              تدرّب على <span className="gradient-text-primary">اختبارك الرسمي</span> بدقة متناهية
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">قدراتك تحاكي اختبارات قياس الرسمية بالتفصيل الكامل — أسئلة وتوقيت وتصنيف مطابق للواقع</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {/* Qudrat Card */}
            <div className="relative overflow-hidden rounded-3xl border border-blue-200 dark:border-blue-800/40 bg-gradient-to-br from-blue-50 to-teal-500 dark:from-blue-950/30 dark:to-teal-500/30 p-6 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group">
              <div className="absolute -top-10 -left-10 w-40 h-40 bg-blue-400/10 rounded-full blur-3xl group-hover:bg-blue-400/20 transition-all" />
              <div className="absolute top-4 left-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <Brain className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="mr-16">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-xl font-black text-gray-900 dark:text-white">اختبار القدرات العامة</h3>
                  <span className="text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full font-bold">قياس</span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">القبول في الجامعات السعودية — اختبار القدرة على التحليل والاستنتاج</p>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-5">
                {[
                  { label: "عدد الأسئلة", value: "120", icon: "❓", color: "bg-blue-100 dark:bg-blue-900/30" },
                  { label: "مدة الاختبار", value: "180 دقيقة", icon: "⏱️", color: "bg-teal-100 dark:bg-teal-100/30" },
                  { label: "الدرجة القصوى", value: "100", icon: "🎯", color: "bg-teal-100 dark:bg-teal-100/30" },
                ].map((s, i) => (
                  <div key={i} className={`${s.color} rounded-2xl p-3 text-center`}>
                    <div className="text-lg mb-1">{s.icon}</div>
                    <div className="font-black text-gray-900 dark:text-white text-sm">{s.value}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{s.label}</div>
                  </div>
                ))}
              </div>

              <div className="space-y-2 mb-5">
                <p className="text-xs font-bold text-gray-600 dark:text-gray-300 mb-2">أقسام الاختبار:</p>
                {[
                  { name: "القسم اللفظي", desc: "استيعاب المقروء · التناظر اللفظي · إكمال الجمل", color: "bg-blue-500", pct: "50%" },
                  { name: "القسم الكمي", desc: "الجبر · الهندسة · الإحصاء · المقارنات", color: "bg-teal-100", pct: "50%" },
                ].map((s, i) => (
                  <div key={i} className="bg-white/60 dark:bg-white/5 rounded-xl p-3">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-bold text-gray-800 dark:text-gray-200">{s.name}</span>
                      <span className="text-xs text-gray-400">60 سؤال</span>
                    </div>
                    <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div className={`h-full ${s.color} rounded-full`} style={{ width: s.pct }} />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{s.desc}</p>
                  </div>
                ))}
              </div>

              <Link href="/qiyas">
                <button className="w-full py-3 rounded-2xl bg-gradient-to-l from-blue-600 to-teal-500 text-white font-bold text-sm hover:shadow-lg hover:scale-[1.02] transition-all flex items-center justify-center gap-2">
                  <Rocket className="w-4 h-4" /> ابدأ التدريب على القدرات
                </button>
              </Link>
            </div>

            {/* Tahsili Card */}
            <div className="relative overflow-hidden rounded-3xl border border-emerald-200 dark:border-emerald-800/40 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 p-6 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group">
              <div className="absolute -top-10 -left-10 w-40 h-40 bg-emerald-400/10 rounded-full blur-3xl group-hover:bg-emerald-400/20 transition-all" />
              <div className="absolute top-4 left-4">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="mr-16">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-xl font-black text-gray-900 dark:text-white">اختبار التحصيلي</h3>
                  <span className="text-xs bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full font-bold">قياس</span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">يقيس المعرفة الأكاديمية المكتسبة في المراحل الدراسية</p>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-5">
                {[
                  { label: "عدد الأسئلة", value: "80+", icon: "📝", color: "bg-emerald-100 dark:bg-emerald-900/30" },
                  { label: "مواد متنوعة", value: "8 مواد", icon: "📚", color: "bg-teal-100 dark:bg-teal-900/30" },
                  { label: "الدرجة القصوى", value: "100", icon: "🏆", color: "bg-green-100 dark:bg-green-900/30" },
                ].map((s, i) => (
                  <div key={i} className={`${s.color} rounded-2xl p-3 text-center`}>
                    <div className="text-lg mb-1">{s.icon}</div>
                    <div className="font-black text-gray-900 dark:text-white text-sm">{s.value}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{s.label}</div>
                  </div>
                ))}
              </div>

              <div className="space-y-2 mb-5">
                <p className="text-xs font-bold text-gray-600 dark:text-gray-300 mb-2">المسارات الدراسية:</p>
                {[
                  { name: "المسار العلمي", subjects: "رياضيات · فيزياء · كيمياء · أحياء", color: "bg-emerald-500" },
                  { name: "المسار الأدبي", subjects: "عربي · تاريخ · جغرافيا · إسلامية", color: "bg-teal-500" },
                ].map((s, i) => (
                  <div key={i} className="bg-white/60 dark:bg-white/5 rounded-xl p-3">
                    <p className="text-xs font-bold text-gray-800 dark:text-gray-200 mb-1">{s.name}</p>
                    <p className="text-xs text-gray-400">{s.subjects}</p>
                  </div>
                ))}
              </div>

              <Link href="/tahsili">
                <button className="w-full py-3 rounded-2xl bg-gradient-to-l from-emerald-600 to-teal-600 text-white font-bold text-sm hover:shadow-lg hover:scale-[1.02] transition-all flex items-center justify-center gap-2">
                  <Rocket className="w-4 h-4" /> ابدأ التدريب على التحصيلي
                </button>
              </Link>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════
            HOW IT WORKS — Step-by-step
        ═══════════════════════════════════════ */}
        <section className="relative overflow-hidden py-16 bg-gradient-to-b from-background via-slate-50/50 dark:via-slate-900/30 to-background" dir="rtl">
          <div className="absolute inset-0 bg-dots opacity-30 dark:opacity-10" />
          <div className="relative container mx-auto px-4">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-100 dark:bg-teal-100/30 border border-teal-400 dark:border-teal-400 mb-4">
                <Zap className="w-4 h-4 text-teal-700" />
                <span className="text-sm font-medium text-teal-700 dark:text-teal-700">كيف يعمل النظام؟</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-foreground mb-3">
                من <span className="gradient-text-ocean">التسجيل</span> إلى <span className="gradient-text-primary">النتيجة</span>
              </h2>
              <p className="text-muted-foreground max-w-lg mx-auto">أربع خطوات تأخذك من الصفر إلى الاختبار الحقيقي بثقة تامة</p>
            </div>

            <div className="relative max-w-4xl mx-auto">
              {/* Connection Line */}
              <div className="hidden md:block absolute top-16 right-[12%] left-[12%] h-0.5 bg-gradient-to-l from-green-500 via-blue-400 to-emerald-400 opacity-40" />

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  {
                    step: "01",
                    title: "سجّل حسابك",
                    desc: "أنشئ حسابك مجاناً خلال دقيقة وابدأ تجربة 7 أيام مجانية بدون بطاقة ائتمانية",
                    icon: UserIcon,
                    gradient: "from-emerald-500 to-teal-600",
                    bg: "bg-emerald-50 dark:bg-emerald-950/20",
                    border: "border-emerald-200 dark:border-emerald-800/30",
                    glow: "shadow-emerald-200 dark:shadow-emerald-900/30",
                  },
                  {
                    step: "02",
                    title: "تدرّب على الأسئلة",
                    desc: "أكثر من 4,500 سؤال مصنّفة حسب القسم والمستوى مع شروحات تفصيلية لكل سؤال",
                    icon: BookOpen,
                    gradient: "from-blue-500 to-teal-500",
                    bg: "bg-blue-50 dark:bg-blue-950/20",
                    border: "border-blue-200 dark:border-blue-800/30",
                    glow: "shadow-blue-200 dark:shadow-blue-900/30",
                  },
                  {
                    step: "03",
                    title: "احجز اختبارك",
                    desc: "احجز موعداً محدداً للاختبار المحاكي — بيئة حقيقية تماماً كاختبار قياس الرسمي",
                    icon: CalendarDays,
                    gradient: "from-green-500 to-emerald-600",
                    bg: "bg-teal-100 dark:bg-teal-100/20",
                    border: "border-teal-400 dark:border-teal-400/30",
                    glow: "shadow-green-200 dark:shadow-green-900/30",
                  },
                  {
                    step: "04",
                    title: "احصل على نتيجتك",
                    desc: "تحليل ذكي بالذكاء الاصطناعي لأخطائك مع درجتك التفصيلية على بريدك الإلكتروني",
                    icon: BarChart3,
                    gradient: "from-amber-500 to-orange-600",
                    bg: "bg-amber-50 dark:bg-amber-950/20",
                    border: "border-amber-200 dark:border-amber-800/30",
                    glow: "shadow-amber-200 dark:shadow-amber-900/30",
                  },
                ].map((item, i) => (
                  <div
                    key={i}
                    className={`relative group ${item.bg} ${item.border} border rounded-3xl p-5 hover:-translate-y-2 transition-all duration-300 hover:shadow-xl ${item.glow} animate-fade-in-up`}
                    style={{ animationDelay: `${i * 0.12}s` }}
                  >
                    <div className={`absolute -top-3 -right-1 w-9 h-9 bg-gradient-to-br ${item.gradient} rounded-xl flex items-center justify-center shadow-lg`}>
                      <span className="text-white font-black text-xs">{item.step}</span>
                    </div>

                    <div className={`w-12 h-12 bg-gradient-to-br ${item.gradient} rounded-2xl flex items-center justify-center mb-4 mt-3 group-hover:scale-110 transition-transform shadow-md`}>
                      <item.icon className="w-6 h-6 text-white" />
                    </div>

                    <h3 className="font-black text-gray-900 dark:text-white text-sm mb-2">{item.title}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════
            EXAM STRUCTURE — Visual Breakdown
        ═══════════════════════════════════════ */}
        <section className="container mx-auto px-4 py-16" dir="rtl">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              {/* Left: Visual exam mockup */}
              <div className="relative">
                <div className="relative bg-gray-900 dark:bg-gray-950 rounded-3xl p-5 shadow-2xl border border-gray-700/50 overflow-hidden">
                  {/* Fake browser bar */}
                  <div className="flex items-center gap-1.5 mb-4">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-amber-400" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                    <div className="flex-1 mx-3 h-5 bg-gray-800 rounded-md flex items-center px-2">
                      <span className="text-gray-500 text-[10px]">qodratak.sa/scheduled-exam</span>
                    </div>
                  </div>

                  {/* Fake timer bar */}
                  <div className="flex items-center justify-between mb-3 bg-teal-100/50 rounded-xl px-4 py-2">
                    <div className="flex items-center gap-2">
                      <Timer className="w-4 h-4 text-teal-700" />
                      <span className="text-teal-700 text-sm font-mono font-bold">2:45:12</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400 text-xs">السؤال 47 من 120</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping-slow" />
                      <span className="text-emerald-400 text-xs">جارٍ الاختبار</span>
                    </div>
                  </div>

                  {/* Fake question */}
                  <div className="bg-gray-800 rounded-2xl p-4 mb-3">
                    <p className="text-gray-300 text-sm mb-3 leading-relaxed">ما المفردة الأقرب في المعنى إلى كلمة <span className="text-blue-300 font-bold">«أَدَاة»</span>؟</p>
                    <div className="space-y-2">
                      {["وسيلة", "غاية", "نتيجة", "مقياس"].map((opt, i) => (
                        <div key={i} className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all ${i === 0 ? 'bg-blue-600/30 border border-blue-500/50' : 'bg-gray-700/40 border border-transparent hover:border-gray-600'}`}>
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold ${i === 0 ? 'border-blue-500 bg-blue-500 text-white' : 'border-gray-500 text-gray-400'}`}>
                            {String.fromCharCode(0x200F) + ['أ','ب','ج','د'][i]}
                          </div>
                          <span className={`text-sm ${i === 0 ? 'text-blue-300 font-medium' : 'text-gray-400'}`}>{opt}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="bg-gray-800 rounded-xl px-4 py-2 flex items-center gap-3">
                    <span className="text-gray-500 text-xs">التقدم</span>
                    <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-l from-blue-500 to-teal-500 rounded-full" style={{ width: "39%" }} />
                    </div>
                    <span className="text-gray-400 text-xs font-bold">47/120</span>
                  </div>
                </div>

                {/* Floating badges */}
                <div className="absolute -right-4 top-12 bg-white dark:bg-gray-800 rounded-2xl px-3 py-2 shadow-xl border border-gray-100 dark:border-gray-700 flex items-center gap-2 animate-float">
                  <div className="w-8 h-8 bg-emerald-500 rounded-xl flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-800 dark:text-gray-200">اختبار مؤمَّن</p>
                    <p className="text-[10px] text-gray-400">Anti-cheat نشط</p>
                  </div>
                </div>

                <div className="absolute -left-4 bottom-16 bg-white dark:bg-gray-800 rounded-2xl px-3 py-2 shadow-xl border border-gray-100 dark:border-gray-700 flex items-center gap-2 animate-float-gentle">
                  <div className="w-8 h-8 bg-blue-500 rounded-xl flex items-center justify-center">
                    <Brain className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-800 dark:text-gray-200">مراجعة AI</p>
                    <p className="text-[10px] text-gray-400">خلال 15 دقيقة</p>
                  </div>
                </div>
              </div>

              {/* Right: Details */}
              <div className="space-y-5">
                <div>
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-100 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 mb-3">
                    <CalendarDays className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-medium text-blue-700 dark:text-blue-300">الاختبار المجدول</span>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-black text-foreground mb-2">
                    اختبر نفسك في <br />
                    <span className="gradient-text-primary">بيئة حقيقية 100%</span>
                  </h2>
                  <p className="text-muted-foreground text-sm leading-relaxed">الاختبار المجدول يحاكي اختبار قياس الرسمي بالضبط — نفس عدد الأسئلة، نفس التوقيت، نفس الضغط النفسي</p>
                </div>

                <div className="space-y-3">
                  {[
                    { icon: "🔒", title: "نظام منع الغش", desc: "يرصد أي محاولة للخروج من الاختبار أو التبديل بين التطبيقات" },
                    { icon: "🤖", title: "مراجعة بالذكاء الاصطناعي", desc: "تحليل مفصّل لكل سؤال أخطأت فيه مع شرح الحل الصحيح" },
                    { icon: "📧", title: "نتيجة فورية على البريد", desc: "درجتك التفصيلية وتحليل أدائك تصلك خلال 15 دقيقة" },
                    { icon: "📊", title: "تحليل نقاط الضعف", desc: "يحدد بالضبط الأقسام التي تحتاج مزيداً من التدريب" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50 hover:border-blue-300 dark:hover:border-blue-700 transition-colors group">
                      <div className="text-2xl flex-shrink-0">{item.icon}</div>
                      <div>
                        <p className="font-bold text-sm text-gray-900 dark:text-white mb-0.5">{item.title}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <Link href="/book-exam">
                  <button className="w-full py-3.5 rounded-2xl bg-gradient-to-l from-blue-600 to-emerald-500 text-white font-bold text-sm hover:shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2">
                    <CalendarDays className="w-4 h-4" /> احجز اختبارك الآن
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════
            FEATURES GRID
        ═══════════════════════════════════════ */}
        <section className="relative container mx-auto px-4 py-16">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-4">
              <Layers className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">الميزات الرئيسية</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-foreground mb-3">
              كل ما تحتاجه <span className="gradient-text-primary">للنجاح</span>
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">منصة شاملة تجمع بين التدريب والتحليل والتنافس</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-4xl mx-auto">
            {mainFeatures.map((feature, i) => (
              <Link key={feature.href} href={feature.href}>
                <div
                  className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card hover:border-transparent cursor-pointer transition-all duration-400 hover:-translate-y-1.5 hover:shadow-2xl card-sparkle animate-fade-in-up"
                  style={{ animationDelay: `${i * 0.1}s` }}
                  data-testid={`card-feature-${feature.href.slice(1)}`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                  <div className={`absolute -top-12 -right-12 w-32 h-32 ${feature.orb} orb opacity-0 group-hover:opacity-60 transition-opacity duration-500`} />

                  <div className="relative p-6 flex items-center gap-5">
                    <div className={`relative flex-shrink-0 w-14 h-14 rounded-2xl ${feature.iconBg} flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                      <feature.icon className="w-7 h-7 text-white" />
                      <div className={`absolute inset-0 rounded-2xl ${feature.glow} opacity-0 group-hover:opacity-100 transition-opacity`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <h3 className="font-bold text-lg text-foreground">{feature.title}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${feature.badgeColor}`}>{feature.badge}</span>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                    </div>

                    <ChevronLeft className="w-5 h-5 text-muted-foreground group-hover:text-foreground group-hover:-translate-x-1 transition-all flex-shrink-0" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ═══════════════════════════════════════
            QUICK LINKS
        ═══════════════════════════════════════ */}
        <section className="container mx-auto px-4 pb-8">
          <div className="flex flex-wrap justify-center gap-3">
            {quickLinks.map((link, i) => (
              <Link key={link.href} href={link.href} data-testid={`link-${link.href.slice(1)}`}>
                <div
                  className={`group flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border/50 ${link.bg} transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md cursor-pointer animate-fade-in`}
                  style={{ animationDelay: `${i * 0.07}s` }}
                >
                  <link.icon className={`w-4 h-4 ${link.color}`} />
                  <span className="text-sm font-medium text-foreground">{link.title}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ═══════════════════════════════════════
            SMART TOOLS
        ═══════════════════════════════════════ */}
        <section className="container mx-auto px-4 pb-16">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-100 dark:bg-teal-100/30 border border-teal-400 dark:border-teal-400 mb-4">
              <Zap className="w-4 h-4 text-teal-700" />
              <span className="text-sm font-medium text-teal-700 dark:text-teal-700">أدوات التعلم الذكية</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-foreground mb-3">
              ميزات <span className="gradient-text-ocean">حصرية</span> لك
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">من بطاقات المراجعة حتى الاختبار التكيفي — كل أداة تساعدك على التقدم بشكل أسرع</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-5xl mx-auto">
            {smartTools.map((tool, i) => (
              <Link key={tool.href} href={tool.href}>
                <div
                  className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card hover:border-transparent cursor-pointer transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl animate-fade-in-up"
                  style={{ animationDelay: `${i * 0.07}s` }}
                  data-testid={`card-tool-${tool.href.slice(1)}`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${tool.color} opacity-0 group-hover:opacity-8 transition-opacity duration-300`} />
                  <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${tool.color} opacity-0 group-hover:opacity-100 transition-opacity`} />

                  <div className="p-4">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-md`}>
                      <tool.icon className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="font-bold text-sm text-foreground mb-1">{tool.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed mb-2">{tool.desc}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tool.badgeColor}`}>{tool.badge}</span>
                  </div>

                  <div className="px-4 pb-3 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">ابدأ الآن</span>
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground group-hover:-translate-x-0.5 transition-all" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ═══════════════════════════════════════
            WHY US
        ═══════════════════════════════════════ */}
        <section className="relative overflow-hidden py-16">
          <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/3 to-background" />
          <div className="absolute inset-0 bg-hexagon opacity-40" />

          <div className="relative container mx-auto px-4">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-100 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 mb-4">
                <Flame className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-medium text-amber-700 dark:text-amber-300">لماذا قدراتك؟</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-foreground mb-3">
                الفرق الذي <span className="gradient-text-fire">يصنع التميز</span>
              </h2>
              <p className="text-muted-foreground max-w-lg mx-auto">ميزات مدروسة لتجربة تعليمية استثنائية</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
              {whyUs.map((item, i) => (
                <div
                  key={i}
                  className={`group relative p-5 rounded-2xl ${item.bg} border border-border/40 hover:border-transparent hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden card-sparkle animate-fade-in-up`}
                  style={{ animationDelay: `${i * 0.08}s` }}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-5 transition-opacity`} />
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-md`}>
                    <item.icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-bold text-foreground text-sm mb-1.5">{item.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════
            UPGRADE CTA
        ═══════════════════════════════════════ */}
        <section className="container mx-auto px-4 pb-16">
          <div
            className="relative overflow-hidden rounded-3xl p-8 md:p-12 text-center"
            style={{ background: "linear-gradient(135deg, #f59e0b22, #ef444422, #ec489922, #8b5cf622, #3b82f622)" }}
          >
            <div
              className="absolute inset-0 opacity-10 animate-gradient-shift"
              style={{ background: "linear-gradient(135deg, #f59e0b, #ef4444, #ec4899, #8b5cf6, #3b82f6)", backgroundSize: "400% 400%" }}
            />
            <div className="absolute inset-0 border-2 border-transparent rounded-3xl"
              style={{ background: "linear-gradient(var(--background), var(--background)) padding-box, linear-gradient(135deg, #f59e0b, #ef4444, #ec4899, #8b5cf6) border-box" }} />

            <div className="orb orb-amber absolute -top-20 -right-20 w-60 h-60 animate-float" />
            <div className="orb orb-pink absolute -bottom-20 -left-20 w-60 h-60 animate-float-gentle" />

            <div className="relative">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-400 via-orange-500 to-amber-600 flex items-center justify-center mx-auto mb-6 shadow-2xl glow-amber animate-scale-pulse">
                <CrownIcon className="w-10 h-10 text-white" />
              </div>

              <h3 className="text-2xl md:text-3xl font-black text-foreground mb-3">
                🚀 ترقية للاشتراك <span className="gradient-text-fire">المميز</span>
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                وصول كامل لجميع الأسئلة والميزات المتقدمة — استثمر في مستقبلك الآن
              </p>

              <div className="flex flex-wrap gap-3 justify-center mb-8">
                {["أسئلة غير محدودة", "شروحات تفصيلية", "نماذج ورقية", "تحليل متقدم", "اختبارات مجدولة"].map((f, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-sm text-foreground bg-background/60 backdrop-blur-sm px-3 py-1.5 rounded-full border border-border/50">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>

                <button
                  type="button"
                  onClick={() => window.location.href = "/signup"}
                  className="group inline-flex items-center gap-3 px-10 py-4 rounded-2xl text-base font-bold text-white transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                  style={{ background: "linear-gradient(135deg, #f59e0b, #ef4444, #ec4899)" }}
                  data-testid="button-upgrade"
                >
                  <CrownIcon className="w-5 h-5" />
                  ترقية الآن
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════
            FOOTER CTA
        ═══════════════════════════════════════ */}
        <section className="container mx-auto px-4 py-12 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            {[1,2,3,4,5].map(i => (
              <Star key={i} className="w-5 h-5 text-amber-400 fill-amber-400" />
            ))}
          </div>
          <p className="text-muted-foreground mb-2">انضم لآلاف الطلاب الذين حققوا أهدافهم مع قدراتك</p>
          <p className="text-sm text-muted-foreground/60 mb-6">بدء مجاني — لا تحتاج بطاقة ائتمانية</p>
          <Link href="/qiyas">
            <button
              className="group inline-flex items-center gap-3 px-10 py-4 rounded-2xl text-base font-bold text-white transition-all duration-300 hover:scale-105 hover:shadow-xl glow-blue"
              style={{ background: "linear-gradient(135deg, #3b82f6, #6366f1, #8b5cf6)" }}
              data-testid="button-start-now"
            >
              <Rocket className="w-5 h-5" />
              ابدأ الآن مجاناً
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </Link>
        </section>
      </div>
    </>
  );
}
