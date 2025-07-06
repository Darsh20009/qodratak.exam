import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, Calculator, Target, Zap, Trophy, Star, Clock, CheckCircle, XCircle, 
  BarChart3, TrendingUp, Award, Crown, Diamond, Sparkles, Flame, Zap as Lightning,
  Rocket, Infinity, Gauge, Shield, Sword, Wand2 as Magic, Eye, Heart, Compass,
  BookOpen, PenTool, Search, Users, Settings, RefreshCw, Play, Pause,
  SkipForward, Volume2, VolumeX, Maximize, Minimize, Sun, Moon
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';

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

interface SkillAssessment {
  subcategory: string;
  level: number; // 0-100
  mastery: 'novice' | 'apprentice' | 'proficient' | 'expert' | 'master';
  xp: number;
  nextLevelXP: number;
  skills: string[];
  weakPoints: string[];
  achievements: string[];
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

  const [currentAssessment, setCurrentAssessment] = useState<{
    questions: AdvancedQuestion[];
    currentIndex: number;
    answers: { [key: number]: number };
    startTime: number;
    metrics: PerformanceMetrics;
    subcategory: string;
    type: 'verbal' | 'quantitative';
  } | null>(null);

  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [streak, setStreak] = useState(0);
  const [totalXP, setTotalXP] = useState(0);

  const { data: questions } = useQuery<AdvancedQuestion[]>({
    queryKey: ['/api/questions'],
  });

  // Enhanced subcategories with gamification elements
  const verbalSubcategories = [
    { 
      id: 'التناظر اللفظي', 
      name: 'سيد التناظرات', 
      icon: '🧩', 
      color: 'from-indigo-500 via-purple-500 to-pink-500',
      description: 'اكتشف العلاقات المخفية بين الكلمات',
      skills: ['التحليل المنطقي', 'الربط اللغوي', 'التفكير التناظري'],
      difficulty: 85,
      achievements: ['كاشف الأسرار', 'محلل العلاقات', 'سيد التناظر']
    },
    { 
      id: 'إكمال الجمل', 
      name: 'خبير السياق', 
      icon: '✨', 
      color: 'from-emerald-500 via-teal-500 to-cyan-500',
      description: 'أكمل النصوص بالكلمة المناسبة',
      skills: ['فهم السياق', 'الثراء اللغوي', 'التماسك النصي'],
      difficulty: 75,
      achievements: ['ناسج الكلمات', 'حارس السياق', 'مكمل النصوص']
    },
    { 
      id: 'استيعاب المقروء', 
      name: 'محلل النصوص', 
      icon: '📚', 
      color: 'from-blue-500 via-indigo-500 to-purple-500',
      description: 'اكتشف المعاني العميقة في النصوص',
      skills: ['الفهم العميق', 'التحليل النقدي', 'استخراج المعلومات'],
      difficulty: 90,
      achievements: ['قارئ العقول', 'محلل الأفكار', 'فاهم النصوص']
    },
    { 
      id: 'الخطأ السياقي', 
      name: 'محقق الأخطاء', 
      icon: '🔍', 
      color: 'from-red-500 via-orange-500 to-yellow-500',
      description: 'اكتشف الأخطاء المخفية في النصوص',
      skills: ['الدقة اللغوية', 'كشف الأخطاء', 'التدقيق النصي'],
      difficulty: 80,
      achievements: ['صائد الأخطاء', 'حارس اللغة', 'المحقق اللغوي']
    }
  ];

  const quantitativeSubcategories = [
    { 
      id: 'الهندسة', 
      name: 'معماري الأشكال', 
      icon: '📐', 
      color: 'from-violet-500 via-purple-500 to-fuchsia-500',
      description: 'ابني عالم الأشكال والمساحات',
      skills: ['التصور المكاني', 'حساب المساحات', 'فهم الأشكال'],
      difficulty: 85,
      achievements: ['بنائي الأشكال', 'معماري العقل', 'سيد الهندسة']
    },
    { 
      id: 'عمليات حسابية', 
      name: 'ساحر الأرقام', 
      icon: '⚡', 
      color: 'from-cyan-500 via-blue-500 to-indigo-500',
      description: 'تلاعب بالأرقام بسحر الرياضيات',
      skills: ['الحساب السريع', 'العمليات المعقدة', 'الدقة الحسابية'],
      difficulty: 70,
      achievements: ['ساحر الحساب', 'سريع البرق', 'دقيق الأرقام']
    },
    { 
      id: 'النسبة المئوية', 
      name: 'خبير النسب', 
      icon: '📊', 
      color: 'from-green-500 via-emerald-500 to-teal-500',
      description: 'تحكم في عالم النسب والمئويات',
      skills: ['حساب النسب', 'التحليل المئوي', 'فهم التناسبات'],
      difficulty: 75,
      achievements: ['حاسب النسب', 'خبير المئويات', 'ملك التناسبات']
    },
    { 
      id: 'الإحصاء', 
      name: 'محلل البيانات', 
      icon: '📈', 
      color: 'from-orange-500 via-red-500 to-pink-500',
      description: 'اكتشف الأنماط في بحر البيانات',
      skills: ['تحليل البيانات', 'فهم الإحصائيات', 'قراءة المخططات'],
      difficulty: 90,
      achievements: ['قارئ البيانات', 'محلل الأنماط', 'سيد الإحصاء']
    }
  ];

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

  const startAssessment = (subcategory: any, type: 'verbal' | 'quantitative') => {
    if (!questions) return;

    let filteredQuestions = questions
      .filter(q => q.category === type && q.subcategory === subcategory.id)
      .slice(0, config.questionCount);

    // Apply difficulty filter if not auto
    if (config.difficulty !== 'auto') {
      filteredQuestions = filteredQuestions.filter(q => q.difficulty === config.difficulty);
    }

    // Add enhanced properties
    const enhancedQuestions: AdvancedQuestion[] = filteredQuestions.map(q => ({
      ...q,
      timeLimit: Math.floor(config.timeLimit / config.questionCount),
      points: getDifficultyPoints(q.difficulty || 'beginner'),
      skill: getQuestionSkill(q.subcategory)
    }));

    setCurrentAssessment({
      questions: enhancedQuestions,
      currentIndex: 0,
      answers: {},
      startTime: Date.now(),
      metrics: {
        accuracy: 0,
        speed: 0,
        consistency: 0,
        confidence: 0,
        streak: 0,
        adaptability: 0
      },
      subcategory: subcategory.id,
      type
    });

    setTimeRemaining(config.timeLimit);
    setSelectedAnswer(null);
    setShowHint(false);
    setStreak(0);
  };

  const getDifficultyPoints = (difficulty: string): number => {
    const points = { beginner: 10, intermediate: 20, advanced: 30, expert: 50 };
    return points[difficulty as keyof typeof points] || 10;
  };

  const getQuestionSkill = (subcategory: string): string => {
    const skills = {
      'التناظر اللفظي': 'التحليل المنطقي',
      'إكمال الجمل': 'فهم السياق',
      'استيعاب المقروء': 'الفهم العميق',
      'الخطأ السياقي': 'الدقة اللغوية',
      'الهندسة': 'التصور المكاني',
      'عمليات حسابية': 'الحساب السريع',
      'النسبة المئوية': 'حساب النسب',
      'الإحصاء': 'تحليل البيانات'
    };
    return skills[subcategory as keyof typeof skills] || 'مهارة عامة';
  };

  const selectAnswer = (answerIndex: number) => {
    setSelectedAnswer(answerIndex);
    if (config.enableSounds) {
      // Play selection sound
    }
  };

  const submitAnswer = () => {
    if (!currentAssessment || selectedAnswer === null) return;

    const currentQuestion = currentAssessment.questions[currentAssessment.currentIndex];
    const isCorrect = selectedAnswer === currentQuestion.correctOptionIndex;
    
    // Update answers
    const newAnswers = { 
      ...currentAssessment.answers, 
      [currentQuestion.id]: selectedAnswer 
    };

    // Update streak
    if (isCorrect) {
      setStreak(prev => prev + 1);
      setTotalXP(prev => prev + currentQuestion.points);
    } else {
      setStreak(0);
    }

    // Update metrics
    const newMetrics = calculateMetrics(newAnswers, currentAssessment.questions);

    setCurrentAssessment(prev => prev ? {
      ...prev,
      answers: newAnswers,
      metrics: newMetrics
    } : null);

    // Move to next question or complete
    if (currentAssessment.currentIndex < currentAssessment.questions.length - 1) {
      setTimeout(() => {
        setCurrentAssessment(prev => prev ? {
          ...prev,
          currentIndex: prev.currentIndex + 1
        } : null);
        setSelectedAnswer(null);
        setShowHint(false);
      }, 1000);
    } else {
      setTimeout(() => {
        completeAssessment();
      }, 1000);
    }
  };

  const calculateMetrics = (answers: { [key: number]: number }, questions: AdvancedQuestion[]): PerformanceMetrics => {
    const answeredQuestions = questions.filter(q => answers[q.id] !== undefined);
    const correctAnswers = answeredQuestions.filter(q => answers[q.id] === q.correctOptionIndex);
    
    return {
      accuracy: answeredQuestions.length > 0 ? (correctAnswers.length / answeredQuestions.length) * 100 : 0,
      speed: 75, // Placeholder calculation
      consistency: 80, // Placeholder calculation
      confidence: 85, // Placeholder calculation
      streak: streak,
      adaptability: 70 // Placeholder calculation
    };
  };

  const completeAssessment = () => {
    setShowResults(true);
    // Save results to local storage
    const results = {
      subcategory: currentAssessment?.subcategory,
      type: currentAssessment?.type,
      metrics: currentAssessment?.metrics,
      totalXP,
      completedAt: new Date().toISOString()
    };
    localStorage.setItem('lastAssessmentResult', JSON.stringify(results));
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
    const timePercentage = (timeRemaining / config.timeLimit) * 100;

    return (
      <div className={`min-h-screen transition-all duration-500 ${
        config.focusMode 
          ? 'bg-black text-white' 
          : 'bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-blue-900 dark:to-indigo-900'
      } p-4`}>
        <div className="max-w-6xl mx-auto">
          {/* Enhanced Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Card className={`${config.focusMode ? 'bg-gray-900 border-gray-700' : 'bg-white/80 backdrop-blur-sm'} border-0 shadow-xl`}>
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
                  {/* Progress Section */}
                  <div className="flex items-center gap-6">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-full font-bold text-lg">
                      {currentAssessment.currentIndex + 1} / {currentAssessment.questions.length}
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-lg">{currentAssessment.subcategory}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        المهارة: {currentQuestion.skill}
                      </div>
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="flex items-center gap-4">
                    {/* Timer */}
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-full font-mono ${
                      timePercentage < 20 ? 'bg-red-100 text-red-600' : 
                      timePercentage < 50 ? 'bg-yellow-100 text-yellow-600' : 
                      'bg-green-100 text-green-600'
                    }`}>
                      <Clock className="h-4 w-4" />
                      {formatTime(timeRemaining)}
                    </div>

                    {/* Streak */}
                    {streak > 0 && (
                      <div className="flex items-center gap-2 bg-orange-100 text-orange-600 px-4 py-2 rounded-full">
                        <Flame className="h-4 w-4" />
                        {streak}
                      </div>
                    )}

                    {/* XP */}
                    <div className="flex items-center gap-2 bg-purple-100 text-purple-600 px-4 py-2 rounded-full">
                      <Star className="h-4 w-4" />
                      {totalXP} XP
                    </div>

                    {/* Pause */}
                    <Button
                      onClick={togglePause}
                      variant="outline"
                      size="sm"
                      className="p-2"
                    >
                      {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>التقدم</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-3" />
                </div>

                {/* Live Metrics */}
                <div className="mt-4 grid grid-cols-2 md:grid-cols-6 gap-3 text-center">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
                    <div className="text-xs text-blue-600">الدقة</div>
                    <div className="font-bold text-blue-700">{Math.round(currentAssessment.metrics.accuracy)}%</div>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded">
                    <div className="text-xs text-green-600">السرعة</div>
                    <div className="font-bold text-green-700">{Math.round(currentAssessment.metrics.speed)}%</div>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900/20 p-2 rounded">
                    <div className="text-xs text-purple-600">الثبات</div>
                    <div className="font-bold text-purple-700">{Math.round(currentAssessment.metrics.consistency)}%</div>
                  </div>
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded">
                    <div className="text-xs text-yellow-600">الثقة</div>
                    <div className="font-bold text-yellow-700">{Math.round(currentAssessment.metrics.confidence)}%</div>
                  </div>
                  <div className="bg-red-50 dark:bg-red-900/20 p-2 rounded">
                    <div className="text-xs text-red-600">التسلسل</div>
                    <div className="font-bold text-red-700">{streak}</div>
                  </div>
                  <div className="bg-indigo-50 dark:bg-indigo-900/20 p-2 rounded">
                    <div className="text-xs text-indigo-600">التكيف</div>
                    <div className="font-bold text-indigo-700">{Math.round(currentAssessment.metrics.adaptability)}%</div>
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
            <Card className={`${config.focusMode ? 'bg-gray-900 border-gray-700' : 'bg-white/95 backdrop-blur-sm'} border-0 shadow-2xl`}>
              <CardHeader className="text-center">
                <div className="flex items-center justify-center gap-4 mb-4">
                  <Badge variant="outline" className="text-sm">
                    صعوبة: {currentQuestion.difficulty || 'متوسط'}
                  </Badge>
                  <Badge variant="outline" className="text-sm">
                    نقاط: {currentQuestion.points}
                  </Badge>
                </div>
                <CardTitle className="text-2xl leading-relaxed">
                  {currentQuestion.text}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4 mb-6">
                  {currentQuestion.options.map((option, index) => (
                    <motion.button
                      key={index}
                      onClick={() => selectAnswer(index)}
                      className={`p-6 text-right rounded-xl border-2 transition-all duration-300 ${
                        selectedAnswer === index
                          ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 text-blue-700 dark:text-blue-300 shadow-lg transform scale-105'
                          : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 hover:shadow-md'
                      }`}
                      whileHover={{ scale: selectedAnswer === index ? 1.05 : 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-lg">{option}</span>
                        <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                          selectedAnswer === index
                            ? 'border-blue-500 bg-blue-500 shadow-lg'
                            : 'border-gray-300 dark:border-gray-600'
                        }`}>
                          {selectedAnswer === index && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: "spring", stiffness: 500 }}
                            >
                              <CheckCircle className="h-5 w-5 text-white" />
                            </motion.div>
                          )}
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="flex gap-2">
                    {config.showHints && (
                      <Button
                        onClick={() => setShowHint(!showHint)}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        {showHint ? 'إخفاء التلميح' : 'عرض تلميح'}
                      </Button>
                    )}
                    <Button
                      onClick={() => setSelectedAnswer(null)}
                      variant="outline"
                      size="sm"
                      disabled={selectedAnswer === null}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      إعادة تعيين
                    </Button>
                  </div>

                  <Button
                    onClick={submitAnswer}
                    disabled={selectedAnswer === null}
                    size="lg"
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3 shadow-lg"
                  >
                    {currentAssessment.currentIndex === currentAssessment.questions.length - 1 ? 'إنهاء الاختبار' : 'السؤال التالي'}
                    <SkipForward className="h-5 w-5 mr-2" />
                  </Button>
                </div>

                {/* Hint Display */}
                <AnimatePresence>
                  {showHint && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg"
                    >
                      <div className="flex items-start gap-3">
                        <div className="bg-yellow-100 dark:bg-yellow-800 p-2 rounded-full">
                          <Sparkles className="h-4 w-4 text-yellow-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">تلميح:</h4>
                          <p className="text-yellow-700 dark:text-yellow-300">
                            {currentQuestion.explanation?.split('.')[0] || 'فكر في العلاقة بين العناصر المعطاة'}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  // Results Display
  if (showResults && currentAssessment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-blue-900 dark:to-indigo-900 p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-6xl mx-auto"
        >
          {/* Results Header */}
          <Card className="mb-8 bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-0 shadow-2xl">
            <CardContent className="p-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
                className="mb-6"
              >
                <div className="bg-white/20 p-6 rounded-full inline-block">
                  <Trophy className="h-12 w-12" />
                </div>
              </motion.div>
              <h1 className="text-4xl font-bold mb-4">
                تهانينا! لقد أكملت الاختبار
              </h1>
              <p className="text-xl opacity-90">
                {currentAssessment.subcategory} • كسبت {totalXP} نقطة خبرة
              </p>
            </CardContent>
          </Card>

          {/* Detailed Results */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-500" />
                  تحليل الأداء المتقدم
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {Object.entries(currentAssessment.metrics).map(([key, value]) => {
                    const labels = {
                      accuracy: 'الدقة',
                      speed: 'السرعة',
                      consistency: 'الثبات',
                      confidence: 'مستوى الثقة',
                      streak: 'أطول تسلسل صحيح',
                      adaptability: 'قدرة التكيف'
                    };
                    
                    return (
                      <div key={key} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{labels[key as keyof typeof labels]}</span>
                          <span className="font-bold text-lg">
                            {key === 'streak' ? value : `${Math.round(value)}%`}
                          </span>
                        </div>
                        <Progress 
                          value={key === 'streak' ? Math.min(value * 10, 100) : value} 
                          className="h-3"
                        />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Achievements */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-yellow-500" />
                  الإنجازات المكتسبة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4">
                  {/* Dynamic achievements based on performance */}
                  {currentAssessment.metrics.accuracy >= 90 && (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg"
                    >
                      <Crown className="h-6 w-6 text-yellow-500" />
                      <div>
                        <div className="font-semibold text-yellow-700 dark:text-yellow-300">ملك الدقة</div>
                        <div className="text-sm text-yellow-600">حققت دقة أكثر من 90%</div>
                      </div>
                    </motion.div>
                  )}
                  
                  {streak >= 5 && (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                      className="flex items-center gap-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg"
                    >
                      <Flame className="h-6 w-6 text-orange-500" />
                      <div>
                        <div className="font-semibold text-orange-700 dark:text-orange-300">مشتعل النار</div>
                        <div className="text-sm text-orange-600">حققت تسلسل {streak} إجابات صحيحة</div>
                      </div>
                    </motion.div>
                  )}

                  {currentAssessment.metrics.speed >= 80 && (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                      className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg"
                    >
                      <Lightning className="h-6 w-6 text-blue-500" />
                      <div>
                        <div className="font-semibold text-blue-700 dark:text-blue-300">البرق السريع</div>
                        <div className="text-sm text-blue-600">حققت سرعة عالية في الإجابة</div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mt-8"
          >
            <Button
              onClick={resetAssessment}
              size="lg"
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3"
            >
              <Target className="h-5 w-5 mr-2" />
              اختبار آخر
            </Button>
            <Button
              onClick={() => window.location.href = '/'}
              variant="outline"
              size="lg"
              className="px-8 py-3"
            >
              العودة للرئيسية
            </Button>
          </motion.div>
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

                {/* Question Count */}
                <div className="space-y-3">
                  <label className="text-sm font-medium">عدد الأسئلة: {config.questionCount}</label>
                  <Slider
                    value={[config.questionCount]}
                    onValueChange={(value) => setConfig(prev => ({ ...prev, questionCount: value[0] }))}
                    max={50}
                    min={10}
                    step={5}
                    className="w-full"
                  />
                </div>

                {/* Time Limit */}
                <div className="space-y-3">
                  <label className="text-sm font-medium">الوقت: {Math.floor(config.timeLimit / 60)} دقيقة</label>
                  <Slider
                    value={[config.timeLimit]}
                    onValueChange={(value) => setConfig(prev => ({ ...prev, timeLimit: value[0] }))}
                    max={3600}
                    min={300}
                    step={300}
                    className="w-full"
                  />
                </div>

                {/* Options */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">إظهار التلميحات</label>
                    <Switch
                      checked={config.showHints}
                      onCheckedChange={(checked) => setConfig(prev => ({ ...prev, showHints: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">الأصوات</label>
                    <Switch
                      checked={config.enableSounds}
                      onCheckedChange={(checked) => setConfig(prev => ({ ...prev, enableSounds: checked }))}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">وضع التركيز</label>
                    <Switch
                      checked={config.focusMode}
                      onCheckedChange={(checked) => setConfig(prev => ({ ...prev, focusMode: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">شريط التقدم</label>
                    <Switch
                      checked={config.showProgress}
                      onCheckedChange={(checked) => setConfig(prev => ({ ...prev, showProgress: checked }))}
                    />
                  </div>
                </div>

                {/* Difficulty */}
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
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <Tabs defaultValue="verbal" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8 h-16">
            <TabsTrigger value="verbal" className="text-lg flex items-center gap-3">
              <Brain className="h-6 w-6" />
              الاختبارات اللفظية المتقدمة
            </TabsTrigger>
            <TabsTrigger value="quantitative" className="text-lg flex items-center gap-3">
              <Calculator className="h-6 w-6" />
              الاختبارات الكمية المتقدمة
            </TabsTrigger>
          </TabsList>

          {/* Advanced Verbal Tests */}
          <TabsContent value="verbal">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-8"
            >
              {verbalSubcategories.map((subcategory, index) => (
                <motion.div
                  key={subcategory.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.03 }}
                  className="group cursor-pointer"
                >
                  <Card 
                    className="h-full bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border-0 shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden"
                    onClick={() => startAssessment(subcategory, 'verbal')}
                  >
                    <div className={`h-3 bg-gradient-to-r ${subcategory.color}`} />
                    <CardHeader className="text-center pb-4">
                      <div className="text-6xl mb-4 group-hover:scale-110 transition-transform duration-300">
                        {subcategory.icon}
                      </div>
                      <CardTitle className="text-2xl mb-3 bg-gradient-to-r from-gray-700 to-gray-900 dark:from-gray-200 dark:to-gray-400 bg-clip-text text-transparent">
                        {subcategory.name}
                      </CardTitle>
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        {subcategory.description}
                      </p>
                      <div className="flex items-center justify-center gap-2 mb-4">
                        <Badge variant="secondary" className="px-3 py-1">
                          {config.questionCount} سؤال
                        </Badge>
                        <Badge variant="secondary" className="px-3 py-1">
                          {Math.floor(config.timeLimit / 60)} دقيقة
                        </Badge>
                        <Badge variant="secondary" className="px-3 py-1">
                          صعوبة {subcategory.difficulty}%
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {/* Skills */}
                      <div className="space-y-4 mb-6">
                        <div>
                          <h4 className="font-semibold mb-2 flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-purple-500" />
                            المهارات المكتسبة
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {subcategory.skills.map((skill, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {/* Achievements */}
                        <div>
                          <h4 className="font-semibold mb-2 flex items-center gap-2">
                            <Trophy className="h-4 w-4 text-yellow-500" />
                            الإنجازات المتاحة
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {subcategory.achievements.slice(0, 2).map((achievement, i) => (
                              <Badge key={i} variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                                {achievement}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>

                      <Button 
                        className={`w-full bg-gradient-to-r ${subcategory.color} text-white border-0 group-hover:shadow-lg transition-all duration-300 py-3 text-lg font-semibold`}
                      >
                        ابدأ التحدي
                        <Rocket className="h-5 w-5 mr-2" />
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </TabsContent>

          {/* Advanced Quantitative Tests */}
          <TabsContent value="quantitative">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-8"
            >
              {quantitativeSubcategories.map((subcategory, index) => (
                <motion.div
                  key={subcategory.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.03 }}
                  className="group cursor-pointer"
                >
                  <Card 
                    className="h-full bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border-0 shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden"
                    onClick={() => startAssessment(subcategory, 'quantitative')}
                  >
                    <div className={`h-3 bg-gradient-to-r ${subcategory.color}`} />
                    <CardHeader className="text-center pb-4">
                      <div className="text-6xl mb-4 group-hover:scale-110 transition-transform duration-300">
                        {subcategory.icon}
                      </div>
                      <CardTitle className="text-2xl mb-3 bg-gradient-to-r from-gray-700 to-gray-900 dark:from-gray-200 dark:to-gray-400 bg-clip-text text-transparent">
                        {subcategory.name}
                      </CardTitle>
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        {subcategory.description}
                      </p>
                      <div className="flex items-center justify-center gap-2 mb-4">
                        <Badge variant="secondary" className="px-3 py-1">
                          {config.questionCount} سؤال
                        </Badge>
                        <Badge variant="secondary" className="px-3 py-1">
                          {Math.floor(config.timeLimit / 60)} دقيقة
                        </Badge>
                        <Badge variant="secondary" className="px-3 py-1">
                          صعوبة {subcategory.difficulty}%
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {/* Skills */}
                      <div className="space-y-4 mb-6">
                        <div>
                          <h4 className="font-semibold mb-2 flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-purple-500" />
                            المهارات المكتسبة
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {subcategory.skills.map((skill, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {/* Achievements */}
                        <div>
                          <h4 className="font-semibold mb-2 flex items-center gap-2">
                            <Trophy className="h-4 w-4 text-yellow-500" />
                            الإنجازات المتاحة
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {subcategory.achievements.slice(0, 2).map((achievement, i) => (
                              <Badge key={i} variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                                {achievement}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>

                      <Button 
                        className={`w-full bg-gradient-to-r ${subcategory.color} text-white border-0 group-hover:shadow-lg transition-all duration-300 py-3 text-lg font-semibold`}
                      >
                        ابدأ التحدي
                        <Rocket className="h-5 w-5 mr-2" />
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </TabsContent>
        </Tabs>

        {/* Features Showcase */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-20"
        >
          <Card className="max-w-6xl mx-auto bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 text-white border-0 shadow-2xl">
            <CardContent className="p-12">
              <h3 className="text-4xl font-bold mb-8 text-center">
                ميزات المختبر المتقدم
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <div className="text-center">
                  <div className="bg-white/20 p-4 rounded-full inline-block mb-4">
                    <Brain className="h-8 w-8" />
                  </div>
                  <h4 className="font-semibold mb-2">ذكاء اصطناعي</h4>
                  <p className="text-sm opacity-90">تحليل متقدم وتوصيات ذكية</p>
                </div>
                <div className="text-center">
                  <div className="bg-white/20 p-4 rounded-full inline-block mb-4">
                    <Gauge className="h-8 w-8" />
                  </div>
                  <h4 className="font-semibold mb-2">مقاييس متقدمة</h4>
                  <p className="text-sm opacity-90">تتبع دقيق لجميع جوانب الأداء</p>
                </div>
                <div className="text-center">
                  <div className="bg-white/20 p-4 rounded-full inline-block mb-4">
                    <Trophy className="h-8 w-8" />
                  </div>
                  <h4 className="font-semibold mb-2">نظام إنجازات</h4>
                  <p className="text-sm opacity-90">مكافآت وتحديات تحفيزية</p>
                </div>
                <div className="text-center">
                  <div className="bg-white/20 p-4 rounded-full inline-block mb-4">
                    <Sparkles className="h-8 w-8" />
                  </div>
                  <h4 className="font-semibold mb-2">تجربة تفاعلية</h4>
                  <p className="text-sm opacity-90">واجهة حديثة وسهلة الاستخدام</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}