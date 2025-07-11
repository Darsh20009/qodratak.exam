import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Trophy, 
  Clock, 
  ArrowLeft, 
  ArrowRight, 
  Play, 
  Pause, 
  Check, 
  AlertTriangle,
  Star,
  Target,
  Flame,
  Zap,
  Shield,
  Crown,
  Heart,
  Swords,
  RefreshCw,
  Brain,
  Sparkles,
  CheckCircle2,
  XCircle,
  Award,
  Medal,
  Eye,
  Lightbulb,
  BookOpen,
  Timer,
  BarChart3,
  TrendingUp,
  RotateCcw,
  Gamepad2,
  Crosshair,
  Sword,
  Shield as ShieldIcon,
  Wand2,
  Rocket,
  Bolt
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MistakeQuestion {
  id: number;
  category: string;
  text?: string;
  question?: string;
  options?: string[];
  choices?: string[];
  correctOptionIndex?: number;
  correct_answer?: string;
  explanation?: string;
  subcategory?: string;
  difficulty?: string;
  userAnswer?: string;
  index: number;
  challengeLevel?: 'easy' | 'medium' | 'hard' | 'expert';
  hintsUsed?: number;
  attempts?: number;
}

interface ChallengeMode {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  timeLimit?: number;
  features: string[];
  difficulty: 'مبتدئ' | 'متوسط' | 'متقدم' | 'خبير';
  specialEffects?: boolean;
}

interface PowerUp {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  uses: number;
  cost: number;
  effect: 'hint' | 'skip' | 'time' | 'reveal';
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  unlocked: boolean;
  progress: number;
  target: number;
}

export default function EnhancedMistakeChallenge() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Game State
  const [gameMode, setGameMode] = useState<'selection' | 'playing' | 'results'>('selection');
  const [selectedMode, setSelectedMode] = useState<ChallengeMode | null>(null);
  const [challengeData, setChallengeData] = useState<any>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{[key: number]: string}>({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  // Enhanced Features
  const [playerStats, setPlayerStats] = useState({
    health: 100,
    energy: 100,
    streak: 0,
    score: 0,
    level: 1,
    experience: 0,
    powerUps: [] as PowerUp[]
  });

  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [showHint, setShowHint] = useState(false);
  const [currentHint, setCurrentHint] = useState('');
  const [questionAttempts, setQuestionAttempts] = useState<{[key: number]: number}>({});
  const [showPowerUpMenu, setShowPowerUpMenu] = useState(false);

  // Challenge Modes
  const challengeModes: ChallengeMode[] = [
    {
      id: 'speed_demon',
      name: 'شيطان السرعة',
      description: 'تحدي السرعة - أجب على جميع الأسئلة في أقل وقت ممكن',
      icon: <Bolt className="w-6 h-6" />,
      color: 'from-yellow-500 to-orange-500',
      timeLimit: 300, // 5 minutes
      features: ['مؤقت سريع', 'نقاط مضاعفة للسرعة', 'مكافآت وقتية'],
      difficulty: 'متقدم',
      specialEffects: true
    },
    {
      id: 'survival_mode',
      name: 'وضع البقاء',
      description: 'لديك 3 أرواح فقط - كل خطأ يكلفك روحاً واحدة',
      icon: <Heart className="w-6 h-6" />,
      color: 'from-red-500 to-pink-500',
      features: ['3 أرواح', 'لا يمكن التراجع', 'مكافآت خاصة للبقاء'],
      difficulty: 'خبير',
      specialEffects: true
    },
    {
      id: 'zen_master',
      name: 'سيد الزن',
      description: 'تحدي هادئ بدون ضغط وقت مع تركيز على الفهم العميق',
      icon: <Brain className="w-6 h-6" />,
      color: 'from-blue-500 to-purple-500',
      features: ['بدون مؤقت', 'تلميحات متقدمة', 'شروحات مفصلة'],
      difficulty: 'مبتدئ',
      specialEffects: false
    },
    {
      id: 'warrior_mode',
      name: 'وضع المحارب',
      description: 'معركة ملحمية ضد أصعب الأسئلة مع قوى خاصة',
      icon: <Sword className="w-6 h-6" />,
      color: 'from-purple-500 to-indigo-500',
      timeLimit: 600, // 10 minutes
      features: ['قوى خاصة', 'أسئلة متدرجة الصعوبة', 'نظام مكافآت متقدم'],
      difficulty: 'خبير',
      specialEffects: true
    },
    {
      id: 'perfectionist',
      name: 'الكمالي',
      description: 'احصل على 100% أو ابدأ من جديد - لا مجال للخطأ',
      icon: <Crown className="w-6 h-6" />,
      color: 'from-amber-500 to-yellow-500',
      features: ['الكمال أو لا شيء', 'نقاط مضاعفة × 3', 'لقب الكمالي'],
      difficulty: 'خبير',
      specialEffects: true
    },
    {
      id: 'adventure_mode',
      name: 'وضع المغامرة',
      description: 'رحلة تفاعلية مع قصة وشخصيات ومستويات متنوعة',
      icon: <Rocket className="w-6 h-6" />,
      color: 'from-green-500 to-teal-500',
      features: ['قصة تفاعلية', 'شخصيات مساعدة', 'مستويات متنوعة'],
      difficulty: 'متوسط',
      specialEffects: true
    }
  ];

  // Power-ups
  const powerUps: PowerUp[] = [
    {
      id: 'hint_master',
      name: 'سيد التلميحات',
      description: 'احصل على تلميح ذكي للسؤال الحالي',
      icon: <Lightbulb className="w-5 h-5" />,
      color: 'text-yellow-500',
      uses: 3,
      cost: 10,
      effect: 'hint'
    },
    {
      id: 'time_freeze',
      name: 'تجميد الوقت',
      description: 'أوقف المؤقت لمدة 30 ثانية',
      icon: <Timer className="w-5 h-5" />,
      color: 'text-blue-500',
      uses: 2,
      cost: 15,
      effect: 'time'
    },
    {
      id: 'answer_reveal',
      name: 'كشف الإجابة',
      description: 'اكشف الإجابة الصحيحة مباشرة',
      icon: <Eye className="w-5 h-5" />,
      color: 'text-green-500',
      uses: 1,
      cost: 25,
      effect: 'reveal'
    },
    {
      id: 'question_skip',
      name: 'تخطي السؤال',
      description: 'تخطى السؤال الحالي واحصل على نقاط جزئية',
      icon: <ArrowRight className="w-5 h-5" />,
      color: 'text-purple-500',
      uses: 2,
      cost: 20,
      effect: 'skip'
    }
  ];

  // Initialize achievements
  useEffect(() => {
    const initialAchievements: Achievement[] = [
      {
        id: 'first_challenge',
        name: 'أول تحدي',
        description: 'أكمل أول تحدي أخطاء',
        icon: <Trophy className="w-5 h-5" />,
        color: 'text-yellow-500',
        unlocked: false,
        progress: 0,
        target: 1
      },
      {
        id: 'speed_master',
        name: 'سيد السرعة',
        description: 'أكمل تحدي في أقل من دقيقتين',
        icon: <Zap className="w-5 h-5" />,
        color: 'text-blue-500',
        unlocked: false,
        progress: 0,
        target: 1
      },
      {
        id: 'perfectionist',
        name: 'الكمالي',
        description: 'احصل على 100% في تحدي صعب',
        icon: <Star className="w-5 h-5" />,
        color: 'text-purple-500',
        unlocked: false,
        progress: 0,
        target: 1
      },
      {
        id: 'streak_master',
        name: 'سيد السلسلة',
        description: 'أجب على 10 أسئلة صحيحة متتالية',
        icon: <Flame className="w-5 h-5" />,
        color: 'text-orange-500',
        unlocked: false,
        progress: 0,
        target: 10
      }
    ];
    setAchievements(initialAchievements);

    // Load challenge data
    const storedChallenge = localStorage.getItem('mistakeChallenge');
    if (storedChallenge) {
      try {
        const data = JSON.parse(storedChallenge);
        setChallengeData(data);
      } catch (error) {
        console.error('خطأ في تحميل بيانات التحدي:', error);
        setLocation('/test-results');
      }
    } else {
      setLocation('/test-results');
    }
  }, [setLocation]);

  // Timer effect
  useEffect(() => {
    if (timeRemaining > 0 && !isPaused && !isCompleted && selectedMode?.timeLimit) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            finishChallenge();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [timeRemaining, isPaused, isCompleted, selectedMode]);

  const startChallenge = (mode: ChallengeMode) => {
    setSelectedMode(mode);
    setGameMode('playing');
    if (mode.timeLimit) {
      setTimeRemaining(mode.timeLimit);
    }

    // Initialize player stats based on mode
    setPlayerStats(prev => ({
      ...prev,
      health: mode.id === 'survival_mode' ? 3 : 100,
      energy: 100,
      powerUps: mode.id === 'warrior_mode' ? powerUps : []
    }));

    toast({
      title: `بدء ${mode.name}`,
      description: mode.description,
    });
  };

  const selectAnswer = (answerIndex: number) => {
    const currentQuestion = challengeData?.questions[currentQuestionIndex];
    if (!currentQuestion) return;

    const isCorrect = answerIndex === currentQuestion.correctOptionIndex;

    setSelectedAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: answerIndex.toString()
    }));

    // Update attempts
    setQuestionAttempts(prev => ({
      ...prev,
      [currentQuestion.id]: (prev[currentQuestion.id] || 0) + 1
    }));

    // Update stats based on answer
    if (isCorrect) {
      const basePoints = selectedMode?.id === 'perfectionist' ? 30 : 10;
      const speedBonus = selectedMode?.id === 'speed_demon' ? Math.max(5, Math.floor(timeRemaining / 10)) : 0;
      const streakBonus = Math.floor(playerStats.streak / 5) * 2;
      const totalPoints = basePoints + speedBonus + streakBonus;

      setPlayerStats(prev => ({
        ...prev,
        streak: prev.streak + 1,
        score: prev.score + totalPoints,
        experience: prev.experience + 15,
        energy: Math.min(100, prev.energy + 5)
      }));

      // Different success messages based on mode
      const successMessages = {
        speed_demon: `برق! ⚡ +${totalPoints} نقطة (مكافأة السرعة: +${speedBonus})`,
        survival_mode: `نجوت! 💪 +${totalPoints} نقطة`,
        zen_master: `تأمل رائع! 🧘 +${totalPoints} نقطة`,
        warrior_mode: `ضربة قاتلة! ⚔️ +${totalPoints} نقطة`,
        perfectionist: `كمال مطلق! 👑 +${totalPoints} نقطة`,
        adventure_mode: `مغامرة ناجحة! 🚀 +${totalPoints} نقطة`
      };

      toast({
        title: "إجابة صحيحة!",
        description: successMessages[selectedMode?.id as keyof typeof successMessages] || `+${totalPoints} نقطة`,
      });

      // Special streak effects
      if (playerStats.streak > 0 && (playerStats.streak + 1) % 5 === 0) {
        toast({
          title: `سلسلة رائعة! 🔥`,
          description: `${playerStats.streak + 1} إجابات صحيحة متتالية!`,
        });
      }
    } else {
      const healthLoss = selectedMode?.id === 'survival_mode' ? 1 : 
                        selectedMode?.id === 'perfectionist' ? 100 : 10;

      setPlayerStats(prev => ({
        ...prev,
        streak: 0,
        health: selectedMode?.id === 'survival_mode' ? prev.health - 1 : prev.health - healthLoss,
        energy: Math.max(0, prev.energy - 10)
      }));

      // Check game over for survival mode
      if (selectedMode?.id === 'survival_mode' && playerStats.health <= 1) {
        toast({
          title: "انتهت الأرواح! 💀",
          description: "لقد خسرت في وضع البقاء - حاول مرة أخرى!",
          variant: "destructive"
        });
        finishChallenge();
        return;
      }

      // Check game over for perfectionist mode
      if (selectedMode?.id === 'perfectionist') {
        toast({
          title: "خطأ في وضع الكمالي! 😞",
          description: "يجب البدء من جديد للحصول على الكمال المطلق",
          variant: "destructive"
        });
        setTimeout(() => {
          setCurrentQuestionIndex(0);
          setSelectedAnswers({});
          setPlayerStats(prev => ({ ...prev, health: 100, score: 0, streak: 0 }));
        }, 2000);
        return;
      }

      const errorMessages = {
        speed_demon: "بطء في الإجابة! ⏰",
        survival_mode: `فقدت روحاً! ❤️ (${playerStats.health - 1} متبقية)`,
        zen_master: "لا بأس، تعلم من الخطأ 📚",
        warrior_mode: "الأعداء يهاجمون! ⚔️",
        perfectionist: "الكمال يتطلب دقة مطلقة! 👑",
        adventure_mode: "عقبة في المغامرة! 🗻"
      };

      toast({
        title: "إجابة خاطئة",
        description: errorMessages[selectedMode?.id as keyof typeof errorMessages] || "حاول مرة أخرى!",
        variant: "destructive"
      });
    }

    // Auto advance after delay (except in zen mode where user controls pace)
    if (selectedMode?.id !== 'zen_master') {
      setTimeout(() => {
        nextQuestion();
      }, 1500);
    }
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < challengeData.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      finishChallenge();
    }
  };

  const previousQuestion = () => {
    if (currentQuestionIndex > 0 && selectedMode?.id !== 'survival_mode') {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const finishChallenge = () => {
    setIsCompleted(true);
    setGameMode('results');

    // Safety checks for challengeData
    if (!challengeData || !challengeData.questions || challengeData.questions.length === 0) {
      console.error('Challenge data is missing or invalid');
      return;
    }

    // Calculate final results
    const correctAnswers = challengeData.questions.filter((q: any) => {
      const userAnswer = selectedAnswers[q.id];
      const correctAnswer = q.correctOptionIndex?.toString() || q.correct_answer?.toString();
      return userAnswer === correctAnswer;
    }).length;

    const totalQuestions = challengeData.questions.length;
    const percentage = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

    // Update achievements safely
    const updatedAchievements = achievements.map(achievement => {
      if (achievement.id === 'first_challenge' && !achievement.unlocked) {
        return { ...achievement, unlocked: true, progress: 1 };
      }
      if (achievement.id === 'perfectionist' && percentage === 100) {
        return { ...achievement, unlocked: true, progress: 1 };
      }
      if (achievement.id === 'streak_master' && playerStats.streak >= 10) {
        return { ...achievement, unlocked: true, progress: playerStats.streak };
      }
      return achievement;
    });

    setAchievements(updatedAchievements);

    // Save results
    const challengeResult = {
      mode: selectedMode?.name || 'غير محدد',
      score: playerStats.score || 0,
      percentage,
      questionsAnswered: Object.keys(selectedAnswers).length,
      totalQuestions,
      timeSpent: selectedMode?.timeLimit ? selectedMode.timeLimit - timeRemaining : 0,
      achievements: updatedAchievements.filter(a => a.unlocked).length,
      completedAt: new Date().toISOString()
    };

    localStorage.setItem('lastChallengeResult', JSON.stringify(challengeResult));
  };

  const usePowerUp = (powerUp: PowerUp) => {
    const currentQuestion = challengeData?.questions[currentQuestionIndex];
    if (!currentQuestion) return;

    switch (powerUp.effect) {
      case 'hint':
        setCurrentHint(currentQuestion.explanation || 'لا يوجد تلميح متاح لهذا السؤال');
        setShowHint(true);
        break;
      case 'time':
        setTimeRemaining(prev => prev + 30);
        break;
      case 'reveal':
        selectAnswer(currentQuestion.correctOptionIndex);
        break;
      case 'skip':
        setPlayerStats(prev => ({ ...prev, score: prev.score + 5 }));
        nextQuestion();
        break;
    }

    // Consume power-up
    setPlayerStats(prev => ({
      ...prev,
      powerUps: prev.powerUps.map(p => 
        p.id === powerUp.id ? { ...p, uses: p.uses - 1 } : p
      ).filter(p => p.uses > 0)
    }));

    setShowPowerUpMenu(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Mode Selection Screen
  if (gameMode === 'selection') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 p-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="p-3 bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 rounded-full">
                <Swords className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
                تحدي الأخطاء المتقدم
              </h1>
            </div>
            <p className="text-xl text-gray-300 mb-6">
              اختر وضع التحدي المناسب لك واختبر مهاراتك
            </p>
          </motion.div>

          {/* Challenge Modes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {challengeModes.map((mode, index) => (
              <motion.div
                key={mode.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5, scale: 1.02 }}
                className="cursor-pointer"
                onClick={() => startChallenge(mode)}
              >
                <Card className={`h-full bg-gradient-to-br ${mode.color} text-white border-none shadow-xl hover:shadow-2xl transition-all duration-300 relative overflow-hidden`}>

                  {/* Background Effects */}
                  {mode.specialEffects && (
                    <div className="absolute inset-0 opacity-20">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -translate-y-16 translate-x-16" />
                      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full translate-y-12 -translate-x-12" />
                    </div>
                  )}

                  <CardHeader className="relative">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                        {mode.icon}
                      </div>
                      <Badge className="bg-white/20 text-white border-white/30">
                        {mode.difficulty}
                      </Badge>
                    </div>
                    <CardTitle className="text-xl font-bold mb-2">{mode.name}</CardTitle>
                    <p className="text-white/90 text-sm mb-4">{mode.description}</p>
                  </CardHeader>

                  <CardContent className="relative">
                    {/* Time Limit */}
                    {mode.timeLimit && (
                      <div className="flex items-center gap-2 mb-4 text-white/80">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm">{formatTime(mode.timeLimit)}</span>
                      </div>
                    )}

                    {/* Features */}
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm text-white/90">الميزات:</h4>
                      <ul className="text-xs space-y-1">
                        {mode.features.map((feature, idx) => (
                          <li key={idx} className="flex items-center gap-2 text-white/80">
                            <CheckCircle2 className="w-3 h-3" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Action Button */}
                    <Button
                      className="w-full mt-4 bg-white/20 hover:bg-white/30 text-white border-white/30"
                      onClick={(e) => {
                        e.stopPropagation();
                        startChallenge(mode);
                      }}
                    >
                      ابدأ التحدي
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Back Button */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-center"
          >
            <Button
              onClick={() => setLocation('/test-results')}
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10"
            >
              <ArrowRight className="w-4 h-4 mr-2" />
              العودة للنتائج
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  // Game Playing Screen
  if (gameMode === 'playing' && challengeData && selectedMode) {
    const currentQuestion = challengeData.questions?.[currentQuestionIndex];
    if (!currentQuestion) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 p-4 flex items-center justify-center">
          <div className="text-center text-white">
            <p className="text-xl mb-4">خطأ في تحميل السؤال</p>
            <Button onClick={() => setLocation('/test-results')} variant="outline">
              العودة للنتائج
            </Button>
          </div>
        </div>
      );
    }
    const progress = challengeData.questions?.length > 0 ? ((currentQuestionIndex + 1) / challengeData.questions.length) * 100 : 0;

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 p-4">
        <div className="max-w-4xl mx-auto">

          {/* Game HUD */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  {/* Player Stats */}
                  <div className="flex items-center gap-4">
                    <motion.div 
                      className="flex items-center gap-2"
                      animate={{ 
                        scale: selectedMode?.id === 'survival_mode' && playerStats.health <= 1 ? [1, 1.2, 1] : 1,
                        color: playerStats.health <= 30 ? '#ef4444' : '#f87171'
                      }}
                      transition={{ duration: 0.5 }}
                    >
                      <Heart className="w-5 h-5 text-red-400" />
                      <span className="font-bold">
                        {selectedMode?.id === 'survival_mode' ? playerStats.health : `${playerStats.health}%`}
                      </span>
                    </motion.div>

                    <motion.div 
                      className="flex items-center gap-2"
                      animate={{ 
                        scale: playerStats.streak > 0 && playerStats.streak % 5 === 0 ? [1, 1.3, 1] : 1
                      }}
                      transition={{ duration: 0.6 }}
                    >
                      <Flame className="w-5 h-5 text-orange-400" />
                      <span className="font-bold">{playerStats.streak}</span>
                      {playerStats.streak >= 10 && (
                        <motion.div
                          animate={{ rotate: [0, 360] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="text-yellow-400"
                        >
                          🔥
                        </motion.div>
                      )}
                    </motion.div>

                    <motion.div 
                      className="flex items-center gap-2"
                      animate={{ 
                        scale: playerStats.score > 0 ? [1, 1.1, 1] : 1
                      }}
                      transition={{ duration: 0.3 }}
                    >
                      <Star className="w-5 h-5 text-yellow-400" />
                      <span className="font-bold">{playerStats.score}</span>
                    </motion.div>

                    {/* Energy Bar for Warrior Mode */}
                    {selectedMode?.id === 'warrior_mode' && (
                      <div className="flex items-center gap-2">
                        <Bolt className="w-5 h-5 text-blue-400" />
                        <div className="w-16 h-2 bg-white/20 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-gradient-to-r from-blue-400 to-cyan-400"
                            initial={{ width: "100%" }}
                            animate={{ width: `${playerStats.energy}%` }}
                            transition={{ duration: 0.5 }}
                          />
                        </div>
                        <span className="text-xs font-bold">{playerStats.energy}</span>
                      </div>
                    )}
                  </div>

                  {/* Timer and Controls */}
                  <div className="flex items-center gap-4">
                    {selectedMode.timeLimit && (
                      <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5" />
                        <span className="font-mono text-lg">{formatTime(timeRemaining)}</span>
                      </div>
                    )}
                    <Button
                      onClick={() => setIsPaused(!isPaused)}
                      variant="outline"
                      size="sm"
                      className="border-white/30 text-white hover:bg-white/10"
                    >
                      {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                {/* Progress */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span>السؤال {currentQuestionIndex + 1} من {challengeData.questions.length}</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>

                {/* Power-ups */}
                {selectedMode.id === 'warrior_mode' && playerStats.powerUps.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Wand2 className="w-4 h-4 text-purple-400" />
                    <span className="text-sm mr-2">القوى الخاصة:</span>
                    {playerStats.powerUps.map((powerUp) => (
                      <Button
                        key={powerUp.id}
                        onClick={() => usePowerUp(powerUp)}
                        size="sm"
                        className="bg-purple-500/20 hover:bg-purple-500/30 text-white border-purple-400/30"
                      >
                        {powerUp.icon}
                        <span className="ml-1">{powerUp.uses}</span>
                      </Button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Question Card */}
          <motion.div
            key={currentQuestionIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-6"
          >
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Badge className="bg-orange-500/20 text-orange-300 border-orange-400/30">
                    {currentQuestion.subcategory || currentQuestion.category}
                  </Badge>
                  <div className="flex items-center gap-2">
                    {questionAttempts[currentQuestion.id] > 1 && (
                      <Badge className="bg-red-500/20 text-red-300 border-red-400/30">
                        المحاولة {questionAttempts[currentQuestion.id]}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-semibold mb-6 leading-relaxed">
                  {currentQuestion.text || currentQuestion.question}
                </div>

                <div className="space-y-3">
                  {(currentQuestion.options || currentQuestion.choices || []).map((option: string, index: number) => (
                    <motion.button
                      key={index}
                      onClick={() => selectAnswer(index)}
                      disabled={isPaused}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`w-full p-4 text-right rounded-lg border-2 transition-all duration-200 ${
                        selectedAnswers[currentQuestion.id] === index.toString()
                          ? 'border-blue-400 bg-blue-500/20 text-blue-300'
                          : 'border-white/20 hover:border-white/40 bg-white/5 hover:bg-white/10'
                      } ${isPaused ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="flex-1">{option}</span>
                        {selectedAnswers[currentQuestion.id] === index.toString() && (
                          <CheckCircle2 className="w-5 h-5 text-blue-400" />
                        )}
                      </div>
                    </motion.button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Hint Panel */}
          <AnimatePresence>
            {showHint && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6"
              >
                <Card className="bg-yellow-500/10 backdrop-blur-sm border-yellow-400/30 text-yellow-100">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Lightbulb className="w-6 h-6 text-yellow-400 mt-1" />
                      <div className="flex-1">
                        <h4 className="font-semibold mb-2">تلميح ذكي:</h4>
                        <p className="text-sm">{currentHint}</p>
                      </div>
                      <Button
                        onClick={() => setShowHint(false)}
                        size="sm"
                        variant="ghost"
                        className="text-yellow-300 hover:text-yellow-100"
                      >
                        <XCircle className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between"
          >
            <Button
              onClick={previousQuestion}
              disabled={currentQuestionIndex === 0 || selectedMode.id === 'survival_mode' || isPaused}
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10"
            >
              <ArrowRight className="w-4 h-4 mr-2" />
              السابق
            </Button>

            <div className="text-center">
              <div className="text-sm text-gray-300 mb-1">تقدم التحدي</div>
              <div className="text-lg font-bold text-white">{Math.round(progress)}%</div>
            </div>

            <Button
              onClick={nextQuestion}
              disabled={isPaused}
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
            >
              {currentQuestionIndex === challengeData.questions.length - 1 ? 'إنهاء التحدي' : 'التالي'}
              <ArrowLeft className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  // Results Screen
  if (gameMode === 'results') {
    // Safety checks for results calculation
    const questions = challengeData?.questions || [];
    const correctAnswers = questions.filter((q: any) => {
      const userAnswer = selectedAnswers[q.id];
      const correctAnswer = q.correctOptionIndex?.toString() || q.correct_answer?.toString();
      return userAnswer === correctAnswer;
    }).length;
    
    const totalQuestions = questions.length;
    const percentage = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
    const unlockedAchievements = achievements.filter(a => a.unlocked);

    // Determine victory level
    const getVictoryLevel = () => {
      if (percentage === 100) return {
        title: 'إنجاز أسطوري! 🏆',
        subtitle: 'لقد حققت الكمال المطلق',
        color: 'from-yellow-400 via-amber-400 to-orange-500',
        icon: <Crown className="w-16 h-16 text-white" />,
        particles: true
      };
      if (percentage >= 90) return {
        title: 'أداء متميز! ⭐',
        subtitle: 'مهارات استثنائية في التعلم',
        color: 'from-blue-400 via-purple-400 to-indigo-500',
        icon: <Star className="w-16 h-16 text-white" />,
        particles: true
      };
      if (percentage >= 80) return {
        title: 'تحدي ناجح! 🎯',
        subtitle: 'تقدم ممتاز في المهارات',
        color: 'from-green-400 via-emerald-400 to-teal-500',
        icon: <Target className="w-16 h-16 text-white" />,
        particles: false
      };
      if (percentage >= 70) return {
        title: 'أداء جيد! 💪',
        subtitle: 'مستوى مرضي مع إمكانية التطوير',
        color: 'from-orange-400 via-yellow-400 to-amber-500',
        icon: <Trophy className="w-16 h-16 text-white" />,
        particles: false
      };
      return {
        title: 'تحدي مكتمل! 📚',
        subtitle: 'كل تجربة خطوة نحو التميز',
        color: 'from-purple-400 via-pink-400 to-rose-500',
        icon: <BookOpen className="w-16 h-16 text-white" />,
        particles: false
      };
    };

    const victoryData = getVictoryLevel();

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 p-4 relative overflow-hidden">

        {/* Animated Background Particles */}
        {victoryData.particles && (
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-yellow-400 rounded-full"
                initial={{ 
                  x: Math.random() * window.innerWidth, 
                  y: window.innerHeight + 10,
                  opacity: 0 
                }}
                animate={{ 
                  y: -10, 
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0]
                }}
                transition={{ 
                  duration: 3, 
                  delay: i * 0.2,
                  repeat: Infinity,
                  repeatDelay: 2
                }}
              />
            ))}
          </div>
        )}

        <div className="max-w-4xl mx-auto relative z-10">

          {/* Victory Header */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-8"
          >
            <motion.div 
              className={`p-6 bg-gradient-to-r ${victoryData.color} rounded-full w-32 h-32 mx-auto mb-6 flex items-center justify-center shadow-2xl`}
              animate={{ 
                rotate: victoryData.particles ? [0, 10, -10, 0] : 0,
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                duration: 2, 
                repeat: victoryData.particles ? Infinity : 0
              }}
            >
              {victoryData.icon}
            </motion.div>

            <motion.h1 
              className="text-4xl font-bold text-white mb-2"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {victoryData.title}
            </motion.h1>
            <p className="text-xl text-gray-300 mb-4">
              {victoryData.subtitle}
            </p>
            <p className="text-lg text-gray-400">
              وضع: {selectedMode?.name}
            </p>
          </motion.div>

          {/* Results Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Card className="bg-green-500/10 backdrop-blur-sm border-green-400/30 text-green-100 text-center">
                <CardContent className="p-6">
                  <div className="text-4xl font-bold text-green-400 mb-2">{percentage}%</div>
                  <div className="text-sm">النسبة المئوية</div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <Card className="bg-blue-500/10 backdrop-blur-sm border-blue-400/30 text-blue-100 text-center">
                <CardContent className="p-6">
                  <div className="text-4xl font-bold text-blue-400 mb-2">{correctAnswers}/{totalQuestions}</div>
                  <div className="text-sm">الإجابات الصحيحة</div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
              <Card className="bg-purple-500/10 backdrop-blur-sm border-purple-400/30 text-purple-100 text-center">
                <CardContent className="p-6">
                  <div className="text-4xl font-bold text-purple-400 mb-2">{playerStats.score}</div>
                  <div className="text-sm">النقاط المكتسبة</div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Achievements */}
          {unlockedAchievements.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mb-8"
            >
              <Card className="bg-yellow-500/10 backdrop-blur-sm border-yellow-400/30 text-yellow-100">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="w-6 h-6 text-yellow-400" />
                    الإنجازات المكتسبة
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {unlockedAchievements.map((achievement) => (
                      <div key={achievement.id} className="flex items-center gap-3 p-3 bg-yellow-500/20 rounded-lg">
                        <div className="text-yellow-400">{achievement.icon}</div>
                        <div>
                          <div className="font-semibold">{achievement.name}</div>
                          <div className="text-sm text-yellow-200">{achievement.description}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="flex flex-wrap justify-center gap-4"
          >
            <Button
              onClick={() => setGameMode('selection')}
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              تحدي جديد
            </Button>

            <Button
              onClick={() => setLocation('/test-results')}
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10"
            >
              <ArrowRight className="w-4 h-4 mr-2" />
              العودة للنتائج
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  return null;
}