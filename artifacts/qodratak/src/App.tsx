import React from 'react';
import DailyExamPage from "./pages/DailyExamPage";
import { Switch, Route, Link, useLocation, Router as WouterRouter } from "wouter";
import { RotateDevicePrompt } from "@/components/RotateDevicePrompt";
import { queryClient } from "./lib/queryClient";
import { installAdminFetchBridge } from "./lib/adminSession";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NationalDayPopup from "@/components/NationalDayPopup";
import useSubscription from "@/hooks/useSubscription";

import NotFound from "@/pages/not-found";
import Home from "@/pages/NewHome";
import GeideaPaymentReturnPage from "@/pages/GeideaPaymentReturnPage";
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
  Lightbulb,
  Search,
  Target,
  TrendingUp,
  TrendingDown,
  ChevronLeft,
  Wallet,
  Menu,
  BarChart2,
  MessageCircle,
  Users,
  Library
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { Footer } from "@/components/Footer";
import LoginPage from "@/pages/LoginPage";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import GuestSignupPage from "@/pages/GuestSignupPage";
import { Redirect } from "wouter";
import TestResultsPage from './pages/TestResultsPage';
import ExamReviewPage from './pages/ExamReviewPage';
import FAQPage from "@/pages/FAQ";
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
import FolderDetailPage from "@/pages/FolderDetailPage";
import AdminLogin from "@/pages/admin/AdminLogin";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import ChatPage from "@/pages/admin/ChatPage";
import TahsiliOverviewPage from "@/pages/TahsiliOverviewPage";
import TahsiliSourceLibrary from "@/pages/TahsiliSourceLibrary";
import TahsilikSubjectTest from "@/pages/TahsilikSubjectTest";
import TahsilikSubjectTestRunner from "@/pages/TahsilikSubjectTestRunner";
import TahsilikTestsHub from "@/pages/TahsilikTestsHub";
import LandingPage from "@/pages/LandingPage";
import { SplashScreen } from "@/components/SplashScreen";
import { RouteSEO } from "@/components/RouteSEO";
import NotificationBell from "@/components/NotificationBell";
import { ThemeToggle } from "@/components/ThemeToggle";
import PaperModelsManagementPage from "@/pages/PaperModelsManagementPage";
import BubbleSheetScanPage from "@/pages/BubbleSheetScanPage";
import PlatformGuidePage from "@/pages/PlatformGuidePage";
import HowItWorksPage from "@/pages/HowItWorksPage";
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
import InstitutionContractPortalPage from "@/pages/InstitutionContractPortalPage";
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
import TeacherHomePage from "@/pages/TeacherHomePage";
import SecuritySettingsPage from "@/pages/SecuritySettingsPage";
import NotificationsPage from "@/pages/NotificationsPage";
import InstitutionPortalPage from "@/pages/InstitutionPortalPage";
import ParentDashboardPage from "@/pages/ParentDashboardPage";
import FooterDocumentsPage from "@/pages/FooterDocumentsPage";
import FooterGuidePage from "@/pages/FooterGuidePage";
import { useUser } from "@/hooks/use-user";
import DashboardPage from "@/pages/student/DashboardPage";
import FoundationPage from "@/pages/student/FoundationPage";
import FoundationCoverageTestPage from "@/pages/student/FoundationCoverageTestPage";
import FoundationBankTestPage from "@/pages/student/FoundationBankTestPage";
import FoundationReaderPage from "@/pages/student/FoundationReaderPage";
import { QuantitativeBookOverviewPage, QuantitativeBookLessonPage } from "@/pages/student/QuantitativeBookPage";
import LearningTodayPage from "@/pages/student/LearningTodayPage";
import ComputerizedPage from "@/pages/student/ComputerizedPage";
import PreparationCoursePage from "@/pages/student/PreparationCoursePage";
import CoursePracticePage from "@/pages/student/CoursePracticePage";
import { StudentAvailabilityBoundary } from "@/components/student/TahsiliComingSoon";
import { StudentJourneyNavigation } from "@/components/student/StudentJourneyNavigation";
import AccountPage from "@/pages/student/AccountPage";
import { StudentShell } from "@/components/student/StudentShell";
import { StudentPageGuide } from "@/components/student/PageGuideFilm";
import { StudentExamChromeContext } from "@/components/student/StudentExamChromeContext";
import { BrandLoadingScreen, PageTransition } from "@/components/PageTransition";
import { BrandMark } from "@/components/BrandMark";


installAdminFetchBridge();

// These routes contain reporting and document-generation libraries. Loading them
// only when opened keeps the first visit, especially on mobile data, lightweight.
const LearningHubPage = React.lazy(() => import("@/pages/LearningHubPage"));
const PerformanceReportPage = React.lazy(() => import("@/pages/PerformanceReportPage"));
const PaperExamResultsPage = React.lazy(() => import("@/pages/PaperExamResultsPage"));
const PaperExamPage = React.lazy(() => import("@/pages/PaperExamPage"));
const PaperModelsPage = React.lazy(() => import("@/pages/PaperModelsPage"));

function RouteLoadingFallback() {
  return <BrandLoadingScreen />;
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
  "/how-it-works",
  "/institution-contract",
]);

function isPublicPath(pathname: string) {
  const cleanPath = pathname.split("?")[0].replace(/\/+$/, "") || "/";
  return PUBLIC_PATHS.has(cleanPath) || cleanPath.startsWith("/invite/") || cleanPath.startsWith("/admin");
}

function AuthenticatedRouteBoundary({ children }: { children: React.ReactNode }) {
  const [location, navigate] = useLocation();
  const { user, isLoading, error, refetch } = useUser();
  const {
    subscription, isLoading: isSubscriptionLoading,
    error: subscriptionError, refetchSubscription,
  } = useSubscription();
  const needsAuthentication = !isPublicPath(location);
  const cleanPath = location.split("?")[0].replace(/\/+$/, "") || "/";
  // The server still authorizes every API call. Close cached learning screens
  // at the known trial deadline too, without waiting for the next status poll.
  const trialDeadlineElapsed = Boolean(
    subscription?.isTrialActive && subscription.trialEndDate &&
    new Date(subscription.trialEndDate).getTime() <= Date.now(),
  );
  const isExpiredStudent = user?.role === "student" &&
    Boolean(subscription?.isExpired || trialDeadlineElapsed);
  const canUseExpiredTrialRoute = [
    "/",
    "/records",
    "/how-it-works",
    "/subscription",
    "/enhanced-subscription",
    "/payment/geidea/return",
  ].includes(cleanPath);

  useEffect(() => {
    if (needsAuthentication && !isLoading && !error && !user) {
      navigate(`/login?return=${encodeURIComponent(location)}`);
    }
  }, [location, navigate, needsAuthentication, isLoading, error, user]);

  useEffect(() => {
    if (isExpiredStudent && !canUseExpiredTrialRoute) navigate("/");
  }, [canUseExpiredTrialRoute, isExpiredStudent, navigate]);

  if (needsAuthentication && isLoading) {
    return <RouteLoadingFallback />;
  }

  if (needsAuthentication && error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-6 text-center" dir="rtl">
        <p className="text-sm font-medium text-muted-foreground">
          تعذر الاتصال بالخادم مؤقتًا، ولم يتم تسجيل خروجك.
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground"
        >
          إعادة المحاولة
        </button>
      </div>
    );
  }

  if (needsAuthentication && !user) {
    return <RouteLoadingFallback />;
  }

  if (user?.role === "student" && isSubscriptionLoading) {
    return <RouteLoadingFallback />;
  }
  if (user?.role === "student" && needsAuthentication &&
      !canUseExpiredTrialRoute && (subscriptionError || !subscription)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-6 text-center" dir="rtl">
        <p className="text-sm font-medium text-muted-foreground">
          تعذر التحقق من صلاحيات حسابك. أعد المحاولة لفتح صفحة التعلّم.
        </p>
        <button type="button" onClick={() => refetchSubscription()}
          className="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground">
          إعادة المحاولة
        </button>
      </div>
    );
  }
  if (isExpiredStudent && !canUseExpiredTrialRoute) {
    return <RouteLoadingFallback />;
  }

  return <>{children}</>;
}

type ActiveExamFlags = {
  qiyas: boolean;
  abilities: boolean;
  tahsili: boolean;
};

const TEST_ROUTES = [
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
  '/folder-test',
];

function readActiveExamFlags(): ActiveExamFlags {
  if (typeof window === 'undefined') {
    return { qiyas: false, abilities: false, tahsili: false };
  }

  return {
    qiyas: localStorage.getItem('qiyasExamInProgress') === 'true',
    abilities: localStorage.getItem('abilitiesExamInProgress') === 'true',
    tahsili: localStorage.getItem('tahsiliExamInProgress') === 'true',
  };
}

function isTestModeLocation(
  location: string,
  activeExams: ActiveExamFlags,
  isExamLayoutActive = false,
): boolean {
  if (isExamLayoutActive || TEST_ROUTES.includes(location)) return true;
  if (location.startsWith('/book-exam/')) return true;
  if (/^\/question-bank\/[^/]+\/\d+$/.test(location)) return true;
  if (location === '/qiyas' && activeExams.qiyas) return true;
  if (location === '/abilities' && activeExams.abilities) return true;
  if (location === '/tahsili/exams' && activeExams.tahsili) return true;
  return false;
}

function MainLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user: layoutUser } = useUser();
  const [userName, setUserName] = useState<string | null>(null);
  const [userSubscription, setUserSubscription] = useState<string>('free');
  const [userPoints, setUserPoints] = useState<number>(0);
  const [userId, setUserId] = useState<number | null>(null);
  const [aiBadgeInHeader, setAiBadgeInHeader] = useState(() => sessionStorage.getItem('ai_badge_hidden') === '1');
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [sidebarMoreOpen, setSidebarMoreOpen] = useState(false);
  const [sidebarMoreSearch, setSidebarMoreSearch] = useState("");

  useEffect(() => {
    setShowMoreMenu(false);
    setSidebarMoreSearch("");
  }, [location]);

  useEffect(() => {
    const openPageDirectory = () => {
      setSidebarMoreOpen(true);
      setSidebarMoreSearch("");
      setShowMoreMenu(true);
    };
    window.addEventListener("qodratak:open-student-pages", openPageDirectory);
    return () => window.removeEventListener("qodratak:open-student-pages", openPageDirectory);
  }, []);

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
    { name: "خطتي", href: "/preparation-course", icon: CalendarCheck },
    { name: "التأسيس", href: "/foundation", icon: BookOpenIcon },
    { name: "التدريب المحوسب", href: "/computerized", icon: Brain },
    { name: "نتائجي", href: "/records", icon: ClipboardIcon },
  ];

  // ─── Complete student learning directory ───────────────────
  const moreNavItems = [
    { group: "اختبارات وتدريب", name: "مركز الاختبارات", href: "/qiyas-hub", icon: Brain, description: "اختر اختبارًا محوسبًا أو محاكاة مناسبة." },
    { group: "اختبارات وتدريب", name: "اختبارات اللفظي", href: "/verbal-tests", icon: BookOpenIcon, description: "تدرب على أقسام اللفظي." },
    { group: "اختبارات وتدريب", name: "اختبارات الكمي", href: "/quantitative-tests", icon: Calculator, description: "تدرب على أقسام الكمي." },
    { group: "اختبارات وتدريب", name: "بنك الأسئلة", href: "/question-bank", icon: BookOpenIcon, description: "ابحث عن أسئلة التدريب المتاحة." },
    { group: "اختبارات وتدريب", name: "اختبار القدرات المحوسب", href: "/qiyas", icon: Brain, description: "ابدأ اختبار قدرات محوسبًا من الإعدادات المتاحة." },
    { group: "اختبارات وتدريب", name: "اختبار تغطية التأسيس", href: "/foundation/coverage-test", icon: ClipboardIcon, description: "تحقق من تغطية مهارات التأسيس." },
    { group: "اختبارات وتدريب", name: "اختبرني من الأسئلة", href: "/test-me", icon: Target, description: "ابدأ تدريبًا من الأسئلة المتاحة لحسابك." },
    { group: "اختبارات وتدريب", name: "اختبار يومي لفظي", href: "/free-verbal-test", icon: ClipboardIcon, description: "اختبار لفظي يومي للحسابات المسجلة." },
    { group: "اختبارات وتدريب", name: "اختبار يومي كمي", href: "/free-quantitative-test", icon: Calculator, description: "اختبار كمي يومي للحسابات المسجلة." },
    { group: "اختبارات وتدريب", name: "الاختبارات المحاكية", href: "/mock-exams", icon: BrainCircuitIcon, description: "تدرب في تجربة أقرب للاختبار." },
    { group: "اختبارات وتدريب", name: "اختبار مخصص", href: "/custom-exam", icon: Layers, description: "اختر إعدادات التدريب التي تناسبك." },
    { group: "اختبارات وتدريب", name: "الاختبار الورقي", href: "/paper-exam", icon: Printer, description: "تدرب على نموذج ورقي." },
    { group: "اختبارات وتدريب", name: "نماذج الورقي", href: "/paper-models", icon: FileText, description: "استعرض النماذج الورقية المنشورة." },
    { group: "اختبارات وتدريب", name: "تصحيح ورقة الإجابة", href: "/bubble-sheet-scan", icon: ClipboardIcon, description: "صحح ورقة إجابتك إذا كانت الميزة متاحة لاشتراكك." },
    { group: "اختبارات وتدريب", name: "الاختبار القياسي", href: "/standard-test", icon: ClipboardIcon, description: "ابدأ اختبارًا قياسيًا من المحتوى المتاح." },
    { group: "اختبارات وتدريب", name: "اختبار لفظي متقدم", href: "/advanced-verbal-test", icon: BookOpenIcon, description: "تدرب على أسئلة لفظية بمستوى متقدم." },
    { group: "اختبارات وتدريب", name: "اختبار كمي متقدم", href: "/advanced-quantitative-test", icon: Calculator, description: "تدرب على أسئلة كمية بمستوى متقدم." },
    { group: "اختبارات وتدريب", name: "الاختبارات الموسمية", href: "/seasonal-exams", icon: CalendarClock, description: "استعرض الاختبارات الموسمية المتاحة." },
    { group: "اختبارات وتدريب", name: "اختبارات القدرات", href: "/abilities", icon: Target, description: "افتح اختبارات القدرات المتاحة لحسابك." },
    { group: "اختبارات وتدريب", name: "الدورات التعليمية", href: "/courses", icon: GraduationCapIcon, description: "استعرض الدورات التعليمية المنشورة." },

    { group: "التحصيلي", name: "مسار التحصيلي", href: "/student-program/tahsili", icon: GraduationCapIcon, description: "انتقل إلى التأسيس والدراسة والاختبارات المنشورة للتحصيلي." },
    { group: "التحصيلي", name: "صفحة التحصيلي", href: "/tahsili", icon: GraduationCapIcon, description: "نظرة عامة على الدراسة ومراكز اختبارات التحصيلي." },
    { group: "التحصيلي", name: "مصادر التحصيلي", href: "/tahsilik/study", icon: BookOpenIcon, description: "افتح ملفات الدراسة المرفوعة للمواد." },
    { group: "التحصيلي", name: "اختبارات التحصيلي", href: "/tahsilik/tests", icon: ClipboardIcon, description: "اختبارات مبنية على الأسئلة التي اعتُمدت إجاباتها." },
    { group: "التحصيلي", name: "مركز اختبارات التحصيلي", href: "/tahsilik/tests", icon: Brain, description: "افتح اختبارات التحصيلي حسب المادة أو الاختبار الشامل." },
    { group: "التحصيلي", name: "مركز الدراسة", href: "/tahsilik/study", icon: BookOpenIcon, description: "تابع مواد التحصيلي والدروس المنشورة." },
    { group: "التحصيلي", name: "بنك أسئلة التحصيلي", href: "/tahsilik/question-bank", icon: Library, description: "تدرب على أسئلة التحصيلي حسب المادة." },
    { group: "التحصيلي", name: "اختبار تحصيلي شامل", href: "/tahsilik/comprehensive-test", icon: ClipboardIcon, description: "ابدأ اختبارًا شاملًا من المحتوى المنشور." },
    { group: "التحصيلي", name: "اختبار تحصيلي مخصص", href: "/tahsilik/custom-test", icon: Layers, description: "خصص اختبارًا بحسب المادة والإعدادات المتاحة." },
    { group: "التحصيلي", name: "اختبار حسب المادة", href: "/tahsilik/qualification", icon: Target, description: "اختر المادة وابدأ اختبارًا مناسبًا لها." },

    { group: "مراجعة وتقدم", name: "تقدم المهارات", href: "/skill-progress", icon: TrendingUp, description: "تابع تقدمك في المهارات." },
    { group: "مراجعة وتقدم", name: "تحليل الأداء", href: "/performance-report", icon: BarChart2, description: "راجع مؤشرات أدائك عبر المحاولات." },
    { group: "مراجعة وتقدم", name: "تحليلاتي", href: "/analytics", icon: TrendingUp, description: "استعرض ملخص نشاطك ونتائجك." },
    { group: "مراجعة وتقدم", name: "تحليل الأخطاء", href: "/error-analysis", icon: TrendingDown, description: "افهم أنماط الإجابات التي تحتاج مراجعة." },
    { group: "مراجعة وتقدم", name: "اختبار تكيفي", href: "/adaptive-test", icon: Brain, description: "تدرب بأسئلة تتدرج حسب أدائك." },
    { group: "مراجعة وتقدم", name: "بطاقات المراجعة", href: "/flashcards", icon: Layers, description: "راجع المفاهيم بالبطاقات." },
    { group: "مراجعة وتقدم", name: "تحدي مراجعة الأخطاء", href: "/mistake-challenge", icon: GamepadIcon, description: "راجع ما أخطأت فيه بطريقة تفاعلية." },
    { group: "مراجعة وتقدم", name: "تحدي مراجعة الأخطاء المتقدم", href: "/enhanced-mistake-challenge", icon: GamepadIcon, description: "راجع الأسئلة التي تحتاج إلى إعادة تدريب." },
    { group: "مراجعة وتقدم", name: "مراجعة الاختبار", href: "/exam-review", icon: ClipboardIcon, description: "افتح مراجعة الأسئلة بعد تسليم الاختبار." },
    { group: "مراجعة وتقدم", name: "نتائج الاختبارات", href: "/test-results", icon: FileText, description: "استعرض نتائج ومحاولات الاختبارات." },
    { group: "مراجعة وتقدم", name: "نتائج الاختبار الورقي", href: "/paper-exam-results", icon: Printer, description: "راجع نتائج تصحيح النماذج الورقية." },
    { group: "مراجعة وتقدم", name: "ملفي الدراسي", href: "/profile", icon: UserIcon, description: "راجع ملفك وإعداداتك التعليمية." },
    { group: "مراجعة وتقدم", name: "تحديات التعلم", href: "/challenges", icon: Flame, description: "أنشطة قصيرة لتحفيز الممارسة." },
    { group: "مراجعة وتقدم", name: "استراتيجيات الحل", href: "/strategy-library", icon: Lightbulb, description: "تعرف على طرق حل منظمة." },

    { group: "خطة واستعداد", name: "جلسة اليوم", href: "/learning/today", icon: CalendarCheck, description: "تابع جلسة التعلم الموجهة لهذا اليوم." },
    { group: "خطة واستعداد", name: "حجز موعد الاختبار", href: "/book-exam", icon: CalendarClock, description: "سجل موعد اختبارك أو احجز محاكاة." },
    { group: "خطة واستعداد", name: "الاستعداد ليوم الاختبار", href: "/pre-exam-day", icon: CalendarClock, description: "راجع الاستعدادات والخطوات قبل الاختبار." },
    { group: "خطة واستعداد", name: "إدارة الوقت", href: "/time-management", icon: Clock, description: "نظم وقت المذاكرة والراحة." },
    { group: "خطة واستعداد", name: "غرف المذاكرة", href: "/study-rooms", icon: Users, description: "انضم إلى جلسة مذاكرة جماعية." },

    { group: "مصادر ومساعدة", name: "مسار القدرات", href: "/student-program/qudrat", icon: Brain, description: "افتح محتوى القدرات حسب مسارك." },
    { group: "مصادر ومساعدة", name: "مركز التعلم", href: "/learn", icon: BookOpenIcon, description: "استكشف خيارات التعلم المتاحة." },
    { group: "مصادر ومساعدة", name: "كتاب التأسيس الكمي", href: "/student/foundation-book/quantitative", icon: BookOpenIcon, description: "افتح كتاب التأسيس الكمي المنشور." },
    { group: "مصادر ومساعدة", name: "المكتبة", href: "/library", icon: Library, description: "افتح مكتبتك التعليمية." },
    { group: "مصادر ومساعدة", name: "كتبي", href: "/books", icon: BookOpenIcon, description: "تابع كتبك التعليمية." },
    { group: "مصادر ومساعدة", name: "مجلداتي", href: "/folders", icon: FolderIcon, description: "نظم الأسئلة والمواد المحفوظة." },
    { group: "مصادر ومساعدة", name: "محفظتي", href: "/wallet", icon: Wallet, description: "راجع رصيدك وعمليات حسابك." },
    { group: "مصادر ومساعدة", name: "مساعد الشرح (اختياري)", href: "/ai-tutor", icon: BrainCircuitIcon, description: "اطلب شرحًا عند الحاجة؛ لا يعمل تلقائيًا." },
    { group: "مصادر ومساعدة", name: "مركز الأدوات الذكية (اختياري)", href: "/ai-hub", icon: BrainCircuitIcon, description: "افتح الأدوات الذكية بإرادتك؛ لا تُشغّل تلقائيًا من قائمة التنقل." },
    { group: "مصادر ومساعدة", name: "تحليل الأنماط الذكي (اختياري)", href: "/ai-hub/pattern-analysis", icon: TrendingDown, description: "تحليل اختياري عند فتحك لهذه الصفحة." },
    { group: "مصادر ومساعدة", name: "اقتراح خطة ذكية (اختياري)", href: "/ai-hub/daily-plan", icon: CalendarCheck, description: "اقتراح اختياري عند فتحك لهذه الصفحة." },
    { group: "مصادر ومساعدة", name: "توقع الدرجة (اختياري)", href: "/ai-hub/score-prediction", icon: TrendingUp, description: "توقع اختياري عند فتحك لهذه الصفحة." },
    { group: "مصادر ومساعدة", name: "دليل الاستخدام", href: "/usage-guide", icon: HelpCircle, description: "تعرف على صفحات المنصة وطريقة استخدامها." },
    { group: "مصادر ومساعدة", name: "كيف تعمل المنصة؟", href: "/how-it-works", icon: PlayCircleIcon, description: "شاهد مسار الاستخدام خطوة بخطوة." },
    { group: "مصادر ومساعدة", name: "دليل المنصة", href: "/guide", icon: PlayCircleIcon, description: "افتح الدليل التعريفي للمنصة." },
    { group: "مصادر ومساعدة", name: "تثبيت التطبيق", href: "/install", icon: Download, description: "تعرف على طريقة تثبيت المنصة على جهازك." },
    { group: "مصادر ومساعدة", name: "الإشعارات", href: "/notifications", icon: Bell, description: "راجع تحديثات حسابك." },
    { group: "مصادر ومساعدة", name: "إعدادات الإشعارات", href: "/notification-settings", icon: Bell, description: "اختر الإشعارات التي تريد استقبالها." },
    { group: "مصادر ومساعدة", name: "الأمان", href: "/security-settings", icon: UserIcon, description: "راجع إعدادات أمان حسابك." },
    { group: "مصادر ومساعدة", name: "حسابي", href: "/account", icon: UserIcon, description: "حدّث بياناتك وراجع اشتراكك." },
    { group: "مصادر ومساعدة", name: "الاشتراك والباقات", href: "/subscription", icon: Wallet, description: "راجع تفاصيل الاشتراك والخيارات المتاحة." },
    { group: "مصادر ومساعدة", name: "الباقات والأسعار", href: "/pricing", icon: Wallet, description: "قارن الباقات قبل الاشتراك." },
    { group: "مصادر ومساعدة", name: "الأسئلة الشائعة والدعم", href: "/faq", icon: HelpCircleIcon, description: "ابحث عن إجابة أو تواصل مع الدعم." },
    { group: "مصادر ومساعدة", name: "الدعم الفني", href: "/support", icon: MessageCircle, description: "افتح قنوات الدعم ومعلومات التواصل." },
    { group: "مصادر ومساعدة", name: "دليل المنصة المتقدم", href: "/platform-guide", icon: HelpCircle, description: "استعرض الدليل التفصيلي لاستخدام المنصة." },
  ];

  const learnerGoalActions = [
    { name: "أبني الأساس", href: "/foundation", icon: BookOpenIcon, description: "اختر مسار القدرات أو التحصيلي وابدأ من الأساس." },
    { name: "أتدرب على اختبار", href: "/qiyas-hub", icon: Brain, description: "اختر تدريبًا أو اختبارًا محاكيًا." },
    { name: "أراجع أخطائي", href: "/error-analysis", icon: TrendingDown, description: "اكتشف ما يحتاج إلى مراجعة." },
    { name: "أستعد لموعدي", href: "/pre-exam-day", icon: CalendarCheck, description: "راجع خطة الاستعداد للاختبار." },
  ];

  const normalizedMoreSearch = sidebarMoreSearch.trim().toLocaleLowerCase("ar");
  const filteredMoreNavItems = moreNavItems.filter((item) =>
    !normalizedMoreSearch ||
    `${item.group} ${item.name} ${item.description} ${item.href}`.toLocaleLowerCase("ar").includes(normalizedMoreSearch)
  );
  const moreNavGroups = Array.from(new Set(filteredMoreNavItems.map((item) => item.group))).map((group) => ({
    group,
    items: filteredMoreNavItems.filter((item) => item.group === group),
  }));
  const sidebarMoreGroups = sidebarMoreOpen
    ? moreNavGroups
    : [{ group: moreNavItems[0].group, items: moreNavItems.slice(0, 4) }];

  const activeProgram = React.useMemo(() => {
    const path = location.split("?")[0];
    const match = path.match(/^\/student-program\/(qudrat|tahsili)$/);
    if (match?.[1]) return match[1] as "qudrat" | "tahsili";
    if (path === "/folders") {
      const folderProgram = new URLSearchParams(location.split("?")[1] || "").get("program");
      if (folderProgram && ["qudrat", "tahsili"].includes(folderProgram)) {
        return folderProgram as "qudrat" | "tahsili";
      }
    }
    return undefined;
  }, [location]);

  const activeProgramLabel = {
    qudrat: "القدرات | Qudrat",
    tahsili: "التحصيلي | Tahsili",
  }[activeProgram || "qudrat"];
  const activePracticeLabel = "المحوسب";

  const programSubNavItems = activeProgram ? [
    { name: "التأسيس", href: `/student-program/${activeProgram}?section=foundation`, icon: BookOpenIcon },
    { name: activePracticeLabel, href: `/student-program/${activeProgram}?section=computer`, icon: Brain },
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
  const [isExamLayoutActive, setIsExamLayoutActive] = React.useState(false);

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

  const isInTestMode = React.useMemo(
    () => isTestModeLocation(location, {
      qiyas: qiyasExamActive,
      abilities: abilitiesExamActive,
      tahsili: tahsiliExamActive,
    }, isExamLayoutActive),
    [location, qiyasExamActive, abilitiesExamActive, tahsiliExamActive, isExamLayoutActive],
  );

  return (
    <StudentExamChromeContext.Provider value={{ isActive: isExamLayoutActive, setActive: setIsExamLayoutActive }}>
    <div className={cn(
      "qodratak-app-shell flex min-h-screen bg-background text-foreground",
      isInTestMode && "h-[100dvh] max-h-[100dvh] overflow-hidden"
    )}>
      {/* Sidebar - مخفي في وضع الاختبار */}
      {!isInTestMode && (
        <div className="hidden md:flex w-64 flex-col bg-white dark:bg-gray-900 border-l dark:border-gray-800" dir="rtl">

          {/* Logo */}
          <div className="p-4 border-b border-gray-100 dark:border-gray-800">
            <Link href="/" className="flex items-center gap-3">
              <BrandMark imageClassName="h-9 w-9" />
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

              <div id="student-more-navigation" className="mt-3 border-t border-gray-100 pt-3 dark:border-gray-800">
                <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400">المزيد من صفحاتك</p>

                {sidebarMoreOpen && (
                  <>
                    <div className="mb-3 rounded-xl border border-primary/15 bg-primary/5 p-2.5">
                      <p className="px-1 pb-2 text-[10px] font-black text-primary">اختر ما تحتاجه الآن</p>
                      <div className="grid grid-cols-2 gap-1.5">
                        {learnerGoalActions.map((action) => (
                          <Link
                            key={action.href}
                            href={action.href}
                            title={action.description}
                            data-testid={`link-learning-goal-${action.href.slice(1).replaceAll("/", "-")}`}
                            className="flex min-h-10 items-center gap-1.5 rounded-lg bg-white px-2 py-1.5 text-[10px] font-bold text-gray-700 transition hover:bg-primary/10 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-primary/20"
                          >
                            <action.icon className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
                            <span className="leading-4">{action.name}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                    <label className="relative mb-3 block">
                      <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
                      <input
                        type="search"
                        value={sidebarMoreSearch}
                        onChange={(event) => setSidebarMoreSearch(event.target.value)}
                        placeholder="ابحث عن صفحة أو أداة"
                        aria-label="ابحث في صفحات الطالب"
                        data-testid="input-student-more-search"
                        className="min-h-10 w-full rounded-xl border border-gray-200 bg-white py-2 pr-9 pl-3 text-xs text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-primary dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                      />
                    </label>
                  </>
                )}

                {sidebarMoreGroups.map((group) => (
                  <div key={group.group} className="mb-2">
                    {sidebarMoreOpen && (
                      <p className="px-3 pb-1 pt-2 text-[10px] font-bold text-gray-400">{group.group}</p>
                    )}
                    {group.items.map((item) => {
                      const itemPath = item.href.split("?")[0];
                      const currentPath = location.split("?")[0];
                      const isActive = currentPath === itemPath || currentPath.startsWith(`${itemPath}/`);
                      return (
                        <Link key={item.href} href={item.href}>
                          <div
                            title={item.description}
                            data-testid={`link-student-more-${itemPath.slice(1).replaceAll("/", "-")}`}
                            className={cn(
                              "flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                              isActive
                                ? "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400"
                                : "text-gray-500 hover:bg-gray-50 hover:text-gray-700 dark:text-gray-500 dark:hover:bg-gray-800 dark:hover:text-gray-300"
                            )}
                          >
                            <item.icon className="h-4 w-4 flex-shrink-0 text-gray-400" aria-hidden="true" />
                            <span>{item.name}</span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                ))}

                {sidebarMoreOpen && filteredMoreNavItems.length === 0 && (
                  <p data-testid="text-student-more-empty" className="rounded-xl px-3 py-4 text-xs text-gray-500 dark:text-gray-400">
                    لا توجد صفحة بهذا الاسم. جرّب كلمة أخرى.
                  </p>
                )}

                <button
                  type="button"
                  aria-expanded={sidebarMoreOpen}
                  aria-controls="student-more-navigation"
                  data-testid="button-toggle-student-more"
                  onClick={() => {
                    setSidebarMoreOpen((open) => !open);
                    setSidebarMoreSearch("");
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-gray-400 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <ChevronLeft className={cn("h-4 w-4 transition-transform", sidebarMoreOpen ? "rotate-90" : "-rotate-90")} aria-hidden="true" />
                  <span>{sidebarMoreOpen ? "إخفاء الصفحات" : "عرض كل الصفحات"}</span>
                </button>
              </div>
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

            <Link href="/account">
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
              id="student-more-drawer"
              className="fixed left-0 right-0 z-50 md:hidden rounded-t-3xl bg-white dark:bg-gray-900 shadow-2xl"
              style={{ bottom: 'calc(4rem + env(safe-area-inset-bottom, 0px))' }}
              dir="rtl"
              aria-label="كل صفحات الطالب"
            >
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 bg-gray-200 dark:bg-gray-700 rounded-full" />
              </div>
              <div
                className="px-5 pb-5 pt-2"
                style={{
                  maxHeight: 'calc(76vh - 4rem)',
                  overflowY: 'auto',
                  WebkitOverflowScrolling: 'touch',
                }}
              >
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-black text-gray-900 dark:text-white">كل صفحات الطالب</p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{filteredMoreNavItems.length} صفحة متاحة للتنقل</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowMoreMenu(false)}
                    data-testid="button-close-student-more"
                    className="rounded-lg px-3 py-2 text-xs font-bold text-gray-500 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                  >
                    إغلاق
                  </button>
                </div>

                <label className="relative mb-4 block">
                  <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
                  <input
                    type="search"
                    value={sidebarMoreSearch}
                    onChange={(event) => setSidebarMoreSearch(event.target.value)}
                    placeholder="ابحث عن درس أو اختبار أو صفحة"
                    aria-label="ابحث في صفحات الطالب"
                    data-testid="input-mobile-student-more-search"
                    className="min-h-11 w-full rounded-xl border border-gray-200 bg-gray-50 py-2 pr-10 pl-3 text-sm text-gray-800 outline-none placeholder:text-gray-400 focus:border-primary dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                  />
                </label>

                <section aria-label="أهداف تعلم سريعة" className="mb-5 rounded-2xl border border-primary/15 bg-primary/5 p-3">
                  <h2 className="mb-2 text-xs font-black text-primary">اختر ما تحتاجه الآن</h2>
                  <div className="grid grid-cols-2 gap-2">
                    {learnerGoalActions.map((action) => (
                      <Link
                        key={action.href}
                        href={action.href}
                        onClick={() => setShowMoreMenu(false)}
                        title={action.description}
                        data-testid={`link-mobile-learning-goal-${action.href.slice(1).replaceAll("/", "-")}`}
                        className="flex min-h-12 items-center gap-2 rounded-xl bg-white p-2.5 text-right text-xs font-black text-gray-800 shadow-sm transition hover:bg-primary/10 active:scale-[0.98] dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-primary/20"
                      >
                        <action.icon className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                        <span>{action.name}</span>
                      </Link>
                    ))}
                  </div>
                </section>

                {moreNavGroups.map((group) => (
                  <section key={group.group} aria-label={group.group} className="mb-5">
                    <h2 className="mb-2 text-xs font-black text-gray-500 dark:text-gray-400">{group.group}</h2>
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                      {group.items.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setShowMoreMenu(false)}
                          title={item.description}
                          aria-label={`${item.name}: ${item.description}`}
                          data-testid={`link-mobile-student-more-${item.href.split("?")[0].slice(1).replaceAll("/", "-")}`}
                          className="flex min-h-[5.25rem] flex-col items-center justify-center gap-1.5 rounded-xl border border-gray-100 bg-white px-1.5 py-2 text-center transition hover:border-primary/30 hover:bg-primary/5 active:scale-[0.98] dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-primary/10"
                        >
                          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <item.icon className="h-4 w-4" aria-hidden="true" />
                          </span>
                          <span className="line-clamp-2 text-[10px] font-bold leading-4 text-gray-700 dark:text-gray-200">{item.name}</span>
                        </Link>
                      ))}
                    </div>
                  </section>
                ))}

                {filteredMoreNavItems.length === 0 && (
                  <p data-testid="text-mobile-student-more-empty" className="rounded-xl bg-gray-50 p-4 text-center text-sm text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                    لا توجد صفحة بهذا الاسم. جرّب كلمة أخرى.
                  </p>
                )}
              </div>
            </div>
          )}

        </>
      )}

      {/* Main content */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {/* Header - مخفي في وضع الاختبار على الجوال */}
        {!isInTestMode && (
          <header className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 md:hidden">
          <div className="flex items-center justify-between px-3 py-2.5">
            <Link href="/" className="flex items-center gap-2 flex-shrink-0">
              <BrandMark imageClassName="h-8 w-8" />
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

               {/* تبديل الوضع الليلي/النهاري */}
               <ThemeToggle />

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
                href="/account"
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
        <main className={cn(
          "min-h-0 flex-1",
          isInTestMode ? "overflow-hidden" : "overflow-y-auto pb-16 md:pb-0"
        )}>
          <div key={location} className="qodratak-page-surface page-enter min-h-full">
            <ErrorBoundary>
              {!isInTestMode && layoutUser?.role === 'student' && <StudentJourneyNavigation />}
              {children}
            </ErrorBoundary>
            {/* Footer - مخفي في وضع الاختبار */}
            {!isInTestMode && <Footer />}
          </div>
        </main>

        {/* Bottom nav — ثابت في أسفل الصفحة ضمن تدفق الـ layout */}
        {!isInTestMode && (
          <div
            className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/98 md:hidden"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
          >
            <nav className="mx-auto flex h-16 w-full max-w-screen-sm items-center gap-1 px-2">
              {(activeProgram ? [
                { href: `/student-program/${activeProgram}?section=foundation`, icon: BookOpenIcon, label: "التأسيس", exact: false },
                { href: `/student-program/${activeProgram}?section=computer`, icon: Brain, label: "المحوسب", exact: false },
                { href: "/folders", icon: FolderIcon, label: "مجلداتي", exact: false },
                { href: "/", icon: HomeIcon, label: "المسارات", exact: true },
              ] : [
                { href: "/", icon: HomeIcon, label: "الرئيسية", exact: true },
                { href: "/student-program/qudrat", icon: Brain, label: "القدرات", exact: false },
                { href: "/student-program/tahsili", icon: GraduationCapIcon, label: "التحصيلي", exact: false },
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
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative flex flex-1 flex-col items-center justify-center gap-1 rounded-lg py-1.5 text-muted-foreground transition-colors duration-150 hover:bg-muted/60 hover:text-foreground",
                      active && "bg-primary/10 font-semibold text-primary"
                    )}
                  >
                    {active && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-primary rounded-full" />}
                    <item.icon className="h-5 w-5" />
                    <span className="text-[9px] font-medium leading-none text-center">{item.label}</span>
                  </Link>
                );
              })}

              <button
                type="button"
                aria-label="فتح كل صفحات الطالب"
                aria-expanded={showMoreMenu}
                aria-controls="student-more-drawer"
                data-testid="button-open-student-more"
                onClick={() => {
                  setSidebarMoreSearch("");
                  setShowMoreMenu((open) => !open);
                }}
                className={cn(
                  "relative flex flex-1 flex-col items-center justify-center gap-1 rounded-lg py-1.5 text-muted-foreground transition-colors duration-150 hover:bg-muted/60 hover:text-foreground",
                  showMoreMenu && "bg-primary/10 font-semibold text-primary"
                )}
              >
                <MoreHorizontal className="h-5 w-5" aria-hidden="true" />
                <span className="text-[9px] font-medium leading-none text-center">المزيد</span>
              </button>

            </nav>
          </div>
        )}

      </div>
    </div>
    </StudentExamChromeContext.Provider>
  );
}

function TestModeBadgeController() {
  const [location] = useLocation();
  const [activeExams, setActiveExams] = React.useState(readActiveExamFlags);

  React.useEffect(() => {
    const syncActiveExams = () => setActiveExams(readActiveExamFlags());
    syncActiveExams();
    window.addEventListener('storage', syncActiveExams);
    return () => window.removeEventListener('storage', syncActiveExams);
  }, [location]);

  const isInTestMode = isTestModeLocation(location, activeExams);

  React.useLayoutEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('qodratak-test-mode', isInTestMode);
    return () => root.classList.remove('qodratak-test-mode');
  }, [isInTestMode]);

  return null;
}

function Router({ splashDone }: { splashDone: boolean }) {
  const { user: serverUser, isLoading: isUserLoading } = useUser();

  return (
    <>
      <TestModeBadgeController />
      {splashDone && <RotateDevicePrompt />}
       <RouteSEO isAuthenticated={Boolean(serverUser)} isLoading={isUserLoading} />
      <AuthenticatedRouteBoundary>
      <StudentAvailabilityBoundary>
      <PageTransition>
      <Switch>
      <Route path="/payment/geidea/return">
        <GeideaPaymentReturnPage />
      </Route>
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
          if (serverUser?.role === 'institution_admin') return <Redirect to="/institution" />;
          if (serverUser?.role === 'teacher') return <Redirect to="/teacher" />;
          if (serverUser?.role === 'system_admin' || serverUser?.role === 'support_admin') {
            return <Redirect to="/admin/dashboard" />;
          }
          return serverUser?.role === 'student'
            ? <StudentShell><DashboardPage /></StudentShell>
            : <LandingPage enableStoreBadge />;
        }}
      </Route>

      <Route path="/foundation">
        {() => <StudentShell><ProtectedRoute><FoundationPage /></ProtectedRoute></StudentShell>}
      </Route>
      <Route path="/preparation-course/practice/:taskId">
        {(params) => <StudentShell><ProtectedRoute><CoursePracticePage taskId={params.taskId} /></ProtectedRoute></StudentShell>}
      </Route>
      <Route path="/preparation-course">
        {() => <StudentShell><ProtectedRoute><PreparationCoursePage /></ProtectedRoute></StudentShell>}
      </Route>
      <Route path="/student/foundation-book/quantitative">
        {() => <StudentShell><ProtectedRoute><QuantitativeBookOverviewPage /></ProtectedRoute></StudentShell>}
      </Route>
      <Route path="/student/foundation-book/quantitative/:lessonId">
        {(params) => <StudentShell><ProtectedRoute><QuantitativeBookLessonPage lessonId={params.lessonId} /></ProtectedRoute></StudentShell>}
      </Route>
      <Route path="/foundation/coverage-test">
        {() => <StudentShell><ProtectedRoute><FoundationCoverageTestPage /></ProtectedRoute></StudentShell>}
      </Route>
      <Route path="/foundation/computer-bank-test/:contentId">
        {(params) => (
          <StudentShell>
            <ProtectedRoute>
              <FoundationBankTestPage contentId={params.contentId} />
            </ProtectedRoute>
          </StudentShell>
        )}
      </Route>
      <Route path="/foundation/content/:contentId">
        {() => <StudentShell><ProtectedRoute><FoundationReaderPage /></ProtectedRoute></StudentShell>}
      </Route>
      <Route path="/learning/today">
        {() => <StudentShell><ProtectedRoute><LearningTodayPage /></ProtectedRoute></StudentShell>}
      </Route>

      <Route path="/computerized">
        {() => <StudentShell><ProtectedRoute><ComputerizedPage /></ProtectedRoute></StudentShell>}
      </Route>

      <Route path="/account">
        {() => <StudentShell><ProtectedRoute><AccountPage /></ProtectedRoute></StudentShell>}
      </Route>

      <Route path="/student-program/:program">
        {() => <StudentShell><ProtectedRoute><StudentProgramPage /></ProtectedRoute></StudentShell>}
      </Route>

       <Route path="/tahsili">
         {() => <StudentShell><ProtectedRoute requiresPremium={true}><TahsiliOverviewPage /></ProtectedRoute></StudentShell>}
      </Route>
      <Route path="/tahsili-dashboard">
         {() => <StudentShell><ProtectedRoute requiresPremium={true}><Redirect to="/student-program/tahsili" /></ProtectedRoute></StudentShell>}
      </Route>
      <Route path="/tahsili/exams">
         {() => <StudentShell><ProtectedRoute requiresPremium={true}><Redirect to="/tahsilik/tests" /></ProtectedRoute></StudentShell>}
      </Route>

      {/* منصة تحصيلك المتكاملة */}
      <Route path="/tahsilik">
        {() => <StudentShell><ProtectedRoute requiresPremium={true}><Redirect to="/tahsili" /></ProtectedRoute></StudentShell>}
      </Route>
      <Route path="/tahsilik/mobile-dashboard">
         {() => <StudentShell><ProtectedRoute requiresPremium={true}><Redirect to="/student-program/tahsili" /></ProtectedRoute></StudentShell>}
      </Route>
      <Route path="/tahsilik/study">
         {() => <StudentShell><ProtectedRoute requiresPremium={true}><TahsiliSourceLibrary /></ProtectedRoute></StudentShell>}
      </Route>
      <Route path="/tahsilik/tests">
        {() => <StudentShell><ProtectedRoute requiresPremium={true}><TahsilikTestsHub /></ProtectedRoute></StudentShell>}
      </Route>
      <Route path="/tahsilik/qualification">
         {() => <StudentShell><ProtectedRoute requiresPremium={true}><Redirect to="/tahsilik/tests" /></ProtectedRoute></StudentShell>}
      </Route>
      <Route path="/tahsilik/question-bank">
        {() => <StudentShell><ProtectedRoute requiresPremium={true}><TahsiliQuestionBank /></ProtectedRoute></StudentShell>}
      </Route>
      <Route path="/tahsilik/custom-test">
         {() => <StudentShell><ProtectedRoute requiresPremium={true}><Redirect to="/tahsilik/tests" /></ProtectedRoute></StudentShell>}
      </Route>
      <Route path="/tahsilik/comprehensive-test">
         {() => <StudentShell><ProtectedRoute requiresPremium={true}><Redirect to="/tahsilik/tests" /></ProtectedRoute></StudentShell>}
      </Route>
      <Route path="/tahsilik/tests/subject">
        {() => <StudentShell><ProtectedRoute requiresPremium={true}><TahsilikSubjectTest /></ProtectedRoute></StudentShell>}
      </Route>
      <Route path="/tahsilik/test-runner/subject">
        {() => <StudentShell><ProtectedRoute requiresPremium={true}><TahsilikSubjectTestRunner /></ProtectedRoute></StudentShell>}
      </Route>
       <Route path="/tahsilik/test-runner/custom">
         {() => <StudentShell><ProtectedRoute requiresPremium={true}><Redirect to="/tahsilik/tests" /></ProtectedRoute></StudentShell>}
       </Route>
       <Route path="/tahsilik/test-runner/comprehensive">
         {() => <StudentShell><ProtectedRoute requiresPremium={true}><Redirect to="/tahsilik/tests" /></ProtectedRoute></StudentShell>}
       </Route>
      <Route path="/tahsilik/tests-hub">
        {() => <StudentShell><ProtectedRoute requiresPremium={true}><Redirect to="/tahsilik/tests" /></ProtectedRoute></StudentShell>}
      </Route>

      {/* صفحات متاحة للحسابات المجانية */}
      <Route path="/learn">
        {() => <StudentShell><LearningHubPage /></StudentShell>}
      </Route>

      <Route path="/teacher">
        {() => {
          if (isUserLoading) {
            return (
              <div className="flex min-h-screen items-center justify-center bg-slate-50" dir="rtl">
                <div className="text-sm font-bold text-slate-500">جاري التحقق من صلاحية المعلم...</div>
              </div>
            );
          }
          if (!serverUser) return <Redirect to="/login?return=%2Fteacher" />;
          if (serverUser.role !== 'teacher') return <Redirect to="/" />;
          return <TeacherHomePage />;
        }}
      </Route>

      <Route path="/qiyas-hub">
        {() => <StudentShell><QiyasHubPage /></StudentShell>}
      </Route>

      <Route path="/qiyas">
        {() => <StudentShell><QiyasExamPage /></StudentShell>}
      </Route>
      {/* Legacy mock-exam links use these explicit exam paths. Keep them as
          aliases so starting a mock from the hub never lands on 404. */}
      <Route path="/qiyas-exam">
        {() => <StudentShell><QiyasExamPage /></StudentShell>}
      </Route>

      <Route path="/time-management">
        {() => <StudentShell><NewTimeManagementPage /></StudentShell>}
      </Route>
      <Route path="/install">
        {() => <StudentShell><InstallPage /></StudentShell>}
      </Route>
      <Route path="/how-it-works">
        <HowItWorksPage />
      </Route>
      <Route path="/usage-guide">
        {() => <StudentShell><UsageGuidePage /></StudentShell>}
      </Route>
      <Route path="/guide">
        {() => <StudentShell><FooterGuidePage /></StudentShell>}
      </Route>
      <Route path="/courses">
        {() => <StudentShell><ProtectedRoute requiresPremium={true}><CoursesPage /></ProtectedRoute></StudentShell>}
      </Route>

      <Route path="/paper-exam">
        {() => <StudentShell><ProtectedRoute requiresPremium={true}><PaperExamPage /></ProtectedRoute></StudentShell>}
      </Route>

      <Route path="/paper-exam-results">
        {() => <StudentShell><ProtectedRoute requiresPremium={true}><PaperExamResultsPage /></ProtectedRoute></StudentShell>}
      </Route>

      <Route path="/paper-models">
        {() => <StudentShell><ProtectedRoute requiresPremium={true}><PaperModelsPage /></ProtectedRoute></StudentShell>}
      </Route>

      <Route path="/paper-models-management">
        {() => <StudentShell><ProtectedRoute requiresPremium={true}><PaperModelsManagementPage /></ProtectedRoute></StudentShell>}
      </Route>

      <Route path="/bubble-sheet-scan">
        {() => <StudentShell><ProtectedRoute requiresPremium={true}><BubbleSheetScanPage /></ProtectedRoute></StudentShell>}
      </Route>

      {/* الاختبارات المجانية - متاحة للحسابات المسجلة */}
      <Route path="/free-verbal-test">
        {() => <StudentShell><ProtectedRoute><DailyExamPage category="verbal" /></ProtectedRoute></StudentShell>}
      </Route>
      <Route path="/free-quantitative-test">
        {() => <StudentShell><ProtectedRoute><DailyExamPage category="quantitative" /></ProtectedRoute></StudentShell>}
      </Route>

      {/* صفحة تتبع التقدم */}
      <Route path="/skill-progress">
        {() => <StudentShell><SkillProgressPage /></StudentShell>}
      </Route>

      {/* صفحات اختبارات اللفظي والكمي - تتطلب تسجيل الدخول (تحتوي على اختبارات مجانية ومميزة) */}
      <Route path="/verbal-tests">
        {() => <StudentShell><VerbalTests /></StudentShell>}
      </Route>
      <Route path="/verbal-test-runner">
        {() => <StudentShell><ProtectedRoute requiresPremium={true}><VerbalTestRunner /></ProtectedRoute></StudentShell>}
      </Route>
      <Route path="/quantitative-tests">
        {() => <StudentShell><QuantitativeTests /></StudentShell>}
      </Route>
      <Route path="/quantitative-test-runner">
        {() => <StudentShell><ProtectedRoute requiresPremium={true}><QuantitativeTestRunner /></ProtectedRoute></StudentShell>}
      </Route>
      <Route path="/advanced-verbal-test">
        {() => <StudentShell><ProtectedRoute requiresPremium={true}><Redirect to="/qiyas?examId=2" /></ProtectedRoute></StudentShell>}
      </Route>
      <Route path="/advanced-quantitative-test">
        {() => <StudentShell><ProtectedRoute requiresPremium={true}><Redirect to="/qiyas?examId=3" /></ProtectedRoute></StudentShell>}
      </Route>

      <Route path="/custom-exam">
        {() => <StudentShell><ProtectedRoute requiresPremium={true}><CustomExamPage /></ProtectedRoute></StudentShell>}
      </Route>
      <Route path="/abilities">
        {() => <StudentShell><ProtectedRoute requiresPremium={true}><AbilitiesTestPage /></ProtectedRoute></StudentShell>}
      </Route>
      <Route path="/abilities-test/:type">
        {() => <StudentShell><ProtectedRoute requiresPremium={true}><AbilitiesTestPage /></ProtectedRoute></StudentShell>}
      </Route>
      <Route path="/library">
        {() => <StudentShell><ProtectedRoute requiresPremium={true}><LibraryPage /></ProtectedRoute></StudentShell>}
      </Route>
      <Route path="/books">
        {() => <StudentShell><ProtectedRoute requiresPremium={true}><BooksPage /></ProtectedRoute></StudentShell>}
      </Route>
      <Route path="/folders">
        {() => <StudentShell><ProtectedRoute requiresPremium={true}><MyFolders /></ProtectedRoute></StudentShell>}
      </Route>
      <Route path="/support">
        {() => <StudentShell><FAQPage /></StudentShell>}
      </Route>
      <Route path="/challenges">
        {() => <StudentShell><ProtectedRoute requiresPremium={true}><ChallengePage /></ProtectedRoute></StudentShell>}
      </Route>
      <Route path="/folders">
        {() => <StudentShell><ProtectedRoute requiresPremium={true}><MyFolders /></ProtectedRoute></StudentShell>}
      </Route>
      <Route path="/folders/:id">
        {() => <StudentShell><ProtectedRoute requiresPremium={true}><FolderView /></ProtectedRoute></StudentShell>}
      </Route>
      <Route path="/test-me">
        {() => <StudentShell><ProtectedRoute requiresPremium={true}><TestMe /></ProtectedRoute></StudentShell>}
      </Route>
      <Route path="/folder-test">
        {() => <StudentShell><ProtectedRoute requiresPremium={true}><FolderTest /></ProtectedRoute></StudentShell>}
      </Route>
      <Route path="/records">
        {() => <StudentShell><ProtectedRoute><ExamRecordsPage /></ProtectedRoute></StudentShell>}
      </Route>
      <Route path="/mock-exams">
        {() => <StudentShell><ProtectedRoute requiresPremium={true}><MockExamPage /></ProtectedRoute></StudentShell>}
      </Route>
      <Route path="/flashcards">
        {() => <StudentPageGuide location="/flashcards"><FlashcardsPage /></StudentPageGuide>}
      </Route>
      <Route path="/performance-report">
        {() => <StudentPageGuide location="/performance-report"><PerformanceReportPage /></StudentPageGuide>}
      </Route>
      <Route path="/adaptive-test">
        {() => <AdaptiveTestPage />}
      </Route>
      <Route path="/error-analysis">
        {() => <StudentPageGuide location="/error-analysis"><ErrorAnalysisPage /></StudentPageGuide>}
      </Route>
      <Route path="/study-rooms/:code">
        {() => <StudentPageGuide location="/study-rooms/:code"><StudyRoomLobbyPage /></StudentPageGuide>}
      </Route>
      <Route path="/study-rooms">
        {() => <StudentShell><StudyRoomsPage /></StudentShell>}
      </Route>
      <Route path="/notification-settings">
        {() => <StudentShell><NotificationSettingsPage /></StudentShell>}
      </Route>
      <Route path="/notifications">
        {() => <StudentShell><NotificationsPage /></StudentShell>}
      </Route>
      <Route path="/pre-exam-day">
        {() => <StudentPageGuide location="/pre-exam-day"><PreExamDayPage /></StudentPageGuide>}
      </Route>
      <Route path="/ai-tutor">
        {() => <StudentPageGuide location="/ai-tutor"><AiTutorPage /></StudentPageGuide>}
      </Route>
      <Route path="/ai-hub">
        {() => <StudentShell><ProtectedRoute><AiHub /></ProtectedRoute></StudentShell>}
      </Route>
      <Route path="/ai-hub/score-prediction">
        {() => <StudentShell><ProtectedRoute><AiScorePrediction /></ProtectedRoute></StudentShell>}
      </Route>
      <Route path="/ai-hub/pattern-analysis">
        {() => <StudentShell><ProtectedRoute><AiPatternAnalysis /></ProtectedRoute></StudentShell>}
      </Route>
      <Route path="/ai-hub/daily-plan">
        {() => <StudentShell><ProtectedRoute><AiDailyPlan /></ProtectedRoute></StudentShell>}
      </Route>
      <Route path="/strategy-library">
        {() => <StudentShell><StrategyLibraryPage /></StudentShell>}
      </Route>
      <Route path="/mistake-challenge">
        {() => <StudentShell><EnhancedMistakeChallenge /></StudentShell>}
      </Route>
      <Route path="/support">
        {() => <StudentShell><FAQPage /></StudentShell>}
      </Route>
      <Route path="/enhanced-mistake-challenge">
        {() => <StudentShell><EnhancedMistakeChallenge /></StudentShell>}
      </Route>

      {/* Question Bank Routes */}
      <Route path="/question-bank">
        {() => <StudentShell><QuestionBankPage /></StudentShell>}
      </Route>
      <Route path="/question-bank/standard/:testNumber">
        {() => <StudentShell><StandardSectionTestRunner /></StudentShell>}
      </Route>
      <Route path="/verbal-lesson-quiz/:type/:testNumber">
        {() => <StudentShell><ProtectedRoute><QuestionBankTestRunner /></ProtectedRoute></StudentShell>}
      </Route>
      <Route path="/question-bank/:type/:testNumber">
        {() => <StudentShell><SectionedTestRunner /></StudentShell>}
      </Route>
      <Route path="/standard-test">
        {() => <Redirect to="/qiyas?examId=1" />}
      </Route>
      <Route path="/profile">
        {() => <Redirect to="/account" />}
      </Route>
      <Route path="/security-settings">
        {() => <StudentPageGuide location="/security-settings"><SecuritySettingsPage /></StudentPageGuide>}
      </Route>
      <Route path="/book-exam">
        {() => <StudentShell><BookExamPage /></StudentShell>}
      </Route>
      <Route path="/scheduled-exam/:id">
        {() => <ScheduledExamRunner />}
      </Route>
      <Route path="/analytics">
        {() => <StudentShell><StudentAnalyticsPage /></StudentShell>}
      </Route>
      <Route path="/account-type">
        {() => <AccountTypeSelection />}
      </Route>
      <Route path="/institution">
        {() => <InstitutionPortalPage />}
      </Route>
      <Route path="/signup">
        {() => <LandingPage initialModal="signup" />}
      </Route>
      <Route path="/login">
        {() => <LandingPage initialModal="login" />}
      </Route>
      <Route path="/forgot-password">
        {() => <StudentShell><ForgotPasswordPage /></StudentShell>}
      </Route>
      <Route path="/reset-password">
        {() => <StudentShell><ResetPasswordPage /></StudentShell>}
      </Route>
      <Route path="/guest-signup">
        {() => <StudentShell><GuestSignupPage /></StudentShell>}
      </Route>
      <Route path="/free-signup">
        {() => <StudentShell><FreeAccountSignup /></StudentShell>}
      </Route>
      <Route path="/wallet">
        {() => <StudentShell><WalletPage /></StudentShell>}
      </Route>
      <Route path="/institution-contract" component={InstitutionContractPortalPage} />
      <Route path="/invite/:token">
        {(params) => <InvitePage />}
      </Route>
      <Route path="/seasonal-exams">
        {() => <StudentShell><SeasonalExamsPage /></StudentShell>}
      </Route>
      <Route path="/subscription">
        {() => <Redirect to="/" />}
      </Route>
      <Route path="/enhanced-subscription">
        {() => <Redirect to="/" />}
      </Route>
      <Route path="/test-results">
        {() => <StudentShell><TestResultsPage /></StudentShell>}
      </Route>
      <Route path="/exam-review">
        {() => <StudentPageGuide location="/exam-review"><ExamReviewPage /></StudentPageGuide>}
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
      <Route path="/admin/platform-reviews">
        {() => <AdminDashboard initialTab="platform-reviews" />}
      </Route>
      <Route path="/admin/users">
        {() => <AdminDashboard initialTab="users" />}
      </Route>
      <Route path="/admin/accounts">
        {() => <AdminDashboard initialTab="accounts" />}
      </Route>
      <Route path="/admin/teachers">
        {() => <AdminDashboard initialTab="teachers" />}
      </Route>
      <Route path="/admin/institutions">
        {() => <AdminDashboard initialTab="active-institutions" />}
      </Route>
      <Route path="/admin/questions">
        {() => <AdminDashboard initialTab="questions" />}
      </Route>
      <Route path="/admin/chat">
        {() => <ChatPage />}
      </Route>

      <Route path="/faq">
        {() => <StudentShell><FAQPage /></StudentShell>}
      </Route>
      <Route path="/pricing">
        {() => <Redirect to="/#plans" />}
      </Route>
      <Route path="/terms">
        {() => <StudentShell><FooterDocumentsPage documentKey="terms" /></StudentShell>}
      </Route>
      <Route path="/privacy">
        {() => <StudentShell><FooterDocumentsPage documentKey="privacy" /></StudentShell>}
      </Route>
      <Route path="/refund-policy">
        {() => <StudentShell><FooterDocumentsPage documentKey="refund" /></StudentShell>}
      </Route>
      <Route path="/platform-guide">
        {() => <StudentShell><PlatformGuidePage /></StudentShell>}
      </Route>
      {/* Fallback to 404 */}
      <Route>
        {() => <StudentShell><NotFound /></StudentShell>}
      </Route>
      </Switch>
      </PageTransition>
      </StudentAvailabilityBoundary>
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
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem={true}>
        <TooltipProvider>
          <Toaster />
          <React.Suspense fallback={<RouteLoadingFallback />}>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
              <Router splashDone={splashDone} />
            </WouterRouter>
          </React.Suspense>

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