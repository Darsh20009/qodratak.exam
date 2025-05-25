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
  Clock3, 
  GraduationCapIcon, 
  Info, 
  TrophyIcon, Download,
  ClipboardList,
  Timer,
  ArrowLeftIcon,
  BookOpen,
  ArrowRightIcon,
  CheckCircle,
  LockIcon
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
  isQiyas?: boolean;
  requiresSubscription?: boolean;
  isMockExam?: boolean;
  hideQuestionReview?: boolean;
}

interface ExamQuestion {
  id: number;
  text: string;
  options: string[];
  correctOptionIndex: number;
  category: TestType;
  section: number;
  explanation?: string; // Added explanation field
}

// Mock data for Qiyas exams
const qiyasExams: QiyasExam[] = [
  {
    id: 1,
    name: "اختبار قدراتك التأهيلي",
    description: "اختبار تأهيلي شامل يتكون من سبعة أقسام متنوعة بين اللفظي والكمي",
    totalSections: 7,
    totalQuestions: 120,
    totalTime: 120,
    isQiyas: true,
    requiresSubscription: true,
    sections: [
      { sectionNumber: 1, name: "القسم الأول", category: "mixed", questionCount: 24, timeLimit: 24 },
      { sectionNumber: 2, name: "القسم الثاني", category: "mixed", questionCount: 24, timeLimit: 24 },
      { sectionNumber: 3, name: "القسم الثالث", category: "mixed", questionCount: 24, timeLimit: 24 },
      { sectionNumber: 4, name: "قدرات كمية", category: "quantitative", questionCount: 11, timeLimit: 11 },
      { sectionNumber: 5, name: "قدرات لفظية", category: "verbal", questionCount: 13, timeLimit: 13 },
      { sectionNumber: 6, name: "قدرات كمية", category: "quantitative", questionCount: 11, timeLimit: 11 },
      { sectionNumber: 7, name: "قدرات لفظية", category: "verbal", questionCount: 13, timeLimit: 13 }
    ]
  },
  {
    id: 2,
    name: "اختبار لفظي - 65 سؤال",
    description: "اختبار قدرات لفظي شامل يحاكي نموذج قياس: 65 سؤال في 65 دقيقة مع الشرح المفصل",
    type: "verbal",
    totalSections: 1,
    totalQuestions: 65,
    totalTime: 65,
    isMockExam: true,
    requiresSubscription: true,
    sections: [
      {
        sectionNumber: 1,
        name: "القسم اللفظي",
        category: "verbal",
        questionCount: 65,
        timeLimit: 65
      }
    ]
  },
  {
    id: 3,
    name: "اختبار كمي - 55 سؤال",
    description: "اختبار قدرات كمي شامل يحاكي نموذج قياس: 55 سؤال في 55 دقيقة مع الشرح المفصل",
    type: "quantitative",
    totalSections: 1,
    totalQuestions: 55,
    totalTime: 55,
    isMockExam: true,
    requiresSubscription: true,
    sections: [
      {
        sectionNumber: 1,
        name: "القسم الكمي",
        category: "quantitative",
        questionCount: 55,
        timeLimit: 55
      }
    ]
  },

  {
    id: 4,
    name: "اختبار قياس عام 2025",
    description: "اختبار محاكاة كامل يتبع النموذج الرسمي لاختبار قياس: 65 سؤال لفظي و 55 سؤال كمي",
    totalSections: 7,
    totalQuestions: 120,
    totalTime: 120,
    requiresSubscription: false,
    hideQuestionReview: true,
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
    id: 5,
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
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

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

  // Store questions for all sections to show in results
  const [allSectionsQuestions, setAllSectionsQuestions] = useState<{[sectionNumber: number]: ExamQuestion[]}>({});

  // Prayer Break Functionality
  const [isPrayerBreak, setIsPrayerBreak] = useState(false);

  // Timer for the test
  useEffect(() => {
    if (currentView === "inProgress" && timeLeft > 0 && !isPrayerBreak) {
      const timer = setTimeout(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);

      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && currentView === "inProgress") {
      moveToNextSection();
    }
  }, [timeLeft, currentView, isPrayerBreak]);

  // Prayer break overlay
  useEffect(() => {
    if (isPrayerBreak) {
      toast({
        title: "وقت الصلاة",
        description: "تم إيقاف الاختبار مؤقتاً. يمكنك استئناف الاختبار بعد الانتهاء من الصلاة.",
        duration: 5000,
      });
    }
  }, [isPrayerBreak]);

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
    setAllSectionsQuestions({});

    try {
      // In a real app, this would fetch questions from the API
      // For now, we'll simulate loading questions
      const firstSection = selectedExam.sections[0];
      const examQuestions: ExamQuestion[] = await fetchQuestionsForSection(firstSection);
      setQuestions(examQuestions);

      // Store questions for the first section
      setAllSectionsQuestions({ [firstSection.sectionNumber]: examQuestions });

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

    // Accumulate results without showing them yet
    setCurrentSection(nextSection => nextSection + 1);
    setCurrentQuestion(0);
    setSelectedAnswer(null);

    // Load questions for the next section
    try {
      const nextSection = currentSection + 1;
      const nextSectionQuestions = await fetchQuestionsForSection(selectedExam.sections[nextSection]);
      setQuestions(nextSectionQuestions);
      setTimeLeft(selectedExam.sections[nextSection].timeLimit * 60);

      // Store the questions for the next section
      setAllSectionsQuestions(prev => ({
        ...prev,
        [selectedExam.sections[nextSection].sectionNumber]: nextSectionQuestions
      }));
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في تحميل أسئلة القسم التالي",
        variant: "destructive",
      });
    }

    // Move to the next section
    // const nextSection = currentSection + 1;
    // setCurrentSection(nextSection);
    // setCurrentQuestion(0);
    // setSelectedAnswer(null);

    // // Load questions for the next section
    // try {
    //   const nextSectionQuestions = await fetchQuestionsForSection(selectedExam.sections[nextSection]);
    //   setQuestions(nextSectionQuestions);

    //   // Set time limit for the next section
    //   setTimeLeft(selectedExam.sections[nextSection].timeLimit * 60);
    // } catch (error) {
    //   toast({
    //     title: "خطأ",
    //     description: "فشل في تحميل أسئلة القسم التالي",
    //     variant: "destructive",
    //   });
    // }
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
    const stats = calculateExamStats();
    const currentDate = new Date().toISOString();
    const examType = selectedExam?.name || "اختبار قياس";
    
    // Save exam data
    const storageKey = `exam_data_${examType}_${new Date(currentDate).getTime()}`;
    localStorage.setItem(storageKey, JSON.stringify({
      questions: questions,
      userAnswers: answers
    }));
    
    // Save to exam records
    const storedRecords = localStorage.getItem('examRecords') || '[]';
    const records = JSON.parse(storedRecords);
    records.push({
      date: currentDate,
      examType: examType,
      score: stats.totalCorrect,
      totalQuestions: stats.totalQuestions,
      timeTaken: stats.timeTaken
    });
    localStorage.setItem('examRecords', JSON.stringify(records));

    setShowExamResults(true);
    setCurrentView("results");
  };

  // Calculate exam statistics for results page
  const calculateExamStats = () => {
    if (!selectedExam || !examStartTime) return {
      totalScore: 0,
      totalCorrect: 0,
      totalQuestions: 0,
      verbalScore: 0,
      verbalTotal: 0,
      verbalPercentage: 0,
      quantitativeScore: 0,
      quantitativeTotal: 0,
      quantitativePercentage: 0,
      timeTaken: 0,
      percentage: 0
    };

    // Calculate actual time taken
    const endTime = examEndTime || new Date();
    const timeDiffInMinutes = Math.ceil((endTime.getTime() - examStartTime.getTime()) / (1000 * 60));
    const actualTimeTaken = Math.min(timeDiffInMinutes, selectedExam.totalTime);

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
    const timeTaken = actualTimeTaken;

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
                  <div className="bg-gradient-to-br from-muted/20 to-muted/30 p-4 rounded-xl text-center transform transition-all duration-300 hover:scale-105 hover:shadow-lg">
                    <div className="text-sm text-muted-foreground/90 mb-2">الأقسام</div>
                    <div className="font-bold text-lg animate-fade-in">{exam.totalQuestions}</div>
                  </div>
                  <div className="bg-gradient-to-br from-muted/20 to-muted/30 p-4 rounded-xl text-center transform transition-all duration-300 hover:scale-105 hover:shadow-lg">
                    <div className="text-sm text-muted-foreground/90 mb-2">الوقت</div>
                    <div className="font-bold text-lg animate-fade-in">{exam.totalTime} دقيقة</div>
                  </div>
                  <div className="bg-gradient-to-br from-muted/20 to-muted/30 p-4 rounded-xl text-center transform transition-all duration-300 hover:scale-105 hover:shadow-lg">
                    <div className="text-sm text-muted-foreground/90 mb-2">المستوى</div>
                    <div className="font-bold text-lg animate-fade-in">{exam.totalQuestions >= 100 ? "رسمي" : "تدريبي"}</div>
                  </div>
                </div>

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
                {exam.requiresSubscription && exam.name !== "اختبار قياس عام 2025" && (
                  <div className="mt-4 p-2 bg-muted/50 rounded-lg text-sm text-center text-muted-foreground">
                    هذا الاختبار متاح للمشتركين فقط
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full" 
                  onClick={() => {
                    const user = JSON.parse(localStorage.getItem('user') || '{}');
                    const isSubscribed = user?.subscription?.type === 'Pro Live' || user?.subscription?.type === 'Pro';
                    if (!isSubscribed && exam.requiresSubscription) {
                      setLocation("/subscription");
                    } else {
                      loadExam(exam);
                    }
                  }}
                >
                  {exam.requiresSubscription ? (
                    <div className="flex items-center gap-2">
                      {user?.subscription?.type === 'Pro Live' || user?.subscription?.type === 'Pro' ? (
                        <>
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          حسابك مفعل - ابدأ الاختبار
                        </>
                      ) : (
                        <>
                          <LockIcon className="h-4 w-4" />
                          يتطلب اشتراك مدفوع
                        </>
                      )}
                    </div>
                  ) : (
                    "ابدأ الاختبار"
                  )}
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
            <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-lg flex items-start gap-3 text-slate-100">
              <Info className="h-5 w-5 text-blue-400 mt-0.5" />
              <div>
                <h3 className="font-medium mb-1">هام جداً</h3>
                <p className="text-sm text-slate-200">
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
                  <BookOpen className="h-5 w-5 text-muted-foreground" />
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
              <div className="border border-slate-700 rounded-lg overflow-hidden bg-slate-900/90">
                <table className="w-full">
                  <thead className="bg-slate-800">
                    <tr>
                      <th className="px-4 py-2 text-right text-slate-100">القسم</th>
                      <th className="px-4 py-2 text-right text-slate-100">النوع</th>
                      <th className="px-4 py-2 text-right text-slate-100">عدد الأسئلة</th>
                      <th className="px-4 py-2 text-right text-slate-100">الوقت (دقائق)</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-200">
                    {selectedExam.sections.map((section, index) => (
                      <tr key={section.sectionNumber} className={index % 2 === 0 ? "bg-slate-900" : "bg-slate-800/50"}>
                        <td className="border-t border-slate-700 px-4 py-2">{section.name}</td>
                        <td className="border-t border-slate-700 px-4 py-2">
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
            <Button
              variant="outline"
              onClick={() => setIsPrayerBreak(!isPrayerBreak)}
              className={cn(
                "transition-colors",
                isPrayerBreak && "bg-orange-100 text-orange-700 hover:bg-orange-200"
              )}
            >
              {isPrayerBreak ? "استئناف الاختبار" : "توقف للصلاة"}
            </Button>
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
    if (!selectedExam || questions.length === 0) return null;

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
                <div className="font-bold">
                {stats.timeTaken} دقيقة
              </div>
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
              <div className="border border-slate-700 rounded-lg overflow-hidden bg-slate-900/90">
                <table className="w-full">
                  <thead className="bg-slate-800">
                    <tr>
                      <th className="px-4 py-2 text-right text-slate-100">القسم</th>
                      <th className="px-4 py-2 text-right text-slate-100">النوع</th>
                      <th className="px-4 py-2 text-right text-slate-100">النتيجة</th>
                      <th className="px-4 py-2 text-right text-slate-100">النسبة</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-200">
                    {selectedExam.sections.map((section, index) => {
                      const sectionScore = sectionScores[section.sectionNumber] || 0;
                      const sectionPercentage = (sectionScore / section.questionCount) * 100;

                      return (
                        <tr key={section.sectionNumber} className={index % 2 === 0 ? "bg-slate-900" : "bg-slate-800/50"}>
                          <td className="border-t border-slate-700 px-4 py-2">{section.name}</td>
                          <td className="border-t border-slate-700 px-4 py-2">
                            {section.category === "verbal" ? "لفظي" : 
                             section.category === "quantitative" ? "كمي" : 
                             "مختلط (لفظي وكمي)"}
                          </td>
                          <td className="border-t border-slate-700 px-4 py-2">{sectionScore}/{section.questionCount}</td>
                          <td className="border-t border-slate-700 px-4 py-2">{sectionPercentage.toFixed(1)}%</td>
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

              <div className="flex gap-2">
                <Button 
                  onClick={() => {
                    const examName = selectedExam?.name || "اختبار قياس";
                    const withAnswers = true;

                    // Create a new window/tab for the results
                    const resultsWindow = window.open('', '_blank');
                    if (!resultsWindow) {
                      toast({
                        title: "خطأ",
                        description: "فشل في فتح نافذة النتائج. يرجى السماح بالنوافذ المنبثقة.",
                        variant: "destructive",
                      });
                      return;
                    }

                    const content = `
                      <!DOCTYPE html>
                      <html dir="rtl" lang="ar">
                      <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <head>
                          <style>
                            @import url('https://fonts.googleapis.com/css2?family=Noto+Kufi+Arabic:wght@400;700&display=swap');

                            body { 
                              font-family: 'Noto Kufi Arabic', Arial, sans-serif; 
                              padding: 40px;
                              background: linear-gradient(135deg, #f8fafc 25%, transparent 25%) -50px 0,
                                        linear-gradient(225deg, #f8fafc 25%, transparent 25%) -50px 0,
                                        linear-gradient(315deg, #f8fafc 25%, transparent 25%),
                                        linear-gradient(45deg, #f8fafc 25%, transparent 25%);
                              background-size: 100px 100px;
                              background-color: #ffffff;
                            }

                            .header { 
                              text-align: center; 
                              margin-bottom: 40px;
                              position: relative;
                              padding: 30px;
                              border-radius: 20px;
                              background: #fff;
                              box-shadow: 0 8px 16px -4px rgba(0,0,0,0.1);
                              border: 2px solid #4f46e5;
                            }

                            .logo {
                              font-size: 32px;
                              font-weight: bold;
                              color: #4f46e5;
                              margin-bottom: 15px;
                              text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
                              position: relative;
                              display: inline-block;
                            }

                            .logo::after {
                              content: "";
                              position: absolute;
                              bottom: -5px;
                              left: 0;
                              right: 0;
                              height: 3px;
                              background: linear-gradient(90deg, #4f46e5, #06b6d4);
                              border-radius: 3px;
                            }

                            .watermark { 
                              position: fixed;
                              bottom: 40px;
                              left: 50%;
                              transform: translateX(-50%) rotate(-45deg);
                              text-align: center;
                              color: rgba(79, 70, 229, 0.06);
                              font-size: 60px;
                              font-weight: bold;
                              pointer-events: none;
                              white-space: nowrap;
                              z-index: -1;
                            }

                            .section { 
                              margin: 40px 0;
                              padding: 25px;
                              background: #fff;
                              border-radius: 20px;
                              box-shadow: 0 4px 12px -2px rgba(0,0,0,0.08);
                              position: relative;
                              overflow: hidden;
                              border: 1px solid #e5e7eb;
                            }

                            .section::before {
                              content: "";
                              position: absolute;
                              top: 0;
                              left: 0;
                              right: 0;
                              height: 5px;
                              background: linear-gradient(90deg, #4f46e5, #06b6d4);
                            }

                            .section h2 {
                              color: #4f46e5;
                              border-bottom: 2px solid #e5e7eb;
                              padding-bottom: 15px;
                              margin-bottom: 25px;
                              font-size: 1.5em;
                            }

                            .question { 
                              margin: 30px 0;
                              padding: 25px;
                              border: 1px solid #e5e7eb;
                              border-radius: 15px;
                              background: #fafafa;
                              position: relative;
                              transition: all 0.3s ease;
                            }

                            .question:hover {
                              box-shadow: 0 4px 12px -2px rgba(0,0,0,0.05);
                              transform: translateY(-2px);
                            }

                            .question h3 {
                              color: #1f2937;
                              margin-bottom: 20px;
                              font-weight: bold;
                              font-size: 1.2em;
                              display: flex;
                              align-items: center;
                              gap: 10px;
                            }

                            .question h3::before {
                              content: "◈";
                              color: #4f46e5;
                            }

                            .options { 
                              margin: 20px 30px;
                            }

                            .options p {
                              padding: 12px 20px;
                              margin: 10px 0;
                              border-radius: 10px;
                              background: #fff;
                              border: 1px solid #e5e7eb;
                              transition: all 0.2s ease;
                              position: relative;
                            }

                            .options p:hover {
                              background: #f8fafc;
                            }

                            .correct { 
                              color: #059669 !important;
                              font-weight: bold;
                              background: #ecfdf5 !important;
                              border-color: #059669 !important;
                              position: relative;
                            }

                            .correct::before {
                              content: "✓";
                              position: absolute;
                              right: 10px;
                              color: #059669;
                            }
                            .wrong {
                              color: #dc2626 !important;
                              font-weight: bold;
                              background: #fee2e2 !important;
                              border-color: #dc2626 !important;
                              position: relative;
                            }

                            .wrong::before {
                              content: "✗";
                              position: absolute;
                              right: 10px;
                              color: #dc2626;
                            }

                            .explanation {
                              margin-top: 15px;
                              padding: 15px;
                              background: #fef0d7;
                              border-radius: 10px;
                              border: 1px solid #fcd34d;
                              color: #374151;
                            }

                            .note {
                              font-style: italic;
                              color: #9a3412;
                            }

                            .page-break {
                              page-break-after: always;
                            }

                            @media print {
                              .watermark {
                                position: fixed;
                                top: 50%;
                                left: 50%;
                                transform: translate(-50%, -50%) rotate(-45deg);
                              }
                            }
                          </style>
                        </head>
                        <body>
                          <div class="watermark">قدراتك - QODRATAK - قدراتك - QODRATAK</div>
                          <div class="header">
                            <div class="logo">قدراتك</div>
                            <h1>${examName}</h1>
                            <div style="color: #6b7280; margin-top: 15px; font-size: 1.1em;">
                              <a href="https://www.qodratak.space" target="_blank" rel="noopener noreferrer" style="color: #4f46e5; text-decoration: underline; transition: all 0.2s;">www.qodratak.space</a>
                            </div>
                            <div style="margin-top: 20px; font-size: 1em; color: #4b5563;">
                              تاريخ الاختبار: ${new Date().toLocaleDateString('ar-SA')}
                            </div>
                          </div>
                          <style>
                            * {
                              user-select: none !important;
                              -webkit-user-select: none !important;
                              -moz-user-select: none !important;
                              -ms-user-select: none !important;
                            }
                            body {
                              background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
                              background-size: 200% 200%;
                              animation: gradientBG 15s ease infinite;
                            }
                            @keyframes gradientBG {
                              0% { background-position: 0% 50% }
                              50% { background-position: 100% 50% }
                              100% { background-position: 0% 50% }
                            }
                            .watermark {
                              opacity: 0.08;
                              transform: rotate(-45deg) scale(1.5);
                            }
                          </style>
                          ${Object.entries(allSectionsQuestions).map(([sectionNum, questions]) => {
                            const sectionName = selectedExam?.sections[parseInt(sectionNum) - 1]?.name || `القسم ${sectionNum}`;
                            return `
                              <div class="section">
                                <h2>${sectionName}</h2>
                                ${questions.map((q, idx) => `
                            <div class="question">
                              <h3>السؤال ${idx + 1}</h3>
                              <p>${q.text}</p>
                              <div class="options">
                                ${q.options.map((opt, i) => `
                                  <p class="${
                                    withAnswers ? (
                                      i === answers[q.id] && i === q.correctOptionIndex ? 'correct' :
                                      i === answers[q.id] ? 'wrong' :
                                      i === q.correctOptionIndex ? 'correct' : ''
                                    ) : 'normal'
                                  }">${i + 1}. ${opt}${
                                    withAnswers && i === answers[q.id] ? ' (إجابتك)' : 
                                    withAnswers && i === q.correctOptionIndex ? ' (الإجابة الصحيحة)' : ''
                                  }</p>
                                `).join('')}
                              </div>
                              ${withAnswers && answers[q.id] !== q.correctOptionIndex ? `
                                <div class="explanation">
                                  <p class="note">ملاحظة: إجابتك غير صحيحة</p>
                                </div>
                              ` : ''}
                            </div>
                          `).join('')}
                              </div>
                            `;
                          }).join('')}
                          <div style="text-align: center; margin-top: 40px; color: #6b7280; font-size: 0.9em;">
                            © ${new Date().getFullYear()} قدراتك - جميع الحقوق محفوظة
                          </div>
                        </body>
                      </html>
                    `;

                    // Write content directly to the new window
                    resultsWindow.document.write(content);
                    resultsWindow.document.close();

                    toast({
                      title: "تم تحميل الأسئلة مع الإجابات",
                      description: "يمكنك فتح الملف في المتصفح لطباعته أو تحويله إلى PDF",
                    });
                  }}
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  تحميل الاسئلة مع اجاباتي
                </Button>

                <Button 
                  variant="outline"
                  onClick={() => {
                    const examName = selectedExam?.name || "اختبار قياس";
                    const withAnswers = true; // Changed to true to show correct answers
                    const withUserAnswers = false; // New flag to control showing user answers
                    const content = `
                      <html dir="rtl">
                        <head>
                          <style>
                            @import url('https://fonts.googleapis.com/css2?family=Noto+Kufi+Arabic:wght@400;700&display=swap');

                            body { 
                              font-family: 'Noto Kufi Arabic', Arial, sans-serif; 
                              padding: 40px;
                              background: linear-gradient(135deg, #f8fafc 25%, transparent 25%) -50px 0,
                                        linear-gradient(225deg, #f8fafc 25%, transparent 25%) -50px 0,
                                        linear-gradient(315deg, #f8fafc 25%, transparent 25%),
                                        linear-gradient(45deg, #f8fafc 25%, transparent 25%);
                              background-size: 100px 100px;
                              background-color: #ffffff;
                            }

                            .header { 
                              text-align: center; 
                              margin-bottom: 40px;
                              position: relative;
                              padding: 30px;
                              border-radius: 20px;
                              background: #fff;
                              box-shadow: 0 8px 16px -4px rgba(0,0,0,0.1);
                              border: 2px solid #4f46e5;
                            }

                            .logo {
                              font-size: 32px;
                              font-weight: bold;
                              color: #4f46e5;
                              margin-bottom: 15px;
                              text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
                              position: relative;
                              display: inline-block;
                            }

                            .logo::after {
                              content: "";
                              position: absolute;
                              bottom: -5px;
                              left: 0;
                              right: 0;
                              height: 3px;
                              background: linear-gradient(90deg, #4f46e5, #06b6d4);
                              border-radius: 3px;
                            }

                            .watermark { 
                              position: fixed;
                              bottom: 40px;
                              left: 50%;
                              transform: translateX(-50%) rotate(-45deg);
                              text-align: center;
                              color: rgba(79, 70, 229, 0.06);
                              font-size: 60px;
                              font-weight: bold;
                              pointer-events: none;
                              white-space: nowrap;
                              z-index: -1;
                            }

                            .section { 
                              margin: 40px 0;
                              padding: 25px;
                              background: #fff;
                              border-radius: 20px;
                              box-shadow: 0 4px 12px -2px rgba(0,0,0,0.08);
                              position: relative;
                              overflow: hidden;
                              border: 1px solid #e5e7eb;
                            }

                            .section::before {
                              content: "";
                              position: absolute;
                              top: 0;
                              left: 0;
                              right: 0;
                              height: 5px;
                              background: linear-gradient(90deg, #4f46e5, #06b6d4);
                            }

                            .section h2 {
                              color: #4f46e5;
                              border-bottom: 2px solid #e5e7eb;
                              padding-bottom: 15px;
                              margin-bottom: 25px;
                              font-size: 1.5em;
                            }

                            .question { 
                              margin: 30px 0;
                              padding: 25px;
                              border: 1px solid #e5e7eb;
                              border-radius: 15px;
                              background: #fafafa;
                              position: relative;
                              transition: all 0.3s ease;
                            }

                            .question:hover {
                              box-shadow: 0 4px 12px -2px rgba(0,0,0,0.05);
                              transform: translateY(-2px);
                            }

                            .question h3 {
                              color: #1f2937;
                              margin-bottom: 20px;
                              font-weight: bold;
                              font-size: 1.2em;
                              display: flex;
                              align-items: center;
                              gap: 10px;
                            }

                            .question h3::before {
                              content: "◈";
                              color: #4f46e5;
                            }

                            .options { 
                              margin: 20px 30px;
                            }

                            .options p {
                              padding: 12px 20px;
                              margin: 10px 0;
                              border-radius: 10px;
                              background: #fff;
                              border: 1px solid #e5e7eb;
                              transition: all 0.2s ease;
                              position: relative;
                            }

                            .options p:hover {
                              background: #f8fafc;
                            }

                            .page-break {
                              page-break-after: always;
                            }

                            @media print {
                              .watermark {
                                position: fixed;
                                top: 50%;
                                left: 50%;
                                transform: translate(-50%, -50%) rotate(-45deg);
                              }
                            }
                          </style>
                        </head>
                        <body>
                          <div class="watermark">قدراتك - QODRATAK - قدراتك - QODRATAK</div>
                          <div class="header">
                            <div class="logo">قدراتك</div>
                            <h1>${examName}</h1>
                            <div style="color: #6b7280; margin-top: 15px; font-size: 1.1em;">
                              <a href="https://www.qodratak.space" target="_blank" rel="noopener noreferrer" style="color: #4f46e5; text-decoration: underline; transition: all 0.2s;">www.qodratak.space</a>
                            </div>
                            <div style="margin-top: 20px; font-size: 1em; color: #4b5563;">
                              تاريخ الاختبار: ${new Date().toLocaleDateString('ar-SA')}
                            </div>
                          </div>
                          <style>
                            * {
                              user-select: none !important;
                              -webkit-user-select: none !important;
                              -moz-user-select: none !important;
                            }
                            body {
                              background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
                              background-size: 200% 200%;
                              animation: gradientBG 15s ease infinite;
                            }
                            @keyframes gradientBG {
                              0% { background-position: 0% 50% }
                              50% { background-position: 100% 50% }
                              100% { background-position: 0% 50% }
                            }
                            .watermark {
                              opacity: 0.08;
                              transform: rotate(-45deg) scale(1.5);
                            }
                          </style>
                          ${Object.entries(allSectionsQuestions).map(([sectionNum, questions]) => {
                            const sectionName = selectedExam?.sections[parseInt(sectionNum) - 1]?.name || `القسم ${sectionNum}`;
                            return `
                              <div class="section">
                                <h2>${sectionName}</h2>
                                ${questions.map((q, idx) => `
                                  <div class="question">
                                    <h3>السؤال ${idx + 1}</h3>
                                    <p>${q.text}</p>
                                    <div class="options">
                                      ${q.options.map((opt, i) => `
                                        <p>${i + 1}. ${opt}</p>
                                      `).join('')}
                                    </div>
                                  </div>
                                `).join('')}
                              </div>
                            `;
                          }).join('')}
                          <div style="text-align: center; margin-top: 40px; color: #6b7280; font-size: 0.9em;">
                            © ${new Date().getFullYear()} قدراتك - جميع الحقوق محفوظة
                          </div>
                        </body>
                      </html>
                    `;

                    const blob = new Blob([content], { type: 'text/html;charset=utf-8' });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${examName}_بدون_إجابات.html`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    window.URL.revokeObjectURL(url);

                    toast({
                      title: "تم تحميل الأسئلة",
                      description: "يمكنك فتح الملف في المتصفح لطباعته أو تحويله إلى PDF",
                    });
                  }}
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  تحميل الاسئلة
                </Button>
              </div>

          </CardFooter>
        </Card>

        {/* Questions Review */}
      {(!selectedExam?.hideQuestionReview) && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>مراجعة الأسئلة والإجابات</CardTitle>
            <CardDescription>
              راجع إجاباتك وتعلم من أخطائك
            </CardDescription>
          </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="w-full mb-4">
              <TabsTrigger value="all">جميع الأسئلة</TabsTrigger>
              <TabsTrigger value="correct">الإجابات الصحيحة</TabsTrigger>
              <TabsTrigger value="incorrect">الإجابات الخاطئة</TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              <div className="space-y-4">
                {Object.entries(allSectionsQuestions).flatMap(([sectionNum, sectionQuestions]) => 
              sectionQuestions.map((question, index) => {
                const isCorrect = answers[question.id] === question.correctOptionIndex;
                const sectionName = selectedExam?.sections[parseInt(sectionNum) - 1]?.name || `القسم ${sectionNum}`;

                  return (
                    <div key={question.id} className={cn(
                      "p-4 rounded-lg border",
                      isCorrect ? "bg-green-50 dark:bg-green-900/20 border-green-200" : "bg-red-50 dark:bg-red-900/20 border-red-200"
                    )}>
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center text-white",
                          isCorrect ? "bg-green-500" : "bg-red-500"
                        )}>
                          {isCorrect ? "✓" : "✗"}
                        </div>
                        <div>
                          <h4 className="font-medium mb-2">{sectionName} - سؤال {index + 1}</h4>
                          <p className="text-gray-800 dark:text-gray-200 mb-4">{question.text}</p>

                          <div className="space-y-2">
                            {question.options.map((option, optIndex) => (
                              <div key={optIndex} className={cn(
                                "p-3 rounded-lg border",
                                optIndex === question.correctOptionIndex ? "bg-green-50 dark:bg-green-900/20 border-green-200" :
                                optIndex === answers[question.id] ? "bg-red-50 dark:bg-red-900/20 border-red-200" :
                                "bg-gray-50 dark:bg-gray-800"
                              )}>
                                <div className="flex items-center">
                                  <span className="mr-2">{option}</span>
                                  {optIndex === question.correctOptionIndex && (
                                    <span className="text-green-600 dark:text-green-400 text-sm mr-auto">
                                      (الإجابة الصحيحة)
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>



                          <div className="mt-4 flex justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-muted-foreground"
                              onClick={() => {
                                const message = encodeURIComponent(
                                  `تبليغ عن خطأ في السؤال:\n\nنص السؤال: ${question.text}\n\nالخيارات:\n${question.options.map((opt, i) => `${i + 1}. ${opt}`).join('\n')}\n\nالإجابة الصحيحة: ${question.correctOptionIndex + 1}`
                                );
                                window.open(`https://t.me/qodratak2030?text=${message}`, '_blank');
                              }}
                            >
                              <span className="ml-2">إبلاغ عن خطأ</span>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }))}
              </div>
            </TabsContent>

            <TabsContent value="correct">
              <div className="space-y-4">
                {Object.entries(allSectionsQuestions).flatMap(([sectionNum, sectionQuestions]) => 
              sectionQuestions.filter(q => answers[q.id] === q.correctOptionIndex).map((question, index) => {
                  const isCorrect = answers[question.id] === question.correctOptionIndex;
                  const sectionName = selectedExam?.sections[parseInt(sectionNum) - 1]?.name || `القسم ${sectionNum}`;
                   return (
                    <div key={question.id} className={cn(
                      "p-4 rounded-lg border",
                      isCorrect ? "bg-green-50 dark:bg-green-900/20 border-green-200" : "bg-red-50 dark:bg-red-900/20 border-red-200"
                    )}>
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center text-white",
                          isCorrect ? "bg-green-500" : "bg-red-500"
                        )}>
                          {isCorrect ? "✓" : "✗"}
                        </div>
                        <div>
                          <h4 className="font-medium mb-2">{sectionName} - سؤال {index + 1}</h4>
                          <p className="text-gray-800 dark:text-gray-200 mb-4">{question.text}</p>

                          <div className="space-y-2">
                            {question.options.map((option, optIndex) => (
                              <div key={optIndex} className={cn(
                                "p-3 rounded-lg border",
                                optIndex === question.correctOptionIndex ? "bg-green-50 dark:bg-green-900/20 border-green-200" :
                                optIndex === answers[question.id] ? "bg-red-50 dark:bg-red-900/20 border-red-200" :
                                "bg-gray-50 dark:bg-gray-800"
                              )}>
                                <div className="flex items-center">
                                  <span className="mr-2">{option}</span>
                                  {optIndex === question.correctOptionIndex && (
                                    <span className="text-green-600 dark:text-green-400 text-sm mr-auto">
                                      (الإجابة الصحيحة)
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>



                          <div className="mt-4 flex justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-muted-foreground"
                              onClick={() => {
                                const message = encodeURIComponent(
                                  `تبليغ عن خطأ في السؤال:\n\nنص السؤال: ${question.text}\n\nالخيارات:\n${question.options.map((opt, i) => `${i + 1}. ${opt}`).join('\n')}\n\nالإجابة الصحيحة: ${question.correctOptionIndex + 1}`
                                );
                                window.open(`https://t.me/qodratak2030?text=${message}`, '_blank');
                              }}
                            >
                              <span className="ml-2">إبلاغ عن خطأ</span>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }))}
              </div>
            </TabsContent>

            <TabsContent value="incorrect">
              <div className="space-y-4">
                {Object.entries(allSectionsQuestions).flatMap(([sectionNum, sectionQuestions]) => 
              sectionQuestions.filter(q => answers[q.id] !== q.correctOptionIndex).map((question, index) => {
                  const isCorrect = answers[question.id] === question.correctOptionIndex;
                  const sectionName = selectedExam?.sections[parseInt(sectionNum) - 1]?.name || `القسم ${sectionNum}`;
                   return (
                    <div key={question.id} className={cn(
                      "p-4 rounded-lg border",
                      isCorrect ? "bg-green-50 dark:bg-green-900/20 border-green-200" : "bg-red-50 dark:bg-red-900/20 border-red-200"
                    )}>
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center textwhite",
                          isCorrect ? "bg-green-500" : "bg-red-500"
                        )}>
                          {isCorrect ? "✓" : "✗"}
                        </div>
                        <div>
                          <h4 className="font-medium mb-2">{sectionName} - سؤال {index + 1}</h4>
                          <p className="text-gray-800 dark:text-gray-200 mb-4">{question.text}</p>

                          <div className="space-y-2">
                            {question.options.map((option, optIndex) => (
                              <div key={optIndex} className={cn(
                                "p-3 rounded-lg border",
                                optIndex === question.correctOptionIndex ? "bg-green-50 dark:bg-green-900/20 border-green-200" :
                                optIndex === answers[question.id] ? "bg-red-50 dark:bg-red-900/20 border-red-200" :
                                "bg-gray-50 dark:bg-gray-800"
                              )}>
                                <div className="flex items-center">
                                  <span className="mr-2">{option}</span>
                                  {optIndex === question.correctOptionIndex && (
                                    <span className="text-green-600 dark:text-green-400 text-sm mr-auto">
                                      (الإجابة الصحيحة)
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>


                          <div className="mt-4 flex justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-muted-foreground"
                              onClick={() => {
                                const message = encodeURIComponent(
                                  `تبليغ عن خطأ في السؤال:\n\nنص السؤال: ${question.text}\n\nالخيارات:\n${question.options.map((opt, i) => `${i + 1}. ${opt}`).join('\n')}\n\nالإجابة الصحيحة: ${question.correctOptionIndex + 1}`
                                );
                                window.open(`https://t.me/qodratak2030?text=${message}`, '_blank');
                              }}
                            >
                              <span className="ml-2">إبلاغ عن خطأ</span>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      )}

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

                <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-lg text-slate-100">
                  <h4 className="font-medium mb-2">التوصيات</h4>
                  <p className="text-sm mb-2 text-slate-200">
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

  const isSubscribed = true; // Replace with actual subscription check

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