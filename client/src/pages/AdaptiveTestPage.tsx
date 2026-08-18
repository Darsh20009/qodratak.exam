import { useState, useEffect, useCallback, useRef } from "react";
import ImageZoom from "@/components/ImageZoom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  ChevronRight, Brain, Zap, TrendingUp, TrendingDown,
  CheckCircle2, XCircle, Target, Flame, Trophy, RotateCcw,
  ArrowRight, Sparkles, BarChart3, AlertTriangle, Layers,
  BookOpen
} from "lucide-react";

interface Question {
  id: number;
  questionId: number;
  text: string;
  options: string[];
  correctOptionIndex: number;
  category: string;
  subcategory: string;
  difficulty: string;
  explanation?: string;
  imageUrl?: string;
}

interface NextQuestionResponse {
  question: Question | null;
  subcategory: string;
  currentAbility: number;
  targetDifficulty: string;
}

interface SubmitResponse {
  ability: number;
  abilityPct: number;
  difficulty: string;
}

interface SessionAnswer {
  questionId: number;
  subcategory: string;
  category: string;
  difficulty: string;
  correct: boolean;
  abilityAfter: number;
}

const DIFFICULTY_LABEL: Record<string, string> = {
  beginner: "سهل",
  intermediate: "متوسط",
  advanced: "صعب",
};

const DIFFICULTY_COLOR: Record<string, string> = {
  beginner: "#16a34a",
  intermediate: "#d97706",
  advanced: "#dc2626",
};

const SESSION_TOTAL = 20;

type Stage = "select" | "testing" | "answer-reveal" | "done";

function AbilityMeter({ pct, label }: { pct: number; label: string }) {
  const color = pct >= 70 ? "#16a34a" : pct >= 40 ? "#d97706" : "#dc2626";
  return (
    <div className="flex items-center gap-2 min-w-0">
      <span className="text-xs text-gray-400 flex-shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-xs font-bold flex-shrink-0" style={{ color }}>{pct}%</span>
    </div>
  );
}

function CategorySelect({ onSelect }: { onSelect: (cat: string) => void }) {
  return (
    <div className="flex flex-col items-center gap-6 py-8">
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-200 dark:shadow-green-900">
          <Brain className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-xl font-black text-gray-900 dark:text-white">الاختبار التكيفي الذكي</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-xs mx-auto">
          الخوارزمية تتتبع نقاط ضعفك تلقائياً وتركز عليها — تحسّن ملحوظ في وقت قياسي
        </p>
      </div>

      <div className="w-full space-y-3 max-w-xs">
        {[
          { key: "verbal", label: "القسم اللفظي", desc: "التناظر، إكمال الجمل، الاستيعاب، المفردات", icon: BookOpen, from: "from-blue-500", to: "to-cyan-500" },
          { key: "quantitative", label: "القسم الكمي", desc: "المعادلات، الهندسة، النسب، الإحصاء", icon: BarChart3, from: "from-green-500", to: "to-emerald-500" },
          { key: "all", label: "مختلط (الأفضل!)", desc: "يشمل اللفظي والكمي معاً", icon: Sparkles, from: "from-green-500", to: "to-emerald-500" },
        ].map(cat => (
          <button
            key={cat.key}
            onClick={() => onSelect(cat.key)}
            data-testid={`btn-select-${cat.key}`}
            className="w-full bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 flex items-center gap-4 hover:border-green-300 dark:hover:border-green-700 hover:shadow-sm transition-all group text-right"
          >
            <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center bg-gradient-to-br flex-shrink-0 shadow-sm", cat.from, cat.to)}>
              <cat.icon className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-900 dark:text-white text-sm">{cat.label}</p>
              <p className="text-xs text-gray-400 truncate">{cat.desc}</p>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-green-500 transition-colors flex-shrink-0 rotate-180" />
          </button>
        ))}
      </div>

      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-2xl p-4 max-w-xs w-full">
        <div className="flex items-start gap-2">
          <Zap className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700 dark:text-amber-300">
            كل جلسة تحتوي على <strong>{SESSION_TOTAL} سؤالاً</strong>. الخوارزمية تتذكر مستواك عبر الجلسات وتتحسن تدريجياً.
          </p>
        </div>
      </div>
    </div>
  );
}

function SessionSummary({
  answers,
  onRestart,
}: {
  answers: SessionAnswer[];
  onRestart: () => void;
}) {
  const correct = answers.filter(a => a.correct).length;
  const pct = Math.round((correct / answers.length) * 100);

  // Group by subcategory
  const bySub: Record<string, { correct: number; total: number; abilityFinal: number }> = {};
  for (const a of answers) {
    if (!bySub[a.subcategory]) bySub[a.subcategory] = { correct: 0, total: 0, abilityFinal: 0 };
    bySub[a.subcategory].total++;
    if (a.correct) bySub[a.subcategory].correct++;
    bySub[a.subcategory].abilityFinal = a.abilityAfter;
  }

  const subcatSummary = Object.entries(bySub)
    .map(([name, d]) => ({ name, pct: Math.round((d.correct / d.total) * 100), total: d.total, correct: d.correct, abilityFinal: d.abilityFinal }))
    .sort((a, b) => a.pct - b.pct);

  const excellent = pct >= 80;
  const good = pct >= 60;

  return (
    <div className="flex flex-col gap-5 py-4">
      {/* Score */}
      <div className="flex flex-col items-center gap-2 text-center">
        <div className={cn(
          "w-20 h-20 rounded-full flex items-center justify-center text-3xl shadow-lg",
          excellent ? "bg-gradient-to-br from-green-500 to-emerald-600" :
          good ? "bg-gradient-to-br from-amber-500 to-orange-500" :
          "bg-gradient-to-br from-red-500 to-rose-600"
        )}>
          {excellent ? "🏆" : good ? "💪" : "🎯"}
        </div>
        <h2 className="text-xl font-black text-gray-900 dark:text-white">
          {excellent ? "أداء ممتاز!" : good ? "جيد جداً!" : "استمر في التدريب!"}
        </h2>
        <p className="text-gray-400 text-sm">{correct} صواب من أصل {answers.length} سؤال</p>
      </div>

      {/* Big score */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 flex items-center justify-between">
        <div className="text-center flex-1">
          <p className="text-3xl font-black text-gray-900 dark:text-white">{pct}%</p>
          <p className="text-xs text-gray-400">دقة الإجابات</p>
        </div>
        <div className="w-px h-10 bg-gray-100 dark:bg-gray-800" />
        <div className="text-center flex-1">
          <p className="text-3xl font-black text-green-600">{correct}</p>
          <p className="text-xs text-gray-400">صحيح</p>
        </div>
        <div className="w-px h-10 bg-gray-100 dark:bg-gray-800" />
        <div className="text-center flex-1">
          <p className="text-3xl font-black text-red-500">{answers.length - correct}</p>
          <p className="text-xs text-gray-400">خطأ</p>
        </div>
      </div>

      {/* Subcategory breakdown */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
        <h3 className="font-bold text-sm text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-green-500" />
          الأداء حسب التصنيف
        </h3>
        <div className="space-y-3">
          {subcatSummary.map(sub => (
            <div key={sub.name}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-gray-600 dark:text-gray-400 font-medium">{sub.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">{sub.correct}/{sub.total}</span>
                  <span className="font-bold" style={{ color: sub.pct >= 70 ? "#16a34a" : sub.pct >= 50 ? "#d97706" : "#dc2626" }}>
                    {sub.pct}%
                  </span>
                </div>
              </div>
              <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${sub.pct}%`,
                    backgroundColor: sub.pct >= 70 ? "#16a34a" : sub.pct >= 50 ? "#d97706" : "#dc2626",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Weak areas highlight */}
      {subcatSummary.some(s => s.pct < 60) && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-bold text-amber-700 dark:text-amber-300">يُنصح بمراجعة:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {subcatSummary.filter(s => s.pct < 60).map(s => (
              <span key={s.name} className="text-xs bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 px-2.5 py-1 rounded-full font-medium">
                {s.name}
              </span>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={onRestart}
        data-testid="btn-restart-adaptive"
        className="w-full py-3.5 rounded-2xl bg-green-600 text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-green-700 transition-colors shadow-sm shadow-green-200 dark:shadow-green-900"
      >
        <RotateCcw className="w-4 h-4" />
        جلسة جديدة
      </button>
    </div>
  );
}

export default function AdaptiveTestPage() {
  const [, navigate] = useLocation();
  const [stage, setStage] = useState<Stage>("select");
  const [category, setCategory] = useState<string>("all");
  const [currentQ, setCurrentQ] = useState<NextQuestionResponse | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [sessionAnswers, setSessionAnswers] = useState<SessionAnswer[]>([]);
  const [currentAbilityPct, setCurrentAbilityPct] = useState<number>(50);
  const [currentDiff, setCurrentDiff] = useState<string>("intermediate");
  const [abilityDelta, setAbilityDelta] = useState<"up" | "down" | null>(null);
  const [feedback, setFeedback] = useState<{ correct: boolean; explanation?: string } | null>(null);
  const [loadingNext, setLoadingNext] = useState(false);

  const seenIds = sessionAnswers.map(a => a.questionId);
  const questionCount = sessionAnswers.length;
  const isLastQuestion = questionCount >= SESSION_TOTAL - 1;

  const fetchNextMutation = useMutation({
    mutationFn: (data: { category: string; seenIds: number[] }) =>
      apiRequest("POST", "/api/adaptive/next", data).then(r => r.json()),
    onSuccess: (data: NextQuestionResponse) => {
      setCurrentQ(data);
      setSelectedOption(null);
      setFeedback(null);
      setLoadingNext(false);
      if (data) {
        setCurrentAbilityPct(data.currentAbility);
        setCurrentDiff(data.targetDifficulty);
      }
    },
    onError: () => setLoadingNext(false),
  });

  const submitMutation = useMutation({
    mutationFn: (data: { subcategory: string; category: string; correct: boolean }) =>
      apiRequest("POST", "/api/adaptive/submit", data).then(r => r.json()),
    onSuccess: (data: SubmitResponse) => {
      const prev = currentAbilityPct;
      setCurrentAbilityPct(data.abilityPct);
      setCurrentDiff(data.difficulty);
      setAbilityDelta(data.abilityPct > prev ? "up" : "down");
      setTimeout(() => setAbilityDelta(null), 2000);
    },
  });

  const startSession = (cat: string) => {
    setCategory(cat);
    setSessionAnswers([]);
    setCurrentQ(null);
    setStage("testing");
    setCurrentAbilityPct(50);
    setCurrentDiff("intermediate");
    setLoadingNext(true);
    fetchNextMutation.mutate({ category: cat, seenIds: [] });
  };

  const handleOptionSelect = (idx: number) => {
    if (selectedOption !== null || !currentQ?.question) return;
    setSelectedOption(idx);
    const correct = idx === currentQ.question.correctOptionIndex;

    setFeedback({ correct, explanation: currentQ.question.explanation });
    setStage("answer-reveal");

    const answer: SessionAnswer = {
      questionId: currentQ.question.questionId || currentQ.question.id,
      subcategory: currentQ.subcategory,
      category: currentQ.question.category,
      difficulty: currentQ.question.difficulty,
      correct,
      abilityAfter: currentAbilityPct / 100 * 4 - 2,
    };
    setSessionAnswers(prev => [...prev, answer]);

    submitMutation.mutate({
      subcategory: currentQ.subcategory,
      category: currentQ.question.category,
      correct,
    });

    // Log error (fire-and-forget) for error analysis
    if (!correct) {
      apiRequest("POST", "/api/questions/log-error", {
        questionId: currentQ.question.questionId || currentQ.question.id,
        questionText: currentQ.question.text?.slice(0, 150) || "",
        subcategory: currentQ.subcategory,
        category: currentQ.question.category,
        difficulty: currentQ.question.difficulty,
        selectedOptionIndex: idx,
        selectedOptionText: currentQ.question.options[idx] || "",
        correctOptionIndex: currentQ.question.correctOptionIndex,
        correctOptionText: currentQ.question.options[currentQ.question.correctOptionIndex] || "",
        source: "adaptive",
      }).catch(() => {});
    }

    if (questionCount + 1 >= SESSION_TOTAL) {
      setTimeout(() => { setStage("done"); }, 1800);
    }
  };

  const handleNextQuestion = () => {
    if (questionCount + 1 >= SESSION_TOTAL) {
      setStage("done");
      return;
    }
    setLoadingNext(true);
    setStage("testing");
    const newSeenIds = [...seenIds, ...(currentQ?.question ? [currentQ.question.questionId || currentQ.question.id] : [])];
    fetchNextMutation.mutate({ category, seenIds: newSeenIds });
  };

  const progress = Math.round((questionCount / SESSION_TOTAL) * 100);
  const question = currentQ?.question;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-24" dir="rtl">
      {/* Top bar */}
      <div className="sticky top-0 z-20 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-4 py-3">
        <div className="flex items-center gap-3 mb-2">
          <Link href="/">
            <button className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-400">
              <ChevronRight className="w-5 h-5" />
            </button>
          </Link>
          <div className="flex-1">
            <h1 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Brain className="w-4 h-4 text-green-600" />
              الاختبار التكيفي
            </h1>
            {stage !== "select" && stage !== "done" && (
              <p className="text-xs text-gray-400">
                سؤال {questionCount + (stage === "answer-reveal" ? 0 : 1)} من {SESSION_TOTAL}
              </p>
            )}
          </div>
          {/* Difficulty badge */}
          {stage !== "select" && stage !== "done" && (
            <div className="flex items-center gap-1">
              {abilityDelta === "up" && (
                <span className="text-xs text-green-600 font-bold flex items-center gap-0.5 animate-bounce">
                  <TrendingUp className="w-3.5 h-3.5" /> يرتفع!
                </span>
              )}
              {abilityDelta === "down" && (
                <span className="text-xs text-red-500 font-bold flex items-center gap-0.5">
                  <TrendingDown className="w-3.5 h-3.5" /> ينخفض
                </span>
              )}
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: `${DIFFICULTY_COLOR[currentDiff]}18`,
                  color: DIFFICULTY_COLOR[currentDiff],
                }}
              >
                {DIFFICULTY_LABEL[currentDiff]}
              </span>
            </div>
          )}
        </div>

        {/* Progress bar */}
        {stage !== "select" && stage !== "done" && (
          <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>

      <div className="max-w-lg mx-auto px-4 pt-4">
        {stage === "select" && (
          <CategorySelect onSelect={startSession} />
        )}

        {stage === "done" && (
          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
            <SessionSummary
              answers={sessionAnswers}
              onRestart={() => setStage("select")}
            />
          </div>
        )}

        {(stage === "testing" || stage === "answer-reveal") && (
          <div className="flex flex-col gap-4">
            {/* Live ability meter */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 px-4 py-3">
              <AbilityMeter pct={currentAbilityPct} label="مستوى تكيفي" />
            </div>

            {/* Question card */}
            {loadingNext ? (
              <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-8 flex flex-col items-center gap-4">
                <div className="w-10 h-10 rounded-full border-4 border-green-500 border-t-transparent animate-spin" />
                <p className="text-sm text-gray-400">الخوارزمية تختار السؤال المناسب لك...</p>
              </div>
            ) : question ? (
              <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
                {/* Question header */}
                <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-gray-50 dark:border-gray-800">
                  <span className="text-xs text-gray-400">{question.subcategory}</span>
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: `${DIFFICULTY_COLOR[question.difficulty]}18`,
                      color: DIFFICULTY_COLOR[question.difficulty],
                    }}
                  >
                    {DIFFICULTY_LABEL[question.difficulty] || question.difficulty}
                  </span>
                </div>

                {/* Question text */}
                <div className="px-5 py-5">
                  {question.imageUrl && (
                    <div className="flex justify-center mb-4">
                      <ImageZoom src={question.imageUrl} imgClassName="max-h-32 rounded-xl object-contain w-full" />
                    </div>
                  )}
                  <p className="text-base font-bold text-gray-900 dark:text-white leading-relaxed" dir="rtl">
                    {question.text}
                  </p>
                </div>

                {/* Options */}
                <div className="px-4 pb-5 space-y-2.5">
                  {question.options.map((opt, idx) => {
                    const isSelected = selectedOption === idx;
                    const isCorrect = idx === question.correctOptionIndex;
                    const revealed = stage === "answer-reveal";

                    let cls = "w-full text-right px-4 py-3 rounded-2xl border-2 font-medium text-sm transition-all";
                    if (revealed) {
                      if (isCorrect) cls += " bg-green-50 dark:bg-green-900/20 border-green-400 dark:border-green-600 text-green-700 dark:text-green-300";
                      else if (isSelected && !isCorrect) cls += " bg-red-50 dark:bg-red-900/20 border-red-400 dark:border-red-600 text-red-600 dark:text-red-400";
                      else cls += " bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-400";
                    } else {
                      cls += " bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 hover:border-green-300 dark:hover:border-green-700 hover:bg-green-50 dark:hover:bg-green-900/20 active:scale-[0.98] cursor-pointer";
                    }

                    const label = ["أ", "ب", "ج", "د"][idx] || String(idx + 1);
                    return (
                      <button
                        key={idx}
                        onClick={() => handleOptionSelect(idx)}
                        disabled={stage === "answer-reveal"}
                        data-testid={`option-${idx}`}
                        className={cls}
                        dir="rtl"
                      >
                        <span className="flex items-center gap-3">
                          <span className={cn(
                            "w-6 h-6 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0",
                            revealed && isCorrect ? "bg-green-500 text-white" :
                            revealed && isSelected && !isCorrect ? "bg-red-500 text-white" :
                            "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                          )}>
                            {revealed && isCorrect ? <CheckCircle2 className="w-3.5 h-3.5" /> :
                             revealed && isSelected && !isCorrect ? <XCircle className="w-3.5 h-3.5" /> :
                             label}
                          </span>
                          <span className="flex-1 text-right">{opt}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {/* Feedback + Next button */}
            {stage === "answer-reveal" && feedback && (
              <div className={cn(
                "rounded-2xl px-4 py-3 border",
                feedback.correct
                  ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                  : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
              )}>
                <div className="flex items-center gap-2 mb-1">
                  {feedback.correct ? (
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500" />
                  )}
                  <span className={cn("font-bold text-sm", feedback.correct ? "text-green-700 dark:text-green-300" : "text-red-600 dark:text-red-400")}>
                    {feedback.correct ? "إجابة صحيحة! 🎉" : "إجابة خاطئة"}
                  </span>
                </div>
                {feedback.explanation && (
                  <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed mt-1" dir="rtl">
                    {feedback.explanation}
                  </p>
                )}
                {abilityDelta && (
                  <p className={cn(
                    "text-xs font-bold mt-2 flex items-center gap-1",
                    abilityDelta === "up" ? "text-green-600" : "text-amber-600"
                  )}>
                    {abilityDelta === "up" ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                    {abilityDelta === "up" ? "مستوى الصعوبة يرتفع! الخوارزمية تحديك" : "الخوارزمية ستراجع هذا الجانب معك"}
                  </p>
                )}
              </div>
            )}

            {stage === "answer-reveal" && (
              <button
                onClick={handleNextQuestion}
                data-testid="btn-next-question"
                className="w-full py-3.5 rounded-2xl bg-green-600 text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-green-700 transition-colors active:scale-95 shadow-sm shadow-green-200 dark:shadow-green-900"
              >
                {questionCount >= SESSION_TOTAL ? "عرض النتائج" : "السؤال التالي"}
                <ArrowRight className="w-4 h-4 rotate-180" />
              </button>
            )}

            {/* Session stats mini-bar */}
            {sessionAnswers.length > 0 && (
              <div className="flex gap-2">
                <div className="flex-1 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 px-3 py-2 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-bold text-green-600">{sessionAnswers.filter(a => a.correct).length}</span>
                  <span className="text-xs text-gray-400">صواب</span>
                </div>
                <div className="flex-1 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 px-3 py-2 flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-red-400" />
                  <span className="text-sm font-bold text-red-500">{sessionAnswers.filter(a => !a.correct).length}</span>
                  <span className="text-xs text-gray-400">خطأ</span>
                </div>
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 px-3 py-2 flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-xs text-gray-500">{SESSION_TOTAL - sessionAnswers.length} متبقي</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
