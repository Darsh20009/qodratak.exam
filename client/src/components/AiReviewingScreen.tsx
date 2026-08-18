import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Mail, Eye, ClipboardCheck, CheckCircle, ArrowRight } from "lucide-react";

export interface WrongQuestion {
  questionText: string;
  options: string[];
  studentAnswerIndex: number | null;
  correctAnswerIndex: number;
  category?: string;
  subcategory?: string;
  imageUrl?: string;
}

export interface QuestionExplanation {
  questionIndex: number;
  explanation: string;
  tip: string;
  conceptError: string;
}

interface Props {
  wrongQuestions: WrongQuestion[];
  totalQuestions: number;
  score: number;
  onShowResults: (explanations?: QuestionExplanation[]) => void;
  onSendEmail?: () => void;
  userEmail?: string;
}

const REVIEW_MESSAGES = [
  "جارٍ مراجعة إجاباتك...",
  "يتم تصحيح الأسئلة...",
  "تحليل الأداء العام...",
  "إعداد تقرير مفصّل...",
  "مراجعة نقاط الضعف...",
  "يتم احتساب الدرجات...",
  "مراجعة الإجابات الصحيحة...",
  "جارٍ إتمام التصحيح...",
];

export default function AiReviewingScreen({
  wrongQuestions,
  totalQuestions,
  score,
  onShowResults,
  onSendEmail,
  userEmail,
}: Props) {
  const [msgIndex, setMsgIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<'reviewing' | 'done'>('reviewing');
  const [explanations, setExplanations] = useState<QuestionExplanation[]>([]);
  const [emailSent, setEmailSent] = useState(false);

  const TOTAL_SECS = Math.max(20, Math.min(wrongQuestions.length * 3, 45));

  const reviewMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/ai/explain-mistakes', {
        wrongQuestions,
        totalQuestions,
        score,
      });
      return res.json();
    },
    onSuccess: (data) => {
      setExplanations(data.explanations || []);
      setPhase('done');
      setProgress(100);
    },
    onError: () => {
      setPhase('done');
      setProgress(100);
    },
  });

  useEffect(() => {
    reviewMutation.mutate();
  }, []);

  useEffect(() => {
    if (phase === 'done') return;
    const interval = setInterval(() => {
      setElapsed(e => {
        const next = e + 1;
        setProgress(Math.min((next / TOTAL_SECS) * 90, 90));
        return next;
      });
      setMsgIndex(i => (i + 1) % REVIEW_MESSAGES.length);
    }, 1500);
    return () => clearInterval(interval);
  }, [phase, TOTAL_SECS]);

  useEffect(() => {
    if (elapsed >= TOTAL_SECS && phase === 'reviewing') {
      if (!reviewMutation.isPending) {
        setPhase('done');
        setProgress(100);
      }
    }
  }, [elapsed, phase, reviewMutation.isPending, TOTAL_SECS]);

  const handleSendEmail = () => {
    onSendEmail?.();
    setEmailSent(true);
  };

  const wrongCount = wrongQuestions.length;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #0d1b2a 0%, #1b2a3b 50%, #0f1c2e 100%)' }}
      dir="rtl"
    >
      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-5"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Soft glow */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(30,80,160,0.18) 0%, transparent 70%)',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      />

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center max-w-sm w-full px-6 text-center space-y-7">

        {/* Official Badge */}
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5">
          <div className="w-2 h-2 rounded-full bg-blue-400" style={{ animation: phase === 'reviewing' ? 'pulse 1.5s ease-in-out infinite' : 'none' }} />
          <span className="text-blue-300 text-xs font-semibold tracking-widest uppercase">منصة قدراتك</span>
        </div>

        {/* Animated Icon */}
        <div className="relative w-36 h-36 flex items-center justify-center">
          {/* Outer ring */}
          <div
            className="absolute inset-0 rounded-full border border-blue-500/30"
            style={{ animation: phase === 'done' ? 'none' : 'spin 8s linear infinite' }}
          />
          {/* Middle ring */}
          <div
            className="absolute inset-4 rounded-full border border-teal-400/20"
            style={{ animation: phase === 'done' ? 'none' : 'spin 5s linear infinite reverse' }}
          />
          {/* Dashed ring */}
          <div
            className="absolute inset-8 rounded-full"
            style={{
              border: '1px dashed rgba(99,102,241,0.4)',
              animation: phase === 'done' ? 'none' : 'spin 3s linear infinite',
            }}
          />
          {/* Center */}
          <div
            className="relative w-20 h-20 rounded-full flex items-center justify-center"
            style={{
              background: phase === 'done'
                ? 'radial-gradient(circle, #059669 0%, #047857 100%)'
                : 'radial-gradient(circle, #1d4ed8 0%, #1e3a8a 100%)',
              boxShadow: phase === 'done'
                ? '0 0 30px rgba(5,150,105,0.5), 0 0 60px rgba(5,150,105,0.2)'
                : '0 0 30px rgba(29,78,216,0.5), 0 0 60px rgba(29,78,216,0.2)',
              transition: 'all 0.8s ease',
            }}
          >
            {phase === 'done' ? (
              <CheckCircle className="w-10 h-10 text-white" />
            ) : (
              <ClipboardCheck className="w-10 h-10 text-white" style={{ animation: 'pulse 2s ease-in-out infinite' }} />
            )}
          </div>
        </div>

        {/* Title & Message */}
        {phase === 'reviewing' ? (
          <div className="space-y-2">
            <h2 className="text-white text-2xl font-bold tracking-tight">جارٍ تصحيح اختبارك</h2>
            <p
              className="text-blue-300/80 text-sm font-medium"
              key={msgIndex}
              style={{ animation: 'fadeIn 0.5s ease-in' }}
            >
              {REVIEW_MESSAGES[msgIndex]}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <h2 className="text-white text-2xl font-bold tracking-tight">اكتمل التصحيح</h2>
            <p className="text-emerald-400/90 text-sm font-medium">
              {wrongCount > 0
                ? `تم مراجعة ${wrongCount} سؤالاً وإعداد تقرير مفصّل`
                : 'أداء ممتاز! تم التصحيح بنجاح'}
            </p>
          </div>
        )}

        {/* Progress Bar */}
        <div className="w-full space-y-2">
          <div className="flex justify-between text-xs text-white/40">
            <span>{phase === 'done' ? 'اكتمل التصحيح' : 'يتم التصحيح...'}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full h-1.5 bg-white/8 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
            <div
              className="h-full rounded-full"
              style={{
                width: `${progress}%`,
                background: phase === 'done'
                  ? 'linear-gradient(90deg, #059669, #34d399)'
                  : 'linear-gradient(90deg, #1d4ed8, #3b82f6, #6366f1)',
                transition: 'width 0.5s ease-out',
              }}
            />
          </div>
          {/* Step indicators */}
          <div className="flex justify-between mt-1">
            {['استلام', 'مراجعة', 'تحليل', 'نتيجة'].map((step, i) => {
              const stepPct = (i + 1) * 25;
              const isActive = progress >= stepPct;
              return (
                <div key={step} className="flex flex-col items-center gap-1">
                  <div
                    className="w-1.5 h-1.5 rounded-full transition-all duration-500"
                    style={{ background: isActive ? '#3b82f6' : 'rgba(255,255,255,0.15)' }}
                  />
                  <span className="text-white/30 text-[10px]">{step}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Buttons — appear when done */}
        <div className={`w-full space-y-3 transition-all duration-700 ${phase === 'done' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>

          <button
            onClick={() => onShowResults(explanations)}
            className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl text-white font-semibold text-sm shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg, #1d4ed8, #4f46e5)' }}
            data-testid="btn-show-results-with-ai"
          >
            <Eye className="w-5 h-5" />
            عرض النتيجة
          </button>

          {userEmail && (
            <button
              onClick={handleSendEmail}
              disabled={emailSent}
              className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl font-semibold text-sm shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
              style={{ background: emailSent ? 'linear-gradient(135deg, #059669, #047857)' : 'linear-gradient(135deg, #0369a1, #0284c7)' }}
              data-testid="btn-send-email-results"
            >
              <Mail className="w-5 h-5 text-white" />
              <span className="text-white">{emailSent ? '✅ تم الإرسال إلى بريدك!' : `إرسال النتيجة إلى ${userEmail}`}</span>
            </button>
          )}

          <button
            onClick={() => onShowResults()}
            className="w-full flex items-center justify-center gap-3 py-3 rounded-xl font-medium text-sm border border-white/10 text-white/50 hover:text-white/80 hover:border-white/20 transition-all"
            data-testid="btn-skip-ai-show-basic"
          >
            <ArrowRight className="w-4 h-4" />
            تخطّ
          </button>
        </div>

        {/* Waiting hint */}
        {phase === 'reviewing' && (
          <p className="text-white/25 text-xs">لحظات وستظهر النتيجة...</p>
        )}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
      `}</style>
    </div>
  );
}
