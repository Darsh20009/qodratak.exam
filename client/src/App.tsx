import { Switch, Route, Link, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Assistant } from "@/components/ui/assistant";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import { ThemeProvider } from "next-themes";
import { Separator } from "@/components/ui/separator";
import { 
  BookOpenIcon, 
  BrainCircuitIcon, 
  FolderIcon,
  GamepadIcon,
  GraduationCapIcon,
  HelpCircleIcon, 
  HomeIcon, 
  UserIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import AskQuestionPage from "@/pages/AskQuestionPage";
import ProfilePage from "@/pages/ProfilePage";
import AbilitiesTestPage from "@/pages/AbilitiesTestPage";
import QiyasExamPage from "@/pages/QiyasExamPage";
import LibraryPage from "@/pages/LibraryPage";
import CustomExamPage from "@/pages/CustomExamPage";
import FoldersPage from "@/pages/FoldersPage";
import ChallengePage from "@/pages/ChallengePage";

function MainLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    // Check if we have a user stored in localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setUserName(user.username);
      } catch (e) {
        console.error("Error parsing stored user:", e);
      }
    }
  }, []);

  const navItems = [
    { name: "الرئيسية", href: "/", icon: HomeIcon },
    { name: "اختبارات قياس", href: "/qiyas", icon: GraduationCapIcon },
    { name: "اختبر قدراتك", href: "/abilities", icon: BrainCircuitIcon },
    { name: "التحديات", href: "/challenges", icon: GamepadIcon },
    { name: "اسأل سؤال", href: "/ask", icon: HelpCircleIcon },
    { name: "المكتبة", href: "/library", icon: BookOpenIcon },
    { name: "مجلداتي", href: "/folders", icon: FolderIcon },
  ];

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Sidebar */}
      <div className="hidden md:flex w-64 flex-col bg-white dark:bg-gray-800 border-r dark:border-gray-700">
        <div className="p-4">
          <h2 className="text-2xl font-bold text-primary">قدراتي</h2>
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
            <UserIcon className="h-5 w-5" />
            <span>{userName || "تسجيل الدخول"}</span>
          </Link>
        </div>
      </div>

      {/* Mobile navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 border-t dark:border-gray-700 md:hidden">
        <nav className="flex justify-around items-center h-16">
          {navItems.map((item) => (
            <Link 
              key={item.href} 
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center p-2 rounded-md",
                location === item.href 
                  ? "text-primary" 
                  : "text-muted-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-xs">{item.name}</span>
            </Link>
          ))}
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 md:hidden">
          <div className="flex items-center justify-between p-4">
            <h1 className="text-xl font-bold text-primary">قدراتي</h1>
            <Link 
              href="/profile"
              className="p-2"
            >
              <UserIcon className="h-5 w-5" />
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

function Router() {
  return (
    <Switch>
      {/* Main pages */}
      <Route path="/">
        {() => <Home />}
      </Route>
      <Route path="/qiyas">
        {() => <MainLayout><QiyasExamPage /></MainLayout>}
      </Route>
      <Route path="/custom-exam">
        {() => <MainLayout><CustomExamPage /></MainLayout>}
      </Route>
      <Route path="/abilities">
        {() => <MainLayout><AbilitiesTestPage /></MainLayout>}
      </Route>
      <Route path="/ask">
        {() => <MainLayout><AskQuestionPage /></MainLayout>}
      </Route>
      <Route path="/library">
        {() => <MainLayout><LibraryPage /></MainLayout>}
      </Route>
      <Route path="/profile">
        {() => <MainLayout><ProfilePage /></MainLayout>}
      </Route>
      <Route path="/folders">
        {() => <MainLayout><FoldersPage /></MainLayout>}
      </Route>
      <Route path="/challenges">
        {() => <MainLayout><ChallengePage /></MainLayout>}
      </Route>
      {/* Fallback to 404 */}
      <Route>
        {() => <MainLayout><NotFound /></MainLayout>}
      </Route>
    </Switch>
  );
}

function App() {
  const [showSplash, setShowSplash] = React.useState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  if (showSplash) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-gradient-to-b from-primary/10 to-primary/5">
        <h1 className="text-6xl font-bold text-primary mb-4 animate-fade-in">قدراتك</h1>
        <p className="text-2xl text-primary/80 animate-fade-in-delay">طريقك للوصول إلى 100% بإذن الله</p>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class">
        <TooltipProvider>
          <Toaster />
          <Router />
          <Assistant />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
