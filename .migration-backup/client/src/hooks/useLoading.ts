
import { useState, useEffect } from 'react';

interface UseLoadingOptions {
  minLoadingTime?: number; // الحد الأدنى لوقت التحميل بالملي ثانية
  showOnInitialLoad?: boolean; // إظهار التحميل عند التحميل الأولي
}

export function useLoading(options: UseLoadingOptions = {}) {
  const { minLoadingTime = 1000, showOnInitialLoad = true } = options;
  const [isLoading, setIsLoading] = useState(showOnInitialLoad);
  const [loadingMessage, setLoadingMessage] = useState("جاري التحميل...");

  // إظهار التحميل مع رسالة مخصصة
  const showLoading = (message?: string) => {
    if (message) setLoadingMessage(message);
    setIsLoading(true);
  };

  // إخفاء التحميل مع احترام الحد الأدنى للوقت
  const hideLoading = () => {
    setTimeout(() => {
      setIsLoading(false);
    }, minLoadingTime);
  };

  // تحديث رسالة التحميل
  const updateMessage = (message: string) => {
    setLoadingMessage(message);
  };

  return {
    isLoading,
    loadingMessage,
    showLoading,
    hideLoading,
    updateMessage,
  };
}

// Hook مخصص للتحميل التلقائي للصفحات
export function usePageLoading(loadingTime: number = 1500) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, loadingTime);

    return () => clearTimeout(timer);
  }, [loadingTime]);

  return isLoading;
}
