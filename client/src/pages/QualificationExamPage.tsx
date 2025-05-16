
import React, { useState, useEffect } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Clock, Timer, BookOpen, Calculator } from "lucide-react";
import { ExamConfig, TestQuestion } from "@shared/types";
import { apiRequest } from "@/lib/queryClient";

const QualificationExamPage: React.FC = () => {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // States for exam progress
  const [examConfig, setExamConfig] = useState<ExamConfig | null>(null);
  const [currentSection, setCurrentSection] = useState(0);
  const [questions, setQuestions] = useState<TestQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [answers, setAnswers] = useState<{[questionId: number]: number}>({});
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [sectionScores, setSectionScores] = useState<number[]>([]);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  // Check subscription on mount
  useEffect(() => {
    const checkSubscription = async () => {
      try {
        const response = await apiRequest('GET', '/api/user');
        const user = await response.json();
        
        if (!user.subscription || user.subscription.type === 'free') {
          setShowSubscriptionModal(true);
        } else {
          loadExamConfig();
        }
      } catch (error) {
        toast({
          title: "خطأ",
          description: "فشل في التحقق من حالة الاشتراك",
          variant: "destructive",
        });
      }
    };
    
    checkSubscription();
  }, []);

  // Timer effect
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && questions.length > 0) {
      finishSection();
    }
  }, [timeLeft]);

  const loadExamConfig = async () => {
    try {
      const response = await apiRequest('GET', '/api/exam-templates/qualification');
      const config = await response.json();
      setExamConfig(config);
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في تحميل الاختبار",
        variant: "destructive",
      });
    }
  };

  const startSection = async () => {
    if (!examConfig) return;
    
    try {
      const section = examConfig.sections[currentSection];
      const response = await apiRequest(
        'GET',
        `/api/questions?category=${section.category}&count=${section.questionCount}`
      );
      const sectionQuestions = await response.json();
      
      setQuestions(sectionQuestions);
      setTimeLeft(section.timeLimit * 60);
      setCurrentQuestionIndex(0);
      setSelectedAnswer(null);
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في تحميل الأسئلة",
        variant: "destructive",
      });
    }
  };

  const selectAnswer = (index: number) => {
    if (!questions[currentQuestionIndex]) return;
    
    setSelectedAnswer(index);
    setAnswers(prev => ({
      ...prev,
      [questions[currentQuestionIndex].id]: index
    }));
  };

  const goToNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
    } else {
      finishSection();
    }
  };

  const finishSection = () => {
    // Calculate section score
    const score = questions.reduce((acc, q) => {
      return acc + (answers[q.id] === q.correctOptionIndex ? 1 : 0);
    }, 0);
    
    setSectionScores(prev => [...prev, score]);
    
    if (currentSection < examConfig!.totalSections - 1) {
      setCurrentSection(prev => prev + 1);
      startSection();
    } else {
      finishExam();
    }
  };

  const finishExam = async () => {
    const totalScore = sectionScores.reduce((a, b) => a + b, 0);
    const totalQuestions = examConfig!.totalQuestions;
    
    try {
      await apiRequest('POST', '/api/exam-results', {
        examType: 'qualification',
        score: totalScore,
        totalQuestions,
        sectionScores,
        completedAt: new Date().toISOString()
      });
      
      setLocation('/exam-results');
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في حفظ النتائج",
        variant: "destructive",
      });
    }
  };

  // JSX for different views
  if (showSubscriptionModal) {
    return (
      <AlertDialog open={true}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>هذا الاختبار للمشتركين فقط</AlertDialogTitle>
            <AlertDialogDescription>
              يرجى الاشتراك للوصول إلى الاختبار التأهيلي الشامل
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setLocation('/')}>عودة</AlertDialogCancel>
            <AlertDialogAction onClick={() => setLocation('/subscription')}>
              اشترك الآن
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  if (!examConfig) {
    return <div>جاري التحميل...</div>;
  }

  return (
    <div className="container py-6 max-w-4xl">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">{examConfig.name}</h1>
          <p className="text-muted-foreground">
            القسم {currentSection + 1} من {examConfig.totalSections}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            <span className={timeLeft < 60 ? "text-red-500" : ""}>
              {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </span>
          </div>
          <Badge>
            {currentQuestionIndex + 1}/{questions.length}
          </Badge>
        </div>
      </div>

      {/* Progress */}
      <Progress
        value={(currentQuestionIndex / questions.length) * 100}
        className="mb-6"
      />

      {/* Question */}
      {questions[currentQuestionIndex] && (
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              {questions[currentQuestionIndex].category === 'verbal' ? (
                <BookOpen className="h-5 w-5" />
              ) : (
                <Calculator className="h-5 w-5" />
              )}
              <CardTitle>السؤال {currentQuestionIndex + 1}</CardTitle>
            </div>
            <CardDescription>
              {questions[currentQuestionIndex].text}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {questions[currentQuestionIndex].options.map((option, index) => (
                <Button
                  key={index}
                  variant={selectedAnswer === index ? "default" : "outline"}
                  className="w-full justify-start"
                  onClick={() => selectAnswer(index)}
                >
                  {option}
                </Button>
              ))}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => setLocation('/')}>
              إلغاء الاختبار
            </Button>
            <Button
              onClick={goToNextQuestion}
              disabled={selectedAnswer === null}
            >
              {currentQuestionIndex < questions.length - 1 ? "السؤال التالي" : "إنهاء القسم"}
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
};

export default QualificationExamPage;
