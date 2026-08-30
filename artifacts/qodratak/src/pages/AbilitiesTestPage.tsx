import React, { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { autoSaveMistakesToFolder } from "@/lib/autoSaveMistakes";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
  BookIcon, 
  BookOpenIcon, 
  BrainCircuitIcon, 
  Calculator, 
  CheckCircle2, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Download,
  Plus,
  Shuffle,
  Timer,
  TrophyIcon,
  Folder // Import Folder icon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { TestDifficulty, TestType } from "@shared/types";
import { Badge } from "@/components/ui/badge";
import { PointsAndRankingCard } from "@/components/test-results/PointsAndRankingCard";
import { FolderPlus, Folder as FolderIcon } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { EnhancedSaveToFolderDialog } from "@/components/EnhancedSaveToFolderDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  const [currentTestType, setCurrentTestType] = useState<"verbal" | "quantitative" | "mixed" | null>(null);
  const [currentDifficulty, setCurrentDifficulty] = useState<TestDifficulty>("beginner");

  // Customization state for mixed tests
  const [customQuestionCount, setCustomQuestionCount] = useState(10);
  const [customVerbalRatio, setCustomVerbalRatio] = useState(50); // Percentage

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
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>([]);

  // UI state
  const [showLevelCompleteModal, setShowLevelCompleteModal] = useState(false);

  // Folders state
  const [isSaveFolderDialogOpen, setIsSaveFolderDialogOpen] = useState(false);
  const [saveQuestionType, setSaveQuestionType] = useState<"all" | "wrong" | "unanswered">("wrong");
  const [questionsToSave, setQuestionsToSave] = useState<number[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderColor, setNewFolderColor] = useState("#4f46e5");

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

  // Query للمجلدات
  const { data: folders = [], refetch: refetchFolders, isLoading: isFoldersLoading } = useQuery({
    queryKey: ["/api/folders/user", user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error("User not found");
      const response = await fetch(`/api/folders/user/${user.id}`);
      if (!response.ok) return [];
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
    enabled: user !== null && !!user.id,
    refetchOnWindowFocus: true,
    staleTime: 0
  });

  // Mutation لإنشاء مجلد جديد
  const createFolderMutation = useMutation({
    mutationFn: async (folderData: { name: string; color: string; userId: number }) => {
      const response = await apiRequest("POST", "/api/folders", {
        ...folderData,
        icon: "folder",
        description: ""
      });
      return response.json();
    },
    onSuccess: async (newFolder) => {
      await refetchFolders();
      setSelectedFolderId(newFolder._id);
      setIsCreatingFolder(false);
      setNewFolderName("");
      setNewFolderColor("#4f46e5");
      toast({
        title: "✅ تم إنشاء المجلد",
        description: "تم إنشاء المجلد بنجاح",
      });
    },
    onError: () => {
      toast({
        title: "❌ خطأ",
        description: "فشل في إنشاء المجلد",
        variant: "destructive",
      });
    }
  });

  // Mutation لحفظ الأسئلة في المجلد
  const saveToFolderMutation = useMutation({
    mutationFn: async ({ folderId, questionIds }: { folderId: number; questionIds: number[] }) => {
      const response = await apiRequest("POST", `/api/folders/${folderId}/questions/bulk`, {
        questionIds
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/folders/${selectedFolderId}/questions`] });
      queryClient.invalidateQueries({ queryKey: ["/api/folders/user", user?.id] });
      
      const addedCount = data.added || 0;
      const skippedCount = data.skipped || 0;
      
      let description = "";
      if (addedCount > 0 && skippedCount > 0) {
        description = `تم إضافة ${addedCount} سؤال جديد، وتم تجاهل ${skippedCount} سؤال موجود مسبقاً`;
      } else if (addedCount > 0) {
        description = `تم إضافة ${addedCount} سؤال بنجاح إلى المجلد`;
      } else if (skippedCount > 0) {
        description = `جميع الأسئلة موجودة مسبقاً في المجلد (${skippedCount} سؤال)`;
      } else {
        description = data.message || "تم حفظ الأسئلة بنجاح";
      }
      
      toast({
        title: "✅ تم الحفظ بنجاح",
        description,
        duration: 5000,
      });
      setIsSaveFolderDialogOpen(false);
      setSelectedFolderId(null);
      setIsCreatingFolder(false);
    },
    onError: () => {
      toast({
        title: "❌ خطأ",
        description: "فشل في حفظ الأسئلة. حاول مرة أخرى",
        variant: "destructive",
      });
    }
  });

  // إخفاء شريط التنقل عند بدء الاختبار
  useEffect(() => {
    if (currentView === "inProgress") {
      localStorage.setItem('abilitiesExamInProgress', 'true');
      window.dispatchEvent(new Event('storage'));
    } else {
      localStorage.removeItem('abilitiesExamInProgress');
      window.dispatchEvent(new Event('storage'));
    }
  }, [currentView]);

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
      setUserAnswers(new Array(selectedQuestions.length).fill(null));

      // Set time based on difficulty
      if (difficulty === "beginner") {
        setTimeLeft(999999); // No time limit
      } else if (difficulty === "intermediate") {
        setTimeLeft(600); // 10 minutes
      } else {
        setTimeLeft(300); // 5 minutes
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

  const [globalLoading, setGlobalLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");

  const showLoading = (message: string) => {
    setLoadingMessage(message);
    setGlobalLoading(true);
  };

  const hideLoading = () => {
    setGlobalLoading(false);
    setLoadingMessage("");
  };

  // Start a new test
  const startTest = useCallback(async (type: "verbal" | "quantitative" | "mixed") => {
    setLoading(true);
    setCurrentTestType(type);

    const loadingMessages = {
      verbal: "جاري تحضير الاختبار اللفظي...",
      quantitative: "جاري تحضير الاختبار الكمي...",
      mixed: "جاري تحضير الاختبار المختلط..."
    };
    showLoading(loadingMessages[type]);

    try {
      let selectedQuestions: AbilityQuestion[] = [];

      if (type === "mixed") {
        // For mixed tests, fetch both verbal and quantitative questions
        const verbalCount = Math.round((customQuestionCount * customVerbalRatio) / 100);
        const quantitativeCount = customQuestionCount - verbalCount;

        // Fetch verbal questions
        const verbalResponse = await fetch(`/api/questions?category=verbal&difficulty=${currentDifficulty}`);
        if (!verbalResponse.ok) throw new Error("Failed to fetch verbal questions");
        const verbalData = await verbalResponse.json();
        const shuffledVerbal = verbalData.sort(() => 0.5 - Math.random());
        const selectedVerbal = shuffledVerbal.slice(0, verbalCount);

        // Fetch quantitative questions
        const quantResponse = await fetch(`/api/questions?category=quantitative&difficulty=${currentDifficulty}`);
        if (!quantResponse.ok) throw new Error("Failed to fetch quantitative questions");
        const quantData = await quantResponse.json();
        const shuffledQuant = quantData.sort(() => 0.5 - Math.random());
        const selectedQuant = shuffledQuant.slice(0, quantitativeCount);

        // Combine and shuffle
        selectedQuestions = [...selectedVerbal, ...selectedQuant].sort(() => 0.5 - Math.random());
      } else {
        // Regular verbal or quantitative test
        const response = await fetch(`/api/questions?category=${type}&difficulty=${currentDifficulty}`);
        if (!response.ok) {
          throw new Error("Failed to fetch questions");
        }
        const data = await response.json();
        const shuffled = data.sort(() => 0.5 - Math.random());
        selectedQuestions = shuffled.slice(0, 10);
      }

      setQuestions(selectedQuestions);
      setCurrentQuestionIndex(0);
      setScore(0);
      setSelectedAnswerIndex(null);
      setIsAnswerLocked(false);
      setUserAnswers(new Array(selectedQuestions.length).fill(null));

      if (currentDifficulty === "beginner") {
        setTimeLeft(999999);
      } else if (currentDifficulty === "intermediate") {
        setTimeLeft(type === "mixed" ? customQuestionCount * 60 : 600);
      } else {
        setTimeLeft(type === "mixed" ? Math.round(customQuestionCount * 30) : 300);
      }

      setCurrentView("inProgress");
      setTestStartTime(new Date());
      hideLoading();
    } catch (error: any) {
      console.error("Error starting test:", error);
      toast({
        title: "خطأ في بدء الاختبار",
        description: error.message || "حدث خطأ غير متوقع",
        variant: "destructive",
      });
      hideLoading();
    } finally {
      setLoading(false);
    }
  }, [toast, currentDifficulty, customQuestionCount, customVerbalRatio]);

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

    // Store user's answer
    setUserAnswers(prevAnswers => {
      const newAnswers = [...prevAnswers];
      newAnswers[currentQuestionIndex] = selectedAnswerIndex;
      return newAnswers;
    });

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

    try {
      // Calculate correct, wrong, and skipped answers
      const correctAnswers = score;
      const wrongAnswers = userAnswers.filter((answer, index) => 
        answer !== null && answer !== questions[index].correctOptionIndex
      ).length;
      const skippedQuestions = userAnswers.filter(answer => answer === null).length;

      const result = {
        userId: user?.id || 1,
        testType: currentTestType || 'verbal',
        difficulty: currentDifficulty,
        score: score,
        totalQuestions: questions.length,
        timeTaken: Math.floor((300 - timeLeft)),
        isOfficial: false,
        skippedQuestions
      };

      const response = await apiRequest('POST', '/api/test-results', result) as any;

      // Auto-save wrong answers to a folder silently
      const wrongQIds = questions
        .filter((_, i) => userAnswers[i] !== null && userAnswers[i] !== questions[i].correctOptionIndex)
        .map(q => q.id)
        .filter(Boolean);
      if (wrongQIds.length > 0) {
        const testLabel = currentTestType === 'verbal' ? 'لفظي' : 'كمي';
        autoSaveMistakesToFolder(wrongQIds, `اختبار ${testLabel}`);
      }

      // استخراج النقاط المكتسبة من استجابة السيرفر (يحسبها السيرفر بشكل آمن)
      const pointsEarned = response?.pointsEarned || 0;

      // حفظ النقاط في localStorage للعرض
      if (pointsEarned !== undefined) {
        localStorage.setItem('lastExamPointsEarned', pointsEarned.toString());
      }

      toast({
        title: "تم التسليم بنجاح",
        description: `تم حفظ نتيجة الاختبار بنجاح. النقاط المكتسبة: ${pointsEarned >= 0 ? '+' : ''}${pointsEarned}`,
        variant: "default",
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

      // إطلاق حدث تحديث النقاط
      window.dispatchEvent(new Event('pointsUpdated'));

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
      startTest(currentTestType);
    }
  };

  // Go to the next level of difficulty
  const goToNextLevel = () => {
    let nextLevel: TestDifficulty = "intermediate";
    if (currentDifficulty === "intermediate") nextLevel = "advanced";

    setCurrentDifficulty(nextLevel);
    setShowLevelCompleteModal(false);

    // Need to wait for state update before calling startTest
    setTimeout(() => {
      if (currentTestType) {
        startTest(currentTestType);
      }
    }, 0);
  };

  // Download mistakes as HTML file
  const downloadMistakesHTML = () => {
    const incorrectQuestions = questions.filter((_, index) => 
      userAnswers[index] !== questions[index].correctOptionIndex
    );

    if (incorrectQuestions.length === 0) {
      toast({
        title: "لا توجد أخطاء",
        description: "لم ترتكب أي أخطاء في هذا الاختبار!",
      });
      return;
    }

    const testTypeText = currentTestType === "verbal" ? "القدرات اللفظية" : 
                         currentTestType === "quantitative" ? "القدرات الكمية" : "الاختبار المختلط";
    const difficultyText = 
      currentDifficulty === "beginner" ? "المستوى المبتدئ" : 
      currentDifficulty === "intermediate" ? "المستوى المتوسط" : "المستوى المتقدم";

    const htmlContent = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>الأخطاء - ${testTypeText} - ${difficultyText}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', 'Cairo', 'Tahoma', sans-serif; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            min-height: 100vh; padding: 20px; line-height: 1.6; 
        }
        .container { 
            max-width: 1200px; margin: 0 auto; background: white; 
            border-radius: 16px; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1); overflow: hidden; 
        }
        .header { 
            background: linear-gradient(135deg, #ff6b6b, #ee5a24); color: white; 
            padding: 30px; text-align: center; 
        }
        .header h1 { font-size: 2.5rem; margin-bottom: 10px; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3); }
        .content { padding: 40px; }
        .stats { 
            display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); 
            gap: 20px; margin-bottom: 40px; 
        }
        .stat-card { 
            background: linear-gradient(135deg, #f093fb, #f5576c); color: white; 
            padding: 25px; border-radius: 12px; text-align: center; 
            box-shadow: 0 8px 25px rgba(240, 147, 251, 0.3); 
        }
        .stat-value { font-size: 2.5rem; font-weight: bold; margin-bottom: 8px; }
        .question-card { 
            background: #fff; border: 2px solid #ff6b6b; border-radius: 16px; 
            margin-bottom: 30px; padding: 30px; box-shadow: 0 8px 25px rgba(255, 107, 107, 0.15); 
        }
        .question-number { 
            background: linear-gradient(135deg, #ff6b6b, #ee5a24); color: white; 
            width: 45px; height: 45px; border-radius: 50%; display: flex; 
            align-items: center; justify-content: center; font-weight: bold; 
            font-size: 1.2rem; margin-left: 15px; 
        }
        .option-correct { background: linear-gradient(135deg, #00b894, #00a085); color: white; }
        .option-wrong { background: linear-gradient(135deg, #ff6b6b, #ee5a24); color: white; }
        .option { 
            display: flex; align-items: center; padding: 15px 20px; 
            margin-bottom: 12px; border-radius: 12px; font-size: 1.1rem; 
        }
        .option-letter { 
            width: 30px; height: 30px; border-radius: 50%; 
            background: rgba(255, 255, 255, 0.2); display: flex; 
            align-items: center; justify-content: center; font-weight: bold; margin-left: 15px; 
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📚 مراجعة الأخطاء</h1>
            <p>${testTypeText} - ${difficultyText}</p>
        </div>
        <div class="content">
            <div class="stats">
                <div class="stat-card">
                    <div class="stat-value">${incorrectQuestions.length}</div>
                    <div class="stat-label">عدد الأخطاء</div>
                </div>
            </div>
            ${incorrectQuestions.map((question, index) => {
                const originalIndex = questions.findIndex(q => q.id === question.id);
                const userAnswer = userAnswers[originalIndex];
                const letters = ['أ', 'ب', 'ج', 'د'];

                return `
                <div class="question-card">
                    <div style="display: flex; align-items: center; margin-bottom: 20px;">
                        <div class="question-number">${originalIndex + 1}</div>
                        <div style="font-size: 1.4rem; color: #2c3e50; font-weight: 600;">${question.text}</div>
                    </div>
                    <div>
                        ${question.options.map((option, optIndex) => {
                            let optionClass = '';
                            if (optIndex === question.correctOptionIndex) {
                                optionClass = 'option-correct';
                            } else if (optIndex === userAnswer) {
                                optionClass = 'option-wrong';
                            }
                            return `
                                <div class="option ${optionClass}">
                                    <div class="option-letter">${letters[optIndex]}</div>
                                    <div>${option}</div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                    ${question.explanation ? `
                        <div style="background: #74b9ff; color: white; padding: 20px; border-radius: 12px; margin-top: 25px;">
                            <h4>💡 التفسير:</h4>
                            <p>${question.explanation}</p>
                        </div>
                    ` : ''}
                </div>
                `;
            }).join('')}
        </div>
    </div>
</body>
</html>`;

    // Create and download the file
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `اخطاء-${testTypeText}-${difficultyText}-${new Date().toISOString().slice(0, 10)}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "تم التحميل بنجاح",
      description: `تم تحميل ${incorrectQuestions.length} سؤال خطأ كملف HTML`,
    });
  };

  // حفظ الأسئلة في مجلد
  const handleSaveToFolder = () => {
    if (!selectedFolderId) {
      toast({
        title: "تنبيه",
        description: "الرجاء اختيار مجلد",
        variant: "destructive",
      });
      return;
    }

    let questionsToSave: number[] = [];

    if (saveQuestionType === "all") {
      questionsToSave = questions.map(q => q.id);
    } else if (saveQuestionType === "wrong") {
      questionsToSave = questions
        .filter((_, index) => userAnswers[index] !== questions[index].correctOptionIndex)
        .map(q => q.id);
    } else if (saveQuestionType === "unanswered") {
      questionsToSave = questions
        .filter((_, index) => userAnswers[index] === null)
        .map(q => q.id);
    }

    if (questionsToSave.length === 0) {
      toast({
        title: "تنبيه",
        description: "لا توجد أسئلة لحفظها بناءً على اختيارك",
        variant: "destructive",
      });
      return;
    }

    saveToFolderMutation.mutate({ folderId: selectedFolderId, questionIds: questionsToSave });
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

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                10 أسئلة | {currentDifficulty === "beginner" ? "بدون وقت" : 
                           currentDifficulty === "intermediate" ? "10 دقائق" : "5 دقائق"}
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                onClick={() => startTest("verbal")}
                disabled={loading}
                data-testid="button-start-verbal"
              >
                {loading ? "جاري التحميل..." : "ابدأ الاختبار"}
              </Button>
            </CardFooter>
          </Card>

          <Card className="overflow-hidden">
            <div className="bg-green-100 h-2"></div>
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
                10 أسئلة | {currentDifficulty === "beginner" ? "بدون وقت" : 
                           currentDifficulty === "intermediate" ? "10 دقائق" : "5 دقائق"}
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                onClick={() => startTest("quantitative")}
                disabled={loading}
                data-testid="button-start-quantitative"
              >
                {loading ? "جاري التحميل..." : "ابدأ الاختبار"}
              </Button>
            </CardFooter>
          </Card>

          <Card className="overflow-hidden">
            <div className="bg-gradient-to-r from-orange-500 to-amber-600 h-2"></div>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shuffle className="h-5 w-5" />
                اختبار مختلط (ميكس)
              </CardTitle>
              <CardDescription>
                اختبار مخصص يجمع بين الأسئلة اللفظية والكمية
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 mb-4">
                <div>
                  <Label htmlFor="question-count" className="text-sm font-medium mb-2 block">
                    عدد الأسئلة: {customQuestionCount}
                  </Label>
                  <Slider
                    id="question-count"
                    min={5}
                    max={30}
                    step={5}
                    value={[customQuestionCount]}
                    onValueChange={(value) => setCustomQuestionCount(value[0])}
                    className="w-full"
                    data-testid="slider-question-count"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>5</span>
                    <span>30</span>
                  </div>
                </div>

                <div>
                  <Label htmlFor="verbal-ratio" className="text-sm font-medium mb-2 block">
                    نسبة الأسئلة اللفظية: {customVerbalRatio}% ({Math.round((customQuestionCount * customVerbalRatio) / 100)} لفظي، {customQuestionCount - Math.round((customQuestionCount * customVerbalRatio) / 100)} كمي)
                  </Label>
                  <Slider
                    id="verbal-ratio"
                    min={0}
                    max={100}
                    step={10}
                    value={[customVerbalRatio]}
                    onValueChange={(value) => setCustomVerbalRatio(value[0])}
                    className="w-full"
                    data-testid="slider-verbal-ratio"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>كمي</span>
                    <span>لفظي</span>
                  </div>
                </div>
              </div>

              <Badge className={cn("mb-2", getDifficultyColor(currentDifficulty))}>
                {currentDifficulty === "beginner" ? "مستوى مبتدئ" : 
                 currentDifficulty === "intermediate" ? "مستوى متوسط" : "مستوى متقدم"}
              </Badge>

              <div className="text-sm text-muted-foreground">
                {customQuestionCount} أسئلة | {currentDifficulty === "beginner" ? "بدون وقت" : 
                           currentDifficulty === "intermediate" ? `${customQuestionCount} دقيقة` : `${Math.round(customQuestionCount / 2)} دقيقة`}
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-600" 
                onClick={() => startTest("mixed")}
                disabled={loading}
                data-testid="button-start-mixed"
              >
                {loading ? "جاري التحميل..." : "ابدأ الاختبار المخصص"}
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
      <div className="container py-4 md:py-6 max-w-4xl px-3 md:px-4">
        {/* Header with progress & timer */}
        <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            {currentTestType === "verbal" ? (
              <BookOpenIcon className="h-5 w-5 text-blue-500" />
            ) : currentTestType === "quantitative" ? (
              <Calculator className="h-5 w-5 text-green-700" />
            ) : (
              <Shuffle className="h-5 w-5 text-orange-500" />
            )}
            <span className="font-medium text-sm md:text-base">
              {currentTestType === "verbal" ? "القدرات اللفظية" : 
               currentTestType === "quantitative" ? "القدرات الكمية" : "الاختبار المختلط"}
            </span>
            <Badge className={getDifficultyColor(currentDifficulty)}>
              {currentDifficulty === "beginner" ? "مبتدئ" : 
               currentDifficulty === "intermediate" ? "متوسط" : "متقدم"}
            </Badge>
          </div>

          <div className="flex items-center gap-3">
            {currentDifficulty !== "beginner" && (
              <div className="flex items-center gap-1 text-sm font-mono font-bold">
                <Clock className="h-4 w-4" />
                <span className={timeLeft < 60 ? "text-red-500 font-bold" : ""}>
                  {formatTime(timeLeft)}
                </span>
              </div>
            )}

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

    // قراءة النقاط المكتسبة من localStorage
    const pointsEarned = parseFloat(localStorage.getItem('lastExamPointsEarned') || '0');

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
              {currentTestType === "verbal" ? "القدرات اللفظية" : 
               currentTestType === "quantitative" ? "القدرات الكمية" : "الاختبار المختلط"} - {
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
                <div className="font-bold">{currentDifficulty === "beginner" ? "غير محدد" : formatTime(
                  (currentDifficulty === "intermediate" ? 600 : 300) - timeLeft
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
                {currentDifficulty !== "beginner" && (
                  <div className="flex justify-between items-center">
                    <span>معدل الأسئلة لكل دقيقة</span>
                    <span className="font-medium">{(questions.length / ((currentDifficulty === "intermediate" ? 600 : 300) - timeLeft) * 60).toFixed(1)}</span>
                  </div>
                )}
              </div>
            </div>

            <Separator className="my-6" />

            {/* بطاقة النقاط والترتيب */}
            <PointsAndRankingCard pointsEarned={pointsEarned} className="mb-6" />
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row gap-3 flex-wrap">
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
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={downloadMistakesHTML}
            >
              <Download className="h-4 w-4 ml-2" />
              تحميل الأخطاء
            </Button>
            <Dialog open={isSaveFolderDialogOpen} onOpenChange={setIsSaveFolderDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full sm:w-auto bg-gradient-to-r from-green-600/10 to-blue-600/10 border-green-400 hover:border-green-400"
                >
                  <FolderPlus className="h-4 w-4 ml-2" />
                  حفظ في مجلد
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]" data-testid="dialog-save-to-folder">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <FolderIcon className="h-5 w-5 text-green-700" />
                    حفظ الأسئلة في مجلد
                  </DialogTitle>
                  <DialogDescription>
                    {isCreatingFolder ? "قم بإنشاء مجلد جديد" : "اختر المجلد ونوع الأسئلة التي تريد حفظها"}
                  </DialogDescription>
                </DialogHeader>

                {isCreatingFolder ? (
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>اسم المجلد</Label>
                      <Input
                        placeholder="مثال: أسئلة صعبة، مراجعة سريعة..."
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>لون المجلد</Label>
                      <div className="flex gap-2 flex-wrap">
                        {[
                          { name: "أزرق", value: "#4f46e5" },
                          { name: "أخضر", value: "#10b981" },
                          { name: "أحمر", value: "#ef4444" },
                          { name: "برتقالي", value: "#f97316" },
                          { name: "أرجواني", value: "#8b5cf6" },
                          { name: "وردي", value: "#ec4899" },
                        ].map((color) => (
                          <button
                            key={color.value}
                            type="button"
                            onClick={() => setNewFolderColor(color.value)}
                            className={`w-10 h-10 rounded-full border-2 ${
                              newFolderColor === color.value ? "border-primary scale-110" : "border-transparent"
                            } transition-all`}
                            style={{ backgroundColor: color.value }}
                            title={color.name}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 py-4">
                    <div className="space-y-3">
                      <Label className="text-base font-semibold">نوع الأسئلة المراد حفظها</Label>
                      <RadioGroup
                        value={saveQuestionType}
                        onValueChange={(value: "all" | "wrong" | "unanswered") => setSaveQuestionType(value)}
                        className="space-y-3"
                      >
                        <div className="flex items-start space-x-3 space-x-reverse p-4 rounded-lg border-2 hover:bg-accent/50 transition-colors cursor-pointer"
                          onClick={() => setSaveQuestionType("wrong")}
                          data-testid="option-wrong">
                          <RadioGroupItem value="wrong" id="wrong" className="mt-0.5" />
                          <div className="flex-1 space-y-1">
                            <Label htmlFor="wrong" className="text-base font-medium cursor-pointer flex items-center gap-2">
                              <span className="text-red-500">❌</span>
                              الأسئلة الخاطئة فقط
                            </Label>
                            <p className="text-sm text-muted-foreground">
                              احفظ فقط الأسئلة التي أجبت عليها بشكل خاطئ ({questions.filter((_, i) => userAnswers[i] !== questions[i].correctOptionIndex).length} سؤال)
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start space-x-3 space-x-reverse p-4 rounded-lg border-2 hover:bg-accent/50 transition-colors cursor-pointer"
                          onClick={() => setSaveQuestionType("unanswered")}
                          data-testid="option-unanswered">
                          <RadioGroupItem value="unanswered" id="unanswered" className="mt-0.5" />
                          <div className="flex-1 space-y-1">
                            <Label htmlFor="unanswered" className="text-base font-medium cursor-pointer flex items-center gap-2">
                              <span className="text-yellow-500">⚠️</span>
                              الأسئلة غير المحلولة فقط
                            </Label>
                            <p className="text-sm text-muted-foreground">
                              احفظ فقط الأسئلة التي لم تجب عليها ({questions.filter((_, i) => userAnswers[i] === null).length} سؤال)
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start space-x-3 space-x-reverse p-4 rounded-lg border-2 hover:bg-accent/50 transition-colors cursor-pointer"
                          onClick={() => setSaveQuestionType("all")}
                          data-testid="option-all">
                          <RadioGroupItem value="all" id="all" className="mt-0.5" />
                          <div className="flex-1 space-y-1">
                            <Label htmlFor="all" className="text-base font-medium cursor-pointer flex items-center gap-2">
                              <span className="text-blue-500">📝</span>
                              جميع الأسئلة
                            </Label>
                            <p className="text-sm text-muted-foreground">
                              احفظ جميع أسئلة الاختبار ({questions.length} سؤال)
                            </p>
                          </div>
                        </div>
                      </RadioGroup>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>المجلد</Label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setIsCreatingFolder(true)}
                          className="text-xs"
                        >
                          <Plus className="h-3 w-3 ml-1" />
                          إنشاء مجلد جديد
                        </Button>
                      </div>
                      {isFoldersLoading ? (
                        <div className="text-center py-6 text-muted-foreground">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                          <p className="text-sm">جاري تحميل المجلدات...</p>
                        </div>
                      ) : folders.length === 0 ? (
                        <div className="text-center py-6 text-muted-foreground">
                          <Folder className="w-12 h-12 mx-auto mb-2" />
                          <p className="text-sm">لا توجد مجلدات</p>
                          <p className="text-xs mt-1">قم بإنشاء مجلد جديد باستخدام الزر أعلاه</p>
                        </div>
                      ) : (
                        <Select
                          value={selectedFolderId?.toString()}
                          onValueChange={(value) => setSelectedFolderId(parseInt(value))}
                        >
                          <SelectTrigger data-testid="select-folder">
                            <SelectValue placeholder="اختر مجلداً" />
                          </SelectTrigger>
                          <SelectContent>
                            {folders.map((folder: any) => (
                              <SelectItem key={folder._id} value={folder._id.toString()} data-testid={`folder-${folder._id}`}>
                                <div className="flex items-center gap-2">
                                  <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: folder.color }}
                                  />
                                  {folder.name}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </div>
                )}

                <DialogFooter>
                  {isCreatingFolder ? (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsCreatingFolder(false);
                          setNewFolderName("");
                          setNewFolderColor("#4f46e5");
                        }}
                      >
                        رجوع
                      </Button>
                      <Button
                        onClick={() => {
                          if (!newFolderName.trim()) {
                            toast({
                              title: "تنبيه",
                              description: "الرجاء إدخال اسم المجلد",
                              variant: "destructive",
                            });
                            return;
                          }
                          createFolderMutation.mutate({
                            name: newFolderName,
                            color: newFolderColor,
                            userId: user?.id || 1
                          });
                        }}
                        disabled={createFolderMutation.isPending || !newFolderName.trim()}
                      >
                        {createFolderMutation.isPending ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            جاري الإنشاء...
                          </div>
                        ) : (
                          <>
                            <Plus className="h-4 w-4 ml-2" />
                            إنشاء المجلد
                          </>
                        )}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsSaveFolderDialogOpen(false);
                          setIsCreatingFolder(false);
                        }}
                        data-testid="button-cancel-save"
                      >
                        إلغاء
                      </Button>
                      <Button
                        onClick={handleSaveToFolder}
                        disabled={saveToFolderMutation.isPending || !selectedFolderId}
                        data-testid="button-confirm-save"
                      >
                        {saveToFolderMutation.isPending ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            جاري الحفظ...
                          </div>
                        ) : (
                          <>
                            <FolderPlus className="h-4 w-4 ml-2" />
                            حفظ الأسئلة
                          </>
                        )}
                      </Button>
                    </>
                  )}
                </DialogFooter>
              </DialogContent>
            </Dialog>
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
                          userAnswers[index] === question.correctOptionIndex ? "bg-green-500 text-white" : "bg-red-500 text-white"
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
                  {questions.map((question, originalIndex) => 
                    userAnswers[originalIndex] === question.correctOptionIndex ? (
                    <div key={originalIndex} className="p-4 border-b last:border-b-0">
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center text-sm mt-1">
                          {originalIndex + 1}
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
                    ) : null
                  )}
                </div>
              </TabsContent>

              <TabsContent value="incorrect" className="mt-0">
                <div className="space-y-1">
                  {questions.map((question, originalIndex) => 
                    userAnswers[originalIndex] !== question.correctOptionIndex ? (
                    <div key={originalIndex} className="p-4 border-b last:border-b-0">
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-sm mt-1">
                          {originalIndex + 1}
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
                    ) : null
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    );
  };

  const LoadingScreen: React.FC<{ message: string }> = ({ message }) => (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm z-50">
      <BrainCircuitIcon className="animate-spin h-16 w-16 text-primary mb-4" />
      <p className="text-lg font-semibold text-muted-foreground">{message}</p>
    </div>
  );

  // إظهار شاشة التحميل
  if (globalLoading) {
    return <LoadingScreen message={loadingMessage} />;
  }

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