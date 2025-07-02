import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Clock,
  CheckCircle2,
  X,
  ArrowLeft,
  ArrowRight,
  Play,
  Pause,
  RotateCcw,
  Eye,
  Brain,
  Zap,
  Target,
  Award,
  TrendingUp,
  Download,
  Star,
  Trophy
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface Question {
  id: number;
  text: string;
  options: string[];
  correctOptionIndex: number;
  explanation?: string;
  subcategory: string;
}

interface TestConfiguration {
  testId: string;
  testName: string;
  category: 'verbal' | 'quantitative';
  subcategory: string;
  timeLimit: number; // in seconds
  questionCount: number;
  difficulty: string;
  showExplanations: boolean;
  adaptiveDifficulty: boolean;
  aiAnalysis: boolean;
}

interface Answer {
  questionId: number;
  selectedOption: number | null;
  timeSpent: number;
  isCorrect?: boolean;
}

interface TestResult {
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  skippedQuestions: number;
  percentage: number;
  timeTaken: number;
  timeLimit: number;
  answers: Answer[];
  performanceLevel: string;
  weakAreas: string[];
  strongAreas: string[];
  improvements: string[];
}

interface Props {
  config: TestConfiguration;
  onComplete: (result: TestResult) => void;
  onExit: () => void;
}

export function EnhancedTestRunner({ config, onComplete, onExit }: Props) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [timeRemaining, setTimeRemaining] = useState(config.timeLimit);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Load questions
  const { data: user } = useQuery({
    queryKey: ['/api/user'],
  });

  // Load questions for the test
  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/questions?category=${config.category}&subcategory=${config.subcategory}`);
      const allQuestions = await response.json();
      
      // Shuffle and select required number of questions
      const shuffled = allQuestions.sort(() => 0.5 - Math.random());
      const selectedQuestions = shuffled.slice(0, config.questionCount);
      
      setQuestions(selectedQuestions);
      
      // Initialize answers array
      const initialAnswers = selectedQuestions.map((q: Question) => ({
        questionId: q.id,
        selectedOption: null,
        timeSpent: 0,
        isCorrect: false
      }));
      setAnswers(initialAnswers);
      
      setIsLoading(false);
      setIsTimerActive(true);
      setQuestionStartTime(Date.now());
    } catch (error) {
      console.error("Error loading questions:", error);
      toast({
        title: "خطأ في تحميل الأسئلة",
        description: "حدث خطأ أثناء تحميل أسئلة الاختبار",
        variant: "destructive"
      });
    }
  };

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isTimerActive && !isPaused && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleTimeUp();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => clearInterval(interval);
  }, [isTimerActive, isPaused, timeRemaining]);

  const handleTimeUp = () => {
    setIsTimerActive(false);
    toast({
      title: "انتهى الوقت",
      description: "تم انتهاء وقت الاختبار",
      variant: "destructive"
    });
    finishTest();
  };

  const handleAnswerSelect = (optionIndex: number) => {
    const timeSpent = Date.now() - questionStartTime;
    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = optionIndex === currentQuestion.correctOptionIndex;
    
    const updatedAnswers = [...answers];
    updatedAnswers[currentQuestionIndex] = {
      questionId: currentQuestion.id,
      selectedOption: optionIndex,
      timeSpent: Math.round(timeSpent / 1000),
      isCorrect
    };
    
    setAnswers(updatedAnswers);
    
    // Auto-advance to next question after a short delay
    setTimeout(() => {
      if (currentQuestionIndex < questions.length - 1) {
        nextQuestion();
      } else {
        setShowConfirmDialog(true);
      }
    }, 500);
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
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

  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  const finishTest = () => {
    setIsTimerActive(false);
    
    const correctAnswers = answers.filter(answer => answer.isCorrect).length;
    const wrongAnswers = answers.filter(answer => answer.selectedOption !== null && !answer.isCorrect).length;
    const skippedQuestions = answers.filter(answer => answer.selectedOption === null).length;
    const percentage = Math.round((correctAnswers / questions.length) * 100);
    const timeTaken = config.timeLimit - timeRemaining;
    
    // Performance analysis
    const performanceLevel = getPerformanceLevel(percentage);
    const { weakAreas, strongAreas } = analyzePerformance();
    const improvements = generateImprovements(percentage, weakAreas);
    
    const result: TestResult = {
      totalQuestions: questions.length,
      correctAnswers,
      wrongAnswers,
      skippedQuestions,
      percentage,
      timeTaken,
      timeLimit: config.timeLimit,
      answers,
      performanceLevel,
      weakAreas,
      strongAreas,
      improvements
    };
    
    // Save to localStorage for immediate use
    localStorage.setItem('lastTestResult', JSON.stringify({
      testName: config.testName,
      subcategory: config.subcategory,
      totalQuestions: questions.length,
      correctAnswers,
      percentage,
      timeSpent: timeTaken,
      date: new Date().toISOString(),
      performanceLevel,
      weakAreas,
      strongAreas
    }));
    
    onComplete(result);
  };

  const getPerformanceLevel = (percentage: number): string => {
    if (percentage >= 90) return 'ممتاز';
    if (percentage >= 80) return 'جيد جداً';
    if (percentage >= 70) return 'جيد';
    if (percentage >= 60) return 'مقبول';
    return 'يحتاج تحسين';
  };

  const analyzePerformance = () => {
    const subcategoryStats: { [key: string]: { correct: number; total: number } } = {};
    
    questions.forEach((question, index) => {
      const answer = answers[index];
      const subcategory = question.subcategory;
      
      if (!subcategoryStats[subcategory]) {
        subcategoryStats[subcategory] = { correct: 0, total: 0 };
      }
      
      subcategoryStats[subcategory].total++;
      if (answer.isCorrect) {
        subcategoryStats[subcategory].correct++;
      }
    });
    
    const strongAreas: string[] = [];
    const weakAreas: string[] = [];
    
    Object.entries(subcategoryStats).forEach(([subcategory, stats]) => {
      const percentage = (stats.correct / stats.total) * 100;
      if (percentage >= 80) {
        strongAreas.push(subcategory);
      } else if (percentage < 60) {
        weakAreas.push(subcategory);
      }
    });
    
    return { weakAreas, strongAreas };
  };

  const generateImprovements = (percentage: number, weakAreas: string[]): string[] => {
    const improvements: string[] = [];
    
    if (percentage < 70) {
      improvements.push("مراجعة المفاهيم الأساسية");
      improvements.push("حل المزيد من التمارين");
    }
    
    if (weakAreas.length > 0) {
      improvements.push(`التركيز على: ${weakAreas.join(', ')}`);
    }
    
    const avgTimePerQuestion = (config.timeLimit - timeRemaining) / questions.length;
    if (avgTimePerQuestion > 60) {
      improvements.push("تحسين السرعة في الحل");
    }
    
    return improvements;
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getTimerColor = () => {
    const percentage = (timeRemaining / config.timeLimit) * 100;
    if (percentage <= 10) return 'text-red-500';
    if (percentage <= 25) return 'text-orange-500';
    return 'text-green-500';
  };

  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const answeredCount = answers.filter(answer => answer.selectedOption !== null).length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-purple-900 flex items-center justify-center">
        <Card className="p-8">
          <CardContent className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-lg">جاري تحميل الاختبار...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const currentAnswer = answers[currentQuestionIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-purple-900 p-4">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button variant="outline" onClick={onExit}>
                    <ArrowLeft className="w-4 h-4 ml-2" />
                    الخروج
                  </Button>
                  <div>
                    <h1 className="text-xl font-bold">{config.testName}</h1>
                    <p className="text-sm text-gray-600">{config.subcategory}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    onClick={togglePause}
                    className="flex items-center gap-2"
                  >
                    {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                    {isPaused ? 'استئناف' : 'إيقاف مؤقت'}
                  </Button>
                  
                  <div className={`text-2xl font-bold ${getTimerColor()}`}>
                    <Clock className="w-6 h-6 inline mr-2" />
                    {formatTime(timeRemaining)}
                  </div>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="mt-4">
                <div className="flex justify-between text-sm mb-2">
                  <span>السؤال {currentQuestionIndex + 1} من {questions.length}</span>
                  <span>تمت الإجابة على {answeredCount} سؤال</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Question */}
        <motion.div
          key={currentQuestionIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-6"
        >
          <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl">
                <Badge className="ml-2" variant="outline">
                  {config.subcategory}
                </Badge>
                السؤال {currentQuestionIndex + 1}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg mb-6 leading-relaxed">
                {currentQuestion.text}
              </div>
              
              <div className="grid gap-3">
                {currentQuestion.options.map((option, index) => (
                  <motion.button
                    key={index}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleAnswerSelect(index)}
                    disabled={isPaused}
                    className={`p-4 text-right rounded-lg border-2 transition-all duration-200 ${
                      currentAnswer.selectedOption === index
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-600 hover:border-blue-300 hover:bg-blue-50/50'
                    } ${isPaused ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        currentAnswer.selectedOption === index
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-gray-300'
                      }`}>
                        {currentAnswer.selectedOption === index && (
                          <CheckCircle2 className="w-4 h-4 text-white" />
                        )}
                      </div>
                      <span className="flex-1">{option}</span>
                    </div>
                  </motion.button>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <Button
                  onClick={previousQuestion}
                  disabled={currentQuestionIndex === 0 || isPaused}
                  variant="outline"
                >
                  <ArrowRight className="w-4 h-4 ml-2" />
                  السابق
                </Button>
                
                <div className="flex gap-2">
                  {questions.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentQuestionIndex(index)}
                      disabled={isPaused}
                      className={`w-8 h-8 rounded-full text-xs font-bold transition-all ${
                        index === currentQuestionIndex
                          ? 'bg-blue-500 text-white'
                          : answers[index].selectedOption !== null
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                      }`}
                    >
                      {index + 1}
                    </button>
                  ))}
                </div>
                
                {currentQuestionIndex < questions.length - 1 ? (
                  <Button
                    onClick={nextQuestion}
                    disabled={isPaused}
                    variant="outline"
                  >
                    التالي
                    <ArrowLeft className="w-4 h-4 mr-2" />
                  </Button>
                ) : (
                  <Button
                    onClick={() => setShowConfirmDialog(true)}
                    disabled={isPaused}
                    className="bg-green-500 hover:bg-green-600"
                  >
                    إنهاء الاختبار
                    <Trophy className="w-4 h-4 mr-2" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Confirm Dialog */}
        <AnimatePresence>
          {showConfirmDialog && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
              >
                <Card className="p-6 max-w-md">
                  <CardContent>
                    <h3 className="text-xl font-bold mb-4">تأكيد إنهاء الاختبار</h3>
                    <p className="text-gray-600 mb-6">
                      هل أنت متأكد من إنهاء الاختبار؟ تمت الإجابة على {answeredCount} من {questions.length} سؤال.
                    </p>
                    <div className="flex gap-3">
                      <Button
                        onClick={finishTest}
                        className="flex-1 bg-green-500 hover:bg-green-600"
                      >
                        نعم، إنهاء الاختبار
                      </Button>
                      <Button
                        onClick={() => setShowConfirmDialog(false)}
                        variant="outline"
                        className="flex-1"
                      >
                        إلغاء
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}