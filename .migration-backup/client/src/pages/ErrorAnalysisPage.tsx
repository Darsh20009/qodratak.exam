import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import {
  ChevronRight, AlertTriangle, TrendingDown, Lightbulb, Target,
  XCircle, CheckCircle2, Brain, BookOpen, BarChart3, Zap,
  RefreshCw, ChevronDown, ChevronUp, Info
} from "lucide-react";

interface ErrorPattern {
  subcategory: string;
  category: string;
  total: number;
  insight: string;
  positionPattern: string;
  topWrong: { text: string; count: number; pct: number } | null;
  byDiff: Record<string, number>;
  recentErrors: { questionText: string; selectedOptionText: string; correctOptionText: string; date: string }[];
  tip?: string;
}

interface AnalysisResponse {
  patterns: ErrorPattern[];
  total: number;
}

const DIFF_LABEL: Record<string, string> = { beginner: "سهل", intermediate: "متوسط", advanced: "صعب" };
const DIFF_COLOR: Record<string, string> = {
  beginner: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  intermediate: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  advanced: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

function PatternCard({ pattern }: { pattern: ErrorPattern }) {
  const [expanded, setExpanded] = useState(false);
  const severity = pattern.total >= 8 ? "high" : pattern.total >= 4 ? "medium" : "low";
  const severityColors = {
    high: "border-red-200 dark:border-red-800/60 bg-red-50/30 dark:bg-red-900/10",
    medium: "border-amber-200 dark:border-amber-800/60 bg-amber-50/30 dark:bg-amber-900/10",
    low: "border-gray-200 dark:border-gray-800",
  };
  const severityBadge = {
    high: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    medium: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    low: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  };
  const severityLabel = { high: "يحتاج تركيز", medium: "تحسين", low: "طبيعي" };

  return (
    <div className={cn("rounded-2xl border-2 overflow-hidden transition-all", severityColors[severity])}>
      {/* Card header */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg font-black",
            severity === "high" ? "bg-red-100 dark:bg-red-900/30 text-red-600" :
            severity === "medium" ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600" :
            "bg-gray-100 dark:bg-gray-800 text-gray-500"
          )}>
            {pattern.total}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="font-bold text-sm text-gray-900 dark:text-white">{pattern.subcategory}</span>
              <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", severityBadge[severity])}>
                {severityLabel[severity]}
              </span>
              <span className="text-[10px] text-gray-400">
                {pattern.category === "verbal" ? "لفظي" : "كمي"}
              </span>
            </div>
            {/* Insight sentence */}
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed" dir="rtl">
              {pattern.insight}
            </p>
          </div>
        </div>

        {/* Position pattern */}
        {pattern.positionPattern && (
          <div className="mt-3 flex items-center gap-2 bg-white/60 dark:bg-gray-800/60 rounded-xl px-3 py-2">
            <Info className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
            <p className="text-xs text-blue-700 dark:text-blue-300">{pattern.positionPattern}</p>
          </div>
        )}

        {/* Top wrong option */}
        {pattern.topWrong && pattern.topWrong.pct >= 40 && (
          <div className="mt-2 flex items-start gap-2 bg-red-50/50 dark:bg-red-900/10 rounded-xl px-3 py-2">
            <XCircle className="w-3.5 h-3.5 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-red-700 dark:text-red-300 font-medium" dir="rtl">
                اخترت "{pattern.topWrong.text}" بشكل متكرر ({pattern.topWrong.pct}% من أخطائك في هذا القسم)
              </p>
            </div>
          </div>
        )}

        {/* Tip */}
        {pattern.tip && (
          <div className="mt-2 flex items-start gap-2 bg-green-50/60 dark:bg-green-900/10 rounded-xl px-3 py-2">
            <Lightbulb className="w-3.5 h-3.5 text-green-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-green-700 dark:text-green-300" dir="rtl">{pattern.tip}</p>
          </div>
        )}

        {/* Difficulty breakdown */}
        {Object.keys(pattern.byDiff).length > 0 && (
          <div className="mt-3 flex gap-2 flex-wrap">
            {Object.entries(pattern.byDiff).map(([diff, count]) => (
              <span key={diff} className={cn("text-xs px-2 py-0.5 rounded-full font-medium", DIFF_COLOR[diff] || "bg-gray-100 text-gray-500")}>
                {DIFF_LABEL[diff] || diff}: {count}
              </span>
            ))}
          </div>
        )}

        {/* Expand toggle */}
        {pattern.recentErrors.length > 0 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-3 flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            {expanded ? "إخفاء الأمثلة" : `عرض آخر ${pattern.recentErrors.length} أخطاء`}
          </button>
        )}
      </div>

      {/* Recent errors expanded view */}
      {expanded && pattern.recentErrors.length > 0 && (
        <div className="border-t border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-900/50">
          {pattern.recentErrors.map((err, i) => (
            <div key={i} className={cn("px-4 py-3", i > 0 ? "border-t border-gray-100 dark:border-gray-800" : "")}>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 leading-relaxed" dir="rtl">
                {err.questionText || "سؤال"}
              </p>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <XCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                  <span className="text-xs text-red-600 dark:text-red-400" dir="rtl">اخترت: {err.selectedOptionText}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                  <span className="text-xs text-green-600 dark:text-green-400" dir="rtl">الصحيح: {err.correctOptionText}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
      <div className="w-20 h-20 rounded-3xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
        <CheckCircle2 className="w-10 h-10 text-green-500" />
      </div>
      <div>
        <h3 className="font-bold text-gray-900 dark:text-white mb-1">لا توجد أخطاء مسجّلة بعد</h3>
        <p className="text-sm text-gray-400 max-w-xs">
          ابدأ بالاختبار التكيفي — سيتتبع أخطاءك تلقائياً ويحللها هنا
        </p>
      </div>
      <Link href="/adaptive-test">
        <button className="px-5 py-2.5 bg-green-600 text-white rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-green-700 transition-colors">
          <Brain className="w-4 h-4" />
          ابدأ الاختبار التكيفي
        </button>
      </Link>
    </div>
  );
}

export default function ErrorAnalysisPage() {
  const [filter, setFilter] = useState<"all" | "verbal" | "quantitative">("all");

  const { data, isLoading, refetch } = useQuery<AnalysisResponse>({
    queryKey: ["/api/error-analysis"],
    queryFn: () => fetch("/api/error-analysis").then(r => r.json()),
    staleTime: 2 * 60 * 1000,
  });

  const patterns = (data?.patterns || []).filter(p =>
    filter === "all" || p.category === filter
  );

  const highCount = patterns.filter(p => p.total >= 8).length;
  const medCount = patterns.filter(p => p.total >= 4 && p.total < 8).length;
  const topSubcat = patterns[0]?.subcategory;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-24" dir="rtl">
      {/* Top bar */}
      <div className="sticky top-0 z-20 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-4 py-3">
        <div className="flex items-center gap-3">
          <Link href="/">
            <button className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-400">
              <ChevronRight className="w-5 h-5" />
            </button>
          </Link>
          <div className="flex-1">
            <h1 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-red-500" />
              تحليل الأخطاء المتكررة
            </h1>
            {data && data.total > 0 && (
              <p className="text-xs text-gray-400">{data.total} خطأ محلَّل</p>
            )}
          </div>
          <button
            onClick={() => refetch()}
            className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            data-testid="btn-refresh-analysis"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-4 space-y-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-12 h-12 rounded-full border-4 border-green-600 border-t-transparent animate-spin" />
            <p className="text-gray-400 text-sm">جاري تحليل أنماط أخطائك...</p>
          </div>
        ) : (!data || data.total === 0) ? (
          <EmptyState />
        ) : (
          <>
            {/* Overview stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-3 text-center">
                <p className="text-2xl font-black text-gray-900 dark:text-white">{data.total}</p>
                <p className="text-[11px] text-gray-400 mt-0.5">إجمالي الأخطاء</p>
              </div>
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-3 text-center">
                <p className="text-2xl font-black text-red-500">{highCount}</p>
                <p className="text-[11px] text-gray-400 mt-0.5">تحتاج تركيز</p>
              </div>
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-3 text-center">
                <p className="text-2xl font-black text-amber-500">{patterns.length}</p>
                <p className="text-[11px] text-gray-400 mt-0.5">قسم متأثر</p>
              </div>
            </div>

            {/* Top weakness banner */}
            {topSubcat && (
              <div className="bg-gradient-to-r from-red-500 to-rose-600 rounded-2xl p-4 text-white">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-xs font-bold opacity-90">أكثر الأقسام أخطاءً</span>
                </div>
                <p className="text-lg font-black">{topSubcat}</p>
                <p className="text-xs opacity-80 mt-1">{patterns[0]?.total} خطأ مسجَّل — ركّز عليه أكثر في الجلسات القادمة</p>
              </div>
            )}

            {/* Info card */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl px-4 py-3 flex items-start gap-2">
              <Zap className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700 dark:text-blue-300">
                يتحسن هذا التقرير تلقائياً كلما أكملت المزيد من الاختبارات التكيفية — الخوارزمية تتذكر أنماط اختياراتك
              </p>
            </div>

            {/* Filter */}
            <div className="flex gap-2">
              {[
                { key: "all", label: "الكل" },
                { key: "verbal", label: "لفظي", icon: BookOpen },
                { key: "quantitative", label: "كمي", icon: BarChart3 },
              ].map(f => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key as any)}
                  data-testid={`btn-filter-${f.key}`}
                  className={cn(
                    "flex-1 py-2 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-1.5",
                    filter === f.key
                      ? "bg-green-600 text-white"
                      : "bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 text-gray-600 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-green-900/20"
                  )}
                >
                  {f.icon && <f.icon className="w-3.5 h-3.5" />}
                  {f.label}
                </button>
              ))}
            </div>

            {/* Pattern cards */}
            {patterns.length === 0 ? (
              <div className="text-center py-10 text-gray-400 text-sm">لا توجد أخطاء في هذا التصنيف بعد</div>
            ) : (
              <div className="space-y-3">
                {patterns.map((p, i) => (
                  <PatternCard key={`${p.subcategory}-${i}`} pattern={p} />
                ))}
              </div>
            )}

            {/* CTA to adaptive test */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                <Brain className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 dark:text-white">تدرّب على نقاط ضعفك</p>
                <p className="text-xs text-gray-400">الاختبار التكيفي يركّز تلقائياً على الأقسام الأضعف</p>
              </div>
              <Link href="/adaptive-test">
                <button className="px-3 py-2 bg-green-600 text-white rounded-xl text-xs font-bold hover:bg-green-700 transition-colors flex-shrink-0">
                  ابدأ
                </button>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
