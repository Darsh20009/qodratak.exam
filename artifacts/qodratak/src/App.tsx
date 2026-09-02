import React from 'react';
import { Switch, Route, Link, useLocation, Router as WouterRouter } from "wouter";
import { RotateDevicePrompt } from "@/components/RotateDevicePrompt";
import { queryClient } from "./lib/queryClient";
import { installAdminFetchBridge } from "./lib/adminSession";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NationalDayPopup from "@/components/NationalDayPopup";

import NotFound from "@/pages/not-found";
import Home from "@/pages/NewHome";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import ExamRecordsPage from "@/pages/ExamRecordsPage";
import { ThemeProvider } from "next-themes";
import { Separator } from "@/components/ui/separator";
import { 
  BookOpenIcon, 
  BrainCircuitIcon, 
  ClipboardIcon,
  FolderIcon,
  GamepadIcon,
  Layers,
  GraduationCapIcon,
  HelpCircleIcon, 
  HomeIcon, 
  UserIcon,
  CrownIcon,
  DiamondIcon,
  Clock,
  Calculator,
  Brain,
  PlayCircleIcon,
  HelpCircle,
  Download,
  Heart,
  MoreHorizontal,
  FileText,
  Printer,
  Trophy,
  CalendarCheck,
  CalendarClock,
  Bell,
  Flame,
  TrendingUp,
  TrendingDown,
  ChevronLeft,
  Wallet,
  Menu,
  BarChart2,
  MessageCircle,
  Library
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { Footer } from "@/components/Footer";
import { PushNotificationBanner } from "@/components/PushNotificationBanner";
import ProfilePage from "@/pages/NewWorkingProfile";
import LoginPage from "@/pages/LoginPage";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import GuestSignupPage from "@/pages/GuestSignupPage";
import { Redirect } from "wouter";
import TestResultsPage from './pages/TestResultsPage';
import ExamReviewPage from './pages/ExamReviewPage';
import FAQPage from "@/pages/FAQ";
import PricingPage from "@/pages/PricingPage";
import AbilitiesTestPage from "@/pages/AbilitiesTestPage";
import ProtectedRoute from "@/components/NewProtectedRoute";
import QiyasExamPage from "@/pages/QiyasExamPage";
import QiyasHubPage from "@/pages/QiyasHubPage";
import CustomExamPage from "@/pages/CustomExamPage";
import MockExamPage from "@/pages/MockExamPage";
import LibraryPage from "@/pages/LibraryPage";
import BooksPage from "@/pages/BooksPage";
import FoldersPage from "@/pages/FoldersPage";
import ChallengePage from "@/pages/ChallengePage";
import NewTimeManagementPage from "@/pages/NewTimeManagementPage";
import InstallPage from "@/pages/InstallPage";
import { UsageGuidePage } from "@/pages/UsageGuidePage";
import { VerbalTests } from "@/pages/VerbalTests";
import FreeAccountSignup from "@/pages/CleanFreeAccountSignup";
import { VerbalTestRunner } from "@/pages/VerbalTestRunner";
import { QuantitativeTests } from "@/pages/QuantitativeTests";
import { QuantitativeTestRunner } from "@/pages/QuantitativeTestRunner";
import { AdvancedVerbalTest } from "@/pages/AdvancedVerbalTest";
import { AdvancedQuantitativeTest } from "@/pages/AdvancedQuantitativeTest";
import EnhancedSubscriptionPlans from "@/components/EnhancedSubscriptionPlans";
import MistakeChallengePage from '@/pages/MistakeChallengePage';
import FlashcardsPage from '@/pages/FlashcardsPage';
import AdaptiveTestPage from '@/pages/AdaptiveTestPage';
import ErrorAnalysisPage from '@/pages/ErrorAnalysisPage';
import EnhancedMistakeChallenge from '@/pages/EnhancedMistakeChallenge';
import { EnhancedVerbalTests } from "@/pages/EnhancedVerbalTests";
import { EnhancedQuantitativeTests } from "@/pages/EnhancedQuantitativeTests";
import { LevelAssessmentPage } from "@/pages/LevelAssessmentPage";
import { SkillProgressPage } from "@/pages/SkillProgressPage";
import QuestionBankPage from "@/pages/QuestionBankPage";
import QuestionBankTestRunner from "@/pages/QuestionBankTestRunner";
import SectionedTestRunner from "@/pages/SectionedTestRunner";
import { StandardSectionTestRunner } from "@/pages/StandardSectionTestRunner";
import { FreeVerbalTestRunner } from "@/pages/FreeVerbalTestRunner";
import { FreeQuantitativeTestRunner } from "@/pages/FreeQuantitativeTestRunner";
import CoursesPage from "@/pages/CoursesPage";
import TahsiliQuestionBank from "@/pages/TahsiliQuestionBank";
const platformLogo = "/qodratak-logo-transparent.png";
import FolderDetailPage from "@/pages/FolderDetailPage";
import AdminLogin from "@/pages/admin/AdminLogin";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import ChatPage from "@/pages/admin/ChatPage";
import TahsiliPage from "@/pages/TahsiliPage";
import TahsiliDashboard from "@/pages/TahsiliDashboard";
import TahsiliExamPage from "@/pages/TahsiliExamPage";
import TahsilikPlatform from "@/pages/TahsilikPlatform";
import TahsilikStudyCenter from "@/pages/TahsilikStudyCenter";
import TahsilikTestCenter from "@/pages/TahsilikTestCenter";
import TahsilikQualificationTest from "@/pages/TahsilikQualificationTest";
import TahsilikMobileDashboard from "@/pages/TahsilikMobileDashboard";
import TahsilikCustomTest from "@/pages/TahsilikCustomTest";
import TahsilikComprehensiveTest from "@/pages/TahsilikComprehensiveTest";
import TahsilikSubjectTest from "@/pages/TahsilikSubjectTest";
import TahsilikSubjectTestRunner from "@/pages/TahsilikSubjectTestRunner";
import TahsilikTestsHub from "@/pages/TahsilikTestsHub";
import InstallPrompt from "@/components/InstallPrompt";
import { FloatingInstallButton } from "@/components/PermanentInstallButton";
import LandingPage from "@/pages/LandingPage";
import { SplashScreen } from "@/components/SplashScreen";
import { RouteSEO } from "@/components/RouteSEO";
import NotificationBell from "@/components/NotificationBell";
import { ThemeToggle } from "@/components/ThemeToggle";
import PaperModelsManagementPage from "@/pages/PaperModelsManagementPage";
import BubbleSheetScanPage from "@/pages/BubbleSheetScanPage";
import PlatformGuidePage from "@/pages/PlatformGuidePage";
import MyFolders from "@/pages/MyFolders";
import FolderView from "@/pages/FolderView";
import TestMe from "@/pages/TestMe";
import FolderTest from "@/pages/FolderTest";
import AccountTypeSelection from "@/pages/AccountTypeSelection";
import BookExamPage from "@/pages/BookExamPage";
import ScheduledExamRunner from "@/pages/ScheduledExamRunner";
import StudentAnalyticsPage from "@/pages/StudentAnalyticsPage";
import WalletPage from "@/pages/WalletPage";
import SeasonalExamsPage from "@/pages/SeasonalExamsPage";
import InvitePage from "@/pages/InvitePage";
import StudyRoomsPage from "@/pages/StudyRoomsPage";
import StudyRoomLobbyPage from "@/pages/StudyRoomLobbyPage";
import NotificationSettingsPage from "@/pages/NotificationSettingsPage";
import PreExamDayPage from "@/pages/PreExamDayPage";
import StudentProgramPage from "@/pages/StudentProgramPage";
import StrategyLibraryPage from "@/pages/StrategyLibraryPage";
import AiTutorPage from "@/pages/AiTutorPage";
import AiHub from "@/pages/AiHub";
import AiScorePrediction from "@/pages/AiScorePrediction";
import AiPatternAnalysis from "@/pages/AiPatternAnalysis";
import AiDailyPlan from "@/pages/AiDailyPlan";
import { SecuritySetupModal } from "@/components/SecuritySetupModal";
import TeacherSystemPage from "@/pages/TeacherSystemPage";
import SecuritySettingsPage from "@/pages/SecuritySettingsPage";
import NotificationsPage from "@/pages/NotificationsPage";
import InstitutionPortalPage from "@/pages/InstitutionPortalPage";
import ParentDashboardPage from "@/pages/ParentDashboardPage";
import FooterDocumentsPage from "@/pages/FooterDocumentsPage";
import FooterGuidePage from "@/pages/FooterGuidePage";
import { useUser } from "@/hooks/use-user";

installAdminFetchBridge();

// These routes contain reporting and document-generation libraries. Loading them
// only when opened keeps the first visit, especially on mobile data, lightweight.
const LearningHubPage = React.lazy(() => import("@/pages/LearningHubPage"));
const PerformanceReportPage = React.lazy(() => import("@/pages/PerformanceReportPage"));
const PaperExamResultsPage = React.lazy(() => import("@/pages/PaperExamResultsPage"));
const PaperExamPage = React.lazy(() => import("@/pages/PaperExamPage"));
const PaperModelsPage = React.lazy(() => import("@/pages/PaperModelsPage"));

function RouteLoadingFallback() {
  return (
    <div className="grid min-h-screen place-items-center bg-[#F7F4EE] px-5 text-center" dir="rtl">
      <p className="text-sm font-bold text-[#6B625B]">جارٍ فتح الصفحة...</p>
    </div>
  );
}

const PUBLIC_PATHS = new Set([
  "/",
  "/signup",
  "/login",
  "/forgot-password",
  "/reset-password",
  "/guest-signup",
  "/free-signup",
  "/account-type",
  "/faq",
  "/pricing",
  "/terms",
  "/privacy",
  "/refund-policy",
  "/support",
  "/guide",
  "/usage-guide",
  "/platform-guide",
]);

function isPublicPath(pathname: string) {
  const cleanPath = pathname.split("?")[0].replace(/\/+$/, "") || "/";
  return PUBLIC_PATHS.has(cleanPath) || cleanPath.startsWith("/invite/") || cleanPath.startsWith("/admin");
}

function AuthenticatedRouteBoundary({ children }: { children: React.ReactNode }) {
  const [location, navigate] = useLocation();
  const { user, isLoading } = useUser();
  const needsAuthentication = !isPublicPath(location);

  useEffect(() => {
    if (needsAuthentication && !isLoading && !user) {
      navigate(`/login?return=${encodeURIComponent(location)}`);
    }
  }, [location, navigate, needsAuthentication, isLoading, user]);

  if (needsAuthentication && (isLoading || !user)) {
    return <RouteLoadingFallback />;
  }

  return <>{children}</>;
}

function MainLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [userName, setUserName] = useState<string | null>(null);
  const [userSubscription, setUserSubscription] = useState<string>('free');
  const [userPoints, setUserPoints] = useState<number>(0);
  const [userId, setUserId] = useState<number | null>(null);
  const [aiBadgeInHeader, setAiBadgeInHeader] = useState(() => sessionStorage.getItem('ai_badge_hidden') === '1');
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [sidebarMoreOpen, setSidebarMoreOpen] = useState(false);

  useEffect(() => {
    setShowMoreMenu(false);
    setSidebarMoreOpen(false);
  }, [location]);

  useEffect(() => {
    const onDismiss = () => setAiBadgeInHeader(true);
    const onShow = () => setAiBadgeInHeader(false);
    window.addEventListener('aiButtonDismissed', onDismiss);
    window.addEventListener('aiButtonShown', onShow);
    return () => {
      window.removeEventListener('aiButtonDismissed', onDismiss);
      window.removeEventListener('aiButtonShown', onShow);
    };
  }, []);

  useEffect(() => {
    const applyServerUser = (serverUser: any) => {
      setUserName(serverUser.username || serverUser.name || null);
      setUserSubscription(serverUser.subscription?.type || 'free');
      setUserId(serverUser.id ?? null);

      // Temporary display cache for legacy pages. It never restores authentication.
      localStorage.setItem('user', JSON.stringify(serverUser));
    };

    const fetchServerUserData = async () => {
      try {
        const response = await fetch('/api/user', { credentials: 'include' });
        if (response.ok) {
          const serverUser = await response.json();
          if (serverUser && serverUser.id) {
            applyServerUser(serverUser);
            return;
          }
        }

        setUserName(null);
        setUserSubscription('free');
        setUserId(null);
        localStorage.removeItem('user');
      } catch {
        setUserName(null);
        setUserSubscription('free');
        setUserId(null);
      }
    };

    fetchServerUserData();

    const handleUserLogin = () => {
      fetchServerUserData();
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
    };

    const handleServerUserUpdate = (event: any) => {
      const serverUser = event.detail;
      if (serverUser) {
        applyServerUser(serverUser);
      }
    };

    window.addEventListener('userLoggedIn', handleUserLogin);
    window.addEventListener('serverUserUpdated', handleServerUserUpdate);

    return () => {
      window.removeEventListener('userLoggedIn', handleUserLogin);
      window.removeEventListener('serverUserUpdated', handleServerUserUpdate);
    };
  }, []);

  // جلب نقاط المستخدم من الخادم وحفظها في localStorage
  useEffect(() => {
    const fetchUserPoints = async () => {
      if (userId) {
        try {
          const response = await fetch(`/api/users/${userId}/rank`);
          if (response.ok) {
            const rankData = await response.json();
            const points = rankData.totalPoints || 0;
            setUserPoints(points);

            // حفظ النقاط في localStorage تلقائياً
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
              try {
                const user = JSON.parse(storedUser);
                user.points = points;
                localStorage.setItem('user', JSON.stringify(user));
              } catch (e) {}
            }
          }
        } catch (error) {
          console.error('فشل جلب النقاط:', error);
        }
      }
    };

    // جلب النقاط عند التحميل
    fetchUserPoints();

    const interval = setInterval(fetchUserPoints, 30000);

    // الاستماع لحدث تحديث النقاط - تحديث فوري
    const handlePointsUpdate = () => {
      fetchUserPoints();
      // تحديث إضافي بعد 500ms للتأكد
      setTimeout(fetchUserPoints, 500);
    };
    window.addEventListener('pointsUpdated', handlePointsUpdate);

    return () => {
      clearInterval(interval);
      window.removeEventListener('pointsUpdated', handlePointsUpdate);
    };
  }, [userId]);

  // مسارات الطالب الأساسية بالترتيب المتفق عليه
  // ─── Core nav items (always visible) ─────────────────────
  const coreNavItems = [
    { name: "الرئيسية",       href: "/",                icon: HomeIcon },
    { name: "القدرات | Qudrat", href: "/student-program/qudrat", icon: Brain },
    { name: "التحصيلي | Tahsili", href: "/student-program/tahsili", icon: GraduationCapIcon },
    { name: "IELTS",          href: "/student-program/ielts",  icon: BookOpenIcon },
    { name: "GAT",            href: "/student-program/gat",    icon: BookOpenIcon },
    { name: "المكتبة",        href: "/library",           icon: Library },
    { name: "مجلداتي",        href: "/folders",           icon: FolderIcon },
  ];

  // ─── More items (collapsible) ─────────────────────────────
  const moreNavItems = [
    { name: "اختبار قياس",      href: "/qiyas",              icon: Brain },
    { name: "بنك الأسئلة",      href: "/question-bank",      icon: BookOpenIcon },
    { name: "سجل الاختبارات",   href: "/records",            icon: ClipboardIcon },
    { name: "محفظتي",           href: "/wallet",               icon: Wallet },
    { name: "اختبارات اللفظي",  href: "/verbal-tests",       icon: BookOpenIcon },
    { name: "اختبارات الكمي",   href: "/quantitative-tests",  icon: Calculator },
    { name: "نماذج الورقي",     href: "/paper-models",         icon: FileText },
    { name: "بطاقات المراجعة",  href: "/flashcards",           icon: Layers },
    { name: "تحدي الأخطاء",     href: "/mistake-challenge",    icon: GamepadIcon },
    { name: "احجز اختبارك",    href: "/book-exam",             icon: CalendarCheck },
    { name: "الدعم والمساعدة",  href: "/faq",                   icon: HelpCircle },
  ];

  const activeProgram = React.useMemo(() => {
    const path = location.split("?")[0];
    const match = path.match(/^\/student-program\/(qudrat|tahsili|ielts|gat)$/);
    if (match?.[1]) return match[1] as "qudrat" | "tahsili" | "ielts" | "gat";
    if (path === "/folders") {
      const folderProgram = new URLSearchParams(location.split("?")[1] || "").get("program");
      if (folderProgram && ["qudrat", "tahsili", "ielts", "gat"].includes(folderProgram)) {
        return folderProgram as "qudrat" | "tahsili" | "ielts" | "gat";
      }
    }
    return undefined;
  }, [location]);

  const activeProgramLabel = {
    qudrat: "القدرات | Qudrat",
    tahsili: "التحصيلي | Tahsili",
    ielts: "IELTS",
    gat: "GAT",
  }[activeProgram || "qudrat"];

  const programSubNavItems = activeProgram ? [
    { name: "التأسيس", href: `/student-program/${activeProgram}?section=foundation`, icon: BookOpenIcon },
    { name: "المحوسب", href: `/student-program/${activeProgram}?section=computer`, icon: Brain },
    { name: "مجلداتي", href: `/folders?program=${activeProgram}`, icon: FolderIcon },
  ] : [];

  const isProgramSubNavActive = (item: { name: string; href: string }) => {
    if (!activeProgram) return false;
    if (item.name === "مجلداتي") return location.startsWith("/folders");
    if (location === `/student-program/${activeProgram}`) return item.name === "التأسيس";
    return location === item.href;
  };

  // التحقق من كون المستخدم في اختبار
  const [qiyasExamActive, setQiyasExamActive] = React.useState(false);
  const [abilitiesExamActive, setAbilitiesExamActive] = React.useState(false);
  const [tahsiliExamActive, setTahsiliExamActive] = React.useState(false);

  React.useEffect(() => {
    const checkActiveExams = () => {
      if (typeof window !== 'undefined') {
        const qiyasActive = localStorage.getItem('qiyasExamInProgress') === 'true';
        const abilitiesActive = localStorage.getItem('abilitiesExamInProgress') === 'true';
        const tahsiliActive = localStorage.getItem('tahsiliExamInProgress') === 'true';
        setQiyasExamActive(qiyasActive);
        setAbilitiesExamActive(abilitiesActive);
        setTahsiliExamActive(tahsiliActive);
      }
    };

    checkActiveExams();
    window.addEventListener('storage', checkActiveExams);

    return () => window.removeEventListener('storage', checkActiveExams);
  }, []);

  const isInTestMode = React.useMemo(() => {
    const testRoutes = [
      '/free-verbal-test',
      '/free-quantitative-test',
      '/verbal-test-runner',
      '/quantitative-test-runner',
      '/advanced-verbal-test',
      '/advanced-quantitative-test',
      '/custom-exam',
      '/mistake-challenge',
      '/enhanced-mistake-challenge',
      '/pre-exam-day',
      '/folder-test'
    ];

    // التحقق من المسارات الثابتة
    if (testRoutes.includes(location)) {
      return true;
    }

    // التحقق من مسارات بنك الأسئلة التي تحتوي على معاملات
    if (location.match(/^\/question-bank\/[^\/]+\/\d+$/)) {
      return true;
    }

    // التحقق من حالة الاختبار في qiyas
    if (location === '/qiyas' && qiyasExamActive) {
      return true;
    }

    // التحقق من حالة الاختبار في abilities
    if (location === '/abilities' && abilitiesExamActive) {
      return true;
    }

    // التحقق من حالة الاختبار في tahsili
    if (location === '/tahsili/exams' && tahsiliExamActive) {
      return true;
    }

    return false;
  }, [location, qiyasExamActive, abilitiesExamActive, tahsiliExamActive]);


  return (
    <div className="qodratak-app-shell flex min-h-screen bg-background text-foreground">
      {/* Sidebar - مخفي في وضع الاختبار */}
      {!isInTestMode && (
        <div className="hidden md:flex w-64 flex-col bg-white dark:bg-gray-900 border-l dark:border-gray-800" dir="rtl">

          {/* Logo */}
          <div className="p-4 border-b border-gray-100 dark:border-gray-800">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl overflow-hidden shadow-sm flex-shrink-0">
                <img src={platformLogo} alt="قدراتك" className="w-full h-full object-cover" />
              </div>
              <div>
                <h2 className="text-base font-black text-gray-900 dark:text-white leading-tight">قدراتك</h2>
                <span className="text-[10px] text-gray-400">منصة اختبارات القدرات</span>
              </div>
            </Link>
          </div>

          {/* Core Nav */}
           <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
             {activeProgram ? (
               <>
                 <Link href="/">
                   <div className="mb-3 flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-gray-500 transition hover:bg-gray-50 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-white">
                     <ChevronLeft className="h-4 w-4" />
                     <span>العودة للمسارات</span>
                   </div>
                 </Link>
                 <div className="mb-2 rounded-2xl bg-gray-50 px-3 py-3 dark:bg-gray-800/70">
                   <p className="text-[10px] font-bold text-gray-400">المسار الحالي</p>
                   <p className="mt-1 text-sm font-black text-gray-900 dark:text-white">{activeProgramLabel}</p>
                 </div>
                 <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400">خطة المسار</p>
                 {programSubNavItems.map((item) => {
                   const isActive = isProgramSubNavActive(item);
                   return (
                     <Link key={item.href} href={item.href}>
                       <div className={cn(
                         "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                         isActive
                           ? "border border-green-100 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-950/30 dark:text-green-400"
                           : "text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800"
                       )}>
                         <item.icon className="h-4 w-4 flex-shrink-0" />
                         <span>{item.name}</span>
                         {isActive && <div className="mr-auto h-1.5 w-1.5 rounded-full bg-green-500" />}
                       </div>
                     </Link>
                   );
                 })}
                 <div className="my-3 border-t border-gray-100 dark:border-gray-800" />
                 <Link href="/library">
                   <div className={cn(
                     "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                     location.startsWith("/library") ? "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400" : "text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800"
                   )}>
                     <Library className="h-4 w-4 flex-shrink-0" />
                     <span>المكتبة المشتركة</span>
                   </div>
                 </Link>
               </>
             ) : coreNavItems.map((item) => {
              const isActive = item.href === "/" ? location === "/" : location.startsWith(item.href);
              return (
                <Link key={item.href} href={item.href}>
                  <div className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer",
                    isActive
                      ? "bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border border-green-100 dark:border-green-900"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                  )}>
                    <item.icon className={cn("h-4 w-4 flex-shrink-0", isActive ? "text-green-600 dark:text-green-400" : "text-gray-400")} />
                    <span>{item.name}</span>
                    {isActive && <div className="mr-auto w-1.5 h-1.5 rounded-full bg-green-500" />}
                  </div>
                </Link>
              );
             })}

             {!activeProgram && (
               <>
                 {/* Divider */}
                 <div className="pt-2 pb-1">
                   <p className="px-3 text-[10px] font-semibold uppercase tracking-wider text-gray-400">المزيد</p>
                 </div>

                 {/* More nav items */}
                 {moreNavItems.slice(0, sidebarMoreOpen ? undefined : 4).map((item) => {
                   const isActive = location.startsWith(item.href);
                   return (
                     <Link key={item.href} href={item.href}>
                       <div className={cn(
                         "flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                         isActive
                           ? "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400"
                           : "text-gray-500 hover:bg-gray-50 hover:text-gray-700 dark:text-gray-500 dark:hover:bg-gray-800 dark:hover:text-gray-300"
                       )}>
                         <item.icon className="h-4 w-4 flex-shrink-0 text-gray-400" />
                         <span>{item.name}</span>
                       </div>
                     </Link>
                   );
                 })}

                 <button
                   onClick={() => setSidebarMoreOpen(v => !v)}
                   className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-gray-400 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
                 >
                   <ChevronLeft className={cn("h-4 w-4 transition-transform", sidebarMoreOpen ? "rotate-90" : "-rotate-90")} />
                   <span>{sidebarMoreOpen ? "إخفاء" : "عرض المزيد"}</span>
                 </button>
               </>
             )}
          </nav>

          {/* Bottom: theme + user */}
          <div className="border-t border-gray-100 dark:border-gray-800 p-3 space-y-2">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-1.5">
                <ThemeToggle />
                <span className="text-xs text-gray-400">المظهر</span>
              </div>
              <NotificationBell userId={userId ? String(userId) : null} />
            </div>

            <Link href="/profile">
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer">
                <div className="h-8 w-8 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100 dark:bg-gray-700">
                  {userName ? (
                    <img src={`https://api.dicebear.com/7.x/avataaars-neutral/svg?seed=${userName}`} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon className="h-4 w-4 m-2 text-gray-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{userName || "تسجيل الدخول"}</p>
                  <p className="text-[11px] text-gray-400 truncate">
                    {userSubscription && userSubscription !== 'free' ? userSubscription : "عضو مجاني"}
                  </p>
                </div>
                <ChevronLeft className="w-4 h-4 text-gray-300 flex-shrink-0" />
              </div>
            </Link>
          </div>
        </div>
      )}

      {/* Mobile navigation — 5 items + more drawer */}
      {!isInTestMode && (
        <>
          {/* More menu overlay */}
          {showMoreMenu && (
            <div
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
              onClick={() => setShowMoreMenu(false)}
            />
          )}

          {/* More menu drawer */}
          {showMoreMenu && (
            <div
              className="fixed left-0 right-0 z-50 md:hidden rounded-t-3xl bg-white dark:bg-gray-900 shadow-2xl"
              style={{ bottom: 'calc(4rem + env(safe-area-inset-bottom, 0px))' }}
              dir="rtl"
            >
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 bg-gray-200 dark:bg-gray-700 rounded-full" />
              </div>
              <div
                className="px-5 pb-5 pt-2"
                style={{
                  maxHeight: 'calc(60vh - 4rem)',
                  overflowY: 'auto',
                  WebkitOverflowScrolling: 'touch',
                }}
              >
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">التنقل السريع</p>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { href: "/wallet", icon: Wallet, label: "محفظتي", color: "text-green-500 dark:text-green-400", bg: "bg-green-500/10 dark:bg-green-500/20" },
                    { href: "/book-exam", icon: CalendarCheck, label: "احجز اختبار", color: "text-emerald-500 dark:text-emerald-400", bg: "bg-emerald-500/10 dark:bg-emerald-500/20" },
                    { href: "/notifications", icon: Bell, label: "الإشعارات", color: "text-blue-500 dark:text-blue-400", bg: "bg-blue-500/10 dark:bg-blue-500/20" },
                    { href: "/tahsilik", icon: GraduationCapIcon, label: "تحصيلك", color: "text-amber-500 dark:text-amber-400", bg: "bg-amber-500/10 dark:bg-amber-500/20" },
                    { href: "/records", icon: ClipboardIcon, label: "السجل", color: "text-amber-500 dark:text-amber-400", bg: "bg-amber-500/10 dark:bg-amber-500/20" },
                    { href: "/learn", icon: BookOpenIcon, label: "تعلم", color: "text-emerald-500 dark:text-emerald-400", bg: "bg-emerald-500/10 dark:bg-emerald-500/20" },
                    { href: "/folders", icon: FolderIcon, label: "مجلداتي", color: "text-orange-500 dark:text-orange-400", bg: "bg-orange-500/10 dark:bg-orange-500/20" },
                    { href: "/time-management", icon: Clock, label: "وقتي", color: "text-cyan-500 dark:text-cyan-400", bg: "bg-cyan-500/10 dark:bg-cyan-500/20" },
                    { href: "/notification-settings", icon: Bell, label: "الإشعارات", color: "text-teal-500 dark:text-teal-400", bg: "bg-teal-500/10 dark:bg-teal-500/20" },
                    { href: "/support", icon: MessageCircle, label: "الدعم", color: "text-sky-500 dark:text-sky-400", bg: "bg-sky-500/10 dark:bg-sky-500/20" },
                  ].map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setShowMoreMenu(false)}
                      className="flex flex-col items-center gap-1.5 active:scale-95 transition-transform"
                    >
                      <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", item.bg)}>
                        <item.icon className={cn("h-5 w-5", item.color)} />
                      </div>
                      <span className="text-[10px] font-medium text-gray-600 dark:text-gray-400 text-center leading-tight">{item.label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}

        </>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header - مخفي في وضع الاختبار على الجوال */}
        {!isInTestMode && (
          <header className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 md:hidden">
          <div className="flex items-center justify-between px-3 py-2.5">
            <Link href="/" className="flex items-center gap-2 flex-shrink-0">
              <div className="w-8 h-8 rounded-xl overflow-hidden shadow-sm flex-shrink-0" style={{ boxShadow: '0 2px 8px rgba(26,124,62,0.25)' }}>
                <img src={platformLogo} alt="قدراتك" className="w-full h-full object-cover" />
              </div>
              <span className="text-base font-black leading-none" style={{ color: '#1a7c3e' }}>قدراتك</span>
            </Link>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              {/* زر المساعد الذكي في الهيدر — يظهر فقط عند إخفاء الزر العائم */}
              {aiBadgeInHeader && (
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent('aiButtonReopenFromHeader'))}
                  className="relative flex items-center justify-center w-8 h-8 rounded-xl shadow-sm hover:scale-105 transition-all duration-200 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                  title="إظهار المساعد الذكي"
                  data-testid="btn-ai-header-reopen"
                  style={{ color: '#1a7c3e' }}
                >
                  <BrainCircuitIcon className="w-4 h-4" />
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full border border-white" />
                </button>
              )}

              {/* زر الإشعارات */}
              <NotificationBell userId={userId ? String(userId) : null} />

              {/* النقاط - للمشتركين فقط — أيقونة فقط على الشاشات الصغيرة */}
              {userSubscription && userSubscription !== 'free' && userSubscription !== 'تجريبي' && (
                <div 
                  onClick={() => window.location.href = "/profile"}
                  className="flex items-center gap-1 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 dark:from-yellow-500/20 dark:to-orange-500/20 border border-yellow-500/30 rounded-full px-2 py-1 cursor-pointer hover:scale-105 transition-transform duration-200"
                >
                  <Trophy className="h-3.5 w-3.5 text-yellow-500 flex-shrink-0" />
                  <span className="text-xs font-bold text-yellow-600 dark:text-yellow-400 tabular-nums">
                    {userPoints || 0}
                  </span>
                </div>
              )}

              <Link 
                href="/profile"
                className="p-2"
              >
                {userName ? (
                  <div className="relative h-6 w-6 rounded-full overflow-hidden bg-primary/10">
                    <img 
                      src={`https://api.dicebear.com/7.x/avataaars-neutral/svg?seed=${userName}`} 
                      alt="صورة المستخدم" 
                      className="w-full h-full object-cover"
                    />
                    {(userSubscription === 'Pro' || userSubscription === 'Pro Life' || userSubscription === 'Pro Life Plus' || userSubscription === 'Pro Live') && (
                      <div className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 flex items-center justify-center">
                        {(userSubscription === 'Pro Life' || userSubscription === 'Pro Life Plus' || userSubscription === 'Pro Live') ? (
                          <DiamondIcon className="h-2 w-2 text-white" />
                        ) : (
                          <CrownIcon className="h-2 w-2 text-white" />
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <UserIcon className="h-5 w-5" />
                )}
              </Link>
            </div>
          </div>
          </header>
        )}

        {/* Content */}
        <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
          <div key={location} className="qodratak-page-surface page-enter min-h-full">
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
            {/* Footer - مخفي في وضع الاختبار */}
            {!isInTestMode && <Footer />}
          </div>
        </main>

        {/* Push notification permission banner */}
        {!isInTestMode && <PushNotificationBanner />}

        {/* Bottom nav — ثابت في أسفل الصفحة ضمن تدفق الـ layout */}
        {!isInTestMode && (
          <div
            className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-t border-gray-200/80 dark:border-gray-700/80 shadow-[0_-4px_24px_rgba(0,0,0,0.08)]"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
          >
            <nav className="flex items-center h-16 max-w-screen-sm mx-auto px-1 w-full">
              {(activeProgram ? [
                { href: `/student-program/${activeProgram}?section=foundation`, icon: BookOpenIcon, label: "التأسيس", exact: false },
                { href: `/student-program/${activeProgram}?section=computer`, icon: Brain, label: "المحوسب", exact: false },
                { href: "/folders", icon: FolderIcon, label: "مجلداتي", exact: false },
                { href: "/", icon: HomeIcon, label: "المسارات", exact: true },
              ] : [
                { href: "/", icon: HomeIcon, label: "الرئيسية", exact: true },
                { href: "/student-program/qudrat", icon: Brain, label: "القدرات", exact: false },
                { href: "/student-program/tahsili", icon: GraduationCapIcon, label: "التحصيلي", exact: false },
                { href: "/student-program/ielts", icon: BookOpenIcon, label: "IELTS", exact: false },
                { href: "/student-program/gat", icon: BookOpenIcon, label: "GAT", exact: false },
              ]).map((item) => {
                const active = activeProgram && item.href.includes("?section=")
                  ? isProgramSubNavActive({ name: item.label === "التأسيس" ? "التأسيس" : "المحوسب", href: item.href })
                  : item.exact
                    ? location === item.href
                    : location === item.href || location.startsWith(item.href.split("?")[0]);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "relative flex flex-col items-center justify-center gap-0.5 py-1 flex-1 rounded-xl transition-all duration-200",
                      active ? "text-primary" : "text-gray-400 dark:text-gray-500"
                    )}
                  >
                    {active && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-primary rounded-full" />}
                    <item.icon className={cn("h-5 w-5 transition-transform duration-200", active && "scale-110")} />
                    <span className={cn("text-[9px] font-medium leading-none text-center", active && "font-bold")}>{item.label}</span>
                  </Link>
                );
              })}

            </nav>
          </div>
        )}

      </div>
    </div>
  );
}

function Router({ splashDone }: { splashDone: boolean }) {
  const { user: serverUser, isLoading: isUserLoading } = useUser();

  return (
    <>
      {splashDone && <RotateDevicePrompt />}
      <RouteSEO />
      <AuthenticatedRouteBoundary>
      <Switch>
      <Route path="/parent-dashboard">
        <ProtectedRoute>
          <ParentDashboardPage />
        </ProtectedRoute>
      </Route>
      {/* Main pages */}
      <Route path="/">
        {() => {
          if (isUserLoading) return <LandingPage />;
          if (serverUser?.role === 'parent') return <ParentDashboardPage />;
          return serverUser ? <MainLayout><Home /></MainLayout> : <LandingPage />;
        }}
      </Route>

      <Route path="/student-program/:program">
        {() => <MainLayout><ProtectedRoute><StudentProgramPage /></ProtectedRoute></MainLayout>}
      </Route>

      <Route path="/tahsili">
        {() => <MainLayout><ProtectedRoute requiresPremium={true}><TahsiliPage /></ProtectedRoute></MainLayout>}
      </Route>
      <Route path="/tahsili-dashboard">
        {() => <MainLayout><ProtectedRoute requiresPremium={true}><TahsiliDashboard /></ProtectedRoute></MainLayout>}
      </Route>
      <Route path="/tahsili/exams">
        {() => <MainLayout><ProtectedRoute requiresPremium={true}><TahsiliExamPage /></ProtectedRoute></MainLayout>}
      </Route>

      {/* منصة تحصيلك المتكاملة */}
      <Route path="/tahsilik">
        {() => <MainLayout><ProtectedRoute requiresPremium={true}><TahsilikPlatform /></ProtectedRoute></MainLayout>}
      </Route>
      <Route path="/tahsilik/mobile-dashboard">
        {() => <MainLayout><ProtectedRoute requiresPremium={true}><TahsilikMobileDashboard /></ProtectedRoute></MainLayout>}
      </Route>
      <Route path="/tahsilik/study">
        {() => <MainLayout><ProtectedRoute requiresPremium={true}><TahsilikStudyCenter /></ProtectedRoute></MainLayout>}
      </Route>
      <Route path="/tahsilik/tests">
        {() => <MainLayout><ProtectedRoute requiresPremium={true}><TahsilikTestCenter /></ProtectedRoute></MainLayout>}
      </Route>
      <Route path="/tahsilik/qualification">
        {() => <MainLayout><ProtectedRoute requiresPremium={true}><TahsilikQualificationTest /></ProtectedRoute></MainLayout>}
      </Route>
      <Route path="/tahsilik/question-bank">
        {() => <MainLayout><ProtectedRoute requiresPremium={true}><TahsiliQuestionBank /></ProtectedRoute></MainLayout>}
      </Route>
      <Route path="/tahsilik/custom-test">
        {() => <MainLayout><ProtectedRoute requiresPremium={true}><TahsilikCustomTest /></ProtectedRoute></MainLayout>}
      </Route>
      <Route path="/tahsilik/comprehensive-test">
        {() => <MainLayout><ProtectedRoute requiresPremium={true}><TahsilikComprehensiveTest /></ProtectedRoute></MainLayout>}
      </Route>
      <Route path="/tahsilik/tests/subject">
        {() => <MainLayout><ProtectedRoute requiresPremium={true}><TahsilikSubjectTest /></ProtectedRoute></MainLayout>}
      </Route>
      <Route path="/tahsilik/tests-hub">
        {() => <MainLayout><ProtectedRoute requiresPremium={true}><TahsilikTestsHub /></ProtectedRoute></MainLayout>}
      </Route>

      {/* صفحات متاحة للحسابات المجانية */}
      <Route path="/learn">
        {() => <MainLayout><LearningHubPage /></MainLayout>}
      </Route>

      <Route path="/teacher">
        {() => <MainLayout><TeacherSystemPage /></MainLayout>}
      </Route>

      <Route path="/qiyas-hub">
        {() => <MainLayout><QiyasHubPage /></MainLayout>}
      </Route>

      <Route path="/qiyas">
        {() => <MainLayout><QiyasExamPage /></MainLayout>}
      </Route>

      <Route path="/time-management">
        {() => <MainLayout><NewTimeManagementPage /></MainLayout>}
      </Route>
      <Route path="/install">
        {() => <MainLayout><InstallPage /></MainLayout>}
      </Route>
      <Route path="/usage-guide">
        {() => <MainLayout><UsageGuidePage /></MainLayout>}
      </Route>
      <Route path="/guide">
        {() => <MainLayout><FooterGuidePage /></MainLayout>}
      </Route>
      <Route path="/courses">
        {() => <MainLayout><ProtectedRoute requiresPremium={true}><CoursesPage /></ProtectedRoute></MainLayout>}
      </Route>

      <Route path="/paper-exam">
        {() => <MainLayout><ProtectedRoute requiresPremium={true}><PaperExamPage /></ProtectedRoute></MainLayout>}
      </Route>

      <Route path="/paper-exam-results">
        {() => <MainLayout><ProtectedRoute requiresPremium={true}><PaperExamResultsPage /></ProtectedRoute></MainLayout>}
      </Route>

      <Route path="/paper-models">
        {() => <MainLayout><ProtectedRoute requiresPremium={true}><PaperModelsPage /></ProtectedRoute></MainLayout>}
      </Route>

      <Route path="/paper-models-management">
        {() => <MainLayout><ProtectedRoute requiresPremium={true}><PaperModelsManagementPage /></ProtectedRoute></MainLayout>}
      </Route>

      <Route path="/bubble-sheet-scan">
        {() => <MainLayout><ProtectedRoute requiresPremium={true}><BubbleSheetScanPage /></ProtectedRoute></MainLayout>}
      </Route>

      {/* الاختبارات المجانية - متاحة للحسابات المسجلة */}
      <Route path="/free-verbal-test">
        {() => <MainLayout><FreeVerbalTestRunner /></MainLayout>}
      </Route>
      <Route path="/free-quantitative-test">
        {() => <MainLayout><FreeQuantitativeTestRunner /></MainLayout>}
      </Route>

      {/* صفحة تتبع التقدم */}
      <Route path="/skill-progress">
        {() => <MainLayout><SkillProgressPage /></MainLayout>}
      </Route>

      {/* صفحات اختبارات اللفظي والكمي - تتطلب تسجيل الدخول (تحتوي على اختبارات مجانية ومميزة) */}
      <Route path="/verbal-tests">
        {() => <MainLayout><VerbalTests /></MainLayout>}
      </Route>
      <Route path="/verbal-test-runner">
        {() => <MainLayout><ProtectedRoute requiresPremium={true}><VerbalTestRunner /></ProtectedRoute></MainLayout>}
      </Route>
      <Route path="/quantitative-tests">
        {() => <MainLayout><QuantitativeTests /></MainLayout>}
      </Route>
      <Route path="/quantitative-test-runner">
        {() => <MainLayout><ProtectedRoute requiresPremium={true}><QuantitativeTestRunner /></ProtectedRoute></MainLayout>}
      </Route>
      <Route path="/advanced-verbal-test">
        {() => <MainLayout><ProtectedRoute requiresPremium={true}><AdvancedVerbalTest /></ProtectedRoute></MainLayout>}
      </Route>
      <Route path="/advanced-quantitative-test">
        {() => <MainLayout><ProtectedRoute requiresPremium={true}><AdvancedQuantitativeTest /></ProtectedRoute></MainLayout>}
      </Route>

      <Route path="/custom-exam">
        {() => <MainLayout><ProtectedRoute requiresPremium={true}><CustomExamPage /></ProtectedRoute></MainLayout>}
      </Route>
      <Route path="/abilities">
        {() => <MainLayout><ProtectedRoute requiresPremium={true}><AbilitiesTestPage /></ProtectedRoute></MainLayout>}
      </Route>
      <Route path="/library">
        {() => <MainLayout><ProtectedRoute requiresPremium={true}><LibraryPage /></ProtectedRoute></MainLayout>}
      </Route>
      <Route path="/books">
        {() => <MainLayout><ProtectedRoute requiresPremium={true}><BooksPage /></ProtectedRoute></MainLayout>}
      </Route>
      <Route path="/challenges">
        {() => <MainLayout><ProtectedRoute requiresPremium={true}><ChallengePage /></ProtectedRoute></MainLayout>}
      </Route>
      <Route path="/folders">
        {() => <MainLayout><ProtectedRoute requiresPremium={true}><MyFolders /></ProtectedRoute></MainLayout>}
      </Route>
      <Route path="/folders/:id">
        {() => <MainLayout><ProtectedRoute requiresPremium={true}><FolderView /></ProtectedRoute></MainLayout>}
      </Route>
      <Route path="/test-me">
        {() => <MainLayout><ProtectedRoute requiresPremium={true}><TestMe /></ProtectedRoute></MainLayout>}
      </Route>
      <Route path="/folder-test">
        {() => <MainLayout><ProtectedRoute requiresPremium={true}><FolderTest /></ProtectedRoute></MainLayout>}
      </Route>
      <Route path="/records">
        {() => <MainLayout><ProtectedRoute requiresPremium={true}><ExamRecordsPage /></ProtectedRoute></MainLayout>}
      </Route>
      <Route path="/mock-exams">
        {() => <MainLayout><ProtectedRoute requiresPremium={true}><MockExamPage /></ProtectedRoute></MainLayout>}
      </Route>
      <Route path="/flashcards">
        {() => <FlashcardsPage />}
      </Route>
      <Route path="/performance-report">
        {() => <PerformanceReportPage />}
      </Route>
      <Route path="/adaptive-test">
        {() => <AdaptiveTestPage />}
      </Route>
      <Route path="/error-analysis">
        {() => <ErrorAnalysisPage />}
      </Route>
      <Route path="/study-rooms/:code">
        {() => <StudyRoomLobbyPage />}
      </Route>
      <Route path="/study-rooms">
        {() => <MainLayout><StudyRoomsPage /></MainLayout>}
      </Route>
      <Route path="/notification-settings">
        {() => <MainLayout><NotificationSettingsPage /></MainLayout>}
      </Route>
      <Route path="/notifications">
        {() => <MainLayout><NotificationsPage /></MainLayout>}
      </Route>
      <Route path="/pre-exam-day">
        {() => <PreExamDayPage />}
      </Route>
      <Route path="/ai-tutor">
        {() => <AiTutorPage />}
      </Route>
      <Route path="/ai-hub">
        {() => <MainLayout><ProtectedRoute><AiHub /></ProtectedRoute></MainLayout>}
      </Route>
      <Route path="/ai-hub/score-prediction">
        {() => <MainLayout><ProtectedRoute><AiScorePrediction /></ProtectedRoute></MainLayout>}
      </Route>
      <Route path="/ai-hub/pattern-analysis">
        {() => <MainLayout><ProtectedRoute><AiPatternAnalysis /></ProtectedRoute></MainLayout>}
      </Route>
      <Route path="/ai-hub/daily-plan">
        {() => <MainLayout><ProtectedRoute><AiDailyPlan /></ProtectedRoute></MainLayout>}
      </Route>
      <Route path="/strategy-library">
        {() => <MainLayout><StrategyLibraryPage /></MainLayout>}
      </Route>
      <Route path="/mistake-challenge">
        {() => <MainLayout><EnhancedMistakeChallenge /></MainLayout>}
      </Route>
      <Route path="/support">
        {() => <MainLayout><FAQPage /></MainLayout>}
      </Route>
      <Route path="/enhanced-mistake-challenge">
        {() => <MainLayout><EnhancedMistakeChallenge /></MainLayout>}
      </Route>

      {/* Question Bank Routes */}
      <Route path="/question-bank">
        {() => <MainLayout><QuestionBankPage /></MainLayout>}
      </Route>
      <Route path="/question-bank/standard/:testNumber">
        {() => <MainLayout><StandardSectionTestRunner /></MainLayout>}
      </Route>
      <Route path="/question-bank/:type/:testNumber">
        {() => <MainLayout><SectionedTestRunner /></MainLayout>}
      </Route>
      <Route path="/standard-test">
        {() => <MainLayout><StandardSectionTestRunner /></MainLayout>}
      </Route>
      <Route path="/profile">
        {() => <MainLayout><ProfilePage /></MainLayout>}
      </Route>
      <Route path="/security-settings">
        {() => <SecuritySettingsPage />}
      </Route>
      <Route path="/book-exam">
        {() => <MainLayout><BookExamPage /></MainLayout>}
      </Route>
      <Route path="/scheduled-exam/:id">
        {() => <ScheduledExamRunner />}
      </Route>
      <Route path="/analytics">
        {() => <MainLayout><StudentAnalyticsPage /></MainLayout>}
      </Route>
      <Route path="/account-type">
        {() => <AccountTypeSelection />}
      </Route>
      <Route path="/institution">
        {() => <MainLayout><InstitutionPortalPage /></MainLayout>}
      </Route>
      <Route path="/signup">
        {() => <LandingPage initialModal="signup" />}
      </Route>
      <Route path="/login">
        {() => <LandingPage initialModal="login" />}
      </Route>
      <Route path="/forgot-password">
        {() => <MainLayout><ForgotPasswordPage /></MainLayout>}
      </Route>
      <Route path="/reset-password">
        {() => <MainLayout><ResetPasswordPage /></MainLayout>}
      </Route>
      <Route path="/guest-signup">
        {() => <MainLayout><GuestSignupPage /></MainLayout>}
      </Route>
      <Route path="/free-signup">
        {() => <MainLayout><FreeAccountSignup /></MainLayout>}
      </Route>
      <Route path="/wallet">
        {() => <MainLayout><WalletPage /></MainLayout>}
      </Route>
      <Route path="/invite/:token">
        {(params) => <InvitePage />}
      </Route>
      <Route path="/seasonal-exams">
        {() => <MainLayout><SeasonalExamsPage /></MainLayout>}
      </Route>
      <Route path="/subscription">
        {() => <Redirect to="/" />}
      </Route>
      <Route path="/enhanced-subscription">
        {() => <MainLayout><EnhancedSubscriptionPlans /></MainLayout>}
      </Route>
      <Route path="/test-results">
        {() => <MainLayout><TestResultsPage /></MainLayout>}
      </Route>
      <Route path="/exam-review">
        {() => <ExamReviewPage />}
      </Route>

      {/* Admin Routes */}
      <Route path="/admin">
        {() => <AdminLogin />}
      </Route>
      <Route path="/admin/login">
        {() => <AdminLogin />}
      </Route>
      <Route path="/admin/dashboard">
        {() => <AdminDashboard />}
      </Route>
      <Route path="/admin/users">
        {() => <AdminDashboard initialTab="users" />}
      </Route>
      <Route path="/admin/questions">
        {() => <AdminDashboard initialTab="questions" />}
      </Route>
      <Route path="/admin/chat">
        {() => <ChatPage />}
      </Route>

      <Route path="/faq">
        {() => <MainLayout><FAQPage /></MainLayout>}
      </Route>
      <Route path="/pricing">
        {() => <MainLayout><PricingPage /></MainLayout>}
      </Route>
      <Route path="/terms">
        {() => <MainLayout><FooterDocumentsPage documentKey="terms" /></MainLayout>}
      </Route>
      <Route path="/privacy">
        {() => <MainLayout><FooterDocumentsPage documentKey="privacy" /></MainLayout>}
      </Route>
      <Route path="/refund-policy">
        {() => <MainLayout><FooterDocumentsPage documentKey="refund" /></MainLayout>}
      </Route>
      <Route path="/platform-guide">
        {() => <MainLayout><PlatformGuidePage /></MainLayout>}
      </Route>
      {/* Fallback to 404 */}
      <Route>
        {() => <MainLayout><NotFound /></MainLayout>}
      </Route>
      </Switch>
      </AuthenticatedRouteBoundary>
    </>
  );
}

function App() {
  // Check if we're on admin pages - skip splash for admin
  const isAdminPage = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');

  // The public landing page should be available immediately; loading belongs inside
  // feature screens that need it rather than obscuring the product identity.
  const [showSplash, setShowSplash] = React.useState(false);
  const [showNationalDayPopup, setShowNationalDayPopup] = React.useState(false);
  const [splashDone, setSplashDone] = React.useState(true);

  React.useEffect(() => {
    // Skip splash for admin pages
    if (isAdminPage) {
      setShowSplash(false);
      setSplashDone(true);
      return;
    }

    // Check for National Day popup
    const hasSeenNationalDayPopup = localStorage.getItem('hasSeenNationalDayPopup2025');
    const currentDate = new Date();
    const offerStartDate = new Date("2025-09-22T18:00:00+03:00");
    const offerEndDate = new Date("2025-09-24T06:00:00+03:00");

    if (currentDate >= offerStartDate && currentDate <= offerEndDate && !hasSeenNationalDayPopup) {
      setTimeout(() => {
        setShowNationalDayPopup(true);
      }, 3000);
    }

    return undefined;
  }, []);

  const handleCloseNationalDayPopup = () => {
    setShowNationalDayPopup(false);
    localStorage.setItem('hasSeenNationalDayPopup2025', 'true');
  };

  if (showSplash) {
    return <SplashScreen onDone={() => { setShowSplash(false); setSplashDone(true); }} />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
        <TooltipProvider>
          <Toaster />
          <React.Suspense fallback={<RouteLoadingFallback />}>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
              <Router splashDone={splashDone} />
            </WouterRouter>
          </React.Suspense>

          {/* PWA Install Prompt - يظهر على جميع المتصفحات */}
          {splashDone && <InstallPrompt />}
          {splashDone && <FloatingInstallButton />}


          {/* بوابة الأمان الإلزامية — تُظهر للمستخدمين الجدد الذين لم يُعدّوا وسيلة أمان */}
          {splashDone && <SecuritySetupModal />}

          {/* National Day Celebration Popup */}
          <NationalDayPopup 
            isOpen={showNationalDayPopup} 
            onClose={handleCloseNationalDayPopup} 
          />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;