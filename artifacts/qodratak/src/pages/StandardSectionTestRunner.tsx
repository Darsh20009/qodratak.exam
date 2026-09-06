import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import AiReviewingScreen, { WrongQuestion, QuestionExplanation } from '@/components/AiReviewingScreen';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useQuery } from '@tanstack/react-query';
import { useUser } from '@/hooks/use-user';
import {
  Clock,
  CheckCircle,
  X,
  ArrowLeft,
  ArrowRight,
  Home,
  BarChart3,
  Trophy,
  Target,
  Shuffle,
  BookOpen,
  Calculator,
  Eye,
  Moon,
  Bookmark,
  BookmarkCheck
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { SectionReviewModal } from '@/components/SectionReviewModal';
import { QiyasExamLayout } from '@/components/QiyasExamLayout';

interface TestQuestion {
  id: number;
  text: string;
  options: string[];
  correctOptionIndex: number;
  category: string;
  subcategory: string;
  explanation?: string;
  imageUrl?: string;
}

interface TestSection {
  sectionNumber: number;
  name: string;
  type: 'mixed' | 'verbal' | 'quantitative';
  verbalCount: number;
  quantitativeCount: number;
  questionCount: number;
  timeLimit: number; // in minutes
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
}

export function StandardSectionTestRunner() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Test state
  const [currentSection, setCurrentSection] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{[key: string]: number}>({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [sectionTimeRemaining, setSectionTimeRemaining] = useState(0);
  const [testStarted, setTestStarted] = useState(false);
  const [testCompleted, setTestCompleted] = useState(false);
  const [testSections, setTestSections] = useState<TestSection[]>([]);
  const [showSectionTransition, setShowSectionTransition] = useState(false);
  const [testResults, setTestResults] = useState<TestResults | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [showAiReview, setShowAiReview] = useState(false);
  const [wrongQuestionsForAI, setWrongQuestionsForAI] = useState<WrongQuestion[]>([]);
  const [aiExplanations, setAiExplanations] = useState<QuestionExplanation[]>([]);
  const [showBreakScreen, setShowBreakScreen] = useState(false);
  const [breakTimeLeft, setBreakTimeLeft] = useState(30);
  const [showSectionReview, setShowSectionReview] = useState(false);
  const [pendingNextSection, setPendingNextSection] = useState(false);
  const [bookmarkedQuestions, setBookmarkedQuestions] = useState<Set<string>>(new Set());

  const toggleBookmark = (sectionIdx: number, qIdx: number) => {
    const key = `${sectionIdx}-${qIdx}`;
    setBookmarkedQuestions(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const { user } = useUser();

  // Fetch all questions
  const { data: allQuestions = [], isLoading } = useQuery<TestQuestion[]>({
    queryKey: ['/api/questions'],
    queryFn: () => fetch('/api/questions', { credentials: 'include' }).then(response => response.json()),
  });

  // Initialize test sections
  useEffect(() => {
    if (allQuestions.length > 0 && testSections.length === 0) {
      const verbalQuestions = allQuestions.filter(q => q.category === 'verbal');
      const quantitativeQuestions = allQuestions.filter(q => q.category === 'quantitative');
      
      // Properly calculate required questions for all 7 sections
      // Sections 1-3: 13 verbal each = 39
      // Section 4: 13 verbal
      // Section 6: 13 verbal
      // Total: 39 + 13 + 13 = 65 verbal
      // Sections 1-3: 11 quantitative each = 33
      // Section 5: 11 quantitative
      // Section 7: 11 quantitative
      // Total: 33 + 11 + 11 = 55 quantitative
      const requiredVerbal = 65;
      const requiredQuantitative = 55;

      if (verbalQuestions.length < requiredVerbal || quantitativeQuestions.length < requiredQuantitative) {
        toast({
          title: 'خطأ في البيانات',
          description: `عدد الأسئلة غير كافٍ لإنشاء 120 سؤال فريد. مطلوب ${requiredVerbal} سؤال لفظي و ${requiredQuantitative} سؤال كمي، موجود ${verbalQuestions.length} لفظي و ${quantitativeQuestions.length} كمي.`,
          variant: 'destructive'
        });
        setLocation('/question-bank');
        return;
      }

      // Shuffle questions
      const shuffledVerbal = [...verbalQuestions].sort(() => Math.random() - 0.5);
      const shuffledQuantitative = [...quantitativeQuestions].sort(() => Math.random() - 0.5);

      // Build sections with guaranteed unique questions
      const sections: TestSection[] = [
        // Section 1: Mixed (11 quantitative + 13 verbal) - 24 minutes
        {
          sectionNumber: 1,
          name: 'القسم الأول (مختلط)',
          type: 'mixed',
          verbalCount: 13,
          quantitativeCount: 11,
          questionCount: 24,
          timeLimit: 24,
          questions: [
            ...shuffledQuantitative.slice(0, 11),
            ...shuffledVerbal.slice(0, 13)
          ].sort(() => Math.random() - 0.5),
          completed: false
        },
        // Section 2: Mixed (11 quantitative + 13 verbal) - 24 minutes
        {
          sectionNumber: 2,
          name: 'القسم الثاني (مختلط)',
          type: 'mixed',
          verbalCount: 13,
          quantitativeCount: 11,
          questionCount: 24,
          timeLimit: 24,
          questions: [
            ...shuffledQuantitative.slice(11, 22),
            ...shuffledVerbal.slice(13, 26)
          ].sort(() => Math.random() - 0.5),
          completed: false
        },
        // Section 3: Mixed (11 quantitative + 13 verbal) - 24 minutes
        {
          sectionNumber: 3,
          name: 'القسم الثالث (مختلط)',
          type: 'mixed',
          verbalCount: 13,
          quantitativeCount: 11,
          questionCount: 24,
          timeLimit: 24,
          questions: [
            ...shuffledQuantitative.slice(22, 33),
            ...shuffledVerbal.slice(26, 39)
          ].sort(() => Math.random() - 0.5),
          completed: false
        },
        // Section 4: Verbal only (13) - 13 minutes
        {
          sectionNumber: 4,
          name: 'القسم الرابع (لفظي)',
          type: 'verbal',
          verbalCount: 13,
          quantitativeCount: 0,
          questionCount: 13,
          timeLimit: 13,
          questions: shuffledVerbal.slice(39, 52),
          completed: false
        },
        // Section 5: Quantitative only (11) - 11 minutes
        {
          sectionNumber: 5,
          name: 'القسم الخامس (كمي)',
          type: 'quantitative',
          verbalCount: 0,
          quantitativeCount: 11,
          questionCount: 11,
          timeLimit: 11,
          questions: shuffledQuantitative.slice(33, 44),
          completed: false
        },
        // Section 6: Verbal only (13) - 13 minutes
        {
          sectionNumber: 6,
          name: 'القسم السادس (لفظي)',
          type: 'verbal',
          verbalCount: 13,
          quantitativeCount: 0,
          questionCount: 13,
          timeLimit: 13,
          questions: shuffledVerbal.slice(52, 65),
          completed: false
        },
        // Section 7: Quantitative only (11) - 11 minutes
        {
          sectionNumber: 7,
          name: 'القسم السابع (كمي)',
          type: 'quantitative',
          verbalCount: 0,
          quantitativeCount: 11,
          questionCount: 11,
          timeLimit: 11,
          questions: shuffledQuantitative.slice(44, 55),
          completed: false
        }
      ];

      setTestSections(sections);
      setTimeRemaining(120 * 60); // 120 minutes total
      setSectionTimeRemaining(24 * 60); // 24 minutes for first section
    }
  }, [allQuestions, testSections.length, toast, setLocation]);

  // Timer logic
  useEffect(() => {
    if (testStarted && !showBreakScreen && !showSectionReview && !testCompleted && timeRemaining > 0 && sectionTimeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => Math.max(0, prev - 1));
        setSectionTimeRemaining(prev => {
          if (prev <= 1) {
            // Section time is up, move to next section
            moveToNextSection();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [testStarted, showBreakScreen, showSectionReview, testCompleted, timeRemaining, sectionTimeRemaining]);

  // Break screen timer - automatically advances to next section when done
  useEffect(() => {
    if (showBreakScreen && breakTimeLeft > 0) {
      const timer = setInterval(() => {
        setBreakTimeLeft(prev => {
          if (prev <= 1) {
            // Break is over, advance to next section
            advanceToNextSection();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [showBreakScreen, breakTimeLeft]);

  // Helper function to advance to the next section (called after break ends)
  const advanceToNextSection = () => {
    setShowBreakScreen(false);
    setBreakTimeLeft(30);
    setCurrentSection(prev => prev + 1);
    setCurrentQuestionIndex(0);
    const nextSection = testSections[currentSection + 1];
    if (nextSection) {
      setSectionTimeRemaining(nextSection.timeLimit * 60);
    }
  };

  const startTest = () => {
    setTestStarted(true);
  };

  const selectAnswer = (optionIndex: number) => {
    const key = `${currentSection}-${currentQuestionIndex}`;
    setSelectedAnswers(prev => ({
      ...prev,
      [key]: optionIndex
    }));
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < testSections[currentSection].questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const moveToNextSection = async () => {
    // Mark current section as completed
    const updatedSections = [...testSections];
    updatedSections[currentSection].completed = true;
    setTestSections(updatedSections);

    if (currentSection < testSections.length - 1) {
      // Show section review first, then break screen
      setPendingNextSection(true);
      setShowSectionReview(true);
    } else {
      // Last section: show section review then complete
      setPendingNextSection(false);
      setShowSectionReview(true);
    }
  };

  const handleSectionReviewClose = async () => {
    setShowSectionReview(false);
    if (pendingNextSection) {
      setShowBreakScreen(true);
      setBreakTimeLeft(30);
    } else {
      await completeTest();
    }
  };

  const completeTest = async () => {
    setTestCompleted(true);
    
    // Calculate results
    const sectionResults = testSections.map((section, sectionIndex) => {
      let correct = 0;
      section.questions.forEach((question, questionIndex) => {
        const key = `${sectionIndex}-${questionIndex}`;
        const selectedAnswer = selectedAnswers[key];
        if (selectedAnswer === question.correctOptionIndex) {
          correct++;
        }
      });
      
      return {
        sectionNumber: section.sectionNumber,
        score: correct,
        timeSpent: section.timeLimit * 60 - (sectionIndex === currentSection ? sectionTimeRemaining : 0),
        percentage: Math.round((correct / section.questionCount) * 100)
      };
    });

    const totalScore = sectionResults.reduce((sum, s) => sum + s.score, 0);
    const totalQuestions = testSections.reduce((sum, s) => sum + s.questionCount, 0);
    const overallPercentage = Math.round((totalScore / totalQuestions) * 100);

    setTestResults({
      sectionResults,
      totalScore,
      totalTime: 120 * 60 - timeRemaining,
      overallPercentage
    });

    // Build wrong questions for AI review across all sections
    const wrongs: WrongQuestion[] = [];
    testSections.forEach((section, sectionIndex) => {
      section.questions.forEach((question, questionIndex) => {
        const key = `${sectionIndex}-${questionIndex}`;
        const studentAnswer = selectedAnswers[key];
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
    });

    setWrongQuestionsForAI(wrongs);
    setShowAiReview(true);
  };

  const skipBreak = () => {
    // Use the same advance function to ensure consistency
    advanceToNextSection();
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeColor = (seconds: number, limit: number) => {
    const percentage = (seconds / limit) * 100;
    if (percentage > 50) return 'text-green-600 dark:text-green-400';
    if (percentage > 25) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-blue-950 to-teal-500">
        <Card className="w-96">
          <CardContent className="p-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-300">جاري تحميل الاختبار...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show section review after each section
  if (showSectionReview && testSections[currentSection]) {
    const secForReview = testSections[currentSection];
    const reviewQuestions = secForReview.questions.map((q, idx) => {
      const key = `${currentSection}-${idx}`;
      const studentAnswerIdx = selectedAnswers[key];
      return {
        index: idx,
        text: q.text,
        studentAnswer: studentAnswerIdx !== undefined ? q.options[studentAnswerIdx] : null,
        correctAnswer: q.options[q.correctOptionIndex],
        options: q.options,
        isCorrect: studentAnswerIdx !== undefined && studentAnswerIdx === q.correctOptionIndex,
        isBookmarked: bookmarkedQuestions.has(key),
        category: q.category,
        imageUrl: q.imageUrl,
      };
    });
    return (
      <SectionReviewModal
        sectionIndex={currentSection}
        questions={reviewQuestions}
        onClose={handleSectionReviewClose}
        breakDuration={pendingNextSection ? 30 : 0}
      />
    );
  }

  // Show break screen
  if (showBreakScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-blue-950 to-teal-500">
        <Card className="w-full max-w-2xl mx-4">
          <CardHeader className="text-center bg-gradient-to-r from-orange-600 to-rose-600 text-white">
            <CardTitle className="text-3xl flex items-center justify-center gap-2">
              <Moon className="h-8 w-8" />
              استراحة قصيرة
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 text-center">
            <div className="mb-6">
              <div className="text-6xl font-bold text-orange-600 dark:text-orange-400 mb-2">
                {breakTimeLeft}
              </div>
              <p className="text-gray-600 dark:text-gray-300">ثانية متبقية</p>
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 mb-6">
              <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-white">
                انتهى القسم {currentSection + 1}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                استعد للقسم التالي: {testSections[currentSection + 1]?.name}
              </p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                  <div className="text-gray-500 dark:text-gray-400 mb-1">عدد الأسئلة</div>
                  <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                    {testSections[currentSection + 1]?.questionCount}
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                  <div className="text-gray-500 dark:text-gray-400 mb-1">الوقت المخصص</div>
                  <div className="text-xl font-bold text-green-700 dark:text-green-700">
                    {testSections[currentSection + 1]?.timeLimit} دقيقة
                  </div>
                </div>
              </div>
            </div>

            <Button
              onClick={skipBreak}
              className="w-full bg-gradient-to-r from-orange-600 to-rose-600 hover:from-orange-700 hover:to-rose-700 text-white"
              data-testid="button-skip-break"
            >
              تخطي الاستراحة والمتابعة
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show AI review screen
  if (showAiReview) {
    const totalQ = testSections.reduce((s, sec) => s + sec.questionCount, 0);
    const correctQ = testResults?.totalScore || 0;
    return (
      <AiReviewingScreen
        wrongQuestions={wrongQuestionsForAI}
        totalQuestions={totalQ}
        score={correctQ}
        userEmail={user?.email}
        onShowResults={(explanations) => {
          if (explanations) setAiExplanations(explanations);
          setShowAiReview(false);
          setShowResults(true);
        }}
      />
    );
  }

  // Show results
  if (showResults && testResults) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-teal-500 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <Card>
            <CardHeader className="bg-gradient-to-r from-orange-600 to-rose-600 text-white">
              <CardTitle className="text-3xl flex items-center justify-center gap-2">
                <Trophy className="h-8 w-8" />
                نتائج الاختبار القياسي
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              {/* Overall Score */}
              <div className="bg-gradient-to-br from-orange-50 to-rose-50 dark:from-orange-900/10 dark:to-rose-900/10 rounded-lg p-8 mb-8 text-center border-2 border-orange-200 dark:border-orange-800">
                <div className="text-7xl font-bold text-transparent bg-gradient-to-r from-orange-600 to-rose-600 bg-clip-text mb-4">
                  {testResults.overallPercentage}%
                </div>
                <p className="text-xl text-gray-700 dark:text-gray-300 mb-2">
                  {testResults.totalScore} / 120 سؤال صحيح
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  الوقت المستغرق: {formatTime(testResults.totalTime)}
                </p>
              </div>

              {/* Section Results */}
              <div className="mb-8">
                <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-orange-600" />
                  نتائج الأقسام
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {testResults.sectionResults.map((result, index) => {
                    const section = testSections[index];
                    const colors = [
                      'from-blue-500 to-emerald-600',
                      'from-green-600 to-amber-600',
                      'from-amber-500 to-rose-500',
                      'from-blue-500 to-cyan-500',
                      'from-green-600 to-emerald-500',
                      'from-emerald-500 to-teal-500',
                      'from-orange-500 to-amber-500'
                    ];
                    return (
                      <Card key={index} className="border-2">
                        <CardHeader className={`bg-gradient-to-r ${colors[index]} text-white p-4`}>
                          <CardTitle className="text-lg">القسم {result.sectionNumber}</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4">
                          <div className="text-3xl font-bold text-center mb-2 text-gray-900 dark:text-white">
                            {result.percentage}%
                          </div>
                          <p className="text-sm text-center text-gray-600 dark:text-gray-400 mb-2">
                            {result.score} / {section.questionCount}
                          </p>
                          <div className="text-xs text-center text-gray-500 dark:text-gray-400">
                            <Clock className="h-3 w-3 inline mr-1" />
                            {formatTime(result.timeSpent)}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-4">
                <Button
                  onClick={() => setLocation('/question-bank')}
                  variant="outline"
                  className="flex-1"
                  data-testid="button-back-to-bank"
                >
                  <Home className="h-4 w-4 ml-2" />
                  العودة لبنك الأسئلة
                </Button>
                <Button
                  onClick={() => window.location.reload()}
                  className="flex-1 bg-gradient-to-r from-orange-600 to-rose-600 hover:from-orange-700 hover:to-rose-700 text-white"
                  data-testid="button-retry"
                >
                  <Trophy className="h-4 w-4 ml-2" />
                  إعادة الاختبار
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Start screen
  if (!testStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-teal-500 flex items-center justify-center p-4">
        <Card className="w-full max-w-4xl">
          <CardHeader className="bg-gradient-to-r from-orange-600 to-rose-600 text-white">
            <CardTitle className="text-3xl flex items-center justify-center gap-2">
              <Shuffle className="h-8 w-8" />
              الاختبار القياسي (7 أقسام)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-orange-50 to-rose-50 dark:from-orange-900/10 dark:to-rose-900/10 rounded-lg p-6 border-2 border-orange-200 dark:border-orange-800">
                <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                  <Target className="h-5 w-5 text-orange-600" />
                  معلومات الاختبار
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">7</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">أقسام</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-700 dark:text-green-700">120</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">سؤال</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">120</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">دقيقة</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-rose-600 dark:text-rose-400">72</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">سؤال مختلط</div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-gray-900 dark:text-white">توزيع الأقسام:</h4>
                {[
                  { num: 1, desc: 'القسم الأول: 24 سؤال مختلط (11 كمي + 13 لفظي) - 24 دقيقة' },
                  { num: 2, desc: 'القسم الثاني: 24 سؤال مختلط (11 كمي + 13 لفظي) - 24 دقيقة' },
                  { num: 3, desc: 'القسم الثالث: 24 سؤال مختلط (11 كمي + 13 لفظي) - 24 دقيقة' },
                  { num: 4, desc: 'القسم الرابع: 13 سؤال لفظي - 13 دقيقة' },
                  { num: 5, desc: 'القسم الخامس: 11 سؤال كمي - 11 دقيقة' },
                  { num: 6, desc: 'القسم السادس: 13 سؤال لفظي - 13 دقيقة' },
                  { num: 7, desc: 'القسم السابع: 11 سؤال كمي - 11 دقيقة' }
                ].map(section => (
                  <div key={section.num} className="flex items-center gap-3 bg-white dark:bg-gray-800 rounded-lg p-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-orange-600 to-rose-600 text-white flex items-center justify-center font-bold">
                      {section.num}
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{section.desc}</p>
                  </div>
                ))}
              </div>

              <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Target className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-amber-800 dark:text-amber-200">
                    <p className="font-medium mb-1">تعليمات مهمة:</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li>هذا اختبار محاكاة كامل للاختبار الحقيقي</li>
                      <li>يجب إكمال جميع الأقسام السبعة بالترتيب</li>
                      <li>الوقت محدد لكل قسم ولا يمكن نقله بين الأقسام</li>
                      <li>استراحة 30 ثانية بين كل قسم وآخر</li>
                    </ul>
                  </div>
                </div>
              </div>

              <Button
                onClick={startTest}
                className="w-full bg-gradient-to-r from-orange-600 to-rose-600 hover:from-orange-700 hover:to-rose-700 text-white py-6 text-lg font-bold"
                data-testid="button-start-test"
              >
                ابدأ الاختبار الآن
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Test screen
  const currentSectionData = testSections[currentSection];
  const currentQuestion = currentSectionData?.questions[currentQuestionIndex];
  const currentQuestionKey = `${currentSection}-${currentQuestionIndex}`;
  const selectedAnswer = selectedAnswers[currentQuestionKey] ?? null;

  if (!currentQuestion) {
    return null;
  }

  const questionsStatus = currentSectionData.questions.map((_, i) => ({
    answered: selectedAnswers[`${currentSection}-${i}`] !== undefined,
    bookmarked: bookmarkedQuestions.has(`${currentSection}-${i}`)
  }));

  const answeredCount = questionsStatus.filter(q => q.answered).length;

  return (
    <QiyasExamLayout
      examTitle="الاختبار القياسي"
      questionNumber={currentQuestionIndex + 1}
      totalQuestions={currentSectionData.questionCount}
      sectionLabel={currentSectionData.name}
      sectionNumber={currentSection + 1}
      totalSections={testSections.length}
      timeLeft={sectionTimeRemaining}
      isTimeUrgent={sectionTimeRemaining < 300}
      questionText={currentQuestion.text}
      questionImageUrl={currentQuestion.imageUrl}
      options={currentQuestion.options}
      selectedAnswer={selectedAnswer}
      onSelectAnswer={selectAnswer}
      questionsStatus={questionsStatus}
      currentQuestionIndex={currentQuestionIndex}
      onJumpToQuestion={(index) => setCurrentQuestionIndex(index)}
      isBookmarked={bookmarkedQuestions.has(currentQuestionKey)}
      onToggleBookmark={() => toggleBookmark(currentSection, currentQuestionIndex)}
      onPrev={previousQuestion}
      onNext={nextQuestion}
      onFinish={moveToNextSection}
      canGoPrev={currentQuestionIndex > 0}
      canGoNext={currentQuestionIndex < currentSectionData.questions.length - 1}
      isLastQuestion={currentQuestionIndex === currentSectionData.questions.length - 1}
      answeredCount={answeredCount}
      userName={user?.username || user?.name}
      userId={user?.id?.toString()}
      sectionQuestionsCount={currentSectionData.questionCount}
      onEndSection={moveToNextSection}
    />
  );
}
