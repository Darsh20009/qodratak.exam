import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Calculator,
  Clock,
  Target,
  Award,
  PlayCircle,
  PauseCircle,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Timer,
  TrendingUp,
  Star,
  Trophy,
  Zap,
  BarChart3,
  PieChart,
  Sigma,
  Square
} from 'lucide-react';

interface TestQuestion {
  id: number;
  text: string;
  options: string[];
  correctOptionIndex: number;
  category: string;
  subcategory: string;
  explanation?: string;
}

interface TestSection {
  sectionNumber: number;
  name: string;
  questionCount: number;
  timeLimit: number;
  questions: TestQuestion[];
  completed: boolean;
  score?: number;
  timeSpent?: number;
}

interface TestResults {
  sectionResults: {
    sectionNumber: number;
    score: number;
    timeSpent: number;
    percentage: number;
  }[];
  totalScore: number;
  totalTime: number;
  overallPercentage: number;
  subcategoryBreakdown: {
    [key: string]: {
      correct: number;
      total: number;
      percentage: number;
    };
  };
}

export function AdvancedQuantitativeTest() {
  const [, setLocation] = useLocation();
  const [currentSection, setCurrentSection] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{[key: string]: number}>({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [sectionTimeRemaining, setSectionTimeRemaining] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [testStarted, setTestStarted] = useState(false);
  const [testCompleted, setTestCompleted] = useState(false);
  const [testSections, setTestSections] = useState<TestSection[]>([]);
  const [showSectionTransition, setShowSectionTransition] = useState(false);
  const [testResults, setTestResults] = useState<TestResults | null>(null);
  const [showResults, setShowResults] = useState(false);

  // Fetch all questions
  const { data: allQuestions = [], isLoading } = useQuery<TestQuestion[]>({
    queryKey: ['/api/questions'],
  });

  // User data for premium check
  const { data: user } = useQuery({
    queryKey: ['/api/user'],
  });

  const isPremiumUser = user && (
    (user as any)?.subscription?.type === 'Pro' || 
    (user as any)?.subscription?.type === 'Pro Life' || 
    (user as any)?.subscription?.type === 'Pro Live' ||
    (user as any)?.subscription === 'pro' ||
    (user as any)?.subscription === 'pro_life'
  );

  // Check daily limits
  const [dailyTestsTaken, setDailyTestsTaken] = useState(0);
  const MAX_DAILY_FREE_TESTS = 1; // One test every 2 days

  useEffect(() => {
    const today = new Date().toDateString();
    const testsToday = JSON.parse(localStorage.getItem(`dailyAdvancedQuantitativeTests_${today}`) || '0');
    setDailyTestsTaken(testsToday);
  }, []);

  const canTakeTest = !!isPremiumUser || dailyTestsTaken === 0;

  // Initialize test sections
  useEffect(() => {
    if (allQuestions.length > 0 && testSections.length === 0) {
      // Get current test configuration from localStorage
      const currentTest = localStorage.getItem('currentTest');
      let targetSubcategory = 'شامل - 5 أقسام'; // default to comprehensive
      
      if (currentTest) {
        const testConfig = JSON.parse(currentTest);
        targetSubcategory = testConfig.subcategory;
      }
      
      let quantitativeQuestions;
      
      if (targetSubcategory === 'شامل - 5 أقسام') {
        // For comprehensive test, use all quantitative questions
        quantitativeQuestions = allQuestions.filter(q => q.category === 'quantitative');
      } else {
        // For specific subcategory tests, filter by exact subcategory
        const specificSubcategory = targetSubcategory.replace(' - 5 أقسام', '');
        quantitativeQuestions = allQuestions.filter(q => 
          q.category === 'quantitative' && q.subcategory === specificSubcategory
        );
      }
      
      if (quantitativeQuestions.length >= 55) {
        // Shuffle questions for randomness
        const shuffled = [...quantitativeQuestions].sort(() => Math.random() - 0.5);
        const selectedQuestions = shuffled.slice(0, 55);

        // Create 5 sections with 11 questions each
        const sections: TestSection[] = [];
        for (let i = 0; i < 5; i++) {
          const startIndex = i * 11;
          const endIndex = startIndex + 11;
          sections.push({
            sectionNumber: i + 1,
            name: `القسم ${i + 1} - ${targetSubcategory.replace(' - 5 أقسام', '')}`,
            questionCount: 11,
            timeLimit: 11, // 11 minutes per section
            questions: selectedQuestions.slice(startIndex, endIndex),
            completed: false
          });
        }
        
        setTestSections(sections);
        setTimeRemaining(55 * 60); // 55 minutes total
        setSectionTimeRemaining(11 * 60); // 11 minutes for first section
      }
    }
  }, [allQuestions, testSections.length]);

  // Timer logic
  useEffect(() => {
    if (testStarted && !isPaused && !testCompleted && timeRemaining > 0 && sectionTimeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            completeTest();
            return 0;
          }
          return prev - 1;
        });
        
        setSectionTimeRemaining(prev => {
          if (prev <= 1) {
            moveToNextSection();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [testStarted, isPaused, testCompleted, timeRemaining, sectionTimeRemaining]);

  const startTest = () => {
    if (!canTakeTest) {
      alert('لقد وصلت للحد الأقصى اليومي من الاختبارات');
      return;
    }
    
    setTestStarted(true);
    
    // Record test for free users
    if (!isPremiumUser) {
      const today = new Date().toDateString();
      localStorage.setItem(`dailyAdvancedQuantitativeTests_${today}`, '1');
      setDailyTestsTaken(1);
    }
  };

  const moveToNextSection = () => {
    if (currentSection < testSections.length - 1) {
      // Mark current section as completed
      const updatedSections = [...testSections];
      updatedSections[currentSection].completed = true;
      updatedSections[currentSection].timeSpent = (11 * 60) - sectionTimeRemaining;
      setTestSections(updatedSections);
      
      setShowSectionTransition(true);
      
      setTimeout(() => {
        setCurrentSection(prev => prev + 1);
        setCurrentQuestionIndex(0);
        setSectionTimeRemaining(11 * 60);
        setShowSectionTransition(false);
      }, 3000);
    } else {
      completeTest();
    }
  };

  const completeTest = () => {
    setTestCompleted(true);
    calculateResults();
  };

  const calculateResults = () => {
    const sectionResults = testSections.map((section, index) => {
      let correct = 0;
      section.questions.forEach(question => {
        const userAnswer = selectedAnswers[`${index}-${question.id}`];
        if (userAnswer === question.correctOptionIndex) {
          correct++;
        }
      });
      
      return {
        sectionNumber: section.sectionNumber,
        score: correct,
        timeSpent: section.timeSpent || 0,
        percentage: Math.round((correct / section.questionCount) * 100)
      };
    });

    const totalScore = sectionResults.reduce((sum, result) => sum + result.score, 0);
    const totalTime = 55 * 60 - timeRemaining;
    const overallPercentage = Math.round((totalScore / 55) * 100);

    // Calculate subcategory breakdown
    const subcategoryBreakdown: {[key: string]: {correct: number, total: number, percentage: number}} = {};
    
    testSections.forEach((section, sectionIndex) => {
      section.questions.forEach(question => {
        const subcategory = question.subcategory;
        if (!subcategoryBreakdown[subcategory]) {
          subcategoryBreakdown[subcategory] = { correct: 0, total: 0, percentage: 0 };
        }
        
        subcategoryBreakdown[subcategory].total++;
        const userAnswer = selectedAnswers[`${sectionIndex}-${question.id}`];
        if (userAnswer === question.correctOptionIndex) {
          subcategoryBreakdown[subcategory].correct++;
        }
      });
    });

    // Calculate percentages for subcategories
    Object.keys(subcategoryBreakdown).forEach(subcategory => {
      const data = subcategoryBreakdown[subcategory];
      data.percentage = Math.round((data.correct / data.total) * 100);
    });

    const results: TestResults = {
      sectionResults,
      totalScore,
      totalTime,
      overallPercentage,
      subcategoryBreakdown
    };

    setTestResults(results);
    setShowResults(true);

    // Save results to localStorage
    const resultsHistory = JSON.parse(localStorage.getItem('advancedQuantitativeTestResults') || '[]');
    resultsHistory.push({
      ...results,
      testDate: new Date().toISOString(),
      testType: 'advanced-quantitative'
    });
    localStorage.setItem('advancedQuantitativeTestResults', JSON.stringify(resultsHistory));
  };

  const selectAnswer = (answerIndex: number) => {
    const currentQuestion = testSections[currentSection]?.questions[currentQuestionIndex];
    if (currentQuestion) {
      const key = `${currentSection}-${currentQuestion.id}`;
      setSelectedAnswers(prev => ({
        ...prev,
        [key]: answerIndex
      }));
    }
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < testSections[currentSection].questionCount - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else if (currentSection < testSections.length - 1) {
      moveToNextSection();
    } else {
      completeTest();
    }
  };

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeColor = (seconds: number, total: number) => {
    const percentage = (seconds / total) * 100;
    if (percentage > 50) return 'text-green-600';
    if (percentage > 20) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100 dark:from-gray-900 dark:to-orange-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600 dark:text-gray-300">جاري تحميل الاختبار الكمي...</p>
        </div>
      </div>
    );
  }

  if (!testStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 dark:from-gray-900 dark:via-orange-900/20 dark:to-red-900/20">
        <div className="container mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="flex items-center justify-center gap-4 mb-6">
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              >
                <Calculator className="w-16 h-16 text-orange-600" />
              </motion.div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 bg-clip-text text-transparent">
                اختبار القدرات الكمية المتقدم
              </h1>
            </div>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              اختبار شامل مكون من 5 أقسام - 55 سؤال في 55 دقيقة مع تحليل رياضي تفصيلي
            </p>
          </motion.div>

          <div className="max-w-4xl mx-auto">
            <Card className="mb-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-2 border-orange-200 dark:border-orange-700">
              <CardHeader>
                <CardTitle className="text-2xl text-center text-orange-700 dark:text-orange-300">
                  مواصفات الاختبار الكمي
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="text-center p-4 bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/50 dark:to-orange-800/50 rounded-xl">
                    <div className="w-12 h-12 mx-auto mb-3 bg-orange-600 rounded-full flex items-center justify-center">
                      <Target className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">5</div>
                    <div className="text-sm text-orange-600 dark:text-orange-400">أقسام</div>
                  </div>

                  <div className="text-center p-4 bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/50 dark:to-red-800/50 rounded-xl">
                    <div className="w-12 h-12 mx-auto mb-3 bg-red-600 rounded-full flex items-center justify-center">
                      <Sigma className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-2xl font-bold text-red-700 dark:text-red-300">55</div>
                    <div className="text-sm text-red-600 dark:text-red-400">سؤال</div>
                  </div>

                  <div className="text-center p-4 bg-gradient-to-br from-pink-100 to-pink-200 dark:from-pink-900/50 dark:to-pink-800/50 rounded-xl">
                    <div className="w-12 h-12 mx-auto mb-3 bg-pink-600 rounded-full flex items-center justify-center">
                      <Clock className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-2xl font-bold text-pink-700 dark:text-pink-300">55</div>
                    <div className="text-sm text-pink-600 dark:text-pink-400">دقيقة</div>
                  </div>

                  <div className="text-center p-4 bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/50 dark:to-purple-800/50 rounded-xl">
                    <div className="w-12 h-12 mx-auto mb-3 bg-purple-600 rounded-full flex items-center justify-center">
                      <Award className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">11</div>
                    <div className="text-sm text-purple-600 dark:text-purple-400">سؤال/قسم</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Mathematical Features */}
            <Card className="mb-8 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-orange-200 dark:border-orange-700">
              <CardHeader>
                <CardTitle className="text-xl text-orange-700 dark:text-orange-300 flex items-center gap-2">
                  <PieChart className="w-6 h-6" />
                  المجالات الرياضية المشمولة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded-lg">
                    <Square className="w-4 h-4 text-orange-600" />
                    <span>الهندسة</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded-lg">
                    <Calculator className="w-4 h-4 text-red-600" />
                    <span>العمليات الحسابية</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded-lg">
                    <BarChart3 className="w-4 h-4 text-pink-600" />
                    <span>الإحصاء</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded-lg">
                    <TrendingUp className="w-4 h-4 text-purple-600" />
                    <span>الأنماط</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded-lg">
                    <Sigma className="w-4 h-4 text-orange-600" />
                    <span>المعادلات</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded-lg">
                    <PieChart className="w-4 h-4 text-red-600" />
                    <span>النسب المئوية</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Access Control */}
            {!canTakeTest && (
              <Card className="mb-8 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-200 dark:border-yellow-700">
                <CardContent className="p-6 text-center">
                  <Timer className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-yellow-700 dark:text-yellow-300 mb-2">
                    وصلت للحد الأقصى اليومي
                  </h3>
                  <p className="text-yellow-600 dark:text-yellow-400">
                    يمكن للحسابات المجانية أخذ اختبار واحد كل يومين. 
                    الاشتراك المميز يتيح وصولاً غير محدود!
                  </p>
                </CardContent>
              </Card>
            )}

            <div className="text-center">
              <Button
                onClick={startTest}
                disabled={!canTakeTest}
                className={`px-8 py-4 text-lg font-bold ${
                  canTakeTest 
                    ? 'bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white shadow-xl hover:shadow-2xl transform hover:scale-105'
                    : 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed'
                } transition-all duration-300`}
              >
                {canTakeTest ? (
                  <>
                    <PlayCircle className="w-6 h-6 mr-2" />
                    ابدأ الاختبار الكمي المتقدم
                  </>
                ) : (
                  <>
                    <Timer className="w-6 h-6 mr-2" />
                    غير متاح حالياً
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show section transition
  if (showSectionTransition) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100 dark:from-gray-900 dark:to-red-900 flex items-center justify-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-orange-600 to-red-600 rounded-full flex items-center justify-center"
          >
            <Zap className="w-10 h-10 text-white" />
          </motion.div>
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">
            انتقال إلى القسم التالي
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            القسم {currentSection + 2} من 5
          </p>
        </motion.div>
      </div>
    );
  }

  // Show results (similar structure to verbal test but with math-themed styling)
  if (showResults && testResults) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 dark:from-gray-900 dark:to-orange-900/20 p-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">
              نتائج الاختبار الكمي المتقدم
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              تحليل شامل لأدائك الرياضي والكمي
            </p>
          </motion.div>

          {/* Overall Score */}
          <Card className="mb-8 bg-gradient-to-r from-orange-500 to-red-600 text-white">
            <CardContent className="p-8 text-center">
              <div className="text-6xl font-bold mb-2">{testResults.overallPercentage}%</div>
              <div className="text-2xl font-semibold mb-4">النتيجة الإجمالية</div>
              <div className="text-lg opacity-90">
                {testResults.totalScore} من 55 سؤال صحيح
              </div>
            </CardContent>
          </Card>

          {/* Section Results */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-2xl">نتائج الأقسام الكمية</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {testResults.sectionResults.map((section, index) => (
                  <motion.div
                    key={section.sectionNumber}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="text-center p-4 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-xl border border-orange-200 dark:border-orange-700"
                  >
                    <div className="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-2">
                      {section.percentage}%
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                      القسم {section.sectionNumber}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {section.score}/11 صحيح
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Subcategory Breakdown */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <BarChart3 className="w-6 h-6" />
                تحليل المجالات الرياضية
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(testResults.subcategoryBreakdown).map(([subcategory, data]) => (
                  <div key={subcategory} className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-lg border border-orange-200 dark:border-orange-700">
                    <div>
                      <div className="font-semibold text-gray-800 dark:text-white">{subcategory}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        {data.correct} من {data.total} صحيح
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                        {data.percentage}%
                      </div>
                      <Progress value={data.percentage} className="w-24 h-2" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="text-center space-x-4 space-x-reverse">
            <Button
              onClick={() => setLocation('/quantitative-tests')}
              className="bg-gradient-to-r from-orange-600 to-red-600 text-white px-6 py-3"
            >
              العودة للاختبارات
            </Button>
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              className="px-6 py-3"
            >
              إعادة الاختبار
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Main test interface (similar to verbal but with math-themed styling)
  const currentQuestion = testSections[currentSection]?.questions[currentQuestionIndex];
  const questionKey = `${currentSection}-${currentQuestion?.id}`;
  const selectedAnswer = selectedAnswers[questionKey];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 dark:from-gray-900 dark:to-orange-900/20">
      {/* Header */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-orange-200 dark:border-orange-700 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Progress Info */}
            <div className="flex items-center gap-6">
              <div className="text-sm">
                <span className="font-semibold text-orange-700 dark:text-orange-300">
                  القسم {currentSection + 1} من 5
                </span>
                <span className="text-gray-500 dark:text-gray-400 mx-2">•</span>
                <span className="text-gray-600 dark:text-gray-400">
                  السؤال {currentQuestionIndex + 1} من {testSections[currentSection]?.questionCount}
                </span>
              </div>
            </div>

            {/* Timer */}
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-xs text-gray-500 dark:text-gray-400">القسم</div>
                <div className={`font-mono text-lg font-bold ${getTimeColor(sectionTimeRemaining, 11 * 60)}`}>
                  {formatTime(sectionTimeRemaining)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-500 dark:text-gray-400">الإجمالي</div>
                <div className={`font-mono text-lg font-bold ${getTimeColor(timeRemaining, 55 * 60)}`}>
                  {formatTime(timeRemaining)}
                </div>
              </div>
              <Button
                onClick={() => setIsPaused(!isPaused)}
                variant="outline"
                size="sm"
                className="ml-2"
              >
                {isPaused ? <PlayCircle className="w-4 h-4" /> : <PauseCircle className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <Progress 
              value={((currentSection * 11 + currentQuestionIndex + 1) / 55) * 100} 
              className="h-2"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {currentQuestion && (
            <Card className="mb-8 bg-white dark:bg-gray-800 shadow-xl border border-orange-200 dark:border-orange-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Badge 
                    variant="secondary"
                    className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300"
                  >
                    {currentQuestion.subcategory}
                  </Badge>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    سؤال رقم {currentQuestionIndex + 1}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-xl font-semibold text-gray-800 dark:text-white leading-relaxed">
                  {currentQuestion.text}
                </div>

                <div className="space-y-3">
                  {currentQuestion.options.map((option, index) => (
                    <motion.button
                      key={index}
                      onClick={() => selectAnswer(index)}
                      className={`w-full p-4 text-right rounded-lg border-2 transition-all duration-200 ${
                        selectedAnswer === index
                          ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300'
                          : 'border-gray-200 dark:border-gray-600 hover:border-orange-300 dark:hover:border-orange-500 bg-white dark:bg-gray-700'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="flex-1 text-gray-800 dark:text-white">{option}</span>
                        {selectedAnswer === index && (
                          <CheckCircle className="w-5 h-5 text-orange-600" />
                        )}
                      </div>
                    </motion.button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <Button
              onClick={previousQuestion}
              disabled={currentQuestionIndex === 0 && currentSection === 0}
              variant="outline"
              className="flex items-center gap-2 border-orange-300 hover:bg-orange-50 dark:border-orange-600 dark:hover:bg-orange-900/20"
            >
              <ArrowRight className="w-4 h-4" />
              السؤال السابق
            </Button>

            <div className="text-center">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                تقدم الاختبار
              </div>
              <div className="text-lg font-semibold text-orange-700 dark:text-orange-300">
                {Math.round(((currentSection * 11 + currentQuestionIndex + 1) / 55) * 100)}%
              </div>
            </div>

            <Button
              onClick={nextQuestion}
              className="bg-gradient-to-r from-orange-600 to-red-600 text-white flex items-center gap-2"
            >
              {currentQuestionIndex === testSections[currentSection]?.questionCount - 1 && currentSection === testSections.length - 1
                ? 'إنهاء الاختبار'
                : currentQuestionIndex === testSections[currentSection]?.questionCount - 1
                ? 'القسم التالي'
                : 'السؤال التالي'
              }
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}