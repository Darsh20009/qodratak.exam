
import React, { useState, useEffect } from 'react';
import { MessageCircleIcon, XIcon, SendIcon, HeadphonesIcon, ClockIcon, MailIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

const getSupportHours = () => {
  const now = new Date();
  const day = now.getDay(); // 0 = Sunday, 5 = Friday
  const hour = now.getHours();
  
  if (day === 5) { // Friday
    return {
      isOpen: hour >= 14 && hour < 23,
      message: 'الجمعة: من 2 ظهرًا حتى 11 مساءً'
    };
  } else {
    return {
      isOpen: hour >= 10 && hour < 24,
      message: 'يومياً: من 10 صباحًا حتى 12 منتصف الليل'
    };
  }
};

export const TelegramSupport: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [message, setMessage] = useState('');
  const [supportHours, setSupportHours] = useState(getSupportHours());

  useEffect(() => {
    const interval = setInterval(() => {
      setSupportHours(getSupportHours());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  const handleSendMessage = () => {
    if (message.trim()) {
      const telegramUrl = `https://t.me/qodratak2030?text=${encodeURIComponent(message)}`;
      window.open(telegramUrl, '_blank');
      setMessage('');
      setIsExpanded(false);
    }
  };

  const handleSendEmail = () => {
    if (message.trim()) {
      const subject = encodeURIComponent('🔧 رسالة دعم فني من منصة قدراتك');
      const body = encodeURIComponent(`
مرحباً فريق الدعم الفني،

${message}

---
تم الإرسال من منصة قدراتك
التاريخ: ${new Date().toLocaleString('ar-SA')}
      `);
      
      const mailtoUrl = `mailto:qoudratak@gmail.com?subject=${subject}&body=${body}`;
      window.location.href = mailtoUrl;
      setMessage('');
      setIsExpanded(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 right-6 z-50">
      {/* Expanded Message Box */}
      {isExpanded && (
        <div className="mb-4 bg-white/95 dark:bg-gray-900/95 rounded-3xl shadow-2xl border border-gray-200/30 dark:border-gray-700/30 p-8 w-[420px] max-w-[calc(100vw-3rem)] backdrop-blur-xl">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-14 h-14 rounded-2xl flex items-center justify-center relative",
                supportHours.isOpen 
                  ? "bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 border border-emerald-300/30" 
                  : "bg-gradient-to-br from-amber-500/20 to-orange-600/20 border border-amber-300/30"
              )}>
                <HeadphonesIcon className={cn(
                  "w-7 h-7", 
                  supportHours.isOpen ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
                )} />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-1">
                  الدعم الفني
                </h3>
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    supportHours.isOpen ? "bg-emerald-500" : "bg-amber-500"
                  )}></div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {supportHours.isOpen ? "متاح الآن" : "غير متاح حالياً"}
                  </span>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(false)}
              className="h-10 w-10 p-0 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600"
            >
              <XIcon className="w-5 h-5" />
            </Button>
          </div>

          {/* Support Hours Info */}
          <div className={cn(
            "mb-6 p-4 rounded-2xl border text-center",
            supportHours.isOpen 
              ? "bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-200/50 dark:border-emerald-700/30"
              : "bg-amber-50/50 dark:bg-amber-900/10 border-amber-200/50 dark:border-amber-700/30"
          )}>
            <ClockIcon className={cn(
              "w-5 h-5 mx-auto mb-2",
              supportHours.isOpen ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
            )} />
            <p className={cn(
              "text-sm font-medium",
              supportHours.isOpen 
                ? "text-emerald-700 dark:text-emerald-300"
                : "text-amber-700 dark:text-amber-300"
            )}>
              {supportHours.message}
            </p>
          </div>
          
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="اكتب استفسارك أو مشكلتك هنا وسنرد عليك في أسرع وقت..."
            className="mb-6 min-h-[120px] resize-none border-2 border-gray-200/50 dark:border-gray-700/50 focus:border-blue-400/50 dark:focus:border-blue-500/50 rounded-2xl bg-gray-50/30 dark:bg-gray-800/30 text-gray-800 dark:text-gray-200"
            dir="rtl"
          />
          
          <div className="grid grid-cols-1 gap-3">
            <Button
              onClick={handleSendMessage}
              disabled={!message.trim()}
              className="w-full bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-500 text-white py-4 rounded-2xl font-semibold text-base transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              <MessageCircleIcon className="w-5 h-5 ml-2" />
              إرسال عبر تيليجرام
            </Button>
            
            <Button
              onClick={handleSendEmail}
              disabled={!message.trim()}
              variant="outline"
              className="w-full border-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 dark:border-emerald-400 dark:text-emerald-400 dark:hover:bg-emerald-900/20 py-4 rounded-2xl font-semibold text-base transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              <MailIcon className="w-5 h-5 ml-2" />
              إرسال عبر البريد الإلكتروني
            </Button>
          </div>
          
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4 leading-relaxed">
            اختر طريقة التواصل المفضلة لديك<br />
            رد سريع خلال {supportHours.isOpen ? 'دقائق' : 'ساعات العمل'}
          </p>
        </div>
      )}

      {/* Support Button */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "cursor-pointer group relative overflow-hidden",
          "bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900",
          "hover:from-slate-600 hover:via-slate-700 hover:to-slate-800",
          "text-white rounded-full shadow-lg hover:shadow-xl",
          "transition-all duration-300 ease-out",
          "border border-white/10 dark:border-gray-600/20",
          "w-14 h-14 flex items-center justify-center",
          isExpanded ? "scale-105" : "hover:scale-110"
        )}
        data-testid="telegram-support-button"
      >
        <MessageCircleIcon className="w-6 h-6 text-white z-10 relative" />
        
        {/* Subtle glow effect */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        
        {/* Status indicator */}
        <div className={cn(
          "absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center shadow-md",
          supportHours.isOpen ? "bg-emerald-500" : "bg-amber-500"
        )}>
          <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
        </div>
      </div>
    </div>
  );
};
