import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Calculator, Download, Play, CheckCircle, Lock, Target, Users, Clock, Brain, Trophy, Zap, Layers, BookMarked, Shapes, PenTool, FileText, AlertCircle, Sparkles, Shuffle } from "lucide-react";
import { cn } from "@/lib/utils";
import { VERBAL_SUBCATEGORIES, QUANTITATIVE_SUBCATEGORIES } from "@shared/examUtils";

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
  const [accessCodeInput, setAccessCodeInput] = useState('');
  
  // Subcategory state
  const [allQuestions, setAllQuestions] = useState<any[]>([]);
  const [verbalSubcategoryCounts, setVerbalSubcategoryCounts] = useState<Record<string, number>>({});
  const [quantitativeSubcategoryCounts, setQuantitativeSubcategoryCounts] = useState<Record<string, number>>({});
  const [selectedVerbalSubcategory, setSelectedVerbalSubcategory] = useState<string | null>(null);
  const [selectedQuantitativeSubcategory, setSelectedQuantitativeSubcategory] = useState<string | null>(null);
  
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
          const categoryKey = category as keyof typeof updated;
          updated[categoryKey] = updated[categoryKey].map((test: TestProgress) => 
            test.testNumber <= testNumber 
              ? { ...test, completed: true, score: test.score || 75 }
              : test
          );

          // Save to localStorage
          localStorage.setItem('questionBankProgress', JSON.stringify(updated));

          return updated;
        });

        const categoryName = category === 'verbal' ? 'اللفظي' : category === 'quantitative' ? 'الكمي' : 'القياسي';
        alert(`✅ تم فتح الاختبارات بنجاح!\nتم فتح جميع اختبارات ${categoryName} حتى الاختبار رقم ${testNumber}`);
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
    (user as any).subscription?.type === 'Pro' || 
    (user as any).subscription?.type === 'Pro Life' || 
    (user as any).subscription?.type === 'Pro Life Plus' ||
    (user as any).subscription?.type === 'Pro Live' ||
    (user as any).subscription === 'pro' ||
    (user as any).subscription === 'pro_life' ||
    (user as any).subscription === 'pro_life_plus'
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

  // Function to reload progress from localStorage
  const reloadProgress = () => {
    const savedState = localStorage.getItem('questionBankProgress');
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
        const savedResults = localStorage.getItem('questionBankResults');
        const results = savedResults ? JSON.parse(savedResults) : {};

        const savedState = localStorage.getItem('questionBankProgress');
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
  }, []);

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
      if (e.key === 'questionBankProgress' || e.key === 'questionBankResults') {
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

    const getScoreColor = (score?: number) => {
      if (!score) return 'text-gray-500 dark:text-gray-400';
      if (score >= 90) return 'text-emerald-600 dark:text-emerald-400';
      if (score >= 70) return 'text-blue-600 dark:text-blue-400';
      if (score >= 50) return 'text-amber-600 dark:text-amber-400';
      return 'text-red-600 dark:text-red-400';
    };

    const getScoreBg = (score?: number) => {
      if (!score) return 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700';
      if (score >= 90) return 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800';
      if (score >= 70) return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
      if (score >= 50) return 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800';
      return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
    };

    const getSectionBadgeColor = () => {
      if (type === 'verbal') return 'bg-gradient-to-r from-blue-500 to-teal-500';
      if (type === 'quantitative') return 'bg-gradient-to-r from-green-600 to-amber-600';
      return 'bg-gradient-to-r from-orange-500 to-rose-600';
    };

    return (
      <Card className="group relative overflow-hidden bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-lg hover:shadow-blue-500/10 dark:hover:shadow-green-500/10 transition-all duration-300 hover:-translate-y-1">
        {/* Gradient Background Effect */}
        <div className={cn(
          "absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-300",
          type === 'verbal' ? 'bg-gradient-to-br from-blue-400 to-teal-500' : 'bg-gradient-to-br from-green-600 to-amber-600'
        )} />
        
        <CardHeader className="pb-4 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center shadow-md",
                getSectionBadgeColor()
              )}>
                {type === 'verbal' ? (
                  <BookOpen className="h-6 w-6 text-white" />
                ) : (
                  <Calculator className="h-6 w-6 text-white" />
                )}
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                  اختبار {testNumber}
                </CardTitle>
                <div className="flex items-center gap-3 text-sm">
                  <CardDescription className="text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                    <Zap className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400" />
                    <span className="font-medium">{questionsInTest} سؤال</span>
                  </CardDescription>
                  <CardDescription className="text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5 text-blue-500 dark:text-blue-400" />
                    <span className="font-medium">5 أقسام</span>
                  </CardDescription>
                </div>
              </div>
            </div>
            {completed && (
              <div className="flex flex-col items-end gap-1">
                {/* Badge for Perfect Score */}
                {score === 100 ? (
                  <Badge className="bg-gradient-to-r from-yellow-400 to-amber-500 text-white border-0 shadow-lg animate-pulse">
                    <Trophy className="h-3 w-3 mr-1" />
                    تم اجتيازه ✓
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
                    <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0 shadow-md text-xs">
                      ↑ تحسن {score - previousScore}%
                    </Badge>
                  ) : (
                    <Badge className="bg-gradient-to-r from-red-500 to-rose-600 text-white border-0 shadow-md text-xs">
                      ↓ تراجع {previousScore - score}%
                    </Badge>
                  )
                )}
                
                {/* Attempts Counter */}
                {attempts && attempts > 1 && (
                  <div className="text-xs text-gray-500 dark:text-gray-400">
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
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-400">
                  <Layers className="h-3.5 w-3.5" />
                  أقسام الاختبار ({questionsInTest} سؤال)
                </div>
                {completed ? (
                  <div className="flex items-center gap-1">
                    <div className="flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                      <CheckCircle className="h-3.5 w-3.5" />
                      مكتمل 5/5
                    </div>
                    {score !== undefined && (
                      <Badge className={cn(
                        "text-xs ml-1",
                        score === 100 ? "bg-yellow-500 text-white" :
                        score >= 90 ? "bg-green-500 text-white" :
                        score >= 70 ? "bg-blue-500 text-white" :
                        "bg-gray-500 text-white"
                      )}>
                        {score}%
                      </Badge>
                    )}
                  </div>
                ) : (
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    ابدأ الاختبار
                  </div>
                )}
              </div>
              <div className="grid grid-cols-5 gap-2">
                {Array.from({ length: 5 }, (_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "relative h-3 rounded-full overflow-hidden transition-all duration-500",
                      "shadow-inner",
                      completed 
                        ? "bg-gradient-to-r " + (type === 'verbal' ? 'from-blue-500 via-teal-600 to-blue-600' : 'from-green-600 via-pink-500 to-emerald-600')
                        : "bg-gray-200 dark:bg-gray-700"
                    )}
                    style={{ 
                      transitionDelay: completed ? `${i * 100}ms` : '0ms',
                      animation: completed ? 'pulse 2s ease-in-out infinite' : 'none',
                      animationDelay: `${i * 200}ms`
                    }}
                  >
                    {completed && (
                      <div className="absolute inset-0 bg-white/20 animate-pulse" 
                        style={{ animationDelay: `${i * 150}ms`, animationDuration: '1.5s' }}
                      />
                    )}
                  </div>
                ))}
              </div>
              {/* Progress indicator text */}
              {completed && score !== undefined && (
                <div className="mt-2 text-center">
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {previousScore !== undefined && previousScore !== score ? (
                      score > previousScore ? (
                        <span className="text-green-600 dark:text-green-400 font-semibold">
                          ↑ تحسن بمقدار {score - previousScore}% 🎯
                        </span>
                      ) : score < previousScore ? (
                        <span className="text-orange-600 dark:text-orange-400 font-semibold">
                          ↓ انخفاض {previousScore - score}%
                        </span>
                      ) : (
                        <span className="text-blue-600 dark:text-blue-400 font-semibold">
                          ➡️ نفس الدرجة السابقة
                        </span>
                      )
                    ) : (
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                        ✓ أول محاولة
                      </span>
                    )}
                  </p>
                </div>
              )}
            </div>

            {/* Score Display */}
            {completed && score !== undefined && (
              <div className={cn("rounded-xl p-4 border-2", getScoreBg(score))}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center shadow-md",
                      score === 100 ? 'bg-gradient-to-r from-yellow-400 to-amber-500' :
                      score >= 90 ? 'bg-emerald-500' : 
                      score >= 70 ? 'bg-blue-500' : 
                      score >= 50 ? 'bg-amber-500' : 'bg-red-500'
                    )}>
                      <Trophy className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                        {score === 100 ? '🎉 نتيجة مثالية!' : 'النتيجة الحالية'}
                      </p>
                      <div className="flex items-center gap-2">
                        <p className={cn("text-2xl font-bold", getScoreColor(score))}>
                          {score}%
                        </p>
                        {previousScore !== undefined && previousScore !== score && (
                          <div className="flex items-center gap-1 text-xs">
                            <span className="text-gray-400 dark:text-gray-500">من</span>
                            <span className={cn(
                              "font-semibold px-2 py-0.5 rounded",
                              previousScore < score 
                                ? "text-gray-500 dark:text-gray-400 line-through" 
                                : "text-gray-600 dark:text-gray-300"
                            )}>
                              {previousScore}%
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                      {previousScore !== undefined && previousScore !== score && score > previousScore 
                        ? 'التحسن' 
                        : previousScore !== undefined && previousScore !== score && score < previousScore
                        ? 'الفرق'
                        : 'الأسئلة المجابة'}
                    </p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {previousScore !== undefined && previousScore !== score ? (
                        score > previousScore ? (
                          <span className="text-green-600 dark:text-green-400">+{score - previousScore}%</span>
                        ) : (
                          <span className="text-red-600 dark:text-red-400">-{previousScore - score}%</span>
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
                    "flex-1 font-medium text-white transition-all duration-300 hover:scale-105 shadow-lg",
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
                      type === 'verbal' 
                        ? 'text-blue-600 border-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-500 dark:hover:bg-blue-900/20' 
                        : 'text-green-700 border-green-400 hover:bg-green-100 dark:text-green-700 dark:border-green-400 dark:hover:bg-green-100/20'
                    )}
                  >
                    <Target className="h-4 w-4 mr-2" />
                    إعادة المحاولة
                  </Button>
                  <Button 
                    onClick={() => downloadMistakes(type, testNumber)}
                    variant="outline"
                    className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    تحليل الأخطاء
                  </Button>
                </>
              )}
            </div>

            {/* Test Info */}
            <div className="border-t border-gray-100 dark:border-gray-700 pt-3">
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  50 دقيقة
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
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
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
                <div className="text-2xl font-bold text-green-700 dark:text-green-700 mb-1">
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
            <TabsList className="grid grid-cols-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-1 shadow-sm">
              <TabsTrigger 
                value="verbal" 
                className="flex items-center gap-2 px-6 py-3 text-gray-600 dark:text-gray-400 data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-md transition-all font-medium"
              >
                <BookOpen className="h-4 w-4" />
                القسم اللفظي
              </TabsTrigger>
              <TabsTrigger 
                value="quantitative" 
                className="flex items-center gap-2 px-6 py-3 text-gray-600 dark:text-gray-400 data-[state=active]:bg-green-100 data-[state=active]:text-white rounded-md transition-all font-medium"
              >
                <Calculator className="h-4 w-4" />
                القسم الكمي
              </TabsTrigger>
              <TabsTrigger 
                value="standard" 
                className="flex items-center gap-2 px-6 py-3 text-gray-600 dark:text-gray-400 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-600 data-[state=active]:to-rose-600 data-[state=active]:text-white rounded-md transition-all font-medium"
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
                const colors = [
                  'from-blue-500 to-teal-500',
                  'from-green-600 to-amber-600',
                  'from-emerald-500 to-teal-600',
                  'from-orange-500 to-red-600',
                  'from-amber-500 to-yellow-600'
                ];
                const Icon = icons[idx] || BookOpen;
                const colorClass = colors[idx] || colors[0];
                const count = verbalSubcategoryCounts[subcategory] || 0;
                
                const isSelected = selectedVerbalSubcategory === subcategory;
                
                return (
                  <Card 
                    key={subcategory} 
                    onClick={() => setSelectedVerbalSubcategory(isSelected ? null : subcategory)}
                    className={cn(
                      "group relative overflow-hidden border-2 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20 hover:-translate-y-1 cursor-pointer",
                      isSelected 
                        ? "border-blue-500 dark:border-blue-400 shadow-lg shadow-blue-500/30 scale-105" 
                        : "border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-600"
                    )}
                    data-testid={`card-subcategory-${subcategory}`}
                  >
                    <div className={cn(
                      "absolute inset-0 transition-opacity duration-300",
                      `bg-gradient-to-br ${colorClass}`,
                      isSelected ? "opacity-15" : "opacity-0 group-hover:opacity-10"
                    )} />
                    {isSelected && (
                      <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full p-1">
                        <CheckCircle className="h-4 w-4" />
                      </div>
                    )}
                    <CardContent className="p-4 relative">
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center mb-3 shadow-md mx-auto transition-transform duration-300",
                        `bg-gradient-to-br ${colorClass}`,
                        isSelected && "scale-110"
                      )}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <h3 className={cn(
                        "text-sm font-bold text-center mb-1",
                        isSelected ? "text-blue-600 dark:text-blue-400" : "text-gray-900 dark:text-white"
                      )}>
                        {subcategory}
                      </h3>
                      <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
                        {count} سؤال
                      </p>
                      {isSelected && (
                        <div className="mt-2 text-center">
                          <Badge className="bg-blue-500 text-white text-xs">
                            مختار ✓
                          </Badge>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Main Tests Section */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                    الاختبارات اللفظية
                    {selectedVerbalSubcategory && (
                      <Badge className="bg-blue-500 text-white">
                        {selectedVerbalSubcategory}
                      </Badge>
                    )}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300">
                    {selectedVerbalSubcategory 
                      ? `${getFilteredTests(questionBankState.verbal, 'verbal', selectedVerbalSubcategory).length} اختبار مفلتر`
                      : `${questionBankState.verbal.length} اختبار • ${verbalQuestionCount} سؤال`
                    }
                  </p>
                </div>
                <div className="text-center bg-blue-50 dark:bg-blue-900/20 px-4 py-3 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">معدل الإنجاز</div>
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {Math.round(getOverallProgress(questionBankState.verbal))}%
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {questionBankState.verbal.filter(t => t.completed).length} / {questionBankState.verbal.length} مكتمل
                  </div>
                </div>
              </div>
              
              {selectedVerbalSubcategory && (
                <div className="mb-4 flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 px-4 py-3 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <span className="text-sm font-medium text-blue-800 dark:text-blue-300">
                      تم تطبيق الفلتر: {selectedVerbalSubcategory}
                    </span>
                  </div>
                  <Button 
                    onClick={() => setSelectedVerbalSubcategory(null)}
                    variant="outline"
                    size="sm"
                    className="text-blue-600 border-blue-400 hover:bg-blue-100 dark:text-blue-400 dark:border-blue-600 dark:hover:bg-blue-900/30"
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
                const colors = [
                  'from-green-600 to-amber-600',
                  'from-blue-500 to-cyan-600',
                  'from-emerald-500 to-green-600',
                  'from-orange-500 to-amber-600',
                  'from-red-500 to-rose-600',
                  'from-teal-600 to-emerald-600',
                  'from-teal-500 to-emerald-600',
                  'from-fuchsia-500 to-amber-600'
                ];
                const Icon = icons[idx] || Calculator;
                const colorClass = colors[idx] || colors[0];
                const count = quantitativeSubcategoryCounts[subcategory] || 0;
                const isSelected = selectedQuantitativeSubcategory === subcategory;
                
                return (
                  <Card 
                    key={subcategory} 
                    onClick={() => setSelectedQuantitativeSubcategory(isSelected ? null : subcategory)}
                    className={cn(
                      "group relative overflow-hidden border-2 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/20 hover:-translate-y-1 cursor-pointer",
                      isSelected 
                        ? "border-green-400 dark:border-green-400 shadow-lg shadow-green-500/30 scale-105" 
                        : "border-gray-200 dark:border-gray-700 hover:border-green-400 dark:hover:border-green-400"
                    )}
                    data-testid={`card-subcategory-${subcategory}`}
                  >
                    <div className={cn(
                      "absolute inset-0 transition-opacity duration-300",
                      `bg-gradient-to-br ${colorClass}`,
                      isSelected ? "opacity-15" : "opacity-0 group-hover:opacity-10"
                    )} />
                    {isSelected && (
                      <div className="absolute top-2 right-2 bg-green-100 text-white rounded-full p-1">
                        <CheckCircle className="h-4 w-4" />
                      </div>
                    )}
                    <CardContent className="p-4 relative">
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center mb-3 shadow-md mx-auto transition-transform duration-300",
                        `bg-gradient-to-br ${colorClass}`,
                        isSelected && "scale-110"
                      )}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <h3 className={cn(
                        "text-sm font-bold text-center mb-1",
                        isSelected ? "text-green-700 dark:text-green-700" : "text-gray-900 dark:text-white"
                      )}>
                        {subcategory}
                      </h3>
                      <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
                        {count} سؤال
                      </p>
                      {isSelected && (
                        <div className="mt-2 text-center">
                          <Badge className="bg-green-100 text-white text-xs">
                            مختار ✓
                          </Badge>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Main Tests Section */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                    الاختبارات الكمية
                    {selectedQuantitativeSubcategory && (
                      <Badge className="bg-green-100 text-white">
                        {selectedQuantitativeSubcategory}
                      </Badge>
                    )}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300">
                    {selectedQuantitativeSubcategory 
                      ? `${getFilteredTests(questionBankState.quantitative, 'quantitative', selectedQuantitativeSubcategory).length} اختبار مفلتر`
                      : `${questionBankState.quantitative.length} اختبار • ${quantitativeQuestionCount} سؤال`
                    }
                  </p>
                </div>
                <div className="text-center bg-green-100 dark:bg-green-100/20 px-4 py-3 rounded-lg border border-green-400 dark:border-green-400">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">معدل الإنجاز</div>
                  <div className="text-3xl font-bold text-green-700 dark:text-green-700">
                    {Math.round(getOverallProgress(questionBankState.quantitative))}%
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {questionBankState.quantitative.filter(t => t.completed).length} / {questionBankState.quantitative.length} مكتمل
                  </div>
                </div>
              </div>
              
              {selectedQuantitativeSubcategory && (
                <div className="mb-4 flex items-center justify-between bg-green-100 dark:bg-green-100/20 px-4 py-3 rounded-lg border border-green-400 dark:border-green-400">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-green-700 dark:text-green-700" />
                    <span className="text-sm font-medium text-green-700 dark:text-green-700">
                      تم تطبيق الفلتر: {selectedQuantitativeSubcategory}
                    </span>
                  </div>
                  <Button 
                    onClick={() => setSelectedQuantitativeSubcategory(null)}
                    variant="outline"
                    size="sm"
                    className="text-green-700 border-green-400 hover:bg-green-100 dark:text-green-700 dark:border-green-400 dark:hover:bg-green-100/30"
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
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-transparent bg-gradient-to-r from-orange-600 to-rose-600 bg-clip-text mb-2 flex items-center gap-2">
                  <Shuffle className="h-6 w-6 text-orange-600" />
                  اختبارات القياس (7 أقسام لكل اختبار)
                </h2>
                <p className="text-gray-600 dark:text-gray-300">
                  اختبارات محاكاة كاملة للاختبار الحقيقي • 120 سؤال • 120 دقيقة • 7 أقسام
                </p>
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-rose-50 dark:from-orange-900/10 dark:to-rose-900/10 border-2 border-orange-200 dark:border-orange-800 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Target className="h-5 w-5 text-orange-600" />
                  توزيع الأقسام
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {[
                    { num: 1, name: 'مختلط', questions: '24 سؤال (11 كمي + 13 لفظي)', time: '24 دقيقة', color: 'from-blue-500 to-emerald-600' },
                    { num: 2, name: 'مختلط', questions: '24 سؤال (11 كمي + 13 لفظي)', time: '24 دقيقة', color: 'from-green-600 to-amber-600' },
                    { num: 3, name: 'مختلط', questions: '24 سؤال (11 كمي + 13 لفظي)', time: '24 دقيقة', color: 'from-amber-500 to-rose-500' },
                    { num: 4, name: 'لفظي', questions: '13 سؤال لفظي', time: '13 دقيقة', color: 'from-blue-500 to-cyan-500' },
                    { num: 5, name: 'كمي', questions: '11 سؤال كمي', time: '11 دقيقة', color: 'from-green-600 to-emerald-500' },
                    { num: 6, name: 'لفظي', questions: '13 سؤال لفظي', time: '13 دقيقة', color: 'from-emerald-500 to-teal-500' },
                    { num: 7, name: 'كمي', questions: '11 سؤال كمي', time: '11 دقيقة', color: 'from-orange-500 to-amber-500' },
                  ].map((section) => (
                    <div key={section.num} className="relative">
                      <div className={cn(
                        "absolute inset-0 bg-gradient-to-br opacity-10 rounded-lg",
                        section.color
                      )} />
                      <div className="relative bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <div className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center mb-3 bg-gradient-to-br text-white font-bold",
                          section.color
                        )}>
                          {section.num}
                        </div>
                        <h4 className="font-bold text-gray-900 dark:text-white mb-1">{section.name}</h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">{section.questions}</p>
                        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                          <Clock className="h-3 w-3" />
                          {section.time}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Main Tests Section */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                    الاختبارات القياسية
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300">
                    {questionBankState.standard.length} اختبار • {totalQuestionCount} سؤال (كل اختبار 120 سؤال)
                  </p>
                </div>
                <div className="text-center bg-orange-50 dark:bg-orange-900/20 px-4 py-3 rounded-lg border border-orange-200 dark:border-orange-800">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">معدل الإنجاز</div>
                  <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                    {Math.round(getOverallProgress(questionBankState.standard))}%
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
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
    </div>
  );
}