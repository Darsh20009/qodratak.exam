import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Calculator,
  Target,
  Brain,
  Clock,
  TrendingUp,
  Star,
  Trophy,
  Lock,
  CheckCircle2,
  Calendar,
  Zap,
  Award,
  Sparkles,
  PlayCircle,
  BarChart3,
  Activity,
  PieChart,
  LineChart,
  Flame,
  Crown,
  Diamond,
  Rocket,
  Shield,
  Medal,
  Eye,
  AlertCircle,
  History,
  Download,
  Infinity,
  Percent,
  Divide,
  Equal,
  Plus,
  Minus,
  X,
  Square,
  Triangle,
  Circle
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface EnhancedQuantitativeTest {
  id: string;
  name: string;
  subcategory: string;
  description: string;
  questionCount: number;
  timeLimit: number;
  difficulty: 'أساسي' | 'متوسط' | 'متقدم' | 'خبير' | 'عبقري';
  icon: React.ReactNode;
  color: string;
  gradientFrom: string;
  gradientTo: string;
  level: number;
  requiredScore?: number;
  bonusPoints: number;
  specialFeatures: string[];
  estimatedTime: string;
  aiAnalysis: boolean;
  adaptiveDifficulty: boolean;
  mathComplexity: 'بسيط' | 'متوسط' | 'معقد' | 'متقدم';
  calculatorAllowed: boolean;
}

interface MathSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  testsCompleted: number;
  totalScore: number;
  performance: string;
  mathStreak: number;
}

interface MathAchievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  earned: boolean;
  progress: number;
  requirement: number;
  category: 'speed' | 'accuracy' | 'consistency' | 'mastery';
}

interface MathStats {
  totalProblems: number;
  averageScore: number;
  bestStreak: number;
  currentStreak: number;
  totalTimeSpent: number;
  improvementRate: number;
  rank: string;
  level: number;
  experience: number;
  nextLevelExp: number;
  strongAreas: string[];
  weakAreas: string[];
  speedRating: number;
  accuracyRating: number;
}

export function EnhancedQuantitativeTests() {
  const [, setLocation] = useLocation();
  const [selectedTest, setSelectedTest] = useState<EnhancedQuantitativeTest | null>(null);
  const [currentSession, setCurrentSession] = useState<MathSession | null>(null);
  const [showStats, setShowStats] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get user info
  const { data: user } = useQuery({
    queryKey: ['/api/user'],
  });

  // محاكاة بيانات الإحصائيات الرياضية
  const [mathStats, setMathStats] = useState<MathStats>({
    totalProblems: 234,
    averageScore: 82,
    bestStreak: 18,
    currentStreak: 7,
    totalTimeSpent: 890, // minutes
    improvementRate: 22,
    rank: "محلل خبير",
    level: 6,
    experience: 1890,
    nextLevelExp: 2500,
    strongAreas: ["الهندسة", "النسبة والتناسب"],
    weakAreas: ["المعادلات المعقدة", "الإحصاء المتقدم"],
    speedRating: 75,
    accuracyRating: 88
  });

  const isPremiumUser = user && (
    (user as any)?.subscription?.type === 'Pro' || 
    (user as any)?.subscription?.type === 'Pro Life' || 
    (user as any)?.subscription?.type === 'Pro Live' ||
    (user as any)?.subscription === 'pro' ||
    (user as any)?.subscription === 'pro_life'
  );

  // اختبارات الكمي المتقدمة والمتخصصة
  const enhancedQuantitativeTests: EnhancedQuantitativeTest[] = [
    {
      id: 'geometry_master',
      name: 'سيد الهندسة',
      subcategory: 'الهندسة المتقدمة',
      description: 'اختبار شامل للهندسة المستوية والفراغية مع حلول تفاعلية',
      questionCount: 30,
      timeLimit: 35,
      difficulty: 'متقدم',
      level: 3,
      bonusPoints: 250,
      icon: <Triangle className="w-6 h-6" />,
      color: 'from-blue-500 to-cyan-500',
      gradientFrom: 'from-blue-100',
      gradientTo: 'to-cyan-100',
      specialFeatures: ['رسوم بيانية تفاعلية', 'حلول مرئية', 'نصائح هندسية'],
      estimatedTime: '30-40 دقيقة',
      aiAnalysis: true,
      adaptiveDifficulty: true,
      mathComplexity: 'معقد',
      calculatorAllowed: true
    },
    {
      id: 'algebra_expert',
      name: 'خبير الجبر',
      subcategory: 'المعادلات والجبر',
      description: 'تدريب متقدم على المعادلات والمتباينات مع أنظمة معقدة',
      questionCount: 25,
      timeLimit: 30,
      difficulty: 'خبير',
      level: 4,
      requiredScore: 75,
      bonusPoints: 300,
      icon: <Equal className="w-6 h-6" />,
      color: 'from-green-500 to-emerald-500',
      gradientFrom: 'from-green-100',
      gradientTo: 'to-emerald-100',
      specialFeatures: ['حلول خطوة بخطوة', 'أمثلة متقدمة', 'تحقق تلقائي'],
      estimatedTime: '25-35 دقيقة',
      aiAnalysis: true,
      adaptiveDifficulty: false,
      mathComplexity: 'متقدم',
      calculatorAllowed: true
    },
    {
      id: 'statistics_pro',
      name: 'محترف الإحصاء',
      subcategory: 'الإحصاء والاحتماليات',
      description: 'اختبار متخصص في الإحصاء التطبيقي والاحتماليات المتقدمة',
      questionCount: 35,
      timeLimit: 40,
      difficulty: 'خبير',
      level: 5,
      requiredScore: 80,
      bonusPoints: 350,
      icon: <BarChart3 className="w-6 h-6" />,
      color: 'from-purple-500 to-violet-500',
      gradientFrom: 'from-purple-100',
      gradientTo: 'to-violet-100',
      specialFeatures: ['رسوم بيانية حية', 'تحليل البيانات', 'محاكاة التجارب'],
      estimatedTime: '35-45 دقيقة',
      aiAnalysis: true,
      adaptiveDifficulty: true,
      mathComplexity: 'متقدم',
      calculatorAllowed: true
    },
    {
      id: 'arithmetic_speed',
      name: 'سرعة العمليات الحسابية',
      subcategory: 'العمليات السريعة',
      description: 'تدريب على السرعة والدقة في العمليات الحسابية الأساسية',
      questionCount: 50,
      timeLimit: 20,
      difficulty: 'متوسط',
      level: 2,
      bonusPoints: 150,
      icon: <Zap className="w-6 h-6" />,
      color: 'from-yellow-500 to-orange-500',
      gradientFrom: 'from-yellow-100',
      gradientTo: 'to-orange-100',
      specialFeatures: ['تحدي السرعة', 'ترتيب المتصدرين', 'تدريب يومي'],
      estimatedTime: '15-25 دقيقة',
      aiAnalysis: false,
      adaptiveDifficulty: false,
      mathComplexity: 'بسيط',
      calculatorAllowed: false
    },
    {
      id: 'percentages_master',
      name: 'أستاذ النسب المئوية',
      subcategory: 'النسب والتناسب',
      description: 'إتقان حسابات النسب المئوية والتناسب في مواقف متنوعة',
      questionCount: 40,
      timeLimit: 35,
      difficulty: 'متقدم',
      level: 3,
      bonusPoints: 200,
      icon: <Percent className="w-6 h-6" />,
      color: 'from-pink-500 to-rose-500',
      gradientFrom: 'from-pink-100',
      gradientTo: 'to-rose-100',
      specialFeatures: ['تطبيقات عملية', 'حسابات تجارية', 'مشاكل حياتية'],
      estimatedTime: '30-40 دقيقة',
      aiAnalysis: true,
      adaptiveDifficulty: true,
      mathComplexity: 'متوسط',
      calculatorAllowed: true
    },
    {
      id: 'ultimate_math_challenge',
      name: 'التحدي الرياضي الأعظم',
      subcategory: 'تحدي شامل',
      description: 'اختبار نهائي يجمع جميع فروع الرياضيات في تحدي واحد ملحمي',
      questionCount: 60,
      timeLimit: 75,
      difficulty: 'عبقري',
      level: 6,
      requiredScore: 85,
      bonusPoints: 500,
      icon: <Crown className="w-6 h-6" />,
      color: 'from-red-500 to-purple-500',
      gradientFrom: 'from-red-100',
      gradientTo: 'to-purple-100',
      specialFeatures: ['مزيج من جميع المجالات', 'وضع البطولة', 'مكافآت استثنائية'],
      estimatedTime: '60-80 دقيقة',
      aiAnalysis: true,
      adaptiveDifficulty: true,
      mathComplexity: 'متقدم',
      calculatorAllowed: true
    }
  ];

  // محاكاة إنجازات رياضية
  const mathAchievements: MathAchievement[] = [
    {
      id: '1',
      name: 'أول حل',
      description: 'حل أول مسألة رياضية بنجاح',
      icon: 'Target',
      color: 'text-blue-500',
      earned: true,
      progress: 1,
      requirement: 1,
      category: 'mastery'
    },
    {
      id: '2',
      name: 'سرعة البرق',
      description: 'حل 20 مسألة في أقل من 10 دقائق',
      icon: 'Zap',
      color: 'text-yellow-500',
      earned: false,
      progress: 15,
      requirement: 20,
      category: 'speed'
    },
    {
      id: '3',
      name: 'الدقة المطلقة',
      description: 'احصل على 100% في اختبار متقدم',
      icon: 'Eye',
      color: 'text-green-500',
      earned: true,
      progress: 1,
      requirement: 1,
      category: 'accuracy'
    },
    {
      id: '4',
      name: 'الثبات الرياضي',
      description: 'حافظ على سلسلة 20 يوم',
      icon: 'Flame',
      color: 'text-orange-500',
      earned: false,
      progress: 7,
      requirement: 20,
      category: 'consistency'
    }
  ];

  const startMathSession = () => {
    const sessionId = `math_session_${Date.now()}`;
    const newSession: MathSession = {
      id: sessionId,
      startTime: new Date(),
      testsCompleted: 0,
      totalScore: 0,
      performance: '',
      mathStreak: mathStats.currentStreak
    };
    setCurrentSession(newSession);
    localStorage.setItem('currentMathSession', JSON.stringify(newSession));
  };

  const recordMathResult = useMutation({
    mutationFn: async (result: any) => {
      const response = await fetch('/api/test-results/advanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: (user as any)?.id || 1,
          testId: result.testId,
          testName: result.testName,
          testCategory: 'quantitative_specialized',
          subcategory: result.subcategory,
          totalQuestions: result.totalQuestions,
          correctAnswers: result.correctAnswers,
          wrongAnswers: result.wrongAnswers,
          percentage: result.percentage,
          timeTaken: result.timeTaken,
          timeLimit: result.timeLimit,
          difficulty: result.difficulty,
          pointsEarned: result.pointsEarned,
          performanceLevel: result.performanceLevel,
          sessionId: currentSession?.id
        })
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      toast({
        title: "تم تسجيل النتيجة الرياضية",
        description: "تم حفظ نتيجة الاختبار الكمي بنجاح",
      });
    }
  });

  const startTest = (test: EnhancedQuantitativeTest) => {
    if (!isPremiumUser && test.level > 2) {
      toast({
        title: "اختبار متقدم",
        description: "هذا الاختبار الرياضي متاح للمشتركين المميزين فقط",
        variant: "destructive"
      });
      return;
    }

    if (test.requiredScore && mathStats.averageScore < test.requiredScore) {
      toast({
        title: "مستوى رياضي غير كافي",
        description: `تحتاج إلى متوسط ${test.requiredScore}% في الرياضيات`,
        variant: "destructive"
      });
      return;
    }

    if (!currentSession) {
      startMathSession();
    }

    setLocation(`/quantitative-test-runner/${test.id}`);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'أساسي': return 'bg-green-100 text-green-800';
      case 'متوسط': return 'bg-blue-100 text-blue-800';
      case 'متقدم': return 'bg-purple-100 text-purple-800';
      case 'خبير': return 'bg-orange-100 text-orange-800';
      case 'عبقري': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'بسيط': return 'bg-emerald-100 text-emerald-800';
      case 'متوسط': return 'bg-blue-100 text-blue-800';
      case 'معقد': return 'bg-orange-100 text-orange-800';
      case 'متقدم': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getLevelBadge = (level: number) => {
    if (level <= 2) return { icon: <Calculator className="w-4 h-4" />, color: 'bg-blue-500' };
    if (level <= 4) return { icon: <Brain className="w-4 h-4" />, color: 'bg-purple-500' };
    return { icon: <Crown className="w-4 h-4" />, color: 'bg-red-500' };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-indigo-900 dark:to-purple-900 p-4">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full">
              <Calculator className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              الاختبارات الكمية المتقدمة
            </h1>
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
            اختبارات رياضية متخصصة مع تحليل ذكي وتتبع شامل للأداء
          </p>
          
          {/* Math Stats Bar */}
          <div className="flex justify-center items-center gap-6 mb-6">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-2 bg-white/80 dark:bg-gray-800/80 px-4 py-2 rounded-full shadow-lg cursor-pointer"
              onClick={() => setShowStats(!showStats)}
            >
              <TrendingUp className="w-5 h-5 text-blue-500" />
              <span className="font-semibold">متوسط: {mathStats.averageScore}%</span>
            </motion.div>
            
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-2 bg-white/80 dark:bg-gray-800/80 px-4 py-2 rounded-full shadow-lg cursor-pointer"
              onClick={() => setShowAchievements(!showAchievements)}
            >
              <Flame className="w-5 h-5 text-orange-500" />
              <span className="font-semibold">السلسلة: {mathStats.currentStreak}</span>
            </motion.div>
            
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-2 bg-white/80 dark:bg-gray-800/80 px-4 py-2 rounded-full shadow-lg"
            >
              <Trophy className="w-5 h-5 text-yellow-500" />
              <span className="font-semibold">{mathStats.rank}</span>
            </motion.div>
          </div>
        </motion.div>

        {/* Math Stats Panel */}
        <AnimatePresence>
          {showStats && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8"
            >
              <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-6 h-6 text-blue-500" />
                    إحصائيات الأداء الرياضي
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600">{mathStats.totalProblems}</div>
                      <div className="text-sm text-gray-600">المسائل المحلولة</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600">{mathStats.averageScore}%</div>
                      <div className="text-sm text-gray-600">المتوسط العام</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-purple-600">{Math.floor(mathStats.totalTimeSpent / 60)}h</div>
                      <div className="text-sm text-gray-600">وقت الحل</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-orange-600">+{mathStats.improvementRate}%</div>
                      <div className="text-sm text-gray-600">معدل التحسن</div>
                    </div>
                  </div>
                  
                  {/* Math Skills Breakdown */}
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-3 text-green-600">نقاط القوة</h4>
                      <div className="space-y-2">
                        {mathStats.strongAreas.map((area, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                            <span className="text-sm">{area}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-3 text-orange-600">نقاط التحسين</h4>
                      <div className="space-y-2">
                        {mathStats.weakAreas.map((area, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <Target className="w-4 h-4 text-orange-500" />
                            <span className="text-sm">{area}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Performance Meters */}
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>السرعة</span>
                        <span>{mathStats.speedRating}%</span>
                      </div>
                      <Progress value={mathStats.speedRating} className="h-3" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>الدقة</span>
                        <span>{mathStats.accuracyRating}%</span>
                      </div>
                      <Progress value={mathStats.accuracyRating} className="h-3" />
                    </div>
                  </div>
                  
                  {/* Level Progress */}
                  <div className="mt-6">
                    <div className="flex justify-between text-sm mb-2">
                      <span>المستوى {mathStats.level}</span>
                      <span>{mathStats.experience}/{mathStats.nextLevelExp} XP</span>
                    </div>
                    <Progress value={(mathStats.experience / mathStats.nextLevelExp) * 100} className="h-3" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Math Achievements Panel */}
        <AnimatePresence>
          {showAchievements && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8"
            >
              <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Medal className="w-6 h-6 text-yellow-500" />
                    الإنجازات الرياضية
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {mathAchievements.map((achievement) => (
                      <div
                        key={achievement.id}
                        className={`p-4 rounded-lg border-2 ${
                          achievement.earned 
                            ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-300' 
                            : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full ${achievement.earned ? 'bg-yellow-500' : 'bg-gray-400'}`}>
                            <Medal className={`w-5 h-5 text-white`} />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold">{achievement.name}</h3>
                            <p className="text-sm text-gray-600">{achievement.description}</p>
                            <Badge className="text-xs mt-1" variant="outline">
                              {achievement.category === 'speed' && 'سرعة'}
                              {achievement.category === 'accuracy' && 'دقة'}
                              {achievement.category === 'consistency' && 'ثبات'}
                              {achievement.category === 'mastery' && 'إتقان'}
                            </Badge>
                            {!achievement.earned && (
                              <div className="mt-2">
                                <div className="flex justify-between text-xs mb-1">
                                  <span>التقدم</span>
                                  <span>{achievement.progress}/{achievement.requirement}</span>
                                </div>
                                <Progress value={(achievement.progress / achievement.requirement) * 100} className="h-2" />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tests Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {enhancedQuantitativeTests.map((test, index) => {
            const levelBadge = getLevelBadge(test.level);
            const isLocked = !isPremiumUser && test.level > 2;
            const requirementsMet = !test.requiredScore || mathStats.averageScore >= test.requiredScore;
            
            return (
              <motion.div
                key={test.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5, scale: 1.02 }}
              >
                <Card className={`h-full bg-gradient-to-br ${test.gradientFrom} ${test.gradientTo} 
                  dark:from-gray-800 dark:to-gray-700 shadow-xl hover:shadow-2xl transition-all duration-300 
                  ${isLocked ? 'opacity-75' : ''} relative overflow-hidden`}>
                  
                  {/* Mathematical Pattern Background */}
                  <div className="absolute inset-0 opacity-5">
                    <div className="absolute top-4 right-4 text-6xl font-bold">∑</div>
                    <div className="absolute bottom-4 left-4 text-4xl font-bold">∫</div>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-8xl font-bold">π</div>
                  </div>
                  
                  <CardHeader className="relative">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-3 rounded-xl bg-gradient-to-r ${test.color} shadow-lg`}>
                        {test.icon}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold text-white ${levelBadge.color}`}>
                          {levelBadge.icon}
                          المستوى {test.level}
                        </div>
                        {isLocked && <Lock className="w-5 h-5 text-gray-400" />}
                      </div>
                    </div>
                    
                    <CardTitle className="text-xl font-bold mb-2">{test.name}</CardTitle>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                      {test.description}
                    </p>
                    
                    <div className="flex flex-wrap gap-2">
                      <Badge className={getDifficultyColor(test.difficulty)}>
                        {test.difficulty}
                      </Badge>
                      <Badge className={getComplexityColor(test.mathComplexity)}>
                        {test.mathComplexity}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {test.questionCount} مسألة
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {test.timeLimit} دقيقة
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="relative">
                    {/* Calculator Allowed Indicator */}
                    {test.calculatorAllowed && (
                      <div className="mb-3 flex items-center gap-2 text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full w-fit">
                        <Calculator className="w-3 h-3" />
                        آلة حاسبة مسموحة
                      </div>
                    )}
                    
                    {/* Special Features */}
                    <div className="mb-4">
                      <h4 className="font-semibold text-sm mb-2 flex items-center gap-1">
                        <Sparkles className="w-4 h-4" />
                        الميزات الرياضية:
                      </h4>
                      <ul className="text-xs space-y-1">
                        {test.specialFeatures.map((feature, idx) => (
                          <li key={idx} className="flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-green-500" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    {/* Math Info Row */}
                    <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4 text-blue-500" />
                        <span>{test.estimatedTime}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500" />
                        <span>+{test.bonusPoints} نقطة</span>
                      </div>
                    </div>
                    
                    {/* AI & Adaptive Features */}
                    <div className="flex gap-2 mb-4">
                      {test.aiAnalysis && (
                        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                          <Brain className="w-3 h-3 mr-1" />
                          تحليل ذكي
                        </Badge>
                      )}
                      {test.adaptiveDifficulty && (
                        <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700">
                          <TrendingUp className="w-3 h-3 mr-1" />
                          تكيف ذكي
                        </Badge>
                      )}
                    </div>
                    
                    {/* Requirements Warning */}
                    {test.requiredScore && !requirementsMet && (
                      <div className="mb-4 p-2 bg-orange-50 border border-orange-200 rounded-lg">
                        <div className="flex items-center gap-2 text-orange-700 text-xs">
                          <AlertCircle className="w-4 h-4" />
                          <span>يتطلب متوسط {test.requiredScore}% (حالياً {mathStats.averageScore}%)</span>
                        </div>
                      </div>
                    )}
                    
                    {/* Action Button */}
                    <Button 
                      onClick={() => startTest(test)}
                      disabled={isLocked || !requirementsMet}
                      className={`w-full bg-gradient-to-r ${test.color} hover:shadow-lg transition-all duration-300 
                        ${isLocked || !requirementsMet ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {isLocked ? (
                        <div className="flex items-center gap-2">
                          <Lock className="w-4 h-4" />
                          مميز فقط
                        </div>
                      ) : !requirementsMet ? (
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4" />
                          مقفل
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <PlayCircle className="w-4 h-4" />
                          ابدأ التحدي
                        </div>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Quick Actions Panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-8"
        >
          <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold mb-2">إجراءات رياضية سريعة</h3>
                  <p className="opacity-90">اطلع على تقاريرك الرياضية أو قم بتصدير بياناتك</p>
                </div>
                <div className="flex gap-3">
                  <Button 
                    variant="secondary" 
                    onClick={() => setLocation('/test-results')}
                    className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                  >
                    <History className="w-4 h-4 mr-2" />
                    سجل الرياضيات
                  </Button>
                  <Button 
                    variant="secondary"
                    className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    تصدير البيانات
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}