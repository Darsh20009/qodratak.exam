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
    <div className="p-6 space-y-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">اختبر قدراتك</h1>
        <p className="text-muted-foreground mb-6">اختر نوع الاختبار والمستوى لتحسين مهاراتك واكتساب النقاط</p>
        
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
        
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="overflow-hidden">
            <div className="bg-blue-600 h-2"></div>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpenIcon className="h-5 w-5" />
                القدرات اللفظية
              </CardTitle>
              <CardDescription>
                اختبارات تركز على فهم اللغة والمفردات والقدرة اللغوية
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 mb-4">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <span>تشابه واختلاف الكلمات والجمل</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <span>فهم النصوص واستخلاص النتائج</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <span>القياس اللفظي والمنطق</span>
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
                onClick={() => startTest("verbal")}
                disabled={loading}
              >
                {loading ? "جاري التحميل..." : "ابدأ الاختبار"}
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
      <div className="container py-6 max-w-4xl">
        <Card className="mb-6 overflow-hidden">
          <div className={cn(
            "h-2",
            performance.percentage >= 70 ? "bg-green-500" : 
            performance.percentage >= 50 ? "bg-yellow-500" : "bg-red-500"
          )}></div>
          <CardHeader className="text-center">
            <div className="mb-2 mx-auto">
              <TrophyIcon className={cn(
                "h-12 w-12 mx-auto",
                performance.percentage >= 70 ? "text-yellow-500" : 
                performance.percentage >= 50 ? "text-blue-500" : "text-gray-400"
              )} />
            </div>
            <CardTitle className="text-2xl">نتيجة الاختبار</CardTitle>
            <CardDescription>
              {currentTestType === "verbal" ? "القدرات اللفظية" : "القدرات الكمية"} - {
                currentDifficulty === "beginner" ? "المستوى المبتدئ" : 
                currentDifficulty === "intermediate" ? "المستوى المتوسط" : "المستوى المتقدم"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center mb-6">
              <div className="text-5xl font-bold mb-2">{score}/{questions.length}</div>
              <div className="text-xl text-muted-foreground">{performance.message}</div>
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