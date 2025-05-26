
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, 
  Star, 
  Target, 
  Zap, 
  Crown, 
  Gift, 
  Flame,
  TrendingUp,
  Medal,
  Sparkles,
  Rocket,
  Diamond
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  points: number;
  unlocked: boolean;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  category: string;
}

interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  progress: number;
  maxProgress: number;
  reward: number;
  type: 'test' | 'questions' | 'streak' | 'accuracy';
  completed: boolean;
}

interface UserStats {
  points: number;
  level: number;
  streak: number;
  totalTests: number;
  accuracy: number;
  weeklyGoal: number;
  weeklyProgress: number;
}

export function GameificationSystem({ userId }: { userId?: number }) {
  const [userStats, setUserStats] = useState<UserStats>({
    points: 1250,
    level: 12,
    streak: 7,
    totalTests: 45,
    accuracy: 87,
    weeklyGoal: 5,
    weeklyProgress: 3
  });

  const [dailyChallenges, setDailyChallenges] = useState<DailyChallenge[]>([
    {
      id: '1',
      title: '🎯 ماراثون المعرفة',
      description: 'أكمل 3 اختبارات اليوم',
      progress: 1,
      maxProgress: 3,
      reward: 150,
      type: 'test',
      completed: false
    },
    {
      id: '2', 
      title: '⚡ البرق السريع',
      description: 'أجب على 20 سؤال بدقة 90%+',
      progress: 12,
      maxProgress: 20,
      reward: 200,
      type: 'accuracy',
      completed: false
    },
    {
      id: '3',
      title: '🔥 سلسلة الانتصار',
      description: 'حافظ على streak لمدة 7 أيام',
      progress: 7,
      maxProgress: 7,
      reward: 300,
      type: 'streak',
      completed: true
    }
  ]);

  const [achievements, setAchievements] = useState<Achievement[]>([
    {
      id: 'first_test',
      name: 'البداية المشرقة',
      description: 'أكمل اختبارك الأول',
      icon: <Star className="h-6 w-6" />,
      points: 50,
      unlocked: true,
      rarity: 'common',
      category: 'تقدم'
    },
    {
      id: 'speed_demon',
      name: 'شيطان السرعة',
      description: 'أكمل اختبار في أقل من 30 دقيقة',
      icon: <Zap className="h-6 w-6" />,
      points: 200,
      unlocked: true,
      rarity: 'rare',
      category: 'سرعة'
    },
    {
      id: 'perfectionist',
      name: 'الكمالي',
      description: 'احصل على 100% في اختبار صعب',
      icon: <Crown className="h-6 w-6" />,
      points: 500,
      unlocked: false,
      rarity: 'legendary',
      category: 'دقة'
    },
    {
      id: 'marathon_runner',
      name: 'عداء الماراثون',
      description: 'أكمل 50 اختبار',
      icon: <Medal className="h-6 w-6" />,
      points: 1000,
      unlocked: false,
      rarity: 'epic',
      category: 'مثابرة'
    }
  ]);

  const [showReward, setShowReward] = useState(false);
  const [rewardPoints, setRewardPoints] = useState(0);

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'from-gray-400 to-gray-600';
      case 'rare': return 'from-blue-400 to-blue-600';
      case 'epic': return 'from-purple-400 to-purple-600';
      case 'legendary': return 'from-yellow-400 to-orange-500';
      default: return 'from-gray-400 to-gray-600';
    }
  };

  const calculateLevelProgress = () => {
    const currentLevelPoints = userStats.level * 1000;
    const nextLevelPoints = (userStats.level + 1) * 1000;
    const progress = ((userStats.points - currentLevelPoints) / (nextLevelPoints - currentLevelPoints)) * 100;
    return Math.max(0, Math.min(100, progress));
  };

  const triggerReward = (points: number) => {
    setRewardPoints(points);
    setShowReward(true);
    setTimeout(() => setShowReward(false), 3000);
    
    setUserStats(prev => ({
      ...prev,
      points: prev.points + points
    }));
  };

  return (
    <div className="space-y-6 p-6 max-w-6xl mx-auto">
      {/* مكافأة الطيران */}
      <AnimatePresence>
        {showReward && (
          <motion.div
            initial={{ scale: 0, y: 50, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0, y: -50, opacity: 0 }}
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50"
          >
            <Card className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-none shadow-2xl">
              <CardContent className="p-6 text-center">
                <Sparkles className="h-12 w-12 mx-auto mb-4 animate-spin" />
                <h2 className="text-2xl font-bold mb-2">مبروك! 🎉</h2>
                <p className="text-lg">حصلت على {rewardPoints} نقطة!</p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* إحصائيات المستخدم */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-none">
          <CardContent className="p-4 text-center">
            <Trophy className="h-8 w-8 mx-auto mb-2" />
            <p className="text-2xl font-bold">{userStats.points.toLocaleString()}</p>
            <p className="text-sm opacity-90">النقاط</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-teal-600 text-white border-none">
          <CardContent className="p-4 text-center">
            <Target className="h-8 w-8 mx-auto mb-2" />
            <p className="text-2xl font-bold">المستوى {userStats.level}</p>
            <Progress value={calculateLevelProgress()} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-500 to-red-600 text-white border-none">
          <CardContent className="p-4 text-center">
            <Flame className="h-8 w-8 mx-auto mb-2" />
            <p className="text-2xl font-bold">{userStats.streak}</p>
            <p className="text-sm opacity-90">أيام متتالية</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-pink-600 text-white border-none">
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-8 w-8 mx-auto mb-2" />
            <p className="text-2xl font-bold">{userStats.accuracy}%</p>
            <p className="text-sm opacity-90">دقة الإجابات</p>
          </CardContent>
        </Card>
      </div>

      {/* التحديات اليومية */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Rocket className="h-6 w-6 text-blue-500" />
            التحديات اليومية
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {dailyChallenges.map((challenge) => (
              <motion.div
                key={challenge.id}
                whileHover={{ scale: 1.02 }}
                className={`p-4 rounded-lg border-2 ${
                  challenge.completed 
                    ? 'bg-green-50 border-green-300 dark:bg-green-900/20 dark:border-green-700' 
                    : 'bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700'
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-semibold text-sm">{challenge.title}</h3>
                  <Badge variant={challenge.completed ? 'default' : 'secondary'}>
                    {challenge.reward} نقطة
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-3">{challenge.description}</p>
                <div className="space-y-2">
                  <Progress value={(challenge.progress / challenge.maxProgress) * 100} className="h-2" />
                  <div className="flex justify-between text-xs">
                    <span>{challenge.progress}/{challenge.maxProgress}</span>
                    {challenge.completed && (
                      <span className="text-green-600 font-semibold">مكتمل! ✅</span>
                    )}
                  </div>
                </div>
                {challenge.completed && (
                  <Button 
                    size="sm" 
                    className="w-full mt-3"
                    onClick={() => triggerReward(challenge.reward)}
                  >
                    استلام المكافأة
                  </Button>
                )}
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* الإنجازات */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Diamond className="h-6 w-6 text-purple-500" />
            الإنجازات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {achievements.map((achievement) => (
              <motion.div
                key={achievement.id}
                whileHover={{ scale: 1.05 }}
                className={`relative p-4 rounded-lg border-2 text-center transition-all ${
                  achievement.unlocked
                    ? `bg-gradient-to-br ${getRarityColor(achievement.rarity)} text-white shadow-lg`
                    : 'bg-gray-100 border-gray-300 dark:bg-gray-800 dark:border-gray-700 opacity-60'
                }`}
              >
                {achievement.unlocked && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                )}
                <div className="mb-3">{achievement.icon}</div>
                <h3 className="font-bold text-sm mb-1">{achievement.name}</h3>
                <p className="text-xs mb-2 opacity-90">{achievement.description}</p>
                <Badge 
                  variant="secondary" 
                  className={achievement.unlocked ? 'bg-white/20 text-white' : ''}
                >
                  {achievement.points} نقطة
                </Badge>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* الهدف الأسبوعي */}
      <Card className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-none">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold">🎯 هدفك الأسبوعي</h3>
            <Gift className="h-8 w-8" />
          </div>
          <p className="mb-4 opacity-90">أكمل {userStats.weeklyGoal} اختبارات هذا الأسبوع</p>
          <Progress 
            value={(userStats.weeklyProgress / userStats.weeklyGoal) * 100} 
            className="mb-4 h-3 bg-white/20" 
          />
          <div className="flex justify-between text-sm">
            <span>{userStats.weeklyProgress}/{userStats.weeklyGoal} اختبارات</span>
            <span>{Math.round((userStats.weeklyProgress / userStats.weeklyGoal) * 100)}% مكتمل</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
