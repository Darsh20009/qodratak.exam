
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  BarChart3,
  Sparkles,
  Crown,
  Medal,
  Flame,
  Rocket,
  Lightning,
  Eye,
  Heart,
  Gem,
  ChevronRight,
  Gift,
  Music,
  Palette
} from "lucide-react";
import { DetailedExamResult, SubcategoryResult } from "@/../../shared/examUtils";

interface DetailedTestResultsProps {
  results: DetailedExamResult;
  examType: string;
  onClose: () => void;
}

export function DetailedTestResults({ results, examType, onClose }: DetailedTestResultsProps) {
  const [showFireworks, setShowFireworks] = useState(false);
  const [currentView, setCurrentView] = useState<'overview' | 'verbal' | 'quantitative' | 'insights'>('overview');
  const [animationStage, setAnimationStage] = useState(0);

  useEffect(() => {
    // إظهار الألعاب النارية للدرجات العالية
    if (results.overallPercentage >= 85) {
      setShowFireworks(true);
      setTimeout(() => setShowFireworks(false), 3000);
    }

    // تدرج في إظهار المحتوى
    const timer = setInterval(() => {
      setAnimationStage(prev => prev + 1);
    }, 300);

    return () => clearInterval(timer);
  }, [results.overallPercentage]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getGradeColor = (percentage: number) => {
    if (percentage >= 90) return "from-emerald-400 via-green-400 to-lime-400";
    if (percentage >= 80) return "from-blue-400 via-cyan-400 to-sky-400";
    if (percentage >= 70) return "from-yellow-400 via-orange-400 to-amber-400";
    return "from-red-400 via-pink-400 to-rose-400";
  };

  const getPerformanceEmoji = (percentage: number) => {
    if (percentage >= 95) return "🏆";
    if (percentage >= 90) return "🥇";
    if (percentage >= 80) return "🥈";
    if (percentage >= 70) return "🥉";
    if (percentage >= 60) return "⭐";
    return "💪";
  };

  const getMotivationalMessage = (percentage: number) => {
    if (percentage >= 95) return "أداء استثنائي! أنت نجم حقيقي! ✨";
    if (percentage >= 90) return "ممتاز جداً! استمر في التألق! 🌟";
    if (percentage >= 80) return "أداء رائع! أنت على الطريق الصحيح! 🚀";
    if (percentage >= 70) return "جيد جداً! يمكنك الوصول للقمة! 🎯";
    if (percentage >= 60) return "جيد! استمر في التحسن! 💪";
    return "بداية رائعة! كل خطوة تقربك من النجاح! 🌱";
  };

  // مكون الألعاب النارية
  const Fireworks = () => (
    <div className="fixed inset-0 pointer-events-none z-50">
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 bg-gradient-to-r from-yellow-400 to-red-500 rounded-full"
          initial={{
            x: "50%",
            y: "50%",
            scale: 0,
          }}
          animate={{
            x: `${50 + (Math.random() - 0.5) * 60}%`,
            y: `${30 + (Math.random() - 0.5) * 40}%`,
            scale: [0, 1, 0],
          }}
          transition={{
            duration: 2,
            delay: i * 0.2,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );

  // مكون شريط التنقل المبدع
  const CreativeNavigation = () => (
    <div className="flex justify-center mb-8">
      <div className="bg-white/20 backdrop-blur-md rounded-full p-2 border border-white/30">
        <div className="flex gap-2">
          {[
            { id: 'overview', icon: BarChart3, label: 'النظرة العامة' },
            { id: 'verbal', icon: BookOpen, label: 'اللفظي' },
            { id: 'quantitative', icon: Calculator, label: 'الكمي' },
            { id: 'insights', icon: Brain, label: 'التحليل' }
          ].map((tab, index) => (
            <motion.button
              key={tab.id}
              onClick={() => setCurrentView(tab.id as any)}
              className={`relative px-6 py-3 rounded-full text-sm font-medium transition-all duration-300 ${
                currentView === tab.id
                  ? 'bg-white text-gray-800 shadow-lg'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <tab.icon className="w-4 h-4 inline-block mr-2" />
              {tab.label}
              {currentView === tab.id && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-white rounded-full -z-10"
                  transition={{ type: "spring", duration: 0.6 }}
                />
              )}
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );

  // مكون النتيجة الإجمالية المبدع
  const CreativeOverallScore = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, type: "spring" }}
      className="relative mb-8"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-3xl blur-xl"></div>
      <Card className="relative bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"></div>
        <CardContent className="p-8">
          <div className="text-center mb-6">
            <motion.div
              className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 mb-4 shadow-2xl"
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <span className="text-4xl">{getPerformanceEmoji(results.overallPercentage)}</span>
            </motion.div>
            <h3 className="text-3xl font-bold text-white mb-2">
              {results.totalScore}/{results.totalQuestions}
            </h3>
            <div className="text-6xl font-black bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent mb-2">
              {results.overallPercentage}%
            </div>
            <p className="text-white/90 text-lg">{getMotivationalMessage(results.overallPercentage)}</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { 
                label: 'المستوى', 
                value: results.level, 
                icon: Crown, 
                color: 'from-purple-500 to-pink-500',
                delay: 0 
              },
              { 
                label: 'الوقت', 
                value: formatTime(results.timeTaken), 
                icon: Clock, 
                color: 'from-blue-500 to-cyan-500',
                delay: 0.1 
              },
              { 
                label: 'الإنجازات', 
                value: results.achievements.length.toString(), 
                icon: Award, 
                color: 'from-green-500 to-emerald-500',
                delay: 0.2 
              },
              { 
                label: 'التقييم', 
                value: results.overallPercentage >= 90 ? 'A+' : 
                       results.overallPercentage >= 80 ? 'A' :
                       results.overallPercentage >= 70 ? 'B' : 'C', 
                icon: Medal, 
                color: 'from-orange-500 to-red-500',
                delay: 0.3 
              }
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: stat.delay, duration: 0.6 }}
                className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20 hover:bg-white/20 transition-all duration-300"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3 mx-auto shadow-lg`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                  <div className="text-sm text-white/70">{stat.label}</div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/80">التقدم العام</span>
              <span className="text-white font-bold">{results.overallPercentage}%</span>
            </div>
            <div className="relative h-4 bg-white/20 rounded-full overflow-hidden">
              <motion.div
                className={`h-full bg-gradient-to-r ${getGradeColor(results.overallPercentage)} rounded-full relative`}
                initial={{ width: 0 }}
                animate={{ width: `${results.overallPercentage}%` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/30"></div>
              </motion.div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  // مكون البطاقة الفرعية المبدع
  const CreativeSubcategoryCard = ({ result, icon, index }: { result: SubcategoryResult; icon: React.ReactNode; index: number }) => (
    <motion.div
      initial={{ opacity: 0, x: -50, rotateY: -90 }}
      animate={{ opacity: 1, x: 0, rotateY: 0 }}
      transition={{ delay: index * 0.1, duration: 0.6, type: "spring" }}
      whileHover={{ 
        scale: 1.05, 
        rotateY: 5,
        transition: { type: "spring", stiffness: 300 }
      }}
      className="group relative"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-2xl blur-sm group-hover:blur-none transition-all duration-300"></div>
      <div className={`relative bg-gradient-to-br ${getGradeColor(result.percentage)} p-0.5 rounded-2xl`}>
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm rounded-2xl p-6 h-full">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <motion.div 
                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getGradeColor(result.percentage)} flex items-center justify-center text-white shadow-lg`}
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
              >
                {icon}
              </motion.div>
              <div>
                <h4 className="font-bold text-gray-800 dark:text-white text-sm mb-1">
                  {result.subcategory}
                </h4>
                <Badge className={`text-xs ${
                  result.percentage >= 85 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30' :
                  result.percentage >= 70 ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30' :
                  result.percentage >= 50 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30' :
                  'bg-red-100 text-red-800 dark:bg-red-900/30'
                }`}>
                  {result.level}
                </Badge>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-black text-gray-800 dark:text-white">
                {result.correct}/{result.total}
              </div>
              <div className={`text-lg font-bold ${
                result.percentage >= 85 ? 'text-emerald-600' :
                result.percentage >= 70 ? 'text-blue-600' :
                result.percentage >= 50 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {result.percentage}%
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="relative">
              <Progress 
                value={result.percentage} 
                className="h-3 bg-gray-200 dark:bg-gray-700"
              />
              <motion.div
                className="absolute top-0 left-0 h-3 bg-gradient-to-r from-white/50 to-transparent rounded-full"
                animate={{ x: [-20, 100, -20] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                style={{ width: `${result.percentage}%` }}
              />
            </div>
            
            <div className="flex justify-between text-sm">
              <motion.span 
                className="flex items-center gap-2 text-emerald-600 font-medium"
                whileHover={{ scale: 1.1 }}
              >
                <CheckCircle2 className="w-4 h-4" />
                {result.correct} صحيح
              </motion.span>
              <motion.span 
                className="flex items-center gap-2 text-red-500 font-medium"
                whileHover={{ scale: 1.1 }}
              >
                <XCircle className="w-4 h-4" />
                {result.total - result.correct} خطأ
              </motion.span>
            </div>

            {/* شريط تحسن مقترح */}
            <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-xl">
              <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                <Target className="w-3 h-3" />
                <span>هدف التحسن: {Math.min(result.percentage + 15, 100)}%</span>
              </div>
              <div className="mt-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-400 to-purple-400 rounded-full"
                  style={{ width: `${(result.percentage / 100) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* خلفية متحركة مبدعة */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%239C92AC" fill-opacity="0.1"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>
        
        {/* جزيئات متحركة */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white/30 rounded-full"
            animate={{
              x: [Math.random() * window.innerWidth, Math.random() * window.innerWidth],
              y: [Math.random() * window.innerHeight, Math.random() * window.innerHeight],
            }}
            transition={{
              duration: Math.random() * 10 + 5,
              repeat: Infinity,
              ease: "linear",
            }}
            style={{
              left: Math.random() * 100 + '%',
              top: Math.random() * 100 + '%',
            }}
          />
        ))}
      </div>

      {showFireworks && <Fireworks />}

      {/* المحتوى الرئيسي */}
      <div className="relative h-full overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="min-h-full flex items-center justify-center p-4"
        >
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl max-w-7xl w-full max-h-[95vh] overflow-y-auto border border-white/20">
            {/* الرأس المبدع */}
            <div className="relative p-8 text-center">
              <motion.button
                onClick={onClose}
                className="absolute top-4 right-4 w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all duration-300 text-white hover:scale-110"
                whileHover={{ rotate: 90 }}
                whileTap={{ scale: 0.9 }}
              >
                ✕
              </motion.button>

              <motion.div
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8 }}
                className="mb-6"
              >
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 mb-4 shadow-2xl">
                  <BarChart3 className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-4xl font-black text-white mb-2 bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                  🎯 النتائج التفصيلية
                </h2>
                <p className="text-white/90 text-xl">
                  تحليل شامل ومبدع لأدائك في {examType === 'qiyas' ? 'اختبار قياس' : 'الاختبار التأهيلي'}
                </p>
              </motion.div>

              <CreativeNavigation />
            </div>

            <div className="px-8 pb-8">
              <AnimatePresence mode="wait">
                {currentView === 'overview' && (
                  <motion.div
                    key="overview"
                    initial={{ opacity: 0, x: -100 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 100 }}
                    transition={{ duration: 0.5 }}
                  >
                    <CreativeOverallScore />
                    
                    {/* الإنجازات المبدعة */}
                    {results.achievements.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="mb-8"
                      >
                        <Card className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl overflow-hidden">
                          <CardHeader>
                            <CardTitle className="flex items-center gap-3 text-2xl text-white">
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                                <Trophy className="w-6 h-6 text-white" />
                              </div>
                              🏆 الإنجازات المحققة
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {results.achievements.map((achievement, index) => (
                                <motion.div
                                  key={index}
                                  initial={{ opacity: 0, scale: 0, rotate: -180 }}
                                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                                  transition={{ 
                                    delay: index * 0.2, 
                                    type: "spring",
                                    stiffness: 200
                                  }}
                                  whileHover={{ scale: 1.05, rotate: 5 }}
                                  className="bg-gradient-to-br from-yellow-400 to-orange-500 p-4 rounded-xl text-white font-bold text-center shadow-lg cursor-pointer"
                                >
                                  <Sparkles className="w-6 h-6 mx-auto mb-2" />
                                  {achievement}
                                </motion.div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    )}
                  </motion.div>
                )}

                {currentView === 'verbal' && results.verbalResults.length > 0 && (
                  <motion.div
                    key="verbal"
                    initial={{ opacity: 0, x: -100 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 100 }}
                    transition={{ duration: 0.5 }}
                  >
                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white shadow-2xl">
                        <BookOpen className="w-8 h-8" />
                      </div>
                      <div>
                        <h3 className="text-3xl font-black text-white">📚 القسم اللفظي</h3>
                        <p className="text-white/80 text-lg">تفصيل مبدع للأداء في الأقسام اللفظية</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {results.verbalResults.map((result, index) => (
                        <CreativeSubcategoryCard
                          key={result.subcategory}
                          result={result}
                          index={index}
                          icon={
                            result.subcategory.includes('التناظر') ? <Target className="w-6 h-6" /> :
                            result.subcategory.includes('إكمال') ? <BookOpen className="w-6 h-6" /> :
                            result.subcategory.includes('استيعاب') ? <Brain className="w-6 h-6" /> :
                            <Star className="w-6 h-6" />
                          }
                        />
                      ))}
                    </div>
                  </motion.div>
                )}

                {currentView === 'quantitative' && results.quantitativeResults.length > 0 && (
                  <motion.div
                    key="quantitative"
                    initial={{ opacity: 0, x: -100 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 100 }}
                    transition={{ duration: 0.5 }}
                  >
                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white shadow-2xl">
                        <Calculator className="w-8 h-8" />
                      </div>
                      <div>
                        <h3 className="text-3xl font-black text-white">🔢 القسم الكمي</h3>
                        <p className="text-white/80 text-lg">تفصيل مبدع للأداء في الأقسام الكمية</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {results.quantitativeResults.map((result, index) => (
                        <CreativeSubcategoryCard
                          key={result.subcategory}
                          result={result}
                          index={index}
                          icon={
                            result.subcategory.includes('الهندسة') ? <Gem className="w-6 h-6" /> :
                            result.subcategory.includes('عمليات') ? <Calculator className="w-6 h-6" /> :
                            result.subcategory.includes('النسبة') ? <BarChart3 className="w-6 h-6" /> :
                            result.subcategory.includes('المقارنات') ? <TrendingUp className="w-6 h-6" /> :
                            result.subcategory.includes('المعادلات') ? <Zap className="w-6 h-6" /> :
                            result.subcategory.includes('الإحصاء') ? <Target className="w-6 h-6" /> :
                            <Lightning className="w-6 h-6" />
                          }
                        />
                      ))}
                    </div>
                  </motion.div>
                )}

                {currentView === 'insights' && (
                  <motion.div
                    key="insights"
                    initial={{ opacity: 0, x: -100 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 100 }}
                    transition={{ duration: 0.5 }}
                  >
                    <Card className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-xl border border-white/20 rounded-2xl overflow-hidden">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-3 text-2xl text-white">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                            <Brain className="w-6 h-6 text-white" />
                          </div>
                          🎯 تحليل ذكي ونصائح مبدعة
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                          <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                          >
                            <h4 className="font-bold text-white mb-4 flex items-center gap-2 text-xl">
                              <Crown className="w-6 h-6 text-yellow-400" />
                              نقاط القوة الرائعة:
                            </h4>
                            <div className="space-y-3">
                              {[...results.verbalResults, ...results.quantitativeResults]
                                .filter(r => r.percentage >= 70)
                                .slice(0, 4)
                                .map((result, index) => (
                                  <motion.div
                                    key={index}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="flex items-center gap-3 p-3 bg-green-500/20 backdrop-blur-sm rounded-xl border border-green-500/30"
                                  >
                                    <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                                    <span className="text-white/90">
                                      أداء {result.percentage >= 85 ? 'استثنائي' : 'ممتاز'} في {result.subcategory} ({result.percentage}%)
                                    </span>
                                  </motion.div>
                                ))}
                            </div>
                          </motion.div>

                          <motion.div
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 }}
                          >
                            <h4 className="font-bold text-white mb-4 flex items-center gap-2 text-xl">
                              <Rocket className="w-6 h-6 text-blue-400" />
                              فرص التطوير المبدعة:
                            </h4>
                            <div className="space-y-3">
                              {[...results.verbalResults, ...results.quantitativeResults]
                                .filter(r => r.percentage < 70)
                                .slice(0, 4)
                                .map((result, index) => (
                                  <motion.div
                                    key={index}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="flex items-center gap-3 p-3 bg-blue-500/20 backdrop-blur-sm rounded-xl border border-blue-500/30"
                                  >
                                    <Target className="w-5 h-5 text-blue-400 flex-shrink-0" />
                                    <span className="text-white/90">
                                      فرصة ذهبية للتحسن في {result.subcategory} (هدف: +{15}%)
                                    </span>
                                  </motion.div>
                                ))}
                            </div>
                          </motion.div>
                        </div>

                        {/* نصائح مبدعة إضافية */}
                        <motion.div
                          initial={{ opacity: 0, y: 30 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.6 }}
                          className="mt-8 p-6 bg-gradient-to-r from-orange-500/20 to-red-500/20 backdrop-blur-sm rounded-2xl border border-orange-500/30"
                        >
                          <h4 className="font-bold text-white mb-4 flex items-center gap-2 text-xl">
                            <Sparkles className="w-6 h-6 text-orange-400" />
                            خطة التحسن المبدعة:
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="text-center">
                              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-400 rounded-xl flex items-center justify-center mx-auto mb-2">
                                <BookOpen className="w-6 h-6 text-white" />
                              </div>
                              <p className="text-white/90 text-sm">
                                مراجعة يومية لمدة 30 دقيقة
                              </p>
                            </div>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-400 rounded-xl flex items-center justify-center mx-auto mb-2">
                                <Target className="w-6 h-6 text-white" />
                              </div>
                              <p className="text-white/90 text-sm">
                                حل 10 أسئلة تدريبية يومياً
                              </p>
                            </div>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-400 rounded-xl flex items-center justify-center mx-auto mb-2">
                                <Trophy className="w-6 h-6 text-white" />
                              </div>
                              <p className="text-white/90 text-sm">
                                اختبار تقييمي أسبوعي
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
