import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface TrialCountdownProps {
  endTime: string;
  onExpired?: () => void;
}

export const TrialCountdown: React.FC<TrialCountdownProps> = ({ endTime, onExpired }) => {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isExpired: boolean;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: false });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const end = new Date(endTime).getTime();
      const difference = end - now;

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeLeft({ days, hours, minutes, seconds, isExpired: false });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true });
        if (onExpired) {
          onExpired();
        }
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [endTime, onExpired]);

  if (timeLeft.isExpired) {
    return (
      <Badge variant="destructive" className="flex items-center gap-1">
        <AlertTriangle className="h-3 w-3" />
        انتهت التجربة المجانية
      </Badge>
    );
  }

  const formatTime = (value: number) => value.toString().padStart(2, '0');

  return (
    <div className="flex items-center gap-2">
      <Clock className="h-4 w-4 text-blue-600" />
      <div className="flex items-center gap-1 font-mono text-sm">
        {timeLeft.days > 0 && (
          <>
            <span className="bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded text-blue-800 dark:text-blue-200">
              {formatTime(timeLeft.days)}
            </span>
            <span className="text-gray-500">:</span>
          </>
        )}
        <span className="bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded text-blue-800 dark:text-blue-200">
          {formatTime(timeLeft.hours)}
        </span>
        <span className="text-gray-500">:</span>
        <span className="bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded text-blue-800 dark:text-blue-200">
          {formatTime(timeLeft.minutes)}
        </span>
        <span className="text-gray-500">:</span>
        <span className="bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded text-blue-800 dark:text-blue-200">
          {formatTime(timeLeft.seconds)}
        </span>
      </div>
      <div className="text-xs text-gray-500 dark:text-gray-400">
        {timeLeft.days > 0 ? 'أيام:ساعات:دقائق:ثواني' : 'ساعات:دقائق:ثواني'}
      </div>
    </div>
  );
};