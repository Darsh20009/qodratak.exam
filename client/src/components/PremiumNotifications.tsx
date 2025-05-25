
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  CrownIcon, 
  SparklesIcon, 
  DiamondIcon,
  GiftIcon,
  StarIcon,
  TrophyIcon,
  ZapIcon,
  FlameIcon,
  HeartIcon,
  InfinityIcon,
  MagicWandIcon,
  RocketIcon,
  XIcon
} from "lucide-react";

interface PremiumNotificationsProps {
  userSubscription: string;
  userName: string;
}

export function PremiumNotifications({ userSubscription, userName }: PremiumNotificationsProps) {
  const [showWelcome, setShowWelcome] = useState(false);
  const [notifications, setNotifications] = useState<string[]>([]);
  const [showNotificationBar, setShowNotificationBar] = useState(true);

  const isPremium = userSubscription === 'Pro' || userSubscription === 'Pro Life';
  const isProLife = userSubscription === 'Pro Life';

  useEffect(() => {
    if (isPremium) {
      // Show welcome message for premium users
      const welcomeShown = localStorage.getItem(`premium-welcome-${userName}`);
      if (!welcomeShown) {
        setShowWelcome(true);
        localStorage.setItem(`premium-welcome-${userName}`, 'true');
      }

      // Set premium notifications
      const premiumNotifications = [
        "🔥 لديك وصول لجميع الاختبارات المتقدمة!",
        "⚡ يمكنك إنشاء مجلدات خاصة لتنظيم دراستك",
        "🎯 تحديات حصرية متاحة لك الآن",
        "💎 دعم فني VIP بأولوية قصوى"
      ];

      if (isProLife) {
        premiumNotifications.push(
          "💫 عضويتك لا تنتهي أبداً - استمتع مدى الحياة!",
          "🌟 جميع التحديثات المستقبلية مجانية لك",
          "👑 أنت من النخبة الماسية الحصرية"
        );
      }

      setNotifications(premiumNotifications);
    }
  }, [isPremium, isProLife, userName]);

  if (!isPremium) return null;

  return (
    <div className="space-y-6">
      {/* Welcome Modal */}
      {showWelcome && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className={`relative max-w-lg w-full border-4 ${
            isProLife 
              ? 'border-purple-400 shadow-2xl shadow-purple-500/30' 
              : 'border-amber-400 shadow-2xl shadow-amber-500/30'
          } bg-gradient-to-br from-background via-background/95 to-background overflow-hidden`}>
            
            {/* Animated Background */}
            <div className={`absolute inset-0 bg-gradient-to-r ${
              isProLife 
                ? 'from-purple-500/10 via-pink-500/5 to-violet-500/10' 
                : 'from-amber-500/10 via-yellow-500/5 to-orange-500/10'
            } animate-gradient-x`} />
            
            {/* Floating Particles */}
            <div className="absolute inset-0 overflow-hidden">
              {[...Array(15)].map((_, i) => (
                <div
                  key={i}
                  className={`absolute w-1 h-1 rounded-full opacity-60 animate-float ${
                    isProLife ? 'bg-purple-400' : 'bg-amber-400'
                  }`}
                  style={{
                    top: `${Math.random() * 100}%`,
                    left: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 3}s`,
                    animationDuration: `${2 + Math.random() * 2}s`,
                  }}
                />
              ))}
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-10 hover:bg-secondary/80"
              onClick={() => setShowWelcome(false)}
            >
              <XIcon className="h-4 w-4" />
            </Button>

            <CardHeader className="text-center pb-4 relative">
              <div className="flex justify-center mb-6">
                {isProLife ? (
                  <div className="relative">
                    <DiamondIcon className="h-20 w-20 text-purple-500 animate-pulse drop-shadow-lg" />
                    <div className="absolute inset-0 h-20 w-20 bg-purple-400 rounded-full blur-xl opacity-30 animate-ping" />
                    <SparklesIcon className="absolute -top-2 -right-2 h-7 w-7 text-pink-400 animate-bounce" />
                  </div>
                ) : (
                  <div className="relative">
                    <CrownIcon className="h-20 w-20 text-amber-500 animate-bounce drop-shadow-lg" />
                    <div className="absolute inset-0 h-20 w-20 bg-amber-400 rounded-full blur-xl opacity-30 animate-ping" />
                    <FlameIcon className="absolute -top-2 -right-2 h-7 w-7 text-orange-400 animate-pulse" />
                  </div>
                )}
              </div>
              
              <CardTitle className={`text-3xl font-bold bg-gradient-to-r ${
                isProLife 
                  ? 'from-purple-600 via-pink-500 to-violet-600' 
                  : 'from-amber-600 via-yellow-500 to-orange-600'
              } bg-clip-text text-transparent`}>
                🎉 مرحباً بك في عالم النخبة!
              </CardTitle>
            </CardHeader>
            
            <CardContent className="text-center space-y-6 relative">
              <div className={`p-6 rounded-xl bg-gradient-to-r ${
                isProLife 
                  ? 'from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border border-purple-200 dark:border-purple-800' 
                  : 'from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 border border-amber-200 dark:border-amber-800'
              }`}>
                <p className={`text-lg font-medium ${
                  isProLife ? 'text-purple-700 dark:text-purple-300' : 'text-amber-700 dark:text-amber-300'
                }`}>
                  أهلاً {userName}! تم تفعيل عضويتك 
                  <span className="font-bold">
                    {isProLife ? ' الماسية Pro Life' : ' الذهبية Pro'}
                  </span>
                  ، استعد لتجربة تعليمية استثنائية! 🌟
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-lg">✨ ما يميزك الآن:</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center justify-center gap-2">
                    <InfinityIcon className="h-4 w-4 text-green-500" />
                    <span>اختبارات لا محدودة</span>
                  </li>
                  <li className="flex items-center justify-center gap-2">
                    <TrophyIcon className="h-4 w-4 text-yellow-500" />
                    <span>تحديات حصرية للنخبة</span>
                  </li>
                  <li className="flex items-center justify-center gap-2">
                    <ZapIcon className="h-4 w-4 text-blue-500" />
                    <span>دعم فني VIP</span>
                  </li>
                  {isProLife && (
                    <li className="flex items-center justify-center gap-2">
                      <HeartIcon className="h-4 w-4 text-red-500" />
                      <span>مدى الحياة - لا تنتهي أبداً!</span>
                    </li>
                  )}
                </ul>
              </div>

              <Button 
                onClick={() => setShowWelcome(false)}
                className={`w-full text-lg py-3 font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 ${
                  isProLife 
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700' 
                    : 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600'
                } text-white`}
              >
                <GiftIcon className="h-5 w-5 mr-2" />
                ابدأ الاستكشاف!
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Premium Status Bar */}
      {showNotificationBar && (
        <div className="relative">
          <Card className={`border-2 ${
            isProLife 
              ? 'border-purple-400 bg-gradient-to-r from-purple-50 via-pink-50 to-violet-50 dark:from-purple-950/20 dark:via-pink-950/20 dark:to-violet-950/20 shadow-lg shadow-purple-500/20'
              : 'border-amber-400 bg-gradient-to-r from-amber-50 via-yellow-50 to-orange-50 dark:from-amber-950/20 dark:via-yellow-950/20 dark:to-orange-950/20 shadow-lg shadow-amber-500/20'
          } overflow-hidden relative`}>
            
            {/* Animated Border */}
            <div className={`absolute inset-0 bg-gradient-to-r ${
              isProLife 
                ? 'from-purple-400 via-pink-400 to-violet-400' 
                : 'from-amber-400 via-yellow-400 to-orange-400'
            } opacity-20 animate-pulse`} />

            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 h-6 w-6 z-10 hover:bg-secondary/50"
              onClick={() => setShowNotificationBar(false)}
            >
              <XIcon className="h-3 w-3" />
            </Button>

            <CardContent className="py-4 relative">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {isProLife ? (
                    <div className="relative">
                      <DiamondIcon className="h-8 w-8 text-purple-500 animate-pulse" />
                      <div className="absolute inset-0 h-8 w-8 bg-purple-400 rounded-full blur-md opacity-30" />
                    </div>
                  ) : (
                    <div className="relative">
                      <CrownIcon className="h-8 w-8 text-amber-500 animate-bounce" />
                      <div className="absolute inset-0 h-8 w-8 bg-amber-400 rounded-full blur-md opacity-30" />
                    </div>
                  )}
                  
                  <div>
                    <div className={`font-bold text-lg ${
                      isProLife ? 'text-purple-700 dark:text-purple-300' : 'text-amber-700 dark:text-amber-300'
                    }`}>
                      {isProLife ? '💎 Pro Life - عضوية ماسية مدى الحياة' : '👑 Pro - عضوية ذهبية مميزة'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {isProLife ? 'لا تنتهي أبداً • امتيازات لا محدودة' : 'نشطة • امتيازات متقدمة'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge 
                    variant="outline" 
                    className={`${
                      isProLife 
                        ? 'border-purple-400 bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300' 
                        : 'border-amber-400 bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300'
                    } font-bold animate-pulse`}
                  >
                    VIP
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Notifications Carousel */}
      {notifications.length > 0 && (
        <div className={`p-4 rounded-lg bg-gradient-to-r ${
          isProLife 
            ? 'from-purple-100 to-pink-100 dark:from-purple-950/30 dark:to-pink-950/30 border border-purple-200 dark:border-purple-800'
            : 'from-amber-100 to-yellow-100 dark:from-amber-950/30 dark:to-yellow-950/30 border border-amber-200 dark:border-amber-800'
        } relative overflow-hidden`}>
          
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_400px_at_50%_50%,rgba(255,255,255,0.3),transparent)]" />
          </div>

          <div className="relative">
            <h4 className={`font-bold text-sm mb-3 flex items-center gap-2 ${
              isProLife ? 'text-purple-700 dark:text-purple-300' : 'text-amber-700 dark:text-amber-300'
            }`}>
              <SparklesIcon className="h-4 w-4" />
              إشعارات النخبة المميزة
            </h4>
            
            <div className="space-y-2">
              {notifications.slice(0, 3).map((notification, index) => (
                <div 
                  key={index}
                  className="text-sm flex items-center gap-2 py-1 animate-fade-in"
                  style={{ animationDelay: `${index * 0.2}s` }}
                >
                  <StarIcon className={`h-3 w-3 ${
                    isProLife ? 'text-purple-500' : 'text-amber-500'
                  }`} />
                  <span className="text-muted-foreground">{notification}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
