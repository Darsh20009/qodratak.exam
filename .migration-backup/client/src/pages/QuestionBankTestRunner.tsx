import React, { useState, useEffect, useCallback } from 'react';
import { useAntiCheat } from '@/hooks/useAntiCheat';
import { AntiCheatWarning } from '@/components/AntiCheatWarning';
import AiReviewingScreen, { WrongQuestion } from '@/components/AiReviewingScreen';
import { useParams, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { EndTestButton } from '@/components/ui/EndTestButton';
import { QiyasExamLayout } from '@/components/QiyasExamLayout';
import { 
  Clock, 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Flag, 
  CheckCircle, 
  XCircle, 
  BookOpen, 
  Calculator,
  Home,
  Download,
  Target,
  Trophy,
  Brain,
  Zap,
  Star,
  Crown,
  TrendingUp,
  AlertCircle
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

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

export default function QuestionBankTestRunner() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const testType = params.type as 'verbal' | 'quantitative';
  const testNumber = parseInt(params.testNumber || '1');
  
  // Get subcategory filter from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const subcategoryFilter = urlParams.get('subcategory');
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: number }>({});
  const [bookmarkedQuestions, setBookmarkedQuestions] = useState<Set<number>>(new Set());
  const [timeLeft, setTimeLeft] = useState(50 * 60); // 50 minutes
  const [isPaused, setIsPaused] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showAiReview, setShowAiReview] = useState(false);
  const [wrongQuestionsForAI, setWrongQuestionsForAI] = useState<WrongQuestion[]>([]);
  const [testAnswers, setTestAnswers] = useState<TestAnswer[]>([]);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [loading, setLoading] = useState(true);
  const { data: user } = useQuery<any>({ queryKey: ['/api/user'] });

  const { violations, lastViolationType, isWarningVisible, dismissWarning } = useAntiCheat({
    enabled: isStarted && !isCompleted,
    maxViolations: 5,
    onViolation: () => { setIsPaused(true); setTimeout(() => setIsPaused(false), 3000); },
    onMaxViolations: () => { setIsCompleted(true); },
  });

  // Load questions for the specific test
  useEffect(() => {
    const loadQuestions = async () => {
      try {
        const response = await fetch('/api/questions');
        const allQuestions = await response.json();
        
        // Filter questions by type
        let filteredQuestions = allQuestions.filter((q: Question) => 
          q.category === testType
        );
        
        // Apply subcategory filter if provided
        if (subcategoryFilter) {
          filteredQuestions = filteredQuestions.filter((q: Question) => 
            q.subcategory === subcategoryFilter
          );
          console.log(`🎯 Filtered to ${subcategoryFilter}: ${filteredQuestions.length} questions`);
        }
        
        // Calculate question range for this test
        const startIndex = (testNumber - 1) * 50;
        const endIndex = Math.min(startIndex + 50, filteredQuestions.length);
        
        const testQuestions = filteredQuestions.slice(startIndex, endIndex);
        setQuestions(testQuestions);
        setLoading(false);
      } catch (error) {
        console.error('Error loading questions:', error);
        setLoading(false);
      }
    };

    loadQuestions();
  }, [testType, testNumber, subcategoryFilter]);

  // Timer effect
  useEffect(() => {
    if (!isStarted || isPaused || isCompleted) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          completeTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isStarted, isPaused, isCompleted]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startTest = () => {
    setIsStarted(true);
    setQuestionStartTime(Date.now());
  };

  const pauseTest = () => {
    setIsPaused(true);
  };

  const resumeTest = () => {
    setIsPaused(false);
    setQuestionStartTime(Date.now());
  };

  const selectAnswer = (answerIndex: number) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [currentQuestionIndex]: answerIndex
    }));
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      const timeSpent = Date.now() - questionStartTime;
      setCurrentQuestionIndex(prev => prev + 1);
      setQuestionStartTime(Date.now());
    }
  };

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      setQuestionStartTime(Date.now());
    }
  };

  const jumpToQuestion = (index: number) => {
    setCurrentQuestionIndex(index);
    setQuestionStartTime(Date.now());
  };

  const completeTest = useCallback(() => {
    if (isCompleted) return;
    
    setIsCompleted(true);
    setIsPaused(true);
    
    // Calculate results - only count answered questions as correct
    const answers: TestAnswer[] = questions.map((question, index) => {
      const selectedAnswer = selectedAnswers[index];
      // Only count as correct if answered AND correct
      const correct = selectedAnswer !== undefined && selectedAnswer === question.correctOptionIndex;
      
      return {
        questionNumber: index + 1,
        selectedAnswer: selectedAnswer ?? -1,
        correct,
        question,
        timeSpent: 0
      };
    });

    setTestAnswers(answers);
    
    // Only count answered questions for score calculation
    const answeredQuestions = answers.filter(a => a.selectedAnswer !== -1);
    const correctAnswers = answers.filter(a => a.correct);
    
    // Calculate score based on answered questions or total if all answered
    const score = answeredQuestions.length === 0 ? 0 : 
                  Math.round((correctAnswers.length / questions.length) * 100);
    
    // Get previous results if exist
    const questionBankResults = JSON.parse(localStorage.getItem('questionBankResults') || '{}');
    const testKey = `${testType}_${testNumber}`;
    const previousResult = questionBankResults[testKey];
    const previousScore = previousResult?.score;
    const previousAttempts = previousResult?.attempts || 0;
    
    const passed = score >= 50;
    const isPerfect = score === 100;
    
    // Save results to localStorage with enhanced tracking
    questionBankResults[testKey] = {
      score,
      previousScore,
      answers,
      passed,
      isPerfect,
      attempts: previousAttempts + 1,
      completedAt: new Date().toISOString(),
      timeSpent: 50 * 60 - timeLeft,
      correctCount: correctAnswers.length,
      totalQuestions: questions.length,
      answeredCount: answeredQuestions.length,
      improvement: previousScore !== undefined ? score - previousScore : 0
    };
    localStorage.setItem('questionBankResults', JSON.stringify(questionBankResults));
    
    // Update progress with enhanced tracking
    const progressState = JSON.parse(localStorage.getItem('questionBankProgress') || '{}');
    if (!progressState[testType]) {
      progressState[testType] = [];
    }
    
    const testIndex = progressState[testType].findIndex((t: any) => t.testNumber === testNumber);
    
    if (testIndex !== -1) {
      const currentTest = progressState[testType][testIndex];
      const wasCompleted = currentTest.completed;
      const oldScore = wasCompleted ? currentTest.score : undefined;
      
      progressState[testType][testIndex] = {
        ...currentTest,
        completed: true,
        passed,
        isPerfect,
        previousScore: oldScore,
        score,
        attempts: previousAttempts + 1,
        completedAt: new Date().toISOString(),
        improvement: oldScore !== undefined ? score - oldScore : null,
        bestScore: Math.max(score, oldScore || 0)
      };
    } else {
      progressState[testType].push({
        testNumber,
        completed: true,
        passed,
        isPerfect,
        previousScore: undefined,
        score,
        attempts: 1,
        completedAt: new Date().toISOString(),
        improvement: null,
        bestScore: score
      });
    }
    
    localStorage.setItem('questionBankProgress', JSON.stringify(progressState));
    
    // Dispatch custom event to notify QuestionBankPage to reload
    window.dispatchEvent(new CustomEvent('questionBankProgressUpdated', { 
      detail: { 
        testType, 
        testNumber, 
        score, 
        previousScore,
        passed,
        isPerfect,
        improvement: previousScore !== undefined ? score - previousScore : 0
      }
    }));
    
    console.log('🎯 Progress updated and event dispatched:', { 
      testType, 
      testNumber, 
      score, 
      previousScore, 
      passed,
      isPerfect 
    });

    // Save to server (if user is logged in)
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        fetch('/api/test-results', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            testType: testType,
            difficulty: 'intermediate',
            score: correctAnswers.length,
            totalQuestions: questions.length,
            timeTaken: 50 * 60 - timeLeft,
            skippedQuestions: questions.length - answeredQuestions.length
          })
        }).then(res => res.json()).then(response => {
          if (response?.pointsEarned !== undefined) {
            localStorage.setItem('lastExamPointsEarned', response.pointsEarned.toString());
          }
        }).catch(err => console.error('Error saving to server:', err));
      } catch (error) {
        console.error('Error parsing user:', error);
      }
    }

    // Generate access code for next test if this one passed
    if (passed) {
      const nextTestNumber = testNumber + 1;
      const generateAccessCode = (type: string, testNum: number) => {
        const base = `${type.toUpperCase()}${testNum}${new Date().getFullYear()}`;
        const hash = btoa(base).replace(/[^A-Z0-9]/g, '').substring(0, 6);
        return hash;
      };
      
      const accessCode = generateAccessCode(testType, nextTestNumber);
      
      // Store access codes
      const accessCodes = JSON.parse(localStorage.getItem('testAccessCodes') || '{}');
      accessCodes[`${testType}_${nextTestNumber}`] = accessCode;
      localStorage.setItem('testAccessCodes', JSON.stringify(accessCodes));
      
      // Show enhanced success message
      setTimeout(() => {
        let message = '';
        const improvement = previousScore !== undefined ? score - previousScore : null;
        
        if (isPerfect) {
          message = `🏆 مثالي! درجة كاملة 100%!\n`;
        } else if (score >= 90) {
          message = `🌟 ممتاز! أداء استثنائي!\n`;
        } else if (score >= 70) {
          message = `🎯 أداء جيد جداً!\n`;
        } else {
          message = `✅ تهانينا! لقد نجحت!\n`;
        }
        
        message += `\nالدرجة الحالية: ${score}%`;
        
        if (previousScore !== undefined) {
          message += `\nالدرجة السابقة: ${previousScore}%`;
          if (improvement !== null) {
            if (improvement > 0) {
              message += `\n📈 تحسن: +${improvement}%`;
            } else if (improvement < 0) {
              message += `\n📉 انخفاض: ${improvement}%`;
            } else {
              message += `\n➡️ نفس الدرجة`;
            }
          }
        }
        
        message += `\n\n🔑 كود الوصول للاختبار التالي: ${accessCode}`;
        message += `\n\n📝 احتفظ بهذا الكود للوصول من أي جهاز.`;
        
        alert(message);
      }, 2000);
    }

    // Build wrong questions for AI review
    const wrongs: WrongQuestion[] = answers
      .filter(a => !a.correct)
      .map(a => ({
        questionText: a.question.text,
        options: a.question.options,
        studentAnswerIndex: a.selectedAnswer === -1 ? null : a.selectedAnswer,
        correctAnswerIndex: a.question.correctOptionIndex,
        category: a.question.category,
        subcategory: a.question.subcategory,
      }));
    setWrongQuestionsForAI(wrongs);
    setShowAiReview(true);
  }, [isCompleted, questions, selectedAnswers, testType, testNumber, timeLeft]);

  const downloadResults = () => {
    const mistakes = testAnswers.filter(answer => !answer.correct);
    const correctAnswers = testAnswers.filter(answer => answer.correct);
    const score = Math.round((correctAnswers.length / questions.length) * 100);
    
    const htmlContent = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>نتائج الاختبار - ${testType === 'verbal' ? 'اللفظي' : 'الكمي'} - اختبار ${testNumber}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Cairo', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            color: white;
            line-height: 1.6;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .header {
            text-align: center;
            margin-bottom: 40px;
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            padding: 30px;
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .header h1 {
            font-size: 2.5em;
            font-weight: 700;
            margin-bottom: 10px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 40px;
        }
        
        .stat-card {
            background: rgba(255, 255, 255, 0.15);
            backdrop-filter: blur(10px);
            border-radius: 15px;
            padding: 25px;
            text-align: center;
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .stat-number {
            font-size: 2.5em;
            font-weight: 700;
            margin-bottom: 10px;
        }
        
        .score-excellent { color: #4caf50; }
        .score-good { color: #2196f3; }
        .score-average { color: #ff9800; }
        .score-poor { color: #f44336; }
        
        .section {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 15px;
            padding: 30px;
            margin-bottom: 25px;
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .section h2 {
            font-size: 1.8em;
            margin-bottom: 20px;
            color: #ffeb3b;
        }
        
        .question-card {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 10px;
            padding: 20px;
            margin-bottom: 15px;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .question-text {
            font-size: 1.1em;
            margin-bottom: 15px;
            font-weight: 600;
        }
        
        .options {
            display: grid;
            gap: 10px;
        }
        
        .option {
            padding: 10px 15px;
            border-radius: 8px;
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .option.correct {
            background: rgba(76, 175, 80, 0.3);
            border-color: #4caf50;
        }
        
        .option.incorrect {
            background: rgba(244, 67, 54, 0.3);
            border-color: #f44336;
        }
        
        .footer {
            text-align: center;
            margin-top: 50px;
            padding: 30px;
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        @media (max-width: 768px) {
            .container { padding: 10px; }
            .header h1 { font-size: 2em; }
            .stats { grid-template-columns: 1fr; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 نتائج الاختبار</h1>
            <p>بنك الأسئلة ${testType === 'verbal' ? 'اللفظية' : 'الكمية'} - الاختبار رقم ${testNumber}</p>
        </div>
        
        <div class="stats">
            <div class="stat-card">
                <div class="stat-number ${score >= 90 ? 'score-excellent' : score >= 70 ? 'score-good' : score >= 50 ? 'score-average' : 'score-poor'}">${score}%</div>
                <div class="stat-label">النتيجة النهائية</div>
            </div>
            <div class="stat-card">
                <div class="stat-number" style="color: #4caf50;">${correctAnswers.length}</div>
                <div class="stat-label">الإجابات الصحيحة</div>
            </div>
            <div class="stat-card">
                <div class="stat-number" style="color: #f44336;">${mistakes.length}</div>
                <div class="stat-label">الأخطاء</div>
            </div>
            <div class="stat-card">
                <div class="stat-number" style="color: #ffeb3b;">${questions.length}</div>
                <div class="stat-label">إجمالي الأسئلة</div>
            </div>
        </div>
        
        ${mistakes.length > 0 ? `
            <div class="section">
                <h2>❌ الأخطاء (${mistakes.length})</h2>
                ${mistakes.map((mistake, index) => `
                    <div class="question-card">
                        <div class="question-text">السؤال ${mistake.questionNumber}: ${mistake.question.text}</div>
                        <div class="options">
                            ${mistake.question.options.map((option, optionIndex) => `
                                <div class="option ${optionIndex === mistake.question.correctOptionIndex ? 'correct' : 
                                    optionIndex === mistake.selectedAnswer ? 'incorrect' : ''}">
                                    ${String.fromCharCode(65 + optionIndex)}) ${option}
                                    ${optionIndex === mistake.question.correctOptionIndex ? ' ✓' : ''}
                                    ${optionIndex === mistake.selectedAnswer ? ' ✗' : ''}
                                </div>
                            `).join('')}
                        </div>
                        ${mistake.question.explanation ? `
                            <div style="margin-top: 15px; padding: 15px; background: rgba(33, 150, 243, 0.2); border-radius: 8px; border-right: 4px solid #2196f3;">
                                <strong>💡 التفسير:</strong> ${mistake.question.explanation}
                            </div>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
        ` : ''}
        
        <div class="section">
            <h2>✅ الإجابات الصحيحة (${correctAnswers.length})</h2>
            ${correctAnswers.slice(0, 5).map((answer, index) => `
                <div class="question-card">
                    <div class="question-text">السؤال ${answer.questionNumber}: ${answer.question.text}</div>
                    <div class="options">
                        <div class="option correct">
                            ${String.fromCharCode(65 + answer.selectedAnswer)}) ${answer.question.options[answer.selectedAnswer]} ✓
                        </div>
                    </div>
                </div>
            `).join('')}
            ${correctAnswers.length > 5 ? `<p style="text-align: center; margin-top: 20px; opacity: 0.8;">... و ${correctAnswers.length - 5} إجابة صحيحة أخرى</p>` : ''}
        </div>
        
        <div class="footer">
            <h3>🎯 ${score >= 90 ? 'أداء ممتاز!' : score >= 70 ? 'أداء جيد!' : score >= 50 ? 'أداء مقبول' : 'يحتاج تحسين'}</h3>
            <p>${score >= 90 ? 'تهانينا! أداؤك متميز جداً' : score >= 70 ? 'أداء جيد، واصل التحسين' : score >= 50 ? 'أداء مقبول، يمكنك التحسن أكثر' : 'راجع المواد وأعد الاختبار'}</p>
        </div>
    </div>
</body>
</html>`;
    
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `نتائج_بنك_الاسئلة_${testType === 'verbal' ? 'لفظي' : 'كمي'}_${testNumber}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600 dark:text-gray-300">جاري تحميل الاختبار...</p>
        </div>
      </div>
    );
  }

  if (showAiReview) {
    const userStr = localStorage.getItem('user');
    const userEmail = userStr ? JSON.parse(userStr)?.email : undefined;
    const correctCount = testAnswers.filter(a => a.correct).length || (questions.length - wrongQuestionsForAI.length);
    return (
      <AiReviewingScreen
        wrongQuestions={wrongQuestionsForAI}
        totalQuestions={questions.length}
        score={correctCount}
        userEmail={userEmail}
        onShowResults={() => {
          setShowAiReview(false);
          setShowResults(true);
        }}
      />
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-slate-900 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-red-600">خطأ</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="mb-4">لم يتم العثور على أسئلة لهذا الاختبار</p>
            <Button onClick={() => setLocation('/question-bank')}>
              العودة لبنك الأسئلة
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showResults) {
    const score = Math.round((testAnswers.filter(a => a.correct).length / questions.length) * 100);
    const mistakes = testAnswers.filter(a => !a.correct);
    
    // Get previous score and improvement
    const questionBankResults = JSON.parse(localStorage.getItem('questionBankResults') || '{}');
    const testKey = `${testType}_${testNumber}`;
    const currentResult = questionBankResults[testKey];
    const previousScore = currentResult?.previousScore;
    const improvement = previousScore !== undefined ? score - previousScore : null;
    const isPerfect = score === 100;
    const passed = score >= 50;
    const attempts = currentResult?.attempts || 1;
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-slate-900">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className={`p-3 rounded-full ${
                  isPerfect ? 'bg-gradient-to-r from-yellow-400 to-orange-500' :
                  score >= 90 ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                  score >= 70 ? 'bg-gradient-to-r from-blue-500 to-cyan-500' :
                  passed ? 'bg-gradient-to-r from-green-600 to-amber-600' :
                  'bg-gradient-to-r from-red-500 to-rose-500'
                }`}>
                  {isPerfect ? <Crown className="h-8 w-8 text-white" /> : <Trophy className="h-8 w-8 text-white" />}
                </div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                  {isPerfect ? '🏆 درجة كاملة!' : passed ? '✅ تم الاجتياز' : '❌ لم يتم الاجتياز'}
                </h1>
              </div>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                بنك الأسئلة {testType === 'verbal' ? 'اللفظية' : 'الكمية'} - الاختبار رقم {testNumber}
              </p>
              {attempts > 1 && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  المحاولة رقم {attempts}
                </p>
              )}
            </div>

            {/* Results Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card className={cn(
                "text-center",
                isPerfect ? "bg-gradient-to-r from-yellow-400 to-orange-500 text-white" :
                score >= 90 ? "bg-gradient-to-r from-green-500 to-green-600 text-white" :
                score >= 70 ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white" :
                score >= 50 ? "bg-gradient-to-r from-yellow-500 to-yellow-600 text-white" :
                "bg-gradient-to-r from-red-500 to-red-600 text-white"
              )}>
                <CardContent className="p-6">
                  {isPerfect ? <Crown className="h-8 w-8 mx-auto mb-2 opacity-80" /> : <Star className="h-8 w-8 mx-auto mb-2 opacity-80" />}
                  <p className="text-3xl font-bold">{score}%</p>
                  <p className="opacity-90">الدرجة الحالية</p>
                  {previousScore !== undefined && (
                    <p className="text-sm opacity-75 mt-1">السابقة: {previousScore}%</p>
                  )}
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
                <CardContent className="p-6 text-center">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-80" />
                  <p className="text-3xl font-bold">{testAnswers.filter(a => a.correct).length}</p>
                  <p className="opacity-90">إجابات صحيحة</p>
                </CardContent>
              </Card>
              
              {improvement !== null && (
                <Card className={cn(
                  "text-center",
                  improvement > 0 ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white" :
                  improvement < 0 ? "bg-gradient-to-r from-orange-500 to-red-600 text-white" :
                  "bg-gradient-to-r from-gray-500 to-gray-600 text-white"
                )}>
                  <CardContent className="p-6">
                    <TrendingUp className={cn(
                      "h-8 w-8 mx-auto mb-2 opacity-80",
                      improvement < 0 && "transform rotate-180"
                    )} />
                    <p className="text-3xl font-bold">
                      {improvement > 0 ? '+' : ''}{improvement}%
                    </p>
                    <p className="opacity-90">
                      {improvement > 0 ? '📈 تحسن' : improvement < 0 ? '📉 انخفاض' : '➡️ ثابت'}
                    </p>
                  </CardContent>
                </Card>
              )}
              
              <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white">
                <CardContent className="p-6 text-center">
                  <XCircle className="h-8 w-8 mx-auto mb-2 opacity-80" />
                  <p className="text-3xl font-bold">{mistakes.length}</p>
                  <p className="opacity-90">أخطاء</p>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
                <CardContent className="p-6 text-center">
                  <Clock className="h-8 w-8 mx-auto mb-2 opacity-80" />
                  <p className="text-3xl font-bold">{formatTime(50 * 60 - timeLeft)}</p>
                  <p className="opacity-90">الوقت المستغرق</p>
                </CardContent>
              </Card>
            </div>

            {/* حالة الاجتياز */}
            {isPerfect && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-8"
              >
                <Card className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 text-white border-4 border-yellow-300 shadow-2xl">
                  <CardContent className="p-8 text-center">
                    <div className="flex items-center justify-center gap-4 mb-4">
                      <Crown className="h-16 w-16 animate-bounce" />
                      <div>
                        <h2 className="text-4xl font-bold">🏆 إنجاز مثالي!</h2>
                        <p className="text-xl mt-2">حصلت على درجة كاملة 100%</p>
                      </div>
                      <Crown className="h-16 w-16 animate-bounce" />
                    </div>
                    <p className="text-lg opacity-90">
                      أداء استثنائي! لقد أجبت على جميع الأسئلة بشكل صحيح 🎉
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            )}
            
            {!isPerfect && passed && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-8"
              >
                <Card className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-2 border-green-300 shadow-xl">
                  <CardContent className="p-6 text-center">
                    <div className="flex items-center justify-center gap-3 mb-3">
                      <CheckCircle className="h-12 w-12" />
                      <div>
                        <h2 className="text-3xl font-bold">✅ تم الاجتياز بنجاح!</h2>
                        {previousScore !== undefined && improvement !== null && improvement > 0 && (
                          <p className="text-lg mt-1">تحسنت بمقدار {improvement}% عن المحاولة السابقة 📈</p>
                        )}
                      </div>
                    </div>
                    <p className="text-base opacity-90">
                      {score >= 90 ? 'أداء ممتاز! واصل هذا المستوى الرائع 🌟' :
                       score >= 70 ? 'أداء جيد جداً! أنت على الطريق الصحيح 🎯' :
                       'أداء جيد! يمكنك التحسن أكثر بالممارسة 💪'}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            )}
            
            {!passed && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-8"
              >
                <Card className="bg-gradient-to-r from-red-500 to-rose-600 text-white border-2 border-red-300 shadow-xl">
                  <CardContent className="p-6 text-center">
                    <div className="flex items-center justify-center gap-3 mb-3">
                      <AlertCircle className="h-12 w-12" />
                      <div>
                        <h2 className="text-3xl font-bold">❌ لم يتم الاجتياز</h2>
                        <p className="text-lg mt-1">النسبة المطلوبة للنجاح: 50%</p>
                      </div>
                    </div>
                    <p className="text-base opacity-90">
                      لا تيأس! راجع الأخطاء وحاول مرة أخرى. كل محاولة خطوة نحو النجاح 💪
                    </p>
                    {previousScore !== undefined && (
                      <p className="text-sm mt-2 opacity-80">
                        الدرجة السابقة: {previousScore}% | الدرجة الحالية: {score}%
                        {improvement !== null && improvement !== 0 && (
                          <span className={improvement > 0 ? "text-green-200" : "text-orange-200"}>
                            {' '}({improvement > 0 ? '+' : ''}{improvement}%)
                          </span>
                        )}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-4 justify-center mb-8">
              <Button 
                onClick={() => setLocation('/question-bank')}
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-600 text-white"
              >
                <Home className="h-4 w-4 mr-2" />
                العودة لبنك الأسئلة
              </Button>
              
              <Button 
                onClick={() => setLocation(`/question-bank/${testType}/${testNumber}`)}
                size="lg"
                variant="outline"
                className="border-blue-300 text-blue-600 hover:bg-blue-50"
              >
                <Target className="h-4 w-4 mr-2" />
                إعادة الاختبار
              </Button>
              
              <Button 
                onClick={downloadResults}
                size="lg"
                variant="outline"
                className="border-green-300 text-green-600 hover:bg-green-50"
              >
                <Download className="h-4 w-4 mr-2" />
                تحميل النتائج
              </Button>
            </div>

            {/* Performance Analysis */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  تحليل الأداء
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">
                    {score >= 90 ? '🏆' : score >= 70 ? '🎯' : score >= 50 ? '📈' : '💪'}
                  </div>
                  <h3 className="text-2xl font-bold mb-2">
                    {score >= 90 ? 'أداء ممتاز!' : score >= 70 ? 'أداء جيد!' : score >= 50 ? 'أداء مقبول' : 'يحتاج تحسين'}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                    {score >= 90 ? 'تهانينا! أداؤك متميز جداً في هذا الاختبار. واصل هذا المستوى الرائع!' : 
                     score >= 70 ? 'أداء جيد! أنت على الطريق الصحيح. راجع الأخطاء وحاول مرة أخرى.' : 
                     score >= 50 ? 'أداء مقبول، يمكنك التحسن أكثر. ركز على نقاط الضعف وأعد المحاولة.' : 
                     'لا تيأس! راجع المواد جيداً وأعد الاختبار. النجاح يحتاج للممارسة المستمرة.'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (!isStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-slate-900 flex items-center justify-center">
        <Card className="max-w-2xl w-full mx-4">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-3 bg-gradient-to-r from-blue-600 to-emerald-600 rounded-full">
                {testType === 'verbal' ? (
                  <BookOpen className="h-8 w-8 text-white" />
                ) : (
                  <Calculator className="h-8 w-8 text-white" />
                )}
              </div>
              <CardTitle className="text-2xl">
                بنك الأسئلة {testType === 'verbal' ? 'اللفظية' : 'الكمية'}
              </CardTitle>
            </div>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              الاختبار رقم {testNumber}
              {subcategoryFilter && (
                <span className="block text-sm text-blue-600 dark:text-blue-400 mt-1">
                  القسم الفرعي: {subcategoryFilter}
                </span>
              )}
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{questions.length}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">عدد الأسئلة</p>
              </div>
              <div className="text-center p-4 bg-green-100 dark:bg-green-100 rounded-lg">
                <p className="text-2xl font-bold text-green-700">50</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">دقيقة</p>
              </div>
              <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                <p className="text-2xl font-bold text-green-600">
                  {(testNumber - 1) * 50 + 1}-{Math.min(testNumber * 50, (testNumber - 1) * 50 + questions.length)}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">نطاق الأسئلة</p>
              </div>
            </div>
            
            <div className="text-center">
              <Button 
                onClick={startTest}
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-600 text-white px-8 py-3"
              >
                <Play className="h-5 w-5 mr-2" />
                بدء الاختبار
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

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
      examTitle={`${testType === 'verbal' ? 'بنك الأسئلة اللفظية' : 'بنك الأسئلة الكمية'} - اختبار ${testNumber}`}
      questionNumber={currentQuestionIndex + 1}
      totalQuestions={questions.length}
      timeLeft={timeLeft}
      isTimeUrgent={timeLeft < 300}
      questionText={currentQuestion.text}
      questionImageUrl={currentQuestion.imageUrl}
      options={currentQuestion.options}
      selectedAnswer={selectedAnswers[currentQuestionIndex] ?? null}
      onSelectAnswer={selectAnswer}
      questionsStatus={questions.map((_, i) => ({
        answered: selectedAnswers[i] !== undefined,
        bookmarked: bookmarkedQuestions.has(i)
      }))}
      currentQuestionIndex={currentQuestionIndex}
      onJumpToQuestion={jumpToQuestion}
      isBookmarked={bookmarkedQuestions.has(currentQuestionIndex)}
      onToggleBookmark={() => setBookmarkedQuestions(prev => {
        const next = new Set(prev);
        if (next.has(currentQuestionIndex)) next.delete(currentQuestionIndex); else next.add(currentQuestionIndex);
        return next;
      })}
      onPrev={previousQuestion}
      onNext={nextQuestion}
      onFinish={completeTest}
      canGoPrev={currentQuestionIndex > 0}
      canGoNext={currentQuestionIndex < questions.length - 1}
      isLastQuestion={currentQuestionIndex === questions.length - 1}
      userName={user?.username || user?.name}
      userId={user?.id?.toString()}
      userAvatar={user?.avatarUrl}
      topRightSlot={
        <Button
          onClick={isPaused ? resumeTest : pauseTest}
          size="icon"
          variant="ghost"
          className="w-8 h-8 text-white hover:bg-white/20"
        >
          {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
        </Button>
      }
    />
    </div>
  );
}