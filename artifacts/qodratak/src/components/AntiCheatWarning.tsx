import { AlertTriangle, X } from 'lucide-react';

interface AntiCheatWarningProps {
  violations: number;
  lastViolationType: string | null;
  isVisible: boolean;
  onDismiss: () => void;
  maxViolations?: number;
}

const VIOLATION_MESSAGES: Record<string, string> = {
  tab_switch: 'تم رصد خروجك من صفحة الاختبار!',
  window_blur: 'تم رصد تحويل التركيز خارج الاختبار!',
  right_click: 'النقر بالزر الأيمن غير مسموح أثناء الاختبار!',
  devtools: 'فتح أدوات المطور غير مسموح!',
  copy_attempt: 'النسخ غير مسموح أثناء الاختبار!',
  screenshot: 'التقاط الشاشة غير مسموح!',
};

export function AntiCheatWarning({ violations, lastViolationType, isVisible, onDismiss, maxViolations = 3 }: AntiCheatWarningProps) {
  if (!isVisible) return null;

  const message = lastViolationType ? (VIOLATION_MESSAGES[lastViolationType] || 'تم رصد مخالفة!') : 'تم رصد مخالفة!';
  const remaining = maxViolations - violations;
  const isLast = remaining <= 0;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] max-w-sm w-full px-4 animate-in slide-in-from-top duration-300" dir="rtl">
      <div className={`rounded-2xl border shadow-2xl p-4 flex items-start gap-3 ${
        isLast
          ? 'bg-red-950 border-red-500 shadow-red-500/30'
          : violations >= maxViolations - 1
          ? 'bg-orange-950 border-orange-500 shadow-orange-500/20'
          : 'bg-yellow-950 border-yellow-500 shadow-yellow-500/20'
      }`}>
        <div className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center ${
          isLast ? 'bg-red-500/20' : violations >= maxViolations - 1 ? 'bg-orange-500/20' : 'bg-yellow-500/20'
        }`}>
          <AlertTriangle className={`w-5 h-5 ${isLast ? 'text-red-400' : violations >= maxViolations - 1 ? 'text-orange-400' : 'text-yellow-400'}`} />
        </div>
        <div className="flex-1">
          <p className={`font-bold text-sm ${isLast ? 'text-red-300' : violations >= maxViolations - 1 ? 'text-orange-300' : 'text-yellow-300'}`}>
            ⚠️ تحذير غش - مخالفة #{violations}
          </p>
          <p className="text-white/80 text-xs mt-0.5">{message}</p>
          {!isLast && remaining > 0 && (
            <p className="text-white/50 text-xs mt-1">
              {remaining === 1
                ? '⛔ تحذير أخير - المخالفة التالية ستنهي الاختبار!'
                : `باقي ${remaining} تحذير قبل إنهاء الاختبار تلقائياً`}
            </p>
          )}
          {isLast && (
            <p className="text-red-300 text-xs mt-1 font-semibold">سيتم إنهاء الاختبار تلقائياً!</p>
          )}
        </div>
        <button onClick={onDismiss} className="text-white/40 hover:text-white/80 transition-colors flex-shrink-0 mt-0.5">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
