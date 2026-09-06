import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

// Device fingerprinting for trial tracking
const generateDeviceFingerprint = (): string => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('Device fingerprint', 2, 2);
  }
  
  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    navigator.languages?.join(',') || '',
    screen.width + 'x' + screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    !!window.localStorage,
    !!window.sessionStorage,
    canvas.toDataURL()
  ].join('|');
  
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return Math.abs(hash).toString(36);
};

interface SubscriptionStatus {
  hasActiveSubscription: boolean;
  subscriptionType: 'Free' | 'Pro' | 'Pro Life' | 'Pro Life Plus';
  subscriptionEndDate?: Date;
  isTrialActive: boolean;
  trialEndDate?: Date;
  daysRemaining?: number;
  hoursRemaining?: number;
  minutesRemaining?: number;
  isExpired: boolean;
  deviceId: string;
  canAccessPremiumFeatures: boolean;
}

interface CountdownData {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  expired: boolean;
}

export const useSubscription = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [deviceId] = useState(() => generateDeviceFingerprint());
  const [countdown, setCountdown] = useState<CountdownData>({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: false });

  // Check subscription status
  const subscriptionQuery = useQuery({
    queryKey: ['/api/subscription/status', deviceId],
    queryFn: async (): Promise<SubscriptionStatus> => {
      // Get user data from localStorage
      let userId = null;
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const user = JSON.parse(storedUser);
          userId = user.id || user._id;
        }
      } catch (error) {
        console.error('Error parsing user from localStorage:', error);
      }

      const response = await fetch('/api/subscription/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ deviceId, userId })
      });
      
      if (!response.ok) {
        throw new Error('Failed to check subscription status');
      }
      
      return response.json();
    },
    refetchInterval: 10000,
    refetchOnWindowFocus: true,
    refetchOnMount: 'always',
  });

  // Start trial mutation
  const startTrialMutation = useMutation({
    mutationFn: async (userId?: number) => {
      const response = await fetch('/api/subscription/start-trial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId, userId })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'فشل في بدء الفترة التجريبية');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/subscription/status'] });
      toast({
        title: "تم بدء الفترة التجريبية!",
        description: "يمكنك الآن الاستمتاع بجميع المميزات لمدة 7 أيام مجاناً",
        className: "bg-green-500 text-white"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ في بدء الفترة التجريبية",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Calculate countdown timer
  const calculateCountdown = (endDate: Date): CountdownData => {
    const now = new Date();
    const difference = endDate.getTime() - now.getTime();
    
    if (difference <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
    }
    
    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);
    
    return { days, hours, minutes, seconds, expired: false };
  };

  // Update countdown immediately when subscription data is available
  useEffect(() => {
    const subscription = subscriptionQuery.data;
    if (!subscription) return;

    let endDate: Date | null = null;
    
    if (subscription.hasActiveSubscription && subscription.subscriptionEndDate) {
      endDate = new Date(subscription.subscriptionEndDate);
    } else if (subscription.isTrialActive && subscription.trialEndDate) {
      endDate = new Date(subscription.trialEndDate);
    }

    if (endDate) {
      const newCountdown = calculateCountdown(endDate);
      setCountdown(newCountdown);
      
    }
  }, [subscriptionQuery.data]);

  // Update countdown every second
  useEffect(() => {
    const interval = setInterval(() => {
      const subscription = subscriptionQuery.data;
      if (!subscription) return;

      let endDate: Date | null = null;
      
      if (subscription.hasActiveSubscription && subscription.subscriptionEndDate) {
        endDate = new Date(subscription.subscriptionEndDate);
      } else if (subscription.isTrialActive && subscription.trialEndDate) {
        endDate = new Date(subscription.trialEndDate);
      }

      if (endDate) {
        const newCountdown = calculateCountdown(endDate);
        setCountdown(newCountdown);

        // If expired, refetch subscription status
        if (newCountdown.expired) {
          queryClient.invalidateQueries({ queryKey: ['/api/subscription/status'] });
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [subscriptionQuery.data, queryClient]);

  // Redirect to subscription page when premium features are accessed but user has no access
  const checkPremiumAccess = (showToast = true): boolean => {
    const subscription = subscriptionQuery.data;
    
    const isPremium = Boolean(
      subscription &&
      !subscription.isExpired &&
      subscription.hasActiveSubscription &&
      subscription.canAccessPremiumFeatures,
    );
    
    if (!isPremium) {
      if (showToast) {
        toast({
          title: "مميزات مدفوعة",
          description: "هذه الميزة متاحة للمشتركين فقط. يرجى الاشتراك للوصول إليها.",
          variant: "destructive"
        });
        
        // Redirect to subscription page
        setTimeout(() => {
          window.location.href = '/subscription';
        }, 2000);
      }
      return false;
    }
    
    return true;
  };

  // Start trial for current device
  const startTrial = (userId?: number) => {
    startTrialMutation.mutate(userId);
  };

  return {
    subscription: subscriptionQuery.data,
    isLoading: subscriptionQuery.isLoading,
    error: subscriptionQuery.error,
    countdown,
    deviceId,
    startTrial,
    isStartingTrial: startTrialMutation.isPending,
    checkPremiumAccess,
    refetchSubscription: () => queryClient.invalidateQueries({ queryKey: ['/api/subscription/status'] })
  };
};

export default useSubscription;