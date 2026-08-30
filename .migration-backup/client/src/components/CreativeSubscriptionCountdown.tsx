import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Crown, Clock, AlertTriangle, Zap, Star, Gift, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import useSubscription from "@/hooks/useSubscription";

interface CreativeSubscriptionCountdownProps {
  className?: string;
  variant?: 'card' | 'banner' | 'modal' | 'compact';
  showAnimation?: boolean;
}

const CreativeSubscriptionCountdown: React.FC<CreativeSubscriptionCountdownProps> = ({ 
  className = "", 
  variant = 'card',
  showAnimation = true 
}) => {
  const { subscription, countdown, startTrial, isStartingTrial } = useSubscription();
  const { toast } = useToast();
  const [pulse, setPulse] = useState(false);

  // Pulse animation for urgency
  useEffect(() => {
    if (subscription && (subscription.isTrialActive || subscription.hasActiveSubscription)) {
      const daysLeft = countdown.days;
      if (daysLeft <= 3) {
        const interval = setInterval(() => setPulse(prev => !prev), 1000);
        return () => clearInterval(interval);
      }
    }
  }, [countdown.days, subscription]);

  // Show loading state while data is being fetched or countdown hasn't been calculated yet
  if (!subscription) {
    return (
      <Card className={`animate-pulse bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-900/20 dark:to-slate-900/20 ${className}`}>
        <CardContent className="text-center py-6">
          <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mb-2"></div>
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded mx-auto w-32"></div>
          <div className="text-sm text-gray-500 mt-2">جاري تحميل بيانات الاشتراك...</div>
        </CardContent>
      </Card>
    );
  }

  // For active subscriptions/trials, show loading until countdown is properly calculated
  const hasValidEndDate = (subscription.hasActiveSubscription && subscription.subscriptionEndDate) || 
                          (subscription.isTrialActive && subscription.trialEndDate);
  
  if (hasValidEndDate && countdown.days === 0 && countdown.hours === 0 && countdown.minutes === 0 && countdown.seconds === 0 && !countdown.expired) {
    return (
      <Card className={`animate-pulse bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-900/20 dark:to-slate-900/20 ${className}`}>
        <CardContent className="text-center py-6">
          <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mb-2"></div>
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded mx-auto w-32"></div>
          <div className="text-sm text-gray-500 mt-2">جاري حساب العداد التنازلي...</div>
        </CardContent>
      </Card>
    );
  }

  const formatTime = (num: number) => num.toString().padStart(2, '0');
  const isUrgent = countdown.days <= 3;
  const isExpired = countdown.expired;

  // Free user component
  if (subscription.subscriptionType === 'Free' && !subscription.isTrialActive && !subscription.isExpired) {
    return (
      <Card className={`overflow-hidden relative ${className} ${
        variant === 'banner' 
          ? 'bg-gradient-to-r from-emerald-400 via-green-500 to-emerald-600' 
          : 'bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30'
      } border-green-300 dark:border-green-700`}>
        {showAnimation && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
        )}
        
        <CardHeader className="text-center pb-3 relative z-10">
          <div className="flex items-center justify-center mb-3">
            <div className="relative">
              <Gift className="w-12 h-12 text-green-600 animate-bounce" />
              <Sparkles className="w-6 h-6 text-yellow-400 absolute -top-2 -right-2 animate-spin" />
            </div>
          </div>
          <CardTitle className={`${
            variant === 'banner' ? 'text-white text-2xl' : 'text-green-700 dark:text-green-400 text-xl'
          } font-bold`}>
            🎉 فترة تجريبية مجانية لمدة 7 أيام!
          </CardTitle>
        </CardHeader>
        
        <CardContent className="text-center relative z-10">
          <div className="space-y-4">
            <div className={`p-4 rounded-lg ${
              variant === 'banner' 
                ? 'bg-white/20 backdrop-blur-sm' 
                : 'bg-green-100 dark:bg-green-800/50'
            }`}>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="flex items-center justify-center space-x-1">
                  <Crown className="w-4 h-4" />
                  <span>وصول كامل</span>
                </div>
                <div className="flex items-center justify-center space-x-1">
                  <Star className="w-4 h-4" />
                  <span>جميع المميزات</span>
                </div>
                <div className="flex items-center justify-center space-x-1">
                  <Zap className="w-4 h-4" />
                  <span>بدون قيود</span>
                </div>
              </div>
            </div>
            
            <Button
              onClick={() => startTrial()}
              disabled={isStartingTrial}
              className={`w-full font-bold text-lg py-4 ${
                variant === 'banner'
                  ? 'bg-white text-green-600 hover:bg-gray-100'
                  : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white'
              } transform transition-all duration-200 hover:scale-105 shadow-lg`}
            >
              {isStartingTrial ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
                  جاري التفعيل...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <Zap className="w-5 h-5 mr-2" />
                  ابدأ تجربتك المجانية الآن
                </div>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Expired subscription
  if (isExpired) {
    return (
      <Card className={`overflow-hidden relative ${className} ${
        pulse ? 'ring-4 ring-red-400 ring-opacity-50' : ''
      } bg-gradient-to-br from-red-50 to-amber-600 dark:from-red-900/30 dark:to-amber-600/30 border-red-300 dark:border-red-700`}>
        <CardHeader className="text-center pb-3">
          <div className="flex items-center justify-center mb-3">
            <div className="relative">
              <AlertTriangle className="w-12 h-12 text-red-500 animate-pulse" />
            </div>
          </div>
          <CardTitle className="text-red-700 dark:text-red-400 text-xl font-bold">
            ⚠️ انتهت صلاحية الاشتراك
          </CardTitle>
        </CardHeader>
        
        <CardContent className="text-center">
          <div className="space-y-4">
            <div className="p-4 bg-red-100 dark:bg-red-800/50 rounded-lg">
              <p className="text-red-700 dark:text-red-300 font-medium">
                تم إيقاف الوصول للمميزات المتقدمة
              </p>
              <p className="text-red-600 dark:text-red-400 text-sm mt-1">
                يرجى تجديد اشتراكك للاستمرار
              </p>
            </div>
            
            <Button
              onClick={() => window.location.href = '/subscription'}
              className="w-full bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-700 hover:to-amber-600 text-white font-bold py-3 transform transition-all duration-200 hover:scale-105 shadow-lg"
            >
              <Crown className="w-5 h-5 mr-2" />
              تجديد الاشتراك الآن
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Active subscription/trial countdown
  // Prioritize active subscription over trial
  const isPaidSubscription = subscription.hasActiveSubscription && subscription.subscriptionType !== 'Free';
  const displayAsTrial = subscription.isTrialActive && !isPaidSubscription;
  
  return (
    <Card className={`overflow-hidden relative ${className} ${
      isUrgent && pulse ? 'ring-4 ring-yellow-400 ring-opacity-50' : ''
    } ${
      displayAsTrial 
        ? 'bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 border-amber-300 dark:border-amber-700'
        : 'bg-gradient-to-br from-blue-50 to-emerald-600 dark:from-blue-900/30 dark:to-emerald-600/30 border-blue-300 dark:border-blue-700'
    }`}>
      {showAnimation && isUrgent && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-200/20 to-transparent animate-pulse"></div>
      )}
      
      <CardHeader className="text-center pb-3 relative z-10">
        <div className="flex items-center justify-center mb-3">
          <div className="relative">
            {displayAsTrial ? (
              <Zap className="w-12 h-12 text-amber-500 animate-pulse" />
            ) : (
              <Crown className="w-12 h-12 text-blue-500" />
            )}
            {isUrgent && (
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center animate-bounce">
                <span className="text-white text-xs font-bold">!</span>
              </div>
            )}
          </div>
        </div>
        <CardTitle className={`${
          displayAsTrial 
            ? 'text-amber-700 dark:text-amber-400' 
            : 'text-blue-700 dark:text-blue-400'
        } text-xl font-bold`}>
          {displayAsTrial ? '⚡ الفترة التجريبية' : `👑 اشتراك ${subscription.subscriptionType}`}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="text-center relative z-10">
        <div className="space-y-4">
          {/* Countdown Timer */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'أيام', value: countdown.days },
              { label: 'ساعات', value: countdown.hours },
              { label: 'دقائق', value: countdown.minutes },
              { label: 'ثواني', value: countdown.seconds }
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className={`text-3xl font-bold ${
                  subscription.isTrialActive ? 'text-amber-600 dark:text-amber-400' : 'text-blue-600 dark:text-blue-400'
                } ${isUrgent ? 'animate-pulse' : ''}`}>
                  {formatTime(item.value)}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                  {item.label}
                </div>
              </div>
            ))}
          </div>
          
          {/* Urgency Warning */}
          {isUrgent && (
            <div className="bg-yellow-100 dark:bg-yellow-900/50 p-3 rounded-lg border border-yellow-300 dark:border-yellow-700">
              <div className="flex items-center justify-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600 animate-bounce" />
                <p className="text-yellow-700 dark:text-yellow-400 font-bold text-sm">
                  {displayAsTrial 
                    ? 'ستنتهي فترتك التجريبية قريباً!' 
                    : 'سينتهي اشتراكك قريباً!'}
                </p>
              </div>
            </div>
          )}
          
          <Button
            onClick={() => window.location.href = '/subscription'}
            variant="outline"
            className={`w-full font-medium ${
              isUrgent 
                ? 'border-yellow-400 text-yellow-700 hover:bg-yellow-50 dark:border-yellow-600 dark:text-yellow-400 dark:hover:bg-yellow-900/30' 
                : 'border-current'
            } transform transition-all duration-200 hover:scale-105`}
          >
            <Crown className="w-4 h-4 mr-2" />
            {displayAsTrial ? 'ترقية لاشتراك مدفوع' : 'تجديد الاشتراك'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default CreativeSubscriptionCountdown;