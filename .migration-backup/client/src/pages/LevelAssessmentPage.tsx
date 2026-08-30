import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import AiReviewingScreen, { WrongQuestion } from '@/components/AiReviewingScreen';
import { Brain, Calculator, Target, Zap, Trophy, Star, Clock, CheckCircle, XCircle, BarChart3, TrendingUp, Award, Crown, Diamond, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Question {
  id: number;
  category: string;
  subcategory: string;
  text: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

interface AssessmentResult {
  subcategory: string;
  level: 'مبتدئ' | 'متوسط' | 'متقدم' | 'خبير';
  score: number;
  totalQuestions: number;
  accuracy: number;
  timeSpent: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

interface LevelAssessmentState {
  currentTest: string | null;
  currentQuestion: number;
  questions: Question[];
  answers: { [key: number]: number };
  startTime: number;
  isCompleted: boolean;
  results: AssessmentResult | null;
  showAnalysis: boolean;
}

const verbalSubcategories = [
  { id: 'التناظر اللفظي', name: 'التناظر اللفظي', icon: '🔗', color: 'from-blue-500 to-emerald-600' },
  { id: 'إكمال الجمل', name: 'إكمال الجمل', icon: '✍️', color: 'from-green-500 to-blue-500' },
  { id: 'استيعاب المقروء', name: 'استيعاب المقروء', icon: '📖', color: 'from-green-600 to-amber-600' },
  { id: 'الخطأ السياقي', name: 'الخطأ السياقي', icon: '🎯', color: 'from-orange-500 to-red-500' },
  { id: 'المترادفات والأضداد', name: 'المترادفات والأضداد', icon: '⚖️', color: 'from-teal-500 to-cyan-500' }
];

const quantitativeSubcategories = [
  { id: 'الهندسة', name: 'الهندسة', icon: '📐', color: 'from-teal-600 to-emerald-600' },
  { id: 'عمليات حسابية', name: 'عمليات حسابية', icon: '🧮', color: 'from-blue-500 to-teal-500' },
  { id: 'النسبة المئوية', name: 'النسبة المئوية', icon: '📊', color: 'from-green-500 to-teal-500' },
  { id: 'المقارنات', name: 'المقارنات', icon: '⚖️', color: 'from-yellow-500 to-orange-500' },
  { id: 'الحركة والأنماط', name: 'الحركة والأنماط', icon: '🔄', color: 'from-amber-500 to-red-500' },
  { id: 'النسبة والتناسب', name: 'النسبة والتناسب', icon: '📏', color: 'from-cyan-500 to-blue-500' },
  { id: 'الإحصاء', name: 'الإحصاء', icon: '📈', color: 'from-green-600 to-teal-500' },
  { id: 'المعادلات', name: 'المعادلات', icon: '🔢', color: 'from-emerald-500 to-green-500' },
  { id: 'أفكار متنوعة', name: 'أفكار متنوعة', icon: '🧩', color: 'from-rose-500 to-amber-600' }
];

export function LevelAssessmentPage() {
  const [state, setState] = useState<LevelAssessmentState>({
    currentTest: null,
    currentQuestion: 0,
    questions: [],
    answers: {},
    startTime: 0,
    isCompleted: false,
    results: null,
    showAnalysis: false
  });

  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: number }>({});
  const [timeRemaining, setTimeRemaining] = useState(900); // 15 minutes
  const [showResults, setShowResults] = useState(false);
  const [showAiReview, setShowAiReview] = useState(false);
  const [wrongQuestionsForAI, setWrongQuestionsForAI] = useState<WrongQuestion[]>([]);

  const { data: questions } = useQuery<Question[]>({
    queryKey: ['/api/questions'],
    enabled: !!state.currentTest
  });

  // Timer effect
  useEffect(() => {
    if (state.currentTest && !state.isCompleted && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            completeAssessment();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [state.currentTest, state.isCompleted, timeRemaining]);

  const startAssessment = (subcategory: string, type: 'verbal' | 'quantitative') => {
    if (!questions) return;
    
    const filteredQuestions = questions
      .filter(q => q.category === type && q.subcategory === subcategory)
      .slice(0, 15); // 15 أسئلة لكل اختبار

    setState({
      currentTest: subcategory,
      currentQuestion: 0,
      questions: filteredQuestions,
      answers: {},
      startTime: Date.now(),
      isCompleted: false,
      results: null,
      showAnalysis: false
    });
    
    setSelectedAnswers({});
    setTimeRemaining(900); // 15 دقيقة
    setShowResults(false);
  };

  const selectAnswer = (answerIndex: number) => {
    const questionId = state.questions[state.currentQuestion]?.id;
    if (questionId) {
      setSelectedAnswers(prev => ({
        ...prev,
        [questionId]: answerIndex
      }));
    }
  };

  const nextQuestion = () => {
    if (state.currentQuestion < state.questions.length - 1) {
      setState(prev => ({
        ...prev,
        currentQuestion: prev.currentQuestion + 1
      }));
    } else {
      completeAssessment();
    }
  };

  const completeAssessment = () => {
    const timeSpent = Math.floor((Date.now() - state.startTime) / 1000);
    let correctAnswers = 0;
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const recommendations: string[] = [];

    state.questions.forEach(question => {
      const userAnswer = selectedAnswers[question.id];
      if (userAnswer === question.correctOptionIndex) {
        correctAnswers++;
      }
    });

    const accuracy = (correctAnswers / state.questions.length) * 100;
    let level: AssessmentResult['level'] = 'مبتدئ';
    
    if (accuracy >= 90) level = 'خبير';
    else if (accuracy >= 75) level = 'متقدم';
    else if (accuracy >= 60) level = 'متوسط';

    // تحليل نقاط القوة والضعف
    if (accuracy >= 80) {
      strengths.push('فهم ممتاز للمفاهيم الأساسية');
      strengths.push('قدرة عالية على التحليل');
    }
    if (timeSpent < 600) {
      strengths.push('سرعة في الإجابة');
    }
    if (accuracy < 70) {
      weaknesses.push('يحتاج تطوير في المفاهيم الأساسية');
      recommendations.push('مراجعة القواعد الأساسية');
    }
    if (timeSpent > 800) {
      weaknesses.push('يحتاج تحسين في السرعة');
      recommendations.push('التدرب على حل الأسئلة بوقت محدد');
    }

    const results: AssessmentResult = {
      subcategory: state.currentTest!,
      level,
      score: correctAnswers,
      totalQuestions: state.questions.length,
      accuracy: Math.round(accuracy),
      timeSpent,
      strengths,
      weaknesses,
      recommendations
    };

    setState(prev => ({
      ...prev,
      isCompleted: true,
      results,
      answers: selectedAnswers
    }));

    // Build wrong questions for AI review
    const wrongs: WrongQuestion[] = state.questions
      .filter(q => selectedAnswers[q.id] === undefined || selectedAnswers[q.id] !== q.correctOptionIndex)
      .map(q => ({
        questionText: q.text,
        options: q.options,
        studentAnswerIndex: selectedAnswers[q.id] ?? null,
        correctAnswerIndex: q.correctOptionIndex,
        category: q.category,
        subcategory: q.subcategory,
      }));
    setWrongQuestionsForAI(wrongs);
    setShowAiReview(true);
  };

  const resetAssessment = () => {
    setState({
      currentTest: null,
      currentQuestion: 0,
      questions: [],
      answers: {},
      startTime: 0,
      isCompleted: false,
      results: null,
      showAnalysis: false
    });
    setSelectedAnswers({});
    setShowResults(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'خبير': return <Crown className="h-6 w-6 text-yellow-500" />;
      case 'متقدم': return <Diamond className="h-6 w-6 text-green-700" />;
      case 'متوسط': return <Star className="h-6 w-6 text-blue-500" />;
      default: return <Target className="h-6 w-6 text-green-500" />;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'خبير': return 'from-yellow-400 to-orange-500';
      case 'متقدم': return 'from-green-600 to-amber-600';
      case 'متوسط': return 'from-blue-400 to-teal-500';
      default: return 'from-green-400 to-teal-500';
    }
  };

  // AI Review Screen
  if (showAiReview) {
    const userStr = localStorage.getItem('user');
    const userEmail = userStr ? JSON.parse(userStr)?.email : undefined;
    const totalQ = state.questions.length;
    const correctCount = totalQ - wrongQuestionsForAI.length;
    return (
      <AiReviewingScreen
        wrongQuestions={wrongQuestionsForAI}
        totalQuestions={totalQ}
        score={correctCount}
        userEmail={userEmail}
        onShowResults={() => {
          setShowAiReview(false);
          setShowResults(true);
        }}
      />
    );
  }

  // عرض النتائج
  if (showResults && state.results) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-teal-500 dark:from-slate-900 dark:via-blue-900 dark:to-teal-500 p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          {/* رأس النتائج */}
          <Card className="mb-8 bg-gradient-to-r from-teal-600 to-emerald-600 text-white border-0">
            <CardHeader className="text-center">
              <div className="flex items-center justify-center mb-4">
                <div className="bg-white/20 p-4 rounded-full">
                  {getLevelIcon(state.results.level)}
                </div>
              </div>
              <CardTitle className="text-3xl font-bold mb-2">
                تقييم مستواك في {state.results.subcategory}
              </CardTitle>
              <div className="text-xl opacity-90">
                مستواك: {state.results.level}
              </div>
            </CardHeader>
          </Card>

          {/* الإحصائيات الرئيسية */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="text-center bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20">
                <CardContent className="p-6">
                  <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-green-600">
                    {state.results.score}/{state.results.totalQuestions}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">إجابات صحيحة</div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="text-center bg-gradient-to-br from-blue-50 to-cyan-100 dark:from-blue-900/20 dark:to-cyan-900/20">
                <CardContent className="p-6">
                  <Target className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-blue-600">
                    {state.results.accuracy}%
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">دقة الإجابات</div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="text-center bg-gradient-to-br from-green-600 to-amber-600 dark:from-green-600/20 dark:to-amber-600/20">
                <CardContent className="p-6">
                  <Clock className="h-8 w-8 text-green-700 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-green-700">
                    {formatTime(state.results.timeSpent)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">وقت الإنجاز</div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="text-center bg-gradient-to-br from-yellow-50 to-orange-100 dark:from-yellow-900/20 dark:to-orange-900/20">
                <CardContent className="p-6">
                  <Trophy className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-yellow-600">
                    {state.results.level}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">المستوى</div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* التحليل التفصيلي */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* نقاط القوة */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-600">
                    <Sparkles className="h-5 w-5" />
                    نقاط القوة
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {state.results.strengths.map((strength, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6 + index * 0.1 }}
                        className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg"
                      >
                        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span className="text-green-700 dark:text-green-300">{strength}</span>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* نقاط التحسين */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-orange-600">
                    <TrendingUp className="h-5 w-5" />
                    نقاط التحسين
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {state.results.weaknesses.length > 0 ? state.results.weaknesses.map((weakness, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6 + index * 0.1 }}
                        className="flex items-center gap-2 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg"
                      >
                        <Target className="h-4 w-4 text-orange-500 flex-shrink-0" />
                        <span className="text-orange-700 dark:text-orange-300">{weakness}</span>
                      </motion.div>
                    )) : (
                      <div className="text-center py-8 text-gray-500">
                        <Trophy className="h-12 w-12 mx-auto mb-2 text-yellow-500" />
                        <p>أداء ممتاز! لا توجد نقاط ضعف واضحة</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* التوصيات */}
          {state.results.recommendations.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-600">
                    <Award className="h-5 w-5" />
                    توصيات للتطوير
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {state.results.recommendations.map((recommendation, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.8 + index * 0.1 }}
                        className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
                      >
                        <div className="flex items-start gap-3">
                          <div className="bg-blue-100 dark:bg-blue-800 p-2 rounded-full">
                            <Brain className="h-4 w-4 text-blue-600" />
                          </div>
                          <span className="text-blue-700 dark:text-blue-300">{recommendation}</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* أزرار العمل */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Button
              onClick={resetAssessment}
              size="lg"
              className="bg-gradient-to-r from-blue-500 to-emerald-600 hover:from-blue-600 hover:to-emerald-600 text-white px-8 py-3"
            >
              <Target className="h-5 w-5 mr-2" />
              اختبار قسم آخر
            </Button>
            <Button
              onClick={() => window.location.href = '/'}
              variant="outline"
              size="lg"
              className="px-8 py-3"
            >
              العودة للرئيسية
            </Button>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  // عرض الاختبار
  if (state.currentTest && state.questions.length > 0 && !state.isCompleted) {
    const currentQuestion = state.questions[state.currentQuestion];
    const progress = ((state.currentQuestion + 1) / state.questions.length) * 100;
    const selectedAnswer = selectedAnswers[currentQuestion?.id];

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-teal-500 dark:from-slate-900 dark:via-blue-900 dark:to-teal-500 p-4">
        <div className="max-w-4xl mx-auto">
          {/* شريط التقدم والمعلومات */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="flex items-center gap-4">
                    <div className="bg-gradient-to-r from-blue-500 to-emerald-600 text-white px-4 py-2 rounded-full">
                      {state.currentQuestion + 1} / {state.questions.length}
                    </div>
                    <div className="text-lg font-semibold">{state.currentTest}</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-full ${
                      timeRemaining < 300 ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                    }`}>
                      <Clock className="h-4 w-4" />
                      {formatTime(timeRemaining)}
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <Progress value={progress} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* السؤال */}
          <motion.div
            key={state.currentQuestion}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-6"
          >
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="text-xl text-center">
                  {currentQuestion.text}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-3">
                  {currentQuestion.options.map((option, index) => (
                    <motion.button
                      key={index}
                      onClick={() => selectAnswer(index)}
                      className={`p-4 text-right rounded-lg border-2 transition-all duration-200 ${
                        selectedAnswer === index
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                          : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 hover:bg-blue-50/50 dark:hover:bg-blue-900/10'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-center justify-between">
                        <span>{option}</span>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          selectedAnswer === index
                            ? 'border-blue-500 bg-blue-500'
                            : 'border-gray-300'
                        }`}>
                          {selectedAnswer === index && (
                            <CheckCircle className="h-4 w-4 text-white" />
                          )}
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
                
                <div className="flex justify-between items-center mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setState(prev => ({ ...prev, currentQuestion: Math.max(0, prev.currentQuestion - 1) }))}
                    disabled={state.currentQuestion === 0}
                  >
                    السؤال السابق
                  </Button>
                  
                  <Button
                    onClick={nextQuestion}
                    disabled={selectedAnswer === undefined}
                    className="bg-gradient-to-r from-blue-500 to-emerald-600 hover:from-blue-600 hover:to-emerald-600 text-white"
                  >
                    {state.currentQuestion === state.questions.length - 1 ? 'إنهاء الاختبار' : 'السؤال التالي'}
                    <Zap className="h-4 w-4 mr-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  // الشاشة الرئيسية
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-teal-500 dark:from-slate-900 dark:via-blue-900 dark:to-teal-500 p-6">
      <div className="max-w-6xl mx-auto">
        {/* العنوان الرئيسي */}
        <motion.div 
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent mb-4">
            اختبارات قياس المستوى
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            اكتشف مستواك الحقيقي في كل قسم من أقسام القدرات واحصل على تحليل دقيق وتوصيات مخصصة لتطوير أدائك
          </p>
        </motion.div>

        <Tabs defaultValue="verbal" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8 h-14">
            <TabsTrigger value="verbal" className="text-lg flex items-center gap-2">
              <Brain className="h-5 w-5" />
              الاختبارات اللفظية
            </TabsTrigger>
            <TabsTrigger value="quantitative" className="text-lg flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              الاختبارات الكمية
            </TabsTrigger>
          </TabsList>

          {/* الاختبارات اللفظية */}
          <TabsContent value="verbal">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {verbalSubcategories.map((subcategory, index) => (
                <motion.div
                  key={subcategory.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                  className="group cursor-pointer"
                >
                  <Card 
                    className="h-full bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
                    onClick={() => startAssessment(subcategory.id, 'verbal')}
                  >
                    <div className={`h-2 bg-gradient-to-r ${subcategory.color}`} />
                    <CardHeader className="text-center pb-4">
                      <div className="text-4xl mb-3">{subcategory.icon}</div>
                      <CardTitle className="text-xl mb-2">{subcategory.name}</CardTitle>
                      <Badge variant="secondary" className="mx-auto">
                        15 سؤال • 15 دقيقة
                      </Badge>
                    </CardHeader>
                    <CardContent className="text-center">
                      <div className="space-y-3 mb-6">
                        <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <Target className="h-4 w-4" />
                          تقييم شامل للمستوى
                        </div>
                        <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <BarChart3 className="h-4 w-4" />
                          تحليل دقيق للأداء
                        </div>
                        <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <Trophy className="h-4 w-4" />
                          توصيات مخصصة
                        </div>
                      </div>
                      <Button 
                        className={`w-full bg-gradient-to-r ${subcategory.color} text-white border-0 group-hover:shadow-lg transition-all duration-300`}
                      >
                        ابدأ الاختبار
                        <Zap className="h-4 w-4 mr-2" />
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </TabsContent>

          {/* الاختبارات الكمية */}
          <TabsContent value="quantitative">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {quantitativeSubcategories.map((subcategory, index) => (
                <motion.div
                  key={subcategory.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                  className="group cursor-pointer"
                >
                  <Card 
                    className="h-full bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
                    onClick={() => startAssessment(subcategory.id, 'quantitative')}
                  >
                    <div className={`h-2 bg-gradient-to-r ${subcategory.color}`} />
                    <CardHeader className="text-center pb-4">
                      <div className="text-4xl mb-3">{subcategory.icon}</div>
                      <CardTitle className="text-xl mb-2">{subcategory.name}</CardTitle>
                      <Badge variant="secondary" className="mx-auto">
                        15 سؤال • 15 دقيقة
                      </Badge>
                    </CardHeader>
                    <CardContent className="text-center">
                      <div className="space-y-3 mb-6">
                        <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <Target className="h-4 w-4" />
                          تقييم شامل للمستوى
                        </div>
                        <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <BarChart3 className="h-4 w-4" />
                          تحليل دقيق للأداء
                        </div>
                        <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <Trophy className="h-4 w-4" />
                          توصيات مخصصة
                        </div>
                      </div>
                      <Button 
                        className={`w-full bg-gradient-to-r ${subcategory.color} text-white border-0 group-hover:shadow-lg transition-all duration-300`}
                      >
                        ابدأ الاختبار
                        <Zap className="h-4 w-4 mr-2" />
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </TabsContent>
        </Tabs>

        {/* معلومات إضافية */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-16 text-center"
        >
          <Card className="max-w-4xl mx-auto bg-gradient-to-r from-blue-500 to-emerald-600 text-white border-0">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold mb-4">لماذا اختبارات قياس المستوى؟</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <div>
                  <Target className="h-8 w-8 mx-auto mb-2 opacity-90" />
                  <h4 className="font-semibold mb-2">تقييم دقيق</h4>
                  <p className="text-sm opacity-90">تحديد مستواك الحقيقي في كل قسم</p>
                </div>
                <div>
                  <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-90" />
                  <h4 className="font-semibold mb-2">تحليل شامل</h4>
                  <p className="text-sm opacity-90">تقرير مفصل عن نقاط القوة والضعف</p>
                </div>
                <div>
                  <Trophy className="h-8 w-8 mx-auto mb-2 opacity-90" />
                  <h4 className="font-semibold mb-2">خطة تطوير</h4>
                  <p className="text-sm opacity-90">توصيات مخصصة لتحسين أدائك</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}