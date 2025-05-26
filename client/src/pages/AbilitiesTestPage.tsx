import React, { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowRight as ArrowRightIcon,
  BookIcon, 
  BookOpenIcon, 
  BrainCircuitIcon, 
  Calculator, 
  CheckCircle2, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Timer,
  TrophyIcon 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { TestDifficulty, TestType } from "@shared/types";
import { Badge } from "@/components/ui/badge";

// Types for the questions
interface AbilityQuestion {
  id: number;
  text: string;
  options: string[];
  correctOptionIndex: number;
  category: "verbal" | "quantitative";
  difficulty: TestDifficulty;
  explanation?: string;
}

// Types for user data
interface User {
  id: number;
  username: string;
  points: number;
  level: number;
}

// Result and state types
interface TestResult {
  score: number;
  totalQuestions: number;
  timeTaken: number;
  pointsEarned: number;
}

// Main component
const AbilitiesTestPage: React.FC = () => {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // User state
  const [user, setUser] = useState<User | null>(null);

  // Test selection state
  const [currentView, setCurrentView] = useState<"selection" | "inProgress" | "results">("selection");
  const [currentTestType, setCurrentTestType] = useState<"verbal" | "quantitative" | null>(null);
  const [currentDifficulty, setCurrentDifficulty] = useState<TestDifficulty>("beginner");

  // Questions state
  const [questions, setQuestions] = useState<AbilityQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Test progress state
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
  const [score, setScore] = useState(0);
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState<number | null>(null);
  const [isAnswerLocked, setIsAnswerLocked] = useState(false);
  const [testStartTime, setTestStartTime] = useState<Date | null>(null);

  // UI state
  const [showLevelCompleteModal, setShowLevelCompleteModal] = useState(false);

  // Load user data
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Error parsing stored user:", e);
      }
    }
  }, []);

  // Timer for the test
  useEffect(() => {
    if (currentView === "inProgress" && timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(prevTime => prevTime - 1);
      }, 1000);

      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && currentView === "inProgress") {
      endTest();
    }
  }, [timeLeft, currentView]);

  // Format time from seconds to MM:SS
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Load questions for the selected test
  const loadQuestions = useCallback(async (type: "verbal" | "quantitative", difficulty: TestDifficulty) => {
    try {
      setLoading(true);
      // In a real app, we'd fetch from API with parameters
      const response = await fetch(`/api/questions?category=${type}&difficulty=${difficulty}`);

      if (!response.ok) {
        throw new Error('فشل في تحميل الأسئلة');
      }

      const data = await response.json();

      // Shuffle and limit to 10 questions for the test
      const shuffled = data.sort(() => 0.5 - Math.random());
      const selectedQuestions = shuffled.slice(0, 10);

      setQuestions(selectedQuestions);
      setCurrentQuestionIndex(0);
      setScore(0);
      setSelectedAnswerIndex(null);
      setIsAnswerLocked(false);
      setTestStartTime(new Date());

      // Set time based on difficulty
      if (difficulty === "beginner") {
        setTimeLeft(300); // 5 minutes
      } else if (difficulty === "intermediate") {
        setTimeLeft(240); // 4 minutes
      } else {
        setTimeLeft(180); // 3 minutes
      }

      setCurrentView("inProgress");
    } catch (error) {
      toast({
        title: "خطأ",
        description: error instanceof Error ? error.message : "حدث خطأ غير معروف",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Select difficulty level
  const selectLevel = (level: TestDifficulty) => {
    setCurrentDifficulty(level);
  };

  // Start the test
  const startTest = (type: "verbal" | "quantitative") => {
    setCurrentTestType(type);
    loadQuestions(type, currentDifficulty);
  };

  // Select an answer
  const selectAnswer = (index: number) => {
    if (!isAnswerLocked) {
      setSelectedAnswerIndex(index);
    }
  };

  // Lock in answer and check if correct
  const confirmAnswer = () => {
    if (selectedAnswerIndex === null) return;

    setIsAnswerLocked(true);

    // Check if answer is correct
    if (selectedAnswerIndex === questions[currentQuestionIndex].correctOptionIndex) {
      setScore(prevScore => prevScore + 1);
    }
  };

  // Go to next question
  const goToNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prevIndex => prevIndex + 1);
      setSelectedAnswerIndex(null);
      setIsAnswerLocked(false);
    } else {
      // End of test
      endTest();
    }
  };

  // Calculate progress percentage
  const calculateProgress = () => {
    return ((currentQuestionIndex + 1) / questions.length) * 100;
  };

  // End the test and calculate results
  const endTest = async () => {
    if (!user || !testStartTime || !currentTestType) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تسليم الاختبار. يرجى المحاولة مرة أخرى",
        variant: "destructive",
      });
      return;
    }

    const endTime = new Date();
    const timeTaken = Math.floor((endTime.getTime() - testStartTime.getTime()) / 1000);
    let pointsEarned = score * 10; // Base points

    // Bonus for difficulty
    if (currentDifficulty === "intermediate") pointsEarned *= 1.5;
    if (currentDifficulty === "advanced") pointsEarned *= 2;

    // Bonus for time efficiency (if completed before time runs out)
    if (timeLeft > 0) {
      const timeLeftPercentage = timeLeft / (currentDifficulty === "beginner" ? 300 : currentDifficulty === "intermediate" ? 240 : 180);
      pointsEarned += Math.floor(pointsEarned * timeLeftPercentage * 0.5); // Up to 50% bonus for being fast
    }

    pointsEarned = Math.floor(pointsEarned);

    try {
      const result = {
        userId: user?.id || 1,
        testType: currentTestType || 'verbal',
        difficulty: currentDifficulty,
        score: score,
        totalQuestions: questions.length,
        pointsEarned: score * 10, // 10 points per correct answer
        timeTaken: Math.floor((300 - timeLeft)), // Calculate time taken
        isOfficial: false
      };

      const response = await apiRequest('POST', '/api/test-results', result);

      if (!response.ok) {
        toast({
          title: "خطأ في التسليم",
          description: "فشل في حفظ نتيجة الاختبار. سيتم إعادة المحاولة تلقائياً",
          variant: "destructive",
        });

        // Retry submission once
        const retryResponse = await apiRequest('POST', '/api/test-results', result);
        if (!retryResponse.ok) {
          throw new Error('فشل في حفظ نتيجة الاختبار');
        }
      }

      toast({
        title: "تم التسليم بنجاح",
        description: "تم حفظ نتيجة الاختبار بنجاح",
        variant: "success",
      });

      // Update user's points in localStorage
      const updatedUser = { 
        ...user, 
        points: user.points + pointsEarned,
        // Update level if necessary
        level: user.points + pointsEarned >= 10000 ? 5 :
              user.points + pointsEarned >= 6000 ? 4 :
              user.points + pointsEarned >= 3000 ? 3 :
              user.points + pointsEarned >= 1000 ? 2 : 1
      };

      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));

      // Show completion modal if player performed well
      const percentage = (score / questions.length) * 100;
      if (percentage >= 80 && currentDifficulty !== "advanced") {
        setShowLevelCompleteModal(true);
      }

      // Display test result
      setCurrentView("results");

    } catch (error) {
      toast({
        title: "خطأ",
        description: error instanceof Error ? error.message : "حدث خطأ غير معروف",
        variant: "destructive",
      });
    }
  };

  // Return to test selection
  const returnToTestSelection = () => {
    setCurrentView("selection");
    setCurrentTestType(null);
  };

  // Retry the same test
  const retryTest = () => {
    if (currentTestType) {
      loadQuestions(currentTestType, currentDifficulty);
    }
  };

  // Go to the next level of difficulty
  const goToNextLevel = () => {
    let nextLevel: TestDifficulty = "intermediate";
    if (currentDifficulty === "intermediate") nextLevel = "advanced";

    setCurrentDifficulty(nextLevel);
    setShowLevelCompleteModal(false);

    if (currentTestType) {
      loadQuestions(currentTestType, nextLevel);
    }
  };

  // Calculate performance data for results view
  const getPerformanceData = () => {
    const percentage = (score / questions.length) * 100;
    let message = "";
    let canLevelUp = false;

    if (percentage >= 90) {
      message = "ممتاز! أداء رائع";
      canLevelUp = currentDifficulty !== "advanced";
    } else if (percentage >= 70) {
      message = "جيد جداً";
      canLevelUp = currentDifficulty !== "advanced";
    } else if (percentage >= 50) {
      message = "جيد";
      canLevelUp = false;
    } else {
      message = "تحتاج إلى مزيد من التدريب";
      canLevelUp = false;
    }

    return { percentage, message, canLevelUp };
  };

  // Get difficulty badge color
  const getDifficultyColor = (difficulty: TestDifficulty) => {
    switch (difficulty) {
      case "beginner": return "bg-green-500 hover:bg-green-600";
      case "intermediate": return "bg-yellow-500 hover:bg-yellow-600";
      case "advanced": return "bg-red-500 hover:bg-red-600";
      default: return "bg-blue-500 hover:bg-blue-600";
    }
  };

  // Render for Test Selection View
  const renderTestSelection = () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 py-16">
        <div className="absolute inset-0 bg-[radial-gradient(circle_400px_at_50%_300px,rgba(255,255,255,0.1),transparent)]"></div>
        <div className="absolute inset-0">
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white/30 rounded-full animate-float"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
              }}
            />
          ))}
        </div>
        
        <div className="container relative z-10 text-center">
          <div className="flex justify-center mb-6">
            <BrainCircuitIcon className="h-16 w-16 text-yellow-300 animate-pulse" />
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white mb-4">
            🧠 اختبر قدراتك
          </h1>
          <p className="text-lg md:text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            اختر نوع الاختبار والمستوى لتحسين مهاراتك واكتساب النقاط
          </p>
        </div>
      </div>

      <div className="p-6 space-y-8">
        <div className="max-w-4xl mx-auto">

        {user && (
          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="grid md:grid-cols-3 gap-4 text-center">
                <div className="p-4 bg-muted/40 rounded-lg">
                  <div className="text-3xl font-bold text-primary mb-2">{user.points}</div>
                  <div className="text-sm text-muted-foreground">النقاط</div>
                </div>
                <div className="p-4 bg-muted/40 rounded-lg">
                  <div className="text-3xl font-bold text-primary mb-2">{user.level}</div>
                  <div className="text-sm text-muted-foreground">المستوى</div>
                </div>
                <div className="p-4 bg-muted/40 rounded-lg">
                  <div className="text-3xl font-bold text-primary mb-2">8</div>
                  <div className="text-sm text-muted-foreground">الاختبارات المكملة</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">اختر المستوى</h2>
          <div className="flex flex-wrap gap-2">
            <Button 
              variant={currentDifficulty === "beginner" ? "default" : "outline"}
              className={currentDifficulty === "beginner" ? "" : ""}
              onClick={() => selectLevel("beginner")}
            >
              مبتدئ
            </Button>
            <Button 
              variant={currentDifficulty === "intermediate" ? "default" : "outline"}
              className={currentDifficulty === "intermediate" ? "" : ""}
              onClick={() => selectLevel("intermediate")}
            >
              متوسط
            </Button>
            <Button 
              variant={currentDifficulty === "advanced" ? "default" : "outline"}
              className={currentDifficulty === "advanced" ? "" : ""}
              onClick={() => selectLevel("advanced")}
            >
              متقدم
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <Card className="overflow-hidden group transform hover:scale-105 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/25 border-2 border-transparent hover:border-blue-300 bg-gradient-to-br from-white via-blue-50 to-blue-100 dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950">
            <div className="bg-gradient-to-r from-blue-500 to-cyan-500 h-3 relative">
              <div className="absolute inset-0 bg-white/30 animate-shimmer"></div>
            </div>
            <CardHeader className="relative">
              <div className="absolute top-4 right-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <BookOpenIcon className="h-6 w-6 text-white" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold mb-3 text-blue-800 dark:text-blue-200 group-hover:text-blue-600 transition-colors">
                📝 القدرات اللفظية
              </CardTitle>
              <CardDescription className="text-base leading-relaxed text-slate-600 dark:text-slate-300">
                اختبارات تركز على فهم اللغة والمفردات والقدرة اللغوية مع تحليل النصوص
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3 mb-6">
                <li className="flex items-start gap-3 group/item">
                  <div className="mt-1 w-6 h-6 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-sm">
                    <CheckCircle2 className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-sm group-hover/item:text-blue-600 transition-colors">
                    🔄 تشابه واختلاف الكلمات والجمل
                  </span>
                </li>
                <li className="flex items-start gap-3 group/item">
                  <div className="mt-1 w-6 h-6 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-sm">
                    <CheckCircle2 className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-sm group-hover/item:text-blue-600 transition-colors">
                    📖 فهم النصوص واستخلاص النتائج
                  </span>
                </li>
                <li className="flex items-start gap-3 group/item">
                  <div className="mt-1 w-6 h-6 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-sm">
                    <CheckCircle2 className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-sm group-hover/item:text-blue-600 transition-colors">
                    🧠 القياس اللفظي والمنطق
                  </span>
                </li>
              </ul>

              <div className="bg-white/60 dark:bg-slate-800/60 p-4 rounded-lg space-y-3">
                <Badge className={cn("text-sm px-3 py-1", getDifficultyColor(currentDifficulty))}>
                  {currentDifficulty === "beginner" ? "🟢 مستوى مبتدئ" : 
                   currentDifficulty === "intermediate" ? "🟡 مستوى متوسط" : "🔴 مستوى متقدم"}
                </Badge>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="text-center">
                    <div className="font-bold text-blue-600">10</div>
                    <div className="text-muted-foreground">أسئلة</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-green-600">
                      {currentDifficulty === "beginner" ? "5" : 
                       currentDifficulty === "intermediate" ? "4" : "3"}
                    </div>
                    <div className="text-muted-foreground">دقائق</div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/50 dark:to-cyan-950/50">
              <Button 
                className="w-full group/btn font-bold text-lg py-6 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300" 
                onClick={() => startTest("verbal")}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    جاري التحميل...
                  </>
                ) : (
                  <>
                    🚀 ابدأ الاختبار اللفظي
                    <ArrowRightIcon className="w-5 h-5 mr-2 group-hover/btn:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>

          <Card className="overflow-hidden">
            <div className="bg-purple-600 h-2"></div>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                القدرات الكمية
              </CardTitle>
              <CardDescription>
                اختبارات تركز على المهارات الحسابية والرياضية والمنطق العددي
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 mb-4">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <span>حل المعادلات والتمارين الرياضية</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <span>تحليل العلاقات العددية والهندسية</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <span>فهم الرسوم البيانية والإحصاءات</span>
                </li>
              </ul>

              <Badge className={cn("mb-2", getDifficultyColor(currentDifficulty))}>
                {currentDifficulty === "beginner" ? "مستوى مبتدئ" : 
                 currentDifficulty === "intermediate" ? "مستوى متوسط" : "مستوى متقدم"}
              </Badge>

              <div className="text-sm text-muted-foreground">
                10 أسئلة | {currentDifficulty === "beginner" ? "5 دقائق" : 
                           currentDifficulty === "intermediate" ? "4 دقائق" : "3 دقائق"}
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                onClick={() => startTest("quantitative")}
                disabled={loading}
              >
                {loading ? "جاري التحميل..." : "ابدأ الاختبار"}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );

  // Render for Test In Progress View
  const renderTestInProgress = () => {
    if (questions.length === 0) return <div className="p-6 text-center">جاري تحميل الأسئلة...</div>;

    const currentQuestion = questions[currentQuestionIndex];
    return (
      <div className="container py-6 max-w-4xl">
        {/* Header with progress & timer */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            {currentTestType === "verbal" ? (
              <BookOpenIcon className="h-5 w-5 text-blue-500" />
            ) : (
              <Calculator className="h-5 w-5 text-purple-500" />
            )}
            <span className="font-medium">
              {currentTestType === "verbal" ? "القدرات اللفظية" : "القدرات الكمية"}
            </span>
            <Badge className={getDifficultyColor(currentDifficulty)}>
              {currentDifficulty === "beginner" ? "مبتدئ" : 
               currentDifficulty === "intermediate" ? "متوسط" : "متقدم"}
            </Badge>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-sm">
              <Clock className="h-4 w-4" />
              <span className={timeLeft < 60 ? "text-red-500 font-bold" : ""}>
                {formatTime(timeLeft)}
              </span>
            </div>

            <div>
              <span className="text-sm font-medium">
                {currentQuestionIndex + 1}/{questions.length}
              </span>
            </div>
          </div>
        </div>

        <Progress value={calculateProgress()} className="mb-6" />

        {/* Question */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-xl">
              السؤال {currentQuestionIndex + 1}
            </CardTitle>
            <CardDescription className="text-base">
              {currentQuestion.text}
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Options */}
        <div className="space-y-3 mb-6">
          {currentQuestion.options.map((option, index) => (
            <div
              key={index}
              className={cn(
                "p-4 border rounded-lg cursor-pointer hover:bg-accent/50 transition-colors",
                selectedAnswerIndex === index && !isAnswerLocked && "border-primary",
                isAnswerLocked && index === currentQuestion.correctOptionIndex && "bg-green-100 border-green-500",
                isAnswerLocked && selectedAnswerIndex === index && index !== currentQuestion.correctOptionIndex && "bg-red-100 border-red-500"
              )}
              onClick={() => selectAnswer(index)}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center text-sm", 
                  selectedAnswerIndex === index && !isAnswerLocked ? "bg-primary text-primary-foreground" : "bg-muted",
                  isAnswerLocked && index === currentQuestion.correctOptionIndex && "bg-green-500 text-white",
                  isAnswerLocked && selectedAnswerIndex === index && index !== currentQuestion.correctOptionIndex && "bg-red-500 text-white"
                )}>
                  {index + 1}
                </div>
                <div>{option}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Explanation if answer is locked */}
        {isAnswerLocked && currentQuestion.explanation && (
          <Card className="mb-6 bg-muted/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">شرح الإجابة</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{currentQuestion.explanation}</p>
            </CardContent>
          </Card>
        )}

        {/* Navigation buttons */}
        <div className="flex justify-between">
          <Button variant="outline" onClick={returnToTestSelection}>
            <ChevronRight className="h-4 w-4 ml-2" />
            إلغاء الاختبار
          </Button>

          {isAnswerLocked ? (
            <Button onClick={goToNextQuestion}>
              {currentQuestionIndex < questions.length - 1 ? (
                <>
                  السؤال التالي
                  <ChevronLeft className="h-4 w-4 mr-2" />
                </>
              ) : (
                "إنهاء الاختبار"
              )}
            </Button>
          ) : (
            <Button 
              onClick={confirmAnswer} 
              disabled={selectedAnswerIndex === null}
            >
              تأكيد الإجابة
            </Button>
          )}
        </div>
      </div>
    );
  };

  // Render for Test Results View
  const renderTestResults = () => {
    if (questions.length === 0) return <div className="p-6 text-center">لا توجد نتائج</div>;

    const performance = getPerformanceData();

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950 py-8">
        <div className="container max-w-4xl">
          {/* Header with animated celebration */}
          <div className="text-center mb-8 relative">
            <div className="absolute inset-0 flex justify-center items-center">
              {performance.percentage >= 70 && (
                <>
                  {[...Array(20)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute w-2 h-2 bg-yellow-400 rounded-full animate-bounce"
                      style={{
                        top: `${Math.random() * 100}%`,
                        left: `${Math.random() * 100}%`,
                        animationDelay: `${Math.random() * 2}s`,
                        animationDuration: `${1 + Math.random()}s`
                      }}
                    />
                  ))}
                </>
              )}
            </div>
            
            <div className="relative z-10">
              <div className="mb-6">
                <TrophyIcon className={cn(
                  "h-20 w-20 mx-auto animate-bounce",
                  performance.percentage >= 80 ? "text-yellow-500" : 
                  performance.percentage >= 60 ? "text-blue-500" : 
                  performance.percentage >= 40 ? "text-orange-500" : "text-gray-400"
                )} />
              </div>
              <h1 className="text-4xl md:text-6xl font-black mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                🎉 نتيجة اختبارك
              </h1>
              <p className="text-xl text-muted-foreground">
                {currentTestType === "verbal" ? "اختبار القدرات اللفظية" : "اختبار القدرات الكمية"}
              </p>
            </div>
          </div>

          <Card className="mb-6 overflow-hidden border-2 shadow-2xl">
            <div className={cn(
              "h-3 relative",
              performance.percentage >= 70 ? "bg-gradient-to-r from-green-400 to-emerald-500" : 
              performance.percentage >= 50 ? "bg-gradient-to-r from-yellow-400 to-orange-500" : 
              "bg-gradient-to-r from-red-400 to-pink-500"
            )}>
              <div className="absolute inset-0 bg-white/30 animate-shimmer"></div>
            </div>
          <CardHeader className="text-center bg-gradient-to-br from-white via-blue-50 to-purple-50 dark:from-slate-900 dark:via-blue-950 dark:to-purple-950 pb-8">
            <CardTitle className="text-3xl font-bold mb-4">
              {performance.percentage >= 80 ? "🏆 نتيجة ممتازة!" :
               performance.percentage >= 60 ? "🌟 نتيجة جيدة جداً!" :
               performance.percentage >= 40 ? "👍 نتيجة جيدة!" : "💪 يمكنك التحسن!"}
            </CardTitle>
            <CardDescription className="text-lg">
              {currentTestType === "verbal" ? "اختبار القدرات اللفظية 📝" : "اختبار القدرات الكمية 🧮"} - {
                currentDifficulty === "beginner" ? "المستوى المبتدئ 🟢" : 
                currentDifficulty === "intermediate" ? "المستوى المتوسط 🟡" : "المستوى المتقدم 🔴"
              }
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-8">
            {/* النتيجة الرئيسية */}
            <div className="text-center relative">
              <div className="inline-block relative">
                <div className="text-8xl font-black mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {score}/{questions.length}
                </div>
                <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-xl rounded-full"></div>
              </div>
              
              <div className="mb-6">
                <div className={cn(
                  "text-2xl font-bold mb-2",
                  performance.percentage >= 70 ? "text-green-600" :
                  performance.percentage >= 50 ? "text-yellow-600" : "text-red-600"
                )}>
                  {performance.percentage.toFixed(1)}% 
                  {performance.percentage >= 70 ? " 🎉" :
                   performance.percentage >= 50 ? " 👏" : " 💪"}
                </div>
                <div className="text-xl text-muted-foreground">{performance.message}</div>
              </div>

              {/* دائرة التقدم */}
              <div className="flex justify-center mb-6">
                <div className="relative w-32 h-32">
                  <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                    <circle
                      cx="60"
                      cy="60"
                      r="54"
                      stroke="currentColor"
                      strokeWidth="12"
                      fill="transparent"
                      className="text-gray-200 dark:text-gray-700"
                    />
                    <circle
                      cx="60"
                      cy="60"
                      r="54"
                      stroke="currentColor"
                      strokeWidth="12"
                      fill="transparent"
                      strokeDasharray={`${performance.percentage * 3.39} 339`}
                      className={cn(
                        "transition-all duration-1000 ease-out",
                        performance.percentage >= 70 ? "text-green-500" :
                        performance.percentage >= 50 ? "text-yellow-500" : "text-red-500"
                      )}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xl font-bold">
                      {performance.percentage.toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-muted/30 p-4 rounded-lg text-center">
                <div className="text-sm text-muted-foreground mb-1">النسبة المئوية</div>
                <div className="font-bold">{performance.percentage.toFixed(0)}%</div>
              </div>
              <div className="bg-muted/30 p-4 rounded-lg text-center">
                <div className="text-sm text-muted-foreground mb-1">الوقت المستغرق</div>
                <div className="font-bold">{formatTime(
                  (currentDifficulty === "beginner" ? 300 : 
                   currentDifficulty === "intermediate" ? 240 : 180) - timeLeft
                )}</div>
              </div>
              <div className="bg-muted/30 p-4 rounded-lg text-center">
                <div className="text-sm text-muted-foreground mb-1">النقاط المكتسبة</div>
                <div className="font-bold text-primary">+{Math.floor(score * 10 * (
                  currentDifficulty === "beginner" ? 1 : 
                  currentDifficulty === "intermediate" ? 1.5 : 2
                ))}</div>
              </div>
              <div className="bg-muted/30 p-4 rounded-lg text-center">
                <div className="text-sm text-muted-foreground mb-1">المستوى</div>
                <div className="font-bold">{user?.level || 1}</div>
              </div>
            </div>

            <Separator className="my-6" />

            <div className="space-y-4">
              <h3 className="font-medium">تحليل الأداء</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span>الإجابات الصحيحة</span>
                  <span className="font-medium text-green-600">{score}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>الإجابات الخاطئة</span>
                  <span className="font-medium text-red-600">{questions.length - score}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>معدل الأسئلة لكل دقيقة</span>
                  <span className="font-medium">{(questions.length / ((currentDifficulty === "beginner" ? 300 : 
                   currentDifficulty === "intermediate" ? 240 : 180) - timeLeft) * 60).toFixed(1)}</span>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={returnToTestSelection}
            >
              العودة للاختبارات
            </Button>
            <Button
              className="w-full sm:w-auto"
              onClick={retryTest}
            >
              إعادة الاختبار
            </Button>
            {performance.canLevelUp && (
              <Button
                className="w-full sm:w-auto"
                onClick={() => setShowLevelCompleteModal(true)}
              >
                الانتقال للمستوى التالي
              </Button>
            )}
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>مراجعة الأسئلة</CardTitle>
            <CardDescription>
              راجع الأسئلة والإجابات الصحيحة
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Tabs defaultValue="all">
              <div className="px-6 pb-3">
                <TabsList className="w-full">
                  <TabsTrigger value="all">جميع الأسئلة ({questions.length})</TabsTrigger>
                  <TabsTrigger value="correct">الإجابات الصحيحة ({score})</TabsTrigger>
                  <TabsTrigger value="incorrect">الإجابات الخاطئة ({questions.length - score})</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="all" className="mt-0">
                <div className="space-y-1">
                  {questions.map((question, index) => (
                    <div key={index} className="p-4 border-b last:border-b-0">
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "w-6 h-6 rounded-full flex items-center justify-center text-sm mt-1", 
                          question.correctOptionIndex === index ? "bg-green-500 text-white" : "bg-red-500 text-white"
                        )}>
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium mb-2">{question.text}</div>
                          <div className="text-sm mb-3">
                            <span className="text-muted-foreground">الإجابة الصحيحة: </span>
                            <span className="font-medium">{question.options[question.correctOptionIndex]}</span>
                          </div>
                          {question.explanation && (
                            <div className="text-sm text-muted-foreground border-t pt-2">
                              {question.explanation}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="correct" className="mt-0">
                <div className="space-y-1">
                  {questions.filter((_, index) => true).map((question, index) => (
                    <div key={index} className="p-4 border-b last:border-b-0">
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center text-sm mt-1">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium mb-2">{question.text}</div>
                          <div className="text-sm mb-3">
                            <span className="text-muted-foreground">الإجابة الصحيحة: </span>
                            <span className="font-medium">{question.options[question.correctOptionIndex]}</span>
                          </div>
                          {question.explanation && (
                            <div className="text-sm text-muted-foreground border-t pt-2">
                              {question.explanation}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="incorrect" className="mt-0">
                <div className="space-y-1">
                  {questions.filter((_, index) => false).map((question, index) => (
                    <div key={index} className="p-4 border-b last:border-b-0">
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-sm mt-1">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium mb-2">{question.text}</div>
                          <div className="text-sm mb-3">
                            <span className="text-muted-foreground">الإجابة الصحيحة: </span>
                            <span className="font-medium">{question.options[question.correctOptionIndex]}</span>
                          </div>
                          {question.explanation && (
                            <div className="text-sm text-muted-foreground border-t pt-2">
                              {question.explanation}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <>
      {currentView === "selection" && renderTestSelection()}
      {currentView === "inProgress" && renderTestInProgress()}
      {currentView === "results" && renderTestResults()}

      {/* Level Complete Modal */}
      <AlertDialog open={showLevelCompleteModal} onOpenChange={setShowLevelCompleteModal}>
        <AlertDialogContent className="text-center">
          <AlertDialogHeader>
            <div className="mx-auto mb-4">
              <TrophyIcon className="h-16 w-16 text-yellow-500 mx-auto" />
            </div>
            <AlertDialogTitle className="text-xl mb-2">
              أحسنت! أنت جاهز للمستوى التالي
            </AlertDialogTitle>
            <AlertDialogDescription>
              لقد حققت {score}/{questions.length} في {' '}
              {currentDifficulty === "beginner" ? "المستوى المبتدئ" : "المستوى المتوسط"}.
              هل تريد الانتقال إلى {currentDifficulty === "beginner" ? "المستوى المتوسط" : "المستوى المتقدم"}؟
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2 justify-center">
            <AlertDialogAction onClick={goToNextLevel}>
              نعم، الانتقال للمستوى التالي
            </AlertDialogAction>
            <AlertDialogCancel onClick={() => setShowLevelCompleteModal(false)}>
              لا، البقاء في نفس المستوى
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default AbilitiesTestPage;