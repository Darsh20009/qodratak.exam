import { useState, useEffect } from 'react';
import { useLocation, useRoute } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Clock, CheckCircle, XCircle, AlertCircle, Download, ArrowRight, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiRequest } from '@/lib/queryClient';
import { PointsAndRankingCard } from '@/components/test-results/PointsAndRankingCard';

interface Question {
  id: number;
  category: string;
  text: string;
  options: string[];
  correctOptionIndex: number;
  explanation?: string;
  hint?: string;
}

interface Answer {
  questionIndex: number;
  userAnswer: number | null;
  isCorrect: boolean;
}

export default function PaperExamResultsPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // البيانات المستلمة من الصفحة السابقة
  const [questions, setQuestions] = useState<Question[]>([]);
  const [examTitle, setExamTitle] = useState('');
  const [timeLimit, setTimeLimit] = useState(0);
  
  // حالة الإدخال
  const [currentStep, setCurrentStep] = useState<'timer' | 'input' | 'results'>('timer');
  const [timeLeft, setTimeLeft] = useState(0);
  const [timeExpired, setTimeExpired] = useState(false);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [showWrongOnly, setShowWrongOnly] = useState(false);
  
  const QUESTIONS_PER_PAGE = 10;

  useEffect(() => {
    // استرجاع بيانات الاختبار من localStorage
    const savedExam = localStorage.getItem('paperExamData');
    if (savedExam) {
      const examData = JSON.parse(savedExam);
      setQuestions(examData.questions || []);
      setExamTitle(examData.title || 'اختبار ورقي');
      setTimeLimit(examData.timeLimit || 120);
      setTimeLeft((examData.timeLimit || 120) * 60); // تحويل إلى ثواني
      
      // تهيئة الإجابات
      const initialAnswers = (examData.questions || []).map((_: any, index: number) => ({
        questionIndex: index,
        userAnswer: null,
        isCorrect: false
      }));
      setAnswers(initialAnswers);
    }
  }, []);

  // Timer
  useEffect(() => {
    if (currentStep !== 'timer' || timeExpired) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setTimeExpired(true);
          toast({
            title: 'انتهى الوقت',
            description: 'يمكنك الآن إدخال إجاباتك',
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentStep, timeExpired, toast]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleFinishExam = () => {
    setCurrentStep('input');
    setTimeExpired(true);
  };

  const handleAnswerChange = (questionIndex: number, answerIndex: number) => {
    setAnswers(prev => {
      const newAnswers = [...prev];
      newAnswers[questionIndex] = {
        ...newAnswers[questionIndex],
        userAnswer: answerIndex,
        isCorrect: answerIndex === questions[questionIndex].correctOptionIndex
      };
      return newAnswers;
    });
  };

  const calculateResults = () => {
    const verbalQuestions = questions.filter(q => 
      q.category === 'verbal' || q.category === 'لفظي'
    );
    const quantQuestions = questions.filter(q => 
      q.category === 'quantitative' || q.category === 'كمي'
    );

    const verbalCorrect = answers.filter((a, i) => 
      (questions[i].category === 'verbal' || questions[i].category === 'لفظي') && 
      a.userAnswer !== null && 
      a.isCorrect
    ).length;

    const quantCorrect = answers.filter((a, i) => 
      (questions[i].category === 'quantitative' || questions[i].category === 'كمي') && 
      a.userAnswer !== null && 
      a.isCorrect
    ).length;

    const totalCorrect = answers.filter(a => a.userAnswer !== null && a.isCorrect).length;
    const totalAnswered = answers.filter(a => a.userAnswer !== null).length;
    const skipped = questions.length - totalAnswered;
    // الأسئلة المتروكة تُحسب خطأ، لذلك totalWrong = إجمالي الأسئلة - الإجابات الصحيحة
    const totalWrong = questions.length - totalCorrect;

    return {
      verbalCorrect,
      verbalTotal: verbalQuestions.length,
      verbalPercentage: verbalQuestions.length > 0 ? (verbalCorrect / verbalQuestions.length) * 100 : 0,
      quantCorrect,
      quantTotal: quantQuestions.length,
      quantPercentage: quantQuestions.length > 0 ? (quantCorrect / quantQuestions.length) * 100 : 0,
      totalCorrect,
      totalWrong,
      totalPercentage: questions.length > 0 ? (totalCorrect / questions.length) * 100 : 0,
      skipped
    };
  };

  const handleSubmitAnswers = async () => {
    const unanswered = answers.filter(a => a.userAnswer === null).length;
    
    if (unanswered > 0) {
      const confirmed = window.confirm(
        `لديك ${unanswered} سؤال لم تجب عليه. الأسئلة المتروكة ستحسب خطأ. هل تريد المتابعة؟`
      );
      if (!confirmed) return;
    }

    setCurrentStep('results');
    
    // حفظ النتائج في قاعدة البيانات وتحديث النقاط
    const results = calculateResults();
    const storedUser = localStorage.getItem('user');
    
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        const timeTakenInSeconds = (timeLimit * 60) - timeLeft;
        
        const response = await apiRequest('POST', '/api/test-results', {
          userId: user.id,
          testType: 'paper-exam',
          difficulty: 'advanced',
          score: results.totalCorrect,
          totalQuestions: questions.length,
          timeTaken: timeTakenInSeconds
        }) as any;
        
        // حفظ النقاط المكتسبة في localStorage للعرض
        if (response?.pointsEarned !== undefined) {
          localStorage.setItem('lastExamPointsEarned', response.pointsEarned.toString());
        }
        
        // إطلاق حدث تحديث النقاط
        window.dispatchEvent(new Event('pointsUpdated'));
        
        toast({
          title: 'تم التقييم',
          description: `تم حساب نتائجك وتحديث نقاطك بنجاح. النقاط المكتسبة: ${response?.pointsEarned >= 0 ? '+' : ''}${response?.pointsEarned || 0}`,
        });
      } catch (error) {
        console.error('Failed to save test results:', error);
        toast({
          title: 'تم التقييم',
          description: 'تم حساب نتائجك بنجاح',
        });
      }
    } else {
      toast({
        title: 'تم التقييم',
        description: 'تم حساب نتائجك بنجاح',
      });
    }
  };

  const downloadMistakesReport = () => {
    const results = calculateResults();
    // الأسئلة المتروكة تُحسب خطأ، لذلك نُضمّنها في التقرير
    const wrongAnswers = answers
      .map((a, i) => ({
        ...a,
        question: questions[i],
        questionNumber: i + 1
      }))
      .filter(a => a.userAnswer === null || !a.isCorrect);

    const reportHtml = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <title>تقرير الأخطاء - ${examTitle}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Cairo', Arial, sans-serif;
            background: white;
            direction: rtl;
            text-align: right;
            padding: 30px;
            color: #000;
        }
        
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 3px solid #000;
        }
        
        .header h1 {
            font-size: 28px;
            color: #000;
            margin-bottom: 10px;
        }
        
        .header .exam-title {
            font-size: 20px;
            color: #333;
        }
        
        .summary {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 30px;
            border: 2px solid #000;
        }
        
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
        }
        
        .summary-item {
            text-align: center;
            padding: 15px;
            background: white;
            border-radius: 8px;
            border: 2px solid #000;
        }
        
        .summary-item .value {
            font-size: 32px;
            font-weight: 700;
            color: #dc2626;
            margin-bottom: 5px;
        }
        
        .summary-item .label {
            font-size: 14px;
            color: #666;
        }
        
        .question-box {
            background: white;
            border: 3px solid #000;
            border-radius: 10px;
            padding: 25px;
            margin-bottom: 25px;
            page-break-inside: avoid;
        }
        
        .question-header {
            display: flex;
            align-items: center;
            margin-bottom: 15px;
            padding-bottom: 15px;
            border-bottom: 2px solid #eee;
        }
        
        .question-number {
            background: #dc2626;
            color: white;
            width: 50px;
            height: 50px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 22px;
            font-weight: 700;
            margin-left: 15px;
        }
        
        .question-category {
            background: #f3f4f6;
            padding: 8px 15px;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 600;
            color: #555;
        }
        
        .question-text {
            font-size: 18px;
            line-height: 2;
            color: #000;
            margin-bottom: 20px;
            font-weight: 500;
        }
        
        .options {
            margin-bottom: 20px;
        }
        
        .option {
            padding: 12px 15px;
            margin-bottom: 10px;
            border-radius: 8px;
            border: 2px solid #e5e7eb;
            display: flex;
            align-items: center;
        }
        
        .option.correct {
            background: #dcfce7;
            border-color: #16a34a;
        }
        
        .option.wrong {
            background: #fee2e2;
            border-color: #dc2626;
        }
        
        .option-letter {
            width: 35px;
            height: 35px;
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            margin-left: 12px;
            background: white;
            border: 2px solid #000;
        }
        
        .option-text {
            flex: 1;
            font-size: 16px;
            line-height: 1.8;
        }
        
        .explanation {
            background: #fffbeb;
            border-right: 4px solid #f59e0b;
            padding: 15px;
            border-radius: 8px;
            margin-top: 15px;
        }
        
        .explanation-title {
            font-weight: 700;
            color: #92400e;
            margin-bottom: 8px;
            font-size: 16px;
        }
        
        .explanation-text {
            color: #78350f;
            line-height: 1.8;
            font-size: 15px;
        }
        
        .hint {
            background: #dbeafe;
            border-right: 4px solid #3b82f6;
            padding: 15px;
            border-radius: 8px;
            margin-top: 10px;
        }
        
        .hint-title {
            font-weight: 700;
            color: #1e40af;
            margin-bottom: 8px;
            font-size: 16px;
        }
        
        .hint-text {
            color: #1e3a8a;
            line-height: 1.8;
            font-size: 15px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>📋 تقرير الأخطاء التفصيلي</h1>
        <div class="exam-title">${examTitle}</div>
    </div>
    
    <div class="summary">
        <div class="summary-grid">
            <div class="summary-item">
                <div class="value">${wrongAnswers.length}</div>
                <div class="label">عدد الأخطاء</div>
            </div>
            <div class="summary-item">
                <div class="value">${results.totalCorrect}</div>
                <div class="label">الإجابات الصحيحة</div>
            </div>
            <div class="summary-item">
                <div class="value">${results.totalPercentage.toFixed(1)}%</div>
                <div class="label">النسبة المئوية</div>
            </div>
        </div>
    </div>
    
    ${wrongAnswers.map(item => `
        <div class="question-box">
            <div class="question-header">
                <div class="question-number">${item.questionNumber}</div>
                <div class="question-category">${item.question.category === 'verbal' || item.question.category === 'لفظي' ? 'لفظي' : 'كمي'}</div>
            </div>
            
            <div class="question-text">${item.question.text}</div>
            
            <div class="options">
                ${item.question.options.map((opt, i) => `
                    <div class="option ${i === item.question.correctOptionIndex ? 'correct' : ''} ${i === item.userAnswer ? 'wrong' : ''}">
                        <div class="option-letter">${String.fromCharCode(65 + i)}</div>
                        <div class="option-text">${opt}</div>
                    </div>
                `).join('')}
            </div>
            
            ${item.question.explanation ? `
                <div class="explanation">
                    <div class="explanation-title">💡 الشرح:</div>
                    <div class="explanation-text">${item.question.explanation}</div>
                </div>
            ` : ''}
            
            ${item.question.hint ? `
                <div class="hint">
                    <div class="hint-title">✨ تلميحة:</div>
                    <div class="hint-text">${item.question.hint}</div>
                </div>
            ` : ''}
        </div>
    `).join('')}
</body>
</html>
    `;

    const blob = new Blob([reportHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `تقرير_الأخطاء_${examTitle}_${Date.now()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'تم التحميل',
      description: 'تم تحميل تقرير الأخطاء بنجاح',
    });
  };

  const results = currentStep === 'results' ? calculateResults() : null;

  // صفحة حاسبة الوقت
  if (currentStep === 'timer') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-600 to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl bg-white/10 backdrop-blur-lg border-white/20">
          <CardHeader>
            <CardTitle className="text-center text-3xl font-bold text-white">
              {examTitle}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-green-100/30 blur-3xl rounded-full"></div>
                <div className="relative bg-gradient-to-br from-green-600 to-amber-600 rounded-full p-12 shadow-2xl">
                  <Clock className="w-24 h-24 text-white" />
                </div>
              </div>
            </div>

            <div className="text-center space-y-4">
              <div className="text-6xl font-bold text-white font-mono">
                {formatTime(timeLeft)}
              </div>
              <div className="text-xl text-green-700">
                الوقت المتبقي
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm text-green-700">
                <span>التقدم</span>
                <span>{((timeLimit * 60 - timeLeft) / (timeLimit * 60) * 100).toFixed(0)}%</span>
              </div>
              <Progress 
                value={(timeLimit * 60 - timeLeft) / (timeLimit * 60) * 100} 
                className="h-3"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                <div className="text-3xl font-bold text-white">{questions.length}</div>
                <div className="text-sm text-green-700">عدد الأسئلة</div>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                <div className="text-3xl font-bold text-white">{timeLimit}</div>
                <div className="text-sm text-green-700">دقيقة</div>
              </div>
            </div>

            <Button
              onClick={handleFinishExam}
              className="w-full bg-gradient-to-r from-green-600 to-amber-600 hover:from-green-600 hover:to-amber-600 text-white text-lg py-6"
              data-testid="button-finish-exam"
            >
              {timeExpired ? 'انتهى الوقت - أدخل إجاباتك' : 'إنهاء الاختبار وإدخال الإجابات'}
            </Button>

            <Button
              onClick={() => setLocation('/paper-exam')}
              variant="outline"
              className="w-full"
              data-testid="button-back"
            >
              العودة
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // صفحة إدخال الإجابات
  if (currentStep === 'input') {
    const startIdx = currentPage * QUESTIONS_PER_PAGE;
    const endIdx = Math.min(startIdx + QUESTIONS_PER_PAGE, questions.length);
    const currentQuestions = questions.slice(startIdx, endIdx);
    const totalPages = Math.ceil(questions.length / QUESTIONS_PER_PAGE);

    const answeredCount = answers.filter(a => a.userAnswer !== null).length;
    const progress = (answeredCount / questions.length) * 100;

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-center">{examTitle}</CardTitle>
              <div className="space-y-3 mt-4">
                <div className="flex justify-between text-sm">
                  <span>التقدم: {answeredCount} / {questions.length}</span>
                  <span>{progress.toFixed(0)}%</span>
                </div>
                <Progress value={progress} />
              </div>
            </CardHeader>
          </Card>

          {currentQuestions.map((question, localIdx) => {
            const globalIdx = startIdx + localIdx;
            const answer = answers[globalIdx];
            
            return (
              <Card key={question.id} className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-green-600 to-amber-600">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-white text-green-700 w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg">
                        {globalIdx + 1}
                      </div>
                      <span className="text-white font-semibold">
                        {question.category === 'verbal' || question.category === 'لفظي' ? 'لفظي' : 'كمي'}
                      </span>
                    </div>
                    {answer.userAnswer !== null && (
                      <CheckCircle className="w-6 h-6 text-white" />
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <p className="text-lg leading-relaxed">{question.text}</p>
                  
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                      إجابتك:
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      {question.options.map((_, optIdx) => (
                        <Button
                          key={optIdx}
                          onClick={() => handleAnswerChange(globalIdx, optIdx)}
                          variant={answer.userAnswer === optIdx ? "default" : "outline"}
                          className={cn(
                            "h-auto py-4 text-lg font-semibold",
                            answer.userAnswer === optIdx && "bg-green-100 hover:bg-green-100"
                          )}
                          data-testid={`button-answer-${globalIdx}-${optIdx}`}
                        >
                          {String.fromCharCode(65 + optIdx)}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          <div className="flex items-center justify-between gap-4">
            <Button
              onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
              disabled={currentPage === 0}
              variant="outline"
              className="flex items-center gap-2"
              data-testid="button-prev-page"
            >
              <ArrowRight className="w-5 h-5" />
              السابق
            </Button>

            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                صفحة {currentPage + 1} من {totalPages}
              </p>
            </div>

            {currentPage < totalPages - 1 ? (
              <Button
                onClick={() => setCurrentPage(prev => prev + 1)}
                className="flex items-center gap-2 bg-green-100 hover:bg-green-100"
                data-testid="button-next-page"
              >
                التالي
                <ArrowLeft className="w-5 h-5" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmitAnswers}
                className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                data-testid="button-submit-answers"
              >
                عرض النتائج
                <CheckCircle className="w-5 h-5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // صفحة النتائج
  if (currentStep === 'results' && results) {
    // قراءة النقاط المكتسبة من localStorage
    const pointsEarned = parseFloat(localStorage.getItem('lastExamPointsEarned') || '0');
    
    // الأسئلة المتروكة تُحسب خطأ، لذلك نُضمّنها في قائمة الأخطاء
    const wrongAnswers = answers
      .map((a, i) => ({ ...a, question: questions[i], questionNumber: i + 1 }))
      .filter(a => a.userAnswer === null || !a.isCorrect);

    const displayedQuestions = showWrongOnly ? wrongAnswers : 
      answers.map((a, i) => ({ ...a, question: questions[i], questionNumber: i + 1 }));

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 pb-20">
        <div className="max-w-6xl mx-auto space-y-6">
          <Card className="bg-gradient-to-r from-green-600 to-amber-600 text-white">
            <CardHeader>
              <CardTitle className="text-3xl text-center">نتائج {examTitle}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white/20 backdrop-blur rounded-lg p-6 text-center">
                  <div className="text-5xl font-bold mb-2">{results.verbalPercentage.toFixed(1)}%</div>
                  <div className="text-sm opacity-90">اللفظي</div>
                  <div className="text-xs mt-1">{results.verbalCorrect} / {results.verbalTotal}</div>
                </div>
                <div className="bg-white/20 backdrop-blur rounded-lg p-6 text-center">
                  <div className="text-5xl font-bold mb-2">{results.quantPercentage.toFixed(1)}%</div>
                  <div className="text-sm opacity-90">الكمي</div>
                  <div className="text-xs mt-1">{results.quantCorrect} / {results.quantTotal}</div>
                </div>
                <div className="bg-white/20 backdrop-blur rounded-lg p-6 text-center">
                  <div className="text-5xl font-bold mb-2">{results.totalPercentage.toFixed(1)}%</div>
                  <div className="text-sm opacity-90">الإجمالي</div>
                  <div className="text-xs mt-1">{results.totalCorrect} / {questions.length}</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-green-500/30 backdrop-blur rounded-lg p-4 text-center">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2" />
                  <div className="text-2xl font-bold">{results.totalCorrect}</div>
                  <div className="text-sm">صحيحة</div>
                </div>
                <div className="bg-red-500/30 backdrop-blur rounded-lg p-4 text-center">
                  <XCircle className="w-8 h-8 mx-auto mb-2" />
                  <div className="text-2xl font-bold">{results.totalWrong}</div>
                  <div className="text-sm">خاطئة</div>
                </div>
                <div className="bg-yellow-500/30 backdrop-blur rounded-lg p-4 text-center">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                  <div className="text-2xl font-bold">{results.skipped}</div>
                  <div className="text-sm">متروكة</div>
                </div>
              </div>

              <Button
                onClick={downloadMistakesReport}
                className="w-full bg-white text-green-700 hover:bg-gray-100"
                data-testid="button-download-report"
              >
                <Download className="w-5 h-5 ml-2" />
                تحميل تقرير الأخطاء مع الشرح
              </Button>
            </CardContent>
          </Card>

          {/* بطاقة النقاط والترتيب */}
          <PointsAndRankingCard pointsEarned={pointsEarned} className="mb-6" />

          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">مراجعة الأسئلة</h2>
            <Button
              onClick={() => setShowWrongOnly(!showWrongOnly)}
              variant="outline"
              data-testid="button-toggle-filter"
            >
              {showWrongOnly ? 'عرض جميع الأسئلة' : 'عرض الأخطاء والمتروكة'}
            </Button>
          </div>

          <div className="space-y-4">
            {displayedQuestions.map((item) => {
              const isAnswered = item.userAnswer !== null;
              const isCorrect = item.isCorrect;
              
              return (
                <Card 
                  key={item.questionNumber}
                  className={cn(
                    "border-2",
                    !isAnswered && "border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20",
                    isAnswered && isCorrect && "border-green-400 bg-green-50 dark:bg-green-900/20",
                    isAnswered && !isCorrect && "border-red-400 bg-red-50 dark:bg-red-900/20"
                  )}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg",
                          !isAnswered && "bg-yellow-500 text-white",
                          isAnswered && isCorrect && "bg-green-500 text-white",
                          isAnswered && !isCorrect && "bg-red-500 text-white"
                        )}>
                          {item.questionNumber}
                        </div>
                        <span className="font-semibold">
                          {item.question.category === 'verbal' || item.question.category === 'لفظي' ? 'لفظي' : 'كمي'}
                        </span>
                      </div>
                      {!isAnswered && <AlertCircle className="w-6 h-6 text-yellow-500" />}
                      {isAnswered && isCorrect && <CheckCircle className="w-6 h-6 text-green-500" />}
                      {isAnswered && !isCorrect && <XCircle className="w-6 h-6 text-red-500" />}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-lg leading-relaxed">{item.question.text}</p>

                    <div className="space-y-2">
                      {item.question.options.map((opt, i) => (
                        <div
                          key={i}
                          className={cn(
                            "p-3 rounded-lg border-2 flex items-center gap-3",
                            i === item.question.correctOptionIndex && "bg-green-100 dark:bg-green-900/30 border-green-500",
                            i === item.userAnswer && i !== item.question.correctOptionIndex && "bg-red-100 dark:bg-red-900/30 border-red-500",
                            i !== item.question.correctOptionIndex && i !== item.userAnswer && "bg-gray-100 dark:bg-gray-800 border-gray-300"
                          )}
                        >
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center font-bold",
                            i === item.question.correctOptionIndex && "bg-green-500 text-white",
                            i === item.userAnswer && i !== item.question.correctOptionIndex && "bg-red-500 text-white",
                            i !== item.question.correctOptionIndex && i !== item.userAnswer && "bg-gray-300 text-gray-700"
                          )}>
                            {String.fromCharCode(65 + i)}
                          </div>
                          <span className="flex-1">{opt}</span>
                          {i === item.question.correctOptionIndex && (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          )}
                          {i === item.userAnswer && i !== item.question.correctOptionIndex && (
                            <XCircle className="w-5 h-5 text-red-600" />
                          )}
                        </div>
                      ))}
                    </div>

                    {!isAnswered && (
                      <div className="bg-yellow-100 dark:bg-yellow-900/30 border-r-4 border-yellow-500 p-4 rounded">
                        <p className="font-semibold text-yellow-800 dark:text-yellow-200">
                          ⚠️ لم تجب على هذا السؤال - يحسب خطأ
                        </p>
                      </div>
                    )}

                    {isAnswered && !isCorrect && item.question.explanation && (
                      <div className="bg-amber-50 dark:bg-amber-900/20 border-r-4 border-amber-500 p-4 rounded">
                        <p className="font-semibold text-amber-900 dark:text-amber-100 mb-2">
                          💡 الشرح:
                        </p>
                        <p className="text-amber-800 dark:text-amber-200">
                          {item.question.explanation}
                        </p>
                      </div>
                    )}

                    {isAnswered && !isCorrect && item.question.hint && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 border-r-4 border-blue-500 p-4 rounded">
                        <p className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                          ✨ تلميحة:
                        </p>
                        <p className="text-blue-800 dark:text-blue-200">
                          {item.question.hint}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="flex justify-center gap-4">
            <Button
              onClick={() => setLocation('/paper-exam')}
              className="bg-gradient-to-r from-green-600 to-amber-600 hover:from-green-600 hover:to-amber-600"
              data-testid="button-new-exam"
            >
              اختبار جديد
            </Button>
            <Button
              onClick={() => setLocation('/')}
              variant="outline"
              data-testid="button-home"
            >
              الصفحة الرئيسية
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
