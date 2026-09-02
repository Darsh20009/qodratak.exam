import { useState, useEffect, useRef, useCallback } from "react";
import ImageZoom from "@/components/ImageZoom";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import {
  ChevronRight, ChevronLeft, RotateCcw, CheckCircle2, XCircle,
  Trophy, Flame, BookOpen, Filter, ArrowRight, Star, Zap,
  Layers, Target, Brain
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

const CATEGORIES = [
  { key: "all", label: "الكل", icon: Layers },
  { key: "verbal", label: "لفظي", icon: BookOpen },
  { key: "quantitative", label: "كمي", icon: Brain },
];

const DIFFICULTIES = [
  { key: "all", label: "كل المستويات" },
  { key: "beginner", label: "سهل" },
  { key: "intermediate", label: "متوسط" },
  { key: "advanced", label: "صعب" },
];

const DIFFICULTY_AR: Record<string, string> = {
  beginner: "سهل",
  intermediate: "متوسط",
  advanced: "صعب",
};

const DIFFICULTY_COLOR: Record<string, string> = {
  beginner: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  intermediate: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  advanced: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

function FlipCard({
  question,
  flipped,
  onFlip,
}: {
  question: Question;
  flipped: boolean;
  onFlip: () => void;
}) {
  const correctAnswer = question.options[question.correctOptionIndex];

  return (
    <div
      className="w-full cursor-pointer select-none"
      style={{ perspective: "1200px" }}
      onClick={!flipped ? onFlip : undefined}
    >
      <div
        className="relative w-full transition-transform duration-500 ease-in-out"
        style={{
          transformStyle: "preserve-3d",
          transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          minHeight: "260px",
        }}
      >
        {/* Front */}
        <div
          className="absolute inset-0 rounded-3xl bg-white dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-800 shadow-lg flex flex-col"
          style={{ backfaceVisibility: "hidden" }}
        >
          {/* Card header */}
          <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-gray-50 dark:border-gray-800">
            <span className="text-xs text-gray-400">{question.subcategory}</span>
            {question.difficulty && (
              <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", DIFFICULTY_COLOR[question.difficulty] || "bg-gray-100 text-gray-500")}>
                {DIFFICULTY_AR[question.difficulty] || question.difficulty}
              </span>
            )}
          </div>
          {/* Question text */}
          <div className="flex-1 flex flex-col items-center justify-center px-6 py-6 text-center gap-4">
            {question.imageUrl && (
              <ImageZoom src={question.imageUrl} imgClassName="max-h-28 rounded-xl object-contain" />
            )}
            <p className="text-xl font-bold text-gray-900 dark:text-white leading-relaxed" dir="rtl">
              {question.text}
            </p>
          </div>
          {/* Tap hint */}
          <div className="flex items-center justify-center gap-1.5 pb-4 text-xs text-gray-400">
            <RotateCcw className="w-3.5 h-3.5" />
            اضغط لكشف الإجابة
          </div>
        </div>

        {/* Back */}
        <div
          className="absolute inset-0 rounded-3xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-900 dark:to-gray-800 border-2 border-green-200 dark:border-green-800 shadow-lg flex flex-col"
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-green-100 dark:border-green-900/30">
            <span className="text-xs text-gray-400">{question.subcategory}</span>
            <span className="text-xs font-bold text-green-600 dark:text-green-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              الإجابة الصحيحة
            </span>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center px-6 py-4 text-center gap-3">
            <div className="bg-white dark:bg-gray-800 border border-green-200 dark:border-green-700 rounded-2xl px-5 py-3 w-full">
              <p className="text-lg font-bold text-green-700 dark:text-green-400" dir="rtl">
                {correctAnswer}
              </p>
            </div>
            {question.explanation && (
              <div className="text-sm text-gray-600 dark:text-gray-300 bg-white/60 dark:bg-gray-800/60 rounded-2xl px-4 py-3 w-full text-right leading-relaxed" dir="rtl">
                <span className="font-bold text-gray-700 dark:text-gray-200">التفسير: </span>
                {question.explanation}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SessionComplete({
  knew: knewCount,
  total,
  onRestart,
  onReview,
}: {
  knew: number;
  total: number;
  onRestart: () => void;
  onReview: () => void;
}) {
  const pct = Math.round((knewCount / total) * 100);
  const excellent = pct >= 80;
  const good = pct >= 60;

  return (
    <div className="flex flex-col items-center gap-6 py-8 text-center">
      <div className={cn(
        "w-24 h-24 rounded-full flex items-center justify-center text-white text-4xl shadow-lg",
        excellent ? "bg-gradient-to-br from-green-500 to-emerald-600" :
        good ? "bg-gradient-to-br from-amber-500 to-orange-500" :
        "bg-gradient-to-br from-red-500 to-rose-600"
      )}>
        {excellent ? "🏆" : good ? "👍" : "💪"}
      </div>

      <div>
        <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-1">
          {excellent ? "ممتاز!" : good ? "جيد جداً!" : "استمر في المحاولة!"}
        </h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          عرفت {knewCount} من أصل {total} بطاقة
        </p>
      </div>

      {/* Score ring */}
      <div className="relative w-32 h-32">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="50" strokeWidth="10" className="fill-none stroke-gray-100 dark:stroke-gray-800" />
          <circle cx="60" cy="60" r="50" strokeWidth="10"
            strokeDasharray={`${2 * Math.PI * 50}`}
            strokeDashoffset={`${2 * Math.PI * 50 * (1 - pct / 100)}`}
            strokeLinecap="round"
            className={cn("fill-none transition-all duration-1000",
              excellent ? "stroke-green-500" : good ? "stroke-amber-500" : "stroke-red-500")} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-black text-gray-900 dark:text-white">{pct}%</span>
          <span className="text-xs text-gray-400">نجاح</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
        <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl p-3">
          <p className="text-2xl font-black text-green-600 dark:text-green-400">{knewCount}</p>
          <p className="text-xs text-gray-500 mt-0.5">عرفتها ✓</p>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-3">
          <p className="text-2xl font-black text-red-500">{total - knewCount}</p>
          <p className="text-xs text-gray-500 mt-0.5">لم أعرفها ✗</p>
        </div>
      </div>

      <div className="flex flex-col gap-2 w-full max-w-xs">
        {total - knewCount > 0 && (
          <button
            onClick={onReview}
            data-testid="btn-review-missed"
            className="w-full py-3 rounded-2xl bg-green-600 text-white font-bold text-sm hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            راجع ما لم تعرفه ({total - knewCount})
          </button>
        )}
        <button
          onClick={onRestart}
          data-testid="btn-restart-session"
          className="w-full py-3 rounded-2xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-bold text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          جلسة جديدة
        </button>
      </div>
    </div>
  );
}

export default function FlashcardsPage() {
  const [category, setCategory] = useState<string>("all");
  const [difficulty, setDifficulty] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [deck, setDeck] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [results, setResults] = useState<Record<number, "knew" | "missed">>({});
  const [sessionDone, setSessionDone] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const { data: rawQuestions, isLoading } = useQuery<Question[]>({
    queryKey: ["/api/questions", category],
    queryFn: () =>
      fetch(category === "all" ? "/api/questions" : `/api/questions?category=${category}`)
        .then(r => r.json()),
    staleTime: 5 * 60 * 1000,
  });

  const shuffle = (arr: Question[]) => [...arr].sort(() => Math.random() - 0.5);

  useEffect(() => {
    if (!rawQuestions) return;
    let filtered = rawQuestions;
    if (difficulty !== "all") filtered = filtered.filter(q => q.difficulty === difficulty);
    const shuffled = shuffle(filtered).slice(0, 20);
    setDeck(shuffled);
    setCurrentIdx(0);
    setFlipped(false);
    setResults({});
    setSessionDone(false);
    setReviewing(false);
  }, [rawQuestions, difficulty]);

  const current = deck[currentIdx];
  const knewList = Object.values(results).filter(r => r === "knew");
  const missedIds = Object.entries(results).filter(([, r]) => r === "missed").map(([id]) => Number(id));

  const handleResult = useCallback((res: "knew" | "missed") => {
    if (!current) return;
    const newResults = { ...results, [current.id]: res };
    setResults(newResults);

    const next = currentIdx + 1;
    if (next >= deck.length) {
      setSessionDone(true);
    } else {
      setCurrentIdx(next);
      setFlipped(false);
    }
  }, [current, currentIdx, deck.length, results]);

  const handleReviewMissed = () => {
    const missed = deck.filter(q => missedIds.includes(q.id));
    setDeck(shuffle(missed));
    setCurrentIdx(0);
    setFlipped(false);
    setResults({});
    setSessionDone(false);
    setReviewing(true);
  };

  const handleRestart = () => {
    if (!rawQuestions) return;
    let filtered = rawQuestions;
    if (difficulty !== "all") filtered = filtered.filter(q => q.difficulty === difficulty);
    const shuffled = shuffle(filtered).slice(0, 20);
    setDeck(shuffled);
    setCurrentIdx(0);
    setFlipped(false);
    setResults({});
    setSessionDone(false);
    setReviewing(false);
  };

  // Touch swipe support
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || !flipped) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 60) {
      handleResult(dx > 0 ? "knew" : "missed");
    }
    touchStartX.current = null;
  };

  const progress = deck.length > 0 ? ((currentIdx) / deck.length) * 100 : 0;
  const subcategories = Array.from(new Set((rawQuestions || []).map(q => q.subcategory))).filter(Boolean);

  return (
    <div className="min-h-screen bg-background pb-24" dir="rtl">
      {/* Top bar */}
      <div className="sticky top-0 z-20 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-4 py-3 flex items-center gap-3">
        <Link href="/">
          <button className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-400">
            <ChevronRight className="w-5 h-5" />
          </button>
        </Link>
        <div className="flex-1">
          <h1 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-green-600" />
            بطاقات المراجعة
          </h1>
          {!sessionDone && deck.length > 0 && (
            <p className="text-xs text-gray-400">{currentIdx + 1} / {deck.length}</p>
          )}
        </div>
        <button
          onClick={() => setShowFilters(f => !f)}
          data-testid="btn-toggle-filters"
          className={cn(
            "w-9 h-9 rounded-xl flex items-center justify-center transition-colors",
            showFilters ? "bg-green-600 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
          )}
        >
          <Filter className="w-4 h-4" />
        </button>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-4">

        {/* Filter panel */}
        {showFilters && (
          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-4 mb-4 shadow-sm space-y-4">
            {/* Category */}
            <div>
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2">التصنيف</p>
              <div className="flex gap-2">
                {CATEGORIES.map(c => (
                  <button
                    key={c.key}
                    onClick={() => setCategory(c.key)}
                    data-testid={`btn-cat-${c.key}`}
                    className={cn(
                      "flex-1 py-2 rounded-xl text-sm font-bold transition-all",
                      category === c.key
                        ? "bg-green-600 text-white"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-green-900/20"
                    )}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty */}
            <div>
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2">المستوى</p>
              <div className="flex flex-wrap gap-2">
                {DIFFICULTIES.map(d => (
                  <button
                    key={d.key}
                    onClick={() => setDifficulty(d.key)}
                    data-testid={`btn-diff-${d.key}`}
                    className={cn(
                      "px-3 py-1.5 rounded-xl text-xs font-bold transition-all",
                      difficulty === d.key
                        ? "bg-green-600 text-white"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                    )}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-12 h-12 rounded-full border-4 border-green-600 border-t-transparent animate-spin" />
            <p className="text-gray-400 text-sm">جاري تحميل البطاقات...</p>
          </div>
        ) : deck.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <Layers className="w-16 h-16 text-gray-200 dark:text-gray-700" />
            <p className="text-gray-500">لا توجد بطاقات للفلتر المحدد</p>
            <button onClick={() => { setCategory("all"); setDifficulty("all"); }}
              className="px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-bold">
              عرض الكل
            </button>
          </div>
        ) : sessionDone ? (
          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden p-5">
            <SessionComplete
              knew={knewList.length}
              total={deck.length}
              onRestart={handleRestart}
              onReview={handleReviewMissed}
            />
          </div>
        ) : current ? (
          <div
            className="flex flex-col gap-4"
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            {/* Progress bar */}
            <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Quick stats */}
            <div className="flex gap-2">
              <div className="flex-1 bg-green-50 dark:bg-green-900/10 rounded-2xl px-3 py-2 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span className="text-sm font-bold text-green-600 dark:text-green-400">{knewList.length}</span>
                <span className="text-xs text-gray-400">عرفتها</span>
              </div>
              <div className="flex-1 bg-red-50 dark:bg-red-900/10 rounded-2xl px-3 py-2 flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-400" />
                <span className="text-sm font-bold text-red-500">{Object.values(results).filter(r => r === "missed").length}</span>
                <span className="text-xs text-gray-400">لم أعرفها</span>
              </div>
              <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl px-3 py-2 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-xs text-gray-500">{deck.length - currentIdx} متبقي</span>
              </div>
            </div>

            {/* The card */}
            <FlipCard
              question={current}
              flipped={flipped}
              onFlip={() => setFlipped(true)}
            />

            {/* Action buttons — show only after flip */}
            {flipped ? (
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleResult("missed")}
                  data-testid="btn-missed"
                  className="py-4 rounded-2xl bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 font-bold text-sm flex flex-col items-center gap-1 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors active:scale-95"
                >
                  <XCircle className="w-6 h-6" />
                  لم أعرفها
                  <span className="text-xs font-normal opacity-70">أو اسحب يساراً</span>
                </button>
                <button
                  onClick={() => handleResult("knew")}
                  data-testid="btn-knew"
                  className="py-4 rounded-2xl bg-green-50 dark:bg-green-900/20 border-2 border-green-300 dark:border-green-700 text-green-600 dark:text-green-400 font-bold text-sm flex flex-col items-center gap-1 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors active:scale-95"
                >
                  <CheckCircle2 className="w-6 h-6" />
                  عرفتها!
                  <span className="text-xs font-normal opacity-70">أو اسحب يميناً</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setFlipped(true)}
                data-testid="btn-reveal"
                className="w-full py-4 rounded-2xl bg-green-600 text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-green-700 transition-colors active:scale-95 shadow-sm shadow-green-200 dark:shadow-green-900"
              >
                <RotateCcw className="w-4 h-4" />
                اكشف الإجابة
              </button>
            )}

            {/* Skip */}
            <button
              onClick={() => { setCurrentIdx(i => Math.min(i + 1, deck.length - 1)); setFlipped(false); }}
              data-testid="btn-skip"
              className="w-full py-2 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors flex items-center justify-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              تخطى هذه البطاقة
            </button>
          </div>
        ) : null}

        {/* Subcategory chips */}
        {!sessionDone && subcategories.length > 0 && !showFilters && (
          <div className="mt-4 flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {subcategories.slice(0, 8).map(sub => (
              <span key={sub}
                className="flex-shrink-0 px-3 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-xs text-gray-500 dark:text-gray-400">
                {sub}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
