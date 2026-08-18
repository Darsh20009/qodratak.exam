import { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Timer, CheckCircle2, AlertCircle, BarChart3 } from 'lucide-react';

interface Question {
  id: number;
  category: string;
  text: string;
  options: string[];
  correctOptionIndex: number;
}

interface PaperExam {
  id: number;
  title: string;
  totalQuestions: number;
  trialQuestions: number;
  examType: string;
  timeLimit: number;
  status: string;
}

interface QuestionDetail {
  questionNumber: number;
  questionId: number;
  category: string;
  status: 'correct' | 'wrong' | 'skipped';
  userAnswer: number | null;
  correctAnswer: number;
}

interface ExamResult {
  totalScore: number;
  verbalScore?: number;
  quantitativeScore?: number;
  totalPercentage: number;
  verbalPercentage?: number;
  quantitativePercentage?: number;
  correctAnswers: number;
  wrongAnswers: number;
  skippedQuestions: number;
  questionDetails?: QuestionDetail[];
}

interface AnswerInputStepProps {
  exam: PaperExam;
  onSubmit: (result: ExamResult) => void;
}

export default function AnswerInputStep({ exam, onSubmit }: AnswerInputStepProps) {
  const { toast } = useToast();
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [timeRemaining, setTimeRemaining] = useState(exam.timeLimit * 60);
  const [timerActive, setTimerActive] = useState(true);
  const [startTime] = useState(Date.now()); // Track start time for timeTaken calculation

  const { data: questions = [], isLoading } = useQuery({
    queryKey: ['/api/paper-exams', exam.id, 'questions'],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/paper-exams/${exam.id}/questions?count=${exam.totalQuestions}`);
      return await response.json();
    },
    enabled: !!exam.id,
  });

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerActive && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            setTimerActive(false);
            toast({
              title: 'انتهى الوقت!',
              description: 'تم انتهاء الوقت المخصص للاختبار',
              variant: 'destructive',
            });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerActive, timeRemaining, toast]);

  const submitAnswersMutation = useMutation({
    mutationFn: async (data: { examId: number; answers: Record<number, number>; timeTaken: number }) => {
      const response = await apiRequest('POST', `/api/paper-exams/${data.examId}/submit`, {
        answers: data.answers,
        timeTaken: data.timeTaken,
      });
      return await response.json();
    },
    onSuccess: (result: ExamResult) => {
      onSubmit(result);
      toast({
        title: 'تم تصحيح الاختبار',
        description: `درجتك: ${result.totalPercentage}%`,
      });
    },
    onError: () => {
      toast({
        title: 'خطأ',
        description: 'فشل تصحيح الاختبار',
        variant: 'destructive',
      });
    },
  });

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerChange = (questionId: number, value: string) => {
    const answerIndex = parseInt(value);
    console.log(`إجابة السؤال ${questionId}: ${answerIndex}`);
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: answerIndex
    }));
  };

  const handleSubmit = () => {
    const answeredQuestions = Object.keys(userAnswers).length;

    if (answeredQuestions === 0) {
      toast({
        title: 'تنبيه',
        description: 'لم تقم بالإجابة على أي سؤال',
        variant: 'destructive',
      });
      return;
    }

    const timeTaken = exam.timeLimit * 60 - timeRemaining;
    submitAnswersMutation.mutate({
      examId: exam.id,
      answers: userAnswers,
      timeTaken,
    });
    setTimerActive(false);
  };

  const answeredCount = Object.keys(userAnswers).length;
  const progress = (answeredCount / exam.totalQuestions) * 100;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12">
          <p className="text-center text-muted-foreground">جاري تحميل الأسئلة...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 relative">
      {/* حاسبة الوقت - تصميم بسيط ومركز */}
      <Card className="relative z-10 border-2 border-green-600 shadow-2xl">
        <CardContent className="py-8">
          <div className="flex flex-col items-center gap-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold mb-2">⏱️ الوقت المتبقي</h3>
              <p className="text-muted-foreground">راقب الوقت وأدخل إجاباتك بعناية</p>
            </div>

            <div className={`
              text-6xl font-mono font-bold px-12 py-6 rounded-2xl
              ${timeRemaining <= 300
                ? 'bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400 animate-pulse'
                : 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 dark:from-green-950 dark:to-emerald-950 dark:text-green-300'
              }
            `} data-testid="text-timer">
              {formatTime(timeRemaining)}
            </div>

            {timeRemaining === 0 && (
              <div className="bg-red-50 dark:bg-red-950 p-4 rounded-lg flex items-center gap-2 max-w-md">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                <p className="text-sm text-red-800 dark:text-red-200">
                  انتهى الوقت! يمكنك الاستمرار في إدخال الإجابات أو تقديم الاختبار الآن.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 relative z-10">
        {questions.map((question: Question, index: number) => {
          const questionNum = index + 1;
          const isAnswered = userAnswers[questionNum] !== undefined;
          return (
            <Card
              key={question.id}
              className={`
                transition-all duration-300 hover:shadow-xl
                ${isAnswered
                  ? 'border-2 border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950'
                  : 'border-2 border-gray-200 hover:border-green-400'
                }
              `}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <div className={`
                      w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
                      ${isAnswered
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                        : 'bg-gradient-to-r from-green-600 to-emerald-500 text-white'
                      }
                    `}>
                      {questionNum}
                    </div>
                    <span className="text-sm font-semibold">السؤال</span>
                  </span>
                  {isAnswered && (
                    <CheckCircle2 className="w-5 h-5 text-green-600 animate-pulse" />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={userAnswers[questionNum] !== undefined ? userAnswers[questionNum].toString() : undefined}
                  onValueChange={(value) => handleAnswerChange(questionNum, value)}
                >
                  <div className="grid grid-cols-2 gap-2">
                    {['أ', 'ب', 'ج', 'د'].map((option, optionIndex) => (
                      <div
                        key={optionIndex}
                        className={`
                          flex items-center space-x-2 space-x-reverse p-2 rounded-lg transition-all
                          ${userAnswers[questionNum] === optionIndex
                            ? 'bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900 dark:to-emerald-900'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                          }
                        `}
                      >
                        <RadioGroupItem
                          value={optionIndex.toString()}
                          id={`q${question.id}-opt${optionIndex}`}
                          data-testid={`radio-q${question.id}-opt${optionIndex}`}
                          checked={userAnswers[questionNum] === optionIndex}
                          className="border-2"
                        />
                        <Label
                          htmlFor={`q${question.id}-opt${optionIndex}`}
                          className="cursor-pointer font-semibold text-base"
                        >
                          {option}
                        </Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="relative z-10 border-2 border-gradient-to-r from-green-500 to-blue-500 shadow-xl">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex-1">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 p-6 rounded-lg border-2 border-green-200 dark:border-green-800">
                <div className="flex items-center gap-4 mb-4">
                  <div className="bg-gradient-to-r from-green-600 to-emerald-500 text-white w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl">
                    {answeredCount}
                  </div>
                  <div>
                    <p className="text-lg font-bold text-green-900 dark:text-green-100">
                      تم الإجابة على {answeredCount} من {exam.totalQuestions} سؤال
                    </p>
                    <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                      الأسئلة المتبقية: {exam.totalQuestions - answeredCount}
                    </p>
                  </div>
                </div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-500"
                    style={{ width: `${(answeredCount / exam.totalQuestions) * 100}%` }}
                  />
                </div>
              </div>
              <div className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
                جميع الحقوق محفوظة © {new Date().getFullYear()} - منصة قدراتك
              </div>
            </div>
            <Button
              onClick={handleSubmit}
              disabled={submitAnswersMutation.isPending || answeredCount === 0}
              size="lg"
              data-testid="button-submit-answers"
              className="bg-gradient-to-r from-green-700 to-emerald-600 hover:from-green-800 hover:to-emerald-700 text-white text-xl px-8 py-6 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
            >
              {submitAnswersMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                  جاري التصحيح...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-6 h-6" />
                  تقديم الإجابات
                </span>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}