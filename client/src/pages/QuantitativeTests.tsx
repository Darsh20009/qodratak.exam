import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calculator, 
  TrendingUp, 
  BarChart3, 
  PieChart, 
  Target, 
  Clock, 
  Calendar,
  Trophy,
  Brain,
  Award,
  Play,
  Lock,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

interface QuantitativeTest {
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

export function QuantitativeTests() {
  const [dailyTestsTaken, setDailyTestsTaken] = useState(0);
  const MAX_DAILY_FREE_TESTS = 1;

  // جلب بيانات المستخدم
  const { data: user } = useQuery({
    queryKey: ['/api/user'],
  });

  // تحديد المستخدم المميز
  const isPremiumUser = user && (
    (user as any)?.subscription?.type === 'Pro' || 
    (user as any)?.subscription?.type === 'Pro Life' || 
    (user as any)?.subscription?.type === 'Pro Live' ||
    (user as any)?.subscription === 'pro' ||
    (user as any)?.subscription === 'pro_life'
  );

  // تحميل الحد اليومي للاختبارات
  useEffect(() => {
    const today = new Date().toDateString();
    const testsToday = JSON.parse(localStorage.getItem(`dailyQuantitativeTests_${today}`) || '0');
    setDailyTestsTaken(testsToday);
  }, []);

  const canTakeTest = !!isPremiumUser || dailyTestsTaken < MAX_DAILY_FREE_TESTS;

  // تسجيل اختبار جديد للحسابات المجانية
  const recordTestTaken = () => {
    if (!isPremiumUser) {
      const today = new Date().toDateString();
      const newCount = dailyTestsTaken + 1;
      localStorage.setItem(`dailyQuantitativeTests_${today}`, JSON.stringify(newCount));
      setDailyTestsTaken(newCount);
    }
  };

  // اختبارات الكمي المتاحة
  const quantitativeTests: QuantitativeTest[] = [
    {
      id: 'statistics',
      name: 'اختبار الإحصاء',
      subcategory: 'الإحصاء',
      description: 'التحليل الإحصائي والاحتمالات والبيانات',
      questionCount: 20,
      timeLimit: 10,
      difficulty: 'صعب',
      icon: <PieChart className="w-6 h-6" />,
      color: 'purple',
      gradientFrom: 'from-purple-500',
      gradientTo: 'to-indigo-500'
    },
    {
      id: 'arithmetic',
      name: 'اختبار العمليات الحسابية',
      subcategory: 'عمليات حسابية',
      description: 'العمليات الحسابية الأساسية والمتقدمة',
      questionCount: 20,
      timeLimit: 10,
      difficulty: 'متوسط',
      icon: <Calculator className="w-6 h-6" />,
      color: 'blue',
      gradientFrom: 'from-blue-500',
      gradientTo: 'to-cyan-500'
    },
    {
      id: 'patterns',
      name: 'اختبار الحركة والأنماط',
      subcategory: 'الحركة والأنماط',
      description: 'التسلسلات والأنماط الرقمية والحركة',
      questionCount: 20,
      timeLimit: 10,
      difficulty: 'متوسط',
      icon: <TrendingUp className="w-6 h-6" />,
      color: 'green',
      gradientFrom: 'from-green-500',
      gradientTo: 'to-emerald-500'
    },
    {
      id: 'proportions',
      name: 'اختبار النسبة والتناسب',
      subcategory: 'النسبة والتناسب',
      description: 'النسب والتناسبات والعلاقات الرياضية',
      questionCount: 20,
      timeLimit: 10,
      difficulty: 'متوسط',
      icon: <BarChart3 className="w-6 h-6" />,
      color: 'teal',
      gradientFrom: 'from-teal-500',
      gradientTo: 'to-cyan-500'
    },
    {
      id: 'equations',
      name: 'اختبار المعادلات',
      subcategory: 'المعادلات',
      description: 'حل المعادلات والمتباينات الرياضية',
      questionCount: 20,
      timeLimit: 10,
      difficulty: 'صعب',
      icon: <Brain className="w-6 h-6" />,
      color: 'red',
      gradientFrom: 'from-red-500',
      gradientTo: 'to-pink-500'
    },
    {
      id: 'geometry',
      name: 'اختبار الهندسة',
      subcategory: 'الهندسة',
      description: 'الأشكال الهندسية والمساحات والحجوم',
      questionCount: 20,
      timeLimit: 10,
      difficulty: 'متوسط',
      icon: <Target className="w-6 h-6" />,
      color: 'orange',
      gradientFrom: 'from-orange-500',
      gradientTo: 'to-yellow-500'
    },
    {
      id: 'percentages',
      name: 'اختبار النسبة المئوية',
      subcategory: 'النسبة المئوية',
      description: 'حساب النسب المئوية والتطبيقات العملية',
      questionCount: 20,
      timeLimit: 10,
      difficulty: 'سهل',
      icon: <Award className="w-6 h-6" />,
      color: 'amber',
      gradientFrom: 'from-amber-500',
      gradientTo: 'to-orange-500'
    },
    {
      id: 'mixed',
      name: 'اختبار أفكار متنوعة',
      subcategory: 'أفكار متنوعة',
      description: 'مجموعة متنوعة من المسائل الرياضية',
      questionCount: 20,
      timeLimit: 10,
      difficulty: 'متوسط',
      icon: <Trophy className="w-6 h-6" />,
      color: 'violet',
      gradientFrom: 'from-violet-500',
      gradientTo: 'to-purple-500'
    },
    {
      id: 'comparisons',
      name: 'اختبار المقارنات',
      subcategory: 'المقارنات',
      description: 'مقارنة الأرقام والكميات والعلاقات',
      questionCount: 20,
      timeLimit: 10,
      difficulty: 'متوسط',
      icon: <Clock className="w-6 h-6" />,
      color: 'slate',
      gradientFrom: 'from-slate-500',
      gradientTo: 'to-gray-500'
    }
  ];

  // التحقق من إمكانية أخذ اختبار معين
  const checkDailyLimit = (testId: string): boolean => {
    // Must be logged in to take tests
    if (!user) return false;

    // Always allow premium users (using same logic as Qiyas page)
    if (!!isPremiumUser) return true;

    // For free users, use the same robust system as Qiyas page
    return canTakeTest;
  };

  const canTakeThisTest = canTakeTest;

  const startTest = (test: QuantitativeTest) => {
    if (!user) {
      alert('يجب تسجيل الدخول أولاً');
      return;
    }

    if (!checkDailyLimit(test.id)) {
      alert('لقد وصلت للحد الأقصى اليومي من الاختبارات');
      return;
    }

    // تسجيل الاختبار للحسابات المجانية
    recordTestTaken();

    // بدء الاختبار
    const testData = {
      testType: 'quantitative',
      subcategory: test.subcategory,
      testName: test.name,
      questionCount: test.questionCount,
      timeLimit: test.timeLimit
    };

    localStorage.setItem('currentTest', JSON.stringify(testData));
    window.location.href = '/quantitative-test-runner';
  };

  // إحصائيات المستخدم
  const stats: StatItem[] = [
    {
      value: dailyTestsTaken.toString(),
      label: "اختباراتك اليوم",
      icon: Calendar
    },
    {
      value: MAX_DAILY_FREE_TESTS.toString(),
      label: "الحد الأقصى اليومي",
      icon: Target
    },
    {
      value: "20",
      label: "أسئلة لكل اختبار",
      icon: Brain
    },
    {
      value: "10",
      label: "دقائق لكل اختبار",
      icon: Clock
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-indigo-900/20">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* العنوان الرئيسي */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <div className="flex items-center justify-center gap-4">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
              <Calculator className="w-12 h-12 text-blue-600" />
            </motion.div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              اختبارات القدرات الكمية
            </h1>
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            اختبارات متخصصة في القدرات الكمية وفقاً لمعايير قدراتك - 20 سؤال في 10 دقائق لكل قسم
          </p>
        </motion.div>

        {/* إحصائيات سريعة */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {stats.map((stat, index) => (
            <Card key={index} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-2 border-blue-100 dark:border-blue-800/50">
              <CardContent className="p-4 text-center">
                <div className="flex justify-center mb-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/50 dark:to-purple-900/50 rounded-xl flex items-center justify-center">
                    <stat.icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {stat.value}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {stat.label}
                </div>
                {stat.label === "اختباراتك اليوم" && (
                  <div className="mt-2">
                    {!isPremiumUser && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">حسب معايير قدراتك</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* قائمة الاختبارات */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quantitativeTests.map((test, index) => {
            const canTakeThisTest = checkDailyLimit(test.id);
            
            return (
              <motion.div
                key={test.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
              >
                <Card className={`relative overflow-hidden transition-all duration-300 hover:shadow-xl ${
                  canTakeThisTest 
                    ? 'bg-white dark:bg-gray-800 border-2 border-transparent hover:border-blue-300 dark:hover:border-blue-600 hover:scale-105' 
                    : 'bg-gray-100 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 opacity-75'
                }`}>
                  <div className={`absolute inset-0 bg-gradient-to-br ${test.gradientFrom} ${test.gradientTo} opacity-5`} />
                  
                  <CardHeader className="relative">
                    <div className="flex items-center justify-between">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${test.gradientFrom} ${test.gradientTo} flex items-center justify-center text-white shadow-lg`}>
                        {test.icon}
                      </div>
                      <Badge variant={test.difficulty === 'سهل' ? 'default' : test.difficulty === 'متوسط' ? 'secondary' : 'destructive'}>
                        {test.difficulty}
                      </Badge>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
                        {test.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {test.description}
                      </p>
                    </div>
                  </CardHeader>

                  <CardContent className="relative space-y-4">
                    <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <Brain className="w-3 h-3" />
                        <span>{test.questionCount} سؤال</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>وقت الاختبار: {test.timeLimit} دقائق</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Target className="w-3 h-3" />
                        <span>معايير قدراتك</span>
                      </div>
                    </div>

                    <Button 
                      onClick={() => startTest(test)}
                      disabled={!canTakeThisTest}
                      className={`w-full ${
                        canTakeThisTest 
                          ? `bg-gradient-to-r ${test.gradientFrom} ${test.gradientTo} hover:opacity-90 text-white shadow-lg hover:shadow-xl transition-all duration-300`
                          : 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed'
                      }`}
                    >
                      {canTakeThisTest ? (
                        <>
                          <Play className="w-4 h-4 mr-2" />
                          ابدأ الاختبار
                        </>
                      ) : (
                        <>
                          <Lock className="w-4 h-4 mr-2" />
                          {!user ? 'يجب تسجيل الدخول' : 'وصلت للحد اليومي'}
                        </>
                      )}
                    </Button>

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
                          حسب معايير منصة قدراتك: المستخدمون المجانيون لديهم اختبار واحد فقط يومياً من جميع اختبارات الكمي
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
                    اختبارات كمية بمعايير قدراتك الحقيقية
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    جميع اختباراتنا مصممة وفقاً لمعايير منصة قدراتك للتميز الكمي
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Target className="w-6 h-6 text-blue-600" />
                  </div>
                  <h4 className="font-semibold text-gray-800 dark:text-white mb-2">دقة عالية</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">أسئلة مطابقة لمعايير قدراتك الكمية</p>
                </div>

                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Brain className="w-6 h-6 text-green-600" />
                  </div>
                  <h4 className="font-semibold text-gray-800 dark:text-white mb-2">تطوير مهارات</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">تحسين مستمر لقدراتك الرياضية</p>
                </div>

                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Award className="w-6 h-6 text-purple-600" />
                  </div>
                  <h4 className="font-semibold text-gray-800 dark:text-white mb-2">تقييم شامل</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">تحليل مفصل لأدائك في كل قسم كمي</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}