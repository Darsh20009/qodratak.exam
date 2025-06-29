
import React from 'react';

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message = "جاري التحميل..." }: LoadingScreenProps) {
  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 flex items-center justify-center overflow-hidden">
      {/* خلفية متحركة فاخرة */}
      <div className="absolute inset-0">
        {/* تأثير الشفق القطبي */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/30 via-purple-900/20 to-indigo-900/30 animate-pulse"></div>
        
        {/* جسيمات ضوئية متحركة */}
        <div className="absolute top-10 left-10 w-2 h-2 bg-blue-400 rounded-full animate-ping opacity-60"></div>
        <div className="absolute top-20 right-20 w-1 h-1 bg-purple-400 rounded-full animate-pulse delay-1000 opacity-80"></div>
        <div className="absolute bottom-20 left-20 w-3 h-3 bg-indigo-400 rounded-full animate-bounce delay-500 opacity-70"></div>
        <div className="absolute bottom-10 right-10 w-2 h-2 bg-cyan-400 rounded-full animate-ping delay-2000 opacity-50"></div>
        <div className="absolute top-1/3 left-1/4 w-1 h-1 bg-pink-400 rounded-full animate-pulse delay-1500 opacity-90"></div>
        <div className="absolute top-2/3 right-1/3 w-2 h-2 bg-violet-400 rounded-full animate-bounce delay-700 opacity-60"></div>
        
        {/* رموز رياضية متحركة للاختبارات الكمية */}
        <div className="absolute top-16 left-1/3 text-blue-400/40 text-lg animate-float delay-300">π</div>
        <div className="absolute bottom-16 right-1/4 text-purple-400/40 text-xl animate-bounce delay-1000">∑</div>
        <div className="absolute top-1/2 left-16 text-cyan-400/40 text-base animate-pulse delay-1500">√</div>
        <div className="absolute bottom-1/3 right-16 text-pink-400/40 text-lg animate-float delay-2000">∞</div>
        <div className="absolute top-1/4 right-1/2 text-indigo-400/40 text-sm animate-bounce delay-500">∆</div>
        <div className="absolute bottom-1/4 left-1/2 text-violet-400/40 text-base animate-pulse delay-800">∫</div>
        
        {/* تأثير الشبكة المضيئة */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_50%_200px,rgba(59,130,246,0.1),transparent)] animate-pulse"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_600px_at_80%_80%,rgba(168,85,247,0.08),transparent)] animate-pulse delay-1000"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_400px_at_20%_60%,rgba(236,72,153,0.06),transparent)] animate-pulse delay-2000"></div>
      </div>

      {/* المحتوى الرئيسي */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center space-y-8">
        {/* الأيقونة الفخمة مع تأثيرات */}
        <div className="relative">
          {/* هالة ضوئية خارجية */}
          <div className="absolute inset-0 w-32 h-32 bg-gradient-to-r from-blue-500/30 via-purple-500/30 to-pink-500/30 rounded-full blur-xl animate-spin-slow"></div>
          <div className="absolute inset-2 w-28 h-28 bg-gradient-to-r from-cyan-400/20 via-blue-400/20 to-indigo-400/20 rounded-full blur-lg animate-spin-reverse"></div>

          {/* الأيقونة المركزية */}
          <div className="relative w-24 h-24 mx-auto bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-500/50 border border-blue-400/30 backdrop-blur-sm">
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-3xl"></div>
            <div className="text-4xl animate-pulse">🧠</div>

            {/* تأثير البريق */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-3xl animate-shimmer"></div>
          </div>

          {/* جسيمات دائرية حول الأيقونة */}
          <div className="absolute -top-2 -right-2 w-3 h-3 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-bounce opacity-80"></div>
          <div className="absolute -bottom-2 -left-2 w-2 h-2 bg-gradient-to-r from-pink-400 to-rose-500 rounded-full animate-ping opacity-70"></div>
          <div className="absolute top-1/2 -right-3 w-1.5 h-1.5 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full animate-pulse opacity-90"></div>
          <div className="absolute top-1/2 -left-3 w-1.5 h-1.5 bg-gradient-to-r from-purple-400 to-violet-500 rounded-full animate-bounce delay-500 opacity-80"></div>
        </div>

        {/* العنوان */}
        <div className="space-y-4">
          <div className="relative">
            <h1 className="text-4xl font-black bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-shimmer drop-shadow-2xl">
              منصة قدراتك
            </h1>
            {/* تأثير الظل المضيء */}
            <div className="absolute inset-0 text-4xl font-black text-blue-400/20 blur-sm">
              منصة قدراتك
            </div>
          </div>

          <div className="relative">
            <p className="text-lg text-slate-200 font-medium tracking-wide opacity-90">
              {message}
            </p>
            <div className="absolute inset-0 text-lg text-blue-300/30 blur-sm">
              {message}
            </div>
          </div>
        </div>

        {/* شريط التحميل الفخم */}
        <div className="w-64 mx-auto space-y-3">
          <div className="relative">
            {/* الخلفية المضيئة */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-full blur-sm"></div>

            {/* شريط التحميل الرئيسي */}
            <div className="relative w-full h-2 bg-slate-800/50 rounded-full overflow-hidden border border-blue-400/30 backdrop-blur-sm">
              <div className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full animate-loading-bar shadow-lg shadow-blue-500/50"></div>

              {/* تأثير البريق المتحرك */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
            </div>
          </div>

          {/* نقاط التحميل المتحركة */}
          <div className="flex items-center justify-center space-x-2">
            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"></div>
            <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce delay-150"></div>
            <div className="w-1.5 h-1.5 bg-pink-400 rounded-full animate-bounce delay-300"></div>
          </div>
        </div>
      </div>

      {/* أنماط CSS مخصصة */}
      <style>{`
        @keyframes loading-bar {
          0% { width: 0%; }
          100% { width: 100%; }
        }

        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes spin-reverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }

        .animate-loading-bar {
          animation: loading-bar 2s ease-in-out infinite;
        }

        .animate-shimmer {
          animation: shimmer 3s ease-in-out infinite;
        }

        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }

        .animate-spin-reverse {
          animation: spin-reverse 12s linear infinite;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(5deg); }
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
