import React, { useState, useMemo } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BookOpen, 
  Download, 
  ExternalLink,
  Star,
  Target,
  Crown,
  ChevronRight,
  BookMarked,
  Brain,
  ArrowLeft,
  Sparkles,
  Award,
  Clock,
  FileText,
  CheckCircle,
  Eye,
  Heart,
  Trophy,
  Zap,
  Rocket
} from 'lucide-react';
const newLogoPath = "/qodratak-logo.png";

const TahsilikStudyCenter: React.FC = () => {
  const [showBook, setShowBook] = useState(false);
  const [, setLocation] = useLocation();
  
  // Memoize particle positions to prevent layout shifts
  const particles = useMemo(() => 
    [...Array(6)].map(() => ({
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      delay: `${Math.random() * 3}s`,
      duration: `${3 + Math.random() * 4}s`
    })), 
  []);

  // Detect reduced motion preference
  const prefersReducedMotion = typeof window !== 'undefined' && 
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const containerVariants = {
    hidden: { opacity: prefersReducedMotion ? 1 : 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: prefersReducedMotion ? 0 : 0.1,
        delayChildren: prefersReducedMotion ? 0 : 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { 
      y: prefersReducedMotion ? 0 : 30, 
      opacity: prefersReducedMotion ? 1 : 0, 
      scale: prefersReducedMotion ? 1 : 0.95 
    },
    visible: {
      y: 0,
      opacity: 1,
      scale: 1,
      transition: {
        type: prefersReducedMotion ? "tween" : "spring",
        stiffness: 120,
        damping: 12,
        duration: prefersReducedMotion ? 0 : undefined
      }
    }
  };

  // الكتاب المميز الوحيد
  const featuredBook = {
    id: 'tahsili-comprehensive-guide',
    title: 'كتاب تأسيس التحصيلي',
    subtitle: 'الدليل الشامل للتحضير',
    description: 'كتاب متكامل يغطي جميع مواد التحصيلي مع أمثلة وتمارين شاملة',
    longDescription: 'هذا الكتاب يمثل دليلك الشامل للاستعداد لاختبار التحصيلي. يحتوي على شرح مفصل لجميع المواد العلمية مع أمثلة تطبيقية وتمارين متدرجة الصعوبة. تم إعداده من قبل خبراء التعليم لضمان التحضير الأمثل.',
    author: 'فريق قدراتك التعليمي',
    pages: 297,
    subjects: ['الرياضيات', 'الفيزياء', 'الكيمياء', 'الأحياء', 'علوم الأرض'],
    exercises: 150,
    difficulty: 'متدرج من المبتدئ للمتقدم',
    edition: '2025',
    downloadUrl: 'https://drive.google.com/uc?export=download&id=1FX5M1vnUJU-5n3MWgt6m6A8VMkAnBwLL',
    viewerUrl: 'https://online.pubhtml5.com/lhlxd/ecbp/',
    features: [
      { icon: Target, text: "شرح شامل لجميع المواد", color: "from-blue-500 to-cyan-500" },
      { icon: Brain, text: "أمثلة تطبيقية متنوعة", color: "from-green-600 to-amber-600" },
      { icon: Star, text: "تمارين متدرجة الصعوبة", color: "from-amber-500 to-orange-500" },
      { icon: Trophy, text: "استراتيجيات حل المسائل", color: "from-emerald-500 to-teal-500" },
      { icon: Rocket, text: "نصائح للنجاح", color: "from-red-500 to-rose-500" },
      { icon: CheckCircle, text: "تحديث مستمر", color: "from-teal-600 to-emerald-600" }
    ],
    tableOfContents: [
      { chapter: 'الفصل الأول', title: 'الرياضيات الأساسية', pages: '15-55' },
      { chapter: 'الفصل الثاني', title: 'مبادئ الفيزياء', pages: '56-105' },
      { chapter: 'الفصل الثالث', title: 'أساسيات الكيمياء', pages: '106-165' },
      { chapter: 'الفصل الرابع', title: 'علم الأحياء', pages: '166-220' },
      { chapter: 'الفصل الخامس', title: 'علوم الأرض', pages: '221-260' },
      { chapter: 'الفصل السادس', title: 'اختبارات تطبيقية', pages: '261-297' }
    ]
  };

  // دالة تحميل الكتاب
  const handleDownload = () => {
    window.open(featuredBook.downloadUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-teal-500 text-white">
      {/* Background Elements - Enhanced for mobile */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 md:w-96 md:h-96 bg-gradient-to-r from-blue-400/20 to-emerald-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-56 h-56 md:w-80 md:h-80 bg-gradient-to-r from-amber-500/20 to-orange-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        
        {/* Floating particles - Less on mobile */}
        {particles.map((particle, i) => (
          <div
            key={i}
            className="absolute w-1.5 h-1.5 md:w-2 md:h-2 bg-white/20 rounded-full animate-float"
            style={{
              left: particle.left,
              top: particle.top,
              animationDelay: particle.delay,
              animationDuration: particle.duration
            }}
          />
        ))}
      </div>

      <div className="relative z-10 container mx-auto px-3 sm:px-4 md:px-6 py-6 sm:py-8 md:py-12">
        {/* Header - Mobile Optimized */}
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="text-center mb-8 sm:mb-12"
        >
          {/* Back Button - Mobile Friendly */}
          <div className="flex items-center justify-start mb-4 sm:mb-6">
            <Button 
              variant="ghost" 
              onClick={() => setLocation('/tahsilik')}
              className="text-white/80 hover:text-white hover:bg-white/10 transition-all duration-300 -mr-2 touch-manipulation"
              data-testid="button-back-to-platform"
            >
              <ArrowLeft className="w-4 h-4 ml-2" />
              <span className="hidden sm:inline">العودة للمنصة</span>
              <span className="sm:hidden">رجوع</span>
            </Button>
          </div>
          
          {/* Logo and Title - Mobile Responsive */}
          <motion.div variants={itemVariants} className="flex flex-col sm:inline-flex sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="relative">
              <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 rounded-2xl p-1 shadow-2xl shadow-orange-500/30 transform hover:scale-110 transition-transform duration-300">
                <img 
                  src={newLogoPath} 
                  alt="شعار قدراتك" 
                  className="w-full h-full object-contain rounded-xl"
                />
              </div>
              <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-ping"></div>
            </div>
            <div className="text-center sm:text-right">
              <h1 className="text-3xl sm:text-4xl md:text-6xl font-black bg-gradient-to-r from-blue-400 via-green-600 to-amber-600 bg-clip-text text-transparent" data-testid="text-study-center-title">
                مركز الدراسة
              </h1>
              <div className="flex items-center justify-center sm:justify-start gap-2 mt-1 sm:mt-2">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 animate-pulse" />
                <span className="text-blue-200 text-sm sm:text-base md:text-lg font-medium">كتابك الشامل للتحصيلي</span>
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 animate-pulse" />
              </div>
            </div>
          </motion.div>

          <motion.p 
            variants={itemVariants}
            className="text-base sm:text-lg md:text-xl text-blue-100 max-w-3xl mx-auto leading-relaxed px-2 sm:px-0"
          >
            كل ما تحتاجه للدراسة والتحضير لاختبار التحصيلي في كتاب واحد شامل ومتكامل
          </motion.p>
        </motion.div>

        {/* Featured Book - Mobile Optimized */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="max-w-6xl mx-auto"
        >
          <motion.div variants={itemVariants}>
            <Card className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border-white/20 overflow-hidden shadow-2xl">
              <CardHeader className="relative p-4 sm:p-6 md:p-8">
                {/* Featured Badge - Mobile Responsive */}
                <div className="absolute top-3 sm:top-6 right-3 sm:right-6 z-10">
                  <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-2 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm">
                    <Crown className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2" />
                    <span className="hidden sm:inline">الكتاب المميز</span>
                    <span className="sm:hidden">مميز</span>
                  </Badge>
                </div>
                
                {/* Edition Badge - Mobile Responsive */}
                <div className="absolute top-3 sm:top-6 left-3 sm:left-6 z-10">
                  <Badge className="bg-gradient-to-r from-blue-500 to-emerald-600 text-white px-2 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm">
                    <Zap className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2" />
                    <span>{featuredBook.edition}</span>
                  </Badge>
                </div>

                <div className="flex flex-col lg:flex-row gap-6 sm:gap-8 items-start mt-10 sm:mt-8">
                  {/* Book Cover - Mobile Optimized */}
                  <div className="flex-shrink-0 w-full lg:w-auto">
                    <div className="w-40 h-52 sm:w-48 sm:h-64 md:w-56 md:h-72 bg-gradient-to-br from-blue-600 via-green-600 to-amber-600 rounded-2xl shadow-2xl flex items-center justify-center mx-auto lg:mx-0 transform hover:scale-105 active:scale-95 transition-transform duration-300 touch-manipulation">
                      <div className="text-center text-white p-4 sm:p-6">
                        <BookOpen className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4" />
                        <h3 className="text-lg sm:text-xl font-bold mb-1 sm:mb-2">{featuredBook.title}</h3>
                        <p className="text-xs sm:text-sm opacity-90">{featuredBook.subtitle}</p>
                        <div className="mt-3 sm:mt-4 text-xs opacity-75">
                          {featuredBook.pages} صفحة
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Book Details - Mobile Optimized */}
                  <div className="flex-1 space-y-4 sm:space-y-6 w-full">
                    <div>
                      <CardTitle className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2 sm:mb-3">
                        {featuredBook.title}
                      </CardTitle>
                      <CardDescription className="text-lg sm:text-xl text-blue-200 mb-3 sm:mb-4">
                        {featuredBook.subtitle}
                      </CardDescription>
                      <p className="text-blue-100 text-base sm:text-lg leading-relaxed">
                        {featuredBook.description}
                      </p>
                    </div>

                    {/* Book Info Grid - Mobile Optimized */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                      <div className="bg-white/5 rounded-xl p-3 sm:p-4 text-center border border-white/10 hover:bg-white/10 transition-colors">
                        <div className="text-xl sm:text-2xl font-bold text-white mb-1">{featuredBook.pages}</div>
                        <div className="text-blue-200 text-xs sm:text-sm">صفحة</div>
                      </div>
                      <div className="bg-white/5 rounded-xl p-3 sm:p-4 text-center border border-white/10 hover:bg-white/10 transition-colors">
                        <div className="text-xl sm:text-2xl font-bold text-white mb-1">{featuredBook.exercises}</div>
                        <div className="text-blue-200 text-xs sm:text-sm">تمرين</div>
                      </div>
                      <div className="bg-white/5 rounded-xl p-3 sm:p-4 text-center border border-white/10 hover:bg-white/10 transition-colors">
                        <div className="text-xl sm:text-2xl font-bold text-white mb-1">{featuredBook.subjects.length}</div>
                        <div className="text-blue-200 text-xs sm:text-sm">مادة</div>
                      </div>
                    </div>

                    {/* Subjects - Mobile Optimized */}
                    <div>
                      <h4 className="text-white font-semibold mb-2 sm:mb-3 text-sm sm:text-base">المواد المشمولة:</h4>
                      <div className="flex flex-wrap gap-2">
                        {featuredBook.subjects.map((subject, index) => (
                          <Badge key={index} className="bg-blue-500/20 text-blue-200 border-blue-400/30 px-2 sm:px-3 py-1 text-xs sm:text-sm hover:bg-blue-500/30 transition-colors">
                            {subject}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Action Buttons - Mobile Optimized */}
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                      <Button
                        onClick={() => setShowBook(!showBook)}
                        data-testid="button-preview-book"
                        className="flex-1 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-600 active:scale-95 text-white py-3 sm:py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 touch-manipulation text-sm sm:text-base"
                      >
                        <Eye className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
                        {showBook ? 'إخفاء المعاينة' : 'معاينة الكتاب'}
                      </Button>
                      
                      <Button
                        onClick={handleDownload}
                        data-testid="button-download-book"
                        className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-95 text-white py-3 sm:py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 touch-manipulation text-sm sm:text-base"
                      >
                        <Download className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
                        تحميل الكتاب
                        <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </motion.div>
        </motion.div>

        {/* Book Features - Mobile Optimized */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="mt-12 sm:mt-16"
        >
          <motion.h2 
            variants={itemVariants}
            className="text-2xl sm:text-3xl font-bold text-center mb-6 sm:mb-8 text-white"
          >
            مميزات الكتاب
          </motion.h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {featuredBook.features.map((feature, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="bg-white/5 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/10 hover:bg-white/10 active:bg-white/15 transition-all duration-300 hover:scale-105 active:scale-95 touch-manipulation"
              >
                <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-gradient-to-r ${feature.color} flex items-center justify-center mb-3 sm:mb-4 shadow-lg`}>
                  <feature.icon className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                </div>
                <h3 className="text-white font-semibold text-base sm:text-lg mb-1 sm:mb-2">{feature.text}</h3>
                <p className="text-blue-200 text-xs sm:text-sm">
                  ميزة تساعدك على فهم المفاهيم وتطبيقها بشكل عملي وفعال
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        

        {/* Book Viewer - Mobile Optimized */}
        <AnimatePresence>
          {showBook && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mt-12 sm:mt-16"
            >
              <Card className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border-white/20 overflow-hidden">
                <CardHeader className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-emerald-600 rounded-lg flex items-center justify-center">
                        <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      </div>
                      <CardTitle className="text-base sm:text-xl font-bold text-white">معاينة الكتاب التفاعلي</CardTitle>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowBook(false)}
                      className="text-white hover:bg-white/10 active:bg-white/20 touch-manipulation"
                      data-testid="button-close-book-viewer"
                    >
                      إغلاق
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-3 sm:p-6">
                  <div className="relative rounded-xl overflow-hidden shadow-2xl">
                    <iframe 
                      data-testid="iframe-book-viewer"
                      title="معاينة كتاب التحصيلي التفاعلي"
                      src={featuredBook.viewerUrl}
                      loading="lazy"
                      allowFullScreen
                      className="w-full h-[400px] sm:h-[600px] rounded-xl"
                    />
                    <div className="absolute top-2 right-2 sm:top-4 sm:right-4 bg-black/50 backdrop-blur-sm rounded-lg p-1.5 sm:p-2">
                      <Badge className="bg-gradient-to-r from-blue-500 to-emerald-600 text-white text-xs sm:text-sm">
                        <Heart className="w-2.5 h-2.5 sm:w-3 sm:h-3 ml-1" />
                        كتاب تفاعلي
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Call to Action - Mobile Optimized */}
        <motion.div
          variants={itemVariants}
          className="mt-12 sm:mt-16 text-center bg-gradient-to-r from-blue-600/20 to-emerald-600/20 backdrop-blur-sm rounded-2xl p-6 sm:p-8 border border-white/20"
        >
          <Award className="w-12 h-12 sm:w-16 sm:h-16 text-amber-400 mx-auto mb-3 sm:mb-4 animate-pulse" />
          <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-3 sm:mb-4">
            ابدأ رحلتك نحو التفوق اليوم
          </h3>
          <p className="text-blue-200 text-base sm:text-lg mb-5 sm:mb-6 max-w-2xl mx-auto px-2">
            حمل الكتاب الآن وابدأ الدراسة، ثم اختبر نفسك في الاختبارات التفاعلية للتأكد من استيعابك
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-2 sm:px-0">
            <Button
              onClick={() => setLocation('/tahsilik/tests')}
              className="bg-gradient-to-r from-green-600 to-amber-600 hover:from-green-600 hover:to-amber-600 active:scale-95 text-white px-6 sm:px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 touch-manipulation text-sm sm:text-base"
              data-testid="button-go-to-tests"
            >
              <Brain className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
              انتقل للاختبارات
              <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
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
        
        /* Respect user preference for reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .animate-float,
          .animate-pulse {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
};

export default TahsilikStudyCenter;