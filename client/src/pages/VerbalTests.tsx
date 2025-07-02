import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
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
  TrendingUp
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface VerbalTest {
  id: string;
  name: string;
  subcategory: string;
  description: string;
  questionCount: number;
  timeLimit: number;
  difficulty: 'سهل' | 'متوسط' | 'صعب';
  icon: React.ReactNode;
  color: string;
  gradientFrom: string;
  gradientTo: string;
}

interface UserTestHistory {
  testId: string;
  date: string;
  score: number;
  percentage: number;
  completedToday: boolean;
}

interface StatItem {
  value: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export function VerbalTests() {
  const [, setLocation] = useLocation();
  const [selectedTest, setSelectedTest] = useState<VerbalTest | null>(null);
  const [userHistory, setUserHistory] = useState<UserTestHistory[]>([]);

  // Get user info to check subscription status
  const { data: user } = useQuery({
    queryKey: ['/api/user'],
  });

  // نظام التحكم الفعال للحد اليومي مثل قياس
  const [dailyTestsTaken, setDailyTestsTaken] = useState(0);
  const MAX_DAILY_FREE_TESTS = 1; // اختبار واحد فقط يومياً

  useEffect(() => {
    // حساب عدد الاختبارات المأخوذة اليوم للمستخدمين المجانيين
    const today = new Date().toDateString();
    const testsToday = JSON.parse(localStorage.getItem(`dailyVerbalTests_${today}`) || '0');
    setDailyTestsTaken(testsToday);
  }, []);

  const isPremiumUser = user && (
    (user as any)?.subscription?.type === 'Pro' || 
    (user as any)?.subscription?.type === 'Pro Life' || 
    (user as any)?.subscription?.type === 'Pro Live' ||
    (user as any)?.subscription === 'pro' ||
    (user as any)?.subscription === 'pro_life'
  );



  const canTakeTest = !!isPremiumUser || dailyTestsTaken < MAX_DAILY_FREE_TESTS;

  // تسجيل اختبار جديد للحسابات المجانية
  const recordTestTaken = () => {
    if (!isPremiumUser) {
      const today = new Date().toDateString();
      const newCount = dailyTestsTaken + 1;
      localStorage.setItem(`dailyVerbalTests_${today}`, JSON.stringify(newCount));
      setDailyTestsTaken(newCount);
    }
  };

  // Load user history from localStorage on component mount
  useEffect(() => {
    const storedResults = localStorage.getItem('verbalTestResults');
    if (storedResults) {
      try {
        const results = JSON.parse(storedResults);
        const historyData = results.map((result: any) => ({
          testId: getTestIdFromSubcategory(result.subcategory),
          date: result.date,
          score: result.correctAnswers,
          percentage: result.percentage,
          completedToday: new Date(result.date).toDateString() === new Date().toDateString()
        }));
        setUserHistory(historyData);
      } catch (error) {
        console.error('Error loading test history:', error);
      }
    }
  }, []);

  // Helper function to get test ID from subcategory
  const getTestIdFromSubcategory = (subcategory: string): string => {
    switch (subcategory) {
      case 'التناظر اللفظي': return 'analogy-test';
      case 'إكمال الجمل': return 'completion-test';
      case 'استيعاب المقروء': return 'comprehension-test';
      case 'الخطأ السياقي': return 'context-error-test';
      default: return '';
    }
  };

  const verbalTests: VerbalTest[] = [
    {
      id: 'analogy-test',
      name: 'اختبار التناظر اللفظي',
      subcategory: 'التناظر اللفظي',
      description: 'اختبار متخصص في قياس قدرتك على إيجاد العلاقات بين الكلمات والمفاهيم',
      questionCount: 65,
      timeLimit: 65,
      difficulty: 'متوسط',
      icon: <Target className="w-6 h-6" />,
      color: 'from-blue-500 to-cyan-500',
      gradientFrom: 'from-blue-50',
      gradientTo: 'to-cyan-50'
    },
    {
      id: 'completion-test',
      name: 'اختبار إكمال الجمل',
      subcategory: 'إكمال الجمل',
      description: 'اختبار يقيس قدرتك على فهم السياق اللغوي واختيار الكلمة المناسبة',
      questionCount: 65,
      timeLimit: 65,
      difficulty: 'سهل',
      icon: <BookOpen className="w-6 h-6" />,
      color: 'from-green-500 to-emerald-500',
      gradientFrom: 'from-green-50',
      gradientTo: 'to-emerald-50'
    },
    {
      id: 'comprehension-test',
      name: 'اختبار الاستيعاب المقروء',
      subcategory: 'استيعاب المقروء',
      description: 'اختبار شامل لقياس قدرتك على فهم النصوص المكتوبة وتحليلها',
      questionCount: 65,
      timeLimit: 65,
      difficulty: 'صعب',
      icon: <Brain className="w-6 h-6" />,
      color: 'from-purple-500 to-pink-500',
      gradientFrom: 'from-purple-50',
      gradientTo: 'to-pink-50'
    },
    {
      id: 'context-error-test',
      name: 'اختبار الخطأ السياقي',
      subcategory: 'الخطأ السياقي',
      description: 'اختبار دقيق لقياس قدرتك على تحديد وتصحيح الأخطاء اللغوية',
      questionCount: 65,
      timeLimit: 65,
      difficulty: 'صعب',
      icon: <Award className="w-6 h-6" />,
      color: 'from-indigo-500 to-blue-500',
      gradientFrom: 'from-indigo-50',
      gradientTo: 'to-blue-50'
    }
  ];

  const checkDailyLimit = (testId: string): boolean => {
    // Must be logged in to take tests
    if (!user) return false;

    // Always allow premium users (using same logic as Qiyas page)
    if (!!isPremiumUser) return true;

    // For free users, use the same robust system as Qiyas page
    return canTakeTest;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'سهل': return 'bg-green-100 text-green-800 dark:bg-green-900/30 border-green-300';
      case 'متوسط': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 border-yellow-300';
      case 'صعب': return 'bg-red-100 text-red-800 dark:bg-red-900/30 border-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 border-gray-300';
    }
  };

  const startTest = (test: VerbalTest) => {
    // Must be logged in (same as Qiyas page)
    if (!user) {
      alert('يجب عليك تسجيل الدخول أولاً للوصول إلى الاختبارات المتخصصة');
      setLocation('/login');
      return;
    }

    // Check daily limit for free users (same robust system as Qiyas page)
    if (!checkDailyLimit(test.id)) {
      alert(`لقد أكملت اختبارك اليومي المجاني. يمكن للحسابات المجانية أخذ ${MAX_DAILY_FREE_TESTS} اختبار يومياً فقط من جميع اختبارات اللفظي. قم بالترقية للوصول غير المحدود!`);
      return;
    }

    // Record the test attempt for free users (same as Qiyas page)
    recordTestTaken();

    // Store test configuration
    const testConfig = {
      testId: test.id,
      testName: test.name,
      subcategory: test.subcategory,
      questionCount: test.questionCount,
      timeLimit: test.timeLimit,
      difficulty: test.difficulty
    };

    localStorage.setItem('currentVerbalTest', JSON.stringify(testConfig));

    // Navigate to test runner
    setLocation('/verbal-test-runner');
  };

  const getTodayTestCount = (): number => {
    // Use the same robust system as Qiyas page
    return dailyTestsTaken;
  };

  // Show login prompt for non-authenticated users
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900 relative overflow-hidden flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center p-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl border border-white/20 shadow-2xl max-w-md mx-4"
        >
          <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Lock className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">
            تسجيل الدخول مطلوب
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
            للوصول إلى اختبارات اللفظي المتخصصة وفقاً لمعايير قياس الحقيقية، يجب عليك تسجيل الدخول أولاً
          </p>
          <Button
            onClick={() => setLocation('/login')}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold py-3 px-6 rounded-xl hover:shadow-lg transition-all duration-300"
          >
            تسجيل الدخول الآن
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900 relative overflow-hidden">
      {/* خلفية متحركة */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-blue-400/20 rounded-full"
            animate={{
              x: [0, Math.random() * 100, 0],
              y: [0, Math.random() * 100, 0],
              opacity: [0.2, 0.6, 0.2],
            }}
            transition={{
              duration: 8 + Math.random() * 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* العنوان الرئيسي */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-4 mb-6">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-2xl"
            >
              <BookOpen className="w-8 h-8 text-white" />
            </motion.div>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-800 dark:text-white mb-2">
                اختبارات اللفظي المتخصصة
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300">
                اختبارات دقيقة ومتخصصة لكل قسم من أقسام القدرات اللفظية
              </p>
            </div>
          </div>

          {/* إحصائيات سريعة */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {([
              { value: "50", label: "سؤال لكل اختبار", icon: Target },
              { value: "5", label: "اختبارات متخصصة", icon: Trophy },
              { value: "قياس", label: "معايير حقيقية", icon: Star },
              { value: "1", label: "اختبار مجاني يومياً", icon: Calendar }
            ] as StatItem[]).map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 * index }}
                className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-4 border border-white/20"
              >
                <stat.icon className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-800 dark:text-white">{stat.value}</div>
                <div className="text-sm text-gray-600 dark:text-gray-300">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* عرض إحصائيات الحسابات المجانية مع ميزات قياس (نفس نظام قياس) */}
        {user && !isPremiumUser && (
          <div className="max-w-lg mx-auto mb-8">
            <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-700 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <span className="font-bold text-blue-700 dark:text-blue-300">اختباراتك اليوم</span>
                      <p className="text-xs text-gray-500 dark:text-gray-400">حسب معايير قدراتك</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                      {dailyTestsTaken}/{MAX_DAILY_FREE_TESTS}
                    </div>
                    <div className="text-xs text-blue-500 dark:text-blue-400">
                      {canTakeTest ? `متبقي ${MAX_DAILY_FREE_TESTS - dailyTestsTaken}` : 'انتهت اختباراتك اليوم'}
                    </div>
                  </div>
                </div>

                {/* شريط التقدم */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                    <span>الاستخدام اليومي</span>
                    <span>{Math.round((dailyTestsTaken / MAX_DAILY_FREE_TESTS) * 100)}%</span>
                  </div>
                  <Progress value={(dailyTestsTaken / MAX_DAILY_FREE_TESTS) * 100} className="h-2" />
                </div>

                {!canTakeTest ? (
                  <div className="p-4 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-xl border border-red-200 dark:border-red-800">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center">
                        <Lock className="w-4 h-4 text-red-600 dark:text-red-400" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-red-700 dark:text-red-300">
                          وصلت للحد الأقصى اليومي
                        </p>
                        <p className="text-xs text-red-600 dark:text-red-400">
                          عد غداً أو قم بالترقية
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => setLocation("/subscription")}
                      className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      <Zap className="w-4 h-4 mr-2" />
                      ترقية للوصول غير المحدود
                    </Button>
                  </div>
                ) : (
                  <div className="p-3 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-xl border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="w-3 h-3 text-green-600 dark:text-green-400" />
                      </div>
                      <p className="text-sm font-medium text-green-700 dark:text-green-300">
                        اختبار مجاني متاح اليوم
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* قائمة الاختبارات */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {verbalTests.map((test, index) => {
            const canTakeThisTest = checkDailyLimit(test.id);
            const testHistory = userHistory.find(h => h.testId === test.id);

            return (
              <motion.div
                key={test.id}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                whileHover={{ scale: 1.02, y: -5 }}
                className="group"
              >
                <Card className={`relative overflow-hidden bg-gradient-to-br ${test.gradientFrom} ${test.gradientTo} dark:from-gray-800 dark:to-gray-700 border-2 border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 backdrop-blur-sm h-full`}>
                  {/* تأثير الإضاءة */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>

                  {/* أيقونة الصعوبة */}
                  <div className="absolute top-4 left-4">
                    <Badge className={`${getDifficultyColor(test.difficulty)} text-xs font-semibold`}>
                      {test.difficulty}
                    </Badge>
                  </div>

                  {/* حالة الاختبار مع ميزات قياس */}
                  <div className="absolute top-4 right-4">
                    {!canTakeThisTest ? (
                      <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="flex items-center gap-1 bg-gradient-to-r from-red-100 to-red-200 text-red-800 dark:from-red-900/30 dark:to-red-800/30 dark:text-red-300 px-3 py-2 rounded-full text-xs font-bold shadow-lg border border-red-300 dark:border-red-700"
                      >
                        <Lock className="w-3 h-3" />
                        <span>محظور - مكتمل</span>
                      </motion.div>
                    ) : (() => {
                        // Get latest result for this test
                        const storedResults = localStorage.getItem('verbalTestResults');
                        let latestResult = null;

                        if (storedResults) {
                          try {
                            const results = JSON.parse(storedResults);
                            const testResults = results.filter((result: any) => 
                              getTestIdFromSubcategory(result.subcategory) === test.id
                            );
                            if (testResults.length > 0) {
                              latestResult = testResults[testResults.length - 1];
                            }
                          } catch (error) {
                            console.error('Error loading test results:', error);
                          }
                        }

                        return latestResult ? (
                          <motion.div 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="flex items-center gap-1 bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 dark:from-green-900/30 dark:to-emerald-900/30 dark:text-green-300 px-3 py-2 rounded-full text-xs font-bold shadow-lg border border-green-300 dark:border-green-700"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span>مكتمل: {Math.round(latestResult.percentage)}%</span>
                          </motion.div>
                        ) : (
                          <motion.div 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="flex items-center gap-1 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 dark:from-blue-900/30 dark:to-indigo-900/30 dark:text-blue-300 px-3 py-2 rounded-full text-xs font-bold shadow-lg border border-blue-300 dark:border-blue-700"
                          >
                            <Sparkles className="w-3 h-3" />
                            <span>جديد - متاح</span>
                          </motion.div>
                        );
                      })()}
                  </div>

                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-4 mb-4">
                      <motion.div
                        className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${test.color} flex items-center justify-center text-white shadow-lg`}
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.6 }}
                      >
                        {test.icon}
                      </motion.div>
                      <div className="flex-1">
                        <CardTitle className="text-xl font-bold text-gray-800 dark:text-white mb-1">
                          {test.name}
                        </CardTitle>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {test.subcategory}
                        </p>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <p className="text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
                      {test.description}
                    </p>

                    {/* معلومات الاختبار */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Users className="w-4 h-4" />
                        <span>{test.questionCount} سؤال</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Clock className="w-4 h-4" />
                        <span>{test.timeLimit} دقيقة</span>
                      </div>
                    </div>

                    {/* إحصائيات الأداء */}
                    {(() => {
                      // Get latest result for this test
                      const storedResults = localStorage.getItem('verbalTestResults');
                      let latestResult = null;

                      if (storedResults) {
                        try {
                          const results = JSON.parse(storedResults);
                          const testResults = results.filter((result: any) => 
                            getTestIdFromSubcategory(result.subcategory) === test.id
                          );
                          if (testResults.length > 0) {
                            latestResult = testResults[testResults.length - 1];
                          }
                        } catch (error) {
                          console.error('Error loading test results:', error);
                        }
                      }

                      return latestResult ? (
                        <div className="mb-6 p-4 bg-white/50 dark:bg-gray-700/50 rounded-xl border">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">آخر نتيجة</span>
                            <span className="text-sm font-bold text-gray-800 dark:text-white">{Math.round(latestResult.percentage)}%</span>
                          </div>
                          <Progress value={latestResult.percentage} className="h-2" />
                        </div>
                      ) : null;
                    })()}

                    {/* زر بدء الاختبار مع ميزات قياس */}
                    <div className="space-y-3">
                      <Button
                        onClick={() => startTest(test)}
                        disabled={!canTakeThisTest}
                        className={`w-full py-4 text-lg font-bold transition-all duration-300 relative overflow-hidden ${
                          canTakeThisTest
                            ? `bg-gradient-to-r ${test.color} text-white hover:shadow-2xl hover:scale-105 active:scale-95 border-2 border-white/20`
                            : 'bg-gradient-to-r from-gray-400 to-gray-500 text-gray-200 cursor-not-allowed border-2 border-gray-400'
                        }`}
                      >
                        {!canTakeThisTest && (
                          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm"></div>
                        )}
                        {!canTakeThisTest ? (
                          <div className="flex items-center justify-center gap-2 relative z-10">
                            <Lock className="w-6 h-6" />
                            <span>محظور - مكتمل اليوم</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-2 relative z-10">
                            <motion.div
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{ duration: 2, repeat: Infinity }}
                            >
                              <TrendingUp className="w-6 h-6" />
                            </motion.div>
                            <span>ابدأ الاختبار الآن</span>
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                          </div>
                        )}
                      </Button>

                      {/* معلومات إضافية للاختبار */}
                      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 px-2">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>وقت الاختبار: {test.timeLimit} دقيقة</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Target className="w-3 h-3" />
                          <span>معايير قدراتك</span>
                        </div>
                      </div>
                    </div>

                    {/* رسالة للمستخدمين المجانيين مع ميزات قياس */}
                    {!isPremiumUser && !canTakeThisTest && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-3 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-5 h-5 bg-yellow-100 dark:bg-yellow-900/50 rounded-full flex items-center justify-center">
                            <Calendar className="w-3 h-3 text-yellow-600 dark:text-yellow-400" />
                          </div>
                          <p className="text-xs font-bold text-yellow-700 dark:text-yellow-300">
                            نظام قدراتك - حد يومي
                          </p>
                        </div>
                        <p className="text-xs text-yellow-600 dark:text-yellow-400 leading-relaxed">
                          حسب معايير منصة قدراتك: المستخدمون المجانيون لديهم اختبار واحد فقط يومياً من جميع اختبارات اللفظي
                        </p>
                      </motion.div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* معلومات إضافية */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-16 text-center"
        >
          <Card className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 border-2 border-blue-200 dark:border-blue-800 p-8">
            <CardContent>
              <div className="flex items-center justify-center gap-4 mb-6">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Trophy className="w-12 h-12 text-yellow-500" />
                </motion.div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                    اختبارات بمعايير قدراتك الحقيقية
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    جميع اختباراتنا مصممة وفقاً لمعايير منصة قدراتك للتميز
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Target className="w-6 h-6 text-blue-600" />
                  </div>
                  <h4 className="font-semibold text-gray-800 dark:text-white mb-2">دقة عالية</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">أسئلة مطابقة لمعايير قدراتك</p>
                </div>

                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Brain className="w-6 h-6 text-green-600" />
                  </div>
                  <h4 className="font-semibold text-gray-800 dark:text-white mb-2">تطوير مهارات</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">تحسين مستمر لقدراتك اللفظية</p>
                </div>

                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Award className="w-6 h-6 text-purple-600" />
                  </div>
                  <h4 className="font-semibold text-gray-800 dark:text-white mb-2">تقييم شامل</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">تحليل مفصل لأدائك في كل قسم</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}