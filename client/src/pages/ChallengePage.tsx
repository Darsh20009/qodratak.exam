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
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Trophy as TrophyIcon,
  Star as StarIcon,
  BookOpen as BookOpenIcon,
  Brain as BrainIcon,
  Lock as LockIcon,
  Timer as TimerIcon,
  CheckCircle2 as CheckIcon
} from "lucide-react";
import { cn } from "@/lib/utils";

const challengeLevels = [
  {
    id: 1,
    name: "المستوى التمهيدي",
    description: "اختبار سهل يجمع بين القدرات اللفظية والكمية",
    questions: 5,
    timeLimit: 15, // minutes
    points: 100,
    type: "mixed",
    difficulty: "beginner",
    requiredScore: 0,
    icon: <StarIcon className="w-10 h-10 text-yellow-500" />,
    color: "border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/30"
  },
  {
    id: 2,
    name: "تحدي المفردات",
    description: "اختبار في القدرات اللفظية بمستوى متوسط",
    questions: 10,
    timeLimit: 20,
    points: 200,
    type: "verbal",
    difficulty: "intermediate",
    requiredScore: 80,
    icon: <BookOpenIcon className="w-10 h-10 text-blue-500" />,
    color: "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30"
  },
  {
    id: 3,
    name: "تحدي الأرقام",
    description: "اختبار في القدرات الكمية بمستوى متوسط",
    questions: 10,
    timeLimit: 25,
    points: 300,
    type: "quantitative",
    difficulty: "intermediate",
    requiredScore: 160,
    icon: <BrainIcon className="w-10 h-10 text-purple-500" />,
    color: "border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-950/30"
  },
  {
    id: 4,
    name: "التحدي المتقدم",
    description: "اختبار متقدم يجمع بين القدرات اللفظية والكمية",
    questions: 15,
    timeLimit: 30,
    points: 500,
    type: "mixed",
    difficulty: "advanced",
    requiredScore: 400,
    icon: <TrophyIcon className="w-10 h-10 text-emerald-500" />,
    color: "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30"
  }
];

const ChallengePage = () => {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [userScore, setUserScore] = useState(0);
  const [completedLevels, setCompletedLevels] = useState<number[]>([]);

  useEffect(() => {
    // Load user progress from localStorage
    const savedScore = localStorage.getItem('challengeScore');
    const savedLevels = localStorage.getItem('completedChallengeLevels');

    if (savedScore) setUserScore(parseInt(savedScore));
    if (savedLevels) setCompletedLevels(JSON.parse(savedLevels));
  }, []);

  const startChallenge = async (level: typeof challengeLevels[0]) => {
    if (userScore < level.requiredScore) {
      toast({
        title: "غير متاح",
        description: "يجب إكمال المستويات السابقة أولاً",
        variant: "destructive"
      });
      return;
    }

    try {
      // Fetch questions based on category and difficulty
      const category = level.type === 'mixed' ? '' : level.type;
      const response = await fetch(`/api/questions?category=${category}&difficulty=${level.difficulty}`);
      
      if (!response.ok) {
        throw new Error('فشل في تحميل الأسئلة');
      }

      const questions = await response.json();
      if (!questions || questions.length < level.questions) {
        toast({
          title: "خطأ",
          description: "لم يتم العثور على أسئلة كافية لهذا المستوى",
          variant: "destructive"
        });
        return;
      }

      // Navigate to the challenge with level parameters
      navigate(`/abilities-test?mode=challenge&level=${level.id}&type=${level.type}&difficulty=${level.difficulty}&questions=${level.questions}&time=${level.timeLimit}`);
      
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحميل الأسئلة",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="container py-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-3">تحديات القدرات</h1>
        <p className="text-muted-foreground text-lg">
          اختبر قدراتك وارتقِ في المستويات. كل تحدٍ يفتح لك الباب للمستوى التالي.
        </p>
      </div>

      <div className="mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold mb-2">تقدمك</h3>
                <p className="text-muted-foreground">
                  {completedLevels.length} من {challengeLevels.length} مستويات مكتملة
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-primary mb-1">{userScore}</div>
                <div className="text-sm text-muted-foreground">النقاط المكتسبة</div>
              </div>
            </div>
            <Progress 
              value={(completedLevels.length / challengeLevels.length) * 100} 
              className="mt-4"
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {challengeLevels.map((level) => {
          const isLocked = userScore < level.requiredScore;
          const isCompleted = completedLevels.includes(level.id);

          return (
            <Card 
              key={level.id}
              className={cn(
                "relative overflow-hidden transition-all",
                isLocked ? "opacity-75" : "hover:shadow-lg",
                level.color
              )}
            >
              <div className="absolute top-4 left-4">
                {isCompleted && (
                  <Badge variant="success" className="bg-green-500">
                    <CheckIcon className="w-4 h-4 mr-1" />
                    مكتمل
                  </Badge>
                )}
              </div>

              <CardHeader>
                <div className="mb-4">{level.icon}</div>
                <CardTitle className="text-xl flex items-center gap-2">
                  {level.name}
                  {isLocked && <LockIcon className="w-4 h-4 text-muted-foreground" />}
                </CardTitle>
                <CardDescription>{level.description}</CardDescription>
              </CardHeader>

              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">عدد الأسئلة:</span>
                    <span>{level.questions} أسئلة</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">الوقت:</span>
                    <span>{level.timeLimit} دقيقة</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">النقاط:</span>
                    <span>{level.points} نقطة</span>
                  </div>
                  {isLocked && (
                    <>
                      <Separator />
                      <div className="text-sm text-muted-foreground">
                        يتطلب {level.requiredScore} نقطة للفتح
                      </div>
                    </>
                  )}
                </div>
              </CardContent>

              <CardFooter>
                <Button 
                  className="w-full"
                  variant={isCompleted ? "outline" : "default"}
                  onClick={() => startChallenge(level)}
                  disabled={isLocked}
                >
                  {isCompleted ? "إعادة التحدي" : "ابدأ التحدي"}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default ChallengePage;