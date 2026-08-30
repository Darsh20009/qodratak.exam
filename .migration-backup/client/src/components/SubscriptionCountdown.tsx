import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Crown, Clock, AlertTriangle, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import useSubscription from "@/hooks/useSubscription";

interface CountdownDisplayProps {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
  isTrialActive: boolean;
  subscriptionType: string;
}

const CountdownDisplay: React.FC<CountdownDisplayProps> = ({
  days,
  hours,
  minutes,
  seconds,
  isExpired,
  isTrialActive,
  subscriptionType
}) => {
  const { toast } = useToast();

  if (isExpired) {
    return (
      <Card className="bg-gradient-to-r from-red-50 to-amber-600 dark:from-red-900/20 dark:to-amber-600/20 border-red-200 dark:border-red-800">
        <CardHeader className="text-center pb-3">
          <div className="flex items-center justify-center mb-2">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <CardTitle className="text-red-700 dark:text-red-400 text-lg">
            انتهت صلاحية الاشتراك
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-red-600 dark:text-red-300 mb-4">
            انتهت فترة الاشتراك. يرجى التجديد للاستمرار في الوصول للمميزات المتقدمة.
          </p>
          <Button
            onClick={() => window.location.href = '/subscription'}
            className="bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-700 hover:to-amber-600 text-white"
          >
            <Crown className="w-4 h-4 mr-2" />
            تجديد الاشتراك
          </Button>
        </CardContent>
      </Card>
    );
  }

  const formatTime = (num: number) => num.toString().padStart(2, '0');

  return (
    <Card className={`${
      isTrialActive 
        ? 'bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200 dark:border-amber-800'
        : 'bg-gradient-to-r from-blue-50 to-emerald-600 dark:from-blue-900/20 dark:to-emerald-600/20 border-blue-200 dark:border-blue-800'
    }`}>
      <CardHeader className="text-center pb-3">
        <div className="flex items-center justify-center mb-2">
          {isTrialActive ? (
            <Zap className="w-8 h-8 text-amber-500" />
          ) : (
            <Crown className="w-8 h-8 text-blue-500" />
          )}
        </div>
        <CardTitle className={`${
          isTrialActive 
            ? 'text-amber-700 dark:text-amber-400' 
            : 'text-blue-700 dark:text-blue-400'
        } text-lg`}>
          {isTrialActive ? 'الفترة التجريبية' : `اشتراك ${subscriptionType}`}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-center">
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div className="text-center">
            <div className={`text-2xl font-bold ${
              isTrialActive ? 'text-amber-600 dark:text-amber-400' : 'text-blue-600 dark:text-blue-400'
            }`}>
              {formatTime(days)}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">أيام</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${
              isTrialActive ? 'text-amber-600 dark:text-amber-400' : 'text-blue-600 dark:text-blue-400'
            }`}>
              {formatTime(hours)}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">ساعات</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${
              isTrialActive ? 'text-amber-600 dark:text-amber-400' : 'text-blue-600 dark:text-blue-400'
            }`}>
              {formatTime(minutes)}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">دقائق</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${
              isTrialActive ? 'text-amber-600 dark:text-amber-400' : 'text-blue-600 dark:text-blue-400'
            }`}>
              {formatTime(seconds)}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">ثواني</div>
          </div>
        </div>
        
        {days <= 3 && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800 mb-4">
            <p className="text-yellow-700 dark:text-yellow-400 text-sm">
              ⚠️ {isTrialActive ? 'ستنتهي فترتك التجريبية قريباً!' : 'سينتهي اشتراكك قريباً!'}
            </p>
          </div>
        )}

        <Button
          onClick={() => window.location.href = '/subscription'}
          variant="outline"
          size="sm"
          className="w-full"
        >
          <Crown className="w-4 h-4 mr-2" />
          {isTrialActive ? 'ترقية لاشتراك مدفوع' : 'تجديد الاشتراك'}
        </Button>
      </CardContent>
    </Card>
  );
};

interface SubscriptionCountdownProps {
  className?: string;
  showUpgradeButton?: boolean;
}

const SubscriptionCountdown: React.FC<SubscriptionCountdownProps> = ({ 
  className = "", 
  showUpgradeButton = true 
}) => {
  const { subscription, countdown, startTrial, isStartingTrial } = useSubscription();
  const { toast } = useToast();

  if (!subscription) {
    return (
      <Card className={`bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-900/20 dark:to-slate-900/20 ${className}`}>
        <CardContent className="text-center py-6">
          <Clock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500 dark:text-gray-400">جاري تحميل معلومات الاشتراك...</p>
        </CardContent>
      </Card>
    );
  }

  // Free user who hasn't started trial yet
  if (subscription.subscriptionType === 'Free' && !subscription.isTrialActive && !subscription.isExpired) {
    return (
      <Card className={`bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800 ${className}`}>
        <CardHeader className="text-center pb-3">
          <div className="flex items-center justify-center mb-2">
            <Zap className="w-8 h-8 text-green-500" />
          </div>
          <CardTitle className="text-green-700 dark:text-green-400 text-lg">
            ابدأ تجربتك المجانية
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-green-600 dark:text-green-300 mb-4">
            احصل على 7 أيام مجانية من جميع المميزات المتقدمة
          </p>
          <Button
            onClick={() => startTrial()}
            disabled={isStartingTrial}
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white w-full"
          >
            <Zap className="w-4 h-4 mr-2" />
            {isStartingTrial ? 'جاري البدء...' : 'ابدأ الفترة التجريبية'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Show countdown for active subscriptions or trials
  if (subscription.isTrialActive || subscription.hasActiveSubscription) {
    return (
      <div className={className}>
        <CountdownDisplay
          days={countdown.days}
          hours={countdown.hours}
          minutes={countdown.minutes}
          seconds={countdown.seconds}
          isExpired={countdown.expired}
          isTrialActive={subscription.isTrialActive}
          subscriptionType={subscription.subscriptionType}
        />
      </div>
    );
  }

  // Expired subscription/trial
  return (
    <div className={className}>
      <CountdownDisplay
        days={0}
        hours={0}
        minutes={0}
        seconds={0}
        isExpired={true}
        isTrialActive={false}
        subscriptionType={subscription.subscriptionType}
      />
    </div>
  );
};

export default SubscriptionCountdown;