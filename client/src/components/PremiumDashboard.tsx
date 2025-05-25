import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  CrownIcon, 
  SparklesIcon, 
  TrophyIcon, 
  StarIcon,
  GemIcon,
  ShieldCheckIcon,
  RocketIcon,
  ZapIcon,
  InfinityIcon,
  DiamondIcon,
  Flame,
  LightbulbIcon,
  Gift,
  AwardIcon,
  HeartIcon,
  Wand2
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PremiumDashboardProps {
  user: {
    name: string;
    subscription: {
      type: string;
    };
  };
}

export function PremiumDashboard({ user }: PremiumDashboardProps) {
  const isProLife = user.subscription.type === 'Pro Life';
  const isPro = user.subscription.type === 'Pro';

  if (!isPro && !isProLife) return null;

  let premiumFeatures = [];

  if (isProLife) {
    premiumFeatures = [
      { icon: DiamondIcon, title: "💎 عضوية مدى الحياة", description: "لا تنتهي صلاحيتها أبداً - استثمار دائم للمستقبل", color: "from-purple-600 to-pink-600" },
      { icon: InfinityIcon, title: "♾️ تحديثات مجانية إلى الأبد", description: "جميع الميزات والتحسينات المستقبلية مجاناً", color: "from-violet-500 to-purple-500" },
      { icon: Wand2, title: "🌟 امتيازات سحرية", description: "ميزات حصرية تُضاف باستمرار للنخبة الماسية", color: "from-pink-500 to-rose-500" },
      { icon: RocketIcon, title: "🚀 وصول مبكر", description: "كن أول من يجرب الميزات الجديدة قبل الجميع", color: "from-indigo-600 to-purple-600" },
      { icon: SparklesIcon, title: "✨ اختبارات لا محدودة", description: "وصول كامل لجميع الاختبارات الحالية والمستقبلية", color: "from-blue-500 to-cyan-500" },
      { icon: TrophyIcon, title: "🏆 تحديات النخبة الماسية", description: "منافسات حصرية للأعضاء الماسيين فقط", color: "from-yellow-500 to-orange-500" },
      { icon: GemIcon, title: "💎 مكتبة الخبراء", description: "محتوى متقدم ومصادر حصرية للنخبة الماسية", color: "from-emerald-500 to-teal-500" },
      { icon: ShieldCheckIcon, title: "🛡️ دعم VIP فائق", description: "استجابة فورية وأولوية قصوى مع خط مباشر", color: "from-green-500 to-emerald-500" },
      { icon: ZapIcon, title: "⚡ ذكاء اصطناعي متقدم", description: "تحليل شخصي متطور وتوصيات ذكية مخصصة", color: "from-red-500 to-rose-500" }
    ];
  } else {
    premiumFeatures = [
      { icon: SparklesIcon, title: "✨ اختبارات متقدمة", description: "وصول كامل لجميع الاختبارات المتوفرة حالياً", color: "from-blue-500 to-cyan-500" },
      { icon: TrophyIcon, title: "🏆 تحديات حصرية", description: "منافسات مخصصة لأعضاء Pro المميزين", color: "from-yellow-500 to-orange-500" },
      { icon: GemIcon, title: "📚 مكتبة متقدمة", description: "محتوى تعليمي عالي الجودة ومحدث بانتظام", color: "from-purple-500 to-pink-500" },
      { icon: RocketIcon, title: "🚀 دعم فني متميز", description: "استجابة سريعة وأولوية عالية في الدعم", color: "from-green-500 to-emerald-500" },
      { icon: ShieldCheckIcon, title: "🗂️ مجلدات ذكية", description: "تنظيم متقدم ونظام حفظ ذكي للمراجعة", color: "from-indigo-500 to-blue-500" },
      { icon: ZapIcon, title: "⚡ تحليل ذكي", description: "إحصائيات مفصلة وتوصيات لتحسين الأداء", color: "from-red-500 to-rose-500" }
    ];
  }

  if (isProLife) {
    premiumFeatures.push(
      { icon: InfinityIcon, title: "مدى الحياة", description: "لا تنتهي صلاحيتها أبداً - استثمار دائم", color: "from-violet-500 to-purple-500" },
      { icon: DiamondIcon, title: "تحديثات مجانية", description: "جميع الميزات الجديدة مجاناً للأبد", color: "from-pink-500 to-rose-500" },
      { icon: Wand2, title: "امتيازات سحرية", description: "ميزات حصرية تُضاف باستمرار", color: "from-amber-500 to-yellow-500" }
    );
  }

  return (
    <div className="space-y-12 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Floating Particles */}
        {[...Array(20)].map((_, i) => (
          <div
            key={`particle-${i}`}
            className={`absolute w-2 h-2 rounded-full opacity-30 animate-float-particle ${
              isProLife ? 'bg-gradient-to-r from-purple-400 to-pink-400' : 'bg-gradient-to-r from-amber-400 to-yellow-400'
            }`}
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 4}s`,
            }}
          />
        ))}

        {/* Glowing Orbs */}
        {[...Array(5)].map((_, i) => (
          <div
            key={`orb-${i}`}
            className={`absolute w-32 h-32 rounded-full blur-xl opacity-20 animate-pulse ${
              isProLife 
                ? 'bg-gradient-to-r from-purple-500 via-pink-500 to-violet-500' 
                : 'bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500'
            }`}
            style={{
              top: `${Math.random() * 80}%`,
              left: `${Math.random() * 80}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${4 + Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      {/* Welcome Section - Enhanced */}
      <div className="relative">
        <div className={`absolute inset-0 bg-gradient-to-r ${
          isProLife 
            ? 'from-purple-500/20 via-pink-500/15 to-violet-500/20' 
            : 'from-amber-500/20 via-yellow-500/15 to-orange-500/20'
        } animate-gradient-x rounded-3xl blur-xl`} />

        <Card className={`relative border-4 ${
          isProLife 
            ? 'border-gradient-to-r from-purple-400 to-pink-400 shadow-2xl shadow-purple-500/30' 
            : 'border-gradient-to-r from-amber-400 to-yellow-400 shadow-2xl shadow-amber-500/30'
        } bg-gradient-to-br from-background/95 via-background/90 to-background/95 backdrop-blur-sm overflow-hidden`}>

          {/* Animated Crown/Diamond with Effects */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-6">
            <div className="relative">
              {isProLife ? (
                <div className="relative">
                  <DiamondIcon className="h-20 w-20 text-purple-500 animate-pulse drop-shadow-2xl" />
                  <div className="absolute inset-0 h-20 w-20 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full blur-lg opacity-50 animate-ping" />
                  <SparklesIcon className="absolute -top-3 -right-3 h-8 w-8 text-pink-400 animate-bounce" />
                  <StarIcon className="absolute -bottom-2 -left-2 h-6 w-6 text-violet-400 animate-pulse" />
                </div>
              ) : (
                <div className="relative">
                  <CrownIcon className="h-20 w-20 text-amber-500 animate-bounce drop-shadow-2xl" />
                  <div className="absolute inset-0 h-20 w-20 bg-gradient-to-r from-amber-400 to-yellow-400 rounded-full blur-lg opacity-50 animate-ping" />
                  <Flame className="absolute -top-2 -right-2 h-7 w-7 text-orange-400 animate-pulse" />
                  <StarIcon className="absolute -bottom-1 -left-1 h-5 w-5 text-yellow-400 animate-spin" />
                </div>
              )}
            </div>
          </div>

          <CardHeader className="text-center pt-16 pb-6">
            <div className="space-y-6">
              <CardTitle className={`text-5xl font-bold bg-gradient-to-r ${
                isProLife 
                  ? 'from-purple-600 via-pink-500 to-violet-600' 
                  : 'from-amber-600 via-yellow-500 to-orange-600'
              } bg-clip-text text-transparent animate-gradient-x`}>
                {isProLife ? "أهلاً بك في النخبة الماسية" : "أهلاً بك في النخبة الذهبية"}
              </CardTitle>

              <div className="flex justify-center">
                <Badge 
                  variant="outline" 
                  className={cn(
                    "text-xl px-8 py-3 font-bold border-3 animate-pulse shadow-lg",
                    isProLife 
                      ? "border-purple-400 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 dark:from-purple-900/50 dark:to-pink-900/50 dark:text-purple-300 shadow-purple-500/30"
                      : "border-amber-400 bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-700 dark:from-amber-900/50 dark:to-yellow-900/50 dark:text-amber-300 shadow-amber-500/30"
                  )}
                >
                  {isProLife ? (
                    <><InfinityIcon className="h-6 w-6 mr-3 animate-spin-slow" /> عضو Pro Life - النخبة الماسية 💎</>
                  ) : (
                    <><CrownIcon className="h-6 w-6 mr-3 animate-bounce" /> عضو Pro - النخبة الذهبية 👑</>
                  )}
                </Badge>
              </div>

              <div className="space-y-4">
                <p className="text-2xl font-semibold text-muted-foreground">
                  مرحباً {user.name}، أنت من {isProLife ? "النخبة الماسية الحصرية" : "النخبة الذهبية المميزة"}
                </p>
                <div className={`p-6 rounded-2xl bg-gradient-to-r ${
                  isProLife 
                    ? 'from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border-2 border-purple-300 dark:border-purple-700' 
                    : 'from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 border-2 border-amber-300 dark:border-amber-700'
                }`}>
                  <p className={`text-lg font-medium ${
                    isProLife ? 'text-purple-700 dark:text-purple-300' : 'text-amber-700 dark:text-amber-300'
                  }`}>
                    {isProLife 
                      ? "💎✨ أنت عضو في النخبة الماسية! استمتع بجميع الميزات إلى الأبد مع تحديثات مجانية مدى الحياة. هذا استثمار ذكي لمستقبلك التعليمي!" 
                      : "👑🌟 أنت عضو في النخبة الذهبية! استمتع بسنة كاملة من التميز. يمكنك الترقية إلى Pro Life في أي وقت للحصول على امتيازات أكثر!"
                    }
                  </p>

                  {!isProLife && (
                    <div className="mt-4 p-3 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 border border-purple-200 dark:border-purple-700 rounded-lg">
                      <p className="text-sm text-purple-700 dark:text-purple-300 font-medium">
                        💡 <strong>نصيحة:</strong> باقة Pro Life توفر عليك المال على المدى الطويل + امتيازات حصرية أكثر!
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>

      {/* Premium Features Grid - Enhanced */}
      <div className="space-y-8">
        <div className="text-center space-y-4">
          <h2 className={`text-4xl font-bold bg-gradient-to-r ${
            isProLife 
              ? 'from-purple-600 via-pink-500 to-violet-600' 
              : 'from-amber-600 via-yellow-500 to-orange-600'
          } bg-clip-text text-transparent animate-gradient-x`}>
            🔥 امتيازاتك الحصرية الفائقة
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            تمتع بمجموعة استثنائية من الميزات المصممة خصيصاً لتجربة تعليمية لا مثيل لها
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {premiumFeatures.map((feature, index) => (
            <Card 
              key={index}
              className="group hover:shadow-2xl hover:shadow-purple-500/20 dark:hover:shadow-purple-400/20 transition-all duration-500 hover:scale-105 bg-gradient-to-br from-background to-secondary/30 border-2 border-secondary hover:border-primary overflow-hidden relative"
              style={{
                animation: `float-up 0.6s ease-out ${index * 0.1}s both`,
              }}
            >
              {/* Card Background Gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />

              {/* Shine Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />

              <CardHeader className="text-center pb-4">
                <div className="flex justify-center mb-4">
                  <div className={`relative p-4 rounded-full bg-gradient-to-br ${feature.color} group-hover:scale-110 transition-all duration-300 shadow-lg`}>
                    <feature.icon className="h-8 w-8 text-white drop-shadow-md" />

                    {/* Icon Glow Effect */}
                    <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${feature.color} blur-lg opacity-50 group-hover:opacity-70 transition-opacity duration-300`} />
                  </div>
                </div>
                <CardTitle className={`text-xl font-bold group-hover:bg-gradient-to-r ${feature.color} group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300`}>
                  {feature.title}
                </CardTitle>
              </CardHeader>

              <CardContent className="text-center">
                <p className="text-sm text-muted-foreground group-hover:text-foreground transition-colors duration-300 leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Enhanced Call to Action */}
      <Card className={`relative overflow-hidden bg-gradient-to-r ${
        isProLife 
          ? 'from-purple-600 via-pink-500 to-violet-600' 
          : 'from-amber-500 via-yellow-500 to-orange-500'
      } text-white border-none shadow-2xl`}>

        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_50%_200px,rgba(255,255,255,0.3),transparent)]" />
          <div className="absolute inset-0 bg-[conic-gradient(from_0deg_at_50%_50%,rgba(255,255,255,0.1)_0%,transparent_60%)] animate-spin-slow" />
        </div>

        <CardContent className="relative text-center py-12 space-y-8">
          <div className="space-y-4">
            <div className="flex justify-center">
              {isProLife ? (
                <DiamondIcon className="h-16 w-16 animate-pulse drop-shadow-lg" />
              ) : (
                <RocketIcon className="h-16 w-16 animate-bounce drop-shadow-lg" />
              )}
            </div>

            <h3 className="text-3xl font-bold mb-4 drop-shadow-md">
              🚀 جاهز لبدء رحلتك الاستثنائية؟
            </h3>

            <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto leading-relaxed">
              اكتشف عالماً لا محدود من الاختبارات المتقدمة والتحديات الحصرية المصممة خصيصاً للنخبة
            </p>
          </div>

          <div className="flex justify-center gap-6 flex-wrap">
            <Button 
              size="lg" 
              variant="secondary"
              className={`bg-white ${
                isProLife ? 'text-purple-600 hover:bg-purple-50' : 'text-amber-600 hover:bg-amber-50'
              } font-bold shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 px-8 py-4 text-lg`}
            >
              <RocketIcon className="h-6 w-6 mr-3" />
              ابدأ اختبار متقدم
            </Button>

            <Button 
              size="lg" 
              variant="outline"
              className="border-2 border-white text-white hover:bg-white hover:text-current font-bold shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 px-8 py-4 text-lg"
            >
              <TrophyIcon className="h-6 w-6 mr-3" />
              تصفح التحديات الحصرية
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { icon: InfinityIcon, value: "∞", label: "اختبارات لا محدودة", color: "from-green-500 to-emerald-500" },
          { icon: Flame, value: "VIP", label: "دعم أولوية", color: "from-blue-500 to-cyan-500" },
          { icon: AwardIcon, value: "100%", label: "وصول كامل", color: "from-purple-500 to-pink-500" },
          { icon: HeartIcon, value: isProLife ? "∞" : "365", label: isProLife ? "مدى الحياة" : "يوم", color: isProLife ? "from-red-500 to-rose-500" : "from-amber-500 to-yellow-500" }
        ].map((stat, index) => (
          <Card 
            key={index}
            className={`text-center bg-gradient-to-br from-background to-secondary/30 border-2 border-secondary hover:border-primary transition-all duration-300 hover:scale-105 hover:shadow-xl relative overflow-hidden group`}
          >
            {/* Background Gradient */}
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />

            <CardContent className="relative py-8">
              <div className="flex justify-center mb-4">
                <div className={`p-3 rounded-full bg-gradient-to-br ${stat.color} shadow-lg`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className={`text-4xl font-bold mb-2 bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                {stat.value}
              </div>
              <div className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                {stat.label}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}