import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Gift, Clock, Star } from "lucide-react";
import confetti from "canvas-confetti";
import nationalDayImage from "@assets/Gemini_Generated_Image_txx6gftxx6gftxx6 (1)_1758552917496.png";

interface NationalDayPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NationalDayPopup({ isOpen, onClose }: NationalDayPopupProps) {
  const [timeLeft, setTimeLeft] = useState<string>("");

  // حساب الوقت المتبقي للعرض
  useEffect(() => {
    const calculateTimeLeft = () => {
      const endDate = new Date("2025-09-24T06:00:00+03:00"); // الأربعاء 6 صباحاً
      const now = new Date();
      const difference = endDate.getTime() - now.getTime();

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        
        setTimeLeft(`${days} يوم ${hours} ساعة ${minutes} دقيقة`);
      } else {
        setTimeLeft("انتهى العرض");
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 60000); // تحديث كل دقيقة

    return () => clearInterval(timer);
  }, []);

  // إطلاق الألعاب النارية عند فتح النافذة
  useEffect(() => {
    if (isOpen) {
      const celebration = () => {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#006C35', '#FFFFFF', '#FFD700'] // ألوان العلم السعودي + ذهبي
        });
      };
      
      celebration();
      setTimeout(celebration, 500);
      setTimeout(celebration, 1000);
    }
  }, [isOpen]);

  const handleSubscribe = () => {
    // يمكن إضافة منطق الدفع المناسب هنا
    window.open("https://www.paypal.com/ncp/payment/DKENUGQM8MMDQ", "_blank");
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-md p-0 bg-gradient-to-br from-green-600 via-green-500 to-green-700 border-2 border-yellow-400 rounded-xl overflow-hidden shadow-2xl">
        {/* زر الإغلاق */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 text-white hover:bg-white/20 rounded-full"
          data-testid="button-close-popup"
        >
          <X className="h-6 w-6" />
        </Button>

        {/* العنوان الرئيسي */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-green-600/90 to-green-700/90" />
          <div className="relative text-center py-4 px-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-2xl">🎉</span>
              <h2 className="text-lg font-bold text-white" data-testid="text-celebration-title">
                اليوم الوطني 95
              </h2>
              <span className="text-2xl">🇸🇦</span>
            </div>
            <div className="flex items-center justify-center gap-1">
              <Star className="h-4 w-4 text-yellow-400 fill-current" />
              <span className="text-sm text-yellow-100 font-semibold">عرض استثنائي</span>
              <Star className="h-4 w-4 text-yellow-400 fill-current" />
            </div>
          </div>
        </div>

        {/* تفاصيل العرض */}
        <div className="px-4 pb-4 text-center">
          <div className="bg-white/95 rounded-xl p-4 mb-3 border border-yellow-400">
            <div className="flex items-center justify-center gap-1 mb-2">
              <Gift className="h-4 w-4 text-green-600" />
              <h3 className="text-sm font-bold text-green-800" data-testid="text-offer-title">
                Pro Life Plus
              </h3>
            </div>
            
            <div className="space-y-1 mb-3">
              <div className="flex items-center justify-center gap-2">
                <span className="text-xs text-gray-600">بدلاً من</span>
                <span className="text-sm font-bold text-red-500 line-through">235 ريال</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <span className="text-sm text-gray-600">فقط</span>
                <span className="text-2xl font-bold text-green-600" data-testid="text-special-price">95 ريال</span>
                <span className="text-lg">✨</span>
              </div>
              <div className="text-xs text-gray-500">
                خصم <span className="font-bold text-green-600">60%</span>
              </div>
            </div>

            {/* العد التنازلي */}
            <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-lg p-2 mb-3 border border-red-200">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Clock className="h-3 w-3 text-red-600" />
                <span className="text-xs font-semibold text-red-700">متبقي:</span>
              </div>
              <div className="text-sm font-bold text-red-800" data-testid="text-countdown">
                {timeLeft}
              </div>
            </div>

            {/* زر الاشتراك */}
            <Button
              onClick={handleSubscribe}
              className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold py-2 px-4 rounded-lg text-sm shadow-lg transform hover:scale-105 transition-all duration-200"
              data-testid="button-subscribe-offer"
            >
              <Gift className="h-4 w-4 ml-1" />
              اشترك الآن! 🎯
            </Button>
          </div>

          {/* رسالة تحفيزية */}
          <div className="text-white text-center">
            <p className="text-xs text-green-100">
              عرض محدود بمناسبة اليوم الوطني 🇸🇦
            </p>
          </div>
        </div>

        {/* زخرفة سفلية */}
        <div className="h-2 bg-gradient-to-r from-green-400 via-yellow-400 to-green-400"></div>
      </DialogContent>
    </Dialog>
  );
}