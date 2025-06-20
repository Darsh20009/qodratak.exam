import React, { useState } from 'react';
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
  Sparkles
} from 'lucide-react';

const InstallPage: React.FC = () => {
  const [showInstructions, setShowInstructions] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<'android' | 'ios' | 'desktop' | null>(null);

  // تحميل APK مباشرة
  const downloadAPK = async () => {
    try {
      // عرض رسالة تحميل
      const downloadButton = document.querySelector('#download-apk-btn') as HTMLButtonElement;
      if (downloadButton) {
        downloadButton.disabled = true;
        downloadButton.innerHTML = '<svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" stroke-dasharray="32" stroke-dashoffset="32"><animate attributeName="stroke-dasharray" dur="2s" values="0 32;16 16;0 32;0 32" repeatCount="indefinite"/><animate attributeName="stroke-dashoffset" dur="2s" values="0;-16;-32;-48" repeatCount="indefinite"/></circle></svg>جاري التحميل...';
      }

      // محاكاة وقت التحميل
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // تحميل الملف
      const apkUrl = '/app/qudratak-app.apk';
      const response = await fetch(apkUrl);
      const blob = await response.blob();
      
      // إنشاء رابط التحميل
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'منصة-قدراتك-v2.1.0.apk';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      // إعادة تعيين الزر
      if (downloadButton) {
        downloadButton.disabled = false;
        downloadButton.innerHTML = '<svg className="h-6 w-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"></path></svg>تحميل APK (15.2 MB) <svg className="h-5 w-5 ml-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>';
      }

      // عرض رسالة نجاح
      alert('تم تحميل التطبيق بنجاح! تحقق من مجلد التحميلات واتبع تعليمات التثبيت.');

    } catch (error) {
      console.error('خطأ في التحميل:', error);
      alert('حدث خطأ أثناء التحميل. يرجى المحاولة مرة أخرى.');
      
      // إعادة تعيين الزر في حالة الخطأ
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

  return (
    <div className="container mx-auto p-6 max-w-7xl" dir="rtl">
      {/* العنوان الرئيسي مع اللوجو */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center mb-6">
          <div className="relative">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-2xl">
              <svg className="w-14 h-14 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c1.19 0 2.34-.21 3.41-.6.3-.11.49-.4.49-.72 0-.43-.35-.78-.78-.78-.25 0-.47.12-.61.3-.85.27-1.76.42-2.71.42-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8c0 .9-.16 1.76-.44 2.55-.27.76-.66 1.48-1.14 2.13-.48.65-1.05 1.23-1.69 1.73-.64.5-1.36.91-2.14 1.2-.78.29-1.62.44-2.5.44-.88 0-1.72-.15-2.5-.44-.78-.29-1.5-.7-2.14-1.2-.64-.5-1.21-1.08-1.69-1.73-.48-.65-.87-1.37-1.14-2.13C4.16 13.76 4 12.9 4 12c0-4.41 3.59-8 8-8s8 3.59 8 8c0 1.25-.29 2.43-.8 3.49-.51 1.06-1.23 2.01-2.12 2.8-.89.79-1.94 1.41-3.08 1.83-1.14.42-2.35.63-3.58.63h-.84c-.41 0-.75.34-.75.75s.34.75.75.75h.84c1.44 0 2.85-.25 4.19-.73 1.34-.48 2.57-1.22 3.61-2.15.52-.47.99-.99 1.41-1.56.42-.57.78-1.18 1.08-1.83.3-.65.53-1.33.69-2.04.16-.71.24-1.44.24-2.19 0-5.52-4.48-10-10-10z"/>
                <circle cx="8.5" cy="10.5" r="1.5"/>
                <circle cx="15.5" cy="10.5" r="1.5"/>
                <path d="M12 17c2.21 0 4-1.79 4-4h-8c0 2.21 1.79 4 4 4z"/>
              </svg>
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-xl"></div>
          </div>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
          حمّل تطبيق منصة قدراتك
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
          احصل على تجربة تعليمية فائقة مع تطبيقنا المحمول المتطور
          <br />
          <span className="text-lg text-blue-600 font-semibold">سرعة أكبر • إشعارات ذكية • عمل بدون إنترنت</span>
        </p>
      </div>

      {/* بطاقات التحميل */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
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
      <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-3xl p-10 shadow-xl">
        <h3 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          ✨ مميزات التطبيق المحمول
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="text-center group">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-100 to-blue-200 rounded-2xl mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
              <Zap className="h-8 w-8 text-blue-600" />
            </div>
            <h4 className="font-bold text-lg mb-3 text-gray-900">أسرع 10 مرات</h4>
            <p className="text-gray-600">سرعة فائقة في تحميل الصفحات والمحتوى</p>
          </div>
          <div className="text-center group">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-100 to-green-200 rounded-2xl mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
              <Wifi className="h-8 w-8 text-green-600" />
            </div>
            <h4 className="font-bold text-lg mb-3 text-gray-900">عمل بدون إنترنت</h4>
            <p className="text-gray-600">استخدم أجزاء من التطبيق حتى بدون اتصال</p>
          </div>
          <div className="text-center group">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-100 to-purple-200 rounded-2xl mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
              <Star className="h-8 w-8 text-purple-600" />
            </div>
            <h4 className="font-bold text-lg mb-3 text-gray-900">تجربة متميزة</h4>
            <p className="text-gray-600">واجهة محسنة وتجربة مستخدم فائقة</p>
          </div>
          <div className="text-center group">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-orange-100 to-orange-200 rounded-2xl mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
              <Shield className="h-8 w-8 text-orange-600" />
            </div>
            <h4 className="font-bold text-lg mb-3 text-gray-900">آمن 100%</h4>
            <p className="text-gray-600">بياناتك محمية ومشفرة بأحدث التقنيات</p>
          </div>
        </div>
      </div>

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