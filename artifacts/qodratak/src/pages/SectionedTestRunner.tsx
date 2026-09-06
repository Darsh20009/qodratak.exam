import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAntiCheat } from '@/hooks/useAntiCheat';
import { AntiCheatWarning } from '@/components/AntiCheatWarning';
import { useParams, useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EndTestButton } from '@/components/ui/EndTestButton';
import { PointsAndRankingCard } from '@/components/test-results/PointsAndRankingCard';
import { EnhancedSaveToFolderDialog } from '@/components/EnhancedSaveToFolderDialog';
import { 
  Clock, 
  Play, 
  SkipForward, 
  SkipBack, 
  CheckCircle, 
  XCircle, 
  BookOpen, 
  Calculator,
  Home,
  Target,
  Trophy,
  Brain,
  Zap,
  Star,
  Coffee,
  ArrowRight,
  ArrowLeft,
  Timer,
  Download,
  X,
  AlertCircle,
  ChevronDown,
  Eye,
  FolderPlus,
  Bookmark,
  BookmarkCheck
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion"; // Import motion for animations
import { SectionReviewModal } from "@/components/SectionReviewModal";
import AiReviewingScreen, { WrongQuestion, QuestionExplanation } from '@/components/AiReviewingScreen';

import { QiyasExamLayout } from '@/components/QiyasExamLayout';
import { useUser } from '@/hooks/use-user';

interface Question {
  id: number;
  text: string;
  options: string[];
  correctOptionIndex: number;
  explanation?: string;
  category: string;
  subcategory?: string;
  difficulty?: string;
  imageUrl?: string;
}

interface TestAnswer {
  questionNumber: number;
  selectedAnswer: number;
  correct: boolean;
  question: Question;
  timeSpent: number;
}

interface Section {
  number: number;
  questions: Question[];
  answers: { [key: number]: number };
  completed: boolean;
  reviewTime?: number;
}

export default function SectionedTestRunner() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const testType = params.type as 'verbal' | 'quantitative';
  const testNumber = parseInt(params.testNumber || '1');

  const [questions, setQuestions] = useState<Question[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [currentSection, setCurrentSection] = useState(0);
  const [currentQuestionInSection, setCurrentQuestionInSection] = useState(0);
  const [timeLeft, setTimeLeft] = useState(50 * 60); // 50 minutes total
  const [isStarted, setIsStarted] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showAiReview, setShowAiReview] = useState(false);
  const [aiExplanations, setAiExplanations] = useState<QuestionExplanation[]>([]);
  const [wrongQuestionsForAI, setWrongQuestionsForAI] = useState<WrongQuestion[]>([]);
  const [testAnswers, setTestAnswers] = useState<TestAnswer[]>([]);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const questionTimesRef = useRef<{[key: string]: number}>({});
  const timeLeftRef = useRef(50 * 60);
  const [loading, setLoading] = useState(true);
  const [isPausedByAntiCheat, setIsPausedByAntiCheat] = useState(false);
  const { user } = useUser();

  const { violations, lastViolationType, isWarningVisible, dismissWarning } = useAntiCheat({
    enabled: isStarted && !isCompleted,
    maxViolations: 5,
    onViolation: () => { setIsPausedByAntiCheat(true); setTimeout(() => setIsPausedByAntiCheat(false), 3000); },
    onMaxViolations: () => { setIsCompleted(true); },
  });

  // Section-specific states
  const [showSectionReview, setShowSectionReview] = useState(false);
  const [showBreakScreen, setShowBreakScreen] = useState(false);
  const [breakTimeLeft, setBreakTimeLeft] = useState(30);
  const [canSkipBreak, setCanSkipBreak] = useState(false);
  const [selectedSectionDetails, setSelectedSectionDetails] = useState<number | null>(null);

  // Bookmark states
  const [bookmarkedQuestions, setBookmarkedQuestions] = useState<Set<string>>(new Set());

  const toggleBookmark = (sectionIdx: number, qIdx: number) => {
    const key = `${sectionIdx}-${qIdx}`;
    setBookmarkedQuestions(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  // Save to folder states
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveMode, setSaveMode] = useState<"all" | "wrong" | "unanswered">("all");
  const [questionsToSave, setQuestionsToSave] = useState<number[]>([]);

  // Load questions and divide into 5 sections
  useEffect(() => {
    const loadQuestions = async () => {
      try {
        const response = await fetch('/api/questions', { credentials: 'include' });
        const allQuestions = await response.json();

        const filteredQuestions = allQuestions.filter((q: Question) => 
          q.category === testType
        );

        const startIndex = (testNumber - 1) * 50;
        const endIndex = Math.min(startIndex + 50, filteredQuestions.length);
        const testQuestions = filteredQuestions.slice(startIndex, endIndex);

        // Divide into 5 sections of 10 questions each
        const sectionsData: Section[] = [];
        for (let i = 0; i < 5; i++) {
          const sectionQuestions = testQuestions.slice(i * 10, (i + 1) * 10);
          sectionsData.push({
            number: i + 1,
            questions: sectionQuestions,
            answers: {},
            completed: false
          });
        }

        setQuestions(testQuestions);
        setSections(sectionsData);
        setLoading(false);
      } catch (error) {
        console.error('Error loading questions:', error);
        setLoading(false);
      }
    };

    loadQuestions();
  }, [testType, testNumber]);

  // Main timer effect
  useEffect(() => {
    if (!isStarted || isCompleted || showBreakScreen || showSectionReview) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        const next = prev <= 1 ? 0 : prev - 1;
        timeLeftRef.current = next;
        if (prev <= 1) {
          completeTest();
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isStarted, isCompleted, showBreakScreen, showSectionReview]);

  // Break timer effect
  useEffect(() => {
    if (!showBreakScreen) return;

    const timer = setInterval(() => {
      setBreakTimeLeft(prev => {
        if (prev <= 1) {
          continueFromBreak();
          return 30;
        }
        if (prev <= 10) {
          setCanSkipBreak(true);
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [showBreakScreen]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startTest = () => {
    setIsStarted(true);
    setQuestionStartTime(Date.now());
  };

  const getCurrentQuestion = () => {
    if (currentSection >= sections.length) return null;
    const section = sections[currentSection];
    if (currentQuestionInSection >= section.questions.length) return null;
    return section.questions[currentQuestionInSection];
  };

  const selectAnswer = (answerIndex: number) => {
    setSections(prev => {
      const updated = [...prev];
      updated[currentSection].answers[currentQuestionInSection] = answerIndex;
      return updated;
    });
  };

  const recordCurrentQuestionTime = () => {
    const key = `${currentSection}-${currentQuestionInSection}`;
    const elapsed = Math.round((Date.now() - questionStartTime) / 1000);
    questionTimesRef.current[key] = (questionTimesRef.current[key] || 0) + elapsed;
  };

  const nextQuestion = () => {
    recordCurrentQuestionTime();
    const section = sections[currentSection];
    if (currentQuestionInSection < section.questions.length - 1) {
      setCurrentQuestionInSection(prev => prev + 1);
      setQuestionStartTime(Date.now());
    } else {
      // End of section - show review
      showSectionReviewDialog();
    }
  };

  const previousQuestion = () => {
    recordCurrentQuestionTime();
    if (currentQuestionInSection > 0) {
      setCurrentQuestionInSection(prev => prev - 1);
      setQuestionStartTime(Date.now());
    }
  };

  const jumpToQuestionInSection = (index: number) => {
    recordCurrentQuestionTime();
    setCurrentQuestionInSection(index);
    setQuestionStartTime(Date.now());
  };

  const showSectionReviewDialog = () => {
    setShowSectionReview(true);
  };

  const completeSectionReview = () => {
    setSections(prev => {
      const updated = [...prev];
      updated[currentSection].completed = true;
      return updated;
    });

    setShowSectionReview(false);

    if (currentSection < sections.length - 1) {
      // Start break before next section
      setShowBreakScreen(true);
      setBreakTimeLeft(30);
      setCanSkipBreak(false);
    } else {
      // Test completed
      completeTest();
    }
  };

  const continueFromBreak = () => {
    setShowBreakScreen(false);
    setCurrentSection(prev => prev + 1);
    setCurrentQuestionInSection(0);
    setQuestionStartTime(Date.now());
  };

  const skipBreak = () => {
    continueFromBreak();
  };

  const completeTest = useCallback(async () => {
    if (isCompleted) return;

    setIsCompleted(true);

    // Calculate results
    const answers: TestAnswer[] = [];
    let totalQuestions = 0;

    sections.forEach((section, sectionIndex) => {
      section.questions.forEach((question, questionIndex) => {
        const selectedAnswer = section.answers[questionIndex];
        const correct = selectedAnswer !== undefined && selectedAnswer === question.correctOptionIndex;
        const timeKey = `${sectionIndex}-${questionIndex}`;
        const timeSpent = questionTimesRef.current[timeKey] || 0;

        answers.push({
          questionNumber: totalQuestions + 1,
          selectedAnswer: selectedAnswer ?? -1,
          correct,
          question,
          timeSpent
        });

        totalQuestions++;
      });
    });

    setTestAnswers(answers);

    // Calculate score
    const correctAnswers = answers.filter(a => a.correct).length;
    const score = Math.round((correctAnswers / answers.length) * 100);

    // Save results
    const testResults = JSON.parse(localStorage.getItem('questionBankResults') || '{}');
    const testKey = `${testType}_${testNumber}`;
    testResults[testKey] = {
      score,
      answers,
      completedAt: new Date().toISOString(),
      sections: sections.map(s => ({
        number: s.number,
        completed: s.completed,
        answeredQuestions: Object.keys(s.answers).length
      }))
    };
    localStorage.setItem('questionBankResults', JSON.stringify(testResults));

    // إرسال النتيجة للسيرفر لحفظ النقاط
    if (user?.id) {
      try {
        const totalQuestions = answers.length;
        const answeredCount = answers.filter(a => a.selectedAnswer >= 0).length;
        const skippedQuestions = totalQuestions - answeredCount;
        
        const response = await fetch('/api/test-results', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            testType: testType,
            difficulty: 'intermediate',
            score: correctAnswers,
            totalQuestions,
            timeTaken: Math.round(((50 * 60) - timeLeftRef.current) / 60),
            skippedQuestions
          })
        }).then(r => r.json()) as any;

        // حفظ النقاط المكتسبة للعرض في صفحة النتائج
        if (response?.pointsEarned !== undefined) {
          localStorage.setItem('lastExamPointsEarned', response.pointsEarned.toString());
        }
      } catch (error) {
        console.error("Error saving test results:", error);
      }
    }

    // Update progress
    const progress = JSON.parse(localStorage.getItem('questionBankProgress') || '{}');
    if (!progress[testType]) progress[testType] = [];

    const testIndex = progress[testType].findIndex((t: any) => t.testNumber === testNumber);
    if (testIndex >= 0) {
      progress[testType][testIndex] = { testNumber, completed: true, score };
    } else {
      progress[testType].push({ testNumber, completed: true, score });
    }

    localStorage.setItem('questionBankProgress', JSON.stringify(progress));

    // Extract wrong questions for AI review
    const wrongQs: WrongQuestion[] = answers
      .filter(a => !a.correct && a.selectedAnswer !== -1)
      .map(a => ({
        questionText: a.question.text,
        options: a.question.options,
        studentAnswerIndex: a.selectedAnswer >= 0 ? a.selectedAnswer : null,
        correctAnswerIndex: a.question.correctOptionIndex,
        category: a.question.category,
        subcategory: a.question.subcategory,
      }));
    setWrongQuestionsForAI(wrongQs);
    setShowAiReview(true);
  }, [sections, testType, testNumber, isCompleted, user?.id]);

  const getOverallProgress = () => {
    const totalQuestions = sections.reduce((sum, section) => sum + section.questions.length, 0);
    const answeredQuestions = sections.reduce((sum, section) => 
      sum + Object.keys(section.answers).length, 0
    );
    return totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;
  };

  const getSectionProgress = (sectionIndex: number) => {
    const section = sections[sectionIndex];
    if (!section) return 0;
    const answered = Object.keys(section.answers).length;
    return (answered / section.questions.length) * 100;
  };

  // Helper to get the currently selected answer for the current question
  const getSelectedAnswer = () => {
    const section = sections[currentSection];
    return section?.answers[currentQuestionInSection];
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">جاري تحميل الاختبار...</p>
        </div>
      </div>
    );
  }

  if (!isStarted) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <CardHeader className="text-center pb-6">
            <div className={cn(
              "w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center",
              testType === 'verbal' 
                ? 'bg-gradient-to-r from-blue-500 to-teal-500' 
                : 'bg-gradient-to-r from-green-600 to-amber-600'
            )}>
              {testType === 'verbal' ? (
                <BookOpen className="h-10 w-10 text-white" />
              ) : (
                <Calculator className="h-10 w-10 text-white" />
              )}
            </div>
            <CardTitle className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              اختبار {testType === 'verbal' ? 'القدرات اللفظية' : 'القدرات الكمية'}
            </CardTitle>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              الاختبار رقم {testNumber} • نظام الأقسام الجديد
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Test Structure */}
            <div className="grid grid-cols-5 gap-4">
              {Array.from({ length: 5 }, (_, i) => (
                <div key={i} className="text-center">
                  <div className={cn(
                    "w-12 h-12 rounded-lg mx-auto mb-2 flex items-center justify-center text-white font-bold",
                    testType === 'verbal' 
                      ? 'bg-gradient-to-r from-blue-500 to-teal-500' 
                      : 'bg-gradient-to-r from-green-600 to-amber-600'
                  )}>
                    {i + 1}
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    القسم {i + 1}
                  </p>
                </div>
              ))}
            </div>

            {/* Test Info */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-4 flex items-center gap-2">
                <Brain className="h-5 w-5" />
                نظام الاختبار الجديد
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800 dark:text-blue-200">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  5 أقسام، كل قسم 10 أسئلة
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  50 دقيقة إجمالي
                </div>
                <div className="flex items-center gap-2">
                  <Coffee className="h-4 w-4" />
                  استراحة 30 ثانية بين الأقسام
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  مراجعة نهاية كل قسم
                </div>
              </div>
            </div>

            {/* Start Button */}
            <Button 
              onClick={startTest}
              size="lg"
              className={cn(
                "w-full h-14 text-lg font-semibold text-white shadow-lg hover:shadow-xl transition-all duration-300",
                testType === 'verbal' 
                  ? 'bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-500' 
                  : 'bg-gradient-to-r from-green-600 to-amber-600 hover:from-green-600 hover:to-amber-600'
              )}
            >
              <Play className="h-6 w-6 mr-3" />
              بدء الاختبار
            </Button>

            <Button 
              onClick={() => setLocation('/question-bank')}
              variant="outline"
              className="w-full"
            >
              <Home className="h-4 w-4 mr-2" />
              العودة إلى بنك الأسئلة
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Break Screen
  if (showBreakScreen) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-500 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl">
          <CardHeader className="text-center pb-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-green-400 to-blue-500 mx-auto mb-4 flex items-center justify-center">
              <Coffee className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              استراحة بين الأقسام
            </CardTitle>
            <p className="text-gray-600 dark:text-gray-400">
              أنهيت القسم {currentSection}، استعد للقسم التالي
            </p>
          </CardHeader>

          <CardContent className="text-center space-y-6">
            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6">
              <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                {formatTime(breakTimeLeft)}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                الوقت المتبقي للاستراحة
              </p>
            </div>

            <div className="space-y-4">
              <p className="text-gray-700 dark:text-gray-300">
                خذ نفسًا عميقًا واستعد للقسم القادم
              </p>

              {/* Skip button - always available */}
              <Button 
                onClick={skipBreak}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium py-3 rounded-xl shadow-lg transition-all duration-300 hover:scale-105"
              >
                <SkipForward className="h-5 w-5 mr-2" />
                تخطي الاستراحة والمتابعة
              </Button>

              {/* Auto-continue button with countdown */}
              <div className="text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  أو انتظر {formatTime(breakTimeLeft)} للمتابعة تلقائياً
                </p>
                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-teal-500 h-2 rounded-full transition-all duration-1000"
                    style={{ width: `${((30 - breakTimeLeft) / 30) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Section Review Dialog
  if (showSectionReview && sections[currentSection]) {
    const sectionForReview = sections[currentSection];
    const reviewQuestions = sectionForReview.questions.map((q, idx) => {
      const studentAnswerIdx = sectionForReview.answers[idx];
      return {
        index: idx,
        text: q.text,
        studentAnswer: studentAnswerIdx !== undefined ? q.options[studentAnswerIdx] : null,
        correctAnswer: q.options[q.correctOptionIndex],
        options: q.options,
        isCorrect: studentAnswerIdx !== undefined && studentAnswerIdx === q.correctOptionIndex,
        isBookmarked: bookmarkedQuestions.has(`${currentSection}-${idx}`),
        category: q.subcategory || q.category,
        imageUrl: q.imageUrl,
      };
    });

    return (
      <SectionReviewModal
        sectionIndex={currentSection}
        questions={reviewQuestions}
        onClose={completeSectionReview}
        breakDuration={30}
      />
    );
  }

  // Helper function to calculate section results
  const getSectionResults = (sectionIndex: number) => {
    const section = sections[sectionIndex];
    const results = section.questions.map((question, qIndex) => {
      const selectedAnswer = section.answers[qIndex];
      const correct = selectedAnswer !== undefined && selectedAnswer === question.correctOptionIndex;
      return {
        question,
        selectedAnswer,
        correct,
        questionNumber: qIndex + 1
      };
    });

    const correctCount = results.filter(r => r.correct).length;
    const incorrectCount = results.filter(r => !r.correct && r.selectedAnswer !== undefined).length;
    const unansweredCount = results.filter(r => r.selectedAnswer === undefined).length;

    return { results, correctCount, incorrectCount, unansweredCount };
  };

  // Function to get question IDs based on save mode
  const getQuestionIdsForSaveMode = (mode: "all" | "wrong" | "unanswered"): number[] => {
    const allQuestionIds: number[] = [];
    
    sections.forEach((section) => {
      section.questions.forEach((question, qIndex) => {
        const selectedAnswer = section.answers[qIndex];
        const isCorrect = selectedAnswer !== undefined && selectedAnswer === question.correctOptionIndex;
        const isAnswered = selectedAnswer !== undefined;

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
      // Show a message if there are no questions matching the selected mode
      return;
    }
    setSaveMode(mode);
    setQuestionsToSave(questionIds);
    setShowSaveDialog(true);
  };

  // Function to generate HTML for mistakes download
  const generateMistakesHTML = () => {
    const mistakesBySection: any[] = [];

    sections.forEach((section, sectionIndex) => {
      const { results } = getSectionResults(sectionIndex);
      const mistakes = results.filter(r => !r.correct);

      if (mistakes.length > 0) {
        mistakesBySection.push({
          sectionNumber: sectionIndex + 1,
          mistakes
        });
      }
    });

    const letterOptions = ['أ', 'ب', 'ج', 'د'];

    const html = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>الأخطاء - اختبار ${testType === 'verbal' ? 'القدرات اللفظية' : 'القدرات الكمية'} رقم ${testNumber}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700&display=swap');

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Cairo', sans-serif;
            line-height: 1.6;
            color: #1f2937;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }

        .container {
            max-width: 900px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            box-shadow: 0 25px 50px rgba(0,0,0,0.15);
            overflow: hidden;
        }

        .header {
            background: linear-gradient(135deg, #ff6b6b, #feca57);
            color: white;
            padding: 30px;
            text-align: center;
            position: relative;
            overflow: hidden;
        }

        .header::before {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
            animation: float 6s ease-in-out infinite;
        }

        @keyframes float {
            0%, 100% { transform: translate(0, 0) rotate(0deg); }
            50% { transform: translate(-20px, -10px) rotate(180deg); }
        }

        .header h1 {
            font-size: 2.5rem;
            font-weight: 700;
            margin-bottom: 10px;
            position: relative;
            z-index: 1;
        }

        .header p {
            font-size: 1.2rem;
            opacity: 0.9;
            position: relative;
            z-index: 1;
        }

        .content {
            padding: 40px;
        }

        .section {
            margin-bottom: 40px;
            border: 2px solid #e5e7eb;
            border-radius: 15px;
            overflow: hidden;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .section:hover {
            transform: translateY(-5px);
            box-shadow: 0 15px 30px rgba(0,0,0,0.1);
        }

        .section-header {
            background: linear-gradient(135deg, #3b82f6, #8b5cf6);
            color: white;
            padding: 20px;
            font-size: 1.3rem;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .section-icon {
            width: 30px;
            height: 30px;
            background: rgba(255,255,255,0.2);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
        }

        .question {
            border-bottom: 1px solid #f3f4f6;
            padding: 25px;
            transition: background-color 0.3s ease;
        }

        .question:last-child {
            border-bottom: none;
        }

        .question:hover {
            background-color: #f9fafb;
        }

        .question-header {
            display: flex;
            align-items: center;
            gap: 15px;
            margin-bottom: 15px;
        }

        .question-number {
            background: linear-gradient(135deg, #f59e0b, #f97316);
            color: white;
            width: 35px;
            height: 35px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 600;
            font-size: 0.9rem;
        }

        .question-text {
            font-size: 1.1rem;
            font-weight: 600;
            color: #1f2937;
            line-height: 1.7;
        }

        .options {
            margin: 20px 0;
        }

        .option {
            display: flex;
            align-items: center;
            gap: 12px;
            margin: 12px 0;
            padding: 12px;
            border-radius: 10px;
            transition: all 0.3s ease;
        }

        .option.correct {
            background: linear-gradient(135deg, #10b981, #059669);
            color: white;
            box-shadow: 0 5px 15px rgba(16, 185, 129, 0.3);
        }

        .option.selected-wrong {
            background: linear-gradient(135deg, #ef4444, #dc2626);
            color: white;
            box-shadow: 0 5px 15px rgba(239, 68, 68, 0.3);
        }

        .option.unselected {
            background: #f3f4f6;
            color: #6b7280;
        }

        .option-letter {
            width: 30px;
            height: 30px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 600;
            font-size: 0.9rem;
        }

        .correct .option-letter {
            background: rgba(255,255,255,0.2);
        }

        .selected-wrong .option-letter {
            background: rgba(255,255,255,0.2);
        }

        .unselected .option-letter {
            background: #d1d5db;
            color: #374151;
        }

        .answer-status {
            margin-top: 15px;
            padding: 12px;
            border-radius: 10px;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .answer-status.wrong {
            background: #fef2f2;
            color: #dc2626;
            border: 1px solid #fecaca;
        }

        .answer-status.unanswered {
            background: #fffbeb;
            color: #f59e0b;
            border: 1px solid #fed7aa;
        }

        .summary {
            background: linear-gradient(135deg, #1f2937, #374151);
            color: white;
            padding: 30px;
            margin: 30px 0;
            border-radius: 15px;
            text-align: center;
        }

        .summary h2 {
            font-size: 1.8rem;
            margin-bottom: 20px;
        }

        .summary-stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }

        .stat {
            background: rgba(255,255,255,0.1);
            padding: 15px;
            border-radius: 10px;
            backdrop-filter: blur(10px);
        }

        .stat-number {
            font-size: 2rem;
            font-weight: 700;
            margin-bottom: 5px;
        }

        .stat-label {
            font-size: 0.9rem;
            opacity: 0.8;
        }

        .footer {
            text-align: center;
            padding: 20px;
            color: #6b7280;
            font-size: 0.9rem;
            border-top: 1px solid #e5e7eb;
        }

        @media (max-width: 768px) {
            .container {
                margin: 10px;
                border-radius: 15px;
            }

            .content {
                padding: 20px;
            }

            .header h1 {
                font-size: 2rem;
            }

            .summary-stats {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📚 مراجعة الأخطاء</h1>
            <p>اختبار ${testType === 'verbal' ? 'القدرات اللفظية' : 'القدرات الكمية'} رقم ${testNumber}</p>
        </div>

        <div class="content">
            <div class="summary">
                <h2>📊 ملخص النتائج</h2>
                <div class="summary-stats">
                    <div class="stat">
                        <div class="stat-number">${testAnswers.filter(a => a.correct).length}</div>
                        <div class="stat-label">إجابات صحيحة</div>
                    </div>
                    <div class="stat">
                        <div class="stat-number">${testAnswers.filter(a => !a.correct && a.selectedAnswer !== -1).length}</div>
                        <div class="stat-label">إجابات خاطئة</div>
                    </div>
                    <div class="stat">
                        <div class="stat-number">${testAnswers.filter(a => a.selectedAnswer === -1).length}</div>
                        <div class="stat-label">غير مجاب</div>
                    </div>
                    <div class="stat">
                        <div class="stat-number">${Math.round((testAnswers.filter(a => a.correct).length / testAnswers.length) * 100)}%</div>
                        <div class="stat-label">النتيجة الإجمالية</div>
                    </div>
                </div>
            </div>

            ${mistakesBySection.map(({ sectionNumber, mistakes }) => `
                <div class="section">
                    <div class="section-header">
                        <div class="section-icon">${sectionNumber}</div>
                        القسم ${sectionNumber} - ${mistakes.length} خطأ
                    </div>

                    ${mistakes.map(({ question, selectedAnswer, questionNumber }: { question: Question, selectedAnswer: number | undefined, questionNumber: number }) => `
                        <div class="question">
                            <div class="question-header">
                                <div class="question-number">${questionNumber}</div>
                                <div class="question-text">${question.text}</div>
                            </div>

                            <div class="options">
                                ${question.options.map((option: string, optIndex: number) => `
                                    <div class="option ${
                                      optIndex === question.correctOptionIndex ? 'correct' :
                                      optIndex === selectedAnswer ? 'selected-wrong' : 'unselected'
                                    }">
                                        <div class="option-letter">${letterOptions[optIndex]}</div>
                                        <div>${option}</div>
                                    </div>
                                `).join('')}
                            </div>

                            <div class="answer-status ${selectedAnswer === undefined ? 'unanswered' : 'wrong'}">
                                ${selectedAnswer === undefined 
                                  ? '⚠️ لم يتم الإجابة على هذا السؤال'
                                  : `❌ إجابتك: ${letterOptions[selectedAnswer]} | الإجابة الصحيحة: ${letterOptions[question.correctOptionIndex]}`
                                }
                            </div>
                        </div>
                    `).join('')}
                </div>
            `).join('')}
        </div>

        <div class="footer">
            تم إنشاء هذا التقرير بواسطة منصة قدراتك - ${new Date().toLocaleDateString('ar-SA')}
        </div>
    </div>
</body>
</html>`;

    return html;
  };

  // Function to download mistakes as HTML
  const downloadMistakes = () => {
    const html = generateMistakesHTML();
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `أخطاء-اختبار-${testType === 'verbal' ? 'لفظي' : 'كمي'}-${testNumber}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // AI Review Screen (shown before results)
  if (showAiReview) {
    const totalQ = testAnswers.length;
    const scoreVal = testAnswers.filter(a => a.correct).length;
    return (
      <AiReviewingScreen
        wrongQuestions={wrongQuestionsForAI}
        totalQuestions={totalQ}
        score={scoreVal}
        userEmail={user?.email}
        onShowResults={(explanations) => {
          if (explanations) setAiExplanations(explanations);
          setShowAiReview(false);
          setShowResults(true);
        }}
        onSendEmail={async () => {
          try {
            if (!user?.id) return;
            await fetch('/api/ai/send-results-email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({
                testType: testType === 'verbal' ? 'اختبار لفظي' : 'اختبار كمي',
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

  // Results Screen with detailed section analysis
  if (showResults) {
    const correctAnswers = testAnswers.filter(a => a.correct).length;
    const incorrectAnswers = testAnswers.filter(a => !a.correct && a.selectedAnswer !== -1).length;
    const unansweredQuestions = testAnswers.filter(a => a.selectedAnswer === -1).length;
    const score = Math.round((correctAnswers / testAnswers.length) * 100);

    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-600 via-white to-emerald-600 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
        {/* Animated Background */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/10 dark:bg-blue-600/5 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-green-100/10 dark:bg-green-100/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto">
          {/* Header Section */}
          <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border border-white/30 dark:border-gray-700/50 shadow-2xl shadow-blue-500/10 dark:shadow-green-500/10 rounded-3xl overflow-hidden mb-8">
            <CardHeader className="text-center pb-8 relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-400/10 to-transparent dark:from-blue-600/10 rounded-bl-full"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-green-600/10 to-transparent dark:from-green-600/10 rounded-tr-full"></div>

              <div className={cn(
                "w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center shadow-2xl relative",
                score >= 70 ? 'bg-gradient-to-br from-green-500 to-emerald-600' : 
                score >= 50 ? 'bg-gradient-to-br from-amber-500 to-orange-600' : 
                'bg-gradient-to-br from-red-500 to-rose-600'
              )}>
                <Trophy className="h-12 w-12 text-white drop-shadow-lg" />
                <div className="absolute inset-0 rounded-full bg-white/20 animate-ping"></div>
              </div>

              <CardTitle className="text-4xl font-bold text-gray-900 dark:text-white mb-3 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-white dark:via-gray-100 dark:to-white bg-clip-text text-transparent">
                🎉 انتهى الاختبار!
              </CardTitle>
              <p className="text-xl text-gray-600 dark:text-gray-400 font-medium">
                اختبار {testType === 'verbal' ? 'القدرات اللفظية' : 'القدرات الكمية'} رقم {testNumber}
              </p>
            </CardHeader>

            <CardContent className="space-y-8">
              {/* Overall Score */}
              <div className="text-center">
                <div className={cn(
                  "text-8xl font-bold mb-4 bg-gradient-to-r bg-clip-text text-transparent drop-shadow-lg",
                  score >= 70 ? 'from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400' : 
                  score >= 50 ? 'from-amber-600 to-orange-600 dark:from-amber-400 dark:to-orange-400' : 
                  'from-red-600 to-rose-600 dark:from-red-400 dark:to-rose-400'
                )}>
                  {score}%
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto">
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-6">
                    <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">{correctAnswers}</div>
                    <div className="text-green-700 dark:text-green-300 font-medium">إجابات صحيحة</div>
                  </div>
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6">
                    <div className="text-3xl font-bold text-red-600 dark:text-red-400 mb-2">{incorrectAnswers}</div>
                    <div className="text-red-700 dark:text-red-300 font-medium">إجابات خاطئة</div>
                  </div>
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-6">
                    <div className="text-3xl font-bold text-amber-600 dark:text-amber-400 mb-2">{unansweredQuestions}</div>
                    <div className="text-amber-700 dark:text-amber-300 font-medium">غير مجاب</div>
                  </div>
                </div>
              </div>

              {/* Points and Ranking Card */}
              <div className="mt-8">
                <PointsAndRankingCard 
                  pointsEarned={parseFloat(localStorage.getItem('lastExamPointsEarned') || '0')}
                />
              </div>

              {/* شروحات الذكاء الاصطناعي للأخطاء */}
              {aiExplanations.length > 0 && wrongQuestionsForAI.length > 0 && (
                <div className="mt-8">
                  <div className="rounded-3xl border-2 border-teal-400 dark:border-teal-400 shadow-xl overflow-hidden">
                    <div className="bg-gradient-to-r from-green-500 to-teal-500 p-5 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-xl">🤖</div>
                      <div>
                        <h3 className="text-white font-bold text-lg">شروحات الذكاء الاصطناعي لأخطائك</h3>
                        <p className="text-teal-700 text-sm">شرح مخصص لك بناءً على مستواك ونمط أخطائك</p>
                      </div>
                    </div>
                    <div className="divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-800">
                      {aiExplanations.map((exp, i) => {
                        const wq = wrongQuestionsForAI[exp.questionIndex];
                        if (!wq) return null;
                        return (
                          <div key={i} className="p-5 hover:bg-teal-100 dark:hover:bg-teal-100/20 transition-colors">
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
                    </div>
                  </div>
                </div>
              )}

              {/* Download Mistakes Button */}
              {(incorrectAnswers > 0 || unansweredQuestions > 0) && (
                <div className="text-center">
                  <Button 
                    onClick={downloadMistakes}
                    className="bg-gradient-to-r from-green-600 to-amber-600 hover:from-green-600 hover:to-amber-600 text-white font-bold py-4 px-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                  >
                    <Download className="h-5 w-5 mr-2" />
                    تحميل تقرير الأخطاء
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Detailed Section Results */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
            {sections.map((section, index) => {
              const { correctCount, incorrectCount, unansweredCount } = getSectionResults(index);
              const sectionScore = Math.round((correctCount / section.questions.length) * 100);



              return (
                <Card 
                  key={index} 
                  className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border border-white/30 dark:border-gray-700/50 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 rounded-2xl overflow-hidden cursor-pointer"
                  onClick={() => setSelectedSectionDetails(selectedSectionDetails === index ? null : index)}
                >
                  <CardHeader className={cn(
                    "text-white text-center relative",
                    sectionScore >= 70 ? 'bg-gradient-to-br from-green-500 to-emerald-600' :
                    sectionScore >= 50 ? 'bg-gradient-to-br from-amber-500 to-orange-600' :
                    'bg-gradient-to-br from-red-500 to-rose-600'
                  )}>
                    <div className="absolute inset-0 bg-black/10"></div>
                    <div className="relative">
                      <div className="absolute top-2 left-2">
                        <div className={cn(
                          "w-6 h-6 rounded-full flex items-center justify-center transition-transform duration-300",
                          selectedSectionDetails === index ? 'rotate-180' : ''
                        )}>
                          <ChevronDown className="h-4 w-4 text-white/80" />
                        </div>
                      </div>
                      <div className={cn(
                        "w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl font-bold shadow-lg",
                        "bg-white/20 backdrop-blur-sm border border-white/30"
                      )}>
                        {index + 1}
                      </div>
                      <CardTitle className="text-2xl font-bold mb-2">القسم {index + 1}</CardTitle>
                      <div className="text-4xl font-bold">{sectionScore}%</div>
                      <div className="text-sm text-white/80 mt-2 flex items-center justify-center gap-2">
                        <Eye className="h-3 w-3" />
                        اضغط لعرض التفاصيل
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-6 space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                        <span className="text-green-700 dark:text-green-300 font-medium flex items-center gap-2">
                          <CheckCircle className="h-4 w-4" />
                          صحيحة
                        </span>
                        <span className="text-green-600 dark:text-green-400 font-bold text-lg">{correctCount}</span>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                        <span className="text-red-700 dark:text-red-300 font-medium flex items-center gap-2">
                          <X className="h-4 w-4" />
                          خاطئة
                        </span>
                        <span className="text-red-600 dark:text-red-400 font-bold text-lg">{incorrectCount}</span>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                        <span className="text-amber-700 dark:text-amber-300 font-medium flex items-center gap-2">
                          <AlertCircle className="h-4 w-4" />
                          غير مجاب
                        </span>
                        <span className="text-amber-600 dark:text-amber-400 font-bold text-lg">{unansweredCount}</span>
                      </div>
                    </div>

                    <div className="pt-2">
                      <Progress 
                        value={sectionScore} 
                        className={cn(
                          "h-3 rounded-full",
                          sectionScore >= 70 ? 'bg-green-100 dark:bg-green-900/30' :
                          sectionScore >= 50 ? 'bg-amber-100 dark:bg-amber-900/30' :
                          'bg-red-100 dark:bg-red-900/30'
                        )}
                      />
                    </div>

                    {/* Expandable Question Details */}
                    {selectedSectionDetails === index && (
                      <div className="mt-4 space-y-3 border-t border-gray-200 dark:border-gray-700 pt-4">
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                          <Eye className="h-4 w-4" />
                          تفاصيل الأسئلة:
                        </div>
                        <div className="max-h-96 overflow-y-auto space-y-2">
                          {section.questions.map((question, qIndex) => {
                            const userAnswer = section.answers[qIndex];
                            const isCorrect = userAnswer !== undefined && userAnswer === question.correctOptionIndex;
                            const isAnswered = userAnswer !== undefined;
                            const letterOptions = ['أ', 'ب', 'ج', 'د'];

                            return (
                              <div
                                key={qIndex}
                                className={cn(
                                  "p-4 rounded-lg border text-sm space-y-3",
                                  isAnswered ? (isCorrect ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 
                                               'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800') :
                                               'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
                                )}
                              >
                                <div className="font-medium text-gray-900 dark:text-white mb-2">
                                  {qIndex + 1}. {question.text}
                                </div>

                                {/* Display options */}
                                <div className="grid grid-cols-1 gap-2 mb-3">
                                  {question.options.map((option, optIndex) => (
                                    <div 
                                      key={optIndex}
                                      className={cn(
                                        "text-xs p-2 rounded flex items-center gap-2",
                                        optIndex === question.correctOptionIndex 
                                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-300 dark:border-green-700'
                                          : optIndex === userAnswer && userAnswer !== question.correctOptionIndex
                                            ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-700'
                                            : 'bg-gray-100 dark:bg-gray-700/30 text-gray-600 dark:text-gray-400'
                                      )}
                                    >
                                      <span className="font-medium">{letterOptions[optIndex]}</span>
                                      <span>{option}</span>
                                      {optIndex === question.correctOptionIndex && (
                                        <CheckCircle className="h-3 w-3 text-green-600 mr-auto" />
                                      )}
                                      {optIndex === userAnswer && userAnswer !== question.correctOptionIndex && (
                                        <XCircle className="h-3 w-3 text-red-600 mr-auto" />
                                      )}
                                    </div>
                                  ))}
                                </div>

                                <div className="text-xs text-gray-600 dark:text-gray-400">
                                  {isAnswered ? (
                                    isCorrect ? (
                                      <span className="text-green-600 dark:text-green-400 flex items-center gap-1">
                                        <CheckCircle className="h-3 w-3" />
                                        ✅ إجابتك: {letterOptions[userAnswer]} - صحيحة
                                      </span>
                                    ) : (
                                      <span className="text-red-600 dark:text-red-400 flex items-center gap-1">
                                        <XCircle className="h-3 w-3" />
                                        ❌ إجابتك: {letterOptions[userAnswer]} | الصحيحة: {letterOptions[question.correctOptionIndex]}
                                      </span>
                                    )
                                  ) : (
                                    <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                      <AlertCircle className="h-3 w-3" />
                                      ⚠️ لم يتم الإجابة على هذا السؤال
                                    </span>
                                  )}
                                </div>

                                {/* Display explanation */}
                                {question.explanation && (
                                  <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
                                    <div className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1 flex items-center gap-1">
                                      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                      الشرح:
                                    </div>
                                    <div className="text-xs text-blue-600 dark:text-blue-300 leading-relaxed">
                                      {question.explanation}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Action Buttons */}
          <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border border-white/30 dark:border-gray-700/50 shadow-xl rounded-2xl">
            <CardContent className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <Button 
                  onClick={() => setLocation('/question-bank')}
                  className="group h-16 bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-500 text-white font-bold text-lg rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                  data-testid="button-question-bank"
                >
                  <Home className="h-6 w-6 mr-3 group-hover:rotate-12 transition-transform duration-300" />
                  العودة إلى بنك الأسئلة
                </Button>
                <Button 
                  onClick={() => window.location.reload()}
                  variant="outline"
                  className="group h-16 border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 font-bold text-lg rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                  data-testid="button-retry-test"
                >
                  <Target className="h-6 w-6 mr-3 group-hover:rotate-180 transition-transform duration-300" />
                  إعادة الاختبار
                </Button>
              </div>

              {/* Save to Folder Buttons */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
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
                    حفظ جميع الأسئلة ({questions.length})
                  </Button>
                  
                  {incorrectAnswers > 0 && (
                    <Button
                      onClick={() => handleSaveToFolder("wrong")}
                      variant="outline"
                      className="h-14 border-2 border-red-300 dark:border-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-700 dark:text-red-300 font-medium rounded-xl transition-all duration-300 hover:scale-105"
                      data-testid="button-save-wrong-questions"
                    >
                      <XCircle className="h-5 w-5 mr-2" />
                      حفظ الأخطاء فقط ({incorrectAnswers})
                    </Button>
                  )}
                  
                  {unansweredQuestions > 0 && (
                    <Button
                      onClick={() => handleSaveToFolder("unanswered")}
                      variant="outline"
                      className="h-14 border-2 border-amber-300 dark:border-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 text-amber-700 dark:text-amber-300 font-medium rounded-xl transition-all duration-300 hover:scale-105"
                      data-testid="button-save-unanswered-questions"
                    >
                      <AlertCircle className="h-5 w-5 mr-2" />
                      حفظ غير المجاب ({unansweredQuestions})
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Save to Folder Dialog */}
          <EnhancedSaveToFolderDialog
            open={showSaveDialog}
            onOpenChange={setShowSaveDialog}
            questionIds={questionsToSave}
            saveMode={saveMode}
            onSuccess={() => {
              setShowSaveDialog(false);
            }}
          />
        </div>
      </div>
    );
  }

  // Main Test Interface
  const currentQuestion = getCurrentQuestion();
  const currentSectionData = sections[currentSection];
  const selectedAnswer = getSelectedAnswer(); // Use the helper function

  if (!currentQuestion || !currentSectionData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <p className="text-gray-600 dark:text-gray-400">حدث خطأ في تحميل السؤال</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <AntiCheatWarning
        violations={violations}
        lastViolationType={lastViolationType}
        isVisible={isWarningVisible}
        onDismiss={dismissWarning}
        maxViolations={5}
      />
      <QiyasExamLayout
      examTitle={testType === 'verbal' ? `القدرات اللفظية - ${testNumber}` : `القدرات الكمية - ${testNumber}`}
      questionNumber={currentQuestionInSection + 1}
      totalQuestions={currentSectionData.questions.length}
      sectionNumber={currentSection + 1}
      totalSections={sections.length}
      timeLeft={timeLeft}
      isTimeUrgent={timeLeft < 300}
      questionText={currentQuestion.text}
      questionImageUrl={currentQuestion.imageUrl}
      options={currentQuestion.options}
      selectedAnswer={selectedAnswer ?? null}
      onSelectAnswer={selectAnswer}
      currentQuestionIndex={currentQuestionInSection}
      onJumpToQuestion={jumpToQuestionInSection}
      questionsStatus={currentSectionData.questions.map((_, i) => ({
        answered: currentSectionData.answers[i] !== undefined,
        bookmarked: bookmarkedQuestions.has(`${currentSection}-${i}`)
      }))}
      isBookmarked={bookmarkedQuestions.has(`${currentSection}-${currentQuestionInSection}`)}
      onToggleBookmark={() => toggleBookmark(currentSection, currentQuestionInSection)}
      onEndSection={showSectionReviewDialog}
      onPrev={previousQuestion}
      onNext={nextQuestion}
      onFinish={showSectionReviewDialog}
      canGoPrev={currentQuestionInSection > 0}
      canGoNext={true}
      isLastQuestion={currentQuestionInSection === currentSectionData.questions.length - 1}
      answeredCount={Object.keys(currentSectionData.answers).length}
      userName={user?.username || user?.name}
      userId={user?.id?.toString()}
    />
    </div>
  );
}