import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { SEO } from "@/components/SEO";
import {
  Search, ArrowLeft, Clock, BarChart3, AlertTriangle,
  TrendingDown, Calendar, Zap, Brain, Target
} from "lucide-react";

function PatternCard({ icon: Icon, title, value, detail, color }: {
  icon: React.ElementType;
  title: string;
  value: string;
  detail: string;
  color: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-4 flex items-start gap-3" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <div className="text-xs text-muted-foreground">{title}</div>
        <div className="text-sm font-bold text-foreground mt-0.5">{value}</div>
        <div className="text-xs text-muted-foreground mt-1 leading-relaxed">{detail}</div>
      </div>
    </div>
  );
}

export default function AiPatternAnalysis() {
  const { data: user } = useQuery<any>({ queryKey: ["/api/user"] });
  const userId = user?.id || user?._id;

  const { data: patterns, isLoading } = useQuery<{
    totalErrors: number;
    topMistakeCategory: string;
    avgTimePerQuestion: number;
    peakErrorTime: string;
    accuracyBySection: { section: string; accuracy: number }[];
    worstSubcategories: { name: string; errorRate: number }[];
    bestSubcategories: { name: string; accuracy: number }[];
    timePattern: string;
    repeatMistakeRate: number;
  }>({
    queryKey: ["/api/error-analysis"],
    enabled: !!userId,
  });

  return (
    <>
      <SEO title="تحليل الأنماط الخفية - منصة قدراتك" description="اكتشف أنماط أخطائك الخفية" url="/ai-hub/pattern-analysis" />

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
            <div className="w-12 h-12 rounded-2xl bg-teal-100/10 border border-teal-400/20 flex items-center justify-center flex-shrink-0">
              <Search className="w-6 h-6 text-teal-700" />
            </div>
            <div>
              <h1 className="text-xl font-black text-foreground">اكتشاف الأنماط الخفية</h1>
              <p className="text-sm text-muted-foreground mt-1">أعمق من مجرد عدد الأخطاء</p>
            </div>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-8 h-8 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-muted-foreground">جارٍ تحليل أنماط أخطائك...</p>
            </div>
          ) : !patterns || patterns.totalErrors === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
              <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
                <BarChart3 className="w-7 h-7 text-muted-foreground" />
              </div>
              <p className="text-foreground font-semibold">لا يوجد بيانات كافية بعد</p>
              <p className="text-sm text-muted-foreground max-w-xs">أجرِ بعض الاختبارات لتحليل أنماط أخطائك</p>
              <Link href="/question-bank">
                <button className="mt-2 px-5 py-2.5 bg-teal-100 hover:bg-teal-100 text-white text-sm font-semibold rounded-xl transition-colors" data-testid="button-start-qbank-from-patterns">
                  ابدأ من بنك الأسئلة
                </button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">

              {/* Summary Banner */}
              <div className="rounded-2xl border bg-gradient-to-br from-green-500/10 to-teal-500/5 border-teal-400/20 p-5 space-y-2">
                <div className="flex items-center gap-2 text-teal-700">
                  <Zap className="w-4 h-4" />
                  <span className="text-xs font-semibold uppercase tracking-wider">الاكتشاف الرئيسي</span>
                </div>
                <p className="text-foreground font-bold text-base leading-relaxed">
                  {patterns.timePattern || `معظم أخطائك في قسم "${patterns.topMistakeCategory}" — معدل خطأ مرتفع`}
                </p>
                <p className="text-sm text-muted-foreground">
                  إجمالي الأخطاء المحللة: {patterns.totalErrors} خطأ · نسبة التكرار: {patterns.repeatMistakeRate}%
                </p>
              </div>

              {/* Pattern Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <PatternCard
                  icon={Clock}
                  title="وقت السؤال الواحد"
                  value={`${patterns.avgTimePerQuestion} ثانية`}
                  detail={patterns.avgTimePerQuestion > 90 ? "وقت أعلى من المثالي (60-75 ث)" : "ضمن النطاق الجيد"}
                  color="bg-blue-500/10 border border-blue-500/20 text-blue-400"
                />
                <PatternCard
                  icon={TrendingDown}
                  title="وقت ذروة الأخطاء"
                  value={patterns.peakErrorTime}
                  detail="الفترة التي ترتفع فيها نسبة الخطأ بشكل ملحوظ"
                  color="bg-rose-500/10 border border-rose-500/20 text-rose-400"
                />
                <PatternCard
                  icon={AlertTriangle}
                  title="أكثر قسم يُخطأ فيه"
                  value={patterns.topMistakeCategory}
                  detail="يحتاج إلى تدريب مكثف ومركّز"
                  color="bg-amber-500/10 border border-amber-500/20 text-amber-400"
                />
                <PatternCard
                  icon={Brain}
                  title="أخطاء متكررة"
                  value={`${patterns.repeatMistakeRate}%`}
                  detail="من أخطائك كانت في نفس الأنواع التي أخطأت فيها سابقاً"
                  color="bg-teal-100/10 border border-teal-400/20 text-teal-700"
                />
              </div>

              {/* Accuracy by section */}
              {patterns.accuracyBySection && patterns.accuracyBySection.length > 0 && (
                <div className="rounded-2xl border bg-card p-5 space-y-4" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Target className="w-4 h-4 text-muted-foreground" />
                    الدقة حسب القسم
                  </h3>
                  <div className="space-y-3">
                    {patterns.accuracyBySection.map((s, i) => (
                      <div key={i} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-foreground font-medium">{s.section}</span>
                          <span className={s.accuracy >= 70 ? "text-emerald-400" : s.accuracy >= 50 ? "text-amber-400" : "text-red-400"}>
                            {s.accuracy}%
                          </span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              s.accuracy >= 70 ? "bg-emerald-500" : s.accuracy >= 50 ? "bg-amber-500" : "bg-red-500"
                            }`}
                            style={{ width: `${s.accuracy}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Worst Subcategories */}
              {patterns.worstSubcategories && patterns.worstSubcategories.length > 0 && (
                <div className="rounded-2xl border bg-card p-4 space-y-3" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                    أكثر الأنواع إشكالية
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {patterns.worstSubcategories.map((sub, i) => (
                      <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400">
                        {sub.name} ({sub.errorRate}% خطأ)
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* CTA */}
              <Link href="/mistake-challenge">
                <button className="w-full py-3 bg-teal-100 hover:bg-teal-100 text-white text-sm font-bold rounded-xl transition-colors" data-testid="button-start-mistake-challenge">
                  تدرّب على نقاط ضعفك الآن
                </button>
              </Link>

            </div>
          )}
        </div>
      </div>
    </>
  );
}
