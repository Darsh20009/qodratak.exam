import React, { useState, useEffect, useCallback } from 'react';
import { useAntiCheat } from '@/hooks/useAntiCheat';
import { AntiCheatWarning } from '@/components/AntiCheatWarning';
import AiReviewingScreen, { WrongQuestion, QuestionExplanation } from '@/components/AiReviewingScreen';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { EndTestButton } from '@/components/ui/EndTestButton';
import { QiyasExamLayout } from '@/components/QiyasExamLayout';
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
  RotateCcw,
  Bookmark,
  BookmarkCheck
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface Question {
  id: number;
  category: string;
  subcategory: string;
  text: string;
  options: string[];
  correctOptionIndex: number;
  difficulty: string;
  explanation?: string;
  imageUrl?: string;
}

interface TestData {
  testType: string;
  subcategory: string;
  testName: string;
  questionCount: number;
  timeLimit: number;
  difficulty?: string;
}

export function QuantitativeTestRunner() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: number }>({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [testStarted, setTestStarted] = useState(false);
  const [testCompleted, setTestCompleted] = useState(false);
  const [showConfirmFinish, setShowConfirmFinish] = useState(false);
  const [bookmarkedQuestions, setBookmarkedQuestions] = useState<Set<number>>(new Set());
  const [showAiReview, setShowAiReview] = useState(false);
  const [wrongQuestionsForAI, setWrongQuestionsForAI] = useState<WrongQuestion[]>([]);
  const [pendingScore, setPendingScore] = useState(0);
  const [pendingTotal, setPendingTotal] = useState(0);
  const [showSectionIntro, setShowSectionIntro] = useState(false);
  const [currentSectionIntro, setCurrentSectionIntro] = useState<{ title: string; description: string; icon: string; color: string } | null>(null);
  const shownSectionIntros = React.useRef<Set<string>>(new Set());

  const { violations, lastViolationType, isWarningVisible, dismissWarning } = useAntiCheat({
    enabled: testStarted && !testCompleted,
    maxViolations: 5,
    onViolation: (type, count) => {
      setIsPaused(true);
      setTimeout(() => setIsPaused(false), 3000);
    },
    onMaxViolations: () => {
      toast({ title: '⛔ تم إنهاء الاختبار', description: 'تجاوزت الحد الأقصى للمخالفات', variant: 'destructive' });
      finishTest(true);
    },
  });

  const toggleBookmark = (index: number) => {
    setBookmarkedQuestions(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

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

  const { data: user } = useQuery<any>({ queryKey: ['/api/user'] });

  // جلب الأسئلة الكمية غير المرئية سابقاً لمنع التكرار
  const { data: allQuestions, isLoading } = useQuery({
    queryKey: ['/api/questions', 'quantitative', 'excludeSeen'],
    queryFn: () => fetch('/api/questions?category=quantitative&excludeSeen=true', { credentials: 'include' }).then(r => r.json()),
  });

  const QUANT_SECTION_DESCRIPTIONS: Record<string, { title: string; description: string; icon: string; color: string }> = {
    'الهندسة': { title: 'الهندسة', description: 'يقيس هذا القسم قدرتك على حل المسائل الهندسية المتعلقة بالأشكال والزوايا والأبعاد. استحضر قوانين الهندسة الأساسية.', icon: '📐', color: 'from-blue-500 to-teal-500' },
    'عمليات حسابية': { title: 'العمليات الحسابية', description: 'يقيس هذا القسم قدرتك على إجراء العمليات الحسابية وحل المعادلات الرقمية بدقة وسرعة.', icon: '🔢', color: 'from-green-500 to-emerald-500' },
    'العمليات الحسابية': { title: 'العمليات الحسابية', description: 'يقيس هذا القسم قدرتك على إجراء العمليات الحسابية وحل المعادلات الرقمية بدقة وسرعة.', icon: '🔢', color: 'from-green-500 to-emerald-500' },
    'النسبة المئوية': { title: 'النسبة المئوية', description: 'يقيس هذا القسم قدرتك على التعامل مع النسب المئوية والكسور والنسب والتناسب.', icon: '💯', color: 'from-amber-500 to-orange-500' },
    'المقارنات': { title: 'المقارنات الكمية', description: 'يقيس هذا القسم قدرتك على مقارنة كميتين أو أكثر وتحديد العلاقة بينهما.', icon: '⚖️', color: 'from-green-600 to-emerald-500' },
    'الحركة والأنماط': { title: 'الحركة والأنماط', description: 'يقيس هذا القسم قدرتك على تحليل الأنماط الرقمية والتسلسلات والعلاقات المتكررة.', icon: '🔄', color: 'from-cyan-500 to-blue-500' },
    'النسبة والتناسب': { title: 'النسبة والتناسب', description: 'يقيس هذا القسم قدرتك على التعامل مع مسائل النسبة والتناسب المباشر والعكسي.', icon: '📊', color: 'from-teal-500 to-green-500' },
    'الإحصاء': { title: 'الإحصاء والاحتمالات', description: 'يقيس هذا القسم قدرتك على تحليل البيانات الإحصائية وحساب الاحتمالات.', icon: '📈', color: 'from-rose-500 to-amber-600' },
    'المعادلات': { title: 'المعادلات والجبر', description: 'يقيس هذا القسم قدرتك على حل المعادلات الجبرية وتبسيط التعابير الرياضية.', icon: '➗', color: 'from-teal-600 to-emerald-600' },
    'أفكار متنوعة': { title: 'مسائل متنوعة', description: 'يشمل هذا القسم مسائل متنوعة تقيس مهاراتك الكمية الشاملة في مجالات متعددة.', icon: '🧮', color: 'from-gray-500 to-slate-600' },
  };

  // تصفية الأسئلة وتجميعها حسب الفئة
  const questions = React.useMemo(() => {
    if (!allQuestions || !testData || !Array.isArray(allQuestions)) return [];

    let pool = (allQuestions as Question[]).filter(q =>
      q.category === testData.subcategory || q.subcategory === testData.subcategory
    );

    if (pool.length === 0) {
      const firstWord = testData.subcategory.split(/[-–\s]/)[0].trim();
      pool = (allQuestions as Question[]).filter(q =>
        (q.category && q.category.includes(firstWord)) ||
        (q.subcategory && q.subcategory.includes(firstWord))
      );
    }

    if (pool.length === 0) return [];

    // Group by category, shuffle within each group
    const grouped: Record<string, Question[]> = {};
    for (const q of pool) {
      const key = q.category || q.subcategory || 'عام';
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(q);
    }
    const result: Question[] = [];
    for (const cat of Object.keys(grouped)) {
      const shuffledGroup = [...grouped[cat]].sort(() => Math.random() - 0.5);
      result.push(...shuffledGroup);
    }
    return result.slice(0, testData.questionCount);
  }, [allQuestions, testData]);

  // إظهار شرح القسم عند الانتقال لفئة جديدة
  useEffect(() => {
    if (!testStarted || !questions.length) return;
    const q = questions[currentQuestionIndex];
    if (!q) return;
    const cat = q.category || q.subcategory || '';
    if (cat && !shownSectionIntros.current.has(cat)) {
      const intro = QUANT_SECTION_DESCRIPTIONS[cat];
      if (intro) {
        shownSectionIntros.current.add(cat);
        setCurrentSectionIntro(intro);
        setShowSectionIntro(true);
        setIsPaused(true);
      }
    }
  }, [currentQuestionIndex, testStarted, questions]);

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

  const finishTest = async (timeUp = false) => {
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
      timeSpent: timeSpent,
      finishedEarly: !timeUp,
      date: new Date().toISOString(),
      answers: selectedAnswers,
      questions: questions
    };

    // إرسال النتيجة للسيرفر لحفظ النقاط
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        const skippedQuestions = totalQuestions - answeredQuestions;
        
        const questionIds = (questions as any[]).map((q: any) => q._id || q.id || q.questionId).filter(Boolean);
        const response = await apiRequest('POST', '/api/test-results', {
          userId: user.id,
          testType: 'quantitative',
          difficulty: testData?.difficulty || 'intermediate',
          score: correctAnswers,
          totalQuestions,
          timeTaken: timeSpent,
          skippedQuestions,
          questionIds,
        }) as any;

        // حفظ النقاط المكتسبة للعرض في صفحة النتائج
        if (response?.pointsEarned !== undefined) {
          localStorage.setItem('lastExamPointsEarned', response.pointsEarned.toString());
        }

        toast({
          title: "تم حفظ النقاط",
          description: "تم تسجيل نتيجتك وإضافة النقاط بنجاح",
          variant: "default"
        });
      }
    } catch (error) {
      console.error("Error saving test results:", error);
    }

    localStorage.setItem('lastTestResult', JSON.stringify(result));

    // Build wrong questions for AI review
    const wrongs: WrongQuestion[] = [];
    questions.forEach((question, index) => {
      const studentAnswer = selectedAnswers[index];
      if (studentAnswer === undefined || studentAnswer !== question.correctOptionIndex) {
        wrongs.push({
          questionText: question.text,
          options: question.options,
          studentAnswerIndex: studentAnswer ?? null,
          correctAnswerIndex: question.correctOptionIndex,
          category: question.category,
          subcategory: question.subcategory,
        });
      }
    });

    setPendingScore(correctAnswers);
    setPendingTotal(totalQuestions);
    setWrongQuestionsForAI(wrongs);
    setShowAiReview(true);
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

  if (showAiReview) {
    const userStr = localStorage.getItem('user');
    const userEmail = userStr ? JSON.parse(userStr)?.email : undefined;
    return (
      <AiReviewingScreen
        wrongQuestions={wrongQuestionsForAI}
        totalQuestions={pendingTotal}
        score={pendingScore}
        userEmail={userEmail}
        onShowResults={() => setLocation('/test-results')}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Calculator className="w-12 h-12 animate-spin mx-auto text-blue-600" />
          <p className="text-lg">جاري تحضير الاختبار...</p>
        </div>
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-teal-500 dark:from-gray-900 dark:to-blue-900/20 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md mx-auto"
        >
          <Card className="p-4 md:p-8">
            <CardContent className="text-center space-y-5 pt-2">
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              >
                <Calculator className="w-12 h-12 md:w-16 md:h-16 text-blue-600 mx-auto" />
              </motion.div>
              
              <div className="space-y-3">
                <h1 className="text-xl md:text-3xl font-bold text-gray-800 dark:text-white">
                  {testData.testName}
                </h1>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl">
                    <div className="font-semibold text-blue-700 dark:text-blue-300 text-xs">عدد الأسئلة</div>
                    <div className="text-2xl font-bold text-blue-600">{questions.length}</div>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-xl">
                    <div className="font-semibold text-green-700 dark:text-green-300 text-xs">المدة المحددة</div>
                    <div className="text-2xl font-bold text-green-600">{testData.timeLimit} دقيقة</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-xl text-right">
                <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2 text-sm">تعليمات مهمة:</h3>
                <ul className="text-xs text-yellow-700 dark:text-yellow-300 space-y-1">
                  <li>• يمكنك التنقل بين الأسئلة بحرية</li>
                  <li>• يمكنك إيقاف المؤقت مؤقتاً إذا احتجت</li>
                  <li>• تأكد من إجابتك قبل الانتهاء</li>
                  <li>• سيتم حفظ النتيجة تلقائياً</li>
                </ul>
              </div>
              
              <Button 
                onClick={startTest}
                size="lg"
                className="w-full bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-600"
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
  const answeredCount = Object.keys(selectedAnswers).length;
  const questionsStatusArr = questions.map((_, i) => ({
    answered: selectedAnswers[i] !== undefined,
    bookmarked: bookmarkedQuestions.has(i),
  }));

  return (
    <div className="relative">
      <AntiCheatWarning
        violations={violations}
        lastViolationType={lastViolationType}
        isVisible={isWarningVisible}
        onDismiss={dismissWarning}
        maxViolations={5}
      />
      {/* ── مودال شرح القسم الكمي ── */}
      {showSectionIntro && currentSectionIntro && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" dir="rtl">
          <div className="bg-white dark:bg-gray-900 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden">
            <div className={`bg-gradient-to-l ${currentSectionIntro.color} p-6 text-center`}>
              <div className="text-5xl mb-3">{currentSectionIntro.icon}</div>
              <h2 className="text-white font-black text-2xl">{currentSectionIntro.title}</h2>
            </div>
            <div className="p-6">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4 mb-5">
                <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed text-center">{currentSectionIntro.description}</p>
              </div>
              <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 mb-5 text-xs text-blue-700 dark:text-blue-300">
                <Calculator className="w-4 h-4 flex-shrink-0" />
                <span>السؤال {currentQuestionIndex + 1} من {questions.length}</span>
              </div>
              <Button
                onClick={() => { setShowSectionIntro(false); setCurrentSectionIntro(null); setIsPaused(false); }}
                className={`w-full bg-gradient-to-l ${currentSectionIntro.color} hover:opacity-90 text-white font-bold py-3 rounded-2xl`}
              >
                فهمت — ابدأ القسم
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm finish modal */}
      {showConfirmFinish && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" dir="rtl">
          <div className="bg-white rounded-xl p-6 max-w-md mx-4 shadow-2xl">
            <div className="text-center space-y-4">
              <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto" />
              <h3 className="text-xl font-bold">تأكيد إنهاء الاختبار</h3>
              <p className="text-gray-600">
                هل أنت متأكد؟ لقد أجبت على {answeredCount} من {questions.length} أسئلة.
              </p>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setShowConfirmFinish(false)} className="flex-1">إلغاء</Button>
                <Button onClick={() => finishTest()} variant="destructive" className="flex-1">إنهاء الاختبار</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <QiyasExamLayout
        examTitle={testData?.testName}
        questionNumber={currentQuestionIndex + 1}
        totalQuestions={questions.length}
        timeLeft={timeRemaining}
        isTimeUrgent={timeRemaining < 180}
        questionText={currentQuestion?.text || ''}
        questionImageUrl={currentQuestion?.imageUrl}
        options={currentQuestion?.options || []}
        selectedAnswer={selectedAnswers[currentQuestionIndex] !== undefined ? selectedAnswers[currentQuestionIndex] : null}
        onSelectAnswer={(i) => selectAnswer(currentQuestionIndex, i)}
        questionsStatus={questionsStatusArr}
        currentQuestionIndex={currentQuestionIndex}
        onJumpToQuestion={goToQuestion}
        isBookmarked={bookmarkedQuestions.has(currentQuestionIndex)}
        onToggleBookmark={() => toggleBookmark(currentQuestionIndex)}
        onPrev={previousQuestion}
        onNext={nextQuestion}
        onFinish={() => setShowConfirmFinish(true)}
        canGoPrev={currentQuestionIndex > 0}
        canGoNext={currentQuestionIndex < questions.length - 1}
        isLastQuestion={currentQuestionIndex === questions.length - 1}
        answeredCount={answeredCount}
        userName={user?.username || user?.name}
        userId={user?.id ? String(user.id) : undefined}
        topRightSlot={
          <button
            onClick={pauseTest}
            className="mr-1 text-xs px-2 py-1 rounded bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
          >
            {isPaused ? 'استئناف' : 'إيقاف'}
          </button>
        }
      />
    </div>
  );
}