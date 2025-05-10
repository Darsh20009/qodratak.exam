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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
import { 
  BookIcon, 
  Clock3, 
  GraduationCapIcon, 
  Info, 
  TrophyIcon,
  ClipboardList,
  Timer,
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TestType } from "@shared/types";

// Types for Qiyas exams
interface QiyasSection {
  sectionNumber: number;
  name: string;
  category: TestType;
  questionCount: number;
  timeLimit: number; // in minutes
}

interface QiyasExam {
  id: number;
  name: string;
  description?: string;
  totalSections: number;
  totalQuestions: number;
  totalTime: number; // in minutes
  sections: QiyasSection[];
}

interface ExamQuestion {
  id: number;
  text: string;
  options: string[];
  correctOptionIndex: number;
  category: TestType;
  section: number;
}

// Mock data for Qiyas exams
const qiyasExams: QiyasExam[] = [
  {
    id: 1,
    name: "اختبار قياس عام 2025",
    description: "اختبار محاكاة كامل يتبع النموذج الرسمي لاختبار قياس: 65 سؤال لفظي و 55 سؤال كمي",
    totalSections: 7,
    totalQuestions: 120,
    totalTime: 120,
    sections: [
      { sectionNumber: 1, name: "القسم الأول", category: "mixed", questionCount: 24, timeLimit: 24 },
      { sectionNumber: 2, name: "القسم الثاني", category: "mixed", questionCount: 24, timeLimit: 24 },
      { sectionNumber: 3, name: "القسم الثالث", category: "mixed", questionCount: 24, timeLimit: 24 },
      { sectionNumber: 4, name: "قدرات لفظية", category: "verbal", questionCount: 13, timeLimit: 13 },
      { sectionNumber: 5, name: "قدرات كمية", category: "quantitative", questionCount: 11, timeLimit: 11 },
      { sectionNumber: 6, name: "قدرات لفظية", category: "verbal", questionCount: 13, timeLimit: 13 },
      { sectionNumber: 7, name: "قدرات كمية", category: "quantitative", questionCount: 11, timeLimit: 11 },
    ]
  },
  {
    id: 2,
    name: "اختبار قياس تجريبي",
    description: "اختبار تدريبي يحاكي بنية اختبار القدرات العامة",
    totalSections: 2,
    totalQuestions: 20,
    totalTime: 20,
    sections: [
      { sectionNumber: 1, name: "قدرات لفظية", category: "verbal", questionCount: 10, timeLimit: 10 },
      { sectionNumber: 2, name: "قدرات كمية", category: "quantitative", questionCount: 10, timeLimit: 10 },
    ]
  }
];

// Main component
const QiyasExamPage: React.FC = () => {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();

  // States for exam selection and progress
  const [selectedExam, setSelectedExam] = useState<QiyasExam | null>(null);
  const [currentView, setCurrentView] = useState<"selection" | "instructions" | "inProgress" | "results">("selection");
  const [currentSection, setCurrentSection] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [showExamResults, setShowExamResults] = useState(false);

  // States for question answers
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [answers, setAnswers] = useState<{[questionId: number]: number}>({});
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);

  // Stats for results
  const [sectionScores, setSectionScores] = useState<{[sectionNumber: number]: number}>({});
  const [examStartTime, setExamStartTime] = useState<Date | null>(null);
  const [examEndTime, setExamEndTime] = useState<Date | null>(null);

  // Timer for the test
  useEffect(() => {
    if (currentView === "inProgress" && timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);

      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && currentView === "inProgress") {
      // Move to the next section or finish the exam if time is up
      moveToNextSection();
    }
  }, [timeLeft, currentView]);

  // Format time from seconds to MM:SS
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Load exam data
  const loadExam = (exam: QiyasExam) => {
    setSelectedExam(exam);
    setCurrentView("instructions");
  };

  // Start the exam
  const startExam = async () => {
    if (!selectedExam) return;

    // Clear previous state
    setCurrentSection(0);
    setCurrentQuestion(0);
    setAnswers({});
    setSectionScores({});
    setShowExamResults(false);

    try {
      // In a real app, this would fetch questions from the API
      // For now, we'll simulate loading questions
      const examQuestions: ExamQuestion[] = await fetchQuestionsForSection(selectedExam.sections[0]);
      setQuestions(examQuestions);

      // Set time limit for the first section
      setTimeLeft(selectedExam.sections[0].timeLimit * 60);

      // Record exam start time
      setExamStartTime(new Date());

      // Switch to exam view
      setCurrentView("inProgress");
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في تحميل أسئلة الاختبار",
        variant: "destructive",
      });
    }
  };

  // Fetch questions for a section (simulated)
  const fetchQuestionsForSection = async (section: QiyasSection): Promise<ExamQuestion[]> => {
    try {
      const response = await fetch('/api/questions');
      if (!response.ok) {
        throw new Error(`Failed to fetch questions. Status: ${response.status}`);
      }
      const allQuestions = await response.json();
      
      if (section.category === "mixed") {
        // For mixed sections, get 13 verbal and 11 quantitative questions
        const verbalQuestions = allQuestions
          .filter(q => q.category === "verbal")
          .sort(() => 0.5 - Math.random())
          .slice(0, 13);
          
        const quantitativeQuestions = allQuestions
          .filter(q => q.category === "quantitative")
          .sort(() => 0.5 - Math.random())
          .slice(0, 11);
          
        // Return verbal questions first, then quantitative
        return [...verbalQuestions, ...quantitativeQuestions];
      } else {
        // For regular sections (verbal or quantitative)
        const sectionQuestions = allQuestions
          .filter(q => q.category === section.category)
          .sort(() => 0.5 - Math.random())
          .slice(0, section.questionCount);
          
        return sectionQuestions;
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
      throw error;
    }
  };

  // Select an answer for the current question
  const selectAnswer = (index: number) => {
    setSelectedAnswer(index);

    // Store the answer
    if (questions[currentQuestion]) {
      const questionId = questions[currentQuestion].id;
      setAnswers(prev => ({ ...prev, [questionId]: index }));
    }
  };

  // Move to the next question
  const goToNextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
      setSelectedAnswer(null);
    } else {
      // Last question of the section
      moveToNextSection();
    }
  };

  // Move to previous question
  const goToPreviousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
      // Set the selected answer to the previously selected one
      const questionId = questions[currentQuestion - 1].id;
      setSelectedAnswer(answers[questionId] ?? null);
    }
  };

  // Move to the next section or finish the exam
  const moveToNextSection = async () => {
    if (!selectedExam) return;

    // Calculate score for current section
    calculateSectionScore();

    // Check if this was the last section
    if (currentSection >= selectedExam.sections.length - 1) {
      finishExam();
      return;
    }

    // Move to the next section
    const nextSection = currentSection + 1;
    setCurrentSection(nextSection);
    setCurrentQuestion(0);
    setSelectedAnswer(null);

    // Load questions for the next section
    try {
      const nextSectionQuestions = await fetchQuestionsForSection(selectedExam.sections[nextSection]);
      setQuestions(nextSectionQuestions);

      // Set time limit for the next section
      setTimeLeft(selectedExam.sections[nextSection].timeLimit * 60);
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في تحميل أسئلة القسم التالي",
        variant: "destructive",
      });
    }
  };

  // Calculate score for the current section
  const calculateSectionScore = () => {
    if (!selectedExam) return;

    const sectionNumber = selectedExam.sections[currentSection].sectionNumber;
    let correctCount = 0;

    // Count correct answers for this section
    questions.forEach(q => {
      const userAnswer = answers[q.id];
      if (userAnswer === q.correctOptionIndex) {
        correctCount++;
      }
    });

    // Store section score
    setSectionScores(prev => ({
      ...prev,
      [sectionNumber]: correctCount
    }));
  };

  // Finish the exam and calculate overall results
  const finishExam = () => {
    setExamEndTime(new Date());
    setCurrentView("results");
  };

  // Calculate exam statistics for results page
  const calculateExamStats = () => {
    if (!selectedExam || !examStartTime || !examEndTime) return {
      totalScore: 0,
      totalCorrect: 0,
      totalQuestions: 0,
      verbalScore: 0,
      quantitativeScore: 0,
      timeTaken: 0,
      percentage: 0
    };

    // Calculate total score
    let totalCorrect = 0;
    let totalQuestions = 0;
    let verbalCorrect = 0;
    let quantitativeCorrect = 0;
    let verbalTotal = 0;
    let quantitativeTotal = 0;

    selectedExam.sections.forEach(section => {
      const sectionScore = sectionScores[section.sectionNumber] || 0;

      totalCorrect += sectionScore;
      totalQuestions += section.questionCount;

      if (section.category === "mixed") {
        // For mixed sections, we have 13 verbal questions and 11 quantitative questions
        const verbalCount = 13;
        const quantitativeCount = section.questionCount - verbalCount;

        // For mixed sections, we can't know exactly how many verbal vs quantitative 
        // questions were answered correctly, so we distribute proportionally
        const verbalProportion = verbalCount / section.questionCount;
        const verbalScoreEstimate = Math.round(sectionScore * verbalProportion);
        const quantitativeScoreEstimate = sectionScore - verbalScoreEstimate;

        verbalCorrect += verbalScoreEstimate;
        verbalTotal += verbalCount;

        quantitativeCorrect += quantitativeScoreEstimate;
        quantitativeTotal += quantitativeCount;
      } else if (section.category === "verbal") {
        verbalCorrect += sectionScore;
        verbalTotal += section.questionCount;
      } else {
        quantitativeCorrect += sectionScore;
        quantitativeTotal += section.questionCount;
      }
    });

    // Calculate time taken
    const timeTaken = Math.floor((examEndTime.getTime() - examStartTime.getTime()) / 1000 / 60); // in minutes

    // Calculate percentages
    const percentage = (totalCorrect / totalQuestions) * 100;
    const verbalPercentage = verbalTotal > 0 ? (verbalCorrect / verbalTotal) * 100 : 0;
    const quantitativePercentage = quantitativeTotal > 0 ? (quantitativeCorrect / quantitativeTotal) * 100 : 0;

    return {
      totalScore: totalCorrect,
      totalCorrect,
      totalQuestions,
      verbalScore: verbalCorrect,
      verbalTotal,
      verbalPercentage,
      quantitativeScore: quantitativeCorrect,
      quantitativeTotal,
      quantitativePercentage,
      timeTaken,
      percentage
    };
  };

  // Render the exam selection view
  const renderExamSelection = () => (
    <div className="p-6 space-y-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">اختبارات قياس</h1>
            <p className="text-muted-foreground">اختبارات تحاكي اختبار القدرات العامة (قياس) الرسمي</p>
          </div>
          <Button onClick={() => setLocation("/custom-exam")}>
            إنشاء اختبار مخصص
          </Button>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {qiyasExams.map(exam => (
            <Card key={exam.id} className="overflow-hidden">
              <div className="bg-primary h-2"></div>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCapIcon className="h-5 w-5" />
                  {exam.name}
                </CardTitle>
                <CardDescription>{exam.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-muted/30 p-3 rounded-lg text-center">
                    <div className="text-sm text-muted-foreground mb-1">الأقسام</div>
                    <div className="font-bold">{exam.totalSections}</div>
                  </div>
                  <div className="bg-muted/30 p-3 rounded-lg text-center">
                    <div className="text-sm text-muted-foreground mb-1">الأسئلة</div>
                    <div className="font-bold">{exam.totalQuestions}</div>
                  </div>
                  <div className="bg-muted/30 p-3 rounded-lg text-center">
                    <div className="text-sm text-muted-foreground mb-1">الوقت</div>
                    <div className="font-bold">{exam.totalTime} دقيقة</div>
                  </div>
                  <div className="bg-muted/30 p-3 rounded-lg text-center">
                    <div className="text-sm text-muted-foreground mb-1">المستوى</div>
                    <div className="font-bold">{exam.totalQuestions >= 100 ? "رسمي" : "تدريبي"}</div>
                  </div>
                </div>

                <div className="text-sm mb-2">أقسام الاختبار:</div>
                <div className="space-y-2">
                  {exam.sections.map(section => (
                    <div key={section.sectionNumber} className="flex justify-between items-center text-sm">
                      <div>{section.name}</div>
                      <Badge className="ml-2" variant="outline">
                        {section.questionCount} سؤال
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full" onClick={() => loadExam(exam)}>
                  ابدأ الاختبار
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );

  // Render the exam instructions view
  const renderExamInstructions = () => {
    if (!selectedExam) return null;

    return (
      <div className="container max-w-4xl py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">تعليمات الاختبار</CardTitle>
            <CardDescription>{selectedExam.name}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-500 mt-0.5" />
              <div>
                <h3 className="font-medium mb-1">هام جداً</h3>
                <p className="text-sm">
                  هذا الاختبار يحاكي اختبار قياس الرسمي من حيث البنية والتوقيت. اتبع التعليمات بدقة للحصول على تجربة واقعية.
                </p>
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-2">معلومات الاختبار:</h3>
              <ul className="space-y-2">
                <li className="flex gap-2">
                  <ClipboardList className="h-5 w-5 text-muted-foreground" />
                  <span>عدد الأقسام: <strong>{selectedExam.totalSections}</strong></span>
                </li>
                <li className="flex gap-2">
                  <BookIcon className="h-5 w-5 text-muted-foreground" />
                  <span>إجمالي الأسئلة: <strong>{selectedExam.totalQuestions}</strong></span>
                </li>
                <li className="flex gap-2">
                  <Timer className="h-5 w-5 text-muted-foreground" />
                  <span>الوقت الإجمالي: <strong>{selectedExam.totalTime} دقيقة</strong></span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium mb-2">تفاصيل الأقسام:</h3>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-2 text-right">القسم</th>
                      <th className="px-4 py-2 text-right">النوع</th>
                      <th className="px-4 py-2 text-right">عدد الأسئلة</th>
                      <th className="px-4 py-2 text-right">الوقت (دقائق)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedExam.sections.map((section, index) => (
                      <tr key={section.sectionNumber} className={index % 2 === 0 ? "bg-white" : "bg-muted/20"}>
                        <td className="border-t px-4 py-2">{section.name}</td>
                        <td className="border-t px-4 py-2">
                          {section.category === "verbal" ? "لفظي" : 
                           section.category === "quantitative" ? "كمي" : 
                           "مختلط (لفظي وكمي)"}
                        </td>
                        <td className="border-t px-4 py-2">{section.questionCount}</td>
                        <td className="border-t px-4 py-2">{section.timeLimit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-2">إرشادات:</h3>
              <ul className="space-y-1 text-sm list-disc list-inside">
                <li>لا يمكن العودة إلى قسم سابق بعد الانتهاء منه.</li>
                <li>يمكنك التنقل بين أسئلة القسم الواحد بحرية.</li>
                <li>سيتم الانتقال تلقائياً إلى القسم التالي عند انتهاء الوقت.</li>
                <li>كل إجابة صحيحة تمنح نقطة واحدة.</li>
                <li>لا توجد نقاط سالبة للإجابات الخاطئة.</li>
              </ul>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => setCurrentView("selection")}>
              العودة للاختبارات
            </Button>
            <Button onClick={startExam}>
              ابدأ الاختبار
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  };

  // Render the exam in progress view
  const renderExamInProgress = () => {
    if (!selectedExam || questions.length === 0) return (
      <div className="container py-8 text-center">
        <div className="animate-pulse">جاري تحميل الأسئلة...</div>
      </div>
    );

    const currentSectionData = selectedExam.sections[currentSection];
    const currentQuestionData = questions[currentQuestion];

    return (
      <div className="container py-6 max-w-4xl">
        {/* Header with progress & timer */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-lg font-medium">
              القسم {currentSectionData.sectionNumber}: {currentSectionData.name}
            </h2>
            <div className="text-sm text-muted-foreground">
              {currentSectionData.category === "verbal" ? "قدرات لفظية" : 
               currentSectionData.category === "quantitative" ? "قدرات كمية" : 
               "قدرات مختلطة (لفظية وكمية)"}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Clock3 className="h-4 w-4" />
              <span className={cn(
                "font-medium",
                timeLeft < 60 && "text-red-500"
              )}>
                {formatTime(timeLeft)}
              </span>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="flex justify-between text-sm mb-1">
          <span>السؤال {currentQuestion + 1} من {questions.length}</span>
          <span>القسم {currentSection + 1} من {selectedExam.sections.length}</span>
        </div>
        <Progress value={(currentQuestion + 1) / questions.length * 100} className="mb-6" />

        {/* Question */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-xl">
              السؤال {currentQuestion + 1}
            </CardTitle>
            <CardDescription className="text-base">
              {currentQuestionData.text}
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Options */}
        <div className="space-y-3 mb-8">
          {currentQuestionData.options.map((option, index) => (
            <div
              key={index}
              className={cn(
                "p-4 border rounded-lg cursor-pointer hover:bg-accent/50 transition-colors",
                selectedAnswer === index && "border-primary bg-primary/10"
              )}
              onClick={() => selectAnswer(index)}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center text-sm", 
                  selectedAnswer === index ? "bg-primary text-primary-foreground" : "bg-muted"
                )}>
                  {index + 1}
                </div>
                <div>{option}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={goToPreviousQuestion}
            disabled={currentQuestion === 0}
          >
            <ArrowRightIcon className="h-4 w-4 ml-2" />
            السؤال السابق
          </Button>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="mx-2">
                إنهاء القسم
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>هل أنت متأكد من إنهاء هذا القسم؟</DialogTitle>
                <DialogDescription>
                  لا يمكنك العودة إلى هذا القسم بعد الانتهاء منه. تبقى لديك {questions.length - currentQuestion - 1} سؤال غير مجاب.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button onClick={moveToNextSection}>نعم، إنهاء القسم</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button 
            onClick={goToNextQuestion}
            disabled={selectedAnswer === null}
          >
            {currentQuestion < questions.length - 1 ? (
              <>
                السؤال التالي
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
              </>
            ) : (
              "إنهاء القسم"
            )}
          </Button>
        </div>
      </div>
    );
  };

  // Render the exam results view
  const renderExamResults = () => {
    if (!selectedExam) return null;

    const stats = calculateExamStats();
    const performance = 
      stats.percentage >= 90 ? { label: "ممتاز", color: "text-green-500" } :
      stats.percentage >= 70 ? { label: "جيد جداً", color: "text-blue-500" } :
      stats.percentage >= 50 ? { label: "جيد", color: "text-yellow-500" } :
      { label: "بحاجة للتحسين", color: "text-red-500" };

    return (
      <div className="container py-8 max-w-4xl">
        <Card className="mb-8 overflow-hidden">
          <div className="h-2 bg-primary"></div>
          <CardHeader className="text-center">
            <TrophyIcon className="h-12 w-12 text-yellow-500 mx-auto mb-2" />
            <CardTitle className="text-2xl">نتيجة اختبار {selectedExam.name}</CardTitle>
            <CardDescription>
              أكملت الاختبار بنجاح
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center mb-8">
              <div className="text-4xl font-bold mb-1">{stats.totalScore}/{stats.totalQuestions}</div>
              <div className={cn("text-xl font-medium", performance.color)}>
                {performance.label} ({stats.percentage.toFixed(1)}%)
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-muted/30 p-4 rounded-lg text-center">
                <div className="text-sm text-muted-foreground mb-1">القدرات اللفظية</div>
                <div className="font-bold">{stats.verbalScore}/{stats.verbalTotal}</div>
                <div className="text-xs text-muted-foreground">
                  {stats.verbalPercentage ? stats.verbalPercentage.toFixed(1) : 0}%
                </div>
              </div>
              <div className="bg-muted/30 p-4 rounded-lg text-center">
                <div className="text-sm text-muted-foreground mb-1">القدرات الكمية</div>
                <div className="font-bold">{stats.quantitativeScore}/{stats.quantitativeTotal}</div>
                <div className="text-xs text-muted-foreground">
                  {stats.quantitativePercentage ? stats.quantitativePercentage.toFixed(1) : 0}%
                </div>
              </div>
              <div className="bg-muted/30 p-4 rounded-lg text-center">
                <div className="text-sm text-muted-foreground mb-1">الوقت المستغرق</div>
                <div className="font-bold">{stats.timeTaken} دقيقة</div>
                <div className="text-xs text-muted-foreground">
                  من أصل {selectedExam.totalTime} دقيقة
                </div>
              </div>
              <div className="bg-muted/30 p-4 rounded-lg text-center">
                <div className="text-sm text-muted-foreground mb-1">التقدير</div>
                <div className={cn("font-bold", performance.color)}>{performance.label}</div>
                <div className="text-xs text-muted-foreground">
                  المستوى العام
                </div>
              </div>
            </div>

            <Separator className="my-6" />

            <div>
              <h3 className="font-medium mb-4">النتائج حسب القسم:</h3>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-2 text-right">القسم</th>
                      <th className="px-4 py-2 text-right">النوع</th>
                      <th className="px-4 py-2 text-right">النتيجة</th>
                      <th className="px-4 py-2 text-right">النسبة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedExam.sections.map((section, index) => {
                      const sectionScore = sectionScores[section.sectionNumber] || 0;
                      const sectionPercentage = (sectionScore / section.questionCount) * 100;

                      return (
                        <tr key={section.sectionNumber} className={index % 2 === 0 ? "bg-white" : "bg-muted/20"}>
                          <td className="border-t px-4 py-2">{section.name}</td>
                          <td className="border-t px-4 py-2">
                            {section.category === "verbal" ? "لفظي" : 
                             section.category === "quantitative" ? "كمي" : 
                             "مختلط (لفظي وكمي)"}
                          </td>
                          <td className="border-t px-4 py-2">{sectionScore}/{section.questionCount}</td>
                          <td className="border-t px-4 py-2">{sectionPercentage.toFixed(1)}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => setCurrentView("selection")}>
              العودة للاختبارات
            </Button>
            {stats.percentage >= 60 && (
              <Button 
                onClick={() => {
                  toast({
                    title: "تم حفظ شهادة الاختبار",
                    description: "يمكنك الوصول إليها من صفحة الملف الشخصي",
                  });
                }}
                className="gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                احصل على شهادة
              </Button>
            )}
          </CardFooter>
        </Card>

        {/* More detailed analysis and recommendations would go here */}
        <Card>
          <CardHeader>
            <CardTitle>تحليل الأداء والتوصيات</CardTitle>
            <CardDescription>
              بناءً على أدائك في هذا الاختبار، إليك بعض التوصيات لتحسين نتيجتك
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="verbal">
              <TabsList className="w-full mb-4">
                <TabsTrigger value="verbal">القدرات اللفظية</TabsTrigger>
                <TabsTrigger value="quantitative">القدرات الكمية</TabsTrigger>
              </TabsList>

              <TabsContent value="verbal" className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">نقاط القوة</h4>
                  <ul className="text-sm space-y-1 list-disc list-inside">
                    <li>أداء جيد في فهم النصوص واستخلاص النتائج</li>
                    <li>معرفة مناسبة بالمترادفات والمتضادات</li>
                  </ul>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">مجالات التحسين</h4>
                  <ul className="text-sm space-y-1 list-disc list-inside">
                    <li>تحتاج إلى تحسين في القياس اللفظي</li>
                    <li>تدرب على التمييز بين العلاقات اللفظية المتشابهة</li>
                  </ul>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-medium mb-2">التوصيات</h4>
                  <p className="text-sm mb-2">
                    نوصي بالتركيز على تدريبات القياس اللفظي والمقارنات اللغوية. يمكنك أيضًا:
                  </p>
                  <ul className="text-sm space-y-1 list-disc list-inside">
                    <li>قراءة النصوص الأدبية المتنوعة</li>
                    <li>حل تمارين مخصصة للعلاقات اللفظية</li>
                    <li>الاطلاع على قاموس المترادفات والأضداد</li>
                  </ul>
                </div>
              </TabsContent>

              <TabsContent value="quantitative" className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">نقاط القوة</h4>
                  <ul className="text-sm space-y-1 list-disc list-inside">
                    <li>إتقان العمليات الحسابية الأساسية</li>
                    <li>فهم جيد للنسب المئوية</li>
                  </ul>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">مجالات التحسين</h4>
                  <ul className="text-sm space-y-1 list-disc list-inside">
                    <li>تحتاج إلى تحسين في حل المسائل الهندسية</li>
                    <li>تقوية التعامل مع الاحتمالات والإحصاء</li>
                  </ul>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-medium mb-2">التوصيات</h4>
                  <p className="text-sm mb-2">
                    نوصي بالتركيز على تدريبات الهندسة والاحتمالات. يمكنك أيضًا:
                  </p>
                  <ul className="text-sm space-y-1 list-disc list-inside">
                    <li>مراجعة قوانين المساحة والحجم للأشكال الهندسية</li>
                    <li>التدرب على مسائل التوافيق والتباديل</li>
                    <li>حل تمارين إضافية في تحليل البيانات الإحصائية</li>
                  </ul>
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
      {currentView === "selection" && renderExamSelection()}
      {currentView === "instructions" && renderExamInstructions()}
      {currentView === "inProgress" && renderExamInProgress()}
      {currentView === "results" && renderExamResults()}
    </>
  );
};

export default QiyasExamPage;