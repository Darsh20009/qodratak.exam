import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
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

export function VerbalTests() {
  const [selectedTest, setSelectedTest] = useState<VerbalTest | null>(null);
  const [userHistory, setUserHistory] = useState<UserTestHistory[]>([]);

  // Get user info to check subscription status
  const { data: user } = useQuery({
    queryKey: ['/api/user'],
  });

  const verbalTests: VerbalTest[] = [
    {
      id: 'analogy-test',
      name: 'اختبار التناظر اللفظي',
      subcategory: 'التناظر اللفظي',
      description: 'اختبار متخصص في قياس قدرتك على إيجاد العلاقات بين الكلمات والمفاهيم',
      questionCount: 50,
      timeLimit: 45,
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
      questionCount: 50,
      timeLimit: 40,
      difficulty: 'سهل',
      icon: <BookOpen className="w-6 h-6" />,
      color: 'from-green-500 to-emerald-500',
      gradientFrom: 'from-green-50',
      gradientTo: 'to-emerald-50'
    },
    {
      id: 'comprehension-test',
      name: 'اختبار الاستيعاب المقروء',
      subcategory: 'الاستيعاب المقروء',
      description: 'اختبار شامل لقياس قدرتك على فهم النصوص المكتوبة وتحليلها',
      questionCount: 50,
      timeLimit: 60,
      difficulty: 'صعب',
      icon: <Brain className="w-6 h-6" />,
      color: 'from-purple-500 to-pink-500',
      gradientFrom: 'from-purple-50',
      gradientTo: 'to-pink-50'
    },
    {
      id: 'synonyms-test',
      name: 'اختبار المترادفات والأضداد',
      subcategory: 'المترادفات والأضداد',
      description: 'اختبار متقدم لقياس ثراء المفردات ومعرفة العلاقات بين الكلمات',
      questionCount: 50,
      timeLimit: 35,
      difficulty: 'متوسط',
      icon: <Zap className="w-6 h-6" />,
      color: 'from-orange-500 to-red-500',
      gradientFrom: 'from-orange-50',
      gradientTo: 'to-red-50'
    },
    {
      id: 'errors-test',
      name: 'اختبار الأخطاء الشائعة',
      subcategory: 'الأخطاء الشائعة',
      description: 'اختبار دقيق لقياس قدرتك على تحديد وتصحيح الأخطاء اللغوية',
      questionCount: 50,
      timeLimit: 30,
      difficulty: 'صعب',
      icon: <Award className="w-6 h-6" />,
      color: 'from-indigo-500 to-blue-500',
      gradientFrom: 'from-indigo-50',
      gradientTo: 'to-blue-50'
    }
  ];

  const checkDailyLimit = (testId: string): boolean => {
    if ((user as any)?.subscription !== 'free') return true;
    
    const today = new Date().toDateString();
    return !userHistory.some(h => h.testId === testId && new Date(h.date).toDateString() === today);
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
    if (!checkDailyLimit(test.id)) {
      return;
    }
    
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
    window.location.href = '/verbal-test-runner';
  };

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
            {[
              { value: "250+", label: "سؤال لكل اختبار", icon: Target },
              { value: "5", label: "اختبارات متخصصة", icon: Trophy },
              { value: "قياس", label: "معايير حقيقية", icon: Star },
              { value: "مجاني", label: "اختبار يومي", icon: Calendar }
            ].map((stat, index) => (
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

        {/* قائمة الاختبارات */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {verbalTests.map((test, index) => {
            const canTakeTest = checkDailyLimit(test.id);
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

                  {/* حالة الاختبار */}
                  <div className="absolute top-4 right-4">
                    {!canTakeTest ? (
                      <div className="flex items-center gap-1 bg-red-100 text-red-800 dark:bg-red-900/30 px-2 py-1 rounded-full text-xs">
                        <Lock className="w-3 h-3" />
                        <span>مكتمل اليوم</span>
                      </div>
                    ) : testHistory ? (
                      <div className="flex items-center gap-1 bg-green-100 text-green-800 dark:bg-green-900/30 px-2 py-1 rounded-full text-xs">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{Math.round(testHistory.percentage)}%</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 px-2 py-1 rounded-full text-xs">
                        <Sparkles className="w-3 h-3" />
                        <span>جديد</span>
                      </div>
                    )}
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
                    {testHistory && (
                      <div className="mb-6 p-4 bg-white/50 dark:bg-gray-700/50 rounded-xl border">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">آخر نتيجة</span>
                          <span className="text-sm font-bold text-gray-800 dark:text-white">{Math.round(testHistory.percentage)}%</span>
                        </div>
                        <Progress value={testHistory.percentage} className="h-2" />
                      </div>
                    )}

                    {/* زر بدء الاختبار */}
                    <Button
                      onClick={() => startTest(test)}
                      disabled={!canTakeTest}
                      className={`w-full py-3 text-lg font-semibold transition-all duration-300 ${
                        canTakeTest
                          ? `bg-gradient-to-r ${test.color} text-white hover:shadow-lg hover:scale-105 active:scale-95`
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {!canTakeTest ? (
                        <div className="flex items-center gap-2">
                          <Lock className="w-5 h-5" />
                          <span>مكتمل لليوم</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-5 h-5" />
                          <span>ابدأ الاختبار</span>
                        </div>
                      )}
                    </Button>

                    {/* رسالة للمستخدمين المجانيين */}
                    {(user as any)?.subscription === 'free' && !canTakeTest && (
                      <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-2">
                        يمكن للمستخدمين المجانيين أخذ اختبار واحد يومياً لكل قسم
                      </p>
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
                    اختبارات بمعايير قياس الحقيقية
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    جميع اختباراتنا مصممة وفقاً لمعايير هيئة تقويم التعليم والتدريب
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Target className="w-6 h-6 text-blue-600" />
                  </div>
                  <h4 className="font-semibold text-gray-800 dark:text-white mb-2">دقة عالية</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">أسئلة مطابقة لامتحانات قياس الفعلية</p>
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