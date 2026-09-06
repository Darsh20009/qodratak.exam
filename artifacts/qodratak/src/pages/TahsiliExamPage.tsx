import React, { useState, useEffect, useMemo } from 'react';
import AiReviewingScreen, { WrongQuestion } from '@/components/AiReviewingScreen';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import confetti from "canvas-confetti";
import { 
  Timer, 
  BookOpen,
  Brain, 
  Target, 
  Award, 
  Download,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  CheckCircle,
  XCircle,
  Clock,
  Star,
  Zap,
  Trophy,
  AlertTriangle,
  TrendingUp,
  GraduationCap,
  Rocket,
  Atom,
  FlaskConical,
  Calculator,
  Globe,
  Languages,
  Sparkles,
  X
} from "lucide-react";
import { QiyasExamLayout } from '@/components/QiyasExamLayout';
import NewProtectedRoute from "@/components/NewProtectedRoute";
import { useUser } from "@/hooks/use-user";
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

// Tahsili-specific exam interfaces
interface TahsiliExam {
  id: number;
  name: string;
  description: string;
  subject: string;
  totalQuestions: number;
  timeLimit: number; // في الدقائق
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  themeColor: string;
  icon: any;
  questions: TahsiliQuestion[];
  categories: string[]; // الفئات الموجودة في الاختبار
}

interface TahsiliQuestion {
  id: number;
  questionNumber: number;
  category: string;
  question: string;
  answerOptions: TahsiliOption[];
  hint?: string;
  explanation?: string;
}

interface TahsiliOption {
  text: string;
  rationale: string;
  isCorrect: boolean;
}

// البيانات الأساسية للاختبارات التحصيلية
const tahsiliExams: TahsiliExam[] = [
  {
    id: 1,
    name: "اختبار تحصيلي شامل - 50 سؤالاً",
    description: "اختبار تحصيلي متنوع يغطي جميع المواد الأساسية في المنهاج السعودي",
    subject: "متنوع",
    totalQuestions: 50,
    timeLimit: 90,
    difficulty: "intermediate",
    themeColor: "from-blue-500 to-teal-500",
    icon: GraduationCap,
    questions: [],
    categories: ["الفيزياء", "الكيمياء", "الأحياء", "الرياضيات"]
  },
  {
    id: 2,
    name: "اختبار تحصيلي تجريبي شامل",
    description: "اختبار تجريبي محاكي للاختبار الحقيقي مع شرح مفصل للإجابات",
    subject: "متنوع", 
    totalQuestions: 10,
    timeLimit: 25,
    difficulty: "intermediate",
    themeColor: "from-green-500 to-emerald-600",
    icon: Target,
    questions: [],
    categories: ["الفيزياء", "الكيمياء", "الأحياء", "الرياضيات", "علم البيئة"]
  },
  {
    id: 3,
    name: "الاختبار التحصيلي الإبداعي - 100 سؤال متقدم",
    description: "اختبار متقدم للطلاب المتفوقين مع أسئلة تحليلية معمقة",
    subject: "متنوع",
    totalQuestions: 100, 
    timeLimit: 150,
    difficulty: "advanced",
    themeColor: "from-green-600 to-amber-600",
    icon: Rocket,
    questions: [],
    categories: ["الفيزياء", "الكيمياء", "الأحياء", "الرياضيات", "علم البيئة"]
  },
  {
    id: 4,
    name: "الاختبار التحصيلي المتقدم - 110 أسئلة جديدة",
    description: "اختبار تحصيلي متقدم وشامل مع مجموعة جديدة من الأسئلة المتنوعة",
    subject: "متنوع",
    totalQuestions: 110, 
    timeLimit: 165,
    difficulty: "advanced",
    themeColor: "from-orange-500 to-red-600",
    icon: Brain,
    questions: [],
    categories: ["الفيزياء", "الكيمياء", "الأحياء", "الرياضيات", "علم البيئة"]
  }
];

const TahsiliExamPage: React.FC = () => {
  // حالات الصفحة الرئيسية
  const [currentView, setCurrentView] = useState<'selection' | 'exam' | 'results'>('selection');
  const [selectedExam, setSelectedExam] = useState<TahsiliExam | null>(null);
  const { user } = useUser();

  // حالات الاختبار
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [questionId: number]: number }>({});
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [bookmarkedQuestions, setBookmarkedQuestions] = useState<Set<number>>(new Set());
  const [timeLeft, setTimeLeft] = useState(0);
  const [examStartTime, setExamStartTime] = useState<Date | null>(null);
  const [isExamFinished, setIsExamFinished] = useState(false);
  const [showAiReview, setShowAiReview] = useState(false);
  const [wrongQuestionsForAI, setWrongQuestionsForAI] = useState<WrongQuestion[]>([]);

  // حالات النتائج
  const [examResults, setExamResults] = useState<any>(null);
  const [mistakeQuestions, setMistakeQuestions] = useState<TahsiliQuestion[]>([]);
  const [isDownloadingMistakes, setIsDownloadingMistakes] = useState(false);

  const { toast } = useToast();

  // إخفاء شريط التنقل عند بدء الاختبار
  useEffect(() => {
    if (currentView === 'exam') {
      // تعيين علامة أن الاختبار قيد التشغيل
      localStorage.setItem('tahsiliExamInProgress', 'true');
      // إطلاق حدث لتحديث App.tsx فوراً
      window.dispatchEvent(new Event('storage'));
    } else {
      // إزالة العلامة عند الخروج من الاختبار
      localStorage.removeItem('tahsiliExamInProgress');
      // إطلاق حدث لتحديث App.tsx فوراً
      window.dispatchEvent(new Event('storage'));
    }

    // تنظيف عند مغادرة الصفحة
    return () => {
      localStorage.removeItem('tahsiliExamInProgress');
    };
  }, [currentView]);

  // مؤقت الاختبار
  useEffect(() => {
    if (currentView === 'exam' && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            finishExam();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [currentView, timeLeft]);

  // بدء الاختبار
  const startExam = async (exam: TahsiliExam) => {
    try {
      // تحميل أسئلة الاختبار من الملفات المرفقة
      const questions = await loadExamQuestions(exam.id);
      if (questions.length === 0) {
        toast({
          title: "خطأ",
          description: "لم يتم العثور على أسئلة للاختبار المحدد",
          variant: "destructive"
        });
        return;
      }

      const examWithQuestions = { ...exam, questions };
      setSelectedExam(examWithQuestions);
      setCurrentView('exam');
      setCurrentQuestionIndex(0);
      setAnswers({});
      setSelectedAnswer(null);
      setTimeLeft(exam.timeLimit * 60);
      setExamStartTime(new Date());
      setIsExamFinished(false);

      toast({
        title: "بدء الاختبار",
        description: `${exam.name} - ${exam.totalQuestions} سؤال في ${exam.timeLimit} دقيقة`,
      });

    } catch (error) {
      console.error("Error starting exam:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء بدء الاختبار",
        variant: "destructive"
      });
    }
  };

  // تحميل أسئلة الاختبار من API آمن
  const loadExamQuestions = async (examId: number): Promise<TahsiliQuestion[]> => {
    try {
      let apiExamId = '';
      switch (examId) {
        case 1:
          apiExamId = 'exam-50';
          break;
        case 2:
          apiExamId = 'exam-10';
          break;
        case 3:
          apiExamId = 'exam-100';
          break;
        case 4:
          apiExamId = 'exam-110';
          break;
        default:
          return [];
      }

      // Generate device fingerprint (same as useSubscription hook)
      const generateDeviceFingerprint = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.textBaseline = 'top';
          ctx.font = '14px Arial';
          ctx.fillText('Device fingerprint', 2, 2);
        }
        
        const fingerprint = [
          navigator.userAgent,
          navigator.language,
          navigator.languages?.join(',') || '',
          screen.width + 'x' + screen.height,
          screen.colorDepth,
          new Date().getTimezoneOffset(),
          !!window.localStorage,
          !!window.sessionStorage,
          canvas.toDataURL()
        ].join('|');
        
        let hash = 0;
        for (let i = 0; i < fingerprint.length; i++) {
          const char = fingerprint.charCodeAt(i);
          hash = ((hash << 5) - hash) + char;
          hash = hash & hash;
        }
        
        return Math.abs(hash).toString(36);
      };

      const deviceId = generateDeviceFingerprint();
      
      // The server derives the user from the authenticated cookie session.
      const params = new URLSearchParams();
      params.append('deviceId', deviceId);

      const response = await fetch(`/api/tahsili/exams/${apiExamId}?${params.toString()}`, {
        credentials: 'include',
      });
      
      if (response.status === 403) {
        toast({
          title: "🔒 اشتراك مطلوب",
          description: "يلزم اشتراك Pro للوصول إلى اختبارات التحصيلي",
          variant: "destructive",
        });
        return [];
      }
      
      if (!response.ok) throw new Error('Failed to load questions');
      
      const text = await response.text();
      const data = JSON.parse(text);
      
      return data.questions.map((q: any, index: number) => ({
        id: index + 1,
        questionNumber: q.questionNumber,
        category: q.category,
        question: q.question,
        answerOptions: q.answerOptions,
        hint: q.hint,
        explanation: q.answerOptions.find((opt: any) => opt.isCorrect)?.rationale || ""
      }));

    } catch (error) {
      console.error("Error loading exam questions:", error);
      toast({
        title: "❌ خطأ في التحميل",
        description: "فشل في تحميل أسئلة الاختبار، تحقق من اتصالك بالإنترنت",
        variant: "destructive",
      });
      return [];
    }
  };

  // إنهاء الاختبار وحساب النتائج
  const finishExam = () => {
    if (!selectedExam || !examStartTime) return;

    const endTime = new Date();
    const timeTaken = Math.round((endTime.getTime() - examStartTime.getTime()) / 1000 / 60);

    let correctAnswers = 0;
    let mistakes: TahsiliQuestion[] = [];
    const categoryStats: { [category: string]: { correct: number; total: number } } = {};

    selectedExam.questions.forEach((question) => {
      const userAnswer = answers[question.id];
      const correctOptionIndex = question.answerOptions.findIndex(opt => opt.isCorrect);
      
      const category = question.category;
      if (!categoryStats[category]) {
        categoryStats[category] = { correct: 0, total: 0 };
      }
      categoryStats[category].total++;

      if (userAnswer === correctOptionIndex) {
        correctAnswers++;
        categoryStats[category].correct++;
      } else {
        mistakes.push(question);
      }
    });

    const percentage = (correctAnswers / selectedExam.questions.length) * 100;
    
    const results = {
      examName: selectedExam.name,
      totalQuestions: selectedExam.questions.length,
      correctAnswers,
      percentage: Math.round(percentage * 100) / 100,
      timeTaken,
      categoryStats,
      grade: getGrade(percentage),
      mistakes: mistakes.length
    };

    setExamResults(results);
    setMistakeQuestions(mistakes);
    setIsExamFinished(true);

    // Build wrong questions for AI review
    const wrongs: WrongQuestion[] = mistakes.map(question => {
      const correctOptionIndex = question.answerOptions.findIndex(opt => opt.isCorrect);
      return {
        questionText: question.question,
        options: question.answerOptions.map(opt => opt.text),
        studentAnswerIndex: answers[question.id] ?? null,
        correctAnswerIndex: correctOptionIndex,
        category: question.category,
        subcategory: (question as any).subcategory,
      };
    });
    setWrongQuestionsForAI(wrongs);
    setShowAiReview(true);

    // حفظ النتيجة في localStorage
    try {
      const savedResults = localStorage.getItem('tahsiliResults') || '[]';
      const resultsArray = JSON.parse(savedResults);
      resultsArray.push({ ...results, date: new Date().toISOString() });
      localStorage.setItem('tahsiliResults', JSON.stringify(resultsArray));
    } catch (error) {
      console.error('Error saving results:', error);
    }

    // إظهار الألعاب النارية للدرجات العالية
    if (percentage >= 80) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }

    toast({
      title: "تم إنهاء الاختبار!",
      description: `درجتك: ${Math.round(percentage)}% (${correctAnswers}/${selectedExam.questions.length})`,
    });
  };

  // تحديد الدرجة بناء على النسبة المئوية
  const getGrade = (percentage: number): string => {
    if (percentage >= 95) return "ممتاز جداً";
    if (percentage >= 85) return "ممتاز";
    if (percentage >= 75) return "جيد جداً";
    if (percentage >= 65) return "جيد";
    if (percentage >= 50) return "مقبول";
    return "راسب";
  };

  // تحميل الأخطاء كملف HTML
  const downloadMistakes = async () => {
    if (mistakeQuestions.length === 0) {
      toast({
        title: "لا توجد أخطاء",
        description: "لم تخطئ في أي سؤال! أحسنت!",
      });
      return;
    }

    setIsDownloadingMistakes(true);

    try {
      let htmlContent = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>أخطاء ${selectedExam?.name}</title>
    <style>
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            line-height: 1.6; 
            margin: 20px; 
            background-color: #f5f5f5;
        }
        .container { 
            max-width: 800px; 
            margin: 0 auto; 
            background: white; 
            padding: 20px; 
            border-radius: 10px; 
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header { 
            text-align: center; 
            border-bottom: 2px solid #e74c3c; 
            padding-bottom: 20px; 
            margin-bottom: 30px; 
        }
        .question { 
            margin-bottom: 30px; 
            padding: 20px; 
            border: 1px solid #ddd; 
            border-radius: 8px; 
            background-color: #fafafa; 
        }
        .question-header { 
            background-color: #e74c3c; 
            color: white; 
            padding: 10px; 
            border-radius: 5px; 
            margin-bottom: 15px; 
        }
        .category { 
            background-color: #3498db; 
            color: white; 
            padding: 5px 10px; 
            border-radius: 15px; 
            font-size: 12px; 
            display: inline-block; 
            margin-bottom: 10px; 
        }
        .options { 
            margin: 15px 0; 
        }
        .option { 
            padding: 8px 12px; 
            margin: 5px 0; 
            border-radius: 5px; 
            border: 1px solid #ddd; 
        }
        .correct { 
            background-color: #d4edda; 
            border-color: #27ae60; 
            color: #155724; 
        }
        .explanation { 
            background-color: #e8f5e8; 
            padding: 15px; 
            border-radius: 5px; 
            margin-top: 15px; 
            border-left: 4px solid #27ae60; 
        }
        .hint { 
            background-color: #fff3cd; 
            padding: 10px; 
            border-radius: 5px; 
            margin-top: 10px; 
            border-left: 4px solid #f39c12; 
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎯 أخطاء الاختبار</h1>
            <h2>${selectedExam?.name}</h2>
            <p>عدد الأخطاء: ${mistakeQuestions.length} من أصل ${selectedExam?.questions.length}</p>
        </div>
`;

      mistakeQuestions.forEach((question, index) => {
        const correctOption = question.answerOptions.find(opt => opt.isCorrect);
        
        htmlContent += `
        <div class="question">
            <div class="question-header">
                <h3>السؤال رقم ${question.questionNumber} (خطأ ${index + 1})</h3>
            </div>
            <div class="category">${question.category}</div>
            <p><strong>${question.question}</strong></p>
            
            <div class="options">
                <h4>الخيارات:</h4>
`;
        
        question.answerOptions.forEach((option, optIndex) => {
          const isCorrect = option.isCorrect;
          htmlContent += `
                <div class="option ${isCorrect ? 'correct' : ''}">
                    ${String.fromCharCode(65 + optIndex)}) ${option.text}
                    ${isCorrect ? ' ✅ (الإجابة الصحيحة)' : ''}
                </div>
`;
        });

        if (correctOption) {
          htmlContent += `
            </div>
            <div class="explanation">
                <strong>تفسير الإجابة الصحيحة:</strong><br>
                ${correctOption.rationale}
            </div>
`;
        }

        if (question.hint) {
          htmlContent += `
            <div class="hint">
                <strong>💡 تلميح:</strong> ${question.hint}
            </div>
`;
        }

        htmlContent += `
        </div>
`;
      });

      htmlContent += `
    </div>
</body>
</html>`;

      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `أخطاء_${selectedExam?.name}_${new Date().toLocaleDateString('ar-SA')}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "تم التحميل بنجاح!",
        description: "تم تحميل ملف الأخطاء بنجاح",
      });

    } catch (error) {
      console.error('Error downloading mistakes:', error);
      toast({
        title: "خطأ في التحميل",
        description: "حدث خطأ أثناء تحميل الأخطاء",
        variant: "destructive"
      });
    } finally {
      setIsDownloadingMistakes(false);
    }
  };

  // بدء تحدي الأخطاء
  const startMistakeChallenge = () => {
    if (mistakeQuestions.length === 0) {
      toast({
        title: "لا توجد أخطاء",
        description: "لم تخطئ في أي سؤال للتحدي!",
      });
      return;
    }

    const challengeExam: TahsiliExam = {
      ...selectedExam!,
      name: `تحدي الأخطاء - ${selectedExam!.name}`,
      description: "اختبر نفسك مرة أخرى في الأسئلة التي أخطأت فيها",
      totalQuestions: mistakeQuestions.length,
      timeLimit: Math.max(10, mistakeQuestions.length * 2), // دقيقتان لكل سؤال كحد أدنى 10 دقائق
      questions: mistakeQuestions,
      themeColor: "from-red-500 to-orange-600"
    };

    setSelectedExam(challengeExam);
    setCurrentView('exam');
    setCurrentQuestionIndex(0);
    setAnswers({});
    setSelectedAnswer(null);
    setTimeLeft(challengeExam.timeLimit * 60);
    setExamStartTime(new Date());
    setIsExamFinished(false);

    toast({
      title: "🔥 تحدي الأخطاء",
      description: `${mistakeQuestions.length} سؤال في ${challengeExam.timeLimit} دقيقة`,
    });
  };

  // الانتقال للسؤال التالي
  const nextQuestion = () => {
    if (!selectedExam) return;
    
    if (selectedAnswer !== null) {
      setAnswers(prev => ({
        ...prev,
        [selectedExam.questions[currentQuestionIndex].id]: selectedAnswer
      }));
    }

    if (currentQuestionIndex < selectedExam.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      const nextQuestionId = selectedExam.questions[currentQuestionIndex + 1].id;
      setSelectedAnswer(answers[nextQuestionId] ?? null);
    } else {
      finishExam();
    }
  };

  // الانتقال للسؤال السابق
  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      if (selectedAnswer !== null) {
        setAnswers(prev => ({
          ...prev,
          [selectedExam!.questions[currentQuestionIndex].id]: selectedAnswer
        }));
      }
      
      setCurrentQuestionIndex(prev => prev - 1);
      const prevQuestionId = selectedExam!.questions[currentQuestionIndex - 1].id;
      setSelectedAnswer(answers[prevQuestionId] ?? null);
    }
  };

  // تنسيق الوقت
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // جلب أيقونة الفئة
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'الفيزياء': return Atom;
      case 'الكيمياء': return FlaskConical;
      case 'الرياضيات': return Calculator;
      case 'الأحياء': return Brain;
      case 'علم البيئة': return Globe;
      default: return BookOpen;
    }
  };

  const currentQuestion = selectedExam?.questions[currentQuestionIndex];
  const progress = selectedExam ? ((currentQuestionIndex + 1) / selectedExam.questions.length) * 100 : 0;

  // صفحة اختيار الاختبار
  if (currentView === 'selection') {
    return (
      <NewProtectedRoute requiresPremium={true}>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-teal-500 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 py-8">
          <div className="container mx-auto px-4 max-w-6xl">
            
            {/* العنوان الرئيسي */}
            <motion.div 
              className="text-center mb-12"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent mb-4">
                🎓 اختبارات التحصيلي
              </h1>
              <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
                اختبر مستواك في المواد الأساسية واستعد للاختبار التحصيلي بثقة
              </p>
            </motion.div>

            {/* قائمة الاختبارات */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tahsiliExams.map((exam, index) => {
                const Icon = exam.icon;
                return (
                  <motion.div
                    key={exam.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                  >
                    <Card className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 bg-white/80 dark:bg-slate-800/80 backdrop-blur border-0 shadow-lg">
                      <CardHeader className="relative overflow-hidden">
                        <div className={`absolute inset-0 bg-gradient-to-br ${exam.themeColor} opacity-10 group-hover:opacity-20 transition-opacity`} />
                        <div className="relative z-10 flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${exam.themeColor} flex items-center justify-center shadow-lg`}>
                            <Icon className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <Badge variant="secondary" className="mb-2 text-xs">
                              {exam.difficulty === 'beginner' && 'مبتدئ'}
                              {exam.difficulty === 'intermediate' && 'متوسط'} 
                              {exam.difficulty === 'advanced' && 'متقدم'}
                            </Badge>
                            <CardTitle className="text-lg font-bold text-slate-800 dark:text-slate-100">
                              {exam.name}
                            </CardTitle>
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="space-y-4">
                        <CardDescription className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                          {exam.description}
                        </CardDescription>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                            <Target className="w-4 h-4" />
                            <span>{exam.totalQuestions} سؤال</span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                            <Clock className="w-4 h-4" />
                            <span>{exam.timeLimit} دقيقة</span>
                          </div>
                        </div>

                        {/* فئات الأسئلة */}
                        <div className="flex flex-wrap gap-2">
                          {exam.categories.map((category) => {
                            const CategoryIcon = getCategoryIcon(category);
                            return (
                              <Badge key={category} variant="outline" className="text-xs flex items-center gap-1">
                                <CategoryIcon className="w-3 h-3" />
                                {category}
                              </Badge>
                            );
                          })}
                        </div>

                        <Button 
                          onClick={() => startExam(exam)}
                          className={`w-full group bg-gradient-to-r ${exam.themeColor} hover:shadow-lg transition-all text-white font-semibold py-2.5`}
                          data-testid={`button-start-exam-${exam.id}`}
                        >
                          <Rocket className="w-4 h-4 mr-2 group-hover:animate-pulse" />
                          ابدأ الاختبار
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </NewProtectedRoute>
    );
  }

  const [isFinalExitDialogOpen, setIsFinalExitDialogOpen] = useState(false);

  // صفحة الاختبار
  if (currentView === 'exam' && selectedExam && currentQuestion) {
    return (
      <QiyasExamLayout
        examTitle={selectedExam.name}
        questionNumber={currentQuestionIndex + 1}
        totalQuestions={selectedExam.questions.length}
        sectionLabel={currentQuestion.category}
        sectionNumber={1}
        totalSections={1}
        timeLeft={timeLeft}
        isTimeUrgent={timeLeft < 300}
        questionText={currentQuestion.question}
        options={currentQuestion.answerOptions.map(opt => opt.text)}
        selectedAnswer={selectedAnswer}
        onSelectAnswer={setSelectedAnswer}
        currentQuestionIndex={currentQuestionIndex}
        onJumpToQuestion={(index) => {
          if (selectedAnswer !== null) {
            setAnswers(prev => ({
              ...prev,
              [selectedExam.questions[currentQuestionIndex].id]: selectedAnswer
            }));
          }
          setCurrentQuestionIndex(index);
          const nextQuestionId = selectedExam.questions[index].id;
          setSelectedAnswer(answers[nextQuestionId] ?? null);
        }}
        questionsStatus={selectedExam.questions.map((q) => ({
          answered: answers[q.id] !== undefined || (q.id === selectedExam.questions[currentQuestionIndex].id && selectedAnswer !== null),
          bookmarked: bookmarkedQuestions.has(q.id)
        }))}
        isBookmarked={bookmarkedQuestions.has(currentQuestion.id)}
        onToggleBookmark={() => {
          const qId = currentQuestion.id;
          setBookmarkedQuestions(prev => {
            const next = new Set(prev);
            if (next.has(qId)) next.delete(qId); else next.add(qId);
            return next;
          });
        }}
        onPrev={previousQuestion}
        onNext={nextQuestion}
        onFinish={() => setIsFinalExitDialogOpen(true)}
        canGoPrev={currentQuestionIndex > 0}
        canGoNext={true}
        isLastQuestion={currentQuestionIndex === selectedExam.questions.length - 1}
        userName={user?.name || user?.username}
        userId={user?.id?.toString()}
        topRightSlot={
          <AlertDialog open={isFinalExitDialogOpen} onOpenChange={setIsFinalExitDialogOpen}>
            <Button
              variant="destructive"
              size="sm"
              className="flex items-center gap-2"
              onClick={() => setIsFinalExitDialogOpen(true)}
              data-testid="button-end-exam"
            >
              <X className="w-4 h-4" />
              إنهاء الاختبار
            </Button>
            <AlertDialogContent dir="rtl">
              <AlertDialogHeader>
                <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
                <AlertDialogDescription>
                  سيتم إنهاء الاختبار وحساب درجتك بناءً على الإجابات الحالية.
                  هل تريد المتابعة؟
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setIsFinalExitDialogOpen(false)} data-testid="button-cancel-end">إلغاء</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    setIsFinalExitDialogOpen(false);
                    finishExam();
                  }}
                  className="bg-red-600 hover:bg-red-700"
                  data-testid="button-confirm-end"
                >
                  نعم، إنهاء الاختبار
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        }
      />
    );
  }

  // AI Review Screen
  if (showAiReview) {
    const totalQ = selectedExam?.questions.length ?? 0;
    const correctCount = examResults?.correctAnswers ?? (totalQ - wrongQuestionsForAI.length);
    return (
      <AiReviewingScreen
        wrongQuestions={wrongQuestionsForAI}
        totalQuestions={totalQ}
        score={correctCount}
        userEmail={user?.email}
        onShowResults={() => {
          setShowAiReview(false);
          setCurrentView('results');
        }}
      />
    );
  }

  // صفحة النتائج
  if (currentView === 'results' && examResults) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-teal-500 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          
          {/* العنوان والنتيجة الرئيسية */}
          <motion.div 
            className="text-center mb-8"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-3 mb-4">
              <Trophy className="w-8 h-8 text-yellow-500" />
              <h1 className="text-4xl font-bold text-slate-800 dark:text-slate-100">
                نتائج الاختبار
              </h1>
              <Trophy className="w-8 h-8 text-yellow-500" />
            </div>
            
            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur shadow-2xl border-0 max-w-md mx-auto">
              <CardContent className="p-8 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                >
                  <div className={`
                    w-24 h-24 mx-auto mb-4 rounded-full flex items-center justify-center text-3xl font-bold text-white
                    ${examResults.percentage >= 85 
                      ? 'bg-gradient-to-br from-green-400 to-green-600' 
                      : examResults.percentage >= 70 
                        ? 'bg-gradient-to-br from-blue-400 to-blue-600'
                        : 'bg-gradient-to-br from-amber-400 to-amber-600'
                    }
                  `}>
                    {Math.round(examResults.percentage)}%
                  </div>
                </motion.div>
                
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">
                  {examResults.grade}
                </h2>
                <p className="text-slate-600 dark:text-slate-300">
                  {examResults.correctAnswers} من {examResults.totalQuestions} إجابة صحيحة
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* تفاصيل النتائج */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            
            {/* إحصائيات عامة */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-500" />
                    الإحصائيات العامة
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">وقت الانتهاء:</span>
                    <span className="font-semibold">{examResults.timeTaken} دقيقة</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">الإجابات الصحيحة:</span>
                    <span className="font-semibold text-green-600">{examResults.correctAnswers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">الأخطاء:</span>
                    <span className="font-semibold text-red-500">{examResults.mistakes}</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* النتائج حسب الفئة */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-green-700" />
                    الأداء حسب المادة
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {Object.entries(examResults.categoryStats).map(([category, stats]) => {
                    const typedStats = stats as { correct: number; total: number };
                    const percentage = (typedStats.correct / typedStats.total) * 100;
                    const CategoryIcon = getCategoryIcon(category);
                    
                    return (
                      <div key={category} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CategoryIcon className="w-4 h-4 text-slate-500" />
                            <span className="text-sm font-medium">{category}</span>
                          </div>
                          <span className="text-sm text-slate-600 dark:text-slate-400">
                            {typedStats.correct}/{typedStats.total}
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                          <motion.div 
                            className={`h-2 rounded-full ${
                              percentage >= 80 
                                ? 'bg-gradient-to-r from-green-400 to-green-500'
                                : percentage >= 60
                                  ? 'bg-gradient-to-r from-blue-400 to-blue-500' 
                                  : 'bg-gradient-to-r from-red-400 to-red-500'
                            }`}
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ delay: 0.8, duration: 1 }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* أزرار العمل */}
          <motion.div 
            className="flex flex-wrap items-center justify-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Button
              onClick={downloadMistakes}
              disabled={isDownloadingMistakes || examResults.mistakes === 0}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:shadow-lg transition-all text-white px-6 py-3"
              data-testid="button-download-mistakes"
            >
              <Download className="w-4 h-4" />
              {isDownloadingMistakes ? 'جاري التحميل...' : 'تحميل الأخطاء'}
            </Button>

            <Button
              onClick={startMistakeChallenge}
              disabled={examResults.mistakes === 0}
              className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-orange-600 hover:shadow-lg transition-all text-white px-6 py-3"
              data-testid="button-challenge-mistakes"
            >
              <Zap className="w-4 h-4" />
              تحدي الأخطاء ({examResults.mistakes})
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                setCurrentView('selection');
                setSelectedExam(null);
                setExamResults(null);
                setMistakeQuestions([]);
              }}
              className="flex items-center gap-2 px-6 py-3"
              data-testid="button-back-to-selection"
            >
              <RotateCcw className="w-4 h-4" />
              اختبار آخر
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  return null;
};

export default TahsiliExamPage;