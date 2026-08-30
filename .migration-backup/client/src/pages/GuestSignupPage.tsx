import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { 
  User, 
  ArrowRight, 
  CheckCircle,
  Lock,
  Timer,
  Download
} from "lucide-react";

export default function GuestSignupPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال اسمك",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    // إنشاء حساب مجاني
    const guestUser = {
      id: Date.now(),
      name: name.trim(),
      email: "guest@qudratak.app",
      subscription: {
        type: "Free",
        status: "active",
        expiresAt: "2030-12-31T23:59:59Z"
      },
      points: 0,
      level: 1,
      achievements: 0,
      testsTaken: 0,
      averageScore: 0
    };
    
    localStorage.setItem("user", JSON.stringify(guestUser));
    window.dispatchEvent(new CustomEvent('userLoggedIn', { detail: guestUser }));
    
    toast({
      title: "أهلاً وسهلاً " + name,
      description: "تم إنشاء حسابك المجاني بنجاح!",
      variant: "default",
    });
    
    setTimeout(() => {
      setLocation("/");
    }, 1000);
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center mx-auto">
            <User className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
            ابدأ مجاناً
          </h1>
          <p className="text-xl text-muted-foreground">
            جرب منصة قدراتك مجاناً واكتشف الفرق
          </p>
        </div>

        {/* Free Features */}
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-700">
          <CardHeader>
            <CardTitle className="text-green-700 dark:text-green-400 flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              ما ستحصل عليه مجاناً
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 rounded-xl bg-white/70 dark:bg-black/30">
                <CheckCircle className="w-6 h-6 text-green-500" />
                <div>
                  <p className="font-bold text-lg">اختبار قياس مجاني يومياً</p>
                  <p className="text-sm text-muted-foreground">تجربة اختبار قياس كامل كل يوم</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 p-4 rounded-xl bg-white/70 dark:bg-black/30">
                <Timer className="w-6 h-6 text-blue-500" />
                <div>
                  <p className="font-bold text-lg">أدوات إدارة الوقت</p>
                  <p className="text-sm text-muted-foreground">تنظيم وقتك وتتبع تقدمك</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 p-4 rounded-xl bg-white/70 dark:bg-black/30">
                <Download className="w-6 h-6 text-green-700" />
                <div>
                  <p className="font-bold text-lg">الوصول من أي جهاز</p>
                  <p className="text-sm text-muted-foreground">استخدم المنصة على الكمبيوتر والهاتف</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Premium Features Preview */}
        <Card className="bg-gradient-to-r from-blue-50 to-emerald-600 dark:from-blue-900/20 dark:to-emerald-600/20 border-blue-200 dark:border-blue-700">
          <CardHeader>
            <CardTitle className="text-blue-700 dark:text-blue-400 flex items-center gap-2">
              <Lock className="w-5 h-5" />
              الميزات المتقدمة (Pro & Pro Life)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
              <div>• اختبارات غير محدودة</div>
              <div>• المساعد الذكي المتقدم</div>
              <div>• المكتبة الشاملة</div>
              <div>• التحديات والألعاب</div>
              <div>• التحليلات المفصلة</div>
              <div>• المجلدات المخصصة</div>
            </div>
            <div className="mt-4 p-3 bg-white/50 dark:bg-black/20 rounded-lg text-center">
              <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                يمكنك الترقية لاحقاً للوصول لجميع الميزات المتقدمة
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Signup Form */}
        <Card>
          <CardHeader>
            <CardTitle>معلوماتك الأساسية</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">الاسم الكامل</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="أدخل اسمك الكامل"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="text-lg p-3"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-lg font-bold"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                ) : (
                  <ArrowRight className="w-5 h-5 mr-2" />
                )}
                إنشاء حساب مجاني
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Back to Login */}
        <div className="text-center">
          <p className="text-muted-foreground">
            لديك حساب مدفوع؟{" "}
            <button 
              onClick={() => setLocation("/login")}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              تسجيل دخول
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}