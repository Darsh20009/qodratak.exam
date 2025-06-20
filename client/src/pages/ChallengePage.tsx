import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
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
  BookOpenIcon,
  SparklesIcon,
  FilterIcon
} from "lucide-react";
import { motion } from "framer-motion";
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
    // ... (نفس بيانات المستويات الموجودة في ملفك الأصلي)
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
    color: "border-primary/20 bg-primary/5 hover:border-primary/40",
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
    color: "border-indigo-300 bg-indigo-50 dark:border-indigo-800 dark:bg-indigo-950/30 hover:border-indigo-400",
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
    color: "border-blue-300 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30 hover:border-blue-400",
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
    color: "border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30 hover:border-emerald-400",
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
    color: "border-green-300 bg-green-50 dark:border-green-800 dark:bg-green-950/30 hover:border-green-400",
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
    color: "border-cyan-300 bg-cyan-50 dark:border-cyan-800 dark:bg-cyan-950/30 hover:border-cyan-400",
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
    color: "border-purple-300 bg-purple-50 dark:border-purple-800 dark:bg-purple-950/30 hover:border-purple-400",
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
    color: "border-yellow-300 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/30 hover:border-yellow-400",
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
    color: "border-orange-300 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/30 hover:border-orange-400",
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
    color: "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/30 hover:border-red-400",
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
    color: "border-pink-300 bg-pink-50 dark:border-pink-800 dark:bg-pink-950/30 hover:border-pink-400",
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
    color: "border-indigo-300 bg-indigo-50 dark:border-indigo-800 dark:bg-indigo-950/30 hover:border-indigo-400",
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
    color: "border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 hover:border-amber-400",
    enabled: false,
    requiredPoints: 7550
  }
];

const categoryMap = {
  verbal: { label: "لفظي", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
  quantitative: { label: "كمي", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
  mixed: { label: "مختلط", color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200" },
};

const difficultyMap = {
  beginner: { label: "مبتدئ", color: "text-teal-500" },
  intermediate: { label: "متوسط", color: "text-sky-500" },
  advanced: { label: "متقدم", color: "text-red-500" },
};

const ChallengePage = () => {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [filter, setFilter] = useState<"all" | "verbal" | "quantitative" | "mixed">("all");

  // ... (نفس الكود الخاص بـ useQuery لجلب بيانات المستخدم ونتائج الاختبارات)
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

  const getEnabledLevels = useMemo(() => {
    if (!user) {
      return challengeLevels.map((level, idx) => ({
        ...level,
        enabled: idx === 0,
      }));
    }

    const completedLevels = new Set(
      testResults
        .filter((result: any) => (result.score / result.totalQuestions) >= 1.0)
        .map((result: any) => result.levelId)
    );

    return challengeLevels.map(level => ({
      ...level,
      enabled: level.id === 1 || completedLevels.has(level.id - 1)
    }));
  }, [user, testResults]);

  const filteredLevels = useMemo(() => {
    if (filter === "all") return getEnabledLevels;
    return getEnabledLevels.filter(level => level.category === filter);
  }, [filter, getEnabledLevels]);

  const startChallenge = (levelId: number) => {
    const level = getEnabledLevels.find(l => l.id === levelId);

    if (!level || !level.enabled) {
      toast({
        title: "المستوى مغلق",
        description: `يجب إكمال تحدي "${challengeLevels[levelId - 2]?.name}" بنتيجة 100% أولاً.`,
        variant: "destructive",
      });
      return;
    }

    localStorage.setItem('currentChallenge', JSON.stringify(level));
    navigate("/abilities");
  };

  const calculateLevelProgress = () => {
     if (!user) return 0;
    const nextLockedLevel = getEnabledLevels.find(level => !level.enabled);
    if (!nextLockedLevel || !nextLockedLevel.requiredPoints) return 100;
    const requiredPointsForNextLevel = nextLockedLevel.requiredPoints;
    const basePoints = challengeLevels.find(l => l.id === nextLockedLevel.id - 1)?.requiredPoints || 0;
    const progress = ((user.points - basePoints) / (requiredPointsForNextLevel - basePoints)) * 100;
    return Math.max(0, Math.min(100, progress));
  };

    // دالة لزيادة نقاط المستخدم بشكل سريع للتجربة
  const boostPoints = async () => {
      //... نفس الكود السابق
  };

  return (
    <div className="relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 -z-10 h-full w-full bg-white bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:6rem_4rem]">
            <div className="absolute bottom-0 left-0 right-0 top-0 bg-[radial-gradient(circle_500px_at_50%_200px,#C9D6FF,#E2E2E2)] opacity-40"></div>
        </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="container py-10"
      >
        <div className="text-center mb-8">
            <Badge variant="outline" className="mb-4 py-2 px-4 border-primary/30 text-primary font-semibold">
                <SparklesIcon className="w-4 h-4 mr-2" />
                مركز التحديات
            </Badge>
            <h1 className="text-4xl md:text-5xl font-extrabold mb-3 text-gray-900 dark:text-gray-100">طور قدراتك وتحدى نفسك</h1>
            <p className="text-lg text-muted-foreground mx-auto max-w-2xl">
                انطلق في رحلة من التحديات المتنوعة، اكسب النقاط، افتح مستويات جديدة، وأثبت جدارتك.
            </p>
        </div>

        {user && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2, duration: 0.5 }}>
            <Card className="mb-10 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-950 border-2 shadow-lg">
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                  <div className="flex items-center gap-4">
                    <img src={`https://api.dicebear.com/8.x/bottts/svg?seed=${user.username}`} alt="avatar" className="w-16 h-16 rounded-full border-2 border-primary p-1"/>
                    <div>
                      <h3 className="text-2xl font-bold">مرحباً بعودتك، {user.username}!</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className="font-medium bg-blue-100 text-blue-800 hover:bg-blue-200">
                          المستوى {user.level}
                        </Badge>
                        <Badge className="font-medium bg-amber-100 text-amber-800 hover:bg-amber-200">
                          <StarIcon className="w-3.5 h-3.5 me-1.5" />
                          {user.points.toLocaleString()} نقطة
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="w-full md:w-80">
                    <div className="flex justify-between items-center mb-1.5">
                       <p className="text-sm font-medium text-muted-foreground">التقدم للمستوى التالي</p>
                       <p className="text-sm font-bold text-primary">{Math.round(calculateLevelProgress())}%</p>
                    </div>
                    <Progress value={calculateLevelProgress()} className="h-2.5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Filter Buttons */}
        <div className="flex justify-center items-center gap-2 mb-8">
            <Button variant={filter === 'all' ? 'default' : 'outline'} onClick={() => setFilter('all')}>الكل</Button>
            <Button variant={filter === 'verbal' ? 'default' : 'outline'} onClick={() => setFilter('verbal')}>لفظي</Button>
            <Button variant={filter === 'quantitative' ? 'default' : 'outline'} onClick={() => setFilter('quantitative')}>كمي</Button>
            <Button variant={filter === 'mixed' ? 'default' : 'outline'} onClick={() => setFilter('mixed')}>مختلط</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLevels.map((level, index) => (
            <motion.div
                key={level.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
            >
              <Card
                className={`flex flex-col h-full overflow-hidden border-2 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                  level.enabled ? level.color : "bg-gray-100 dark:bg-gray-800/50 border-gray-300 dark:border-gray-700 opacity-80"
                }`}
              >
                {!level.enabled && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm z-10 p-4">
                    <LockIcon className="w-12 h-12 text-white/80 mb-3" />
                    <p className="text-white font-bold text-center text-xl mb-2">مغلق</p>
                    {level.requiredPoints && user && user.points < level.requiredPoints ? (
                      <Badge variant="destructive">
                        تحتاج إلى {level.requiredPoints - user.points} نقطة لفتحه
                      </Badge>
                    ) : (
                        <p className="text-white/90 text-center text-sm">
                            أكمل التحديات السابقة أولاً
                        </p>
                    )}
                  </div>
                )}

                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div className="flex-1">
                            <Badge className={`mb-2 ${categoryMap[level.category as keyof typeof categoryMap].color}`}>{categoryMap[level.category as keyof typeof categoryMap].label}</Badge>
                            <CardTitle className="text-xl leading-tight">{level.name}</CardTitle>
                        </div>
                        <div className="p-3 rounded-full bg-white/50 dark:bg-gray-900/50">{level.icon}</div>
                    </div>
                    <CardDescription className="pt-2">{level.description}</CardDescription>
                </CardHeader>

                <CardContent className="flex-grow">
                  <Separator className="my-4"/>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between"><span>الصعوبة:</span> <span className={`font-semibold ${difficultyMap[level.difficulty as keyof typeof difficultyMap].color}`}>{difficultyMap[level.difficulty as keyof typeof difficultyMap].label}</span></div>
                    <div className="flex justify-between"><span>الأسئلة:</span> <span className="font-semibold">{level.questionsCount} سؤال</span></div>
                    <div className="flex justify-between"><span>الوقت المقدر:</span> <span className="font-semibold">{level.timeLimit} دقائق</span></div>
                    <div className="flex justify-between items-center"><span>النقاط المكتسبة:</span>
                        <Badge variant="secondary" className="text-base">
                            <StarIcon className="w-4 h-4 me-1.5 text-amber-400" />
                            <span className="font-bold">{level.points}</span>
                        </Badge>
                    </div>
                  </div>
                </CardContent>

                <CardFooter>
                  <Button
                    className="w-full text-lg py-6 group"
                    size="lg"
                    disabled={!level.enabled}
                    onClick={() => startChallenge(level.id)}
                  >
                    {level.enabled ? 'ابدأ التحدي' : 'مغلق'}
                    {level.enabled && <ArrowRightCircleIcon className="w-5 h-5 mr-2 transition-transform duration-300 group-hover:translate-x-1" />}
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* ... (باقي الكود الخاص بعرض النتائج السابقة والإنجازات وزر تعزيز النقاط يبقى كما هو) */}
         {testResults.length > 0 && (
            <div className="mt-16">
            <h2 className="text-3xl font-bold mb-6 text-center">سجل التحديات</h2>
            <Card className="shadow-lg">
                <div className="overflow-x-auto">
                    <table className="w-full">
                    <thead>
                        <tr className="border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                        <th className="py-3 px-4 text-right font-semibold">التاريخ</th>
                        <th className="py-3 px-4 text-right font-semibold">نوع الاختبار</th>
                        <th className="py-3 px-4 text-right font-semibold">المستوى</th>
                        <th className="py-3 px-4 text-right font-semibold">النتيجة</th>
                        <th className="py-3 px-4 text-right font-semibold">النقاط</th>
                        </tr>
                    </thead>
                    <tbody>
                        {testResults
                        .filter((test: any) => test.testType !== "qiyas")
                        .sort((a: any, b: any) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
                        .slice(0, 5) // عرض آخر 5 تحديات فقط
                        .map((result: any, index: number) => (
                            <tr key={index} className="border-b dark:border-gray-800 hover:bg-muted/50 transition-colors">
                            <td className="py-4 px-4">{new Date(result.completedAt).toLocaleDateString("ar-SA", { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                            <td className="py-4 px-4"><Badge className={`${categoryMap[result.testType as keyof typeof categoryMap].color}`}>{categoryMap[result.testType as keyof typeof categoryMap].label}</Badge></td>
                            <td className="py-4 px-4"><span className={`font-medium ${difficultyMap[result.difficulty as keyof typeof difficultyMap].color}`}>{difficultyMap[result.difficulty as keyof typeof difficultyMap].label}</span></td>
                            <td className="py-4 px-4">
                                <Badge variant={result.score / result.totalQuestions >= 0.7 ? "default" : "destructive"}>
                                {result.score}/{result.totalQuestions}
                                </Badge>
                            </td>
                            <td className="py-4 px-4">
                                <span className="font-bold flex items-center text-green-600 dark:text-green-400">
                                +{result.pointsEarned}
                                <StarIcon className="w-3.5 h-3.5 ms-1 text-amber-500" />
                                </span>
                            </td>
                            </tr>
                        ))}
                    </tbody>
                    </table>
                </div>
            </Card>
            </div>
        )}

        {/* قسم الإنجازات */}
        <div className="mt-16">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
                <Card className="shadow-lg">
                    <CardHeader>
                    <CardTitle className="text-3xl font-bold text-center">قاعة الإنجازات</CardTitle>
                    <CardDescription className="text-center">
                        أكمل التحديات والمستويات لفتح المزيد من الإنجازات وزيادة نقاطك.
                    </CardDescription>
                    </CardHeader>
                    <CardContent>
                    <AchievementsDisplay userId={user?.id} />
                    </CardContent>
                </Card>
            </motion.div>
        </div>

        {/* زر تعزيز النقاط للتجربة */}
        <div className="text-center mt-16">
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 100, delay: 0.8 }}>
                <Button
                onClick={()=>{}}
                variant="outline"
                className="group w-auto h-auto px-6 py-4 rounded-xl transition-all duration-300 bg-gradient-to-br from-amber-100 to-yellow-200 hover:shadow-lg hover:from-amber-200 hover:to-yellow-300 text-amber-900 border-amber-300 dark:from-amber-950/50 dark:to-yellow-950/50 dark:border-amber-800 dark:text-amber-300"
                >
                <div className="flex items-center">
                    <SparklesIcon className="w-8 h-8 mr-3 text-amber-500 transition-transform duration-500 group-hover:rotate-180" />
                    <div>
                        <span className="block text-lg font-bold">ต้องการคะแนนเพิ่ม?</span>
                        <span className="block text-sm">اضغط هنا لإضافة 500 نقطة (للتجربة)</span>
                    </div>
                </div>
                </Button>
            </motion.div>
        </div>

      </motion.div>
    </div>
  );
};

export default ChallengePage;