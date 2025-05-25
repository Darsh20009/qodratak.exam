
import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { 
  Trophy, Star, User, Award, BookOpen, ChevronRight, 
  Loader2, CheckCircle2, XCircle, Info, KeyRound, Mail,
  DiamondIcon, CrownIcon, FlameIcon, SparklesIcon, GemIcon,
  ShieldCheckIcon, RocketIcon, ZapIcon, InfinityIcon, MedalIcon
} from "lucide-react";
import { Badge } from "../components/ui/badge";

// Form schema for login
const loginSchema = z.object({
  username: z.string().min(3, {
    message: "اسم المستخدم يجب أن يكون 3 أحرف على الأقل",
  }),
  password: z.string().min(3, {
    message: "كلمة المرور يجب أن تكون 3 أحرف على الأقل",
  }),
});

// Form schema for registration
const registerSchema = z.object({
  username: z.string().min(3, {
    message: "اسم المستخدم يجب أن يكون 3 أحرف على الأقل",
  }).email({ message: "الرجاء إدخال بريد إلكتروني صالح" }),
  password: z.string().min(6, {
    message: "كلمة المرور يجب أن تكون 6 أحرف على الأقل",
  }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "كلمات المرور غير متطابقة",
  path: ["confirmPassword"],
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

interface UserSubscription {
  type: string;
  endDate?: string;
}

interface UserData {
  id: number;
  name: string;
  username?: string;
  email?: string;
  points: number;
  level: number;
  subscription: UserSubscription;
  tests_completed?: number;
  average_score?: string;
  challenges_won?: number;
}

const achievementsData = [
  { id: 1, name: "المتسابق النشيط", description: "أكملت 5 اختبارات بنجاح", icon: <Trophy className="h-6 w-6 text-yellow-500" />, color: "yellow" },
  { id: 2, name: "نجم المعرفة", description: "حققت علامة كاملة في اختبار صعب", icon: <Star className="h-6 w-6 text-amber-500" />, color: "amber" },
  { id: 3, name: "روح المثابرة", description: "أجريت 3 اختبارات في يوم واحد", icon: <Award className="h-6 w-6 text-orange-500" />, color: "orange" },
  { id: 4, name: "المستكشف", description: "زرت جميع أقسام المنصة", icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-teal-500"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline><circle cx="12" cy="14" r="3"></circle><path d="M12 14h.01"></path><path d="M19.5 13.5 21 12l-1.5-1.5"></path><path d="M4.5 10.5 3 12l1.5 1.5"></path></svg>, color: "teal" },
];

const recentActivityData = [
  { id: 1, type: "اختبار", title: "اختبار في المستوى المتقدم", date: "منذ ساعة", score: "92%", icon: <BookOpen className="h-5 w-5 text-indigo-500" /> },
  { id: 2, type: "بحث", title: "بحث عن استراتيجيات الحل السريع", date: "منذ 5 ساعات", icon: <User className="h-5 w-5 text-sky-500" /> },
  { id: 3, type: "قياس", title: "محاكاة اختبار القدرات التجريبي", date: "منذ يوم", score: "88%", icon: <Trophy className="h-5 w-5 text-emerald-500" /> },
];

const ProfilePage: React.FC = () => {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeRecoveryTab, setActiveRecoveryTab] = useState<"email" | "password">("email");

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser: UserData = JSON.parse(storedUser);
        setUser(parsedUser);
        setIsLoggedIn(true);
      } catch (e) {
        console.error("Error parsing stored user:", e);
        localStorage.removeItem("user");
      }
    }
  }, []);

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { username: "", password: "", confirmPassword: "" },
  });

  const onLoginSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.username, password: data.password }),
      });
      const responseData = await response.json();

      if (!response.ok) {
        let title = "خطأ في تسجيل الدخول";
        let description = responseData.message || "بيانات الدخول غير صحيحة أو مشكلة في الاشتراك.";
        if (response.status === 403) {
            title = responseData.isTrialExpired ? "انتهت الفترة التجريبية" : "مشكلة في الاشتراك";
            description = responseData.message || (responseData.isTrialExpired ? "يرجى الاشتراك للمتابعة." : "يرجى مراجعة حالة اشتراكك.");
        }
        toast({
          title: <div className="flex items-center"><XCircle className="h-5 w-5 mr-2 text-red-500" />{title}</div>,
          description: description,
          variant: "destructive",
        });
        return;
      }

      const userData: UserData = responseData;
      localStorage.setItem("user", JSON.stringify(userData));
      window.dispatchEvent(new Event('storage'));
      setUser(userData);
      setIsLoggedIn(true);
      localStorage.setItem("isLoggedIn", "true");
      window.dispatchEvent(new CustomEvent('userLoggedIn', { detail: userData }));

      toast({
        title: <div className="flex items-center"><CheckCircle2 className="h-5 w-5 mr-2 text-green-500" />تم بنجاح!</div>,
        description: `مرحباً بعودتك، ${userData.name || data.username}!`,
        className: "bg-green-50 border-green-200 dark:bg-green-900/30 dark:border-green-700",
      });
    } catch (error) {
      toast({
        title: <div className="flex items-center"><XCircle className="h-5 w-5 mr-2 text-red-500" />خطأ فني</div>,
        description: error instanceof Error ? error.message : "حدث خطأ غير متوقع. حاول مرة أخرى.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onRegisterSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: data.username.split('@')[0], email: data.username, password: data.password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "فشل إنشاء الحساب. قد يكون البريد مسجل مسبقاً.");
      }

      const userData: UserData = await response.json();
      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);
      setIsLoggedIn(true);
      localStorage.setItem("isLoggedIn", "true");
      window.dispatchEvent(new CustomEvent('userLoggedIn', { detail: userData }));

      toast({
        title: <div className="flex items-center"><CheckCircle2 className="h-5 w-5 mr-2 text-green-500" />تم إنشاء الحساب!</div>,
        description: `مرحباً بك في فريقنا، ${userData.name || data.username}! ابدأ رحلتك الآن.`,
        className: "bg-green-50 border-green-200 dark:bg-green-900/30 dark:border-green-700",
      });
    } catch (error) {
      toast({
        title: <div className="flex items-center"><XCircle className="h-5 w-5 mr-2 text-red-500" />خطأ في التسجيل</div>,
        description: error instanceof Error ? error.message : "حدث خطأ غير متوقع. حاول مرة أخرى.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("isLoggedIn");
    setUser(null);
    setIsLoggedIn(false);
    window.dispatchEvent(new CustomEvent('userLoggedOut'));
    toast({ 
      title: <div className="flex items-center"><Info className="h-5 w-5 mr-2 text-blue-500" />تم تسجيل الخروج</div>,
      description: "نأمل رؤيتك قريباً!",
      className: "bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-700",
    });
  };

  const renderProfileCard = () => {
    if (!user) return null;

    const isProLife = user.subscription.type === 'Pro Life' || user.subscription.type === 'Pro Live';
    const isPro = user.subscription.type === 'Pro';
    const isFree = user.subscription.type === 'free';

    if (isProLife) {
      return (
        <Card className="lg:col-span-1 overflow-hidden group/profile-card hover:shadow-2xl transition-all duration-700 bg-gradient-to-br from-slate-900 via-purple-900/50 to-pink-900/30 border-4 border-gradient-to-r from-purple-500 via-pink-500 to-amber-500 rounded-xl relative">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 via-pink-600/10 to-amber-600/10 animate-pulse pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(168,85,247,0.2),transparent_70%)] pointer-events-none" />

          <div className="absolute top-4 left-4 animate-bounce delay-100">
            <DiamondIcon className="h-5 w-5 text-purple-400 animate-pulse" />
          </div>
          <div className="absolute top-6 right-6 animate-bounce delay-300">
            <SparklesIcon className="h-4 w-4 text-pink-400 animate-pulse" />
          </div>
          <div className="absolute bottom-4 left-6 animate-bounce delay-500">
            <GemIcon className="h-4 w-4 text-amber-400 animate-pulse" />
          </div>

          <div className="h-48 bg-gradient-to-br from-purple-700/80 via-pink-600/60 to-amber-600/40 relative group-hover/profile-card:scale-[1.02] transition-transform duration-700">
            <div className="absolute inset-0 bg-gradient-conic from-purple-500/20 via-transparent to-pink-500/20 animate-spin-slow opacity-60"/>
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4gPGcgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIj4gPGcgZmlsbD0iIzAwMDAiIG9wYWNpdHk9IjAuMDUiPiA8Y2lyY2xlIGN4PSI0IiBjeT0iNCIgcj0iMiI+PC9jaXJjbGU+IDwvZz4gPC9nPiA8L3N2Zz4=')] opacity-30" />
          </div>

          <CardHeader className="text-center relative z-10 -mt-24">
            <div className="relative w-40 h-40 mx-auto">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-amber-500 rounded-full animate-spin-slow p-1 shadow-2xl shadow-purple-500/50" />
              <div className="w-full h-full rounded-full bg-gradient-to-br from-purple-600 to-pink-600 p-1 relative">
                <img src={`https://api.dicebear.com/7.x/avataaars-neutral/svg?seed=${user.email || user.name}`} alt="User Avatar" className="w-full h-full rounded-full object-cover bg-white" />
                <div className="absolute -top-2 -right-2 bg-gradient-to-r from-amber-400 to-yellow-400 rounded-full p-2 animate-bounce shadow-lg">
                  <DiamondIcon className="h-6 w-6 text-white" />
                </div>
              </div>
              <Badge className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 text-sm shadow-lg border-2 border-white font-black">
                💎 مستوى {user.level} - أسطورة
              </Badge>
            </div>
            <CardTitle className="text-4xl mt-8 font-black bg-gradient-to-r from-purple-300 via-pink-300 to-amber-300 bg-clip-text text-transparent drop-shadow-lg">
              {user.name}
            </CardTitle>
            <CardDescription className="flex flex-col items-center gap-3 mt-4">
              <Badge className="border-4 border-purple-400 bg-gradient-to-r from-purple-600/80 to-pink-600/80 text-white px-6 py-3 text-lg font-black animate-pulse shadow-xl">
                <DiamondIcon className="h-6 w-6 mr-2" />
                👑 Pro Life - الماس الأبدي 💎
              </Badge>
              <span className="text-lg text-purple-200 font-bold">عضوية مدى الحياة - لا تنتهي أبداً ✨</span>
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-4 pb-6 px-8 relative z-10">
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-purple-800/50 via-pink-800/50 to-amber-800/50 rounded-xl p-4 border border-purple-500/30">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-purple-200">قوة الأسطورة:</span>
                  <span className="font-bold text-purple-100">♾️ لا نهائية</span>
                </div>
                <div className="h-3 bg-purple-900/50 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-purple-400 via-pink-400 to-amber-400 rounded-full animate-pulse shadow-lg"></div>
                </div>
              </div>

              <div className="pt-2">
                <h4 className="font-black text-xl mb-4 text-center text-purple-100">👑 إحصائيات الأسطورة</h4>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "النقاط", value: user.points, icon: <Star className="w-5 h-5 text-purple-400" />, bg: "from-purple-800/60 to-purple-900/80" },
                    { label: "الاختبارات", value: user.tests_completed || 0, icon: <BookOpen className="w-5 h-5 text-pink-400" />, bg: "from-pink-800/60 to-pink-900/80" },
                    { label: "المتوسط", value: user.average_score || "∞", icon: <Trophy className="w-5 h-5 text-amber-400" />, bg: "from-amber-800/60 to-amber-900/80" },
                    { label: "التحديات", value: user.challenges_won || 0, icon: <FlameIcon className="w-5 h-5 text-red-400" />, bg: "from-red-800/60 to-red-900/80" }
                  ].map(stat => (
                    <div key={stat.label} className={`bg-gradient-to-br ${stat.bg} rounded-xl p-4 text-center group/stat hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer border border-white/10`}>
                      <div className="flex items-center justify-center gap-2 text-3xl font-black text-white mb-2 group-hover/stat:scale-110 transition-transform">
                        {stat.icon} {stat.value}
                      </div>
                      <div className="text-xs text-gray-200 font-bold">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>

          <CardFooter className="p-6 border-t border-purple-500/30 bg-gradient-to-r from-purple-900/30 to-pink-900/30">
            <Button onClick={handleLogout} variant="ghost" className="w-full text-purple-200 hover:bg-purple-500/20 hover:text-white font-bold border border-purple-500/30">
              تسجيل الخروج
            </Button>
          </CardFooter>
        </Card>
      );
    }

    if (isPro) {
      return (
        <Card className="lg:col-span-1 overflow-hidden group/profile-card hover:shadow-xl transition-all duration-500 bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 dark:from-amber-950/20 dark:via-yellow-950/10 dark:to-orange-950/20 border-3 border-gradient-to-r from-amber-400 to-yellow-500 rounded-xl relative">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-400/10 via-yellow-400/5 to-orange-400/10 animate-pulse pointer-events-none" />

          <div className="absolute top-4 right-4 animate-bounce">
            <CrownIcon className="h-6 w-6 text-amber-500 animate-pulse" />
          </div>

          <div className="h-36 bg-gradient-to-br from-amber-400/70 via-yellow-400/50 to-orange-400/30 relative group-hover/profile-card:scale-[1.02] transition-transform duration-500">
            <div className="absolute inset-0 bg-gradient-conic from-amber-400/20 via-transparent to-yellow-400/20 animate-spin-slow opacity-50"/>
          </div>

          <CardHeader className="text-center relative z-10 -mt-20">
            <div className="relative w-32 h-32 mx-auto">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 p-1 shadow-xl mx-auto ring-4 ring-amber-300 group-hover/profile-card:scale-105 transition-transform duration-300">
                <img src={`https://api.dicebear.com/7.x/avataaars-neutral/svg?seed=${user.email || user.name}`} alt="User Avatar" className="w-full h-full rounded-full object-cover bg-white" />
              </div>
              <div className="absolute -top-1 -right-1 bg-gradient-to-r from-amber-400 to-yellow-400 rounded-full p-2">
                <CrownIcon className="h-5 w-5 text-white" />
              </div>
              <Badge className="absolute -bottom-1 right-1/2 transform translate-x-1/2 translate-y-1/2 bg-gradient-to-r from-amber-500 to-yellow-500 text-white px-3 py-1 text-sm shadow-md font-bold">
                👑 مستوى {user.level}
              </Badge>
            </div>
            <CardTitle className="text-3xl mt-6 font-bold tracking-tight text-amber-800 dark:text-amber-200">{user.name}</CardTitle>
            <CardDescription className="flex flex-col items-center gap-2 mt-3">
              <Badge className="border-2 border-amber-500 bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-amber-900/50 dark:to-yellow-900/50 text-amber-700 dark:text-amber-300 px-4 py-2 font-bold">
                <CrownIcon className="h-4 w-4 mr-2" />
                Pro - عضوية ذهبية 👑
              </Badge>
              {user.subscription.endDate && (
                <span className="text-sm text-amber-600 dark:text-amber-400">
                  ينتهي في {new Intl.DateTimeFormat('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(user.subscription.endDate))}
                </span>
              )}
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-2 pb-6 px-6">
            <div className="space-y-5">
              <div className="bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-amber-900/30 dark:to-yellow-900/30 rounded-lg p-3 border border-amber-200 dark:border-amber-700">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-amber-700 dark:text-amber-300">تقدم العضوية:</span>
                  <span className="font-medium text-amber-800 dark:text-amber-200">⭐ مميز</span>
                </div>
                <div className="h-2.5 bg-amber-200 dark:bg-amber-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-amber-500 to-yellow-500 rounded-full transition-all duration-1000 ease-out w-4/5"></div>
                </div>
              </div>

              <div className="pt-2">
                <h4 className="font-semibold text-lg mb-3 text-center text-amber-800 dark:text-amber-200">📊 إحصائياتي المميزة</h4>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "النقاط", value: user.points, icon: <Star className="w-4 h-4 text-amber-500" /> },
                    { label: "الاختبارات", value: user.tests_completed || 0, icon: <BookOpen className="w-4 h-4 text-amber-600" /> },
                    { label: "المتوسط", value: user.average_score || "N/A", icon: <Trophy className="w-4 h-4 text-amber-700" /> },
                    { label: "التحديات", value: user.challenges_won || 0, icon: <Award className="w-4 h-4 text-amber-800" /> }
                  ].map(stat => (
                    <div key={stat.label} className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 text-center group/stat hover:shadow-md hover:scale-105 transition-all duration-300 cursor-pointer border border-amber-200 dark:border-amber-700">
                      <div className="flex items-center justify-center gap-1.5 text-2xl font-bold text-amber-700 dark:text-amber-300 mb-1 group-hover/stat:text-amber-600 transition-colors">
                        {stat.icon} {stat.value}
                      </div>
                      <div className="text-xs text-amber-600 dark:text-amber-400">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>

          <CardFooter className="p-4 border-t border-amber-200 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-900/10">
            <Button onClick={handleLogout} variant="ghost" className="w-full text-amber-600 hover:bg-amber-500/10 hover:text-amber-700 font-bold">
              تسجيل الخروج
            </Button>
          </CardFooter>
        </Card>
      );
    }

    return (
      <Card className="lg:col-span-1 overflow-hidden group/profile-card hover:shadow-lg transition-all duration-300 bg-card border rounded-xl">
        <div className="h-32 bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 relative group-hover/profile-card:scale-[1.01] transition-transform duration-300">
          <div className="absolute inset-0 bg-gradient-conic from-primary/5 via-transparent to-primary/0 animate-spin-slow opacity-30"/>
        </div>

        <CardHeader className="text-center relative z-10 -mt-16">
          <div className="relative w-28 h-28 mx-auto">
            <div className="w-28 h-28 rounded-full bg-gradient-to-br from-primary to-accent p-1 shadow-md mx-auto ring-2 ring-background group-hover/profile-card:scale-105 transition-transform duration-300">
              <img src={`https://api.dicebear.com/7.x/avataaars-neutral/svg?seed=${user.email || user.name}`} alt="User Avatar" className="w-full h-full rounded-full object-cover bg-white" />
            </div>
            <Badge className="absolute -bottom-1 right-1/2 transform translate-x-1/2 translate-y-1/2 bg-primary text-primary-foreground px-3 py-1 text-xs shadow-md">
              مستوى {user.level}
            </Badge>
          </div>
          <CardTitle className="text-2xl mt-4 font-semibold">{user.name}</CardTitle>
          <CardDescription className="flex flex-col items-center gap-2 mt-2">
            <Badge variant="outline" className="border-gray-400 text-gray-600 bg-gray-50 dark:bg-gray-800 dark:text-gray-400 px-3 py-1">
              <User className="h-4 w-4 mr-2" />
              عضو مجاني
            </Badge>
            <span className="text-sm text-muted-foreground">ابدأ رحلتك التعليمية معنا!</span>
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-2 pb-6 px-6">
          <div className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">تقدم التعلم:</span>
                <span className="font-medium text-primary">البداية</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all duration-1000 ease-out w-1/5"></div>
              </div>
            </div>

            <div className="pt-2">
              <h4 className="font-medium text-base mb-3 text-center">📈 إحصائياتي</h4>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "النقاط", value: user.points, icon: <Star className="w-4 h-4 text-blue-500" /> },
                  { label: "الاختبارات", value: user.tests_completed || 0, icon: <BookOpen className="w-4 h-4 text-green-500" /> },
                  { label: "المتوسط", value: user.average_score || "0%", icon: <Trophy className="w-4 h-4 text-orange-500" /> },
                  { label: "التحديات", value: user.challenges_won || 0, icon: <Award className="w-4 h-4 text-purple-500" /> }
                ].map(stat => (
                  <div key={stat.label} className="bg-muted/30 rounded-lg p-3 text-center group/stat hover:shadow-sm hover:scale-105 transition-all duration-300 cursor-pointer">
                    <div className="flex items-center justify-center gap-1.5 text-xl font-semibold text-foreground mb-1 group-hover/stat:text-primary transition-colors">
                      {stat.icon} {stat.value}
                    </div>
                    <div className="text-xs text-muted-foreground">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter className="p-4 border-t">
          <Button onClick={handleLogout} variant="ghost" className="w-full text-muted-foreground hover:bg-muted hover:text-foreground">
            تسجيل الخروج
          </Button>
        </CardFooter>
      </Card>
    );
  };

  if (isLoggedIn && user) {
    const achievementProgress = (achievementsData.filter(ach => user.points >= (ach.id * 100)).length / achievementsData.length) * 100;

    return (
      <div className="container py-8 px-4 mx-auto animate-fade-in-up">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {renderProfileCard()}

          <div className="lg:col-span-2 space-y-6">
            <Card className="hover:shadow-lg transition-shadow duration-300">
              <CardHeader>
                <CardTitle className="text-xl font-semibold">النشاط الأخير</CardTitle>
              </CardHeader>
              <CardContent>
                {recentActivityData.length > 0 ? (
                  <div className="space-y-3">
                    {recentActivityData.map((activity) => (
                      <div key={activity.id} className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-lg transition-colors duration-200 cursor-default">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary/10 rounded-full">{activity.icon}</div>
                          <div>
                            <h4 className="text-sm font-medium">{activity.title}</h4>
                            <p className="text-xs text-muted-foreground">{activity.date}</p>
                          </div>
                        </div>
                        {activity.score && (
                          <Badge className="text-sm font-semibold bg-green-500/10 text-green-600 border-green-500/30 border">
                            {activity.score}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">لا يوجد نشاط لعرضه حالياً.</p>
                )}
              </CardContent>
              <CardFooter className="border-t pt-4">
                <Button variant="link" className="w-full text-primary hover:underline" onClick={() => setLocation("/abilities")}>
                  عرض كل الأنشطة <ChevronRight className="h-4 w-4 mr-1" />
                </Button>
              </CardFooter>
            </Card>

            <Card className="hover:shadow-lg transition-shadow duration-300">
              <CardHeader>
                <CardTitle className="text-xl font-semibold">إنجازاتي المميزة</CardTitle>
              </CardHeader>
              <CardContent>
                {achievementsData.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {achievementsData.map((achievement) => (
                    <div
                      key={achievement.id}
                      className={`border rounded-xl p-4 text-center group/achieve hover:shadow-xl hover:-translate-y-1 transition-all duration-300 bg-card achievement-unlocked`}
                    >
                      <div className={`w-16 h-16 bg-${achievement.color}-500/10 rounded-full mx-auto flex items-center justify-center mb-3 transition-transform duration-300 group-hover/achieve:scale-110 ring-4 ring-${achievement.color}-500/20`}>
                        {React.cloneElement(achievement.icon, { className: `h-8 w-8 text-${achievement.color}-500`})}
                      </div>
                      <h4 className="font-semibold text-md">{achievement.name}</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        {achievement.description}
                      </p>
                    </div>
                  ))}
                </div>
                ) : (
                   <p className="text-muted-foreground text-center py-4">لم تكتسب أي إنجازات بعد. واصل التقدم!</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 text-gray-100 relative overflow-hidden flex items-center justify-center p-4">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_50%_100px,rgba(var(--color-primary-rgb),0.15),transparent_80%)] animate-pulse-slow" />
        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-primary/10 via-primary/5 to-transparent" />
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-primary/10 animate-float"
            style={{
              width: `${Math.random() * 80 + 40}px`,
              height: `${Math.random() * 80 + 40}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 6}s`,
              animationDuration: `${Math.random() * 15 + 10}s`,
              filter: `blur(${Math.random() * 5 + 2}px)`,
              opacity: Math.random() * 0.2 + 0.05
            }}
          />
        ))}
         <div className="absolute inset-0 bg-grid-slate-700/20 bg-[size:30px_30px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-50" />
      </div>

      <div className="w-full max-w-lg bg-slate-800/60 backdrop-blur-xl rounded-xl shadow-2xl border border-slate-700/80 relative overflow-hidden group animate-fade-in-up transition-all duration-700 hover:shadow-primary/30">
        <div className="absolute -top-1/3 -left-1/4 w-2/3 h-2/3 bg-primary/20 rounded-full filter blur-3xl animate-pulse-slow opacity-60 group-hover:opacity-80 transition-opacity duration-500" />
        <div className="absolute -bottom-1/3 -right-1/4 w-1/2 h-1/2 bg-sky-500/10 rounded-full filter blur-3xl animate-float opacity-50 group-hover:opacity-70 transition-opacity duration-500" />

        <Tabs defaultValue="login" className="w-full relative z-0">
          <TabsList className="grid w-full grid-cols-3 p-1.5 bg-slate-700/50 sticky top-0 z-10 backdrop-blur-md m-2 rounded-lg">
            {["login", "register", "recover"].map(value => (
              <TabsTrigger 
                key={value} 
                value={value} 
                className="flex-1 data-[state=active]:bg-primary/80 data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg rounded-md transition-all duration-300 py-2.5 text-slate-300 hover:bg-primary/20 hover:text-slate-100"
              >
                {value === "login" ? "تسجيل الدخول" : value === "register" ? "إنشاء حساب" : "استرداد الحساب"}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="login">
            <Card className="border-0 shadow-none bg-transparent rounded-none">
              <CardHeader className="pt-6 px-6 sm:px-8 text-center">
                <CardTitle className="text-3xl font-bold bg-gradient-to-r from-sky-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">
                  أهلاً بعودتك!
                </CardTitle>
                <CardDescription className="text-base text-slate-400 mt-1">
                  سجل دخولك لمتابعة رحلتك التعليمية.
                </CardDescription>
              </CardHeader>
              <CardContent className="px-6 sm:px-8 pb-8 pt-4">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-6">
                    <FormField
                      control={loginForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-300">البريد أو اسم المستخدم</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="example@mail.com" {...field} 
                              className="bg-slate-700/50 border-slate-600 placeholder:text-slate-500 text-slate-100 focus:border-primary focus:ring-2 focus:ring-primary/50 transition-all"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-300">كلمة المرور</FormLabel>
                          <FormControl>
                            <Input 
                              type="password" placeholder="••••••••" {...field} 
                              className="bg-slate-700/50 border-slate-600 placeholder:text-slate-500 text-slate-100 focus:border-primary focus:ring-2 focus:ring-primary/50 transition-all"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full bg-gradient-to-r from-primary to-sky-500 hover:from-primary/90 hover:to-sky-500/90 text-white text-base py-3 shadow-lg hover:shadow-primary/40 transition-all duration-300 transform hover:scale-[1.02]" disabled={isLoading}>
                      {isLoading ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> جاري الدخول...</> : "تسجيل الدخول"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="register">
            <Card className="border-0 shadow-none bg-transparent rounded-none">
              <CardHeader className="pt-6 px-6 sm:px-8 text-center">
                <CardTitle className="text-3xl font-bold bg-gradient-to-r from-sky-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">انضم إلينا الآن!</CardTitle>
                <CardDescription className="text-base text-slate-400 mt-1">
                  أنشئ حسابك وابدأ مغامرة التعلم.
                </CardDescription>
              </CardHeader>
              <CardContent className="px-6 sm:px-8 pb-8 pt-4">
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-5">
                    <FormField
                      control={registerForm.control} name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-300">البريد الإلكتروني</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="your.email@example.com" {...field} className="text-right bg-slate-700/50 border-slate-600 placeholder:text-slate-500 text-slate-100 focus:border-primary focus:ring-2 focus:ring-primary/50 transition-all" />
                          </FormControl><FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control} name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-300">كلمة المرور</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="اختر كلمة مرور قوية" {...field} className="text-right bg-slate-700/50 border-slate-600 placeholder:text-slate-500 text-slate-100 focus:border-primary focus:ring-2 focus:ring-primary/50 transition-all" />
                          </FormControl><FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control} name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-300">تأكيد كلمة المرور</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="أعد إدخال كلمة المرور" {...field} className="text-right bg-slate-700/50 border-slate-600 placeholder:text-slate-500 text-slate-100 focus:border-primary focus:ring-2 focus:ring-primary/50 transition-all" />
                          </FormControl><FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-500/90 hover:to-cyan-500/90 text-white text-base py-3 shadow-lg hover:shadow-sky-500/40 transition-all duration-300 transform hover:scale-[1.02]" disabled={isLoading}>
                      {isLoading ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> جاري الإنشاء...</> : "إنشاء حساب جديد"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recover">
            <Card className="border-0 shadow-none bg-transparent rounded-none">
              <CardHeader className="pt-6 px-6 sm:px-8 text-center">
                <CardTitle className="text-3xl font-bold bg-gradient-to-r from-sky-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">استرداد الحساب</CardTitle>
                <CardDescription className="text-base text-slate-400 mt-1">
                  لا تقلق، سنساعدك في استعادة حسابك.
                  <br/>
                  <span className="text-xs text-amber-400">(ملاحظة: هذا الجزء تجريبي ويستخدم ملف محلي. في تطبيق حقيقي، ستكون العملية مختلفة وآمنة.)</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="px-6 sm:px-8 pb-8 pt-4">
                <Tabs defaultValue={activeRecoveryTab} onValueChange={(value) => setActiveRecoveryTab(value as "email" | "password")} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-6 p-1 bg-slate-700/60 rounded-lg">
                    <TabsTrigger value="email" className="flex-1 data-[state=active]:bg-primary/70 data-[state=active]:text-primary-foreground data-[state=active]:shadow-md rounded-md py-2 transition-all text-slate-300 hover:bg-primary/20">
                      <Mail className="w-4 h-4 mr-2" /> البريد الإلكتروني
                    </TabsTrigger>
                    <TabsTrigger value="password" className="flex-1 data-[state=active]:bg-primary/70 data-[state=active]:text-primary-foreground data-[state=active]:shadow-md rounded-md py-2 transition-all text-slate-300 hover:bg-primary/20">
                      <KeyRound className="w-4 h-4 mr-2" /> كلمة المرور
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="email">
                    <div className="space-y-5">
                      <div className="space-y-2">
                        <label htmlFor="recover-email" className="text-sm font-medium text-slate-300">
                          البريد الإلكتروني المسجل
                        </label>
                        <Input id="recover-email" name="email" type="email" placeholder="أدخل بريدك الإلكتروني" className="text-right bg-slate-700/50 border-slate-600 placeholder:text-slate-500 text-slate-100 focus:border-primary focus:ring-2 focus:ring-primary/50 transition-all" required />
                      </div>
                      <Button className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-500/90 hover:to-cyan-500/90 text-white text-base py-3 shadow-lg hover:shadow-teal-500/40 transition-all duration-300 transform hover:scale-[1.02]"
                        onClick={async () => {
                            const emailInput = document.getElementById('recover-email') as HTMLInputElement;
                            const email = emailInput?.value;
                            if (!email) {
                              toast({ title: <div className="flex items-center"><XCircle className="h-5 w-5 mr-2 text-red-500" />خطأ</div>, description: "يرجى إدخال البريد الإلكتروني", variant: "destructive" });
                              return;
                            }
                            setIsLoading(true);
                            try {
                              const response = await fetch('/user.json');
                              if (!response.ok) throw new Error('فشل تحميل بيانات المستخدمين (ملف تجريبي).');
                              const users = await response.json();
                              const userFound = users.find((u: any) => u.email && u.email.toLowerCase() === email.toLowerCase());

                              if (!userFound) {
                                toast({ title: <div className="flex items-center"><Info className="h-5 w-5 mr-2 text-amber-500" />لم يتم العثور على حساب</div>, description: "تأكد من البريد أو تواصل معنا.", variant: "default", duration: 4000, className: "bg-amber-50 border-amber-200 dark:bg-amber-900/30 dark:border-amber-700" });
                                setTimeout(() => window.open("https://t.me/qodratak2030", "_blank"), 4000);
                                return;
                              }
                              toast({
                                title: <div className="flex items-center"><CheckCircle2 className="h-5 w-5 mr-2 text-green-500"/>معلومات الحساب (تجريبي)</div>,
                                description: <div className="text-sm text-right">الاسم: {userFound.name}<br/>البريد: {userFound.email}<br/>المرور: {userFound.password} <br/><strong className="text-amber-500">(لا تعرض كلمة المرور هكذا في تطبيق حقيقي!)</strong></div>,
                                duration: 20000, className: "whitespace-pre-line text-right bg-green-50 border-green-200 dark:bg-green-900/30 dark:border-green-700",
                              });
                            } catch (error) {
                              toast({ title: <div className="flex items-center"><XCircle className="h-5 w-5 mr-2 text-red-500" />خطأ</div>, description: (error instanceof Error ? error.message : "يرجى التواصل معنا للمساعدة."), variant: "destructive" });
                            } finally { setIsLoading(false); }
                        }} disabled={isLoading}
                      >
                        {isLoading ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> جاري البحث...</> : "البحث بالبريد"}
                      </Button>
                    </div>
                  </TabsContent>
                  <TabsContent value="password">
                    <div className="space-y-5">
                      <div className="space-y-2">
                        <label htmlFor="recover-password" className="text-sm font-medium text-slate-300">
                          كلمة المرور الحالية
                        </label>
                        <Input id="recover-password" name="password" type="password" placeholder="أدخل كلمة المرور" className="text-right bg-slate-700/50 border-slate-600 placeholder:text-slate-500 text-slate-100 focus:border-primary focus:ring-2 focus:ring-primary/50 transition-all" required />
                      </div>
                      <Button className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-500/90 hover:to-cyan-500/90 text-white text-base py-3 shadow-lg hover:shadow-teal-500/40 transition-all duration-300 transform hover:scale-[1.02]"
                        onClick={async () => {
                            const passwordInput = document.getElementById('recover-password') as HTMLInputElement;
                            const password = passwordInput?.value;
                            if (!password) {
                              toast({ title: <div className="flex items-center"><XCircle className="h-5 w-5 mr-2 text-red-500" />خطأ</div>, description: "يرجى إدخال كلمة المرور", variant: "destructive" });
                              return;
                            }
                            setIsLoading(true);
                            try {
                              const users = await fetch('/user.json').then(res => { if (!res.ok) throw new Error('فشل تحميل بيانات المستخدمين (ملف تجريبي).'); return res.json(); });
                              const userFound = users.find((u: any) => u.password === password);
                              if (!userFound) {
                                toast({ title: <div className="flex items-center"><Info className="h-5 w-5 mr-2 text-amber-500" />لم يتم العثور على حساب</div>, description: "تأكد من كلمة المرور أو تواصل معنا.", variant: "default", duration: 4000, className: "bg-amber-50 border-amber-200 dark:bg-amber-900/30 dark:border-amber-700" });
                                setTimeout(() => window.open("https://t.me/qodratak2030", "_blank"), 4000);
                                return;
                              }
                              toast({
                                title: <div className="flex items-center"><CheckCircle2 className="h-5 w-5 mr-2 text-green-500"/>معلومات الحساب (تجريبي)</div>,
                                description: <div className="text-sm text-right">الاسم: {userFound.name}<br/>البريد: {userFound.email}<br/>المرور: {userFound.password} <br/><strong className="text-amber-500">(لا تعرض كلمة المرور هكذا في تطبيق حقيقي!)</strong></div>,
                                duration: 20000, className: "whitespace-pre-line text-right bg-green-50 border-green-200 dark:bg-green-900/30 dark:border-green-700",
                              });
                            } catch (error) {
                              toast({ title: <div className="flex items-center"><XCircle className="h-5 w-5 mr-2 text-red-500" />خطأ</div>, description: (error instanceof Error ? error.message : "يرجى التواصل معنا للمساعدة."), variant: "destructive" });
                            } finally { setIsLoading(false); }
                        }} disabled={isLoading}
                      >
                         {isLoading ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> جاري البحث...</> : "البحث بكلمة المرور"}
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ProfilePage;
