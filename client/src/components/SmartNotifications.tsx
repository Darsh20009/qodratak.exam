
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  X, 
  Trophy, 
  Target, 
  Flame, 
  Star,
  Calendar,
  Clock,
  TrendingUp,
  Gift,
  Zap,
  Crown
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Notification {
  id: string;
  type: 'achievement' | 'reminder' | 'challenge' | 'milestone' | 'tip' | 'streak';
  title: string;
  message: string;
  icon: React.ReactNode;
  color: string;
  priority: 'low' | 'medium' | 'high';
  timestamp: Date;
  actionText?: string;
  actionCallback?: () => void;
}

export function SmartNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'achievement',
      title: '🏆 إنجاز جديد!',
      message: 'تهانينا! لقد فتحت شارة "سيد المنطق"',
      icon: <Trophy className="h-5 w-5" />,
      color: 'from-yellow-400 to-orange-500',
      priority: 'high',
      timestamp: new Date(),
      actionText: 'عرض الإنجاز',
      actionCallback: () => console.log('عرض الإنجاز')
    },
    {
      id: '2', 
      type: 'streak',
      title: '🔥 سلسلة رائعة!',
      message: 'لديك streak لمدة 7 أيام! استمر هكذا!',
      icon: <Flame className="h-5 w-5" />,
      color: 'from-red-400 to-pink-500',
      priority: 'medium',
      timestamp: new Date(Date.now() - 300000),
      actionText: 'مواصلة التعلم',
      actionCallback: () => console.log('مواصلة التعلم')
    },
    {
      id: '3',
      type: 'reminder',
      title: '📚 وقت المراجعة',
      message: 'حان وقت مراجعة اختبار الرياضيات',
      icon: <Clock className="h-5 w-5" />,
      color: 'from-blue-400 to-cyan-500',
      priority: 'medium',
      timestamp: new Date(Date.now() - 600000),
      actionText: 'ابدأ المراجعة',
      actionCallback: () => console.log('ابدأ المراجعة')
    },
    {
      id: '4',
      type: 'challenge',
      title: '⚡ تحدي جديد!',
      message: 'تحدي البرق: أجب على 10 أسئلة في 5 دقائق',
      icon: <Zap className="h-5 w-5" />,
      color: 'from-purple-400 to-indigo-500',
      priority: 'high',
      timestamp: new Date(Date.now() - 900000),
      actionText: 'قبول التحدي',
      actionCallback: () => console.log('قبول التحدي')
    },
    {
      id: '5',
      type: 'tip',
      title: '💡 نصيحة ذكية',
      message: 'أفضل أوقاتك للدراسة بين 7-9 مساءً. جرب الدراسة الآن!',
      icon: <Star className="h-5 w-5" />,
      color: 'from-green-400 to-teal-500',
      priority: 'low',
      timestamp: new Date(Date.now() - 1200000),
      actionText: 'بدء جلسة',
      actionCallback: () => console.log('بدء جلسة')
    }
  ]);

  const [isOpen, setIsOpen] = useState(false);
  const [newNotification, setNewNotification] = useState<Notification | null>(null);

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const dismissAll = () => {
    setNotifications([]);
  };

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'الآن';
    if (diffInMinutes < 60) return `منذ ${diffInMinutes} دقيقة`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `منذ ${diffInHours} ساعة`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `منذ ${diffInDays} يوم`;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-300 bg-red-50 dark:bg-red-900/20';
      case 'medium': return 'border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20';
      case 'low': return 'border-green-300 bg-green-50 dark:bg-green-900/20';
      default: return 'border-gray-300 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  // محاكاة تنبيه جديد كل 30 ثانية
  useEffect(() => {
    const interval = setInterval(() => {
      const randomNotifications = [
        {
          id: Date.now().toString(),
          type: 'milestone' as const,
          title: '🎯 هدف محقق!',
          message: 'أكملت 50 سؤال هذا الأسبوع!',
          icon: <Target className="h-5 w-5" />,
          color: 'from-emerald-400 to-green-500',
          priority: 'medium' as const,
          timestamp: new Date(),
          actionText: 'عرض التقدم'
        },
        {
          id: Date.now().toString(),
          type: 'tip' as const,
          title: '🧠 نصيحة ذكية',
          message: 'درجات أفضل بـ 15% عند الدراسة في هذا الوقت!',
          icon: <TrendingUp className="h-5 w-5" />,
          color: 'from-violet-400 to-purple-500',
          priority: 'low' as const,
          timestamp: new Date(),
          actionText: 'ابدأ الآن'
        }
      ];

      const randomNotification = randomNotifications[Math.floor(Math.random() * randomNotifications.length)];
      setNewNotification(randomNotification);
      setNotifications(prev => [randomNotification, ...prev.slice(0, 9)]);
      
      // إخفاء التنبيه الطائر بعد 5 ثواني
      setTimeout(() => setNewNotification(null), 5000);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {/* أيقونة الجرس */}
      <div className="relative">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="relative p-2"
        >
          <Bell className="h-5 w-5" />
          {notifications.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
              {notifications.length > 9 ? '9+' : notifications.length}
            </span>
          )}
        </Button>

        {/* قائمة التنبيهات */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute right-0 top-12 w-96 max-h-96 overflow-y-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-2xl z-50"
            >
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <h3 className="font-semibold text-lg">التنبيهات</h3>
                <div className="flex gap-2">
                  {notifications.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={dismissAll}>
                      مسح الكل
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>لا توجد تنبيهات جديدة</p>
                  </div>
                ) : (
                  <div className="p-2 space-y-2">
                    {notifications.map((notification) => (
                      <motion.div
                        key={notification.id}
                        layout
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className={`p-3 rounded-lg border-l-4 ${getPriorityColor(notification.priority)} hover:shadow-md transition-shadow`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <div className={`p-2 rounded-lg bg-gradient-to-r ${notification.color} text-white`}>
                              {notification.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-sm mb-1">{notification.title}</h4>
                              <p className="text-xs text-muted-foreground mb-2">{notification.message}</p>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">
                                  {formatTimeAgo(notification.timestamp)}
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  {notification.type}
                                </Badge>
                              </div>
                              {notification.actionText && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="mt-2 h-7 text-xs"
                                  onClick={notification.actionCallback}
                                >
                                  {notification.actionText}
                                </Button>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => dismissNotification(notification.id)}
                            className="p-1 h-6 w-6"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* التنبيه الطائر */}
      <AnimatePresence>
        {newNotification && (
          <motion.div
            initial={{ opacity: 0, x: 300, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 300, scale: 0.8 }}
            className="fixed top-4 right-4 z-50"
          >
            <Card className="w-80 shadow-2xl border-2 bg-white dark:bg-gray-800">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg bg-gradient-to-r ${newNotification.color} text-white`}>
                    {newNotification.icon}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm mb-1">{newNotification.title}</h4>
                    <p className="text-xs text-muted-foreground mb-2">{newNotification.message}</p>
                    {newNotification.actionText && (
                      <Button size="sm" variant="outline" className="h-7 text-xs">
                        {newNotification.actionText}
                      </Button>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setNewNotification(null)}
                    className="p-1 h-6 w-6"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
