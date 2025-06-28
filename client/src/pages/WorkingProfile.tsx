import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { 
  DiamondIcon, 
  User, 
  Trophy, 
  Star, 
  Crown,
  Zap,
  Rocket,
  ArrowRightIcon,
  LogOut,
  UserPlus,
  Settings,
  RefreshCw
} from "lucide-react";

export default function WorkingProfile() {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = () => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
      } catch (error) {
        console.error("Error parsing user data:", error);
        createNewUser();
      }
    } else {
      createNewUser();
    }
    setIsLoading(false);
  };

  const createNewUser = () => {
    const guestNames = [
      "ضيف كريم", "زائر محترم", "مستخدم نشط", "طالب متميز", "باحث ذكي",
      "مفكر مبدع", "عقل نابغ", "دارس مجتهد", "متعلم شغوف", "مبدع موهوب"
    ];
    
    const randomName = guestNames[Math.floor(Math.random() * guestNames.length)];
    
    const newUser = {
      id: Date.now(),
      name: randomName,
      email: "guest@qudratak.app",
      subscription: {
        type: "Free",
        status: "active",
        expiresAt: "2030-12-31T23:59:59Z"
      },
      points: Math.floor(Math.random() * 1000) + 500,
      level: Math.floor(Math.random() * 5) + 3,
      achievements: Math.floor(Math.random() * 8) + 5,
      testsTaken: Math.floor(Math.random() * 20) + 5,
      averageScore: Math.floor(Math.random() * 40) + 60
    };
    localStorage.setItem("user", JSON.stringify(newUser));
    setUser(newUser);
    
    // إرسال حدث لتحديث باقي التطبيق
    window.dispatchEvent(new CustomEvent('userLoggedIn', { detail: newUser }));
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    
    // توجيه المستخدم لصفحة تسجيل الدخول
    window.location.href = "/login";
  };

  const handleLogin = () => {
    createNewUser();
  };

  const handlePremiumLogin = () => {
    const premiumUser = {
      id: Date.now(),
      name: `عميل مميز ${Date.now().toString().slice(-4)}`,
      email: "premium@qudratak.app",
      subscription: {
        type: Math.random() > 0.5 ? "Pro" : "Pro Life",
        status: "active",
        expiresAt: "2030-12-31T23:59:59Z"
      },
      points: Math.floor(Math.random() * 5000) + 2000,
      level: Math.floor(Math.random() * 15) + 10,
      achievements: Math.floor(Math.random() * 20) + 10
    };
    localStorage.setItem("user", JSON.stringify(premiumUser));
    setUser(premiumUser);
    
    // إرسال حدث لتحديث باقي التطبيق
    window.dispatchEvent(new CustomEvent('userLoggedIn', { detail: premiumUser }));
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 text-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
        <p className="mt-4">جاري التحميل...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto p-6 text-center space-y-6">
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-8 rounded-3xl text-white">
          <h2 className="text-3xl font-bold mb-4">مرحباً بك في قدراتك</h2>
          <p className="text-blue-100 mb-6">ابدأ رحلتك نحو التميز الآن</p>
          <Button 
            onClick={handleLogin} 
            size="lg"
            className="bg-white text-blue-600 hover:bg-gray-100 font-bold"
          >
            <UserPlus className="w-5 h-5 mr-2" />
            بدء الاستخدام
          </Button>
        </div>
      </div>
    );
  }

  const subscriptionType = typeof user.subscription === 'string' 
    ? user.subscription 
    : user.subscription?.type || 'Free';

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl p-8 text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600">
        <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent"></div>
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
        <div className="relative z-10 flex items-center justify-between">
          <div className="space-y-3">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-cyan-200 bg-clip-text text-transparent">
              مرحباً {user.name}! 
            </h1>
            <div className="flex items-center gap-2">
              <Rocket className="w-5 h-5 text-cyan-200" />
              <p className="text-cyan-100 text-lg font-medium">
                جميع الميزات متاحة مجاناً للجميع! 
              </p>
            </div>
            <div className="flex items-center gap-4 text-sm text-cyan-200">
              <span className="flex items-center gap-1">
                <Star className="w-4 h-4" />
                التعليم حق للجميع
              </span>
              <span className="flex items-center gap-1">
                <Zap className="w-4 h-4" />
                بدون قيود أو حدود
              </span>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center animate-bounce">
                <Crown className="w-10 h-10 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-400 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">∞</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* User Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/20">
          <CardContent className="p-6 text-center">
            <User className="w-8 h-8 mx-auto mb-3 text-blue-500" />
            <h3 className="font-bold text-lg">{user.name}</h3>
            <Badge className="mt-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white">
              <Crown className="w-3 h-3 mr-1" />
              {subscriptionType === 'Free' ? 'مستخدم مجاني' : subscriptionType}
            </Badge>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/20">
          <CardContent className="p-6 text-center">
            <Star className="w-8 h-8 mx-auto mb-3 text-purple-500" />
            <h3 className="font-bold text-lg">{user.points || 1000}</h3>
            <p className="text-sm text-muted-foreground">نقطة</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-500/20">
          <CardContent className="p-6 text-center">
            <Trophy className="w-8 h-8 mx-auto mb-3 text-green-500" />
            <h3 className="font-bold text-lg">المستوى {user.level || 10}</h3>
            <p className="text-sm text-muted-foreground">خبير</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 border-orange-500/20">
          <CardContent className="p-6 text-center">
            <Zap className="w-8 h-8 mx-auto mb-3 text-orange-500" />
            <h3 className="font-bold text-lg">{user.achievements || 5}</h3>
            <p className="text-sm text-muted-foreground">إنجاز</p>
          </CardContent>
        </Card>
      </div>

      {/* Features Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Rocket className="w-6 h-6 text-blue-500" />
            الميزات المتاحة لك
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 p-6 rounded-2xl border border-green-200 dark:border-green-700">
              <h4 className="font-bold text-green-700 dark:text-green-400 mb-4 text-lg flex items-center gap-2">
                <Star className="w-5 h-5" />
                🌟 جميع الميزات متاحة مجاناً!
              </h4>
              <p className="text-green-600 dark:text-green-300 mb-4 text-sm">
                نؤمن في قدراتك أن التعليم حق للجميع. لذلك جميع ميزاتنا المتقدمة متاحة مجاناً لكل المستخدمين!
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                  <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="font-medium">🚀 اختبارات غير محدودة</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                  <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
                  <span className="font-medium">🧠 المساعد الذكي المتقدم</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="font-medium">⏰ إدارة الوقت الشاملة</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20">
                  <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
                  <span className="font-medium">📚 المكتبة الكاملة</span>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-pink-50 dark:bg-pink-900/20">
                  <div className="w-3 h-3 bg-pink-500 rounded-full animate-pulse"></div>
                  <span className="font-medium">🎮 التحديات والألعاب</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-indigo-50 dark:bg-indigo-900/20">
                  <div className="w-3 h-3 bg-indigo-500 rounded-full animate-pulse"></div>
                  <span className="font-medium">📊 تحليلات مفصلة</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-teal-50 dark:bg-teal-900/20">
                  <div className="w-3 h-3 bg-teal-500 rounded-full animate-pulse"></div>
                  <span className="font-medium">📁 المجلدات المخصصة</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-cyan-50 dark:bg-cyan-900/20">
                  <div className="w-3 h-3 bg-cyan-500 rounded-full animate-pulse"></div>
                  <span className="font-medium">📱 تحميل التطبيق</span>
                </div>
              </div>
            </div>

            {subscriptionType !== 'Free' && (
              <div className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 p-4 rounded-xl border border-amber-200 dark:border-amber-700">
                <p className="text-amber-700 dark:text-amber-300 text-sm text-center flex items-center justify-center gap-2">
                  <Crown className="w-4 h-4" />
                  شكراً لدعمك! أنت من العملاء المميزين الذين يساعدوننا في توفير التعليم المجاني للجميع
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/qiyas">
          <Button className="w-full h-16 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white text-lg font-bold">
            ابدأ اختبار قياس
            <ArrowRightIcon className="w-5 h-5 mr-2" />
          </Button>
        </Link>
        <Link href="/install">
          <Button variant="outline" className="w-full h-16 border-2 text-lg font-bold hover:bg-muted">
            تحميل التطبيق
            <ArrowRightIcon className="w-5 h-5 mr-2" />
          </Button>
        </Link>
      </div>

      {/* Account Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-6 h-6 text-gray-500" />
            إدارة الحساب
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Account Type Buttons */}
            {subscriptionType === 'Free' && (
              <div className="space-y-3">
                <h4 className="font-semibold text-sm">تسجيل دخول العملاء المميزين</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Link href="/login">
                    <Button 
                      className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white h-12"
                    >
                      <Crown className="w-5 h-5 mr-2" />
                      دخول عميل Pro / Pro Life
                    </Button>
                  </Link>
                  <Button 
                    onClick={handleLogin}
                    variant="outline" 
                    className="flex items-center gap-2 h-12"
                  >
                    <RefreshCw className="w-5 h-5" />
                    حساب مجاني جديد
                  </Button>
                </div>
              </div>
            )}
            
            {/* General Account Management */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm">عمليات الحساب</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {subscriptionType !== 'Free' && (
                  <Button 
                    onClick={handlePremiumLogin}
                    variant="outline" 
                    className="flex items-center gap-2 h-12"
                  >
                    <RefreshCw className="w-5 h-5" />
                    حساب مميز جديد
                  </Button>
                )}
                <Button 
                  onClick={() => window.location.reload()}
                  variant="outline" 
                  className="flex items-center gap-2 h-12"
                >
                  <RefreshCw className="w-5 h-5" />
                  تحديث البيانات
                </Button>
                <Button 
                  onClick={handleLogout}
                  variant="destructive" 
                  className="flex items-center gap-2 h-12"
                >
                  <LogOut className="w-5 h-5" />
                  تسجيل خروج
                </Button>
              </div>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground text-center">
              {subscriptionType === 'Free' 
                ? 'في قدراتك نؤمن أن التعليم حق للجميع! جميع الميزات متاحة مجاناً للمستخدمين الأحرار.'
                : 'شكراً لدعمك! مساهمتك تساعدنا في الحفاظ على المنصة مجانية للجميع.'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}