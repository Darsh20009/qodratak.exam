import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Calculator, Download, Play, CheckCircle, Lock, Trophy, Brain, Target, Zap, CrownIcon } from "lucide-react";
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600 dark:text-gray-300">جاري تحميل بنك الأسئلة...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-2000"></div>
      </div>

      <div className="container mx-auto px-6 py-12 relative z-10 max-w-7xl">
        {/* Enhanced Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-3xl blur-xl opacity-40 group-hover:opacity-60 transition-all duration-500 animate-pulse"></div>
              <div className="relative p-6 bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-600 rounded-3xl shadow-2xl transform hover:scale-110 transition-all duration-500 border border-white/20">
                <Brain className="h-12 w-12 text-white animate-bounce" />
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full animate-ping"></div>
              </div>
            </div>
            <div className="text-center">
              <h1 className="text-6xl md:text-7xl font-black bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2 leading-tight">
                بنك الأسئلة الشامل
              </h1>
              <div className="flex items-center justify-center gap-3 mt-4">
                <div className="w-16 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <Trophy className="h-4 w-4 text-white" />
                </div>
                <div className="w-16 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
              </div>
            </div>
          </div>
          <div className="max-w-4xl mx-auto">
            <p className="text-2xl text-white/90 mb-8 font-medium leading-relaxed">
              منصة تعليمية متقدمة مع 
              <span className="px-3 py-1 mx-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full border border-blue-300/30">1,500+ سؤال</span>
              و
              <span className="px-3 py-1 mx-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full border border-purple-300/30">تحليلات ذكية</span>
              لتطوير قدراتك الأكاديمية
            </p>
          </div>

          {/* Enhanced Premium Access Status */}
          {user && !isPremiumUser && (
            <div className="max-w-lg mx-auto mb-8">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-red-500 rounded-2xl blur-lg opacity-20 group-hover:opacity-30 transition-all duration-300"></div>
                <Card className="relative bg-black/20 backdrop-blur-xl border border-orange-200/30 shadow-2xl">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-center gap-4 mb-4">
                      <div className="relative">
                        <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-600 rounded-full flex items-center justify-center shadow-lg">
                          <Target className="w-6 h-6 text-white" />
                        </div>
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full animate-pulse"></div>
                      </div>
                      <div className="text-center">
                        <span className="font-bold text-xl text-orange-100">حساب مجاني</span>
                        <p className="text-sm text-orange-200/80">اختبار واحد يومياً</p>
                      </div>
                    </div>
                    <div className="bg-white/10 rounded-xl p-4 mb-4 backdrop-blur-sm">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-white/90">الاستخدام اليومي</span>
                        <span className="text-sm font-bold text-orange-200">{dailyTestsTaken}/{MAX_DAILY_FREE_TESTS}</span>
                      </div>
                      <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-orange-400 to-red-500 h-3 rounded-full transition-all duration-700 relative"
                          style={{ width: `${(dailyTestsTaken / MAX_DAILY_FREE_TESTS) * 100}%` }}
                        >
                          <div className="absolute inset-0 bg-white/30 animate-pulse"></div>
                        </div>
                      </div>
                    </div>
                    {!canTakeTest && (
                      <div className="text-center p-3 bg-red-500/20 rounded-lg border border-red-400/30">
                        <p className="text-sm text-red-200 font-medium">
                          🔒 تم الوصول للحد الأقصى اليوم
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {user && isPremiumUser && (
            <div className="max-w-lg mx-auto mb-8">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 rounded-2xl blur-lg opacity-20 group-hover:opacity-30 transition-all duration-300"></div>
                <Card className="relative bg-black/20 backdrop-blur-xl border border-green-200/30 shadow-2xl">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-center gap-4">
                      <div className="relative">
                        <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
                          <CrownIcon className="w-6 h-6 text-white" />
                        </div>
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full animate-bounce"></div>
                      </div>
                      <div className="text-center">
                        <span className="font-bold text-xl text-green-100">مشترك مميز</span>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg">
                            وصول كامل
                          </Badge>
                          <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg">
                            ∞ اختبار
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}


        </div>

        {/* Enhanced Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-3xl blur-xl opacity-20 group-hover:opacity-40 transition-all duration-500"></div>
            <Card className="relative bg-black/30 backdrop-blur-2xl border border-blue-200/20 text-white transform hover:scale-105 hover:-translate-y-2 transition-all duration-500 shadow-2xl">
              <CardContent className="p-8">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-blue-400 rounded-full blur-lg opacity-40 animate-pulse"></div>
                    <div className="relative p-4 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full">
                      <BookOpen className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  <div>
                    <p className="text-blue-200 text-sm font-medium mb-2">📚 الأسئلة اللفظية</p>
                    <p className="text-4xl font-black text-white mb-1">{verbalQuestionCount}</p>
                    <p className="text-blue-200/80 text-xs">سؤال متاح</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl blur-xl opacity-20 group-hover:opacity-40 transition-all duration-500"></div>
            <Card className="relative bg-black/30 backdrop-blur-2xl border border-purple-200/20 text-white transform hover:scale-105 hover:-translate-y-2 transition-all duration-500 shadow-2xl">
              <CardContent className="p-8">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-purple-400 rounded-full blur-lg opacity-40 animate-pulse"></div>
                    <div className="relative p-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full">
                      <Calculator className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  <div>
                    <p className="text-purple-200 text-sm font-medium mb-2">🔢 الأسئلة الكمية</p>
                    <p className="text-4xl font-black text-white mb-1">{quantitativeQuestionCount}</p>
                    <p className="text-purple-200/80 text-xs">سؤال متاح</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-green-500 rounded-3xl blur-xl opacity-20 group-hover:opacity-40 transition-all duration-500"></div>
            <Card className="relative bg-black/30 backdrop-blur-2xl border border-emerald-200/20 text-white transform hover:scale-105 hover:-translate-y-2 transition-all duration-500 shadow-2xl">
              <CardContent className="p-8">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-emerald-400 rounded-full blur-lg opacity-40 animate-pulse"></div>
                    <div className="relative p-4 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full">
                      <Trophy className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  <div>
                    <p className="text-emerald-200 text-sm font-medium mb-2">🏆 الاختبارات المكتملة</p>
                    <p className="text-4xl font-black text-white mb-1">
                      {questionBankState.verbal.filter(t => t.completed).length + 
                       questionBankState.quantitative.filter(t => t.completed).length}
                    </p>
                    <p className="text-emerald-200/80 text-xs">اختبار مكتمل</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-3xl blur-xl opacity-20 group-hover:opacity-40 transition-all duration-500"></div>
            <Card className="relative bg-black/30 backdrop-blur-2xl border border-yellow-200/20 text-white transform hover:scale-105 hover:-translate-y-2 transition-all duration-500 shadow-2xl">
              <CardContent className="p-8">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-yellow-400 rounded-full blur-lg opacity-40 animate-pulse"></div>
                    <div className="relative p-4 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full">
                      <Zap className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  <div>
                    <p className="text-yellow-200 text-sm font-medium mb-2">⚡ متوسط النتائج</p>
                    <p className="text-4xl font-black text-white mb-1">
                      {Math.round((getAverageScore(questionBankState.verbal) + 
                                  getAverageScore(questionBankState.quantitative)) / 2)}%
                    </p>
                    <p className="text-yellow-200/80 text-xs">درجة متوسطة</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Enhanced Tabs */}
        <Tabs defaultValue="verbal" className="w-full">
          <div className="flex justify-center mb-12">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-3xl blur-xl opacity-20 group-hover:opacity-30 transition-all duration-500"></div>
              <TabsList className="relative grid grid-cols-2 bg-black/40 backdrop-blur-2xl border border-white/20 p-3 rounded-3xl shadow-2xl">
                <TabsTrigger value="verbal" className="flex items-center gap-4 px-10 py-6 text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white data-[state=active]:shadow-xl rounded-2xl transition-all duration-500 transform hover:scale-105 text-lg font-medium">
                  <div className="relative">
                    <BookOpen className="h-6 w-6" />
                    <div className="absolute inset-0 bg-blue-400 rounded-full blur-md opacity-30"></div>
                  </div>
                  📚 بنك الأسئلة اللفظية
                </TabsTrigger>
                <TabsTrigger value="quantitative" className="flex items-center gap-4 px-10 py-6 text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-xl rounded-2xl transition-all duration-500 transform hover:scale-105 text-lg font-medium">
                  <div className="relative">
                    <Calculator className="h-6 w-6" />
                    <div className="absolute inset-0 bg-purple-400 rounded-full blur-md opacity-30"></div>
                  </div>
                  🔢 بنك الأسئلة الكمية
                </TabsTrigger>
              </TabsList>
            </div>
          </div>

          {/* Enhanced Verbal Tests */}
          <TabsContent value="verbal" className="space-y-8">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-3xl blur-xl opacity-10 group-hover:opacity-20 transition-all duration-500"></div>
              <Card className="relative bg-black/20 backdrop-blur-xl border border-blue-200/20 shadow-2xl">
                <CardHeader className="p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <CardTitle className="flex items-center gap-4 text-2xl text-white">
                        <div className="relative">
                          <div className="absolute inset-0 bg-blue-400 rounded-full blur-lg opacity-40"></div>
                          <div className="relative p-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full">
                            <BookOpen className="h-6 w-6 text-white" />
                          </div>
                        </div>
                        الاختبارات اللفظية
                      </CardTitle>
                      <CardDescription className="text-blue-200/80 text-lg mt-2">
                        {questionBankState.verbal.length} اختبار متاح • {verbalQuestionCount} سؤال إجمالي
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-blue-200/60 mb-1">التقدم الإجمالي</p>
                      <p className="text-4xl font-black text-blue-300">
                        {Math.round(getOverallProgress(questionBankState.verbal))}%
                      </p>
                    </div>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-0 bg-blue-400/20 rounded-full blur-md"></div>
                    <Progress 
                      value={getOverallProgress(questionBankState.verbal)} 
                      className="w-full h-4 relative" 
                    />
                  </div>
                </CardHeader>
                <CardContent className="p-8 pt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {questionBankState.verbal.map((test) => {
                    // Check if previous test is completed with 50+ score (except for test 1)
                    const previousTest = questionBankState.verbal.find(t => t.testNumber === test.testNumber - 1);
                    const previousTestPassed = test.testNumber === 1 || 
                      (previousTest?.completed && (previousTest?.score || 0) >= 50);

                    return (
                      <div key={test.testNumber} className="relative">
                        {!previousTestPassed && (
                          <div className="absolute inset-0 bg-gradient-to-br from-gray-500/80 to-gray-600/80 rounded-lg z-10 flex items-center justify-center backdrop-blur-sm">
                            <div className="text-center text-white p-4">
                              <Lock className="h-12 w-12 mx-auto mb-3 animate-pulse" />
                              <p className="font-bold text-lg mb-1">مؤمّن 🔒</p>
                              <p className="text-sm mb-2">اجتز الاختبار السابق بدرجة 50+</p>
                              
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
                                alert('🚫 لقد وصلت إلى الحد الأقصى للاختبارات المجانية اليوم (1 اختبار). اشترك في الباقة المدفوعة للوصول الكامل!');
                                return;
                              }
                              recordTestTaken();
                              window.location.href = `/question-bank/verbal/${test.testNumber}`;
                            }
                          }}
                          onRetry={() => {
                            if (!canTakeTest) {
                              alert('🚫 لقد وصلت إلى الحد الأقصى للاختبارات المجانية اليوم (1 اختبار). اشترك في الباقة المدفوعة للوصول الكامل!');
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
              </CardContent>
            </Card>
            </div>
          </TabsContent>

          {/* Enhanced Quantitative Tests */}
          <TabsContent value="quantitative" className="space-y-8">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 rounded-3xl blur-xl opacity-10 group-hover:opacity-20 transition-all duration-500"></div>
              <Card className="relative bg-black/20 backdrop-blur-xl border border-purple-200/20 shadow-2xl">
                <CardHeader className="p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <CardTitle className="flex items-center gap-4 text-2xl text-white">
                        <div className="relative">
                          <div className="absolute inset-0 bg-purple-400 rounded-full blur-lg opacity-40"></div>
                          <div className="relative p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full">
                            <Calculator className="h-6 w-6 text-white" />
                          </div>
                        </div>
                        الاختبارات الكمية
                      </CardTitle>
                      <CardDescription className="text-purple-200/80 text-lg mt-2">
                        {questionBankState.quantitative.length} اختبار متاح • {quantitativeQuestionCount} سؤال إجمالي
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-purple-200/60 mb-1">التقدم الإجمالي</p>
                      <p className="text-4xl font-black text-purple-300">
                        {Math.round(getOverallProgress(questionBankState.quantitative))}%
                      </p>
                    </div>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-0 bg-purple-400/20 rounded-full blur-md"></div>
                    <Progress 
                      value={getOverallProgress(questionBankState.quantitative)} 
                      className="w-full h-4 relative" 
                    />
                  </div>
                </CardHeader>
                <CardContent className="p-8 pt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                  {questionBankState.quantitative.map((test) => {
                    // Check if previous test is completed with 50+ score (except for test 1)
                    const previousTest = questionBankState.quantitative.find(t => t.testNumber === test.testNumber - 1);
                    const previousTestPassed = test.testNumber === 1 || 
                      (previousTest?.completed && (previousTest?.score || 0) >= 50);

                    return (
                      <div key={test.testNumber} className="relative">
                        {!previousTestPassed && (
                          <div className="absolute inset-0 bg-gradient-to-br from-gray-500/80 to-gray-600/80 rounded-lg z-10 flex items-center justify-center backdrop-blur-sm">
                            <div className="text-center text-white p-4">
                              <Lock className="h-12 w-12 mx-auto mb-3 animate-pulse" />
                              <p className="font-bold text-lg mb-1">مؤمّن 🔒</p>
                              <p className="text-sm mb-2">اجتز الاختبار السابق بدرجة 50+</p>
                              
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
                                alert('🚫 لقد وصلت إلى الحد الأقصى للاختبارات المجانية اليوم (1 اختبار). اشترك في الباقة المدفوعة للوصول الكامل!');
                                return;
                              }
                              recordTestTaken();
                              window.location.href = `/question-bank/quantitative/${test.testNumber}`;
                            }
                          }}
                          onRetry={() => {
                            if (!canTakeTest) {
                              alert('🚫 لقد وصلت إلى الحد الأقصى للاختبارات المجانية اليوم (1 اختبار). اشترك في الباقة المدفوعة للوصول الكامل!');
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
              </CardContent>
            </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}