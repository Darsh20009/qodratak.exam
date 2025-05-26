import React, { useState, useEffect } from "react";
import { Link } from "wouter";
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
  RocketIcon
} from "lucide-react";
import { SubscriptionPlans } from "@/components/SubscriptionPlans";
import { PremiumDashboard } from "@/components/PremiumDashboard";
import { PremiumNotifications } from "@/components/PremiumNotifications";
import { GameificationSystem } from "@/components/GameificationSystem";
import { InteractiveAnalytics } from "@/components/InteractiveAnalytics";
import { SmartNotifications } from "@/components/SmartNotifications";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const features = [
  {
    title: "اختبارات قياس",
    description: "محاكاة دقيقة لاختبار هيئة تقويم التعليم - 120 سؤال في 120 دقيقة مع تقييم فوري ونصائح للتحسين",
    icon: GraduationCapIcon,
    href: "/qiyas",
    color: "bg-blue-500/10 dark:bg-blue-500/20",
    gradient: "from-blue-500 to-blue-600"
  },
  {
    title: "اختبر قدراتك",
    description: "تحديات تفاعلية متدرجة الصعوبة لتطوير مهاراتك اللفظية والكمية، مع نظام مكافآت ومستويات تحفيزية",
    icon: BrainCircuitIcon,
    href: "/abilities",
    color: "bg-green-500/10 dark:bg-green-500/20",
    gradient: "from-green-500 to-green-600"
  },
  {
    title: "اسأل سؤال",
    description: "احصل على إجابات دقيقة وشرح مفصل من قاعدة بيانات تضم أكثر من 10,000 سؤال وإجابة",
    icon: HelpCircleIcon,
    href: "/ask",
    color: "bg-purple-500/10 dark:bg-purple-500/20",
    gradient: "from-purple-500 to-purple-600"
  },
  {
    title: "المكتبة",
    description: "مكتبة شاملة من الأسئلة والشروحات مصنفة حسب المستوى والموضوع، مع أمثلة وتدريبات إضافية",
    icon: BookOpenIcon,
    href: "/library",
    color: "bg-orange-500/10 dark:bg-orange-500/20",
    gradient: "from-orange-500 to-orange-600"
  }
];

const statisticsData = [
  { value: "+10,000", label: "سؤال وإجابة", icon: Target },
  { value: "4", label: "لهجات مدعومة", icon: Sparkles },
  { value: "7", label: "أقسام اختبارية", icon: BrainCircuitIcon },
  { value: "∞", label: "فرص للتعلم", icon: Trophy }
];

const Home: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<any>(null);

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

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('userLoggedIn', handleUserLogin as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('userLoggedIn', handleUserLogin as EventListener);
    };
  }, []);

  const isPremiumUser = user && (user.subscription?.type === 'Pro' || user.subscription?.type === 'Pro Life' || user.subscription?.type === 'Pro Live');

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80">
      {/* Hero Section with Deep Blue Creative Animation */}
      <section className="relative overflow-hidden py-20 sm:py-32 min-h-screen flex items-center bg-gradient-to-b from-slate-950 via-blue-950 to-indigo-950">
        <div className="absolute inset-0">
          {/* خلفية غامقة جداً مع تدرجات زرقاء عميقة */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950/90 via-blue-950/80 to-indigo-950/90 animate-gradient-shift"></div>
          <div className="absolute inset-0 bg-gradient-to-tr from-gray-950/60 via-blue-950/50 to-slate-950/70 animate-pulse-slow"></div>
          
          {/* تأثير الشبكة المضيئة الخافتة */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_1200px_at_50%_-200px,rgba(59,130,246,0.08),transparent)] animate-pulse"></div>
          <div className="absolute inset-0 bg-[conic-gradient(from_0deg_at_50%_50%,rgba(59,130,246,0.05)_0deg,transparent_60deg,rgba(37,99,235,0.04)_120deg,transparent_180deg,rgba(29,78,216,0.06)_240deg,transparent_300deg,rgba(59,130,246,0.05)_360deg)] animate-spin-slow"></div>
          
          {/* شبكة مضيئة خافتة */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.015)_1px,transparent_1px)] bg-[size:60px_60px]"></div>
          
          {/* جسيمات متحركة مضيئة خافتة */}
          {[...Array(40)].map((_, i) => (
            <div
              key={`star-${i}`}
              className="absolute rounded-full animate-float-random"
              style={{
                width: `${2 + Math.random() * 4}px`,
                height: `${2 + Math.random() * 4}px`,
                background: `radial-gradient(circle, rgba(59,130,246,${0.2 + Math.random() * 0.2}) 0%, rgba(37,99,235,${0.1 + Math.random() * 0.15}) 70%, transparent 100%)`,
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 8}s`,
                animationDuration: `${6 + Math.random() * 8}s`,
                filter: `blur(${Math.random() * 1}px)`,
                boxShadow: `0 0 ${4 + Math.random() * 8}px rgba(59,130,246,${0.1 + Math.random() * 0.2})`
              }}
            />
          ))}
          
          {/* أضواء متحركة كبيرة خافتة */}
          {[...Array(8)].map((_, i) => (
            <div
              key={`light-${i}`}
              className="absolute rounded-full animate-float-gentle opacity-10"
              style={{
                width: `${50 + Math.random() * 100}px`,
                height: `${50 + Math.random() * 100}px`,
                background: `radial-gradient(circle, rgba(59,130,246,0.15) 0%, rgba(37,99,235,0.08) 40%, transparent 70%)`,
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 10}s`,
                animationDuration: `${10 + Math.random() * 10}s`,
                filter: `blur(${5 + Math.random() * 10}px)`,
              }}
            />
          ))}
        </div>

        {/* الجزيئات المتحركة الخافتة */}
        <div className="absolute inset-0">
          {[...Array(50)].map((_, i) => (
            <div
              key={`particle-${i}`}
              className="absolute h-1 w-1 bg-blue-400/20 rounded-full animate-float-particle backdrop-blur-sm"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 7}s`,
                animationDuration: `${5 + Math.random() * 5}s`,
                filter: `blur(${Math.random() * 2}px)`,
                transform: `scale(${1 + Math.random()})`,
                opacity: 0.1 + Math.random() * 0.3
              }}
            />
          ))}
        </div>

        <div className="container relative px-4 md:px-6">
          {/* Premium Notifications */}
          {isPremiumUser && user && (
            <PremiumNotifications 
              userSubscription={user.subscription?.type || 'free'} 
              userName={user.name || ''} 
            />
          )}

          <div className="flex flex-col items-center space-y-8 text-center">
            <div className="space-y-6 animate-fade-in-down">
              <div className="inline-flex items-center gap-6 justify-center">
                <div className="relative">
                  <Rocket className="h-10 w-10 text-blue-400 animate-bounce drop-shadow-lg" />
                  <div className="absolute inset-0 h-10 w-10 bg-blue-400/30 rounded-full animate-ping"></div>
                </div>
                <h1 className="text-5xl font-bold tracking-tighter sm:text-6xl md:text-7xl bg-gradient-to-r from-blue-300 via-cyan-200 to-indigo-300 bg-clip-text text-transparent drop-shadow-2xl">
                  منصة قدراتك
                </h1>
                <div className="relative">
                  <Stars className="h-10 w-10 text-cyan-400 animate-spin-slow drop-shadow-lg" />
                  <div className="absolute inset-0 h-10 w-10 bg-cyan-400/20 rounded-full animate-pulse"></div>
                </div>
              </div>
              
              <div className="relative mx-auto max-w-[800px]">
                <p className="text-blue-100 md:text-xl leading-relaxed font-medium drop-shadow-2xl">
                  منصتك الشاملة للتحضير لاختبارات قياس وتطوير مهاراتك اللفظية والكمية
                  <br />
                  <span className="bg-gradient-to-r from-cyan-200 to-blue-200 bg-clip-text text-transparent font-bold drop-shadow-xl">
                    بأسلوب تفاعلي ومتطور مع تقنيات الذكاء الاصطناعي
                  </span>
                </p>
                <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/5 via-cyan-500/3 to-indigo-500/5 rounded-xl blur-xl animate-pulse-slow"></div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-6 animate-fade-in">
              <Button asChild size="lg" className="group relative overflow-hidden bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 hover:scale-110 transition-all duration-300 shadow-2xl hover:shadow-blue-500/50 min-w-[200px] py-4 text-lg font-bold border-0">
                <Link href="/qiyas">
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <GraduationCapIcon className="ml-3 h-6 w-6 group-hover:rotate-12 transition-transform drop-shadow-lg" />
                  ابدأ اختبار قياس
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-lg blur opacity-30 group-hover:opacity-60 transition-opacity -z-10"></div>
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="group relative overflow-hidden border-2 border-blue-400/50 bg-blue-950/30 backdrop-blur-sm hover:bg-blue-900/50 hover:border-cyan-400/70 hover:scale-110 transition-all duration-300 shadow-xl hover:shadow-cyan-500/30 min-w-[200px] py-4 text-lg font-bold text-blue-100">
                <Link href="/abilities">
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <BrainCircuitIcon className="ml-3 h-6 w-6 group-hover:rotate-12 transition-transform drop-shadow-lg" />
                  اختبر قدراتك
                  <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-lg blur opacity-20 group-hover:opacity-50 transition-opacity -z-10"></div>
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Statistics Section */}
      <section className="py-16 bg-primary/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/5 bg-[size:20px_20px]" />
        <div className="container px-4 md:px-6 relative">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 animate-fade-in">
            {statisticsData.map((stat, index) => (
              <div key={index} 
                className="group flex flex-col items-center justify-center p-6 bg-gradient-to-br from-card/90 to-card rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                style={{animationDelay: `${index * 0.2}s`}}
              >
                <stat.icon className="h-8 w-8 mb-3 text-primary group-hover:scale-110 transition-transform" />
                <h3 className="text-3xl font-bold text-primary mb-1 group-hover:scale-110 transition-transform">{stat.value}</h3>
                <p className="text-muted-foreground text-sm group-hover:text-primary transition-colors">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced Features Section */}
      <section className="py-16">
        <div className="container px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className="p-6 hover:shadow-2xl transition-all duration-300 border-0 bg-gradient-to-br from-background/80 to-background/90 relative overflow-hidden backdrop-blur-sm hover:-translate-y-1 card-touch tap-highlight-none"
                style={{
                  animation: `floating-3d ${3 + index * 0.5}s ease-in-out infinite`,
                  animationDelay: `${index * 0.2}s`,
                }}
              >
                <div className={`absolute inset-0 bg-gradient-to-r ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity`} />
                <CardHeader>
                  <div className={`p-3 w-12 h-12 rounded-lg ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <feature.icon className="h-6 w-6 text-foreground" />
                  </div>
                  <CardTitle className="text-xl group-hover:text-primary transition-colors">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm text-muted-foreground group-hover:text-muted-foreground/80 transition-colors">
                    {feature.description}
                  </CardDescription>
                </CardContent>
                <CardFooter>
                  <Button asChild variant="ghost" className="w-full justify-between group/btn hover:bg-primary/10">
                    <Link href={feature.href}>
                      استكشف
                      <ArrowRightIcon className="h-4 w-4 mr-1 transition-transform group-hover/btn:translate-x-1" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* قسم الميزات الإبداعية الجديدة */}
      {isLoggedIn && user && (
        <>
          {/* نظام التحفيز والألعاب */}
          <section className="py-16 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950/30 dark:to-indigo-950/30">
            <div className="container px-4 md:px-6">
              <div className="text-center mb-12">
                <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
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
          <section className="py-16 bg-gradient-to-br from-green-50 to-teal-100 dark:from-green-950/30 dark:to-teal-950/30">
            <div className="container px-4 md:px-6">
              <div className="text-center mb-12">
                <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
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

      {/* Enhanced CTA Section - Different for Premium vs Free Users */}
      {isPremiumUser && user ? (
        <section className="py-20 bg-gradient-to-br from-amber-600 via-yellow-500 to-orange-500 text-white relative overflow-hidden">
          {/* Premium Background Effects */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_1200px_at_50%_-100px,rgba(255,255,255,0.2),transparent)] opacity-30" />
          <div className="absolute inset-0 bg-[conic-gradient(from_0deg_at_50%_50%,rgba(255,255,255,0.1)_0%,transparent_60%)] animate-spin-slow" />
          <div className="absolute inset-0">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute h-2 w-2 bg-white/30 rounded-full animate-float"
                style={{
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 5}s`,
                  animationDuration: `${3 + Math.random() * 2}s`,
                }}
              />
            ))}
          </div>

          <div className="container px-4 md:px-6 text-center relative">
            <PremiumDashboard user={user} />

            {/* VIP Action Section */}
            <div className="mt-12 p-8 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
              <div className="flex justify-center mb-6">
                {user.subscription?.type === 'Pro Life' ? (
                  <DiamondIcon className="h-16 w-16 text-white animate-pulse" />
                ) : (
                  <CrownIcon className="h-16 w-16 text-white animate-bounce" />
                )}
              </div>
              <h3 className="text-2xl font-bold mb-4">🌟 أنت مستخدم VIP</h3>
              <p className="text-lg mb-6 opacity-90">
                {user.subscription?.type === 'Pro Life' 
                  ? "عضويتك الماسية تمنحك امتيازات لا محدودة مدى الحياة"
                  : "عضويتك الذهبية تفتح لك عالماً من الإمكانيات المتقدمة"
                }
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="min-w-[200px] bg-white text-amber-600 hover:bg-amber-50 hover:scale-105 transition-all font-bold shadow-xl">
                  <Link href="/records">
                    📊 سجل الإنجازات الذهبية
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="min-w-[200px] border-white text-white hover:bg-white hover:text-amber-600 hover:scale-105 transition-all font-bold">
                  <Link href="/challenges">
                    🏆 التحديات الحصرية
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className="py-16 bg-gradient-to-r from-primary/90 to-primary text-primary-foreground relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_50%_-100px,var(--primary-foreground),transparent)] opacity-20" />
          <div className="container px-4 md:px-6 text-center relative">
            {isLoggedIn && user ? (
              <>
                <User className="h-12 w-12 mx-auto mb-6 animate-pulse text-primary-foreground/90" />
                <h2 className="text-3xl font-bold mb-4">مرحباً بك، {user.name || user.username}!</h2>
                <p className="mb-8 max-w-[600px] mx-auto opacity-90">
                  استمر في رحلتك التعليمية واكتشف المزيد من الاختبارات والتحديات
                </p>
                <div className="mb-8 p-6 bg-primary-foreground/10 rounded-xl border border-primary-foreground/20">
                  <h3 className="text-xl font-bold mb-4">💎 ترقية إلى Pro للحصول على:</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <CrownIcon className="h-4 w-4" />
                      <span>اختبارات لا محدودة</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrophyIcon className="h-4 w-4" />
                      <span>تحديات حصرية</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <BookOpenIcon className="h-4 w-4" />
                      <span>مكتبة متقدمة</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <RocketIcon className="h-4 w-4" />
                      <span>دعم أولوية</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button asChild size="lg" variant="secondary" className="min-w-[200px] hover:scale-105 transition-transform">
                    <Link href="/records">
                      عرض سجل الاختبارات
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="min-w-[200px] hover:scale-105 transition-transform border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary">
                    <Link href="/profile">
                      ترقية إلى Pro 👑
                    </Link>
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Zap className="h-12 w-12 mx-auto mb-6 animate-pulse text-primary-foreground/90" />
                <h2 className="text-3xl font-bold mb-4">ابدأ رحلتك نحو التميز</h2>
                <p className="mb-8 max-w-[600px] mx-auto opacity-90">
                  سجل حساب مجاني الآن واحصل على تجربة تعليمية متكاملة مع متابعة تقدمك وتحسين مستواك
                </p>
                <Button asChild size="lg" variant="secondary" className="min-w-[200px] hover:scale-105 transition-transform">
                  <Link href="/profile">
                    سجل الآن
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