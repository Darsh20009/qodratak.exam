import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  ArrowLeft,
  ArrowRight,
  Flag,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Pause,
  Play,
  RotateCcw,
  Target,
  Trophy,
  BookOpen,
  Brain
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";

interface Question {
  id: number;
  question: string;
  choices: string[];
  correct_answer: string;
  explanation?: string;
  subcategory: string;
  difficulty: string;
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
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{[key: number]: string}>({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [showConfirmFinish, setShowConfirmFinish] = useState(false);
  const [testConfig, setTestConfig] = useState<TestConfig | null>(null);

  // Get test configuration from URL params or local storage
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const storedConfig = localStorage.getItem('currentVerbalTest');
    
    if (storedConfig) {
      const config = JSON.parse(storedConfig);
      setTestConfig(config);
      setTimeRemaining(config.timeLimit * 60); // Convert minutes to seconds
    } else {
      // Redirect back if no config
      setLocation('/verbal-tests');
    }
  }, [setLocation]);

  // Fetch questions for the specific subcategory
  const { data: allQuestions = [], isLoading } = useQuery<Question[]>({
    queryKey: ['/api/questions'],
    enabled: !!testConfig,
  });

  // Filter questions by subcategory and limit to required count
  const questions = React.useMemo(() => {
    if (!allQuestions || !Array.isArray(allQuestions) || !testConfig) return [];
    
    const filtered = allQuestions.filter(q => 
      q.subcategory === testConfig.subcategory
    );
    
    console.log(`Found ${filtered.length} questions for subcategory: ${testConfig.subcategory}`);
    
    // If no questions found, try with different variations
    if (filtered.length === 0) {
      // Try with alternative names
      const alternatives = allQuestions.filter(q => 
        q.subcategory && q.subcategory.includes(testConfig.subcategory.split(' ')[0])
      );
      console.log(`Found ${alternatives.length} alternative questions`);
      
      if (alternatives.length > 0) {
        const shuffled = [...alternatives].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, Math.min(testConfig.questionCount, alternatives.length));
      }
      return [];
    }
    
    // Shuffle and take required amount
    const shuffled = [...filtered].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, testConfig.questionCount);
  }, [allQuestions, testConfig]);

  // Timer effect
  useEffect(() => {
    if (timeRemaining > 0 && !isPaused && !isFinished) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handleFinishTest();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [timeRemaining, isPaused, isFinished]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerSelect = (answerIndex: string) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [currentQuestionIndex]: answerIndex
    }));
  };

  const handleNextQuestion = () => {
    if (questions && Array.isArray(questions) && currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleFinishTest = useCallback(() => {
    setIsFinished(true);
    setIsPaused(true);
    
    // Calculate results
    let correctCount = 0;
    if (questions && Array.isArray(questions)) {
      questions.forEach((question: Question, index: number) => {
        if (selectedAnswers[index] === question.correct_answer) {
          correctCount++;
        }
      });
    }

    const percentage = Math.round((correctCount / (questions?.length || 1)) * 100);
    
    // Save results
    const testResult = {
      testId: testConfig?.testId,
      testName: testConfig?.testName,
      subcategory: testConfig?.subcategory,
      totalQuestions: questions?.length || 0,
      correctAnswers: correctCount,
      percentage,
      timeTaken: (testConfig?.timeLimit || 0) * 60 - timeRemaining,
      date: new Date().toISOString(),
      answers: selectedAnswers
    };

    // Store in local history
    const history = JSON.parse(localStorage.getItem('verbalTestHistory') || '[]');
    history.push(testResult);
    localStorage.setItem('verbalTestHistory', JSON.stringify(history));

    // Clear current test
    localStorage.removeItem('currentVerbalTest');

    // Redirect to results
    setTimeout(() => {
      setLocation('/verbal-tests');
    }, 3000);
  }, [questions, selectedAnswers, testConfig, timeRemaining, setLocation]);

  const getTimeWarningColor = () => {
    const percentage = (timeRemaining / ((testConfig?.timeLimit || 1) * 60)) * 100;
    if (percentage <= 10) return 'text-red-600 dark:text-red-400';
    if (percentage <= 25) return 'text-orange-600 dark:text-orange-400';
    return 'text-green-600 dark:text-green-400';
  };

  const getProgressPercentage = () => {
    if (!questions || !Array.isArray(questions) || questions.length === 0) return 0;
    return ((currentQuestionIndex + 1) / questions.length) * 100;
  };

  const getAnsweredCount = () => {
    return Object.keys(selectedAnswers).length;
  };

  if (isLoading || !testConfig || !questions || !Array.isArray(questions) || questions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900 dark:to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            {isLoading ? 'جاري تحميل الأسئلة...' : 
             !allQuestions || allQuestions.length === 0 ? 'جاري تحميل قاعدة البيانات...' :
             'لا توجد أسئلة متوفرة لهذا القسم حالياً'}
          </p>
          {!isLoading && testConfig && (
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                اختبار {testConfig.testName}
              </p>
              {!questions || questions.length === 0 ? (
                <Button
                  onClick={() => setLocation('/verbal-tests')}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg"
                >
                  العودة إلى قائمة الاختبارات
                </Button>
              ) : null}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (isFinished) {
    const correctCount = questions && Array.isArray(questions) ? questions.filter((q: Question, index: number) => 
      selectedAnswers[index] === q.correct_answer
    ).length : 0;
    const percentage = Math.round((correctCount / (questions?.length || 1)) * 100);

    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900 dark:to-emerald-900 flex items-center justify-center">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center max-w-md mx-auto p-8"
        >
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <Trophy className="w-12 h-12 text-white" />
          </motion.div>
          
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">
            اكتمل الاختبار!
          </h2>
          
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl">
            <div className="text-4xl font-bold text-green-600 mb-2">
              {percentage}%
            </div>
            <div className="text-gray-600 dark:text-gray-400 mb-4">
              {correctCount} من {questions?.length || 0} إجابة صحيحة
            </div>
            <div className="text-sm text-gray-500">
              سيتم توجيهك إلى الصفحة الرئيسية خلال ثوانٍ...
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  const currentQuestion = questions && Array.isArray(questions) && questions.length > 0 ? questions[currentQuestionIndex] : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900 dark:to-indigo-900">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="outline"
            onClick={() => setLocation('/verbal-tests')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            العودة
          </Button>

          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="text-lg px-4 py-2">
              {testConfig.testName}
            </Badge>
          </div>

          <Button
            onClick={() => setShowConfirmFinish(true)}
            className="bg-red-500 hover:bg-red-600 text-white"
          >
            <Flag className="w-4 h-4 mr-2" />
            إنهاء الاختبار
          </Button>
        </div>

        {/* Progress and Timer */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Progress */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">التقدم</span>
                  <span className="text-sm text-gray-600">
                    {currentQuestionIndex + 1} / {questions?.length || 0}
                  </span>
                </div>
                <Progress value={getProgressPercentage()} className="h-3" />
              </div>

              {/* Timer */}
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Clock className={`w-5 h-5 ${getTimeWarningColor()}`} />
                  <span className="text-sm font-medium">الوقت المتبقي</span>
                </div>
                <div className={`text-2xl font-bold ${getTimeWarningColor()}`}>
                  {formatTime(timeRemaining)}
                </div>
              </div>

              {/* Answered Count */}
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium">تم الإجابة</span>
                </div>
                <div className="text-2xl font-bold text-green-600">
                  {getAnsweredCount()} / {questions?.length || 0}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Question */}
        {currentQuestion && questions && Array.isArray(questions) && questions.length > 0 && (
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestionIndex}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
                      {currentQuestionIndex + 1}
                    </div>
                    <div className="flex-1">
                      <div className="text-lg">السؤال {currentQuestionIndex + 1}</div>
                      <Badge variant="outline" className="mt-1">
                        {currentQuestion.subcategory}
                      </Badge>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl leading-relaxed mb-6 text-gray-800 dark:text-white">
                    {currentQuestion.question}
                  </div>

                  <div className="grid gap-3">
                    {currentQuestion && currentQuestion.choices && currentQuestion.choices.map((choice: string, index: number) => (
                      <motion.button
                        key={index}
                        onClick={() => handleAnswerSelect(index.toString())}
                        className={`p-4 text-right rounded-xl border-2 transition-all duration-200 ${
                          selectedAnswers[currentQuestionIndex] === index.toString()
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800'
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-bold ${
                            selectedAnswers[currentQuestionIndex] === index.toString()
                              ? 'border-blue-500 bg-blue-500 text-white'
                              : 'border-gray-400'
                          }`}>
                            {String.fromCharCode(65 + index)}
                          </div>
                          <span className="flex-1 text-lg">{choice}</span>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            onClick={handlePreviousQuestion}
            disabled={currentQuestionIndex === 0}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ArrowRight className="w-4 h-4" />
            السؤال السابق
          </Button>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => setIsPaused(!isPaused)}
              variant="outline"
              className="flex items-center gap-2"
            >
              {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              {isPaused ? 'استكمال' : 'إيقاف مؤقت'}
            </Button>
          </div>

          <Button
            onClick={handleNextQuestion}
            disabled={!questions || !Array.isArray(questions) || currentQuestionIndex === questions.length - 1}
            className="flex items-center gap-2"
          >
            السؤال التالي
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </div>

        {/* Confirm Finish Dialog */}
        <AnimatePresence>
          {showConfirmFinish && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
              onClick={() => setShowConfirmFinish(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md mx-4"
              >
                <div className="text-center">
                  <AlertTriangle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2">تأكيد إنهاء الاختبار</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    هل أنت متأكد من رغبتك في إنهاء الاختبار؟ لن تتمكن من العودة إليه مرة أخرى.
                  </p>
                  <div className="flex gap-3">
                    <Button
                      onClick={() => setShowConfirmFinish(false)}
                      variant="outline"
                      className="flex-1"
                    >
                      إلغاء
                    </Button>
                    <Button
                      onClick={handleFinishTest}
                      className="flex-1 bg-red-500 hover:bg-red-600"
                    >
                      إنهاء الاختبار
                    </Button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}