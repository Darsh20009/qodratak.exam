import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Clock, 
  Calendar, 
  Star, 
  CheckCircle, 
  AlertTriangle,
  Gift
} from 'lucide-react';

interface FreeTrialCountdownProps {
  user: any;
  onUpgrade?: () => void;
}

export const FreeTrialCountdown: React.FC<FreeTrialCountdownProps> = ({ 
  user, 
  onUpgrade 
}) => {
  const [timeRemaining, setTimeRemaining] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isExpired: boolean;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: false });

  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!user?.freeTrialData?.endDate) {
      return;
    }

    const updateCountdown = () => {
      const now = new Date();
      const endDate = new Date(user.freeTrialData.endDate);
      const startDate = new Date(user.freeTrialData.startDate);
      
      const totalDuration = endDate.getTime() - startDate.getTime();
      const remainingTime = endDate.getTime() - now.getTime();
      
      if (remainingTime <= 0) {
        setTimeRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true });
        setProgress(0);
        return;
      }

      const days = Math.floor(remainingTime / (1000 * 60 * 60 * 24));
      const hours = Math.floor((remainingTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((remainingTime % (1000 * 60)) / 1000);

      setTimeRemaining({ days, hours, minutes, seconds, isExpired: false });
      
      // Calculate progress (0-100)
      const progressPercentage = Math.max(0, Math.min(100, (remainingTime / totalDuration) * 100));
      setProgress(progressPercentage);
    };

    // Update immediately
    updateCountdown();

    // Update every second
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [user?.freeTrialData]);

  if (!user?.freeTrialData?.isActive) {
    return null;
  }

  const { days, hours, minutes, seconds, isExpired } = timeRemaining;

  if (isExpired) {
    return (
      <Card className="border-red-200 bg-red-50 dark:bg-red-900/20">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2 text-red-600">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-xl font-bold">انتهت فترة التجربة المجانية</h3>
            </div>
            <p className="text-red-700 dark:text-red-300">
              لقد انتهت فترة التجربة المجانية البالغة 7 أيام. يرجى الترقية للمتابعة
            </p>
            {onUpgrade && (
              <Button onClick={onUpgrade} className="bg-red-600 hover:bg-red-700">
                ترقية الحساب الآن
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getCountdownColor = () => {
    if (days >= 5) return "from-green-500 to-green-600";
    if (days >= 3) return "from-yellow-500 to-yellow-600";
    if (days >= 1) return "from-orange-500 to-orange-600";
    return "from-red-500 to-red-600";
  };

  const getTextColor = () => {
    if (days >= 5) return "text-green-600";
    if (days >= 3) return "text-yellow-600";
    if (days >= 1) return "text-orange-600";
    return "text-red-600";
  };

  return (
    <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-emerald-600 dark:from-blue-900/20 dark:to-emerald-600/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
          <Gift className="w-6 h-6" />
          التجربة المجانية - 7 أيام
          <Badge variant="secondary" className="ml-auto">
            مفعل
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>الوقت المتبقي</span>
            <span className={getTextColor()}>
              {Math.round(progress)}% متبقي
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Countdown Display */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className={`text-3xl font-bold bg-gradient-to-r ${getCountdownColor()} bg-clip-text text-transparent`}>
              {days}
            </div>
            <div className="text-xs text-muted-foreground">أيام</div>
          </div>
          <div className="text-center">
            <div className={`text-3xl font-bold bg-gradient-to-r ${getCountdownColor()} bg-clip-text text-transparent`}>
              {hours}
            </div>
            <div className="text-xs text-muted-foreground">ساعات</div>
          </div>
          <div className="text-center">
            <div className={`text-3xl font-bold bg-gradient-to-r ${getCountdownColor()} bg-clip-text text-transparent`}>
              {minutes}
            </div>
            <div className="text-xs text-muted-foreground">دقائق</div>
          </div>
          <div className="text-center">
            <div className={`text-3xl font-bold bg-gradient-to-r ${getCountdownColor()} bg-clip-text text-transparent`}>
              {seconds}
            </div>
            <div className="text-xs text-muted-foreground">ثوان</div>
          </div>
        </div>

        {/* Trial Info */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm text-green-600">
            <CheckCircle className="w-4 h-4" />
            <span>حساب مجاني مفعّل</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-blue-500" />
            <span>
              بدأ في: {new Date(user.freeTrialData.startDate).toLocaleDateString('ar-EG')}
            </span>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-green-700" />
            <span>
              ينتهي في: {new Date(user.freeTrialData.endDate).toLocaleDateString('ar-EG')}
            </span>
          </div>
        </div>

        {/* Features Available */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm">الميزات المتاحة في التجربة:</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-green-500" />
              <span>اختبارات غير محدودة</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-green-500" />
              <span>تحليلات مفصلة</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-green-500" />
              <span>حفظ الأسئلة</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-green-500" />
              <span>إدارة الوقت</span>
            </div>
          </div>
        </div>

        {/* Upgrade Prompt */}
        {days <= 2 && onUpgrade && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 rounded-lg p-4">
            <div className="text-center space-y-2">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                ⚠️ تنتهي تجربتك المجانية خلال {days} أيام
              </p>
              <Button 
                onClick={onUpgrade} 
                size="sm"
                className="bg-yellow-600 hover:bg-yellow-700"
              >
                <Star className="w-4 h-4 mr-2" />
                ترقية الحساب
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};