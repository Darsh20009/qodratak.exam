import React from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { 
  Brain,
  BookOpen,
  Target,
  Award,
  Users,
  TrendingUp,
  Star,
  ArrowRight,
  ChevronRight,
  GraduationCap,
  Zap,
  Crown,
  Trophy,
  Sparkles,
  Rocket
} from 'lucide-react';

const TahsilikPlatform: React.FC = () => {
  const [, setLocation] = useLocation();

  // Detect reduced motion preference
  const prefersReducedMotion = typeof window !== 'undefined' && 
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const features = [
    {
      title: 'مركز الدراسة',
      description: 'كتب ومواد تعليمية شاملة',
      icon: BookOpen,
      route: '/tahsilik/study',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      title: 'مركز الاختبارات',
      description: 'اختبارات تحصيلية متنوعة',
      icon: Brain,
      route: '/tahsilik/tests',
      color: 'from-green-600 to-amber-600'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-teal-500/50 dark:from-gray-900 dark:via-blue-950/30 dark:to-teal-500/50">
      <div className="container mx-auto px-6 py-12">
        {/* Header */}
        <motion.div 
          initial={{ opacity: prefersReducedMotion ? 1 : 0, y: prefersReducedMotion ? 0 : -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="w-20 h-20 bg-gradient-to-r from-green-600 to-amber-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <GraduationCap className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            منصة تحصيلك
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            منصة شاملة لإعدادك للاختبار التحصيلي بأحدث الطرق والتقنيات
          </p>
        </motion.div>

        {/* Features - Enhanced Creative Design */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ 
                opacity: prefersReducedMotion ? 1 : 0, 
                scale: prefersReducedMotion ? 1 : 0.9, 
                y: prefersReducedMotion ? 0 : 30 
              }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ 
                delay: prefersReducedMotion ? 0 : index * 0.15,
                type: prefersReducedMotion ? "tween" : "spring",
                stiffness: 100,
                damping: 15,
                duration: prefersReducedMotion ? 0 : undefined
              }}
              className="group relative"
            >
              {/* Glow Effect */}
              <div className={`absolute -inset-0.5 bg-gradient-to-r ${feature.color} rounded-3xl blur-lg opacity-30 group-hover:opacity-60 transition-opacity duration-500`}></div>
              
              <Card className="relative h-full cursor-pointer border-2 border-transparent hover:border-white/20 transition-all duration-500 overflow-hidden bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
                {/* Animated Background Gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}></div>
                
                {/* Floating Particles Effect */}
                <div className="absolute top-4 right-4 w-20 h-20 bg-gradient-to-br from-white/20 to-transparent rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
                <div className="absolute bottom-4 left-4 w-16 h-16 bg-gradient-to-tr from-white/10 to-transparent rounded-full blur-lg group-hover:scale-125 transition-transform duration-500"></div>
                
                <CardHeader className="relative z-10 pb-4">
                  {/* Icon with Enhanced Animation */}
                  <div className="relative mb-6">
                    <div className={`w-20 h-20 bg-gradient-to-br ${feature.color} rounded-3xl flex items-center justify-center transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-2xl`}>
                      <feature.icon className="w-10 h-10 text-white transform group-hover:scale-110 transition-transform duration-300" />
                    </div>
                    {/* Pulsing Ring */}
                    <div className={`absolute inset-0 w-20 h-20 bg-gradient-to-br ${feature.color} rounded-3xl animate-ping opacity-20`}></div>
                  </div>
                  
                  <CardTitle className="text-2xl font-bold mb-3 bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300">
                    {feature.title}
                  </CardTitle>
                  <CardDescription className="text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="relative z-10">
                  <Button 
                    onClick={() => setLocation(feature.route)}
                    className={`w-full bg-gradient-to-r ${feature.color} hover:shadow-2xl transform hover:scale-105 active:scale-95 transition-all duration-300 text-white font-semibold py-6 rounded-2xl group-hover:shadow-[0_0_30px_rgba(147,51,234,0.5)]`}
                    data-testid={`button-${feature.route.split('/').pop()}`}
                  >
                    <Sparkles className="w-5 h-5 ml-2 animate-pulse" />
                    ابدأ الآن
                    <ArrowRight className="w-5 h-5 mr-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </CardContent>

                {/* Corner Decorations */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-white/10 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-white/10 to-transparent rounded-tr-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              </Card>
            </motion.div>
          ))}
        </div>

        
      </div>
      
      {/* Accessibility: Respect reduced motion preference */}
      <style>{`
        @media (prefers-reduced-motion: reduce) {
          .animate-ping,
          .animate-pulse {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
};

export default TahsilikPlatform;