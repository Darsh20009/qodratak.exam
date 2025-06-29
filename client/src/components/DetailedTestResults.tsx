
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
  BarChart3,
  Sparkles,
  Crown,
  Gem,
  Download
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

  const roundPercentage = (percentage: number) => {
    return Math.round(percentage);
  };

  const downloadSubcategoryQuestions = async (subcategory: string) => {
    try {
      const response = await fetch(`/api/questions?subcategory=${encodeURIComponent(subcategory)}`);
      const questions = await response.json();
      
      const dataStr = JSON.stringify(questions, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `اسئلة_${subcategory.replace(/\s+/g, '_')}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('فشل في تحميل الأسئلة:', error);
    }
  };

  const getGradeColor = (percentage: number) => {
    if (percentage >= 90) return "from-emerald-500 via-green-400 to-teal-400";
    if (percentage >= 80) return "from-blue-500 via-cyan-400 to-indigo-400";
    if (percentage >= 70) return "from-yellow-500 via-amber-400 to-orange-400";
    return "from-red-500 via-pink-400 to-rose-400";
  };

  const getGradientBackground = (percentage: number) => {
    if (percentage >= 90) return "bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 dark:from-emerald-950/20 dark:via-green-950/20 dark:to-teal-950/20";
    if (percentage >= 80) return "bg-gradient-to-br from-blue-50 via-cyan-50 to-indigo-50 dark:from-blue-950/20 dark:via-cyan-950/20 dark:to-indigo-950/20";
    if (percentage >= 70) return "bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50 dark:from-yellow-950/20 dark:via-amber-950/20 dark:to-orange-950/20";
    return "bg-gradient-to-br from-red-50 via-pink-50 to-rose-50 dark:from-red-950/20 dark:via-pink-950/20 dark:to-rose-950/20";
  };

  const SubcategoryCard = ({ result, icon }: { result: SubcategoryResult; icon: React.ReactNode }) => {
    const roundedPercentage = roundPercentage(result.percentage);
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        whileHover={{ 
          scale: 1.02, 
          y: -5,
          transition: { duration: 0.2 }
        }}
        className={`${getGradientBackground(result.percentage)} relative overflow-hidden backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300`}
      >
        {/* زر التحميل الفاخر */}
        <motion.button
          onClick={() => downloadSubcategoryQuestions(result.subcategory)}
          className="absolute top-4 left-4 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all duration-300 backdrop-blur-sm z-20"
          whileHover={{ scale: 1.1, rotate: 180 }}
          whileTap={{ scale: 0.9 }}
          title={`تحميل أسئلة ${result.subcategory}`}
        >
          <Download className="w-4 h-4 text-white" />
        </motion.button>

        {/* Floating particles effect */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white/30 rounded-full"
              animate={{
                x: [0, Math.random() * 100, 0],
                y: [0, Math.random() * 100, 0],
                opacity: [0.3, 0.8, 0.3],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
            />
          ))}
        </div>

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <motion.div 
                className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${getGradeColor(result.percentage)} flex items-center justify-center text-white shadow-2xl`}
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
              >
                <div className="relative">
                  {icon}
                  <motion.div
                    className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full"
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </div>
              </motion.div>
              <div>
                <h4 className="font-bold text-gray-800 dark:text-white text-lg mb-1">
                  {result.subcategory}
                </h4>
                <Badge className={`text-sm font-semibold px-3 py-1 ${
                  result.percentage >= 90 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 border-emerald-300' :
                  result.percentage >= 80 ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 border-blue-300' :
                  result.percentage >= 70 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 border-yellow-300' :
                  'bg-red-100 text-red-800 dark:bg-red-900/30 border-red-300'
                }`}>
                  {result.level}
                </Badge>
              </div>
            </div>
            <div className="text-right">
              <motion.div 
                className="text-2xl font-bold text-gray-800 dark:text-white mb-1"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring" }}
              >
                {result.correct}/{result.total}
              </motion.div>
              <div className="text-lg text-gray-600 dark:text-gray-300 font-semibold">
                {roundedPercentage}%
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="relative">
              <Progress 
                value={roundedPercentage} 
                className="h-3 bg-white/50"
              />
              <motion.div
                className="absolute top-0 left-0 h-3 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 opacity-50"
                initial={{ width: 0 }}
                animate={{ width: `${roundedPercentage}%` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
              />
            </div>
            <div className="flex justify-between text-sm">
              <motion.span 
                className="flex items-center gap-2 text-green-600 dark:text-green-400 font-medium"
                whileHover={{ scale: 1.05 }}
              >
                <CheckCircle2 className="w-4 h-4" />
                {result.correct} صحيح
              </motion.span>
              <motion.span 
                className="flex items-center gap-2 text-red-600 dark:text-red-400 font-medium"
                whileHover={{ scale: 1.05 }}
              >
                <XCircle className="w-4 h-4" />
                {result.total - result.correct} خطأ
              </motion.span>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* خلفية متحركة مبدعة */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%25239C92AC%22%20fill-opacity%3D%220.1%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>
        
        {/* جزيئات متحركة */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-white/20 rounded-full"
            animate={{
              x: [0, Math.random() * window.innerWidth, 0],
              y: [0, Math.random() * window.innerHeight, 0],
              opacity: [0.2, 0.8, 0.2],
            }}
            transition={{
              duration: 8 + Math.random() * 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
          />
        ))}
      </div>

      {/* المحتوى الرئيسي */}
      <div className="relative z-10 h-full flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 50 }}
          transition={{ duration: 0.5, type: "spring", bounce: 0.3 }}
          className="bg-white/10 dark:bg-slate-900/10 backdrop-blur-2xl rounded-3xl shadow-2xl max-w-7xl w-full max-h-[95vh] overflow-y-auto border border-white/20"
        >
          {/* Header فاخر */}
          <div className="relative bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 text-white p-10 rounded-t-3xl overflow-hidden">
            {/* تأثيرات خلفية فاخرة */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-800/50 via-blue-800/50 to-indigo-800/50"></div>
            <div className="absolute top-0 left-0 w-full h-full">
              {[...Array(10)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 bg-white/30 rounded-full"
                  animate={{
                    scale: [0, 1, 0],
                    opacity: [0, 1, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                  }}
                />
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: -30 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center relative z-10"
            >
              <motion.div
                className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-white/20 mb-6 relative"
                whileHover={{ scale: 1.1, rotate: 180 }}
                transition={{ duration: 0.6 }}
              >
                <BarChart3 className="w-12 h-12" />
                <motion.div
                  className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                >
                  <Crown className="w-3 h-3 text-yellow-800" />
                </motion.div>
              </motion.div>
              
              <motion.h2 
                className="text-4xl font-bold mb-3 bg-gradient-to-r from-white via-yellow-200 to-white bg-clip-text text-transparent"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                📊 النتائج التفصيلية الفاخرة
              </motion.h2>
              
              <motion.p 
                className="text-white/90 text-xl"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                تحليل شامل ومتقدم لأدائك في {examType === 'qiyas' ? 'اختبار قياس' : 'الاختبار التأهيلي'}
              </motion.p>
            </motion.div>
            
            <motion.button
              onClick={onClose}
              className="absolute top-6 right-6 w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all duration-300 backdrop-blur-sm"
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
            >
              <span className="text-2xl">✕</span>
            </motion.button>
          </div>

          <div className="p-10 space-y-10">
            {/* الأداء العام الفاخر */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-950/30 dark:via-purple-950/30 dark:to-pink-950/30 border-2 border-indigo-200 dark:border-indigo-800 shadow-2xl relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-pink-500/5"></div>
                
                <CardHeader className="relative z-10">
                  <CardTitle className="flex items-center gap-3 text-2xl">
                    <motion.div
                      animate={{ rotate: [0, 15, -15, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Trophy className="w-8 h-8 text-yellow-500" />
                    </motion.div>
                    الأداء العام الفاخر
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <Sparkles className="w-6 h-6 text-purple-500" />
                    </motion.div>
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="relative z-10">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    {[
                      { value: `${results.totalScore}/${results.totalQuestions}`, label: "إجمالي النقاط", icon: Target, color: "text-gray-800 dark:text-white" },
                      { value: `${roundPercentage(results.overallPercentage)}%`, label: "النسبة المئوية", icon: BarChart3, color: "text-blue-600 dark:text-blue-400" },
                      { value: results.level, label: "المستوى", icon: Crown, color: "text-green-600 dark:text-green-400" },
                      { value: formatTime(results.timeTaken), label: "الوقت المستغرق", icon: Clock, color: "text-purple-600 dark:text-purple-400" }
                    ].map((item, index) => (
                      <motion.div
                        key={index}
                        className="text-center relative"
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 * index, type: "spring" }}
                        whileHover={{ scale: 1.05 }}
                      >
                        <motion.div
                          className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-white to-gray-100 dark:from-gray-800 dark:to-gray-700 shadow-lg mb-3"
                          whileHover={{ rotate: 360 }}
                          transition={{ duration: 0.6 }}
                        >
                          <item.icon className="w-6 h-6 text-purple-600" />
                        </motion.div>
                        <div className={`text-3xl font-bold mb-2 ${item.color}`}>
                          {item.value}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">{item.label}</div>
                      </motion.div>
                    ))}
                  </div>
                  
                  <div className="mt-8">
                    <motion.div
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      className="origin-left"
                    >
                      <Progress 
                        value={roundPercentage(results.overallPercentage)} 
                        className="h-6 bg-gradient-to-r from-gray-200 to-gray-300"
                      />
                    </motion.div>
                  </div>
                  
                  {/* الإنجازات الفاخرة */}
                  {results.achievements.length > 0 && (
                    <div className="mt-8">
                      <h4 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-3 text-lg">
                        <motion.div
                          animate={{ rotate: [0, 360] }}
                          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                        >
                          <Award className="w-6 h-6 text-yellow-500" />
                        </motion.div>
                        الإنجازات المحققة
                        <Gem className="w-5 h-5 text-purple-500" />
                      </h4>
                      <div className="flex flex-wrap gap-3">
                        {results.achievements.map((achievement, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, scale: 0, rotate: -180 }}
                            animate={{ opacity: 1, scale: 1, rotate: 0 }}
                            transition={{ delay: index * 0.1, type: "spring", bounce: 0.5 }}
                            whileHover={{ scale: 1.1, y: -2 }}
                          >
                            <Badge className="bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 dark:from-yellow-900/30 dark:to-amber-900/30 dark:text-yellow-300 px-4 py-2 text-sm font-semibold border border-yellow-300">
                              ✨ {achievement}
                            </Badge>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* القسم اللفظي الفاخر */}
            {results.verbalResults.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <div className="flex items-center gap-4 mb-8">
                  <motion.div 
                    className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-2xl"
                    whileHover={{ scale: 1.1, rotate: 12 }}
                    transition={{ duration: 0.3 }}
                  >
                    <BookOpen className="w-8 h-8" />
                  </motion.div>
                  <div>
                    <h3 className="text-3xl font-bold text-gray-800 dark:text-white mb-1">القسم اللفظي الفاخر</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-lg">تفصيل متقدم للأداء في الأقسام اللفظية</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {results.verbalResults.map((result, index) => (
                    <motion.div
                      key={result.subcategory}
                      initial={{ opacity: 0, y: 50 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * index }}
                    >
                      <SubcategoryCard
                        result={result}
                        icon={
                          result.subcategory.includes('التناظر') ? <Target className="w-6 h-6" /> :
                          result.subcategory.includes('إكمال') ? <BookOpen className="w-6 h-6" /> :
                          result.subcategory.includes('استيعاب') ? <Brain className="w-6 h-6" /> :
                          <Star className="w-6 h-6" />
                        }
                      />
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* القسم الكمي الفاخر */}
            {results.quantitativeResults.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <div className="flex items-center gap-4 mb-8">
                  <motion.div 
                    className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 flex items-center justify-center text-white shadow-2xl"
                    whileHover={{ scale: 1.1, rotate: -12 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Calculator className="w-8 h-8" />
                  </motion.div>
                  <div>
                    <h3 className="text-3xl font-bold text-gray-800 dark:text-white mb-1">القسم الكمي الفاخر</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-lg">تفصيل متقدم للأداء في الأقسام الكمية</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {results.quantitativeResults.map((result, index) => (
                    <motion.div
                      key={result.subcategory}
                      initial={{ opacity: 0, y: 50 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * index }}
                    >
                      <SubcategoryCard
                        result={result}
                        icon={
                          result.subcategory.includes('الهندسة') ? <Target className="w-6 h-6" /> :
                          result.subcategory.includes('عمليات') ? <Calculator className="w-6 h-6" /> :
                          result.subcategory.includes('النسبة') ? <BarChart3 className="w-6 h-6" /> :
                          <Zap className="w-6 h-6" />
                        }
                      />
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* نصائح التحسين الفاخرة */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <Card className="bg-gradient-to-r from-amber-50 via-orange-50 to-yellow-50 dark:from-amber-950/30 dark:via-orange-950/30 dark:to-yellow-950/30 border-2 border-amber-200 dark:border-amber-800 shadow-2xl relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-orange-500/5 to-yellow-500/5"></div>
                
                <CardHeader className="relative z-10">
                  <CardTitle className="flex items-center gap-3 text-2xl">
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <TrendingUp className="w-8 h-8 text-amber-600" />
                    </motion.div>
                    نصائح التحسين الفاخرة
                    <motion.div
                      animate={{ rotate: [0, 360] }}
                      transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    >
                      <Sparkles className="w-6 h-6 text-orange-500" />
                    </motion.div>
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="relative z-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <motion.div
                      initial={{ opacity: 0, x: -30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <h4 className="font-bold text-gray-800 dark:text-white mb-4 text-lg flex items-center gap-2">
                        <Crown className="w-5 h-5 text-green-500" />
                        نقاط القوة:
                      </h4>
                      <ul className="space-y-3">
                        {[...results.verbalResults, ...results.quantitativeResults]
                          .filter(r => r.percentage >= 80)
                          .slice(0, 3)
                          .map((result, index) => (
                            <motion.li 
                              key={index} 
                              className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-xl"
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.1 * index }}
                              whileHover={{ scale: 1.02, x: 5 }}
                            >
                              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                              <span className="text-sm font-medium">أداء ممتاز في {result.subcategory}</span>
                            </motion.li>
                          ))}
                      </ul>
                    </motion.div>
                    
                    <motion.div
                      initial={{ opacity: 0, x: 30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 }}
                    >
                      <h4 className="font-bold text-gray-800 dark:text-white mb-4 text-lg flex items-center gap-2">
                        <Target className="w-5 h-5 text-blue-500" />
                        مجالات التحسين:
                      </h4>
                      <ul className="space-y-3">
                        {[...results.verbalResults, ...results.quantitativeResults]
                          .filter(r => r.percentage < 70)
                          .slice(0, 3)
                          .map((result, index) => (
                            <motion.li 
                              key={index} 
                              className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-xl"
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.1 * index }}
                              whileHover={{ scale: 1.02, x: -5 }}
                            >
                              <Target className="w-5 h-5 text-blue-500 flex-shrink-0" />
                              <span className="text-sm font-medium">ركز أكثر على {result.subcategory}</span>
                            </motion.li>
                          ))}
                      </ul>
                    </motion.div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
