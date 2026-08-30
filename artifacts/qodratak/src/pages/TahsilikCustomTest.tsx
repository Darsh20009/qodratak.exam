import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import { 
  PenTool,
  Settings,
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
  Lightbulb,
  Trophy,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  Zap
} from 'lucide-react';

const TahsilikCustomTest: React.FC = () => {
  const [, setLocation] = useLocation();
  const [testName, setTestName] = useState('');
  const [totalQuestions, setTotalQuestions] = useState(30);
  const [timeLimit, setTimeLimit] = useState([60]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(['رياضيات']);
  const [difficulty, setDifficulty] = useState('متوسط');
  const [questionDistribution, setQuestionDistribution] = useState<{[key: string]: number}>({
    'رياضيات': 10,
    'فيزياء': 8,
    'كيمياء': 7,
    'أحياء': 5,
    'علوم البيئة': 0
  });

  const subjects = [
    {
      id: 'رياضيات',
      name: 'الرياضيات',
      icon: Calculator,
      color: 'from-green-600 to-emerald-500',
      maxQuestions: 1200,
      description: 'الجبر، الهندسة، التفاضل والتكامل'
    },
    {
      id: 'فيزياء',
      name: 'الفيزياء',
      icon: Atom,
      color: 'from-blue-500 to-teal-500',
      maxQuestions: 890,
      description: 'الميكانيكا، الكهرباء، البصريات'
    },
    {
      id: 'كيمياء',
      name: 'الكيمياء',
      icon: FlaskConical,
      color: 'from-green-500 to-emerald-500',
      maxQuestions: 750,
      description: 'العضوية، غير العضوية، التحليلية'
    },
    {
      id: 'أحياء',
      name: 'الأحياء',
      icon: Dna,
      color: 'from-amber-500 to-rose-500',
      maxQuestions: 680,
      description: 'الخلية، الوراثة، التشريح'
    },
    {
      id: 'علوم البيئة',
      name: 'علوم البيئة',
      icon: Globe,
      color: 'from-teal-500 to-cyan-500',
      maxQuestions: 320,
      description: 'النظم البيئية، التنوع الحيوي'
    }
  ];

  const difficulties = [
    { value: 'مبتدئ', label: 'مبتدئ', color: 'bg-green-500', description: 'أسئلة أساسية ومباشرة' },
    { value: 'متوسط', label: 'متوسط', color: 'bg-yellow-500', description: 'أسئلة متوسطة الصعوبة' },
    { value: 'متقدم', label: 'متقدم', color: 'bg-red-500', description: 'أسئلة تحليلية معقدة' }
  ];

  const handleSubjectToggle = (subjectId: string) => {
    if (selectedSubjects.includes(subjectId)) {
      setSelectedSubjects(selectedSubjects.filter(s => s !== subjectId));
      setQuestionDistribution(prev => ({
        ...prev,
        [subjectId]: 0
      }));
    } else {
      setSelectedSubjects([...selectedSubjects, subjectId]);
      const remainingQuestions = totalQuestions - Object.values(questionDistribution).reduce((sum, val) => sum + val, 0);
      setQuestionDistribution(prev => ({
        ...prev,
        [subjectId]: Math.min(5, remainingQuestions)
      }));
    }
  };

  const updateQuestionDistribution = (subjectId: string, value: number) => {
    const currentTotal = Object.values(questionDistribution).reduce((sum, val) => sum + val, 0);
    const currentValue = questionDistribution[subjectId];
    const newTotal = currentTotal - currentValue + value;
    
    if (newTotal <= totalQuestions) {
      setQuestionDistribution(prev => ({
        ...prev,
        [subjectId]: value
      }));
    }
  };

  const autoDistribute = () => {
    const questionsPerSubject = Math.floor(totalQuestions / selectedSubjects.length);
    const remainder = totalQuestions % selectedSubjects.length;
    
    const newDistribution: {[key: string]: number} = {};
    subjects.forEach(subject => {
      if (selectedSubjects.includes(subject.id)) {
        newDistribution[subject.id] = questionsPerSubject;
      } else {
        newDistribution[subject.id] = 0;
      }
    });

    // توزيع الباقي على أول المواد المختارة
    for (let i = 0; i < remainder; i++) {
      if (selectedSubjects[i]) {
        newDistribution[selectedSubjects[i]]++;
      }
    }

    setQuestionDistribution(newDistribution);
  };

  const totalDistributedQuestions = Object.values(questionDistribution).reduce((sum, val) => sum + val, 0);
  const isValidTest = testName.length > 0 && totalDistributedQuestions === totalQuestions && selectedSubjects.length > 0;

  const startCustomTest = () => {
    if (isValidTest) {
      const testConfig = {
        name: testName,
        subjects: selectedSubjects,
        distribution: questionDistribution,
        difficulty,
        timeLimit: timeLimit[0],
        totalQuestions
      };
      
      // حفظ تكوين الاختبار في localStorage
      localStorage.setItem('customTestConfig', JSON.stringify(testConfig));
      setLocation('/tahsilik/test-runner/custom');
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
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-xl">
              <PenTool className="w-8 h-8 text-white" />
            </div>
            <div className="text-right">
              <h1 className="text-4xl font-black bg-gradient-to-r from-blue-500 to-emerald-600 bg-clip-text text-transparent">
                اختبار مخصص
              </h1>
              <p className="text-slate-600 dark:text-slate-300">صمم اختبارك حسب احتياجاتك</p>
            </div>
          </div>
        </motion.div>

        <div className="max-w-4xl mx-auto space-y-8">
          {/* Test Configuration */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Settings className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  <CardTitle className="text-xl text-slate-800 dark:text-slate-200">إعدادات الاختبار</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Test Name */}
                <div className="space-y-2">
                  <Label htmlFor="testName" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    اسم الاختبار
                  </Label>
                  <Input
                    id="testName"
                    data-testid="input-test-name"
                    value={testName}
                    onChange={(e) => setTestName(e.target.value)}
                    placeholder="مثال: اختبار الفيزياء والكيمياء"
                    className="bg-white/50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Total Questions */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      عدد الأسئلة: {totalQuestions}
                    </Label>
                    <Slider
                      data-testid="slider-total-questions"
                      value={[totalQuestions]}
                      onValueChange={(value) => setTotalQuestions(value[0])}
                      max={100}
                      min={10}
                      step={5}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span>10</span>
                      <span>100</span>
                    </div>
                  </div>

                  {/* Time Limit */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      الوقت بالدقائق: {timeLimit[0]}
                    </Label>
                    <Slider
                      data-testid="slider-time-limit"
                      value={timeLimit}
                      onValueChange={setTimeLimit}
                      max={180}
                      min={15}
                      step={15}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span>15د</span>
                      <span>180د</span>
                    </div>
                  </div>

                  {/* Difficulty */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      مستوى الصعوبة
                    </Label>
                    <Select value={difficulty} onValueChange={setDifficulty}>
                      <SelectTrigger data-testid="select-difficulty" className="bg-white/50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {difficulties.map((diff) => (
                          <SelectItem key={diff.value} value={diff.value}>
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${diff.color}`}></div>
                              <span>{diff.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Subject Selection */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Brain className="w-6 h-6 text-green-700 dark:text-green-700" />
                    <CardTitle className="text-xl text-slate-800 dark:text-slate-200">اختيار المواد</CardTitle>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    data-testid="button-auto-distribute"
                    onClick={autoDistribute}
                    className="bg-white/50 dark:bg-slate-700/50"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    توزيع تلقائي
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {subjects.map((subject) => (
                    <motion.div
                      key={subject.id}
                      whileHover={{ scale: 1.02 }}
                      className={`relative p-4 rounded-xl border-2 transition-all cursor-pointer ${
                        selectedSubjects.includes(subject.id)
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30'
                          : 'border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50'
                      }`}
                      onClick={() => handleSubjectToggle(subject.id)}
                    >
                      <div className="flex items-start gap-3">
                        <Checkbox
                          data-testid={`checkbox-subject-${subject.id}`}
                          checked={selectedSubjects.includes(subject.id)}
                          onChange={() => handleSubjectToggle(subject.id)}
                        />
                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${subject.color} flex items-center justify-center`}>
                          <subject.icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-slate-800 dark:text-slate-200">{subject.name}</h3>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{subject.description}</p>
                          <Badge variant="outline" className="text-xs">
                            متاح: {subject.maxQuestions} سؤال
                          </Badge>
                        </div>
                      </div>

                      {selectedSubjects.includes(subject.id) && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700"
                        >
                          <Label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                            عدد الأسئلة: {questionDistribution[subject.id]}
                          </Label>
                          <Slider
                            data-testid={`slider-questions-${subject.id}`}
                            value={[questionDistribution[subject.id]]}
                            onValueChange={(value) => updateQuestionDistribution(subject.id, value[0])}
                            max={Math.min(subject.maxQuestions, totalQuestions)}
                            min={0}
                            step={1}
                            className="w-full"
                          />
                        </motion.div>
                      )}
                    </motion.div>
                  ))}
                </div>

                {/* Distribution Summary */}
                <div className="mt-6 p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-slate-800 dark:text-slate-200">توزيع الأسئلة</span>
                    <span className={`font-bold ${
                      totalDistributedQuestions === totalQuestions 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {totalDistributedQuestions} / {totalQuestions}
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    {selectedSubjects.map(subjectId => {
                      const subject = subjects.find(s => s.id === subjectId);
                      const questions = questionDistribution[subjectId];
                      if (!subject || questions === 0) return null;
                      
                      return (
                        <div key={subjectId} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <subject.icon className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                            <span className="text-slate-700 dark:text-slate-300">{subject.name}</span>
                          </div>
                          <Badge variant="secondary">{questions} سؤال</Badge>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex gap-4 justify-center"
          >
            <Button
              variant="outline"
              data-testid="button-cancel"
              onClick={() => setLocation('/tahsilik/mobile-dashboard')}
              className="bg-white/50 dark:bg-slate-700/50 px-6 py-3"
            >
              إلغاء
            </Button>
            
            <Button
              data-testid="button-start-test"
              onClick={startCustomTest}
              disabled={!isValidTest}
              className={`px-8 py-3 font-semibold transition-all ${
                isValidTest
                  ? 'bg-gradient-to-r from-blue-500 to-emerald-600 hover:from-blue-600 hover:to-emerald-600 text-white shadow-lg hover:shadow-xl'
                  : 'bg-slate-300 dark:bg-slate-600 text-slate-500 dark:text-slate-400 cursor-not-allowed'
              }`}
            >
              <Play className="w-5 h-5 mr-2" />
              بدء الاختبار
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>

          {/* Validation Messages */}
          <AnimatePresence>
            {!isValidTest && testName.length > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="text-center"
              >
                <Card className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
                  <CardContent className="py-4">
                    <div className="flex items-center justify-center gap-2 text-yellow-800 dark:text-yellow-200">
                      <AlertTriangle className="w-5 h-5" />
                      <span className="text-sm font-medium">
                        {totalDistributedQuestions !== totalQuestions 
                          ? `يجب توزيع ${totalQuestions} سؤال بالضبط (تم توزيع ${totalDistributedQuestions})`
                          : selectedSubjects.length === 0 
                          ? 'يجب اختيار مادة واحدة على الأقل'
                          : 'يرجى إكمال جميع الحقول المطلوبة'
                        }
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default TahsilikCustomTest;