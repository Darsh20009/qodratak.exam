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
import { QiyasExamLayout } from '@/components/QiyasExamLayout';
import {
  Brain,
  Clock,
  Target,
  Award,
  BookOpen,
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
  Eye,
  BarChart3,
  Moon,
  Clock3,
  FolderPlus,
  Bookmark,
  Pause,
  Play
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { EnhancedSaveToFolderDialog } from '@/components/EnhancedSaveToFolderDialog';

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

export function AdvancedVerbalTest() {
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
  const [isSaveFolderDialogOpen, setIsSaveFolderDialogOpen] = useState(false);

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
    const testsToday = JSON.parse(localStorage.getItem(`dailyAdvancedVerbalTests_${today}`) || '0');
    setDailyTestsTaken(testsToday);
  }, []);

  const canTakeTest = !!isPremiumUser || dailyTestsTaken === 0;

  // Initialize test sections
  useEffect(() => {
    if (allQuestions.length > 0 && testSections.length === 0) {
      // Get current test configuration from localStorage
      const currentTest = localStorage.getItem('currentVerbalTest');
      let targetSubcategory = 'شامل - 5 أقسام'; // default to comprehensive
      
      if (currentTest) {
        const testConfig = JSON.parse(currentTest);
        targetSubcategory = testConfig.subcategory;
      }
      
      let verbalQuestions;
      
      if (targetSubcategory === 'شامل - 5 أقسام') {
        // For comprehensive test, use all verbal questions
        verbalQuestions = allQuestions.filter(q => q.category === 'verbal');
      } else {
        // For specific subcategory tests, filter by exact subcategory
        const specificSubcategory = targetSubcategory.replace(' - 5 أقسام', '');
        verbalQuestions = allQuestions.filter(q => 
          q.category === 'verbal' && q.subcategory === specificSubcategory
        );
      }
      
      if (verbalQuestions.length >= 65) {
        // Shuffle questions for randomness
        const shuffled = [...verbalQuestions].sort(() => Math.random() - 0.5);
        const selectedQuestions = shuffled.slice(0, 65);

        // Create 5 sections with 13 questions each
        const sections: TestSection[] = [];
        for (let i = 0; i < 5; i++) {
          const startIndex = i * 13;
          const endIndex = startIndex + 13;
          sections.push({
            sectionNumber: i + 1,
            name: `القسم ${i + 1} - ${targetSubcategory.replace(' - 5 أقسام', '')}`,
            questionCount: 13,
            timeLimit: 13, // 13 minutes per section
            questions: selectedQuestions.slice(startIndex, endIndex),
            completed: false
          });
        }
        
        setTestSections(sections);
        setTimeRemaining(65 * 60); // 65 minutes total
        setSectionTimeRemaining(13 * 60); // 13 minutes for first section
      }
    }
  }, [allQuestions, testSections.length]);

  const [isPaused, setIsPaused] = useState(false);
  const [bookmarkedQuestions, setBookmarkedQuestions] = useState<Set<string>>(new Set());

  const toggleBookmark = (questionId: number) => {
    const key = `${currentSection}-${questionId}`;
    setBookmarkedQuestions(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const togglePause = () => {
    setIsPaused(prev => !prev);
  };

  // Timer logic
  useEffect(() => {
    if (testStarted && !isPrayerBreak && !testCompleted && !isPaused && timeRemaining > 0 && sectionTimeRemaining > 0) {
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
      localStorage.setItem(`dailyAdvancedVerbalTests_${today}`, '1');
      setDailyTestsTaken(1);
    }
  };

  const moveToNextSection = () => {
    if (currentSection < testSections.length - 1) {
      // Mark current section as completed
      const updatedSections = [...testSections];
      updatedSections[currentSection].completed = true;
      updatedSections[currentSection].timeSpent = (13 * 60) - sectionTimeRemaining;
      setTestSections(updatedSections);
      
      setShowSectionTransition(true);
      
      setTimeout(() => {
        setCurrentSection(prev => prev + 1);
        setCurrentQuestionIndex(0);
        setSectionTimeRemaining(13 * 60);
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
        <div className="bg-white dark:bg-gray-950 p-8 rounded-2xl max-w-lg w-full mx-auto text-center space-y-8 relative overflow-hidden shadow-2xl border border-blue-300 dark:border-blue-700">
          {/* Creative Background Elements */}
          <div className="absolute -top-1/4 -right-1/4 w-80 h-80 bg-blue-400/15 dark:bg-blue-500/10 rounded-full filter blur-3xl animate-pulse-slow"></div>
          <div className="absolute -bottom-1/4 -left-1/4 w-80 h-80 bg-teal-400/15 dark:bg-teal-500/10 rounded-full filter blur-3xl animate-pulse-slow animation-delay-2000"></div>
          <div className="absolute top-10 left-10 w-10 h-10 bg-yellow-300/20 dark:bg-yellow-400/10 rounded-full animate-ping opacity-50"></div>
          <div className="absolute bottom-10 right-10 w-12 h-12 bg-white/20 dark:bg-white/10 rounded-full animate-bounce delay-1000"></div>

          <div className="relative z-10">
             {/* Enhanced Icon */}
            <div className="w-32 h-32 bg-gradient-to-br from-blue-100 via-blue-200 to-cyan-200 dark:from-gray-800 dark:via-gray-800/70 dark:to-gray-900 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg transform transition-transform hover:scale-110 duration-300 ring-4 ring-blue-500/30 dark:ring-blue-400/20">
                <Moon className="h-20 w-20 text-blue-500 dark:text-blue-400 animate-pulse-slow" />
            </div>
             {/* Enhanced Text */}
            <h3 className="text-4xl font-extrabold mb-4 bg-gradient-to-r from-blue-500 to-cyan-400 dark:from-blue-400 dark:to-cyan-300 text-transparent bg-clip-text drop-shadow-sm">
              استراحة للصلاة
            </h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-xl">
              تقبّل الله طاعتكم <Star className="inline h-5 w-5 text-yellow-400 animate-spin-slow" />
            </p>
            <p className="text-gray-600 dark:text-gray-400 text-base mt-3">
              تم إيقاف الاختبار مؤقتاً. عند الانتهاء، يمكنك استئناف الاختبار.
            </p>
            <div className="text-xs text-blue-600 dark:text-blue-400 mt-4 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md text-center">
              ملاحظة: يمكن استخدام زر توقف الصلاة مرة واحدة فقط لكل اختبار (الحد الأقصى 10 دقائق)
            </div>
          </div>

          {/* Prayer break timer display */}
          <div className="text-center mb-6 relative z-10">
            <div className="inline-flex items-center gap-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl px-6 py-3 shadow-lg border border-blue-200 dark:border-blue-700">
              <Clock3 className="h-5 w-5 text-blue-500 dark:text-blue-400" />
              <span className="text-lg font-bold text-gray-800 dark:text-gray-200">
                الوقت المتبقي: {formatTime(prayerBreakTimeLeft)}
              </span>
            </div>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-2 opacity-80">
              سيتم استئناف الاختبار تلقائياً عند انتهاء الوقت
            </p>
          </div>

          <Button
            onClick={() => setIsPrayerBreak(false)}
            className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 shadow-xl hover:shadow-blue-500/40 dark:shadow-blue-400/20 text-xl py-4 rounded-xl relative z-10 transform hover:scale-105"
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
    const totalTime = 65 * 60 - timeRemaining;
    const overallPercentage = Math.round((totalScore / 65) * 100);

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
            category: 'لفظي',
            subcategory: q.subcategory,
          });
        }
      });
    });
    setWrongQuestionsForAI(wrongQs);
    setShowAiReview(true);

    // Save results to localStorage
    const resultsHistory = JSON.parse(localStorage.getItem('advancedVerbalTestResults') || '[]');
    resultsHistory.push({
      ...results,
      testDate: new Date().toISOString(),
      testType: 'advanced-verbal'
    });
    localStorage.setItem('advancedVerbalTestResults', JSON.stringify(resultsHistory));

    // إرسال النتيجة للسيرفر لحفظ النقاط
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        const totalQuestions = 65;
        const answeredCount = Object.keys(selectedAnswers).length;
        const skippedQuestions = totalQuestions - answeredCount;
        
        const response = await apiRequest('POST', '/api/test-results', {
          userId: user.id,
          testType: 'verbal',
          difficulty: 'advanced',
          score: totalScore,
          totalQuestions,
          timeTaken: totalTime,
          skippedQuestions
        }) as any;

        // Auto-save wrong answers to a folder
        const wrongQIds: number[] = [];
        testSections.forEach((section, si) => {
          section.questions.forEach((q: any) => {
            const userAnswer = selectedAnswers[`${si}-${q.id}`];
            if (userAnswer === undefined || userAnswer !== q.correctOptionIndex) {
              if (q.id) wrongQIds.push(Number(q.id));
            }
          });
        });
        if (wrongQIds.length > 0) autoSaveMistakesToFolder(wrongQIds, 'اختبار لفظي متقدم');

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-500 dark:from-gray-900 dark:to-blue-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600 dark:text-gray-300">جاري تحميل الاختبار...</p>
        </div>
      </div>
    );
  }

  if (!testStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-teal-600 to-emerald-600 dark:from-gray-900 dark:via-blue-900/20 dark:to-emerald-600/20">
        <div className="container mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="flex items-center justify-center gap-4 mb-6">
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              >
                <Brain className="w-16 h-16 text-blue-600" />
              </motion.div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-green-600 to-amber-600 bg-clip-text text-transparent">
                اختبار القدرات اللفظية المتقدم
              </h1>
            </div>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              اختبار شامل مكون من 5 أقسام - 65 سؤال في 65 دقيقة مع تحليل تفصيلي للأداء
            </p>
          </motion.div>

          <div className="max-w-4xl mx-auto">
            <Card className="mb-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-2 border-blue-200 dark:border-blue-700">
              <CardHeader>
                <CardTitle className="text-2xl text-center text-blue-700 dark:text-blue-300">
                  مواصفات الاختبار
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="text-center p-4 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/50 dark:to-blue-800/50 rounded-xl">
                    <div className="w-12 h-12 mx-auto mb-3 bg-blue-600 rounded-full flex items-center justify-center">
                      <Target className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">5</div>
                    <div className="text-sm text-blue-600 dark:text-blue-400">أقسام</div>
                  </div>

                  <div className="text-center p-4 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/50 dark:to-green-800/50 rounded-xl">
                    <div className="w-12 h-12 mx-auto mb-3 bg-green-600 rounded-full flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-2xl font-bold text-green-700 dark:text-green-300">65</div>
                    <div className="text-sm text-green-600 dark:text-green-400">سؤال</div>
                  </div>

                  <div className="text-center p-4 bg-gradient-to-br from-green-600 to-emerald-600 dark:from-green-600/50 dark:to-emerald-600/50 rounded-xl">
                    <div className="w-12 h-12 mx-auto mb-3 bg-green-100 rounded-full flex items-center justify-center">
                      <Clock className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-2xl font-bold text-green-700 dark:text-green-700">65</div>
                    <div className="text-sm text-green-700 dark:text-green-700">دقيقة</div>
                  </div>

                  <div className="text-center p-4 bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/50 dark:to-orange-800/50 rounded-xl">
                    <div className="w-12 h-12 mx-auto mb-3 bg-orange-600 rounded-full flex items-center justify-center">
                      <Award className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">13</div>
                    <div className="text-sm text-orange-600 dark:text-orange-400">سؤال/قسم</div>
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
                    ? 'bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-600 text-white shadow-xl hover:shadow-2xl transform hover:scale-105'
                    : 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed'
                } transition-all duration-300`}
              >
                {canTakeTest ? (
                  <>
                    <PlayCircle className="w-6 h-6 mr-2" />
                    ابدأ الاختبار المتقدم
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
      <div className="min-h-screen bg-gradient-to-br from-teal-600 to-emerald-600 dark:from-gray-900 dark:to-emerald-600 flex items-center justify-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-blue-600 to-emerald-600 rounded-full flex items-center justify-center"
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
    const totalQ = 65;
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
                testType: 'اختبار لفظي متقدم',
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

  // Show results
  if (showResults && testResults) {
    const getPerformanceLevel = (percentage: number) => {
      if (percentage >= 90) return { label: 'ممتاز', color: 'text-green-600', bgColor: 'bg-green-100', emoji: '🌟' };
      if (percentage >= 80) return { label: 'جيد جداً', color: 'text-blue-600', bgColor: 'bg-blue-100', emoji: '⭐' };
      if (percentage >= 70) return { label: 'جيد', color: 'text-yellow-600', bgColor: 'bg-yellow-100', emoji: '👍' };
      if (percentage >= 60) return { label: 'مقبول', color: 'text-orange-600', bgColor: 'bg-orange-100', emoji: '📈' };
      return { label: 'يحتاج تحسين', color: 'text-red-600', bgColor: 'bg-red-100', emoji: '💪' };
    };

    const performanceLevel = getPerformanceLevel(testResults.overallPercentage);
    const wrongAnswersCount = 65 - testResults.totalScore;

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
    <title>تقرير مراجعة الأخطاء - الاختبار اللفظي المتقدم</title>
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
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
        
        .decoration {
            position: absolute;
            background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
            border-radius: 50%;
            opacity: 0.1;
        }
        
        .decoration:nth-child(1) {
            width: 100px;
            height: 100px;
            top: 10%;
            right: 10%;
            animation: float 6s ease-in-out infinite;
        }
        
        .decoration:nth-child(2) {
            width: 150px;
            height: 150px;
            bottom: 10%;
            left: 10%;
            animation: float 8s ease-in-out infinite reverse;
        }
        
        @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-20px) rotate(180deg); }
        }
        
        .date-stamp {
            position: absolute;
            top: 20px;
            left: 20px;
            background: linear-gradient(45deg, #667eea, #764ba2);
            color: white;
            padding: 8px 16px;
            border-radius: 15px;
            font-size: 0.9rem;
            font-weight: 500;
            z-index: 10;
        }
        
        .header {
            text-align: center;
            margin-bottom: 50px;
            position: relative;
            z-index: 5;
        }
        
        .emoji {
            font-size: 4rem;
            margin-bottom: 20px;
            display: block;
            animation: bounce 2s ease-in-out infinite;
        }
        
        @keyframes bounce {
            0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
            40% { transform: translateY(-10px); }
            60% { transform: translateY(-5px); }
        }
        
        h1 {
            font-size: 3rem;
            font-weight: 900;
            background: linear-gradient(45deg, #667eea, #764ba2);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 15px;
            text-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }
        
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 25px;
            margin-bottom: 50px;
            position: relative;
            z-index: 5;
        }
        
        .stat-card {
            background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%);
            padding: 30px;
            border-radius: 20px;
            text-align: center;
            box-shadow: 0 15px 30px rgba(0, 0, 0, 0.1);
            border: 2px solid rgba(255, 255, 255, 0.3);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
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
            transition: left 0.5s ease;
        }
        
        .stat-card:hover::before {
            left: 100%;
        }
        
        .stat-card:hover {
            transform: translateY(-10px) scale(1.02);
            box-shadow: 0 25px 50px rgba(0, 0, 0, 0.2);
        }
        
        .stat-number {
            font-size: 2.5rem;
            font-weight: 900;
            color: #fff;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
            margin-bottom: 10px;
        }
        
        .stat-label {
            font-size: 1.1rem;
            font-weight: 600;
            color: rgba(255, 255, 255, 0.9);
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
        }
        
        .questions-container {
            position: relative;
            z-index: 5;
        }
        
        .section-title {
            font-size: 2rem;
            font-weight: 700;
            text-align: center;
            margin-bottom: 40px;
            background: linear-gradient(45deg, #667eea, #764ba2);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        .mistake-card {
            background: #fff;
            border-radius: 20px;
            padding: 30px;
            margin-bottom: 30px;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
            border-left: 5px solid #ff6b6b;
            position: relative;
            transition: all 0.3s ease;
        }
        
        .mistake-card:hover {
            transform: translateX(10px);
            box-shadow: 0 15px 35px rgba(0, 0, 0, 0.15);
        }
        
        .mistake-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 2px solid #f0f0f0;
        }
        
        .question-number {
            background: linear-gradient(45deg, #ff6b6b, #ee5a24);
            color: white;
            padding: 10px 20px;
            border-radius: 15px;
            font-weight: 700;
            font-size: 1.1rem;
        }
        
        .section-badge {
            background: linear-gradient(45deg, #667eea, #764ba2);
            color: white;
            padding: 8px 16px;
            border-radius: 12px;
            font-size: 0.9rem;
            font-weight: 600;
        }
        
        .question-text {
            font-size: 1.3rem;
            font-weight: 600;
            color: #2c3e50;
            margin-bottom: 25px;
            line-height: 1.8;
            padding: 20px;
            background: linear-gradient(135deg, #f8f9fa, #e9ecef);
            border-radius: 15px;
            border-right: 4px solid #667eea;
        }
        
        .answer-section {
            display: grid;
            gap: 15px;
        }
        
        .answer-item {
            padding: 15px 20px;
            border-radius: 12px;
            font-weight: 600;
            border: 2px solid transparent;
            transition: all 0.3s ease;
        }
        
        .user-answer {
            background: linear-gradient(135deg, #ff9ff3, #f368e0);
            color: white;
            border-color: #ff6b6b;
        }
        
        .correct-answer {
            background: linear-gradient(135deg, #51cf66, #40c057);
            color: white;
            border-color: #51cf66;
        }
        
        .unanswered {
            background: linear-gradient(135deg, #ffd43b, #fab005);
            color: white;
            border-color: #ffd43b;
        }
        
        .explanation {
            background: linear-gradient(135deg, #e3f2fd, #bbdefb);
            padding: 20px;
            border-radius: 15px;
            margin-top: 20px;
            border-right: 4px solid #2196f3;
        }
        
        .explanation-title {
            font-weight: 700;
            color: #1976d2;
            margin-bottom: 10px;
            font-size: 1.1rem;
        }
        
        .explanation-text {
            color: #0d47a1;
            line-height: 1.7;
        }
        
        .footer {
            text-align: center;
            margin-top: 60px;
            padding-top: 40px;
            border-top: 3px solid rgba(102, 126, 234, 0.3);
            position: relative;
            z-index: 5;
        }
        
        .footer h2 {
            font-size: 1.8rem;
            font-weight: 700;
            background: linear-gradient(45deg, #667eea, #764ba2);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 15px;
        }
        
        .theme-toggle {
            position: fixed;
            top: 20px;
            left: 20px;
            background: linear-gradient(45deg, #667eea, #764ba2);
            color: white;
            border: none;
            border-radius: 50%;
            width: 50px;
            height: 50px;
            font-size: 1.2rem;
            cursor: pointer;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
            transition: all 0.3s ease;
            z-index: 1000;
        }
        
        .theme-toggle:hover {
            transform: scale(1.1) rotate(360deg);
        }
        
        @media (max-width: 768px) {
            .container { padding: 20px; }
            h1 { font-size: 2rem; }
            .stats { grid-template-columns: repeat(2, 1fr); }
            .stat-number { font-size: 2rem; }
            .question-text { font-size: 1.1rem; }
        }
        
        body.dark-mode {
            background: linear-gradient(135deg, #2c3e50 0%, #3498db 100%);
        }
        
        body.dark-mode .container {
            background: rgba(44, 62, 80, 0.95);
            color: #ecf0f1;
        }
        
        body.dark-mode .mistake-card {
            background: #34495e;
            border-left-color: #e74c3c;
        }
        
        body.dark-mode .question-text {
            background: linear-gradient(135deg, #34495e, #2c3e50);
            color: #ecf0f1;
            border-right-color: #3498db;
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
        
        <div class="date-stamp">${currentDate}</div>
        
        <div class="header">
            <div class="emoji">🧠</div>
            <h1>تقرير مراجعة الأخطاء - الاختبار اللفظي المتقدم</h1>
            <p style="font-size: 1.3rem; opacity: 0.8; margin-top: 10px;">
                تحليل تفصيلي لنقاط التحسين وفرص التطوير
            </p>
        </div>

        <div class="stats">
            <div class="stat-card">
                <div class="stat-number">${wrongAnswersCount}</div>
                <div class="stat-label">إجمالي الأخطاء</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">65</div>
                <div class="stat-label">إجمالي الأسئلة</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${testResults.totalScore}</div>
                <div class="stat-label">الإجابات الصحيحة</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${testResults.overallPercentage}%</div>
                <div class="stat-label">النسبة المئوية</div>
            </div>
        </div>

        <div class="questions-container">
            <h2 class="section-title">📝 تفاصيل الأخطاء للمراجعة</h2>

            ${wrongAnswers.map((question, index) => `
                <div class="mistake-card">
                    <div class="mistake-header">
                        <div class="question-number">سؤال ${index + 1}</div>
                        <div class="section-badge">القسم ${question.sectionNumber}</div>
                    </div>
                    
                    <div class="question-text">
                        ${question.text}
                    </div>
                    
                    <div class="answer-section">
                        <div class="answer-item user-answer">
                            <strong>🔴 إجابتك:</strong> ${question.userAnswer}
                        </div>
                        <div class="answer-item correct-answer">
                            <strong>✅ الإجابة الصحيحة:</strong> ${question.correctAnswer}
                        </div>
                    </div>
                    
                    ${question.explanation ? `
                        <div class="explanation">
                            <div class="explanation-title">💡 الشرح والتوضيح:</div>
                            <div class="explanation-text">${question.explanation}</div>
                        </div>
                    ` : ''}
                </div>
            `).join('')}
        </div>

        <div class="footer">
            <h2>🌟 رحلة التطوير المستمر</h2>
            <p style="font-size: 1.2rem; opacity: 0.8; margin-bottom: 20px;">
                كل خطأ هو فرصة للتعلم وخطوة نحو الإتقان والتميز
            </p>
            <p style="font-size: 1rem; opacity: 0.6;">
                تم إنشاء هذا التقرير بواسطة منصة <strong>قدراتك</strong> - منصة شاملة لتطوير القدرات
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
      link.download = `أخطاء-الاختبار-اللفظي-المتقدم-${new Date().toLocaleDateString('ar-EG')}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    };

    const getWrongQuestionIds = (): number[] => {
      const wrongIds: number[] = [];
      testSections.forEach((section, sectionIndex) => {
        section.questions.forEach((question) => {
          const userAnswer = selectedAnswers[`${sectionIndex}-${question.id}`];
          if (userAnswer === undefined || userAnswer !== question.correctOptionIndex) {
            wrongIds.push(question.id);
          }
        });
      });
      return wrongIds;
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
        alert('لا توجد أخطاء للمراجعة! أداء ممتاز 🎉');
        return;
      }

      // حفظ بيانات التحدي
      const challengeData = {
        type: 'mistake_challenge',
        mode: 'advanced_verbal',
        questions: wrongAnswers,
        originalTest: {
          testName: 'الاختبار اللفظي المتقدم',
          subcategory: 'شامل - 5 أقسام',
          originalScore: testResults.totalScore,
          originalTotal: 65
        },
        timeLimit: wrongAnswers.length * 60 // دقيقة لكل سؤال
      };

      localStorage.setItem('mistakeChallenge', JSON.stringify(challengeData));
      setLocation('/mistake-challenge');
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-600 via-green-600 to-amber-600 dark:from-gray-900 dark:via-teal-600/20 dark:to-emerald-600/20 p-4">
        {/* خلفية متحركة */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-gradient-to-r from-blue-400 to-emerald-600 rounded-full opacity-20"
              animate={{
                x: [0, Math.random() * window.innerWidth],
                y: [0, Math.random() * window.innerHeight],
                scale: [0, 1, 0],
              }}
              transition={{
                duration: Math.random() * 10 + 10,
                repeat: Infinity,
                ease: "linear",
              }}
              style={{
                left: Math.random() * window.innerWidth,
                top: Math.random() * window.innerHeight,
              }}
            />
          ))}
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <motion.div
              animate={{ rotateY: [0, 360] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="inline-block mb-6"
            >
              <Trophy className="w-20 h-20 text-yellow-500 drop-shadow-lg" />
            </motion.div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-green-600 to-amber-600 bg-clip-text text-transparent mb-4">
              🎯 نتائج الاختبار اللفظي المتقدم
            </h1>
            <p className="text-2xl text-gray-600 dark:text-gray-300">
              تحليل شامل وتفصيلي لأدائك مع خطة تطوير شخصية
            </p>
          </motion.div>

          {/* النتيجة الإجمالية المحسّنة */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <Card className="relative overflow-hidden bg-gradient-to-r from-blue-500 via-green-600 to-amber-600 text-white shadow-2xl">
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
                <div className="text-3xl font-semibold mb-4">النتيجة الإجمالية</div>
                <div className="text-xl opacity-90 mb-6">
                  {testResults.totalScore} من 65 سؤال صحيح
                </div>
                <div className={`inline-flex items-center gap-3 px-6 py-3 rounded-full text-xl font-bold ${performanceLevel.bgColor} ${performanceLevel.color} bg-white/20 backdrop-blur-sm`}>
                  <span className="text-2xl">{performanceLevel.emoji}</span>
                  {performanceLevel.label}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* نتائج الأقسام المحسّنة */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-8"
          >
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-xl">
              <CardHeader>
                <CardTitle className="text-3xl flex items-center gap-3">
                  <BarChart3 className="w-8 h-8 text-blue-600" />
                  نتائج الأقسام الخمسة
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
                      <div className="text-center p-6 bg-gradient-to-br from-teal-600 to-emerald-600 dark:from-teal-600/20 dark:to-emerald-600/20 rounded-2xl border-2 border-teal-400 dark:border-teal-400 hover:shadow-lg transition-all duration-300 hover:scale-105">
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.5 + index * 0.1, type: "spring" }}
                          className="text-4xl font-bold text-teal-700 dark:text-teal-700 mb-3"
                        >
                          {section.percentage}%
                        </motion.div>
                        <div className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          القسم {section.sectionNumber}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                          {section.score}/13 صحيح
                        </div>
                        <Progress value={section.percentage} className="h-2" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* تحليل الفئات الفرعية المحسّن */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mb-8"
          >
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-xl">
              <CardHeader>
                <CardTitle className="text-3xl flex items-center gap-3">
                  <Target className="w-8 h-8 text-green-600" />
                  تحليل المجالات اللفظية
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
                      className="flex items-center justify-between p-6 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-2xl border border-green-200 dark:border-green-700 hover:shadow-lg transition-all duration-300"
                    >
                      <div className="flex-1">
                        <div className="text-xl font-bold text-gray-800 dark:text-white mb-2">{subcategory}</div>
                        <div className="text-gray-600 dark:text-gray-300">
                          {data.correct} من {data.total} صحيح
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
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
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mb-8"
            >
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
            </motion.div>
          )}

          {/* قسم التحديات والمميزات الجديد */}
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
                    <Zap className="w-8 h-8 text-red-600" />
                    🎯 تحدي مراجعة الأخطاء الذكي
                  </CardTitle>
                  <p className="text-center text-gray-600 dark:text-gray-300 text-lg">
                    حوّل أخطاءك إلى نقاط قوة مع نظام التحدي التفاعلي
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
                          <div className="font-bold text-lg">أسئلة تحتاج مراجعة</div>
                          <div className="text-gray-600 dark:text-gray-400">فرصة ذهبية للتحسن</div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircle className="w-5 h-5" />
                          <span>مراجعة تفاعلية مع شروحات مفصلة</span>
                        </div>
                        <div className="flex items-center gap-2 text-blue-600">
                          <Star className="w-5 h-5" />
                          <span>نظام نقاط مضاعف للتحفيز</span>
                        </div>
                        <div className="flex items-center gap-2 text-green-700">
                          <Award className="w-5 h-5" />
                          <span>شارات إنجاز حصرية</span>
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
                          <Zap className="w-6 h-6" />
                          ابدأ تحدي الأخطاء الآن
                        </motion.div>
                      </Button>

                      <Button
                        onClick={downloadMistakesHTML}
                        variant="outline"
                        className="w-full border-2 border-orange-300 hover:bg-orange-50 text-orange-700 text-lg py-4"
                      >
                        <motion.div
                          animate={{ rotate: [0, 10, -10, 0] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="flex items-center gap-2"
                        >
                          <BookOpen className="w-6 h-6" />
                          تحميل تقرير الأخطاء التفاعلي
                        </motion.div>
                      </Button>

                      <Button
                        onClick={() => setIsSaveFolderDialogOpen(true)}
                        variant="outline"
                        className="w-full border-2 border-green-400 hover:bg-green-100 text-green-700 text-lg py-4"
                        data-testid="button-save-to-folder"
                      >
                        <motion.div
                          animate={{ scale: [1, 1.05, 1] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                          className="flex items-center gap-2"
                        >
                          <FolderPlus className="w-6 h-6" />
                          حفظ الأخطاء في مجلد
                        </motion.div>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Dialog لحفظ الأسئلة في المجلدات */}
          <EnhancedSaveToFolderDialog
            open={isSaveFolderDialogOpen}
            onOpenChange={setIsSaveFolderDialogOpen}
            questionIds={getWrongQuestionIds()}
            saveMode="wrong"
            onSuccess={() => {
              toast({
                title: "✅ تم الحفظ بنجاح",
                description: "تم حفظ الأسئلة الخاطئة في المجلد للمراجعة لاحقاً",
              });
            }}
          />

          {/* الأزرار الرئيسية */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
            className="text-center space-y-4"
          >
            <div className="flex flex-wrap justify-center gap-4">
              <Button
                onClick={() => setLocation('/verbal-tests')}
                className="bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-600 text-white px-8 py-4 text-lg shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <ArrowRight className="w-6 h-6 mr-2" />
                العودة للاختبارات اللفظية
              </Button>
              
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
                className="border-2 border-blue-300 hover:bg-blue-50 text-blue-700 px-8 py-4 text-lg"
              >
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="mr-2"
                >
                  <ArrowLeft className="w-6 h-6" />
                </motion.div>
                إعادة الاختبار
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // Main test interface
  const currentQuestion = testSections[currentSection]?.questions[currentQuestionIndex];

  return (
    <>
      {renderPrayerBreakOverlay()}
      <QiyasExamLayout
        examTitle="اختبار القدرات اللفظية المتقدم"
        questionNumber={currentQuestionIndex + 1}
        totalQuestions={testSections[currentSection].questionCount}
        sectionLabel={testSections[currentSection].name}
        sectionNumber={currentSection + 1}
        totalSections={testSections.length}
        timeLeft={sectionTimeRemaining}
        isTimeUrgent={sectionTimeRemaining < 120}
        questionText={currentQuestion.text}
        options={currentQuestion.options}
        selectedAnswer={selectedAnswers[`${currentSection}-${currentQuestion.id}`] ?? null}
        onSelectAnswer={selectAnswer}
        questionsStatus={testSections[currentSection].questions.map((q, i) => ({
          answered: selectedAnswers[`${currentSection}-${q.id}`] !== undefined,
          bookmarked: bookmarkedQuestions.has(`${currentSection}-${q.id}`)
        }))}
        currentQuestionIndex={currentQuestionIndex}
        onJumpToQuestion={setCurrentQuestionIndex}
        isBookmarked={bookmarkedQuestions.has(`${currentSection}-${currentQuestion.id}`)}
        onToggleBookmark={() => toggleBookmark(currentQuestion.id)}
        onPrev={previousQuestion}
        onNext={nextQuestion}
        onFinish={completeTest}
        canGoPrev={currentQuestionIndex > 0}
        canGoNext={true}
        isLastQuestion={currentQuestionIndex === testSections[currentSection].questionCount - 1 && currentSection === testSections.length - 1}
        userName={(user as any)?.name || (user as any)?.username}
        userId={(user as any)?.id?.toString()}
        questionId={currentQuestion?.id}
        answeredCount={Object.keys(selectedAnswers).filter(k => k.startsWith(`${currentSection}-`)).length}
        topRightSlot={
          <div className="flex items-center gap-2">
            {!hasPrayerBreakBeenUsed && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsPrayerBreak(true);
                  setHasPrayerBreakBeenUsed(true);
                  setPrayerBreakTimeLeft(600);
                }}
                className="flex items-center gap-2 bg-blue-50 text-blue-600 border-blue-200"
              >
                <Moon className="h-4 w-4" />
                <span>استراحة صلاة</span>
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={togglePause}
              title={isPaused ? "استئناف" : "إيقاف مؤقت"}
            >
              {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            </Button>
          </div>
        }
      />
    </>
  );
}