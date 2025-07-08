import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Clock,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Home,
  Play,
  Pause,
  Star,
  BookOpen
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

  // Fetch questions for free verbal test
  const { data: questions, isLoading, error } = useQuery({
    queryKey: ['/api/questions/free-test/verbal'],
    enabled: true,
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

  const finishTest = () => {
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

    // Save results to localStorage
    const testResult = {
      testId: 'free-verbal-test',
      testName: 'الاختبار اللفظي المجاني',
      date: new Date().toISOString(),
      correctAnswers,
      totalQuestions,
      percentage,
      timeSpent: (20 * 60) - timeRemaining,
      subcategory: 'اختبار مجاني',
      category: 'verbal'
    };

    const existingResults = JSON.parse(localStorage.getItem('verbalTestResults') || '[]');
    existingResults.push(testResult);
    localStorage.setItem('verbalTestResults', JSON.stringify(existingResults));

    setShowResults(true);
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
  };

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
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 dark:from-gray-900 dark:to-red-900 flex items-center justify-center">
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
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-green-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Star className="w-8 h-8 text-green-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                الاختبار اللفظي المجاني
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                السؤال {currentQuestionIndex + 1} من {questions.length}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-4 py-2 rounded-lg shadow">
              <Clock className="w-5 h-5 text-blue-600" />
              <span className={`font-mono text-lg font-bold ${
                timeRemaining <= 300 ? 'text-red-600' : 'text-blue-600'
              }`}>
                {formatTime(timeRemaining)}
              </span>
            </div>
            
            <Button onClick={togglePause} variant="outline" size="sm">
              {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <Progress value={progress} className="h-2" />
        </div>

        {/* Question */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="text-green-600 border-green-600">
                {currentQuestion.subcategory}
              </Badge>
              <Badge variant={currentQuestion.difficulty === 'سهل' ? 'default' : 
                             currentQuestion.difficulty === 'متوسط' ? 'secondary' : 'destructive'}>
                {currentQuestion.difficulty}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-lg leading-relaxed text-gray-800 dark:text-white mb-6">
              {currentQuestion.text}
            </p>
            
            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => (
                <motion.button
                  key={index}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => selectAnswer(index)}
                  className={`w-full p-4 text-right rounded-lg border-2 transition-all ${
                    answers[currentQuestionIndex] === index
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200'
                      : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-green-300 dark:hover:border-green-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-bold ${
                      answers[currentQuestionIndex] === index
                        ? 'border-green-500 bg-green-500 text-white'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}>
                      {String.fromCharCode(65 + index)}
                    </span>
                    <span className="flex-1">{option}</span>
                  </div>
                </motion.button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button 
            onClick={previousQuestion} 
            disabled={currentQuestionIndex === 0}
            variant="outline"
          >
            السؤال السابق
          </Button>
          
          <div className="flex gap-3">
            {currentQuestionIndex === questions.length - 1 ? (
              <Button onClick={finishTest} className="bg-green-600 hover:bg-green-700">
                إنهاء الاختبار
              </Button>
            ) : (
              <Button onClick={nextQuestion} className="bg-green-600 hover:bg-green-700">
                السؤال التالي
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}