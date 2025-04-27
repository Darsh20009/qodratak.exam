import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  BookOpenIcon, 
  TrophyIcon, 
  StarIcon, 
  LightbulbIcon, 
  GraduationCapIcon,
  BrainIcon,
  ZapIcon,
  TrendingUpIcon,
  BookmarkIcon
} from "lucide-react";
import { AchievementBadge } from "./ui/achievement-badge";
import { Button } from "./ui/button";

// تعريف أنواع الإنجازات
interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: JSX.Element;
  category: "test" | "level" | "streak" | "collection";
  requiredPoints: number;
  unlocked: boolean;
}

export function AchievementsDisplay({ userId = 1 }: { userId?: number }) {
  const [activeCategory, setActiveCategory] = useState<string>("all");

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
        
        // قم بطلب معلومات المستخدم من السيرفر
        const response = await fetch('/api/user');
        if (!response.ok) {
          throw new Error('Failed to fetch user data');
        }
        
        return await response.json();
      } catch (error) {
        console.error("Error fetching user:", error);
        return {
          id: 1,
          username: "مستخدم",
          points: 50,
          level: 1
        };
      }
    }
  });

  // قائمة الإنجازات
  const achievements: Achievement[] = [
    {
      id: "beginner",
      name: "المبتدئ",
      description: "أكمل الاختبار الأول",
      icon: <LightbulbIcon className="h-6 w-6" />,
      category: "test",
      requiredPoints: 0,
      unlocked: true,
    },
    {
      id: "intermediate",
      name: "المتمكن",
      description: "أكمل 5 اختبارات",
      icon: <BookOpenIcon className="h-6 w-6" />,
      category: "test",
      requiredPoints: 100,
      unlocked: user?.points >= 100,
    },
    {
      id: "advanced",
      name: "المتقدم",
      description: "أكمل 10 اختبارات",
      icon: <TrendingUpIcon className="h-6 w-6" />,
      category: "test",
      requiredPoints: 250,
      unlocked: user?.points >= 250,
    },
    {
      id: "master",
      name: "الخبير",
      description: "أكمل 20 اختبارًا بنتيجة 80% أو أعلى",
      icon: <TrophyIcon className="h-6 w-6" />,
      category: "test",
      requiredPoints: 500,
      unlocked: user?.points >= 500,
    },
    {
      id: "champion",
      name: "البطل",
      description: "أكمل جميع مستويات التحدي",
      icon: <StarIcon className="h-6 w-6" />,
      category: "level",
      requiredPoints: 1000,
      unlocked: user?.points >= 1000,
    },
    {
      id: "scholar",
      name: "العالم",
      description: "اجتز اختبار قياس بدرجة 90% أو أعلى",
      icon: <GraduationCapIcon className="h-6 w-6" />,
      category: "test",
      requiredPoints: 1500,
      unlocked: user?.points >= 1500,
    },
    {
      id: "collector",
      name: "الجامع",
      description: "احفظ 20 سؤالًا في المجلدات",
      icon: <BookmarkIcon className="h-6 w-6" />,
      category: "collection",
      requiredPoints: 300,
      unlocked: user?.points >= 300,
    },
    {
      id: "streaker",
      name: "المثابر",
      description: "أكمل 5 أيام متتالية من التعلم",
      icon: <ZapIcon className="h-6 w-6" />,
      category: "streak",
      requiredPoints: 200,
      unlocked: user?.points >= 200,
    },
    {
      id: "genius",
      name: "العبقري",
      description: "أكمل 50 سؤالًا بإجابة صحيحة متتالية",
      icon: <BrainIcon className="h-6 w-6" />,
      category: "test",
      requiredPoints: 2000,
      unlocked: user?.points >= 2000,
    },
  ];

  // تصفية الإنجازات حسب الفئة
  const filteredAchievements = achievements.filter(
    achievement => activeCategory === "all" || achievement.category === activeCategory
  );

  // حساب النسبة المئوية للإنجازات المكتملة
  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const percentage = Math.round((unlockedCount / achievements.length) * 100);

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center mb-6">
        <h3 className="text-lg font-medium mb-1">الإنجازات</h3>
        <div className="text-sm text-muted-foreground mb-2">
          {unlockedCount} من {achievements.length} ({percentage}%)
        </div>

        <div className="flex flex-wrap gap-2 justify-center">
          <Button 
            variant={activeCategory === "all" ? "default" : "outline"} 
            size="sm"
            onClick={() => setActiveCategory("all")}
          >
            الكل
          </Button>
          <Button 
            variant={activeCategory === "test" ? "default" : "outline"} 
            size="sm"
            onClick={() => setActiveCategory("test")}
          >
            الاختبارات
          </Button>
          <Button 
            variant={activeCategory === "level" ? "default" : "outline"} 
            size="sm"
            onClick={() => setActiveCategory("level")}
          >
            المستويات
          </Button>
          <Button 
            variant={activeCategory === "streak" ? "default" : "outline"} 
            size="sm"
            onClick={() => setActiveCategory("streak")}
          >
            المثابرة
          </Button>
          <Button 
            variant={activeCategory === "collection" ? "default" : "outline"} 
            size="sm"
            onClick={() => setActiveCategory("collection")}
          >
            المجموعات
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 gap-6 justify-items-center">
        {filteredAchievements.map((achievement) => (
          <div key={achievement.id} className="flex flex-col items-center text-center">
            <AchievementBadge
              name={achievement.name}
              description={achievement.description}
              icon={achievement.icon}
              variant={achievement.unlocked ? "success" : "locked"}
              locked={!achievement.unlocked}
              size="md"
              className="mb-2"
            />
            <span className="text-xs font-medium line-clamp-1">{achievement.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}