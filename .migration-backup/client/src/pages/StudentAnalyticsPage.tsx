import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";
import {
  TrendingUp, BookOpen, Target, Award, Clock,
  ArrowLeft, Loader2, Eye, AlertCircle, BarChart2
} from "lucide-react";
import { useLocation as useWouter } from "wouter";

interface DetailedStats {
  testResults: any[];
  examBookings: any[];
  byCategory: Record<string, { correct: number; total: number }>;
  recentScores: { date: string; score: number; type: string; name: string }[];
  weakAreas: { name: string; percent: number }[];
  totalSeenQuestions: number;
  totalTests: number;
  averageScore: number;
}

const CATEGORY_COLORS = ['#6366f1', '#a855f7', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

function ScoreCircle({ score, size = 80 }: { score: number; size?: number }) {
  const color = score >= 70 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';
  const circumference = 2 * Math.PI * (size / 2 - 6);
  const offset = circumference - (score / 100) * circumference;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="rotate-[-90deg]">
        <circle cx={size/2} cy={size/2} r={size/2 - 6} fill="none" stroke="#e5e7eb" strokeWidth="6" />
        <circle
          cx={size/2} cy={size/2} r={size/2 - 6} fill="none"
          stroke={color} strokeWidth="6"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
      </svg>
      <span className="absolute font-black text-xl" style={{ color }}>{Math.round(score)}%</span>
    </div>
  );
}

export default function StudentAnalyticsPage() {
  const [, navigate] = useLocation();
  const [resultFilter, setResultFilter] = useState<'all' | 'verbal' | 'quantitative' | 'scheduled'>('all');

  const { data, isLoading, error } = useQuery<DetailedStats>({
    queryKey: ['/api/stats/detailed'],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-teal-700 mx-auto mb-3" />
          <p className="text-gray-400">جاري تحميل الإحصائيات...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" dir="rtl">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-3" />
          <p className="text-gray-600 dark:text-gray-400">يجب تسجيل الدخول لعرض الإحصائيات</p>
          <Button onClick={() => navigate('/login')} className="mt-4 rounded-xl bg-teal-100 text-white">
            تسجيل الدخول
          </Button>
        </div>
      </div>
    );
  }

  const categoryData = Object.entries(data.byCategory).map(([name, val], i) => ({
    name,
    percent: val.total > 0 ? Math.round((val.correct / val.total) * 100) : 0,
    fill: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
  })).sort((a, b) => b.percent - a.percent);

  const recentScores = [...(data.recentScores || [])].reverse().map((s, i) => ({
    ...s,
    index: i + 1,
    scoreRounded: Math.round(s.score),
  }));

  const filteredResults = (data.testResults || []).filter(r => {
    if (resultFilter === 'all') return true;
    if (resultFilter === 'verbal') return r.testType === 'verbal';
    if (resultFilter === 'quantitative') return r.testType === 'quantitative';
    return false;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-500/20 dark:from-gray-950 dark:to-teal-500/10 py-6 px-4 pb-24" dir="rtl">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/')} className="text-gray-400 hover:text-teal-700 transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white">إحصائياتي</h1>
            <p className="text-sm text-gray-500">تحليل شامل لأدائك وتقدمك</p>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'إجمالي الاختبارات', value: data.totalTests, icon: BookOpen, color: "teal" },
            { label: 'متوسط الدرجات', value: `${Math.round(data.averageScore)}%`, icon: Target, color: 'green' },
            { label: 'أسئلة شُوهدت', value: data.totalSeenQuestions, icon: Eye, color: "green" },
            { label: 'اختبارات رسمية', value: (data.examBookings || []).length, icon: Award, color: 'amber' },
          ].map(stat => (
            <div key={stat.label} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 shadow-sm" data-testid={`stat-${stat.label}`}>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-2 bg-${stat.color}-100 dark:bg-${stat.color}-900/20`}>
                <stat.icon className={`h-4 w-4 text-${stat.color}-600`} />
              </div>
              <p className="text-2xl font-black text-gray-900 dark:text-white">{stat.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Recent scores chart */}
        {recentScores.length > 1 && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-teal-700" />
              مسار الدرجات (آخر {recentScores.length} اختبارات)
            </h3>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={recentScores}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="index" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(val: any) => [`${val}%`, 'الدرجة']}
                  labelFormatter={(l) => `اختبار ${l}`}
                />
                <Line
                  type="monotone" dataKey="scoreRounded" stroke="#6366f1" strokeWidth={2.5}
                  dot={{ fill: '#6366f1', r: 4 }} activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Performance by category */}
          {categoryData.length > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
              <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <BarChart2 className="h-4 w-4 text-teal-700" />
                الأداء حسب التصنيف
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={categoryData} layout="vertical">
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} unit="%" />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={80} />
                  <Tooltip formatter={(val: any) => [`${val}%`, 'الأداء']} />
                  <Bar dataKey="percent" radius={[0, 6, 6, 0]}>
                    {categoryData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Weak areas */}
          {data.weakAreas?.length > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
              <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-500" />
                المجالات التي تحتاج تحسيناً
              </h3>
              <div className="space-y-3">
                {data.weakAreas.map((area, i) => (
                  <div key={i} data-testid={`weak-area-${i}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-700 dark:text-gray-300">{area.name}</span>
                      <span className="text-sm font-bold text-red-600">{area.percent.toFixed(0)}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-red-500 to-amber-400 transition-all duration-700"
                        style={{ width: `${area.percent}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <Button
                onClick={() => navigate('/')}
                className="w-full mt-4 bg-teal-100 dark:bg-teal-100/20 text-teal-700 dark:text-teal-700 hover:bg-teal-100 rounded-xl text-sm"
                variant="ghost"
                data-testid="btn-practice-now"
              >
                تدرب الآن على نقاط ضعفك →
              </Button>
            </div>
          )}
        </div>

        {/* Scheduled exams results */}
        {data.examBookings?.length > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Award className="h-4 w-4 text-amber-500" />
              نتائج الاختبارات الرسمية المجدولة
            </h3>
            <div className="space-y-3">
              {data.examBookings.map((b: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl" data-testid={`exam-booking-result-${i}`}>
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                      {new Date(b.scheduledAt).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                    <div className="flex gap-3 mt-1 text-xs text-gray-500">
                      <span>لفظي: {b.verbalPercent?.toFixed(0)}%</span>
                      <span>كمي: {b.quantPercent?.toFixed(0)}%</span>
                      <span>صحيح: {b.correctAnswers}</span>
                      <span>خطأ: {b.wrongAnswers}</span>
                    </div>
                  </div>
                  <ScoreCircle score={b.totalScoreOutOf100 || 0} size={60} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Test history table */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-400" />
              سجل الاختبارات
            </h3>
            <div className="flex gap-1">
              {(['all', 'verbal', 'quantitative'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setResultFilter(f)}
                  data-testid={`filter-${f}`}
                  className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all ${
                    resultFilter === f ? 'bg-teal-100 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {f === 'all' ? 'الكل' : f === 'verbal' ? 'لفظي' : 'كمي'}
                </button>
              ))}
            </div>
          </div>
          {filteredResults.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">لا توجد نتائج</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    <th className="text-right pb-2 text-gray-500 font-medium text-xs">الاختبار</th>
                    <th className="text-center pb-2 text-gray-500 font-medium text-xs">الدرجة</th>
                    <th className="text-center pb-2 text-gray-500 font-medium text-xs">صحيح</th>
                    <th className="text-center pb-2 text-gray-500 font-medium text-xs">خطأ</th>
                    <th className="text-right pb-2 text-gray-500 font-medium text-xs">التاريخ</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredResults.slice(0, 15).map((r: any, i: number) => (
                    <tr key={i} className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors" data-testid={`result-row-${i}`}>
                      <td className="py-2.5 text-gray-800 dark:text-gray-200">{r.testName || r.testType}</td>
                      <td className="py-2.5 text-center">
                        <span className={`font-bold ${r.percentage >= 70 ? 'text-green-600' : r.percentage >= 50 ? 'text-amber-500' : 'text-red-500'}`}>
                          {Math.round(r.percentage)}%
                        </span>
                      </td>
                      <td className="py-2.5 text-center text-green-600 font-medium">{r.correctAnswers}</td>
                      <td className="py-2.5 text-center text-red-500 font-medium">{r.wrongAnswers}</td>
                      <td className="py-2.5 text-right text-gray-500 text-xs">
                        {new Date(r.completedAt).toLocaleDateString('ar-SA')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
