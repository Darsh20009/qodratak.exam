import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Trophy,
  Target,
  Clock,
  Award,
  TrendingUp,
  BookOpen,
  Calculator,
  Star,
  Zap,
  Brain,
  CheckCircle2,
  XCircle,
  BarChart3
} from "lucide-react";
import { DetailedExamResult, SubcategoryResult } from "@/../../shared/examUtils";

interface DetailedTestResultsProps {
  results: DetailedExamResult;
  examType: string;
  onClose: () => void;
}

export function DetailedTestResults({ results, examType, onClose }: DetailedTestResultsProps) {
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getGradeColor = (percentage: number) => {
    if (percentage >= 90) return "from-emerald-500 to-green-400";
    if (percentage >= 80) return "from-blue-500 to-cyan-400";
    if (percentage >= 70) return "from-yellow-500 to-orange-400";
    return "from-red-500 to-pink-400";
  };

  const SubcategoryCard = ({ result, icon }: { result: SubcategoryResult; icon: React.ReactNode }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 dark:border-slate-700/50"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${getGradeColor(result.percentage)} flex items-center justify-center text-white shadow-lg`}>
            {icon}
          </div>
          <div>
            <h4 className="font-semibold text-gray-800 dark:text-white text-sm">
              {result.subcategory}
            </h4>
            <Badge className={`text-xs ${result.color.includes('emerald') ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30' :
              result.color.includes('blue') ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30' :
              result.color.includes('yellow') ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30' :
              'bg-red-100 text-red-800 dark:bg-red-900/30'
              }`}>
              {result.level}
            </Badge>
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-gray-800 dark:text-white">
            {result.correct}/{result.total}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {result.percentage}%
          </div>
        </div>
      </div>
      
      <div className="space-y-2">
        <Progress 
          value={result.percentage} 
          className="h-2"
        />
        <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-green-500" />
            {result.correct} صحيح
          </span>
          <span className="flex items-center gap-1">
            <XCircle className="w-3 h-3 text-red-500" />
            {result.total - result.correct} خطأ
          </span>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8 rounded-t-2xl">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/20 mb-4">
              <BarChart3 className="w-10 h-10" />
            </div>
            <h2 className="text-3xl font-bold mb-2">📊 النتائج التفصيلية</h2>
            <p className="text-white/90 text-lg">
              تحليل شامل لأدائك في {examType === 'qiyas' ? 'اختبار قياس' : 'الاختبار التأهيلي'}
            </p>
          </motion.div>
          
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="p-8">
          {/* Overall Performance */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border-indigo-200 dark:border-indigo-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Trophy className="w-6 h-6 text-yellow-500" />
                  الأداء العام
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-800 dark:text-white mb-1">
                      {results.totalScore}/{results.totalQuestions}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">إجمالي النقاط</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                      {results.overallPercentage}%
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">النسبة المئوية</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-1">
                      {results.level}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">المستوى</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-1">
                      {formatTime(results.timeTaken)}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">الوقت المستغرق</div>
                  </div>
                </div>
                
                <div className="mt-6">
                  <Progress 
                    value={results.overallPercentage} 
                    className="h-4"
                  />
                </div>
                
                {/* Achievements */}
                {results.achievements.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-semibold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                      <Award className="w-5 h-5 text-yellow-500" />
                      الإنجازات المحققة
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {results.achievements.map((achievement, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                            {achievement}
                          </Badge>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Verbal Section Results */}
          {results.verbalResults.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white shadow-lg">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-800 dark:text-white">القسم اللفظي</h3>
                  <p className="text-gray-600 dark:text-gray-400">تفصيل الأداء في الأقسام اللفظية</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.verbalResults.map((result, index) => (
                  <SubcategoryCard
                    key={result.subcategory}
                    result={result}
                    icon={
                      result.subcategory.includes('التناظر') ? <Target className="w-5 h-5" /> :
                      result.subcategory.includes('إكمال') ? <BookOpen className="w-5 h-5" /> :
                      result.subcategory.includes('استيعاب') ? <Brain className="w-5 h-5" /> :
                      <Star className="w-5 h-5" />
                    }
                  />
                ))}
              </div>
            </motion.div>
          )}

          {/* Quantitative Section Results */}
          {results.quantitativeResults.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mb-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white shadow-lg">
                  <Calculator className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-800 dark:text-white">القسم الكمي</h3>
                  <p className="text-gray-600 dark:text-gray-400">تفصيل الأداء في الأقسام الكمية</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.quantitativeResults.map((result, index) => (
                  <SubcategoryCard
                    key={result.subcategory}
                    result={result}
                    icon={
                      result.subcategory.includes('الهندسة') ? <Target className="w-5 h-5" /> :
                      result.subcategory.includes('عمليات') ? <Calculator className="w-5 h-5" /> :
                      result.subcategory.includes('النسبة') ? <BarChart3 className="w-5 h-5" /> :
                      <Zap className="w-5 h-5" />
                    }
                  />
                ))}
              </div>
            </motion.div>
          )}

          {/* Performance Insights */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-amber-200 dark:border-amber-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <TrendingUp className="w-6 h-6 text-amber-600" />
                  نصائح للتحسين
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-800 dark:text-white mb-2">نقاط القوة:</h4>
                    <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                      {[...results.verbalResults, ...results.quantitativeResults]
                        .filter(r => r.percentage >= 80)
                        .slice(0, 3)
                        .map((result, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                            أداء ممتاز في {result.subcategory}
                          </li>
                        ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 dark:text-white mb-2">مجالات التحسين:</h4>
                    <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                      {[...results.verbalResults, ...results.quantitativeResults]
                        .filter(r => r.percentage < 70)
                        .slice(0, 3)
                        .map((result, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <Target className="w-4 h-4 text-blue-500" />
                            ركز أكثر على {result.subcategory}
                          </li>
                        ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}