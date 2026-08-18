import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { autoSaveMistakesToFolder } from "@/lib/autoSaveMistakes";
import AiReviewingScreen, { WrongQuestion, QuestionExplanation } from '@/components/AiReviewingScreen';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { EndTestButton } from '@/components/ui/EndTestButton';
import { EnhancedSaveToFolderDialog } from '@/components/EnhancedSaveToFolderDialog';
import { QiyasExamLayout } from '@/components/QiyasExamLayout';
import {
  Calculator,
  Clock,
  Target,
  Award,
  PlayCircle,
  PauseCircle,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Timer,
  TrendingUp,
  Star,
  Trophy,
  Zap,
  BarChart3,
  PieChart,
  Sigma,
  Square,
  BookOpen,
  Moon,
  Clock3,
  FolderPlus,
  XCircle,
  AlertCircle,
  Home,
  RefreshCw,
  Pause
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface TestQuestion {
  id: number;
  text: string;
  options: string[];
  correctOptionIndex: number;
  category: string;
  subcategory: string;
  explanation?: string;
}

interface TestSection {
  sectionNumber: number;
  name: string;
  questionCount: number;
  timeLimit: number;
  questions: TestQuestion[];
  completed: boolean;
  score?: number;
  timeSpent?: number;
}

interface TestResults {
  sectionResults: {
    sectionNumber: number;
    score: number;
    timeSpent: number;
    percentage: number;
  }[];
  totalScore: number;
  totalTime: number;
  overallPercentage: number;
  subcategoryBreakdown: {
    [key: string]: {
      correct: number;
      total: number;
      percentage: number;
    };
  };
}

export function AdvancedQuantitativeTest() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [currentSection, setCurrentSection] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{[key: string]: number}>({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [sectionTimeRemaining, setSectionTimeRemaining] = useState(0);
  const [isPrayerBreak, setIsPrayerBreak] = useState(false);
  const [hasPrayerBreakBeenUsed, setHasPrayerBreakBeenUsed] = useState(false);
  const [prayerBreakTimeLeft, setPrayerBreakTimeLeft] = useState(600); // 10 minutes in seconds
  const [testStarted, setTestStarted] = useState(false);
  const [testCompleted, setTestCompleted] = useState(false);
  const [testSections, setTestSections] = useState<TestSection[]>([]);
  const [showSectionTransition, setShowSectionTransition] = useState(false);
  const [testResults, setTestResults] = useState<TestResults | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [showAiReview, setShowAiReview] = useState(false);
  const [aiExplanations, setAiExplanations] = useState<QuestionExplanation[]>([]);
  const [wrongQuestionsForAI, setWrongQuestionsForAI] = useState<WrongQuestion[]>([]);

  // Save to folder states
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveMode, setSaveMode] = useState<"all" | "wrong" | "unanswered">("all");
  const [questionsToSave, setQuestionsToSave] = useState<number[]>([]);

  // Fetch all questions
  const { data: allQuestions = [], isLoading } = useQuery<TestQuestion[]>({
    queryKey: ['/api/questions'],
  });

  // User data for premium check
  const { data: user } = useQuery({
    queryKey: ['/api/user'],
  });

  const isPremiumUser = user && (
    (user as any)?.subscription?.type === 'Pro' || 
    (user as any)?.subscription?.type === 'Pro Life' || 
    (user as any)?.subscription?.type === 'Pro Life Plus' ||
    (user as any)?.subscription?.type === 'Pro Live' ||
    (user as any)?.subscription === 'pro' ||
    (user as any)?.subscription === 'pro_life' ||
    (user as any)?.subscription === 'pro_life_plus'
  );

  // Check daily limits
  const [dailyTestsTaken, setDailyTestsTaken] = useState(0);
  const MAX_DAILY_FREE_TESTS = 1; // One test every 2 days

  useEffect(() => {
    const today = new Date().toDateString();
    const testsToday = JSON.parse(localStorage.getItem(`dailyAdvancedQuantitativeTests_${today}`) || '0');
    setDailyTestsTaken(testsToday);
  }, []);

  const canTakeTest = !!isPremiumUser || dailyTestsTaken === 0;

  // Initialize test sections
  useEffect(() => {
    if (allQuestions.length > 0 && testSections.length === 0) {
      // Get current test configuration from localStorage
      const currentTest = localStorage.getItem('currentTest');
      let targetSubcategory = 'شامل - 5 أقسام'; // default to comprehensive
      
      if (currentTest) {
        const testConfig = JSON.parse(currentTest);
        targetSubcategory = testConfig.subcategory;
      }
      
      let quantitativeQuestions;
      
      if (targetSubcategory === 'شامل - 5 أقسام') {
        // For comprehensive test, use all quantitative questions
        quantitativeQuestions = allQuestions.filter(q => q.category === 'quantitative');
      } else {
        // For specific subcategory tests, filter by exact subcategory
        const specificSubcategory = targetSubcategory.replace(' - 5 أقسام', '');
        quantitativeQuestions = allQuestions.filter(q => 
          q.category === 'quantitative' && q.subcategory === specificSubcategory
        );
      }
      
      if (quantitativeQuestions.length >= 55) {
        // Shuffle questions for randomness
        const shuffled = [...quantitativeQuestions].sort(() => Math.random() - 0.5);
        const selectedQuestions = shuffled.slice(0, 55);

        // Create 5 sections with 11 questions each
        const sections: TestSection[] = [];
        for (let i = 0; i < 5; i++) {
          const startIndex = i * 11;
          const endIndex = startIndex + 11;
          sections.push({
            sectionNumber: i + 1,
            name: `القسم ${i + 1} - ${targetSubcategory.replace(' - 5 أقسام', '')}`,
            questionCount: 11,
            timeLimit: 11, // 11 minutes per section
            questions: selectedQuestions.slice(startIndex, endIndex),
            completed: false
          });
        }
        
        setTestSections(sections);
        setTimeRemaining(55 * 60); // 55 minutes total
        setSectionTimeRemaining(11 * 60); // 11 minutes for first section
      }
    }
  }, [allQuestions, testSections.length]);

  // Timer logic
  useEffect(() => {
    if (testStarted && !isPrayerBreak && !testCompleted && timeRemaining > 0 && sectionTimeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            completeTest();
            return 0;
          }
          return prev - 1;
        });
        
        setSectionTimeRemaining(prev => {
          if (prev <= 1) {
            moveToNextSection();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [testStarted, isPrayerBreak, testCompleted, timeRemaining, sectionTimeRemaining]);

  // Prayer break timer effect
  useEffect(() => {
    let prayerTimerId: NodeJS.Timeout;
    if (isPrayerBreak && prayerBreakTimeLeft > 0) {
      prayerTimerId = setTimeout(() => {
        setPrayerBreakTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (isPrayerBreak && prayerBreakTimeLeft === 0) {
      // Auto-resume when prayer break time expires
      setIsPrayerBreak(false);
    }
    return () => clearTimeout(prayerTimerId);
  }, [isPrayerBreak, prayerBreakTimeLeft]);

  const startTest = () => {
    if (!canTakeTest) {
      alert('لقد وصلت للحد الأقصى اليومي من الاختبارات');
      return;
    }
    
    setTestStarted(true);
    
    // Record test for free users
    if (!isPremiumUser) {
      const today = new Date().toDateString();
      localStorage.setItem(`dailyAdvancedQuantitativeTests_${today}`, '1');
      setDailyTestsTaken(1);
    }
  };

  const moveToNextSection = () => {
    if (currentSection < testSections.length - 1) {
      // Mark current section as completed
      const updatedSections = [...testSections];
      updatedSections[currentSection].completed = true;
      updatedSections[currentSection].timeSpent = (11 * 60) - sectionTimeRemaining;
      setTestSections(updatedSections);
      
      setShowSectionTransition(true);
      
      setTimeout(() => {
        setCurrentSection(prev => prev + 1);
        setCurrentQuestionIndex(0);
        setSectionTimeRemaining(11 * 60);
        setShowSectionTransition(false);
      }, 3000);
    } else {
      completeTest();
    }
  };

  const completeTest = () => {
    setTestCompleted(true);
    calculateResults();
  };

  const renderPrayerBreakOverlay = () => {
    if (!isPrayerBreak) return null;
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-lg z-[100] flex items-center justify-center p-4 font-arabic animate-fadeIn">
        <div className="bg-white dark:bg-gray-950 p-8 rounded-2xl max-w-lg w-full mx-auto text-center space-y-8 relative overflow-hidden shadow-2xl border border-orange-300 dark:border-orange-700">
          {/* Creative Background Elements */}
          <div className="absolute -top-1/4 -right-1/4 w-80 h-80 bg-orange-400/15 dark:bg-orange-500/10 rounded-full filter blur-3xl animate-pulse-slow"></div>
          <div className="absolute -bottom-1/4 -left-1/4 w-80 h-80 bg-teal-400/15 dark:bg-teal-500/10 rounded-full filter blur-3xl animate-pulse-slow animation-delay-2000"></div>
          <div className="absolute top-10 left-10 w-10 h-10 bg-yellow-300/20 dark:bg-yellow-400/10 rounded-full animate-ping opacity-50"></div>
          <div className="absolute bottom-10 right-10 w-12 h-12 bg-white/20 dark:bg-white/10 rounded-full animate-bounce delay-1000"></div>

          <div className="relative z-10">
             {/* Enhanced Icon */}
            <div className="w-32 h-32 bg-gradient-to-br from-orange-100 via-orange-200 to-yellow-200 dark:from-gray-800 dark:via-gray-800/70 dark:to-gray-900 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg transform transition-transform hover:scale-110 duration-300 ring-4 ring-orange-500/30 dark:ring-orange-400/20">
                <Moon className="h-20 w-20 text-orange-500 dark:text-orange-400 animate-pulse-slow" />
            </div>
             {/* Enhanced Text */}
            <h3 className="text-4xl font-extrabold mb-4 bg-gradient-to-r from-orange-500 to-yellow-400 dark:from-orange-400 dark:to-yellow-300 text-transparent bg-clip-text drop-shadow-sm">
              استراحة للصلاة
            </h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-xl">
              تقبّل الله طاعتكم <Star className="inline h-5 w-5 text-yellow-400 animate-spin-slow" />
            </p>
            <p className="text-gray-600 dark:text-gray-400 text-base mt-3">
              تم إيقاف الاختبار مؤقتاً. عند الانتهاء، يمكنك استئناف الاختبار.
            </p>
            <div className="text-xs text-orange-600 dark:text-orange-400 mt-4 p-2 bg-orange-50 dark:bg-orange-900/20 rounded-md text-center">
              ملاحظة: يمكن استخدام زر توقف الصلاة مرة واحدة فقط لكل اختبار (الحد الأقصى 10 دقائق)
            </div>
          </div>

          {/* Prayer break timer display */}
          <div className="text-center mb-6 relative z-10">
            <div className="inline-flex items-center gap-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl px-6 py-3 shadow-lg border border-orange-200 dark:border-orange-700">
              <Clock3 className="h-5 w-5 text-orange-500 dark:text-orange-400" />
              <span className="text-lg font-bold text-gray-800 dark:text-gray-200">
                الوقت المتبقي: {formatTime(prayerBreakTimeLeft)}
              </span>
            </div>
            <p className="text-xs text-orange-600 dark:text-orange-400 mt-2 opacity-80">
              سيتم استئناف الاختبار تلقائياً عند انتهاء الوقت
            </p>
          </div>

          <Button
            onClick={() => setIsPrayerBreak(false)}
            className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 transition-all duration-300 shadow-xl hover:shadow-orange-500/40 dark:shadow-orange-400/20 text-xl py-4 rounded-xl relative z-10 transform hover:scale-105"
          >
            استئناف الاختبار (لن يتوفر مرة أخرى)
          </Button>
           {/* Quranic Verse */}
          <div className="text-sm text-gray-500 dark:text-gray-500 mt-6 relative z-10 tracking-wide">
            "إِنَّ الصَّلَاةَ كَانَتْ عَلَى الْمُؤْمِنِينَ كِتَابًا مَوْقُوتًا" <span className="opacity-70">(النساء: 103)</span>
          </div>
        </div>
      </div>
    );
  };

  const calculateResults = async () => {
    const sectionResults = testSections.map((section, index) => {
      let correct = 0;
      section.questions.forEach(question => {
        const userAnswer = selectedAnswers[`${index}-${question.id}`];
        if (userAnswer === question.correctOptionIndex) {
          correct++;
        }
      });
      
      return {
        sectionNumber: section.sectionNumber,
        score: correct,
        timeSpent: section.timeSpent || 0,
        percentage: Math.round((correct / section.questionCount) * 100)
      };
    });

    const totalScore = sectionResults.reduce((sum, result) => sum + result.score, 0);
    const totalTime = 55 * 60 - timeRemaining;
    const overallPercentage = Math.round((totalScore / 55) * 100);

    // Calculate subcategory breakdown
    const subcategoryBreakdown: {[key: string]: {correct: number, total: number, percentage: number}} = {};
    
    testSections.forEach((section, sectionIndex) => {
      section.questions.forEach(question => {
        const subcategory = question.subcategory;
        if (!subcategoryBreakdown[subcategory]) {
          subcategoryBreakdown[subcategory] = { correct: 0, total: 0, percentage: 0 };
        }
        
        subcategoryBreakdown[subcategory].total++;
        const userAnswer = selectedAnswers[`${sectionIndex}-${question.id}`];
        if (userAnswer === question.correctOptionIndex) {
          subcategoryBreakdown[subcategory].correct++;
        }
      });
    });

    // Calculate percentages for subcategories
    Object.keys(subcategoryBreakdown).forEach(subcategory => {
      const data = subcategoryBreakdown[subcategory];
      data.percentage = Math.round((data.correct / data.total) * 100);
    });

    const results: TestResults = {
      sectionResults,
      totalScore,
      totalTime,
      overallPercentage,
      subcategoryBreakdown
    };

    setTestResults(results);

    // Extract wrong questions for AI review
    const wrongQs: WrongQuestion[] = [];
    testSections.forEach((section, si) => {
      section.questions.forEach((q) => {
        const userAns = selectedAnswers[`${si}-${q.id}`];
        if (userAns === undefined || userAns !== q.correctOptionIndex) {
          wrongQs.push({
            questionText: q.text,
            options: q.options,
            studentAnswerIndex: userAns !== undefined ? userAns : null,
            correctAnswerIndex: q.correctOptionIndex,
            category: 'كمي',
            subcategory: q.subcategory,
          });
        }
      });
    });
    setWrongQuestionsForAI(wrongQs);
    setShowAiReview(true);

    // Save results to localStorage
    const resultsHistory = JSON.parse(localStorage.getItem('advancedQuantitativeTestResults') || '[]');
    resultsHistory.push({
      ...results,
      testDate: new Date().toISOString(),
      testType: 'advanced-quantitative'
    });
    localStorage.setItem('advancedQuantitativeTestResults', JSON.stringify(resultsHistory));

    // إرسال النتيجة للسيرفر لحفظ النقاط
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        const totalQuestions = 55;
        const answeredCount = Object.keys(selectedAnswers).length;
        const skippedQuestions = totalQuestions - answeredCount;
        
        const response = await apiRequest('POST', '/api/test-results', {
          userId: user.id,
          testType: 'quantitative',
          difficulty: 'advanced',
          score: totalScore,
          totalQuestions,
          timeTaken: totalTime,
          skippedQuestions
        }) as any;

        // Auto-save wrong answers to a folder
        const wrongQIds: number[] = [];
        testSections.forEach((section: any, si: number) => {
          section.questions.forEach((q: any) => {
            const userAnswer = selectedAnswers[`${si}-${q.id}`];
            if (userAnswer === undefined || userAnswer !== q.correctOptionIndex) {
              if (q.id) wrongQIds.push(Number(q.id));
            }
          });
        });
        if (wrongQIds.length > 0) autoSaveMistakesToFolder(wrongQIds, 'اختبار كمي متقدم');

        // حفظ النقاط المكتسبة للعرض في صفحة النتائج
        if (response?.pointsEarned !== undefined) {
          localStorage.setItem('lastExamPointsEarned', response.pointsEarned.toString());
        }

        toast({
          title: "تم حفظ النقاط",
          description: "تم تسجيل نتيجتك وإضافة النقاط بنجاح",
          variant: "default"
        });
      }
    } catch (error) {
      console.error("Error saving test results:", error);
    }
  };

  // Function to get question IDs based on save mode
  const getQuestionIdsForSaveMode = (mode: "all" | "wrong" | "unanswered"): number[] => {
    const allQuestionIds: number[] = [];
    
    testSections.forEach((section, sectionIndex) => {
      section.questions.forEach((question) => {
        const userAnswer = selectedAnswers[`${sectionIndex}-${question.id}`];
        const isCorrect = userAnswer !== undefined && userAnswer === question.correctOptionIndex;
        const isAnswered = userAnswer !== undefined;

        if (mode === "all") {
          allQuestionIds.push(question.id);
        } else if (mode === "wrong" && isAnswered && !isCorrect) {
          allQuestionIds.push(question.id);
        } else if (mode === "unanswered" && !isAnswered) {
          allQuestionIds.push(question.id);
        }
      });
    });

    return allQuestionIds;
  };

  // Function to handle save to folder with mode selection
  const handleSaveToFolder = (mode: "all" | "wrong" | "unanswered") => {
    const questionIds = getQuestionIdsForSaveMode(mode);
    if (questionIds.length === 0) {
      toast({
        title: "⚠️ لا توجد أسئلة",
        description: "لا توجد أسئلة تطابق الفئة المختارة",
        variant: "destructive",
      });
      return;
    }
    setSaveMode(mode);
    setQuestionsToSave(questionIds);
    setShowSaveDialog(true);
  };

  const selectAnswer = (answerIndex: number) => {
    const currentQuestion = testSections[currentSection]?.questions[currentQuestionIndex];
    if (currentQuestion) {
      const key = `${currentSection}-${currentQuestion.id}`;
      setSelectedAnswers(prev => ({
        ...prev,
        [key]: answerIndex
      }));
    }
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < testSections[currentSection].questionCount - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else if (currentSection < testSections.length - 1) {
      moveToNextSection();
    } else {
      completeTest();
    }
  };

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeColor = (seconds: number, total: number) => {
    const percentage = (seconds / total) * 100;
    if (percentage > 50) return 'text-green-600';
    if (percentage > 20) return 'text-yellow-600';
    return 'text-red-600';
  };

  const [isBookmarked, setIsBookmarked] = useState<{[key: string]: boolean}>({});

  const toggleBookmark = () => {
    const currentQuestion = testSections[currentSection]?.questions[currentQuestionIndex];
    if (currentQuestion) {
      const key = `${currentSection}-${currentQuestion.id}`;
      setIsBookmarked(prev => ({
        ...prev,
        [key]: !prev[key]
      }));
    }
  };

  const handleJumpToQuestion = (index: number) => {
    setCurrentQuestionIndex(index);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100 dark:from-gray-900 dark:to-orange-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600 dark:text-gray-300">جاري تحميل الاختبار الكمي...</p>
        </div>
      </div>
    );
  }

  if (!testStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-amber-600 dark:from-gray-900 dark:via-orange-900/20 dark:to-red-900/20">
        <div className="container mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="flex items-center justify-center gap-4 mb-6">
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              >
                <Calculator className="w-16 h-16 text-orange-600" />
              </motion.div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-orange-600 via-red-600 to-amber-600 bg-clip-text text-transparent">
                اختبار القدرات الكمية المتقدم
              </h1>
            </div>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              اختبار شامل مكون من 5 أقسام - 55 سؤال في 55 دقيقة مع تحليل رياضي تفصيلي
            </p>
          </motion.div>

          <div className="max-w-4xl mx-auto">
            <Card className="mb-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-2 border-orange-200 dark:border-orange-700">
              <CardHeader>
                <CardTitle className="text-2xl text-center text-orange-700 dark:text-orange-300">
                  مواصفات الاختبار الكمي
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="text-center p-4 bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/50 dark:to-orange-800/50 rounded-xl">
                    <div className="w-12 h-12 mx-auto mb-3 bg-orange-600 rounded-full flex items-center justify-center">
                      <Target className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">5</div>
                    <div className="text-sm text-orange-600 dark:text-orange-400">أقسام</div>
                  </div>

                  <div className="text-center p-4 bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/50 dark:to-red-800/50 rounded-xl">
                    <div className="w-12 h-12 mx-auto mb-3 bg-red-600 rounded-full flex items-center justify-center">
                      <Sigma className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-2xl font-bold text-red-700 dark:text-red-300">55</div>
                    <div className="text-sm text-red-600 dark:text-red-400">سؤال</div>
                  </div>

                  <div className="text-center p-4 bg-gradient-to-br from-amber-500 to-amber-600 dark:from-amber-500/50 dark:to-amber-600/50 rounded-xl">
                    <div className="w-12 h-12 mx-auto mb-3 bg-amber-100 rounded-full flex items-center justify-center">
                      <Clock className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-2xl font-bold text-amber-700 dark:text-amber-700">55</div>
                    <div className="text-sm text-amber-700 dark:text-amber-700">دقيقة</div>
                  </div>

                  <div className="text-center p-4 bg-gradient-to-br from-green-600 to-emerald-600 dark:from-green-600/50 dark:to-emerald-600/50 rounded-xl">
                    <div className="w-12 h-12 mx-auto mb-3 bg-green-100 rounded-full flex items-center justify-center">
                      <Award className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-2xl font-bold text-green-700 dark:text-green-700">11</div>
                    <div className="text-sm text-green-700 dark:text-green-700">سؤال/قسم</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Mathematical Features */}
            <Card className="mb-8 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-orange-200 dark:border-orange-700">
              <CardHeader>
                <CardTitle className="text-xl text-orange-700 dark:text-orange-300 flex items-center gap-2">
                  <PieChart className="w-6 h-6" />
                  المجالات الرياضية المشمولة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded-lg">
                    <Square className="w-4 h-4 text-orange-600" />
                    <span>الهندسة</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded-lg">
                    <Calculator className="w-4 h-4 text-red-600" />
                    <span>العمليات الحسابية</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded-lg">
                    <BarChart3 className="w-4 h-4 text-amber-700" />
                    <span>الإحصاء</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded-lg">
                    <TrendingUp className="w-4 h-4 text-green-700" />
                    <span>الأنماط</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded-lg">
                    <Sigma className="w-4 h-4 text-orange-600" />
                    <span>المعادلات</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded-lg">
                    <PieChart className="w-4 h-4 text-red-600" />
                    <span>النسب المئوية</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Access Control */}
            {!canTakeTest && (
              <Card className="mb-8 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-200 dark:border-yellow-700">
                <CardContent className="p-6 text-center">
                  <Timer className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-yellow-700 dark:text-yellow-300 mb-2">
                    وصلت للحد الأقصى اليومي
                  </h3>
                  <p className="text-yellow-600 dark:text-yellow-400">
                    يمكن للحسابات المجانية أخذ اختبار واحد كل يومين. 
                    الاشتراك المميز يتيح وصولاً غير محدود!
                  </p>
                </CardContent>
              </Card>
            )}

            <div className="text-center">
              <Button
                onClick={startTest}
                disabled={!canTakeTest}
                className={`px-8 py-4 text-lg font-bold ${
                  canTakeTest 
                    ? 'bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white shadow-xl hover:shadow-2xl transform hover:scale-105'
                    : 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed'
                } transition-all duration-300`}
              >
                {canTakeTest ? (
                  <>
    <PlayCircle className="w-6 h-6 mr-2" />
                    ابدأ الاختبار الكمي المتقدم
                  </>
                ) : (
                  <>
                    <Timer className="w-6 h-6 mr-2" />
                    غير متاح حالياً
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show section transition
  if (showSectionTransition) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100 dark:from-gray-900 dark:to-red-900 flex items-center justify-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-orange-600 to-red-600 rounded-full flex items-center justify-center"
          >
            <Zap className="w-10 h-10 text-white" />
          </motion.div>
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">
            انتقال إلى القسم التالي
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            القسم {currentSection + 2} من 5
          </p>
        </motion.div>
      </div>
    );
  }

  // Show AI reviewing screen after test completion
  if (showAiReview && testResults) {
    const userStr = localStorage.getItem('user');
    const userEmail = userStr ? JSON.parse(userStr)?.email : undefined;
    const scoreVal = testResults.totalScore;
    const totalQ = 55;
    return (
      <AiReviewingScreen
        wrongQuestions={wrongQuestionsForAI}
        totalQuestions={totalQ}
        score={scoreVal}
        userEmail={userEmail}
        onShowResults={(explanations) => {
          if (explanations) setAiExplanations(explanations);
          setShowAiReview(false);
          setShowResults(true);
        }}
        onSendEmail={async () => {
          try {
            const userObj = userStr ? JSON.parse(userStr) : null;
            if (!userObj?.id) return;
            await fetch('/api/ai/send-results-email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: userObj.id,
                testType: 'اختبار كمي متقدم',
                score: scoreVal,
                totalQuestions: totalQ,
                wrongQuestions: wrongQuestionsForAI,
              }),
            });
          } catch {}
        }}
      />
    );
  }

  // Show results (enhanced math-themed styling with mistake challenge)
  if (showResults && testResults) {
    const getPerformanceLevel = (percentage: number) => {
      if (percentage >= 90) return { label: 'عبقري رياضي', color: 'text-green-600', bgColor: 'bg-green-100', emoji: '🧮' };
      if (percentage >= 80) return { label: 'محلل ممتاز', color: 'text-blue-600', bgColor: 'bg-blue-100', emoji: '📊' };
      if (percentage >= 70) return { label: 'حاسب جيد', color: 'text-yellow-600', bgColor: 'bg-yellow-100', emoji: '🔢' };
      if (percentage >= 60) return { label: 'مفكر منطقي', color: 'text-orange-600', bgColor: 'bg-orange-100', emoji: '🎯' };
      return { label: 'يحتاج تدريب', color: 'text-red-600', bgColor: 'bg-red-100', emoji: '💪' };
    };

    const performanceLevel = getPerformanceLevel(testResults.overallPercentage);
    const wrongAnswersCount = 55 - testResults.totalScore;

    const generateMistakesHTML = () => {
      const currentDate = new Date().toLocaleDateString('ar-SA', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      // جمع الأخطاء من جميع الأقسام
      const wrongAnswers: any[] = [];
      testSections.forEach((section, sectionIndex) => {
        section.questions.forEach((question, questionIndex) => {
          const userAnswer = selectedAnswers[`${sectionIndex}-${question.id}`];
          if (userAnswer === undefined || userAnswer !== question.correctOptionIndex) {
            wrongAnswers.push({
              ...question,
              userAnswer: userAnswer !== undefined ? question.options[userAnswer] : 'لم تتم الإجابة',
              correctAnswer: question.options[question.correctOptionIndex],
              sectionNumber: section.sectionNumber,
              questionNumber: questionIndex + 1
            });
          }
        });
      });

      return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>تقرير مراجعة الأخطاء - الاختبار الكمي المتقدم</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;900&display=swap');
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Tajawal', Arial, sans-serif;
            line-height: 1.8;
            background: linear-gradient(135deg, #ff9a56 0%, #ff6b9d 50%, #c44569 100%);
            min-height: 100vh;
            padding: 20px;
            color: #333;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: rgba(255, 255, 255, 0.95);
            border-radius: 25px;
            padding: 40px;
            box-shadow: 0 25px 50px rgba(0, 0, 0, 0.2);
            backdrop-filter: blur(10px);
            position: relative;
            overflow: hidden;
        }
        
        .container::before {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.1), transparent);
            transform: rotate(45deg);
            animation: shimmer 3s ease-in-out infinite;
        }
        
        @keyframes shimmer {
            0%, 100% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
            50% { transform: translateX(100%) translateY(100%) rotate(45deg); }
        }
        
        .math-decoration {
            position: absolute;
            font-size: 2rem;
            opacity: 0.1;
            color: #ff6b9d;
            animation: mathFloat 8s ease-in-out infinite;
        }
        
        .math-decoration:nth-child(1) { top: 10%; right: 10%; content: '∑'; }
        .math-decoration:nth-child(2) { bottom: 20%; left: 15%; content: '∫'; }
        .math-decoration:nth-child(3) { top: 60%; right: 20%; content: '√'; }
        .math-decoration:nth-child(4) { bottom: 40%; left: 80%; content: 'π'; }
        
        @keyframes mathFloat {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            25% { transform: translateY(-15px) rotate(90deg); }
            50% { transform: translateY(-30px) rotate(180deg); }
            75% { transform: translateY(-15px) rotate(270deg); }
        }
        
        .decoration {
            position: absolute;
            background: linear-gradient(45deg, #ff9a56, #ff6b9d);
            border-radius: 50%;
            opacity: 0.15;
        }
        
        .decoration:nth-child(1) {
            width: 120px;
            height: 120px;
            top: 5%;
            right: 5%;
            animation: float 7s ease-in-out infinite;
        }
        
        .decoration:nth-child(2) {
            width: 80px;
            height: 80px;
            bottom: 15%;
            left: 5%;
            animation: float 9s ease-in-out infinite reverse;
        }
        
        @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-25px) rotate(180deg); }
        }
        
        .date-stamp {
            position: absolute;
            top: 20px;
            left: 20px;
            background: linear-gradient(45deg, #ff9a56, #ff6b9d);
            color: white;
            padding: 10px 20px;
            border-radius: 20px;
            font-size: 0.95rem;
            font-weight: 600;
            z-index: 10;
            box-shadow: 0 4px 15px rgba(255, 107, 157, 0.3);
        }
        
        .header {
            text-align: center;
            margin-bottom: 50px;
            position: relative;
            z-index: 5;
        }
        
        .math-emoji {
            font-size: 5rem;
            margin-bottom: 20px;
            display: block;
            animation: mathBounce 2s ease-in-out infinite;
        }
        
        @keyframes mathBounce {
            0%, 20%, 50%, 80%, 100% { transform: translateY(0) scale(1); }
            40% { transform: translateY(-15px) scale(1.1); }
            60% { transform: translateY(-8px) scale(1.05); }
        }
        
        h1 {
            font-size: 3.2rem;
            font-weight: 900;
            background: linear-gradient(45deg, #ff9a56, #ff6b9d, #c44569);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 15px;
            text-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }
        
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            gap: 25px;
            margin-bottom: 50px;
            position: relative;
            z-index: 5;
        }
        
        .stat-card {
            background: linear-gradient(135deg, #ff9a56 0%, #ff6b9d 50%, #c44569 100%);
            padding: 35px;
            border-radius: 25px;
            text-align: center;
            box-shadow: 0 20px 40px rgba(255, 107, 157, 0.2);
            border: 3px solid rgba(255, 255, 255, 0.3);
            transition: all 0.4s ease;
            position: relative;
            overflow: hidden;
        }
        
        .stat-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
            transition: left 0.6s ease;
        }
        
        .stat-card:hover::before {
            left: 100%;
        }
        
        .stat-card:hover {
            transform: translateY(-15px) scale(1.05);
            box-shadow: 0 30px 60px rgba(255, 107, 157, 0.3);
        }
        
        .stat-number {
            font-size: 3rem;
            font-weight: 900;
            color: #fff;
            text-shadow: 0 3px 6px rgba(0, 0, 0, 0.3);
            margin-bottom: 12px;
        }
        
        .stat-label {
            font-size: 1.2rem;
            font-weight: 700;
            color: rgba(255, 255, 255, 0.95);
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        
        .questions-container {
            position: relative;
            z-index: 5;
        }
        
        .section-title {
            font-size: 2.5rem;
            font-weight: 800;
            text-align: center;
            margin-bottom: 40px;
            background: linear-gradient(45deg, #ff9a56, #ff6b9d);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        .mistake-card {
            background: #fff;
            border-radius: 25px;
            padding: 35px;
            margin-bottom: 35px;
            box-shadow: 0 15px 35px rgba(255, 107, 157, 0.15);
            border-left: 6px solid #ff6b9d;
            position: relative;
            transition: all 0.4s ease;
        }
        
        .mistake-card:hover {
            transform: translateX(15px);
            box-shadow: 0 20px 45px rgba(255, 107, 157, 0.25);
        }
        
        .mistake-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 25px;
            padding-bottom: 20px;
            border-bottom: 3px solid #f5f5f5;
        }
        
        .question-number {
            background: linear-gradient(45deg, #ff6b9d, #c44569);
            color: white;
            padding: 12px 25px;
            border-radius: 20px;
            font-weight: 800;
            font-size: 1.2rem;
            box-shadow: 0 4px 15px rgba(255, 107, 157, 0.3);
        }
        
        .section-badge {
            background: linear-gradient(45deg, #ff9a56, #ff6b9d);
            color: white;
            padding: 10px 20px;
            border-radius: 15px;
            font-size: 1rem;
            font-weight: 700;
            box-shadow: 0 3px 10px rgba(255, 154, 86, 0.3);
        }
        
        .question-text {
            font-size: 1.4rem;
            font-weight: 600;
            color: #2c3e50;
            margin-bottom: 30px;
            line-height: 1.8;
            padding: 25px;
            background: linear-gradient(135deg, #fff5f5, #ffe0e0);
            border-radius: 20px;
            border-right: 5px solid #ff6b9d;
            box-shadow: inset 0 2px 5px rgba(255, 107, 157, 0.1);
        }
        
        .answer-section {
            display: grid;
            gap: 20px;
        }
        
        .answer-item {
            padding: 20px 25px;
            border-radius: 15px;
            font-weight: 700;
            border: 3px solid transparent;
            transition: all 0.3s ease;
            font-size: 1.1rem;
        }
        
        .user-answer {
            background: linear-gradient(135deg, #ff6b9d, #c44569);
            color: white;
            border-color: #ff6b9d;
            box-shadow: 0 5px 15px rgba(255, 107, 157, 0.3);
        }
        
        .correct-answer {
            background: linear-gradient(135deg, #26de81, #20bf6b);
            color: white;
            border-color: #26de81;
            box-shadow: 0 5px 15px rgba(38, 222, 129, 0.3);
        }
        
        .unanswered {
            background: linear-gradient(135deg, #fed330, #f39801);
            color: white;
            border-color: #fed330;
            box-shadow: 0 5px 15px rgba(254, 211, 48, 0.3);
        }
        
        .explanation {
            background: linear-gradient(135deg, #e3f2fd, #bbdefb);
            padding: 25px;
            border-radius: 20px;
            margin-top: 25px;
            border-right: 5px solid #2196f3;
            box-shadow: 0 5px 15px rgba(33, 150, 243, 0.1);
        }
        
        .explanation-title {
            font-weight: 800;
            color: #1976d2;
            margin-bottom: 15px;
            font-size: 1.2rem;
        }
        
        .explanation-text {
            color: #0d47a1;
            line-height: 1.8;
            font-size: 1.1rem;
        }
        
        .footer {
            text-align: center;
            margin-top: 70px;
            padding-top: 50px;
            border-top: 4px solid rgba(255, 154, 86, 0.3);
            position: relative;
            z-index: 5;
        }
        
        .footer h2 {
            font-size: 2rem;
            font-weight: 800;
            background: linear-gradient(45deg, #ff9a56, #ff6b9d);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 20px;
        }
        
        .theme-toggle {
            position: fixed;
            top: 25px;
            left: 25px;
            background: linear-gradient(45deg, #ff9a56, #ff6b9d);
            color: white;
            border: none;
            border-radius: 50%;
            width: 55px;
            height: 55px;
            font-size: 1.3rem;
            cursor: pointer;
            box-shadow: 0 6px 20px rgba(255, 107, 157, 0.3);
            transition: all 0.3s ease;
            z-index: 1000;
        }
        
        .theme-toggle:hover {
            transform: scale(1.15) rotate(360deg);
            box-shadow: 0 8px 25px rgba(255, 107, 157, 0.4);
        }
        
        @media (max-width: 768px) {
            .container { padding: 25px; }
            h1 { font-size: 2.2rem; }
            .stats { grid-template-columns: repeat(2, 1fr); }
            .stat-number { font-size: 2.2rem; }
            .question-text { font-size: 1.2rem; }
        }
        
        body.dark-mode {
            background: linear-gradient(135deg, #2c3e50 0%, #34495e 50%, #2c3e50 100%);
        }
        
        body.dark-mode .container {
            background: rgba(52, 73, 94, 0.95);
            color: #ecf0f1;
        }
        
        body.dark-mode .mistake-card {
            background: #34495e;
            border-left-color: #e74c3c;
        }
        
        body.dark-mode .question-text {
            background: linear-gradient(135deg, #34495e, #2c3e50);
            color: #ecf0f1;
            border-right-color: #e74c3c;
        }
    </style>
</head>
<body>
    <button class="theme-toggle" onclick="toggleDarkMode()" title="تبديل الوضع الليلي">🌙</button>
    
    <script>
        function toggleDarkMode() {
            const body = document.body;
            const toggle = document.querySelector('.theme-toggle');
            
            body.classList.toggle('dark-mode');
            
            if (body.classList.contains('dark-mode')) {
                toggle.innerHTML = '☀️';
                localStorage.setItem('darkMode', 'enabled');
            } else {
                toggle.innerHTML = '🌙';
                localStorage.setItem('darkMode', 'disabled');
            }
        }
        
        document.addEventListener('DOMContentLoaded', function() {
            const darkMode = localStorage.getItem('darkMode');
            const toggle = document.querySelector('.theme-toggle');
            
            if (darkMode === 'enabled') {
                document.body.classList.add('dark-mode');
                toggle.innerHTML = '☀️';
            }
        });
    </script>

    <div class="container">
        <div class="decoration"></div>
        <div class="decoration"></div>
        <div class="math-decoration">∑</div>
        <div class="math-decoration">∫</div>
        <div class="math-decoration">√</div>
        <div class="math-decoration">π</div>
        
        <div class="date-stamp">${currentDate}</div>
        
        <div class="header">
            <div class="math-emoji">🧮</div>
            <h1>تقرير مراجعة الأخطاء - الاختبار الكمي المتقدم</h1>
            <p style="font-size: 1.4rem; opacity: 0.8; margin-top: 15px;">
                تحليل رياضي تفصيلي لنقاط التحسين والتطوير الكمي
            </p>
        </div>

        <div class="stats">
            <div class="stat-card">
                <div class="stat-number">${wrongAnswersCount}</div>
                <div class="stat-label">أخطاء رياضية</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">55</div>
                <div class="stat-label">إجمالي المسائل</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${testResults.totalScore}</div>
                <div class="stat-label">حلول صحيحة</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${testResults.overallPercentage}%</div>
                <div class="stat-label">النسبة الكمية</div>
            </div>
        </div>

        <div class="questions-container">
            <h2 class="section-title">🔢 تفاصيل المسائل للمراجعة</h2>

            ${wrongAnswers.map((question, index) => `
                <div class="mistake-card">
                    <div class="mistake-header">
                        <div class="question-number">مسألة ${index + 1}</div>
                        <div class="section-badge">القسم ${question.sectionNumber}</div>
                    </div>
                    
                    <div class="question-text">
                        ${question.text}
                    </div>
                    
                    <div class="answer-section">
                        <div class="answer-item user-answer">
                            <strong>🔴 حلك:</strong> ${question.userAnswer}
                        </div>
                        <div class="answer-item correct-answer">
                            <strong>✅ الحل الصحيح:</strong> ${question.correctAnswer}
                        </div>
                    </div>
                    
                    ${question.explanation ? `
                        <div class="explanation">
                            <div class="explanation-title">📐 الشرح الرياضي:</div>
                            <div class="explanation-text">${question.explanation}</div>
                        </div>
                    ` : ''}
                </div>
            `).join('')}
        </div>

        <div class="footer">
            <h2>🌟 رحلة الإتقان الرياضي</h2>
            <p style="font-size: 1.3rem; opacity: 0.8; margin-bottom: 25px;">
                كل خطأ رياضي هو بوابة لفهم أعمق وحلول أذكى
            </p>
            <p style="font-size: 1.1rem; opacity: 0.6;">
                تم إنشاء هذا التقرير بواسطة منصة <strong>قدراتك</strong> - منصة شاملة لتطوير القدرات الكمية
            </p>
        </div>
    </div>
</body>
</html>`;
    };

    const downloadMistakesHTML = () => {
      const htmlContent = generateMistakesHTML();
      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `أخطاء-الاختبار-الكمي-المتقدم-${new Date().toLocaleDateString('ar-EG')}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    };

    const startMistakeChallenge = () => {
      // جمع الأخطاء من جميع الأقسام
      const wrongAnswers: any[] = [];
      testSections.forEach((section, sectionIndex) => {
        section.questions.forEach((question, questionIndex) => {
          const userAnswer = selectedAnswers[`${sectionIndex}-${question.id}`];
          if (userAnswer === undefined || userAnswer !== question.correctOptionIndex) {
            wrongAnswers.push({
              ...question,
              userAnswer: userAnswer,
              sectionNumber: section.sectionNumber,
              originalIndex: `${sectionIndex}-${questionIndex}`
            });
          }
        });
      });

      if (wrongAnswers.length === 0) {
        alert('لا توجد أخطاء للمراجعة! أداء رياضي ممتاز 🎉');
        return;
      }

      // حفظ بيانات التحدي
      const challengeData = {
        type: 'mistake_challenge',
        mode: 'advanced_quantitative',
        questions: wrongAnswers,
        originalTest: {
          testName: 'الاختبار الكمي المتقدم',
          subcategory: 'شامل - 5 أقسام',
          originalScore: testResults.totalScore,
          originalTotal: 55
        },
        timeLimit: wrongAnswers.length * 90 // دقيقة ونصف لكل سؤال كمي
      };

      localStorage.setItem('mistakeChallenge', JSON.stringify(challengeData));
      setLocation('/mistake-challenge');
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-amber-600 dark:from-gray-900 dark:via-orange-900/20 dark:to-red-900/20 p-4">
        {/* خلفية رياضية متحركة */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          {['∑', '∫', '√', 'π', '∞', 'Δ', 'α', 'β', 'γ', 'θ'].map((symbol, i) => (
            <motion.div
              key={i}
              className="absolute text-6xl font-bold text-orange-300/20 dark:text-orange-500/10"
              animate={{
                x: [0, Math.random() * window.innerWidth],
                y: [0, Math.random() * window.innerHeight],
                rotate: [0, 360],
                scale: [0.5, 1.5, 0.5],
              }}
              transition={{
                duration: Math.random() * 15 + 20,
                repeat: Infinity,
                ease: "linear",
              }}
              style={{
                left: Math.random() * window.innerWidth,
                top: Math.random() * window.innerHeight,
              }}
            >
              {symbol}
            </motion.div>
          ))}
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <motion.div
              animate={{ rotate: [0, 360], scale: [1, 1.2, 1] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="inline-block mb-6"
            >
              <Trophy className="w-20 h-20 text-yellow-500 drop-shadow-lg" />
            </motion.div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-orange-600 via-red-600 to-amber-600 bg-clip-text text-transparent mb-4">
              🧮 نتائج الاختبار الكمي المتقدم
            </h1>
            <p className="text-2xl text-gray-600 dark:text-gray-300">
              تحليل رياضي شامل مع استراتيجيات تطوير ذكية
            </p>
          </motion.div>

          {/* النتيجة الإجمالية المحسّنة */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <Card className="relative overflow-hidden bg-gradient-to-r from-orange-500 via-red-600 to-amber-600 text-white shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent" />
              <CardContent className="relative p-12 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                  className="text-8xl font-bold mb-4 drop-shadow-lg"
                >
                  {testResults.overallPercentage}%
                </motion.div>
                <div className="text-3xl font-semibold mb-4">النتيجة الكمية الإجمالية</div>
                <div className="text-xl opacity-90 mb-6">
                  {testResults.totalScore} من 55 مسألة رياضية صحيحة
                </div>
                <div className={`inline-flex items-center gap-3 px-6 py-3 rounded-full text-xl font-bold ${performanceLevel.bgColor} ${performanceLevel.color} bg-white/20 backdrop-blur-sm`}>
                  <span className="text-2xl">{performanceLevel.emoji}</span>
                  {performanceLevel.label}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* نتائج الأقسام الكمية المحسّنة */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-8"
          >
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-xl">
              <CardHeader>
                <CardTitle className="text-3xl flex items-center gap-3">
                  <PieChart className="w-8 h-8 text-orange-600" />
                  نتائج الأقسام الرياضية الخمسة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                  {testResults.sectionResults.map((section, index) => (
                    <motion.div
                      key={section.sectionNumber}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * index }}
                      className="relative group"
                    >
                      <div className="text-center p-6 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-2xl border-2 border-orange-200 dark:border-orange-700 hover:shadow-lg transition-all duration-300 hover:scale-105">
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.5 + index * 0.1, type: "spring" }}
                          className="text-4xl font-bold text-orange-600 dark:text-orange-400 mb-3"
                        >
                          {section.percentage}%
                        </motion.div>
                        <div className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          القسم {section.sectionNumber}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                          {section.score}/11 صحيح
                        </div>
                        <Progress value={section.percentage} className="h-2" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* تحليل المجالات الرياضية المحسّن */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mb-8"
          >
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-xl">
              <CardHeader>
                <CardTitle className="text-3xl flex items-center gap-3">
                  <Sigma className="w-8 h-8 text-green-600" />
                  تحليل المجالات الرياضية
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6">
                  {Object.entries(testResults.subcategoryBreakdown).map(([subcategory, data], index) => (
                    <motion.div
                      key={subcategory}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * index }}
                      className="flex items-center justify-between p-6 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-2xl border border-orange-200 dark:border-orange-700 hover:shadow-lg transition-all duration-300"
                    >
                      <div className="flex-1">
                        <div className="text-xl font-bold text-gray-800 dark:text-white mb-2">{subcategory}</div>
                        <div className="text-gray-600 dark:text-gray-300">
                          {data.correct} من {data.total} مسألة صحيحة
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-2">
                          {data.percentage}%
                        </div>
                        <Progress value={data.percentage} className="w-32 h-3" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* شروحات الذكاء الاصطناعي للأخطاء */}
          {aiExplanations.length > 0 && wrongQuestionsForAI.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="mb-8">
              <Card className="border-2 border-teal-400 dark:border-teal-400 shadow-xl overflow-hidden">
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
                              <span className="px-2 py-1 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 rounded-full">✗ إجابتك: {wq.studentAnswerIndex !== null ? (wq.options[wq.studentAnswerIndex] ?? 'لم تُجب') : 'لم تُجب'}</span>
                              <span className="px-2 py-1 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 rounded-full">✓ الصحيح: {wq.options[wq.correctAnswerIndex]}</span>
                              {exp.conceptError && <span className="px-2 py-1 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 rounded-full">📌 {exp.conceptError}</span>}
                            </div>
                            <div className="bg-teal-100 dark:bg-teal-100/20 border border-teal-400 dark:border-teal-400 rounded-xl p-3 space-y-1.5">
                              <p className="text-teal-700 dark:text-teal-700 text-sm leading-relaxed">{exp.explanation}</p>
                              {exp.tip && <p className="text-teal-700 dark:text-teal-700 text-xs font-medium">💡 {exp.tip}</p>}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* قسم التحديات الرياضية والمميزات الجديد */}
          {wrongAnswersCount > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="mb-8"
            >
              <Card className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-2 border-red-200 dark:border-red-700 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-3xl text-center flex items-center justify-center gap-3">
                    <Calculator className="w-8 h-8 text-red-600" />
                    🎯 تحدي المراجعة الرياضية الذكي
                  </CardTitle>
                  <p className="text-center text-gray-600 dark:text-gray-300 text-lg">
                    حوّل أخطاءك الرياضية إلى مهارات قوية مع نظام التدريب التفاعلي
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                          {wrongAnswersCount}
                        </div>
                        <div>
                          <div className="font-bold text-lg">مسائل تحتاج مراجعة</div>
                          <div className="text-gray-600 dark:text-gray-400">فرصة لتطوير مهاراتك الرياضية</div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-green-600">
                          <Square className="w-5 h-5" />
                          <span>حلول خطوة بخطوة مع شروحات مفصلة</span>
                        </div>
                        <div className="flex items-center gap-2 text-blue-600">
                          <Star className="w-5 h-5" />
                          <span>نقاط مضاعفة للمسائل الصعبة</span>
                        </div>
                        <div className="flex items-center gap-2 text-green-700">
                          <Award className="w-5 h-5" />
                          <span>شارات الإتقان الرياضي</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Button
                        onClick={startMistakeChallenge}
                        className="w-full bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 hover:from-red-600 hover:via-orange-600 hover:to-yellow-600 text-white text-lg py-4 shadow-lg hover:shadow-xl transition-all duration-300"
                      >
                        <motion.div
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="flex items-center gap-2"
                        >
                          <Calculator className="w-6 h-6" />
                          ابدأ التحدي الرياضي الآن
                        </motion.div>
                      </Button>

                      <Button
                        onClick={downloadMistakesHTML}
                        variant="outline"
                        className="w-full border-2 border-orange-300 hover:bg-orange-50 text-orange-700 text-lg py-4"
                      >
                        <motion.div
                          animate={{ rotate: [0, 15, -15, 0] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="flex items-center gap-2"
                        >
                          <BookOpen className="w-6 h-6" />
                          تحميل تقرير الأخطاء الرياضي
                        </motion.div>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* الأزرار الرئيسية */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
            className="space-y-6"
          >
            <div className="flex flex-wrap justify-center gap-4">
              <Button
                onClick={() => setLocation('/quantitative-tests')}
                className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white px-8 py-4 text-lg shadow-lg hover:shadow-xl transition-all duration-300"
                data-testid="button-quantitative-tests"
              >
                <Home className="w-6 h-6 mr-2" />
                العودة للاختبارات الكمية
              </Button>
              
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
                className="border-2 border-orange-300 hover:bg-orange-50 text-orange-700 px-8 py-4 text-lg"
                data-testid="button-retry-test"
              >
                <RefreshCw className="w-6 h-6 mr-2" />
                إعادة الاختبار
              </Button>
            </div>

            {/* Save to Folder Section */}
            <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border border-white/30 dark:border-gray-700/50 shadow-xl rounded-2xl max-w-4xl mx-auto">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2 justify-center">
                  <FolderPlus className="h-5 w-5 text-green-700 dark:text-green-700" />
                  حفظ الأسئلة في المجلدات
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button
                    onClick={() => handleSaveToFolder("all")}
                    variant="outline"
                    className="h-14 border-2 border-green-400 dark:border-green-400 hover:bg-green-100 dark:hover:bg-green-100/20 text-green-700 dark:text-green-700 font-medium rounded-xl transition-all duration-300 hover:scale-105"
                    data-testid="button-save-all-questions"
                  >
                    <FolderPlus className="h-5 w-5 mr-2" />
                    حفظ جميع الأسئلة (55)
                  </Button>
                  
                  {wrongAnswersCount > 0 && (
                    <Button
                      onClick={() => handleSaveToFolder("wrong")}
                      variant="outline"
                      className="h-14 border-2 border-red-300 dark:border-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-700 dark:text-red-300 font-medium rounded-xl transition-all duration-300 hover:scale-105"
                      data-testid="button-save-wrong-questions"
                    >
                      <XCircle className="h-5 w-5 mr-2" />
                      حفظ الأخطاء فقط ({wrongAnswersCount})
                    </Button>
                  )}
                  
                  <Button
                    onClick={() => handleSaveToFolder("unanswered")}
                    variant="outline"
                    className="h-14 border-2 border-amber-300 dark:border-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 text-amber-700 dark:text-amber-300 font-medium rounded-xl transition-all duration-300 hover:scale-105"
                    data-testid="button-save-unanswered-questions"
                  >
                    <AlertCircle className="h-5 w-5 mr-2" />
                    حفظ غير المجاب
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Save to Folder Dialog */}
          <EnhancedSaveToFolderDialog
            open={showSaveDialog}
            onOpenChange={setShowSaveDialog}
            questionIds={questionsToSave}
            saveMode={saveMode}
            onSuccess={() => {
              setShowSaveDialog(false);
              toast({
                title: "✅ تم الحفظ بنجاح",
                description: "تم حفظ الأسئلة في المجلدات المختارة",
              });
            }}
          />
        </div>
      </div>
    );
  }

  // Main test interface (similar to verbal but with math-themed styling)
  const currentQuestion = testSections[currentSection]?.questions[currentQuestionIndex];
  const questionKey = `${currentSection}-${currentQuestion?.id}`;
  const selectedAnswer = selectedAnswers[questionKey];

  return (
    <QiyasExamLayout
      examTitle="اختبار القدرات الكمية المتقدم"
      questionNumber={currentQuestionIndex + 1}
      totalQuestions={testSections[currentSection]?.questionCount || 0}
      sectionLabel={testSections[currentSection]?.name}
      sectionNumber={currentSection + 1}
      totalSections={testSections.length}
      timeLeft={sectionTimeRemaining}
      isTimeUrgent={sectionTimeRemaining < 60}
      questionText={currentQuestion?.text || ""}
      options={currentQuestion?.options || []}
      selectedAnswer={selectedAnswer !== undefined ? selectedAnswer : null}
      onSelectAnswer={selectAnswer}
      currentQuestionIndex={currentQuestionIndex}
      questionsStatus={testSections[currentSection]?.questions.map((q) => {
        const key = `${currentSection}-${q.id}`;
        return {
          answered: selectedAnswers[key] !== undefined,
          bookmarked: !!isBookmarked[key]
        };
      }) || []}
      onJumpToQuestion={handleJumpToQuestion}
      isBookmarked={!!isBookmarked[questionKey]}
      onToggleBookmark={toggleBookmark}
      onPrev={previousQuestion}
      onNext={nextQuestion}
      onFinish={completeTest}
      canGoPrev={currentQuestionIndex > 0}
      canGoNext={true}
      isLastQuestion={currentQuestionIndex === (testSections[currentSection]?.questionCount || 0) - 1}
      answeredCount={testSections[currentSection]?.questions.filter(q => selectedAnswers[`${currentSection}-${q.id}`] !== undefined).length}
      userName={(user as any)?.username || (user as any)?.name}
      userId={(user as any)?.id?.toString()}
      questionId={currentQuestion?.id}
      topRightSlot={
        <div className="flex items-center gap-2">
          <div className="text-center px-2 border-r border-gray-200">
            <div className="text-[10px] text-gray-400">الإجمالي</div>
            <div className={`font-mono text-xs font-bold ${getTimeColor(timeRemaining, 55 * 60)}`}>
              {formatTime(timeRemaining)}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (!isPrayerBreak && !hasPrayerBreakBeenUsed) {
                setIsPrayerBreak(true);
                setHasPrayerBreakBeenUsed(true);
                setPrayerBreakTimeLeft(600);
              } else if (isPrayerBreak) {
                setIsPrayerBreak(false);
              }
            }}
            disabled={!isPrayerBreak && hasPrayerBreakBeenUsed}
            className={`h-8 w-8 ${isPrayerBreak ? "text-orange-500 bg-orange-50" : ""}`}
            title={isPrayerBreak ? "استئناف" : "توقف للصلاة"}
          >
            <Moon className="h-4 w-4" />
          </Button>
          {renderPrayerBreakOverlay()}
        </div>
      }
    />
  );
}