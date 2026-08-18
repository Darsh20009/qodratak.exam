import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Target,
  Calculator,
  Atom,
  FlaskConical,
  Dna,
  Globe,
  Clock,
  Brain,
  Play,
  ArrowRight,
  Star,
  Award,
  CheckCircle,
  Timer,
  TrendingUp,
  Users,
  BookOpen,
  Lightbulb,
  Zap,
  Trophy,
  Eye,
  ChevronRight
} from 'lucide-react';

const TahsilikSubjectTest: React.FC = () => {
  const [, setLocation] = useLocation();
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

  const subjects = [
    {
      id: 'math',
      name: 'الرياضيات',
      title: 'اختبار الرياضيات التخصصي',
      icon: Calculator,
      color: 'from-green-600 to-emerald-500',
      bgColor: 'from-green-600 to-emerald-500 dark:from-green-600/20 dark:to-emerald-500/20',
      description: 'تركيز كامل على المفاهيم الرياضية الأساسية والمتقدمة',
      questionsCount: 20,
      timeLimit: 25,
      difficulty: 'متقدم',
      topics: ['الجبر المتقدم', 'الهندسة التحليلية', 'التفاضل والتكامل', 'الإحصاء والاحتمالات'],
      avgScore: 76,
      totalAttempts: 1850,
      skillAreas: [
        { name: 'حل المعادلات', difficulty: 'متوسط', questions: 5 },
        { name: 'الهندسة', difficulty: 'متقدم', questions: 4 },
        { name: 'التفاضل', difficulty: 'متقدم', questions: 6 },
        { name: 'الإحصاء', difficulty: 'متوسط', questions: 5 }
      ]
    },
    {
      id: 'physics',
      name: 'الفيزياء',
      title: 'اختبار الفيزياء التخصصي',
      icon: Atom,
      color: 'from-blue-500 to-teal-500',
      bgColor: 'from-blue-50 to-teal-500 dark:from-blue-900/20 dark:to-teal-500/20',
      description: 'استكشاف شامل لقوانين الفيزياء والظواهر الطبيعية',
      questionsCount: 20,
      timeLimit: 22,
      difficulty: 'متقدم',
      topics: ['الميكانيكا الكلاسيكية', 'الكهرباء والمغناطيسية', 'البصريات', 'الفيزياء الحديثة'],
      avgScore: 73,
      totalAttempts: 1420,
      skillAreas: [
        { name: 'الحركة والقوى', difficulty: 'متوسط', questions: 6 },
        { name: 'الكهرباء', difficulty: 'متقدم', questions: 5 },
        { name: 'الضوء والبصريات', difficulty: 'متوسط', questions: 4 },
        { name: 'الفيزياء الحديثة', difficulty: 'متقدم', questions: 5 }
      ]
    },
    {
      id: 'chemistry',
      name: 'الكيمياء',
      title: 'اختبار الكيمياء التخصصي',
      icon: FlaskConical,
      color: 'from-green-500 to-emerald-600',
      bgColor: 'from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20',
      description: 'تطبيقات شاملة للمفاهيم الكيميائية والتفاعلات',
      questionsCount: 20,
      timeLimit: 20,
      difficulty: 'متوسط',
      topics: ['الكيمياء العضوية', 'الكيمياء غير العضوية', 'الكيمياء الفيزيائية', 'التحليل الكيميائي'],
      avgScore: 79,
      totalAttempts: 1630,
      skillAreas: [
        { name: 'التفاعلات الكيميائية', difficulty: 'متوسط', questions: 6 },
        { name: 'الكيمياء العضوية', difficulty: 'متقدم', questions: 5 },
        { name: 'الحسابات الكيميائية', difficulty: 'متوسط', questions: 4 },
        { name: 'التوازن الكيميائي', difficulty: 'متقدم', questions: 5 }
      ]
    },
    {
      id: 'biology',
      name: 'الأحياء',
      title: 'اختبار الأحياء التخصصي',
      icon: Dna,
      color: 'from-amber-500 to-rose-600',
      bgColor: 'from-amber-500 to-rose-50 dark:from-amber-500/20 dark:to-rose-900/20',
      description: 'دراسة معمقة للحياة والعمليات البيولوجية',
      questionsCount: 20,
      timeLimit: 18,
      difficulty: 'متوسط',
      topics: ['علم الخلية والجزيئات', 'علم الوراثة', 'علم التشريح ووظائف الأعضاء', 'علم البيئة'],
      avgScore: 81,
      totalAttempts: 1390,
      skillAreas: [
        { name: 'الخلية والوراثة', difficulty: 'متوسط', questions: 6 },
        { name: 'التشريح', difficulty: 'متوسط', questions: 5 },
        { name: 'وظائف الأعضاء', difficulty: 'متقدم', questions: 4 },
        { name: 'البيئة والتطور', difficulty: 'متوسط', questions: 5 }
      ]
    },
    {
      id: 'environmental',
      name: 'علوم البيئة',
      title: 'اختبار علوم البيئة التخصصي',
      icon: Globe,
      color: 'from-teal-500 to-cyan-600',
      bgColor: 'from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20',
      description: 'فهم النظم البيئية والتفاعل مع البيئة المحيطة',
      questionsCount: 20,
      timeLimit: 15,
      difficulty: 'مبتدئ',
      topics: ['النظم البيئية', 'التنوع الحيوي', 'التلوث البيئي', 'الاستدامة'],
      avgScore: 84,
      totalAttempts: 890,
      skillAreas: [
        { name: 'النظم البيئية', difficulty: 'مبتدئ', questions: 7 },
        { name: 'التنوع الحيوي', difficulty: 'متوسط', questions: 5 },
        { name: 'التلوث البيئي', difficulty: 'متوسط', questions: 4 },
        { name: 'الاستدامة', difficulty: 'مبتدئ', questions: 4 }
      ]
    }
  ];

  const selectedSubjectData = subjects.find(s => s.id === selectedSubject);

  const startSubjectTest = () => {
    if (selectedSubjectData) {
      const testConfig = {
        type: 'subject',
        subject: selectedSubjectData,
        totalQuestions: 20,
        timeLimit: selectedSubjectData.timeLimit
      };
      
      localStorage.setItem('subjectTestConfig', JSON.stringify(testConfig));
      setLocation('/tahsilik/test-runner/subject');
    }
  };

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
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-emerald-500/30">
              <Target className="w-8 h-8 text-white" />
            </div>
            <div className="text-right">
              <h1 className="text-4xl font-black bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent">
                20 سؤال موضوعي
              </h1>
              <p className="text-slate-600 dark:text-slate-300">اختبار تخصصي في مادة واحدة</p>
            </div>
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-slate-700 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed mb-6"
          >
            اختر المادة التي تريد التخصص فيها واختبر معرفتك بـ 20 سؤالاً مركزاً
          </motion.p>
        </motion.div>

        <div className="max-w-6xl mx-auto">
          {/* Subject Selection */}
          <AnimatePresence mode="wait">
            {!selectedSubject ? (
              <motion.div
                key="selection"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2">اختر المادة الدراسية</h2>
                  <p className="text-slate-600 dark:text-slate-400">اختر المادة التي تريد التركيز عليها في الاختبار</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {subjects.map((subject, index) => (
                    <motion.div
                      key={subject.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 + index * 0.1 }}
                      whileHover={{ scale: 1.02, y: -5 }}
                      whileTap={{ scale: 0.98 }}
                      className="cursor-pointer"
                      data-testid={`card-subject-${subject.id}`}
                      onClick={() => setSelectedSubject(subject.id)}
                    >
                      <Card className={`h-full bg-gradient-to-br ${subject.bgColor} border-0 shadow-lg hover:shadow-xl transition-all duration-300 group overflow-hidden`}>
                        {/* Background gradient */}
                        <div className={`absolute inset-0 bg-gradient-to-r ${subject.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                        
                        <CardHeader className="relative z-10 pb-3">
                          <div className="flex items-center gap-3 mb-3">
                            <div className={`w-14 h-14 bg-gradient-to-r ${subject.color} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                              <subject.icon className="w-7 h-7 text-white" />
                            </div>
                            <div className="flex-1">
                              <CardTitle className="text-lg font-bold text-slate-800 dark:text-slate-200 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:bg-clip-text group-hover:from-slate-700 group-hover:to-slate-900 dark:group-hover:from-slate-200 dark:group-hover:to-slate-400 transition-all">
                                {subject.name}
                              </CardTitle>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className={`text-xs ${
                                  subject.difficulty === 'متقدم' ? 'border-red-500 text-red-600' :
                                  subject.difficulty === 'متوسط' ? 'border-yellow-500 text-yellow-600' :
                                  'border-green-500 text-green-600'
                                }`}>
                                  {subject.difficulty}
                                </Badge>
                                <Badge variant="secondary" className="text-xs">
                                  {subject.timeLimit} دقيقة
                                </Badge>
                              </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-600 group-hover:translate-x-1 transition-all" />
                          </div>
                        </CardHeader>

                        <CardContent className="relative z-10 pt-0">
                          <p className="text-slate-600 dark:text-slate-400 text-sm mb-4 leading-relaxed">
                            {subject.description}
                          </p>

                          {/* Stats */}
                          <div className="grid grid-cols-3 gap-3 mb-4">
                            <div className="text-center p-2 bg-white/50 dark:bg-slate-800/50 rounded-lg">
                              <div className="text-lg font-bold text-slate-800 dark:text-slate-200">{subject.questionsCount}</div>
                              <div className="text-xs text-slate-600 dark:text-slate-400">سؤال</div>
                            </div>
                            <div className="text-center p-2 bg-white/50 dark:bg-slate-800/50 rounded-lg">
                              <div className="text-lg font-bold text-slate-800 dark:text-slate-200">{subject.avgScore}%</div>
                              <div className="text-xs text-slate-600 dark:text-slate-400">متوسط النتائج</div>
                            </div>
                            <div className="text-center p-2 bg-white/50 dark:bg-slate-800/50 rounded-lg">
                              <div className="text-lg font-bold text-slate-800 dark:text-slate-200">{subject.totalAttempts.toLocaleString()}</div>
                              <div className="text-xs text-slate-600 dark:text-slate-400">مشارك</div>
                            </div>
                          </div>

                          {/* Topics Preview */}
                          <div className="space-y-2">
                            <div className="text-xs font-medium text-slate-700 dark:text-slate-300">المواضيع الرئيسية:</div>
                            <div className="flex flex-wrap gap-1">
                              {subject.topics.slice(0, 2).map((topic, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs bg-white/60 dark:bg-slate-800/60">
                                  {topic}
                                </Badge>
                              ))}
                              {subject.topics.length > 2 && (
                                <Badge variant="secondary" className="text-xs bg-white/60 dark:bg-slate-800/60">
                                  +{subject.topics.length - 2}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ) : (
              /* Selected Subject Details */
              <motion.div
                key="details"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="space-y-8"
              >
                {selectedSubjectData && (
                  <>
                    {/* Subject Header */}
                    <Card className={`bg-gradient-to-br ${selectedSubjectData.color} text-white border-0 shadow-2xl overflow-hidden`}>
                      <div className="absolute inset-0 opacity-20">
                        <selectedSubjectData.icon className="w-64 h-64 absolute -bottom-16 -right-16" />
                      </div>
                      <CardContent className="relative z-10 py-8">
                        <div className="flex items-center gap-6">
                          <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                            <selectedSubjectData.icon className="w-10 h-10 text-white" />
                          </div>
                          <div className="flex-1">
                            <h2 className="text-3xl font-black mb-2">{selectedSubjectData.title}</h2>
                            <p className="text-lg opacity-90 mb-4">{selectedSubjectData.description}</p>
                            <div className="flex gap-4">
                              <Badge className="bg-white/20 text-white border-white/30 px-4 py-2">
                                <Clock className="w-4 h-4 mr-2" />
                                {selectedSubjectData.timeLimit} دقيقة
                              </Badge>
                              <Badge className="bg-white/20 text-white border-white/30 px-4 py-2">
                                <Target className="w-4 h-4 mr-2" />
                                {selectedSubjectData.questionsCount} سؤال
                              </Badge>
                              <Badge className="bg-white/20 text-white border-white/30 px-4 py-2">
                                <TrendingUp className="w-4 h-4 mr-2" />
                                {selectedSubjectData.avgScore}% متوسط
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Skill Areas Breakdown */}
                    <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-xl">
                      <CardHeader>
                        <CardTitle className="text-xl text-slate-800 dark:text-slate-200">توزيع الأسئلة حسب المهارات</CardTitle>
                        <CardDescription>
                          توزيع الأسئلة الـ{selectedSubjectData.questionsCount} على المهارات والمفاهيم الأساسية
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {selectedSubjectData.skillAreas.map((skill, index) => (
                            <motion.div
                              key={skill.name}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg"
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${selectedSubjectData.color} flex items-center justify-center`}>
                                  <span className="text-white font-bold text-sm">{skill.questions}</span>
                                </div>
                                <div>
                                  <h3 className="font-semibold text-slate-800 dark:text-slate-200">{skill.name}</h3>
                                  <p className="text-sm text-slate-600 dark:text-slate-400">{skill.questions} أسئلة</p>
                                </div>
                              </div>
                              <Badge 
                                variant="outline"
                                className={`${
                                  skill.difficulty === 'متقدم' ? 'border-red-500 text-red-600' :
                                  skill.difficulty === 'متوسط' ? 'border-yellow-500 text-yellow-600' :
                                  'border-green-500 text-green-600'
                                }`}
                              >
                                {skill.difficulty}
                              </Badge>
                            </motion.div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Action Buttons */}
                    <div className="flex gap-4 justify-center">
                      <Button
                        variant="outline"
                        data-testid="button-select-another-subject"
                        onClick={() => setSelectedSubject(null)}
                        className="bg-white/50 dark:bg-slate-700/50 px-6 py-3"
                      >
                        اختيار مادة أخرى
                      </Button>
                      
                      <Button
                        data-testid="button-start-subject-test"
                        onClick={startSubjectTest}
                        className={`bg-gradient-to-r ${selectedSubjectData.color} hover:opacity-90 text-white shadow-lg hover:shadow-xl px-8 py-3 font-semibold transition-all`}
                      >
                        <Play className="w-5 h-5 mr-2" />
                        بدء اختبار {selectedSubjectData.name}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default TahsilikSubjectTest;