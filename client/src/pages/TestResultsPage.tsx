
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useLocation } from 'wouter';
import { 
  Trophy, 
  Clock, 
  BookText, 
  Calculator, 
  Star, 
  Target, 
  Award, 
  TrendingUp,
  Brain,
  Zap,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  Download,
  Share2,
  Sparkles,
  Medal,
  Crown,
  Flame
} from 'lucide-react';

interface TestResult {
  testName?: string;
  subcategory?: string;
  totalQuestions: number;
  correctAnswers: number;
  percentage: number;
  timeSpent: number;
  date: string;
  answers?: Record<string, string>;
  questions?: any[];
  examType?: string;
  score?: number;
  timeTaken?: number;
}

export default function TestResultsPage() {
  const [, setLocation] = useLocation();
  const [result, setResult] = useState<TestResult | null>(null);
  const [isAnimating, setIsAnimating] = useState(true);

  const handleBackToRecords = () => {
    setLocation('/records');
  };

  useEffect(() => {
    console.log('TestResultsPage: Checking for stored result...');
    
    const possibleKeys = ['lastTestResult', 'currentTestResult', 'testResult'];
    let foundResult = null;
    
    for (const key of possibleKeys) {
      const storedResult = localStorage.getItem(key);
      console.log(`Checking key '${key}':`, storedResult);
      
      if (storedResult) {
        try {
          foundResult = JSON.parse(storedResult);
          console.log('Found result:', foundResult);
          break;
        } catch (error) {
          console.error(`Error parsing result from key '${key}':`, error);
        }
      }
    }
    
    if (foundResult) {
      // تنسيق البيانات لضمان التوافق
      const formattedResult: TestResult = {
        testName: foundResult.testName || 'اختبار القدرات',
        subcategory: foundResult.subcategory || foundResult.examType || 'عام',
        totalQuestions: foundResult.totalQuestions || foundResult.questions?.length || 0,
        correctAnswers: foundResult.correctAnswers || foundResult.score || 0,
        percentage: foundResult.percentage || (foundResult.correctAnswers && foundResult.totalQuestions ? Math.round((foundResult.correctAnswers / foundResult.totalQuestions) * 100) : 0),
        timeSpent: foundResult.timeSpent || foundResult.timeTaken || 0,
        date: foundResult.date || new Date().toISOString(),
        examType: foundResult.examType || 'verbal',
        answers: foundResult.answers,
        questions: foundResult.questions
      };
      
      setResult(formattedResult);
    } else {
      // محاولة إنشاء نتيجة من URL params
      const urlParams = new URLSearchParams(window.location.search);
      const score = urlParams.get('score');
      const total = urlParams.get('total');
      const examType = urlParams.get('examType');
      const timeTaken = urlParams.get('timeTaken');
      
      if (score && total) {
        const mockResult: TestResult = {
          testName: 'اختبار القدرات',
          subcategory: examType === 'verbal' ? 'لفظي' : 'كمي',
          totalQuestions: parseInt(total),
          correctAnswers: parseInt(score),
          percentage: Math.round((parseInt(score) / parseInt(total)) * 100),
          timeSpent: timeTaken ? parseInt(timeTaken) : 0,
          date: new Date().toISOString(),
          examType: examType || 'verbal'
        };
        setResult(mockResult);
      }
    }

    // إيقاف الأنيميشن بعد ثانيتين
    setTimeout(() => setIsAnimating(false), 2000);
  }, []);

  if (!result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-blue-900 dark:to-indigo-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md mx-auto p-8"
        >
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center mx-auto mb-6"
          >
            <Clock className="h-10 w-10 text-white" />
          </motion.div>
          
          <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">
            لا توجد نتيجة للعرض
          </h2>
          
          <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
            يبدو أن بيانات النتيجة غير متوفرة. قد يكون السبب انتهاء صلاحية البيانات أو عدم إكمال الاختبار بشكل صحيح.
          </p>
          
          <div className="space-y-3">
            <Button 
              onClick={handleBackToRecords} 
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all"
            >
              <Trophy className="w-4 h-4 mr-2" />
              العودة لسجل الاختبارات
            </Button>
            
            <Button 
              onClick={() => setLocation('/verbal-tests')} 
              variant="outline"
              className="w-full border-2 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <Zap className="w-4 h-4 mr-2" />
              إجراء اختبار جديد
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  const getPerformanceLevel = (percentage: number) => {
    if (percentage >= 90) return { level: 'متفوق', color: 'text-emerald-600', bg: 'bg-emerald-50', icon: Crown };
    if (percentage >= 80) return { level: 'ممتاز', color: 'text-blue-600', bg: 'bg-blue-50', icon: Medal };
    if (percentage >= 70) return { level: 'جيد جداً', color: 'text-green-600', bg: 'bg-green-50', icon: Award };
    if (percentage >= 60) return { level: 'جيد', color: 'text-yellow-600', bg: 'bg-yellow-50', icon: Star };
    if (percentage >= 50) return { level: 'مقبول', color: 'text-orange-600', bg: 'bg-orange-50', icon: Target };
    return { level: 'يحتاج تحسين', color: 'text-red-600', bg: 'bg-red-50', icon: AlertCircle };
  };

  const getTimeFormatted = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes > 0) {
      return `${minutes} دقيقة و ${remainingSeconds} ثانية`;
    }
    return `${seconds} ثانية`;
  };

  const performance = getPerformanceLevel(result.percentage);
  const PerformanceIcon = performance.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-blue-900 dark:to-indigo-900 relative overflow-hidden">
      {/* خلفية متحركة */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-blue-400/20 rounded-full"
            animate={{
              x: [0, Math.random() * 100, 0],
              y: [0, Math.random() * 100, 0],
              opacity: [0.2, 0.6, 0.2],
            }}
            transition={{
              duration: 10 + Math.random() * 5,
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

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-4xl">
        {/* العنوان الرئيسي */}
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-4 mb-4">
            <motion.div
              animate={isAnimating ? { rotate: 360, scale: [1, 1.2, 1] } : {}}
              transition={{ duration: 1, repeat: isAnimating ? Infinity : 0 }}
              className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-2xl"
            >
              <Trophy className="w-8 h-8 text-white" />
            </motion.div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-white">
                نتيجة الاختبار
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                {result.testName || 'اختبار القدرات'}
              </p>
            </div>
          </div>
        </motion.div>

        {/* البطاقة الرئيسية للنتيجة */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="mb-8 overflow-hidden shadow-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-2 border-white/20">
            {/* شريط الأداء العلوي */}
            <div className={`h-3 bg-gradient-to-r ${
              result.percentage >= 90 ? 'from-emerald-400 to-emerald-600' :
              result.percentage >= 80 ? 'from-blue-400 to-blue-600' :
              result.percentage >= 70 ? 'from-green-400 to-green-600' :
              result.percentage >= 60 ? 'from-yellow-400 to-yellow-600' :
              result.percentage >= 50 ? 'from-orange-400 to-orange-600' :
              'from-red-400 to-red-600'
            }`} />

            <CardHeader className="text-center pb-4">
              <div className="flex items-center justify-center gap-4 mb-4">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className={`w-20 h-20 rounded-full ${performance.bg} flex items-center justify-center`}
                >
                  <PerformanceIcon className={`w-10 h-10 ${performance.color}`} />
                </motion.div>
              </div>
              
              <CardTitle className="text-4xl md:text-5xl font-bold mb-2">
                {result.correctAnswers}/{result.totalQuestions}
              </CardTitle>
              
              <div className={`text-3xl font-bold ${performance.color} mb-2`}>
                {result.percentage}%
              </div>
              
              <Badge className={`${performance.bg} ${performance.color} text-lg px-4 py-2 border-2`}>
                {performance.level}
              </Badge>
            </CardHeader>

            <CardContent>
              {/* شريط التقدم المتحرك */}
              <div className="mb-8">
                <Progress 
                  value={result.percentage} 
                  className="h-4 bg-gray-200 dark:bg-gray-700"
                />
                <div className="flex justify-between mt-2 text-sm text-gray-500 dark:text-gray-400">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>

              {/* إحصائيات مفصلة */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 p-6 rounded-2xl border border-blue-200 dark:border-blue-800"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                      {result.subcategory === 'التناظر اللفظي' || result.examType === 'verbal' ? (
                        <BookText className="w-6 h-6 text-white" />
                      ) : (
                        <Calculator className="w-6 h-6 text-white" />
                      )}
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">نوع الاختبار</div>
                      <div className="font-bold text-lg">
                        {result.subcategory || (result.examType === 'verbal' ? 'لفظي' : 'كمي')}
                      </div>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-6 rounded-2xl border border-green-200 dark:border-green-800"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                      <Clock className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">الوقت المستغرق</div>
                      <div className="font-bold text-lg">
                        {result.timeSpent > 0 ? getTimeFormatted(result.timeSpent) : 'غير محدد'}
                      </div>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 }}
                  className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-6 rounded-2xl border border-purple-200 dark:border-purple-800"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                      <BarChart3 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">معدل الإجابة</div>
                      <div className="font-bold text-lg">
                        {result.totalQuestions > 0 ? `${Math.round((result.correctAnswers / result.totalQuestions) * 100)}%` : '0%'}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* رسائل تحفيزية */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className={`${performance.bg} rounded-2xl p-6 border-2 border-dashed mb-8`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 ${performance.color.replace('text-', 'bg-').replace('-600', '-500')} rounded-xl flex items-center justify-center`}>
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-bold text-lg ${performance.color} mb-2`}>
                      {result.percentage >= 90 ? 'إنجاز استثنائي! 🎉' :
                       result.percentage >= 80 ? 'أداء ممتاز! 👏' :
                       result.percentage >= 70 ? 'عمل رائع! 💪' :
                       result.percentage >= 60 ? 'تقدم جيد! 📈' :
                       result.percentage >= 50 ? 'بداية إيجابية! 🌟' :
                       'لا تيأس، استمر في المحاولة! 💯'}
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                      {result.percentage >= 90 ? 'أداؤك متفوق ويضعك في المقدمة. استمر في هذا المستوى الرائع!' :
                       result.percentage >= 80 ? 'أداء ممتاز يظهر فهماً عميقاً للمادة. أنت على الطريق الصحيح!' :
                       result.percentage >= 70 ? 'أداء جيد جداً يدل على استيعاب قوي. بقليل من التحسين ستصل للتميز!' :
                       result.percentage >= 60 ? 'أداء جيد يظهر تقدماً واضحاً. ركز على نقاط الضعف للوصول لمستوى أفضل!' :
                       result.percentage >= 50 ? 'بداية مقبولة تحتاج لمزيد من التدريب. لا تتوقف، النجاح يحتاج للمثابرة!' :
                       'لا تقلق، كل خبير كان مبتدئاً يوماً ما. راجع الأخطاء وتدرب أكثر!'}
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* الأزرار */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button 
                    onClick={handleBackToRecords}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3 text-lg shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <Trophy className="w-5 h-5 mr-2" />
                    عرض سجل الاختبارات
                  </Button>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    onClick={() => setLocation('/verbal-tests')}
                    variant="outline"
                    className="border-2 border-purple-500 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 px-8 py-3 text-lg transition-all duration-300"
                  >
                    <Flame className="w-5 h-5 mr-2" />
                    اختبار جديد
                  </Button>
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* نصائح للتحسين */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Card className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-900/20 dark:via-purple-900/20 dark:to-pink-900/20 border-2 border-indigo-200 dark:border-indigo-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <Brain className="w-6 h-6 text-indigo-600" />
                نصائح لتحسين الأداء
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">راجع الإجابات الخاطئة وافهم أسباب الخطأ</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">تدرب يومياً لمدة 30 دقيقة على الأقل</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">استخدم تقنيات إدارة الوقت أثناء الاختبار</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">ركز على نقاط الضعف في التدريب القادم</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">اطلع على استراتيجيات حل الأسئلة المختلفة</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">احرص على النوم الكافي قبل الاختبارات</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
