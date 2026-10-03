import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Calculator, Download, Play, CheckCircle, Target, Users, Clock, Brain, Trophy, Zap, Layers, BookMarked, Shapes, PenTool, FileText, AlertCircle, Sparkles, Shuffle } from "lucide-react";
import { cn } from "@/lib/utils";
import { VERBAL_SUBCATEGORIES, QUANTITATIVE_SUBCATEGORIES } from "@shared/examUtils";
import { useUser } from "@/hooks/use-user";
import { TahsiliPageFrame, TahsiliSectionHeader } from "@/components/tahsili/TahsiliPageFrame";

interface TestProgress {
  testNumber: number;
  completed: boolean;
  score?: number;
  previousScore?: number;
  completedAt?: string;
  attempts?: number;
}

interface QuestionBankState {
  verbal: TestProgress[];
  quantitative: TestProgress[];
  standard: TestProgress[];
}

export default function QuestionBankPage() {
  const [questionBankState, setQuestionBankState] = useState<QuestionBankState>({
    verbal: [],
    quantitative: [],
    standard: []
  });

  const [verbalQuestionCount, setVerbalQuestionCount] = useState(0);
  const [quantitativeQuestionCount, setQuantitativeQuestionCount] = useState(0);
  const [totalQuestionCount, setTotalQuestionCount] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Subcategory state
  const [allQuestions, setAllQuestions] = useState<any[]>([]);
  const [verbalSubcategoryCounts, setVerbalSubcategoryCounts] = useState<Record<string, number>>({});
  const [quantitativeSubcategoryCounts, setQuantitativeSubcategoryCounts] = useState<Record<string, number>>({});
  const [selectedVerbalSubcategory, setSelectedVerbalSubcategory] = useState<string | null>(null);
  const [selectedQuantitativeSubcategory, setSelectedQuantitativeSubcategory] = useState<string | null>(null);
  
  // Identity and subscription access come from the authenticated server session.
  const { user, isLoading: isUserLoading } = useUser();
  const progressStorageKey = user?.id ? `questionBankProgress_${user.id}` : null;
  const resultsStorageKey = user?.id ? `questionBankResults_${user.id}` : null;
  const [dailyTestsTaken, setDailyTestsTaken] = useState(0);
  const MAX_DAILY_FREE_TESTS = 1;

  // Daily attempts are non-authoritative UI history, scoped to the server user.
  useEffect(() => {
    if (!user) {
      setDailyTestsTaken(0);
      return;
    }

    const today = new Date().toDateString();
    const testsToday = JSON.parse(localStorage.getItem(`dailyQuestionBankTests_${user.id}_${today}`) || '0');
    setDailyTestsTaken(testsToday);
  }, [user?.id]);

  // Check premium status
  const subscription = user?.subscription;
  const subscriptionType = subscription?.type;
  const isPremiumUser = ['Pro', 'Pro Life', 'Pro Life Plus', 'Pro Live', 'pro', 'pro_life', 'pro_life_plus']
    .includes(subscriptionType || '') &&
    subscription?.status !== 'expired' &&
    (!subscription?.endDate || new Date(subscription.endDate) > new Date());

  const canTakeTest = Boolean(user) && !isUserLoading &&
    (isPremiumUser || dailyTestsTaken < MAX_DAILY_FREE_TESTS);

  // Record test taken for free users
  const recordTestTaken = () => {
    if (user && !isPremiumUser) {
      const today = new Date().toDateString();
      const newCount = dailyTestsTaken + 1;
      localStorage.setItem(`dailyQuestionBankTests_${user.id}_${today}`, JSON.stringify(newCount));
      setDailyTestsTaken(newCount);
    }
  };

  // Function to reload progress from localStorage
  const reloadProgress = () => {
    if (!progressStorageKey) return;
    const savedState = localStorage.getItem(progressStorageKey);
    if (savedState) {
      try {
        const parsedState = JSON.parse(savedState);
        setQuestionBankState(parsedState);
        console.log('🔄 Progress reloaded from localStorage:', parsedState);
      } catch (e) {
        console.error('Error parsing saved state:', e);
      }
    }
  };

  // Load question counts and progress from localStorage
  useEffect(() => {
    const loadQuestionCounts = async () => {
      try {
        const response = await fetch('/api/questions');
        const questions = await response.json();

        setAllQuestions(questions);

        const verbalCount = questions.filter((q: any) => q.category === 'verbal').length;
        const quantitativeCount = questions.filter((q: any) => q.category === 'quantitative').length;
        const totalCount = verbalCount + quantitativeCount;

        setVerbalQuestionCount(verbalCount);
        setQuantitativeQuestionCount(quantitativeCount);
        setTotalQuestionCount(totalCount);

        // Calculate subcategory counts for verbal
        const verbalCounts: Record<string, number> = {};
        VERBAL_SUBCATEGORIES.forEach(sub => {
          verbalCounts[sub] = questions.filter((q: any) => 
            q.category === 'verbal' && q.subcategory === sub
          ).length;
        });
        setVerbalSubcategoryCounts(verbalCounts);

        // Calculate subcategory counts for quantitative
        const quantitativeCounts: Record<string, number> = {};
        QUANTITATIVE_SUBCATEGORIES.forEach(sub => {
          quantitativeCounts[sub] = questions.filter((q: any) => 
            q.category === 'quantitative' && q.subcategory === sub
          ).length;
        });
        setQuantitativeSubcategoryCounts(quantitativeCounts);

        // Initialize test progress
        const verbalTestCount = Math.ceil(verbalCount / 50);
        const quantitativeTestCount = Math.ceil(quantitativeCount / 50);
        const standardTestCount = Math.ceil(totalCount / 120); // Each standard test has 120 questions

        // Load results from localStorage
        const savedResults = resultsStorageKey ? localStorage.getItem(resultsStorageKey) : null;
        const results = savedResults ? JSON.parse(savedResults) : {};

        const savedState = progressStorageKey ? localStorage.getItem(progressStorageKey) : null;
        let newState: QuestionBankState;

        if (savedState) {
          try {
            const parsedState = JSON.parse(savedState);
            // Ensure we have the correct number of tests based on current question counts
            newState = {
              verbal: Array.from({ length: verbalTestCount }, (_, i) => {
                const testNumber = i + 1;
                const existingTest = parsedState.verbal?.find((t: any) => t.testNumber === testNumber);
                const testKey = `verbal_${testNumber}`;
                const testResult = results[testKey];
                
                // If we have a result but no progress, create progress from result
                if (testResult && !existingTest) {
                  return {
                    testNumber,
                    completed: true,
                    score: testResult.score,
                    previousScore: testResult.previousScore,
                    attempts: testResult.attempts || 1,
                    completedAt: testResult.completedAt
                  };
                }
                
                return existingTest || {
                  testNumber,
                  completed: false
                };
              }),
              quantitative: Array.from({ length: quantitativeTestCount }, (_, i) => {
                const testNumber = i + 1;
                const existingTest = parsedState.quantitative?.find((t: any) => t.testNumber === testNumber);
                const testKey = `quantitative_${testNumber}`;
                const testResult = results[testKey];
                
                // If we have a result but no progress, create progress from result
                if (testResult && !existingTest) {
                  return {
                    testNumber,
                    completed: true,
                    score: testResult.score,
                    previousScore: testResult.previousScore,
                    attempts: testResult.attempts || 1,
                    completedAt: testResult.completedAt
                  };
                }
                
                return existingTest || {
                  testNumber,
                  completed: false
                };
              }),
              standard: Array.from({ length: standardTestCount }, (_, i) => {
                const testNumber = i + 1;
                const existingTest = parsedState.standard?.find((t: any) => t.testNumber === testNumber);
                const testKey = `standard_${testNumber}`;
                const testResult = results[testKey];
                
                // If we have a result but no progress, create progress from result
                if (testResult && !existingTest) {
                  return {
                    testNumber,
                    completed: true,
                    score: testResult.score,
                    previousScore: testResult.previousScore,
                    attempts: testResult.attempts || 1,
                    completedAt: testResult.completedAt
                  };
                }
                
                return existingTest || {
                  testNumber,
                  completed: false
                };
              })
            };
          } catch (e) {
            console.error('Error parsing saved state:', e);
            // If parsing fails, create state from results
            newState = {
              verbal: Array.from({ length: verbalTestCount }, (_, i) => {
                const testNumber = i + 1;
                const testKey = `verbal_${testNumber}`;
                const testResult = results[testKey];
                
                if (testResult) {
                  return {
                    testNumber,
                    completed: true,
                    score: testResult.score,
                    previousScore: testResult.previousScore,
                    attempts: testResult.attempts || 1,
                    completedAt: testResult.completedAt
                  };
                }
                
                return { testNumber, completed: false };
              }),
              quantitative: Array.from({ length: quantitativeTestCount }, (_, i) => {
                const testNumber = i + 1;
                const testKey = `quantitative_${testNumber}`;
                const testResult = results[testKey];
                
                if (testResult) {
                  return {
                    testNumber,
                    completed: true,
                    score: testResult.score,
                    previousScore: testResult.previousScore,
                    attempts: testResult.attempts || 1,
                    completedAt: testResult.completedAt
                  };
                }
                
                return { testNumber, completed: false };
              }),
              standard: Array.from({ length: standardTestCount }, (_, i) => {
                const testNumber = i + 1;
                const testKey = `standard_${testNumber}`;
                const testResult = results[testKey];
                
                if (testResult) {
                  return {
                    testNumber,
                    completed: true,
                    score: testResult.score,
                    previousScore: testResult.previousScore,
                    attempts: testResult.attempts || 1,
                    completedAt: testResult.completedAt
                  };
                }
                
                return { testNumber, completed: false };
              })
            };
          }
        } else {
          // No saved state, create from results if available
          newState = {
            verbal: Array.from({ length: verbalTestCount }, (_, i) => {
              const testNumber = i + 1;
              const testKey = `verbal_${testNumber}`;
              const testResult = results[testKey];
              
              if (testResult) {
                return {
                  testNumber,
                  completed: true,
                  score: testResult.score,
                  previousScore: testResult.previousScore,
                  attempts: testResult.attempts || 1,
                  completedAt: testResult.completedAt
                };
              }
              
              return { testNumber, completed: false };
            }),
            quantitative: Array.from({ length: quantitativeTestCount }, (_, i) => {
              const testNumber = i + 1;
              const testKey = `quantitative_${testNumber}`;
              const testResult = results[testKey];
              
              if (testResult) {
                return {
                  testNumber,
                  completed: true,
                  score: testResult.score,
                  previousScore: testResult.previousScore,
                  attempts: testResult.attempts || 1,
                  completedAt: testResult.completedAt
                };
              }
              
              return { testNumber, completed: false };
            }),
            standard: Array.from({ length: standardTestCount }, (_, i) => {
              const testNumber = i + 1;
              const testKey = `standard_${testNumber}`;
              const testResult = results[testKey];
              
              if (testResult) {
                return {
                  testNumber,
                  completed: true,
                  score: testResult.score,
                  previousScore: testResult.previousScore,
                  attempts: testResult.attempts || 1,
                  completedAt: testResult.completedAt
                };
              }
              
              return { testNumber, completed: false };
            })
          };
        }

        setQuestionBankState(newState);
        console.log('✅ Question Bank State loaded with results:', newState);
        console.log('📊 Verbal count:', verbalCount, 'Quantitative count:', quantitativeCount, 'Total:', totalCount);
        console.log('📝 Verbal tests:', verbalTestCount, 'Quantitative tests:', quantitativeTestCount, 'Standard tests:', standardTestCount);
        console.log('🎯 Results loaded:', Object.keys(results).length, 'tests');
        setLoading(false);
      } catch (error) {
        console.error('Error loading question counts:', error);
        setLoading(false);
      }
    };

    loadQuestionCounts();
  }, [progressStorageKey, resultsStorageKey]);

  // Auto-reload progress when returning to page or localStorage changes
  useEffect(() => {
    // Reload when window gets focus (user returns to page)
    const handleFocus = () => {
      console.log('👁️ Window focused - reloading progress...');
      reloadProgress();
      // Force re-render by updating state
      setQuestionBankState(prev => ({ ...prev }));
    };

    // Reload when localStorage changes (from another tab)
    const handleStorage = (e: StorageEvent) => {
      if (e.key === progressStorageKey || e.key === resultsStorageKey) {
        console.log('💾 localStorage updated - reloading progress...');
        reloadProgress();
        // Force re-render
        setQuestionBankState(prev => ({ ...prev }));
      }
    };

    // Reload when test is completed (custom event from QuestionBankTestRunner)
    const handleProgressUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      console.log('🎉 Test completed! Reloading progress...', customEvent.detail);
      reloadProgress();
      // Force re-render immediately
      setTimeout(() => {
        setQuestionBankState(prev => ({ ...prev }));
      }, 100);
    };

    // Periodic check every 3 seconds when tab is visible
    const intervalId = setInterval(() => {
      if (!document.hidden) {
        reloadProgress();
      }
    }, 3000);

    window.addEventListener('focus', handleFocus);
    window.addEventListener('storage', handleStorage);
    window.addEventListener('questionBankProgressUpdated', handleProgressUpdate);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('questionBankProgressUpdated', handleProgressUpdate);
      clearInterval(intervalId);
    };
  }, [progressStorageKey, resultsStorageKey]);

  // Save progress to localStorage whenever state changes
  useEffect(() => {
    if (progressStorageKey) {
      localStorage.setItem(progressStorageKey, JSON.stringify(questionBankState));
    }
  }, [questionBankState, progressStorageKey]);

  const TestCard = ({ 
    type, 
    testNumber, 
    completed, 
    score,
    previousScore,
    attempts,
    totalQuestions, 
    onStart, 
    onRetry 
  }: {
    type: 'verbal' | 'quantitative' | 'standard';
    testNumber: number;
    completed: boolean;
    score?: number;
    previousScore?: number;
    attempts?: number;
    totalQuestions: number;
    onStart: () => void;
    onRetry: () => void;
  }) => {
    const questionsPerTest = type === 'standard' ? 120 : 50;
    const startRange = (testNumber - 1) * questionsPerTest + 1;
    const endRange = Math.min(testNumber * questionsPerTest, totalQuestions);
    const questionsInTest = type === 'standard' ? 120 : (endRange - startRange + 1);
    const sectionCount = type === 'standard' ? 7 : 5;
    const testDuration = type === 'standard' ? '120 دقيقة' : '50 دقيقة';

    const getScoreColor = (score?: number) => {
      if (!score) return 'text-gray-500 dark:text-gray-400';
      if (score >= 90) return 'text-emerald-600 dark:text-emerald-400';
      if (score >= 70) return 'text-blue-600 dark:text-blue-400';
      if (score >= 50) return 'text-amber-600 dark:text-amber-400';
      return 'text-red-600 dark:text-red-400';
    };

    const getScoreBg = () => 'bg-muted/30 border-border';

    const getSectionBadgeColor = () => {
      if (type === 'standard') return 'bg-accent text-accent-foreground';
      return 'bg-primary text-primary-foreground';
    };

    return (
      <Card className="group relative overflow-hidden border-border bg-card shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
        <CardHeader className="pb-4 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center shadow-sm",
                getSectionBadgeColor()
              )}>
                {type === 'verbal' ? (
                  <BookOpen className="h-6 w-6" />
                ) : (
                  <Calculator className="h-6 w-6" />
                )}
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-card-foreground mb-1">
                  اختبار {testNumber}
                </CardTitle>
                <div className="flex items-center gap-3 text-sm">
                  <CardDescription className="text-muted-foreground flex items-center gap-1.5">
                    <Zap className="h-3.5 w-3.5 text-accent-foreground" />
                    <span className="font-medium">{questionsInTest} سؤال</span>
                  </CardDescription>
                  <CardDescription className="text-muted-foreground flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5 text-primary" />
                    <span className="font-medium">{sectionCount} أقسام</span>
                  </CardDescription>
                </div>
              </div>
            </div>
            {completed && (
              <div className="flex flex-col items-end gap-1">
                {/* Badge for Perfect Score */}
                {score === 100 ? (
                  <Badge className="border-0 bg-accent text-accent-foreground shadow-sm">
                    <Trophy className="h-3 w-3 mr-1" />
                    تم اجتيازه
                  </Badge>
                ) : (
                  <Badge className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    مكتمل
                  </Badge>
                )}
                
                {/* Show Improvement or Regression Badge */}
                {score !== undefined && previousScore !== undefined && score !== previousScore && (
                  score > previousScore ? (
                    <Badge className="border border-emerald-200 bg-emerald-50 text-emerald-800 shadow-sm text-xs dark:border-emerald-800 dark:bg-emerald-900/25 dark:text-emerald-200">
                      ↑ تحسن {score - previousScore}%
                    </Badge>
                  ) : (
                    <Badge className="border-0 bg-destructive text-destructive-foreground shadow-sm text-xs">
                      ↓ تراجع {previousScore - score}%
                    </Badge>
                  )
                )}
                
                {/* Attempts Counter */}
                {attempts && attempts > 1 && (
                  <div className="text-xs text-muted-foreground">
                    المحاولة {attempts}
                  </div>
                )}
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-0 relative">
          <div className="space-y-4">
            {/* Creative Section Indicators */}
            <div className="rounded-xl border border-border bg-muted/40 p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Layers className="h-3.5 w-3.5" />
                  أقسام الاختبار ({questionsInTest} سؤال)
                </div>
                {completed ? (
                  <div className="flex items-center gap-1">
                    <div className="flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                      <CheckCircle className="h-3.5 w-3.5" />
                      مكتمل {sectionCount}/{sectionCount}
                    </div>
                    {score !== undefined && (
                      <Badge className={cn(
                        "ml-1 border-0 bg-secondary text-secondary-foreground"
                      )}>
                        {score}%
                      </Badge>
                    )}
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground">
                    ابدأ الاختبار
                  </div>
                )}
              </div>
              <div className="grid grid-cols-5 gap-2">
                {Array.from({ length: sectionCount }, (_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "relative h-3 rounded-full overflow-hidden transition-all duration-500",
                      "shadow-inner",
                      completed 
                        ? "bg-primary/75"
                        : "bg-muted"
                    )}
                    style={{ 
                      transitionDelay: completed ? `${i * 100}ms` : '0ms',
                      animation: completed ? 'pulse 2s ease-in-out infinite' : 'none',
                      animationDelay: `${i * 200}ms`
                    }}
                  >
                    {completed && (
                      <div className="absolute inset-0 bg-primary-foreground/15"
                        style={{ animationDelay: `${i * 150}ms`, animationDuration: '1.5s' }}
                      />
                    )}
                  </div>
                ))}
              </div>
              {/* Progress indicator text */}
              {completed && score !== undefined && (
                <div className="mt-2 text-center">
                  <p className="text-xs text-muted-foreground">
                    {previousScore !== undefined && previousScore !== score ? (
                      score > previousScore ? (
                          <span className="text-emerald-700 dark:text-emerald-300 font-semibold">
                          تحسن بمقدار {score - previousScore}%
                        </span>
                      ) : score < previousScore ? (
                          <span className="text-amber-700 dark:text-amber-300 font-semibold">
                          ↓ انخفاض {previousScore - score}%
                        </span>
                      ) : (
                          <span className="text-primary font-semibold">
                          نفس الدرجة السابقة
                        </span>
                      )
                    ) : (
                          <span className="text-emerald-700 dark:text-emerald-300 font-semibold">
                          أول محاولة
                      </span>
                    )}
                  </p>
                </div>
              )}
            </div>

            {/* Score Display */}
            {completed && score !== undefined && (
              <div className={cn("rounded-xl p-4 border", getScoreBg())}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-accent text-accent-foreground shadow-sm">
                      <Trophy className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">
                        {score === 100 ? 'نتيجة مثالية!' : 'النتيجة الحالية'}
                      </p>
                      <div className="flex items-center gap-2">
                        <p className={cn("text-2xl font-bold", getScoreColor(score))}>
                          {score}%
                        </p>
                        {previousScore !== undefined && previousScore !== score && (
                          <div className="flex items-center gap-1 text-xs">
                            <span className="text-muted-foreground">من</span>
                            <span className={cn(
                              "font-semibold px-2 py-0.5 rounded",
                              previousScore < score 
                                ? "text-muted-foreground line-through"
                                : "text-muted-foreground"
                            )}>
                              {previousScore}%
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground mb-1">
                      {previousScore !== undefined && previousScore !== score && score > previousScore 
                        ? 'التحسن' 
                        : previousScore !== undefined && previousScore !== score && score < previousScore
                        ? 'الفرق'
                        : 'الأسئلة المجابة'}
                    </p>
                    <p className="text-lg font-semibold text-card-foreground">
                      {previousScore !== undefined && previousScore !== score ? (
                        score > previousScore ? (
                          <span className="text-emerald-700 dark:text-emerald-300">+{score - previousScore}%</span>
                        ) : (
                          <span className="text-destructive">-{previousScore - score}%</span>
                        )
                      ) : (
                        `${questionsInTest} / ${questionsInTest}`
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Action Buttons */}
            <div className="flex gap-3">
              {!completed ? (
                <Button 
                  onClick={onStart}
                  className={cn(
                    "flex-1 font-medium transition-all duration-200 hover:shadow-sm",
                    getSectionBadgeColor()
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
                    className={cn(
                      "flex-1 font-medium transition-all duration-300 hover:scale-105",
                      'border-border text-primary hover:bg-muted'
                    )}
                  >
                    <Target className="h-4 w-4 mr-2" />
                    إعادة المحاولة
                  </Button>
                  <Button 
                    onClick={() => downloadMistakes(type, testNumber)}
                    variant="outline"
                    className="border-border text-foreground hover:bg-muted"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    تحليل الأخطاء
                  </Button>
                </>
              )}
            </div>

            {/* Test Info */}
            <div className="border-t border-border pt-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {testDuration}
                </span>
                <span className="flex items-center gap-1">
                  <Brain className="h-3 w-3" />
                  نظام الأقسام الجديد
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const downloadMistakes = async (type: 'verbal' | 'quantitative' | 'standard', testNumber: number) => {
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
                        <div class="option ${optionIndex === (mistake.question.correctOptionIndex ?? mistake.question.correctAnswer) ? 'correct' : 
                            optionIndex === mistake.selectedAnswer ? 'incorrect' : 'normal'}">
                            ${String.fromCharCode(65 + optionIndex)}) ${option}
                            ${optionIndex === (mistake.question.correctOptionIndex ?? mistake.question.correctAnswer) ? ' ✓ (الإجابة الصحيحة)' : ''}
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

  // Filter tests by subcategory
  const getFilteredTests = (tests: TestProgress[], type: 'verbal' | 'quantitative', subcategory: string | null) => {
    if (!subcategory) return tests;
    
    // Get all questions of this category first
    const categoryQuestions = allQuestions.filter((q: any) => q.category === type);
    
    // Filter tests that have questions from the selected subcategory
    return tests.filter(test => {
      const startRange = (test.testNumber - 1) * 50;
      const endRange = Math.min(test.testNumber * 50, categoryQuestions.length);
      
      // Get questions in this test range
      const questionsInTest = categoryQuestions.slice(startRange, endRange);
      
      // Check if any question in this test belongs to the selected subcategory
      return questionsInTest.some((q: any) => q.subcategory === subcategory);
    });
  };

  if (loading || isUserLoading) {
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
    <TahsiliPageFrame className="pb-24">
      <header className="border-b border-border/70 bg-card/75">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
          <TahsiliSectionHeader
            eyebrow="استعد لاختبار القدرات"
            title="بنك الأسئلة"
            description="مجموعة شاملة من الأسئلة الأصلية مقسمة إلى اختبارات متدرجة لضمان التحضير الأمثل"
          />
            
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl mx-auto">
              <div className="rounded-xl border border-border bg-background/70 p-4 text-right">
                <div className="text-2xl font-black text-primary mb-1">
                  {verbalQuestionCount + quantitativeQuestionCount}
                </div>
                <div className="text-sm text-muted-foreground">إجمالي الأسئلة</div>
              </div>
              <div className="rounded-xl border border-border bg-background/70 p-4 text-right">
                <div className="text-2xl font-black text-primary mb-1">
                  {questionBankState.verbal.length + questionBankState.quantitative.length}
                </div>
                <div className="text-sm text-muted-foreground">عدد الاختبارات</div>
              </div>
              <div className="rounded-xl border border-border bg-background/70 p-4 text-right">
                <div className="text-2xl font-black text-emerald-700 dark:text-emerald-300 mb-1">
                  {questionBankState.verbal.filter(t => t.completed).length + 
                   questionBankState.quantitative.filter(t => t.completed).length}
                </div>
                <div className="text-sm text-muted-foreground">مكتمل</div>
              </div>
              <div className="rounded-xl border border-border bg-background/70 p-4 text-right">
                <div className="text-2xl font-black text-accent-foreground mb-1">
                  {Math.round((getAverageScore(questionBankState.verbal) + 
                              getAverageScore(questionBankState.quantitative)) / 2)}%
                </div>
                <div className="text-sm text-muted-foreground">متوسط النتائج</div>
              </div>
          </div>

            {/* Daily limit notice for free users */}
            {!isPremiumUser && (
              <div className="bg-accent/20 border border-accent/60 rounded-xl p-4 mt-4 max-w-md mx-auto">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Users className="h-4 w-4 text-accent-foreground" />
                  <span className="text-foreground font-semibold text-sm">حساب مجاني</span>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  {MAX_DAILY_FREE_TESTS - dailyTestsTaken} اختبار متبقي اليوم
                </p>
                <div className="w-full bg-accent/50 rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(dailyTestsTaken / MAX_DAILY_FREE_TESTS) * 100}%` }}
                  />
                </div>
              </div>
            )}
        </div>
      </header>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <Tabs defaultValue="verbal" className="w-full">
          {/* Tab Navigation */}
          <div className="flex justify-center mb-8">
            <TabsList className="grid h-auto w-full max-w-2xl grid-cols-3 rounded-xl border border-border bg-card p-1.5 shadow-sm">
              <TabsTrigger 
                value="verbal" 
                className="flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-muted-foreground transition-colors data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-semibold"
              >
                <BookOpen className="h-4 w-4" />
                القسم اللفظي
              </TabsTrigger>
              <TabsTrigger 
                value="quantitative" 
                className="flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-muted-foreground transition-colors data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-semibold"
              >
                <Calculator className="h-4 w-4" />
                القسم الكمي
              </TabsTrigger>
              <TabsTrigger 
                value="standard" 
                className="flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-muted-foreground transition-colors data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-semibold"
                data-testid="tab-standard"
              >
                <Shuffle className="h-4 w-4" />
                القسم القياسي
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Verbal Tests */}
          <TabsContent value="verbal" className="space-y-6">
            {/* Subcategory Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
              {VERBAL_SUBCATEGORIES.map((subcategory, idx) => {
                const icons = [BookMarked, PenTool, FileText, AlertCircle, Sparkles];
                const Icon = icons[idx] || BookOpen;
                const count = verbalSubcategoryCounts[subcategory] || 0;
                
                const isSelected = selectedVerbalSubcategory === subcategory;
                
                return (
                  <Card 
                    key={subcategory} 
                    onClick={() => setSelectedVerbalSubcategory(isSelected ? null : subcategory)}
                    className={cn(
                      "group relative overflow-hidden border bg-card shadow-sm transition-all duration-200 hover:shadow-md cursor-pointer",
                      isSelected 
                        ? "border-primary ring-1 ring-primary/25"
                        : "border-border hover:border-primary/50"
                    )}
                    data-testid={`card-subcategory-${subcategory}`}
                  >
                    {isSelected && (
                      <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                        <CheckCircle className="h-4 w-4" />
                      </div>
                    )}
                    <CardContent className="p-4 relative">
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center mb-3 shadow-sm mx-auto transition-colors",
                        isSelected ? "bg-primary text-primary-foreground" : "bg-accent/40 text-primary"
                      )}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <h3 className={cn(
                        "text-sm font-bold text-center mb-1",
                        isSelected ? "text-primary" : "text-card-foreground"
                      )}>
                        {subcategory}
                      </h3>
                      <p className="text-xs text-muted-foreground text-center">
                        {count} سؤال
                      </p>
                      {isSelected && (
                        <div className="mt-2 text-center">
                          <Badge className="bg-accent text-accent-foreground text-xs">
                            مختار
                          </Badge>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Main Tests Section */}
            <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-card-foreground mb-2 flex items-center gap-2">
                    الاختبارات اللفظية
                    {selectedVerbalSubcategory && (
                      <Badge className="bg-secondary text-secondary-foreground">
                        {selectedVerbalSubcategory}
                      </Badge>
                    )}
                  </h2>
                  <p className="text-muted-foreground">
                    {selectedVerbalSubcategory 
                      ? `${getFilteredTests(questionBankState.verbal, 'verbal', selectedVerbalSubcategory).length} اختبار مفلتر`
                      : `${questionBankState.verbal.length} اختبار • ${verbalQuestionCount} سؤال`
                    }
                  </p>
                </div>
                <div className="text-center bg-muted/40 px-4 py-3 rounded-xl border border-border">
                  <div className="text-sm text-muted-foreground mb-1">معدل الإنجاز</div>
                  <div className="text-3xl font-bold text-primary">
                    {Math.round(getOverallProgress(questionBankState.verbal))}%
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {questionBankState.verbal.filter(t => t.completed).length} / {questionBankState.verbal.length} مكتمل
                  </div>
                </div>
              </div>
              
              {selectedVerbalSubcategory && (
                <div className="mb-4 flex items-center justify-between bg-muted/40 px-4 py-3 rounded-xl border border-border">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    <span className="text-sm font-medium text-foreground">
                      تم تطبيق الفلتر: {selectedVerbalSubcategory}
                    </span>
                  </div>
                  <Button 
                    onClick={() => setSelectedVerbalSubcategory(null)}
                    variant="outline"
                    size="sm"
                    className="border-border text-primary hover:bg-muted"
                    data-testid="button-clear-filter"
                  >
                    إلغاء الفلتر
                  </Button>
                </div>
              )}
              
              <div className="mb-6">
                <Progress 
                  value={getOverallProgress(questionBankState.verbal)} 
                  className="w-full h-3"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {getFilteredTests(questionBankState.verbal, 'verbal', selectedVerbalSubcategory).map((test) => {
                  return (
                    <div key={test.testNumber} className="relative">
                      <TestCard
                        type="verbal"
                        testNumber={test.testNumber}
                        completed={test.completed}
                        score={test.score}
                        previousScore={test.previousScore}
                        attempts={test.attempts}
                        totalQuestions={verbalQuestionCount}
                        onStart={() => {
                          if (!canTakeTest) {
                            alert('لقد وصلت إلى الحد الأقصى للاختبارات المجانية اليوم. اشترك في الباقة المدفوعة للوصول الكامل!');
                            return;
                          }
                          recordTestTaken();
                          // Pass subcategory filter to test runner via URL params
                          const url = selectedVerbalSubcategory 
                            ? `/question-bank/verbal/${test.testNumber}?subcategory=${encodeURIComponent(selectedVerbalSubcategory)}`
                            : `/question-bank/verbal/${test.testNumber}`;
                          window.location.href = url;
                        }}
                        onRetry={() => {
                          if (!canTakeTest) {
                            alert('لقد وصلت إلى الحد الأقصى للاختبارات المجانية اليوم. اشترك في الباقة المدفوعة للوصول الكامل!');
                            return;
                          }
                          recordTestTaken();
                          // Pass subcategory filter to test runner via URL params
                          const url = selectedVerbalSubcategory 
                            ? `/question-bank/verbal/${test.testNumber}?subcategory=${encodeURIComponent(selectedVerbalSubcategory)}`
                            : `/question-bank/verbal/${test.testNumber}`;
                          window.location.href = url;
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
            {/* Subcategory Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-4 mb-6">
              {QUANTITATIVE_SUBCATEGORIES.map((subcategory, idx) => {
                const icons = [Shapes, Calculator, Target, Brain, Trophy, Zap, Layers, Clock];
                const Icon = icons[idx] || Calculator;
                const count = quantitativeSubcategoryCounts[subcategory] || 0;
                const isSelected = selectedQuantitativeSubcategory === subcategory;
                
                return (
                  <Card 
                    key={subcategory} 
                    onClick={() => setSelectedQuantitativeSubcategory(isSelected ? null : subcategory)}
                    className={cn(
                      "group relative overflow-hidden border bg-card shadow-sm transition-all duration-200 hover:shadow-md cursor-pointer",
                      isSelected 
                        ? "border-primary ring-1 ring-primary/25"
                        : "border-border hover:border-primary/50"
                    )}
                    data-testid={`card-subcategory-${subcategory}`}
                  >
                    {isSelected && (
                      <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                        <CheckCircle className="h-4 w-4" />
                      </div>
                    )}
                    <CardContent className="p-4 relative">
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center mb-3 shadow-sm mx-auto transition-colors",
                        isSelected ? "bg-primary text-primary-foreground" : "bg-accent/40 text-primary"
                      )}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <h3 className={cn(
                        "text-sm font-bold text-center mb-1",
                        isSelected ? "text-primary" : "text-card-foreground"
                      )}>
                        {subcategory}
                      </h3>
                      <p className="text-xs text-muted-foreground text-center">
                        {count} سؤال
                      </p>
                      {isSelected && (
                        <div className="mt-2 text-center">
                          <Badge className="bg-accent text-accent-foreground text-xs">
                            مختار
                          </Badge>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Main Tests Section */}
            <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-card-foreground mb-2 flex items-center gap-2">
                    الاختبارات الكمية
                    {selectedQuantitativeSubcategory && (
                      <Badge className="bg-secondary text-secondary-foreground">
                        {selectedQuantitativeSubcategory}
                      </Badge>
                    )}
                  </h2>
                  <p className="text-muted-foreground">
                    {selectedQuantitativeSubcategory 
                      ? `${getFilteredTests(questionBankState.quantitative, 'quantitative', selectedQuantitativeSubcategory).length} اختبار مفلتر`
                      : `${questionBankState.quantitative.length} اختبار • ${quantitativeQuestionCount} سؤال`
                    }
                  </p>
                </div>
                <div className="text-center bg-muted/40 px-4 py-3 rounded-xl border border-border">
                  <div className="text-sm text-muted-foreground mb-1">معدل الإنجاز</div>
                  <div className="text-3xl font-bold text-primary">
                    {Math.round(getOverallProgress(questionBankState.quantitative))}%
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {questionBankState.quantitative.filter(t => t.completed).length} / {questionBankState.quantitative.length} مكتمل
                  </div>
                </div>
              </div>
              
              {selectedQuantitativeSubcategory && (
                <div className="mb-4 flex items-center justify-between bg-muted/40 px-4 py-3 rounded-xl border border-border">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    <span className="text-sm font-medium text-foreground">
                      تم تطبيق الفلتر: {selectedQuantitativeSubcategory}
                    </span>
                  </div>
                  <Button 
                    onClick={() => setSelectedQuantitativeSubcategory(null)}
                    variant="outline"
                    size="sm"
                    className="border-border text-primary hover:bg-muted"
                    data-testid="button-clear-filter"
                  >
                    إلغاء الفلتر
                  </Button>
                </div>
              )}
              
              <div className="mb-6">
                <Progress 
                  value={getOverallProgress(questionBankState.quantitative)} 
                  className="w-full h-3"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {getFilteredTests(questionBankState.quantitative, 'quantitative', selectedQuantitativeSubcategory).map((test) => {
                  return (
                    <div key={test.testNumber} className="relative">
                      <TestCard
                        type="quantitative"
                        testNumber={test.testNumber}
                        completed={test.completed}
                        score={test.score}
                        previousScore={test.previousScore}
                        attempts={test.attempts}
                        totalQuestions={quantitativeQuestionCount}
                        onStart={() => {
                          if (!canTakeTest) {
                            alert('لقد وصلت إلى الحد الأقصى للاختبارات المجانية اليوم. اشترك في الباقة المدفوعة للوصول الكامل!');
                            return;
                          }
                          recordTestTaken();
                          // Pass subcategory filter to test runner via URL params
                          const url = selectedQuantitativeSubcategory 
                            ? `/question-bank/quantitative/${test.testNumber}?subcategory=${encodeURIComponent(selectedQuantitativeSubcategory)}`
                            : `/question-bank/quantitative/${test.testNumber}`;
                          window.location.href = url;
                        }}
                        onRetry={() => {
                          if (!canTakeTest) {
                            alert('لقد وصلت إلى الحد الأقصى للاختبارات المجانية اليوم. اشترك في الباقة المدفوعة للوصول الكامل!');
                            return;
                          }
                          recordTestTaken();
                          // Pass subcategory filter to test runner via URL params
                          const url = selectedQuantitativeSubcategory 
                            ? `/question-bank/quantitative/${test.testNumber}?subcategory=${encodeURIComponent(selectedQuantitativeSubcategory)}`
                            : `/question-bank/quantitative/${test.testNumber}`;
                          window.location.href = url;
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </TabsContent>

          {/* Standard Section Test */}
          <TabsContent value="standard" className="space-y-6">
            {/* Section Distribution Info */}
            <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 shadow-sm">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-card-foreground mb-2 flex items-center gap-2">
                  <Shuffle className="h-6 w-6 text-primary" />
                  اختبارات القياس (7 أقسام لكل اختبار)
                </h2>
                <p className="text-muted-foreground">
                  اختبارات محاكاة كاملة للاختبار الحقيقي • 120 سؤال • 120 دقيقة • 7 أقسام
                </p>
              </div>

              <div className="bg-muted/30 border border-border rounded-2xl p-5 mb-6">
                <h3 className="text-lg font-bold text-card-foreground mb-4 flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  توزيع الأقسام
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {[
                    { num: 1, name: 'مختلط', questions: '24 سؤال (11 كمي + 13 لفظي)', time: '24 دقيقة' },
                    { num: 2, name: 'مختلط', questions: '24 سؤال (11 كمي + 13 لفظي)', time: '24 دقيقة' },
                    { num: 3, name: 'مختلط', questions: '24 سؤال (11 كمي + 13 لفظي)', time: '24 دقيقة' },
                    { num: 4, name: 'لفظي', questions: '13 سؤال لفظي', time: '13 دقيقة' },
                    { num: 5, name: 'كمي', questions: '11 سؤال كمي', time: '11 دقيقة' },
                    { num: 6, name: 'لفظي', questions: '13 سؤال لفظي', time: '13 دقيقة' },
                    { num: 7, name: 'كمي', questions: '11 سؤال كمي', time: '11 دقيقة' },
                  ].map((section) => (
                    <div key={section.num} className="rounded-xl border border-border bg-card p-4">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3 bg-accent text-accent-foreground font-bold">
                          {section.num}
                        </div>
                        <h4 className="font-bold text-card-foreground mb-1">{section.name}</h4>
                        <p className="text-xs text-muted-foreground mb-1">{section.questions}</p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {section.time}
                        </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Main Tests Section */}
            <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-card-foreground mb-2 flex items-center gap-2">
                    الاختبارات القياسية
                  </h2>
                  <p className="text-muted-foreground">
                    {questionBankState.standard.length} اختبار • {totalQuestionCount} سؤال (كل اختبار 120 سؤال)
                  </p>
                </div>
                <div className="text-center bg-muted/40 px-4 py-3 rounded-xl border border-border">
                  <div className="text-sm text-muted-foreground mb-1">معدل الإنجاز</div>
                  <div className="text-3xl font-bold text-primary">
                    {Math.round(getOverallProgress(questionBankState.standard))}%
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {questionBankState.standard.filter(t => t.completed).length} / {questionBankState.standard.length} مكتمل
                  </div>
                </div>
              </div>
              
              <div className="mb-6">
                <Progress 
                  value={getOverallProgress(questionBankState.standard)} 
                  className="w-full h-3"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {questionBankState.standard.map((test) => {
                  return (
                    <div key={test.testNumber} className="relative">
                      <TestCard
                        type="standard"
                        testNumber={test.testNumber}
                        completed={test.completed}
                        score={test.score}
                        previousScore={test.previousScore}
                        attempts={test.attempts}
                        totalQuestions={120}
                        onStart={() => {
                          if (!canTakeTest) {
                            alert('لقد وصلت إلى الحد الأقصى للاختبارات المجانية اليوم. اشترك في الباقة المدفوعة للوصول الكامل!');
                            return;
                          }
                          recordTestTaken();
                          window.location.href = `/question-bank/standard/${test.testNumber}`;
                        }}
                        onRetry={() => {
                          if (!canTakeTest) {
                            alert('لقد وصلت إلى الحد الأقصى للاختبارات المجانية اليوم. اشترك في الباقة المدفوعة للوصول الكامل!');
                            return;
                          }
                          recordTestTaken();
                          window.location.href = `/question-bank/standard/${test.testNumber}`;
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
    </TahsiliPageFrame>
  );
}