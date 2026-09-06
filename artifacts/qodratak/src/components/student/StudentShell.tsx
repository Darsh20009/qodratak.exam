import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { ThemeToggle } from "@/components/ThemeToggle";
import NotificationBell from "@/components/NotificationBell";
import { useUser } from "@/hooks/use-user";
import { cn } from "@/lib/utils";
import { HomeIcon, BookOpenIcon, BrainCircuitIcon, UserIcon, MenuIcon, XIcon, LogOut } from "lucide-react";

const NAV_ITEMS = [
  { name: "لوحتي", href: "/", icon: HomeIcon },
  { name: "التأسيس", href: "/foundation", icon: BookOpenIcon },
  { name: "المحوسب", href: "/computerized", icon: BrainCircuitIcon },
  { name: "حسابي", href: "/account", icon: UserIcon },
];

const platformLogo = "/qodratak-logo-transparent.png";

export function StudentShell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, logout } = useUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const userName = user?.name || user?.username || "طالب";
  const userInitial = userName.charAt(0);

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="qodratak-app-shell flex min-h-[100dvh] bg-background text-foreground" dir="rtl">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-l border-border bg-card">
        <div className="p-5 border-b border-border">
          <Link href="/" className="flex items-center gap-3 qodratak-focus-ring rounded-lg">
            <img src={platformLogo} alt="قدراتك" className="h-10 w-10 object-contain" />
            <div>
              <h2 className="text-lg font-black text-foreground leading-tight">قدراتك</h2>
            </div>
          </Link>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}>
                <div className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 qodratak-focus-ring cursor-pointer",
                  isActive
                    ? "bg-[#0D1B2A] text-white dark:bg-primary dark:text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}>
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  <span>{item.name}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border space-y-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <span className="text-xs font-bold text-muted-foreground">المظهر</span>
            </div>
            <NotificationBell userId={user?.id ? String(user.id) : null} />
          </div>

          <div className="flex items-center gap-3 px-2">
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center font-black text-[#0D1B2A] dark:text-white flex-shrink-0">
              {userInitial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground truncate">{userName}</p>
              <button onClick={handleLogout} className="text-xs text-red-500 font-bold hover:underline flex items-center gap-1 mt-0.5">
                <LogOut className="h-3 w-3" /> تسجيل خروج
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Top Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-card border-b border-border z-40 flex items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <img src={platformLogo} alt="قدراتك" className="h-8 w-8 object-contain" />
          <span className="font-black text-foreground">قدراتك</span>
        </Link>
        <div className="flex items-center gap-3">
          <NotificationBell userId={user?.id ? String(user.id) : null} />
          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center font-black text-sm">
            {userInitial}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col md:pt-0 pt-16 pb-20 md:pb-0 h-[100dvh] overflow-y-auto bg-[#F7F8FA] dark:bg-background">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-40 px-2 pb-[env(safe-area-inset-bottom)]">
        <nav className="flex items-center justify-around h-16">
          {NAV_ITEMS.map((item) => {
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}>
                <div className="flex flex-col items-center justify-center w-16 h-full qodratak-focus-ring cursor-pointer">
                  <div className={cn(
                    "flex items-center justify-center h-8 w-12 rounded-full transition-colors",
                    isActive ? "bg-[#0D1B2A] text-white dark:bg-primary dark:text-primary-foreground" : "text-muted-foreground"
                  )}>
                    <item.icon className="h-5 w-5" />
                  </div>
                  <span className={cn(
                    "text-[10px] font-bold mt-1",
                    isActive ? "text-[#0D1B2A] dark:text-primary" : "text-muted-foreground"
                  )}>{item.name}</span>
                </div>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
