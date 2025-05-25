
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
  FlameIcon,
  MedalIcon,
  WandIcon,
  LockIcon
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
  const isProLife = user.subscription.type === 'Pro Life' || user.subscription.type === 'Pro Live';
  const isPro = user.subscription.type === 'Pro';
  
  if (!isPro && !isProLife) return null;

  // ميزات Pro العادية
  const proFeatures = [
    { icon: SparklesIcon, title: "اختبارات لا محدودة", description: "وصول كامل لجميع الاختبارات" },
    { icon: TrophyIcon, title: "تحديات حصرية", description: "منافسات مخصصة للمميزين فقط" },
    { icon: GemIcon, title: "مكتبة متقدمة", description: "محتوى تعليمي عالي الجودة" },
    { icon: RocketIcon, title: "دعم فني أولوية", description: "استجابة فورية لطلباتك" },
    { icon: ShieldCheckIcon, title: "مجلدات خاصة", description: "تنظيم متقدم لدراستك" },
    { icon: ZapIcon, title: "تحليل ذكي", description: "إحصائيات مفصلة لأدائك" }
  ];

  // ميزات Pro Life الفاخرة والحصرية
  const proLifeFeatures = [
    { icon: DiamondIcon, title: "💎 عضوية الماس مدى الحياة", description: "لا تنتهي أبداً - استثمار دائم في مستقبلك", premium: true },
    { icon: FlameIcon, title: "🔥 محتوى VIP حصري", description: "اختبارات ومواد تدريبية متقدمة للنخبة فقط", premium: true },
    { icon: MedalIcon, title: "🏅 شارة الأسطورة", description: "تميز عن الجميع بشارة Pro Life الذهبية", premium: true },
    { icon: WandIcon, title: "✨ مساعد AI متطور", description: "ذكاء اصطناعي شخصي لتحليل أدائك وتطويره", premium: true },
    { icon: InfinityIcon, title: "∞ تحديثات مجانية للأبد", description: "جميع الميزات الجديدة مجاناً مدى الحياة", premium: true },
    { icon: LockIcon, title: "🔐 منطقة الأساطير", description: "وصول حصري لقسم متقدم للمحترفين فقط", premium: true },
    { icon: StarIcon, title: "⭐ دعم VIP شخصي", description: "مساعد شخصي متاح 24/7 لمساعدتك", premium: true },
    { icon: TrophyIcon, title: "🏆 مسابقات الأبطال", description: "مشاركة في بطولات النخبة مع جوائز حصرية", premium: true }
  ];

  const features = isProLife ? proLifeFeatures : proFeatures;

  // واجهة Pro Life الفاخرة
  if (isProLife) {
    return (
      <div className="space-y-8 relative">
        {/* خلفية متحركة فاخرة */}
        <div className="fixed inset-0 z-0 opacity-10">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-pink-500 to-amber-500 animate-pulse"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(0,0,0,0.1)_70%)]"></div>
        </div>

        {/* ترحيب فاخر لـ Pro Life */}
        <div className="relative z-10 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-pink-900/20 to-amber-900/30 animate-gradient-x" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(168,85,247,0.3),transparent_70%)]" />
          
          <Card className="relative border-4 border-gradient-to-r from-purple-500 via-pink-500 to-amber-500 bg-gradient-to-br from-slate-900 via-purple-900/50 to-pink-900/30 shadow-2xl shadow-purple-500/25">
            <CardHeader className="text-center pb-4 relative">
              {/* جواهر متطايرة */}
              <div className="absolute top-4 left-4 animate-bounce delay-100">
                <DiamondIcon className="h-6 w-6 text-purple-400 animate-pulse" />
              </div>
              <div className="absolute top-6 right-6 animate-bounce delay-300">
                <SparklesIcon className="h-5 w-5 text-pink-400 animate-pulse" />
              </div>
              <div className="absolute bottom-4 left-8 animate-bounce delay-500">
                <GemIcon className="h-4 w-4 text-amber-400 animate-pulse" />
              </div>

              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-amber-500 rounded-full animate-spin-slow opacity-75"></div>
                  <div className="relative bg-gradient-to-br from-purple-600 to-pink-600 p-4 rounded-full">
                    <DiamondIcon className="h-20 w-20 text-white animate-pulse" />
                  </div>
                  <div className="absolute -top-2 -right-2 bg-gradient-to-r from-amber-400 to-yellow-400 rounded-full p-2 animate-bounce">
                    <FlameIcon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </div>
              
              <CardTitle className="text-5xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-amber-400 bg-clip-text text-transparent mb-4">
                👑 أهلاً بأسطورة Pro Life
              </CardTitle>
              
              <div className="flex justify-center mt-6">
                <Badge 
                  variant="outline" 
                  className="text-xl px-8 py-3 font-black border-4 border-gradient-to-r from-purple-500 via-pink-500 to-amber-500 bg-gradient-to-r from-purple-100/20 to-amber-100/20 text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-amber-300 animate-pulse shadow-lg shadow-purple-500/30"
                >
                  <DiamondIcon className="h-6 w-6 mr-3 text-purple-400" />
                  💎 عضو الماس - مدى الحياة 💎
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="text-center relative">
              <p className="text-2xl text-purple-200 mb-6 font-semibold">
                مرحباً {user.name}، أنت من النخبة الماسية في منصة قدراتك
              </p>
              <div className="bg-gradient-to-r from-purple-800/50 via-pink-800/50 to-amber-800/50 rounded-xl p-6 border border-purple-500/30">
                <p className="text-xl text-purple-100 font-bold leading-relaxed">
                  🌟 أنت الآن جزء من العائلة الماسية النادرة! 
                  <span className="block mt-3 text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-300">
                    عضويتك Pro Life تمنحك وصولاً أبدياً لأفضل ما لدينا - استثمار واحد، فوائد مدى الحياة! 💎
                  </span>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ميزات Pro Life الحصرية */}
        <div className="relative z-10">
          <h2 className="text-4xl font-black text-center mb-8 bg-gradient-to-r from-purple-400 via-pink-400 to-amber-400 bg-clip-text text-transparent">
            ✨ مملكة الميزات الأسطورية ✨
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card 
                key={index}
                className="group relative overflow-hidden hover:shadow-2xl hover:shadow-purple-500/30 transition-all duration-500 hover:scale-105 bg-gradient-to-br from-slate-800/80 via-purple-900/40 to-pink-900/30 border-2 border-purple-500/40 hover:border-purple-400"
              >
                {/* تأثير الضوء المتحرك */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500/10 to-transparent transform -skew-x-12 group-hover:translate-x-full transition-transform duration-1000"></div>
                
                <CardHeader className="text-center pb-3 relative z-10">
                  <div className="flex justify-center mb-4">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-sm opacity-50 group-hover:opacity-75 transition-opacity"></div>
                      <div className="relative p-4 rounded-full bg-gradient-to-br from-purple-600/80 to-pink-600/80 group-hover:scale-110 transition-transform duration-300">
                        <feature.icon className="h-10 w-10 text-white drop-shadow-lg" />
                      </div>
                      {feature.premium && (
                        <div className="absolute -top-1 -right-1 bg-gradient-to-r from-amber-400 to-yellow-400 rounded-full p-1">
                          <CrownIcon className="h-4 w-4 text-white" />
                        </div>
                      )}
                    </div>
                  </div>
                  <CardTitle className="text-lg font-bold text-purple-100 group-hover:text-white transition-colors">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center relative z-10">
                  <p className="text-sm text-purple-200/80 group-hover:text-purple-100 transition-colors leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* قسم الحركة الحصري */}
        <Card className="relative overflow-hidden bg-gradient-to-r from-purple-900 via-pink-900 to-amber-900 text-white border-4 border-gradient-to-r from-purple-500 to-amber-500 shadow-2xl shadow-purple-500/40">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4gPGcgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIj4gPGcgZmlsbD0iIzAwMDAiIG9wYWNpdHk9IjAuMDUiPiA8Y2lyY2xlIGN4PSI0IiBjeT0iNCIgcj0iMiI+PC9jaXJjbGU+IDwvZz4gPC9nPiA8L3N2Zz4=')] opacity-20"></div>
          <CardContent className="relative z-10 text-center py-12">
            <div className="flex justify-center mb-6">
              <div className="flex space-x-4">
                <div className="animate-bounce delay-100"><RocketIcon className="h-12 w-12 text-purple-300" /></div>
                <div className="animate-bounce delay-200"><TrophyIcon className="h-12 w-12 text-pink-300" /></div>
                <div className="animate-bounce delay-300"><DiamondIcon className="h-12 w-12 text-amber-300" /></div>
              </div>
            </div>
            <h3 className="text-3xl font-black mb-6 bg-gradient-to-r from-purple-200 to-amber-200 bg-clip-text text-transparent">
              🚀 مستعد لغزو عالم التميز الأسطوري؟
            </h3>
            <p className="text-xl mb-8 text-purple-100 font-medium leading-relaxed">
              كأسطورة Pro Life، لديك مفاتيح مملكة التعلم بالكامل
            </p>
            <div className="flex justify-center gap-6 flex-wrap">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-black shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 transform hover:scale-110 border-2 border-purple-400"
              >
                <RocketIcon className="h-6 w-6 mr-3" />
                🔥 ابدأ الرحلة الأسطورية
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="border-2 border-amber-400 text-amber-300 hover:bg-amber-400 hover:text-black font-black shadow-xl hover:shadow-amber-500/50 transition-all duration-300 transform hover:scale-110"
              >
                <DiamondIcon className="h-6 w-6 mr-3" />
                💎 استكشف الكنوز الخفية
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* إحصائيات أسطورية */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative z-10">
          <Card className="text-center bg-gradient-to-br from-purple-800/60 to-purple-900/80 border-2 border-purple-500 shadow-xl shadow-purple-500/30">
            <CardContent className="py-8">
              <div className="text-4xl font-black text-purple-300 mb-3">♾️</div>
              <div className="text-sm font-bold text-purple-100">قوة لا نهائية</div>
            </CardContent>
          </Card>
          
          <Card className="text-center bg-gradient-to-br from-pink-800/60 to-pink-900/80 border-2 border-pink-500 shadow-xl shadow-pink-500/30">
            <CardContent className="py-8">
              <div className="text-4xl font-black text-pink-300 mb-3">💎</div>
              <div className="text-sm font-bold text-pink-100">مرتبة الماس</div>
            </CardContent>
          </Card>
          
          <Card className="text-center bg-gradient-to-br from-amber-800/60 to-amber-900/80 border-2 border-amber-500 shadow-xl shadow-amber-500/30">
            <CardContent className="py-8">
              <div className="text-4xl font-black text-amber-300 mb-3">👑</div>
              <div className="text-sm font-bold text-amber-100">ملك التعلم</div>
            </CardContent>
          </Card>

          <Card className="text-center bg-gradient-to-br from-emerald-800/60 to-emerald-900/80 border-2 border-emerald-500 shadow-xl shadow-emerald-500/30">
            <CardContent className="py-8">
              <div className="text-4xl font-black text-emerald-300 mb-3">🌟</div>
              <div className="text-sm font-bold text-emerald-100">أسطورة حية</div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // واجهة Pro العادية (أبسط)
  return (
    <div className="space-y-8">
      {/* ترحيب Pro العادي */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 via-yellow-500/10 to-orange-500/20 animate-gradient-x" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--primary)/20,transparent_70%)]" />
        
        <Card className="relative border-2 border-gradient-to-r from-yellow-400 to-amber-500 bg-gradient-to-br from-background via-amber-50/50 to-yellow-50/30 dark:from-slate-900 dark:via-amber-950/20 dark:to-yellow-950/10 shadow-2xl">
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <CrownIcon className="h-16 w-16 text-amber-500 animate-bounce" />
                <SparklesIcon className="absolute -top-2 -right-2 h-6 w-6 text-yellow-400 animate-bounce" />
              </div>
            </div>
            
            <CardTitle className="text-4xl font-bold bg-gradient-to-r from-amber-600 via-yellow-500 to-orange-500 bg-clip-text text-transparent">
              مرحباً بك أيها المميز
            </CardTitle>
            
            <div className="flex justify-center mt-4">
              <Badge 
                variant="outline" 
                className="text-lg px-6 py-2 font-bold border-2 animate-pulse border-gradient-to-r from-amber-500 to-yellow-500 bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-700 dark:from-amber-900/50 dark:to-yellow-900/50 dark:text-amber-300"
              >
                <CrownIcon className="h-5 w-5 mr-2" /> عضو Pro مميز
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="text-center">
            <p className="text-xl text-muted-foreground mb-6">
              أهلاً {user.name}، أنت من النخبة المميزة في منصة قدراتك
            </p>
            <p className="text-lg text-amber-700 dark:text-amber-300 font-medium">
              ✨ لديك وصول حصري لجميع الميزات المتقدمة، كن مستعداً للتفوق!
              <span className="block mt-2">
                🌟 استمتع بجميع المميزات الحصرية طوال فترة اشتراكك!
              </span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ميزات Pro العادية */}
      <div>
        <h2 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent">
          🔥 مميزاتك الحصرية
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card 
              key={index}
              className="group hover:shadow-2xl hover:shadow-amber-500/20 transition-all duration-300 hover:scale-105 bg-gradient-to-br from-background to-amber-50/30 dark:to-amber-950/10 border-amber-200 dark:border-amber-800"
            >
              <CardHeader className="text-center pb-3">
                <div className="flex justify-center mb-3">
                  <div className="p-3 rounded-full bg-gradient-to-br from-amber-100 to-yellow-100 dark:from-amber-900/50 dark:to-yellow-900/50 group-hover:scale-110 transition-transform duration-300">
                    <feature.icon className="h-8 w-8 text-amber-600 dark:text-amber-400" />
                  </div>
                </div>
                <CardTitle className="text-lg font-bold text-amber-800 dark:text-amber-200">
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-sm text-muted-foreground group-hover:text-amber-700 dark:group-hover:text-amber-300 transition-colors">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* باقي العناصر للـ Pro العادي */}
      <Card className="bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500 text-white border-none shadow-2xl">
        <CardContent className="text-center py-8">
          <h3 className="text-2xl font-bold mb-4">🚀 جاهز لبدء رحلتك المميزة؟</h3>
          <p className="text-lg mb-6 opacity-90">
            اكتشف جميع الاختبارات والتحديات الحصرية المتاحة لك
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <Button 
              size="lg" 
              variant="secondary"
              className="bg-white text-amber-600 hover:bg-amber-50 font-bold shadow-lg hover:shadow-xl transition-all"
            >
              <RocketIcon className="h-5 w-5 mr-2" />
              ابدأ اختبار متقدم
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-amber-600 font-bold"
            >
              <TrophyIcon className="h-5 w-5 mr-2" />
              تصفح التحديات
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* إحصائيات Pro */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="text-center bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800">
          <CardContent className="py-6">
            <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">∞</div>
            <div className="text-sm font-medium text-green-700 dark:text-green-300">اختبارات لا محدودة</div>
          </CardContent>
        </Card>
        
        <Card className="text-center bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border-blue-200 dark:border-blue-800">
          <CardContent className="py-6">
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">VIP</div>
            <div className="text-sm font-medium text-blue-700 dark:text-blue-300">دعم أولوية</div>
          </CardContent>
        </Card>
        
        <Card className="text-center bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-200 dark:border-purple-800">
          <CardContent className="py-6">
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">100%</div>
            <div className="text-sm font-medium text-purple-700 dark:text-purple-300">وصول كامل</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
