import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
import { 
  TrophyIcon, 
  LightbulbIcon, 
  ArrowRightCircleIcon,
  ClockIcon,
  HeartIcon,
  StarIcon,
  LockIcon,
  TrendingUpIcon,
  Users2Icon,
  BookOpenIcon
} from "lucide-react";
import { AchievementsDisplay } from "@/components/AchievementsDisplay";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

// تعريف بيانات مستويات التحديات
const challengeLevels = [
  {
    id: 1,
    name: "المبتدئ: التعرف على الكلمات",
    description: "اختبر معلوماتك الأساسية في المفردات العربية",
    points: 50,
    timeLimit: 3,
    questionsCount: 5,
    difficulty: "beginner",
    category: "verbal",
    icon: <LightbulbIcon className="w-10 h-10 text-primary" />,
    color: "border-primary/20 bg-primary/5",
    enabled: true,
    nextLevel: 2,
  },
  {
    id: 2,
    name: "التحدي الأول: المعاني",
    description: "اختبر فهمك للمعاني المختلفة للكلمات",
    points: 100,
    timeLimit: 5,
    questionsCount: 10,
    difficulty: "beginner",
    category: "verbal",
    icon: <BookOpenIcon className="w-10 h-10 text-indigo-500" />,
    color: "border-indigo-300 bg-indigo-50 dark:border-indigo-800 dark:bg-indigo-950/30",
    enabled: false,
    nextLevel: 3,
    requiredPoints: 50
  },
  {
    id: 3,
    name: "المتقدم: التراكيب اللغوية",
    description: "تحدي في فهم تراكيب اللغة العربية",
    points: 150,
    timeLimit: 8,
    questionsCount: 12,
    difficulty: "intermediate",
    category: "verbal",
    icon: <TrophyIcon className="w-10 h-10 text-blue-500" />,
    color: "border-blue-300 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30",
    enabled: false,
    nextLevel: 4,
    requiredPoints: 150
  },
  {
    id: 4,
    name: "تحدي الأمثال والحكم",
    description: "اختبر معرفتك بالأمثال والحكم العربية",
    points: 200,
    timeLimit: 10,
    questionsCount: 15,
    difficulty: "intermediate",
    category: "verbal",
    icon: <StarIcon className="w-10 h-10 text-emerald-500" />,
    color: "border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30",
    enabled: false,
    nextLevel: 5,
    requiredPoints: 300
  },
  {
    id: 5,
    name: "تحدي الأرقام: المستوى الأول",
    description: "اختبر مهاراتك في الأسئلة الكمية البسيطة",
    points: 250,
    timeLimit: 8,
    questionsCount: 10,
    difficulty: "beginner",
    category: "quantitative",
    icon: <TrendingUpIcon className="w-10 h-10 text-green-500" />,
    color: "border-green-300 bg-green-50 dark:border-green-800 dark:bg-green-950/30",
    enabled: false,
    nextLevel: 6,
    requiredPoints: 500
  },
  {
    id: 6,
    name: "تحدي الأرقام: المستوى المتقدم",
    description: "أسئلة كمية متقدمة تحتاج تفكير دقيق",
    points: 350,
    timeLimit: 12,
    questionsCount: 15,
    difficulty: "intermediate",
    category: "quantitative",
    icon: <ClockIcon className="w-10 h-10 text-cyan-500" />,
    color: "border-cyan-300 bg-cyan-50 dark:border-cyan-800 dark:bg-cyan-950/30",
    enabled: false,
    nextLevel: 7,
    requiredPoints: 750
  },
  {
    id: 7,
    name: "تحدي المزج: اللفظي والكمي",
    description: "اختبار متنوع يجمع بين الأسئلة اللفظية والكمية",
    points: 500,
    timeLimit: 15,
    questionsCount: 20,
    difficulty: "intermediate",
    category: "mixed",
    icon: <HeartIcon className="w-10 h-10 text-purple-500" />,
    color: "border-purple-300 bg-purple-50 dark:border-purple-800 dark:bg-purple-950/30",
    enabled: false,
    nextLevel: 8,
    requiredPoints: 1100
  },
  {
    id: 8,
    name: "تحدي الخبراء: مفردات متقدمة",
    description: "مفردات عربية متقدمة ونادرة الاستخدام",
    points: 650,
    timeLimit: 20,
    questionsCount: 20,
    difficulty: "advanced",
    category: "verbal",
    icon: <Users2Icon className="w-10 h-10 text-yellow-500" />,
    color: "border-yellow-300 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/30",
    enabled: false,
    nextLevel: 9,
    requiredPoints: 1600
  },
  {
    id: 9,
    name: "تحدي الخبراء: المسائل الرياضية",
    description: "مسائل رياضية متقدمة تتطلب مهارات عالية",
    points: 800,
    timeLimit: 25,
    questionsCount: 15,
    difficulty: "advanced",
    category: "quantitative",
    icon: <TrophyIcon className="w-10 h-10 text-orange-500" />,
    color: "border-orange-300 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/30",
    enabled: false,
    nextLevel: 10,
    requiredPoints: 2250
  },
  {
    id: 10,
    name: "تحدي السرعة: اختبار الوقت",
    description: "أجب على أكبر عدد من الأسئلة في وقت محدود",
    points: 1000,
    timeLimit: 5,
    questionsCount: 30,
    difficulty: "intermediate",
    category: "mixed",
    icon: <ClockIcon className="w-10 h-10 text-red-500" />,
    color: "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/30",
    enabled: false,
    nextLevel: 11,
    requiredPoints: 3050
  },
  {
    id: 11,
    name: "التحدي النهائي: شامل",
    description: "اختبار شامل لجميع المهارات والمستويات",
    points: 1500,
    timeLimit: 30,
    questionsCount: 50,
    difficulty: "advanced",
    category: "mixed",
    icon: <HeartIcon className="w-10 h-10 text-pink-500" />,
    color: "border-pink-300 bg-pink-50 dark:border-pink-800 dark:bg-pink-950/30",
    enabled: false,
    nextLevel: 12,
    requiredPoints: 4050
  },
  {
    id: 12,
    name: "تحدي الأبطال",
    description: "نافس أفضل المتسابقين في تحدي مباشر",
    points: 2000,
    timeLimit: 40,
    questionsCount: 60,
    difficulty: "advanced",
    category: "mixed",
    icon: <Users2Icon className="w-10 h-10 text-indigo-500" />,
    color: "border-indigo-300 bg-indigo-50 dark:border-indigo-800 dark:bg-indigo-950/30",
    enabled: false,
    nextLevel: 13,
    requiredPoints: 5550
  },
  {
    id: 13,
    name: "تحدي الأساتذة",
    description: "المستوى الأخير والأصعب للمتفوقين",
    points: 3000,
    timeLimit: 60,
    questionsCount: 100,
    difficulty: "advanced",
    category: "mixed",
    icon: <TrophyIcon className="w-10 h-10 text-amber-500" />,
    color: "border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30",
    enabled: false,
    requiredPoints: 7550
  }
];

const ChallengePage = () => {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [isBoostingPoints, setIsBoostingPoints] = useState(false);

  // طلب جلب بيانات المستخدم
  const { data: user } = useQuery({
    queryKey: ["/api/user"],
    queryFn: async () => {
      try {
        // استخدام المستخدم المخزن في localStorage للتجربة
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          return JSON.parse(storedUser);
        }

        // إذا لم يكن هناك مستخدم، قم بإنشاء مستخدم افتراضي
        return {
          id: 1,
          username: "مستخدم",
          points: 50,
          level: 1
        };
      } catch (error) {
        console.error("Error fetching user:", error);
        return null;
      }
    }
  });

  // طلب جلب نتائج الاختبارات السابقة
  const { data: testResults = [] } = useQuery({
    queryKey: ["/api/test-results/user", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      try {
        const response = await fetch(`/api/test-results/user/${user.id}`);
        return await response.json();
      } catch (error) {
        console.error("Error fetching test results:", error);
        return [];
      }
    },
    enabled: !!user?.id
  });

  // التحقق من المستويات المفتوحة بناءً على نتائج الاختبارات السابقة
  const getEnabledLevels = () => {
    if (!user) return challengeLevels.map((level, idx) => ({
      ...level,
      enabled: idx === 0 // فقط المستوى الأول مفتوح للمستخدمين الغير مسجلين
    }));

    return challengeLevels.map((level, idx) => {
      // المستوى الأول مفتوح دائمًا
      if (idx === 0) return { ...level, enabled: true };

      // للمستويات الأخرى، نتحقق من اكتمال المستوى السابق بنجاح
      const previousLevelResults = testResults.filter(
        (result: any) => result.levelId === idx
      );

      const previousLevelCompleted = previousLevelResults.some(
        (result: any) => (result.score / result.totalQuestions) >= 1.0 // يتطلب 100% لفتح المستوى التالي
      );

      return { 
        ...level,
        enabled: previousLevelCompleted
      };
    });
  };

  const enabledLevels = getEnabledLevels();

  // بدء تحدي جديد
  const startChallenge = (levelId: number) => {
    const level = enabledLevels.find(l => l.id === levelId);

    if (!level || !level.enabled) {
      toast({
        title: "المستوى مغلق",
        description: "يجب إكمال المستوى السابق بنتيجة 100% لفتح هذا المستوى",
        variant: "destructive"
      });
      return;
    }

    // احفظ معلومات التحدي في localStorage
    localStorage.setItem('currentChallenge', JSON.stringify({
      levelId,
      category: level.category,
      difficulty: level.difficulty,
      questionsCount: level.questionsCount,
      timeLimit: level.timeLimit,
      points: level.points
    }));

    // انتقل إلى صفحة الاختبار
    navigate("/abilities");
  };

  // حساب النسبة المئوية للتقدم نحو المستوى التالي
  const calculateLevelProgress = () => {
    if (!user) return 0;

    // البحث عن المستوى التالي المغلق
    const nextLockedLevel = enabledLevels.find(level => !level.enabled);

    if (!nextLockedLevel || !nextLockedLevel.requiredPoints) return 100;

    // حساب نسبة التقدم
    const previousThreshold = nextLockedLevel.id > 3 ? 
      enabledLevels[nextLockedLevel.id - 2].requiredPoints || 0 : 0;

    const pointsNeeded = nextLockedLevel.requiredPoints - previousThreshold;
    const pointsGained = user.points - previousThreshold;

    if (pointsGained <= 0) return 0;
    if (pointsGained >= pointsNeeded) return 100;

    return Math.round((pointsGained / pointsNeeded) * 100);
  };

  // دالة لزيادة نقاط المستخدم بشكل سريع للتجربة
  const boostPoints = async () => {
    if (!user) return;

    setIsBoostingPoints(true);

    try {
      // قم بإضافة مسابقة وهمية بنقاط كبيرة
      const testResult = {
        userId: user.id,
        testType: "mixed",
        difficulty: "advanced",
        score: 18,
        totalQuestions: 20,
        pointsEarned: 500,
        timeTaken: 600, // 10 minutes
      };

      const response = await fetch('/api/test-results', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testResult),
      });

      if (response.ok) {
        const updatedUserResponse = await fetch(`/api/users/${user.id}/points`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ points: user.points + 500 }),
        });

        if (updatedUserResponse.ok) {
          // تحديث بيانات المستخدم في localStorage
          const updatedUser = { ...user, points: user.points + 500 };
          localStorage.setItem('user', JSON.stringify(updatedUser));

          toast({
            title: "تم إضافة النقاط",
            description: "تم إضافة 500 نقطة إلى رصيدك",
          });

          // إعادة تحميل الصفحة بعد ثانية واحدة
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        }
      }
    } catch (error) {
      console.error("Error boosting points:", error);
      toast({
        title: "حدث خطأ",
        description: "لم نتمكن من إضافة النقاط. حاول مرة أخرى.",
        variant: "destructive",
      });
    } finally {
      setIsBoostingPoints(false);
    }
  };

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-2 text-center">تحديات وألعاب قدراتك</h1>
      <p className="text-muted-foreground mb-8 text-center">
        اختبر نفسك في سلسلة من التحديات المتدرجة في الصعوبة واكسب النقاط
      </p>

      {user && (
        <Card className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-2 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex flex-col items-center sm:items-start">
                <h3 className="text-2xl font-bold mb-1">أهلاً {user.username}</h3>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-medium text-primary border-primary/30">
                    المستوى {user.level}
                  </Badge>
                  <Badge variant="outline" className="font-medium border-amber-500/50 text-amber-600 dark:text-amber-400">
                    <StarIcon className="w-3.5 h-3.5 me-1" />
                    {user.points} نقطة
                  </Badge>
                </div>
              </div>

              <div className="w-full sm:w-72">
                <p className="text-sm text-muted-foreground mb-1.5">
                  {calculateLevelProgress() === 100 ? 
                    "أنت جاهز للمستوى التالي!" : 
                    `${calculateLevelProgress()}% نحو المستوى التالي`}
                </p>
                <Progress value={calculateLevelProgress()} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {enabledLevels.map((level) => (
          <Card 
            key={level.id} 
            className={`relative overflow-hidden border-2 transition-all duration-300 hover:shadow-lg ${
              level.enabled ? level.color : "bg-gray-100 border-gray-300 opacity-75"
            }`}
          >
            {!level.enabled && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 z-10">
                <LockIcon className="w-10 h-10 text-white mb-2" />
                <p className="text-white font-semibold text-center px-4 mb-1 text-lg">
                  مستوى مغلق
                </p>
                {level.requiredPoints && user && user.points < level.requiredPoints && (
                  <p className="text-white/90 text-center text-sm px-6">
                    تحتاج {level.requiredPoints - user.points} نقطة إضافية
                  </p>
                )}
                {level.requiredPoints && level.id > 2 && (
                  <p className="text-white/90 text-center text-sm px-6 mt-2">
                    اكسب المزيد من النقاط للوصول إلى {level.requiredPoints} نقطة
                  </p>
                )}
              </div>
            )}

            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{level.name}</CardTitle>
                  <CardDescription>{level.description}</CardDescription>
                </div>
                {level.icon}
              </div>
            </CardHeader>

            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">عدد الأسئلة:</span>
                  <span className="font-medium">{level.questionsCount} سؤال</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">الوقت:</span>
                  <span className="font-medium">{level.timeLimit} دقائق</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">المستوى:</span>
                  <span className="font-medium">
                    {level.difficulty === "beginner" ? "مبتدئ" : 
                     level.difficulty === "intermediate" ? "متوسط" : "متقدم"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">النوع:</span>
                  <span className="font-medium">
                    {level.category === "verbal" ? "لفظي" : 
                     level.category === "quantitative" ? "كمي" : "مختلط"}
                  </span>
                </div>
                <Separator />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">النقاط:</span>
                  <Badge variant="outline">
                    <StarIcon className="w-3.5 h-3.5 me-1 text-amber-500" />
                    <span className="font-bold">{level.points}</span>
                  </Badge>
                </div>
              </div>
            </CardContent>

            <CardFooter>
              <Button 
                className="w-full" 
                variant={level.enabled ? "default" : "outline"}
                disabled={!level.enabled}
                onClick={() => startChallenge(level.id)}
              >
                {level.enabled ? (
                  <>
                    ابدأ التحدي
                    <ArrowRightCircleIcon className="w-4 h-4 mr-2" />
                  </>
                ) : "مغلق"}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {testResults.length > 0 && (
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-4">التحديات السابقة</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b dark:border-gray-700">
                  <th className="py-3 px-4 text-right font-medium">التاريخ</th>
                  <th className="py-3 px-4 text-right font-medium">نوع الاختبار</th>
                  <th className="py-3 px-4 text-right font-medium">المستوى</th>
                  <th className="py-3 px-4 text-right font-medium">النتيجة</th>
                  <th className="py-3 px-4 text-right font-medium">النقاط المكتسبة</th>
                </tr>
              </thead>
              <tbody>
                {testResults
                  .filter((test: any) => test.testType !== "qiyas")
                  .sort((a: any, b: any) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
                  .slice(0, 10)
                  .map((result: any, index: number) => (
                    <tr key={index} className="border-b dark:border-gray-700 hover:bg-muted/50">
                      <td className="py-3 px-4">
                        {new Date(result.completedAt).toLocaleDateString("ar-SA")}
                      </td>
                      <td className="py-3 px-4">
                        {result.testType === "verbal" ? "لفظي" : 
                         result.testType === "quantitative" ? "كمي" : "مختلط"}
                      </td>
                      <td className="py-3 px-4">
                        {result.difficulty === "beginner" ? "مبتدئ" : 
                         result.difficulty === "intermediate" ? "متوسط" : "متقدم"}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={result.score / result.totalQuestions >= 0.7 ? "default" : "destructive"}>
                          {result.score}/{result.totalQuestions}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium flex items-center">
                          <StarIcon className="w-3.5 h-3.5 me-1 text-amber-500" />
                          {result.pointsEarned}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* قسم الإنجازات */}
      <Card className="mt-12">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">إنجازاتك</CardTitle>
          <CardDescription>
            أكمل التحديات والمستويات لفتح المزيد من الإنجازات وزيادة نقاطك
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AchievementsDisplay userId={user?.id} />
        </CardContent>
      </Card>

      {/* زر تعزيز النقاط للتجربة */}
      <div className="flex justify-center mt-10">
        <Button
          onClick={boostPoints}
          disabled={isBoostingPoints}
          variant="outline"
          className="w-64 py-6 bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-300 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-400"
        >
          {isBoostingPoints ? (
            <>
              <Spinner size="sm" className="mr-2" />
              جاري تعزيز النقاط...
            </>
          ) : (
            <>
              <StarIcon className="mr-2 h-5 w-5" />
              <span className="text-lg">تعزيز النقاط (+500)</span>
            </>
          )}
        </Button>
      </div>
      <p className="text-center text-muted-foreground text-sm mt-2">
        اضغط هنا لإضافة 500 نقطة لفتح المزيد من المستويات (للتجربة)
      </p>
    </div>
  );
};

export default ChallengePage;