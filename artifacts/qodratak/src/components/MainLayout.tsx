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
  MessageCircleIcon,
  FileText,
  CalendarCheck as CalendarCheckIcon,
  BarChart2 as BarChart2Icon,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Toaster } from "@/components/ui/toaster";
import { SmartNotifications } from "@/components/SmartNotifications";
import { useQuery } from "@tanstack/react-query";
import { PermanentInstallButton } from "@/components/PermanentInstallButton";

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

  // جلب ترتيب المستخدم
  const { data: rankData } = useQuery<{
    currentRank: number;
    totalPoints: number;
    previousRank?: number;
  }>({
    queryKey: [`/api/users/${user?.id}/rank`],
    enabled: !!user?.id,
  });

  const currentRank = rankData?.currentRank || 0;

  useEffect(() => {
    // Check if we have a user stored in localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);

        // Check subscription status
        const today = new Date();
        const endDate = new Date(user.subscription?.endDate);
        const isSubscriptionExpired = !['Pro', 'Pro Life', 'Pro Life Plus', 'Pro Live'].includes(user.subscription?.type || '') && endDate < today;

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
    const isPremium = subscription && subscription !== 'free';
    
    return [
      { 
        name: "الرئيسية", 
        href: "/", 
        icon: HomeIcon,
        description: "العودة للصفحة الرئيسية"
      },
      { 
        name: "اختبارات قياس", 
        href: "/qiyas", 
        icon: GraduationCapIcon,
        description: "اختبارات محاكاة قياس الرسمية"
      },
      ...(isPremium ? [
        { 
          name: "اختبر قدراتك", 
          href: "/abilities", 
          icon: BrainCircuitIcon,
          description: "اختبارات شاملة لقياس قدراتك",
          premium: true
        },
        { 
          name: "نماذج الورقي", 
          href: "/paper-models", 
          icon: FileText,
          description: "36 نموذج ورقي احترافي بدون تكرار",
          premium: true
        },
        { 
          name: "بنك الأسئلة", 
          href: "/question-bank", 
          icon: BookOpenIcon,
          description: "مكتبة شاملة من الأسئلة المتنوعة",
          premium: true
        }
      ] : []),
      {
        name: "احجز اختبارك",
        href: "/book-exam",
        icon: CalendarCheckIcon,
        description: "جدوِل اختبارك القادم"
      },
      {
        name: "إحصائياتي",
        href: "/analytics",
        icon: BarChart2Icon,
        description: "تحليل أدائك وتقدمك"
      },
      { 
        name: "الملف الشخصي", 
        href: "/profile", 
        icon: UserIcon,
        description: "إدارة حسابك والإحصائيات"
      },
      { 
        name: "💳 محفظتي", 
        href: "/wallet", 
        icon: Wallet,
        description: "رصيد المحفظة وبطاقة قدراتك باي"
      },
      { 
        name: "المساعدة", 
        href: "/usage-guide", 
        icon: HelpCircleIcon,
        description: "دليل استخدام المنصة"
      }
    ];
  };

  const navItems = getNavItems(user?.subscription?.type);

  return (
    <div className="qodratak-app-shell flex min-h-screen bg-background text-foreground">
      {/* Sidebar */}
      <div className="hidden md:flex w-64 flex-col bg-white dark:bg-gray-800 border-r dark:border-gray-700">
        <div className="p-4">
          {/* لوجو إبداعي مع تأثيرات - للابتوب */}
          <Link href="/" className="flex items-center gap-2 group">
            {/* أيقونة الدماغ مع تأثير gradient وhalo */}
            <div className="relative">
              {/* التوهج الخارجي */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-green-600/20 to-amber-600/20 rounded-full blur-md group-hover:blur-lg transition-all duration-300"></div>
              
              {/* الأيقونة */}
              <div className="relative w-11 h-11 bg-gradient-to-br from-blue-600 via-green-600 to-teal-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:shadow-blue-500/50 transition-all duration-300 group-hover:scale-105">
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-xl"></div>
                <span className="text-2xl relative z-10">🧠</span>
                {/* تأثير البريق */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              </div>
            </div>
            
            {/* النص مع gradient */}
            <div className="flex flex-col">
              <h1 className="text-xl font-black bg-gradient-to-r from-blue-600 via-green-600 to-amber-600 dark:from-blue-400 dark:via-green-600 dark:to-amber-600 bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300">
                قدراتك
              </h1>
              <span className="text-[10px] font-medium text-muted-foreground -mt-1 tracking-wider">qodratak</span>
            </div>
          </Link>
        </div>
        <Separator />
        <nav className="flex-1 p-4">
          <ul className="space-y-3">
            {navItems.map((item) => (
              <li key={item.href}>
                <div 
                  onClick={() => window.location.href = item.href}
                  className={cn(
                    "flex flex-col gap-1 rounded-lg px-4 py-3 cursor-pointer transition-all duration-200 group relative",
                    location === item.href 
                      ? "bg-primary text-primary-foreground shadow-md" 
                      : "hover:bg-muted/50 hover:shadow-sm"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                    <span className="font-medium">{item.name}</span>
                    {item.premium && (
                      <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                        مميز
                      </div>
                    )}
                  </div>
                  <p className="text-xs opacity-75 mr-8 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </nav>
        <Separator />
        
        {/* Support Chat Link */}
        <div className="px-4 py-2">
          <a 
            href="/support"
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-muted/50 cursor-pointer bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700"
          >
            <MessageCircleIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <span className="text-blue-700 dark:text-blue-300">الدعم الفني المباشر</span>
          </a>
        </div>
        
        {/* Install App Button */}
        <div className="px-4 py-2">
          <PermanentInstallButton />
        </div>
        <Separator />
        
        {isLoggedIn ? (
          <div className="p-4 space-y-3">
            {/* User Info */}
            <div 
              onClick={() => window.location.href = "/profile"}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-muted/50 cursor-pointer"
            >
              <UserIcon className="h-5 w-5" />
              <span>أهلاً، {userName}</span>
            </div>

            {/* Points and Rank Display - Premium Only */}
            {user?.subscription?.type && user?.subscription?.type !== 'free' && user?.subscription?.type !== 'تجريبي' ? (
              <div 
                onClick={() => window.location.href = "/profile"}
                className="rounded-md bg-gradient-to-r from-yellow-500/10 to-orange-500/10 dark:from-yellow-500/20 dark:to-orange-500/20 border border-yellow-500/30 p-3 cursor-pointer hover:scale-[1.02] transition-transform duration-200"
              >
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="text-2xl">🏆</div>
                      <div>
                        <div className="text-xs font-medium text-yellow-600 dark:text-yellow-400">نقاطي</div>
                        <div className="text-lg font-black text-yellow-700 dark:text-yellow-300">{userPoints} ق</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-2xl">🥇</div>
                      <div>
                        <div className="text-xs font-medium text-green-700 dark:text-green-700">ترتيبي</div>
                        <div className="text-lg font-black text-green-700 dark:text-green-700">
                          {currentRank > 0 ? `#${currentRank.toLocaleString('ar-SA')}` : '—'}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-center text-muted-foreground border-t border-yellow-500/20 pt-2">
                    اضغط للتصنيف الكامل
                  </div>
                </div>
              </div>
            ) : null}
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

      {/* Mobile navigation — max 5 items */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-t border-gray-200/80 dark:border-gray-700/80 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
          <nav className="flex justify-around items-center h-16 px-1 max-w-screen-sm mx-auto">
            {[
              { name: "الرئيسية", href: "/", icon: HomeIcon },
              { name: "قياس", href: "/qiyas", icon: GraduationCapIcon },
              { name: "بنك الأسئلة", href: "/question-bank", icon: BookOpenIcon },
              { name: "إحصائياتي", href: "/analytics", icon: BarChart2Icon },
              { name: "حسابي", href: "/profile", icon: UserIcon },
            ].map((item) => {
              const active = location === item.href || location.startsWith(item.href + '/');
              return (
                <div
                  key={item.href}
                  onClick={() => window.location.href = item.href}
                  className={cn(
                    "flex flex-col items-center justify-center gap-0.5 px-2 py-1 rounded-xl cursor-pointer min-w-[56px] transition-all duration-200 relative",
                    active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {active && (
                    <div className="absolute inset-0 bg-primary/8 dark:bg-primary/15 rounded-xl" />
                  )}
                  <item.icon className={cn("h-5 w-5 relative z-10 transition-transform duration-200", active && "scale-110")} />
                  <span className={cn("text-[10px] font-medium relative z-10 whitespace-nowrap", active && "text-primary font-bold")}>
                    {item.name}
                  </span>
                  {active && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-primary rounded-full" />}
                </div>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 md:hidden sticky top-0 z-40">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-2 group">
              {/* Mobile Creative Logo */}
              <div className="relative">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 via-green-600 to-amber-600 p-0.5 group-hover:scale-110 transition-all duration-300 shadow-md">
                  <div className="w-full h-full rounded-[6px] bg-white dark:bg-gray-800 flex items-center justify-center">
                    {/* لوجو قدرات للموبايل - رأس بشري مع لمبة */}
                    <svg width="24" height="24" viewBox="0 0 100 100" className="drop-shadow-sm group-hover:scale-110 transition-all duration-300">
                      <defs>
                        <linearGradient id="headGrad-mobile" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" style={{stopColor:"#1e3a8a", stopOpacity:1}} />
                          <stop offset="100%" style={{stopColor:"#1e40af", stopOpacity:1}} />
                        </linearGradient>
                        <linearGradient id="bulbGrad-mobile" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" style={{stopColor:"#fbbf24", stopOpacity:1}} />
                          <stop offset="100%" style={{stopColor:"#f59e0b", stopOpacity:1}} />
                        </linearGradient>
                      </defs>
                      
                      {/* أشعة الإشراق */}
                      <g stroke="#1e40af" strokeWidth="1.5" fill="none">
                        <line x1="50" y1="10" x2="50" y2="18">
                          <animate attributeName="opacity" values="0.4;1;0.4" dur="2s" repeatCount="indefinite"/>
                        </line>
                        <line x1="70" y1="15" x2="68" y2="22">
                          <animate attributeName="opacity" values="0.3;0.9;0.3" dur="2.5s" repeatCount="indefinite"/>
                        </line>
                        <line x1="30" y1="15" x2="32" y2="22">
                          <animate attributeName="opacity" values="0.5;1;0.5" dur="1.8s" repeatCount="indefinite"/>
                        </line>
                      </g>
                      
                      {/* ترسان صغيرة */}
                      <g fill="#1e40af" opacity="0.6">
                        <circle cx="15" cy="35" r="2">
                          <animate attributeName="r" values="1.5;2.5;1.5" dur="3s" repeatCount="indefinite"/>
                        </circle>
                        <circle cx="85" cy="30" r="1.5">
                          <animate attributeName="r" values="1;2;1" dur="2.5s" repeatCount="indefinite"/>
                        </circle>
                      </g>
                      
                      {/* الرأس البشري */}
                      <path d="M25 45 Q25 25 50 25 Q75 25 75 45 L75 55 Q72 75 50 75 Q28 75 25 55 Z" 
                            fill="url(#headGrad-mobile)" stroke="#1e3a8a" strokeWidth="0.8"/>
                      
                      {/* اللمبة الكهربائية */}
                      <g transform="translate(50, 45)">
                        <rect x="-2.5" y="6" width="5" height="3" fill="#374151" rx="0.8"/>
                        <circle cx="0" cy="0" r="6" fill="url(#bulbGrad-mobile)" stroke="#f59e0b" strokeWidth="0.4"/>
                        <circle cx="0" cy="0" r="4" fill="rgba(255,255,255,0.3)"/>
                        <circle cx="-1.5" cy="-2" r="1" fill="rgba(255,255,255,0.8)">
                          <animate attributeName="opacity" values="0.6;1;0.6" dur="1.5s" repeatCount="indefinite"/>
                        </circle>
                      </g>
                    </svg>
                  </div>
                </div>
                {/* Mobile sparkles */}
                <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
              
              {/* Mobile title */}
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 via-green-600 to-amber-600 bg-clip-text text-transparent group-hover:scale-105 transition-all duration-300">
                قدراتك
              </h1>
            </div>
            <SmartNotifications />
          </div>
        </header>

        {/* Content — scrollable, with bottom padding on mobile so fixed nav doesn't cover content */}
        <main className="flex-1 overflow-y-auto">
          <div className="qodratak-page-surface pb-24 md:pb-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};