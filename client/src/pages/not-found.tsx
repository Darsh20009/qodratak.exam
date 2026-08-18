import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Home, 
  Search, 
  ArrowLeft, 
  Sparkles, 
  Star,
  Zap,
  Brain,
  BookOpen,
  Calculator,
  Target,
  Rocket,
  Crown,
  GraduationCap
} from "lucide-react";
const newLogoPath = "/logo-512x512.png";

export default function NotFound() {
  const [showFloatingElements, setShowFloatingElements] = useState(false);
  const [currentAnimation, setCurrentAnimation] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setShowFloatingElements(true), 500);
    const animationTimer = setInterval(() => {
      setCurrentAnimation(prev => (prev + 1) % 3);
    }, 2000);
    return () => {
      clearTimeout(timer);
      clearInterval(animationTimer);
    };
  }, []);

  // عناصر عائمة إبداعية
  const floatingIcons = [
    { icon: Brain, color: "text-blue-500", size: "w-8 h-8", delay: 0 },
    { icon: BookOpen, color: "text-green-500", size: "w-6 h-6", delay: 0.5 },
    { icon: Calculator, color: "text-green-600", size: "w-7 h-7", delay: 1 },
    { icon: Target, color: "text-orange-500", size: "w-5 h-5", delay: 1.5 },
    { icon: Star, color: "text-yellow-500", size: "w-6 h-6", delay: 2 },
    { icon: Rocket, color: "text-red-500", size: "w-7 h-7", delay: 2.5 },
    { icon: Crown, color: "text-amber-500", size: "w-6 h-6", delay: 3 },
    { icon: GraduationCap, color: "text-green-700", size: "w-8 h-8", delay: 3.5 }
  ];

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5
      }
    }
  };

  const logoVariants = {
    hidden: { scale: 0, rotate: -180 },
    visible: {
      scale: 1,
      rotate: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15,
        duration: 1
      }
    }
  };

  const numberVariants: Record<number, { scale: number; rotate: number }> = {
    0: { scale: 1, rotate: 0 },
    1: { scale: 1.1, rotate: 5 },
    2: { scale: 0.9, rotate: -5 }
  };

  return (
    <div className="min-h-screen w-full relative overflow-hidden bg-gray-50 dark:bg-gray-900">
      {/* خلفية */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-green-100/20 via-transparent to-green-50/20 dark:from-green-900/10 dark:to-transparent"></div>
      
      {/* عناصر عائمة في الخلفية */}
      {showFloatingElements && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {floatingIcons.map((item, index) => (
            <motion.div
              key={index}
              className={`absolute ${item.color} ${item.size} opacity-20 dark:opacity-10`}
              initial={{ 
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
                scale: 0
              }}
              animate={{ 
                y: [null, -20, 20, -10, 10, 0],
                x: [null, 10, -10, 5, -5, 0],
                scale: [0, 1, 1.1, 0.9, 1],
                rotate: [0, 5, -5, 3, -3, 0]
              }}
              transition={{
                duration: 4,
                delay: item.delay,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut"
              }}
            >
              <item.icon className={item.size} />
            </motion.div>
          ))}
        </div>
      )}

      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full max-w-2xl"
        >
          <Card className="backdrop-blur-md bg-white/80 dark:bg-gray-800/80 border-0 shadow-2xl relative overflow-hidden">
            {/* تأثير متوهج */}
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 via-transparent to-green-500/5"></div>
            
            <CardContent className="relative z-10 p-8 md:p-12 text-center">
              {/* شعار الموقع */}
              <motion.div
                variants={logoVariants}
                initial="hidden"
                animate="visible"
                className="mb-8"
              >
                <div className="relative inline-block">
                  <img 
                    src={newLogoPath} 
                    alt="قدراتك" 
                    className="w-24 h-24 md:w-32 md:h-32 mx-auto rounded-full shadow-lg border-4 border-white dark:border-gray-700"
                  />
                  <motion.div
                    className="absolute -inset-2 rounded-full opacity-20 dark:opacity-10"
                    style={{ background: '#1a7c3e' }}
                    animate={{
                      scale: [1, 1.1, 1],
                      opacity: [0.2, 0.4, 0.2]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                </div>
              </motion.div>

              {/* رقم 404 الإبداعي */}
              <motion.div
                variants={itemVariants}
                className="mb-6"
              >
                <motion.h1 
                  className="text-8xl md:text-9xl font-bold leading-none"
                  style={{ color: '#1a7c3e' }}
                  animate={numberVariants[currentAnimation]}
                  transition={{ duration: 0.5 }}
                >
                  404
                </motion.h1>
                <div className="flex justify-center items-center gap-2 mt-2">
                  <Sparkles className="w-6 h-6 text-yellow-500 animate-pulse" />
                  <div className="h-1 w-20 rounded-full" style={{ background: '#1a7c3e' }}></div>
                  <Sparkles className="w-6 h-6 text-yellow-500 animate-pulse" />
                </div>
              </motion.div>

              {/* النصوص */}
              <motion.div variants={itemVariants} className="mb-8 space-y-4">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">
                  أوبس! الصفحة غير موجودة
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
                  يبدو أنك تبحث عن صفحة لا تتوفر حالياً في منصة قدراتك
                </p>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-900/20 rounded-full">
                  <Search className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-green-700 dark:text-green-300">
                    لا تقلق، سنساعدك في العثور على ما تبحث عنه
                  </span>
                </div>
              </motion.div>

              {/* الأزرار */}
              <motion.div variants={itemVariants} className="space-y-4">
                <Link href="/">
                  <Button 
                    size="lg"
                    className="w-full md:w-auto text-white font-bold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                    style={{ background: '#1a7c3e' }}
                  >
                    <Home className="w-5 h-5 mr-3" />
                    العودة للصفحة الرئيسية
                    <Zap className="w-4 h-4 ml-3 animate-pulse" />
                  </Button>
                </Link>

                <div className="flex flex-col md:flex-row gap-3 justify-center">
                  <Link href="/qiyas">
                    <Button 
                      variant="outline"
                      className="w-full md:w-auto border-2 border-green-500 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 font-semibold"
                    >
                      <Brain className="w-4 h-4 mr-2" />
                      اختبارات قياس
                    </Button>
                  </Link>
                  
                  <Link href="/time-management">
                    <Button 
                      variant="outline"
                      className="w-full md:w-auto border-2 border-green-500 text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20 font-semibold"
                    >
                      <Target className="w-4 h-4 mr-2" />
                      إدارة الوقت
                    </Button>
                  </Link>
                </div>
              </motion.div>

              {/* رسالة تحفيزية */}
              <motion.div 
                variants={itemVariants}
                className="mt-8 p-4 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-xl border border-green-200 dark:border-green-800"
              >
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Star className="w-5 h-5 text-yellow-500" />
                  <span className="font-semibold text-gray-800 dark:text-white">
                    استكشف منصة قدراتك
                  </span>
                  <Star className="w-5 h-5 text-yellow-500" />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  اكتشف اختبارات قياس، التحصيلي، إدارة الوقت، وأدوات التطوير الشخصي
                </p>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
