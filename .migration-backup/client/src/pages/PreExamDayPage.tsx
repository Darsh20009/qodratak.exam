import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { QiyasExamLayout } from "@/components/QiyasExamLayout";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  Clock, BookOpen, Brain, Zap, CheckCircle2, XCircle,
  ChevronRight, BarChart3, Trophy, Target, AlertTriangle,
  RefreshCw, ArrowLeft, Star, TrendingUp, Flame
} from "lucide-react";

const TOTAL_TIME = 120 * 60; // 2 hours in seconds
const OPTION_LABELS = ["أ", "ب", "ج", "د"];

interface Question {
  _id: string;
  id: string | number;
  text: string;
  options: string[];
  correctOptionIndex: number;
  category: string;
  subcategory: string;
  difficulty: string;
  imageUrl?: string | null;
}

interface SessionMeta {
  total: number;
  verbal: number;
  quantitative: number;
  timeLimitSeconds: number;
  subcategoryDistribution: Record<string, number>;
}

type Phase = "intro" | "exam" | "confirm_submit" | "results";

function formatTime(sec: number) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2,"0")}:${s.toString().padStart(2,"0")}`;
  return `${m.toString().padStart(2,"0")}:${s.toString().padStart(2,"0")}`;
}

function getUser() {
  try { return JSON.parse(localStorage.getItem("user") || "{}"); } catch { return {}; }
}

// ── Intro Screen ─────────────────────────────────────────────────────────────
function IntroScreen({ meta, onStart, loading }: { meta?: SessionMeta; loading: boolean; onStart: () => void }) {
  const tips = [
    "نم مبكراً الليلة ولا تسهر للدراسة",
    "راجع الأنواع التي تضعف فيها فقط",
    "لا تحفظ معلومات جديدة — ركّز على التثبيت",
    "جهّز وجبتك وشرابك قبل الاختبار",
    "اقرأ كل سؤال مرتين قبل الإجابة",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center p-4" dir="rtl">
      <div className="max-w-lg w-full">
        {/* Header badge */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full px-4 py-1.5 text-sm font-semibold mb-4">
            <Flame className="w-4 h-4" />
            جلسة ما قبل الاختبار
          </div>
          <h1 className="text-3xl font-black text-white mb-2">
            أهم 100 سؤال
          </h1>
          <p className="text-slate-400 text-sm">
            بناءً على تحليل 36 نموذج قياس سابق — الأسئلة الأكثر ترجيحاً للظهور
          </p>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { icon: BookOpen, label: "لفظي", value: loading ? "—" : `${meta?.verbal ?? 50}`, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
            { icon: Brain, label: "كمي", value: loading ? "—" : `${meta?.quantitative ?? 50}`, color: "text-green-700", bg: "bg-green-100/10 border-green-400/20" },
            { icon: Clock, label: "الوقت", value: "ساعتان", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
          ].map((s, i) => (
            <div key={i} className={`${s.bg} border rounded-2xl p-3 text-center`}>
              <s.icon className={`w-5 h-5 ${s.color} mx-auto mb-1`} />
              <div className={`text-xl font-black ${s.color}`}>{s.value}</div>
              <div className="text-slate-400 text-[11px]">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tips */}
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5 mb-6">
          <h3 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-400" />
            نصائح ليلة الاختبار
          </h3>
          <ul className="space-y-2">
            {tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2.5 text-slate-300 text-sm">
                <span className="w-5 h-5 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  {i + 1}
                </span>
                {tip}
              </li>
            ))}
          </ul>
        </div>

        {/* Distribution preview */}
        {meta && (
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4 mb-6">
            <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-green-400" />
              توزيع الأسئلة
            </h3>
            <div className="flex flex-col gap-1.5">
              {Object.entries(meta.subcategoryDistribution)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 6)
                .map(([sub, count]) => (
                  <div key={sub} className="flex items-center gap-2">
                    <span className="text-slate-400 text-xs w-36 truncate">{sub}</span>
                    <div className="flex-1 bg-slate-700 rounded-full h-1.5">
                      <div
                        className="bg-green-500 h-1.5 rounded-full"
                        style={{ width: `${(count / meta.total) * 100}%` }}
                      />
                    </div>
                    <span className="text-slate-300 text-xs w-5 text-right">{count}</span>
                  </div>
                ))}
            </div>
          </div>
        )}

        <button
          onClick={onStart}
          disabled={loading}
          className="w-full py-4 bg-gradient-to-l from-green-600 to-emerald-500 text-white rounded-2xl font-black text-lg shadow-lg shadow-green-900/30 hover:from-green-500 hover:to-emerald-400 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
          data-testid="btn-start-session"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              جاري التحضير...
            </>
          ) : (
            <>
              <Zap className="w-5 h-5" />
              ابدأ الجلسة المكثفة
            </>
          )}
        </button>
        <p className="text-center text-slate-500 text-xs mt-3">
          100 سؤال · ساعتان كاملتان · بدون توقف
        </p>
      </div>
    </div>
  );
}

// ── Results Screen ────────────────────────────────────────────────────────────
function ResultsScreen({
  questions, answers, timeSpent, onRetry
}: {
  questions: Question[];
  answers: (number | null)[];
  timeSpent: number;
  onRetry: () => void;
}) {
  const [, navigate] = useLocation();

  const correct = answers.filter((a, i) => a === questions[i]?.correctOptionIndex).length;
  const answered = answers.filter(a => a !== null).length;
  const score = Math.round((correct / questions.length) * 100);

  const verbalQs = questions.filter(q => q.category === "verbal");
  const quantQs = questions.filter(q => q.category === "quantitative");
  const verbalCorrect = verbalQs.filter((q, i) => {
    const globalIdx = questions.indexOf(q);
    return answers[globalIdx] === q.correctOptionIndex;
  }).length;
  const quantCorrect = quantQs.filter((q, i) => {
    const globalIdx = questions.indexOf(q);
    return answers[globalIdx] === q.correctOptionIndex;
  }).length;

  const verbalPct = Math.round((verbalCorrect / (verbalQs.length || 1)) * 100);
  const quantPct = Math.round((quantCorrect / (quantQs.length || 1)) * 100);

  // Subcategory breakdown
  const subcatStats: Record<string, { correct: number; total: number }> = {};
  questions.forEach((q, i) => {
    const sub = q.subcategory || "عام";
    if (!subcatStats[sub]) subcatStats[sub] = { correct: 0, total: 0 };
    subcatStats[sub].total++;
    if (answers[i] === q.correctOptionIndex) subcatStats[sub].correct++;
  });

  const sorted = Object.entries(subcatStats).sort((a, b) => {
    const aPct = a[1].correct / a[1].total;
    const bPct = b[1].correct / b[1].total;
    return bPct - aPct;
  });
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];

  const grade = score >= 90 ? { label: "ممتاز 🏆", color: "text-yellow-400" }
    : score >= 80 ? { label: "جيد جداً ⭐", color: "text-green-400" }
    : score >= 70 ? { label: "جيد 👍", color: "text-blue-400" }
    : score >= 60 ? { label: "مقبول 📈", color: "text-amber-400" }
    : { label: "تحتاج مراجعة 💪", color: "text-red-400" };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 p-4 pb-20" dir="rtl">
      <div className="max-w-lg mx-auto">
        {/* Score hero */}
        <div className="text-center py-8">
          <div className="w-32 h-32 rounded-full border-4 border-green-500/40 bg-green-500/10 flex flex-col items-center justify-center mx-auto mb-4 shadow-lg shadow-green-900/20">
            <span className="text-4xl font-black text-white">{score}%</span>
            <span className="text-slate-400 text-xs">{correct}/{questions.length}</span>
          </div>
          <h2 className={`text-2xl font-black ${grade.color} mb-1`}>{grade.label}</h2>
          <p className="text-slate-400 text-sm">
            أجبت على {answered} من {questions.length} · {formatTime(timeSpent)} ⏱
          </p>
        </div>

        {/* Verbal vs Quant */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {[
            { label: "اللفظي", pct: verbalPct, correct: verbalCorrect, total: verbalQs.length, color: "bg-blue-500", borderColor: "border-blue-500/30", textColor: "text-blue-400" },
            { label: "الكمي", pct: quantPct, correct: quantCorrect, total: quantQs.length, color: "bg-green-100", borderColor: "border-green-400/30", textColor: "text-green-700" },
          ].map((cat, i) => (
            <div key={i} className={`bg-slate-800/60 border ${cat.borderColor} rounded-2xl p-4 text-center`}>
              <div className={`text-2xl font-black ${cat.textColor} mb-1`}>{cat.pct}%</div>
              <div className="text-slate-400 text-xs mb-2">{cat.correct}/{cat.total} صحيحة</div>
              <div className="w-full bg-slate-700 rounded-full h-1.5">
                <div className={`${cat.color} h-1.5 rounded-full transition-all`} style={{ width: `${cat.pct}%` }} />
              </div>
              <div className="text-slate-300 text-sm font-semibold mt-1.5">{cat.label}</div>
            </div>
          ))}
        </div>

        {/* Best & Worst */}
        {best && worst && best[0] !== worst[0] && (
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <TrendingUp className="w-3.5 h-3.5 text-green-400" />
                <span className="text-green-400 text-xs font-semibold">الأقوى</span>
              </div>
              <div className="text-white text-sm font-bold truncate">{best[0]}</div>
              <div className="text-green-400 text-xs">{Math.round((best[1].correct / best[1].total) * 100)}%</div>
            </div>
            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Target className="w-3.5 h-3.5 text-red-400" />
                <span className="text-red-400 text-xs font-semibold">يحتاج تركيز</span>
              </div>
              <div className="text-white text-sm font-bold truncate">{worst[0]}</div>
              <div className="text-red-400 text-xs">{Math.round((worst[1].correct / worst[1].total) * 100)}%</div>
            </div>
          </div>
        )}

        {/* Subcategory table */}
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden mb-6">
          <div className="p-4 border-b border-slate-700/50">
            <h3 className="text-white font-bold text-sm flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-green-400" />
              تفاصيل حسب النوع
            </h3>
          </div>
          <div className="divide-y divide-slate-700/30">
            {sorted.map(([sub, stat]) => {
              const pct = Math.round((stat.correct / stat.total) * 100);
              return (
                <div key={sub} className="flex items-center gap-3 px-4 py-2.5">
                  <div className="flex-1 min-w-0">
                    <div className="text-slate-200 text-sm truncate">{sub}</div>
                  </div>
                  <div className="w-20 bg-slate-700 rounded-full h-1.5">
                    <div
                      className={cn("h-1.5 rounded-full", pct >= 70 ? "bg-green-500" : pct >= 50 ? "bg-amber-500" : "bg-red-500")}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="text-slate-300 text-xs w-12 text-left">{stat.correct}/{stat.total}</div>
                  <div className={cn("text-xs font-bold w-9 text-right", pct >= 70 ? "text-green-400" : pct >= 50 ? "text-amber-400" : "text-red-400")}>
                    {pct}%
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Motivational message */}
        <div className="bg-slate-800/60 border border-green-500/20 rounded-2xl p-4 mb-6 text-center">
          <p className="text-slate-300 text-sm">
            {score >= 80
              ? "🔥 أداء رائع! أنت مستعد. ثق بنفسك غداً ونم مبكراً."
              : score >= 65
              ? "⭐ أداء جيد. راجع الأقسام الحمراء قبل النوم وستكون بخير."
              : "💪 لا تحبط! هذه المراجعة كشفت لك نقاط الضعف بالضبط. راجعها الآن."}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <button
            onClick={onRetry}
            className="flex-1 flex items-center justify-center gap-2 py-3 border border-slate-600 text-slate-300 rounded-xl font-semibold hover:bg-slate-700 transition-colors"
            data-testid="btn-retry"
          >
            <RefreshCw className="w-4 h-4" />
            جلسة جديدة
          </button>
          <button
            onClick={() => navigate("/")}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors"
            data-testid="btn-home"
          >
            الرئيسية
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function PreExamDayPage() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [meta, setMeta] = useState<SessionMeta | undefined>();
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [bookmarks, setBookmarks] = useState<boolean[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  const [timeSpent, setTimeSpent] = useState(0);
  const [sessionStarted, setSessionStarted] = useState(false);
  const { toast } = useToast();
  const user = getUser();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["/api/pre-exam-session"],
    queryFn: async () => {
      const res = await fetch("/api/pre-exam-session");
      if (!res.ok) throw new Error("فشل تحميل الجلسة");
      return res.json();
    },
    staleTime: 0,
  });

  useEffect(() => {
    if (data?.questions) {
      setQuestions(data.questions);
      setMeta(data.meta);
      setAnswers(new Array(data.questions.length).fill(null));
      setBookmarks(new Array(data.questions.length).fill(false));
    }
  }, [data]);

  // Timer
  useEffect(() => {
    if (phase !== "exam") return;
    const id = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(id);
          handleAutoSubmit();
          return 0;
        }
        return t - 1;
      });
      setTimeSpent(s => s + 1);
    }, 1000);
    return () => clearInterval(id);
  }, [phase]);

  const handleAutoSubmit = () => {
    toast({ description: "⏰ انتهى الوقت! جاري حساب نتائجك..." });
    setPhase("results");
  };

  const handleStart = () => {
    if (!questions.length) { toast({ description: "الأسئلة لم تُحمّل بعد", variant: "destructive" }); return; }
    setTimeLeft(TOTAL_TIME);
    setTimeSpent(0);
    setCurrentQ(0);
    setAnswers(new Array(questions.length).fill(null));
    setBookmarks(new Array(questions.length).fill(false));
    setPhase("exam");
  };

  const handleSelectAnswer = (idx: number) => {
    setAnswers(prev => { const n = [...prev]; n[currentQ] = idx; return n; });
  };

  const handleBookmark = () => {
    setBookmarks(prev => { const n = [...prev]; n[currentQ] = !n[currentQ]; return n; });
  };

  const handleSubmit = () => {
    const unanswered = answers.filter(a => a === null).length;
    if (unanswered > 0) {
      setPhase("confirm_submit");
    } else {
      setPhase("results");
    }
  };

  const handleRetry = () => {
    refetch();
    setPhase("intro");
    setCurrentQ(0);
    setTimeLeft(TOTAL_TIME);
    setTimeSpent(0);
  };

  const questionsStatus = questions.map((_, i) => ({
    answered: answers[i] !== null,
    bookmarked: bookmarks[i] || false,
  }));

  const q = questions[currentQ];
  const answeredCount = answers.filter(a => a !== null).length;
  const isUrgent = timeLeft < 30 * 60; // < 30 min

  if (phase === "intro") {
    return <IntroScreen meta={meta} loading={isLoading} onStart={handleStart} />;
  }

  if (phase === "results") {
    return (
      <ResultsScreen
        questions={questions}
        answers={answers}
        timeSpent={timeSpent}
        onRetry={handleRetry}
      />
    );
  }

  if (phase === "confirm_submit") {
    const unanswered = answers.filter(a => a === null).length;
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4" dir="rtl">
        <div className="max-w-sm w-full bg-slate-800 rounded-2xl border border-slate-700 p-6 text-center shadow-2xl">
          <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
          <h2 className="text-white text-xl font-bold mb-2">تأكيد التسليم</h2>
          <p className="text-slate-400 text-sm mb-1">لديك <span className="text-amber-400 font-bold">{unanswered} سؤال</span> لم تُجبه بعد</p>
          <p className="text-slate-500 text-xs mb-6">هل أنت متأكد أنك تريد التسليم الآن؟</p>
          <div className="flex gap-3">
            <button
              onClick={() => setPhase("exam")}
              className="flex-1 py-2.5 border border-slate-600 text-slate-300 rounded-xl text-sm font-semibold hover:bg-slate-700 transition-colors"
              data-testid="btn-back-to-exam"
            >
              العودة للمراجعة
            </button>
            <button
              onClick={() => setPhase("results")}
              className="flex-1 py-2.5 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 transition-colors"
              data-testid="btn-confirm-submit"
            >
              تسليم
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!q) return null;

  return (
    <QiyasExamLayout
      examTitle="جلسة ما قبل الاختبار"
      questionNumber={currentQ + 1}
      totalQuestions={questions.length}
      sectionLabel={q.category === "verbal" ? "لفظي" : "كمي"}
      timeLeft={timeLeft}
      isTimeUrgent={isUrgent}
      questionText={q.text}
      questionImageUrl={q.imageUrl || undefined}
      options={q.options}
      selectedAnswer={answers[currentQ]}
      onSelectAnswer={handleSelectAnswer}
      questionsStatus={questionsStatus}
      currentQuestionIndex={currentQ}
      onJumpToQuestion={setCurrentQ}
      isBookmarked={bookmarks[currentQ]}
      onToggleBookmark={handleBookmark}
      onPrev={() => setCurrentQ(i => Math.max(0, i - 1))}
      onNext={() => setCurrentQ(i => Math.min(questions.length - 1, i + 1))}
      onFinish={handleSubmit}
      canGoPrev={currentQ > 0}
      canGoNext={currentQ < questions.length - 1}
      isLastQuestion={currentQ === questions.length - 1}
      answeredCount={answeredCount}
      userName={user?.username || user?.name}
      topRightSlot={
        <div className="flex items-center gap-1.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full px-3 py-1 text-xs font-semibold">
          <Flame className="w-3.5 h-3.5" />
          قبل الاختبار بيوم
        </div>
      }
    />
  );
}
