import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  GraduationCap, Sparkles, TrendingUp, TrendingDown,
  Target, Lightbulb, ChevronDown, ChevronUp, Star,
  BookOpen, Clock, CheckCircle, AlertCircle, Zap,
} from "lucide-react";

interface WrongQuestion {
  questionText: string;
  options: string[];
  studentAnswerIndex: number | null;
  correctAnswerIndex: number;
  category?: string;
  subcategory?: string;
}

interface Props {
  wrongQuestions: WrongQuestion[];
  totalQuestions: number;
  score: number;
  verbalScore?: number;
  verbalTotal?: number;
  quantitativeScore?: number;
  quantitativeTotal?: number;
}

interface AIAnalysis {
  overallComment: string;
  strengthsComment: string;
  weaknessesComment: string;
  topWeakAreas: string[];
  topStrengths: string[];
  actionPlan: string[];
  encouragement: string;
}

// ── Default fallback analysis ──────────────────────────────────────────
function buildFallback(
  score: number,
  total: number,
  wrongQuestions: WrongQuestion[]
): AIAnalysis {
  const pct = Math.round((score / total) * 100);
  const catWrong: Record<string, number> = {};
  wrongQuestions.forEach(q => {
    const c = q.subcategory || q.category || "عام";
    catWrong[c] = (catWrong[c] || 0) + 1;
  });
  const sorted = Object.entries(catWrong).sort((a, b) => b[1] - a[1]);
  const topWeak = sorted.slice(0, 3).map(([k]) => k);

  return {
    overallComment: pct >= 80
      ? "أداء رائع! أنت في مستوى ممتاز وعلى الطريق الصحيح للنجاح."
      : pct >= 60
      ? "أداء جيد مع وجود فرص للتحسين. تركيز أكبر على الأقسام الضعيفة سيرفع درجتك بشكل كبير."
      : "هناك فرصة كبيرة للتطور! مع التدريب المنتظم ستصل للمستوى المطلوب بإذن الله.",
    strengthsComment: pct >= 70 ? "إتقانك للجزء الصحيح يدل على فهم جيد للأساسيات." : "استمر في البناء على ما أتقنته حتى الآن.",
    weaknessesComment: topWeak.length ? `يحتاج ${topWeak.join(" و")} إلى مراجعة أعمق.` : "راجع الأقسام التي أخطأت فيها بعناية.",
    topWeakAreas: topWeak.length ? topWeak : ["راجع الأسئلة الخاطئة"],
    topStrengths: pct >= 70 ? ["الفهم العام", "الدقة في الحل"] : ["الاستمرارية في التدريب"],
    actionPlan: [
      "راجع كل سؤال أخطأت فيه وافهم سبب الخطأ",
      `ركّز على: ${topWeak.slice(0, 2).join(" و") || "الأقسام الضعيفة"}`,
      "حل 20 سؤال يومياً من الأقسام الضعيفة",
    ],
    encouragement: pct >= 80
      ? "ممتاز! أنت قريب جداً من القمة 🏆"
      : "كل خطأ هو درس. استمر وستصل للدرجة التي تحلم بها ⭐",
  };
}

export default function ResultsTeacherAnalysis({ wrongQuestions, totalQuestions, score, verbalScore, verbalTotal, quantitativeScore, quantitativeTotal }: Props) {
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(true);
  const [step, setStep] = useState(0);

  const steps = ["يراجع إجاباتك...", "يحلل نقاط القوة والضعف...", "يُعدّ التوصيات..."];

  useEffect(() => {
    let stepTimer: NodeJS.Timeout;
    let idx = 0;
    stepTimer = setInterval(() => {
      idx++;
      if (idx < steps.length) setStep(idx);
      else clearInterval(stepTimer);
    }, 900);

    const controller = new AbortController();
    (async () => {
      try {
        const res = await fetch("/api/ai/explain-mistakes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({ wrongQuestions, totalQuestions, score }),
        });
        if (!res.ok) throw new Error("API error");
        // This endpoint returns per-question explanations, not overall analysis
        // Build category analysis ourselves
        setAnalysis(buildFallback(score, totalQuestions, wrongQuestions));
      } catch {
        setAnalysis(buildFallback(score, totalQuestions, wrongQuestions));
      } finally {
        clearInterval(stepTimer);
        setLoading(false);
      }
    })();

    // Also call teacher analyze endpoint for richer analysis
    (async () => {
      try {
        const res = await fetch("/api/teacher/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            examType: "qudrat",
            questions: wrongQuestions.map(q => ({
              text: q.questionText,
              options: q.options,
              correctOptionIndex: q.correctAnswerIndex,
              category: q.category || "verbal",
              subcategory: q.subcategory,
            })),
            answers: Object.fromEntries(wrongQuestions.map((_, i) => [i, wrongQuestions[i].studentAnswerIndex])),
            timings: {},
          }),
        });
        if (!res.ok) return;
        const data = await res.json();
        const plan = data.plan;
        if (!plan) return;
        setAnalysis({
          overallComment: plan.summary || buildFallback(score, totalQuestions, wrongQuestions).overallComment,
          strengthsComment: plan.strengths?.join("، ") || "",
          weaknessesComment: plan.weaknesses?.join("، ") || "",
          topWeakAreas: plan.weaknesses || [],
          topStrengths: plan.strengths || [],
          actionPlan: plan.roadmap?.[0]?.tasks || [],
          encouragement: plan.encouragement || "",
        });
      } catch { /* use fallback */ }
    })();

    return () => { controller.abort(); clearInterval(stepTimer); };
  }, []);

  const pct = Math.round((score / totalQuestions) * 100);

  const gradeColor = pct >= 80 ? "text-emerald-400" : pct >= 60 ? "text-amber-400" : "text-red-400";
  const gradeLabel = pct >= 90 ? "ممتاز جداً" : pct >= 80 ? "ممتاز" : pct >= 70 ? "جيد جداً" : pct >= 60 ? "جيد" : pct >= 50 ? "مقبول" : "يحتاج مراجعة";

  return (
    <div className="rounded-2xl border border-green-500/30 bg-gradient-to-br from-green-500/5 via-emerald-500/5 to-teal-500/5 overflow-hidden" dir="rtl">
      {/* Header */}
      <button
        onClick={() => setExpanded(prev => !prev)}
        className="w-full flex items-center gap-3 p-4 text-right"
        data-testid="toggle-teacher-analysis"
      >
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-green-700 to-emerald-600 flex items-center justify-center flex-shrink-0 shadow-md">
          <GraduationCap className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-black text-foreground">تحليل المعلم</span>
            <span className="text-[10px] bg-green-500/20 text-green-500 border border-green-500/30 px-1.5 py-0.5 rounded-full font-semibold">مخصص</span>
          </div>
          <p className="text-[11px] text-muted-foreground">تحليل شامل لأدائك وتوصيات مخصصة</p>
        </div>
        <div className={cn("text-sm font-black", gradeColor)}>{pct}%</div>
        {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
      </button>

      {expanded && (
        <div className="border-t border-green-500/15 p-4 space-y-4">

          {/* Loading state */}
          {loading && (
            <div className="space-y-3 py-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-green-700 to-emerald-600 flex items-center justify-center animate-pulse">
                  <GraduationCap className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm text-muted-foreground">{steps[step]}</span>
              </div>
              <div className="space-y-2 pr-11">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-3 bg-muted/60 rounded-full animate-pulse" style={{ width: `${70 + i * 10}%`, animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          )}

          {/* Analysis content */}
          {!loading && analysis && (
            <>
              {/* Grade badge */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 border border-border">
                <div className={cn("text-2xl font-black", gradeColor)}>{pct}%</div>
                <div>
                  <p className={cn("text-sm font-bold", gradeColor)}>{gradeLabel}</p>
                  <p className="text-xs text-muted-foreground">{score} إجابة صحيحة من {totalQuestions}</p>
                </div>
                <div className="flex-1 text-left">
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all duration-1000", pct >= 70 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-500" : "bg-red-500")}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Overall comment */}
              <div className="flex items-start gap-3 p-3 rounded-xl bg-green-500/5 border border-green-500/15">
                <Sparkles className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-foreground leading-relaxed">{analysis.overallComment}</p>
              </div>

              {/* Strengths + Weaknesses */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 space-y-2">
                  <div className="flex items-center gap-1.5 text-emerald-400">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span className="text-[11px] font-bold">نقاط القوة</span>
                  </div>
                  <ul className="space-y-1">
                    {(analysis.topStrengths.length ? analysis.topStrengths : ["استمر في التدريب"]).slice(0, 3).map((s, i) => (
                      <li key={i} className="text-[11px] text-foreground flex items-start gap-1">
                        <CheckCircle className="w-3 h-3 text-emerald-400 flex-shrink-0 mt-0.5" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3 space-y-2">
                  <div className="flex items-center gap-1.5 text-red-400">
                    <TrendingDown className="w-3.5 h-3.5" />
                    <span className="text-[11px] font-bold">تحتاج مراجعة</span>
                  </div>
                  <ul className="space-y-1">
                    {(analysis.topWeakAreas.length ? analysis.topWeakAreas : ["راجع الأخطاء"]).slice(0, 3).map((w, i) => (
                      <li key={i} className="text-[11px] text-foreground flex items-start gap-1">
                        <AlertCircle className="w-3 h-3 text-red-400 flex-shrink-0 mt-0.5" />
                        {w}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Action plan */}
              {analysis.actionPlan.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-amber-400">
                    <Target className="w-3.5 h-3.5" />
                    <span className="text-xs font-bold text-foreground">خطة العمل القادمة</span>
                  </div>
                  <div className="space-y-1.5">
                    {analysis.actionPlan.slice(0, 3).map((step, i) => (
                      <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/15">
                        <div className="w-5 h-5 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center flex-shrink-0 text-[10px] font-black text-amber-400">{i + 1}</div>
                        <p className="text-xs text-foreground leading-relaxed">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Encouragement */}
              {analysis.encouragement && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
                  <Star className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <p className="text-xs text-foreground font-medium italic">{analysis.encouragement}</p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
