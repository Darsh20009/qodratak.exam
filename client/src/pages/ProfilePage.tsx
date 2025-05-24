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
import { Trophy, Star, User, Award, BookOpen, ChevronRight } from "lucide-react";
import { Badge } from "../components/ui/badge";
import { GoogleAuth } from "@/components/GoogleAuth";

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
  }),
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

interface User {
  id: number;
  username: string;
  points: number;
  level: number;
}

const achievements = [
  { id: 1, name: "المتسابق", description: "أكملت 5 اختبارات", icon: <Trophy className="h-5 w-5" /> },
  { id: 2, name: "متعلم ممتاز", description: "حققت علامة كاملة في الاختبار", icon: <Star className="h-5 w-5" /> },
  { id: 3, name: "الإصرار", description: "أجريت 3 اختبارات متتالية", icon: <Award className="h-5 w-5" /> },
];

const recentActivity = [
  { id: 1, type: "اختبار", title: "اختبار في المستوى المتوسط", date: "منذ 3 أيام", score: "80%" },
  { id: 2, type: "بحث", title: "بحث عن أسئلة قياس", date: "منذ يومين" },
  { id: 3, type: "قياس", title: "قياس محاكاة", date: "منذ يوم", score: "75%" },
];

const ProfilePage: React.FC = () => {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setIsLoggedIn(true);
      } catch (e) {
        console.error("Error parsing stored user:", e);
      }
    }
  }, []);

  // Login form
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Register form
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onLoginSubmit = async (data: LoginFormValues) => {
    if (!data.username || !data.password) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال اسم المستخدم وكلمة المرور",
        variant: "destructive",
      });
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          email: data.username, 
          password: data.password 
        }),
      });

      if (!response.ok) {
        throw new Error("بيانات الدخول غير صحيحة");
      }

      const userData = await response.json();

      if (response.status === 403) {
        if (userData.isTrialExpired) {
          toast({
            title: "انتهت الفترة التجريبية",
            description: "يرجى الاشتراك للمتابعة واستخدام كامل المميزات",
            variant: "destructive",
          });
        } else {
          toast({
            title: "الاشتراك منتهي",
            description: "يرجى تجديد الاشتراك للمتابعة",
            variant: "destructive",
          });
        }
        return;
      }

      // Store user in localStorage
      localStorage.setItem("user", JSON.stringify(userData));
      // Trigger storage event manually since we're on the same page
      window.dispatchEvent(new Event('storage'));
      setUser(userData);
      setIsLoggedIn(true);
      localStorage.setItem("isLoggedIn", "true");

      // Broadcast login state
      window.dispatchEvent(new CustomEvent('userLoggedIn', { detail: userData }));

      toast({
        title: "تم تسجيل الدخول بنجاح",
        description: `مرحباً، ${userData.name}!`,
      });
    } catch (error) {
      toast({
        title: "خطأ في تسجيل الدخول",
        description: error instanceof Error ? error.message : "حدث خطأ غير معروف",
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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: data.username,
          email: data.username,
          password: data.password
        }),
      });

      if (!response.ok) {
        throw new Error("فشل إنشاء الحساب");
      }

      const userData = await response.json();

      // Store user in localStorage
      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);
      setIsLoggedIn(true);
      localStorage.setItem("isLoggedIn", "true");

      toast({
        title: "تم إنشاء الحساب بنجاح",
        description: `مرحباً، ${userData.username}!`,
      });
    } catch (error) {
      toast({
        title: "خطأ في إنشاء الحساب",
        description: error instanceof Error ? error.message : "حدث خطأ غير معروف",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    setIsLoggedIn(false);

    toast({
      title: "تم تسجيل الخروج بنجاح",
    });
  };

  // If logged in, show profile page
  if (isLoggedIn && user) {
    return (
      <div className="container py-8 px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Profile Summary */}
          <Card className="md:col-span-1 overflow-hidden group hover:shadow-xl transition-all duration-500">
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-primary/20 via-primary/30 to-primary/5 group-hover:scale-110 transition-transform duration-700" />
            <div className="absolute inset-0 bg-gradient-conic from-primary/0 via-primary/5 to-primary/0 animate-spin-slow opacity-50" />
            <CardHeader className="text-center relative z-10 pt-8">
              <div className="relative">
                <div className="w-28 h-28 rounded-full bg-gradient-to-br from-primary to-primary/60 mx-auto flex items-center justify-center mb-4 ring-4 ring-background transition-all duration-300 hover:scale-105">
                  <User className="h-14 w-14 text-primary-foreground" loading="lazy" />
                </div>
                <div className="absolute -bottom-2 right-1/2 transform translate-x-1/2">
                  <Badge className="bg-gradient-to-r from-yellow-500 to-amber-500 text-white">
                    مستوى {user.level}
                  </Badge>
                </div>
              </div>
              <CardTitle className="text-2xl mt-4">{user.name}</CardTitle>
              <CardDescription className="flex flex-col items-center gap-2 mt-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={user.subscription.type === 'Pro Live' ? 'bg-gradient-to-r from-primary/20 to-pink-500/20' : 'bg-primary/5'}>
                    {user.subscription.type}
                  </Badge>
                  {user.subscription.type === 'Pro Live' ? (
                    <span className="text-sm">اشتراك مدى الحياة</span>
                  ) : user.subscription.type === 'Pro' ? (
                    <>
                      <span>•</span>
                      {(() => {
                        const endDate = new Date(user.subscription.endDate);
                        const today = new Date();
                        const daysLeft = Math.max(0, Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
                        const formattedDate = new Intl.DateTimeFormat('ar-SA', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        }).format(endDate);

                        return (
                          <div className="flex flex-col items-center">
                            <span className="text-sm">ينتهي في {formattedDate}</span>
                            <Badge variant={daysLeft <= 7 ? 'destructive' : 'outline'} className="mt-1">
                              متبقي {daysLeft} يوم
                            </Badge>
                          </div>
                        );
                      })()}
                    </>
                  ) : (
                    <Badge variant="destructive">اشتراك مجاني</Badge>
                  )}
                </div>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">الإنجازات:</span>
                  <span className="text-sm font-medium">{achievements.length}/10</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${(achievements.length / 10) * 100}%` }}
                  ></div>
                </div>

                <div className="pt-6">
                  <h4 className="font-semibold text-lg mb-4">الإحصائيات</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-primary/5 rounded-xl p-4 text-center transform hover:scale-105 transition-transform duration-300">
                      <div className="text-2xl font-bold text-primary mb-1">{user.points}</div>
                      <div className="text-sm text-muted-foreground">النقاط</div>
                    </div>
                    <div className="bg-primary/5 rounded-xl p-4 text-center transform hover:scale-105 transition-transform duration-300">
                      <div className="text-2xl font-bold text-primary mb-1">8</div>
                      <div className="text-sm text-muted-foreground">الاختبارات</div>
                    </div>
                    <div className="bg-primary/5 rounded-xl p-4 text-center transform hover:scale-105 transition-transform duration-300">
                      <div className="text-2xl font-bold text-primary mb-1">78%</div>
                      <div className="text-sm text-muted-foreground">المتوسط</div>
                    </div>
                    <div className="bg-primary/5 rounded-xl p-4 text-center transform hover:scale-105 transition-transform duration-300">
                      <div className="text-2xl font-bold text-primary mb-1">3</div>
                      <div className="text-sm text-muted-foreground">التحديات</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleLogout} variant="outline" className="w-full">
                تسجيل الخروج
              </Button>
            </CardFooter>
          </Card>

          {/* Activity and Achievements */}
          <div className="md:col-span-2 space-y-6">
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>النشاط الأخير</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-md">
                      <div className="flex items-center gap-4">
                        {activity.type === "اختبار" ? (
                          <BookOpen className="h-5 w-5 text-blue-500" />
                        ) : activity.type === "قياس" ? (
                          <Trophy className="h-5 w-5 text-yellow-500" />
                        ) : (
                          <User className="h-5 w-5 text-green-500" />
                        )}
                        <div>
                          <h4 className="text-sm font-medium">{activity.title}</h4>
                          <p className="text-xs text-muted-foreground">{activity.date}</p>
                        </div>
                      </div>
                      {activity.score && (
                        <span className="text-sm font-medium">{activity.score}</span>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="ghost" className="w-full" onClick={() => setLocation("/abilities")}>
                  عرض المزيد <ChevronRight className="h-4 w-4 mr-2" />
                </Button>
              </CardFooter>
            </Card>

            {/* Achievements */}
            <Card>
              <CardHeader>
                <CardTitle>الإنجازات</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {achievements.map((achievement) => (
                    <div
                      key={achievement.id}
                      className="border rounded-lg p-3 text-center"
                    >
                      <div className="w-12 h-12 bg-primary/10 rounded-full mx-auto flex items-center justify-center mb-3">
                        {achievement.icon}
                      </div>
                      <h4 className="font-medium">{achievement.name}</h4>
                      <p className="text-xs text-muted-foreground">
                        {achievement.description}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // If not logged in, show login/register forms
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background relative overflow-hidden">
      {/* Enhanced animated background effects */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_1200px_at_100%_200px,var(--primary)/15%,transparent_100%)] animate-pulse-slow" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_1000px_at_0%_800px,var(--primary)/20%,transparent_100%)] animate-float" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_50%_50%,var(--primary)/10%,transparent_100%)] animate-pulse-slow" />
        <div className="absolute inset-0 bg-grid-white/5 bg-[size:30px_30px] [mask-image:radial-gradient(black,transparent_80%)]" />
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-primary/10 animate-float"
            style={{
              width: `${Math.random() * 100 + 20}px`,
              height: `${Math.random() * 100 + 20}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${Math.random() * 10 + 5}s`,
              filter: `blur(${Math.random() * 3}px)`,
              opacity: Math.random() * 0.3
            }}
          />
        ))}
      </div>
      <div className="container mx-auto p-4 relative z-10">
        <div className="max-w-md mx-auto">
        <Tabs defaultValue="login" className="animate-fade-in-up">
          <TabsList className="w-full mb-6 p-1 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <TabsTrigger value="login" className="flex-1 transition-all duration-300">تسجيل الدخول</TabsTrigger>
            <TabsTrigger value="register" className="flex-1 transition-all duration-300">إنشاء حساب</TabsTrigger>
            <TabsTrigger value="recover" className="flex-1 transition-all duration-300">استرداد الحساب</TabsTrigger>
          </TabsList>

        <TabsContent value="login">
          <Card className="border-0 shadow-lg bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <CardHeader>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                تسجيل الدخول
              </CardTitle>
              <CardDescription className="text-base">
                قم بتسجيل الدخول للوصول إلى حسابك واختباراتك
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-6">
                  <FormField
                    control={loginForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>اسم المستخدم</FormLabel>
                        <FormControl>
                          <Input 
                            dir="rtl"
                            className="text-right" 
                            placeholder="أدخل اسم المستخدم" 
                            {...field} 
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
                        <FormLabel>كلمة المرور</FormLabel>
                        <FormControl>
                          <Input 
                            dir="rtl"
                            className="text-right"
                            type="password" 
                            placeholder="أدخل كلمة المرور" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="register">
          <Card>
            <CardHeader>
              <CardTitle>إنشاء حساب</CardTitle>
              <CardDescription>
                أنشئ حسابك الجديد للوصول لجميع مميزات المنصة
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...registerForm}>
                <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-6">
                  <FormField
                    control={registerForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>اسم المستخدم</FormLabel>
                        <FormControl>
                          <Input 
                            dir="rtl"
                            className="text-right" 
                            placeholder="أدخل اسم المستخدم" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={registerForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>كلمة المرور</FormLabel>
                        <FormControl>
                          <Input 
                            dir="rtl"
                            className="text-right"
                            type="password" 
                            placeholder="أدخل كلمة المرور" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={registerForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>تأكيد كلمة المرور</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="أعد إدخال كلمة المرور" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "جاري إنشاء الحساب..." : "إنشاء حساب"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recover">
          <Card>
            <CardHeader>
              <CardTitle>استرداد الحساب</CardTitle>
              <CardDescription>
                يمكنك استرداد معلومات حسابك عن طريق البريد الإلكتروني أو كلمة المرور
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="email" className="w-full">
                <TabsList className="w-full mb-4">
                  <TabsTrigger value="email" className="flex-1">البريد الإلكتروني</TabsTrigger>
                  <TabsTrigger value="password" className="flex-1">كلمة المرور</TabsTrigger>
                </TabsList>

                <TabsContent value="email">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label htmlFor="recover-email" className="text-sm font-medium">البريد الإلكتروني</label>
                      <Input 
                        id="recover-email"
                        name="email" 
                        type="email" 
                        placeholder="أدخل بريدك الإلكتروني" 
                        required 
                      />
                    </div>
                    <Button 
                      className="w-full"
                      onClick={async () => {
                        const email = (document.getElementById('recover-email') as HTMLInputElement).value;
                        if (!email) {
                          toast({
                            title: "خطأ",
                            description: "يرجى إدخال البريد الإلكتروني",
                            variant: "destructive",
                          });
                          return;
                        }

                        try {
                          const response = await fetch('/attached_assets/user.json');
                          if (!response.ok) {
                            throw new Error('فشل في تحميل بيانات المستخدمين');
                          }
                          const users = await response.json();
                          const user = users.find((u: any) => u.email && u.email.toLowerCase() === email.toLowerCase());

                          if (!user) {
                            toast({
                              title: "خطأ",
                              description: "لم يتم العثور على حساب بهذا البريد الإلكتروني",
                              variant: "destructive",
                            });
                            window.location.href = "https://t.me/qodratak2030";
                            return;
                          }

                          toast({
                            title: "معلومات الحساب",
                            description: `الاسم: ${user.name}\nالبريد الإلكتروني: ${user.email}\nكلمة المرور: ${user.password}`,
                            duration: 10000,
                          });
                        } catch (error) {
                          toast({
                            title: "حدث خطأ",
                            description: "يرجى التواصل معنا على تليجرام للمساعدة",
                            variant: "destructive",
                            duration: 5000,
                          });
                          setTimeout(() => {
                            window.open("https://t.me/qodratak2030", "_blank");
                          }, 2000);
                        }
                      }}
                    >
                      عرض بيانات الحساب
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="password">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label htmlFor="recover-password" className="text-sm font-medium">كلمة المرور</label>
                      <Input 
                            dir="rtl"
                            className="text-right"
                        id="recover-password"
                        name="password" 
                        type="password" 
                        placeholder="أدخل كلمة المرور" 
                        required 
                      />
                    </div>
                    <Button 
                      className="w-full"
                      onClick={async () => {
                        const password = (document.getElementById('recover-password') as HTMLInputElement).value;
                        if (!password) {
                          toast({
                            title: "خطأ",
                            description: "يرجى إدخال كلمة المرور",
                            variant: "destructive",
                          });
                          return;
                        }

                        try {
                          const users = await fetch('/attached_assets/user.json').then(res => res.json());
                          const user = users.find((u: any) => u.password === password);

                          if (!user) {
                            toast({
                              title: "خطأ",
                              description: "لم يتم العثور على حساب بكلمة المرور هذه",
                              variant: "destructive",
                            });
                            window.location.href = "https://t.me/qodratak2030";
                            return;
                          }

                          toast({
                            title: "معلومات الحساب",
                            description: `الاسم: ${user.name}\nالبريد الإلكتروني: ${user.email}\nكلمة المرور: ${user.password}`,
                            duration: 10000,
                          });
                        } catch (error) {
                          toast({
                            title: "حدث خطأ",
                            description: "يرجى التواصل معنا على تليجرام للمساعدة",
                            variant: "destructive",
                            duration: 5000,
                          });
                          setTimeout(() => {
                            window.open("https://t.me/qodratak2030", "_blank");
                          }, 2000);
                        }
                      }}
                    >
                      عرض بيانات الحساب
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProfilePage;