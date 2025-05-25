
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CrownIcon, 
  SparklesIcon, 
  XIcon,
  GiftIcon,
  TrophyIcon,
  StarIcon,
  DiamondIcon
} from "lucide-react";

interface PremiumNotificationsProps {
  userSubscription: string;
  userName: string;
}

export function PremiumNotifications({ userSubscription, userName }: PremiumNotificationsProps) {
  const [showWelcome, setShowWelcome] = useState(false);
  const [notifications, setNotifications] = useState<string[]>([]);

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
        "🎯 تحديات حصرية متاحة لك الآن"
      ];

      if (isProLife) {
        premiumNotifications.push(
          "💎 عضويتك لا تنتهي أبداً - استمتع مدى الحياة!",
          "🌟 جميع التحديثات المستقبلية مجانية لك"
        );
      }

      setNotifications(premiumNotifications);
    }
  }, [isPremium, isProLife, userName]);

  if (!isPremium) return null;

  return (
    <>
      {/* Premium Welcome Modal */}
      {showWelcome && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/50 dark:to-yellow-950/50 border-2 border-amber-300 dark:border-amber-700 shadow-2xl">
            <CardContent className="p-6 text-center">
              <div className="flex justify-end mb-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowWelcome(false)}
                  className="h-8 w-8 p-0"
                >
                  <XIcon className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex justify-center mb-4">
                {isProLife ? (
                  <div className="relative">
                    <DiamondIcon className="h-16 w-16 text-purple-500 animate-pulse" />
                    <SparklesIcon className="absolute -top-2 -right-2 h-6 w-6 text-pink-400 animate-bounce" />
                  </div>
                ) : (
                  <div className="relative">
                    <CrownIcon className="h-16 w-16 text-amber-500 animate-bounce" />
                    <StarIcon className="absolute -top-1 -right-1 h-5 w-5 text-yellow-400 animate-pulse" />
                  </div>
                )}
              </div>

              <h3 className="text-2xl font-bold mb-2 bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent">
                🎉 مرحباً بالعضو المميز!
              </h3>
              
              <p className="text-lg mb-4 text-amber-800 dark:text-amber-200">
                {isProLife 
                  ? `${userName}، أهلاً بك في العائلة الذهبية! عضويتك Pro Life تمنحك وصولاً لا محدوداً مدى الحياة.`
                  : `${userName}، مرحباً بك في النادي الحصري! باقة Pro تفتح لك عالماً من الإمكانيات.`
                }
              </p>

              <Badge 
                className={`mb-4 text-base px-4 py-2 ${
                  isProLife 
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                    : 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white'
                }`}
              >
                {isProLife ? (
                  <><DiamondIcon className="h-4 w-4 mr-2" /> Pro Life مدى الحياة</>
                ) : (
                  <><CrownIcon className="h-4 w-4 mr-2" /> عضو Pro</>
                )}
              </Badge>

              <div className="space-y-2 text-sm text-amber-700 dark:text-amber-300 mb-6">
                {notifications.slice(0, 3).map((notification, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <SparklesIcon className="h-4 w-4 text-amber-500" />
                    <span>{notification}</span>
                  </div>
                ))}
              </div>

              <Button 
                onClick={() => setShowWelcome(false)}
                className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white font-bold"
              >
                <GiftIcon className="h-5 w-5 mr-2" />
                ابدأ الاستكشاف!
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Premium Status Bar */}
      <div className="mb-6">
        <Card className={`border-2 ${
          isProLife 
            ? 'border-gradient-to-r from-purple-400 to-pink-400 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20'
            : 'border-gradient-to-r from-amber-400 to-yellow-400 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20'
        }`}>
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isProLife ? (
                  <DiamondIcon className="h-6 w-6 text-purple-500 animate-pulse" />
                ) : (
                  <CrownIcon className="h-6 w-6 text-amber-500 animate-bounce" />
                )}
                <div>
                  <div className="font-bold text-sm">
                    {isProLife ? 'Pro Life - مدى الحياة 💎' : 'Pro - عضوية مميزة 👑'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {isProLife ? 'لا تنتهي أبداً' : 'وصول كامل لجميع الميزات'}
                  </div>
                </div>
              </div>
              <Badge variant="outline" className="animate-pulse">
                <TrophyIcon className="h-3 w-3 mr-1" />
                VIP
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
