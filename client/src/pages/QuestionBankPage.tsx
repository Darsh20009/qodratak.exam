import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Calculator, Download, Play, CheckCircle, Lock, Trophy, Brain, Target, Zap } from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

interface TestProgress {
  testNumber: number;
  completed: boolean;
  score?: number;
  completedAt?: string;
}

interface QuestionBankState {
  verbal: TestProgress[];
  quantitative: TestProgress[];
}

export default function QuestionBankPage() {
  const [questionBankState, setQuestionBankState] = useState<QuestionBankState>({
    verbal: [],
    quantitative: []
  });

  const [verbalQuestionCount, setVerbalQuestionCount] = useState(0);
  const [quantitativeQuestionCount, setQuantitativeQuestionCount] = useState(0);

  // Load question counts and progress from localStorage
  useEffect(() => {
    const loadQuestionCounts = async () => {
      try {
        const response = await fetch('/api/questions');
        const questions = await response.json();
        
        const verbalCount = questions.filter((q: any) => q.category === 'verbal').length;
        const quantitativeCount = questions.filter((q: any) => q.category === 'quantitative').length;
        
        setVerbalQuestionCount(verbalCount);
        setQuantitativeQuestionCount(quantitativeCount);

        // Initialize test progress
        const verbalTestCount = Math.ceil(verbalCount / 50);
        const quantitativeTestCount = Math.ceil(quantitativeCount / 50);

        const savedState = localStorage.getItem('questionBankProgress');
        if (savedState) {
          setQuestionBankState(JSON.parse(savedState));
        } else {
          const initialState: QuestionBankState = {
            verbal: Array.from({ length: verbalTestCount }, (_, i) => ({
              testNumber: i + 1,
              completed: false
            })),
            quantitative: Array.from({ length: quantitativeTestCount }, (_, i) => ({
              testNumber: i + 1,
              completed: false
            }))
          };
          setQuestionBankState(initialState);
        }
      } catch (error) {
        console.error('Error loading question counts:', error);
      }
    };

    loadQuestionCounts();
  }, []);

  // Save progress to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem('questionBankProgress', JSON.stringify(questionBankState));
  }, [questionBankState]);

  const TestCard = ({ 
    type, 
    testNumber, 
    completed, 
    score, 
    totalQuestions, 
    onStart, 
    onRetry 
  }: {
    type: 'verbal' | 'quantitative';
    testNumber: number;
    completed: boolean;
    score?: number;
    totalQuestions: number;
    onStart: () => void;
    onRetry: () => void;
  }) => {
    const startRange = (testNumber - 1) * 50 + 1;
    const endRange = Math.min(testNumber * 50, totalQuestions);
    const questionsInTest = endRange - startRange + 1;
    
    const getScoreColor = (score?: number) => {
      if (!score) return 'text-gray-500';
      if (score >= 90) return 'text-green-500';
      if (score >= 70) return 'text-blue-500';
      if (score >= 50) return 'text-yellow-500';
      return 'text-red-500';
    };

    const getScoreGrade = (score?: number) => {
      if (!score) return '';
      if (score >= 90) return 'ممتاز';
      if (score >= 70) return 'جيد جداً';
      if (score >= 50) return 'جيد';
      return 'يحتاج تحسين';
    };

    return (
      <Card className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-blue-500/50 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {type === 'verbal' ? (
                <BookOpen className="h-5 w-5 text-blue-600" />
              ) : (
                <Calculator className="h-5 w-5 text-purple-600" />
              )}
              <CardTitle className="text-lg">
                اختبار {testNumber}
              </CardTitle>
            </div>
            {completed && (
              <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                <CheckCircle className="h-3 w-3 mr-1" />
                مكتمل
              </Badge>
            )}
          </div>
          <CardDescription className="text-sm text-gray-600 dark:text-gray-400">
            الأسئلة {startRange} - {endRange} ({questionsInTest} سؤال)
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pt-0">
          <div className="space-y-4">
            {completed && score && (
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">النتيجة</p>
                    <p className={cn("text-2xl font-bold", getScoreColor(score))}>
                      {score}%
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600 dark:text-gray-400">التقدير</p>
                    <p className={cn("text-lg font-semibold", getScoreColor(score))}>
                      {getScoreGrade(score)}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex gap-2">
              {!completed ? (
                <Button 
                  onClick={onStart}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                >
                  <Play className="h-4 w-4 mr-2" />
                  بدء الاختبار
                </Button>
              ) : (
                <>
                  <Button 
                    onClick={onRetry}
                    variant="outline"
                    className="flex-1 border-blue-300 text-blue-600 hover:bg-blue-50 dark:border-blue-600 dark:text-blue-400"
                  >
                    <Target className="h-4 w-4 mr-2" />
                    إعادة الاختبار
                  </Button>
                  <Button 
                    onClick={() => downloadMistakes(type, testNumber)}
                    variant="outline"
                    className="flex-1 border-purple-300 text-purple-600 hover:bg-purple-50 dark:border-purple-600 dark:text-purple-400"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    تحميل الأخطاء
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const downloadMistakes = async (type: 'verbal' | 'quantitative', testNumber: number) => {
    try {
      // Get test results from localStorage
      const testResults = JSON.parse(localStorage.getItem('questionBankResults') || '{}');
      const testKey = `${type}_${testNumber}`;
      const testData = testResults[testKey];
      
      if (!testData) return;

      const mistakes = testData.answers.filter((answer: any) => !answer.correct);
      
      if (mistakes.length === 0) {
        alert('تهانينا! لم ترتكب أي أخطاء في هذا الاختبار 🎉');
        return;
      }

      // Create beautiful HTML content
      const htmlContent = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>أخطاء الاختبار - ${type === 'verbal' ? 'اللفظي' : 'الكمي'} - اختبار ${testNumber}</title>
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
        
        .header p {
            font-size: 1.2em;
            opacity: 0.9;
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
            color: #ffeb3b;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        
        .stat-label {
            font-size: 1.1em;
            opacity: 0.9;
            margin-top: 5px;
        }
        
        .question-card {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 15px;
            padding: 30px;
            margin-bottom: 25px;
            border: 1px solid rgba(255, 255, 255, 0.2);
            transition: transform 0.3s ease;
        }
        
        .question-card:hover {
            transform: translateY(-5px);
        }
        
        .question-number {
            background: linear-gradient(45deg, #ff6b6b, #ee5a6f);
            color: white;
            padding: 10px 20px;
            border-radius: 25px;
            font-weight: 600;
            display: inline-block;
            margin-bottom: 20px;
        }
        
        .question-text {
            font-size: 1.3em;
            font-weight: 600;
            margin-bottom: 20px;
            background: rgba(255, 255, 255, 0.1);
            padding: 20px;
            border-radius: 10px;
            border-right: 4px solid #ffeb3b;
        }
        
        .options {
            display: grid;
            gap: 15px;
            margin-bottom: 25px;
        }
        
        .option {
            padding: 15px 20px;
            border-radius: 10px;
            border: 2px solid transparent;
            transition: all 0.3s ease;
        }
        
        .option.correct {
            background: rgba(76, 175, 80, 0.3);
            border-color: #4caf50;
            color: #e8f5e8;
        }
        
        .option.incorrect {
            background: rgba(244, 67, 54, 0.3);
            border-color: #f44336;
            color: #ffebee;
        }
        
        .option.normal {
            background: rgba(255, 255, 255, 0.1);
            border-color: rgba(255, 255, 255, 0.2);
        }
        
        .explanation {
            background: rgba(255, 255, 255, 0.15);
            border-radius: 10px;
            padding: 20px;
            border-right: 4px solid #2196f3;
            margin-top: 20px;
        }
        
        .explanation h4 {
            color: #81c784;
            margin-bottom: 10px;
            font-weight: 600;
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
        
        .retry-button {
            background: linear-gradient(45deg, #ff6b6b, #ee5a6f);
            color: white;
            padding: 15px 30px;
            border: none;
            border-radius: 25px;
            font-size: 1.1em;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.3s ease;
            text-decoration: none;
            display: inline-block;
            margin: 10px;
        }
        
        .retry-button:hover {
            transform: translateY(-2px);
        }
        
        @media (max-width: 768px) {
            .container {
                padding: 10px;
            }
            
            .header h1 {
                font-size: 2em;
            }
            
            .stats {
                grid-template-columns: 1fr;
            }
            
            .question-card {
                padding: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎯 تحليل الأخطاء</h1>
            <p>اختبار ${type === 'verbal' ? 'اللفظي' : 'الكمي'} - الاختبار رقم ${testNumber}</p>
        </div>
        
        <div class="stats">
            <div class="stat-card">
                <div class="stat-number">${mistakes.length}</div>
                <div class="stat-label">عدد الأخطاء</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${testData.score}%</div>
                <div class="stat-label">النتيجة النهائية</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${testData.answers.length - mistakes.length}</div>
                <div class="stat-label">الإجابات الصحيحة</div>
            </div>
        </div>
        
        ${mistakes.map((mistake: any, index: number) => `
            <div class="question-card">
                <div class="question-number">السؤال ${mistake.questionNumber}</div>
                <div class="question-text">${mistake.question.text}</div>
                
                <div class="options">
                    ${mistake.question.options.map((option: string, optionIndex: number) => `
                        <div class="option ${optionIndex === mistake.question.correctAnswer ? 'correct' : 
                            optionIndex === mistake.selectedAnswer ? 'incorrect' : 'normal'}">
                            ${String.fromCharCode(65 + optionIndex)}) ${option}
                            ${optionIndex === mistake.question.correctAnswer ? ' ✓' : ''}
                            ${optionIndex === mistake.selectedAnswer ? ' ✗' : ''}
                        </div>
                    `).join('')}
                </div>
                
                ${mistake.question.explanation ? `
                    <div class="explanation">
                        <h4>💡 التفسير:</h4>
                        <p>${mistake.question.explanation}</p>
                    </div>
                ` : ''}
            </div>
        `).join('')}
        
        <div class="footer">
            <h3>💪 استمر في التحسين!</h3>
            <p>راجع هذه الأخطاء وتعلم منها لتحسين أدائك في الاختبارات القادمة</p>
            <a href="/" class="retry-button">🔄 إعادة الاختبار</a>
            <a href="/question-bank" class="retry-button">📚 العودة لبنك الأسئلة</a>
        </div>
    </div>
</body>
</html>`;

      // Download the HTML file
      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `اخطاء_${type === 'verbal' ? 'لفظي' : 'كمي'}_اختبار_${testNumber}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading mistakes:', error);
    }
  };

  const getOverallProgress = (tests: TestProgress[]) => {
    const completed = tests.filter(t => t.completed).length;
    return (completed / tests.length) * 100;
  };

  const getAverageScore = (tests: TestProgress[]) => {
    const completedTests = tests.filter(t => t.completed && t.score);
    if (completedTests.length === 0) return 0;
    return completedTests.reduce((sum, test) => sum + (test.score || 0), 0) / completedTests.length;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full">
              <Brain className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              بنك الأسئلة
            </h1>
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            اختبارات منظمة ومرتبة لتطوير مهاراتك في الأقسام اللفظية والكمية
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100">الأسئلة اللفظية</p>
                  <p className="text-3xl font-bold">{verbalQuestionCount}</p>
                </div>
                <BookOpen className="h-8 w-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100">الأسئلة الكمية</p>
                  <p className="text-3xl font-bold">{quantitativeQuestionCount}</p>
                </div>
                <Calculator className="h-8 w-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100">الاختبارات المكتملة</p>
                  <p className="text-3xl font-bold">
                    {questionBankState.verbal.filter(t => t.completed).length + 
                     questionBankState.quantitative.filter(t => t.completed).length}
                  </p>
                </div>
                <Trophy className="h-8 w-8 text-green-200" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-100">متوسط النتائج</p>
                  <p className="text-3xl font-bold">
                    {Math.round((getAverageScore(questionBankState.verbal) + 
                                getAverageScore(questionBankState.quantitative)) / 2)}%
                  </p>
                </div>
                <Zap className="h-8 w-8 text-yellow-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="verbal" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="verbal" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              بنك الأسئلة اللفظية
            </TabsTrigger>
            <TabsTrigger value="quantitative" className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              بنك الأسئلة الكمية
            </TabsTrigger>
          </TabsList>

          {/* Verbal Tests */}
          <TabsContent value="verbal" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-blue-600" />
                      الاختبارات اللفظية
                    </CardTitle>
                    <CardDescription>
                      {questionBankState.verbal.length} اختبار متاح • {verbalQuestionCount} سؤال إجمالي
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600 dark:text-gray-400">التقدم الإجمالي</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {Math.round(getOverallProgress(questionBankState.verbal))}%
                    </p>
                  </div>
                </div>
                <Progress 
                  value={getOverallProgress(questionBankState.verbal)} 
                  className="w-full" 
                />
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {questionBankState.verbal.map((test) => (
                    <TestCard
                      key={test.testNumber}
                      type="verbal"
                      testNumber={test.testNumber}
                      completed={test.completed}
                      score={test.score}
                      totalQuestions={verbalQuestionCount}
                      onStart={() => {
                        window.location.href = `/question-bank/verbal/${test.testNumber}`;
                      }}
                      onRetry={() => {
                        window.location.href = `/question-bank/verbal/${test.testNumber}`;
                      }}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Quantitative Tests */}
          <TabsContent value="quantitative" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Calculator className="h-5 w-5 text-purple-600" />
                      الاختبارات الكمية
                    </CardTitle>
                    <CardDescription>
                      {questionBankState.quantitative.length} اختبار متاح • {quantitativeQuestionCount} سؤال إجمالي
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600 dark:text-gray-400">التقدم الإجمالي</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {Math.round(getOverallProgress(questionBankState.quantitative))}%
                    </p>
                  </div>
                </div>
                <Progress 
                  value={getOverallProgress(questionBankState.quantitative)} 
                  className="w-full" 
                />
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {questionBankState.quantitative.map((test) => (
                    <TestCard
                      key={test.testNumber}
                      type="quantitative"
                      testNumber={test.testNumber}
                      completed={test.completed}
                      score={test.score}
                      totalQuestions={quantitativeQuestionCount}
                      onStart={() => {
                        window.location.href = `/question-bank/quantitative/${test.testNumber}`;
                      }}
                      onRetry={() => {
                        window.location.href = `/question-bank/quantitative/${test.testNumber}`;
                      }}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}