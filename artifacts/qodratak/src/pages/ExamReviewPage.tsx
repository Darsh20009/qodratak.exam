import { useState, useEffect, useRef } from "react";
import ImageZoom from "@/components/ImageZoom";
import { useLocation } from "wouter";
import {
  CheckCircle2, XCircle, AlertCircle, ChevronRight, ChevronLeft,
  Monitor, ArrowRight, BookOpen, Target, Clock, BarChart3,
  Lightbulb, Flag, LayoutGrid, List, Home, RotateCcw
} from "lucide-react";

interface Question {
  id?: number;
  text: string;
  options?: string[];
  choices?: string[];
  correctOptionIndex?: number;
  correct_answer?: string;
  explanation?: string;
  type?: string;
  category?: string;
  subcategory?: string;
  passage?: string;
  image_url?: string;
}

interface ReviewData {
  testName?: string;
  subcategory?: string;
  totalQuestions: number;
  correctAnswers: number;
  percentage: number;
  timeSpent?: number;
  date?: string;
  answers: Record<string, string>;
  questions: Question[];
  examType?: string;
}

type Filter = "all" | "wrong" | "correct" | "skipped";

function getStatus(q: Question, qIndex: number, answers: Record<string, string>): "correct" | "wrong" | "skipped" {
  const userAnswer = answers[qIndex.toString()];
  if (userAnswer === undefined || userAnswer === null || userAnswer === "") return "skipped";
  const correctAnswer = q.correctOptionIndex?.toString() ?? q.correct_answer;
  return userAnswer === correctAnswer ? "correct" : "wrong";
}

function getOptions(q: Question): string[] {
  return q.options || q.choices || [];
}

function getCorrectIndex(q: Question): number {
  if (q.correctOptionIndex !== undefined) return q.correctOptionIndex;
  if (q.correct_answer !== undefined) {
    const num = parseInt(q.correct_answer);
    if (!isNaN(num)) return num;
  }
  return -1;
}

export default function ExamReviewPage() {
  const [, navigate] = useLocation();
  const [data, setData] = useState<ReviewData | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [filter, setFilter] = useState<Filter>("wrong");
  const [viewMode, setViewMode] = useState<"single" | "grid">("single");
  const [isMobile, setIsMobile] = useState(false);
  const [showDesktopBanner, setShowDesktopBanner] = useState(true);
  const questionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    const raw = localStorage.getItem("testResults") || localStorage.getItem("lastTestResult");
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setData(parsed);
      } catch {}
    }
  }, []);

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center" dir="rtl">
        <div className="text-center max-w-sm mx-auto p-8">
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-2">لا توجد بيانات اختبار</h2>
          <p className="text-gray-500 text-sm mb-6">أكمل اختباراً أولاً لمراجعة إجاباتك</p>
          <button onClick={() => navigate("/")} className="bg-teal-100 text-white px-6 py-3 rounded-xl font-bold hover:bg-teal-100 transition-colors">
            العودة للرئيسية
          </button>
        </div>
      </div>
    );
  }

  const allQuestions = data.questions || [];
  const filteredIndices = allQuestions
    .map((q, i) => ({ q, i }))
    .filter(({ q, i }) => {
      const status = getStatus(q, i, data.answers);
      if (filter === "all") return true;
      return status === filter;
    })
    .map(({ i }) => i);

  const wrongCount = allQuestions.filter((q, i) => getStatus(q, i, data.answers) === "wrong").length;
  const correctCount = allQuestions.filter((q, i) => getStatus(q, i, data.answers) === "correct").length;
  const skippedCount = allQuestions.filter((q, i) => getStatus(q, i, data.answers) === "skipped").length;

  const currentQuestionRealIdx = filteredIndices[currentIdx] ?? 0;
  const currentQuestion = allQuestions[currentQuestionRealIdx];

  const scrollToTop = () => questionRef.current?.scrollIntoView({ behavior: "smooth" });

  const goNext = () => {
    if (currentIdx < filteredIndices.length - 1) {
      setCurrentIdx(c => c + 1);
      scrollToTop();
    }
  };
  const goPrev = () => {
    if (currentIdx > 0) {
      setCurrentIdx(c => c - 1);
      scrollToTop();
    }
  };

  const statusColors: Record<string, string> = {
    correct: "bg-emerald-500",
    wrong: "bg-red-500",
    skipped: "bg-gray-300 dark:bg-gray-600",
  };

  const formatTime = (sec?: number) => {
    if (!sec) return "--";
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950" dir="rtl">
      {/* Desktop Recommendation Banner (mobile only) */}
      {isMobile && showDesktopBanner && (
        <div className="bg-gradient-to-l from-teal-600 to-emerald-500 text-white px-4 py-3 flex items-start gap-3">
          <Monitor className="w-5 h-5 flex-shrink-0 mt-0.5 text-white/80" />
          <div className="flex-1">
            <p className="font-bold text-sm">أفضل تجربة مراجعة على الحاسب</p>
            <p className="text-white/75 text-xs mt-0.5">
              الاختبار الحقيقي يُطبَّق على جهاز الحاسب. مراجعة أخطائك على شاشة كبيرة تمنحك تجربة أقرب للاختبار الفعلي في مركز قياس.
            </p>
          </div>
          <button onClick={() => setShowDesktopBanner(false)} className="text-white/60 hover:text-white flex-shrink-0 text-lg leading-none">×</button>
        </div>
      )}

      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <button
            onClick={() => navigate(-1 as any)}
            className="flex items-center gap-1.5 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 text-sm font-medium transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
            <span className="hidden sm:inline">العودة</span>
          </button>
          <div className="flex-1 text-center">
            <h1 className="font-black text-gray-900 dark:text-white text-sm sm:text-base">
              مراجعة الاختبار — {data.testName || "سجل الأخطاء"}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode(v => v === "single" ? "grid" : "single")}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-teal-100 hover:text-teal-700 transition-colors"
              title={viewMode === "single" ? "عرض شبكي" : "عرض مفصّل"}
            >
              {viewMode === "single" ? <LayoutGrid className="w-4 h-4" /> : <List className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto flex gap-0 lg:gap-5 px-0 lg:px-4 py-0 lg:py-5 pb-36 lg:pb-8">

        {/* ═══ Side Panel (Desktop) ═══ */}
        <aside className="hidden lg:flex flex-col w-72 flex-shrink-0 gap-4">

          {/* Summary Card */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 shadow-sm">
            <h2 className="font-bold text-gray-900 dark:text-white text-sm mb-3 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-teal-700" />
              ملخص الأداء
            </h2>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">الإجمالي</span>
                <span className="text-sm font-bold text-gray-800 dark:text-gray-200">{data.totalQuestions} سؤال</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />صحيح</span>
                <span className="text-sm font-bold text-emerald-600">{correctCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-red-600 flex items-center gap-1"><XCircle className="w-3 h-3" />خطأ</span>
                <span className="text-sm font-bold text-red-600">{wrongCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400 flex items-center gap-1"><Flag className="w-3 h-3" />محذوف</span>
                <span className="text-sm font-bold text-gray-400">{skippedCount}</span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-gray-100 dark:border-gray-800">
                <span className="text-xs text-gray-500 flex items-center gap-1"><Clock className="w-3 h-3" />الوقت</span>
                <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{formatTime(data.timeSpent)}</span>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-500">النتيجة</span>
                <span className={`text-sm font-black ${data.percentage >= 70 ? "text-emerald-600" : data.percentage >= 50 ? "text-amber-600" : "text-red-600"}`}>
                  {data.percentage}%
                </span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${data.percentage >= 70 ? "bg-emerald-500" : data.percentage >= 50 ? "bg-amber-500" : "bg-red-500"}`}
                  style={{ width: `${data.percentage}%` }}
                />
              </div>
            </div>
          </div>

          {/* Question Map */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 shadow-sm flex-1 overflow-auto">
            <h2 className="font-bold text-gray-900 dark:text-white text-sm mb-3 flex items-center gap-2">
              <Target className="w-4 h-4 text-teal-700" />
              خريطة الأسئلة
            </h2>
            <div className="grid grid-cols-7 gap-1.5">
              {allQuestions.map((q, i) => {
                const status = getStatus(q, i, data.answers);
                const isActive = i === currentQuestionRealIdx && filter !== "all" ? filteredIndices.includes(i) : i === currentQuestionRealIdx;
                const inFilter = filteredIndices.includes(i);
                return (
                  <button
                    key={i}
                    onClick={() => {
                      if (inFilter) {
                        const pos = filteredIndices.indexOf(i);
                        if (pos !== -1) { setCurrentIdx(pos); scrollToTop(); }
                      }
                    }}
                    className={`w-7 h-7 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center border-2 ${
                      isActive
                        ? "border-teal-400 scale-110 shadow-md"
                        : "border-transparent"
                    } ${
                      status === "correct"
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                        : status === "wrong"
                        ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        : "bg-gray-100 text-gray-400 dark:bg-gray-800"
                    } ${!inFilter && filter !== "all" ? "opacity-30" : "hover:scale-105"}`}
                    title={`سؤال ${i + 1} — ${status === "correct" ? "صحيح" : status === "wrong" ? "خطأ" : "محذوف"}`}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-3 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 text-[10px]">
              <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-emerald-400" /><span className="text-gray-500">صحيح</span></div>
              <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-red-400" /><span className="text-gray-500">خطأ</span></div>
              <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-gray-300" /><span className="text-gray-500">محذوف</span></div>
            </div>
          </div>
        </aside>

        {/* ═══ Main Content ═══ */}
        <main className="flex-1 min-w-0">

          {/* Filter Tabs */}
          <div className="bg-white dark:bg-gray-900 lg:rounded-2xl border-b lg:border border-gray-200 dark:border-gray-800 px-4 py-3 flex gap-2 overflow-x-auto shadow-sm mb-0 lg:mb-4">
            {([
              { key: "wrong", label: `الأخطاء (${wrongCount})`, color: "red" },
              { key: "correct", label: `الصحيح (${correctCount})`, color: "emerald" },
              { key: "skipped", label: `المحذوف (${skippedCount})`, color: "gray" },
              { key: "all", label: `الكل (${data.totalQuestions})`, color: "teal" },
            ] as const).map(tab => (
              <button
                key={tab.key}
                onClick={() => { setFilter(tab.key); setCurrentIdx(0); }}
                className={`flex-shrink-0 px-4 py-1.5 rounded-xl text-sm font-bold transition-all ${
                  filter === tab.key
                    ? tab.color === "red" ? "bg-red-500 text-white shadow-md"
                    : tab.color === "emerald" ? "bg-emerald-500 text-white shadow-md"
                    : tab.color === "gray" ? "bg-gray-500 text-white shadow-md"
                    : "bg-teal-100 text-white shadow-md"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {filteredIndices.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-12 text-center shadow-sm">
              <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
              <h3 className="font-bold text-gray-700 dark:text-gray-300 text-lg mb-2">
                {filter === "wrong" ? "ممتاز! لا توجد أخطاء" : filter === "skipped" ? "لا توجد أسئلة محذوفة" : "لا توجد أسئلة"}
              </h3>
              <p className="text-gray-400 text-sm">اختر فئة أخرى من الفلاتر أعلاه</p>
            </div>
          ) : viewMode === "grid" ? (
            /* Grid View */
            <div className="grid gap-3 px-4 lg:px-0 py-4">
              {filteredIndices.map((realIdx) => {
                const q = allQuestions[realIdx];
                const status = getStatus(q, realIdx, data.answers);
                const userAnswer = data.answers[realIdx.toString()];
                const correctIdx = getCorrectIndex(q);
                const opts = getOptions(q);
                return (
                  <div
                    key={realIdx}
                    className={`bg-white dark:bg-gray-900 rounded-2xl border-2 p-4 shadow-sm ${
                      status === "correct" ? "border-emerald-200 dark:border-emerald-800" :
                      status === "wrong" ? "border-red-200 dark:border-red-800" :
                      "border-gray-200 dark:border-gray-800"
                    }`}
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-black text-white ${statusColors[status]}`}>
                        {realIdx + 1}
                      </div>
                      <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed font-medium">{q.text}</p>
                    </div>
                    <div className="space-y-1.5 mr-10">
                      {opts.map((opt, oi) => {
                        const isCorrect = oi === correctIdx;
                        const isUser = userAnswer === oi.toString();
                        return (
                          <div
                            key={oi}
                            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs transition-all ${
                              isCorrect && isUser ? "bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-400" :
                              isCorrect ? "bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200" :
                              isUser && !isCorrect ? "bg-red-100 dark:bg-red-900/30 border border-red-400" :
                              "bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700"
                            }`}
                          >
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0 ${
                              isCorrect ? "bg-emerald-500 text-white" : isUser && !isCorrect ? "bg-red-500 text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                            }`}>{String.fromCharCode(65 + oi)}</span>
                            <span className={`${isCorrect ? "text-emerald-700 dark:text-emerald-400 font-bold" : isUser && !isCorrect ? "text-red-700 dark:text-red-400 font-bold line-through" : "text-gray-600 dark:text-gray-400"}`}>{opt}</span>
                            {isCorrect && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mr-auto flex-shrink-0" />}
                            {isUser && !isCorrect && <XCircle className="w-3.5 h-3.5 text-red-500 mr-auto flex-shrink-0" />}
                          </div>
                        );
                      })}
                    </div>
                    {q.explanation && status === "wrong" && (
                      <div className="mt-3 mr-10 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 rounded-xl p-3">
                        <p className="text-xs font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1 mb-1">
                          <Lightbulb className="w-3.5 h-3.5" /> الشرح
                        </p>
                        <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">{q.explanation}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            /* Single Question View */
            <div ref={questionRef} className="px-4 lg:px-0 py-4 space-y-4">

              {/* Progress Bar */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 px-4 py-3 shadow-sm flex items-center gap-4">
                <span className="text-xs text-gray-500 flex-shrink-0">
                  {currentIdx + 1} / {filteredIndices.length}
                </span>
                <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-teal-100 transition-all duration-300"
                    style={{ width: `${((currentIdx + 1) / filteredIndices.length) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-teal-700 dark:text-teal-700 flex-shrink-0">
                  سؤال {currentQuestionRealIdx + 1}
                </span>
              </div>

              {/* Question Card */}
              {currentQuestion && (() => {
                const status = getStatus(currentQuestion, currentQuestionRealIdx, data.answers);
                const userAnswer = data.answers[currentQuestionRealIdx.toString()];
                const correctIdx = getCorrectIndex(currentQuestion);
                const opts = getOptions(currentQuestion);

                return (
                  <div className={`bg-white dark:bg-gray-900 rounded-2xl border-2 shadow-md overflow-hidden ${
                    status === "correct" ? "border-emerald-300 dark:border-emerald-700" :
                    status === "wrong" ? "border-red-300 dark:border-red-700" :
                    "border-gray-200 dark:border-gray-800"
                  }`}>
                    {/* Status header */}
                    <div className={`px-5 py-2.5 flex items-center gap-2 ${
                      status === "correct" ? "bg-emerald-500" :
                      status === "wrong" ? "bg-red-500" :
                      "bg-gray-400"
                    }`}>
                      {status === "correct" && <CheckCircle2 className="w-4 h-4 text-white" />}
                      {status === "wrong" && <XCircle className="w-4 h-4 text-white" />}
                      {status === "skipped" && <AlertCircle className="w-4 h-4 text-white" />}
                      <span className="text-white font-bold text-sm">
                        {status === "correct" ? "إجابة صحيحة ✓" : status === "wrong" ? "إجابة خاطئة ✗" : "سؤال محذوف"}
                      </span>
                      <span className="mr-auto text-white/75 text-xs">
                        {currentQuestion.type === "verbal" ? "لفظي" : currentQuestion.type === "quantitative" ? "كمي" : currentQuestion.category || ""}
                      </span>
                    </div>

                    {/* Passage (if exists) */}
                    {currentQuestion.passage && (
                      <div className="mx-5 mt-5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-loose whitespace-pre-wrap">{currentQuestion.passage}</p>
                      </div>
                    )}

                    {/* Question text */}
                    <div className="p-5">
                      <div className="flex items-start gap-3 mb-5">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-black text-white ${statusColors[status]}`}>
                          {currentQuestionRealIdx + 1}
                        </div>
                        <p className="text-base text-gray-900 dark:text-white leading-loose font-semibold">{currentQuestion.text}</p>
                      </div>

                      {/* Image */}
                      {currentQuestion.image_url && (
                        <div className="mb-4 mr-12 flex justify-center">
                          <ImageZoom src={currentQuestion.image_url} imgClassName="rounded-xl border border-gray-200 dark:border-gray-700 max-h-64 object-contain bg-white w-full" />
                        </div>
                      )}

                      {/* Options */}
                      <div className="space-y-3 mr-12">
                        {opts.map((opt, oi) => {
                          const isCorrect = oi === correctIdx;
                          const isUser = userAnswer === oi.toString();
                          const isWrongUser = isUser && !isCorrect;

                          return (
                            <div
                              key={oi}
                              className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl border-2 transition-all ${
                                isCorrect && isUser
                                  ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-400 dark:border-emerald-600 shadow-md shadow-emerald-100 dark:shadow-emerald-900/20"
                                  : isCorrect
                                  ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700"
                                  : isWrongUser
                                  ? "bg-red-50 dark:bg-red-900/20 border-red-400 dark:border-red-600 shadow-md shadow-red-100 dark:shadow-red-900/20"
                                  : "bg-white dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 opacity-60"
                              }`}
                            >
                              <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black flex-shrink-0 ${
                                isCorrect
                                  ? "bg-emerald-500 text-white"
                                  : isWrongUser
                                  ? "bg-red-500 text-white"
                                  : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                              }`}>
                                {String.fromCharCode(65 + oi)}
                              </span>
                              <span className={`flex-1 text-sm leading-relaxed ${
                                isCorrect
                                  ? "text-emerald-800 dark:text-emerald-300 font-bold"
                                  : isWrongUser
                                  ? "text-red-800 dark:text-red-300 font-bold"
                                  : "text-gray-500 dark:text-gray-500"
                              }`}>{opt}</span>
                              {isCorrect && !isUser && (
                                <span className="text-emerald-600 text-xs font-bold flex-shrink-0 flex items-center gap-1">
                                  <CheckCircle2 className="w-4 h-4" /> الصحيح
                                </span>
                              )}
                              {isCorrect && isUser && (
                                <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                              )}
                              {isWrongUser && (
                                <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Explanation */}
                      {currentQuestion.explanation && status === "wrong" && (
                        <div className="mt-5 mr-12 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 rounded-2xl p-4">
                          <p className="text-sm font-black text-amber-700 dark:text-amber-400 flex items-center gap-2 mb-2">
                            <Lightbulb className="w-4 h-4" />
                            الشرح والتوضيح
                          </p>
                          <p className="text-sm text-amber-800 dark:text-amber-300 leading-loose">{currentQuestion.explanation}</p>
                        </div>
                      )}
                    </div>

                    {/* Navigation within card */}
                    <div className="border-t border-gray-100 dark:border-gray-800 px-5 py-3 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/30">
                      <button
                        onClick={goNext}
                        disabled={currentIdx >= filteredIndices.length - 1}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-100 text-white text-sm font-bold hover:bg-teal-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        التالي
                      </button>
                      <span className="text-xs text-gray-400">{currentIdx + 1} من {filteredIndices.length}</span>
                      <button
                        onClick={goPrev}
                        disabled={currentIdx === 0}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-bold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        السابق
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })()}

              {/* Bottom Actions */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => navigate("/mistake-challenge")}
                  className="flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-l from-red-600 to-orange-500 text-white font-bold text-sm shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]"
                >
                  <RotateCcw className="w-4 h-4" />
                  تحدي الأخطاء
                </button>
                <button
                  onClick={() => navigate("/")}
                  className="flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-teal-100 text-white font-bold text-sm shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]"
                >
                  <Home className="w-4 h-4" />
                  اختبار جديد
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Mobile Question Navigation Footer */}
      <div className="lg:hidden fixed left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 px-4 py-2 flex items-center gap-3 shadow-2xl z-40 bottom-16 md:bottom-0">
        <button
          onClick={goPrev}
          disabled={currentIdx === 0}
          className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center disabled:opacity-40"
        >
          <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
        <div className="flex-1 overflow-x-auto flex gap-1 py-1">
          {filteredIndices.map((realIdx, pos) => {
            const status = getStatus(allQuestions[realIdx], realIdx, data.answers);
            return (
              <button
                key={realIdx}
                onClick={() => { setCurrentIdx(pos); scrollToTop(); }}
                className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-[11px] font-bold border-2 transition-all ${
                  pos === currentIdx ? "border-teal-400 scale-110" : "border-transparent"
                } ${
                  status === "correct" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
                  status === "wrong" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                  "bg-gray-100 text-gray-400 dark:bg-gray-800"
                }`}
              >
                {realIdx + 1}
              </button>
            );
          })}
        </div>
        <button
          onClick={goNext}
          disabled={currentIdx >= filteredIndices.length - 1}
          className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center disabled:opacity-40"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
      </div>
      <div className="lg:hidden h-16" />
    </div>
  );
}
