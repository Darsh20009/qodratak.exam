import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, Crown, ArrowRight, Star } from "lucide-react";
import { Link } from "wouter";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiresPremium?: boolean;
  showUpgrade?: boolean;
}

export default function ProtectedRoute({ 
  children, 
  requiresPremium = false,
  showUpgrade = true 
}: ProtectedRouteProps) {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Error parsing user:", error);
      }
    }

    // Listen for user changes
    const handleUserChange = (event: any) => {
      setUser(event.detail);
    };

    window.addEventListener('userLoggedIn', handleUserChange);
    return () => window.removeEventListener('userLoggedIn', handleUserChange);
  }, []);

  if (!user) {
    return (
      <div className="container mx-auto p-6 text-center space-y-6">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-8">
            <Lock className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-bold mb-2">تسجيل الدخول مطلوب</h2>
            <p className="text-muted-foreground mb-6">
              يرجى تسجيل الدخول للوصول لهذه الصفحة
            </p>
            <div className="space-y-3">
              <Link href="/login">
                <Button className="w-full">تسجيل دخول</Button>
              </Link>
              <Link href="/guest-signup">
                <Button variant="outline" className="w-full">إنشاء حساب مجاني</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const subscriptionType = typeof user.subscription === 'string' 
    ? user.subscription 
    : user.subscription?.type || 'Free';

  const isPremium = subscriptionType === 'Pro' || subscriptionType === 'Pro Life' || subscriptionType === 'Pro Live';

  if (requiresPremium && !isPremium && showUpgrade) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        {/* Premium Required Banner */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-8 rounded-3xl text-white text-center">
          <Crown className="w-16 h-16 mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-4">ميزة مخصصة للعملاء المميزين</h1>
          <p className="text-blue-100 mb-6 text-lg">
            هذه الصفحة متاحة فقط لمشتركي الخطط المدفوعة. قم بالترقية للاستمتاع بجميع الميزات المتقدمة
          </p>
        </div>

        {/* Current vs Premium Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Current Plan */}
          <Card className="border-gray-300">
            <CardHeader className="text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Lock className="w-6 h-6 text-gray-500" />
              </div>
              <CardTitle className="text-gray-600">خطتك الحالية - مجاني</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>5 اختبارات قياس يومياً</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>إدارة الوقت الأساسية</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>تحميل التطبيق</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Premium Plan */}
          <Card className="border-2 border-blue-500 shadow-lg">
            <CardHeader className="text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-2">
                <Crown className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-blue-600">الخطط المدفوعة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span className="font-medium">اختبارات غير محدودة</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span className="font-medium">المساعد الذكي المتقدم</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span className="font-medium">المكتبة الشاملة</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span className="font-medium">التحليلات المفصلة</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span className="font-medium">المجلدات المخصصة</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span className="font-medium">التحديات والألعاب</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link href="/subscription">
            <Button className="w-full h-16 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white text-lg font-bold">
              عرض خطط الاشتراك
              <ArrowRight className="w-5 h-5 mr-2" />
            </Button>
          </Link>
          <Link href="/">
            <Button variant="outline" className="w-full h-16 border-2 text-lg font-bold">
              العودة للصفحة الرئيسية
            </Button>
          </Link>
        </div>

        {/* Contact Support */}
        <Card className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border-green-200 dark:border-green-700">
          <CardContent className="p-6 text-center">
            <h3 className="font-bold text-green-700 dark:text-green-400 mb-2">
              تحتاج مساعدة؟
            </h3>
            <p className="text-green-600 dark:text-green-300 text-sm mb-4">
              تواصل معنا عبر الواتساب وسنساعدك في اختيار الخطة المناسبة
            </p>
            <Button 
              className="bg-green-500 hover:bg-green-600 text-white"
              onClick={() => window.open('https://t.me/qodratak2030', '_blank')}
            >
              تواصل معنا
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Allow access
  return <>{children}</>;
}