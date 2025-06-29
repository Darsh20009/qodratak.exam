import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { 
  Clock, 
  ArrowLeft, 
  ArrowRight, 
  Play, 
  Pause, 
  Check, 
  AlertTriangle,
  Trophy,
  Star,
  Target
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

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
  const [showConfirmFinish, setShowConfirmFinish] = useState(false);
  const [testConfig, setTestConfig] = useState<TestConfig | null>(null);

  // Fetch all questions
  const { data: allQuestions = [], isLoading } = useQuery<Question[]>({
    queryKey: ['/api/questions'],
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

  // Filter questions by subcategory and limit to required count
  const questions = React.useMemo(() => {
    if (!allQuestions || !Array.isArray(allQuestions) || !testConfig) return [];

    const filtered = allQuestions.filter(q => 
      q.subcategory === testConfig.subcategory || q.category === testConfig.subcategory
    );

    console.log(`Found ${filtered.length} questions for subcategory: ${testConfig.subcategory}`);

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
    if (timeRemaining > 0 && !isPaused) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    } else if (timeRemaining === 0) {
      handleFinishTest();
    }
  }, [timeRemaining, isPaused]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeColor = () => {
    if (timeRemaining <= 300) return 'text-red-500'; // Last 5 minutes
    if (timeRemaining <= 600) return 'text-orange-500'; // Last 10 minutes
    return 'text-green-500';
  };

  const handleAnswerSelect = (answerIndex: string) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [currentQuestionIndex]: answerIndex
    }));
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleFinishTest = () => {
    if (!questions || !testConfig) return;

    // Calculate results
    let correctCount = 0;
    const totalQuestions = questions.length;

    questions.forEach((question, index) => {
      const userAnswer = selectedAnswers[index];
      const correctAnswer = question.correctOptionIndex?.toString() || question.correct_answer;
      if (userAnswer === correctAnswer) {
        correctCount++;
      }
    });

    const percentage = Math.round((correctCount / totalQuestions) * 100);
    const results = {
      testName: testConfig.testName,
      subcategory: testConfig.subcategory,
      totalQuestions,
      correctAnswers: correctCount,
      percentage,
      timeSpent: testConfig.timeLimit * 60 - timeRemaining,
      date: new Date().toISOString(),
      answers: selectedAnswers,
      questions: questions
    };

    // Store results locally
    const existingResults = JSON.parse(localStorage.getItem('verbalTestResults') || '[]');
    existingResults.push(results);
    localStorage.setItem('verbalTestResults', JSON.stringify(existingResults));

    // Clear test config
    localStorage.removeItem('currentVerbalTest');

    // Navigate to results
    localStorage.setItem('lastTestResult', JSON.stringify(results));
    setLocation('/test-results');
  };

  const getAnsweredCount = () => {
    return Object.keys(selectedAnswers).length;
  };

  const currentQuestion = questions && Array.isArray(questions) && questions.length > 0 && currentQuestionIndex < questions.length ? questions[currentQuestionIndex] : null;

  // Debug logging
  React.useEffect(() => {
    console.log('Questions array:', questions);
    console.log('Questions length:', questions?.length);
    console.log('Current question index:', currentQuestionIndex);
    console.log('Current question:', currentQuestion);
    console.log('Test config:', testConfig);
  }, [questions, currentQuestionIndex, currentQuestion, testConfig]);

  if (isLoading || !testConfig || !questions || !Array.isArray(questions) || questions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900 dark:to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-lg font-semibold text-gray-700 dark:text-gray-300 leading-relaxed">
              {isLoading ? 'جاري تحميل الأسئلة...' : 
               !allQuestions || allQuestions.length === 0 ? 'جاري تحميل قاعدة البيانات...' :
               `لا توجد أسئلة متوفرة لقسم "${testConfig?.subcategory}" حالياً. يرجى اختيار قسم آخر أو المحاولة لاحقاً.`}
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

  const submitTest = async () => {
    if (!testConfig || !questions || answers) return;

    const finalScore = calculateScore();
    const timeTakenInSeconds = Math.floor((Date.now() - startTime) / 1000);

    const testResult = {
      date: new Date().toISOString(),
      examType: testConfig.subcategory === "التناظر اللفظي" ? "verbal" : "mixed",
      score: finalScore,
      totalQuestions: questions.length,
      timeTaken: timeTakenInSeconds
    };

    console.log('Submitting test result:', testResult);

    // Save to localStorage immediately with multiple keys for fallback
    localStorage.setItem('currentTestResult', JSON.stringify(testResult));
    localStorage.setItem('testResult', JSON.stringify(testResult));
    localStorage.setItem('lastTestResult', JSON.stringify(testResult));

    try {
      const response = await fetch("/api/test-results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(testResult),
      });

      if (response.ok) {
        console.log('Test result saved successfully to server');
      } else {
        console.warn('Failed to save test result to server, but stored locally');
      }
    } catch (error) {
      console.error("Error saving test result to server:", error);
    }

    // Navigate with URL params as backup
    const params = new URLSearchParams({
      score: finalScore.toString(),
      total: questions.length.toString(),
      examType: testResult.examType,
      timeTaken: timeTakenInSeconds.toString()
    });

    setLocation(`/test-results?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900 dark:to-indigo-900">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Header */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Trophy className="w-8 h-8 text-blue-500" />
                <div>
                  <div className="text-2xl font-bold">{testConfig.testName}</div>
                  <Badge variant="outline" className="mt-1">
                    {testConfig.subcategory}
                  </Badge>
                </div>
              </div>
              <div className="text-left">
                <div className={`text-3xl font-bold ${getTimeColor()}`}>
                  {formatTime(timeRemaining)}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  الوقت المتبقي
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                <Target className="w-6 h-6 text-green-500" />
                <div>
                  <div className="text-lg font-bold">{getAnsweredCount()} / {questions.length}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">الأسئلة المُجابة</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Star className="w-6 h-6 text-yellow-500" />
                <div>
                  <div className="text-lg font-bold">{Math.round((getAnsweredCount() / questions.length) * 100)}%</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">نسبة الإكمال</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-6 h-6 text-blue-500" />
                <div>
                  <div className="text-lg font-bold">{testConfig.timeLimit} دقيقة</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">وقت الاختبار</div>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <Progress 
                value={(getAnsweredCount() / questions.length) * 100} 
                className="h-3"
              />
            </div>
          </CardContent>
        </Card>

        {/* Question */}
        <AnimatePresence mode="wait">
          {questions && Array.isArray(questions) && questions.length > 0 && currentQuestion ? (
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
                        {currentQuestion?.subcategory || 'غير محدد'}
                      </Badge>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl leading-relaxed mb-6 text-gray-800 dark:text-white">
                    {currentQuestion?.text || currentQuestion?.question || 'لا يوجد نص للسؤال'}
                  </div>

                  <div className="grid gap-3">
                    {(currentQuestion?.options || currentQuestion?.choices) && Array.isArray(currentQuestion?.options || currentQuestion?.choices) && (currentQuestion?.options || currentQuestion?.choices)!.map((choice: string, index: number) => (
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
          ) : (
            <Card className="mb-6">
              <CardContent className="p-8 text-center">
                <div className="text-xl text-gray-600 dark:text-gray-400 mb-4">
                  لا يمكن تحميل السؤال الحالي
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">
                  فهرس السؤال: {currentQuestionIndex} من {questions?.length || 0}
                </p>
                <Button
                  onClick={() => setLocation('/verbal-tests')}
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                >
                  العودة إلى قائمة الاختبارات
                </Button>
              </CardContent>
            </Card>
          )}
        </AnimatePresence>

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

            {currentQuestionIndex === questions.length - 1 ? (
              <Button
                onClick={() => setShowConfirmFinish(true)}
                className="flex items-center gap-2 bg-green-500 hover:bg-green-600"
              >
                <Check className="w-4 h-4" />
                إنهاء الاختبار
              </Button>
            ) : null}
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