
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, 
  Infinity, 
  Target, 
  Zap, 
  ChevronRight,
  AlertTriangle,
  Brain,
  Timer,
  X
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
  const [selectedMode, setSelectedMode] = useState<'timed' | 'untimed' | null>(null);

  const challengeModes = [
    {
      id: 'untimed',
      title: 'التحدي المفتوح',
      subtitle: 'بدون ضغط الوقت',
      description: 'راجع أخطاءك بهدوء وتعلم منها دون قيود زمنية',
      icon: <Infinity className="w-8 h-8" />,
      color: 'from-blue-500 to-cyan-500',
      borderColor: 'border-blue-200 hover:border-blue-400',
      bgColor: 'bg-blue-50 hover:bg-blue-100',
      features: [
        'وقت غير محدود للمراجعة',
        'فهم عميق للأخطاء',
        'تعلم بدون ضغط'
      ]
    },
    {
      id: 'timed',
      title: 'تحدي السرعة',
      subtitle: 'دقيقة واحدة لكل خطأ',
      description: 'اختبر سرعة فهمك وقدرتك على التعلم السريع',
      icon: <Timer className="w-8 h-8" />,
      color: 'from-orange-500 to-red-500',
      borderColor: 'border-orange-200 hover:border-orange-400',
      bgColor: 'bg-orange-50 hover:bg-orange-100',
      features: [
        'دقيقة واحدة لكل خطأ',
        'تحدي الوقت والتركيز',
        'نقاط إضافية للسرعة'
      ]
    }
  ];

  const handleModeSelect = (mode: 'timed' | 'untimed') => {
    setSelectedMode(mode);
    setTimeout(() => {
      onSelectMode(mode === 'timed');
      onClose();
      setSelectedMode(null);
    }, 300);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 border-2 border-blue-200 dark:border-slate-700">
        {/* Header */}
        <div className="relative p-8 text-center bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white overflow-hidden">
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
            <h2 className="text-3xl font-bold mb-2">تحدي مراجعة الأخطاء</h2>
            <p className="text-white/90 text-lg">
              اختر طريقتك المفضلة لمراجعة الأخطاء والتعلم منها
            </p>
          </motion.div>
        </div>

        {/* Content */}
        <div className="p-8">
          <div className="grid md:grid-cols-2 gap-6">
            {challengeModes.map((mode, index) => (
              <motion.div
                key={mode.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`relative group cursor-pointer rounded-2xl border-2 transition-all duration-300 ${mode.borderColor} ${mode.bgColor} dark:bg-slate-800/50 dark:border-slate-600 dark:hover:border-slate-500`}
                onClick={() => handleModeSelect(mode.id as 'timed' | 'untimed')}
              >
                <div className="p-6">
                  {/* Icon and Title */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${mode.color} text-white shadow-lg group-hover:scale-110 transition-transform`}>
                      {mode.icon}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-1">
                        {mode.title}
                      </h3>
                      <Badge variant="outline" className="text-sm">
                        {mode.subtitle}
                      </Badge>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                    {mode.description}
                  </p>

                  {/* Features */}
                  <div className="space-y-3 mb-6">
                    {mode.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${mode.color}`}></div>
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {feature}
                        </span>
                      </div>
                    ))}
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
