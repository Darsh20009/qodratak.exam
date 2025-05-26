import React from 'react';
import { Switch, Route, Link, useLocation } from "wouter";
import { RotateDevicePrompt } from "@/components/RotateDevicePrompt";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Assistant } from "@/components/ui/assistant";
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
  DiamondIcon
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
    { name: "كتبي", href: "/books", icon: BookOpenIcon },  // إضافة قسم "كتبي"
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
                <span className="text-xs mt-1 text-center leading-tight">{item.label}</span>
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
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-900">
        {/* المحتوى الرئيسي */}
        <div className="text-center space-y-8">
          {/* الأيقونة البسيطة */}
          <div className="w-24 h-24 mx-auto bg-blue-600 rounded-2xl flex items-center justify-center">
            <div className="text-4xl">🧠</div>
          </div>

          {/* العنوان البسيط */}
          <div className="space-y-4">
            <h1 className="text-4xl font-bold text-white">
              منصة قدراتك
            </h1>
            <p className="text-lg text-slate-300">
              منصتك للتعلم والنجاح
            </p>
          </div>

          {/* شريط التحميل البسيط */}
          <div className="w-64 mx-auto space-y-3">
            <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full animate-loading-bar"/>
            </div>
            <p className="text-slate-400 text-sm">جاري التحميل...</p>
          </div>
        </div>

        {/* أنماط CSS مخصصة */}
        <style>{`
          @keyframes loading-bar {
            0% { width: 0%; }
            100% { width: 100%; }
          }
          .animate-loading-bar {
            animation: loading-bar 2s ease-in-out;
          }
        `}</style>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class">
        <TooltipProvider>
          <Toaster />
          <Router splashDone={splashDone} />
          <Assistant />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;