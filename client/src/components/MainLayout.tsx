import React, { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { Separator } from "@/components/ui/separator";
import { 
  BookOpenIcon, 
  BrainCircuitIcon, 
  GraduationCapIcon,
  HelpCircleIcon, 
  HomeIcon, 
  UserIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Toaster } from "@/components/ui/toaster";
import { SmartNotifications } from "@/components/SmartNotifications";

export interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [location, setLocation] = useLocation();
  const [userName, setUserName] = useState<string | null>(null);
  const [userPoints, setUserPoints] = useState<number>(0);
  const [userLevel, setUserLevel] = useState<number>(0);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Check if we have a user stored in localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);

        // Check subscription status
        const today = new Date();
        const endDate = new Date(user.subscription?.endDate);
        const isSubscriptionExpired = user.subscription?.type !== 'Pro Live' && endDate < today;

        if (isSubscriptionExpired) {
          localStorage.removeItem('user');
          setLocation('/profile');
          return;
        }

        setUserName(user.name);
        setUserPoints(user.points || 0);
        setUserLevel(user.level || 0);
        setIsLoggedIn(true);
        setUser(user);

        // Broadcast login state
        window.dispatchEvent(new CustomEvent('userLoggedIn', { detail: user }));

        // Update all auth states
        document.cookie = `isLoggedIn=true; path=/; max-age=86400`;
        document.cookie = `userName=${user.name}; path=/; max-age=86400`;
        document.cookie = `userSubscription=${user.subscription.type}; path=/; max-age=86400`;
        document.cookie = `userPoints=${user.points || 0}; path=/; max-age=86400`;
        document.cookie = `userLevel=${user.level || 0}; path=/; max-age=86400`;

        // Update session storage for quicker access
        sessionStorage.setItem('currentUser', JSON.stringify(user));

      } catch (e) {
        console.error("Error parsing stored user:", e);
        localStorage.removeItem('user');
        document.cookie = 'isLoggedIn=false; path=/';
        setLocation('/profile');
      }
    } else if (location !== '/profile' && location !== '/') {
      // Redirect to login if not authenticated and not on home page
      setLocation('/profile');
    }
  }, [location, setLocation]);

  const getNavItems = (subscription: string = 'free') => {
    const baseItems = [
      { name: "الرئيسية", href: "/", icon: HomeIcon },
      { name: "اختبارات قياس", href: "/qiyas", icon: GraduationCapIcon },
      { name: "الملف الشخصي", href: "/profile", icon: UserIcon },
    ];

    const premiumItems = [
      { name: "اختبر قدراتك", href: "/abilities", icon: BrainCircuitIcon },
      { name: "اسأل سؤال", href: "/ask", icon: HelpCircleIcon },
      { name: "المكتبة", href: "/library", icon: BookOpenIcon },
    ];

    return subscription !== 'free' ? [...baseItems, ...premiumItems] : baseItems;
  };

  const navItems = getNavItems(user?.subscription?.type);

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
                <div 
                  onClick={() => window.location.href = item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium cursor-pointer",
                    location === item.href 
                      ? "bg-primary text-primary-foreground" 
                      : "hover:bg-muted/50"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </div>
              </li>
            ))}
          </ul>
        </nav>
        <Separator />
        {isLoggedIn ? (
          <div className="p-4 space-y-3">
            {/* User Info with Points and Level */}
            <div 
              onClick={() => window.location.href = "/profile"}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-muted/50 cursor-pointer"
            >
              <UserIcon className="h-5 w-5" />
              <span>أهلاً، {userName}</span>
            </div>

            {/* Points Display */}
            <div className="rounded-md bg-primary-foreground p-3">
              <div className="flex justify-between items-center mb-1">
                <div className="text-xs font-medium text-primary">النقاط</div>
                <div className="text-xs font-bold">{userPoints}</div>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary"
                  style={{ width: `${Math.min(100, (userPoints % 100))}%` }}
                ></div>
              </div>
              <div className="flex justify-between items-center mt-2">
                <div className="text-xs font-medium text-primary">المستوى</div>
                <div className="text-xs font-bold">{userLevel}</div>
              </div>
              <div className="mt-2 text-[10px] text-muted-foreground">
                المزيد من النقاط = اختبارات أكثر صعوبة
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4">
            <div 
              onClick={() => window.location.href = "/profile"}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-muted/50 cursor-pointer"
            >
              <UserIcon className="h-5 w-5" />
              <span>تسجيل الدخول</span>
            </div>
          </div>
        )}
      </div>

      {/* Mobile navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 border-t dark:border-gray-700 md:hidden">
        <nav className="flex justify-around items-center h-16">
          {navItems.map((item) => (
            <div 
              key={item.href}
              onClick={() => window.location.href = item.href}
              className={cn(
                "flex flex-col items-center justify-center p-2 rounded-md cursor-pointer",
                location === item.href 
                  ? "text-primary" 
                  : "text-muted-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-xs">{item.name}</span>
            </div>
          ))}
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 md:hidden">
          <div className="flex items-center justify-between p-4">
            <h1 className="text-xl font-bold text-primary">قدراتي</h1>
            <SmartNotifications />
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="ml-2"
            >
              {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </Button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background to-background/50 pointer-events-none" />
        <div className="relative z-10">
          {children}
        </div>
      </main>
      </div>
    </div>
  );
};