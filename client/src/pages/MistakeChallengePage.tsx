
import React, { useState, useEffect } from 'react';
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
  Medal
} from 'lucide-react';

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
}

interface ChallengeData {
  type: string;
  mode: 'timed' | 'untimed';
  questions: MistakeQuestion[];
  originalTest: {
    testName: string;
    subcategory: string;
    originalScore: number;
    originalTotal: number;
  };
  timeLimit: number | null;
}

export default function MistakeChallengePage() {
  const [, setLocation] = useLocation();
  const [challengeData, setChallengeData] = useState<ChallengeData | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{[key: number]: string}>({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showConfirmFinish, setShowConfirmFinish] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [challengeResult, setChallengeResult] = useState<{
    score: number;
    total: number;
    improvement: number;
    timeSpent: number;
  } | null>(null);

  useEffect(() => {
    const storedChallenge = localStorage.getItem('mistakeChallenge');
    if (storedChallenge) {
      try {
        const data = JSON.parse(storedChallenge);
        setChallengeData(data);
        if (data.timeLimit) {
          setTimeRemaining(data.timeLimit);
        }
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
    if (timeRemaining > 0 && !isPaused && !isCompleted && challengeData?.mode === 'timed') {
      const timer = setInterval(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    } else if (timeRemaining === 0 && challengeData?.mode === 'timed' && !isCompleted) {
      handleFinishChallenge();
    }
  }, [timeRemaining, isPaused, isCompleted, challengeData]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeColor = () => {
    if (!challengeData?.timeLimit) return 'text-green-500';
    const percentage = (timeRemaining / challengeData.timeLimit) * 100;
    if (percentage <= 20) return 'text-red-500';
    if (percentage <= 40) return 'text-orange-500';
    return 'text-green-500';
  };

  const handleAnswerSelect = (answerIndex: string) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [currentQuestionIndex]: answerIndex
    }));
  };

  const handleNextQuestion = () => {
    if (challengeData && currentQuestionIndex < challengeData.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleFinishChallenge = () => {
    if (!challengeData) return;

    // حساب النتيجة
    let correctCount = 0;
    challengeData.questions.forEach((question, index) => {
      const userAnswer = selectedAnswers[index];
      const correctAnswer = question.correctOptionIndex?.toString() || question.correct_answer;
      if (userAnswer === correctAnswer) {
        correctCount++;
      }
    });

    const improvement = correctCount - (challengeData.originalTest.originalTotal - challengeData.originalTest.originalScore);
    const timeSpent = challengeData.timeLimit ? challengeData.timeLimit - timeRemaining : 0;

    const result = {
      score: correctCount,
      total: challengeData.questions.length,
      improvement,
      timeSpent
    };

    setChallengeResult(result);
    setIsCompleted(true);

    // حفظ النتيجة
    const challengeHistory = JSON.parse(localStorage.getItem('challengeHistory') || '[]');
    challengeHistory.push({
      ...result,
      date: new Date().toISOString(),
      testName: challengeData.originalTest.testName,
      mode: challengeData.mode
    });
    localStorage.setItem('challengeHistory', JSON.stringify(challengeHistory));
    localStorage.removeItem('mistakeChallenge');
  };

  const getAnsweredCount = () => {
    return Object.keys(selectedAnswers).length;
  };

  const getModeInfo = () => {
    if (!challengeData) return { title: '', description: '', icon: null, color: '' };
    
    switch (challengeData.mode) {
      case 'timed':
        return {
          title: 'تحدي الزمن',
          description: 'اختبر سرعة تعلمك من الأخطاء',
          icon: <Clock className="w-6 h-6" />,
          color: 'from-orange-500 to-red-500'
        };
      case 'untimed':
        return {
          title: 'رحلة الاستكشاف',
          description: 'تعلم بهدوء وعمق من أخطائك',
          icon: <Brain className="w-6 h-6" />,
          color: 'from-blue-500 to-purple-500'
        };
      default:
        return {
          title: 'تحدي الأخطاء',
          description: 'حول أخطاءك إلى نقاط قوة',
          icon: <Target className="w-6 h-6" />,
          color: 'from-green-500 to-blue-500'
        };
    }
  };

  if (!challengeData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 dark:from-red-900 dark:to-orange-900 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (isCompleted && challengeResult) {
    const modeInfo = getModeInfo();
    const successRate = (challengeResult.score / challengeResult.total) * 100;
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 dark:from-emerald-900 dark:via-green-900 dark:to-teal-900">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center mb-8"
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 1, repeat: Infinity, repeatDelay: 2 }}
              className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 flex items-center justify-center shadow-2xl"
            >
              <Trophy className="w-12 h-12 text-white" />
            </motion.div>
            
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
              تهانينا! أكملت التحدي
            </h1>
            
            <Badge className={`text-lg px-4 py-2 bg-gradient-to-r ${modeInfo.color} text-white`}>
              {modeInfo.title}
            </Badge>
          </motion.div>

          <Card className="mb-8 overflow-hidden shadow-2xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
            <div className={`h-2 bg-gradient-to-r ${modeInfo.color}`} />
            
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold mb-4">
                نتيجة التحدي
              </CardTitle>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 p-6 rounded-2xl"
                >
                  <div className="text-4xl font-bold text-emerald-600 mb-2">
                    {challengeResult.score}/{challengeResult.total}
                  </div>
                  <div className="text-lg font-semibold text-emerald-800 dark:text-emerald-300">
                    {successRate.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    معدل النجاح
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-6 rounded-2xl"
                >
                  <div className="text-4xl font-bold text-blue-600 mb-2">
                    {challengeResult.improvement > 0 ? '+' : ''}{challengeResult.improvement}
                  </div>
                  <div className="text-lg font-semibold text-blue-800 dark:text-blue-300">
                    {challengeResult.improvement > 0 ? 'تحسن' : 'نفس المستوى'}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    مقارنة بالاختبار الأصلي
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 p-6 rounded-2xl"
                >
                  <div className="text-4xl font-bold text-orange-600 mb-2">
                    {challengeData.mode === 'timed' ? formatTime(challengeResult.timeSpent) : '∞'}
                  </div>
                  <div className="text-lg font-semibold text-orange-800 dark:text-orange-300">
                    الوقت المستغرق
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {challengeData.mode === 'timed' ? 'موقوت' : 'غير موقوت'}
                  </div>
                </motion.div>
              </div>
            </CardHeader>

            <CardContent>
              <div className="mb-6">
                <Progress value={successRate} className="h-4" />
                <div className="flex justify-between mt-2 text-sm text-gray-500">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>

              {/* رسالة تحفيزية */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className={`p-6 rounded-2xl border-2 border-dashed mb-6 ${
                  successRate >= 80 ? 'bg-emerald-50 border-emerald-300 dark:bg-emerald-900/20 dark:border-emerald-700' :
                  successRate >= 60 ? 'bg-blue-50 border-blue-300 dark:bg-blue-900/20 dark:border-blue-700' :
                  'bg-orange-50 border-orange-300 dark:bg-orange-900/20 dark:border-orange-700'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    successRate >= 80 ? 'bg-emerald-500' :
                    successRate >= 60 ? 'bg-blue-500' : 'bg-orange-500'
                  }`}>
                    {successRate >= 80 ? <Crown className="w-6 h-6 text-white" /> :
                     successRate >= 60 ? <Medal className="w-6 h-6 text-white" /> :
                     <Target className="w-6 h-6 text-white" />}
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-bold text-lg mb-2 ${
                      successRate >= 80 ? 'text-emerald-600' :
                      successRate >= 60 ? 'text-blue-600' : 'text-orange-600'
                    }`}>
                      {successRate >= 80 ? 'إنجاز رائع! 🎉' :
                       successRate >= 60 ? 'تحسن ملحوظ! 👏' :
                       'خطوة في الطريق الصحيح! 💪'}
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                      {successRate >= 80 ? 'لقد أتقنت معظم الأخطاء السابقة! هذا يدل على تعلم فعال وتحسن حقيقي في الأداء.' :
                       successRate >= 60 ? 'تحسن جيد في فهم الأخطاء السابقة. استمر في المراجعة والتدريب.' :
                       'كل محاولة هي خطوة نحو التحسن. راجع الشروحات وحاول مرة أخرى.'}
                    </p>
                  </div>
                </div>
              </motion.div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={() => setLocation('/test-results')}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3"
                >
                  <ArrowLeft className="w-5 h-5 ml-2" />
                  العودة للنتائج
                </Button>

                <Button
                  onClick={() => setLocation('/verbal-tests')}
                  variant="outline"
                  className="border-2 border-green-500 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 px-8 py-3"
                >
                  <RefreshCw className="w-5 h-5 mr-2" />
                  اختبار جديد
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const modeInfo = getModeInfo();
  const currentQuestion = challengeData.questions[currentQuestionIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 dark:from-red-900 dark:via-orange-900 dark:to-yellow-900">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Header */}
        <Card className="mb-6 overflow-hidden">
          <div className={`h-3 bg-gradient-to-r ${modeInfo.color}`} />
          
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-r ${modeInfo.color} text-white flex items-center justify-center`}>
                  {modeInfo.icon}
                </div>
                <div>
                  <div className="text-2xl font-bold">{modeInfo.title}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {modeInfo.description}
                  </div>
                  <Badge variant="outline" className="mt-1">
                    {challengeData.originalTest.subcategory}
                  </Badge>
                </div>
              </div>
              
              {challengeData.mode === 'timed' && (
                <div className="text-right">
                  <div className={`text-3xl font-bold ${getTimeColor()}`}>
                    {formatTime(timeRemaining)}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    الوقت المتبقي
                  </div>
                </div>
              )}
            </CardTitle>
          </CardHeader>
          
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                <Swords className="w-6 h-6 text-red-500" />
                <div>
                  <div className="text-lg font-bold">{getAnsweredCount()} / {challengeData.questions.length}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">الأسئلة المُجابة</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Target className="w-6 h-6 text-blue-500" />
                <div>
                  <div className="text-lg font-bold">
                    {challengeData.originalTest.originalScore}/{challengeData.originalTest.originalTotal}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">النتيجة الأصلية</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Heart className="w-6 h-6 text-pink-500" />
                <div>
                  <div className="text-lg font-bold">{challengeData.questions.length}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">أخطاء للمراجعة</div>
                </div>
              </div>
            </div>
            
            <div className="mt-4">
              <Progress 
                value={(getAnsweredCount() / challengeData.questions.length) * 100} 
                className="h-3"
              />
            </div>
          </CardContent>
        </Card>

        {/* Question */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestionIndex}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-full flex items-center justify-center font-bold">
                    {currentQuestionIndex + 1}
                  </div>
                  <div className="flex-1">
                    <div className="text-lg">السؤال {currentQuestionIndex + 1}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline">
                        {currentQuestion?.subcategory || 'غير محدد'}
                      </Badge>
                      <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                        إجابة خاطئة سابقاً
                      </Badge>
                    </div>
                  </div>
                </CardTitle>
              </CardHeader>
              
              <CardContent>
                <div className="text-xl leading-relaxed mb-6 text-gray-800 dark:text-white">
                  {currentQuestion?.text || currentQuestion?.question || 'لا يوجد نص للسؤال'}
                </div>

                <div className="grid gap-3 mb-6">
                  {(currentQuestion?.options || currentQuestion?.choices)?.map((choice: string, index: number) => {
                    const isSelected = selectedAnswers[currentQuestionIndex] === index.toString();
                    const wasWrongAnswer = currentQuestion.userAnswer === index.toString();
                    const isCorrectAnswer = currentQuestion.correctOptionIndex === index || currentQuestion.correct_answer === index.toString();
                    
                    return (
                      <motion.button
                        key={index}
                        onClick={() => handleAnswerSelect(index.toString())}
                        className={`p-4 text-right rounded-xl border-2 transition-all duration-200 ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                            : wasWrongAnswer
                            ? 'border-red-300 bg-red-50 dark:bg-red-900/20'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800'
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-bold ${
                            isSelected
                              ? 'border-blue-500 bg-blue-500 text-white'
                              : wasWrongAnswer
                              ? 'border-red-400 bg-red-100 text-red-600'
                              : 'border-gray-400'
                          }`}>
                            {String.fromCharCode(65 + index)}
                          </div>
                          <span className="flex-1 text-lg">{choice}</span>
                          {wasWrongAnswer && (
                            <XCircle className="w-5 h-5 text-red-500" />
                          )}
                          {isCorrectAnswer && (
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                          )}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>

                {/* إظهار الشرح إذا كان متوفراً */}
                {currentQuestion?.explanation && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800"
                  >
                    <div className="flex items-start gap-3">
                      <Brain className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                          الشرح والتوضيح:
                        </h4>
                        <p className="text-blue-700 dark:text-blue-300 leading-relaxed">
                          {currentQuestion.explanation}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            onClick={handlePreviousQuestion}
            disabled={currentQuestionIndex === 0}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ArrowRight className="w-4 h-4" />
            السؤال السابق
          </Button>

          <div className="flex items-center gap-2">
            {challengeData.mode === 'timed' && (
              <Button
                onClick={() => setIsPaused(!isPaused)}
                variant="outline"
                className="flex items-center gap-2"
              >
                {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                {isPaused ? 'استكمال' : 'إيقاف مؤقت'}
              </Button>
            )}

            {currentQuestionIndex === challengeData.questions.length - 1 ? (
              <Button
                onClick={() => setShowConfirmFinish(true)}
                className="flex items-center gap-2 bg-green-500 hover:bg-green-600"
              >
                <Check className="w-4 h-4" />
                إنهاء التحدي
              </Button>
            ) : null}
          </div>

          <Button
            onClick={handleNextQuestion}
            disabled={currentQuestionIndex === challengeData.questions.length - 1}
            className="flex items-center gap-2"
          >
            السؤال التالي
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </div>

        {/* Confirm Finish Dialog */}
        <AnimatePresence>
          {showConfirmFinish && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
              onClick={() => setShowConfirmFinish(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md mx-4"
              >
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Trophy className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">إنهاء التحدي</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    هل أنت مستعد لرؤية نتيجة تحدي الأخطاء؟
                  </p>
                  <div className="flex gap-3">
                    <Button
                      onClick={() => setShowConfirmFinish(false)}
                      variant="outline"
                      className="flex-1"
                    >
                      مراجعة الإجابات
                    </Button>
                    <Button
                      onClick={handleFinishChallenge}
                      className="flex-1 bg-green-500 hover:bg-green-600"
                    >
                      عرض النتيجة
                    </Button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
