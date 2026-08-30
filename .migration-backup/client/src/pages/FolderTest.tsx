
import { useState, useEffect } from "react";
import AiReviewingScreen, { WrongQuestion, QuestionExplanation } from '@/components/AiReviewingScreen';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import EndTestButton from "@/components/ui/EndTestButton";
import { 
  CheckCircle,
  XCircle,
  ArrowRight,
  ArrowLeft,
  Home,
  Award,
  Clock,
  Pause,
  Play,
  AlertCircle
} from "lucide-react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { QiyasExamLayout } from '@/components/QiyasExamLayout';
import { useQuery } from "@tanstack/react-query";

interface Question {
  id: number;
  text: string;
  options: string[];
  correctOptionIndex: number;
  category: string;
  subcategory?: string;
  explanation?: string;
  imageUrl?: string;
}

interface TestSection {
  sectionNumber: number;
  name: string;
  questionCount: number;
  timeLimit: number;
  questions: Question[];
  completed: boolean;
}

export default function FolderTest() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { data: user } = useQuery<any>({ queryKey: ['/api/user'] });
  const [questions, setQuestions] = useState<Question[]>([]);
  const [testSections, setTestSections] = useState<TestSection[]>([]);
  const [currentSection, setCurrentSection] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: number }>({});
  const [bookmarkedQuestions, setBookmarkedQuestions] = useState<Set<number>>(new Set());
  const [showResults, setShowResults] = useState(false);
  const [showAiReview, setShowAiReview] = useState(false);
  const [wrongQuestionsForAI, setWrongQuestionsForAI] = useState<WrongQuestion[]>([]);
  const [aiExplanations, setAiExplanations] = useState<QuestionExplanation[]>([]);
  const [startTime] = useState(Date.now());
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isPrayerBreak, setIsPrayerBreak] = useState(false);
  const [prayerBreakTimeLeft, setPrayerBreakTimeLeft] = useState(10 * 60); // 10 minutes
  const [sectionTimeRemaining, setSectionTimeRemaining] = useState(0);
  const [testStarted, setTestStarted] = useState(false);

  useEffect(() => {
    // Load questions from localStorage
    const savedQuestions = localStorage.getItem('folder_test_questions');
    if (savedQuestions) {
      try {
        const parsedQuestions = JSON.parse(savedQuestions);
        setQuestions(parsedQuestions);
        
        // تقسيم الأسئلة إلى أقسام (كل 10 أسئلة = قسم واحد)
        const sectionsCount = Math.ceil(parsedQuestions.length / 10);
        const sections: TestSection[] = [];
        
        for (let i = 0; i < sectionsCount; i++) {
          const startIndex = i * 10;
          const endIndex = Math.min(startIndex + 10, parsedQuestions.length);
          const sectionQuestions = parsedQuestions.slice(startIndex, endIndex);
          
          sections.push({
            sectionNumber: i + 1,
            name: `القسم ${i + 1}`,
            questionCount: sectionQuestions.length,
            timeLimit: sectionQuestions.length, // دقيقة واحدة لكل سؤال
            questions: sectionQuestions,
            completed: false
          });
        }
        
        setTestSections(sections);
        if (sections.length > 0) {
          setSectionTimeRemaining(sections[0].timeLimit * 60); // تحويل لثواني
        }
      } catch (error) {
        console.error('Error loading questions:', error);
        toast({
          title: "❌ خطأ",
          description: "فشل تحميل الأسئلة",
          variant: "destructive",
        });
        navigate('/test-me');
      }
    } else {
      navigate('/test-me');
    }
  }, [navigate, toast]);

  // Timer effect for section time
  useEffect(() => {
    if (testStarted && !isPrayerBreak && !showResults && sectionTimeRemaining > 0) {
      const timer = setInterval(() => {
        setSectionTimeRemaining(prev => {
          if (prev <= 1) {
            // انتقل للقسم التالي تلقائياً
            moveToNextSection();
            return 0;
          }
          return prev - 1;
        });
        
        setTimeElapsed(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [testStarted, isPrayerBreak, showResults, sectionTimeRemaining, startTime]);

  // Prayer break timer
  useEffect(() => {
    let prayerTimerId: NodeJS.Timeout;
    if (isPrayerBreak && prayerBreakTimeLeft > 0) {
      prayerTimerId = setTimeout(() => {
        setPrayerBreakTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (isPrayerBreak && prayerBreakTimeLeft === 0) {
      setIsPrayerBreak(false);
      setPrayerBreakTimeLeft(10 * 60);
    }
    return () => clearTimeout(prayerTimerId);
  }, [isPrayerBreak, prayerBreakTimeLeft]);

  const moveToNextSection = () => {
    if (currentSection < testSections.length - 1) {
      setCurrentSection(prev => prev + 1);
      setCurrentQuestionIndex(0);
      setSectionTimeRemaining(testSections[currentSection + 1].timeLimit * 60);
      
      toast({
        title: "✅ انتهى القسم",
        description: `انتقلت إلى ${testSections[currentSection + 1].name}`,
      });
    } else {
      handleFinish();
    }
  };

  const handleAnswerSelect = (answerIndex: number) => {
    const currentQuestion = testSections[currentSection]?.questions[currentQuestionIndex];
    if (currentQuestion) {
      setSelectedAnswers(prev => ({
        ...prev,
        [currentQuestion.id]: answerIndex
      }));
    }
  };

  const handleNext = () => {
    const currentSectionQuestions = testSections[currentSection]?.questions || [];
    if (currentQuestionIndex < currentSectionQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      moveToNextSection();
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    } else if (currentSection > 0) {
      setCurrentSection(prev => prev - 1);
      const prevSection = testSections[currentSection - 1];
      setCurrentQuestionIndex(prevSection.questions.length - 1);
    }
  };

  const handleFinish = () => {
    // Build wrong questions for AI review
    const wrongs: WrongQuestion[] = [];
    questions.forEach((question) => {
      const studentAnswer = selectedAnswers[question.id];
      if (studentAnswer === undefined || studentAnswer !== question.correctOptionIndex) {
        wrongs.push({
          questionText: question.text,
          options: question.options,
          studentAnswerIndex: studentAnswer ?? null,
          correctAnswerIndex: question.correctOptionIndex,
          category: question.category,
          subcategory: question.subcategory,
        });
      }
    });
    setWrongQuestionsForAI(wrongs);

    // حفظ النتيجة
    const results = calculateResults();
    const testResult = {
      testName: 'اختبار من المجلدات',
      subcategory: 'مجلداتي',
      totalQuestions: questions.length,
      correctAnswers: results.correct,
      percentage: Math.round((results.correct / questions.length) * 100),
      timeSpent: timeElapsed,
      date: new Date().toISOString(),
      answers: selectedAnswers,
      questions: questions
    };
    
    localStorage.setItem('lastTestResult', JSON.stringify(testResult));
    setShowAiReview(true);
  };

  const handleEndTest = () => {
    if (confirm('هل أنت متأكد من إنهاء الاختبار؟ سيتم فقدان جميع إجاباتك!')) {
      navigate('/folders');
    }
  };

  const handlePrayerBreak = () => {
    setIsPrayerBreak(true);
    toast({
      title: "🕌 استراحة للصلاة",
      description: "لديك 10 دقائق للصلاة",
    });
  };

  const calculateResults = () => {
    let correct = 0;
    let wrong = 0;
    let unanswered = 0;

    questions.forEach((question) => {
      const userAnswer = selectedAnswers[question.id];
      if (userAnswer === undefined) {
        unanswered++;
      } else if (userAnswer === question.correctOptionIndex) {
        correct++;
      } else {
        wrong++;
      }
    });

    return { correct, wrong, unanswered };
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeColor = (seconds: number) => {
    const minutes = seconds / 60;
    if (minutes <= 1) return 'text-red-600';
    if (minutes <= 2) return 'text-orange-600';
    return 'text-green-600';
  };

  if (!testStarted && testSections.length > 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-600 to-blue-50 dark:from-gray-900 dark:to-teal-500 flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full">
          <CardHeader>
            <CardTitle className="text-center text-2xl">🎯 اختبار من المجلدات</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-2">
              <p className="text-lg">إجمالي الأسئلة: <strong>{questions.length}</strong></p>
              <p className="text-lg">عدد الأقسام: <strong>{testSections.length}</strong></p>
              <p className="text-gray-600 dark:text-gray-400">
                كل قسم يحتوي على {testSections[0]?.questionCount} أسئلة تقريباً
              </p>
            </div>
            
            <div className="grid gap-3">
              {testSections.map((section, idx) => (
                <div key={idx} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">{section.name}</span>
                    <div className="flex gap-3 text-sm">
                      <span className="flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {section.questionCount} سؤال
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {section.timeLimit} دقيقة
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Button 
              onClick={() => setTestStarted(true)}
              className="w-full bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-600 hover:to-blue-700 text-lg py-6"
            >
              ابدأ الاختبار
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (questions.length === 0 || testSections.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin h-12 w-12 border-4 border-teal-400 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const currentQuestion = testSections[currentSection]?.questions[currentQuestionIndex];
  const results = calculateResults();
  const percentage = Math.round((results.correct / questions.length) * 100);
  const totalProgress = ((currentSection * 10 + currentQuestionIndex + 1) / questions.length) * 100;

  // Prayer break screen
  if (isPrayerBreak) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-900 dark:to-green-950 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <Card className="max-w-md">
            <CardContent className="pt-6">
              <div className="mb-6 text-6xl">🕌</div>
              <h2 className="text-2xl font-bold mb-4">استراحة للصلاة</h2>
              <div className="text-5xl font-bold text-green-600 mb-6">
                {formatTime(prayerBreakTimeLeft)}
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                خذ وقتك للصلاة، سيستأنف الاختبار تلقائياً
              </p>
              <Button 
                onClick={() => {
                  setIsPrayerBreak(false);
                  setPrayerBreakTimeLeft(10 * 60);
                }}
                className="w-full"
              >
                <Play className="h-5 w-5 ml-2" />
                العودة للاختبار
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  if (showAiReview) {
    const userStr = localStorage.getItem('user');
    const userEmail = userStr ? JSON.parse(userStr)?.email : undefined;
    const totalQ = questions.length;
    const correctQ = questions.filter(q => selectedAnswers[q.id] === q.correctOptionIndex).length;
    return (
      <AiReviewingScreen
        wrongQuestions={wrongQuestionsForAI}
        totalQuestions={totalQ}
        score={correctQ}
        userEmail={userEmail}
        onShowResults={(explanations) => {
          if (explanations) setAiExplanations(explanations);
          setShowAiReview(false);
          setShowResults(true);
        }}
      />
    );
  }

  if (showResults) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-600 to-blue-50 dark:from-gray-900 dark:to-teal-500 p-4">
        <div className="container mx-auto max-w-4xl py-8">
          <Card className="mb-6 bg-gradient-to-br from-teal-600 to-blue-600 text-white border-0">
            <CardContent className="pt-6">
              <div className="text-center">
                <Award className="h-16 w-16 mx-auto mb-4" />
                <h2 className="text-3xl font-bold mb-2">أحسنت!</h2>
                <p className="text-lg opacity-90">لقد أكملت الاختبار</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <div className="bg-white/10 rounded-lg p-4 text-center">
                  <p className="text-sm opacity-90">الأسئلة</p>
                  <p className="text-2xl font-bold">{questions.length}</p>
                </div>
                <div className="bg-white/10 rounded-lg p-4 text-center">
                  <p className="text-sm opacity-90">صحيحة</p>
                  <p className="text-2xl font-bold text-green-300">{results.correct}</p>
                </div>
                <div className="bg-white/10 rounded-lg p-4 text-center">
                  <p className="text-sm opacity-90">خاطئة</p>
                  <p className="text-2xl font-bold text-red-300">{results.wrong}</p>
                </div>
                <div className="bg-white/10 rounded-lg p-4 text-center">
                  <p className="text-sm opacity-90">النسبة</p>
                  <p className="text-2xl font-bold">{percentage}%</p>
                </div>
              </div>
              <div className="mt-6 bg-white/10 rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  <span>الوقت المستغرق</span>
                </div>
                <span className="font-bold text-lg">{formatTime(timeElapsed)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>مراجعة الإجابات</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {questions.map((question, index) => {
                const userAnswer = selectedAnswers[question.id];
                const isCorrect = userAnswer === question.correctOptionIndex;
                const isUnanswered = userAnswer === undefined;

                return (
                  <div key={question.id} className="border rounded-lg p-4">
                    <div className="flex items-start gap-3 mb-3">
                      {isUnanswered ? (
                        <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full">
                          <XCircle className="h-5 w-5 text-gray-400" />
                        </div>
                      ) : isCorrect ? (
                        <div className="p-2 bg-green-100 dark:bg-green-900 rounded-full">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        </div>
                      ) : (
                        <div className="p-2 bg-red-100 dark:bg-red-900 rounded-full">
                          <XCircle className="h-5 w-5 text-red-600" />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">سؤال {index + 1}</Badge>
                          {question.subcategory && (
                            <Badge variant="secondary">{question.subcategory}</Badge>
                          )}
                        </div>
                        <p className="text-gray-900 dark:text-white font-medium mb-3">
                          {question.text}
                        </p>
                        <div className="space-y-2">
                          {question.options.map((option, optIndex) => {
                            const isUserAnswer = userAnswer === optIndex;
                            const isCorrectOption = optIndex === question.correctOptionIndex;
                            
                            let optionClass = "p-3 rounded-lg border ";
                            if (isCorrectOption) {
                              optionClass += "border-green-500 bg-green-50 dark:bg-green-950";
                            } else if (isUserAnswer && !isCorrect) {
                              optionClass += "border-red-500 bg-red-50 dark:bg-red-950";
                            } else {
                              optionClass += "border-gray-200 dark:border-gray-700";
                            }

                            return (
                              <div key={optIndex} className={optionClass}>
                                <div className="flex items-center justify-between">
                                  <span>{option}</span>
                                  {isCorrectOption && (
                                    <Badge className="bg-green-600">الإجابة الصحيحة</Badge>
                                  )}
                                  {isUserAnswer && !isCorrect && (
                                    <Badge variant="destructive">إجابتك</Badge>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        {question.explanation && !isCorrect && (
                          <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                            <p className="text-sm text-blue-900 dark:text-blue-100">
                              <strong>الشرح:</strong> {question.explanation}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {aiExplanations.length > 0 && wrongQuestionsForAI.length > 0 && (
            <Card className="mt-6 border-2 border-teal-400 dark:border-teal-400 shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-green-500 to-teal-500 p-5 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-xl">🤖</div>
                <div>
                  <h3 className="text-white font-bold text-lg">شروحات الذكاء الاصطناعي لأخطائك</h3>
                  <p className="text-teal-700 text-sm">شرح مخصص لك بناءً على مستواك ونمط أخطائك</p>
                </div>
              </div>
              <CardContent className="p-0 divide-y divide-gray-100 dark:divide-gray-700">
                {aiExplanations.map((exp, i) => {
                  const wq = wrongQuestionsForAI[exp.questionIndex];
                  if (!wq) return null;
                  return (
                    <div key={i} className="p-5 bg-white dark:bg-gray-800 hover:bg-teal-100 dark:hover:bg-teal-100/20 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="w-7 h-7 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center text-red-600 font-bold text-sm flex-shrink-0 mt-0.5">{i + 1}</div>
                        <div className="flex-1 min-w-0 space-y-2">
                          <p className="text-gray-800 dark:text-gray-200 font-medium text-sm leading-relaxed">{wq.questionText}</p>
                          <div className="flex flex-wrap gap-2 text-xs">
                            <span className="px-2 py-1 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 rounded-full">
                              ✗ إجابتك: {wq.studentAnswerIndex !== null ? (wq.options[wq.studentAnswerIndex] ?? 'لم تُجب') : 'لم تُجب'}
                            </span>
                            <span className="px-2 py-1 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 rounded-full">
                              ✓ الصحيح: {wq.options[wq.correctAnswerIndex]}
                            </span>
                            {exp.conceptError && (
                              <span className="px-2 py-1 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 rounded-full">
                                📌 {exp.conceptError}
                              </span>
                            )}
                          </div>
                          <div className="bg-teal-100 dark:bg-teal-100/20 border border-teal-400 dark:border-teal-400 rounded-xl p-3 space-y-1.5">
                            <p className="text-teal-700 dark:text-teal-700 text-sm leading-relaxed">{exp.explanation}</p>
                            {exp.tip && (
                              <p className="text-teal-700 dark:text-teal-700 text-xs font-medium">💡 {exp.tip}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          <div className="mt-6 flex gap-3">
            <Button
              onClick={() => navigate('/test-me')}
              className="flex-1 bg-teal-100 hover:bg-teal-100"
            >
              اختبار جديد
            </Button>
            <Button
              onClick={() => navigate('/folders')}
              variant="outline"
              className="flex-1"
            >
              المجلدات
            </Button>
            <Button
              onClick={() => navigate('/')}
              variant="outline"
            >
              <Home className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <QiyasExamLayout
      examTitle="اختبار المجلدات"
      questionNumber={currentQuestionIndex + 1}
      totalQuestions={testSections[currentSection]?.questions.length || 0}
      sectionLabel={testSections[currentSection]?.name}
      sectionNumber={currentSection + 1}
      totalSections={testSections.length}
      timeLeft={sectionTimeRemaining}
      isTimeUrgent={sectionTimeRemaining < 60}
      questionText={currentQuestion?.text || ""}
      questionImageUrl={currentQuestion?.imageUrl}
      options={currentQuestion?.options || []}
      selectedAnswer={currentQuestion ? (selectedAnswers[currentQuestion.id] ?? null) : null}
      onSelectAnswer={handleAnswerSelect}
      onNext={handleNext}
      onPrev={handlePrevious}
      onFinish={handleFinish}
      canGoPrev={currentQuestionIndex > 0 || currentSection > 0}
      canGoNext={true}
      isLastQuestion={currentSection === testSections.length - 1 && currentQuestionIndex === (testSections[currentSection]?.questions.length - 1)}
      questionsStatus={testSections[currentSection]?.questions.map((q) => ({
        answered: selectedAnswers[q.id] !== undefined,
        bookmarked: bookmarkedQuestions.has(q.id)
      })) || []}
      currentQuestionIndex={currentQuestionIndex}
      onJumpToQuestion={(index) => setCurrentQuestionIndex(index)}
      answeredCount={Object.keys(selectedAnswers).length}
      isBookmarked={currentQuestion ? bookmarkedQuestions.has(currentQuestion.id) : false}
      onToggleBookmark={() => {
        const qId = currentQuestion?.id;
        if (!qId) return;
        setBookmarkedQuestions(prev => {
          const next = new Set(prev);
          if (next.has(qId)) next.delete(qId); else next.add(qId);
          return next;
        });
      }}
      userName={user?.username || user?.name}
      userId={user?.id?.toString()}
      userAvatar={user?.avatarUrl}
      topRightSlot={
        <div className="flex items-center gap-2">
          <Button
            onClick={handlePrayerBreak}
            variant="outline"
            size="icon"
            className="bg-green-50 hover:bg-green-100 border-green-300"
            title="استراحة للصلاة"
          >
            <Pause className="h-5 w-5 text-green-600" />
          </Button>
          <EndTestButton
            onEndTest={handleEndTest}
            variant="floating"
            testName="اختبار المجلدات"
            showProgress={true}
            questionsAnswered={Object.keys(selectedAnswers).length}
            totalQuestions={questions.length}
          />
        </div>
      }
    />
  );
}
