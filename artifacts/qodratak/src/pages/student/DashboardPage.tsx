import React, { useState } from "react";
import { Link } from "wouter";
import { usePlatformReviews, useStudentDashboard, useSubmitReview, useUpdateExamDate } from "@/hooks/use-student";
import { useUser } from "@/hooks/use-user";
import {
  Brain,
  Calendar,
  ChevronLeft,
  Target,
  TrendingUp,
  FileText,
  FolderOpen,
  Award,
  Loader2,
  AlertTriangle,
  PlayCircle
  , Star
  , Headphones
  , CalendarCheck
  , BellRing
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SubscriptionRenewalDialog from "@/components/SubscriptionRenewalDialog";

export default function DashboardPage() {
  const { user } = useUser();
  const { data: dashboard, isLoading, isError } = useStudentDashboard();
  const updateExamDate = useUpdateExamDate();
  const { data: reviews = [] } = usePlatformReviews();
  const submitReview = useSubmitReview();
  const [examDateStr, setExamDateStr] = useState("");
  const [isExamDialogOpen, setIsExamDialogOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [subscriptionDialogOpen, setSubscriptionDialogOpen] = useState(false);

  const userName = user?.name || user?.username || "طالب";
  const firstName = userName.split(" ")[0];

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#0D1B2A] dark:text-primary" />
      </div>
    );
  }

  if (isError || !dashboard) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-center p-6">
        <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-black text-foreground">حدث خطأ في تحميل البيانات</h2>
        <p className="text-muted-foreground mt-2">يرجى المحاولة مرة أخرى لاحقاً.</p>
      </div>
    );
  }

  const handleSaveExamDate = () => {
    if (examDateStr) {
      updateExamDate.mutate(new Date(examDateStr).toISOString(), {
        onSuccess: () => setIsExamDialogOpen(false)
      });
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "صباح الخير";
    if (hour < 17) return "مساء الخير";
    return "مساء النور";
  };

  const daysToExam = dashboard.upcomingExam.date
    ? Math.max(0, Math.ceil((new Date(dashboard.upcomingExam.date).getTime() - Date.now()) / 86400000))
    : null;
  const examProgress = daysToExam === null ? 0 : Math.max(5, Math.min(100, 100 - (daysToExam / 90) * 100));

  return (
    <div className="mx-auto max-w-5xl p-5 md:p-8 space-y-8 animate-fade-in">
      {/* Header */}
      <header className="flex flex-col gap-2">
        <p className="text-sm font-bold text-muted-foreground">{getGreeting()}،</p>
        <h1 className="text-3xl font-black text-[#0D1B2A] dark:text-white">{firstName}</h1>
        <p className="text-sm text-muted-foreground">تابع تقدمك واستعد لاختبارك القادم بثقة.</p>
      </header>

      {/* Subscription Banner */}
      {dashboard.subscription.status === "active" && (
        <div className="rounded-2xl border border-[#91D7C5]/30 bg-[#EAF8F3] dark:bg-emerald-950/20 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Award className="h-6 w-6 text-[#398B79]" />
            <div>
              <p className="text-sm font-black text-[#171723] dark:text-emerald-100">اشتراك {dashboard.subscription.type}</p>
              <p className="text-xs font-bold text-[#398B79]">متبقي {dashboard.subscription.daysLeft} يوم</p>
            </div>
          </div>
          <button type="button" onClick={() => setSubscriptionDialogOpen(true)} className="text-xs font-bold text-[#17354A] dark:text-emerald-200 hover:underline">
            عرض اشتراكي
          </button>
        </div>
      )}
      {dashboard.subscription.status === "trial" && (
        <div className="rounded-2xl border border-[#F7F775] bg-[#FFFDEB] dark:bg-amber-950/20 px-5 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-black text-[#171723] dark:text-amber-100">تجربتك المجانية مفتوحة بالكامل</p>
            <p className="text-xs font-bold text-[#7A6410] mt-1">متبقي {dashboard.trial?.daysLeft || 0} يوم — استخدم التأسيس والمحوسب والمحاكاة بلا قيود.</p>
          </div>
          <button type="button" onClick={() => setSubscriptionDialogOpen(true)} className="text-xs font-black text-[#0D1B2A] dark:text-amber-100 underline">عرض اشتراكي</button>
        </div>
      )}
      {dashboard.subscription.status === "none" && (
        <div className="rounded-2xl border border-[#FF8A70]/40 bg-[#FFF0EA] dark:bg-rose-950/20 px-5 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-black text-[#171723] dark:text-rose-100">حسابك المجاني: اختبار واحد كل يوم</p>
            <p className="text-xs font-bold text-[#9A4D38] mt-1">اشترك لفتح التأسيس والبنوك والمحاكاة دون حد يومي.</p>
          </div>
          <Button onClick={() => setSubscriptionDialogOpen(true)} className="rounded-xl bg-[#0D1B2A] text-white font-black">اشترك بـ 39 ريال</Button>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "الاختبارات المنجزة", value: dashboard.stats.totalTests, icon: FileText, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/20" },
          { label: "متوسط الأداء", value: `${dashboard.stats.averageScore}%`, icon: Target, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
          { label: "النقاط المكتسبة", value: dashboard.stats.points, icon: TrendingUp, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-900/20" },
          { label: "الأيام للاختبار", value: daysToExam ?? "—", icon: Calendar, color: "text-rose-500", bg: "bg-rose-50 dark:bg-rose-900/20" },
        ].map((stat, i) => (
          <div key={i} className="rounded-2xl bg-white dark:bg-card border border-border p-5 shadow-sm transition hover:shadow-md">
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${stat.bg} ${stat.color} mb-4`}>
              <stat.icon className="h-5 w-5" />
            </div>
            <p className="text-2xl font-black text-foreground">{stat.value}</p>
            <p className="text-xs font-bold text-muted-foreground mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Main Column */}
        <div className="md:col-span-2 space-y-6">
          {/* Recommended Plan */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-black text-foreground">خطتك المقترحة</h2>
            </div>
            <div className="rounded-2xl bg-[#0D1B2A] text-white p-6 relative overflow-hidden">
              <div className="relative z-10">
                <p className="text-sm font-bold text-[#F7F775] mb-2">{dashboard.recommendedPlan.title}</p>
                <h3 className="text-xl font-black mb-3">{dashboard.recommendedPlan.description}</h3>
                <Link href={dashboard.recommendedPlan.nextAction.href}>
                  <Button className="mt-4 bg-[#F7F775] text-[#0D1B2A] hover:bg-[#F7F775]/90 font-black rounded-xl">
                    <PlayCircle className="ml-2 h-4 w-4" />
                    {dashboard.recommendedPlan.nextAction.label}
                  </Button>
                </Link>
              </div>
              <div className="absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-white/5 blur-3xl pointer-events-none" />
            </div>
          </section>

          <Link href="/book-exam">
            <section className="rounded-2xl border border-[#0D1B2A]/10 bg-white dark:bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EAF8F3] text-[#398B79]"><CalendarCheck className="h-5 w-5" /></span>
                  <div>
                    <h2 className="font-black text-foreground">احجز اختبارًا محاكيًا</h2>
                    <p className="mt-1 text-xs text-muted-foreground">اختر موعدًا وخض تجربة قريبة من اختبار قياس.</p>
                  </div>
                </div>
                <ChevronLeft className="h-5 w-5 text-muted-foreground" />
              </div>
            </section>
          </Link>

          {/* Recent Tests */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-black text-foreground">الاختبارات الأخيرة</h2>
              <Link href="/computerized" className="text-sm font-bold text-muted-foreground hover:text-foreground">
                عرض الكل
              </Link>
            </div>
            <div className="space-y-3">
              {dashboard.recentTests.map((test) => (
                <div key={test.id} className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-card border border-border shadow-sm hover:border-[#0D1B2A]/20 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-bold text-foreground">{test.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(test.date).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <div className="text-left">
                    <span className="inline-block px-3 py-1 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 font-black text-sm">
                      {test.score}%
                    </span>
                  </div>
                </div>
              ))}
              {dashboard.recentTests.length === 0 && (
                <div className="rounded-2xl border border-dashed border-border bg-white dark:bg-card p-8 text-center">
                  <FileText className="mx-auto h-8 w-8 text-muted-foreground" />
                  <p className="mt-3 font-black text-foreground">لا توجد اختبارات مكتملة بعد</p>
                  <Link href="/computerized" className="mt-2 inline-block text-sm font-bold text-[#398B79]">ابدأ أول اختبار</Link>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Side Column */}
        <div className="space-y-6">
          {/* Upcoming Exam */}
          <section className="rounded-2xl bg-white dark:bg-card border border-border p-5 shadow-sm">
            <h2 className="text-base font-black text-foreground mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-muted-foreground" /> موعد الاختبار
            </h2>
            {dashboard.upcomingExam.date ? (
              <div className="text-center py-4">
                <p className="text-3xl font-black text-[#0D1B2A] dark:text-white">
                  {new Date(dashboard.upcomingExam.date).toLocaleDateString('ar-SA', { day: 'numeric', month: 'long' })}
                </p>
                <p className="text-sm font-bold text-muted-foreground mt-2">{daysToExam} يومًا على موعدك</p>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div className="h-full rounded-full bg-[#398B79]" style={{ width: `${examProgress}%` }} />
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground">تقدم الخطة خلال آخر 90 يومًا قبل الاختبار</p>
                <Dialog open={isExamDialogOpen} onOpenChange={setIsExamDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="mt-4 w-full rounded-xl font-bold">تعديل الموعد</Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md rounded-2xl" dir="rtl">
                    <DialogHeader>
                      <DialogTitle className="font-black text-xl">تعديل موعد الاختبار</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-foreground">تاريخ الاختبار</label>
                        <Input 
                          type="date" 
                          value={examDateStr} 
                          onChange={(e) => setExamDateStr(e.target.value)} 
                          className="rounded-xl"
                        />
                      </div>
                      <Button 
                        onClick={handleSaveExamDate} 
                        disabled={!examDateStr || updateExamDate.isPending} 
                        className="w-full rounded-xl font-black bg-[#0D1B2A] text-white hover:bg-[#0D1B2A]/90"
                      >
                        {updateExamDate.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "حفظ الموعد"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm font-bold text-muted-foreground mb-4">لم تحدد موعد اختبارك بعد.</p>
                <Dialog open={isExamDialogOpen} onOpenChange={setIsExamDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full rounded-xl font-black bg-[#0D1B2A] text-white hover:bg-[#0D1B2A]/90">
                      حدد الموعد الآن
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md rounded-2xl" dir="rtl">
                    <DialogHeader>
                      <DialogTitle className="font-black text-xl">تحديد موعد الاختبار</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-foreground">تاريخ الاختبار</label>
                        <Input 
                          type="date" 
                          value={examDateStr} 
                          onChange={(e) => setExamDateStr(e.target.value)} 
                          className="rounded-xl"
                        />
                      </div>
                      <Button 
                        onClick={handleSaveExamDate} 
                        disabled={!examDateStr || updateExamDate.isPending} 
                        className="w-full rounded-xl font-black bg-[#0D1B2A] text-white hover:bg-[#0D1B2A]/90"
                      >
                        {updateExamDate.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "حفظ الموعد"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </section>

          {/* Weaknesses */}
          {dashboard.weaknesses.length > 0 && (
            <section className="rounded-2xl bg-white dark:bg-card border border-border p-5 shadow-sm">
              <h2 className="text-base font-black text-foreground mb-4 flex items-center gap-2">
                <Brain className="h-5 w-5 text-muted-foreground" /> نقاط تحتاج مراجعة
              </h2>
              <div className="space-y-4">
                {dashboard.weaknesses.map((w, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-sm font-bold mb-1">
                      <span className="text-foreground">{w.topic} <span className="text-xs text-muted-foreground font-normal">({w.subject})</span></span>
                      <span className="text-rose-500">{w.errorRate}% خطأ</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-rose-400 rounded-full" style={{ width: `${w.errorRate}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Quick Links */}
          <section className="grid grid-cols-2 gap-3">
            <Link href="/books">
              <div className="rounded-2xl bg-white dark:bg-card border border-border p-4 text-center hover:border-primary/50 transition-colors shadow-sm">
                <FolderOpen className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                <p className="font-bold text-sm text-foreground">كتبي</p>
                <p className="text-xs text-muted-foreground mt-1">{dashboard.booksCount} كتب</p>
              </div>
            </Link>
            <Link href="/folders">
              <div className="rounded-2xl bg-white dark:bg-card border border-border p-4 text-center hover:border-primary/50 transition-colors shadow-sm">
                <FileText className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                <p className="font-bold text-sm text-foreground">المجلدات</p>
                <p className="text-xs text-muted-foreground mt-1">{dashboard.foldersCount} مجلدات</p>
              </div>
            </Link>
          </section>

        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-2xl border border-border bg-white dark:bg-card p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Star className="h-5 w-5 text-amber-500" />
            <h2 className="font-black text-foreground">قيّم تجربتك</h2>
          </div>
          <div className="mb-3 flex gap-1" aria-label="اختر التقييم">
            {[1, 2, 3, 4, 5].map(value => (
              <button key={value} type="button" onClick={() => setRating(value)} aria-label={`${value} نجوم`}>
                <Star className={`h-6 w-6 ${value <= rating ? "fill-amber-400 text-amber-400" : "text-slate-300"}`} />
              </button>
            ))}
          </div>
          <textarea
            value={reviewText}
            onChange={event => setReviewText(event.target.value)}
            maxLength={2000}
            placeholder="كيف ساعدتك قدراتك؟"
            className="min-h-24 w-full resize-none rounded-xl border border-border bg-background p-3 text-sm outline-none focus:border-[#398B79]"
          />
          <Button
            disabled={!reviewText.trim() || submitReview.isPending}
            onClick={() => submitReview.mutate({ rating, text: reviewText.trim() }, { onSuccess: () => setReviewText("") })}
            className="mt-3 rounded-xl bg-[#0D1B2A] font-black text-white"
          >
            إرسال التقييم
          </Button>
          {reviews.length > 0 && <p className="mt-4 text-xs text-muted-foreground">آخر تقييم منشور: “{reviews[0].text}” — {reviews[0].studentName}</p>}
        </section>

        <section className="grid gap-3 sm:grid-cols-2">
          <Link href="/support" className="rounded-2xl border border-border bg-white dark:bg-card p-5 shadow-sm hover:border-[#398B79]">
            <Headphones className="h-6 w-6 text-[#398B79]" />
            <h2 className="mt-4 font-black text-foreground">الدعم والمساعدة</h2>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">الأسئلة الشائعة وطرق التواصل مع فريق قدراتك.</p>
          </Link>
          <Link href="/notifications" className="rounded-2xl border border-border bg-white dark:bg-card p-5 shadow-sm hover:border-[#FF8A70]">
            <BellRing className="h-6 w-6 text-[#FF8A70]" />
            <h2 className="mt-4 font-black text-foreground">التحديثات والتسريبات</h2>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">تابع أحدث ما ينشره فريق الإدارة لحسابك.</p>
          </Link>
        </section>
      </div>
      <SubscriptionRenewalDialog open={subscriptionDialogOpen} onOpenChange={setSubscriptionDialogOpen} user={user} />
    </div>
  );
}
