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
  Users2Icon
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
    name: "المستوى الأول: المبتدئ",
    description: "اختبر معلوماتك الأساسية في اللغة العربية",
    points: 100,
    timeLimit: 5,
    questionsCount: 10,
    difficulty: "beginner",
    category: "verbal",
    icon: <LightbulbIcon className="w-10 h-10 text-yellow-500" />,
    color: "bg-yellow-100 border-yellow-300",
    enabled: true,
    nextLevel: 2,
  },
  {
    id: 2,
    name: "المستوى الثاني: المتقدم",
    description: "تحدي أكبر وأسئلة أكثر تعقيدًا",
    points: 250,
    timeLimit: 8,
    questionsCount: 15,
    difficulty: "intermediate",
    category: "verbal",
    icon: <TrophyIcon className="w-10 h-10 text-blue-500" />,
    color: "bg-blue-100 border-blue-300",
    enabled: true,
    nextLevel: 3,
    requiredPoints: 100
  },
  {
    id: 3,
    name: "المستوى الثالث: الخبير",
    description: "اختبر قدراتك اللغوية المتقدمة",
    points: 500,
    timeLimit: 10,
    questionsCount: 20,
    difficulty: "advanced",
    category: "verbal",
    icon: <StarIcon className="w-10 h-10 text-purple-500" />,
    color: "bg-purple-100 border-purple-300",
    enabled: false,
    nextLevel: 4,
    requiredPoints: 350
  },
  {
    id: 4,
    name: "مستوى التفوق: الرياضيات",
    description: "اختبر مهاراتك في الأسئلة الكمية",
    points: 800,
    timeLimit: 15,
    questionsCount: 20,
    difficulty: "beginner",
    category: "quantitative",
    icon: <TrendingUpIcon className="w-10 h-10 text-green-500" />,
    color: "bg-green-100 border-green-300",
    enabled: false,
    nextLevel: 5,
    requiredPoints: 850
  },
  {
    id: 5,
    name: "تحدي السرعة",
    description: "أجب على أكبر عدد من الأسئلة في وقت محدود",
    points: 1000,
    timeLimit: 5,
    questionsCount: 30,
    difficulty: "intermediate",
    category: "mixed",
    icon: <ClockIcon className="w-10 h-10 text-red-500" />,
    color: "bg-red-100 border-red-300",
    enabled: false,
    nextLevel: 6,
    requiredPoints: 1650
  },
  {
    id: 6,
    name: "التحدي النهائي",
    description: "اختبار شامل لجميع المهارات",
    points: 2000,
    timeLimit: 30,
    questionsCount: 50,
    difficulty: "advanced",
    category: "mixed",
    icon: <HeartIcon className="w-10 h-10 text-pink-500" />,
    color: "bg-pink-100 border-pink-300",
    enabled: false,
    requiredPoints: 2650
  },
  {
    id: 7,
    name: "تحدي الأبطال",
    description: "نافس أفضل المتسابقين في تحدي مباشر",
    points: 5000,
    timeLimit: 20,
    questionsCount: 30,
    difficulty: "advanced",
    category: "mixed",
    icon: <Users2Icon className="w-10 h-10 text-indigo-500" />,
    color: "bg-indigo-100 border-indigo-300",
    enabled: false,
    requiredPoints: 4650
  },
  {
    id: 8,
    name: "تحدي الأساتذة",
    description: "المستوى الأخير والأصعب للمتفوقين",
    points: 10000,
    timeLimit: 45,
    questionsCount: 100,
    difficulty: "advanced",
    category: "mixed",
    icon: <TrophyIcon className="w-10 h-10 text-amber-500" />,
    color: "bg-amber-100 border-amber-300",
    enabled: false,
    requiredPoints: 9650
  }
];

const ChallengePage = () => {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  
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
  
  // التحقق من المستويات المفتوحة بناءً على نقاط المستخدم
  const getEnabledLevels = () => {
    if (!user) return challengeLevels.slice(0, 2); // إذا لم يكن هناك مستخدم، اعرض المستويين الأوليين فقط
    
    return challengeLevels.map(level => ({
      ...level,
      enabled: level.id === 1 || level.id === 2 || (level.requiredPoints && user.points >= level.requiredPoints)
    }));
  };
  
  const enabledLevels = getEnabledLevels();
  
  // بدء تحدي جديد
  const startChallenge = (levelId: number) => {
    const level = enabledLevels.find(l => l.id === levelId);
    
    if (!level || !level.enabled) {
      toast({
        title: "المستوى مغلق",
        description: "يجب عليك إكمال المستويات السابقة أولاً وجمع المزيد من النقاط",
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
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 z-10">
                <LockIcon className="w-10 h-10 text-white mb-2" />
                <p className="text-white font-medium text-center px-4">
                  مغلق - تحتاج {level.requiredPoints} نقطة لفتح هذا المستوى
                </p>
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
                  .filter(test => test.testType !== "qiyas")
                  .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
                  .slice(0, 10)
                  .map((result, index) => (
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
                        <Badge variant={result.score / result.totalQuestions >= 0.7 ? "success" : "destructive"}>
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
    </div>
  );
};

export default ChallengePage;