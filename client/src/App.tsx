import React from 'react';
import { Switch, Route, Link, useLocation } from "wouter";
import { RotateDevicePrompt } from "@/components/RotateDevicePrompt";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import ExamRecordsPage from "@/pages/ExamRecordsPage";
import { ThemeProvider } from "next-themes";
import { Separator } from "@/components/ui/separator";
import { 
  BookOpenIcon, 
  BrainCircuitIcon, 
  ClipboardIcon,
  FolderIcon,
  GamepadIcon,
  GraduationCapIcon,
  HelpCircleIcon, 
  HomeIcon, 
  UserIcon,
  CrownIcon,
  DiamondIcon,
  Clock,
  Download
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import AskQuestionPage from "@/pages/AskQuestionPage";
import ProfilePage from "@/pages/ProfilePage";
import TestResultsPage from './pages/TestResultsPage';
import AbilitiesTestPage from "@/pages/AbilitiesTestPage";
import QiyasExamPage from "@/pages/QiyasExamPage";
import CustomExamPage from "@/pages/CustomExamPage";
import MockExamPage from "@/pages/MockExamPage";
import LibraryPage from "@/pages/LibraryPage";
import BooksPage from "@/pages/BooksPage";
import FoldersPage from "@/pages/FoldersPage";
import ChallengePage from "@/pages/ChallengePage";
import NewTimeManagementPage from "@/pages/NewTimeManagementPage";
import InstallPage from "@/pages/InstallPage";
import { SubscriptionPlans } from "@/components/SubscriptionPlans";

function MainLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [userName, setUserName] = useState<string | null>(null);
  const [userSubscription, setUserSubscription] = useState<string>('free');

  useEffect(() => {
    const updateUserData = () => {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          setUserName(user.username || user.name);
          setUserSubscription(user.subscription?.type || 'free');
        } catch (e) {
          console.error("Error parsing stored user:", e);
          setUserName(null);
          setUserSubscription('free');
        }
      } else {
        setUserName(null);
        setUserSubscription('free');
      }
    };

    // تحديث البيانات عند تحميل الصفحة
    updateUserData();

    // الاستماع لتغييرات تسجيل الدخول
    const handleUserLogin = (event: any) => {
      setUserName(event.detail?.username || event.detail?.name);
      setUserSubscription(event.detail?.subscription?.type || 'free');
    };

    const handleStorageChange = () => {
      updateUserData();
    };

    window.addEventListener('userLoggedIn', handleUserLogin);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('userLoggedIn', handleUserLogin);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const navItems = [
    { name: "الرئيسية", href: "/", icon: HomeIcon },
    { name: "اختبارات قياس", href: "/qiyas", icon: GraduationCapIcon },
    { name: "اختبر قدراتك", href: "/abilities", icon: BrainCircuitIcon },
    { name: "التحديات", href: "/challenges", icon: GamepadIcon },
    { name: "اسأل سؤال", href: "/ask", icon: HelpCircleIcon },
    { name: "المكتبة", href: "/library", icon: BookOpenIcon },
    { name: "مجلداتي", href: "/folders", icon: FolderIcon },
    { name: "سجل الاختبارات", href: "/records", icon: ClipboardIcon },
    { name: "كتبي", href: "/books", icon: BookOpenIcon },
    { name: "وقتي", href: "/time-management", icon: Clock },
    { name: "حمّل التطبيق", href: "/install", icon: Download },
  ];


  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Sidebar */}
      <div className="hidden md:flex w-64 flex-col bg-white dark:bg-gray-800 border-r dark:border-gray-700">
        <div className="p-4">
          <h2 className="text-2xl font-bold text-primary">منصة قدراتك</h2>
        </div>
        <Separator />
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link 
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium",
                    location === item.href 
                      ? "bg-primary text-primary-foreground" 
                      : "hover:bg-muted/50"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <Separator />
        <div className="p-4">
          <Link 
            href="/profile"
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-muted/50"
          >
            {userName ? (
              <>
                <div className="relative h-8 w-8 rounded-full overflow-hidden bg-primary/10">
                  <img 
                    src={`https://api.dicebear.com/7.x/avataaars-neutral/svg?seed=${userName}`} 
                    alt="صورة المستخدم" 
                    className="w-full h-full object-cover"
                  />
                  {(userSubscription === 'Pro' || userSubscription === 'Pro Life' || userSubscription === 'Pro Live') && (
                    <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 flex items-center justify-center">
                      {userSubscription === 'Pro Life' ? (
                        <DiamondIcon className="h-2.5 w-2.5 text-white" />
                      ) : (
                        <CrownIcon className="h-2.5 w-2.5 text-white" />
                      )}
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium">{userName}</span>
                  {(userSubscription === 'Pro' || userSubscription === 'Pro Life' || userSubscription === 'Pro Live') && (
                    <span className="text-xs text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                      {userSubscription === 'Pro Life' ? (
                        <><DiamondIcon className="h-3 w-3" /> Pro Life</>
                      ) : (
                        <><CrownIcon className="h-3 w-3" /> Pro</>
                      )}
                    </span>
                  )}
                </div>
              </>
            ) : (
              <>
                <UserIcon className="h-5 w-5" />
                <span>تسجيل الدخول</span>
              </>
            )}
          </Link>
        </div>
      </div>

      {/* Mobile navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 border-t dark:border-gray-700 md:hidden">
        <nav className="relative overflow-x-auto scrollbar-hide responsive-touch">
          <div className="flex items-center h-16 px-2">
            {navItems.map((item) => (
              <Link 
                key={item.href} 
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center p-3 rounded-lg min-w-[4.5rem] mx-1 touch-target button-touch tap-highlight-none",
                  location === item.href 
                    ? "text-primary bg-primary/10" 
                    : "text-muted-foreground hover:bg-muted/50"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span className="text-xs mt-1 text-center leading-tight">{item.name}</span>
              </Link>
            ))}
          </div>
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 md:hidden">
          <div className="flex items-center justify-between p-4">
            <h1 className="text-xl font-bold text-primary">منصة قدراتك</h1>
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
                  {(userSubscription === 'Pro' || userSubscription === 'Pro Life' || userSubscription === 'Pro Live') && (
                    <div className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 flex items-center justify-center">
                      {userSubscription === 'Pro Life' ? (
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
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
          {children}
        </main>
              {/* Tawk.to Widget */}
      <script dangerouslySetInnerHTML={{
        __html: `
          var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();
          (function(){
          var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
          s1.async=true;
          s1.src='https://embed.tawk.to/6848549398d0591910f17c9a/1itd8ko6u';
          s1.charset='UTF-8';
          s1.setAttribute('crossorigin','*');
          s0.parentNode.insertBefore(s1,s0);
          })();
        `,
      }} />
      </div>
    </div>
  );
}

function Router({ splashDone }: { splashDone: boolean }) {
  const [user, setUser] = React.useState(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });

  React.useEffect(() => {
    const handleStorageChange = () => {
      const storedUser = localStorage.getItem("user");
      setUser(storedUser ? JSON.parse(storedUser) : null);
    };

    const handleUserLogin = (event: any) => {
      setUser(event.detail);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('userLoggedIn', handleUserLogin);

    return () => {
      window.removeEventListener('storage', handleUserLogin);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const isPremium = user?.subscription?.type !== 'free' && (user?.subscription?.type === 'Pro' || user?.subscription?.type === 'Pro Life' || user?.subscription?.type === 'Pro Live');

  const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    if (!user) {
      return <MainLayout><ProfilePage /></MainLayout>;
    }
    return <>{children}</>;
  };

  const RestrictedRoute = ({ children }: { children: React.ReactNode }) => {
    if (!isPremium) {
      return <MainLayout><div className="container py-8 text-center">
        <h2 className="text-2xl font-bold mb-4">هذه الميزة متاحة للمشتركين فقط</h2>
        <p className="text-muted-foreground">يرجى الاشتراك للوصول إلى جميع الميزات</p>
      </div></MainLayout>;
    }
    return <>{children}</>;
  };

  // If not logged in, only show login page
  if (!user && window.location.pathname !== '/profile') {
    return <MainLayout><ProfilePage /></MainLayout>;
  }

  return (
    <>
      {splashDone && <RotateDevicePrompt />}
      <Switch>
      {/* Main pages */}
      <Route path="/">
        {() => <ProtectedRoute><MainLayout><Home /></MainLayout></ProtectedRoute>}
      </Route>
      <Route path="/qiyas">
        {() => <ProtectedRoute><MainLayout><QiyasExamPage /></MainLayout></ProtectedRoute>}
      </Route>
      <Route path="/custom-exam">
        {() => <ProtectedRoute><RestrictedRoute><MainLayout><CustomExamPage /></MainLayout></RestrictedRoute></ProtectedRoute>}
      </Route>
      <Route path="/abilities">
        {() => <ProtectedRoute><RestrictedRoute><MainLayout><AbilitiesTestPage /></MainLayout></RestrictedRoute></ProtectedRoute>}
      </Route>
      <Route path="/ask">
        {() => <ProtectedRoute><MainLayout>
          {isPremium ? <AskQuestionPage /> : <SubscriptionPlans />}
        </MainLayout></ProtectedRoute>}
      </Route>
      <Route path="/library">
        {() => <ProtectedRoute><MainLayout>
          {isPremium ? <LibraryPage /> : <SubscriptionPlans />}
        </MainLayout></ProtectedRoute>}
      </Route>
      <Route path="/books">
        {() => <ProtectedRoute><MainLayout>
          {isPremium ? <BooksPage /> : <SubscriptionPlans />}
        </MainLayout></ProtectedRoute>}
      </Route>
      <Route path="/profile">
        {() => <MainLayout><ProfilePage /></MainLayout>}
      </Route>
      <Route path="/test-results">
        {() => <MainLayout><TestResultsPage /></MainLayout>}
      </Route>
      <Route path="/folders">
        {() => <ProtectedRoute><MainLayout>
          {isPremium ? <FoldersPage /> : <SubscriptionPlans />}
        </MainLayout></ProtectedRoute>}
      </Route>
      <Route path="/time-management">
        {() => <ProtectedRoute><MainLayout><NewTimeManagementPage /></MainLayout></ProtectedRoute>}
      </Route>
      <Route path="/install">
        {() => <MainLayout><InstallPage /></MainLayout>}
      </Route>
      <Route path="/challenges">
        {() => <ProtectedRoute><MainLayout>
          {isPremium ? <ChallengePage /> : <SubscriptionPlans />}
        </MainLayout></ProtectedRoute>}
      </Route>
      <Route path="/records">
        {() => <ProtectedRoute><MainLayout>
          {isPremium ? <ExamRecordsPage /> : <SubscriptionPlans />}
        </MainLayout></ProtectedRoute>}
      </Route>
      <Route path="/mock-exams">
        {() => <ProtectedRoute><RestrictedRoute><MainLayout><MockExamPage /></MainLayout></RestrictedRoute></ProtectedRoute>}
      </Route>
      {/* Fallback to 404 */}
      <Route>
        {() => <MainLayout><NotFound /></MainLayout>}
      </Route>
    </Switch>
    </>
  );
}

function App() {
  const [showSplash, setShowSplash] = React.useState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
      setSplashDone(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const [splashDone, setSplashDone] = React.useState(false);

  if (showSplash) {
    return (
      <div className="h-screen w-screen relative overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950">
        {/* خلفية متحركة فاخرة */}
        <div className="absolute inset-0">
          {/* تأثير الشفق القطبي */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/30 via-purple-900/20 to-indigo-900/30 animate-pulse"></div>

          {/* جسيمات ضوئية متحركة */}
          <div className="absolute top-10 left-10 w-2 h-2 bg-blue-400 rounded-full animate-ping opacity-60"></div>
          <div className="absolute top-20 right-20 w-1 h-1 bg-purple-400 rounded-full animate-pulse delay-1000 opacity-80"></div>
          <div className="absolute bottom-20 left-20 w-3 h-3 bg-indigo-400 rounded-full animate-bounce delay-500 opacity-70"></div>
          <div className="absolute bottom-10 right-10 w-2 h-2 bg-cyan-400 rounded-full animate-ping delay-2000 opacity-50"></div>
          <div className="absolute top-1/3 left-1/4 w-1 h-1 bg-pink-400 rounded-full animate-pulse delay-1500 opacity-90"></div>
          <div className="absolute top-2/3 right-1/3 w-2 h-2 bg-violet-400 rounded-full animate-bounce delay-700 opacity-60"></div>

          {/* تأثير الشبكة المضيئة */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_50%_200px,rgba(59,130,246,0.1),transparent)] animate-pulse"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_600px_at_80%_80%,rgba(168,85,247,0.08),transparent)] animate-pulse delay-1000"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_400px_at_20%_60%,rgba(236,72,153,0.06),transparent)] animate-pulse delay-2000"></div>
        </div>

        {/* المحتوى الرئيسي */}
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center space-y-12">
          {/* الأيقونة الفخمة مع تأثيرات */}
          <div className="relative">
            {/* هالة ضوئية خارجية */}
            <div className="absolute inset-0 w-40 h-40 bg-gradient-to-r from-blue-500/30 via-purple-500/30 to-pink-500/30 rounded-full blur-xl animate-spin-slow"></div>
            <div className="absolute inset-2 w-36 h-36 bg-gradient-to-r from-cyan-400/20 via-blue-400/20 to-indigo-400/20 rounded-full blur-lg animate-spin-reverse"></div>

            {/* الأيقونة المركزية */}
            <div className="relative w-32 h-32 mx-auto bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-500/50 border border-blue-400/30 backdrop-blur-sm">
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-3xl"></div>
              <div className="text-5xl animate-pulse">🧠</div>

              {/* تأثير البريق */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-3xl animate-shimmer"></div>
            </div>

            {/* جسيمات دائرية حول الأيقونة */}
            <div className="absolute -top-2 -right-2 w-4 h-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-bounce opacity-80"></div>
            <div className="absolute -bottom-2 -left-2 w-3 h-3 bg-gradient-to-r from-pink-400 to-rose-500 rounded-full animate-ping opacity-70"></div>
            <div className="absolute top-1/2 -right-4 w-2 h-2 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full animate-pulse opacity-90"></div>
            <div className="absolute top-1/2 -left-4 w-2 h-2 bg-gradient-to-r from-purple-400 to-violet-500 rounded-full animate-bounce delay-500 opacity-80"></div>
          </div>

          {/* العنوان الفخم */}
          <div className="space-y-6">
            <div className="relative">
              <h1 className="text-6xl font-black bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-shimmer drop-shadow-2xl">
                منصة قدراتك
              </h1>
              {/* تأثير الظل المضيء */}
              <div className="absolute inset-0 text-6xl font-black text-blue-400/20 blur-sm">
                منصة قدراتك
              </div>
            </div>

            <div className="relative">
              <p className="text-xl text-slate-200 font-medium tracking-wide opacity-90">
                رحلتك نحو التميز والإبداع
              </p>
              <div className="absolute inset-0 text-xl text-blue-300/30 blur-sm">
                رحلتك نحو التميز والإبداع
              </div>
            </div>

            {/* شعار فرعي أنيق */}
            <div className="flex items-center justify-center space-x-2 text-slate-300">
              <div className="w-8 h-px bg-gradient-to-r from-transparent via-blue-400 to-transparent"></div>
              <span className="text-sm font-light tracking-widest">QUDRATUK PLATFORM</span>
              <div className="w-8 h-px bg-gradient-to-r from-transparent via-blue-400 to-transparent"></div>
            </div>
          </div>

          {/* شريط التحميل الفخم */}
          <div className="w-80 mx-auto space-y-4">
            <div className="relative">
              {/* الخلفية المضيئة */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-full blur-sm"></div>

              {/* شريط التحميل الرئيسي */}
              <div className="relative w-full h-3 bg-slate-800/50 rounded-full overflow-hidden border border-blue-400/30 backdrop-blur-sm">
                <div className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full animate-loading-bar shadow-lg shadow-blue-500/50"></div>

                {/* تأثير البريق المتحرك */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
              </div>
            </div>

            {/* نص التحميل الأنيق */}
            <div className="flex items-center justify-center space-x-3">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-150"></div>
                <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce delay-300"></div>
              </div>
              <p className="text-slate-300 text-sm font-light tracking-wide">جاري تحضير التجربة المثالية</p>
            </div>
          </div>
        </div>

        {/* أنماط CSS مخصصة فخمة */}
        <style>{`
          @keyframes loading-bar {
            0% { width: 0%; }
            100% { width: 100%; }
          }

          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }

          @keyframes spin-slow {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }

          @keyframes spin-reverse {
            from { transform: rotate(360deg); }
            to { transform: rotate(0deg); }
          }

          .animate-loading-bar {
            animation: loading-bar 2s ease-in-out;
          }

          .animate-shimmer {
            animation: shimmer 3s ease-in-out infinite;
          }

          .animate-spin-slow {
            animation: spin-slow 8s linear infinite;
          }

          .animate-spin-reverse {
            animation: spin-reverse 12s linear infinite;
          }
        `}</style>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" forcedTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router splashDone={splashDone} />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;