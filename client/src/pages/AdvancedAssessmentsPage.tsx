import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Crown, 
  Settings, 
  Target, 
  Brain, 
  Trophy, 
  Lightning, 
  Flame, 
  Star, 
  Zap,
  Clock,
  BookOpen,
  Calculator,
  Pause,
  Play,
  Home
} from 'lucide-react';

interface AdvancedQuestion {
  id: number;
  category: string;
  subcategory: string;
  text: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  timeLimit: number;
  points: number;
  skill: string;
}

interface AssessmentConfig {
  mode: 'adaptive' | 'timed' | 'endurance' | 'speed' | 'precision' | 'marathon';
  difficulty: 'auto' | 'beginner' | 'intermediate' | 'advanced' | 'expert';
  questionCount: number;
  timeLimit: number;
  showHints: boolean;
  showProgress: boolean;
  enableSounds: boolean;
  focusMode: boolean;
}

interface PerformanceMetrics {
  accuracy: number;
  speed: number;
  consistency: number;
  confidence: number;
  streak: number;
  adaptability: number;
}

interface Assessment {
  questions: AdvancedQuestion[];
  currentIndex: number;
  answers: { [key: number]: number };
  startTime: number;
  metrics: PerformanceMetrics;
  subcategory: string;
  type: 'verbal' | 'quantitative';
}

export function AdvancedAssessmentsPage() {
  const [config, setConfig] = useState<AssessmentConfig>({
    mode: 'adaptive',
    difficulty: 'auto',
    questionCount: 20,
    timeLimit: 1200, // 20 minutes
    showHints: true,
    showProgress: true,
    enableSounds: true,
    focusMode: false
  });

  const [currentAssessment, setCurrentAssessment] = useState<Assessment | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [streak, setStreak] = useState(0);
  const [totalXP, setTotalXP] = useState(0);
  
  // Premium and daily limit state
  const [user, setUser] = useState<any>(null);
  const [dailyTestsTaken, setDailyTestsTaken] = useState(0);
  const MAX_DAILY_FREE_TESTS = 1;

  // Load user data and daily limits
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Error parsing user:", error);
      }
    }

    // Load daily test count
    const today = new Date().toDateString();
    const testsToday = JSON.parse(localStorage.getItem(`dailyAdvancedLabTests_${today}`) || '0');
    setDailyTestsTaken(testsToday);
  }, []);

  // Check premium status
  const isPremiumUser = user && (
    user.subscription?.type === 'Pro' || 
    user.subscription?.type === 'Pro Life' || 
    user.subscription?.type === 'Pro Live'
  );

  const canTakeTest = isPremiumUser || dailyTestsTaken < MAX_DAILY_FREE_TESTS;

  // Record test taken for free users
  const recordTestTaken = () => {
    if (!isPremiumUser) {
      const today = new Date().toDateString();
      const newCount = dailyTestsTaken + 1;
      localStorage.setItem(`dailyAdvancedLabTests_${today}`, JSON.stringify(newCount));
      setDailyTestsTaken(newCount);
    }
  };

  // Fetch questions from the API
  const { data: questions, isLoading } = useQuery({
    queryKey: ['/api/questions'],
    enabled: true,
  });

  // Timer effect
  useEffect(() => {
    if (currentAssessment && !isPaused && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            completeAssessment();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [currentAssessment, isPaused, timeRemaining]);

  const getDifficultyPoints = (difficulty: string): number => {
    const points = { beginner: 10, intermediate: 20, advanced: 30, expert: 50 };
    return points[difficulty as keyof typeof points] || 10;
  };

  const getQuestionSkill = (subcategory: string): string => {
    const skills: Record<string, string> = {
      'التناظر اللفظي': 'تحليل العلاقات',
      'إكمال الجمل': 'فهم السياق',
      'استيعاب المقروء': 'الاستيعاب',
      'الهندسة': 'التفكير المكاني',
      'عمليات حسابية': 'العمليات الرياضية',
      'النسبة والتناسب': 'التناسب',
      'الإحصاء': 'تحليل البيانات'
    };
    return skills[subcategory] || 'مهارة عامة';
  };

  const startQuickAssessment = (category: 'verbal' | 'quantitative', subcategory: string) => {
    if (!questions) return;
    
    // Check premium access and daily limits
    if (!canTakeTest) {
      alert('🚫 لقد وصلت إلى الحد الأقصى للاختبارات المجانية اليوم (1 اختبار). اشترك في الباقة المدفوعة للوصول الكامل!');
      return;
    }
    
    // Record test taken for free users
    recordTestTaken();

    let filteredQuestions = questions
      .filter((q: any) => q.category === category && q.subcategory === subcategory)
      .slice(0, 15);

    const enhancedQuestions: AdvancedQuestion[] = filteredQuestions.map((q: any) => ({
      ...q,
      timeLimit: 60,
      points: getDifficultyPoints(q.difficulty || 'beginner'),
      skill: getQuestionSkill(q.subcategory)
    }));

    const assessment: Assessment = {
      questions: enhancedQuestions,
      currentIndex: 0,
      startTime: Date.now(),
      answers: {},
      metrics: {
        accuracy: 0,
        speed: 0,
        consistency: 0,
        confidence: 0,
        streak: 0,
        adaptability: 0
      },
      subcategory: subcategory,
      type: category
    };

    setCurrentAssessment(assessment);
    setTimeRemaining(15 * 60);
    setIsPaused(false);
    setSelectedAnswer(null);
    setShowHint(false);
    setStreak(0);
  };

  const startAssessment = (subcategory: any, type: 'verbal' | 'quantitative') => {
    if (!questions) return;
    
    // Check premium access and daily limits
    if (!canTakeTest) {
      alert('🚫 لقد وصلت إلى الحد الأقصى للاختبارات المجانية اليوم (1 اختبار). اشترك في الباقة المدفوعة للوصول الكامل!');
      return;
    }
    
    // Record test taken for free users
    recordTestTaken();

    let filteredQuestions = questions
      .filter((q: any) => q.category === type && q.subcategory === subcategory.id)
      .slice(0, config.questionCount);

    if (config.difficulty !== 'auto') {
      filteredQuestions = filteredQuestions.filter((q: any) => q.difficulty === config.difficulty);
    }

    const enhancedQuestions: AdvancedQuestion[] = filteredQuestions.map((q: any) => ({
      ...q,
      timeLimit: Math.floor(config.timeLimit / config.questionCount),
      points: getDifficultyPoints(q.difficulty || 'beginner'),
      skill: getQuestionSkill(q.subcategory)
    }));

    const assessment: Assessment = {
      questions: enhancedQuestions,
      currentIndex: 0,
      startTime: Date.now(),
      answers: {},
      metrics: {
        accuracy: 0,
        speed: 0,
        consistency: 0,
        confidence: 0,
        streak: 0,
        adaptability: 0
      },
      subcategory: subcategory.id,
      type: type
    };

    setCurrentAssessment(assessment);
    setTimeRemaining(config.timeLimit * 60);
    setIsPaused(false);
  };

  const submitAnswer = () => {
    if (!currentAssessment || selectedAnswer === null) return;

    const isCorrect = selectedAnswer === currentAssessment.questions[currentAssessment.currentIndex].correctOptionIndex;
    
    if (isCorrect) {
      setStreak(prev => prev + 1);
      setTotalXP(prev => prev + currentAssessment.questions[currentAssessment.currentIndex].points);
    } else {
      setStreak(0);
    }

    if (currentAssessment.currentIndex < currentAssessment.questions.length - 1) {
      setCurrentAssessment(prev => prev ? {
        ...prev,
        answers: { ...prev.answers, [prev.currentIndex]: selectedAnswer },
        currentIndex: prev.currentIndex + 1
      } : null);
    } else {
      setCurrentAssessment(prev => prev ? {
        ...prev,
        answers: { ...prev.answers, [prev.currentIndex]: selectedAnswer }
      } : null);
      completeAssessment();
    }

    setSelectedAnswer(null);
    setShowHint(false);
  };

  const calculateMetrics = (answers: { [key: number]: number }, questions: AdvancedQuestion[]): PerformanceMetrics => {
    const correctAnswers = Object.entries(answers).filter(([index, answer]) => {
      const questionIndex = parseInt(index);
      return answer === questions[questionIndex]?.correctOptionIndex;
    }).length;

    const accuracy = (correctAnswers / questions.length) * 100;
    
    return {
      accuracy,
      speed: streak >= 5 ? 85 : 70,
      consistency: accuracy > 80 ? 90 : 60,
      confidence: 75,
      streak,
      adaptability: 80
    };
  };

  const completeAssessment = () => {
    if (!currentAssessment) return;
    
    const metrics = calculateMetrics(currentAssessment.answers, currentAssessment.questions);
    setCurrentAssessment(prev => prev ? { ...prev, metrics, totalXP } : null);
    setShowResults(true);
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  const resetAssessment = () => {
    setCurrentAssessment(null);
    setShowResults(false);
    setSelectedAnswer(null);
    setShowHint(false);
    setStreak(0);
  };

  // Assessment Interface
  if (currentAssessment && !showResults) {
    const currentQuestion = currentAssessment.questions[currentAssessment.currentIndex];
    const progress = ((currentAssessment.currentIndex + 1) / currentAssessment.questions.length) * 100;
    const timePercentage = (timeRemaining / (15 * 60)) * 100;

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-blue-900 dark:to-indigo-900 p-4">
        <div className="max-w-4xl mx-auto">
          {/* Header with Timer and Progress */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-0 shadow-xl">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {currentAssessment.currentIndex + 1}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        من {currentAssessment.questions.length}
                      </div>
                    </div>
                    <div className="w-32">
                      <Progress value={progress} className="h-3" />
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${timeRemaining < 300 ? 'text-red-500' : 'text-green-600 dark:text-green-400'}`}>
                        {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
                      </div>
                      <div className="text-sm text-muted-foreground">الوقت المتبقي</div>
                    </div>
                    
                    <Button
                      onClick={togglePause}
                      variant="outline"
                      size="sm"
                      className="px-4"
                    >
                      {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Question Card */}
          <motion.div
            key={currentAssessment.currentIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-6"
          >
            <Card className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-0 shadow-2xl">
              <CardHeader className="text-center">
                <div className="flex items-center justify-center gap-4 mb-4">
                  <Badge variant="outline" className="text-sm">
                    صعوبة: {currentQuestion.difficulty || 'متوسط'}
                  </Badge>
                  <Badge variant="outline" className="text-sm">
                    النقاط: {currentQuestion.points}
                  </Badge>
                </div>
                <CardTitle className="text-xl font-bold text-right leading-relaxed">
                  {currentQuestion.text}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {currentQuestion.options.map((option, index) => (
                    <Button
                      key={index}
                      variant={selectedAnswer === index ? "default" : "outline"}
                      className={`w-full text-right justify-start p-4 h-auto ${
                        selectedAnswer === index 
                          ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                          : 'hover:bg-blue-50 dark:hover:bg-blue-900/20'
                      }`}
                      onClick={() => setSelectedAnswer(index)}
                    >
                      <span className="mr-3 font-bold">{String.fromCharCode(65 + index)})</span>
                      <span className="flex-1">{option}</span>
                    </Button>
                  ))}
                </div>

                <div className="flex justify-between items-center mt-6">
                  <Button
                    onClick={() => setShowHint(!showHint)}
                    variant="ghost"
                    size="sm"
                    className="text-blue-600 dark:text-blue-400"
                  >
                    💡 تلميح
                  </Button>
                  
                  <Button
                    onClick={submitAnswer}
                    disabled={selectedAnswer === null}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8"
                  >
                    {currentAssessment.currentIndex === currentAssessment.questions.length - 1 
                      ? 'إنهاء الاختبار' 
                      : 'التالي'
                    }
                  </Button>
                </div>

                {showHint && currentQuestion.explanation && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-700"
                  >
                    <p className="text-sm text-yellow-800 dark:text-yellow-200 text-right">
                      💡 {currentQuestion.explanation}
                    </p>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  // Results Interface
  if (showResults && currentAssessment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-blue-900 dark:to-indigo-900 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-4xl mx-auto"
        >
          <Card className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm shadow-2xl">
            <CardHeader className="text-center">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Trophy className="h-12 w-12 text-yellow-500" />
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  نتائج الاختبار
                </h1>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <div className="text-center p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {currentAssessment.metrics.accuracy.toFixed(0)}%
                  </div>
                  <div className="text-muted-foreground">الدقة</div>
                </div>
                <div className="text-center p-6 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                    {streak}
                  </div>
                  <div className="text-muted-foreground">أطول تسلسل صحيح</div>
                </div>
                <div className="text-center p-6 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                    {totalXP}
                  </div>
                  <div className="text-muted-foreground">نقاط الخبرة</div>
                </div>
              </div>

              <div className="flex justify-center gap-4">
                <Button
                  onClick={resetAssessment}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8"
                >
                  اختبار آخر
                </Button>
                <Button
                  onClick={() => window.location.href = '/'}
                  variant="outline"
                  className="px-8"
                >
                  العودة للرئيسية
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Main Interface
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-blue-900 dark:to-indigo-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-6">
            مختبر القدرات المتقدم
          </h1>
          <p className="text-2xl text-gray-600 dark:text-gray-400 max-w-4xl mx-auto mb-8">
            تجربة اختبار ثورية مع تحليل ذكي، مقاييس أداء متقدمة، وتجربة تفاعلية لا مثيل لها
          </p>

          {/* Premium Access Status */}
          {user && !isPremiumUser && (
            <div className="max-w-md mx-auto mb-6">
              <Card className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-orange-200 dark:border-orange-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-600 rounded-full flex items-center justify-center">
                      <Target className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-bold text-orange-700 dark:text-orange-300">حساب مجاني</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                    اختبار واحد يومياً • {dailyTestsTaken}/{MAX_DAILY_FREE_TESTS} اليوم
                  </p>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-orange-500 to-red-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${(dailyTestsTaken / MAX_DAILY_FREE_TESTS) * 100}%` }}
                    />
                  </div>
                  {!canTakeTest && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-2 font-medium">
                      🔒 تم الوصول للحد الأقصى اليوم
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {user && isPremiumUser && (
            <div className="max-w-md mx-auto mb-6">
              <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                      <Crown className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-bold text-green-700 dark:text-green-300">مشترك مميز</span>
                    <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
                      وصول كامل
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          
          {/* Quick Level Assessment Section */}
          <Card className="max-w-6xl mx-auto mb-8 bg-gradient-to-r from-green-500/10 to-emerald-500/10 dark:from-green-500/20 dark:to-emerald-500/20 border-green-200 dark:border-green-700">
            <CardHeader className="text-center">
              <div className="flex items-center justify-center gap-3 mb-2">
                <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-green-700 dark:text-green-300">
                  قياس المستوى السريع
                </h2>
              </div>
              <p className="text-green-600 dark:text-green-400">
                اختبارات سريعة لكل فئة - 15 سؤال في 15 دقيقة
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { name: "التناظر اللفظي", category: "verbal", subcategory: "التناظر اللفظي", icon: "📚", color: "from-blue-500 to-blue-600" },
                  { name: "إكمال الجمل", category: "verbal", subcategory: "إكمال الجمل", icon: "✏️", color: "from-purple-500 to-purple-600" },
                  { name: "الاستيعاب المقروء", category: "verbal", subcategory: "استيعاب المقروء", icon: "📖", color: "from-indigo-500 to-indigo-600" },
                  { name: "المترادفات والأضداد", category: "verbal", subcategory: "المترادفات والأضداد", icon: "🔤", color: "from-pink-500 to-pink-600" },
                  { name: "الأخطاء الشائعة", category: "verbal", subcategory: "الخطأ السياقي", icon: "🎯", color: "from-rose-500 to-rose-600" },
                  { name: "الهندسة", category: "quantitative", subcategory: "الهندسة", icon: "📐", color: "from-orange-500 to-orange-600" },
                  { name: "العمليات الحسابية", category: "quantitative", subcategory: "عمليات حسابية", icon: "➕", color: "from-yellow-500 to-yellow-600" },
                  { name: "النسب والتناسب", category: "quantitative", subcategory: "النسبة والتناسب", icon: "📊", color: "from-teal-500 to-teal-600" },
                  { name: "الإحصاء", category: "quantitative", subcategory: "الإحصاء", icon: "📈", color: "from-cyan-500 to-cyan-600" },
                ].map((test) => (
                  <Button
                    key={test.name}
                    variant="outline"
                    className={`h-auto p-4 bg-gradient-to-r ${test.color} text-white border-0 hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl`}
                    onClick={() => startQuickAssessment(test.category as 'verbal' | 'quantitative', test.subcategory)}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <div className="text-2xl">{test.icon}</div>
                      <div className="text-sm font-medium">{test.name}</div>
                      <div className="text-xs opacity-90">15 سؤال • 15 دقيقة</div>
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Configuration Panel */}
          <Card className="max-w-4xl mx-auto mb-12">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 justify-center">
                <Settings className="h-6 w-6" />
                إعدادات الاختبار المتقدمة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Assessment Mode */}
                <div className="space-y-3">
                  <label className="text-sm font-medium">نمط الاختبار</label>
                  <select 
                    value={config.mode}
                    onChange={(e) => setConfig(prev => ({ ...prev, mode: e.target.value as any }))}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-gray-800"
                  >
                    <option value="adaptive">تكيفي ذكي</option>
                    <option value="timed">محدود الوقت</option>
                    <option value="endurance">اختبار التحمل</option>
                    <option value="speed">سريع البرق</option>
                    <option value="precision">عالي الدقة</option>
                    <option value="marathon">الماراثون</option>
                  </select>
                </div>

                {/* Difficulty Level */}
                <div className="space-y-3">
                  <label className="text-sm font-medium">مستوى الصعوبة</label>
                  <select 
                    value={config.difficulty}
                    onChange={(e) => setConfig(prev => ({ ...prev, difficulty: e.target.value as any }))}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-gray-800"
                  >
                    <option value="auto">تلقائي</option>
                    <option value="beginner">مبتدئ</option>
                    <option value="intermediate">متوسط</option>
                    <option value="advanced">متقدم</option>
                    <option value="expert">خبير</option>
                  </select>
                </div>

                {/* Question Count */}
                <div className="space-y-3">
                  <label className="text-sm font-medium">عدد الأسئلة</label>
                  <select 
                    value={config.questionCount}
                    onChange={(e) => setConfig(prev => ({ ...prev, questionCount: parseInt(e.target.value) }))}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-gray-800"
                  >
                    <option value={10}>10 أسئلة</option>
                    <option value={20}>20 سؤال</option>
                    <option value={30}>30 سؤال</option>
                    <option value={50}>50 سؤال</option>
                  </select>
                </div>

                {/* Time Limit */}
                <div className="space-y-3">
                  <label className="text-sm font-medium">الحد الزمني (دقيقة)</label>
                  <select 
                    value={config.timeLimit}
                    onChange={(e) => setConfig(prev => ({ ...prev, timeLimit: parseInt(e.target.value) }))}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-gray-800"
                  >
                    <option value={600}>10 دقائق</option>
                    <option value={1200}>20 دقيقة</option>
                    <option value={1800}>30 دقيقة</option>
                    <option value={3600}>60 دقيقة</option>
                  </select>
                </div>

                {/* Show Hints */}
                <div className="space-y-3">
                  <label className="text-sm font-medium">إظهار التلميحات</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={config.showHints}
                      onChange={(e) => setConfig(prev => ({ ...prev, showHints: e.target.checked }))}
                      className="rounded"
                    />
                    <span className="text-sm">تفعيل</span>
                  </div>
                </div>

                {/* Focus Mode */}
                <div className="space-y-3">
                  <label className="text-sm font-medium">وضع التركيز</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={config.focusMode}
                      onChange={(e) => setConfig(prev => ({ ...prev, focusMode: e.target.checked }))}
                      className="rounded"
                    />
                    <span className="text-sm">تفعيل</span>
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