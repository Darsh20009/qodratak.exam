import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Crown,
  Trophy,
  Calculator,
  Atom,
  FlaskConical,
  Dna,
  Globe,
  Clock,
  Target,
  Brain,
  Play,
  ArrowRight,
  Sparkles,
  Star,
  Award,
  CheckCircle,
  Timer,
  BarChart3,
  Zap,
  Users,
  TrendingUp,
  BookOpen,
  AlertTriangle,
  Info,
  FileText
} from 'lucide-react';

const TahsilikComprehensiveTest: React.FC = () => {
  const [, setLocation] = useLocation();
  const [selectedMode, setSelectedMode] = useState<'standard' | 'timed' | 'practice'>('standard');

  // توزيع الأسئلة في الاختبار الشامل (110 سؤال)
  const questionDistribution = [
    {
      subject: 'الرياضيات',
      icon: Calculator,
      color: 'from-green-600 to-emerald-500',
      questions: 28,
      timeAllocation: 35, // دقيقة
      percentage: 25.5,
      description: 'جبر، هندسة، تفاضل وتكامل',
      topics: ['الجبر المتقدم', 'الهندسة التحليلية', 'التفاضل والتكامل', 'الإحصاء والاحتمالات']
    },
    {
      subject: 'الفيزياء',
      icon: Atom,
      color: 'from-blue-500 to-teal-500',
      questions: 27,
      timeAllocation: 32,
      percentage: 24.5,
      description: 'ميكانيكا، كهرباء، حرارة',
      topics: ['الميكانيكا الكلاسيكية', 'الكهرباء والمغناطيسية', 'البصريات', 'الفيزياء الحديثة']
    },
    {
      subject: 'الكيمياء',
      icon: FlaskConical,
      color: 'from-green-500 to-emerald-500',
      questions: 26,
      timeAllocation: 30,
      percentage: 23.6,
      description: 'عضوية، غير عضوية، تحليلية',
      topics: ['الكيمياء العضوية', 'الكيمياء غير العضوية', 'الكيمياء الفيزيائية', 'التحليل الكيميائي']
    },
    {
      subject: 'الأحياء',
      icon: Dna,
      color: 'from-amber-500 to-rose-500',
      questions: 23,
      timeAllocation: 28,
      percentage: 20.9,
      description: 'خلية، وراثة، تشريح',
      topics: ['علم الخلية والجزيئات', 'علم الوراثة', 'علم التشريح ووظائف الأعضاء', 'علم البيئة']
    },
    {
      subject: 'علوم البيئة',
      icon: Globe,
      color: 'from-teal-500 to-cyan-500',
      questions: 6,
      timeAllocation: 10,
      percentage: 5.5,
      description: 'نظم بيئية، تنوع حيوي',
      topics: ['النظم البيئية', 'التنوع الحيوي', 'التلوث البيئي', 'الاستدامة']
    }
  ];

  const testModes = [
    {
      id: 'standard',
      name: 'الوضع العادي',
      icon: Target,
      color: 'from-blue-500 to-cyan-500',
      timeLimit: 135, // دقيقة
      description: 'اختبار شامل بوقت محدد (2:15 ساعة)',
      features: ['توقيت إجمالي', 'مراجعة نهائية', 'تقرير مفصل'],
      difficulty: 'متوسط'
    },
    {
      id: 'timed',
      name: 'وضع التحدي',
      icon: Zap,
      color: 'from-orange-500 to-red-500',
      timeLimit: 110,
      description: 'اختبار سريع للمتميزين (1:50 ساعة)',
      features: ['ضغط زمني', 'نقاط إضافية', 'ترتيب تنافسي'],
      difficulty: 'متقدم'
    },
    {
      id: 'practice',
      name: 'وضع التدريب',
      icon: BookOpen,
      color: 'from-green-600 to-amber-600',
      timeLimit: 0, // غير محدود
      description: 'تدريب بدون ضغط زمني مع شروحات',
      features: ['وقت مفتوح', 'شروحات فورية', 'مساعدات'],
      difficulty: 'تعليمي'
    }
  ];

  const stats = [
    { label: 'إجمالي الأسئلة', value: '110', icon: FileText },
    { label: 'الوقت المتوقع', value: '2:15', icon: Clock },
    { label: 'معدل النجاح', value: '78%', icon: TrendingUp },
    { label: 'المشاركون', value: '2.3K+', icon: Users }
  ];

  const startComprehensiveTest = () => {
    const testConfig = {
      type: 'comprehensive',
      mode: selectedMode,
      totalQuestions: 110,
      distribution: questionDistribution,
      timeLimit: testModes.find(m => m.id === selectedMode)?.timeLimit || 135
    };
    
    localStorage.setItem('comprehensiveTestConfig', JSON.stringify(testConfig));
    setLocation('/tahsilik/test-runner/comprehensive');
  };

  const totalTime = questionDistribution.reduce((sum, subject) => sum + subject.timeAllocation, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-teal-500 dark:from-slate-900 dark:via-blue-900/50 dark:to-teal-500">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-4 mb-4">
            <div className="w-20 h-20 bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 rounded-3xl flex items-center justify-center shadow-2xl shadow-orange-500/30 relative">
              <Crown className="w-10 h-10 text-white" />
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-pulse">
                <Sparkles className="w-4 h-4 text-white m-2" />
              </div>
            </div>
            <div className="text-right">
              <h1 className="text-5xl font-black bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 bg-clip-text text-transparent">
                110 سؤال شامل
              </h1>
              <p className="text-slate-600 dark:text-slate-300">الاختبار التحصيلي الكامل</p>
            </div>
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-slate-700 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed mb-6"
          >
            اختبار شامل يحاكي الاختبار التحصيلي الحقيقي مع توزيع متوازن للأسئلة عبر جميع المواد العلمية
          </motion.p>

          {/* Quick Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
          >
            {stats.map((stat, index) => (
              <Card key={index} className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-lg">
                <CardContent className="text-center py-4">
                  <stat.icon className="w-6 h-6 mx-auto mb-2 text-blue-600 dark:text-blue-400" />
                  <div className="text-2xl font-bold text-slate-800 dark:text-slate-200">{stat.value}</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </motion.div>
        </motion.div>

        <div className="max-w-6xl mx-auto space-y-8">
          {/* Question Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <BarChart3 className="w-6 h-6 text-green-700 dark:text-green-700" />
                  <CardTitle className="text-xl text-slate-800 dark:text-slate-200">توزيع الأسئلة</CardTitle>
                </div>
                <CardDescription>
                  توزيع الأسئلة الـ110 على المواد الدراسية حسب المعايير الرسمية
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {questionDistribution.map((subject, index) => (
                    <motion.div
                      key={subject.subject}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.8 + index * 0.1 }}
                      className={`relative p-6 rounded-2xl bg-gradient-to-br ${subject.color} text-white overflow-hidden`}
                    >
                      {/* Background Pattern */}
                      <div className="absolute inset-0 opacity-10">
                        <subject.icon className="w-32 h-32 absolute -bottom-4 -right-4" />
                      </div>
                      
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-3">
                          <subject.icon className="w-8 h-8" />
                          <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                            {subject.percentage.toFixed(1)}%
                          </Badge>
                        </div>
                        
                        <h3 className="text-lg font-bold mb-2">{subject.subject}</h3>
                        <p className="text-sm opacity-90 mb-4">{subject.description}</p>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm">الأسئلة</span>
                            <span className="font-bold text-xl">{subject.questions}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">الوقت المقترح</span>
                            <span className="font-semibold">{subject.timeAllocation}د</span>
                          </div>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="mt-4">
                          <div className="bg-white/20 rounded-full h-2">
                            <div 
                              className="bg-white rounded-full h-2 transition-all duration-1000"
                              style={{ width: `${(subject.questions / 110) * 100}%` }}
                            ></div>
                          </div>
                        </div>

                        {/* Topics */}
                        <div className="mt-4">
                          <div className="text-xs opacity-75 mb-2">المواضيع الرئيسية:</div>
                          <div className="flex flex-wrap gap-1">
                            {subject.topics.slice(0, 2).map((topic, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs bg-white/20 text-white border-white/30">
                                {topic}
                              </Badge>
                            ))}
                            {subject.topics.length > 2 && (
                              <Badge variant="secondary" className="text-xs bg-white/20 text-white border-white/30">
                                +{subject.topics.length - 2}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Summary */}
                <div className="mt-6 p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-slate-800 dark:text-slate-200">110</div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">إجمالي الأسئلة</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-slate-800 dark:text-slate-200">{totalTime}د</div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">الوقت المقترح</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-slate-800 dark:text-slate-200">5</div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">مواد دراسية</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-slate-800 dark:text-slate-200">100%</div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">تطابق رسمي</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Test Modes */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
          >
            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Target className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  <CardTitle className="text-xl text-slate-800 dark:text-slate-200">اختيار وضع الاختبار</CardTitle>
                </div>
                <CardDescription>
                  اختر الوضع الذي يناسب مستواك وأهدافك من الاختبار
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {testModes.map((mode, index) => (
                    <motion.div
                      key={mode.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`relative p-6 rounded-2xl border-2 cursor-pointer transition-all ${
                        selectedMode === mode.id
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30 shadow-lg'
                          : 'border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                      data-testid={`card-test-mode-${mode.id}`}
                      onClick={() => setSelectedMode(mode.id as 'standard' | 'timed' | 'practice')}
                    >
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${mode.color} flex items-center justify-center mb-4 shadow-lg`}>
                        <mode.icon className="w-6 h-6 text-white" />
                      </div>
                      
                      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2">{mode.name}</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{mode.description}</p>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-600 dark:text-slate-400">الوقت</span>
                          <Badge variant="outline">
                            {mode.timeLimit ? `${Math.floor(mode.timeLimit / 60)}:${String(mode.timeLimit % 60).padStart(2, '0')}` : 'مفتوح'}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-600 dark:text-slate-400">الصعوبة</span>
                          <Badge 
                            variant="outline"
                            className={
                              mode.difficulty === 'متقدم' ? 'border-red-500 text-red-600' :
                              mode.difficulty === 'متوسط' ? 'border-yellow-500 text-yellow-600' :
                              'border-green-500 text-green-600'
                            }
                          >
                            {mode.difficulty}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="text-xs font-medium text-slate-700 dark:text-slate-300">المميزات:</div>
                        {mode.features.map((feature, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                            <CheckCircle className="w-3 h-3 text-green-500" />
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>
                      
                      {selectedMode === mode.id && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center"
                        >
                          <CheckCircle className="w-4 h-4 text-white" />
                        </motion.div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Important Notes */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
          >
            <Card className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
              <CardContent className="py-4">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                  <div className="space-y-2">
                    <h3 className="font-semibold text-amber-800 dark:text-amber-200">ملاحظات مهمة:</h3>
                    <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1">
                      <li>• يحتوي الاختبار على 110 سؤال موزعة على 5 مواد دراسية</li>
                      <li>• التوزيع يحاكي الاختبار التحصيلي الرسمي بدقة</li>
                      <li>• يُنصح بإنجاز الاختبار في جلسة واحدة للحصول على تقييم دقيق</li>
                      <li>• ستحصل على تحليل مفصل لأدائك في كل مادة</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.4 }}
            className="flex gap-4 justify-center"
          >
            <Button
              variant="outline"
              data-testid="button-back"
              onClick={() => setLocation('/tahsilik/mobile-dashboard')}
              className="bg-white/50 dark:bg-slate-700/50 px-6 py-3"
            >
              رجوع
            </Button>
            
            <Button
              data-testid="button-start-comprehensive-test"
              onClick={startComprehensiveTest}
              className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 hover:from-amber-600 hover:via-orange-600 hover:to-red-600 text-white shadow-lg hover:shadow-xl px-8 py-3 font-semibold transition-all"
            >
              <Play className="w-5 h-5 mr-2" />
              بدء الاختبار الشامل
              <Crown className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default TahsilikComprehensiveTest;