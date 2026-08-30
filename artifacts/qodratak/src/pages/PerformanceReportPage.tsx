import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  ChevronRight, Download, Share2, Trophy, Target, BookOpen,
  Brain, Flame, TrendingUp, CheckCircle2, AlertTriangle, Star, Zap
} from "lucide-react";
import { cn } from "@/lib/utils";

interface User {
  id: number;
  name: string;
  username?: string;
  points?: number;
  level?: number;
  testsCount?: number;
  averageScore?: number;
  subscription?: { type: string };
}

interface DetailedStats {
  totalSeenQuestions: number;
  totalTests: number;
  averageScore: number;
  byCategory: Record<string, { correct: number; total: number }>;
  recentScores: { date: string; score: number; name: string; type: string }[];
  weakAreas: { name: string; percent: number }[];
}

interface DailyGoalData {
  streak: { current: number; longest: number; weekDays: boolean[] } | number;
  longestStreak?: number;
  todayCount?: number;
  goal?: number;
  target?: number;
  answered?: number;
}

function getStreakCurrent(streak: { current: number; longest: number; weekDays: boolean[] } | number | undefined): number {
  if (!streak) return 0;
  if (typeof streak === 'object') return streak.current ?? 0;
  return streak;
}

function getScoreColor(score: number) {
  if (score >= 80) return "#16a34a";
  if (score >= 60) return "#d97706";
  return "#dc2626";
}
function getScoreLabel(score: number) {
  if (score >= 80) return "ممتاز";
  if (score >= 60) return "جيد";
  if (score >= 40) return "مقبول";
  return "يحتاج تحسين";
}

const CATEGORY_LABEL: Record<string, string> = {
  verbal: "القسم اللفظي",
  quantitative: "القسم الكمي",
};

function ReportPreview({
  user,
  stats,
  goal,
  reportRef,
}: {
  user: User;
  stats: DetailedStats;
  goal: DailyGoalData;
  reportRef: React.RefObject<HTMLDivElement>;
}) {
  const now = new Date();
  const dateStr = now.toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric" });
  const avgScore = Math.round(stats.averageScore);
  const categoryEntries = Object.entries(stats.byCategory)
    .map(([key, val]) => ({
      label: CATEGORY_LABEL[key] || key,
      percent: val.total > 0 ? Math.round((val.correct / val.total) * 100) : 0,
      correct: val.correct,
      total: val.total,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 6);

  const recentTests = stats.recentScores.slice(0, 8);

  return (
    <div
      ref={reportRef}
      dir="rtl"
      className="bg-white font-sans"
      style={{
        width: "794px",
        minHeight: "1123px",
        fontFamily: "'Segoe UI', 'Arial', sans-serif",
        color: "#1a1a1a",
        padding: 0,
        margin: 0,
      }}
    >
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #166534 0%, #15803d 60%, #16a34a 100%)", padding: "36px 40px 28px", color: "white" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: "26px", fontWeight: "900", marginBottom: "4px", letterSpacing: "0.5px" }}>
              منصة قدراتك
            </div>
            <div style={{ fontSize: "13px", opacity: 0.8 }}>Qodratak Platform</div>
          </div>
          <div style={{ textAlign: "left" }}>
            <div style={{ fontSize: "18px", fontWeight: "700", marginBottom: "3px" }}>تقرير الأداء الأكاديمي</div>
            <div style={{ fontSize: "12px", opacity: 0.8 }}>صدر بتاريخ: {dateStr}</div>
          </div>
        </div>

        {/* Student card */}
        <div style={{ marginTop: "24px", background: "rgba(255,255,255,0.15)", borderRadius: "16px", padding: "16px 20px", display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ width: "52px", height: "52px", borderRadius: "50%", background: "rgba(255,255,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", fontWeight: "900", color: "white" }}>
            {(user.name || "").charAt(0) || "ط"}
          </div>
          <div>
            <div style={{ fontSize: "20px", fontWeight: "800" }}>{user.name || user.username}</div>
            <div style={{ fontSize: "12px", opacity: 0.85, marginTop: "2px" }}>
              المستوى {user.level || 1} &nbsp;•&nbsp; {user.subscription?.type === "premium" ? "مشترك مميز" : "طالب"} &nbsp;•&nbsp; {user.points?.toLocaleString() || 0} نقطة
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: "28px 40px" }}>
        {/* Key Metrics */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "28px" }}>
          {[
            { label: "إجمالي الأسئلة", value: stats.totalSeenQuestions.toLocaleString(), icon: "📚", color: "#eff6ff", border: "#bfdbfe" },
            { label: "معدل الإجابات", value: `${avgScore}%`, icon: "🎯", color: avgScore >= 70 ? "#f0fdf4" : avgScore >= 50 ? "#fffbeb" : "#fef2f2", border: avgScore >= 70 ? "#86efac" : avgScore >= 50 ? "#fcd34d" : "#fca5a5" },
            { label: "الاختبارات المكتملة", value: stats.totalTests.toLocaleString(), icon: "📝", color: "#f5f3ff", border: "#ddd6fe" },
            { label: "سلسلة الأيام 🔥", value: `${getStreakCurrent(goal.streak)} يوم`, icon: "🔥", color: "#fff7ed", border: "#fed7aa" },
          ].map((item, i) => (
            <div key={i} style={{ background: item.color, border: `1.5px solid ${item.border}`, borderRadius: "14px", padding: "16px", textAlign: "center" }}>
              <div style={{ fontSize: "22px", marginBottom: "6px" }}>{item.icon}</div>
              <div style={{ fontSize: "22px", fontWeight: "900", color: "#111" }}>{item.value}</div>
              <div style={{ fontSize: "11px", color: "#666", marginTop: "3px" }}>{item.label}</div>
            </div>
          ))}
        </div>

        {/* Performance by category */}
        {categoryEntries.length > 0 && (
          <div style={{ marginBottom: "24px" }}>
            <div style={{ fontSize: "16px", fontWeight: "800", marginBottom: "14px", color: "#166534", borderRight: "4px solid #16a34a", paddingRight: "10px" }}>
              الأداء حسب التصنيف
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              {categoryEntries.map((cat, i) => (
                <div key={i} style={{ background: "#f9fafb", borderRadius: "12px", padding: "14px 16px", border: "1px solid #e5e7eb" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                    <span style={{ fontSize: "13px", fontWeight: "700" }}>{cat.label}</span>
                    <span style={{ fontSize: "13px", fontWeight: "800", color: getScoreColor(cat.percent) }}>{cat.percent}%</span>
                  </div>
                  <div style={{ height: "8px", background: "#e5e7eb", borderRadius: "99px", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${cat.percent}%`, background: getScoreColor(cat.percent), borderRadius: "99px", transition: "width 0.3s" }} />
                  </div>
                  <div style={{ fontSize: "10px", color: "#9ca3af", marginTop: "5px" }}>
                    {cat.correct} صحيح من {cat.total} سؤال &nbsp;·&nbsp; {getScoreLabel(cat.percent)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          {/* Weak areas */}
          {stats.weakAreas.length > 0 && (
            <div>
              <div style={{ fontSize: "15px", fontWeight: "800", marginBottom: "12px", color: "#b45309", borderRight: "4px solid #f59e0b", paddingRight: "10px" }}>
                ⚠️ مجالات تحتاج تحسين
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {stats.weakAreas.map((area, i) => (
                  <div key={i} style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "10px", padding: "10px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "12px", fontWeight: "600" }}>{area.name}</span>
                    <span style={{ fontSize: "13px", fontWeight: "800", color: "#b45309" }}>{Math.round(area.percent)}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent tests */}
          {recentTests.length > 0 && (
            <div>
              <div style={{ fontSize: "15px", fontWeight: "800", marginBottom: "12px", color: "#166534", borderRight: "4px solid #16a34a", paddingRight: "10px" }}>
                📊 آخر الاختبارات
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {recentTests.map((test, i) => {
                  const d = new Date(test.date);
                  const dStr = d.toLocaleDateString("ar-SA", { month: "short", day: "numeric" });
                  return (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "#f9fafb", borderRadius: "8px", border: "1px solid #e5e7eb" }}>
                      <div>
                        <div style={{ fontSize: "11px", fontWeight: "700" }}>{test.name || test.type}</div>
                        <div style={{ fontSize: "10px", color: "#9ca3af" }}>{dStr}</div>
                      </div>
                      <div style={{ fontSize: "14px", fontWeight: "800", color: getScoreColor(test.score) }}>
                        {Math.round(test.score)}%
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ marginTop: "32px", paddingTop: "16px", borderTop: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: "11px", color: "#9ca3af" }}>
            تم إنشاء هذا التقرير آلياً من منصة قدراتك • qodratak.sa
          </div>
          <div style={{ fontSize: "11px", color: "#9ca3af" }}>
            {dateStr}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PerformanceReportPage() {
  const reportRef = useRef<HTMLDivElement>(null);
  const [generating, setGenerating] = useState(false);
  const [done, setDone] = useState(false);

  const { data: user, isLoading: userLoading } = useQuery<User>({ queryKey: ["/api/user"] });
  const { data: stats, isLoading: statsLoading } = useQuery<DetailedStats>({ queryKey: ["/api/stats/detailed"] });
  const { data: goalData, isLoading: goalLoading } = useQuery<DailyGoalData>({ queryKey: ["/api/daily-goal"] });

  const isLoading = userLoading || statsLoading || goalLoading;

  const generatePDF = async () => {
    if (!reportRef.current || !user || !stats) return;
    setGenerating(true);
    setDone(false);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");

      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
        width: 794,
      });

      const imgData = canvas.toDataURL("image/png", 1.0);
      const pdf = new jsPDF({ orientation: "portrait", unit: "px", format: "a4" });
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = pdf.internal.pageSize.getHeight();
      const ratio = canvas.width / canvas.height;
      const imgW = pdfW;
      const imgH = imgW / ratio;

      if (imgH <= pdfH) {
        pdf.addImage(imgData, "PNG", 0, 0, imgW, imgH);
      } else {
        let y = 0;
        let page = 0;
        while (y < canvas.height) {
          if (page > 0) pdf.addPage();
          const sliceH = Math.min(canvas.height - y, Math.round((pdfH / imgW) * canvas.width));
          const sliceCanvas = document.createElement("canvas");
          sliceCanvas.width = canvas.width;
          sliceCanvas.height = sliceH;
          const ctx = sliceCanvas.getContext("2d")!;
          ctx.drawImage(canvas, 0, -y);
          pdf.addImage(sliceCanvas.toDataURL("image/png"), "PNG", 0, 0, imgW, (sliceH / canvas.width) * imgW);
          y += sliceH;
          page++;
        }
      }

      const safeName = (user.name || user.username || "student").replace(/\s+/g, "_");
      pdf.save(`تقرير_الأداء_${safeName}.pdf`);
      setDone(true);
      setTimeout(() => setDone(false), 3000);
    } catch (e) {
      console.error("PDF generation error:", e);
    } finally {
      setGenerating(false);
    }
  };

  if (!user && !userLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4 text-center p-6" dir="rtl">
        <Trophy className="w-16 h-16 text-gray-200" />
        <p className="text-gray-500 font-bold">يجب تسجيل الدخول لعرض التقرير</p>
        <Link href="/login">
          <button className="px-5 py-2.5 bg-green-600 text-white rounded-xl font-bold text-sm">تسجيل الدخول</button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-10" dir="rtl">
      {/* Top bar */}
      <div className="sticky top-0 z-20 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-4 py-3 flex items-center gap-3">
        <Link href="/">
          <button className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-400">
            <ChevronRight className="w-5 h-5" />
          </button>
        </Link>
        <div className="flex-1">
          <h1 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-600" />
            تقرير الأداء
          </h1>
          <p className="text-xs text-gray-400">صدّر تقريرك الشخصي كـ PDF</p>
        </div>
        <button
          onClick={generatePDF}
          disabled={generating || isLoading}
          data-testid="btn-generate-pdf"
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all",
            done ? "bg-emerald-500 text-white" :
            generating ? "bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-wait" :
            "bg-green-600 text-white hover:bg-green-700 active:scale-95 shadow-sm shadow-green-200 dark:shadow-green-900"
          )}
        >
          {generating ? (
            <>
              <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              جاري الإنشاء...
            </>
          ) : done ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              تم التنزيل!
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              تنزيل PDF
            </>
          )}
        </button>
      </div>

      <div className="max-w-3xl mx-auto px-4 pt-6 space-y-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-12 h-12 rounded-full border-4 border-green-600 border-t-transparent animate-spin" />
            <p className="text-gray-400 text-sm">جاري تحضير التقرير...</p>
          </div>
        ) : user && stats && goalData ? (
          <>
            {/* Info card */}
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl px-4 py-3 flex items-start gap-3">
              <Zap className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-green-700 dark:text-green-300">
                اضغط على <strong>تنزيل PDF</strong> لحفظ تقريرك وتقاسمه مع معلمك أو والديك. التقرير يعرض كامل إحصاءاتك ونقاط قوتك وضعفك.
              </p>
            </div>

            {/* Quick stats preview */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xl font-black text-gray-900 dark:text-white">{stats.totalSeenQuestions.toLocaleString()}</p>
                  <p className="text-xs text-gray-400">سؤال أجبت عليه</p>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <Target className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xl font-black text-gray-900 dark:text-white">{Math.round(stats.averageScore)}%</p>
                  <p className="text-xs text-gray-400">متوسط النتائج</p>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-100/30 flex items-center justify-center">
                  <Brain className="w-5 h-5 text-green-700" />
                </div>
                <div>
                  <p className="text-xl font-black text-gray-900 dark:text-white">{stats.totalTests}</p>
                  <p className="text-xs text-gray-400">اختبار مكتمل</p>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                  <Flame className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-xl font-black text-gray-900 dark:text-white">{getStreakCurrent(goalData.streak)} يوم</p>
                  <p className="text-xs text-gray-400">سلسلة الأيام</p>
                </div>
              </div>
            </div>

            {/* Weak areas preview */}
            {stats.weakAreas.length > 0 && (
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
                <h3 className="font-bold text-sm text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  مجالات تحتاج تحسين
                </h3>
                <div className="space-y-2">
                  {stats.weakAreas.map((area, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">{area.name}</span>
                      <span className="text-sm font-bold text-amber-600">{Math.round(area.percent)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Category performance preview */}
            {Object.keys(stats.byCategory).length > 0 && (
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
                <h3 className="font-bold text-sm text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <Star className="w-4 h-4 text-green-500" />
                  الأداء حسب التصنيف
                </h3>
                <div className="space-y-3">
                  {Object.entries(stats.byCategory)
                    .map(([key, val]) => ({
                      label: CATEGORY_LABEL[key] || key,
                      percent: val.total > 0 ? Math.round((val.correct / val.total) * 100) : 0,
                    }))
                    .sort((a, b) => b.percent - a.percent)
                    .slice(0, 5)
                    .map((cat, i) => (
                      <div key={i}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-600 dark:text-gray-400 font-medium">{cat.label}</span>
                          <span className="font-bold" style={{ color: getScoreColor(cat.percent) }}>{cat.percent}%</span>
                        </div>
                        <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${cat.percent}%`, backgroundColor: getScoreColor(cat.percent) }}
                          />
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Hidden report for PDF rendering */}
            <div style={{ position: "fixed", left: "-9999px", top: 0, zIndex: -1, overflow: "hidden" }}>
              <ReportPreview
                user={user}
                stats={stats}
                goal={goalData}
                reportRef={reportRef as React.RefObject<HTMLDivElement>}
              />
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
