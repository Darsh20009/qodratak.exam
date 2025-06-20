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
  Wifi,
  Battery,
  Signal,
  ArrowRight,
  CheckCircle,
  Info,
  Star,
  Zap,
  Shield
} from 'lucide-react';

const AppDownloadSection: React.FC = () => {
  const [showInstructions, setShowInstructions] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<'android' | 'ios' | 'desktop' | null>(null);

  const handleInstallPWA = () => {
    // التحقق من إمكانية التثبيت
    if ('serviceWorker' in navigator) {
      // تسجيل Service Worker للـ PWA
      navigator.serviceWorker.register('/sw.js').catch(console.error);
    }
    
    // محاولة تشغيل prompt التثبيت
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
    <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
      <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
        {number}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          {icon}
          <h4 className="font-semibold text-gray-900">{title}</h4>
        </div>
        <p className="text-gray-600 text-sm">{description}</p>
      </div>
    </div>
  );

  const AndroidInstructions = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
          <Smartphone className="h-8 w-8 text-green-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">تثبيت التطبيق - أندرويد</h3>
        <p className="text-gray-600">اتبع الخطوات التالية لتثبيت التطبيق على جهازك الأندرويد</p>
      </div>

      <div className="space-y-4">
        <InstructionStep
          number={1}
          title="افتح متصفح Chrome"
          description="تأكد من استخدام متصفح Google Chrome على جهازك الأندرويد"
          icon={<Chrome className="h-5 w-5 text-blue-500" />}
        />
        
        <InstructionStep
          number={2}
          title="اضغط على القائمة"
          description="اضغط على الثلاث نقاط (⋮) في أعلى يمين المتصفح"
          icon={<MoreVertical className="h-5 w-5 text-gray-600" />}
        />
        
        <InstructionStep
          number={3}
          title="اختر 'تثبيت التطبيق'"
          description="ابحث عن خيار 'Install app' أو 'Add to Home screen' واضغط عليه"
          icon={<Download className="h-5 w-5 text-green-500" />}
        />
        
        <InstructionStep
          number={4}
          title="أكد التثبيت"
          description="اضغط على 'Install' أو 'تثبيت' لإضافة التطبيق إلى الشاشة الرئيسية"
          icon={<CheckCircle className="h-5 w-5 text-green-500" />}
        />
      </div>

      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-yellow-800 mb-1">ملاحظة مهمة</h4>
            <p className="text-yellow-700 text-sm">
              إذا لم تجد خيار "تثبيت التطبيق"، يمكنك إضافته للشاشة الرئيسية عبر القائمة → "Add to Home screen"
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const IOSInstructions = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
          <Apple className="h-8 w-8 text-blue-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">تثبيت التطبيق - آيفون</h3>
        <p className="text-gray-600">اتبع الخطوات التالية لتثبيت التطبيق على جهازك الآيفون</p>
      </div>

      <div className="space-y-4">
        <InstructionStep
          number={1}
          title="افتح متصفح Safari"
          description="تأكد من استخدام متصفح Safari المدمج في iOS"
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
          title="اختر 'Add to Home Screen'"
          description="مرر لأسفل في قائمة المشاركة واختر 'Add to Home Screen' أو 'إضافة إلى الشاشة الرئيسية'"
          icon={<Plus className="h-5 w-5 text-green-500" />}
        />
        
        <InstructionStep
          number={4}
          title="اكتب اسم التطبيق واضغط 'Add'"
          description="يمكنك تخصيص اسم التطبيق ثم اضغط 'Add' أو 'إضافة'"
          icon={<Home className="h-5 w-5 text-green-500" />}
        />
      </div>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-800 mb-1">نصيحة</h4>
            <p className="text-blue-700 text-sm">
              بعد التثبيت، ستجد أيقونة التطبيق على الشاشة الرئيسية وسيعمل مثل تطبيق عادي تماماً
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const DesktopInstructions = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
          <Monitor className="h-8 w-8 text-purple-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">تثبيت التطبيق - سطح المكتب</h3>
        <p className="text-gray-600">استخدم التطبيق على جهاز الكمبيوتر أو اللابتوب</p>
      </div>

      <div className="space-y-4">
        <InstructionStep
          number={1}
          title="استخدم Chrome أو Edge"
          description="افتح الموقع باستخدام متصفح Google Chrome أو Microsoft Edge"
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
          title="اضغط على 'Install'"
          description="اضغط على الأيقونة واختر 'Install' أو استخدم القائمة ← 'Install App'"
          icon={<Plus className="h-5 w-5 text-green-500" />}
        />
        
        <InstructionStep
          number={4}
          title="استمتع بالتطبيق"
          description="سيتم إضافة التطبيق لقائمة البرامج ويمكن الوصول إليه مثل أي برنامج آخر"
          icon={<CheckCircle className="h-5 w-5 text-green-500" />}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-5 w-5 text-green-600" />
            <h4 className="font-medium text-green-800">أسرع في التحميل</h4>
          </div>
          <p className="text-green-700 text-sm">يعمل التطبيق بسرعة أكبر عند تثبيته مقارنة بالمتصفح العادي</p>
        </div>
        
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-5 w-5 text-blue-600" />
            <h4 className="font-medium text-blue-800">يعمل بدون إنترنت</h4>
          </div>
          <p className="text-blue-700 text-sm">يمكن استخدام أجزاء من التطبيق حتى بدون اتصال بالإنترنت</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full" dir="rtl">
      {/* قسم العنوان الرئيسي */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4 shadow-lg">
          <div className="text-white font-bold text-2xl">ق</div>
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-3">حمّل التطبيق على جهازك</h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          استمتع بتجربة أفضل مع تطبيق منصة قدراتك المحمول. سرعة أكبر، إشعارات ذكية، وإمكانية العمل بدون إنترنت
        </p>
      </div>
      {/* بطاقات منصات التحميل */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* أندرويد */}
        <Card className="relative overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group" 
              onClick={() => { setSelectedPlatform('android'); setShowInstructions(true); }}>
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-green-600"></div>
          <CardHeader className="text-center pb-4">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4 group-hover:scale-110 transition-transform">
              <Smartphone className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-xl mb-2">أندرويد</CardTitle>
            <p className="text-gray-600 text-sm">Samsung, Huawei, Xiaomi</p>
          </CardHeader>
          <CardContent className="text-center">
            <Button className="w-full bg-green-500 hover:bg-green-600 text-white mb-3">
              <Download className="h-4 w-4 mr-2" />
              تعليمات التثبيت
            </Button>
            <div className="flex justify-center gap-2">
              <Badge variant="secondary" className="text-xs">مجاني</Badge>
              <Badge variant="secondary" className="text-xs">بدون إعلانات</Badge>
            </div>
          </CardContent>
        </Card>

        {/* آيفون */}
        <Card className="relative overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group"
              onClick={() => { setSelectedPlatform('ios'); setShowInstructions(true); }}>
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-blue-600"></div>
          <CardHeader className="text-center pb-4">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4 group-hover:scale-110 transition-transform">
              <Apple className="h-8 w-8 text-blue-600" />
            </div>
            <CardTitle className="text-xl mb-2">آيفون</CardTitle>
            <p className="text-gray-600 text-sm">iPhone, iPad</p>
          </CardHeader>
          <CardContent className="text-center">
            <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white mb-3">
              <Download className="h-4 w-4 mr-2" />
              تعليمات التثبيت
            </Button>
            <div className="flex justify-center gap-2">
              <Badge variant="secondary" className="text-xs">Safari</Badge>
              <Badge variant="secondary" className="text-xs">PWA</Badge>
            </div>
          </CardContent>
        </Card>

        {/* سطح المكتب */}
        <Card className="relative overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group"
              onClick={() => { setSelectedPlatform('desktop'); setShowInstructions(true); }}>
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-purple-600"></div>
          <CardHeader className="text-center pb-4">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4 group-hover:scale-110 transition-transform">
              <Monitor className="h-8 w-8 text-purple-600" />
            </div>
            <CardTitle className="text-xl mb-2">سطح المكتب</CardTitle>
            <p className="text-gray-600 text-sm">Windows, Mac, Linux</p>
          </CardHeader>
          <CardContent className="text-center">
            <Button className="w-full bg-purple-500 hover:bg-purple-600 text-white mb-3">
              <Download className="h-4 w-4 mr-2" />
              تعليمات التثبيت
            </Button>
            <div className="flex justify-center gap-2">
              <Badge variant="secondary" className="text-xs">Chrome</Badge>
              <Badge variant="secondary" className="text-xs">Edge</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
      {/* زر التثبيت المباشر */}
      <div className="text-center mb-8">
        <Button 
          onClick={handleInstallPWA}
          size="lg"
          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <Download className="h-5 w-5 mr-2" />
          تثبيت التطبيق الآن
          <ArrowRight className="h-5 w-5 ml-2" />
        </Button>
        <p className="text-gray-500 text-sm mt-2">
          أو اتبع التعليمات أعلاه حسب نوع جهازك
        </p>
      </div>
      {/* مميزات التطبيق */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8 text-[#2b3245]">
        <h3 className="text-2xl font-bold text-center bg-[#282f41] mb-6">لماذا تحمل التطبيق؟</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-3">
              <Zap className="h-6 w-6 text-blue-600" />
            </div>
            <h4 className="font-semibold mb-2">أسرع في التحميل</h4>
            <p className="text-gray-600 text-sm">سرعة فائقة في تحميل الصفحات والمحتوى</p>
          </div>
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-3">
              <Wifi className="h-6 w-6 text-green-600" />
            </div>
            <h4 className="font-semibold mb-2">يعمل بدون إنترنت</h4>
            <p className="text-gray-600 text-sm">استخدم التطبيق حتى بدون اتصال بالإنترنت</p>
          </div>
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mb-3">
              <Star className="h-6 w-6 text-purple-600" />
            </div>
            <h4 className="font-semibold mb-2">تجربة أفضل</h4>
            <p className="text-gray-600 text-sm">واجهة محسنة وتجربة مستخدم فائقة</p>
          </div>
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-100 rounded-full mb-3">
              <Shield className="h-6 w-6 text-orange-600" />
            </div>
            <h4 className="font-semibold mb-2">آمن ومحمي</h4>
            <p className="text-gray-600 text-sm">بياناتك محمية ومشفرة بأحدث التقنيات</p>
          </div>
        </div>
      </div>
      {/* نافذة التعليمات */}
      <Dialog open={showInstructions} onOpenChange={setShowInstructions}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-center">تعليمات التثبيت</DialogTitle>
          </DialogHeader>
          {selectedPlatform === 'android' && <AndroidInstructions />}
          {selectedPlatform === 'ios' && <IOSInstructions />}
          {selectedPlatform === 'desktop' && <DesktopInstructions />}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AppDownloadSection;