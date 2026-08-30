import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Clock, Gift, Crown } from 'lucide-react';
import { FreeTrialManager } from '@/lib/freeTrialManager';
import { TrialCountdown } from '@/components/TrialCountdown';

interface FreeTrialManagerProps {
  onTrialActivated?: () => void;
  onTrialExpired?: () => void;
}

export const FreeTrialManagerComponent: React.FC<FreeTrialManagerProps> = ({
  onTrialActivated,
  onTrialExpired
}) => {
  const [trialStatus, setTrialStatus] = useState<{
    isValid: boolean;
    daysRemaining: number;
    hoursRemaining: number;
    isNewUser: boolean;
    message: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    setIsLoading(true);
    try {
      const status = await FreeTrialManager.checkTrialStatus();
      setTrialStatus(status);
      
      if (status.isValid && onTrialActivated) {
        onTrialActivated();
      } else if (!status.isValid && !status.isNewUser && onTrialExpired) {
        onTrialExpired();
      }
    } catch (error) {
      console.error('Error checking trial status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const startTrial = async () => {
    setIsLoading(true);
    try {
      const success = await FreeTrialManager.startFreeTrial();
      if (success) {
        await checkStatus();
        if (onTrialActivated) {
          onTrialActivated();
        }
      }
    } catch (error) {
      console.error('Error starting trial:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!trialStatus) {
    return (
      <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700">
        <CardContent className="p-6 text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-700 dark:text-red-300">
            حدث خطأ في فحص حالة التجربة المجانية
          </p>
        </CardContent>
      </Card>
    );
  }

  if (trialStatus.isNewUser) {
    return (
      <Card className="bg-gradient-to-br from-blue-50 to-teal-500 dark:from-blue-900/20 dark:to-teal-500/20 border-blue-200 dark:border-blue-700">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <Gift className="h-16 w-16 text-blue-600" />
              <div className="absolute -top-1 -right-1 h-6 w-6 bg-yellow-400 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-yellow-800">!</span>
              </div>
            </div>
          </div>
          <CardTitle className="text-2xl text-blue-800 dark:text-blue-200">
            🎉 مرحباً بك في قدراتك!
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed">
            احصل على <span className="font-bold text-blue-600">7 أيام مجانية</span> كاملة للوصول إلى جميع المميزات المتقدمة
          </p>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-center gap-2 text-green-600">
              <Clock className="h-4 w-4" />
              <span className="text-sm font-medium">7 أيام كاملة مجاناً</span>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              * تجربة واحدة فقط لكل جهاز
            </div>
          </div>

          <Button
            onClick={startTrial}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-500 text-white py-3 text-lg font-semibold"
            data-testid="start-free-trial"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                جاري التفعيل...
              </div>
            ) : (
              '🚀 ابدأ تجربتك المجانية الآن'
            )}
          </Button>
          
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
            <p className="text-xs text-blue-700 dark:text-blue-300 text-center leading-relaxed">
              ⚠️ تجربة واحدة فقط لكل جهاز/مستخدم<br />
              📱 سيتم منع الوصول نهائياً بعد 7 أيام<br />
              💎 للاستمرار: اختر إحدى خططنا المدفوعة
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (trialStatus.isValid) {
    return (
      <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-700">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <Crown className="h-12 w-12 text-green-600" />
              <div className="absolute inset-0 bg-green-400/20 rounded-full animate-pulse"></div>
            </div>
          </div>
          <CardTitle className="text-xl text-green-800 dark:text-green-200">
            ✨ تجربتك المجانية نشطة
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="flex flex-col items-center gap-3">
            <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
              <Clock className="h-3 w-3 mr-1" />
              {trialStatus.daysRemaining > 0 
                ? `متبقي ${trialStatus.daysRemaining} ${trialStatus.daysRemaining === 1 ? 'يوم' : 'أيام'}`
                : `متبقي ${trialStatus.hoursRemaining} ${trialStatus.hoursRemaining === 1 ? 'ساعة' : 'ساعات'}`
              }
            </Badge>
            
            {/* Live Countdown */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-green-200 dark:border-green-700">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">العد التنازلي المباشر:</p>
              <TrialCountdown 
                endTime={sessionStorage.getItem('trialEndTime') || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()}
                onExpired={() => window.location.reload()}
              />
            </div>
          </div>
          
          <p className="text-sm text-gray-600 dark:text-gray-400">
            استمتع بجميع المميزات المتقدمة حتى انتهاء الفترة المجانية
          </p>

          {trialStatus.daysRemaining <= 2 && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
              <div className="text-center">
                <div className="text-2xl mb-2">⏰</div>
                <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-200 mb-3">
                  ستنتهي تجربتك المجانية قريباً!
                </p>
                <Button
                  onClick={() => window.location.href = '/pricing'}
                  size="sm"
                  className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white"
                >
                  عرض الخطط المدفوعة
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-red-50 to-amber-600 dark:from-red-900/20 dark:to-amber-600/20 border-red-200 dark:border-red-700">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <AlertTriangle className="h-12 w-12 text-red-500" />
        </div>
        <CardTitle className="text-xl text-red-800 dark:text-red-200">
          انتهت التجربة المجانية
        </CardTitle>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <p className="text-gray-700 dark:text-gray-300">
          {trialStatus.message}
        </p>
        
        <div className="space-y-3">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4 text-center">
            <div className="text-4xl mb-2">🚫</div>
            <p className="text-sm font-bold text-red-800 dark:text-red-200 mb-1">
              تم حظر الوصول نهائياً!
            </p>
            <p className="text-xs text-red-600 dark:text-red-400">
              لا يمكن استخدام الموقع بعد انتهاء فترة الـ 7 أيام
            </p>
          </div>
          
          <Button
            onClick={() => window.location.href = '/pricing'}
            className="w-full bg-gradient-to-r from-green-600 to-amber-600 hover:from-green-600 hover:to-amber-600 text-white font-bold py-3"
          >
            <Crown className="h-5 w-5 mr-2" />
            🔓 اشترك الآن للمتابعة
          </Button>
          
          <div className="flex gap-2">
            <Button
              onClick={() => window.location.href = '/faq'}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              الأسئلة الشائعة
            </Button>
            <Button
              onClick={() => window.location.href = '/support'}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              الدعم الفني
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};