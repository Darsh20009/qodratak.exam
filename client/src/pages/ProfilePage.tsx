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
  Loader2, CheckCircle2, XCircle, Info, KeyRound, Mail
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
  name: string; // Preferred display name
  username?: string; // Fallback or actual username if different from email
  email?: string; // User's email
  points: number;
  level: number;
  subscription: UserSubscription;
  // Add other fields that come from your API like tests_completed, average_score etc.
  tests_completed?: number;
  average_score?: string;
  challenges_won?: number;
}


const achievementsData = [
  { id: 1, name: "المتسابق النشيط", description: "أكملت 5 اختبارات بنجاح", icon: <Trophy className="h-6 w-6 text-yellow-500" />, color: "yellow" },
  { id: 2, name: "نجم المعرفة", description: "حققت علامة كاملة في اختبار صعب", icon: <Star className="h-6 w-6 text-amber-500" />, color: "amber" },
  { id: 3, name: "روح المثابرة", description: "أجريت 3 اختبارات في يوم واحد", icon: <Award className="h-6 w-6 text-orange-500" />, color: "orange" },
  // Add more creative achievements
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

  // --- API Handlers with Creative Toasts ---
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

  // --- Logged In View ---
  if (isLoggedIn && user) {
    const achievementProgress = (achievementsData.filter(ach => user.points >= (ach.id * 100)).length / achievementsData.length) * 100; // Example logic

    return (
      <div className="container py-8 px-4 mx-auto animate-fade-in-up">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Summary Card */}
          <Card className="lg:col-span-1 overflow-hidden group/profile-card hover:shadow-2xl transition-all duration-500 bg-card border rounded-xl">
            <div className="h-40 bg-gradient-to-br from-primary/80 via-primary/50 to-primary/30 relative group-hover/profile-card:scale-[1.03] transition-transform duration-700">
                <div className="absolute inset-0 bg-gradient-conic from-primary/10 via-transparent to-primary/0 animate-spin-slow opacity-60"/>
            </div>
            <CardHeader className="text-center relative z-10 -mt-20">
              <div className="relative w-32 h-32 mx-auto">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary to-accent p-1 shadow-lg mx-auto ring-4 ring-background group-hover/profile-card:scale-105 transition-transform duration-300">
                    <img src={`https://api.dicebear.com/7.x/avataaars-neutral/svg?seed=${user.email || user.name}`} alt="User Avatar" className="w-full h-full rounded-full object-cover" />
                </div>
                <Badge className="absolute -bottom-1 right-1/2 transform translate-x-1/2 translate-y-1/2 bg-gradient-to-r from-yellow-400 to-amber-500 text-white px-3 py-1 text-xs shadow-md">
                  مستوى {user.level}
                </Badge>
              </div>
              <CardTitle className="text-3xl mt-6 font-bold tracking-tight">{user.name}</CardTitle>
              <CardDescription className="flex flex-col items-center gap-2 mt-2 text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={`border-2 ${user.subscription?.type === 'Pro Live' ? 'border-purple-500 text-purple-600 bg-purple-500/10' : user.subscription?.type === 'Pro' ? 'border-green-500 text-green-600 bg-green-500/10' : 'border-gray-400 text-gray-500 bg-gray-500/10'}`}>
                    {user.subscription?.type || 'عضو مجاني'}
                  </Badge>
                  {user.subscription?.type === 'Pro Live' ? (
                    <span className="text-sm text-purple-600">اشتراك مدى الحياة ✨</span>
                  ) : user.subscription?.type === 'Pro' && user.subscription.endDate ? (
                    <>
                      <span className="text-muted-foreground">•</span>
                      {(() => {
                        const endDate = new Date(user.subscription.endDate as string);
                        const today = new Date();
                        const daysLeft = Math.max(0, Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
                        const formattedDate = new Intl.DateTimeFormat('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' }).format(endDate);
                        return (
                          <div className="flex flex-col items-center">
                            <span className="text-xs text-muted-foreground">ينتهي في {formattedDate}</span>
                            <Badge variant={daysLeft <= 7 ? 'destructive' : 'outline'} className="mt-1 text-xs">
                              {daysLeft > 0 ? `متبقي ${daysLeft} يوم` : "منتهي"}
                            </Badge>
                          </div>
                        );
                      })()}
                    </>
                  ) : (
                     user.subscription?.type !== 'Pro Live' && <span className="text-sm text-gray-500">مميزات محدودة</span>
                  )}
                </div>
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2 pb-6 px-6">
              <div className="space-y-5">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">تقدم الإنجازات:</span>
                    <span className="font-medium text-primary">{Math.round(achievementProgress)}%</span>
                  </div>
                  <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-sky-500 to-indigo-500 rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${achievementProgress}%` }}
                    ></div>
                  </div>
                </div>

                <div className="pt-4">
                  <h4 className="font-semibold text-lg mb-3 text-center">إحصائياتي</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "النقاط", value: user.points, icon: <Star className="w-4 h-4 text-yellow-500" /> },
                      { label: "الاختبارات", value: user.tests_completed || 0, icon: <BookOpen className="w-4 h-4 text-blue-500" /> },
                      { label: "المتوسط", value: user.average_score || "N/A", icon: <Trophy className="w-4 h-4 text-green-500" /> },
                      { label: "التحديات", value: user.challenges_won || 0, icon: <Award className="w-4 h-4 text-red-500" /> }
                    ].map(stat => (
                      <div key={stat.label} className="bg-card-foreground/5 dark:bg-card-foreground/10 rounded-lg p-3 text-center group/stat hover:shadow-md hover:scale-105 transition-all duration-300 cursor-pointer">
                        <div className="flex items-center justify-center gap-1.5 text-2xl font-bold text-primary mb-1 group-hover/stat:text-sky-500 transition-colors">
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
              <Button onClick={handleLogout} variant="ghost" className="w-full text-red-500 hover:bg-red-500/10 hover:text-red-600">
                <Loader2 className="w-4 h-4 mr-2 animate-spin hidden" /> {/* Add logic to show spinner on logout click */}
                تسجيل الخروج
              </Button>
            </CardFooter>
          </Card>

          {/* Activity and Achievements */}
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
                      className={`border rounded-xl p-4 text-center group/achieve hover:shadow-xl hover:-translate-y-1 transition-all duration-300 bg-card achievement-unlocked`} // Add 'achievement-unlocked' if user earned it
                      // Example: style={user.achievements.includes(achievement.id) ? { borderColor: `var(--color-${achievement.color}-500)`} : {}}
                    >
                      <div className={`w-16 h-16 bg-${achievement.color}-500/10 rounded-full mx-auto flex items-center justify-center mb-3 transition-transform duration-300 group-hover/achieve:scale-110 ring-4 ring-${achievement.color}-500/20`}>
                        {React.cloneElement(achievement.icon, { className: `h-8 w-8 text-${achievement.color}-500`})}
                      </div>
                      <h4 className="font-semibold text-md">{achievement.name}</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        {achievement.description}
                      </p>
                       {/* Add a progress or unlocked badge if applicable */}
                       {/* Example: {user.achievements.includes(achievement.id) ? <Badge className={`mt-2 bg-${achievement.color}-500 text-white`}>مُكتسب</Badge> : <Badge className="mt-2" variant="outline">مُقفل</Badge>} */}
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

  // --- Not Logged In View (Auth Forms) ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 text-gray-100 relative overflow-hidden flex items-center justify-center p-4">
      {/* Background Visuals - Creative */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_50%_100px,rgba(var(--color-primary-rgb),0.15),transparent_80%)] animate-pulse-slow" />
        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-primary/10 via-primary/5 to-transparent" />
        {[...Array(15)].map((_, i) => ( // Fewer, more impactful shapes
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
              filter: `blur(${Math.random() * 5 + 2}px)`, // Slightly more blur
              opacity: Math.random() * 0.2 + 0.05 // More subtle opacity
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

          {/* Login Tab */}
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

          {/* Register Tab */}
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

          {/* Recover Tab */}
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
                        onClick={async () => { /* ... (account recovery logic as before, with isLoading) ... */ 
                            const emailInput = document.getElementById('recover-email') as HTMLInputElement;
                            const email = emailInput?.value;
                            if (!email) {
                              toast({ title: <div className="flex items-center"><XCircle className="h-5 w-5 mr-2 text-red-500" />خطأ</div>, description: "يرجى إدخال البريد الإلكتروني", variant: "destructive" });
                              return;
                            }
                            setIsLoading(true);
                            try {
                              const response = await fetch('/user.json'); // Ensure this path is correct
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
                  {/* ... (Password recovery tab similar, with creative button and loading) ... */}
                  <TabsContent value="password">
                    <div className="space-y-5">
                      <div className="space-y-2">
                        <label htmlFor="recover-password" className="text-sm font-medium text-slate-300">
                          كلمة المرور الحالية
                        </label>
                        <Input id="recover-password" name="password" type="password" placeholder="أدخل كلمة المرور" className="text-right bg-slate-700/50 border-slate-600 placeholder:text-slate-500 text-slate-100 focus:border-primary focus:ring-2 focus:ring-primary/50 transition-all" required />
                      </div>
                      <Button className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-500/90 hover:to-cyan-500/90 text-white text-base py-3 shadow-lg hover:shadow-teal-500/40 transition-all duration-300 transform hover:scale-[1.02]"
                        onClick={async () => { /* ... (account recovery logic as before, with isLoading) ... */ 
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