import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Calculator, Download, Play, CheckCircle, Lock, Target, Users } from "lucide-react";
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
  const [loading, setLoading] = useState(true);
  const [accessCodeInput, setAccessCodeInput] = useState('');
  
  // Premium and daily limit state
  const [user, setUser] = useState<any>(null);
  const [dailyTestsTaken, setDailyTestsTaken] = useState(0);
  const MAX_DAILY_FREE_TESTS = 1;

  // Generate access code for a test
  const generateAccessCode = (type: string, testNumber: number) => {
    const base = `${type.toUpperCase()}${testNumber}${new Date().getFullYear()}`;
    const hash = btoa(base).replace(/[^A-Z0-9]/g, '').substring(0, 6);
    return hash;
  };

  // Check access code and unlock tests
  const checkAccessCode = (inputCode: string) => {
    if (!inputCode || inputCode.length < 4) return false;

    const accessCodes = JSON.parse(localStorage.getItem('testAccessCodes') || '{}');

    // Check if code matches any test
    for (const [testKey, code] of Object.entries(accessCodes)) {
      if (code === inputCode.toUpperCase()) {
        // Unlock all tests up to this point
        const [category, testNum] = testKey.split('_');
        const testNumber = parseInt(testNum);

        setQuestionBankState(prev => {
          const updated = { ...prev };
          updated[category] = updated[category].map(test => 
            test.testNumber <= testNumber 
              ? { ...test, completed: true, score: test.score || 75 }
              : test
          );

          // Save to localStorage
          localStorage.setItem('questionBankProgress', JSON.stringify(updated));

          return updated;
        });

        alert(`✅ تم فتح الاختبارات بنجاح!\nتم فتح جميع اختبارات ${category === 'verbal' ? 'اللفظي' : 'الكمي'} حتى الاختبار رقم ${testNumber}`);
        setAccessCodeInput('');
        return true;
      }
    }

    alert('❌ كود الوصول غير صحيح. يرجى المحاولة مرة أخرى.');
    return false;
  };

  // Load user data and daily limits
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Error parsing user:", error);
      }
    }

    // Load daily test count
    const today = new Date().toDateString();
    const testsToday = JSON.parse(localStorage.getItem(`dailyQuestionBankTests_${today}`) || '0');
    setDailyTestsTaken(testsToday);
  }, []);

  // Check premium status
  const isPremiumUser = user && (
    user.subscription?.type === 'Pro' || 
    user.subscription?.type === 'Pro Life' || 
    user.subscription?.type === 'Pro Live'
  );

  const canTakeTest = isPremiumUser || dailyTestsTaken < MAX_DAILY_FREE_TESTS;

  // Record test taken for free users
  const recordTestTaken = () => {
    if (!isPremiumUser) {
      const today = new Date().toDateString();
      const newCount = dailyTestsTaken + 1;
      localStorage.setItem(`dailyQuestionBankTests_${today}`, JSON.stringify(newCount));
      setDailyTestsTaken(newCount);
    }
  };

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
        let newState: QuestionBankState;

        if (savedState) {
          try {
            const parsedState = JSON.parse(savedState);
            // Ensure we have the correct number of tests based on current question counts
            newState = {
              verbal: Array.from({ length: verbalTestCount }, (_, i) => {
                const existingTest = parsedState.verbal?.find((t: any) => t.testNumber === i + 1);
                return existingTest || {
                  testNumber: i + 1,
                  completed: false
                };
              }),
              quantitative: Array.from({ length: quantitativeTestCount }, (_, i) => {
                const existingTest = parsedState.quantitative?.find((t: any) => t.testNumber === i + 1);
                return existingTest || {
                  testNumber: i + 1,
                  completed: false
                };
              })
            };
          } catch (e) {
            // If parsing fails, create fresh state
            newState = {
              verbal: Array.from({ length: verbalTestCount }, (_, i) => ({
                testNumber: i + 1,
                completed: false
              })),
              quantitative: Array.from({ length: quantitativeTestCount }, (_, i) => ({
                testNumber: i + 1,
                completed: false
              }))
            };
          }
        } else {
          newState = {
            verbal: Array.from({ length: verbalTestCount }, (_, i) => ({
              testNumber: i + 1,
              completed: false
            })),
            quantitative: Array.from({ length: quantitativeTestCount }, (_, i) => ({
              testNumber: i + 1,
              completed: false
            }))
          };
        }

        setQuestionBankState(newState);
        console.log('Question Bank State initialized:', newState);
        console.log('Verbal count:', verbalCount, 'Quantitative count:', quantitativeCount);
        console.log('Verbal tests:', verbalTestCount, 'Quantitative tests:', quantitativeTestCount);
        setLoading(false);
      } catch (error) {
        console.error('Error loading question counts:', error);
        setLoading(false);
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
      if (score >= 90) return 'text-green-600';
      if (score >= 70) return 'text-blue-600';
      if (score >= 50) return 'text-amber-600';
      return 'text-red-600';
    };

    const getScoreBg = (score?: number) => {
      if (!score) return 'bg-gray-50';
      if (score >= 90) return 'bg-green-50';
      if (score >= 70) return 'bg-blue-50';
      if (score >= 50) return 'bg-amber-50';
      return 'bg-red-50';
    };

    return (
      <Card className="bg-white border border-gray-200 hover:shadow-md transition-all duration-200">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center",
                type === 'verbal' ? 'bg-blue-100' : 'bg-purple-100'
              )}>
                {type === 'verbal' ? (
                  <BookOpen className="h-5 w-5 text-blue-600" />
                ) : (
                  <Calculator className="h-5 w-5 text-purple-600" />
                )}
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-gray-900">
                  اختبار {testNumber}
                </CardTitle>
                <CardDescription className="text-sm text-gray-500">
                  الأسئلة {startRange} - {endRange}
                </CardDescription>
              </div>
            </div>
            {completed && (
              <Badge className="bg-green-100 text-green-700 border-green-200">
                <CheckCircle className="h-3 w-3 mr-1" />
                مكتمل
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="space-y-4">
            {completed && score && (
              <div className={cn("rounded-lg p-4 border", getScoreBg(score))}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">النتيجة</p>
                    <p className={cn("text-xl font-bold", getScoreColor(score))}>
                      {score}%
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">عدد الأسئلة</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {questionsInTest}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              {!completed ? (
                <Button 
                  onClick={onStart}
                  className={cn(
                    "flex-1 text-white",
                    type === 'verbal' 
                      ? 'bg-blue-600 hover:bg-blue-700' 
                      : 'bg-purple-600 hover:bg-purple-700'
                  )}
                >
                  <Play className="h-4 w-4 mr-2" />
                  بدء الاختبار
                </Button>
              ) : (
                <>
                  <Button 
                    onClick={onRetry}
                    variant="outline"
                    className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    <Target className="h-4 w-4 mr-2" />
                    إعادة الاختبار
                  </Button>
                  <Button 
                    onClick={() => downloadMistakes(type, testNumber)}
                    variant="outline"
                    className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    تحميل التحليل
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

      if (!testData) {
        alert('لم يتم العثور على نتائج هذا الاختبار. يرجى إعادة الاختبار أولاً.');
        return;
      }

      const mistakes = testData.answers.filter((answer: any) => !answer.correct);
      const unanswered = testData.answers.filter((answer: any) => answer.selectedAnswer === -1);

      if (mistakes.length === 0 && unanswered.length === 0) {
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
                <div class="stat-label">الأخطاء</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${unanswered.length}</div>
                <div class="stat-label">الأسئلة غير المجابة</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${testData.score}%</div>
                <div class="stat-label">النتيجة النهائية</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${testData.answers.filter((a: any) => a.correct).length}</div>
                <div class="stat-label">الإجابات الصحيحة</div>
            </div>
        </div>

        ${[...mistakes, ...unanswered].map((mistake: any, index: number) => `
            <div class="question-card">
                <div class="question-number">السؤال ${mistake.questionNumber}</div>
                <div class="question-text">${mistake.question.text}</div>

                <div class="options">
                    ${mistake.question.options.map((option: string, optionIndex: number) => `
                        <div class="option ${optionIndex === mistake.question.correctAnswer ? 'correct' : 
                            optionIndex === mistake.selectedAnswer ? 'incorrect' : 'normal'}">
                            ${String.fromCharCode(65 + optionIndex)}) ${option}
                            ${optionIndex === mistake.question.correctAnswer ? ' ✓ (الإجابة الصحيحة)' : ''}
                            ${optionIndex === mistake.selectedAnswer && mistake.selectedAnswer !== -1 ? ' ✗ (اختيارك)' : ''}
                            ${mistake.selectedAnswer === -1 && optionIndex === 0 ? ' (لم يتم الإجابة)' : ''}
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
      a.download = `اخطاء_${type === 'verbal' ? 'لفظي' : 'الكمي'}_اختبار_${testNumber}.html`;
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل بنك الأسئلة...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              بنك الأسئلة
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
              مجموعة شاملة من الأسئلة الأصلية مقسمة إلى اختبارات متدرجة لضمان التحضير الأمثل
            </p>
            
            {/* Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                  {verbalQuestionCount + quantitativeQuestionCount}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">إجمالي الأسئلة</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-1">
                  {questionBankState.verbal.length + questionBankState.quantitative.length}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">عدد الاختبارات</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
                  {questionBankState.verbal.filter(t => t.completed).length + 
                   questionBankState.quantitative.filter(t => t.completed).length}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">مكتمل</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mb-1">
                  {Math.round((getAverageScore(questionBankState.verbal) + 
                              getAverageScore(questionBankState.quantitative)) / 2)}%
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">متوسط النتائج</div>
              </div>
            </div>

            {/* Daily limit notice for free users */}
            {!isPremiumUser && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mt-8 max-w-md mx-auto">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <span className="text-amber-800 dark:text-amber-300 font-medium text-sm">حساب مجاني</span>
                </div>
                <p className="text-sm text-amber-700 dark:text-amber-300 mb-2">
                  {MAX_DAILY_FREE_TESTS - dailyTestsTaken} اختبار متبقي اليوم
                </p>
                <div className="w-full bg-amber-200 dark:bg-amber-800 rounded-full h-2">
                  <div 
                    className="bg-amber-500 dark:bg-amber-400 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(dailyTestsTaken / MAX_DAILY_FREE_TESTS) * 100}%` }}
                  />
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <Tabs defaultValue="verbal" className="w-full">
          {/* Tab Navigation */}
          <div className="flex justify-center mb-8">
            <TabsList className="grid grid-cols-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-1 shadow-sm">
              <TabsTrigger 
                value="verbal" 
                className="flex items-center gap-2 px-6 py-3 text-gray-600 dark:text-gray-400 data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-md transition-all font-medium"
              >
                <BookOpen className="h-4 w-4" />
                القسم اللفظي
              </TabsTrigger>
              <TabsTrigger 
                value="quantitative" 
                className="flex items-center gap-2 px-6 py-3 text-gray-600 dark:text-gray-400 data-[state=active]:bg-purple-600 data-[state=active]:text-white rounded-md transition-all font-medium"
              >
                <Calculator className="h-4 w-4" />
                القسم الكمي
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Verbal Tests */}
          <TabsContent value="verbal" className="space-y-6">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    الاختبارات اللفظية
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300">
                    {questionBankState.verbal.length} اختبار • {verbalQuestionCount} سؤال
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">معدل الإنجاز</div>
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {Math.round(getOverallProgress(questionBankState.verbal))}%
                  </div>
                </div>
              </div>
              
              <div className="mb-6">
                <Progress 
                  value={getOverallProgress(questionBankState.verbal)} 
                  className="w-full h-3"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {questionBankState.verbal.map((test) => {
                  // Check if previous test is completed with 50+ score (except for test 1)
                  const previousTest = questionBankState.verbal.find(t => t.testNumber === test.testNumber - 1);
                  const previousTestPassed = test.testNumber === 1 || 
                    (previousTest?.completed && (previousTest?.score || 0) >= 50);

                  return (
                    <div key={test.testNumber} className="relative">
                      {!previousTestPassed && (
                        <div className="absolute inset-0 bg-gray-100 dark:bg-gray-900 bg-opacity-90 dark:bg-opacity-90 rounded-lg z-10 flex items-center justify-center">
                          <div className="text-center text-gray-600 dark:text-gray-400 p-4">
                            <Lock className="h-8 w-8 mx-auto mb-2" />
                            <p className="font-medium text-sm mb-1">مؤمّن</p>
                            <p className="text-xs">اجتز الاختبار السابق بدرجة 50+</p>
                          </div>
                        </div>
                      )}
                      <TestCard
                        type="verbal"
                        testNumber={test.testNumber}
                        completed={test.completed}
                        score={test.score}
                        totalQuestions={verbalQuestionCount}
                        onStart={() => {
                          if (previousTestPassed) {
                            if (!canTakeTest) {
                              alert('لقد وصلت إلى الحد الأقصى للاختبارات المجانية اليوم. اشترك في الباقة المدفوعة للوصول الكامل!');
                              return;
                            }
                            recordTestTaken();
                            window.location.href = `/question-bank/verbal/${test.testNumber}`;
                          }
                        }}
                        onRetry={() => {
                          if (!canTakeTest) {
                            alert('لقد وصلت إلى الحد الأقصى للاختبارات المجانية اليوم. اشترك في الباقة المدفوعة للوصول الكامل!');
                            return;
                          }
                          recordTestTaken();
                          window.location.href = `/question-bank/verbal/${test.testNumber}`;
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </TabsContent>

          {/* Quantitative Tests */}
          <TabsContent value="quantitative" className="space-y-6">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    الاختبارات الكمية
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300">
                    {questionBankState.quantitative.length} اختبار • {quantitativeQuestionCount} سؤال
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">معدل الإنجاز</div>
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {Math.round(getOverallProgress(questionBankState.quantitative))}%
                  </div>
                </div>
              </div>
              
              <div className="mb-6">
                <Progress 
                  value={getOverallProgress(questionBankState.quantitative)} 
                  className="w-full h-3"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {questionBankState.quantitative.map((test) => {
                  // Check if previous test is completed with 50+ score (except for test 1)
                  const previousTest = questionBankState.quantitative.find(t => t.testNumber === test.testNumber - 1);
                  const previousTestPassed = test.testNumber === 1 || 
                    (previousTest?.completed && (previousTest?.score || 0) >= 50);

                  return (
                    <div key={test.testNumber} className="relative">
                      {!previousTestPassed && (
                        <div className="absolute inset-0 bg-gray-100 dark:bg-gray-900 bg-opacity-90 dark:bg-opacity-90 rounded-lg z-10 flex items-center justify-center">
                          <div className="text-center text-gray-600 dark:text-gray-400 p-4">
                            <Lock className="h-8 w-8 mx-auto mb-2" />
                            <p className="font-medium text-sm mb-1">مؤمّن</p>
                            <p className="text-xs">اجتز الاختبار السابق بدرجة 50+</p>
                          </div>
                        </div>
                      )}
                      <TestCard
                        type="quantitative"
                        testNumber={test.testNumber}
                        completed={test.completed}
                        score={test.score}
                        totalQuestions={quantitativeQuestionCount}
                        onStart={() => {
                          if (previousTestPassed) {
                            if (!canTakeTest) {
                              alert('لقد وصلت إلى الحد الأقصى للاختبارات المجانية اليوم. اشترك في الباقة المدفوعة للوصول الكامل!');
                              return;
                            }
                            recordTestTaken();
                            window.location.href = `/question-bank/quantitative/${test.testNumber}`;
                          }
                        }}
                        onRetry={() => {
                          if (!canTakeTest) {
                            alert('لقد وصلت إلى الحد الأقصى للاختبارات المجانية اليوم. اشترك في الباقة المدفوعة للوصول الكامل!');
                            return;
                          }
                          recordTestTaken();
                          window.location.href = `/question-bank/quantitative/${test.testNumber}`;
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}