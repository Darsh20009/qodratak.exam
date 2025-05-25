
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
  DiamondIcon
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

  // نفس الميزات لكلا الباقتين مع إضافة ميزات خاصة لـ Pro Life
  const basePremiumFeatures = [
    { icon: SparklesIcon, title: "اختبارات لا محدودة", description: "وصول كامل لجميع الاختبارات" },
    { icon: TrophyIcon, title: "تحديات حصرية", description: "منافسات مخصصة للمميزين فقط" },
    { icon: GemIcon, title: "مكتبة متقدمة", description: "محتوى تعليمي عالي الجودة" },
    { icon: RocketIcon, title: "دعم فني أولوية", description: "استجابة فورية لطلباتك" },
    { icon: ShieldCheckIcon, title: "مجلدات خاصة", description: "تنظيم متقدم لدراستك" },
    { icon: ZapIcon, title: "تحليل ذكي", description: "إحصائيات مفصلة لأدائك" }
  ];

  // إضافة ميزات Pro Life فقط إذا كان المستخدم لديه هذه الباقة
  const premiumFeatures = isProLife ? [
    ...basePremiumFeatures,
    { icon: InfinityIcon, title: "مدى الحياة", description: "لا تنتهي صلاحيتها أبداً" },
    { icon: DiamondIcon, title: "تحديثات مجانية", description: "جميع الميزات الجديدة مجاناً" }
  ] : basePremiumFeatures;

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 via-yellow-500/10 to-orange-500/20 animate-gradient-x" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--primary)/20,transparent_70%)]" />
        
        <Card className="relative border-2 border-gradient-to-r from-yellow-400 to-amber-500 bg-gradient-to-br from-background via-amber-50/50 to-yellow-50/30 dark:from-slate-900 dark:via-amber-950/20 dark:to-yellow-950/10 shadow-2xl">
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-4">
              <div className="relative">
                {isProLife ? (
                  <DiamondIcon className="h-16 w-16 text-amber-500 animate-pulse" />
                ) : (
                  <CrownIcon className="h-16 w-16 text-amber-500 animate-bounce" />
                )}
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
                {isProLife ? (
                  <><DiamondIcon className="h-5 w-5 mr-2" /> عضو Pro Life مدى الحياة</>
                ) : (
                  <><CrownIcon className="h-5 w-5 mr-2" /> عضو Pro مميز</>
                )}
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="text-center">
            <p className="text-xl text-muted-foreground mb-6">
              أهلاً {user.name}، أنت من النخبة المميزة في منصة قدراتك
            </p>
            <p className="text-lg text-amber-700 dark:text-amber-300 font-medium">
              ✨ لديك وصول حصري لجميع الميزات المتقدمة، كن مستعداً للتفوق!
              {isProLife && (
                <span className="block mt-2">
                  🌟 ميزة إضافية: عضويتك لا تنتهي أبداً - أنت جزء من العائلة الذهبية مدى الحياة!
                </span>
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Premium Features Grid */}
      <div>
        <h2 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent">
          🔥 مميزاتك الحصرية
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {premiumFeatures.map((feature, index) => (
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

      {/* Call to Action */}
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

      {/* Stats Section */}
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
