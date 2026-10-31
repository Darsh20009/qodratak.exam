import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { BarChart3, BookOpen, Brain, ChevronDown, CircleHelp, FileText, GraduationCap, House, Menu, Search, UserRound, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { StudentHeaderTools } from "./StudentHeaderTools";
import { isStudentPrimaryActive, isStudentPathActive } from "./studentNavigationRoutes.mjs";

const PRIMARY = [
  { id: "dashboard", label: "لوحة التحكم", href: "/", icon: House },
  { id: "foundation", label: "التأسيس", href: "/foundation", icon: BookOpen },
  { id: "training", label: "التدريب", href: "/training", icon: Brain },
  { id: "results", label: "نتائجي", href: "/records", icon: BarChart3 },
  { id: "account", label: "حسابي", href: "/account", icon: UserRound },
];

const DIRECTORY = [
  { group: "التدريب", label: "مركز الاختبارات", href: "/qiyas-hub", icon: Brain },
  { group: "التدريب", label: "اختبار القدرات المحوسب", href: "/qiyas", icon: Brain },
  { group: "التدريب", label: "اختبار تغطية التأسيس", href: "/foundation/coverage-test", icon: FileText },
  { group: "التدريب", label: "الاختبارات اللفظية", href: "/verbal-tests", icon: BookOpen },
  { group: "التدريب", label: "الاختبارات الكمية", href: "/quantitative-tests", icon: Brain },
  { group: "التدريب", label: "بنك الأسئلة", href: "/question-bank", icon: FileText },
  { group: "التدريب", label: "الاختبارات المحاكية", href: "/mock-exams", icon: Brain },
  { group: "التدريب", label: "اختبار مخصص", href: "/custom-exam", icon: Brain },
  { group: "التدريب", label: "الاختبار الورقي", href: "/paper-exam", icon: FileText },
  { group: "التدريب", label: "نماذج الورقي", href: "/paper-models", icon: FileText },
  { group: "التدريب", label: "تصحيح ورقة الإجابة", href: "/bubble-sheet-scan", icon: FileText },
  { group: "التدريب", label: "الاختبار القياسي", href: "/standard-test", icon: FileText },
  { group: "التدريب", label: "الاختبارات الموسمية", href: "/seasonal-exams", icon: GraduationCap },
  { group: "التدريب", label: "اختبارات القدرات", href: "/abilities", icon: GraduationCap },
  { group: "التدريب", label: "اختبارات التحصيلي", href: "/tahsilik/tests", icon: GraduationCap },
  { group: "التدريب", label: "بنك أسئلة التحصيلي", href: "/tahsilik/question-bank", icon: FileText },
  { group: "التدريب", label: "اختبار تكيفي", href: "/adaptive-test", icon: Brain },
  { group: "التدريب", label: "تحدي مراجعة الأخطاء", href: "/mistake-challenge", icon: Brain },
  { group: "التدريب", label: "تحدي مراجعة الأخطاء المتقدم", href: "/enhanced-mistake-challenge", icon: Brain },
  { group: "نتائجي", label: "مراجعة الاختبار", href: "/exam-review", icon: FileText },
  { group: "التدريب", label: "اختبار لفظي يومي", href: "/free-verbal-test", icon: BookOpen },
  { group: "التدريب", label: "اختبار كمي يومي", href: "/free-quantitative-test", icon: Brain },
  { group: "التدريب", label: "اختبار لفظي متقدم", href: "/advanced-verbal-test", icon: BookOpen },
  { group: "التدريب", label: "اختبار كمي متقدم", href: "/advanced-quantitative-test", icon: Brain },
  { group: "التدريب", label: "اختبرني من الأسئلة", href: "/test-me", icon: Brain },
  { group: "التدريب", label: "الدورات التعليمية", href: "/courses", icon: GraduationCap },
  { group: "التدريب", label: "استراتيجيات الحل", href: "/strategy-library", icon: BookOpen },
  { group: "التدريب", label: "غرف المذاكرة", href: "/study-rooms", icon: BookOpen },
  { group: "التدريب", label: "بطاقات المراجعة", href: "/flashcards", icon: BookOpen },
  { group: "التدريب", label: "تحديات التعلم", href: "/challenges", icon: Brain },
  { group: "التأسيس", label: "مسار التحصيلي", href: "/tahsili", icon: GraduationCap },
  { group: "التأسيس", label: "مصادر التحصيلي", href: "/tahsili/sources", icon: BookOpen },
  { group: "التأسيس", label: "مسار القدرات", href: "/student-program/qudrat", icon: BookOpen },
  { group: "التأسيس", label: "كتاب التأسيس الكمي", href: "/student/foundation-book/quantitative", icon: BookOpen },
  { group: "التأسيس", label: "مركز التعلم", href: "/learn", icon: BookOpen },
  { group: "التأسيس", label: "المكتبة", href: "/library", icon: BookOpen },
  { group: "التأسيس", label: "مساعد الشرح (اختياري)", href: "/ai-tutor", icon: CircleHelp },
  { group: "لوحة التحكم", label: "مهام اليوم", href: "/learning/today", icon: FileText },
  { group: "نتائجي", label: "تقدم المهارات", href: "/skill-progress", icon: BarChart3 },
  { group: "نتائجي", label: "تحليل الأداء", href: "/performance-report", icon: BarChart3 },
  { group: "نتائجي", label: "تحليلاتي", href: "/analytics", icon: BarChart3 },
  { group: "نتائجي", label: "تحليل الأخطاء", href: "/error-analysis", icon: BarChart3 },
  { group: "نتائجي", label: "نتائج الاختبارات", href: "/test-results", icon: FileText },
  { group: "نتائجي", label: "نتائج الاختبار الورقي", href: "/paper-exam-results", icon: FileText },
  { group: "لوحة التحكم", label: "حجز موعد الاختبار", href: "/book-exam", icon: FileText },
  { group: "لوحة التحكم", label: "الاستعداد ليوم الاختبار", href: "/pre-exam-day", icon: FileText },
  { group: "لوحة التحكم", label: "إدارة الوقت", href: "/time-management", icon: FileText },
  { group: "حسابي", label: "ملفي الدراسي", href: "/profile", icon: UserRound },
  { group: "حسابي", label: "كتبي", href: "/books", icon: BookOpen },
  { group: "حسابي", label: "مجلداتي", href: "/folders", icon: FileText },
  { group: "حسابي", label: "محفظتي", href: "/wallet", icon: FileText },
  { group: "حسابي", label: "مركز الأدوات الذكية (اختياري)", href: "/ai-hub", icon: Brain },
  { group: "حسابي", label: "تحليل الأنماط الذكي (اختياري)", href: "/ai-hub/pattern-analysis", icon: Brain },
  { group: "حسابي", label: "اقتراح خطة ذكية (اختياري)", href: "/ai-hub/daily-plan", icon: Brain },
  { group: "حسابي", label: "توقع الدرجة (اختياري)", href: "/ai-hub/score-prediction", icon: Brain },
  { group: "حسابي", label: "الإشعارات", href: "/notifications", icon: FileText },
  { group: "حسابي", label: "إعدادات الإشعارات", href: "/notification-settings", icon: FileText },
  { group: "حسابي", label: "الأمان", href: "/security-settings", icon: UserRound },
  { group: "حسابي", label: "الاشتراك والباقات", href: "/subscription", icon: FileText },
  { group: "حسابي", label: "الباقات والأسعار", href: "/pricing", icon: FileText },
  { group: "حسابي", label: "الدعم والأسئلة الشائعة", href: "/faq", icon: CircleHelp },
  { group: "حسابي", label: "الدعم الفني", href: "/support", icon: CircleHelp },
  { group: "حسابي", label: "دليل المنصة", href: "/guide", icon: CircleHelp },
  { group: "حسابي", label: "الدليل التفصيلي", href: "/platform-guide", icon: CircleHelp },
  { group: "حسابي", label: "دليل الاستخدام", href: "/usage-guide", icon: CircleHelp },
  { group: "حسابي", label: "كيف تعمل المنصة؟", href: "/how-it-works", icon: CircleHelp },
  { group: "حسابي", label: "تثبيت التطبيق", href: "/install", icon: FileText },
];

function PrimaryLinks({ onNavigate, path, instance }: { onNavigate?: () => void; path: string; instance: string }) {
  return <nav aria-label="التنقل الرئيسي للطالب" className="space-y-1">
    {PRIMARY.map(({ id, label, href, icon: Icon }) => {
      const active = isStudentPrimaryActive(path, id);
      return <Link key={href} href={href} onClick={onNavigate} aria-current={active ? "page" : undefined}
        data-testid={`student-primary-${instance}-${href === "/" ? "home" : href.slice(1)}`}
        className={cn("flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-bold transition-colors",
          active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>
        <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
        <span>{label}</span>
        {active && <span className="mr-auto h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />}
      </Link>;
    })}
  </nav>;
}

function MoreDirectory({
  path,
  onNavigate,
  instance,
  open,
  onOpenChange,
  search,
  onSearchChange,
}: {
  path: string;
  onNavigate?: () => void;
  instance: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  search: string;
  onSearchChange: (search: string) => void;
}) {
  const groups = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase("ar");
    const items = DIRECTORY.filter((item) =>
      !needle || `${item.group} ${item.label} ${item.href}`.toLocaleLowerCase("ar").includes(needle),
    );
    return Array.from(new Set(items.map((item) => item.group))).map((group) => ({
      group,
      items: items.filter((item) => item.group === group),
    }));
  }, [search]);

  return <div className="mt-4 border-t border-border pt-3">
    <button type="button" aria-expanded={open} aria-controls={`student-page-directory-${instance}`}
      data-testid={`button-student-more-${instance}`} onClick={() => { onOpenChange(!open); onSearchChange(""); }}
      className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-bold text-muted-foreground hover:bg-muted hover:text-foreground">
      <span className="flex-1 text-right">المزيد</span>
      <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
    </button>
    {open && <section id={`student-page-directory-${instance}`} aria-label="المزيد من صفحات الطالب" className="mt-2">
      <label className="relative mb-3 block">
        <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <input type="search" aria-label="ابحث في صفحات الطالب" data-testid={`input-student-directory-search-${instance}`}
          placeholder="ابحث عن صفحة" value={search} onChange={(event) => onSearchChange(event.target.value)}
          className="min-h-10 w-full rounded-xl border border-border bg-background py-2 pl-3 pr-9 text-sm outline-none focus:border-primary" />
      </label>
      <div className="max-h-[52vh] space-y-3 overflow-y-auto">
        {groups.map(({ group, items }) => <div key={group}>
          <h3 className="px-3 pb-1 text-xs font-black text-muted-foreground">{group}</h3>
          {items.map(({ label, href, icon: Icon }) => <Link key={href} href={href} onClick={onNavigate}
            data-testid={`student-directory-${instance}-${href.slice(1).replaceAll("/", "-")}`}
             aria-current={isStudentPathActive(path, href) ? "page" : undefined}
            className={cn("flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm",
               isStudentPathActive(path, href) ? "bg-primary/10 font-bold text-primary" : "text-muted-foreground hover:bg-muted")}>
            <Icon className="h-4 w-4" aria-hidden="true" />{label}
          </Link>)}
        </div>)}
        {groups.length === 0 && <p className="px-3 py-4 text-sm text-muted-foreground">لا توجد صفحة بهذا الاسم.</p>}
      </div>
    </section>}
  </div>;
}

export function StudentNavigation({ hidden = false }: { hidden?: boolean }) {
  const [path] = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [directoryOpen, setDirectoryOpen] = useState(false);
  const [directorySearch, setDirectorySearch] = useState("");
  useEffect(() => {
    if (hidden) return;
    const openStudentPages = () => {
      setDirectoryOpen(true);
      setDirectorySearch("");
      if (window.matchMedia("(max-width: 767px)").matches) setDrawerOpen(true);
    };
    window.addEventListener("qodratak:open-student-pages", openStudentPages);
    return () => window.removeEventListener("qodratak:open-student-pages", openStudentPages);
  }, [hidden]);
  if (hidden) return null;

  return <>
    <aside dir="rtl" aria-label="تنقل الطالب" data-testid="student-desktop-navigation"
      className="hidden min-h-screen w-64 shrink-0 border-l border-border bg-card px-4 py-5 md:sticky md:top-0 md:flex md:flex-col">
      <Link href="/" className="mb-7 flex items-center gap-3 px-2">
        <img src="/qodratak-icon.png" alt="" className="h-9 w-9 object-contain" />
        <span className="text-lg font-black tracking-tight text-foreground">قدراتك</span>
      </Link>
       <PrimaryLinks path={path} instance="desktop" />
       <MoreDirectory path={path} instance="desktop" open={directoryOpen} onOpenChange={setDirectoryOpen} search={directorySearch} onSearchChange={setDirectorySearch} />
    </aside>
    <div dir="rtl" className="md:hidden">
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur">
        <Link href="/" className="flex items-center gap-2">
          <img src="/qodratak-icon.png" alt="" className="h-8 w-8 object-contain" />
          <span className="font-black text-foreground">قدراتك</span>
        </Link>
        <div className="flex items-center gap-2">
          <StudentHeaderTools compact />
          <button type="button" aria-label="فتح قائمة تنقل الطالب" aria-expanded={drawerOpen}
            aria-controls="student-mobile-drawer" data-testid="button-open-student-drawer"
            onClick={() => setDrawerOpen(true)}
            className="flex h-10 items-center gap-2 rounded-xl border border-border px-3 text-sm font-bold text-foreground">
            <Menu className="h-4 w-4" aria-hidden="true" />القائمة
          </button>
        </div>
      </header>
      {drawerOpen && <>
        <button type="button" aria-label="إغلاق القائمة" onClick={() => setDrawerOpen(false)}
          data-testid="student-drawer-overlay" className="fixed inset-0 z-40 bg-foreground/35" />
        <aside id="student-mobile-drawer" role="dialog" aria-modal="true" aria-label="قائمة تنقل الطالب"
          data-testid="student-mobile-drawer"
          className="fixed inset-y-0 right-0 z-50 flex w-[min(86vw,22rem)] flex-col overflow-y-auto border-l border-border bg-background p-4 shadow-xl">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-base font-black">تنقل الطالب</h2>
            <button type="button" aria-label="إغلاق القائمة" data-testid="button-close-student-drawer"
              onClick={() => setDrawerOpen(false)} className="grid h-10 w-10 place-items-center rounded-xl hover:bg-muted">
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        <PrimaryLinks path={path} instance="mobile" onNavigate={() => setDrawerOpen(false)} />
        <MoreDirectory path={path} instance="mobile" open={directoryOpen} onOpenChange={setDirectoryOpen} search={directorySearch} onSearchChange={setDirectorySearch} onNavigate={() => setDrawerOpen(false)} />
        </aside>
      </>}
    </div>
  </>;
}

export default StudentNavigation;
