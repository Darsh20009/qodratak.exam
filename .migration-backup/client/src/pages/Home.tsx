
import React, { useState, useEffect } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { 
  BrainCircuitIcon, 
  BookOpenIcon, 
  GraduationCapIcon, 
  ArrowRightIcon, 
  HelpCircleIcon,
  Sparkles,
  Trophy,
  Target,
  Stars,
  Rocket,
  Zap,
  User,
  CrownIcon,
  DiamondIcon,
  TrophyIcon,
  RocketIcon,
  HeartIcon,
  ShieldIcon,
  FlameIcon,
  Clock,
  FolderIcon,
  GamepadIcon,
  BarChart3,
  Lightbulb,
  Download,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Moon,
  Sun
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getQueryFn } from "@/lib/queryClient";
import { PremiumNotifications } from "@/components/PremiumNotifications";
import { GameificationSystem } from "@/components/GameificationSystem";
import { InteractiveAnalytics } from "@/components/InteractiveAnalytics";
import { PremiumDashboard } from "@/components/PremiumDashboard";
import { DailyGoalWidget } from "@/components/DailyGoalWidget";
import { ActivityHeatmap } from "@/components/ActivityHeatmap";

const features = [
  {
    title: "اختبارات قياس",
    description: "محاكاة دقيقة لاختبار قياس - 120 سؤال في 120 دقيقة مع تقييم فوري",
    icon: GraduationCapIcon,
    href: "/qiyas",
    gradient: "from-green-500 via-green-600 to-emerald-600",
    bgGradient: "bg-gradient-to-br from-green-500/10 via-green-600/10 to-emerald-600/10"
  },
  {
    title: "اختبر قدراتك",
    description: "تحديات تفاعلية متدرجة الصعوبة لتطوير مهاراتك اللفظية والكمية، مع نظام مكافآت ومستويات تحفيزية",
    icon: BrainCircuitIcon,
    href: "/abilities",
    color: "bg-green-500/10 dark:bg-green-500/20",
    gradient: "from-green-500 to-green-600",
    hoverGradient: "from-emerald-500 to-teal-500",
    accent: "border-green-400"
  },
  {
    title: "اسأل سؤال",
    description: "احصل على إجابات دقيقة وشرح مفصل من قاعدة بيانات تضم أكثر من 10,000 سؤال وإجابة",
    icon: HelpCircleIcon,
    href: "/ask",
    color: "bg-green-500/10 dark:bg-green-500/20",
    gradient: "from-green-600 to-emerald-600",
    hoverGradient: "from-green-500 to-emerald-500",
    accent: "border-green-400"
  },
  {
    title: "المكتبة",
    description: "مكتبة شاملة من الأسئلة والشروحات مصنفة حسب المستوى والموضوع، مع أمثلة وتدريبات إضافية",
    icon: BookOpenIcon,
    href: "/library",
    color: "bg-orange-500/10 dark:bg-orange-500/20",
    gradient: "from-orange-500 to-orange-600",
    hoverGradient: "from-amber-500 to-orange-500",
    accent: "border-orange-400"
  },
  {
    title: "تحصيلك",
    description: "منصة متكاملة للتحضير لاختبار التحصيلي مع كتب تعليمية واختبارات تفصيلية ومكتبة شاملة للأسئلة",
    icon: GraduationCapIcon,
    href: "/tahsilik",
    color: "bg-teal-500/10 dark:bg-teal-500/20",
    gradient: "from-teal-500 to-green-600",
    hoverGradient: "from-teal-500 to-green-500",
    accent: "border-teal-400"
  }
];

const statisticsData = [
  { value: "5,565+", label: "سؤال وإجابة", icon: Target, color: "text-blue-500" },
  { value: "4", label: "لهجات مدعومة", icon: Sparkles, color: "text-green-600" },
  { value: "7", label: "أقسام اختبارية", icon: BrainCircuitIcon, color: "text-green-500" },
  { value: "∞", label: "فرص للتعلم", icon: Trophy, color: "text-orange-500" }
];

const testimonials = [
  {
    name: "أحمد محمد",
    text: "منصة رائعة ساعدتني في تحسين درجتي في اختبار قياس بشكل كبير",
    avatar: "👨‍🎓",
    rating: 5
  },
  {
    name: "فاطمة السعيد",
    text: "التحديات التفاعلية جعلت التعلم أكثر متعة وفعالية",
    avatar: "👩‍💼",
    rating: 5
  },
  {
    name: "خالد العتيبي",
    text: "أفضل منصة للتحضير لاختبارات القدرات، نتائج مذهلة!",
    avatar: "👨‍🏫",
    rating: 5
  }
];

const RecentTestResults: React.FC<{ userId?: string | number }> = ({ userId }) => {
  const { data: testResults = [], isLoading } = useQuery<any[]>({
    queryKey: ['/api/test-results/user', userId],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!userId,
  });

  if (isLoading) {
    return (
      <div className="mb-12 p-6 bg-primary-foreground/10 rounded-2xl border border-primary-foreground/20 backdrop-blur-sm">
        <div className="animate-pulse space-y-3">
          <div className="h-6 bg-primary-foreground/20 rounded w-1/3"></div>
          <div className="h-16 bg-primary-foreground/20 rounded"></div>
        </div>
      </div>
    );
  }

  if (!testResults || testResults.length === 0) {
    return (
      <div className="mb-12 p-6 bg-primary-foreground/10 rounded-2xl border border-primary-foreground/20 backdrop-blur-sm text-center">
        <p className="text-primary-foreground/80">لم تأخذ أي اختبارات بعد. ابدأ بأول اختبار لك الآن! 🚀</p>
      </div>
    );
  }

  const recent = testResults.slice(0, 3);

  return (
    <div className="mb-12">
      <h3 className="text-2xl font-bold mb-4 flex items-center gap-2 justify-center text-primary-foreground">
        <BarChart3 className="h-6 w-6" />
        📊 آخر اختباراتك
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {recent.map((result: any, idx: number) => {
          const percentage = result.percentage || ((result.correctAnswers / result.totalQuestions) * 100);
          const isPassed = percentage >= 60;

          return (
            <div key={idx} className="p-4 bg-primary-foreground/15 rounded-lg border border-primary-foreground/30 hover:bg-primary-foreground/20 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <p className="font-semibold text-primary-foreground text-sm truncate">{result.testName || 'اختبار'}</p>
                  <p className="text-xs text-primary-foreground/70">{new Date(result.date).toLocaleDateString('ar-SA')}</p>
                </div>
                {isPassed ? (
                  <CheckCircle2 className="h-5 w-5 text-green-400" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-orange-400" />
                )}
              </div>
              <div className="bg-black/30 rounded-lg p-3 mb-2">
                <p className="text-2xl font-bold text-primary-foreground">{Math.round(percentage)}%</p>
                <p className="text-xs text-primary-foreground/70">{result.correctAnswers} من {result.totalQuestions}</p>
              </div>
              <Badge className={isPassed ? 'bg-green-500/30 text-green-200' : 'bg-orange-500/30 text-orange-200'}>
                {isPassed ? 'نجح ✓' : 'يحتاج تحسن'}
              </Badge>
            </div>
          );
        })}
      </div>
      <Button asChild size="sm" variant="outline" className="w-full mt-4 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/20">
        <Link href="/records">
          <TrendingUp className="h-4 w-4 ml-2" />
          عرض جميع النتائج
        </Link>
      </Button>
    </div>
  );
};

const Home: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // تحقق من حالة تسجيل الدخول
    const checkLoginStatus = () => {
      const loginStatus = localStorage.getItem("isLoggedIn") === "true";
      const userData = localStorage.getItem("user");

      setIsLoggedIn(loginStatus);
      if (userData) {
        try {
          setUser(JSON.parse(userData));
        } catch (error) {
          console.error("Error parsing user data:", error);
        }
      }
    };

    checkLoginStatus();

    // استمع لتغييرات تسجيل الدخول
    const handleStorageChange = () => {
      checkLoginStatus();
    };

    const handleUserLogin = (event: CustomEvent) => {
      setUser(event.detail);
      setIsLoggedIn(true);
    };

    // تحديث الوقت كل ثانية للتأثيرات الديناميكية
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('userLoggedIn', handleUserLogin as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('userLoggedIn', handleUserLogin as EventListener);
      clearInterval(timeInterval);
    };
  }, []);

  const isPremiumUser = user && (user.subscription?.type === 'Pro' || user.subscription?.type === 'Pro Life' || user.subscription?.type === 'Pro Life Plus' || user.subscription?.type === 'Pro Live');
  const isNightMode = currentTime.getHours() >= 18 || currentTime.getHours() <= 6;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80 overflow-hidden">
      {/* Hero Section with Advanced Creative Animation */}
      <section className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
        {/* Background Layers */}
        <div className="absolute inset-0">
          {/* Base animated background */}
          <div className="absolute inset-0 bg-gradient-to-br from-gray-950/95 via-gray-900/85 to-gray-950/90 animate-gradient-shift"></div>
          <div className="absolute inset-0 bg-gradient-to-tr from-gray-950/70 via-gray-900/60 to-gray-950/80"></div>

          {/* Interactive grid */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_50%_-200px,rgba(59,130,246,0.12),transparent)] animate-pulse"></div>
          <div className="absolute inset-0 bg-[conic-gradient(from_0deg_at_50%_50%,rgba(59,130,246,0.08)_0deg,transparent_60deg,rgba(37,99,235,0.06)_120deg,transparent_180deg,rgba(29,78,216,0.08)_240deg,transparent_300deg,rgba(59,130,246,0.08)_360deg)] animate-spin-slow"></div>

          {/* Dynamic grid pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:40px_40px] animate-pulse-slow"></div>

          {/* Floating orbs with time-based colors */}
          {[...Array(60)].map((_, i) => (
            <div
              key={`orb-${i}`}
              className="absolute rounded-full animate-float-random opacity-30"
              style={{
                width: `${3 + Math.random() * 6}px`,
                height: `${3 + Math.random() * 6}px`,
                background: isNightMode 
                  ? `radial-gradient(circle, rgba(147,51,234,${0.3 + Math.random() * 0.3}) 0%, rgba(79,70,229,${0.2 + Math.random() * 0.2}) 70%, transparent 100%)`
                  : `radial-gradient(circle, rgba(59,130,246,${0.3 + Math.random() * 0.3}) 0%, rgba(37,99,235,${0.2 + Math.random() * 0.2}) 70%, transparent 100%)`,
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 10}s`,
                animationDuration: `${8 + Math.random() * 12}s`,
                filter: `blur(${Math.random() * 2}px)`,
                boxShadow: `0 0 ${6 + Math.random() * 12}px ${isNightMode ? 'rgba(147,51,234,0.4)' : 'rgba(59,130,246,0.4)'}`
              }}
            />
          ))}

          {/* Large flowing lights */}
          {[...Array(12)].map((_, i) => (
            <div
              key={`light-${i}`}
              className="absolute rounded-full animate-float-gentle opacity-20"
              style={{
                width: `${80 + Math.random() * 150}px`,
                height: `${80 + Math.random() * 150}px`,
                background: isNightMode
                  ? `radial-gradient(circle, rgba(147,51,234,0.25) 0%, rgba(79,70,229,0.15) 40%, transparent 70%)`
                  : `radial-gradient(circle, rgba(59,130,246,0.25) 0%, rgba(37,99,235,0.15) 40%, transparent 70%)`,
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 15}s`,
                animationDuration: `${15 + Math.random() * 15}s`,
                filter: `blur(${8 + Math.random() * 15}px)`,
              }}
            />
          ))}

          {/* Interactive constellation effect */}
          {[...Array(100)].map((_, i) => (
            <div
              key={`star-${i}`}
              className="absolute h-1 w-1 bg-white/20 rounded-full animate-twinkle"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 8}s`,
                animationDuration: `${2 + Math.random() * 4}s`,
                opacity: 0.1 + Math.random() * 0.4
              }}
            />
          ))}
        </div>

        <div className="container relative px-4 md:px-6 z-10">
          {/* Premium Notifications */}
          {isPremiumUser && user && (
            <PremiumNotifications 
              userSubscription={user.subscription?.type || 'free'} 
              userName={user.name || ''} 
            />
          )}

          <div className="flex flex-col items-center space-y-12 text-center">
            {/* Enhanced Hero Header */}
            <div className="space-y-8 animate-fade-in-down">
              <div className="inline-flex items-center gap-8 justify-center">
                <div className="relative group">
                  {isNightMode ? (
                    <Moon className="h-12 w-12 text-green-400 animate-bounce drop-shadow-2xl group-hover:scale-110 transition-transform" />
                  ) : (
                    <Sun className="h-12 w-12 text-yellow-400 animate-bounce drop-shadow-2xl group-hover:scale-110 transition-transform" />
                  )}
                  <div className="absolute inset-0 h-12 w-12 bg-current rounded-full animate-ping opacity-30"></div>
                  <div className="absolute -inset-2 bg-gradient-to-r from-green-400/20 to-emerald-400/20 rounded-full animate-pulse"></div>
                </div>

                <div className="relative group">
                  <h1 className="text-6xl md:text-8xl font-black tracking-tighter bg-gradient-to-r from-green-300 via-emerald-200 to-teal-300 bg-clip-text text-transparent drop-shadow-2xl group-hover:scale-105 transition-transform duration-500">
                    منصة قدراتك
                  </h1>
                  <div className="absolute inset-0 text-6xl md:text-8xl font-black bg-gradient-to-r from-green-400/30 via-emerald-300/30 to-teal-400/30 bg-clip-text text-transparent blur-sm animate-pulse"></div>
                </div>

                <div className="relative group">
                  <Rocket className="h-12 w-12 text-cyan-400 animate-bounce drop-shadow-2xl group-hover:scale-110 transition-transform group-hover:rotate-12" />
                  <div className="absolute inset-0 h-12 w-12 bg-cyan-400/30 rounded-full animate-ping"></div>
                  <div className="absolute -inset-2 bg-gradient-to-r from-cyan-400/20 to-blue-400/20 rounded-full animate-pulse"></div>
                </div>
              </div>

              <div className="relative mx-auto max-w-[900px] group">
                <p className="text-blue-100 md:text-2xl lg:text-3xl leading-relaxed font-medium drop-shadow-2xl group-hover:text-blue-50 transition-colors duration-300">
                  منصة تعليمية متطورة ومبتكرة للتحضير لاختبارات القدرات الأكاديمية
                  <br />
                  <span className="bg-gradient-to-r from-cyan-200 to-blue-200 bg-clip-text text-transparent font-bold drop-shadow-xl">
                    بتقنيات حديثة متطورة وواجهة عربية فاخرة
                  </span>
                </p>
                <div className="absolute -inset-6 bg-gradient-to-r from-green-500/10 via-emerald-500/5 to-teal-500/10 rounded-2xl blur-xl animate-pulse-slow"></div>
              </div>

              {/* Time-based greeting */}
              <div className="flex items-center gap-4 text-blue-200/80 animate-fade-in">
                {isNightMode ? (
                  <>
                    <Stars className="h-5 w-5 animate-spin-slow" />
                    <span>🌙 مساء الخير، وقت مثالي للدراسة والتركيز</span>
                    <Stars className="h-5 w-5 animate-spin-slow" />
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5 animate-pulse" />
                    <span>☀️ صباح الخير، ابدأ يومك بالتعلم والإنجاز</span>
                    <Sparkles className="h-5 w-5 animate-pulse" />
                  </>
                )}
              </div>
            </div>

            {/* Enhanced Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-6 animate-fade-in">
              <Button asChild size="lg" className="group relative overflow-hidden bg-gradient-to-r from-green-700 via-green-600 to-emerald-600 hover:from-green-600 hover:to-emerald-500 hover:scale-110 transition-all duration-500 shadow-2xl hover:shadow-green-500/50 min-w-[250px] py-6 text-xl font-bold border-0">
                <Link href="/qiyas">
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute -inset-1 bg-gradient-to-r from-green-700 to-emerald-600 rounded-lg blur opacity-40 group-hover:opacity-70 transition-opacity -z-10"></div>
                  <GraduationCapIcon className="ml-3 h-7 w-7 group-hover:rotate-12 transition-transform drop-shadow-lg" />
                  ابدأ اختبار قياس
                  <Sparkles className="mr-3 h-5 w-5 animate-pulse" />
                </Link>
              </Button>

              <Button asChild variant="outline" size="lg" className="group relative overflow-hidden border-2 border-blue-400/60 bg-blue-950/40 backdrop-blur-sm hover:bg-blue-900/60 hover:border-cyan-400/80 hover:scale-110 transition-all duration-500 shadow-xl hover:shadow-cyan-500/40 min-w-[250px] py-6 text-xl font-bold text-blue-100">
                <Link href="/abilities">
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/15 to-blue-500/15 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/30 to-blue-500/30 rounded-lg blur opacity-30 group-hover:opacity-60 transition-opacity -z-10"></div>
                  <BrainCircuitIcon className="ml-3 h-7 w-7 group-hover:rotate-12 transition-transform drop-shadow-lg" />
                  اختبر قدراتك
                  <Target className="mr-3 h-5 w-5 animate-pulse" />
                </Link>
              </Button>
            </div>

            {/* Live Statistics */}
            <div className="flex flex-wrap justify-center gap-6 animate-fade-in mt-8">
              {["🎯", "🚀", "⭐", "🏆"].map((emoji, index) => (
                <div key={index} className="flex items-center gap-2 text-blue-200/80">
                  <span className="text-2xl animate-bounce" style={{animationDelay: `${index * 0.2}s`}}>{emoji}</span>
                  <span className="font-medium">+{Math.floor(Math.random() * 100)} متعلم اليوم</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Statistics Section with Interactive Cards */}
      <section className="py-20 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 relative overflow-hidden">
        <div className="absolute inset-0">
          {/* Animated background pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_500px_at_50%_200px,rgba(59,130,246,0.1),transparent)]"></div>
          <div className="absolute inset-0 bg-grid-white/5 bg-[size:30px_30px] animate-pulse-slow" />

          {/* Floating elements */}
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute h-2 w-2 bg-primary/20 rounded-full animate-float"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${3 + Math.random() * 4}s`,
              }}
            />
          ))}
        </div>

        <div className="container px-4 md:px-6 relative">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent animate-fade-in">
              🚀 إحصائيات مذهلة
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto animate-fade-in">
              أرقام تتحدث عن جودة المحتوى وتميز الخدمة
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 animate-fade-in">
            {statisticsData.map((stat, index) => (
              <div key={index} 
                className="group relative flex flex-col items-center justify-center p-8 bg-gradient-to-br from-card/95 to-card/90 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 backdrop-blur-sm border border-border/50 hover:border-primary/30"
                style={{animationDelay: `${index * 0.2}s`}}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className={`p-4 rounded-full bg-gradient-to-br from-background to-background/80 mb-4 group-hover:scale-110 transition-transform duration-300 ${stat.color}`}>
                  <stat.icon className="h-8 w-8" />
                </div>
                <h3 className="text-4xl font-black mb-2 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent group-hover:scale-110 transition-transform duration-300">{stat.value}</h3>
                <p className="text-muted-foreground text-sm font-medium group-hover:text-primary transition-colors duration-300 text-center">{stat.label}</p>

                {/* Sparkle effect */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced Features Section with Advanced Cards */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background/90 to-background/80"></div>

        <div className="container px-4 md:px-6 relative">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
              ✨ اكتشف إمكانياتك
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              أدوات متطورة ومحتوى تفاعلي لرحلة تعليمية استثنائية
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 animate-fade-in">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className={`group relative p-0 hover:shadow-2xl transition-all duration-500 border-2 ${feature.accent} bg-gradient-to-br from-background/95 to-background/90 overflow-hidden backdrop-blur-sm hover:-translate-y-2 card-touch tap-highlight-none hover:border-primary/50`}
                style={{
                  animation: `floating-3d ${4 + index * 0.5}s ease-in-out infinite`,
                  animationDelay: `${index * 0.3}s`,
                }}
              >
                {/* Animated background gradient */}
                <div className={`absolute inset-0 bg-gradient-to-r ${feature.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
                <div className={`absolute inset-0 bg-gradient-to-r ${feature.hoverGradient} opacity-0 group-hover:opacity-5 transition-opacity duration-700`} />

                {/* Shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>

                <CardHeader className="relative z-10 p-6">
                  <div className={`p-4 w-16 h-16 rounded-2xl ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                    <feature.icon className="h-8 w-8 text-foreground group-hover:rotate-12 transition-transform duration-300" />
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                  <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors duration-300 mb-3">{feature.title}</CardTitle>
                </CardHeader>

                <CardContent className="relative z-10 px-6 pb-4">
                  <CardDescription className="text-sm text-muted-foreground group-hover:text-muted-foreground/90 transition-colors duration-300 leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>

                <CardFooter className="relative z-10 p-6 pt-2">
                  <Button asChild variant="ghost" className="w-full justify-between group/btn hover:bg-primary/10 transition-all duration-300 font-medium">
                    <Link href={feature.href}>
                      <span className="flex items-center gap-2">
                        <Rocket className="h-4 w-4" />
                        استكشف
                      </span>
                      <ArrowRightIcon className="h-4 w-4 mr-1 transition-transform group-hover/btn:translate-x-1 duration-300" />
                    </Link>
                  </Button>
                </CardFooter>

                {/* Corner decoration */}
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="w-3 h-3 bg-primary/30 rounded-full animate-ping"></div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* اختبار قدراتك التأهيلي Section */}
      <section className="py-24 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_1200px_at_50%_-100px,rgba(59,130,246,0.2),transparent)]" />
          <div className="absolute inset-0 bg-[conic-gradient(from_0deg_at_50%_50%,rgba(147,51,234,0.12)_0%,transparent_60%)] animate-spin-slow" />

          {/* Floating particles */}
          {[...Array(40)].map((_, i) => (
            <div
              key={`qual-particle-${i}`}
              className="absolute rounded-full bg-blue-400/20 animate-float"
              style={{
                width: `${2 + Math.random() * 4}px`,
                height: `${2 + Math.random() * 4}px`,
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 8}s`,
                animationDuration: `${6 + Math.random() * 8}s`,
              }}
            />
          ))}
        </div>

        <div className="container px-4 md:px-6 relative">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-3 bg-blue-500/20 backdrop-blur-sm px-6 py-3 rounded-full mb-6 border border-green-400/30">
                <GraduationCapIcon className="h-6 w-6 text-blue-300 animate-pulse" />
                <span className="text-blue-100 font-semibold">اختبار قدراتك التأهيلي</span>
                <Sparkles className="h-5 w-5 text-yellow-300 animate-spin-slow" />
              </div>

              <h2 className="text-5xl md:text-6xl font-black mb-6 bg-gradient-to-r from-green-200 via-emerald-200 to-teal-200 bg-clip-text text-transparent">
                🎯 اختبار تأهيلي شامل
              </h2>

              <p className="text-xl md:text-2xl text-blue-100 mb-4 max-w-4xl mx-auto leading-relaxed">
                اختبار تأهيلي شامل يتكون من سبعة أقسام متنوعة بين اللفظي والكمي
              </p>

              <p className="text-lg text-blue-200/80 max-w-3xl mx-auto">
                يتضمن <span className="text-yellow-300 font-bold">20 سؤالاً تجريبياً</span> غير محسوب للمساعدة • متاح مجاناً كل يومين
              </p>
            </div>

            {/* Exam Details Card */}
            <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md rounded-3xl p-8 md:p-12 border border-white/20 shadow-2xl mb-8">
              {/* Important Notice */}
              <div className="bg-yellow-500/20 backdrop-blur-sm border-2 border-yellow-400/40 rounded-2xl p-6 mb-8">
                <div className="flex items-start gap-4">
                  <div className="bg-yellow-400/30 p-3 rounded-xl">
                    <Zap className="h-8 w-8 text-yellow-200" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-yellow-100 mb-3">هام جداً</h3>
                    <p className="text-yellow-50/90 leading-relaxed text-lg">
                      هذا الاختبار يحاكي اختبار قياس الرسمي من حيث البنية والتوقيت. اتبع التعليمات بدقة للحصول على تجربة واقعية.
                    </p>
                  </div>
                </div>
              </div>

              {/* Trial Questions Info */}
              <div className="bg-blue-500/15 backdrop-blur-sm border border-green-400/30 rounded-2xl p-6 mb-8">
                <div className="flex items-start gap-4">
                  <div className="bg-blue-400/30 p-3 rounded-xl">
                    <HelpCircleIcon className="h-7 w-7 text-blue-200" />
                  </div>
                  <div className="flex-1">
                    <p className="text-blue-50 leading-relaxed text-lg">
                      هذا الاختبار يحتوي على <span className="text-cyan-300 font-bold">20 أسئلة تجريبية</span> موزعة عشوائياً. 
                      هذه الأسئلة <span className="text-yellow-300 font-semibold">لا تؤثر على نتيجتك النهائية</span> وهي لمساعدتك على التعود على أنواع مختلفة من الأسئلة. 
                      <span className="text-pink-300 font-medium">لن تعرف أي الأسئلة تجريبية أثناء الحل.</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Exam Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gradient-to-br from-green-700/30 to-emerald-600/30 backdrop-blur-sm rounded-2xl p-6 border border-green-400/30 text-center">
                  <div className="bg-blue-400/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FolderIcon className="h-8 w-8 text-blue-200" />
                  </div>
                  <div className="text-4xl font-black text-blue-100 mb-2">7</div>
                  <div className="text-blue-200">أقسام متنوعة</div>
                </div>

                <div className="bg-gradient-to-br from-green-600/30 to-teal-600/30 backdrop-blur-sm rounded-2xl p-6 border border-green-400/30 text-center">
                  <div className="bg-green-400/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Target className="h-8 w-8 text-green-200" />
                  </div>
                  <div className="text-4xl font-black text-green-100 mb-2">120</div>
                  <div className="text-green-200">سؤال شامل</div>
                </div>

                <div className="bg-gradient-to-br from-cyan-600/30 to-teal-600/30 backdrop-blur-sm rounded-2xl p-6 border border-cyan-400/30 text-center">
                  <div className="bg-cyan-400/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Clock className="h-8 w-8 text-cyan-200" />
                  </div>
                  <div className="text-4xl font-black text-cyan-100 mb-2">120</div>
                  <div className="text-cyan-200">دقيقة زمن</div>
                </div>
              </div>

              {/* Sections Table */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/20">
                <div className="bg-gradient-to-r from-green-700/40 to-emerald-600/40 px-6 py-4">
                  <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                    <BarChart3 className="h-6 w-6" />
                    جدول الأقسام
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-white/5">
                      <tr>
                        <th className="px-6 py-4 text-right text-blue-100 font-bold">القسم</th>
                        <th className="px-6 py-4 text-right text-blue-100 font-bold">النوع</th>
                        <th className="px-6 py-4 text-center text-blue-100 font-bold">عدد الأسئلة</th>
                        <th className="px-6 py-4 text-center text-blue-100 font-bold">الوقت (دقائق)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      <tr className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 text-blue-100 font-medium">القسم الأول</td>
                        <td className="px-6 py-4 text-green-200">مختلط</td>
                        <td className="px-6 py-4 text-center text-cyan-200 font-bold">24</td>
                        <td className="px-6 py-4 text-center text-cyan-200 font-bold">24</td>
                      </tr>
                      <tr className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 text-blue-100 font-medium">القسم الثاني</td>
                        <td className="px-6 py-4 text-green-200">مختلط</td>
                        <td className="px-6 py-4 text-center text-cyan-200 font-bold">24</td>
                        <td className="px-6 py-4 text-center text-cyan-200 font-bold">24</td>
                      </tr>
                      <tr className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 text-blue-100 font-medium">القسم الثالث</td>
                        <td className="px-6 py-4 text-green-200">مختلط</td>
                        <td className="px-6 py-4 text-center text-cyan-200 font-bold">24</td>
                        <td className="px-6 py-4 text-center text-cyan-200 font-bold">24</td>
                      </tr>
                      <tr className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 text-blue-100 font-medium">قدرات كمية</td>
                        <td className="px-6 py-4 text-green-200">كمي</td>
                        <td className="px-6 py-4 text-center text-cyan-200 font-bold">11</td>
                        <td className="px-6 py-4 text-center text-cyan-200 font-bold">11</td>
                      </tr>
                      <tr className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 text-blue-100 font-medium">قدرات لفظية</td>
                        <td className="px-6 py-4 text-orange-200">لفظي</td>
                        <td className="px-6 py-4 text-center text-cyan-200 font-bold">13</td>
                        <td className="px-6 py-4 text-center text-cyan-200 font-bold">13</td>
                      </tr>
                      <tr className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 text-blue-100 font-medium">قدرات كمية</td>
                        <td className="px-6 py-4 text-green-200">كمي</td>
                        <td className="px-6 py-4 text-center text-cyan-200 font-bold">11</td>
                        <td className="px-6 py-4 text-center text-cyan-200 font-bold">11</td>
                      </tr>
                      <tr className="hover:bg-white/5 transition-colors bg-blue-500/10">
                        <td className="px-6 py-4 text-blue-100 font-medium">قدرات لفظية</td>
                        <td className="px-6 py-4 text-orange-200">لفظي</td>
                        <td className="px-6 py-4 text-center text-cyan-200 font-bold">13</td>
                        <td className="px-6 py-4 text-center text-cyan-200 font-bold">13</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Button asChild size="lg" className="group relative overflow-hidden bg-gradient-to-r from-green-700 via-green-600 to-emerald-600 hover:from-green-600 hover:to-emerald-500 hover:scale-110 transition-all duration-500 shadow-2xl hover:shadow-green-500/50 min-w-[280px] py-7 text-xl font-bold border-0">
                <Link href="/paper-exam">
                  <div className="absolute inset-0 bg-gradient-to-r from-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute -inset-1 bg-gradient-to-r from-green-700 to-emerald-600 rounded-lg blur opacity-50 group-hover:opacity-100 transition-opacity -z-10"></div>
                  <Download className="ml-3 h-7 w-7 group-hover:rotate-12 transition-transform drop-shadow-lg" />
                  إعداد الاختبار الورقي
                  <Sparkles className="mr-3 h-6 w-6 animate-pulse" />
                </Link>
              </Button>

              <Button asChild variant="outline" size="lg" className="group relative overflow-hidden border-3 border-cyan-400/70 bg-cyan-950/50 backdrop-blur-sm hover:bg-cyan-900/70 hover:border-cyan-300 hover:scale-110 transition-all duration-500 shadow-xl hover:shadow-cyan-500/50 min-w-[280px] py-7 text-xl font-bold text-cyan-100">
                <Link href="/qiyas">
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/40 to-blue-500/40 rounded-lg blur opacity-30 group-hover:opacity-70 transition-opacity -z-10"></div>
                  <Rocket className="ml-3 h-7 w-7 group-hover:rotate-12 transition-transform drop-shadow-lg" />
                  بدء الاختبار الإلكتروني
                  <Trophy className="mr-3 h-6 w-6 animate-bounce" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gradient-to-br from-primary/5 to-primary/10 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_600px_at_50%_300px,rgba(59,130,246,0.1),transparent)]"></div>
        </div>

        <div className="container px-4 md:px-6 relative">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              💬 قالوا عنا
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              شهادات حقيقية من متعلمين حققوا نجاحات مميزة
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="group relative p-6 bg-gradient-to-br from-background/95 to-background/90 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border-2 border-border/50 hover:border-primary/30">
                <CardContent className="p-0">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="text-3xl animate-bounce" style={{animationDelay: `${index * 0.2}s`}}>
                      {testimonial.avatar}
                    </div>
                    <div>
                      <h4 className="font-bold text-lg">{testimonial.name}</h4>
                      <div className="flex gap-1">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <span key={i} className="text-yellow-400 animate-pulse" style={{animationDelay: `${i * 0.1}s`}}>⭐</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-muted-foreground italic">"{testimonial.text}"</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>



      {/* Gamification and Analytics sections for logged users */}
      {isLoggedIn && user && (
        <>
          {/* الهدف اليومي */}
          <section className="py-10 bg-white dark:bg-gray-950">
            <div className="container px-4 md:px-6">
              <div className="max-w-md mx-auto space-y-4">
                <DailyGoalWidget userId={user?.id} />
                <ActivityHeatmap userId={user?.id} />
              </div>
            </div>
          </section>

          {/* نظام التحفيز والألعاب */}
          <section className="py-20 bg-gradient-to-br from-gray-50 to-green-50 dark:from-gray-950/30 dark:to-green-950/30 relative overflow-hidden">
            <div className="absolute inset-0">
              {[...Array(30)].map((_, i) => (
                <div
                  key={i}
                  className="absolute h-1 w-1 bg-blue-400/30 rounded-full animate-float"
                  style={{
                    top: `${Math.random() * 100}%`,
                    left: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 5}s`,
                    animationDuration: `${3 + Math.random() * 4}s`,
                  }}
                />
              ))}
            </div>

            <div className="container px-4 md:px-6 relative">
              <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r gray-800 dark:text-white">
                  🎮 مركز التحفيز والإنجازات
                </h2>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                  تابع تقدمك، اكسب النقاط، وحقق الإنجازات مع نظام التحفيز المتطور
                </p>
              </div>
              <GameificationSystem userId={user?.id} />
            </div>
          </section>

          {/* لوحة التحليلات التفاعلية */}
          <section className="py-20 bg-gradient-to-br from-green-50 to-teal-100 dark:from-green-950/30 dark:to-teal-950/30 relative overflow-hidden">
            <div className="absolute inset-0">
              {[...Array(25)].map((_, i) => (
                <div
                  key={i}
                  className="absolute h-2 w-2 bg-green-400/20 rounded-full animate-float-gentle"
                  style={{
                    top: `${Math.random() * 100}%`,
                    left: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 8}s`,
                    animationDuration: `${5 + Math.random() * 6}s`,
                  }}
                />
              ))}
            </div>

            <div className="container px-4 md:px-6 relative">
              <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
                  📊 تحليلات ذكية لأدائك
                </h2>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                  اكتشف نقاط قوتك وضعفك مع رسوم بيانية تفاعلية وتحليلات متقدمة
                </p>
              </div>
              <InteractiveAnalytics userId={user?.id} />
            </div>
          </section>
        </>
      )}

      {/* Enhanced CTA Section */}
      {isPremiumUser && user ? (
        <section className="py-24 bg-gradient-to-br from-amber-600 via-yellow-500 to-orange-500 text-white relative overflow-hidden">
          {/* Premium Background Effects */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-[radial-gradient(circle_1200px_at_50%_-100px,rgba(255,255,255,0.3),transparent)] opacity-40" />
            <div className="absolute inset-0 bg-[conic-gradient(from_0deg_at_50%_50%,rgba(255,255,255,0.15)_0%,transparent_60%)] animate-spin-slow" />

            {/* Premium floating elements */}
            {[...Array(30)].map((_, i) => (
              <div
                key={i}
                className="absolute rounded-full animate-float"
                style={{
                  width: `${2 + Math.random() * 4}px`,
                  height: `${2 + Math.random() * 4}px`,
                  background: 'rgba(255,255,255,0.4)',
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 8}s`,
                  animationDuration: `${4 + Math.random() * 6}s`,
                  boxShadow: '0 0 10px rgba(255,255,255,0.5)'
                }}
              />
            ))}
          </div>

          <div className="container px-4 md:px-6 text-center relative">
            <PremiumDashboard user={user} />

            {/* VIP Action Section */}
            <div className="mt-16 p-10 bg-white/15 backdrop-blur-sm rounded-3xl border border-white/30 shadow-2xl">
              <div className="flex justify-center mb-8">
                {user.subscription?.type === 'Pro Life' ? (
                  <div className="relative">
                    <DiamondIcon className="h-20 w-20 text-white animate-pulse drop-shadow-2xl" />
                    <div className="absolute inset-0 h-20 w-20 bg-white/30 rounded-full animate-ping"></div>
                  </div>
                ) : (
                  <div className="relative">
                    <CrownIcon className="h-20 w-20 text-white animate-bounce drop-shadow-2xl" />
                    <div className="absolute inset-0 h-20 w-20 bg-white/30 rounded-full animate-pulse"></div>
                  </div>
                )}
              </div>

              <h3 className="text-3xl md:text-4xl font-bold mb-6 drop-shadow-lg">🌟 أنت مستخدم VIP</h3>
              <p className="text-xl mb-8 opacity-95 max-w-2xl mx-auto leading-relaxed">
                {user.subscription?.type === 'Pro Life' 
                  ? "عضويتك الماسية تمنحك امتيازات لا محدودة مدى الحياة - استمتع بتجربة التعلم الأكثر تطوراً"
                  : "عضويتك الذهبية تفتح لك عالماً من الإمكانيات المتقدمة - اكتشف قدراتك الحقيقية"
                }
              </p>

              <div className="flex flex-col sm:flex-row gap-6 justify-center">
                <Button asChild size="lg" className="min-w-[250px] bg-white text-amber-600 hover:bg-amber-50 hover:scale-105 transition-all font-bold shadow-2xl text-lg py-4">
                  <Link href="/records">
                    <TrophyIcon className="ml-3 h-6 w-6" />
                    📊 سجل الإنجازات الذهبية
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="min-w-[250px] border-2 border-white text-white hover:bg-white hover:text-amber-600 hover:scale-105 transition-all font-bold text-lg py-4">
                  <Link href="/challenges">
                    <FlameIcon className="ml-3 h-6 w-6" />
                    🏆 التحديات الحصرية
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className="py-20 bg-gradient-to-br from-primary/95 to-primary text-primary-foreground relative overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_50%_-100px,var(--primary-foreground),transparent)] opacity-30" />

            {/* Animated background elements */}
            {[...Array(40)].map((_, i) => (
              <div
                key={i}
                className="absolute h-1 w-1 bg-primary-foreground/20 rounded-full animate-float"
                style={{
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 10}s`,
                  animationDuration: `${5 + Math.random() * 8}s`,
                }}
              />
            ))}
          </div>

          <div className="container px-4 md:px-6 text-center relative">
            {isLoggedIn && user ? (
              <>
                <div className="relative mb-8">
                  <User className="h-16 w-16 mx-auto mb-6 animate-pulse text-primary-foreground/90 drop-shadow-lg" />
                  <div className="absolute inset-0 h-16 w-16 mx-auto bg-primary-foreground/20 rounded-full animate-ping"></div>
                </div>

                <h2 className="text-4xl md:text-5xl font-bold mb-6 drop-shadow-lg">مرحباً بك، {user.name || user.username}! 👋</h2>
                <p className="mb-12 max-w-[700px] mx-auto opacity-95 text-lg leading-relaxed">
                  استمر في رحلتك التعليمية واكتشف المزيد من الاختبارات والتحديات المصممة خصيصاً لك
                </p>

                <RecentTestResults userId={user.id} />

                <div className="mb-12 p-8 bg-primary-foreground/15 rounded-2xl border border-primary-foreground/30 backdrop-blur-sm shadow-xl">
                  <h3 className="text-2xl font-bold mb-6 flex items-center justify-center gap-3">
                    <DiamondIcon className="h-8 w-8 animate-pulse" />
                    💎 ترقية إلى Pro للحصول على
                    <DiamondIcon className="h-8 w-8 animate-pulse" />
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-lg">
                    <div className="flex items-center gap-3 justify-center md:justify-start">
                      <CrownIcon className="h-6 w-6 animate-bounce" />
                      <span>اختبارات لا محدودة</span>
                    </div>
                    <div className="flex items-center gap-3 justify-center md:justify-start">
                      <TrophyIcon className="h-6 w-6 animate-bounce" style={{animationDelay: '0.2s'}} />
                      <span>تحديات حصرية</span>
                    </div>
                    <div className="flex items-center gap-3 justify-center md:justify-start">
                      <BookOpenIcon className="h-6 w-6 animate-bounce" style={{animationDelay: '0.4s'}} />
                      <span>مكتبة متقدمة</span>
                    </div>
                    <div className="flex items-center gap-3 justify-center md:justify-start">
                      <RocketIcon className="h-6 w-6 animate-bounce" style={{animationDelay: '0.6s'}} />
                      <span>دعم أولوية</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-6 justify-center">
                  <Button asChild size="lg" variant="secondary" className="min-w-[250px] hover:scale-105 transition-transform text-lg py-4 font-bold shadow-xl">
                    <Link href="/records">
                      <Target className="ml-3 h-6 w-6" />
                      عرض سجل الاختبارات
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="min-w-[250px] hover:scale-105 transition-transform border-2 border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary text-lg py-4 font-bold">
                    <Link href="/profile">
                      <CrownIcon className="ml-3 h-6 w-6" />
                      ترقية إلى Pro 👑
                    </Link>
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="relative mb-8">
                  <Zap className="h-16 w-16 mx-auto mb-6 animate-pulse text-primary-foreground/90 drop-shadow-lg" />
                  <div className="absolute inset-0 h-16 w-16 mx-auto bg-primary-foreground/30 rounded-full animate-ping"></div>
                </div>

                <h2 className="text-4xl md:text-5xl font-bold mb-6 drop-shadow-lg">ابدأ رحلتك نحو التميز 🚀</h2>
                <p className="mb-12 max-w-[700px] mx-auto opacity-95 text-lg leading-relaxed">
                  سجل حساب مجاني الآن واحصل على تجربة تعليمية متكاملة مع متابعة تقدمك وتحسين مستواك بطريقة علمية ممتعة
                </p>

                <Button asChild size="lg" variant="secondary" className="min-w-[250px] hover:scale-105 transition-transform text-lg py-4 font-bold shadow-2xl">
                  <Link href="/profile">
                    <HeartIcon className="ml-3 h-6 w-6 animate-pulse" />
                    سجل الآن مجاناً
                  </Link>
                </Button>
              </>
            )}
          </div>
        </section>
      )}
    </div>
  );
};

export default Home;
