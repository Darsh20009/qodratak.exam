import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import SmartSessionManager from "@/lib/smartSessionManager";
import { 
  DiamondIcon, 
  User, 
  Trophy, 
  Star, 
  Crown,
  Zap,
  Rocket,
  ArrowRightIcon,
  LogOut,
  UserPlus,
  Settings,
  RefreshCw,
  Clock,
  AlertTriangle,
  Sparkles,
  Shield,
  Cpu,
  Database
} from "lucide-react";
import CreativeSubscriptionCountdown from "@/components/CreativeSubscriptionCountdown";
import { FreeTrialCountdown } from "@/components/FreeTrialCountdown";

export default function WorkingProfile() {
  const [smartUser, setSmartUser] = useState<any>(null);
  const [sessionStats, setSessionStats] = useState<any>(null);
  
  // Get user from server API - return null on 401 for guest mode
  const [guestUser, setGuestUser] = useState<any>(null);
  const createNewUser = () => {};
  const { data: serverUser, isLoading, error } = useQuery<any>({
    queryKey: ['/api/user'],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
    staleTime: 0
  });

  useEffect(() => {
    // إعطاء الأولوية لبيانات الخادم أولاً
    if (serverUser) {
      // مستخدم مسجل من الخادم - إزالة النظام المحلي
      SmartSessionManager.clearSession();
      setSmartUser(null);
      setSessionStats(null);
      
      // إرسال حدث لتحديث الشريط الجانبي
      window.dispatchEvent(new CustomEvent('serverUserUpdated', { detail: serverUser }));
      console.log('🔄 تم إرسال تحديث بيانات المستخدم للشريط الجانبي:', serverUser.subscription?.type);
    } else {
      // لا يوجد مستخدم من الخادم - استخدام النظام المحلي
      initializeSmartSession();
    }
    
    // الاستماع لتحديثات الجلسة
    const handleSessionUpdate = (event: any) => {
      if (!serverUser) {
        setSmartUser(event.detail);
        updateSessionStats();
      }
    };
    
    window.addEventListener('sessionUpdated', handleSessionUpdate);
    return () => window.removeEventListener('sessionUpdated', handleSessionUpdate);
  }, [serverUser]);

  const initializeSmartSession = () => {
    // فقط للمستخدمين غير المسجلين
    if (!serverUser) {
      let currentUser = SmartSessionManager.getUserSession();
      
      if (!currentUser) {
        currentUser = SmartSessionManager.createEnhancedUser();
      }
      
      setSmartUser(currentUser);
      updateSessionStats();
    }
  };

  const updateSessionStats = () => {
    const stats = SmartSessionManager.getUsageStats();
    setSessionStats(stats);
  };

  const createNewEnhancedUser = () => {
    const newUser = SmartSessionManager.createEnhancedUser();
    setSmartUser(newUser);
    updateSessionStats();
    
    // إرسال حدث لتحديث باقي التطبيق
    window.dispatchEvent(new CustomEvent('userLoggedIn', { detail: newUser }));
  };

  const handleLogout = async () => {
    try {
      SmartSessionManager.clearSession();
      setSmartUser(null);
      setSessionStats(null);
      // Call logout API to clear server session
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Error logging out from server:', error);
    }
    
    // Clear all localStorage data
    localStorage.clear();
    sessionStorage.clear();
    setGuestUser(null);
    
    // Clear cookies
    document.cookie.split(";").forEach(function(c) { 
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
    });
    
    // Dispatch logout event
    window.dispatchEvent(new CustomEvent('userLoggedOut'));
    
    // توجيه المستخدم لصفحة تسجيل الدخول
    window.location.href = "/login";
  };

  const handleLogin = () => {
    // Create guest user only when explicitly requested
    createNewUser();
  };

  const handlePremiumLogin = () => {
    const premiumUser = {
      id: Date.now(),
      name: `عميل مميز ${Date.now().toString().slice(-4)}`,
      email: "premium@qudratak.app",
      subscription: {
        type: Math.random() > 0.5 ? "Pro" : "Pro Life",
        status: "active",
        endDate: (() => {
          const date = new Date();
          date.setDate(date.getDate() + Math.floor(Math.random() * 30) + 5); // Between 5-35 days
          return date.toISOString().split('T')[0]; // Format: YYYY-MM-DD
        })()
      },
      points: Math.floor(Math.random() * 5000) + 2000,
      level: Math.floor(Math.random() * 15) + 10,
      achievements: Math.floor(Math.random() * 20) + 10
    };
    localStorage.setItem("user", JSON.stringify(premiumUser));
    setGuestUser(premiumUser);
    
    // إرسال حدث لتحديث باقي التطبيق
    window.dispatchEvent(new CustomEvent('userLoggedIn', { detail: premiumUser }));
  };

  // إعطاء الأولوية لبيانات الخادم أولاً ثم النظام المحلي
  const currentUser = serverUser || smartUser || {
    name: "مستخدم قدراتك",
    subscription: { type: "Free Enhanced", status: "active", isActive: true },
    points: 1000,
    level: 5,
    achievements: 10
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 text-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
        <p className="mt-4">جاري التحميل...</p>
      </div>
    );
  }

  // If no authenticated user and no guest user, show login options
  if (!currentUser) {
    return (
      <div className="container mx-auto p-6 text-center space-y-6">
        <div className="bg-gradient-to-r from-blue-600 via-green-600 to-amber-600 p-8 rounded-3xl text-white">
          <h2 className="text-3xl font-bold mb-4">مرحباً بك في قدراتك</h2>
          <p className="text-blue-100 mb-6">سجل دخولك للوصول إلى حسابك</p>
          
          <div className="space-y-4">
            <Link href="/login">
              <Button 
                size="lg"
                className="bg-white text-blue-600 hover:bg-gray-100 font-bold w-full"
              >
                <UserPlus className="w-5 h-5 mr-2" />
                تسجيل دخول العملاء المشتركين
              </Button>
            </Link>
            
            <Button 
              onClick={createNewEnhancedUser} 
              size="lg"
              variant="outline"
              className="bg-transparent border-white text-white hover:bg-white hover:text-blue-600 font-bold w-full"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              إنشاء حساب محسن مجاني
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const subscriptionType = currentUser && typeof currentUser.subscription === 'string' 
    ? currentUser.subscription 
    : currentUser?.subscription?.type || 'Free';

  // Define all premium subscription types
  const premiumTypes = ['Pro', 'Pro Life', 'Pro Life Plus', 'Pro Live'];
  const hasActiveSubscription = premiumTypes.includes(subscriptionType) && currentUser?.subscription?.endDate;
  const isSubscriptionExpired = hasActiveSubscription && currentUser?.subscription?.endDate && new Date(currentUser.subscription.endDate) < new Date();

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Enhanced Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl p-8 text-white bg-gradient-to-r from-green-600 via-blue-600 to-cyan-600">
        <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent"></div>
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-cyan-200 bg-clip-text text-transparent">
                مرحباً {currentUser.name}! 
              </h1>
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-yellow-300" />
                <p className="text-cyan-100 text-lg font-medium">
                  {serverUser 
                    ? (premiumTypes.includes(subscriptionType) ? 'عضو مميز مسجل - شكراً لدعمك!' : 'مستخدم مسجل - جميع الميزات متاحة!')
                    : (SmartSessionManager.isPremiumUser() ? 'عضو مميز - شكراً لدعمك!' : 'نظام محسن - جميع الميزات مجانية!')
                  } 
                </p>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="relative">
                {/* أيقونة فريدة لكل نوع مستخدم */}
                {serverUser ? (
                  premiumTypes.includes(subscriptionType) ? (
                    // عضو مميز مسجل - أيقونة تاج مع تأثيرات خاصة
                    <div className="w-20 h-20 bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 rounded-full flex items-center justify-center animate-pulse shadow-2xl relative">
                      <Crown className="w-10 h-10 text-white drop-shadow-lg" />
                      <div className="absolute inset-0 bg-gradient-to-r from-amber-300/30 to-yellow-400/30 rounded-full animate-ping"></div>
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-emerald-400 to-green-500 rounded-full flex items-center justify-center shadow-lg">
                        <span className="text-white text-xs font-bold">👑</span>
                      </div>
                    </div>
                  ) : subscriptionType === "Pro Life" ? (
                    // عضو Pro Life - أيقونة نجمة مع ألوان مميزة
                    <div className="w-20 h-20 bg-gradient-to-r from-green-600 via-pink-500 to-emerald-600 rounded-full flex items-center justify-center animate-bounce shadow-2xl relative">
                      <Star className="w-10 h-10 text-white drop-shadow-lg" />
                      <div className="absolute inset-0 bg-gradient-to-r from-green-600/30 to-amber-600/30 rounded-full animate-pulse"></div>
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-amber-500 to-rose-500 rounded-full flex items-center justify-center shadow-lg">
                        <span className="text-white text-xs font-bold">∞</span>
                      </div>
                    </div>
                  ) : (
                    // مستخدم مسجل عادي - أيقونة حماية أنيقة
                    <div className="w-18 h-18 bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-600 rounded-full flex items-center justify-center animate-pulse shadow-xl relative">
                      <Shield className="w-9 h-9 text-white drop-shadow-lg" />
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-300/20 to-cyan-400/20 rounded-full animate-ping"></div>
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                        <span className="text-white text-xs font-bold">✓</span>
                      </div>
                    </div>
                  )
                ) : (
                  // مستخدم محلي - أيقونة ذكية مع تأثيرات متحركة
                  SmartSessionManager.isPremiumUser() ? (
                    <div className="w-18 h-18 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 rounded-full flex items-center justify-center animate-spin shadow-xl relative">
                      <Sparkles className="w-9 h-9 text-white drop-shadow-lg animate-none" />
                      <div className="absolute inset-0 bg-gradient-to-r from-emerald-300/20 to-teal-400/20 rounded-full animate-pulse"></div>
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full flex items-center justify-center shadow-lg">
                        <span className="text-white text-xs font-bold">⭐</span>
                      </div>
                    </div>
                  ) : (
                    <div className="w-16 h-16 bg-gradient-to-r from-teal-600 via-green-600 to-teal-500 rounded-full flex items-center justify-center animate-pulse shadow-lg relative">
                      <Cpu className="w-8 h-8 text-white drop-shadow-lg" />
                      <div className="absolute inset-0 bg-gradient-to-r from-teal-600/20 to-emerald-600/20 rounded-full animate-ping"></div>
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full flex items-center justify-center shadow-lg">
                        <span className="text-white text-xs font-bold">🔮</span>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
          
          {/* Smart Session Stats - للمستخدمين المحليين فقط */}
          {!serverUser && sessionStats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
                <Cpu className="w-4 h-4 mx-auto mb-1 text-cyan-300" />
                <div className="text-xs text-cyan-200">معرف الجهاز</div>
                <div className="text-sm font-bold text-white">{sessionStats.deviceId}</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
                <Shield className="w-4 h-4 mx-auto mb-1 text-green-300" />
                <div className="text-xs text-cyan-200">حالة الحماية</div>
                <div className="text-sm font-bold text-white">محمي</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
                <Database className="w-4 h-4 mx-auto mb-1 text-blue-300" />
                <div className="text-xs text-cyan-200">نوع الجلسة</div>
                <div className="text-sm font-bold text-white">ذكية</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
                <Star className="w-4 h-4 mx-auto mb-1 text-yellow-300" />
                <div className="text-xs text-cyan-200">الإصدار</div>
                <div className="text-sm font-bold text-white">v2.1</div>
              </div>
            </div>
          )}
          
          {/* Server User Stats - للمستخدمين المسجلين */}
          {serverUser && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
                <User className="w-4 h-4 mx-auto mb-1 text-blue-300" />
                <div className="text-xs text-cyan-200">ID المستخدم</div>
                <div className="text-sm font-bold text-white">#{serverUser.id}</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
                <Shield className="w-4 h-4 mx-auto mb-1 text-green-300" />
                <div className="text-xs text-cyan-200">حالة الحساب</div>
                <div className="text-sm font-bold text-white">مسجل</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
                <Database className="w-4 h-4 mx-auto mb-1 text-green-700" />
                <div className="text-xs text-cyan-200">نوع الحساب</div>
                <div className="text-sm font-bold text-white">{subscriptionType}</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
                <Crown className="w-4 h-4 mx-auto mb-1 text-yellow-300" />
                <div className="text-xs text-cyan-200">الحالة</div>
                <div className="text-sm font-bold text-white">نشط</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* User Stats with Enhanced Icons */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/20 hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6 text-center">
            {/* أيقونة فريدة للمستخدم */}
            <div className="relative mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto shadow-lg">
                {serverUser ? (
                  premiumTypes.includes(subscriptionType) ? (
                    <Crown className="w-6 h-6 text-yellow-300 animate-pulse" />
                  ) : (
                    <User className="w-6 h-6 text-white" />
                  )
                ) : (
                  <Sparkles className="w-6 h-6 text-white animate-pulse" />
                )}
              </div>
              <div className="absolute -top-1 -right-4 w-4 h-4 bg-gradient-to-r from-emerald-400 to-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
            </div>
            <h3 className="font-bold text-lg">{currentUser.name}</h3>
            <Badge className="mt-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white">
              <Crown className="w-3 h-3 mr-1" />
              {premiumTypes.includes(subscriptionType) ? subscriptionType : 'مستخدم مجاني'}
            </Badge>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-600/10 to-emerald-600/10 border-green-400/20 hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6 text-center">
            <div className="relative mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-green-600 to-amber-600 rounded-full flex items-center justify-center mx-auto shadow-lg animate-pulse">
                <Star className="w-6 h-6 text-yellow-300" />
              </div>
              <div className="absolute -bottom-1 -right-4 w-6 h-6 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">💎</span>
              </div>
            </div>
            <h3 className="font-bold text-lg">{currentUser.points || 1000}</h3>
            <p className="text-sm text-muted-foreground">نقطة</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-500/20 hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6 text-center">
            <div className="relative mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-lg animate-bounce">
                <Trophy className="w-6 h-6 text-yellow-300" />
              </div>
              <div className="absolute -top-1 -left-4 w-5 h-5 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">🏆</span>
              </div>
            </div>
            <h3 className="font-bold text-lg">المستوى {currentUser.level || 10}</h3>
            <p className="text-sm text-muted-foreground">خبير</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 border-orange-500/20 hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6 text-center">
            <div className="relative mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto shadow-lg">
                <Zap className="w-6 h-6 text-yellow-300 animate-pulse" />
              </div>
              <div className="absolute -bottom-1 -left-4 w-6 h-6 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">🎯</span>
              </div>
            </div>
            <h3 className="font-bold text-lg">{currentUser.achievements || 5}</h3>
            <p className="text-sm text-muted-foreground">إنجاز</p>
          </CardContent>
        </Card>
      </div>

      {/* Free Trial Countdown for Free Users */}
      {!premiumTypes.includes(subscriptionType) && (
        <div className="mb-6">
          <Card className="bg-gradient-to-br from-blue-50 to-teal-500 dark:from-blue-900/20 dark:to-teal-500/20 border-2 border-blue-200 dark:border-blue-700 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-teal-500 rounded-full flex items-center justify-center shadow-lg">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-blue-800 dark:text-blue-200">
                      ⏰ عداد الأيام المجانية
                    </h3>
                    <p className="text-blue-600 dark:text-blue-300 text-sm">
                      تجربة مجانية بمميزات محدودة - 7 أيام
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-black text-blue-600">7</div>
                  <div className="text-sm text-blue-500">أيام كاملة</div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800/50 rounded-lg p-4 border border-blue-200 dark:border-blue-600">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="space-y-2">
                    <div className="text-2xl font-bold text-orange-600">⚠️</div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      <div className="font-semibold">مميزات محدودة</div>
                      <div className="text-xs">تجربة أساسية</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-2xl font-bold text-red-600">🔒</div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      <div className="font-semibold">اختبارات محدودة</div>
                      <div className="text-xs">عدد قليل يومياً</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-3">
                <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm font-medium">⚠️ تذكير مهم</span>
                </div>
                <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                  تجربة محدودة لكل جهاز. للحصول على المميزات الكاملة، جرب "التجربة البرو ليوم واحد" مجاناً!
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Subscription Countdown for Premium Users */}
      {hasActiveSubscription && (
        <CreativeSubscriptionCountdown 
          className="mb-6"
        />
      )}

      {/* Expired Subscription Alert */}
      {isSubscriptionExpired && (
        <Card className="mb-6 border-red-500 bg-gradient-to-r from-red-50 to-amber-600 dark:from-red-900/20 dark:to-amber-600/20">
          <CardContent className="p-6 text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-amber-600 rounded-full flex items-center justify-center">
                <span className="text-white text-2xl">⚠️</span>
              </div>
            </div>
            <h3 className="text-xl font-bold text-red-600 dark:text-red-400 mb-2">
              انتهت صلاحية اشتراكك
            </h3>
            <p className="text-red-500 dark:text-red-300 mb-4">
              اشتراكك {currentUser.subscription.type} انتهى في {new Date(currentUser.subscription.endDate).toLocaleDateString('ar-SA')}
            </p>
            <Link href="/subscription">
              <Button className="bg-gradient-to-r from-red-500 to-amber-600 hover:from-red-600 hover:to-amber-600 text-white font-bold">
                تجديد الاشتراك الآن
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Features Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Rocket className="w-6 h-6 text-blue-500" />
            الميزات المتاحة لك
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 p-6 rounded-2xl border border-green-200 dark:border-green-700">
              <h4 className="font-bold text-green-700 dark:text-green-400 mb-4 text-lg flex items-center gap-2">
                <Star className="w-5 h-5" />
                🌟 جميع الميزات متاحة مجاناً!
              </h4>
              <p className="text-green-600 dark:text-green-300 mb-4 text-sm">
                نؤمن في قدراتك أن التعليم حق للجميع. لذلك جميع ميزاتنا المتقدمة متاحة مجاناً لكل المستخدمين!
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                  <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="font-medium">🚀 اختبارات غير محدودة</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-green-100 dark:bg-green-100/20">
                  <div className="w-3 h-3 bg-green-100 rounded-full animate-pulse"></div>
                  <span className="font-medium">🧠 المساعد الذكي المتقدم</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="font-medium">⏰ إدارة الوقت الشاملة</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20">
                  <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
                  <span className="font-medium">📚 المكتبة الكاملة</span>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-100 dark:bg-amber-100/20">
                  <div className="w-3 h-3 bg-amber-100 rounded-full animate-pulse"></div>
                  <span className="font-medium">🎮 التحديات والألعاب</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-teal-100 dark:bg-teal-100/20">
                  <div className="w-3 h-3 bg-teal-100 rounded-full animate-pulse"></div>
                  <span className="font-medium">📊 تحليلات مفصلة</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-teal-50 dark:bg-teal-900/20">
                  <div className="w-3 h-3 bg-teal-500 rounded-full animate-pulse"></div>
                  <span className="font-medium">📁 المجلدات المخصصة</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-cyan-50 dark:bg-cyan-900/20">
                  <div className="w-3 h-3 bg-cyan-500 rounded-full animate-pulse"></div>
                  <span className="font-medium">📱 تحميل التطبيق</span>
                </div>
              </div>
            </div>

            {premiumTypes.includes(subscriptionType) && (
              <div className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 p-4 rounded-xl border border-amber-200 dark:border-amber-700">
                <p className="text-amber-700 dark:text-amber-300 text-sm text-center flex items-center justify-center gap-2">
                  <Crown className="w-4 h-4" />
                  شكراً لدعمك! أنت من العملاء المميزين الذين يساعدوننا في توفير التعليم المجاني للجميع
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/qiyas">
          <Button className="w-full h-16 bg-gradient-to-r from-blue-500 to-emerald-600 hover:from-blue-600 hover:to-emerald-600 text-white text-lg font-bold">
            ابدأ اختبار قياس
            <ArrowRightIcon className="w-5 h-5 mr-2" />
          </Button>
        </Link>
        <Link href="/install">
          <Button variant="outline" className="w-full h-16 border-2 text-lg font-bold hover:bg-muted">
            تحميل التطبيق
            <ArrowRightIcon className="w-5 h-5 mr-2" />
          </Button>
        </Link>
      </div>

      {/* Account Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-6 h-6 text-gray-500" />
            إدارة الحساب
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">


            {/* Free Trial Countdown for Verified Free Accounts */}
            {serverUser && serverUser.freeTrialData?.isActive && (
              <div className="mb-6">
                <FreeTrialCountdown 
                  user={serverUser}
                  onUpgrade={() => window.location.href = '/subscription'}
                />
              </div>
            )}

            {/* Account Type Buttons */}
            {!premiumTypes.includes(subscriptionType) && (
              <div className="space-y-3">
                <h4 className="font-semibold text-sm">خيارات التسجيل والدخول</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Link href="/login">
                    <Button 
                      className="w-full bg-gradient-to-r from-blue-500 to-emerald-600 hover:from-blue-600 hover:to-emerald-600 text-white h-12"
                    >
                      <Crown className="w-5 h-5 mr-2" />
                      دخول عميل Pro / Pro Life
                    </Button>
                  </Link>
                  <Link href="/free-signup">
                    <Button 
                      variant="outline"
                      className="flex items-center gap-2 h-12 border-2 border-green-500 text-green-600 hover:bg-green-50"
                    >
                      <UserPlus className="w-5 h-5" />
                      طلب حساب مجاني (7 أيام)
                    </Button>
                  </Link>
                </div>
                <div className="mt-3">
                  <Button 
                    onClick={createNewEnhancedUser}
                    variant="outline" 
                    className="w-full flex items-center gap-2 h-12"
                  >
                    <Sparkles className="w-5 h-5" />
                    إنشاء حساب محسن محلي
                  </Button>
                </div>
              </div>
            )}
            
            {/* General Account Management */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm">عمليات الحساب</h4>
              <div className="grid grid-cols-1 gap-3">
                <Button 
                  onClick={handleLogout}
                  variant="destructive" 
                  className="flex items-center gap-2 h-12"
                >
                  <LogOut className="w-5 h-5" />
                  تسجيل خروج
                </Button>
              </div>
            </div>
          </div>
          
          {/* Enhanced Upgrade Section - للمستخدمين المحليين والمجانيين فقط */}
          {(!serverUser && !SmartSessionManager.isPremiumUser()) && (
            <div className="mt-6 p-6 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 rounded-2xl border-2 border-amber-200 dark:border-amber-700">
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center gap-2">
                  <Crown className="w-6 h-6 text-amber-600" />
                  <h3 className="text-xl font-bold text-amber-800 dark:text-amber-200">أصبح عضواً مميزاً</h3>
                  <Sparkles className="w-6 h-6 text-amber-600" />
                </div>
                <p className="text-amber-700 dark:text-amber-300 text-sm">
                  🌟 ادعم المنصة واحصل على مميزات إضافية مثل الأولوية في الدعم الفني وشارة العضو المميز
                </p>
                <Link href="/subscription">
                  <Button className="bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white font-bold px-8 py-3 rounded-xl shadow-lg">
                    <Crown className="w-5 h-5 ml-2" />
                    ترقية الحساب - ادعم قدراتك
                    <Sparkles className="w-5 h-5 mr-2" />
                  </Button>
                </Link>
              </div>
            </div>
          )}
          
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground text-center">
              {serverUser 
                ? (premiumTypes.includes(subscriptionType) 
                    ? '🙏 شكراً لدعمك الكريم كعضو مميز مسجل! مساهمتك تساعدنا في الحفاظ على المنصة مجانية للجميع'
                    : '🎓 أهلاً بك كمستخدم مسجل! جميع الميزات متاحة لك مجاناً')
                : (SmartSessionManager.isPremiumUser()
                    ? '🙏 شكراً لدعمك الكريم! مساهمتك تساعدنا في الحفاظ على المنصة مجانية للجميع'
                    : '💝 في قدراتك نؤمن أن التعليم حق للجميع! جميع الميزات متاحة مجاناً مع نظام الجلسة المحسن')
              }
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}