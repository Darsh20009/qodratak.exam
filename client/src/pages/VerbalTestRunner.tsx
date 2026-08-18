import React, { useState, useEffect } from 'react';
import { useAntiCheat } from '@/hooks/useAntiCheat';
import { AntiCheatWarning } from '@/components/AntiCheatWarning';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import AiReviewingScreen, { WrongQuestion, QuestionExplanation } from '@/components/AiReviewingScreen';
import { 
  Clock, 
  ArrowLeft, 
  ArrowRight, 
  Play, 
  Pause, 
  AlertTriangle,
  BookOpen,
  Flag,
  CheckCircle2,
  Bookmark,
  BookmarkCheck
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { EndTestButton } from '@/components/ui/EndTestButton';
import { QiyasExamLayout } from '@/components/QiyasExamLayout';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface Question {
  id: number;
  category: string;
  text?: string;
  question?: string;
  options?: string[];
  choices?: string[];
  correctOptionIndex?: number;
  correct_answer?: string;
  explanation?: string;
  subcategory?: string;
  difficulty?: string;
  imageUrl?: string;
}

interface TestConfig {
  testId: string;
  testName: string;
  subcategory: string;
  questionCount: number;
  timeLimit: number;
  difficulty: string;
}

export function VerbalTestRunner() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{[key: number]: number}>({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showConfirmFinish, setShowConfirmFinish] = useState(false);
  const [testConfig, setTestConfig] = useState<TestConfig | null>(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [bookmarkedQuestions, setBookmarkedQuestions] = useState<Set<number>>(new Set());
  const [showAiReview, setShowAiReview] = useState(false);
  const [wrongQuestionsForAI, setWrongQuestionsForAI] = useState<WrongQuestion[]>([]);
  const [pendingResultData, setPendingResultData] = useState<any>(null);
  const [showSectionIntro, setShowSectionIntro] = useState(false);
  const [currentSectionIntro, setCurrentSectionIntro] = useState<{ title: string; description: string; icon: string; color: string } | null>(null);
  const shownSectionIntros = React.useRef<Set<string>>(new Set());

  const { violations, lastViolationType, isWarningVisible, dismissWarning } = useAntiCheat({
    enabled: hasStarted,
    maxViolations: 5,
    onViolation: () => { setIsPaused(true); setTimeout(() => setIsPaused(false), 3000); },
    onMaxViolations: () => {
      toast({ title: '⛔ تم إنهاء الاختبار', description: 'تجاوزت الحد الأقصى للمخالفات', variant: 'destructive' });
      finishTest();
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

  const { data: user } = useQuery<any>({ queryKey: ['/api/user'] });

  // Fetch unseen verbal questions to avoid repetition
  const { data: allQuestions = [], isLoading } = useQuery<Question[]>({
    queryKey: ['/api/questions', 'verbal', 'excludeSeen'],
    queryFn: () => fetch('/api/questions?category=verbal&excludeSeen=true', { credentials: 'include' }).then(r => r.json()),
  });

  // Load test configuration from localStorage
  useEffect(() => {
    const storedConfig = localStorage.getItem('currentVerbalTest');
    if (storedConfig) {
      try {
        const config = JSON.parse(storedConfig);
        setTestConfig(config);
        setTimeRemaining(config.timeLimit * 60);
      } catch (error) {
        console.error('Error parsing test config:', error);
        setLocation('/verbal-tests');
      }
    } else {
      setLocation('/verbal-tests');
    }
  }, [setLocation]);

  const SECTION_DESCRIPTIONS: Record<string, { title: string; description: string; icon: string; color: string }> = {
    'استيعاب المقروء': { title: 'استيعاب المقروء', description: 'اقرأ النص المقدَّم بعناية ثم أجب على الأسئلة المتعلقة به. يقيس هذا القسم قدرتك على استيعاب الأفكار واستنتاج المعاني الضمنية.', icon: '📖', color: 'from-blue-500 to-cyan-500' },
    'التناظر اللفظي': { title: 'التناظر اللفظي', description: 'اكتشف العلاقة بين الكلمتين الأوليين، ثم اختر الكلمة التي تُكمل نفس العلاقة. يقيس هذا القسم قدرتك على فهم العلاقات اللغوية.', icon: '🔄', color: 'from-green-600 to-amber-600' },
    'الخطأ السياقي': { title: 'الخطأ السياقي', description: 'حدِّد الكلمة التي لا تتناسب مع سياق الجملة أو لا تنتمي لمعناها. يقيس هذا القسم دقة فهمك للسياق اللغوي.', icon: '🔍', color: 'from-red-500 to-orange-500' },
    'إكمال الجمل': { title: 'إكمال الجمل', description: 'اختر الكلمة أو العبارة التي تُكمل الجملة بصورة صحيحة ومنطقية. يقيس هذا القسم قدرتك على الفهم والاستنتاج.', icon: '✏️', color: 'from-green-500 to-teal-500' },
    'المفردة المختلفة': { title: 'المفردة الشاذة', description: 'اختر الكلمة التي تختلف عن بقية الكلمات في المجموعة من حيث المعنى أو الانتماء. يقيس هذا القسم ثروتك اللغوية.', icon: '💡', color: 'from-amber-500 to-yellow-500' },
  };

  // Filter and group questions by category
  const questions = React.useMemo(() => {
    if (!allQuestions || !Array.isArray(allQuestions) || !testConfig) return [];

    let pool = allQuestions.filter(q =>
      q.subcategory === testConfig.subcategory || q.category === testConfig.subcategory
    );

    if (pool.length === 0) {
      const firstWord = testConfig.subcategory.split(/[-–\s]/)[0].trim();
      pool = allQuestions.filter(q =>
        (q.subcategory && q.subcategory.includes(firstWord)) ||
        (q.category && q.category.includes(firstWord))
      );
    }

    if (pool.length === 0) return [];

    // Group by category, shuffle within each group, then concatenate
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

    return result.slice(0, Math.min(testConfig.questionCount, result.length));
  }, [allQuestions, testConfig]);

  // Show section intro when entering a new category
  useEffect(() => {
    if (!hasStarted || !questions.length) return;
    const q = questions[currentQuestionIndex];
    if (!q) return;
    const cat = q.category || q.subcategory || '';
    if (cat && !shownSectionIntros.current.has(cat)) {
      const intro = SECTION_DESCRIPTIONS[cat];
      if (intro) {
        shownSectionIntros.current.add(cat);
        setCurrentSectionIntro(intro);
        setShowSectionIntro(true);
        setIsPaused(true);
      }
    }
  }, [currentQuestionIndex, hasStarted, questions]);

  // Timer effect
  useEffect(() => {
    if (hasStarted && !isPaused && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleFinishTest();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [hasStarted, isPaused, timeRemaining]);

  const startTest = () => {
    setHasStarted(true);
  };

  const pauseTest = () => {
    setIsPaused(!isPaused);
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const goToQuestion = (index: number) => {
    setCurrentQuestionIndex(index);
  };

  const selectAnswer = (questionIndex: number, answerIndex: number) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionIndex]: answerIndex
    }));
  };

  const finishTest = () => {
    setShowConfirmFinish(false);
    handleFinishTest();
  };

  const handleFinishTest = async () => {
    if (!questions || !testConfig) return;

    // Calculate results only for answered questions
    let correctCount = 0;
    const answeredQuestions = Object.keys(selectedAnswers).length;
    const totalQuestions = questions.length;

    Object.entries(selectedAnswers).forEach(([questionIndex, selectedAnswer]) => {
      const question = questions[parseInt(questionIndex)];
      if (question && selectedAnswer === question.correctOptionIndex) {
        correctCount++;
      }
    });

    // Calculate percentage based on answered questions or total questions
    const percentage = answeredQuestions > 0 ? 
      Math.round((correctCount / answeredQuestions) * 100) : 0;

    const results = {
      testName: testConfig.testName,
      subcategory: testConfig.subcategory,
      totalQuestions,
      answeredQuestions,
      correctAnswers: correctCount,
      percentage,
      timeSpent: testConfig.timeLimit * 60 - timeRemaining,
      finishedEarly: timeRemaining > 0,
      date: new Date().toISOString(),
      answers: selectedAnswers,
      questions: questions
    };

    // Store results locally
    const existingResults = JSON.parse(localStorage.getItem('verbalTestResults') || '[]');
    existingResults.push(results);
    localStorage.setItem('verbalTestResults', JSON.stringify(existingResults));

    // إرسال النتيجة للسيرفر لحفظ النقاط
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        const skippedQuestions = totalQuestions - answeredQuestions;
        
        const questionIds = questions.map((q: any) => q._id || q.id || q.questionId).filter(Boolean);
        const response = await apiRequest('POST', '/api/test-results', {
          userId: user.id,
          testType: 'verbal',
          difficulty: testConfig.difficulty || 'intermediate',
          score: correctCount,
          totalQuestions,
          timeTaken: testConfig.timeLimit * 60 - timeRemaining,
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

    // Clear test config
    localStorage.removeItem('currentVerbalTest');

    // Build wrong questions for AI review
    const wrongs: WrongQuestion[] = [];
    questions.forEach((question, index) => {
      const studentAnswer = selectedAnswers[index];
      const correctIdx = question.correctOptionIndex ?? 0;
      if (studentAnswer === undefined || studentAnswer !== correctIdx) {
        wrongs.push({
          questionText: question.text || question.question || '',
          options: question.options || question.choices || [],
          studentAnswerIndex: studentAnswer ?? null,
          correctAnswerIndex: correctIdx,
          category: question.category,
          subcategory: question.subcategory,
        });
      }
    });

    setPendingResultData(results);
    setWrongQuestionsForAI(wrongs);
    localStorage.setItem('lastTestResult', JSON.stringify(results));
    setShowAiReview(true);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeColor = () => {
    if (timeRemaining <= 60) return 'text-red-600';
    if (timeRemaining <= 300) return 'text-yellow-600';
    return 'text-green-600';
  };


  const getAnsweredCount = () => {
    return Object.keys(selectedAnswers).length;
  };

  if (showAiReview) {
    const userStr = localStorage.getItem('user');
    const userEmail = userStr ? JSON.parse(userStr)?.email : undefined;
    const totalQ = pendingResultData?.totalQuestions || 0;
    const correctQ = pendingResultData?.correctAnswers || 0;
    return (
      <AiReviewingScreen
        wrongQuestions={wrongQuestionsForAI}
        totalQuestions={totalQ}
        score={correctQ}
        userEmail={userEmail}
        onShowResults={() => setLocation('/test-results')}
      />
    );
  }

  if (isLoading || !testConfig || !questions || !Array.isArray(questions) || questions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-500 dark:from-gray-900 dark:to-blue-900/20 flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            {isLoading ? 'جاري تحميل الأسئلة...' : 
             !allQuestions || allQuestions.length === 0 ? 'جاري تحميل قاعدة البيانات...' :
             `لا توجد أسئلة متوفرة لقسم "${testConfig?.subcategory}"`}
          </p>
          {!isLoading && testConfig && (
            <Button
              onClick={() => setLocation('/verbal-tests')}
              className="mt-4 bg-blue-500 hover:bg-blue-600"
            >
              العودة إلى قائمة الاختبارات
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Show start screen if test hasn't started yet
  if (!hasStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-500 dark:from-gray-900 dark:to-blue-900/20 flex items-center justify-center p-4">
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
                <BookOpen className="w-12 h-12 md:w-16 md:h-16 text-blue-600 mx-auto" />
              </motion.div>
              
              <div className="space-y-3">
                <h1 className="text-xl md:text-3xl font-bold text-gray-800 dark:text-white">
                  {testConfig.testName}
                </h1>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl">
                    <div className="font-semibold text-blue-700 dark:text-blue-300 text-xs">عدد الأسئلة</div>
                    <div className="text-2xl font-bold text-blue-600">{questions.length}</div>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-xl">
                    <div className="font-semibold text-green-700 dark:text-green-300 text-xs">المدة المحددة</div>
                    <div className="text-2xl font-bold text-green-600">{testConfig.timeLimit} دقيقة</div>
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
      {/* ── مودال شرح القسم ── */}
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
                <BookOpen className="w-4 h-4 flex-shrink-0" />
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
                <Button onClick={finishTest} variant="destructive" className="flex-1">إنهاء الاختبار</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <QiyasExamLayout
        examTitle={testConfig.testName}
        questionNumber={currentQuestionIndex + 1}
        totalQuestions={questions.length}
        timeLeft={timeRemaining}
        isTimeUrgent={timeRemaining < 180}
        questionText={currentQuestion?.text || currentQuestion?.question || ''}
        questionImageUrl={currentQuestion?.imageUrl}
        options={currentQuestion?.options || currentQuestion?.choices || []}
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