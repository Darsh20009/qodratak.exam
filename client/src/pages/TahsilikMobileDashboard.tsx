import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BookOpen, 
  GraduationCap, 
  Brain,
  Database,
  Play,
  ArrowRight,
  Sparkles,
  Trophy,
  Target,
  Zap,
  Clock,
  CheckCircle,
  Star,
  School,
  Library,
  FlaskConical,
  Calculator,
  Atom,
  Dna,
  Globe,
  BookMarked,
  PenTool,
  Award,
  Lightbulb,
  Rocket,
  Crown
} from 'lucide-react';
const newLogoPath = "/logo-512x512.png";

const TahsilikMobileDashboard: React.FC = () => {
  const [, setLocation] = useLocation();
  const [selectedCard, setSelectedCard] = useState<string | null>(null);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1
      }
    }
  };

  const cardVariants = {
    hidden: { y: 30, opacity: 0, scale: 0.9 },
    visible: {
      y: 0,
      opacity: 1,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    }
  };

  const floatingVariants = {
    animate: {
      y: [-10, 10],
      transition: {
        duration: 2,
        repeat: Infinity,
        repeatType: "reverse" as const,
        ease: "easeInOut"
      }
    }
  };

  // Main sections for the mobile dashboard
  const mainSections = [
    {
      id: 'foundation',
      title: 'التأسيس والبداية',
      subtitle: 'ابدأ رحلتك من الأساسيات',
      description: 'مواد تأسيسية شاملة لكل المواد العلمية',
      icon: School,
      gradient: 'from-emerald-500 via-teal-500 to-cyan-500',
      bgGradient: 'from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20',
      path: '/tahsilik/study',
      stats: { books: '12 كتاب', lessons: '150 درس' },
      features: ['مفاهيم أساسية', 'شرح مبسط', 'أمثلة تطبيقية']
    },
    {
      id: 'courses',
      title: 'الدورات التدريبية',
      subtitle: 'تعلم بطريقة منهجية ومنظمة',
      description: 'دورات متخصصة ومسارات تعليمية متكاملة',
      icon: GraduationCap,
      gradient: 'from-green-600 via-green-500 to-teal-500',
      bgGradient: 'from-green-600 to-teal-500 dark:from-green-600/20 dark:to-teal-500/20',
      path: '/courses',
      stats: { courses: '25 دورة', hours: '200+ ساعة' },
      features: ['مسارات منهجية', 'خبراء متخصصون', 'شهادات معتمدة']
    },
    {
      id: 'tests',
      title: 'الاختبارات التفاعلية',
      subtitle: 'اختبر مستواك وطور مهاراتك',
      description: 'مجموعة شاملة من الاختبارات المتنوعة',
      icon: Brain,
      gradient: 'from-rose-500 via-pink-500 to-fuchsia-500',
      bgGradient: 'from-rose-50 to-amber-600 dark:from-rose-900/20 dark:to-amber-600/20',
      path: '/tahsilik/tests-hub',
      stats: { tests: '50+ اختبار', questions: '5000+ سؤال' },
      features: ['اختبارات مخصصة', '110 سؤال شامل', 'اختبارات موضوعية']
    },
    {
      id: 'question-bank',
      title: 'مكتبة الأسئلة',
      subtitle: 'بنك شامل لجميع الأسئلة',
      description: 'مكتبة ضخمة من الأسئلة المصنفة والمنظمة',
      icon: Database,
      gradient: 'from-amber-500 via-orange-500 to-red-500',
      bgGradient: 'from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-red-900/20',
      path: '/tahsilik/question-library',
      stats: { questions: '8000+ سؤال', subjects: '5 مواد' },
      features: ['أسئلة محدّثة', 'تصنيف دقيق', 'حلول مفصلة']
    }
  ];

  // Quick access buttons for test types
  const quickTests = [
    {
      type: 'custom',
      title: 'اختبار مخصص',
      description: 'أنشئ اختباراً حسب اختيارك',
      icon: PenTool,
      color: 'from-blue-500 to-cyan-500',
      action: () => setLocation('/tahsilik/tests-hub')
    },
    {
      type: 'comprehensive',
      title: '110 سؤال شامل',
      description: 'اختبار كامل لجميع المواد',
      icon: Crown,
      color: 'from-green-600 to-amber-600',
      action: () => setLocation('/tahsilik/tests-hub')
    },
    {
      type: 'subject',
      title: '20 سؤال موضوعي',
      description: 'اختبار في مادة محددة',
      icon: Target,
      color: 'from-emerald-500 to-teal-500',
      action: () => setLocation('/tahsilik/tests-hub')
    }
  ];

  // Subject icons for decoration
  const subjects = [
    { name: 'رياضيات', icon: Calculator, color: 'text-blue-500' },
    { name: 'فيزياء', icon: Atom, color: 'text-green-700' },
    { name: 'كيمياء', icon: FlaskConical, color: 'text-green-500' },
    { name: 'أحياء', icon: Dna, color: 'text-rose-500' },
    { name: 'علوم البيئة', icon: Globe, color: 'text-teal-500' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-teal-500 dark:from-slate-900 dark:via-blue-900/50 dark:to-teal-500 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          variants={floatingVariants}
          animate="animate"
          className="absolute top-20 right-10 w-20 h-20 bg-gradient-to-r from-blue-400/20 to-emerald-600/20 rounded-full blur-xl"
        />
        <motion.div
          variants={floatingVariants}
          animate="animate"
          style={{ animationDelay: '1s' }}
          className="absolute bottom-40 left-10 w-32 h-32 bg-gradient-to-r from-emerald-400/20 to-teal-400/20 rounded-full blur-2xl"
        />
        <motion.div
          variants={floatingVariants}
          animate="animate"
          style={{ animationDelay: '2s' }}
          className="absolute top-1/3 left-1/4 w-16 h-16 bg-gradient-to-r from-rose-400/20 to-amber-600/20 rounded-full blur-lg"
        />
      </div>

      {/* Floating subject icons */}
      {subjects.map((subject, index) => (
        <motion.div
          key={subject.name}
          className={`absolute ${
            index === 0 ? 'top-40 right-8' :
            index === 1 ? 'top-60 left-12' :
            index === 2 ? 'bottom-80 right-16' :
            index === 3 ? 'bottom-60 left-8' :
            'top-80 right-1/3'
          } opacity-20 pointer-events-none`}
          animate={{
            y: [-5, 5],
            rotate: [-5, 5],
            scale: [0.8, 1.2]
          }}
          transition={{
            duration: 3 + index,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut"
          }}
        >
          <subject.icon className={`w-8 h-8 ${subject.color}`} />
        </motion.div>
      ))}

      <div className="relative z-10 container mx-auto px-4 py-6">
        {/* Hero Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-4 mb-4"
          >
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 rounded-2xl p-2 shadow-2xl shadow-orange-500/30">
                <img 
                  src={newLogoPath} 
                  alt="شعار تحصيلك" 
                  className="w-full h-full object-contain rounded-xl"
                />
              </div>
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-pulse">
                <Sparkles className="w-3 h-3 text-white m-1.5" />
              </div>
            </div>
            <div className="text-right">
              <h1 className="text-4xl font-black bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 bg-clip-text text-transparent">
                تحصيلك
              </h1>
              <p className="text-slate-600 dark:text-slate-300 text-sm">منصتك للتميز الأكاديمي</p>
            </div>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-slate-700 dark:text-slate-300 text-lg max-w-md mx-auto leading-relaxed mb-4"
          >
            رحلتك نحو التفوق في اختبار التحصيلي تبدأ من هنا
          </motion.p>

          {/* Quick stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex justify-center gap-4 mb-6"
          >
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/20">
              <div className="text-lg font-bold text-slate-800 dark:text-slate-200">8000+</div>
              <div className="text-xs text-slate-600 dark:text-slate-400">سؤال</div>
            </div>
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/20">
              <div className="text-lg font-bold text-slate-800 dark:text-slate-200">50+</div>
              <div className="text-xs text-slate-600 dark:text-slate-400">اختبار</div>
            </div>
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/20">
              <div className="text-lg font-bold text-slate-800 dark:text-slate-200">5</div>
              <div className="text-xs text-slate-600 dark:text-slate-400">مواد</div>
            </div>
          </motion.div>
        </motion.div>

        {/* Quick Test Access */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mb-8"
        >
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">ابدأ اختباراً سريعاً</h2>
          </div>
          
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {quickTests.map((test, index) => (
              <motion.div
                key={test.type}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.9 + index * 0.1 }}
                className="flex-shrink-0 w-40"
              >
                <Card 
                  className={`bg-gradient-to-br ${test.color} border-0 shadow-lg cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-xl`}
                  onClick={test.action}
                >
                  <CardContent className="p-4 text-center text-white">
                    <test.icon className="w-8 h-8 mx-auto mb-2" />
                    <h3 className="font-bold text-sm mb-1">{test.title}</h3>
                    <p className="text-xs opacity-90">{test.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Main Sections */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          {mainSections.map((section, index) => (
            <motion.div
              key={section.id}
              variants={cardVariants}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card 
                className={`group relative overflow-hidden cursor-pointer transition-all duration-500 hover:shadow-2xl bg-gradient-to-br ${section.bgGradient} border-0`}
                onClick={() => setLocation(section.path)}
                onMouseEnter={() => setSelectedCard(section.id)}
                onMouseLeave={() => setSelectedCard(null)}
              >
                {/* Background gradient overlay */}
                <div className={`absolute inset-0 bg-gradient-to-r ${section.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
                
                {/* Animated background elements */}
                <div className="absolute top-4 right-4 opacity-20 group-hover:opacity-40 transition-opacity duration-300">
                  <section.icon className="w-16 h-16 text-slate-400 dark:text-slate-600" />
                </div>

                <CardHeader className="relative z-10 pb-3">
                  <div className="flex items-start gap-4">
                    <motion.div 
                      className={`w-14 h-14 bg-gradient-to-r ${section.gradient} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}
                      whileHover={{ rotate: 5 }}
                    >
                      <section.icon className="w-7 h-7 text-white" />
                    </motion.div>
                    
                    <div className="flex-1">
                      <CardTitle className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-1 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:bg-clip-text group-hover:from-slate-700 group-hover:to-slate-900 dark:group-hover:from-slate-200 dark:group-hover:to-slate-400 transition-all duration-300">
                        {section.title}
                      </CardTitle>
                      <CardDescription className="text-slate-600 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors">
                        {section.subtitle}
                      </CardDescription>
                    </div>
                    
                    <motion.div
                      className="opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      whileHover={{ x: 5 }}
                    >
                      <ArrowRight className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                    </motion.div>
                  </div>
                </CardHeader>

                <CardContent className="relative z-10 pt-0">
                  <p className="text-slate-700 dark:text-slate-300 text-sm mb-4 leading-relaxed">
                    {section.description}
                  </p>

                  {/* Stats */}
                  <div className="flex gap-4 mb-4">
                    {Object.entries(section.stats).map(([key, value]) => (
                      <div key={key} className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-white/20">
                        <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">{value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Features */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {section.features.map((feature, idx) => (
                      <Badge 
                        key={idx}
                        variant="secondary" 
                        className="text-xs bg-white/60 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300"
                      >
                        <CheckCircle className="w-3 h-3 mr-1 text-emerald-600" />
                        {feature}
                      </Badge>
                    ))}
                  </div>

                  {/* Action Button */}
                  <Button 
                    className={`w-full bg-gradient-to-r ${section.gradient} hover:opacity-90 text-white border-0 group-hover:shadow-lg transition-all duration-300`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setLocation(section.path);
                    }}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    استكشف القسم
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </CardContent>

                {/* Hover effects */}
                <AnimatePresence>
                  {selectedCard === section.id && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent pointer-events-none"
                    />
                  )}
                </AnimatePresence>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Quick Test Access */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="mt-12"
        >
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2">اختبارات سريعة</h2>
            <p className="text-slate-600 dark:text-slate-400">ابدأ الاختبار الذي يناسب مستواك</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quickTests.map((test, index) => (
              <motion.div
                key={test.type}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.3 + index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card 
                  className="group cursor-pointer bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden relative"
                  data-testid={`card-quick-test-${test.type}`}
                  onClick={test.action}
                >
                  {/* Background gradient overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-r ${test.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
                  
                  <CardContent className="relative z-10 p-6 text-center">
                    <div className={`w-16 h-16 mx-auto mb-4 bg-gradient-to-r ${test.color} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <test.icon className="w-8 h-8 text-white" />
                    </div>
                    
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2">
                      {test.title}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                      {test.description}
                    </p>
                    
                    <Button 
                      className={`w-full bg-gradient-to-r ${test.color} hover:opacity-90 text-white border-0 shadow-lg group-hover:shadow-xl transition-all duration-300`}
                      data-testid={`button-quick-test-${test.type}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        test.action();
                      }}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      ابدأ الآن
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Success Story CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5 }}
          className="mt-8 text-center"
        >
          <Card className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 border-0 shadow-2xl text-white overflow-hidden relative">
            {/* Animated background */}
            <div className="absolute inset-0 opacity-20">
              <motion.div
                className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent"
                animate={{ x: [-100, 400] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              />
            </div>
            
            <CardContent className="relative z-10 py-8">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="mb-4"
              >
                <Trophy className="w-16 h-16 mx-auto text-yellow-300" />
              </motion.div>
              <h3 className="text-2xl font-bold mb-2">انضم لآلاف الناجحين!</h3>
              <p className="text-lg opacity-90 mb-4">
                طلاب حققوا نتائج متميزة في اختبار التحصيلي باستخدام منصتنا
              </p>
              <div className="flex justify-center gap-6 text-sm opacity-90">
                <div>
                  <div className="text-xl font-bold">95%</div>
                  <div>معدل النجاح</div>
                </div>
                <div>
                  <div className="text-xl font-bold">87</div>
                  <div>متوسط الدرجات</div>
                </div>
                <div>
                  <div className="text-xl font-bold">15K+</div>
                  <div>طالب ناجح</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default TahsilikMobileDashboard;