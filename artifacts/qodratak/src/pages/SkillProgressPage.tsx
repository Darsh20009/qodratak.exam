import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, Star, Target, TrendingUp, BarChart3, Brain, Calculator, 
  Crown, Diamond, Flame, Zap, Award, Medal, Shield, Rocket,
  CheckCircle, Lock, Eye, Calendar, Clock, Users, Sparkles
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';

interface SkillLevel {
  name: string;
  level: number; // 0-100
  xp: number;
  nextLevelXP: number;
  mastery: 'novice' | 'apprentice' | 'proficient' | 'expert' | 'master';
  color: string;
  icon: string;
  achievements: Achievement[];
  weaknesses: string[];
  strengths: string[];
  lastTested: string;
  totalTests: number;
  averageScore: number;
  improvement: number; // percentage change
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockedAt: string | null;
  progress: number; // 0-100
  requirements: string;
}

interface LearningPath {
  id: string;
  name: string;
  description: string;
  skills: string[];
  progress: number;
  estimatedTime: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  rewards: string[];
}

export function SkillProgressPage() {
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');

  // Mock data - في التطبيق الحقيقي، هذه البيانات ستأتي من API
  const skillLevels: SkillLevel[] = [
    {
      name: 'التناظر اللفظي',
      level: 78,
      xp: 1560,
      nextLevelXP: 2000,
      mastery: 'proficient',
      color: 'from-blue-500 to-teal-500',
      icon: '🧩',
      achievements: [],
      weaknesses: ['التناظرات المعقدة', 'المفردات النادرة'],
      strengths: ['التناظرات البسيطة', 'المعاني الأساسية'],
      lastTested: '2025-01-01',
      totalTests: 12,
      averageScore: 78,
      improvement: 15
    },
    {
      name: 'إكمال الجمل',
      level: 85,
      xp: 2125,
      nextLevelXP: 2500,
      mastery: 'expert',
      color: 'from-green-500 to-emerald-600',
      icon: '✍️',
      achievements: [],
      weaknesses: ['السياق المعقد'],
      strengths: ['فهم السياق', 'المفردات'],
      lastTested: '2025-01-02',
      totalTests: 15,
      averageScore: 85,
      improvement: 8
    },
    {
      name: 'الهندسة',
      level: 92,
      xp: 2760,
      nextLevelXP: 3000,
      mastery: 'expert',
      color: 'from-green-600 to-amber-600',
      icon: '📐',
      achievements: [],
      weaknesses: [],
      strengths: ['المساحات', 'الأشكال الهندسية', 'الحجوم'],
      lastTested: '2025-01-01',
      totalTests: 18,
      averageScore: 92,
      improvement: 12
    },
    {
      name: 'عمليات حسابية',
      level: 88,
      xp: 2200,
      nextLevelXP: 2500,
      mastery: 'expert',
      color: 'from-cyan-500 to-blue-600',
      icon: '⚡',
      achievements: [],
      weaknesses: ['العمليات المعقدة'],
      strengths: ['الحساب السريع', 'العمليات الأساسية'],
      lastTested: '2025-01-02',
      totalTests: 20,
      averageScore: 88,
      improvement: 10
    }
  ];

  const achievements: Achievement[] = [
    {
      id: 'first_perfect',
      name: 'الدرجة الكاملة',
      description: 'حصل على 100% في أول اختبار',
      icon: '🎯',
      rarity: 'rare',
      unlockedAt: '2025-01-01',
      progress: 100,
      requirements: 'احصل على درجة كاملة في أي اختبار'
    },
    {
      id: 'speed_demon',
      name: 'شيطان السرعة',
      description: 'أكمل اختبار في أقل من نصف الوقت المحدد',
      icon: '⚡',
      rarity: 'epic',
      unlockedAt: '2025-01-02',
      progress: 100,
      requirements: 'أكمل اختبار في أقل من 50% من الوقت'
    },
    {
      id: 'streak_master',
      name: 'سيد التسلسل',
      description: 'حقق تسلسل 20 إجابة صحيحة',
      icon: '🔥',
      rarity: 'legendary',
      unlockedAt: null,
      progress: 75,
      requirements: 'احصل على 20 إجابة صحيحة متتالية'
    },
    {
      id: 'daily_warrior',
      name: 'المحارب اليومي',
      description: 'اختبر يومياً لمدة 30 يوم',
      icon: '🗡️',
      rarity: 'epic',
      unlockedAt: null,
      progress: 60,
      requirements: 'اختبر يومياً لمدة 30 يوم متتالي'
    }
  ];

  const learningPaths: LearningPath[] = [
    {
      id: 'verbal_master',
      name: 'سيد القدرات اللفظية',
      description: 'تطوير شامل لجميع مهارات القدرات اللفظية',
      skills: ['التناظر اللفظي', 'إكمال الجمل', 'استيعاب المقروء', 'الخطأ السياقي'],
      progress: 68,
      estimatedTime: '6 أسابيع',
      difficulty: 'advanced',
      rewards: ['لقب سيد اللغة', '500 XP إضافية', 'شارة ذهبية']
    },
    {
      id: 'math_genius',
      name: 'عبقري الرياضيات',
      description: 'إتقان جميع مفاهيم القدرات الكمية',
      skills: ['الهندسة', 'عمليات حسابية', 'النسبة المئوية', 'الإحصاء'],
      progress: 75,
      estimatedTime: '4 أسابيع',
      difficulty: 'expert',
      rewards: ['لقب عبقري الأرقام', '750 XP', 'شارة ماسية']
    }
  ];

  const getMasteryIcon = (mastery: string) => {
    switch (mastery) {
      case 'master': return <Crown className="h-5 w-5 text-yellow-500" />;
      case 'expert': return <Diamond className="h-5 w-5 text-green-700" />;
      case 'proficient': return <Star className="h-5 w-5 text-blue-500" />;
      case 'apprentice': return <Medal className="h-5 w-5 text-green-500" />;
      default: return <Target className="h-5 w-5 text-gray-500" />;
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'from-yellow-400 to-orange-500';
      case 'epic': return 'from-green-600 to-amber-600';
      case 'rare': return 'from-blue-400 to-teal-500';
      default: return 'from-gray-400 to-gray-500';
    }
  };

  const calculateTotalXP = () => {
    return skillLevels.reduce((total, skill) => total + skill.xp, 0);
  };

  const calculateOverallLevel = () => {
    const avgLevel = skillLevels.reduce((total, skill) => total + skill.level, 0) / skillLevels.length;
    return Math.floor(avgLevel);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-teal-500 dark:from-slate-900 dark:via-blue-900 dark:to-teal-500 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-green-600 to-amber-600 bg-clip-text text-transparent mb-4">
            رحلة التطوير الشخصي
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            تتبع تقدمك في جميع المهارات واكتشف نقاط قوتك وضعفك مع خطط تطوير مخصصة
          </p>
        </motion.div>

        {/* Overall Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12"
        >
          <Card className="bg-gradient-to-br from-blue-500 to-emerald-600 text-white border-0">
            <CardContent className="p-6 text-center">
              <Trophy className="h-8 w-8 mx-auto mb-2" />
              <div className="text-2xl font-bold">{calculateOverallLevel()}</div>
              <div className="text-sm opacity-90">المستوى العام</div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white border-0">
            <CardContent className="p-6 text-center">
              <Star className="h-8 w-8 mx-auto mb-2" />
              <div className="text-2xl font-bold">{calculateTotalXP().toLocaleString()}</div>
              <div className="text-sm opacity-90">نقاط الخبرة</div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-orange-500 to-red-600 text-white border-0">
            <CardContent className="p-6 text-center">
              <Award className="h-8 w-8 mx-auto mb-2" />
              <div className="text-2xl font-bold">{achievements.filter(a => a.unlockedAt).length}</div>
              <div className="text-sm opacity-90">الإنجازات</div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-600 to-amber-600 text-white border-0">
            <CardContent className="p-6 text-center">
              <Brain className="h-8 w-8 mx-auto mb-2" />
              <div className="text-2xl font-bold">{skillLevels.reduce((total, skill) => total + skill.totalTests, 0)}</div>
              <div className="text-sm opacity-90">إجمالي الاختبارات</div>
            </CardContent>
          </Card>
        </motion.div>

        <Tabs defaultValue="skills" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8 h-14">
            <TabsTrigger value="skills" className="text-base">المهارات</TabsTrigger>
            <TabsTrigger value="achievements" className="text-base">الإنجازات</TabsTrigger>
            <TabsTrigger value="paths" className="text-base">خطط التطوير</TabsTrigger>
            <TabsTrigger value="analytics" className="text-base">التحليلات</TabsTrigger>
          </TabsList>

          {/* Skills Tab */}
          <TabsContent value="skills">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {skillLevels.map((skill, index) => (
                <motion.div
                  key={skill.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="h-full hover:shadow-lg transition-all duration-300">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="text-3xl">{skill.icon}</div>
                          <div>
                            <CardTitle className="text-xl">{skill.name}</CardTitle>
                            <div className="flex items-center gap-2 mt-1">
                              {getMasteryIcon(skill.mastery)}
                              <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                                {skill.mastery}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold">{skill.level}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">المستوى</div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {/* XP Progress */}
                      <div className="space-y-2 mb-6">
                        <div className="flex justify-between text-sm">
                          <span>التقدم للمستوى التالي</span>
                          <span>{skill.xp}/{skill.nextLevelXP} XP</span>
                        </div>
                        <Progress 
                          value={(skill.xp / skill.nextLevelXP) * 100} 
                          className={`h-3 bg-gradient-to-r ${skill.color}`}
                        />
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="text-center">
                          <div className="text-lg font-bold text-blue-600">{skill.averageScore}%</div>
                          <div className="text-xs text-gray-600">متوسط النتائج</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-green-600">{skill.totalTests}</div>
                          <div className="text-xs text-gray-600">إجمالي الاختبارات</div>
                        </div>
                        <div className="text-center">
                          <div className={`text-lg font-bold ${skill.improvement > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {skill.improvement > 0 ? '+' : ''}{skill.improvement}%
                          </div>
                          <div className="text-xs text-gray-600">التحسن</div>
                        </div>
                      </div>

                      {/* Strengths & Weaknesses */}
                      <div className="space-y-4">
                        {skill.strengths.length > 0 && (
                          <div>
                            <h4 className="font-semibold text-green-600 mb-2 flex items-center gap-2">
                              <CheckCircle className="h-4 w-4" />
                              نقاط القوة
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {skill.strengths.map((strength, i) => (
                                <Badge key={i} variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                  {strength}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {skill.weaknesses.length > 0 && (
                          <div>
                            <h4 className="font-semibold text-orange-600 mb-2 flex items-center gap-2">
                              <Target className="h-4 w-4" />
                              نقاط التحسين
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {skill.weaknesses.map((weakness, i) => (
                                <Badge key={i} variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                                  {weakness}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <Button 
                        className={`w-full mt-6 bg-gradient-to-r ${skill.color} text-white`}
                        onClick={() => window.location.href = '/level-assessment'}
                      >
                        تحسين هذه المهارة
                        <TrendingUp className="h-4 w-4 mr-2" />
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          {/* Achievements Tab */}
          <TabsContent value="achievements">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {achievements.map((achievement, index) => (
                <motion.div
                  key={achievement.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className={`h-full relative overflow-hidden ${
                    achievement.unlockedAt ? 'bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900' : 'bg-gray-100 dark:bg-gray-800'
                  }`}>
                    {!achievement.unlockedAt && (
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center z-10">
                        <Lock className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                    
                    <div className={`h-2 bg-gradient-to-r ${getRarityColor(achievement.rarity)}`} />
                    
                    <CardContent className="p-6 text-center">
                      <div className="text-4xl mb-3 filter grayscale-0">
                        {achievement.icon}
                      </div>
                      <h3 className="font-bold text-lg mb-2">{achievement.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        {achievement.description}
                      </p>
                      
                      <Badge 
                        className={`mb-4 bg-gradient-to-r ${getRarityColor(achievement.rarity)} text-white border-0`}
                      >
                        {achievement.rarity === 'legendary' ? 'أسطوري' :
                         achievement.rarity === 'epic' ? 'ملحمي' :
                         achievement.rarity === 'rare' ? 'نادر' : 'عادي'}
                      </Badge>

                      {!achievement.unlockedAt && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>التقدم</span>
                            <span>{achievement.progress}%</span>
                          </div>
                          <Progress value={achievement.progress} className="h-2" />
                          <p className="text-xs text-gray-500 mt-2">
                            {achievement.requirements}
                          </p>
                        </div>
                      )}

                      {achievement.unlockedAt && (
                        <div className="flex items-center justify-center gap-2 text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          <span className="text-sm">تم الإنجاز في {achievement.unlockedAt}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          {/* Learning Paths Tab */}
          <TabsContent value="paths">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {learningPaths.map((path, index) => (
                <motion.div
                  key={path.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="h-full hover:shadow-lg transition-all duration-300">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-xl mb-2">{path.name}</CardTitle>
                          <p className="text-gray-600 dark:text-gray-400">{path.description}</p>
                        </div>
                        <Badge variant="outline" className={`${
                          path.difficulty === 'expert' ? 'bg-red-50 text-red-700 border-red-200' :
                          path.difficulty === 'advanced' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                          path.difficulty === 'intermediate' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                          'bg-green-50 text-green-700 border-green-200'
                        }`}>
                          {path.difficulty === 'expert' ? 'خبير' :
                           path.difficulty === 'advanced' ? 'متقدم' :
                           path.difficulty === 'intermediate' ? 'متوسط' : 'مبتدئ'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {/* Progress */}
                      <div className="space-y-2 mb-6">
                        <div className="flex justify-between text-sm">
                          <span>التقدم الإجمالي</span>
                          <span>{path.progress}%</span>
                        </div>
                        <Progress value={path.progress} className="h-3" />
                      </div>

                      {/* Skills */}
                      <div className="mb-6">
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <Brain className="h-4 w-4 text-blue-500" />
                          المهارات المشمولة
                        </h4>
                        <div className="grid grid-cols-2 gap-2">
                          {path.skills.map((skill, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm">
                              <div className="w-2 h-2 bg-blue-500 rounded-full" />
                              {skill}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Meta Info */}
                      <div className="grid grid-cols-2 gap-4 mb-6 text-center">
                        <div>
                          <Clock className="h-5 w-5 mx-auto mb-1 text-gray-500" />
                          <div className="text-sm text-gray-600">{path.estimatedTime}</div>
                        </div>
                        <div>
                          <Trophy className="h-5 w-5 mx-auto mb-1 text-gray-500" />
                          <div className="text-sm text-gray-600">{path.rewards.length} مكافآت</div>
                        </div>
                      </div>

                      {/* Rewards */}
                      <div className="mb-6">
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <Award className="h-4 w-4 text-yellow-500" />
                          المكافآت
                        </h4>
                        <div className="space-y-1">
                          {path.rewards.map((reward, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                              <Sparkles className="h-3 w-3 text-yellow-500" />
                              {reward}
                            </div>
                          ))}
                        </div>
                      </div>

                      <Button 
                        className="w-full bg-gradient-to-r from-green-600 to-teal-500 text-white"
                        onClick={() => window.location.href = '/level-assessment'}
                      >
                        ابدأ خطة التطوير
                        <Rocket className="h-4 w-4 mr-2" />
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Performance Over Time */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-500" />
                    الأداء عبر الزمن
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="text-center text-gray-500">
                      <BarChart3 className="h-12 w-12 mx-auto mb-2" />
                      <p>سيتم عرض مخطط الأداء هنا</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Skills Radar */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-green-700" />
                    خريطة المهارات
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="text-center text-gray-500">
                      <Brain className="h-12 w-12 mx-auto mb-2" />
                      <p>سيتم عرض خريطة المهارات هنا</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Weekly Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-green-500" />
                    النشاط الأسبوعي
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-7 gap-2">
                    {['س', 'ح', 'ن', 'ث', 'ر', 'خ', 'ج'].map((day, i) => (
                      <div key={day} className="text-center">
                        <div className="text-xs text-gray-600 mb-2">{day}</div>
                        <div className={`h-16 rounded-lg ${
                          Math.random() > 0.3 ? 'bg-green-200 dark:bg-green-800' : 'bg-gray-200 dark:bg-gray-700'
                        }`} />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-orange-500" />
                    النشاط الأخير
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { action: 'اختبار الهندسة', score: '92%', time: 'منذ ساعتين', color: 'text-green-600' },
                      { action: 'تحدي التناظر اللفظي', score: '78%', time: 'أمس', color: 'text-blue-600' },
                      { action: 'اختبار سريع في الحساب', score: '88%', time: 'منذ يومين', color: 'text-green-700' }
                    ].map((activity, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div>
                          <div className="font-medium">{activity.action}</div>
                          <div className="text-sm text-gray-600">{activity.time}</div>
                        </div>
                        <div className={`font-bold ${activity.color}`}>
                          {activity.score}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}