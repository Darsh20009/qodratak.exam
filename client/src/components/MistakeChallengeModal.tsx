import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  Timer, 
  Zap, 
  Brain, 
  Target, 
  Flame, 
  Star,
  Trophy,
  CheckCircle,
  XCircle,
  ArrowRight,
  RotateCcw,
  Download,
  Sparkles,
  Clock,
  Award,
  TrendingUp,
  Eye,
  BarChart,
  Palette,
  Gamepad2,
  Rocket,
  Shield,
  Heart,
  Sword,
  Crown,
  Gem,
  Moon,
  Sun,
  Feather,
  Music,
  Headphones,
  Volume2,
  VolumeX,
  Repeat,
  FastForward
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

// Creative Challenge Modes with Ultimate Creativity
const ULTRA_CREATIVE_MODES = [
  {
    id: 'speed-storm',
    name: 'عاصفة السرعة ⚡',
    icon: Zap,
    description: 'تحدي زمني سريع - 30 ثانية لكل سؤال مع تأثيرات بصرية',
    features: ['⚡ تحدي السرعة', '🔥 تأثيرات نارية', '⏰ مؤقت ديناميكي', '🎵 موسيقى محفزة'],
    gradient: 'from-red-500 via-orange-500 to-yellow-500',
    bgPattern: 'bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 dark:from-red-900/20 dark:via-orange-900/20 dark:to-yellow-900/20',
    timeLimit: 30,
    color: 'text-red-600',
    difficulty: 'extreme'
  },
  {
    id: 'memory-palace',
    name: 'قصر الذاكرة 🧠',
    icon: Brain,
    description: 'تحدي الذاكرة - احفظ السؤال ثم أجب بدون رؤيته',
    features: ['🧠 تحدي الذاكرة', '✨ تأثيرات سحرية', '🏰 تصميم القصر', '🎭 وضع التركيز'],
    gradient: 'from-purple-500 via-blue-500 to-indigo-500',
    bgPattern: 'bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-purple-900/20 dark:via-blue-900/20 dark:to-indigo-900/20',
    timeLimit: 0,
    color: 'text-purple-600',
    difficulty: 'genius'
  },
  {
    id: 'survival-mode',
    name: 'وضع البقاء ⚔️',
    icon: Shield,
    description: 'ثلاث محاولات فقط - خطأ واحد يعني البداية من جديد',
    features: ['⚔️ تحدي البقاء', '❤️ ثلاث أرواح', '🛡️ درع الحماية', '👑 تاج النصر'],
    gradient: 'from-green-500 via-teal-500 to-cyan-500',
    bgPattern: 'bg-gradient-to-br from-green-50 via-teal-50 to-cyan-50 dark:from-green-900/20 dark:via-teal-900/20 dark:to-cyan-900/20',
    timeLimit: 0,
    color: 'text-green-600',
    difficulty: 'hardcore'
  },
  {
    id: 'zen-master',
    name: 'سيد الزِن 🕯️',
    icon: Feather,
    description: 'وضع هادئ مع موسيقى استرخاء وتأملات إيجابية',
    features: ['🕯️ وضع الزِن', '🎵 موسيقى هادئة', '🌸 تأثيرات مهدئة', '💫 تأملات إيجابية'],
    gradient: 'from-pink-300 via-purple-300 to-indigo-300',
    bgPattern: 'bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 dark:from-pink-900/10 dark:via-purple-900/10 dark:to-indigo-900/10',
    timeLimit: 0,
    color: 'text-pink-600',
    difficulty: 'peaceful'
  },
  {
    id: 'lightning-round',
    name: 'جولة البرق ⚡',
    icon: Rocket,
    description: 'كلما أجبت بسرعة أكبر، كلما زادت النقاط والتأثيرات',
    features: ['⚡ سرعة البرق', '🚀 صاروخ النقاط', '💎 جواهر المكافآت', '🌟 تأثيرات كونية'],
    gradient: 'from-yellow-400 via-orange-400 to-red-400',
    bgPattern: 'bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 dark:from-yellow-900/20 dark:via-orange-900/20 dark:to-red-900/20',
    timeLimit: 15,
    color: 'text-yellow-600',
    difficulty: 'lightning'
  },
  {
    id: 'dark-night',
    name: 'فارس الليل 🌙',
    icon: Moon,
    description: 'وضع ليلي فائق مع تأثيرات نجوم وقمر وموسيقى غامضة',
    features: ['🌙 فارس الليل', '⭐ تأثيرات النجوم', '🔮 سحر الليل', '🎼 سمفونية الظلام'],
    gradient: 'from-slate-600 via-blue-800 to-purple-900',
    bgPattern: 'bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900',
    timeLimit: 0,
    color: 'text-blue-400',
    difficulty: 'mystical'
  }
];

// Sound effects for ultimate immersion
const SOUND_EFFECTS = {
  correct: '🎵 صوت النجاح',
  wrong: '💥 صوت الخطأ',
  tick: '⏰ دقات الساعة',
  victory: '🏆 نشيد النصر',
  start: '🎯 بداية التحدي'
};

interface CreativeQuestion {
  id: number;
  text: string;
  options: string[];
  correctOptionIndex: number;
  userAnswerIndex?: number;
  sectionName: string;
  wasUnanswered: boolean;
  subcategory?: string;
}

interface MistakeChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  questions: CreativeQuestion[];
  onStartChallenge: (config: any) => void;
  isMobile?: boolean;
}

export function MistakeChallengeModal({ 
  isOpen, 
  onClose, 
  questions, 
  onStartChallenge, 
  isMobile = false 
}: MistakeChallengeModalProps) {
  const [selectedMode, setSelectedMode] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<'selection' | 'preview' | 'active'>('selection');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [lives, setLives] = useState(3);
  const [showQuestion, setShowQuestion] = useState(true);
  const [particles, setParticles] = useState<Array<{id: number, x: number, y: number}>>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [challengeCompleted, setChallengeCompleted] = useState(false);
  const [finalStats, setFinalStats] = useState<any>(null);

  const selectedModeConfig = ULTRA_CREATIVE_MODES.find(mode => mode.id === selectedMode);
  const currentQuestion = questions[currentQuestionIndex];

  // Ultimate creative timer with visual effects
  useEffect(() => {
    if (currentStep === 'active' && selectedModeConfig?.timeLimit && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleTimeUp();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentStep, timeRemaining, selectedModeConfig]);

  // Particle effects for maximum creativity
  const createParticleEffect = (type: 'success' | 'error' | 'streak') => {
    const newParticles = Array.from({length: 15}, (_, i) => ({
      id: Date.now() + i,
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight
    }));
    setParticles(newParticles);
    setTimeout(() => setParticles([]), 2000);
  };

  const handleTimeUp = () => {
    if (selectedMode === 'survival-mode') {
      setLives(prev => prev - 1);
      if (lives <= 1) {
        endChallenge();
        return;
      }
    }
    moveToNextQuestion();
  };

  const handleAnswerSelect = (answerIndex: number) => {
    const isCorrect = answerIndex === currentQuestion.correctOptionIndex;
    
    setUserAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: answerIndex
    }));

    if (isCorrect) {
      setScore(prev => prev + (selectedMode === 'lightning-round' ? Math.max(100 - (30 - timeRemaining) * 3, 10) : 100));
      setStreak(prev => prev + 1);
      createParticleEffect('success');
      if (soundEnabled) playSound('correct');
    } else {
      setStreak(0);
      createParticleEffect('error');
      if (soundEnabled) playSound('wrong');
      
      if (selectedMode === 'survival-mode') {
        setLives(prev => prev - 1);
        if (lives <= 1) {
          endChallenge();
          return;
        }
      }
    }

    setTimeout(() => moveToNextQuestion(), 1500);
  };

  const moveToNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      if (selectedModeConfig?.timeLimit) {
        setTimeRemaining(selectedModeConfig.timeLimit);
      }
      
      // Memory palace mode - hide question after showing it
      if (selectedMode === 'memory-palace') {
        setShowQuestion(true);
        setTimeout(() => setShowQuestion(false), 5000);
      }
    } else {
      endChallenge();
    }
  };

  const endChallenge = () => {
    setChallengeCompleted(true);
    const correctAnswers = Object.entries(userAnswers).filter(([questionId, answerIndex]) => {
      const question = questions.find(q => q.id === parseInt(questionId));
      return question && answerIndex === question.correctOptionIndex;
    }).length;

    setFinalStats({
      score,
      correctAnswers,
      totalQuestions: questions.length,
      streak: streak,
      mode: selectedModeConfig,
      timeSpent: questions.length * (selectedModeConfig?.timeLimit || 0)
    });

    if (soundEnabled) playSound('victory');
    createParticleEffect('streak');
  };

  const playSound = (type: keyof typeof SOUND_EFFECTS) => {
    if (soundEnabled) {
      // Play sound effect (browser beep for now)
      const context = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(context.destination);
      
      oscillator.frequency.setValueAtTime(type === 'correct' ? 800 : type === 'wrong' ? 200 : 400, context.currentTime);
      gainNode.gain.setValueAtTime(0.1, context.currentTime);
      
      oscillator.start();
      oscillator.stop(context.currentTime + 0.2);
    }
  };

  const startSelectedMode = () => {
    if (!selectedModeConfig) return;
    
    setCurrentStep('active');
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setScore(0);
    setStreak(0);
    setLives(3);
    setShowQuestion(true);
    setChallengeCompleted(false);
    
    if (selectedModeConfig.timeLimit) {
      setTimeRemaining(selectedModeConfig.timeLimit);
    }
    
    if (soundEnabled) playSound('start');
  };

  const resetChallenge = () => {
    setCurrentStep('selection');
    setSelectedMode(null);
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setScore(0);
    setStreak(0);
    setLives(3);
    setChallengeCompleted(false);
    setParticles([]);
  };

  if (currentStep === 'selection') {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto font-arabic bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-blue-900 dark:to-purple-900 border-2 border-gradient-to-r from-blue-500 to-purple-500">
          <DialogHeader className="text-center pb-6">
            <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent flex items-center justify-center gap-3">
              <Sparkles className="h-8 w-8 text-purple-500 animate-spin" />
              تحدي الأسئلة الخاطئة - الإصدار الإبداعي المطلق
              <Crown className="h-8 w-8 text-yellow-500 animate-bounce" />
            </DialogTitle>
            <DialogDescription className="text-lg text-gray-600 dark:text-gray-300 mt-2">
              اختر وضع التحدي المفضل لديك واستمتع بتجربة تعليمية فريدة ومليئة بالإبداع
            </DialogDescription>
            <div className="flex items-center justify-center gap-4 mt-4">
              <Badge variant="secondary" className="text-sm px-4 py-2">
                <Target className="h-4 w-4 mr-2" />
                {questions.length} سؤال خاطئ للمراجعة
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="flex items-center gap-2"
              >
                {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                {soundEnabled ? 'إيقاف الأصوات' : 'تشغيل الأصوات'}
              </Button>
            </div>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 p-6">
            {ULTRA_CREATIVE_MODES.map((mode) => (
              <Card 
                key={mode.id}
                className={cn(
                  "relative overflow-hidden cursor-pointer transition-all duration-500 hover:scale-105 hover:shadow-2xl group",
                  mode.bgPattern,
                  selectedMode === mode.id && "ring-4 ring-purple-500 ring-opacity-75 scale-105 shadow-2xl"
                )}
                onClick={() => setSelectedMode(mode.id)}
              >
                <div className={cn("absolute inset-0 bg-gradient-to-br opacity-10", mode.gradient)} />
                
                <CardHeader className="relative z-10 text-center pb-4">
                  <div className="flex items-center justify-center mb-4">
                    <div className={cn(
                      "p-4 rounded-full bg-gradient-to-br shadow-lg transform transition-transform group-hover:rotate-12",
                      mode.gradient
                    )}>
                      <mode.icon className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  
                  <CardTitle className={cn("text-xl font-bold mb-2", mode.color)}>
                    {mode.name}
                  </CardTitle>
                  
                  <Badge 
                    variant="outline" 
                    className={cn("mb-3 border-2 font-semibold", mode.color, `border-current`)}
                  >
                    مستوى: {mode.difficulty === 'extreme' ? 'متطرف' : 
                             mode.difficulty === 'genius' ? 'عبقري' :
                             mode.difficulty === 'hardcore' ? 'صعب جداً' :
                             mode.difficulty === 'peaceful' ? 'هادئ' :
                             mode.difficulty === 'lightning' ? 'برق' : 'غامض'}
                  </Badge>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                    {mode.description}
                  </p>
                </CardHeader>

                <CardContent className="relative z-10 pt-0">
                  <div className="space-y-2">
                    {mode.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <div className={cn("w-2 h-2 rounded-full bg-gradient-to-r", mode.gradient)} />
                        <span className="text-gray-700 dark:text-gray-200">{feature}</span>
                      </div>
                    ))}
                  </div>
                  
                  {mode.timeLimit > 0 && (
                    <div className="mt-4 flex items-center justify-center gap-2 text-sm font-medium">
                      <Timer className="h-4 w-4" />
                      <span>{mode.timeLimit} ثانية لكل سؤال</span>
                    </div>
                  )}

                  {selectedMode === mode.id && (
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        startSelectedMode();
                      }}
                      className={cn(
                        "w-full mt-4 bg-gradient-to-r text-white font-bold py-3 rounded-lg shadow-lg transform transition-all hover:scale-105",
                        mode.gradient
                      )}
                    >
                      <Rocket className="h-5 w-5 mr-2" />
                      ابدأ التحدي الآن!
                    </Button>
                  )}
                </CardContent>

                {selectedMode === mode.id && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
                )}
              </Card>
            ))}
          </div>

          <div className="flex justify-center gap-4 p-6 border-t border-gray-200 dark:border-gray-700">
            <Button variant="outline" onClick={onClose} className="px-8">
              إلغاء
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (currentStep === 'active' && !challengeCompleted) {
    return (
      <Dialog open={isOpen} onOpenChange={() => {}}>
        <DialogContent className={cn(
          "max-w-4xl max-h-[95vh] overflow-hidden font-arabic relative",
          selectedModeConfig?.bgPattern || "bg-white dark:bg-slate-900"
        )}>
          {/* Particle Effects */}
          {particles.map(particle => (
            <div
              key={particle.id}
              className="absolute w-4 h-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-ping pointer-events-none z-50"
              style={{
                left: particle.x % 100 + '%',
                top: particle.y % 100 + '%',
                animationDuration: '1s'
              }}
            />
          ))}

          {/* Mode-specific background effects */}
          {selectedMode === 'dark-night' && (
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 opacity-95" />
          )}

          <div className="relative z-10">
            {/* Header with stats */}
            <div className="flex items-center justify-between mb-6 p-4 bg-white/90 dark:bg-slate-800/90 rounded-lg backdrop-blur">
              <div className="flex items-center gap-4">
                <selectedModeConfig.icon className={cn("h-8 w-8", selectedModeConfig.color)} />
                <div>
                  <h3 className="font-bold text-lg">{selectedModeConfig.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    سؤال {currentQuestionIndex + 1} من {questions.length}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                {selectedMode === 'survival-mode' && (
                  <div className="flex items-center gap-1">
                    {Array.from({length: 3}).map((_, i) => (
                      <Heart 
                        key={i} 
                        className={cn(
                          "h-6 w-6",
                          i < lives ? "text-red-500 fill-current" : "text-gray-300"
                        )} 
                      />
                    ))}
                  </div>
                )}

                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{score}</div>
                  <div className="text-xs text-gray-500">النقاط</div>
                </div>

                {streak > 0 && (
                  <div className="text-center">
                    <div className="text-xl font-bold text-orange-500 flex items-center gap-1">
                      <Flame className="h-5 w-5" />
                      {streak}
                    </div>
                    <div className="text-xs text-gray-500">سلسلة</div>
                  </div>
                )}

                {selectedModeConfig.timeLimit > 0 && (
                  <div className="text-center">
                    <div className={cn(
                      "text-2xl font-bold",
                      timeRemaining <= 5 ? "text-red-500 animate-pulse" : "text-blue-600"
                    )}>
                      {timeRemaining}
                    </div>
                    <div className="text-xs text-gray-500">ثانية</div>
                  </div>
                )}
              </div>
            </div>

            {/* Progress bar */}
            <div className="mb-6">
              <Progress 
                value={(currentQuestionIndex / questions.length) * 100} 
                className="h-3 bg-gray-200 dark:bg-gray-700"
              />
            </div>

            {/* Question display */}
            {currentQuestion && (
              <Card className="mb-6 bg-white/95 dark:bg-slate-800/95 backdrop-blur border-2 border-purple-200 dark:border-purple-700">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="mb-2">
                      {currentQuestion.sectionName}
                    </Badge>
                    {currentQuestion.subcategory && (
                      <Badge variant="outline">
                        {currentQuestion.subcategory}
                      </Badge>
                    )}
                  </div>

                  {(selectedMode !== 'memory-palace' || showQuestion) ? (
                    <CardTitle className="text-xl leading-relaxed">
                      {currentQuestion.text}
                    </CardTitle>
                  ) : (
                    <div className="text-center py-8">
                      <Brain className="h-16 w-16 mx-auto mb-4 text-purple-500 animate-pulse" />
                      <p className="text-lg font-semibold text-purple-600">
                        تذكر السؤال وأجب من الذاكرة
                      </p>
                    </div>
                  )}
                </CardHeader>

                <CardContent>
                  <div className="grid gap-3">
                    {currentQuestion.options.map((option, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        className={cn(
                          "p-4 h-auto text-right justify-start transition-all duration-300 hover:scale-105",
                          "border-2 hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                        )}
                        onClick={() => handleAnswerSelect(index)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-800 flex items-center justify-center font-bold">
                            {['أ', 'ب', 'ج', 'د'][index]}
                          </div>
                          <span className="text-base">{option}</span>
                        </div>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Timer visualization for speed modes */}
            {selectedModeConfig.timeLimit > 0 && (
              <div className="mb-4">
                <Progress 
                  value={(timeRemaining / selectedModeConfig.timeLimit) * 100}
                  className={cn(
                    "h-4",
                    timeRemaining <= 5 ? "animate-pulse" : ""
                  )}
                />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (challengeCompleted && finalStats) {
    return (
      <Dialog open={isOpen} onOpenChange={() => {}}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto font-arabic bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 dark:from-green-900/20 dark:via-blue-900/20 dark:to-purple-900/20">
          <div className="text-center py-8">
            <div className="relative mb-6">
              <Trophy className="h-24 w-24 mx-auto text-yellow-500 animate-bounce" />
              <div className="absolute inset-0 animate-ping">
                <Trophy className="h-24 w-24 mx-auto text-yellow-300 opacity-50" />
              </div>
            </div>

            <h2 className="text-4xl font-bold bg-gradient-to-r from-yellow-600 via-orange-600 to-red-600 bg-clip-text text-transparent mb-4">
              🎉 تهانينا! 🎉
            </h2>

            <p className="text-xl text-gray-700 dark:text-gray-300 mb-8">
              لقد أكملت تحدي {finalStats.mode.name} بنجاح!
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <Card className="bg-gradient-to-br from-green-100 to-green-200 dark:from-green-800 dark:to-green-900 border-green-300">
                <CardContent className="p-4 text-center">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
                  <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                    {finalStats.correctAnswers}
                  </div>
                  <div className="text-sm text-green-600 dark:text-green-400">إجابات صحيحة</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-800 dark:to-blue-900 border-blue-300">
                <CardContent className="p-4 text-center">
                  <Star className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                  <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                    {finalStats.score}
                  </div>
                  <div className="text-sm text-blue-600 dark:text-blue-400">النقاط الإجمالية</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-800 dark:to-orange-900 border-orange-300">
                <CardContent className="p-4 text-center">
                  <Flame className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                  <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                    {finalStats.streak}
                  </div>
                  <div className="text-sm text-orange-600 dark:text-orange-400">أطول سلسلة</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-800 dark:to-purple-900 border-purple-300">
                <CardContent className="p-4 text-center">
                  <Target className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                  <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                    {Math.round((finalStats.correctAnswers / finalStats.totalQuestions) * 100)}%
                  </div>
                  <div className="text-sm text-purple-600 dark:text-purple-400">نسبة النجاح</div>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-center gap-4">
              <Button
                onClick={resetChallenge}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3 text-lg"
              >
                <Repeat className="h-5 w-5 mr-2" />
                تحدي جديد
              </Button>
              
              <Button
                variant="outline"
                onClick={onClose}
                className="px-8 py-3 text-lg"
              >
                إنهاء التحدي
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return null;
}

export default MistakeChallengeModal;