import React, { useState, useEffect } from 'react';
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
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Timer, BookOpen, Calculator, CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";

interface MockExam {
  id: string;
  name: string;
  totalTime: number;
  totalQuestions: number;
  sections: ExamSection[];
}

interface ExamSection {
  id: number;
  name: string;
  timeLimit: number;
  questions: Question[];
  type: 'verbal' | 'quantitative' | 'mixed';
}

interface Question {
  id: number;
  text: string;
  options: string[];
  correctAnswer: number;
  userAnswer?: number;
  type: 'verbal' | 'quantitative';
}

const mockExams: MockExam[] = [
  {
    id: 'verbal-65',
    name: 'اختبار قدرات لفظي محاكي',
    totalTime: 65,
    totalQuestions: 65,
    sections: [
      {
        id: 1,
        name: 'القسم اللفظي',
        timeLimit: 65,
        type: 'verbal',
        questions: []
      }
    ]
  },
  {
    id: 'quantitative-55',
    name: 'اختبار قدرات كمي محاكي',
    totalTime: 55,
    totalQuestions: 55,
    sections: [
      {
        id: 1,
        name: 'القسم الكمي',
        timeLimit: 55,
        type: 'quantitative',
        questions: []
      }
    ]
  },
  {
    id: 'full-mock',
    name: 'اختبار قدرات شامل محاكي',
    totalTime: 120,
    totalQuestions: 120,
    sections: [
      {
        id: 1,
        name: 'القسم الأول - مختلط',
        timeLimit: 24,
        type: 'mixed',
        questions: []
      },
      {
        id: 2,
        name: 'القسم الثاني - مختلط',
        timeLimit: 24,
        type: 'mixed',
        questions: []
      },
      {
        id: 3,
        name: 'القسم الثالث - مختلط',
        timeLimit: 24,
        type: 'mixed',
        questions: []
      },
      {
        id: 4,
        name: 'القسم الرابع - كمي',
        timeLimit: 11,
        type: 'quantitative',
        questions: []
      },
      {
        id: 5,
        name: 'القسم الخامس - لفظي',
        timeLimit: 13,
        type: 'verbal',
        questions: []
      },
      {
        id: 6,
        name: 'القسم السادس - كمي',
        timeLimit: 11,
        type: 'quantitative',
        questions: []
      },
      {
        id: 7,
        name: 'القسم السابع - لفظي',
        timeLimit: 13,
        type: 'verbal',
        questions: []
      }
    ]
  }
];

const QiyasExamPage = () => {
  const { toast } = useToast();
  const [selectedExam, setSelectedExam] = useState<MockExam | null>(null);
  const [currentView, setCurrentView] = useState<'selection' | 'exam' | 'review'>('selection');
  const [currentSection, setCurrentSection] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [answers, setAnswers] = useState<{[key: string]: number}>({});
  const [showSectionComplete, setShowSectionComplete] = useState(false);
  const [examStartTime, setExamStartTime] = useState<Date | null>(null);
  const [examEndTime, setExamEndTime] = useState<Date | null>(null);

  useEffect(() => {
    if (currentView === 'exam' && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(time => time - 1);
      }, 1000);

      return () => clearInterval(timer);
    } else if (timeLeft === 0 && currentView === 'exam') {
      completeSectionAuto();
    }
  }, [timeLeft, currentView]);

  const startExam = async (exam: MockExam) => {
    setSelectedExam(exam);
    setCurrentSection(0);
    setCurrentQuestion(0);
    setAnswers({});
    setTimeLeft(exam.sections[0].timeLimit * 60);
    setExamStartTime(new Date());
    setCurrentView('exam');

    try {
      // Load questions for the first section
      await loadSectionQuestions(exam.sections[0]);
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في تحميل الأسئلة",
        variant: "destructive"
      });
    }
  };

  const loadSectionQuestions = async (section: ExamSection) => {
    // Implement question loading logic here
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const selectAnswer = (questionId: number, answerIndex: number) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answerIndex
    }));
  };

  const completeSection = () => {
    setShowSectionComplete(true);
  };

  const completeSectionAuto = () => {
    if (!selectedExam) return;

    if (currentSection < selectedExam.sections.length - 1) {
      setCurrentSection(prev => prev + 1);
      setCurrentQuestion(0);
      setTimeLeft(selectedExam.sections[currentSection + 1].timeLimit * 60);
      setShowSectionComplete(false);
    } else {
      finishExam();
    }
  };

  const moveToNextSection = () => {
    if (!selectedExam) return;

    if (currentSection < selectedExam.sections.length - 1) {
      setCurrentSection(prev => prev + 1);
      setCurrentQuestion(0);
      setTimeLeft(selectedExam.sections[currentSection + 1].timeLimit * 60);
      setShowSectionComplete(false);
    } else {
      finishExam();
    }
  };

  const finishExam = () => {
    setExamEndTime(new Date());
    setCurrentView('review');
  };

  const renderExamSelection = () => (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">الاختبارات المحاكية</h1>
      <div className="grid md:grid-cols-3 gap-6">
        {mockExams.map(exam => (
          <Card key={exam.id} className="overflow-hidden">
            <CardHeader>
              <CardTitle>{exam.name}</CardTitle>
              <CardDescription>
                اختبار محاكي للاختبار الرسمي
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>عدد الأسئلة:</span>
                  <Badge>{exam.totalQuestions} سؤال</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>الوقت الكلي:</span>
                  <Badge variant="outline">{exam.totalTime} دقيقة</Badge>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" onClick={() => startExam(exam)}>
                ابدأ الاختبار
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderExam = () => {
    if (!selectedExam) return null;

    const currentSectionData = selectedExam.sections[currentSection];
    const question = currentSectionData.questions[currentQuestion];

    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold">{currentSectionData.name}</h2>
            <p className="text-sm text-muted-foreground">
              السؤال {currentQuestion + 1} من {currentSectionData.questions.length}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant={timeLeft < 60 ? "destructive" : "outline"}>
              <Timer className="w-4 h-4 mr-1" />
              {formatTime(timeLeft)}
            </Badge>
          </div>
        </div>

        <Progress
          value={(currentQuestion + 1) / currentSectionData.questions.length * 100}
          className="mb-6"
        />

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{question.text}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {question.options.map((option, index) => (
                <Button
                  key={index}
                  variant={answers[question.id] === index ? "default" : "outline"}
                  className="w-full text-right justify-start"
                  onClick={() => selectAnswer(question.id, index)}
                >
                  {option}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentQuestion(q => q > 0 ? q - 1 : q)}
            disabled={currentQuestion === 0}
          >
            <ChevronRight className="w-4 h-4 ml-2" />
            السؤال السابق
          </Button>

          {currentQuestion === currentSectionData.questions.length - 1 ? (
            <Button onClick={completeSection}>
              إنهاء القسم
              <ChevronLeft className="w-4 h-4 mr-2" />
            </Button>
          ) : (
            <Button
              onClick={() => setCurrentQuestion(q => q + 1)}
              disabled={currentQuestion === currentSectionData.questions.length - 1}
            >
              السؤال التالي
              <ChevronLeft className="w-4 h-4 mr-2" />
            </Button>
          )}
        </div>

        <Dialog open={showSectionComplete} onOpenChange={setShowSectionComplete}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>مراجعة القسم</DialogTitle>
              <DialogDescription>
                راجع إجاباتك قبل الانتقال للقسم التالي
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="grid grid-cols-5 gap-2">
                {currentSectionData.questions.map((q, i) => (
                  <Button
                    key={i}
                    variant={answers[q.id] !== undefined ? "default" : "outline"}
                    className="w-full"
                    onClick={() => setCurrentQuestion(i)}
                  >
                    {i + 1}
                  </Button>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button onClick={moveToNextSection}>
                {currentSection === selectedExam.sections.length - 1 ? 
                  "إنهاء الاختبار" : "الانتقال للقسم التالي"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  };

  const renderResults = () => {
    if (!selectedExam) return null;

    const calculateSectionScore = (section: ExamSection) => {
      let correct = 0;
      section.questions.forEach(q => {
        if (answers[q.id] === q.correctAnswer) correct++;
      });
      return correct;
    };

    const totalScore = selectedExam.sections.reduce((acc, section) => 
      acc + calculateSectionScore(section), 0);

    return (
      <div className="container mx-auto p-6">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>نتيجة الاختبار</CardTitle>
            <CardDescription>
              {selectedExam.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center mb-6">
              <div className="text-4xl font-bold mb-2">
                {((totalScore / selectedExam.totalQuestions) * 100).toFixed(1)}%
              </div>
              <p className="text-muted-foreground">
                {totalScore} من {selectedExam.totalQuestions} إجابة صحيحة
              </p>
            </div>

            <div className="space-y-6">
              {selectedExam.sections.map((section, index) => {
                const sectionScore = calculateSectionScore(section);
                return (
                  <div key={index} className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-2">{section.name}</h3>
                    <div className="flex justify-between items-center mb-2">
                      <span>النتيجة:</span>
                      <Badge>
                        {sectionScore} من {section.questions.length}
                      </Badge>
                    </div>
                    <Progress 
                      value={(sectionScore / section.questions.length) * 100}
                      className="h-2"
                    />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>مراجعة الأسئلة</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all">
              <TabsList className="w-full">
                <TabsTrigger value="all">جميع الأسئلة</TabsTrigger>
                <TabsTrigger value="correct">الإجابات الصحيحة</TabsTrigger>
                <TabsTrigger value="incorrect">الإجابات الخاطئة</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="mt-4">
                {selectedExam.sections.map((section, sectionIndex) => (
                  <div key={sectionIndex} className="mb-6">
                    <h3 className="font-semibold mb-4">{section.name}</h3>
                    <div className="space-y-4">
                      {section.questions.map((question, questionIndex) => (
                        <Card key={questionIndex}>
                          <CardContent className="pt-6">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-medium">
                                سؤال {questionIndex + 1}
                              </span>
                              <Badge variant={
                                answers[question.id] === question.correctAnswer 
                                  ? "success" 
                                  : "destructive"
                              }>
                                {answers[question.id] === question.correctAnswer 
                                  ? "إجابة صحيحة" 
                                  : "إجابة خاطئة"}
                              </Badge>
                            </div>
                            <p className="mb-4">{question.text}</p>
                            <div className="space-y-2">
                              {question.options.map((option, optionIndex) => (
                                <div
                                  key={optionIndex}
                                  className={cn(
                                    "p-3 rounded-lg border",
                                    optionIndex === question.correctAnswer && "bg-green-50 border-green-200",
                                    optionIndex === answers[question.id] && optionIndex !== question.correctAnswer && "bg-red-50 border-red-200"
                                  )}
                                >
                                  {option}
                                  {optionIndex === question.correctAnswer && (
                                    <span className="text-green-600 mr-2">(الإجابة الصحيحة)</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="mt-6 flex justify-center">
          <Button
            variant="outline"
            onClick={() => setCurrentView('selection')}
          >
            العودة للاختبارات
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div>
      {currentView === 'selection' && renderExamSelection()}
      {currentView === 'exam' && renderExam()}
      {currentView === 'review' && renderResults()}
    </div>
  );
};

export default QiyasExamPage;