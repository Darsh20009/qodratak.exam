import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { SEO } from "@/components/SEO";
import {
  TrendingUp, ArrowLeft, Target, BarChart3, AlertTriangle,
  CheckCircle2, Clock, Zap, ChevronLeft, Trophy, Brain
} from "lucide-react";

function ScoreGauge({ score, max = 100 }: { score: number; max?: number }) {
  const pct = Math.min(score / max, 1);
  const angle = pct * 180 - 90;
  const color = score >= 70 ? "#22c55e" : score >= 50 ? "#f59e0b" : "#ef4444";

  return (
    <div className="relative flex flex-col items-center">
      <svg viewBox="0 0 200 110" className="w-48 h-24">
        <defs>
          <linearGradient id="gaugeTrack" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.3" />
            <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#22c55e" stopOpacity="0.3" />
          </linearGradient>
          <linearGradient id="gaugeFill" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#22c55e" />
          </linearGradient>
        </defs>
        {/* Track */}
        <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="url(#gaugeTrack)" strokeWidth="12" strokeLinecap="round" />
        {/* Fill */}
        <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="url(#gaugeFill)" strokeWidth="12" strokeLinecap="round"
          strokeDasharray={`${pct * 251.2} 251.2`} />
        {/* Needle */}
        <g transform={`translate(100, 100) rotate(${angle})`}>
          <line x1="0" y1="0" x2="0" y2="-62" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="0" cy="0" r="5" fill={color} />
        </g>
        {/* Labels */}
        <text x="14" y="110" fill="#6b7280" fontSize="10" textAnchor="middle">0</text>
        <text x="186" y="110" fill="#6b7280" fontSize="10" textAnchor="middle">{max}</text>
      </svg>
      <div className="text-center -mt-2">
        <div className="text-4xl font-black" style={{ color }}>{score}</div>
        <div className="text-xs text-muted-foreground mt-0.5">من {max}</div>
      </div>
    </div>
  );
}

export default function AiScorePrediction() {
  const { data: user } = useQuery<any>({ queryKey: ["/api/user"] });
  const userId = user?.id || user?._id;

  const { data: prediction, isLoading } = useQuery<{
    predictedScore: number;
    confidenceRange: [number, number];
    targetScore: number;
    strengths: string[];
    weaknesses: string[];
    requiredImprovement: number;
    estimatedDaysToTarget: number;
    totalTests: number;
    averageScore: number;
    recentTrend: "improving" | "stable" | "declining";
  }>({
    queryKey: ["/api/ai/score-prediction", userId],
    enabled: !!userId,
  });

  const trend = prediction?.recentTrend;
  const trendLabel = trend === "improving" ? "تحسّن مستمر ↑" : trend === "declining" ? "انخفاض ↓" : "مستقر →";
  const trendColor = trend === "improving" ? "text-emerald-400" : trend === "declining" ? "text-red-400" : "text-amber-400";

  return (
    <>
      <SEO title="توقع درجة القياس - منصة قدراتك" description="درجتك المتوقعة في اختبار القياس الوطني" url="/ai-hub/score-prediction" />

      <div className="min-h-screen bg-background" dir="rtl">
        <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

          {/* Back */}
          <Link href="/ai-hub">
            <button className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-sm transition-colors">
              <ArrowLeft className="w-4 h-4 rotate-180" />
              مركز الذكاء
            </button>
          </Link>

          {/* Header */}
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h1 className="text-xl font-black text-foreground">توقع درجة القياس</h1>
              <p className="text-sm text-muted-foreground mt-1">تحليل مسار أدائك عبر جميع اختباراتك</p>
            </div>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-muted-foreground">جارٍ تحليل أدائك...</p>
            </div>
          ) : !prediction ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
              <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
                <BarChart3 className="w-7 h-7 text-muted-foreground" />
              </div>
              <p className="text-foreground font-semibold">لا يوجد بيانات كافية بعد</p>
              <p className="text-sm text-muted-foreground max-w-xs">أجرِ اختباراً واحداً على الأقل لتفعيل التوقع</p>
              <Link href="/qiyas">
                <button className="mt-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors" data-testid="button-start-qiyas-from-prediction">
                  ابدأ اختبار قياس
                </button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">

              {/* Main Score Card */}
              <div className="rounded-2xl border bg-card p-6 space-y-4" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground font-medium">درجتك المتوقعة</span>
                  <span className={`text-xs font-semibold ${trendColor}`}>{trendLabel}</span>
                </div>

                <div className="flex justify-center">
                  <ScoreGauge score={prediction.predictedScore} max={100} />
                </div>

                <div className="flex items-center justify-between text-sm pt-2 border-t border-border">
                  <div className="text-center">
                    <div className="text-lg font-bold text-foreground">{prediction.confidenceRange[0]}–{prediction.confidenceRange[1]}</div>
                    <div className="text-xs text-muted-foreground">نطاق الثقة</div>
                  </div>
                  <div className="w-px h-8 bg-border" />
                  <div className="text-center">
                    <div className="text-lg font-bold text-foreground">{prediction.averageScore.toFixed(0)}%</div>
                    <div className="text-xs text-muted-foreground">متوسط الأداء</div>
                  </div>
                  <div className="w-px h-8 bg-border" />
                  <div className="text-center">
                    <div className="text-lg font-bold text-foreground">{prediction.totalTests}</div>
                    <div className="text-xs text-muted-foreground">اختبار أُجري</div>
                  </div>
                </div>
              </div>

              {/* Target Gap */}
              {prediction.requiredImprovement > 0 && (
                <div className="rounded-2xl border bg-card p-4 flex items-center gap-4" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
                    <Target className="w-5 h-5 text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">
                      تحتاج تحسين {prediction.requiredImprovement} نقطة للوصول إلى {prediction.targetScore}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      بالتزام اليومي، قد تصل خلال ~{prediction.estimatedDaysToTarget} يوم
                    </p>
                  </div>
                </div>
              )}

              {/* Strengths */}
              {(prediction.strengths?.length ?? 0) > 0 && (
                <div className="rounded-2xl border bg-card p-4 space-y-3" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-sm font-semibold text-foreground">نقاط القوة</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(prediction.strengths ?? []).map((s, i) => (
                      <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Weaknesses */}
              {(prediction.weaknesses?.length ?? 0) > 0 && (
                <div className="rounded-2xl border bg-card p-4 space-y-3" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                    <h3 className="text-sm font-semibold text-foreground">تحتاج تطوير</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(prediction.weaknesses ?? []).map((w, i) => (
                      <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400">{w}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Action CTA */}
              <div className="grid grid-cols-2 gap-3">
                <Link href="/qiyas">
                  <button className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-colors" data-testid="button-start-qiyas-cta">
                    اختبار قياس
                  </button>
                </Link>
                <Link href="/ai-hub/pattern-analysis">
                  <button className="w-full py-3 border border-border hover:bg-muted text-foreground text-sm font-bold rounded-xl transition-colors" data-testid="button-go-patterns">
                    تحليل الأنماط
                  </button>
                </Link>
              </div>

            </div>
          )}
        </div>
      </div>
    </>
  );
}
