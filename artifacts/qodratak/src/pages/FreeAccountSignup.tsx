import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { 
  UserPlus, 
  Mail, 
  Lock, 
  User, 
  Shield,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  AlertTriangle,
  MessageCircle,
  Phone,
  Gift,
  Sparkles,
  Star,
  Zap,
  Loader2,
  Crown
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function FreeAccountSignup() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<"form" | "success">("form");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    username: ""
  });

  const validateForm = () => {
    if (!formData.username.trim()) {
      toast({
        title: "خطأ في التحقق",
        description: "يرجى إدخال اسم المستخدم",
        variant: "destructive"
      });
      return false;
    }

    if (formData.username.length < 3) {
      toast({
        title: "خطأ في التحقق",
        description: "اسم المستخدم يجب أن يكون 3 أحرف على الأقل",
        variant: "destructive"
      });
      return false;
    }

    if (!formData.email.trim()) {
      toast({
        title: "خطأ في التحقق",
        description: "يرجى إدخال البريد الإلكتروني",
        variant: "destructive"
      });
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast({
        title: "خطأ في التحقق",
        description: "يرجى إدخال بريد إلكتروني صحيح",
        variant: "destructive"
      });
      return false;
    }

    if (!formData.password.trim()) {
      toast({
        title: "خطأ في التحقق",
        description: "يرجى إدخال كلمة المرور",
        variant: "destructive"
      });
      return false;
    }

    if (formData.password.length < 6) {
      toast({
        title: "خطأ في التحقق",
        description: "كلمة المرور يجب أن تحتوي على 6 أرقام على الأقل",
        variant: "destructive"
      });
      return false;
    }

    if (!/^\d+$/.test(formData.password)) {
      toast({
        title: "خطأ في التحقق",
        description: "كلمة المرور يجب أن تحتوي على أرقام فقط",
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/signup-free', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        setStep("success");
        toast({
          title: "تم إرسال الطلب بنجاح!",
          description: result.message || "سيتم مراجعة حسابك وتفعيله خلال 24 ساعة",
          variant: "default",
        });

      } else {
        toast({
          title: "فشل في إرسال الطلب",
          description: result.message || "حدث خطأ أثناء إرسال طلب التسجيل",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Signup error:", error);
      toast({
        title: "خطأ في الاتصال",
        description: "حدث خطأ أثناء الاتصال بالخادم",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  if (step === "success") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-blue-50 dark:from-green-900/20 dark:via-emerald-900/20 dark:to-blue-900/20 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          {/* Success Animation */}
          <div className="text-center mb-8">
            <div className="relative mx-auto w-32 h-32 mb-6">
              <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full animate-pulse"></div>
              <div className="relative w-full h-full bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-2xl">
                <CheckCircle className="w-16 h-16 text-green-500 animate-bounce" />
              </div>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-4">
              تم إرسال طلبك بنجاح! 🎉
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              مرحباً بك في عائلة قدراتك المتميزة
            </p>
          </div>

          {/* Success Card */}
          <Card className="border-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 shadow-2xl">
            <CardContent className="p-8">
              <div className="space-y-6">
                {/* Next Steps */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center">
                      <MessageCircle className="w-4 h-4 text-blue-600" />
                    </div>
                    <h3 className="font-bold text-lg">الخطوات التالية:</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <Clock className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="font-semibold text-sm">مراجعة سريعة</p>
                        <p className="text-xs text-muted-foreground">خلال 1-24 ساعة</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <Gift className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="font-semibold text-sm">7 أيام مجانية</p>
                        <p className="text-xs text-muted-foreground">جميع المميزات</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Account Confirmation Info */}
                <div className="bg-gradient-to-r from-blue-500 to-emerald-600 text-white rounded-xl p-6">
                  <div className="text-center space-y-4">
                    <div className="flex items-center justify-center gap-2">
                      <MessageCircle className="w-6 h-6" />
                      <h3 className="text-xl font-bold">تأكيد الحساب</h3>
                    </div>
                    <p className="text-blue-100">
                      سيتم مراجعة طلبك وتفعيل حسابك خلال 24 ساعة. ستصلك رسالة بريد إلكتروني عند التفعيل.
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-center">
                  <Button 
                    onClick={() => setLocation('/profile')}
                    variant="outline"
                    className="h-12 border-2 px-8"
                  >
                    العودة للصفحة الرئيسية
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-600 to-amber-600 dark:from-blue-900/20 dark:via-green-600/20 dark:to-amber-600/20 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="relative mx-auto w-24 h-24 mb-6">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-green-600 to-amber-600 rounded-full animate-spin opacity-75"></div>
            <div className="relative w-full h-full bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-2xl">
              <UserPlus className="w-12 h-12 text-blue-600 animate-pulse" />
            </div>
          </div>
          
          <h1 className="text-5xl font-black bg-gradient-to-r from-blue-600 via-green-600 to-amber-600 bg-clip-text text-transparent mb-4">
            انضم لعائلة قدراتك 🚀
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-6">
            احصل على 7 أيام مجانية مع جميع المميزات المتقدمة
          </p>
          
          {/* New Policy Banner */}
          <div className="bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 text-white rounded-2xl p-4 mb-8 shadow-lg">
            <div className="flex items-center justify-center gap-2 mb-2">
              <AlertTriangle className="w-6 h-6 animate-bounce" />
              <h3 className="text-xl font-bold">🚨 سياسة جديدة</h3>
            </div>
            <p className="text-yellow-100">
              جميع الحسابات المجانية تحتاج موافقة من الإدارة خلال 1-24 ساعة لضمان الجودة والأمان
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Features Section */}
          <Card className="border-2 border-gradient bg-gradient-to-br from-emerald-50 to-green-100 dark:from-emerald-900/20 dark:to-green-800/20 shadow-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl text-green-800 dark:text-green-200">
                <Gift className="w-8 h-8" />
                ماذا ستحصل عليه؟
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: Star, text: "اختبارات متقدمة", color: "text-yellow-600" },
                  { icon: Zap, text: "تحليل فوري", color: "text-blue-600" },
                  { icon: Shield, text: "أمان عالي", color: "text-green-600" },
                  { icon: Sparkles, text: "مميزات خاصة", color: "text-green-700" },
                  { icon: Clock, text: "7 أيام كاملة", color: "text-orange-600" },
                  { icon: MessageCircle, text: "دعم مخصص", color: "text-amber-700" }
                ].map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 p-3 bg-white dark:bg-gray-800 rounded-lg shadow">
                    <feature.icon className={`w-5 h-5 ${feature.color}`} />
                    <span className="text-sm font-semibold">{feature.text}</span>
                  </div>
                ))}
              </div>
              
              {/* Progress Visualization */}
              <div className="mt-6 p-4 bg-white dark:bg-gray-800 rounded-lg">
                <h4 className="font-bold mb-3 text-center">رحلتك معنا:</h4>
                <div className="flex justify-between items-center text-xs">
                  <div className="text-center">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold mb-1">1</div>
                    <p>التسجيل</p>
                  </div>
                  <div className="flex-1 h-1 bg-gray-300 mx-2"></div>
                  <div className="text-center">
                    <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold mb-1">2</div>
                    <p>التأكيد</p>
                  </div>
                  <div className="flex-1 h-1 bg-gray-300 mx-2"></div>
                  <div className="text-center">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold mb-1">3</div>
                    <p>الاستمتاع</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Signup Form */}
          <Card className="border-2 border-blue-200 bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-blue-900/20 shadow-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl text-blue-800 dark:text-blue-200">
                <User className="w-8 h-8" />
                بيانات التسجيل
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="username" className="flex items-center gap-2 text-lg font-semibold">
                    <User className="w-5 h-5 text-blue-600" />
                    اسم المستخدم
                  </Label>
                  <Input
                    id="username"
                    name="username"
                    type="text"
                    value={formData.username}
                    onChange={handleInputChange}
                    placeholder="أدخل اسم المستخدم (3 أحرف على الأقل)"
                    className="h-14 text-lg text-right border-2 focus:border-blue-500"
                    required
                    minLength={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2 text-lg font-semibold">
                    <Mail className="w-5 h-5 text-green-600" />
                    البريد الإلكتروني
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="example@email.com"
                    className="h-14 text-lg text-right border-2 focus:border-green-500"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="flex items-center gap-2 text-lg font-semibold">
                    <Lock className="w-5 h-5 text-green-700" />
                    كلمة المرور (أرقام فقط)
                  </Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="أدخل 6 أرقام على الأقل"
                    className="h-14 text-lg text-right border-2 focus:border-green-400"
                    pattern="[0-9]+"
                    minLength={6}
                    required
                  />
                  <p className="text-sm text-muted-foreground">
                    * كلمة المرور يجب أن تحتوي على أرقام فقط (6 أرقام كحد أدنى)
                  </p>
                </div>

                <div className="bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-6 h-6 text-amber-600 mt-1" />
                    <div className="text-sm text-amber-800 dark:text-amber-200">
                      <p className="font-bold mb-2">مهم جداً:</p>
                      <p>لا يتم تفعيل الحسابات المجانية إلا بعد موافقة الإدارة خلال 24 ساعة</p>
                    </div>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-blue-500 via-green-600 to-amber-600 hover:from-blue-600 hover:via-green-600 hover:to-amber-600 text-white h-16 text-xl font-bold shadow-xl transform hover:scale-105 transition-all duration-200"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                      جاري إرسال الطلب...
                    </>
                  ) : (
                    <>
                      <Phone className="w-6 h-6 mr-3" />
                      إرسال طلب التسجيل
                      <ArrowRight className="w-6 h-6 ml-3" />
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Back to Login */}
        <div className="text-center mt-8">
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-4">
            هل لديك حساب مدفوع بالفعل؟
          </p>
          <Button 
            variant="ghost" 
            onClick={() => setLocation('/login')}
            className="text-blue-600 hover:text-blue-700 text-lg font-semibold"
          >
            <Crown className="w-5 h-5 mr-2" />
            تسجيل دخول العملاء المميزين
          </Button>
        </div>
      </div>
    </div>
  );
}
