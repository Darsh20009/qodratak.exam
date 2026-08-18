import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import AiReviewingScreen, { WrongQuestion, QuestionExplanation } from '@/components/AiReviewingScreen';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { EndTestButton } from '@/components/ui/EndTestButton';
import { QiyasExamLayout } from '@/components/QiyasExamLayout';
import {
  Clock,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Home,
  Play,
  Pause,
  Star,
  BookOpen,
  Bookmark,
  BookmarkCheck
} from 'lucide-react';

interface Question {
  id: number;
  category: string;
  subcategory: string;
  text: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
  difficulty: string;
  imageUrl?: string;
}

interface TestResult {
  questionId: number;
  selectedAnswer: number;
  isCorrect: boolean;
  timeTaken: number;
}

export function FreeVerbalTestRunner() {
  const [, setLocation] = useLocation();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [key: number]: number }>({});
  const [timeRemaining, setTimeRemaining] = useState(20 * 60); // 20 minutes
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [testStartTime, setTestStartTime] = useState<number | null>(null);
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [showAiReview, setShowAiReview] = useState(false);
  const [wrongQuestionsForAI, setWrongQuestionsForAI] = useState<WrongQuestion[]>([]);
  const [aiExplanations, setAiExplanations] = useState<QuestionExplanation[]>([]);
  const [bookmarkedQuestions, setBookmarkedQuestions] = useState<Set<number>>(new Set());

  const toggleBookmark = (index: number) => {
    setBookmarkedQuestions(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index); else next.add(index);
      return next;
    });
  };

  // Get user data to check authentication
  const { data: user } = useQuery<any>({
    queryKey: ['/api/user'],
  });

  // Fetch questions for free verbal test (available without login)
  const { data: questions = [], isLoading, error } = useQuery<Question[]>({
    queryKey: ['/api/questions/free-test/verbal'],
  });

  // Start test
  const startTest = () => {
    setIsRunning(true);
    setTestStartTime(Date.now());
    setQuestionStartTime(Date.now());
  };

  // Timer effect
  useEffect(() => {
    if (!isRunning || isPaused || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          finishTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning, isPaused, timeRemaining]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const selectAnswer = (answerIndex: number) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestionIndex]: answerIndex
    }));
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < (questions?.length || 0) - 1) {
      recordQuestionResult();
      setCurrentQuestionIndex(prev => prev + 1);
      setQuestionStartTime(Date.now());
    }
  };

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      setQuestionStartTime(Date.now());
    }
  };

  const recordQuestionResult = () => {
    if (!questions) return;
    
    const question = questions[currentQuestionIndex];
    const selectedAnswer = answers[currentQuestionIndex];
    const timeTaken = Date.now() - questionStartTime;
    
    const result: TestResult = {
      questionId: question.id,
      selectedAnswer: selectedAnswer ?? -1,
      isCorrect: selectedAnswer === question.correctOptionIndex,
      timeTaken
    };

    setTestResults(prev => {
      const newResults = [...prev];
      newResults[currentQuestionIndex] = result;
      return newResults;
    });
  };

  const finishTest = async () => {
    recordQuestionResult();
    setIsRunning(false);
    
    // Calculate final results
    const finalResults = questions?.map((question, index) => {
      const selectedAnswer = answers[index];
      return {
        questionId: question.id,
        selectedAnswer: selectedAnswer ?? -1,
        isCorrect: selectedAnswer === question.correctOptionIndex,
        timeTaken: 0 // Simplified for free test
      };
    }) || [];

    const correctAnswers = finalResults.filter(r => r.isCorrect).length;
    const totalQuestions = questions?.length || 0;
    const percentage = Math.round((correctAnswers / totalQuestions) * 100);
    const timeTaken = (20 * 60) - timeRemaining;
    const skippedQuestions = Object.keys(answers).length < totalQuestions ? totalQuestions - Object.keys(answers).length : 0;

    // Save results to localStorage
    const testResult = {
      testId: 'free-verbal-test',
      testName: 'الاختبار اللفظي المجاني',
      date: new Date().toISOString(),
      correctAnswers,
      score: correctAnswers,
      totalQuestions,
      percentage,
      timeSpent: timeTaken,
      timeTaken: Math.round(timeTaken / 60),
      subcategory: 'اختبار مجاني',
      category: 'verbal',
      examType: 'اختبار لفظي مجاني'
    };

    const existingResults = JSON.parse(localStorage.getItem('verbalTestResults') || '[]');
    existingResults.push(testResult);
    localStorage.setItem('verbalTestResults', JSON.stringify(existingResults));

    // إرسال النتائج للسيرفر لحساب النقاط باستخدام النظام المركزي
    if (user?.id) {
      const { saveTestResultsWithPoints } = await import('@/lib/points-helper');
      await saveTestResultsWithPoints({
        userId: user.id,
        testType: 'free-verbal',
        difficulty: 'beginner',
        correctAnswers,
        totalQuestions,
        skippedQuestions,
        timeTaken: Math.round(timeTaken / 60)
      });
      // تسجيل الأسئلة المشاهدة لمنع تكرارها في المستقبل
      try {
        const qIds = (questions || []).map((q: any) => q._id || q.id || q.questionId).filter(Boolean);
        if (qIds.length) await fetch('/api/test-results/mark-seen', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ questionIds: qIds }) });
      } catch {}
    }

    // Build wrong questions for AI review
    const wrongs: WrongQuestion[] = [];
    (questions || []).forEach((question, index) => {
      const studentAnswer = answers[index];
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
    setWrongQuestionsForAI(wrongs);
    setShowAiReview(true);
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  const restartTest = () => {
    setCurrentQuestionIndex(0);
    setAnswers({});
    setTimeRemaining(20 * 60);
    setIsRunning(false);
    setIsPaused(false);
    setTestStartTime(null);
    setTestResults([]);
    setShowResults(false);
    setShowAiReview(false);
    setWrongQuestionsForAI([]);
    setAiExplanations([]);
  };

  // Show login prompt for non-authenticated users
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-teal-500 dark:from-gray-900 dark:via-blue-900 dark:to-teal-500 relative overflow-hidden flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center p-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl border border-white/20 shadow-2xl max-w-md mx-4"
        >
          <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">
            تسجيل الدخول مطلوب
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
            يجب تسجيل الدخول أولاً للوصول إلى الاختبار المجاني. قم بالتسجيل للحصول على اختبار مجاني يومياً (20 سؤال) أو ترقية للحصول على وصول غير محدود
          </p>
          <div className="flex gap-3">
            <Button
              onClick={() => setLocation('/login')}
              className="flex-1 bg-gradient-to-r from-blue-500 to-emerald-600 text-white font-semibold py-3 px-6 rounded-xl hover:shadow-lg transition-all duration-300"
            >
              تسجيل الدخول
            </Button>
            <Button
              onClick={() => setLocation('/verbal-tests')}
              variant="outline"
              className="flex-1 py-3 px-6 rounded-xl"
            >
              العودة
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-green-900 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-green-200 border-t-green-600 rounded-full"
        />
      </div>
    );
  }

  if (error || !questions || questions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-amber-600 dark:from-gray-900 dark:to-red-900 flex items-center justify-center">
        <Card className="max-w-md mx-4">
          <CardContent className="p-6 text-center">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
              خطأ في تحميل الاختبار
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              حدث خطأ أثناء تحميل أسئلة الاختبار المجاني
            </p>
            <Button onClick={() => setLocation('/verbal-tests')} className="w-full">
              العودة إلى اختبارات اللفظي
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show AI review screen
  if (showAiReview) {
    const userStr = localStorage.getItem('user');
    const userEmail = userStr ? JSON.parse(userStr)?.email : undefined;
    const totalQ = (questions || []).length;
    const correctQ = Object.entries(answers).filter(([idx, ans]) =>
      (questions || [])[parseInt(idx)]?.correctOptionIndex === ans
    ).length;
    return (
      <AiReviewingScreen
        wrongQuestions={wrongQuestionsForAI}
        totalQuestions={totalQ}
        score={correctQ}
        userEmail={userEmail}
        onShowResults={(explanations) => {
          if (explanations) setAiExplanations(explanations);
          setShowAiReview(false);
          setShowResults(true);
        }}
      />
    );
  }

  // Show results
  if (showResults) {
    const correctAnswers = Object.entries(answers).filter(([index, answer]) => 
      questions[parseInt(index)]?.correctOptionIndex === answer
    ).length;
    const totalQuestions = questions.length;
    const percentage = Math.round((correctAnswers / totalQuestions) * 100);

    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-green-900 p-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <Star className="w-8 h-8 text-yellow-500" />
              <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
                نتائج الاختبار اللفظي المجاني
              </h1>
            </div>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardContent className="p-6 text-center">
                <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-3" />
                <h3 className="text-2xl font-bold text-green-600">{correctAnswers}</h3>
                <p className="text-gray-600 dark:text-gray-300">إجابات صحيحة</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <BookOpen className="w-12 h-12 text-blue-600 mx-auto mb-3" />
                <h3 className="text-2xl font-bold text-blue-600">{totalQuestions}</h3>
                <p className="text-gray-600 dark:text-gray-300">إجمالي الأسئلة</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <Star className="w-12 h-12 text-yellow-600 mx-auto mb-3" />
                <h3 className="text-2xl font-bold text-yellow-600">{percentage}%</h3>
                <p className="text-gray-600 dark:text-gray-300">النتيجة النهائية</p>
              </CardContent>
            </Card>
          </div>

          {/* Bookmarked Questions */}
          {bookmarkedQuestions.size > 0 && (
            <Card className="mb-8 border-amber-200 dark:border-amber-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
                  <BookmarkCheck className="w-5 h-5" />
                  الأسئلة المعلّمة للمراجعة ({bookmarkedQuestions.size})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Array.from(bookmarkedQuestions).sort((a,b)=>a-b).map(idx => {
                  const q = questions[idx];
                  const studentAns = answers[idx];
                  const isCorrect = studentAns === q?.correctOptionIndex;
                  return q ? (
                    <div key={idx} className={`p-4 rounded-xl border-2 ${isCorrect ? 'border-green-200 bg-green-50 dark:bg-green-900/10' : 'border-red-200 bg-red-50 dark:bg-red-900/10'}`}>
                      <div className="flex items-start gap-3">
                        {isCorrect ? <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 shrink-0" /> : <XCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />}
                        <div className="flex-1">
                          <p className="font-semibold text-sm text-gray-500 mb-1">السؤال {idx + 1}</p>
                          <p className="text-gray-800 dark:text-white mb-2">{q.text}</p>
                          {!isCorrect && studentAns !== undefined && (
                            <p className="text-sm text-red-600">إجابتك: {q.options[studentAns]}</p>
                          )}
                          <p className="text-sm text-green-700 dark:text-green-400 font-medium">الإجابة الصحيحة: {q.options[q.correctOptionIndex]}</p>
                        </div>
                      </div>
                    </div>
                  ) : null;
                })}
              </CardContent>
            </Card>
          )}

          {aiExplanations.length > 0 && wrongQuestionsForAI.length > 0 && (
            <Card className="mb-8 border-2 border-teal-400 dark:border-teal-400 shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-green-500 to-teal-500 p-5 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-xl">🤖</div>
                <div>
                  <h3 className="text-white font-bold text-lg">شروحات الذكاء الاصطناعي لأخطائك</h3>
                  <p className="text-teal-700 text-sm">شرح مخصص لك بناءً على مستواك ونمط أخطائك</p>
                </div>
              </div>
              <CardContent className="p-0 divide-y divide-gray-100 dark:divide-gray-700">
                {aiExplanations.map((exp, i) => {
                  const wq = wrongQuestionsForAI[exp.questionIndex];
                  if (!wq) return null;
                  return (
                    <div key={i} className="p-5 bg-white dark:bg-gray-800 hover:bg-teal-100 dark:hover:bg-teal-100/20 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="w-7 h-7 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center text-red-600 font-bold text-sm flex-shrink-0 mt-0.5">{i + 1}</div>
                        <div className="flex-1 min-w-0 space-y-2">
                          <p className="text-gray-800 dark:text-gray-200 font-medium text-sm leading-relaxed">{wq.questionText}</p>
                          <div className="flex flex-wrap gap-2 text-xs">
                            <span className="px-2 py-1 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 rounded-full">
                              ✗ إجابتك: {wq.studentAnswerIndex !== null ? (wq.options[wq.studentAnswerIndex] ?? 'لم تُجب') : 'لم تُجب'}
                            </span>
                            <span className="px-2 py-1 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 rounded-full">
                              ✓ الصحيح: {wq.options[wq.correctAnswerIndex]}
                            </span>
                            {exp.conceptError && (
                              <span className="px-2 py-1 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 rounded-full">
                                📌 {exp.conceptError}
                              </span>
                            )}
                          </div>
                          <div className="bg-teal-100 dark:bg-teal-100/20 border border-teal-400 dark:border-teal-400 rounded-xl p-3 space-y-1.5">
                            <p className="text-teal-700 dark:text-teal-700 text-sm leading-relaxed">{exp.explanation}</p>
                            {exp.tip && (
                              <p className="text-teal-700 dark:text-teal-700 text-xs font-medium">💡 {exp.tip}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          <div className="flex gap-4 justify-center">
            <Button onClick={() => setLocation('/verbal-tests')} className="flex items-center gap-2">
              <Home className="w-4 h-4" />
              العودة للاختبارات
            </Button>
            <Button onClick={restartTest} variant="outline" className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4" />
              إعادة الاختبار
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Pre-test screen
  if (!isRunning && !showResults) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-green-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto"
        >
          <Card className="border-2 border-green-200 dark:border-green-700">
            <CardHeader className="text-center">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Star className="w-12 h-12 text-green-600" />
                <CardTitle className="text-3xl text-green-800 dark:text-green-200">
                  الاختبار اللفظي المجاني
                </CardTitle>
              </div>
              <p className="text-gray-600 dark:text-gray-300 text-lg">
                اختبار مجاني للحسابات المسجلة - 20 سؤال متنوع في 20 دقيقة
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <BookOpen className="w-6 h-6 text-green-600" />
                  <div>
                    <p className="font-semibold text-green-800 dark:text-green-200">عدد الأسئلة</p>
                    <p className="text-green-600 dark:text-green-300">20 سؤال متنوع</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <Clock className="w-6 h-6 text-green-600" />
                  <div>
                    <p className="font-semibold text-green-800 dark:text-green-200">الوقت المحدد</p>
                    <p className="text-green-600 dark:text-green-300">20 دقيقة</p>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">ملاحظات مهمة:</h4>
                <ul className="text-yellow-700 dark:text-yellow-300 space-y-1 text-sm">
                  <li>• يمكن للحسابات المجانية أخذ اختبار واحد يومياً فقط</li>
                  <li>• الاختبار يحتوي على أسئلة متنوعة من جميع أقسام اللفظي</li>
                  <li>• سيتم حفظ النتيجة في تاريخ اختباراتك</li>
                  <li>• للوصول للاختبارات المتقدمة، قم بالترقية للحساب المميز</li>
                </ul>
              </div>

              <div className="flex gap-4">
                <Button onClick={startTest} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3">
                  <Play className="w-4 h-4 mr-2" />
                  بدء الاختبار
                </Button>
                <Button onClick={() => setLocation('/verbal-tests')} variant="outline" className="flex-1 py-3">
                  <Home className="w-4 h-4 mr-2" />
                  إلغاء
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const answeredCount = Object.keys(answers).length;
  const questionsStatusArr = questions.map((_, i) => ({
    answered: answers[i] !== undefined,
    bookmarked: bookmarkedQuestions.has(i),
  }));

  return (
    <QiyasExamLayout
      examTitle="الاختبار اللفظي المجاني"
      questionNumber={currentQuestionIndex + 1}
      totalQuestions={questions.length}
      timeLeft={timeRemaining}
      isTimeUrgent={timeRemaining < 180}
      questionText={currentQuestion?.text || ''}
      questionImageUrl={currentQuestion?.imageUrl}
      options={currentQuestion?.options || []}
      selectedAnswer={answers[currentQuestionIndex] !== undefined ? answers[currentQuestionIndex] : null}
      onSelectAnswer={selectAnswer}
      questionsStatus={questionsStatusArr}
      currentQuestionIndex={currentQuestionIndex}
      onJumpToQuestion={(i) => setCurrentQuestionIndex(i)}
      isBookmarked={bookmarkedQuestions.has(currentQuestionIndex)}
      onToggleBookmark={() => toggleBookmark(currentQuestionIndex)}
      onPrev={previousQuestion}
      onNext={nextQuestion}
      onFinish={finishTest}
      canGoPrev={currentQuestionIndex > 0}
      canGoNext={currentQuestionIndex < questions.length - 1}
      isLastQuestion={currentQuestionIndex === questions.length - 1}
      answeredCount={answeredCount}
      userName={user?.username || user?.name}
      userId={user?.id ? String(user.id) : undefined}
      topRightSlot={
        <button
          onClick={togglePause}
          className="mr-1 text-xs px-2 py-1 rounded bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
        >
          {isPaused ? 'استئناف' : 'إيقاف'}
        </button>
      }
    />
  );
}