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
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Constants
const PAYPAL_PRO_LINK = "https://www.paypal.com/ncp/payment/XZWPA8WLMNDGS";
const PAYPAL_PRO_LIFE_LINK = "https://www.paypal.com/ncp/payment/SWGPHGE2JM9NN";
const STC_PAY_NUMBER = "+966532441566";
const BANK_ACCOUNT_NUMBER = "SA78 8000 0539 6080 1942 4738";
const OTP_COUNTDOWN_SECONDS = 180; // 3 دقائق

const countryCodes = [
  { value: "+966", label: "🇸🇦 +966 (السعودية)" },
  { value: "+20", label: "🇪🇬 +20 (مصر)" },
  { value: "+971", label: "🇦🇪 +971 (الإمارات)" },
];

export function SubscriptionPlans() {
  const { toast } = useToast();

  // State Management
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'pro' | 'proLife' | null>(null);
  const [currentStep, setCurrentStep] = useState(1);

  // Step 1: User Data
  const [userData, setUserData] = useState<{ name?: string, email?: string, password?: string, phoneNumber?: string }>({});
  const [phoneCountryCode, setPhoneCountryCode] = useState(countryCodes[0].value);
  const [termsAccepted, setTermsAccepted] = useState(false); // <-- إضافة جديدة

  // Step 2: OTP
  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);
  const [otpInput, setOtpInput] = useState<string[]>(new Array(6).fill(""));
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(OTP_COUNTDOWN_SECONDS);
  const [isVerifying, setIsVerifying] = useState(false);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Step 3: Payment
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'bank' | 'stc' | 'paypal' | null>(null);
  const [copySuccess, setCopySuccess] = useState<'bank' | 'stc' | null>(null);

  // Effects
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const localStorageUserData = JSON.parse(storedUser);
        setUserData(prev => ({ ...prev, name: localStorageUserData?.name || '', email: localStorageUserData?.email || '' }));
      } catch (error) { console.error("Failed to parse user data from localStorage", error); }
    }
  }, []);

  useEffect(() => {
    if (isOtpSent && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
        setIsOtpSent(true); 
    }
  }, [isOtpSent, countdown]);


  // Handlers
  const handleCopy = async (text: string, type: 'bank' | 'stc') => {
    await navigator.clipboard.writeText(text);
    setCopySuccess(type);
    toast({
      title: "✅ تم النسخ بنجاح!",
      description: `تم نسخ ${type === 'bank' ? 'رقم الحساب' : 'رقم STC Pay'} إلى الحافظة.`,
      className: "bg-green-500 text-white dark:bg-green-600 dark:text-white",
    });
    setTimeout(() => setCopySuccess(null), 2500);
  };

  const resetState = () => {
    setCurrentStep(1);
    setTermsAccepted(false); // <-- إضافة جديدة
    setIsOtpSent(false);
    setGeneratedOtp(null);
    setOtpInput(new Array(6).fill(""));
    setCountdown(OTP_COUNTDOWN_SECONDS);
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

  const handleSendOtp = (method: 'whatsapp' | 'telegram') => {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(otp);

    const message = encodeURIComponent(`${otp} هو الرمز السري لمرة واحدة لهذه المعاملة. يرجى عدم مشاركته مع أحد.`);
    let url = '';

    if (method === 'telegram') {
      url = `https://t.me/qodratak2030?text=${message}`;
    } else { // whatsapp
      const whatsappNumber = "201155201921";
      url = `https://api.whatsapp.com/send/?phone=${whatsappNumber}&text=${message}&type=phone_number&app_absent=0`;
    }

    window.open(url, '_blank', 'noopener,noreferrer');
    setIsOtpSent(true);
    setCountdown(OTP_COUNTDOWN_SECONDS);
    toast({
        title: "📲 تم إرسال الرمز!",
        description: `لقد أرسلنا رمز التحقق إلى حسابك في ${method === 'telegram' ? 'تليجرام' : 'واتساب'}.`,
    });
  };

  const handleOtpInputChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const { value } = e.target;
    if (/^[0-9]$/.test(value) || value === "") {
        const newOtpInput = [...otpInput];
        newOtpInput[index] = value;
        setOtpInput(newOtpInput);

        if (value && index < 5) {
            otpInputRefs.current[index + 1]?.focus();
        }
    }
  };

  const handleOtpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !otpInput[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '');
    if (pastedData.length === 6) {
      e.preventDefault();
      const newOtp = pastedData.split('');
      setOtpInput(newOtp);
      otpInputRefs.current[5]?.focus();
    }
  };

  const handleVerifyOtp = () => {
    setIsVerifying(true);
    const enteredOtp = otpInput.join("");

    setTimeout(() => {
        if (enteredOtp === generatedOtp) {
            toast({ title: "✅ تم التحقق بنجاح!", description: "تم تأكيد رقم هاتفك. يرجى اختيار طريقة الدفع.", className: "bg-green-500 text-white dark:bg-green-600 dark:text-white" });
            setCurrentStep(3);
        } else {
            toast({ title: "❌ رمز غير صحيح", description: "الرمز الذي أدخلته غير صحيح. يرجى المحاولة مرة أخرى.", variant: "destructive" });
            setOtpInput(new Array(6).fill(""));
            otpInputRefs.current[0]?.focus();
        }
        setIsVerifying(false);
    }, 1000);
  };

  const getTelegramMessage = (paymentMethod: 'PayPal' | 'Bank Transfer' | 'STC Pay') => {
    const planDetailsData = selectedPlan ? { pro: { name: "Pro", price: "180" }, proLife: { name: "Pro Life", price: "400" } }[selectedPlan] : { name: '', price: '' };
    const passwordPart = userData.password ? `كلمة المرور: ${userData.password}\n` : '(لم يتم إدخال كلمة مرور جديدة)\n';
    const finalNote = paymentMethod === 'PayPal' 
      ? '✅ الرجاء إرفاق لقطة شاشة واضحة لتأكيد الدفع.' 
      : '📄 الرجاء إرفاق صورة من سند التحويل.';

    return encodeURIComponent(
`🚀 طلب اشتراك جديد (مؤكد) 🚀
------------------------------------
👤 الاسم: ${userData?.name || 'غير متوفر'}
📧 البريد الإلكتروني: ${userData?.email || 'غير متوفر'}
${passwordPart}📱 رقم الهاتف: ${phoneCountryCode || ''}${userData?.phoneNumber || 'غير متوفر'}
💎 الباقة: ${planDetailsData.name} (${planDetailsData.price} ريال)
💳 طريقة الدفع: ${paymentMethod}
------------------------------------
${finalNote}`
    );
  };

  const handlePaymentAndRedirect = (paymentMethod: 'Bank Transfer' | 'STC Pay') => {
    const message = getTelegramMessage(paymentMethod);
    window.open(`https://t.me/qodratak2030?text=${message}`, '_blank', 'noopener,noreferrer');
  };

  const handlePayPalPayment = () => {
    const payPalLink = selectedPlan === 'pro' ? PAYPAL_PRO_LINK : PAYPAL_PRO_LIFE_LINK;
    if (!payPalLink) {
        toast({ title: "⚠️ خطأ", description: "رابط PayPal غير متوفر.", variant: "destructive" });
        return;
    }

    window.open(payPalLink, '_blank', 'noopener,noreferrer');
    const telegramLink = `https://t.me/qodratak2030?text=${getTelegramMessage('PayPal')}`;

    setTimeout(() => window.open(telegramLink, '_blank', 'noopener,noreferrer'), 1000);

    setIsPaymentDialogOpen(false);

    toast({
        title: "👍 تم توجيهك إلى PayPal",
        description: (
          <div className="text-sm space-y-2 text-right" dir="rtl">
            <p><strong>1. أكمل الدفع</strong> في نافذة PayPal.</p>
            <p><strong>2. جهّز التأكيد:</strong> خذ لقطة شاشة لإثبات الدفع.</p>
            <p><strong>3. أرسل الطلب:</strong> إذا لم تفتح نافذة تليجرام تلقائياً، اضغط على الرابط أدناه لإرسال طلبك مع إرفاق لقطة الشاشة.</p>
            <Button variant="link" className="p-0 h-auto text-blue-500" onClick={() => window.open(telegramLink, '_blank', 'noopener,noreferrer')}>فتح تليجرام يدوياً</Button>
          </div>
        ),
        duration: 30000,
        className: "w-auto max-w-md p-4",
    });
  };

  // Render Functions
  const planDetails = {
    pro: { name: "Pro", price: "180", description: "باقة سنوية مميزة لكل احتياجاتك" },
    proLife: { name: "Pro Life", price: "400", originalPrice: "500", discount: "20%", description: "الاشتراك الذهبي، مرة واحدة مدى الحياة" }
  };
  const currentPlanDetails = selectedPlan ? planDetails[selectedPlan] : null;

  // --- تحديث منطق التحقق ---
  const isStepOneValid = userData.name && userData.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.email) && userData.password && userData.password.length >= 6 && userData.phoneNumber && userData.phoneNumber.length >= 7 && termsAccepted;

  const renderStepOneInfo = () => (
    <div className="space-y-6 pt-4">
      <div className="space-y-4">
        <h3 className="font-semibold text-lg flex items-center">
            <UserRoundIcon className="h-5 w-5 ml-2 text-primary" />
            المعلومات الشخصية لإعداد الحساب
        </h3>
        <p className="text-sm text-muted-foreground">
          نحتاج إلى هذه المعلومات لإعداد حسابك وتفعيل اشتراكك في باقة <span className="font-semibold text-primary">{currentPlanDetails?.name}</span>.
          {(userData?.name && userData?.email && !userData.password && !userData.phoneNumber) && <span className="text-xs block mt-1 text-green-600 dark:text-green-400">(الاسم والبريد مسترجعان من بياناتك المحفوظة)</span>}
        </p>
        <div className="space-y-3">
          <Input
            placeholder="الاسم الكامل (مثال: محمد عبدالله)"
            value={userData?.name || ''}
            onChange={(e) => setUserData(prev => ({ ...prev, name: e.target.value }))}
            aria-label="الاسم الكامل"
            required
            className="focus:ring-2 focus:ring-primary dark:bg-slate-700 dark:border-slate-600"
          />
          <Input
            type="email"
            placeholder="البريد الإلكتروني (example@mail.com)"
            value={userData?.email || ''}
            onChange={(e) => setUserData(prev => ({ ...prev, email: e.target.value }))}
            aria-label="البريد الإلكتروني"
            required
            className="focus:ring-2 focus:ring-primary dark:bg-slate-700 dark:border-slate-600"
          />
          <Input
            type="password"
            placeholder="كلمة المرور (6 أحرف على الأقل)"
            value={userData?.password || ''}
            onChange={(e) => setUserData(prev => ({ ...prev, password: e.target.value }))}
            aria-label="كلمة المرور"
            required
            className="focus:ring-2 focus:ring-primary dark:bg-slate-700 dark:border-slate-600"
          />
          <div className="flex gap-2">
            <Select value={phoneCountryCode} onValueChange={setPhoneCountryCode}>
              <SelectTrigger className="w-[160px] focus:ring-2 focus:ring-primary dark:bg-slate-700 dark:border-slate-600">
                <SelectValue placeholder="رمز الدولة" />
              </SelectTrigger>
              <SelectContent className="dark:bg-slate-800">
                {countryCodes.map(country => (
                  <SelectItem key={country.value} value={country.value} className="dark:focus:bg-slate-700">{country.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="tel"
              placeholder="رقم الجوال (مثل 5xxxxxxxx)"
              value={userData?.phoneNumber || ''}
              onChange={(e) => setUserData(prev => ({ ...prev, phoneNumber: e.target.value.replace(/\D/g, '') }))}
              aria-label="رقم الهاتف"
              className="flex-1 focus:ring-2 focus:ring-primary dark:bg-slate-700 dark:border-slate-600"
              required
            />
          </div>
        </div>
        {/* --- هذا هو الجزء المضاف --- */}
        <div className="flex items-center space-x-2 pt-2" dir="rtl">
          <input
            type="checkbox"
            id="terms"
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary accent-primary"
          />
          <label htmlFor="terms" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            أوافق على <a href="https://www.qodratak.space/privacy" target="_blank" rel="noopener noreferrer" className="underline text-primary hover:text-primary/80">الشروط والأحكام</a>.
          </label>
        </div>
        {/* --- نهاية الجزء المضاف --- */}
      </div>
    </div>
  );

  const renderStepTwoOTP = () => (
    <div className="space-y-6 pt-4 text-center">
      {!isOtpSent ? (
        <>
            <h3 className="font-semibold text-lg flex items-center justify-center">
                <ShieldQuestionIcon className="h-5 w-5 ml-2 text-primary" />
                كيف تود استلام رمز التحقق؟
            </h3>
            <p className="text-sm text-muted-foreground">
                سنرسل رمزًا سريًا مكونًا من 6 أرقام إلى حسابك للتحقق من رقم هاتفك.
            </p>
            <div className="flex gap-4 pt-4">
                <Button variant="outline" className="w-full h-20 flex-col gap-2 text-lg dark:hover:bg-slate-700" onClick={() => handleSendOtp('telegram')}>
                    <SendIcon className="h-8 w-8 text-sky-500"/> تليجرام
                </Button>
                <Button variant="outline" className="w-full h-20 flex-col gap-2 text-lg dark:hover:bg-slate-700" onClick={() => handleSendOtp('whatsapp')}>
                    <MessageSquareTextIcon className="h-8 w-8 text-green-500"/> واتساب
                </Button>
            </div>
        </>
      ) : (
        <>
            <h3 className="font-semibold text-lg">أدخل رمز التحقق</h3>
            <p className="text-sm text-muted-foreground">
                تم إرسال الرمز إلى <span className="font-bold text-primary">{phoneCountryCode}{userData.phoneNumber}</span>.
            </p>
            <div dir="ltr" className="flex justify-center gap-2 md:gap-3 pt-4" onPaste={handleOtpPaste}>
                {otpInput.map((digit, index) => (
                    <Input
                        key={index}
                        ref={el => otpInputRefs.current[index] = el}
                        type="tel"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpInputChange(e, index)}
                        onKeyDown={(e) => handleOtpKeyDown(e, index)}
                        className="w-12 h-14 md:w-14 md:h-16 text-center text-2xl font-bold rounded-lg focus:ring-2 focus:ring-primary dark:bg-slate-700"
                    />
                ))}
            </div>
            <div className="h-6 pt-4">
              {countdown > 0 ? (
                  <p className="text-muted-foreground text-sm ">إعادة إرسال الرمز بعد: <span className="font-bold text-primary">{Math.floor(countdown / 60)}:{('0' + countdown % 60).slice(-2)}</span></p>
              ) : (
                  <Button variant="link" className="text-primary" onClick={() => handleSendOtp('whatsapp')}>لم تستلم الرمز؟ أعد الإرسال</Button>
              )}
            </div>
        </>
      )}
    </div>
  );

  const renderStepThreePayment = () => {
    return (
    <div className="space-y-6 pt-4">
      <div>
        <h3 className="font-semibold text-lg mb-1 flex items-center">
            <CreditCardIcon className="h-5 w-5 ml-2 text-primary"/>
            اختر طريقة الدفع
        </h3>
        <p className="text-sm text-muted-foreground">
          لدفع مبلغ <span className="font-bold text-primary">{currentPlanDetails?.price} ريال</span> للاشتراك في باقة <span className="font-semibold text-primary">{currentPlanDetails?.name}</span>.
        </p>
      </div>

      <RadioGroup
        value={selectedPaymentMethod || undefined}
        onValueChange={(value: 'bank' | 'stc' | 'paypal') => setSelectedPaymentMethod(value)}
        className="space-y-3"
      >
        {['bank', 'stc', 'paypal'].map((method) => {
          const isSelected = selectedPaymentMethod === method;
          let icon, title;
          if (method === 'bank') {
            icon = <BanknoteIcon className={`h-5 w-5 ml-2 ${isSelected ? 'text-green-700 dark:text-green-400' : 'text-green-600'}`}/>;
            title = "تحويل بنكي";
          } else if (method === 'stc') {
            icon = <SmartphoneNfcIcon className={`h-5 w-5 ml-2 ${isSelected ? 'text-purple-700 dark:text-purple-400' : 'text-purple-600'}`}/>;
            title = "STC Pay";
          } else { // paypal
            icon = <CreditCardIcon className={`h-5 w-5 ml-2 ${isSelected ? 'text-blue-700 dark:text-blue-400' : 'text-blue-600'}`}/>;
            title = "PayPal";
          }

          return (
            <Label key={method} htmlFor={method}
              className={`flex flex-col p-4 border rounded-lg cursor-pointer transition-all duration-300 ease-in-out hover:shadow-xl dark:border-slate-700
                          ${isSelected ? 'border-primary ring-2 ring-offset-2 ring-offset-background dark:ring-offset-slate-900 ring-primary bg-primary/10 dark:bg-primary/20 shadow-2xl scale-[1.03]'
                                      : 'hover:border-slate-400 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/70'}`}>
              <div className="flex items-center justify-between">
                <div className={`flex items-center font-medium ${isSelected ? 'text-primary dark:text-primary-foreground' : 'text-slate-800 dark:text-slate-200'}`}>
                    {icon} {title}
                </div>
                <RadioGroupItem value={method} id={method} className="border-slate-400 dark:border-slate-500 data-[state=checked]:border-primary" />
              </div>
              {isSelected && (
                <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-600 space-y-2">
                  {method === 'bank' && (
                    <>
                      <p className="text-sm text-muted-foreground">
                        قم بتحويل المبلغ (<span className="font-semibold">{currentPlanDetails?.price} ريال</span>) إلى الحساب التالي:
                      </p>
                      <div className="flex items-center justify-between p-3 bg-slate-100 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600">
                        <code className="text-sm font-mono text-slate-700 dark:text-slate-300 tracking-wider">{BANK_ACCOUNT_NUMBER}</code>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-200 dark:hover:bg-slate-600" onClick={(e) => { e.preventDefault(); handleCopy(BANK_ACCOUNT_NUMBER, 'bank'); }}>
                          {copySuccess === 'bank' ? <CheckIcon className="h-5 w-5 text-green-500" /> : <CopyIcon className="h-4 w-4 text-slate-500 dark:text-slate-400" />}
                        </Button>
                      </div>
                    </>
                  )}
                  {method === 'stc' && (
                     <>
                      <p className="text-sm text-muted-foreground">
                        قم بالتحويل إلى رقم STC Pay التالي (<span className="font-semibold">{currentPlanDetails?.price} ريال</span>):
                      </p>
                      <div className="flex items-center justify-between p-3 bg-slate-100 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600">
                        <code className="text-sm font-mono text-slate-700 dark:text-slate-300 tracking-wider">{STC_PAY_NUMBER}</code>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-200 dark:hover:bg-slate-600" onClick={(e) => { e.preventDefault(); handleCopy(STC_PAY_NUMBER, 'stc');}}>
                          {copySuccess === 'stc' ? <CheckIcon className="h-5 w-5 text-green-500" /> : <CopyIcon className="h-4 w-4 text-slate-500 dark:text-slate-400" />}
                        </Button>
                      </div>
                    </>
                  )}
                  {method === 'paypal' && (
                    <>
                      <p className="text-sm text-muted-foreground">
                        سيتم توجيهك إلى صفحة PayPal الآمنة في نافذة جديدة لإتمام دفع مبلغ <span className="font-semibold">{currentPlanDetails?.price} ريال</span>.
                      </p>
                      <div className="text-xs text-amber-700 dark:text-amber-400 p-3 bg-amber-50 dark:bg-amber-900/40 rounded-md border border-amber-300 dark:border-amber-600/50 flex items-start gap-2">
                        <TriangleAlertIcon className="h-5 w-5 mt-0.5 text-amber-500 flex-shrink-0" />
                        <div>
                          <strong>ملاحظة هامة جداً:</strong>
                          <ol className="list-decimal list-inside mt-1 space-y-1">
                            <li>بعد الضغط على زر "الدفع عبر PayPal وإرسال الطلب"، ستفتح لك نافذة PayPal.</li>
                            <li>أكمل عملية الدفع في نافذة PayPal.</li>
                            <li>خذ لقطة شاشة (Screenshot) من صفحة تأكيد الدفع في PayPal.</li>
                            <li>سيتم فتح تليجرام تلقائياً برسالة طلب الاشتراك (إذا لم يفتح، استخدم الرابط في التنبيه الذي سيظهر). أرفق لقطة الشاشة مع هذه الرسالة ثم أرسلها.</li>
                          </ol>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </Label>
          );
        })}
      </RadioGroup>

      {(selectedPaymentMethod === 'bank' || selectedPaymentMethod === 'stc') && (
        <div className="mt-6 text-center space-y-3">
          <Separator className="my-4 dark:bg-slate-700" />
          <p className="text-sm text-muted-foreground">
            بعد إتمام التحويل، يرجى الضغط على الزر أدناه لإرسال معلومات طلبك عبر تليجرام مع <strong className="text-primary">إرفاق سند التحويل</strong>.
          </p>
          <Button
            className="w-full md:w-auto text-base py-3 px-6 bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg transition-all transform hover:scale-105"
            onClick={() => handlePaymentAndRedirect(selectedPaymentMethod === 'bank' ? 'Bank Transfer' : 'STC Pay')}
          >
            <RocketIcon className="ml-2 h-5 w-5" />
            تأكيد وإرسال طلب الاشتراك
          </Button>
        </div>
      )}

      {selectedPaymentMethod === 'paypal' && (
        <div className="mt-6 text-center space-y-3">
          <Separator className="my-4 dark:bg-slate-700" />
          <p className="text-sm text-muted-foreground">
            اضغط أدناه للانتقال إلى PayPal. بعد إتمام الدفع هناك، اتبع التعليمات في التنبيه الذي سيظهر لإرسال الطلب عبر تليجرام مع <strong className="text-primary">إرفاق لقطة شاشة للدفع</strong>.
          </p>
          <Button
            className="w-full md:w-auto text-base py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all transform hover:scale-105"
            onClick={handlePayPalPayment}
          >
            <ExternalLinkIcon className="ml-2 h-5 w-5" />
            الدفع عبر PayPal وإرسال الطلب
          </Button>
        </div>
      )}
    </div>
    );
  };


  // Main Component Render
  return (
      <div className="container mx-auto py-12 px-4 md:px-6 lg:px-8 dark:bg-slate-900 dark:text-slate-50 rounded-lg">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary via-pink-500 to-orange-500">
            اختر باقتك المثالية نحو التميز
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground dark:text-slate-300 mt-3 max-w-3xl mx-auto">
            استثمر في مستقبلك التعليمي مع باقاتنا المصممة خصيصًا لتمكينك من تحقيق أهدافك بكفاءة وتميز لا حدود لهما. انطلق الآن!
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 md:gap-10 lg:gap-12 max-w-5xl mx-auto">
          <Card className="group relative overflow-hidden border-2 border-slate-200 dark:border-slate-700 hover:border-primary dark:hover:border-primary transition-all duration-300 ease-in-out flex flex-col shadow-lg hover:shadow-primary/20 dark:hover:shadow-primary/30 rounded-xl transform hover:-translate-y-1 bg-white dark:bg-slate-800">
            <div className="absolute top-4 right-4 transform transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110">
              <ShieldCheckIcon className="h-8 w-8 text-primary opacity-70 group-hover:opacity-100" />
            </div>
            <CardHeader className="pb-4">
              <CardTitle className="text-3xl font-semibold text-slate-800 dark:text-slate-100">Pro</CardTitle>
              <CardDescription className="text-sm text-muted-foreground dark:text-slate-400 pt-1">{planDetails.pro.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow space-y-6">
              <div className="text-5xl font-bold mb-6 text-primary">
                {planDetails.pro.price} <span className="text-xl font-normal text-muted-foreground dark:text-slate-400">ريال / سنة</span>
              </div>
              <ul className="space-y-4 text-sm text-slate-700 dark:text-slate-300">
                <li className="flex items-center gap-3 transition-colors duration-200 group-hover:text-primary"><StarIcon className="h-5 w-5 text-yellow-400 group-hover:text-yellow-300" /> <span>جميع الاختبارات المتاحة</span></li>
                <li className="flex items-center gap-3 transition-colors duration-200 group-hover:text-primary"><SparklesIcon className="h-5 w-5 text-pink-400 group-hover:text-pink-300" /> <span>مجلدات خاصة لتنظيم دراستك</span></li>
                <li className="flex items-center gap-3 transition-colors duration-200 group-hover:text-primary"><RocketIcon className="h-5 w-5 text-teal-400 group-hover:text-teal-300" /> <span>تحديات ومنافسات شيقة</span></li>
              </ul>
            </CardContent>
            <CardFooter className="mt-auto p-6">
              <Button onClick={() => handleSubscribe('pro')} className="w-full text-lg py-6 rounded-lg border-2 border-primary text-primary bg-transparent hover:bg-primary hover:text-primary-foreground dark:hover:text-white shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105">
                اشترك الآن في Pro
              </Button>
            </CardFooter>
          </Card>

          <Card className="group relative overflow-hidden border-2 border-primary bg-gradient-to-br from-primary/10 via-background to-background dark:from-primary/20 dark:via-slate-800 dark:to-slate-800 flex flex-col shadow-xl hover:shadow-primary/40 dark:hover:shadow-primary/50 rounded-xl transform hover:-translate-y-1 bg-white dark:bg-slate-800">
            <div className="absolute -top-1 -left-1 -right-1 h-2.5 bg-gradient-to-r from-pink-500 to-orange-500 animate-pulse-slow rounded-t-lg"></div>
            <div className="absolute top-0 -right-0 m-1 z-20">
                <div className="relative">
                    <div className="absolute -top-2 -right-10 bg-gradient-to-r from-pink-500 to-orange-500 text-white px-8 py-3 transform rotate-[20deg] shadow-xl text-center group-hover:scale-110 transition-transform duration-300 ease-out">
                        <span className="block text-xs font-bold uppercase tracking-wider">الأفضل</span>
                        <span className="block text-sm font-semibold">قيمة</span>
                    </div>
                </div>
            </div>
            <CardHeader className="pb-4 pt-10">
              <CardTitle className="text-3xl font-semibold text-slate-800 dark:text-slate-100">Pro Life</CardTitle>
              <CardDescription className="text-sm text-muted-foreground dark:text-slate-400 pt-1">{planDetails.proLife.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow space-y-6">
              <div className="relative mb-6">
                <div className="text-5xl font-bold text-primary">
                  {planDetails.proLife.price} <span className="text-xl font-normal text-muted-foreground dark:text-slate-400">ريال</span>
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                    {planDetails.proLife.originalPrice && (
                       <span className="line-through text-muted-foreground dark:text-slate-500 text-lg">{planDetails.proLife.originalPrice} ريال</span>
                    )}
                    {planDetails.proLife.discount && (
                        <span className="bg-green-500 text-white text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm">
                        خصم {planDetails.proLife.discount}!
                        </span>
                    )}
                </div>
              </div>
              <ul className="space-y-4 text-sm text-slate-700 dark:text-slate-300">
                <li className="flex items-center gap-3 transition-colors duration-200 group-hover:text-primary"><StarIcon className="h-5 w-5 text-yellow-400 group-hover:text-yellow-300" /> <span>جميع مميزات باقة Pro</span></li>
                <li className="flex items-center gap-3 transition-colors duration-200 group-hover:text-primary"><SparklesIcon className="h-5 w-5 text-pink-400 group-hover:text-pink-300" /> <span>تحديثات مجانية مدى الحياة</span></li>
                <li className="flex items-center gap-3 transition-colors duration-200 group-hover:text-primary"><ShieldCheckIcon className="h-5 w-5 text-green-400 group-hover:text-green-300" /> <span>أولوية في الدعم الفني المتميز</span></li>
              </ul>
            </CardContent>
            <CardFooter className="mt-auto p-6">
              <Button onClick={() => handleSubscribe('proLife')} className="w-full text-lg py-6 rounded-lg bg-gradient-to-r from-primary via-pink-500 to-orange-500 text-white shadow-lg hover:shadow-xl hover:opacity-90 transition-all duration-200 transform hover:scale-105" variant="default">
                اشترك الآن (مدى الحياة)
              </Button>
            </CardFooter>
          </Card>
        </div>

        <Dialog open={isPaymentDialogOpen} onOpenChange={handleDialogClose}>
          <DialogContent className="sm:max-w-lg md:max-w-xl dark:bg-slate-800 dark:border-slate-700">
            <DialogHeader className="pb-4 text-center">
              <DialogTitle className="text-xl md:text-2xl dark:text-slate-50">
                استمارة اشتراك: <span className="text-primary">{currentPlanDetails?.name}</span>
              </DialogTitle>
              <DialogDescription className="pt-1 dark:text-slate-400">
                {currentStep === 1 && `الخطوة 1 من 3: المعلومات الشخصية`}
                {currentStep === 2 && `الخطوة 2 من 3: التحقق من رقم الهاتف`}
                {currentStep === 3 && `الخطوة 3 من 3: اختيار طريقة الدفع`}
              </DialogDescription>
            </DialogHeader>

            {currentStep === 1 && renderStepOneInfo()}
            {currentStep === 2 && renderStepTwoOTP()}
            {currentStep === 3 && renderStepThreePayment()}

            <DialogFooter className="pt-6 flex flex-col-reverse sm:flex-row sm:justify-between gap-2 mt-4">
                {currentStep > 1 && (
                    <Button variant="outline" className="w-full sm:w-auto dark:border-slate-600" onClick={() => setCurrentStep(currentStep - 1)}>
                         السابق <ArrowRightIcon className="mr-2 h-4 w-4" />
                    </Button>
                )}
               <div className="flex-grow sm:flex-grow-0"></div>
                {currentStep === 1 && (
                    <Button className="w-full sm:w-auto" onClick={() => setCurrentStep(2)} disabled={!isStepOneValid}>
                        التالي (التحقق من الهاتف) <ArrowLeftIcon className="mr-2 h-4 w-4" />
                    </Button>
                )}
                {currentStep === 2 && isOtpSent && (
                    <Button className="w-full sm:w-auto" onClick={handleVerifyOtp} disabled={otpInput.join("").length !== 6 || isVerifying}>
                        {isVerifying ? "جارٍ التحقق..." : "تحقق وتابع للدفع"}
                        {!isVerifying && <KeyRoundIcon className="mr-2 h-4 w-4" />}
                    </Button>
                )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
  );
}