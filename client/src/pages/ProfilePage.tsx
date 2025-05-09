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
    setIsLoading(true);
    try {
      // In a real app, this would be an API call
      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username: data.username }),
      });

      if (!response.ok) {
        throw new Error("فشل تسجيل الدخول");
      }

      const userData = await response.json();
      
      // In this simple demo, we just check if the username matches the password
      if (data.password !== userData.password) {
        throw new Error("كلمة المرور غير صحيحة");
      }
      
      // Store user in localStorage
      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);
      setIsLoggedIn(true);
      
      toast({
        title: "تم تسجيل الدخول بنجاح",
        description: `مرحباً، ${userData.username}!`,
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
      // In a real app, this would be an API call
      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username: data.username, password: data.password }),
      });

      if (!response.ok) {
        throw new Error("فشل إنشاء الحساب");
      }

      const userData = await response.json();
      
      // Store user in localStorage
      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);
      setIsLoggedIn(true);
      
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
      <div className="container py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Profile Summary */}
          <Card className="md:col-span-1">
            <CardHeader className="text-center">
              <div className="w-24 h-24 rounded-full bg-primary/10 mx-auto flex items-center justify-center mb-4">
                <User className="h-12 w-12 text-primary" />
              </div>
              <CardTitle className="text-2xl">{user.username}</CardTitle>
              <CardDescription>
                المستوى {user.level} • {user.points} نقطة
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
                
                <div className="pt-4">
                  <h4 className="font-medium mb-2">الإحصائيات</h4>
                  <div className="grid grid-cols-2 gap-y-2">
                    <div className="text-sm text-muted-foreground">النقاط:</div>
                    <div className="text-sm text-right">{user.points}</div>
                    <div className="text-sm text-muted-foreground">المستوى:</div>
                    <div className="text-sm text-right">{user.level}</div>
                    <div className="text-sm text-muted-foreground">عدد الاختبارات:</div>
                    <div className="text-sm text-right">8</div>
                    <div className="text-sm text-muted-foreground">متوسط العلامات:</div>
                    <div className="text-sm text-right">78%</div>
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {achievements.map((achievement) => (
                    <div
                      key={achievement.id}
                      className="border rounded-lg p-4 text-center"
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
    <div className="container max-w-md py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">الملف الشخصي</h1>
      
      <Tabs defaultValue="login">
        <TabsList className="w-full mb-6">
          <TabsTrigger value="login" className="flex-1">تسجيل الدخول</TabsTrigger>
          <TabsTrigger value="register" className="flex-1">إنشاء حساب</TabsTrigger>
        </TabsList>
        
        <TabsContent value="login">
          <Card>
            <CardHeader>
              <CardTitle>تسجيل الدخول</CardTitle>
              <CardDescription>
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
                          <Input placeholder="أدخل اسم المستخدم" {...field} />
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
                          <Input type="password" placeholder="أدخل كلمة المرور" {...field} />
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
                          <Input placeholder="أدخل اسم المستخدم" {...field} />
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
                          <Input type="password" placeholder="أدخل كلمة المرور" {...field} />
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
      </Tabs>
    </div>
  );
};

export default ProfilePage;