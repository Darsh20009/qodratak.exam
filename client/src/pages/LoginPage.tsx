import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { 
  LogIn, 
  User, 
  Lock, 
  Crown, 
  Diamond,
  ArrowRight,
  UserPlus
} from "lucide-react";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        // حفظ بيانات المستخدم في localStorage
        localStorage.setItem("user", JSON.stringify(result));
        
        // إرسال حدث لتحديث باقي التطبيق
        window.dispatchEvent(new CustomEvent('userLoggedIn', { detail: result }));
        
        toast({
          title: "تم تسجيل الدخول بنجاح",
          description: `مرحباً ${result.name}!`,
          variant: "default",
        });
        
        // الانتقال للصفحة الرئيسية
        setLocation("/profile");
      } else {
        toast({
          title: "خطأ في تسجيل الدخول",
          description: result.message || "البريد الإلكتروني أو كلمة المرور غير صحيحة",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "خطأ في الاتصال",
        description: "حدث خطأ أثناء محاولة تسجيل الدخول",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestLogin = () => {
    setLocation("/guest-signup");
  };

  return (
    <div className="container mx-auto p-6 max-w-md">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto">
            <Crown className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold">تسجيل الدخول</h1>
          <p className="text-muted-foreground">ادخل بحسابك المميز للوصول لجميع الميزات</p>
        </div>

        {/* Login Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LogIn className="w-5 h-5 text-blue-500" />
              دخول العملاء المميزين
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="example@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">كلمة المرور</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  required
                />
              </div>

              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                ) : (
                  <Crown className="w-4 h-4 mr-2" />
                )}
                تسجيل الدخول
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Guest Login */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-gray-500" />
              الدخول كزائر
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                جرب المنصة مجاناً مع ميزات محدودة
              </p>
              <Button 
                onClick={handleGuestLogin}
                variant="outline" 
                className="w-full"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                دخول مجاني
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Features Comparison */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-semibold text-gray-600 mb-2">🆓 الحساب المجاني</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• 5 اختبارات يومياً</li>
                  <li>• ميزات أساسية</li>
                  <li>• إدارة وقت بسيطة</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-blue-600 mb-2">👑 الحساب المميز</h4>
                <ul className="space-y-1 text-blue-600">
                  <li>• اختبارات غير محدودة</li>
                  <li>• مساعد ذكي متقدم</li>
                  <li>• تحليلات مفصلة</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}