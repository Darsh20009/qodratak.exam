import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Brain,
  ArrowLeft,
  Play,
  Clock,
  Star,
  Target,
  Award,
  Trophy,
  CheckCircle,
  Sparkles,
  Rocket,
  Crown,
  FileText,
  RefreshCw,
  PlayCircle,
  Zap,
  BarChart3,
  TrendingUp
} from 'lucide-react';
const newLogoPath = "/qodratak-logo-transparent.png";

interface TestResult {
  examId: string;
  score: number;
  date: string;
  questionsCorrect: number;
  totalQuestions: number;
  timeSpent: string;
}

const TahsilikTestCenter: React.FC = () => {
  const [, setLocation] = useLocation();
  const [testResults, setTestResults] = useState<TestResult[]>([]);

  useEffect(() => {
    // تحميل نتائج الاختبارات السابقة من localStorage
    const savedResults = localStorage.getItem('tahsili_test_results');
    if (savedResults) {
      setTestResults(JSON.parse(savedResults));
    }
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0, scale: 0.95 },
    visible: {
      y: 0,
      opacity: 1,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 120,
        damping: 12
      }
    }
  };

  // الاختبارات الأربعة المحددة بناء على ملفات الاختبارات
  const availableTests = [
    {
      id: 'exam-10',
      title: 'اختبار تمهيدي سريع',
      description: 'اختبار تحضيري مثالي للبدء - 10 أسئلة منتقاة بعناية',
      difficulty: 'مبتدئ',
      questions: 10,
      timeLimit: '15 دقيقة',
      color: 'from-green-500 to-emerald-500',
      icon: PlayCircle,
      estimatedScore: '85+',
      features: [
        'مدخل مثالي للتحصيلي',
        'أسئلة أساسية مهمة', 
        'تقييم سريع للمستوى',
        'بناء الثقة'
      ],
      subjects: ['رياضيات', 'فيزياء', 'كيمياء', 'أحياء'],
      targetAudience: 'الطلاب المبتدئين',
      preparationTime: '30 دقيقة'
    },
    {
      id: 'exam-50', 
      title: 'اختبار التقييم المتوسط',
      description: 'اختبار تقييمي شامل لقياس مستواك الحقيقي - 50 سؤال متنوع',
      difficulty: 'متوسط',
      questions: 50,
      timeLimit: '60 دقيقة',
      color: 'from-blue-500 to-teal-500',
      icon: Brain,
      estimatedScore: '75+',
      features: [
        'تغطية شاملة للمنهج',
        'أسئلة متدرجة الصعوبة',
        'تقييم دقيق للمهارات',
        'تحليل نقاط القوة والضعف'
      ],
      subjects: ['رياضيات', 'فيزياء', 'كيمياء', 'أحياء', 'علوم الأرض'],
      targetAudience: 'الطلاب المتوسطين',
      preparationTime: '60 دقيقة'
    },
    {
      id: 'exam-100',
      title: 'اختبار المحاكاة الشامل',
      description: 'محاكاة كاملة لاختبار التحصيلي الرسمي - 100 سؤال شامل',
      difficulty: 'متقدم',
      questions: 100,
      timeLimit: '120 دقيقة',
      color: 'from-green-600 to-amber-600',
      icon: Award,
      estimatedScore: '70+',
      features: [
        'محاكاة حقيقية للاختبار',
        'جميع المواد مشمولة',
        'تدريب على إدارة الوقت',
        'استعداد كامل للاختبار'
      ],
      subjects: ['رياضيات', 'فيزياء', 'كيمياء', 'أحياء', 'علوم الأرض'],
      targetAudience: 'الطلاب المتقدمين',
      preparationTime: '90 دقيقة'
    },
    {
      id: 'exam-110',
      title: 'تحدي الخبراء الأقصى',
      description: 'التحدي الأصعب والأشمل - 110 سؤال للطلاب المتميزين',
      difficulty: 'خبير',
      questions: 110,
      timeLimit: '150 دقيقة',
      color: 'from-red-500 to-rose-500',
      icon: Crown,
      estimatedScore: '65+',
      features: [
        'أعلى مستوى صعوبة',
        'أسئلة تحليلية معقدة',
        'اختبار الحد الأقصى',
        'للطلاب المتميزين فقط'
      ],
      subjects: ['رياضيات متقدمة', 'فيزياء نظرية', 'كيمياء تحليلية', 'أحياء جزيئية', 'علوم الأرض'],
      targetAudience: 'الطلاب المتميزين',
      preparationTime: '120 دقيقة'
    }
  ];

  // دالة للحصول على النتيجة السابقة للاختبار
  const getPreviousResult = (examId: string): TestResult | null => {
    return testResults.find(result => result.examId === examId) || null;
  };

  // دالة لبدء/إعادة الاختبار
  const handleStartTest = (examId: string) => {
    setLocation(`/tahsili/exams?exam=${examId}`);
  };

  // دالة للحصول على لون مستوى الصعوبة
  const getDifficultyColor = (difficulty: string) => {
    switch(difficulty) {
      case 'مبتدئ': return 'bg-green-500/20 text-green-200 border-green-400/30';
      case 'متوسط': return 'bg-yellow-500/20 text-yellow-200 border-yellow-400/30';
      case 'متقدم': return 'bg-orange-500/20 text-orange-200 border-orange-400/30';
      case 'خبير': return 'bg-red-500/20 text-red-200 border-red-400/30';
      default: return 'bg-gray-500/20 text-gray-200 border-gray-400/30';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-teal-500 text-white">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-400/20 to-emerald-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-r from-amber-500/20 to-orange-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        
        {/* Floating particles */}
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-white/20 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 4}s`
            }}
          />
        ))}
      </div>

      <div className="relative z-10 container mx-auto px-4 md:px-6 py-8 md:py-12">
        {/* Header */}
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="text-center mb-12"
        >
          {/* Back Button */}
          <div className="flex items-center justify-start mb-6">
            <Button 
              variant="ghost" 
              onClick={() => setLocation('/tahsilik')}
              className="text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              data-testid="button-back-to-platform"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              العودة للمنصة
            </Button>
          </div>
          
          <motion.div variants={itemVariants} className="inline-flex items-center gap-4 mb-6">
            <div className="relative">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 rounded-2xl p-1 shadow-2xl shadow-orange-500/30">
                <img 
                  src={newLogoPath} 
                  alt="شعار قدراتك" 
                  className="w-full h-full object-contain rounded-xl"
                />
              </div>
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-ping"></div>
            </div>
            <div className="text-right">
              <h1 className="text-4xl md:text-6xl font-black bg-gradient-to-r from-green-600 via-pink-400 to-red-400 bg-clip-text text-transparent" data-testid="text-test-center-title">
                مركز الاختبارات
              </h1>
              <div className="flex items-center gap-2 mt-2">
                <Sparkles className="w-5 h-5 text-yellow-400 animate-pulse" />
                <span className="text-green-700 text-base md:text-lg font-medium">4 اختبارات متدرجة لإتقان التحصيلي</span>
                <Sparkles className="w-5 h-5 text-yellow-400 animate-pulse" />
              </div>
            </div>
          </motion.div>

          <motion.p 
            variants={itemVariants}
            className="text-lg md:text-xl text-blue-100 max-w-3xl mx-auto leading-relaxed"
          >
            اختبارات تفاعلية متدرجة من المبتدئ للخبير - اختبر نفسك وتابع تقدمك
          </motion.p>
        </motion.div>

        {/* Tests Grid */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16"
        >
          {availableTests.map((test, index) => {
            const previousResult = getPreviousResult(test.id);
            
            return (
              <motion.div
                key={test.id}
                variants={itemVariants}
                className="h-full"
              >
                <Card className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border-white/20 overflow-hidden shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-[1.02] h-full">
                  <CardHeader className="relative p-6">
                    {/* Difficulty Badge */}
                    <div className="absolute top-4 right-4">
                      <Badge className={`border ${getDifficultyColor(test.difficulty)}`}>
                        {test.difficulty}
                      </Badge>
                    </div>
                    
                    {/* Estimated Score Badge */}
                    <div className="absolute top-4 left-4">
                      <Badge className="bg-gradient-to-r from-blue-500 to-emerald-600 text-white">
                        <Target className="w-3 h-3 mr-1" />
                        {test.estimatedScore}
                      </Badge>
                    </div>

                    <div className="flex items-start gap-4 mt-8">
                      {/* Test Icon */}
                      <div className={`w-16 h-16 rounded-xl bg-gradient-to-r ${test.color} flex items-center justify-center shadow-lg hover:scale-110 transition-transform`}>
                        <test.icon className="w-8 h-8 text-white" />
                      </div>
                      
                      {/* Test Info */}
                      <div className="flex-1">
                        <CardTitle className="text-xl md:text-2xl font-bold text-white mb-2">
                          {test.title}
                        </CardTitle>
                        <CardDescription className="text-blue-200 text-base leading-relaxed">
                          {test.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-6 space-y-6">
                    {/* Test Stats */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-white/5 rounded-xl p-3 text-center border border-white/10">
                        <div className="text-lg font-bold text-white mb-1">{test.questions}</div>
                        <div className="text-blue-200 text-xs">سؤال</div>
                      </div>
                      <div className="bg-white/5 rounded-xl p-3 text-center border border-white/10">
                        <div className="text-lg font-bold text-white mb-1">{test.timeLimit}</div>
                        <div className="text-blue-200 text-xs">مدة</div>
                      </div>
                      <div className="bg-white/5 rounded-xl p-3 text-center border border-white/10">
                        <div className="text-lg font-bold text-white mb-1">{test.subjects.length}</div>
                        <div className="text-blue-200 text-xs">مادة</div>
                      </div>
                    </div>

                    {/* Test Features */}
                    <div>
                      <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                        <Star className="w-4 h-4 text-yellow-400" />
                        مميزات الاختبار:
                      </h4>
                      <div className="grid grid-cols-1 gap-2">
                        {test.features.slice(0, 2).map((feature, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-sm text-blue-200">
                            <CheckCircle className="w-3 h-3 text-green-400 flex-shrink-0" />
                            {feature}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Subjects */}
                    <div>
                      <h4 className="text-white font-semibold mb-3">المواد المشمولة:</h4>
                      <div className="flex flex-wrap gap-2">
                        {test.subjects.map((subject, idx) => (
                          <Badge key={idx} className="bg-blue-500/20 text-blue-200 border-blue-400/30 text-xs">
                            {subject}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Previous Result */}
                    {previousResult && (
                      <div className="bg-gradient-to-r from-emerald-600/20 to-teal-600/20 rounded-xl p-4 border border-emerald-400/30">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-emerald-200 font-semibold flex items-center gap-2">
                            <Trophy className="w-4 h-4" />
                            النتيجة السابقة:
                          </span>
                          <Badge className="bg-emerald-500/20 text-emerald-200 border-emerald-400/30">
                            {previousResult.score}%
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-emerald-300">
                            {previousResult.questionsCorrect}/{previousResult.totalQuestions} إجابة صحيحة
                          </span>
                          <span className="text-emerald-300">
                            {new Date(previousResult.date).toLocaleDateString('ar-SA')}
                          </span>
                        </div>
                        <div className="text-xs text-emerald-400 mt-1">
                          وقت الإنجاز: {previousResult.timeSpent}
                        </div>
                      </div>
                    )}

                    {/* Additional Info */}
                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-blue-200">الجمهور المستهدف:</span>
                          <div className="text-white font-medium">{test.targetAudience}</div>
                        </div>
                        <div>
                          <span className="text-blue-200">وقت التحضير:</span>
                          <div className="text-white font-medium">{test.preparationTime}</div>
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <Button
                      onClick={() => handleStartTest(test.id)}
                      data-testid={`button-start-test-${test.id}`}
                      className={`w-full bg-gradient-to-r ${test.color} hover:scale-105 text-white py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300`}
                    >
                      {previousResult ? (
                        <>
                          <RefreshCw className="w-5 h-5 mr-2" />
                          إعادة الاختبار
                        </>
                      ) : (
                        <>
                          <PlayCircle className="w-5 h-5 mr-2" />
                          ابدأ الاختبار
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Statistics Section */}
        <motion.div
          variants={itemVariants}
          className="bg-gradient-to-r from-green-600/20 to-amber-600/20 backdrop-blur-sm rounded-2xl p-8 border border-white/20"
        >
          <div className="text-center mb-8">
            <BarChart3 className="w-12 h-12 text-green-700 mx-auto mb-4" />
            <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">
              إحصائياتك الشاملة
            </h3>
            <p className="text-green-700">تتبع تقدمك وتطور أدائك عبر جميع الاختبارات</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-2">{availableTests.length}</div>
              <div className="text-green-700 text-sm">اختبار متاح</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-2">{testResults.length}</div>
              <div className="text-green-700 text-sm">اختبار مكتمل</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-2">
                {testResults.length > 0 ? Math.round(testResults.reduce((acc, curr) => acc + curr.score, 0) / testResults.length) : 0}%
              </div>
              <div className="text-green-700 text-sm">متوسط النتائج</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-2">270+</div>
              <div className="text-green-700 text-sm">سؤال شامل</div>
            </div>
          </div>
        </motion.div>

        {/* Call to Action */}
        <motion.div
          variants={itemVariants}
          className="mt-16 text-center bg-gradient-to-r from-blue-600/20 to-emerald-600/20 backdrop-blur-sm rounded-2xl p-8 border border-white/20"
        >
          <Rocket className="w-16 h-16 text-blue-400 mx-auto mb-4" />
          <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
            ابدأ رحلة التفوق اليوم
          </h3>
          <p className="text-blue-200 text-lg mb-6 max-w-2xl mx-auto">
            اختر الاختبار المناسب لمستواك وابدأ التحدي. كل اختبار يأخذك خطوة أقرب للتفوق في التحصيلي
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => setLocation('/tahsilik/study')}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
              data-testid="button-back-to-study"
            >
              <Star className="w-5 h-5 mr-2" />
              عودة للدراسة
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Custom CSS for animations */}
      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default TahsilikTestCenter;