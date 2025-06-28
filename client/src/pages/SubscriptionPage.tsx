import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Crown, 
  Diamond, 
  Check, 
  Star,
  Zap,
  Infinity,
  ArrowRight,
  MessageCircle
} from "lucide-react";

export default function SubscriptionPage() {
  const plans = [
    {
      name: "المجاني",
      price: "0",
      period: "مجاناً",
      description: "ابدأ رحلتك التعليمية",
      features: [
        "5 اختبارات قياس يومياً",
        "إدارة الوقت الأساسية",
        "تحميل التطبيق",
        "الدعم المجتمعي"
      ],
      limitations: [
        "محدود 5 اختبارات يومياً",
        "بدون مساعد ذكي",
        "بدون تحليلات مفصلة"
      ],
      buttonText: "البدء مجاناً",
      buttonVariant: "outline" as const,
      current: true
    },
    {
      name: "Pro",
      price: "49",
      period: "شهرياً",
      description: "للطلاب الجديين",
      popular: true,
      features: [
        "اختبارات غير محدودة",
        "المساعد الذكي المتقدم",
        "المكتبة الشاملة",
        "التحليلات المفصلة",
        "المجلدات المخصصة",
        "التحديات والألعاب",
        "الدعم الفوري"
      ],
      buttonText: "اشترك الآن",
      buttonVariant: "default" as const
    },
    {
      name: "Pro Life",
      price: "199",
      period: "مرة واحدة",
      description: "استثمار مدى الحياة",
      features: [
        "جميع ميزات Pro",
        "وصول مدى الحياة",
        "جميع التحديثات المستقبلية",
        "أولوية في الدعم",
        "محتوى حصري",
        "بدون رسوم شهرية",
        "ضمان مدى الحياة"
      ],
      buttonText: "شراء مدى الحياة",
      buttonVariant: "default" as const,
      premium: true
    }
  ];

  const handleSubscribe = (planName: string) => {
    if (planName === "المجاني") {
      window.location.href = "/guest-signup";
      return;
    }
    
    // توجيه للواتساب للاشتراك
    const message = encodeURIComponent(
      `مرحباً! أريد الاشتراك في خطة ${planName} في منصة قدراتك.`
    );
    window.open(`https://wa.me/+966500000000?text=${message}`, '_blank');
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          اختر خطتك المناسبة
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          استثمر في مستقبلك التعليمي مع أفضل منصة لتحضير اختبارات القياس
        </p>
      </div>

      {/* Current Plan Alert */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 p-6 rounded-2xl border border-emerald-200 dark:border-emerald-700 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Check className="w-5 h-5 text-emerald-600" />
          <span className="font-semibold text-emerald-700 dark:text-emerald-400">خطتك الحالية: مجاني</span>
        </div>
        <p className="text-emerald-600 dark:text-emerald-300 text-sm">
          يمكنك الاستمرار باستخدام الميزات المجانية أو الترقية للحصول على إمكانيات أكثر
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan, index) => (
          <Card 
            key={plan.name} 
            className={`relative ${
              plan.popular ? 'border-2 border-blue-500 shadow-lg scale-105' : ''
            } ${plan.premium ? 'border-2 border-purple-500 shadow-lg' : ''}`}
          >
            {plan.popular && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-blue-500 text-white px-4 py-1">
                  <Star className="w-3 h-3 mr-1" />
                  الأكثر شعبية
                </Badge>
              </div>
            )}
            
            {plan.premium && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-purple-500 text-white px-4 py-1">
                  <Diamond className="w-3 h-3 mr-1" />
                  الأفضل قيمة
                </Badge>
              </div>
            )}

            <CardHeader className="text-center">
              <div className="flex items-center justify-center mb-4">
                {plan.name === "المجاني" && <Zap className="w-8 h-8 text-emerald-500" />}
                {plan.name === "Pro" && <Crown className="w-8 h-8 text-blue-500" />}
                {plan.name === "Pro Life" && <Diamond className="w-8 h-8 text-purple-500" />}
              </div>
              
              <CardTitle className="text-2xl">{plan.name}</CardTitle>
              <p className="text-muted-foreground">{plan.description}</p>
              
              <div className="mt-4">
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-lg text-muted-foreground">ريال</span>
                </div>
                <p className="text-sm text-muted-foreground">{plan.period}</p>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Features */}
              <div className="space-y-2">
                {plan.features.map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>

              {/* Limitations for free plan */}
              {plan.limitations && (
                <div className="border-t pt-4 space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">القيود:</p>
                  {plan.limitations.map((limitation, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-gray-300 flex-shrink-0"></div>
                      <span className="text-sm text-muted-foreground">{limitation}</span>
                    </div>
                  ))}
                </div>
              )}

              <Button
                className={`w-full h-12 font-bold ${
                  plan.current ? 'opacity-50 cursor-not-allowed' : ''
                } ${plan.popular ? 'bg-blue-500 hover:bg-blue-600' : ''} ${
                  plan.premium ? 'bg-purple-500 hover:bg-purple-600' : ''
                }`}
                variant={plan.buttonVariant}
                onClick={() => handleSubscribe(plan.name)}
                disabled={plan.current}
              >
                {plan.current ? (
                  "خطتك الحالية"
                ) : (
                  <>
                    {plan.buttonText}
                    <ArrowRight className="w-4 h-4 mr-2" />
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* FAQ Section */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-center">أسئلة شائعة</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-2">هل يمكنني إلغاء اشتراكي؟</h3>
              <p className="text-sm text-muted-foreground">
                نعم، يمكنك إلغاء اشتراك Pro في أي وقت. Pro Life مدى الحياة بدون رسوم متكررة.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-2">ما الفرق بين Pro و Pro Life؟</h3>
              <p className="text-sm text-muted-foreground">
                Pro اشتراك شهري، بينما Pro Life دفعة واحدة للوصول مدى الحياة مع توفير 75%.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-2">هل هناك ضمان استرداد؟</h3>
              <p className="text-sm text-muted-foreground">
                نعم، نقدم ضمان استرداد المال خلال 7 أيام إذا لم تكن راضياً عن الخدمة.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-2">كيف أتواصل للدعم؟</h3>
              <p className="text-sm text-muted-foreground">
                يمكنك التواصل معنا عبر الواتساب أو البريد الإلكتروني للحصول على الدعم الفوري.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Contact Section */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
        <CardContent className="p-8 text-center">
          <h3 className="text-xl font-bold mb-4">تحتاج مساعدة في الاختيار؟</h3>
          <p className="text-muted-foreground mb-6">
            تواصل معنا عبر الواتساب وسنساعدك في اختيار الخطة المناسبة لاحتياجاتك
          </p>
          <Button 
            className="bg-green-500 hover:bg-green-600 text-white"
            onClick={() => window.open('https://wa.me/+966500000000', '_blank')}
          >
            <MessageCircle className="w-5 h-5 mr-2" />
            تواصل معنا
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}