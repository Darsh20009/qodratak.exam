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
    const newUser = {
      id: Date.now(),
      name: `مستخدم ${Date.now().toString().slice(-4)}`,
      email: "user@qudratak.app",
      subscription: {
        type: "Free",
        status: "active",
        expiresAt: "2030-12-31T23:59:59Z"
      },
      points: Math.floor(Math.random() * 500) + 100,
      level: Math.floor(Math.random() * 3) + 1,
      achievements: Math.floor(Math.random() * 3) + 1
    };
    localStorage.setItem("user", JSON.stringify(newUser));
    setUser(newUser);
    
    // إرسال حدث لتحديث باقي التطبيق
    window.dispatchEvent(new CustomEvent('userLoggedIn', { detail: newUser }));
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    
    // إنشاء مستخدم جديد فوراً
    setTimeout(() => {
      createNewUser();
    }, 500);
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
    : user.subscription?.type || 'Pro Life';

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Welcome Banner */}
      <div className={`relative overflow-hidden rounded-3xl p-8 text-white ${
        subscriptionType === 'Free' 
          ? 'bg-gradient-to-r from-gray-600 via-slate-600 to-gray-600' 
          : 'bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600'
      }`}>
        <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent"></div>
        <div className="relative z-10 flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">مرحباً {user.name}!</h1>
            <p className={subscriptionType === 'Free' ? "text-gray-200" : "text-blue-100"}>
              {subscriptionType === 'Free' 
                ? 'حساب مجاني - قم بالترقية للمزيد من الميزات' 
                : 'جميع الميزات المتقدمة متاحة لك'}
            </p>
          </div>
          <div className="hidden md:block">
            {subscriptionType === 'Free' ? (
              <User className="w-16 h-16 text-gray-300" />
            ) : (
              <DiamondIcon className="w-16 h-16 text-yellow-300 animate-pulse" />
            )}
          </div>
        </div>
      </div>

      {/* User Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/20">
          <CardContent className="p-6 text-center">
            <User className="w-8 h-8 mx-auto mb-3 text-blue-500" />
            <h3 className="font-bold text-lg">{user.name}</h3>
            <Badge className="mt-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
              <Crown className="w-3 h-3 mr-1" />
              {subscriptionType}
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
            {subscriptionType === 'Free' ? 'الميزات والاشتراكات' : 'الميزات المتاحة لك'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {subscriptionType === 'Free' ? (
            <div className="space-y-6">
              {/* Free Features */}
              <div>
                <h4 className="font-semibold text-green-600 mb-3">✓ الميزات المجانية المتاحة</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">5 اختبارات يومياً</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">الاختبارات الأساسية</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">إدارة الوقت الأساسية</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">تحميل التطبيق</span>
                  </div>
                </div>
              </div>

              {/* Premium Features */}
              <div>
                <h4 className="font-semibold text-orange-600 mb-3">🔒 الميزات المتقدمة (Pro & Pro Life)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span className="text-sm text-muted-foreground">وصول غير محدود للاختبارات</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span className="text-sm text-muted-foreground">المساعد الذكي المتقدم</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span className="text-sm text-muted-foreground">تحليلات مفصلة للأداء</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span className="text-sm text-muted-foreground">المجلدات المخصصة</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span className="text-sm text-muted-foreground">التحديات والألعاب المتقدمة</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span className="text-sm text-muted-foreground">المكتبة الشاملة</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>وصول غير محدود لجميع الاختبارات</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>المساعد الذكي لحل الأسئلة</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>إدارة الوقت والمهام المتقدمة</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>المكتبة الشاملة</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>التحديات والألعاب</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>تقارير مفصلة للأداء</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>المجلدات المخصصة</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>تحميل التطبيق</span>
                </div>
              </div>
            </div>
          )}
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
                  <Button 
                    onClick={handlePremiumLogin}
                    className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white h-12"
                  >
                    <Crown className="w-5 h-5 mr-2" />
                    دخول عميل Pro / Pro Life
                  </Button>
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
                  تغيير نوع الحساب
                </Button>
              </div>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground text-center">
              {subscriptionType === 'Free' 
                ? 'الحساب المجاني يتضمن ميزات أساسية. قم بتسجيل الدخول كعميل مميز للوصول لجميع الميزات المتقدمة.'
                : 'حسابك المميز يتيح لك الوصول لجميع الميزات المتقدمة في المنصة.'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}