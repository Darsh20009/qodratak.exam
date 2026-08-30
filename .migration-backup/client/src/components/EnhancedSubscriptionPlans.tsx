import React, { useState, useEffect, useRef } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    CopyIcon, CheckIcon, SparklesIcon, StarIcon, ShieldCheckIcon, RocketIcon,
    ArrowLeftIcon, ArrowRightIcon, ExternalLinkIcon, UserRoundIcon, CreditCardIcon, BanknoteIcon, SmartphoneNfcIcon,
    TriangleAlertIcon, SendIcon, MessageSquareTextIcon, KeyRoundIcon, ShieldQuestionIcon,
    CrownIcon, DiamondIcon, TargetIcon, ZapIcon, FlameIcon, TrophyIcon, GemIcon, CalendarIcon, MessageCircleIcon
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// تحديث روابط الدفع والأسعار المحدثة
const SUBSCRIPTION_PLANS = {
  pro: {
    name: "Pro",
    duration: "شهر واحد",
    durationDays: 30,
    price: "29 ريال",
    originalPrice: "49 ريال",
    description: "الاشتراك الشهري الاحترافي",
    paypalLink: "https://www.paypal.com/ncp/payment/XZWPA8WLMNDGS",
    color: "bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20",
    textColor: "text-blue-900 dark:text-blue-100",
    borderColor: "border-blue-200 dark:border-blue-800",
    icon: TargetIcon,
    badge: "الأكثر شعبية",
    badgeColor: "bg-blue-500",
    features: [
      "🎯 وصول كامل لجميع الأسئلة",
      "📊 حفظ التقدم والإحصائيات",
      "🎨 اختبارات مخصصة",
      "📈 تحليل الأداء المتقدم",
      "💬 دعم فني محدود",
      "📱 تطبيق الهاتف المحمول"
    ]
  },
  proLife: {
    name: "Pro Life",
    duration: "ثلاثة أشهر",
    durationDays: 90,
    price: "74 ريال",
    originalPrice: "120 ريال",
    description: "الاشتراك الثلاثي المتقدم",
    paypalLink: "https://www.paypal.com/ncp/payment/SWGPHGE2JM9NN",
    color: "bg-gradient-to-br from-green-600 via-teal-600 to-amber-600 dark:from-green-600/20 dark:via-teal-600/20 dark:to-amber-600/20",
    textColor: "text-green-700 dark:text-green-700",
    borderColor: "border-green-400 dark:border-green-400",
    icon: CrownIcon,
    badge: "الأفضل قيمة",
    badgeColor: "bg-gradient-to-r from-green-600 to-amber-600",
    features: [
      "👑 جميع مميزات Pro",
      "🎥 جلسات مباشرة مع الخبراء",
      "📋 تقارير مفصلة ودورية",
      "⚡ أولوية في الدعم الفني",
      "🎁 محتوى حصري ومتقدم",
      "🏆 شهادات إنجاز معتمدة",
      "🔥 خصومات على الدورات",
      "💎 وصول مبكر للمميزات الجديدة"
    ]
  }
};

const BANK_ACCOUNT_NUMBER = "EG420059003800000200013934156";
const BANK_NAME = "بنك فيصل الإسلامي المصري";
const OTP_COUNTDOWN_SECONDS = 180;

const countryCodes = [
  { value: "+966", label: "🇸🇦 +966 (السعودية)" },
  { value: "+20", label: "🇪🇬 +20 (مصر)" },
  { value: "+971", label: "🇦🇪 +971 (الإمارات)" },
];

export default function EnhancedSubscriptionPlans() {
  const { toast } = useToast();

  // State Management
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'pro' | 'proLife' | null>(null);
  const [currentStep, setCurrentStep] = useState(1);

  // User Data
  const [userData, setUserData] = useState<{ name?: string, email?: string, password?: string, phoneNumber?: string, discountCode?: string }>({});
  const [phoneCountryCode, setPhoneCountryCode] = useState(countryCodes[0].value);
  const [termsAccepted, setTermsAccepted] = useState(false);

  // OTP
  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);
  const [otpInput, setOtpInput] = useState<string[]>(new Array(6).fill(""));
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(OTP_COUNTDOWN_SECONDS);
  const [isVerifying, setIsVerifying] = useState(false);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Email Verification
  const [generatedEmailOtp, setGeneratedEmailOtp] = useState<string | null>(null);
  const [emailOtpInput, setEmailOtpInput] = useState<string[]>(new Array(6).fill(""));
  const [isEmailOtpSent, setIsEmailOtpSent] = useState(false);
  const [emailCountdown, setEmailCountdown] = useState(OTP_COUNTDOWN_SECONDS);
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  const emailOtpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Payment
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'bank' | 'paypal' | 'creditcard' | 'applepay' | null>(null);
  const [copySuccess, setCopySuccess] = useState<'bank' | null>(null);

  // Effects
  useEffect(() => {
    const storedUser = localStorage.getItem('dakqaeq_currentUser');
    if (storedUser) {
      try {
        const localStorageUserData = JSON.parse(storedUser);
        setUserData(prev => ({ 
          ...prev, 
          name: localStorageUserData?.name || '', 
          email: localStorageUserData?.email || '' 
        }));
      } catch (error) { 
        console.error("Failed to parse user data from localStorage", error); 
      }
    }
  }, []);

  useEffect(() => {
    if (isOtpSent && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [isOtpSent, countdown]);

  useEffect(() => {
    if (isEmailOtpSent && emailCountdown > 0) {
      const timer = setTimeout(() => setEmailCountdown(emailCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [isEmailOtpSent, emailCountdown]);

  // Handlers
  const handleCopy = async (text: string, type: 'bank') => {
    await navigator.clipboard.writeText(text);
    setCopySuccess(type);
    toast({
      title: "✅ تم النسخ بنجاح!",
      description: "تم نسخ رقم الحساب إلى الحافظة.",
      className: "bg-green-500 text-white dark:bg-green-600 dark:text-white",
    });
    setTimeout(() => setCopySuccess(null), 2500);
  };

  const resetState = () => {
    setCurrentStep(1);
    setTermsAccepted(false);
    setIsOtpSent(false);
    setGeneratedOtp(null);
    setOtpInput(new Array(6).fill(""));
    setCountdown(OTP_COUNTDOWN_SECONDS);
    setIsEmailOtpSent(false);
    setGeneratedEmailOtp(null);
    setEmailOtpInput(new Array(6).fill(""));
    setEmailCountdown(OTP_COUNTDOWN_SECONDS);
    setSelectedPaymentMethod(null);
    setUserData(prev => ({ name: prev.name, email: prev.email, password: '', phoneNumber: '' }));
  };

  const handleSubscribe = (plan: 'pro' | 'proLife') => {
    resetState();
    setSelectedPlan(plan);
    setIsPaymentDialogOpen(true);
  };

  const handleDialogClose = (open: boolean) => {
    setIsPaymentDialogOpen(open);
    if (!open) {
      resetState();
    }
  };

  // Phone Verification Handler
  const handlePhoneVerification = () => {
    const phoneNumber = `${phoneCountryCode}${userData.phoneNumber}`;
    const message = `مرحباً ${userData.name}!\n\nتم طلب التحقق من رقم هاتفك للاشتراك في منصة دقائق.\n\nبيانات الاشتراك:\n- الاسم: ${userData.name}\n- البريد: ${userData.email}\n- رقم الهاتف: ${phoneNumber}\n\nللمتابعة، الرجاء الرد على هذه الرسالة بكلمة "موافق".\n\nشكراً لاختيارك منصة دقائق!`;
    
    const whatsappUrl = `https://wa.me/${phoneNumber.replace('+', '')}?text=${encodeURIComponent(message)}`;
    
    window.open(whatsappUrl, '_blank');
    
    // Auto proceed to next step after opening WhatsApp
    setTimeout(() => {
      setCurrentStep(2.5);
      toast({
        title: "تم إرسال رسالة التحقق",
        description: "تم فتح واتساب لإرسال رسالة التحقق",
      });
    }, 1000);
  };

  // Email Verification Handler
  const handleEmailVerification = () => {
    const subject = encodeURIComponent("تحقق من الاشتراك في منصة دقائق");
    const body = encodeURIComponent(`مرحباً فريق دقائق,

أرغب في تأكيد اشتراكي في منصة دقائق.

بيانات الاشتراك:
- الاسم: ${userData.name}
- البريد الإلكتروني: ${userData.email}
- رقم الهاتف: ${phoneCountryCode}${userData.phoneNumber}
- نوع الاشتراك: ${selectedPlan && SUBSCRIPTION_PLANS[selectedPlan].name}
- المدة: ${selectedPlan && SUBSCRIPTION_PLANS[selectedPlan].duration}

الرجاء تأكيد هذه البيانات ومعالجة طلب الاشتراك.

شكراً لكم,
${userData.name}`);

    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=qoudratak@gmail.com&su=${subject}&body=${body}`;
    
    window.open(gmailUrl, '_blank');
    
    // Auto proceed to next step after opening Gmail
    setTimeout(() => {
      setCurrentStep(3);
      toast({
        title: "تم فتح Gmail",
        description: "تم فتح Gmail لإرسال بريد التحقق",
      });
    }, 1000);
  };

  // Payment Completion Handler
  const handlePaymentCompletion = () => {
    if (!selectedPlan) return;
    
    const paypalUrl = SUBSCRIPTION_PLANS[selectedPlan].paypalLink;
    window.open(paypalUrl, '_blank');
    
    toast({
      title: "تم توجيهك لإتمام الدفع",
      description: "تم فتح صفحة الدفع، يرجى إتمام العملية",
    });
    
    // Close dialog after payment redirection
    setTimeout(() => {
      handleDialogClose(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-teal-500 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 via-green-600 to-amber-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-green-500/20">
              <CrownIcon className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-green-600 to-amber-600 bg-clip-text text-transparent">
              خطط الاشتراك المحدثة
            </h1>
          </div>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
            اختر الخطة التي تناسبك مع المدة المحدثة الجديدة وابدأ رحلتك نحو التميز في اختبارات القياس
          </p>
          <div className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <CalendarIcon className="w-4 h-4" />
            <span>تم تحديث مدد الاشتراكات: Pro شهر واحد • Pro Life ثلاثة أشهر</span>
          </div>
        </div>

        {/* Subscription Plans */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {Object.entries(SUBSCRIPTION_PLANS).map(([key, plan]) => {
            const PlanIcon = plan.icon;
            return (
              <Card 
                key={key} 
                className={`${plan.color} ${plan.borderColor} border-2 relative overflow-hidden shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-105 group`}
              >
                {/* Background Pattern */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent dark:from-white/5 pointer-events-none" />
                
                {/* Badge */}
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <div className={`${plan.badgeColor} text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg`}>
                    {plan.badge}
                  </div>
                </div>

                <CardHeader className="text-center pt-8 pb-4">
                  <div className="flex items-center justify-center mb-4">
                    <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${plan.color} border ${plan.borderColor} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <PlanIcon className={`w-10 h-10 ${plan.textColor}`} />
                    </div>
                  </div>
                  
                  <CardTitle className={`text-3xl font-bold ${plan.textColor} mb-2`}>
                    {plan.name}
                  </CardTitle>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-center gap-3">
                      <span className={`text-4xl font-bold ${plan.textColor}`}>{plan.price}</span>
                      <span className="text-2xl text-gray-400 line-through">{plan.originalPrice}</span>
                    </div>
                    <div className={`text-lg ${plan.textColor} font-medium flex items-center justify-center gap-2`}>
                      <CalendarIcon className="w-5 h-5" />
                      {plan.duration}
                    </div>
                  </div>
                  
                  <CardDescription className="text-gray-600 dark:text-gray-300 text-lg mt-2">
                    {plan.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="px-6 pb-6">
                  <div className="space-y-4">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-start gap-3 group/item">
                        <div className="w-6 h-6 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center flex-shrink-0 mt-1">
                          <CheckIcon className="w-4 h-4 text-green-400" />
                        </div>
                        <span className="text-gray-700 dark:text-gray-300 group-hover/item:text-gray-900 dark:group-hover/item:text-white transition-colors">
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8">
                    <Button 
                      onClick={() => handleSubscribe(key as 'pro' | 'proLife')}
                      className={`w-full ${key === 'proLife' 
                        ? 'bg-gradient-to-r from-green-600 to-amber-600 hover:from-green-600 hover:to-amber-600' 
                        : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700'
                      } text-white font-bold py-4 px-6 rounded-xl text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105`}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <RocketIcon className="w-5 h-5" />
                        اشترك الآن
                      </div>
                    </Button>
                  </div>

                  {/* كود الخصم */}
                  <div className="mt-4 bg-gradient-to-r from-amber-50/50 to-orange-50/50 dark:from-amber-900/10 dark:to-orange-900/10 border border-amber-200/50 dark:border-amber-700/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <SparklesIcon className="w-4 h-4 text-amber-600" />
                      <span className="text-sm font-medium text-amber-800 dark:text-amber-200">كود خصم؟</span>
                    </div>
                    <Input 
                      placeholder="ادخل كود الخصم" 
                      value={userData.discountCode || ''}
                      onChange={(e) => setUserData(prev => ({...prev, discountCode: e.target.value}))}
                      className="text-sm bg-white/80 dark:bg-gray-800/80 border-amber-300/50 dark:border-amber-600/50"
                    />
                  </div>

                  {/* Savings Badge */}
                  {key === 'proLife' && (
                    <div className="mt-4 text-center">
                      <div className="inline-flex items-center gap-2 bg-green-500/20 border border-green-500/30 rounded-full px-4 py-2">
                        <GemIcon className="w-4 h-4 text-green-400" />
                        <span className="text-green-400 font-medium text-sm">
                          وفر 55 ريال مقارنة بالاشتراك الشهري!
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Payment Dialog */}
        <Dialog open={isPaymentDialogOpen} onOpenChange={handleDialogClose}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-center bg-gradient-to-r from-blue-400 to-emerald-600 bg-clip-text text-transparent">
                إتمام الاشتراك في {selectedPlan && SUBSCRIPTION_PLANS[selectedPlan].name}
              </DialogTitle>
              <DialogDescription className="text-center text-gray-400">
                {selectedPlan && SUBSCRIPTION_PLANS[selectedPlan].description} - {selectedPlan && SUBSCRIPTION_PLANS[selectedPlan].duration}
              </DialogDescription>
            </DialogHeader>

            {/* Steps Content would go here - same as before but with updated plan details */}
            <div className="mt-6 text-center">
              <p className="text-gray-300">
                لقد تم تحديث مدد الاشتراكات لتوفير قيمة أفضل للمستخدمين
              </p>
            </div>

            <DialogFooter className="mt-6">
              <Button 
                onClick={() => handleDialogClose(false)}
                variant="outline" 
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                إلغاء
              </Button>
              <Button 
                onClick={handlePaymentCompletion}
                className="bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-600"
              >
                متابعة الدفع
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* جروب الاخبار */}
        <div className="mt-12 max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-blue-500/10 via-green-600/10 to-amber-600/10 dark:from-blue-600/20 dark:via-green-600/20 dark:to-amber-600/20 border border-blue-200 dark:border-blue-700 rounded-2xl p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
                <MessageCircleIcon className="w-8 h-8 text-white" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
              تواصل مع الدعم الفني
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-2xl mx-auto">
              هل لديك سؤال حول الاشتراك؟ فريق الدعم الفني في المنصة جاهز لمساعدتك في أي وقت
            </p>
            <Button 
              onClick={() => window.location.href = '/support'}
              className="bg-gradient-to-r from-blue-500 to-emerald-600 hover:from-blue-600 hover:to-emerald-600 text-white font-bold py-3 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              <MessageCircleIcon className="w-5 h-5 ml-2" />
              تواصل مع الدعم
            </Button>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
              دعم مباشر داخل المنصة
            </p>
          </div>
        </div>

        {/* Features Comparison */}
        <div className="mt-16 text-center">
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-8">
            مقارنة المميزات المحدثة
          </h2>
          <div className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-lg rounded-2xl p-8 border border-gray-200 dark:border-slate-700">
            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div>
                <h3 className="font-bold text-lg text-gray-600 dark:text-gray-300 mb-4">المدة</h3>
                <div className="space-y-2">
                  <div className="text-blue-600 dark:text-blue-400 font-semibold">Pro: شهر واحد</div>
                  <div className="text-green-700 dark:text-green-700 font-semibold">Pro Life: ثلاثة أشهر</div>
                </div>
              </div>
              <div>
                <h3 className="font-bold text-lg text-gray-600 dark:text-gray-300 mb-4">التوفير</h3>
                <div className="space-y-2">
                  <div className="text-green-600 dark:text-green-400 font-semibold">Pro: 20 ريال خصم</div>
                  <div className="text-green-600 dark:text-green-400 font-semibold">Pro Life: 45 ريال توفير</div>
                </div>
              </div>
              <div>
                <h3 className="font-bold text-lg text-gray-600 dark:text-gray-300 mb-4">القيمة</h3>
                <div className="space-y-2">
                  <div className="text-orange-600 dark:text-orange-400 font-semibold">Pro: ممتاز للتجربة</div>
                  <div className="text-orange-600 dark:text-orange-400 font-semibold">Pro Life: الأفضل للجدية</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}