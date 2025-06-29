import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  Trophy,
  Star,
  Target,
  TrendingUp,
  Award,
  Crown,
  Gem,
  Flame,
  Zap,
  Brain,
  Heart,
  Shield,
  Rocket,
  Sparkles,
  Eye,
  BarChart3,
  PieChart,
  Activity,
  BookOpen,
  Calculator,
  Lightbulb,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Download,
  Share,
  Repeat,
  Moon,
  Sun,
  Palette
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { DetailedExamResult } from "@/../../shared/examUtils";

interface DetailedTestResultsProps {
  results: DetailedExamResult;
  examType: string;
  onClose: () => void;
}

// Ultimate creative performance levels with animations
const PERFORMANCE_LEVELS = {
  'ممتاز': {
    icon: Crown,
    color: 'text-yellow-600',
    bgColor: 'bg-gradient-to-br from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30',
    borderColor: 'border-yellow-400',
    emoji: '👑',
    message: 'أداء ملكي مذهل!',
    animation: 'animate-bounce'
  },
  'جيد جداً': {
    icon: Trophy,
    color: 'text-blue-600',
    bgColor: 'bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30',
    borderColor: 'border-blue-400',
    emoji: '🏆',
    message: 'أداء رائع ومتميز!',
    animation: 'animate-pulse'
  },
  'جيد': {
    icon: Star,
    color: 'text-green-600',
    bgColor: 'bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30',
    borderColor: 'border-green-400',
    emoji: '⭐',
    message: 'أداء جيد ومشجع!',
    animation: 'animate-pulse'
  },
  'يحتاج تحسين': {
    icon: Target,
    color: 'text-orange-600',
    bgColor: 'bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30',
    borderColor: 'border-orange-400',
    emoji: '🎯',
    message: 'هناك مجال للتحسن!',
    animation: 'animate-pulse'
  }
};

// Creative theme modes
const THEME_MODES = [
  { 
    id: 'cosmic', 
    name: 'كوني', 
    icon: Sparkles,
    colors: 'from-purple-600 via-blue-600 to-indigo-600',
    bg: 'bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-purple-900/20 dark:via-blue-900/20 dark:to-indigo-900/20'
  },
  { 
    id: 'nature', 
    name: 'طبيعي', 
    icon: Heart,
    colors: 'from-green-600 via-emerald-600 to-teal-600',
    bg: 'bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-green-900/20 dark:via-emerald-900/20 dark:to-teal-900/20'
  },
  { 
    id: 'fire', 
    name: 'ناري', 
    icon: Flame,
    colors: 'from-red-600 via-orange-600 to-yellow-600',
    bg: 'bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 dark:from-red-900/20 dark:via-orange-900/20 dark:to-yellow-900/20'
  },
  { 
    id: 'ocean', 
    name: 'محيطي', 
    icon: Activity,
    colors: 'from-cyan-600 via-blue-600 to-indigo-600',
    bg: 'bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50 dark:from-cyan-900/20 dark:via-blue-900/20 dark:to-indigo-900/20'
  }
];

export function DetailedTestResults({ results, examType, onClose }: DetailedTestResultsProps) {
  const [currentTheme, setCurrentTheme] = useState(THEME_MODES[0]);
  const [darkMode, setDarkMode] = useState(false);
  const [animationEnabled, setAnimationEnabled] = useState(true);
  const [showFloatingElements, setShowFloatingElements] = useState(true);
  const [currentView, setCurrentView] = useState<'overview' | 'verbal' | 'quantitative' | 'insights'>('overview');

  // Creative floating elements
  const FloatingElements = () => {
    if (!showFloatingElements) return null;
    
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({length: 8}).map((_, i) => (
          <div
            key={i}
            className={cn(
              "absolute w-4 h-4 rounded-full opacity-30 animate-float",
              `bg-gradient-to-br ${currentTheme.colors}`,
              `animation-delay-${i * 500}ms`
            )}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDuration: `${3 + Math.random() * 2}s`,
              animationDelay: `${i * 0.5}s`
            }}
          />
        ))}
      </div>
    );
  };

  // Ultra creative subcategory card
  const SubcategoryCard = ({ result, index }: { result: any, index: number }) => {
    const level = PERFORMANCE_LEVELS[result.level as keyof typeof PERFORMANCE_LEVELS];
    
    return (
      <Card 
        className={cn(
          "relative overflow-hidden transition-all duration-500 hover:scale-105 hover:shadow-xl group cursor-pointer",
          level.bgColor,
          `border-2 ${level.borderColor}`,
          animationEnabled && "animate-fadeInUp",
          `animation-delay-${index * 100}ms`
        )}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        <CardHeader className="relative z-10 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-2 rounded-full bg-gradient-to-br shadow-lg",
                currentTheme.colors,
                animationEnabled && level.animation
              )}>
                <level.icon className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold text-gray-800 dark:text-white">
                  {result.subcategory}
                </CardTitle>
                <Badge 
                  variant="secondary" 
                  className={cn("text-xs mt-1", level.color)}
                >
                  {level.emoji} {result.level}
                </Badge>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-3xl font-bold text-gray-800 dark:text-white">
                {result.correct}
                <span className="text-lg text-gray-500 dark:text-gray-400">/{result.total}</span>
              </div>
              <div className={cn("text-sm font-semibold", level.color)}>
                {result.percentage.toFixed(1)}%
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="relative z-10 pt-0">
          <div className="space-y-3">
            <Progress 
              value={result.percentage} 
              className={cn(
                "h-3 bg-gray-200 dark:bg-gray-700 transition-all duration-1000",
                animationEnabled && "animate-slideInLeft"
              )}
            />
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-300">
                {level.message}
              </span>
              <div className="flex items-center gap-1">
                {Array.from({length: 5}).map((_, i) => (
                  <Star 
                    key={i}
                    className={cn(
                      "h-4 w-4 transition-all duration-300",
                      i < Math.ceil(result.percentage / 20) 
                        ? "text-yellow-500 fill-current" 
                        : "text-gray-300 dark:text-gray-600"
                    )}
                  />
                ))}
              </div>
            </div>

            {/* Creative insight for each subcategory */}
            <div className="text-xs text-gray-600 dark:text-gray-400 bg-white/50 dark:bg-gray-800/50 rounded-lg p-2">
              {result.percentage >= 85 && "🌟 أداء استثنائي! أنت متمكن تماماً من هذا المجال"}
              {result.percentage >= 70 && result.percentage < 85 && "👍 أداء جيد جداً، مع القليل من التدريب ستصل للتميز"}
              {result.percentage >= 50 && result.percentage < 70 && "📈 أداء مقبول، ركز على هذا المجال في التدريبات القادمة"}
              {result.percentage < 50 && "💪 يحتاج تركيز إضافي، لا تستسلم! التحسن قادم بالتأكيد"}
            </div>
          </div>
        </CardContent>

        {/* Sparkle effect on hover */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <Sparkles className="h-5 w-5 text-yellow-500 animate-spin" />
        </div>
      </Card>
    );
  };

  // Creative achievements display
  const AchievementsSection = () => {
    if (results.achievements.length === 0) return null;

    return (
      <Card className={cn("mb-6 overflow-hidden", currentTheme.bg)}>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold flex items-center justify-center gap-3">
            <Trophy className="h-8 w-8 text-yellow-500 animate-bounce" />
            <span className={cn("bg-gradient-to-r bg-clip-text text-transparent", currentTheme.colors)}>
              إنجازاتك المذهلة
            </span>
            <Crown className="h-8 w-8 text-yellow-500 animate-pulse" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {results.achievements.map((achievement, index) => (
              <div 
                key={index}
                className={cn(
                  "flex items-center gap-3 p-4 rounded-lg bg-white/70 dark:bg-gray-800/70 border-2 border-yellow-300 shadow-lg",
                  animationEnabled && "animate-slideInUp",
                  `animation-delay-${index * 200}ms`
                )}
              >
                <div className="p-2 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 shadow-lg">
                  <Award className="h-6 w-6 text-white" />
                </div>
                <span className="text-lg font-semibold text-gray-800 dark:text-white">
                  {achievement}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  // Creative statistics overview
  const StatsOverview = () => {
    const overallLevel = PERFORMANCE_LEVELS[results.level as keyof typeof PERFORMANCE_LEVELS];
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className={cn(
          "text-center overflow-hidden relative group",
          overallLevel.bgColor,
          `border-2 ${overallLevel.borderColor}`
        )}>
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <CardContent className="p-6 relative z-10">
            <div className={cn("mb-4 mx-auto w-fit p-3 rounded-full bg-gradient-to-br shadow-lg", currentTheme.colors)}>
              <overallLevel.icon className="h-8 w-8 text-white" />
            </div>
            <div className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
              {results.totalScore}/{results.totalQuestions}
            </div>
            <div className={cn("text-lg font-semibold mb-1", overallLevel.color)}>
              {results.overallPercentage.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">
              النتيجة الإجمالية
            </div>
          </CardContent>
        </Card>

        <Card className="text-center overflow-hidden relative group bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 border-2 border-blue-400">
          <CardContent className="p-6 relative z-10">
            <div className="mb-4 mx-auto w-fit p-3 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 shadow-lg">
              <BookOpen className="h-8 w-8 text-white" />
            </div>
            <div className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
              {results.verbalResults.length}
            </div>
            <div className="text-lg font-semibold text-blue-600 mb-1">
              {results.verbalResults.reduce((sum, r) => sum + r.percentage, 0) / results.verbalResults.length || 0}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">
              الأقسام اللفظية
            </div>
          </CardContent>
        </Card>

        <Card className="text-center overflow-hidden relative group bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 border-2 border-green-400">
          <CardContent className="p-6 relative z-10">
            <div className="mb-4 mx-auto w-fit p-3 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 shadow-lg">
              <Calculator className="h-8 w-8 text-white" />
            </div>
            <div className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
              {results.quantitativeResults.length}
            </div>
            <div className="text-lg font-semibold text-green-600 mb-1">
              {results.quantitativeResults.reduce((sum, r) => sum + r.percentage, 0) / results.quantitativeResults.length || 0}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">
              الأقسام الكمية
            </div>
          </CardContent>
        </Card>

        <Card className="text-center overflow-hidden relative group bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 border-2 border-purple-400">
          <CardContent className="p-6 relative z-10">
            <div className="mb-4 mx-auto w-fit p-3 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg">
              <Lightbulb className="h-8 w-8 text-white" />
            </div>
            <div className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
              {results.achievements.length}
            </div>
            <div className="text-lg font-semibold text-purple-600 mb-1">
              إنجازات
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">
              حققتها في الاختبار
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className={cn(
        "max-w-7xl max-h-[95vh] overflow-y-auto font-arabic relative",
        currentTheme.bg,
        darkMode && "dark"
      )}>
        <FloatingElements />
        
        <DialogHeader className="relative z-10 text-center pb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              {THEME_MODES.map((theme) => (
                <Button
                  key={theme.id}
                  variant={currentTheme.id === theme.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentTheme(theme)}
                  className={cn(
                    "w-10 h-10 p-2",
                    currentTheme.id === theme.id && `bg-gradient-to-r ${theme.colors} text-white`
                  )}
                >
                  <theme.icon className="h-4 w-4" />
                </Button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAnimationEnabled(!animationEnabled)}
                className="flex items-center gap-2"
              >
                <Activity className="h-4 w-4" />
                {animationEnabled ? 'إيقاف' : 'تشغيل'} التأثيرات
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDarkMode(!darkMode)}
                className="flex items-center gap-2"
              >
                {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                {darkMode ? 'فاتح' : 'داكن'}
              </Button>
            </div>
          </div>

          <DialogTitle className={cn(
            "text-4xl font-bold mb-4 bg-gradient-to-r bg-clip-text text-transparent",
            currentTheme.colors
          )}>
            <div className="flex items-center justify-center gap-4">
              <Sparkles className="h-10 w-10 text-purple-500 animate-spin" />
              التحليل الشامل المتقدم - {examType}
              <Crown className="h-10 w-10 text-yellow-500 animate-bounce" />
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="relative z-10">
          {/* Navigation Tabs */}
          <div className="flex justify-center mb-8">
            <div className="flex bg-white/70 dark:bg-gray-800/70 backdrop-blur rounded-lg p-1 border-2 border-purple-200 dark:border-purple-700">
              {[
                { id: 'overview', label: 'نظرة عامة', icon: BarChart3 },
                { id: 'verbal', label: 'اللفظية', icon: BookOpen },
                { id: 'quantitative', label: 'الكمية', icon: Calculator },
                { id: 'insights', label: 'التوصيات', icon: Lightbulb }
              ].map((tab) => (
                <Button
                  key={tab.id}
                  variant={currentView === tab.id ? "default" : "ghost"}
                  className={cn(
                    "flex items-center gap-2 px-6 py-3",
                    currentView === tab.id && `bg-gradient-to-r ${currentTheme.colors} text-white shadow-lg`
                  )}
                  onClick={() => setCurrentView(tab.id as any)}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Content based on current view */}
          {currentView === 'overview' && (
            <div>
              <StatsOverview />
              <AchievementsSection />
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Quick Verbal Overview */}
                {results.verbalResults.length > 0 && (
                  <Card className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-2 border-blue-300">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3 text-xl">
                        <BookOpen className="h-6 w-6 text-blue-600" />
                        القدرات اللفظية - نظرة سريعة
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {results.verbalResults.slice(0, 3).map((result, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-white/70 dark:bg-gray-800/70 rounded-lg">
                            <span className="font-medium">{result.subcategory}</span>
                            <Badge variant="secondary" className={result.color}>
                              {result.correct}/{result.total} ({result.percentage.toFixed(1)}%)
                            </Badge>
                          </div>
                        ))}
                        {results.verbalResults.length > 3 && (
                          <Button 
                            variant="outline" 
                            className="w-full mt-3"
                            onClick={() => setCurrentView('verbal')}
                          >
                            عرض التفاصيل الكاملة ({results.verbalResults.length - 3} أقسام أخرى)
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Quick Quantitative Overview */}
                {results.quantitativeResults.length > 0 && (
                  <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-300">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3 text-xl">
                        <Calculator className="h-6 w-6 text-green-600" />
                        القدرات الكمية - نظرة سريعة
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {results.quantitativeResults.slice(0, 3).map((result, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-white/70 dark:bg-gray-800/70 rounded-lg">
                            <span className="font-medium">{result.subcategory}</span>
                            <Badge variant="secondary" className={result.color}>
                              {result.correct}/{result.total} ({result.percentage.toFixed(1)}%)
                            </Badge>
                          </div>
                        ))}
                        {results.quantitativeResults.length > 3 && (
                          <Button 
                            variant="outline" 
                            className="w-full mt-3"
                            onClick={() => setCurrentView('quantitative')}
                          >
                            عرض التفاصيل الكاملة ({results.quantitativeResults.length - 3} أقسام أخرى)
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}

          {currentView === 'verbal' && (
            <div>
              <div className="text-center mb-8">
                <h2 className={cn("text-3xl font-bold mb-4 bg-gradient-to-r bg-clip-text text-transparent", currentTheme.colors)}>
                  📚 تحليل مفصل للقدرات اللفظية
                </h2>
                <p className="text-gray-600 dark:text-gray-300 text-lg">
                  استعرض أداءك في كل قسم فرعي من أقسام القدرات اللفظية
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {results.verbalResults.map((result, index) => (
                  <SubcategoryCard key={index} result={result} index={index} />
                ))}
              </div>
            </div>
          )}

          {currentView === 'quantitative' && (
            <div>
              <div className="text-center mb-8">
                <h2 className={cn("text-3xl font-bold mb-4 bg-gradient-to-r bg-clip-text text-transparent", currentTheme.colors)}>
                  🔢 تحليل مفصل للقدرات الكمية
                </h2>
                <p className="text-gray-600 dark:text-gray-300 text-lg">
                  استعرض أداءك في كل قسم فرعي من أقسام القدرات الكمية
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {results.quantitativeResults.map((result, index) => (
                  <SubcategoryCard key={index} result={result} index={index} />
                ))}
              </div>
            </div>
          )}

          {currentView === 'insights' && (
            <div>
              <div className="text-center mb-8">
                <h2 className={cn("text-3xl font-bold mb-4 bg-gradient-to-r bg-clip-text text-transparent", currentTheme.colors)}>
                  💡 توصيات ذكية ونصائح مخصصة
                </h2>
                <p className="text-gray-600 dark:text-gray-300 text-lg">
                  توصيات مخصصة لتحسين أدائك في الاختبارات القادمة
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-300">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-xl text-green-700 dark:text-green-300">
                      <CheckCircle className="h-6 w-6" />
                      نقاط القوة
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {[...results.verbalResults, ...results.quantitativeResults]
                        .filter(r => r.percentage >= 70)
                        .map((result, index) => (
                          <div key={index} className="flex items-center gap-3 p-3 bg-white/70 dark:bg-gray-800/70 rounded-lg">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            <span className="text-sm">
                              <strong>{result.subcategory}:</strong> أداء ممتاز ({result.percentage.toFixed(1)}%)
                            </span>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-2 border-orange-300">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-xl text-orange-700 dark:text-orange-300">
                      <Target className="h-6 w-6" />
                      مجالات التحسين
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {[...results.verbalResults, ...results.quantitativeResults]
                        .filter(r => r.percentage < 70)
                        .map((result, index) => (
                          <div key={index} className="flex items-center gap-3 p-3 bg-white/70 dark:bg-gray-800/70 rounded-lg">
                            <Target className="h-5 w-5 text-orange-600" />
                            <span className="text-sm">
                              <strong>{result.subcategory}:</strong> يحتاج تركيز إضافي ({result.percentage.toFixed(1)}%)
                            </span>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="mt-8 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border-2 border-purple-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-xl text-purple-700 dark:text-purple-300">
                    <Lightbulb className="h-6 w-6" />
                    خطة التحسين المقترحة
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-semibold text-lg text-purple-700 dark:text-purple-300">للقدرات اللفظية:</h4>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-start gap-2">
                          <BookOpen className="h-4 w-4 text-purple-600 mt-0.5" />
                          <span>اقرأ نصوص متنوعة يومياً لتحسين الاستيعاب</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Target className="h-4 w-4 text-purple-600 mt-0.5" />
                          <span>تدرب على التناظر اللفظي والعلاقات بين الكلمات</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Brain className="h-4 w-4 text-purple-600 mt-0.5" />
                          <span>حل تمارين إكمال الجمل بانتظام</span>
                        </li>
                      </ul>
                    </div>
                    
                    <div className="space-y-4">
                      <h4 className="font-semibold text-lg text-purple-700 dark:text-purple-300">للقدرات الكمية:</h4>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-start gap-2">
                          <Calculator className="h-4 w-4 text-purple-600 mt-0.5" />
                          <span>راجع القوانين الأساسية للهندسة والجبر</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <PieChart className="h-4 w-4 text-purple-600 mt-0.5" />
                          <span>تدرب على تحليل البيانات والرسوم البيانية</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Zap className="h-4 w-4 text-purple-600 mt-0.5" />
                          <span>طور مهارات الحساب السريع والتقدير</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-center gap-4 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button
              onClick={onClose}
              className={cn(
                "px-8 py-3 text-lg bg-gradient-to-r text-white shadow-lg hover:shadow-xl transition-all",
                currentTheme.colors
              )}
            >
              <Eye className="h-5 w-5 mr-2" />
              إغلاق التحليل
            </Button>
            
            <Button
              variant="outline"
              className="px-8 py-3 text-lg"
              onClick={() => {
                const dataStr = JSON.stringify(results, null, 2);
                const dataBlob = new Blob([dataStr], {type: 'application/json'});
                const url = URL.createObjectURL(dataBlob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `detailed-results-${new Date().toISOString().split('T')[0]}.json`;
                link.click();
                URL.revokeObjectURL(url);
              }}
            >
              <Download className="h-5 w-5 mr-2" />
              تحميل التحليل
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default DetailedTestResults;