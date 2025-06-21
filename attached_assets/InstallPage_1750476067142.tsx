import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Smartphone, 
  Monitor, 
  Download, 
  Apple, 
  Chrome,
  MoreVertical,
  Plus,
  Share,
  Home,
  CheckCircle,
  Info,
  Star,
  Zap,
  Shield,
  Wifi,
  ArrowRight,
  ExternalLink,
  FileDown,
  Sparkles,
  Brain,
  ChevronDown,
  X,
  HelpCircle,
  SmartphoneIcon,
  TabletSmartphone,
  Laptop
} from 'lucide-react';

const InstallPage: React.FC = () => {
  const [showInstructions, setShowInstructions] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<'android' | 'ios' | 'desktop' | null>(null);
  const [activeFAQ, setActiveFAQ] = useState<number | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // تحميل APK مباشرة
  const downloadAPK = async () => {
    try {
      const downloadButton = document.querySelector('#download-apk-btn') as HTMLButtonElement;
      if (downloadButton) {
        downloadButton.disabled = true;
        downloadButton.innerHTML = '<svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" stroke-dasharray="32" stroke-dashoffset="32"><animate attributeName="stroke-dasharray" dur="2s" values="0 32;16 16;0 32;0 32" repeatCount="indefinite"/><animate attributeName="stroke-dashoffset" dur="2s" values="0;-16;-32;-48" repeatCount="indefinite"/></circle></svg>جاري التحميل...';
      }

      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const apkUrl = '/app/qudratak-app.apk';
      const response = await fetch(apkUrl);
      const blob = await response.blob();
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'منصة-قدراتك-v2.1.0.apk';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      if (downloadButton) {
        downloadButton.disabled = false;
        downloadButton.innerHTML = '<svg className="h-6 w-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"></path></svg>تحميل APK (15.2 MB) <svg className="h-5 w-5 ml-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>';
      }

      alert('تم تحميل التطبيق بنجاح! تحقق من مجلد التحميلات واتبع تعليمات التثبيت.');

    } catch (error) {
      console.error('خطأ في التحميل:', error);
      alert('حدث خطأ أثناء التحميل. يرجى المحاولة مرة أخرى.');
      
      const downloadButton = document.querySelector('#download-apk-btn') as HTMLButtonElement;
      if (downloadButton) {
        downloadButton.disabled = false;
        downloadButton.innerHTML = '<svg className="h-6 w-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"></path></svg>تحميل APK (15.2 MB) <svg className="h-5 w-5 ml-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>';
      }
    }
  };

  const installPWA = () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(console.error);
    }
    
    const event = (window as any).deferredPrompt;
    if (event) {
      event.prompt();
      event.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('تم تثبيت التطبيق');
        }
      });
    }
  };

  const toggleFAQ = (index: number) => {
    setActiveFAQ(activeFAQ === index ? null : index);
  };

  const InstructionStep = ({ number, title, description, icon }: {
    number: number;
    title: string;
    description: string;
    icon: React.ReactNode;
  }) => (
    <div className="flex items-start gap-4 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 hover:shadow-lg transition-all duration-300">
      <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg shadow-lg">
        {number}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-white rounded-lg shadow-sm">
            {icon}
          </div>
          <h4 className="font-bold text-gray-900 text-lg">{title}</h4>
        </div>
        <p className="text-gray-700 leading-relaxed">{description}</p>
      </div>
    </div>
  );

  const AndroidInstructions = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-green-100 to-green-200 rounded-full mb-6 shadow-lg">
          <Smartphone className="h-10 w-10 text-green-600" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-3">تثبيت التطبيق - أندرويد وهواوي</h3>
        <p className="text-gray-600 text-lg">حمّل ملف APK واستمتع بالتطبيق الكامل</p>
      </div>

      <div className="space-y-4">
        <InstructionStep
          number={1}
          title="حمّل ملف APK"
          description="اضغط على زر التحميل أدناه لتحميل ملف التطبيق مباشرة على جهازك"
          icon={<FileDown className="h-5 w-5 text-green-500" />}
        />
        
        <InstructionStep
          number={2}
          title="فعّل التثبيت من مصادر غير معروفة"
          description="اذهب إلى الإعدادات → الأمان → فعّل 'مصادر غير معروفة' أو 'تثبيت التطبيقات المجهولة'"
          icon={<Shield className="h-5 w-5 text-yellow-500" />}
        />
        
        <InstructionStep
          number={3}
          title="ثبّت التطبيق"
          description="افتح ملف APK المحمل واضغط على 'تثبيت' لإكمال العملية"
          icon={<CheckCircle className="h-5 w-5 text-green-500" />}
        />
        
        <InstructionStep
          number={4}
          title="استمتع بالتطبيق"
          description="ستجد أيقونة التطبيق في قائمة التطبيقات، اضغط عليها لبدء الاستخدام"
          icon={<Star className="h-5 w-5 text-purple-500" />}
        />
      </div>

      <div className="text-center mt-8">
        <Button 
          id="download-apk-btn"
          onClick={downloadAPK}
          size="lg"
          className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-8 py-4 text-lg font-bold shadow-xl hover:shadow-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="h-6 w-6 mr-3" />
          تحميل APK (15.2 MB)
          <ExternalLink className="h-5 w-5 ml-3" />
        </Button>
        <p className="text-gray-500 text-sm mt-3">
          نسخة 2.1.0 - آمن ومشفر
        </p>
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-center gap-2 text-green-700">
            <Shield className="h-5 w-5" />
            <span className="font-medium">الملف آمن ومتوافق مع Android 5.1+</span>
          </div>
        </div>
      </div>
    </div>
  );

  const IOSInstructions = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-100 to-blue-200 rounded-full mb-6 shadow-lg">
          <Apple className="h-10 w-10 text-blue-600" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-3">تثبيت التطبيق - آيفون وآيباد</h3>
        <p className="text-gray-600 text-lg">استخدم Safari لتثبيت التطبيق كتطبيق ويب</p>
      </div>

      <div className="space-y-4">
        <InstructionStep
          number={1}
          title="افتح Safari"
          description="تأكد من استخدام متصفح Safari الأصلي في iOS"
          icon={<div className="w-5 h-5 bg-blue-500 rounded text-white text-xs flex items-center justify-center font-bold">S</div>}
        />
        
        <InstructionStep
          number={2}
          title="اضغط على زر المشاركة"
          description="اضغط على أيقونة المشاركة (□↗) في شريط الأدوات السفلي"
          icon={<Share className="h-5 w-5 text-blue-500" />}
        />
        
        <InstructionStep
          number={3}
          title="اختر 'إضافة إلى الشاشة الرئيسية'"
          description="مرر لأسفل في قائمة المشاركة واختر 'Add to Home Screen'"
          icon={<Plus className="h-5 w-5 text-green-500" />}
        />
        
        <InstructionStep
          number={4}
          title="أكد الإضافة"
          description="اكتب اسم التطبيق (أو اتركه كما هو) واضغط 'إضافة'"
          icon={<Home className="h-5 w-5 text-green-500" />}
        />
      </div>
    </div>
  );

  const DesktopInstructions = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-purple-100 to-purple-200 rounded-full mb-6 shadow-lg">
          <Monitor className="h-10 w-10 text-purple-600" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-3">تثبيت التطبيق - سطح المكتب</h3>
        <p className="text-gray-600 text-lg">احصل على تجربة تطبيق مكتبي كاملة</p>
      </div>

      <div className="space-y-4">
        <InstructionStep
          number={1}
          title="استخدم Chrome أو Edge"
          description="افتح الموقع باستخدام متصفح Google Chrome أو Microsoft Edge الحديث"
          icon={<Chrome className="h-5 w-5 text-blue-500" />}
        />
        
        <InstructionStep
          number={2}
          title="ابحث عن أيقونة التثبيت"
          description="ستظهر أيقونة تثبيت (⊞) في شريط العنوان بجانب الرابط"
          icon={<Download className="h-5 w-5 text-green-500" />}
        />
        
        <InstructionStep
          number={3}
          title="اضغط على 'تثبيت'"
          description="اضغط على الأيقونة واختر 'تثبيت' أو استخدم القائمة ← 'تثبيت التطبيق'"
          icon={<Plus className="h-5 w-5 text-green-500" />}
        />
        
        <InstructionStep
          number={4}
          title="تشغيل التطبيق"
          description="سيظهر التطبيق في قائمة البرامج ويمكن الوصول إليه مثل أي برنامج آخر"
          icon={<CheckCircle className="h-5 w-5 text-green-500" />}
        />
      </div>

      <div className="text-center mt-8">
        <Button 
          onClick={installPWA}
          size="lg"
          className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-8 py-4 text-lg font-bold shadow-xl hover:shadow-2xl transition-all duration-300"
        >
          <Download className="h-6 w-6 mr-3" />
          تثبيت التطبيق الآن
          <Sparkles className="h-5 w-5 ml-3" />
        </Button>
      </div>
    </div>
  );

  const FAQItem = ({ question, answer, index }: { question: string; answer: string; index: number }) => (
    <div className="border-b border-gray-200 last:border-0 pb-4 mb-4">
      <button
        onClick={() => toggleFAQ(index)}
        className="w-full flex justify-between items-center text-left font-semibold text-lg text-gray-800 hover:text-blue-600 transition-colors"
      >
        <span>{question}</span>
        <ChevronDown className={`h-5 w-5 transition-transform duration-300 ${activeFAQ === index ? 'transform rotate-180' : ''}`} />
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${activeFAQ === index ? 'max-h-96 mt-4' : 'max-h-0'}`}
      >
        <p className="text-gray-600 leading-relaxed">{answer}</p>
      </div>
    </div>
  );

  return (
    <div className="bg-gradient-to-b from-white to-blue-50 min-h-screen" dir="rtl">
      {/* شريط التنقل المتحرك */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${isScrolled ? 'bg-white shadow-lg py-2' : 'bg-transparent py-4'}`}>
        <div className="container mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center">
            <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg mr-3">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">منصة قدراتك</h1>
          </div>
          <nav className="hidden md:flex items-center space-x-8 space-x-reverse">
            <a href="#" className="text-gray-700 hover:text-blue-600 transition-colors">الرئيسية</a>
            <a href="#" className="text-gray-700 hover:text-blue-600 transition-colors">المميزات</a>
            <a href="#" className="text-gray-700 hover:text-blue-600 transition-colors">التعليمات</a>
            <a href="#" className="text-gray-700 hover:text-blue-600 transition-colors">اتصل بنا</a>
          </nav>
          <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg">
            تحميل التطبيق
          </Button>
        </div>
      </header>

      {/* المحتوى الرئيسي */}
      <div className="container mx-auto px-6 pt-32 pb-20 max-w-7xl">
        {/* العنوان الرئيسي مع اللوجو */}
        <div className="text-center mb-16 relative">
          <div className="absolute -top-20 left-1/2 transform -translate-x-1/2 w-64 h-64 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-3xl opacity-70"></div>
          
          <div className="inline-flex items-center justify-center mb-8 relative z-10">
            <div className="relative">
              <div className="w-32 h-32 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl">
                <Brain className="h-16 w-16 text-white" strokeWidth={1.5} />
              </div>
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-400 to-purple-400 rounded-2xl blur-xl opacity-30 -z-10"></div>
            </div>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6 relative z-10">
            حمّل تطبيق <span className="underline decoration-wavy decoration-blue-400">عقلك</span> الرقمي
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed relative z-10">
            تجربة تعليمية استثنائية تواكب عصر الذكاء الاصطناعي
            <br />
            <span className="text-lg text-blue-600 font-semibold animate-pulse">سرعة خارقة • ذكاء متطور • تعلم شخصي</span>
          </p>
          
          <div className="mt-12 flex justify-center gap-6">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl blur opacity-75 group-hover:opacity-100 transition duration-500"></div>
              <Button 
                size="lg" 
                className="relative bg-white text-gray-900 hover:bg-gray-50 px-8 py-6 text-lg font-bold shadow-lg"
                onClick={() => { setSelectedPlatform('android'); setShowInstructions(true); }}
              >
                <SmartphoneIcon className="h-6 w-6 mr-3 text-blue-600" />
                للأندرويد
              </Button>
            </div>
            
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl blur opacity-75 group-hover:opacity-100 transition duration-500"></div>
              <Button 
                size="lg" 
                className="relative bg-white text-gray-900 hover:bg-gray-50 px-8 py-6 text-lg font-bold shadow-lg"
                onClick={() => { setSelectedPlatform('ios'); setShowInstructions(true); }}
              >
                <Apple className="h-6 w-6 mr-3 text-blue-600" />
                للآيفون
              </Button>
            </div>
            
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl blur opacity-75 group-hover:opacity-100 transition duration-500"></div>
              <Button 
                size="lg" 
                className="relative bg-white text-gray-900 hover:bg-gray-50 px-8 py-6 text-lg font-bold shadow-lg"
                onClick={() => { setSelectedPlatform('desktop'); setShowInstructions(true); }}
              >
                <Laptop className="h-6 w-6 mr-3 text-blue-600" />
                لسطح المكتب
              </Button>
            </div>
          </div>
        </div>

        {/* بطاقات التحميل */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          {/* أندرويد و هواوي */}
          <Card className="relative overflow-hidden hover:shadow-2xl transition-all duration-500 cursor-pointer group border-2 border-green-200 hover:border-green-400" 
                onClick={() => { setSelectedPlatform('android'); setShowInstructions(true); }}>
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-500 to-green-600"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-green-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            <CardHeader className="text-center pb-6 relative z-10">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-green-100 to-green-200 rounded-full mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Smartphone className="h-10 w-10 text-green-600" />
              </div>
              <CardTitle className="text-2xl mb-3 group-hover:text-green-600 transition-colors">أندرويد و هواوي</CardTitle>
              <p className="text-gray-600">Samsung, Huawei, Xiaomi, Oppo</p>
            </CardHeader>
            
            <CardContent className="text-center relative z-10">
              <Button className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white mb-4 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300">
                <FileDown className="h-5 w-5 mr-2" />
                تحميل APK مباشر
              </Button>
              <div className="flex justify-center gap-2 mb-4">
                <Badge className="bg-green-100 text-green-800 border border-green-200">15.2 MB</Badge>
                <Badge className="bg-blue-100 text-blue-800 border border-blue-200">مجاني</Badge>
                <Badge className="bg-purple-100 text-purple-800 border border-purple-200">آمن</Badge>
              </div>
              <p className="text-sm text-gray-500">نسخة 2.1.0 • آخر تحديث: اليوم</p>
            </CardContent>
          </Card>

          {/* آيفون */}
          <Card className="relative overflow-hidden hover:shadow-2xl transition-all duration-500 cursor-pointer group border-2 border-blue-200 hover:border-blue-400"
                onClick={() => { setSelectedPlatform('ios'); setShowInstructions(true); }}>
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-blue-600"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            <CardHeader className="text-center pb-6 relative z-10">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-100 to-blue-200 rounded-full mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Apple className="h-10 w-10 text-blue-600" />
              </div>
              <CardTitle className="text-2xl mb-3 group-hover:text-blue-600 transition-colors">آيفون و آيباد</CardTitle>
              <p className="text-gray-600">iPhone, iPad</p>
            </CardHeader>
            
            <CardContent className="text-center relative z-10">
              <Button className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white mb-4 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300">
                <Plus className="h-5 w-5 mr-2" />
                إضافة للشاشة الرئيسية
              </Button>
              <div className="flex justify-center gap-2 mb-4">
                <Badge className="bg-blue-100 text-blue-800 border border-blue-200">PWA</Badge>
                <Badge className="bg-green-100 text-green-800 border border-green-200">Safari</Badge>
                <Badge className="bg-purple-100 text-purple-800 border border-purple-200">iOS 12+</Badge>
              </div>
              <p className="text-sm text-gray-500">يعمل مثل تطبيق أصلي تماماً</p>
            </CardContent>
          </Card>

          {/* سطح المكتب */}
          <Card className="relative overflow-hidden hover:shadow-2xl transition-all duration-500 cursor-pointer group border-2 border-purple-200 hover:border-purple-400"
                onClick={() => { setSelectedPlatform('desktop'); setShowInstructions(true); }}>
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-purple-500 to-purple-600"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            <CardHeader className="text-center pb-6 relative z-10">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-purple-100 to-purple-200 rounded-full mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Monitor className="h-10 w-10 text-purple-600" />
              </div>
              <CardTitle className="text-2xl mb-3 group-hover:text-purple-600 transition-colors">سطح المكتب</CardTitle>
              <p className="text-gray-600">Windows, Mac, Linux</p>
            </CardHeader>
            
            <CardContent className="text-center relative z-10">
              <Button className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white mb-4 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300">
                <Download className="h-5 w-5 mr-2" />
                تثبيت التطبيق
              </Button>
              <div className="flex justify-center gap-2 mb-4">
                <Badge className="bg-purple-100 text-purple-800 border border-purple-200">Chrome</Badge>
                <Badge className="bg-blue-100 text-blue-800 border border-blue-200">Edge</Badge>
                <Badge className="bg-green-100 text-green-800 border border-green-200">PWA</Badge>
              </div>
              <p className="text-sm text-gray-500">تجربة تطبيق مكتبي كاملة</p>
            </CardContent>
          </Card>
        </div>

        {/* مميزات التطبيق */}
        <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-3xl p-10 shadow-xl mb-20 relative overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
          
          <h3 className="text-3xl font-bold text-center mb-12 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent relative">
            ✨ مميزات <span className="underline decoration-wavy decoration-blue-400">العقل</span> الرقمي
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            <div className="text-center group">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-100 to-blue-200 rounded-2xl mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg mx-auto">
                <Zap className="h-8 w-8 text-blue-600" />
              </div>
              <h4 className="font-bold text-lg mb-3 text-gray-900">ذكاء استثنائي</h4>
              <p className="text-gray-600">خوارزميات متطورة تفهم احتياجاتك التعليمية</p>
            </div>
            <div className="text-center group">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-100 to-green-200 rounded-2xl mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg mx-auto">
                <Brain className="h-8 w-8 text-green-600" />
              </div>
              <h4 className="font-bold text-lg mb-3 text-gray-900">تعلم تلقائي</h4>
              <p className="text-gray-600">يتكيف مع أسلوبك في التعلم ويطور نفسه باستمرار</p>
            </div>
            <div className="text-center group">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-100 to-purple-200 rounded-2xl mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg mx-auto">
                <Wifi className="h-8 w-8 text-purple-600" />
              </div>
              <h4 className="font-bold text-lg mb-3 text-gray-900">عمل متكامل</h4>
              <p className="text-gray-600">يعمل بكفاءة مع أو بدون اتصال بالإنترنت</p>
            </div>
            <div className="text-center group">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-orange-100 to-orange-200 rounded-2xl mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg mx-auto">
                <Shield className="h-8 w-8 text-orange-600" />
              </div>
              <h4 className="font-bold text-lg mb-3 text-gray-900">خصوصية مطلقة</h4>
              <p className="text-gray-600">بياناتك مشفرة ولا تشارك مع أي طرف ثالث</p>
            </div>
          </div>
        </div>

        {/* الأسئلة الشائعة */}
        <div className="mb-20">
          <h3 className="text-3xl font-bold text-center mb-12 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            <HelpCircle className="inline h-8 w-8 mr-3 -mt-1" />
            الأسئلة الشائعة
          </h3>
          
          <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg p-8">
            <FAQItem
              index={0}
              question="هل التطبيق مجاني بالكامل؟"
              answer="نعم، التطبيق مجاني بالكامل بدون أي رسوم خفية. نحن نؤمن بالتعليم المجاني للجميع."
            />
            <FAQItem
              index={1}
              question="ما هي متطلبات تشغيل التطبيق؟"
              answer="يعمل التطبيق على أجهزة أندرويد 5.1 فما فوق، وآيفون iOS 12 فما فوق، ومتصفحات Chrome و Edge الحديثة."
            />
            <FAQItem
              index={2}
              question="هل أحتاج إلى إنترنت لاستخدام التطبيق؟"
              answer="بعض الميزات تعمل بدون إنترنت، لكن للوصول إلى جميع المحتويات والوظائف الذكية يفضل الاتصال بالإنترنت."
            />
            <FAQItem
              index={3}
              question="كيف يتم تحديث التطبيق؟"
              answer="سيتم إعلامك بالتحديثات الجديدة داخل التطبيق. يمكنك تحديثه من متجر التطبيقات أو من موقعنا مباشرة."
            />
            <FAQItem
              index={4}
              question="هل بياناتي آمنة معكم؟"
              answer="نعم، نستخدم أحدث تقنيات التشفير ولا نشارك بياناتك مع أي طرف ثالث. خصوصيتك هي أولويتنا القصوى."
            />
          </div>
        </div>

        {/* دعوة للتحميل */}
        <div className="text-center mb-20">
          <h3 className="text-3xl font-bold mb-6 text-gray-900">جاهز لبدء رحلة التعلم الذكية؟</h3>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            حمّل التطبيق الآن واختبر قوة التعلم الذكي الذي يتكيف مع عقلك
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-8 py-6 text-lg font-bold shadow-xl hover:shadow-2xl transition-all duration-300"
              onClick={() => { setSelectedPlatform('android'); setShowInstructions(true); }}
            >
              <Smartphone className="h-6 w-6 mr-3" />
              تحميل للأندرويد
            </Button>
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-8 py-6 text-lg font-bold shadow-xl hover:shadow-2xl transition-all duration-300"
              onClick={() => { setSelectedPlatform('ios'); setShowInstructions(true); }}
            >
              <Apple className="h-6 w-6 mr-3" />
              تحميل للآيفون
            </Button>
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-8 py-6 text-lg font-bold shadow-xl hover:shadow-2xl transition-all duration-300"
              onClick={() => { setSelectedPlatform('desktop'); setShowInstructions(true); }}
            >
              <Laptop className="h-6 w-6 mr-3" />
              تحميل لسطح المكتب
            </Button>
          </div>
        </div>
      </div>

      {/* تذييل الصفحة */}
      <footer className="bg-gradient-to-r from-blue-50 to-purple-50 py-12 border-t border-gray-200">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-6 md:mb-0">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg mr-3">
                <Brain className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">منصة قدراتك</h2>
            </div>
            
            <div className="flex flex-wrap justify-center gap-8 mb-6 md:mb-0">
              <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">الشروط والأحكام</a>
              <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">سياسة الخصوصية</a>
              <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">اتصل بنا</a>
              <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">عن المنصة</a>
            </div>
            
            <div className="flex space-x-4 space-x-reverse">
              <Button variant="outline" size="icon" className="rounded-full border-gray-300 hover:bg-blue-50">
                <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                </svg>
              </Button>
              <Button variant="outline" size="icon" className="rounded-full border-gray-300 hover:bg-blue-50">
                <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </Button>
              <Button variant="outline" size="icon" className="rounded-full border-gray-300 hover:bg-blue-50">
                <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
              </Button>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-gray-200 text-center text-gray-500 text-sm">
            <p>© {new Date().getFullYear()} منصة قدراتك. جميع الحقوق محفوظة.</p>
          </div>
        </div>
      </footer>

      {/* نافذة التعليمات */}
      <Dialog open={showInstructions} onOpenChange={setShowInstructions}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl">تعليمات التثبيت</DialogTitle>
          </DialogHeader>
          {selectedPlatform === 'android' && <AndroidInstructions />}
          {selectedPlatform === 'ios' && <IOSInstructions />}
          {selectedPlatform === 'desktop' && <DesktopInstructions />}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InstallPage;