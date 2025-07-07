import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
  Star
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Question {
  id: number;
  text: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
  category: string;
  subcategory?: string;
  difficulty?: string;
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
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: number }>({});
  const [timeLeft, setTimeLeft] = useState(50 * 60); // 50 minutes
  const [isPaused, setIsPaused] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [testAnswers, setTestAnswers] = useState<TestAnswer[]>([]);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [loading, setLoading] = useState(true);

  // Load questions for the specific test
  useEffect(() => {
    const loadQuestions = async () => {
      try {
        const response = await fetch('/api/questions');
        const allQuestions = await response.json();
        
        // Filter questions by type
        const filteredQuestions = allQuestions.filter((q: Question) => 
          q.category === testType
        );
        
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
  }, [testType, testNumber]);

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
      const correct = selectedAnswer !== undefined && selectedAnswer === question.correctAnswer;
      
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
    
    // Save results to localStorage
    const questionBankResults = JSON.parse(localStorage.getItem('questionBankResults') || '{}');
    const testKey = `${testType}_${testNumber}`;
    questionBankResults[testKey] = {
      score,
      answers,
      completedAt: new Date().toISOString(),
      timeSpent: 50 * 60 - timeLeft
    };
    localStorage.setItem('questionBankResults', JSON.stringify(questionBankResults));
    
    // Update progress
    const progressState = JSON.parse(localStorage.getItem('questionBankProgress') || '{}');
    if (progressState[testType]) {
      const testIndex = progressState[testType].findIndex((t: any) => t.testNumber === testNumber);
      if (testIndex !== -1) {
        progressState[testType][testIndex].completed = true;
        progressState[testType][testIndex].score = score;
        progressState[testType][testIndex].completedAt = new Date().toISOString();
        localStorage.setItem('questionBankProgress', JSON.stringify(progressState));
      }
    }
    
    setShowResults(true);
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
                                <div class="option ${optionIndex === mistake.question.correctAnswer ? 'correct' : 
                                    optionIndex === mistake.selectedAnswer ? 'incorrect' : ''}">
                                    ${String.fromCharCode(65 + optionIndex)}) ${option}
                                    ${optionIndex === mistake.question.correctAnswer ? ' ✓' : ''}
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
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-slate-900">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="p-3 bg-gradient-to-r from-green-500 to-blue-500 rounded-full">
                  <Trophy className="h-8 w-8 text-white" />
                </div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                  نتائج الاختبار
                </h1>
              </div>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                بنك الأسئلة {testType === 'verbal' ? 'اللفظية' : 'الكمية'} - الاختبار رقم {testNumber}
              </p>
            </div>

            {/* Results Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card className={cn(
                "text-center",
                score >= 90 ? "bg-gradient-to-r from-green-500 to-green-600 text-white" :
                score >= 70 ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white" :
                score >= 50 ? "bg-gradient-to-r from-yellow-500 to-yellow-600 text-white" :
                "bg-gradient-to-r from-red-500 to-red-600 text-white"
              )}>
                <CardContent className="p-6">
                  <Star className="h-8 w-8 mx-auto mb-2 opacity-80" />
                  <p className="text-3xl font-bold">{score}%</p>
                  <p className="opacity-90">النتيجة النهائية</p>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
                <CardContent className="p-6 text-center">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-80" />
                  <p className="text-3xl font-bold">{testAnswers.filter(a => a.correct).length}</p>
                  <p className="opacity-90">إجابات صحيحة</p>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white">
                <CardContent className="p-6 text-center">
                  <XCircle className="h-8 w-8 mx-auto mb-2 opacity-80" />
                  <p className="text-3xl font-bold">{mistakes.length}</p>
                  <p className="opacity-90">أخطاء</p>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                <CardContent className="p-6 text-center">
                  <Clock className="h-8 w-8 mx-auto mb-2 opacity-80" />
                  <p className="text-3xl font-bold">{formatTime(50 * 60 - timeLeft)}</p>
                  <p className="opacity-90">الوقت المستغرق</p>
                </CardContent>
              </Card>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-4 justify-center mb-8">
              <Button 
                onClick={() => setLocation('/question-bank')}
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
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
              <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full">
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
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{questions.length}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">عدد الأسئلة</p>
              </div>
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
                <p className="text-2xl font-bold text-purple-600">50</p>
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
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3"
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
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                {testType === 'verbal' ? (
                  <BookOpen className="h-5 w-5 text-blue-600" />
                ) : (
                  <Calculator className="h-5 w-5 text-purple-600" />
                )}
                <h1 className="text-xl font-bold">
                  اختبار {testNumber} - {testType === 'verbal' ? 'لفظي' : 'كمي'}
                </h1>
              </div>
              <Badge variant="outline">
                {currentQuestionIndex + 1} / {questions.length}
              </Badge>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className={cn(
                  "font-mono text-lg font-bold",
                  timeLeft < 300 ? "text-red-500" : timeLeft < 600 ? "text-yellow-500" : "text-green-500"
                )}>
                  {formatTime(timeLeft)}
                </span>
              </div>
              
              <Button
                onClick={isPaused ? resumeTest : pauseTest}
                size="sm"
                variant="outline"
              >
                {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          
          <Progress value={progress} className="mt-4" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Question Navigation */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="text-sm">خريطة الأسئلة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 gap-2">
                  {questions.map((_, index) => (
                    <Button
                      key={index}
                      size="sm"
                      variant={index === currentQuestionIndex ? "default" : "outline"}
                      className={cn(
                        "h-8 w-8 p-0 text-xs",
                        selectedAnswers[index] !== undefined && "bg-green-100 border-green-300 text-green-700"
                      )}
                      onClick={() => jumpToQuestion(index)}
                    >
                      {index + 1}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Question */}
          <div className="lg:col-span-3">
            <Card className="min-h-[600px]">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    السؤال {currentQuestionIndex + 1}
                  </CardTitle>
                  <Badge variant="secondary">
                    {currentQuestion.subcategory || currentQuestion.category}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-lg leading-relaxed p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  {currentQuestion.text}
                </div>
                
                <div className="space-y-3">
                  {currentQuestion.options.map((option, index) => (
                    <Button
                      key={index}
                      variant={selectedAnswers[currentQuestionIndex] === index ? "default" : "outline"}
                      className={cn(
                        "w-full justify-start text-right p-4 h-auto whitespace-normal",
                        selectedAnswers[currentQuestionIndex] === index && "bg-blue-100 border-blue-300 text-blue-700"
                      )}
                      onClick={() => selectAnswer(index)}
                    >
                      <span className="font-bold mr-2">
                        {String.fromCharCode(65 + index)})
                      </span>
                      {option}
                    </Button>
                  ))}
                </div>
                
                <div className="flex justify-between pt-6">
                  <Button
                    onClick={previousQuestion}
                    disabled={currentQuestionIndex === 0}
                    variant="outline"
                  >
                    <SkipBack className="h-4 w-4 mr-2" />
                    السابق
                  </Button>
                  
                  {currentQuestionIndex === questions.length - 1 ? (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button className="bg-green-600 hover:bg-green-700 text-white">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          إنهاء الاختبار
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>إنهاء الاختبار</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <p>هل أنت متأكد من إنهاء الاختبار؟</p>
                          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                            <p className="text-sm text-yellow-700 dark:text-yellow-400 mb-2">
                              📊 إحصائيات الاختبار:
                            </p>
                            <div className="space-y-1 text-sm">
                              <p>الأسئلة المجابة: {Object.keys(selectedAnswers).length} / {questions.length}</p>
                              <p>الأسئلة المتبقية: {questions.length - Object.keys(selectedAnswers).length}</p>
                              {Object.keys(selectedAnswers).length < questions.length && (
                                <p className="text-red-600 dark:text-red-400 font-semibold">
                                  ⚠️ الأسئلة غير المجابة ستحسب خطأ
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-4 justify-end">
                            <Button variant="outline" onClick={() => {}}>
                              إلغاء
                            </Button>
                            <Button 
                              onClick={completeTest}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              إنهاء الاختبار
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  ) : (
                    <Button onClick={nextQuestion}>
                      التالي
                      <SkipForward className="h-4 w-4 ml-2" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}