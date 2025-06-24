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

  // Step 2.5: Email Verification
  const [generatedEmailOtp, setGeneratedEmailOtp] = useState<string | null>(null);
  const [emailOtpInput, setEmailOtpInput] = useState<string[]>(new Array(6).fill(""));
  const [isEmailOtpSent, setIsEmailOtpSent] = useState(false);
  const [emailCountdown, setEmailCountdown] = useState(OTP_COUNTDOWN_SECONDS);
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  const emailOtpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

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

  useEffect(() => {
    if (isEmailOtpSent && emailCountdown > 0) {
      const timer = setTimeout(() => setEmailCountdown(emailCountdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (emailCountdown === 0) {
        setIsEmailOtpSent(true); 
    }
  }, [isEmailOtpSent, emailCountdown]);


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

  const handleSendOtp = (method: 'whatsapp' | 'telegram') => {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(otp);

    const message = encodeURIComponent(`${otp} هو الرمز السري لمرة واحدة لهذه المعاملة. يرجى عدم مشاركته مع أحد.`);
    let url = '';

    if (method === 'telegram') {
      url = `https://t.me/qodratak2030?text=${message}`;
    } else { // whatsapp
      // استخدام رقم الهاتف الذي أدخله المستخدم
      const userPhoneNumber = phoneCountryCode.replace('+', '') + userData.phoneNumber;
      url = `https://api.whatsapp.com/send/?phone=${userPhoneNumber}&text=${message}&type=phone_number&app_absent=0`;
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

  // Email OTP Functions
  const handleSendEmailOtp = () => {
    const emailOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedEmailOtp(emailOtp);

    // إنشاء بريد إلكتروني مصمم بشكل إبداعي مع CSS متقدم
    const subject = encodeURIComponent('🔐 رمز التحقق من منصة قدراتك - تأكيد الاشتراك');
    
    const htmlBody = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>رمز التحقق - قدراتك</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700;800&display=swap');
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Cairo', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
            min-height: 100vh;
            padding: 20px;
            position: relative;
            overflow-x: hidden;
        }
        
        body::before {
            content: '';
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: 
                radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
                radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3) 0%, transparent 50%);
            z-index: -1;
            animation: backgroundMove 20s ease-in-out infinite;
        }
        
        @keyframes backgroundMove {
            0%, 100% { transform: translate(0, 0) rotate(0deg); }
            33% { transform: translate(30px, -30px) rotate(1deg); }
            66% { transform: translate(-20px, 20px) rotate(-1deg); }
        }
        
        .email-container {
            max-width: 650px;
            margin: 0 auto;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(20px);
            border-radius: 25px;
            overflow: hidden;
            box-shadow: 
                0 25px 80px rgba(0,0,0,0.15),
                0 0 0 1px rgba(255,255,255,0.2),
                inset 0 1px 0 rgba(255,255,255,0.8);
            position: relative;
            border: 2px solid transparent;
            background-clip: padding-box;
        }
        
        .email-container::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(45deg, #667eea, #764ba2, #f093fb, #667eea);
            border-radius: 25px;
            padding: 2px;
            z-index: -1;
            animation: borderGlow 4s linear infinite;
        }
        
        @keyframes borderGlow {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
            color: white;
            padding: 50px 40px;
            text-align: center;
            position: relative;
            overflow: hidden;
        }
        
        .header::before {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: repeating-linear-gradient(
                45deg,
                transparent,
                transparent 15px,
                rgba(255,255,255,0.03) 15px,
                rgba(255,255,255,0.03) 30px
            );
            animation: shimmer 6s linear infinite;
        }
        
        .header::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.2) 0%, transparent 60%);
            animation: pulse 3s ease-in-out infinite;
        }
        
        @keyframes shimmer {
            0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
            100% { transform: translateX(100%) translateY(100%) rotate(45deg); }
        }
        
        @keyframes pulse {
            0%, 100% { opacity: 0.6; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.05); }
        }
        
        .logo {
            font-size: 3.5em;
            font-weight: 800;
            margin-bottom: 15px;
            position: relative;
            z-index: 2;
            background: linear-gradient(45deg, #fff, #f0f8ff, #fff);
            background-clip: text;
            -webkit-background-clip: text;
            color: transparent;
            text-shadow: 0 2px 20px rgba(255,255,255,0.5);
            animation: logoGlow 2s ease-in-out infinite alternate;
        }
        
        @keyframes logoGlow {
            from { filter: drop-shadow(0 0 20px rgba(255,255,255,0.5)); }
            to { filter: drop-shadow(0 0 30px rgba(255,255,255,0.8)); }
        }
        
        .header-subtitle {
            font-size: 1.3em;
            opacity: 0.95;
            position: relative;
            z-index: 2;
            font-weight: 500;
            letter-spacing: 1px;
        }
        
        .content {
            padding: 50px 40px;
            text-align: center;
            position: relative;
        }
        
        .welcome-text {
            font-size: 1.8em;
            color: #333;
            margin-bottom: 25px;
            font-weight: 700;
            background: linear-gradient(135deg, #667eea, #764ba2);
            background-clip: text;
            -webkit-background-clip: text;
            color: transparent;
        }
        
        .description {
            color: #555;
            margin-bottom: 40px;
            font-size: 1.2em;
            line-height: 1.8;
            font-weight: 500;
        }
        
        .otp-container {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
            border-radius: 20px;
            padding: 40px;
            margin: 40px 0;
            position: relative;
            overflow: hidden;
            box-shadow: 0 20px 60px rgba(102, 126, 234, 0.3);
        }
        
        .otp-container::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
            animation: slideShine 3s infinite;
        }
        
        @keyframes slideShine {
            0% { left: -100%; }
            100% { left: 100%; }
        }
        
        .otp-label {
            color: white;
            font-size: 1.4em;
            margin-bottom: 20px;
            font-weight: 700;
            position: relative;
            z-index: 2;
            text-shadow: 0 2px 10px rgba(0,0,0,0.3);
        }
        
        .otp-code {
            background: linear-gradient(135deg, #fff 0%, #f8f9ff 100%);
            color: #333;
            font-size: 3.5em;
            font-weight: 900;
            padding: 25px 40px;
            border-radius: 15px;
            letter-spacing: 12px;
            margin: 0 auto;
            display: inline-block;
            box-shadow: 
                0 15px 40px rgba(0,0,0,0.15),
                inset 0 1px 0 rgba(255,255,255,0.8),
                0 0 0 3px rgba(102, 126, 234, 0.3);
            position: relative;
            z-index: 2;
            border: 4px solid transparent;
            background-clip: padding-box;
            animation: codeGlow 2s ease-in-out infinite alternate;
        }
        
        @keyframes codeGlow {
            from { 
                box-shadow: 
                    0 15px 40px rgba(0,0,0,0.15),
                    inset 0 1px 0 rgba(255,255,255,0.8),
                    0 0 0 3px rgba(102, 126, 234, 0.3);
            }
            to { 
                box-shadow: 
                    0 20px 50px rgba(0,0,0,0.2),
                    inset 0 1px 0 rgba(255,255,255,0.9),
                    0 0 0 5px rgba(102, 126, 234, 0.5);
            }
        }
        
        .info-cards {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin: 30px 0;
        }
        
        .info-card {
            background: linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(248,249,255,0.9) 100%);
            border-radius: 15px;
            padding: 25px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.3);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        
        .info-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 15px 40px rgba(0,0,0,0.1);
        }
        
        .timer-card {
            border-left: 4px solid #ff6b6b;
            color: #d63031;
        }
        
        .security-card {
            border-left: 4px solid #00cec9;
            color: #00b894;
        }
        
        .card-icon {
            font-size: 2em;
            margin-bottom: 10px;
            display: block;
        }
        
        .card-title {
            font-weight: 700;
            font-size: 1.1em;
            margin-bottom: 8px;
        }
        
        .card-text {
            font-size: 0.95em;
            line-height: 1.5;
        }
        
        .footer {
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            padding: 40px;
            text-align: center;
            border-top: 1px solid rgba(0,0,0,0.1);
            position: relative;
        }
        
        .footer::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 1px;
            background: linear-gradient(90deg, transparent, rgba(102, 126, 234, 0.5), transparent);
        }
        
        .footer-logo {
            font-size: 2em;
            font-weight: 700;
            color: #667eea;
            margin-bottom: 15px;
            text-shadow: 0 2px 10px rgba(102, 126, 234, 0.3);
        }
        
        .footer-text {
            color: #6c757d;
            font-size: 1em;
            line-height: 1.6;
            margin-bottom: 20px;
        }
        
        .user-info {
            background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(240, 147, 251, 0.1) 100%);
            border-radius: 15px;
            padding: 20px;
            margin: 25px 0;
            border: 2px solid rgba(102, 126, 234, 0.2);
        }
        
        .user-info-title {
            font-weight: 700;
            color: #667eea;
            margin-bottom: 10px;
            font-size: 1.1em;
        }
        
        .user-email {
            font-weight: 600;
            color: #333;
            font-size: 1.1em;
            background: rgba(255,255,255,0.8);
            padding: 8px 15px;
            border-radius: 8px;
            display: inline-block;
        }
        
        @media (max-width: 700px) {
            .email-container {
                margin: 10px;
                border-radius: 20px;
            }
            
            .header {
                padding: 35px 25px;
            }
            
            .content {
                padding: 35px 25px;
            }
            
            .logo {
                font-size: 2.8em;
            }
            
            .otp-code {
                font-size: 2.8em;
                letter-spacing: 6px;
                padding: 20px 25px;
            }
            
            .info-cards {
                grid-template-columns: 1fr;
                gap: 15px;
            }
            
            .welcome-text {
                font-size: 1.5em;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <div class="logo">قـدراتـك</div>
            <div class="header-subtitle">منصة التدريب الأولى على اختبار القياس</div>
        </div>
        
        <div class="content">
            <div class="welcome-text">مرحباً بك في عائلة قدراتك! 🎉</div>
            
            <div class="description">
                نحن سعداء بانضمامك إلينا. لإكمال عملية التحقق من حسابك والاستمتاع بجميع مميزات المنصة، يرجى استخدام الرمز التالي:
            </div>
            
            <div class="user-info">
                <div class="user-info-title">تفاصيل طلب التحقق:</div>
                <div class="user-email">${userData.email}</div>
            </div>
            
            <div class="otp-container">
                <div class="otp-label">🔐 رمز التحقق الخاص بك</div>
                <div class="otp-code">${emailOtp}</div>
            </div>
            
            <div class="info-cards">
                <div class="info-card timer-card">
                    <span class="card-icon">⏰</span>
                    <div class="card-title">صالح لمدة محدودة</div>
                    <div class="card-text">هذا الرمز صالح لمدة 3 دقائق فقط من وقت إرساله</div>
                </div>
                
                <div class="info-card security-card">
                    <span class="card-icon">🔒</span>
                    <div class="card-title">حماية عالية</div>
                    <div class="card-text">لا تشارك هذا الرمز مع أي شخص آخر لحماية حسابك</div>
                </div>
            </div>
        </div>
        
        <div class="footer">
            <div class="footer-logo">قدراتك</div>
            <div class="footer-text">
                منصة شاملة ومتطورة للتدريب على اختبارات القياس<br>
                نساعدك على تحقيق أحلامك الأكاديمية والمهنية بأحدث الطرق التعليمية
            </div>
            <div style="font-size: 0.9em; color: #999;">
                📧 للدعم الفني: qoudratak@gmail.com<br>
                🌐 الموقع الرسمي: www.qodratak.space
            </div>
        </div>
    </div>
</body>
</html>`;

    const encodedHtmlBody = encodeURIComponent(htmlBody);
    const targetEmail = 'qoudratak@gmail.com';
    const gmailUrl = `https://mail.google.com/mail/?view=cm&to=${targetEmail}&su=${subject}&body=${encodedHtmlBody}`;
    
    window.open(gmailUrl, '_blank', 'noopener,noreferrer');
    
    setIsEmailOtpSent(true);
    setEmailCountdown(OTP_COUNTDOWN_SECONDS);
    toast({
      title: "📧 تم فتح Gmail مع رسالة احترافية!",
      description: "يرجى إرسال البريد الإلكتروني المصمم بشكل إبداعي إلى فريق قدراتك، ثم إدخال الرمز هنا.",
      className: "bg-green-500 text-white dark:bg-green-600 dark:text-white",
    });
  };

  const handleEmailOtpInputChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const { value } = e.target;
    if (/^[0-9]$/.test(value) || value === "") {
        const newEmailOtpInput = [...emailOtpInput];
        newEmailOtpInput[index] = value;
        setEmailOtpInput(newEmailOtpInput);

        if (value && index < 5) {
            emailOtpInputRefs.current[index + 1]?.focus();
        }
    }
  };

  const handleEmailOtpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !emailOtpInput[index] && index > 0) {
      emailOtpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleEmailOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '');
    if (pastedData.length === 6) {
      e.preventDefault();
      const newEmailOtp = pastedData.split('');
      setEmailOtpInput(newEmailOtp);
      emailOtpInputRefs.current[5]?.focus();
    }
  };

  const handleVerifyEmailOtp = () => {
    setIsVerifyingEmail(true);
    const enteredEmailOtp = emailOtpInput.join("");

    setTimeout(() => {
        if (enteredEmailOtp === generatedEmailOtp) {
            toast({ title: "✅ تم التحقق من البريد الإلكتروني بنجاح!", description: "تم تأكيد بريدك الإلكتروني. يرجى اختيار طريقة الدفع.", className: "bg-green-500 text-white dark:bg-green-600 dark:text-white" });
            setCurrentStep(3);
        } else {
            toast({ title: "❌ رمز غير صحيح", description: "الرمز الذي أدخلته غير صحيح. يرجى المحاولة مرة أخرى.", variant: "destructive" });
            setEmailOtpInput(new Array(6).fill(""));
            emailOtpInputRefs.current[0]?.focus();
        }
        setIsVerifyingEmail(false);
    }, 1000);
  };

  const handleVerifyOtp = () => {
    setIsVerifying(true);
    const enteredOtp = otpInput.join("");

    setTimeout(() => {
        if (enteredOtp === generatedOtp) {
            toast({ title: "✅ تم التحقق من الهاتف بنجاح!", description: "تم تأكيد رقم هاتفك. الآن يرجى التحقق من بريدك الإلكتروني.", className: "bg-green-500 text-white dark:bg-green-600 dark:text-white" });
            setCurrentStep(2.5);
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

  const renderStepTwoEmailOTP = () => (
    <div className="space-y-6 pt-4 text-center">
      {!isEmailOtpSent ? (
        <>
            <h3 className="font-semibold text-lg flex items-center justify-center">
                <MessageSquareTextIcon className="h-5 w-5 ml-2 text-primary" />
                التحقق من البريد الإلكتروني
            </h3>
            <p className="text-sm text-muted-foreground">
                الآن نحتاج للتحقق من بريدك الإلكتروني <span className="font-bold text-primary">{userData.email}</span>
            </p>
            <Button onClick={handleSendEmailOtp} className="w-full h-12 text-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                📧 إرسال رمز التحقق عبر البريد الإلكتروني
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              سيتم فتح Gmail مع رسالة مصممة بشكل احترافي لإرسالها إلى فريق قدراتك
            </p>
        </>
      ) : (
        <>
            <h3 className="font-semibold text-lg">أدخل رمز التحقق من البريد الإلكتروني</h3>
            <p className="text-sm text-muted-foreground">
                تم إرسال الرمز إلى <span className="font-bold text-primary">{userData.email}</span>.
            </p>
            <div dir="ltr" className="flex justify-center gap-2 md:gap-3 pt-4" onPaste={handleEmailOtpPaste}>
                {emailOtpInput.map((digit, index) => (
                    <Input
                        key={index}
                        ref={el => emailOtpInputRefs.current[index] = el}
                        type="tel"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleEmailOtpInputChange(e, index)}
                        onKeyDown={(e) => handleEmailOtpKeyDown(e, index)}
                        className="w-12 h-14 md:w-14 md:h-16 text-center text-2xl font-bold rounded-lg focus:ring-2 focus:ring-primary dark:bg-slate-700"
                    />
                ))}
            </div>
            <div className="h-6 pt-4">
              {emailCountdown > 0 ? (
                  <p className="text-muted-foreground text-sm ">إعادة إرسال الرمز بعد: <span className="font-bold text-primary">{Math.floor(emailCountdown / 60)}:{('0' + emailCountdown % 60).slice(-2)}</span></p>
              ) : (
                  <Button variant="link" className="text-primary" onClick={handleSendEmailOtp}>لم تستلم الرمز؟ أعد الإرسال</Button>
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
                {currentStep === 1 && `الخطوة 1 من 4: المعلومات الشخصية`}
                {currentStep === 2 && `الخطوة 2 من 4: التحقق من رقم الهاتف`}
                {currentStep === 2.5 && `الخطوة 3 من 4: التحقق من البريد الإلكتروني`}
                {currentStep === 3 && `الخطوة 4 من 4: اختيار طريقة الدفع`}
              </DialogDescription>
            </DialogHeader>

            {currentStep === 1 && renderStepOneInfo()}
            {currentStep === 2 && renderStepTwoOTP()}
            {currentStep === 2.5 && renderStepTwoEmailOTP()}
            {currentStep === 3 && renderStepThreePayment()}

            <DialogFooter className="pt-6 flex flex-col-reverse sm:flex-row sm:justify-between gap-2 mt-4">
                {currentStep > 1 && currentStep !== 2.5 && (
                    <Button variant="outline" className="w-full sm:w-auto dark:border-slate-600" onClick={() => setCurrentStep(currentStep - 1)}>
                         السابق <ArrowRightIcon className="mr-2 h-4 w-4" />
                    </Button>
                )}
                {currentStep === 2.5 && (
                    <Button variant="outline" className="w-full sm:w-auto dark:border-slate-600" onClick={() => setCurrentStep(2)}>
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
                        {isVerifying ? "جارٍ التحقق..." : "تحقق وتابع للبريد الإلكتروني"}
                        {!isVerifying && <KeyRoundIcon className="mr-2 h-4 w-4" />}
                    </Button>
                )}
                {currentStep === 2.5 && isEmailOtpSent && (
                    <Button className="w-full sm:w-auto" onClick={handleVerifyEmailOtp} disabled={emailOtpInput.join("").length !== 6 || isVerifyingEmail}>
                        {isVerifyingEmail ? "جارٍ التحقق..." : "تحقق وتابع للدفع"}
                        {!isVerifyingEmail && <KeyRoundIcon className="mr-2 h-4 w-4" />}
                    </Button>
                )}
                {currentStep === 2.5 && !isEmailOtpSent && (
                    <Button className="w-full sm:w-auto" onClick={handleSendEmailOtp}>
                        إرسال رمز التحقق عبر البريد الإلكتروني
                        <MessageSquareTextIcon className="mr-2 h-4 w-4" />
                    </Button>
                )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
  );
}