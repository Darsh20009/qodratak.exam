import React, { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  CheckCircle2, 
  Circle, 
  ArrowLeft, 
  ArrowRight, 
  Flag,
  Calculator,
  AlertTriangle,
  Pause,
  Play,
  RotateCcw
} from 'lucide-react';

interface Question {
  id: number;
  category: string;
  subcategory: string;
  text: string;
  options: string[];
  correctOptionIndex: number;
  difficulty: string;
  explanation?: string;
}

interface TestData {
  testType: string;
  subcategory: string;
  testName: string;
  questionCount: number;
  timeLimit: number;
}

export function QuantitativeTestRunner() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: number }>({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [testStarted, setTestStarted] = useState(false);
  const [testCompleted, setTestCompleted] = useState(false);
  const [showConfirmFinish, setShowConfirmFinish] = useState(false);

  // بيانات الاختبار من localStorage
  const [testData, setTestData] = useState<TestData | null>(null);

  useEffect(() => {
    const storedTest = localStorage.getItem('currentTest');
    if (storedTest) {
      const data = JSON.parse(storedTest);
      setTestData(data);
      setTimeRemaining(data.timeLimit * 60); // تحويل الدقائق إلى ثوان
    }
  }, []);

  // جلب الأسئلة الكمية
  const { data: allQuestions, isLoading } = useQuery({
    queryKey: ['/api/questions'],
  });

  // تصفية الأسئلة حسب النوع والقسم الفرعي
  const questions = React.useMemo(() => {
    if (!allQuestions || !testData || !Array.isArray(allQuestions)) return [];
    
    const filtered = allQuestions.filter((q: Question) => 
      q.category === 'quantitative' && q.subcategory === testData.subcategory
    );
    
    // اختيار عدد معين من الأسئلة عشوائياً
    const shuffled = [...filtered].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, testData.questionCount);
  }, [allQuestions, testData]);

  // مؤقت العد التنازلي
  useEffect(() => {
    if (!testStarted || isPaused || testCompleted) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          finishTest(true); // انتهاء الوقت
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [testStarted, isPaused, testCompleted]);

  const startTest = () => {
    setTestStarted(true);
  };

  const pauseTest = () => {
    setIsPaused(!isPaused);
  };

  const selectAnswer = (questionIndex: number, optionIndex: number) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionIndex]: optionIndex
    }));
  };

  const goToQuestion = (index: number) => {
    setCurrentQuestionIndex(index);
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const finishTest = (timeUp = false) => {
    if (!timeUp && Object.keys(selectedAnswers).length === 0) {
      alert('يجب الإجابة على سؤال واحد على الأقل');
      return;
    }

    // حساب النتائج
    let correctAnswers = 0;
    questions.forEach((question, index) => {
      if (selectedAnswers[index] === question.correctOptionIndex) {
        correctAnswers++;
      }
    });

    const totalQuestions = questions.length;
    const answeredQuestions = Object.keys(selectedAnswers).length;
    const percentage = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
    const timeSpent = testData ? ((testData.timeLimit || 10) * 60) - timeRemaining : 0;

    // حفظ النتيجة
    const result = {
      testName: testData?.testName || 'اختبار كمي',
      subcategory: testData?.subcategory || '',
      totalQuestions,
      answeredQuestions,
      correctAnswers,
      percentage,
      timeSpent: timeSpent, // بالثواني
      finishedEarly: !timeUp,
      date: new Date().toISOString(),
      answers: selectedAnswers,
      questions: questions
    };

    localStorage.setItem('lastTestResult', JSON.stringify(result));
    
    // الانتقال إلى صفحة النتائج
    window.location.href = '/test-results';
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getTimeColor = () => {
    const percentage = timeRemaining / ((testData?.timeLimit || 10) * 60);
    if (percentage > 0.5) return 'text-green-600';
    if (percentage > 0.25) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 bg-gradient-to-br from-blue-950 via-purple-950 to-indigo-950 flex items-center justify-center overflow-hidden">
        {/* خلفية متحركة رياضية */}
        <div className="absolute inset-0">
          {/* تأثير الأرقام المتحركة */}
          <div className="absolute top-10 left-10 text-4xl text-blue-400/30 animate-pulse font-mono">π</div>
          <div className="absolute top-20 right-20 text-3xl text-purple-400/30 animate-bounce delay-500 font-mono">∫</div>
          <div className="absolute bottom-20 left-20 text-5xl text-indigo-400/30 animate-ping delay-1000 font-mono">∑</div>
          <div className="absolute bottom-10 right-10 text-3xl text-cyan-400/30 animate-pulse delay-1500 font-mono">∞</div>
          <div className="absolute top-1/3 left-1/4 text-2xl text-pink-400/30 animate-bounce delay-700 font-mono">√</div>
          <div className="absolute top-2/3 right-1/3 text-4xl text-violet-400/30 animate-ping delay-2000 font-mono">%</div>
          <div className="absolute bottom-1/3 left-1/2 text-3xl text-yellow-400/30 animate-pulse delay-300 font-mono">≠</div>
          <div className="absolute top-1/2 right-10 text-2xl text-green-400/30 animate-bounce delay-1200 font-mono">≈</div>
          
          {/* معادلات رياضية متحركة */}
          <div className="absolute top-16 left-1/3 text-lg text-blue-300/20 animate-pulse delay-800 font-mono">x² + y² = z²</div>
          <div className="absolute bottom-16 right-1/4 text-lg text-purple-300/20 animate-bounce delay-1600 font-mono">a² - b² = (a+b)(a-b)</div>
          
          {/* شبكة هندسية متحركة */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_600px_at_50%_200px,rgba(59,130,246,0.1),transparent)] animate-pulse"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_400px_at_80%_80%,rgba(168,85,247,0.08),transparent)] animate-pulse delay-1000"></div>
        </div>

        {/* المحتوى الرئيسي */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center space-y-8">
          {/* أيقونة الآلة الحاسبة مع تأثيرات رياضية */}
          <div className="relative">
            {/* هالة ضوئية رياضية */}
            <div className="absolute inset-0 w-32 h-32 bg-gradient-to-r from-blue-500/30 via-purple-500/30 to-pink-500/30 rounded-full blur-xl animate-spin"></div>
            <div className="absolute inset-2 w-28 h-28 bg-gradient-to-r from-cyan-400/20 via-blue-400/20 to-indigo-400/20 rounded-full blur-lg animate-spin-reverse"></div>

            {/* الآلة الحاسبة المركزية */}
            <div className="relative w-24 h-24 mx-auto bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-500/50 border border-blue-400/30 backdrop-blur-sm">
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-3xl"></div>
              <Calculator className="w-12 h-12 text-white animate-pulse" />

              {/* تأثير البريق */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-3xl animate-shimmer"></div>
            </div>

            {/* رموز رياضية دائرية حول الأيقونة */}
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center animate-bounce opacity-80">
              <span className="text-xs font-bold text-white">+</span>
            </div>
            <div className="absolute -bottom-2 -left-2 w-6 h-6 bg-gradient-to-r from-pink-400 to-rose-500 rounded-full flex items-center justify-center animate-ping opacity-70">
              <span className="text-xs font-bold text-white">×</span>
            </div>
            <div className="absolute top-1/2 -right-3 w-5 h-5 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full flex items-center justify-center animate-pulse opacity-90">
              <span className="text-xs font-bold text-white">÷</span>
            </div>
            <div className="absolute top-1/2 -left-3 w-5 h-5 bg-gradient-to-r from-purple-400 to-violet-500 rounded-full flex items-center justify-center animate-bounce delay-500 opacity-80">
              <span className="text-xs font-bold text-white">-</span>
            </div>
          </div>

          {/* العنوان */}
          <div className="space-y-4">
            <div className="relative">
              <h1 className="text-4xl font-black bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-shimmer drop-shadow-2xl">
                جاري تحضير اختبار الكمي
              </h1>
            </div>

            <div className="relative">
              <p className="text-lg text-slate-200 font-medium tracking-wide opacity-90 animate-pulse">
                نقوم بإعداد الأسئلة الرياضية لك...
              </p>
            </div>
          </div>

          {/* شريط التحميل الرياضي */}
          <div className="w-64 mx-auto space-y-4">
            <div className="relative">
              {/* الخلفية المضيئة */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-full blur-sm"></div>

              {/* شريط التحميل الرئيسي */}
              <div className="relative w-full h-3 bg-slate-800/50 rounded-full overflow-hidden border border-blue-400/30 backdrop-blur-sm">
                <div className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full animate-loading-bar shadow-lg shadow-blue-500/50"></div>

                {/* تأثير البريق المتحرك */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
              </div>
            </div>

            {/* رموز رياضية متحركة */}
            <div className="flex items-center justify-center space-x-4">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center animate-bounce">
                <span className="text-white font-bold text-sm">1</span>
              </div>
              <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center animate-bounce delay-150">
                <span className="text-white font-bold text-sm">2</span>
              </div>
              <div className="w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center animate-bounce delay-300">
                <span className="text-white font-bold text-sm">3</span>
              </div>
            </div>

            {/* رسائل تحفيزية متغيرة */}
            <div className="text-center">
              <p className="text-sm text-blue-300 animate-pulse">
                استعد لتحدي قدراتك الرياضية! 🧮
              </p>
            </div>
          </div>
        </div>

        {/* أنماط CSS مخصصة */}
        <style>{`
          @keyframes loading-bar {
            0% { width: 0%; }
            50% { width: 60%; }
            100% { width: 100%; }
          }

          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }

          @keyframes spin-reverse {
            from { transform: rotate(360deg); }
            to { transform: rotate(0deg); }
          }

          .animate-loading-bar {
            animation: loading-bar 3s ease-in-out infinite;
          }

          .animate-shimmer {
            animation: shimmer 2s ease-in-out infinite;
          }

          .animate-spin-reverse {
            animation: spin-reverse 8s linear infinite;
          }
        `}</style>
      </div>
    );
  }

  if (!testData || questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center space-y-4">
            <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto" />
            <h2 className="text-xl font-bold">خطأ في تحميل الاختبار</h2>
            <p className="text-gray-600">لم يتم العثور على بيانات الاختبار أو الأسئلة</p>
            <Button onClick={() => window.location.href = '/quantitative-tests'}>
              العودة للاختبارات
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!testStarted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-blue-900/20">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-2xl mx-auto"
        >
          <Card className="p-8">
            <CardContent className="text-center space-y-6">
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              >
                <Calculator className="w-16 h-16 text-blue-600 mx-auto" />
              </motion.div>
              
              <div className="space-y-4">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
                  {testData.testName}
                </h1>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <div className="font-semibold text-blue-700 dark:text-blue-300">عدد الأسئلة</div>
                    <div className="text-2xl font-bold text-blue-600">{questions.length}</div>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                    <div className="font-semibold text-green-700 dark:text-green-300">المدة المحددة</div>
                    <div className="text-2xl font-bold text-green-600">{testData.timeLimit} دقيقة</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">تعليمات مهمة:</h3>
                <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1 text-right">
                  <li>• يمكنك التنقل بين الأسئلة بحرية</li>
                  <li>• يمكنك إيقاف المؤقت مؤقتاً إذا احتجت</li>
                  <li>• تأكد من إجابتك قبل الانتهاء</li>
                  <li>• سيتم حفظ النتيجة تلقائياً</li>
                </ul>
              </div>
              
              <Button 
                onClick={startTest}
                size="lg"
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <Play className="w-5 h-5 mr-2" />
                ابدأ الاختبار الآن
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const answeredCount = Object.keys(selectedAnswers).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-blue-900/20">
      <div className="container mx-auto px-4 py-6">
        {/* شريط المعلومات العلوي */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 mb-6"
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <Calculator className="w-6 h-6 text-blue-600" />
              <div>
                <h2 className="font-bold text-gray-800 dark:text-white">{testData.testName}</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  السؤال {currentQuestionIndex + 1} من {questions.length}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className={`text-2xl font-bold ${getTimeColor()}`}>
                {isPaused ? (
                  <span className="text-yellow-600">متوقف</span>
                ) : (
                  formatTime(timeRemaining)
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={pauseTest}
                className="flex items-center gap-2"
              >
                {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                {isPaused ? 'استئناف' : 'إيقاف'}
              </Button>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
              <span>التقدم: {Math.round(progress)}%</span>
              <span>تم الإجابة: {answeredCount} من {questions.length}</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* السؤال الحالي */}
          <div className="lg:col-span-3">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuestionIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="bg-white dark:bg-gray-800 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <span className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full text-sm font-bold">
                        السؤال {currentQuestionIndex + 1}
                      </span>
                      <Badge variant="outline">{currentQuestion.difficulty}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="text-lg font-medium text-gray-800 dark:text-white leading-relaxed">
                      {currentQuestion.text}
                    </div>

                    <div className="space-y-3">
                      {currentQuestion.options.map((option: string, index: number) => (
                        <motion.div
                          key={index}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Button
                            variant={selectedAnswers[currentQuestionIndex] === index ? "default" : "outline"}
                            className={`w-full text-right p-4 h-auto justify-start ${
                              selectedAnswers[currentQuestionIndex] === index
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'hover:bg-blue-50 dark:hover:bg-blue-900/20'
                            }`}
                            onClick={() => selectAnswer(currentQuestionIndex, index)}
                          >
                            <div className="flex items-center gap-3 w-full">
                              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                                selectedAnswers[currentQuestionIndex] === index
                                  ? 'border-white bg-white'
                                  : 'border-gray-300 dark:border-gray-600'
                              }`}>
                                {selectedAnswers[currentQuestionIndex] === index && (
                                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                                )}
                              </div>
                              <span className="flex-1 text-right">{option}</span>
                            </div>
                          </Button>
                        </motion.div>
                      ))}
                    </div>

                    {/* أزرار التنقل */}
                    <div className="flex items-center justify-between pt-6 border-t dark:border-gray-700">
                      <Button
                        variant="outline"
                        onClick={previousQuestion}
                        disabled={currentQuestionIndex === 0}
                        className="flex items-center gap-2"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        السؤال السابق
                      </Button>

                      <Button
                        onClick={() => setShowConfirmFinish(true)}
                        variant="destructive"
                        className="flex items-center gap-2"
                      >
                        <Flag className="w-4 h-4" />
                        إنهاء الاختبار
                      </Button>

                      <Button
                        onClick={nextQuestion}
                        disabled={currentQuestionIndex === questions.length - 1}
                        className="flex items-center gap-2"
                      >
                        السؤال التالي
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* لوحة الأسئلة الجانبية */}
          <div className="lg:col-span-1">
            <Card className="bg-white dark:bg-gray-800 shadow-lg sticky top-6">
              <CardHeader>
                <CardTitle className="text-lg">خريطة الأسئلة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 gap-2">
                  {questions.map((_, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => goToQuestion(index)}
                      className={`aspect-square p-0 ${
                        index === currentQuestionIndex
                          ? 'bg-blue-600 text-white border-blue-600'
                          : selectedAnswers[index] !== undefined
                          ? 'bg-green-100 text-green-700 border-green-300'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      {index + 1}
                    </Button>
                  ))}
                </div>
                <div className="mt-4 text-xs space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-600 rounded"></div>
                    <span>السؤال الحالي</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
                    <span>تم الإجابة</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border border-gray-300 rounded"></div>
                    <span>لم يتم الإجابة</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* مودال تأكيد الإنهاء */}
        {showConfirmFinish && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md mx-4"
            >
              <div className="text-center space-y-4">
                <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto" />
                <h3 className="text-xl font-bold">تأكيد إنهاء الاختبار</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  هل أنت متأكد من إنهاء الاختبار؟ لقد أجبت على {answeredCount} من {questions.length} أسئلة.
                </p>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowConfirmFinish(false)}
                    className="flex-1"
                  >
                    إلغاء
                  </Button>
                  <Button
                    onClick={() => finishTest()}
                    variant="destructive"
                    className="flex-1"
                  >
                    إنهاء الاختبار
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}