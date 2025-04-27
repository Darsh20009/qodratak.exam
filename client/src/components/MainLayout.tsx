import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
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

export interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
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
    { name: "اسأل سؤال", href: "/ask", icon: HelpCircleIcon },
    { name: "المكتبة", href: "/library", icon: BookOpenIcon },
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
                {/* Use the div as a clickable element with onClick to navigate */}
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
        <div className="p-4">
          <div 
            onClick={() => window.location.href = "/profile"}
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-muted/50 cursor-pointer"
          >
            <UserIcon className="h-5 w-5" />
            <span>{userName || "تسجيل الدخول"}</span>
          </div>
        </div>
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
            <div 
              onClick={() => window.location.href = "/profile"}
              className="p-2 cursor-pointer"
            >
              <UserIcon className="h-5 w-5" />
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
          {children}
        </main>
      </div>
    </div>
  );
};