import React, { useState, useEffect } from 'react';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    CopyIcon, CheckIcon, SparklesIcon, StarIcon, ShieldCheckIcon, RocketIcon,
    ArrowLeftIcon, BanknoteIcon, CreditCardIcon, CrownIcon, DiamondIcon, TargetIcon, ZapIcon,
    LoaderCircleIcon, AlertCircleIcon, PartyPopperIcon, AlertTriangleIcon, CheckCircleIcon, MessageCircleIcon, ClockIcon,
    LockIcon, UploadCloudIcon, FileCheckIcon, UserIcon, MailIcon, PhoneIcon, WalletIcon
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import useSubscription from "@/hooks/useSubscription";
import { QodratakPayDialog } from "@/pages/WalletPage";
import { useUser } from "@/hooks/use-user";
import { AnimatePresence, motion } from "framer-motion";
import Confetti from 'react-confetti';
import proImageSrc from "@assets/ChatGPT Image Nov 4, 2025, 09_14_41 PM_1762280141230.png";
import proLifeImageSrc from "@assets/ChatGPT Image Nov 4, 2025, 09_14_49 PM_1762281474749.png";
import proLifePlusImageSrc from "@assets/ChatGPT Image Nov 4, 2025, 09_14_56 PM_1762281650156.png";

// --- CONSTANTS ---
const BANK_ACCOUNTS = {
  faisal: { name: "🏛️ بنك فيصل الإسلامي", iban: "EG420059003800000200013934156", flag: "🇪🇬" },
  etisalat: { name: "📱 إتصالات كاش", number: "01155201921", flag: "🇪🇬" },
  instapay: { name: "💳 إنستا باي", number: "01577990048", flag: "🇪🇬" }
};
const PAYPAL_LINKS = {
  pro: "https://www.paypal.com/ncp/payment/XZWPA8WLMNDGS",
};
const SUBSCRIPTION_PLANS = {
  pro: {
    name: "خطة قدراتك", duration: "3 أشهر", price: "39 ريال", priceEGP: "468 جنيه",
    description: "اشتراك كامل لمدة 3 أشهر يشمل مسارات قدراتك التعليمية.",
    color: "bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20",
    textColor: "text-blue-900 dark:text-blue-100", icon: TargetIcon, badge: "الخطة الأساسية",
    badgeColor: "bg-gradient-to-r from-amber-400 to-orange-500",
    features: ["🎯 وصول كامل للمحتوى والاختبارات", "📊 حفظ التقدم والإحصائيات", "🗓️ خطة يومية ومتابعة مستمرة", "💬 دعم فني عبر واتساب"]
  },
};
const countryCodes = [
  { value: "+20", label: "🇪🇬 +20 (مصر)" },
  { value: "+966", label: "🇸🇦 +966 (السعودية)" },
  { value: "+971", label: "🇦🇪 +971 (الإمارات)" },
];

// --- TYPE DEFINITIONS ---
type PlanKey = 'pro';
type PaymentMethod = 'bank' | 'card' | 'wallet' | 'qodratak_pay';
type UserData = { name?: string, email?: string, password?: string, phoneNumber?: string };
type ValidationErrors = { [key in keyof UserData]?: string } & { terms?: string };


// --- MAIN COMPONENT ---
export default function NewSubscriptionPage() {
  const { toast } = useToast();
  const { subscription } = useSubscription();

  // Dialog and Plan State
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanKey | null>(null);
  const [showPaymentConfirmDialog, setShowPaymentConfirmDialog] = useState(false);

  // Confetti State
  const [showConfetti, setShowConfetti] = useState(false);

  // Currency State
  const [showEgyptianPrice, setShowEgyptianPrice] = useState(false);
  const [remotePlan, setRemotePlan] = useState<{
    name?: string;
    durationDays?: number;
    priceSar?: number;
    description?: string;
    features?: string[];
  } | null>(null);

  useEffect(() => {
    fetch("/api/subscription/plan", { credentials: "include", cache: "no-store" })
      .then((response) => response.ok ? response.json() : null)
      .then((data) => setRemotePlan(data?.plan || null))
      .catch(() => setRemotePlan(null));
  }, []);

  const planCatalog = React.useMemo(() => {
    const price = Number.isFinite(Number(remotePlan?.priceSar)) ? Number(remotePlan?.priceSar) : 39;
    const durationDays = Number.isInteger(Number(remotePlan?.durationDays)) ? Number(remotePlan?.durationDays) : 90;
    return {
      pro: {
        ...SUBSCRIPTION_PLANS.pro,
        name: remotePlan?.name || SUBSCRIPTION_PLANS.pro.name,
        duration: durationDays === 90 ? "3 أشهر" : `${durationDays} يوم`,
        price: `${price} ريال`,
        priceEGP: `${price * 12} جنيه`,
        description: remotePlan?.description || SUBSCRIPTION_PLANS.pro.description,
        features: remotePlan?.features?.length ? remotePlan.features : SUBSCRIPTION_PLANS.pro.features,
      },
    };
  }, [remotePlan]);

  // Handlers
  const handleSubscribe = (plan: PlanKey) => {
    setSelectedPlan(plan);
    setIsPaymentDialogOpen(true);
  };

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      setSelectedPlan(null);
    }
    setIsPaymentDialogOpen(open);
  };

  const triggerConfetti = () => {
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 5000); // Confetti lasts for 5 seconds
  };

  return (
    <>
      {showConfetti && <Confetti recycle={false} numberOfPieces={400} />}
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-teal-500 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-20 relative">
            <div className="relative z-10 max-w-5xl mx-auto">
              <div className="flex items-center justify-center mb-10">
                <div className="relative">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-600 via-green-600 to-amber-600 rounded-3xl flex items-center justify-center shadow-2xl transform hover:scale-110 transition-all duration-300">
                    <SparklesIcon className="w-12 h-12 text-white animate-pulse" />
                  </div>
                </div>
              </div>
              <h1 className="text-5xl md:text-7xl font-black mb-8">
                <span className="bg-gradient-to-r from-blue-600 via-green-600 to-amber-600 bg-clip-text text-transparent drop-shadow-sm">
                  خطط الاشتراك
                </span>
              </h1>
              <p className="text-2xl text-gray-600 dark:text-gray-300 leading-relaxed mb-6 max-w-3xl mx-auto">
                اختر الخطة المثالية لك وابدأ رحلتك نحو
                <span className="text-transparent bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text font-semibold"> التميز الأكاديمي</span>
              </p>
              <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500 dark:text-gray-400 mb-8">
                <div className="flex items-center gap-2"><ShieldCheckIcon className="w-5 h-5 text-green-500" /><span>أمان مضمون</span></div>
                <div className="flex items-center gap-2"><ZapIcon className="w-5 h-5 text-yellow-500" /><span>تفعيل فوري</span></div>
                <div className="flex items-center gap-2"><StarIcon className="w-5 h-5 text-green-700" /><span>جودة عالية</span></div>
              </div>

              {/* Currency Toggle */}
              <div className="flex items-center justify-center gap-4 mb-4">
                <Button
                  variant={!showEgyptianPrice ? "default" : "outline"}
                  onClick={() => setShowEgyptianPrice(false)}
                  className="flex items-center gap-2"
                >
                  🇸🇦 ريال سعودي
                </Button>
                <Button
                  variant={showEgyptianPrice ? "default" : "outline"}
                  onClick={() => setShowEgyptianPrice(true)}
                  className="flex items-center gap-2"
                >
                  🇪🇬 جنيه مصري
                </Button>
              </div>

              {/* Egypt Payment Notice */}
              {showEgyptianPrice && (
                <div className="max-w-2xl mx-auto p-4 bg-gradient-to-r from-green-100 via-white to-red-100 dark:from-green-900/20 dark:via-gray-800 dark:to-red-900/20 rounded-xl border-2 border-green-300 dark:border-green-600 mb-8">
                  <div className="text-center space-y-2">
                    <div className="text-lg font-bold text-green-800 dark:text-green-200">🗺️ تحويل مجاني لمصر! 🇪🇬</div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      💳 استخدم تطبيق <strong>"برق"</strong> للتحويل المجاني من السعودية إلى مصر بدون رسوم! ⚡
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Payment Confirmation Section - For users who already paid */}
          <div className="max-w-4xl mx-auto mb-16">
            <div className="relative overflow-hidden rounded-3xl border-2 border-dashed border-orange-300 dark:border-orange-600 bg-gradient-to-br from-orange-50 via-yellow-50 to-amber-50 dark:from-orange-900/20 dark:via-yellow-900/20 dark:to-amber-900/20 p-8 shadow-2xl hover:shadow-3xl transition-all duration-500 group">
              {/* Animated background pattern */}
              <div className="absolute inset-0 opacity-10 dark:opacity-5">
                <div className="absolute top-4 left-4 w-8 h-8 rounded-full bg-orange-400 animate-pulse"></div>
                <div className="absolute top-16 right-8 w-6 h-6 rounded-full bg-yellow-400 animate-bounce"></div>
                <div className="absolute bottom-8 left-12 w-4 h-4 rounded-full bg-amber-400 animate-ping"></div>
                <div className="absolute bottom-4 right-4 w-6 h-6 rounded-full bg-orange-400 animate-pulse"></div>
              </div>

              <div className="relative z-10 text-center space-y-6">
                <div className="flex justify-center mb-4">
                  <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-orange-500 to-yellow-500 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform duration-300">
                    <AlertTriangleIcon className="w-10 h-10 text-white animate-bounce" />
                  </div>
                </div>

                <div className="space-y-3">
                  <h2 className="text-3xl font-black text-orange-800 dark:text-orange-200 leading-tight">
                    دفعت ومعرفتش تأكد دفعك؟ 🤔
                  </h2>
                  <p className="text-lg text-orange-700 dark:text-orange-300 max-w-2xl mx-auto leading-relaxed">
                    لا تقلق! إذا كنت دفعت بالفعل ولم تتمكن من تأكيد دفعتك، يمكنك تأكيد اشتراكك بسهولة من هنا
                  </p>
                  <div className="flex items-center justify-center gap-4 text-sm text-orange-600 dark:text-orange-400">
                    <div className="flex items-center gap-2">
                      <CheckCircleIcon className="w-5 h-5 text-green-500" />
                      <span>سريع وآمن</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MessageCircleIcon className="w-5 h-5 text-blue-500" />
                      <span>دعم مباشر</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ClockIcon className="w-5 h-5 text-green-700" />
                      <span>خلال دقائق</span>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => setShowPaymentConfirmDialog(true)}
                  className="bg-gradient-to-r from-orange-600 to-yellow-600 hover:from-orange-700 hover:to-yellow-700 text-white font-bold text-xl px-12 py-4 rounded-2xl shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 group-hover:animate-pulse"
                >
                  <RocketIcon className="w-6 h-6 ml-2" />
                  اذهب واكد دفعك من هنا
                </Button>

                <p className="text-sm text-orange-600 dark:text-orange-400 font-medium">
                  ⚡ استعادة سريعة للاشتراك المدفوع مسبقاً
                </p>
              </div>
            </div>
          </div>

          {/* Subscription Plans Grid */}
          <div className="grid lg:grid-cols-3 md:grid-cols-2 gap-8 max-w-7xl mx-auto">
            {Object.entries(planCatalog).map(([key, plan]) => {
              const IconComponent = plan.icon;
              return (
                <Card key={key} className={`relative overflow-hidden border-2 transition-all duration-500 hover:shadow-2xl hover:scale-105 transform group ${plan.color} ${key === 'pro' ? 'lg:scale-105 border-amber-300 shadow-xl' : 'border-transparent'}`}>
                  {plan.badge && <div className="absolute top-4 right-4 z-10"><span className={`${plan.badgeColor} text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg animate-pulse`}>{plan.badge}</span></div>}
                  <CardHeader className="text-center pb-4 relative z-10">
                    <div className="flex justify-center mb-6">
                      <div className={`relative w-20 h-20 rounded-3xl flex items-center justify-center shadow-2xl transform group-hover:scale-110 transition-all duration-300 bg-gradient-to-br ${key === 'pro' ? 'from-blue-500 to-cyan-500' : key === 'proLife' ? 'from-green-600 to-amber-600' : 'from-emerald-500 to-teal-500'}`}>
                        {key === 'pro' ? (
                          <img src={proImageSrc} alt="Qodratak Pro" className="w-full h-full object-cover rounded-3xl" />
                        ) : key === 'proLife' ? (
                          <img src={proLifeImageSrc} alt="Qodratak Pro Life" className="w-full h-full object-cover rounded-3xl" />
                        ) : key === 'proLifePlus' ? (
                          <img src={proLifePlusImageSrc} alt="Qodratak Pro Life Plus" className="w-full h-full object-cover rounded-3xl" />
                        ) : (
                          <IconComponent className="w-10 h-10 text-white" />
                        )}
                      </div>
                    </div>
                    <CardTitle className={`text-3xl font-black mb-2 ${plan.textColor}`}>{plan.name}</CardTitle>
                    <CardDescription className="text-gray-600 dark:text-gray-300 text-lg">{plan.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="text-center relative z-10">
                    <div className="mb-8">
                      <div className="flex items-center justify-center gap-3 mb-3">
                        <div className={`text-5xl font-black ${plan.textColor}`}>
                          {showEgyptianPrice ? plan.priceEGP : plan.price}
                        </div>
                        {(plan as any).originalPrice && (
                          <div className="flex flex-col items-start">
                            <span className="text-xl text-gray-400 line-through">
                              {showEgyptianPrice ? (plan as any).originalPriceEGP : (plan as any).originalPrice}
                            </span>
                            <span className="text-sm text-green-600 font-bold bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full">وفر {(plan as any).discount}</span>
                          </div>
                        )}
                      </div>
                      <div className="text-lg text-gray-500 dark:text-gray-400 font-medium">{plan.duration}</div>
                    </div>
                    <div className="space-y-4 mb-8">
                      {plan.features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-4 p-3 rounded-lg bg-white/50 dark:bg-gray-800/50 hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all">
                          <CheckIcon className="w-6 h-6 text-green-500 p-1 bg-green-100 dark:bg-green-900/30 rounded-full flex-shrink-0" />
                          <span className="text-gray-700 dark:text-gray-300 font-medium text-right flex-1">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button onClick={() => handleSubscribe(key as PlanKey)} className={`w-full font-semibold py-3 text-lg rounded-xl transition-all duration-300 transform hover:scale-105 text-white shadow-lg ${key === 'pro' ? 'bg-gradient-to-r from-blue-600 to-cyan-600' : key === 'proLife' ? 'bg-gradient-to-r from-green-600 to-amber-600' : 'bg-gradient-to-r from-emerald-600 to-teal-600'}`}>
                      <RocketIcon className="w-5 h-5 ml-2" />
                      {subscription?.hasActiveSubscription ? 'تمديد الاشتراك' : 'اشترك الآن'}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      {/* Payment Dialog with multi-step logic */}
      <PaymentDialog
        isOpen={isPaymentDialogOpen}
        onClose={handleDialogClose}
        plan={selectedPlan ? planCatalog[selectedPlan] : null}
        planKey={selectedPlan}
        showEgyptianPrice={showEgyptianPrice}
        onSuccess={triggerConfetti}
      />

      {/* Payment Confirmation Dialog for existing payers */}
      <PaymentConfirmationDialog
        isOpen={showPaymentConfirmDialog}
        onClose={setShowPaymentConfirmDialog}
        onSuccess={triggerConfetti}
      />
    </>
  );
}

// --- Multi-Step Payment Dialog Component ---
function PaymentDialog({ isOpen, onClose, plan, planKey, showEgyptianPrice, onSuccess }: {
    isOpen: boolean,
    onClose: (open: boolean) => void,
    plan: typeof SUBSCRIPTION_PLANS[PlanKey] | null,
    planKey: PlanKey | null,
    showEgyptianPrice: boolean,
    onSuccess: () => void
}) {
    const [currentStep, setCurrentStep] = useState(1);
    const [direction, setDirection] = useState(1);

    const { user: loggedInUser } = useUser();
    const isLoggedIn = !!(loggedInUser as any)?._id || !!(loggedInUser as any)?.id;

    const [userData, setUserData] = useState<UserData>({});
    const [phoneCountryCode, setPhoneCountryCode] = useState(countryCodes[1].value);
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);

    // Reset state on dialog close; skip step 1 for logged-in users
    useEffect(() => {
        if (!isOpen) {
            setTimeout(() => {
                setCurrentStep(isLoggedIn ? 2 : 1);
                if (!isLoggedIn) setUserData({});
                setTermsAccepted(false);
                setValidationErrors({});
                setSelectedPaymentMethod(null);
            }, 300);
        } else {
            if (isLoggedIn && loggedInUser) {
                const u = loggedInUser as any;
                setUserData({ name: u.fullName || u.username || u.name || '', email: u.email || '', password: '__session__', phoneNumber: (u.phone || '').replace(/^\+966|^\+20/, '') });
                setTermsAccepted(true);
                setCurrentStep(2);
            } else {
                const storedUser = localStorage.getItem('dakqaeq_currentUser');
                if (storedUser) {
                    try {
                        const localStorageUserData = JSON.parse(storedUser);
                        setUserData(prev => ({ ...prev, name: localStorageUserData?.name || '', email: localStorageUserData?.email || '' }));
                    } catch {}
                }
                setCurrentStep(1);
            }
        }
    }, [isOpen, isLoggedIn]);

    const handleNextStep = () => {
        const errors: ValidationErrors = {};
        if (!userData.name || userData.name.length < 3) errors.name = "الاسم الكامل مطلوب.";
        if (!userData.email || !/\S+@\S+\.\S+/.test(userData.email)) errors.email = "البريد الإلكتروني غير صحيح.";
        if (!isLoggedIn && (!userData.password || userData.password.length < 6)) errors.password = "كلمة المرور يجب أن تكون 6 أحرف على الأقل.";
        if (!userData.phoneNumber || !/^\d{7,10}$/.test(userData.phoneNumber)) errors.phoneNumber = "رقم الهاتف غير صحيح.";
        if (!termsAccepted) errors.terms = "يجب الموافقة على الشروط والأحكام.";

        setValidationErrors(errors);

        if (Object.keys(errors).length === 0) {
            setDirection(1);
            setCurrentStep(2);
        }
    };

    const handlePrevStep = () => {
        setDirection(-1);
        setCurrentStep(1);
    };

    const stepVariants = {
        hidden: (direction: number) => ({ opacity: 0, x: direction > 0 ? 300 : -300 }),
        visible: { opacity: 1, x: 0 },
        exit: (direction: number) => ({ opacity: 0, x: direction > 0 ? -300 : 300 }),
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden p-0">
                <DialogHeader className="p-6 pb-0">
                    <DialogTitle className="text-2xl font-bold text-center">
                        {plan && `اشتراك ${plan.name}`}
                    </DialogTitle>
                    <DialogDescription className="text-center">
                        خطوات قليلة وتصبح من المميزين!
                    </DialogDescription>
                </DialogHeader>
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
                    {/* Steps Indicator */}
                    <div className="flex justify-center items-center space-x-4 rtl:space-x-reverse mb-6">
                        {[1, 2].map((step, index) => (
                            <React.Fragment key={step}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold transition-all duration-300 ${currentStep >= step ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'}`}>{step}</div>
                                {index < 1 && <div className={`w-16 h-1 transition-all duration-300 ${currentStep > step ? 'bg-blue-500' : 'bg-gray-200'}`} />}
                            </React.Fragment>
                        ))}
                    </div>

                    <AnimatePresence initial={false} custom={direction}>
                        <motion.div
                            key={currentStep}
                            custom={direction}
                            variants={stepVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                        >
                            {currentStep === 1 && (
                                <UserDataStep
                                    userData={userData}
                                    setUserData={setUserData}
                                    phoneCountryCode={phoneCountryCode}
                                    setPhoneCountryCode={setPhoneCountryCode}
                                    termsAccepted={termsAccepted}
                                    setTermsAccepted={setTermsAccepted}
                                    errors={validationErrors}
                                    onNext={handleNextStep}
                                    isLoggedIn={isLoggedIn}
                                />
                            )}
                            {currentStep === 2 && plan && planKey &&(
                                <PaymentStep
                                    plan={plan}
                                    planKey={planKey}
                                    userData={userData}
                                    phoneCountryCode={phoneCountryCode}
                                    selectedMethod={selectedPaymentMethod}
                                    setSelectedMethod={setSelectedPaymentMethod}
                                    showEgyptianPrice={showEgyptianPrice}
                                    onBack={handlePrevStep}
                                    onSuccess={onSuccess}
                                    onClose={() => onClose(false)}
                                />
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// --- Step 1: User Data Form ---
function UserDataStep({ userData, setUserData, phoneCountryCode, setPhoneCountryCode, termsAccepted, setTermsAccepted, errors, onNext, isLoggedIn }: any) {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setUserData({ ...userData, [e.target.id]: e.target.value });
    };

    // If logged in, show a beautiful locked info card
    if (isLoggedIn) {
        return (
            <div className="space-y-5">
                <div className="text-center space-y-1">
                    <div className="w-14 h-14 mx-auto rounded-full bg-gradient-to-br from-blue-500 to-emerald-600 flex items-center justify-center shadow-lg">
                        <UserIcon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-lg font-bold">بيانات حسابك</h3>
                    <p className="text-xs text-slate-500 flex items-center justify-center gap-1">
                        <LockIcon className="w-3 h-3" /> مأخوذة تلقائياً من حسابك
                    </p>
                </div>

                <div className="rounded-2xl border border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-teal-500 dark:from-blue-950/40 dark:to-teal-500/40 overflow-hidden">
                    {[
                        { icon: UserIcon, label: 'الاسم الكامل', value: userData.name || '-', color: 'text-blue-600' },
                        { icon: MailIcon, label: 'البريد الإلكتروني', value: userData.email || '-', color: 'text-green-700' },
                        { icon: PhoneIcon, label: 'رقم الهاتف', value: userData.phoneNumber ? `${phoneCountryCode}${userData.phoneNumber}` : '-', color: 'text-green-600' },
                    ].map((item, i) => (
                        <div key={i} className={`flex items-center gap-3 px-4 py-3 ${i < 2 ? 'border-b border-blue-100 dark:border-blue-800/50' : ''}`}>
                            <div className={`w-8 h-8 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm flex-shrink-0`}>
                                <item.icon className={`w-4 h-4 ${item.color}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs text-slate-400 mb-0.5">{item.label}</p>
                                <p className="font-semibold text-sm text-slate-800 dark:text-slate-100 truncate">{item.value}</p>
                            </div>
                            <LockIcon className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
                        </div>
                    ))}
                </div>

                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2">
                    <CheckCircleIcon className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                    <p className="text-xs text-emerald-700 dark:text-emerald-300">سيتم ربط الاشتراك بحسابك تلقائياً. انتقل للخطوة التالية.</p>
                </div>

                <Button onClick={onNext} className="w-full font-bold bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-600 text-white py-5 text-base rounded-xl shadow-lg">
                    التالي — اختر طريقة الدفع
                    <ArrowLeftIcon className="w-4 h-4 mr-2" />
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-center">1. بيانات المشترك</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="name">الاسم الكامل</Label>
                    <Input id="name" value={userData.name || ''} onChange={handleChange} placeholder="أدخل اسمك الكامل" />
                    {errors.name && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircleIcon className="w-3 h-3"/>{errors.name}</p>}
                </div>
                <div>
                    <Label htmlFor="email">البريد الإلكتروني</Label>
                    <Input id="email" type="email" value={userData.email || ''} onChange={handleChange} placeholder="example@gmail.com" />
                    {errors.email && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircleIcon className="w-3 h-3"/>{errors.email}</p>}
                </div>
                <div>
                    <Label htmlFor="password">كلمة المرور</Label>
                    <Input id="password" type="password" value={userData.password || ''} onChange={handleChange} placeholder="6 أحرف على الأقل" />
                    {errors.password && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircleIcon className="w-3 h-3"/>{errors.password}</p>}
                </div>
                <div>
                    <Label htmlFor="phoneNumber">رقم الهاتف</Label>
                    <div className="flex gap-2">
                        <Select value={phoneCountryCode} onValueChange={setPhoneCountryCode}>
                            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                            <SelectContent>{countryCodes.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                        </Select>
                        <Input id="phoneNumber" value={userData.phoneNumber || ''} onChange={handleChange} placeholder="512345678" />
                    </div>
                    {errors.phoneNumber && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircleIcon className="w-3 h-3"/>{errors.phoneNumber}</p>}
                </div>
            </div>
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <input type="checkbox" id="terms" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} />
                <Label htmlFor="terms" className="text-sm">أوافق على الشروط والأحكام وسياسة الخصوصية</Label>
            </div>
            {errors.terms && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircleIcon className="w-3 h-3"/>{errors.terms}</p>}
            <Button onClick={onNext} className="w-full font-bold">التالي<ArrowLeftIcon className="w-4 h-4 mr-2" /></Button>
        </div>
    );
}

// --- Step 2: Payment Method Selection ---
function PaymentStep({ plan, planKey, userData, phoneCountryCode, selectedMethod, setSelectedMethod, showEgyptianPrice, onBack, onSuccess, onClose }: any) {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [copySuccess, setCopySuccess] = useState<string | null>(null);
    const [cardPaymentBlocked, setCardPaymentBlocked] = useState(false);
    const [manualPaymentUrl, setManualPaymentUrl] = useState('');
    const [paymentAttempts, setPaymentAttempts] = useState(0);
    const [receiptFile, setReceiptFile] = useState<File | null>(null);
    const [receiptError, setReceiptError] = useState('');
    const [walletBalance, setWalletBalance] = useState<number | null>(null);
    const [walletLoading, setWalletLoading] = useState(false);
    const [qodratakPayOpen, setQodratakPayOpen] = useState(false);

    useEffect(() => {
        if (selectedMethod === 'wallet') {
            setWalletLoading(true);
            fetch('/api/wallet', { credentials: 'include' })
                .then(r => r.json())
                .then(d => setWalletBalance(d?.wallet?.balance ?? d?.balance ?? 0))
                .catch(() => setWalletBalance(0))
                .finally(() => setWalletLoading(false));
        }
    }, [selectedMethod]);

    const handleWalletPayment = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/subscription/pay-with-wallet', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ planKey })
            });
            const data = await response.json();
            if (response.ok && data.success) {
                onSuccess();
                onClose();
                toast({
                    title: "🎉 تم تفعيل الاشتراك فوراً!",
                    description: data.message || "تم خصم المبلغ من محفظتك وتفعيل اشتراكك",
                    className: "bg-green-500 text-white"
                });
            } else {
                toast({
                    title: "❌ خطأ في الدفع",
                    description: data.message || "حدث خطأ أثناء الدفع بالمحفظة",
                    variant: "destructive"
                });
            }
        } catch {
            toast({ title: "❌ خطأ في الاتصال", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    const handleReceiptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                setReceiptError('حجم الملف كبير جداً. الحد الأقصى 5MB');
                return;
            }
            setReceiptFile(file);
            setReceiptError('');
            toast({ title: '✅ تم اختيار السند', description: file.name });
        }
    };

    const handleSubmitRequest = async (method: 'bank' | 'card') => {
        if (method === 'bank' && !receiptFile) {
            setReceiptError('⚠️ رفع سند التحويل مطلوب قبل إرسال الطلب');
            return;
        }
        setReceiptError('');
        setIsLoading(true);
        try {
            const formData = new FormData();
            formData.append('name', userData.name || '');
            formData.append('email', userData.email || '');
            formData.append('password', userData.password || '');
            formData.append('phone', `${phoneCountryCode}${userData.phoneNumber || ''}`);
            formData.append('planKey', planKey || '');
            formData.append('paymentMethod', method);

            if (method === 'bank' && receiptFile) {
                formData.append('receipt', receiptFile);
            }

            const response = await fetch('/api/subscription/subscribe-request', {
                method: 'POST',
                body: formData,
                credentials: 'include'
            });

            const data = await response.json();

            if (response.ok && data.success) {
                setReceiptFile(null);
                onSuccess();
                onClose();
                toast({
                    title: "🎉 تم تسجيل طلب اشتراكك!",
                    description: "سيتم مراجعة طلبك وتفعيل اشتراكك خلال 24 ساعة",
                    className: "bg-green-500 text-white"
                });
            } else {
                toast({
                    title: "❌ خطأ",
                    description: data.message || "حدث خطأ. يرجى المحاولة مرة أخرى",
                    variant: "destructive"
                });
            }
        } catch {
            toast({
                title: "❌ خطأ في الاتصال",
                description: "يرجى التحقق من الاتصال بالإنترنت والمحاولة مرة أخرى",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };


    const handleCopy = async (text: string, type: string) => {
        await navigator.clipboard.writeText(text);
        setCopySuccess(type);
        toast({ title: "✅ تم النسخ بنجاح!" });
        setTimeout(() => setCopySuccess(null), 2000);
    };

    const handleCardPayment = () => {
        const paymentUrl = PAYPAL_LINKS[planKey as keyof typeof PAYPAL_LINKS];
        const newAttempts = paymentAttempts + 1;
        setPaymentAttempts(newAttempts);

        const newWindow = window.open(paymentUrl, '_blank', 'noopener,noreferrer');

        if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
            toast({
                title: "🔗 انقر للانتقال للدفع",
                description: "تم حجب النافذة المنبثقة. انقر على الرابط أدناه للدفع.",
                variant: "destructive"
            });
            setCardPaymentBlocked(true);
            setManualPaymentUrl(paymentUrl);
        } else {
            toast({
                title: "💳 أكمل الدفع على PayPal",
                description: "بعد إتمام الدفع، ارجع لهذه الصفحة وارفع التأكيد ثم اضغط إرسال الطلب"
            });
        }
    };

    return (
        <div className="space-y-6">
            <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">2. اختر طريقة الدفع</h3>
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200">
                    <div className="text-3xl font-bold text-blue-600 mb-2">
                      {showEgyptianPrice ? plan.priceEGP : plan.price}
                    </div>
                    <div className="text-sm text-gray-600">{plan.duration}</div>
                </div>
            </div>

            <div className="space-y-4">
                <RadioGroup value={selectedMethod || ""} onValueChange={(value) => setSelectedMethod(value as PaymentMethod)}>
                    {/* Bank Transfer Option */}
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        <RadioGroupItem value="bank" id="bank" />
                        <Label htmlFor="bank" className="flex-1 cursor-pointer">
                            <div className="flex items-center gap-3 p-4 border rounded-lg hover:bg-muted">
                                <BanknoteIcon className="w-8 h-8 text-green-600" />
                                <div>
                                    <div className="font-semibold">تحويل بنكي</div>
                                    <div className="text-sm text-muted-foreground">سريع وآمن (الأسهل)</div>
                                </div>
                            </div>
                        </Label>
                    </div>

                    {/* Credit Card Option */}
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        <RadioGroupItem value="card" id="card" />
                        <Label htmlFor="card" className="flex-1 cursor-pointer">
                            <div className="flex items-center gap-3 p-4 border rounded-lg hover:bg-muted">
                                <CreditCardIcon className="w-8 h-8 text-blue-600" />
                                <div>
                                    <div className="font-semibold">بطاقة ائتمان</div>
                                    <div className="text-sm text-muted-foreground">عبر PayPal آمن</div>
                                </div>
                            </div>
                        </Label>
                    </div>

                    {/* Wallet Option */}
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        <RadioGroupItem value="wallet" id="wallet" />
                        <Label htmlFor="wallet" className="flex-1 cursor-pointer">
                            <div className="flex items-center gap-3 p-4 border-2 rounded-lg hover:bg-muted border-green-400 dark:border-green-400">
                                <WalletIcon className="w-8 h-8 text-green-700" />
                                <div>
                                    <div className="font-semibold">المحفظة الإلكترونية</div>
                                    <div className="text-sm text-muted-foreground">دفع فوري — تفعيل لحظي</div>
                                </div>
                            </div>
                        </Label>
                    </div>

                    {/* Qodratak Pay Option */}
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        <RadioGroupItem value="qodratak_pay" id="qodratak_pay" />
                        <Label htmlFor="qodratak_pay" className="flex-1 cursor-pointer">
                            <div className="flex items-center gap-3 p-4 border-2 rounded-lg hover:bg-muted border-teal-400 dark:border-teal-400 bg-gradient-to-r from-teal-600/50 to-emerald-600/50 dark:from-teal-600/20 dark:to-emerald-600/20">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-600 to-emerald-600 flex items-center justify-center flex-shrink-0">
                                    <CreditCardIcon className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <div className="font-semibold text-teal-700 dark:text-teal-700">قدراتك باي 💳</div>
                                    <div className="text-sm text-muted-foreground">ادفع ببطاقة قدراتك الرقمية — تفعيل فوري</div>
                                </div>
                            </div>
                        </Label>
                    </div>
                </RadioGroup>
            </div>

            {/* Bank Transfer Details - Egyptian Style */}
            {selectedMethod === 'bank' && (
                <div className="p-6 border-2 border-dashed border-yellow-400 rounded-xl bg-gradient-to-br from-yellow-50 via-green-50 to-red-50 dark:from-yellow-900/20 dark:via-green-900/20 dark:to-red-900/20 relative overflow-hidden">
                    {/* Egyptian Flag Background */}
                    <div className="absolute top-0 right-0 text-6xl opacity-20">🇪🇬</div>
                    <div className="absolute bottom-0 left-0 text-4xl opacity-20">🔺</div>

                    <div className="relative z-10">
                        <h4 className="font-bold mb-6 text-center text-2xl bg-gradient-to-r from-red-600 via-white to-black bg-clip-text text-transparent drop-shadow-sm">
                            🏦 حسابات التحويل في مصر الحبيبة 🇪🇬
                        </h4>
                        <div className="space-y-4">
                            {Object.entries(BANK_ACCOUNTS).map(([key, account]) => (
                                <div key={key} className="relative group">
                                    <div className="p-4 bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-700 rounded-xl border-2 border-yellow-200 dark:border-yellow-600 shadow-md hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]">
                                        <div className="flex justify-between items-center">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="text-2xl">{account.flag}</span>
                                                    <div className="font-bold text-lg text-gray-800 dark:text-gray-100">{account.name}</div>
                                                </div>
                                                <div className="text-sm text-gray-600 dark:text-gray-300 font-medium font-mono">
                                                    {'iban' in account ? `IBAN: ${account.iban}` : `رقم المحفظة: ${account.number}`}
                                                </div>
                                                <div className="mt-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 text-xs rounded-full inline-block">
                                                    ✅ متاح للتحويل الفوري
                                                </div>
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleCopy('iban' in account ? account.iban : account.number, key)}
                                                className="bg-gradient-to-r from-yellow-400 to-orange-400 hover:from-yellow-500 hover:to-orange-500 text-black border-yellow-500 shadow-lg transform hover:scale-110 transition-all duration-200"
                                            >
                                                {copySuccess === key ? (
                                                    <span><CheckIcon className="w-4 h-4 mr-1" /> تم النسخ!</span>
                                                ) : (
                                                    <span><CopyIcon className="w-4 h-4 mr-1" /> نسخ</span>
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                    {/* Decorative glow effect */}
                                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-yellow-400/20 to-red-400/20 -z-10 blur-sm group-hover:blur-md transition-all duration-300"></div>
                                </div>
                            ))}
                        </div>

                        {/* Enhanced Egyptian-themed instructions */}
                        <div className="mt-6 p-4 bg-gradient-to-r from-green-100 via-white to-red-100 dark:from-green-900/30 dark:via-gray-800 dark:to-red-900/30 rounded-xl border-2 border-green-300 dark:border-green-600">
                            <div className="text-center space-y-2">
                                <div className="text-lg font-bold text-green-800 dark:text-green-200">🎺 تعليمات التحويل للأخوة المصريين 🎺</div>
                                <div className="flex items-center justify-center gap-4 text-sm">
                                    <div className="flex items-center gap-1">
                                        <span>📱</span>
                                        <span>سهل وسريع</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <span>🛡️</span>
                                        <span>آمن ومضمون</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <span>⚡</span>
                                        <span>تفعيل فوري</span>
                                    </div>
                                </div>
                                <div className="text-xs text-gray-600 dark:text-gray-300 bg-yellow-100 dark:bg-yellow-900/30 p-2 rounded-lg">
                                    💡 <strong>ملاحظة مهمة:</strong> بعد التحويل، اضغط على زر "تأكيد إتمام الدفع" أدناه وسيتم مراجعة طلبك وتفعيل اشتراكك خلال 24 ساعة
                                </div>
                            </div>
                        </div>
                    </div>

                    <Separator className="my-4" />

                    {/* ─── Receipt Upload — MANDATORY ─── */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <UploadCloudIcon className="w-4 h-4 text-red-500" />
                            <label className="text-sm font-bold text-slate-800 dark:text-slate-100">
                                رفع سند التحويل
                                <span className="text-red-500 mr-1">*</span>
                                <span className="text-xs font-normal text-red-500">(مطلوب إلزامياً)</span>
                            </label>
                        </div>

                        <div className={`relative rounded-2xl border-2 border-dashed transition-all duration-300 overflow-hidden ${
                            receiptFile
                                ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30'
                                : receiptError
                                ? 'border-red-400 bg-red-50 dark:bg-red-950/20 animate-pulse'
                                : 'border-blue-300 bg-gradient-to-br from-blue-50 to-teal-500 dark:from-blue-900/20 dark:to-teal-500/20 hover:border-blue-500'
                        }`}>
                            <input
                                type="file"
                                accept="image/*,.pdf"
                                onChange={handleReceiptChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                data-testid="input-transfer-receipt"
                            />
                            <div className="pointer-events-none p-6 text-center">
                                {receiptFile ? (
                                    <div className="space-y-2">
                                        <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                                            <FileCheckIcon className="w-7 h-7 text-emerald-600" />
                                        </div>
                                        <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">✅ تم رفع السند بنجاح</p>
                                        <p className="text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 px-3 py-1 rounded-full inline-block truncate max-w-full">
                                            {receiptFile.name}
                                        </p>
                                        <p className="text-xs text-emerald-500">اضغط لتغيير الملف</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <div className="w-14 h-14 mx-auto rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                                            <UploadCloudIcon className="w-7 h-7 text-blue-500" />
                                        </div>
                                        <p className="text-sm font-bold text-blue-700 dark:text-blue-300">اضغط أو اسحب صورة السند هنا</p>
                                        <p className="text-xs text-slate-500">PNG, JPG, PDF — بحد أقصى 5MB</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {receiptError && (
                            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
                                <AlertCircleIcon className="w-4 h-4 text-red-500 flex-shrink-0" />
                                <p className="text-xs text-red-600 dark:text-red-400 font-medium">{receiptError}</p>
                            </div>
                        )}
                    </div>

                    <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800 flex items-start gap-2">
                        <ClockIcon className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-700 dark:text-amber-300">سيتم مراجعة طلبك وتفعيل اشتراكك خلال <strong>24 ساعة</strong> من رفع السند</p>
                    </div>
                </div>
            )}

            {/* Credit Card / PayPal Payment */}
            {selectedMethod === 'card' && (
                <div className="space-y-4">
                    <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-900/20">
                        <h4 className="font-semibold mb-4 text-center">💳 الدفع بالبطاقة الائتمانية عبر PayPal</h4>

                        {!cardPaymentBlocked ? (
                            <div className="space-y-3">
                                <div className="text-center text-sm text-gray-600 dark:text-gray-300">
                                    سيتم توجيهك لموقع PayPal الآمن لإتمام عملية الدفع
                                </div>
                                <Button
                                    onClick={handleCardPayment}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3"
                                >
                                    <CreditCardIcon className="w-5 h-5 mr-2" />
                                    {paymentAttempts > 0 ? `فتح PayPal مرة أخرى (${paymentAttempts})` : 'ادفع الآن عبر PayPal'}
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div className="text-center text-sm text-orange-600 dark:text-orange-400">
                                    ⚠️ تم حجب النافذة المنبثقة. استخدم الرابط المباشر أدناه:
                                </div>
                                <Button
                                    onClick={() => { window.open(manualPaymentUrl, '_blank'); setPaymentAttempts(a => a + 1); }}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                    🔗 فتح رابط الدفع مباشرة
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Show receipt upload + submit after user has tried to pay */}
                    {paymentAttempts > 0 && (
                        <div className="p-4 border-2 border-dashed border-blue-300 dark:border-blue-700 rounded-xl bg-blue-50 dark:bg-blue-900/10 space-y-4">
                            <div className="flex items-center gap-2">
                                <UploadCloudIcon className="w-4 h-4 text-blue-500" />
                                <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                                    ارفع تأكيد الدفع من PayPal
                                    <span className="text-xs font-normal text-slate-500 mr-2">(اختياري — يُسرّع المراجعة)</span>
                                </p>
                            </div>

                            <div className={`relative rounded-2xl border-2 border-dashed transition-all duration-300 overflow-hidden ${
                                receiptFile
                                    ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30'
                                    : receiptError
                                    ? 'border-red-400 bg-red-50 dark:bg-red-950/20'
                                    : 'border-blue-300 bg-white dark:bg-blue-900/20 hover:border-blue-500'
                            }`}>
                                <input
                                    type="file"
                                    accept="image/*,.pdf"
                                    onChange={handleReceiptChange}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    data-testid="input-paypal-receipt"
                                />
                                <div className="pointer-events-none p-5 text-center">
                                    {receiptFile ? (
                                        <div className="space-y-1">
                                            <FileCheckIcon className="w-8 h-8 mx-auto text-emerald-600" />
                                            <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">✅ تم رفع التأكيد</p>
                                            <p className="text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 px-3 py-1 rounded-full inline-block truncate max-w-full">{receiptFile.name}</p>
                                            <p className="text-xs text-emerald-500">اضغط لتغيير الملف</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-1">
                                            <UploadCloudIcon className="w-8 h-8 mx-auto text-blue-400" />
                                            <p className="text-sm font-medium text-blue-700 dark:text-blue-300">اضغط أو اسحب صورة التأكيد هنا</p>
                                            <p className="text-xs text-slate-500">PNG, JPG, PDF — بحد أقصى 5MB</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800 flex items-start gap-2">
                                <ClockIcon className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                                <p className="text-xs text-amber-700 dark:text-amber-300">بعد إتمام الدفع على PayPal، اضغط <strong>"إرسال طلب الاشتراك"</strong> لإتمام العملية</p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Wallet Payment Panel */}
            {selectedMethod === 'wallet' && (
                <div className="p-5 border-2 border-green-400 dark:border-green-400 rounded-xl bg-gradient-to-br from-green-600 to-teal-500 dark:from-green-600/30 dark:to-teal-500/30 space-y-4">
                    <div className="flex items-center gap-2 mb-3">
                        <WalletIcon className="w-5 h-5 text-green-700" />
                        <h4 className="font-bold text-green-700 dark:text-green-700">الدفع عبر المحفظة</h4>
                    </div>
                    {walletLoading ? (
                        <div className="flex items-center justify-center py-4">
                            <LoaderCircleIcon className="w-6 h-6 animate-spin text-green-700" />
                            <span className="mr-2 text-sm text-green-700">جاري تحميل رصيد المحفظة...</span>
                        </div>
                    ) : (
                        <>
                            <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-900 rounded-xl border border-green-400 dark:border-green-400 shadow-sm">
                                <div>
                                    <div className="text-sm text-muted-foreground">رصيدك الحالي</div>
                                    <div className={`text-2xl font-bold ${(walletBalance ?? 0) >= parseFloat(plan.price) ? 'text-green-600' : 'text-red-500'}`}>
                                        {walletBalance ?? 0} ريال
                                    </div>
                                </div>
                                <div className="text-left">
                                    <div className="text-sm text-muted-foreground">سيتم خصم</div>
                                    <div className="text-2xl font-bold text-green-700">{plan.price}</div>
                                </div>
                            </div>
                            {walletBalance !== null && walletBalance < parseFloat(plan.price) && (
                                <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-800">
                                    <AlertCircleIcon className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                                    <p className="text-xs text-red-700 dark:text-red-300">
                                        رصيدك غير كافٍ. تحتاج إلى <strong>{(parseFloat(plan.price) - walletBalance).toFixed(0)} ريال</strong> إضافية. اشحن محفظتك أولاً من صفحة المحفظة.
                                    </p>
                                </div>
                            )}
                            {walletBalance !== null && walletBalance >= parseFloat(plan.price) && (
                                <div className="flex items-start gap-2 p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                                    <CheckCircleIcon className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                                    <p className="text-xs text-green-700 dark:text-green-300">
                                        رصيدك كافٍ ✓ — سيتم تفعيل الاشتراك <strong>فوراً</strong> بعد الضغط على زر الدفع.
                                    </p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}

            {/* Qodratak Pay Panel */}
            {selectedMethod === 'qodratak_pay' && (
                <div className="p-5 border-2 border-teal-400 dark:border-teal-400 rounded-xl bg-gradient-to-br from-teal-600 to-emerald-600 dark:from-teal-600/30 dark:to-emerald-600/30 space-y-4">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-6 h-6 rounded-md bg-gradient-to-br from-teal-600 to-emerald-600 flex items-center justify-center">
                            <CreditCardIcon className="w-4 h-4 text-white" />
                        </div>
                        <h4 className="font-bold text-teal-700 dark:text-teal-700">الدفع عبر قدراتك باي</h4>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-2">
                        <p>• أدخل رقم بطاقة قدراتك الرقمية والرمز السري (PIN)</p>
                        <p>• سيُرسل رمز تأكيد إلى بريد صاحب البطاقة</p>
                        <p>• بعد التأكيد يتم خصم المبلغ وتفعيل اشتراكك فوراً</p>
                    </div>
                    <Button
                        data-testid="button-open-qodratak-pay"
                        onClick={() => setQodratakPayOpen(true)}
                        className="w-full bg-gradient-to-l from-teal-600 to-emerald-600 hover:from-teal-600 hover:to-emerald-600 text-white font-bold gap-2 rounded-xl"
                    >
                        <CreditCardIcon className="w-4 h-4" />
                        ادفع الآن — {plan.price} ر.س
                    </Button>
                </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-3">
                <Button variant="outline" onClick={onBack} className="flex-1">
                    السابق
                </Button>
                {selectedMethod === 'bank' && (
                    <Button
                        onClick={() => handleSubmitRequest('bank')}
                        disabled={isLoading || !receiptFile}
                        className={`flex-1 text-white font-bold transition-all duration-300 ${
                            receiptFile
                                ? 'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 shadow-lg shadow-emerald-500/30'
                                : 'bg-slate-400 cursor-not-allowed opacity-60'
                        }`}
                    >
                        {isLoading ? (
                            <>
                                <LoaderCircleIcon className="w-5 h-5 mr-2 animate-spin" />
                                جاري الإرسال...
                            </>
                        ) : receiptFile ? (
                            <>
                                <CheckCircleIcon className="w-5 h-5 mr-2" />
                                إرسال طلب الاشتراك ✓
                            </>
                        ) : (
                            <>
                                <UploadCloudIcon className="w-5 h-5 mr-2" />
                                ارفع السند أولاً
                            </>
                        )}
                    </Button>
                )}
                {selectedMethod === 'card' && paymentAttempts > 0 && (
                    <Button
                        onClick={() => handleSubmitRequest('card')}
                        disabled={isLoading}
                        className="flex-1 bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-500 text-white font-bold shadow-lg shadow-blue-500/30 transition-all duration-300"
                    >
                        {isLoading ? (
                            <>
                                <LoaderCircleIcon className="w-5 h-5 mr-2 animate-spin" />
                                جاري الإرسال...
                            </>
                        ) : (
                            <>
                                <CheckCircleIcon className="w-5 h-5 mr-2" />
                                إرسال طلب الاشتراك ✓
                            </>
                        )}
                    </Button>
                )}
                {selectedMethod === 'wallet' && (
                    <Button
                        onClick={handleWalletPayment}
                        disabled={isLoading || walletLoading || walletBalance === null || walletBalance < parseFloat(plan.price)}
                        className={`flex-1 text-white font-bold transition-all duration-300 ${
                            walletBalance !== null && walletBalance >= parseFloat(plan.price)
                                ? 'bg-gradient-to-r from-green-600 to-teal-500 hover:from-green-600 hover:to-teal-500 shadow-lg shadow-green-500/30'
                                : 'bg-slate-400 cursor-not-allowed opacity-60'
                        }`}
                        data-testid="button-wallet-pay"
                    >
                        {isLoading ? (
                            <>
                                <LoaderCircleIcon className="w-5 h-5 mr-2 animate-spin" />
                                جاري الدفع...
                            </>
                        ) : (
                            <>
                                <WalletIcon className="w-5 h-5 mr-2" />
                                ادفع من المحفظة
                            </>
                        )}
                    </Button>
                )}
            </div>

            {/* Qodratak Pay Dialog */}
            <QodratakPayDialog
                open={qodratakPayOpen}
                onOpenChange={setQodratakPayOpen}
                amount={parseFloat(plan.price)}
                description={`اشتراك ${plan.title || ''}`}
                onSuccess={() => {
                    setQodratakPayOpen(false);
                    onSuccess();
                    onClose();
                }}
            />
        </div>
    );
}

// --- Payment Confirmation Dialog Component ---
function PaymentConfirmationDialog({ isOpen, onClose, onSuccess }: { isOpen: boolean, onClose: (open: boolean) => void, onSuccess: () => void }) {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [userEmail, setUserEmail] = useState('');
    const [validationError, setValidationError] = useState('');

    const handleManualConfirmation = () => {
        setIsLoading(true);
        setTimeout(() => {
            setIsLoading(false);
            onSuccess();
            onClose(false);
            toast({
                title: "تم تسجيل طلبك",
                description: "سيتم مراجعة اشتراكك وتفعيله خلال 24 ساعة",
            });
        }, 1000);
    };

    const validateAndProceed = () => {
        if (!userEmail || !/\S+@\S+\.\S+/.test(userEmail)) {
            setValidationError("يرجى إدخال بريد إلكتروني صحيح");
            return;
        }
        setValidationError('');
        handleManualConfirmation();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-center text-xl font-bold">
                        🔍 تأكيد الاشتراك المدفوع
                    </DialogTitle>
                    <DialogDescription className="text-center">
                        إذا كنت دفعت بالفعل، يمكنك تأكيد اشتراكك من هنا
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-sm text-blue-700 dark:text-blue-300 text-center">
                        أدخل بريدك الإلكتروني وسيتم مراجعة اشتراكك خلال 24 ساعة
                    </div>
                    <div>
                        <Label htmlFor="confirmEmail">البريد الإلكتروني المستخدم في الدفع</Label>
                        <Input
                            id="confirmEmail"
                            type="email"
                            value={userEmail}
                            onChange={(e) => setUserEmail(e.target.value)}
                            placeholder="أدخل بريدك الإلكتروني"
                        />
                        {validationError && (
                            <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                                <AlertCircleIcon className="w-3 h-3"/>
                                {validationError}
                            </p>
                        )}
                    </div>
                    <Button
                        onClick={validateAndProceed}
                        disabled={!userEmail || isLoading}
                        className="w-full"
                    >
                        {isLoading ? (
                            <>
                                <LoaderCircleIcon className="w-5 h-5 mr-2 animate-spin" />
                                جاري المعالجة...
                            </>
                        ) : (
                            <>
                                <CheckCircleIcon className="w-5 h-5 mr-2" />
                                تأكيد الطلب
                            </>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}