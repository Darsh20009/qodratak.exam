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
  
  // Premium and daily limit state
  const [user, setUser] = useState<any>(null);
  const [dailyTestsTaken, setDailyTestsTaken] = useState(0);
  const MAX_DAILY_FREE_TESTS = 1;

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

        // Calculate number of tests (50 questions per test)
        const verbalTestCount = Math.ceil(verbalCount / 50);
        const quantitativeTestCount = Math.ceil(quantitativeCount / 50);

        // Load existing progress or create new state
        const savedProgress = localStorage.getItem('questionBankProgress');
        let newState: QuestionBankState;
        
        if (savedProgress) {
          const parsed = JSON.parse(savedProgress);
          // Ensure we have the right number of tests
          newState = {
            verbal: Array.from({ length: verbalTestCount }, (_, i) => 
              parsed.verbal?.[i] || { testNumber: i + 1, completed: false }
            ),
            quantitative: Array.from({ length: quantitativeTestCount }, (_, i) => 
              parsed.quantitative?.[i] || { testNumber: i + 1, completed: false }
            )
          };
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
    // Download functionality here
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              بنك الأسئلة
            </h1>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              مجموعة شاملة من الأسئلة الأصلية مقسمة إلى اختبارات متدرجة لضمان التحضير الأمثل
            </p>
            
            {/* Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 mb-1">
                  {verbalQuestionCount + quantitativeQuestionCount}
                </div>
                <div className="text-sm text-gray-500">إجمالي الأسئلة</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 mb-1">
                  {questionBankState.verbal.length + questionBankState.quantitative.length}
                </div>
                <div className="text-sm text-gray-500">عدد الاختبارات</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 mb-1">
                  {questionBankState.verbal.filter(t => t.completed).length + 
                   questionBankState.quantitative.filter(t => t.completed).length}
                </div>
                <div className="text-sm text-gray-500">مكتمل</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-600 mb-1">
                  {Math.round((getAverageScore(questionBankState.verbal) + 
                              getAverageScore(questionBankState.quantitative)) / 2)}%
                </div>
                <div className="text-sm text-gray-500">متوسط النتائج</div>
              </div>
            </div>

            {/* Daily limit notice for free users */}
            {!isPremiumUser && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-8 max-w-md mx-auto">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-amber-600" />
                  <span className="text-amber-800 font-medium text-sm">حساب مجاني</span>
                </div>
                <p className="text-sm text-amber-700 mb-2">
                  {MAX_DAILY_FREE_TESTS - dailyTestsTaken} اختبار متبقي اليوم
                </p>
                <div className="w-full bg-amber-200 rounded-full h-2">
                  <div 
                    className="bg-amber-500 h-2 rounded-full transition-all duration-300"
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
            <TabsList className="grid grid-cols-2 bg-white border border-gray-200 rounded-lg p-1 shadow-sm">
              <TabsTrigger 
                value="verbal" 
                className="flex items-center gap-2 px-6 py-3 text-gray-600 data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-md transition-all font-medium"
              >
                <BookOpen className="h-4 w-4" />
                القسم اللفظي
              </TabsTrigger>
              <TabsTrigger 
                value="quantitative" 
                className="flex items-center gap-2 px-6 py-3 text-gray-600 data-[state=active]:bg-purple-600 data-[state=active]:text-white rounded-md transition-all font-medium"
              >
                <Calculator className="h-4 w-4" />
                القسم الكمي
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Verbal Tests */}
          <TabsContent value="verbal" className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    الاختبارات اللفظية
                  </h2>
                  <p className="text-gray-600">
                    {questionBankState.verbal.length} اختبار • {verbalQuestionCount} سؤال
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-500 mb-1">معدل الإنجاز</div>
                  <div className="text-2xl font-bold text-blue-600">
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
                        <div className="absolute inset-0 bg-gray-100 bg-opacity-90 rounded-lg z-10 flex items-center justify-center">
                          <div className="text-center text-gray-600 p-4">
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
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    الاختبارات الكمية
                  </h2>
                  <p className="text-gray-600">
                    {questionBankState.quantitative.length} اختبار • {quantitativeQuestionCount} سؤال
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-500 mb-1">معدل الإنجاز</div>
                  <div className="text-2xl font-bold text-purple-600">
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
                        <div className="absolute inset-0 bg-gray-100 bg-opacity-90 rounded-lg z-10 flex items-center justify-center">
                          <div className="text-center text-gray-600 p-4">
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