import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BookOpen, 
  Download, 
  Clock, 
  Trophy,
  Star,
  Sparkles,
  Target,
  Rocket,
  Crown,
  ChevronRight,
  BookMarked,
  Award,
  Brain,
  Activity,
  BarChart3,
  CheckCircle,
  PlayCircle,
  RefreshCw,
  FileText,
  Zap,
  Heart,
  ExternalLink
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

const TahsiliDashboard: React.FC = () => {
  const [showBook, setShowBook] = useState(false);
  const [, setLocation] = useLocation();
  const [testResults, setTestResults] = useState<TestResult[]>([]);

  useEffect(() => {
    // تحميل نتائج الاختبارات السابقة من localStorage
    const savedResults = localStorage.getItem('tahsili_test_results');
    if (savedResults) {
      setTestResults(JSON.parse(savedResults));
    }
  }, []);

  // Animation variants
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

  // البيانات المبسطة للكتاب الواحد المميز
  const featuredBook = {
    id: 'tahsili-comprehensive-guide',
    title: 'كتاب تأسيس التحصيلي',
    subtitle: 'الدليل الشامل للتحضير',
    description: 'كتاب متكامل يغطي جميع مواد التحصيلي مع أمثلة وتمارين شاملة',
    author: 'فريق قدراتك التعليمي',
    pages: 520,
    cover: 'from-blue-600 to-emerald-600',
    viewerUrl: 'https://online.pubhtml5.com/lhlxd/ecbp/',
    downloadUrl: 'https://drive.google.com/uc?export=download&id=1FX5M1vnUJU-5n3MWgt6m6A8VMkAnBwLL',
    features: [
      { icon: Target, text: "تأسيس شامل لجميع المواد", color: "from-blue-500 to-cyan-500" },
      { icon: Brain, text: "أسئلة تطبيقية متنوعة", color: "from-green-600 to-amber-600" },
      { icon: Star, text: "شرح مفصل ومبسط", color: "from-amber-500 to-orange-500" },
      { icon: Trophy, text: "استراتيجيات النجاح", color: "from-emerald-500 to-teal-500" }
    ]
  };

  // الاختبارات الأربعة المحددة
  const availableTests = [
    {
      id: 'exam-10',
      title: 'اختبار تمهيدي',
      description: 'اختبار تحضيري سريع - 10 أسئلة',
      difficulty: 'مبتدئ',
      questions: 10,
      timeLimit: '15 دقيقة',
      color: 'from-green-500 to-emerald-500',
      icon: PlayCircle,
      estimatedScore: '85+'
    },
    {
      id: 'exam-50', 
      title: 'اختبار متوسط',
      description: 'اختبار تقييمي شامل - 50 سؤال',
      difficulty: 'متوسط',
      questions: 50,
      timeLimit: '60 دقيقة',
      color: 'from-blue-500 to-teal-500',
      icon: Brain,
      estimatedScore: '75+'
    },
    {
      id: 'exam-100',
      title: 'اختبار شامل',
      description: 'محاكاة كاملة للاختبار - 100 سؤال',
      difficulty: 'متقدم',
      questions: 100,
      timeLimit: '120 دقيقة',
      color: 'from-green-600 to-amber-600',
      icon: Award,
      estimatedScore: '70+'
    },
    {
      id: 'exam-110',
      title: 'اختبار الخبراء',
      description: 'التحدي الأقصى - 110 سؤال',
      difficulty: 'خبير',
      questions: 110,
      timeLimit: '150 دقيقة',
      color: 'from-red-500 to-rose-500',
      icon: Crown,
      estimatedScore: '65+'
    }
  ];

  // دالة للحصول على النتيجة السابقة للاختبار
  const getPreviousResult = (examId: string): TestResult | null => {
    return testResults.find(result => result.examId === examId) || null;
  };

  // دالة لتحميل الكتاب
  const handleDownloadBook = () => {
    window.open(featuredBook.downloadUrl, '_blank', 'noopener,noreferrer');
  };

  // دالة لبدء/إعادة الاختبار
  const handleStartTest = (examId: string) => {
    setLocation(`/tahsili/exams?exam=${examId}`);
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
        {/* Hero Section */}
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="text-center mb-12"
        >
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
              <h1 data-testid="text-dashboard-title" className="text-4xl md:text-6xl font-black bg-gradient-to-r from-amber-400 via-orange-400 to-red-400 bg-clip-text text-transparent">
                لوحة التحصيلي
              </h1>
              <div className="flex items-center gap-2 mt-2">
                <Sparkles className="w-5 h-5 text-yellow-400 animate-pulse" />
                <span className="text-orange-200 text-base md:text-lg font-medium">رحلتك نحو التفوق تبدأ هنا</span>
                <Sparkles className="w-5 h-5 text-yellow-400 animate-pulse" />
              </div>
            </div>
          </motion.div>

          <motion.p 
            variants={itemVariants}
            className="text-lg md:text-xl text-blue-100 max-w-3xl mx-auto leading-relaxed"
          >
            كل ما تحتاجه للاستعداد لاختبار التحصيلي في مكان واحد - كتاب شامل واختبارات تفاعلية
          </motion.p>
        </motion.div>

        {/* Main Content Grid */}
        <motion.div 
          variants={containerVariants}
          className="grid lg:grid-cols-2 gap-8 mb-16"
        >
          {/* Featured Book Section */}
          <motion.div variants={itemVariants}>
            <Card className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border-white/20 overflow-hidden group hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-500 h-full">
              <CardHeader className="relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-amber-400/20 to-transparent rounded-bl-full"></div>
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                      <BookMarked className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-xl md:text-2xl font-bold text-white">{featuredBook.title}</CardTitle>
                      <CardDescription className="text-blue-200 text-base">{featuredBook.subtitle}</CardDescription>
                      <p className="text-blue-300 text-sm mt-1">{featuredBook.description}</p>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Book Features */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {featuredBook.features.map((feature, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className={`p-4 rounded-xl bg-gradient-to-r ${feature.color} bg-opacity-20 border border-white/10 hover:scale-105 transition-transform`}
                    >
                      <feature.icon className="w-6 h-6 text-white mb-2" />
                      <p className="text-sm text-white font-medium">{feature.text}</p>
                    </motion.div>
                  ))}
                </div>

                {/* Book Info */}
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <div className="flex flex-wrap items-center gap-4 text-sm text-blue-200">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      <span>{featuredBook.pages} صفحة</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Brain className="w-4 h-4" />
                      <span>جميع المواد</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4" />
                      <span>محدث 2025</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <Button
                    data-testid="button-toggle-book-viewer"
                    onClick={() => setShowBook(!showBook)}
                    className="w-full bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-600 text-white py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <BookOpen className="w-5 h-5 mr-2" />
                    {showBook ? 'إخفاء المعاينة' : 'معاينة الكتاب'}
                  </Button>

                  <Button
                    data-testid="button-download-book"
                    onClick={handleDownloadBook}
                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <Download className="w-5 h-5 mr-2" />
                    تحميل الكتاب
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Tests Section */}
          <motion.div variants={itemVariants}>
            <Card className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border-white/20 h-full">
              <CardHeader className="relative">
                <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-green-600/20 to-transparent rounded-br-full"></div>
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-600 to-amber-600 rounded-xl flex items-center justify-center shadow-lg">
                      <Award className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl md:text-2xl font-bold text-white">الاختبارات التفاعلية</CardTitle>
                      <CardDescription className="text-green-700">4 اختبارات متدرجة الصعوبة</CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {availableTests.map((test, index) => {
                  const previousResult = getPreviousResult(test.id);
                  
                  return (
                    <motion.div
                      key={test.id}
                      data-testid={`card-test-${test.id}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="group p-4 rounded-xl border border-white/10 hover:border-green-400/30 bg-gradient-to-r from-white/5 to-transparent hover:bg-gradient-to-r hover:from-green-600/10 hover:to-amber-600/10 transition-all duration-300"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${test.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                            <test.icon className="w-6 h-6 text-white" />
                          </div>
                          
                          <div className="flex-1">
                            <h4 className="text-white font-semibold text-lg mb-1 group-hover:text-green-700 transition-colors">
                              {test.title}
                            </h4>
                            <p className="text-gray-300 text-sm mb-3">{test.description}</p>
                            
                            <div className="flex flex-wrap gap-2">
                              <Badge className="bg-blue-500/20 text-blue-200 border-blue-400/30">
                                <Clock className="w-3 h-3 mr-1" />
                                {test.timeLimit}
                              </Badge>
                              <Badge className="bg-emerald-500/20 text-emerald-200 border-emerald-400/30">
                                <FileText className="w-3 h-3 mr-1" />
                                {test.questions} سؤال
                              </Badge>
                              <Badge className={`border ${
                                test.difficulty === 'مبتدئ' ? 'bg-green-500/20 text-green-200 border-green-400/30' :
                                test.difficulty === 'متوسط' ? 'bg-yellow-500/20 text-yellow-200 border-yellow-400/30' :
                                test.difficulty === 'متقدم' ? 'bg-orange-500/20 text-orange-200 border-orange-400/30' :
                                'bg-red-500/20 text-red-200 border-red-400/30'
                              }`}>
                                {test.difficulty}
                              </Badge>
                              {test.estimatedScore && (
                                <Badge className="bg-green-100/20 text-green-700 border-green-400/30">
                                  <Target className="w-3 h-3 mr-1" />
                                  {test.estimatedScore}
                                </Badge>
                              )}
                            </div>

                            {/* Previous Result */}
                            {previousResult && (
                              <div className="mt-3 p-3 rounded-lg bg-white/5 border border-white/10">
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-blue-200">النتيجة السابقة:</span>
                                  <div className="flex items-center gap-2">
                                    <Badge className="bg-emerald-500/20 text-emerald-200">
                                      {previousResult.score}%
                                    </Badge>
                                    <span className="text-gray-300">
                                      {previousResult.questionsCorrect}/{previousResult.totalQuestions}
                                    </span>
                                  </div>
                                </div>
                                <div className="text-xs text-gray-400 mt-1">
                                  {new Date(previousResult.date).toLocaleDateString('ar-SA')} • {previousResult.timeSpent}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-2">
                          <Button
                            onClick={() => handleStartTest(test.id)}
                            data-testid={`button-start-test-${test.id}`}
                            className={`bg-gradient-to-r ${test.color} hover:scale-105 text-white px-6 py-2 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 min-w-[100px]`}
                          >
                            {previousResult ? (
                              <>
                                <RefreshCw className="w-4 h-4 mr-1" />
                                إعادة الاختبار
                              </>
                            ) : (
                              <>
                                <PlayCircle className="w-4 h-4 mr-1" />
                                ابدأ الآن
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Quick Access: Question Bank */}
        <motion.div variants={itemVariants} className="mb-8">
          <div
            onClick={() => setLocation('/tahsili-question-bank')}
            className="group cursor-pointer bg-gradient-to-l from-teal-600/20 to-emerald-600/20 border border-teal-400/30 rounded-2xl p-5 flex items-center gap-4 hover:from-teal-600/30 hover:to-emerald-600/30 hover:border-teal-400/50 transition-all duration-300"
            data-testid="btn-tahsili-question-bank"
          >
            <div className="w-14 h-14 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform flex-shrink-0">
              <BookOpen className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-white font-bold text-lg">بنك أسئلة التحصيلي</h3>
              <p className="text-teal-200 text-sm mt-0.5">استعرض جميع أسئلة التحصيلي مصنّفة حسب المادة والصعوبة</p>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-xs bg-teal-500/20 text-teal-200 px-2 py-0.5 rounded-full border border-teal-400/30">رياضيات</span>
                <span className="text-xs bg-emerald-500/20 text-emerald-200 px-2 py-0.5 rounded-full border border-emerald-400/30">أحياء</span>
                <span className="text-xs bg-blue-500/20 text-blue-200 px-2 py-0.5 rounded-full border border-blue-400/30">كيمياء</span>
                <span className="text-xs bg-green-100/20 text-green-700 px-2 py-0.5 rounded-full border border-green-400/30">فيزياء</span>
              </div>
            </div>
            <ChevronRight className="w-6 h-6 text-teal-300 group-hover:translate-x-1 transition-transform flex-shrink-0" />
          </div>
        </motion.div>

        {/* Book Viewer */}
        <AnimatePresence>
          {showBook && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-16"
            >
              <Card className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border-white/20 overflow-hidden">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-emerald-600 rounded-lg flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-white" />
                      </div>
                      <CardTitle className="text-xl font-bold text-white">معاينة الكتاب</CardTitle>
                    </div>
                    <Button
                      data-testid="button-close-book-viewer"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowBook(false)}
                      className="text-white hover:bg-white/10"
                    >
                      إغلاق
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="relative rounded-xl overflow-hidden shadow-2xl">
                    <iframe 
                      data-testid="iframe-book-viewer"
                      style={{width:'100%', height:'600px'}} 
                      src={featuredBook.viewerUrl}
                      seamless 
                      scrolling='no' 
                      frameBorder='0' 
                      allowTransparency 
                      allowFullScreen
                      className="rounded-xl"
                    />
                    <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm rounded-lg p-2">
                      <Badge className="bg-gradient-to-r from-blue-500 to-emerald-600 text-white">
                        <Heart className="w-3 h-3 mr-1" />
                        كتاب تفاعلي
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Statistics Footer */}
        <motion.div
          variants={itemVariants}
          className="text-center bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-white mb-1">1</div>
              <div className="text-blue-200 text-sm">كتاب مميز</div>
            </div>
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-white mb-1">4</div>
              <div className="text-blue-200 text-sm">اختبارات تفاعلية</div>
            </div>
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-white mb-1">{featuredBook.pages}</div>
              <div className="text-blue-200 text-sm">صفحة شاملة</div>
            </div>
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-white mb-1">∞</div>
              <div className="text-blue-200 text-sm">إمكانيات لا محدودة</div>
            </div>
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

export default TahsiliDashboard;