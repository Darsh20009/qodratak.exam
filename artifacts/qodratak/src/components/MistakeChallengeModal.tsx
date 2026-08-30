
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, 
  Infinity as InfinityIcon,
  Target, 
  Zap, 
  ChevronRight,
  AlertTriangle,
  Brain,
  Timer,
  X,
  Sparkles,
  Flame,
  Shield,
  Star,
  Award,
  Gamepad2,
  Rocket,
  Bolt,
  Crown,
  Swords,
  Trophy,
  Diamond,
  Heart,
  Gauge
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

interface MistakeChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMode: (timed: boolean) => void;
}

const MistakeChallengeModal: React.FC<MistakeChallengeModalProps> = ({
  isOpen,
  onClose,
  onSelectMode
}) => {
  const [selectedMode, setSelectedMode] = useState<'timed' | 'untimed' | 'lightning' | 'mastery' | 'survival' | null>(null);
  const [hoveredMode, setHoveredMode] = useState<string | null>(null);
  const [animationPhase, setAnimationPhase] = useState(0);

  useEffect(() => {
    if (isOpen) {
      const interval = setInterval(() => {
        setAnimationPhase(prev => (prev + 1) % 3);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  const challengeModes = [
    {
      id: 'untimed',
      title: 'رحلة الاستكشاف',
      subtitle: 'بدون ضغط الوقت',
      description: 'اكتشف أخطاءك في رحلة هادئة ومثيرة مع شروحات تفاعلية وتحليلات عميقة',
      icon: <InfinityIcon className="w-8 h-8" />,
      secondaryIcon: <Star className="w-4 h-4" />,
      color: 'from-blue-500 via-cyan-500 to-teal-500',
      bgGradient: 'from-blue-50 via-cyan-50 to-teal-50',
      darkBgGradient: 'from-blue-900/20 via-cyan-900/20 to-teal-900/20',
      borderColor: 'border-blue-300 hover:border-cyan-400',
      glowColor: 'shadow-blue-500/25',
      difficulty: 'مريح',
      difficultyColor: 'bg-green-100 text-green-800',
      features: [
        '⏰ وقت غير محدود للتفكير والمراجعة',
        '📚 شروحات تفصيلية ونصائح ذكية',
        '🎯 تركيز على الفهم العميق والتعلم المستدام',
        '💡 اقتراحات شخصية لتحسين الأداء'
      ],
      rewards: ['نقاط التعلم المضاعفة', 'شارات الاستكشاف', 'إحصائيات مفصلة']
    },
    {
      id: 'timed',
      title: 'تحدي الزمن',
      subtitle: 'دقيقة واحدة لكل خطأ',
      description: 'اختبر سرعة بديهتك وقدرتك على التعلم تحت الضغط مع نظام نقاط متقدم',
      icon: <Timer className="w-8 h-8" />,
      secondaryIcon: <Bolt className="w-4 h-4" />,
      color: 'from-orange-500 via-red-500 to-amber-600',
      bgGradient: 'from-orange-50 via-red-50 to-amber-600',
      darkBgGradient: 'from-orange-900/20 via-red-900/20 to-amber-600/20',
      borderColor: 'border-orange-300 hover:border-red-400',
      glowColor: 'shadow-orange-500/25',
      difficulty: 'متوسط',
      difficultyColor: 'bg-yellow-100 text-yellow-800',
      features: [
        '⚡ 60 ثانية لكل سؤال خاطئ',
        '🏆 مضاعف نقاط السرعة (x1.5)',
        '⏱️ عداد زمني تفاعلي مع تأثيرات بصرية',
        '🎖️ تحديات سرعة إضافية للمحترفين'
      ],
      rewards: ['نقاط السرعة المضاعفة', 'شارات البرق', 'لوحة شرف السرعة']
    },
    {
      id: 'lightning',
      title: 'عاصفة البرق',
      subtitle: '30 ثانية لكل خطأ',
      description: 'التحدي الأقصى! سرعة خاطفة ونقاط مضاعفة لأبطال التعلم السريع',
      icon: <Bolt className="w-8 h-8" />,
      secondaryIcon: <Flame className="w-4 h-4" />,
      color: 'from-green-600 via-green-500 to-teal-500',
      bgGradient: 'from-green-600 via-green-500 to-teal-500',
      darkBgGradient: 'from-green-600/20 via-green-500/20 to-teal-500/20',
      borderColor: 'border-green-400 hover:border-teal-400',
      glowColor: 'shadow-green-500/20',
      difficulty: 'خبير',
      difficultyColor: 'bg-green-100 text-green-700',
      features: [
        '⚡ 30 ثانية فقط لكل سؤال',
        '🚀 مضاعف نقاط فائق (x2.5)',
        '💥 تأثيرات بصرية مذهلة ومؤثرات صوتية',
        '👑 حصرياً للمتفوقين والطامحين'
      ],
      rewards: ['نقاط البرق الذهبية', 'تاج السرعة', 'مكانة الأسطورة']
    },
    {
      id: 'mastery',
      title: 'طريق الإتقان',
      subtitle: 'لا أخطاء مسموحة',
      description: 'تحدي الكمال المطلق! لا تخطئ أبداً واحصل على جوائز استثنائية',
      icon: <Crown className="w-8 h-8" />,
      secondaryIcon: <Diamond className="w-4 h-4" />,
      color: 'from-yellow-500 via-amber-500 to-orange-500',
      bgGradient: 'from-yellow-50 via-amber-50 to-orange-50',
      darkBgGradient: 'from-yellow-900/20 via-amber-900/20 to-orange-900/20',
      borderColor: 'border-yellow-300 hover:border-amber-400',
      glowColor: 'shadow-yellow-500/25',
      difficulty: 'أسطوري',
      difficultyColor: 'bg-gradient-to-r from-yellow-400 to-orange-400 text-white',
      features: [
        '👑 يجب الإجابة الصحيحة من المحاولة الأولى',
        '💎 مضاعف الإتقان الأسطوري (x3.0)',
        '🏆 شارات نادرة وحصرية للمتفوقين',
        '🎖️ مكانة خاصة في قاعة المجد'
      ],
      rewards: ['نقاط الإتقان الماسية', 'تاج الكمال', 'لقب الأسطورة']
    },
    {
      id: 'survival',
      title: 'معركة البقاء',
      subtitle: 'ثلاث محاولات فقط',
      description: 'اختبار الأعصاب الحقيقي! لديك ثلاث محاولات فقط لتصحيح جميع أخطائك',
      icon: <Shield className="w-8 h-8" />,
      secondaryIcon: <Heart className="w-4 h-4" />,
      color: 'from-emerald-500 via-green-500 to-teal-500',
      bgGradient: 'from-emerald-50 via-green-50 to-teal-50',
      darkBgGradient: 'from-emerald-900/20 via-green-900/20 to-teal-900/20',
      borderColor: 'border-emerald-300 hover:border-green-400',
      glowColor: 'shadow-emerald-500/25',
      difficulty: 'تحدي',
      difficultyColor: 'bg-red-100 text-red-800',
      features: [
        '💚 ثلاث حيوات فقط لكامل التحدي',
        '⚔️ تتناقص النقاط مع كل خطأ إضافي',
        '🛡️ استراتيجية ضرورية للنجاح',
        '🏅 جوائز خاصة للناجين'
      ],
      rewards: ['نقاط البقاء', 'شارة المحارب', 'لقب الناجي']
    }
  ];

  const handleModeSelect = (mode: 'timed' | 'untimed' | 'lightning' | 'mastery' | 'survival') => {
    setSelectedMode(mode);
    setTimeout(() => {
      // For now, map all new modes to appropriate timing behavior
      const isTimed = ['timed', 'lightning', 'mastery', 'survival'].includes(mode);
      onSelectMode(isTimed);
      onClose();
      setSelectedMode(null);
    }, 300);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-emerald-600 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 border-2 border-blue-200 dark:border-slate-700">
        {/* Header */}
        <div className="relative p-8 text-center bg-gradient-to-r from-blue-600 via-green-600 to-teal-500 text-white overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
          
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="relative z-10"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/20 mb-4">
              <Target className="w-10 h-10" />
            </div>
            <h2 className="text-3xl font-bold mb-2">🎯 تحدي مراجعة الأخطاء الإبداعي</h2>
            <p className="text-white/90 text-lg mb-4">
              اختر من 5 أنماط تحدي مبتكرة ومثيرة لمراجعة أخطائك والتعلم منها
            </p>
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ 
                duration: 2,
                repeat: Number.POSITIVE_INFINITY,
                repeatType: "loop"
              }}
              className="inline-flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full text-sm"
            >
              <Sparkles className="w-4 h-4" />
              <span>تجربة تعلم تفاعلية وممتعة</span>
            </motion.div>
          </motion.div>
        </div>

        {/* Content */}
        <div className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {challengeModes.map((mode, index) => (
              <motion.div
                key={mode.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`relative group cursor-pointer rounded-2xl border-2 transition-all duration-300 ${mode.borderColor} bg-gradient-to-br ${mode.bgGradient} dark:bg-gradient-to-br dark:${mode.darkBgGradient} hover:shadow-xl hover:${mode.glowColor} hover:scale-[1.02]`}
                onClick={() => handleModeSelect(mode.id as 'timed' | 'untimed' | 'lightning' | 'mastery' | 'survival')}
                onMouseEnter={() => setHoveredMode(mode.id)}
                onMouseLeave={() => setHoveredMode(null)}
              >
                <div className="p-6">
                  {/* Icon and Title */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`relative flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${mode.color} text-white shadow-lg group-hover:scale-110 transition-transform`}>
                      {mode.icon}
                      <div className={`absolute -top-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-br ${mode.color} flex items-center justify-center shadow-md`}>
                        {mode.secondaryIcon}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                          {mode.title}
                        </h3>
                        <Badge className={`text-xs px-2 py-1 ${mode.difficultyColor}`}>
                          {mode.difficulty}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {mode.subtitle}
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                    {mode.description}
                  </p>

                  {/* Features */}
                  <div className="space-y-3 mb-4">
                    {mode.features.map((feature, idx) => (
                      <motion.div 
                        key={idx} 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * idx }}
                        className="flex items-start gap-3"
                      >
                        <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${mode.color} mt-2 flex-shrink-0`}></div>
                        <span className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                          {feature}
                        </span>
                      </motion.div>
                    ))}
                  </div>

                  {/* Rewards Section */}
                  <div className="mb-6 p-3 bg-white/50 dark:bg-slate-700/30 rounded-lg border border-gray-200/50 dark:border-slate-600/50">
                    <div className="flex items-center gap-2 mb-2">
                      <Award className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">المكافآت والجوائز</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {mode.rewards.map((reward, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                          {reward}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Select Button */}
                  <Button 
                    className={`w-full bg-gradient-to-r ${mode.color} hover:opacity-90 text-white shadow-lg group-hover:shadow-xl transition-all duration-300`}
                    size="lg"
                  >
                    <span className="flex items-center gap-2">
                      اختر هذا النمط
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </Button>
                </div>

                {/* Selection Animation */}
                <AnimatePresence>
                  {selectedMode === mode.id && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-2xl flex items-center justify-center"
                    >
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="bg-green-500 text-white p-4 rounded-full"
                      >
                        <Zap className="w-8 h-8" />
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>

          {/* Bottom Info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-8 p-6 bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl border border-amber-200 dark:border-amber-800"
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <Brain className="w-8 h-8 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h4 className="font-semibold text-amber-800 dark:text-amber-200 mb-2">
                  💡 نصيحة للتعلم الفعال
                </h4>
                <p className="text-amber-700 dark:text-amber-300 text-sm leading-relaxed">
                  مراجعة الأخطاء هي أسرع طريق للتحسن. في النمط الموقوت، ستحصل على نقاط إضافية مقابل السرعة، 
                  بينما النمط المفتوح يمنحك فرصة للفهم العميق. اختر ما يناسب هدفك اليوم!
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MistakeChallengeModal;
