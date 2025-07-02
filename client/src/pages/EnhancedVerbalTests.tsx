import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  BookOpen,
  Target,
  Brain,
  Clock,
  Users,
  Star,
  Trophy,
  Lock,
  CheckCircle2,
  Calendar,
  Zap,
  Award,
  Sparkles,
  TrendingUp,
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
  Download
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface EnhancedVerbalTest {
  id: string;
  name: string;
  subcategory: string;
  description: string;
  questionCount: number;
  timeLimit: number;
  difficulty: 'سهل' | 'متوسط' | 'صعب' | 'متقدم' | 'خبير';
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
}

interface TestSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  testsCompleted: number;
  totalScore: number;
  performance: string;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  earned: boolean;
  progress: number;
  requirement: number;
}

interface UserStats {
  totalTests: number;
  averageScore: number;
  bestStreak: number;
  currentStreak: number;
  totalTimeSpent: number;
  improvementRate: number;
  rank: string;
  level: number;
  experience: number;
  nextLevelExp: number;
}

export function EnhancedVerbalTests() {
  const [, setLocation] = useLocation();
  const [selectedTest, setSelectedTest] = useState<EnhancedVerbalTest | null>(null);
  const [currentSession, setCurrentSession] = useState<TestSession | null>(null);
  const [showStats, setShowStats] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get user info
  const { data: user } = useQuery({
    queryKey: ['/api/user'],
  });

  // محاكاة بيانات إحصائيات المستخدم
  const [userStats, setUserStats] = useState<UserStats>({
    totalTests: 45,
    averageScore: 78,
    bestStreak: 12,
    currentStreak: 5,
    totalTimeSpent: 1240, // minutes
    improvementRate: 15,
    rank: "متميز",
    level: 8,
    experience: 2340,
    nextLevelExp: 3000
  });

  const isPremiumUser = user && (
    (user as any)?.subscription?.type === 'Pro' || 
    (user as any)?.subscription?.type === 'Pro Life' || 
    (user as any)?.subscription?.type === 'Pro Live' ||
    (user as any)?.subscription === 'pro' ||
    (user as any)?.subscription === 'pro_life'
  );

  // اختبارات لفظية متقدمة ومتخصصة
  const enhancedVerbalTests: EnhancedVerbalTest[] = [
    {
      id: 'analogy_master',
      name: 'سيد التناظر اللفظي',
      subcategory: 'التناظر اللفظي المتقدم',
      description: 'اختبار متخصص للتناظر اللفظي مع تحليل ذكي وتكييف مستوى الصعوبة',
      questionCount: 40,
      timeLimit: 35,
      difficulty: 'متقدم',
      level: 3,
      bonusPoints: 200,
      icon: <Brain className="w-6 h-6" />,
      color: 'from-purple-500 to-pink-500',
      gradientFrom: 'from-purple-100',
      gradientTo: 'to-pink-100',
      specialFeatures: ['تحليل ذكي للأخطاء', 'تكييف مستوى الصعوبة', 'تقرير مفصل'],
      estimatedTime: '35-45 دقيقة',
      aiAnalysis: true,
      adaptiveDifficulty: true
    },
    {
      id: 'sentence_completion_pro',
      name: 'خبير إكمال الجمل',
      subcategory: 'إكمال الجمل الاحترافي',
      description: 'تدريب متقدم على إكمال الجمل مع تقنيات السياق المعقدة',
      questionCount: 35,
      timeLimit: 30,
      difficulty: 'صعب',
      level: 4,
      bonusPoints: 250,
      icon: <Award className="w-6 h-6" />,
      color: 'from-blue-500 to-cyan-500',
      gradientFrom: 'from-blue-100',
      gradientTo: 'to-cyan-100',
      specialFeatures: ['تحليل السياق المتقدم', 'نصائح فورية', 'مراجعة شاملة'],
      estimatedTime: '25-35 دقيقة',
      aiAnalysis: true,
      adaptiveDifficulty: false
    },
    {
      id: 'reading_comprehension_elite',
      name: 'نخبة الاستيعاب المقروء',
      subcategory: 'الاستيعاب المقروء المتميز',
      description: 'اختبار النخبة للاستيعاب المقروء مع نصوص أكاديمية متقدمة',
      questionCount: 50,
      timeLimit: 60,
      difficulty: 'خبير',
      level: 5,
      requiredScore: 80,
      bonusPoints: 350,
      icon: <Crown className="w-6 h-6" />,
      color: 'from-yellow-500 to-orange-500',
      gradientFrom: 'from-yellow-100',
      gradientTo: 'to-orange-100',
      specialFeatures: ['نصوص أكاديمية', 'تحليل عميق', 'استراتيجيات القراءة'],
      estimatedTime: '45-60 دقيقة',
      aiAnalysis: true,
      adaptiveDifficulty: true
    },
    {
      id: 'synonyms_antonyms_master',
      name: 'أستاذ المترادفات والأضداد',
      subcategory: 'المترادفات والأضداد المتقدمة',
      description: 'تدريب شامل على المترادفات والأضداد مع قاموس تفاعلي',
      questionCount: 45,
      timeLimit: 40,
      difficulty: 'متقدم',
      level: 3,
      bonusPoints: 180,
      icon: <Diamond className="w-6 h-6" />,
      color: 'from-green-500 to-teal-500',
      gradientFrom: 'from-green-100',
      gradientTo: 'to-teal-100',
      specialFeatures: ['قاموس تفاعلي', 'أمثلة من الأدب', 'تدريبات متدرجة'],
      estimatedTime: '35-45 دقيقة',
      aiAnalysis: true,
      adaptiveDifficulty: false
    },
    {
      id: 'mixed_verbal_challenge',
      name: 'تحدي اللفظي الشامل',
      subcategory: 'تحدي متنوع',
      description: 'اختبار شامل يجمع جميع أقسام اللفظي في تحدي واحد متقدم',
      questionCount: 80,
      timeLimit: 75,
      difficulty: 'خبير',
      level: 6,
      requiredScore: 85,
      bonusPoints: 500,
      icon: <Rocket className="w-6 h-6" />,
      color: 'from-red-500 to-purple-500',
      gradientFrom: 'from-red-100',
      gradientTo: 'to-purple-100',
      specialFeatures: ['مزيج من جميع الأقسام', 'وضع التحدي', 'مكافآت مضاعفة'],
      estimatedTime: '60-75 دقيقة',
      aiAnalysis: true,
      adaptiveDifficulty: true
    }
  ];

  // محاكاة الإنجازات
  const achievements: Achievement[] = [
    {
      id: '1',
      name: 'أول انتصار',
      description: 'أكمل أول اختبار بنجاح',
      icon: 'Trophy',
      color: 'text-yellow-500',
      earned: true,
      progress: 1,
      requirement: 1
    },
    {
      id: '2',
      name: 'الماراثوني',
      description: 'أكمل 10 اختبارات في يوم واحد',
      icon: 'Flame',
      color: 'text-red-500',
      earned: false,
      progress: 7,
      requirement: 10
    },
    {
      id: '3',
      name: 'الكمالي',
      description: 'احصل على 100% في أي اختبار',
      icon: 'Star',
      color: 'text-blue-500',
      earned: false,
      progress: 0,
      requirement: 1
    },
    {
      id: '4',
      name: 'الثابت',
      description: 'احتفظ بسلسلة 15 يوم',
      icon: 'Shield',
      color: 'text-green-500',
      earned: true,
      progress: 15,
      requirement: 15
    }
  ];

  // بدء جلسة اختبار جديدة
  const startSession = () => {
    const sessionId = `session_${Date.now()}`;
    const newSession: TestSession = {
      id: sessionId,
      startTime: new Date(),
      testsCompleted: 0,
      totalScore: 0,
      performance: ''
    };
    setCurrentSession(newSession);
    localStorage.setItem('currentTestSession', JSON.stringify(newSession));
  };

  // تسجيل نتيجة الاختبار
  const recordTestResult = useMutation({
    mutationFn: async (result: any) => {
      const response = await fetch('/api/test-results/advanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: (user as any)?.id || 1,
          testId: result.testId,
          testName: result.testName,
          testCategory: 'verbal_specialized',
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
        title: "تم تسجيل النتيجة",
        description: "تم حفظ نتيجة الاختبار بنجاح في سجلك",
      });
    }
  });

  const startTest = (test: EnhancedVerbalTest) => {
    if (!isPremiumUser && test.level > 2) {
      toast({
        title: "اختبار متقدم",
        description: "هذا الاختبار متاح للمشتركين المميزين فقط",
        variant: "destructive"
      });
      return;
    }

    if (test.requiredScore && userStats.averageScore < test.requiredScore) {
      toast({
        title: "مستوى غير كافي",
        description: `تحتاج إلى متوسط ${test.requiredScore}% لدخول هذا الاختبار`,
        variant: "destructive"
      });
      return;
    }

    if (!currentSession) {
      startSession();
    }

    setLocation(`/verbal-test-runner/${test.id}`);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'سهل': return 'bg-green-100 text-green-800';
      case 'متوسط': return 'bg-blue-100 text-blue-800';
      case 'صعب': return 'bg-orange-100 text-orange-800';
      case 'متقدم': return 'bg-purple-100 text-purple-800';
      case 'خبير': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getLevelBadge = (level: number) => {
    if (level <= 2) return { icon: <Star className="w-4 h-4" />, color: 'bg-blue-500' };
    if (level <= 4) return { icon: <Crown className="w-4 h-4" />, color: 'bg-purple-500' };
    return { icon: <Diamond className="w-4 h-4" />, color: 'bg-red-500' };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 p-4">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              الاختبارات اللفظية المتقدمة
            </h1>
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
            اختبارات متخصصة مع تحليل ذكي وتتبع شامل للأداء
          </p>
          
          {/* Quick Stats Bar */}
          <div className="flex justify-center items-center gap-6 mb-6">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-2 bg-white/80 dark:bg-gray-800/80 px-4 py-2 rounded-full shadow-lg cursor-pointer"
              onClick={() => setShowStats(!showStats)}
            >
              <BarChart3 className="w-5 h-5 text-blue-500" />
              <span className="font-semibold">متوسط: {userStats.averageScore}%</span>
            </motion.div>
            
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-2 bg-white/80 dark:bg-gray-800/80 px-4 py-2 rounded-full shadow-lg cursor-pointer"
              onClick={() => setShowAchievements(!showAchievements)}
            >
              <Flame className="w-5 h-5 text-orange-500" />
              <span className="font-semibold">السلسلة: {userStats.currentStreak}</span>
            </motion.div>
            
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-2 bg-white/80 dark:bg-gray-800/80 px-4 py-2 rounded-full shadow-lg"
            >
              <Trophy className="w-5 h-5 text-yellow-500" />
              <span className="font-semibold">المستوى: {userStats.level}</span>
            </motion.div>
          </div>
        </motion.div>

        {/* Stats Panel */}
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
                    <Activity className="w-6 h-6 text-blue-500" />
                    إحصائيات الأداء
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600">{userStats.totalTests}</div>
                      <div className="text-sm text-gray-600">إجمالي الاختبارات</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600">{userStats.averageScore}%</div>
                      <div className="text-sm text-gray-600">المتوسط العام</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-purple-600">{Math.floor(userStats.totalTimeSpent / 60)}h</div>
                      <div className="text-sm text-gray-600">إجمالي الوقت</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-orange-600">+{userStats.improvementRate}%</div>
                      <div className="text-sm text-gray-600">معدل التحسن</div>
                    </div>
                  </div>
                  
                  {/* Progress Bar for Next Level */}
                  <div className="mt-6">
                    <div className="flex justify-between text-sm mb-2">
                      <span>المستوى {userStats.level}</span>
                      <span>{userStats.experience}/{userStats.nextLevelExp} XP</span>
                    </div>
                    <Progress value={(userStats.experience / userStats.nextLevelExp) * 100} className="h-3" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Achievements Panel */}
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
                    الإنجازات
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {achievements.map((achievement) => (
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
                            <Trophy className={`w-5 h-5 text-white`} />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold">{achievement.name}</h3>
                            <p className="text-sm text-gray-600">{achievement.description}</p>
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
          {enhancedVerbalTests.map((test, index) => {
            const levelBadge = getLevelBadge(test.level);
            const isLocked = !isPremiumUser && test.level > 2;
            const requirementsMet = !test.requiredScore || userStats.averageScore >= test.requiredScore;
            
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
                  
                  {/* Background Pattern */}
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -translate-y-16 translate-x-16" />
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full translate-y-12 -translate-x-12" />
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
                      <Badge variant="outline" className="text-xs">
                        {test.questionCount} سؤال
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {test.timeLimit} دقيقة
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="relative">
                    {/* Special Features */}
                    <div className="mb-4">
                      <h4 className="font-semibold text-sm mb-2 flex items-center gap-1">
                        <Sparkles className="w-4 h-4" />
                        الميزات الخاصة:
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
                    
                    {/* Test Info Row */}
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
                          <span>يتطلب متوسط {test.requiredScore}% (حالياً {userStats.averageScore}%)</span>
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
                          ابدأ الاختبار
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
                  <h3 className="text-xl font-bold mb-2">إجراءات سريعة</h3>
                  <p className="opacity-90">اطلع على تقاريرك أو قم بتصدير بياناتك</p>
                </div>
                <div className="flex gap-3">
                  <Button 
                    variant="secondary" 
                    onClick={() => setLocation('/test-results')}
                    className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                  >
                    <History className="w-4 h-4 mr-2" />
                    سجل الاختبارات
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