import { Card, CardContent } from "@/components/ui/card";
import { Trophy, TrendingUp, TrendingDown, Minus, Award, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { useUser } from "@/hooks/use-user";
import { useEffect } from "react";
import { queryClient } from "@/lib/queryClient";

interface PointsAndRankingCardProps {
  pointsEarned: number;
  className?: string;
}

export function PointsAndRankingCard({ pointsEarned, className }: PointsAndRankingCardProps) {
  const { user } = useUser();

  // جلب ترتيب المستخدم الحالي
  const { data: rankData } = useQuery<{
    currentRank: number;
    totalPoints: number;
    previousRank?: number;
  }>({
    queryKey: [`/api/users/${user?.id}/rank`],
    enabled: !!user?.id,
  });

  // 🔥 الاستماع لحدث تحديث النقاط وإبطال الكاش
  useEffect(() => {
    const handlePointsUpdate = () => {
      console.log('🔄 تحديث بيانات النقاط والترتيب...');
      // إبطال كاش الترتيب لتحديث البيانات
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}/rank`] });
      // تحديث بعد 500ms للتأكد من أن البيانات محدثة على السيرفر
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}/rank`] });
      }, 500);
    };
    
    window.addEventListener('pointsUpdated', handlePointsUpdate);
    return () => window.removeEventListener('pointsUpdated', handlePointsUpdate);
  }, [user?.id]);

  const currentRank = rankData?.currentRank || 0;
  const totalPoints = rankData?.totalPoints || 0;
  const previousRank = rankData?.previousRank;

  // حساب التغيير في الترتيب
  const rankChange = previousRank && currentRank ? previousRank - currentRank : 0;
  const rankChangeIcon = rankChange > 0 ? <TrendingUp className="h-4 w-4" /> : 
                         rankChange < 0 ? <TrendingDown className="h-4 w-4" /> : 
                         <Minus className="h-4 w-4" />;
  const rankChangeColor = rankChange > 0 ? "text-green-600 dark:text-green-400" : 
                         rankChange < 0 ? "text-red-600 dark:text-red-400" : 
                         "text-gray-600 dark:text-gray-400";

  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-6", className)}>
      {/* بطاقة النقاط المكتسبة */}
      <Card className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-teal-50 dark:from-blue-950/30 dark:to-teal-950/30 border-2 border-blue-200 dark:border-blue-800 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400/10 dark:bg-blue-600/10 rounded-bl-full"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-teal-400/10 dark:bg-teal-600/10 rounded-tr-full"></div>
        
        <CardContent className="p-8 relative z-10">
          <div className="flex items-center gap-4 mb-6">
            <div className={cn(
              "w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg",
              pointsEarned >= 0 
                ? "bg-gradient-to-br from-green-400 to-emerald-500" 
                : "bg-gradient-to-br from-red-400 to-rose-500"
            )}>
              <Award className="h-8 w-8 text-white drop-shadow-md" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">النقاط المكتسبة</p>
              <h3 className={cn(
                "text-4xl font-bold",
                pointsEarned >= 0 
                  ? "text-green-600 dark:text-green-400" 
                  : "text-red-600 dark:text-red-400"
              )}>
                {pointsEarned >= 0 ? `+${pointsEarned}` : pointsEarned}
              </h3>
            </div>
          </div>
          <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-blue-100 dark:border-blue-900">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">إجمالي نقاطك</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{totalPoints}</p>
          </div>
        </CardContent>
      </Card>

      {/* بطاقة الترتيب */}
      <Card className="relative overflow-hidden bg-gradient-to-br from-green-50 to-amber-50 dark:from-green-950/30 dark:to-amber-950/30 border-2 border-green-200 dark:border-green-800 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
        <div className="absolute top-0 right-0 w-32 h-32 bg-green-400/10 dark:bg-green-600/10 rounded-bl-full"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-amber-400/10 dark:bg-amber-600/10 rounded-tr-full"></div>
        
        <CardContent className="p-8 relative z-10">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-400 to-amber-500 flex items-center justify-center shadow-lg">
              <Trophy className="h-8 w-8 text-white drop-shadow-md" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">ترتيبك الحالي</p>
              <div className="flex items-center gap-3">
                <h3 className="text-4xl font-bold text-green-600 dark:text-green-400">
                  #{currentRank > 0 ? currentRank.toLocaleString('ar-SA') : '—'}
                </h3>
                {rankChange !== 0 && (
                  <div className={cn("flex items-center gap-1 text-sm font-bold", rankChangeColor)}>
                    {rankChangeIcon}
                    <span>{Math.abs(rankChange)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-green-100 dark:border-green-900">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 flex items-center gap-2">
              <Target className="h-3 w-3" />
              حالتك
            </p>
            <p className="text-sm font-bold text-green-600 dark:text-green-400">
              {rankChange > 0 && `🎉 تقدمت ${rankChange} مركز!`}
              {rankChange < 0 && `⚠️ تراجعت ${Math.abs(rankChange)} مركز`}
              {rankChange === 0 && currentRank > 0 && "⚪ ثابت في الترتيب"}
              {currentRank === 0 && "🚀 ابدأ في حل الاختبارات لتحصل على ترتيب"}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
