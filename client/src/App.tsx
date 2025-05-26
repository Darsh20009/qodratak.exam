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
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (showSplash) {
      const interval = setInterval(() => {
        setProgress((oldProgress) => {
          if (oldProgress === 100) {
            clearInterval(interval);
            return 100;
          }
          const diff = Math.random() * 15;
          return Math.min(oldProgress + diff, 100);
        });
      }, 400);

      return () => clearInterval(interval);
    }
  }, [showSplash]);


  if (showSplash) {
    return (
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
    
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 overflow-hidden"
        jsx="true"
      >
        {/* خلفية متحركة متقدمة */}
        <div className="absolute inset-0">
          {/* تدرجات متحركة */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950/95 via-blue-950/85 to-indigo-950/95 animate-gradient-shift"></div>
          <div className="absolute inset-0 bg-gradient-to-tr from-purple-950/40 via-blue-950/30 to-cyan-950/40 animate-pulse-slow"></div>

          {/* شبكة مضيئة متحركة */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_50%_200px,rgba(59,130,246,0.15),transparent)] animate-pulse"></div>
          <div className="absolute inset-0 bg-[conic-gradient(from_0deg_at_50%_50%,rgba(59,130,246,0.1)_0deg,transparent_60deg,rgba(147,51,234,0.08)_120deg,transparent_180deg,rgba(6,182,212,0.12)_240deg,transparent_300deg,rgba(59,130,246,0.1)_360deg)] animate-spin-very-slow"></div>

          {/* موجات ضوئية */}
          <div className="absolute inset-0">
            {[...Array(5)].map((_, i) => (
              <div
                key={`wave-${i}`}
                className="absolute inset-0 rounded-full border border-blue-400/10 animate-ripple"
                style={{
                  animationDelay: `${i * 0.8}s`,
                  animationDuration: '4s',
                  transform: `scale(${0.5 + i * 0.3})`,
                }}
              />
            ))}
          </div>

          {/* جسيمات متحركة محسنة */}
          {[...Array(50)].map((_, i) => (
            <div
              key={`particle-${i}`}
              className="absolute rounded-full animate-float-random"
              style={{
                width: `${1 + Math.random() * 6}px`,
                height: `${1 + Math.random() * 6}px`,
                background: `radial-gradient(circle, rgba(${Math.random() > 0.5 ? '59,130,246' : '147,51,234'},${0.3 + Math.random() * 0.5}) 0%, transparent 70%)`,
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 8}s`,
                animationDuration: `${4 + Math.random() * 6}s`,
                filter: `blur(${Math.random() * 2}px)`,
                boxShadow: `0 0 ${2 + Math.random() * 8}px rgba(59,130,246,${0.2 + Math.random() * 0.3})`
              }}
            />
          ))}

          {/* أضواء متحركة كبيرة */}
          {[...Array(12)].map((_, i) => (
            <div
              key={`light-${i}`}
              className="absolute rounded-full animate-float-gentle opacity-20"
              style={{
                width: `${80 + Math.random() * 150}px`,
                height: `${80 + Math.random() * 150}px`,
                background: `radial-gradient(circle, rgba(${Math.random() > 0.3 ? '59,130,246' : '147,51,234'},0.2) 0%, rgba(6,182,212,0.1) 40%, transparent 70%)`,
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 12}s`,
                animationDuration: `${12 + Math.random() * 8}s`,
                filter: `blur(${8 + Math.random() * 15}px)`,
              }}
            />
          ))}
        </div>

        {/* المحتوى الرئيسي */}
        <div className="relative z-10 text-center max-w-4xl mx-auto px-6">
          {/* الشعار والعنوان الرئيسي */}
          <div className="mb-12 animate-fade-in-down">
            {/* أيقونات متحركة */}
            <div className="flex justify-center items-center gap-8 mb-8">
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-full flex items-center justify-center animate-bounce">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                <div className="absolute inset-0 w-16 h-16 bg-blue-400/30 rounded-full animate-ping"></div>
              </div>

              <div className="text-center">
                <h1 className="text-7xl md:text-9xl font-black bg-gradient-to-r from-blue-300 via-cyan-200 to-purple-300 bg-clip-text text-transparent animate-pulse-glow tracking-tight">
                  منصة قدراتك
                </h1>
                <div className="flex items-center justify-center gap-2 mt-4">
                  <div className="h-1 w-12 bg-gradient-to-r from-blue-400 to-transparent rounded-full animate-pulse"></div>
                  <div className="h-2 w-2 bg-cyan-400 rounded-full animate-pulse"></div>
                  <div className="h-1 w-12 bg-gradient-to-l from-purple-400 to-transparent rounded-full animate-pulse"></div>
                </div>
              </div>

              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-indigo-400 rounded-full flex items-center justify-center animate-bounce" style={{animationDelay: '0.5s'}}>
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                  </svg>
                </div>
                <div className="absolute inset-0 w-16 h-16 bg-purple-400/30 rounded-full animate-ping" style={{animationDelay: '0.5s'}}></div>
              </div>
            </div>

            {/* النص الوصفي */}
            <div className="space-y-4">
              <p className="text-2xl md:text-3xl text-blue-100 font-medium leading-relaxed animate-fade-in-up">
                🚀 بوابتك الذكية نحو التميز والإبداع
              </p>
              <p className="text-lg md:text-xl text-cyan-200/90 font-light leading-relaxed animate-fade-in-up" style={{animationDelay: '0.3s'}}>
                منصة تعليمية متطورة مدعومة بالذكاء الاصطناعي لتطوير قدراتك وتحقيق أحلامك
              </p>
            </div>
          </div>

          {/* شريط التحميل المطور */}
          <div className="w-80 mx-auto animate-fade-in-up" style={{animationDelay: '0.6s'}}>
            <div className="relative">
              <div className="h-3 bg-slate-800/50 rounded-full overflow-hidden backdrop-blur-sm border border-blue-400/20">
                <div 
                  className="h-full bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400 rounded-full transition-all duration-300 ease-out relative"
                  style={{ width: `${progress}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/30 to-transparent animate-shimmer"></div>
                </div>
              </div>

              {/* نقاط التحميل المتحركة */}
              <div className="flex justify-center mt-6 space-x-2">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="w-3 h-3 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full animate-bounce"
                    style={{
                      animationDelay: `${i * 0.2}s`,
                      animationDuration: '1.4s'
                    }}
                  />
                ))}
              </div>

              <div className="text-center mt-4">
                <p className="text-blue-200 text-lg font-medium mb-2">
                  {progress < 25 ? '✨ جاري إعداد المحتوى التعليمي المتقدم...' :
                   progress < 50 ? '📚 تحميل بنك الأسئلة الذكي...' :
                   progress < 75 ? '🧠 تهيئة نظام الذكاء الاصطناعي...' : 
                   progress < 95 ? '🔧 ضبط الإعدادات النهائية...' : '🎉 مرحباً بك في منصة قدراتك!'}
                </p>
                <div className="text-cyan-300/70 text-sm">
                  {progress}% مكتمل
                </div>
              </div>
            </div>
          </div>

          {/* رسالة تحفيزية */}
          <div className="mt-8 animate-fade-in-up" style={{animationDelay: '0.9s'}}>
            <p className="text-blue-200/80 text-base italic">
              "كل خطوة نحو التعلم هي خطوة نحو مستقبل أفضل"
            </p>
          </div>
        </div>
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