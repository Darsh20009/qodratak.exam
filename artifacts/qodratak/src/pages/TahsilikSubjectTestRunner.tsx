import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import AiReviewingScreen, { WrongQuestion, QuestionExplanation } from '@/components/AiReviewingScreen';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowRight,
  ArrowLeft,
  Clock,
  CheckCircle,
  Trophy,
  RotateCcw,
  ChevronRight,
  Timer,
  Brain,
  Calculator,
  Atom,
  FlaskConical,
  Dna,
  Globe
} from 'lucide-react';
import { QiyasExamLayout } from '@/components/QiyasExamLayout';
import { useUser } from '@/hooks/use-user';

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  category: string;
  explanation?: string;
  hint?: string;
}

interface SubjectTestConfig {
  type: string;
  subject: {
    id: string;
    name: string;
    title: string;
    timeLimit: number;
    questionsCount: number;
    color: string;
    icon: any;
  };
  totalQuestions: number;
  timeLimit: number;
}

const TahsilikSubjectTestRunner: React.FC = () => {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useUser();
  
  const [testConfig, setTestConfig] = useState<SubjectTestConfig | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answers, setAnswers] = useState<{ [key: number]: number }>({});
  const [bookmarkedQuestions, setBookmarkedQuestions] = useState<Set<number>>(new Set());
  const [timeLeft, setTimeLeft] = useState(0);
  const [isStarted, setIsStarted] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [showAiReview, setShowAiReview] = useState(false);
  const [wrongQuestionsForAI, setWrongQuestionsForAI] = useState<WrongQuestion[]>([]);
  const [aiExplanations, setAiExplanations] = useState<QuestionExplanation[]>([]);
  const [results, setResults] = useState<any>(null);

  useEffect(() => {
    // تحميل إعدادات الاختبار من localStorage
    const storedConfig = localStorage.getItem('subjectTestConfig');
    if (storedConfig) {
      try {
        const config = JSON.parse(storedConfig);
        setTestConfig(config);
        setTimeLeft(config.timeLimit * 60); // تحويل إلى ثواني
        
        // إنشاء أسئلة تجريبية للاختبار (في التطبيق الحقيقي ستأتي من API)
        generateMockQuestions(config);
      } catch (error) {
        console.error('Error parsing test config:', error);
        toast({
          title: "خطأ",
          description: "حدث خطأ في تحميل إعدادات الاختبار",
          variant: "destructive"
        });
        setLocation('/tahsilik/tests/subject');
      }
    } else {
      setLocation('/tahsilik/tests/subject');
    }
  }, []);

  // مؤقت العد التنازلي
  useEffect(() => {
    if (isStarted && timeLeft > 0 && !isFinished) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            finishTest();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [isStarted, timeLeft, isFinished]);

  const generateMockQuestions = (config: SubjectTestConfig) => {
    const subjectQuestions: { [key: string]: Partial<Question>[] } = {
      'math': [
        { question: 'ما هو ناتج 2 + 2؟', options: ['3', '4', '5', '6'], correctAnswer: 1, explanation: 'الناتج الصحيح هو 4' },
        { question: 'ما هو جذر العدد 16؟', options: ['2', '3', '4', '5'], correctAnswer: 2, explanation: 'جذر 16 يساوي 4' },
        { question: 'ما هو 15% من 200؟', options: ['25', '30', '35', '40'], correctAnswer: 1, explanation: '15% من 200 = 0.15 × 200 = 30' }
      ],
      'physics': [
        { question: 'ما هي وحدة قياس القوة؟', options: ['جول', 'نيوتن', 'واط', 'فولت'], correctAnswer: 1, explanation: 'النيوتن هو وحدة قياس القوة' },
        { question: 'ما هي سرعة الضوء تقريباً؟', options: ['300,000 كم/ث', '3,000,000 كم/ث', '30,000 كم/ث', '3,000 كم/ث'], correctAnswer: 0, explanation: 'سرعة الضوء حوالي 300,000 كم/ث' }
      ],
      'chemistry': [
        { question: 'ما هو رمز عنصر الذهب؟', options: ['Go', 'Au', 'Ag', 'Gd'], correctAnswer: 1, explanation: 'رمز الذهب هو Au من الكلمة اللاتينية Aurum' },
        { question: 'كم عدد البروتونات في ذرة الهيدروجين؟', options: ['0', '1', '2', '3'], correctAnswer: 1, explanation: 'ذرة الهيدروجين تحتوي على بروتون واحد فقط' }
      ],
      'biology': [
        { question: 'ما هو أصغر وحدة في الكائن الحي؟', options: ['النسيج', 'العضو', 'الخلية', 'الجهاز'], correctAnswer: 2, explanation: 'الخلية هي أصغر وحدة حية في الكائن الحي' },
        { question: 'ما هو عدد كروموسومات الإنسان؟', options: ['44', '46', '48', '50'], correctAnswer: 1, explanation: 'الإنسان لديه 46 كروموسوماً (23 زوج)' }
      ],
      'environmental': [
        { question: 'ما هو المصدر الرئيسي للطاقة المتجددة؟', options: ['النفط', 'الفحم', 'الشمس', 'الغاز الطبيعي'], correctAnswer: 2, explanation: 'الشمس هي المصدر الرئيسي للطاقة المتجددة' },
        { question: 'ما هو غاز الدفيئة الرئيسي؟', options: ['الأكسجين', 'النيتروجين', 'ثاني أكسيد الكربون', 'الهيليوم'], correctAnswer: 2, explanation: 'ثاني أكسيد الكربون هو أهم غازات الدفيئة' }
      ]
    };

    const subjectKey = config.subject.id;
    const baseQuestions = subjectQuestions[subjectKey] || subjectQuestions['math'];
    
    // إنشاء أسئلة كافية للاختبار
    const mockQuestions: Question[] = [];
    for (let i = 0; i < config.totalQuestions; i++) {
      const baseQuestion = baseQuestions[i % baseQuestions.length];
      mockQuestions.push({
        id: i + 1,
        question: baseQuestion.question || `سؤال ${i + 1} في ${config.subject.name}`,
        options: baseQuestion.options || ['الخيار الأول', 'الخيار الثاني', 'الخيار الثالث', 'الخيار الرابع'],
        correctAnswer: baseQuestion.correctAnswer || 0,
        category: config.subject.name,
        explanation: baseQuestion.explanation || 'تفسير الإجابة الصحيحة',
        hint: `تلميح لسؤال ${i + 1}`
      });
    }
    
    setQuestions(mockQuestions);
  };

  const startTest = () => {
    setIsStarted(true);
    toast({
      title: "بدء الاختبار",
      description: `${testConfig?.subject.name} - ${testConfig?.totalQuestions} سؤال في ${testConfig?.timeLimit} دقيقة`,
    });
  };

  const handleAnswerSelect = (answerIndex: number) => {
    setSelectedAnswer(answerIndex);
  };

  const handleNextQuestion = () => {
    if (selectedAnswer !== null) {
      setAnswers(prev => ({
        ...prev,
        [currentQuestionIndex]: selectedAnswer
      }));
    }

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(answers[currentQuestionIndex + 1] || null);
    } else {
      finishTest();
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      setSelectedAnswer(answers[currentQuestionIndex - 1] || null);
    }
  };

  const finishTest = () => {
    // إنهاء الاختبار حتى لو لم يجب على السؤال الحالي
    if (selectedAnswer !== null) {
      setAnswers(prev => ({
        ...prev,
        [currentQuestionIndex]: selectedAnswer
      }));
    }

    let correctAnswers = 0;
    questions.forEach((question, index) => {
      if (answers[index] === question.correctAnswer) {
        correctAnswers++;
      }
    });

    const percentage = (correctAnswers / questions.length) * 100;
    const testResults = {
      subject: testConfig?.subject.name,
      totalQuestions: questions.length,
      correctAnswers,
      percentage: Math.round(percentage * 100) / 100,
      timeUsed: (testConfig!.timeLimit * 60) - timeLeft,
      grade: getGrade(percentage)
    };

    setResults(testResults);

    // Build wrong questions for AI review
    const wrongs: WrongQuestion[] = [];
    questions.forEach((question, index) => {
      const studentAnswer = answers[index];
      if (studentAnswer === undefined || studentAnswer !== question.correctAnswer) {
        wrongs.push({
          questionText: question.question,
          options: question.options,
          studentAnswerIndex: studentAnswer ?? null,
          correctAnswerIndex: question.correctAnswer,
          category: 'تحصيلي',
          subcategory: testConfig?.subject?.name,
        });
      }
    });
    setWrongQuestionsForAI(wrongs);
    setShowAiReview(true);

    // حفظ النتائج في localStorage
    try {
      const savedResults = localStorage.getItem('subjectTestResults') || '[]';
      const resultsArray = JSON.parse(savedResults);
      resultsArray.push({ ...testResults, date: new Date().toISOString() });
      localStorage.setItem('subjectTestResults', JSON.stringify(resultsArray));
    } catch (error) {
      console.error('Error saving results:', error);
    }

    toast({
      title: "تم إنهاء الاختبار!",
      description: `درجتك: ${Math.round(percentage)}% (${correctAnswers}/${questions.length})`,
    });
  };

  const getGrade = (percentage: number): string => {
    if (percentage >= 90) return 'ممتاز';
    if (percentage >= 80) return 'جيد جداً';
    if (percentage >= 70) return 'جيد';
    if (percentage >= 60) return 'مقبول';
    return 'ضعيف';
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const resetTest = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setAnswers({});
    setTimeLeft(testConfig!.timeLimit * 60);
    setIsStarted(false);
    setIsFinished(false);
    setResults(null);
  };

  const getSubjectIcon = (subjectId: string) => {
    switch (subjectId) {
      case 'math': return Calculator;
      case 'physics': return Atom;
      case 'chemistry': return FlaskConical;
      case 'biology': return Dna;
      case 'environmental': return Globe;
      default: return Brain;
    }
  };

  if (!testConfig) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-slate-600 dark:text-slate-300">جاري تحميل الاختبار...</p>
        </div>
      </div>
    );
  }

  // شاشة البداية
  if (!isStarted) {
    const SubjectIcon = getSubjectIcon(testConfig.subject.id);
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-100 dark:from-slate-900 dark:to-slate-800 py-8">
        <div className="container mx-auto px-4 max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <Card className={`bg-gradient-to-br ${testConfig.subject.color} text-white border-0 shadow-2xl mb-8`}>
              <CardContent className="py-12">
                <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <SubjectIcon className="w-10 h-10 text-white" />
                </div>
                <h1 className="text-3xl font-bold mb-4">{testConfig.subject.title}</h1>
                <div className="flex justify-center gap-4 text-lg">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    {testConfig.timeLimit} دقيقة
                  </div>
                  <div className="flex items-center gap-2">
                    <Brain className="w-5 h-5" />
                    {testConfig.totalQuestions} سؤال
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Button
                data-testid="button-start-test"
                onClick={startTest}
                size="lg"
                className={`bg-gradient-to-r ${testConfig.subject.color} hover:opacity-90 text-white shadow-lg hover:shadow-xl px-8 py-4 font-semibold text-lg`}
              >
                <CheckCircle className="w-6 h-6 mr-3" />
                بدء الاختبار
                <ArrowRight className="w-5 h-5 ml-3" />
              </Button>
              
              <Button
                variant="outline"
                onClick={() => setLocation('/tahsilik/tests/subject')}
                className="border-2"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                العودة لاختيار المادة
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // AI Review Screen
  if (showAiReview) {
    return (
      <AiReviewingScreen
        wrongQuestions={wrongQuestionsForAI}
        totalQuestions={questions.length}
        score={results?.correctAnswers ?? 0}
        userEmail={user?.email}
        onShowResults={(explanations) => {
          setAiExplanations(explanations || []);
          setShowAiReview(false);
          setIsFinished(true);
        }}
      />
    );
  }

  // شاشة النتائج
  if (isFinished && results) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-100 dark:from-slate-900 dark:to-slate-800 py-8">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <div className="mb-8">
              <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
              <h1 className="text-4xl font-bold text-slate-800 dark:text-slate-100 mb-2">
                نتائج الاختبار
              </h1>
              <p className="text-slate-600 dark:text-slate-300">{results.subject}</p>
            </div>

            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur shadow-2xl border-0 mb-8">
              <CardContent className="p-8">
                <div className={`w-32 h-32 mx-auto mb-6 rounded-full flex items-center justify-center text-4xl font-bold text-white ${
                  results.percentage >= 80 ? 'bg-gradient-to-br from-green-400 to-green-600' :
                  results.percentage >= 60 ? 'bg-gradient-to-br from-blue-400 to-blue-600' :
                  'bg-gradient-to-br from-amber-400 to-amber-600'
                }`}>
                  {Math.round(results.percentage)}%
                </div>
                
                <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-4">
                  {results.grade}
                </h2>
                
                <div className="grid grid-cols-2 gap-6 text-center">
                  <div>
                    <p className="text-2xl font-bold text-green-600">{results.correctAnswers}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">إجابة صحيحة</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-600">{results.totalQuestions - results.correctAnswers}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">إجابة خاطئة</p>
                  </div>
                </div>
                
                <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    الوقت المستغرق: {Math.floor(results.timeUsed / 60)} دقيقة و {results.timeUsed % 60} ثانية
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-4 justify-center">
              <Button
                onClick={resetTest}
                className="bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-600 text-white"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                إعادة الاختبار
              </Button>
              
              <Button
                variant="outline"
                onClick={() => setLocation('/tahsilik/tests/subject')}
              >
                اختبار مادة أخرى
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // شاشة الاختبار
  const currentQuestion = questions[currentQuestionIndex];
  
  return (
    <QiyasExamLayout
      examTitle={testConfig.subject.name}
      questionNumber={currentQuestionIndex + 1}
      totalQuestions={questions.length}
      timeLeft={timeLeft}
      isTimeUrgent={timeLeft < 300}
      questionText={currentQuestion?.question || ""}
      options={currentQuestion?.options || []}
      selectedAnswer={answers[currentQuestionIndex] ?? selectedAnswer ?? null}
      onSelectAnswer={handleAnswerSelect}
      onNext={handleNextQuestion}
      onPrev={handlePreviousQuestion}
      onFinish={finishTest}
      canGoPrev={currentQuestionIndex > 0}
      canGoNext={true}
      isLastQuestion={currentQuestionIndex === questions.length - 1}
      userName={user?.username || user?.name}
      userId={user?.id?.toString()}
      questionsStatus={questions.map((_, i) => ({
        answered: answers[i] !== undefined,
        bookmarked: bookmarkedQuestions.has(i)
      }))}
      currentQuestionIndex={currentQuestionIndex}
      onJumpToQuestion={setCurrentQuestionIndex}
      answeredCount={Object.keys(answers).length}
      isBookmarked={bookmarkedQuestions.has(currentQuestionIndex)}
      onToggleBookmark={() => setBookmarkedQuestions(prev => {
        const next = new Set(prev);
        if (next.has(currentQuestionIndex)) next.delete(currentQuestionIndex); else next.add(currentQuestionIndex);
        return next;
      })}
    />
  );
};

export default TahsilikSubjectTestRunner;