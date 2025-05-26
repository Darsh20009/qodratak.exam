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
      <div className="h-screen w-screen flex flex-col items-center justify-center relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950">
        {/* خلفية الشبكة المتحركة */}
        <div className="absolute inset-0">
          {/* شبكة نقطية متحركة */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_400px_at_50%_200px,rgba(30,64,175,0.15),transparent)]"/>
          <div className="absolute inset-0 bg-[radial-gradient(circle_300px_at_80%_300px,rgba(29,78,216,0.1),transparent)]"/>
          <div className="absolute inset-0 bg-[radial-gradient(circle_500px_at_20%_500px,rgba(37,99,235,0.08),transparent)]"/>
          
          {/* شبكة خطوط */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(30,64,175,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(30,64,175,0.03)_1px,transparent_1px)] bg-[size:50px_50px]"/>
          
          {/* جزيئات ضوئية متحركة */}
          {[...Array(80)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full animate-float"
              style={{
                width: `${2 + Math.random() * 4}px`,
                height: `${2 + Math.random() * 4}px`,
                background: `rgba(${30 + Math.random() * 80}, ${64 + Math.random() * 100}, ${175 + Math.random() * 80}, ${0.2 + Math.random() * 0.4})`,
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 8}s`,
                animationDuration: `${4 + Math.random() * 6}s`,
                filter: `blur(${Math.random() * 1.5}px)`,
                boxShadow: `0 0 ${4 + Math.random() * 8}px rgba(59, 130, 246, 0.3)`,
              }}
            />
          ))}
          
          {/* دوائر متوهجة كبيرة */}
          <div className="absolute top-1/4 left-1/4 w-48 h-48 bg-blue-900/10 rounded-full blur-3xl animate-pulse"/>
          <div className="absolute bottom-1/4 right-1/4 w-56 h-56 bg-indigo-900/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '3s'}}/>
          <div className="absolute top-3/4 left-3/4 w-40 h-40 bg-slate-800/15 rounded-full blur-2xl animate-pulse" style={{animationDelay: '1.5s'}}/>
        </div>

        {/* خطوط ضوئية متحركة */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/3 w-0.5 h-full bg-gradient-to-b from-transparent via-blue-600/20 to-transparent transform rotate-6 animate-pulse"/>
          <div className="absolute top-0 right-1/4 w-0.5 h-full bg-gradient-to-b from-transparent via-indigo-600/15 to-transparent transform -rotate-3 animate-pulse" style={{animationDelay: '2s'}}/>
          <div className="absolute top-0 left-2/3 w-0.5 h-full bg-gradient-to-b from-transparent via-slate-600/10 to-transparent transform rotate-12 animate-pulse" style={{animationDelay: '4s'}}/>
        </div>

        {/* المحتوى الرئيسي */}
        <div className="relative z-10 text-center space-y-10">
          {/* الأيقونة الرئيسية مع تأثيرات متقدمة */}
          <div className="relative group">
            <div className="w-40 h-40 mx-auto bg-gradient-to-br from-blue-800 via-blue-900 to-slate-900 rounded-3xl shadow-2xl shadow-blue-900/40 flex items-center justify-center transform animate-float border border-blue-800/30 backdrop-blur-sm relative overflow-hidden">
              {/* تأثير الزجاج */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent rounded-3xl"/>
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-blue-400/5 to-transparent rounded-3xl"/>
              
              {/* الأيقونة */}
              <div className="text-7xl relative z-10 filter drop-shadow-lg">🧠</div>
              
              {/* تأثير الوهج الداخلي */}
              <div className="absolute inset-4 bg-gradient-to-br from-blue-500/10 to-transparent rounded-2xl blur-xl"/>
            </div>
            
            {/* هالة الوهج المحيطة */}
            <div className="absolute inset-0 w-40 h-40 mx-auto bg-gradient-to-r from-blue-600/20 via-indigo-600/15 to-slate-600/10 rounded-3xl blur-2xl animate-pulse"/>
            <div className="absolute inset-0 w-40 h-40 mx-auto bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-3xl blur-3xl animate-pulse" style={{animationDelay: '1s'}}/>
            
            {/* عناصر مزخرفة حول الأيقونة */}
            <div className="absolute -top-6 -right-6 text-blue-400 text-3xl animate-bounce opacity-80">⭐</div>
            <div className="absolute -bottom-6 -left-6 text-indigo-400 text-2xl animate-bounce opacity-70" style={{animationDelay: '0.7s'}}>💫</div>
            <div className="absolute -top-4 -left-8 text-slate-400 text-xl animate-bounce opacity-60" style={{animationDelay: '1.4s'}}>✨</div>
            <div className="absolute -bottom-2 -right-8 text-blue-300 text-lg animate-bounce opacity-75" style={{animationDelay: '2.1s'}}>🌟</div>
          </div>

          {/* العنوان مع تأثيرات متطورة */}
          <div className="space-y-6">
            <h1 className="text-7xl font-black bg-gradient-to-r from-blue-300 via-indigo-400 to-slate-300 bg-clip-text text-transparent relative">
              <span className="relative inline-block animate-pulse">
                منصة قدراتك
                {/* تأثير الوهج خلف النص */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 blur-xl -z-10"/>
              </span>
            </h1>
            <p className="text-2xl text-slate-300/90 font-medium tracking-wide animate-fade-in">
              منصتك الذكية للتميز الأكاديمي والإبداع
            </p>
            <p className="text-lg text-slate-400/70 font-light animate-fade-in" style={{animationDelay: '0.5s'}}>
              ابدأ رحلة التعلم والنجاح معنا
            </p>
          </div>

          {/* شريط التحميل المتطور جداً */}
          <div className="w-80 mx-auto space-y-4">
            <div className="relative w-full h-3 bg-slate-900/60 rounded-full overflow-hidden backdrop-blur-sm border border-slate-800/50">
              <div className="absolute inset-0 bg-gradient-to-r from-slate-800/20 via-blue-900/30 to-slate-800/20"/>
              <div className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-600 rounded-full animate-loading-bar shadow-lg shadow-blue-500/30 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"/>
              </div>
            </div>
            <p className="text-slate-400/80 text-base animate-pulse font-medium">جاري تحضير التجربة المثالية...</p>
            
            {/* مؤشرات التقدم */}
            <div className="flex justify-center space-x-1 rtl:space-x-reverse">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-ping"/>
              <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-ping" style={{animationDelay: '0.3s'}}/>
              <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-ping" style={{animationDelay: '0.6s'}}/>
            </div>
          </div>

          {/* نصوص تحفيزية وشعارات */}
          <div className="space-y-3 animate-fade-in" style={{animationDelay: '1s'}}>
            <p className="text-slate-300/70 text-base font-medium">🚀 استعد لتجربة تعليمية استثنائية</p>
            <p className="text-slate-400/60 text-sm">💡 حيث يلتقي الذكاء بالإبداع</p>
          </div>
        </div>

        {/* تأثيرات الخلفية الإضافية */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-950/80 to-transparent"/>
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-slate-950/60 to-transparent"/>

        {/* أنماط CSS مخصصة */}
        <style jsx>{`
          @keyframes loading-bar {
            0% { width: 0%; }
            100% { width: 100%; }
          }
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(200%); }
          }
          @keyframes fade-in {
            0% { opacity: 0; transform: translateY(20px); }
            100% { opacity: 1; transform: translateY(0); }
          }
          @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-10px) rotate(1deg); }
          }
          .animate-loading-bar {
            animation: loading-bar 2s ease-in-out;
          }
          .animate-shimmer {
            animation: shimmer 2s infinite;
          }
          .animate-fade-in {
            animation: fade-in 1s ease-out forwards;
          }
          .animate-float {
            animation: float 6s ease-in-out infinite;
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